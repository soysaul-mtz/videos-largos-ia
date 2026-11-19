# Guía para videos largos de persona a cámara (estilo de marca)

Método para **cualquier video horizontal de persona a cámara**: clases, YouTube, VSL, presentaciones de asesor.
Es un estilo sobrio y elegante: lienzo con el fondo de la marca por el que viaja la cámara, pantalla dividida,
subtítulos por frase y cierre con el logo que brilla.

Para Claude: lee esta guía antes de editar un video largo de marca. Los colores, la tipografía, el logo y la música
se cambian por los de la marca; el método no. Se arma con `motor/` creando un estilo propio a partir de
`plantillas/_plantilla/` (fondo de la marca, encuadre `mitad` para la pantalla dividida y las piezas del catálogo de abajo).

## La idea

La persona habla a cámara y **nunca pasan más de unos 5 segundos sin que ocurra algo**: una animación, un acercamiento o una pantalla dividida. La cara casi nunca desaparece.

## Orden de trabajo

1. Fotogramas y transcripción con el tiempo de cada palabra.
2. Buscar tropiezos y repeticiones, y medir el silencio exacto donde se corta.
3. Descargar logo e íconos de internet y anotar de dónde salieron en `FUENTES.txt`.
4. **Storyboard con cuadros reales del motor y esperar la aprobación.** Nada se exporta antes.
5. Exportar por partes, con el audio aparte. Medir volumen y revisar los cuadros clave.
6. Entregar y comprobar la copia.

## Las 10 reglas que valen para cualquier marca

1. **Ritmo:** la primera animación entra en cuanto la persona dice su nombre. Entre animaciones, máximo unos 5 s a cámara.
2. **Lienzo:** la cámara viaja de la toma a un lienzo con el fondo de la marca, con curva suave y desenfoque de movimiento. Los paneles se alternan a derecha, izquierda, arriba y abajo.
3. **Animaciones encadenadas:** si una termina donde empieza la otra, la cámara pasa directo, sin regresar a la persona.
4. **Pantalla dividida:** la persona sigue hablando dentro de un marco y el texto queda al otro lado. Así la cara no desaparece.
5. **Acercamientos de corte:** de golpe y sin transición, de ×1.12 a ×1.20, en la frase clave. El encuadre va anclado arriba para que la cara no se salga.
6. **Tropiezos:** se quitan, y el corte se esconde en el viaje entre dos animaciones.
7. **Subtítulos por ideas, no palabra por palabra:** frases completas con puntuación, cortadas a mano; 1 o 2 palabras clave en negrita; 48 px abajo al centro, máximo unos 1300 px por línea. Entran en 3 cuadros y salen en 2.
8. **Dentro de una animación no hay subtítulo:** el texto animado ya dice la frase.
9. **Una sola tipografía, dos pesos:** el ligero para todo y el grueso solo para el dato clave. Sin sombras; para que el texto se lea, un velo degradado muy suave en el tercio inferior.
10. **Logos e íconos de internet, nunca generados ni redibujados.** PNG del sitio oficial. El video cierra con el logo que brilla: revelado de izquierda a derecha en 1.1 s, halo que respira, dos destellos diagonales y unos 4 s sostenido.

## Audio

- Música unos 17 dB bajo la voz. Cuando termina la voz sube unos 6 dB y se desvanece en 1.6 s.
- **La entrada fuerte de la canción se alinea con el revelado del logo**: se retrasa o se recorta la canción para que coincida.
- Un efecto de sonido en cada entrada de animación, unos 17 dB abajo y adelantado 0.12 s.
- Nivel final cerca de −14 LUFS, picos de −1.4 dB. El limitador (`alimiter`) lleva `level=0`; si no, vuelve a subir todo a 0 dB.

## Catálogo de animaciones para no repetir

| Lo que se dice | Animación |
|---|---|
| Presentación de la persona | Pantalla dividida + nombre grande en grueso |
| Una cantidad («16 semanas») | Contador que sube + una barra por unidad |
| Una lista de tipos de cliente | Tarjetas de cristal con ícono |
| Un proceso automático | Ventana → embudo → gráfica, con puntos de luz que viajan |
| Pasos en orden | Pantalla dividida + lista numerada que se palomea |
| «No es esto, sino esto» | Tachado fino + la palabra correcta gigante |
| «Los siguientes pasos» | Camino de nodos que se va dibujando |
| «Al siguiente nivel» | Escalones que suben; el último se ilumina |
| Inestable contra constante | Línea errática que se apaga y otra constante que crece |
| Despedida con cita | Pantalla dividida + calendario, y de ahí al logo |

## Notas

- **Exportación:** por bloques y un proceso a la vez, con prioridad baja.
- **Cortos contra largos:** en reels los subtítulos van palabra por palabra; en largo van por frase completa. No mezclar.
- **Tipografía:** usa la de la marca si tiene licencia; si no, una libre de Google Fonts en dos pesos (ligero y grueso).
