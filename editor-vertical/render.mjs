// Render final: base vertical + subtítulos Saúl Pro + grano/viñeta (sin zoom, sin tocar el color) + audio original.
//   node render.mjs <n> [--desde s --hasta s] [--salida ruta] [--stills t1,t2]
import { chromium } from "playwright-core";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname), A = process.argv.slice(2), N = A[0];
const arg = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const P = f => path.join(HERE, N, f);
const SRC = JSON.parse(fs.readFileSync(path.join(HERE, "fuentes.json")))[N];
const SUBS = JSON.parse(fs.readFileSync(P(arg("--subs", "subs.json"))));
const BASE = P(arg("--base", "base.mp4"));
const probe = (f, e) => execFileSync("ffprobe", ["-v", "error", ...e, "-of", "csv=p=0", f]).toString().trim();
const FPS = probe(BASE, ["-select_streams", "v:0", "-show_entries", "stream=r_frame_rate"]);
const fps = eval(FPS), BDUR = +probe(BASE, ["-show_entries", "format=duration"]);
const D0 = +arg("--desde", 0), D1 = Math.min(+arg("--hasta", 1e9), BDUR + D0);   // la base puede ser un tramo (--desde)
const BOFF = +arg("--base-desde", 0);                                            // segundo de la fuente donde empieza la base
const LOOK = "vignette=angle=PI/7,noise=c0s=6:c0f=t";                            // grano solo en luz (sin verde)

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", e => console.error("página:", e.message));
await page.goto("file://" + path.join(HERE, "subs.html"));
await page.evaluate(j => window.__cargar(j), SUBS);
await page.waitForFunction(() => window.__ready === true);
const shot = async t => { await page.evaluate(t => window.__render(t), t); return page.screenshot({ type: "png", omitBackground: true }); };

if (A.includes("--stills")) {
  const dir = P("stills"); fs.mkdirSync(dir, { recursive: true });
  for (const t of arg("--stills").split(",").map(Number)) {
    const png = path.join(dir, "_ov.png"); fs.writeFileSync(png, await shot(t));
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t - BOFF), "-i", BASE, "-i", png, "-filter_complex", `[0:v]${LOOK}[b];[b][1:v]overlay`, "-frames:v", "1", "-q:v", "3", path.join(dir, `s_${t.toFixed(2)}.jpg`)]);
  }
  await browser.close(); console.error("stills en", dir); process.exit(0);
}

// cuadros del overlay: solo se dibujan los que tienen texto; el resto apunta a uno vacío
const FR = P("_ov"); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR);
fs.writeFileSync(path.join(FR, "vacio.png"), await shot(-100));
const nfr = Math.round((D1 - D0) * fps), t0 = Date.now();
const hay = t => SUBS.paginas.some(p => t >= p.ini - .12 && t <= p.fin + .04);
for (let i = 0; i < nfr; i++) {
  const t = D0 + i / fps, f = path.join(FR, `f_${String(i).padStart(6, "0")}.png`);
  if (hay(t)) fs.writeFileSync(f, await shot(t)); else fs.symlinkSync("vacio.png", f);
  if (i % 1500 === 0) console.error(`${N}: cuadro ${i}/${nfr}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
const OUT = arg("--salida", P("final.mp4"));
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(D0 - BOFF), "-t", String(D1 - D0), "-i", BASE, "-framerate", FPS, "-i", path.join(FR, "f_%06d.png"),
  "-ss", String(D0), "-t", String(D1 - D0), "-i", SRC,
  "-filter_complex", `[0:v]${LOOK}[b];[b][1:v]overlay=0:0:format=auto,format=yuv420p[v]`, "-map", "[v]", "-map", "2:a:0",
  "-c:v", "h264_videotoolbox", "-b:v", "14M", "-maxrate", "16M", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", OUT], { stdio: "inherit" });
fs.rmSync(FR, { recursive: true, force: true });
console.error(`listo → ${OUT}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
