# Estilo «testimonios»: compilado de testimonios con tomas de apoyo

Video horizontal (1920×1080, 30 cuadros por segundo) de prueba social: muchas personas distintas diciendo «me
funcionó», pegadas una tras otra a corte seco, con tomas de eventos encima de sus voces y **subtítulo amarillo solo
en la frase clave**. Sirve cuando el material viene de fuentes muy desiguales (videollamadas grabadas, celulares
verticales, entrevistas en eventos, capturas de pantalla) y no se quiere «arreglar» ninguna.

Este documento es para el Claude que arma el compilado. Primero cómo se usa; al final, el desglose del video de
referencia del que salen todas las medidas.

---

## 1. Cómo usar este estilo

Todo se corre desde la carpeta del repositorio, con el Python de la carpeta (`.venv/bin/python`). **Un proceso a la
vez**: nunca dos transcripciones ni dos exportaciones juntas.

| Paso | Qué haces | Comando |
|---|---|---|
| 1. Junta el material | Una carpeta del proyecto (`proyectos/<video>/`) con los testimonios, los videos de evento, el logo y la música. No muevas ni renombres los originales de la persona: apunta a ellos con su ruta. | — |
| 2. Transcribe | Deja junto a cada testimonio un `.txt` con las frases y el segundo de cada palabra. | `.venv/bin/python estilos/testimonios/transcribir.py testimonio1.mp4 testimonio2.mp4` |
| 3. Lista las tomas de evento | Deja junto a cada video de evento su lista de tomas (`.tomas.txt`) y una hoja de miniaturas (`.tomas.jpg`). Mira la hoja con Read para saber qué hay en cada toma. | `.venv/bin/python estilos/testimonios/tomas.py evento1.mp4 evento2.mp4` |
| 4. Elige las frases | Lee los `.txt` y escoge: las 3–4 frases estrella del gancho, los testimonios del cuerpo y el remate de cada uno (lo que llevará subtítulo). Reglas en la sección 3. | — |
| 5. Escribe el JSON | `proyectos/<video>/compilado.json` con los bloques en orden (sección 2). | — |
| 6. Plan | No exporta nada. Escribe `PLAN.md` junto al JSON con cada bloque, la duración y los avisos. Corrige los avisos que se puedan. | `.venv/bin/python estilos/testimonios/armar.py proyectos/<video>/compilado.json --plan` |
| 7. **Aprobación** | Enséñale el `PLAN.md` a la persona y **espera su «sí»**. Nada se exporta sin eso. Si pide cambios: JSON → `--plan` otra vez. | — |
| 8. Fotos | Una foto de cada bloque, de cada subtítulo y de cada toma de apoyo → `salida/fotos/hoja.jpg` (y `hoja_2.jpg`…). **Míralas con Read una por una**: que el subtítulo se lea, que el vertical quede centrado, que ninguna toma de apoyo se repita ni salga negra. | `… armar.py proyectos/<video>/compilado.json --fotos` |
| 9. Exporta | Cada bloque va a `salida/partes/` y al final se unen en `salida/<nombre>.mp4`. Si cambias un bloque, solo ese se vuelve a hacer. | `… armar.py proyectos/<video>/compilado.json` |
| 10. Revisa | El programa dice la duración, el volumen (debe quedar cerca de −14 LUFS) y el pico. Además: saca fotos del archivo final en los cortes entre bloques y escucha (o transcribe) el resultado para confirmar que cada subtítulo entra con su frase. | `… transcribir.py salida/<nombre>.mp4` |

Otras opciones: `--solo 3` exporta solo el bloque 3 a `salida/bloque_03.mp4` (para oír un corte o un subtítulo sin
exportar todo).

**Demo.** `.venv/bin/python estilos/testimonios/armar.py estilos/testimonios/demo/demo.json` fabrica material de
muestra (figuras de colores y voz sintética, nada real) y arma un video de 24 s en
`estilos/testimonios/demo/salida/demo-testimonios.mp4`. El `demo.json` y su `PLAN.md` sirven de ejemplo.

**Qué necesita.** ffmpeg (busca primero `/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg`; si no está usa el `ffmpeg`
normal, que también sirve porque el subtítulo lo dibuja Python). Python con `numpy` y `pillow`; `transcribir.py`
además necesita `mlx-whisper` (Mac con chip Apple). Al armar no se usa internet.

---

## 2. El JSON

Las rutas son relativas a la carpeta del JSON (o completas). Los tiempos van en segundos con decimales.

```json
{
  "nombre": "testimonios-club",
  "musica": "audio/cama.mp3",
  "musica_db": -12,
  "bloques": [
    { "tipo": "testimonio", "quien": "Ana (alumna)", "fuente": "testimonios/ana_llamada.mp4", "formato": "llamada",
      "de": 41.2, "a": 46.5,
      "dice": "Empecé a confiar cuando a mi cuenta de banco me llegaron dos mil dólares.",
      "subs": [ { "texto": "a mi cuenta de banco me llegó", "de": 2.6 },
                { "texto": "$2000 dólares", "de": 4.1 } ] },

    { "tipo": "testimonio", "quien": "Luis (alumno)", "fuente": "testimonios/luis_celular.mov",
      "de": 12.0, "a": 18.7,
      "subs": [ { "texto": "ya estoy monetizando!", "de": 5.5 } ] },

    { "tipo": "apoyo", "nota": "puente con el sonido del evento", "sonido": true,
      "sonidos": [ { "fuente": "../../audio/sfx/riser.mp3", "en": -1.0, "db": -10 } ],
      "tomas": [ { "fuente": "evento/dia1.mp4", "de": 40.2, "dur": 1.7 },
                 { "fuente": "evento/dia1.mp4", "de": 95.0, "dur": 0.9 },
                 { "fuente": "evento/dia2.mp4", "de": 12.4, "dur": 1.5 } ] },

    { "tipo": "testimonio", "quien": "Ana (alumna)", "fuente": "testimonios/ana_llamada.mp4", "formato": "llamada",
      "de": 60.0, "a": 71.5,
      "subs": [ { "texto": "este método sí funciona", "de": 1.8, "a": 3.6 } ],
      "apoyo": [ { "fuente": "evento/dia2.mp4", "de": 30.0, "dur": 1.7, "en": 0 },
                 { "fuente": "evento/dia1.mp4", "de": 120.5, "dur": 1.4, "en": 4.4 },
                 { "fuente": "evento/dia2.mp4", "de": 51.0, "dur": 1.2 },
                 { "fuente": "evento/dia3.mp4", "de": 8.3, "dur": 1.5 },
                 { "fuente": "capturas/ingresos.png", "dur": 1.0 } ] },

    { "tipo": "imagen", "nota": "logo de cierre", "fuente": "logo.png", "dur": 6, "escala": 0.6,
      "zoom": [1.0, 1.05], "fondo": "#000000", "sonido": "audio/cortinilla.mp3" }
  ]
}
```

### Datos generales

| Campo | Qué hace |
|---|---|
| `nombre` | Nombre del archivo final (`salida/<nombre>.mp4`). Si falta, usa el nombre del JSON. |
| `musica` | Canción de fondo (opcional). Se repite si es más corta que el video. `musica_desde`: segundo de la canción en que empieza. |
| `musica_db` | Qué tan abajo de la voz va la música. Por defecto **−12**. |
| `musica_puente_db` | Nivel de la música cuando nadie habla (puente mudo, imagen de cierre). Por defecto −3. |
| `musica_fundido` | Segundos de fundido de la música al final. Por defecto 1.5. |

### Bloque `testimonio`

La **voz corre completa** de `de` a `a`. La imagen es la persona, salvo donde hay tomas de apoyo: esas la tapan
sin cortar la voz.

| Campo | Qué hace |
|---|---|
| `fuente`, `de`, `a` | Video del testimonio y el pedazo que se usa (segundos del archivo original). |
| `quien`, `dice` | Solo para el plan: quién es y qué dice (cópialo de la transcripción; la persona lo lee para aprobar). |
| `formato` | `auto` (por defecto), `horizontal`, `vertical` o `llamada`. Ver «Cómo se coloca cada fuente». |
| `subs` | Subtítulos amarillos: `texto`, `de` y `a` **contados desde el inicio del bloque**. Si falta `a`, sale cuando entra el siguiente subtítulo o cuando termina el bloque. |
| `apoyo` | Tomas que tapan a la persona: `fuente`, `de` (segundo del video de evento), `dur` y `en` (segundo del bloque en que entra). **Si falta `en`, va pegada a la toma anterior** (así se escribe una racha). Una imagen (`.png`, `.jpg`) también vale: se queda fija `dur` segundos (captura de ingresos). |
| `musica_db` / `"musica": false` | Cambia o quita la música solo en este bloque. |
| `sonidos` | Efectos sueltos: `fuente`, `en` (segundos desde el inicio del bloque; **negativo = antes del corte**, para una subida que remata justo en el corte) y `db`. |

Si la fuente es **solo audio** (una nota de voz), la imagen queda en negro: cúbrela completa con tomas de apoyo.

### Bloque `apoyo` (puente)

Tomas de evento una tras otra, sin voz de testimonio. `tomas`: lista de `fuente`, `de`, `dur`. `sonido: true`
(por defecto) deja el sonido propio de las tomas (3 dB arriba de las voces; cámbialo con `volumen_db`);
`sonido: false` las deja mudas y sube la música.

### Bloque `imagen`

Una imagen fija `dur` segundos: logo de cierre o prueba de ingresos. `zoom: [1.0, 1.05]` la acerca lento;
`fondo` es el color detrás (`#000000`); `escala` la achica (0.6 = 60 % del cuadro); `ajuste: "llenar"` la recorta
para cubrir todo; `sonido` es una cortinilla opcional. También acepta `subs`.

### Cómo se coloca cada fuente

| Fuente | Qué hace el armador |
|---|---|
| Horizontal 16:9 | Llena el cuadro, sin recorte, sin zoom. |
| Vertical de celular | Completo, a 1080 px de alto (608 de ancho), centrado sobre **negro puro**. Detecta solo el giro del celular. |
| Videollamada grabada (`"formato": "llamada"`) | Pantalla completa **con toda su interfaz**, tal cual. Nunca se recorta. |
| Horizontal que no es 16:9 | En testimonios se ve completo con franjas negras (y lo avisa); con `"formato": "horizontal"` llena recortando. Las tomas de apoyo siempre llenan. |
| Video HDR de celular | Lo avisa: pásalo antes a SDR (`editor-vsl/editor/bin/sdr`) o se verá lavado. |

### Lo que el armador revisa

**Se detiene** (y dice dónde) si: un subtítulo tiene más de 7 palabras o mide más de 1500 px; un subtítulo o una
toma se sale de su bloque o se encima con otra; falta un archivo o un pedazo no cabe en su fuente; el testimonio no
trae sonido.

**Avisa** en el plan (no detiene; decide con la persona) si: una toma de apoyo dura más de 3 s o menos de 0.6 s;
la persona se ve más de 6 s seguidos sin apoyo (10 s en el gancho); un testimonio del gancho no lleva subtítulo o
lleva tomas de apoyo; un testimonio del cuerpo empieza con la cara en vez de con la voz sobre apoyo; se repite un
pedazo de toma de apoyo; un testimonio dura más de 19 s; un subtítulo dura menos de 0.6 s o más de 2.5 s; falta
el puente, la música o la imagen de cierre.

### Lo que el armador hace solo

- Pasa todo a cuadros exactos de 30 por segundo: imagen y sonido siempre miden lo mismo.
- **Empareja las voces**: cada testimonio queda al mismo volumen (−16 LUFS) antes de la mezcla.
- Música 12 dB bajo la voz, sube cuando nadie habla y se funde al final. Mezcla final a **−14 LUFS** con techo de
  **−1.4 dB**.
- Todos los cortes son secos, en imagen y en subtítulos.

### Lo que NO hace (hazlo tú si el video lo pide)

- No elige frases ni tomas: eso es criterio tuyo (sección 3).
- No pone solo el pulso sonoro del gancho ni las subidas antes de cada sección: se agregan con `sonidos`
  (hay efectos en `audio/sfx/`, p. ej. `riser.mp3` y `boom.mp3`).
- No limpia las voces ni corrige el color: en este estilo las fuentes van crudas.
- No arma mosaicos de varios videos en un mismo cuadro.
- Los tiempos por palabra de la transcripción pueden fallar ±0.15 s: si un subtítulo importa mucho, exporta ese
  bloque con `--solo N` y óyelo.

---

## 3. Reglas del estilo

### Estructura

1. **Gancho (20–25 s).** 3 o 4 testimonios, **una frase estrella cada uno** (2.5 a 10 s), cada uno de una persona
   y un tipo de fuente distinto si se puede. **Sin tomas de apoyo.** Cada frase remata con su subtítulo amarillo.
   Cada frase es una prueba distinta: dinero, rapidez, valor, pertenencia.
2. **Puente (3–4 s).** Tomas de evento con su propio sonido, fuerte, sin voz. Es el único momento en que el apoyo
   «habla solo».
3. **Testimonios (el cuerpo).** Cadena de testimonios de 4 a 19 s (lo normal, 11 s). Los alumnos fuertes pueden
   volver varias veces. **Repite aquí, en su contexto completo, al menos 2 de las frases del gancho.**
4. **Prueba.** Hacia el final, la prueba más dura: una captura o pantalla compartida con la cifra de ingresos. Es
   la única toma larga permitida (hasta 15 s). Antes puede ir una ráfaga de pantallas del producto (0.5 s cada una).
5. **Cierre.** Corte seco al logo, fijo unos 6 s, con cortinilla. Sin llamado a la acción hablado.

### Dentro de cada testimonio del cuerpo

- **La voz entra antes que la cara.** El bloque empieza con una toma de apoyo (`"en": 0`) de 1.5 a 2 s; luego
  aparece la persona.
- La persona sale a cuadro **2 a 4 s** para «dar la cara» y vuelve el apoyo mientras su voz sigue.
- Se vale regresar a la cara 0.5–0.7 s para rematar la frase.
- Reparto en el cuerpo: alrededor de **55 % apoyo, 39 % persona a cuadro, 6 % pantallas**.

### Tomas de apoyo

- Duran **1.0 a 1.7 s** (promedio 1.4 s). Nunca menos de 0.6 ni más de 3.5 s.
- Van en **rachas de 2 a 5** seguidas (hasta 10).
- **Ninguna se repite** en todo el video. Lleva la cuenta con la lista de `tomas.py`: cada toma usada, tachada.
- Siempre de eventos reales (escenario, público, fotos con asistentes, salón lleno, dron). Variar: no dos tomas
  seguidas del mismo momento.
- Van **mudas** bajo la voz; solo el puente lleva su sonido.

### Subtítulos: qué frases lo llevan

- **Solo el remate, nunca la frase completa.** De «empecé a confiar cuando a mi cuenta de banco me llegaron dos mil
  dólares» se subtitula solo «a mi cuenta de banco me llegó» y luego «$2000 dólares».
- Qué se subtitula: un resultado en dinero, un resultado logrado, una valoración fuerte, pertenencia, confianza en
  quien enseña, la promesa del método.
- **La cifra va sola** en su tarjeta, con signo y número («$2000 dólares») aunque la persona diga «dos mil».
- **Máximo 7 palabras** y un solo renglón. Minúsculas, también al inicio. Signo de admiración solo al final («ya
  estoy monetizando!»). Puntos suspensivos como tres puntos.
- **Cuántos:** 1 a 3 tarjetas por testimonio del gancho; 1 en la primera vez que sale a cuadro cada uno de los dos
  testimonios siguientes; y una en cada cifra importante del cuerpo. En total, alrededor del **5 % del video**: si
  hay subtítulo todo el tiempo, ya no es este estilo.
- **Tiempo:** entra con la frase y dura lo que dura la frase dicha (0.8 a 1.9 s). Si el bloque termina con la
  frase, sale en el mismo cuadro del corte (deja `a` vacío). Dos tarjetas seguidas se relevan sin hueco.
- No tiene que ser literal: se puede resumir lo que dijo, sin cambiarle el sentido.
- El subtítulo no se mueve para esquivar nada: va siempre abajo al centro, aunque tape un nombre o el pecho.

### Imagen y sonido

- **Fuentes crudas.** Prohibido recortar, enmarcar, redondear, desenfocar el fondo o acercar una videollamada o un
  vertical.
- **Solo cortes secos.** Cero fundidos, cero destellos, ni al inicio ni al final.
- Las secciones se marcan **con sonido**: una subida de ≈ 1 s que remata justo en el corte.
- Los cortes siguen la voz, no la música.

---

## 4. Desglose del video de referencia

Todo lo de esta sección sale de medir el video de referencia cuadro por cuadro (7 859 cuadros). Los nombres de las
personas y de la marca se omiten a propósito.

### 4.1 Ficha

| Dato | Valor medido |
|---|---|
| Formato | 1920×1080, 30 cuadros por segundo, sonido estéreo 48 kHz |
| Duración | 261.97 s (4 min 22 s) |
| Tomas | 143 (142 cortes): una cada 1.83 s en promedio |
| Volumen | −14.2 LUFS, rango 7.5 LU, pico real +1.8 dB (se pasa: aquí se corrige a −1.4) |
| Voces | Unas 15 personas en unos 24 bloques de voz |

**La firma en 5 líneas**

1. Gancho de 24 s sin tomas de apoyo: cuatro frases estrella de cuatro alumnos, cada una con su subtítulo amarillo.
2. Las fuentes se muestran crudas: la videollamada con su interfaz, el vertical sobre negro puro.
3. La voz manda y la imagen la tapa: el 97 % de las tomas de apoyo va encima de la voz del testimonio.
4. Tomas de apoyo de ≈ 1.4 s en rachas de 3 a 10, todas de eventos, siempre a corte seco.
5. Subtítulo solo en la frase clave: 8 tarjetas en todo el video (10.7 s, el 4.1 %).

### 4.2 Estructura medida

| Tramo (s) | Sección | Qué pasa |
|---|---|---|
| 0.0–24.3 | Gancho | 4 testimonios (9.9, 5.3, 6.7 y 2.5 s) en 4 tipos de fuente: cuadrícula de videollamada, videollamada horizontal, celular vertical, videollamada con interfaz. 6 subtítulos. Ninguna toma de apoyo. |
| 24.3–40.1 | Puente (1) | Racha de 9 tomas de evento (cinco de 0.93 s exactos) sobre la voz del primer testimonio; vuelve la cara 4.5 s y 1.1 s. |
| 40.1–44.3 | Puente (2) | 3 tomas de evento con su propio sonido, lo más fuerte del video (−6.8 LUFS), sin voz. |
| 44.3–213.4 | Testimonios | Cadena de testimonios: voz sobre apoyo → cara 0.5–4 s → racha de apoyo. Los 2 primeros llevan un subtítulo en su primera aparición. |
| 213.4–235.2 | Prueba | Ráfaga de 13 pantallas en 7.0 s y luego la toma más larga del video: 14.9 s de pantalla compartida con la cifra de ingresos. |
| 235.2–255.9 | Remate | Racha de 10 tomas de evento, entrevista de 2.3 s, ráfaga de 6 pantallas. |
| 255.9–262.0 | Cierre | Corte seco al logo animado (6.0 s). La cortinilla entra 1.4 s antes; silencio total los últimos 2 s. |

Tres de las cuatro frases del gancho se repiten completas más adelante. La voz del siguiente testimonio entra
antes que su imagen: adelantos medidos de 1.6, 1.7 y 1.8 s (y dos casos largos de 9 y 10 s).

### 4.3 Ritmo

| Medida | Valor |
|---|---|
| Duración media de toma | 1.83 s en todo el video; 1.68 s en el cuerpo. El gancho es el tramo más lento (una cada 6 s) |
| Cortes por cada 30 s | 9 · 20 · 20 · 16 · 15 · 12 · 17 · 19 · 14 |
| Toma de apoyo | 89 tomas: media 1.44 s, mediana 1.37 s, mínimo 0.63, máximo 3.53; la mitad central dura 1.03–1.65 s |
| Reparto de tomas de apoyo | 20 de hasta 1.0 s · 57 de 1 a 2 s · 12 de más de 2 s |
| Testimonio a cuadro | 33 tomas: media 3.45 s, mediana 2.56 s; 6 duran menos de 1 s y 7 más de 5 s |
| Rachas de apoyo | 25 rachas de 1 a 10 tomas (lo normal, 2 a 5) |
| Bloque de voz de un testimonio | 4 a 19 s, mediana ≈ 11 s |
| Pantalla | 48.9 % apoyo · 43.4 % testimonio a cuadro · 5.4 % pantallas · 2.3 % logo (en el cuerpo: 55 / 39 / 6) |

### 4.4 Subtítulos

Las 8 tarjetas del video (ninguna después del segundo 61):

| # | Texto exacto | Dura | Palabras | Ancho | Sobre qué |
|---|---|---|---|---|---|
| 1 | Esto es una familia aquí! | 1.63 s | 5 | 1051 px | Cuadrícula de videollamada |
| 2 | a mi cuenta de banco me llegó | 1.53 s | 7 | 1299 px | Videollamada horizontal |
| 3 | $2000 dólares | 0.77 s | 2 | 589 px | Videollamada horizontal |
| 4 | ya estoy monetizando! | 1.17 s | 3 | 970 px | Vertical sobre negro |
| 5 | es la mejor inversión que he hecho | 1.17 s | 7 | 1492 px | Videollamada con interfaz |
| 6 | y no me pagas | 1.30 s | 4 | 623 px | Videollamada con interfaz |
| 7 | este brother tiene que saber algo... | 1.93 s | 7 | 1477 px | Videollamada horizontal |
| 8 | para el paso a paso | 1.17 s | 5 | 833 px | Entrevista en evento |

Dentro del gancho hay subtítulo 7.6 de los 24.3 s (31 %); en el video completo, 4.1 %.

**La receta (es la que usa `armar.py`)**

| Propiedad | Valor medido |
|---|---|
| Tipografía | **Arial Bold Italic**. Alternativa libre con las mismas medidas: **Arimo Bold Italic** (`fonts/Arimo-BoldItalic.ttf`) |
| Tamaño | **90 px** (mayúscula ≈ 64 px de alto, minúscula ≈ 47 px), sin espaciado extra |
| Color | **#FFFF00**, liso |
| Contorno duro | No tiene |
| Halo | Negro, difuminado, sin desplazamiento: la silueta del texto engordada **13 px**, desenfocada con **sigma 11 px**, opacidad **0.9** |
| Posición | **Un renglón**, centrado en x = 960, línea base en **y ≈ 982** (letras altas en y = 918, rabos en y = 1001) |
| Ancho máximo | 1492 px usado (78 % del cuadro): deja al menos 213 px libres por lado |
| Entrada y salida | **Corte seco**: de nada a completo en un cuadro. Sin fundido, sin escala, sin palabra por palabra |
| Duración | 0.77 a 1.93 s, mediana 1.23 s: lo que dura la frase dicha |
| Salida | 5 de 8 salen en el mismo cuadro del corte de la toma; 2 salen porque las releva la siguiente |

Comprobación: «a mi cuenta de banco me llegó» debe medir 1299 px de ancho (±3).

### 4.5 Tratamiento de cada tipo de fuente

Regla general medida: **ninguna fuente lleva zoom, paneo, marco, esquinas redondeadas, sombra ni fondo
desenfocado.** Los bordes de cada ventana están en el mismo píxel al principio y al final de cada toma.

| Fuente | Cómo se ve |
|---|---|
| Celular vertical | Video de 610×1080 px centrado (x = 655 a 1264); a los lados, negro puro. Se deja la etiqueta de nombre de la videollamada |
| Videollamada horizontal | Grabación a cuadro completo, sin recorte, con la etiqueta de nombre. Imagen de cámara web oscura y blanda, sin corregir |
| Cuadrícula de videollamada | Grabación completa de la cuadrícula 5×5, con nombres visibles, fija. Se usa 3 veces |
| Videollamada con interfaz | Pantalla completa con barra de botones, botón de colgar, hora, miniatura propia y cursor. El mosaico vertical de la persona mide ≈ 502×893 px |
| Videollamada con cámara apagada | El mosaico gris con el avatar, 2.7 s, y luego se tapa con apoyo (testimonio que solo tiene voz) |
| Pantalla compartida + cámara | Tal como la graba la videollamada: pantalla a la izquierda, cámara chica a la derecha, resto negro |
| Entrevista en evento | 16:9 a cuadro completo, cámara en mano, fondo desenfocado |
| Tomas de evento | 16:9 a cuadro completo. Mezcla de celular, cámara y dron en vuelos rápidos. Luces de escenario muy saturadas; no se igualan de color entre sí |
| Capturas del producto | Grabaciones de pantalla a cuadro completo, sin recorte ni resaltado |
| Logo final | Logo al centro sobre degradado vertical de negro a violeta muy oscuro (#0B0041), fijo hasta el último cuadro |

### 4.6 Transiciones

- **142 cortes, todos secos.** El primer cuadro ya es imagen completa con voz; el último es el logo. Sin fundidos.
- Las secciones se marcan con sonido: una subida de 3 s antes de la primera tarjeta; un pulso cada 0.50 s exactos
  durante el gancho; subidas de ≈ 1 s con golpe justo en el corte al empezar cada sección; cortinilla del logo que
  entra 1.4 s antes que el logo.

### 4.7 Sonido

- **Voz** al centro, sin limpieza fuerte (las videollamadas conservan su sonido). En la referencia las voces **no**
  están emparejadas (hasta 9 LU de diferencia): aquí sí se emparejan.
- **Cama de música** bajo casi todo el cuerpo, unos **10 a 15 dB por debajo de la voz**. Desaparece por completo en
  varios momentos de una persona a cuadro en videollamada (para eso está `"musica": false` en el bloque).
- **Cuando nadie habla** la música o el ambiente suben en escalón, pegados al corte (no en curva suave). En las
  pausas cortas entre frases no sube nada.
- **Ambiente de evento:** solo en el puente (≈ 4 s). En el resto, las tomas de evento van mudas.
- **Final:** cortinilla del logo y 2 s de silencio.

### 4.8 Lo que no se pudo determinar

- Si la primera tarjeta es literal o un resumen del editor (la transcripción automática de ese momento dice otra cosa).
- Por qué no hay subtítulos después del primer minuto, ni siquiera en las cifras: puede ser criterio o trabajo sin
  terminar. Por eso la regla de aquí es subtitular también las cifras del cuerpo.
- Qué música es y cuántas pistas hay; solo que su pulso es compatible con 120 por minuto.
- Si alguna toma de evento va en cámara lenta (no hay cuadros repetidos; podría venir grabada a más cuadros).
