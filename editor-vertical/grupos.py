"""Subtítulos Saúl Pro (línea chica + palabra gigante, palabra por palabra) para la base vertical.

Uso:  python grupos.py <n> [--desde s --hasta s]
Lee <n>/palabras.json (Whisper), <n>/tomas.json, <n>/fotogramas.json y <n>/base.mp4 (o la fuente) →  <n>/subs.json
Cada página: 2–5 palabras, ≤ 2.2 s, corta en puntuación y en pausas > .35 s. Lo último (1–2 palabras) va gigante.
Posición: en tomas de persona, debajo de la barbilla (y ≥ cara + 60 px) y dentro de la zona segura de IG;
en gráficos, debajo del panel. Si ahí ya hay texto quemado del video original, la página se mueve o se omite.
Tema por página: se mide la luz detrás del texto (oscuro sobre fondo claro con halo; blanco sobre fondo oscuro).
"""
import sys, json, re, bisect
import numpy as np, cv2

n = sys.argv[1]; A = sys.argv[2:]
arg = lambda k, d=None: A[A.index(k) + 1] if k in A else d
T = json.load(open(f"{n}/tomas.json")); FG = json.load(open(f"{n}/fotogramas.json")); PW = json.load(open(f"{n}/palabras.json"))
_ex = __import__("os").path.exists
CORR = {**(json.load(open("correcciones.json")) if _ex("correcciones.json") else {}), **(json.load(open(f"{n}/correcciones.json")) if _ex(f"{n}/correcciones.json") else {})}
W, H, CW = T["w"], T["h"], T["recorte_w"]; OW, OH = 1080, 1920; SUB = T["resumen"]["sub_viejo"]
SEG = T["segmentos"]; INI = [s["ini"] for s in SEG]
ZS = dict(arriba=270, abajo=1530, derecha=890, lado=50)
SUB_TOP = T["resumen"].get("sub_top", .86)
def panel(s):
    """Geometría del panel de un tramo "grafico" (igual que reencuadre.py): escala, arriba y alto en la vertical."""
    cw = s["x1"] - s["x0"]; hs = H * SUB_TOP if SUB else H
    ph = OW * hs / cw; y = max(0, min(max(230, 860 - ph / 2), OH - ph))
    return OW / cw, y, ph
d0, d1 = float(arg("--desde", 0)), float(arg("--hasta", 1e9))

# ---------- palabras ----------
ws = []
for s in PW["segments"]:
    for w in s["words"]:
        tx = w["w"].strip()
        if not tx or w["e"] < d0 or w["s"] > d1: continue
        for k, v in CORR.items(): tx = re.sub(rf"\b{k}\b", v, tx)
        ws.append({"txt": tx, "a": round(w["s"], 3), "z": round(w["e"], 3)})

# ---------- páginas ----------
CONECT = set("a al de del el la las los lo un una unos unas y o u e ni que por para con sin en tu tus su sus mi mis me te se nos le les es muy ya como si pero cuando donde porque".split())
conector = lambda w: re.sub(r"[^\wáéíóúñü]", "", w["txt"].lower()) in CONECT
pags, cur = [], []
for i, w in enumerate(ws):
    cur.append(w)
    sig = ws[i + 1] if i + 1 < len(ws) else None
    fin_frase = bool(re.search(r"[.,;:?!…]$", w["txt"]))
    fin_oracion = bool(re.search(r"[.?!…]$", w["txt"]))
    pausa = sig is None or sig["a"] - w["z"] > .35
    largo = len(cur) >= 5 or (cur[-1]["z"] - cur[0]["a"]) > 2.2 or sum(len(x["txt"]) for x in cur) > 26
    # nombres propios ("el presentador", "Nombre Del Programa") no se parten
    nombre = sig is not None and sig["txt"][:1].isupper() and not fin_frase and (w["txt"][:1].isupper() or (w["txt"] == "de" and len(cur) > 1 and cur[-2]["txt"][:1].isupper()))
    if largo and nombre and len(cur) < 7: largo = False
    if pausa or fin_oracion or (fin_frase and len(cur) >= 2) or largo:
        pasa = []                                   # cortada por largo: los conectores del final pasan a la siguiente
        if largo and not pausa and not fin_frase:
            while len(cur) > 1 and conector(cur[-1]): pasa.insert(0, cur.pop())
        pags.append(cur); cur = pasa
if cur: pags.append(cur)
# una palabra suelta se pega a la página anterior si está cerca
p2 = []
for p in pags:
    if len(p) == 1 and p2 and p[0]["a"] - p2[-1][-1]["z"] < .3 and len(p2[-1]) < 6: p2[-1] += p
    else: p2.append(p)
pags = p2

def lineas(p):
    limpia = lambda s: s.strip(",;:.…")
    txts = [dict(w, txt=limpia(w["txt"])) for w in p]
    # gigante: la última palabra con contenido; lo que quede después (conectores) va chico debajo
    k = max((i for i, w in enumerate(txts) if not conector(w)), default=len(txts) - 1)
    if len(txts) <= 2 and k == len(txts) - 1 and all(not conector(w) for w in txts) and sum(len(w["txt"]) for w in txts) <= 12:
        return [{"estilo": "grande", "palabras": txts}]
    L = []
    if txts[:k]: L.append({"estilo": "chico", "palabras": txts[:k]})
    L.append({"estilo": "grande", "palabras": [txts[k]]})
    if txts[k + 1:]: L.append({"estilo": "chico", "palabras": txts[k + 1:]})
    return L

# ---------- dónde poner cada página ----------
ft = [f["t"] for f in FG["f"]]
def seg_en(t): return SEG[max(0, bisect.bisect_right(INI, t) - 1)]
def a_salida(b, t):
    """Caja de la fuente (px) → caja en la vertical, según la distribución en ese momento."""
    s = seg_en(t)
    if s["tipo"] == "persona":
        x0 = s["x0"]; k = OW / CW
        return [(b[0] - x0) * k, b[1] * k, (b[2] - x0) * k, b[3] * k]
    k, y, _ = panel(s); x0 = s["x0"]
    return [(b[0] - x0) * k, y + b[1] * k, (b[2] - x0) * k, y + b[3] * k]
def obst(a, z):
    """Cajas a evitar entre a y z: caras y texto quemado (sin los subtítulos viejos), en px de la vertical."""
    i0, i1 = bisect.bisect_left(ft, a), bisect.bisect_right(ft, z)
    caras, txt = [], []
    for f in FG["f"][i0:i1]:
        for c in f["caras"]:
            if c[3] - c[1] >= H * .08: caras.append(a_salida(c, f["t"]))
        for w in f["texto"]:
            if SUB and (w[2] + w[4]) / 2 > H * .905: continue
            txt.append(a_salida(w[1:], f["t"]))
    return caras, txt

cap = cv2.VideoCapture(f"{n}/base.mp4") if __import__("os").path.exists(f"{n}/base.mp4") else None
def luz(t, y0, y1):
    if cap is None: return None
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, fr = cap.read()
    if not ok: return None
    reg = cv2.cvtColor(fr[int(max(0, y0)):int(min(OH, y1)), 300:780], cv2.COLOR_BGR2GRAY)   # justo detrás de las letras
    return float(np.mean(reg)) if reg.size else None

def quemado(a, z):
    """Palabras que el video ya trae escritas entre a y z (para no duplicar la frase)."""
    i0, i1 = bisect.bisect_left(ft, a), bisect.bisect_right(ft, z)
    return {re.sub(r"[^a-záéíóúñü]", "", w[0].lower()) for f in FG["f"][i0:i1] for w in f["texto"]
            if not (SUB and (w[2] + w[4]) / 2 > H * .905)}
norm = lambda x: re.sub(r"[^a-záéíóúñü]", "", x.lower())

ALTO = lambda L: sum(64 * 1.1 if l["estilo"] == "chico" else 178 * 1.0 for l in L)
out = []
for p in pags:
    a, z = p[0]["a"], p[-1]["z"]; L = lineas(p); h = ALTO(L)
    s = seg_en((a + z) / 2)
    caras, txt = obst(a - .1, z + .1)
    # si el video ya trae escrita esta frase (≥ 60 % de las palabras con contenido), no se duplica
    q, cont = quemado(a - .3, z + .3), [norm(w["txt"]) for w in p if len(norm(w["txt"])) >= 4]
    if cont and sum(any(c in x or x in c for x in q if len(x) >= 4) for c in cont) >= .6 * len(cont): continue
    if s["tipo"] == "persona":
        piso = max([c[3] for c in caras if c[0] < 940 and c[2] > 140], default=OH * .45) + 60
        y_c = max(OH * .55, piso + h / 2)             # justo debajo de la barbilla
    else:
        _, py, ph = panel(s); y_c = py + ph + 40 + h / 2
        if y_c + h / 2 > ZS["abajo"]: y_c = max(ZS["arriba"] + h / 2, py - 40 - h / 2)   # no cabe abajo: arriba del panel
    y_c = min(y_c, ZS["abajo"] - h / 2)
    choca = lambda yc, bs: [b for b in bs if b[1] < yc + h / 2 and b[3] > yc - h / 2 and b[0] < 940 and b[2] > 140]
    if choca(y_c, txt + caras):                        # busca el lugar libre más cercano (sin cara ni texto quemado)
        rango = np.arange(ZS["arriba"] + h / 2, ZS["abajo"] - h / 2 + 1, 20)
        cands = [yc for yc in rango if not choca(yc, txt + caras)]
        if not cands:
            if any(choca(yc, txt) for yc in rango if not choca(yc, caras)) and all(choca(yc, txt) for yc in rango):
                continue                               # el video ya trae ese texto en todo el cuadro: no se duplica
            cands = [yc for yc in rango if not choca(yc, txt)] or [ZS["abajo"] - h / 2]
            cands = [max(cands)]                       # la cara llena el cuadro: lo más abajo posible
        y_c = min(cands, key=lambda yc: abs(yc - y_c))
    l = luz((a + z) / 2, y_c - h / 2, y_c + h / 2)
    out.append({"ini": round(a, 3), "fin": round(z + .12, 3), "y": round(y_c / OH, 4), "tema": "claro" if l is not None and l > 160 else "oscuro",
                "lineas": L})
# que no se encimen: cada página termina cuando empieza la siguiente
for i in range(len(out) - 1): out[i]["fin"] = min(out[i]["fin"], out[i + 1]["ini"] - .02)
json.dump({"paginas": out}, open(f"{n}/subs.json", "w"), ensure_ascii=False, indent=0)
print(n, len(out), "páginas de", len(pags))
