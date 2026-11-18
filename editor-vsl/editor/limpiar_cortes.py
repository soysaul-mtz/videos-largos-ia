"""Quita de proyecto.json -> "cortes" los pedazos sin voz (silencio pegado) y los encimados (audio repetido).

Uso:  .venv/bin/python limpiar_cortes.py <proyecto> [--aplicar]
Para proyectos armados con el cortes.py anterior al 4 nov 2026 (que partía el silencio del inicio como si fuera pausa).
"""
import sys, os, json
import numpy as np
import conf

proj = sys.argv[1]; P = lambda f: os.path.join(proj, f); C = conf.cargar(proj); H = .01
c = [list(x) for x in C["cortes"]]; cambios = []
for x, y in zip(c, c[1:]):
    if x[2:] == y[2:] and y[0] < x[1] <= y[1]: cambios.append(f"encimado {x} → termina en {y[0]}"); x[1] = y[0]
ok = []
for x in c:
    e, thr = conf.energia(conf.fuente_de(C, x)); voz = (e[int(x[0] / H):int(x[1] / H)] > thr).sum() * H
    if voz < .12 or x[1] - x[0] < .2: cambios.append(f"sin voz {x} ({voz:.2f}s de voz) → fuera"); continue
    ok.append(x)
print("\n".join(cambios) or "✓ sin pedazos de silencio ni encimados")
if cambios and "--aplicar" in sys.argv:
    R = json.load(open(P("proyecto.json"))); R["cortes"] = ok; json.dump(R, open(P("proyecto.json"), "w"), ensure_ascii=False, indent=1)
    print(f"✓ {len(c)} → {len(ok)} cortes")
