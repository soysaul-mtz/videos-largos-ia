"""Base vertical 1080x1920 de un VSL horizontal ya editado, según <n>/tomas.json (clasificar.py). Sin zoom.

Uso:  python reencuadre.py <n> [--stills t1,t2,…] [--desde s --hasta s]
  persona → recorte 9:16 a la cara (fijo por toma; si la persona se mueve mucho, la sigue suave).
  grafico → el cuadro completo a lo ancho (sin la franja de subtítulos viejos), con el mismo cuadro desenfocado detrás.
  Cambio de distribución dentro de una toma: fundido de 6 cuadros.  Salida: <n>/base.mp4 (sin audio) o <n>/stills/*.jpg
"""
import sys, json, os, subprocess, bisect
import numpy as np, cv2

n = sys.argv[1]; A = sys.argv[2:]
arg = lambda k, d=None: A[A.index(k) + 1] if k in A else d
FU = json.load(open("fuentes.json"))[n]; T = json.load(open(f"{n}/tomas.json"))
FG = json.load(open(f"{n}/fotogramas.json"))
W, H, CW = T["w"], T["h"], T["recorte_w"]; OW, OH = 1080, 1920
SUB = T["resumen"]["sub_viejo"]                    # hay subtítulos quemados abajo: se tapan
SUB_TOP = T["resumen"].get("sub_top", .86)          # desde dónde (proporción del alto)
SEG = T["segmentos"]; INI = [s["ini"] for s in SEG]

# cara por fotograma (para seguir a la persona cuando se mueve)
ft = [f["t"] for f in FG["f"]]
fcx = [max(f["caras"], key=lambda c: (c[2] - c[0]) * (c[3] - c[1])) if f["caras"] else None for f in FG["f"]]
fcx = [(c[0] + c[2]) / 2 if c and c[3] - c[1] >= H * .13 else None for c in fcx]

def seg_en(t): return SEG[max(0, bisect.bisect_right(INI, t) - 1)]

suav = {}
def cx_suave(t, s):
    """Centro de recorte: el fijo de la toma, o la cara suavizada (±0.6 s) si la toma tiene mucho movimiento."""
    if s.get("mov", 0) < CW * .35: return s["cx"]
    i0, i1 = bisect.bisect_left(ft, t - .6), bisect.bisect_right(ft, t + .6)
    v = [fcx[i] for i in range(i0, i1) if fcx[i] is not None and s["ini"] <= ft[i] < s["fin"]]
    return float(np.median(v)) if v else s["cx"]

def persona(fr, t, s):
    x0 = s["x0"] if not s.get("mov") else int(round(min(max(cx_suave(t, s) - CW / 2, 0), W - CW)))
    out = cv2.resize(fr[:, x0:x0 + CW], (OW, OH), interpolation=cv2.INTER_LANCZOS4)
    if SUB:   # franja de subtítulos viejos (abajo del 86 %): desenfoque + oscurecido, queda bajo la interfaz de IG
        y0 = int(OH * SUB_TOP); band = out[y0:]
        b = cv2.GaussianBlur(cv2.resize(band, (OW // 30, max(1, band.shape[0] // 30))), (0, 0), 2)
        b = cv2.resize(b, (OW, band.shape[0]), interpolation=cv2.INTER_CUBIC)
        k = np.clip((np.arange(band.shape[0]) / 50.0), 0, 1)[:, None, None]
        osc = np.linspace(.6, .3, band.shape[0])[:, None, None]
        out[y0:] = (band * (1 - k) + (b * osc) * k).astype(np.uint8)
    return out

def panel_y(ph):
    """Arriba del panel: centrado en y≈860 (deja abajo lugar para el subtítulo), nunca arriba de 230."""
    return int(max(0, min(max(230, 860 - ph / 2), OH - ph)))

def grafico(fr, s):
    x0, x1 = s["x0"], s["x1"]
    if (x1 - x0) < CW * 1.2:   # casi 9:16: pantalla completa (un panel así de alto se ve raro)
        c = (x0 + x1) / 2; return persona(fr, 0, {"x0": int(round(min(max(c - CW / 2, 0), W - CW)))})
    src = fr[: int(H * SUB_TOP), x0:x1] if SUB else fr[:, x0:x1]
    ph = int(round(OW * src.shape[0] / src.shape[1])); fg = cv2.resize(src, (OW, ph), interpolation=cv2.INTER_AREA)
    sc = OH / H; bw = int(W * sc); bx = (bw - OW) // 2
    small = cv2.resize(fr, (bw // 10, OH // 10), interpolation=cv2.INTER_AREA)
    bg = cv2.GaussianBlur(small, (0, 0), 6)
    bg = cv2.resize(bg, (bw, OH), interpolation=cv2.INTER_LINEAR)[:, bx:bx + OW]
    out = (bg * .42).astype(np.uint8)
    y = panel_y(ph); out[y:y + ph] = fg
    for d in range(1, 26):       # sombra suave arriba y abajo del panel
        a = .35 * (1 - d / 26)
        if y - d >= 0: out[y - d] = (out[y - d] * (1 - a)).astype(np.uint8)
        if y + ph + d - 1 < OH: out[y + ph + d - 1] = (out[y + ph + d - 1] * (1 - a)).astype(np.uint8)
    return out

def una(fr, t, s): return persona(fr, t, s) if s["tipo"] == "persona" else grafico(fr, s)

CORTES = T.get("cortes", [])
def compone(fr, t):
    s = seg_en(t); img = una(fr, t, s)
    # fundido de 6 cuadros cuando cambia el encuadre sin que haya corte de toma
    i = bisect.bisect_right(INI, t) - 1
    if i > 0 and not any(abs(c - s["ini"]) < .1 for c in CORTES):
        k = (t - s["ini"]) / (6 / T["fps"])
        if k < 1: img = cv2.addWeighted(una(fr, t, SEG[i - 1]), 1 - k, img, k, 0)
    return img

cap = cv2.VideoCapture(FU); fps = cap.get(cv2.CAP_PROP_FPS)
if "--stills" in A:
    os.makedirs(f"{n}/stills", exist_ok=True)
    for t in map(float, arg("--stills").split(",")):
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, fr = cap.read()
        if ok: cv2.imwrite(f"{n}/stills/base_{t:07.2f}.jpg", compone(fr, t), [cv2.IMWRITE_JPEG_QUALITY, 88])
    sys.exit()
d0, d1 = float(arg("--desde", 0)), float(arg("--hasta", 1e9))
if d0: cap.set(cv2.CAP_PROP_POS_MSEC, d0 * 1000)
out = arg("--salida", f"{n}/base.mp4")
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{OW}x{OH}", "-r", str(fps), "-i", "-",
                       "-c:v", "h264_videotoolbox", "-b:v", "24M", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    t = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000 - 1 / fps
    if t > d1: break
    ff.stdin.write(compone(fr, max(t, 0)).tobytes()); i += 1
    if i % 1800 == 0: print(f"{n}: {t:.0f}s", flush=True)
ff.stdin.close(); ff.wait(); print("base →", out)
