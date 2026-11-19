// Estilo «cinético» para el motor de videos largos.
// Texto gigante que pasa DETRÁS de la cabeza, frases que entran enormes y se achican al pecho, texto por golpes con
// palabras en color, insertos sobre negro con cuadrícula de rompecabezas y barra roja de avance.
// La guía para editar con este estilo está en ESTILO.md (léela antes de escribir un beats.js).
//
// Regla del motor: todo depende SOLO del segundo `t`. Aquí no hay Math.random, Date.now, setTimeout ni animaciones de CSS.
import { W, H, M, clamp, lerp, prog, eIn, eOut, eInOut, eBack, azar, h, px, ponImagen } from '/motor/nucleo.js';
import ICONOS from './iconos/iconos.js';

// ───────────────────────── 1 · colores, tiempos y ayudas de texto ─────────────────────────
const F = 1 / 30;                                     // un cuadro del video de referencia, en segundos
const COLOR = { crema: '#f1e9d2', rojo: '#cb0000', verde: '#15fe09', naranja: '#f1a400', amarillo: '#fee41d', blanco: '#ffffff', negro: '#000000',
  menta: '#0ce67e', carmin: '#c10321', lima: '#d1d32b', amarillocta: '#d9c814' };
const ALIAS = { c: 'crema', r: 'rojo', v: 'verde', n: 'naranja', a: 'amarillo', b: 'blanco', k: 'negro' };
// color('rojo') · color('r') · color('#ff00aa')
const nombreColor = c => (c == null ? null : (ALIAS[String(c).toLowerCase()] ?? String(c).toLowerCase()));
const color = c => (c == null ? null : (COLOR[nombreColor(c)] ?? c));
const ruta = p => (!p ? '' : /^(\/|https?:|data:)/.test(p) ? p : '/proyecto/' + p);   // 'img/foto.jpg' → '/proyecto/img/foto.jpg'
const mayus = s => s.toLocaleUpperCase('es').replace(/\{(\w+):/g, m => m.toLowerCase());

// Palabras en color dentro de un texto: 'deja de {rojo:perseguir} clientes' (o corto: {r:…} {v:…} {n:…} {a:…} {b:…}).
// {x:palabra} la deja tachada con una raya roja.
const MARCA = /\{(\w+):([^}]*)\}/g;
const limpio = txt => String(txt).replace(MARCA, '$2');
function trozos(txt) {
  const sal = []; let i = 0, m; MARCA.lastIndex = 0; txt = String(txt);
  while ((m = MARCA.exec(txt))) { if (m.index > i) sal.push({ t: txt.slice(i, m.index) }); sal.push({ t: m[2], c: m[1].toLowerCase() }); i = MARCA.lastIndex; }
  if (i < txt.length) sal.push({ t: txt.slice(i) });
  return sal;
}
const estiloDe = c => (c && c !== 'x' ? ` style="color:${color(c)}"` : '');
// pone el texto en `d` con cada palabra en su <span class="w"> (para animarlas una por una). '\n' = renglón nuevo. Devuelve las palabras.
function ponPalabras(d, txt) {
  let html = '';
  String(txt).split('\n').forEach((ren, r) => {
    if (r) html += '<br>';
    let pegar = true;
    for (const z of trozos(ren)) {
      const partes = z.t.split(/(\s+)/);
      for (const p of partes) {
        if (!p) continue;
        if (/^\s+$/.test(p)) { html += ' '; pegar = false; continue; }
        html += `<span class="w${z.c === 'x' ? ' tach' : ''}"${estiloDe(z.c)}>${p}${z.c === 'x' ? '<i></i>' : ''}</span>`;
      }
    }
  });
  d.innerHTML = html; d.ws = [...d.querySelectorAll('.w')];
  return d.ws;
}
// letras de un texto con su color (para escribirlo letra por letra)
function letrasDe(txt) { const sal = []; for (const z of trozos(txt)) for (const ch of z.t) sal.push({ ch, c: z.c }); return sal; }
// HTML de un texto a medio escribir: `n` letras visibles, el cursor (si se pide) y el resto invisible (para que no se mueva al crecer)
function htmlTecleo(letras, n, cursor) {
  let html = '', abierto = null;
  const cierra = () => { if (abierto !== null) { html += '</span>'; abierto = null; } };
  letras.forEach((l, i) => {
    if (i === n) { cierra(); if (cursor) html += '<span class="c-cursor"><b></b></span>'; html += '<span class="c-oculto">'; abierto = '__'; }
    if (i < n) { const k = l.c ?? ''; if (abierto !== k) { cierra(); html += `<span${estiloDe(l.c)}>`; abierto = k; } }
    html += l.ch === '\n' ? '<br>' : l.ch;
  });
  cierra();
  if (n >= letras.length && cursor) html += '<span class="c-cursor"><b></b></span>';
  return html;
}
// ancho de un texto en px (con la tipografía ya cargada) y tamaño de letra para que quepa en un ancho
const _med = document.createElement('canvas').getContext('2d');
function anchoTexto(txt, tam, { peso = 600, fam = 'Poppins', ital = false, ls = 0 } = {}) {
  _med.font = `${ital ? 'italic ' : ''}${peso} 200px "${fam}"`;
  return Math.max(...limpio(txt).split('\n').map(s => (_med.measureText(s).width / 200 + ls * s.length) * tam));
}
const tamPara = (txt, ancho, min, max, o) => clamp(ancho / anchoTexto(txt, 1, o), min, max);

// Listas con tiempo. Se aceptan: 'uno | dos | tres' · ['uno', 'dos'] · [['uno', 12.4], ['dos', 13.1]] · [{ t: 'uno', a: 12.4, color: 'rojo' }]
// `a` es el segundo ABSOLUTO del video (el mismo reloj de los beats y de palabras.json). Si falta, se reparten parejo en la pieza.
function lista(v) {
  if (v == null) return [];
  if (typeof v === 'string') v = v.split('|');
  return v.map(x => (typeof x === 'string' ? { t: x.trim() } : Array.isArray(x) ? { t: x[0], a: x[1], color: x[2] } : { ...x }));
}
function tiempos(items, b, frac = 1) {
  const dur = b.b - b.a, n = items.length;
  items.forEach((it, i) => { it.r = it.a != null ? it.a - b.a : (i * dur * frac) / n; });   // r = segundo relativo al inicio de la pieza
  return items;
}
// palabra por palabra: cada una sube `dy` px con fundido en `d` segundos, con `paso` de desfase (medido en la referencia: 12 px, 4 cuadros, 2–3 cuadros)
function subePalabras(ws, t, { paso = 2.5 * F, d = 4 * F, dy = 12, desde = 0 } = {}) {
  ws.forEach((w, j) => { const q = prog(t, (desde + j) * paso, d); w.style.opacity = q; w.style.transform = `translateY(${(1 - eOut(q)) * dy}px)`;
    const raya = w.lastElementChild; if (raya && raya.tagName === 'I') raya.style.transform = `scaleX(${eOut(prog(t, (desde + j) * paso + 5 * F, 5 * F))})`; });
}
const rayas = (ws, t) => ws.forEach(w => { const r = w.lastElementChild; if (r && r.tagName === 'I') r.style.transform = `scaleX(${eOut(prog(t, 6 * F, 5 * F))})`; });

// ───────────────────────── 2 · dónde está la cara (para que el texto de delante nunca la tape) ─────────────────────────
// proyecto.json: "foco": [x, y] = centro de la cara en el video (0–1) y "cara": [ancho, alto] = su tamaño (0–1; si falta, 0.16 × 0.32).
// Devuelve la cara en px de pantalla con el encuadre del cuadro que se está pintando, o null si la persona no se ve.
function cara() {
  const R = M.rect, P = M.datos.proyecto;
  if (!R || R.op < .05) return null;
  const f = P.foco ?? [.5, .38], c = P.cara ?? [.16, .32], fw = M.datos.anchoFuente || W, fh = M.datos.altoFuente || H;
  const k = Math.max(R.w / fw, R.h / fh) * R.zoom, iw = fw * k, ih = fh * k;
  const ix = clamp(R.w / 2 - R.fx * iw, R.w - iw, 0), iy = clamp(R.h / 2 - R.fy * ih, R.h - ih, 0);
  const cx = R.x + ix + f[0] * iw, cy = R.y + iy + f[1] * ih, w = c[0] * iw, al = c[1] * ih;
  return { cx, cy, w, h: al, izq: cx - w / 2, der: cx + w / 2, arriba: cy - al / 2, abajo: cy + al / 2 };
}
// encuadre con zoom y la cara puesta en la fracción (X, Y) de la pantalla. Sin X/Y la cara no se mueve de donde estaba (zoom anclado a la cara).
function encuadre(zoom, X = null, Y = null) {
  const f = M.datos?.proyecto?.foco ?? [.5, .38], z = Array.isArray(zoom) ? zoom[0] : zoom;
  return { zoom, foco: [f[0] - ((X ?? f[0]) - .5) / z, f[1] - ((Y ?? f[1]) - .5) / z] };
}

// ───────────────────────── 3 · cuadrícula de rompecabezas (el fondo de todos los insertos) ─────────────────────────
// Líneas con «orejas» de rompecabezas que cambian de lado, abombadas al centro y con separación de color:
// la misma línea se dibuja en rojo, verde y azul un poco corrida; donde coinciden las tres se ve crema.
const PASO = 154, POZO = [];
function lienzoRejilla(host, raiz) {
  let c = host._cv; if (c && c.parentNode === host) return c;
  c = POZO.find(x => !x._raiz.isConnected || x._raiz.style.display === 'none');   // se reusa el lienzo de una pieza que ya no se ve
  if (!c) { c = document.createElement('canvas'); c.width = W; c.height = H; POZO.push(c); }
  c._raiz = raiz; host.appendChild(c); host._cv = c; return c;
}
const campana = u => Math.exp(-u * u);
function dibujaRejilla(cv, t, brillo) {
  const g = cv.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
  if (brillo < .004) return;
  g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  const late = .30 + .045 * Math.sin(t * 3.3) + .02 * Math.sin(t * 1.7 + 1);          // el abombado del centro late (ciclo ≈ 1.9 s)
  const CAN = [['rgb(255,0,0)', 1], ['rgb(0,246,0)', 0], ['rgb(0,0,216)', -1]];       // juntos suman crema
  const oreja = (lin, k) => { const s = lin * 37.3 + k * 11.7, hay = azar(s + .5) > .58 ? 1 : .1;
    return hay * (34 + 40 * azar(s + 3.5)) * Math.tanh(2.4 * Math.sin(t * (2.6 + 2.2 * azar(s + 1.5)) + 6.283 * azar(s + 2.5))); };
  const onda = (lin, v, c0, an) => { const k0 = Math.round((v - c0) / PASO); let d = 0;
    for (let k = k0 - 2; k <= k0 + 2; k++) d += oreja(lin, k) * campana((v - c0 - k * PASO) / (PASO * an)); return d; };
  for (const [col, s] of CAN) {
    const B = late * (1 + .05 * s);
    const pt = (x, y) => { const dx = x - 960, dy = y - 540, r2 = Math.min(1, (dx / 1500) ** 2 + (dy / 850) ** 2), e = 1 + B * (1 - r2); return [960 + dx * e, 540 + dy * e]; };
    g.strokeStyle = col;
    for (let i = -8; i <= 8; i++) {                                                    // verticales: gruesas (color muy separado) y finas
      const gruesa = azar(i * 7.31 + 4.2) > .45, sep = gruesa ? 9.5 : 2.6;
      g.lineWidth = gruesa ? 6.5 : 2.4; g.globalAlpha = brillo * (gruesa ? 1 : .85); g.beginPath();
      for (let v = -260; v <= 1340; v += 13) { const [x, y] = pt(960 + i * PASO + onda(i + 100, v, 540, .34) * (1 + .16 * s) + sep * s, v); v === -260 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
    }
    if (!s) {                                                                          // horizontales: una sola copia, en crema
      g.strokeStyle = 'rgb(255,246,216)'; g.lineWidth = 4.4; g.globalAlpha = brillo;
      for (let j = -5; j <= 4; j++) {
        g.beginPath();
        for (let u = -420; u <= 2340; u += 13) { const [x, y] = pt(u, 540 + (j + .5) * PASO + onda(j + 300, u, 960 + PASO / 2, .42)); u === -420 ? g.moveTo(x, y) : g.lineTo(x, y); }
        g.stroke();
      }
      g.strokeStyle = col;
    }
    // un aro suelto (nudo de la línea) que va y viene
    const fa = t * .9, ax = 960 + 70 * Math.sin(fa * .7) + 6 * s, ay = 838 + 14 * Math.cos(fa);
    g.globalAlpha = brillo * clamp(.5 + .7 * Math.sin(fa * 1.3)); g.lineWidth = 7; g.beginPath(); g.ellipse(ax, ay, 62, 33 + 5 * Math.sin(fa * 2), 0, 0, 6.2832); g.stroke();
  }
  for (let n = 0; n < 3; n++) {                                                        // gotas de color sueltas
    const fa = t * (.55 + .3 * azar(n + 60)) + 6.283 * azar(n + 61);
    g.globalAlpha = clamp(brillo * 1.5 * (.45 + .55 * Math.sin(fa * 2.1)));
    g.fillStyle = ['rgb(0,0,255)', 'rgb(0,225,0)', 'rgb(255,0,0)'][n];
    g.beginPath(); g.ellipse(300 + 1320 * azar(n + 62) + 60 * Math.sin(fa), 200 + 680 * azar(n + 63) + 40 * Math.cos(fa * 1.3), 15, 27, 0, 0, 6.2832); g.fill();
  }
}
// brillo de la cuadrícula: entra al 65 % y en 12 cuadros baja a su reposo (18 %)
const brilloRejilla = (tl, b) => (b?.brillo != null ? b.brillo : lerp(.65, .18, eOut(prog(tl, 0, 12 * F))));

// ───────────────────────── 4 · fondos de inserto (campo `fondo` de cualquier pieza) ─────────────────────────
// 'rejilla' negro + cuadrícula (el normal) · 'negro' · 'crema' · 'beige' (el set sin la persona) · 'naranja' · 'rojo' (con rayos de luz)
// 'ladrillo' · 'particulas' (estallido rojo, para logos) · 'velo' (lo de atrás desenfocado y gris) · 'oscuro' (lo de atrás desenfocado y oscuro)
// 'ninguno' (la pieza va sobre la persona) · o la ruta de una imagen: 'img/toma.jpg'
const TINTA = { crema: '#111111', beige: '#111111' };
function creaFondo(el, tipo, b) {
  if (!tipo || tipo === 'ninguno') return null;
  const esImg = /[./]/.test(tipo), f = h('div', 'c-fondo c-f-' + (esImg ? 'imagen' : tipo), '', el);
  f.tipo = esImg ? 'imagen' : tipo;
  if (TINTA[tipo]) el.style.setProperty('--tinta', TINTA[tipo]);
  if (f.tipo === 'imagen') { f.im = imagen(el, f, '', tipo); h('div', 'c-vineta', '', f); }
  if (f.tipo === 'rejilla' || (b.rejilla && f.tipo !== 'velo')) f.rej = h('div', 'c-rej', '', f);
  if (f.tipo === 'rojo') f.rayos = [0, 1, 2].map(() => h('div', 'c-rayo', '', f));
  if (f.tipo === 'particulas') { f.cv = h('canvas', 'c-lienzo', '', f); f.cv.width = 960; f.cv.height = 540; f.rej = h('div', 'c-rej', '', f); }
  return f;
}
function pintaFondo(el, f, tl, dur, b) {
  const t = M.t;
  if (f.rej) dibujaRejilla(lienzoRejilla(f.rej, el), t, brilloRejilla(tl, b) * (f.tipo === 'rejilla' ? 1 : .6));
  if (f.tipo === 'velo' || f.tipo === 'oscuro') {            // lo que haya detrás (la persona o el inserto anterior) se desenfoca y se apaga
    const q = Math.min(eOut(prog(tl, 0, (b.velo ?? 6) * F)), 1 - sale(tl, dur, 5 * F));
    f.style.backdropFilter = f.style.webkitBackdropFilter = `blur(${(25 * q).toFixed(2)}px)` + (f.tipo === 'velo' ? ` grayscale(${(.85 * q).toFixed(3)})` : '');
    f.style.opacity = q;
  }
  if (f.tipo === 'rojo') f.rayos.forEach((r, i) => { r.style.transform = `translate(${-260 + i * 330 + 46 * tl}px, ${-330 + i * 300 + 20 * tl}px) rotate(${27 + i * 2.5}deg) scaleY(${[1, .45, .7][i]})`; r.style.opacity = [.9, .5, .65][i]; });
  if (f.tipo === 'ladrillo') f.style.backgroundPosition = `0 0, ${(-14 * tl).toFixed(2)}px ${(-5 * tl).toFixed(2)}px`;
  if (f.tipo === 'imagen') f.im.style.transform = `scale(${1.03 + .012 * tl})`;
  if (f.tipo === 'particulas') pintaParticulas(f.cv, tl);
}
// estallido de partículas rojas desde el centro (fondo de los logos). Todo sale de azar(n): siempre igual.
function pintaParticulas(cv, tl) {
  const g = cv.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const gr = g.createRadialGradient(480, 270, 10, 480, 270, 520); gr.addColorStop(0, '#3a0210'); gr.addColorStop(.5, '#16000f'); gr.addColorStop(1, '#030006');
  g.fillStyle = gr; g.fillRect(0, 0, 960, 540); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 190; i++) {
    const vida = 1.6 + 1.6 * azar(i + .1), fase = ((tl + 3 * azar(i + .2)) % vida) / vida, ang = 6.283 * azar(i + .3), vel = 120 + 520 * azar(i + .4);
    const r = vel * (1 - Math.exp(-2.4 * fase)) * .95, x = 480 + Math.cos(ang) * r * 1.25, y = 270 + Math.sin(ang) * r, tam = 1 + 3.2 * azar(i + .5) * (1 - fase * .5);
    g.globalAlpha = clamp((1 - fase) * 1.1) * clamp(fase * 12); g.fillStyle = azar(i + .6) > .7 ? '#ff7a2a' : '#ff1a22';
    g.beginPath(); g.arc(x, y, tam, 0, 6.2832); g.fill();
  }
}

// ───────────────────────── 5 · armazón de las piezas ─────────────────────────
// imagen que la pieza necesita cargada antes de la primera foto (el motor espera esa promesa)
function imagen(el, padre, cls, src) {
  const im = h('img', cls, '', padre); im.src = ruta(src);
  (el._pend ??= []).push(new Promise(r => { if (im.complete) r(); else { im.onload = r; im.onerror = () => { console.warn('no encuentro la imagen ' + src); r(); }; } }).then(() => im.decode().catch(() => {})));
  return im;
}
const piezas = {};
// pieza(nombre, { fondo, z, sfx…, crea(el, b), pinta(el, tl, b, dur) }): le pone el fondo de inserto (si lo lleva), el orden y la espera de imágenes
function pieza(nombre, def) {
  const { crea, pinta, fondo, ...resto } = def;
  piezas[nombre] = { sinSubs: true, ...resto,
    crea(el, b) {
      const tipo = b.fondo ?? fondo ?? null, lleva = tipo && tipo !== 'ninguno';
      el.style.zIndex = b.z ?? def.z ?? (lleva ? 1 : 3);     // los insertos con fondo van debajo del texto suelto
      el.dur = b.b - b.a; el.conFondo = lleva; el.fondo = creaFondo(el, tipo, b); el.c = h('div', 'c-cont', '', el);
      crea?.(el, b);
    },
    pinta(el, tl, b, _M, dur) {
      SIN_SALIDA = !!b.sinSalida;
      if (el.fondo) pintaFondo(el, el.fondo, tl, dur, b);
      const r = pinta?.(el, tl, b, dur);
      if (el._pend) { const p = Promise.all(el._pend); el._pend = null; return r?.then ? Promise.all([p, r]) : p; }
      return r;
    } };
}
// salida corta común: 0→1 en los últimos `d` segundos de la pieza. Con sinSalida: true en el beat la pieza no se va
// (sirve para dejarla de fondo de la siguiente: despues: 3, sinSalida: true).
let SIN_SALIDA = false;
const sale = (tl, dur, d) => (SIN_SALIDA ? 0 : prog(tl, dur - d, d));
// altura (centro del renglón) para una frase de DELANTE: debajo de la barbilla, al pecho. Nunca sobre ojos ni boca.
function yPecho(b, tam, el) {
  if (b.y != null) return b.y;
  const c = cara(); if (!c) return el.conFondo ? 540 : 700;
  return clamp(Math.max(700, c.abajo + 62 + tam * .36), 560, 900);
}

// ═════════════════════════ A · TEXTO CINÉTICO SOBRE LA PERSONA ═════════════════════════

// ───────── gigante: palabra gigante en crema que pasa DETRÁS de la cabeza (úsala con detras: true) ─────────
// { a, b, pieza: 'gigante', detras: true, texto: 'UNA OFERTA', color: 'rojo' }
// encadenadas (una tras otra, por corte): palabras: [['MÁS', 99.1], ['SENCILLA', 99.45], ['MÁS FÁCIL', 100.3]]  ← segundo de cada una
// opciones: y (borde de arriba de las letras, 130) · tam · ancho (1750) · donde: 'arriba' | 'centro' · entrada/salida: 'corte' | 'fundido'
//           sombra: true (letra «levantada» de la pared) · fondo: 'rejilla' (la convierte en inserto a pantalla completa)
pieza('gigante', {
  sfx: [['whoosh_grave', -.05, .2]],
  crea(el, b) {
    el.its = tiempos(lista(b.palabras ?? b.texto), b);
    el.ds = el.its.map(it => {
      const txt = b.mayus === false ? it.t : mayus(it.t), corta = limpio(txt).replace(/\s/g, '').length <= 4, col = nombreColor(it.color ?? b.color);
      const tam = it.tam ?? b.tam ?? tamPara(txt, b.ancho ?? 1750, 130, corta ? 550 : 370);
      const d = h('div', 'c-t c-gig' + (b.sombra ? ' sombra' : col === 'rojo' || col === 'verde' ? ' c-s-' + col : ''), '', el.c);
      ponPalabras(d, txt); if (col) d.style.color = color(col);
      const ren = txt.split('\n').length, donde = b.donde ?? (el.conFondo ? 'centro' : 'arriba');
      d.style.fontSize = px(tam);
      d.style.top = px(donde === 'centro' ? (b.y ?? 540) - ren * tam * .49 : (b.y ?? 130) - tam * .152);   // .152 em = del borde de la caja a la punta de las mayúsculas
      return d;
    });
  },
  pinta(el, tl, b, dur) {
    const n = el.its.length, cadena = n > 1, ent = b.entrada ?? (cadena ? 'corte' : 'fundido'), sal = b.salida ?? (cadena ? 'corte' : 'fundido');
    el.ds.forEach((d, i) => {
      const t = tl - el.its[i].r, fin = el.its[i + 1]?.r ?? dur;
      if (t < 0 || tl >= fin) { d.style.display = 'none'; return; }
      let op = ent === 'corte' ? (t < F ? .5 : 1) : prog(t, 0, (b.fundido ?? 9) * F), bl = 0;
      let s = 1 + .001 * (t / F);                                               // en el sostén crece muy despacio (+2 % en 20 cuadros)
      if (ent === 'corte') s *= 1 + .04 * (1 - eOut(prog(t, 0, 4 * F)));
      if (i === n - 1 && sal === 'fundido') { const q = sale(tl, dur, 5 * F); op *= 1 - q; bl = 16 * q; }
      d.style.display = ''; d.style.opacity = op; d.style.transform = `scale(${s})`; d.style.filter = bl > .1 ? `blur(${bl.toFixed(1)}px)` : '';
      rayas(d.ws, t);
    });
  },
});

// ───────── frase: frase en minúsculas que entra enorme y se achica hasta quedar al pecho, por DELANTE ─────────
// { a, b, pieza: 'frase', texto: 'gracias a un {v:sistema}' }
// relevo (la vieja se va a la izquierda y la nueva se escribe letra por letra): frases: [['todo esto', 13.2], ['gracias a un sistema', 14.1]]
// opciones: modo: 'zoom' (normal) | 'palabras' (palabra por palabra) | 'tecleo' · y (centro del renglón; si falta, debajo de la barbilla)
//           tam · ancho (1500) · abajo: true en una frase = un renglón más abajo · fondo: 'rejilla' (título sobre inserto, centrado)
pieza('frase', {
  sfx: [['whoosh_rapido', -.06, .22]],
  crea(el, b) {
    el.its = tiempos(lista(b.frases ?? b.texto), b);
    el.ds = el.its.map((it, i) => {
      const d = h('div', 'c-t c-frase' + (el.conFondo ? ' c-plano' : ''), '', el.c), txt = b.mayus ? mayus(it.t) : it.t;
      d.tam = it.tam ?? b.tam ?? tamPara(txt, b.ancho ?? (el.conFondo ? 1680 : 1500), 84, el.conFondo ? 216 : 160);
      d.modo = it.modo ?? (i === 0 ? (b.modo ?? 'zoom') : (b.modo && b.modo !== 'zoom' ? b.modo : 'tecleo'));
      d.style.fontSize = px(d.tam); if (it.color ?? b.color) d.style.color = color(it.color ?? b.color);
      d.txt = txt; if (d.modo === 'tecleo') { d.letras = letrasDe(limpio(txt) === txt ? txt : txt); d.n = -1; } else ponPalabras(d, txt);
      return d;
    });
  },
  pinta(el, tl, b, dur) {
    const n = el.its.length;
    el.ds.forEach((d, i) => {
      const it = el.its[i], t = tl - it.r, fin = el.its[i + 1]?.r ?? dur, ult = i === n - 1;
      if (t < 0 || tl >= fin + (ult ? 0 : 10 * F)) { d.style.display = 'none'; return; }
      d.style.display = '';
      const yc = yPecho(b, d.tam, el) + (it.abajo ? d.tam * .78 : 0);
      d.style.top = px(yc - d.tam * .56);                                       // .56 em = centro visual de un renglón en minúsculas
      let s = 1 + .02 * t, op = 1, dx = 0;                                       // nunca queda quieta: crece muy despacio
      if (d.modo === 'zoom') { s *= 1 + .95 * Math.pow(1 - prog(t, 0, 18 * F), 2.4); op = prog(t, -F * .5, 2 * F); }   // 195 % → 100 % desacelerando
      else if (d.modo === 'tecleo') { const L = d.letras.length, k = clamp(Math.floor((t - 2 * F) / F * (b.letras ?? 1) + 1e-6) + 1, 0, L);   // 1 letra por cuadro
        if (k !== d.n) { d.n = k; if (k < L) { d.innerHTML = htmlTecleo(d.letras, k, false); d.ws = null; } else ponPalabras(d, d.txt); }
        if (d.ws) rayas(d.ws, t - L * F / (b.letras ?? 1)); }
      else subePalabras(d.ws, t);
      if (d.modo === 'zoom') rayas(d.ws, t);
      // salida: la frase vieja se desliza a la izquierda acelerando (≈ 10 cuadros) mientras entra la nueva
      const q = ult ? sale(tl, dur, 8 * F) : prog(tl, fin, 10 * F);
      if (q > 0) {
        if (d.modo === 'palabras' && ult) d.ws.forEach((w, j) => { const qq = prog(tl, dur - 8 * F + j * F, 4 * F); w.style.opacity = 1 - qq; w.style.transform = `translateY(${eIn(qq) * 22}px)`; });
        else { dx = -420 * (.45 * q + .55 * q * q); op *= Math.pow(1 - q, 1.4); }
      }
      d.style.opacity = op; d.style.transform = `translateX(${dx.toFixed(1)}px) scale(${s.toFixed(4)})`;
    });
  },
});

// ───────── golpes: texto por golpes (una palabra o grupo por golpe; el anterior se quita al llegar el siguiente) ─────────
// { a, b, pieza: 'golpes', golpes: [['te vamos a', 224.0], ['enseñar', 224.6], ['el {v:paso a paso}', 225.3]] }   ← o 'te vamos a | enseñar | …'
// opciones: donde: 'pecho' (delante, bajo la barbilla) | 'arriba' | 'centro' | 'abajo' (renglón inferior, chico) · tam · mayus: true · color
pieza('golpes', {
  crea(el, b) {
    el.its = tiempos(lista(b.golpes ?? b.texto), b);
    const donde = el.donde = b.donde ?? (el.conFondo ? 'centro' : 'pecho'), tope = { pecho: 160, arriba: 200, centro: 216, abajo: 76 }[donde];
    el.ds = el.its.map(it => {
      const d = h('div', 'c-t c-golpe' + (el.conFondo ? ' c-plano' : ''), '', el.c), txt = b.mayus ? mayus(it.t) : it.t;
      d.tam = it.tam ?? b.tam ?? tamPara(txt, b.ancho ?? (donde === 'arriba' ? 1300 : 1560), 56, tope);
      d.style.fontSize = px(d.tam); if (it.color ?? b.color) d.style.color = color(it.color ?? b.color);
      ponPalabras(d, txt); d.may = limpio(txt) === limpio(txt).toLocaleUpperCase('es');
      return d;
    });
  },
  pinta(el, tl, b, dur) {
    el.ds.forEach((d, i) => {
      const t = tl - el.its[i].r, fin = el.its[i + 1]?.r ?? dur;
      if (t < 0 || tl >= fin) { d.style.display = 'none'; return; }
      const yc = b.y ?? (el.donde === 'pecho' ? yPecho(b, d.tam, el) : el.donde === 'arriba' ? 182 : el.donde === 'abajo' ? 912 : 540);
      const s = (1 + .07 * (1 - eOut(prog(t, 0, 4 * F)))) * (1 + .03 * t);       // golpe: llega un poco grande y asienta en 4 cuadros; luego crece lento
      d.style.display = ''; d.style.top = px(yc - d.tam * (d.may ? .5 : .56));
      d.style.opacity = (t < F ? .55 : 1) * (i === el.its.length - 1 ? 1 - sale(tl, dur, 3 * F) : 1); d.style.transform = `scale(${s.toFixed(4)})`;
      rayas(d.ws, t);
    });
  },
});

// acomodo de un bloque de texto a un LADO de la cara (izquierda si la persona está corrida a la derecha): nunca la toca
function aUnLado(el, bl, b, tl, dur) {
  const c = cara(), lado = b.lado ?? (c && c.cx < W / 2 ? 'der' : 'izq'), margen = b.x ?? 112;
  const libre = c ? (lado === 'izq' ? c.izq - 64 - margen : W - margen - c.der - 64) : 1100;
  const k = Math.min(1, Math.max(.35, libre / bl.nat)), yc = b.y ?? clamp((c?.cy ?? 400) + 70, 300, 660);
  bl.className = bl.className.replace(/ (izq|der)$/, '') + ' ' + lado;
  bl.style.left = lado === 'izq' ? px(margen) : ''; bl.style.right = lado === 'der' ? px(margen) : '';
  bl.style.top = px(yc - bl.alto / 2); bl.style.transformOrigin = lado === 'izq' ? '0 50%' : '100% 50%';
  const q = sale(tl, dur, 5 * F);
  bl.style.transform = `translateX(${((lado === 'izq' ? 1 : -1) * 10 * tl / Math.max(dur, .5)).toFixed(2)}px) scale(${(k * (1 + .012 * tl)).toFixed(4)})`;
  return q;
}

// ───────── lateral: apoyo a un lado de la cara (renglón chico + renglón fuerte), palabra por palabra ─────────
// { a, b, pieza: 'lateral', chico: 'Esto a', fuerte: 'MILES DE PERSONAS' }   ← con video: 'cerradoDer' queda libre el lado izquierdo
// opciones: lineas: ['uno', { t: 'DOS', fuerte: true }] · lado: 'izq' | 'der' · y (centro del bloque) · x (margen, 112) · tecleo: true
pieza('lateral', {
  crea(el, b) {
    const ls = b.lineas ? lista(b.lineas) : [b.chico && { t: b.chico }, b.fuerte && { t: b.fuerte, fuerte: true }].filter(Boolean);
    el.bl = h('div', 'c-lat izq', '', el.c); el.ws = [];
    for (const l of ls) { const d = h('div', 'l' + (l.fuerte ? ' fuerte' : ''), '', el.bl); if (l.color ?? b.color) d.style.color = color(l.color ?? b.color); if (l.tam) d.style.fontSize = px(l.tam); el.ws.push(...ponPalabras(d, l.t)); }
    el.bl.nat = el.bl.offsetWidth; el.bl.alto = el.bl.offsetHeight;
  },
  pinta(el, tl, b, dur) {
    const q = aUnLado(el, el.bl, b, tl, dur);
    subePalabras(el.ws, tl, b.tecleo ? { paso: F, d: F, dy: 0 } : {});
    el.bl.style.opacity = 1 - q; el.bl.style.filter = q > .02 ? `blur(${(10 * q).toFixed(1)}px)` : '';
  },
});

// ───────── lista: lista lateral que se acumula (un renglón nuevo por cada cosa que se nombra) ─────────
// { a, b, pieza: 'lista', items: [['de tus pies', 53.3], ['de tus manos', 54.2], ['de tu tiempo', 55.1]] }
// Al final se borran todos menos el último, que se queda un momento y sale con desenfoque. Mismas opciones de lado que `lateral`.
pieza('lista', {
  crea(el, b) {
    el.its = tiempos(lista(b.items ?? b.texto), b, .72);
    el.bl = h('div', 'c-lat c-lista izq', '', el.c);
    el.ls = el.its.map(it => { const d = h('div', 'l', '', el.bl); if (b.tam) d.style.fontSize = px(b.tam); if (it.color) d.style.color = color(it.color); ponPalabras(d, it.t); return d; });
    el.bl.nat = el.bl.offsetWidth; el.bl.alto = el.bl.offsetHeight;
  },
  pinta(el, tl, b, dur) {
    aUnLado(el, el.bl, b, tl, dur);
    const cola = Math.min(1, dur * .22), n = el.ls.length;
    el.ls.forEach((d, i) => {
      subePalabras(d.ws, tl - el.its[i].r, { paso: 2 * F });
      const q = i < n - 1 ? prog(tl, dur - cola, 5 * F) : sale(tl, dur, 6 * F);
      d.style.opacity = 1 - q; d.style.filter = q > .02 ? `blur(${((i < n - 1 ? 5 : 12) * q).toFixed(1)}px)` : '';
    });
  },
});

// ───────── rotulo: rótulo de máquina de escribir (amarillo condensado: credenciales, nombres, lugares) ─────────
// { a, b, pieza: 'rotulo', texto: 'EMPRESARIO' }   ← encima de un `clip`, de una foto o de la persona
// varios seguidos: rotulos: [['EMPRESARIO', 20.0], ['CONFERENCISTA\nINTERNACIONAL', 20.8]]
// opciones: donde: 'centro' | 'abajo' | 'izq' | 'der' · color ('amarillo'; 'crema' para nombres y lugares) · tam · y · cursor: false · letras (por cuadro, 1.6)
pieza('rotulo', {
  sfx: [['teclear', 0, .22]],
  crea(el, b) {
    el.its = tiempos(lista(b.rotulos ?? b.texto), b);
    el.d = h('div', 'c-rot' + (b.fuente === 'poppins' ? ' poppins' : '') + (b.sombra === false ? '' : ' sombra'), '<span></span>', el.c);
    el.d.style.color = color(b.color ?? 'amarillo'); el.donde = b.donde ?? 'centro';
    const o = b.fuente === 'poppins' ? {} : { fam: 'Roboto Condensed', peso: 800 }, lat = el.donde === 'izq' || el.donde === 'der';
    el.its.forEach(it => { const txt = b.mayus === false ? it.t : mayus(it.t); it.letras = letrasDe(txt); it.ren = txt.split('\n').length;
      it.tam = it.tam ?? b.tam ?? tamPara(txt, lat ? 500 : el.donde === 'centro' ? 1300 : 1500, 60, el.donde === 'centro' && it.ren === 1 ? 225 : 138, o); });
    if (lat) { el.d.style.width = px(640); el.d.style.left = px(el.donde === 'izq' ? 0 : 1280); }
    el.k = null;
  },
  pinta(el, tl, b, dur) {
    let i = 0; while (i < el.its.length - 1 && tl >= el.its[i + 1].r) i++;
    const it = el.its[i], t = tl - it.r, n = clamp(Math.floor(t / F * (b.letras ?? 1.6) + 1e-6) + 1, 0, it.letras.length);
    const cur = b.cursor !== false && (n < it.letras.length || (t % .25) < .1), k = `${i}/${n}/${cur}`;   // el cursor parpadea 4 veces por segundo
    if (k !== el.k) { el.k = k; el.d.firstChild.innerHTML = htmlTecleo(it.letras, n, cur); }
    const alto = it.ren * it.tam * 1.02;
    el.d.style.fontSize = px(it.tam);
    el.d.style.top = px(b.y != null ? b.y - alto / 2 : el.donde === 'centro' ? 540 - alto / 2 : el.donde === 'abajo' ? 962 - alto : 300 - alto / 2);
    el.d.style.transform = `scale(${(1 + .01 * tl).toFixed(4)})`;
  },
});

// ───────── separadas: una sola palabra de letras separadas que se juntan (negación fuerte) ─────────
// { a, b, pieza: 'separadas', detras: true, texto: 'MENTIRA' }   ← a la altura de los ojos, DETRÁS de la persona
// opciones: color ('rojo') · tam · y · separa (0.55 = hueco entre letras, en tamaños de letra) · fondo: 'rejilla'
pieza('separadas', {
  sfx: [['boom', -.04, .3]],
  crea(el, b) {
    const txt = b.mayus === false ? b.texto : mayus(b.texto);
    el.sep = b.separa ?? .55; el.tam = b.tam ?? tamPara(txt, b.ancho ?? 1655, 90, 230, { ls: el.sep });
    el.d = h('div', 'c-t c-sep', '', el.c); ponPalabras(el.d, txt); el.d.style.fontSize = px(el.tam); el.d.style.color = color(b.color ?? 'rojo');
  },
  pinta(el, tl, b, dur) {
    const c = el.conFondo ? null : cara(), yc = b.y ?? (c ? c.cy + c.h * .04 : 540), q = sale(tl, dur, 4 * F);
    const ls = el.sep * (1 + .75 * (1 - eOut(prog(tl, 0, 16 * F))) - .1 * prog(tl, 16 * F, Math.max(.01, dur - 16 * F)));   // llegan abiertas, se juntan y siguen cerrándose lento
    el.d.style.top = px(yc - el.tam * .5); el.d.style.letterSpacing = `${ls.toFixed(4)}em`; el.d.style.textIndent = `${ls.toFixed(4)}em`;
    el.d.style.opacity = prog(tl, 0, 12 * F) * (1 - q); el.d.style.filter = q > .02 ? `blur(${(18 * q).toFixed(1)}px)` : '';
  },
});

// ───────── reloj: reloj de rayas (sin aro) que gira; va DETRÁS de la persona, a un lado ─────────
// { a, b, pieza: 'reloj', detras: true }   opciones: x, y (centro: 530, 476) · radio (380) · color
pieza('reloj', {
  crea(el, b) {
    const R = el.R = b.radio ?? 380, col = color(b.color ?? 'crema');
    let s = '';
    for (let i = 0; i < 12; i++) s += `<rect x="${R - 62}" y="-7" width="60" height="14" fill="${col}" transform="rotate(${i * 30})"/>`;
    el.d = h('div', 'c-abs', `<svg viewBox="${-R - 10} ${-R - 10} ${2 * R + 20} ${2 * R + 20}" width="${2 * R + 20}" height="${2 * R + 20}" style="display:block;overflow:visible">${s}<rect class="larga" x="-7" y="${-R * .53}" width="14" height="${R * .53}" rx="3" fill="${col}"/><rect class="corta" x="-8" y="${-R * .34}" width="16" height="${R * .34}" rx="3" fill="${col}"/><circle r="15" fill="${col}"/></svg>`, el.c);
    el.larga = el.d.querySelector('.larga'); el.corta = el.d.querySelector('.corta');
  },
  pinta(el, tl, b, dur) {
    const c = cara(), R = el.R, x = b.x ?? (c && c.cx < W / 2 ? 1390 : 530), y = b.y ?? 476, q = sale(tl, dur, 4 * F);
    const s = lerp(.08, 1, eOut(prog(tl, 0, 8 * F))) * (1 + .02 * tl);              // nace de ≈ 30 px y crece en 8 cuadros
    el.d.style.left = px(x - R - 10); el.d.style.top = px(y - R - 10);
    el.d.style.transform = `perspective(1500px) rotateY(${b.giro ?? -24}deg) rotateX(9deg) scale(${s.toFixed(4)})`;
    el.d.style.opacity = prog(tl, 0, 2 * F) * (1 - q) * (b.opacidad ?? .92); el.d.style.filter = q > .02 ? `blur(${(14 * q).toFixed(1)}px)` : '';
    el.larga.setAttribute('transform', `rotate(${(tl * 720) % 360})`); el.corta.setAttribute('transform', `rotate(${50 + tl * 60})`);   // la larga da una vuelta cada 0.5 s
  },
});

// ───────── conteo: «En menos de» + «7 minutos» (promesa con cifra). El texto va DELANTE, por debajo de la barbilla ─────────
// { a, b, pieza: 'conteo', chico: 'En menos de', fuerte: '7 minutos' }   + un extra { pieza: 'reloj', detras: true } para el reloj
// opciones: color ('rojo', el del renglón fuerte) · aFuerte (segundo en que entra la cifra) · x (152) · y · cuenta: false (para que el número no suba)
pieza('conteo', {
  sfx: [['tic', 0, .25]],
  crea(el, b) {
    el.bl = h('div', 'c-conteo', '', el.c);
    el.ch = h('div', '', '', el.bl); el.ch.style.cssText = 'font-size:100px;'; ponPalabras(el.ch, b.chico ?? '');
    const sang = b.sangria ?? 259, tamF = b.tam ?? tamPara(b.fuerte ?? '', W - (b.x ?? 152) - sang - 90, 80, 197);   // la cifra nunca se sale de la pantalla
    el.fu = h('div', '', '', el.bl); el.fu.style.cssText = `font-size:${tamF}px;margin:14px 0 0 ${sang}px;color:${color(b.color ?? 'rojo')};transform-origin:0 60%;`;
    const m = /^(\D*)(\d[\d.,]*)(.*)$/s.exec(b.fuerte ?? '');
    el.num = m && b.cuenta !== false ? { pre: m[1], n: Number(m[2].replace(/[.,]/g, '')), pos: m[3], sep: /[.,]/.test(m[2]) } : null;
    el.fu.textContent = b.fuerte ?? ''; el.alto = el.bl.offsetHeight;
  },
  pinta(el, tl, b, dur) {
    const c = cara(), top = b.y ?? (c ? clamp(c.abajo + 26, 540, 720) : 540 - el.alto / 2), tF = b.aFuerte != null ? b.aFuerte - b.a : Math.min(.4, dur * .3), t = tl - tF, q = sale(tl, dur, 4 * F);
    el.bl.style.left = px(b.x ?? 152); el.bl.style.top = px(top); el.bl.style.transform = `scale(${(1 + .012 * tl).toFixed(4)})`;
    el.bl.style.opacity = 1 - q; el.bl.style.filter = q > .02 ? `blur(${(12 * q).toFixed(1)}px)` : '';
    subePalabras(el.ch.ws, tl, { paso: 2 * F, d: 4.5 * F, dy: 18 });
    if (el.num) { const v = Math.round(lerp(0, el.num.n, eOut(prog(t, 0, 10 * F)))); el.fu.textContent = el.num.pre + (el.num.sep ? v.toLocaleString('en-US') : v) + el.num.pos; }
    el.fu.style.opacity = prog(t, 0, 4 * F); el.fu.style.transform = `scale(${(1 + .12 * (1 - eOut(prog(t, 0, 6 * F)))).toFixed(4)})`;
  },
});

// ───────── sello: círculo con una palabra adentro («NO») hecho de puntos; va DETRÁS de la persona, a un lado ─────────
// { a, b, pieza: 'sello', detras: true, texto: 'NO' }   opciones: x, y (centro: 480, 500) · diam (900) · color
pieza('sello', {
  crea(el, b) {
    const D = el.D = b.diam ?? 900, P = 14, N = Math.floor(D / P), o = document.createElement('canvas'); o.width = o.height = N;
    const g = o.getContext('2d'); g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = Math.max(1.4, N * .028); g.beginPath(); g.arc(N / 2, N / 2, N * .47, 0, 6.2832); g.stroke();
    const txt = b.texto ?? 'NO'; g.textAlign = 'center'; g.textBaseline = 'middle'; let tam = N * .5; g.font = `700 ${tam}px Poppins`;
    tam *= Math.min(1, (N * .7) / g.measureText(txt).width); g.font = `700 ${tam}px Poppins`; g.fillText(txt, N / 2, N / 2 + tam * .05);
    const px_ = g.getImageData(0, 0, N, N).data; el.pts = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const a = px_[(y * N + x) * 4 + 3]; if (a > 70) el.pts.push([x * P + P / 2, y * P + P / 2, a / 255, azar(x * 13.1 + y * 7.7)]); }
    el.cv = h('canvas', 'c-abs', '', el.c); el.cv.width = el.cv.height = D; el.col = b.color ? color(b.color) : '#c3734b';
  },
  pinta(el, tl, b, dur) {
    const c = cara(), D = el.D, x = b.x ?? (c && c.cx < W / 2 ? 1440 : 480), y = b.y ?? 500, g = el.cv.getContext('2d'), p = prog(tl, 0, 16 * F), q = sale(tl, dur, 6 * F);
    el.cv.style.left = px(x - D / 2); el.cv.style.top = px(y - D / 2); el.cv.style.opacity = (b.opacidad ?? .8) * (1 - q);
    el.cv.style.transform = `rotate(${(-6 + 1.2 * tl).toFixed(2)}deg) scale(${(.96 + .02 * tl).toFixed(4)})`;
    g.clearRect(0, 0, D, D); g.fillStyle = el.col;
    for (const [px0, py0, a, z] of el.pts) {
      if (z > p * 1.15) continue;                                               // los puntos van apareciendo en 16 cuadros
      const late = .72 + .28 * Math.sin(tl * 5 + z * 40);                        // y titilan un poco, como tinta de sello
      g.globalAlpha = a * late; g.beginPath(); g.arc(px0, py0, 4.6 * (.75 + .25 * late), 0, 6.2832); g.fill();
    }
  },
});

// ═════════════════════════ B · INSERTOS A PANTALLA COMPLETA ═════════════════════════
// Todos aceptan `fondo` (ver sección 4). En el beat pon video: 'oculto' (salvo los que dicen otra cosa).

// ───────── cortina: cortina negra arriba con título; la persona queda debajo (video: 'bajo') ─────────
// { a, b, video: 'bajo', pieza: 'cortina', textos: [['HE SIDO CAPAZ', 3.5], { t: 'de construir', a: 4.6, chico: true }] }
// La cortina arranca tapando todo y sube hasta dejar una franja negra con cuadrícula. `chico: true` = renglón chico arriba a la izquierda.
pieza('cortina', {
  sfx: [['boom', 0, .3]],
  crea(el, b) {
    el.banda = h('div', 'c-cortina', '', el.c); el.banda.style.background = '#000'; el.rej = h('div', 'c-rej', '', el.banda);
    el.banda.style.maskImage = el.banda.style.webkitMaskImage = 'linear-gradient(180deg, #000 0, #000 calc(100% - 190px), transparent 100%)';
    el.its = tiempos(lista(b.textos ?? b.titulo ?? b.texto), b); el.alto = b.alto ?? 160;
    el.ds = el.its.map(it => {
      const d = h('div', 'c-t c-plano', '', el.c), txt = it.chico || b.mayus === false ? it.t : mayus(it.t);
      d.tam = it.tam ?? (it.chico ? 116 : tamPara(txt, 1520, 80, 203)); d.style.fontSize = px(d.tam); if (it.color) d.style.color = color(it.color);
      if (it.chico) { d.style.textAlign = 'left'; d.style.left = px(92); d.style.transformOrigin = '0 50%'; d.style.top = px(26 * el.alto / 160); }
      else d.style.top = px(el.alto * .39 - d.tam * .152);
      ponPalabras(d, txt); return d;
    });
  },
  pinta(el, tl, b, dur) {
    const p = eOut(prog(tl, 0, 9 * F)), q = eIn(sale(tl, dur, 6 * F));
    const Y = lerp(lerp(H + 300, el.alto + 190, p), -60, q);                       // borde de abajo de la cortina (incluye 190 px de degradado)
    el.banda.style.height = px(Y + 40); el.banda.style.transform = `rotate(${(-.9 + .15 * Math.sin(tl * 1.4)).toFixed(3)}deg)`;
    dibujaRejilla(lienzoRejilla(el.rej, el), M.t, lerp(.6, .3, prog(tl, 0, 12 * F)));
    el.ds.forEach((d, i) => {
      const it = el.its[i], t = tl - it.r, fin = el.its[i + 1]?.r ?? dur;
      if (t < 0 || tl >= fin) { d.style.display = 'none'; return; }
      d.style.display = ''; d.style.opacity = 1 - q; d.style.transform = `scale(${(1 + .014 * t).toFixed(4)})`;
      if (it.chico) subePalabras(d.ws, t, { paso: 2 * F });
      else d.ws.forEach((w, j) => { const v = prog(t, j * F, F); w.style.opacity = v * lerp(.84, 1, d.ws.length > 1 ? j / (d.ws.length - 1) : 1); w.style.transform = `translateY(${(1 - eOut(prog(t, j * F, 4 * F))) * 14}px)`; });   // una palabra por cuadro
    });
  },
});

// ───────── escalera: título itálico gigante en escalera (remate de una terna). Cada golpe es más grande que el anterior ─────────
// { a, b, video: 'completo', pieza: 'escalera', golpes: [['QUE VENDEMOS', 9.25], ['{n:Y QUE TÚ VENDAS}', 10.75], ['DE FORMA\n{v:AUTOMÁTICA}', 11.6]] }
// Fondo por defecto: 'velo' (la persona o el inserto de atrás, desenfocado y gris). Un solo golpe = solo el título grande (2 renglones, uno en color).
pieza('escalera', {
  fondo: 'velo', sfx: [['whoosh_grave', -.05, .25]],
  crea(el, b) {
    el.its = tiempos(lista(b.golpes ?? b.texto), b); const n = el.its.length;
    el.ds = el.its.map((it, i) => {
      const d = h('div', 'c-t c-esc', '', el.c), txt = b.mayus === false ? it.t : mayus(it.t);
      const tope = it.tam ?? (i === n - 1 ? 244 : n === 2 || i === n - 2 && n > 2 ? 150 : 74) * (n === 2 && i === 0 ? .7 : 1), peso = tope >= 200 ? 900 : tope >= 100 ? 800 : 600;
      d.tam = tamPara(txt, b.ancho ?? 1700, 40, tope, { peso, ital: true }); d.ren = txt.split('\n').length;
      d.style.cssText += `font-size:${d.tam}px;font-weight:${peso};top:${(b.y ?? 540) - d.ren * d.tam * .45}px;text-shadow:${(d.tam * .034).toFixed(1)}px ${(d.tam * .034).toFixed(1)}px 0 rgba(0,0,0,.7);`;
      if (it.color) d.style.color = color(it.color); ponPalabras(d, txt); return d;
    });
  },
  pinta(el, tl, b, dur) {
    const n = el.its.length;
    el.ds.forEach((d, i) => {
      const t = tl - el.its[i].r, tn = i < n - 1 ? tl - el.its[i + 1].r : -1;
      if (t < 0 || tn > 25 * F) { d.style.display = 'none'; return; }
      let op = prog(t, 0, 14 * F);                                                 // fundido de 14 cuadros…
      const s = lerp(.75, 1, eOut(prog(t, 0, 25 * F))) + .045 * Math.max(0, t - 25 * F);   // …con escala 75 → 100 % en 25, y sigue creciendo lento
      if (tn >= 0) op = lerp(op, .3, prog(tn, 0, 5 * F)) * (1 - prog(tn, 5 * F, 20 * F));   // el golpe anterior baja al 30 % y se va en 20 cuadros
      else if (i === n - 1) op *= 1 - sale(tl, dur, 5 * F);
      d.style.display = ''; d.style.opacity = op; d.style.transform = `scale(${s.toFixed(4)})`;
    });
  },
});

// ───────── igual: signo «=» entre dos ideas (frase → «=» → frase) ─────────
// { a, b, video: 'oculto', pieza: 'igual', uno: 'si a esto le pones', dos: 'el atajo definitivo', aIgual: 157.6, aDos: 158.7 }
pieza('igual', {
  fondo: 'rejilla', sfx: [['boom', 0, .28]],
  crea(el, b) {
    el.t1 = b.aIgual != null ? b.aIgual - b.a : el.dur * .3; el.t2 = b.aDos != null ? b.aDos - b.a : el.dur * .54;
    const haz = txt => { const d = h('div', 'c-t c-plano', '', el.c); d.tam = tamPara(txt, 1700, 80, 216); d.style.fontSize = px(d.tam); d.style.top = px(540 - d.tam * .56); ponPalabras(d, txt); return d; };
    el.uno = haz(b.uno ?? ''); el.dos = haz(b.dos ?? ''); el.ig = h('div', 'c-abs c-igual', '<i></i><i></i>', el.c);
    if (b.colorDos) el.dos.style.color = color(b.colorDos);
  },
  pinta(el, tl, b, dur) {
    const fase = (d, t, lado, fin) => {
      if (t < 0 || tl >= fin) { d.style.display = 'none'; return; }
      const s = (1 + 1.5 * Math.pow(1 - prog(t, 0, 15 * F), 2.4)) * (1 + .014 * t), dx = lado * 560 * (1 - eOut(prog(t, 0, 12 * F)));   // entra enorme desde un lado
      d.style.display = ''; d.style.opacity = prog(t, -F * .5, 2 * F) * (1 - prog(tl, fin - 2 * F, 2 * F)); d.style.transform = `translateX(${dx.toFixed(1)}px) scale(${s.toFixed(4)})`;
    };
    fase(el.uno, tl, -1, el.t1 + F); fase(el.dos, tl - el.t2, 1, dur + 1);
    const t = tl - el.t1, ig = el.ig;
    if (t < 0 || tl >= el.t2 + F) { ig.style.display = 'none'; return; }
    const w = 330 + 553 * Math.exp(-(t / F) / 14), a = w / 4.5;                    // medido: 883 px al nacer, 650 a los 7 cuadros, 407 a los 31
    ig.style.cssText = `display:block;left:${960 - w / 2}px;top:${540 - 1.5 * a}px;width:${w}px;height:${3 * a}px;opacity:${prog(t, 0, 2 * F) * (1 - prog(tl, el.t2 - F, 2 * F))};`;
    ig.children[0].style.cssText = `top:0;height:${a}px;`; ig.children[1].style.cssText = `top:${2 * a}px;height:${a}px;`;
  },
});

// ───────── icono: íconos de línea que se dibujan (sustantivos concretos: «ese producto», «tus clientes») ─────────
// { a, b, video: 'oculto', pieza: 'icono', icono: 'caja' }  ·  dos o más: iconos: [['caja', 177.6], ['mensajes', 180.7]] (el primero se corre y entra el otro)
// opciones: texto (renglón debajo) · tam (320) · acento: false (sin el detalle rojo) | 'verde' · fondo: 'crema' (el ícono sale en negro)
//           fondo: 'ninguno' + x, y + detras: true = ícono de apoyo a un lado de la persona. Nombres: los archivos de iconos/ (ver ESTILO.md)
pieza('icono', {
  fondo: 'rejilla',
  crea(el, b) {
    const noms = [].concat(b.iconos ?? b.icono ?? []);
    el.its = tiempos(noms.map(x => (typeof x === 'string' ? { t: x } : Array.isArray(x) ? { t: x[0], a: x[1] } : { ...x, t: x.t ?? x.icono })), b, .62);
    el.tam = b.tam ?? 320;
    el.is = el.its.map(it => {
      const d = h('div', 'c-ico', `<svg viewBox="0 0 24 24" stroke-width="${b.trazo ?? 1.25}">${ICONOS[it.t] ?? ''}</svg>`, el.c);
      if (!ICONOS[it.t]) console.warn(`no existe el ícono "${it.t}" (ver plantillas/cinetico/iconos/)`);
      d.style.width = d.style.height = px(el.tam); d.tr = [...d.firstChild.children];
      d.tr.forEach(p => { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; });
      const ac = it.acento ?? b.acento; if (ac !== false && d.tr.length > 1) d.tr.at(-1).style.stroke = color(typeof ac === 'string' ? ac : 'carmin');
      if (b.color) d.firstChild.style.stroke = color(b.color);
      return d;
    });
    if (b.texto) { el.tx = h('div', 'c-t c-ico-txt c-plano', '', el.c); el.tx.style.fontSize = px(tamPara(b.texto, 1500, 50, 84, { peso: 500 })); ponPalabras(el.tx, b.texto); }
  },
  pinta(el, tl, b, dur) {
    const paso = el.tam + (b.hueco ?? 120), cy = b.y ?? (el.tx ? 470 : 540), cx = b.x ?? 960, q = sale(tl, dur, 5 * F), claro = el.fondo?.tipo === 'crema';
    let m = 0; el.its.forEach((it, i) => { if (i) m += eInOut(prog(tl, it.r - 2 * F, 10 * F)); });   // cuántos hay ya (suavizado): el grupo se recentra
    el.is.forEach((d, i) => {
      const t = tl - el.its[i].r; if (t < 0) { d.style.display = 'none'; return; }
      d.style.display = ''; d.style.left = px(cx + (i - m / 2) * paso - el.tam / 2); d.style.top = px(cy - el.tam / 2); d.style.opacity = 1 - q;
      d.style.transform = `scale(${(1 + .05 * eOut(prog(t, 0, 4)) + .012 * Math.sin(tl * 2.2 + i)).toFixed(4)})`;
      d.style.filter = claro ? '' : `drop-shadow(0 0 ${(6 + 4 * Math.sin(tl * 3 + i)).toFixed(1)}px rgba(241,233,210,.4))`;
      d.tr.forEach((p, j) => { p.style.strokeDashoffset = (1 - eInOut(prog(t, j * 1.5 * F, 11 * F))).toFixed(4); p.style.opacity = prog(t, j * 1.5 * F, 2 * F); });   // cada trazo se dibuja en ≈ 12 cuadros
    });
    if (el.tx) { el.tx.style.top = px(cy + el.tam / 2 + 46); el.tx.style.opacity = 1 - q; subePalabras(el.tx.ws, tl - 8 * F); }
  },
});

// ───────── figuras: figuras de personas que aparecen y se van pintando de color (multitud / conteo de clientes) ─────────
// multitud a pantalla completa:  { a, b, video: 'oculto', pieza: 'figuras', modo: 'multitud', n: 28, texto: '{n} clientes nuevos' }
// junto a la persona:            { a, b, pieza: 'figuras', detras: true, n: 9 }   (video: 'cerradoDer' deja libre la izquierda)
// opciones: color ('menta') · pintadas (cuántas se pintan; todas) · cada (segundos entre una y otra) · lado: 'izq' | 'der'
let UID = 0;
const PALETA_MULTITUD = ['#1f6fb5', '#1c8a4a', '#7a1730', '#2a9db0', '#16306a', '#0ce67e'];
pieza('figuras', {
  crea(el, b) {
    const n = el.n = b.n ?? 9, multi = el.multi = (b.modo ?? (el.conFondo ? 'multitud' : 'lado')) === 'multitud';
    el.g = h('div', 'c-abs', '', el.c); el.g.style.cssText += 'left:0;top:0;width:1920px;height:1080px;transform-origin:50% 70%;';
    if (multi) { const p = h('div', 'c-plataforma', '', el.g); p.style.cssText += 'left:250px;top:500px;width:1420px;height:540px;'; el.plat = p; }
    const orden = [...Array(n).keys()].sort((x, y) => azar(x + 9.3) - azar(y + 9.3)), lugares = [];
    if (multi) { const filas = n > 14 ? 4 : n > 6 ? 3 : 2, porFila = Math.ceil(n / filas);
      for (let i = 0; i < n; i++) { const f = Math.floor(i / porFila), k = i % porFila, enFila = Math.min(porFila, n - f * porFila), yy = 660 + f * (340 / filas), medio = Math.min(570, 710 * Math.sqrt(Math.max(.05, 1 - ((yy - 770) / 270) ** 2)) - 95);
        lugares.push({ x: 960 + (enFila > 1 ? ((k + (f % 2 ? .28 : -.22)) / (enFila - 1) - .5) * 2 * medio : 0) + 54 * (azar(i + 3.1) - .5), y: yy + 30 * (azar(i + 4.1) - .5), al: 230 + f * 24, f }); } }
    else { const cols = Math.ceil(Math.sqrt(n)), filas = Math.ceil(n / cols), al = Math.min(190, 522 / filas * .94);
      for (let i = 0; i < n; i++) { const c = i % cols, f = Math.floor(i / cols);
        lugares.push({ x: 157 + (c + .5 + (f % 2 ? .28 : 0)) * (605 / (cols + .3)) + 30 * (azar(i + 5.1) - .5), y: 197 + (f + 1) * (522 / filas) + 22 * (azar(i + 6.1) - .5), al, f }); } }
    el.fs = lugares.map((L, i) => {
      const id = 'cf' + (UID++), col = multi && !b.color ? PALETA_MULTITUD[Math.floor(azar(i + 7.7) * PALETA_MULTITUD.length)] : color(b.color ?? 'menta');
      const d = h('div', 'c-fig', `<svg viewBox="0 0 60 150"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="150"><stop offset="1" stop-color="#efe7d0"/><stop offset="1" stop-color="${col}"/></linearGradient></defs><g fill="url(#${id})"><circle cx="30" cy="14" r="13"/><path d="M14 32h32a11 11 0 0 1 11 11v36a5.5 5.5 0 0 1-11 0V50h-2v38H16V50h-2v29a5.5 5.5 0 0 1-11 0V43a11 11 0 0 1 11-11z"/><path d="M16 86h28v56a6.5 6.5 0 0 1-13 0V104h-2v38a6.5 6.5 0 0 1-13 0z"/></g></svg>`, el.g);
      d.L = L; d.turno = orden.indexOf(i); d.stops = d.querySelectorAll('stop'); d.style.zIndex = 10 + Math.round(L.y);
      d.style.width = px(L.al * .4); d.style.height = px(L.al); d.style.top = px(L.y - L.al);
      return d;
    });
    if (b.texto) { el.tx = h('div', 'c-t' + (multi ? ' c-plano' : ''), '', el.c); el.tx.style.fontSize = px(b.tamTexto ?? (multi ? 120 : 64)); el.tx.style.top = px(multi ? 150 : 770); if (!multi) { el.tx.style.width = px(760); el.tx.style.left = px(80); } }
  },
  pinta(el, tl, b, dur) {
    const n = el.n, cada = b.cada ?? clamp(dur * .55 / n, 1.5 * F, 6 * F), c = el.multi ? null : cara(), der = (b.lado ?? (c && c.cx < W / 2 ? 'der' : 'izq')) === 'der';
    const nivel = b.nivel ?? (el.multi ? .8 : .5), pintadas = b.pintadas ?? n, q = sale(tl, dur, 5 * F); let van = 0;
    el.g.style.transform = `scale(${(1 + .05 * tl / Math.max(dur, 1)).toFixed(4)})`; el.g.style.opacity = 1 - q;
    if (el.plat) { el.plat.style.opacity = prog(tl, 0, 3 * F); el.plat.style.filter = tl < 3 * F ? `blur(${(18 * (1 - prog(tl, 0, 3 * F))).toFixed(1)}px)` : ''; }
    el.fs.forEach(d => {
      const t = tl - d.turno * cada - (el.multi ? 3 * F : 0); if (t < 0) { d.style.display = 'none'; return; }
      van++; d.style.display = ''; d.style.left = px((der ? W - d.L.x : d.L.x) - d.L.al * .2);
      d.style.transform = `scale(${(eBack(prog(t, 0, 6 * F)) * (1 + .015 * Math.sin(tl * 2.4 + d.turno))).toFixed(4)})`;   // «pop»: 0 → 110 → 100 % en 6 cuadros
      const lv = d.turno < pintadas ? nivel * eOut(prog(t, 4 * F, 10 * F)) : 0, off = (1 - lv).toFixed(4);   // el color sube desde los pies
      d.stops[0].setAttribute('offset', off); d.stops[1].setAttribute('offset', off);
    });
    if (el.tx) { const txt = b.texto.replace('{n}', Math.min(van, pintadas)); if (el.tx.k !== txt) { el.tx.k = txt; el.tx.textContent = txt; }
      if (der && !el.multi) el.tx.style.left = px(W - 840); el.tx.style.opacity = prog(tl, 2 * F, 5 * F) * (1 - q); el.tx.style.transform = `scale(${(1 + .01 * tl).toFixed(4)})`; }
  },
});

// fuente de imagen de una pieza: una imagen fija (`imagen: 'img/x.png'`) o un video sacado a cuadros (`pantalla: 'nombre'` →
// proyectos/<video>/pantalla/<nombre>/000001.jpg… + datos.json; los saca motor/pantalla.py)
function creaFuente(el, padre, b) {
  const Fu = { im: null, datos: null };
  if (b.pantalla) { Fu.im = h('img', '', '', padre); Fu.base = `/proyecto/pantalla/${b.pantalla}`;
    Fu.lista = fetch(Fu.base + '/datos.json').then(r => r.json()).then(d => { Fu.datos = d; }).catch(() => { Fu.datos = { fps: 30, n: 1 }; console.warn(`falta ${Fu.base}/datos.json (corre motor/pantalla.py)`); }); }
  else Fu.im = imagen(el, padre, '', b.imagen);
  return Fu;
}
// pone el cuadro que toca. Campos del beat: desde (segundo del video de apoyo donde empieza), velocidad (1), bucle (true = se repite)
function pintaFuente(Fu, tl, b) {
  if (!Fu.base) return null;
  const pon = () => { const d = Fu.datos; let n = Math.floor(((b.desde ?? 0) + Math.max(0, tl) * (b.velocidad ?? 1)) * (d.fps || 30) + 1e-6) + 1;
    n = b.bucle ? ((n - 1) % d.n) + 1 : clamp(n, 1, d.n);
    return ponImagen(Fu.im, `${Fu.base}/${String(n).padStart(6, '0')}.jpg`); };
  return Fu.datos ? pon() : Fu.lista.then(pon);
}
// acercamiento lento sobre una imagen o clip: acerca: [1, 1.08] y mira: [x, y] (0–1: hacia dónde se acerca)
function paneo(im, tl, dur, b, quieto) {
  const a = b.acerca ?? (quieto ? [1.02, 1.09] : [1, 1.03]), z = Array.isArray(a) ? lerp(a[0], a[1], clamp(tl / Math.max(dur, .1))) : a, m = b.mira ?? [.5, .5];
  im.style.transform = `translate(${(-(z - 1) * W * m[0]).toFixed(2)}px, ${(-(z - 1) * H * m[1]).toFixed(2)}px) scale(${z.toFixed(5)})`;
}

// ───────── clip: toma de apoyo (video de terceros o del evento) a pantalla completa, con texto encima opcional ─────────
// { a, b, video: 'oculto', pieza: 'clip', pantalla: 'reloj-dorado', texto: 'Y VAMOS A EMPEZAR A' }     ← o imagen: 'img/toma.jpg'
// Antes: python motor/pantalla.py <video> proyectos/<n> reloj-dorado. Opciones: desde · velocidad · bucle · cabe: true (videos verticales, sin recortar)
//        vineta: false · oscurece: 0.4 · texto + color + tam + donde ('centro' | 'arriba' | 'abajo'). Rótulos y palabras gigantes van aparte, como extras.
pieza('clip', {
  crea(el, b) {
    el.p = h('div', 'c-pantalla' + (b.cabe ? ' cabe' : ''), '', el.c); el.Fu = creaFuente(el, el.p, b);
    if (b.realce !== false) el.Fu.im.style.filter = 'contrast(1.08) saturate(1.16)';
    if (b.vineta !== false) h('div', 'c-vineta', '', el.p);
    if (b.oscurece) { const v = h('div', 'c-abs', '', el.p); v.style.cssText += `inset:0;background:rgba(0,0,0,${b.oscurece});`; }
    if (b.texto) { const txt = b.texto; el.tx = h('div', 'c-t c-frase', '', el.c); el.tam = b.tam ?? tamPara(txt, 1740, 70, 170); el.tx.style.fontSize = px(el.tam); if (b.color) el.tx.style.color = color(b.color); ponPalabras(el.tx, txt); el.ren = txt.split('\n').length; }
  },
  pinta(el, tl, b, dur) {
    paneo(el.Fu.im, tl, dur, b, !b.pantalla);
    if (el.tx) { const yc = b.y ?? { arriba: 200, abajo: 880 }[b.donde] ?? 540, q = sale(tl, dur, 4 * F);
      el.tx.style.top = px(yc - el.ren * el.tam * .5); el.tx.style.opacity = prog(tl, 0, 6 * F) * (1 - q);
      el.tx.style.transform = `scale(${((1 + .3 * Math.pow(1 - prog(tl, 0, 8 * F), 2.4)) * (1 + .012 * tl)).toFixed(4)})`; }
    return pintaFuente(el.Fu, tl, b);
  },
});

// ───────── captura: captura de pantalla (o grabación) con la ventanita de la persona arriba a la derecha ─────────
// { a, b, video: 'ventanita', videoEncima: true, pieza: 'captura', imagen: 'img/panel.png', mira: [.3, .4] }   ← o pantalla: 'recorrido'
pieza('captura', {
  crea(el, b) { el.p = h('div', 'c-pantalla' + (b.cabe ? ' cabe' : ''), '', el.c); el.Fu = creaFuente(el, el.p, b); },
  pinta(el, tl, b, dur) { paneo(el.Fu.im, tl, dur, b, !b.pantalla); return pintaFuente(el.Fu, tl, b); },
});

// ───────── columnas: pantalla en 3 columnas (apoyo · persona · apoyo) con una cifra gigante que las cruza ─────────
// { a, b, video: 'columna', pieza: 'columnas', izq: ['img/a.jpg', 'img/b.jpg'], der: 'img/c.jpg', cifra: '32', texto: 'CIUDADES', rotulos: ['MONTERREY', 'BOGOTÁ'] }
pieza('columnas', {
  crea(el, b) {
    const col = (x, fotos) => { const d = h('div', 'c-col', '', el.c); d.style.left = px(x); d.ims = [].concat(fotos ?? []).map(f => imagen(el, d, '', f)); h('div', 'c-vineta', '', d); return d; };
    el.cols = [col(0, b.izq), col(1280, b.der)];
    el.tapa = h('div', 'c-abs', '', el.c); el.tapa.style.cssText += 'left:640px;top:0;width:640px;height:240px;background:#000;overflow:hidden;'; el.rej = h('div', 'c-rej', '', el.tapa); el.rej.style.left = '-640px';
    el.tx = h('div', 'c-t', '', el.c); const txt = [b.cifra, b.texto].filter(Boolean).join(' ');
    el.tam = b.tam ?? tamPara(txt, 1700, 90, 250); el.tx.style.cssText += `font-size:${el.tam}px;top:${(b.y ?? 150) - el.tam * .152}px;text-shadow:0 6px 30px rgba(0,0,0,.45);`;
    el.tx.innerHTML = (b.cifra ? `<span class="w" style="color:${color(b.colorCifra ?? 'lima')};opacity:.9">${b.cifra}</span> ` : '') + `<span class="w">${b.texto ?? ''}</span>`;
    if (b.rotulos) el.rs = b.rotulos.map((t, i) => { const d = h('div', 'c-rot sombra', '', el.c); d.style.cssText += `left:${i ? 1280 : 0}px;width:640px;top:262px;font-size:${tamPara(mayus(t), 520, 50, 120, { fam: 'Roboto Condensed', peso: 800 })}px;`; d.letras = letrasDe(mayus(t)); d.k = -1; return d; });
    el.tR = b.aRotulos != null ? b.aRotulos - b.a : (b.rotulos ? el.dur * .55 : Infinity);
  },
  pinta(el, tl, b, dur) {
    dibujaRejilla(lienzoRejilla(el.rej, el), M.t, brilloRejilla(tl, b));
    el.cols.forEach((d, c) => { const n = d.ims.length; d.ims.forEach((im, i) => {
      const r = i * dur / n, t = tl - r, ba = prog(t, 0, 4 * F);                  // cada cambio de toma: barrido vertical con desenfoque de 4 cuadros
      im.style.display = t < 0 ? 'none' : ''; im.style.transform = `translateY(${((c ? 1 : -1) * (1 - eOut(ba)) * (i ? 520 : 0)).toFixed(1)}px) scale(${(1.05 + .02 * Math.max(0, t)).toFixed(4)})`;
      im.style.filter = i && ba < 1 ? `blur(${(16 * (1 - ba)).toFixed(1)}px)` : ''; }); });
    const fuera = prog(tl, el.tR - 4 * F, 4 * F);
    el.tx.style.opacity = prog(tl, 2 * F, 6 * F) * (1 - fuera) * (1 - sale(tl, dur, 4 * F)); el.tx.style.transform = `scale(${((1 + .1 * (1 - eOut(prog(tl, 2 * F, 8 * F)))) * (1 + .012 * tl)).toFixed(4)})`;
    el.rs?.forEach((d, i) => { const t = tl - el.tR - i * .5, n = clamp(Math.floor(t / F * 1.6) + 1, 0, d.letras.length), cur = t >= 0 && (n < d.letras.length || (t % .25) < .1), k = n + '/' + cur;
      d.style.display = t < 0 ? 'none' : ''; d.style.color = color(b.colorRotulos ?? 'crema'); if (k !== d.k) { d.k = k; d.innerHTML = '<span>' + htmlTecleo(d.letras, n, cur) + '</span>'; } });
  },
});

// ───────── presentacion: nombre de quien habla sobre fondo rojo con rayos de luz («mi nombre es…») ─────────
// { a, b, video: 'retrato', pieza: 'presentacion', nombre: 'ANA TORRES' }   ← la persona queda en un óvalo a la izquierda
// con un recorte propio: video: 'oculto' + imagen: 'img/recorte.png' (PNG sin fondo) · imagen2: toma translúcida a la derecha
pieza('presentacion', {
  fondo: 'rojo', sfx: [['whoosh_grave', 0, .3]],
  crea(el, b) {
    if (b.imagen2) { el.im2 = imagen(el, el.c, 'c-abs', b.imagen2); el.im2.style.cssText += 'left:1000px;top:0;width:920px;height:1080px;object-fit:cover;opacity:.7;mix-blend-mode:screen;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30%);mask-image:linear-gradient(90deg,transparent 0,#000 30%);'; }
    if (b.imagen) { el.im = imagen(el, el.c, 'c-abs', b.imagen); el.im.style.cssText += 'left:60px;top:60px;width:690px;height:1020px;object-fit:contain;object-position:50% 100%;'; }
    const txt = mayus(b.nombre ?? ''), tam = el.tam = b.tam ?? tamPara(txt, 1407 / .83, 70, 171, { fam: 'Alfa Slab One', peso: 400 });
    el.nom = h('div', 'c-nombre', txt, el.c); el.nom.style.cssText += `right:83px;top:${(b.y ?? 708) - tam * .073}px;font-size:${tam}px;`;
    el.ba = h('div', 'c-barrido', '', el.c); el.anchoNom = anchoTexto(txt, tam, { fam: 'Alfa Slab One', peso: 400 }) * .83;
  },
  pinta(el, tl, b, dur) {
    const R = M.rect, f = el.fondo;
    if (f && !b.imagen && R && R.op > .5 && R.w < W) {                             // hueco ovalado en el fondo para que se vea la persona (encuadre 'retrato')
      const m = `radial-gradient(ellipse ${R.w * .5}px ${R.h * .56}px at ${R.x + R.w / 2}px ${R.y + R.h * .52}px, #000 78%, transparent 100%), linear-gradient(#000, #000)`;
      f.style.maskImage = f.style.webkitMaskImage = m; f.style.maskComposite = 'exclude'; f.style.webkitMaskComposite = 'xor';
    }
    if (el.im) el.im.style.transform = `translateX(${(-40 * (1 - eOut(prog(tl, 0, 10 * F))) + 6 * tl).toFixed(1)}px)`;
    if (el.im2) el.im2.style.transform = `scale(${(1.04 + .02 * tl).toFixed(4)})`;
    const p = eInOut(prog(tl, 4 * F, 15 * F)), x0 = W - 83 - el.anchoNom;         // el nombre se revela de izquierda a derecha con un barrido de rayas
    el.nom.style.clipPath = `inset(-20% ${(100 - p * 104).toFixed(2)}% -30% -2%)`; el.nom.style.transform = `scaleX(.83) translateX(${(10 * tl).toFixed(1)}px)`;
    el.ba.style.cssText = `left:${x0 + el.anchoNom * p - 70}px;top:${(b.y ?? 708) - 14}px;width:130px;height:${el.tam * .78 + 28}px;opacity:${Math.sin(Math.PI * clamp(p)) > .02 ? Math.min(1, 3 * Math.sin(Math.PI * p)) : 0};transform:skewX(-14deg);`;
  },
});

// ───────── carrusel: tarjetas de foto flotando en 3D con un texto inclinado al centro (prueba social en volumen) ─────────
// { a, b, video: 'oculto', pieza: 'carrusel', fotos: ['img/f1.jpg', …8 a 12], texto: 'MILLONES\nDE\nPERSONAS' }
// modo: 'anillo' = las fotos forman un anillo que gira (90° por segundo) con el texto adentro.
pieza('carrusel', {
  fondo: 'rejilla', sfx: [['whoosh_rapido', 0, .25]],
  crea(el, b) {
    el.e = h('div', 'c-3d', '', el.c); el.g = h('div', 'c-abs', '', el.e); el.g.style.cssText += 'left:960px;top:540px;width:0;height:0;transform-style:preserve-3d;';
    el.fs = (b.fotos ?? []).map(f => { const d = h('div', 'c-foto', '', el.g); d.style.cssText += 'left:-130px;top:-210px;width:260px;height:420px;'; imagen(el, d, '', f); return d; });
    if (b.texto) { const txt = mayus(b.texto), an = b.modo === 'anillo'; el.tx = h('div', 'c-t' + (an ? '' : ' c-esc'), '', el.c); el.ren = txt.split('\n').length;
      el.tam = b.tam ?? tamPara(txt, an ? 1500 : 760, 60, an ? 196 : 112, an ? {} : { peso: 800, ital: true });
      el.tx.style.cssText += `font-size:${el.tam}px;line-height:1.02;top:${540 - el.ren * el.tam * .51}px;${an ? '' : 'font-weight:800;'}text-shadow:0 6px 30px rgba(0,0,0,.7);`; ponPalabras(el.tx, txt); }
  },
  pinta(el, tl, b, dur) {
    const n = el.fs.length, an = b.modo === 'anillo', q = sale(tl, dur, 5 * F);
    if (an) { const r = 130 / Math.tan(Math.PI / n) + 30, s = lerp(.5, 1, eOut(prog(tl, 0, 12 * F))) * (1 + .03 * tl);
      el.g.style.transform = `translateZ(${-r * .4}px) rotateX(-9deg) rotateY(${(tl * 90).toFixed(2)}deg) scale3d(${s},${s},${s})`;
      el.fs.forEach((d, i) => { d.style.transform = `rotateY(${i * 360 / n}deg) translateZ(${r}px)`; d.style.opacity = 1 - q; });
    } else { el.g.style.transform = `rotateY(${(4 * Math.sin(tl * .7)).toFixed(2)}deg)`;
      el.fs.forEach((d, i) => {
        const ang = (i / n) * 6.2832 + .5, rx = 610 + 190 * azar(i + 1.3), ry = 300 + 120 * azar(i + 2.3), z = -420 + 620 * azar(i + 3.3);
        const p = eOut(prog(tl, i * F, 8 * F)), lejos = 1 + 1.6 * (1 - p), x = Math.cos(ang) * rx * lejos + 26 * Math.sin(tl * .9 + i), y = Math.sin(ang) * ry * lejos + 16 * Math.cos(tl * .8 + i * 2);
        d.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${(z + 55 * tl).toFixed(1)}px) rotateY(${(-Math.cos(ang) * 30 + 5 * Math.sin(tl + i)).toFixed(2)}deg) rotateZ(${(8 * (azar(i + 4.3) - .5)).toFixed(2)}deg)`;
        d.style.opacity = prog(tl, i * F, 3 * F) * (1 - q);
      }); }
    if (el.tx) { const t = tl - (b.aTexto != null ? b.aTexto - b.a : an ? .35 : .1);
      el.tx.style.opacity = prog(t, 0, 5 * F) * (1 - q); el.tx.style.transform = `rotate(${an ? 0 : -8}deg) scale(${((1 + .25 * Math.pow(1 - prog(t, 0, 10 * F), 2.4)) * (1 + .014 * tl)).toFixed(4)})`; }
  },
});

// ───────── mosaico: pared de fotos inclinada que se desliza, con texto crema grande encima ─────────
// { a, b, video: 'oculto', pieza: 'mosaico', fotos: ['img/f1.jpg', …], texto: 'MILES Y MILES\nDE CLIENTES' }
pieza('mosaico', {
  fondo: 'negro',
  crea(el, b) {
    const fotos = b.fotos ?? [], COL = 9, FIL = 7, AN = 380, AL = 236, HU = 14;
    el.e = h('div', 'c-3d', '', el.c); el.pared = h('div', 'c-abs', '', el.e); el.pared.style.cssText += `left:${960 - COL * (AN + HU) / 2}px;top:${540 - FIL * (AL + HU) / 2}px;width:${COL * (AN + HU)}px;height:${FIL * (AL + HU)}px;`;
    el.ts = []; for (let f = 0; f < FIL; f++) for (let c = 0; c < COL; c++) { const i = f * COL + c, d = h('div', 'c-foto', '', el.pared);
      d.style.cssText += `left:${c * (AN + HU) + (f % 2 ? AN * .35 : 0)}px;top:${f * (AL + HU)}px;width:${AN}px;height:${AL}px;border-radius:10px;box-shadow:none;`; if (fotos.length) imagen(el, d, '', fotos[(i * 3 + f) % fotos.length]); d.k = azar(i + 8.8); el.ts.push(d); }
    el.velo = h('div', 'c-abs', '', el.c); el.velo.style.cssText += `inset:0;background:rgba(0,0,0,${b.oscurece ?? .28});`;
    if (b.texto) { const txt = mayus(b.texto); el.ren = txt.split('\n').length; el.tam = b.tam ?? tamPara(txt, 1700, 80, 190); el.tx = h('div', 'c-t', '', el.c);
      el.tx.style.cssText += `font-size:${el.tam}px;line-height:1.04;top:${540 - el.ren * el.tam * .52}px;text-shadow:0 8px 34px rgba(0,0,0,.75);`; if (b.color) el.tx.style.color = color(b.color); ponPalabras(el.tx, txt); }
  },
  pinta(el, tl, b, dur) {
    const q = sale(tl, dur, 4 * F);
    el.pared.style.transform = `rotateY(16deg) rotateZ(-13deg) translate(${(-90 + 46 * tl).toFixed(1)}px, ${(30 - 18 * tl).toFixed(1)}px) scale(${(1.12 + .015 * tl).toFixed(4)})`;
    el.ts.forEach(d => { const p = prog(tl, d.k * .35, 5 * F); d.style.opacity = p * (1 - q); d.style.transform = `scale(${(.8 + .2 * eOut(p)).toFixed(3)})`; });
    if (el.tx) { el.tx.style.opacity = prog(tl, 5 * F, 5 * F) * (1 - q); el.tx.style.transform = `scale(${((1 + .5 * Math.pow(1 - prog(tl, 5 * F, 12 * F), 2.4)) * (1 + .012 * tl)).toFixed(4)})`; }
  },
});

// ───────── apiladas: fotos con marco crema (tipo foto impresa) que caen una sobre otra («después de años de probar…») ─────────
// { a, b, video: 'oculto', pieza: 'apiladas', fotos: [['img/f1.jpg', 108.2], ['img/f2.jpg', 109.7], …] }
pieza('apiladas', {
  fondo: 'rejilla',
  crea(el, b) {
    el.its = tiempos(lista(b.fotos), b, .9);
    el.ms = el.its.map((it, i) => { const m = h('div', 'c-marco', '', el.c), g = 22; m.style.cssText += `left:${150 + i * 34}px;top:${46 + i * 26}px;width:1500px;height:880px;`;
      const im = imagen(el, m, '', it.t); im.style.cssText += `left:${g}px;top:${g}px;width:${1500 - 2 * g}px;height:${880 - 2 * g}px;`; m.giro = -1 - 3 * azar(i + 2.9) + (i % 2 ? 4.4 : 0); return m; });
  },
  pinta(el, tl, b, dur) {
    const n = el.ms.length, fuga = dur - 10 * F;
    el.ms.forEach((m, i) => {
      const t = tl - el.its[i].r; if (t < 0) { m.style.display = 'none'; return; }
      const p = prog(t, 0, 6 * F), s = lerp(1.16, 1, eBack(p)) * (1 + .008 * t), qf = eIn(prog(tl, fuga + (n - 1 - i) * 3 * F, 5 * F));   // al final salen volando en ráfaga
      m.style.display = ''; m.style.opacity = prog(t, 0, 2 * F);
      m.style.transform = `translate(${((i % 2 ? 1 : -1) * 2200 * qf).toFixed(1)}px, ${(-300 * qf).toFixed(1)}px) rotate(${(m.giro + .25 * Math.sin(tl * 1.3 + i) + 14 * qf * (i % 2 ? 1 : -1)).toFixed(3)}deg) scale(${s.toFixed(4)})`;
    });
  },
});

// ───────── cta: llamado a la acción a pantalla completa («REGÍSTRATE / AQUÍ ABAJO») con dos flechas verdes ─────────
// { a, b, video: 'completo', pieza: 'cta', texto: 'REGÍSTRATE\nAQUÍ ABAJO' }   ← fondo por defecto 'oscuro': lo de atrás desenfocado y apagado
const FLECHA = '<svg viewBox="0 0 252 493"><defs><linearGradient id="cfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8ff8e"/><stop offset="1" stop-color="#58e03f"/></linearGradient></defs><path fill="url(#cfl)" d="M78 0h96v300h78L126 493 0 300h78z"/></svg>';
pieza('cta', {
  fondo: 'oscuro', sfx: [['teclear', 0, .22], ['boom', .25, .25]],
  crea(el, b) {
    const txt = mayus(b.texto ?? 'REGÍSTRATE\nAQUÍ ABAJO'); el.letras = letrasDe(txt); el.ren = txt.split('\n').length;
    el.tam = b.tam ?? tamPara(txt, 1250, 90, 232, { fam: 'Roboto Condensed', peso: 800 });
    el.d = h('div', 'c-rot sombra', '<span style="text-align:center"></span>', el.c); el.d.style.cssText += `font-size:${el.tam}px;line-height:1.08;color:${color(b.color ?? 'amarillocta')};top:${(b.y ?? 545) - el.ren * el.tam * .54}px;`;
    el.fl = b.flechas === false ? [] : [84, 1578].map(x => { const f = h('div', 'c-flecha', FLECHA, el.c); f.style.left = px(x); return f; }); el.k = -1;
  },
  pinta(el, tl, b, dur) {
    const n = clamp(Math.floor(tl / F * (el.letras.length / 12)) + 1, 0, el.letras.length), q = sale(tl, dur, 6 * F);   // se escribe en ≈ 12 cuadros
    if (n !== el.k) { el.k = n; el.d.firstChild.innerHTML = htmlTecleo(el.letras, n, false); }
    el.d.style.opacity = 1 - q; el.d.style.transform = `scale(${(1 + .012 * tl).toFixed(4)})`;
    el.fl.forEach((f, i) => { const t = tl - 6 * F - i * 2 * F, p = prog(t, 0, 12 * F), rebote = 1 - Math.pow(1 - p, 2) * Math.abs(Math.cos(p * 7.2));   // caen con rebote y luego laten
      f.style.top = px(lerp(-560, 499, rebote) + (p >= 1 ? 16 * Math.sin((t - 12 * F) * 6.5) : 0)); f.style.opacity = (t < 0 ? 0 : 1) * (1 - q); });
  },
});

// ───────── llamado: rótulo inferior «⬇ AGENDA TU CITA AQUÍ ABAJO ⬇» sobre la persona (va por debajo de la cara) ─────────
// { a, b, pieza: 'llamado', texto: 'AGENDA TU CITA AQUÍ ABAJO' }   opciones: y (880) · color · flechas: false
const FLECHITA = '<svg viewBox="0 0 24 30" style="display:inline-block;width:.72em;height:.9em;vertical-align:-.12em;margin:0 .18em"><path fill="currentColor" d="M8 0h8v15h8L12 30 0 15h8z"/></svg>';
pieza('llamado', {
  sfx: [['teclear', 0, .2]],
  crea(el, b) {
    const txt = b.mayus === false ? b.texto : mayus(b.texto ?? ''); el.letras = letrasDe(txt);
    el.d = h('div', 'c-llamado', `<span class="fa">${b.flechas === false ? '' : FLECHITA}</span><span class="tx"></span><span class="fb">${b.flechas === false ? '' : FLECHITA}</span>`, el.c);
    el.d.style.fontSize = px(b.tam ?? tamPara(txt, 1500, 40, 64)); el.d.style.top = px(b.y ?? 878); if (b.color) el.d.style.color = color(b.color);
    [el.fa, el.tx, el.fb] = el.d.children; el.k = -1;
  },
  pinta(el, tl, b, dur) {
    const L = el.letras.length, borra = sale(tl, dur, 15 * F), n = Math.round(clamp(Math.floor(tl / F * 2.5) + 1, 0, L) * (1 - borra));   // al final se borra de derecha a izquierda en 15 cuadros
    if (n !== el.k) { el.k = n; el.tx.innerHTML = htmlTecleo(el.letras, n, false); }
    const sube = 7 * Math.sin(tl * 6);
    el.fa.style.cssText = `display:inline-block;opacity:${n > 0 ? 1 : 0};transform:translateY(${sube.toFixed(1)}px)`; el.fb.style.cssText = `display:inline-block;opacity:${n >= L ? 1 : 0};transform:translateY(${sube.toFixed(1)}px)`;
    el.d.style.transform = `scale(${(1 + .004 * tl).toFixed(4)})`;
  },
});

// ───────── logo: logo a pantalla completa (cada vez que se nombra el programa). La imagen la da el proyecto ─────────
// { a, b, video: 'oculto', pieza: 'logo', imagen: 'img/logo.png' }   opciones: fondo ('particulas' | 'rejilla' | …) · ancho (1100) · alto (520) · giro (-5)
pieza('logo', {
  fondo: 'particulas', sfx: [['boom', 0, .32]],
  crea(el, b) {
    const an = b.ancho ?? 1100, al = b.alto ?? 520; el.l = h('div', 'c-logo', '', el.c); el.l.style.cssText += `left:${(b.x ?? 960) - an / 2}px;top:${(b.y ?? 540) - al / 2}px;width:${an}px;height:${al}px;`;
    if (b.imagen) imagen(el, el.l, '', b.imagen); else { el.l.className = 'c-t'; el.l.style.cssText = `top:${540 - 150}px;font:800 300px/1 "Roboto Condensed";`; el.l.textContent = b.texto ?? ''; }
  },
  pinta(el, tl, b, dur) {
    const p = eOut(prog(tl, 0, 12 * F)), q = b.salida === false ? 0 : sale(tl, dur, 4 * F), giro = b.giro ?? -5;   // entra chico y crece con resplandor, un poco inclinado
    el.l.style.opacity = prog(tl, 0, 4 * F) * (1 - q); el.l.style.transform = `rotate(${lerp(giro * 2.2, giro, p).toFixed(2)}deg) scale(${(lerp(.3, 1, p) * (1 + .022 * tl)).toFixed(4)})`;
    el.l.style.filter = `drop-shadow(0 0 ${(34 * (1 - p) + 12 + 6 * Math.sin(tl * 4)).toFixed(1)}px rgba(255,90,130,${(.75 - .3 * p).toFixed(2)}))`;
  },
});

// ───────── marca: marca de agua (el logo gigante DETRÁS de la persona, al 40 %) para el último tramo del video ─────────
// extra: { a: 331, b: 413, pieza: 'marca', detras: true, imagen: 'img/logo.png' }   opciones: opacidad (0.4) · x, y, ancho, alto
pieza('marca', {
  z: 0, sfx: [],
  crea(el, b) {
    const an = b.ancho ?? 1670, al = b.alto ?? 580; el.l = h('div', 'c-logo', '', el.c); el.l.style.cssText += `left:${(b.x ?? 985) - an / 2}px;top:${(b.y ?? 440) - al / 2}px;width:${an}px;height:${al}px;`;
    if (b.imagen) imagen(el, el.l, '', b.imagen); else { el.l.className = 'c-marca-txt'; el.l.style.cssText = ''; el.l.textContent = b.texto ?? ''; }
  },
  pinta(el, tl, b, dur) {
    el.l.style.opacity = (b.opacidad ?? .4) * prog(tl, 0, 15 * F) * (1 - sale(tl, dur, 8 * F));
    el.l.style.transform = `scale(${(1 + .0006 * tl + .006 * Math.sin(tl * .9)).toFixed(5)}) translateY(${(4 * Math.sin(tl * .6)).toFixed(2)}px)`;
  },
});

// ═════════════════════════ C · TRANSICIONES ═════════════════════════

// ───────── destello: destello crema al VOLVER a la persona después de un inserto o toma de apoyo ─────────
// extra: { a: 28.36, b: 28.8, pieza: 'destello' }   ← `a` = el cuadro del corte. Pico de 2 cuadros y caída en 10.
pieza('destello', {
  z: 9, antes: 2 * F, sfx: [['whoosh_rapido', -.05, .2]],
  crea(el) { el.c.className += ' c-f-crema'; },
  pinta(el, tl) { el.c.style.opacity = tl < 0 ? .85 * prog(tl, -2 * F, 2 * F) : tl < F ? 1 : 1 - eOut(prog(tl, F, 10 * F)); },
});

// ───────── entrada: para ENTRAR a un inserto negro: la cuadrícula se dibuja sobre la toma, que se desenfoca y funde a negro ─────────
// extra: { a: 6.43, b: 6.63, pieza: 'entrada' }   ← termina justo donde empieza el inserto (≈ 6 cuadros)
pieza('entrada', {
  z: 2, sfx: [['boom', 0, .3]],
  crea(el) { el.v = h('div', 'c-abs', '', el.c); el.v.style.inset = '0'; el.rej = h('div', 'c-rej', '', el.c); },
  pinta(el, tl, b, dur) {
    const p = prog(tl, 0, dur);
    el.v.style.backdropFilter = el.v.style.webkitBackdropFilter = `blur(${(26 * p).toFixed(1)}px)`; el.v.style.background = `rgba(0,0,0,${eIn(p).toFixed(3)})`;
    dibujaRejilla(lienzoRejilla(el.rej, el), M.t, .65 * prog(tl, 0, F));
  },
});

// ───────── enfoca: para VOLVER de un inserto lento a la persona: la toma llega desenfocada y se enfoca (disolvencia) ─────────
// extra: { a: 50.4, b: 50.9, pieza: 'enfoca' }   ← `a` = el cuadro del corte; dura lo que dure el extra (≈ 15 cuadros)
pieza('enfoca', {
  z: 2, sfx: [],
  crea(el) { el.v = h('div', 'c-abs', '', el.c); el.v.style.inset = '0'; },
  pinta(el, tl, b, dur) { const p = 1 - eOut(prog(tl, 0, dur)); el.v.style.backdropFilter = el.v.style.webkitBackdropFilter = `blur(${(24 * p).toFixed(1)}px)`; el.v.style.background = `rgba(0,0,0,${(.55 * p * p).toFixed(3)})`; },
});

// ═════════════════════════ D · EL ESTILO ═════════════════════════
// Barra de avance: proyecto.json → "barra": "lineal" | "referencia" (por defecto) | { "puntos": [[segundo, ancho 0–1], …] } | false
// La de referencia no es lineal: llega a la mitad del ancho al 10.2 % del video y al 58.5 % al 14.65 %; de ahí va recta hasta el final.
function anchoBarra(t) {
  const D = M.datos.dur, cfg = M.datos.proyecto.barra;
  if (cfg === 'lineal') return clamp(t / D);
  const pts = Array.isArray(cfg?.puntos) ? cfg.puntos.map(([s, a]) => [s / D, a]).sort((x, y) => x[0] - y[0]) : [[.102, .499], [.1465, .5854]];
  const P = [[0, 10 / W], ...pts, [1, 1]], x = clamp(t / D);
  for (let i = 1; i < P.length; i++) if (x <= P[i][0]) return lerp(P[i - 1][1], P[i][1], prog(x, P[i - 1][0], P[i][0] - P[i - 1][0]));
  return 1;
}
const PRECARGA = [['Poppins', 400], ['Poppins', 500], ['Poppins', 600], ['Poppins', 700], ['Poppins', 800], ['Poppins', 600, 1], ['Poppins', 800, 1], ['Poppins', 900, 1], ['Roboto Condensed', 800], ['Alfa Slab One', 400]];

export default {
  nombre: 'cinetico',
  tr: 0,                                   // la cámara cambia SOLO por corte (así es la referencia). Un beat puede pedir viaje con tr: 0.3
  // Encuadres de la persona (campo `video` del beat). El zoom se ancla a la cara: usa "foco" de proyecto.json.
  video: {
    porDefecto: 'completo',
    completo: {},                                                     // plano medio (×1.0)
    get lento() { return encuadre([1, 1.06]); },                      // plano medio que se acerca lento durante el beat
    get cerrado() { return encuadre(1.4); },                          // acercamiento de golpe ×1.4, la cara no se mueve de su sitio
    get cerradoLento() { return encuadre([1.4, 1.48]); },             // cerrado que sigue acercándose
    get cerradoDer() { return encuadre(1.4, .64); },                  // cerrado con la persona corrida a la derecha: deja libre la izquierda
    get cerradoIzq() { return encuadre(1.4, .36); },                  // lo mismo al otro lado
    get muyCerrado() { return encuadre(1.9, null, .43); },            // primerísimo plano (énfasis corto)
    get bajo() { return encuadre(1.22, null, .52); },                 // la persona más abajo: deja libre la franja de arriba (cortina, golpes arriba)
    columna: { x: 640, y: 240, w: 640, h: 840 },                      // al centro de 3 columnas (pieza `columnas`)
    retrato: { x: 70, y: 30, w: 720, h: 1050 },                       // a la izquierda, en óvalo (pieza `presentacion`)
    ventanita: { x: 1421, y: 0, w: 499, h: 280, clase: 'ventanita' }, // ventanita arriba a la derecha (pieza `captura`, con videoEncima: true)
    ventanitaChica: { x: 1574, y: 0, w: 346, h: 194, clase: 'ventanita' },
  },
  // lo que se ve si la persona está oculta y ninguna pieza trae fondo: negro con la cuadrícula en reposo
  fondo: {
    crea(el) { el.rej = h('div', 'c-rej', '', el); },
    pinta(el, t) {
      const R = M.rect, tapado = (R && R.op > .99 && R.w >= W && R.h >= H) || (M.beat?._el?.conFondo && !['velo', 'oscuro'].includes(M.beat._el.fondo?.tipo));
      el.rej.style.display = tapado ? 'none' : ''; if (!tapado) dibujaRejilla(lienzoRejilla(el.rej, el), t, .18);
    },
  },
  piezas,
  // Subtítulos: APAGADOS. En este estilo el texto cinético hace ese papel (la referencia no lleva subtítulos corridos).
  // Para encenderlos en un video, quita las dos barras de las líneas de abajo:
  // subs: { paginas: { max: 3, chars: 22 }, crea(el) {},
  //   pinta(el, pag, t) { el.innerHTML = pag.palabras.map(w => (t >= w.a ? `<b>${w.txt}</b>` : w.txt)).join(' '); } },
  encima: {
    crea(el) {
      // carga todas las tipografías ANTES del primer cuadro (si no, la primera foto de cada letra saldría con otra fuente)
      const pre = h('div', 'c-precarga', '', el);
      for (const [fam, peso, ital] of PRECARGA) { const s = h('span', '', 'Añ1', pre); s.style.font = `${ital ? 'italic ' : ''}${peso} 20px "${fam}"`; document.fonts.load(s.style.font, 'Añ1'); }
      el.b = h('div', 'c-barra', '<i></i>', el);
    },
    pinta(el, t) {
      const fuera = M.datos.proyecto.barra === false || M.beat?.barra === false;     // un beat puede esconderla con barra: false
      el.b.style.display = fuera ? 'none' : ''; if (!fuera) el.b.firstChild.style.width = px(anchoBarra(t) * W);
    },
  },
};
