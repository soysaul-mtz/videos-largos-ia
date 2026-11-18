"""Busca frases en t<src>/palabras.json y da inicio/fin.  Uso: python3 buscar.py 09 "frase uno" "frase dos" ..."""
import sys, json, re, unicodedata
norm = lambda s: re.sub(r"[^a-z0-9ñ ]", "", unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode())
src = sys.argv[1]; W = json.load(open(f"t{src}/palabras.json")); T = [norm(w["w"]) for w in W]
for fr in sys.argv[2:]:
    f = norm(fr).split(); hits = []
    for i in range(len(T) - len(f) + 1):
        if T[i:i + len(f)] == f: hits.append(f"{W[i]['a']:.2f}–{W[i + len(f) - 1]['b']:.2f}")
    print(f"{fr!r}: {', '.join(hits) or '—'}")
