"""Transcribe un módulo completo de corrido (no por pedazos) con tiempos por palabra.

Las grabaciones de pantalla traen la voz muy baja (≈ −38 dB): se normaliza antes de pasarla a Whisper,
si no, se come sílabas y corta frases.
Uso:  editor-testimoniales/editor/.venv/bin/python transcribir_largo.py <video> <carpeta>
Genera:  audio.wav (16 kHz normalizado) · palabras.json · texto.txt  [mm:ss.s – mm:ss.s] frase
"""
import sys, os, json, subprocess
import mlx_whisper

video, out = os.path.abspath(sys.argv[1]), sys.argv[2]
os.makedirs(out, exist_ok=True); P = lambda f: os.path.join(out, f)
VOC = os.environ.get("VOC", "la instructora, Meta Ads, Business Manager, Administrador de anuncios, píxel, campaña, conjunto de anuncios, remarketing, públicos personalizados, lookalike, CPM, CPC, CTR, CPL, ROAS, leads, webinar, embudo, Claude, ChatGPT, Gemini, Manus.")

wav = P("audio.wav")
if not os.path.exists(wav):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
                    "-af", "highpass=f=80,afftdn=nf=-30,dynaudnorm=f=300:g=15:p=0.9,loudnorm=I=-18",
                    wav], check=True)

r = mlx_whisper.transcribe(wav, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="es",
                           word_timestamps=True, condition_on_previous_text=False, initial_prompt=VOC,
                           no_speech_threshold=0.5, compression_ratio_threshold=2.2)
pal = [{"w": w["word"].strip(), "a": round(w["start"], 2), "b": round(w["end"], 2), "p": round(w.get("probability", 1), 2)}
       for s in r["segments"] for w in s.get("words", []) if w["word"].strip()]
json.dump(pal, open(P("palabras.json"), "w"), ensure_ascii=False)
mmss = lambda t: f"{int(t // 60):02d}:{t % 60:04.1f}"
with open(P("texto.txt"), "w") as f:
    for s in r["segments"]:
        f.write(f"[{mmss(s['start'])} – {mmss(s['end'])}] {s['text'].strip()}\n")
print(f"{os.path.basename(video)}: {len(pal)} palabras")
