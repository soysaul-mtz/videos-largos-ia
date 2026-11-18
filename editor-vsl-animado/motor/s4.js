// Sección 7:45–11:20: donde no puedes construir, casos (casa, Sellerlac, General Electric), cierre y CTA.
import * as THREE from 'three';
import { clamp, lerp, prog, eOut, eIO, eBack, eBounce, C, mat, caja, cil, contenedor, camion, peon, casco } from './util.js';
import { mundo, D } from './app.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const orb = (a0, a1, r0, r1, h0, h1, mira, dur) => (c, lt) => { const k = eIO(clamp(lt / dur)), a = lerp(a0, a1, k), r = lerp(r0, r1, k);
  c.position.set(mira.x + Math.sin(a) * r, lerp(h0, h1, k), mira.z + Math.cos(a) * r); c.lookAt(mira); };
const crece = (o, k, eje = 'xyz') => { const s = Math.max(.0001, k); for (const e of eje) o.scale[e] = s; o.visible = k > .001; };
const cae = (o, t, a, y0 = 0, alto = 10) => { const k = eBounce(prog(t, a, a + .45)); o.position.y = y0 + (1 - k) * alto; o.visible = k > 0; };
const P2 = (txt, v, k, op) => { const p = D.pt(v); D.pill(txt, p.x, p.y, k, op); };
const pills = (L, t, x = 1560, y0 = 170, paso = 88, op = {}) => L.forEach(([txt, a], i) => D.pill(txt, x, y0 + i * paso, prog(t, a, a + .3), { bg: C.tinta, size: 38, punto: C.nar, ...op }));
const tit = (txt, x, y, s, t, a, op = {}) => D.titulo(txt, x, y, s, prog(t, a, a + .3), { color: C.tinta, ...op });
const transparente = (c, k) => c.children[0].material.forEach(x => { if (x.transparent !== (k < 1)) x.needsUpdate = true; x.transparent = k < 1; x.opacity = k; x.depthWrite = k >= 1; });

function coche(col) { const g = new THREE.Group(); const b = caja(2, .8, 4, mat(col, .35, .3), .2); b.position.y = .6; g.add(b); const t = caja(1.7, .6, 2, mat(C.vidrio, .1, .5), .15); t.position.y = 1.25; g.add(t);
  for (const x of [-.9, .9]) for (const z of [-1.3, 1.3]) { const r = cil(.35, .35, .25, mat('#1d1d1f'), 16); r.rotation.z = Math.PI / 2; r.position.set(x, .35, z); g.add(r); } return g; }
function casa(col = '#E8C27A') {
  const g = new THREE.Group(); const b = caja(14, 6, 6, mat(col, .85)); b.position.y = 3; g.add(b);
  const cor = caja(14.4, .5, 6.4, mat('#F4EBDD', .7)); cor.position.y = 6.2; g.add(cor);
  for (let i = 0; i < 5; i++) { const v = caja(1.4, 2.4, .1, mat('#5A3A26', .7)); v.position.set(-5.4 + i * 2.7, i === 2 ? 1.3 : 3.6, 3.02); g.add(v); const m = caja(1.8, .3, .2, mat('#F4EBDD', .7)); m.position.set(-5.4 + i * 2.7, i === 2 ? 2.6 : 4.9, 3.05); g.add(m); }
  return g;
}
function edificio() { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const p = caja(12, 3.2, 8, mat(i % 2 ? '#B4AFA7' : '#C8C3BA', .85)); p.position.y = 1.6 + i * 3.25; g.add(p);
  for (let j = 0; j < 5; j++) { const v = caja(1.5, 1.6, .05, mat(C.vidrio, .1, .5)); v.position.set(-4.8 + j * 2.4, 1.7 + i * 3.25, 4.03); g.add(v); } } return g; }
function rayas(g, x0, z0, n, paso) { for (let i = 0; i <= n; i++) { const r = caja(.12, .03, 5, mat('#F5F2EA', .7)); r.position.set(x0 + i * paso, .04, z0); g.add(r); } }

export const MUNDOS = {
  restringido() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const lote = caja(26, .1, 18, mat('#D9CDB8', .9)); lote.position.y = .05; g.add(lote);
    const jard = caja(9, .12, 7, mat('#A9C48C', .9)); jard.position.set(7, .08, 3); g.add(jard); m.jard = jard;
    const c_ = casa('#E9E2D6'); c_.position.set(-5, 0, -3); c_.scale.setScalar(.8); g.add(c_);
    const rojos = []; for (const [x, z, w, d] of [[0, -9, 26, .25], [0, 9, 26, .25], [-13, 0, .25, 18], [13, 0, .25, 18]]) { const r = caja(w, .5, d, mat(C.rojo, .5)); r.position.set(x, .3, z); g.add(r); rojos.push(r); }
    const c = contenedor({ color: C.nar, ventanas: 2 }); c.position.set(7, .1, 3); m.scene.add(c); m.c = c;
    m.estado = t => { rojos.forEach((r, i) => crece(r, eOut(prog(t, 468.3 + i * .1, 468.8 + i * .1)), 'xz')); cae(c, t, 475.3, .1, 10);
      if (t > 490.7) { const k = eIO(prog(t, 490.7, 491.7)); c.position.x = 7 + k * 20; } else c.position.x = 7; jard.material = mat(t > 470.6 && t < 475.3 ? C.teal : '#A9C48C', .9); };
    return m;
  },
  casa() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const c_ = casa(); c_.position.set(-6, 0, -2); g.add(c_);
    const est = caja(12, .06, 9, mat('#6E7178', .9)); est.position.set(8, .03, 0); g.add(est); rayas(g, 2.5, 2, 4, 2.75);
    const coches = [coche(C.blanco), coche('#3D6B8C')]; coches[0].position.set(3.8, 0, 2); coches[1].position.set(9.3, 0, 2); coches.forEach(k => g.add(k));
    const L = [contenedor({ color: C.nar, ventanas: 2 }), contenedor({ color: C.blanco, ventanas: 2 })]; L[0].position.set(8, 0, -2.2); L[1].position.set(8, 0, .4); L.forEach(c => m.scene.add(c));
    m.L = L; m.est = est;
    m.estado = t => { L.forEach((c, i) => { cae(c, t, 507.1 + i * .3, 0, 12); if (t > 513.2) { const k = eIO(prog(t, 513.2 + i * .2, 515 + i * .2)); c.position.y = k * 18; c.position.x = 8 + k * 24; } });
      est.material = mat(t > 504.8 && t < 507.1 ? C.teal : '#6E7178', .9); };
    return m;
  },
  cajones() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const bod = caja(22, 9, 12, mat('#E3DED5', .85)); bod.position.set(-6, 4.5, -9); g.add(bod);
    const letrero = caja(8, 1.6, .2, mat(C.tinta, .5)); letrero.position.set(-6, 7.5, -2.9); g.add(letrero);
    const est = caja(26, .06, 8, mat('#6E7178', .9)); est.position.set(-2, .03, 4); g.add(est); rayas(g, -14, 4, 8, 3);
    const cols = [C.blanco, '#3D6B8C', C.rojo, '#C9C3B9', C.tinta, '#E2B33C', C.blanco, '#6E8B6E'];
    const coches = cols.map((col, i) => { const k = coche(col); k.position.set(-12.5 + i * 3, 0, 4); g.add(k); return k; });
    const ing = []; for (let i = 0; i < 4; i++) { const p = peon([C.nar, C.teal, C.tinta, C.nar][i]); p.scale.setScalar(.8); p.position.set(-10 + i * 1.6, 0, -1.6); const h = casco('#F2C230'); h.scale.setScalar(.38); h.position.y = 1.62; p.add(h); g.add(p); ing.push(p); }
    const cs = [contenedor({ color: C.nar, ventanas: 2 }), contenedor({ color: C.blanco, ventanas: 2 })]; cs.forEach((c, i) => { c.rotation.y = Math.PI / 2; c.position.set(5.5 + i * 2.9, 0, 4); m.scene.add(c); });
    m.estado = t => {
      [6, 7].forEach((j, n) => { const k = eIO(prog(t, 527.4 + n * .3, 528.6 + n * .3)); coches[j].position.z = 4 + k * 22; coches[j].visible = k < .98; });
      cs.forEach((c, i) => cae(c, t, 529.4 + i * .3, 0, 12)); ing.forEach((p, i) => crece(p, eBack(prog(t, 522.0 + i * .12, 522.4 + i * .12))));
      est.children; };
    m.cs = cs; return m;
  },
  refineria() {
    const m = mundo({ fondo: '#E6E2DA' }), g = new THREE.Group(); m.scene.add(g);
    for (const [x, z, r, h] of [[-12, -8, 3, 6], [-5, -9, 3.5, 7], [3, -8, 3, 6], [-14, 0, 2.5, 5]]) { const k = cil(r, r, h, mat('#D9D6D0', .4, .5), 40); k.position.set(x, h / 2, z); g.add(k);
      const tp = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#D9D6D0', .4, .5)); tp.position.set(x, h, z); tp.scale.y = .25; g.add(tp); }
    for (const [x, z] of [[10, -10], [13, -6]]) { const ch = cil(.8, 1.1, 18, mat('#A9A49C', .6), 24); ch.position.set(x, 9, z); g.add(ch); const b = cil(.85, .85, 1.2, mat(C.rojo, .6), 24); b.position.set(x, 16, z); g.add(b); }
    for (let i = 0; i < 6; i++) { const p = cil(.25, .25, 26, mat(['#8A8F96', '#E2B33C', '#8A8F96'][i % 3], .4, .6), 12); p.rotation.z = Math.PI / 2; p.position.set(-2, .8 + i * .55, -3.6); g.add(p); }
    const zona = caja(10, .08, 7, mat(C.rojo, .8, 0, { transparent: true, opacity: .35 })); zona.position.set(4, .05, 4); g.add(zona); m.zona = zona;
    const mod = contenedor({ color: C.blanco }); mod.position.set(4, 0, 4); m.scene.add(mod); m.mod = mod;
    const pant = []; for (let i = 0; i < 3; i++) { const s = caja(.9, .6, .06, mat('#7FD3FF', .3, 0, { emissive: '#4FB8F0', emissiveIntensity: 1.2 })); s.position.set(-1.8 + i * 1.8, 1.4, 0); mod.add(s); pant.push(s);
      const e = caja(1.4, .06, .7, mat(MAD_)); e.position.set(-1.8 + i * 1.8, .8, .3); mod.add(e); }
    const humo = []; for (let i = 0; i < 10; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), new THREE.MeshStandardMaterial({ color: '#ECEAE6', transparent: true, opacity: .6, roughness: 1 })); m.scene.add(h); humo.push(h); }
    m.estado = t => { cae(mod, t, 549.4, 0, 12); transparente(mod, t > 550.6 && t < 555.9 ? .3 : 1); zona.visible = t > 547.4 && t < 549.6; pant.forEach((s, i) => crece(s, eBack(prog(t, 552.9 + i * .15, 553.2 + i * .15))));
      humo.forEach((h, i) => { const f = (t * .15 + i / 10) % 1; h.position.set(10 + (i % 2) * 3 + f * 4, 18 + f * 8, -10 + (i % 2) * 4); h.scale.setScalar(.8 + f * 2.5); h.material.opacity = .55 * (1 - f); }); };
    return m;
  },
  puerta() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const muro = new THREE.Group(); g.add(muro); const mm = mat('#3A3D42', .7);
    const a = caja(10, 9, .4, mm); a.position.set(-6.5, 4.5, 6); const b = caja(10, 9, .4, mm); b.position.set(6.5, 4.5, 6); const c = caja(3, 3.5, .4, mm); c.position.set(0, 7.25, 6); muro.add(a, b, c);
    const piv = new THREE.Group(); piv.position.set(-1.5, 0, 6.1); muro.add(piv); const hoja = caja(3, 5.5, .15, mat(MAD_, .6)); hoja.position.set(1.5, 2.75, 0); piv.add(hoja);
    const man = cil(.08, .08, .3, mat('#C9A86B', .3, .8), 8); man.rotation.x = Math.PI / 2; man.position.set(2.7, 2.7, .15); piv.add(man);
    const comp = new THREE.Group(); g.add(comp);
    [[0, 0, -6, 0, C.nar], [6.1, 0, -6, 0, C.blanco], [-6.1, 0, -6, 0, C.teal], [0, 2.59, -6, 0, C.tinta], [6.1, 2.59, -6, 0, C.nar]].forEach(([x, y, z, r, col]) => { const k = contenedor({ color: col, ventanas: 2 }); k.position.set(x, y, z); comp.add(k); });
    m.estado = t => { piv.rotation.y = -eIO(prog(t, 584.6, 585.6)) * 1.9; const dia = t > 579.7 && t < 581.0 ? Math.sin(prog(t, 579.7, 581.0) * Math.PI) : 0;
      m.scene.background.set(new THREE.Color(C.papel).lerp(new THREE.Color('#1C2230'), dia)); m.scene.fog.color.copy(m.scene.background); m.sol.intensity = 2.1 * (1 - dia * .85);
      comp.visible = t > 580.4; };
    return m;
  },
  ruta() {
    const m = mundo({ piso: '#E6E1D8' }), g = new THREE.Group(); m.scene.add(g);
    const asf = caja(600, .05, 9, mat('#3A3D42', .9)); asf.position.y = .03; g.add(asf);
    for (let i = 0; i < 120; i++) { const r = caja(3, .02, .25, mat('#F2E6C8', .7)); r.position.set(-300 + i * 5, .07, 0); g.add(r); }
    for (let i = 0; i < 80; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.8, 10), mat(i % 3 ? '#5E8C61' : '#77A36B', .8)); p.castShadow = true; p.position.set(-300 + i * 7.5, 1.4, (i % 2 ? 1 : -1) * (8 + (i % 5))); g.add(p); }
    const k = camion(); m.scene.add(k); const c = contenedor({ color: C.teal, ventanas: 2 }); c.position.set(-1.2, 1.25, 0); k.add(c); m.k = k;
    m.estado = t => { const x = ((t - 600) * 14) % 500 - 250; k.position.set(x, 0, -1.8); k.userData.ruedas.forEach(r => r.rotation.y = -x / .55); };
    return m;
  },
  complejo() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g); const L = [];
    const P = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) P.push([-9 + i * 6.2, 0, -3 + j * 2.5]); for (let i = 0; i < 3; i++) P.push([-6 + i * 6.2, 2.59, -1.75]); P.push([3.4, 5.18, -1.75]);
    P.forEach(([x, y, z], i) => { const c = contenedor({ color: [C.nar, C.blanco, C.teal, C.tinta][i % 4], ventanas: 2 }); c.position.set(x, y, z); g.add(c); L.push([c, y]); });
    m.estado = t => L.forEach(([c, y], i) => cae(c, t, 614.0 + i * .5, y, 12));
    return m;
  },
  azotea() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const e = edificio(); e.position.set(-10, 0, 0); g.add(e);
    const est = caja(14, .06, 10, mat('#6E7178', .9)); est.position.set(9, .03, 0); g.add(est); rayas(g, 3, 0, 5, 2.4);
    const plat = caja(14, .4, 10, mat('#9C978F', .6, .3)); plat.position.set(9, 3.6, 0); g.add(plat); const cols = []; for (const x of [3, 9, 15]) for (const z of [-4, 4]) { const c = caja(.4, 3.6, .4, mat('#9C978F', .6, .3)); c.position.set(x, 1.8, z); g.add(c); cols.push(c); }
    const A = [contenedor({ color: C.nar, ventanas: 2 }), contenedor({ color: C.teal, ventanas: 2 })]; A[0].position.set(9, 3.8, -1.3); A[1].position.set(9, 3.8, 1.3); A.forEach(c => m.scene.add(c));
    const B = [contenedor({ color: C.blanco, ventanas: 2 }), contenedor({ color: C.nar, ventanas: 2 })]; B[0].position.set(-12, 9.75, -1.3); B[1].position.set(-8, 9.75, 1.6); B.forEach(c => m.scene.add(c));
    m.estado = t => { crece(plat, eOut(prog(t, 647.6, 648.0)), 'xz'); cols.forEach(c => crece(c, eOut(prog(t, 647.4, 647.8)), 'y'));
      A.forEach((c, i) => cae(c, t, 648.4 + i * .3, 3.8, 10)); B.forEach((c, i) => cae(c, t, 650.3 + i * .3, 9.75, 10)); };
    return m;
  },
  movil() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const tierra = caja(12, 3, 9, mat('#A88763', .95)); tierra.position.set(-8, -1.5, 0); g.add(tierra);
    const c_ = casa('#D9D2C5'); c_.scale.setScalar(.6); c_.position.set(-8, 0, 0); g.add(c_);
    for (const x of [-11, -8, -5]) { const p = cil(.3, .3, 3, mat('#8F8A82', .8)); p.position.set(x, -1.5, 2); g.add(p); }
    const k = camion(); k.position.set(6, 0, 1); m.scene.add(k); const c = contenedor({ color: C.nar, ventanas: 2 }); c.position.set(-1.2, 1.25, 0); k.add(c); m.k = k;
    m.estado = t => { const v = eIO(prog(t, 667.6, 669.3)); k.position.x = 6 + v * 30; k.userData.ruedas.forEach(r => r.rotation.y = -k.position.x / .55); };
    return m;
  },
};
const MAD_ = '#B9895A';

// ---------- 2D ----------
function tachados(t) {
  const L = [['REDUCIR TU OPERATIVIDAD', 565.3], ['REMODELACIONES', 567.4], ['CONSTRUCCIONES', 568.6], ['ADECUACIONES EXTERNAS', 569.6], ['MODIFICACIONES HECHIZAS', 571.5]], g = D.g;
  L.forEach(([n, a], i) => { const y = 120 + i * 105; D.titulo(n, 960, y, 84, prog(t, a, a + .25), { color: '#fff', sombra: 'rgba(0,0,0,.4)' });
    const k = eOut(prog(t, a + .5, a + .8)); if (k > 0) { g.save(); g.font = '84px "Bebas"'; const w = g.measureText(n).width; g.strokeStyle = C.rojo; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(960 - w / 2 - 20, y); g.lineTo(960 - w / 2 - 20 + (w + 40) * k, y - 6); g.stroke(); g.restore(); } });
}
function checklist(L, t, x = 1180, y0 = 220) {
  const g = D.g; L.forEach(([n, a], i) => { const k = prog(t, a, a + .35); if (k <= 0) return; const y = y0 + i * 95;
    g.save(); g.globalAlpha = clamp(k * 3); g.fillStyle = 'rgba(22,24,28,.92)'; D.rr(g, x - 30, y - 38, 560, 76, 38); g.fill(); g.restore(); D.check(x + 8, y, 26, k);
    g.save(); g.globalAlpha = clamp(k * 3); g.font = '36px "Poppins XB"'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(n, x + 60, y + 2); g.restore(); });
}
function graficas4(t) {
  const L = [['OPERACIÓN', 657.0], ['PRODUCTIVIDAD', 657.9], ['EMPLEO', 659.1], ['CAPACIDAD ECONÓMICA', 660.7]], g = D.g;
  L.forEach(([n, a], i) => { const x = 870 + i * 250, base = 560, k = eBack(prog(t, a, a + .6)), h = 120 + i * 70;
    if (prog(t, a - .2, a) <= 0) return; g.save(); g.fillStyle = i % 2 ? C.teal : C.nar; D.rr(g, x - 70, base - h * k, 140, h * k, 14); g.fill();
    g.font = '24px "Poppins XB"'; g.fillStyle = C.tinta; g.textAlign = 'center'; g.fillText(n, x, base + 40); g.restore(); });
  D.titulo('CRECE TU EMPRESA', 1240, 170, 100, prog(t, 655.9, 656.2), { color: C.tinta });
}
function boton(t) {
  const g = D.g, k = eBack(prog(t, 669.6, 670.0)), pul = t > 672.9 ? 1 + .06 * Math.sin((t - 672.9) * 9) * Math.exp(-(t - 672.9) * .6) : 1;
  if (k <= 0) return; const x = 1490, y = 300; g.save(); g.translate(x, y); g.scale(k * pul, k * pul);
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillStyle = C.nar; D.rr(g, -300, -64, 600, 128, 64); g.fill(); g.shadowColor = 'transparent';
  g.font = '50px "Poppins XB"'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AGENDA UNA LLAMADA', 0, 4); g.restore();
  const fa = prog(t, 672.9, 673.3); if (fa > 0) { const b = Math.sin((t - 672.9) * 6) * 16; g.save(); g.globalAlpha = clamp(fa * 3); g.fillStyle = '#fff'; g.strokeStyle = C.tinta; g.lineWidth = 8; g.lineJoin = 'round';
    g.translate(x, 470 + b); g.beginPath(); g.moveTo(-34, 0); g.lineTo(34, 0); g.lineTo(34, 70); g.lineTo(80, 70); g.lineTo(0, 150); g.lineTo(-80, 70); g.lineTo(-34, 70); g.closePath(); g.stroke(); g.fill(); g.restore(); }
}

// ================= LÍNEA DE TIEMPO 7:45–11:20 =================
export const BEATS = [
  { a: 465.0, b: 470.6, modo: '3d', mundo: 'restringido', trans: 'zoom', sfx: [['boom', 468.4]], sacude: [[468.4, .12]], cam: orb(.4, .6, 36, 33, 24, 22, V(0, 0, 0), 5.6),
    ov: (lt, t) => D.sello('NO SE PUEDE\nCONSTRUIR', 1350, 260, prog(t, 468.3, 468.7)) },
  { a: 470.6, b: 475.0, modo: 'div', mundo: 'restringido', trans: 'nada', sfx: [['tic', 470.7], ['tic', 471.5]], cam: orb(.6, .8, 28, 26, 18, 17, V(4, 0, 2), 4.4), ov: (lt, t) => pills([['JARDÍN', 470.7], ['SERVIDUMBRE', 471.5], ['UN ESPACIO', 472.4]], t, 1600, 170) },
  { a: 475.0, b: 481.0, modo: '3d', mundo: 'restringido', trans: 'whip', sfx: [['boom', 475.6]], cam: orb(1.0, .8, 22, 20, 10, 9, V(6, 1.3, 3), 6),
    ov: (lt, t) => { tit('NO CONSTRUIMOS', 960, 130, 100, t, 477.4, { color: C.tinta }); tit('MONTAMOS', 960, 250, 140, t, 479.2, { color: C.nar }); } },
  { a: 481.0, b: 487.7, modo: 'div', mundo: 'restringido', trans: 'nada', cam: orb(.2, .5, 34, 32, 22, 20, V(2, 0, 0), 6.7), ov: (lt, t) => { tit('MÁS ESPACIO', 1300, 150, 120, t, 483.8, { color: C.nar }); pills([['SIN LICENCIA', 487.1]], t, 1300, 280); } },
  { a: 487.7, b: 491.7, modo: '3d', mundo: 'restringido', trans: 'zoom', sfx: [['whoosh_grave', 490.8]], cam: orb(.9, 1.1, 30, 30, 14, 14, V(10, 1, 3), 4), ov: (lt, t) => tit('Y SE PUEDE MOVER', 960, 140, 110, t, 490.9, { color: C.nar }) },
  // caso casa
  { a: 491.7, b: 495.5, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('CASO REAL', 1520, 260, prog(t, 492.3, 492.6), { bg: C.nar, size: 50 }) },
  { a: 495.5, b: 501.0, modo: '3d', mundo: 'casa', trans: 'whip', cam: orb(.2, .35, 32, 30, 10, 9, V(0, 3, 0), 5.5), ov: (lt, t) => { P2('CASA EN RENTA', V(-6, 8.5, -2), prog(t, 495.6, 495.9), { bg: C.tinta, size: 34 }); P2('VALOR PATRIMONIAL', V(-6, 7.2, -2), prog(t, 498.5, 498.8), { bg: C.nar, size: 30 }); } },
  { a: 501.0, b: 504.8, modo: 'div', mundo: 'casa', trans: 'nada', cam: orb(-.3, -.1, 30, 28, 10, 10, V(-4, 3, 0), 3.8),
    ov: (lt, t) => { const g = D.g, x = 1300; [[0, -1, 501.7], [-1, 0, 502.9], [1, 0, 503.2]].forEach(([dx, dy, a]) => { const k = prog(t, a, a + .3); if (k <= 0) return; g.save(); g.globalAlpha = clamp(k * 3); g.translate(x + dx * 230, 450 + dy * 230); g.rotate(Math.atan2(dy, dx));
      g.fillStyle = C.tinta; g.fillRect(0, -14, 120, 28); g.beginPath(); g.moveTo(120, -40); g.lineTo(170, 0); g.lineTo(120, 40); g.fill(); g.strokeStyle = C.rojo; g.lineWidth = 14; g.beginPath(); g.moveTo(40, -50); g.lineTo(140, 50); g.stroke(); g.restore(); }); } },
  { a: 504.8, b: 511.7, modo: '3d', mundo: 'casa', trans: 'zoom', sfx: [['tic', 505.1], ['boom', 507.6], ['boom', 507.9]], cam: orb(.8, .6, 30, 28, 16, 14, V(3, 1.5, 0), 6.9),
    ov: (lt, t) => { P2('ESTACIONAMIENTO', V(8, 6.5, 0), prog(t, 505.1, 505.4), { bg: C.teal, size: 34 }); P2('OFICINAS', V(8, 7.6, 0), prog(t, 510.7, 511.0), { bg: C.nar, size: 34 }); } },
  { a: 511.7, b: 516.1, modo: '3d', mundo: 'casa', trans: 'whip', sfx: [['whoosh_grave', 513.3]], cam: orb(.5, .7, 36, 34, 14, 16, V(10, 4, 0), 4.4), ov: (lt, t) => { D.pill('FIN DE LA RENTA', 960, 160, prog(t, 512.0, 512.3), { bg: C.rojo, size: 44 }); tit('SE LOS LLEVAN', 960, 290, 110, t, 513.9, { color: C.nar }); } },
  // Sellerlac
  { a: 516.1, b: 520.2, modo: 'div', mundo: 'cajones', trans: 'nada', cam: orb(.4, .5, 42, 40, 18, 17, V(-3, 3, -2), 4.1),
    ov: (lt, t) => { const g = D.g; const k = eOut(prog(t, 517.5, 517.9)); if (k > 0) { g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(22,24,28,.92)'; D.rr(g, 1020, 110, 620, 150, 26); g.fill(); g.font = '30px "Poppins SB"'; g.fillStyle = C.nar; g.fillText('CASO', 1060, 160); g.font = '64px "Bebas"'; g.fillStyle = '#fff'; g.fillText('SELLERLAC', 1060, 225); g.restore(); } } },
  { a: 520.2, b: 525.2, modo: '3d', mundo: 'cajones', trans: 'zoom', cam: orb(.1, .25, 30, 28, 10, 10, V(-6, 2, -2), 5), ov: (lt, t) => pills([['INGENIEROS', 522.0], ['ADMINISTRADORES', 522.7]], t, 1560, 170) },
  { a: 525.2, b: 532.1, modo: '3d', mundo: 'cajones', trans: 'whip', sfx: [['whoosh_rapido', 527.4], ['boom', 529.6], ['boom', 529.9]], cam: orb(.7, .9, 28, 26, 20, 18, V(5, 0, 3), 6.9),
    ov: (lt, t) => { tit('1 O 2 CAJONES', 960, 140, 120, t, 527.5, { color: C.nar }); } },
  { a: 532.1, b: 538.5, modo: 'div', mundo: 'cajones', trans: 'nada', sfx: [['listo', 534.8], ['listo', 536.3]], cam: orb(1.1, 1.3, 30, 28, 16, 15, V(2, 2, 0), 6.4), ov: (lt, t) => checklist([['SIN CONSTRUIR', 533.8], ['SIN COCHINERO', 534.8], ['SIN DETENER OPERACIONES', 536.3]], t, 1130, 200) },
  // General Electric
  { a: 538.5, b: 542.3, modo: '3d', mundo: 'refineria', trans: 'zoom', cam: orb(.6, .45, 52, 48, 20, 18, V(-2, 5, -4), 3.8),
    ov: (lt, t) => { const g = D.g; const k = eOut(prog(t, 539.8, 540.2)); if (k > 0) { g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(22,24,28,.92)'; D.rr(g, 640, 90, 640, 150, 26); g.fill(); g.font = '30px "Poppins SB"'; g.fillStyle = C.nar; g.fillText('CASO', 680, 140); g.font = '64px "Bebas"'; g.fillStyle = '#fff'; g.fillText('GENERAL ELECTRIC', 680, 205); g.restore(); } } },
  { a: 542.3, b: 546.0, modo: 'div', mundo: 'refineria', trans: 'nada', cam: orb(.2, .35, 44, 42, 16, 15, V(-4, 4, -4), 3.7), ov: (lt, t) => pills([['TERMOELÉCTRICAS', 541.3], ['REFINERÍAS', 541.7], ['CONTROL DE OPERACIONES', 544.7]], t, 1500, 170) },
  { a: 546.0, b: 551.6, modo: '3d', mundo: 'refineria', trans: 'whip', sfx: [['boom', 549.8]], cam: orb(.9, .8, 30, 28, 14, 13, V(3, 1.5, 3), 5.6), ov: (lt, t) => { P2('NO SE PUEDE CONSTRUIR', V(4, 3.5, 4), prog(t, 547.6, 547.9) * (t < 549.6), { bg: C.rojo, size: 32 }); tit('LLEGAMOS Y MONTAMOS', 960, 140, 100, t, 549.0, { color: C.nar }); } },
  { a: 551.6, b: 555.9, modo: '3d', mundo: 'refineria', trans: 'zoom', sfx: [['tic', 551.6], ['tic', 552.3], ['tic', 553.0]], cam: orb(.4, .6, 11, 10, 4, 4, V(4, 1.3, 4), 4.3), ov: (lt, t) => pills([['MOBILIARIO', 551.6], ['OFICINAS', 552.3], ['COMPUTADORAS', 553.0]], t, 1580, 170) },
  { a: 555.9, b: 563.3, modo: 'div', mundo: 'refineria', trans: 'nada', cam: orb(1.0, 1.4, 40, 36, 18, 16, V(0, 3, -2), 7.4), ov: (lt, t) => pills([['VERSÁTIL', 557.7], ['LIMPIO', 561.2], ['EFICIENTE', 562.6]], t, 1580, 170, 88, { punto: C.teal }) },
  // cierre
  { a: 563.3, b: 573.2, modo: '3d', mundo: null, fondo: C.tinta, trans: 'flash', sfx: [['tic', 565.8], ['tic', 567.9], ['tic', 569.1], ['tic', 570.1], ['tic', 572.0]], ov: (lt, t) => tachados(t) },
  { a: 573.2, b: 576.3, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('LA MEJOR OPCIÓN', 1500, 260, prog(t, 574.2, 574.5), { bg: C.teal, size: 52 }) },
  { a: 576.3, b: 583.7, modo: '3d', mundo: 'puerta', trans: 'zoom', sfx: [['riser', 579.5], ['boom', 580.6]], cam: (c, lt) => { const k = eIO(lt / 7.4); c.position.set(lerp(10, 4, k), 6, lerp(30, 24, k)); c.lookAt(0, 3, 0); },
    ov: (lt, t) => { D.titulo('DE UN DÍA PARA OTRO', 960, 140, 110, prog(t, 579.8, 580.1), { color: C.nar }); } },
  { a: 583.7, b: 589.7, modo: '3d', mundo: 'puerta', trans: 'nada', sfx: [['whoosh_grave', 584.8]], cam: (c, lt) => { const k = eIO(clamp((lt - 1.2) / 3.5)); c.position.set(0, lerp(4.5, 3.5, k), lerp(20, 2, k)); c.lookAt(0, lerp(3, 2.5, k), -6); },
    ov: (lt, t) => pills([['UN EDIFICIO', 586.9], ['UN MÓDULO', 587.6], ['OFICINAS PREFABRICADAS', 589.0]], t, 1520, 170) },
  { a: 589.7, b: 593.2, modo: 'div', mundo: 'complejo', trans: 'nada', cam: orb(.6, .8, 34, 32, 14, 13, V(0, 2, 0), 3.5), ov: (lt, t) => checklist([['LISTAS PARA MONTAR', 591.4], ['LISTAS PARA OPERAR', 592.3]], t, 1100, 220) },
  { a: 593.2, b: 601.4, modo: '3d', mundo: 'empaque', trans: 'zoom', sfx: [['tic', 593.5], ['tic', 595.0], ['tic', 596.0], ['tic', 597.1]], cam: orb(.5, 1.2, 15, 13, 6, 5, V(0, 1.3, 0), 8.2), ov: (lt, t) => checklist([['MOBILIARIO', 593.5], ['AISLAMIENTO', 595.0], ['VENTANERÍA', 596.0], ['INSTALACIONES', 597.1]], t, 1300, 180) },
  { a: 601.4, b: 607.5, modo: '3d', mundo: 'ruta', trans: 'whip', sfx: [['whoosh_rapido', 603.2]], cam: (c, lt, t, w) => { const x = w.k.position.x; c.position.set(x + lerp(14, 5, eIO(lt / 6)), lerp(5, 9, lt / 6), 14); c.lookAt(x, 1.5, -1.8); }, ov: (lt, t) => tit('LO PUEDES MOVER', 960, 140, 110, t, 603.2, { color: C.nar }) },
  { a: 607.5, b: 613.0, modo: 'div', mundo: 'modulos', trans: 'nada', cam: orb(.8, 1.3, 30, 28, 16, 15, V(1, 1.5, 0), 5.5), ov: (lt, t) => pills([['MODULAR', 610.2], ['ESCALABLE', 611.4], ['SIN DETENER TU OPERACIÓN', 611.9]], t, 1500, 170) },
  { a: 613.0, b: 624.3, modo: '3d', mundo: 'complejo', trans: 'zoom', sfx: [['boom', 614.4], ['boom', 616.4], ['boom', 618.4], ['boom', 620.4], ['riser', 621.4], ['listo', 623.4]], cam: orb(.3, 1.4, 40, 34, 20, 15, V(0, 2, 0), 11.3),
    ov: (lt, t) => { pills([['OFICINAS', 615.7], ['BODEGAS', 616.5], ['LO QUE NECESITES', 617.8]], t, 1580, 170); tit('ESPECTACULAR', 960, 140, 130, t, 623.4, { color: C.nar }); } },
  { a: 624.3, b: 628.9, modo: 'cam', trans: 'zoom', ov: (lt, t) => D.pill('CONTEMPLA LOS CONTENEDORES', 1450, 260, prog(t, 627.7, 628.0), { bg: C.nar, size: 42 }) },
  { a: 628.9, b: 635.9, modo: 'div', mundo: 'complejo', trans: 'nada', cam: orb(1.4, 1.9, 36, 34, 18, 16, V(0, 2, 0), 7),
    ov: (lt, t) => pills([['LOS ESPACIOS', 630.5], ['LOS METROS', 632.4], ['LOS CONTENEDORES', 634.5]], t, 1560, 170, 88, { punto: C.teal }) },
  { a: 635.9, b: 645.1, modo: '3d', mundo: 'complejo', trans: 'whip', sfx: [['tic', 636.6], ['tic', 638.1], ['tic', 639.9], ['tic', 641.5]], cam: orb(-.4, .4, 44, 38, 26, 20, V(0, 2, 0), 9.2),
    ov: (lt, t) => pills([['EMPRENDER', 636.6], ['INICIAR TUS BODEGAS', 638.1], ['CREAR TUS OFICINAS', 639.9], ['AMPLIAR TU EQUIPO', 641.5]], t, 1540, 150) },
  { a: 645.1, b: 651.6, modo: '3d', mundo: 'azotea', trans: 'zoom', sfx: [['boom', 648.6], ['boom', 650.5]], cam: orb(.5, .8, 46, 42, 20, 22, V(0, 4, 0), 6.5),
    ov: (lt, t) => { P2('ARRIBA DE ESTACIONAMIENTOS', V(9, 9.5, 0), prog(t, 647.8, 648.1), { bg: C.tinta, size: 30 }); P2('SEGUNDOS NIVELES', V(9, 8.2, 0), prog(t, 649.0, 649.3), { bg: C.teal, size: 30 }); P2('ARRIBA DE TU EMPRESA', V(-10, 15.5, 0), prog(t, 650.3, 650.6), { bg: C.nar, size: 30 }); } },
  { a: 651.6, b: 654.7, modo: '3d', mundo: 'ruta', trans: 'whip', cam: (c, lt, t, w) => { const x = w.k.position.x; c.position.set(x + 8, 7, -16); c.lookAt(x, 1.5, -1.8); }, ov: (lt, t) => tit('DONDE LOS NECESITES', 960, 140, 110, t, 652.0, { color: C.nar }) },
  { a: 654.7, b: 662.2, modo: 'div', mundo: null, fondo: C.papel, trans: 'nada', sfx: [['tic', 657.0], ['tic', 657.9], ['tic', 659.1], ['tic', 660.7]], ov: (lt, t) => graficas4(t) },
  { a: 662.2, b: 669.3, modo: '3d', mundo: 'movil', trans: 'zoom', sfx: [['whoosh_grave', 667.7], ['boom', 668.4]], cam: orb(.2, .35, 34, 32, 10, 10, V(2, 2, 0), 7.1),
    ov: (lt, t) => { P2('SE QUEDA', V(-8, 6, 0), prog(t, 664.5, 664.8), { bg: C.rojo, size: 34 }); P2('TE LA LLEVAS', V(6, 6.5, 1), prog(t, 665.8, 666.1) * (t < 667.8), { bg: C.teal, size: 34 });
      tit('INVERSIÓN MÓVIL', 960, 130, 130, t, 667.6, { color: C.nar }); tit('NO INMOBILIARIA', 960, 260, 90, t, 668.4, { color: C.tinta }); } },
  { a: 669.3, b: 681.0, modo: 'cam', trans: 'zoom', sfx: [['tic', 669.7], ['listo', 673.0]], ov: (lt, t) => boton(t) },
];
