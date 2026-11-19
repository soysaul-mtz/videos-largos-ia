#!/bin/zsh
# Prepara un video (o una imagen) para estudiarlo y crear una plantilla nueva a partir de él.
# Todo queda en plantillas/<id>/referencia/, que NO se sube al repositorio: es solo para estudiar en esta computadora.
# Uso: scripts/desglosar.sh </ruta/al/video.mp4 | /ruta/a/imagen.png> <id-de-la-plantilla-nueva>
cd "$(dirname "$0")/.."
F="$1"; ID="$2"
[[ -f "$F" && -n "$ID" ]] || { echo 'Uso: scripts/desglosar.sh <video o imagen> <id-de-la-plantilla>   (id corto, sin espacios: p. ej. documental)'; exit 1; }
[[ "$ID" =~ '^[a-z0-9-]+$' ]] || { echo "✗ El id solo lleva minúsculas, números y guiones: $ID"; exit 1; }
FF=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg; [[ -x $FF ]] || FF=ffmpeg
D="plantillas/$ID"; R="$D/referencia"
if [[ ! -f "$D/estilo.js" ]]; then mkdir -p "$D" && cp plantillas/_plantilla/estilo.js plantillas/_plantilla/estilo.css "$D/" && echo "✓ plantilla nueva creada a partir de plantillas/_plantilla: $D"; fi
mkdir -p "$R/hojas" "$R/fotos"
case "${F:e:l}" in
  png|jpg|jpeg|webp|heic)
    sips -s format jpeg "$F" --out "$R/fotos/imagen.jpg" >/dev/null && echo "✓ imagen copiada a $R/fotos/imagen.jpg"
    echo "Sigue: mírala con atención y escribe $D/ESTILO.md (colores medidos, tipografía, composición, qué se movería y cómo)." ;;
  *)
    DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F"); echo "Video de ${DUR%.*} s"
    echo "1/3 hojas de cuadros con reloj (4 por segundo)…"
    nice -n 15 $FF -v error -y -i "$F" -vf "fps=4,scale=512:-2,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.65,tile=6x5:padding=3:margin=3" -q:v 4 "$R/hojas/c_%03d.jpg" </dev/null \
      || nice -n 15 $FF -v error -y -i "$F" -vf "fps=4,scale=512:-2,tile=6x5:padding=3:margin=3" -q:v 4 "$R/hojas/c_%03d.jpg" </dev/null
    echo "2/3 cortes…"
    nice -n 15 $FF -v error -i "$F" -vf "scale=320:-2,select='gt(scene,0.30)',metadata=print:file=$R/cortes.txt" -an -f null - </dev/null
    grep -o 'pts_time:[0-9.]*' "$R/cortes.txt" | cut -d: -f2 | tr '\n' ' ' > "$R/cortes_seg.txt"
    echo "3/3 lo que se dice, con tiempos…"
    .venv/bin/python - "$F" "$R/transcripcion.txt" <<'PY'
import sys, subprocess, tempfile, os
src, out = sys.argv[1:3]; wav = os.path.join(tempfile.mkdtemp(), 'a.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
import mlx_whisper
r = mlx_whisper.transcribe(wav, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language=os.environ.get('IDIOMA', 'es'), condition_on_previous_text=False)
open(out, 'w').write(''.join(f"{s['start']:7.2f}-{s['end']:7.2f}  {s['text'].strip()}\n" for s in r['segments']))
PY
    ln -sf "${F:A}" "$R/fuente.${F:e}"
    echo "✓ Listo: $(ls $R/hojas | wc -l | tr -d ' ') hojas (cada una = 7.5 s), $(wc -w < $R/cortes_seg.txt | tr -d ' ') cortes y la transcripción, en $R/"
    echo "Sigue (CLAUDE.md › Crear una plantilla nueva): lee TODAS las hojas, saca fotos a tamaño completo de cada pieza distinta"
    echo "  ($FF -ss <seg> -i $R/fuente.${F:e} -frames:v 1 $R/fotos/t_<seg>.jpg), mide colores y escribe $D/ESTILO.md." ;;
esac
