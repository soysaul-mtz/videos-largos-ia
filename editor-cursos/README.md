# Editor de cursos (clases horizontales largas)

Para grabaciones de clases o módulos: la persona a cámara + su pantalla, de 30 min a 2 h por archivo, que se entregan
**por capítulo**, horizontales, limpias "como si lo hubiera dicho de corrido". Se usó en los cursos de Meta Ads y de
automatización (≈ 25 capítulos, más de 6 horas en total).

## Cómo se usa
1. Pon las grabaciones en `fuentes/` (o exporta `CURSO_FUENTES=/ruta/a/tus/videos`) y anótalas en `archivos.json`
   (`{"c02": "archivo.mov", ...}`: una llave corta por grabación).
2. Transcribe cada fuente: `transcribir_largo.py` (deja `t<llave>/texto.txt` y `t<llave>/palabras.json`), luego
   `clasificar.py` (`t<llave>/clase.json`: en qué cuadros la persona sale a cámara completa) y `energia_cache.py <llaves>`.
3. Escribe un `capNN.json` por capítulo con los tramos que se quedan. **Lee `GUIA_CORTES.md` completa**: formato, modos
   de borde exacto (`x`, `xa`, `xb`) y las reglas de retomas.
4. `python3 armar.py capNN.json --solo-plan` → revisa minutos y segmentos. Luego `python3 armar.py capNN.json` → `fuentes/Editados/`.
5. Pulido: `literal_todo.py capNN` transcribe el editado pedazo por pedazo; se corrigen trabas con `GUIA_PULIDO.md`
   (`inverso.py` tiempo editado → original, `ventana.py` palabras + mapa de voz de una ventana).

## Lo que hace solo el motor
- Pega cada borde a la palabra y a la voz real; silencios de más de 1 s se recortan a 0.4 s. Sin avance rápido ni zooms.
- Decide cuadro a cuadro si es cámara o pantalla. Subtítulos **solo cuando la persona sale a cámara completa**.
- Voz: filtro de ruido, EQ, de-esser, compresor, −16 LUFS. Si el micro entra por un solo canal, se usa ese en mono.
- Intro y outro opcionales: `fuentes/intro.mp4` y `fuentes/outro.mp4` (o `"intro"`/`"outro"` en el JSON).
  Si usas intro, `inverso.py`, `donde.py` y `literal_todo.py` suman su duración (`INTRO = 8.0`): cámbiala a la tuya o a 0.
- `tapar` (desenfoque en una caja) y `cubrir` (la imagen se toma de otro momento): ver `ejemplos/mod_con_tapar_y_cubrir.json`.

## Reglas que pidió el cliente (aplícalas siempre)
- Sin música, horizontal, sin zooms, sin avance rápido.
- Quitar retomas (queda la última versión completa), plática de grabación y equivocaciones; nunca cortar una idea a medias.
- Errores en pantalla (login fallido, contraseña incorrecta) se cortan o se tapan con toma de apoyo.
- **No censurar de más:** solo lo que la persona pide en la grabación ("pixeleen esto"). Antes de tapar algo, pregunta.
- Numera los capítulos con la lámina "CAPÍTULO NN" o con lo que dice la persona, no con el nombre del archivo.
