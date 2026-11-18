"""Palabras con tiempo + mapa de voz (0.1 s/carácter) de ventanas del original.  Uso: python ventana.py 10 393.5 398.5 460.8 462.5 ..."""
import sys, subprocess, numpy as np, mlx_whisper, wave, tempfile, os
import os as _os; _os.nice(15)   # prioridad baja
src = sys.argv[1]; v = list(map(float, sys.argv[2:]))
for a, b in zip(v[::2], v[1::2]):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-t", str(b - a), "-i", os.environ.get("CURSO_FUENTES", os.path.join(os.path.dirname(os.path.abspath(__file__)), "fuentes")) + "/" + __import__("json").load(open(__import__("os").path.join(__import__("os").path.dirname(__file__), "archivos.json")))[src],
                          "-af", "pan=mono|c0=c1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32); n = 1600
    e = 20 * np.log10(np.sqrt((x[:len(x) // n * n].reshape(-1, n) ** 2).mean(1)) + 1e-9)
    y = x / (np.abs(x).max() + 1e-9) * .9; w = os.path.join(tempfile.mkdtemp(), "w.wav")
    f = wave.open(w, "wb"); f.setnchannels(1); f.setsampwidth(2); f.setframerate(16000); f.writeframes((y * 32767).astype(np.int16).tobytes()); f.close()
    r = mlx_whisper.transcribe(w, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="es", word_timestamps=True, condition_on_previous_text=False)
    print(f"\n{src} {a}-{b}: " + " ".join(f"{q['word'].strip()}[{a + q['start']:.1f}]" for s in r["segments"] for q in s["words"]))
    print("   " + "".join("#" if t > -42 else ("+" if t > -50 else ".") for t in e))
