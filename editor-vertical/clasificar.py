"""Clasifica, fotograma por fotograma, un VSL horizontal ya editado para pasarlo a vertical 1080x1920.

Uso:  python3 clasificar.py <n>        (lee <n>/cortes.txt, <n>/fotogramas.json; escribe <n>/tomas.json y <n>/tomas.md)

  persona  → cara grande del presentador: recorte 9:16 que sigue la cara, sin zoom.
  grafico  → todo lo demás (tomas, 3D, pantallas, texto): el cuadro completo a lo ancho, con el mismo cuadro desenfocado detrás.
Cada fotograma analizado (1 de cada 2) se etiqueta; las etiquetas se suavizan (±0.25 s) y se parten también en los
cortes de toma (scdet). Un tramo "persona" pasa a "grafico" mientras un texto quemado de verdad (letras, grande, que
dura) quede cortado por el recorte. No cuentan: lo escrito en la playera ("1+1=3"), números sueltos, ruido de OCR ni los
subtítulos viejos de la franja de abajo (esos se tapan).
"""
import sys, json, re, statistics as st

n = sys.argv[1]
UMBRAL = 10.0
F = json.load(open(f"{n}/fotogramas.json")); W, H, FPS = F["w"], F["h"], F["fps"]
CW = round(H * 9 / 16); FR = F["f"]; DUR = FR[-1]["t"] + 2 / FPS; DT = FR[1]["t"] - FR[0]["t"]

cortes = []
t = None
for l in open(f"{n}/cortes.txt"):
    m = re.match(r"frame:\d+\s+pts:\d+\s+pts_time:([\d.]+)", l)
    if m: t = float(m.group(1)); continue
    m = re.match(r"lavfi\.scd\.score=([\d.]+)", l)
    if m and t is not None and float(m.group(1)) > UMBRAL and (not cortes or t - cortes[-1] > .2): cortes.append(t)

letras = lambda s: len(re.findall(r"[A-Za-zÁÉÍÓÚÑáéíóúñ]", s))
def cara_pres(f):
    cs = [c for c in f["caras"] if c[3] - c[1] >= H * .13]
    return max(cs, key=lambda c: (c[2] - c[0]) * (c[3] - c[1])) if cs else None
def en_cuerpo(w, c):            # texto sobre el pecho/playera de la persona
    if not c: return False
    fw = c[2] - c[0]; cx = (c[0] + c[2]) / 2
    return w[2] > c[3] and abs((w[1] + w[3]) / 2 - cx) < fw * 1.3
def es_sub_viejo(w):            # subtítulo quemado: franja de abajo, letra chica (los textos cinéticos grandes no cuentan)
    return (w[2] + w[4]) / 2 > H * .905 and letras(w[0]) >= 2
def real(w, c):                 # texto quemado que importa
    return letras(w[0]) >= 3 and (w[4] - w[2]) >= H * .028 and not es_sub_viejo(w)   # la playera "1+1=3" no tiene letras

# subtítulos viejos: se tapan si salen en más del 25 % de los cuadros
SUB = sum(1 for f in FR if any(es_sub_viejo(w) and not en_cuerpo(w, cara_pres(f)) for w in f["texto"])) / len(FR) > .25
# dónde empiezan los subtítulos viejos (para taparlos sin comerse los textos de encima)
_tops = sorted(w[2] for f in FR for w in f["texto"] if es_sub_viejo(w))
SUB_TOP = round(_tops[len(_tops) // 20] / H - .012, 3) if SUB and _tops else 1.0

# ---------- etiqueta por fotograma ----------
lab = []
for f in FR:
    c = cara_pres(f)
    lab.append({"t": f["t"], "p": c is not None, "cx": (c[0] + c[2]) / 2 if c else None, "c": c,
                "txt": [w for w in f["texto"] if real(w, c)]})
# suavizado: mayoría en ±0.25 s
k = max(1, round(.25 / DT))
p_s = [sum(l["p"] for l in lab[max(0, i - k): i + k + 1]) * 2 > len(lab[max(0, i - k): i + k + 1]) for i in range(len(lab))]

def cx_tramo(a, b):
    v = [l["cx"] for l in lab if a <= l["t"] < b and l["cx"] is not None]
    return st.median(v) if v else W / 2
def recorte(cx): x0 = min(max(cx - CW / 2, 0), W - CW); return x0, x0 + CW

# ---------- tramos crudos (persona/grafico), partidos en cortes ----------
tr, i = [], 0
cset = sorted(cortes)
while i < len(lab):
    j = i
    while j + 1 < len(lab) and p_s[j + 1] == p_s[i] and not any(lab[j]["t"] < c <= lab[j + 1]["t"] for c in cset): j += 1
    a = lab[i]["t"] if i else 0.0; b = lab[j + 1]["t"] if j + 1 < len(lab) else DUR
    tr.append({"ini": a, "fin": b, "tipo": "persona" if p_s[i] else "grafico"}); i = j + 1
# tramos de menos de .4 s se funden con el vecino más largo (no se nota un cambio de distribución tan corto)
cambio = True
while cambio:
    cambio = False
    for q, s in enumerate(tr):
        if s["fin"] - s["ini"] < .4 and len(tr) > 1:
            v = tr[q - 1] if q and (q == len(tr) - 1 or tr[q - 1]["fin"] - tr[q - 1]["ini"] >= tr[q + 1]["fin"] - tr[q + 1]["ini"]) else tr[q + 1]
            v["ini"], v["fin"] = min(v["ini"], s["ini"]), max(v["fin"], s["fin"]); tr.pop(q); cambio = True; break

# ---------- persona: centro del recorte, movimiento y texto que quedaría cortado ----------
seg = []
for s in tr:
    if s["tipo"] == "grafico": seg.append(s); continue
    s["cx"] = round(cx_tramo(s["ini"], s["fin"]))
    v = [l["cx"] for l in lab if s["ini"] <= l["t"] < s["fin"] and l["cx"] is not None]
    s["mov"] = round(max(v) - min(v)) if v else 0
    x0, x1 = recorte(s["cx"])
    malos = [l for l in lab if s["ini"] <= l["t"] < s["fin"] and any(w[1] < x0 - 6 or w[3] > x1 + 6 for w in l["txt"])]
    # texto cortado que dura ≥ 3 cuadros analizados
    runs, r = [], []
    for l in malos:
        if r and l["t"] - r[-1]["t"] > DT * 2.5: runs.append(r); r = []
        r.append(l)
    if r: runs.append(r)
    runs = [r for r in runs if len(r) >= 3]
    cur = s["ini"]
    for r in runs:
        a, b = max(s["ini"], r[0]["t"] - .15), min(s["fin"], r[-1]["t"] + DT + .15)
        if b - s["fin"] > -.4: b = s["fin"]               # no dejar colitas de persona
        if a - cur < .4: a = cur
        if a > cur: seg.append({"ini": cur, "fin": a, "tipo": "persona", "cx": s["cx"], "mov": s["mov"]})
        txt = " ".join(dict.fromkeys(w[0] for l in r for w in l["txt"]))[:50]
        seg.append({"ini": a, "fin": b, "tipo": "grafico", "por": "texto", "texto": txt}); cur = b
    if s["fin"] - cur > .05: seg.append({"ini": cur, "fin": s["fin"], "tipo": "persona", "cx": s["cx"], "mov": s["mov"]})

# ---------- encuadre de cada pedazo: [x0, x1] a todo lo alto ----------
# sin texto: 9:16 a pantalla completa (a la cara o al centro) · con texto: lo más angosto que incluye texto y caras
def union_texto(a, b):
    fs = [l for l in lab if a <= l["t"] < b]
    cuenta = {}
    for l in fs:
        for w in l["txt"]:
            key = (round(w[1] / 60), round(w[2] / 60))       # el mismo texto en el mismo lugar
            cuenta.setdefault(key, []).append(w)
    ws = [w for v in cuenta.values() if len(v) >= 3 for w in v]
    if not ws: return None
    return min(w[1] for w in ws), max(w[3] for w in ws)
def caras_x(a, b):
    cs = [c for l in lab if a <= l["t"] < b for c in [l["c"]] if c]
    return (min(c[0] for c in cs), max(c[2] for c in cs)) if cs else None
def encuadre(a, b, cx=None):
    u, c = union_texto(a, b), caras_x(a, b)
    if not u:
        x0, x1 = recorte(cx if cx is not None else ((c[0] + c[1]) / 2 if c else W / 2)); return round(x0), round(x1)
    lo, hi = u[0] - 40, u[1] + 40
    if c: lo, hi = min(lo, c[0] - 40), max(hi, c[1] + 40)
    if hi - lo <= CW: x0, x1 = recorte((lo + hi) / 2)
    else: x0, x1 = max(0, lo), min(W, hi)
    return round(x0), round(x1)

piezas = []
for s in seg:
    if s["tipo"] == "persona" and not s.get("por"):
        x0, x1 = recorte(s["cx"]); piezas.append({**s, "x0": round(x0), "x1": round(x1)}); continue
    # gráficos: un encuadre por toma (se parten en los cortes)
    bs = [s["ini"]] + [c for c in cset if s["ini"] + .2 < c < s["fin"] - .2] + [s["fin"]]
    for a, b in zip(bs, bs[1:]):
        x0, x1 = encuadre(a, b)
        piezas.append({"ini": a, "fin": b, "tipo": "persona" if x1 - x0 <= CW + 2 else "grafico", "x0": x0, "x1": x1,
                       **({"texto": s["texto"]} if s.get("texto") else {})})
out = []
for s in piezas:
    s = {k2: (round(v, 3) if isinstance(v, float) else v) for k2, v in s.items()}
    s["cx"] = round((s["x0"] + s["x1"]) / 2)
    if out and out[-1]["tipo"] == s["tipo"] and abs(out[-1]["fin"] - s["ini"]) < .01 and abs(out[-1]["x0"] - s["x0"]) < 30 and abs(out[-1]["x1"] - s["x1"]) < 30:
        out[-1]["fin"] = s["fin"]; continue
    out.append(s)

tp = lambda k2: sum(s["fin"] - s["ini"] for s in out if s["tipo"] == k2)
res = {"w": W, "h": H, "fps": FPS, "dur": round(DUR, 2), "recorte_w": CW, "cortes": [round(c, 3) for c in cortes], "segmentos": out,
       "tomas": [{"ini": s["ini"], "fin": s["fin"], "mov": s.get("mov", 0)} for s in out],
       "resumen": {"segmentos": len(out), "persona_s": round(tp("persona"), 1), "grafico_s": round(tp("grafico"), 1), "sub_viejo": SUB, "sub_top": SUB_TOP}}
json.dump(res, open(f"{n}/tomas.json", "w"), ensure_ascii=False, indent=1)
mm = lambda t: f"{int(t // 60)}:{t % 60:05.2f}"
with open(f"{n}/tomas.md", "w") as fo:
    for s in out:
        extra = f"x={s['x0']}–{s['x1']} ({s['x1'] - s['x0']} px)" + (f" mov={s['mov']}" if s.get("mov") else "") + (f" texto: {s['texto']}" if s.get("texto") else "")
        fo.write(f"{mm(s['ini'])}–{mm(s['fin'])}  {s['tipo']:8s} {extra}\n")
print(n, res["resumen"])
