import os
"""Transcribe un video con Whisper mlx (palabras con tiempo). Uso: transcribe.py video salida.json"""
import sys, json, mlx_whisper
r = mlx_whisper.transcribe(sys.argv[1], path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="es",
                           word_timestamps=True, condition_on_previous_text=False,
                           initial_prompt=os.environ.get("VOCABULARIO") or None)
json.dump({"text": r["text"], "segments": [{"start": s["start"], "end": s["end"], "text": s["text"],
           "words": [{"w": w["word"], "s": w["start"], "e": w["end"]} for w in s.get("words", [])]} for s in r["segments"]]},
          open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
