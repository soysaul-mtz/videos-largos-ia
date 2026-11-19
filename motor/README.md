# Motor de videos largos

Dibuja cada cuadro del video con Chrome (HTML, CSS, canvas) y lo une con ffmpeg. El video de la persona entra como una
capa más: a pantalla completa, en una ventana o escondido mientras corre una animación.

**Regla de oro:** todo lo que se ve depende solo del segundo `t`. Nada se acumula entre cuadros. Por eso cualquier
cuadro o rango se puede repetir y sale idéntico, y el video se renderiza por bloques.

## Las tres partes

| Parte | Dónde | Qué decide |
|---|---|---|
| **Motor** | `motor/` | Capas, encuadre de la persona, subtítulos, render y mezcla de audio. No se toca por video. |
| **Estilo** | `plantillas/<estilo>/` | Cómo se ve: fondo, piezas animadas, subtítulos, tipografía (`estilo.js` + `estilo.css` + `ESTILO.md`). |
| **Proyecto** | `proyectos/<video>/` | Qué pasa en cada segundo de ESE video (`proyecto.json` + `beats.js`). |

## Flujo de un video

1. **Corte.** El motor recibe el video ya cortado (sin retomas ni silencios). Se corta con `editor-vsl/` (ver su README).
2. **Proyecto.** Crea `proyectos/<video>/proyecto.json`:
   ```json
   { "nombre": "Mi VSL", "plantilla": "neon", "fuente": "corte.mp4", "fps": 30, "foco": [0.5, 0.36],
     "musica": "musica/cancion.mp3", "volumen_musica_db": -19 }
   ```
   `foco` es dónde está la cara en el cuadro (0–1 de ancho y de alto): las ventanas y los zooms se centran ahí.
3. **Preparar.** `.venv/bin/python motor/preparar.py proyectos/<video>` saca cuadros, voz y `palabras.json`
   (cada palabra con su segundo) y `transcripcion.txt`. Con `--mascaras` saca también la silueta de la persona,
   necesaria si el estilo pone texto **detrás** de ella. Ocupa ≈ 0.5 GB por minuto de video.
4. **Escaleta.** Con `transcripcion.txt` y el `ESTILO.md` del estilo, escribe la escaleta: qué pieza va con cada frase.
   **Se le enseña a la persona y se espera su «sí» antes de programar.**
5. **Beats.** Pasa la escaleta a `beats.js`.
6. **Storyboard.** `node motor/render.mjs proyectos/<video> --fotos 3,12.5,40` → `fotos/hoja.jpg`. Míralas una por una.
   Una foto por pieza como mínimo, más los cambios de encuadre. Nada se exporta sin esto aprobado.
7. **Render.** `nice -n 10 node motor/render.mjs proyectos/<video>` → `salida/<nombre>.mp4`. Va por bloques de 60 s
   en `salida/partes/`; si algo falla, solo se repite ese bloque (`--rehacer 3`). Un render a la vez.
8. **Revisión.** Volumen (cerca de −14 LUFS), fotos de los cuadros clave del archivo final, y que no haya negros.

## `beats.js`

```js
export default {
  beats: [   // uno tras otro: cada uno dura hasta que empieza el siguiente (o hasta su `b`)
    { a: 0,    video: 'completo', zoom: [1, 1.05] },                      // persona a cámara, acercándose lento
    { a: 4.2,  video: 'oculto',  pieza: 'contador', de: 0, hasta: 10000 }, // animación a pantalla completa
    { a: 8.0,  video: 'ventana', pieza: 'captura', imagen: 'img/panel.png', videoEncima: true },
    { a: 14.5, video: 'completo', zoom: 1.15, corte: true },               // acercamiento de golpe (sin viaje)
  ],
  extras: [  // cosas que van ENCIMA sin cambiar el encuadre, con su propio inicio y fin
    { a: 1.1, b: 2.6, pieza: 'palabra', texto: 'GRATIS', detras: true },   // detras: pasa por detrás de la persona
  ],
};
```

Campos de un beat:

| Campo | Qué hace |
|---|---|
| `a`, `b` | Segundo de inicio y de fin. Si falta `b`, termina donde empieza el siguiente. |
| `video` | `'completo'`, `'oculto'`, un encuadre con nombre del estilo (`'ventana'`…) o `{ x, y, w, h, r }` en px. |
| `zoom` | Número, o `[de, a]` para que se mueva lento durante el beat. `foco: [fx, fy]` cambia el centro. |
| `corte: true` | El cambio de encuadre es de golpe. Sin esto, la persona viaja `tr` segundos (el estilo da el valor). |
| `videoEncima: true` | La ventana de la persona queda sobre las piezas (p. ej. sobre una captura de pantalla). |
| `pieza` + sus datos | Pieza del estilo y lo que necesite (`texto`, `imagen`, `de`/`hasta`…). Ver el `ESTILO.md` del estilo. |
| `antes`, `despues` | Segundos que la pieza se ve antes de `a` y después de `b` (para entradas y salidas que se enciman). |
| `detras: true` | La pieza pasa por detrás de la persona (hace falta `preparar.py --mascaras`). |
| `subs: false` | Sin subtítulos en ese beat. Las piezas con `sinSubs` ya los quitan solas. |
| `sfx` | `[[nombre, segundosDesdeElInicio, volumen]]` de `audio/sfx/`. Si falta, se usa el de la pieza. |

Las imágenes y capturas del proyecto van en `proyectos/<video>/img/` y se piden como `/proyecto/img/archivo.png`.

## Un estilo (`plantillas/<estilo>/estilo.js`)

`plantillas/_plantilla/` es el ejemplo mínimo comentado. Un estilo exporta:

- `video`: encuadres con nombre (`completo`, `ventana`, `mitad`…) y `porDefecto`. `tr`: segundos del viaje entre encuadres.
- `fondo`: `crea(el, M)` y `pinta(el, t, M)`. Lo que se ve detrás cuando la persona no llena la pantalla.
- `piezas`: cada una con `crea(el, beat, M)` (una vez) y `pinta(el, tLocal, beat, M, dur)` (cada cuadro).
  Opcionales: `sinSubs`, `sfx`, `antes`, `despues`, `z`.
- `subs`: `paginas: { max, chars }`, `crea(el, M)` y `pinta(el, pagina, t, M)`. `pagina.palabras = [{ txt, a, b }]`.
- `encima`: capa fija sobre todo (barra de avance, logo).

Ayudas que exporta `motor/nucleo.js`: `prog(t, a, d)` (0→1), `entraSale(tl, dur, e, s)` (0→1→0), curvas
`eIn eOut eInOut eExpo eBack eElastico`, `lerp`, `clamp`, `azar(n)` (azar fijo), `contar`, `teclear`, `h()` para crear elementos y
`ponImagen(img, src)` para imágenes que cambian con el tiempo (si `pinta` devuelve esa promesa, el motor espera a que cargue).

**Prohibido** dentro de un estilo: `Math.random()`, `Date.now()`, animaciones o transiciones de CSS, `setTimeout`,
videos con reproducción propia. Todo eso depende del reloj real y no del segundo `t`: en el render sale distinto cada vez.

## Trampas ya resueltas

- Chrome empieza a dar capturas en blanco tras ~12 000 cuadros: el render recarga la página cada 2 500.
- Los contadores usan `Math.floor` por pasos (`contar`), no redondeos que se quedan fijos.
- Texto claro sobre fondo claro desaparece: se prueba con fotos antes del render.
- El texto nunca tapa la cara: se revisa en las fotos de cada pieza que va sobre la persona.
- El limitador final lleva techo de −1.4 dB; la música va −19 dB bajo la voz salvo que el proyecto diga otra cosa.
