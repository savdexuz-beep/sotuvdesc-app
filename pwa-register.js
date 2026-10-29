(function() {
  "use strict";
  var ua = navigator.userAgent || "";
  var skip = !!window.Capacitor || /Electron/i.test(ua) || location.protocol === "file:" || location.hostname === "localhost";
  window.SD_PWA = !skip;
  if (skip) return;
  if (!("serviceWorker" in navigator)) return;
  var T = {
    ru: { upd: "\u0415\u0441\u0442\u044C \u043D\u043E\u0432\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F", btn: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C", wait: "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C \u043D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u043E\u0435\u2026" },
    uz: { upd: "Yangi versiya bor", btn: "Yangilash", wait: "Saqlanmaganlar yuborilmoqda\u2026" },
    en: { upd: "New version available", btn: "Update", wait: "Sending unsent items\u2026" }
  };
  function lang() {
    var l = "";
    try {
      l = localStorage.getItem("sd-lang") || "";
    } catch (e) {
    }
    return T[l] ? l : "ru";
  }
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch (e) {
  }
  try {
    var layer = document.getElementById("layer");
    if (layer && window.MutationObserver) new MutationObserver(function() {
      var g = layer.querySelector("#uGet");
      if (g) g.remove();
    }).observe(layer, { childList: true, subtree: true });
  } catch (e) {
  }
  var banner = null;
  function showBanner(worker) {
    if (banner || !document.body) return;
    var L = T[lang()];
    banner = document.createElement("div");
    banner.id = "pwaUpd";
    banner.setAttribute("role", "status");
    banner.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:9999;display:flex;align-items:center;gap:12px;padding:12px 14px;background:#073642;color:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.25);font:600 15px/1.3 Manrope,system-ui,sans-serif";
    var s = document.createElement("span");
    s.style.flex = "1";
    s.textContent = L.upd;
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = L.btn;
    b.style.cssText = "min-height:44px;padding:0 18px;border:0;border-radius:10px;background:#0B7C93;color:#fff;font:800 15px Manrope,system-ui,sans-serif";
    banner.appendChild(s);
    banner.appendChild(b);
    document.body.appendChild(banner);
    b.onclick = async function() {
      b.disabled = true;
      try {
        if (typeof window.__sdBeforeUpdate === "function") {
          s.textContent = L.wait;
          await window.__sdBeforeUpdate();
        }
      } catch (e) {
      }
      try {
        worker.postMessage("SKIP_WAITING");
      } catch (e) {
        location.reload();
      }
    };
  }
  var reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", function() {
    if (reloading || !window.__pwaHadController) return;
    reloading = true;
    location.reload();
  });
  window.__pwaHadController = !!navigator.serviceWorker.controller;
  function watch(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) showBanner(reg.waiting);
    reg.addEventListener("updatefound", function() {
      var w = reg.installing;
      if (!w) return;
      w.addEventListener("statechange", function() {
        if (w.state === "installed" && navigator.serviceWorker.controller) showBanner(w);
      });
    });
  }
  function start() {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).then(function(reg) {
      window.__pwaReg = reg;
      watch(reg);
      document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "visible") {
          try {
            reg.update();
          } catch (e) {
          }
        }
      });
    }).catch(function(e) {
      try {
        console.warn("SW register failed", e);
      } catch (x) {
      }
    });
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
