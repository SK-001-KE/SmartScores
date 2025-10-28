const CACHE_NAME="smartscores-v2.0";
const FILES_TO_CACHE=["./","./index.html","./about.html","./app.js","./manifest.json","./favicon.png","./icons/icon-192.png","./icons/icon-512.png","https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js","js/jspdf.plugin.autotable.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES_TO_CACHE)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>key!==CACHE_NAME?caches.delete(key):null))));self.clients.claim();});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>caches.open(CACHE_NAME).then(c=>{c.put(e.request.url,res.clone());return res;}))).catch(()=>caches.match("./index.html")));});
