# Videos largos con IA

Plantillas para editar **contenido largo** (VSL, videos de YouTube, clases y cursos, compilados de testimonios) trabajando
con [Claude Code](https://claude.com/claude-code): tú pasas el video y dices qué plantilla quieres; Claude lo corta, te
enseña el plan, arma las animaciones con código y entrega el MP4. No hace falta abrir ningún editor de video.

Todo corre en tu computadora. No usa generadores de video con IA, así que no gasta créditos por render.

## Qué trae

| Carpeta | Para qué |
|---|---|
| `plantillas/neon` | **Plantilla larga 1 · Neón.** VSL con gráficos animados sobre fondo oscuro con luces, tarjetas de datos, contadores y capturas de tu plataforma, con la persona en una ventana. |
| `plantillas/cinetico` | **Plantilla larga 2 · Cinético.** VSL de persona a cámara con texto animado grande (delante y detrás de la persona) e insertos a pantalla completa. |
| `plantillas/testimonios` | **Plantilla larga 3 · Testimonios.** Compilado de testimonios (videollamadas, videos de celular) con tomas de apoyo y subtítulos solo en las frases clave. |
| `interfaz/` | La interfaz local (se abre en tu navegador, no sale de tu computadora): menú, pedidos, aprobaciones y plantillas nuevas. |
| `motor/` | El motor que dibuja las plantillas cuadro por cuadro y arma el video por bloques. |
| `editor-vsl/` | Corte del video crudo: quita retomas y silencios, empareja la voz, pone subtítulos y música, y revisa el resultado. |
| `editor-cursos/` | Clases y cursos de 30 min a 2 h: un video limpio por capítulo, sin retomas, subtítulos solo a cámara. |
| `editor-vsl-animado/` | VSL donde la voz va sobre escenas 3D hechas con código. |
| `editor-vertical/` | Pasa un video horizontal ya editado a vertical para Reels. |
| `guias/` | Método para videos largos de persona a cámara (ritmo, pantalla dividida, subtítulos por frase, cierre con logo). |

## Empezar

Necesitas una Mac con chip Apple (M1 o más nuevo) y Claude Code.

```bash
git clone https://github.com/soysaul-mtz/videos-largos-ia.git
cd videos-largos-ia
scripts/requisitos.sh     # te dice qué falta, sin instalar nada
./instalar.sh             # instala solo lo que falte
./verificar.sh            # renderiza las demos
./abrir.sh                # la interfaz: menú de plantillas, nuevo video, mis videos y nueva plantilla
```

En la interfaz (también se abre con doble clic en `Abrir plantillas.command`) sueltas tu video, marcas una o varias
plantillas y sigues el avance: ahí apruebas el plan, la escaleta y las fotos, y ahí aparece el video terminado.

También puedes trabajar hablando directo con Claude Code en esta carpeta. Por ejemplo:

> Edita este video con la plantilla Neón: /ruta/a/mi-video.mp4

Claude lee `CLAUDE.md`, te enseña el plan y la escaleta, y espera tu «sí» antes de renderizar.

## Las plantillas

El menú está en `menu/index.html` (con imágenes y clips) y en `PLANTILLAS.md` (en texto). Cada plantilla trae:

- `ESTILO.md`: cómo se ve (ritmo, colores, tipografía, cada animación con sus medidas) y cómo usarla.
- `ESCALETA-BASE.md`: la estructura del video por secciones, el material que hay que juntar y un guion-molde para grabarlo.
- `base/`: el proyecto en blanco. `scripts/nuevo.sh <plantilla> "<nombre>" [video]` lo copia a `proyectos/` listo para rellenar.
- `muestra/`: imágenes y un clip corto hechos con este mismo sistema, que se ven en el menú (`menu/index.html`).

No hace falta descargar ni guardar ningún video de ejemplo: todo lo que define a una plantilla está en esos archivos.

Para crear una plantilla nueva a partir de un video o de una imagen que te guste, pídeselo a Claude: «Crea una
plantilla larga nueva a partir de este video». Claude lo estudia en tu computadora (`scripts/desglosar.sh`), escribe
la ficha, programa las animaciones y la agrega al menú. Después ya no hace falta el video.
