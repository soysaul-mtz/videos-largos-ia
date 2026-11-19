# Proyecto base · Plantilla larga 3 · Testimonios

1. `compilado.json` trae la estructura completa: gancho (3 frases) → puente → testimonios → prueba → remate → cierre.
2. Todo lo que dice `CAMBIA` es relleno. Cambia cada ruta `CAMBIA/…` por el archivo real (ruta completa o relativa a esta carpeta).
3. Antes, transcribe los testimonios (`transcribir.py`) y lista las tomas de evento (`tomas.py`): de ahí salen `de`, `a` y los subtítulos.
4. En cada testimonio cambia `quien`, `dice` (la frase copiada de la transcripción), `de` y `a` (segundos del archivo original).
5. Los subtítulos (`subs`) llevan solo el remate: máximo 7 palabras, en minúsculas; su `de` se cuenta desde el inicio del bloque.
6. En cada toma de apoyo cambia `fuente`, `de` (segundo del video de evento) y `dur`. Ninguna toma se repite en todo el video.
7. Repite los testimonios tipo A, B y C hasta llenar la duración (unos 11 en 3 minutos). Quita los bloques que no uses.
8. Subida de sonido del puente: sirve `../../audio/sfx/riser.mp3`. Si no hay cortinilla para el logo, borra `"sonido"` del último bloque.
9. Los renglones `_ayuda` y `seccion` son notas para ti: se pueden dejar o borrar.
10. Enseña el plan y espera el «sí»: `.venv/bin/python plantillas/testimonios/armar.py proyectos/<video>/compilado.json --plan`
