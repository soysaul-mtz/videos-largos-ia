# Plantilla larga 2 · Cinético

## Ficha rápida

- **Para qué sirve:** video de venta de un experto a cámara: una promesa, un método en pasos y un llamado a registrarse, con las palabras clave en texto animado sobre la persona.
- **Duración ideal:** de 5 a 10 minutos (horizontal 16:9, 1080p, 30 cuadros por segundo).
- **Material:** video a cámara sobre fondo liso, nombre y credenciales, logo, 25 a 30 tomas de apoyo por cada 3 minutos, 8 o más fotos, 1 a 2 capturas, las cifras reales, los 3 pasos y un caso de éxito. La lista completa, con cantidades, está en `ESCALETA-BASE.md`.
- **Tiempo de edición:** 3 a 4 horas por cada 3 minutos de video, con el material completo (estimado).
- **Cómo pedirla:** «Edita este video con la plantilla Cinético: /ruta/a/mi-video.mp4».
- **Archivos de la plantilla:** `ESTILO.md` (esta guía: el look y las piezas) · `ESCALETA-BASE.md` (la estructura por secciones, el material y el guion-molde) · `plantilla.json` (ficha de datos para el menú) · `base/` (proyecto en blanco por secciones; se copia con `scripts/nuevo.sh cinetico "<nombre>" <video.mp4>`) · `estilo.js` y `estilo.css` (el código) · `iconos/` · demo en `proyectos/demo-cinetico/`.
- **Cómo se ve:** `node motor/render.mjs proyectos/demo-cinetico --fotos 2.9,4.9,10,15.8,35,38.5` y abre `proyectos/demo-cinetico/fotos/hoja.jpg`. Las fotos de la demo son la vara para comparar tu video.

Video horizontal (1920×1080) de una persona a cámara, con **texto gigante que pasa detrás de su cabeza**, frases que
entran enormes y se achican al pecho, insertos sobre negro con una cuadrícula de rompecabezas y una barra roja de avance.
Sirve para videos de venta de 5 a 10 minutos de un experto a cámara.

Este documento tiene dos partes: **cómo usar el estilo** (lo que necesitas para escribir un `beats.js`) y, después,
**medidas y tiempos de la plantilla** (la especificación de tamaños, colores y tiempos).

---

# Cómo usar este estilo

## 1. Antes de empezar

`proyecto.json` del video:

```json
{ "nombre": "Mi VSL", "plantilla": "cinetico", "fuente": "corte.mp4", "fps": 30,
  "foco": [0.5, 0.30], "cara": [0.16, 0.30] }
```

| Campo | Qué es |
|---|---|
| `foco` | Centro de la cara en el video (0–1 de ancho y de alto). **Mídelo en una foto del video**: de él dependen los acercamientos y que el texto no tape la cara. |
| `cara` | Ancho y alto de la cara (de frente a barbilla, de oreja a oreja) como fracción del cuadro. Si falta: `[0.16, 0.32]`. |
| `barra` | Opcional. Si falta, la barra roja usa la curva de la plantilla (llega a la mitad muy pronto). Otras: `"lineal"`, `{ "puntos": [[42, 0.5], [60, 0.585]] }` (segundo → fracción del ancho) o `false` (sin barra). |

- Corre `preparar.py` **con `--mascaras`**: sin la silueta de la persona el texto no puede pasar por detrás.
- Videos de apoyo (eventos, clips comprados, grabaciones de pantalla): `python motor/pantalla.py <video> proyectos/<n> <nombre>` y úsalos con la pieza `clip` (`pantalla: '<nombre>'`).
- Logo e imágenes: en `proyectos/<n>/img/` y se piden como `'img/logo.png'`.
- El proyecto en blanco, ya ordenado por secciones, es `plantillas/cinetico/base/` (lo copia `scripts/nuevo.sh`). La demo con todas las piezas es `proyectos/demo-cinetico/beats.js`.

## 2. Dónde va cada texto: detrás, delante o en inserto

Primero decide **qué palabras** salen: el texto repite literalmente lo que se dice, pero solo las 2 a 6 palabras que
cargan el sentido. Las frases de paso («para ponerte en contexto», «déjame decirte») van limpias, sin texto.

| Lo que se dice | Dónde va | Pieza |
|---|---|---|
| Una o dos palabras fuertes (un adjetivo, un sustantivo, una cifra) | Gigante, arriba y **DETRÁS** de la cabeza | `gigante` con `detras: true` |
| Una frase corta de 2 a 6 palabras | En minúsculas, al pecho, **DELANTE** | `frase` |
| Una frase larga que se dice de corrido | Por golpes al pecho (un grupo por golpe) | `golpes` |
| Dos partes («tu vida» + «cambia para siempre») | La primera arriba detrás, la segunda al pecho delante | `gigante` + `frase` |
| Una sola palabra de negación («mentira», «falso») | Letras separadas a la altura de los ojos, **DETRÁS** | `separadas` con `detras: true` |
| Una enumeración de cosas («de tus pies, de tus manos…») | Lista a un lado de la cara | `lista` + `video: 'cerradoDer'` |
| Una enumeración de adjetivos («más sencilla, más fácil…») | Palabras gigantes encadenadas, detrás | `gigante` con `palabras` |
| «Lo primero es:», «Esto a miles de personas» | Apoyo a un lado de la cara | `lateral` + `video: 'cerradoDer'` |
| Una credencial, un nombre propio, un lugar | Rótulo de máquina de escribir sobre una toma de apoyo | `clip` + `rotulo` |
| El remate de una terna («…de forma automática») | **Inserto**: título itálico en escalera | `escalera` |
| Una equivalencia («esto es igual a…») | **Inserto**: signo «=» | `igual` |
| Un sustantivo concreto («ese producto», «tus mensajes») | **Inserto**: ícono de línea | `icono` |
| «Muchas personas», «clientes», «audiencia» | **Inserto** o apoyo lateral: figuras | `figuras` |
| El nombre del programa o de la marca | **Inserto**: logo, 1 a 5 s | `logo` |

Regla rápida: **arriba y de 200 px o más → detrás. Del pecho para abajo y a los lados → delante. Una idea que necesita
imagen propia o un remate fuerte → inserto a pantalla completa.**

## 3. Los colores y lo que significan

| Color | Nombre | Corto | Se usa para |
|---|---|---|---|
| Crema `#f1e9d2` | `crema` | `c` | Todo lo neutro (8 de cada 10 textos) |
| Rojo `#cb0000` | `rojo` | `r` | Dolor, negación, la cifra del gancho |
| Verde `#15fe09` | `verde` | `v` | Beneficio, facilidad, dinero |
| Naranja `#f1a400` | `naranja` | `n` | El «tú» y el remate emocional |
| Amarillo `#fee41d` | `amarillo` | `a` | Credenciales y llamados a la acción |
| Blanco | `blanco` | `b` | Itálicas sobre fondo gris u oscuro |

- Toda la pieza de un color: `color: 'rojo'`.
- Solo unas palabras: dentro del texto, `'gracias a un {v:sistema}'` o `'{rojo:no} vas a crecer'`.
- Palabra tachada con raya roja: `'no es {x:suerte}'`.
- **Como mucho una palabra o un renglón en color por pieza.** El resto, crema.

## 4. Los tiempos

- `a` y `b` son segundos del video. **Los extras siempre llevan `a` y `b`.**
- Las listas de palabras aceptan tres formas:
  `'uno | dos | tres'` (se reparten parejo) · `[['uno', 12.4], ['dos', 13.1]]` · `[{ t: 'uno', a: 12.4, color: 'rojo' }]`.
- El segundo de cada palabra es **el del video** (el mismo reloj de `palabras.json`): se copia tal cual. El texto entra en
  el cuadro en que empieza a decirse la palabra.
- Renglón nuevo dentro de un texto: `\n`.

## 5. Encuadres (campo `video` del beat)

La cámara **cambia solo por corte**. Si quieres que la persona viaje, pon `tr: 0.3` en ese beat.

| `video` | Qué hace |
|---|---|
| `'completo'` | Plano medio, tal como se grabó |
| `'lento'` | Plano medio que se acerca despacio (de 1.00 a 1.06) mientras dura el beat |
| `'cerrado'` | Acercamiento de golpe ×1.4, anclado a la cara (énfasis, negaciones) |
| `'cerradoLento'` | Cerrado que sigue acercándose (de 1.40 a 1.48) |
| `'cerradoDer'` | Cerrado con la persona corrida a la derecha: **deja libre la izquierda** para `lateral`, `lista`, `figuras`, `sello` |
| `'cerradoIzq'` | Lo mismo al otro lado |
| `'muyCerrado'` | Primerísimo plano ×1.9 (1 a 2 s, no más) |
| `'bajo'` | La persona más abajo: deja libre la franja de arriba (para `cortina`) |
| `'columna'` | La persona al centro de tres columnas (para `columnas`) |
| `'retrato'` | La persona en un óvalo a la izquierda (para `presentacion`) |
| `'ventanita'`, `'ventanitaChica'` | Ventanita arriba a la derecha (para `captura`, con `videoEncima: true`) |
| `'oculto'` | No se ve la persona (insertos a pantalla completa) |

Cada vez que vuelves a la persona después de un inserto, usa un encuadre **distinto** del último que se vio.

## 6. Piezas

Las de la sección A van casi siempre en `extras` (encima de la persona, sin cambiar el encuadre). Las de la B van en
`beats` con `video: 'oculto'`. Cualquier pieza acepta `fondo` (sección 7), `y`, `tam` y `color`.

### A · Texto sobre la persona

| Pieza | Para qué | Campos |
|---|---|---|
| `gigante` | Palabra gigante detrás de la cabeza | `texto` o `palabras` (encadenadas), `color`, `y` (borde de arriba de las letras: 130), `sombra`, `entrada`/`salida`: `'corte'` \| `'fundido'`, `donde`: `'arriba'` \| `'centro'` |
| `frase` | Frase que entra enorme y se achica al pecho | `texto` o `frases` (relevo: la vieja se va a la izquierda y la nueva se escribe), `modo`: `'zoom'` \| `'palabras'` \| `'tecleo'`, `abajo: true` en una frase |
| `golpes` | Texto por golpes | `golpes`, `donde`: `'pecho'` \| `'arriba'` \| `'centro'` \| `'abajo'`, `mayus` |
| `lateral` | Apoyo a un lado de la cara | `chico`, `fuerte` (o `lineas`), `lado`, `tecleo` |
| `lista` | Lista lateral que se acumula | `items`, `lado` |
| `rotulo` | Rótulo amarillo de máquina de escribir | `texto` o `rotulos`, `donde`: `'centro'` \| `'abajo'` \| `'izq'` \| `'der'`, `color`, `cursor` |
| `separadas` | Palabra de letras separadas que se juntan | `texto`, `color` (rojo), `separa` |
| `reloj` | Reloj de rayas detrás de la persona | `x`, `y`, `radio` |
| `conteo` | «En menos de» + «7 minutos» | `chico`, `fuerte`, `aFuerte`, `color` |
| `sello` | Sello «NO» de puntos, detrás | `texto`, `x`, `y`, `diam` |
| `llamado` | Rótulo inferior con flechas | `texto`, `y` |
| `marca` | Marca de agua (logo detrás de la persona) | `imagen`, `opacidad` |

```js
// palabra gigante detrás de la cabeza
{ a: 4.6, b: 6.4, pieza: 'gigante', detras: true, texto: 'UNA OFERTA', color: 'rojo' }
// palabras gigantes encadenadas (cada una entra por corte en su segundo)
{ a: 99.1, b: 102.5, pieza: 'gigante', detras: true, palabras: [['MÁS', 99.1], ['SENCILLA', 99.45], ['MÁS FÁCIL', 100.3], ['{v:MÁS EFECTIVA}', 101.3]] }
// frase al pecho con relevo
{ a: 13.2, b: 16.3, pieza: 'frase', frases: [['todo esto', 13.2], ['gracias a un {v:sistema}', 14.1]] }
// frase palabra por palabra
{ a: 114.8, b: 117.2, pieza: 'frase', modo: 'palabras', texto: 'quitamos lo que {r:no servía}' }
// texto por golpes al pecho
{ a: 27.5, b: 29.2, pieza: 'golpes', golpes: [['cuando te vean', 27.5], ['no te puedan', 28.1], ['{r:ignorar}', 28.6]] }
// apoyo lateral (en el beat: video: 'cerradoDer')
{ a: 28.4, b: 30.4, pieza: 'lateral', chico: 'Esto a', fuerte: 'MILES DE NEGOCIOS' }
// lista lateral (en el beat: video: 'cerradoDer')
{ a: 53.3, b: 56.7, pieza: 'lista', items: [['de tus referidos', 53.3], ['de la suerte', 54.2], ['de tu tiempo', 55.1]] }
// rótulo de credencial, encima de un clip
{ a: 20.0, b: 20.8, pieza: 'rotulo', texto: 'CONSULTORA' }
{ a: 20.8, b: 22.1, pieza: 'rotulo', texto: 'AUTORA\nBEST SELLER', donde: 'abajo' }
// negación fuerte, detrás, con acercamiento (en el beat: video: 'cerrado')
{ a: 46.2, b: 47.6, pieza: 'separadas', detras: true, texto: 'MENTIRA' }
// promesa con cifra: dos extras, el reloj detrás y el texto delante
{ a: 0, b: 1.3, pieza: 'reloj', detras: true },
{ a: 0.05, b: 1.3, pieza: 'conteo', chico: 'En menos de', fuerte: '7 minutos', aFuerte: 0.45 }
// «no es X, no es Y»: sello detrás + frases delante (en el beat: video: 'cerradoDer')
{ a: 85.5, b: 87.6, pieza: 'sello', detras: true, texto: 'NO' },
{ a: 85.5, b: 87.6, pieza: 'frase', frases: [['No es casualidad', 85.5], { t: 'No es {x:suerte}', a: 86.5, abajo: true }] }
// llamado inferior y marca de agua del cierre
{ a: 402, b: 407.5, pieza: 'llamado', texto: 'AGENDA TU CITA AQUÍ ABAJO' },
{ a: 331, b: 413, pieza: 'marca', detras: true, imagen: 'img/logo.png' }
```

### B · Insertos a pantalla completa

| Pieza | Para qué | Campos |
|---|---|---|
| `cortina` | Cortina negra arriba con título, la persona debajo | `textos` (con `chico: true` para el renglón chico), `alto` |
| `escalera` | Título itálico gigante en escalera | `golpes` (cada uno más grande; el último puede llevar `\n` y un renglón en color) |
| `igual` | Frase → «=» → frase | `uno`, `dos`, `aIgual`, `aDos`, `colorDos` |
| `icono` | Íconos de línea que se dibujan | `icono` o `iconos`, `texto`, `tam`, `acento` |
| `figuras` | Personas que aparecen y se pintan de color | `n`, `modo`: `'multitud'` \| `'lado'`, `texto` (con `{n}`), `color`, `pintadas`, `cada` |
| `columnas` | Tres columnas con cifra que las cruza | `izq`, `der`, `cifra`, `texto`, `rotulos`, `aRotulos` |
| `presentacion` | Nombre de quien habla, fondo rojo con rayos | `nombre`, `imagen` (recorte), `imagen2` |
| `clip` | Toma de apoyo en video o foto | `pantalla` o `imagen`, `desde`, `velocidad`, `bucle`, `cabe`, `texto`, `oscurece` |
| `captura` | Captura con ventanita de la persona | `imagen` o `pantalla`, `acerca`, `mira` |
| `carrusel` | Tarjetas de foto en 3D con texto inclinado | `fotos`, `texto`, `modo: 'anillo'` |
| `mosaico` | Pared de fotos inclinada con texto | `fotos`, `texto` |
| `apiladas` | Fotos con marco crema que caen una sobre otra | `fotos` |
| `cta` | «REGÍSTRATE / AQUÍ ABAJO» con flechas verdes | `texto`, `flechas` |
| `logo` | Logo a pantalla completa | `imagen`, `fondo`, `giro` |

```js
// cortina con título; luego renglón chico + palabra roja gigante detrás (extra)
{ a: 3.5, video: 'bajo', pieza: 'cortina', textos: [['HE SIDO CAPAZ', 3.5], { t: 'de construir', a: 4.6, chico: true }] }
// título en escalera sobre la persona desenfocada (o sobre el inserto anterior: ver recetas)
{ a: 9.25, video: 'completo', pieza: 'escalera', golpes: [['QUE VENDEMOS', 9.25], ['{n:Y QUE TÚ VENDAS}', 10.75], ['DE FORMA\n{v:AUTOMÁTICA}', 11.6]] }
// un solo título de 2 renglones, uno en color
{ a: 60, video: 'oculto', pieza: 'escalera', fondo: 'rejilla', golpes: ['DE FORMA\n{v:AUTOMÁTICA}'] }
// signo igual
{ a: 156.2, video: 'oculto', pieza: 'igual', uno: 'si a esto le sumas', dos: 'el atajo definitivo', aIgual: 157.6, aDos: 158.7 }
// íconos que se dibujan
{ a: 177.6, video: 'oculto', pieza: 'icono', iconos: [['caja', 177.6], ['mensajes', 180.7]], texto: 'eso que hoy vendes uno a uno' }
// multitud a pantalla completa, con cuenta
{ a: 7.07, video: 'oculto', pieza: 'figuras', modo: 'multitud', fondo: 'rejilla', n: 28, texto: '{n} clientes nuevos' }
// figuras junto a la persona (extra; en el beat: video: 'cerradoDer')
{ a: 185.9, b: 188.4, pieza: 'figuras', detras: true, n: 9 }
// tres columnas
{ a: 218.5, video: 'columna', pieza: 'columnas', izq: ['img/a.jpg', 'img/b.jpg'], der: ['img/c.jpg'], cifra: '32', texto: 'CIUDADES', rotulos: ['MONTERREY', 'BOGOTÁ'], aRotulos: 220.5 }
// presentación con nombre
{ a: 18.4, video: 'retrato', pieza: 'presentacion', nombre: 'ANA TORRES' }
// toma de apoyo (clip de terceros o del evento)
{ a: 173, video: 'oculto', pieza: 'clip', pantalla: 'reloj-dorado', texto: 'DIGITALIZAR TU OFERTA' }
// captura con ventanita
{ a: 160.9, video: 'ventanita', videoEncima: true, pieza: 'captura', imagen: 'img/panel.png', mira: [.3, .4] }
// fotos
{ a: 31.9, video: 'oculto', pieza: 'carrusel', fotos: FOTOS, texto: 'MILLONES\nDE\nPERSONAS' }
{ a: 33.7, video: 'oculto', pieza: 'carrusel', modo: 'anillo', fotos: FOTOS, texto: 'Y AUTOMÁTICA' }
{ a: 321.7, video: 'oculto', pieza: 'mosaico', fotos: FOTOS, texto: 'MILES Y MILES\nDE CLIENTES' }
{ a: 108.2, video: 'oculto', pieza: 'apiladas', fotos: [['img/f1.jpg', 108.2], ['img/f2.jpg', 109.7], ['img/f3.jpg', 111.2]] }
// cierre
{ a: 363.7, video: 'completo', pieza: 'cta', texto: 'REGÍSTRATE\nAQUÍ ABAJO' }
{ a: 120.4, video: 'oculto', pieza: 'logo', imagen: 'img/logo.png' }
```

### C · Transiciones (extras cortos)

| Pieza | Cuándo | Ejemplo |
|---|---|---|
| `destello` | Al **volver** a la persona tras un inserto o toma de apoyo. `a` = el cuadro del corte | `{ a: 28.36, b: 28.8, pieza: 'destello' }` |
| `entrada` | Para **entrar** a un inserto negro: la cuadrícula se dibuja sobre la toma, que se desenfoca y funde a negro. Termina donde empieza el inserto | `{ a: 6.43, b: 6.63, pieza: 'entrada' }` |
| `enfoca` | Para volver de un inserto lento: la toma llega desenfocada y se enfoca | `{ a: 50.4, b: 50.9, pieza: 'enfoca' }` |

Dentro de un mismo bloque, corte seco (no pongas nada).

## 7. Fondos de inserto (`fondo`)

| `fondo` | Cómo es |
|---|---|
| `'rejilla'` | Negro con la cuadrícula de rompecabezas. **El de casi todos los insertos.** Entra brillante (65 %) y en 12 cuadros baja a su reposo (18 %) |
| `'negro'` | Negro puro |
| `'velo'` | Lo que haya detrás (la persona o el inserto anterior), desenfocado y gris |
| `'oscuro'` | Lo que haya detrás, desenfocado y oscuro |
| `'crema'` | Crema con viñeta (el texto y los íconos salen en negro) |
| `'beige'` | El color del set, sin la persona |
| `'rojo'` | Rojo muy oscuro con rayos de luz |
| `'ladrillo'` | Muro de ladrillo, de rojo a morado |
| `'naranja'` | Naranja plano |
| `'particulas'` | Estallido de partículas rojas (logos) |
| `'img/toma.jpg'` | Una imagen del proyecto, con viñeta y acercamiento lento |
| `'ninguno'` | Sin fondo: la pieza va sobre la persona |

`brillo: 0.18` deja la cuadrícula en reposo desde el primer cuadro (para insertos encadenados, que no «destellen» todos).

## 8. Íconos disponibles (`icono`)

`billete` `caja` `calendario` `candado` `carrito` `celular` `cohete` `correo` `diana` `engrane` `foco` `grafica` `laptop`
`lupa` `mano` `megafono` `mensajes` `moneda` `mundo` `palomita` `persona` `personas` `premio` `rayo` `regalo` `reloj`
`tache` `telefono` `tienda` `trato`

Son de Tabler Icons (licencia MIT; ver `iconos/ORIGEN.txt`). Para agregar otro: guarda el `.svg` de línea en `iconos/` y
corre `node plantillas/cinetico/iconos/armar.mjs`. El último trazo de cada ícono sale en rojo (`acento: false` lo quita).

## 9. Recetas

```js
// DOS RENGLONES: el primero arriba y detrás, el segundo al pecho y delante
{ a: 328, b: 330, pieza: 'gigante', detras: true, texto: 'TU VIDA' },
{ a: 328.6, b: 330, pieza: 'frase', texto: 'cambia para {n:siempre}' },

// ENTRAR A UN INSERTO Y VOLVER
{ a: 6.43, b: 6.63, pieza: 'entrada' },                       // extra: ensucia la toma
{ a: 6.63, video: 'oculto', pieza: 'figuras', modo: 'multitud', fondo: 'rejilla', n: 28 },   // beat
{ a: 13.2, video: 'cerrado' },                                // beat: vuelve con OTRO encuadre
{ a: 13.2, b: 13.6, pieza: 'destello' },                      // extra: destello crema

// DEJAR EL INSERTO ANTERIOR DE FONDO, desenfocado, bajo un título en escalera
{ a: 7.07, video: 'oculto', pieza: 'figuras', modo: 'multitud', fondo: 'rejilla', n: 28, despues: 4, sinSalida: true },
{ a: 9.25, video: 'oculto', pieza: 'escalera', golpes: 'QUE VENDEMOS | {n:Y QUE TÚ VENDAS} | DE FORMA\n{v:AUTOMÁTICA}' },

// TEXTO SOBRE UN CLIP: el clip es el beat, el texto son extras
{ a: 201.7, video: 'oculto', pieza: 'clip', pantalla: 'evento' },
{ a: 204.9, b: 206.8, pieza: 'rotulo', texto: 'AUDIENCIA', color: 'crema' },

// ÍCONO DE APOYO a un lado de la persona (extra; persona en 'cerradoDer')
{ a: 241.3, b: 244.3, pieza: 'icono', fondo: 'ninguno', detras: true, icono: 'billete', x: 420, y: 470, tam: 360 },

// UN TEXTO QUE ATRAVIESA VARIOS CLIPS: ponle z: 5 al extra; sin eso, el clip siguiente lo tapa
{ a: 201.7, b: 205.3, pieza: 'rotulo', z: 5, rotulos: [['AUDIENCIA', 201.7], ['EVENTOS', 203.5]], color: 'crema' },

// ESCONDER LA BARRA en un beat
{ a: 342, video: 'oculto', pieza: 'clip', pantalla: 'ruta', barra: false },
```

## 10. Reglas de ritmo

1. **Persona limpia (sin texto ni inserto): 20 % del video como máximo**, en tramos de 2 a 4 s. Ningún tramo limpio de
   más de 6 s, salvo uno solo de hasta 15 s en el último minuto (el cierre mirando a cámara).
2. **Algo cambia cada 1.3 a 1.6 s** (un corte, un golpe de texto o un gráfico). Nunca más de 6 s sin un cambio.
3. **Los primeros 16 s no tienen ni un cuadro limpio**: primer texto antes de 0.3 s, primer inserto antes de 1.5 s.
4. Reparto: insertos a pantalla completa 33–38 %, persona con texto 20–24 %, tomas de apoyo 17–21 %, persona limpia
   17–20 %, capturas y testimonios 3–6 %. Nunca más de 19 s seguidos sin ver a la persona.
5. Insertos de 1 a 6 s cada uno; se pueden encadenar hasta 4.
6. Tomas de apoyo: nunca una sola; van en grupos de 2 a 8, de 0.4 a 1.6 s cada una.
7. Acercamiento (`'cerrado'`) al empezar una frase de énfasis o una negación, siempre que hay apoyo lateral, y a media
   frase larga para romper la quietud.
8. Marca de agua del logo detrás de la persona en el último 20 % del video. Logo a pantalla completa cada vez que se
   nombra el programa.
9. Sonido: un golpe grave en cada entrada de bloque y un barrido en 2 de cada 3 entradas de texto (las piezas ya traen
   el suyo; `sfx: []` en un beat lo quita).

## 11. La cara no se tapa

- **El texto que va DELANTE nunca tapa ojos ni boca.** Va al pecho, a los lados o arriba de la cabeza.
- `frase`, `golpes` y `conteo` se colocan solos **debajo de la barbilla**; `lateral`, `lista` y `figuras` se achican para
  caber en el lado libre. Todo eso se calcula con `foco` y `cara` de `proyecto.json`: si están mal medidos, sale mal.
- Si pones `y` a mano en una pieza de delante, revisa la foto.
- El texto que va **detrás** sí puede cruzar la cabeza: se busca que la cabeza rompa la palabra (tapa 1 a 3 letras).
- Con `'muyCerrado'` no pongas texto al pecho: no queda espacio.
- Antes de renderizar, foto de **cada** pieza que va sobre la persona (a mitad de la entrada, sostenida y a mitad de
  la salida).

## 12. Lo que este estilo NO hace

- No trae clips 3D propios (reloj dorado, gráfica de barras, mapa con ruta, puertas de luz, lema 3D, rejilla de signos
  de pesos): se ponen como `clip` con un video que dé el proyecto.
- No trae el circuito de neón, la mano que señala, las burbujas de chat ni el fallo digital («glitch»).
- No hay plano abierto (×0.71): haría falta grabar más abierto.
- Subtítulos corridos: apagados (el texto cinético hace ese papel). Se encienden al final de `estilo.js`.

---

# Medidas y tiempos de la plantilla

Especificación de la plantilla (1920×1080, 30 cuadros por segundo). «Cuadro» = 1/30 de segundo. La persona va a cámara
sobre un fondo liso y claro (beige), con ropa oscura. Los repartos y conteos de la sección A son los de un video de
6 min 54 s con esta estructura. Para comparar tu video, la vara son las fotos de la demo
(`node motor/render.mjs proyectos/demo-cinetico --fotos …`).

## A. Reparto y ritmo

| Tipo de tramo | Porcentaje |
|---|---:|
| Inserto a pantalla completa | 35.8 % |
| Persona con texto o gráfico | 22.0 % |
| Tomas de apoyo | 19.0 % |
| Persona limpia | 18.9 % |
| Capturas, clase y testimonio | 4.3 % |

- 176 cortes: uno cada 2.3 s en promedio (la mitad llega antes de 1.2 s del anterior).
- 144 textos distintos: uno nuevo cada 2.9 s. Sumando cortes y textos, algo cambia cada 1.3 a 1.6 s.
- Tramo limpio típico: 2.8 s. El más largo antes del cierre: 5.9 s. En el cierre: 14.7 s.
- Estructura: gancho y promesa (0–16 s) → presentación y autoridad → dolor y creencia falsa → giro y solución → el
  sistema en 3 pasos → propósito → caso de éxito → qué es y qué no es → llamado a la acción. La receta por secciones,
  con porcentajes, material y guion-molde, está en `ESCALETA-BASE.md`.

## B. Paleta

| Uso | Color |
|---|---|
| Crema de texto | `#f1e9d2` |
| Rojo de texto | `#cb0000` (con degradado `#a70000` → `#dc0000` en la palabra gigante roja) |
| Rojo de íconos de línea | `#c10321` |
| Amarillo de rótulos | `#fee41d`; el del llamado a la acción es más apagado, `#cbbb13` |
| Naranja | `#f1a400` |
| Verde de texto | `#15fe09`; verde menta de las figuras `#0ce67e`; flechas del llamado `#7cf363` |
| Beige del set | de `#d5c09a` (centro derecha) a `#8f714f` (esquinas de abajo) |
| Negro de inserto | `#000000` |
| Destello | crema `#f1e8d2` al centro, `#c7c1ab` en las esquinas |
| Barra de avance | `#ff0e1c`; su pista, negro al 42 % con tinte rojo |

## C. Tipografía

| Dónde | Familia | En este estilo |
|---|---|---|
| Casi todo (85 %) | Poppins 600; 400–500 en listas | Poppins |
| Títulos itálicos de terna | Poppins itálica 800–900 | Poppins ExtraBold Italic / Black Italic |
| Rótulos amarillos y llamados | Sans condensada gruesa (ancho ÷ alto de mayúscula = 7.8) | Roboto Condensed 800 (da 7.7) |
| Nombre de la presentación | Egipcia ultra gruesa | Alfa Slab One, angostada al 83 % |

Tamaños medidos (px): palabra gigante detrás 210–370 (hasta 550 si tiene 3–4 letras), ocupando 65–91 % del ancho ·
frase al pecho 100–160 · letras separadas 209 con hueco de 0.55 del tamaño · apoyo lateral 60–100 (chico) y 90–225
(fuerte) · título sobre inserto 150–275 · itálica gigante 215–250 · rótulo amarillo con mayúsculas de 98–160 de alto ·
rótulo inferior 64.

Sombras: la crema sobre el set va plana (a veces con sombra larga y suave +14, +14 px); el rojo gigante, sombra corta
oscura; el verde, resplandor de 10 px; las itálicas gigantes, sombra dura +8, +8 px sin desenfoque; sobre negro, nada.

## D. Texto sobre la persona: los modos medidos

| Modo | Dónde | Entrada | Sostén | Salida | Pieza |
|---|---|---|---|---|---|
| Palabra gigante detrás | Centrada en x = 960; mayúsculas de y 80–200 a y 320–610; la cabeza tapa 1–3 letras | Encadenada: por corte (1 cuadro a media opacidad). Sola: fundido lineal de 7 a 12 cuadros, sin moverse | 0.35–0.75 s encadenada; 1.0–1.3 s sola. Crece +2 % en 20 cuadros | Corte, o fundido con desenfoque de 4–6 cuadros | `gigante` |
| Frase al pecho | Centrada; renglón entre y 630 y 790 (plano medio) | Aparece al 190–200 % y se achica a 100 % en 9–20 cuadros, desacelerando (a los 8 cuadros va en 125 %) | 0.8–2.0 s | Se desliza a la izquierda acelerando (≈ 10 cuadros) mientras la nueva se escribe a 1 letra por cuadro | `frase` |
| Palabra por palabra | Igual | Cada palabra sube 12 px con fundido en 4 cuadros; 2–3 cuadros de desfase | — | Las palabras caen una por una | `frase` con `modo: 'palabras'` |
| Apoyo lateral | Alineado a la izquierda en x 112–170, y 320–600; persona corrida a x = 58–65 % | Palabra por palabra (5 palabras en 12–13 cuadros) o máquina de escribir | 1.2–2.2 s | Desenfoque | `lateral` |
| Lista | Igual; un renglón nuevo cada 0.5–1.0 s | Palabra por palabra | Los anteriores se quedan | Se borran todos menos el último, que dura 0.7 s más | `lista` |
| Renglón inferior | Centrado, y 880–940 | Máquina de escribir (2–3 letras por cuadro) | hasta 5 s | Se borra de derecha a izquierda en 15 cuadros | `llamado`, `golpes` con `donde: 'abajo'` |
| Letras separadas | A la altura de los ojos, detrás | Fundido lineal de 12 cuadros con acercamiento ×1.4 por corte | 0.8 s | Desenfoque de 4 cuadros | `separadas` |
| Itálica en escalera | Centrada, sobre la toma desenfocada 25 px y agrisada | Fundido de 14 cuadros + escala 75 → 100 % en 25; sigue creciendo 0.15 % por cuadro | 1.0–1.6 s por golpe | El golpe anterior baja al 30 % y se va en 20 cuadros | `escalera` |

Encuadres medidos: medio ×1.0 (cara de y 110 a 420), cerrado ×1.4 (cara de y 90 a 590), muy cerrado ×1.9. Con apoyo
lateral, la cara pasa de x = 50 % a 58–65 %. Siempre por corte.

La palabra de letras separadas llega un poco más abierta y se junta, para que nada se quede quieto.

## E. La cuadrícula de rompecabezas

Negro puro con una retícula cuyas líneas tienen «orejas» de pieza de rompecabezas, abombada al centro (ojo de pez).
Celdas de ≈ 175 × 190 px. Horizontales crema-gris de 4–6 px. Verticales con **separación de color**: tres copias de la
misma línea, azul a la izquierda, verde al centro y roja a la derecha, corridas 9–10 px (hasta 25 px en las orejas y
hacia los bordes); alternan gruesas (6–10 px) y finas (2–3 px). Entra al 60–70 % de brillo y en 12 cuadros baja a 10–25 %.
«Respira»: las orejas cambian de lado y el abombado late (ciclo de 1.5–2 s). A veces aparece una gota o un aro suelto.

## F. Catálogo: qué se ve → pieza del estilo

| Qué se ve | Medidas y tiempos | Pieza |
|---|---|---|
| Promesa con cifra y reloj de rayas | Reloj de 12 rayas de 60×14 px, radio 380, centro (530, 476), detrás; nace de 30 px y crece en 7–8 cuadros; la manecilla larga da una vuelta cada 0.5 s. Texto chico de 100 px y cifra roja de 197 px | `reloj` + `conteo` |
| Cortina negra con título | Franja de y 0 a 160 con degradado hasta 330, algo inclinada; título de 203 px, una palabra por cuadro; luego renglón de 116 px arriba a la izquierda + palabra roja de 285 px detrás | `cortina` + `gigante` |
| Multitud sobre plataforma | Elipse crema `#bab3a2` de 1420×540 con centro (960, 760); figuras de 150–260 px en 4 filas; cada una nace en 4 cuadros, una cada 2–3; 28 en 2 s | `figuras` (`modo: 'multitud'`) |
| Título itálico en escalera | 70 px blanco → 150 px naranja → dos renglones de 215–250 px (blanco + verde) | `escalera` |
| Presentación con nombre | Fondo `#2a0003` con rayos naranjas en diagonal; recorte de la persona a la izquierda; nombre plateado `#c3cbc9` de x 431 a 1837, y 708–840, revelado con barrido de rayas en 15 cuadros | `presentacion` |
| Rótulo de máquina de escribir | Amarillo, 1–3 letras por cuadro; cursor que parpadea 4 veces por segundo; sin fundidos | `rotulo` |
| Carrusel → anillo → mosaico de fotos | Tarjetas de 260×420 con radio 24; texto itálico blanco de 100 px inclinado −8°; anillo de 8 caras que gira 90° por segundo; mosaico inclinado | `carrusel`, `mosaico` |
| Letras separadas | 209 px, ancho total 1655 px, rojo | `separadas` |
| Lista lateral | Renglones de 70–86 px | `lista` |
| Título rojo gigante sobre ladrillo con ícono | Dos renglones de 360 px en `#ba003d` | `gigante` con `fondo: 'ladrillo'` |
| Sello «NO» de puntos | Puntos cada 14 px en `#c3734b`, diámetro 900, centro (480, 500), detrás; aparece en 16 cuadros | `sello` |
| Palabras gigantes encadenadas | Una por corte | `gigante` con `palabras` |
| Fotos enmarcadas apiladas | Marco crema de 18–24 px, giradas −1° a −4°; cada una entra en 6 cuadros desde 115 % | `apiladas` |
| Ecuación con «=» | El «=» nace de 883 px de ancho y se achica desacelerando (650 px a los 7 cuadros, 407 a los 31); proporción ancho : barra : hueco = 4.5 : 1 : 1 | `igual` |
| Captura con ventanita | Ventanita de 498×280 (o 345×193) pegada a la esquina superior derecha, con borde claro | `captura` |
| Íconos de línea | ≈ 310 px, trazo crema de 14–18 px con un detalle rojo; se dibujan en 12 cuadros | `icono` |
| Figuras que se acumulan junto a la persona | Hasta 9, de 150 px, mitad crema y mitad verde menta, en x 157–762, y 197–719; una cada 6 cuadros, con «pop» | `figuras` |
| Tres columnas | 640 px cada una; cifra amarillo-lima + palabra crema de 250 px cruzando las tres | `columnas` |
| Texto por golpes arriba | 200 px, 9 golpes en 4.5 s | `golpes` con `donde: 'arriba'` |
| Llamado a la acción | Amarillo condensado, dos renglones (x 344–1592), escrito en 12 cuadros; flechas verdes de 252×493 que caen con rebote | `cta` |
| Rótulo inferior del cierre | 64 px, y 880–938, con flechas | `llamado` |
| Logo y marca de agua | Logo que entra chico y crece con resplandor, inclinado −5°, sobre un estallido de partículas rojas; marca de agua al 40 % detrás de la persona, con fundido de 15 cuadros | `logo`, `marca` |
| Clips 3D y tomas de eventos | Reloj dorado, gráfica de barras, mapa con ruta, puertas de luz, planeta, fondo de dinero, cielo con nubes | `clip` |

## G. Transiciones

| Tipo | Cómo es | Duración | Pieza |
|---|---|---|---|
| Corte seco | La de siempre dentro de un bloque | 0 | — |
| Destello crema | Un cuadro entero crema; pico de 1–3 cuadros y caída en 10 | 10–13 cuadros | `destello` |
| Cuadrícula sobre la toma | La cuadrícula se dibuja encima, la toma se desenfoca y funde a negro | 6 cuadros | `entrada` |
| Disolvencia con desenfoque | La toma que entra llega desenfocada | 10–24 cuadros | `enfoca` |
| Ráfaga de cortes, fallo digital, barrido de movimiento | 3–15 cuadros | — | no están hechas |

Papel de cada una: corte dentro del bloque; cuadrícula para **entrar** a un inserto; destello o disolvencia para
**volver** a la persona (unos 13 destellos en 7 minutos).

## H. Barra de avance

De 8 px, pegada abajo (y 1072–1079), de lado a lado, encima de todo, extremos rectos. No avanza parejo: arranca en
10 px, llega al **50 % del ancho al 10.2 % del video**, al **58.5 % al 14.65 %**, y de ahí va recta hasta el final.
A los 42 s (de 414) quien mira cree que ya va a la mitad.

## I. Audio

- Volumen final: el motor entrega −14 LUFS por defecto. Para un sonido más fuerte y comprimido, `"lufs": -10` en
  `proyecto.json`.
- Música todo el video, 10 a 13 dB por debajo de la voz, sin bajarla más en las pausas.
- 25 golpes graves: coinciden con entradas de inserto o de palabra fuerte.
- Barrido de aire en 2 de cada 3 entradas de texto; las demás entran mudas.
- 0.3–0.4 s de silencio de música antes de un cambio de capítulo.
