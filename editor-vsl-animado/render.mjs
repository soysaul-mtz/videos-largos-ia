// Render del VSL animado: node render.mjs [--desde 0] [--hasta 39] [--stills 1,2,3] [--salida archivo.mp4]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from '../motor/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FPS = '30000/1001', fps = 30000 / 1001, W = 1920, H = 1080;
const PROY = path.join(path.dirname(fileURLToPath(import.meta.url)), 'datos')   // pages.json + palabras.json + voz.wav;
const SFX = path.join(path.dirname(fileURLToPath(import.meta.url)), '../audio/sfx');

// ---- páginas de subtítulos (pages.txt) alineadas con las palabras de la voz ----
const voz = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos/palabras.json')));
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ]/g, '');
// pages.json del VSL testimonial: ya trae cada palabra con su tiempo y los nombres corregidos
const paginas = JSON.parse(fs.readFileSync(path.join(PROY, 'pages.json'))).map(p => ({ a: p.start,
  palabras: p.lines.flatMap(l => l.w.map(w => ({ txt: w.t, a: w.s, b: w.e, clave: l.st === 'B' }))) })).filter(p => p.palabras.length);
paginas.forEach((p, i) => {
  const ult = p.palabras.at(-1).b, sig = paginas[i + 1]?.a ?? ult + .6;
  p.b = sig - ult > .8 ? ult + .4 : sig;   // si hay pausa larga, el subtítulo se va antes
  p.palabras.forEach((w, j) => w.b2 = p.palabras[j + 1]?.a ?? p.b);
});
console.log(`  ${paginas.length} páginas de subtítulos`);
const nCuadros = fs.readdirSync(path.join(RAIZ, 'cuadros')).filter(f => f.endsWith('.jpg')).length;
const DATOS = { paginas, nCuadros, fpsFuente: 30000 / 1001 };

// ---- servidor local ----
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]), f = path.join(RAIZ, u.startsWith('/cuadros/') ? u : path.join('motor', u));
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
  args: ['--force-color-profile=srgb', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('  [página]', m.text()); });
page.on('pageerror', e => console.log('  [página]', e.message));
await page.setViewport({ width: W, height: H });
let BEATS;
const abrir = async () => { await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`); await page.waitForFunction(() => window.init); BEATS = await page.evaluate(d => window.init(d), DATOS); };
await abrir();
const cuadro = async (t, tipo = 'jpeg') => { await page.evaluate(t => window.render(t), t); return page.screenshot({ type: tipo, ...(tipo === 'jpeg' ? { quality: 92, optimizeForSpeed: true } : {}) }); };
fs.mkdirSync(path.join(RAIZ, 'salida'), { recursive: true });

if (opt('--stills')) {
  for (const t of opt('--stills').split(',').map(Number)) { const f = path.join(RAIZ, 'salida', `still_${t.toFixed(2)}.jpg`); fs.writeFileSync(f, await cuadro(t)); console.log(f); }
  await browser.close(); srv.close(); process.exit(0);
}

const desde = Number(opt('--desde') || 0), hasta = Number(opt('--hasta') || BEATS.at(-1).b), dur = hasta - desde, N = Math.round(dur * fps);
const salida = opt('--salida') || path.join(RAIZ, 'salida', `prueba_${desde}-${hasta}.mp4`), tmp = salida.replace(/\.mp4$/, '.video.mp4');
const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', FPS, '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', FPS, tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  if (i && i % 2500 === 0) await abrir();   // Chrome se satura en renders largos: se recarga la página
  const buf = await cuadro(desde + i / fps);
  if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
  if (i % 30 === 0) process.stdout.write(`\r  cuadro ${i}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
enc.stdin.end(); await new Promise(r => enc.on('close', r)); await browser.close(); srv.close();

// ---- audio: voz + música (se agacha cuando habla) + efectos en cada transición y en los momentos marcados ----
const fx = [];
for (const b of BEATS) {
  if (b.a > desde + .05 && b.a < hasta && b.trans && b.trans !== 'nada') fx.push(['whoosh_rapido', b.a - .12, .35]);
  for (const [n, t, v] of b.sfx) if (t >= desde && t < hasta) fx.push([n, t, v ?? ({ tic: .45, boom: .55, moneda: .5, listo: .5 }[n] ?? .4)]);
}
const musica = opt('--musica') || path.join(SFX, 'musica_timescale.mp3');
const ff = ['-y', '-v', 'error', '-i', tmp, '-ss', String(desde), '-t', String(dur), '-i', path.join(RAIZ, 'datos/voz.wav'), '-stream_loop', '-1', '-i', musica];
fx.forEach(([n]) => ff.push('-i', path.join(SFX, `${n}.mp3`)));
let fc = `[1:a]aresample=48000,loudnorm=I=-16:TP=-2,apad,atrim=0:${dur},asplit=2[v][vs];[2:a]aresample=48000,atrim=0:${dur},volume=0.22,afade=t=out:st=${Math.max(0, dur - 1.5)}:d=1.5[m0];[m0][vs]sidechaincompress=threshold=0.03:ratio=5:attack=10:release=300[m];`;
const mz = ['[v]', '[m]'];
fx.forEach(([n, t, v], i) => { const ms = Math.max(0, Math.round((t - desde) * 1000)); fc += `[${i + 3}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms},volume=${v}[f${i}];`; mz.push(`[f${i}]`); });
fc += `${mz.join('')}amix=inputs=${mz.length}:normalize=0:duration=first,atrim=0:${dur},loudnorm=I=-14:TP=-1[a]`;
ff.push('-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', salida);
const mux = spawn('ffmpeg', ff, { stdio: 'inherit' }); const cod = await new Promise(r => mux.on('close', r));
if (cod) { console.error('✗ falló la mezcla de audio'); process.exit(1); }
fs.rmSync(tmp, { force: true });
console.log(`\n✓ ${salida} (${dur.toFixed(1)} s, ${N} cuadros, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
