"""Tiempo del editado → qué se oye ahí (segmentos y palabras alrededor).  Uso: python3 contexto.py mod2 128 170 ..."""
import sys, json
m = sys.argv[1]; segs = json.load(open(f"_render/{m}/segmentos.json"))
for t in map(float, sys.argv[2:]):
    i = next(i for i, s in enumerate(segs) if s["t0"] <= t < s["t0"] + s["n"] / 30)
    print(f"\n=== {m} {int(t//60)}:{t%60:04.1f}")
    for s in segs[max(0, i - 2):i + 3]:
        W = json.load(open(f"t{s['src']}/palabras.json"))
        txt = " ".join(w["w"] for w in W if s["a"] - .05 <= w["a"] < s["b"])
        mark = ">>" if s is segs[i] else "  "
        print(f"{mark} out {s['t0']:6.1f} src{s['src']} {s['a']:7.2f}-{s['b']:7.2f}{' cam' if s['cam'] else ''}: {txt}")
