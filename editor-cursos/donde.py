"""Tiempo del original → tiempo en el módulo editado.  Uso: python3 donde.py mod2 09 82 676 ..."""
import sys, json
segs = json.load(open(f"_render/{sys.argv[1]}/segmentos.json")); src = sys.argv[2]
for t in map(float, sys.argv[3:]):
    hit = [s for s in segs if s["src"] == src and s["a"] <= t < s["b"]]
    print(t, "→", f"{8.0 + hit[0]['t0'] + (t - hit[0]['a']) / hit[0]['k']:.2f}" if hit else "(cortado)")
