"""Quita los primeros N cortes de un armado YA hecho (con filtro de piel) sin volver a armar ni filtrar:
recorta la cámara (_corte_sin_broll.mp4) y recorre todos los tiempos (cortes, palabras, caras, flujo.json).

Uso:  .venv/bin/python quitar_inicio.py <proyecto> [N=1]
Respaldo de todo lo que toca en <proyecto>/_antes_quitar_inicio/ (final.mp4 se MUEVE ahí: suele estar enlazado a la entrega).
Después: flujo.py (si hay flujo.json) → stock_encima.py → quitar de pages.txt lo que se dijo en los cortes quitados → editar.py terminar.
"""
import sys, os, json, shutil, subprocess

proj = os.path.abspath(sys.argv[1]); N = int(sys.argv[2]) if len(sys.argv) > 2 else 1
P = lambda f: os.path.join(proj, f); BK = P("_antes_quitar_inicio")
if os.path.exists(BK): sys.exit(f"✗ ya existe {BK}: este proyecto ya se recortó (bórralo a mano si quieres recortar otra vez)")
os.makedirs(BK)
CJ = json.load(open(P("cortes.json"))); FPS = 30000 / 1001
D = round(CJ["fronteras"][N - 1] * FPS) / FPS                      # en cuadro exacto
print(f"quito {N} corte(s): {D:.3f} s")
for f in ("cortes.json", "proyecto.json", "words.json", "caras.json", "faces.json", "pages.txt", "pages.json", "flujo.json", "layout.json", "contraste.json"):
    if os.path.exists(P(f)): shutil.copy2(P(f), os.path.join(BK, f))
if os.path.exists(P("final.mp4")): shutil.move(P("final.mp4"), os.path.join(BK, "final.mp4"))

cam = P("_corte_sin_broll.mp4"); viejo = os.path.join(BK, "_corte_sin_broll.mp4"); shutil.move(cam, viejo)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", viejo, "-ss", f"{D:.4f}", "-c:v", "libx264", "-crf", "12", "-preset", "fast",
                "-pix_fmt", "yuvj420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", cam], check=True)
open(P("_filtro.ok"), "w").write("ok")                                # la cámara ya trae el filtro: que nadie lo repita

sh = lambda t: round(t - D, 3)
CJ["cortes"] = CJ["cortes"][N:]; CJ["fronteras"] = [sh(x) for x in CJ["fronteras"][N:]]; CJ["fin_voz"] = sh(CJ["fin_voz"])
if "ganancias_db" in CJ: CJ["ganancias_db"] = CJ["ganancias_db"][N:]
json.dump(CJ, open(P("cortes.json"), "w"))

C = json.load(open(P("proyecto.json"))); C["cortes"] = C["cortes"][N:]
if "uniones_ok" in C: C["uniones_ok"] = [u - N for u in C["uniones_ok"] if u - N >= 0]
C["broll"] = [dict(r, a=max(0, sh(r["a"])), b=sh(r["b"])) for r in C.get("broll", []) if r["b"] - D > .3]
json.dump(C, open(P("proyecto.json"), "w"), ensure_ascii=False, indent=1)

W = json.load(open(P("words.json"))); segs = []
for s in W["segments"]:
    ws = [dict(w, start=sh(w["start"]), end=sh(w["end"])) for w in s.get("words", []) if w["start"] >= D - .02]
    if not ws: continue
    segs.append(dict(s, start=ws[0]["start"], end=ws[-1]["end"], words=ws, text="".join(w["word"] for w in ws)))
W["segments"] = segs; W["text"] = "".join(s["text"] for s in segs); json.dump(W, open(P("words.json"), "w"), ensure_ascii=False)

K = json.load(open(P("caras.json"))); K["f"] = [[round(f[0] - D, 2), *f[1:]] for f in K["f"] if f[0] >= D - .05]
json.dump(K, open(P("caras.json"), "w"))
F = json.load(open(P("faces.json"))); F = [dict(c, a=max(0, sh(c["a"])), b=sh(c["b"])) for c in F[N:]]
json.dump(F, open(P("faces.json"), "w"))

if os.path.exists(P("flujo.json")):
    FL = json.load(open(P("flujo.json")))
    FL["tomas"] = [dict(t, a=max(0, sh(t["a"])), b=sh(t["b"])) for t in FL["tomas"] if t["b"] - D > .3]
    json.dump(FL, open(P("flujo.json"), "w"), ensure_ascii=False, indent=1)
for f in ("layout.json", "contraste.json"):
    if os.path.exists(P(f)): os.remove(P(f))
print(f"✓ armado de {CJ['fronteras'][-1]:.2f} s · primera frase: {segs[0]['text'].strip()[:70]}")
print("  falta: pages.txt sin lo quitado → flujo.py / stock_encima.py → editar.py terminar")
