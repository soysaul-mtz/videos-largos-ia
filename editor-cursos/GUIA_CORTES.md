# Guía de cortes — capítulos CURSO de la instructora (Meta Ads)

Objetivo: de cada grabación cruda sacar **un video por capítulo**, limpio, como si la instructora lo hubiera dicho de corrido.
El motor (`armar.py`) arma el video a partir de un JSON por capítulo; tú solo decides QUÉ tramos del original se quedan.

## Datos de cada fuente
Llaves de fuente → archivo en `archivos.json` (c02, c07, c10, c15, r1…r5).
- `t<llave>/texto.txt` — transcripción por frases `[mm:ss.s – mm:ss.s]` (tiempos aproximados; pasan de 60 min como 75:12.3).
- `t<llave>/palabras.json` — cada palabra con `a`/`b` en segundos del original. **Usa esto para los bordes exactos.**
- `t<llave>/clase.json` — 4 cuadros/s; `azul > 60` = la instructora a cámara completa (fondo azul). El motor lo usa solo.
- Para ver palabras + mapa de voz de una ventana: `editor-testimoniales/editor/.venv/bin/python ventana.py <llave> <a> <b> [<a2> <b2> ...]`
  (mapa: un carácter = 0.1 s; `#`/`+` = voz, `.` = silencio). Úsalo en cada corte dudoso: Whisper "limpia" tartamudeos y junta retomas.
- Para ver la imagen: `/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg -v error -ss <t> -i "<archivo>" -frames:v 1 -vf scale=960:-1 <scratch>/x.jpg` y leerla.
  Las láminas de título dicen "CAPÍTULO NN · …" arriba a la izquierda: úsalas para numerar el capítulo.

## Formato del JSON (uno por capítulo): `capNN.json` en editor-cursos/
```json
{"salida": "Capítulo 03.mp4",
 "piezas": [{"src": "c02", "camara": null, "keep": [[55.4, 79.6], [80.1, 120.0, "xa"], ...]}],
 "cola": 1.0}
```
- `keep` en segundos del ORIGINAL, en orden. Un tramo puede ser largo (minutos) si todo dentro está bien: los silencios > 1 s dentro de un tramo el motor los recorta solo a 0.4 s.
- Bordes: el motor pega cada borde a la palabra más cercana y a la voz real (energía). Si el corte cae a media frase, junto a una retoma que sigue de corrido, usa modo exacto:
  `"x"` ambos bordes exactos · `"xa"` solo inicio exacto · `"xb"` solo final exacto. En modo exacto pon el borde ~0.05–0.1 s antes de la primera palabra / ~0.15–0.25 s después de la última, verificado con ventana.py.
- `camara: null` siempre (el motor decide cámara/pantalla cuadro a cuadro).
- Si Whisper escribe mal nombres en los subtítulos a cámara, agrega `"sub_fix": {"mal": "bien"}`.

## Reglas (lo que Saúl corrigió en los módulos de David — aplicarlas todas)
1. **Retomas:** si repite una frase o arranca de nuevo ("Hola, ¿qué tal? Bienvenidos… Hola, ¿qué tal? Bienvenidos…", "Realmente no… Realmente este botón no te… Realmente este botón de aquí no te permite…"), se queda SOLO la última versión completa. Corta el arranque fallido entero, sin dejar "y", "eh", media palabra ni la primera sílaba.
2. **Plática de grabación fuera:** "salimos de presentación", "¿me prestas la sillita?", "ay no, perdón", "me voy desde el inicio", "ok", risas, instrucciones al equipo, conteos, "¿ya?", etc.
3. **Equivocaciones:** si dice algo mal y se corrige, queda solo lo correcto. Si una frase queda trabada o mocha y no hay retoma, córtala si no se pierde la idea; si se pierde la idea, déjala y anótala como dudosa.
4. **No cortar ideas:** cada corte debe dejar una frase completa que se entienda. Saúl reclamó un "corte brusco donde se pierde la idea". Mejor dejar algo de más que comerse el sentido.
5. **Inicio y fin del capítulo:** arranca en el saludo/arranque bueno ("Hola, ¿qué tal? Bienvenidos a este nuevo capítulo…") y termina en el cierre bueno ("…y hasta aquí termina este capítulo… puedes seguir con el siguiente"). Si hay varios cierres, el último completo.
6. **Pantalla:** si en un tramo hay errores visibles en pantalla (login fallido, contraseña incorrecta, ventanas equivocadas) y ella lo menciona como error, córtalo. Demostraciones normales en pantalla se quedan aunque haya silencio (el motor recorta pausas).
7. **No censurar nada** (no uses `tapar`). Si ves una tarjeta completa, contraseña o algo muy delicado, solo anótalo en el reporte.
8. Sin música, sin zooms, sin avance rápido: ya lo hace el motor, no lo pidas.

## Verificación antes de entregar tu parte
- `python3 armar.py capNN.json --solo-plan` debe correr sin error (imprime minutos y segmentos).
- Revisa con ventana.py CADA borde de keep que caiga a menos de 1.5 s de otra voz (retoma/plática): que no entre ni una sílaba de lo cortado.
- Reporte final: por capítulo → número y título (de la lámina), fuente y rango, duración estimada, lista de cortes hechos (qué se quitó, en qué segundo del original) y dudas.
