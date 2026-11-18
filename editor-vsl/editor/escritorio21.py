"""Editor 21 · Escritorio 3D — escenas de mesa beige vista desde arriba con objetos que caen con rebote y flechas punteadas.

Uso:  .venv/bin/python escritorio21.py <proyecto> [--hoja]

Lee <proyecto>/escenas21.json:
  {"fondo": "prompt de la mesa (opcional)",
   "objetos": {"anillo": "an open velvet ring box with a diamond ring", …},          ← se generan con fondo transparente
   "escenas": [{"desde": "una analogía", "hasta": 1.9,                               ← palabra del armado donde entra y duración
                "objetos": [{"o": "libreta", "x": 540, "y": 900, "w": 560, "rot": -4, "en": "analogía"}, …],
                "flechas": [{"de": [540, 600], "a": [540, 820], "en": 0.6}]}, …]}
- "en" de un objeto/flecha: segundos dentro de la escena o una palabra del armado (cae justo cuando la dice).
- Mesa: GPT Image 2.5 (2k, 0.9 créditos); objetos: GPT Image 2.5 con fondo transparente (1k, 0.5 créditos c/u). Respeta tope_creditos.txt.
- Cada escena se dibuja cuadro por cuadro (Chrome) → img21/NN.mp4 y escribe "broll" en proyecto.json. Luego: stock_encima.py y terminar.
"""
import sys, os, json, re, subprocess, urllib.request, difflib, unicodedata
from concurrent.futures import ThreadPoolExecutor
import conf

proj = os.path.abspath(sys.argv[1]); P = lambda f: os.path.join(proj, f)
E = json.load(open(P("escenas21.json"))); HF = "/opt/homebrew/bin/higgsfield"
os.makedirs(P("obj21"), exist_ok=True); os.makedirs(P("img21"), exist_ok=True)
TOPE = float(open(os.path.join(conf.HERE, "tope_creditos.txt")).read()) if os.path.exists(os.path.join(conf.HERE, "tope_creditos.txt")) else 0
FONDO = E.get("fondo") or ("top-down overhead photo of an empty warm beige linen desk surface, soft diagonal window light shadows with window frame "
                           "pattern, a few green plant leaves entering from one corner, a pen at the edge, lots of empty space in the middle, "
                           "photorealistic, soft and calm, no text, no objects in the center")


def creditos():
    o = subprocess.run([HF, "account", "status"], capture_output=True, text=True).stdout
    m = re.findall(r"([\d.]+)\s*credits", o); return float(m[-1]) if m else None


def gen(prompt, dst, ar, res, transparente):
    if os.path.exists(dst): return
    c = creditos()
    if TOPE and c is not None and c <= TOPE: sys.exit(f"✗ PARADO: quedan {c} créditos (tope {TOPE})")
    extra = ["--background", "transparent"] if transparente else []
    for intento in range(3):
        r = subprocess.run([HF, "generate", "create", "gpt_image_2_5", "--prompt", prompt, "--aspect_ratio", ar, "--quality", "medium",
                            "--resolution", res, *extra, "--wait", "--wait-timeout", "10m"], capture_output=True, text=True)
        url = re.findall(r"https://\S+\.(?:png|jpg|jpeg|webp)", r.stdout)
        if url: urllib.request.urlretrieve(url[-1], dst); return
        print(f"  ⚠ {os.path.basename(dst)} intento {intento + 1}: {(r.stderr or r.stdout)[-200:]}")
    print(f"✗ no se pudo generar {dst}")


OBJ = ("{}, seen from directly above (top-down flat lay), photorealistic product photo, soft natural shadowless light, "
       "isolated on a transparent background, no text, no letters, no logos")
trabajos = [(FONDO, P("obj21/_fondo.png"), "9:16", "2k", False)] + \
           [(OBJ.format(v), P(f"obj21/{k}.png"), "1:1", "1k", True) for k, v in E["objetos"].items()]
faltan = [t for t in trabajos if not os.path.exists(t[1])]
print(f"escritorio: {len(trabajos)} imágenes ({len(faltan)} por generar)", flush=True)
with ThreadPoolExecutor(5) as ex: list(ex.map(lambda t: gen(*t), faltan))

# ---------- tiempos: palabras del armado ----------
norm = lambda s: re.sub(r"[^a-z0-9ñ ]", "", "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn"))
W = [w for s in json.load(open(P("words.json")))["segments"] for w in s["words"]]; toks = [norm(w["word"]).strip() for w in W]
def busca(txt, desde_t=0):
    a = norm(txt).split(); n = len(a); best = (0, None)
    for i in range(len(W) - n + 1):
        if W[i]["start"] < desde_t - .05: continue
        r = difflib.SequenceMatcher(None, " ".join(a), " ".join(toks[i:i + n])).ratio()
        if r > best[0]: best = (r, i)
    if best[0] < .7: sys.exit(f"✗ no encontré «{txt}» en el armado ({best[0]:.2f})")
    return W[best[1]]["start"]

escenas = []
for e in E["escenas"]:
    a = round(busca(e["desde"]) - .05, 3) if isinstance(e["desde"], str) else e["desde"]
    b = round(busca(e["hasta"], a) - .05, 3) if isinstance(e["hasta"], str) else round(a + e["hasta"], 3)
    t = lambda x: max(0, round((busca(x, a) - .05 - a) if isinstance(x, str) else x, 3))
    escenas.append({"a": a, "b": b, "d": round(b - a + .4, 3),
                    "objetos": [{**o, "en": t(o.get("en", 0)), "src": "file://" + P(f"obj21/{o['o']}.png")} for o in e["objetos"]],
                    "flechas": [{**f, "en": t(f.get("en", 0))} for f in e.get("flechas", [])]})

# sin rebanadas: si entre una escena y un corte del armado (o la escena siguiente) quedan < 0.35 s de la persona, se pega
fr = json.load(open(P("cortes.json")))["fronteras"][:-1]
for k, e in enumerate(escenas):
    sig = [f for f in fr if e["b"] < f < e["b"] + .35] + ([escenas[k + 1]["a"]] if k + 1 < len(escenas) and 0 < escenas[k + 1]["a"] - e["b"] < .35 else [])
    if sig: e["b"] = round(min(sig), 3)
    if k + 1 < len(escenas) and e["b"] > escenas[k + 1]["a"]: e["b"] = escenas[k + 1]["a"]   # nunca encimar escenas
    ant = [f for f in fr if e["a"] - .35 < f < e["a"]]
    if ant and (k == 0 or escenas[k - 1]["b"] <= max(ant)):
        dt = e["a"] - max(ant); e["a"] = round(max(ant), 3)
        for x in e["objetos"] + e["flechas"]: x["en"] = round(x["en"] + dt, 3) if x["en"] > .15 else 0.0   # lo que cae al entrar, cae desde el primer cuadro
    e["d"] = round(e["b"] - e["a"] + .4, 3)

# ---------- render de cada escena ----------
spec = P("_escenas21_render.json")
json.dump({"fondo": "file://" + P("obj21/_fondo.png"), "escenas": escenas, "salida": P("img21")}, open(spec, "w"))
subprocess.run(["node", os.path.join(conf.HERE, "escritorio21.mjs"), spec], check=True)
C = json.load(open(P("proyecto.json")))
C["broll"] = [{"a": e["a"], "b": e["b"], "fuente": P(f"img21/{k:02d}.mp4"), "desde": 0} for k, e in enumerate(escenas)]
json.dump(C, open(P("proyecto.json"), "w"), ensure_ascii=False, indent=1)
for k in range(len(escenas)):
    subprocess.run([sys.executable, os.path.join(conf.HERE, "stock.py"), P(f"img21/{k:02d}.mp4")], capture_output=True)
print(f"✓ {len(escenas)} escenas de escritorio → broll · cubren {sum(e['b'] - e['a'] for e in escenas):.1f} s")
