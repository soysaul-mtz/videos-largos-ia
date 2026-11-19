#!/bin/zsh
# Empieza un video nuevo con una plantilla larga: crea su carpeta en proyectos/ con el proyecto en blanco de esa plantilla.
# Uso: scripts/nuevo.sh <neon|cinetico|testimonios> "<nombre del video>" [/ruta/al/video-ya-cortado.mp4]
cd "$(dirname "$0")/.."
P="$1"; N="$2"; V="$3"
if [[ -z "$P" || -z "$N" ]]; then
  echo 'Uso: scripts/nuevo.sh <plantilla> "<nombre del video>" [video ya cortado]'; echo "Plantillas:"; for d in plantillas/*/base(N); do echo "  ${d:h:t}"; done; exit 1
fi
[[ -d "plantillas/$P/base" ]] || { print -P "%F{red}✗%f No existe la plantilla «$P». Las que hay:"; for d in plantillas/*/base(N); do echo "  ${d:h:t}"; done; exit 1; }
C=$(echo "$N" | iconv -f utf-8 -t ascii//TRANSLIT 2>/dev/null | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//'); [[ -n "$C" ]] || C="video"
D="proyectos/$C"
[[ -e "$D" ]] && { print -P "%F{red}✗%f Ya existe $D. Usa otro nombre para no encimar un video."; exit 1; }
mkdir -p "$D" && cp -R "plantillas/$P/base/." "$D/" && mkdir -p "$D/img"
if [[ -f "$D/proyecto.json" ]]; then
  FUENTE="null"; [[ -n "$V" ]] && { [[ -f "$V" ]] || { print -P "%F{red}✗%f No encuentro el video: $V"; exit 1; }; FUENTE="\"${V:A}\""; }
  .venv/bin/python - "$D/proyecto.json" "$N" "$FUENTE" <<'PY'
import json, sys
f, nombre, fuente = sys.argv[1:4]; d = json.load(open(f)); d["nombre"] = nombre; d["fuente"] = json.loads(fuente)
if d["fuente"]: d.pop("dur", None)   # con video real, la duración sale del video
json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
PY
fi
print -P "%F{green}✓%f Proyecto creado: $D  (plantilla $P)"
echo "Sigue así:"
echo "  1. Lee plantillas/$P/ESCALETA-BASE.md y plantillas/$P/ESTILO.md"
if [[ "$P" == "testimonios" ]]; then
  echo "  2. Rellena $D/compilado.json y enseña el plan:  .venv/bin/python plantillas/testimonios/armar.py $D/compilado.json --plan"
else
  [[ -n "$V" ]] && echo "  2. Prepara el video:  .venv/bin/python motor/preparar.py $D   (agrega --mascaras si la plantilla pone texto detrás de la persona)"
  echo "  3. Escribe la escaleta con la transcripción, enséñala y espera el «sí»"
  echo "  4. Rellena $D/beats.js y saca las fotos:  node motor/render.mjs $D --fotos 3,12,30"
fi
