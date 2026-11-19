// Render del motor de videos largos.
//   node motor/render.mjs proyectos/<n> --fotos 1.5,4,9.2     fotos de esos segundos + hoja (para el storyboard)
//   node motor/render.mjs proyectos/<n> --desde 0 --hasta 20   una prueba de ese rango
//   node motor/render.mjs proyectos/<n>                        video completo: por bloques → une → mezcla el audio
//       --bloque 60 (segundos por bloque) · --rehacer 2,3 (vuelve a hacer esos bloques) · --sin-audio
// Cada bloque queda en salida/partes/: si algo falla o cambias un tramo, solo se repite ese bloque.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? (args[i + 1] ?? true) : null; };
if (!args[0] || args[0].startsWith('--')) { console.error('Uso: node motor/render.mjs proyectos/<nombre> [--fotos t1,t2] [--desde a --hasta b]'); process.exit(1); }
const PROY = path.resolve(args[0]);
const P = JSON.parse(fs.readFileSync(path.join(PROY, 'proyecto.json'), 'utf8'));
const NOMBRE_PLANTILLA = P.plantilla || P.estilo;   // "plantilla" en proyecto.json ("estilo" se sigue aceptando)
const ESTILO = path.join(RAIZ, 'plantillas', String(NOMBRE_PLANTILLA));
if (!fs.existsSync(path.join(ESTILO, 'estilo.js'))) { console.error(`✗ no existe la plantilla "${NOMBRE_PLANTILLA}" (carpetas en plantillas/)`); process.exit(1); }
const leer = (f, d) => (fs.existsSync(path.join(PROY, f)) ? JSON.parse(fs.readFileSync(path.join(PROY, f), 'utf8')) : d);
const info = leer('datos.json', {});   // lo escribe motor/preparar.py: fps, cuadros, tamaño y duración de la fuente
const nCuadros = fs.existsSync(path.join(PROY, 'cuadros')) ? fs.readdirSync(path.join(PROY, 'cuadros')).filter(f => f.endsWith('.jpg')).length : 0;
const fps = Number(P.fps || 30), W = 1920, H = 1080;
const DATOS = { proyecto: P, palabras: leer('palabras.json', []), subs: leer('subs.json', null), nCuadros, fpsFuente: info.fps || fps,
  anchoFuente: info.ancho || W, altoFuente: info.alto || H, dur: Number(P.dur || info.dur || 30),
  mascaras: fs.existsSync(path.join(PROY, 'mascaras')) && fs.readdirSync(path.join(PROY, 'mascaras')).some(f => f.endsWith('.png')) };
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
if (!CHROME) { console.error('✗ no encuentro Google Chrome (instálalo o define CHROME=/ruta/al/chrome)'); process.exit(1); }
const FF = process.env.FFMPEG || 'ffmpeg';

// ---- servidor local: /motor /estilo /proyecto /cuadros /mascaras /fonts ----
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4' };
const RUTAS = { motor: path.join(RAIZ, 'motor'), estilo: ESTILO, proyecto: PROY, cuadros: path.join(PROY, 'cuadros'), mascaras: path.join(PROY, 'mascaras'), fonts: path.join(RAIZ, 'fonts') };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]).split('/').filter(Boolean), base = RUTAS[u[0]], f = base && path.join(base, ...u.slice(1));
  if (u[0] === 'favicon.ico') { res.writeHead(204); return res.end(); }
  if (!f || !f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { console.log('  [no existe]', req.url); res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--force-color-profile=srgb', '--hide-scrollbars', '--enable-gpu', '--ignore-gpu-blocklist', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])] });
let page, INFO;
const abrir = async () => {
  if (page) await page.close();
  page = await browser.newPage();
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('  [página]', m.text()); });
  page.on('pageerror', e => console.log('  [página]', e.message));
  await page.setViewport({ width: W, height: H });
  await page.goto(`http://127.0.0.1:${srv.address().port}/motor/pagina.html`);
  await page.waitForFunction(() => window.init);
  INFO = await page.evaluate(d => window.init(d), DATOS);
};
await abrir();
const cuadro = async t => { await page.evaluate(t => window.pinta(t), t); return page.screenshot({ type: 'jpeg', quality: 93, optimizeForSpeed: true }); };
const cerrar = async cod => { await browser.close(); srv.close(); process.exit(cod); };
const DUR = INFO.dur, SAL = path.join(PROY, 'salida');
fs.mkdirSync(SAL, { recursive: true });

// ---- fotos (storyboard) ----
if (opt('--fotos')) {
  const dir = path.join(PROY, 'fotos'); fs.mkdirSync(dir, { recursive: true });
  const ts = String(opt('--fotos')).split(',').map(Number).filter(t => !isNaN(t)), lista = [];
  for (const t of ts) { const f = path.join(dir, `f_${t.toFixed(2).padStart(7, '0')}.jpg`); fs.writeFileSync(f, await cuadro(t)); lista.push(f); console.log(f); }
  if (lista.length > 1) {   // hoja con todas, para revisarlas de un vistazo
    const col = Math.min(4, lista.length), fil = Math.ceil(lista.length / col), txt = path.join(dir, '_lista.txt');
    fs.writeFileSync(txt, lista.map(f => `file '${f.replace(/'/g, "'\\''")}'\nduration 1`).join('\n'));
    spawnSync(FF, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', txt, '-vf', `scale=640:-2,tile=${col}x${fil}:padding=6:margin=6`, '-frames:v', '1', '-q:v', '3', path.join(dir, 'hoja.jpg')]);
    fs.rmSync(txt, { force: true }); console.log(path.join(dir, 'hoja.jpg'));
  }
  await cerrar(0);
}

// ---- render de un rango a un archivo (solo imagen) ----
async function rango(desde, hasta, archivo) {
  const i0 = Math.round(desde * fps), i1 = Math.round(hasta * fps), t0 = Date.now();
  const enc = spawn(FF, ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', String(fps), '-video_track_timescale', '90000', archivo + '.parcial.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = i0; i < i1; i++) {
    if (i > i0 && (i - i0) % 2500 === 0) await abrir();   // Chrome se satura en renders largos: se recarga la página
    const buf = await cuadro(i / fps);
    if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
    if ((i - i0) % 30 === 0) process.stdout.write(`\r  cuadro ${i - i0}/${i1 - i0} (${((Date.now() - t0) / 1000).toFixed(0)} s)   `);
  }
  enc.stdin.end(); const cod = await new Promise(r => enc.on('close', r)); process.stdout.write('\n');
  if (cod) throw new Error('falló ffmpeg al codificar ' + archivo);
  fs.renameSync(archivo + '.parcial.mp4', archivo);
}

// ---- audio: voz + música (bajo la voz) + efectos de las piezas; final a −14 LUFS ----
function mezclar(video, desde, hasta, salida) {
  const dur = hasta - desde, voz = path.join(PROY, 'voz.wav'), hayVoz = fs.existsSync(voz);
  const mus = P.musica ? path.resolve(PROY, P.musica) : null, hayMus = mus && fs.existsSync(mus) && !fs.statSync(mus).isDirectory();
  if (P.musica && !hayMus) console.log(`  (sin música: no encuentro ${mus})`);
  const SFX = path.join(RAIZ, 'audio', 'sfx'), fx = (INFO.sfx || []).filter(([n, t]) => t >= desde && t < hasta && fs.existsSync(path.join(SFX, n + '.mp3')));
  if (!hayVoz && !hayMus && !fx.length) { fs.renameSync(video, salida); return; }
  const ff = ['-y', '-v', 'error', '-i', video]; let fc = '', n = 1; const mz = [];
  if (hayVoz) { ff.push('-ss', String(desde), '-t', String(dur), '-i', voz); fc += `[${n}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2,apad,atrim=0:${dur}[v];`; mz.push('[v]'); n++; }
  if (hayMus) { ff.push('-stream_loop', '-1', '-ss', String(P.musica_desde || 0), '-i', mus);
    const db = Number(P.volumen_musica_db ?? -19), fin = Math.max(0, dur - 1.6);
    fc += `[${n}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${dur},loudnorm=I=-16:TP=-2,volume=${db}dB,afade=t=out:st=${fin}:d=1.6[m];`; mz.push('[m]'); n++; }
  fx.forEach(([nom, t, v], i) => { ff.push('-i', path.join(SFX, nom + '.mp3')); const ms = Math.max(0, Math.round((t - desde) * 1000));
    fc += `[${n}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms},volume=${v ?? .35}[f${i}];`; mz.push(`[f${i}]`); n++; });
  fc += `${mz.join('')}amix=inputs=${mz.length}:normalize=0:duration=longest,atrim=0:${dur},loudnorm=I=${P.lufs ?? -14}:TP=-1.4[a]`;
  ff.push('-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', salida);
  const r = spawnSync(FF, ff, { stdio: 'inherit' });
  if (r.status) { console.error('✗ falló la mezcla de audio; el video sin audio quedó en ' + video); return; }
  fs.rmSync(video, { force: true });
}

try {
  if (opt('--desde') !== null || opt('--hasta') !== null) {
    const desde = Number(opt('--desde') || 0), hasta = Math.min(DUR, Number(opt('--hasta') || DUR)), f = path.join(SAL, `prueba_${desde}-${hasta}.mp4`);
    await rango(desde, hasta, f + '.imagen.mp4');
    if (opt('--sin-audio')) fs.renameSync(f + '.imagen.mp4', f); else mezclar(f + '.imagen.mp4', desde, hasta, f);
    console.log('✓ ' + f);
  } else {
    const B = Number(opt('--bloque') || 60), partes = path.join(SAL, 'partes'), nB = Math.ceil(DUR / B);
    fs.mkdirSync(partes, { recursive: true });
    // si cambió el estilo, los beats o el proyecto, los bloques viejos ya no sirven
    const firma = [path.join(PROY, 'beats.js'), path.join(PROY, 'proyecto.json'), path.join(ESTILO, 'estilo.js'), path.join(ESTILO, 'estilo.css'), path.join(RAIZ, 'motor', 'nucleo.js')]
      .map(f => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0)).join('|') + `|${B}|${fps}`, fFirma = path.join(partes, 'firma.txt');
    const rehacer = opt('--rehacer') ? String(opt('--rehacer')).split(',').map(Number) : [];
    if (!rehacer.length && fs.existsSync(fFirma) && fs.readFileSync(fFirma, 'utf8') !== firma) {
      console.log('  cambió el proyecto o el estilo: se rehacen todos los bloques (para rehacer solo algunos: --rehacer 2,3)');
      for (const f of fs.readdirSync(partes)) if (/^p_\d+\.mp4$/.test(f)) fs.rmSync(path.join(partes, f));
    }
    fs.writeFileSync(fFirma, firma);
    const lista = [];
    for (let k = 0; k < nB; k++) {
      const f = path.join(partes, `p_${String(k + 1).padStart(3, '0')}.mp4`); lista.push(f);
      if (fs.existsSync(f) && !rehacer.includes(k + 1)) { console.log(`  bloque ${k + 1}/${nB}: ya estaba`); continue; }
      console.log(`  bloque ${k + 1}/${nB} (${k * B}–${Math.min(DUR, (k + 1) * B)} s)`);
      await abrir(); await rango(k * B, Math.min(DUR, (k + 1) * B), f);
    }
    const txt = path.join(partes, 'lista.txt'), union = path.join(SAL, '_union.mp4'), final = path.join(SAL, `${P.nombre || path.basename(PROY)}.mp4`);
    fs.writeFileSync(txt, lista.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    const r = spawnSync(FF, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', txt, '-c', 'copy', union], { stdio: 'inherit' });
    if (r.status) throw new Error('no pude unir los bloques');
    if (opt('--sin-audio')) fs.renameSync(union, final); else mezclar(union, 0, DUR, final);
    console.log(`✓ ${final} (${DUR.toFixed(1)} s, ${nB} bloque(s))`);
  }
  await cerrar(0);
} catch (e) { console.error('✗ ' + e.message); await cerrar(1); }
