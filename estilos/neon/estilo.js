// Estilo «neón»: fondo casi negro con luz naranja a la izquierda y azul a la derecha que respiran en ciclo,
// piezas de cristal violeta con borde oro↔violeta que «nacen de una línea», textos que se escriben letra por letra
// y cifras que cuentan. La guía de uso (qué pieza va con qué frase y qué datos lleva cada beat) está en ESTILO.md.
// REGLA: todo depende solo del segundo `t` / `tl`. Nada de Math.random, Date.now, animaciones de CSS ni temporizadores.
import { W, H, clamp, lerp, prog, eIn, eOut, eInOut, eBack, azar, h, ponImagen } from '/motor/nucleo.js';

// ───────────────────────── ayudas comunes ─────────────────────────
const C = 1 / 30;                                             // un cuadro a 30 fps (los tiempos del desglose vienen en cuadros)
const suave = p => p * p * (3 - 2 * p);                       // lenta-rápida-lenta
const ruta = s => (!s ? '' : /^(\/|https?:|data:)/.test(s) ? s : '/proyecto/' + s);   // 'img/a.png' → '/proyecto/img/a.png'
const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixRGB = (a, b, p) => { p = clamp(p); return `rgb(${Math.round(lerp(a[0], b[0], p))},${Math.round(lerp(a[1], b[1], p))},${Math.round(lerp(a[2], b[2], p))})`; };
// color que pasa por varias paradas: tramo([[0,'#aa'],[.5,'#bb'],[1,'#cc']], p)
const tramoA = (paradas, p) => { p = clamp(p); for (let i = 1; i < paradas.length; i++) if (p <= paradas[i][0]) { const [a, ca] = paradas[i - 1], [b, cb] = paradas[i], A = hex(ca), B = hex(cb), q = (p - a) / (b - a || 1); return [0, 1, 2].map(j => lerp(A[j], B[j], q)); } return hex(paradas.at(-1)[1]); };
const tramo = (paradas, p) => mixRGB(tramoA(paradas, p), [0, 0, 0], 0);
const dinero = (n, b = {}) => (b.prefijo ?? '$') + Math.floor(n + 1e-6).toLocaleString('en-US') + (b.sufijo ?? '');
// segundos que tarda en escribirse un texto de n letras (medido: ≈2 cuadros por letra en textos cortos, ≈0.55 en frases largas)
const durEscribir = n => Math.max(.2, Math.min(n * 2 * C, .6 + n * .008));

// Imagen fija de una pieza. Apunta su carga en la pieza para que el motor espere antes de tomar la foto del cuadro.
function foto(pieza, padre, src, cls = '') {
  const im = h('img', cls, '', padre); im.src = ruta(src);
  (pieza._pend ??= []).push(new Promise(r => { if (im.complete) r(); else { im.onload = r; im.onerror = r; } }).then(() => im.decode().catch(() => {})));
  return im;
}
// Envoltura de toda pieza: devuelve al motor las cargas pendientes (imágenes) junto con lo que devuelva su pinta.
const pieza = def => ({ ...def, pinta(el, tl, b, M, dur) {
  const r = def.pinta(el, tl, b, M, dur);
  if (el._pend?.length) { const p = Promise.all(el._pend); el._pend = []; return r?.then ? Promise.all([r, p]) : p; }
  return r;
} });

// Texto que se escribe letra por letra. `*así*` marca un tramo en negrita cursiva (nombres, marcas).
function letras(el, txt) {
  el.textContent = ''; const L = []; let marca = false;
  for (const ch of String(txt ?? '')) { if (ch === '*') { marca = !marca; continue; } const s = h('span', 'l' + (marca ? ' marca' : ''), '', el); s.textContent = ch; L.push(s); }
  el._L = L; return L;
}
// p 0→1. Las últimas letras entran separadas, a media opacidad y algo borrosas («escritura con arrastre»).
function escribe(el, p, { cola = 3, giro = 0 } = {}) {
  const L = el._L, n = L.length, pos = clamp(p) * (n + cola);
  for (let i = 0; i < n; i++) {
    const q = clamp((pos - i) / cola), s = L[i].style;
    if (q <= 0) { s.opacity = 0; continue; }
    if (q >= 1) { s.opacity = 1; s.transform = ''; s.filter = ''; continue; }
    s.opacity = lerp(.3, 1, q); s.transform = `translate(${(1 - q) * .42}em,${(1 - q) * giro * .02}em) rotate(${(1 - q) * giro}deg)`; s.filter = `blur(${((1 - q) * 3).toFixed(2)}px)`;
  }
}
// «Nacer de línea»: raya vertical fina → pastilla casi cuadrada → se abre a su ancho final con frenado. p 0→1 (≈22 cuadros).
function nacer(p, anchoFinal, altoFinal) {
  p = clamp(p); const a = eOut(prog(p, 0, .27)), b = suave(prog(p, .27, .23)), c = eOut(prog(p, .5, .5));
  const alto = altoFinal * (c > 0 ? lerp(1.3, 1, c) : b > 0 ? lerp(1.1, 1.3, b) : lerp(.42, 1.1, a));
  const ancho = c > 0 ? lerp(alto, anchoFinal, c) : lerp(3, alto, b);
  return { ancho, alto, abre: c, linea: 1 - b };
}
// Flecha blanca con volumen (el cursor que llega y hace clic)
const CURSOR = `<svg viewBox="-12 -12 124 130" width="100%" height="100%"><defs><linearGradient id="ncur" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eceae6"/><stop offset="1" stop-color="#b9b6b2"/></linearGradient></defs>
<path d="M6 8 L98 44 L50 56 L44 108 Z" fill="#8f8c89" stroke="#8f8c89" stroke-width="7" stroke-linejoin="round"/><path d="M0 0 L92 36 L44 48 L38 100 Z" fill="url(#ncur)" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></svg>`;

// ───────────────────────── fondo ─────────────────────────
// Dos luces que suben y bajan juntas en ciclo de 4.5 s: reposo arriba 1.2 s · viaje 0.9 s · reposo abajo 1.3 s · viaje 1.1 s.
// En los reposos siguen respirando (nunca hay un fondo quieto). k = brillo (los cortes «saturados» lo suben 2–3×).
const CICLO = 4.5;
function luces(t) {
  const u = ((t % CICLO) + CICLO) % CICLO; let s = 0, viaje = 0;
  if (u < 1.2) s = 0; else if (u < 2.1) { const p = (u - 1.2) / .9; s = suave(p); viaje = Math.sin(Math.PI * p); }
  else if (u < 3.4) s = 1; else { const p = (u - 3.4) / 1.1; s = 1 - suave(p); viaje = Math.sin(Math.PI * p); }
  return { s: s + .03 * Math.sin(t * 2.3), viaje, resp: Math.sin(t * 1.9) };
}
export function fondoCSS(t, k = 1) {
  const { s, viaje, resp } = luces(t), c = (r, g, b, a) => `rgba(${Math.min(255, r) | 0},${Math.min(255, g) | 0},${Math.min(255, b) | 0},${a.toFixed(3)})`;
  const kn = k * (1 + .4 * viaje + .07 * resp), ka = k * (1 + .07 * Math.sin(t * 1.4 + 1));
  const nx = lerp(33, -3, s), ny = lerp(-10, 108, s), nrx = lerp(1150, 1150, s), nry = lerp(430, 800, s), na = clamp(lerp(.72, 1, s));
  const ax = lerp(102, 104, s), ay = lerp(-5, 75, s), arx = lerp(1000, 1300, s), ary = lerp(800, 1300, s), ab = lerp(122, 96, s), amb = clamp(1 - s), abj = clamp(s);
  const rosa = k > 1 ? `radial-gradient(900px 600px at 50% 50%, ${c(120, 40, 90, clamp((k - 1) * .22))}, transparent),` : '';
  return rosa + [
    `radial-gradient(230px 230px at 190px 200px, ${c(0, 0, 0, .6 * clamp(1 - s * 1.5))}, transparent)`,          // hueco oscuro junto a la luz naranja (arriba)
    `radial-gradient(280px 260px at 1650px 1000px, ${c(0, 0, 0, .85 * clamp(s * 1.5 - .5))}, transparent)`,     // hueco oscuro junto a la luz azul (abajo)
    `radial-gradient(${nrx}px ${nry}px at ${nx}% ${ny}%, ${c(106 * kn, 59 * kn, 2 * kn, na)} 0%, ${c(106 * kn, 59 * kn, 2 * kn, na * .5)} 36%, transparent 100%)`,
    `radial-gradient(${arx}px ${ary}px at ${ax}% ${ay}%, ${c(4 * ka, 0, ab * ka, 1)} 0%, ${c(4 * ka, 0, ab * ka, .5)} 57%, transparent 100%)`,
    `linear-gradient(90deg, ${c(38 * k, 21 * k, 4 * k, amb)} 0%, ${c(36 * k, 20 * k, 8 * k, amb)} 21%, ${c(34 * k, 17 * k, 13 * k, amb)} 36%, ${c(27 * k, 14 * k, 17 * k, amb)} 50%, ${c(12 * k, 6 * k, 16 * k, amb)} 65%, ${c(5 * k, 1, 8 * k, amb)} 78%, transparent 100%)`,   // bruma cálida (luces arriba)
    `linear-gradient(90deg, transparent 14%, ${c(9 * k, 4 * k, 10 * k, abj)} 36%, ${c(12 * k, 5 * k, 24 * k, abj)} 50%, ${c(10 * k, 4 * k, 33 * k, abj)} 65%, ${c(7 * k, 2 * k, 45 * k, abj)} 100%)`,   // bruma violeta (luces abajo)
    '#020003'].join(',');
}
// brillo extra del fondo durante los 3 primeros cuadros de un beat con `saturar: true`
const saturado = (t, M) => { let k = 1; for (const b of M.beats) if (b.saturar && t >= b.a - 1e-4 && t < b.a + .12) k = Math.max(k, lerp(2.7, 1.3, prog(t, b.a, .12))); return k; };
const fondo = {
  crea(el) {
    // filtros para separar los canales rojo/verde/azul (orillas de las tomas de apoyo)
    const canal = (id, m) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${m}"/></filter>`;
    document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute">${canal('n-solo-r', '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0')}${canal('n-solo-g', '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0')}${canal('n-solo-b', '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0')}</svg>`);
    // precarga de las tipografías: así ya están cuando aparece la primera pieza
    for (const f of ['400 20px "Inter Tight"', '600 20px "Inter Tight"', '700 20px "Inter Tight"', 'italic 700 20px "Inter Tight"', '400 20px "Anton"']) document.fonts.load(f, 'Añ$0');
  },
  pinta(el, t, M) { el.style.background = fondoCSS(t, saturado(t, M)); },
};

// Anillos de neón (arcos concéntricos que crecen, giran y se alejan como túnel). Los usan `logo` y `tarjeta`.
function creaAnillos(padre) {
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1920 1080'); svg.setAttribute('class', 'n-anillos'); padre.appendChild(svg);
  const g = document.createElementNS(NS, 'g'); svg.appendChild(g); svg.g = g; svg.arcos = [];
  // [radio, grosor, color, giro inicial, velocidad de giro °/s, retraso]
  const A = [[200, 4, '#a76ff9', 150, 34, 0], [206, 4, '#ddca0c', -30, 34, 0], [150, 3, '#fde6a0', 200, -50, .06], [60, 16, '#12061f', 0, 0, 0],
    [740, 28, '#ddca0c', 95, 16, .08], [766, 6, '#a76ff9', 80, 16, .08], [1500, 34, '#a76ff9', -60, -9, .16], [1530, 8, '#ddca0c', -75, -9, .16], [2700, 50, '#ddca0c', 20, 6, .2]];
  for (const [r, w, col, g0, vel, ret] of A) {
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', r); c.setAttribute('fill', 'none'); c.setAttribute('stroke', col); c.setAttribute('stroke-width', w); c.setAttribute('stroke-linecap', 'round');
    g.appendChild(c); svg.arcos.push({ c, r, g0, vel, ret, medio: r === 200 || r === 206 });
  }
  return svg;
}
// tl = segundos desde que nacen · cx, cy = centro · esc = escala (menos de 1 = cámara lejos, se ve el túnel)
function pintaAnillos(svg, tl, { cx = 1018, cy = 511, esc = 1, op = 1 } = {}) {
  svg.style.opacity = op; svg.g.setAttribute('transform', `translate(${cx} ${cy}) scale(${esc})`);
  for (const a of svg.arcos) {
    const circ = 2 * Math.PI * a.r, p = eOut(prog(tl, a.ret, .5)), grados = (a.r === 60 ? 360 : a.medio ? 170 : 300) * p;
    a.c.setAttribute('stroke-dasharray', `${(circ * grados / 360).toFixed(1)} ${circ.toFixed(1)}`);
    a.c.setAttribute('transform', `rotate(${(a.g0 + a.vel * tl).toFixed(2)})`); a.c.style.opacity = p;
  }
}

// velo blanco del destello: 1 cuadro blanco puro y después baja de 85 % a 0 en ≈13 cuadros con frenado
const velo = tl => (tl < 0 ? 0 : tl < C - 1e-3 ? 1 : .85 * (1 - eOut(prog(tl, C, 13 * C))));

const piezas = {};

// ───────────────────────── 1 · buscador: barra de búsqueda que se escribe ─────────────────────────
// beat: { pieza:'buscador', texto:'¿Cómo vender *cursos* por *internet*?', clic: 2.3 (segundo del clic; false = sin cursor), ancho, x, y }
piezas.buscador = pieza({
  sinSubs: true, sfx: [['whoosh_grave', -.05, .3]],
  crea(el, b) {
    el.halo = h('div', 'n-halo', '', el);
    el.caja = h('div', 'n-cristal n-busca', '<i class="n-borde"></i><i class="n-relleno"></i>', el);
    el.txt = h('div', 'n-busca-txt', '', el.caja); letras(el.txt, b.texto ?? '');
    const w = el.txt.scrollWidth, max = 1560 - 44; el.fs = 44 * Math.min(1, max / w);
    el.an = b.ancho ?? clamp(w * (el.fs / 44) + 30, 520, 1560);
    el.cur = h('div', 'n-cursor', CURSOR, el);
  },
  pinta(el, tl, b, M, dur) {
    const cx = b.x ?? 955, cy = b.y ?? 498, T = 22 * C, n = nacer(tl / T, el.an, 156);
    const tClic = b.clic === false ? null : (b.clic ?? (dur >= 2.2 ? Math.min(2.3, dur - .37) : null));
    const cl = tClic == null ? 0 : eOut(prog(tl, tClic, 6 * C)), esc = (1 + .025 * prog(tl, T, Math.max(.1, dur - T))) * (1 - .1 * cl);
    el.caja.style.cssText = `left:${cx}px;top:${cy}px;width:${n.ancho}px;height:${n.alto}px;border-radius:${Math.min(38, n.ancho / 2)}px;` +
      `transform:translate(-50%,-50%) scale(${esc});--ang:${(200 + tl * 55).toFixed(1)}deg;filter:brightness(${1 + .22 * cl});`;
    // el texto está anclado a su sitio final: la barra lo va destapando al abrirse
    el.txt.style.cssText = `left:calc(50% - ${el.an / 2 - 14}px);font-size:${el.fs}px;`;
    const nL = el.txt._L.length, t0 = T * .7;
    escribe(el.txt, prog(tl, t0, durEscribir(nL)), { cola: nL > 20 ? 5 : 3, giro: 4 });
    el.halo.style.cssText = `left:${cx}px;top:${cy - 26}px;width:${el.an + 760}px;height:860px;opacity:${n.abre * (.88 + .12 * Math.sin(tl * 2.6))};transform:translate(-50%,-50%) scale(${.6 + .4 * n.abre});`;
    if (tClic == null) { el.cur.style.display = 'none'; return; }
    // el cursor entra por la esquina inferior derecha girando y llega bajo el final de la barra
    const p = eOut(prog(tl, tClic - .83, 18 * C)), fx = cx + el.an / 2 - 62, fy = cy + 167;
    const x = lerp(W + 60, fx, p) + 5 * Math.sin(tl * 2.1) * p, y = lerp(H + 80, fy, p) + 4 * Math.cos(tl * 1.7) * p;
    el.cur.style.cssText = `display:${tl < tClic - .83 ? 'none' : ''};left:${x}px;top:${y}px;transform:translate(-8%,-6%) rotateY(${(1 - p) * -300}deg) rotate(${(1 - p) * 40}deg) scale(${(1 - .16 * cl) * (.7 + .3 * p)});`;
  },
});

// ───────────────────────── 2 · grafica: línea con punto viajero y etiquetas de meta ─────────────────────────
// beat: { pieza:'grafica', metas:[{ etiqueta:'Ingresos:', valor:'$5,000', sufijo:'/MES' }, { etiqueta:'Ingresos:', valor:'$10,000', sufijo:'/MES', acento:true }], abre: seg }
// Primero la cámara sigue a la punta de la línea de cerca; en `abre` salta a la vista abierta con todas las metas.
piezas.grafica = pieza({
  sinSubs: true, sfx: [['whoosh_rapido', -.1, .28]],
  crea(el, b) {
    const metas = (b.metas ?? [{ valor: b.valor ?? '$10,000', etiqueta: b.etiqueta, sufijo: b.sufijo }]).slice(0, 4), N = metas.length;
    const P = metas.map((m, i) => (N === 1 ? [700, 540] : N === 2 ? [lerp(560, 815, i), lerp(790, 297, i)] : [lerp(430, 880, i / (N - 1)), lerp(880, 250, i / (N - 1))]));
    // la línea: arranca fuera de cuadro abajo a la izquierda, hace un diente y sube de meta en meta con un diente después de cada una
    const pts = [[P[0][0] - 470, P[0][1] + 400], [P[0][0] - 305, P[0][1] + 245], [P[0][0] - 272, P[0][1] + 292]], iMeta = [];
    P.forEach((p, i) => { pts.push(p); iMeta.push(pts.length - 1); if (i < N - 1) pts.push([p[0] + 62, p[1] + 20]); });
    const acum = [0]; for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    Object.assign(el, { metas, N, P, pts, acum, largo: acum.at(-1), Lm: iMeta.map(i => acum[i]) });
    el.mundo = h('div', 'n-mundo', '', el);
    const d = 'M' + pts.map(p => p.join(' ')).join(' L');
    el.mundo.insertAdjacentHTML('beforeend', `<svg class="n-graf" viewBox="0 0 1920 1080" width="1920" height="1080" style="overflow:visible"><path d="${d}" class="halo"/><path d="${d}" class="linea"/></svg>`);
    el.trazos = [...el.mundo.querySelectorAll('path')];
    el.viajero = h('div', 'n-bola viajera', '', el.mundo);
    el.g = metas.map((m, i) => {
      const [x, y] = P[i], g = { m };
      g.bola = h('div', 'n-bola', '', el.mundo); g.bola.style.left = x + 'px'; g.bola.style.top = y + 'px';
      g.caja = h('div', 'n-meta', '', el.mundo); g.caja.style.left = (x + (i < N - 1 ? 190 : 78)) + 'px'; g.caja.style.top = (y - 11) + 'px';
      g.eti = h('div', 'n-meta-eti', '', g.caja); letras(g.eti, m.etiqueta ?? '');
      g.pas = h('div', 'n-bisel n-meta-pas', '', g.caja); g.num = h('div', 'n-meta-num', '', g.pas); letras(g.num, m.valor ?? '');
      g.suf = h('div', 'n-meta-suf', '', g.caja); letras(g.suf, m.sufijo ?? '');
      g.an = g.num.scrollWidth + 30; g.suf.style.left = (g.an + 22) + 'px';
      return g;
    });
  },
  pinta(el, tl, b, M, dur) {
    const { N, Lm, pts, acum, largo } = el;
    // tiempos base (los del video de referencia) y factor para que quepan en la duración del beat
    const llega0 = i => .9 + .8 * i, enf0 = llega0(N - 1) + 1.3, abre0 = enf0 + .25;
    const k = Math.min(1, ((b.abre ?? dur * .64)) / abre0), llega = i => llega0(i) * k, tEnf = enf0 * k, tAbre = b.abre ?? abre0 * k;
    // largo dibujado de la línea
    let L = 0;
    for (let i = 0; i < N; i++) { const t0 = i ? llega(i - 1) + .12 * k : 0, L0 = i ? Lm[i - 1] : 0; if (tl >= t0) L = lerp(L0, Lm[i], suave(prog(tl, t0, llega(i) - t0))); }
    const punto = s => { s = clamp(s, 0, largo); let i = 1; while (i < acum.length - 1 && acum[i] < s) i++; const q = (s - acum[i - 1]) / (acum[i] - acum[i - 1] || 1); return [lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)]; };
    const [px, py] = punto(L);
    for (const tr of el.trazos) { tr.setAttribute('stroke-dasharray', `${L.toFixed(1)} ${(largo + 50).toFixed(1)}`); }
    // cámara: de cerca siguiendo a la punta → salto a la vista abierta con deriva lenta
    let Z, tx, ty;
    if (tl < tAbre) { Z = 1.52 * (1 + .03 * tl / Math.max(.1, tAbre)); tx = 772 - 14 * tl - Z * px; ty = 452 - Z * py; }
    else { const q = tl - tAbre; Z = 1 + .022 * q; tx = 960 - Z * (960 + 9 * q); ty = 540 - Z * (540 - 6 * q); }
    el.mundo.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${Z.toFixed(4)})`;
    const lat = 1 + .05 * Math.sin(tl * 5.2);
    el.viajero.style.cssText = `left:${px}px;top:${py}px;transform:translate(-50%,-50%) scale(${.62 * lat});opacity:${prog(tl, .05, .15)};`;
    el.g.forEach((g, i) => {
      const t0 = llega(i), q = tl - t0, acento = g.m.acento ?? (i === N - 1 && N > 1), enf = acento ? prog(tl, tEnf, 4 * C) : 0, pico = acento ? Math.max(0, 1 - Math.abs(tl - tEnf - .12) / .25) : 0;
      g.bola.style.transform = `translate(-50%,-50%) scale(${eBack(prog(q, 0, 4 * C)) * lat})`; g.bola.style.opacity = q >= 0 ? 1 : 0;
      const n = nacer(q / (14 * C), g.an, 120);
      g.caja.style.display = q < 0 ? 'none' : '';
      g.pas.style.cssText = `width:${n.ancho}px;height:${n.alto}px;top:${-n.alto / 2}px;--dur:${enf};filter:brightness(${1 + .25 * pico});`;
      const nN = g.num._L.length, tN = durEscribir(nN) * .8;
      escribe(g.num, prog(q, 7 * C, tN));
      // la cifra entra magenta, pasa a blanco y, si es la del acento, termina en amarillo con brillo
      const col = enf > 0 ? mixRGB(hex('#fffcff'), pico > 0 ? hex('#fae446') : hex('#fff3b0'), enf) : tramo([[0, '#b46cf5'], [.35, '#db3cda'], [1, '#fffcff']], prog(q, 7 * C, tN + .35));
      g.num.style.color = col; g.num.style.textShadow = enf > 0 ? `0 0 ${18 + 26 * pico}px rgba(250,228,70,${.55 + .4 * pico})` : '0 0 14px rgba(219,60,218,.35)';
      escribe(g.eti, prog(q, 3 * C, durEscribir(g.eti._L.length)));
      escribe(g.suf, prog(q, 7 * C + tN, durEscribir(g.suf._L.length)));
    });
  },
});

// ───────────────────────── 3 · contador: cifra de dinero gigante que cuenta ─────────────────────────
// beat o extra: { pieza:'contador', de:3000, hasta:200000, prefijo:'$', sufijo:'', color:'verde'|'amarillo'|'blanco'|'#hex', cuenta: seg, tam: 380 }
const TONOS = { verde: ['#2ff959', '#e2fff2'], amarillo: ['#fae446', '#fffbe0'], blanco: ['#fffcff', '#ffffff'], magenta: ['#db3cda', '#ffe6ff'] };
piezas.contador = pieza({
  z: 3, sinSubs: true,
  crea(el, b) {
    el.n = h('div', 'n-conta', '', el); el.n.textContent = dinero(b.hasta ?? 0, b);
    const tam = b.tam ?? 380; el.n.style.fontSize = tam + 'px';
    el.fs = tam * Math.min(1, (b.ancho ?? 1360) / el.n.scrollWidth);
    const [c, filo] = TONOS[b.color] ?? (b.color ? [b.color, '#ffffff'] : TONOS.verde); el.c = hex(c); el.filo = filo;
  },
  pinta(el, tl, b, M, dur) {
    const tc = b.cuenta ?? Math.min(32 * C, dur * .6), p = prog(tl, 2 * C, tc), e = eOut(prog(tl, 0, 10 * C)), sal = eIn(prog(tl, dur - .3, .3));
    el.n.textContent = dinero(lerp(b.de ?? 0, b.hasta ?? 0, p), b);
    const fin = Math.max(0, 1 - Math.abs(tl - (2 * C + tc) - .1) / .22), [r, g, bl] = el.c, lat = .5 + .5 * Math.sin(tl * 4);
    el.n.style.cssText = `font-size:${el.fs}px;left:${b.x ?? 960}px;top:${b.y ?? 517}px;color:rgb(${r},${g},${bl});opacity:${Math.min(1, tl / (3 * C)) * (1 - sal)};` +
      `transform:translate(-50%,-50%) scale(${lerp(.6, 1, e) * (1 + .035 * tl / Math.max(.1, dur)) * (1 + .1 * sal) * (1 + .03 * fin)});` +
      `filter:blur(${(12 * (1 - e) + 14 * sal).toFixed(2)}px) brightness(${1 + .35 * fin});` +
      `text-shadow:-2px -2px 0 ${el.filo}cc, 0 0 ${52 + 16 * lat}px rgba(${r},${g},${bl},.78), 0 0 18px rgba(${r},${g},${bl},.6);`;
  },
});

// ───────────────────────── 4 · tarjeta: tarjeta de datos de cristal (blanca, roja, azul, violeta) ─────────────────────────
// beat: { pieza:'tarjeta', color:'blanca', titulo:'Cursos en línea', datos:[{ etiqueta:'Alumnos', valor:'1,240', cambio:'↑ 36%', nota:'' } ×4],
//         cuenta:{ de:4000, hasta:15000, prefijo:'$', sufijo:'/mes' } (en vez de datos: pastilla con contador), imagen:'img/objeto.svg', anillos:true, giro, x, y }
const TJ = { blanca: { an: 1056, al: 479, x: 934, y: 515, rz: 1.7, ry: 12 }, roja: { an: 960, al: 400, x: 1010, y: 545, rz: 8, ry: 6 },
  azul: { an: 903, al: 374, x: 968, y: 539, rz: 0, ry: 0 }, violeta: { an: 1000, al: 440, x: 960, y: 530, rz: -2, ry: -8 } };
piezas.tarjeta = pieza({
  sinSubs: true, sfx: [['whoosh_grave', -.05, .3]],
  crea(el, b) {
    const col = TJ[b.color] ? b.color : 'blanca', G = { ...TJ[col] }; el.G = G; el.col = col;
    if (b.anillos) el.ani = creaAnillos(el);
    el.esc = h('div', 'n-tj-esc', '', el);
    el.tj = h('div', `n-tj n-tj-${col}`, '', el.esc);
    el.tit = h('div', 'n-tj-tit', '', el.tj); letras(el.tit, b.titulo ?? '');
    if (b.cuenta) { el.pila = h('div', 'n-tj-pila', '', el.tj); el.num = h('div', 'n-tj-num', '', el.pila); }
    else { el.datos = h('div', 'n-tj-datos', '', el.tj);
      el.d = (b.datos ?? []).slice(0, 4).map(d => h('div', 'n-dato', `<span class="e">${d.etiqueta ?? ''}</span><span class="v">${d.valor ?? ''}</span>${d.cambio ? `<span class="c">${d.cambio}</span>` : ''}${d.nota ? `<span class="n">${d.nota}</span>` : ''}`, el.datos)); }
    if (b.imagen) el.obj = foto(el, el.esc, b.imagen, 'n-tj-obj');
  },
  pinta(el, tl, b, M, dur) {
    const G = el.G, an = b.ancho ?? G.an, al = b.alto ?? G.al, x = b.x ?? G.x, y = b.y ?? G.y, rz = b.giro ?? G.rz, azul = el.col === 'azul';
    let w = an, hh = al, extra = '', fil = '';
    if (azul) { const e = eOut(prog(tl, 0, 8 * C)); extra = ` scale(${lerp(4, 1, e) * (1 + .03 * tl / Math.max(.1, dur))})`; fil = `filter:blur(${(20 * (1 - e)).toFixed(1)}px);`; }
    else { const e = eOut(prog(tl, 0, 9 * C)); w = lerp(120, an, e); hh = lerp(250, al, e); extra = ` rotateZ(${(1 - e) * -9}deg) scale(${1 + .03 * tl / Math.max(.1, dur)})`; }
    const ry = G.ry + 3.5 * Math.sin(tl * .9 + 1), fy = 7 * Math.sin(tl * 1.3);
    el.tj.style.cssText = `left:${x}px;top:${y + fy}px;width:${w}px;height:${hh}px;--an:${an}px;transform:translate(-50%,-50%) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${2 * Math.sin(tl * .7)}deg)${extra};${fil}`;
    escribe(el.tit, prog(tl, 5 * C, durEscribir(el.tit._L.length)));
    if (el.d) el.d.forEach((d, i) => { const p = eOut(prog(tl, (12 + 4 * i) * C, 7 * C)); d.style.opacity = p; d.style.transform = `translateY(${(1 - p) * 18}px)`; });
    if (el.num) {
      const c = b.cuenta, tc = c.dur ?? Math.min(37 * C, dur * .6), p = prog(tl, 4 * C, tc), listo = prog(tl, 4 * C + tc, 6 * C);
      el.num.textContent = dinero(lerp(c.de ?? 0, c.hasta ?? 0, p), c);
      el.num.style.color = listo > 0 ? mixRGB(hex('#3ad15a'), hex('#183f15'), listo) : tramo([[0, '#ff5fa8'], [.35, '#ff9a3c'], [.7, '#e7db4d'], [1, '#3ad15a']], p);
      el.num.style.textShadow = `0 0 ${18 * (1 - listo)}px rgba(231,219,77,${.8 * (1 - listo)})`;
      el.pila.style.background = mixRGB(hex('#f1ecb4'), hex('#ffffff'), listo); el.pila.style.transform = `scale(${1 + .04 * Math.max(0, 1 - Math.abs(tl - 4 * C - tc) / .2)})`;
    }
    if (el.obj) { const p = eBack(prog(tl, 9 * C, 10 * C));
      el.obj.style.cssText = `left:${x + an * .5 - 150}px;top:${y - 10 + 8 * Math.sin(tl * 1.6 + 2)}px;width:${b.anchoImagen ?? 430}px;transform:translate(-50%,-50%) rotate(${-14 + 3 * Math.sin(tl * 1.1)}deg) scale(${Math.max(0, p)});`; }
    if (el.ani) { const a = b.anillos === true ? {} : b.anillos; pintaAnillos(el.ani, tl + 1.2, { cx: (a.x ?? 1250) - 22 * tl, cy: (a.y ?? 700) - 12 * tl, esc: (a.escala ?? .62) * (1 + .09 * tl) }); }
  },
});

// ───────────────────────── 5 · capturas: capturas flotando en perspectiva («zoom a través») ─────────────────────────
// beat: { pieza:'capturas', imagenes:['img/principal.png', 'img/lado1.png', …hasta 6], resalta:{ en:0, x:.62, y:.86, w:.3, h:.08 }, marcos:false, entrada: 10 (cuadros) }
// La primera imagen es el panel grande del centro; las demás van a los lados, más atrás. `resalta` marca la cifra en verde (medidas en fracción de esa imagen).
const HUECOS = [[0, 0, 0, 0], [-800, 30, -70, 17], [810, -70, 30, -17], [-640, -335, -300, 10], [700, 365, -240, -10], [-250, 430, -460, 4], [330, -420, -520, -4]];
piezas.capturas = pieza({
  sinSubs: true, sfx: [['whoosh_rapido', -.08, .3]],
  crea(el, b) {
    el.classList.add('n-3d');
    const ims = (b.imagenes ?? (b.imagen ? [b.imagen] : [])).slice(0, HUECOS.length);
    el.c = ims.map((src, i) => { const c = h('div', 'n-cap ' + (i ? 'lado' : 'principal') + (b.marcos ? ' n-marco' : ''), '', el); const im = foto(el, c, src), [mw, mh] = i ? [430, 400] : [1000, 880]; c.style.zIndex = i ? 1 : 2;
      im.addEventListener('load', () => { im.style.width = Math.round(im.naturalWidth * Math.min(mw / im.naturalWidth, mh / im.naturalHeight)) + 'px'; });   // cada captura llena su hueco sin deformarse
      return c; });
    if (b.resalta && el.c[b.resalta.en ?? 0]) { const r = b.resalta; el.res = h('div', 'n-resalta', '', el.c[r.en ?? 0]);
      el.res.style.cssText = `left:${r.x * 100}%;top:${r.y * 100}%;width:${r.w * 100}%;height:${r.h * 100}%;${r.color ? `--c:${r.color};` : ''}`; }
  },
  pinta(el, tl, b, M, dur) {
    const e = eOut(prog(tl, 0, (b.entrada ?? 10) * C)), zCam = lerp(1150, 0, e) - 46 * tl, des = 25 * (1 - e);
    el.c.forEach((c, i) => {
      const [x, y, z, ry] = HUECOS[i], f = azar(i + 3) * 6, prof = 1 + z / 1400;
      c.style.transform = `translate(-50%,-50%) translate3d(${x - 16 * tl * prof}px,${y + 7 * Math.sin(tl * 1.2 + f)}px,${z + zCam}px) rotateY(${ry + 2.5 * Math.sin(tl * .8 + f)}deg)`;
      c.style.filter = des > .3 ? `blur(${(des * (i ? .6 : 1)).toFixed(1)}px)` : '';
    });
    if (el.res) { const p = eOut(prog(tl, (b.entrada ?? 10) * C - .05, 6 * C)); el.res.style.transform = `scaleX(${p})`; el.res.style.opacity = p * (.82 + .18 * Math.sin(tl * 5)); }
  },
});

// Fuente de imagen de una pieza: una imagen fija (`imagen`) o una grabación en cuadros (`pantalla:'nombre'` →
// proyectos/<video>/pantalla/<nombre>/000001.jpg… + datos.json, que saca motor/pantalla.py). `copias` = imágenes extra con el mismo cuadro.
function creaFuente(pz, padre, b, clases = ['']) {
  const F = { ims: clases.map(c => h('img', c, '', padre)), datos: null };
  if (b.pantalla) { F.base = `/proyecto/pantalla/${b.pantalla}`;
    F.lista = fetch(F.base + '/datos.json').then(r => r.json()).then(d => { F.datos = d; }).catch(() => { F.datos = { fps: 30, n: 1 }; console.warn(`falta ${F.base}/datos.json (corre motor/pantalla.py)`); }); }
  else { F.ims.forEach(im => { im.src = ruta(b.imagen); }); (pz._pend ??= []).push(...F.ims.map(im => new Promise(r => { if (im.complete) r(); else { im.onload = r; im.onerror = r; } }).then(() => im.decode().catch(() => {})))); }
  return F;
}
// pone el cuadro que toca en el segundo tl. Campos del beat: desde (segundo de la grabación donde empieza), velocidad, bucle.
function pintaFuente(F, tl, b) {
  if (!F.base) return null;
  const pon = () => { const d = F.datos; let n = Math.floor(((b.desde ?? 0) + Math.max(0, tl) * (b.velocidad ?? 1)) * d.fps + 1e-6) + 1;
    n = b.bucle ? ((n - 1) % d.n) + 1 : clamp(n, 1, d.n);
    const src = `${F.base}/${String(n).padStart(6, '0')}.jpg`, ps = F.ims.map(im => ponImagen(im, src)).filter(Boolean); return ps.length ? Promise.all(ps) : null; };
  return F.datos ? pon() : F.lista.then(pon);
}
// barra de resaltador (amarillo-naranja → magenta) que barre de izquierda a derecha sobre una zona de la pantalla
function creaResaltador(padre, r) { if (!r) return null; const e = h('div', 'n-resaltador', '', padre); e.style.cssText = `left:${r.x * 100}%;top:${r.y * 100}%;width:${r.w * 100}%;height:${r.h * 100}%;mix-blend-mode:${r.modo ?? 'screen'};`; return e; }
function pintaResaltador(e, r, tl, dur) { if (!e) return; const a = r.a ?? dur * .5, f = r.b ?? dur + 1, p = eOut(prog(tl, a, 12 * C)), s = 1 - prog(tl, f, .2);
  e.style.clipPath = `inset(0 ${(100 * (1 - p)).toFixed(2)}% 0 0)`; e.style.opacity = (tl >= a ? .9 + .1 * Math.sin(tl * 6) : 0) * s; }

// ───────────────────────── 6 · pantalla3d: pantalla o captura inclinada en 3D ─────────────────────────
// beat: { video:'ventana', videoEncima:true, pieza:'pantalla3d', imagen:'img/pantalla.png' (o pantalla:'nombre'), acerca: seg, zoom:1.9, foco:[.45,.3],
//         resalta:{ x, y, w, h, a: seg, b: seg } }
piezas.pantalla3d = pieza({
  sinSubs: true, sfx: [['whoosh_grave', -.05, .3]],
  crea(el, b) {
    el.classList.add('n-3d');
    el.plano = h('div', 'n-p3d', '', el); el.F = creaFuente(el, el.plano, b, ['', 'bloom']);
    h('div', 'n-p3d-luz', '', el.plano); el.res = creaResaltador(el.plano, b.resalta);
  },
  pinta(el, tl, b, M, dur) {
    const [fx, fy] = b.foco ?? [.45, .3], q = suave(prog(tl, b.acerca ?? dur * .3, 24 * C)), u = tl / Math.max(.1, dur), e = eOut(prog(tl, 0, 12 * C));
    const Z = lerp(.86, b.zoom ?? 1.9, q) * (1 + .05 * u) * lerp(1.5, 1, e);
    const tx = (W / 2 - fx * W) * q * .9 + 30 * (1 - q), ty = (H / 2 - fy * H) * q * .9 + 14 * (1 - q);
    el.plano.style.cssText = `transform-origin:${fx * 100}% ${fy * 100}%;filter:blur(${(14 * (1 - e)).toFixed(1)}px);` +
      `transform:translate3d(${tx}px,${ty}px,0) scale(${Z}) rotateZ(-2deg) rotateX(${lerp(9, 6, u)}deg) rotateY(${lerp(-18, -11, u) + 1.5 * Math.sin(tl * .9)}deg);`;
    pintaResaltador(el.res, b.resalta, tl, dur);
    return pintaFuente(el.F, tl, b);
  },
});

// ───────────────────────── 7 · pantalla: grabación de pantalla a cuadro completo sobre el fondo neón ─────────────────────────
// beat: { video:'ventana', videoEncima:true, tr:.8, pieza:'pantalla', pantalla:'recorrido' (o imagen:'img/captura.png'), desde:0, velocidad:1,
//         zoom:1.3, foco:[.5,.5], acercamientos:[{ a:2, b:6, zoom:1.8, foco:[.4,.35] }], fusion:'trama'|'normal', desplaza:[0,1] (solo imagen fija alta), resalta:{…} }
// Con fusion 'trama' el negro de la grabación deja ver las luces del fondo (para interfaces de tema oscuro). Con tema claro usa 'normal'.
piezas.pantalla = pieza({
  sinSubs: true, sfx: [['whoosh_grave', .15, .3]],
  crea(el, b) {
    el.f = h('div', 'n-pant-fondo', '', el); el.caja = h('div', 'n-pant', '', el); el.F = creaFuente(el, el.caja, b);
    if ((b.fusion ?? 'trama') === 'trama') el.F.ims[0].style.mixBlendMode = 'screen';
    el.res = creaResaltador(el.caja, b.resalta);
  },
  pinta(el, tl, b, M, dur) {
    el.f.style.background = fondoCSS(M.t, saturado(M.t, M));
    let Z = b.zoom ?? 1.3, [fx, fy] = b.foco ?? [.5, .5];
    if (b.desplaza) fy = lerp(b.desplaza[0], b.desplaza[1], suave(clamp(tl / Math.max(.1, dur))));
    for (const a of b.acercamientos ?? []) { const w = suave(prog(tl, a.a, a.entra ?? 1.5)) * (1 - suave(prog(tl, a.b ?? dur + 9, a.sale ?? 1))); Z = lerp(Z, a.zoom ?? 1.8, w); if (a.foco) { fx = lerp(fx, a.foco[0], w); fy = lerp(fy, a.foco[1], w); } }
    if (!b.pantalla) Z *= 1 + .008 * tl;                                  // una imagen fija nunca se queda quieta: se acerca muy despacio
    const im = el.F.ims[0], prop = im.naturalWidth ? im.naturalHeight / im.naturalWidth : H / W, iw = W * Z, ih = iw * prop;
    const ix = clamp(W / 2 - fx * iw, W - iw, 0), iy = ih > H ? clamp(H / 2 - fy * ih, H - ih, 0) : (H - ih) / 2;
    el.caja.style.cssText = `left:${ix.toFixed(2)}px;top:${iy.toFixed(2)}px;width:${iw.toFixed(2)}px;height:${ih.toFixed(2)}px;opacity:${prog(tl, 2 * C, 5 * C)};`;
    pintaResaltador(el.res, b.resalta, tl, dur);
    return pintaFuente(el.F, tl, b);
  },
});

// ───────────────────────── 8 · apoyo: toma de apoyo a cuadro completo (con las orillas separadas en rojo/azul) ─────────────────────────
// beat: { video:'oculto', pieza:'apoyo', imagen:'img/oficina.jpg' (o pantalla:'toma1' si es video: se saca igual con motor/pantalla.py), desde, velocidad }
// Encima va el `rotulo` como extra, que atraviesa los cortes entre tomas.
piezas.apoyo = pieza({
  crea(el, b) { el.caja = h('div', 'n-apoyo', '', el); el.F = creaFuente(el, el.caja, b, ['g', 'r', 'b']); h('div', 'n-apoyo-orilla', '', el.caja); },
  pinta(el, tl, b, M, dur) {
    const u = tl / Math.max(.1, dur), dir = b.hacia === 'izquierda' ? -1 : 1;
    el.caja.style.transform = `scale(${1.07 + .03 * u}) translateX(${dir * lerp(-22, 22, u)}px)`;   // travelling lento
    return pintaFuente(el.F, tl, b);
  },
});

// ───────────────────────── 9 · carrusel: anillo 3D de tarjetas verticales que gira mientras la cámara se aleja ─────────────────────────
// beat: { pieza:'carrusel', imagenes:['img/reel1.png', …] (verticales 9:16; se repiten hasta llenar), cantidad:10, icono:true, saturar:true }
const PLAY = '<svg class="n-play" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#fff" stroke-width="3.5"/><path d="M41 31 L70 50 L41 69 Z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/></svg>';
piezas.carrusel = pieza({
  sinSubs: true, sfx: [['whoosh_grave', -.05, .32]],
  crea(el, b) {
    el.esc = h('div', 'n-car-esc', '', el); el.aro = h('div', 'n-car-aro', '', el.esc);
    const N = b.cantidad ?? 10, ims = b.imagenes ?? [], R = 800; el.N = N;
    el.t = [...Array(N)].map((_, i) => { const c = h('div', 'n-car-tj', '', el.aro); if (ims.length) foto(el, c, ims[i % ims.length]); else c.style.background = `linear-gradient(${160 + 40 * azar(i)}deg, hsl(${250 + 80 * azar(i + 9)},70%,45%), #0b0420)`;
      if (b.icono !== false) c.insertAdjacentHTML('beforeend', PLAY); c.base = `rotateY(${i * 360 / N}deg) translateZ(${R}px) translateY(${(i % 2 ? 1 : -1) * 22}px) rotateY(180deg)`; return c; });
    el.p = [...Array(40)].map(() => h('i', 'n-chispa', '', el));
  },
  pinta(el, tl, b, M, dur) {
    const e = eOut(prog(tl, 0, 33 * C)), sal = prog(tl, dur - 12 * C, 12 * C), zc = lerp(3300, -520, e) - 70 * tl, giro = lerp(-40, 80, e) + 16 * tl;
    el.aro.style.transform = `translateZ(${zc}px) rotateX(-17deg) rotateY(${giro}deg)`;
    el.esc.style.filter = `blur(${(16 * (1 - e) + 6 * sal).toFixed(1)}px) brightness(${1 + 1.2 * Math.max(0, 1 - tl / (3 * C)) + .8 * sal})`;
    el.esc.style.opacity = 1 - eIn(sal);
    el.t.forEach((c, i) => { c.style.transform = `${c.base} scale(${1 - .35 * eIn(clamp(sal * 1.3 - .2 * azar(i)))})`; });
    // al final se deshace en chispas amarillas
    el.p.forEach((s, i) => { const a = azar(i) * 6.283, r = 80 + 620 * azar(i + 50), q = eOut(sal);
      s.style.cssText = `left:${1000 + Math.cos(a) * r * (.35 + .9 * q)}px;top:${520 + Math.sin(a) * r * .55 * (.35 + .9 * q)}px;opacity:${sal > 0 ? Math.sin(Math.PI * clamp(sal * 1.1)) : 0};transform:scale(${.5 + 1.6 * azar(i + 7)});`; });
  },
});

// ───────────────────────── 10 · escalones: niveles en escalera con bolita que salta ─────────────────────────
// beat: { pieza:'escalones', niveles:['Nivel 0','Nivel 20',…], inicio:'Novato', saltos:[[2, 4.4], [5, 5.0]] ([nivel, segundo en que cae]) }
piezas.escalones = pieza({
  sinSubs: true,
  crea(el, b) {
    const niv = b.niveles ?? ['Nivel 0', 'Nivel 20', 'Nivel 40', 'Nivel 60', 'Nivel 80', 'Nivel 100'], N = niv.length; el.N = N;
    el.s0 = Math.min(1, 770 / ((N - 1) * 130 + 120));                        // si hay más de 6 niveles, todo se encoge para que quepa
    el.mundo = h('div', 'n-mundo', '', el);
    el.e = niv.map((txt, i) => { const e = h('div', 'n-bisel n-escalon', `<span>${txt}</span>`, el.mundo); e.x = 242 + 203 * i; e.y = 955 - 130 * i; return e; });
    el.eti = h('div', 'n-esc-eti', '', el.mundo); letras(el.eti, b.inicio ?? '');
    el.blanca = h('div', 'n-bolita blanca', '', el.mundo); el.cian = h('div', 'n-bolita cian', '', el.mundo);
  },
  pinta(el, tl, b, M, dur) {
    const N = el.N, k = Math.min(1.1, dur / 7.57), E = el.e;
    const saltos = b.saltos ?? (N > 2 ? [[Math.round((N - 1) * .4), 4.4 * k], [N - 1, 5.0 * k]] : [[N - 1, 4.6 * k]]);
    const sobre = i => [E[i].x + 147, E[i].y - 46], B0 = [E[0].x + 69, E[0].y - 46];
    // la bolita cian: sale de la blanca y salta en arco de escalón en escalón
    let pos = B0, tSale = saltos[0][1] - .6 * Math.max(.6, k), desde = B0, tDesde = tSale, enAire = false;
    for (const [niv, tCae] of saltos) { if (tl >= tDesde) { const p = prog(tl, tDesde, tCae - tDesde), a = sobre(niv), q = suave(p), alto = 120 + .25 * Math.abs(a[1] - desde[1]);
        pos = [lerp(desde[0], a[0], q), lerp(desde[1], a[1], p) - 4 * alto * p * (1 - p)]; enAire = p < 1; }
      desde = sobre(niv); tDesde = tCae + .05; }
    const fin = sobre(saltos.at(-1)[0]), tFin = saltos.at(-1)[1];
    // cámara: sube siguiendo a la bolita y se acerca de 1.0× a ≈1.28×
    const q = suave(prog(tl, tSale - .5 * k, tFin - tSale + 1.3 * k)), Z = el.s0 * lerp(1, 1.275, q) * (1 + .012 * tl), s0 = el.s0;
    const ancla = [lerp(242, fin[0], q), lerp(1075, fin[1], q)], pant = [lerp(242, 1078, q) - 6 * tl, lerp(1075, 372, q)];
    el.mundo.style.transform = `translate(${(pant[0] - Z * ancla[0]).toFixed(2)}px,${(pant[1] - Z * ancla[1]).toFixed(2)}px) scale(${Z.toFixed(4)})`;
    E.forEach((e, i) => {
      const p = eOut(prog(tl, i * 5.5 * C * k, 7 * C)), w = lerp(3, 530, p);                       // nace de una línea en su borde derecho y crece a la izquierda
      const cae = saltos.find(s => s[0] === i), dt = cae ? tl - cae[1] : -1, parp = dt >= 0 && dt < 6 * C ? 1 - dt / (6 * C) : 0, ultimo = cae && i === saltos.at(-1)[0] && dt >= 0;
      e.style.cssText = `left:${e.x + 530 - w}px;top:${e.y}px;width:${w}px;opacity:${p > 0 ? 1 : 0};--parp:${parp};filter:brightness(${1 + .06 * Math.sin(tl * 2.4 + i)});`;
      e.firstChild.style.cssText = `opacity:${prog(tl, i * 5.5 * C * k + 4 * C, 5 * C)};${ultimo ? 'color:#a9d4ff;text-shadow:0 0 10px #6fb3ff,0 0 2px #fff;' : ''}`;
    });
    const tB = 1.0 * k, lat = 1 + .04 * Math.sin(tl * 4.4);
    el.blanca.style.cssText = `left:${B0[0]}px;top:${B0[1] + 3 * Math.sin(tl * 3)}px;transform:translate(-50%,-50%) scale(${Math.max(0, eBack(prog(tl, tB, 7 * C))) * lat});opacity:${tl < tSale ? 1 : lerp(1, .0, prog(tl, tSale, .35))};`;
    el.cian.style.cssText = `left:${pos[0]}px;top:${pos[1] + (enAire ? 0 : 3 * Math.sin(tl * 3))}px;transform:translate(-50%,-50%) scale(${prog(tl, tSale - .1, .2) * lat});opacity:${tl >= tSale - .1 ? 1 : 0};`;
    const tE = 1.4 * k, cuad = Math.floor(tl * 30), tiem = azar(cuad) - .5;                           // borde tembloroso de la etiqueta
    el.eti.style.cssText = `left:${E[0].x - 8}px;top:${E[0].y - 168}px;opacity:${tl < tSale ? 1 : 1 - prog(tl, tSale, .4)};text-shadow:${tiem * 3}px ${(azar(cuad + 5) - .5) * 3}px 0 rgba(255,255,255,.45), 0 0 12px rgba(255,255,255,.6);`;
    escribe(el.eti, prog(tl, tE, Math.max(.3, .9 * k)));
  },
});

// ───────────────────────── 11 · rotulo: rótulo inferior de dos líneas (sobre la toma de apoyo) ─────────────────────────
// extra: { a, b, pieza:'rotulo', texto:'+25 personas', texto2:'(Equipo de producción)', salida:true (baja y se desvanece; sin esto sale por corte) }
piezas.rotulo = pieza({
  z: 4,
  crea(el, b) {
    el.caja = h('div', 'n-cristal n-rotulo', '<i class="n-borde"></i><i class="n-relleno"></i>', el);
    el.l1 = h('div', 'n-rot-1', '', el.caja); letras(el.l1, b.texto ?? ''); el.l2 = h('div', 'n-rot-2', '', el.caja); letras(el.l2, b.texto2 ?? '');
    el.an = b.ancho ?? clamp(Math.max(el.l1.scrollWidth, el.l2.scrollWidth) + 150, 1017, 1640);
    if (!b.texto2) el.caja.classList.add('una');
  },
  pinta(el, tl, b, M, dur) {
    const t0 = b.retraso ?? 7 * C, T = 17 * C, n = nacer((tl - t0) / T, el.an, 208), sal = b.salida ? eIn(prog(tl, dur - 8 * C, 8 * C)) : 0;
    el.caja.style.cssText = `display:${tl < t0 ? 'none' : ''};left:${b.x ?? 913}px;top:${(b.y ?? 954) + 60 * sal}px;width:${n.ancho}px;height:${n.alto}px;border-radius:${Math.min(40, n.ancho / 2)}px;` +
      `transform:translate(-50%,-50%) scale(${1 + .006 * Math.sin(tl * 2.2)});opacity:${1 - sal};--ang:${(215 + 20 * Math.sin(tl * .9)).toFixed(1)}deg;`;
    const t1 = t0 + T * .45, d1 = durEscribir(el.l1._L.length) * .6;
    escribe(el.l1, prog(tl, t1, d1)); escribe(el.l2, prog(tl, t1 + d1, durEscribir(el.l2._L.length) * .7), { cola: 5 });
  },
});

// ───────────────────────── 12 · logo: logo + título con anillos de neón ─────────────────────────
// beat: { pieza:'logo', logo:'img/logo.svg', titulo:'Academia Digital', tunel:true (al final la cámara se aleja y el logo se pierde al centro), destello:true }
piezas.logo = pieza({
  sinSubs: true,
  crea(el, b) {
    el.classList.add('n-3d'); el.ani = creaAnillos(el);
    el.g = h('div', 'n-logo', '', el); el.tit = h('div', 'n-logo-tit', '', el.g); letras(el.tit, b.titulo ?? '');
    el.fs = b.tam ?? Math.min(104, 104 * 760 / Math.max(1, el.tit.scrollWidth)); el.tit.style.fontSize = el.fs + 'px';
    el.mon = h('div', 'n-logo-mon', '', el.g); if (b.logo ?? b.imagen) foto(el, el.mon, b.logo ?? b.imagen);
  },
  pinta(el, tl, b, M, dur) {
    const tunel = b.tunel ?? dur >= 2, s = tunel ? eIn(prog(tl, dur - 1.1, 1.0)) : 0, cx = b.x ?? 1000, cy = b.y ?? 520;
    pintaAnillos(el.ani, tl, { cx, cy: cy - 6, esc: lerp(1, .4, eInOut(prog(tl, dur - 1.2, 1.2)) * (tunel ? 1 : 0)) * (1 + .035 * tl) });
    el.g.style.cssText = `left:${cx}px;top:${cy}px;transform:scale(${lerp(1, .05, s) * (1 + .02 * tl)});opacity:${1 - prog(tl, dur - .25, .2) * (tunel ? 1 : 0)};`;
    const e = eOut(prog(tl, 0, 9 * C));
    el.mon.style.transform = `translate(-50%,-50%) rotateY(${lerp(78, 0, e) + 9 * Math.sin(tl * 1.5)}deg) rotateX(${5 * Math.sin(tl * 1.1 + 1)}deg) scale(${lerp(.5, 1, e)})`;
    el.mon.style.filter = `brightness(${1 + .12 * Math.sin(tl * 3.1)})`;
    // el título: cada letra entra violeta, pasa por amarillo y queda en el degradado lila → blanco
    const L = el.tit._L, n = L.length, pE = prog(tl, 3 * C, durEscribir(n) * 1.25), pos = pE * (n + 6);
    escribe(el.tit, pE);
    L.forEach((sp, i) => { const q = clamp((pos - i) / 6), fin = tramoA([[0, '#a76ff9'], [.45, '#d1a4ea'], [1, '#e9e2ec']], n > 1 ? i / (n - 1) : 1);
      sp.style.color = q < .5 ? mixRGB(hex('#8f52f5'), hex('#f7e233'), q * 2) : mixRGB(hex('#f7e233'), fin, q * 2 - 1); });
  },
});

// ───────────────────────── 13 · trayectoria: «+N años» con miniaturas enmarcadas flotando ─────────────────────────
// beat: { pieza:'trayectoria', texto:'+12 años', imagenes:['img/mini1.png', …hasta 8] (la primera llena el cuadro y se encoge al centro), saturar:true }
const MINIS = [[0, 0, 310], [-670, -372, 515], [233, -482, 268], [837, -425, 218], [-600, 310, 300], [650, 300, 380], [-170, 420, 210], [340, 440, 170]];
piezas.trayectoria = pieza({
  sinSubs: true, sfx: [['whoosh_rapido', -.05, .3], ['tic', .35, .25]],
  crea(el, b) {
    el.m = (b.imagenes ?? []).slice(0, MINIS.length).map((src, i) => { const m = h('div', 'n-mini n-marco', '', el); foto(el, m, src); m.style.width = MINIS[i][2] + 'px'; return m; });
    el.txt = h('div', 'n-tray-txt', '', el); letras(el.txt, b.texto ?? '');
  },
  pinta(el, tl, b, M, dur) {
    const cx = 960, cy = b.y ?? 520, e = eOut(prog(tl, 3 * C, 15 * C));
    el.m.forEach((m, i) => {
      const [x, y, w] = MINIS[i];
      if (!i) { m.style.cssText = `width:${w}px;left:${cx}px;top:${cy}px;transform:translate(-50%,-50%) scale(${lerp(1920 / w * 1.1, 1, e) * (1 - .03 * tl)});filter:brightness(${lerp(2.4, 1, e)});opacity:${prog(tl, 2 * C, 2 * C)};z-index:1;`; return; }
      const p = eOut(prog(tl, (8 + i * 1.5) * C, 16 * C)), sep = lerp(.3, 1, p) + .07 * tl, f = azar(i) * 6;
      m.style.cssText = `width:${w}px;left:${cx + x * sep}px;top:${cy + y * sep + 5 * Math.sin(tl * 1.4 + f)}px;transform:translate(-50%,-50%) scale(${lerp(.35, 1, p) * (1 + .05 * tl)});opacity:${p};`;
    });
    escribe(el.txt, prog(tl, 9 * C, durEscribir(el.txt._L.length)));
    el.txt.style.cssText = `left:${cx - 7}px;top:${cy - 122}px;transform:translate(-50%,-50%) scale(${1 + .03 * tl});text-shadow:0 0 ${44 + 10 * Math.sin(tl * 4)}px rgba(250,215,120,.85), 0 0 14px rgba(196,144,244,.9);`;
  },
});

// ───────────────────────── 14 · rejilla: rejilla 3D inclinada de tarjetas que aparecen una por una ─────────────────────────
// beat: { pieza:'rejilla', tarjetas:[{ imagen:'img/curso1.png', titulo:'Curso de ventas', texto:'Aprende a…', avance:20 }, …], columnas:3 }
piezas.rejilla = pieza({
  sinSubs: true,
  crea(el, b) {
    el.classList.add('n-3d'); el.plano = h('div', 'n-rej', '', el); el.cols = b.columnas ?? 3; el.plano.style.width = (el.cols * 534 - 34) + 'px';
    el.l = (b.tarjetas ?? []).map((t, i) => { const l = h('div', 'n-loseta', `<div class="img"></div><b>${t.titulo ?? ''}</b><p>${t.texto ?? ''}</p><i class="barra"><u style="width:${clamp(t.avance ?? 0, 0, 100)}%;${t.avance ? 'background:#2fbf6b;' : ''}">${t.avance ?? 0}%</u></i>`, el.plano);
      if (t.imagen) foto(el, l.firstChild, t.imagen); l.style.left = (i % el.cols) * 534 + 'px'; l.style.top = Math.floor(i / el.cols) * 554 + 'px'; return l; });
  },
  pinta(el, tl, b, M, dur) {
    const N = el.l.length, filas = Math.ceil(N / el.cols), paso = Math.min(8.5 * C, (dur * .78) / Math.max(1, N)), u = clamp(tl / Math.max(.1, dur));
    const fila = Math.max(0, (filas - 1.25)) * suave(u) + .25 * u;                                        // la cámara baja de forma continua
    el.plano.style.transform = `translate(-50%,0) scale(${lerp(.9, 1.06, u)}) rotateX(35deg) rotateY(-8deg) rotateZ(-3deg) translateY(${(-fila * 554).toFixed(1)}px)`;
    el.l.forEach((l, i) => { const p = prog(tl, 2 * C + i * paso, 7 * C); l.style.transform = `scale(${Math.max(0, eBack(p))})`; l.style.opacity = Math.min(1, p * 3); l.style.filter = `brightness(${1 + .9 * (1 - prog(tl, 2 * C + i * paso, 14 * C)) + .05 * Math.sin(tl * 2.5 + i)})`; });
  },
});

// ───────────────────────── 15 · precio: tarjeta de inscripción con borde de neón y precio que sube ─────────────────────────
// beat: { pieza:'precio', logo:'img/logo.svg', marca:'ACADEMIA DIGITAL', titulo:'Academia Digital', enlace:'tusitio.com/academia', texto:'Aprende a…',
//         datos:[['491','Miembros'],['13','En línea'],['2','Guías']], boton:'ENTRAR', precio:{ de:29, hasta:914, prefijo:'$', sufijo:'/mes' }, nota:'De por vida', sube: seg }
piezas.precio = pieza({
  sinSubs: true,
  crea(el, b) {
    el.cam = h('div', 'n-mundo', '', el); el.tj = h('div', 'n-pre', '', el.cam); el.in = h('div', 'n-pre-in', '', el.tj);
    const cab = h('div', 'n-pre-cab', '', el.in); if (b.logo) foto(el, cab, b.logo); h('b', '', b.marca ?? '', cab);
    h('div', 'n-pre-tit', b.titulo ?? '', el.in); h('div', 'n-pre-enl', b.enlace ?? '', el.in); h('div', 'n-pre-txt', b.texto ?? '', el.in);
    h('div', 'n-pre-datos', (b.datos ?? []).slice(0, 3).map(d => `<div><b>${d[0]}</b><span>${d[1]}</span></div>`).join(''), el.in);
    el.nota = h('div', 'n-pre-nota', '', el.in); letras(el.nota, b.nota ?? '');
    el.bot = h('div', 'n-pre-bot', '', el.in); el.pie = h('div', 'n-pre-pie', b.pie ?? '', el.in);
    el.velo = h('div', 'n-velo', '', el);
  },
  pinta(el, tl, b, M, dur) {
    const pr = b.precio ?? {}, haySube = pr.hasta != null && pr.hasta !== pr.de, tSube = haySube ? (b.sube ?? dur * .56) : dur + 9, k = Math.min(1, (haySube ? tSube : dur) / 3);
    const cx = b.x ?? 762, e = eOut(prog(tl, 0, 26 * C * Math.max(.6, k))), arriba = lerp(560, 55, e), abajo = lerp(564, 893, e);
    el.tj.style.cssText = `left:${cx - 225.5}px;top:${arriba}px;height:${abajo - arriba}px;--rojo:${prog(tl, tSube, .5)};filter:brightness(${1 + .08 * Math.sin(tl * 3.3)});`;
    el.in.style.top = (55 - arriba) + 'px';
    // cámara: baja y se acerca al botón; cuando el precio sube, sigue acercándose
    const q1 = suave(prog(tl, 1.2 * k, .75 * k)), q2 = prog(tl, tSube, Math.max(.3, dur - tSube)), e2 = eOut(q2), Z = lerp(1, 1.33, q1) + .55 * e2 + .02 * tl;
    const px = lerp(cx, 926, q1), py = lerp(763, 617, q1) - 139 * e2;
    el.cam.style.transform = `translate(${(px - Z * cx).toFixed(2)}px,${(py - Z * 763).toFixed(2)}px) scale(${Z.toFixed(4)})`;
    escribe(el.nota, prog(tl, 1.8 * k, .7 * k));
    const tc = Math.min(73 * C, Math.max(.4, dur - tSube - .35)), p = prog(tl, tSube + 2 * C, tc);
    el.bot.textContent = `${b.boton ?? ''} ${dinero(haySube ? lerp(pr.de ?? 0, pr.hasta, p) : (pr.de ?? 0), pr)}`.trim();
    el.velo.style.opacity = haySube ? velo(tl - tSube + 1e-4) : 0;
  },
});

// ───────────────────────── 16 · boton: botón de llamado a la acción abajo al centro (sobre el pecho, nunca la cara) ─────────────────────────
// extra: { a, b, pieza:'boton', texto:'ENTRAR', clic: 1.3 (segundo del clic; false = sin cursor) }
piezas.boton = pieza({
  z: 4,
  crea(el, b) {
    el.caja = h('div', 'n-bisel n-boton', '', el); el.txt = h('div', 'n-boton-txt', '', el.caja); letras(el.txt, b.texto ?? '');
    el.an = b.ancho ?? clamp(el.txt.scrollWidth + 260, 656, 1300); el.cur = h('div', 'n-cursor chico', CURSOR, el);
  },
  pinta(el, tl, b, M, dur) {
    const cx = b.x ?? 977, cy = b.y ?? 964, n = nacer(tl / (18 * C), el.an, 167), sal = eIn(prog(tl, dur - 8 * C, 8 * C));
    const tClic = b.clic === false ? null : (b.clic ?? Math.min(1.3, dur - .6)), dc = tClic == null ? -1 : tl - tClic;
    const gris = dc >= 0 && dc < .2 ? 1 : 0, des = dc >= .2 && dc < .36 ? 1 - (dc - .2) / .16 * .5 : 0, aprieta = dc >= 0 ? Math.max(0, 1 - Math.abs(dc - .08) / .12) : 0;
    el.caja.style.cssText = `left:${cx}px;top:${cy + 60 * sal}px;width:${n.ancho}px;height:${n.alto}px;border-radius:${Math.min(40, n.ancho / 2)}px;opacity:${1 - sal};` +
      `transform:translate(-50%,-50%) scale(${(1 - .05 * aprieta) * (1 + .012 * Math.sin(tl * 3))});--gris:${gris};--des:${des};--lat:${.5 + .5 * Math.sin(tl * 3)};`;
    escribe(el.txt, prog(tl, 7 * C, durEscribir(el.txt._L.length)));
    el.txt.style.left = `calc(50% - ${el.an / 2}px)`; el.txt.style.width = el.an + 'px'; el.txt.style.color = des > 0 ? '#fce796' : '';
    if (tClic == null) { el.cur.style.display = 'none'; return; }
    const p = eOut(prog(tl, tClic - .45, .4)), x = lerp(cx + el.an / 2 + 240, cx + el.an / 2 - 122, p) + 4 * Math.sin(tl * 2.3), y = lerp(cy + 150, cy + 6, p) + 3 * Math.cos(tl * 1.9) + 60 * sal;
    el.cur.style.cssText = `display:${tl < tClic - .45 ? 'none' : ''};left:${x}px;top:${y}px;opacity:${1 - sal};transform:rotateY(${(1 - p) * -200}deg) scale(${1 - .15 * aprieta});`;
  },
});

// ───────────────────────── 17 · destello: velo blanco de transición ─────────────────────────
// extra: { a: 6.2, b: 6.7, pieza:'destello' }   — o, más corto, `destello: true` en cualquier beat (lo pinta la capa de encima)
piezas.destello = { z: 9, crea(el) { el.style.background = '#fff'; }, pinta(el, tl) { el.style.opacity = velo(tl + 1e-4); } };

// ───────────────────────── 18 · pastilla: una cifra en pastilla con su etiqueta (y, si quieres, un objeto que sube al lado) ─────────────────────────
// beat: { pieza:'pastilla', etiqueta:'Ingresos:', valor:'$10,000', imagen:'img/telefono.svg', nota:'Contenido orgánico' }
piezas.pastilla = pieza({
  sinSubs: true, sfx: [['whoosh_grave', 1.5, .3]],
  crea(el, b) {
    el.classList.add('n-3d'); el.g = h('div', 'n-past', '', el);
    el.eti = h('div', 'n-past-eti', '', el.g); letras(el.eti, b.etiqueta ?? '');
    el.pas = h('div', 'n-bisel n-past-pas', '', el.g); el.num = h('div', 'n-past-num', '', el.pas); letras(el.num, b.valor ?? '');
    el.an = el.num.scrollWidth + 56;
    if (b.imagen) { el.obj = foto(el, el, b.imagen, 'n-past-obj'); if (b.nota) { el.nota = h('div', 'n-past-nota', '', el); letras(el.nota, b.nota); } }
  },
  pinta(el, tl, b, M, dur) {
    const k = Math.min(1, dur / 3.9), tObj = el.obj ? 1.5 * k : dur + 9, corre = suave(prog(tl, tObj, 12 * C)), n = nacer(tl / (14 * C), el.an, 197);
    el.g.style.cssText = `left:${960 - el.an / 2 - (el.obj ? 150 : 0) * corre - 8 * tl}px;top:502px;transform:scale(${1 + .012 * tl});`;
    el.pas.style.cssText = `width:${n.ancho}px;height:${n.alto}px;top:${-n.alto / 2}px;`;
    const nN = el.num._L.length, tN = durEscribir(nN), enf = prog(tl, 1.35 * k, .4 * k);
    escribe(el.num, prog(tl, 6 * C, tN)); escribe(el.eti, prog(tl, 2 * C, durEscribir(el.eti._L.length)));
    el.num.style.color = enf > 0 ? mixRGB(hex('#fffcff'), hex('#fae446'), Math.sin(Math.PI * Math.min(1, enf * 1.0)) * .9 + .1 * enf) : tramo([[0, '#b46cf5'], [.35, '#db3cda'], [1, '#fffcff']], prog(tl, 6 * C, tN + .3));
    if (!el.obj) return;
    const p = eOut(prog(tl, tObj, 21 * C));
    el.obj.style.cssText = `left:${1525}px;top:${lerp(1500, 540, p) + 8 * Math.sin(tl * 1.5)}px;transform:translate(-50%,-50%) rotateY(${lerp(-70, -20, p) + 3 * Math.sin(tl)}deg) rotateZ(${lerp(30, 6, p)}deg);opacity:${tl >= tObj ? 1 : 0};`;
    if (el.nota) { const q = (tl - tObj - .8 * k) / (14 * C); el.nota.style.cssText = `display:${q < 0 ? 'none' : ''};left:1515px;top:${488 + 5 * Math.sin(tl * 1.7)}px;opacity:${prog(q, 0, .3)};`; escribe(el.nota, prog(q, .4, 1.2)); }
  },
});

// ───────────────────────── 19 · cero: cifra de dolor («$0») con línea roja que cae ─────────────────────────
// beat: { pieza:'cero', texto:'$0', destello:false }
piezas.cero = pieza({
  sinSubs: true,
  crea(el, b) {
    el.insertAdjacentHTML('beforeend', '<svg class="n-cero-svg" viewBox="0 0 1920 1080"><path d="M1930 -10 L1500 250 L1380 215 L1080 470 L760 455 L700 520 L420 610 L330 575 L20 900" class="halo"/><path d="M1930 -10 L1500 250 L1380 215 L1080 470 L760 455 L700 520 L420 610 L330 575 L20 900" class="linea"/></svg>');
    el.tr = [...el.querySelectorAll('path')]; el.largo = el.tr[0].getTotalLength(); el.txt = h('div', 'n-cero', b.texto ?? '$0', el);
  },
  pinta(el, tl, b, M, dur) {
    const p = eOut(prog(tl, 0, 13 * C)), e = eOut(prog(tl, 5 * C, 8 * C));
    for (const t of el.tr) t.setAttribute('stroke-dasharray', `${(el.largo * p).toFixed(1)} ${el.largo + 20}`);
    el.txt.style.cssText = `opacity:${e};transform:translate(-50%,-50%) scale(${lerp(1.6, 1, e) * (1 + .05 * tl)});filter:blur(${(8 * (1 - e)).toFixed(1)}px);text-shadow:0 0 ${36 + 12 * Math.sin(tl * 6)}px rgba(247,195,58,.85), 0 0 10px rgba(247,195,58,.8);`;
  },
});

// ───────────────────────── subtítulos (APAGADOS: el video de referencia no lleva) ─────────────────────────
const subsNeon = {
  paginas: { max: 4, chars: 26 },
  crea(el) { el.classList.add('n-subs'); },
  pinta(el, pag, t) { el.innerHTML = pag.palabras.map(w => (t >= w.a ? `<b>${w.txt}</b>` : `<span>${w.txt}</span>`)).join(' '); },
};

// capa de encima: el destello blanco de los beats que llevan `destello: true`
const encima = {
  crea(el) { el.v = h('div', 'n-velo', '', el); },
  pinta(el, t, M) { let op = 0; for (const b of M.beats) if (b.destello) op = Math.max(op, velo(t - b.a + 1e-4)); for (const b of M.extras) if (b.destello && !b.pieza) op = Math.max(op, velo(t - b.a + 1e-4)); el.v.style.opacity = op; },
};

export default {
  nombre: 'neon',
  tr: 0,                                      // todos los cambios de encuadre son corte seco; para que la persona VUELE a la ventana pon `tr: 0.8` en ese beat
  curvaVideo: p => 1 - (1 - p) * (1 - p),     // el vuelo a la ventana frena al llegar
  video: {
    porDefecto: 'completo',
    completo: {},
    // ventanita vertical arriba a la derecha (medida en el video de referencia): 286×411 px, radio 24, la persona a ≈0.41× recortada al centro
    ventana: { x: 1599, y: 92, w: 286, h: 411, r: 24, zoom: 1.067, clase: 'ventana' },
  },
  fondo,
  piezas,
  // subs: subsNeon,                          // ← quita las dos barras del inicio de esta línea para ACTIVAR los subtítulos (el estilo va sin ellos)
  encima,
};
void subsNeon;
