// Núcleo del motor de videos largos. TODO es función del tiempo absoluto t (nada acumulado):
// así cualquier cuadro o cualquier rango se puede volver a renderizar y sale idéntico.
// Un ESTILO (estilos/<nombre>/estilo.js) aporta: fondo, piezas, subtítulos y capa de encima.
// Un PROYECTO (proyectos/<nombre>/beats.js) dice qué pieza va en cada momento y cómo se ve la persona.

export const W = 1920, H = 1080;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, a, d) => (d <= 0 ? (t >= a ? 1 : 0) : clamp((t - a) / d));   // 0→1 desde a durante d segundos
export const eIn = p => p * p * p;
export const eOut = p => 1 - Math.pow(1 - p, 3);
export const eInOut = p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const eExpo = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const eBack = p => { const c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
export const eElastico = p => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * (2 * Math.PI / 3)) + 1);
// número fijo 0..1 a partir de una semilla (para "azar" que no cambia entre renders)
export const azar = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// entra en `e` segundos, se sostiene y sale en `s` segundos: devuelve 0→1→0 (tl = tiempo local, dur = duración del beat)
export const entraSale = (tl, dur, e = .4, s = .3) => Math.min(prog(tl, 0, e), 1 - prog(tl, dur - s, s));
// crea un elemento: h('div', 'clase', 'html', padre)
export const h = (tag, cls = '', html = '', padre = null) => {
  const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (padre) padre.appendChild(e); return e;
};
export const px = n => `${n}px`;
// cuenta de un número a otro con formato: contar(p, 0, 10000, n => '$' + n.toLocaleString('en-US'))
export const contar = (p, de, a, fmt = n => String(n)) => fmt(Math.floor(lerp(de, a, clamp(p)) + 1e-6));
// texto que se escribe letra por letra
export const teclear = (txt, p) => txt.slice(0, Math.floor(txt.length * clamp(p) + 1e-6));

export const M = { datos: null, estilo: null, beats: [], extras: [], el: {}, t: 0, esperas: [] };
// imagen que cambia con el tiempo (cuadros de una grabación de pantalla, etc.): pone el src y devuelve la promesa de carga
export const ponImagen = (img, src) => { if (img.dataset.src === src) return null; img.dataset.src = src; img.src = src; return img.decode().catch(() => {}); };

// ---- encuadre de la persona: cada beat dice cómo se ve el video ----
// video: 'completo' | 'oculto' | { x, y, w, h, r }  (ventana)  + zoom (número o [de, a]) + foco [fx, fy] (0..1 del cuadro fuente)
const rectDe = (b, tl, dur) => {
  const e = M.estilo, v = b.video ?? e.video?.porDefecto ?? 'completo';
  const base = typeof v === 'string' ? (v === 'oculto' ? { oculto: true } : (e.video?.[v] ?? {})) : v;
  const z = base.zoom ?? b.zoom ?? 1, zoom = Array.isArray(z) ? lerp(z[0], z[1], dur > 0 ? clamp(tl / dur) : 1) : z;
  const foco = base.foco ?? b.foco ?? M.datos.proyecto.foco ?? [.5, .38];
  return { x: base.x ?? 0, y: base.y ?? 0, w: base.w ?? W, h: base.h ?? H, r: base.r ?? 0, op: base.oculto ? 0 : (base.op ?? 1),
    zoom, fx: foco[0], fy: foco[1], clase: base.clase ?? '' };
};
const mezcla = (A, B, p) => { const o = {}; for (const k of ['x', 'y', 'w', 'h', 'r', 'op', 'zoom', 'fx', 'fy']) o[k] = lerp(A[k], B[k], p); o.clase = p < .5 ? A.clase : B.clase; return o; };

function pintaVideo(t) {
  const { vid, img } = M.el, bs = M.beats; if (!bs.length) return null;
  let i = bs.findIndex(b => t >= b.a && t < b.b); if (i < 0) i = t < bs[0].a ? 0 : bs.length - 1;
  const b = bs[i], ant = bs[i - 1], tr = b.tr ?? M.estilo.tr ?? .4, corte = b.corte || !ant || tr <= 0;
  let R = rectDe(b, t - b.a, b.b - b.a);
  if (!corte && t - b.a < tr) {
    const A = rectDe(ant, ant.b - ant.a, ant.b - ant.a);
    // si uno de los dos está oculto, no viaja: solo se desvanece en el sitio del visible
    if (A.op === 0) Object.assign(A, R, { op: 0 }); else if (R.op === 0) R = { ...A, op: 0 };
    R = mezcla(A, R, (M.estilo.curvaVideo ?? eInOut)(prog(t, b.a, tr)));
  }
  const caja = `left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;border-radius:${R.r}px;opacity:${R.op};`;
  vid.style.cssText = caja + (b.videoEncima ? 'z-index:5;' : '');   // videoEncima: la ventana de la persona queda sobre las piezas
  vid.className = 'vid ' + R.clase;
  // la imagen cubre la ventana (como object-fit: cover) con zoom, y el foco (la cara) queda lo más centrado posible
  const fw = M.datos.anchoFuente || W, fh = M.datos.altoFuente || H, k = Math.max(R.w / fw, R.h / fh) * R.zoom, iw = fw * k, ih = fh * k;
  const ix = clamp(R.w / 2 - R.fx * iw, R.w - iw, 0), iy = clamp(R.h / 2 - R.fy * ih, R.h - ih, 0);
  const pos = `left:${ix}px;top:${iy}px;width:${iw}px;height:${ih}px;`;
  img.style.cssText = pos;
  M.rect = R; M.beat = b; M.iBeat = i;
  // "frente": la persona recortada (máscara) encima de las piezas que llevan detras:true, para que el texto pase por detrás
  const { frente, img2 } = M.el, hayDetras = (M.datos.mascaras || !M.datos.nCuadros) && R.op > .001 &&
    [...M.beats, ...M.extras].some(x => x.pieza && x.detras && t >= x.a - (x.antes ?? 0) && t < x.b + (x.despues ?? 0));
  frente.style.cssText = caja + (hayDetras ? '' : 'display:none;');
  if (!M.datos.nCuadros) img2.style.cssText = pos;   // silueta de muestra (sin video): también pasa por delante del texto
  if (R.op <= 0.001 || !M.datos.nCuadros) return null;
  const n = clamp(Math.floor((t + (M.datos.proyecto.desfase || 0)) * M.datos.fpsFuente + 1e-6) + 1, 1, M.datos.nCuadros);
  const num = String(n).padStart(6, '0'), src = `/cuadros/${num}.jpg`, esperas = [];
  if (img.dataset.src !== src) { img.dataset.src = src; img.src = src; esperas.push(img.decode().catch(() => {})); }
  if (hayDetras) {
    const m = `/mascaras/${num}.png`;
    img2.style.cssText = pos + `-webkit-mask-image:url(${m});mask-image:url(${m});-webkit-mask-size:100% 100%;mask-size:100% 100%;`;
    if (img2.dataset.src !== src) { img2.dataset.src = src; img2.src = src; esperas.push(img2.decode().catch(() => {})); const pre = new Image(); pre.src = m; esperas.push(pre.decode().catch(() => {})); }
  }
  return esperas.length ? Promise.all(esperas) : null;
}

// ---- piezas: cada beat (y cada extra) puede traer una pieza del estilo ----
function pintaPiezas(lista, t, capa) {
  for (const b of lista) {
    if (!b.pieza) continue;
    const def = M.estilo.piezas?.[b.pieza];
    if (!def) { if (!b._aviso) { console.warn(`pieza desconocida: ${b.pieza}`); b._aviso = 1; } continue; }
    const antes = b.antes ?? def.antes ?? 0, despues = b.despues ?? def.despues ?? 0, visible = t >= b.a - antes && t < b.b + despues;
    if (!visible) { if (b._el) b._el.style.display = 'none'; continue; }
    if (!b._el) { b._el = h('div', `pieza p-${b.pieza}`, '', b.detras ? M.el.detras : capa); b._el.style.zIndex = b.z ?? def.z ?? 1; def.crea?.(b._el, b, M); }
    b._el.style.display = '';
    const r = def.pinta?.(b._el, t - b.a, b, M, b.b - b.a);
    if (r?.then) M.esperas.push(r);   // una pieza que carga imágenes por cuadro (p. ej. grabación de pantalla) devuelve su promesa
  }
}

// ---- subtítulos: páginas de pocas palabras a partir de palabras.json (o proyecto/subs.json) ----
export function paginar(palabras, { max = 4, chars = 24, pausa = .45 } = {}) {
  const pags = []; let p = null;
  for (const w of palabras) {
    const txt = w.t ?? w.word ?? w.txt, a = w.s ?? w.start ?? w.a, b = w.e ?? w.end ?? w.b;
    const largo = p ? p.palabras.reduce((n, x) => n + x.txt.length + 1, 0) : 0;
    if (!p || p.palabras.length >= max || largo + txt.length > chars || a - p.palabras.at(-1).b > pausa || /[.?!]$/.test(p.palabras.at(-1).txt)) { p = { a, palabras: [] }; pags.push(p); }
    p.palabras.push({ txt: txt.trim(), a, b });
  }
  pags.forEach((p, i) => { const ult = p.palabras.at(-1).b, sig = pags[i + 1]?.a ?? ult + .5; p.b = sig - ult > .8 ? ult + .35 : sig; });
  return pags;
}

export async function init(datos) {
  M.datos = datos;
  const cache = `?v=${Date.now()}`;
  M.estilo = (await import('/estilo/estilo.js' + cache)).default;
  const mod = (await import('/proyecto/beats.js' + cache)).default, def = typeof mod === 'function' ? mod(M) : mod;
  const beats = (Array.isArray(def) ? def : def.beats).map(b => ({ ...b })).sort((x, y) => x.a - y.a);
  beats.forEach((b, i) => { b.b ??= beats[i + 1]?.a ?? datos.dur; });
  M.beats = beats; M.extras = (Array.isArray(def) ? [] : def.extras ?? []).map(b => ({ ...b }));
  const esc = document.getElementById('escena');
  for (const c of ['fondo', 'vid', 'detras', 'frente', 'piezas', 'subs', 'encima']) M.el[c] = h('div', c === 'vid' ? 'vid' : c === 'frente' ? 'vid frente' : 'capa ' + c, '', esc);
  M.el.img = h('img', '', '', M.el.vid); M.el.img2 = h('img', '', '', M.el.frente);
  if (!datos.nCuadros) M.el.vid.innerHTML = '<div class="sinvideo"><svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice"><rect width="1920" height="1080" fill="#cdb48f"/><ellipse cx="960" cy="400" rx="150" ry="185" fill="#6b5a48"/><path d="M560 1080c20-300 190-420 400-420s380 120 400 420z" fill="#2a2622"/><text x="960" y="1010" font-family="sans-serif" font-size="44" fill="#fff" text-anchor="middle" opacity=".75">AQUÍ VA TU VIDEO</text></svg></div>';
  if (!datos.nCuadros) { M.el.img = M.el.vid.firstChild;
    M.el.frente.innerHTML = '<div class="sinvideo"><svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice"><ellipse cx="960" cy="400" rx="150" ry="185" fill="#6b5a48"/><path d="M560 1080c20-300 190-420 400-420s380 120 400 420z" fill="#2a2622"/></svg></div>';
    M.el.img2 = M.el.frente.firstChild; }
  M.estilo.fondo?.crea?.(M.el.fondo, M); M.estilo.encima?.crea?.(M.el.encima, M); M.estilo.subs?.crea?.(M.el.subs, M);
  M.paginas = datos.subs ?? (M.estilo.subs && datos.palabras?.length ? paginar(datos.palabras, M.estilo.subs.paginas ?? {}) : []);
  await document.fonts.ready;
  // efectos de sonido: cada beat puede traer sfx: [[nombre, segundosDesdeSuInicio, volumen]]; si no, usa el de su pieza (def.sfx)
  const sfx = [];
  for (const b of [...beats, ...M.extras]) for (const [n, dt = 0, v] of (b.sfx ?? M.estilo.piezas?.[b.pieza]?.sfx ?? [])) sfx.push([n, Math.max(0, b.a + dt), v ?? .35]);
  return { dur: datos.dur, estilo: M.estilo.nombre, sfx, beats: beats.map(b => ({ a: b.a, b: b.b, pieza: b.pieza ?? null })) };
}

export async function pinta(t) {
  M.t = t; M.esperas = [];
  const espera = pintaVideo(t);
  M.estilo.fondo?.pinta?.(M.el.fondo, t, M);
  pintaPiezas(M.beats, t, M.el.piezas); pintaPiezas(M.extras, t, M.el.piezas);
  if (M.estilo.subs) {
    const quita = M.beat?.subs === false || (M.beat?.pieza && (M.estilo.piezas[M.beat.pieza]?.sinSubs ?? false) && M.beat.subs !== true);
    const pag = quita ? null : M.paginas.find(p => t >= p.a && t < p.b);
    M.el.subs.style.display = pag ? '' : 'none';
    if (pag) M.estilo.subs.pinta(M.el.subs, pag, t, M);
  }
  M.estilo.encima?.pinta?.(M.el.encima, t, M);
  if (espera) M.esperas.push(espera);
  if (M.esperas.length) await Promise.all(M.esperas);
}
window.init = init; window.pinta = pinta; window.M = M;
