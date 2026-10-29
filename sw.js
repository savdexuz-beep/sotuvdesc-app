var CACHE = "sotuvdesc-pwa-1.8.0-ed24689f46";
var FILES = ["./", "app.js", "assets/Manrope.ttf", "assets/OFL.txt", "assets/apple-touch-icon-180.png", "assets/favicon-32.png", "assets/favicon.svg", "assets/icon-512.png", "assets/icon-maskable-192.png", "assets/icon-maskable-512.png", "assets/pdf/Manrope-Bold.ttf", "assets/pdf/Manrope-Regular.ttf", "assets/savdex-logo-160.png", "assets/savdex-logo-512.png", "assets/sotuvdesc-logo-horizontal.svg", "assets/sotuvdesc-logo-stacked.svg", "assets/sotuvdesc-mark.svg", "config.js", "countries.js", "i18n-v12.js", "i18n-v13.js", "i18n-v141.js", "i18n-v15.js", "i18n-v150.js", "i18n-v160.js", "i18n-v161.js", "i18n-v170.js", "i18n-v180.js", "i18n.js", "index.html", "install-help.js", "manifest.webmanifest", "onboarding-v170.js", "presets/sales-scripts-ru-uz.json", "presets/sotuvdesc-import-edu-centers-2026-10-26.csv", "pwa-register.js", "sample.csv", "styles.css", "team-v180.css", "team-v180.js", "templates/Sotuvdesc-shablon-importa.xlsx", "tokens.css", "v160.css", "v161.css", "v170.css", "v170cat.css", "vendor/bootguard.js", "vendor/jspdf.umd.min.js", "vendor/polyfills.js", "vendor/xlsx.full.min.js"];
var SUPABASE = "https://xprotusvwqzngxxpysrm.supabase.co";
var API_RE = /\/(rest|auth|storage|realtime|functions)\/v1(\/|$)|\/(rest|auth|storage|realtime|functions)(\/|$)/;
self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) {
    return Promise.all(FILES.map(function(u) {
      return c.add(new Request(u, { cache: "reload" }));
    }));
  }));
});
self.addEventListener("activate", function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) {
      return k.indexOf("sotuvdesc-pwa-") === 0 && k !== CACHE;
    }).map(function(k) {
      return caches.delete(k);
    }));
  }).then(function() {
    return self.clients.claim();
  }));
});
self.addEventListener("message", function(e) {
  if (e.data === "SKIP_WAITING" || e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
  else if (e.data === "GET_CACHE" && e.source) e.source.postMessage({ type: "CACHE", cache: CACHE });
});
self.addEventListener("fetch", function(e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try {
    url = new URL(req.url);
  } catch (x) {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (SUPABASE && req.url.indexOf(SUPABASE) === 0) return;
  if (API_RE.test(url.pathname)) return;
  if (url.pathname.slice(-6) === "/sw.js") return;
  if (req.mode === "navigate") {
    e.respondWith(caches.open(CACHE).then(function(c) {
      return c.match("index.html").then(function(r) {
        return r || c.match("./") || fetch(req);
      });
    }).catch(function() {
      return fetch(req);
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function(c) {
    return c.match(req, { ignoreSearch: true }).then(function(r) {
      return r || fetch(req);
    });
  }));
});
