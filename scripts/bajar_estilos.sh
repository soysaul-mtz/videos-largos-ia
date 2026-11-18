#!/bin/zsh
# Descarga los 3 videos de referencia (uno por estilo) a referencias/. Son para VERLOS y sacarles fotogramas:
# cada estilo de estilos/ se armó copiando uno de estos. No se usan dentro de tus videos.
# Uso: scripts/bajar_estilos.sh        (si un video ya está completo, no lo vuelve a bajar)
cd "$(dirname "$0")/.."; mkdir -p referencias; mal=0
# archivo | id de Google Drive | tamaño en bytes | estilo
LISTA=(
"Estilo 1 - Neon.mp4|1Lw5FzWTNxnNOJLh36pKkVktq7a4egDUJ|73330476|estilos/neon"
"Estilo 2 - Cinetico.mp4|19BgXfOBsgHkEncNRIMLGyUXhK3ip2C6k|181757152|estilos/cinetico"
"Estilo 3 - Testimonios.mp4|1kFgmsuS5lPCTYO3mGxPVOJbqbBgE0gyh|100122780|estilos/testimonios"
)
for l in $LISTA; do
  n=${l%%|*}; r=${l#*|}; id=${r%%|*}; r=${r#*|}; tam=${r%%|*}; est=${r#*|}; f="referencias/$n"
  if [[ -f "$f" && $(stat -f%z "$f") == $tam ]]; then print -P "%F{green}✓%f $n (ya estaba)"; continue; fi
  print "↓ $n ($((tam/1000000)) MB)…"
  curl -L --fail --retry 3 -# -o "$f.parcial" "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t" || true
  if [[ -f "$f.parcial" && $(stat -f%z "$f.parcial") == $tam ]]; then mv "$f.parcial" "$f"; print -P "%F{green}✓%f $n → guía en $est/ESTILO.md"
  else rm -f "$f.parcial"; print -P "%F{red}✗%f no pude bajar $n. Ábrelo a mano: https://drive.google.com/file/d/$id/view"; mal=1; fi
done
(( mal )) && { echo; echo "Carpeta con los tres videos: https://drive.google.com/drive/folders/16J4kx9TUt7SUzImKWINJEwbl-IF0CwuY"; exit 1; }
echo; echo "Listo: los 3 videos están en referencias/"; open referencias 2>/dev/null
