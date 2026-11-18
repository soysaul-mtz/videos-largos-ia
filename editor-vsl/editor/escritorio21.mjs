// Editor 21 · Escritorio 3D — dibuja cada escena (mesa vista desde arriba + objetos que caen con rebote + flechas punteadas)
// cuadro por cuadro y la guarda como clip 1080×1920. Lo llama escritorio21.py:  node escritorio21.mjs <_escenas21_render.json>
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const S = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), FPS = 30000 / 1001;
const html = `<!doctype html><html><head><style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#d9ccb3}
#cam{position:absolute;inset:0;transform-origin:50% 45%}
#fondo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.o{position:absolute;transform-origin:50% 50%;opacity:0;will-change:transform,filter,opacity}
svg{position:absolute;inset:0}
</style></head><body><div id="cam"><img id="fondo"><svg id="svg" width="1080" height="1920"></svg></div><div id="fx" style="position:absolute;inset:0"></div>
<script>
const easeBack=p=>{const c=1.9;return 1+(c+1)*Math.pow(p-1,3)+c*Math.pow(p-1,2)};
const clamp=x=>Math.max(0,Math.min(1,x));
let E=null, F=[];
window.init=(fondo,e)=>{E=e;document.getElementById("fondo").src=fondo;const cam=document.getElementById("cam"),svg=document.getElementById("svg");
  document.querySelectorAll(".o").forEach(x=>x.remove()); svg.innerHTML="";
  E.objetos.forEach(o=>{const im=document.createElement("img");im.className="o";im.src=o.src;im.style.width=o.w+"px";
    im.style.left=(o.x-o.w/2)+"px";im.style.top=(o.y-o.w/2)+"px";(o.heroe?document.getElementById("fx"):cam).appendChild(im);o.el=im;});
  E.flechas.forEach((f,k)=>{const [x1,y1]=f.de,[x2,y2]=f.a, mx=(x1+x2)/2+(f.curva??70), my=(y1+y2)/2;
    const d="M"+x1+" "+y1+" Q"+mx+" "+my+" "+x2+" "+y2, NS="http://www.w3.org/2000/svg";
    const m=document.createElementNS(NS,"mask");m.id="m"+k;const mp=document.createElementNS(NS,"path");
    mp.setAttribute("d",d);mp.setAttribute("stroke","#fff");mp.setAttribute("stroke-width","14");mp.setAttribute("fill","none");m.appendChild(mp);svg.appendChild(m);
    const p=document.createElementNS(NS,"path");p.setAttribute("d",d);p.setAttribute("stroke","#2b2a26");p.setAttribute("stroke-width","5");
    p.setAttribute("fill","none");p.setAttribute("stroke-dasharray","13 11");p.setAttribute("stroke-linecap","round");p.setAttribute("mask","url(#m"+k+")");svg.appendChild(p);
    // punta de flecha en la dirección final de la curva
    const ang=Math.atan2(y2-my,x2-mx), h=document.createElementNS(NS,"path"), L=24;
    h.setAttribute("d","M"+(x2-L*Math.cos(ang-.5))+" "+(y2-L*Math.sin(ang-.5))+" L"+x2+" "+y2+" L"+(x2-L*Math.cos(ang+.5))+" "+(y2-L*Math.sin(ang+.5)));
    h.setAttribute("stroke","#2b2a26");h.setAttribute("stroke-width","5");h.setAttribute("fill","none");h.setAttribute("stroke-linecap","round");h.style.opacity=0;svg.appendChild(h);
    f.len=mp.getTotalLength();f.mp=mp;f.h=h;});
  return new Promise(r=>{const im=[...document.images];let n=0;const ok=()=>{if(++n>=im.length)r(true)};im.forEach(i=>i.complete?ok():(i.onload=ok,i.onerror=ok));});};
window.frame=t=>{const cam=document.getElementById("cam"), fin=E.d-.4;
  const heroe=E.objetos.find(o=>o.heroe), hp=heroe?clamp((t-heroe.en)/.35):0;
  let foco=Math.max(clamp(1-t/.22)*12, clamp((t-(fin-.28))/.28)*12*(heroe?0:1), hp*14);
  cam.style.transform="scale("+(1+.09*t/E.d)+") translate("+(-8*t/E.d)+"px,"+(-14*t/E.d)+"px)";
  cam.style.filter=foco>.2?"blur("+foco.toFixed(1)+"px)":"none";
  for(const o of E.objetos){const dur=o.heroe?.45:.32, p=clamp((t-o.en)/dur), k=easeBack(p), rot=o.rot||0;
    o.el.style.opacity=clamp(p*6);
    const sc=(o.heroe?.2:.15)+((o.heroe?1:1)-(o.heroe?.2:.15))*k, giro=rot-22*(1-k);
    o.el.style.transform="scale("+sc+") rotate("+giro+"deg)";
    const mb=(1-clamp(p*1.4))*9, hh=8+30*(1-clamp(p*1.3)), bb=12+26*(1-clamp(p*1.3));
    o.el.style.filter=(mb>.3?"blur("+mb.toFixed(1)+"px) ":"")+"drop-shadow(0 "+hh+"px "+bb+"px rgba(40,30,15,"+(o.heroe?.5:.38)+"))";}
  for(const f of E.flechas){const p=clamp((t-f.en)/.5);f.mp.setAttribute("stroke-dasharray",f.len);f.mp.setAttribute("stroke-dashoffset",f.len*(1-p));f.h.style.opacity=p>.92?1:0;}};
window.__ok=true;
</script></body></html>`;
const tmp = path.join(S.salida, "_esc.html"); fs.writeFileSync(tmp, html);
const browser = await chromium.launch({ executablePath: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].find(f => fs.existsSync(f)),
  headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto("file://" + tmp); await page.waitForFunction(() => window.__ok === true);
for (const [k, e] of S.escenas.entries()) {
  const out = path.join(S.salida, `${String(k).padStart(2, "0")}.mp4`), FR = path.join(S.salida, "_fr");
  fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR);
  const objs = e.objetos.map(({ el, ...o }) => o), fl = e.flechas.map(({ mp, h, ...f }) => f);
  await page.evaluate(([f, x]) => window.init(f, x), [S.fondo, { ...e, objetos: objs, flechas: fl }]);
  const N = Math.ceil(e.d * FPS);
  for (let i = 0; i < N; i++) { await page.evaluate(t => window.frame(t), i / FPS);
    fs.writeFileSync(path.join(FR, `f_${String(i).padStart(5, "0")}.jpg`), await page.screenshot({ type: "jpeg", quality: 92 })); }
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "30000/1001", "-i", path.join(FR, "f_%05d.jpg"),
    "-vf", "noise=alls=4:allf=t,vignette=PI/6,format=yuv420p", "-c:v", "libx264", "-crf", "17", "-preset", "fast", out]);
  fs.rmSync(FR, { recursive: true, force: true }); console.error(`escena ${k}: ${N} cuadros → ${out}`);
}
await browser.close(); fs.rmSync(tmp, { force: true });
