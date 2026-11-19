# Interfaz local

Una página que corre **solo en tu computadora** para usar el sistema sin escribir comandos: enseña el menú de
plantillas, crea pedidos, enseña el avance y recoge tus aprobaciones. Quien edita los videos es Claude Code; la
interfaz no edita nada.

## Cómo abrirla

- Doble clic en **`Abrir plantillas.command`** (en la carpeta principal), o
- en la terminal: `./abrir.sh`

Se abre en el navegador, en `http://127.0.0.1:8770` (si ese número está ocupado usa el siguiente). Deja abierta la
ventana de Terminal mientras la uses; al cerrarla se cierra la interfaz. Si ya estaba abierta, solo vuelve a abrir el navegador.

No usa internet ni instala nada: Python 3 de la Mac (o el de `.venv`) y una página sin librerías.

## Las cuatro pestañas

| Pestaña | Para qué |
|---|---|
| **Plantillas** | El menú: clip de muestra, imágenes, para qué sirve y qué necesitas. |
| **Nuevo video** | Das UN video, marcas una o varias plantillas y creas el pedido. |
| **Mis videos** | Cómo va cada pedido y lo que te toca aprobar: plan, escaleta y fotos. Al final, el video. |
| **Nueva plantilla** | Crear una plantilla tuya a partir de un video, de imágenes o describiéndola. |

## Dónde quedan los archivos

| Carpeta | Qué hay |
|---|---|
| `entrada/` | La copia de los videos e imágenes que subes. El original no se toca. Si el nombre ya existe, lleva sufijo (`-2`). |
| `pedidos/<id>/pedido.json` | Lo que pediste. El id es `AAAAMMDD-HHMM-nombre`. |
| `pedidos/<id>/brief.md` | Solo en plantillas nuevas: lo que escribiste en «Lo describo yo». |
| `pedidos/<id>/estado.json` | En qué va (lo escribe Claude). |
| `pedidos/<id>/respuestas/001.json…` | Tus aprobaciones y cambios pedidos. |
| `pedidos/<id>/claude.json`, `claude.log` | Solo en modo automático: la conversación de Claude de ese pedido y lo que imprimió. |
| `proyectos/<id>-<plantilla>/salida/` | Los videos terminados. |

El formato exacto de esos archivos está en `CLAUDE.md › Pedidos de la interfaz`. `entrada/` y `pedidos/` no se suben a git.
La interfaz no borra pedidos ni videos; para borrar uno, borra su carpeta.

## Cómo empieza el trabajo

Después de crear un pedido hay dos caminos:

- **A mano (siempre):** abre Claude Code en esta carpeta y pega `Haz el pedido <id>`. Después de cada aprobación: `Sigue con el pedido <id>`.
- **Automático (si Claude Code está instalado):** el botón «Empezar ahora». La interfaz ejecuta Claude Code sin ventana,
  en esta carpeta, hasta el siguiente punto donde necesita tu «sí». Cuando respondes en la página, lo vuelve a lanzar
  y continúa la misma conversación. Un solo pedido a la vez: los demás esperan en cola. «Detener» lo para; si se
  detiene solo, la página lo dice y ofrece «Reintentar» o el camino a mano. Al cerrar la interfaz se detiene también.

### Con qué permisos corre Claude en automático

```
claude -p "<instrucción fija con el id del pedido>" --output-format json
       --permission-mode acceptEdits
       --allowedTools "Bash,Read,Glob,Grep"
       --disallowedTools "Bash(sudo:*),Bash(git push:*)"
       --permission-prompts none --strict-mcp-config
       --session-id <uuid>      (la primera vez)   |   --resume <uuid>   (las siguientes)
```

- Puede leer, crear y editar archivos **dentro de esta carpeta** y ejecutar comandos (ffmpeg, node, python…) sin
  preguntar: editar video lo exige. Ojo: un comando puede tocar archivos de fuera de la carpeta; es el mismo alcance que
  tiene Claude Code cuando le dices «sí a todo» en la terminal, y sigue obligado por las reglas de `CLAUDE.md`.
- No corre como administrador (`sudo`) ni sube nada con git.
- Todo lo demás que pediría permiso (conectores de correo, Drive, etc.; editar con sus herramientas fuera de la
  carpeta) se **niega solo**, porque no hay nadie que conteste. No se usa `--dangerously-skip-permissions`.
- La instrucción es fija: lo único que cambia es el id del pedido. Lo que escribes en la página (notas, cambios) nunca
  entra al comando; Claude lo lee de `pedido.json` y de `respuestas/`.
- Usa tu cuenta y tu plan de Claude Code, igual que en la terminal.

## Seguridad

- Solo escucha en `127.0.0.1`: nadie más en tu red puede entrar.
- Solo lectura, y solo de: `plantillas/*/muestra/`, `pedidos/`, `proyectos/*/fotos/`, `proyectos/*/salida/` y los
  `.md`, `.jpg`, `.png` o `.mp4` que un `estado.json` nombre.
- Lo único que escribe: `entrada/` (lo que subes) y `pedidos/` (pedidos, respuestas y el registro del modo automático).

## Archivos

`servidor.py` (servidor y modo automático, solo librería estándar) · `pagina.html` · `app.js` · `app.css`.
Opciones para pruebas: `--sin-navegador`, `--puerto N`, `--plantillas <carpeta>`.
