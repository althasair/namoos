/* نوماس — يحفظ ملفات الواجهة لتفتح بسرعة، والبيانات تُطلب دائمًا من الخادم */
var CACHE = 'namoos-v33';
var SHELL = ['./', 'index.html', 'style.css', 'app.js', 'sig.js', 'forms.js', 'config.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/logo.png', 'icons/logo-bar.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // الشبكة أولًا حتى تصل التحديثات فورًا، والنسخة المحفوظة عند انقطاع الإنترنت
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); return r; })
    .catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('index.html'); }); }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (cs) { if (cs.length) return cs[0].focus(); return self.clients.openWindow('./'); }));
});
