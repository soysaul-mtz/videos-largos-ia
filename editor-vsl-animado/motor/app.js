// Motor del VSL animado: el director (cámara / ventana) + mundos 3D + capa 2D + subtítulos al centro tipo karaoke.
// render.mjs llama window.init(datos) y luego window.render(t) cuadro por cuadro.
import * as THREE from 'three';
import { RoomEnvironment } from './lib/RoomEnvironment.js';
import { clamp, lerp, prog, eOut, eIO, eBack, C } from './util.js';
import { MUNDOS, BEATS } from './beats.js';

const W = 1920, H = 1080;
const out = document.getElementById('out'), o = out.getContext('2d');
const capa = document.createElement('canvas'); capa.width = W; capa.height = H; const g = capa.getContext('2d');

const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H, false);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NoToneMapping;
const ENV = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), .04).texture;
const cam = new THREE.PerspectiveCamera(32, W / H, .5, 500);

// ---- mundo base: piso infinito del color del fondo, sol con sombra suave ----
export function mundo(op = {}) {
  const s = new THREE.Scene(), fondo = op.fondo || C.papel;
  s.background = new THREE.Color(fondo); s.fog = new THREE.Fog(fondo, op.niebla?.[0] ?? 38, op.niebla?.[1] ?? 105);
  s.environment = ENV;
  s.add(new THREE.HemisphereLight('#ffffff', '#b8b0a3', .3));
  const sol = new THREE.DirectionalLight('#fff3e2', 2.1); sol.position.set(20, 34, 16); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 140 });
  sol.shadow.bias = -.0004; sol.shadow.normalBias = .03; sol.shadow.radius = 4; s.add(sol); s.add(sol.target);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: op.piso || fondo, roughness: 1 }));
  piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; s.add(piso);
  if (op.reticula !== false) { const r = new THREE.GridHelper(400, 200, '#000', '#000'); r.material.transparent = true; r.material.opacity = .045; r.position.y = .01; s.add(r); }
  return { scene: s, sol, piso };
}

// ---- 2D ----
export const D = {
  pt(v) { const p = v.clone().project(cam); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H }; },
  rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); },
  pill(txt, x, y, k, op = {}) {
    if (k <= 0) return; const s = op.size || 34; g.save(); g.font = `${s}px "${op.font || 'Poppins XB'}"`;
    const w = g.measureText(txt).width + s * (op.punto ? 1.8 : 1.1), h = s * 1.7, sc = eBack(k);
    g.globalAlpha = clamp(k * 3); g.translate(x, y); g.scale(sc, sc);
    g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    g.fillStyle = op.bg || C.tinta; D.rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill(); g.shadowColor = 'transparent';
    if (op.punto) { g.fillStyle = op.punto; g.beginPath(); g.arc(-w / 2 + h * .45, 0, s * .22, 0, 7); g.fill(); }
    g.fillStyle = op.fg || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, op.punto ? s * .3 : 0, s * .06); g.restore();
  },
  titulo(txt, x, y, size, k, op = {}) {
    if (k <= 0) return; g.save(); g.font = `${size}px "${op.font || 'Bebas'}"`; g.textAlign = op.align || 'center'; g.textBaseline = 'middle';
    const sc = op.slam ? lerp(1.9, 1, eOut(k)) : eBack(k); g.globalAlpha = clamp(k * 2.5) * (op.alpha ?? 1); g.translate(x, y); g.scale(sc, sc); g.rotate(op.rot || 0);
    if (op.stroke) { g.lineWidth = op.stroke; g.strokeStyle = op.strokeColor || C.tinta; g.lineJoin = 'round'; g.strokeText(txt, 0, 0); }
    g.shadowColor = op.sombra || 'rgba(0,0,0,.18)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
    g.fillStyle = op.color || C.tinta; g.fillText(txt, 0, 0); g.restore();
  },
  check(x, y, r, k) {
    if (k <= 0) return; g.save(); g.translate(x, y); const sc = eBack(clamp(k * 1.6)); g.scale(sc, sc);
    g.fillStyle = C.teal; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 30; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.shadowColor = 'transparent';
    const p = clamp((k - .25) / .5); g.strokeStyle = '#fff'; g.lineWidth = r * .2; g.lineCap = g.lineJoin = 'round'; g.beginPath();
    const P = [[-.42, .02], [-.12, .32], [.45, -.3]]; g.moveTo(P[0][0] * r, P[0][1] * r);
    const l1 = Math.min(1, p * 2), l2 = Math.max(0, p * 2 - 1);
    g.lineTo(lerp(P[0][0], P[1][0], l1) * r, lerp(P[0][1], P[1][1], l1) * r); if (l2 > 0) g.lineTo(lerp(P[1][0], P[2][0], l2) * r, lerp(P[1][1], P[2][1], l2) * r);
    g.stroke(); g.restore();
    if (k < 1) { g.save(); g.strokeStyle = C.teal; g.globalAlpha = 1 - k; g.lineWidth = 6; g.beginPath(); g.arc(x, y, r * (1 + k * 1.2), 0, 7); g.stroke(); g.restore(); }
  },
  sello(txt, x, y, k, color = C.rojo) {
    if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(-.12); const sc = lerp(2.4, 1, eOut(clamp(k * 1.4))); g.scale(sc, sc); g.globalAlpha = clamp(k * 3);
    const L = txt.split('\n'), s = 120; g.font = `${s}px "Bebas"`; const w = Math.max(...L.map(l => g.measureText(l).width)) + 90, h = L.length * s * .95 + 60;
    g.strokeStyle = color; g.lineWidth = 14; D.rr(g, -w / 2, -h / 2, w, h, 18); g.stroke(); g.lineWidth = 5; D.rr(g, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 10); g.stroke();
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; L.forEach((l, i) => g.fillText(l, 0, (i - (L.length - 1) / 2) * s * .95 + 6)); g.restore();
  },
  barra(x, y, w, k, txt, color = C.nar) {
    g.save(); g.globalAlpha = clamp(k * 4); g.fillStyle = 'rgba(22,24,28,.9)'; D.rr(g, x - 24, y - 70, w + 48, 130, 22); g.fill();
    g.font = '30px "Poppins XB"'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(txt, x, y - 32);
    g.fillStyle = 'rgba(255,255,255,.15)'; D.rr(g, x, y + 4, w, 26, 13); g.fill(); g.fillStyle = color; D.rr(g, x, y + 4, Math.max(26, w * eIO(k)), 26, 13); g.fill(); g.restore();
  },
  termo(x, y, val, k, col) {  // termómetro vertical: val en °C (-10…50)
    if (k <= 0) return; g.save(); g.globalAlpha = clamp(k * 3); g.translate(x, y); const h = 330, f = clamp((val + 10) / 60);
    g.fillStyle = 'rgba(22,24,28,.92)'; D.rr(g, -60, -h / 2 - 50, 120, h + 150, 60); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; D.rr(g, -16, -h / 2, 32, h, 16); g.fill();
    g.fillStyle = col; D.rr(g, -16, h / 2 - h * f, 32, h * f, 16); g.fill(); g.beginPath(); g.arc(0, h / 2 + 30, 36, 0, 7); g.fill();
    g.font = '64px "Bebas"'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(Math.round(val) + '°', 80, -h / 2 + h * (1 - f)); g.restore();
  },
  g, W, H,
};

// ---- el director: cuadros del corte ----
let DATOS = null; const IMGS = new Map();
async function cuadroel director(t) {
  const i = Math.min(DATOS.nCuadros, Math.max(1, Math.floor(t * DATOS.fpsFuente + 1e-4) + 1)), k = String(i).padStart(5, '0');
  if (IMGS.has(k)) return IMGS.get(k);
  const im = new Image(); im.src = `/cuadros/${k}.jpg`; await im.decode(); IMGS.set(k, im);
  if (IMGS.size > 12) IMGS.delete(IMGS.keys().next().value);
  return im;
}
const CARA = { x: 990, y: 390 };   // centro de la cara en el cuadro original (caras.json)
const VENT = { x: 70, y: 105, w: 640, h: 870, r: 30 };  // ventana de el director en pantalla dividida
const CROP_V = (() => { const sw = 1080 * VENT.w / VENT.h; return { sx: CARA.x - sw / 2, sy: 0, sw, sh: 1080 }; })();

async function dibujaCam(t, lt) {
  const im = await cuadroel director(t), z = 1.0 + .045 * eIO(clamp(lt / 4));   // empuje lento
  g.save(); g.translate(CARA.x, CARA.y); g.scale(z, z); g.translate(-CARA.x, -CARA.y); g.drawImage(im, 0, 0, W, H); g.restore();
}
async function dibujaVentana(t, b, prev) {
  const im = await cuadroel director(t), lt = t - b.a;
  // si venía de cámara completa, la imagen se encoge hasta la ventana (sin corte)
  const k = prev && prev.modo === 'cam' ? eIO(clamp(lt / .45)) : 1, entra = prev && prev.modo === '3d' ? eOut(clamp(lt / .4)) : 1;
  const x = lerp(0, VENT.x, k) - (1 - entra) * 760, y = lerp(0, VENT.y, k), w = lerp(W, VENT.w, k), h = lerp(H, VENT.h, k), r = lerp(0, VENT.r, k);
  const sx = lerp(0, CROP_V.sx, k), sw = lerp(1920, CROP_V.sw, k);
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 50; g.shadowOffsetY = 18; g.fillStyle = '#fff'; D.rr(g, x - 6, y - 6, w + 12, h + 12, r + 6); g.fill(); g.restore();
  g.save(); D.rr(g, x, y, w, h, r); g.clip(); g.drawImage(im, sx, 0, sw, 1080, x, y, w, h); g.restore();
}

// ---- subtítulos: al centro, la página completa; la palabra que dice va en píldora naranja ----
const SUB = { y: 770, tam: 66, ancho: 1380 };
function subtitulos(t) {
  const P = DATOS.paginas.find(p => t >= p.a && t < p.b); if (!P) return;
  const c = o; c.save(); c.font = `${SUB.tam}px "Poppins XB"`; c.textBaseline = 'middle';
  const esp = c.measureText(' ').width + 12, lineas = [[]]; let ancho = 0;
  for (const w of P.palabras) { const ww = c.measureText(w.txt).width; if (ancho + ww > SUB.ancho && lineas.at(-1).length) { lineas.push([]); ancho = 0; } lineas.at(-1).push({ ...w, ww }); ancho += ww + esp; }
  const alto = SUB.tam * 1.32, y0 = SUB.y - (lineas.length - 1) * alto / 2, ent = eBack(clamp((t - P.a) / .16));
  c.translate(W / 2, SUB.y); c.scale(lerp(.86, 1, ent), lerp(.86, 1, ent)); c.translate(-W / 2, -SUB.y);
  lineas.forEach((L, li) => {
    const tot = L.reduce((s, w) => s + w.ww, 0) + esp * (L.length - 1); let x = W / 2 - tot / 2; const y = y0 + li * alto;
    for (const w of L) {
      const activa = t >= w.a && t < w.b2, dicha = t >= w.a;
      if (activa) {
        const k = eBack(clamp((t - w.a) / .12)), pw = w.ww + 30, ph = SUB.tam * 1.16;
        c.save(); c.translate(x + w.ww / 2, y); c.scale(lerp(.7, 1, k), lerp(.7, 1, k)); c.fillStyle = C.nar; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 18; c.shadowOffsetY = 5;
        D.rr(c, -pw / 2, -ph / 2, pw, ph, 18); c.fill(); c.restore();
      }
      c.lineJoin = 'round'; c.lineWidth = activa ? 0 : 11; c.strokeStyle = 'rgba(10,10,12,.92)';
      c.shadowColor = activa ? 'transparent' : 'rgba(0,0,0,.45)'; c.shadowBlur = 16; c.shadowOffsetY = 4;
      if (!activa) c.strokeText(w.txt, x, y + 3);
      c.shadowColor = 'transparent'; c.fillStyle = activa ? '#fff' : w.clave && dicha ? '#FFB37A' : dicha ? '#fff' : 'rgba(255,255,255,.62)';
      c.fillText(w.txt, x, y + 3); x += w.ww + esp;
    }
  });
  c.restore();
}

// ---- transición al entrar a cada momento ----
function transicion(b, t) {
  const lt = t - b.a, d = .3, p = clamp(lt / d);
  o.save(); o.fillStyle = '#000'; o.fillRect(0, 0, W, H);
  if (p < 1 && b.trans && b.trans !== 'nada') {
    const e = eOut(p);
    if (b.trans === 'zoom') { const z = lerp(1.14, 1, e); o.filter = `blur(${(1 - e) * 16}px)`; o.translate(W / 2, H / 2); o.scale(z, z); o.translate(-W / 2, -H / 2); }
    if (b.trans === 'whip') { o.filter = `blur(${(1 - e) * 22}px)`; o.translate((1 - e) * 340 * (b.dir || 1), 0); }
    if (b.trans === 'sube') { o.filter = `blur(${(1 - e) * 14}px)`; o.translate(0, (1 - e) * 220); }
  }
  o.drawImage(capa, 0, 0); o.restore();
  if (p < 1 && b.trans === 'flash') { o.save(); o.fillStyle = '#fff'; o.globalAlpha = (1 - p) * .7; o.fillRect(0, 0, W, H); o.restore(); }
  // viñeta suave
  const v = o.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)');
  o.fillStyle = v; o.fillRect(0, 0, W, H);
}

const cache = {};
const mundoDe = k => cache[k] || (cache[k] = MUNDOS[k]());
function render3D(b, t) {
  const w = mundoDe(b.mundo), lt = t - b.a;
  w.estado && w.estado(t);
  cam.fov = 32; cam.up.set(0, 1, 0);
  b.cam(cam, lt, t, w);
  if (b.modo === 'div') cam.setViewOffset(W, H, -360, 0, W, H); else cam.clearViewOffset();
  if (b.sacude) { const s = b.sacude.reduce((a, [t0, f]) => a + (t >= t0 ? f * Math.exp(-(t - t0) * 9) : 0), 0); cam.position.x += Math.sin(t * 91) * s; cam.position.y += Math.cos(t * 77) * s; }
  cam.aspect = W / H; cam.updateProjectionMatrix();
  R.render(w.scene, cam);
  return w;
}

window.init = async datos => {
  DATOS = datos;
  await Promise.all(['66px "Poppins XB"', '30px "Poppins SB"', '100px "Bebas"'].map(f => document.fonts.load(f)));
  return BEATS.map(b => ({ a: b.a, b: b.b, trans: b.trans, sfx: b.sfx || [] }));
};
window.render = async t => {
  const i = BEATS.findIndex(b => t >= b.a && t < b.b), b = BEATS[i < 0 ? BEATS.length - 1 : i], prev = BEATS[(i < 0 ? BEATS.length - 1 : i) - 1], lt = t - b.a;
  g.save(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  let w = null;
  if (b.modo === 'cam') await dibujaCam(t, lt);
  else if (!b.mundo) { g.fillStyle = b.fondo || C.papel; g.fillRect(0, 0, W, H); }
  else { w = render3D(b, t); g.drawImage(R.domElement, 0, 0); }
  if (b.ov) b.ov(lt, t, w, cam);
  if (b.modo === 'div') await dibujaVentana(t, b, prev);
  g.restore();
  transicion(b, t);
  subtitulos(t);
};
