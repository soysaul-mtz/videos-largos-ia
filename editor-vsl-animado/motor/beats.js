// Línea de tiempo: cada momento (beat) = modo (3d / div / cam), mundo 3D, cámara y capa 2D.
import * as THREE from 'three';
import { clamp, lerp, prog, eOut, eIO, eBack, eBounce, C, mat, caja, cil, contenedor, nave, camion, peon, casco, moneda, engrane, flecha } from './util.js';
import { mundo, D } from './app.js';
import * as S2 from './s2.js';
import * as S3 from './s3.js';
import * as S4 from './s4.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const orbita = (cam, ang, rad, alto, mira) => { cam.position.set(mira.x + Math.sin(ang) * rad, alto, mira.z + Math.cos(ang) * rad); cam.lookAt(mira); };
const crece = (o, k, eje = 'xyz') => { const s = Math.max(.0001, k); for (const e of eje) o.scale[e] = s; o.visible = k > .001; };

// ================= MUNDOS =================
export const MUNDOS = {
  nave() {
    const m = mundo(), n = nave(); m.scene.add(n); const P = n.userData;
    const cam_ = camion(); cam_.position.set(0, 0, 11.5); m.scene.add(cam_);
    m.estado = t => {
      crece(P.losa, eOut(prog(t, 0, .35)), 'xz');
      P.cols.forEach((c, i) => crece(c, eBack(prog(t, .2 + i * .05, .55 + i * .05)), 'y'));
      P.muros.forEach((c, i) => crece(c, eOut(prog(t, .8 + i * .1, 1.3 + i * .1)), 'y'));
      const techoFuera = t >= 3 && t < 12.5;
      P.techo.forEach((r, i) => {
        const baja = eBounce(prog(t, 1.6 + i * .15, 2.3 + i * .15)), sube = techoFuera ? eIO(prog(t, 3, 3.5)) : 0;
        r.position.y = 9.25 + (1 - baja) * 14 + sube * 30; r.visible = baja > 0 && sube < .98;
      });
      const HL = [8.32, 9.52, 10.44, 11.08];
      P.cuartos.forEach((q, i) => {
        crece(q, eBack(prog(t, 3.6 + i * .3, 4.1 + i * .3)), 'y'); q.scale.x = q.scale.z = 1;
        const on = t >= HL[i] && t < 11.98, k = on ? eBack(prog(t, HL[i], HL[i] + .3)) : 0;
        q.position.y = .4 + k * .8; q.userData.filo.material = mat(on ? C.nar : C.teal, .5);
      });
      cam_.visible = t >= 13.8 && t < 15.5; const kc = eIO(prog(t, 14.0, 15.3)); cam_.position.x = kc * 46;
      cam_.userData.ruedas.forEach(r => r.rotation.y = -kc * 46 / .55);
    };
    return m;
  },
  calendario() {
    const m = mundo({ reticula: false }), g = new THREE.Group(); m.scene.add(g);
    const MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC', 'FIN'];
    const hojas = MES.map((mes, i) => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 600; const x = c.getContext('2d');
      const fin = mes === 'FIN'; x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 600); x.fillStyle = fin ? C.rojo : C.tinta; x.fillRect(0, 0, 512, 150);
      x.fillStyle = '#fff'; x.font = '100px Bebas'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('CONTRATO', 256, 80);
      x.fillStyle = fin ? C.rojo : C.tinta; x.font = `${fin ? 250 : 300}px Bebas`; x.fillText(mes, 256, 390);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const h = caja(5, 5.86, .03, [mat('#fff'), mat('#fff'), mat('#fff'), mat('#fff'), new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }), mat('#fff')]);
      const piv = new THREE.Group(); h.position.y = -2.93; piv.add(h); piv.position.set(0, 6.4, .06 * (MES.length - i)); g.add(piv); return piv;
    });
    const base = caja(5.6, 6.8, .4, mat(C.tinta, .5)); base.position.set(0, 3.3, -.3); g.add(base);
    for (const x of [-1.6, 0, 1.6]) { const a = sombra_(new THREE.Mesh(new THREE.TorusGeometry(.28, .06, 10, 24), mat('#888', .3, .8))); a.position.set(x, 6.45, .5); g.add(a); }
    g.position.y = 0;
    m.estado = t => hojas.forEach((h, i) => {   // hojas[0] = la de hasta adelante (ENE)
      const k = eIO(prog(t, 12.05 + i * .085, 12.4 + i * .085)); if (i === hojas.length - 1) return;
      h.rotation.x = -k * 2.4; h.position.y = 6.4 + k * 3; h.position.x = Math.sin(i * 7) * k * 4; h.visible = k < .98;
    });
    return m;
  },
  lote() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const lm = mat(C.nar, .5);
    for (const [x0, z0, x1, z1] of [[-10, -7, 10, -7], [-10, 7, 10, 7], [-10, -7, -10, 7], [10, -7, 10, 7]]) {
      const n = 12; for (let j = 0; j < n; j++) { const k = (j + .25) / n, x = lerp(x0, x1, k), z = lerp(z0, z1, k), hz = x0 === x1;
        const s = caja(hz ? .16 : 20 / n * .55, .06, hz ? 14 / n * .55 : .16, lm); s.position.set(x, .04, z); g.add(s); } }
    for (const [x, z] of [[-10, -7], [10, -7], [-10, 7], [10, 7]]) { const e = cil(.08, .08, 1.4, mat('#9a7b55', .8)); e.position.set(x, .7, z); g.add(e); const p = caja(.3, .25, .3, mat(C.nar)); p.position.set(x, 1.45, z); g.add(p); }
    return m;
  },
  monedas() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const pila = []; for (let i = 0; i < 12; i++) { const c = moneda(); c.position.set(-14, .08 + i * .17, 0); g.add(c); pila.push(c); }
    const X = [-8, -2.6, 2.8, 8.4], ped = X.map(x => { const p = cil(2, 2.2, .6, mat(C.blanco, .6)); p.position.set(x, .3, 0); g.add(p); return p; });
    const maq = new THREE.Group(); const mb = caja(2.2, 1.2, 1.6, mat(C.teal, .45, .2), .12); mb.position.y = .6; maq.add(mb);
    const tq = cil(.5, .5, 1.6, mat(C.blanco, .4, .3)); tq.position.set(-.5, 1.9, 0); maq.add(tq); const eg = engrane(C.nar); eg.scale.setScalar(.55); eg.position.set(.6, 1.9, .3); maq.add(eg); maq.userData.eg = eg;
    const gente = new THREE.Group(); [[-.9, C.nar], [0, C.tinta], [.9, C.teal]].forEach(([x, c]) => { const p = peon(c); p.position.x = x; p.scale.setScalar(.9); gente.add(p); });
    const esp = new THREE.Group(); const ps = caja(3, .08, 3, mat(C.teal, .5)); esp.add(ps); esp.userData.ps = ps;
    const crec = new THREE.Group(); [0.8, 1.4, 2.1, 3].forEach((h, i) => { const b = caja(.5, h, .5, mat(i === 3 ? C.nar : C.gris, .5)); b.geometry.translate(0, h / 2, 0); b.position.x = -1.1 + i * .72; crec.add(b); });
    const fl = flecha(C.nar, 2.6); fl.rotation.z = -.75; fl.position.set(-1.2, .6, .6); crec.add(fl);
    const objs = [maq, gente, esp, crec]; objs.forEach((o, i) => { o.position.set(X[i], .6, 0); g.add(o); });
    const T = [20.9, 21.96, 22.64, 23.8];
    m.estado = t => {
      pila.forEach((c, i) => { const k = eBounce(prog(t, 19.74 + i * .07, 20.1 + i * .07)); c.position.y = .08 + i * .17 + (1 - k) * 7; c.visible = k > 0;
        const sale = prog(t, 20.8 + i * .02, 21.2 + i * .02); c.scale.setScalar(1 - eIO(sale) * .999); });
      objs.forEach((o, i) => { crece(o, eBack(prog(t, T[i], T[i] + .4))); });
      ped.forEach((p, i) => p.material = mat(t >= T[i] ? C.blanco : '#d8d2c8', .6));
      maq.userData.eg.rotation.z = t * 2; esp.userData.ps.scale.set(1 + eOut(prog(t, 22.7, 23.5)) * .4, 1, 1 + eOut(prog(t, 22.7, 23.5)) * .4);
      crec.children.slice(0, 4).forEach((b, i) => b.scale.y = Math.max(.01, eBack(prog(t, 23.85 + i * .1, 24.2 + i * .1))));
    };
    m.X = X; m.T = T;
    return m;
  },
  naves() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g); const L = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const n = new THREE.Group(); const b = caja(7, 3.6, 5, mat('#E9E5DE', .8)); b.position.y = 1.8; n.add(b);
      const r = caja(7.4, .2, 5.4, mat('#C9C3B9', .55, .2)); r.position.y = 3.7; n.add(r);
      n.position.set(-15 + i * 10, 0, -8 + j * 8); g.add(n); L.push(n);
    }
    m.L = L; return m;
  },
  solucion() {
    const m = mundo(), c = contenedor({ ventanas: 2 }); m.scene.add(c); m.c = c; return m;
  },
  maquetas() {
    const m = mundo(), g = new THREE.Group(); m.scene.add(g);
    const disco = cil(7, 7, .3, mat(C.blanco, .6), 64); disco.position.y = .15; g.add(disco);
    const cascos = new THREE.Group(); const c1 = casco(C.nar), c2 = casco(C.teal); c1.position.x = -1.7; c2.position.x = 1.7; c2.scale.setScalar(.85); cascos.add(c1, c2); cascos.position.y = .3;
    const res = new THREE.Group(); { const a = contenedor({ color: C.blanco, ventanas: 2 }); const b = contenedor({ color: C.nar, ventanas: 2 }); b.position.set(1.4, 2.59, 0); b.rotation.y = Math.PI / 2; res.add(a, b); }
    const ofi = new THREE.Group(); [C.teal, C.blanco, C.nar].forEach((col, i) => { const k = contenedor({ color: col, ventanas: 3 }); k.position.z = -2.5 + i * 2.5; ofi.add(k); });
    const pro = new THREE.Group(); { const L = [[0, 0, 0, 0, C.nar], [0, 0, 2.45, 0, C.blanco], [-4.3, 0, 3.4, Math.PI / 2, C.teal], [0, 2.59, 1.22, 0, C.tinta]];
      L.forEach(([x, y, z, r, col]) => { const k = contenedor({ color: col, ventanas: 2 }); k.position.set(x, y, z); k.rotation.y = r; pro.add(k); }); pro.position.set(1.5, 0, -1.6); }
    const items = [cascos, res, ofi, pro]; items.forEach(i => { i.position.y += .3; g.add(i); }); cascos.position.y = 1.2;
    const esc = [1.9, 1.25, 1.1, 1.05];
    const T = [31.72, 32.86, 34.24, 35.02, 36.4];
    m.estado = t => {
      g.rotation.y = t * .35;
      items.forEach((it, i) => { const k = eBack(prog(t, T[i], T[i] + .4)) * (1 - eIO(prog(t, T[i + 1] - .05, T[i + 1] + .2))); crece(it, k * esc[i]); });
    };
    return m;
  },
  aterriza() {
    const m = mundo(), c = contenedor({ ventanas: 0 }); m.scene.add(c);
    const polvo = new THREE.Mesh(new THREE.TorusGeometry(1, .25, 12, 48), new THREE.MeshBasicMaterial({ color: '#d9d2c5', transparent: true })); polvo.rotation.x = Math.PI / 2; polvo.position.y = .2; m.scene.add(polvo);
    m.estado = t => { const k = eBounce(prog(t, 36.25, 36.75)); c.position.y = (1 - k) * 16; c.rotation.y = .5 - k * .5;
      const p = prog(t, 36.55, 37.3); polvo.scale.setScalar(2 + eOut(p) * 7); polvo.material.opacity = (1 - p) * .35 * (t > 36.55); };
    return m;
  },
};
Object.assign(MUNDOS, S2.MUNDOS, S3.MUNDOS, S4.MUNDOS);
function sombra_(o) { o.castShadow = true; return o; }

// ================= LÍNEA DE TIEMPO (prueba 0:00–0:39) =================
const P2 = (txt, v, k, op) => { const p = D.pt(v); D.pill(txt, p.x, p.y, k, op); };
export const BEATS = [
  { a: 0, b: 3.0, modo: '3d', mundo: 'nave', trans: 'nada',
    cam: (c, lt) => orbita(c, lerp(.95, .55, eIO(lt / 3)), lerp(50, 38, eOut(lt / 3)), lerp(24, 16, eOut(lt / 3)), V(0, 3, 0)),
    ov: (lt, t) => P2('EN RENTA', V(0, 11.5, 8), prog(t, 1.4, 1.75), { bg: C.nar, size: 40 }) },
  { a: 3.0, b: 6.0, modo: '3d', mundo: 'nave', trans: 'zoom', sfx: [['tic', 3.66], ['tic', 3.96], ['tic', 4.26], ['tic', 4.56]],
    cam: (c, lt) => orbita(c, lerp(.32, .12, lt / 3), lerp(31, 27, eOut(lt / 3)), 26, V(0, 1, -2.5)),
    ov: (lt, t) => { D.barra(80, 150, 520, prog(t, 3.5, 5.8), 'TU INVERSIÓN EN LA NAVE'); } },
  { a: 6.0, b: 7.92, modo: '3d', mundo: 'nave', trans: 'whip', sacude: [[6.56, .5]], sfx: [['boom', 6.56]],
    cam: (c, lt) => { c.position.set(lerp(2, 0, lt / 2), lerp(44, 40, lt / 2), 9); c.lookAt(0, 0, 0); },
    ov: (lt, t) => D.sello('PROPIEDAD\nDEL DUEÑO', 960, 360, prog(t, 6.45, 6.8)) },
  { a: 7.92, b: 11.98, modo: 'div', mundo: 'nave', trans: 'nada', sfx: [['tic', 8.32], ['tic', 9.52], ['tic', 10.44], ['tic', 11.08]],
    cam: (c, lt) => { c.position.set(lerp(0, 2.5, lt / 4), 28, 26); c.lookAt(1.7, 1, -3.5); },
    ov: (lt, t, w) => w.scene.children.find(o => o.userData.cuartos)?.userData.cuartos.forEach((q, i) => {
      const T = [8.32, 9.52, 10.44, 11.08][i], p = q.getWorldPosition(new THREE.Vector3()); p.y += 5;
      P2(q.userData.nombre, p, prog(t, T, T + .3), { bg: C.nar, size: 30 }); }) },
  { a: 11.98, b: 13.88, modo: '3d', mundo: 'calendario', trans: 'zoom', sfx: [['boom', 13.2]], sacude: [[13.2, .12]],
    cam: (c, lt) => { c.position.set(lerp(3, 1, lt / 2), 4.5, lerp(17, 14, eOut(lt / 2))); c.lookAt(0, 3.6, 0); },
    ov: (lt, t) => D.titulo('FIN DEL CONTRATO', 1420, 300, 130, prog(t, 13.2, 13.5), { color: C.rojo, slam: true, rot: -.05 }) },
  { a: 13.88, b: 15.38, modo: '3d', mundo: 'nave', trans: 'whip', sfx: [['whoosh_grave', 14.1], ['tic', 14.84]],
    cam: (c, lt) => { c.position.set(lerp(20, 24, lt / 1.5), 7, lerp(36, 33, lt / 1.5)); c.lookAt(4, 3, 4); },
    ov: (lt, t) => { P2('🔒  TODO SE QUEDA', V(0, 9.8, 8), prog(t, 14.75, 15.05), { bg: C.rojo, size: 38 }); } },
  { a: 15.38, b: 17.58, modo: '3d', mundo: 'lote', trans: 'zoom', sfx: [['boom', 16.3]],
    cam: (c, lt) => orbita(c, lerp(.6, .45, lt / 2.2), 34, lerp(20, 26, eIO(lt / 2.2)), V(0, 0, 0)),
    ov: (lt, t) => { D.titulo('EMPIEZAS DE', 960, 175, 70, prog(t, 15.7, 16), { color: C.tinta }); D.titulo('CERO', 960, 330, 260, prog(t, 16.3, 16.55), { color: C.nar, slam: true }); } },
  { a: 17.58, b: 19.74, modo: 'cam', trans: 'zoom' },
  { a: 19.74, b: 24.5, modo: '3d', mundo: 'monedas', trans: 'zoom', sfx: [['moneda', 19.8], ['tic', 20.9], ['tic', 21.96], ['tic', 22.64], ['tic', 23.8]],
    cam: (c, lt, t, w) => {
      const i = w.T.filter(x => t >= x).length, xa = i ? w.X[i - 1] : -14, xp = i > 1 ? w.X[i - 2] : -14, k = eIO(prog(t, i ? w.T[i - 1] - .1 : 0, i ? w.T[i - 1] + .5 : 1));
      const x = i ? lerp(xp, xa, k) : -14; c.position.set(x + 2.5, 6.5, 14); c.lookAt(x, 1.6, 0); },
    ov: (lt, t, w) => ['EQUIPO', 'GENTE', 'ESPACIO', 'CRECIMIENTO'].forEach((n, i) => P2(n, V(w.X[i], 4.1, 0), prog(t, w.T[i] + .1, w.T[i] + .4), { bg: C.tinta, size: 34, punto: C.nar })) },
  { a: 24.5, b: 27.22, modo: 'div', mundo: 'naves', trans: 'nada', sfx: [['tic', 25.0], ['tic', 25.4], ['tic', 25.8], ['tic', 26.2]],
    cam: (c, lt) => orbita(c, lerp(.5, .3, lt / 2.7), 52, 30, V(0, 0, 0)),
    ov: (lt, t, w) => w.L.forEach((n, i) => P2('EN RENTA', V(n.position.x, 6, n.position.z), prog(t, 24.8 + i * .17, 25.1 + i * .17), { bg: C.nar, size: 22 })) },
  { a: 27.22, b: 27.98, modo: '3d', mundo: 'solucion', trans: 'flash', sfx: [['listo', 27.52]],
    cam: (c, lt) => orbita(c, .7 + lt * .3, 13, 5, V(0, 1.3, 0)),
    ov: (lt, t) => D.check(960, 300, 95, prog(t, 27.45, 27.9)) },
  { a: 27.98, b: 31.0, modo: 'cam', trans: 'zoom',
    ov: (lt, t) => { const k = eOut(prog(t, 28.5, 28.9)); D.g.save(); D.g.globalAlpha = k; D.g.translate((1 - k) * -80, 0);
      D.g.fillStyle = C.nar; D.g.fillRect(90, 110, 10, 120); D.g.font = '78px Bebas'; D.g.fillStyle = '#fff'; D.g.textBaseline = 'top'; D.g.fillText('NOMBRE CLIENTE', 125, 112);
      D.g.font = '32px "Poppins SB"'; D.g.fillStyle = 'rgba(255,255,255,.85)'; D.g.fillText('Arquitecto', 128, 190); D.g.restore(); } },
  { a: 31.0, b: 36.25, modo: 'div', mundo: 'maquetas', trans: 'nada', sfx: [['tic', 31.72], ['whoosh_rapido', 32.75], ['whoosh_rapido', 34.13], ['whoosh_rapido', 34.92]],
    cam: (c, lt) => orbita(c, .5, lerp(24, 20, lt / 5), 10, V(0, 2.4, 0)),
    ov: (lt, t) => { const L = [['PADRE E HIJO', 31.72, 32.86], ['RESIDENCIAS', 32.86, 34.24], ['OFICINAS', 34.24, 35.02], ['PROYECTOS', 35.02, 36.3]];
      for (const [n, a, b] of L) if (t >= a && t < b) D.titulo(n, 1320, 165, 120, prog(t, a, a + .3), { color: C.tinta }); } },
  { a: 36.25, b: 37.32, modo: '3d', mundo: 'aterriza', trans: 'whip', sacude: [[36.6, .35]], sfx: [['boom', 36.58]],
    cam: (c, lt) => { c.position.set(lerp(11, 10, lt), 7, 15); c.lookAt(0, 1.4, 0); },
    ov: (lt, t) => D.titulo('CONTENEDORES', 960, 200, 210, prog(t, 36.55, 36.85), { color: C.nar, slam: true }) },
  { a: 37.32, b: 39.2, modo: 'cam', trans: 'zoom',
    ov: (lt, t) => D.titulo('?', 1520, 420, 420, prog(t, 37.9, 38.3), { color: C.nar, rot: Math.sin(t * 4) * .06, sombra: 'rgba(0,0,0,.5)' }) },
  ...S2.BEATS,
  ...S3.BEATS,
  ...S4.BEATS,
];
