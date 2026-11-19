#!/bin/zsh
# Doble clic en Finder: abre la interfaz en el navegador. Deja esta ventana abierta mientras la uses.
cd "$(dirname "$0")" || exit 1
exec ./abrir.sh
