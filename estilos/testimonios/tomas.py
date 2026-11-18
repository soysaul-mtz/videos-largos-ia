#!/usr/bin/env python3
"""Encuentra los cortes de un video de evento y lista sus tomas, para elegir tomas de apoyo sin repetirlas.

Uso:   python estilos/testimonios/tomas.py <video> [más videos] [--salida carpeta] [--min 0.8]
Deja junto a cada video:
  <video>.tomas.txt   una toma por renglón (número, inicio, duración, nota) y el renglón listo para copiar al JSON
  <video>.tomas.jpg   hoja de miniaturas con el número y el segundo de cada toma (si son muchas: _2.jpg, _3.jpg…)

Una toma «utilizable» dura al menos --min segundos y no está casi en negro. De una toma larga se pueden sacar varios
pedazos distintos (cada miniatura dice su segundo). No usa internet. Va un video a la vez.
"""
import sys, os, shutil, subprocess, argparse, json
try: os.nice(15)                        # prioridad baja: la persona sigue usando su computadora
except OSError: pass
import numpy as np
from PIL import Image, ImageDraw, ImageFont

AW, AH = 64, 36                          # tamaño al que se analiza cada cuadro
MW, MH = 320, 180                        # tamaño de cada miniatura
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def buscar_ffmpeg():
    for c in ("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg", "/usr/local/opt/ffmpeg-full/bin/ffmpeg", shutil.which("ffmpeg")):
        if c and os.path.exists(c):
            p = os.path.join(os.path.dirname(c), "ffprobe")
            return c, (p if os.path.exists(p) else shutil.which("ffprobe") or "ffprobe")
    sys.exit("✗ No encontré ffmpeg. Instálalo con: brew install ffmpeg-full")


def cortes(dif):
    """Cuadros donde hay corte: el cambio contra el cuadro anterior es grande y mucho mayor que el de sus vecinos
    (una toma movida o un vuelo de dron cambian mucho en TODOS sus cuadros; un corte, solo en uno)."""
    res, n = [], len(dif)
    for i in range(1, n):
        if dif[i] < 9: continue
        vec = np.concatenate([dif[max(1, i - 6):i], dif[i + 1:i + 7]])
        if not len(vec) or dif[i] > 3.2 * max(np.median(vec), 1.2) and dif[i] > 1.6 * np.sort(vec)[-2 if len(vec) > 1 else -1]:
            if not res or i - res[-1] >= 3: res.append(i)
    return res


def analizar(video, salida, minimo, ff, fp):
    r = subprocess.run([fp, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate:format=duration", "-of", "json", video],
                       capture_output=True, text=True)
    try:
        j = json.loads(r.stdout); a, b = j["streams"][0]["avg_frame_rate"].split("/"); fps = min(30.0, float(a) / float(b)); dur = float(j["format"]["duration"])
    except Exception:
        print(f"✗ {os.path.basename(video)}: no trae imagen o no se puede leer"); return False
    print(f"· {os.path.basename(video)}: analizando {dur:.0f} s…", flush=True)
    r = subprocess.run([ff, "-v", "error", "-i", video, "-an", "-sn", "-vf", f"fps={fps:.5f},scale={AW}:{AH}:flags=area,format=gray", "-f", "rawvideo", "-"],
                       capture_output=True)
    c = np.frombuffer(r.stdout, np.uint8)
    c = c[:len(c) // (AW * AH) * AW * AH].reshape(-1, AH, AW).astype(np.int16)
    if len(c) < 3: print(f"✗ {os.path.basename(video)}: no se pudo leer la imagen"); return False
    dif = np.concatenate([[0.0], np.abs(np.diff(c, axis=0)).mean((1, 2))])
    brillo = c.mean((1, 2))
    bordes = [0] + cortes(dif) + [len(c)]
    tomas = []
    for k in range(len(bordes) - 1):
        a, b = bordes[k], bordes[k + 1]
        d = (b - a) / fps
        mov = float(np.median(dif[a + 1:b])) if b - a > 1 else 0.0
        nota = []
        if d < minimo: nota.append("muy corta")
        if brillo[a:b].mean() < 18: nota.append("casi negra")
        if mov < 0.15 and d >= minimo: nota.append("imagen fija")
        if mov > 12: nota.append("muy movida (¿dron?)")
        tomas.append(dict(n=k + 1, a=a / fps, d=d, nota=", ".join(nota), sirve=d >= minimo and brillo[a:b].mean() >= 18))
    base = os.path.join(salida or os.path.dirname(video), os.path.splitext(os.path.basename(video))[0] + ".tomas")
    nombre, margen = os.path.basename(video), 0.1                    # margen: no pegarse al corte
    with open(base + ".txt", "w", encoding="utf-8") as f:
        sirven = [t for t in tomas if t["sirve"]]
        f.write(f"# {nombre} · {dur:.1f} s · {len(tomas)} tomas ({len(sirven)} utilizables de {minimo} s o más)\n")
        f.write("# toma  inicio   dura   nota                 renglón para el JSON (toma completa; para usar menos, baja «dur»)\n")
        for t in tomas:
            usar = f'{{ "fuente": "{nombre}", "de": {t["a"] + margen:.2f}, "dur": {max(0.1, t["d"] - 2 * margen):.2f} }}' if t["sirve"] else "—"
            f.write(f'{t["n"]:>5}  {t["a"]:>7.2f}  {t["d"]:>5.2f}   {t["nota"]:<20} {usar}\n')
    # miniaturas: una a la mitad de cada toma utilizable; en tomas largas, una cada 4 s
    pedidos = []
    for t in tomas:
        if not t["sirve"]: continue
        k = max(1, int(t["d"] // 4))
        pedidos += [(t["n"], t["a"] + t["d"] * (2 * q + 1) / (2 * k), t["d"]) for q in range(k)]
    try: letra = ImageFont.truetype(os.path.join(REPO, "fonts", "Poppins-SemiBold.ttf"), 17)
    except OSError: letra = ImageFont.load_default()
    cols, filas, hojas = 6, 6, []
    for h in range(0, len(pedidos), cols * filas):
        grupo = pedidos[h:h + cols * filas]
        hoja = Image.new("RGB", (cols * MW, -(-len(grupo) // cols) * (MH + 26)), (24, 24, 24)); d = ImageDraw.Draw(hoja)
        for i, (n, seg, dtoma) in enumerate(grupo):
            r = subprocess.run([ff, "-v", "error", "-ss", f"{seg:.3f}", "-i", video, "-frames:v", "1", "-vf",
                                f"scale={MW}:{MH}:force_original_aspect_ratio=decrease,pad={MW}:{MH}:(ow-iw)/2:(oh-ih)/2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
            x, y = (i % cols) * MW, (i // cols) * (MH + 26)
            if len(r.stdout) == MW * MH * 3: hoja.paste(Image.frombytes("RGB", (MW, MH), r.stdout), (x, y + 26))
            d.text((x + 6, y + 2), f"#{n} · seg {seg:.1f} · toma de {dtoma:.1f} s", font=letra, fill=(255, 255, 255))
        ruta = base + (".jpg" if h == 0 else f"_{h // (cols * filas) + 1}.jpg")
        hoja.save(ruta, quality=85); hojas.append(ruta)
    print(f"✓ {nombre}: {len(tomas)} tomas, {len(sirven)} utilizables → {base}.txt" + (f" y {len(hojas)} hoja(s) de miniaturas ({os.path.basename(hojas[0])}…)" if hojas else ""))
    return True


def main():
    ap = argparse.ArgumentParser(description="Lista las tomas de un video de evento (cortes detectados) con hoja de miniaturas.")
    ap.add_argument("videos", nargs="+")
    ap.add_argument("--salida", help="carpeta donde dejar la lista y las miniaturas (por defecto, junto a cada video)")
    ap.add_argument("--min", type=float, default=0.8, dest="minimo", help="segundos mínimos para que una toma cuente como utilizable")
    a = ap.parse_args()
    if a.salida: os.makedirs(a.salida, exist_ok=True)
    ff, fp = buscar_ffmpeg(); mal = 0
    for v in a.videos:                                              # uno por uno
        if not os.path.exists(v): print(f"✗ No existe {v}"); mal += 1; continue
        if not analizar(os.path.abspath(v), a.salida, a.minimo, ff, fp): mal += 1
    sys.exit(1 if mal else 0)

if __name__ == "__main__":
    main()
