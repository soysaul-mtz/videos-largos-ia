"""Editor 51 — imágenes a pantalla completa entre las tomas de la persona (estilo «editor 51.mp4», reel de Lucca Vila).

Uso:  .venv/bin/python imagenes51.py <proyecto>          genera lo que falte, arma los clips y escribe "broll"
      .venv/bin/python imagenes51.py <proyecto> --hoja  además deja imagenes51_hoja.jpg para revisarlas de un vistazo

Lee <proyecto>/imagenes.json (tiempos del ARMADO, o sea de corte.txt / words.json):
  [{"a": 3.2, "b": 4.9, "prompt": "un cuarto de servidores de los 70 …"},
   {"a": 7.0, "b": 8.1, "archivo": "/ruta/foto_de_internet.jpg"}, …]
- "prompt" → GPT Image 2.5 en Higgsfield (9:16, calidad media, 0.25 créditos). Se le agrega ESTILO para que parezca foto
  real de revista/archivo y NO gráfico hecho con IA (nada de texto, logos, brillos ni 3D de plástico).
- "archivo" → foto o video de internet ya descargado (se usa tal cual).
Cada imagen se vuelve un clip 1080×1920 con deriva lenta (≤ 4 %, sin golpe de zoom), grano y viñeta suave → img/NN.mp4,
y "broll" de proyecto.json queda con esas tomas. Luego: stock_encima.py <p> y editar.py <p> terminar.
- "encima": {"prompt": …} (o {"archivo": …}) → collage como en la referencia: a media toma entra una segunda foto en recuadro
  (60 % del ancho) encima de la primera → img/NNb.png.
- proyecto.json → "res_imagenes": "1k" | "2k" | "4k" (por defecto 1k; para entregar en 4K usar "4k").
- ESCALA=2 .venv/bin/python imagenes51.py <p> --solo-clips → arma los mismos clips en 2160×3840 en img4k/ (para cuatrok.py).
"""
import sys, os, json, subprocess, re, urllib.request
from concurrent.futures import ThreadPoolExecutor
import conf

proj = os.path.abspath(sys.argv[1]); P = lambda f: os.path.join(proj, f)
os.makedirs(P("img"), exist_ok=True)
IM = json.load(open(P("imagenes.json")))
CFG = json.load(open(P("proyecto.json"))); RES = CFG.get("res_imagenes", "1k")
HORIZ = not CFG.get("vertical", False)   # VSL / video horizontal: fotos 16:9 y clips 1920×1080
ESC = int(os.environ.get("ESCALA", "1")); SAL = "img" if ESC == 1 else "img4k"; os.makedirs(P(SAL), exist_ok=True)
ESTILO = (", shot on 35mm film, editorial documentary photograph, natural imperfect light, visible film grain, muted realistic colors, "
          "candid, real location, slightly imperfect framing, no text, no letters, no captions, no logos, no watermark, "
          "not CGI, not 3D render, not illustration, no glossy plastic look")
HF = "/opt/homebrew/bin/higgsfield"


def generar(k):
    im = IM[k]
    if im.get("encima", {}).get("prompt"): generar_una(im["encima"]["prompt"], P(f"img/{k:02d}b.png"), k, "4:5")
    if im.get("archivo"): return
    generar_una(im["prompt"], P(f"img/{k:02d}.png"), k, "16:9" if HORIZ else "9:16")


TOPE = float(open(os.path.join(conf.HERE, "tope_creditos.txt")).read()) if os.path.exists(os.path.join(conf.HERE, "tope_creditos.txt")) else 0
PARAR = False


def creditos():
    o = subprocess.run([HF, "account", "status"], capture_output=True, text=True).stdout
    m = re.findall(r"([\d.]+)\s*credits", o); return float(m[-1]) if m else None


def generar_una(prompt, dst, k, ar):
    global PARAR
    if os.path.exists(dst) or PARAR: return
    # tope de Saúl (tope_creditos.txt): si el saldo baja a ese número, no se genera nada más
    c = creditos()
    if TOPE and c is not None and c <= TOPE:
        PARAR = True; print(f"✗ PARADO: quedan {c} créditos (tope {TOPE}). No genero más imágenes."); return
    for intento in range(3):
        r = subprocess.run([HF, "generate", "create", "gpt_image_2_5", "--prompt", prompt + ESTILO, "--aspect_ratio", ar,
                            "--quality", "medium", "--resolution", RES, "--wait", "--wait-timeout", "10m"], capture_output=True, text=True)
        url = re.findall(r"https://\S+\.(?:png|jpg|jpeg|webp)", r.stdout)
        if url:
            urllib.request.urlretrieve(url[-1], dst); return
        print(f"  ⚠ imagen {k} intento {intento + 1}: {(r.stderr or r.stdout)[-200:]}")
    print(f"✗ imagen {k} no se pudo generar")


def clip(k):
    im = IM[k]; src = im.get("archivo") or P(f"img/{k:02d}.png"); dst = P(f"{SAL}/{k:02d}.mp4")
    if not os.path.exists(src): return
    enc = im.get("encima"); src2 = (enc.get("archivo") or P(f"img/{k:02d}b.png")) if enc else None
    if src2 and not os.path.exists(src2): src2 = None
    nuevo = max(os.path.getmtime(x) for x in [src, src2, P("imagenes.json")] if x)
    if os.path.exists(dst) and os.path.getmtime(dst) > nuevo and abs(conf_dur(dst) - (im["b"] - im["a"] + .4)) < .05: return
    d = im["b"] - im["a"] + .4; es_video = src.lower().endswith((".mp4", ".mov", ".webm", ".mkv"))
    # deriva: entra 4 % más grande y se desliza en una dirección distinta por toma (sin zoom de golpe)
    dx, dy = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1)][k % 6]
    VW, VH = (1920 * ESC, 1080 * ESC) if HORIZ else (1080 * ESC, 1920 * ESC); W, H = (2016 * ESC, 1134 * ESC) if HORIZ else (1134 * ESC, 2016 * ESC)
    x = f"({W - VW}/2)+{dx}*({W - VW}/2)*(t/{d:.3f}-0.5)"; y = f"({H - VH}/2)+{dy}*({H - VH}/2)*(t/{d:.3f}-0.5)"
    base = (f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},crop={VW}:{VH}:'{x}':'{y}',setsar=1")
    fin = f"noise=alls=7:allf=t,vignette=PI/5,eq=saturation=0.92,fps=30000/1001,format=yuv420p"
    ins = ["-i", src] if es_video else ["-loop", "1", "-framerate", "30000/1001", "-i", src]
    if src2:
        # collage: la segunda foto entra a media toma (60 % del ancho) con un fundido rápido y se queda quieta
        t0 = enc.get("en", round(d * .4, 2)); fw = int(VW * .6) // 2 * 2; cy = int(VH * enc.get("y", .40))
        ins += ["-loop", "1", "-framerate", "30000/1001", "-i", src2]
        fc = (f"[0:v]{base}[b];[1:v]scale={fw}:-2:flags=lanczos,format=rgba,fade=t=in:st={t0}:d=0.15:alpha=1[c];"
              f"[b][c]overlay=x=(W-w)/2:y={cy}-h/2:enable='gte(t,{t0})',{fin}[v]")
        args = ["-filter_complex", fc, "-map", "[v]"]
    else:
        args = ["-vf", f"{base},{fin}"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-t", f"{d:.3f}", *args, "-an", "-c:v", "libx264", "-crf", "17" if ESC == 1 else "16",
                    "-preset", "fast", dst], check=True)


def conf_dur(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                                capture_output=True, text=True).stdout or 0)


# sin rebanadas: si entre una imagen y un corte del armado (o la imagen siguiente) quedan < 0.35 s de la persona, la imagen
# se estira hasta ahí (revisar_cortes.py marca como parpadeo lo que quede < 0.15 s)
if os.path.exists(P("cortes.json")):
    fr = json.load(open(P("cortes.json")))["fronteras"][:-1]
    IM.sort(key=lambda im: im["a"])
    for k, im in enumerate(IM):
        sig = [f for f in fr if im["b"] < f < im["b"] + .35] + ([IM[k + 1]["a"]] if k + 1 < len(IM) and IM[k + 1]["a"] - im["b"] < .35 else [])
        if sig: im["b"] = round(min(sig), 3)
        ant = [f for f in fr if im["a"] - .35 < f < im["a"]]
        if ant and (k == 0 or IM[k - 1]["b"] <= max(ant)): im["a"] = round(max(ant), 3)
    json.dump(IM, open(P("imagenes.json"), "w"), ensure_ascii=False, indent=1)

if "--solo-clips" in sys.argv:
    with ThreadPoolExecutor(2) as ex: list(ex.map(clip, range(len(IM))))
    print(f"✓ clips en {SAL}/"); sys.exit(0)
faltan = [k for k, im in enumerate(IM) if (not im.get("archivo") and not os.path.exists(P(f"img/{k:02d}.png")))
          or (im.get("encima", {}).get("prompt") and not os.path.exists(P(f"img/{k:02d}b.png")))]
print(f"imágenes: {len(IM)} ({len(faltan)} por generar)")
with ThreadPoolExecutor(6) as ex: list(ex.map(generar, faltan))
if PARAR: sys.exit("✗ se llegó al tope de créditos (tope_creditos.txt): proceso detenido")
with ThreadPoolExecutor(4) as ex: list(ex.map(clip, range(len(IM))))
for k in range(len(IM)):                      # stock_caras.py necesita los planos de cada toma (stock.py)
    c = P(f"img/{k:02d}.mp4")
    if os.path.exists(c) and (not os.path.exists(c + ".tomas.json") or os.path.getmtime(c + ".tomas.json") < os.path.getmtime(c)):
        subprocess.run([sys.executable, os.path.join(conf.HERE, "stock.py"), c], capture_output=True)
br = [{"a": im["a"], "b": im["b"], "fuente": P(f"img/{k:02d}.mp4"), "desde": 0} for k, im in enumerate(IM) if os.path.exists(P(f"img/{k:02d}.mp4"))]
C = json.load(open(P("proyecto.json"))); C["broll"] = br; json.dump(C, open(P("proyecto.json"), "w"), ensure_ascii=False, indent=1)
print(f"✓ {len(br)}/{len(IM)} tomas en proyecto.json → broll")
if "--hoja" in sys.argv:
    ims = [im.get("archivo") or P(f"img/{k:02d}.png") for k, im in enumerate(IM)]
    ims = [i for i in ims if os.path.exists(i) and not i.lower().endswith((".mp4", ".mov"))]
    if ims:
        ins = sum((["-i", i] for i in ims), []); n = len(ims); cols = 8; rows = (n + cols - 1) // cols
        fc = "".join(f"[{i}]scale=180:320,setsar=1[v{i}];" for i in range(n)) + "".join(f"[v{i}]" for i in range(n)) + \
             f"xstack=inputs={n}:layout=" + "|".join(f"{(i % cols) * 180}_{(i // cols) * 320}" for i in range(n)) + ":fill=black"
        if n == 1: fc = "[0]scale=180:320[o]"; ins += []
        subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-frames:v", "1", P("imagenes51_hoja.jpg")])
        print("hoja:", P("imagenes51_hoja.jpg"))
