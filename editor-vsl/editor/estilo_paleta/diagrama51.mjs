// Diagramas de líneas finas con la paleta (estilo de los gráficos técnicos de la referencia Editor 51), animados → mp4 1080×1920.
//   node diagrama51.mjs <spec.json>   spec: {"tipo": "escalera"|"barras"|"flecha", "etiquetas": [...], "acento": i, "d": s, "salida": "x.mp4"}
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const S = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), FPS = 30000 / 1001, N = Math.ceil(S.d * FPS);
const html = `<!doctype html><html><head><style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#0A0F14}
#bg{position:absolute;inset:0;background:radial-gradient(ellipse at 15% 38%,rgba(198,96,31,.38),rgba(198,96,31,0) 55%),
 radial-gradient(ellipse at 90% 60%,rgba(46,111,115,.45),rgba(46,111,115,0) 55%),linear-gradient(#0A0F14,#0F3D3E)}
#grid{position:absolute;inset:0;background-image:radial-gradient(rgba(234,220,200,.16) 1.4px,transparent 1.6px);background-size:36px 36px}
svg{position:absolute;inset:0}
text{font-family:Menlo,monospace;font-size:30px;fill:#EADCC8;letter-spacing:2px}
</style></head><body><div id="bg"></div><div id="grid"></div><svg id="s" width="1080" height="1920"></svg>
<script>
const NS="http://www.w3.org/2000/svg", s=document.getElementById("s"), C="#EADCC8", O="#C6601F";
const el=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);s.appendChild(e);return e;};
const clamp=x=>Math.max(0,Math.min(1,x)); let items=[];
window.init=S=>{const L=S.etiquetas||[], n=L.length, ac=S.acento??-1;
  if(S.tipo==="escalera"){ const x0=150,y0=1420,sw=(800)/n,sh=150;
    L.forEach((t,i)=>{ const x=x0+i*sw,y=y0-i*sh, c=i===ac?O:C;
      const p=el("path",{d:"M"+x+" "+(y)+" L"+x+" "+(y-sh)+" L"+(x+sw)+" "+(y-sh),stroke:c,"stroke-width":i===ac?7:3,fill:"none"});
      const r=el("rect",{x:x+8,y:y-sh+8,width:sw-16,height:i*sh+sh-16+ (y0-y)*0,fill:i===ac?"rgba(198,96,31,.22)":"rgba(234,220,200,.05)"});
      r.setAttribute("height",Math.max(0,y0-(y-sh)-16));
      const tx=el("text",{x:x+10,y:y-sh-22}); tx.textContent=t.toUpperCase(); if(i===ac) tx.style.fill=O;
      const dot=el("circle",{cx:x+sw,cy:y-sh,r:9,fill:c});
      items.push({en:.15+i*(S.d-.6)/n,p,r,tx,dot,len:sh+sw}); });
  } else if(S.tipo==="barras"){ const x0=170,base=1450,bw=120,gap=(740-bw*n)/(n-1||1);
    el("line",{x1:120,y1:base,x2:960,y2:base,stroke:C,"stroke-width":3});
    L.forEach((t,i)=>{ const x=x0+i*(bw+gap),h=180+i*170, c=i===n-1?O:C;
      const r=el("rect",{x,y:base,width:bw,height:0,fill:i===n-1?"rgba(198,96,31,.85)":"rgba(234,220,200,.18)",stroke:c,"stroke-width":3});
      const tx=el("text",{x:x-6,y:base+50}); tx.textContent=t.toUpperCase(); tx.style.fontSize="24px";
      items.push({en:.15+i*(S.d-.6)/n,r,tx,h,base}); });
  }
  return true; };
window.frame=t=>{ for(const it of items){ const p=clamp((t-it.en)/.45), e=1-Math.pow(1-p,3);
  if(it.p){ it.p.setAttribute("stroke-dasharray",it.len); it.p.setAttribute("stroke-dashoffset",it.len*(1-e)); it.r.style.opacity=e; it.tx.style.opacity=clamp(p*2-.6); it.dot.style.opacity=p>.9?1:0; }
  else { it.r.setAttribute("height",it.h*e); it.r.setAttribute("y",it.base-it.h*e); it.tx.style.opacity=clamp(p*2-.4); } } };
window.__ok=true;
</script></body></html>`;
const dir = path.dirname(S.salida), tmp = path.join(dir, `_d_${path.basename(S.salida)}.html`); fs.writeFileSync(tmp, html);
const browser = await chromium.launch({ executablePath: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].find(f => fs.existsSync(f)), headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto("file://" + tmp); await page.waitForFunction(() => window.__ok === true); await page.evaluate(s => window.init(s), S);
const FR = path.join(dir, "_fr_" + path.basename(S.salida)); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR);
for (let i = 0; i < N; i++) { await page.evaluate(t => window.frame(t), i / FPS);
  fs.writeFileSync(path.join(FR, `f_${String(i).padStart(5, "0")}.jpg`), await page.screenshot({ type: "jpeg", quality: 92 })); }
await browser.close();
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "30000/1001", "-i", path.join(FR, "f_%05d.jpg"), "-vf", "noise=alls=5:allf=t,format=yuv420p",
  "-c:v", "libx264", "-crf", "17", "-preset", "fast", S.salida]);
fs.rmSync(FR, { recursive: true, force: true }); fs.rmSync(tmp, { force: true }); console.error("diagrama →", S.salida);
