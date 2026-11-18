# Estilo «neón»

Guía para editar un video largo (horizontal 16:9, 1080p, 30 fps) con el estilo `neon` del motor (`motor/README.md`).
Tiene dos partes: **A. Cómo usar este estilo** (lo que necesitas para escribir `beats.js`) y **B. Desglose del video de referencia**
(de dónde salen las medidas, colores y tiempos; consúltalo cuando dudes de un tamaño o de un ritmo).

El estilo en cinco líneas:

1. Fondo casi negro con dos luces que se mueven solas: naranja a la izquierda y azul a la derecha (ciclo de 4.5 s). Nunca hay un fondo plano.
2. Todo elemento de interfaz «nace de una línea»: una raya fina que engorda a pastilla y se abre a su ancho final, con borde oro↔violeta y relleno de cristal violeta.
3. Los textos se escriben letra por letra y los números cuentan hacia arriba cambiando de color.
4. La prueba (capturas reales) entra con «zoom a través»: enorme y desenfocada, se aleja a su tamaño en un tercio de segundo, con la cifra marcada en verde.
5. Cuando se enseña una plataforma, la pantalla ocupa todo el cuadro sobre el fondo neón y la persona queda en una ventanita vertical arriba a la derecha.

**Sirve para:** videos de venta de una comunidad, curso o membresía donde hay que prometer un resultado con números, dar prueba con capturas
y enseñar el producto por dentro antes de pedir la compra. También para un recorrido de producto digital de 2 a 4 minutos.

---

# A. Cómo usar este estilo

## A1. Arranque

`proyectos/<video>/proyecto.json`:

```json
{ "nombre": "Mi video", "estilo": "neon", "fuente": "corte.mp4", "fps": 30, "foco": [0.5, 0.36] }
```

- Las imágenes del proyecto (capturas, logo, miniaturas) van en `proyectos/<video>/img/` y en el beat se piden como `'img/archivo.png'`.
- Las grabaciones de pantalla y las tomas de apoyo en video se convierten a cuadros con
  `.venv/bin/python motor/pantalla.py <video> proyectos/<proyecto> <nombre>` y en el beat se piden con `pantalla: '<nombre>'` (ver A6).
- El machote con todas las piezas es `proyectos/demo-neon/beats.js`: copia de ahí el beat que necesites.
- Antes de exportar: `node motor/render.mjs proyectos/<video> --fotos …` con una foto a media entrada, una sostenida y una a media salida de cada pieza.

## A2. Encuadres de la persona

| `video:` | Qué se ve | Cuándo |
|---|---|---|
| `'completo'` | La persona a pantalla completa. | Abrir (menos de 1 s), anunciar lo que sigue, afirmaciones personales o de confianza, precio, garantía y llamado a la acción. |
| `'oculto'` | Solo el fondo neón y la pieza. | Toda animación a pantalla completa. La persona **nunca** aparece mientras hay una animación a cuadro completo. |
| `'ventana'` | Ventanita vertical arriba a la derecha: 286 × 411 px en (1599, 92), radio 24, borde claro de 2 px y halo claro. | Solo durante el recorrido de pantalla (`pantalla`) o sobre la pantalla 3D (`pantalla3d`). Siempre con `videoEncima: true`. |

Reglas de los encuadres:

- **Todos los cambios son corte seco** (el estilo trae `tr: 0`). No hace falta escribir `corte: true`.
- **La única excepción es el vuelo a la ventana:** en el beat que pasa de `'completo'` a `'ventana'` pon `tr: 0.8`. La persona se encoge y vuela arriba a la derecha en 24 cuadros, con frenado. La salida de la ventana es por corte.
- **Acercamiento de énfasis** (a cámara): de 1.00× a 1.15× en 0.9 s, anclado arriba al centro para no cortar la cabeza, y se queda en 1.15× hasta el corte siguiente. Se escribe en dos beats:
  ```js
  { a: 40.0, video: 'completo', zoom: [1, 1.15], foco: [.5, 0] },   // 0.9 s de viaje
  { a: 40.9, video: 'completo', zoom: 1.15, foco: [.5, 0] },        // sostenido
  ```
- **Alejamiento lento** (tramos a cámara de 6 a 9 s): `zoom: [1.19, 1]` con `foco: [.5, 0]` en un solo beat.
- **Arranque del video:** `zoom: [1.5, 1.03]` en un beat de 0.7 s y enseguida la primera animación.
- A cámara, nunca más de 2.4 s sin movimiento, salvo en el cierre.

## A3. Qué pieza usar según lo que dice la persona

| La persona dice… | Pieza | Encuadre |
|---|---|---|
| La pregunta o el deseo del espectador («si estás aquí es porque quieres…») | `buscador` | oculto |
| «Muchos videos», «mucho contenido», «publicar y publicar» | `carrusel` | oculto |
| La frase de dolor con cifra («sin ganar un solo peso») | `cero` | oculto |
| El nombre del producto por primera vez | `logo` (con `destello: true`) | oculto |
| Cada pilar, plataforma o parte del sistema, con sus datos | `tarjeta` (alterna `blanca` y `roja`) | oculto |
| Un rango de dinero o metas escalonadas («de 5 mil a 10 mil al mes») | `grafica` | oculto |
| Trayectoria («llevo más de N años…») | `trayectoria` | oculto |
| Una cifra de resultados propia (cada vez que se dice una) | `capturas`, de 2 a 4 seguidas | oculto |
| La cifra mensual principal | `tarjeta` color `azul` con `cuenta` | oculto |
| La cifra más grande del video (una sola vez) | `contador` como extra, encima de `capturas` | oculto |
| «Más allá de los números, te enseño cómo es por dentro» | `pantalla3d` | ventana u oculto |
| Todo el recorrido de la plataforma | `pantalla` | ventana |
| Niveles, etapas, «de cero a cien» | `escalones` | oculto |
| Una afirmación sobre el negocio real (equipo, oficina) que necesita verse | `apoyo` + extra `rotulo` | oculto |
| Una cifra + el medio con que se logró | `pastilla` | oculto |
| «Todo lo que incluye», listas largas de contenido | `rejilla` | oculto |
| Oferta, precio y urgencia («si entras después va a ser más caro») | `precio` | oculto |
| La acción («dale clic al botón») | extra `boton` | completo |
| Un giro grande de idea (del dolor a la solución, del precio de hoy al de después) | `destello: true` en ese beat | — |

## A4. Piezas: campos del beat y un ejemplo de cada una

Todas las piezas aceptan además los campos comunes del motor (`a`, `b`, `antes`, `despues`, `sfx`, `z`). Las medidas `x`, `y`, `ancho` van en px sobre 1920 × 1080.
Dos banderas valen en **cualquier** beat: `destello: true` (1 cuadro blanco + velo de 13 cuadros) y `saturar: true` (las luces del fondo suben 2–3× durante 3 cuadros).

| Pieza | Va como | Dura | Campos |
|---|---|---|---|
| `buscador` | beat | 2.2–2.8 s | `texto` (con `*así*` va en negrita cursiva), `clic` (segundo del clic del cursor; `false` = sin cursor), `ancho`, `x`, `y` |
| `carrusel` | beat | 1.6–2 s | `imagenes` (verticales 9:16; se repiten hasta llenar), `cantidad` (10), `icono` (`false` quita el ▷) |
| `cero` | beat | 0.9 s | `texto` (`'$0'`) |
| `logo` | beat | 2.2–2.5 s | `logo` (imagen redonda), `titulo`, `tunel` (`false` = sin alejarse al final), `tam` (px del título), `x`, `y` |
| `tarjeta` | beat | 1.5–2.8 s | `color` (`'blanca'`, `'roja'`, `'azul'`, `'violeta'`), `titulo`, `datos` (hasta 4: `{ etiqueta, valor, cambio, nota }`) **o** `cuenta` (`{ de, hasta, prefijo, sufijo, dur }`), `imagen` (objeto que flota a la derecha), `anchoImagen`, `anillos` (`true` o `{ x, y, escala }`), `giro`, `x`, `y`, `ancho`, `alto` |
| `grafica` | beat | 3.3–5.2 s | `metas` (1 a 4: `{ etiqueta, valor, sufijo, acento }`), `abre` (segundo en que salta a la vista abierta) |
| `trayectoria` | beat | 1.6–2 s | `texto` (`'+8 años'`), `imagenes` (hasta 8, horizontales; la primera llena el cuadro y se encoge al centro) |
| `capturas` | beat | 0.5–1.3 s cada una | `imagenes` (hasta 7; la primera es el panel grande), `resalta` (`{ en, x, y, w, h, color }` en fracción 0–1 de esa imagen), `marcos` (`true` = marco oro→violeta), `entrada` (cuadros del zoom a través: 7–12) |
| `contador` | extra | 1.6–2 s | `de`, `hasta`, `prefijo` (`'$'`), `sufijo`, `color` (`'verde'`, `'amarillo'`, `'blanco'`, `'magenta'` o `#hex`), `cuenta` (segundos), `tam` (380), `ancho`, `x`, `y` |
| `pantalla3d` | beat | 2.2–5.5 s | `imagen` o `pantalla`, `acerca` (segundo del acercamiento), `zoom` (1.9), `foco` (`[x, y]` 0–1), `resalta` (`{ x, y, w, h, a, b, modo }`), `desde`, `velocidad` |
| `pantalla` | beat | lo que dure el recorrido | `pantalla` (grabación) o `imagen`, `desde`, `velocidad`, `bucle`, `zoom` (1.3), `foco`, `acercamientos` (`[{ a, b, zoom, foco, entra, sale }]`), `fusion` (`'trama'` o `'normal'`), `desplaza` (`[de, a]`, solo imagen fija alta), `resalta` |
| `escalones` | beat | 3.5–7.6 s | `niveles` (lista de textos), `inicio` (etiqueta de la bolita blanca), `saltos` (`[[nivel, segundo], …]`) |
| `apoyo` | beat | 0.9–2.9 s | `imagen` o `pantalla` (toma en video), `hacia` (`'izquierda'`), `desde`, `velocidad` |
| `rotulo` | extra | lo que duren las tomas | `texto`, `texto2`, `retraso` (0.23), `salida` (`true` = baja y se desvanece), `ancho`, `x`, `y` |
| `pastilla` | beat | 1.8–3.9 s | `etiqueta`, `valor`, `imagen` (objeto que sube por la derecha, p. ej. un teléfono), `nota` (etiqueta sobre el objeto) |
| `rejilla` | beat | 2.3–4.7 s | `tarjetas` (`[{ imagen, titulo, texto, avance }]`), `columnas` (3) |
| `precio` | beat | 3–5.4 s | `logo`, `marca`, `titulo`, `enlace`, `texto`, `datos` (3 pares `[cifra, etiqueta]`), `boton`, `precio` (`{ de, hasta, prefijo, sufijo }`), `nota`, `pie`, `sube` (segundo en que el precio empieza a subir), `x` |
| `boton` | extra | 2–3.1 s | `texto`, `clic` (segundo del clic; `false` = sin cursor), `ancho`, `x`, `y` |
| `destello` | extra | 0.5 s | — (igual que `destello: true` en un beat) |

### Un beat de ejemplo por pieza

```js
// buscador · la pregunta del espectador
{ a: 0.7, video: 'oculto', pieza: 'buscador', texto: '¿Cómo vender *cursos* por *internet* sin gastar en anuncios?', clic: 1.8 },

// carrusel · «mucho contenido»
{ a: 2.9, video: 'oculto', pieza: 'carrusel', imagenes: ['img/reel1.png', 'img/reel2.png', 'img/reel3.png'], saturar: true },

// cero · la frase de dolor
{ a: 4.5, video: 'oculto', pieza: 'cero', texto: '$0' },

// logo · el nombre del producto
{ a: 5.4, video: 'oculto', pieza: 'logo', logo: 'img/logo.svg', titulo: 'Academia Digital', destello: true },

// tarjeta blanca · un pilar con sus 4 datos
{ a: 7.6, video: 'oculto', pieza: 'tarjeta', color: 'blanca', titulo: 'Cursos grabados', anillos: true, imagen: 'img/objeto.svg',
  datos: [{ etiqueta: 'Alumnos', valor: '1,240', cambio: '↑ 236%' }, { etiqueta: 'Ventas del mes', valor: '$4,296', cambio: '↑ 111%' },
          { etiqueta: 'Visitas', valor: '2.8M', cambio: '↑ 230%' }, { etiqueta: 'Seguidores', valor: '215,611', cambio: '↑ 94%' }] },

// tarjeta roja · el segundo pilar (contrasta con el primero)
{ a: 9.1, video: 'oculto', pieza: 'tarjeta', color: 'roja', titulo: 'Clases en vivo', anillos: { x: 760, y: 420, escala: .5 },
  datos: [{ etiqueta: 'Asistentes', valor: '8.9 K', nota: 'Casi igual a lo habitual' }, { etiqueta: 'Ingresos', valor: '$34,750', nota: 'Casi igual a lo habitual' }] },

// tarjeta azul · la cifra mensual principal, contando
{ a: 16.3, video: 'oculto', pieza: 'tarjeta', color: 'azul', titulo: 'Ventas de cursos', imagen: 'img/objeto.svg', cuenta: { de: 4118, hasta: 15000, sufijo: '/mes' } },

// grafica · metas escalonadas
{ a: 10.5, video: 'oculto', pieza: 'grafica',
  metas: [{ etiqueta: 'Ingresos:', valor: '$5,000', sufijo: '/MES' }, { etiqueta: 'Ingresos:', valor: '$10,000', sufijo: '/MES', acento: true }] },

// trayectoria · «+N años»
{ a: 13.8, video: 'oculto', pieza: 'trayectoria', texto: '+8 años', imagenes: ['img/mini1.png', 'img/mini2.png', 'img/mini3.png', 'img/mini4.png'], saturar: true },

// capturas · prueba con la cifra marcada en verde
{ a: 15.4, video: 'oculto', pieza: 'capturas', imagenes: ['img/panel.png', 'img/lado1.png', 'img/lado2.png'], resalta: { x: .715, y: .905, w: .262, h: .075 } },

// contador · la cifra más grande, como extra encima de las capturas
// (en extras:)  { a: 18.3, b: 20.0, pieza: 'contador', de: 3333, hasta: 200000 },

// pantalla3d · puente a «te enseño por dentro», con la ventana de la persona encima
{ a: 20.0, video: 'ventana', videoEncima: true, pieza: 'pantalla3d', imagen: 'img/pantalla.png', acerca: .7, zoom: 1.75, foco: [.5, .3],
  resalta: { x: .366, y: .262, w: .31, h: .052, a: 1.3 } },

// pantalla · el recorrido: la persona vuela a la ventana (tr) y la grabación corre debajo
{ a: 22.8, video: 'ventana', videoEncima: true, tr: .8, pieza: 'pantalla', pantalla: 'recorrido', zoom: 1.3, foco: [.45, .5],
  acercamientos: [{ a: 18, b: 24, zoom: 1.8, foco: [.36, .4] }] },

// escalones · niveles
{ a: 25.4, video: 'oculto', pieza: 'escalones', niveles: ['Nivel 0', 'Nivel 20', 'Nivel 40', 'Nivel 60', 'Nivel 80', 'Nivel 100'], inicio: 'Novato' },

// apoyo + rotulo · tomas del negocio real; el rótulo atraviesa los cortes
{ a: 28.9, video: 'oculto', pieza: 'apoyo', pantalla: 'oficina1' },
{ a: 30.9, video: 'oculto', pieza: 'apoyo', imagen: 'img/equipo.jpg', hacia: 'izquierda' },
// (en extras:)  { a: 28.9, b: 32.5, pieza: 'rotulo', texto: '+25 personas', texto2: '(Equipo de producción de cursos)' },

// pastilla · cifra + el medio
{ a: 30.7, video: 'oculto', pieza: 'pastilla', etiqueta: 'Ventas:', valor: '$10,000', imagen: 'img/telefono.svg', nota: 'Sin anuncios' },

// rejilla · todo lo que incluye
{ a: 32.5, video: 'oculto', pieza: 'rejilla', tarjetas: [{ imagen: 'img/curso1.png', titulo: 'Crea tu oferta', texto: 'Define qué vendes y a quién.', avance: 20 } /* … */] },

// precio · la oferta y el precio que sube
{ a: 34.8, video: 'oculto', pieza: 'precio', logo: 'img/logo.svg', marca: 'ACADEMIA DIGITAL', titulo: 'Academia Digital', enlace: 'tusitio.com/academia',
  texto: 'Aprende a crear y vender tu curso…', datos: [['491', 'Miembros'], ['13', 'En línea'], ['2', 'Guías']],
  boton: 'ENTRAR', precio: { de: 29, hasta: 914, sufijo: '/mes' }, nota: 'De por vida', pie: 'Pago seguro', sube: 1.6 },

// boton · cierre a cámara
{ a: 37.8, video: 'completo', zoom: [1, 1.1], foco: [.5, 0] },
// (en extras:)  { a: 38.0, b: 39.95, pieza: 'boton', texto: 'ENTRAR', clic: 1.2 },
```

Notas de las piezas:

- **Tiempos internos.** Cada pieza trae los tiempos del video de referencia. Si el beat dura menos, los comprime sola (la `grafica`, los `escalones`, el `precio` y la `pastilla` reparten sus fases en la duración que les des). Por debajo de la duración mínima de la tabla las fases se atropellan.
- **`capturas`.** Las imágenes llenan su hueco sin deformarse (panel grande: 1000 × 880; laterales: 430 × 400). Usa capturas nítidas: al entrar se ven a 5×.
- **`pantalla` con tema claro.** `fusion: 'trama'` hace transparente lo negro; con una interfaz de fondo blanco usa `fusion: 'normal'`.
- **`resalta` en `pantalla` y `pantalla3d`.** Es una barra amarillo→magenta que barre de izquierda a derecha. Sobre interfaz clara agrega `modo: 'multiply'`.
- **`rotulo` y `boton`** van abajo (el rótulo a 22 px del borde inferior, el botón a 32 px): tapan el pecho, nunca la cara. No los subas.
- **`contador`: uno solo por video.** Las demás cifras van en `tarjeta`, `grafica` o `pastilla`.

## A5. Reglas de ritmo

1. **Gancho (primeros ≈ 34 s):** algo cambia cada 1.6 s en promedio; ninguna pieza dura más de 5.5 s. La persona sale menos de 1 s antes de la primera animación.
2. **Recorrido de pantalla:** un cambio cada 3.7 s en promedio (cambio de página, clic o acercamiento). Nunca más de ≈ 8 s sin scroll, clic o cambio de sección. Puede ocupar la mitad del video.
3. **Cuerpo mixto:** alterna cámara y animación en tramos de 1 a 8 s (un cambio cada 2.8 s).
4. **Cierre a cámara:** es lo único largo (hasta 22 s), con 2 botones y 1 acercamiento.
5. **Reparto de referencia:** ≈ 20 % persona a pantalla completa, ≈ 48 % grabación de pantalla con ventana, ≈ 29 % animación, ≈ 3 % tomas de apoyo.
6. **Prueba:** de 2 a 4 `capturas` seguidas, de 0.5 a 1.3 s cada una.
7. **Tomas de apoyo:** cortas (0.9 a 2.9 s), de 3 en 3, con un solo `rotulo` que atraviesa los cortes.
8. **Destello blanco:** solo en los giros grandes de idea (3 en un video de 3 minutos). `saturar`: en 2 cortes del gancho.
9. **Orden que funciona:** gancho animado → cámara 2 s («te voy a enseñar…») → recorrido → alternancias cámara/animación → oferta → cierre a cámara con botón.
10. **Ningún texto sobre la cara.** Revisa en las fotos cada pieza que va sobre la persona (`boton`, `rotulo`).

## A6. Grabaciones de pantalla y tomas en video

```bash
.venv/bin/python motor/pantalla.py grabacion.mp4 proyectos/mi-video recorrido --desde 12 --hasta 104
```

- Deja los cuadros en `proyectos/mi-video/pantalla/recorrido/` y anota `fps` y cuántos son en `datos.json`. En el beat: `pantalla: 'recorrido'`.
- `desde` (en el beat) es el segundo de la grabación que se ve al empezar el beat; así un mismo juego de cuadros sirve para varios beats seguidos.
- Ocupa ≈ 4 a 8 MB por segundo: saca solo el tramo que vayas a usar. Si la pieza se va a acercar a 1.8×, usa `--ancho 2560`.
- Graba la plataforma en **tema oscuro**, sin la barra del navegador a la vista (la pieza la recorta con `zoom: 1.3`), y moviéndote siempre: scroll, clic o cambio de sección.
- El énfasis dentro de la grabación se hace seleccionando el texto con el cursor mientras grabas (así lo hace la referencia) o con `resalta`.

## A7. Sonido

Las piezas ya traen su golpe grave donde lo lleva la referencia (`buscador`, `carrusel`, `tarjeta`, `grafica`, `trayectoria`, `capturas`, `pantalla3d`, llegada de la ventana en `pantalla`, objeto de la `pastilla`).
No llevan efecto: `contador`, `logo`, `escalones`, `rotulo`, `precio`, `boton` ni el destello. En el recorrido de pantalla no hay ningún efecto.
Música con pulso a 10–14 dB bajo la voz (el motor la pone a −19 dB por defecto: sube con `"volumen_musica_db": -13` en `proyecto.json` si quieres el nivel de la referencia). Para callar el efecto de un beat: `sfx: []`.

## A8. Subtítulos

El estilo va **sin subtítulos** (la referencia no los lleva: el texto en pantalla resume la cifra o el concepto en 1 a 4 palabras, no transcribe).
Para activarlos, al final de `estilos/neon/estilo.js` quita las dos barras de la línea `// subs: subsNeon,`. Salen abajo al centro, en blanco, con la palabra dicha en amarillo; las piezas a cuadro completo los apagan solas.

## A9. Lo que este estilo todavía no hace igual que la referencia

- **Objetos 3D con volumen** (moneda, tarjeta bancaria, icono en cubo, teléfono, cohete): aquí son imágenes planas que giran y flotan. Si el proyecto da un PNG con sombra propia se nota menos.
- **El cursor** es una flecha dibujada con relieve, no un modelo 3D.
- **Carrusel:** no hace la fila final al centro; se deshace directo en chispas.
- **Tipografía:** Inter Tight en lugar de la grotesca comercial de la referencia (letras un poco más anchas: una cifra de 7 caracteres ocupa ≈ 12 % más).
- **Tomas de apoyo:** la separación de color de las orillas está; el desenfoque de orillas es leve.

---

# B. Desglose del video de referencia

Desglose cuadro por cuadro del video de referencia (1920 × 1080, 30 fps, 192.6 s; la imagen termina en 191.47 s).
Lo que dice «medido» salió de fotos a tamaño completo y tiras a 30 fps; lo que dice «estimado» es a ojo sobre esas mismas fotos.
Convención: coordenadas en px sobre 1920 × 1080, origen arriba a la izquierda. «c» = cuadros a 30 fps (1 c = 0.033 s).
Los tiempos entre paréntesis son segundos del video de referencia.

## 1. Qué es

- **Formato:** horizontal 16:9, 1080p, 30 fps, 3 min 11 s. Una sola persona a cámara + animación por código + recorrido de pantalla de la plataforma + 3 tomas de apoyo.
- **Para qué sirve:** video de venta de una comunidad, curso o membresía donde hay que (a) prometer un resultado con números, (b) dar prueba con capturas reales y (c) enseñar la plataforma por dentro antes de pedir la compra.

## 2. Mapa de tiempo

Tipos: **CAM** = persona a pantalla completa · **ANIM** = animación sobre fondo neón · **PRUEBA** = capturas flotando · **PANT3D** = pantalla inclinada en 3D · **PANT+VENT** = grabación de pantalla con ventana de la persona · **APOYO** = toma de apoyo con rótulo.

| # | Inicio | Fin | Dur. | Tipo | Qué se ve | Pieza del estilo | De qué se habla |
|---|---|---|---|---|---|---|---|
| 1 | 0.00 | 0.70 | 0.70 | CAM | Persona a cámara; alejamiento 2.1×→1.03× en 20 c | — | «Si estás aquí es porque…» |
| 2 | 0.70 | 3.37 | 2.67 | ANIM | Barra de búsqueda que nace de una línea y se escribe; llega un cursor y hace clic (3.0) | `buscador` | el deseo del espectador |
| 3 | 3.37 | 5.30 | 1.93 | ANIM | Destello de fondo + anillo 3D de tarjetas verticales de video; la cámara se aleja | `carrusel` | «dejar de subir videos…» |
| 4 | 5.30 | 6.20 | 0.90 | ANIM | Las tarjetas se deshacen en chispas; línea roja que baja y «$0» naranja | `cero` | «…sin ganar un solo centavo» |
| 5 | 6.20 | 8.70 | 2.50 | ANIM | Destello blanco; moneda-logo dorada, título escrito, anillos de neón; desde 7.5 la cámara se aleja (túnel de anillos) | `logo` | el nombre del producto |
| 6 | 8.70 | 10.53 | 1.83 | ANIM | Tarjeta blanca inclinada con 4 datos + tarjeta bancaria e icono, sobre los anillos | `tarjeta` blanca | el primer pilar |
| 7 | 10.53 | 12.50 | 1.97 | ANIM | Paneo; tarjeta rojo oscuro con 4 cajitas de datos + icono 3D + cohete | `tarjeta` roja | el segundo pilar |
| 8 | 12.50 | 15.75 | 3.25 | ANIM | Línea magenta que sube en zigzag; punto brillante viaja con la punta; dos etiquetas de ingresos (13.5 y 14.2; la segunda se pone amarilla en 15.5) | `grafica` (de cerca) | «hasta 5 mil o 10 mil al mes» |
| 9 | 15.75 | 17.70 | 1.95 | ANIM | Vista abierta de la gráfica con las dos etiquetas, deriva lenta | `grafica` (abierta) | «solo con contenido orgánico» |
| 10 | 17.70 | 19.60 | 1.90 | ANIM | 3 c de fondo saturado, miniatura a pantalla completa que se encoge; «+N años» escrito; 8 miniaturas enmarcadas flotando | `trayectoria` | los años de experiencia |
| 11 | 19.60 | 20.70 | 1.10 | PRUEBA | Zoom a través a captura oscura de ingresos (cifra resaltada en verde) con tarjetas blancas a los lados | `capturas` | (termina la frase) |
| 12 | 20.70 | 21.17 | 0.47 | PRUEBA | Zoom a través a otra captura que se aleja | `capturas` | «y hoy mis páginas…» |
| 13 | 21.17 | 24.00 | 2.83 | ANIM+PRUEBA | Tarjeta azul degradada con contador $4,118→$15,000/mes; capturas en las esquinas con cifra resaltada | `tarjeta` azul | el promedio mensual |
| 14 | 24.00 | 25.60 | 1.60 | PRUEBA | Destello blanco; 3 capturas; encima contador verde gigante $3,333→$193,333 | `capturas` + `contador` | la cifra del año |
| 15 | 25.60 | 26.87 | 1.27 | PRUEBA | Corte a captura blanca muy cerca; el contador llega a $200,000 y se sostiene; abanico de tarjetas blancas | `capturas` + `contador` | «solo de monetización» |
| 16 | 26.87 | 27.87 | 1.00 | PRUEBA | Zoom a través a la gráfica oscura y se aleja a 3 capturas | `capturas` | una fuente de ingreso |
| 17 | 27.87 | 28.63 | 0.76 | PRUEBA | Zoom a través a otra cifra con recuadro verde | `capturas` | la otra fuente |
| 18 | 28.63 | 34.13 | 5.50 | PANT3D | Grabación de la plataforma como plano inclinado en 3D con brillo; acercamiento a 30.3; resaltador sobre el título 31.3–32.5 | `pantalla3d` | «más allá de los números… cómo se hace por dentro» |
| 19 | 34.13 | 36.50 | 2.37 | CAM | Persona a pantalla completa, sin movimiento | — | «te voy a enseñar qué hay dentro» |
| 20 | 36.50 | 37.30 | 0.80 | TRANSICIÓN | La cámara se encoge y vuela arriba a la derecha hasta ser la ventana; aparece la pantalla debajo | `ventana` con `tr: .8` | «cuando entras…» |
| 21 | 37.30 | 53.00 | 15.70 | PANT+VENT | Muro de la comunidad, desplazamiento continuo hacia abajo | `pantalla` | las preguntas y respuestas diarias |
| 22 | 53.00 | 61.50 | 8.50 | PANT+VENT | Vuelve arriba; abre una publicación de resultados; la pantalla se acerca (1.3×→1.8×); el cursor selecciona la cifra (58.5–60.5) | `pantalla` + `acercamientos` | el resultado de un alumno |
| 23 | 61.50 | 69.10 | 7.60 | PANT+VENT | Cierra, abre otra publicación; selección del título (64.5–65.2) | `pantalla` | el resultado de otro alumno |
| 24 | 69.10 | 102.63 | 33.53 | PANT+VENT | Rejilla de cursos (3 columnas) y entradas de 1 a 2 s a 6 clases, volviendo cada vez a la rejilla; al final baja hasta los cursos con candado | `pantalla` | cada curso incluido, uno por frase |
| 25 | 102.63 | 110.57 | 7.94 | PANT+VENT | Una clase privada, quieta | `pantalla` | el contenido exclusivo |
| 26 | 110.57 | 123.40 | 12.83 | PANT+VENT | Calendario del mes y ficha de un evento en vivo | `pantalla` | las sesiones en vivo |
| 27 | 123.40 | 129.47 | 6.07 | PANT+VENT | Clases grabadas: tres repeticiones seguidas | `pantalla` | «todo se queda grabado» |
| 28 | 129.47 | 130.50 | 1.03 | CAM | Corte duro a la persona | — | «toda la plataforma está estructurada» |
| 29 | 130.50 | 138.07 | 7.57 | ANIM | Escalones «Nivel 0…100» que se arman en 1.1 s; bolita blanca «Novato»; bolita cian salta a Nivel 40 (134.9) y a Nivel 100 (135.5); la cámara sube con ella | `escalones` | «de 0 a 100… te puedes saltar clases» |
| 30 | 138.07 | 139.67 | 1.60 | CAM | Persona; acercamiento 1.00×→1.15× en 27 c | — | «para que tengas contexto, hoy mi empresa» |
| 31 | 139.67 | 144.70 | 5.03 | APOYO | 3 tomas del equipo trabajando (2.90, 1.20 y 0.93 s); a 139.9 nace el rótulo de dos líneas, que sigue a través de los cortes | `apoyo` ×3 + `rotulo` | el tamaño del equipo |
| 32 | 144.70 | 146.20 | 1.50 | ANIM | Cifra de ingresos escrita en pastilla (magenta → blanco → amarillo) | `pastilla` | «hemos generado miles» |
| 33 | 146.20 | 148.63 | 2.43 | ANIM | La pastilla se corre a la izquierda; teléfono 3D con rejilla de videos sube desde la esquina; etiqueta del medio | `pastilla` con `imagen` | «solo con contenido orgánico» |
| 34 | 148.63 | 150.57 | 1.94 | CAM | Persona; acercamiento 1.00×→1.15× | — | «fallando, optimizando, probando» |
| 35 | 150.57 | 155.27 | 4.70 | ANIM | Rejilla 3D inclinada de tarjetas de cursos que aparecen una por una mientras la cámara baja | `rejilla` | «muchas metodologías… dentro» |
| 36 | 155.27 | 163.67 | 8.40 | CAM | Persona; alejamiento lento 1.19×→1.00× en 8 s | — | el precio de hoy |
| 37 | 163.67 | 166.67 | 3.00 | ANIM | Tarjeta de inscripción con borde de neón azul que se despliega de una línea; la cámara baja al botón con el precio; se escribe la nota | `precio` | «congelar de por vida» |
| 38 | 166.67 | 169.03 | 2.36 | ANIM | Destello blanco; el precio del botón sube $29→$914 y el halo pasa a rojo | `precio` (segunda fase) | «si entras después será más caro» |
| 39 | 169.03 | 177.27 | 8.24 | CAM | Persona; botón con cursor abajo al centro 170.5–173.6; acercamiento 1.00×→1.15× en 174.0–174.9 | extra `boton` | «dale clic al botón» |
| 40 | 177.27 | 191.47 | 14.20 | CAM | Persona (corte de regreso a 1.00×); segundo botón 188.6–191.4 | extra `boton` | garantía y despedida |

Cortes duros detectados: 35. Los cambios dentro de la grabación de pantalla (filas 21–27) son cambios reales de página, no cortes de edición, salvo 85.20, 102.63 y 110.57.

---

## 3. Ritmo

| Bloque | Tramo (s) | Cambios visibles | Cada cuánto |
|---|---|---|---|
| Gancho animado | 0.70–34.13 | 21 | 1 cambio cada **1.6 s** (mín. 0.47 s, máx. 5.5 s en la pantalla 3D) |
| Recorrido de pantalla | 37.30–129.47 | 25 cambios de página + desplazamiento continuo | 1 cada **3.7 s** (máx. 15.7 s de muro con scroll, que nunca está quieto) |
| Cuerpo mixto | 129.47–169.03 | 14 | 1 cada **2.8 s** |
| Cierre a cámara | 169.03–191.47 | 5 (2 botones, 1 acercamiento, 1 corte) | 1 cada **4.5 s** |

- **Máximo seguido a cámara:** 22.4 s (169.03–191.47, el cierre). Antes del cierre, el máximo es 8.4 s y con zoom lento. Fuera del cierre, ningún tramo a cámara de más de 2.4 s queda sin movimiento. En el cierre sí hay 11.3 s seguidos (177.27–188.60) con la persona quieta a 1.00× y sin nada encima.
- **Reparto del tiempo (sobre 191.47 s):**
  - Persona a cámara, pantalla completa: **38.5 s = 20.1 %**
  - Grabación de pantalla con ventana de la persona: **92.2 s = 48.1 %** (+0.8 s de transición)
  - Animación a pantalla completa (incluye capturas de prueba y pantalla 3D): **55.0 s = 28.7 %**
  - Tomas de apoyo con rótulo: **5.0 s = 2.6 %**
- La persona está visible (completa o en ventana) el 69 % del video.
- Orden de la estructura: gancho animado (34 s) → cámara (2 s) → recorrido (92 s) → 5 alternancias cámara/animación de 1–8 s → cierre a cámara con botón.

---

## 4. Paleta y fondos

### Colores medidos

| Uso | Hex medido | Notas |
|---|---|---|
| Fondo base (zona más oscura) | `#020002` – `#020003` | abajo a la derecha |
| Luz naranja (pico en reposo) | `#6a3b02` (rango `#512d03`–`#683a00`) | borde izquierdo; en destellos sube a `#955408` |
| Luz azul (pico) | `#040070` (rango `#02006e`–`#0b036c`) | borde derecho; en destellos `#0300a8` |
| Mezcla al centro | `#1f1013` → `#180d23` | marrón-violeta muy oscuro |
| Violeta neón (bordes, anillos, título) | `#c490f4`, `#a76ff9`, `#6d3cc9` | de claro a profundo |
| Oro (bordes, anillos, moneda) | `#fde6a0`, `#f2c75e`, `#fad981`; anillo `#ddca0c` | |
| Relleno «cristal violeta» | `#300a4e` (arriba) → `#4c2343` (abajo); escalones `#27084b` | |
| Bisel durazno de pastillas/escalones | `#d09367`, `#bc8154`, `#c0906c`, `#a46f77` | |
| Línea magenta de la gráfica | `#b200f8` | |
| Punto de la gráfica | centro `#f69af2`, borde `#ef7fea`, núcleo blanco | |
| Texto blanco | `#fffcff` / `#fdeffe` | blanco apenas rosado |
| Magenta de texto al entrar | `#db3cda` | |
| Amarillo de énfasis (cifra) | `#fae446` (pico `#ffec6d`) | |
| Verde contador / resaltador | `#2ff959` (texto), `#23cf3f` (marca sobre captura), borde claro `#e2fff2` | |
| Rojo de «$0» / línea | línea `#df0026`; «$0» `#f7c33a` (naranja) | partículas `#f7e82c` |
| Tarjeta azul (degradado izq→der) | `#8354fb` → `#4013f3` → `#316ff6` → `#29aefa` → `#26c8fc`; arriba-derecha `#75e4fc` | |
| Tarjeta roja | `#5c000b` (arriba) → `#1e1220` (abajo) | |
| Tarjeta blanca | `#fefbec` – `#fffcf3` | blanco cálido |
| Bolita cian | `#13fffb`, halo `#0d61a5` | |
| Neón azul de la tarjeta de inscripción | núcleo `#e1dcff`, brillo `#8e87f1` → `#5645b7` → `#4937bf` | |
| Botón de llamado a la acción | relleno `#330169`/`#280066`; borde `#fce796`; estado clic `#373043`; destello `#9970bc` | |
| Botón de la tarjeta (precio) | `#f6dca3`; texto rojo `#a90333`; halo `#a50c46` | |
| Set real de la persona | repisa cian `#6beffc`, pared violeta `#7561a9`/`#4c4287`, pared gris `#787d80`, chamarra `#58311e` | |

### Cómo está hecho el fondo

- **Base:** negro `#020003` a pantalla completa.
- **Luz naranja:** mancha radial pegada al borde izquierdo (centro en x≈0–60), pico `#6a3b02`. Medido en fila y=1020 con la luz abajo: R = 82 en x=0, 55 en x=320, 34 en x=640, 17 en x=960, 6 en x=1280 → cae a la mitad a ≈450 px y a cero a ≈1300 px. Radio útil ≈ 1250 px, muy suave.
- **Luz azul:** mancha radial pegada al borde derecho (centro en x≈1860–1920), pico `#040070` (B≈109–112). Medido en fila y=60 con la luz arriba: B = 102 en x=1760, 68 en x=1440, 36 en x=1120 → mitad a ≈570 px del borde, cero a ≈1000 px.
- **Movimiento (medido a 30 fps en 130.5–137.9 s):** las dos luces suben y bajan juntas en un **ciclo de 4.5 s (135 c)**:
  - Posición «arriba»: naranja en la esquina superior izquierda (se extiende por todo el borde superior hasta x≈1000), azul en la esquina superior derecha (y≈0–275). Reposo ≈1.2 s.
  - Viaje ≈0.9 s con curva suave (lenta-rápida-lenta). La naranja brilla más a medio viaje (R−B = 109 contra 44–78 en los extremos).
  - Posición «abajo»: naranja en la esquina inferior izquierda (centroide y≈830, pico en y≈1040), azul a media altura-baja (centroide y≈600, hasta y≈830). Reposo ≈1.3 s.
- **Destello de corte:** en 3.37 y 17.70 el fondo se satura 2–3× durante 1–3 c (naranja `#955408`, azul `#0300a8`, centro rosado) y vuelve.
- **Anillos:** solo entre 6.9 y 12.5 s. Capa extra de arcos de neón concéntricos: anillo grande medido centro (1018, 511), radio 740 px, trazo ≈28 px amarillo `#ddca0c` con gemelo violeta de 6 px; anillo chico radio ≈200 px, trazo 4 px, mitad violeta mitad amarillo. Son arcos de ≈300° que giran y crecen desde el centro.
- **Ruido/grano:** no medible. Desviación estándar en zona lisa = 0.4–1.7 niveles de 255, es decir compresión, no grano añadido. Hay bandeo en bloques en la zona azul (del archivo).
- **Viñeta:** no hay viñeta aparte; la da el propio degradado.

Receta de arranque (CSS, a ya ajustada en `estilo.js` contra las fotos del fondo):

```css
background:
  radial-gradient(1250px 900px at 0% var(--yN), rgba(106,59,2,1) 0%, rgba(106,59,2,.5) 36%, transparent 100%),
  radial-gradient(1000px 800px at 100% var(--yA), rgba(4,0,112,1) 0%, rgba(4,0,112,.5) 57%, transparent 100%),
  #020003;
/* --yN: 0% ↔ 92%   --yA: 0% ↔ 62%   ciclo 135 c, reposo 36–40 c en cada extremo, viaje 27 c con ease-in-out */
```

---

## 5. Tipografía

Hay tres familias. Las medidas son altura real de las letras en la foto; el tamaño de fuente es el que da esa altura con una grotesca apretada (mayúscula ≈ 0.72 del tamaño).

| Dónde | Familia más parecida | Alternativa libre (Google Fonts) | Peso | Tamaño a 1080p | Color y brillo |
|---|---|---|---|---|---|
| Etiquetas, cifras, rótulos, escalones, botón | grotesca apretada comercial (no es libre) | **Inter Tight** (con `letter-spacing:-0.02em`) | 700 en cifras y títulos, 500–600 en «Ingresos:» y «+N años», 400 en la 2ª línea del rótulo | ver abajo | blanco `#fffcff`; brillo blanco/violeta de 8–12 px en escalones y «+N años» |
| Barra de búsqueda | grotesca regular + negrita cursiva en las palabras clave | **Inter Tight** 400 + 700 cursiva (es lo que usa el estilo) | 400 / 700i | 44 px | blanco `#fdeffe`, sin brillo |
| Título del logo | **Anton** (condensada pesada con minúsculas) | **Anton** (es de Google Fonts) | 400 | altura de la «C» ≈ 100 px (tamaño ≈ 115–135 px; ajustar hasta que mida eso) | degradado por letra violeta `#a76ff9` → lila `#d1a4ea` → blanco `#dad3dc` |

Tamaños medidos (altura de la caja de texto → tamaño de fuente aproximado):

- La pregunta de la barra: 41 px de alto con descendentes → **44 px**. Ancho del texto 1265 px.
- «+N años»: cifras de 59 px → **82 px**.
- «Ingresos:» en vista abierta: 33 px → **36 px**; en vista cerrada (147.5 s): ≈ **66 px**.
- «$10,000» en vista abierta (16.5 s): 83 px con el signo → **96 px**; «/MES» 59 px → **80 px**. En vista cerrada (147.5 s): cifras de 115 px → **≈160 px**.
- «Nivel 60» (escalones, vista abierta): mayúscula 37 px → **52 px**; en vista cerrada **≈66 px**.
- Rótulo inferior: línea 1 de 48 px de alto → **66 px** negrita; línea 2 (entre paréntesis) de 45 px de alto → **46 px** regular.
- El texto del botón: mayúscula 56 px → **78 px** negrita.
- Tarjeta azul: título en negrita cursiva **≈46 px**; contador «$15,000/mes» 63 px con signo → **≈76 px** negrita.
- Contador verde «$200,000»: 328 px de alto, 1357 px de ancho → **≈380 px** negrita.
- «De por vida»: **≈50 px** negrita, crema `#fff3e0` (estimado).

Contornos: ninguna letra lleva contorno. El énfasis se hace con color y brillo (sombra de color de 20–60 px), nunca con trazo.

---

## 6. Subtítulos

**No hay subtítulos** en ningún momento del video (revisado en las 26 hojas a 4 cuadros por segundo). Todo el texto en pantalla es de piezas (cifras, etiquetas, rótulo, botón) y nunca transcribe lo que se dice: resume en 1–4 palabras la cifra o el concepto.

---

## 7. Catálogo de piezas

Regla común de entrada, la llamo **«nacer de línea»**: (1) raya vertical de 2 px × 40–70 px con los colores del borde; (2) en 5–8 c engorda a pastilla casi cuadrada; (3) en 8–10 c se abre a su ancho final con salida desacelerada (rápida al inicio, frena al final). Total 18–24 c. El texto empieza a escribirse cuando la pieza va a la mitad de abrirse.

Regla común de texto, **«escritura con arrastre»**: letra por letra, ≈2 c por letra en textos cortos (medido: una etiqueta de 9 letras en 17 c; una cifra de 7 caracteres en 13 c) y ≈0.55 c por letra en la frase larga de la barra (56 letras en 31 c). Las últimas 1–3 letras entran separadas (espaciado amplio que se cierra), con 30–50 % de opacidad y algo borrosas.

### P01 · Barra de búsqueda que se escribe (0.70–3.37)
- **Geometría (medida en 2.6 s):** 1293 × 156 px, x 308–1601, y 420–576, centro (955, 498). Radio ≈ 38 px.
- **Borde:** 3 px en degradado que gira: oro `#fde6a0`/`#f2c75e` (abajo e izquierda en esa foto) ↔ violeta `#c490f4` (arriba).
- **Relleno:** `#300a4e` arriba → `#4c2343` abajo, con reflejo durazno en los últimos 30 px (`#80595c` → `#8e6867`).
- **Halo exterior:** rosa-magenta `#6d3550` a 10 px, `#523026` a 120 px (desenfoque ≈150 px).
- **Texto:** 44 px, alineado a la izquierda, empieza en x=320 y llena la barra hasta x=1585.
- **Entrada:** nacer de línea en 22 c (corte en 0.70; ancho completo en 1.42). El texto se escribe de 1.22 a 2.27 s; las letras del frente van borrosas y caídas ≈4°.
- **Cursor 3D:** flecha blanca `#e3e2de` con volumen, ≈95 × 105 px. Entra por la esquina inferior derecha en 2.17 s girando sobre su eje y llega bajo el final de la barra (1540, 665) en 2.75 s (18 c).
- **Clic (3.00 s):** la barra baja de escala 1.00 → 0.90 en 6 c y el borde se aclara. Sostiene 5 c.
- **Salida:** corte duro con destello a P02.
- **Cuándo:** para abrir con la pregunta o deseo del espectador («Si estás aquí es porque quieres…»).

### P02 · Carrusel 3D de tarjetas de video (3.37–5.30)
- **Geometría (estimada):** 10–12 tarjetas verticales 9:16 (≈230 × 410 px las del frente) sobre un cilindro de radio ≈650 px, centro (1000, 520). Borde de neón blanco-azul de 3 px con brillo azul de ≈25 px; icono de reproducir (círculo de 100 px, solo línea blanca) al centro.
- **Entrada:** corte con 1 c sobreexpuesto; la cámara arranca dentro del anillo (tarjetas enormes y borrosas) y se aleja durante 33 c con frenado, mientras el anillo gira ≈120°.
- **Sostén:** 4.75–5.0 las tarjetas se juntan en fila al centro.
- **Salida (5.2–5.8):** se deshacen con una máscara de partículas amarillas `#f7e82c` en 18 c.
- **Cuándo:** para «muchos videos / mucho contenido».

### P03 · «$0» con línea roja que cae (5.30–6.20)
- Línea de neón rojo `#df0026`, ≈6 px con brillo, zigzag desde arriba-derecha (1900, 0) hasta abajo-izquierda (40, 880) con una meseta. Se dibuja en 13 c de derecha a izquierda.
- «$0» negrita naranja `#f7c33a` con brillo, caja 815–1115 × 465–685 (≈220 px de alto).
- Sostiene 12 c; sale con destello blanco (P21).
- **Cuándo:** la frase de dolor con cifra («sin ganar un solo centavo»).

### P04 · Logo: moneda 3D + título + anillos (6.20–8.70)
- **Moneda:** diámetro ≈340 px (caja 818–1181 × 351–689), oro `#fad981` sobre azul muy oscuro. Gira de inclinada a de frente en 8 c.
- **Título:** el nombre del producto (20 letras), caja 631–1345 × 256–359, encima de la moneda, inclinado ≈−3° y con perspectiva. Se escribe en 28 c (20 letras); cada letra entra violeta, pasa por amarillo `#f7e233` y queda en el degradado lila → blanco.
- **Anillos:** ver sección 4. Se dibujan como arcos que crecen de 0 a ≈300° en 15 c y siguen girando.
- **Salida (7.5–8.6):** la cámara se aleja; el logo se encoge a un punto en el centro (escala 1 → 0.05 en 30 c) y quedan los anillos como túnel con un aro oscuro de ≈60 px al fondo.
- **Cuándo:** primera mención del nombre del producto.

### P05 · Tarjeta de cristal blanca con datos (8.70–10.53)
- **Geometría (medida):** 1056 × 479 px, centro (934, 515), girada 1.7°, con perspectiva (borde izquierdo 476 px de alto, derecho 409 px; giro en Y ≈12° estimado). Radio ≈48 px. Relleno `#fefbec`.
- **Contenido:** título azul-cian escrito letra por letra (≈72 px); 4 datos en 2 × 2 (etiqueta gris ≈20 px, valor ≈28 px casi negro, porcentaje verde con flecha) que aparecen escalonados cada 4 c.
- **Objetos 3D:** tarjeta bancaria (≈440 × 280 px, girada −14°) y cubo-icono de la red social (≈100 px, cian) que entran por la derecha de escala 0 a 1 en 10 c y quedan flotando ±6 px.
- **Entrada:** tira vertical angosta (≈120 × 250 px, girada −8°) que se abre al ancho final en 6 c.
- **Salida:** paneo; queda asomando arriba a la izquierda durante P06.
- **Cuándo:** cada «plataforma» o «pilar» que se nombra.

### P06 · Tarjeta roja con cajitas de datos (10.53–12.50)
- **Geometría (estimada):** ≈960 × 400 px, girada +8°, radio 50. Relleno `#5c000b` arriba → `#1e1220` abajo.
- Título blanco ≈64 px escrito; 4 cajitas (≈190 × 110 px, borde de 1 px blanco translúcido, radio 10) que aparecen una cada 4 c; icono 3D de video (≈180 × 130 px) y cohete.
- **Entrada:** igual que P05. **Salida:** paneo hacia abajo en 12 c (12.2–12.5).
- **Cuándo:** el segundo pilar, para contrastar con el primero (blanco contra oscuro).

### P07 · Línea de gráfica con punto que viaja + etiqueta de ingresos (12.50–17.70)
- **Línea:** magenta `#b200f8`, 4 px con brillo, zigzag ascendente desde la esquina inferior izquierda. Avanza ≈600 px/s; la cámara sigue a la punta.
- **Punto:** bola de 90–105 px (medida 695–784 × 494–599), rosa `#f69af2` con núcleo blanco y halo. Aparece en la punta de escala 0 a 1 en 3 c en cada meta.
- **Etiqueta (pastilla):** a la derecha del punto (+110 px). Vista cerrada 555 × 183 px (858–1413 × 433–616); vista abierta ≈366 × 120 px. Radio ≈22 % del alto. Borde y bisel durazno, interior violeta `#3d0e5d`. Encima «Ingresos:»; a la derecha «/MES» en blanco negrita.
- **Estados de la cifra:** entra violeta/magenta `#db3cda` → rosa-blanco → al énfasis (15.5 s, 2–4 c) toda la pastilla se llena de durazno y la cifra pasa a amarillo `#fae446` con brillo → reposa en blanco.
- **Cámara:** 13.4–14.7 primera meta; 14.0–15.7 sube a la segunda; 15.75 salto a vista abierta con las dos metas; deriva lenta hasta 17.70.
- **Cuándo:** rangos de dinero o metas escalonadas («de 5 mil a 10 mil»).

### P08 · Rótulo de años + miniaturas flotantes (17.70–19.60)
- 3 c de fondo saturado; en 17.80 una miniatura cubre todo el cuadro sobreexpuesta y se encoge a ≈250 px de ancho en 15 c con frenado, al centro (960, 460).
- «+N años»: caja 799–1108 × 414–473, 82 px, blanco con brillo violeta de ≈50 px. Se escribe en 12 c.
- 8 miniaturas de 170–500 px de ancho a distintas profundidades (ejemplo medido: 500 × 165 px en 285–785 × 700–865). Marco de 2–3 px en degradado oro `#ffecc7` (arriba) → violeta `#584191` (abajo) con brillo. Se abren hacia afuera despacio (paralaje).
- **Cuándo:** credenciales de trayectoria.

### P09 · Capturas flotando en perspectiva (19.60–21.17 y 24.00–28.63)
- **Entrada «zoom a través»:** corte a la captura a ≈6× y desenfocada (≈25 px); se aleja a 1× en 7–12 c con frenado mientras se enfoca.
- **Reposo:** panel principal grande (ejemplo: captura oscura en 458–1460 × 85–968) con 1–3 capturas secundarias a los lados (tarjetas blancas ≈400 × 390 px), sin marco, con ligera perspectiva. Alejamiento continuo lento.
- **Énfasis:** la cifra clave lleva marca verde `#23cf3f` detrás del texto con brillo, o un recuadro fino alrededor.
- Duración por captura: 0.47–1.27 s. Siempre 2–4 capturas seguidas.
- **Cuándo:** cada vez que se dice una cifra de resultados propia.

### P10 · Tarjeta azul con contador (21.17–24.00)
- **Geometría (medida):** 903 × 374 px, x 517–1420, y 352–726, radio ≈50, sin giro en reposo. Degradado de la sección 4; borde de 3 px más claro (`#ad8cff` a la izquierda, `#a6b4ff` arriba).
- Título negrita cursiva blanco en (567, 407).
- **Pastilla blanca:** 444 × 116 px en (580, 517), radio 28, relleno `#e0e0e0` → blanco.
- **Contador:** de $4,118 (21.23 s) a $15,000 (≈22.45 s), +294 por cuadro, lineal, 37 c. El color del texto cambia mientras cuenta: rosa → naranja → amarillo `#e7db4d` → verde, y termina verde muy oscuro `#183f15` sobre blanco.
- A la derecha, la misma tarjeta bancaria + cubo-icono de P05. En las esquinas, capturas con cifra resaltada: arriba-izquierda 122–522 × 102–351, abajo-derecha 1325–1847 × 720–1075.
- **Entrada:** zoom a través de 4× a 1× en 7 c.
- **Cuándo:** la cifra mensual principal.

### P11 · Contador de dinero gigante (24.60–26.20)
- «$200,000»: caja 281–1638 × 353–681, verde `#2ff959` con filo claro `#e2fff2` y brillo verde de ≈60 px.
- Cuenta ≈+6,200 por cuadro (medido: $50,000 en 24.75; $96,667 en 25.00; $146,667 en 25.25; $193,333 en 25.50), ≈32 c en total.
- Entra borroso (≈12 px → 0 en 10 c) y creciendo de ≈0.6 a 1.0. Sostiene 0.6 s; se desvanece cuando la cámara se aleja (26.0–26.5).
- Va **encima** de las capturas de P09, que siguen moviéndose detrás.
- **Cuándo:** la cifra más grande del video (una sola vez).

### P12 · Pantalla de la plataforma inclinada en 3D (28.63–34.13)
- Grabación de pantalla como plano con perspectiva (estimado: giro en Y ≈−15°, en X ≈8°, en Z ≈−2°), con filo violeta brillante en los bordes del panel, brillo general (bloom) y aspecto de monitor fotografiado.
- **Cámara:** acercamiento de ≈2× entre ≈30.2 y 31.0 (estimado); después órbita lenta hasta el corte.
- **Resaltador:** barra degradada amarillo-naranja → magenta sobre el título de la clase, 31.3–32.5; barre de izquierda a derecha en ≈12 c.
- **Cuándo:** puente entre «los números» y «te enseño por dentro».

### P13 · Ventana de la persona
Ver sección 9.

### P14 · Grabación de pantalla sobre el fondo neón (37.30–129.47)
- La grabación (tema oscuro) ocupa todo el cuadro y **su fondo negro deja ver las luces naranja y azul**; las tarjetas de la interfaz quedan ≈+22 a +30 niveles más claras que el fondo. Lo más probable es modo de fusión «trama» (screen).
- **Escala:** ≈1.3× respecto al tamaño natural (la columna de contenido va de x=222 a x=1697; se recorta la barra del navegador).
- **Acercamiento automático:** al abrir una publicación sube a ≈1.8× en ≈45 c con curva suave (55.5–57.0) y regresa al cerrarla.
- Cursor real visible. El énfasis se hace **seleccionando el texto** con el cursor (58.5–60.5 una cifra; 64.5–65.2 un título).
- Nunca está quieta más de ≈8 s: scroll, clic o cambio de sección.
- **Cuándo:** todo el recorrido del producto.

### P15 · Escalones de niveles con bolita (130.50–138.07)
- **Escalón (medido, vista abierta 132.5 s):** 530 × 120 px. En vista cerrada (136.5 s): 676 × 155 px. Proporción 4.35 : 1. Radio ≈8 px.
- **Posiciones medidas (vista abierta):** Nivel 0 en 242–775 × 955–1075; Nivel 20 en 418–950 × 827–948; Nivel 40 en 625–1156 × 693–815; Nivel 60 en 858–1390 × 560–682; Nivel 80 en 1052–1584 × 431–552; Nivel 100 en 1258–1790 × 305–427. Paso ≈ +200 px en x (0.38 del ancho) y −130 px en y (1.07 del alto).
- **Relleno:** violeta `#27084b` al centro; bisel durazno difuminado hacia adentro: 18 px a la izquierda (`#c0906c`), ≈40 px abajo y a la derecha (`#a46f77`).
- **Texto:** negrita blanca centrada con brillo blanco de ≈8 px.
- **Entrada:** cada escalón nace de una línea vertical en su borde derecho y crece hacia la izquierda en 7 c; uno cada 5–6 c; escalera completa en 33 c (1.1 s).
- **Bolita blanca «Novato»:** diámetro 100 px (260–361 × 863–958), halo blanco; etiqueta «Novato» ≈52 px con borde tembloroso, escrita en 131.9–132.8.
- **Bolita cian** (100 px, `#13fffb`): se separa de la blanca en 134.3, salta en arco a Nivel 40 (llega ≈134.9) y luego a Nivel 100 (≈135.5). Al caer, el escalón parpadea 4–6 c con contorno amarillo de ≈4 px y centro oscuro; «Nivel 100» queda teñido azul claro.
- **Cámara:** sube siguiendo a la bolita y se acerca de 1.0× a ≈1.28× en 5 s.
- **Cuándo:** niveles, etapas o «de cero a cien».

### P16 · Rótulo inferior sobre toma de apoyo (139.90–144.70)
- **Geometría (medida):** 1017 × 208 px, x 405–1422, y 850–1058 (22 px del borde inferior; el centro queda en x≈913, 47 px a la izquierda del centro del cuadro). Radio ≈40 px.
- **Borde:** 3 px, oro-durazno `#f6d5a8`/`#efc2af` arriba e izquierda → violeta `#6f46a2` abajo.
- **Relleno:** cristal violeta oscuro `#201236` semitransparente (la toma se adivina detrás), más claro abajo.
- **Texto:** 2 líneas centradas; línea 1 en 895–943, línea 2 en 945–990, casi pegadas.
- **Entrada:** nacer de línea, empieza 7 c después del corte y termina en el c 24. Línea 1 se escribe mientras se abre (12 letras en 10 c); línea 2 después (34 letras en ≈16 c).
- **Sostén:** permanece fijo a través de los 3 cortes de toma de apoyo. **Salida:** corte duro con la escena.
- **Tratamiento de las tomas:** separación de color rojo/azul radial (0 px al centro, ≥15 px en los 300 px de cada orilla), orillas desenfocadas, travelling lento. Duran 2.90, 1.20 y 0.93 s.
- **Cuándo:** una afirmación sobre el negocio real (equipo, oficina) que necesita verse.

### P17 · Etiqueta de ingresos + teléfono 3D (144.70–148.63)
- Pastilla de P07 en grande: 596 × 197 px en 524–1120 × 403–600 (ya corrida a la izquierda), radio ≈30; «Ingresos:» arriba a la izquierda en 585–830 × 322–375.
- Entra centrada y escrita (144.75–145.5); pasa a amarillo `#fae446` en 146.1–146.5.
- En 146.2 se corre ≈140 px a la izquierda en 12 c mientras un teléfono 3D (≈420 × 880 px, marco cobre, girado en Y ≈−20° y en Z ≈6°, estimado) sube girando desde la esquina inferior derecha en 21 c hasta x 1280–1770, y 95–980.
- Etiqueta del medio (2 palabras): ≈440 × 150 px sobre el teléfono, en (1295, 400), girada ≈−5°, cristal violeta, texto magenta ≈54 px; nace de línea en 147.0–147.6.
- **Cuándo:** cifra + el medio con que se logró.

### P18 · Rejilla 3D de tarjetas de cursos (150.57–155.27)
- Tarjetas de la plataforma (≈500 × 520 px cada una, estimado) en 3 columnas, como losetas de cristal con borde grueso redondeado (radio ≈40) que brilla oro por dentro y violeta por fuera.
- Plano inclinado (estimado: giro en X ≈35°, en Y ≈−8°, en Z ≈−3°).
- Aparecen una por una en orden de lectura: escala 0 → 1 en ≈6 c, una cada 8–9 c. Más de 13 losetas en 4.7 s.
- La cámara baja de forma continua y se acerca.
- **Cuándo:** «todo lo que incluye», listas largas de contenido.

### P19 · Tarjeta de inscripción con borde de neón y precio que sube (163.67–169.03)
- **Geometría (medida en 164.75):** 451 × 838 px, x 537–988, y 55–893, radio ≈24, con leve perspectiva.
- **Borde:** neón de triple línea, núcleo `#e1dcff` de 2 px y brillo violeta-azul de ≈30 px.
- **Entrada:** raya horizontal de ≈430 px en el centro; se despliega hacia arriba en 26 c mostrando el contenido desde abajo.
- **Cámara:** baja y se acerca al botón (≈1.6×) en 164.9–165.6. La nota («De por vida») se escribe encima del botón en 165.5–166.2.
- **166.67:** destello blanco (P21). El precio del botón cuenta de $29 a $914 al mes (≈+12 por cuadro, ≈73 c); el acercamiento sigue hasta ≈1.9×; el halo del botón pasa a magenta-rojo `#a50c46` y el texto a rojo `#a90333`.
- **Cuándo:** oferta, precio y urgencia.

### P20 · Botón de llamado a la acción sobre la persona (170.53–173.65 y 188.60–191.40)
- **Geometría (medida):** 656 × 167 px, x 649–1305, y 881–1048 (32 px del borde inferior; centro en x=977, casi centrado). Radio ≈40.
- **Relleno:** violeta `#330169`; borde oro `#fce796` de 3 px con brillo.
- **Entrada:** nacer de línea en 18 c; el texto se escribe durante la apertura.
- **Cursor 3D** (el de P01, ≈70 × 75 px) llega por la derecha ≈1.0 s después y hace clic a ≈1.3 s: el relleno pasa a cristal gris oscuro `#373043`, luego destello lila-oro `#9970bc` con texto dorado durante ≈4 c, y vuelve a violeta.
- **Salida:** baja ≈60 px y se desvanece en 8 c.
- **Cuándo:** cada vez que se dice la acción («dale clic al botón»). Tapa el pecho, nunca la cara.

### P21 · Destello blanco (6.20, 24.00, 166.67)
- 1 c blanco puro; después un velo blanco que baja de ≈85 % a 0 en 12–14 c con frenado, mientras la escena nueva ya se mueve debajo.
- **Cuándo:** cambio de idea grande (del dolor a la solución, de «mensual» a «anual», del precio de hoy al de después).

---

## 8. Transiciones y movimiento de cámara

| Transición | Dónde | Cómo | Duración |
|---|---|---|---|
| Corte duro | 35 veces | entre cámara y animación siempre es corte seco; la animación arranca en el primer cuadro | 0 c |
| Zoom a través con desenfoque | 19.6, 20.7, 21.17, 25.6, 26.87, 27.87 y entradas de P02/P08 | escena nueva a 4–6× y borrosa, se aleja a 1× con frenado | 7–12 c |
| Destello blanco | 6.20, 24.00, 166.67 | ver P21 | 1 + 12–14 c |
| Fondo saturado | 3.37, 17.70 | luces a 2–3× de brillo | 1–3 c |
| Nacer de línea | P01, P15, P16, P17, P19, P20 | ver sección 7 | 18–26 c |
| Paneo entre tarjetas | 10.53, 12.2–12.5 | todo el mundo se desplaza; la pieza anterior queda asomando | 1 c (corte) o 12 c |
| Cámara → ventana | 36.50–37.30 | ver sección 9 | 24 c |
| Ventana → cámara | 129.47 | corte duro | 0 c |

**Movimiento de la toma a cámara (medido con seguimiento de puntos, escala relativa al encuadre base = 1.00):**

- **Arranque (0.00–0.67):** alejamiento de 2.14× a 1.03× en 20 c, centrado en (960, 540), con frenado fuerte: 1.71× en el c 1; 1.42× en el c 4; 1.19× en el c 9; 1.08× en el c 15.
- **Acercamiento de énfasis** (138.3, 148.8, 174.0): 1.00× → 1.15× en 27 c, anclado **arriba al centro** (x=960, y≈50) para no cortar la cabeza. Curva medida: 1.02 (3 c), 1.06 (6 c), 1.09 (9 c), 1.11 (12 c), 1.13 (18 c), 1.15 (27 c). Empieza 6–8 c después del corte y se queda en 1.15× hasta el corte siguiente.
- **Alejamiento lento** (155.27–163.27): de 1.19× a 1.00× en 8.0 s, casi lineal (1.16, 1.13, 1.10, 1.08, 1.05, 1.03, 1.01, 1.00 cada segundo), mismo anclaje.
- El resto de los tramos a cámara (34.13–36.5, 129.47–130.5, 177.27–191.47) están en 1.00× sin movimiento.

**En la animación** la cámara nunca está quieta: siempre hay una deriva o acercamiento de 3–10 % por segundo. Los giros 3D son de objetos (moneda, cursor, teléfono, tarjeta bancaria) o de planos inclinados (P12, P18); no hay giros de cámara completos salvo el carrusel (P02).

**Desenfoque de movimiento:** no hay barrido direccional. Lo que se ve es desenfoque uniforme en los zoom a través y en las letras que van entrando.

---

## 9. La persona

**Encuadre a pantalla completa (base 1.00×):** plano medio corto, centrado. La cara (piel, medida) ocupa x 707–1183 y 142–699, es decir 476 px de ancho; el pelo llega a y≈20 (estimado); hombros cortados abajo. Micrófono asomando abajo a la derecha. Fondo real: repisa con luz cian y pared violeta, es decir los mismos tonos fríos de la animación.

**Ventana (medida en 40.0, 75.5 y 120.0 s; idéntica en las tres):**

- **Posición y tamaño:** x 1599–1885, y 92–503 → **286 × 411 px**, proporción 0.696 (≈7:10, vertical). Margen derecho 35 px, margen superior 92 px.
- **Contenido:** la toma a cámara a **0.406×** recortada al centro: se ve la zona x≈620–1310, y≈20–1028 del cuadro original (casi toda la altura, 36 % del ancho).
- **Esquinas:** radio **24 px** (medido: a 2 px del borde superior el arco entra 14 px; a 6 px, 8 px; a 10 px, 4 px).
- **Borde:** 2 px en degradado claro: blanco-azulado `#cfdee3` a la izquierda, oro `#c8bd6d`/`#d5cb9a` arriba y a la derecha, blanco-rosado `#fbedff` abajo.
- **Sombra/halo:** no es sombra oscura sino brillo claro violáceo de ≈16–20 px hacia afuera (`#695e6f` pegado al borde → `#3d354d` a 16 px).
- **Está siempre encima** de la pantalla y tapa lo que quede debajo (parte de la barra lateral de la plataforma). No se mueve ni cambia de tamaño en los 92 s.

**Transición cámara → ventana (36.50–37.30, 24 c):** la toma completa se encoge de 1.00× a 0.406×, se va arriba a la derecha y se recorta de 16:9 a vertical al mismo tiempo, con frenado (a los 6 c va a ≈0.75×; a los 12 c ≈0.55×). La pantalla aparece debajo desde el c 3. Esquinas redondas y borde aparecen en los últimos 4 c.

**Cuándo va a pantalla completa:** (1) al abrir, 0.7 s; (2) para anunciar lo que sigue; (3) en afirmaciones personales o de confianza («hoy mi empresa», «fallando, optimizando»); (4) todo lo que es precio, garantía y llamado a la acción. Nunca aparece en ventana fuera del recorrido de pantalla, y nunca aparece mientras hay animación a pantalla completa.

---

## 10. Audio

- **Volumen integrado:** −21.3 LUFS. Rango de sonoridad 5.1 LU. Pico real −2.8 dBFS.
- **Voz:** nivel medio en ventanas de 50 ms −25.0 dBFS (percentil 90: −21.0). Suena pareja de principio a fin.
- **Sí hay algo de fondo bajo la voz todo el tiempo:** en las pausas entre frases el nivel nunca baja de −30 a −38 dBFS, y solo cae a silencio real (−80 a −93 dBFS) después de 191.5 s. Es decir, hay una cama a ≈**10–14 dB por debajo de la voz**.
- **Es música con pulso, muy probablemente:** el audio es estéreo de verdad (correlación entre canales 0.78) y los graves de la parte estéreo se repiten cada 0.70–0.73 s (autocorrelación 0.61), que corresponde a ≈83–85 golpes por minuto (o el doble, 166–170). Notas graves entre 94 y 141 Hz. El nivel de esa cama cambia por tramos (más presente en 0–20 s, 120–150 s y 180–190 s; más baja en 60–70 s y 100–120 s).
- **Efectos en las entradas: sí, 10 golpes graves tipo «whoosh/boom»** en estéreo, de 0.3–0.7 s, casi todo por debajo de 200 Hz, 15–30 dB por encima de la cama. Tiempos medidos de inicio: **0.30, 4.59, 8.55, 10.45, 12.33, 15.45, 20.69, 30.51, 37.50 y 146.54 s**, más tres clics cortos en 18.09–18.43 s (caen justo cuando se escribe «+N años»; no puedo asegurar que sean de eso). Los 10 golpes caen, en orden, sobre: arranque y barra, carrusel, tarjeta blanca, tarjeta roja, paneo a la gráfica, cifra en amarillo y salto a vista abierta, captura de ingresos y tarjeta azul, acercamiento a la pantalla 3D, llegada de la ventana y entrada del teléfono. Los destellos blancos (6.20, 24.00, 166.67) no traen golpe grave detectable.
- **Sin efecto detectable** en los escalones, el rótulo inferior, la tarjeta de inscripción ni los botones. En el recorrido de pantalla (38–129 s) no hay ningún efecto.
- **Final:** la música no tiene cola; se corta junto con la imagen en 191.47 s.

---

## 11. Reglas para emularlo

1. **Fondo vivo siempre:** base `#020003` + luz naranja `#6a3b02` al borde izquierdo + luz azul `#040070` al borde derecho, subiendo y bajando juntas en ciclo de 135 c. Verificable: en cualquier cuadro de animación, la esquina inferior derecha mide menos de `#060010` y hay naranja a la izquierda y azul a la derecha.
2. **Toda pieza de interfaz nace de una línea** y llega a su tamaño en 18–24 c con frenado. Prohibido aparecer por fundido simple.
3. **Todo texto de pieza se escribe letra por letra** (≈2 c por letra en textos de menos de 15 letras; ≈0.55 c por letra en frases largas), con las últimas letras separadas y a media opacidad.
4. **Bordes en degradado oro ↔ violeta de 3 px** (`#fde6a0` ↔ `#c490f4`) y relleno de cristal violeta (`#300a4e`). Radio 38–40 px en barras de 150–210 px de alto; 24 px en la ventana.
5. **Las cifras cuentan y cambian de color:** nunca aparece el número final de golpe. Contador lineal de 30–40 c; color violeta/magenta → blanco → amarillo `#fae446` o verde `#2ff959` al llegar.
6. **Una sola cifra gigante por video** (≈380 px de fuente, verde con brillo). Las demás van en pastillas de 96–160 px.
7. **La prueba entra con zoom a través** (4–6× y borrosa → 1× en 7–12 c), 2–4 capturas seguidas de 0.5–1.3 s cada una, con la cifra marcada en verde `#23cf3f`.
8. **Sin subtítulos.** El texto en pantalla resume cifra o concepto en 1–4 palabras.
9. **En el gancho (primeros ≈34 s) algo cambia cada 1.6 s en promedio** y ninguna pieza dura más de 5.5 s. La persona sale menos de 1 s antes de la primera animación.
10. **Recorrido de pantalla:** grabación a ≈1.3× sobre el fondo neón con su negro transparente, acercamiento a ≈1.8× cuando se abre algo, y énfasis seleccionando el texto con el cursor. Nunca más de ≈8 s sin scroll, clic o cambio de sección.
11. **Ventana de la persona fija:** 286 × 411 px en (1599, 92), radio 24, borde claro de 2 px, halo claro de ≈18 px, contenido a 0.406× recortado al centro. Entra encogiéndose desde pantalla completa en 24 c; sale por corte.
12. **A cámara, nunca quieto más de 2.4 s** salvo en el cierre: acercamiento 1.00× → 1.15× en 27 c anclado arriba al centro, o alejamiento lento 1.19× → 1.00× en 8 s.
13. **Destello blanco solo en los giros grandes de idea** (3 en todo el video): 1 c blanco + velo de 12–14 c.
14. **Tomas de apoyo cortas (0.9–2.9 s), de 3 en 3, con un solo rótulo fijo** de 1017 × 208 px a 22 px del borde inferior que atraviesa los cortes; con separación de color en las orillas.
15. **Llamado a la acción como botón** de 656 × 167 px abajo al centro, con cursor 3D que hace clic, cada vez que se nombra la acción; nunca tapa la cara.
16. **Sonido:** música con pulso a 10–14 dB bajo la voz; golpe grave en las transiciones grandes del gancho (9 en los primeros 38 s, ≈1 cada 4 s) y solo 1 después (146.5 s).

---

## 12. Lo que no pude determinar

- **La familia tipográfica exacta.** Una grotesca apretada comercial y Anton son las más parecidas a ojo; no hay forma de confirmarlo desde el video. Los tamaños de fuente tienen ±10 % de margen; las alturas de letra medidas sí son exactas.
- **Las curvas exactas de animación.** Doy cuadros de inicio y fin y valores intermedios medidos donde pude (zoom de cámara, encogido de la ventana); el resto es «frenado» o «suave» visto en las tiras a 30 fps, no una fórmula.
- **Los ángulos 3D** (pantalla inclinada, rejilla de cursos, teléfono, tarjetas): son estimados a ojo, no medidos.
- **El modo de fusión de la grabación de pantalla.** Las medidas cuadran con «trama» (screen), pero también podría ser el fondo oscuro recortado o una opacidad parcial.
- **Cómo se generó el fondo** (video en bucle, degradado animado o shader) y si el ciclo se reinicia en cada escena o corre continuo. Medí el ciclo solo en dos tramos largos (12.75–17.25 y 130.5–137.9 s).
- **La música:** no pude aislarla de la voz. Su nivel (≈10–14 dB bajo la voz) sale del piso en las pausas, que también incluye la cola de la voz; el pulso de ≈84 golpes por minuto sale de la parte estéreo y podría ser el doble. No sé qué pista es.
- **Los efectos de sonido que no sean graves y estéreo:** solo detecté los que sobresalen en el canal estéreo. Puede haber clics o barridos suaves tapados por la voz.
- **Si hay grano añadido:** la compresión del archivo (2.9 Mb/s) lo borraría.
- **Posiciones y tamaños de las piezas que están en movimiento constante** (carrusel, moneda, miniaturas flotantes, rejilla de cursos, teléfono): los números son de una foto concreta, indicada en cada caso.
- **La separación de color de las tomas de apoyo** mide al menos 15 px en las orillas; mi medición tenía ese tope, podría ser mayor.
