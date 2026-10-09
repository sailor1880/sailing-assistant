/* Sailing Assistant service worker — live first: the network copy always wins; stored copies are only for offline */
const APP='sa-app-v35', TILES='sa-tiles-v1', DATA='sa-data-v13';
const SHELL=['./','index.html','windy.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(APP).then(c=>c.addAll(SHELL)).catch(()=>{})
    .then(()=>caches.open(DATA)).then(c=>c.add('aids.json')).catch(()=>{})     // last-resort offline copy of the aids
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.map(k=>[APP,TILES,DATA].includes(k)?null:caches.delete(k))))
    .then(()=>self.clients.claim()));
});

// map-tile / chart hosts
const TILE_RE=/\/export\?|MaritimeChartService|charttools\.noaa|tile\.openstreetmap|basemaps\.cartocdn|tiles\.openseamap|mesonet\.agron\.iastate|arcgisonline|geoserver\/gwc\/service\/wmts/;
const STALL_MS=8000;     // a request that has not answered by now is treated as "no signal" and the stored copy is used

self.addEventListener('fetch', e=>{
  const req=e.request; if(req.method!=='GET') return;
  let url; try{ url=new URL(req.url); }catch(_){ return; }
  // Charts: always the current tile from the chart server. Tiles are NOT stored as you browse - only the ones saved
  // with "Save chart offline" live in TILES, and those are refreshed whenever they are fetched online.
  if(TILE_RE.test(req.url)){ e.respondWith(netFirst(req,TILES,false)); return; }
  if(url.origin!==location.origin) return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{ caches.open(APP).then(c=>c.put(req,r.clone())); return r; })
      .catch(()=>caches.match(req).then(r=>r||caches.match('index.html')))); return;
  }
  // Our own files (race list, courses, marks, GPX, icons): fresh from the site, stored so the app still opens offline.
  e.respondWith(netFirst(req,/\.(json|gpx)$/.test(url.pathname)?DATA:APP,true,{cache:'no-cache'}));
});

// Network first. `store` = keep a copy of every answer; otherwise only refresh a copy that is already stored.
function netFirst(req,name,store,opts){
  return caches.open(name).then(c=>{
    const net=fetch(req,opts).then(res=>{
      if(res && (res.ok||res.type==='opaque')){ const copy=res.clone();
        (store?Promise.resolve(true):c.match(req)).then(keep=>{ if(keep) c.put(req,copy); }).catch(()=>{}); }
      return res; });
    const stall=new Promise((_,no)=>setTimeout(()=>no(new Error('stalled')),STALL_MS));
    return Promise.race([net,stall]).catch(()=>c.match(req).then(hit=>hit||net));
  });
}
