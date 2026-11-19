// Junta todos los .svg de esta carpeta en iconos.js (para que el estilo los tenga listos sin esperar descargas).
// Uso (cada vez que agregues o cambies un ícono):  node plantillas/cinetico/iconos/armar.mjs
// Sirven íconos de LÍNEA con viewBox de 24×24 (los de Tabler Icons). El nombre del archivo es el nombre del ícono.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = path.dirname(fileURLToPath(import.meta.url)), sal = {};
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.svg')).sort()) {
  const svg = fs.readFileSync(path.join(DIR, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const dentro = (svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/) || [])[1] || '';
  sal[f.replace(/\.svg$/, '')] = dentro.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
}
fs.writeFileSync(path.join(DIR, 'iconos.js'), '// Hecho con armar.mjs: no lo edites a mano.\nexport default ' + JSON.stringify(sal, null, 1) + ';\n');
console.log(Object.keys(sal).length + ' íconos → iconos.js');
