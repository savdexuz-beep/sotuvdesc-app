/* Sotuvdesc: экран ошибки запуска вместо белого экрана; журнал ошибок в localStorage (sd-errlog) для поддержки.
   Подключается ПЕРВЫМ, написан на ES5 — работает даже там, где остальной код не запустился. */
(function () {
  var K = 'sd-errlog';
  function log(m) { try { var a = JSON.parse(localStorage.getItem(K) || '[]'); a.push(new Date().toISOString() + ' ' + m); localStorage.setItem(K, JSON.stringify(a.slice(-30))); } catch (e) { } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(m) {
    if (window.__sdBooted || !document.body) return;
    var d = document.getElementById('bootErr') || document.createElement('div'); d.id = 'bootErr';
    d.setAttribute('style', 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:#fff;color:#0F172A;padding:24px;font:15px/1.45 system-ui,sans-serif;overflow:auto');
    d.innerHTML = '<h2 style="color:#073642;margin:8px 0">Приложение не запустилось / Ilova ishga tushmadi</h2>' +
      '<p>Проверьте интернет и обновите «Android System WebView» и Chrome в Play Market. / Internetni tekshiring va «Android System WebView»ni yangilang.</p>' +
      '<pre style="white-space:pre-wrap;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px;font-size:12px">' + esc(m) + '\n' + esc(navigator.userAgent) + '</pre>' +
      '<button id="bootRetry" style="min-height:52px;width:100%;border:0;border-radius:12px;background:#0B7C93;color:#fff;font-weight:800;font-size:16px">Повторить / Qayta urinish</button>';
    document.body.appendChild(d);
    var b = document.getElementById('bootRetry'); if (b) b.onclick = function () { location.reload(); };
  }
  window.addEventListener('error', function (e) { var m = (e.message || 'error') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || ''); log(m); show(m); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; var m = 'promise: ' + (r && (r.message || r)); log(m); show(m); });
  // 1.5.1: ошибка только если приложение «молчит». Пока идут сигналы жизни (window.__sdAlive — обновление базы, индекс,
  // загрузка), экран ошибки не показывается. Без сигналов: 30 с; во время долгой операции (__sdLongOp: обновление
  // IndexedDB, пересборка индекса) — до 120 с без сигнала.
  var T0 = Date.now();
  var tick = setInterval(function () {
    if (window.__sdBooted) { clearInterval(tick); return; }
    var last = Math.max(T0, window.__sdAlive || 0), quiet = Date.now() - last, lim = window.__sdLongOp ? 120000 : 30000;
    if (quiet > lim) { clearInterval(tick); log('boot timeout ' + Math.round(quiet / 1000) + 's phase=' + (window.__sdPhase || '')); show('Таймаут запуска (' + Math.round(quiet / 1000) + ' с без ответа, этап: ' + (window.__sdPhase || 'start') + ') / boot timeout'); }
  }, 2000);
  window.__sdShowBootError = show;
})();
