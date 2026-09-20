const CACHE_NAME = 'blow-kagoshima-pos-weekly-closing-20260920e';
const STATIC_ASSETS = ['./index.html','./manifest.json','./favicon.ico','./icon-16.png','./icon-32.png','./icon-48.png','./icon-64.png','./icon-128.png','./icon-192.png','./icon-256.png','./icon-512.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))); });
self.addEventListener('activate', event => { event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))), self.clients.claim()])); });
self.addEventListener('fetch', event => {
  const request=event.request; if(request.method!=='GET') return;
  const url=new URL(request.url); if(url.origin!==self.location.origin) return;
  if(request.mode==='navigate' || url.pathname.endsWith('/index.html')){
    event.respondWith(fetch(request).then(response=>{ if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));} return response; }).catch(async()=> (await caches.match('./index.html')) || Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached || fetch(request).then(response=>{ if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));} return response; })));
});
