// PROYECTO BASE · Plantilla larga 1 · Neón (video de 3 minutos = 180 s)
// Está ordenado por las SECCIONES de plantillas/neon/ESCALETA-BASE.md. Todo lo que dice «CAMBIA» es relleno:
// cámbialo por lo que dice la persona. Las cifras (1,234 · 12,345 · 123,456) son de mentira: pon las reales.
// Cómo usarlo:
//   1. En S está el segundo donde EMPIEZA cada sección. Mover una sección = cambiar su número (los beats de adentro se mueven solos).
//   2. Cada beat trae un comentario con la frase del guion que lo dispara: ajusta su `a` al segundo en que se dice esa frase.
//   3. Si tu video dura otra cosa, reparte S con los porcentajes de ESCALETA-BASE.md y cambia "dur" en proyecto.json.
// Se puede fotografiar tal cual, sin video:  node motor/render.mjs proyectos/<tu-video> --fotos 4,16.5,23,31,60,125,137,154,162

const S = {
  gancho: 0,       //  5 % · deseo → dolor → nombre del producto
  promesa: 9,      //  5 % · los pilares y el rango de dinero
  prueba: 18,      //  6 % · trayectoria + capturas + la cifra más grande
  puente: 29,      //  4 % · «te enseño cómo es por dentro»
  recorrido: 36,   // 48 % · la plataforma por dentro, con la persona en la ventanita
  niveles: 122,    //  4 % · cómo está organizado (etapas)
  respaldo: 129,   //  9 % · el negocio real: equipo, cifra y todo lo que incluye
  oferta: 145,     //  7 % · precio de hoy y precio de después
  llamado: 158,    // 12 % · «dale clic al botón», garantía y despedida
};                 // el video termina en 180 ("dur" de proyecto.json)

// dibujos de relleno (cámbialos por las imágenes de la persona en img/)
const reel = n => `img/reel${n}.svg`, mini = n => `img/mini${n}.svg`, curso = n => `img/curso${n}.svg`;
const VENTANA = { video: 'ventana', videoEncima: true };   // la persona en la ventanita, encima de la pantalla

export default {
  beats: [
    // ═════════ 1 · GANCHO (0–9 s): algo cambia cada 1.6 s; la persona sale menos de 1 s ═════════
    // «Si estás aquí es porque…»  → la persona arranca muy cerca y se aleja de golpe
    { a: S.gancho, video: 'completo', zoom: [1.5, 1.03], foco: [.5, 0] },
    // «…quieres [el deseo de tu cliente]»  → la pregunta escrita en la barra (las palabras entre *asteriscos* van en negrita)
    { a: S.gancho + 0.7, video: 'oculto', pieza: 'buscador', texto: 'CAMBIA: ¿la *pregunta* de tu *cliente* en una línea?', clic: 1.8 },
    // «…y dejar de [lo que hace sin parar: publicar, llamar, tocar puertas]»  → anillo de videos verticales
    { a: S.gancho + 3.2, video: 'oculto', pieza: 'carrusel', imagenes: [1, 2, 3, 4, 5].map(reel), saturar: true },
    // «…sin ganar un solo peso»  → la cifra del dolor (CAMBIA si tu dolor es otro número)
    { a: S.gancho + 5.0, video: 'oculto', pieza: 'cero', texto: '$0' },
    // «Por eso creé [nombre del producto]»  → logo con destello blanco (del dolor a la solución)
    { a: S.gancho + 5.9, video: 'oculto', pieza: 'logo', logo: 'img/logo.svg', titulo: 'CAMBIA: Tu Producto', destello: true },

    // ═════════ 2 · PROMESA (9–18 s): los dos pilares y el rango de dinero ═════════
    // «Aquí vas a aprender [pilar 1]…»  → tarjeta clara con hasta 4 datos
    { a: S.promesa, video: 'oculto', pieza: 'tarjeta', color: 'blanca', titulo: 'CAMBIA: pilar 1', anillos: true, imagen: 'img/objeto.svg',
      datos: [{ etiqueta: 'CAMBIA: dato 1', valor: '1,234', cambio: '↑ 00%' }, { etiqueta: 'CAMBIA: dato 2', valor: '$1,234', cambio: '↑ 00%' },
        { etiqueta: 'CAMBIA: dato 3', valor: '1.2M', cambio: '↑ 00%' }, { etiqueta: 'CAMBIA: dato 4', valor: '12,345', cambio: '↑ 00%' }] },
    // «…y [pilar 2]»  → tarjeta oscura, para que contraste con la primera
    { a: S.promesa + 2.0, video: 'oculto', pieza: 'tarjeta', color: 'roja', titulo: 'CAMBIA: pilar 2', anillos: { x: 760, y: 420, escala: .5 }, imagen: 'img/objeto.svg',
      datos: [{ etiqueta: 'CAMBIA: dato 1', valor: '1.2 K', nota: 'CAMBIA: nota' }, { etiqueta: 'CAMBIA: dato 2', valor: '12.3 K', nota: 'CAMBIA: nota' },
        { etiqueta: 'CAMBIA: dato 3', valor: '+123', nota: 'CAMBIA: nota' }, { etiqueta: 'CAMBIA: dato 4', valor: '$1,234', nota: 'CAMBIA: nota' }] },
    // «…para llegar a [meta 1] o [meta 2] al mes»  → línea que sube con las dos metas (la segunda se pone amarilla)
    { a: S.promesa + 4.0, video: 'oculto', pieza: 'grafica',
      metas: [{ etiqueta: 'CAMBIA meta 1:', valor: '$1,234', sufijo: '/MES' }, { etiqueta: 'CAMBIA meta 2:', valor: '$12,345', sufijo: '/MES', acento: true }] },

    // ═════════ 3 · AUTORIDAD Y PRUEBA (18–29 s): capturas de 0.5 a 1.3 s, de 2 a 4 seguidas ═════════
    // «Llevo más de N años haciendo esto»  → los años + miniaturas de su trabajo
    { a: S.prueba, video: 'oculto', pieza: 'trayectoria', texto: 'CAMBIA: +N años', imagenes: [1, 2, 3, 4, 5, 6, 7, 1].map(mini), saturar: true },
    // «…y hoy mis [páginas, tiendas, clientes] generan…»  → primera captura real, con la cifra marcada en verde
    { a: S.prueba + 1.9, video: 'oculto', pieza: 'capturas', imagenes: ['img/captura-oscura.svg', 'img/captura-clara.svg', 'img/captura-clara.svg', mini(2), mini(5)],
      resalta: { x: .715, y: .905, w: .262, h: .075 } },
    // «…en promedio [tu cifra mensual] al mes»  → tarjeta azul con la cifra contando
    { a: S.prueba + 3.0, video: 'oculto', pieza: 'tarjeta', color: 'azul', titulo: 'CAMBIA: tu cifra mensual', imagen: 'img/objeto.svg', cuenta: { de: 123, hasta: 1234, sufijo: '/mes' } },
    // «…en el año fueron [tu cifra más grande]»  → capturas + el contador gigante (extra de abajo). UNO solo por video
    { a: S.prueba + 5.8, video: 'oculto', pieza: 'capturas', imagenes: ['img/captura-oscura2.svg', 'img/captura-oscura.svg', 'img/captura-clara2.svg'], destello: true, entrada: 6 },
    // «…[una fuente de ingreso]…»  → otra captura
    { a: S.prueba + 8.8, video: 'oculto', pieza: 'capturas', imagenes: ['img/captura-clara.svg', 'img/captura-oscura2.svg', mini(3)] },
    // «…y [la otra fuente]»  → la última captura de la racha
    { a: S.prueba + 9.9, video: 'oculto', pieza: 'capturas', imagenes: ['img/captura-oscura.svg', 'img/captura-clara2.svg', mini(6)], resalta: { x: .715, y: .905, w: .262, h: .075 } },

    // ═════════ 4 · PUENTE (29–36 s): de los números a «te lo enseño por dentro» ═════════
    // «Pero más allá de los números, quiero que veas cómo es por dentro»  → la pantalla inclinada en 3D, con el título resaltado
    { a: S.puente, video: 'oculto', pieza: 'pantalla3d', imagen: 'img/pantalla.svg', acerca: 1.5, zoom: 1.75, foco: [.5, .3],
      resalta: { x: .366, y: .262, w: .31, h: .052, a: 2.4 } },
    // «Te voy a enseñar qué hay dentro»  → la persona a cámara, 2 s, sin nada encima
    { a: S.puente + 4.6, video: 'completo' },

    // ═════════ 5 · RECORRIDO (36–122 s): un cambio cada 3.7 s; nunca más de 8 s sin scroll, clic o cambio de página ═════════
    // CAMBIA las imágenes por la grabación de pantalla: `pantalla: 'recorrido', desde: <segundo de la grabación>` (ESTILO.md › A6)
    // «Cuando entras, lo primero que ves es…»  → la persona VUELA a la ventanita (tr) y la portada baja con scroll
    { a: S.recorrido, ...VENTANA, tr: .8, pieza: 'pantalla', imagen: 'img/pagina-larga.svg', zoom: 1.3, desplaza: [.1, .9] },
    // «Mira el resultado de [un cliente]… y el de [otro cliente]»  → se abre una publicación y la pantalla se acerca a la cifra
    { a: S.recorrido + 15, ...VENTANA, pieza: 'pantalla', imagen: 'img/pagina-larga.svg', zoom: 1.3, foco: [.4, .2], sfx: [],
      acercamientos: [{ a: 2, b: 7, zoom: 1.8, foco: [.36, .16] }, { a: 9, b: 14, zoom: 1.8, foco: [.36, .32] }] },
    // «Aquí está [contenido 1]… [contenido 2]… [contenido 3]…»  → la lista de contenidos, una entrada corta por frase
    { a: S.recorrido + 30, ...VENTANA, pieza: 'pantalla', imagen: 'img/pantalla.svg', zoom: 1.3, foco: [.45, .5], sfx: [],
      acercamientos: [{ a: 4, b: 9, zoom: 1.7, foco: [.3, .4] }, { a: 12, b: 17, zoom: 1.7, foco: [.6, .45] }, { a: 21, b: 27, zoom: 1.7, foco: [.4, .7] }] },
    // «Además tienes [lo exclusivo: clases privadas, plantillas]»  → una sola página, 7 s como máximo
    { a: S.recorrido + 61, ...VENTANA, pieza: 'pantalla', imagen: 'img/pantalla.svg', zoom: 1.5, foco: [.6, .35], sfx: [],
      resalta: { x: .366, y: .262, w: .31, h: .052, a: 2 } },
    // «Cada semana hay [sesiones en vivo, llamadas]»  → el calendario y la ficha de un evento
    { a: S.recorrido + 68, ...VENTANA, pieza: 'pantalla', imagen: 'img/pagina-larga.svg', zoom: 1.3, desplaza: [.45, .75], sfx: [] },
    // «…y todo se queda grabado»  → las grabaciones; aquí termina el recorrido
    { a: S.recorrido + 80, ...VENTANA, pieza: 'pantalla', imagen: 'img/pantalla.svg', zoom: 1.4, foco: [.5, .6], sfx: [] },

    // ═════════ 6 · NIVELES (122–129 s): cómo está organizado ═════════
    // «Todo está ordenado paso a paso»  → corte a la persona, 1 s
    { a: S.niveles, video: 'completo' },
    // «…de cero a cien; si ya sabes algo, te saltas etapas»  → escalones; la bolita salta a la etapa 3 y a la última
    { a: S.niveles + 1.0, video: 'oculto', pieza: 'escalones', niveles: ['CAMBIA 1', 'Etapa 2', 'Etapa 3', 'Etapa 4', 'Etapa 5', 'CAMBIA 6'], inicio: 'CAMBIA' },

    // ═════════ 7 · RESPALDO (129–145 s): el negocio real; alterna cámara y animación en tramos de 1 a 8 s ═════════
    // «Para que tengas contexto, hoy mi empresa…»  → acercamiento de énfasis (dos beats: viaje + sostenido)
    { a: S.respaldo, video: 'completo', zoom: [1, 1.15], foco: [.5, 0] },
    { a: S.respaldo + 0.9, video: 'completo', zoom: 1.15, foco: [.5, 0] },
    // «…somos [N personas] trabajando en esto»  → 3 tomas de apoyo cortas y DISTINTAS (aquí se repite el dibujo de relleno) + rótulo (extra)
    { a: S.respaldo + 1.6, video: 'oculto', pieza: 'apoyo', imagen: 'img/apoyo.svg' },
    { a: S.respaldo + 4.2, video: 'oculto', pieza: 'apoyo', imagen: 'img/apoyo.svg', hacia: 'izquierda' },
    { a: S.respaldo + 5.3, video: 'oculto', pieza: 'apoyo', imagen: 'img/apoyo.svg' },
    // «…hemos generado [tu cifra] solo con [tu medio]»  → la cifra en pastilla y el teléfono que sube
    { a: S.respaldo + 6.2, video: 'oculto', pieza: 'pastilla', etiqueta: 'CAMBIA:', valor: '$12,345', imagen: 'img/telefono.svg', nota: 'CAMBIA: medio' },
    // «…fallando, probando y mejorando»  → vuelve la persona, con acercamiento
    { a: S.respaldo + 9.8, video: 'completo', zoom: [1, 1.15], foco: [.5, 0] },
    // «…y todo eso está aquí dentro: [lo que incluye]»  → rejilla de tarjetas que aparecen una por una
    { a: S.respaldo + 11.6, video: 'oculto', pieza: 'rejilla', tarjetas: [1, 2, 3, 4, 5, 6].map(n => (
      { imagen: curso(n), titulo: `CAMBIA: incluye ${n}`, texto: 'CAMBIA: qué es, en una línea.', avance: 0 })) },

    // ═════════ 8 · OFERTA (145–158 s): el precio de hoy y el de después ═════════
    // «Hoy puedes entrar por [tu precio]…»  → la persona, alejándose lento (tramo largo a cámara: hasta 8 s)
    { a: S.oferta, video: 'completo', zoom: [1.19, 1], foco: [.5, 0] },
    // «…y ese precio se te queda de por vida. Si entras después, va a ser más caro»  → tarjeta de inscripción; el precio sube en `sube`
    { a: S.oferta + 7.8, video: 'oculto', pieza: 'precio', logo: 'img/logo.svg', marca: 'CAMBIA: MARCA', titulo: 'CAMBIA: Tu Producto', enlace: 'CAMBIA: tusitio.com',
      texto: 'CAMBIA: qué recibe quien entra, en una o dos líneas.',
      datos: [['123', 'CAMBIA 1'], ['12', 'CAMBIA 2'], ['1', 'CAMBIA 3']], boton: 'ENTRAR', precio: { de: 12, hasta: 123, sufijo: '/mes' }, nota: 'CAMBIA: nota', pie: 'CAMBIA: pie', sube: 2.9 },

    // ═════════ 9 · LLAMADO A LA ACCIÓN (158–180 s): lo único largo a cámara; 2 botones y 1 acercamiento ═════════
    // «Dale clic al botón de aquí abajo»  → la persona + botón con cursor (extra)
    { a: S.llamado, video: 'completo' },
    // «…[la garantía o la última razón]»  → acercamiento de énfasis
    { a: S.llamado + 5.0, video: 'completo', zoom: [1, 1.15], foco: [.5, 0] },
    { a: S.llamado + 5.9, video: 'completo', zoom: 1.15, foco: [.5, 0] },
    // «Nos vemos dentro»  → corte de regreso al plano normal; segundo botón al final (extra)
    { a: S.llamado + 8.2, video: 'completo' },
  ],

  extras: [
    // PRUEBA · «…fueron [tu cifra más grande]»  → contador gigante encima de las capturas (CAMBIA `hasta`)
    { a: S.prueba + 6.0, b: S.prueba + 8.8, pieza: 'contador', de: 1234, hasta: 123456 },
    // RESPALDO · «somos [N personas]…»  → un solo rótulo que atraviesa las 3 tomas de apoyo
    { a: S.respaldo + 1.6, b: S.respaldo + 6.2, pieza: 'rotulo', texto: 'CAMBIA: +N personas', texto2: '(CAMBIA: quiénes son)' },
    // OFERTA · «si entras después…»  → destello blanco justo cuando el precio empieza a subir
    { a: S.oferta + 10.7, b: S.oferta + 11.2, pieza: 'destello' },
    // LLAMADO · «dale clic al botón»  → botón abajo, sobre el pecho (nunca tapa la cara)
    { a: S.llamado + 1.5, b: S.llamado + 4.6, pieza: 'boton', texto: 'CAMBIA: ENTRAR', clic: 1.3 },
    // LLAMADO · la despedida  → el segundo botón
    { a: S.llamado + 19.0, b: S.llamado + 21.9, pieza: 'boton', texto: 'CAMBIA: ENTRAR', clic: 1.3 },
  ],
};
