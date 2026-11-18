// Demo del estilo «neón»: enseña TODAS las piezas con contenido inventado («Cómo vender cursos por internet»).
// Sirve de machote: copia el beat de la pieza que necesites y cámbiale los datos. La guía completa está en estilos/neon/ESTILO.md.
// En este estilo todos los cambios de encuadre son corte seco; solo el vuelo a la ventana lleva `tr`.
const mini = n => `img/mini${n}.svg`, reel = n => `img/reel${n}.svg`;

export default {
  beats: [
    // 0 · persona a cámara: arranca muy cerca y se aleja de golpe (menos de 1 s antes de la primera animación)
    { a: 0, video: 'completo', zoom: [1.5, 1.03], foco: [.5, 0] },

    // 1 · la pregunta del espectador, escrita en una barra de búsqueda
    { a: 0.7, video: 'oculto', pieza: 'buscador', texto: '¿Cómo vender *cursos* por *internet* sin gastar en anuncios?', clic: 1.8 },

    // 2 · «mucho contenido»: anillo de videos verticales
    { a: 2.9, video: 'oculto', pieza: 'carrusel', imagenes: [1, 2, 3, 4, 5].map(reel), saturar: true },

    // 3 · la frase de dolor con cifra
    { a: 4.5, video: 'oculto', pieza: 'cero', texto: '$0' },

    // 4 · el nombre del producto (con destello blanco: del dolor a la solución)
    { a: 5.4, video: 'oculto', pieza: 'logo', logo: 'img/logo.svg', titulo: 'Academia Digital', destello: true },

    // 5 y 6 · los dos pilares: tarjeta clara contra tarjeta oscura
    { a: 7.6, video: 'oculto', pieza: 'tarjeta', color: 'blanca', titulo: 'Cursos grabados', anillos: true, imagen: 'img/objeto.svg',
      datos: [{ etiqueta: 'Alumnos', valor: '1,240', cambio: '↑ 236%' }, { etiqueta: 'Ventas del mes', valor: '$4,296', cambio: '↑ 111%' },
        { etiqueta: 'Visitas', valor: '2.8M', cambio: '↑ 230%' }, { etiqueta: 'Seguidores', valor: '215,611', cambio: '↑ 94%' }] },
    { a: 9.1, video: 'oculto', pieza: 'tarjeta', color: 'roja', titulo: 'Clases en vivo', anillos: { x: 760, y: 420, escala: .5 }, imagen: 'img/objeto.svg',
      datos: [{ etiqueta: 'Asistentes', valor: '8.9 K', nota: 'Casi igual a lo habitual' }, { etiqueta: 'Horas vistas', valor: '678.5 K', nota: 'Casi igual a lo habitual' },
        { etiqueta: 'Nuevos alumnos', valor: '+662', nota: '36 más de lo habitual' }, { etiqueta: 'Ingresos', valor: '$34,750', nota: 'Casi igual a lo habitual' }] },

    // 7 · metas escalonadas de dinero
    { a: 10.5, video: 'oculto', pieza: 'grafica',
      metas: [{ etiqueta: 'Ingresos:', valor: '$5,000', sufijo: '/MES' }, { etiqueta: 'Ingresos:', valor: '$10,000', sufijo: '/MES', acento: true }] },

    // 8 · trayectoria
    { a: 13.8, video: 'oculto', pieza: 'trayectoria', texto: '+8 años', imagenes: [1, 2, 3, 4, 5, 6, 7, 1].map(mini), saturar: true },

    // 9 · prueba: capturas con la cifra marcada en verde
    { a: 15.4, video: 'oculto', pieza: 'capturas', imagenes: ['img/captura-oscura.svg', 'img/captura-clara.svg', 'img/captura-clara.svg', mini(2), mini(5)],
      resalta: { x: .715, y: .905, w: .262, h: .075 } },

    // 10 · la cifra mensual principal, contando
    { a: 16.3, video: 'oculto', pieza: 'tarjeta', color: 'azul', titulo: 'Ventas de cursos', imagen: 'img/objeto.svg', cuenta: { de: 4118, hasta: 15000, sufijo: '/mes' } },

    // 11 · más prueba + la cifra más grande del video (el contador va como extra, abajo)
    { a: 18.1, video: 'oculto', pieza: 'capturas', imagenes: ['img/captura-oscura2.svg', 'img/captura-oscura.svg', 'img/captura-clara2.svg'], destello: true, entrada: 6 },

    // 12 · puente a «te enseño por dentro»: la pantalla inclinada en 3D, con la ventana de la persona encima
    { a: 20.0, video: 'ventana', videoEncima: true, pieza: 'pantalla3d', imagen: 'img/pantalla.svg', acerca: .7, zoom: 1.75, foco: [.5, .3],
      resalta: { x: .366, y: .262, w: .31, h: .052, a: 1.3 } },

    // 13 · vuelve a cámara para anunciar el recorrido
    { a: 22.2, video: 'completo' },

    // 14 · recorrido de pantalla: la persona VUELA a la ventana (tr) y la grabación corre debajo, con un acercamiento
    { a: 22.8, video: 'ventana', videoEncima: true, tr: .8, pieza: 'pantalla', pantalla: 'recorrido', zoom: 1.3, foco: [.45, .5],
      acercamientos: [{ a: 1.2, zoom: 1.7, foco: [.36, .5], entra: 1.1 }] },

    // 15 · niveles
    { a: 25.4, video: 'oculto', pieza: 'escalones', niveles: ['Nivel 0', 'Nivel 20', 'Nivel 40', 'Nivel 60', 'Nivel 80', 'Nivel 100'], inicio: 'Novato' },

    // 16 · toma de apoyo (el rótulo va como extra)
    { a: 28.9, video: 'oculto', pieza: 'apoyo', imagen: 'img/apoyo.svg' },

    // 17 · cifra + el medio con que se logró
    { a: 30.7, video: 'oculto', pieza: 'pastilla', etiqueta: 'Ventas:', valor: '$10,000', imagen: 'img/telefono.svg', nota: 'Sin anuncios' },

    // 18 · todo lo que incluye
    { a: 32.5, video: 'oculto', pieza: 'rejilla', tarjetas: [
      { imagen: 'img/curso1.svg', titulo: 'Crea tu oferta', texto: 'Define qué vendes, a quién y a qué precio.', avance: 20 },
      { imagen: 'img/curso2.svg', titulo: 'Correos que venden', texto: 'La secuencia de 5 correos para tu lanzamiento.', avance: 0 },
      { imagen: 'img/curso3.svg', titulo: 'Anuncios desde cero', texto: 'Tu primera campaña con poco presupuesto.', avance: 0 },
      { imagen: 'img/curso4.svg', titulo: 'Clases en vivo', texto: 'Cómo vender al final de una clase gratuita.', avance: 0 },
      { imagen: 'img/curso5.svg', titulo: 'Tu comunidad', texto: 'Mantén a tus alumnos activos mes con mes.', avance: 0 },
      { imagen: 'img/curso6.svg', titulo: 'Herramientas de IA', texto: 'Produce tus clases en la mitad del tiempo.', avance: 0 }] },

    // 19 · oferta y urgencia: el precio de hoy y el de después
    { a: 34.8, video: 'oculto', pieza: 'precio', logo: 'img/logo.svg', marca: 'ACADEMIA DIGITAL', titulo: 'Academia Digital', enlace: 'tusitio.com/academia',
      texto: 'Aprende a crear y vender tu curso por internet con un sistema paso a paso y una comunidad que te acompaña.',
      datos: [['491', 'Miembros'], ['13', 'En línea'], ['2', 'Guías']], boton: 'ENTRAR', precio: { de: 29, hasta: 914, sufijo: '/mes' }, nota: 'De por vida', pie: 'Pago seguro', sube: 1.6 },

    // 20 · cierre a cámara con el botón (extra)
    { a: 37.8, video: 'completo', zoom: [1, 1.1], foco: [.5, 0] },
  ],
  extras: [
    { a: 18.3, b: 20.0, pieza: 'contador', de: 3333, hasta: 200000 },
    { a: 28.9, b: 30.7, pieza: 'rotulo', texto: '+25 personas', texto2: '(Equipo de producción de cursos)' },
    { a: 38.0, b: 39.95, pieza: 'boton', texto: 'ENTRAR', clic: 1.2 },
  ],
};
