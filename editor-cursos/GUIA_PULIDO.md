# Pulido de trabas sobre el video YA editado

El primer pase de cortes (GUIA_CORTES.md — léela, mismas herramientas y reglas) se hizo sobre la transcripción del original, que se come tartamudeos y junta retomas.
Ahora hay transcripción literal del video editado, pedazo por pedazo: `revision/capNN_texto.txt`
(`[m:ss–m:ss] ✂<cortes dentro> texto` — tiempos del VIDEO editado, que ya incluye 8 s de intro al inicio).
"¡Suscríbete al canal!" al inicio/final es Whisper inventando sobre la música de intro/outro: ignóralo.

## Qué buscar en el literal
- Frase repetida o arranque fallido que se quedó: "es decir si yo entro a mi… Es decir, si yo entro a mi perfil", "tienen el acceso a las… y tienen el acceso a las páginas".
- Autocorrección: "Y tienen… Pueden tener", "Porque Meta no te… busca".
- Palabras sueltas o mochas sin sentido: "Kik", "¿Quiere?", "A ver,", "Para tener…" que no continúa, "eh", "este…" largos.
- Plática de grabación que se coló.
- Cortes (✂) donde se pierde la idea o queda media palabra.
No toques muletillas naturales cortas si cortarlas deja la frase rara; la prioridad es que suene de corrido y se entienda.

## Cómo corregir
1. Tiempo del editado → original: `python3 inverso.py capNN <seg_editado> ...` (ya resta la intro; da src, segundo del original y el tramo `keep` que lo contiene).
2. Mira el original con `ventana.py <llave> <a> <b>` (palabras + mapa de voz) para encontrar los bordes exactos de lo que sobra.
3. Edita `capNN.json` → `piezas[0].keep`: parte el tramo en dos dejando fuera lo que sobra, usando modos exactos (`"xb"` en el final del primero, `"xa"` en el inicio del segundo; o `"x"`). Respeta los modos que ya había. No toques `tapar` ni `cubrir`; si partes un tramo que tenía una caja o cubrir encima, no pasa nada (se aplican por tiempo del original).
4. Re-verifica la unión nueva: transcribe ~1.5 s a cada lado con ventana.py; que no entre ni una sílaba de lo quitado.
5. `python3 armar.py capNN.json --solo-plan` sin error. NO hagas render completo.

## Reporte final (lo único que se lee)
Por capítulo: cada traba arreglada (tiempo en el editado, qué decía, qué quitaste en segundos del original) y lo que dejaste a propósito y por qué. Conciso.
