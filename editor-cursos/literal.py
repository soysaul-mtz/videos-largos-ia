"""Qué se oye en el editado, pedazo por pedazo (separados por silencios ≥0.2 s), para encontrar trabas y repeticiones.
Uso: python literal.py "<video>" t1 t2 ...   (ventana t-10 … t+8)"""
import sys, subprocess, tempfile, os, wave, numpy as np, mlx_whisper
import os as _os; _os.nice(15)   # prioridad baja
src = sys.argv[1]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32); h = 320
e = 20 * np.log10(np.sqrt((x[:len(x) // h * h].reshape(-1, h) ** 2).mean(1)) + 1e-9); thr = np.percentile(e, 95) - 22
for t in map(float, sys.argv[2:]):
    a, b = int(max(0, t - 10) / .02), int((t + 8) / .02); v = e[a:b] > thr
    regs, i = [], 0
    while i < len(v):
        if v[i]:
            j = i
            while j < len(v) and (v[j] or v[j:j + 10].any()): j += 1
            regs.append(((a + i) * .02, (a + j) * .02)); i = j
        else: i += 1
    print(f"\n=== {int(t//60)}:{t%60:04.1f}")
    for ra, rb in regs:
        if rb - ra < .2: continue
        w = os.path.join(tempfile.mkdtemp(), "w.wav"); y = x[int((ra - .1) * 16000):int((rb + .1) * 16000)]
        y = np.concatenate([np.zeros(4000, np.float32), y, np.zeros(4000, np.float32)])
        f = wave.open(w, "wb"); f.setnchannels(1); f.setsampwidth(2); f.setframerate(16000); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); f.close()
        txt = mlx_whisper.transcribe(w, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="es", condition_on_previous_text=False)["text"].strip()
        print(f"  [{int(ra//60)}:{ra%60:04.1f}–{int(rb//60)}:{rb%60:04.1f}] {txt}")
