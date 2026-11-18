"""Editor 51 v2 con la paleta de Saúl: arma TODAS las tomas de una escaleta (escaleta_v2.json) y las deja como "broll".

Uso:  .venv/bin/python estilo_paleta/paleta51.py <proyecto> <escaleta_v2.json> <clave_video> [--fotos clave=ruta,…] [--hoja]

Por tipo de toma (ver escaleta_v2.py):
  R  recorte del grupo completo (GPT Image 2.5 con fondo transparente, 1k) → componer.py: B/N sobre fondo con la paleta
  O  objeto suelto (transparente, 1k) → componer.py --fondo <lámina anterior>: entra ENCIMA de la imagen anterior (collage)
  E  lugar completo (1k) → paleta.py: sujeto B/N si lo hay y todo lo demás con la paleta
  I  foto real (--fotos, o pídela/búscala) → paleta.py
  D  diagrama de líneas finas animado (diagrama51.mjs, sin créditos)
  T  pantalla oscura con grano (el subtítulo hace de texto)
Todo queda en <proyecto>/v2/ (assets/ generados, laminas/ terminadas) e imagenes.json con "archivo" → imagenes51.py arma los clips.
Respeta tope_creditos.txt (no genera si el saldo llega al tope).
"""
import sys, os, json, re, subprocess, urllib.request
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__)); ED = os.path.dirname(AQUI); PY = os.path.join(ED, ".venv", "bin", "python")
proj = os.path.abspath(sys.argv[1]); ESC = json.load(open(sys.argv[2]))[sys.argv[3]]
args = sys.argv[4:]; FOTOS = dict(x.split("=", 1) for x in args[args.index("--fotos") + 1].split(",")) if "--fotos" in args else {}
P = lambda *f: os.path.join(proj, "v2", *f)
for d in ("assets", "laminas"): os.makedirs(P(d), exist_ok=True)
HF = "/opt/homebrew/bin/higgsfield"
TOPE = float(open(os.path.join(ED, "tope_creditos.txt")).read()) if os.path.exists(os.path.join(ED, "tope_creditos.txt")) else 0
SUF = {"R": ", the whole group including furniture and objects as one single cutout, entire subject fully visible with margin around it, "
            "isolated on a transparent background, photorealistic documentary photo, natural light, no text, no letters, no logos",
       "O": ", one single object fully visible with margin around it, isolated on a transparent background, photorealistic product photo, "
            "no text, no letters, no logos",
       "E": ", photorealistic documentary photograph, 35mm film, natural imperfect light, one clear main subject, no text, no letters, no logos"}


def creditos():
    o = subprocess.run([HF, "account", "status"], capture_output=True, text=True).stdout
    m = re.findall(r"([\d.]+)\s*credits", o); return float(m[-1]) if m else None


def generar(k, s):
    dst = P("assets", f"{k:02d}.png")
    if os.path.exists(dst) or s["tipo"] not in SUF: return
    c = creditos()
    if TOPE and c is not None and c <= TOPE: print(f"✗ PARADO: quedan {c} créditos (tope {TOPE})"); return
    ar = "1:1" if s["tipo"] == "O" else "9:16"; extra = [] if s["tipo"] == "E" else ["--background", "transparent"]
    for intento in range(3):
        r = subprocess.run([HF, "generate", "create", "gpt_image_2_5", "--prompt", s["desc"] + SUF[s["tipo"]], "--aspect_ratio", ar,
                            "--quality", "medium", "--resolution", "1k", *extra, "--wait", "--wait-timeout", "10m"], capture_output=True, text=True)
        url = re.findall(r"https://\S+\.(?:png|jpg|jpeg|webp)", r.stdout)
        if url: urllib.request.urlretrieve(url[-1], dst); return
        print(f"  ⚠ toma {k} intento {intento + 1}: {(r.stderr or r.stdout)[-160:]}")


tomas = [(k, s) for k, s in enumerate(ESC)]
img = [(k, s) for k, s in tomas if s["tipo"] != "TÚ"]
print(f"{len(img)} tomas de imagen · generando {sum(s['tipo'] in SUF and not os.path.exists(P('assets', f'{k:02d}.png')) for k, s in img)}…", flush=True)
with ThreadPoolExecutor(5) as ex: list(ex.map(lambda x: generar(*x), img))

IM, previa, luz = [], None, "izquierda"
for k, s in tomas:
    if s["tipo"] == "TÚ": previa = None; continue
    luz = "derecha" if luz == "izquierda" else "izquierda"
    lam = P("laminas", f"{k:02d}.png"); src = P("assets", f"{k:02d}.png"); t = s["tipo"]
    if t == "D":
        lam = P("laminas", f"{k:02d}.mp4")
        if not os.path.exists(lam):
            et = ["soltero", "pareja", "comprometido", "casado", "familia"]
            tipo = "barras" if "barra" in s["desc"] else "escalera"
            spec = {"tipo": tipo, "etiquetas": et, "acento": 4 if ("naranja" in s["desc"] or tipo == "barras") else -1,
                    "d": round(s["b"] - s["a"] + .5, 2), "salida": lam}
            json.dump(spec, open(P("laminas", f"{k:02d}.json"), "w"), ensure_ascii=False)
            subprocess.run(["node", os.path.join(AQUI, "diagrama51.mjs"), P("laminas", f"{k:02d}.json")], check=True)
    elif not os.path.exists(lam):
        if t == "R" and os.path.exists(src): subprocess.run([PY, os.path.join(AQUI, "componer.py"), src, lam, "--luz", luz], check=True, capture_output=True)
        elif t == "O" and os.path.exists(src):
            extra = ["--fondo", previa] if previa and previa.endswith(".png") else []
            subprocess.run([PY, os.path.join(AQUI, "componer.py"), src, lam, "--luz", luz, "--escala", ".58", "--y", ".46", *extra], check=True, capture_output=True)
        elif t == "E" and os.path.exists(src): subprocess.run([PY, os.path.join(AQUI, "paleta.py"), src, lam, "--luz", luz, "--ancho", "1080"], check=True, capture_output=True)
        elif t == "I":
            foto = next((v for kk, v in FOTOS.items() if kk.lower() in s["desc"].lower()), None)
            if not foto: print(f"⚠ toma {k}: falta la foto real ({s['desc']}) → pásala con --fotos clave=ruta"); continue
            subprocess.run([PY, os.path.join(AQUI, "paleta.py"), foto, lam, "--luz", luz, "--ancho", "1080"], check=True, capture_output=True)
        elif t == "T": subprocess.run([PY, os.path.join(AQUI, "componer.py"), "-", lam, "--luz", luz], check=True, capture_output=True)   # fondo de la paleta con luz (negro puro lo marca la revisión como cuadro negro)
    if not os.path.exists(lam): print(f"⚠ toma {k} ({t}) sin lámina"); continue
    IM.append({"a": s["a"], "b": s["b"], "archivo": lam, "texto": s["dice"], "tipo": t}); previa = lam
json.dump(IM, open(os.path.join(proj, "imagenes.json"), "w"), ensure_ascii=False, indent=1)
print(f"✓ {len(IM)} láminas → imagenes.json · ahora: imagenes51.py {proj} --hoja")
