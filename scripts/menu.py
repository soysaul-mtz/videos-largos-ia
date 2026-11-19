"""Arma el MENÚ de plantillas largas: una página local (menu/index.html) y el catálogo en texto (PLANTILLAS.md).

Uso:  .venv/bin/python scripts/menu.py              arma el menú con las muestras que ya existan
      .venv/bin/python scripts/menu.py --muestras   además vuelve a sacar las imágenes y el clip de cada plantilla
                                                    (desde su demo; tarda unos minutos, un proceso a la vez)

Lee plantillas/<id>/plantilla.json de cada plantilla. Las muestras salen de las DEMOS de este sistema (contenido propio):
  plantillas/<id>/muestra/1.jpg … 6.jpg   seis cuadros
  plantillas/<id>/muestra/muestra.mp4     clip de 10–12 s, ligero, sin sonido
Nada depende de internet ni de videos de otras personas.
"""
import json, os, glob, subprocess, sys, html, shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
FF = next((f for f in ['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg', shutil.which('ffmpeg') or ''] if f and os.path.exists(f)), 'ffmpeg')


def plantillas():
    L = []
    for f in sorted(glob.glob('plantillas/*/plantilla.json')):
        d = json.load(open(f)); d['carpeta'] = os.path.dirname(f); L.append(d)
    return sorted(L, key=lambda d: d.get('numero', 99))


def corre(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode: sys.exit(f"✗ falló: {' '.join(map(str, cmd))}\n{r.stderr[-800:]}")
    return r


def muestras(p):
    """saca 6 cuadros y un clip corto de la demo de la plantilla"""
    m = p.get('muestra') or {}; proy = m.get('proyecto'); dst = os.path.join(p['carpeta'], 'muestra')
    if not proy: print(f"  · {p['id']}: sin muestra definida"); return
    os.makedirs(dst, exist_ok=True)
    ts = m.get('tiempos', [])[:6]; a, b = m.get('tramo', [0, 10])
    if os.path.exists(os.path.join(proy, 'beats.js')):   # plantilla del motor: se fotografía y se renderiza el tramo
        corre(['node', 'motor/render.mjs', proy, '--fotos', ','.join(str(t) for t in ts)])
        for i, t in enumerate(ts, 1):
            corre([FF, '-v', 'error', '-y', '-i', os.path.join(proy, 'fotos', f"f_{t:07.2f}.jpg"),
                   '-vf', 'scale=960:-2', '-q:v', '4', os.path.join(dst, f'{i}.jpg')])
        corre(['nice', '-n', '10', 'node', 'motor/render.mjs', proy, '--desde', f'{a:g}', '--hasta', f'{b:g}', '--sin-audio'])
        clip = os.path.join(proy, 'salida', f'prueba_{a:g}-{b:g}.mp4')
    else:                                                # plantilla armada con ffmpeg (testimonios): se toma de su video de demo
        vids = glob.glob(os.path.join(proy, 'salida', '*.mp4'))
        if not vids: sys.exit(f"✗ falta el video de demo de {p['id']}: corre ./verificar.sh primero")
        clip = vids[0]
        for i, t in enumerate(ts, 1):
            corre([FF, '-v', 'error', '-y', '-ss', str(t), '-i', clip, '-frames:v', '1', '-vf', 'scale=960:-2', '-q:v', '4', os.path.join(dst, f'{i}.jpg')])
    corre(['nice', '-n', '10', FF, '-v', 'error', '-y', *([] if os.path.exists(os.path.join(proy, 'beats.js')) else ['-ss', str(a), '-t', str(b - a)]), '-i', clip,
           '-an', '-vf', 'scale=960:-2,fps=24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
           os.path.join(dst, 'muestra.mp4')])
    print(f"  ✓ {p['id']}: {len(ts)} imágenes y clip de {b - a:g} s")


def hay(p, f): return os.path.exists(os.path.join(p['carpeta'], 'muestra', f))
e = html.escape


def pagina(P):
    tarjetas = []
    for p in P:
        base = f"../{p['carpeta']}/muestra"
        video = (f'<video src="{base}/muestra.mp4" poster="{base}/1.jpg" autoplay muted loop playsinline></video>' if hay(p, 'muestra.mp4')
                 else (f'<img src="{base}/1.jpg" alt="">' if hay(p, '1.jpg') else '<div class="sin">Sin muestra todavía</div>'))
        minis = ''.join(f'<img src="{base}/{i}.jpg" alt="Muestra {i} de la plantilla {e(p["nombre"])}" loading="lazy">' for i in range(1, 7) if hay(p, f'{i}.jpg'))
        secc = ''.join(f'<div class="tramo" style="flex:{s["porcentaje"]}" title="{e(s["que_pasa"])}"><b>{e(s["nombre"])}</b><span>{s["porcentaje"]} %</span></div>' for s in p.get('secciones', []))
        secc_lista = ''.join(f'<li><b>{e(s["nombre"])}</b> · {e(s["que_pasa"])}</li>' for s in p.get('secciones', []))
        li = lambda L: ''.join(f'<li>{e(x)}</li>' for x in L)
        piezas = ''.join(f'<li><code>{e(x["pieza"])}</code> {e(x["que_es"])}</li>' for x in p.get('piezas_destacadas', []))
        tarjetas.append(f'''
<section class="plantilla" id="{e(p["id"])}">
  <header><span class="num">{p.get("numero", "")}</span><div><h2>{e(p["nombre"])}</h2><p class="resumen">{e(p["resumen"])}</p></div></header>
  <div class="vista">{video}</div>
  <div class="minis">{minis}</div>
  <div class="pedir"><span>Para usarla, dile a Claude:</span><code id="c-{e(p["id"])}">{e(p["como_pedirla"])}</code><button data-copia="c-{e(p["id"])}">Copiar</button></div>
  <div class="datos">
    <div><h3>Sirve para</h3><ul>{li(p.get("sirve_para", []))}</ul></div>
    <div><h3>Mejor usa otra si</h3><ul>{li(p.get("no_sirve_para", []))}</ul></div>
    <div><h3>Lo que necesitas tener</h3><ul>{li(p.get("material", []))}</ul></div>
    <div><h3>Datos</h3><ul><li><b>Duración ideal:</b> {e(p.get("duracion_ideal", ""))}</li><li><b>Tiempo de edición:</b> {e(p.get("tiempo_de_edicion", ""))}</li></ul></div>
  </div>
  <h3>Cómo se reparte el video</h3>
  <div class="barra">{secc}</div>
  <details><summary>Qué pasa en cada parte</summary><ol>{secc_lista}</ol></details>
  <details><summary>Animaciones principales</summary><ul class="piezas">{piezas}</ul></details>
  <p class="archivos">Archivos: <code>{e(p["carpeta"])}/ESTILO.md</code> (cómo se ve y cómo usarla) · <code>ESCALETA-BASE.md</code> (estructura y guion para grabar) · <code>base/</code> (proyecto en blanco)</p>
</section>''')
    indice = ''.join(f'<a href="#{e(p["id"])}"><b>{p.get("numero", "")}</b> {e(p["nombre"])}</a>' for p in P)
    return f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Menú de plantillas largas</title>
<style>
  :root {{ --fondo:#f6f5f2; --tarjeta:#fff; --texto:#1b1b1f; --suave:#62626b; --linea:#e3e1db; --acento:#5b3df5; --acento2:#f08a24; }}
  @media (prefers-color-scheme: dark) {{ :root {{ --fondo:#0f0f13; --tarjeta:#18181e; --texto:#f1f1f4; --suave:#a2a2ad; --linea:#2b2b34; --acento:#9d8bff; --acento2:#ffb054; }} }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--fondo); color:var(--texto); font:16px/1.55 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; }}
  .pagina {{ max-width:1080px; margin:0 auto; padding:40px 20px 80px; }}
  h1 {{ font-size:34px; line-height:1.15; margin:0 0 8px; letter-spacing:-.02em; }}
  .intro {{ color:var(--suave); max-width:62ch; margin:0 0 20px; }}
  nav {{ display:flex; flex-wrap:wrap; gap:10px; margin:0 0 34px; }}
  nav a {{ text-decoration:none; color:var(--texto); background:var(--tarjeta); border:1px solid var(--linea); border-radius:999px; padding:8px 16px; }}
  nav a b {{ color:var(--acento); margin-right:6px; }}
  .plantilla {{ background:var(--tarjeta); border:1px solid var(--linea); border-radius:20px; padding:26px; margin:0 0 30px; }}
  .plantilla header {{ display:flex; gap:16px; align-items:center; margin-bottom:18px; }}
  .num {{ flex:none; width:52px; height:52px; border-radius:14px; background:var(--acento); color:#fff; font-weight:700; font-size:26px; line-height:52px; text-align:center; }}
  h2 {{ margin:0; font-size:26px; letter-spacing:-.01em; }}
  .resumen {{ margin:2px 0 0; color:var(--suave); }}
  .vista video, .vista img {{ width:100%; display:block; border-radius:14px; background:#000; aspect-ratio:16/9; object-fit:cover; }}
  .sin {{ aspect-ratio:16/9; display:grid; place-items:center; border:1px dashed var(--linea); border-radius:14px; color:var(--suave); }}
  .minis {{ display:grid; grid-template-columns:repeat(6, 1fr); gap:8px; margin:10px 0 18px; }}
  .minis img {{ width:100%; border-radius:8px; display:block; aspect-ratio:16/9; object-fit:cover; }}
  .pedir {{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; background:var(--fondo); border:1px solid var(--linea); border-radius:12px; padding:12px 14px; margin-bottom:20px; }}
  .pedir span {{ color:var(--suave); }}
  .pedir code {{ flex:1; min-width:240px; font:14px/1.4 ui-monospace, Menlo, monospace; overflow-wrap:anywhere; }}
  button {{ font:inherit; border:0; border-radius:9px; background:var(--acento); color:#fff; padding:7px 14px; cursor:pointer; }}
  .datos {{ display:grid; grid-template-columns:repeat(2, 1fr); gap:6px 28px; }}
  h3 {{ font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:var(--suave); margin:16px 0 6px; }}
  ul, ol {{ margin:0; padding-left:20px; }} li {{ margin:3px 0; }}
  .barra {{ display:flex; gap:3px; border-radius:10px; overflow:hidden; margin:4px 0 10px; }}
  .tramo {{ min-width:0; background:color-mix(in srgb, var(--acento) 18%, transparent); padding:8px 6px; text-align:center; font-size:12px; line-height:1.25; overflow:hidden; }}
  .tramo:nth-child(even) {{ background:color-mix(in srgb, var(--acento2) 22%, transparent); }}
  .tramo b {{ display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }} .tramo span {{ color:var(--suave); }}
  details {{ border-top:1px solid var(--linea); padding:10px 0; }} summary {{ cursor:pointer; font-weight:600; }}
  details > * + * {{ margin-top:8px; }}
  .piezas code, .archivos code {{ font:13px ui-monospace, Menlo, monospace; background:var(--fondo); border:1px solid var(--linea); border-radius:6px; padding:1px 6px; }}
  .archivos {{ color:var(--suave); font-size:14px; margin:12px 0 0; overflow-wrap:anywhere; }}
  .nueva {{ border-style:dashed; }}
  @media (max-width:720px) {{ .datos {{ grid-template-columns:1fr; }} .minis {{ grid-template-columns:repeat(3, 1fr); }} h1 {{ font-size:27px; }} .plantilla {{ padding:18px; }} .tramo span {{ display:none; }} }}
</style></head><body><div class="pagina">
<h1>Menú de plantillas largas</h1>
<p class="intro">Cada plantilla es una forma completa de editar un video largo: cómo se ve, qué va en cada parte y qué necesitas tener. Elige una y díselo a Claude. Lo que ves aquí son muestras hechas con este mismo sistema.</p>
<nav>{indice}<a href="#nueva"><b>+</b> Crear una nueva</a></nav>
{''.join(tarjetas)}
<section class="plantilla nueva" id="nueva">
  <header><span class="num">+</span><div><h2>Crear una plantilla nueva</h2><p class="resumen">A partir de un video o de una imagen que te guste.</p></div></header>
  <div class="pedir"><span>Dile a Claude:</span><code id="c-nueva">Crea una plantilla larga nueva a partir de este video: /ruta/al/video.mp4</code><button data-copia="c-nueva">Copiar</button></div>
  <ol><li>Claude estudia el video cuadro por cuadro (o la imagen) y escribe la ficha: ritmo, colores, tipografía y cada animación con sus medidas.</li>
  <li>Programa las animaciones y te enseña fotos de cómo quedaron.</li>
  <li>La agrega a este menú con su número, su estructura y su proyecto en blanco.</li></ol>
  <p class="archivos">El video que pases solo se usa para estudiarlo en tu computadora. La plantilla queda guardada como archivos de texto y código: después ya no hace falta el video.</p>
</section>
</div>
<script>
  document.querySelectorAll('button[data-copia]').forEach(b => b.addEventListener('click', () => {{
    const t = document.getElementById(b.dataset.copia).textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => {{
      const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }});
    b.textContent = 'Copiado'; setTimeout(() => b.textContent = 'Copiar', 1400); }}));
</script>
</body></html>'''


def catalogo(P):
    L = ['# Menú de plantillas largas', '',
         'Cada plantilla es una forma completa de editar un video largo: cómo se ve, qué va en cada parte y qué material hace falta.',
         'Para verlo con imágenes y clips en tu computadora, abre `menu/index.html` (o pídele a Claude: «enséñame el menú de plantillas»).', '',
         '| # | Plantilla | Qué es | Duración ideal |', '|---|---|---|---|']
    for p in P: L.append(f"| {p.get('numero', '')} | **{p['nombre']}** | {p['resumen']} | {p.get('duracion_ideal', '')} |")
    for p in P:
        L += ['', f"## {p['titulo']}", '', p['resumen'], '']
        if hay(p, '1.jpg'):
            L += ['<p>' + ''.join(f'<img src="{p["carpeta"]}/muestra/{i}.jpg" width="32%" alt="Muestra {i}">' + (' ' if i % 3 else '<br>') for i in range(1, 7) if hay(p, f'{i}.jpg')) + '</p>', '']
        L += [f"**Para usarla, dile a Claude:** «{p['como_pedirla']}»", '',
              '**Sirve para:** ' + '; '.join(p.get('sirve_para', [])) + '.', '',
              '**Mejor usa otra si:** ' + '; '.join(p.get('no_sirve_para', [])) + '.', '',
              '**Lo que necesitas tener:**', *[f'- {x}' for x in p.get('material', [])], '',
              f"**Tiempo de edición:** {p.get('tiempo_de_edicion', '')}", '',
              '**Cómo se reparte el video:**', '', '| Parte | % | Qué pasa |', '|---|---|---|',
              *[f"| {s['nombre']} | {s['porcentaje']} | {s['que_pasa']} |" for s in p.get('secciones', [])], '',
              f"**Archivos:** `{p['carpeta']}/ESTILO.md` (cómo se ve y cómo usarla), `ESCALETA-BASE.md` (estructura y guion para grabar), `base/` (proyecto en blanco).",
              f"Empezar un video: `scripts/nuevo.sh {p['id']} \"Nombre del video\" /ruta/al/video-cortado.mp4`"]
    L += ['', '## Crear una plantilla nueva', '',
          'A partir de un video o de una imagen que te guste, dile a Claude: «Crea una plantilla larga nueva a partir de este video: /ruta/al/video.mp4».',
          'Claude lo estudia cuadro por cuadro en tu computadora (`scripts/desglosar.sh`), escribe la ficha, programa las animaciones y la agrega a este menú.',
          'La plantilla queda guardada como texto y código: después ya no hace falta el video.', '',
          '_Este archivo y `menu/index.html` los arma `scripts/menu.py` a partir de `plantillas/<id>/plantilla.json`. No los edites a mano._', '']
    return '\n'.join(L)


P = plantillas()
if not P: sys.exit('✗ no hay ningún plantillas/<id>/plantilla.json')
if '--muestras' in sys.argv:
    print('Sacando muestras (un proceso a la vez)…')
    for p in P: muestras(p)
os.makedirs('menu', exist_ok=True)
open('menu/index.html', 'w').write(pagina(P))
open('PLANTILLAS.md', 'w').write(catalogo(P))
print(f"✓ menú con {len(P)} plantilla(s): menu/index.html y PLANTILLAS.md")
