#!/usr/bin/env python3
"""Arma un compilado de testimonios (estilo «testimonios») a partir de un JSON de bloques.

Uso:
  python estilos/testimonios/armar.py <compilado.json> --plan     no exporta: escribe PLAN.md para enseñárselo a la persona
  python estilos/testimonios/armar.py <compilado.json> --fotos    una foto de cada bloque, subtítulo y toma de apoyo → salida/fotos/hoja.jpg
  python estilos/testimonios/armar.py <compilado.json>            exporta: cada bloque a salida/partes/ y al final los une
  python estilos/testimonios/armar.py <compilado.json> --solo 3   exporta solo el bloque 3 → salida/bloque_03.mp4

El formato del JSON y las reglas del estilo están en ESTILO.md (misma carpeta).

Cómo trabaja:
  · Todo se pasa a cuadros de 30 por segundo. Imagen y sonido se arman por separado y siempre miden lo mismo.
  · Cada bloque se guarda con una firma de su contenido: si no cambió, no se vuelve a hacer.
  · Todos los cortes son secos. El subtítulo se dibuja con la receta medida en el video de referencia.
  · No usa internet. ffmpeg corre con prioridad baja para no trabar la computadora.
"""
import sys, os, json, re, subprocess, hashlib, shutil, wave, argparse, tempfile
try: os.nice(15)                        # prioridad baja: la persona sigue usando su computadora mientras se exporta
except OSError: pass
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
W, H, FPS, SR = 1920, 1080, 30, 48000

# ---------- receta del subtítulo (medida en el video de referencia; ver ESTILO.md › Subtítulos) ----------
SUB_PX, SUB_COLOR, SUB_X, SUB_BASE = 90, (255, 255, 0), 960, 983   # con línea base en 983 las letras altas topan en y = 918
HALO_DILATA, HALO_SIGMA, HALO_OPACIDAD = 13, 11, 0.9
SUB_PALABRAS, SUB_ANCHO = 7, 1500        # máximo de palabras y de ancho en px (la referencia llega a 1492)
RECETA = "v4"                            # cambia este texto si cambias la receta: obliga a rehacer los bloques

# ---------- reglas que revisa el plan ----------
APOYO_MIN, APOYO_MAX = 0.6, 3.0          # segundos de una toma de apoyo
CARA_MAX, CARA_MAX_GANCHO = 6.0, 10.0    # segundos seguidos con la persona a cuadro
SUB_MIN, SUB_MAX = 0.6, 2.5              # segundos de un subtítulo en pantalla
VOZ_MAX = 19.0                           # segundos de un testimonio de corrido

# ---------- sonido ----------
NIVEL_VOZ = -16.0                        # LUFS de cada voz antes de la mezcla (todas quedan parejas)
NIVEL_FINAL, TECHO = -14.0, -1.4         # mezcla final: volumen y pico máximo
MUSICA_DB, MUSICA_PUENTE_DB = -12.0, -3.0   # música respecto a la voz: debajo de la voz / cuando nadie habla
IMAGENES = (".png", ".jpg", ".jpeg", ".webp")


def alto(msg):
    print(f"\n✗ {msg}\n"); sys.exit(1)


# ---------- ffmpeg ----------
def buscar_ffmpeg():
    """El ffmpeg completo de Homebrew primero; si no está, el normal. Los subtítulos los dibuja Python, así que no hace falta libass."""
    for c in ("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg", "/usr/local/opt/ffmpeg-full/bin/ffmpeg", shutil.which("ffmpeg")):
        if c and os.path.exists(c):
            p = os.path.join(os.path.dirname(c), "ffprobe")
            return c, (p if os.path.exists(p) else shutil.which("ffprobe") or "ffprobe")
    alto("No encontré ffmpeg. Instálalo con: brew install ffmpeg-full   (o corre ./instalar.sh)")

FF, FP = buscar_ffmpeg()

def revisar_ffmpeg():
    r = subprocess.run([FF, "-hide_banner", "-filters"], capture_output=True, text=True).stdout
    falta = [f for f in ("overlay", "scale", "alimiter", "ebur128", "tpad") if f" {f} " not in r]
    r2 = subprocess.run([FF, "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    if "libx264" not in r2: falta.append("libx264")
    if falta: alto(f"A este ffmpeg ({FF}) le falta: {', '.join(falta)}. Instala el completo: brew install ffmpeg-full")

def correr(cmd, entrada=None, que="ffmpeg"):
    """Corre ffmpeg y se detiene con un mensaje claro si falla. `entrada` puede ser bytes o un generador de cuadros."""
    if entrada is not None and not isinstance(entrada, (bytes, bytearray)):
        with tempfile.TemporaryFile() as err:                        # cuadro por cuadro, sin juntarlos todos en memoria
            p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=err)
            try:
                for c in entrada: p.stdin.write(c)
                p.stdin.close()
            except BrokenPipeError: pass
            p.wait(); err.seek(0)
            r = subprocess.CompletedProcess(cmd, p.returncode, b"", err.read())
    else: r = subprocess.run(cmd, input=entrada, capture_output=True)
    if r.returncode != 0:
        alto(f"Falló {que}:\n{r.stderr.decode(errors='replace')[-1500:]}\nComando: {' '.join(str(c) for c in cmd)[:900]}")
    return r

_sondas = {}
def sondear(ruta):
    """Qué es un archivo: tamaño ya girado, duración, si trae video, sonido o HDR."""
    if ruta in _sondas: return _sondas[ruta]
    d = dict(w=0, h=0, dur=0.0, video=False, audio=False, imagen=False, hdr=False)
    if ruta.lower().endswith(IMAGENES):
        with Image.open(ruta) as im: d.update(w=im.width, h=im.height, imagen=True, video=True)
    else:
        r = subprocess.run([FP, "-v", "error", "-print_format", "json", "-show_streams", "-show_format", ruta], capture_output=True, text=True)
        if r.returncode != 0: raise ValueError(f"no se puede leer {ruta}")
        j = json.loads(r.stdout)
        d["dur"] = float(j.get("format", {}).get("duration", 0) or 0)
        for s in j.get("streams", []):
            if s.get("codec_type") == "audio": d["audio"] = True
            if s.get("codec_type") == "video" and not s.get("disposition", {}).get("attached_pic") and not d["video"]:
                giro = int(float(s.get("tags", {}).get("rotate", 0) or 0))
                for sd in s.get("side_data_list", []):
                    if "rotation" in sd: giro = int(float(sd["rotation"]))
                w, h = int(s["width"]), int(s["height"])
                if abs(giro) % 180 == 90: w, h = h, w          # el celular guarda el video acostado y anota el giro
                d.update(w=w, h=h, video=True, hdr=s.get("color_transfer") in ("arib-std-b67", "smpte2084"))
                if s.get("color_space") in (None, "unknown"):      # sin etiqueta de color: HD se lee como bt709 y lo chico como bt601 (igual que un reproductor)
                    d["matriz"] = "bt709" if max(w, h) >= 1280 else "bt601"
    _sondas[ruta] = d
    return d


# ---------- subtítulo ----------
_tipo = {}
def tipografia():
    """Arial Bold Italic si la computadora la tiene; si no, Arimo Bold Italic (libre, mismas medidas) de fonts/."""
    if "f" not in _tipo:
        for c in ("/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf", "/Library/Fonts/Arial Bold Italic.ttf",
                  "C:/Windows/Fonts/arialbi.ttf", "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold_Italic.ttf",
                  os.path.join(REPO, "fonts", "Arimo-BoldItalic.ttf")):
            if os.path.exists(c):
                _tipo["f"], _tipo["ruta"] = ImageFont.truetype(c, SUB_PX), c
                break
        else: alto("No encontré la tipografía del subtítulo (Arial Bold Italic ni fonts/Arimo-BoldItalic.ttf).")
    return _tipo["f"]

def _texto_sub(texto):
    im = Image.new("L", (W * 2, H), 0)                          # lienzo ancho: así se mide aunque el texto no quepa
    ImageDraw.Draw(im).text((W, SUB_BASE), texto, font=tipografia(), fill=255, anchor="ms")
    return im

def ancho_sub(texto):
    c = _texto_sub(texto).getbbox()
    return (c[2] - c[0]) if c else 0

def tarjeta_sub(texto, carpeta):
    """Dibuja el subtítulo (amarillo + halo negro difuminado) en un PNG recortado. Devuelve (ruta, x, y)."""
    letras = _texto_sub(texto)
    ruta = os.path.join(carpeta, "sub_" + hashlib.sha1(f"{RECETA}|{_tipo['ruta']}|{texto}".encode()).hexdigest()[:12] + ".png")
    m = HALO_DILATA + 4 * HALO_SIGMA
    letras = letras.crop((W - SUB_X, 0, 2 * W - SUB_X, H))   # el cuadro de 1920 con el texto centrado en SUB_X
    c = letras.getbbox()
    c = (max(0, c[0] - m), max(0, c[1] - m), min(W, c[2] + m), min(H, c[3] + m))
    if not os.path.exists(ruta):
        letras = letras.crop(c)
        halo = letras.filter(ImageFilter.MaxFilter(2 * HALO_DILATA + 1)).filter(ImageFilter.GaussianBlur(HALO_SIGMA))
        halo = halo.point(lambda v: int(v * HALO_OPACIDAD))
        capa = Image.new("RGBA", letras.size, (0, 0, 0, 0)); capa.putalpha(halo)
        color = Image.new("RGBA", letras.size, SUB_COLOR + (255,)); color.putalpha(letras)
        Image.alpha_composite(capa, color).save(ruta)
    return ruta, c[0], c[1]


# ---------- leer el JSON y convertirlo en tomas ----------
fr = lambda s: int(round(float(s) * FPS))                         # segundos → cuadros
seg = lambda f: f / FPS
def reloj(s): return f"{int(s // 60)}:{s % 60:04.1f}"

class Compilado:
    def __init__(self, ruta_json):
        self.json = os.path.abspath(ruta_json)
        self.base = os.path.dirname(self.json)
        try: self.spec = json.load(open(self.json, encoding="utf-8"))
        except json.JSONDecodeError as e: alto(f"El JSON tiene un error de escritura (renglón {e.lineno}): {e.msg}")
        self.nombre = self.spec.get("nombre") or os.path.splitext(os.path.basename(self.json))[0]
        self.salida = os.path.join(self.base, "salida")
        self.partes = os.path.join(self.salida, "partes")
        self.errores, self.avisos, self.bloques = [], [], []
        self._leer()

    def ruta(self, r): return r if os.path.isabs(r) else os.path.normpath(os.path.join(self.base, os.path.expanduser(r)))
    def corto(self, r): return os.path.relpath(r, self.base) if r.startswith(self.base) else r

    def _fuente(self, r, n, que):
        """Revisa que el archivo exista y se pueda leer. Devuelve (ruta, datos) o (None, None)."""
        if not r: self.errores.append(f"Bloque {n}: falta «fuente» en {que}."); return None, None
        p = self.ruta(r)
        if not os.path.exists(p): self.errores.append(f"Bloque {n}: no existe el archivo {r}"); return None, None
        try: return p, sondear(p)
        except Exception: self.errores.append(f"Bloque {n}: no se puede leer {r}"); return None, None

    def _encuadre(self, info, formato, apoyo, n, nombre):
        """Cómo se coloca una fuente en el cuadro: 'llenar' (cubre todo) o 'contener' (completa, sobre negro)."""
        if formato in ("vertical", "llamada"): return "contener"
        if formato == "horizontal": return "llenar"
        if formato not in (None, "auto"): self.errores.append(f"Bloque {n}: formato «{formato}» no existe (usa auto, horizontal, vertical o llamada).")
        if not info["w"] or info["h"] > info["w"]: return "contener"            # vertical de celular: 1080 de alto sobre negro
        if apoyo or abs(info["w"] / info["h"] - 16 / 9) < 0.06: return "llenar"
        self.avisos.append(f"Bloque {n}: {nombre} no es 16:9 ({info['w']}×{info['h']}); se ve completo con franjas negras. "
                           f"Para que llene el cuadro recortando pon \"formato\": \"horizontal\".")
        return "contener"

    def _toma(self, n, t, apoyo=True, que="la toma"):
        """Una toma de apoyo: {fuente, de, dur}. Devuelve la toma lista o None."""
        p, info = self._fuente(t.get("fuente"), n, que)
        if not p: return None
        if not info["video"]: self.errores.append(f"Bloque {n}: {t['fuente']} no trae imagen."); return None
        de, dur = float(t.get("de", 0)), float(t.get("dur", 0))
        if dur <= 0: self.errores.append(f"Bloque {n}: a {que} ({t['fuente']}) le falta «dur» (segundos)."); return None
        if not info["imagen"] and de + dur > info["dur"] + 0.05:
            self.errores.append(f"Bloque {n}: {t['fuente']} dura {info['dur']:.1f} s y la toma pide hasta el segundo {de + dur:.1f}."); return None
        if info["hdr"]: self.avisos.append(f"Bloque {n}: {t['fuente']} viene en HDR (celular); pásalo a SDR antes o se verá lavado.")
        return dict(clase="apoyo", fuente=p, ini=de, n=fr(dur), imagen=info["imagen"], audio=info["audio"],
                    encuadre=self._encuadre(info, t.get("formato"), apoyo, n, t["fuente"]))

    def _subs(self, n, b, N):
        subs, lista = [], b.get("subs", [])
        for i, s in enumerate(lista):
            texto = str(s.get("texto", "")).strip()
            if not texto: self.errores.append(f"Bloque {n}: hay un subtítulo sin texto."); continue
            if "de" not in s: self.errores.append(f"Bloque {n}: al subtítulo «{texto}» le falta «de» (segundo en que entra)."); continue
            f0 = fr(s["de"])
            if "a" in s: f1 = fr(s["a"])
            else: f1 = fr(lista[i + 1]["de"]) if i + 1 < len(lista) and "de" in lista[i + 1] else N   # lo releva el siguiente o sale con el corte
            if abs(f1 - N) <= 2: f1 = N                                # si termina con el bloque, sale en el mismo cuadro del corte
            pal, ancho = len(texto.split()), ancho_sub(texto)
            if pal > SUB_PALABRAS: self.errores.append(f"Bloque {n}: el subtítulo «{texto}» tiene {pal} palabras; el máximo es {SUB_PALABRAS}. Deja solo el remate o pártelo en dos.")
            if ancho > SUB_ANCHO: self.errores.append(f"Bloque {n}: el subtítulo «{texto}» mide {ancho} px y el ancho seguro es {SUB_ANCHO}. Acórtalo o pártelo en dos.")
            if f0 < 0 or f1 > N or f1 <= f0: self.errores.append(f"Bloque {n}: el subtítulo «{texto}» ({seg(f0):.2f}–{seg(f1):.2f} s) se sale del bloque, que dura {seg(N):.2f} s."); continue
            if subs and f0 < subs[-1]["f1"]: self.errores.append(f"Bloque {n}: el subtítulo «{texto}» entra antes de que salga el anterior."); continue
            d = seg(f1 - f0)
            if d < SUB_MIN: self.avisos.append(f"Bloque {n}: el subtítulo «{texto}» dura {d:.1f} s; no da tiempo de leerlo (mínimo {SUB_MIN} s).")
            if d > SUB_MAX: self.avisos.append(f"Bloque {n}: el subtítulo «{texto}» dura {d:.1f} s; debe durar lo que dura la frase (máximo {SUB_MAX} s).")
            if "¡" in texto or "¿" in texto or (texto[:1].isupper() and i > 0):
                self.avisos.append(f"Bloque {n}: «{texto}»: en este estilo el subtítulo va en minúsculas y con el signo solo al final.")
            subs.append(dict(texto=texto, f0=f0, f1=f1))
        return subs

    def _leer(self):
        S = self.spec
        if not isinstance(S.get("bloques"), list) or not S["bloques"]: alto("El JSON no trae «bloques».")
        for n, b in enumerate(S["bloques"], 1):
            tipo = b.get("tipo")
            B = dict(n=n, tipo=tipo, quien=b.get("quien") or b.get("nota") or "", dice=b.get("dice", ""), seccion=b.get("seccion"),
                     tomas=[], subs=[], N=0, audio=None, musica=b.get("musica", True), musica_db=b.get("musica_db"), sonidos=[])
            if tipo == "testimonio":
                p, info = self._fuente(b.get("fuente"), n, "el testimonio")
                if not p: continue
                if not info["audio"]: self.errores.append(f"Bloque {n}: {b['fuente']} no trae sonido; un testimonio necesita la voz."); continue
                de = float(b.get("de", 0)); a = float(b.get("a", info["dur"]))
                if a <= de or a > info["dur"] + 0.05: self.errores.append(f"Bloque {n}: «de»/«a» ({de}–{a}) no caben en {b['fuente']}, que dura {info['dur']:.1f} s."); continue
                if info["hdr"]: self.avisos.append(f"Bloque {n}: {b['fuente']} viene en HDR (celular); pásalo a SDR antes o se verá lavado.")
                N = fr(a - de)
                enc = self._encuadre(info, b.get("formato"), False, n, b["fuente"]) if info["video"] else None
                B["formato"] = b.get("formato") if b.get("formato") in ("horizontal", "vertical", "llamada") else \
                    ("solo voz" if not info["video"] else "vertical" if info["h"] > info["w"] else "horizontal")
                apoyos, cursor = [], None
                for ap in b.get("apoyo", []):
                    t = self._toma(n, ap, que="la toma de apoyo")
                    if not t: continue
                    f0 = fr(ap["en"]) if "en" in ap else cursor       # sin «en»: pegada a la toma de apoyo anterior (racha)
                    if f0 is None: self.errores.append(f"Bloque {n}: a la primera toma de apoyo le falta «en» (segundo del bloque en que entra)."); continue
                    if cursor is not None and 0 < f0 - cursor <= 2: f0 = cursor    # huecos de 1–2 cuadros: se pegan
                    f1 = f0 + t["n"]
                    if abs(f1 - N) <= 2: f1 = N
                    if f0 < (cursor or 0) or f1 > N:
                        self.errores.append(f"Bloque {n}: la toma de apoyo {ap['fuente']} ({seg(f0):.2f}–{seg(f1):.2f} s) se encima con la anterior o se sale del bloque ({seg(N):.2f} s)."); continue
                    t.update(f0=f0, n=f1 - f0); apoyos.append(t); cursor = f1
                pos = 0
                persona = lambda f0, f1: dict(clase="persona", fuente=p if info["video"] else None, ini=de + seg(f0), f0=f0, n=f1 - f0,
                                              imagen=False, encuadre=enc)
                for t in apoyos:
                    if t["f0"] > pos: B["tomas"].append(persona(pos, t["f0"]))
                    B["tomas"].append(t); pos = t["f0"] + t["n"]
                if pos < N: B["tomas"].append(persona(pos, N))
                if not info["video"] and any(t["clase"] == "persona" for t in B["tomas"]):
                    self.avisos.append(f"Bloque {n}: {b['fuente']} no trae imagen; donde no hay toma de apoyo se verá negro. Cúbrelo completo con apoyo.")
                B.update(N=N, audio=dict(tipo="voz", fuente=p, ini=de), fuente=p, de=de, a=a)
            elif tipo == "apoyo":
                pos = 0
                for t0 in b.get("tomas", []):
                    t = self._toma(n, t0)
                    if t: t["f0"] = pos; pos += t["n"]; B["tomas"].append(t)
                if not B["tomas"]: self.errores.append(f"Bloque {n}: un bloque de apoyo necesita «tomas»."); continue
                suena = bool(b.get("sonido", True))
                if suena and not all(t["audio"] for t in B["tomas"]):
                    suena = False; self.avisos.append(f"Bloque {n}: alguna toma no trae sonido; el puente va mudo (solo música).")
                B.update(N=pos, audio=dict(tipo="evento", db=float(b.get("volumen_db", 3))) if suena else None)
            elif tipo == "imagen":
                p, info = self._fuente(b.get("fuente"), n, "la imagen")
                if not p: continue
                if not info["imagen"]: self.errores.append(f"Bloque {n}: {b['fuente']} no es una imagen (png o jpg). Para un video usa un bloque «apoyo»."); continue
                dur = float(b.get("dur", 0))
                if dur <= 0: self.errores.append(f"Bloque {n}: a la imagen le falta «dur» (segundos)."); continue
                z = b.get("zoom"); z = None if not z else ([float(z[0]), float(z[1])] if isinstance(z, list) else [1.0, float(z)])
                B["tomas"].append(dict(clase="imagen", fuente=p, ini=0, f0=0, n=fr(dur), imagen=True, zoom=z, fondo=b.get("fondo", "#000000"), escala=float(b.get("escala", 1)),
                                       encuadre="llenar" if b.get("ajuste") == "llenar" else "contener"))
                B["N"] = fr(dur)
                if b.get("sonido"):
                    ps, i2 = self._fuente(b["sonido"], n, "el sonido de la imagen")
                    if ps and i2["audio"]: B["audio"] = dict(tipo="archivo", fuente=ps, db=float(b.get("volumen_db", 0)))
            else:
                self.errores.append(f"Bloque {n}: tipo «{tipo}» no existe (usa testimonio, apoyo o imagen)."); continue
            B["subs"] = self._subs(n, b, B["N"])
            for s in b.get("sonidos", []):                          # efectos sueltos (subida, golpe) pegados a este bloque
                ps, i2 = self._fuente(s.get("fuente"), n, "un sonido")
                if ps and i2["audio"]: B["sonidos"].append(dict(fuente=ps, en=float(s.get("en", 0)), db=float(s.get("db", -8))))
            self.bloques.append(B)
        if self.errores: return
        self._secciones(); self._reglas()
        pos = 0
        for B in self.bloques: B["inicio"] = pos; pos += B["N"]
        self.N = pos
        self.musica = None
        if S.get("musica"):
            p, info = self._fuente(S["musica"], "general", "la música")
            if p and info["audio"]: self.musica = p

    def _secciones(self):
        """gancho → puente → cuerpo → prueba → cierre. Se deduce del orden si el JSON no lo dice."""
        Bs = self.bloques
        i = 0
        while i < len(Bs) and Bs[i]["tipo"] == "testimonio" and not any(t["clase"] == "apoyo" for t in Bs[i]["tomas"]): i += 1
        for k, B in enumerate(Bs):
            if B["seccion"]: continue
            if k < i and i < len(Bs): B["seccion"] = "gancho"
            elif k == i and i > 0 and B["tipo"] == "apoyo": B["seccion"] = "puente"
            elif B["tipo"] == "imagen": B["seccion"] = "cierre" if k == len(Bs) - 1 else "prueba"
            else: B["seccion"] = "cuerpo"

    def _reglas(self):
        """Avisos según las reglas del estilo (ESTILO.md › Reglas). No detienen el armado: se le enseñan a la persona."""
        A, Bs = self.avisos, self.bloques
        usadas, apoyos = [], []
        for B in Bs:
            n, g = B["n"], B["seccion"] == "gancho"
            for t in B["tomas"]:
                d = seg(t["n"])
                if t["clase"] == "apoyo":
                    apoyos.append(d)
                    if d > APOYO_MAX: A.append(f"Bloque {n}: la toma de apoyo {self.corto(t['fuente'])} dura {d:.1f} s (más de {APOYO_MAX:.0f} s se siente lenta; lo normal es 1.0–1.7 s).")
                    if d < APOYO_MIN: A.append(f"Bloque {n}: la toma de apoyo {self.corto(t['fuente'])} dura {d:.1f} s (menos de {APOYO_MIN} s casi no se alcanza a ver).")
                    if not t["imagen"]:
                        for (f, a, b, m) in usadas:
                            if f == t["fuente"] and t["ini"] < b - 0.1 and a < t["ini"] + d - 0.1:
                                A.append(f"Bloque {n}: la toma de apoyo {self.corto(f)} ({t['ini']:.1f}–{t['ini'] + d:.1f} s) repite un pedazo ya usado en el bloque {m}. Ninguna toma de apoyo se repite."); break
                        usadas.append((t["fuente"], t["ini"], t["ini"] + d, n))
                elif t["clase"] == "persona" and t["fuente"]:
                    tope = CARA_MAX_GANCHO if g else CARA_MAX
                    if d > tope: A.append(f"Bloque {n}: la persona se ve {d:.1f} s seguidos sin toma de apoyo (máximo {tope:.0f} s{' en el gancho' if g else ''}). Cúbrela con apoyo.")
                    if d < 0.4: A.append(f"Bloque {n}: la persona aparece solo {d:.1f} s entre tomas de apoyo; parece un error (mínimo 0.5 s).")
            if B["tipo"] == "testimonio":
                if g and not B["subs"]: A.append(f"Bloque {n}: está en el gancho y no lleva subtítulo. Cada frase del gancho remata con su subtítulo amarillo.")
                if g and any(t["clase"] == "apoyo" for t in B["tomas"]): A.append(f"Bloque {n}: el gancho va sin tomas de apoyo (solo las caras y sus frases).")
                if B["seccion"] == "cuerpo" and B["tomas"][0]["clase"] == "persona" and B["tomas"][0]["fuente"]:
                    A.append(f"Bloque {n}: empieza con la cara. En el cuerpo la voz entra 1.5–2 s antes que la cara: pon una toma de apoyo con \"en\": 0.")
                if seg(B["N"]) > VOZ_MAX: A.append(f"Bloque {n}: el testimonio dura {seg(B['N']):.1f} s de corrido (lo normal son 4–19 s). Recórtalo o pártelo.")
        gancho = [B for B in Bs if B["seccion"] == "gancho"]
        if not gancho: A.append("No hay gancho: el video debe abrir con 3–4 frases estrella (un testimonio corto cada una, sin tomas de apoyo, con subtítulo).")
        else:
            d = seg(sum(B["N"] for B in gancho))
            if len(gancho) < 3: A.append(f"El gancho tiene {len(gancho)} testimonio(s); lo ideal son 4 de personas y tipos de fuente distintos.")
            if d > 30: A.append(f"El gancho dura {d:.1f} s; lo ideal son 20–25 s.")
            k = Bs.index(gancho[-1]) + 1
            if k < len(Bs) and Bs[k]["tipo"] != "apoyo": A.append("Después del gancho va un puente de tomas de apoyo (3–4 s con su propio sonido) antes de los testimonios.")
        if Bs[-1]["tipo"] != "imagen": A.append("El video no cierra con una imagen (logo). La referencia termina con el logo fijo unos 6 s.")
        if len(apoyos) >= 4 and not 1.0 <= sum(apoyos) / len(apoyos) <= 1.7:
            A.append(f"Las tomas de apoyo promedian {sum(apoyos) / len(apoyos):.1f} s; lo ideal es entre 1.0 y 1.7 s.")
        total, subs = seg(sum(B["N"] for B in Bs)), seg(sum(s["f1"] - s["f0"] for B in Bs for s in B["subs"]))
        if total > 60 and subs > total * 0.08: A.append(f"Hay subtítulo el {100 * subs / total:.0f} % del video; en este estilo va solo en las frases clave (alrededor del 5 %).")
        if not self.spec.get("musica"): A.append("Sin música: el JSON no trae «musica». La referencia lleva una cama de música muy baja bajo las voces.")
        num = lambda a: int(re.match(r"Bloque (\d+)", a).group(1)) if re.match(r"Bloque (\d+)", a) else 10 ** 6
        A.sort(key=num)                                              # en orden de bloque; los generales al final

    # ---------- plan ----------
    def plan(self):
        Bs, L = self.bloques, []
        total = seg(self.N)
        apoyos = [seg(t["n"]) for B in Bs for t in B["tomas"] if t["clase"] == "apoyo"]
        subs = [s for B in Bs for s in B["subs"]]
        tsub = seg(sum(s["f1"] - s["f0"] for s in subs))
        personas = {B["quien"] or B["fuente"] for B in Bs if B["tipo"] == "testimonio"}
        L += [f"# Plan del compilado «{self.nombre}»", "",
              f"- **Duración total:** {reloj(total)} ({total:.1f} s) en {len(Bs)} bloques",
              f"- **Testimonios:** {sum(B['tipo'] == 'testimonio' for B in Bs)} bloques de {len(personas)} persona(s)",
              f"- **Tomas de apoyo:** {len(apoyos)}" + (f" (promedio {sum(apoyos) / len(apoyos):.1f} s cada una)" if apoyos else ""),
              f"- **Subtítulos amarillos:** {len(subs)} ({tsub:.1f} s en pantalla, {100 * tsub / max(total, 0.1):.0f} % del video)",
              f"- **Música:** {self.corto(self.musica) if self.musica else 'sin música'}",
              "- Todos los cortes son secos. Las voces quedan al mismo volumen y la mezcla final a −14 LUFS.", ""]
        nombres = dict(gancho="Gancho", puente="Puente", cuerpo="Testimonios", prueba="Prueba", cierre="Cierre")
        antes = None
        for B in Bs:
            if B["seccion"] != antes: L += [f"## {nombres.get(B['seccion'], str(B['seccion']).capitalize())}", ""]; antes = B["seccion"]
            d, i0 = seg(B["N"]), seg(B["inicio"])
            cab = f"[{reloj(i0)} → {reloj(i0 + d)}] · {d:.1f} s"
            if B["tipo"] == "testimonio":
                L.append(f"### {B['n']}. Testimonio: {B['quien'] or self.corto(B['fuente'])} ({B['formato']}) · {cab}")
                L.append(f"- Voz: `{self.corto(B['fuente'])}` del segundo {B['de']:.1f} al {B['a']:.1f}")
                if B["dice"]: L.append(f"- Dice: «{B['dice']}»")
                cara = [t for t in B["tomas"] if t["clase"] == "persona"]
                ap = [t for t in B["tomas"] if t["clase"] == "apoyo"]
                if not ap: L.append("- Imagen: la persona a cuadro todo el bloque, sin tomas de apoyo")
                else:
                    L.append(f"- Imagen: la persona se ve {seg(sum(t['n'] for t in cara)):.1f} s y hay {len(ap)} toma(s) de apoyo encima de su voz:")
                    for t in B["tomas"]:
                        r = f"{seg(t['f0']):.1f}–{seg(t['f0'] + t['n']):.1f} s"
                        L.append(f"  - {r}: " + ("la persona a cuadro" if t["clase"] == "persona" else f"apoyo `{self.corto(t['fuente'])}` (desde su segundo {t['ini']:.1f}, {seg(t['n']):.1f} s)"))
            elif B["tipo"] == "apoyo":
                L.append(f"### {B['n']}. Tomas de apoyo{': ' + B['quien'] if B['quien'] else ''} · {cab}")
                L.append("- Sonido: " + ("el de las propias tomas (nadie habla)" if B["audio"] else "mudas; solo se oye la música"))
                for t in B["tomas"]: L.append(f"  - `{self.corto(t['fuente'])}` desde su segundo {t['ini']:.1f}, {seg(t['n']):.1f} s")
            else:
                t = B["tomas"][0]
                L.append(f"### {B['n']}. Imagen{': ' + B['quien'] if B['quien'] else ''} · {cab}")
                L.append(f"- `{self.corto(t['fuente'])}` fija" + (f", acercándose lento (de {t['zoom'][0]:g} a {t['zoom'][1]:g})" if t["zoom"] else "") +
                         (f"; suena `{self.corto(B['audio']['fuente'])}`" if B["audio"] else "; sin voz, sube la música"))
            if B["subs"]:
                L.append("- Subtítulos:")
                for s in B["subs"]: L.append(f"  - «{s['texto']}» de {seg(s['f0']):.1f} a {seg(s['f1']):.1f} s ({seg(s['f1'] - s['f0']):.1f} s)")
            elif B["tipo"] == "testimonio": L.append("- Subtítulos: ninguno")
            L.append("")
        L += ["## Avisos", ""]
        L += [f"- ⚠ {a}" for a in self.avisos] or ["- Ninguno: el plan cumple las reglas del estilo."]
        L += ["", "## Qué sigue", "",
              "Si estás de acuerdo con este plan, di «sí» y se exporta. Si quieres cambiar algo (otra frase, otro orden, "
              "quitar o agregar un subtítulo o una toma), dilo y se ajusta antes de exportar.", ""]
        txt = "\n".join(L)
        open(os.path.join(self.base, "PLAN.md"), "w", encoding="utf-8").write(txt)
        return txt

    # ---------- imagen ----------
    def _subs_de(self, B, f0, n):
        """Subtítulos que caen dentro de una toma, con sus cuadros contados desde el inicio de la toma."""
        os.makedirs(self.partes, exist_ok=True)
        res = []
        for s in B["subs"]:
            a, b = max(s["f0"], f0), min(s["f1"], f0 + n)
            if b > a: res.append(tarjeta_sub(s["texto"], self.partes) + (a - f0, b - f0))
        return res

    def _lienzo(self, t, doble=1):
        """La imagen de un bloque «imagen» colocada sobre su fondo, a 1920×1080 (o al doble para el acercamiento)."""
        w, h = W * doble, H * doble
        im = Image.open(t["fuente"]).convert("RGBA")
        k = (max if t["encuadre"] == "llenar" else min)(w / im.width, h / im.height) * t.get("escala", 1)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        if im.width > w or im.height > h:                            # lo que sobra se recorta parejo por los lados
            x, y = max(0, (im.width - w) // 2), max(0, (im.height - h) // 2)
            im = im.crop((x, y, x + min(w, im.width), y + min(h, im.height)))
        lienzo = Image.new("RGBA", (w, h), t.get("fondo", "#000000"))
        lienzo.alpha_composite(im, ((w - im.width) // 2, (h - im.height) // 2))
        return lienzo.convert("RGB")

    def _cuadros_zoom(self, t, cuadros):
        """Acercamiento lento dibujado cuadro por cuadro (ffmpeg lo hace a saltos; así sale parejo)."""
        base, (z0, z1) = self._lienzo(t, 2), t["zoom"]
        for i in cuadros:
            z = z0 + (z1 - z0) * (i / max(1, t["n"] - 1))
            k = 2 / z
            yield base.transform((W, H), Image.AFFINE, (k, 0, W - W / z, 0, k, H - H / z), Image.BILINEAR).tobytes()

    def render_toma(self, B, t, salida, foto=None):
        """Exporta una toma (o una sola foto si `foto` es el cuadro dentro de la toma). Un solo ffmpeg sencillo."""
        n, desde = (1, foto) if foto is not None else (t["n"], 0)
        subs = self._subs_de(B, t["f0"] + desde, n)
        cmd, entrada = [FF, "-v", "error", "-y"], None
        color = ":out_color_matrix=bt709:out_range=tv"
        if t["fuente"] and not t["imagen"] and sondear(t["fuente"]).get("matriz"): color += ":in_color_matrix=" + sondear(t["fuente"])["matriz"]
        marco = {"llenar": f"scale={W}:{H}:force_original_aspect_ratio=increase{color},crop={W}:{H}",
                 "contener": f"scale={W}:{H}:force_original_aspect_ratio=decrease:force_divisible_by=2{color},pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black"}
        if t["clase"] == "imagen":
            if t["zoom"]:
                entrada = self._cuadros_zoom(t, range(desde, desde + n))
                cmd += ["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
            else:
                fijo = os.path.join(self.partes, "lienzo_" + hashlib.sha1(json.dumps([t["fuente"], t["fondo"], t["encuadre"], t["escala"], os.path.getmtime(t["fuente"])]).encode()).hexdigest()[:10] + ".png")
                if not os.path.exists(fijo): self._lienzo(t).save(fijo)
                cmd += ["-loop", "1", "-framerate", str(FPS), "-i", fijo]
            g = f"[0:v]scale={W}:{H}{color},setsar=1,format=yuv420p[v0]"
        elif t["fuente"] is None:                                    # testimonio sin imagen (solo voz): negro
            cmd += ["-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={FPS}"]
            g = "[0:v]format=yuv420p[v0]"
        elif t["imagen"]:                                            # captura fija usada como toma de apoyo
            cmd += ["-loop", "1", "-framerate", str(FPS), "-i", t["fuente"]]
            g = f"[0:v]{marco[t['encuadre']]},setsar=1,format=yuv420p[v0]"
        else:
            cmd += ["-ss", f"{t['ini'] + seg(desde):.4f}", "-i", t["fuente"]]
            g = f"[0:v]{marco[t['encuadre']]},setsar=1,fps={FPS},tpad=stop_mode=clone:stop=-1,format=yuv420p[v0]"
        for k, (png, x, y, a, b) in enumerate(subs):
            cmd += ["-i", png]
            g += f";[v{k}][{k + 1}:v]overlay={x}:{y}:enable='between(n,{a},{b - 1})'[v{k + 1}]"
        g += f";[v{len(subs)}]setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709[vf]"
        cmd += ["-filter_complex", g, "-map", "[vf]", "-frames:v", str(n), "-an"]
        if foto is not None: cmd += ["-q:v", "2", salida]
        else: cmd += ["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-bf", "0", "-g", str(FPS), "-pix_fmt", "yuv420p", "-r", str(FPS),
                      "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                      "-video_track_timescale", "30000", salida]
        correr(cmd, entrada, f"la toma {self.corto(t['fuente']) if t['fuente'] else 'en negro'} del bloque {B['n']}")

    # ---------- sonido ----------
    def _voz(self, B):
        """El sonido del bloque como arreglo (muestras, 2) ya nivelado y del largo exacto del bloque."""
        n, A = B["N"] * SR // FPS, B["audio"]
        if not A: return np.zeros((n, 2), np.float32)
        if A["tipo"] == "voz": x, nivel = decodificar(A["fuente"], A["ini"], seg(B["N"])), NIVEL_VOZ
        elif A["tipo"] == "archivo": x, nivel = decodificar(A["fuente"], 0, seg(B["N"])), NIVEL_VOZ + A["db"]
        else:
            x = np.concatenate([microfundido(largo(decodificar(t["fuente"], t["ini"], seg(t["n"])), t["n"] * SR // FPS)) for t in B["tomas"]])
            nivel = NIVEL_VOZ + A["db"]
        x = largo(x, n)
        I, _ = medir(x)
        if I > -60: x = limitar(x, float(np.clip(nivel - I, -30, 40)), -1.5)    # misma sonoridad para todas las voces
        return microfundido(largo(x, n))

    def firma(self, B):
        """Huella del contenido del bloque: si no cambia nada de lo que se ve o se oye, no se rehace."""
        archivos = sorted({t["fuente"] for t in B["tomas"] if t["fuente"]} | ({B["audio"]["fuente"]} if B["audio"] and "fuente" in B["audio"] else set()))
        datos = dict(receta=RECETA, tipografia=(tipografia(), _tipo["ruta"])[1] if B["subs"] else "", tomas=B["tomas"], subs=B["subs"], audio=B["audio"], N=B["N"],
                     nivel=NIVEL_VOZ, archivos=[(a, os.path.getsize(a), int(os.path.getmtime(a))) for a in archivos])
        return hashlib.sha1(json.dumps(datos, sort_keys=True, default=str).encode()).hexdigest()[:12]

    def render_bloque(self, B):
        """Exporta un bloque a salida/partes/<firma>.mp4 (imagen) y .wav (sonido). Devuelve la ruta sin extensión."""
        os.makedirs(self.partes, exist_ok=True)
        base = os.path.join(self.partes, f"b_{self.firma(B)}")
        if os.path.exists(base + ".mp4") and os.path.exists(base + ".wav"):
            print(f"  bloque {B['n']:>2}: sin cambios, se reutiliza"); return base
        print(f"  bloque {B['n']:>2}: {B['tipo']} · {seg(B['N']):.1f} s · {len(B['tomas'])} toma(s)…", flush=True)
        tmp = tempfile.mkdtemp(prefix="tomas_", dir=self.partes)
        try:
            lista = os.path.join(tmp, "lista.txt")
            with open(lista, "w") as f:
                for k, t in enumerate(B["tomas"]):
                    p = os.path.join(tmp, f"t{k:03d}.mp4"); self.render_toma(B, t, p); f.write(f"file '{p}'\n")
            correr([FF, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", "-video_track_timescale", "30000", base + ".parcial.mp4"])
            hay = contar_cuadros(base + ".parcial.mp4")
            if hay != B["N"]: alto(f"El bloque {B['n']} salió con {hay} cuadros y debía tener {B['N']}. Revisa que sus fuentes no estén dañadas.")
            guardar_wav(base + ".wav", self._voz(B))
            os.replace(base + ".parcial.mp4", base + ".mp4")
        finally:
            for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
            os.rmdir(tmp)
            if os.path.exists(base + ".parcial.mp4"): os.remove(base + ".parcial.mp4")
        return base

    def mezcla(self, bases):
        """Une las voces de todos los bloques, mete la música y los efectos y deja la mezcla a −14 LUFS con techo de −1.4 dB."""
        S = self.spec
        x = np.concatenate([leer_wav(b + ".wav") for b in bases]); n = len(x)
        if self.musica:
            m = decodificar(self.musica, float(S.get("musica_desde", 0)), n / SR, repetir=True)
            I, _ = medir(m)
            if I > -60:
                bajo, alto_ = float(S.get("musica_db", MUSICA_DB)), float(S.get("musica_puente_db", MUSICA_PUENTE_DB))
                env = np.zeros(n, np.float32)
                for B in self.bloques:                               # debajo de la voz baja; cuando nadie habla sube
                    db = B["musica_db"] if B["musica_db"] is not None else (bajo if B["audio"] else alto_)
                    a, b = B["inicio"] * SR // FPS, (B["inicio"] + B["N"]) * SR // FPS
                    env[a:b] = 0 if B["musica"] is False else 10 ** (float(db) / 20)
                k = int(0.25 * SR)                                   # los cambios de nivel tardan un cuarto de segundo (sin chasquidos)
                c = np.cumsum(np.concatenate([np.full(k, env[0], np.float64), env, np.full(k, env[-1], np.float64)]))
                env = ((c[k:] - c[:-k]) / k)[k // 2: k // 2 + n].astype(np.float32)
                f = min(n, int(float(S.get("musica_fundido", 1.5)) * SR))
                if f: env[-f:] *= np.linspace(1, 0, f, dtype=np.float32)   # fundido final
                x = x + m * (10 ** ((NIVEL_VOZ - I) / 20)) * env[:, None]
        for B in self.bloques:
            for s in B["sonidos"]:                                   # efectos: «en» cuenta desde el inicio del bloque (negativo = antes del corte)
                e = decodificar(s["fuente"], 0, None)
                e = e * (10 ** (s["db"] / 20) / max(1e-6, float(np.abs(e).max())))
                a = int(round((seg(B["inicio"]) + s["en"]) * SR))
                if a < 0: e, a = e[-a:], 0
                e = e[: max(0, n - a)]; x[a:a + len(e)] += e
        I, _ = medir(x)
        if I < -60: return x.astype(np.float32), I, -99.0
        g, techo = NIVEL_FINAL - I, TECHO - 0.3
        for _ in range(4):                                           # sube a −14 LUFS y limita; corrige si el limitador movió el volumen
            y = limitar(x, g, techo); I2, pico = medir(y)
            if abs(I2 - NIVEL_FINAL) <= 0.25 and pico <= TECHO: break
            g += (NIVEL_FINAL - I2) if abs(I2 - NIVEL_FINAL) > 0.25 else 0
            techo -= max(0.0, pico - TECHO + 0.1)
        return y, I2, pico

    # ---------- exportar ----------
    def exportar(self, solo=None):
        plan = os.path.join(self.base, "PLAN.md")
        if not os.path.exists(plan) or os.path.getmtime(plan) < os.path.getmtime(self.json):
            print("⚠ El JSON cambió después del último plan (o no hay PLAN.md). Antes de exportar: --plan, enseñarlo y esperar el «sí».")
        os.makedirs(self.partes, exist_ok=True)
        if solo:
            if not 1 <= solo <= len(self.bloques): alto(f"--solo {solo}: el compilado tiene {len(self.bloques)} bloques.")
            B = self.bloques[solo - 1]; base = self.render_bloque(B)
            sal = os.path.join(self.salida, f"bloque_{solo:02d}.mp4")
            correr([FF, "-v", "error", "-y", "-i", base + ".mp4", "-i", base + ".wav", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", sal])
            print(f"\n✓ Bloque {solo} → {sal}   (voz nivelada, sin música ni mezcla final)"); return sal
        print(f"Exportando «{self.nombre}»: {len(self.bloques)} bloques, {reloj(seg(self.N))}")
        bases = [self.render_bloque(B) for B in self.bloques]
        print("  mezcla de sonido…", flush=True)
        y, I, pico = self.mezcla(bases)
        mez, lista = os.path.join(self.partes, "mezcla.wav"), os.path.join(self.partes, "lista.txt")
        guardar_wav(mez, y)
        with open(lista, "w") as f: f.writelines(f"file '{b}.mp4'\n" for b in bases)
        sal, parcial = os.path.join(self.salida, self.nombre + ".mp4"), os.path.join(self.salida, self.nombre + ".parcial.mp4")
        correr([FF, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-i", mez, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-f", "mp4", parcial], que="la unión final")
        hay = contar_cuadros(parcial)
        if hay != self.N: alto(f"El video final salió con {hay} cuadros y la suma de los bloques es {self.N}. No se entrega: avisa de este error.")
        os.replace(parcial, sal); os.remove(mez)
        usados = {os.path.basename(b) for b in bases}               # partes de versiones anteriores que ya no se usan: fuera
        for f in os.listdir(self.partes):
            if re.fullmatch(r"b_[0-9a-f]{12}\.(mp4|wav)", f) and f[:14] not in usados: os.remove(os.path.join(self.partes, f))
        If, pf = medir(decodificar(sal, 0, None))
        print(f"\n✓ Listo: {sal}\n  Duración {reloj(seg(self.N))} ({self.N} cuadros = suma de los bloques) · volumen {If:.1f} LUFS · pico {pf:.1f} dB")
        if abs(If - NIVEL_FINAL) > 1 or pf > -1.0: print("  ⚠ El volumen quedó fuera de lo esperado (−14 LUFS, pico bajo −1 dB). Revisa las fuentes.")
        return sal

    # ---------- fotos ----------
    def fotos(self):
        """Una foto a media duración de cada bloque, de cada subtítulo y de cada toma de apoyo, sin exportar el video."""
        carpeta = os.path.join(self.salida, "fotos"); os.makedirs(carpeta, exist_ok=True); os.makedirs(self.partes, exist_ok=True)
        for f in os.listdir(carpeta):
            if re.fullmatch(r"(b\d+_.*|hoja(_\d+)?)\.jpg", f): os.remove(os.path.join(carpeta, f))
        pedidos = []                                                 # (archivo, bloque, cuadro dentro del bloque, rótulo)
        for B in self.bloques:
            n = B["n"]
            pedidos.append((f"b{n:02d}_medio.jpg", B, B["N"] // 2, f"Bloque {n} · {B['tipo']} · a la mitad"))
            for k, s in enumerate(B["subs"], 1): pedidos.append((f"b{n:02d}_sub{k}.jpg", B, (s["f0"] + s["f1"]) // 2, f"Bloque {n} · subtítulo {k}"))
            for k, t in enumerate([t for t in B["tomas"] if t["clase"] == "apoyo"], 1):
                pedidos.append((f"b{n:02d}_apoyo{k}.jpg", B, t["f0"] + t["n"] // 2, f"Bloque {n} · apoyo {k} · {os.path.basename(t['fuente'])} {t['ini']:.1f} s"))
        celdas = []
        for arch, B, f, rot in pedidos:
            t = next(t for t in B["tomas"] if t["f0"] <= f < t["f0"] + t["n"])
            p = os.path.join(carpeta, arch); self.render_toma(B, t, p, foto=f - t["f0"])
            celdas.append((p, f"{rot} · {reloj(seg(B['inicio'] + f))}"))
        hojas = hoja_contacto(celdas, os.path.join(carpeta, "hoja.jpg"))
        print(f"✓ {len(celdas)} fotos en {carpeta}\n  Hojas para revisar: " + ", ".join(hojas))
        return hojas


# ---------- utilidades de sonido ----------
def decodificar(ruta, ini, dur, repetir=False):
    """Sonido de un archivo como arreglo float32 (muestras, 2) a 48 kHz."""
    cmd = [FF, "-v", "error"] + (["-stream_loop", "-1"] if repetir else []) + ["-ss", f"{ini:.4f}", "-i", ruta]
    if dur is not None: cmd += ["-t", f"{dur:.4f}"]
    r = correr(cmd + ["-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], que=f"leer el sonido de {os.path.basename(ruta)}")
    x = np.frombuffer(r.stdout, np.float32).reshape(-1, 2)
    return largo(x, int(round(dur * SR))) if dur is not None else x.copy()

def largo(x, n):
    """Corta o rellena con silencio para que mida exactamente n muestras."""
    return x[:n].copy() if len(x) >= n else np.concatenate([x, np.zeros((n - len(x), 2), np.float32)])

def microfundido(x, ms=8):
    """Entrada y salida de 8 milésimas: el corte sigue siendo seco, pero sin chasquido."""
    k = min(len(x) // 2, int(SR * ms / 1000))
    if k:
        r = np.linspace(0, 1, k, dtype=np.float32)[:, None]; x = x.copy(); x[:k] *= r; x[-k:] *= r[::-1]
    return x

def medir(x):
    """(volumen integrado en LUFS, pico real en dB) de un arreglo."""
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", "ebur128=peak=true", "-f", "null", "-"],
                       input=np.ascontiguousarray(x, np.float32).tobytes(), capture_output=True).stderr.decode(errors="replace")
    r = r[r.rfind("Summary:"):] if "Summary:" in r else ""
    I, P = re.search(r"I:\s+(-?[\d.]+|-?inf) LUFS", r), re.search(r"Peak:\s+(-?[\d.]+|-?inf) dBFS", r)
    num = lambda m: -99.0 if not m or "inf" in m.group(1) else float(m.group(1))
    return num(I), num(P)

_lim = {}
def limitar(x, ganancia_db, techo_db):
    """Sube o baja el volumen y limita los picos (a 4× la frecuencia, para cuidar el pico real). No retrasa el sonido."""
    if "latency" not in _lim:                                        # el limitador mira 5 milésimas adelante: hay que compensarlas
        _lim["latency"] = "latency" in subprocess.run([FF, "-hide_banner", "-h", "filter=alimiter"], capture_output=True, text=True).stdout
    af = (f"volume={ganancia_db:.2f}dB,aresample={SR * 4},alimiter=limit={10 ** (techo_db / 20):.4f}:level=false:attack=5:release=80"
          + (":latency=1" if _lim["latency"] else "") + f",aresample={SR}")
    r = correr([FF, "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", af, "-f", "f32le", "-"],
               np.ascontiguousarray(x, np.float32).tobytes(), "el limitador")
    y = np.frombuffer(r.stdout, np.float32).reshape(-1, 2)
    if not _lim["latency"]: y = y[int(0.005 * SR):]                  # ffmpeg viejo: se recorre a mano
    return largo(y, len(x))

def guardar_wav(ruta, x):
    with wave.open(ruta, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())

def leer_wav(ruta):
    with wave.open(ruta, "rb") as w:
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, 2).astype(np.float32) / 32767

def contar_cuadros(ruta):
    r = subprocess.run([FP, "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", ruta],
                       capture_output=True, text=True).stdout.strip().strip(",")
    return int(r) if r.isdigit() else -1


# ---------- hoja de fotos ----------
def hoja_contacto(celdas, salida, cols=3, ancho=640):
    """Pega las fotos en hojas de 3 columnas con su rótulo. Devuelve la lista de hojas."""
    try: letra = ImageFont.truetype(os.path.join(REPO, "fonts", "Poppins-SemiBold.ttf"), 20)
    except OSError: letra = ImageFont.load_default()
    alto_c, por_hoja, hojas = ancho * H // W + 34, cols * 4, []
    for h in range(0, len(celdas), por_hoja):
        grupo = celdas[h:h + por_hoja]
        hoja = Image.new("RGB", (cols * ancho, -(-len(grupo) // cols) * alto_c), (24, 24, 24)); d = ImageDraw.Draw(hoja)
        for i, (p, rot) in enumerate(grupo):
            x, y = (i % cols) * ancho, (i // cols) * alto_c
            hoja.paste(Image.open(p).convert("RGB").resize((ancho - 4, (ancho - 4) * H // W), Image.LANCZOS), (x + 2, y + 32))
            d.text((x + 8, y + 4), rot[:58], font=letra, fill=(255, 255, 255))
        ruta = salida if h == 0 else salida.replace(".jpg", f"_{h // por_hoja + 1}.jpg")
        hoja.save(ruta, quality=88); hojas.append(ruta)
    return hojas


def main():
    ap = argparse.ArgumentParser(description="Arma un compilado de testimonios a partir de un JSON de bloques (ver ESTILO.md).")
    ap.add_argument("json", help="el compilado, p. ej. proyectos/mi-video/compilado.json")
    ap.add_argument("--plan", action="store_true", help="no exporta: escribe PLAN.md para enseñárselo a la persona")
    ap.add_argument("--fotos", action="store_true", help="una foto de cada bloque, subtítulo y toma de apoyo → salida/fotos/hoja.jpg")
    ap.add_argument("--solo", type=int, metavar="N", help="exporta solo el bloque N")
    a = ap.parse_args()
    if not os.path.exists(a.json): alto(f"No existe {a.json}")
    revisar_ffmpeg()
    carpeta = os.path.dirname(os.path.abspath(a.json))
    hacer = os.path.join(carpeta, "hacer_material.sh")              # la demo fabrica su propio material de muestra
    if os.path.exists(hacer) and not os.path.isdir(os.path.join(carpeta, "material")):
        print("Falta el material de muestra de la demo: lo genero (tarda ≈ 1 min)…", flush=True)
        if subprocess.run(["/bin/bash", hacer], env=dict(os.environ, PYTHON=sys.executable, FFMPEG=FF)).returncode != 0:
            alto("No se pudo generar el material de la demo (hacer_material.sh).")
    C = Compilado(a.json)
    if C.errores:
        print("\n✗ El compilado tiene errores. Corrígelos en el JSON y vuelve a correr:\n")
        for e in C.errores: print(f"  · {e}")
        print(); sys.exit(1)
    if a.plan:
        print(C.plan()); print(f"(guardado en {os.path.join(C.base, 'PLAN.md')})")
    elif a.fotos: C.fotos()
    else:
        for av in C.avisos: print(f"⚠ {av}")
        C.exportar(a.solo)

if __name__ == "__main__":
    main()
