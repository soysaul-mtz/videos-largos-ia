'use strict';
/* Interfaz local de «Videos largos con IA». Sin librerías y sin internet.
   La página solo enseña y recoge: quien edita es Claude Code. Todo pasa por los archivos de pedidos/<id>/. */

// ───────────────────────── ayudas ─────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function h(etq, attrs, ...hijos) {
  const n = document.createElement(etq);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;                 // solo para textos fijos de este archivo o ya convertidos por md()
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const x of hijos.flat(Infinity)) if (x != null && x !== false) n.append(x.nodeType ? x : document.createTextNode(String(x)));
  return n;
}

/* Cambia todo el contenido de un elemento (se saltan los huecos: null, false). */
const pon = (el, ...hijos) => el.replaceChildren(...hijos.flat(Infinity).filter(x => x != null && x !== false));

const DIBUJOS = {
  subir: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="13" height="14" rx="2.5"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
  imagen: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>',
  palomita: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  flecha: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
};
const dibujo = (nombre, clase) => h('span', { class: clase || 'dibujo', html: DIBUJOS[nombre], 'aria-hidden': 'true' });

function peso(b) {
  if (b >= 1e9) return (b / 1e9).toFixed(b >= 1e10 ? 0 : 1) + ' GB';
  if (b >= 1e6) return Math.round(b / 1e6) + ' MB';
  return Math.max(1, Math.round(b / 1e3)) + ' KB';
}

function fecha(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return '';
  const hora = d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return 'Hoy, ' + hora;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + ', ' + hora;
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function avisar(texto, mal) {
  const n = h('div', { class: 'aviso' + (mal ? ' mal' : '') }, texto);
  $('#avisos').append(n);
  setTimeout(() => n.remove(), mal ? 7000 : 3200);
}

function conexion(hay) { $('#sin-conexion').hidden = hay; }

async function api(ruta, datos) {
  let r;
  try {
    r = await fetch(ruta, datos === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
  } catch (e) {
    conexion(false);
    const err = new Error('Se perdió la conexión con la interfaz. Vuelve a abrirla con «Abrir plantillas».'); err.sinRed = true; throw err;
  }
  conexion(true);
  let d = null;
  try { d = await r.json(); } catch (e) { /* sin cuerpo */ }
  if (!r.ok) { const err = new Error((d && d.error) || 'Algo falló. Vuelve a intentarlo.'); err.codigo = r.status; throw err; }
  return d;
}

function copiar(texto, boton) {
  const listo = () => { const antes = boton.textContent; boton.textContent = 'Copiado'; setTimeout(() => { boton.textContent = antes; }, 1400); };
  (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).catch(() => {
    const a = h('textarea', {}); a.value = texto; document.body.append(a); a.select(); document.execCommand('copy'); a.remove();
  }).then(listo);
}
const botonCopiar = texto => h('button', { type: 'button', class: 'b1', onclick: e => copiar(texto, e.currentTarget) }, 'Copiar');

/* Cambia solo lo que cambió: cada bloque tiene una clave y una «firma» de sus datos. Si la firma es la misma,
   el bloque no se toca (así no se reinicia un video que se está viendo ni se borra un texto a medio escribir). */
function parchar(cont, bloques) {
  const viejos = new Map([...cont.children].map(n => [n.dataset.clave, n]));
  let anterior = null;
  for (const b of bloques) {
    if (!b) continue;
    let n = viejos.get(b.clave);
    viejos.delete(b.clave);
    if (!n || n.dataset.firma !== b.firma) {
      const nuevo = b.crear();
      nuevo.dataset.clave = b.clave; nuevo.dataset.firma = b.firma;
      if (n) n.replaceWith(nuevo);
      n = nuevo;
    }
    const sitio = anterior ? anterior.nextSibling : cont.firstChild;
    if (n !== sitio) cont.insertBefore(n, sitio);
    anterior = n;
  }
  for (const n of viejos.values()) n.remove();
}

// ───────────────────────── texto con formato (plan, escaleta) → HTML sencillo ─────────────────────────
// Convertidor mínimo propio: títulos, listas (con sangría), tablas, negritas, cursivas, código, citas y líneas.
function md(fuente) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const enLinea = s => {
    const codigos = [];
    s = esc(s).replace(/`([^`]+)`/g, (_, c) => { codigos.push(c); return `\u0001${codigos.length - 1}\u0001`; });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
      .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+?)__/g, '<strong>$1</strong>')
      .replace(/(^|[\s(«¿¡])\*([^*\s][^*]*?)\*(?=[\s).,;:»!?]|$)/g, '$1<em>$2</em>')
      .replace(/(^|[\s(«¿¡])_([^_\s][^_]*?)_(?=[\s).,;:»!?]|$)/g, '$1<em>$2</em>');
    return s.replace(/\u0001(\d+)\u0001/g, (_, i) => `<code>${codigos[+i]}</code>`);
  };
  const celdas = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
  const esSeparador = l => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('-');
  const esItem = l => /^(\s*)([-*+•]|\d+[.)])\s+(.*)$/.exec(l);
  const L = String(fuente).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let parrafo = [];
  const cierra = () => { if (parrafo.length) { out.push('<p>' + parrafo.map(enLinea).join('<br>') + '</p>'); parrafo = []; } };
  for (let i = 0; i < L.length; i++) {
    const l = L[i];
    if (/^\s*```/.test(l)) {
      cierra(); const cod = [];
      for (i++; i < L.length && !/^\s*```/.test(L[i]); i++) cod.push(L[i]);
      out.push('<pre><code>' + esc(cod.join('\n')) + '</code></pre>'); continue;
    }
    if (!l.trim()) { cierra(); continue; }
    let m = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l);
    if (m) { cierra(); const n = Math.min(6, m[1].length + 2); out.push(`<h${n}>${enLinea(m[2])}</h${n}>`); continue; }   // «#» = h3: la página ya tiene sus h1 y h2
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(l)) { cierra(); out.push('<hr>'); continue; }
    if (l.includes('|') && i + 1 < L.length && esSeparador(L[i + 1])) {
      cierra();
      const cab = celdas(l); const filas = [];
      for (i += 2; i < L.length && L[i].includes('|') && L[i].trim(); i++) filas.push(celdas(L[i]));
      i--;
      out.push('<div class="tabla"><table><thead><tr>' + cab.map(c => `<th scope="col">${enLinea(c)}</th>`).join('') + '</tr></thead><tbody>' +
        filas.map(f => '<tr>' + cab.map((_, k) => `<td>${enLinea(f[k] || '')}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    if (/^\s*>/.test(l)) {
      cierra(); const cita = [];
      for (; i < L.length && /^\s*>/.test(L[i]); i++) cita.push(L[i].replace(/^\s*>\s?/, ''));
      i--; out.push('<blockquote>' + cita.map(enLinea).join('<br>') + '</blockquote>'); continue;
    }
    if (esItem(l)) {
      cierra(); const items = [];
      for (; i < L.length; i++) {
        const it = esItem(L[i]);
        if (it) items.push({ sangria: it[1].replace(/\t/g, '    ').length, ord: /\d/.test(it[2]), texto: it[3] });
        else if (L[i].trim() && /^\s+/.test(L[i]) && items.length) items[items.length - 1].texto += ' ' + L[i].trim();
        else break;
      }
      i--;
      let s = ''; const pila = [];
      for (const it of items) {
        while (pila.length && it.sangria < pila[pila.length - 1].sangria) s += '</li></' + pila.pop().etq + '>';
        if (!pila.length || it.sangria > pila[pila.length - 1].sangria) { const etq = it.ord ? 'ol' : 'ul'; pila.push({ sangria: it.sangria, etq }); s += `<${etq}><li>`; }
        else s += '</li><li>';
        s += enLinea(it.texto.replace(/^\[ \]\s+/, '☐ ').replace(/^\[[xX]\]\s+/, '☑ '));
      }
      while (pila.length) s += '</li></' + pila.pop().etq + '>';
      out.push(s); continue;
    }
    parrafo.push(l.trim());
  }
  cierra();
  return out.join('\n');
}

const documentos = new Map();
function cargarDoc(url) {
  if (!documentos.has(url)) {
    documentos.set(url, fetch(url).then(r => r.ok ? r.text() : Promise.reject(new Error('sin archivo'))).then(md)
      .catch(e => { documentos.delete(url); throw e; }));
  }
  return documentos.get(url);
}

// ───────────────────────── visor (ampliar la hoja de fotos o un documento) ─────────────────────────
function abrirVisor(titulo, nodo) {
  $('#visor-titulo').textContent = titulo;
  $('#visor-cuerpo').replaceChildren(nodo);
  const v = $('#visor');
  if (!v.open) v.showModal();
  $('#visor-cuerpo').scrollTo(0, 0);
}
function verImagen(url, titulo) {
  const img = h('img', { src: url, alt: titulo, title: 'Toca para acercar o alejar' });
  img.addEventListener('click', () => img.classList.toggle('grande'));
  abrirVisor(titulo, img);
}
$('#visor-cerrar').addEventListener('click', () => $('#visor').close());
$('#visor').addEventListener('click', e => { if (e.target === $('#visor')) $('#visor').close(); });

// ───────────────────────── estado de la página ─────────────────────────
const E = { plantillas: [], firmaPlantillas: null, sistema: null, recien: null, detalleDe: null, cuenta: 0 };
const PESTANAS = { plantillas: 'Plantillas', nuevo: 'Nuevo video', videos: 'Mis videos', crear: 'Nueva plantilla' };

function ruta() {
  const [camino, consulta = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const partes = camino.split('/').filter(Boolean);
  return { pestana: PESTANAS[partes[0]] ? partes[0] : 'plantillas', id: partes[1] || null, q: new URLSearchParams(consulta) };
}

let pestanaAnterior = null;
function navegar() {
  const r = ruta();
  for (const p of Object.keys(PESTANAS)) $('#v-' + p).hidden = p !== r.pestana;
  $$('.pestanas a').forEach(a => a.dataset.pestana === r.pestana ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  document.title = PESTANAS[r.pestana] + ' · Videos largos con IA';
  $$('#v-plantillas video').forEach(v => { if (r.pestana === 'plantillas') v.play().catch(() => {}); else v.pause(); });
  if (r.pestana === 'plantillas') cargarPlantillas();
  if (r.pestana === 'nuevo') { cargarSistema(); cargarPlantillas().then(() => { const p = r.q.get('p'); if (p) marcar(p.split(',')); }); }
  if (r.pestana === 'crear') cargarSistema();
  if (r.pestana === 'videos') {
    $('#videos-lista').hidden = !!r.id; $('#videos-detalle').hidden = !r.id;
    if (r.id && E.detalleDe !== r.id) { E.detalleDe = r.id; $('#videos-detalle').replaceChildren(h('p', { class: 'suave' }, 'Abriendo el pedido…')); }
    tic();
  }
  if (pestanaAnterior !== r.pestana + (r.id || '')) window.scrollTo(0, 0);
  pestanaAnterior = r.pestana + (r.id || '');
}

async function cargarSistema() {
  try { E.sistema = await api('/api/sistema'); } catch (e) { return; }
  refrescarNuevo(); refrescarCrear();
}

// ───────────────────────── pestaña: Plantillas ─────────────────────────
async function cargarPlantillas() {
  let P;
  try { P = await api('/api/plantillas'); } catch (e) { if (E.firmaPlantillas === null) $('#lista-plantillas').replaceChildren(h('p', { class: 'franja error' }, e.message)); return; }
  const firma = JSON.stringify(P);
  if (firma === E.firmaPlantillas) return;
  E.firmaPlantillas = firma; E.plantillas = P;
  pintarPlantillas(); pintarCasillas();
}

const lista = arr => (arr || []).map(x => h('li', {}, x));

function tarjetaPlantilla(p) {
  let vista;
  if (p.muestra_video) {
    vista = h('video', { src: p.muestra_video, poster: p.muestra_imagenes[0], autoplay: true, loop: true, playsinline: true, preload: 'metadata', 'aria-label': `Clip de muestra de la plantilla ${p.nombre}, sin sonido` });
    vista.muted = true; vista.defaultMuted = true;
  } else if (p.muestra_imagenes.length) vista = h('img', { src: p.muestra_imagenes[0], alt: `Muestra de la plantilla ${p.nombre}` });
  else vista = h('div', { class: 'sin' }, h('b', {}, 'Muestra en preparación'), h('span', {}, 'El clip y las imágenes de esta plantilla aparecerán aquí.'));
  const minis = p.muestra_imagenes.map((u, i) => h('button', { type: 'button', 'aria-label': `Ampliar la muestra ${i + 1} de ${p.nombre}`, onclick: () => verImagen(u, `${p.nombre} · muestra ${i + 1}`) },
    h('img', { src: u, alt: '', loading: 'lazy' })));
  const S = p.secciones || [];
  return h('section', { class: 'plantilla', id: 'p-' + p.id, 'aria-labelledby': 't-' + p.id },
    h('header', {}, h('span', { class: 'num', 'aria-hidden': 'true' }, p.numero != null ? p.numero : ''), h('div', {}, h('h2', { id: 't-' + p.id }, p.nombre), h('p', { class: 'resumen' }, p.resumen || ''))),
    h('div', { class: 'vista' }, vista),
    minis.length ? h('div', { class: 'minis' }, minis) : null,
    h('div', { class: 'usar' },
      h('span', {}, [p.duracion_ideal && `Duración ideal: ${p.duracion_ideal}.`, p.tiempo_de_edicion && `Tiempo de edición: ${p.tiempo_de_edicion}.`].filter(Boolean).join(' ')),
      h('a', { class: 'b1', href: '#/nuevo?p=' + encodeURIComponent(p.id) }, 'Usar esta plantilla')),
    h('div', { class: 'datos' },
      h('div', {}, h('h3', {}, 'Sirve para'), h('ul', {}, lista(p.sirve_para))),
      h('div', {}, h('h3', {}, 'Mejor usa otra si'), h('ul', {}, lista(p.no_sirve_para))),
      h('div', {}, h('h3', {}, 'Lo que necesitas tener'), h('ul', {}, lista(p.material)))),
    S.length ? [h('h3', {}, 'Cómo se reparte el video'),
      h('div', { class: 'barra', role: 'img', 'aria-label': 'Reparto del video: ' + S.map(s => `${s.nombre} ${s.porcentaje} %`).join(', ') },
        S.map(s => h('div', { class: 'tramo', style: `flex:${Number(s.porcentaje) || 1}`, title: `${s.nombre} · ${s.porcentaje} %: ${s.que_pasa || ''}` }, h('b', {}, s.nombre), h('span', {}, `${s.porcentaje} %`)))),
      h('details', { class: 'mas' }, h('summary', {}, 'Qué pasa en cada parte'), h('ol', {}, S.map(s => h('li', {}, h('b', {}, s.nombre), ` · ${s.que_pasa || ''}`))))] : null,
    (p.piezas_destacadas || []).length ? h('details', { class: 'mas' }, h('summary', {}, 'Animaciones principales'),
      h('ul', {}, p.piezas_destacadas.map(x => h('li', {}, h('b', {}, x.pieza), ` · ${x.que_es || ''}`)))) : null);
}

function pintarPlantillas() {
  const P = E.plantillas;
  $('#indice').replaceChildren(
    ...P.map(p => h('button', { type: 'button', onclick: () => $('#p-' + p.id).scrollIntoView({ behavior: 'smooth' }) }, h('b', {}, p.numero != null ? p.numero : ''), p.nombre)),
    h('button', { type: 'button', onclick: () => $('#p-nueva').scrollIntoView({ behavior: 'smooth' }) }, h('b', {}, '+'), 'Crear una nueva'));
  pon($('#lista-plantillas'),
    P.length ? null : h('div', { class: 'vacio' }, h('p', {}, 'Todavía no hay plantillas en esta carpeta. Puedes crear la primera a partir de un video o una imagen que te guste.')),
    ...P.map(tarjetaPlantilla),
    h('section', { class: 'plantilla nueva', id: 'p-nueva' },
      h('header', {}, h('span', { class: 'num', 'aria-hidden': 'true' }, '+'), h('div', {}, h('h2', {}, 'Crear una plantilla nueva'), h('p', { class: 'resumen' }, 'A partir de un video o de una imagen que te guste, o describiéndola tú.'))),
      h('ol', {}, h('li', {}, 'Claude estudia tu referencia y escribe la ficha: ritmo, colores, letras y cada animación.'),
        h('li', {}, 'Programa las animaciones y te enseña fotos de cómo quedaron.'), h('li', {}, 'La agrega a este menú, lista para usarse con cualquier video.')),
      h('p', { style: 'margin:16px 0 0' }, h('a', { class: 'b1', href: '#/crear' }, '+ Crear una plantilla nueva'))));
}

// ───────────────────────── subir archivos (se copian a la carpeta «entrada») ─────────────────────────
function crearZona(el, op) {
  const items = [];
  const esVideo = op.tipo === 'video';
  const sirve = esVideo ? /\.(mp4|mov|m4v|mkv|avi|webm|mts|mpe?g)$/i : /\.(jpe?g|png|webp|heic|gif)$/i;
  const caja = h('div', {}); el.append(caja);
  const cambio = () => { if (op.alCambiar) op.alCambiar(); };

  function soltar() {
    const entrada = h('input', { type: 'file', accept: esVideo ? 'video/*,.mkv,.mts' : 'image/*,.heic', multiple: op.max > 1, 'aria-label': op.titulo });
    const z = h('label', { class: 'zona' + (op.chica ? ' chica' : '') }, entrada, dibujo('subir'), h('b', {}, op.titulo), h('span', {}, op.ayuda), h('span', { class: 'falso-boton', 'aria-hidden': 'true' }, op.boton));
    entrada.addEventListener('change', () => { agrega(entrada.files); entrada.value = ''; });
    for (const ev of ['dragenter', 'dragover']) z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('encima'); });
    for (const ev of ['dragleave', 'drop']) z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('encima'); });
    z.addEventListener('drop', e => agrega(e.dataTransfer.files));
    return z;
  }

  function pinta(primera) {
    pon(caja,
      items.length ? h('div', { class: op.max > 1 ? 'archivos' : '' }, items.map(i => i.nodo)) : null,
      items.length < op.max ? soltar() : null);
    if (!primera) cambio();
  }

  function agrega(archivos) {
    for (const f of [...archivos]) {
      if (items.length >= op.max) { avisar(op.max === 1 ? 'Aquí va un solo video. Quita el que está para poner otro.' : `Aquí caben ${op.max} imágenes como máximo.`, true); break; }
      if (!sirve.test(f.name)) { avisar(`«${f.name}» no es ${esVideo ? 'un video' : 'una imagen'} que se pueda usar aquí.`, true); continue; }
      if (!f.size) { avisar(`«${f.name}» está vacío.`, true); continue; }
      const libre = E.sistema && E.sistema.libre_bytes;
      if (libre && f.size > libre - 1e9) { avisar(`No cabe: «${f.name}» pesa ${peso(f.size)} y en el disco quedan ${peso(libre)} libres. Libera espacio y vuelve a intentarlo.`, true); continue; }
      items.push(nuevo(f));
    }
    pinta();
  }

  function nuevo(f) {
    const it = { estado: 'subiendo', ruta: null, peso: f.size, nombre: f.name };
    const barra = h('i', {});
    const medidor = h('div', { class: 'medidor', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0, 'aria-label': 'Avance de la copia' }, barra);
    const texto = h('div', { class: 'detalle' }, `Copiando… 0 % de ${peso(f.size)}`);
    const boton = h('button', { type: 'button', class: 'b3', onclick: quita }, 'Cancelar');
    const icono = h('span', { class: 'icono' });
    if (!esVideo && /^image\/(jpeg|png|webp|gif)$/.test(f.type)) { const u = URL.createObjectURL(f); icono.append(h('img', { src: u, alt: '' })); it.vista = u; }
    else icono.innerHTML = DIBUJOS[esVideo ? 'video' : 'imagen'];
    it.nodo = h('div', { class: 'archivo' }, icono, h('div', { class: 'cuerpo' }, h('div', { class: 'nombre', title: f.name }, f.name), medidor, texto), boton);
    const x = it.x = new XMLHttpRequest();
    x.open('POST', '/api/subir?nombre=' + encodeURIComponent(f.name));
    x.upload.onprogress = e => {
      if (!e.lengthComputable) return;
      const p = Math.floor(e.loaded / e.total * 100);
      barra.style.width = p + '%'; medidor.setAttribute('aria-valuenow', p);
      texto.textContent = p >= 100 ? 'Terminando de guardar…' : `Copiando… ${peso(e.loaded)} de ${peso(e.total)} · ${p} %`;
    };
    const falla = msj => { it.estado = 'error'; it.nodo.classList.add('fallo'); medidor.remove(); texto.textContent = msj; boton.textContent = 'Quitar'; cambio(); };
    x.onload = () => {
      let d = null; try { d = JSON.parse(x.responseText); } catch (e) { /* sin cuerpo */ }
      if (x.status === 201 && d && d.ruta) {
        it.estado = 'lista'; it.ruta = d.ruta; it.nodo.classList.add('lista'); medidor.remove();
        texto.textContent = `Copiado · ${peso(d.peso)}`; boton.textContent = esVideo ? 'Cambiar' : 'Quitar'; cambio();
      } else falla((d && d.error) || 'No se pudo copiar. Vuelve a intentarlo.');
    };
    x.onerror = () => falla('Se cortó la copia. Revisa que la interfaz siga abierta y vuelve a intentarlo.');
    x.send(f);

    function quita() {
      if (it.estado === 'subiendo') x.abort();
      if (it.estado === 'lista') api('/api/subir/descartar', { ruta: it.ruta }).catch(() => {});
      if (it.vista) URL.revokeObjectURL(it.vista);
      items.splice(items.indexOf(it), 1); pinta();
    }
    return it;
  }

  pinta(true);
  return {
    rutas: () => items.filter(i => i.estado === 'lista').map(i => i.ruta),
    nombres: () => items.filter(i => i.estado === 'lista').map(i => i.nombre),
    ocupada: () => items.some(i => i.estado === 'subiendo'),
    cuenta: () => items.length,
    vaciar: () => { for (const i of items) if (i.vista) URL.revokeObjectURL(i.vista); items.length = 0; pinta(); },   // los archivos ya son del pedido: no se borran
  };
}
// que soltar un archivo fuera del recuadro no saque a la persona de la página
for (const ev of ['dragover', 'drop']) window.addEventListener(ev, e => e.preventDefault());

// ───────────────────────── pestaña: Nuevo video ─────────────────────────
const marcadas = new Set();
const zonaVideo = crearZona($('#zona-video'), { tipo: 'video', max: 1, titulo: 'Suelta aquí tu video', ayuda: 'o elígelo de tu computadora. Se copia a la carpeta de trabajo; el original no se toca.', boton: 'Elegir video', alCambiar: () => refrescarNuevo() });

function pintarCasillas() {
  const P = E.plantillas;
  for (const i of [...marcadas]) if (!P.some(p => p.id === i)) marcadas.delete(i);
  $('#casillas').replaceChildren(...(P.length ? P.map(p => {
    const c = h('input', { type: 'checkbox', value: p.id, checked: marcadas.has(p.id) });
    c.addEventListener('change', () => { c.checked ? marcadas.add(p.id) : marcadas.delete(p.id); refrescarNuevo(); });
    return h('label', { class: 'casilla' }, c,
      p.muestra_imagenes[0] ? h('img', { class: 'foto', src: p.muestra_imagenes[0], alt: '', loading: 'lazy' }) : h('span', { class: 'foto' }, 'Muestra en preparación'),
      h('span', { class: 'txt' }, h('b', {}, p.nombre), h('small', {}, p.resumen || '')),
      dibujo('palomita', 'palomita'));
  }) : [h('p', { class: 'suave' }, 'Todavía no hay plantillas. Crea la primera en «Nueva plantilla».')]));
  refrescarNuevo();
}

function marcar(ids) {
  for (const i of ids) if (E.plantillas.some(p => p.id === i)) marcadas.add(i);
  $$('#casillas input').forEach(c => { c.checked = marcadas.has(c.value); });
  refrescarNuevo();
}

function avisosDeSistema() {
  const s = E.sistema, L = [];
  if (!s) return L;
  if (s.poco_espacio) L.push(h('p', { class: 'franja ojo' }, `Queda poco espacio en el disco: ${s.libre_gb} GB libres. Un video de 10 minutos ocupa unos 6 GB mientras se edita. Puedes seguir, pero conviene liberar espacio antes.`));
  if (s.instalacion_completa === false) L.push(h('p', { class: 'franja ojo' }, 'A esta computadora le falta terminar la instalación' + (s.faltan.length ? ` (${s.faltan.slice(0, 3).join('; ')})` : '') + '. Puedes crear el pedido; Claude te dirá qué instalar antes de empezar.'));
  return L;
}

function refrescarNuevo() {
  const n = marcadas.size, video = zonaVideo.rutas()[0], todas = E.plantillas.length > 0 && n === E.plantillas.length;
  $('#marcar-todas').textContent = todas ? 'Quitar todas' : 'Marcar todas';
  $('#marcar-todas').hidden = E.plantillas.length < 2;
  const L = avisosDeSistema();
  if (n > 1) L.push(h('p', { class: 'franja nota' }, `Marcaste ${n} plantillas: saldrán ${n} videos, uno por plantilla. Tu video se corta una sola vez y las plantillas se hacen de una en una.`));
  $('#avisos-nuevo').replaceChildren(...L);
  let falta = '';
  if (zonaVideo.ocupada()) falta = 'Espera a que termine de copiarse el video.';
  else if (!video && !n) falta = 'Falta tu video y marcar al menos una plantilla.';
  else if (!video) falta = 'Falta tu video.';
  else if (!n) falta = 'Falta marcar al menos una plantilla.';
  $('#resumen-nuevo').textContent = falta || `Todo listo: 1 video y ${plural(n, 'plantilla', 'plantillas')}.`;
  $('#crear-pedido').disabled = !!falta;
}

$('#marcar-todas').addEventListener('click', () => {
  if (marcadas.size === E.plantillas.length) marcadas.clear(); else E.plantillas.forEach(p => marcadas.add(p.id));
  marcar([]);
});

$('#crear-pedido').addEventListener('click', async e => {
  const b = e.currentTarget; b.disabled = true;
  try {
    const d = await api('/api/pedidos', { tipo: 'video', video: zonaVideo.rutas()[0], titulo: zonaVideo.nombres()[0], plantillas: E.plantillas.filter(p => marcadas.has(p.id)).map(p => p.id), notas: $('#notas').value });
    zonaVideo.vaciar(); marcadas.clear(); marcar([]); $('#notas').value = '';
    E.recien = d.id; location.hash = '#/videos/' + d.id;
  } catch (err) { avisar(err.message, true); refrescarNuevo(); }
});

// ───────────────────────── pestaña: Mis videos ─────────────────────────
const marcaEstado = r => h('span', { class: 'marca-estado ' + r.clave }, r.texto);

function tarjetaPedido(p) {
  return h('a', { class: 'tarjeta pedido', href: '#/videos/' + p.id },
    h('div', { class: 'cuerpo' }, h('div', { class: 'titulo' }, p.titulo),
      h('div', { class: 'abajo' }, h('span', {}, fecha(p.creado)), p.plantillas.length ? h('span', { class: 'etiquetas' }, p.plantillas.map(x => h('span', { class: 'chip' }, x.nombre))) : null)),
    marcaEstado(p.resumen), dibujo('flecha', 'flecha'));
}

function pintarLista(L) {
  const toca = L.filter(p => p.resumen.clave === 'te_toca').length;
  $('#globo').hidden = !toca; $('#globo').textContent = toca;
  $('#globo').setAttribute('aria-label', toca ? `${plural(toca, 'pedido espera', 'pedidos esperan')} tu revisión` : '');
  parchar($('#lista-pedidos'), L.length ? L.map(p => ({ clave: p.id, firma: JSON.stringify(p), crear: () => tarjetaPedido(p) })) : [{
    clave: 'vacio', firma: '1', crear: () => h('div', { class: 'vacio' }, h('p', {}, 'Todavía no has hecho ningún video. Empieza en “Nuevo video”.'), h('a', { class: 'b1', href: '#/nuevo' }, 'Nuevo video')) }]);
}

async function accion(boton, id, que) {
  boton.disabled = true;
  try { pintarDetalle(await api(`/api/pedidos/${id}/${que}`, {})); }
  catch (e) { avisar(e.message, true); boton.disabled = false; }
}

function vistaDoc(p, titulo) {
  if (!p.existe) return h('p', { class: 'nota-paso' }, 'Claude todavía no deja aquí el archivo para revisar. Si no aparece en un momento, pídele que lo vuelva a preparar.');
  if (p.tipo === 'img') {
    return h('div', {}, h('button', { type: 'button', class: 'hoja', 'aria-label': 'Ampliar ' + titulo, onclick: () => verImagen(p.url, titulo) }, h('img', { src: p.url, alt: titulo })),
      h('p', { class: 'hoja-pie' }, 'Toca la imagen para verla en grande.'));
  }
  const doc = h('div', { class: 'doc', tabindex: 0, role: 'region', 'aria-label': titulo }, h('p', { class: 'suave' }, 'Abriendo…'));
  cargarDoc(p.url).then(html => { doc.innerHTML = html; }).catch(() => { doc.replaceChildren(h('p', { class: 'suave' }, 'No se pudo abrir el documento. Recarga la página.')); });
  return h('div', { class: 'doc-caja' }, doc,
    h('button', { type: 'button', class: 'b2 ampliar', onclick: () => cargarDoc(p.url).then(html => abrirVisor(titulo, h('div', { class: 'doc', html }))).catch(() => {}) }, 'Ampliar'));
}

const NOMBRE_PUNTO = (d, para) => ({ plan: d.tipo === 'plantilla' ? 'la ficha de tu plantilla' : 'el plan del corte', escaleta: 'la escaleta', fotos: 'las fotos' })[para];

/* Lo que la persona debe aprobar: el documento y dos botones. «Pedir cambios» exige escribir qué cambiar. */
function aprobacion(d, p, extra) {
  const que = NOMBRE_PUNTO(d, p.para), titulo = que.charAt(0).toUpperCase() + que.slice(1);
  if (p.respondido) {
    return h('div', { class: 'aprobar respondido' },
      h('h3', {}, p.respondido.decision === 'aprobado' ? `Aprobaste ${que}` : `Pediste cambios en ${que}`),
      p.respondido.texto ? h('p', { class: 'cita', style: 'margin-top:0' }, p.respondido.texto) : null,
      h('details', { class: 'guardado' }, h('summary', {}, `Ver ${que}`), vistaDoc(p, titulo)));
  }
  const cuadro = h('textarea', { rows: 3, maxlength: 6000, required: true, 'aria-label': 'Qué quieres que cambie', placeholder: 'Escribe qué quieres que cambie. Por ejemplo: quita la parte donde hablo del clima y deja la segunda toma del saludo.' });
  const pide = h('div', { class: 'pide', hidden: true }, h('label', {}, '¿Qué quieres que cambie?'), cuadro);
  const aprobar = h('button', { type: 'button', class: 'b1' }, 'Aprobar');
  const cambios = h('button', { type: 'button', class: 'b2' }, 'Pedir cambios');
  const cancelar = h('button', { type: 'button', class: 'b3', hidden: true }, 'Cancelar');
  const manda = async (decision, boton) => {
    const texto = cuadro.value.trim();
    if (decision === 'cambios' && !texto) { avisar('Escribe qué quieres que cambie.', true); cuadro.focus(); return; }
    boton.disabled = true;
    try {
      const nuevo = await api(`/api/pedidos/${d.id}/respuesta`, { para: p.para, plantilla: p.plantilla, decision, texto: decision === 'cambios' ? texto : '' });
      avisar(decision === 'aprobado' ? 'Aprobado.' : 'Cambios enviados.'); pintarDetalle(nuevo);
    } catch (e) { avisar(e.message, true); boton.disabled = false; if (e.codigo === 409) tic(); }
  };
  aprobar.addEventListener('click', () => manda('aprobado', aprobar));
  cambios.addEventListener('click', () => {
    if (pide.hidden) { pide.hidden = false; cancelar.hidden = false; aprobar.hidden = true; cambios.textContent = 'Enviar cambios'; cambios.className = 'b1'; cuadro.focus(); }
    else manda('cambios', cambios);
  });
  cancelar.addEventListener('click', () => { pide.hidden = true; cancelar.hidden = true; aprobar.hidden = false; cambios.textContent = 'Pedir cambios'; cambios.className = 'b2'; });
  return h('div', { class: 'aprobar' }, h('h3', {}, `Te toca: revisa ${que}`), extra || null, vistaDoc(p, titulo), pide, h('div', { class: 'botones' }, aprobar, cambios, cancelar));
}

const puntos = d => [d.vista.plan, ...d.vista.trabajos.map(t => t.documento)].filter(Boolean);

function panelClaude(d) {
  const c = d.claude, clave = d.resumen.clave;
  if (c.situacion === 'corriendo') {
    return h('div', { class: 'tarjeta' }, h('div', { class: 'fila entre' },
      h('div', { class: 'fila' }, h('span', { class: 'girando', 'aria-hidden': 'true' }), h('h2', {}, 'Claude está trabajando en este pedido')),
      h('button', { type: 'button', class: 'b2 peligro', onclick: e => accion(e.currentTarget, d.id, 'detener') }, 'Detener')),
      h('p', { class: 'suave' }, 'Esta página se actualiza sola. Puedes cerrarla y volver después; solo deja abierta la ventana de la interfaz.'));
  }
  if (c.situacion === 'en_cola') {
    return h('div', { class: 'tarjeta' }, h('div', { class: 'fila entre' }, h('h2', {}, 'En cola'),
      h('button', { type: 'button', class: 'b2', onclick: e => accion(e.currentTarget, d.id, 'detener') }, 'Quitar de la cola')),
      h('p', { class: 'suave' }, c.ocupado_con ? 'Claude está con otro pedido y se hace uno a la vez. Este empieza en cuanto termine el otro.' : 'Empieza en un momento.'));
  }
  if (clave === 'listo' || clave === 'te_toca') return null;
  const respondio = puntos(d).some(p => p.pendiente && p.respondido);
  let titulo, texto, boton, discreto = false;
  if (c.situacion === 'detenido') { titulo = 'Se detuvo'; texto = (c.motivo || 'Claude dejó de trabajar antes de terminar este paso.') + ' Puedes reintentar o seguir a mano:'; boton = 'Reintentar'; }
  else if (clave === 'sin_empezar') { titulo = E.recien === d.id ? 'Pedido creado. ¿Y ahora?' : '¿Y ahora?'; texto = 'Falta decirle a Claude que empiece. Elige un camino:'; boton = 'Empezar ahora'; }
  else if (clave === 'error') { titulo = 'Claude necesita tu ayuda'; texto = 'Lee su mensaje. Cuando lo tengas resuelto, dile que siga:'; boton = 'Reintentar'; }
  else if (respondio) { titulo = 'Respuesta guardada'; texto = 'Falta avisarle a Claude para que siga:'; boton = 'Que siga ahora'; }
  else { titulo = '¿Claude se detuvo? Así le dices que siga'; texto = 'Este pedido va en marcha desde la ventana de Claude Code. Si esa ventana se cerró o Claude dejó de avanzar:'; boton = 'Que siga aquí'; discreto = true; }
  const carpeta = E.sistema ? E.sistema.carpeta.split('/').pop() : 'este sistema';
  const mano = h('div', { class: 'camino' }, h('h3', {}, 'A mano'),
    h('p', {}, `Abre Claude Code en la carpeta «${carpeta}» y pega esto:`),
    h('div', { class: 'frase' }, h('code', {}, d.frase), botonCopiar(d.frase)),
    d.empezado ? null : h('p', { class: 'suave', style: 'margin-top:10px;font-size:14px' }, 'Después de cada aprobación se pega: ', h('code', {}, `Sigue con el pedido ${d.id}`)));
  const auto = c.disponible ? h('div', { class: 'camino' }, h('h3', {}, 'Automático'),
    h('p', {}, 'Claude trabaja aquí mismo, sin abrir nada más. Se detiene cada vez que necesita tu «sí».'),
    h('button', { type: 'button', class: 'b1', onclick: e => accion(e.currentTarget, d.id, 'lanzar') }, boton),
    c.ocupado_con ? h('p', { class: 'suave', style: 'margin-top:10px;font-size:14px' }, 'Ahora hay otro pedido en marcha: este quedará en cola.') : null) : null;
  const dentro = [h('p', { class: c.situacion === 'detenido' || clave === 'error' ? '' : 'suave' }, texto),
    h('div', { class: 'caminos' + (auto ? '' : ' uno') }, auto, mano),
    auto ? null : h('p', { class: 'suave', style: 'margin:12px 0 0;font-size:14px' }, (c.aviso || 'El modo automático no está disponible en esta computadora.') + ' Por eso aquí solo aparece el camino a mano.')];
  if (discreto) return h('details', { class: 'tarjeta guardado' }, h('summary', {}, titulo), h('div', {}, dentro));
  return h('div', { class: 'tarjeta' }, h('h2', {}, titulo), dentro);
}

const LINEA = { video: ['Preparando', 'Plan', 'Escaleta', 'Fotos', 'Exportando', 'Listo'], plantilla: ['Preparando', 'Ficha', 'Animaciones', 'Fotos', 'Terminando', 'Lista'] };
const LUGAR = { cola: 0, preparando: 0, plan: 1, escaleta: 2, fotos: 3, exportando: 4, revisando: 4, listo: 5 };

function tarjetaTrabajo(d, t) {
  const nombres = LINEA[d.tipo], lugar = LUGAR[t.paso_linea];
  const cabeza = h('div', { class: 'trabajo-cabeza' },
    t.miniatura ? h('img', { src: t.miniatura, alt: '' }) : null,
    h('h2', {}, h('small', {}, d.tipo === 'plantilla' ? 'Plantilla nueva' : 'Plantilla'), t.nombre || t.plantilla || ''));
  const mensaje = t.mensaje && t.mensaje !== d.vista.mensaje ? h('p', { class: 'mensaje' }, t.mensaje) : null;
  if (t.paso === 'no_aplica') return h('div', { class: 'tarjeta' }, cabeza, h('p', { class: 'nota-paso', style: 'margin-top:0' }, t.mensaje || 'Esta plantilla no aplica a este video. Las demás siguen su camino.'));
  if (t.paso === 'error') return h('div', { class: 'tarjeta' }, cabeza, h('p', { class: 'nota-paso mal', style: 'margin-top:0' }, t.mensaje || 'Algo falló con esta plantilla. Revisa el mensaje de Claude.'));
  const linea = h('ol', { class: 'pasos', 'aria-label': 'Avance de esta plantilla' }, nombres.map((n, i) => {
    const hecho = i < lugar || t.paso === 'listo';
    return h('li', { class: hecho ? 'hecho' : (i === lugar ? 'actual' : ''), 'aria-current': !hecho && i === lugar ? 'step' : null }, n, hecho ? h('span', { class: 'oculto' }, ' (hecho)') : null);
  }));
  const ahora = h('p', { class: 'paso-ahora' }, t.paso === 'listo' ? nombres[5] : `Paso ${lugar + 1} de 6: ${nombres[lugar]}`);
  let cuerpo = null;
  if (t.paso === 'cola' && t.paso_linea === 'cola') cuerpo = h('p', { class: 'nota-paso' }, 'En espera: se hace cuando termine la plantilla anterior.');
  else if (t.documento && t.documento.pendiente) cuerpo = aprobacion(d, t.documento);
  else if (t.documento) cuerpo = h('details', { class: 'guardado' }, h('summary', {}, `Ver ${NOMBRE_PUNTO(d, t.documento.para)}`), vistaDoc(t.documento, NOMBRE_PUNTO(d, t.documento.para)));
  else if (t.paso === 'exportando' || t.paso === 'revisando') {
    cuerpo = h('div', { class: 'avance' },
      h('div', { class: 'cifra' }, h('span', {}, t.paso === 'revisando' ? 'Revisando el video final' : (d.tipo === 'plantilla' ? 'Armando la muestra' : 'Exportando el video')), h('span', {}, `${t.avance} %`)),
      h('div', { class: 'medidor alto', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': t.avance, 'aria-label': 'Avance de la exportación' }, h('i', { style: `width:${t.avance}%` })));
  } else if (t.paso === 'listo') {
    const v = t.video;
    cuerpo = h('div', { class: 'final' },
      v && v.existe ? h('video', { src: v.url, controls: true, preload: 'metadata', playsinline: true, 'aria-label': `Video final con la plantilla ${t.nombre}` }) :
        (d.tipo === 'plantilla' ? null : h('p', { class: 'nota-paso' }, 'El video está listo, pero no lo encuentro para enseñártelo aquí. Pregúntale a Claude dónde quedó.')),
      h('div', { class: 'fila' },
        v && v.existe && v.en_salida ? h('button', { type: 'button', class: 'b1', onclick: async e => { const b = e.currentTarget; b.disabled = true; try { await api('/api/abrir', { ruta: v.ruta }); } catch (er) { avisar(er.message, true); } b.disabled = false; } }, 'Mostrar en la carpeta') : null,
        d.tipo === 'plantilla' ? h('a', { class: 'b2', href: '#/plantillas' }, 'Verla en Plantillas') : null,
        v && v.existe ? h('span', { class: 'suave', style: 'font-size:14px' }, v.ruta.split('/').pop()) : null));
  }
  return h('div', { class: 'tarjeta' }, cabeza, linea, ahora, mensaje, cuerpo);
}

function pintarDetalle(d) {
  const cont = $('#videos-detalle');
  if (ruta().id !== d.id) return;
  if (cont.firstElementChild && !cont.firstElementChild.dataset.clave) cont.replaceChildren();
  const f = x => d.id + JSON.stringify(x);
  const B = [];
  B.push({ clave: 'cabeza', firma: f([d.titulo, d.resumen, d.creado, d.plantillas, d.notas]), crear: () => h('div', {},
    h('a', { class: 'volver', href: '#/videos' }, '← Todos mis videos'),
    h('div', { class: 'cabeza' }, h('h1', {}, d.titulo), marcaEstado(d.resumen)),
    h('p', { class: 'cabeza-datos' }, h('span', {}, fecha(d.creado)), h('span', {}, 'Pedido ', h('code', {}, d.id)),
      d.plantillas.length ? h('span', { class: 'etiquetas' }, d.plantillas.map(x => h('span', { class: 'chip' }, x.nombre))) : null),
    d.notas ? h('p', { class: 'cita' }, 'Pediste cuidar: ' + d.notas) : null) });
  const panel = panelClaude(d);
  if (panel) B.push({ clave: 'claude', firma: f([d.claude, d.resumen.clave, d.frase, E.recien === d.id, puntos(d).map(p => !!p.respondido), !!E.sistema]), crear: () => panelClaude(d) });
  if (d.vista.mensaje) B.push({ clave: 'dice', firma: f([d.vista.mensaje, d.vista.paso]), crear: () => h('div', { class: 'tarjeta dice' },
    h('span', { class: 'quien', 'aria-hidden': 'true' }, 'C'), h('div', {}, h('p', { class: 'rotulo' }, 'Claude dice'), h('p', {}, d.vista.mensaje))) });
  const plan = d.vista.plan;
  if (plan) {
    B.push({ clave: 'plan', firma: f([plan, d.vista.corte_video]), crear: () => {
      const que = NOMBRE_PUNTO(d, 'plan');
      const corte = d.vista.corte_video && d.vista.corte_video.existe ? h('video', { src: d.vista.corte_video.url, controls: true, preload: 'metadata', playsinline: true, 'aria-label': 'Tu video ya cortado' }) : null;
      if (plan.pendiente) return h('div', { class: 'tarjeta' }, h('h2', {}, que.charAt(0).toUpperCase() + que.slice(1)),
        d.tipo === 'video' && d.plantillas.length > 1 ? h('p', { class: 'suave' }, 'El corte se hace una sola vez y sirve para todas las plantillas que marcaste.') : null, aprobacion(d, plan, corte));
      return h('details', { class: 'tarjeta guardado' }, h('summary', {}, `Ver ${que}`), vistaDoc(plan, que));
    } });
  }
  for (const t of d.vista.trabajos) B.push({ clave: 't-' + t.plantilla, firma: f([t, d.tipo, d.vista.mensaje === t.mensaje]), crear: () => tarjetaTrabajo(d, t) });
  if (d.respuestas.length) {
    B.push({ clave: 'historial', firma: f(d.respuestas), crear: () => h('details', { class: 'tarjeta guardado' },
      h('summary', {}, `Lo que has respondido (${d.respuestas.length})`),
      h('ul', {}, d.respuestas.map(r => h('li', {}, h('b', {}, r.decision === 'aprobado' ? 'Aprobaste ' : 'Pediste cambios en '), NOMBRE_PUNTO(d, r.para) || '',
        d.tipo === 'video' && r.plantilla ? ` (${(d.vista.trabajos.find(t => t.plantilla === r.plantilla) || {}).nombre || r.plantilla})` : '', r.fecha ? ` · ${fecha(r.fecha)}` : '', r.texto ? h('div', { class: 'suave' }, r.texto) : null)))) });
  }
  parchar(cont, B);
}

let ocupado = false, otraVez = false;
async function tic() {
  if (document.hidden) return;
  if (ocupado) { otraVez = true; return; }      // cambió la vista mientras llegaba la respuesta: se vuelve a pedir al terminar
  ocupado = true;
  const r = ruta();
  try {
    if (r.pestana === 'videos' && r.id) {
      try { pintarDetalle(await api('/api/pedidos/' + r.id)); }
      catch (e) {
        if (e.codigo === 404 && ruta().id === r.id) $('#videos-detalle').replaceChildren(h('a', { class: 'volver', href: '#/videos' }, '← Todos mis videos'), h('div', { class: 'vacio' }, h('p', {}, 'No encontré ese pedido. Puede que se haya borrado.')));
      }
      if (E.cuenta++ % 3 === 0) pintarLista(await api('/api/pedidos'));
    } else pintarLista(await api('/api/pedidos'));
    if (r.pestana === 'plantillas' && E.cuenta++ % 5 === 4) cargarPlantillas();
  } catch (e) { /* el aviso de conexión ya se enseñó */ }
  ocupado = false;
  if (otraVez) { otraVez = false; tic(); }
}

// ───────────────────────── pestaña: Nueva plantilla ─────────────────────────
const zonaRefVideo = crearZona($('#zona-ref-video'), { tipo: 'video', max: 1, chica: true, titulo: 'Suelta aquí el video de referencia', ayuda: 'Solo se usa para estudiarlo en tu computadora.', boton: 'Elegir video', alCambiar: () => refrescarCrear() });
const zonaRefImagenes = crearZona($('#zona-ref-imagenes'), { tipo: 'imagenes', max: 8, chica: true, titulo: 'Suelta aquí tus imágenes', ayuda: 'Hasta 8. Capturas, diseños o fotos del estilo que te gusta.', boton: 'Elegir imágenes', alCambiar: () => refrescarCrear() });
const colores = [];
const COLORES_INICIO = ['#5b3df5', '#f08a24', '#ffffff', '#101014', '#1fa463'];

function pintarColores() {
  pon($('#br-colores'),
    colores.map((c, i) => {
      const hex = h('code', {}, c);
      const sel = h('input', { type: 'color', value: c, 'aria-label': `Color ${i + 1}` });
      sel.addEventListener('input', () => { colores[i] = sel.value; hex.textContent = sel.value; });
      return h('span', { class: 'color' }, sel, hex, h('button', { type: 'button', 'aria-label': `Quitar el color ${i + 1}`, onclick: () => { colores.splice(i, 1); pintarColores(); refrescarCrear(); } }, '×'));
    }),
    colores.length < 5 ? h('button', { type: 'button', class: 'b2', onclick: () => { colores.push(COLORES_INICIO[colores.length]); pintarColores(); refrescarCrear(); $$('#br-colores input').pop().focus(); } }, colores.length ? '+ Otro color' : '+ Agregar color') : null);
}

const elegido = nombre => ($(`input[name="${nombre}"]:checked`) || {}).value || '';

function datosBrief() {
  return { para_que: $('#br-para').value.trim(), colores: [...colores], tipografia: $('#br-tipografia').value.trim(), fondo: $('#br-fondo').value.trim(),
    ritmo: elegido('br-ritmo'), animaciones: $('#br-animaciones').value.trim(), persona: elegido('br-persona'), subtitulos: elegido('br-subs'),
    subtitulos_como: elegido('br-subs') === 'no' ? '' : $('#br-subs-como').value.trim(),
    partes: $('#br-partes').value.split('\n').map(x => x.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean), no_quiero: $('#br-no').value.trim() };
}
const briefLleno = b => !!(b.para_que || b.colores.length || b.tipografia || b.fondo || b.ritmo || b.animaciones || b.persona || b.subtitulos || b.subtitulos_como || b.partes.length || b.no_quiero);

function refrescarCrear() {
  const b = datosBrief(), nv = zonaRefVideo.rutas().length, ni = zonaRefImagenes.rutas().length, lleno = briefLleno(b);
  $('#campo-subs-como').hidden = b.subtitulos === 'no';
  $('#estado-a').textContent = nv ? '✓ 1 video' : '';
  $('#estado-b').textContent = ni ? `✓ ${plural(ni, 'imagen', 'imágenes')}` : '';
  $('#estado-c').textContent = lleno ? '✓ Con descripción' : '';
  $('#avisos-crear').replaceChildren(...avisosDeSistema().slice(0, 1));
  const con = [nv && 'un video', ni && plural(ni, 'imagen', 'imágenes'), lleno && 'tu descripción'].filter(Boolean);
  let falta = '';
  if (zonaRefVideo.ocupada() || zonaRefImagenes.ocupada()) falta = 'Espera a que terminen de copiarse los archivos.';
  else if (!$('#pl-nombre').value.trim()) falta = 'Falta el nombre de tu plantilla.';
  else if (!con.length) falta = 'Falta abrir una puerta: sube un video, sube imágenes o descríbela tú.';
  $('#resumen-crear').textContent = falta || `Todo listo: la plantilla saldrá de ${con.join(' + ')}.`;
  $('#crear-plantilla').disabled = !!falta;
}
$('#v-crear').addEventListener('input', refrescarCrear);
$('#v-crear').addEventListener('change', refrescarCrear);

$('#crear-plantilla').addEventListener('click', async e => {
  const b = e.currentTarget; b.disabled = true;
  try {
    const brief = datosBrief();
    const d = await api('/api/pedidos', { tipo: 'plantilla', nombre: $('#pl-nombre').value.trim(), archivos: [...zonaRefVideo.rutas(), ...zonaRefImagenes.rutas()], brief: briefLleno(brief) ? brief : null });
    zonaRefVideo.vaciar(); zonaRefImagenes.vaciar(); colores.length = 0; pintarColores();
    $$('#v-crear input[type="text"], #v-crear textarea').forEach(x => { x.value = ''; });
    $$('#v-crear input[type="radio"][value=""]').forEach(x => { x.checked = true; });
    $$('#v-crear details').forEach(x => { x.open = false; });
    E.recien = d.id; location.hash = '#/videos/' + d.id;
  } catch (err) { avisar(err.message, true); }
  refrescarCrear();
});

// ───────────────────────── arranque ─────────────────────────
window.addEventListener('beforeunload', e => {
  if (zonaVideo.ocupada() || zonaRefVideo.ocupada() || zonaRefImagenes.ocupada()) { e.preventDefault(); e.returnValue = ''; }
});
window.addEventListener('hashchange', navegar);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tic(); });
pintarColores(); refrescarCrear(); pintarCasillas();
navegar();
cargarSistema();
setInterval(tic, 4000);
if (ruta().pestana !== 'videos') tic();
