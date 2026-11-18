# Editor 51 — receta (persona a cámara + imágenes editoriales a pantalla completa)

Referencia: `~/Desktop/editor 51.mp4` (reel de Lucca Vila, 46 s). Primer uso: ads del curso de Manu (27 oct 2026),
ejemplo terminado en `proyectos/bgi_ads/ad7` (proyecto.json, imagenes.json, pages.txt).

## El estilo
- La persona a cámara en vertical (recorte 9:16 siguiendo la cara, sin zooms) y, cada 2–4 s, una **imagen a pantalla
  completa de 1.5–2.5 s** que ilustra literalmente la frase (metáfora visual). Las imágenes cubren ~40–50 % del video;
  el gancho (primeros ~1.5 s) y el CTA del botón van con la persona.
- Imágenes con look de **foto real documental/editorial/archivo** (35 mm, grano, luz imperfecta, colores apagados).
  Saúl pidió que NO parezcan gráficos hechos con IA: nada de texto, logos, 3D de plástico, brillos, ilustraciones ni
  interfaces inventadas. Se generan con GPT Image 2.5 en Higgsfield (0.25 créditos c/u) o se bajan de internet.
- Subtítulos chicos a la izquierda: `s:` Helvetica + la palabra clave en `i:` (Instrument Serif itálica). Sin `B:`
  (palabras gigantes), sin cajas ni píldoras. 1–3 renglones por frase.
- Velo oscuro fijo abajo (`"estilo51": true`), así el texto blanco se lee sobre camisa blanca o fondos claros.
- Música ambiental/pulsos de Epidemic, baja (`volumen_musica` 0.3). Flecha en "botón aquí abajo".

## Pasos (desde `editor/`)
1. `proyecto.json`: fuente, cortes (segundos de la fuente; transcripción en `fuente.txt`), `"vertical": true`,
   `"sin_zoom": true`, `"lado": "izquierda"`, `"texto_y": 1300`, `"tam_chica": 58`, `"estilo51": true`,
   `"musica": <carpeta>`, `"volumen_musica": 0.3`, `"ducking": 0.55`, `"flecha": {}`, `vocabulario`, `equivalentes`, `salida`.
2. `editar.py <p> plan` → `editar.py <p> armar` (≈ 3 min). Lee las frases con sus tiempos del ARMADO.
3. `imagenes.json`: `[{"a", "b", "prompt"}]` en tiempos del armado. Prompt en inglés, concreto (lugar, época, luz,
   objeto), terminado en `; full-bleed photo filling the whole vertical frame, no faces in the lower half`.
   (NO pedir "lower third darker": salen imágenes partidas con media foto negra.)
4. `imagenes51.py <p> --hoja` → genera, arma clips (deriva lenta, grano), pega bordes a los cortes, corre stock.py y
   escribe `broll`. Ver `imagenes51_hoja.jpg`; si una imagen trae texto, cara rara o se ve "IA", borra `img/NN.png`
   y `img/NN.mp4`, cambia el prompt y vuelve a correr.
5. `stock_encima.py <p>` → `pages.txt` → `editar.py <p> terminar` (render + todas las revisiones + entrega).

## Trampas
- Whisper escribe "Cloud"/"cloth" por Claude y "Chagipiti"/"chai gpt" por ChatGPT: en subtítulos va bien escrito y en
  `proyecto.json` → `"equivalentes": {regex: reemplazo}` para que revisar_audio.py no lo marque. `"uniones_ok": [i]`
  solo para uniones que ya revisaste y están bien.
- Nombres que no se entienden (p. ej. "DOT"/"GrokBot" en C3495): mejor sacar ese tramo que subtitular algo inventado.
- "rebanada de persona" en revisar_cortes: imagenes51.py ya estira la imagen hasta el corte si quedan < 0.35 s.
