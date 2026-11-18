// Sección 2 y 3 (0:39–4:02): por qué contenedores, infraestructura, estructura, volados, módulos, aislamiento.
import * as THREE from 'three';
import { clamp, lerp, prog, eOut, eIO, eBack, eBounce, C, mat, caja, cil, contenedor, camion, flecha } from './util.js';
import { mundo, D } from './app.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const orb = (a0, a1, r0, r1, h0, h1, mira, dur) => (c, lt) => { const k = eIO(clamp(lt / dur)), a = lerp(a0, a1, k), r = lerp(r0, r1, k);
  c.position.set(mira.x + Math.sin(a) * r, lerp(h0, h1, k), mira.z + Math.cos(a) * r); c.lookAt(mira); };
const crece = (o, k, eje = 'xyz') => { const s = Math.max(.0001, k); for (const e of eje) o.scale[e] = s; o.visible = k > .001; };
const P2 = (txt, v, k, op) => { const p = D.pt(v); D.pill(txt, p.x, p.y, k, op); };
const pills = (L, t, x = 1500, y0 = 170, paso = 92, op = {}) => L.forEach(([txt, a], i) => D.pill(txt, x, y0 + i * paso, prog(t, a, a + .3), { bg: C.tinta, size: 40, punto: C.nar, ...op }));
const tit = (txt, x, y, s, t, a, op = {}) => D.titulo(txt, x, y, s, prog(t, a, a + .3), { color: C.tinta, ...op });
const MAD = '#B9895A', TIERRA = '#A88763';

function grua() {  // grúa torre simple: mástil, pluma, cable y gancho
  const g = new THREE.Group(), m = mat(C.nar, .45, .3), oscuro = mat(C.tinta, .5);
  const mastil = caja(1, 22, 1, m); mastil.position.y = 11; g.add(mastil);
  for (let i = 0; i < 11; i++) { const d = caja(1.05, .12, 1.05, oscuro); d.position.y = 1 + i * 2; g.add(d); }
  const pluma = new THREE.Group(); pluma.position.y = 22.4; g.add(pluma);
  const brazo = caja(30, .8, .8, m); brazo.position.x = 9; pluma.add(brazo);
  const cabina = caja(2, 1.6, 1.6, mat(C.blanco, .4)); cabina.position.set(0, -1.2, 1.2); pluma.add(cabina);
  const contra = caja(3, 2, 1.6, mat('#777', .6)); contra.position.set(-5, -.6, 0); pluma.add(contra);
  const carro = new THREE.Group(); pluma.add(carro);
  const cable = cil(.05, .05, 1, mat('#333', .5), 6); cable.geometry.translate(0, -.5, 0); carro.add(cable);
  const gancho = caja(.8, .5, .8, mat(C.tinta)); carro.add(gancho);
  g.userData = { pluma, carro, cable, gancho }; return g;
}
function chispas(scene, n = 160) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFC24A', size: .14, transparent: true })); scene.add(p);
  p.userData.mover = (t, o, on) => { p.visible = on; for (let i = 0; i < n; i++) { const s = (i * 12.9898) % 1, fase = (t * 1.8 + i / n) % 1, a = i * 2.39996, v = 2 + s * 3;
    pos[i * 3] = o.x + Math.cos(a) * v * fase; pos[i * 3 + 1] = o.y + Math.abs(Math.sin(i)) * v * fase - 6 * fase * fase; pos[i * 3 + 2] = o.z + Math.sin(a) * v * fase; }
    geo.attributes.position.needsUpdate = true; p.material.opacity = on ? 1 : 0; };
  return p;
}
function nubeDe(scene, n, color, size) {  // copos / polvo que caen
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: .9 })); scene.add(p);
  p.userData.mover = t => { for (let i = 0; i < n; i++) { const a = (i * 0.618) % 1, b = (i * 0.371) % 1; pos[i * 3] = -14 + a * 28; pos[i * 3 + 1] = 14 - ((t * 2 + b * 14) % 14); pos[i * 3 + 2] = -8 + ((i * .17) % 1) * 16; }
    geo.attributes.position.needsUpdate = true; };
  return p;
}
const CO = [C.nar, C.teal, C.blanco, C.tinta, '#C94A2A', '#3D6B8C', '#E2B33C'];

export const MUNDOS = {
  terreno() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const tierra = caja(22, 5, 14, mat(TIERRA, .95)); tierra.position.y = -2.5; g.add(tierra);
    const pasto = caja(22.02, .25, 14.02, mat('#9DB57A', .9)); pasto.position.y = .12; g.add(pasto);
    const edif = new THREE.Group(); g.add(edif);
    for (let i = 0; i < 3; i++) { const p = caja(9, 3, 7, mat(i % 2 ? '#B4AFA7' : '#C8C3BA', .85)); p.position.y = 1.75 + i * 3.05; edif.add(p);
      for (let j = 0; j < 4; j++) { const v = caja(1.3, 1.4, .05, mat(C.vidrio, .1, .5)); v.position.set(-3.2 + j * 2.1, 1.9 + i * 3.05, 3.53); edif.add(v); } }
    const pilas = []; for (const x of [-3.5, 0, 3.5]) for (const z of [-2.5, 2.5]) { const p = cil(.35, .35, 4.6, mat('#8F8A82', .8)); p.position.set(x, -2.3, z); g.add(p); pilas.push(p); }
    m.estado = t => { crece(edif, eBack(prog(t, 39.2, 39.9)), 'y'); edif.scale.x = edif.scale.z = 1; pilas.forEach((p, i) => p.material = mat(t > 41.1 ? C.rojo : '#8F8A82', .8)); };
    return m;
  },
  grua() {
    const m = mundo(), gr = grua(); m.scene.add(gr); const U = gr.userData;
    const c = contenedor({ ventanas: 2 }); m.scene.add(c);
    const lote = (x, col) => { const l = caja(9, .06, 6, mat(col, .9)); l.position.set(x, .03, 0); m.scene.add(l); };
    lote(6, '#D9CDB8'); lote(24, '#CFE0D2');
    m.estado = t => {
      // gancho baja (41.7) → sube con el contenedor (43.9) → la pluma gira/carro avanza (44.5–46.3) → baja en el otro terreno (46.3–47.4)
      const xa = 6, xb = 24, sube = eIO(prog(t, 43.0, 44.4)), avanza = eIO(prog(t, 44.6, 46.3)), baja = eIO(prog(t, 46.3, 47.6));
      const x = lerp(xa, xb, avanza), yC = sube * 9 * (1 - baja) + 0;
      U.carro.position.x = x; const largo = 22.4 - (yC + 2.59) - .3; U.cable.scale.y = largo; U.gancho.position.y = -largo;
      c.position.set(x, yC, 0); c.rotation.y = Math.sin(t * 1.3) * .04 * (sube - baja);
    };
    return m;
  },
  inversion() {
    const m = mundo(), c = contenedor({ ventanas: 2 }); m.scene.add(c);
    const ped = cil(4.5, 4.8, .5, mat(C.blanco, .6), 64); ped.position.y = .25; m.scene.add(ped); c.position.y = .5;
    const mon = []; for (let i = 0; i < 10; i++) { const k = cil(.55, .55, .14, mat('#F4B740', .32, .35), 32); k.rotation.x = Math.PI / 2; m.scene.add(k); mon.push(k); }
    m.estado = t => mon.forEach((k, i) => { const a = t * 1.2 + i / 10 * Math.PI * 2; k.position.set(Math.cos(a) * 6, 3 + Math.sin(a * 2) * .6, Math.sin(a) * 6); k.rotation.z = a; crece(k, eBack(prog(t, 49.4 + i * .06, 49.8 + i * .06))); });
    return m;
  },
  reciclar() {
    const m = mundo(), c = contenedor({ color: C.teal, ventanas: 2 }); m.scene.add(c);
    const anillo = new THREE.Group(); anillo.position.y = 1.3; m.scene.add(anillo);
    for (let i = 0; i < 3; i++) { const arco = new THREE.Mesh(new THREE.TorusGeometry(5.5, .22, 12, 60, Math.PI * .55), mat(C.nar, .4)); arco.rotation.z = i * Math.PI * 2 / 3; anillo.add(arco);
      const pu = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.2, 24), mat(C.nar, .4)); const a = i * Math.PI * 2 / 3 + Math.PI * .55; pu.position.set(Math.cos(a) * 5.5, Math.sin(a) * 5.5, 0); pu.rotation.z = a; anillo.add(pu); }
    anillo.rotation.x = -Math.PI / 2;
    m.estado = t => { anillo.rotation.z = -t * 1.4; crece(anillo, eBack(prog(t, 51.4, 51.9))); };
    return m;
  },
  carretera() {
    const m = mundo({ piso: '#E6E1D8' }), g = new THREE.Group(); m.scene.add(g);
    const asf = caja(400, .05, 9, mat('#3A3D42', .9)); asf.position.y = .03; g.add(asf);
    const rayas = []; for (let i = 0; i < 80; i++) { const r = caja(3, .02, .25, mat('#F2E6C8', .7)); r.position.set(-200 + i * 5, .07, 0); g.add(r); rayas.push(r); }
    const pinos = []; for (let i = 0; i < 60; i++) { const p = new THREE.Group(); const tr = cil(.2, .25, 1.4, mat('#7A5A3A', .9), 8); tr.position.y = .7; p.add(tr);
      const co = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.8, 10), mat(i % 3 ? '#5E8C61' : '#77A36B', .8)); co.position.y = 2.6; co.castShadow = true; p.add(co);
      p.position.set(-200 + i * 7 + (i % 2) * 2, 0, (i % 2 ? 1 : -1) * (8 + (i % 5))); g.add(p); pinos.push(p); }
    const cam_ = camion(); m.scene.add(cam_); const c = contenedor({}); c.position.set(-1.2, 1.25, 0); cam_.add(c);
    m.estado = t => { const x = (t - 58) * 14; cam_.position.set(x, 0, -1.8); cam_.userData.ruedas.forEach(r => r.rotation.y = -x / .55); m.camX = x; };
    return m;
  },
  puerto() {
    const m = mundo({ piso: '#D9D4CB' }), g = new THREE.Group(); m.scene.add(g); const pilas = [];
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
      const n = 1 + ((i * 7 + j * 3) % 4); for (let k = 0; k < n; k++) { const c = contenedor({ color: CO[(i + j * 2 + k) % CO.length] }); c.position.set(-34 + i * 6.3, k * 2.59, -18 + j * 3 + (j > 2 ? 3 : 0)); g.add(c); pilas.push([c, k, i, j]); } }
    const agua = caja(200, .2, 60, mat('#5D8FA8', .25, .2)); agua.position.set(0, -.3, 32); m.scene.add(agua);
    m.estado = t => pilas.forEach(([c, k, i, j]) => { const a = 62.0 + (i + j) * .04 + k * .08; const e = eBounce(prog(t, a, a + .5)); c.position.y = k * 2.59 + (1 - e) * 12; c.visible = e > 0; });
    return m;
  },
  red() {
    const m = mundo({ piso: '#EDE8DF' }), g = new THREE.Group(); m.scene.add(g);
    const N = [[-22, -10], [-14, -14], [-6, -8], [2, -13], [10, -6], [18, -11], [24, -2], [-18, 0], [-9, 3], [0, 0], [8, 5], [16, 4], [-12, 10], [-2, 12], [6, 14], [14, 12], [22, 9], [-24, 8], [26, 14], [-4, -2], [12, -14], [-16, -6], [4, 8], [20, -6], [-8, 15]];
    const E = []; N.forEach((a, i) => N.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1]) < 10.5) E.push([i, j]); }));
    const nodos = N.map(([x, z]) => { const p = new THREE.Group(); const b = cil(.6, .6, .3, mat(C.blanco, .5), 24); b.position.y = .15; p.add(b);
      const pin = cil(.12, .12, 2.6, mat(C.tinta, .5), 8); pin.position.y = 1.3; p.add(pin); const cab = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 12), mat(C.nar, .35)); cab.position.y = 2.8; cab.castShadow = true; p.add(cab);
      p.position.set(x, 0, z); g.add(p); return p; });
    const aristas = E.map(([i, j]) => { const a = N[i], b = N[j], L = Math.hypot(b[0] - a[0], b[1] - a[1]); const r = caja(L, .06, .35, mat('#45484E', .8));
      r.position.set((a[0] + b[0]) / 2, .05, (a[1] + b[1]) / 2); r.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); r.userData.L = L; g.add(r); return r; });
    const camiones = E.slice(0, 8).map(([i, j]) => { const k = caja(1.4, .8, .7, mat(C.nar, .4)); m.scene.add(k); return [k, i, j]; });
    m.estado = t => {
      aristas.forEach((r, i) => { const k = eOut(prog(t, 65.4 + i * .05, 66 + i * .05)); crece(r, k, 'x'); r.material = mat(t > 70.4 && t < 73.5 ? C.nar : '#45484E', .8); });
      nodos.forEach((p, i) => crece(p, eBack(prog(t, 74.0 + i * .1, 74.4 + i * .1)) * (t >= 73.5 ? 1 : .0) + (t < 73.5 ? eBack(prog(t, 65.3 + i * .03, 65.7 + i * .03)) * .5 : 0)));
      camiones.forEach(([k, i, j], n) => { const f = ((t * .25 + n * .13) % 1), a = N[i], b = N[j]; k.position.set(lerp(a[0], b[0], f), .5, lerp(a[1], b[1], f)); k.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); k.visible = t > 66.5; });
    };
    return m;
  },
  barco() {
    const m = mundo({ fondo: '#E8EEF0', piso: '#6F9FB7' }), g = new THREE.Group(); m.scene.add(g);
    const casco_ = caja(30, 4, 8, mat('#2E3A46', .6, .2)); casco_.position.y = 1; g.add(casco_);
    const borde = caja(30.2, .5, 8.2, mat(C.rojo, .6)); borde.position.y = -.9; g.add(borde);
    const puente = caja(4, 6, 7, mat(C.blanco, .5)); puente.position.set(-12, 6, 0); g.add(puente);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) { const c = contenedor({ color: CO[(i + j + k) % CO.length] }); c.position.set(-6 + i * 6.2, 3 + k * 2.59, -2.5 + j * 2.5); g.add(c); }
    m.estado = t => { g.position.y = Math.sin(t * 1.6) * .25; g.rotation.z = Math.sin(t * 1.1) * .015; g.position.x = (t - 79) * -1.2; };
    return m;
  },
  estructura() {
    const m = mundo(), c = contenedor({ color: '#CFC9BF' }); m.scene.add(c);
    const marco = new THREE.Group(); m.scene.add(marco); const L = 6.06, A = 2.59, P = 2.44, mm = mat(C.nar, .35, .2, { emissive: C.nar, emissiveIntensity: .35 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = caja(.2, A + .1, .2, mm); p.position.set(sx * L / 2, A / 2, sz * P / 2); marco.add(p); }
    for (const y of [0, A]) for (const sz of [-1, 1]) { const r = caja(L + .2, .2, .2, mm); r.position.set(0, y, sz * P / 2); marco.add(r); }
    for (const y of [0, A]) for (const sx of [-1, 1]) { const r = caja(.2, .2, P + .2, mm); r.position.set(sx * L / 2, y, 0); marco.add(r); }
    m.estado = t => { crece(marco, eOut(prog(t, 84.3, 84.9))); const k = eIO(prog(t, 85, 86)); c.children[0].material.forEach?.(x => { if (!x.transparent) x.needsUpdate = true; x.transparent = true; x.opacity = 1 - k * .6; }); };
    return m;
  },
  tres() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const res = new THREE.Group(); { const a = contenedor({ color: C.blanco, ventanas: 2 }), b = contenedor({ color: C.nar, ventanas: 2 }); b.position.set(1.4, 2.59, 0); b.rotation.y = Math.PI / 2; res.add(a, b); }
    const pro = new THREE.Group(); { const a = contenedor({ color: C.teal, ventanas: 2 }), b = contenedor({ color: C.tinta, ventanas: 2 }); b.position.set(-1.5, 0, 2.5); b.rotation.y = Math.PI / 2; pro.add(a, b); }
    const ofi = new THREE.Group(); [C.blanco, C.nar].forEach((col, i) => { const k = contenedor({ color: col, ventanas: 3 }); k.position.y = i * 2.59; ofi.add(k); });
    const L = [res, pro, ofi]; L.forEach((o, i) => { o.position.x = -11 + i * 11; g.add(o); }); m.L = L;
    m.estado = t => [88.2, 89.2, 90.0].forEach((a, i) => crece(L[i], eBack(prog(t, a, a + .4))));
    return m;
  },
  despiece() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g); const L = 6.06, A = 2.59, P = 2.44, col = C.nar;
    const lado = () => { const c = contenedor({ color: col }); return c; };
    const piso = caja(L, .25, P, mat(MAD, .8)); const techo = caja(L, .15, P, mat(col, .5, .25));
    const muroA = caja(L, A, .12, mat(col, .55, .25)), muroB = caja(L, A, .12, mat(col, .55, .25));
    g.add(piso, techo, muroA, muroB); m.P = { piso, techo, muroA, muroB };
    m.estado = t => { const kM = eIO(prog(t, 94.7, 95.3)), kP = eIO(prog(t, 95.5, 96.1)), kT = eIO(prog(t, 96.1, 96.7));
      muroA.position.set(0, A / 2, P / 2 + kM * 2.6); muroB.position.set(0, A / 2, -P / 2 - kM * 2.6); piso.position.set(0, .12 - kP * .0, 0); piso.position.y = .12; piso.scale.y = 1;
      techo.position.set(0, A + kT * 3.2, 0); piso.material = mat(kP > .5 ? C.teal : MAD, .8); };
    return m;
  },
  barras() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const B = [['BLOCK', '#C9C3B9', 3], ['MADERA', MAD, 4.5], ['ACERO MARÍTIMO', C.nar, 9]]; m.B = B.map(([n, col, h], i) => { const b = caja(2.6, h, 2.6, mat(col, .5, i === 2 ? .35 : 0)); b.geometry.translate(0, h / 2, 0); b.position.x = -5 + i * 5; g.add(b); return b; });
    m.estado = t => m.B.forEach((b, i) => { b.scale.y = Math.max(.01, eBack(prog(t, 98.2 + i * .35, 98.8 + i * .35))); });
    return m;
  },
  pesas() {
    const m = mundo(), c = contenedor({}); m.scene.add(c); const P = [];
    for (let i = 0; i < 6; i++) { const p = caja(2.4, 1, 2, mat(i % 2 ? '#5B5F66' : '#6E737B', .45, .6), .12); m.scene.add(p); P.push(p); }
    m.estado = t => { P.forEach((p, i) => { const a = 104.6 + i * .25, k = eBounce(prog(t, a, a + .35)); p.position.set(-1.8 + (i % 3) * 1.8 * 1, 2.59 + .5 + Math.floor(i / 3) * 1.02 + (1 - k) * 12, (i % 2) * .1); p.visible = k > 0; });
      c.scale.y = 1 - .02 * Math.sin(Math.max(0, t - 104.6) * 20) * Math.exp(-Math.max(0, t - 104.6) * 3); };
    return m;
  },
  torre() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g); const T = [];
    for (let i = 0; i < 10; i++) { const c = contenedor({ color: CO[i % CO.length] }); c.rotation.y = (i % 2) * .04; g.add(c); T.push(c); }
    m.estado = t => { T.forEach((c, i) => { const a = 109.6 + i * .17, k = eBounce(prog(t, a, a + .3)); c.position.y = i * 2.59 + (1 - k) * 8; c.visible = k > 0; });
      g.rotation.z = t > 112.5 && t < 116 ? Math.sin(t * 5) * .012 * (1 - prog(t, 115, 116)) : 0; };
    return m;
  },
  soldar() {
    const m = mundo({ fondo: '#2A2C31', piso: '#34363B' }), c = contenedor({ color: '#B8B2A8' }); m.scene.add(c);
    const ref = []; for (let i = 0; i < 5; i++) { const r = caja(.18, 2.5, .18, mat(C.nar, .4, .3)); r.position.set(-2.6 + i * 1.3, 1.3, 1.3); m.scene.add(r); ref.push(r); }
    const ch = chispas(m.scene); const luz = new THREE.PointLight('#FFB347', 0, 12); luz.position.set(2.9, 2.4, 1.4); m.scene.add(luz);
    m.estado = t => { const on = t > 118.4 && t < 119.3; ch.userData.mover(t, V(2.9, 2.4, 1.4), on); luz.intensity = on ? 30 + Math.sin(t * 60) * 12 : 0;
      ref.forEach((r, i) => crece(r, eBack(prog(t, 119.2 + i * .12, 119.5 + i * .12)), 'y')); };
    return m;
  },
  volado() {
    const m = mundo(), base = contenedor({ color: C.blanco, ventanas: 2 }), arriba = contenedor({ color: C.nar, ventanas: 2 }); m.scene.add(base, arriba);
    const extra = []; [[C.teal, -4.2, 0, 2.6, Math.PI / 2], [C.tinta, 3.2, 5.18, -1, 0], [C.blanco, -2, 5.18, 2.2, 0]].forEach(([col, x, y, z, r]) => { const c = contenedor({ color: col, ventanas: 2 }); c.position.set(x, y, z); c.rotation.y = r; m.scene.add(c); extra.push(c); });
    const calida = new THREE.PointLight('#FFB070', 0, 30); calida.position.set(0, 6, 6); m.scene.add(calida);
    m.estado = t => { const k = eIO(prog(t, 128.8, 130.0)); arriba.position.set(lerp(0, 3.4, k), 2.59, 0);
      extra.forEach((c, i) => crece(c, eBack(prog(t, 131.6 + i * .7, 132.0 + i * .7)))); calida.intensity = t > 134.6 ? 80 * eOut(prog(t, 134.6, 135.4)) : 0; };
    return m;
  },
  costo() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const conc = new THREE.Group(); { const a = caja(6, 3, 5, mat('#B4AFA7', .9)); a.position.y = 1.5; const b = caja(9, 3, 5, mat('#C8C3BA', .9)); b.position.set(2, 4.5, 0); const p = caja(.5, 3, .5, mat('#8F8A82')); p.position.set(5.8, 1.5, 2); conc.add(a, b, p); }
    const cont = new THREE.Group(); { const a = contenedor({ color: C.blanco, ventanas: 2 }), b = contenedor({ color: C.nar, ventanas: 2 }); b.position.set(3, 2.59, 0); cont.add(a, b); }
    conc.position.x = -9; cont.position.x = 7; g.add(conc, cont); return m;
  },
  noche() {
    const m = mundo({ fondo: '#1C2230', piso: '#262C38', reticula: false }), g = new THREE.Group(); m.scene.add(g);
    const luz = mat('#FFD49A', .4, 0, { emissive: '#FFB45E', emissiveIntensity: 1.4 });
    [[0, 0, 0, 0, C.tinta], [3.2, 2.59, 0, 0, C.nar], [-1.5, 0, 2.6, Math.PI / 2, C.blanco], [0.8, 5.18, .6, 0, C.teal]].forEach(([x, y, z, r, col]) => {
      const c = contenedor({ color: col, ventanas: 0 }); c.position.set(x, y, z); c.rotation.y = r; g.add(c);
      for (let i = 0; i < 2; i++) { const v = caja(1.6, 1.3, .06, luz); v.position.set(-1.5 + i * 3, 1.45, 1.25); c.add(v); } });
    for (const [x, z] of [[-5, 6], [6, 5], [-7, -3]]) { const l = new THREE.PointLight('#FFB45E', 25, 14); l.position.set(x, 1, z); m.scene.add(l); }
    m.scene.children.filter(o => o.isHemisphereLight).forEach(h => h.intensity = .15); m.sol.intensity = .35;
    return m;
  },
  etapas() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g); m.E = [];
    for (let i = 0; i < 3; i++) { const b = caja(7, .4, 5, mat(C.blanco, .6)); b.position.set(-8 + i * 8, .2, 0); g.add(b); const c = contenedor({ color: [C.teal, C.nar, C.tinta][i], ventanas: 2 }); c.position.set(-8 + i * 8, .4, 0); g.add(c); m.E.push(c); }
    m.estado = t => m.E.forEach((c, i) => crece(c, eBack(prog(t, 159.3 + i * .9, 159.7 + i * .9))));
    return m;
  },
  modulos() {  // crecimiento modular (163–196): 1 módulo → se agregan → forma L / U
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const POS = [[0, 0, 0, 0], [0, 0, 2.5, 0], [6.1, 0, 0, 0], [6.1, 0, 2.5, 0], [0, 2.59, 0, 0], [-4.3, 0, 3.5, Math.PI / 2], [10.4, 0, 3.5, Math.PI / 2], [6.1, 2.59, 1.25, 0]];
    const M = POS.map(([x, y, z, r], i) => { const c = contenedor({ color: [C.nar, C.blanco, C.teal, C.blanco, C.tinta, C.teal, C.nar, C.blanco][i], ventanas: 2 }); c.position.set(x, y, z); c.rotation.y = r; g.add(c); return c; });
    g.position.set(-3, 0, -1.5);
    const T = [163.6, 169.3, 170.6, 171.0, 171.8, 999, 999, 999], T2 = [178.3, 184.0, 185.1, 186.0, 187.0, 187.4, 188.9, 189.4];
    m.estado = t => M.forEach((c, i) => { const a = t < 178 ? T[i] : T2[i]; const k = t < 178 ? eBounce(prog(t, a, a + .45)) : eBounce(prog(t, a, a + .45));
      c.visible = k > 0; c.position.y = POS[i][1] + (1 - k) * 9; });
    return m;
  },
  termo() {  // 200–242: neutro → frío → calor → aislamiento → confort → ventanas
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const c = contenedor({ color: '#C9C4BB' }); g.add(c);
    const capas = []; for (let i = 0; i < 3; i++) { const p = caja(5.8, 2.4, .12, mat([C.teal, '#F2D27A', '#E8A6B8'][i], .9)); p.position.set(0, 1.3, 0); g.add(p); capas.push(p); }
    const vent = []; for (let i = 0; i < 2; i++) { const v = caja(1.5, 1.3, .08, mat(C.vidrio, .05, .6)); v.position.set(-1.4 + i * 2.8, 1.4, 1.26); g.add(v); vent.push(v); const mm = caja(1.65, 1.45, .06, mat(C.tinta)); mm.position.set(-1.4 + i * 2.8, 1.4, 1.23); g.add(mm); vent.push(mm); }
    const nieve = nubeDe(m.scene, 400, '#ffffff', .12);
    m.estado = t => {
      const frio = t >= 206.6 && t < 210.3, calor = t >= 210.3 && t < 212.4;
      const col = frio ? '#9CC9E8' : calor ? '#E86A4A' : t >= 203.3 && t < 206.6 ? '#9EA3AA' : '#C9C4BB';
      c.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.color && o !== c.children[0]) {} });
      const corte = t >= 212.4 && t < 232.4;
      c.children[0].material.forEach(x => { x.color.set(col); x.metalness = t >= 203.3 && t < 206.6 ? .75 : .25; x.roughness = t >= 203.3 && t < 206.6 ? .3 : .55; if (x.transparent !== corte) x.needsUpdate = true; x.transparent = corte; x.opacity = corte ? .28 : 1; x.depthWrite = !corte; });
      m.scene.background.set(frio ? '#DCE9F2' : calor ? '#F6DCCF' : C.papel); m.scene.fog.color.copy(m.scene.background);
      nieve.visible = frio; nieve.userData.mover(t);
      capas.forEach((p, i) => { const a = [214.4, 215.2, 216.1][i], k = t >= 212.4 && t < 232.4 ? eOut(prog(t, a, a + .5)) : 0, grosor = t > 229.9 ? 1 + i * .8 * eOut(prog(t, 230, 230.6)) : 1;
        p.visible = k > 0; p.position.z = lerp(6, -.6 + i * .5, k); p.scale.z = grosor; });
      vent.forEach((v, i) => crece(v, eBack(prog(t, 235.6 + Math.floor(i / 2) * .3, 236 + Math.floor(i / 2) * .3))));
    };
    return m;
  },
  zonas() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const Z = [['#9CC9E8', -9, -4], ['#E86A4A', 7, 3], ['#F2D27A', -2, 6], ['#9CC9E8', 10, -6], ['#E86A4A', -10, 7]];
    m.Z = Z.map(([col, x, z]) => { const d = cil(4.5, 4.5, .1, mat(col, .9), 48); d.position.set(x, .06, z); g.add(d); return d; });
    const pin = new THREE.Group(); const p = cil(.15, .15, 3, mat(C.tinta), 8); p.position.y = 1.5; const s = new THREE.Mesh(new THREE.SphereGeometry(.7, 24, 12), mat(C.nar, .35)); s.position.y = 3.3; pin.add(p, s); g.add(pin); m.pin = pin;
    m.estado = t => { m.Z.forEach((d, i) => crece(d, eBack(prog(t, 224 + i * .25, 224.4 + i * .25)), 'xz')); const k = eIO(prog(t, 225.4, 226.6)); pin.position.set(lerp(-9, 7, k), (1 - eBounce(prog(t, 226.4, 226.9))) * 0, lerp(-4, 3, k)); };
    return m;
  },
};

// ================= LÍNEA DE TIEMPO 0:39–4:02 =================
const W_ = 1920;
export const BEATS = [
  // --- por qué contenedores ---
  { a: 39.18, b: 41.7, modo: '3d', mundo: 'terreno', trans: 'zoom', sfx: [['tic', 41.2]],
    cam: orb(.7, .45, 38, 34, 11, 9, V(0, 3.5, 0), 2.5), ov: (lt, t) => { P2('SE QUEDA EN EL TERRENO', V(0, 11, 0), prog(t, 40.8, 41.1), { bg: C.rojo, size: 36 }); } },
  { a: 41.7, b: 44.5, modo: '3d', mundo: 'grua', trans: 'whip', sfx: [['whoosh_grave', 43.1]],
    cam: orb(.9, .75, 62, 56, 14, 12, V(13, 10, 0), 2.8), ov: (lt, t) => tit('SE PUEDE TRASLADAR', 960, 150, 110, t, 43.9, { color: C.nar }) },
  { a: 44.5, b: 47.8, modo: 'div', mundo: 'grua', trans: 'nada',
    cam: orb(.45, .3, 58, 54, 14, 12, V(17, 9, 0), 3.3), ov: (lt, t) => P2('OTRO TERRENO', V(24, 4.5, 0), prog(t, 46.3, 46.6), { bg: C.teal, size: 34 }) },
  { a: 47.8, b: 51.3, modo: '3d', mundo: 'inversion', trans: 'zoom', sfx: [['moneda', 49.5]],
    cam: orb(.3, .9, 20, 18, 8, 7, V(0, 1.8, 0), 3.5), ov: (lt, t) => { tit('INVERSIÓN', 960, 140, 120, t, 50.8, { color: C.nar }); P2('MÓVIL', V(0, 4.6, 0), prog(t, 49.5, 49.8), { bg: C.tinta, size: 40 }); } },
  { a: 51.3, b: 54.8, modo: 'div', mundo: 'reciclar', trans: 'nada', sfx: [['tic', 52.1], ['tic', 53.1], ['tic', 54.3]],
    cam: orb(.4, .6, 22, 20, 12, 11, V(0, 1, 0), 3.5), ov: (lt, t) => pills([['RESCATAR', 52.1], ['REUTILIZAR', 53.1], ['RECICLAR', 54.3]], t, 1560, 160) },
  { a: 54.8, b: 58.0, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('VENTAJA #1', 1520, 300, prog(t, 56.3, 56.6), { bg: C.nar, size: 54 }) },
  { a: 58.0, b: 62.0, modo: '3d', mundo: 'carretera', trans: 'whip', sfx: [['whoosh_rapido', 58.7]],
    cam: (c, lt, t, w) => { const x = (t - 58) * 14; c.position.set(x + lerp(14, 4, eIO(lt / 4)), lerp(5, 9, lt / 4), 14); c.lookAt(x, 1.5, -1.8); },
    ov: (lt, t) => tit('A OTRO SITIO', 960, 150, 110, t, 60.9, { color: C.nar }) },
  // --- infraestructura ---
  { a: 62.0, b: 65.3, modo: '3d', mundo: 'puerto', trans: 'zoom', sfx: [['boom', 62.6]],
    cam: orb(.6, .35, 70, 60, 40, 34, V(0, 0, -6), 3.3), ov: (lt, t) => tit('RED DE INFRAESTRUCTURA', 960, 140, 100, t, 63.9) },
  { a: 65.3, b: 69.6, modo: 'div', mundo: 'red', trans: 'nada',
    cam: orb(.2, .35, 52, 48, 40, 36, V(0, 0, 0), 4.3), ov: (lt, t) => tit('REDES DE DISTRIBUCIÓN', 1300, 140, 90, t, 68.5) },
  { a: 69.6, b: 73.5, modo: '3d', mundo: 'red', trans: 'zoom', sfx: [['tic', 70.4], ['tic', 71.6], ['tic', 72.6]],
    cam: orb(.9, .7, 34, 30, 20, 18, V(0, 0, 0), 3.9), ov: (lt, t) => pills([['CARRETERAS', 70.4], ['MOBILIARIO', 71.6], ['GRÚAS', 72.6]], t, 1580, 170) },
  { a: 73.5, b: 79.1, modo: '3d', mundo: 'red', trans: 'sube', sfx: [['riser', 74]],
    cam: orb(0, .25, 50, 46, 52, 48, V(0, 0, 2), 5.6), ov: (lt, t) => tit('TODA LA REPÚBLICA', 960, 140, 120, t, 77.6, { color: C.nar }) },
  // --- estructura ---
  { a: 79.1, b: 83.2, modo: '3d', mundo: 'barco', trans: 'whip', sfx: [['whoosh_grave', 79.3]],
    cam: orb(.9, .75, 50, 44, 16, 14, V(0, 3, 0), 4.1), ov: (lt, t) => tit('DISEÑADO PARA CARGAS', 960, 140, 100, t, 82.5) },
  { a: 83.2, b: 87.8, modo: 'div', mundo: 'estructura', trans: 'nada',
    cam: orb(.7, 1.1, 15, 14, 6, 5, V(0, 1.3, 0), 4.6), ov: (lt, t) => tit('CAPACIDAD ESTRUCTURAL', 1300, 150, 84, t, 84.5, { color: C.nar }) },
  { a: 87.8, b: 90.8, modo: '3d', mundo: 'tres', trans: 'zoom', sfx: [['tic', 88.2], ['tic', 89.2], ['tic', 90.0]],
    cam: orb(.5, .4, 34, 32, 12, 11, V(0, 2, 0), 3), ov: (lt, t, w) => ['RESIDENCIAS', 'PROYECTOS', 'OFICINAS'].forEach((n, i) => P2(n, V(w.L[i].position.x, 7.5, 0), prog(t, [88.2, 89.2, 90][i] + .1, [88.2, 89.2, 90][i] + .4), { bg: C.tinta, size: 32, punto: C.nar })) },
  { a: 90.8, b: 94.5, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('CARGA EXTRA', 1520, 300, prog(t, 91.4, 91.7), { bg: C.nar, size: 54 }) },
  { a: 94.5, b: 97.0, modo: '3d', mundo: 'despiece', trans: 'whip', sfx: [['whoosh_rapido', 94.7], ['whoosh_rapido', 95.5], ['whoosh_rapido', 96.1]],
    cam: orb(.75, .6, 17, 16, 9, 8, V(0, 1.6, 0), 2.5), ov: (lt, t) => { P2('MUROS', V(0, 3.5, 4.5), prog(t, 94.8, 95.1), { bg: C.tinta, size: 32 }); P2('PISO', V(-4.3, .6, 1.5), prog(t, 95.6, 95.9), { bg: C.teal, size: 32 }); P2('TECHO', V(0, 6.6, 0), prog(t, 96.2, 96.5), { bg: C.nar, size: 32 }); } },
  { a: 97.0, b: 101.1, modo: '3d', mundo: 'barras', trans: 'zoom', sfx: [['tic', 98.2], ['tic', 98.55], ['boom', 98.9]],
    cam: orb(.35, .2, 24, 22, 7, 6, V(0, 4, 0), 4.1), ov: (lt, t) => { tit('RESISTENCIA', 960, 120, 90, t, 97.2); ['BLOCK', 'MADERA', 'ACERO MARÍTIMO'].forEach((n, i) => P2(n, V(-5 + i * 5, -.2, 2), prog(t, 98.3 + i * .35, 98.6 + i * .35), { bg: i === 2 ? C.nar : C.tinta, size: 30 })); } },
  { a: 101.1, b: 104.3, modo: 'cam', trans: 'zoom' },
  { a: 104.3, b: 108.1, modo: '3d', mundo: 'pesas', trans: 'whip', sacude: [[104.65, .2], [105.15, .2], [105.65, .25]], sfx: [['boom', 104.65], ['boom', 105.4], ['boom', 106.1]],
    cam: orb(.8, .65, 18, 17, 7, 7, V(0, 2.5, 0), 3.8), ov: (lt, t) => { const k = eOut(prog(t, 104.6, 106.3)); D.titulo(Math.round(26 * k) + ' TONELADAS', 960, 160, 140, prog(t, 104.6, 104.9), { color: C.nar }); } },
  { a: 108.1, b: 112.5, modo: '3d', mundo: 'torre', trans: 'sube', sfx: [['riser', 109.6], ['boom', 111.5]],
    cam: (c, lt, t) => { const k = eIO(prog(t, 109.6, 111.6)); c.position.set(-26, lerp(8, 16, k), 44); c.lookAt(0, lerp(4, 12, k), 0); },
    ov: (lt, t) => { const n = t < 109.6 ? 0 : Math.min(10, Math.floor((t - 109.6) / .17) + 1); if (n > 0) { D.titulo(String(n), 1500, 380, 300, 1, { color: C.nar }); D.titulo('NIVELES', 1500, 560, 80, 1, { color: C.tinta }); } } },
  { a: 112.5, b: 115.8, modo: 'div', mundo: 'torre', trans: 'nada',
    cam: (c, lt) => { c.position.set(-34, 14, 50); c.lookAt(-6, 12, 0); }, ov: (lt, t) => tit('ESBELTEZ', 1560, 300, 150, t, 114.8, { color: C.nar }) },
  { a: 115.8, b: 118.1, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.check(1500, 330, 80, prog(t, 117.2, 117.7)) },
  { a: 118.1, b: 120.0, modo: '3d', mundo: 'soldar', trans: 'flash', sfx: [['glitch_corto', 118.5], ['tic', 119.2]],
    cam: orb(.95, .8, 9, 8, 3.2, 3, V(1.5, 1.5, 0), 1.9), ov: (lt, t) => { P2('SOLDAMOS', V(2.9, 4, 1.4), prog(t, 118.6, 118.9), { bg: C.nar, size: 32 }); P2('REFORZAMOS', V(-1, 3.6, 1.4), prog(t, 119.2, 119.5), { bg: C.teal, size: 32 }); } },
  { a: 120.0, b: 124.2, modo: 'div', fondo: '#163A5C', trans: 'nada', ov: (lt, t) => plano(t, 120.0, 124.2) },
  // --- volados ---
  { a: 124.2, b: 126.7, modo: 'cam', trans: 'zoom' },
  { a: 126.7, b: 131.1, modo: '3d', mundo: 'volado', trans: 'whip', sfx: [['whoosh_grave', 128.9]],
    cam: orb(.6, .9, 22, 20, 7, 6, V(1.5, 2.6, 0), 4.4), ov: (lt, t) => { tit('VOLADOS', 960, 140, 120, t, 129.7, { color: C.nar }); } },
  { a: 131.1, b: 135.8, modo: 'div', mundo: 'volado', trans: 'nada', sfx: [['tic', 131.6], ['tic', 132.3], ['tic', 133.0]],
    cam: orb(.9, 1.3, 26, 24, 10, 9, V(0, 3, 0), 4.7), ov: (lt, t) => tit('ATMÓSFERAS', 1300, 150, 110, t, 134.7, { color: C.nar }) },
  { a: 135.8, b: 141.3, modo: '3d', mundo: 'costo', trans: 'zoom', sfx: [['moneda', 139.5]],
    cam: orb(.15, .05, 36, 33, 9, 8, V(-1, 3, 0), 5.5), ov: (lt, t) => { P2('$$$$', V(-8, 9, 0), prog(t, 138.4, 138.7), { bg: C.rojo, size: 56 }); P2('$', V(8.5, 7.5, 0), prog(t, 139.5, 139.8), { bg: C.teal, size: 56 }); tit('VOLADO CONVENCIONAL', 560, 900, 0, t, 999); } },
  { a: 141.3, b: 145.9, modo: 'div', mundo: 'costo', trans: 'nada',
    cam: orb(-.3, -.4, 24, 22, 8, 8, V(-8, 3, 0), 4.6), ov: (lt, t) => { P2('MUCHO DINERO', V(-8, 9, 0), prog(t, 145.0, 145.3), { bg: C.rojo, size: 40 }); tit('CÁLCULO CONVENCIONAL', 1300, 150, 80, t, 142.5); } },
  { a: 145.9, b: 151.1, modo: '3d', mundo: 'noche', trans: 'flash', sfx: [['listo', 149.3]],
    cam: orb(.4, .9, 24, 21, 6, 6, V(0, 3.5, 0), 5.2), ov: (lt, t) => { tit('LLAMATIVO', 960, 130, 120, t, 149.3, { color: '#FFB45E', sombra: 'rgba(0,0,0,.6)' }); D.pill('A BAJO COSTO', 960, 260, prog(t, 150.5, 150.8), { bg: C.teal, size: 44 }); } },
  // --- logística y módulos ---
  { a: 151.1, b: 157.9, modo: 'div', mundo: 'carretera', trans: 'nada', sfx: [['tic', 154.2], ['tic', 155.0], ['tic', 155.7], ['tic', 157.0]],
    cam: (c, lt, t) => { const x = (t - 58) * 14; c.position.set(x + 10, 8, 16); c.lookAt(x, 1.5, -1.8); }, ov: (lt, t) => pills([['LOGÍSTICA', 154.2], ['TRASLADO', 155.0], ['MOVILIDAD', 155.7], ['PRACTICIDAD', 157.0]], t, 1560, 140, 86) },
  { a: 157.9, b: 162.7, modo: '3d', mundo: 'etapas', trans: 'zoom', sfx: [['tic', 159.3], ['tic', 160.2], ['tic', 161.1]],
    cam: orb(.45, .35, 30, 28, 12, 11, V(0, 1, 0), 4.8), ov: (lt, t, w) => w.E.forEach((c, i) => P2('ETAPA ' + (i + 1), V(-8 + i * 8, 4.6, 0), prog(t, 159.4 + i * .9, 159.7 + i * .9), { bg: C.tinta, size: 32, punto: C.nar })) },
  { a: 162.7, b: 163.6, modo: 'cam', trans: 'zoom' },
  { a: 163.6, b: 167.1, modo: '3d', mundo: 'modulos', trans: 'whip',
    cam: orb(.6, .5, 26, 24, 12, 11, V(0, 1.5, 0), 3.5), ov: (lt, t) => D.barra(1300, 200, 480, Math.min(.25, prog(t, 165.8, 166.3)), 'PRESUPUESTO LIMITADO', C.rojo) },
  { a: 167.1, b: 171.8, modo: 'div', mundo: 'modulos', trans: 'nada', sfx: [['tic', 169.3], ['tic', 170.6], ['tic', 171.0]],
    cam: orb(.5, .8, 30, 28, 14, 13, V(0, 1.5, 0), 4.7), ov: (lt, t) => tit('POCO A POCO', 1300, 150, 110, t, 170.6, { color: C.nar }) },
  { a: 171.8, b: 175.3, modo: '3d', mundo: 'modulos', trans: 'zoom', sfx: [['riser', 171.8]],
    cam: orb(.8, 1.0, 30, 28, 16, 14, V(0, 2, 0), 3.5), ov: (lt, t) => grafica(1500, 330, prog(t, 171.8, 174.5)) },
  { a: 175.3, b: 178.3, modo: 'cam', trans: 'zoom' },
  { a: 178.3, b: 181.6, modo: 'div', mundo: 'modulos', trans: 'nada',
    cam: orb(.6, .7, 22, 21, 11, 10, V(0, 1.3, 0), 3.3), ov: (lt, t) => { const k = eOut(prog(t, 179.0, 181)); D.titulo(Math.round(15 * k) + ' m²', 1300, 170, 130, prog(t, 179, 179.3), { color: C.nar }); } },
  { a: 181.6, b: 186.3, modo: '3d', mundo: 'modulos', trans: 'whip', sfx: [['tic', 184.4], ['tic', 185.1], ['tic', 186.0]],
    cam: orb(.4, .65, 30, 28, 14, 13, V(1, 1.5, 0), 4.7), ov: (lt, t) => pills([['EMPRESA', 184.4], ['NEGOCIO', 185.1], ['CASA', 186.0]], t, 1580, 170) },
  { a: 186.3, b: 191.3, modo: '3d', mundo: 'modulos', trans: 'zoom', sfx: [['tic', 187.0], ['tic', 187.4], ['tic', 188.9], ['tic', 189.4]],
    cam: (c, lt) => { const k = eIO(lt / 5); c.position.set(lerp(6, 2, k), lerp(24, 34, k), lerp(22, 14, k)); c.lookAt(1.5, 0, 0); }, ov: (lt, t) => tit('SE ADAPTA A TU PROYECTO', 960, 140, 90, t, 188.9) },
  { a: 191.3, b: 196.7, modo: '3d', fondo: C.tinta, trans: 'flash', sfx: [['boom', 193.6]], mundo: null, ov: (lt, t) => noConstruyes(t) },
  // --- aislamiento ---
  { a: 196.7, b: 200.1, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.titulo('?', 1520, 420, 380, prog(t, 199.6, 199.9), { color: C.nar, rot: Math.sin(t * 4) * .06, sombra: 'rgba(0,0,0,.5)' }) },
  { a: 200.1, b: 203.3, modo: 'div', mundo: 'termo', trans: 'nada',
    cam: orb(.5, .7, 16, 15, 6, 6, V(0, 1.3, 0), 3.2), ov: (lt, t) => { tit('¿FRÍO', 1150, 180, 120, t, 203.0, { color: '#3D8BC9' }); tit('O CALIENTE?', 1500, 180, 120, t, 202.2, { color: C.rojo }); } },
  { a: 203.3, b: 206.6, modo: '3d', mundo: 'termo', trans: 'zoom', sfx: [['glitch_corto', 206.3]],
    cam: orb(1.0, .8, 13, 12, 5, 5, V(0, 1.3, 0), 3.3), ov: (lt, t) => tit('PURO ACERO', 960, 140, 120, t, 206.2, { color: C.tinta }) },
  { a: 206.6, b: 210.3, modo: '3d', mundo: 'termo', trans: 'flash',
    cam: orb(.6, .5, 15, 14, 6, 6, V(0, 1.3, 0), 3.7), ov: (lt, t) => D.termo(1600, 420, lerp(18, -8, eOut(prog(t, 207.5, 210))), prog(t, 207, 207.3), '#3D8BC9') },
  { a: 210.3, b: 212.4, modo: '3d', mundo: 'termo', trans: 'flash',
    cam: orb(.3, .2, 15, 14, 6, 6, V(0, 1.3, 0), 2.1), ov: (lt, t) => D.termo(1600, 420, lerp(-8, 46, eOut(prog(t, 210.4, 212.2))), 1, C.rojo) },
  { a: 212.4, b: 219.1, modo: 'div', mundo: 'termo', trans: 'nada', sfx: [['whoosh_rapido', 214.3], ['whoosh_rapido', 215.1], ['whoosh_rapido', 216.0]],
    cam: orb(.9, .6, 17, 16, 7, 6, V(0, 1.3, 0), 6.7), ov: (lt, t) => pills([['AISLAMIENTO', 214.4], ['TÉRMICO', 215.2], ['ACÚSTICO', 216.1]], t, 1560, 170) },
  { a: 219.1, b: 223.9, modo: '3d', mundo: 'termo', trans: 'zoom', sfx: [['listo', 223.1]],
    cam: orb(.4, .6, 15, 14, 6, 6, V(0, 1.3, 0), 4.8), ov: (lt, t) => { D.termo(1600, 420, lerp(46, 22, eOut(prog(t, 219.3, 222.8))), 1, C.teal); D.check(1600, 160, 60, prog(t, 223.1, 223.6)); } },
  { a: 223.9, b: 227.8, modo: '3d', mundo: 'zonas', trans: 'whip',
    cam: orb(.3, .5, 30, 28, 24, 22, V(0, 0, 0), 3.9), ov: (lt, t) => tit('ESTUDIO POR ZONA', 960, 140, 110, t, 225.0, { color: C.nar }) },
  { a: 227.8, b: 232.4, modo: 'div', mundo: 'termo', trans: 'nada',
    cam: orb(1.2, 1.4, 14, 13, 8, 7, V(0, 1.3, 0), 4.6), ov: (lt, t) => tit('TIPO Y CANTIDAD', 1300, 150, 100, t, 228.8, { color: C.nar }) },
  { a: 232.4, b: 234.9, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.check(1500, 330, 80, prog(t, 234.1, 234.6)) },
  { a: 234.9, b: 242.5, modo: '3d', mundo: 'termo', trans: 'whip', sfx: [['tic', 235.6], ['tic', 237.9], ['tic', 238.7], ['listo', 241.4]],
    cam: orb(.2, .7, 15, 13, 5, 4.5, V(0, 1.4, 0), 7.6), ov: (lt, t) => { pills([['VENTANERÍA', 235.6], ['AISLAMIENTO', 237.9], ['ACABADOS', 238.7]], t, 1560, 170); tit('SENSACIÓN PLACENTERA', 960, 140, 0, t, 999); } },
];

// plano estructural dibujándose (2D)
function plano(t, a, b) {
  const g = D.g, k = prog(t, a + .2, b - .6); g.save(); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
  for (let x = 0; x < 1920; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1080); g.stroke(); } for (let y = 0; y < 1080; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(1920, y); g.stroke(); }
  g.strokeStyle = '#EAF4FF'; g.lineWidth = 4; g.lineCap = 'round';
  const L = [[900, 300, 1700, 300], [1700, 300, 1700, 640], [1700, 640, 900, 640], [900, 640, 900, 300], [1100, 300, 1100, 640], [1300, 300, 1300, 640], [1500, 300, 1500, 640], [900, 470, 1700, 470], [880, 680, 1720, 680], [880, 670, 880, 690], [1720, 670, 1720, 690]];
  L.forEach(([x0, y0, x1, y1], i) => { const p = clamp(k * L.length - i); if (p <= 0) return; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, p), lerp(y0, y1, p)); g.stroke(); });
  g.font = '34px "Poppins SB"'; g.fillStyle = '#EAF4FF'; g.textAlign = 'center'; g.globalAlpha = clamp(k * 3 - 2); g.fillText('6.06 m', 1300, 720); g.globalAlpha = 1;
  g.restore(); D.titulo('CÁLCULO ESTRUCTURAL', 1300, 170, 100, prog(t, 123.3, 123.6), { color: '#fff', sombra: 'rgba(0,0,0,.4)' });
}
function grafica(x, y, k) {  // gráfica de crecimiento 2D
  const g = D.g; if (k <= 0) return; g.save(); g.globalAlpha = clamp(k * 4); g.fillStyle = 'rgba(22,24,28,.92)'; D.rr(g, x - 260, y - 190, 520, 380, 30); g.fill();
  const P = [[0, 0], [.2, .15], [.4, .3], [.6, .38], [.8, .65], [1, 1]]; g.strokeStyle = C.nar; g.lineWidth = 10; g.lineCap = g.lineJoin = 'round'; g.beginPath();
  P.forEach(([px, py], i) => { const q = clamp(k * (P.length - 1) - i + 1); if (q <= 0) return; const X = x - 200 + px * 400, Y = y + 130 - py * 260; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
  g.font = '34px "Poppins XB"'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText('TU EMPRESA CRECE', x - 210, y - 140); g.restore();
}
function noConstruyes(t) {
  const g = D.g, k1 = prog(t, 192.4, 192.7), tacha = eOut(prog(t, 193.0, 193.4));
  D.titulo('NO CONSTRUYES', 960, 230, 190, k1, { color: '#fff', sombra: 'rgba(0,0,0,.5)' });
  if (tacha > 0) { g.save(); g.strokeStyle = C.rojo; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(470, 240); g.lineTo(lerp(470, 1450, tacha), 220); g.stroke(); g.restore(); }
  D.titulo('MONTAS', 960, 480, 280, prog(t, 193.6, 193.9), { color: C.nar, slam: true });
}
