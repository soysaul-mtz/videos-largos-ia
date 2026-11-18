"""Transcripción literal de TODO el editado, pedazo por pedazo (silencios ≥0.2 s). Marca los cortes.
Uso: python literal_todo.py modN   → revision/modN_texto.txt"""
import sys, json, subprocess, tempfile, os, wave, numpy as np, mlx_whisper
import os as _os; _os.nice(15)   # prioridad baja
m = sys.argv[1]; src = os.path.join(os.environ.get("CURSO_FUENTES", "fuentes"), "Editados") + "/" + json.load(open(f"{m}.json"))["salida"]
segs = json.load(open(f"_render/{m}/segmentos.json")); cortes = [8.0 + s["t0"] for s in segs]   # + intro
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32); h = 320
e = 20 * np.log10(np.sqrt((x[:len(x) // h * h].reshape(-1, h) ** 2).mean(1)) + 1e-9); v = e > np.percentile(e, 95) - 22
regs, i = [], 0
while i < len(v):
    if v[i]:
        j = i
        while j < len(v) and (v[j] or v[j:j + 10].any()): j += 1
        if (j - i) * .02 >= .15: regs.append((i * .02, j * .02))
        i = j
    else: i += 1
mm = lambda t: f"{int(t // 60)}:{t % 60:04.1f}"
out = open(f"revision/{m}_texto.txt", "w")
for ra, rb in regs:
    w = os.path.join(tempfile.mkdtemp(), "w.wav"); y = x[max(0, int((ra - .1) * 16000)):int((rb + .1) * 16000)]
    y = np.concatenate([np.zeros(4000, np.float32), y, np.zeros(4000, np.float32)])
    f = wave.open(w, "wb"); f.setnchannels(1); f.setsampwidth(2); f.setframerate(16000); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); f.close()
    txt = mlx_whisper.transcribe(w, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="es", condition_on_previous_text=False)["text"].strip()
    dentro = [c for c in cortes if ra + .05 < c < rb - .05]
    out.write(f"[{mm(ra)}–{mm(rb)}]{' ✂' + ','.join(mm(c) for c in dentro) if dentro else ''} {txt}\n")
out.close(); print(m, len(regs), "pedazos")
