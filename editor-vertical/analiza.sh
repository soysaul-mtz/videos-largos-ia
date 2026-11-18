#!/bin/zsh
# Analiza un video: cortes de toma (scdet), caras + texto quemado en cada 2º fotograma (Vision), transcripción.
n=$1; v=$(python3 -c "import json;print(json.load(open('fuentes.json'))['$n'])"); mkdir -p $n
ffmpeg -v error -i "$v" -vf "scale=480:-1,scdet=threshold=12,metadata=print:file=$n/cortes.txt" -an -f null - 
../editor-testimoniales/editor/bin/fotogramas "$v" $n/fotogramas.json 2 > /dev/null
../editor-testimoniales/editor/.venv/bin/python transcribe.py "$v" $n/palabras.json
echo LISTO > $n/listo
