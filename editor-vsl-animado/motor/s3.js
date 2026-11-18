// Sección 4:02–7:45: transformación, este espacio, fábrica y montaje, empaquetado, tiempos, bodega.
import * as THREE from 'three';
import { clamp, lerp, prog, eOut, eIO, eBack, eBounce, C, mat, caja, cil, contenedor, camion, engrane, peon } from './util.js';
import { mundo, D } from './app.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const orb = (a0, a1, r0, r1, h0, h1, mira, dur) => (c, lt) => { const k = eIO(clamp(lt / dur)), a = lerp(a0, a1, k), r = lerp(r0, r1, k);
  c.position.set(mira.x + Math.sin(a) * r, lerp(h0, h1, k), mira.z + Math.cos(a) * r); c.lookAt(mira); };
const crece = (o, k, eje = 'xyz') => { const s = Math.max(.0001, k); for (const e of eje) o.scale[e] = s; o.visible = k > .001; };
const cae = (o, t, a, y0 = 0, alto = 10) => { const k = eBounce(prog(t, a, a + .45)); o.position.y = y0 + (1 - k) * alto; o.visible = k > 0; };
const P2 = (txt, v, k, op) => { const p = D.pt(v); D.pill(txt, p.x, p.y, k, op); };
const pills = (L, t, x = 1560, y0 = 170, paso = 88, op = {}) => L.forEach(([txt, a], i) => D.pill(txt, x, y0 + i * paso, prog(t, a, a + .3), { bg: C.tinta, size: 38, punto: C.nar, ...op }));
const tit = (txt, x, y, s, t, a, op = {}) => D.titulo(txt, x, y, s, prog(t, a, a + .3), { color: C.tinta, ...op });
const MAD = '#B9895A';
const transparente = (c, k) => c.children[0].material.forEach(x => { if (x.transparent !== (k < 1)) x.needsUpdate = true; x.transparent = k < 1; x.opacity = k; x.depthWrite = k >= 1; });

function chispas(scene, n = 140) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFC24A', size: .13, transparent: true })); scene.add(p);
  p.userData.mover = (t, o, on) => { p.visible = on; for (let i = 0; i < n; i++) { const s = (i * 12.9898) % 1, f = (t * 1.8 + i / n) % 1, a = i * 2.39996, v = 2 + s * 3;
    pos[i * 3] = o.x + Math.cos(a) * v * f; pos[i * 3 + 1] = o.y + Math.abs(Math.sin(i)) * v * f - 6 * f * f; pos[i * 3 + 2] = o.z + Math.sin(a) * v * f; } geo.attributes.position.needsUpdate = true; };
  return p;
}
function grua_(color = C.nar) {
  const g = new THREE.Group(), m = mat(color, .45, .3);
  const mastil = caja(1, 13, 1, m); mastil.position.y = 6.5; g.add(mastil);
  const pluma = new THREE.Group(); pluma.position.y = 13.4; g.add(pluma); const brazo = caja(22, .8, .8, m); brazo.position.x = 7; pluma.add(brazo);
  const carro = new THREE.Group(); pluma.add(carro); const cable = cil(.05, .05, 1, mat('#333'), 6); cable.geometry.translate(0, -.5, 0); carro.add(cable);
  g.userData = { carro, cable }; return g;
}
function escritorio() {
  const g = new THREE.Group(); const top = caja(1.6, .08, .8, mat(C.blanco, .5)); top.position.y = .75; g.add(top);
  for (const x of [-.7, .7]) { const p = caja(.06, .75, .7, mat(C.tinta)); p.position.set(x, .37, 0); g.add(p); }
  const mon = caja(.6, .4, .05, mat(C.tinta, .3)); mon.position.set(0, 1.05, -.25); g.add(mon);
  const silla = caja(.5, .5, .5, mat(C.teal, .6), .08); silla.position.set(0, .3, .65); g.add(silla); return g;
}
function montacargas() {
  const g = new THREE.Group(); const b = caja(1.4, 1, 2, mat('#E2B33C', .5), .1); b.position.y = .8; g.add(b);
  const mast = caja(.15, 2.6, .15, mat(C.tinta)); mast.position.set(0, 1.5, 1.1); g.add(mast); const u = caja(1.2, .1, 1, mat(C.tinta)); u.position.set(0, .5, 1.6); g.add(u);
  for (const x of [-.6, .6]) for (const z of [-.6, .6]) { const r = cil(.3, .3, .2, mat('#1d1d1f'), 16); r.rotation.z = Math.PI / 2; r.position.set(x, .3, z); g.add(r); }
  return g;
}
function caja_(c) { return caja(.8, .6, .8, mat(c || '#C9A06B', .8)); }

// nave de producción con banda y oficinas que se montan a un lado
function bodega(op) {
  const m = mundo(), g = new THREE.Group(); m.scene.add(g);
  const piso = caja(30, .3, 18, mat('#D6D0C6')); piso.position.set(-4, .15, 0); g.add(piso);
  const fondo = caja(30, 8, .3, mat('#E9E5DE', .8)); fondo.position.set(-4, 4, -9); g.add(fondo);
  for (const x of [-18, -10, -2, 6]) { const c = caja(.5, 8, .5, mat('#9C978F', .5, .3)); c.position.set(x, 4, 8.5); g.add(c); }
  const techo = caja(30.5, .3, 18.5, mat('#C9C3B9', .55, .2)); techo.position.set(-4, 8.2, 0); g.add(techo); m.techo = techo;
  const banda = caja(22, .9, 1.6, mat('#45484E', .6, .3)); banda.position.set(-6, .75, 0); g.add(banda);
  const cajas = []; for (let i = 0; i < 12; i++) { const k = caja_(); g.add(k); cajas.push(k); }
  const eng = []; for (const x of [-14, -6, 2]) { const e = engrane(C.nar); e.scale.setScalar(.7); e.position.set(x, 3.5, -8.5); g.add(e); eng.push(e); }
  const ofis = op.ofis.map(([x, z, r, col], i) => { const c = contenedor({ color: col, ventanas: 2 }); c.position.set(x, 0, z); c.rotation.y = r; m.scene.add(c); return c; });
  m.ofis = ofis;
  m.estado = t => {
    cajas.forEach((k, i) => { const f = ((t * .12 + i / 12) % 1); k.position.set(-17 + f * 22, 1.5, 0); });
    eng.forEach((e, i) => e.rotation.z = t * (i % 2 ? -1.2 : 1.2));
    ofis.forEach((c, i) => { cae(c, t, op.tOfis[i], 0, 12); if (op.vuela && t > op.vuela) { const k = eIO(prog(t, op.vuela + i * .15, op.vuela + 1.6 + i * .15)); c.position.y = k * 22; c.position.x = op.ofis[i][0] + k * 30; } });
    techo.visible = !op.sinTecho || t < op.sinTecho;
  };
  return m;
}
// montaje: camión llega con el contenedor y la grúa lo pone en el terreno (t0 = cuando llega)
function montaje(t0) {
  const m = mundo(), gr = grua_(), CX = -12, CZ = -14; gr.position.set(CX, 0, CZ); m.scene.add(gr); const U = gr.userData;
  const lote = caja(10, .08, 7, mat('#D9CDB8', .9)); lote.position.set(8, .04, -5); m.scene.add(lote);
  for (const [x, z] of [[4, -7.5], [12, -7.5], [4, -2.5], [12, -2.5]]) { const z_ = caja(.8, .3, .8, mat('#9C978F')); z_.position.set(x, .15, z); m.scene.add(z_); }
  const cam_ = camion(); m.scene.add(cam_); const c = contenedor({ ventanas: 2 }); m.scene.add(c);
  m.estado = t => {
    const llega = eOut(prog(t, t0, t0 + 1.2)); cam_.position.set(lerp(-40, 0, llega), 0, 4); cam_.userData.ruedas.forEach(r => r.rotation.y = -cam_.position.x / .55);
    const sube = eIO(prog(t, t0 + 1.3, t0 + 2.0)), pasa = eIO(prog(t, t0 + 2.0, t0 + 3.0)), baja = eIO(prog(t, t0 + 3.0, t0 + 3.6));
    const x = lerp(-1.2 + cam_.position.x, 8, pasa), z = lerp(4, -5, pasa), y = lerp(1.25, 7, sube) * (1 - baja) + baja * .3;
    c.position.set(x, sube > 0 ? y : 1.25, sube > 0 ? z : 4); if (sube === 0) c.position.x = cam_.position.x - 1.2;
    const px = c.position.x, pz = c.position.z; U.carro.position.x = Math.hypot(px - CX, pz - CZ); gr.rotation.y = Math.atan2(-(pz - CZ), px - CX);
    const largo = Math.max(.5, 13.4 - (c.position.y + 2.59)); U.cable.scale.y = largo; U.cable.visible = sube > 0 || t > t0 + 3.6;
  };
  return m;
}

export const MUNDOS = {
  taller() {  // 246.9–255.7: cortamos, adecuamos, movemos, conectamos, modificamos
    const m = mundo(), a = contenedor({ color: C.nar }), b = contenedor({ color: C.teal }); m.scene.add(a, b); b.position.set(0, 0, -9);
    const disco = cil(.9, .9, .08, mat('#B8B8B8', .3, .8), 32); disco.rotation.x = Math.PI / 2; m.scene.add(disco);
    const panel = caja(3, 2.2, .1, mat(C.nar, .5, .25)); m.scene.add(panel);
    const muroInt = caja(.1, 2.3, 2.2, mat(C.blanco, .8)); muroInt.position.set(1, 1.3, 0); m.scene.add(muroInt);
    const vent = []; for (let i = 0; i < 2; i++) { const v = caja(1.4, 1.2, .08, mat(C.vidrio, .05, .6)); v.position.set(-1.6 + i * 3.2, 1.45, 1.27); a.add(v); vent.push(v); }
    const ch = chispas(m.scene);
    m.estado = t => {
      const corta = prog(t, 247.2, 248.0); disco.visible = t < 248.1; disco.position.set(lerp(-2.2, 2.2, corta), 1.3, 1.5); disco.rotation.y = t * 30;
      ch.userData.mover(t, disco.position, t > 247.2 && t < 248.0);
      const sale = eIO(prog(t, 247.9, 248.4)); panel.position.set(.5, 1.3, 1.3 + sale * 3); panel.rotation.x = sale * .6; panel.visible = t < 248.9;
      crece(muroInt, eBack(prog(t, 248.1, 248.5)), 'y');
      const mueve = eIO(prog(t, 248.9, 249.6)); a.position.x = mueve * -3;
      const une = eIO(prog(t, 249.8, 250.5)); b.position.set(-3, 0, lerp(-9, -2.44, une));
      vent.forEach((v, i) => crece(v, eBack(prog(t, 250.7 + i * .2, 251 + i * .2))));
    };
    return m;
  },
  doble() {
    const m = mundo(), a = contenedor({ color: C.blanco }), b = contenedor({ color: C.blanco }); b.position.y = 2.59; m.scene.add(a, b);
    const vol = caja(5.6, 4.9, 2.1, mat(C.teal, .6, 0, { transparent: true, opacity: .35 })); vol.position.y = 2.6; m.scene.add(vol);
    const vid = caja(5.4, 4.6, .06, mat(C.vidrio, .05, .6, { transparent: true, opacity: .55 })); vid.position.set(0, 2.6, 1.25); m.scene.add(vid);
    m.estado = t => { const k = prog(t, 260.8, 261.4); transparente(a, 1 - k * .75); transparente(b, 1 - k * .75); crece(vol, eBack(prog(t, 261.8, 262.3)), 'y'); vid.visible = t > 262.8; };
    return m;
  },
  ampliar() {
    const m = mundo(), c = contenedor({ color: C.blanco, ventanas: 2 }); m.scene.add(c); const V_ = [];
    const mm = mat(C.nar, .4, .4);
    for (let i = 0; i < 4; i++) { const p = caja(.2, 2.6, .2, mm); p.geometry.translate(0, 1.3, 0); p.position.set(-2.7 + i * 1.8, 0, 4.4); m.scene.add(p); V_.push(p); }
    for (let i = 0; i < 4; i++) { const v = caja(.2, .2, 3.2, mm); v.position.set(-2.7 + i * 1.8, 2.6, 2.8); m.scene.add(v); V_.push(v); }
    const losa = caja(6, .15, 3.2, mat(MAD, .8)); losa.position.set(0, .08, 2.8); m.scene.add(losa); V_.push(losa);
    m.estado = t => V_.forEach((p, i) => crece(p, eBack(prog(t, 276.2 + i * .12, 276.6 + i * .12)), i < 4 ? 'y' : 'xyz'));
    return m;
  },
  materiales() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const mk = (col, r, mt, x) => { const p = caja(3.6, 3.6, .4, mat(col, r, mt), .15); p.position.set(x, 2.4, 0); g.add(p); return p; };
    const L = [mk(MAD, .7, 0, -4.5), mk('#A9A49C', .95, 0, 0), new THREE.Group()];
    const foco = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat('#FFE2A8', .3, 0, { emissive: '#FFC870', emissiveIntensity: 1.6 })); foco.position.set(4.5, 2.6, 0); L[2].add(foco);
    const luz = new THREE.PointLight('#FFC870', 30, 12); luz.position.set(4.5, 2.6, 1.5); L[2].add(luz); g.add(L[2]); m.L = L;
    m.estado = t => { [284.5, 286.4, 287.8].forEach((a, i) => crece(L[i], eBack(prog(t, a, a + .4)))); g.rotation.y = Math.sin(t * .6) * .15; };
    return m;
  },
  fabrica() {
    const m = mundo({ fondo: '#E7E3DC' }), g = new THREE.Group(); m.scene.add(g);
    const piso = caja(46, .2, 16, mat('#CFC9BF')); piso.position.y = .1; g.add(piso);
    const riel = caja(44, .3, 3, mat('#45484E', .6, .3)); riel.position.y = .35; g.add(riel);
    const arcos = []; [-12, 0, 12].forEach((x, i) => { const a = new THREE.Group(); const c = mat([C.teal, C.nar, C.tinta][i], .5);
      const l = caja(.6, 5, .6, c); l.position.set(0, 2.5, -2.2); const r = caja(.6, 5, .6, c); r.position.set(0, 2.5, 2.2); const t_ = caja(.6, .6, 5, c); t_.position.y = 5; a.add(l, r, t_); a.position.x = x; g.add(a); arcos.push(a); });
    const L = []; for (let i = 0; i < 5; i++) { const c = contenedor({ color: [C.blanco, '#C9C4BB', C.nar, C.teal, C.blanco][i], ventanas: i > 1 ? 2 : 0 }); g.add(c); L.push(c); }
    const ch = chispas(m.scene); m.arcos = arcos;
    m.estado = t => { L.forEach((c, i) => { const f = ((t * .07 + i / 5) % 1); c.position.set(-22 + f * 44, .5, 0); }); ch.userData.mover(t, V(0, 4.5, 0), true); };
    return m;
  },
  montaje1: () => montaje(318.2),
  montaje2: () => montaje(338.5),
  obra() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const sucia = new THREE.Group(); sucia.position.x = -8; g.add(sucia);
    const ls = caja(12, .1, 10, mat('#B59E7E', .95)); sucia.add(ls);
    for (let i = 0; i < 18; i++) { const e = caja(.4 + (i % 3) * .3, .3 + (i % 2) * .4, .5, mat(i % 2 ? '#9C978F' : '#C8B08A', .9)); e.position.set(-5 + (i * 1.7) % 10, .2, -4 + (i * 2.3) % 8); e.rotation.y = i; sucia.add(e); }
    for (let i = 0; i < 3; i++) { const p = cil(.5, .5, 2 + i, mat('#B4AFA7', .9), 12); p.position.set(-3 + i * 3, 1 + i / 2, -2); sucia.add(p); }
    const limpia = new THREE.Group(); limpia.position.x = 8; g.add(limpia);
    const ll = caja(12, .1, 10, mat('#A9C48C', .9)); limpia.add(ll); const c = contenedor({ color: C.nar, ventanas: 2 }); c.position.y = .1; limpia.add(c); m.c = c;
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(300 * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const polvo = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#A89478', size: .35, transparent: true, opacity: .55 })); m.scene.add(polvo);
    m.estado = t => { for (let i = 0; i < 300; i++) { const a = (i * .618) % 1, b = (i * .377) % 1; pos[i * 3] = -14 + a * 12 + Math.sin(t + i) * .5; pos[i * 3 + 1] = ((t * .6 + b) % 1) * 5; pos[i * 3 + 2] = -5 + ((i * .13) % 1) * 10; } geo.attributes.position.needsUpdate = true; cae(c, t, 335.6, .1, 8); };
    return m;
  },
  remoto() {
    const m = mundo({ fondo: '#E3E8E6', piso: '#C9D3C2' }), g = new THREE.Group(); m.scene.add(g);
    [[-14, -10, 9, 12], [6, -16, 12, 16], [20, -6, 7, 9], [-24, 4, 6, 8], [-4, -22, 10, 14]].forEach(([x, z, r, h]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat('#8FA483', .95)); c.position.set(x, h / 2, z); c.castShadow = c.receiveShadow = true; g.add(c);
      const n = new THREE.Mesh(new THREE.ConeGeometry(r * .3, h * .3, 7), mat('#fff', .9)); n.position.set(x, h * .85, z); g.add(n); });
    for (let i = 0; i < 30; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(.8, 2.4, 8), mat('#5E8C61', .8)); p.position.set(-20 + (i * 7.3) % 40, 1.2, 4 + (i * 3.1) % 14); p.castShadow = true; g.add(p); }
    const c = contenedor({ color: C.nar, ventanas: 2 }); m.scene.add(c); m.c = c;
    m.estado = t => { cae(c, t, 344.2, 0, 14); c.rotation.y = .4; };
    return m;
  },
  empaque() {  // contenedor transparente que se llena (357–368)
    const m = mundo(), c = contenedor({ color: C.blanco }); m.scene.add(c); const I = [];
    const pisoM = caja(5.8, .08, 2.2, mat(MAD, .7)); pisoM.position.y = .22; I.push(pisoM);
    const ven = new THREE.Group(); for (let i = 0; i < 2; i++) { const v = caja(1.4, 1.2, .08, mat(C.vidrio, .05, .6)); v.position.set(-1.6 + i * 3.2, 1.45, 1.22); ven.add(v); } I.push(ven);
    const ele = new THREE.Group(); { const cab = caja(5.6, .06, .06, mat('#F2C230', .5)); cab.position.set(0, 2.35, -1); ele.add(cab); for (const x of [-1.8, 0, 1.8]) { const l = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 8), mat('#FFE2A8', .3, 0, { emissive: '#FFC870', emissiveIntensity: 1.5 })); l.position.set(x, 2.25, 0); ele.add(l); } } I.push(ele);
    const dre = new THREE.Group(); { const p = cil(.12, .12, 5.6, mat('#8A8F96', .4, .6), 12); p.rotation.z = Math.PI / 2; p.position.set(0, .4, -1.05); dre.add(p); } I.push(dre);
    const aire = caja(1.1, .45, .35, mat('#F4F4F4', .4)); aire.position.set(2.2, 2.0, -1.0); I.push(aire);
    const mob = new THREE.Group(); { const e1 = escritorio(), e2 = escritorio(); e1.position.set(-1.4, .25, -.2); e2.position.set(1, .25, -.2); mob.add(e1, e2); } I.push(mob);
    I.forEach(o => m.scene.add(o)); m.I = I;
    const T = [358.5, 359.1, 360.2, 361.3, 362.1, 363.3];
    m.estado = t => { const abierto = t < 364.3 ? 1 : 1 - prog(t, 364.3, 365.2); transparente(c, 1 - abierto * .8);
      I.forEach((o, i) => { const k = eBack(prog(t, T[i], T[i] + .4)); crece(o, k); o.position.y = (o.userData.y0 ??= o.position.y) + (1 - clamp(k)) * 3; }); };
    return m;
  },
  escritorios() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g); const E = [];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const e = escritorio(); e.position.set(-8 + i * 4, 0, -4.5 + j * 3); g.add(e); E.push(e); }
    m.estado = t => E.forEach((e, i) => crece(e, eBack(prog(t, 369.3 + i * .045, 369.7 + i * .045))));
    return m;
  },
  operando: () => bodega({ ofis: [[14, 0, Math.PI / 2, C.nar]], tOfis: [390.4] }),
  bodega: () => bodega({ ofis: [[14, -3.5, Math.PI / 2, C.nar], [16.5, -3.5, Math.PI / 2, C.blanco], [14, 3.2, Math.PI / 2, C.teal], [16.5, 3.2, Math.PI / 2, C.tinta]], tOfis: [403.4, 407.7, 408.2, 408.7], vuela: 420.7, sinTecho: 0 }),
  planta() {  // bodega con contenedores: baños/oficinas/juntas · almacenes/maquinaria · andén
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const losa = caja(34, .2, 22, mat('#D6D0C6')); losa.position.y = .1; g.add(losa);
    const izq = [['BAÑOS', C.teal, -10, -6], ['ADMINISTRACIÓN', C.blanco, -10, -3.5], ['SALA DE JUNTAS', C.nar, -10, -1]].map(([n, col, x, z]) => { const c = contenedor({ color: col, ventanas: 2 }); c.position.set(x, .2, z); c.userData.n = n; g.add(c); return c; });
    const der = [['ALMACENES', C.tinta, 10, -6], ['MAQUINARIA', '#3D6B8C', 10, -3.5], ['EQUIPOS', C.blanco, 10, -1]].map(([n, col, x, z]) => { const c = contenedor({ color: col }); c.position.set(x, .2, z); c.userData.n = n; g.add(c); return c; });
    const anden = caja(12, .8, 8, mat('#BDB6AA', .8)); anden.position.set(0, .5, -3.5); g.add(anden);
    const cajas = []; for (let i = 0; i < 16; i++) { const k = caja_(i % 3 ? null : C.nar); k.position.set(-4.5 + (i % 4) * 1.4, 1.2 + Math.floor(i / 8) * .62, -6 + Math.floor((i % 8) / 4) * 1.4); g.add(k); cajas.push(k); }
    const mc = montacargas(); mc.position.set(2.5, .9, -1.5); g.add(mc);
    m.izq = izq; m.der = der;
    m.estado = t => {
      const TI = t < 440.4 ? [435.6, 437.1, 439.5] : [441.0, 441.2, 441.4]; izq.forEach((c, i) => cae(c, t, TI[i], .2, 10));
      [447.0, 449.7, 450.7].forEach((a, i) => cae(der[i], t, a, .2, 10));
      crece(anden, eOut(prog(t, 454.0, 454.5)), 'xz'); cajas.forEach((k, i) => crece(k, eBack(prog(t, 455.5 + i * .04, 455.8 + i * .04)))); crece(mc, eBack(prog(t, 455.3, 455.7)));
      mc.position.x = 2.5 + Math.sin(t * .8) * 2;
    };
    return m;
  },
};

// ---------- 2D ----------
function medidores(t) {
  const g = D.g; [['MÁS RÁPIDO', 302.2], ['MÁS EFICIENTE', 303.0], ['MENOR COSTO', 304.6]].forEach(([n, a], i) => {
    const k = prog(t, a, a + .8), x = 420 + i * 540, y = 450; if (prog(t, a - .3, a) <= 0) return;
    g.save(); g.globalAlpha = clamp(prog(t, a - .3, a) * 3); g.lineWidth = 34; g.lineCap = 'round'; g.strokeStyle = 'rgba(22,24,28,.12)'; g.beginPath(); g.arc(x, y, 200, Math.PI, 0); g.stroke();
    g.strokeStyle = [C.nar, C.teal, C.nar][i]; g.beginPath(); g.arc(x, y, 200, Math.PI, Math.PI + Math.PI * .92 * eOut(k)); g.stroke();
    const an = Math.PI + Math.PI * .92 * eOut(k); g.strokeStyle = C.tinta; g.lineWidth = 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * 160, y + Math.sin(an) * 160); g.stroke();
    g.fillStyle = C.tinta; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.font = '46px "Poppins XB"'; g.textAlign = 'center'; g.fillText(n, x, y - 250); g.restore();
  });
}
function barrasTiempo(t, x0 = 820, y0 = 330) {
  const g = D.g, k1 = eOut(prog(t, 323.0, 324.6)), k2 = eOut(prog(t, 324.6, 325.8)), W = 900;
  g.save(); g.font = '38px "Poppins XB"'; g.textBaseline = 'middle'; g.fillStyle = C.tinta;
  g.fillText('SISTEMA TRADICIONAL', x0, y0 - 50); g.fillStyle = '#B4AFA7'; D.rr(g, x0, y0, W * k1, 70, 35); g.fill();
  g.fillStyle = C.tinta; g.fillText('CONTENEDORES', x0, y0 + 150); g.fillStyle = C.nar; D.rr(g, x0, y0 + 200, W * .62 * k2, 70, 35); g.fill(); g.restore();
}
function porcentaje(t) {
  const k = eOut(prog(t, 326.2, 327.8)), a = Math.round(30 * k), b = Math.round(40 * k);
  D.titulo(`${a}–${b}%`, 960, 330, 300, prog(t, 326.2, 326.5), { color: C.nar }); D.titulo('MÁS RÁPIDO', 960, 540, 110, prog(t, 328.1, 328.4), { color: C.tinta });
}
function timeline(t) {
  const g = D.g, x0 = 820, y = 420, k = eIO(prog(t, 374.5, 377.5)), fin = lerp(1700, 1350, k);
  g.save(); g.lineWidth = 14; g.lineCap = 'round'; g.strokeStyle = C.tinta; g.beginPath(); g.moveTo(x0, y); g.lineTo(fin, y); g.stroke();
  for (let i = 0; i < 5; i++) { const x = lerp(x0, fin, i / 4); g.fillStyle = i === 4 ? C.nar : '#fff'; g.strokeStyle = C.tinta; g.lineWidth = 8; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill(); g.stroke(); }
  g.font = '40px "Poppins XB"'; g.fillStyle = C.nar; g.textAlign = 'center'; g.fillText('TU PROYECTO LISTO', fin, y - 70); g.restore();
  D.titulo('ENTRE MÁS RÁPIDO…', 1260, 200, 90, prog(t, 376.5, 376.8));
}
function renta(t) {
  const g = D.g, x0 = 380, y0 = 620, W = 1160, H = 380, k = prog(t, 379.4, 383.0);
  g.save(); g.strokeStyle = 'rgba(22,24,28,.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0 - H); g.lineTo(x0, y0); g.lineTo(x0 + W, y0); g.stroke();
  const L = (col, f) => { g.strokeStyle = col; g.lineWidth = 12; g.lineCap = g.lineJoin = 'round'; g.beginPath(); for (let i = 0; i <= 60 * k; i++) { const u = i / 60, X = x0 + u * W, Y = y0 - f(u) * H; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); };
  L(C.teal, u => Math.max(0, (u - .25) * 1.3)); L(C.rojo, u => Math.max(0, (u - .55) * 1.2) * .8);
  g.font = '36px "Poppins XB"'; g.fillStyle = C.teal; g.fillText('CON CONTENEDORES: RECUPERAS ANTES', x0 + 30, y0 - H - 20); g.fillStyle = C.rojo; g.fillText('CONSTRUCCIÓN TRADICIONAL', x0 + 30, y0 - H + 30); g.restore();
  D.titulo('RECUPERAS LA RENTA', 960, 140, 100, prog(t, 379.9, 380.2), { color: C.nar });
}
function checklist(L, t, x = 1250, y0 = 300) {
  const g = D.g; L.forEach(([n, a], i) => { const k = prog(t, a, a + .35); if (k <= 0) return; const y = y0 + i * 95;
    g.save(); g.globalAlpha = clamp(k * 3); g.fillStyle = 'rgba(22,24,28,.92)'; D.rr(g, x - 30, y - 38, 620, 76, 38); g.fill(); g.restore(); D.check(x + 8, y, 26, k);
    g.save(); g.globalAlpha = clamp(k * 3); g.font = '36px "Poppins XB"'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(n, x + 60, y + 2); g.restore(); });
}

// ================= LÍNEA DE TIEMPO 4:02–7:45 =================
export const BEATS = [
  { a: 242.5, b: 246.9, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('NO VIVES EN UN SOLO CONTENEDOR', 1450, 260, prog(t, 244.5, 244.8), { bg: C.nar, size: 40 }) },
  { a: 246.9, b: 248.1, modo: '3d', mundo: 'taller', trans: 'flash', sfx: [['glitch_corto', 247.2]], cam: orb(.5, .4, 13, 12, 4, 4, V(0, 1.3, 0), 1.2), ov: (lt, t) => tit('CORTAMOS', 960, 150, 150, t, 247.3, { color: C.nar }) },
  { a: 248.1, b: 248.9, modo: '3d', mundo: 'taller', trans: 'whip', cam: orb(1.2, 1.3, 12, 12, 5, 5, V(0, 1.3, 0), .8), ov: (lt, t) => tit('ADECUAMOS', 960, 150, 150, t, 248.1, { color: C.teal }) },
  { a: 248.9, b: 249.8, modo: '3d', mundo: 'taller', trans: 'whip', dir: -1, cam: orb(.2, .1, 18, 17, 8, 8, V(-1.5, 1.3, 0), .9), ov: (lt, t) => tit('MOVEMOS', 960, 150, 150, t, 248.9, { color: C.nar }) },
  { a: 249.8, b: 250.7, modo: '3d', mundo: 'taller', trans: 'whip', sfx: [['boom', 250.4]], cam: orb(.9, 1.0, 18, 18, 10, 10, V(-2, 1.3, -1.5), .9), ov: (lt, t) => tit('CONECTAMOS', 960, 150, 150, t, 249.8, { color: C.teal }) },
  { a: 250.7, b: 255.7, modo: '3d', mundo: 'taller', trans: 'whip', sfx: [['tic', 250.7], ['tic', 250.9]], cam: orb(.4, .9, 17, 16, 7, 6, V(-1.5, 1.3, -1), 5), ov: (lt, t) => { tit('MODIFICAMOS', 960, 150, 150, t, 250.7, { color: C.nar }); D.pill('TAL CUAL LO NECESITAS', 960, 290, prog(t, 253.7, 254), { bg: C.tinta, size: 40 }); } },
  { a: 255.7, b: 260.3, modo: 'div', mundo: 'solucion', trans: 'nada', cam: orb(.5, .8, 13, 12, 5, 5, V(0, 1.3, 0), 4.6),
    ov: (lt, t) => { const p = D.pt(V(0, 3.4, 1.3)); D.pill('2.44 × 6.06 m', p.x, p.y, prog(t, 259.3, 259.6), { bg: C.tinta, size: 40 }); if (t > 259.9) { const g = D.g; g.save(); g.strokeStyle = C.rojo; g.lineWidth = 12; g.lineCap = 'round'; const k = eOut(prog(t, 259.9, 260.2)); g.beginPath(); g.moveTo(p.x - 170, p.y + 10); g.lineTo(p.x - 170 + 340 * k, p.y - 10); g.stroke(); g.restore(); } } },
  { a: 260.3, b: 262.8, modo: '3d', mundo: 'doble', trans: 'zoom', sfx: [['whoosh_rapido', 260.7], ['boom', 261.8]], cam: orb(.6, .45, 15, 14, 4, 4, V(0, 2.6, 0), 2.5),
    ov: (lt, t) => { D.pill('ABRIR CARAS', 1500, 200, prog(t, 260.8, 261.1), { bg: C.tinta, size: 40 }); D.pill('DOBLES ALTURAS', 1500, 290, prog(t, 261.8, 262.1), { bg: C.teal, size: 40 }); } },
  { a: 262.8, b: 266.8, modo: 'div', mundo: 'doble', trans: 'nada', cam: orb(1.0, 1.4, 17, 16, 6, 5, V(0, 2.6, 0), 4), ov: (lt, t) => tit('MÁS INTERESANTE', 1300, 150, 110, t, 264.3, { color: C.nar }) },
  { a: 266.8, b: 271.0, modo: '3d', mundo: 'estructura', trans: 'whip', sfx: [['moneda', 268.3]], cam: orb(.4, .8, 14, 13, 6, 5, V(0, 1.3, 0), 4.2),
    ov: (lt, t) => { tit('EL CONTENEDOR ES LA ESTRUCTURA', 960, 140, 90, t, 269.2); D.pill('MUY BARATO', 960, 270, prog(t, 268.2, 268.5), { bg: C.teal, size: 44 }); } },
  { a: 271.0, b: 275.8, modo: '3d', mundo: 'despiece', trans: 'zoom', sfx: [['tic', 272.7], ['tic', 273.4], ['tic', 274.0]], cam: orb(.3, .7, 18, 17, 9, 8, V(0, 1.6, 0), 4.8),
    ov: (lt, t) => { P2('✓ PISO', V(-4, .6, 1.5), prog(t, 272.7, 273), { bg: C.teal, size: 32 }); P2('✓ MUROS', V(0, 3.4, 4.6), prog(t, 273.4, 273.7), { bg: C.teal, size: 32 }); P2('✓ TECHO', V(0, 6.6, 0), prog(t, 274.0, 274.3), { bg: C.teal, size: 32 }); } },
  { a: 275.8, b: 278.5, modo: '3d', mundo: 'ampliar', trans: 'whip', sfx: [['tic', 276.2], ['tic', 276.7], ['boom', 278.0]], cam: orb(.8, .6, 16, 15, 7, 6, V(0, 1.4, 1.5), 2.7), ov: (lt, t) => tit('+ ACERO', 960, 150, 150, t, 277.8, { color: C.nar }) },
  { a: 278.5, b: 282.6, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('NO ES UN ESPACIO LIMITADO', 1480, 260, prog(t, 281.3, 281.6), { bg: C.nar, size: 42 }) },
  { a: 282.6, b: 288.7, modo: 'div', mundo: 'materiales', trans: 'nada', sfx: [['tic', 284.5], ['tic', 286.4], ['tic', 287.8]], cam: orb(.0, .2, 17, 16, 4, 4, V(0, 2.4, 0), 6),
    ov: (lt, t, w) => ['MATERIALIDAD', 'SENSACIÓN', 'DISEÑO'].forEach((n, i) => P2(n, V(-4.5 + i * 4.5, 5.2, 0), prog(t, [284.5, 286.4, 287.8][i] + .1, [284.5, 286.4, 287.8][i] + .4), { bg: C.tinta, size: 30, punto: C.nar })) },
  { a: 288.7, b: 292.4, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('ESTE ESPACIO = CONTENEDORES', 1480, 250, prog(t, 291.4, 291.7), { bg: C.nar, size: 42 }) },
  { a: 292.4, b: 299.0, modo: 'cam', trans: 'zoom', sfx: [['tic', 293.6], ['tic', 294.7], ['tic', 296.5], ['tic', 297.7], ['tic', 298.3]],
    ov: (lt, t) => { [['DOBLES ALTURAS', 293.6], ['ACABADOS DE PRIMERA', 294.7], ['ILUMINACIÓN', 296.5]].forEach(([n, a], i) => D.pill(n, 330, 230 + i * 100, prog(t, a, a + .3), { bg: C.tinta, size: 36, punto: C.nar }));
      [['DISEÑO', 297.7], ['MOBILIARIO', 298.3]].forEach(([n, a], i) => D.pill(n, 1600, 230 + i * 100, prog(t, a, a + .3), { bg: C.tinta, size: 36, punto: C.nar })); } },
  { a: 299.0, b: 305.1, modo: '3d', mundo: null, fondo: C.papel, trans: 'whip', sfx: [['riser', 301.6], ['tic', 302.2], ['tic', 303.0], ['listo', 304.6]], ov: (lt, t) => medidores(t) },
  { a: 305.1, b: 309.5, modo: '3d', mundo: 'fabrica', trans: 'zoom', cam: orb(.7, .5, 40, 36, 16, 14, V(0, 2, 0), 4.4), ov: (lt, t) => tit('NUESTRA FÁBRICA', 960, 140, 110, t, 306.3, { color: C.nar }) },
  { a: 309.5, b: 310.5, modo: 'cam', trans: 'zoom' },
  { a: 310.5, b: 315.0, modo: '3d', mundo: 'fabrica', trans: 'whip', sfx: [['tic', 311.2], ['tic', 312.1], ['tic', 313.7]], cam: (c, lt) => { c.position.set(lerp(-14, 10, eIO(lt / 4.5)), 6, 12); c.lookAt(lerp(-12, 12, eIO(lt / 4.5)), 2, 0); },
    ov: (lt, t) => pills([['PREPARACIONES', 311.2], ['ADECUACIONES', 312.1], ['AJUSTES', 313.7]], t, 1560, 160) },
  { a: 315.0, b: 318.2, modo: 'div', mundo: 'fabrica', trans: 'nada', cam: orb(.3, .45, 34, 32, 22, 20, V(0, 0, 0), 3.2), ov: (lt, t) => checklist([['PLANTA CONTROLADA', 315.8], ['PROCESOS CONTROLADOS', 316.8]], t, 1150, 200) },
  { a: 318.2, b: 322.4, modo: '3d', mundo: 'montaje1', trans: 'zoom', sfx: [['whoosh_grave', 318.4], ['boom', 321.8]], cam: orb(.75, .6, 52, 48, 20, 18, V(0, 7, -4), 4.2),
    ov: (lt, t) => { tit('LLEGAMOS Y MONTAMOS', 960, 140, 100, t, 320.4, { color: C.nar }); } },
  { a: 322.4, b: 325.9, modo: 'div', mundo: null, fondo: C.papel, trans: 'nada', ov: (lt, t) => barrasTiempo(t) },
  { a: 325.9, b: 330.9, modo: '3d', mundo: null, fondo: C.papel, trans: 'zoom', sfx: [['riser', 325.9], ['boom', 327.6]], ov: (lt, t) => porcentaje(t) },
  { a: 330.9, b: 334.9, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('PREFABRICADO', 1500, 260, prog(t, 333.3, 333.6), { bg: C.nar, size: 50 }) },
  { a: 334.9, b: 338.2, modo: '3d', mundo: 'obra', trans: 'whip', cam: orb(.0, .1, 34, 32, 18, 16, V(0, 0, 0), 3.3),
    ov: (lt, t) => { P2('OBRA TRADICIONAL', V(-8, 5, 0), prog(t, 335.3, 335.6), { bg: C.rojo, size: 34 }); P2('NO ENSUCIAS', V(8, 5, 0), prog(t, 336.3, 336.6), { bg: C.teal, size: 34 }); } },
  { a: 338.2, b: 342.4, modo: '3d', mundo: 'montaje2', trans: 'zoom', sfx: [['boom', 342.0]], cam: orb(1.0, .8, 52, 48, 20, 18, V(0, 7, -4), 4.2), ov: (lt, t) => D.pill('PREPARACIONES MUY SIMPLES', 960, 160, prog(t, 338.8, 339.1), { bg: C.tinta, size: 42 }) },
  { a: 342.4, b: 346.5, modo: '3d', mundo: 'remoto', trans: 'whip', sfx: [['boom', 344.6]], sacude: [[344.6, .15]], cam: orb(.3, .5, 36, 32, 14, 12, V(0, 2, 0), 4.1), ov: (lt, t) => tit('LUGARES REMOTOS', 960, 140, 120, t, 344.4, { color: C.nar }) },
  { a: 346.5, b: 350.7, modo: 'div', mundo: 'remoto', trans: 'nada', cam: orb(.8, 1.0, 22, 20, 8, 7, V(0, 1.5, 0), 4.2), ov: (lt, t) => D.pill('LISTO PARA MONTAR', 1350, 200, prog(t, 349.5, 349.8), { bg: C.teal, size: 46 }) },
  { a: 350.7, b: 357.2, modo: 'div', mundo: 'empaque', trans: 'nada', cam: orb(.6, .9, 15, 14, 7, 6, V(0, 1.3, 0), 6.5), ov: (lt, t) => tit('TODO LISTO EN EL SITIO', 1300, 150, 90, t, 355.3, { color: C.nar }) },
  { a: 357.2, b: 364.0, modo: '3d', mundo: 'empaque', trans: 'zoom', sfx: [['tic', 358.5], ['tic', 359.1], ['tic', 360.2], ['tic', 361.3], ['tic', 362.1], ['tic', 363.3]], cam: orb(.35, .75, 13, 12, 6, 5.5, V(0, 1.3, 0), 6.8),
    ov: (lt, t) => pills([['ACABADOS', 358.5], ['VENTANERÍA', 359.1], ['ELÉCTRICO', 360.2], ['DRENAJE', 361.3], ['AIRE ACONDICIONADO', 362.1], ['MOBILIARIO', 363.3]], t, 1580, 120, 80, { size: 34 }) },
  { a: 364.0, b: 368.2, modo: '3d', mundo: 'empaque', trans: 'whip', sfx: [['listo', 365.9]], cam: orb(.9, 1.2, 15, 14, 5, 5, V(0, 1.3, 0), 4.2), ov: (lt, t) => { tit('EMPAQUETADO', 960, 140, 130, t, 364.5, { color: C.nar }); D.pill('LISTO PARA LLEGAR Y MONTAR', 960, 280, prog(t, 365.9, 366.2), { bg: C.tinta, size: 40 }); } },
  { a: 368.2, b: 373.7, modo: '3d', mundo: 'escritorios', trans: 'zoom', sfx: [['tic', 369.9], ['boom', 372.8]], cam: orb(.6, .45, 26, 24, 16, 14, V(0, 0, 0), 5.5),
    ov: (lt, t) => { D.titulo('20 PERSONAS', 560, 150, 110, prog(t, 369.9, 370.2), { color: C.tinta }); const k = eOut(prog(t, 371.4, 373.1)); D.titulo('MENOS DE', 1380, 95, 50, prog(t, 371.4, 371.7), { color: C.tinta }); D.titulo(Math.round(lerp(365, 90, k)) + ' DÍAS', 1380, 175, 120, prog(t, 371.4, 371.7), { color: C.nar }); } },
  { a: 373.7, b: 379.0, modo: 'div', mundo: null, fondo: C.papel, trans: 'nada', ov: (lt, t) => timeline(t) },
  { a: 379.0, b: 383.6, modo: '3d', mundo: null, fondo: C.papel, trans: 'zoom', ov: (lt, t) => renta(t) },
  { a: 383.6, b: 387.5, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('MENOS DINERO PERDIDO', 1480, 260, prog(t, 381.4, 381.7) + prog(t, 383.7, 384), { bg: C.rojo, size: 44 }) },
  { a: 387.5, b: 391.5, modo: '3d', mundo: 'operando', trans: 'whip', sfx: [['boom', 390.7]], cam: orb(.9, .75, 44, 40, 20, 18, V(0, 2, 0), 4), ov: (lt, t) => tit('SIN DETENER TU OPERACIÓN', 960, 140, 100, t, 388.3, { color: C.nar }) },
  { a: 391.5, b: 397.3, modo: 'div', mundo: 'operando', trans: 'nada', sfx: [['tic', 391.8], ['tic', 392.9], ['tic', 393.6]], cam: orb(.4, .6, 40, 38, 18, 17, V(4, 2, 0), 5.8), ov: (lt, t) => pills([['OFICINA', 391.8], ['FÁBRICA', 392.9], ['BODEGA', 393.6]], t, 1560, 160) },
  { a: 397.3, b: 404.5, modo: '3d', mundo: 'bodega', trans: 'zoom', sfx: [['boom', 403.7]], cam: orb(.6, .9, 46, 42, 22, 20, V(2, 2, 0), 7.2),
    ov: (lt, t) => { tit('UN EJEMPLO CONCRETO', 960, 130, 90, t, 397.7); P2('LÍNEA DE PRODUCCIÓN', V(-6, 3.5, 0), prog(t, 401.0, 401.3), { bg: C.tinta, size: 32 }); P2('OFICINAS A UN LADO', V(15, 4.5, -3.5), prog(t, 403.6, 403.9), { bg: C.nar, size: 32 }); } },
  { a: 404.5, b: 406.7, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.titulo('¿CUÁNTAS?', 1550, 330, 150, prog(t, 404.6, 404.9), { color: C.nar, sombra: 'rgba(0,0,0,.5)' }) },
  { a: 406.7, b: 410.2, modo: '3d', mundo: 'bodega', trans: 'whip', sfx: [['boom', 407.9], ['boom', 408.4], ['boom', 408.9]], cam: orb(1.1, 1.0, 26, 24, 14, 13, V(15, 2, 0), 3.5),
    ov: (lt, t) => { const n = t < 407.7 ? 1 : t < 408.2 ? 2 : t < 408.7 ? 3 : 4; D.titulo(n + (n > 1 ? ' MÓDULOS' : ' MÓDULO'), 960, 150, 130, prog(t, 406.8, 407.1), { color: C.nar }); } },
  { a: 410.2, b: 416.8, modo: 'div', mundo: 'bodega', trans: 'nada', cam: orb(.3, .5, 44, 42, 26, 24, V(2, 0, 0), 6.6), ov: (lt, t) => tit('CRECES SIN DETENER LA OPERACIÓN', 1300, 140, 70, t, 414.6, { color: C.nar }) },
  { a: 416.8, b: 420.6, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('LO MÁS BONITO', 1500, 260, prog(t, 417.7, 418), { bg: C.nar, size: 48 }) },
  { a: 420.6, b: 427.1, modo: '3d', mundo: 'bodega', trans: 'whip', sfx: [['whoosh_grave', 420.8]], cam: orb(.9, 1.1, 48, 44, 24, 26, V(18, 6, 0), 6.5),
    ov: (lt, t) => pills([['OTRA EMPRESA', 422.2], ['OTRO MÓDULO', 423.6], ['CRECER', 424.5]], t, 1560, 170) },
  { a: 427.1, b: 432.2, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('CONSTRUIR UNA BODEGA', 1480, 260, prog(t, 428.4, 428.7), { bg: C.nar, size: 44 }) },
  { a: 432.2, b: 440.4, modo: '3d', mundo: 'planta', trans: 'zoom', sfx: [['boom', 435.8], ['boom', 437.3], ['boom', 439.7]], cam: orb(-.5, -.3, 34, 32, 22, 20, V(-6, 0, -3), 8.2),
    ov: (lt, t, w) => w.izq.forEach((c, i) => P2(c.userData.n, V(c.position.x + 4, 3.5, c.position.z), prog(t, [435.6, 437.1, 439.5][i] + .2, [435.6, 437.1, 439.5][i] + .5), { bg: C.tinta, size: 28, punto: C.nar })) },
  { a: 440.4, b: 445.7, modo: 'div', mundo: 'planta', trans: 'nada', sfx: [['boom', 441.2]], cam: orb(-.2, .1, 40, 38, 26, 24, V(-3, 0, -3), 5.3), ov: (lt, t) => tit('LLEGO Y MONTO', 1300, 150, 110, t, 441.1, { color: C.nar }) },
  { a: 445.7, b: 452.3, modo: '3d', mundo: 'planta', trans: 'whip', sfx: [['boom', 447.2], ['boom', 449.9], ['boom', 450.9]], cam: orb(.5, .3, 34, 32, 22, 20, V(6, 0, -3), 6.6),
    ov: (lt, t, w) => w.der.forEach((c, i) => P2(c.userData.n, V(c.position.x - 4, 3.5, c.position.z), prog(t, [447.0, 449.7, 450.7][i] + .2, [447.0, 449.7, 450.7][i] + .5), { bg: C.tinta, size: 28, punto: C.teal })) },
  { a: 452.3, b: 456.6, modo: '3d', mundo: 'planta', trans: 'zoom', sfx: [['tic', 454.3], ['tic', 455.9]], cam: orb(0, .2, 26, 24, 16, 15, V(0, 1, -3), 4.3), ov: (lt, t) => { P2('ANDÉN', V(0, 3.4, -3.5), prog(t, 454.3, 454.6), { bg: C.nar, size: 38 }); P2('MERCANCÍA', V(-3, 3.6, -6), prog(t, 455.9, 456.2), { bg: C.tinta, size: 30 }); } },
  { a: 456.6, b: 465.0, modo: 'div', mundo: 'planta', trans: 'nada', sfx: [['riser', 460.0], ['listo', 462.6]], cam: orb(.2, 1.0, 46, 42, 30, 26, V(0, 0, -3), 8.4),
    ov: (lt, t) => { tit('BODEGA EN TIEMPO RÉCORD', 1300, 140, 80, t, 459.4, { color: C.nar }); pills([['OPERACIONES ↑', 461.6], ['COSTOS ↓', 462.6]], t, 1560, 260, 90, { punto: C.teal }); } },
];
