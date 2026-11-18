#!/bin/zsh
# Instala SOLO lo que falte para editar videos largos. Uso: ./instalar.sh   (se puede correr varias veces)
# Requisitos: Mac con chip Apple (M1 o más nuevo) y macOS 14 o más nuevo.
set -e
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT"
ok()   { print -P "%F{green}✓%f $1"; }
paso() { print -P "\n%F{cyan}▸ $1%f"; }
aviso(){ print -P "%F{yellow}⚠ $1%f"; }
[[ "$(uname -m)" == "arm64" ]] || aviso "Esta Mac no tiene chip Apple: la transcripción local y la silueta de la persona no van a funcionar."

paso "1/7 Herramientas de línea de comandos de Apple"
if xcode-select -p >/dev/null 2>&1; then ok "ya estaban"; else xcode-select --install || true; aviso "Termina la instalación que se abrió y vuelve a correr ./instalar.sh"; exit 1; fi

paso "2/7 Homebrew"
if ! command -v brew >/dev/null; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; eval "$(/opt/homebrew/bin/brew shellenv)"
fi
ok "brew $(brew --version | head -1 | awk '{print $2}')"

paso "3/7 Programas: ffmpeg, Node y Python (solo los que falten)"
for p in ffmpeg ffmpeg-full node python@3.13; do
  if brew list --formula "$p" >/dev/null 2>&1; then ok "$p ya estaba"; else brew install "$p" && ok "$p instalado"; fi
done

paso "4/7 Google Chrome"
if [[ -d "/Applications/Google Chrome.app" ]]; then ok "ya estaba"; else brew install --cask google-chrome; fi

paso "5/7 Python de esta carpeta (.venv) + transcripción local"
[[ -d .venv ]] || /opt/homebrew/bin/python3.13 -m venv .venv
.venv/bin/pip install -q --upgrade pip && .venv/bin/pip install -q -r requirements.txt
ok "paquetes de Python"
print "   bajando el modelo de transcripción (≈ 1.6 GB, solo la primera vez)…"
.venv/bin/python -c "from huggingface_hub import snapshot_download as d; d('mlx-community/whisper-large-v3-turbo')" >/dev/null 2>&1 && ok "modelo listo" || aviso "no se pudo bajar ahora; se baja solo la primera vez que transcribas"

paso "6/7 Motores de render"
for d in motor editor-vsl/editor editor-vertical; do
  [[ -f "$d/package.json" ]] && (cd "$d" && npm install --silent --no-audit --no-fund >/dev/null) && ok "$d"
done

paso "7/7 Herramientas de visión y efectos de sonido"
mkdir -p bin editor-vsl/editor/bin
swiftc -O motor/segmentar.swift -o bin/segmentar 2>/dev/null && ok "bin/segmentar (silueta de la persona)" || aviso "no se pudo compilar bin/segmentar"
T=editor-vsl/editor
for h in caras sdr fotogramas; do swiftc -O $T/$h.swift -o $T/bin/$h 2>/dev/null && ok "$T/bin/$h" || aviso "no se pudo compilar $h"; done
[[ -e $T/.venv ]] || ln -s ../../.venv $T/.venv
.venv/bin/python audio/efectos_basicos.py >/dev/null && ok "audio/sfx (efectos básicos libres de derechos)"
mkdir -p $T/sfx; [[ -f $T/sfx/whoosh.wav ]] || ffmpeg -v error -y -i audio/sfx/whoosh_rapido.mp3 $T/sfx/whoosh.wav || true

print -P "\n%F{green}Listo.%f Sigue con: ./verificar.sh   y después scripts/bajar_estilos.sh (los 3 videos de referencia)."
