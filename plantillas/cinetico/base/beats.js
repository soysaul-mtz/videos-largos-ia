// PROYECTO BASE · Plantilla larga 2 · Cinético (video de 3 minutos = 180 s)
// Está ordenado por las SECCIONES de plantillas/cinetico/ESCALETA-BASE.md. Todo lo que dice «CAMBIA» o «TU…» es relleno:
// cámbialo por las palabras exactas que dice la persona (solo las 2 a 6 que cargan el sentido).
// Cómo usarlo:
//   1. En S está el segundo donde EMPIEZA cada sección. Mover una sección = cambiar su número (los beats de adentro se mueven solos).
//   2. Cada beat trae un comentario con la frase del guion que lo dispara. En un video real, cambia cada `S.x + n` por el
//      segundo en que se dice esa palabra (sale de palabras.json): el texto entra en el cuadro en que empieza a decirse.
//   3. Cada sección trae sus piezas típicas UNA vez: repite el patrón hasta llenarla (algo cambia cada 1.3 a 1.6 s).
//   4. Con video real: mide "foco" y "cara" en proyecto.json y corre preparar.py con --mascaras (para el texto que va DETRÁS).
// Se puede fotografiar tal cual, sin video:  node motor/render.mjs proyectos/<tu-video> --fotos 3,6.5,17,29,52,80,116,137,148,165

const S = {
  gancho: 0,         //  4 % · promesa con cifra; ni un cuadro limpio (mínimo 10 s, máximo 20 s)
  presentacion: 12,  //  7 % · quién habla y por qué creerle
  dolor: 25,         // 12 % · el dolor y la creencia falsa
  solucion: 47,      // 15 % · el giro y la solución (el nombre del programa)
  sistema: 74,       // 23 % · el sistema en 3 pasos
  proposito: 110,    // 12 % · para qué sirve todo esto en la vida de la persona
  caso: 132,         //  7 % · un caso de éxito
  quees: 145,        //  8 % · qué es y qué no es (desde aquí va la marca de agua)
  llamado: 159,      // 12 % · el llamado a la acción
};                   // el video termina en 180 ("dur" de proyecto.json)

// dibujos de relleno (cámbialos por las fotos y tomas de la persona en img/, o por videos con `pantalla: '<nombre>'`)
const FOTOS = [1, 2, 3, 4, 5, 6, 7, 8].map(n => `img/foto${n}.svg`);
const toma = n => `img/toma${n}.svg`;

export default {
  beats: [
    // ═════════ 1 · GANCHO Y PROMESA (0–12 s): primer texto antes de 0.3 s, primer inserto antes de 1.5 s ═════════
    // «En menos de [N minutos]…»  → persona + reloj detrás y cifra roja (extras)
    { a: S.gancho, video: 'completo' },
    // «…te voy a enseñar [tu promesa]…»  → cortina negra arriba con el título; palabra roja gigante detrás (extra)
    { a: S.gancho + 1.4, video: 'bajo', pieza: 'cortina', textos: [['CAMBIA: TU PROMESA', S.gancho + 1.4], { t: 'en un renglón', a: S.gancho + 2.4, chico: true }] },
    // «…a [N] clientes nuevos…»  → multitud que se va llenando, con cuenta
    { a: S.gancho + 3.8, video: 'oculto', pieza: 'figuras', modo: 'multitud', fondo: 'rejilla', n: 24, texto: '{n} CAMBIA' },
    // «…que [1], que [2] y [remate]»  → título en escalera, cada golpe más grande
    { a: S.gancho + 5.8, video: 'completo', pieza: 'escalera', golpes: [['CAMBIA: PARTE 1', S.gancho + 5.8], ['{n:TU PARTE 2}', S.gancho + 6.7], ['Y EL\n{v:REMATE}', S.gancho + 7.6]] },
    // «Todo esto gracias a [tu método]»  → vuelve la persona con OTRO encuadre + destello + frase al pecho (extras)
    { a: S.gancho + 8.9, video: 'cerrado' },

    // ═════════ 2 · PRESENTACIÓN Y AUTORIDAD (12–25 s) ═════════
    // «Soy [tu nombre]…»  → presentación con el nombre
    { a: S.presentacion, video: 'retrato', pieza: 'presentacion', nombre: 'TU NOMBRE' },
    // «…[credencial 1], [credencial 2]…»  → 3 tomas de apoyo cortas y distintas, con rótulos amarillos (extras)
    { a: S.presentacion + 1.6, video: 'oculto', pieza: 'clip', imagen: toma(1) },
    { a: S.presentacion + 2.6, video: 'oculto', pieza: 'clip', imagen: toma(2) },
    { a: S.presentacion + 3.6, video: 'oculto', pieza: 'clip', imagen: toma(3) },
    // «Esto se lo he enseñado a [a cuántos]»  → persona corrida a la derecha + apoyo lateral (extra)
    { a: S.presentacion + 4.6, video: 'cerradoDer' },
    // «…[tus clientes o alumnos]»  → tarjetas de fotos en 3D y luego en anillo
    { a: S.presentacion + 7.2, video: 'oculto', pieza: 'carrusel', fotos: FOTOS, texto: 'CAMBIA:\nTUS\nCLIENTES' },
    { a: S.presentacion + 9.0, video: 'oculto', pieza: 'carrusel', modo: 'anillo', fotos: FOTOS, texto: 'TU REMATE' },
    // «…para que cuando te vean no te puedan ignorar»  → persona acercándose lento + texto por golpes (extra)
    { a: S.presentacion + 10.6, video: 'lento' },

    // ═════════ 3 · DOLOR Y CREENCIA FALSA (25–47 s) ═════════
    // «Te dijeron que [la creencia]. Mentira.»  → acercamiento de golpe + palabra de letras separadas detrás (extra)
    { a: S.dolor, video: 'cerrado' },
    // «Hoy dependes de [1], de [2], de [3]»  → lista a un lado de la cara (extra)
    { a: S.dolor + 1.6, video: 'cerradoDer' },
    // frase de paso («y déjame decirte algo»)  → persona limpia, 2 a 4 s, sin texto
    { a: S.dolor + 5.2, video: 'completo' },
    // «[tu dolor en 2 palabras]»  → título rojo gigante sobre muro de ladrillo
    { a: S.dolor + 7.4, video: 'oculto', pieza: 'gigante', fondo: 'ladrillo', texto: 'TU\nDOLOR', color: 'rojo', donde: 'centro' },
    // «Y eso [lo que provoca]»  → persona al otro lado + apoyo lateral a la derecha (extra)
    { a: S.dolor + 9.4, video: 'cerradoIzq' },
    // «No es [creencia 1], no es [creencia 2]»  → sello NO detrás + dos frases, la segunda tachada (extras)
    { a: S.dolor + 12.2, video: 'cerradoDer' },
    // «El problema es [el verdadero problema]»  → ícono de línea que se dibuja
    { a: S.dolor + 15.2, video: 'oculto', pieza: 'icono', icono: 'candado', texto: 'CAMBIA: el verdadero problema' },
    // la frase más fuerte del dolor  → primerísimo plano, 1 a 2 s, sin texto al pecho
    { a: S.dolor + 17.8, video: 'muyCerrado' },
    // «…y por eso [consecuencia]»  → persona + texto por golpes (extra)
    { a: S.dolor + 19.2, video: 'lento' },

    // ═════════ 4 · GIRO Y SOLUCIÓN (47–74 s) ═════════
    // «Hay una forma más [1], más [2], más [3]»  → palabras gigantes encadenadas detrás (extra)
    { a: S.solucion, video: 'lento' },
    // «Lo probamos con [casos]»  → fotos enmarcadas que caen una sobre otra
    { a: S.solucion + 3.4, video: 'oculto', pieza: 'apiladas', fotos: [[toma(1), S.solucion + 3.4], [toma(2), S.solucion + 4.5], [toma(3), S.solucion + 5.6]] },
    // «…y quitamos lo que no servía»  → persona + frase palabra por palabra (extra)
    { a: S.solucion + 6.9, video: 'cerrado' },
    // «Se llama [nombre del programa]»  → logo a pantalla completa (cada vez que se nombra el programa)
    { a: S.solucion + 9.8, video: 'oculto', pieza: 'logo', imagen: 'img/logo.svg' },
    // «[tu método] hace [qué] por ti»  → palabra gigante detrás + frase al pecho (extras)
    { a: S.solucion + 11.4, video: 'completo' },
    // «Si a [esto] le sumas [aquello], es igual a [resultado]»  → signo igual
    { a: S.solucion + 14.6, video: 'oculto', pieza: 'igual', uno: 'CAMBIA: esto', dos: 'tu resultado', aIgual: S.solucion + 15.6, aDos: S.solucion + 16.3 },
    // «Mira, así se ve por dentro»  → captura con la persona en ventanita
    { a: S.solucion + 17.6, video: 'ventanita', videoEncima: true, pieza: 'captura', imagen: 'img/captura.svg', mira: [.55, .5] },
    // «…y cada vez más [clientes] te encuentran»  → figuras que se acumulan junto a la persona + golpes (extras)
    { a: S.solucion + 21.0, video: 'cerradoDer' },
    // «…de forma [1], [2] y [remate]»  → título en escalera sobre la persona desenfocada
    { a: S.solucion + 24.0, video: 'completo', pieza: 'escalera', golpes: [['CAMBIA: REMATE 1', S.solucion + 24.0], ['{n:REMATE 2}', S.solucion + 24.9], ['Y EL\n{v:REMATE 3}', S.solucion + 25.8]] },

    // ═════════ 5 · EL SISTEMA EN 3 PASOS (74–110 s): 12 s por paso; repite el patrón si tu sistema tiene más ═════════
    // ── paso 1 ──
    // «Lo primero es [paso 1]»  → persona a la derecha + apoyo lateral (extra)
    { a: S.sistema, video: 'cerradoDer' },
    // «…[nombre del paso 1]»  → toma de apoyo con el nombre del paso encima
    { a: S.sistema + 2.6, video: 'oculto', pieza: 'clip', imagen: toma(1), texto: 'CAMBIA: PASO 1' },
    // «…eso que hoy [haces a mano]»  → dos íconos que se dibujan, con su frase
    { a: S.sistema + 4.6, video: 'oculto', pieza: 'icono', iconos: [['caja', S.sistema + 4.6], ['mensajes', S.sistema + 6.0]], texto: 'CAMBIA: qué se hace en el paso 1' },
    // «…y con eso [beneficio del paso 1]»  → persona + destello + frase al pecho (extras)
    { a: S.sistema + 8.0, video: 'cerrado' },
    // frase de paso  → persona limpia
    { a: S.sistema + 10.6, video: 'completo' },
    // ── paso 2 ──
    // «Lo segundo es [paso 2]»  → apoyo lateral (extra)
    { a: S.sistema + 12.0, video: 'cerradoDer' },
    // «…[tu audiencia, tu evento]»  → toma de apoyo + rótulo crema encima (extra)
    { a: S.sistema + 14.6, video: 'oculto', pieza: 'clip', imagen: toma(2) },
    // «…ya estamos en [N] [ciudades, países, tiendas]»  → tres columnas con la cifra que las cruza
    { a: S.sistema + 16.6, video: 'columna', pieza: 'columnas', izq: [toma(1), toma(3)], der: [toma(2), toma(1)], cifra: 'N', texto: 'CAMBIA', rotulos: ['CAMBIA 1', 'CAMBIA 2'], aRotulos: S.sistema + 17.8 },
    // «…[beneficio del paso 2]»  → persona + palabra gigante detrás (extra)
    { a: S.sistema + 20.0, video: 'lento' },
    // ── paso 3 ──
    // «Y lo tercero es [paso 3]»  → persona al otro lado + apoyo lateral a la derecha (extra)
    { a: S.sistema + 24.0, video: 'cerradoIzq' },
    // «…[cobrar, entregar, medir]»  → persona a la derecha + ícono de apoyo a su lado, detrás (extra)
    { a: S.sistema + 26.6, video: 'cerradoDer' },
    // «…con [N] clientes al mes»  → multitud con cuenta
    { a: S.sistema + 29.6, video: 'oculto', pieza: 'figuras', modo: 'multitud', fondo: 'rejilla', n: 18, texto: '{n} CAMBIA' },
    // «Esos son los 3 pasos: [1], [2] y [3]»  → persona + lista lateral (extra)
    { a: S.sistema + 32.0, video: 'cerradoDer' },

    // ═════════ 6 · PROPÓSITO (110–132 s): más persona; tramos limpios de 2 a 4 s entre textos ═════════
    // «Yo hago esto porque [tu razón]»  → persona limpia, acercándose lento
    { a: S.proposito, video: 'lento' },
    // «…porque [tu razón en 2 palabras]»  → palabra gigante detrás + frase al pecho (extras)
    { a: S.proposito + 3.0, video: 'cerrado' },
    // «He visto a [personas] [lograr algo]»  → ráfaga de 3 tomas de apoyo de menos de 1.6 s cada una
    { a: S.proposito + 6.6, video: 'oculto', pieza: 'clip', imagen: toma(3) },
    { a: S.proposito + 7.8, video: 'oculto', pieza: 'clip', imagen: toma(1) },
    { a: S.proposito + 9.0, video: 'oculto', pieza: 'clip', imagen: toma(2) },
    // «…y eso [lo que cambia]»  → persona + texto por golpes arriba (extra)
    { a: S.proposito + 10.2, video: 'bajo' },
    // frase de paso  → persona limpia
    { a: S.proposito + 14.0, video: 'completo' },
    // «Imagina [tu vida con el resultado]»  → ícono + frase sobre fondo crema
    { a: S.proposito + 16.4, video: 'oculto', pieza: 'icono', fondo: 'crema', icono: 'cohete', texto: 'CAMBIA: la vida con el resultado' },
    // «…eso es lo que quiero para ti»  → persona + frase con el «tú» en naranja (extra)
    { a: S.proposito + 19.0, video: 'cerradoLento' },

    // ═════════ 7 · CASO DE ÉXITO (132–145 s) ═════════
    // «Te cuento de [un cliente]»  → toma o foto del cliente + rótulo con su nombre (extra)
    { a: S.caso, video: 'oculto', pieza: 'clip', imagen: toma(2) },
    { a: S.caso + 1.4, video: 'oculto', pieza: 'clip', imagen: toma(3) },
    // «Empezó [desde dónde] y hoy [su resultado]»  → captura de su resultado, con la persona en ventanita
    { a: S.caso + 2.8, video: 'ventanitaChica', videoEncima: true, pieza: 'captura', imagen: 'img/captura.svg', mira: [.3, .4] },
    // «…como él hay [cuántos] más»  → pared de fotos con texto
    { a: S.caso + 6.2, video: 'oculto', pieza: 'mosaico', fotos: FOTOS, texto: 'CAMBIA:\nTUS CASOS' },
    // «…y su vida cambió para siempre»  → palabra gigante detrás + frase al pecho (extras)
    { a: S.caso + 8.4, video: 'completo' },

    // ═════════ 8 · QUÉ ES Y QUÉ NO ES (145–159 s): desde aquí, marca de agua del logo detrás de la persona ═════════
    // «Esto no es [1], no es [2]»  → dos frases al pecho, la segunda tachada (extra). Aquí sin sello: ya está la marca de agua detrás
    { a: S.quees, video: 'cerradoDer' },
    // «Es [qué sí es]»  → palabras gigantes encadenadas, la última en verde (extra)
    { a: S.quees + 3.6, video: 'lento' },
    // «Incluye [1], [2] y [3]»  → lista lateral (extra)
    { a: S.quees + 7.2, video: 'cerradoDer' },
    // «…en [formato: en línea, presencial, N semanas]»  → toma de apoyo con texto
    { a: S.quees + 11.4, video: 'oculto', pieza: 'clip', imagen: toma(1), texto: 'CAMBIA: EL FORMATO' },

    // ═════════ 9 · LLAMADO A LA ACCIÓN (159–180 s): el único tramo limpio largo (hasta 15 s) ═════════
    // «[nombre del programa]»  → logo a pantalla completa
    { a: S.llamado, video: 'oculto', pieza: 'logo', imagen: 'img/logo.svg' },
    // «Regístrate aquí abajo»  → llamado amarillo con flechas verdes
    { a: S.llamado + 1.6, video: 'completo', pieza: 'cta', texto: 'CAMBIA: TU ACCIÓN\nAQUÍ ABAJO' },
    // el cierre mirando a cámara  → persona + rótulo inferior con flechas (extra)
    { a: S.llamado + 5.0, video: 'lento' },
    // la despedida  → corte al plano normal
    { a: S.llamado + 16.0, video: 'completo' },
  ],

  extras: [
    // ── 1 · GANCHO ──
    { a: S.gancho, b: S.gancho + 1.4, pieza: 'reloj', detras: true },                                            // «En menos de…»
    { a: S.gancho + 0.05, b: S.gancho + 1.4, pieza: 'conteo', chico: 'En menos de', fuerte: 'N minutos', aFuerte: S.gancho + 0.45 },   // CAMBIA: tu cifra
    { a: S.gancho + 2.4, b: S.gancho + 3.8, pieza: 'gigante', detras: true, texto: 'CAMBIA', color: 'rojo', y: 250 },   // la palabra fuerte de la promesa
    { a: S.gancho + 3.6, b: S.gancho + 3.8, pieza: 'entrada' },                                                   // ensucia la toma para entrar al inserto
    { a: S.gancho + 8.9, b: S.gancho + 9.4, pieza: 'destello' },                                                  // al volver a la persona
    { a: S.gancho + 9.0, b: S.gancho + 12.0, pieza: 'frase', frases: [['CAMBIA: todo esto', S.gancho + 9.0], ['gracias a {v:tu método}', S.gancho + 10.2]] },
    { a: S.gancho + 10.9, b: S.gancho + 12.0, pieza: 'gigante', detras: true, texto: 'TU PALABRA', color: 'verde' },

    // ── 2 · PRESENTACIÓN Y AUTORIDAD ──
    { a: S.presentacion + 1.65, b: S.presentacion + 2.6, pieza: 'rotulo', texto: 'CAMBIA:' },                      // «[credencial 1]»
    { a: S.presentacion + 2.6, b: S.presentacion + 3.6, pieza: 'rotulo', texto: 'TU\nCREDENCIAL', donde: 'abajo' },   // «[credencial 2]»
    { a: S.presentacion + 3.6, b: S.presentacion + 4.6, pieza: 'rotulo', texto: 'TU LUGAR', donde: 'izq' },         // «[lugar o medio]»
    { a: S.presentacion + 4.6, b: S.presentacion + 5.1, pieza: 'destello' },
    { a: S.presentacion + 4.7, b: S.presentacion + 7.2, pieza: 'lateral', chico: 'CAMBIA: esto a', fuerte: 'TUS CLIENTES' },
    { a: S.presentacion + 10.6, b: S.presentacion + 11.1, pieza: 'destello' },
    { a: S.presentacion + 10.8, b: S.presentacion + 13.0, pieza: 'golpes', golpes: [['CAMBIA: frase', S.presentacion + 10.8], ['dicha por', S.presentacion + 11.4], ['{r:golpes}', S.presentacion + 12.0]] },

    // ── 3 · DOLOR Y CREENCIA FALSA ──
    { a: S.dolor + 0.1, b: S.dolor + 1.6, pieza: 'separadas', detras: true, texto: 'CAMBIA' },                     // «Mentira» / «Falso»
    { a: S.dolor + 1.7, b: S.dolor + 5.2, pieza: 'lista', items: [['CAMBIA: de esto', S.dolor + 1.7], ['de tu dolor 2', S.dolor + 2.7], ['de tu dolor 3', S.dolor + 3.7]] },
    { a: S.dolor + 9.4, b: S.dolor + 9.9, pieza: 'destello' },
    { a: S.dolor + 9.5, b: S.dolor + 12.2, pieza: 'lateral', lado: 'der', chico: 'CAMBIA: y eso', fuerte: 'TE CUESTA' },
    { a: S.dolor + 12.2, b: S.dolor + 15.2, pieza: 'sello', detras: true, texto: 'NO' },
    { a: S.dolor + 12.3, b: S.dolor + 15.2, pieza: 'frase', frases: [['No es CAMBIA', S.dolor + 12.3], { t: 'No es {x:tu creencia}', a: S.dolor + 13.6, abajo: true }] },
    { a: S.dolor + 15.0, b: S.dolor + 15.2, pieza: 'entrada' },
    { a: S.dolor + 17.8, b: S.dolor + 18.3, pieza: 'destello' },
    { a: S.dolor + 19.4, b: S.dolor + 22.0, pieza: 'golpes', golpes: [['CAMBIA: y por eso', S.dolor + 19.4], ['tu consecuencia', S.dolor + 20.2], ['{r:en rojo}', S.dolor + 21.0]] },

    // ── 4 · GIRO Y SOLUCIÓN ──
    { a: S.solucion, b: S.solucion + 3.4, pieza: 'gigante', detras: true, palabras: [['MÁS', S.solucion], ['CAMBIA', S.solucion + 0.5], ['MÁS TU 2', S.solucion + 1.3], ['{v:MÁS TU 3}', S.solucion + 2.2]] },
    { a: S.solucion + 6.9, b: S.solucion + 7.4, pieza: 'destello' },
    { a: S.solucion + 7.0, b: S.solucion + 9.8, pieza: 'frase', modo: 'palabras', texto: 'CAMBIA: quitamos lo que {r:no servía}' },
    { a: S.solucion + 11.4, b: S.solucion + 11.9, pieza: 'destello' },
    { a: S.solucion + 11.5, b: S.solucion + 14.6, pieza: 'gigante', detras: true, texto: 'TU MÉTODO' },
    { a: S.solucion + 12.3, b: S.solucion + 14.6, pieza: 'frase', texto: 'CAMBIA: qué hace por {n:ti}' },
    { a: S.solucion + 21.0, b: S.solucion + 24.0, pieza: 'figuras', detras: true, n: 9 },
    { a: S.solucion + 21.2, b: S.solucion + 24.0, pieza: 'golpes', golpes: [['CAMBIA: cada vez', S.solucion + 21.2], ['más clientes', S.solucion + 22.0], ['{v:te encuentran}', S.solucion + 22.8]] },

    // ── 5 · EL SISTEMA EN 3 PASOS ──
    { a: S.sistema + 0.1, b: S.sistema + 2.6, pieza: 'lateral', chico: 'Lo primero es:', fuerte: 'CAMBIA: PASO 1' },
    { a: S.sistema + 2.4, b: S.sistema + 2.6, pieza: 'entrada' },
    { a: S.sistema + 8.0, b: S.sistema + 8.5, pieza: 'destello' },
    { a: S.sistema + 8.1, b: S.sistema + 10.6, pieza: 'frase', frases: [['CAMBIA: y con eso', S.sistema + 8.1], ['{v:tu beneficio 1}', S.sistema + 9.2]] },
    { a: S.sistema + 12.1, b: S.sistema + 14.6, pieza: 'lateral', chico: 'Lo segundo es:', fuerte: 'CAMBIA: PASO 2' },
    { a: S.sistema + 14.9, b: S.sistema + 16.6, pieza: 'rotulo', texto: 'CAMBIA', color: 'crema' },
    { a: S.sistema + 20.0, b: S.sistema + 20.5, pieza: 'destello' },
    { a: S.sistema + 20.2, b: S.sistema + 22.4, pieza: 'gigante', detras: true, texto: 'TU PASO 2', color: 'verde' },
    { a: S.sistema + 24.1, b: S.sistema + 26.6, pieza: 'lateral', lado: 'der', chico: 'Y lo tercero es:', fuerte: 'CAMBIA: PASO 3' },
    { a: S.sistema + 26.7, b: S.sistema + 29.6, pieza: 'icono', fondo: 'ninguno', detras: true, icono: 'billete', x: 420, y: 470, tam: 360 },
    { a: S.sistema + 29.4, b: S.sistema + 29.6, pieza: 'entrada' },
    { a: S.sistema + 32.0, b: S.sistema + 32.5, pieza: 'destello' },
    { a: S.sistema + 32.1, b: S.sistema + 36.0, pieza: 'lista', items: [['CAMBIA: paso 1', S.sistema + 32.1], ['tu paso 2', S.sistema + 33.1], ['tu paso 3', S.sistema + 34.1]] },

    // ── 6 · PROPÓSITO ──
    { a: S.proposito + 3.0, b: S.proposito + 6.6, pieza: 'gigante', detras: true, texto: 'TU RAZÓN' },
    { a: S.proposito + 3.8, b: S.proposito + 6.6, pieza: 'frase', texto: 'CAMBIA: en una {n:frase}' },
    // un rótulo que ATRAVIESA varios clips lleva z: 5; sin eso, el clip siguiente lo tapa
    { a: S.proposito + 6.7, b: S.proposito + 10.2, pieza: 'rotulo', z: 5, rotulos: [['CAMBIA:', S.proposito + 6.7], ['TU GENTE', S.proposito + 7.8], ['SU LOGRO', S.proposito + 9.0]], color: 'crema' },
    { a: S.proposito + 10.2, b: S.proposito + 10.7, pieza: 'destello' },
    { a: S.proposito + 10.4, b: S.proposito + 14.0, pieza: 'golpes', donde: 'arriba', golpes: [['CAMBIA', S.proposito + 10.4], ['LO QUE', S.proposito + 11.2], ['{n:CAMBIA}', S.proposito + 12.0]] },
    { a: S.proposito + 19.0, b: S.proposito + 19.5, pieza: 'enfoca' },
    { a: S.proposito + 19.3, b: S.proposito + 22.0, pieza: 'frase', texto: 'CAMBIA: lo que quiero {n:para ti}' },

    // ── 7 · CASO DE ÉXITO ──
    { a: S.caso + 0.1, b: S.caso + 1.4, pieza: 'rotulo', texto: 'NOMBRE\nDEL CLIENTE' },
    { a: S.caso + 1.4, b: S.caso + 2.8, pieza: 'rotulo', texto: 'CAMBIA:\nSU RESULTADO', donde: 'abajo' },
    { a: S.caso + 8.4, b: S.caso + 8.9, pieza: 'destello' },
    { a: S.caso + 8.5, b: S.caso + 13.0, pieza: 'gigante', detras: true, texto: 'TU VIDA' },
    { a: S.caso + 9.3, b: S.caso + 13.0, pieza: 'frase', texto: 'CAMBIA: cambia para {n:siempre}' },

    // ── 8 · QUÉ ES Y QUÉ NO ES ──
    { a: S.quees, b: 180, pieza: 'marca', detras: true, imagen: 'img/logo.svg' },                                  // marca de agua: último 20 % del video
    { a: S.quees + 0.1, b: S.quees + 3.6, pieza: 'frase', frases: [['No es CAMBIA', S.quees + 0.1], { t: 'No es {x:lo que crees}', a: S.quees + 1.6, abajo: true }] },
    { a: S.quees + 3.6, b: S.quees + 7.2, pieza: 'gigante', detras: true, palabras: [['ES', S.quees + 3.6], ['CAMBIA', S.quees + 4.2], ['TU 2', S.quees + 5.1], ['{v:TU 3}', S.quees + 6.0]] },
    { a: S.quees + 7.2, b: S.quees + 7.7, pieza: 'destello' },
    { a: S.quees + 7.3, b: S.quees + 11.4, pieza: 'lista', items: [['CAMBIA: incluye 1', S.quees + 7.3], ['incluye 2', S.quees + 8.5], ['incluye 3', S.quees + 9.7]] },

    // ── 9 · LLAMADO A LA ACCIÓN ──
    { a: S.llamado + 5.0, b: S.llamado + 5.5, pieza: 'destello' },
    { a: S.llamado + 5.5, b: S.llamado + 11.0, pieza: 'llamado', texto: 'CAMBIA: TU ACCIÓN AQUÍ ABAJO' },
  ],
};
