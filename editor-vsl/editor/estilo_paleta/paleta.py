"""Estilo de imágenes con la paleta de Saúl: sujeto/objeto principal en BLANCO Y NEGRO y el fondo con la paleta.

Uso:  python paleta.py <entrada.png> <salida.png> [--luz izquierda|derecha|ninguna] [--ancho 1080]

Paleta (de oscuro a claro): #0A0F14 · #0F3D3E · #2E6F73 · #7FB3B8 · #EADCC8 · acento #C6601F (luz naranja)
1. Máscara del sujeto con Vision (./sujeto, foreground instance mask: personas u objetos).
2. Sujeto: blanco y negro con contraste (negros profundos, luces limpias).
3. Fondo: mapa de degradado de su luminosidad → la paleta (sombras #0A0F14 → medios teal → luces crema), un poco más oscuro
   que el sujeto para que éste resalte, y una luz naranja (#C6601F) que entra por un lado (como la referencia de la paleta).
4. Borde suave entre sujeto y fondo, viñeta y grano fino → todo el set se ve de la misma familia aunque venga de fotos distintas.
"""
import sys, os, subprocess, tempfile
import numpy as np, cv2

args = sys.argv[1:]; src, dst = args[0], args[1]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
LUZ = opt("--luz", "izquierda"); ANCHO = int(opt("--ancho", "0"))
AQUI = os.path.dirname(os.path.abspath(__file__))
hexa = lambda h: np.array([int(h[i:i + 2], 16) for i in (5, 3, 1)], np.float32)   # BGR
RAMPA = [(0.00, hexa("#0A0F14")), (0.22, hexa("#0F3D3E")), (0.50, hexa("#2E6F73")), (0.76, hexa("#7FB3B8")), (1.00, hexa("#EADCC8"))]
ACENTO = hexa("#C6601F")

img = cv2.imread(src)
if ANCHO and img.shape[1] != ANCHO: img = cv2.resize(img, (ANCHO, round(img.shape[0] * ANCHO / img.shape[1])), interpolation=cv2.INTER_AREA)
h, w = img.shape[:2]
m_path = os.path.join(tempfile.mkdtemp(), "m.png")
r = subprocess.run([os.path.join(AQUI, "sujeto"), src, m_path], capture_output=True, text=True)
if os.path.exists(m_path):
    m = cv2.resize(cv2.imread(m_path, cv2.IMREAD_GRAYSCALE), (w, h), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
else:
    m = np.zeros((h, w), np.float32)        # sin sujeto (paisaje, textura): toda la imagen va con la paleta
m = cv2.GaussianBlur(m, (0, 0), max(1.5, w / 700))

L = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
# sujeto: B/N con curva S (negros profundos) y un poco de claridad local
cl = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8)).apply((L * 255).astype(np.uint8)).astype(np.float32) / 255
g = .55 * L + .45 * cl
g = np.clip((g - .04) / .94, 0, 1); g = g * g * (3 - 2 * g) * .55 + g * .45           # S suave
suj = np.dstack([g * 255] * 3)

# fondo: luminosidad (más oscura y plana) → rampa de la paleta
lf = np.clip(L * .82, 0, 1) ** 1.15
fondo = np.zeros_like(img, np.float32)
for (a, ca), (b, cb) in zip(RAMPA, RAMPA[1:]):
    t = np.clip((lf - a) / (b - a), 0, 1)[..., None]; sel = ((lf >= a) & (lf <= b))[..., None]
    fondo = np.where(sel, ca * (1 - t) + cb * t, fondo)
# luz naranja que entra por un lado + reflejo teal del otro (como la lámina de la paleta)
if LUZ != "ninguna":
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    lado = 0 if LUZ == "izquierda" else w
    d = np.sqrt(((xx - lado) / (w * .62)) ** 2 + ((yy - h * .40) / (h * .34)) ** 2)
    k = np.clip(1 - d, 0, 1) ** 1.6 * .85
    fondo = fondo * (1 - k[..., None]) + (fondo * .25 + ACENTO * 1.15) * k[..., None]
    d2 = np.sqrt(((xx - (w - lado)) / (w * .62)) ** 2 + ((yy - h * .55) / (h * .36)) ** 2)
    k2 = np.clip(1 - d2, 0, 1) ** 1.6 * .5
    fondo = fondo * (1 - k2[..., None]) + hexa("#7FB3B8")[None, None] * k2[..., None]

out = fondo * (1 - m[..., None]) + suj * m[..., None]
# viñeta + grano fino
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
v = 1 - .38 * np.clip((((xx - w / 2) / (w * .62)) ** 2 + ((yy - h / 2) / (h * .62)) ** 2), 0, 1)
out = out * v[..., None]
out += np.random.default_rng(7).normal(0, 4.5, (h, w, 1)).astype(np.float32)
cv2.imwrite(dst, np.clip(out, 0, 255).astype(np.uint8))
print(f"✓ {os.path.basename(dst)} · sujeto {'sí' if m.max() > .5 else 'no'} ({r.stdout.strip()})")
