"""Saca los cuadros de una grabación de pantalla (o de una toma de apoyo en video) para ponerla dentro de una pieza del estilo.

Uso:  .venv/bin/python motor/pantalla.py <video> <proyecto> <nombre> [--fps 30] [--ancho 1920] [--desde 0] [--hasta 0] [--calidad 3]

  <video>     la grabación (mp4, mov…)
  <proyecto>  proyectos/<video>  (o solo su nombre)
  <nombre>    cómo se va a llamar dentro del proyecto; en el beat se pide con  pantalla: '<nombre>'

Escribe  proyectos/<proyecto>/pantalla/<nombre>/000001.jpg, 000002.jpg…  y  datos.json  con { fps, n, ancho, alto, dur }.
El motor los sirve en /proyecto/pantalla/<nombre>/…  Ocupa ≈ 4–8 MB por segundo a 1920 px: saca solo el tramo que vayas a usar
(--desde / --hasta, en segundos). Si la pieza va a acercarse mucho (zoom 1.8×), usa --ancho 2560.
"""
import sys, os, json, glob, shutil, subprocess

args = sys.argv[1:]
pos = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or not args[i - 1].startswith('--'))]
if len(pos) < 3: sys.exit(__doc__)
def op(k, d): return type(d)(args[args.index(k) + 1]) if k in args else d
src, proy, nombre = pos[:3]
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if not os.path.exists(src): sys.exit(f'✗ no existe {src}')
if not os.path.isdir(proy): proy = os.path.join(RAIZ, 'proyectos', proy)
if not os.path.isfile(os.path.join(proy, 'proyecto.json')): sys.exit(f'✗ {proy} no es un proyecto (le falta proyecto.json)')
if not nombre.replace('-', '').replace('_', '').isalnum(): sys.exit('✗ el nombre solo puede llevar letras, números, guion y guion bajo')
FF = os.environ.get('FFMPEG', 'ffmpeg'); FP = os.environ.get('FFPROBE', 'ffprobe')

o = subprocess.run([FP, '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', src],
                   capture_output=True, text=True, check=True).stdout
s = json.loads(o); st = s['streams'][0]; num, den = st['r_frame_rate'].split('/')
fps_fuente = float(num) / float(den); dur_fuente = float(s['format']['duration'])
fps = op('--fps', min(30.0, round(fps_fuente, 3))); ancho_max = op('--ancho', 1920); desde = op('--desde', 0.0); hasta = op('--hasta', 0.0) or dur_fuente
dur = max(0.0, min(hasta, dur_fuente) - desde)
if dur <= 0: sys.exit('✗ el tramo pedido está vacío (revisa --desde y --hasta)')
libre = shutil.disk_usage(proy).free / 1e9; hace_falta = dur * 0.008 * (ancho_max / 1920) ** 2
if libre < hace_falta + 2: sys.exit(f'✗ poco espacio: estos cuadros ocupan ≈ {hace_falta:.1f} GB y quedan {libre:.1f} GB libres')

dest = os.path.join(proy, 'pantalla', nombre)
shutil.rmtree(dest, ignore_errors=True); os.makedirs(dest)
vf = f'fps={fps}' + (f',scale={ancho_max}:-2' if st['width'] > ancho_max else '')
print(f'cuadros de {os.path.basename(src)}: {dur:.1f} s a {fps:g} cuadros por segundo…', flush=True)
subprocess.run([FF, '-v', 'error', '-y', '-ss', str(desde), '-t', str(dur), '-i', src, '-an', '-vf', vf, '-q:v', str(op('--calidad', 3)), os.path.join(dest, '%06d.jpg')], check=True)
cuadros = sorted(glob.glob(os.path.join(dest, '*.jpg'))); n = len(cuadros)
if not n: sys.exit('✗ ffmpeg no sacó ningún cuadro')
o = subprocess.run([FP, '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', cuadros[0]], capture_output=True, text=True, check=True).stdout
c = json.loads(o)['streams'][0]
json.dump({'fps': fps, 'n': n, 'ancho': c['width'], 'alto': c['height'], 'dur': round(n / fps, 3), 'fuente': os.path.basename(src)}, open(os.path.join(dest, 'datos.json'), 'w'), indent=1)
peso = sum(os.path.getsize(f) for f in cuadros) / 1e6
print(f"✓ {n} cuadros ({peso:.0f} MB) en {dest}\n  en el beat:  pieza: 'pantalla', pantalla: '{nombre}'")
