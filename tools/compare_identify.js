// Compare what NOAA ENC Direct returns for one box via `identify` (one call) and via per-layer `query`.
// usage: node tools/compare_identify.js west south east north [service]
const [w,s,e,n]=process.argv.slice(2,6).map(Number), svc=process.argv[6]||'enc_harbour';
const base='https://encdirect.noaa.gov/arcgis/rest/services/encdirect/'+svc+'/MapServer', env=[w,s,e,n].join(',');
(async()=>{
  const meta=await (await fetch(base+'?f=json')).json();
  const layers=meta.layers.filter(l=>/(Buoy|Beacon)_.*_point$|\.Light(_Float)?_point$/.test(l.name));
  const idr=await (await fetch(base+'/identify?f=json&geometryType=esriGeometryEnvelope&sr=4326&tolerance=0&imageDisplay=800,600,96&returnGeometry=true&returnFieldName=true&layers=all:'+
    layers.map(l=>l.id).join(',')+'&geometry='+env+'&mapExtent='+env)).json();
  const idNames=(idr.results||[]).filter(r=>!/Light_point/.test(r.layerName)).map(r=>r.attributes.OBJNAM);
  console.log('identify: total',(idr.results||[]).length,'non-light',idNames.length);
  const q=[];
  for(const l of layers){ if(/Light_point/.test(l.name)) continue;
    const j=await (await fetch(base+'/'+l.id+'/query?where=1%3D1&geometry='+env+'&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&spatialRel=esriSpatialRelIntersects&outFields=OBJNAM,COLOUR,SCAMIN&f=json')).json();
    (j.features||[]).forEach(f=>q.push({n:f.attributes.OBJNAM,sc:f.attributes.SCAMIN,la:f.geometry.y,lo:f.geometry.x,layer:l.name})); }
  console.log('query: non-light',q.length);
  const miss=q.filter(x=>!idNames.includes(x.n));
  console.log('in query but NOT in identify:',miss.length); miss.forEach(m=>console.log('  ',m.n,'| SCAMIN',m.sc,'|',m.la.toFixed(5),m.lo.toFixed(5)));
  console.log('query list:'); q.forEach(m=>console.log('  ',m.n,'| SCAMIN',m.sc));
})();
