(function() {
  "use strict";
  if (window.SD_PWA === false || window.Capacitor || /Electron/i.test(navigator.userAgent || "") || location.protocol === "file:") return;
  var ua = navigator.userAgent || "";
  var iOS = /iPhone|iPad|iPod/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (!iOS) return;
  var standalone = window.navigator.standalone === true || window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  if (standalone) return;
  var inApp = /Telegram|FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)|CriOS|FxiOS|EdgiOS/.test(ua) || !/Safari\//.test(ua);
  var K = "sd-pwa-hint";
  try {
    var t0 = +localStorage.getItem(K) || 0;
    if (t0 && Date.now() - t0 < 7 * 864e5) return;
  } catch (e) {
  }
  var TX = {
    ru: {
      title: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 Sotuvdesc \u043D\u0430 iPhone",
      steps: ["\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F\xBB (\u043A\u0432\u0430\u0434\u0440\u0430\u0442 \u0441\u043E \u0441\u0442\u0440\u0435\u043B\u043A\u043E\u0439) \u0432\u043D\u0438\u0437\u0443 Safari.", "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \xAB\u041D\u0430 \u044D\u043A\u0440\u0430\u043D \u201C\u0414\u043E\u043C\u043E\u0439\u201D\xBB \u2192 \xAB\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C\xBB.", "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0437\u043D\u0430\u0447\u043E\u043A Sotuvdesc \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435 \u0438 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0437\u0430\u043D\u043E\u0432\u043E."],
      app: "\u042D\u0442\u0430 \u0441\u0441\u044B\u043B\u043A\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0430 \u0432\u043E \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u043E\u043C \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u22EF\xBB \u0438\u043B\u0438 \u0437\u043D\u0430\u0447\u043E\u043A \u043A\u043E\u043C\u043F\u0430\u0441\u0430 \u2192 \xAB\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 Safari\xBB, \u0437\u0430\u0442\u0435\u043C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435.",
      ok: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E"
    },
    uz: {
      title: "Sotuvdesc ilovasini iPhone\u2019ga o\u2018rnating",
      steps: ["Safari pastidagi \xABUlashish\xBB (strelkali kvadrat) tugmasini bosing.", "\xABBosh ekranga\xBB \u2192 \xABQo\u2018shish\xBB ni tanlang.", "Bosh ekrandagi Sotuvdesc belgisini oching va qaytadan kiring."],
      app: "Bu havola ichki brauzerda ochildi. \xAB\u22EF\xBB yoki kompas belgisini bosing \u2192 \xABSafari\u2019da ochish\xBB, keyin ilovani o\u2018rnating.",
      ok: "Tushunarli"
    },
    en: {
      title: "Install Sotuvdesc on iPhone",
      steps: ["Tap \u201CShare\u201D (square with an arrow) at the bottom of Safari.", "Choose \u201CAdd to Home Screen\u201D \u2192 \u201CAdd\u201D.", "Open the Sotuvdesc icon on the Home Screen and sign in again."],
      app: "This link is open in an in-app browser. Tap \u201C\u22EF\u201D or the compass icon \u2192 \u201COpen in Safari\u201D, then install the app.",
      ok: "Got it"
    }
  };
  function lang() {
    var l = "";
    try {
      l = localStorage.getItem("sd-lang") || "";
    } catch (e) {
    }
    return TX[l] ? l : "ru";
  }
  function show() {
    if (document.getElementById("pwaHelp") || !document.body) return;
    var L = TX[lang()];
    var d = document.createElement("div");
    d.id = "pwaHelp";
    d.setAttribute("role", "dialog");
    d.style.cssText = "position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:9998;background:#fff;color:#0F172A;border:1px solid #E2E8F0;border-radius:16px;box-shadow:0 8px 32px rgba(7,54,66,.28);padding:16px;font:500 15px/1.4 Manrope,system-ui,sans-serif";
    var h = document.createElement("div");
    h.style.cssText = "font-weight:800;font-size:17px;color:#073642;margin-bottom:8px";
    h.textContent = L.title;
    d.appendChild(h);
    if (inApp) {
      var p = document.createElement("p");
      p.style.margin = "0 0 12px";
      p.textContent = L.app;
      d.appendChild(p);
    } else {
      var ol = document.createElement("ol");
      ol.style.cssText = "margin:0 0 12px;padding-left:22px";
      L.steps.forEach(function(s) {
        var li = document.createElement("li");
        li.style.margin = "4px 0";
        li.textContent = s;
        ol.appendChild(li);
      });
      d.appendChild(ol);
    }
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = L.ok;
    b.style.cssText = "width:100%;min-height:48px;border:0;border-radius:12px;background:#0B7C93;color:#fff;font:800 16px Manrope,system-ui,sans-serif";
    b.onclick = function() {
      try {
        localStorage.setItem(K, String(Date.now()));
      } catch (e) {
      }
      d.remove();
    };
    d.appendChild(b);
    document.body.appendChild(d);
  }
  function go() {
    setTimeout(show, 4e3);
  }
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go);
  window.__sdShowInstallHelp = show;
})();
