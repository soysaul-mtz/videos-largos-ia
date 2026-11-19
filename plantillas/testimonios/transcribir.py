#!/usr/bin/env python3
"""Transcribe videos de testimonios para elegir qué pedazos usar.

Uso:   python plantillas/testimonios/transcribir.py <video> [más videos] [--salida carpeta] [--idioma es]
Deja junto a cada video un .txt con las frases y sus segundos, y debajo de cada frase el segundo en que empieza
cada palabra (sirve para poner «de»/«a» en el JSON y los tiempos de los subtítulos).

Whisper corre en esta computadora (mlx-whisper, Mac con chip Apple). No sube nada a internet. Va un video a la vez.
"""
import sys, os, shutil, subprocess, argparse
try: os.nice(15)                        # prioridad baja: la persona sigue usando su computadora
except OSError: pass
import numpy as np

MODELO = "mlx-community/whisper-large-v3-turbo"
PAUSA, MAX_PALABRAS = 0.6, 16            # una pausa así de larga (s) o tantas palabras parten la frase


def buscar_ffmpeg():
    for c in ("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg", "/usr/local/opt/ffmpeg-full/bin/ffmpeg", shutil.which("ffmpeg")):
        if c and os.path.exists(c): return c
    sys.exit("✗ No encontré ffmpeg. Instálalo con: brew install ffmpeg-full")


def frases(palabras):
    """Agrupa palabras [{w, a, b}] en frases: corta en punto, signo de cierre, pausa larga o frase demasiado larga."""
    res, act = [], []
    for i, p in enumerate(palabras):
        act.append(p)
        sig = palabras[i + 1] if i + 1 < len(palabras) else None
        fin = p["w"].rstrip('"»”)').endswith((".", "?", "!", "…"))
        if not sig or fin or sig["a"] - p["b"] >= PAUSA or (len(act) >= MAX_PALABRAS and p["w"].endswith((",", ";", ":"))) or len(act) >= MAX_PALABRAS + 8:
            res.append(act); act = []
    return res


def ajustar_al_sonido(pal, audio, sr=16000):
    """Whisper a veces marca el inicio de una palabra dentro del silencio de antes (o le deja pegada la cola de la
    palabra anterior). Aquí cada palabra se recorre hasta donde de verdad empieza y termina de sonar, para que los
    subtítulos entren junto con la voz."""
    n = sr // 100                                                    # ventanas de 10 milésimas
    m = len(audio) // n
    if m < 10: return pal
    db = 20 * np.log10(np.sqrt((audio[:m * n].reshape(m, n) ** 2).mean(1)) + 1e-7)
    suena = db > max(np.percentile(db, 10) + 12, db.max() - 38)      # por encima del ruido de fondo
    for k, p in enumerate(pal):
        i, j = int(p["a"] * 100), min(m, int(p["b"] * 100) + 1)
        v = np.where(suena[i:j])[0]
        if not len(v): continue
        hueco = np.where(np.diff(v) > 12)[0]                         # silencio de más de 0.12 s dentro de la «palabra»
        if len(hueco):                                               # lo de antes del silencio es la cola de la palabra anterior
            if k: pal[k - 1]["b"] = max(pal[k - 1]["b"], (i + v[hueco[0]] + 1) / 100)
            v = v[hueco[-1] + 1:]
        a, b = (i + v[0]) / 100, (i + v[-1] + 1) / 100
        if a - p["a"] > 0.08: p["a"] = a
        if p["b"] - b > 0.08: p["b"] = max(b, p["a"] + 0.05)
    return pal


def transcribir(video, salida, idioma, modelo, ff):
    import mlx_whisper
    # la voz de videollamada suele venir baja: se empareja antes de pasarla a Whisper para que no se coma sílabas
    r = subprocess.run([ff, "-v", "error", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
                        "-af", "highpass=f=80,dynaudnorm=f=300:g=15:p=0.9", "-f", "f32le", "-"], capture_output=True)
    if r.returncode != 0 or not r.stdout:
        print(f"✗ {os.path.basename(video)}: no se pudo leer el sonido ({r.stderr.decode(errors='replace').strip()[-200:]})"); return None
    audio = np.frombuffer(r.stdout, np.float32)
    t = mlx_whisper.transcribe(audio, path_or_hf_repo=modelo, language=idioma, word_timestamps=True,
                               condition_on_previous_text=False, no_speech_threshold=0.5, compression_ratio_threshold=2.2)
    pal = [dict(w=w["word"].strip(), a=float(w["start"]), b=float(w["end"])) for s in t["segments"] for w in s.get("words", []) if w["word"].strip()]
    pal = ajustar_al_sonido(pal, audio)
    destino = os.path.join(salida or os.path.dirname(video), os.path.splitext(os.path.basename(video))[0] + ".txt")
    with open(destino, "w", encoding="utf-8") as f:
        f.write(f"# {os.path.basename(video)} · {len(audio) / 16000:.1f} s · {len(pal)} palabras\n")
        f.write("# [inicio – fin] (duración) frase      y debajo: segundo en que empieza cada palabra\n\n")
        for fr in frases(pal):
            a, b = fr[0]["a"], fr[-1]["b"]
            f.write(f"[{a:7.2f} – {b:7.2f}] ({b - a:4.1f} s)  {' '.join(p['w'] for p in fr)}\n")
            f.write("      " + " · ".join(f"{p['a']:.2f} {p['w']}" for p in fr) + f" · fin {b:.2f}\n\n")
    print(f"✓ {os.path.basename(video)}: {len(pal)} palabras → {destino}")
    return destino


def main():
    ap = argparse.ArgumentParser(description="Transcribe testimonios con Whisper local: frases con sus segundos.")
    ap.add_argument("videos", nargs="+")
    ap.add_argument("--salida", help="carpeta donde dejar los .txt (por defecto, junto a cada video)")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--modelo", default=MODELO)
    a = ap.parse_args()
    try: import mlx_whisper  # noqa: F401
    except ImportError: sys.exit("✗ Falta mlx-whisper. Corre ./instalar.sh (o: .venv/bin/pip install -r requirements.txt). Solo funciona en Mac con chip Apple.")
    if a.salida: os.makedirs(a.salida, exist_ok=True)
    ff, mal = buscar_ffmpeg(), 0
    for v in a.videos:                                              # uno por uno: nunca dos transcripciones a la vez
        if not os.path.exists(v): print(f"✗ No existe {v}"); mal += 1; continue
        if not transcribir(os.path.abspath(v), a.salida, a.idioma, a.modelo, ff): mal += 1
    sys.exit(1 if mal else 0)

if __name__ == "__main__":
    main()
