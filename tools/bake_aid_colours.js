// Bake charted colours into aids.json as a 6th column ("col"), from tools/enc.json (run fetch_enc_colours.js first).
// An aid takes the colour of the nearest charted buoy/beacon within 60 m, but only when the names agree - the
// Light List names in aids.json are cut short at ~42 characters, so "agree" means one name starts with the other.
// Re-running is safe: the column is rebuilt from scratch each time.
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..');
const j=JSON.parse(fs.readFileSync(path.join(root,'aids.json'),'utf8'));
const enc=JSON.parse(fs.readFileSync(path.join(__dirname,'enc.json'),'utf8'));
const kind=c=>{ const s=String(c||'').split(',').map(x=>x.trim()).filter(Boolean), h=x=>s.includes(x);
  if(h('3')&&h('4')) return s[0]==='3'?'RG':'GR';       // banded junction buoy: first colour is the top band
  if(h('3')&&h('1')) return 'RW'; if(h('6')) return 'Y'; if(h('11')) return 'WO';
  if(h('2')&&h('3')) return 'BK'; if(s[0]==='3') return 'R'; if(s[0]==='4') return 'G'; return null; };
const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cell=(la,lo)=>Math.floor(la*100)+':'+Math.floor(lo*100), grid={};   // ~1 km buckets so this is not 8,899 x everything
enc.forEach(e=>{ (grid[cell(e.la,e.lo)]=grid[cell(e.la,e.lo)]||[]).push(e); });
let n=0; const tally={};
j.aids.forEach(a=>{ a.length=5; let best=null,bd=60; const an=norm(a[3]);
  for(let i=-1;i<=1;i++) for(let k=-1;k<=1;k++) (grid[Math.floor(a[0]*100+i)+':'+Math.floor(a[1]*100+k)]||[]).forEach(e=>{
    const d=Math.hypot((e.la-a[0])*111320,(e.lo-a[1])*111320*Math.cos(a[0]*Math.PI/180)); if(d>=bd) return;
    const en=norm(e.n); if(!an||!en||!(en.startsWith(an)||an.startsWith(en))) return; bd=d; best=e; });
  const k=best&&kind(best.c); if(k){ a[5]=k; n++; tally[k]=(tally[k]||0)+1; } });
j.fields=['lat','lon','llnr','name','char','col'];
fs.writeFileSync(path.join(root,'aids.json'),JSON.stringify(j));
console.log('aids',j.aids.length,'given a charted colour',n,JSON.stringify(tally));
