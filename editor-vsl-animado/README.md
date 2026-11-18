# VSL animado 3D

VSL largo (≈ 11 min) donde la voz real de la persona va sobre **escenas 3D y gráficos animados hechos con código**
(Three.js + canvas), ~190 animaciones encadenadas, **subtítulos al centro palabra por palabra** (palabra activa en
píldora naranja, palabras clave en color) y, en algunos tramos, la persona en una ventana o a pantalla completa.

## Piezas
- `ESCALETA.md`: la escaleta por segundo (qué animación va con cada frase). **Se escribe y se aprueba antes de programar.**
- `motor/index.html` + `motor/app.js`: render cuadro por cuadro (`window.init(datos)`, `window.render(t)`); modos de beat
  `3d` (escena), `div` (persona en ventana a la izquierda + escena), `cam` (persona completa); transiciones zoom/whip/flash/sube.
- `motor/util.js`: tiempos (`prog`, `eOut`, `eBack`…), paleta y modelos 3D reutilizables (contenedor, nave, camión, figuras, moneda, engrane, flecha).
- `motor/beats.js` + `s2.js`, `s3.js`, `s4.js`: los mundos y beats de cada sección (ejemplo real: oficinas con contenedores).
- `render.mjs`: `node render.mjs [--stills 12,40,95] [--desde 0 --hasta 39] [--musica cancion.mp3] [--salida archivo.mp4]`.

## Datos que necesita (`datos/`)
- `voz.wav` (voz limpia del video ya cortado), `palabras.json` (Whisper con tiempos por palabra) y `pages.json`
  (páginas de subtítulos; las genera el editor de testimoniales: `editar.py <p> terminar`).
- `cuadros/` con los fotogramas JPG del video de la persona (para los modos `div` y `cam`).

## Trampas ya resueltas
- Al cambiar `material.transparent` después del primer render hay que poner `material.needsUpdate = true` (si no, no se ve el cambio).
- Chrome empieza a dar capturas en blanco tras ~12 000 cuadros: `render.mjs` recarga la página cada 2500 cuadros.
- Todo el estado es función del tiempo absoluto `t` (nada acumulado): así cualquier rango se puede re-renderizar igual.
- Contadores: usar `Math.floor` por pasos, no `clamp` (si no, el número se queda fijo).
- Colores de muros contra el fondo: probar con stills; un muro claro sobre papel claro desaparece.
- Revisar stills de cada sección antes del render completo (≈ 30 min para 11 min de video).
