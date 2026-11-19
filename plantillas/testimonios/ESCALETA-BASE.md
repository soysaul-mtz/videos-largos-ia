# Escaleta base · Plantilla larga 3 · Testimonios

La estructura del compilado, vuelta receta. Sirve para tres cosas: saber **qué va en cada parte**, saber **qué pedirle a
la persona** antes de editar y saber **qué deben decir los testimonios** para que la plantilla funcione.
Los bloques (`testimonio`, `apoyo`, `imagen`) están explicados en `ESTILO.md`. El proyecto en blanco con esta misma
estructura está en `base/compilado.json` y se crea con `scripts/nuevo.sh testimonios "<nombre>"`.

Video horizontal 16:9 de prueba social: muchas personas distintas diciendo «me funcionó», pegadas a corte seco, con tomas
de evento encima de sus voces y subtítulo amarillo solo en la frase clave. Las fuentes van crudas: no se arregla ninguna.

## 1. Las secciones, en orden

| # | Sección | Para qué sirve | % del video | En 3 min | En 6 min | En 10 min |
|---|---|---|---:|---:|---:|---:|
| 1 | **Gancho** | Soltar de entrada las frases más fuertes, una por persona | 9 % | 18 s * | 25 s * | 25 s * |
| 2 | **Puente** | Separar el gancho del cuerpo con la energía del evento | 2 % | 4 s * | 4 s * | 4 s * |
| 3 | **Testimonios** | La cadena de historias: voz de la persona con tomas de evento encima | 70 % | 124 s | 267 s | 469 s |
| 4 | **Prueba** | Enseñar la prueba más dura: la pantalla con la cifra | 8 % | 14 s | 29 s | 48 s |
| 5 | **Remate** | Subir la energía antes de cerrar: racha de evento y una última frase | 8 % | 14 s | 29 s | 48 s |
| 6 | **Cierre** | Dejar el logo | 3 % | 6 s * | 6 s * | 6 s * |
| | **Total** | | **100 %** | 180 s | 360 s | 600 s |

\* Duran lo mismo en cualquier video: el gancho, de 18 a 25 s (3 o 4 frases); el puente, de 3 a 4 s; el cierre, 6 s. Lo que
sobra se va a los testimonios. Los demás segundos son el porcentaje aplicado a cada duración. El orden no se cambia.

## 2. Qué se dice, qué bloques van y cómo se ve la persona

| # | Sección | Qué dicen las personas (y una frase modelo) | Bloques, en este orden | Cómo se ve la persona |
|---|---|---|---|---|
| 1 | Gancho | Una frase estrella cada una, cada frase una prueba distinta: dinero, rapidez, valor, pertenencia. «Empecé con dudas, pero a mi cuenta me llegaron [cifra].» | 3 o 4 bloques `testimonio` de 2.5 a 10 s, cada uno de otra persona y otro tipo de fuente, con su subtítulo. **Sin tomas de apoyo.** | A cuadro todo el bloque, tal como viene: horizontal a cuadro completo, vertical centrado sobre negro, videollamada con su interfaz. |
| 2 | Puente | Nadie habla. Suena el evento. | 1 bloque `apoyo` con 3 tomas de evento y su propio sonido; una subida de sonido que remata en el corte. | No se ve. |
| 3 | Testimonios | La historia completa: de dónde partía, qué hizo y qué logró. «Yo [punto de partida]; seguí [el método] y hoy [resultado].» Aquí se repiten, completas, al menos 2 frases del gancho. | Bloques `testimonio` de 4 a 19 s (lo normal, 11 s) con `apoyo` adentro: toma de apoyo → cara → racha de 2 a 5 tomas. | La voz entra 1.5 a 2 s antes que la cara. La cara sale 2 a 4 s y vuelve el apoyo; puede regresar 0.5 s para rematar. |
| 4 | Prueba | Quien enseña la cifra la explica mientras se ve. «Miren, aquí está: [cifra] en [tiempo].» | 1 bloque `apoyo` con una ráfaga de 5 a 13 pantallas de 0.6 s → 1 bloque `testimonio` con la pantalla compartida (hasta 15 s) y la cifra en subtítulo. | En la esquina de la videollamada, tal como se grabó. No se recorta ni se acerca. |
| 5 | Remate | Una última frase corta que resume. «Si yo pude, [cualquiera puede].» | 1 bloque `apoyo` con una racha de 6 a 10 tomas de evento, mudas → 1 `testimonio` de 2 a 3 s. | A cuadro solo en la última frase. |
| 6 | Cierre | Nadie habla. No hay llamado a la acción hablado. | 1 bloque `imagen` con el logo, 6 s, con cortinilla. | No se ve. |

## 3. Ritmo por sección

| # | Sección | Cortes por minuto | Cada cuánto cambia la imagen | Máximo seguido con la persona a cuadro |
|---|---|---:|---|---|
| 1 | Gancho | 10 | cada 6 s (es el tramo más lento: se dejan ver las caras) | 10 s |
| 2 | Puente | 45 | cada 0.9 a 1.7 s | no se ve |
| 3 | Testimonios | 35 | cada 1.7 s; tomas de apoyo de 1.0 a 1.7 s en rachas de 2 a 5 | 6 s (lo normal, 2 a 4 s) |
| 4 | Prueba | — | ráfaga de pantallas de 0.6 s y luego una sola toma larga | 15 s, una sola vez: la pantalla con la cifra |
| 5 | Remate | 40 | cada 1.4 s | 3 s |
| 6 | Cierre | — | una imagen fija 6 s | no se ve |

Reparto de todo el video: 49 % tomas de apoyo · 43 % testimonio a cuadro · 5 % pantallas · 3 % logo. Dentro de la sección
de testimonios: 55 % apoyo, 39 % persona a cuadro, 6 % pantallas. Subtítulo amarillo: alrededor del 5 % del video.

## 4. Material que hay que pedirle a la persona (para un compilado de 3 minutos)

| Qué | Cuánto | Para qué sección |
|---|---|---|
| Testimonios en video o audio, completos y sin editar (videollamadas grabadas, videos de celular, entrevistas, notas de voz) | de 8 a 10 personas; de 1 a 3 min cada una | Gancho, testimonios, remate |
| Videos de eventos reales (escenario, público, fotos con asistentes, salón lleno, dron), con su sonido | 5 min o más en total, de 4 o más momentos distintos: de ahí salen unas 60 tomas que no se repiten | Puente, testimonios, remate |
| La prueba: grabación de pantalla compartida donde se ve la cifra de ingresos, con la voz de quien la enseña | 1, de 10 a 15 s útiles | Prueba |
| Grabación de pantalla del producto o de resultados, para la ráfaga | 1, de 30 s o más | Prueba |
| Capturas de resultados (ingresos, ventas) | 2 a 4 (opcionales) | Testimonios con cifra |
| Logo con fondo transparente, y cortinilla de sonido si la tiene | 1 | Cierre |
| Música con licencia | 1 canción | Todo el video |
| Nombre de cada persona y quién es (alumna, cliente), y su permiso para usar el testimonio | 1 por testimonio | El plan que aprueba la persona |

Si faltan testimonios con cifra o no hay prueba en pantalla, **se dice**: no se inventa una cifra ni se escribe un subtítulo
que la persona no dijo.

## 5. Cómo conseguir testimonios que le sirvan a la plantilla

- Sirve cualquier fuente: videollamada grabada, celular vertical u horizontal, entrevista en evento, nota de voz. No hace falta
  que se vean bien: van crudas.
- Pídele a cada persona de 1 a 2 minutos contestando las 4 preguntas del molde. Que conteste con frases completas («yo
  empecé…», no «sí, mucho»), porque la pregunta no sale en el video.
- Que diga **la cifra y el tiempo con número** («dos mil dólares», «en dos semanas»): eso es lo que lleva subtítulo.
- En videollamada: grabar con la interfaz a la vista; no hace falta recortarla.
- Los videos de evento se entregan largos y con su sonido: el puente usa ese sonido.
- La prueba se graba compartiendo la pantalla en una videollamada, con la cifra a la vista 10 s o más, mientras la persona la explica.

### Molde de preguntas (lo que debe salir de cada testimonio)

1. **Punto de partida.** «Antes de `[el programa]` yo `[tu situación]`.»
2. **Resultado con cifra.** «Hoy `[lo que lograste]`: `[tu cifra]`.»
3. **Rapidez.** «Me tomó `[tu tiempo]`.»
4. **Valoración.** «Para mí `[el programa]` es `[tu frase]`.» o «A quien lo está pensando le digo `[tu consejo]`.»

### Qué frase va en cada sección

1. **Gancho.** Las 3 o 4 más fuertes, una por tipo: `[cifra lograda]`, `[rapidez]`, `[valoración]`, `[pertenencia]`.
2. **Puente.** Sin frase: 3 tomas del evento con su sonido.
3. **Testimonios.** La historia completa de cada persona, en este orden si se puede: `[punto de partida]` → `[lo que hizo]` → `[resultado]`.
4. **Prueba.** «Aquí está: `[tu cifra]` en `[tu tiempo]`», con la pantalla a la vista.
5. **Remate.** Una frase de 2 a 3 s: `[tu consejo a quien duda]`.
6. **Cierre.** Sin frase: el logo.

## 6. Si el video es más largo (10 a 20 minutos)

| Sección | Qué se hace |
|---|---|
| Gancho | **No crece**: 25 s y 4 frases como máximo. |
| Puente | **Se repite** como separador: uno de 3 a 4 s, con su sonido, cada 2 o 3 minutos, para abrir un tema nuevo (dinero, rapidez, comunidad). Las tomas no se repiten. |
| Testimonios | Es lo que **se alarga**: más personas, no bloques más largos (ninguno pasa de 19 s). Agrúpalos por tema, de 2 a 3 minutos por tema. |
| Prueba | **Se repite**: una prueba en pantalla por tema, cada una de 15 s como máximo. La más fuerte se queda para el final. |
| Remate | **Una sola vez**, antes del cierre. No pasa de 50 s. |
| Cierre | **Una sola vez**: el logo, 6 s. |

Reglas que no cambian con la duración: todos los cortes son secos, ninguna toma de apoyo se repite, el subtítulo va solo en
la frase clave (alrededor del 5 % del video) y las fuentes no se recortan, enmarcan ni acercan.
