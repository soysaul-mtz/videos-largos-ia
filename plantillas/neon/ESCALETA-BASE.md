# Escaleta base · Plantilla larga 1 · Neón

La estructura del video, vuelta receta. Sirve para tres cosas: saber **qué va en cada parte**, saber **qué pedirle a la
persona** antes de editar y saber **cómo debe grabarlo** para que la plantilla funcione.
Las piezas (entre `comillas de código`) están explicadas en `ESTILO.md`. El proyecto en blanco con esta misma estructura
está en `base/` y se crea con `scripts/nuevo.sh neon "<nombre>" <video.mp4>`.

Video horizontal 16:9. Una persona a cámara + animaciones con datos + recorrido de su plataforma + 3 tomas de apoyo.

## 1. Las secciones, en orden

| # | Sección | Para qué sirve | % del video | En 3 min | En 6 min | En 10 min |
|---|---|---|---:|---:|---:|---:|
| 1 | **Gancho** | Nombrar el deseo del espectador, su dolor y el producto | 5 % | 9 s | 18 s | 30 s |
| 2 | **Promesa** | Decir qué se aprende o se recibe (2 pilares) y a qué resultado lleva | 5 % | 9 s | 18 s | 30 s |
| 3 | **Autoridad y prueba** | Demostrar con años, capturas y cifras que la persona ya lo logró | 6 % | 11 s | 22 s | 36 s |
| 4 | **Puente** | Pasar de «los números» a «te lo enseño por dentro» | 4 % | 7 s | 14 s | 24 s |
| 5 | **Recorrido** | Enseñar la plataforma o el producto por dentro, pantalla por pantalla | 48 % | 86 s | 173 s | 288 s |
| 6 | **Niveles** | Explicar cómo está ordenado (etapas, de cero a cien) | 4 % | 7 s | 14 s | 24 s |
| 7 | **Respaldo** | Enseñar el negocio real detrás: equipo, una cifra con su medio y todo lo que incluye | 9 % | 16 s | 32 s | 54 s |
| 8 | **Oferta** | El precio de hoy y por qué después será más caro | 7 % | 13 s | 25 s | 42 s |
| 9 | **Llamado a la acción** | Pedir el clic, dar la garantía y despedirse | 12 % | 22 s | 44 s | 72 s |
| | **Total** | | **100 %** | 180 s | 360 s | 600 s |

Los segundos son los porcentajes aplicados a cada duración: redondea siempre al final de la frase, nunca cortes una idea
para cuadrar el número. El orden no se cambia.

## 2. Qué se dice, qué piezas van y cómo se ve la persona

| # | Sección | Qué dice la persona (y una frase modelo) | Piezas, en este orden | Cómo se ve la persona |
|---|---|---|---|---|
| 1 | Gancho | El deseo del espectador, lo que hace sin resultado y el nombre del producto. «Si estás aquí es porque quieres [deseo] y estás cansado de [esfuerzo] sin [resultado]. Por eso creé [producto].» | `buscador` → `carrusel` → `cero` → `logo` (con destello) | A pantalla completa menos de 1 s al abrir (arranca muy cerca y se aleja). Después, oculta. |
| 2 | Promesa | Los dos pilares del producto y la meta de dinero o de resultado. «Aquí aprendes [pilar 1] y [pilar 2] para llegar a [meta 1] o [meta 2] al mes.» | `tarjeta` blanca → `tarjeta` roja → `grafica` | Oculta. |
| 3 | Autoridad y prueba | Los años de experiencia y sus cifras, una por frase. «Llevo [N] años en esto; hoy genero [cifra mensual] al mes y en el año fueron [cifra más grande].» | `trayectoria` → `capturas` → `tarjeta` azul → `capturas` + `contador` → `capturas` → `capturas` | Oculta. |
| 4 | Puente | Que va a enseñar el producto por dentro. «Más allá de los números, quiero que veas cómo es por dentro.» | `pantalla3d` → persona a cámara 2 s | Oculta durante la pantalla 3D; luego a pantalla completa, sin nada encima. |
| 5 | Recorrido | Qué hay en cada parte, una frase por pantalla: portada, 2 resultados de clientes, los contenidos uno por uno, lo exclusivo, el calendario y las grabaciones. «Cuando entras, lo primero que ves es [portada]… aquí está [contenido]…» | `pantalla` (una grabación seguida o varios beats) con `acercamientos` al abrir algo | En la **ventanita** de arriba a la derecha todo el tiempo. Llega volando (`tr: 0.8`) y sale por corte. |
| 6 | Niveles | Que hay un orden y que se puede avanzar a su ritmo. «Todo va paso a paso, de cero a cien; si ya sabes algo, te saltas etapas.» | Persona 1 s → `escalones` | A pantalla completa 1 s; luego oculta. |
| 7 | Respaldo | Quién está detrás y con qué lo lograron. «Hoy somos [N personas]; hemos generado [cifra] solo con [medio], y todo eso está aquí dentro.» | Persona → `apoyo` ×3 con un `rotulo` → `pastilla` → persona → `rejilla` | A pantalla completa con acercamiento (1.00 → 1.15) en las frases personales; oculta en las animaciones. |
| 8 | Oferta | El precio de hoy y la urgencia. «Hoy entras por [precio] y se te queda de por vida; si entras después será más caro.» | Persona (alejándose lento) → `precio` (con destello cuando sube) | A pantalla completa hasta 8 s, con alejamiento lento; oculta en la tarjeta del precio. |
| 9 | Llamado a la acción | La acción, la garantía y la despedida. «Dale clic al botón de aquí abajo; si en [plazo] no te sirve, [garantía]. Nos vemos dentro.» | Persona + `boton` → acercamiento → persona + `boton` | A pantalla completa todo el tiempo. Es el único tramo largo a cámara. |

## 3. Ritmo por sección

| # | Sección | Cambios por minuto | Cada cuánto cambia algo | Máximo seguido a cámara |
|---|---|---:|---|---|
| 1 | Gancho | 35–40 | cada 1.6 s (ninguna pieza dura más de 3 s) | 1 s |
| 2 | Promesa | 20 | cada 2 a 3 s (la `grafica` puede durar 5 s) | 0 s |
| 3 | Autoridad y prueba | 35–40 | cada 0.5 a 1.3 s en las capturas; hasta 3 s en la tarjeta azul | 0 s |
| 4 | Puente | 15 | la pantalla 3D dura hasta 5.5 s | 2.5 s |
| 5 | Recorrido | 16 | cada 3.7 s (cambio de página, clic o acercamiento) | 0 s a pantalla completa; nunca más de 8 s sin scroll ni clic |
| 6 | Niveles | 15 | los escalones se arman en 1 s y la bolita salta dos veces | 1 s |
| 7 | Respaldo | 21 | cada 2.8 s; tomas de apoyo de 0.9 a 2.9 s | 2.4 s sin movimiento |
| 8 | Oferta | 9 | dos momentos: persona y precio | 8.5 s, siempre con alejamiento lento |
| 9 | Llamado a la acción | 13 | cada 4.5 s (2 botones, 1 acercamiento, 1 corte) | 22 s; de esos, hasta 11 s sin nada encima |

Reparto de todo el video: 20 % persona a pantalla completa · 48 % grabación de pantalla con ventanita · 29 % animación ·
3 % tomas de apoyo. Destello blanco: 3 en un video de 3 minutos (gancho, cifra más grande, precio que sube).

## 4. Material que hay que pedirle a la persona (para un video de 3 minutos)

| Qué | Cuánto | Para qué sección |
|---|---|---|
| El video a cámara, horizontal, ya grabado con el guion de abajo | 1 | Todas |
| Grabación de pantalla de su plataforma o producto, en tema oscuro | 1 de 1.5 a 2 min, de corrido | Recorrido y puente |
| Logo redondo (PNG o SVG con fondo transparente) | 1 | Gancho y oferta |
| Portadas verticales de sus videos o publicaciones | 3 a 5 | Gancho (`carrusel`) |
| Los 2 pilares de su producto, con hasta 4 datos cada uno (nombre del dato y número real) | 2 pilares | Promesa |
| La meta de dinero o de resultado, en 2 escalones | 2 cifras | Promesa (`grafica`) |
| Años de trayectoria y miniaturas horizontales de su trabajo | 1 cifra + 8 miniaturas | Autoridad y prueba |
| Capturas reales de resultados (paneles de ventas o ingresos), nítidas, diciendo qué cifra se marca en cada una | 6 a 10 | Autoridad y prueba |
| Su cifra mensual y su cifra más grande (la del año o la total) | 2 cifras | Autoridad y prueba |
| Nombres de sus etapas o niveles | 5 o 6 | Niveles |
| Tomas de apoyo del negocio real (equipo, oficina, evento), en video o foto | 3 distintas | Respaldo |
| Tamaño del equipo, y una cifra con el medio con que se logró | 2 datos | Respaldo |
| Portadas de lo que incluye (cursos, módulos, bonos), con título y una línea cada una | 6 o más | Respaldo (`rejilla`) |
| La oferta: nombre, enlace, precio de hoy, precio de después, 3 datos (miembros, guías…), texto del botón y garantía | 1 juego | Oferta y llamado |
| Imagen de un objeto que represente el pilar (tarjeta, producto) y captura vertical de su perfil para el teléfono | 1 + 1 (opcionales) | Promesa y respaldo |
| Música con licencia, con pulso | 1 canción | Todo el video |

Si falta una cifra o una captura, **se pregunta**: no se inventa ni se deja el relleno.

## 5. Cómo grabarlo para que la plantilla funcione

- Horizontal, 1080p o más, cámara fija a la altura de los ojos. Plano medio corto: de la cabeza a medio pecho, la cara al centro.
- Deja aire arriba de la cabeza (el acercamiento se ancla arriba) y el pecho libre (ahí va el botón).
- Fondo real con tonos fríos u oscuros si se puede: combina con el fondo neón de las animaciones.
- Graba el guion por secciones, de corrido. Entre secciones, una pausa de 1 s.
- Las cifras se dicen completas y despacio, **una por frase**: cada cifra dispara una pieza.
- El recorrido se graba **aparte** como grabación de pantalla, en tema oscuro, sin la barra del navegador, sin dejar de mover
  (scroll, clic o cambio de sección cada 3 o 4 s), en el mismo orden en que lo cuenta la voz. Para marcar una cifra, selecciónala con el cursor.
- La voz del recorrido se graba a cámara igual que el resto: la persona se verá en la ventanita.

### Guion-molde

1. **Gancho (9 s).** «Si estás aquí es porque quieres `[el deseo de tu cliente]`, y estás cansado de `[lo que hace sin parar]` sin
   `[el resultado que no llega]`. Por eso creé `[nombre de tu producto]`.»
2. **Promesa (9 s).** «Aquí vas a aprender `[pilar 1]` y `[pilar 2]`, para llegar a `[meta 1]` o hasta `[meta 2]` al mes `[con qué medio]`.»
3. **Autoridad y prueba (11 s).** «Llevo más de `[N]` años haciendo esto. Hoy `[mi negocio]` genera en promedio `[tu cifra mensual]`
   al mes; en el último año fueron `[tu cifra más grande]`, entre `[fuente 1]` y `[fuente 2]`.»
4. **Puente (7 s).** «Pero más allá de los números, quiero que veas cómo es por dentro. Te voy a enseñar qué hay.»
5. **Recorrido (86 s).** «Cuando entras, lo primero que ves es `[la portada]`. Mira el resultado de `[un cliente]`: `[su cifra]`. Y el de
   `[otro cliente]`. Aquí tienes `[contenido 1]`, `[contenido 2]`, `[contenido 3]`… Además `[lo exclusivo]`. Cada semana hay
   `[sesiones en vivo]`, y todo se queda grabado.»
6. **Niveles (7 s).** «Todo está ordenado paso a paso, de `[primer nivel]` a `[último nivel]`. Si ya sabes algo, te saltas etapas.»
7. **Respaldo (16 s).** «Para que tengas contexto: hoy somos `[N personas]` trabajando en esto. Hemos generado `[tu cifra]` solo con
   `[tu medio]`, fallando, probando y mejorando. Y todo eso está aquí dentro: `[lo que incluye]`.»
8. **Oferta (13 s).** «Hoy puedes entrar por `[tu precio]`, y ese precio se te queda `[condición]`. Si entras después, va a costar `[precio de después]`.»
9. **Llamado a la acción (22 s).** «Dale clic al botón de aquí abajo. `[Tu garantía]`. `[Última razón para entrar hoy]`. Nos vemos dentro.»

## 6. Si el video es más largo (10 a 20 minutos, tipo YouTube)

| Sección | Qué se hace |
|---|---|
| Gancho, promesa, puente | **No crecen** más allá de la columna de 10 minutos (30 s cada uno como máximo). Mantienen su ritmo: un cambio cada 1.6 s. |
| Autoridad y prueba | Se **repite** a media duración: otra racha de 2 a 4 `capturas` cada vez que se dice una cifra propia. El `contador` gigante sigue siendo uno solo. |
| Recorrido | Es lo que **se alarga**. Pártelo en capítulos de 2 a 3 minutos (uno por parte del producto). Entre capítulos: corte a la persona 2 a 5 s y un bloque de animación. |
| Niveles | Se **repite** como separador: los mismos `escalones`, con la bolita en la etapa del capítulo que empieza. |
| Respaldo | Se **repite** entre capítulos, con datos distintos cada vez (`pastilla`, `rejilla`, `apoyo` con `rotulo`). Ninguna toma de apoyo se repite. |
| Oferta | **Una sola vez**, al final. A la mitad del video se puede adelantar un `boton` de 3 s sin hablar de precio. |
| Llamado a la acción | **Una sola vez**, al final. No pasa de 75 s. |

Reglas que no cambian con la duración: la persona nunca aparece mientras hay una animación a cuadro completo, la ventanita
solo existe durante el recorrido, y un destello blanco por minuto como máximo.
