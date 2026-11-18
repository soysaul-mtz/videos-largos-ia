# Horizontal a vertical (sin zooms)

Primera vez: `cd editor-vertical && npm install`.

1. Anota tus videos en `fuentes.json` (`{"vsl1": "/ruta/al/video.mp4"}`).
2. `./analiza.sh vsl1` → cortes de toma, caras y texto quemado por cuadro, transcripción.
3. `../.venv/bin/python clasificar.py vsl1` → `vsl1/tomas.json` (persona = recorte 9:16 a la cara; gráfico = panel completo con el mismo cuadro desenfocado detrás).
4. `../.venv/bin/python reencuadre.py vsl1 --stills 10,40,90` → revisa stills; luego sin `--stills` → `vsl1/base.mp4`.
5. `grupos.py` arma las páginas de subtítulos y `node render.mjs vsl1` los pone encima (no repite frases que el video ya trae escritas).

Escribe y aprueba una escaleta antes del render final. Trampa: el OCR lee texto en playeras; filtra por número de letras, no por posición.
