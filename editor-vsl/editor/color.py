"""Corrección de color de la cámara del armado (balance de blancos por la piel + un poco de contraste), antes del stock.

Uso:  .venv/bin/python color.py <proyecto> [--fuerza 0.8] [--ver]

La cámara DJI a veces graba azulada (Saúl, 9 nov 2026: «se ve un poco azul la toma»). El balance se mide en la PIEL, no en la
pared: con paredes azules o rojas un balance de mundo gris se iría de color. En ~16 cuadros se toma el centro de la cara
(caras.json: mejillas y nariz) y se mide su tono en el vectorscopio (Cb/Cr); la piel de cualquier tono cae sobre la «línea de
piel» (~123°). La diferencia se convierte en ganancias R/G/B (sin cambiar la luminancia de la piel, cada una entre 0.88 y 1.12)
y se aplica a todo el cuadro con un toque de contraste y saturación (sin velo claro: Saúl no quiere que se vea lavado).

Trabaja sobre _corte_sin_broll.mp4 (o corte.mp4 si no hay stock); el original queda en _cam_sin_color.mp4 y se parte de él
si ya existe (correrlo dos veces no corrige doble). Si hay stock, rehace corte.mp4 con stock_encima.py.
--ver: solo mide y escribe color_antes_despues.jpg, sin tocar el video.
"""
import sys, os, json, math, shutil, subprocess
import numpy as np, cv2
import conf

proj = os.path.abspath(sys.argv[1]); P = lambda f: os.path.join(proj, f)
args = sys.argv[2:]; FUERZA = float(args[args.index("--fuerza") + 1]) if "--fuerza" in args else .8; VER = "--ver" in args
LINEA_PIEL, GMIN, GMAX = 123.0, .88, 1.12
EQ = "eq=contrast=1.04:saturation=1.06"
con_stock = os.path.exists(P("_corte_sin_broll.mp4")); dst = P("_corte_sin_broll.mp4") if con_stock else P("corte.mp4")
orig, ok = P("_cam_sin_color.mp4"), P("_color.ok")
# armado nuevo (o nunca corregido): el original es lo que hay ahora; si ya se corrigió, se parte del original guardado
if not os.path.exists(orig) or not os.path.exists(ok) or os.path.getmtime(dst) > os.path.getmtime(ok): shutil.copyfile(dst, orig)

caras = json.load(open(P("caras.json"))); fr = [f for f in caras["f"] if f and len(f) >= 5 and f[3] - f[1] > 60]
if not fr: sys.exit("✗ color: no hay caras en caras.json")
cap = cv2.VideoCapture(orig); muestras = []
for f in [fr[int(i)] for i in np.linspace(0, len(fr) - 1, min(16, len(fr)))]:
    t, x0, y0, x1, y1 = f[:5]; cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); leido, im = cap.read()
    if not leido: continue
    w, h = x1 - x0, y1 - y0
    roi = im[int(y0 + h * .4):int(y0 + h * .75), int(x0 + w * .28):int(x1 - w * .28)].reshape(-1, 3).astype(float)
    if len(roi) < 50: continue
    lum = roi.mean(1); roi = roi[(lum > np.percentile(lum, 20)) & (lum < np.percentile(lum, 95))]   # sin sombras ni brillos
    muestras.append(roi.mean(0)[::-1])                      # BGR → RGB
cap.release()
if len(muestras) < 4: sys.exit("✗ color: muy pocas muestras de piel")
R, G, B = np.median(muestras, 0)
Y = .299 * R + .587 * G + .114 * B; U = (B - Y) * .564; V = (R - Y) * .713
ang = math.degrees(math.atan2(V, U)); mag = math.hypot(U, V)
d = math.radians(LINEA_PIEL - ang) * FUERZA
U2 = mag * math.cos(math.radians(ang) + d); V2 = mag * math.sin(math.radians(ang) + d)
R2 = Y + V2 / .713; B2 = Y + U2 / .564; G2 = (Y - .299 * R2 - .114 * B2) / .587
g = np.clip(np.array([R2 / R, G2 / G, B2 / B]), GMIN, GMAX)
g[1] = min(g[1], 1.02)                                    # más verde pinta de verdoso las paredes grises: mejor más cálido
g = g * Y / (.299 * R * g[0] + .587 * G * g[1] + .114 * B * g[2])          # misma luminancia en la piel
VF = f"colorchannelmixer=rr={g[0]:.4f}:gg={g[1]:.4f}:bb={g[2]:.4f},{EQ}"
print(f"color: piel RGB {R:.0f}/{G:.0f}/{B:.0f} · tono {ang:.0f}° (línea de piel {LINEA_PIEL:.0f}°) · ganancias R {g[0]:.3f} G {g[1]:.3f} B {g[2]:.3f}")

t = fr[len(fr) // 2][0]
ims = []
for vf in (None, VF):
    out = P("_color_tmp.jpg")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", orig, "-frames:v", "1", *(["-vf", vf] if vf else []), out], check=True)
    ims.append(cv2.resize(cv2.imread(out), (405, 720))); os.remove(out)
cv2.imwrite(P("color_antes_despues.jpg"), np.hstack(ims))
json.dump({"piel_rgb": [R, G, B], "tono": ang, "ganancias": g.tolist(), "filtro": VF}, open(P("color.json"), "w"), indent=1)
if VER: sys.exit(print("→ mira color_antes_despues.jpg (izquierda antes, derecha después)"))

subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", orig, "-vf", VF, "-c:v", "libx264", "-crf", "16", "-preset", "medium",
                "-c:a", "copy", "-movflags", "+faststart", dst], check=True)
open(ok, "w").write("ok")
print(f"✓ color corregido → {os.path.basename(dst)}")
if con_stock: subprocess.run([os.path.join(conf.HERE, ".venv", "bin", "python"), os.path.join(conf.HERE, "stock_encima.py"), proj], check=True)
