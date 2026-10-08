// Pull charted colours for buoys/beacons from NOAA ENC Direct, to check the Light List colour rules against.
const fs=require('fs');
const base='https://encdirect.noaa.gov/arcgis/rest/services/encdirect/enc_harbour/MapServer';
const layers={1:'bcnlat',2:'bcnsaw',3:'bcnspp',4:'boycar',5:'boyisd',6:'boylat',7:'boysaw',8:'boyspp'};
(async()=>{ const out=[];
  for(const id of Object.keys(layers)){ let off=0;
    for(;;){ const p=new URLSearchParams({where:'1=1',geometry:'-74.45,40.2,-66.5,45.2',geometryType:'esriGeometryEnvelope',inSR:'4326',outSR:'4326',
        spatialRel:'esriSpatialRelIntersects',outFields:'OBJNAM,COLOUR',f:'json',resultOffset:off,resultRecordCount:1000});
      const r=await (await fetch(base+'/'+id+'/query',{method:'POST',body:p})).json();
      const fs_=r.features||[]; fs_.forEach(f=>{ if(f.geometry) out.push({k:layers[id],n:f.attributes.OBJNAM,c:f.attributes.COLOUR,la:f.geometry.y,lo:f.geometry.x}); });
      if(!r.exceededTransferLimit||!fs_.length) break; off+=fs_.length; }
    console.log(layers[id],out.length); }
  fs.writeFileSync(require('path').join(__dirname,'enc.json'),JSON.stringify(out));
})().catch(e=>{ console.error('FAILED',e.message); process.exit(1); });
