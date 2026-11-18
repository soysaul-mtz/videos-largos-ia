#!/bin/zsh
# Comprueba la instalación y renderiza las demos de los estilos (sin cámara: usan una silueta de muestra).
# Uso: ./verificar.sh   (agrega --sin-render para solo revisar)
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT"
scripts/requisitos.sh || exit 1
[[ "$1" == "--sin-render" ]] && exit 0
for d in proyectos/demo-*/; do
  [[ -f "$d/beats.js" ]] || continue
  print -P "\n%F{cyan}Demo: ${d:t}%f"
  nice -n 10 node motor/render.mjs "$d" || { print -P "%F{red}✗ falló ${d:t}%f"; exit 1; }
done
[[ -f estilos/testimonios/armar.py ]] && { print -P "\n%F{cyan}Demo: testimonios%f"; nice -n 10 .venv/bin/python estilos/testimonios/armar.py estilos/testimonios/demo/demo.json || exit 1; }
print -P "\n%F{green}✓ Todo funciona.%f Las demos quedaron en proyectos/demo-*/salida/"
open proyectos 2>/dev/null
