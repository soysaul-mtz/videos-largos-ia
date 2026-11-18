"""Doble revisión del texto con el audio LIMPIO (sin música): palabras cortadas en las uniones y subtítulos vs lo que se oye.

Uso:  .venv/bin/python revisar_audio.py <proyecto>       (después de armar.py y alinear.py)
  1. Cada corte del armado se transcribe solo y otra vez con 0.6 s de más a cada lado: si la primera o la última palabra
     cambia, la unión se la comió.
  2. El armado completo se transcribe con la voz sola y se compara con los subtítulos (pages.json): palabras que el
     subtítulo dice y no se oyen, o al revés (Whisper sobre el video con música se equivoca; por eso se hace sobre la voz).
Sale con código 1 si algo falla.
"""
import sys, os, json, re, difflib, tempfile, unicodedata
import numpy as np
import conf

proj = sys.argv[1]; P = lambda f: os.path.join(proj, f)
norm = lambda s: re.sub(r"[^a-z0-9ñ]", "", "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn"))
NUM = {"1": "uno", "2": "dos", "3": "tres", "4": "cuatro", "5": "cinco", "7": "siete", "10": "diez", "#1": "numerouno"}
pal = lambda txt: [NUM.get(x, norm(x)) for x in txt.replace("#1", " numero uno ").split() if norm(x) or x in NUM]
CF = conf.cargar(proj); VOC = CF.get("vocabulario", "")
# proyecto.json -> "equivalentes": {"regex": "reemplazo"} para lo que Whisper escribe distinto de un nombre propio
# (p. ej. {"\\b(cloud|cloth)\\b": "Claude"}); "uniones_ok": índices de uniones ya revisadas a mano
EQ = CF.get("equivalentes", {}); UOK = set(CF.get("uniones_ok", []))
def oir(txt):
    for rx, rep in EQ.items(): txt = re.sub(rx, rep, txt, flags=re.I)
    return pal(txt)
CJ = json.load(open(P("cortes.json"))); B = [0] + CJ["fronteras"]; fin_voz = CJ.get("fin_voz", B[-1])
TMP = tempfile.mkdtemp(); src = P("corte.mp4"); mal = []; EN = {}

# 1. uniones
for k, (a, b) in enumerate(zip(B, B[1:])):
    b = min(b, fin_voz + .05); w = os.path.join(TMP, "u.wav"); conf.wav_tramo(src, a, b, w)
    oido = oir(conf.transcribir(w, vocabulario=VOC)["text"])
    if k in UOK: continue
    if not oido: mal.append(f"corte {k} ({a:.2f}-{b:.2f}s): no se oye nada"); continue
    w2 = os.path.join(TMP, "v.wav"); conf.wav_tramo(src, max(0, a - .6), min(B[-1], b + .6), w2)
    amplio = oir(conf.transcribir(w2, vocabulario=VOC)["text"])
    if oido[-1] not in amplio or oido[0] not in amplio:
        # Whisper en pedazos cortos inventa o cambia palabras: si el corte cae en silencio REAL en la fuente (la voz no sigue
        # sonando en el borde), ninguna palabra quedó cortada (4 nov 2026)
        c = CF["cortes"][k] if k < len(CF["cortes"]) else None
        if c:
            if conf.fuente_de(CF, c) not in EN: EN[conf.fuente_de(CF, c)] = conf.energia(conf.fuente_de(CF, c))
            e, thr = EN[conf.fuente_de(CF, c)]; borde = lambda x, y: float(np.max(e[int(x / .01):max(int(x / .01) + 1, int(y / .01))]))
            ini, fin = borde(c[0], c[0] + .04), borde(c[1] - .04, c[1])
            if ini < thr and fin < thr:
                print(f"  · unión del corte {k}: Whisper dudó («{' '.join(oido[-2:])}» / «{' '.join(amplio[-3:])}»), pero los dos bordes caen en silencio ({ini:.0f}/{fin:.0f} dB)"); continue
            mal.append(f"unión del corte {k} ({a:.2f}-{b:.2f}s): la voz suena en el borde (inicio {ini:.0f} dB, final {fin:.0f} dB, voz > {thr:.0f}) y se oye «{' '.join(oido[:2])} … {' '.join(oido[-2:])}», con más audio «{' '.join(amplio[-3:])}»"); continue
        mal.append(f"unión del corte {k} ({a:.2f}-{b:.2f}s): se oye «{' '.join(oido[:2])} … {' '.join(oido[-2:])}», con más audio «{' '.join(amplio[-3:])}»")
print(f"  ✓ {len(B) - 1} uniones transcritas por separado") if not mal else None

# 2. subtítulos contra lo que se oye
w = os.path.join(TMP, "todo.wav"); conf.wav_tramo(src, 0, fin_voz + .1, w)
oido = oir(conf.transcribir(w, vocabulario=VOC)["text"])
SW = [(NUM.get(x["t"], norm(x["t"])), x["s"]) for p in json.load(open(P("pages.json"))) for l in p["lines"] for x in l["w"]]
SW = [(s, t) for s, t in SW if s]; subs = [s for s, _ in SW]; ts = [t for _, t in SW]

def local(i1, i2, j1, j2):
    """Whisper sobre el video entero a veces se salta o cambia palabras que sí se oyen: se vuelve a oír SOLO ese pedazo.
    Si ahí se oye lo mismo que dice el subtítulo, es Whisper, no el subtítulo (4 nov 2026)."""
    t0 = ts[min(i1, len(ts) - 1)]; a, b = max(0, t0 - 1.2), min(fin_voz + .1, t0 + 1.8); w2 = os.path.join(TMP, "l.wav")
    conf.wav_tramo(src, a, b, w2); loc = oir(conf.transcribir(w2, vocabulario=VOC)["text"])
    sw = [s for s, t in SW if a <= t < b]
    return all(x in loc for x in subs[i1:i2]) and not any(x in loc and x not in sw for x in oido[j1:j2]), loc
sm = difflib.SequenceMatcher(None, subs, oido, autojunk=False); avisos = []
parecido = lambda a, b: difflib.SequenceMatcher(None, a, b).ratio()
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == "equal": continue
    s, o = " ".join(subs[i1:i2]), " ".join(oido[j1:j2])
    if s.replace("numerouno", "numero uno") == o: continue
    if op == "replace" and i2 - i1 == j2 - j1 and all(parecido(a, b) >= .6 for a, b in zip(subs[i1:i2], oido[j1:j2])):
        avisos.append(f"subtítulo «{s}» y se oye «{o}» (¿Whisper lo escribió distinto o el subtítulo dice otra cosa? revísalo)"); continue
    t0 = ts[min(i1, len(ts) - 1)]; ok, loc = local(i1, i2, j1, j2)
    if ok: avisos.append(f"{t0:.1f}s: subtítulo «{s or '—'}», Whisper oyó «{o or '—'}» en el video entero; oído solo ese pedazo sí coincide"); continue
    mal.append(f"subtítulo en {t0:.1f}s: «{s or '—'}» pero se oye «{o or '—'}» (oído solo ese pedazo: «{' '.join(loc)}»)")
for a in avisos: print("  ·", a)
print(f"  ✓ subtítulos idénticos a lo que se oye ({len(subs)} palabras)") if not any(m.startswith("subtítulo") for m in mal) else None
for m in mal: print("  ⚠", m)
sys.exit(1 if mal else 0)
