# Escaleta base · Plantilla larga 2 · Cinético

La estructura del video, vuelta receta. Sirve para tres cosas: saber **qué va en cada parte**, saber **qué pedirle a la
persona** antes de editar y saber **cómo debe grabarlo** para que la plantilla funcione.
Las piezas (entre `comillas de código`) están explicadas en `ESTILO.md`. El proyecto en blanco con esta misma estructura
está en `base/` y se crea con `scripts/nuevo.sh cinetico "<nombre>" <video.mp4>`.

Video horizontal 16:9. Una persona a cámara sobre fondo liso, con texto gigante que pasa detrás de su cabeza, frases al
pecho, insertos sobre negro y tomas de apoyo. El texto repite lo que se dice, pero solo las 2 a 6 palabras que cargan el sentido.

## 1. Las secciones, en orden

| # | Sección | Para qué sirve | % del video | En 3 min | En 6 min | En 10 min |
|---|---|---|---:|---:|---:|---:|
| 1 | **Gancho y promesa** | Prometer un resultado con cifra en los primeros segundos | 4 % | 12 s * | 14 s | 20 s * |
| 2 | **Presentación y autoridad** | Decir quién habla y por qué creerle | 7 % | 13 s | 25 s | 42 s |
| 3 | **Dolor y creencia falsa** | Nombrar lo que le duele al espectador y la idea equivocada que lo mantiene ahí | 12 % | 22 s | 43 s | 72 s |
| 4 | **Giro y solución** | Presentar la forma distinta de hacerlo y el nombre del programa | 15 % | 27 s | 54 s | 90 s |
| 5 | **El sistema en 3 pasos** | Explicar cómo funciona, paso por paso | 23 % | 36 s * | 84 s | 142 s * |
| 6 | **Propósito** | Decir por qué lo hace y qué cambia en la vida de quien lo logra | 12 % | 22 s | 43 s | 72 s |
| 7 | **Caso de éxito** | Contar el resultado de una persona real | 7 % | 13 s | 25 s | 42 s |
| 8 | **Qué es y qué no es** | Aclarar el formato y quitar dudas | 8 % | 14 s | 29 s | 48 s |
| 9 | **Llamado a la acción** | Pedir el registro y cerrar mirando a cámara | 12 % | 21 s | 43 s | 72 s |
| | **Total** | | **100 %** | 180 s | 360 s | 600 s |

\* El gancho dura siempre entre 12 y 20 s, sin importar el largo del video: lo que le sobra o le falta se le quita o se le
da al sistema. Los demás segundos son el porcentaje aplicado a cada duración; redondea siempre al final de la frase.

Los porcentajes son de un video de 7 minutos con esta estructura. Son firmes los del gancho, la solución, el sistema y el
llamado; el límite entre propósito y caso de éxito es aproximado (±3 puntos). El orden no se cambia.

## 2. Qué se dice, qué piezas van y cómo se ve la persona

| # | Sección | Qué dice la persona (y una frase modelo) | Piezas, en este orden | Cómo se ve la persona |
|---|---|---|---|---|
| 1 | Gancho y promesa | La promesa con cifra y el remate en tres partes. «En menos de [N minutos] te voy a enseñar [promesa]: [1], [2] y [remate].» | `reloj` + `conteo` → `cortina` + `gigante` detrás → `figuras` (multitud) → `escalera` → `frase` | Plano medio, luego más abajo bajo la cortina, oculta en la multitud, desenfocada bajo la escalera y cerrada al volver. Ni un cuadro limpio. |
| 2 | Presentación y autoridad | Su nombre, 2 o 3 credenciales y a cuántos ha ayudado. «Soy [nombre], [credencial 1] y [credencial 2]. Esto se lo he enseñado a [cuántos].» | `presentacion` → `clip` ×3 con `rotulo` → `lateral` → `carrusel` → `carrusel` en anillo → `golpes` | En óvalo a la izquierda durante la presentación; oculta en las tomas; cerrada y corrida a la derecha con el apoyo lateral. |
| 3 | Dolor y creencia falsa | La creencia, la negación y de qué depende hoy. «Te dijeron que [creencia]. Mentira. Hoy dependes de [1], de [2] y de [3]. No es [X], no es [Y].» | `separadas` detrás → `lista` → persona limpia → `gigante` sobre ladrillo → `lateral` → `sello` + `frase` tachada → `icono` → `golpes` | Acercamiento de golpe en la negación; cerrada a un lado con la lista y el apoyo lateral; un primerísimo plano de 1 a 2 s en la frase más fuerte. |
| 4 | Giro y solución | Que hay otra forma, cómo se llama y qué hace. «Hay una forma más [1], más [2] y más [3]. Se llama [programa]. Si a [esto] le sumas [aquello], tienes [resultado].» | `gigante` con palabras encadenadas → `apiladas` → `frase` palabra por palabra → `logo` → `gigante` + `frase` → `igual` → `captura` → `figuras` + `golpes` → `escalera` | Plano medio que se acerca lento; cerrada al volver de cada inserto; en ventanita durante la captura. |
| 5 | El sistema en 3 pasos | Cada paso con su nombre, qué se hace y qué da. «Lo primero es [paso 1]: [qué se hace]. Lo segundo es [paso 2]… Y lo tercero es [paso 3].» | Por cada paso: `lateral` → `clip` con texto o `rotulo` → inserto (`icono`, `columnas` o `figuras`) → `frase` o `gigante`. Al final, `lista` con los 3 pasos | Cerrada y corrida a un lado al nombrar cada paso (alterna derecha e izquierda); oculta en los insertos; al centro de tres columnas en `columnas`. |
| 6 | Propósito | Por qué lo hace y qué quiere para el espectador. «Yo hago esto porque [razón]. He visto a [personas] [lograr algo]. Eso es lo que quiero para ti.» | Persona limpia → `gigante` + `frase` → `clip` ×3 con `rotulo` → `golpes` arriba → persona limpia → `icono` sobre crema → `frase` | Es la sección con más persona: tramos limpios de 2 a 4 s entre textos, acercándose lento. |
| 7 | Caso de éxito | Quién era, de dónde partió y qué logró. «Te cuento de [cliente]: empezó [desde dónde] y hoy [resultado]. Su vida cambió para siempre.» | `clip` ×2 con `rotulo` (nombre y resultado) → `captura` → `mosaico` → `gigante` + `frase` | Oculta en las tomas; en ventanita chica durante la captura; plano medio en el remate. |
| 8 | Qué es y qué no es | Qué no es, qué sí es, qué incluye y en qué formato. «Esto no es [X] ni [Y]. Es [qué sí]. Incluye [1], [2] y [3], en [formato].» | `marca` (de aquí al final) → `frase` tachada → `gigante` encadenado → `lista` → `clip` con texto | Cerrada y corrida a un lado con las frases y la lista; con la marca de agua del logo detrás. |
| 9 | Llamado a la acción | La acción exacta y dónde hacerla. «Regístrate aquí abajo. [Qué pasa al registrarse]. Te veo dentro.» | `logo` → `cta` → persona con `llamado` → persona limpia | Desenfocada bajo el llamado; después, plano medio mirando a cámara: el único tramo limpio largo del video. |

## 3. Ritmo por sección

Regla de toda la plantilla: **algo cambia cada 1.3 a 1.6 s** (un corte, un golpe de texto o un gráfico), es decir, unos
40 cambios por minuto, y nunca pasan más de 6 s sin un cambio. Lo que varía por sección es cuánta persona limpia se permite.

| # | Sección | Cambios por minuto | Máximo seguido a cámara sin texto ni inserto |
|---|---|---:|---|
| 1 | Gancho y promesa | 45–50 | 0 s: primer texto antes de 0.3 s, primer inserto antes de 1.5 s |
| 2 | Presentación y autoridad | 40–45 | 3 s. Las tomas de apoyo duran 0.4 a 1.6 s y van de 2 a 8 seguidas |
| 3 | Dolor y creencia falsa | 40 | 4 s |
| 4 | Giro y solución | 40 | 4 s. Hasta 4 insertos encadenados, de 1 a 6 s cada uno |
| 5 | El sistema en 3 pasos | 40–45 | 4 s. Nunca más de 19 s seguidos sin ver a la persona |
| 6 | Propósito | 30–35 | 6 s |
| 7 | Caso de éxito | 40 | 3 s |
| 8 | Qué es y qué no es | 40 | 4 s |
| 9 | Llamado a la acción | 20–25 | 15 s, una sola vez, en el último minuto |

Reparto de todo el video: 33–38 % insertos a pantalla completa · 20–24 % persona con texto · 17–21 % tomas de apoyo ·
17–20 % persona limpia · 3–6 % capturas y testimonios. Los cambios por minuto de cada sección son orientativos; el reparto y
la regla de 1.3 a 1.6 s son los que se revisan.

## 4. Material que hay que pedirle a la persona

Cantidades para un video de 3 minutos; entre paréntesis, para uno de 7.

| Qué | Cuánto | Para qué sección |
|---|---|---|
| El video a cámara, horizontal, sobre fondo liso, grabado con el guion de abajo | 1 | Todas |
| Su nombre tal como se escribe y sus credenciales en 1 a 3 palabras cada una | 1 nombre + 2 a 4 credenciales | Presentación |
| Logo del programa con fondo transparente, en versión clara | 1 | Solución, cierre y marca de agua |
| Tomas de apoyo en video (eventos, oficina, clases, clientes): archivos largos de donde sacar tomas de 0.4 a 1.6 s | 25 a 30 tomas distintas (60 a 75); salen de 4 a 6 videos | Presentación, sistema, propósito, caso |
| Fotos de clientes, alumnos o eventos | 8 o más para tarjetas y pared de fotos, y 3 para las fotos apiladas | Presentación, solución, caso |
| Capturas o grabación de pantalla de un resultado o del producto | 1 a 2 (2 a 4) | Solución y caso |
| Cifras reales: la de la promesa, a cuántas personas ha ayudado, en cuántas ciudades o países | 3 cifras | Gancho, presentación, sistema |
| Los 3 pasos del sistema, cada uno con un nombre de 1 a 3 palabras | 3 | Sistema |
| Un caso de éxito: nombre, foto o video, punto de partida y resultado, con permiso de la persona | 1 (2 a 3) | Caso de éxito |
| El llamado a la acción exacto: qué hacer y dónde | 1 frase | Llamado |
| Música con licencia | 1 canción | Todo el video |

Si falta una cifra, un nombre o un caso, **se pregunta**: no se inventa ni se deja el relleno.

## 5. Cómo grabarlo para que la plantilla funcione

- Horizontal, 1080p o más, cámara fija. Plano medio: la cara al centro, entre el 10 % y el 40 % de la altura del cuadro.
- **Fondo liso y claro**, sin objetos detrás de la cabeza: ahí pasa la palabra gigante.
- Deja libre lo de arriba de la cabeza, los dos lados y el pecho: ahí va el texto. Nada en las manos frente al pecho.
- Ropa lisa y oscura, que se separe bien del fondo (el texto pasa por detrás de la silueta).
- Luz pareja de frente. Sin moverse de lado: la persona se queda en su sitio y los acercamientos los hace la edición.
- Frases cortas, con una pausa pequeña entre ideas. Las enumeraciones, de tres en tres («más sencilla, más rápida, más rentable»).
- Las palabras fuertes (la cifra, la negación, el nombre del programa) se dicen claras y separadas: cada una dispara un texto.
- Para el cierre, 10 a 15 s mirando a cámara sin leer.

### Guion-molde

1. **Gancho y promesa (12 a 20 s).** «En menos de `[N minutos]` te voy a enseñar `[tu promesa]`: cómo conseguir `[tu cifra]`
   `[clientes, ventas, citas]` que `[1]`, que `[2]` y que `[remate]`. Todo esto gracias a `[tu método]`.»
2. **Presentación y autoridad.** «Soy `[tu nombre]`, `[credencial 1]` y `[credencial 2]`. Esto se lo he enseñado a `[a cuántos]`
   `[quiénes]`, para que cuando los vean no los puedan ignorar.»
3. **Dolor y creencia falsa.** «Te dijeron que `[la creencia]`. Mentira. Hoy dependes de `[dolor 1]`, de `[dolor 2]` y de
   `[dolor 3]`. Y eso `[lo que provoca]`. No es `[excusa 1]`, no es `[excusa 2]`: el problema es `[el verdadero problema]`.»
4. **Giro y solución.** «Hay una forma más `[1]`, más `[2]` y más `[3]`. La probamos con `[casos]` y quitamos lo que no servía.
   Se llama `[nombre del programa]`. Si a `[lo que ya tienes]` le sumas `[el método]`, el resultado es `[tu resultado]`.»
5. **El sistema en 3 pasos.** «Lo primero es `[paso 1]`: `[qué se hace]`, y con eso `[beneficio 1]`. Lo segundo es `[paso 2]`:
   `[qué se hace]`. Y lo tercero es `[paso 3]`: `[qué se hace]`. Esos son los tres pasos: `[1]`, `[2]` y `[3]`.»
6. **Propósito.** «Yo hago esto porque `[tu razón]`. He visto a `[personas]` `[lograr algo]`, y eso `[lo que cambia]`. Imagina
   `[tu vida con el resultado]`. Eso es lo que quiero para ti.»
7. **Caso de éxito.** «Te cuento de `[nombre del cliente]`. Empezó `[desde dónde]` y hoy `[su resultado]`. Como `[él o ella]`
   hay `[cuántos]` más. Su vida cambió para siempre.»
8. **Qué es y qué no es.** «Esto no es `[lo que creen]` ni `[otra cosa]`. Es `[qué sí es]`. Incluye `[1]`, `[2]` y `[3]`, en
   `[formato: en línea, presencial, N semanas]`.»
9. **Llamado a la acción.** «`[Nombre del programa]`. Regístrate aquí abajo. `[Qué pasa cuando te registras]`. Te veo dentro.»

## 6. Si el video es más largo (10 a 20 minutos, tipo YouTube)

| Sección | Qué se hace |
|---|---|
| Gancho y promesa | **No crece**: 20 s como máximo, sin un solo cuadro limpio. |
| Presentación y autoridad | **No crece** más de 45 s. Las credenciales que sobren se reparten después, como `rotulo` sobre tomas de apoyo. |
| Dolor y creencia falsa | Se **repite en chico** antes de cada paso del sistema: una creencia falsa por paso (`separadas` o `sello` + `frase`). |
| Giro y solución | Se queda igual. El `logo` a pantalla completa vuelve cada vez que se nombra el programa. |
| El sistema en 3 pasos | Es lo que **se alarga**: de 60 a 120 s por paso, o más pasos. Cada paso repite el mismo patrón (`lateral` → toma con texto → inserto → `frase`). |
| Propósito | **Una sola vez.** No pasa de 75 s. |
| Caso de éxito | Se **repite**: un caso distinto después de cada paso (2 o 3 en total), cada uno con su `clip`, `rotulo` y `captura`. |
| Qué es y qué no es | **Una sola vez**, antes del cierre. |
| Llamado a la acción | **Una sola vez**, al final. A la mitad del video se puede adelantar un `llamado` de 5 s (el rótulo inferior), sin `cta`. |

Reglas que no cambian con la duración: persona limpia 20 % como máximo, ninguna toma de apoyo se repite, la marca de agua
del logo va en el último 20 % del video y la barra roja de avance llega a la mitad muy pronto (al 10 % del video).
