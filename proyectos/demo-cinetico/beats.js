// Demo del estilo «cinético»: enseña TODAS las piezas con un guion inventado («cómo llenar tu agenda de clientes»).
// No tiene video ("fuente": null): el motor pone una silueta de muestra, que también tapa el texto que va DETRÁS.
// Los segundos de cada palabra aquí van a ojo; en un video real se copian de palabras.json.
const FOTOS = [1, 2, 3, 4, 5, 6, 7, 8].map(n => `img/foto${n}.svg`);

export default {
  beats: [
    // ── gancho: promesa con cifra + cortina con título ──
    { a: 0,    video: 'completo' },                                                    // + reloj y conteo (extras)
    { a: 1.4,  video: 'bajo', pieza: 'cortina', textos: [['TE VOY A ENSEÑAR', 1.4], { t: 'cómo llenar', a: 2.3, chico: true }] },
    { a: 3.4,  video: 'oculto', pieza: 'figuras', modo: 'multitud', fondo: 'rejilla', n: 24, texto: '{n} clientes nuevos' },
    { a: 5.2,  video: 'completo', pieza: 'escalera', golpes: [['QUE TE BUSCAN', 5.2], ['{n:QUE TE ESCRIBEN}', 5.9], ['Y TE PAGAN\n{v:POR ADELANTADO}', 6.6]] },
    { a: 7.8,  video: 'completo' },                                                    // + frase al pecho y palabra verde detrás
    // ── presentación y credenciales ──
    { a: 10.4, video: 'retrato', pieza: 'presentacion', nombre: 'ANA TORRES' },
    { a: 11.9, video: 'oculto', pieza: 'clip', pantalla: 'apoyo', bucle: true },        // + rótulos amarillos
    { a: 13.6, video: 'cerradoDer' },                                                  // + apoyo lateral
    // ── dolor ──
    { a: 15.1, video: 'cerrado' },                                                     // + MENTIRA detrás
    { a: 16.4, video: 'cerradoDer' },                                                  // + lista lateral
    { a: 18.8, video: 'cerradoDer' },                                                  // + sello NO y frases
    { a: 20.7, video: 'lento' },                                                       // + palabras gigantes encadenadas
    // ── la solución, con insertos ──
    { a: 22.9, video: 'oculto', pieza: 'igual', uno: 'si a esto le sumas', dos: 'una agenda llena', aIgual: 23.6, aDos: 24.1 },
    { a: 25.2, video: 'oculto', pieza: 'icono', iconos: [['caja', 25.2], ['mensajes', 26.2]], texto: 'eso que hoy vendes uno a uno' },
    { a: 27.4, video: 'cerradoDer' },                                                  // + figuras que se pintan y texto por golpes
    { a: 29.2, video: 'columna', pieza: 'columnas', izq: ['img/toma1.svg', 'img/toma3.svg'], der: ['img/toma2.svg', 'img/toma1.svg'], cifra: '32', texto: 'CIUDADES', rotulos: ['MONTERREY', 'BOGOTÁ'], aRotulos: 30.2 },
    { a: 31.0, video: 'ventanita', videoEncima: true, pieza: 'captura', imagen: 'img/captura.svg', mira: [.55, .5] },
    { a: 32.3, video: 'oculto', pieza: 'apiladas', fotos: ['img/toma1.svg', 'img/toma2.svg', 'img/toma3.svg'] },
    { a: 33.9, video: 'oculto', pieza: 'carrusel', fotos: FOTOS, texto: 'CIENTOS\nDE\nCLIENTES' },
    { a: 35.4, video: 'oculto', pieza: 'mosaico', fotos: FOTOS, texto: 'MILES Y MILES\nDE CITAS' },
    // ── cierre ──
    { a: 36.6, video: 'oculto', pieza: 'logo', imagen: 'img/logo.svg' },
    { a: 37.7, video: 'completo', pieza: 'cta', texto: 'REGÍSTRATE\nAQUÍ ABAJO' },
    { a: 38.9, video: 'completo' },                                                    // + marca de agua y llamado
  ],
  extras: [
    { a: 0,    b: 1.4,  pieza: 'reloj', detras: true },
    { a: 0.05, b: 1.4,  pieza: 'conteo', chico: 'En menos de', fuerte: '5 minutos', aFuerte: 0.45 },
    { a: 2.3,  b: 3.4,  pieza: 'gigante', detras: true, texto: 'TU AGENDA', color: 'rojo', y: 250 },
    { a: 3.2,  b: 3.4,  pieza: 'entrada' },
    { a: 7.8,  b: 8.3,  pieza: 'destello' },
    { a: 7.9,  b: 10.4, pieza: 'frase', frases: [['todo esto', 7.9], ['gracias a un {v:sistema}', 8.8]] },
    { a: 9.5,  b: 10.4, pieza: 'gigante', detras: true, texto: 'MUY SENCILLO', color: 'verde' },
    { a: 11.95, b: 12.75, pieza: 'rotulo', texto: 'CONSULTORA' },
    { a: 12.75, b: 13.6, pieza: 'rotulo', texto: 'AUTORA\nBEST SELLER', donde: 'abajo' },
    { a: 13.6, b: 14.1, pieza: 'destello' },
    { a: 13.7, b: 15.1, pieza: 'lateral', chico: 'Esto a', fuerte: 'MILES DE NEGOCIOS' },
    { a: 15.1, b: 16.4, pieza: 'separadas', detras: true, texto: 'MENTIRA' },
    { a: 16.5, b: 18.8, pieza: 'lista', items: [['de tus referidos', 16.5], ['de la suerte', 17.1], ['de tu tiempo', 17.7]] },
    { a: 18.8, b: 20.7, pieza: 'sello', detras: true, texto: 'NO' },
    { a: 18.85, b: 20.7, pieza: 'frase', frases: [['No es casualidad', 18.85], { t: 'No es {x:suerte}', a: 19.8, abajo: true }] },
    { a: 20.7, b: 22.9, pieza: 'gigante', detras: true, palabras: [['MÁS', 20.7], ['SENCILLA', 21.1], ['MÁS RÁPIDA', 21.7], ['{v:MÁS RENTABLE}', 22.3]] },
    { a: 27.4, b: 29.2, pieza: 'figuras', detras: true, n: 9 },
    { a: 27.5, b: 29.2, pieza: 'golpes', golpes: [['cuando te vean', 27.5], ['no te puedan', 28.1], ['{r:ignorar}', 28.6]] },
    { a: 38.9, b: 40,   pieza: 'marca', detras: true, imagen: 'img/logo.svg' },
    { a: 38.9, b: 40,   pieza: 'llamado', texto: 'AGENDA TU CITA AQUÍ ABAJO' },
  ],
};
