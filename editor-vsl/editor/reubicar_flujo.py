"""Después de mover bordes de cortes y volver a armar: pasa los tiempos de flujo.json del armado viejo al nuevo,
usando el tiempo de la FUENTE (lo que se dice en ese momento) como ancla.

Uso:  .venv/bin/python reubicar_flujo.py <proyecto> <proyecto.json viejo>
"""
import sys, os, json
import numpy as np

proj = sys.argv[1]; P = lambda f: os.path.join(proj, f)
viejo = json.load(open(sys.argv[2]))["cortes"]; nuevo = json.load(open(P("proyecto.json")))["cortes"]
ini = lambda cs: np.concatenate([[0], np.cumsum([c[1] - c[0] for c in cs])])
Iv, In = ini(viejo), ini(nuevo)

def mover(t):
    k = int(np.clip(np.searchsorted(Iv, t, side="right") - 1, 0, len(viejo) - 1))
    s = viejo[k][0] + (t - Iv[k])                                      # segundo de la fuente
    for j, c in enumerate(nuevo):
        if c[2:] == viejo[k][2:] and c[0] - .3 <= s <= c[1] + .3: return round(float(In[j] + min(max(s, c[0]), c[1]) - c[0]), 3)
    return round(t, 3)

F = json.load(open(P("flujo.json")))
for x in F["tomas"]: x["a"], x["b"] = mover(x["a"]), mover(x["b"])
json.dump(F, open(P("flujo.json"), "w"), ensure_ascii=False, indent=1)
print("✓ tomas:", [(x["a"], x["b"]) for x in F["tomas"]])
