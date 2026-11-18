# Videos largos con IA

Sistema para editar **contenido largo** (VSL, videos de YouTube, clases y cursos, compilados de testimonios) trabajando
con [Claude Code](https://claude.com/claude-code): tú pasas el video y dices qué estilo quieres; Claude lo corta, te
enseña el plan, arma las animaciones con código y entrega el MP4. No hace falta abrir ningún editor de video.

Todo corre en tu computadora. No usa generadores de video con IA, así que no gasta créditos por render.

## Qué trae

| Carpeta | Para qué |
|---|---|
| `estilos/neon` | VSL con gráficos animados sobre fondo oscuro con luces, tarjetas de datos, contadores y capturas de tu plataforma, con la persona en una ventana. |
| `estilos/cinetico` | VSL de persona a cámara con texto animado grande (delante y detrás de la persona) e insertos a pantalla completa. |
| `estilos/testimonios` | Compilado de testimonios (videollamadas, videos de celular) con tomas de apoyo y subtítulos solo en las frases clave. |
| `motor/` | El motor que dibuja los estilos cuadro por cuadro y arma el video por bloques. |
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
scripts/bajar_estilos.sh  # baja los 3 videos de referencia
```

Después abre la carpeta con Claude Code y pídele, por ejemplo:

> Edita este video con el estilo neón: /ruta/a/mi-video.mp4

Claude lee `CLAUDE.md`, te enseña el plan y la escaleta, y espera tu «sí» antes de renderizar.

## Los tres estilos

Cada estilo tiene su `ESTILO.md` con el desglose del video de referencia: ritmo, paleta, tipografía, cada pieza
animada y las reglas para que tu video se vea igual. Los videos de referencia se bajan con `scripts/bajar_estilos.sh`.

Para crear un estilo nuevo a partir de otro video, pídeselo a Claude: copia `estilos/_plantilla/`, saca los fotogramas
del video de referencia y programa las piezas (la guía está en `motor/README.md`).
