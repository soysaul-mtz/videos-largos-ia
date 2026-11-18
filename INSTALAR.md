# Instalación (para Claude)

Sigue estos pasos en orden y explícale cada uno a la persona en una línea, en español sencillo.

1. **Revisa sin instalar:** `scripts/requisitos.sh`. Enséñale la lista: qué ya tiene (✓) y qué falta (✗).
2. **Instala solo lo que falta:** `./instalar.sh`. Nunca reinstala lo que ya está. Si Homebrew pide la contraseña de la
   Mac, la escribe la persona en su Terminal: tú no la pidas por el chat. La primera vez baja ≈ 1.6 GB (el modelo que
   transcribe la voz en la computadora).
3. **Comprueba:** `./verificar.sh`. Renderiza una demo de cada estilo. Abre los videos y confirma que se ven.
4. **Baja los videos de referencia:** `scripts/bajar_estilos.sh` → `referencias/` (≈ 355 MB). Ábrele la carpeta.
5. **Pregunta sus datos** y guárdalos en `config/marca.json` (créalo): nombre de la marca, colores (hex), tipografía si
   tiene, logo (PNG oficial, nunca generado ni redibujado) y carpeta de música con licencia.

## Qué instala y para qué

| Programa | Para qué se usa aquí |
|---|---|
| ffmpeg y ffmpeg completo | Cortar, unir, mezclar audio y quemar subtítulos |
| Node 20+ y Google Chrome | El motor dibuja cada cuadro en Chrome |
| Python 3.13 (carpeta `.venv`) | Cortes, transcripción local (Whisper), revisiones |
| Herramientas de Apple (swift) | Detectar la cara en cada cuadro y recortar la silueta de la persona |

No instala nada más. No pide cuentas ni llaves. La música la pone la persona (carpeta propia con licencia).

## Otras computadoras

El motor de estilos (`motor/`) funciona en Windows y en Mac Intel con Node, Chrome, ffmpeg y Python con
`faster-whisper` en lugar de `mlx-whisper`. Lo que es solo de Mac con chip Apple: la silueta de la persona
(`--mascaras`, texto detrás de la persona) y `editor-vsl/` (detección de cara con Vision). Si la persona no tiene Mac
con chip Apple, díselo antes de empezar y trabaja sin esas dos partes.

## Si algo falla

- `✗ poco espacio`: un video de 10 min ocupa ≈ 6 GB mientras se edita. Libera espacio o borra `proyectos/<viejo>/cuadros`.
- `no encuentro Google Chrome`: instálalo o define `CHROME=/ruta/al/chrome`.
- Un bloque del render falla: vuelve a correr el mismo comando; los bloques hechos se conservan.
