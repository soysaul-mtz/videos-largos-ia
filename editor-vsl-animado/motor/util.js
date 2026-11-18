// Piezas comunes: tiempo, colores, materiales y modelos 3D (contenedor, nave, camión, figuras…)
import * as THREE from 'three';
import { RoundedBoxGeometry } from './lib/RoundedBoxGeometry.js';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const eOut = k => 1 - Math.pow(1 - clamp(k), 3);
export const eIO = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const eBack = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const eBounce = k => { k = clamp(k); const n = 7.5625, d = 2.75;
  if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };

export const C = { papel: '#EEEAE3', papel2: '#E3DED5', tinta: '#16181C', nar: '#F26B1D', nar2: '#D9551A', teal: '#13A3A0', teal2: '#0E7C7A',
  gris: '#B9B4AC', blanco: '#FAF8F4', rojo: '#E0412F', oro: '#E8A33A', vidrio: '#2B3A44' };

const _m = {};
export const mat = (color, rough = .62, metal = 0, extra = {}) => {
  const k = color + rough + metal + JSON.stringify(extra);
  return _m[k] || (_m[k] = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }));
};
export function sombra(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }
export const caja = (w, h, d, m, r = 0) => sombra(new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d), m));
export const cil = (rt, rb, h, m, seg = 32) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m));

// ---- textura de lámina corrugada (la que distingue a un contenedor) ----
const _tx = {};
function corrugado(color, rep) {
  const k = color + rep; if (_tx[k]) return _tx[k];
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
  const base = new THREE.Color(color);
  for (let x = 0; x < 512; x++) {
    const s = .5 + .5 * Math.cos((x / 512) * Math.PI * 2 * rep), f = .78 + .3 * s;
    g.fillStyle = `rgb(${Math.min(255, base.r * 255 * f)},${Math.min(255, base.g * 255 * f)},${Math.min(255, base.b * 255 * f)})`; g.fillRect(x, 0, 1, 64);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return (_tx[k] = t);
}

// contenedor de 20 pies (6.06 × 2.59 × 2.44 m), largo sobre X. op: {color, ventanas, largo}
export function contenedor(op = {}) {
  const color = op.color || C.nar, L = op.largo || 6.06, A = 2.59, P = 2.44, g = new THREE.Group();
  const lado = new THREE.MeshStandardMaterial({ map: corrugado(color, Math.round(L * 4)), roughness: .55, metalness: .25 });
  const punta = new THREE.MeshStandardMaterial({ map: corrugado(color, 7), roughness: .55, metalness: .25 });
  const techo = mat(color, .6, .2);
  const cuerpo = sombra(new THREE.Mesh(new THREE.BoxGeometry(L - .08, A - .1, P - .08), [punta, punta, techo, techo, lado, lado]));
  cuerpo.position.y = A / 2; g.add(cuerpo);
  const marco = mat(new THREE.Color(color).multiplyScalar(.72).getStyle(), .5, .3);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = caja(.14, A, .14, marco); p.position.set(sx * (L / 2 - .07), A / 2, sz * (P / 2 - .07)); g.add(p); }
  for (const y of [.06, A - .06]) for (const sz of [-1, 1]) { const r = caja(L, .12, .12, marco); r.position.set(0, y, sz * (P / 2 - .06)); g.add(r); }
  for (let i = 0; i < 4; i++) { const b = cil(.025, .025, A - .3, mat('#8a8a8a', .4, .8), 8); b.position.set(L / 2 + .01, A / 2, -P / 2 + .45 + i * .5); g.add(b); }
  if (op.ventanas) for (const sz of [1]) for (let i = 0; i < op.ventanas; i++) {
    const v = caja(1.3, 1.2, .06, mat(C.vidrio, .08, .6)); v.position.set(-L / 2 + 1 + i * (L - 2) / Math.max(1, op.ventanas - 1), A * .55, sz * (P / 2 + .02)); g.add(v);
    const m = caja(1.42, 1.32, .04, mat(C.tinta, .5)); m.position.copy(v.position); m.position.z -= .02 * sz; g.add(m);
  }
  g.userData = { L, A, P };
  return g;
}

// nave industrial por piezas (para armarla animada). Devuelve piezas con su orden
export function nave() {
  const g = new THREE.Group(), piezas = { losa: null, cols: [], muros: [], techo: [], cuartos: [] };
  const losa = caja(26, .4, 16, mat('#D6D0C6')); losa.position.y = .2; g.add(losa); piezas.losa = losa;
  for (const x of [-12.75, -6.4, 0, 6.4, 12.75]) for (const z of [-7.75, 7.75]) {
    const c = caja(.5, 8, .5, mat('#9C978F', .5, .3)); c.geometry.translate(0, 4, 0); c.position.set(x, .4, z); g.add(c); piezas.cols.push(c);
  }
  const mm = mat('#E9E5DE', .8);
  const atras = caja(26, 8, .25, mm); atras.geometry.translate(0, 4, 0); atras.position.set(0, .4, -7.9); g.add(atras); piezas.muros.push(atras);
  for (const sx of [-1, 1]) { const s = caja(.25, 8, 16, mm); s.geometry.translate(0, 4, 0); s.position.set(sx * 12.9, .4, 0); g.add(s); piezas.muros.push(s); }
  for (const sx of [-1, 1]) { const f = caja(9.5, 8, .25, mm); f.geometry.translate(0, 4, 0); f.position.set(sx * 8.25, .4, 7.9); g.add(f); piezas.muros.push(f); }
  const din = caja(7, 2.2, .25, mm); din.geometry.translate(0, 1.1, 0); din.position.set(0, 6.2, 7.9); g.add(din); piezas.muros.push(din);
  const tm = mat('#C9C3B9', .55, .25);
  for (const sz of [-1, 1]) { const r = caja(26.6, .25, 8.7, tm); r.position.set(0, 9.25, sz * 4.1); r.rotation.x = sz * .2; g.add(r); piezas.techo.push(r); }
  // cuartos adentro: oficinas, comedor, baños, sala de juntas
  const defs = [['OFICINAS', 6, 5, -8.4, -4], ['COMEDOR', 5, 4, -1.9, -4.5], ['BAÑOS', 3.6, 4, 3.4, -4.5], ['SALA DE JUNTAS', 5.4, 5, 9.4, -4]];
  for (const [n, w, d, x, z] of defs) {
    const q = new THREE.Group(); q.position.set(x, .4, z);
    const muro = caja(w, 3, d, mat(C.blanco, .7)); muro.geometry.translate(0, 1.5, 0); q.add(muro);
    const filo = caja(w + .08, .16, d + .08, mat(C.teal, .5)); filo.position.y = 3.02; q.add(filo);
    const vent = caja(w * .7, 1, .05, mat(C.vidrio, .1, .5)); vent.position.set(0, 1.7, d / 2 + .02); q.add(vent);
    q.userData = { nombre: n, muro, filo }; g.add(q); piezas.cuartos.push(q);
  }
  g.userData = piezas; return g;
}

export function camion() {
  const g = new THREE.Group();
  const cab = caja(2.4, 2.6, 2.5, mat(C.blanco, .4, .2), .25); cab.position.set(4.6, 1.9, 0); g.add(cab);
  const par = caja(.05, 1.1, 2.1, mat(C.vidrio, .1, .5)); par.position.set(5.81, 2.4, 0); g.add(par);
  const cama = caja(8, .35, 2.5, mat('#6F6A63', .6, .4)); cama.position.set(-1.2, 1.05, 0); g.add(cama);
  for (const x of [-4, -2.8, 0, 4.4]) for (const z of [-1.15, 1.15]) {
    const r = cil(.55, .55, .45, mat('#1d1d1f', .8), 24); r.rotation.x = Math.PI / 2; r.position.set(x, .55, z); g.add(r);
  }
  g.userData.ruedas = g.children.filter(c => c.geometry && c.geometry.type === 'CylinderGeometry');
  return g;
}

export function peon(color) {  // figura genérica tipo ficha (sin silueta de nadie)
  const g = new THREE.Group(), m = mat(color, .5);
  const b = cil(.32, .5, 1.25, m); b.position.y = .62; g.add(b);
  const h = sombra(new THREE.Mesh(new THREE.SphereGeometry(.34, 32, 16), m)); h.position.y = 1.55; g.add(h);
  return g;
}
export function casco(color) {
  const g = new THREE.Group(), m = mat(color, .35, .05);
  const d = sombra(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), m)); g.add(d);
  const a = cil(1.35, 1.35, .08, m, 40); a.position.y = .04; a.scale.z = 1.12; a.position.z = .18; g.add(a);
  const c = caja(.22, .2, 1.9, m); c.position.y = .92; g.add(c);
  return g;
}
export function moneda() { const m = cil(.62, .62, .16, mat('#F4B740', .32, .35), 40); return m; }
export function engrane(color) {
  const g = new THREE.Group(), m = mat(color, .4, .5);
  const anillo = sombra(new THREE.Mesh(new THREE.TorusGeometry(.8, .28, 16, 40), m)); g.add(anillo);
  for (let i = 0; i < 10; i++) { const d = caja(.36, .34, .42, m); const a = i / 10 * Math.PI * 2; d.position.set(Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0); d.rotation.z = a; g.add(d); }
  return g;
}
export function flecha(color, largo = 3) {
  const g = new THREE.Group(), m = mat(color, .4);
  const s = cil(.18, .18, largo, m); s.position.y = largo / 2; g.add(s);
  const p = sombra(new THREE.Mesh(new THREE.ConeGeometry(.48, .9, 32), m)); p.position.y = largo + .4; g.add(p);
  return g;
}
