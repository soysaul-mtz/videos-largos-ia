"""Tiempo del editado → tiempo del original.  Uso: python3 inverso.py mod4 51.1 143.0 ..."""
import sys, json
segs = json.load(open(f"_render/{sys.argv[1]}/segmentos.json"))
INTRO = 8.0     # el editado arranca con la intro del curso (8 s); los tiempos que da Saúl incluyen la intro
for T in map(float, sys.argv[2:]):
    t = T - INTRO
    s = next(s for s in segs if s["t0"] <= t < s["t0"] + s["n"] / 30)
    print(f"{int(T//60)}:{T%60:04.1f} → src{s['src']} {s['a'] + (t - s['t0']) * s['k']:.2f}   (seg {s['a']:.2f}-{s['b']:.2f})")
