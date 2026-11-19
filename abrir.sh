#!/bin/zsh
# Abre la interfaz local (menú de plantillas, Nuevo video, Mis videos, Nueva plantilla) en el navegador.
# Uso: ./abrir.sh      Si ya estaba abierta, solo vuelve a abrir el navegador.
cd "$(dirname "$0")" || exit 1
if [[ -x .venv/bin/python ]]; then PY=.venv/bin/python
elif command -v python3 >/dev/null; then PY=python3
else echo "Falta Python 3. Sigue INSTALAR.md (o corre ./instalar.sh) y vuelve a intentarlo."; exit 1; fi
exec "$PY" interfaz/servidor.py "$@"
