"""Precalcula t<llave>/energia.npy (dB por bloques de 20 ms, voz en mono 48 kHz) igual que armar.py.  Uso: python3 energia_cache.py c02 c07 ..."""
import sys, os, json, subprocess, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); ARCH = json.load(open(os.path.join(AQUI, "archivos.json")))
for k in sys.argv[1:]:
    out = os.path.join(AQUI, f"t{k}", "energia.npy")
    if os.path.exists(out): continue
    raw = subprocess.run(["/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg", "-v", "error", "-i", os.path.join(os.environ.get("CURSO_FUENTES", os.path.join(AQUI, "fuentes")), ARCH[k]),
                          "-vn", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32); n = 960; m = len(x) // n
    e = 20 * np.log10(np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1)) + 1e-9)
    os.makedirs(os.path.dirname(out), exist_ok=True); np.save(out, e); print(k, round(m * .02 / 60, 1), "min")
