"""Recorte (PNG con transparencia: personas + mesa + objetos, todo el grupo) → lámina con la paleta de Saúl, 1080×1920.

Uso:  python componer.py <recorte.png|-> <salida.png> [--luz izquierda|derecha] [--escala 0.86] [--y 0.56] [--fondo lamina.png]
      --fondo: pone el recorte ENCIMA de otra lámina ya hecha (collage en capas, el objeto que "entra" sobre la imagen anterior)
      recorte "-": solo el fondo con la paleta (para objetos sueltos o pantallas)

- Fondo de estudio con la paleta (como la lámina de referencia): negro #0A0F14 → petróleo #0F3D3E, luz NARANJA #C6601F fuerte
  de un lado, reflejo teal #2E6F73/#7FB3B8 del otro, piso apenas marcado y bruma.
- El recorte va en BLANCO Y NEGRO con contraste, con sombra suave en el piso y un filo de luz naranja del lado de la luz
  (lo integra al fondo sin pintarlo).
- Grano fino + viñeta. Sale listo para imagenes51.py ("archivo").
"""
import sys
import numpy as np, cv2

args = sys.argv[1:]; src, dst = args[0], args[1]
opt = lambda k, d: type(d)(args[args.index(k) + 1]) if k in args else d
LUZ = opt("--luz", "izquierda"); ESC = opt("--escala", .86); CY = opt("--y", .56); FONDO = opt("--fondo", "")
W, H = 1080, 1920
hexa = lambda h: np.array([int(h[i:i + 2], 16) for i in (5, 3, 1)], np.float32)
NEGRO, PETROLEO, TEAL, CELESTE, CREMA, NARANJA = map(hexa, ("#0A0F14", "#0F3D3E", "#2E6F73", "#7FB3B8", "#EADCC8", "#C6601F"))

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
izq = LUZ == "izquierda"; lx, ox = (0, W) if izq else (W, 0)
# fondo: degradado vertical oscuro + luces
t = (yy / H)[..., None]
fondo = NEGRO * (1 - t * .7) + PETROLEO * (t * .7)
glow = lambda cx, cy, rx, ry, p: np.clip(1 - np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2), 0, 1) ** p
kn = glow(lx, H * .40, W * .85, H * .42, 1.5)[..., None]                  # luz naranja grande
kn2 = glow(lx, H * .40, W * .30, H * .16, 1.2)[..., None]                 # su núcleo más brillante
kt = glow(ox, H * .50, W * .75, H * .40, 1.6)[..., None]                  # reflejo teal
fondo = fondo * (1 - kn * .9) + NARANJA * 1.05 * kn * .9
fondo = fondo + (CREMA - fondo) * kn2 * .55
fondo = fondo * (1 - kt * .7) + (TEAL * .6 + CELESTE * .4) * kt * .7
piso = np.clip((yy - H * .80) / (H * .2), 0, 1)[..., None]                # piso: un poco más claro y con reflejo naranja
fondo = fondo * (1 - piso * .25) + (PETROLEO * .7 + NARANJA * .3) * piso * .25

if FONDO:
    f = cv2.imread(FONDO); fh, fw = f.shape[:2]; k = max(W / fw, H / fh)
    f = cv2.resize(f, (round(fw * k), round(fh * k))); oy, ox = (f.shape[0] - H) // 2, (f.shape[1] - W) // 2
    fondo = f[oy:oy + H, ox:ox + W].astype(np.float32) * .78          # la de abajo se oscurece un poco para que la nueva resalte
if src == "-":
    out = fondo * (1 - .35 * np.clip(((xx - W / 2) / (W * .65)) ** 2 + ((yy - H / 2) / (H * .65)) ** 2, 0, 1))[..., None]
    cv2.imwrite(dst, np.clip(out + np.random.default_rng(3).normal(0, 4.5, (H, W, 1)), 0, 255).astype(np.uint8)); sys.exit(print("✓", dst))
# recorte en B/N
rgba = cv2.imread(src, cv2.IMREAD_UNCHANGED)
if rgba.shape[2] == 3: rgba = np.dstack([rgba, np.full(rgba.shape[:2], 255, np.uint8)])
ys, xs = np.where(rgba[..., 3] > 20)
rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
h0, w0 = rgba.shape[:2]; s = min(W * ESC / w0, H * .78 / h0)
rgba = cv2.resize(rgba, (round(w0 * s), round(h0 * s)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
h1, w1 = rgba.shape[:2]; x0 = (W - w1) // 2; y0 = int(np.clip(H * CY - h1 / 2, 40, H - h1 - 40))
a = rgba[..., 3].astype(np.float32) / 255
L = cv2.cvtColor(rgba[..., :3], cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
cl = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8)).apply((L * 255).astype(np.uint8)).astype(np.float32) / 255
g = .5 * L + .5 * cl; g = np.clip((g - .03) / .95, 0, 1); g = g * g * (3 - 2 * g) * .6 + g * .4
A = np.zeros((H, W), np.float32); A[y0:y0 + h1, x0:x0 + w1] = a
G = np.zeros((H, W), np.float32); G[y0:y0 + h1, x0:x0 + w1] = g
# sombra en el piso bajo el recorte
sh = cv2.GaussianBlur(A, (0, 0), 28); sh = np.roll(sh, 22, axis=0)
out = fondo * (1 - sh[..., None] * .55)
suj = np.dstack([G * 255] * 3)
# filo de luz naranja del lado de la luz: borde del recorte desplazado hacia la luz
dx = -14 if izq else 14
borde = np.clip(A - np.roll(cv2.GaussianBlur(A, (0, 0), 3), dx, axis=1), 0, 1)
borde = cv2.GaussianBlur(borde, (0, 0), 4) * 1.6
suj = suj * (1 - np.clip(borde, 0, 1)[..., None] * .6) + NARANJA * 1.25 * np.clip(borde, 0, 1)[..., None] * .6
out = out * (1 - A[..., None]) + suj * A[..., None]
v = 1 - (.12 if FONDO else .35) * np.clip(((xx - W / 2) / (W * .65)) ** 2 + ((yy - H / 2) / (H * .65)) ** 2, 0, 1)
out = out * v[..., None] + np.random.default_rng(3).normal(0, 4.5, (H, W, 1)).astype(np.float32)
cv2.imwrite(dst, np.clip(out, 0, 255).astype(np.uint8))
print("✓", dst)
