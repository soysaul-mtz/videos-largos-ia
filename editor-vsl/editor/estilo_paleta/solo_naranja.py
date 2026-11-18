"""Todo en blanco y negro salvo la luz naranja (como la referencia del flujo): python solo_naranja.py <entrada> <salida>"""
import sys, numpy as np, cv2
img = cv2.imread(sys.argv[1]); hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
h, s, v = hsv[..., 0], hsv[..., 1] / 255, hsv[..., 2] / 255
naranja = np.clip(1 - np.abs(h - 13) / 10, 0, 1)                       # tono naranja (OpenCV 0–180)
m = naranja * np.clip((s - .35) / .3, 0, 1) * np.clip((v - .32) / .25, 0, 1)
m = cv2.GaussianBlur(m, (0, 0), 3)[..., None]
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
g = np.clip((g - 6) * 1.12, 0, 255)                                      # negros más profundos
gris = np.dstack([g, g, g])
teal = np.array([62, 61, 15], np.float32)                               # #0F3D3E en BGR → solo en las sombras
k = np.clip(1 - g / 90, 0, 1)[..., None] * .35
gris = gris * (1 - k) + teal * k
naranja_c = img.astype(np.float32) * np.array([.85, .95, 1.1])          # el naranja un poco más vivo
out = gris * (1 - m) + naranja_c * m
cv2.imwrite(sys.argv[2], np.clip(out, 0, 255).astype(np.uint8))
