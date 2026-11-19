#!/bin/bash
# Fabrica el material de MUESTRA de la demo (todo sintético: no usa videos ni voces de nadie).
#   3 «testimonios»: uno horizontal, uno vertical de celular y uno tipo videollamada, con voz sintética de macOS
#   4 videos de «evento» con 3 escenas cada uno (para las tomas de apoyo), el logo de cierre, música y un efecto
# Uso: plantillas/testimonios/demo/hacer_material.sh      (armar.py lo corre solo si falta demo/material/)
# Las frases de cada voz se colocan en segundos fijos; por eso los subtítulos de demo.json caen bien con cualquier voz.
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$AQUI/../../.." && pwd)"
M="$AQUI/material"; P="$M/piezas"; mkdir -p "$P"
FF="${FFMPEG:-}"; [ -x "$FF" ] || FF=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg; [ -x "$FF" ] || FF="$(command -v ffmpeg)"
PY="${PYTHON:-}"; [ -x "$PY" ] || PY="$REPO/.venv/bin/python"; [ -x "$PY" ] || PY="$(command -v python3)"
ff() { nice -n 15 "$FF" -v error -y "$@"; }
X264="-c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -r 30"

echo "· rótulos y piezas (Python)"
"$PY" - "$P" "$REPO/fonts/Poppins-ExtraBold.ttf" <<'EOF_PY'
import sys
from PIL import Image, ImageDraw, ImageFont
P, TTF = sys.argv[1], sys.argv[2]
def letra(px):
    try: return ImageFont.truetype(TTF, px)
    except OSError: return ImageFont.load_default()
def persona(d, cx, cy, r, color=(245, 230, 215, 255), ropa=(30, 30, 40, 255)):
    """Silueta sencilla: cabeza y hombros."""
    d.ellipse((cx - 2.3 * r, cy + 1.2 * r, cx + 2.3 * r, cy + 6 * r), fill=ropa)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
def rotulo(d, xy, lineas, px, ancla="mm"):
    x, y = xy
    for i, t in enumerate(lineas):
        f = letra(px if i == 0 else int(px * 0.55))
        d.text((x, y), t, font=f, fill=(255, 255, 255, 255), anchor=ancla, stroke_width=max(2, px // 18), stroke_fill=(0, 0, 0, 200))
        y += int(px * 1.05)
# testimonio 1: horizontal
im = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
persona(d, 960, 470, 150); rotulo(d, (960, 120), ["TESTIMONIO 1", "cámara horizontal 16:9"], 84); im.save(f"{P}/t1.png")
# testimonio 2: celular vertical
im = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
persona(d, 540, 800, 230); rotulo(d, (540, 220), ["TESTIMONIO 2", "celular vertical"], 110); im.save(f"{P}/t2.png")
# testimonio 3: videollamada (mosaico de la persona + interfaz)
im = Image.new("RGBA", (502, 892), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
persona(d, 251, 400, 105); rotulo(d, (251, 110), ["TESTIMONIO 3", "videollamada"], 50); im.save(f"{P}/t3_mosaico.png")
im = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.rounded_rectangle((690, 925, 905, 967), 8, fill=(0, 0, 0, 170)); d.text((702, 946), "Alumna de muestra", font=letra(21), fill="white", anchor="lm")
for i, c in enumerate([(60, 64, 67)] * 5 + [(234, 67, 53)]):       # botones redondos y el rojo de colgar
    x = 760 + i * 80; d.ellipse((x - 28, 1000, x + 28, 1056), fill=c + (255,))
d.text((40, 1028), "10:42  |  reunión de muestra", font=letra(22), fill=(230, 230, 230, 255), anchor="lm")
d.rounded_rectangle((1560, 780, 1880, 960), 14, fill=(50, 54, 52, 255)); d.ellipse((1690, 835, 1750, 895), fill=(120, 140, 200, 255))
d.text((1575, 940), "Tú", font=letra(20), fill="white", anchor="lm"); im.save(f"{P}/t3_interfaz.png")
# tomas de evento: 4 videos × 3 escenas
for v in range(1, 5):
    for e in "ABC":
        im = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        rotulo(d, (960, 470), [f"TOMA DE EVENTO {v}{e}", "toma de apoyo (muestra)"], 120); im.save(f"{P}/ev{v}{e}.png")
# logo de cierre (con fondo transparente: el bloque «imagen» le pone el fondo)
im = Image.new("RGBA", (1100, 520), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.ellipse((450, 20, 650, 220), outline=(255, 255, 255, 255), width=14); d.polygon([(520, 75), (520, 165), (600, 120)], fill=(255, 255, 255, 255))
rotulo(d, (550, 330), ["TU LOGO AQUÍ", "imagen de cierre"], 110); im.save(f"{P}/../logo.png")
EOF_PY

# ---------- voces ----------
VOCES="$(say -v '?' 2>/dev/null | grep -E ' es_' | sed -E 's/ +es_.*//' || true)"
voz() {   # devuelve la primera voz en español que exista de la lista; si no, la primera que haya
  for v in "$@"; do if echo "$VOCES" | grep -qxF "$v"; then echo "$v"; return; fi; done
  echo "$VOCES" | head -1
}
frase() {  # frase <voz> <salida.wav> <texto>: una frase sin silencio al principio; sin voces en español, un tono suave
  if [ -n "$1" ] && say -v "$1" -r 175 -o "$P/_f.aiff" "$3" 2>/dev/null; then
    ff -i "$P/_f.aiff" -af "silenceremove=start_periods=1:start_threshold=-45dB" -ar 48000 -ac 1 "$2"
  else
    ff -f lavfi -i "sine=f=330:d=1.2" -af "volume=0.25,afade=t=in:d=0.05,afade=t=out:st=1.0:d=0.2" -ar 48000 -ac 1 "$2"
  fi
}
pista() {  # pista <salida.wav> <duración> <volumen dB> <inicio1> <wav1> [<inicio2> <wav2> …]: frases en segundos fijos
  local out="$1" dur="$2" vol="$3"; shift 3
  local ins=() fc="" n=0 mix=""
  while [ $# -gt 0 ]; do
    ins+=(-i "$2"); local ms; ms=$(awk "BEGIN{printf \"%d\", $1*1000}")
    fc="$fc[$n:a]adelay=${ms}:all=1[a$n];"; mix="$mix[a$n]"; n=$((n+1)); shift 2
  done
  ff "${ins[@]}" -filter_complex "${fc}${mix}amix=inputs=$n:normalize=0,apad,volume=${vol}dB[a]" -map "[a]" -t "$dur" -ar 48000 -ac 2 "$out"
}
V1="$(voz Paulina 'Mónica')"; V2="$(voz 'Mónica' Paulina)"; V3="$(voz 'Eddy (Español (México))' 'Reed (Español (México))' Paulina)"
[ -n "$VOCES" ] && echo "· voces: $V1 / $V2 / $V3" || echo "· esta Mac no tiene voces en español: uso tonos suaves en su lugar"
frase "$V1" "$P/v1a.wav" "Empecé con muchas dudas, pero"
frase "$V1" "$P/v1b.wav" "a mi cuenta me llegaron"
frase "$V1" "$P/v1c.wav" "dos mil dólares."
frase "$V1" "$P/v1d.wav" "Yo solo seguí los pasos, uno por uno,"
frase "$V1" "$P/v1e.wav" "y me funcionó."
frase "$V1" "$P/v1f.wav" "Hoy vivo de mi contenido."
frase "$V2" "$P/v2a.wav" "Fueron dos semanas, o menos, y"
frase "$V2" "$P/v2b.wav" "ya estoy vendiendo."
frase "$V3" "$P/v3a.wav" "Con dos videos recuperé lo que pagué."
frase "$V3" "$P/v3b.wav" "Es la mejor inversión que he hecho."
# cada testimonio sale a un volumen distinto a propósito: el armador los empareja
pista "$P/voz1.wav" 12.2 0   0.40 "$P/v1a.wav" 2.80 "$P/v1b.wav" 4.20 "$P/v1c.wav" 6.40 "$P/v1d.wav" 9.20 "$P/v1e.wav" 10.30 "$P/v1f.wav"
pista "$P/voz2.wav" 4.5 -12  0.30 "$P/v2a.wav" 2.40 "$P/v2b.wav"
pista "$P/voz3.wav" 6.0 4    0.30 "$P/v3a.wav" 2.40 "$P/v3b.wav"

# ---------- testimonios ----------
echo "· testimonio 1 (horizontal 1920×1080)"
ff -f lavfi -i "gradients=s=1920x1080:c0=0x1d3557:c1=0x457b9d:x0=0:y0=0:x1=1920:y1=1080:speed=0.02:r=30" -i "$P/t1.png" -i "$P/voz1.wav" \
   -filter_complex "[0:v][1:v]overlay=x=0:y='12*sin(2*PI*t/2.5)'[v]" -map "[v]" -map 2:a -t 12.2 $X264 -c:a aac -b:a 160k "$M/testimonio1_horizontal.mp4"
echo "· testimonio 2 (celular vertical 1080×1920)"
ff -f lavfi -i "gradients=s=1080x1920:c0=0x5f0f40:c1=0xe36414:x0=0:y0=0:x1=1080:y1=1920:speed=0.02:r=30" -i "$P/t2.png" -i "$P/voz2.wav" \
   -filter_complex "[0:v][1:v]overlay=x=0:y='16*sin(2*PI*t/2.5)'[v]" -map "[v]" -map 2:a -t 4.5 $X264 -c:a aac -b:a 160k "$M/testimonio2_vertical.mp4"
echo "· testimonio 3 (videollamada con interfaz)"
ff -f lavfi -i "color=c=0x131313:s=1920x1080:r=30" -f lavfi -i "gradients=s=502x892:c0=0x283618:c1=0x606c38:x0=0:y0=0:x1=502:y1=892:speed=0.02:r=30" \
   -i "$P/t3_mosaico.png" -i "$P/t3_interfaz.png" -i "$P/voz3.wav" \
   -filter_complex "[1:v][2:v]overlay=x=0:y='8*sin(2*PI*t/2.5)'[m];[0:v][m]overlay=682:82[b];[b][3:v]overlay=0:0[v]" \
   -map "[v]" -map 4:a -t 6.0 $X264 -c:a aac -b:a 160k "$M/testimonio3_videollamada.mp4"

# ---------- tomas de evento: 3 escenas de 2.4 s por video, con ambiente ----------
color() { case "$1" in
  1A) echo "0x003049 0xd62828";; 1B) echo "0x6a040f 0xffba08";; 1C) echo "0x240046 0x9d4edd";;
  2A) echo "0x0b525b 0x06d6a0";; 2B) echo "0x3c096c 0xff6d00";; 2C) echo "0x14213d 0xfca311";;
  3A) echo "0x7f5539 0xddb892";; 3B) echo "0x03045e 0x00b4d8";; 3C) echo "0x9d0208 0xf48c06";;
  4A) echo "0x004b23 0x70e000";; 4B) echo "0x4a4e69 0xc9ada7";; 4C) echo "0x590d22 0xff4d6d";; esac; }
for v in 1 2 3 4; do
  echo "· evento $v (3 escenas)"
  ins=(); fc=""; cat=""; n=0
  for e in A B C; do
    set -- $(color "$v$e")
    ins+=(-f lavfi -t 2.4 -i "gradients=s=1920x1080:c0=$1:c1=$2:x0=0:y0=1080:x1=1920:y1=0:speed=0.08:r=30" -i "$P/ev$v$e.png")
    fc="$fc[$((n*2)):v][$((n*2+1)):v]overlay=x='-40+80*t/2.4':y=0,format=yuv420p[s$n];"; cat="$cat[s$n]"; n=$((n+1))
  done
  ff "${ins[@]}" -f lavfi -t 7.2 -i "anoisesrc=color=pink:amplitude=0.22:seed=$v" -f lavfi -t 7.2 -i "sine=f=$((90+v*20))" \
     -filter_complex "${fc}${cat}concat=n=3:v=1:a=0[v];[6:a]lowpass=f=1800,tremolo=f=$((v+3)):d=0.6[r];[7:a]volume=0.25[g];[r][g]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=c0[a]" \
     -map "[v]" -map "[a]" -t 7.2 $X264 -c:a aac -b:a 128k "$M/evento$v.mp4"
done

# ---------- música y efecto de muestra ----------
echo "· música y efecto"
ff -f lavfi -i "aevalsrc='(0.14*sin(2*PI*220*t)+0.11*sin(2*PI*277.18*t)+0.11*sin(2*PI*329.63*t))*(0.75+0.25*sin(2*PI*0.5*t))+0.22*sin(2*PI*110*t)*pow(1-mod(t\,0.5)/0.5\,3)':d=32:s=48000" \
   -ac 2 -c:a aac -b:a 160k "$M/musica.m4a"
ff -f lavfi -i "aevalsrc='0.6*t*t*sin(2*PI*(180*t+260*t*t))':d=1.0:s=48000" -ac 2 "$M/subida.wav"
echo "✓ Material de muestra listo en $M"
