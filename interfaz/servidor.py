#!/usr/bin/env python3
"""Interfaz local de «Videos largos con IA».

Una página que corre SOLO en esta computadora (127.0.0.1): enseña el menú de plantillas, crea pedidos,
enseña el avance y recoge las aprobaciones. Quien edita los videos es Claude Code; aquí no se edita nada.

Uso:  ./abrir.sh                       (o doble clic en «Abrir plantillas.command»)
      python3 interfaz/servidor.py [--sin-navegador] [--puerto 8770] [--plantillas <carpeta>]

Solo usa la librería estándar de Python 3 (sirve /usr/bin/python3 y .venv/bin/python). Sin internet.
El contrato de archivos (pedido.json, estado.json, respuestas/NNN.json) está en CLAUDE.md › «Pedidos de la interfaz».
"""
import argparse, collections, datetime, glob, json, os, re, shutil, signal, socket, subprocess, sys, threading, time
import traceback, unicodedata, urllib.parse, urllib.request, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.realpath(os.path.dirname(AQUI))
PLANTILLAS = os.path.join(RAIZ, 'plantillas')      # --plantillas lo cambia (solo para pruebas)
PEDIDOS = os.path.join(RAIZ, 'pedidos')
ENTRADA = os.path.join(RAIZ, 'entrada')
PUERTO_BASE, PUERTOS = 8770, 20
APP = 'videos-largos-ia'

ID_PEDIDO = re.compile(r'^[0-9]{8}-[0-9]{4}-[a-z0-9]+(?:-[a-z0-9]+)*$')
ID_PLANTILLA = re.compile(r'^[a-z0-9][a-z0-9_-]{0,40}$')
EXT_VIDEO = ('.mp4', '.mov', '.m4v', '.mkv', '.avi', '.webm', '.mts', '.mpg', '.mpeg')
EXT_IMAGEN = ('.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif')
TIPOS = {'.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
         '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.heic': 'image/heic', '.mp4': 'video/mp4',
         '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm'}
PAGINA = {'/': ('pagina.html', 'text/html; charset=utf-8'), '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
          '/app.css': ('app.css', 'text/css; charset=utf-8')}
PASOS = ('cola', 'preparando', 'plan', 'escaleta', 'fotos', 'exportando', 'revisando', 'listo', 'no_aplica', 'error')
PARA = ('plan', 'escaleta', 'fotos')


class Aviso(Exception):
    """Error que se le enseña a la persona tal cual (en español claro)."""
    def __init__(self, texto, codigo=400):
        super().__init__(texto); self.texto, self.codigo = texto, codigo


# ───────────────────────── utilidades ─────────────────────────

def ahora(): return datetime.datetime.now().replace(microsecond=0).isoformat()


def slug(texto, largo=32):
    t = unicodedata.normalize('NFKD', str(texto)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')[:largo].strip('-')


def texto_limpio(v, largo):
    """Texto que escribió la persona: sin caracteres de control y con tope de largo."""
    if not isinstance(v, str): return ''
    v = v.replace('\r\n', '\n').replace('\r', '\n')
    return ''.join(c for c in v if c == '\n' or c == '\t' or ord(c) >= 32).strip()[:largo]


def leer_json(ruta):
    try:
        with open(ruta, encoding='utf-8') as f: d = json.load(f)
        return d if isinstance(d, dict) else None
    except (OSError, ValueError): return None


def escribir_json(ruta, datos):
    """Completo o nada: se escribe a un lado y se cambia de nombre."""
    tmp = f'{ruta}.{os.getpid()}.{threading.get_ident()}.tmp'
    with open(tmp, 'w', encoding='utf-8') as f: json.dump(datos, f, ensure_ascii=False, indent=1); f.write('\n')
    os.replace(tmp, ruta)


def dentro(ruta, base):
    base = os.path.realpath(base)
    return ruta == base or ruta.startswith(base + os.sep)


def rel_del_repo(valor):
    """Ruta que nombró Claude en estado.json → relativa al repo y con «/»; None si no es de fiar."""
    if not isinstance(valor, str) or not valor.strip() or '\x00' in valor or len(valor) > 600: return None
    v = valor.strip()
    if os.path.isabs(v):
        v = os.path.realpath(v)
        if not dentro(v, RAIZ): return None
        v = os.path.relpath(v, RAIZ)
    v = os.path.normpath(v).replace(os.sep, '/')
    if v.startswith('../') or v in ('..', '.'): return None
    return v


_nombrados = {'cuando': 0.0, 'rutas': frozenset()}


def nombrados_por_estados():
    """Los .md / .jpg / .png / .mp4 que algún pedidos/*/estado.json nombra (lo único extra que se deja leer)."""
    if time.time() - _nombrados['cuando'] < 2: return _nombrados['rutas']
    rutas = set()

    def junta(x):
        if isinstance(x, dict): [junta(v) for v in x.values()]
        elif isinstance(x, list): [junta(v) for v in x]
        elif isinstance(x, str) and x.lower().endswith(('.md', '.jpg', '.jpeg', '.png', '.mp4')):
            r = rel_del_repo(x)
            if r: rutas.add(r)
    try: ids = os.listdir(PEDIDOS)
    except OSError: ids = []
    for i in ids:
        if ID_PEDIDO.match(i): junta(estado_de(i)[0])
    _nombrados.update(cuando=time.time(), rutas=frozenset(rutas))
    return _nombrados['rutas']


def archivo_permitido(rel):
    """Ruta relativa al repo → ruta real en disco, solo si está en la lista de lo que se puede leer. Si no, None."""
    if not isinstance(rel, str) or not rel or '\x00' in rel or '\\' in rel or rel.startswith('/'): return None
    partes = rel.split('/')
    if any(p in ('', '.', '..') or p.startswith('.') for p in partes): return None
    if os.path.splitext(rel)[1].lower() not in TIPOS: return None
    base, real = RAIZ, None
    if partes[0] == 'plantillas' and len(partes) == 4 and partes[2] == 'muestra':
        base, real = PLANTILLAS, os.path.join(PLANTILLAS, *partes[1:])
    elif partes[0] == 'pedidos' and len(partes) >= 3 and ID_PEDIDO.match(partes[1]): pass
    elif partes[0] == 'proyectos' and len(partes) >= 4 and partes[2] in ('fotos', 'salida'): pass
    elif rel in nombrados_por_estados(): pass
    else: return None
    real = os.path.realpath(real or os.path.join(RAIZ, *partes))
    if not dentro(real, base) or not os.path.isfile(real): return None      # enlaces que salen del repo: no
    return real


def url_de(rel, version=None):
    return '/archivo/' + urllib.parse.quote(rel) + (f'?v={version}' if version else '')


def documento(rel, tipo):
    """Lo que la página necesita para enseñar un archivo que dejó Claude."""
    if not rel: return None
    real = archivo_permitido(rel)
    if not real: return {'tipo': tipo, 'existe': False, 'url': None, 'ruta': rel, 'version': ''}
    v = str(os.stat(real).st_mtime_ns)
    return {'tipo': tipo, 'existe': True, 'url': url_de(rel, v), 'ruta': rel, 'version': v}


# ───────────────────────── plantillas ─────────────────────────

def plantillas():
    L = []
    try: carpetas = sorted(os.listdir(PLANTILLAS))
    except OSError: carpetas = []
    for c in carpetas:
        if not ID_PLANTILLA.match(c) or c.startswith('_'): continue
        d = leer_json(os.path.join(PLANTILLAS, c, 'plantilla.json'))
        if not d or not d.get('nombre'): continue                       # todavía no está (o va a medio escribir)
        d['id'] = c
        m = os.path.join(PLANTILLAS, c, 'muestra')

        def u(nombre):
            f = os.path.join(m, nombre)
            return url_de(f'plantillas/{c}/muestra/{nombre}', os.stat(f).st_mtime_ns) if os.path.isfile(f) else None
        d['muestra_video'] = u('muestra.mp4')
        d['muestra_imagenes'] = [x for x in (u(f'{i}.jpg') for i in range(1, 7)) if x]
        L.append(d)
    return sorted(L, key=lambda d: (d.get('numero') if isinstance(d.get('numero'), (int, float)) else 99, d['id']))


# ───────────────────────── pedidos ─────────────────────────

_estados = {}


def estado_de(pid):
    """estado.json del pedido (lo escribe Claude). Si lo agarramos a medio escribir, se queda el último bueno."""
    f = os.path.join(PEDIDOS, pid, 'estado.json')
    try: st = os.stat(f)
    except OSError: return None, 0.0
    c = _estados.get(pid)
    if c and c[0] == st.st_mtime_ns: return c[1], st.st_mtime
    d = leer_json(f)
    if d is None: return (c[1] if c else None), st.st_mtime
    _estados[pid] = (st.st_mtime_ns, d)
    return d, st.st_mtime


def respuestas_de(pid):
    carpeta, L = os.path.join(PEDIDOS, pid, 'respuestas'), []
    try: nombres = sorted(os.listdir(carpeta))
    except OSError: nombres = []
    for n in nombres:
        if not re.match(r'^[0-9]{3,}\.json$', n): continue
        d = leer_json(os.path.join(carpeta, n))
        if d: L.append({'n': int(n[:-5]), 'para': d.get('para'), 'plantilla': d.get('plantilla'), 'decision': d.get('decision'),
                        'texto': d.get('texto') or '', 'fecha': d.get('fecha') or '', '_mtime': os.stat(os.path.join(carpeta, n)).st_mtime})
    return L


def avance_de(v):
    try: v = float(v)
    except (TypeError, ValueError): return 0
    if 0 < v <= 1: v *= 100                     # CLAUDE.md no dice la escala: se aceptan 0–1 y 0–100
    return int(max(0, min(100, round(v))))


def paso_de(v): return v if v in PASOS else 'preparando'


def hoja_de(valor, proyecto):
    """trabajo.fotos puede traer la hoja (.jpg) o la carpeta de fotos; si no trae nada, la hoja del proyecto."""
    r = rel_del_repo(valor)
    if r and r.lower().endswith(('.jpg', '.jpeg', '.png')): return r
    if r: return r.rstrip('/') + '/hoja.jpg'
    p = rel_del_repo(proyecto)
    return f'{p}/fotos/hoja.jpg' if p else None


def primero(*valores):
    for v in valores:
        r = rel_del_repo(v)
        if r: return r
    return None


def detalle(pid):
    carpeta = os.path.join(PEDIDOS, pid)
    pedido = leer_json(os.path.join(carpeta, 'pedido.json'))
    if not pedido: return None
    tipo = 'plantilla' if pedido.get('tipo') == 'plantilla' else 'video'
    estado, mtime = estado_de(pid)
    resp = respuestas_de(pid)
    P = {p['id']: p for p in plantillas()}

    def nombre_de(i): return (P.get(i) or {}).get('nombre') or (pedido.get('nombre') if tipo == 'plantilla' else None) or str(i or '')

    def miniatura_de(i): return ((P.get(i) or {}).get('muestra_imagenes') or [None])[0]

    def respondido(para, plantilla):
        """La respuesta más nueva para ese punto, si es más nueva que el estado (Claude todavía no la procesa)."""
        for r in reversed(resp):
            if r['para'] == para and (para == 'plan' or r['plantilla'] == plantilla):
                return {'decision': r['decision'], 'texto': r['texto']} if r['_mtime'] >= mtime else None
        return None

    vista = {'paso': None, 'mensaje': '', 'plan': None, 'corte_video': None, 'trabajos': []}
    pendientes = []
    if estado:
        paso, espera = paso_de(estado.get('paso')), bool(estado.get('espera_respuesta'))
        corte = estado.get('corte') if isinstance(estado.get('corte'), dict) else {}
        crudos = [t for t in (estado.get('trabajos') or []) if isinstance(t, dict)] if isinstance(estado.get('trabajos'), list) else []
        if tipo == 'plantilla' and not crudos:        # un pedido de plantilla es un solo trabajo: el estado mismo
            crudos = [{'plantilla': estado.get('plantilla') or pedido.get('id_sugerido'), 'paso': 'cola' if paso == 'plan' else paso,
                       'mensaje': '', 'fotos': estado.get('fotos'), 'video': estado.get('video'), 'avance': estado.get('avance'),
                       'proyecto': estado.get('proyecto')}]
        plan_rel = primero(corte.get('plan'), estado.get('ficha'), estado.get('plan'), *[t.get('ficha') for t in crudos])
        vista.update(paso=paso, mensaje=texto_limpio(estado.get('mensaje'), 2000), actualizado=estado.get('actualizado') or '')
        vista['corte_video'] = documento(primero(corte.get('video')), 'video')
        # qué está esperando el «sí» de la persona
        if espera and paso == 'plan': pendientes.append(('plan', None))
        else:
            for t in crudos:
                tp = paso_de(t.get('paso'))
                if tp in ('escaleta', 'fotos') and (t.get('espera_respuesta') or (espera and paso == tp)): pendientes.append((tp, t.get('plantilla')))
            if espera and not pendientes:        # el paso general no cuadra con los trabajos: espera lo primero que tenga algo que aprobar
                c = [t for t in crudos if paso_de(t.get('paso')) in ('escaleta', 'fotos')]
                pendientes.append((paso_de(c[0].get('paso')), c[0].get('plantilla')) if c else ('plan', None))
        pen = ('plan', None) in pendientes
        if plan_rel or pen:
            base = documento(plan_rel, 'md') or {'tipo': 'md', 'existe': False, 'url': None, 'ruta': None, 'version': ''}
            vista['plan'] = dict(base, para='plan', plantilla=pedido.get('id_sugerido') if tipo == 'plantilla' else None, pendiente=pen,
                                 respondido=respondido('plan', None) if pen else None)
        for t in crudos:
            i, tp = t.get('plantilla'), paso_de(t.get('paso'))
            efectivo = paso if (tp in ('cola', 'preparando') and paso in ('preparando', 'plan')) else tp
            doc = None
            if tp == 'escaleta':
                e = primero(t.get('escaleta')) or (f"{rel_del_repo(t.get('proyecto'))}/ESCALETA.md" if rel_del_repo(t.get('proyecto')) else None)
                doc = documento(e, 'md')
            elif tp == 'fotos': doc = documento(hoja_de(t.get('fotos'), t.get('proyecto')), 'img')
            if doc:
                pen = (tp, i) in pendientes
                doc.update(para=tp, plantilla=i, pendiente=pen, respondido=respondido(tp, i) if pen else None)
            v = documento(primero(t.get('video')), 'video') if tp == 'listo' else None
            if v and v.get('ruta'): v['en_salida'] = bool(re.match(r'^proyectos/[^/]+/salida/', v['ruta']))
            vista['trabajos'].append({'plantilla': i, 'nombre': nombre_de(i), 'miniatura': miniatura_de(i), 'paso': tp, 'paso_linea': efectivo,
                                      'mensaje': texto_limpio(t.get('mensaje'), 2000), 'avance': avance_de(t.get('avance')),
                                      'documento': doc, 'video': v})
    cl = LANZADOR.info(pid, mtime)
    sin_responder = [p for p in pendientes if not respondido(*p)]
    T = vista['trabajos']
    # listo de verdad: todas las plantillas terminaron (si el estado no trae trabajos, manda el paso general)
    listo = bool(estado) and (all(t['paso'] in ('listo', 'no_aplica') for t in T) and any(t['paso'] == 'listo' for t in T) if T else vista['paso'] == 'listo')
    que = {'plan': 'la ficha' if tipo == 'plantilla' else 'el plan', 'escaleta': 'la escaleta', 'fotos': 'las fotos'}
    if cl['situacion'] == 'corriendo': res = ('trabajando', 'Claude está trabajando')
    elif cl['situacion'] == 'en_cola': res = ('en_cola', 'En cola')
    elif estado and (vista['paso'] == 'error' or any(t['paso'] == 'error' for t in T)): res = ('error', 'Necesita tu ayuda')
    elif listo: res = ('listo', 'Listo')
    elif sin_responder: res = ('te_toca', 'Te toca revisar ' + que[sin_responder[0][0]])
    elif cl['situacion'] == 'detenido': res = ('detenido', 'Se detuvo')
    elif not estado: res = ('sin_empezar', 'Falta empezarlo')
    else: res = ('en_curso', 'En proceso')
    video = pedido.get('video') if isinstance(pedido.get('video'), str) else ''
    titulo = (f"Plantilla nueva: {pedido.get('nombre') or ''}" if tipo == 'plantilla' else texto_limpio(pedido.get('titulo'), 120) or os.path.basename(video) or pid)
    ids = [i for i in (pedido.get('plantillas') or []) if isinstance(i, str)] if tipo == 'video' else []
    return {'id': pid, 'tipo': tipo, 'titulo': titulo, 'creado': pedido.get('creado') or '', 'notas': texto_limpio(pedido.get('notas'), 4000),
            'plantillas': [{'id': i, 'nombre': nombre_de(i), 'miniatura': miniatura_de(i)} for i in ids],
            'fuente': pedido.get('fuente'), 'archivos': pedido.get('archivos') or [], 'brief': documento(rel_del_repo(pedido.get('brief')), 'md'),
            'empezado': bool(estado), 'listo': listo, 'resumen': {'clave': res[0], 'texto': res[1]}, 'vista': vista, 'claude': cl,
            'frase': f"{'Sigue con' if estado else 'Haz'} el pedido {pid}",
            'respuestas': [{k: v for k, v in r.items() if not k.startswith('_')} for r in resp]}


def lista_pedidos():
    try: ids = [i for i in os.listdir(PEDIDOS) if ID_PEDIDO.match(i)]
    except OSError: ids = []
    L = []
    for i in ids:
        d = detalle(i)
        if d: L.append({k: d[k] for k in ('id', 'tipo', 'titulo', 'creado', 'plantillas', 'resumen', 'listo')})
    return sorted(L, key=lambda p: (str(p['creado']), p['id']), reverse=True)      # del más nuevo al más viejo


def ruta_en_entrada(valor, extensiones):
    """«entrada/archivo.ext» que exista de verdad; si no, None."""
    if not isinstance(valor, str): return None
    m = re.match(r'^entrada/([A-Za-z0-9][A-Za-z0-9._-]{0,180})$', valor)
    if not m or not m.group(1).lower().endswith(extensiones): return None
    real = os.path.realpath(os.path.join(ENTRADA, m.group(1)))
    return valor if dentro(real, ENTRADA) and os.path.isfile(real) else None


RITMOS = {'tranquilo': 'Tranquilo: pocas animaciones y con aire entre una y otra.', 'medio': 'Medio: algo pasa cada pocos segundos, sin correr.',
          'rapido': 'Rápido: animaciones seguidas, casi sin pausas.'}
PERSONAS = {'completa': 'A pantalla completa, con los textos y gráficos encima o a los lados.', 'ventana': 'En una ventana, con los gráficos ocupando el resto.',
            'mitad': 'En la mitad de la pantalla; la otra mitad es para textos y gráficos.', 'combinado': 'Combinado: a ratos a pantalla completa y a ratos en ventana o mitad.',
            'sin_persona': 'No sale la persona: solo voz con gráficos.'}
FALTA = '_No lo indicó: propónlo tú y enséñaselo antes de dar la plantilla por buena._'


def redactar_brief(nombre, b, archivos):
    """El formulario «Lo describo yo» → brief.md ordenado. Devuelve None si la persona no llenó nada."""
    if not isinstance(b, dict): return None
    t = lambda k, n=1500: texto_limpio(b.get(k), n)
    colores = [c.lower() for c in (b.get('colores') or []) if isinstance(c, str) and re.match(r'^#[0-9a-fA-F]{6}$', c)][:5] if isinstance(b.get('colores'), list) else []
    partes = [texto_limpio(x, 200) for x in (b.get('partes') or []) if isinstance(x, str)][:30] if isinstance(b.get('partes'), list) else []
    partes = [p for p in partes if p]
    ritmo, persona, subs = RITMOS.get(b.get('ritmo')), PERSONAS.get(b.get('persona')), b.get('subtitulos') if b.get('subtitulos') in ('si', 'no') else None
    if not any([t('para_que'), colores, t('tipografia'), t('fondo'), ritmo, t('animaciones'), persona, subs, t('subtitulos_como'), partes, t('no_quiero')]): return None
    o = lambda v: v or FALTA
    L = [f'# Brief de la plantilla «{nombre}»', '',
         f'_Lo escribió la persona en el formulario de la interfaz ({ahora()[:10]}). De aquí sale la ficha de la plantilla (ESTILO.md)._', '',
         '## Para qué tipo de video es', '', o(t('para_que')), '',
         '## Cómo se ve', '',
         '- **Colores** (en este orden; el primero es el principal): ' + (', '.join(f'`{c}`' for c in colores) if colores else FALTA),
         '- **Tipografía:** ' + o(t('tipografia', 300)), '- **Fondo:** ' + o(t('fondo', 600)), '',
         '## Cómo se mueve', '', '- **Ritmo:** ' + o(ritmo), '- **Tipo de animaciones:** ' + o(t('animaciones')), '',
         '## Cómo se ve la persona', '', o(persona), '',
         '## Subtítulos', '', ({'si': 'Sí lleva subtítulos.', 'no': 'No lleva subtítulos.'}.get(subs) or FALTA) + (f" Cómo: {t('subtitulos_como', 600)}" if subs != 'no' and t('subtitulos_como', 600) else ''), '',
         '## Partes del video, en orden', '', *([f'{n}. {p}' for n, p in enumerate(partes, 1)] or [FALTA]), '',
         '## Qué NO quiere', '', o(t('no_quiero')), '']
    if archivos: L += ['## Referencias que acompañan a este brief', '', *[f'- `{a}`' for a in archivos], '']
    L += ['## Recordatorio', '', 'Se copia el formato (ritmo, composición, tipo de animación), nunca las imágenes, el logo, la música ni los textos del original.', '']
    return '\n'.join(L)


_crear = threading.Lock()


def crear_pedido(d):
    if not isinstance(d, dict): raise Aviso('No llegaron los datos del pedido. Vuelve a intentarlo.')
    notas = texto_limpio(d.get('notas'), 4000)
    if d.get('tipo') == 'video':
        video = ruta_en_entrada(d.get('video'), EXT_VIDEO)
        if not video: raise Aviso('Falta el video. Suéltalo en el recuadro y espera a que termine de copiarse.')
        existen = {p['id'] for p in plantillas()}
        ids = []
        for i in (d.get('plantillas') if isinstance(d.get('plantillas'), list) else []):
            if isinstance(i, str) and i in existen and i not in ids: ids.append(i)
        if not ids: raise Aviso('Marca al menos una plantilla.')
        corto = slug(os.path.splitext(os.path.basename(video))[0]) or 'video'
        titulo = texto_limpio(d.get('titulo'), 120).replace('\n', ' ')        # el nombre que tenía el archivo antes de copiarlo
        pedido = {'tipo': 'video', 'titulo': titulo or os.path.basename(video), 'video': video, 'plantillas': ids, 'notas': notas}
        brief = None
    elif d.get('tipo') == 'plantilla':
        nombre = texto_limpio(d.get('nombre'), 80).replace('\n', ' ')
        if not nombre: raise Aviso('Ponle un nombre a tu plantilla.')
        archivos = []
        for a in (d.get('archivos') if isinstance(d.get('archivos'), list) else []):
            r = ruta_en_entrada(a, EXT_VIDEO + EXT_IMAGEN)
            if r and r not in archivos: archivos.append(r)
        videos = [a for a in archivos if a.lower().endswith(EXT_VIDEO)]
        imagenes = [a for a in archivos if a.lower().endswith(EXT_IMAGEN)]
        if len(videos) > 1: raise Aviso('Sube un solo video de referencia.')
        if len(imagenes) > 8: raise Aviso('Sube 8 imágenes como máximo.')
        brief = redactar_brief(nombre, d.get('brief'), archivos)
        if not archivos and not brief: raise Aviso('Sube un video, una imagen o describe cómo quieres tu plantilla.')
        corto = slug('plantilla-' + nombre) or 'plantilla'
        pedido = {'tipo': 'plantilla', 'nombre': nombre, 'id_sugerido': slug(nombre, 24) or 'nueva',
                  'fuente': 'video' if videos else ('imagenes' if imagenes else 'brief'), 'archivos': archivos, 'brief': None, 'notas': notas}
    else:
        raise Aviso('No entendí qué tipo de pedido es.')
    with _crear:
        base = time.strftime('%Y%m%d-%H%M-') + corto
        pid, n = base, 1
        while os.path.exists(os.path.join(PEDIDOS, pid)): n += 1; pid = f'{base}-{n}'
        if not ID_PEDIDO.match(pid): raise Aviso('No se pudo armar el nombre del pedido. Cambia el nombre del archivo y vuelve a intentarlo.')
        os.makedirs(os.path.join(PEDIDOS, pid, 'respuestas'))
    if brief:
        with open(os.path.join(PEDIDOS, pid, 'brief.md'), 'w', encoding='utf-8') as f: f.write(brief)
        pedido['brief'] = f'pedidos/{pid}/brief.md'
    escribir_json(os.path.join(PEDIDOS, pid, 'pedido.json'), dict({'id': pid, 'creado': ahora()}, **pedido))
    return pid


def responder(pid, d):
    """Escribe respuestas/NNN.json con el formato del contrato. Solo si ese punto de verdad espera respuesta."""
    if not isinstance(d, dict): raise Aviso('No llegó tu respuesta. Vuelve a intentarlo.')
    para, decision, plantilla = d.get('para'), d.get('decision'), d.get('plantilla')
    if para not in PARA or decision not in ('aprobado', 'cambios'): raise Aviso('No entendí la respuesta. Recarga la página y vuelve a intentarlo.')
    if plantilla is not None and not (isinstance(plantilla, str) and ID_PLANTILLA.match(plantilla)): raise Aviso('No entendí de qué plantilla es la respuesta.')
    texto = texto_limpio(d.get('texto'), 6000)
    if decision == 'cambios' and not texto: raise Aviso('Escribe qué quieres que cambie.')
    det = detalle(pid)
    puntos = [x for x in [det['vista']['plan']] + [t['documento'] for t in det['vista']['trabajos']] if x and x.get('pendiente')]
    punto = next((x for x in puntos if x['para'] == para and (para == 'plan' or x['plantilla'] == plantilla)), None)
    if not punto: raise Aviso('Ese paso ya no está esperando tu respuesta. Recarga la página.', 409)
    if punto.get('respondido'): raise Aviso('Ya habías respondido este paso.', 409)
    carpeta = os.path.join(PEDIDOS, pid, 'respuestas')
    os.makedirs(carpeta, exist_ok=True)
    datos = {'para': para, 'plantilla': None if para == 'plan' and det['tipo'] == 'video' else plantilla, 'decision': decision, 'texto': texto, 'fecha': ahora()}
    n = max([int(x[:-5]) for x in os.listdir(carpeta) if re.match(r'^[0-9]{3,}\.json$', x)] or [0])
    while True:
        n += 1
        try: fd = os.open(os.path.join(carpeta, f'{n:03d}.json'), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
        except FileExistsError: continue
        with os.fdopen(fd, 'w', encoding='utf-8') as f: json.dump(datos, f, ensure_ascii=False, indent=1); f.write('\n')
        break
    return n


# ───────────────────────── subir archivos ─────────────────────────

_subir = threading.Lock()
SUBIDOS = set()        # lo que llegó en esta sesión (lo único que «descartar» puede borrar)


def nombre_seguro(nombre):
    """Nombre de archivo con lista blanca de caracteres (sin acentos ni espacios), conservando la extensión."""
    n = os.path.basename(str(nombre).replace('\\', '/'))
    n = unicodedata.normalize('NFKD', n).encode('ascii', 'ignore').decode()
    base, ext = os.path.splitext(n)
    base = re.sub(r'[^A-Za-z0-9_-]+', '-', base).strip('-_')[:80] or 'archivo'
    return base, re.sub(r'[^a-z0-9.]', '', ext.lower())[:8]


# ───────────────────────── sistema ─────────────────────────

class Sistema:
    """Qué hay en esta computadora: el programa «claude», espacio libre y si la instalación está completa."""
    def __init__(self):
        self.claude, self.claude_ok, self.claude_aviso = None, False, 'Revisando si Claude Code está instalado…'
        self.instalacion = {'completa': None, 'faltan': []}
        self._cuando = time.time()

    def buscar_claude(self):
        casa = os.path.expanduser('~')
        for c in [shutil.which('claude'), '/opt/homebrew/bin/claude', '/usr/local/bin/claude', f'{casa}/.local/bin/claude', f'{casa}/.claude/local/claude']:
            if c and os.path.isfile(c) and os.access(c, os.X_OK): return c
        return None

    def revisar(self):
        self._cuando = time.time()
        c = self.buscar_claude()
        if not c: self.claude, self.claude_ok, self.claude_aviso = None, False, 'No encontré Claude Code en esta computadora (está en INSTALAR.md).'
        else:
            try:
                r = subprocess.run([c, '--version'], capture_output=True, text=True, timeout=30, stdin=subprocess.DEVNULL, env=entorno_limpio())
                ok = r.returncode == 0
            except (OSError, subprocess.SubprocessError): ok = False
            self.claude, self.claude_ok = c, ok
            self.claude_aviso = '' if ok else 'Claude Code está instalado pero no arrancó. Ábrelo una vez en la terminal para revisarlo.'
        try:
            r = subprocess.run(['/bin/zsh', os.path.join(RAIZ, 'scripts', 'requisitos.sh')], capture_output=True, text=True, timeout=120, cwd=RAIZ, stdin=subprocess.DEVNULL)
            lineas = [re.sub(r'\x1b\[[0-9;]*m', '', x).strip() for x in r.stdout.splitlines()]
            self.instalacion = {'completa': r.returncode == 0, 'faltan': [x.lstrip('✗ ').strip() for x in lineas if x.startswith('✗')][:12]}
        except (OSError, subprocess.SubprocessError):
            self.instalacion = {'completa': None, 'faltan': []}

    def datos(self):
        if time.time() - self._cuando > 1800:
            self._cuando = time.time(); threading.Thread(target=self.revisar, daemon=True).start()
        try: libre = shutil.disk_usage(RAIZ).free
        except OSError: libre = 0
        return {'claude': self.claude_ok, 'claude_aviso': self.claude_aviso, 'libre_gb': round(libre / 1e9, 1), 'libre_bytes': libre,
                'poco_espacio': libre < 10e9, 'instalacion_completa': self.instalacion['completa'], 'faltan': self.instalacion['faltan'],
                'trabajando_en': LANZADOR.actual, 'en_cola': list(LANZADOR.cola), 'carpeta': RAIZ}


# Variables que deja una sesión de Claude Code abierta; si el servidor se arrancó desde una, no deben heredarse
# al Claude que lanza la interfaz (cada lanzamiento es una sesión aparte). Las de configuración o acceso NO se tocan.
DE_SESION = ('CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_MESSAGING_SOCKET',
             'CLAUDE_CODE_MESSAGING_TOKEN', 'CLAUDE_CODE_SESSION_ATTENDED', 'CLAUDE_PID', 'CLAUDE_AGENT_SDK_VERSION', 'CLAUDE_CODE_EXECPATH',
             'CLAUDE_EFFORT', 'CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING', 'CLAUDE_CODE_EMIT_STARTUP_TIMING',
             'CLAUDE_CODE_STARTUP_FAILURE_RESULTS', 'CLAUDE_CODE_QUESTION_PREVIEW_FORMAT', 'CLAUDE_CODE_ENABLE_TASKS')


def entorno_limpio():
    e = {k: v for k, v in os.environ.items() if k not in DE_SESION}
    rutas = e.get('PATH', '').split(os.pathsep)
    for extra in ('/opt/homebrew/bin', '/usr/local/bin'):          # ffmpeg, node… aunque se abra con doble clic
        if extra not in rutas: rutas.append(extra)
    e['PATH'] = os.pathsep.join(r for r in rutas if r)
    return e


# ───────────────────────── modo automático ─────────────────────────
#
# Cómo se lanza Claude Code (comprobado con `claude --help`, versión 2.1.x):
#
#   claude -p "<instrucción fija>"            sin ventana ni preguntas: hace el trabajo y termina
#     --output-format json                    al terminar imprime un JSON con session_id, result e is_error
#     --session-id <uuid>                     primer lanzamiento: el id de sesión lo ponemos nosotros (así se conoce
#                                             aunque el proceso se detenga antes de imprimir el JSON)
#     --resume <uuid>                         siguientes lanzamientos: continúa LA MISMA conversación del pedido
#     --permission-mode acceptEdits           puede crear y editar archivos dentro de esta carpeta sin preguntar
#     --allowedTools "Bash,Read,Glob,Grep"    puede leer, buscar y ejecutar comandos (ffmpeg, node, python…) sin preguntar
#     --disallowedTools "Bash(sudo:*),Bash(git push:*)"   nunca como administrador y nunca sube nada con git
#     --permission-prompts none               lo que no esté permitido arriba se NIEGA solo (nadie puede contestar)
#     --strict-mcp-config                     sin conectores externos (correo, Drive, etc.) en este modo
#
# Por qué así y no con --dangerously-skip-permissions: ese modo lo permite TODO (editar fuera de la carpeta, conectores,
# internet). Editar video exige ejecutar comandos variados, por eso Bash va permitido completo; lo demás queda limitado
# a lo que el trabajo necesita y lo que se salga de eso se niega en vez de quedarse esperando una respuesta.
# La instrucción es FIJA: lo único que cambia es el id del pedido, validado con lista blanca. Las notas de la persona
# viven en pedido.json; nunca entran al comando.

PERMISOS = ['--permission-mode', 'acceptEdits', '--allowedTools', 'Bash,Read,Glob,Grep',
            '--disallowedTools', 'Bash(sudo:*),Bash(git push:*)', '--permission-prompts', 'none', '--strict-mcp-config']
ARGS_EXTRA = []        # solo para pruebas (p. ej. un modelo barato)


def instruccion(pid, continuar):
    if continuar:
        return (f'Sigue con el pedido {pid} siguiendo CLAUDE.md › «Pedidos de la interfaz»: lee la respuesta más nueva en pedidos/{pid}/respuestas/ '
                'y continúa hasta el siguiente punto de aprobación (o hasta terminar). Te lanzó la interfaz en modo automático: nadie puede '
                f'contestarte por chat; lo que necesites de la persona va en el «mensaje» de pedidos/{pid}/estado.json. Escribe estado.json y detente.')
    return (f'Haz el pedido {pid} siguiendo CLAUDE.md › «Pedidos de la interfaz». Te lanzó la interfaz en modo automático: nadie puede '
            f'contestarte por chat; lo que necesites de la persona va en el «mensaje» de pedidos/{pid}/estado.json. '
            'Trabaja hasta el siguiente punto de aprobación, escribe estado.json y detente.')


def sesion_guardada(sesion):
    """¿Claude Code alcanzó a guardar esa conversación? (pasa aunque se detenga antes de imprimir su JSON)"""
    if not isinstance(sesion, str) or not re.match(r'^[0-9a-fA-F-]{36}$', sesion): return False
    base = os.environ.get('CLAUDE_CONFIG_DIR') or os.path.join(os.path.expanduser('~'), '.claude')
    return bool(glob.glob(os.path.join(glob.escape(base), 'projects', '*', sesion + '.jsonl')))


class Lanzador:
    """Corre Claude Code para los pedidos en automático: UNO a la vez en toda la interfaz (cola en memoria + archivo de candado)."""
    CANDADO = os.path.join(PEDIDOS, '.claude-candado.json')

    def __init__(self):
        self.cola = collections.deque()
        self.actual, self.proc, self.parar = None, None, set()
        self.cv = threading.Condition()
        self.hilo = None

    # — lo que pregunta la página —
    def situacion(self, pid):
        with self.cv:
            if self.actual == pid: return ('corriendo' if self.proc else 'en_cola'), 0
            if pid in self.cola: return 'en_cola', list(self.cola).index(pid) + 1
        return None, 0

    def info(self, pid, mtime_estado=0.0):
        g = leer_json(os.path.join(PEDIDOS, pid, 'claude.json')) or {}
        sit, pos = self.situacion(pid)
        motivo = ''
        if not sit:
            sit = 'libre'
            if g.get('situacion') == 'corriendo': sit, motivo = 'detenido', 'La interfaz se cerró mientras Claude trabajaba.'
            elif g.get('situacion') == 'detenido' and mtime_estado <= float(g.get('fin_ts') or 0) + 1: sit, motivo = 'detenido', g.get('motivo') or ''
        otro = self.actual if self.actual and self.actual != pid else None
        return {'disponible': SISTEMA.claude_ok, 'aviso': SISTEMA.claude_aviso, 'modo': g.get('modo'), 'situacion': sit, 'posicion': pos,
                'motivo': motivo, 'ocupado_con': otro}

    # — lo que pide la página —
    def encolar(self, pid):
        if not SISTEMA.claude_ok: raise Aviso(SISTEMA.claude_aviso or 'Claude Code no está disponible. Usa el camino a mano.', 409)
        with self.cv:
            if self.actual != pid and pid not in self.cola:
                self.cola.append(pid)
                g = leer_json(os.path.join(PEDIDOS, pid, 'claude.json')) or {}
                g['modo'] = 'auto'
                if g.get('situacion') == 'detenido': g['situacion'] = 'libre'
                escribir_json(os.path.join(PEDIDOS, pid, 'claude.json'), g)
            if not self.hilo or not self.hilo.is_alive():
                self.hilo = threading.Thread(target=self.ciclo, daemon=True); self.hilo.start()
            self.cv.notify_all()

    def detener(self, pid):
        with self.cv:
            if pid in self.cola: self.cola.remove(pid); return
            if self.actual != pid: return
            self.parar.add(pid); proc = self.proc
        if proc: self.matar(proc)

    def matar(self, proc):
        try: os.killpg(proc.pid, signal.SIGTERM)
        except OSError: return
        def remate():
            try: proc.wait(8)
            except subprocess.TimeoutExpired:
                try: os.killpg(proc.pid, signal.SIGKILL)
                except OSError: pass
        threading.Thread(target=remate, daemon=True).start()

    def apagar(self):
        with self.cv: self.cola.clear(); proc, pid = self.proc, self.actual
        if pid: self.parar.add(pid)
        if proc:
            try: os.killpg(proc.pid, signal.SIGTERM)
            except OSError: pass
        self.soltar()

    # — el candado: un solo Claude aunque haya dos ventanas de la interfaz abiertas —
    def tomar(self, pid):
        while pid not in self.parar:
            try:
                fd = os.open(self.CANDADO, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
                with os.fdopen(fd, 'w') as f: json.dump({'servidor': os.getpid(), 'pedido': pid, 'desde': ahora()}, f)
                return True
            except FileExistsError:
                otro = (leer_json(self.CANDADO) or {}).get('servidor')
                vivo = False
                if isinstance(otro, int) and otro != os.getpid():
                    try: os.kill(otro, 0); vivo = True
                    except OSError: vivo = False
                if not vivo:
                    try: os.remove(self.CANDADO)
                    except OSError: pass
                    continue
                time.sleep(3)
            except OSError: return True          # sin carpeta de pedidos no hay con quién chocar
        return False

    def soltar(self):
        if (leer_json(self.CANDADO) or {}).get('servidor') == os.getpid():
            try: os.remove(self.CANDADO)
            except OSError: pass

    # — el trabajo —
    def ciclo(self):
        while True:
            with self.cv:
                while not self.cola: self.cv.wait()
                pid = self.cola.popleft(); self.actual = pid; self.parar.discard(pid)
            try:
                if os.path.isfile(os.path.join(PEDIDOS, pid, 'pedido.json')): self.correr(pid)
            except Exception: traceback.print_exc()
            finally:
                self.soltar()
                with self.cv: self.actual, self.proc = None, None; self.parar.discard(pid)

    def correr(self, pid):
        carpeta = os.path.join(PEDIDOS, pid)
        f_json, f_log, f_estado = os.path.join(carpeta, 'claude.json'), os.path.join(carpeta, 'claude.log'), os.path.join(carpeta, 'estado.json')
        g = leer_json(f_json) or {}

        def firma():
            try: st = os.stat(f_estado); return (st.st_mtime_ns, st.st_size)
            except OSError: return None

        def cierra(situacion, motivo=''):
            g.update(modo='auto', situacion=situacion, motivo=motivo, fin=ahora(), fin_ts=time.time()); escribir_json(f_json, g)

        if not self.tomar(pid): return cierra('detenido', 'Lo detuviste antes de que empezara.')
        antes, intento = firma(), 0
        while True:
            intento += 1
            continuar = bool(g.get('sesion') and g.get('sesion_confirmada'))
            sesion = g['sesion'] if continuar else str(uuid.uuid4())
            orden = [SISTEMA.claude, '-p', instruccion(pid, continuar or antes is not None), '--output-format', 'json', *PERMISOS,
                     *(['--resume', sesion] if continuar else ['--session-id', sesion]), *ARGS_EXTRA]
            g.update(modo='auto', sesion=sesion, sesion_confirmada=continuar, situacion='corriendo', motivo='', inicio=ahora(),
                     lanzamientos=int(g.get('lanzamientos') or 0) + 1)
            escribir_json(f_json, g)
            with open(f_log, 'a', encoding='utf-8') as log:
                log.write(f"\n===== {ahora()} · lanzamiento {g['lanzamientos']} · {'continúa la sesión' if continuar else 'sesión nueva'} {sesion} =====\n")
                log.write('$ ' + ' '.join(json.dumps(x, ensure_ascii=False) if re.search(r'[^\w./:=-]', x) else x for x in orden) + '\n')
            try:
                proc = subprocess.Popen(orden, cwd=RAIZ, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                        start_new_session=True, env=entorno_limpio())
            except OSError as e:
                with open(f_log, 'a', encoding='utf-8') as log: log.write(f'No arrancó: {e}\n')
                SISTEMA.claude_ok, SISTEMA.claude_aviso = False, 'Claude Code no arrancó desde la interfaz. Usa el camino a mano.'
                return cierra('detenido', 'No se pudo arrancar Claude Code. Usa el camino a mano.')
            with self.cv: self.proc = proc
            if pid in self.parar: self.matar(proc)
            salida = proc.communicate()[0].decode('utf-8', 'replace')
            with self.cv: self.proc = None
            with open(f_log, 'a', encoding='utf-8') as log: log.write(salida + f'\n===== terminó con código {proc.returncode} · {ahora()} =====\n')
            r = None
            for linea in reversed(salida.strip().splitlines()):
                try: x = json.loads(linea)
                except ValueError: continue
                if isinstance(x, dict) and ('session_id' in x or 'result' in x): r = x; break
            if r and isinstance(r.get('session_id'), str) and re.match(r'^[0-9a-fA-F-]{36}$', r['session_id']):
                g.update(sesion=r['session_id'], sesion_confirmada=True)
            elif not g.get('sesion_confirmada') and sesion_guardada(sesion): g['sesion_confirmada'] = True
            if pid in self.parar: return cierra('detenido', 'Lo detuviste tú.')
            if continuar and proc.returncode != 0 and not r and intento == 1 and 'No conversation found' in salida:
                g.update(sesion=None, sesion_confirmada=False); continue      # la conversación ya no existe: se empieza otra
            break
        estado = leer_json(f_estado)
        cambio = firma() != antes
        fallo = proc.returncode != 0 or not r or bool(r.get('is_error'))
        if fallo:
            dicho = texto_limpio(str((r or {}).get('result') or ''), 300)
            return cierra('detenido', ('Claude se detuvo con un aviso: ' + dicho) if dicho else 'Claude se cerró antes de terminar.')
        if not estado or not cambio:
            return cierra('detenido', 'Claude terminó sin avisar en qué quedó.')
        T = [t for t in (estado.get('trabajos') or []) if isinstance(t, dict)] if isinstance(estado.get('trabajos'), list) else []
        listo = estado.get('paso') == 'listo' or (T and all(t.get('paso') in ('listo', 'no_aplica') for t in T))
        if not (estado.get('espera_respuesta') or listo or estado.get('paso') == 'error'):
            return cierra('detenido', 'Claude terminó sin dejar listo el siguiente paso.')
        cierra('libre')


LANZADOR = Lanzador()
SISTEMA = Sistema()


# ───────────────────────── servidor web ─────────────────────────

class Peticion(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server_version = 'Interfaz'
    timeout = 600

    def log_message(self, *a): pass

    def do_GET(self): self.atiende('GET')
    def do_HEAD(self): self.atiende('HEAD')
    def do_POST(self): self.atiende('POST')

    # — respuestas —
    def manda(self, codigo, cuerpo, tipo, extra=None):
        self.send_response(codigo)
        self.send_header('Content-Type', tipo); self.send_header('Content-Length', str(len(cuerpo)))
        self.send_header('Cache-Control', 'no-store'); self.send_header('X-Content-Type-Options', 'nosniff')
        for k, v in (extra or {}).items(): self.send_header(k, v)
        self.end_headers()
        if self.command != 'HEAD': self.wfile.write(cuerpo)

    def json(self, datos, codigo=200): self.manda(codigo, json.dumps(datos, ensure_ascii=False).encode('utf-8'), 'application/json; charset=utf-8')

    def falla(self, codigo, texto):
        self.close_connection = True
        self.json({'error': texto}, codigo)

    def cuerpo_json(self):
        try: n = int(self.headers.get('Content-Length') or 0)
        except ValueError: n = -1
        if n < 0 or n > 1_000_000: raise Aviso('Eso es demasiado texto. Acórtalo un poco.', 413)
        crudo = self.rfile.read(n) if n else b'{}'
        try: return json.loads(crudo.decode('utf-8') or '{}')
        except ValueError: raise Aviso('No entendí lo que mandó la página. Recárgala y vuelve a intentarlo.')

    # — seguridad: solo esta computadora, solo esta página —
    def de_casa(self):
        puerto = self.server.server_address[1]
        if (self.headers.get('Host') or '').lower() not in (f'127.0.0.1:{puerto}', f'localhost:{puerto}'): return False
        origen = self.headers.get('Origin')
        return not origen or origen.lower() in (f'http://127.0.0.1:{puerto}', f'http://localhost:{puerto}')

    def atiende(self, metodo):
        try:
            if not self.de_casa(): return self.falla(403, 'Esta página solo se puede usar desde esta computadora.')
            u = urllib.parse.urlsplit(self.path)
            ruta, q = urllib.parse.unquote(u.path), urllib.parse.parse_qs(u.query)
            if metodo == 'POST': return self.post(ruta, q)
            if ruta in PAGINA:
                with open(os.path.join(AQUI, PAGINA[ruta][0]), 'rb') as f: return self.manda(200, f.read(), PAGINA[ruta][1])
            if ruta.startswith('/archivo/'): return self.archivo(ruta[len('/archivo/'):])
            if ruta == '/api/ping': return self.json({'app': APP, 'raiz': RAIZ, 'pid': os.getpid()})
            if ruta == '/api/plantillas': return self.json(plantillas())
            if ruta == '/api/sistema': return self.json(SISTEMA.datos())
            if ruta == '/api/pedidos': return self.json(lista_pedidos())
            m = re.match(r'^/api/pedidos/([^/]+)$', ruta)
            if m:
                d = detalle(m.group(1)) if ID_PEDIDO.match(m.group(1)) else None
                return self.json(d) if d else self.falla(404, 'No encontré ese pedido.')
            if ruta == '/favicon.ico': return self.manda(204, b'', 'image/x-icon')
            self.falla(404, 'Esa página no existe.')
        except Aviso as a: self.intenta_fallar(a.codigo, a.texto)
        except (BrokenPipeError, ConnectionResetError, TimeoutError, socket.timeout): self.close_connection = True
        except Exception:
            traceback.print_exc()
            self.intenta_fallar(500, 'Algo falló dentro de la interfaz. Vuelve a intentarlo; si sigue igual, ciérrala y ábrela otra vez.')

    def intenta_fallar(self, codigo, texto):
        try: self.falla(codigo, texto)
        except OSError: self.close_connection = True

    def post(self, ruta, q):
        if ruta == '/api/subir': return self.subir(q)
        d = self.cuerpo_json()
        if ruta == '/api/pedidos':
            pid = crear_pedido(d)
            return self.json(detalle(pid), 201)
        if ruta == '/api/abrir':
            rel = rel_del_repo(d.get('ruta')) if isinstance(d, dict) else None
            real = archivo_permitido(rel) if rel and re.match(r'^proyectos/[^/]+/salida/', rel) else None
            if not real: raise Aviso('No encontré ese video en la carpeta de salida.', 404)
            subprocess.run(['/usr/bin/open', '-R', real], timeout=15, stdin=subprocess.DEVNULL)
            return self.json({'ok': True})
        if ruta == '/api/subir/descartar':
            rel = d.get('ruta') if isinstance(d, dict) else None
            if rel in SUBIDOS and ruta_en_entrada(rel, EXT_VIDEO + EXT_IMAGEN) and not self.en_uso(rel):
                os.remove(os.path.join(ENTRADA, rel.split('/', 1)[1])); SUBIDOS.discard(rel)
                return self.json({'ok': True, 'borrado': True})
            return self.json({'ok': True, 'borrado': False})
        m = re.match(r'^/api/pedidos/([^/]+)/(respuesta|lanzar|detener)$', ruta)
        if m and ID_PEDIDO.match(m.group(1)) and os.path.isfile(os.path.join(PEDIDOS, m.group(1), 'pedido.json')):
            pid, que = m.groups()
            if que == 'respuesta':
                responder(pid, d)
                g = leer_json(os.path.join(PEDIDOS, pid, 'claude.json')) or {}
                if g.get('modo') == 'auto' and SISTEMA.claude_ok:          # el pedido va en automático: Claude sigue solo
                    try: LANZADOR.encolar(pid)
                    except Aviso: pass
            elif que == 'lanzar': LANZADOR.encolar(pid)
            else: LANZADOR.detener(pid); time.sleep(0.3)
            return self.json(detalle(pid))
        raise Aviso('No encontré eso.', 404)

    def en_uso(self, rel):
        for p in lista_pedidos():
            d = leer_json(os.path.join(PEDIDOS, p['id'], 'pedido.json')) or {}
            if d.get('video') == rel or rel in (d.get('archivos') or []): return True
        return False

    # — subir: del navegador al disco por pedazos, nunca entero en memoria —
    def subir(self, q):
        base, ext = nombre_seguro((q.get('nombre') or [''])[0])
        if ext not in EXT_VIDEO + EXT_IMAGEN:
            return self.falla(415, 'Ese tipo de archivo no sirve aquí. Sube un video (mp4, mov) o una imagen (jpg, png).')
        try: total = int(self.headers.get('Content-Length') or -1)
        except ValueError: total = -1
        if total <= 0: return self.falla(411, 'El archivo llegó vacío. Vuelve a elegirlo.')
        os.makedirs(ENTRADA, exist_ok=True)
        if total > shutil.disk_usage(ENTRADA).free - 500e6:
            return self.falla(507, 'No hay espacio suficiente en el disco para copiar este archivo. Libera espacio y vuelve a intentarlo.')
        with _subir:                                   # no se encima nada: si el nombre ya existe, lleva sufijo
            n, nombre = 1, base + ext
            while os.path.exists(os.path.join(ENTRADA, nombre)) or os.path.exists(os.path.join(ENTRADA, nombre + '.parcial')):
                n += 1; nombre = f'{base}-{n}{ext}'
            parcial = os.path.join(ENTRADA, nombre + '.parcial')
            f = open(parcial, 'xb')
        falta, completo = total, False
        try:
            with f:
                while falta > 0:
                    pedazo = self.rfile.read(min(1 << 20, falta))
                    if not pedazo: break
                    f.write(pedazo); falta -= len(pedazo)
            completo = falta == 0
        finally:
            if completo: os.rename(parcial, os.path.join(ENTRADA, nombre))
            else:
                self.close_connection = True
                try: os.remove(parcial)
                except OSError: pass
        if not completo: return                          # la persona canceló o se cortó: no queda nada a medias
        SUBIDOS.add(f'entrada/{nombre}')
        self.json({'ruta': f'entrada/{nombre}', 'nombre': nombre, 'peso': total}, 201)

    # — archivos del repo: solo lectura, solo lo permitido, con rangos para poder adelantar los videos —
    def archivo(self, rel):
        real = archivo_permitido(rel)
        if not real: return self.falla(403, 'Ese archivo no se puede ver desde aquí.')
        st = os.stat(real)
        total, marca = st.st_size, f'"{st.st_mtime_ns:x}-{st.st_size:x}"'
        tipo = TIPOS[os.path.splitext(real)[1].lower()]
        comunes = {'Accept-Ranges': 'bytes', 'ETag': marca, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff'}
        rango = self.headers.get('Range')
        if not rango and self.headers.get('If-None-Match') == marca:
            self.send_response(304)
            for k, v in comunes.items(): self.send_header(k, v)
            self.send_header('Content-Length', '0'); self.end_headers(); return
        a, b, codigo = 0, total - 1, 200
        if rango:
            m = re.match(r'^bytes=(\d*)-(\d*)$', rango.strip())
            ok = bool(m) and (m.group(1) or m.group(2))
            if ok and m.group(1):
                a = int(m.group(1)); b = min(int(m.group(2)), total - 1) if m.group(2) else total - 1
            elif ok:
                a = max(0, total - int(m.group(2))); ok = int(m.group(2)) > 0
            if not ok or a > b or a >= total:
                self.send_response(416); self.send_header('Content-Range', f'bytes */{total}'); self.send_header('Content-Length', '0')
                self.end_headers(); return
            codigo = 206
        largo = max(0, b - a + 1)
        self.send_response(codigo)
        self.send_header('Content-Type', tipo); self.send_header('Content-Length', str(largo))
        if codigo == 206: self.send_header('Content-Range', f'bytes {a}-{b}/{total}')
        for k, v in comunes.items(): self.send_header(k, v)
        self.end_headers()
        if self.command == 'HEAD': return
        with open(real, 'rb') as f:
            f.seek(a)
            while largo > 0:
                pedazo = f.read(min(1 << 18, largo))
                if not pedazo: break
                self.wfile.write(pedazo); largo -= len(pedazo)


class Servidor(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        if not isinstance(sys.exc_info()[1], (BrokenPipeError, ConnectionResetError, TimeoutError, socket.timeout)): traceback.print_exc()


def ya_abierta():
    """¿Ya hay una interfaz de ESTA carpeta corriendo? Devuelve su dirección."""
    for p in range(PUERTO_BASE, PUERTO_BASE + PUERTOS):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{p}/api/ping', timeout=0.4) as r: d = json.loads(r.read().decode())
            if d.get('app') == APP and d.get('raiz') == RAIZ: return f'http://127.0.0.1:{p}/'
        except Exception: continue
    return None


def abre_navegador(url):
    try: subprocess.Popen(['/usr/bin/open', url], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except OSError: pass


def main():
    global PLANTILLAS
    ap = argparse.ArgumentParser(description='Interfaz local de Videos largos con IA')
    ap.add_argument('--sin-navegador', action='store_true', help='no abrir el navegador')
    ap.add_argument('--puerto', type=int, default=PUERTO_BASE)
    ap.add_argument('--plantillas', help='otra carpeta de plantillas (solo para pruebas)')
    a = ap.parse_args()
    if a.plantillas: PLANTILLAS = os.path.realpath(a.plantillas)
    url = None if a.plantillas else ya_abierta()
    if url:
        print(f'La interfaz ya estaba abierta: {url}')
        if not a.sin_navegador: abre_navegador(url)
        return
    servidor = None
    for p in range(a.puerto, a.puerto + PUERTOS):
        try: servidor = Servidor(('127.0.0.1', p), Peticion); break       # nunca fuera de esta computadora
        except OSError: continue
    if not servidor: sys.exit('No encontré un puerto libre para abrir la interfaz. Cierra otras ventanas de la interfaz y vuelve a intentarlo.')
    url = f'http://127.0.0.1:{servidor.server_address[1]}/'
    threading.Thread(target=SISTEMA.revisar, daemon=True).start()

    def cierra(*_):
        LANZADOR.apagar()
        threading.Thread(target=servidor.shutdown, daemon=True).start()
    for s in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP): signal.signal(s, cierra)
    print(f'\n  Videos largos con IA · interfaz abierta en  {url}\n\n  Deja esta ventana abierta mientras la uses.\n  Para cerrarla: cierra esta ventana (o Control + C).\n', flush=True)
    if not a.sin_navegador: abre_navegador(url)
    try: servidor.serve_forever()
    finally:
        LANZADOR.apagar(); servidor.server_close()
        print('Interfaz cerrada.')


if __name__ == '__main__':
    main()
