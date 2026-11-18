"""Clasifica cada cuadro (4 por segundo) como cámara (David a cuadro completo) o pantalla.
Uso: python3 clasificar.py <video> <salida.json>
Señal: en pantalla completa de cámara, la franja izquierda (pared/piso) es azul saturado y cambia poco;
en la grabación de pantalla, esa franja es la ventana del navegador/VS Code."""
import sys, json, subprocess, numpy as np
src, out = sys.argv[1], sys.argv[2]
W, H, FPS = 64, 36, 4
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True, check=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(float)
izq = f[:, 8:30, 0:10]                                    # franja izquierda
r, g, b = izq[..., 0].mean((1, 2)), izq[..., 1].mean((1, 2)), izq[..., 2].mean((1, 2))
azul = b - (r + g) / 2                                    # cámara: pared azul → alto
dock = f[:, 33:36, 12:52].std((1, 2, 3))                  # pantalla: dock de macOS abajo con íconos de colores
json.dump({"fps": FPS, "azul": azul.round(1).tolist(), "dock": dock.round(1).tolist()}, open(out, "w"))
print(src, len(f), "cuadros")
