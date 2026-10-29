/* Sotuvdesc: полифилы для старых Android System WebView (Chrome 61+). Без зависимостей. */
(function (g) {
  'use strict';
  if (typeof g.globalThis === 'undefined') g.globalThis = g;
  var def = function (o, k, v) { if (!o[k]) try { Object.defineProperty(o, k, { value: v, configurable: true, writable: true }); } catch (e) { o[k] = v; } };
  def(Promise.prototype, 'finally', function (f) { var P = this.constructor || Promise; return this.then(function (v) { return P.resolve(f()).then(function () { return v; }); }, function (e) { return P.resolve(f()).then(function () { throw e; }); }); });
  def(Promise, 'allSettled', function (a) { return Promise.all(Array.prototype.map.call(a, function (p) { return Promise.resolve(p).then(function (v) { return { status: 'fulfilled', value: v }; }, function (r) { return { status: 'rejected', reason: r }; }); })); });
  def(Array.prototype, 'flat', function (d) { d = d === undefined ? 1 : +d; var out = []; (function f(a, n) { for (var i = 0; i < a.length; i++) { if (Array.isArray(a[i]) && n > 0) f(a[i], n - 1); else out.push(a[i]); } })(this, d); return out; });
  def(Array.prototype, 'flatMap', function (fn, t) { return Array.prototype.map.call(this, fn, t).flat(1); });
  def(Array.prototype, 'includes', function (x) { return this.indexOf(x) >= 0 || (x !== x && this.some(function (y) { return y !== y; })); });
  def(Object, 'fromEntries', function (it) { var o = {}; Array.from(it).forEach(function (p) { o[p[0]] = p[1]; }); return o; });
  def(Object, 'entries', function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); });
  def(Object, 'values', function (o) { return Object.keys(o).map(function (k) { return o[k]; }); });
  def(String.prototype, 'padStart', function (n, s) { var t = String(this); s = s === undefined ? ' ' : String(s); while (t.length < n) t = s + t; return t.slice(t.length - Math.max(n, String(this).length)); });
  def(String.prototype, 'replaceAll', function (a, b) { return a instanceof RegExp ? this.replace(a, b) : this.split(a).join(b); });
  if (typeof g.structuredClone !== 'function') g.structuredClone = function (v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); };
  if (typeof g.AbortController !== 'function') g.AbortController = function () { this.signal = { aborted: false }; this.abort = function () { this.signal.aborted = true; }; };
  if (g.Element && !Element.prototype.matches) Element.prototype.matches = Element.prototype.webkitMatchesSelector;
  if (g.Element && !Element.prototype.closest) Element.prototype.closest = function (s) { var el = this; while (el && el.nodeType === 1) { if (el.matches(s)) return el; el = el.parentElement; } return null; };
  if (g.NodeList && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
})(typeof window !== 'undefined' ? window : this);
