// Score aidStyle() (pulled straight out of index.html) against charted colours from enc.json.
const fs=require('fs');
const src=fs.readFileSync('F:/sailing-assistant/index.html','utf8');
const fn=src.slice(src.indexOf('function aidStyle(a){'),src.indexOf('function renderAids()'));
const aidStyle=new Function(fn+'; return aidStyle;')();
const aids=JSON.parse(fs.readFileSync('F:/sailing-assistant/aids.json','utf8')).aids;
const enc=JSON.parse(fs.readFileSync('F:/sailing-assistant/tools/enc.json','utf8'));
const truth=c=>{ const s=String(c||'').split(',').map(x=>x.trim()); const h=x=>s.includes(x);
  if(h('3')&&h('4')) return 'RG'; if(h('3')&&h('1')) return 'RW'; if(h('6')) return 'Y'; if(h('11')||(h('1')&&s.length===1)) return 'WO';
  if(s[0]==='3') return 'R'; if(s[0]==='4') return 'G'; if(h('2')) return 'BK'; return '?'; };
const got=st=>{ if(st.kind) return st.kind;                     // new code reports its own category
  const c=st.color; return c==='#0a9b0a'?'G':c==='#e11'?(st.safe?'RW':'R'):c==='#efc000'?'Y':c==='#f4f4f4'?'WO':'grey'; }; const _k=1;
const box=aids.filter(a=>a[0]>40.95&&a[0]<41.85&&a[1]>-72.3&&a[1]<-69.85);
let matched=0, ok=0, grey=0; const conf={}, bad=[];
for(const a of box){ let best=null,bd=1e9;
  for(const e of enc){ const d=Math.hypot((e.la-a[0])*111320,(e.lo-a[1])*111320*Math.cos(a[0]*Math.PI/180)); if(d<bd){bd=d;best=e;} }
  if(bd>60) continue; matched++; const t=truth(best.c), g=got(aidStyle(a));
  const k=t+'->'+g; conf[k]=(conf[k]||0)+1; if(g===t) ok++; else { if(g==='grey') grey++; if(bad.length<400) bad.push(k+' | '+a[3]+' | '+a[4]+' | enc:'+best.n+' ['+best.c+']'); } }
console.log('aids in area',box.length,'matched to chart',matched,'correct',ok,(100*ok/matched).toFixed(1)+'%','grey',grey);
console.log(Object.entries(conf).sort((a,b)=>b[1]-a[1]).map(x=>x.join(' ')).join('\n'));
if(process.argv[2]) console.log(bad.filter(b=>b.startsWith(process.argv[2])).slice(0,+process.argv[3]||25).join('\n'));
