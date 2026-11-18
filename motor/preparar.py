"""Prepara un proyecto para el motor de videos largos: cuadros, voz, palabras con tiempo y (opcional) máscaras de la persona.

Uso:  .venv/bin/python motor/preparar.py proyectos/<n> [--mascaras] [--sin-transcribir] [--prompt "nombres propios, marcas"]

Lee proyecto.json → "fuente" (el video YA CORTADO, sin retomas ni silencios; ruta absoluta o relativa al proyecto) y escribe:
  cuadros/%06d.jpg   un JPG por cuadro (≈ 0.5 GB por minuto a 1080p: revisa el espacio en disco antes)
  voz.wav            el audio
  palabras.json      [{t, a, b, p}] cada palabra con su segundo de inicio y fin (Whisper local)
  datos.json         fps, número de cuadros, tamaño y duración
  mascaras/%06d.png  silueta de la persona (solo con --mascaras; hace falta para que el texto pase POR DETRÁS de la persona)
"""
import sys, os, json, glob, shutil, subprocess

args = sys.argv[1:]
if not args or args[0].startswith('--'): sys.exit(__doc__)
proy = os.path.abspath(args[0]); RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(proy, 'proyecto.json')))
if not P.get('fuente'): sys.exit('✗ proyecto.json no tiene "fuente" (el video ya cortado)')
src = P['fuente'] if os.path.isabs(P['fuente']) else os.path.join(proy, P['fuente'])
if not os.path.exists(src): sys.exit(f'✗ no existe {src}')

def sonda(*campos):
    o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=' + ','.join(campos) + ':format=duration',
                        '-of', 'json', src], capture_output=True, text=True, check=True).stdout
    return json.loads(o)
s = sonda('width', 'height', 'r_frame_rate'); st = s['streams'][0]
num, den = st['r_frame_rate'].split('/'); fps = float(num) / float(den); dur = float(s['format']['duration'])
libre = shutil.disk_usage(proy).free / 1e9; hace_falta = dur / 60 * 0.55
if libre < hace_falta + 3: sys.exit(f'✗ poco espacio: los cuadros ocupan ≈ {hace_falta:.1f} GB y quedan {libre:.1f} GB libres')

cu = os.path.join(proy, 'cuadros')
shutil.rmtree(cu, ignore_errors=True); os.makedirs(cu)
print(f'1/4 cuadros ({dur:.0f} s a {fps:.2f} cuadros por segundo)…', flush=True)
vf = 'scale=1920:1080:force_original_aspect_ratio=decrease' if st['width'] > 1920 or st['height'] > 1080 else 'null'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-q:v', '3', os.path.join(cu, '%06d.jpg')], check=True)
n = len(glob.glob(os.path.join(cu, '*.jpg')))

print('2/4 voz…', flush=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '2', '-ar', '48000', os.path.join(proy, 'voz.wav')], check=True)
json.dump({'fps': fps, 'n': n, 'ancho': min(st['width'], 1920), 'alto': min(st['height'], 1080), 'dur': dur},
          open(os.path.join(proy, 'datos.json'), 'w'), indent=1)

if '--sin-transcribir' in args:
    print('3/4 (sin transcribir)')
else:
    print('3/4 palabras con tiempo (Whisper local)…', flush=True)
    import tempfile
    wav = os.path.join(tempfile.mkdtemp(), 'a.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
    prompt = args[args.index('--prompt') + 1] if '--prompt' in args else None
    try:
        import mlx_whisper
        r = mlx_whisper.transcribe(wav, path_or_hf_repo=os.environ.get('WHISPER_MODELO', 'mlx-community/whisper-large-v3-turbo'),
                                   language=os.environ.get('IDIOMA', 'es'), word_timestamps=True, condition_on_previous_text=False, initial_prompt=prompt)
        W = [{'t': w['word'].strip(), 'a': round(w['start'], 3), 'b': round(w['end'], 3), 'p': round(float(w.get('probability', 1)), 2)}
             for sg in r['segments'] for w in sg['words']]
    except ImportError:   # Windows / Mac Intel: faster-whisper
        from faster_whisper import WhisperModel
        m = WhisperModel(os.environ.get('WHISPER_MODELO', 'large-v3-turbo'), compute_type='int8')
        sg, _ = m.transcribe(wav, language=os.environ.get('IDIOMA', 'es'), word_timestamps=True, condition_on_previous_text=False, initial_prompt=prompt)
        W = [{'t': w.word.strip(), 'a': round(w.start, 3), 'b': round(w.end, 3), 'p': round(float(w.probability), 2)} for x in sg for w in x.words]
    json.dump(W, open(os.path.join(proy, 'palabras.json'), 'w'), ensure_ascii=False, indent=1)
    with open(os.path.join(proy, 'transcripcion.txt'), 'w') as f:   # renglones de ~10 palabras con su segundo: para escribir la escaleta
        for i in range(0, len(W), 10):
            f.write(f"{W[i]['a']:7.2f}  " + ' '.join(w['t'] for w in W[i:i + 10]) + '\n')
    print(f'    {len(W)} palabras → palabras.json y transcripcion.txt')

if '--mascaras' in args:
    seg = os.path.join(RAIZ, 'bin', 'segmentar')
    if not os.path.exists(seg): sys.exit('✗ falta bin/segmentar (solo Mac): corre ./instalar.sh')
    print('4/4 máscaras de la persona (Vision de macOS)…', flush=True)
    ma = os.path.join(proy, 'mascaras'); shutil.rmtree(ma, ignore_errors=True); os.makedirs(ma)
    p = subprocess.Popen([seg, src, '960', '540'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    # gris → PNG con transparencia (lo blanco de la silueta queda opaco): así el navegador la usa directo como máscara
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', '960x540', '-r', f'{num}/{den}', '-i', '-',
                    '-vf', 'format=gray,split[a][b];[a][b]alphamerge', os.path.join(ma, '%06d.png')], stdin=p.stdout, check=True)
    m = len(glob.glob(os.path.join(ma, '*.png')))
    for i in range(m + 1, n + 1):   # Vision a veces entrega 1–3 cuadros menos al final: se repite la última
        shutil.copy(os.path.join(ma, f'{m:06d}.png'), os.path.join(ma, f'{i:06d}.png'))
    print(f'    {m} máscaras')
else:
    print('4/4 (sin máscaras: agrega --mascaras si el estilo pone texto detrás de la persona)')
print(f'✓ {n} cuadros listos en {proy}')
