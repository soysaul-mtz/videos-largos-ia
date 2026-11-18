"""Arma un módulo a partir de su lista de tramos (modN.json).

Uso:  python3 armar.py modN.json [--solo-plan]

modN.json:
  salida     nombre del mp4 final (va a Downloads/CURSO/Editados/)
  piezas     [{src: "07", keep: [[a, b], ...], camara: true|false|null}]
             camara true = toda la pieza es la instructora a cámara (subtítulos + acercamientos)
             camara null = se decide cuadro a cuadro con t<src>/clase.json (grabaciones con cambio de toma)
  tapar      [{src, a, b, caja: [x, y, w, h]}]   desenfoque en coordenadas 1920x1080 del original
  sub_fix    {"palabra mal": "palabra bien"} para los subtítulos

Cada tramo se ajusta a las palabras (no corta sílabas). Dentro de un tramo, los silencios largos:
  1.0–4 s  → se recortan a una pausa de 0.4 s (corte seco, en pantalla no se nota)
  > 4 s    → avance rápido sin audio, dura como máximo 2.5 s (se ve lo que pasó en pantalla)
Todo se cuantiza a cuadros de 30 fps: audio y video se arman por separado y siempre cuadran.
"""
import sys, os, json, subprocess, tempfile, shutil
os.nice(15)                              # prioridad baja: Saúl usa la compu mientras se renderiza
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
FUENTES = os.environ.get("CURSO_FUENTES", os.path.join(AQUI, "fuentes"))   # carpeta con las grabaciones
SALIDAS = os.path.join(FUENTES, "Editados")
FF = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
FPS, SR = 30, 48000
PAUSA_MAX, PAUSA_DEJA, RAPIDO_DESDE, RAPIDO_MAX = 1.0, 0.4, float("inf"), 2.5   # sin avance rápido: Saúl no lo quiere
ZOOMS = [1.0]                            # sin acercamientos (Saúl los quitó)

spec_path = os.path.abspath(sys.argv[1]); SOLO_PLAN = "--solo-plan" in sys.argv
S = json.load(open(spec_path))
nombre = os.path.splitext(os.path.basename(spec_path))[0]
TMP = os.path.join(AQUI, "_render", nombre); os.makedirs(TMP, exist_ok=True)
ARCHIVOS = json.load(open(os.path.join(AQUI, "archivos.json")))   # llave → archivo dentro de FUENTES
INTRO, OUTRO = S.get("intro") or os.path.join(FUENTES, "intro.mp4"), S.get("outro") or os.path.join(FUENTES, "outro.mp4")   # opcionales
fuente = lambda s: os.path.join(FUENTES, ARCHIVOS[s])
q = lambda t: round(t * FPS) / FPS       # a cuadro


# ---------- audio y energía por fuente ----------
_aud = {}
def audio(src):
    """voz en mono (la instructora viene igual en los dos canales; en mono una fuente de 2 h ocupa la mitad de memoria)"""
    if src not in _aud:
        raw = subprocess.run([FF, "-v", "error", "-i", fuente(src), "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                             capture_output=True, check=True).stdout
        _aud[src] = np.frombuffer(raw, np.float32)
    return _aud[src]

_en = {}
def energia(src, h=0.02):
    if src not in _en:
        cache = os.path.join(AQUI, f"t{src}", "energia.npy")
        if os.path.exists(cache): e = np.load(cache)
        else:
            x = audio(src); n = int(SR * h); m = len(x) // n
            e = 20 * np.log10(np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1)) + 1e-9)
            np.save(cache, e)
        thr = np.percentile(e, 20) + 10
        if np.percentile(e, 20) < -60:      # grabación muy silenciosa: teclado y clics pasarían por voz → 15 dB bajo los picos
            thr = np.percentile(e, 95) - 15
        _en[src] = (e, thr, h)
    return _en[src]

def palabras(src):
    return json.load(open(os.path.join(AQUI, f"t{src}", "palabras.json")))

def clase(src):
    p = os.path.join(AQUI, f"t{src}", "clase.json")
    if not os.path.exists(p): return None
    c = json.load(open(p)); return np.array(c["azul"]) > 60, c["fps"]


# ---------- 1. tramos → segmentos ----------
def ajustar(src, a, b):
    """bordes del tramo pegados a la voz: no corta palabras y no se come colas de sílaba"""
    W = palabras(src); e, thr, h = energia(src)
    dentro = [w for w in W if w["a"] >= a - .3 and w["b"] <= b + .3 and w["a"] < b]
    if dentro:
        s, f = dentro[0]["a"] - .12, dentro[-1]["b"] + .18
        antes = [w["b"] for w in W if w["b"] <= dentro[0]["a"] and w is not dentro[0]]
        despues = [w["a"] for w in W if w["a"] >= dentro[-1]["b"] and w is not dentro[-1]]
        if antes: s = max(s, max(antes) + .04)
        if despues: f = min(f, min(despues) - .04)
    else:
        s, f = a, b
    # la energía manda sobre Whisper en los bordes: si al borde aún hay voz, se extiende un poco
    k = int(s / h)
    for _ in range(12):
        if k > 0 and e[k - 1] > thr and (not dentro or s > a - .5): s -= h; k -= 1
        else: break
    k = int(f / h)
    for _ in range(20):
        if k < len(e) and e[k] > thr: f += h; k += 1
        else: break
    # Whisper a veces pone la palabra antes de que suene (08: dice 18.0, la voz entra en 18.48): sin silencio muerto al arrancar ni al cerrar
    i0 = int(s / h); voz = np.flatnonzero(e[i0:int(f / h)] > thr)
    if len(voz):
        s, f = max(s, (i0 + voz[0]) * h - .12), min(f, (i0 + voz[-1] + 1) * h + .25)
    return max(0, s), f

def partir(src, s, f):
    """divide [s, f] en voz (velocidad 1) y silencios largos (recortados o en avance rápido)"""
    e, thr, h = energia(src)
    i0, i1 = int(s / h), int(f / h)
    voz = e[i0:i1] > thr
    # une huecos cortos (respiraciones, consonantes suaves)
    idx = np.flatnonzero(voz)
    if len(idx) == 0: return [(s, f, 1.0)]
    out, cur = [], s
    huecos = []
    for x, y in zip(idx[:-1], idx[1:]):
        g = (y - x) * h
        if g > PAUSA_MAX: huecos.append((s + (x + 1) * h, s + y * h))
    for ga, gb in huecos:
        g = gb - ga
        if g <= RAPIDO_DESDE:
            # queda 0.2 s después de la voz y 0.2 s antes de la siguiente; el resto del silencio se va
            out.append((cur, ga + PAUSA_DEJA / 2, 1.0)); cur = gb - PAUSA_DEJA / 2
        else:
            ga2, gb2 = ga + .2, gb - .2                       # colchón de voz a los lados
            out.append((cur, ga2, 1.0))
            dur = min(RAPIDO_MAX, max(1.0, (gb2 - ga2) / 8))
            out.append((ga2, gb2, (gb2 - ga2) / dur)); cur = gb2
    out.append((cur, f, 1.0))
    return [(a, b, k) for a, b, k in out if b - a >= 1 / FPS]

segs = []          # dict: src, a, b, k (velocidad), cam (bool), n (cuadros de salida), t0 (inicio en salida)
for pz in S["piezas"]:
    src, cam = pz["src"], pz.get("camara")
    cl = clase(src) if cam is None else None
    for kp in pz["keep"]:
        a, b = kp[0], kp[1]
        modo = kp[2] if len(kp) > 2 else ""
        s, f = (a, b) if modo == "x" else ajustar(src, a, b)     # "x" = bordes exactos, revisados a mano
        if modo == "xa": s = a                                     # "xa" = solo el inicio exacto
        if modo == "xb": f = b                                     # "xb" = solo el final exacto (la voz sigue de corrido hacia una retoma)
        piezas = partir(src, s, f)
        if cam is None and cl:                     # cambio de toma (pantalla ↔ cámara) a mitad de tramo: se parte ahí
            m, cf = cl; nuevas = []
            for x, y, k in piezas:
                if k != 1: nuevas.append((x, y, k)); continue
                i0, i1 = int(x * cf), int(y * cf); cortes = [x]
                for i in range(i0 + 1, min(i1, len(m))):
                    if m[i] != m[i - 1] and all(m[j] == m[i] for j in range(i, min(i + 2, len(m)))):
                        if i / cf - cortes[-1] > .3: cortes.append(i / cf)
                cortes.append(y)
                nuevas += [(a2, b2, 1.0) for a2, b2 in zip(cortes[:-1], cortes[1:]) if b2 - a2 > .05]
            piezas = nuevas
        cubre = [c for c in S.get("cubrir", []) if c["src"] == src]
        if cubre:                                  # "cubrir": el audio sigue, la imagen se toma de otro momento (toma de apoyo)
            nuevas = []
            for x, y, k in piezas:
                cortes = sorted({x, y, *[t for c in cubre for t in (c["a"], c["b"]) if x < t < y]})
                nuevas += [(a2, b2, k) for a2, b2 in zip(cortes[:-1], cortes[1:])]
            piezas = nuevas
        for x, y, k in piezas:
            x, y = q(x), q(y)
            n = round((y - x) * FPS / k)
            if n < 1: continue
            if cam is None and cl:
                m, cf = cl; sl = m[int(x * cf):max(int(x * cf) + 1, int(y * cf))]
                c = bool(sl.mean() > .5) if len(sl) else False
            else:
                c = bool(cam)
            sg = {"src": src, "a": x, "b": y, "k": round(k, 3), "cam": c, "n": n, "pieza_cam": bool(cam)}
            for cb in cubre:
                if cb["a"] <= x + .05 and y <= cb["b"] + .05:
                    sg["va"] = q(cb["desde"] + (0 if cb.get("congelar") else x - cb["a"]))
                    sg["cam"] = not cb.get("congelar")             # toma de cámara: lleva subtítulos; imagen congelada de pantalla no
                    if cb.get("congelar"): sg["congela"] = True
            segs.append(sg)

if S.get("cola") and segs:                                   # un respiro de imagen al final del módulo
    sg = segs[-1]; sg["b"] = q(sg["b"] + S["cola"]); sg["n"] = round((sg["b"] - sg["a"]) * FPS / sg["k"])
t = 0.0; zi = 0
for sg in segs:
    sg["t0"] = t; t += sg["n"] / FPS
    if sg["pieza_cam"]: sg["zoom"] = ZOOMS[zi % len(ZOOMS)]; zi += 1
total = t
print(f"{nombre}: {len(segs)} segmentos · {total / 60:.1f} min · "
      f"avance rápido en {sum(1 for s in segs if s['k'] > 1)} · a cámara {sum(s['n'] for s in segs if s['cam']) / FPS:.0f} s")
json.dump(segs, open(os.path.join(TMP, "segmentos.json"), "w"), indent=0)
if SOLO_PLAN: sys.exit()


# ---------- 2. subtítulos (solo a cámara), estilo EJEMPLO ----------
def palabras_tramo(src, a, b):
    """Whisper solo sobre el tramo a cámara: de corrido junta retomas y desfasa (06: 'equipo' de 3 s)"""
    cache = os.path.join(AQUI, f"t{src}", f"tramo_{a:.2f}_{b:.2f}.json")
    if not os.path.exists(cache):
        import mlx_whisper, wave
        x = audio(src)[round(a * SR):round(b * SR)]
        w16 = os.path.join(TMP, "_tramo.wav")
        subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", "16000",
                        "-af", "dynaudnorm", w16], input=x.astype(np.float32).tobytes(), check=True)
        r = mlx_whisper.transcribe(w16, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="es",
                                   word_timestamps=True, condition_on_previous_text=False,
                                   initial_prompt="la instructora, Meta Ads, píxel, campaña, remarketing.")
        ws = [{"w": w["word"].strip(), "a": round(a + w["start"], 2), "b": round(a + w["end"], 2)}
              for s in r["segments"] for w in s.get("words", []) if w["word"].strip()]
        json.dump(ws, open(cache, "w"), ensure_ascii=False)
    return json.load(open(cache))

def subtitulos():
    fix = S.get("sub_fix", {})
    pal = []                                           # (inicio, fin) en salida, texto
    for sg in segs:
        if not sg["cam"] or sg["k"] != 1: continue
        for w in palabras_tramo(sg["src"], sg["a"], sg["b"]):
            if sg["a"] - .05 <= w["a"] and w["b"] <= sg["b"] + .1:
                txt = w["w"].strip(" ,.;:¿?¡!\"").lower()
                txt = {k.lower(): v.lower() for k, v in fix.items()}.get(txt, txt)       # palabra completa
                if not txt: continue
                pal.append((max(sg["t0"], sg["t0"] + w["a"] - sg["a"]), sg["t0"] + min(w["b"], sg["b"]) - sg["a"], txt, id(sg)))
    # páginas de 2 palabras como el EJEMPLO; 3 si van tan rápido que la página duraría < 0.45 s.
    # Nunca cruza un corte ni una pausa.
    pags, cur = [], []
    for p in pal:
        if cur:
            corte = p[3] != cur[-1][3] or p[0] - cur[-1][1] > .45
            largo = len(" ".join(c[2] for c in cur + [p])) > 20
            lleno = len(cur) >= 3 or (len(cur) == 2 and cur[-1][1] - cur[0][0] >= .45)
            if corte or largo or lleno:
                pags.append(cur); cur = []
        cur.append(p)
    if cur: pags.append(cur)
    ts = lambda x: f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
    L = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1920", "PlayResY: 1080", "WrapStyle: 2", "",
         "[V4+ Styles]",
         "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
         "Style: S,Montserrat ExtraBold,74,&H00FFFFFF,&H00FFFFFF,&H64000000,&H00000000,0,0,0,0,100,100,0,0,1,0,2.5,2,60,60,118,1",
         "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for i, pg in enumerate(pags):
        a = max(0, pg[0][0] - .04)
        sig = pags[i + 1][0][0] - .04 if i + 1 < len(pags) else 1e9
        fin_seg = next(sg["t0"] + sg["n"] / FPS for sg in segs if id(sg) == pg[0][3])
        b = min(max(pg[-1][1] + .25, a + .5), sig, fin_seg)        # no se queda encima del siguiente corte
        L.append(f"Dialogue: 0,{ts(a)},{ts(b)},S,,0,0,0,,{{\\fad(110,90)}}{' '.join(p[2] for p in pg)}")
    open(os.path.join(TMP, "subs.ass"), "w").write("\n".join(L) + "\n")
    return len(pags)

npags = subtitulos()
print(f"subtítulos: {npags} páginas")


# ---------- 3. video por segmento ----------
TAPAR = S.get("tapar", [])
ASS = os.path.join(TMP, "subs.ass").replace(":", "\\:")
FONTS = os.path.join(AQUI, "fonts")

def vf_de(sg):
    ch, lab = [], "0:v"
    cajas = [] if "va" in sg else [tp for tp in TAPAR if tp["src"] == sg["src"] and tp["a"] < sg["b"] and tp["b"] > sg["a"]]
    if cajas:
        parts = [f"[0:v]split={len(cajas) + 1}[base]" + "".join(f"[c{i}]" for i in range(len(cajas)))]
        prev = "base"
        for i, tp in enumerate(cajas):
            x, y, w, h = tp["caja"]
            ta, tb = max(0, tp["a"] - sg["a"]), tp["b"] - sg["a"]
            parts.append(f"[c{i}]crop={w}:{h}:{x}:{y},gblur=sigma=28:steps=3[g{i}]")
            parts.append(f"[{prev}][g{i}]overlay={x}:{y}:enable='between(t,{ta:.3f},{tb:.3f})'[o{i}]")
            prev = f"o{i}"
        ch.append(";".join(parts)); lab = prev
    f = ["trim=end_frame=1,loop=loop=-1:size=1:start=0"] if sg.get("congela") else []
    if sg.get("zoom", 1.0) > 1.0:
        z = sg["zoom"]
        f.append(f"crop=iw/{z}:ih/{z}:(iw-iw/{z})*0.5:(ih-ih/{z})*0.36,scale=1920:1080:flags=lanczos")
    f.append(f"setpts=(PTS-STARTPTS)/{sg['k']}+{sg['t0']:.4f}/TB,fps={FPS}")
    if sg["cam"] and sg["k"] == 1: f.append(f"ass='{ASS}':fontsdir='{FONTS}'")
    f.append("setpts=PTS-STARTPTS,format=yuv420p")
    if ch: return ch[0] + f";[{lab}]" + ",".join(f) + "[v]"
    return "[0:v]" + ",".join(f) + "[v]"

import hashlib
SUBS_HASH = hashlib.md5(open(os.path.join(TMP, "subs.ass"), "rb").read()).hexdigest()[:8]

def render(i):
    """cada segmento se guarda con una llave de lo que lleva: al cambiar cortes/cajas/subs solo se rehace lo que cambió"""
    sg = segs[i]
    llave = hashlib.md5(json.dumps([sg["src"], sg.get("va", sg["a"]), sg["b"], sg["n"], vf_de(sg),
                                    SUBS_HASH if sg["cam"] else ""]).encode()).hexdigest()[:12]
    out = os.path.join(TMP, f"seg_{llave}.mp4"); sg["archivo"] = os.path.basename(out)
    if os.path.exists(out): return out
    cmd = [FF, "-v", "error", "-y", "-ss", f"{sg.get('va', sg['a']):.4f}", "-i", fuente(sg["src"]), "-t", f"{(sg['b'] - sg['a']) + .5:.4f}",
           "-filter_complex", vf_de(sg), "-map", "[v]", "-frames:v", str(sg["n"]), "-an",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), "-threads", "3", out + ".tmp.mp4"]
    subprocess.run(cmd, check=True)
    os.replace(out + ".tmp.mp4", out)
    return out

from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(2) as ex:
    for j, _ in enumerate(ex.map(render, range(len(segs)))):
        if j % 50 == 0: print(f"  video {j}/{len(segs)}", flush=True)


# ---------- 4. audio: cada pieza nivelada, fundidos de 8 ms en cada corte ----------
nivel = {}
for sg in segs:                                       # nivel de voz por fuente (las de pantalla vienen ~18 dB más bajas)
    if sg["src"] not in nivel:
        e, thr, h = energia(sg["src"]); nivel[sg["src"]] = float(np.percentile(e[e > thr], 70))
OBJ = -20.0
tot_n = sum(sg["n"] for sg in segs); A = np.zeros((round(tot_n / FPS * SR), 2), np.float32)
fd = int(.008 * SR); ramp = np.linspace(0, 1, fd, dtype=np.float32)[:, None]
for sg in segs:
    if sg["k"] != 1: continue
    o = round(sg["t0"] * SR); L = round(sg["n"] / FPS * SR)
    x = np.repeat(audio(sg["src"])[round(sg["a"] * SR):round(sg["a"] * SR) + L, None], 2, 1)
    x *= 10 ** ((OBJ - nivel[sg["src"]]) / 20)
    if len(x) > 2 * fd: x[:fd] *= ramp; x[-fd:] *= ramp[::-1]
    A[o:o + len(x)] = x[:len(A) - o]
crudo = os.path.join(TMP, "audio_crudo.f32")
A.tofile(crudo)
aud = os.path.join(TMP, "audio.m4a")
subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", crudo,
                "-af", "highpass=f=85,afftdn=nf=-30:tn=1,equalizer=f=250:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1.4:g=2.5,deesser=i=0.35,"
                       "acompressor=threshold=-24dB:ratio=2.5:attack=8:release=180:makeup=2,"
                       "loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000",
                "-c:a", "aac", "-b:a", "192k", aud], check=True)


# ---------- 5. unir: intro + clase + outro ----------
def extra(ruta, nombre_):
    """intro/outro del curso re-codificados igual que los segmentos (ya vienen a −16 LUFS: el audio va tal cual)"""
    v, a = os.path.join(AQUI, "_render", f"{nombre_}.mp4"), os.path.join(AQUI, "_render", f"{nombre_}.wav")
    if not os.path.exists(v):
        subprocess.run([FF, "-v", "error", "-y", "-i", ruta, "-vf", f"fps={FPS},scale=1920:1080,format=yuv420p", "-an",
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", str(FPS), v], check=True)
        n = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v", "-show_entries",
                                "stream=nb_read_frames", "-of", "csv=p=0", v], capture_output=True, text=True).stdout)
        subprocess.run([FF, "-v", "error", "-y", "-i", ruta, "-vn", "-ac", "2", "-ar", str(SR),
                        "-af", f"apad,atrim=end_sample={round(n / FPS * SR)}", a], check=True)
    return v, a
pre = [extra(INTRO, "intro")] if os.path.exists(INTRO) else []
pos = [extra(OUTRO, "outro")] if os.path.exists(OUTRO) else []
lst = os.path.join(TMP, "lista.txt")
open(lst, "w").write("".join(f"file '{v}'\n" for v, _ in pre) + "".join(f"file '{sg['archivo']}'\n" for sg in segs)
                     + "".join(f"file '{v}'\n" for v, _ in pos))
vid = os.path.join(TMP, "video.mp4")
subprocess.run([FF, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", vid], check=True)
aud_t = os.path.join(TMP, "audio_total.m4a")
ent = [a for _, a in pre] + [aud] + [a for _, a in pos]
subprocess.run([FF, "-v", "error", "-y", *sum((["-i", a] for a in ent), []), "-filter_complex",
                "".join(f"[{i}:a]" for i in range(len(ent))) + f"concat=n={len(ent)}:v=0:a=1[a]", "-map", "[a]", "-c:a", "aac", "-b:a", "192k", aud_t], check=True)
os.makedirs(SALIDAS, exist_ok=True)
final = os.path.join(SALIDAS, S["salida"])
subprocess.run([FF, "-v", "error", "-y", "-i", vid, "-i", aud_t, "-map", "0:v", "-map", "1:a", "-c", "copy",
                "-shortest", "-movflags", "+faststart", final], check=True)
d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final],
                         capture_output=True, text=True).stdout)
print(f"✓ {final}  ({d / 60:.1f} min; esperado {total / 60:.1f})")
