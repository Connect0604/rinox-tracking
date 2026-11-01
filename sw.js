/* Rinox Tracking — service worker.
   Caches the app SHELL (this file set + Chart.js) so the app installs and
   opens instantly, including offline. It deliberately does NOT cache the
   Google Sheets data responses — this is a financial dashboard, and serving
   a stale balance/revenue figure as if it were live would be worse than no
   figure at all. Offline, the shell still loads; the data calls fail with
   the app's own existing "Could not load this tab" / "Sync failed" states,
   which is the honest behavior. */

var SHELL_CACHE = "rinox-shell-v1";
var SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(SHELL_CACHE).then(function(cache){ return cache.addAll(SHELL_FILES); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== SHELL_CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var url = e.request.url;

  /* Never intercept the live sheet data — always hit the network fresh. */
  if(e.request.method !== "GET" || url.indexOf("docs.google.com") !== -1) return;

  var sameOrigin = url.indexOf(self.location.origin) === 0;
  var isChartJs = url.indexOf("cdnjs.cloudflare.com/ajax/libs/Chart.js") !== -1;
  if(!sameOrigin && !isChartJs) return;

  /* Stale-while-revalidate: serve the cached shell instantly, refresh it
     in the background for next time. */
  e.respondWith(
    caches.open(SHELL_CACHE).then(function(cache){
      return cache.match(e.request).then(function(cached){
        var network = fetch(e.request).then(function(res){
          if(res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(function(){ return cached; });
        return cached || network;
      });
    })
  );
});
