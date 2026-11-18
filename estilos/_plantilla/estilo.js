// Plantilla de estilo: lo mínimo que el motor espera. Copia la carpeta y cámbiala.
import { prog, eOut, eBack, h, entraSale } from '/motor/nucleo.js';

export default {
  nombre: 'plantilla',
  tr: 0.45,                                   // segundos que tarda la persona en viajar de un encuadre a otro
  video: {                                    // encuadres con nombre que usan los beats (video: 'ventana')
    porDefecto: 'completo',
    completo: {},
    ventana: { x: 1340, y: 60, w: 520, h: 292, r: 24, clase: 'ventana' },
    mitad: { x: 990, y: 110, w: 860, h: 860, r: 36, clase: 'ventana' },
  },
  fondo: { crea(el) {}, pinta(el, t) {} },    // lo que se ve cuando la persona no llena la pantalla (el CSS ya pone el degradado)
  piezas: {
    // cada pieza: crea(el, beat) una vez y pinta(el, tLocal, beat, M, dur) en cada cuadro. Todo depende SOLO de tLocal.
    titulo: {
      sinSubs: true,                          // mientras está esta pieza no hay subtítulos (el texto ya dice la frase)
      sfx: [['whoosh_rapido', -0.12, 0.3]],   // efecto de sonido al entrar (segundos respecto al inicio del beat)
      crea(el, b) { el.x = h('div', '', b.texto, el); },
      pinta(el, tl, b, M, dur) {
        const p = entraSale(tl, dur, .45, .25);
        el.x.style.transform = `translateY(${(1 - eBack(prog(tl, 0, .45))) * 80}px) scale(${.9 + .1 * eOut(prog(tl, 0, .45))})`;
        el.x.style.opacity = p;
      },
    },
  },
  subs: {                                     // subtítulos: cómo se parten en páginas y cómo se pinta cada una
    paginas: { max: 4, chars: 26 },
    crea(el) {},
    pinta(el, pag, t) { el.innerHTML = '<span>' + pag.palabras.map(w => (t >= w.a ? `<b>${w.txt}</b>` : w.txt)).join(' ') + '</span>'; },
  },
  encima: {                                   // capa fija sobre todo (barra de avance, logo…)
    crea(el) { el.b = h('div', 'barra', '', el); },
    pinta(el, t, M) { el.b.style.width = `${(t / M.datos.dur) * 100}%`; },
  },
};
