#!/bin/zsh
# Revisa qué tiene esta Mac de lo que usa el sistema de videos largos y dice el comando EXACTO de lo que falte.
# No instala nada. Uso: scripts/requisitos.sh   (se puede correr las veces que quieras)
cd "$(dirname "$0")/.."; falta=0
si() { print -P "%F{green}✓%f $1"; }
no() { print -P "%F{red}✗%f $1\n    → $2"; falta=$((falta+1)); }
[[ "$(uname -m)" == "arm64" ]] && si "Mac con chip Apple" || no "Mac con chip Apple (M1 o más nuevo): la transcripción local lo necesita" "en Mac Intel o Windows: ver INSTALAR.md › Otras computadoras"
xcode-select -p >/dev/null 2>&1 && si "Herramientas de línea de comandos de Apple (git y swift)" || no "Herramientas de línea de comandos de Apple" "xcode-select --install"
command -v brew >/dev/null && si "Homebrew" || no "Homebrew (instala los demás programas)" '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
command -v ffmpeg >/dev/null && si "ffmpeg" || no "ffmpeg (video y audio)" "brew install ffmpeg"
[ -x /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg ] && si "ffmpeg completo (subtítulos de cursos y testimonios)" || no "ffmpeg completo" "brew install ffmpeg-full"
command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] && si "Node $(node -v)" || no "Node 20 o más nuevo (motor de render)" "brew install node"
[ -x /opt/homebrew/bin/python3.13 ] && si "Python 3.13" || no "Python 3.13" "brew install python@3.13"
[ -d "/Applications/Google Chrome.app" ] && si "Google Chrome (el motor dibuja con Chrome)" || no "Google Chrome" "brew install --cask google-chrome"
libre=$(df -g . | awk 'NR==2{print $4}'); (( libre >= 15 )) && si "Espacio libre: ${libre} GB" || print -P "%F{yellow}·%f Espacio libre: ${libre} GB (un video de 10 min ocupa ≈ 6 GB mientras se edita; libera espacio antes de un video largo)"
if (( falta )); then echo; echo "Faltan $falta programa(s). ./instalar.sh los instala (solo los que faltan) o instálalos con su comando."; exit 1; fi
p=0
.venv/bin/python -c 'import mlx_whisper, cv2, numpy, scipy, PIL' 2>/dev/null && si "Python del sistema + Whisper local" || p=1
[ -d motor/node_modules/puppeteer-core ] && si "motor de render" || p=1
[ -x bin/segmentar ] && [ -x editor-vsl/editor/bin/caras ] && si "herramientas de visión (cara y silueta)" || p=1
[ -f audio/sfx/whoosh_rapido.mp3 ] && si "efectos de sonido básicos" || p=1
if (( p )); then echo; print -P "%F{red}✗%f Falta preparar esta carpeta (≈ 5 min; la primera vez baja ≈ 1.6 GB del modelo de transcripción)\n    → ./instalar.sh"; exit 1; fi
echo; echo "Todo listo. Prueba: ./verificar.sh"
