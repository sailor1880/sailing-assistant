// Node copy of the app's encIdentify split logic, to count requests and results for a box.
// usage: node tools/split_check.js west south east north
const [W,S,E,N]=process.argv.slice(2,6).map(Number);
const base='https://encdirect.noaa.gov/arcgis/rest/services/encdirect/enc_harbour/MapServer';
let calls=0;
(async()=>{
  const meta=await (await fetch(base+'?f=json')).json();
  const ids=meta.layers.filter(l=>/(Buoy|Beacon)_.*_point$|\.Light(_Float)?_point$/.test(l.name)).map(l=>l.id).join(',');
  async function ident(w,s,e,n,depth){ calls++; const env=[w,s,e,n].join(',');
    const j=await (await fetch(base+'/identify?f=json&geometryType=esriGeometryEnvelope&sr=4326&tolerance=0&imageDisplay=800,600,96&returnGeometry=true&returnFieldName=true&layers=all:'+ids+'&geometry='+env+'&mapExtent='+env)).json();
    const r=j.results||[]; console.log(' '.repeat(depth*2)+'box',env,'->',r.length);
    if(r.length<1000||depth>=4) return r;
    const mx=(w+e)/2,my=(s+n)/2;
    const parts=await Promise.all([ident(w,s,mx,my,depth+1),ident(mx,s,e,my,depth+1),ident(w,my,mx,n,depth+1),ident(mx,my,e,n,depth+1)]);
    return [].concat(...parts); }
  const all=await ident(W,S,E,N,0), seen={}, uniq=all.filter(r=>{ const k=r.layerId+':'+r.attributes.OBJECTID; return seen[k]?false:(seen[k]=1); });
  const pos={}; uniq.forEach(r=>{ const k=r.layerId+':'+r.geometry.y.toFixed(5)+','+r.geometry.x.toFixed(5); pos[k]=(pos[k]||0)+1; });
  console.log('calls',calls,'raw',all.length,'unique by OBJECTID',uniq.length,'unique by layer+position',Object.keys(pos).length,
    'non-light',uniq.filter(r=>!/Light_point/.test(r.layerName)).length);
})();
