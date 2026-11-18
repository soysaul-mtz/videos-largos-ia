"""Estilo FLUJO (referencia: reel de @nelsonmgarl "la mariposa", ~/Downloads/ig/nelsonmgarl - DfSJ23AgUxi.mp4):
un solo mundo continuo en blanco y negro donde lo único con color es la luz naranja; cada imagen nueva pasa en el MISMO
escenario (se genera usando la primera como referencia), con desenfoque entre una y otra y la cámara acercándose despacio.

Uso:  .venv/bin/python estilo_paleta/flujo.py <proyecto> <flujo.json>
flujo.json: {"mundo": "descripción del escenario común", "tomas": [{"a": s, "b": s, "prompt": "...", "ref": [0]}, ...]}
  - toma 0 = la imagen base del mundo (se genera sin referencia); "ref": índices de tomas que se usan como referencia.
  - genera en <proyecto>/flujo/NN.png (GPT Image 2.5, 9:16, 1k) y clips <proyecto>/flujo/NN.mp4 con acercamiento lento,
    desenfoque al entrar y al salir (transición de foco como la referencia) y grano; escribe "broll" en proyecto.json.
Respeta tope_creditos.txt.
"""
import sys, os, json, re, subprocess, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__)); ED = os.path.dirname(AQUI)
proj = os.path.abspath(sys.argv[1]); F = json.load(open(sys.argv[2])); P = lambda f: os.path.join(proj, "flujo", f)
os.makedirs(os.path.join(proj, "flujo"), exist_ok=True); HF = "/opt/homebrew/bin/higgsfield"
TOPE = float(open(os.path.join(ED, "tope_creditos.txt")).read()) if os.path.exists(os.path.join(ED, "tope_creditos.txt")) else 0
# "formato": "16:9" en flujo.json → imágenes y clips horizontales 1920x1080 (panel "Editado por Claude" de la doble pantalla, 5 nov)
HORIZ = F.get("formato") == "16:9"; ASP, OW, OH = ("16:9", 1920, 1080) if HORIZ else ("9:16", 1080, 1920)
ARTE = (". Cinematic digital painting, black and white monochrome world, the ONLY color is warm glowing orange light (#C6601F) "
        "coming from the light sources, soft fog and glow, very subtle teal tint only in the deepest shadows, " +
        ("horizontal 16:9 cinematic composition" if HORIZ else "vertical 9:16 composition with the main subject in the upper two thirds") +
        ", no text, no letters, no logos, no watermark")
# una toma puede pasar en OTRO lugar ("lugar": "a beach at sunset ..."): la referencia entonces solo amarra personajes y estilo (5 nov)
estilo = lambda t: (". Location: " + t["lugar"] if t.get("lugar") else ". Same location and same characters throughout the story: " + F["mundo"]) + ARTE


def creditos():
    o = subprocess.run([HF, "account", "status"], capture_output=True, text=True).stdout
    m = re.findall(r"([\d.]+)\s*credits", o); return float(m[-1]) if m else None


def generar(k, t):
    dst = P(f"{k:02d}.png")
    if os.path.exists(dst): return
    c = creditos()
    if TOPE and c is not None and c <= TOPE: sys.exit(f"✗ PARADO: quedan {c} créditos (tope {TOPE})")
    refs = [x for r in t.get("ref", []) for x in ("--image-references", P(f"{r:02d}.png")) if os.path.exists(P(f"{r:02d}.png"))]
    # la referencia solo amarra el mundo; si se le pedía "exactamente igual" copiaba también el encuadre y todas salían iguales (4 nov)
    pre = ("Use the reference image ONLY to keep the same place, the same characters' appearance, the same lighting and the same art style. "
           "Do NOT copy its composition or camera position: use a completely new camera angle and framing as described. ") if refs else ""
    if refs and t.get("lugar"):
        pre = ("Use the reference image ONLY to keep the same characters' appearance and the same art style; the place is a DIFFERENT one, "
               "described below. Do NOT copy its composition, room or camera position. ")
    for intento in range(3):
        r = subprocess.run([HF, "generate", "create", "gpt_image_2_5", "--prompt", pre + t["prompt"] + estilo(t), "--aspect_ratio", ASP,
                            "--quality", "medium", "--resolution", "1k", *refs, "--wait", "--wait-timeout", "10m"], capture_output=True, text=True)
        url = re.findall(r"https://\S+\.(?:png|jpg|jpeg|webp)", r.stdout)
        if url: urllib.request.urlretrieve(url[-1], dst); print(f"  imagen {k} ✓", flush=True); return
        print(f"  ⚠ imagen {k} intento {intento + 1}: {(r.stderr or r.stdout)[-160:]}", flush=True)


T = F["tomas"]
generar(0, T[0])                                           # primero la base del mundo (las demás la usan de referencia)
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(4) as ex: list(ex.map(lambda k: generar(k, T[k]), range(1, len(T))))

# sin rebanadas: si entre una toma y un corte del armado (o la toma siguiente) quedan < 0.35 s de la persona, se pega
fr = json.load(open(os.path.join(proj, "cortes.json")))["fronteras"][:-1]
# y el salto entre tomas de la persona queda DEBAJO de la imagen: la toma se va TAPA s después del corte (el corte real cae
# ±1–2 cuadros de la frontera calculada; si la imagen se iba justo en la frontera se veía el salto, 4 nov)
TAPA = .25
for k, t in enumerate(T):
    sig_a = T[k + 1]["a"] if k + 1 < len(T) else 1e9
    for _ in range(3):
        cor = [f for f in fr if t["b"] - .2 < f < t["b"] + .35]
        if cor and max(cor) + TAPA > t["b"]: t["b"] = round(max(cor) + TAPA, 3)
    if 0 < sig_a - t["b"] < .35: t["b"] = sig_a                                     # sin rebanada antes de la siguiente
    t["b"] = min(t["b"], sig_a)                                                      # nunca encimar una toma con la siguiente
    ant = [f for f in fr if t["a"] - .35 < f <= t["a"] + .1]
    if ant and (k == 0 or T[k - 1]["b"] <= max(ant) - .1): t["a"] = round(max(ant) - .1, 3)
    if os.path.exists(P(f"{k:02d}.mp4")):
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", P(f"{k:02d}.mp4")], capture_output=True, text=True).stdout or 0)
        if abs(dur - (t["b"] - t["a"] + .4)) > .05: os.remove(P(f"{k:02d}.mp4"))

# clips: acercamiento lento + foco que entra (0.25 s) y sale (últimos 0.25 s) + grano, como la referencia
br = []
for k, t in enumerate(T):
    gen, src, dst = P(f"{k:02d}.png"), P(f"{k:02d}_bn.png"), P(f"{k:02d}.mp4")
    if not os.path.exists(gen): print(f"⚠ falta imagen {k}"); continue
    # todo en blanco y negro salvo la luz naranja (la referencia: mundo gris, solo la luz tiene color)
    if not os.path.exists(src) or os.path.getmtime(src) < os.path.getmtime(gen):
        subprocess.run([sys.executable, os.path.join(AQUI, "solo_naranja.py"), gen, src], check=True)
    d = t["b"] - t["a"] + .4; z0, z1 = 1.0, 1.0 + min(.12, .035 * d)
    vf = (f"scale={OW * 2}:{OH * 2}:force_original_aspect_ratio=increase,crop={OW * 2}:{OH * 2},"
          f"zoompan=z='{z0}+({z1}-{z0})*on/({d:.3f}*30000/1001)':x='iw/2-(iw/zoom/2)':y='ih*0.45-(ih/zoom*0.45)':d=1:s={OW}x{OH}:fps=30000/1001,"
          f"noise=alls=6:allf=t,format=yuv420p")
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", "30000/1001", "-i", src, "-t", f"{d:.3f}", "-vf", vf,
                        "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-an", P("_tmp.mp4")], check=True)
        # el desenfoque de foco aparte (gblur con expresión por cuadro no existe: se hace por tramos con enable)
        # foco centrado en el corte: entra nítida en 0.15 s y sale en los últimos 0.15 s (antes 0.25 s: se veía tarde)
        # "rapido": true (montaje de fotos de ~0.5 s): el foco entra y sale en 0.05 s, si no la foto casi no se ve nítida (5 nov)
        q = .05 if t.get("rapido") else .15; e2 = d - .4 - q; s = q / 3
        fb = (f"gblur=sigma=12:enable='lt(t,{s:.3f})',gblur=sigma=6:enable='between(t,{s:.3f},{2 * s:.3f})',gblur=sigma=2.5:enable='between(t,{2 * s:.3f},{q:.3f})',"
              f"gblur=sigma=2.5:enable='between(t,{e2:.3f},{e2 + s:.3f})',gblur=sigma=6:enable='between(t,{e2 + s:.3f},{e2 + 2 * s:.3f})',"
              f"gblur=sigma=12:enable='gt(t,{e2 + 2 * s:.3f})'")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", P("_tmp.mp4"), "-vf", fb, "-c:v", "libx264", "-crf", "17", "-preset", "fast", dst], check=True)
    br.append({"a": t["a"], "b": t["b"], "fuente": dst, "desde": 0})
    subprocess.run([sys.executable, os.path.join(ED, "stock.py"), dst], capture_output=True)
C = json.load(open(os.path.join(proj, "proyecto.json"))); C["broll"] = br
json.dump(C, open(os.path.join(proj, "proyecto.json"), "w"), ensure_ascii=False, indent=1)
print(f"✓ {len(br)} tomas del flujo → broll")
