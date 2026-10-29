(function() {
  "use strict";
  var VERSION = "1.8.0";
  var I = window.SD_I18N;
  var $ = function(s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var esc = function(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var STATUSES = ["new", "contacted", "interest", "meeting", "proposal", "won", "lost"];
  var BASIS = ["public", "inbound", "met", "referral", "consent", "other"];
  var KINDS = ["note", "call", "email", "whatsapp", "telegram", "meeting"];
  var FIELDS = ["name", "country", "city", "industry", "type", "website", "email", "phone", "inn", "lei", "extId", "person", "address", "comment", "tags", "source", "status"];
  var KEYS = ["kExt", "kLei", "kInn", "kWeb", "kEmail", "kPhone", "kCh", "kNC", "kNCity"];
  var NEWKEYS = ["kPhone", "kInn", "kNCity"];
  var CHT = ["whatsapp", "telegram", "wechat", "viber", "instagram", "facebook", "linkedin", "tiktok", "youtube", "vk", "other"];
  var CHF = ["ch_whatsapp", "ch_telegram", "ch_instagram", "ch_wechat", "ch_facebook", "ch_viber", "ch_linkedin", "ch_tiktok", "ch_youtube", "ch_vk"];
  var IMPF = FIELDS.concat(CHF);
  var F_EMAIL = 1, F_PHONE = 2, F_GOV = 4, F_DNC = 8, F_WEB = 16, F_CH = 32;
  var NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  var PLUG = window.Capacitor && window.Capacitor.Plugins || {};
  var LANG = "ru";
  try {
    LANG = localStorage.getItem("sd-lang") || "";
  } catch (e) {
  }
  if (!LANG) LANG = (navigator.language || "ru").slice(0, 2) === "en" ? "en" : (navigator.language || "").slice(0, 2) === "uz" ? "uz" : "ru";
  if (!I[LANG]) LANG = "ru";
  function t(k, v) {
    var s = I[LANG][k];
    if (s == null) s = I.ru[k];
    if (s == null) s = k;
    if (v) s = s.replace(/\{(\w+)\}/g, function(m, n) {
      return v[n] != null ? v[n] : m;
    });
    return s;
  }
  var stName = function(i) {
    return t("st_" + STATUSES[i]);
  };
  var pad = function(n) {
    return (n < 10 ? "0" : "") + n;
  };
  var ymd = function(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  };
  var today = function() {
    return ymd(/* @__PURE__ */ new Date());
  };
  var addDays = function(s, n) {
    var d = /* @__PURE__ */ new Date(s + "T00:00:00");
    d.setDate(d.getDate() + n);
    return ymd(d);
  };
  var fmtDate = function(s) {
    return s ? s.slice(8, 10) + "." + s.slice(5, 7) + "." + s.slice(0, 4) : "";
  };
  var fmtTs = function(ms) {
    if (!ms) return "";
    var d = new Date(ms);
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  };
  var num = function(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\xA0");
  };
  var digits = function(s) {
    return String(s || "").replace(/\D/g, "");
  };
  var sleep0 = function() {
    return new Promise(function(r) {
      setTimeout(r, 0);
    });
  };
  var GENERIC_HOSTS = { "facebook.com": 1, "instagram.com": 1, "linkedin.com": 1, "twitter.com": 1, "x.com": 1, "t.me": 1, "youtube.com": 1, "wikipedia.org": 1, "en.wikipedia.org": 1, "google.com": 1, "sites.google.com": 1, "vk.com": 1, "ok.ru": 1, "wa.me": 1, "blogspot.com": 1, "wordpress.com": 1, "tiktok.com": 1, "telegram.me": 1, "github.com": 1, "bit.ly": 1, "linktr.ee": 1 };
  function domainOf(u) {
    if (!u) return "";
    var s = String(u).trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/^www\d?\./, "");
    return s.split(/[\/?#\s]/)[0].split(":")[0].replace(/\.$/, "");
  }
  function normName(n) {
    var s = String(n || "").toLowerCase();
    try {
      s = s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
    } catch (e) {
    }
    s = s.replace(/[«»"'`‘’“”]/g, "").replace(/[^0-9a-zа-яёўқғҳ؀-ۿ一-鿿]+/g, " ");
    s = (" " + s + " ").replace(/ (llc|ltd|limited|inc|corp|corporation|gmbh|ag|sa|srl|spa|oy|ab|plc|co|company|ooo|ооо|оао|зао|пао|ао|ип|mchj|xk|ok|jsc|pjsc|llp|bv|nv|as|kg) /g, " ");
    return s.replace(/\s+/g, " ").trim();
  }
  function extIdOf(v) {
    v = String(v || "").trim();
    var m = /(?:wikidata\.org\/(?:entity|wiki)\/|^wd:|^)(Q\d+)\s*$/.exec(v);
    return m ? "wd:" + m[1] : v;
  }
  function telHref(p) {
    var d = digits(p);
    if (!d) return "";
    return "tel:" + (/^\s*\+/.test(p) || d.length > 10 ? "+" : "") + d.replace(/^00/, "");
  }
  function waDigits(p) {
    var d = normPhone(p);
    return d || digits(p).replace(/^00/, "");
  }
  function normPhone(p) {
    p = String(p || "");
    if (!p || /[xх*]{2}/i.test(p)) return "";
    var d = p.replace(/\D/g, "").replace(/^00/, "");
    if (d.length === 9) d = "998" + d;
    else if (d.length === 10 && d.charAt(0) === "8") d = "998" + d.slice(1);
    else if (d.length === 11 && d.slice(0, 3) === "998") return "";
    return d.length >= 7 ? d : "";
  }
  var CN = window.SD_COUNTRIES || {}, CN_MAP = null, CN_PIN = ["UZ", "KZ", "KG", "TJ", "TM", "RU", "TR", "CN"];
  function cnNorm(s) {
    s = String(s || "").toLowerCase();
    try {
      s = s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
    } catch (e) {
    }
    return s.replace(/[ʻʼ’‘`']/g, "'").replace(/^the\s+/, "").replace(/[.,]+$/, "").replace(/\s+/g, " ").trim();
  }
  function countryCode(v) {
    v = String(v || "").trim();
    if (!v) return "";
    if (/^[A-Za-z]{2}$/.test(v) && CN[v.toUpperCase()]) return v.toUpperCase();
    if (!CN_MAP) {
      CN_MAP = {};
      Object.keys(CN).forEach(function(c) {
        CN[c].forEach(function(n) {
          CN_MAP[cnNorm(n)] = c;
        });
      });
      var A = window.SD_COUNTRY_ALIAS || {};
      Object.keys(A).forEach(function(k) {
        CN_MAP[cnNorm(k)] = A[k];
      });
    }
    return CN_MAP[cnNorm(v)] || "";
  }
  function countryName(v, lang) {
    var c = countryCode(v);
    if (!c) return String(v || "");
    var l = lang || LANG;
    return CN[c][l === "ru" || l === "uzc" ? 1 : l === "uz" ? 2 : 0];
  }
  function countryCmp(a, b) {
    var ia = CN_PIN.indexOf(a), ib = CN_PIN.indexOf(b);
    if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return countryName(a).localeCompare(countryName(b), LANG);
  }
  function normInn(v) {
    var d = String(v || "").replace(/\D/g, "");
    return d.length >= 9 && d.length <= 14 ? d : "";
  }
  var CITY_ALIAS = { tashkent: ["toshkent", "\u0442\u0430\u0448\u043A\u0435\u043D\u0442", "\u0442\u043E\u0448\u043A\u0435\u043D\u0442", "tashkent", "taschkent"], samarkand: ["samarqand", "\u0441\u0430\u043C\u0430\u0440\u043A\u0430\u043D\u0434", "\u0441\u0430\u043C\u0430\u0440\u049B\u0430\u043D\u0434", "samarkand"], bukhara: ["buxoro", "\u0431\u0443\u0445\u0430\u0440\u0430", "\u0431\u0443\u0445\u043E\u0440\u043E", "bukhara", "buhara"], andijan: ["andijon", "\u0430\u043D\u0434\u0438\u0436\u0430\u043D", "\u0430\u043D\u0434\u0438\u0436\u043E\u043D", "andijan"], namangan: ["\u043D\u0430\u043C\u0430\u043D\u0433\u0430\u043D", "namangan"], fergana: ["fargona", "farg\u02BBona", "farg\u2018ona", "\u0444\u0435\u0440\u0433\u0430\u043D\u0430", "\u0444\u0430\u0440\u0493\u043E\u043D\u0430", "fergana", "ferghana"], nukus: ["\u043D\u0443\u043A\u0443\u0441", "nukus"], karshi: ["qarshi", "\u043A\u0430\u0440\u0448\u0438", "\u049B\u0430\u0440\u0448\u0438", "karshi"], navoi: ["navoiy", "\u043D\u0430\u0432\u043E\u0438", "\u043D\u0430\u0432\u043E\u0438\u0439", "navoi"], termez: ["termiz", "\u0442\u0435\u0440\u043C\u0435\u0437", "\u0442\u0435\u0440\u043C\u0438\u0437", "termez"], jizzakh: ["jizzax", "\u0434\u0436\u0438\u0437\u0430\u043A", "\u0436\u0438\u0437\u0437\u0430\u0445", "jizzakh"], gulistan: ["guliston", "\u0433\u0443\u043B\u0438\u0441\u0442\u0430\u043D", "\u0433\u0443\u043B\u0438\u0441\u0442\u043E\u043D", "gulistan"], urgench: ["urganch", "\u0443\u0440\u0433\u0435\u043D\u0447", "\u0443\u0440\u0433\u0430\u043D\u0447", "urgench"], kokand: ["qoqon", "qo\u2018qon", "\u043A\u043E\u043A\u0430\u043D\u0434", "\u049B\u045E\u049B\u043E\u043D", "kokand"], chirchiq: ["chirchik", "\u0447\u0438\u0440\u0447\u0438\u043A", "chirchiq"], angren: ["\u0430\u043D\u0433\u0440\u0435\u043D", "angren"], margilan: ["marg\u2018ilon", "margilon", "\u043C\u0430\u0440\u0433\u0438\u043B\u0430\u043D", "margilan"] };
  var CITY_MAP = {};
  Object.keys(CITY_ALIAS).forEach(function(k) {
    CITY_ALIAS[k].forEach(function(a) {
      CITY_MAP[a] = k;
    });
  });
  var CITY_STOP = { "\u0433": 1, "\u0433\u043E\u0440": 1, "\u0433\u043E\u0440\u043E\u0434": 1, "shahri": 1, "shahar": 1, "sh": 1, "city": 1, "viloyati": 1, "viloyat": 1, "\u043E\u0431\u043B\u0430\u0441\u0442\u044C": 1, "\u043E\u0431\u043B": 1, "tumani": 1, "\u0440\u0430\u0439\u043E\u043D": 1, "\u0440-\u043D": 1 };
  function cityKey(c) {
    var s = String(c || "").toLowerCase().replace(/[ʻʼ’`']/g, "\u2018").replace(/[^a-zа-яёўқғҳ‘\s-]/g, " ");
    var toks = s.split(/[\s,.]+/).filter(function(x) {
      return x && !CITY_STOP[x];
    });
    if (!toks.length) return "";
    var full = toks.join(" ");
    if (CITY_MAP[full]) return CITY_MAP[full];
    for (var i = 0; i < toks.length; i++) {
      var k = CITY_MAP[toks[i]] || CITY_MAP[toks[i].replace(/‘/g, "")];
      if (k) return k;
    }
    return full;
  }
  function similar(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    if (a.length > 5 && b.length > 5 && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0)) return Math.min(a.length, b.length) / Math.max(a.length, b.length) >= 0.75 ? 0.9 : 0.6;
    var bg = function(s) {
      var m = /* @__PURE__ */ new Map();
      for (var i = 0; i < s.length - 1; i++) {
        var g = s.substr(i, 2);
        m.set(g, (m.get(g) || 0) + 1);
      }
      return m;
    };
    var A = bg(a), B = bg(b), inter = 0, na = 0, nb = 0;
    A.forEach(function(v, k) {
      na += v;
      if (B.has(k)) inter += Math.min(v, B.get(k));
    });
    B.forEach(function(v) {
      nb += v;
    });
    return na + nb ? 2 * inter / (na + nb) : 0;
  }
  function uuid() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {
    }
    var b = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = b[6] & 15 | 64;
    b[8] = b[8] & 63 | 128;
    var h = Array.prototype.map.call(b, function(x) {
      return (x + 256).toString(16).slice(1);
    }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function fmtBytes(b) {
    var U = LANG === "ru" ? [" \u0411", " \u041C\u0411", " \u041A\u0411"] : [" B", " MB", " KB"];
    if (b < 1024) return b + U[0];
    return b > 1048576 ? (b / 1048576).toFixed(1) + U[1] : Math.round(b / 1024) + U[2];
  }
  var db;
  var reqP = function(r) {
    return new Promise(function(res, rej) {
      r.onsuccess = function() {
        res(r.result);
      };
      r.onerror = function() {
        rej(r.error);
      };
    });
  };
  var txDone = function(tx) {
    return new Promise(function(res, rej) {
      tx.oncomplete = function() {
        res();
      };
      tx.onerror = function() {
        rej(tx.error);
      };
      tx.onabort = function() {
        rej(tx.error || new Error("abort"));
      };
    });
  };
  function openDB() {
    return new Promise(function(res, rej) {
      alive("idb");
      window.__sdLongOp = 1;
      var r = indexedDB.open("sotuvdesc", 7);
      r.onupgradeneeded = function(ev) {
        var d = r.result, tx = r.transaction;
        if (ev.oldVersion < 1) {
          var s = d.createObjectStore("companies", { keyPath: "id", autoIncrement: true });
          KEYS.forEach(function(k) {
            s.createIndex(k, k, { multiEntry: true });
          });
          d.createObjectStore("idx", { keyPath: "c" });
          d.createObjectStore("touches", { keyPath: "id", autoIncrement: true }).createIndex("cid", "cid");
          var ts = d.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
          ts.createIndex("cid", "cid");
          ts.createIndex("due", "due");
          d.createObjectStore("meta", { keyPath: "k" });
        }
        if (ev.oldVersion < 2) ["companies", "touches", "tasks"].forEach(function(n) {
          tx.objectStore(n).createIndex("uid", "uid", { unique: false });
        });
        if (ev.oldVersion < 4) ["products", "org_settings", "quotes", "goals", "scripts"].forEach(function(n) {
          if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: "id" });
        });
        if (ev.oldVersion < 5) {
          var cs5 = tx.objectStore("companies");
          if (!cs5.indexNames.contains("kCh")) cs5.createIndex("kCh", "kCh", { multiEntry: true });
          if (!d.objectStoreNames.contains("files")) d.createObjectStore("files", { keyPath: "id" });
        }
        if (ev.oldVersion < 6) {
          if (!d.objectStoreNames.contains("chats")) d.createObjectStore("chats", { keyPath: "id" });
          if (!d.objectStoreNames.contains("chat_members")) d.createObjectStore("chat_members", { keyPath: "k" });
          if (!d.objectStoreNames.contains("chat_msgs")) d.createObjectStore("chat_msgs", { keyPath: "id" }).createIndex("chat_id", "chat_id");
          if (!d.objectStoreNames.contains("chat_prefs")) d.createObjectStore("chat_prefs", { keyPath: "chat_id" });
        }
        if (ev.oldVersion < 7) {
          [["tt_tasks", "id"], ["tt_events", "id"], ["tt_reports", "k"], ["tt_outbox", "id"], ["tt_meta", "k"]].forEach(function(x) {
            if (!d.objectStoreNames.contains(x[0])) {
              var st7 = d.createObjectStore(x[0], { keyPath: x[1] });
              if (x[0] === "tt_events") st7.createIndex("task_id", "task_id");
            }
          });
        }
        if (ev.oldVersion < 3) {
          var cst = tx.objectStore("companies");
          NEWKEYS.forEach(function(k) {
            if (!cst.indexNames.contains(k)) cst.createIndex(k, k, { multiEntry: true });
          });
          ["contacts", "deals", "pipelines", "stages", "plans", "members"].forEach(function(n) {
            if (d.objectStoreNames.contains(n)) return;
            var s2 = d.createObjectStore(n, { keyPath: "id" });
            if (n === "contacts" || n === "deals") s2.createIndex("company_id", "company_id");
          });
        }
      };
      r.onsuccess = function() {
        window.__sdLongOp = 0;
        alive("idb-ok");
        res(r.result);
      };
      r.onerror = function() {
        window.__sdLongOp = 0;
        rej(r.error);
      };
      r.onblocked = function() {
        alive("idb-blocked");
      };
    });
  }
  function metaGet(k) {
    return reqP(db.transaction("meta").objectStore("meta").get(k)).then(function(r) {
      return r ? r.v : void 0;
    });
  }
  function metaSet(k, v) {
    var tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put({ k, v });
    return txDone(tx);
  }
  function getCompany(id) {
    return reqP(db.transaction("companies").objectStore("companies").get(id));
  }
  function byCid(store, cid) {
    return reqP(db.transaction(store).objectStore(store).index("cid").getAll(cid));
  }
  var IDXV = 3, CH = 2e3;
  var IDX = [], BYID = /* @__PURE__ */ new Map(), CHUNKS = /* @__PURE__ */ new Map(), DIRTY = /* @__PURE__ */ new Set();
  var DICT = { country: [""], industry: [""] }, DMAP = { country: /* @__PURE__ */ new Map([["", 0]]), industry: /* @__PURE__ */ new Map([["", 0]]) }, dictDirty = false;
  var nextId = 1, DIRTYC = /* @__PURE__ */ new Set();
  function code(kind, v) {
    v = String(v || "").trim();
    var c = DMAP[kind].get(v);
    if (c === void 0) {
      c = DICT[kind].length;
      DICT[kind].push(v);
      DMAP[kind].set(v, c);
      dictDirty = true;
    }
    return c;
  }
  function entryOf(r) {
    var tags = (r.tags || []).join(",");
    var alt = (r.alt || []).map(function(a) {
      return a.f === "website" ? domainOf(a.v) : a.v;
    }).join(" ");
    return {
      id: r.id,
      n: r.name || "",
      s: [r.name, domainOf(r.website), r.email, r.city, digits(r.phone), normPhone(r.phone), r.inn, tags, r.person, alt, chSearch(r), cfSearch(r)].filter(Boolean).join(" ").toLowerCase(),
      st: r.status | 0,
      co: code("country", countryCode(r.country) || String(r.country || "").trim()),
      in: code("industry", r.industry),
      f: (r.email ? F_EMAIL : 0) | (r.phone ? F_PHONE : 0) | (r.type === "gov" ? F_GOV : 0) | (r.dnc ? F_DNC : 0) | (r.website ? F_WEB : 0) | (r.ch && r.ch.length || r.kCh && r.kCh.length ? F_CH : 0),
      u: r.updatedAt || 0,
      d: r.nextDue || "",
      tg: tags.toLowerCase(),
      ci: cityKey(r.city),
      ow: r.ownerId || "",
      lc: r.lastTouch || 0
    };
  }
  var toRow = function(e) {
    return [e.id, e.n, e.s, e.st, e.co, e.in, e.f, e.u, e.d, e.tg, e.ci, e.ow, e.lc];
  };
  var fromRow = function(a) {
    return { id: a[0], n: a[1], s: a[2], st: a[3], co: a[4], in: a[5], f: a[6], u: a[7], d: a[8], tg: a[9], ci: a[10] || "", ow: a[11] || "", lc: a[12] || 0 };
  };
  function upsertEntry(e) {
    var old = BYID.get(e.id);
    if (old) {
      for (var k in e) old[k] = e[k];
    } else {
      IDX.push(e);
      BYID.set(e.id, e);
      var c = Math.floor(e.id / CH);
      var arr = CHUNKS.get(c);
      if (!arr) {
        arr = [];
        CHUNKS.set(c, arr);
      }
      arr.push(e);
      if (e.id >= nextId) nextId = e.id + 1;
    }
    DIRTY.add(Math.floor(e.id / CH));
  }
  function removeEntry(id) {
    if (!BYID.has(id)) return;
    BYID.delete(id);
    IDX = IDX.filter(function(e) {
      return e.id !== id;
    });
    var c = Math.floor(id / CH);
    var arr = CHUNKS.get(c);
    if (arr) CHUNKS.set(c, arr.filter(function(e) {
      return e.id !== id;
    }));
    DIRTY.add(c);
  }
  function flushIdx(tx) {
    var s = tx.objectStore("idx");
    DIRTY.forEach(function(c) {
      var arr = CHUNKS.get(c) || [];
      if (arr.length) s.put({ c, rows: arr.map(toRow) });
      else s.delete(c);
    });
    DIRTY.clear();
    var m = tx.objectStore("meta");
    if (dictDirty) {
      m.put({ k: "dict", v: DICT });
      dictDirty = false;
    }
    m.put({ k: "idxinfo", v: { v: IDXV, n: IDX.length } });
  }
  function resetMem() {
    IDX = [];
    BYID = /* @__PURE__ */ new Map();
    CHUNKS = /* @__PURE__ */ new Map();
    DIRTY = /* @__PURE__ */ new Set();
    DICT = { country: [""], industry: [""] };
    DMAP = { country: /* @__PURE__ */ new Map([["", 0]]), industry: /* @__PURE__ */ new Map([["", 0]]) };
    dictDirty = true;
    nextId = 1;
  }
  async function loadIndex() {
    var tx = db.transaction(["idx", "meta", "companies"]);
    var res = await Promise.all([reqP(tx.objectStore("idx").getAll()), reqP(tx.objectStore("meta").get("dict")), reqP(tx.objectStore("meta").get("idxinfo")), reqP(tx.objectStore("companies").count())]);
    var chunks = res[0], dict = res[1], info = res[2], cnt = res[3];
    resetMem();
    dictDirty = false;
    if (dict) {
      DICT = dict.v;
      ["country", "industry"].forEach(function(k) {
        DMAP[k] = /* @__PURE__ */ new Map();
        DICT[k].forEach(function(v, i) {
          DMAP[k].set(v, i);
        });
      });
    }
    chunks.forEach(function(ch) {
      var arr = ch.rows.map(fromRow);
      CHUNKS.set(ch.c, arr);
      for (var i = 0; i < arr.length; i++) {
        IDX.push(arr[i]);
        BYID.set(arr[i].id, arr[i]);
        if (arr[i].id >= nextId) nextId = arr[i].id + 1;
      }
    });
    if (!info || info.v.v !== IDXV || IDX.length !== cnt) await rebuildIndex();
  }
  var KEYSV = 4;
  function keysSig(r) {
    return JSON.stringify([r.kCh && r.kCh.length ? r.kCh : null, r.kPhone || []]);
  }
  async function rebuildIndex() {
    alive("index");
    window.__sdLongOp = 1;
    var total = await reqP(db.transaction("companies").objectStore("companies").count());
    var resume = await metaGet("reidx"), keysv = await metaGet("keysv"), last = 0, done = 0, c0 = 0;
    resetMem();
    if (resume && resume.v === IDXV && resume.c > 0) {
      var rtx = db.transaction(["idx", "meta"]);
      var got = await Promise.all([reqP(rtx.objectStore("idx").getAll(IDBKeyRange.upperBound(resume.c - 1))), reqP(rtx.objectStore("meta").get("dict"))]);
      if (got[1]) {
        DICT = got[1].v;
        ["country", "industry"].forEach(function(k) {
          DMAP[k] = /* @__PURE__ */ new Map();
          DICT[k].forEach(function(v, i2) {
            DMAP[k].set(v, i2);
          });
        });
      }
      got[0].forEach(function(ch) {
        var arr = ch.rows.map(fromRow);
        CHUNKS.set(ch.c, arr);
        arr.forEach(function(e) {
          IDX.push(e);
          BYID.set(e.id, e);
          if (e.id >= nextId) nextId = e.id + 1;
        });
      });
      c0 = resume.c;
      last = c0 * CH - 1;
      done = IDX.length;
    } else {
      var ctx = db.transaction(["idx", "meta"], "readwrite");
      ctx.objectStore("idx").clear();
      ctx.objectStore("meta").put({ k: "reidx", v: { v: IDXV, c: 0 } });
      await txDone(ctx);
    }
    var msg = function() {
      return t("reindex_n", { a: num(done), b: num(total) });
    };
    busy(msg(), total ? done / total : 0);
    for (; ; ) {
      var recs = await reqP(db.transaction("companies").objectStore("companies").getAll(IDBKeyRange.lowerBound(last, true), 1e3));
      if (!recs.length) break;
      var rewrite = [];
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (keysv !== KEYSV) {
          var before = keysSig(r);
          setKeys(r);
          if (keysSig(r) !== before) rewrite.push(r);
        }
        upsertEntry(entryOf(r));
        if (i % 500 === 499) {
          busy(t("reindex_n", { a: num(done + i + 1), b: num(total) }), total ? (done + i + 1) / total : 1);
          await sleep0();
        }
      }
      done += recs.length;
      last = recs[recs.length - 1].id;
      var cDone = Math.floor(last / CH), wtx = db.transaction(["companies", "idx", "meta"], "readwrite"), is = wtx.objectStore("idx");
      rewrite.forEach(function(x) {
        wtx.objectStore("companies").put(x);
      });
      DIRTY.forEach(function(c) {
        if (c < cDone) {
          var arr = CHUNKS.get(c) || [];
          if (arr.length) is.put({ c, rows: arr.map(toRow) });
          DIRTY.delete(c);
        }
      });
      if (dictDirty) {
        wtx.objectStore("meta").put({ k: "dict", v: DICT });
        dictDirty = false;
      }
      wtx.objectStore("meta").put({ k: "reidx", v: { v: IDXV, c: cDone } });
      await txDone(wtx);
      busy(msg(), total ? done / total : 1);
      await sleep0();
    }
    DIRTY = new Set(CHUNKS.keys());
    var tx = db.transaction(["idx", "meta"], "readwrite");
    flushIdx(tx);
    tx.objectStore("meta").put({ k: "keysv", v: KEYSV });
    tx.objectStore("meta").delete("reidx");
    await txDone(tx);
    window.__sdLongOp = 0;
    window.__lastReindex = { total, resumedFrom: c0 };
    busy(null);
  }
  function setKeys(r) {
    var webs = [r.website].concat((r.alt || []).filter(function(a) {
      return a.f === "website";
    }).map(function(a) {
      return a.v;
    })).map(domainOf).filter(function(d) {
      return d && d.indexOf(".") > 0 && !GENERIC_HOSTS[d];
    });
    var mails = [r.email].concat((r.alt || []).filter(function(a) {
      return a.f === "email";
    }).map(function(a) {
      return a.v;
    })).map(function(m) {
      return String(m || "").trim().toLowerCase();
    }).filter(function(m) {
      return /.@./.test(m);
    });
    r.kWeb = uniq(webs);
    r.kEmail = uniq(mails);
    r.kLei = /^[A-Z0-9]{20}$/.test(r.lei || "") ? [r.lei] : [];
    r.kExt = r.extId ? [String(r.extId)] : [];
    var nn = normName(r.name);
    var cc0 = countryCode(r.country), raw0 = String(r.country || "").trim().toLowerCase();
    r.kNC = nn ? uniq([nn + "|" + raw0].concat(cc0 ? [nn + "|" + cc0.toLowerCase(), nn + "|" + CN[cc0][0].toLowerCase()] : [])) : [];
    var ck = cityKey(r.city);
    r.kNCity = nn && ck ? [nn + "|" + ck] : [];
    r.kPhone = uniq([r.phone].concat((r.alt || []).filter(function(a) {
      return a.f === "phone";
    }).map(function(a) {
      return a.v;
    })).map(normPhone).filter(Boolean));
    var inn = normInn(r.inn);
    r.kInn = inn ? [inn] : [];
    var chs = allCh(r);
    r.kCh = uniq(chs.map(chKey).filter(Boolean));
    chs.forEach(function(c) {
      if (c.t === "whatsapp" || c.t === "viber") {
        var np = normPhone(c.v);
        if (np && r.kPhone.indexOf(np) < 0) r.kPhone.push(np);
      }
    });
  }
  function uniq(a) {
    var o = [];
    a.forEach(function(x) {
      if (o.indexOf(x) < 0) o.push(x);
    });
    return o;
  }
  async function putCompanies(recs, touches, bump, noSync) {
    var tx = db.transaction(["companies", "idx", "meta", "touches"], "readwrite");
    var cs = tx.objectStore("companies"), now = Date.now();
    recs.forEach(function(r) {
      if (!r.id) {
        r.id = nextId++;
        r.createdAt = r.createdAt || now;
      }
      if (!r.uid) r.uid = uuid();
      if (bump !== false) {
        r.updatedAt = now;
      }
      if (!noSync) DIRTYC.add(r.id);
      setKeys(r);
      cs.put(r);
      upsertEntry(entryOf(r));
    });
    (touches || []).forEach(function(x) {
      if (!x.uid) x.uid = uuid();
      if (x.pend == null) x.pend = x.kind === "status" || noSync ? 0 : 1;
      if (!x.author) x.author = myName();
      if (!x.authorId && x.pend) x.authorId = AU.uid;
      tx.objectStore("touches").add(x);
    });
    flushIdx(tx);
    if (!noSync) tx.objectStore("meta").put({ k: "dirtyC", v: Array.from(DIRTYC) });
    await txDone(tx);
    if (!noSync) scheduleSync();
  }
  function newRec(o) {
    var now = Date.now();
    var r = { uid: uuid(), name: "", country: "", city: "", industry: "", type: "company", website: "", email: "", phone: "", inn: "", ownerId: null, lei: "", extId: "", person: "", address: "", comment: "", status: 0, tags: [], source: "", basis: "public", dnc: false, alt: [], ch: [], cf: {}, extra: null, createdAt: now, updatedAt: now, lastTouch: 0, nextDue: "" };
    for (var k in o) r[k] = o[k];
    return r;
  }
  var S = { tab: "list", q: "", sort: "upd", sel: null, settings: { me: "", phone: "+998 77 188 48 80" }, segments: [], templates: [], daily: { d: "", n: 0 } };
  Object.defineProperty(S, "segments", { configurable: true, get: function() {
    return S.settings.views || (S.settings.views = []);
  }, set: function(v) {
    S.settings.views = v;
  } });
  var F0 = function() {
    return { country: -1, industry: -1, status: -1, type: "", email: false, phone: false, tag: "", task: "", hideDnc: false, contact: "", city: "" };
  };
  var F = F0();
  var RESULT = [];
  function filterActive() {
    var f = F;
    return f.country >= 0 || f.industry >= 0 || f.status !== -1 || f.type || f.email || f.phone || f.tag || f.task || f.hideDnc || !!f.contact || !!f.city;
  }
  function phoneQuery(q) {
    q = String(q || "").trim();
    if (!/^[\d\s()+\-.]+$/.test(q)) return "";
    var d = q.replace(/\D/g, "").replace(/^00/, "");
    if (d.length < 5) return q.charAt(0) === "+" && d ? d : "";
    if (d.length >= 12 && d.slice(0, 3) === "998") d = d.slice(3);
    else if (d.length === 10 && d.charAt(0) === "8") d = d.slice(1);
    return d;
  }
  function searchToks(q) {
    var pd = phoneQuery(q);
    return pd ? [pd] : String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
  }
  function applyFilter(fo, qo, countOnly) {
    var staleMs = Date.now() - STALE_DAYS() * 864e5;
    var toks = searchToks(qo != null ? qo : S.q), td = today(), f = fo || F, tag = f.tag ? "," + f.tag.toLowerCase() + "," : "";
    var out = [];
    for (var i = 0; i < IDX.length; i++) {
      var e = IDX[i];
      if (f.status >= 0 && e.st !== f.status) continue;
      if (f.status === -2 && (e.st === 5 || e.st === 6)) continue;
      if (f.country >= 0 && e.co !== f.country) continue;
      if (f.industry >= 0 && e.in !== f.industry) continue;
      if (f.city && e.ci !== f.city) continue;
      if (f.type === "gov" && !(e.f & F_GOV)) continue;
      if (f.type === "company" && e.f & F_GOV) continue;
      if (f.email && !(e.f & F_EMAIL)) continue;
      if (f.phone && !(e.f & F_PHONE)) continue;
      if (f.hideDnc && e.f & F_DNC) continue;
      if (f.contact === "has" && !hasContact(e)) continue;
      if (f.contact === "none" && hasContact(e)) continue;
      if (f.task === "has" && !e.d) continue;
      if (f.task === "none" && e.d) continue;
      if (f.task === "overdue" && !(e.d && e.d < td)) continue;
      if (f.task === "stale" && !(e.st >= 1 && e.st <= 4 && (!e.lc || staleMs - e.lc > 0))) continue;
      if (tag && ("," + e.tg + ",").indexOf(tag) < 0) continue;
      var ok = true;
      for (var j = 0; j < toks.length; j++) if (e.s.indexOf(toks[j]) < 0) {
        ok = false;
        break;
      }
      if (ok) out.push(e);
    }
    if (countOnly) return out.length;
    var cmp = {
      upd: function(a, b) {
        return b.u - a.u || b.id - a.id;
      },
      name: function(a, b) {
        return a.s < b.s ? -1 : a.s > b.s ? 1 : 0;
      },
      status: function(a, b) {
        return a.st - b.st || b.u - a.u;
      },
      due: function(a, b) {
        return (a.d || "9") < (b.d || "9") ? -1 : (a.d || "9") > (b.d || "9") ? 1 : b.u - a.u;
      },
      contact: function(a, b) {
        return (hasContact(b) ? 1 : 0) - (hasContact(a) ? 1 : 0) || b.u - a.u || b.id - a.id;
      }
    }[S.sort];
    out.sort(cmp);
    RESULT = out;
  }
  var ICO = {
    search: '<path d="M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/>',
    filter: '<path d="M3 5h18v2l-7 7v5l-4 2v-7L3 7z"/>',
    phone: '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>',
    mail: '<path d="M3 5h18c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1zm1 2.4V17h16V7.4l-8 5.3zM5.2 7l6.8 4.5L18.8 7z"/>',
    globe: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3a15 15 0 0 0-1.3-6A8 8 0 0 1 18.9 11zM12 4c.9 1.2 1.7 3.6 1.9 7h-3.8c.2-3.4 1-5.8 1.9-7zM9.4 5a15 15 0 0 0-1.3 6h-3A8 8 0 0 1 9.4 5zM5.1 13h3a15 15 0 0 0 1.3 6 8 8 0 0 1-4.3-6zm5 0h3.8c-.2 3.4-1 5.8-1.9 7-.9-1.2-1.7-3.6-1.9-7zm4.5 6a15 15 0 0 0 1.3-6h3a8 8 0 0 1-4.3 6z"/>',
    wa: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3z"/>',
    tg: '<path d="M21.5 4.2 2.9 11.4c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.4-1.4zM8.9 14.1l9.3-5.9c.4-.3.8-.1.5.2l-7.7 7-.3 3.3z"/>',
    plus: '<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>',
    check: '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
    x: '<path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7l-1.4-1.4L9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z" transform="translate(1.4 0)"/>',
    back: '<path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/>',
    list: '<path d="M4 6h2v2H4zm4 0h12v2H8zM4 11h2v2H4zm4 0h12v2H8zm-4 5h2v2H4zm4 0h12v2H8z"/>',
    cal: '<path d="M7 2h2v2h6V2h2v2h3c.6 0 1 .4 1 1v15c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1h3zM5 9v10h14V9zm2 2h4v4H7z"/>',
    chart: '<path d="M4 19h16v2H4zM5 10h3v7H5zm5.5-5h3v12h-3zM16 13h3v4h-3z"/>',
    more: '<path d="M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
    edit: '<path d="M4 17.2V20h2.8l8.3-8.3-2.8-2.8zM19.7 7a1 1 0 0 0 0-1.4L18.4 4.3a1 1 0 0 0-1.4 0l-1.6 1.6 2.8 2.8z"/>',
    stop: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4 12a8 8 0 0 1 12.9-6.3L5.7 16.9A8 8 0 0 1 4 12zm8 8a8 8 0 0 1-4.9-1.7L18.3 7.1A8 8 0 0 1 12 20z"/>',
    upload: '<path d="M11 16V7.8L7.4 11.4 6 10l6-6 6 6-1.4 1.4L13 7.8V16zm-6 2h14v2H5z"/>',
    send: '<path d="M3 20.5V14l9-2-9-2V3.5L22 12z"/>',
    board: '<path d="M3 4h5v16H3zm6.5 0h5v10h-5zM16 4h5v13h-5z"/>',
    sync: '<path d="M12 4V1L8 5l4 4V6a6 6 0 0 1 5.7 7.9l1.5 1.5A8 8 0 0 0 12 4zm-5.7 4.6L4.8 7.1A8 8 0 0 0 12 20v3l4-4-4-4v3a6 6 0 0 1-5.7-7.4z"/>',
    user: '<path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z"/>',
    download: '<path d="M11 4h2v8.2l3.6-3.6L18 10l-6 6-6-6 1.4-1.4 3.6 3.6zm-6 14h14v2H5z"/>'
  };
  ICO.eye = '<path d="M12 5C5.6 5 2 12 2 12s3.6 7 10 7 10-7 10-7-3.6-7-10-7zm0 2c4.2 0 7.1 3.6 7.8 5-.7 1.4-3.6 5-7.8 5s-7.1-3.6-7.8-5c.7-1.4 3.6-5 7.8-5zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>';
  ICO.eyeoff = '<path d="M3.3 2 2 3.3l3.2 3.2C3.1 8.3 2 12 2 12s3.6 7 10 7c1.9 0 3.5-.6 4.9-1.4l3.8 3.8 1.3-1.3L3.3 2zM12 17c-4.2 0-7.1-3.6-7.8-5 .4-.9 1.4-2.4 2.9-3.6l1.8 1.8A3 3 0 0 0 13 14.3l2.4 2.4c-1 .2-2.1.3-3.4.3zm0-12c6.4 0 10 7 10 7s-.9 1.8-2.6 3.6l-1.4-1.4c1-1 1.6-2 1.8-2.2-.7-1.4-3.6-5-7.8-5-.7 0-1.4.1-2 .3L8.4 5.7C9.5 5.3 10.7 5 12 5z"/>';
  function eyeify(root) {
    $$("input[type=password]:not([data-eye])", root).forEach(function(inp) {
      inp.setAttribute("data-eye", "1");
      var w = document.createElement("span");
      w.className = "pwwrap";
      inp.parentNode.insertBefore(w, inp);
      w.appendChild(inp);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pweye";
      b.setAttribute("aria-label", t("pw_show"));
      b.innerHTML = ico("eye");
      b.onclick = function(e) {
        e.preventDefault();
        var show = inp.type === "password";
        inp.type = show ? "text" : "password";
        b.innerHTML = ico(show ? "eyeoff" : "eye");
        b.setAttribute("aria-label", t(show ? "pw_hide" : "pw_show"));
        b.classList.toggle("on", show);
      };
      w.appendChild(b);
    });
  }
  try {
    new MutationObserver(function() {
      eyeify(document);
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {
  }
  var ico = function(n, cls) {
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + ICO[n] + "</svg>";
  };
  var STACK = [], closeWaiters = [];
  function openSheet(html, opt) {
    opt = opt || {};
    var wrap = document.createElement("div");
    wrap.className = "sheet-wrap" + (opt.full ? " full" : "");
    wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + "</div>";
    wrap._opt = opt;
    wrap.addEventListener("click", function(e) {
      if (e.target === wrap && !opt.form) closeTop();
    });
    if (opt.form) {
      var mark = function(e) {
        if (!opt.formScope || e.target.closest && e.target.closest(opt.formScope)) wrap._dirty = true;
      };
      wrap.addEventListener("input", mark);
      wrap.addEventListener("change", mark);
    }
    $("#layer").appendChild(wrap);
    STACK.push(wrap);
    try {
      history.pushState({ sd: STACK.length }, "");
    } catch (e) {
    }
    return wrap.firstChild;
  }
  function closeTop() {
    return new Promise(function(r) {
      if (!STACK.length) return r();
      closeWaiters.push(r);
      history.back();
    });
  }
  async function guardedClose() {
    var w = STACK[STACK.length - 1];
    if (w && w._opt && w._opt.form && w._dirty) {
      var bs = (w._opt.save && w.querySelector(w._opt.save) ? [["save", t("unsaved_save"), "primary"]] : []).concat([["drop", t("unsaved_drop"), "danger"], ["stay", t("unsaved_stay"), "ghost"]]);
      var ch = await choose(t("unsaved_q"), bs);
      if (ch === "save") {
        var b = w.querySelector(w._opt.save);
        if (b) b.click();
        return;
      }
      if (ch !== "drop") return;
      w._dirty = false;
    }
    return closeTop();
  }
  function choose(msg, btns) {
    return new Promise(function(res) {
      var val = null;
      var sh = openSheet('<div class="dlg"><p>' + esc(msg) + '</p><div class="col">' + btns.map(function(b) {
        return '<button class="btn ' + (b[2] || "ghost") + '" data-ch="' + b[0] + '">' + esc(b[1]) + "</button>";
      }).join("") + "</div></div>", { onClose: function() {
        res(val);
      } });
      $$("[data-ch]", sh).forEach(function(b) {
        b.onclick = function() {
          val = b.dataset.ch;
          closeTop();
        };
      });
    });
  }
  function fieldErr(inp, msg) {
    if (!inp) {
      toast(msg);
      return;
    }
    var anchor = inp.parentNode && inp.parentNode.classList && inp.parentNode.classList.contains("pwwrap") ? inp.parentNode : inp;
    inp.classList.add("err");
    inp.setAttribute("aria-invalid", "true");
    var n = anchor.nextElementSibling && anchor.nextElementSibling.classList.contains("ferr") ? anchor.nextElementSibling : null;
    if (!n) {
      n = document.createElement("div");
      n.className = "ferr";
      n.setAttribute("role", "alert");
      anchor.insertAdjacentElement("afterend", n);
    }
    n.textContent = msg;
    inp.addEventListener("input", function f() {
      inp.classList.remove("err");
      inp.removeAttribute("aria-invalid");
      if (n.parentNode) n.remove();
      inp.removeEventListener("input", f);
    });
    try {
      inp.focus();
    } catch (e) {
    }
  }
  window.addEventListener("popstate", function() {
    var w = STACK.pop();
    if (w) {
      w.remove();
      if (w._opt.onClose) w._opt.onClose();
    }
    var r = closeWaiters.shift();
    if (r) r();
  });
  function sheetHead(title, extra) {
    return '<div class="sh-head"><button class="icbtn" data-act="close" aria-label="' + esc(t("back")) + '">' + ico("back") + "</button><h2>" + esc(title) + "</h2>" + (extra || "") + "</div>";
  }
  var toastT;
  function toast(msg, btn, fn) {
    var el = $("#toast");
    el.innerHTML = "<span>" + esc(msg) + "</span>" + (btn ? '<button class="tbtn">' + esc(btn) + "</button>" : "");
    el.classList.add("on");
    if (btn) el.querySelector("button").onclick = function() {
      el.classList.remove("on");
      fn();
    };
    clearTimeout(toastT);
    toastT = setTimeout(function() {
      el.classList.remove("on");
    }, btn ? 6e3 : 2600);
  }
  function alive(phase) {
    window.__sdAlive = Date.now();
    if (phase) window.__sdPhase = phase;
  }
  function busy(msg, p) {
    alive();
    var el = $("#busy");
    if (msg == null) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    $("#busyMsg").textContent = msg;
    $("#busyBar").style.width = Math.round((p || 0) * 100) + "%";
  }
  function ask(msg, opt) {
    opt = opt || {};
    return new Promise(function(res) {
      var sh = openSheet('<div class="dlg"><p>' + esc(msg) + "</p>" + (opt.input != null ? '<input class="inp" id="askIn" value="' + esc(opt.input) + '" placeholder="' + esc(opt.ph || "") + '">' : "") + '<div class="row2"><button class="btn ghost" data-r="0">' + esc(t("cancel")) + '</button><button class="btn ' + (opt.danger ? "danger" : "primary") + '" data-r="1">' + esc(opt.ok || t("yes")) + "</button></div></div>", { onClose: function() {
        res(result);
      } });
      var result = null;
      var inp = sh.querySelector("#askIn");
      if (inp) setTimeout(function() {
        inp.focus();
      }, 50);
      $$("[data-r]", sh).forEach(function(b) {
        b.onclick = function() {
          result = b.dataset.r === "1" ? inp ? inp.value : true : null;
          closeTop();
        };
      });
    });
  }
  function setTab(tab) {
    S.tab = tab;
    document.body.classList.toggle("tab-chat", tab === "chat");
    document.body.classList.toggle("tab-tasks", tab === "tasks");
    var bb = $("#btnBack");
    if (bb) bb.hidden = tab === "list";
    $$(".view").forEach(function(v) {
      v.hidden = v.id !== "v-" + tab;
    });
    $$(".tabs button").forEach(function(b) {
      b.classList.toggle("on", b.dataset.tab === tab);
    });
    if (tab === "list") refreshList();
    else if (tab === "today") renderToday();
    else if (tab === "stats") renderStats();
    else if (tab === "deals") renderDeals();
    else if (tab === "chat") renderChat();
    else if (tab === "tasks" && window.SDTeam) SDTeam.render();
    else renderMore();
  }
  function renderStatic() {
    document.documentElement.lang = LANG === "uz" ? "uz-Latn" : LANG === "uzc" ? "uz-Cyrl" : LANG;
    $$("[data-t]").forEach(function(el) {
      el.textContent = t(el.dataset.t);
    });
    $$("[data-tp]").forEach(function(el) {
      el.placeholder = t(el.dataset.tp);
    });
    $("#sort").innerHTML = ["upd", "name", "status", "due", "contact"].map(function(k) {
      return '<option value="' + k + '"' + (S.sort === k ? " selected" : "") + ">" + esc(t("sort_" + k)) + "</option>";
    }).join("");
    $$("#langSw button").forEach(function(b) {
      b.classList.toggle("on", b.dataset.lang === LANG);
    });
  }
  function setLang(l) {
    LANG = l;
    try {
      localStorage.setItem("sd-lang", l);
    } catch (e) {
    }
    renderStatic();
    setTab(S.tab);
  }
  var ROWH = 68, MAXH = 8e6, rafPending = false;
  function refreshList(keepScroll) {
    applyFilter();
    var sc = $("#scroller");
    if (!keepScroll) sc.scrollTop = 0;
    var total = IDX.length, n = RESULT.length;
    $("#count").textContent = (n !== total ? t("co_found", { n: num(n), m: num(total) }) : t("co_total", { n: num(total) })) + (catOn() && syncOn() ? " \xB7 " + t("cat_phone_sfx") : "");
    $("#fbadge").hidden = !filterActive();
    $("#empty").hidden = total > 0;
    if (total === 0 && window.SDOnb) SDOnb.fillEmpty($("#empty"));
    $("#nores").hidden = !(total > 0 && n === 0);
    $("#listwrap").hidden = total === 0;
    renderSegChips();
    renderSelBar();
    if (S.view === "board") drawBoard();
    else drawRows();
    updateTodayBadge();
    catBarUpdate(n);
    callBarUpdate();
    catCallLabel();
    nfHintUpdate(n, total);
  }
  function drawRows() {
    rafPending = false;
    var sc = $("#scroller"), sp = $("#spacer"), n = RESULT.length, viewH = sc.clientHeight || 600;
    var H = Math.min(n * ROWH, MAXH), scaled = n * ROWH > MAXH;
    sp.style.height = H + 80 + "px";
    var st = sc.scrollTop, first, off = 0;
    if (!scaled) first = Math.floor(st / ROWH);
    else {
      var exact = (H > viewH ? st / (H - viewH) : 0) * Math.max(0, n - viewH / ROWH);
      first = Math.floor(exact);
      off = exact - first;
    }
    var cnt = Math.ceil(viewH / ROWH) + 3, td = today(), html = "", nowMs = Date.now(), stale = STALE_DAYS();
    first = Math.max(0, first - 1);
    for (var i = first; i < Math.min(n, first + cnt); i++) {
      var e = RESULT[i];
      var top = scaled ? st + (i - first - off - (first > 0 ? 1 : 0) + 1 - 1) * ROWH : i * ROWH;
      if (scaled) top = st + (i - (first + 1) - off + 1) * ROWH - ROWH * (first === 0 ? 0 : 0);
      var sub = rowSub(e, nowMs), canCall = e.f & F_PHONE && !(e.f & F_DNC) && !S.sel;
      var selOn = S.sel && (S.sel.all || S.sel.ids.has(e.id));
      html += '<div class="row' + (e.f & F_DNC ? " dnc" : "") + '" data-act="open" data-id="' + e.id + '" style="top:' + top + 'px">' + (S.sel ? '<span class="cb' + (selOn ? " on" : "") + '">' + (selOn ? ico("check") : "") + "</span>" : "") + '<div class="rmain"><div class="rname">' + esc(e.n) + '</div><div class="rsub">' + (e.f & F_GOV ? '<b class="gov">' + esc(t("type_gov")) + "</b> " : "") + esc(sub) + '</div></div><div class="rside"><span class="chip s' + e.st + '">' + esc(stName(e.st)) + '</span><div class="ricons">' + (e.d ? '<span class="due' + (e.d < td ? " late" : e.d === td ? " now" : "") + '">' + fmtDate(e.d).slice(0, 5) + "</span>" : "") + (e.st >= 1 && e.st <= 4 && e.lc && (nowMs - e.lc) / 864e5 >= stale ? '<span class="stale">' + Math.floor((nowMs - e.lc) / 864e5) + " " + esc(t("days")) + "</span>" : "") + (e.f & F_DNC ? ico("stop", "red") : "") + (e.f & F_PHONE && !canCall ? ico("phone") : "") + (e.f & F_EMAIL ? ico("mail") : "") + "</div></div>" + (canCall ? '<button class="rcall" type="button" data-act="rowCall" data-id="' + e.id + '" aria-label="' + esc(t("c_call")) + '" title="' + esc(t("c_call")) + '">' + ico("phone") + "</button>" : "") + "</div>";
    }
    $("#rows").innerHTML = html;
  }
  function cityLabel(k) {
    if (!k) return "";
    var al = CITY_ALIAS[k];
    if (al) {
      var pick = LANG === "ru" ? al.filter(function(a) {
        return /[а-яё]/.test(a);
      })[0] : LANG === "uz" ? al[0] : k;
      if (pick) k = pick;
    }
    return k.charAt(0).toUpperCase() + k.slice(1);
  }
  function agoText(ms, nowMs) {
    var d = Math.floor(((nowMs || Date.now()) - ms) / 864e5);
    return d <= 0 ? t("ago_today") : t("ago_days", { n: d });
  }
  function rowSub(e, nowMs) {
    var raw = DICT.country[e.co], cc = countryCode(raw);
    var parts = [cityLabel(e.ci), cc ? cc !== "UZ" ? countryName(raw) : "" : raw, DICT.industry[e.in]];
    if (e.lc) parts.push(agoText(e.lc, nowMs));
    return parts.filter(Boolean).join(" \xB7 ");
  }
  function drawBoard() {
    var b = $("#board"), cols = STATUSES.map(function() {
      return [];
    }), cnt = [0, 0, 0, 0, 0, 0, 0];
    RESULT.forEach(function(e) {
      cnt[e.st]++;
      if (cols[e.st].length < 40) cols[e.st].push(e);
    });
    b.innerHTML = STATUSES.map(function(s, i) {
      return '<div class="kcol" data-st="' + i + '"><div class="khead s' + i + '"><b>' + esc(stName(i)) + "</b><span>" + num(cnt[i]) + '</span></div><div class="klist">' + cols[i].map(function(e) {
        return '<div class="kcard" draggable="true" data-id="' + e.id + '"><div class="kname" data-act="open" data-id="' + e.id + '">' + esc(e.n) + '</div><div class="rsub">' + esc([DICT.country[e.co], DICT.industry[e.in]].filter(Boolean).join(" \xB7 ")) + '</div><button class="kmove" data-act="kmove" data-id="' + e.id + '" aria-label="' + esc(t("f_status")) + '">' + esc(t("k_move")) + "</button></div>";
      }).join("") + (cnt[i] > 40 ? '<div class="muted small kmore">' + esc(t("k_more", { n: num(cnt[i] - 40) })) + "</div>" : "") + "</div></div>";
    }).join("");
  }
  function setView(v) {
    S.view = v;
    try {
      localStorage.setItem("sd-view", v);
    } catch (e) {
    }
    $("#scroller").hidden = v === "board";
    $("#board").hidden = v !== "board";
    $("#btnView").classList.toggle("on", v === "board");
    if (v === "board") drawBoard();
    else drawRows();
  }
  function renderSegChips() {
    var el = $("#segChips");
    var cur = S.segments.some(viewActive);
    el.innerHTML = S.segments.map(function(v) {
      var on = viewActive(v);
      return '<button class="segchip' + (on ? " on" : "") + '" data-act="seg" data-id="' + esc(v.id) + '" aria-pressed="' + on + '">' + esc(v.name) + ' <b class="vc">\u2026</b></button>' + (on ? '<button class="segchip more" type="button" data-cat="viewMenu" data-id="' + esc(v.id) + '" aria-label="' + esc(t("cat_view_menu", { n: v.name })) + '">\u22EF</button>' : "");
    }).join("") + ((filterActive() || S.q) && !cur ? '<button class="segchip add" data-act="segSave">' + ico("plus") + esc(t("cat_view_save")) + "</button>" : "");
    el.hidden = !el.innerHTML;
    if (!el.hidden) viewCounts();
  }
  function renderSelBar() {
    var b = $("#selbar");
    if (!S.sel) {
      b.hidden = true;
      $("#btnSelect").textContent = t("select");
      return;
    }
    var n = S.sel.all ? RESULT.length : S.sel.ids.size;
    b.hidden = false;
    $("#btnSelect").textContent = t("cancel");
    b.innerHTML = "<span>" + esc(t("selected", { n: num(n) })) + '</span><button class="btn small ghost" data-act="selAll">' + esc(t("select_all", { n: num(RESULT.length) })) + '</button><button class="btn small primary" data-act="mass">' + esc(t("mass_actions")) + "</button>";
  }
  function countsBy(field) {
    var m = /* @__PURE__ */ new Map();
    IDX.forEach(function(e) {
      m.set(e[field], (m.get(e[field]) || 0) + 1);
    });
    return m;
  }
  function countryOpts(counts, cur, q) {
    var arr = [];
    counts.forEach(function(n, c) {
      if (c > 0) arr.push([c, n, DICT.country[c]]);
    });
    if (cur > 0 && !counts.has(cur)) arr.push([cur, 0, DICT.country[cur]]);
    if (q) arr = arr.filter(function(a) {
      var c = countryCode(a[2]);
      return cnNorm(countryName(a[2])).indexOf(q) >= 0 || cnNorm(a[2]).indexOf(q) >= 0 || c && (cnNorm(CN[c][0]).indexOf(q) >= 0 || cnNorm(CN[c][1]).indexOf(q) >= 0 || cnNorm(CN[c][2]).indexOf(q) >= 0 || c.toLowerCase() === q);
    });
    arr.sort(function(a, b) {
      return countryCmp(a[2], b[2]);
    });
    return '<option value="-1">' + esc(t("all")) + "</option>" + arr.slice(0, 400).map(function(a) {
      return '<option value="' + a[0] + '"' + (a[0] === cur ? " selected" : "") + ">" + esc(countryName(a[2])) + " (" + num(a[1]) + ")</option>";
    }).join("");
  }
  function facetPass(f, qo, list) {
    list = list || IDX;
    var staleMs = Date.now() - STALE_DAYS() * 864e5, toks = searchToks(qo), td = today(), tag = f.tag ? "," + f.tag.toLowerCase() + "," : "";
    var R = { n: 0, st: [0, 0, 0, 0, 0, 0, 0], act: 0, co: /* @__PURE__ */ new Map(), ind: /* @__PURE__ */ new Map(), ci: /* @__PURE__ */ new Map(), ty: { company: 0, gov: 0 }, tg: /* @__PURE__ */ new Map(), ff: [0, 0, 0, 0, 0, 0], qFail: 0 };
    var nT = toks.length;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (f.email && !(e.f & F_EMAIL)) continue;
      if (f.phone && !(e.f & F_PHONE)) continue;
      if (f.hideDnc && e.f & F_DNC) continue;
      if (f.contact === "has" && !hasContact(e)) continue;
      if (f.contact === "none" && hasContact(e)) continue;
      if (f.task === "has" && !e.d) continue;
      if (f.task === "none" && e.d) continue;
      if (f.task === "overdue" && !(e.d && e.d < td)) continue;
      if (f.task === "stale" && !(e.st >= 1 && e.st <= 4 && (!e.lc || staleMs - e.lc > 0))) continue;
      var nf = 0, fail = -1;
      if (f.status >= 0 && e.st !== f.status || f.status === -2 && (e.st === 5 || e.st === 6)) {
        nf++;
        fail = 0;
      }
      if (f.country >= 0 && e.co !== f.country) {
        if (++nf > 1) continue;
        fail = 1;
      }
      if (f.industry >= 0 && e.in !== f.industry) {
        if (++nf > 1) continue;
        fail = 2;
      }
      if (f.type === "gov" && !(e.f & F_GOV) || f.type === "company" && e.f & F_GOV) {
        if (++nf > 1) continue;
        fail = 3;
      }
      if (f.city && e.ci !== f.city) {
        if (++nf > 1) continue;
        fail = 4;
      }
      if (tag && ("," + e.tg + ",").indexOf(tag) < 0) {
        if (++nf > 1) continue;
        fail = 5;
      }
      var sOk = true;
      for (var j = 0; j < nT; j++) if (e.s.indexOf(toks[j]) < 0) {
        sOk = false;
        break;
      }
      if (!sOk) {
        if (nf === 0) R.qFail++;
        continue;
      }
      if (nf === 0) R.n++;
      else R.ff[fail]++;
      if (nf === 0 || fail === 0) {
        R.st[e.st]++;
        if (e.st !== 5 && e.st !== 6) R.act++;
      }
      if (nf === 0 || fail === 1) R.co.set(e.co, (R.co.get(e.co) || 0) + 1);
      if (nf === 0 || fail === 2) R.ind.set(e.in, (R.ind.get(e.in) || 0) + 1);
      if (nf === 0 || fail === 3) {
        if (e.f & F_GOV) R.ty.gov++;
        else R.ty.company++;
      }
      if ((nf === 0 || fail === 4) && e.ci) R.ci.set(e.ci, (R.ci.get(e.ci) || 0) + 1);
      if ((nf === 0 || fail === 5) && e.tg) {
        var tg = e.tg.split(",");
        for (var k = 0; k < tg.length; k++) if (tg[k]) R.tg.set(tg[k], (R.tg.get(tg[k]) || 0) + 1);
      }
    }
    R.relax = { status: R.n + R.ff[0], country: R.n + R.ff[1], industry: R.n + R.ff[2], type: R.n + R.ff[3], city: R.n + R.ff[4], tag: R.n + R.ff[5], q: R.n + R.qFail };
    return R;
  }
  var FL = { R: null };
  var optSimple = function(arr, cur, label) {
    var has = false, out = arr.filter(function(a) {
      if (a[0] === cur) has = true;
      return a[1] > 0 || a[0] === cur;
    });
    if (cur !== "" && cur !== -1 && !has) out.push([cur, 0]);
    return out;
  };
  function fOptStatus(R, cur) {
    return '<option value="-1">' + esc(t("all")) + "</option>" + (R.act > 0 || cur === -2 ? '<option value="-2"' + (cur === -2 ? " selected" : "") + ">" + esc(t("st_active")) + " (" + num(R.act) + ")</option>" : "") + STATUSES.map(function(s, i) {
      return R.st[i] > 0 || cur === i ? '<option value="' + i + '"' + (cur === i ? " selected" : "") + ">" + esc(stName(i)) + " (" + num(R.st[i]) + ")</option>" : "";
    }).join("");
  }
  function fOptIndustry(R, cur) {
    var arr = [];
    R.ind.forEach(function(n, c) {
      if (c > 0) arr.push([c, n]);
    });
    arr = optSimple(arr, cur, "industry").sort(function(a, b) {
      return b[1] - a[1] || (a[0] === cur ? -1 : 0);
    });
    return '<option value="-1">' + esc(t("all")) + "</option>" + arr.slice(0, 600).map(function(a) {
      return '<option value="' + a[0] + '"' + (a[0] === cur ? " selected" : "") + ">" + esc(DICT.industry[a[0]]) + " (" + num(a[1]) + ")</option>";
    }).join("");
  }
  function fOptCity(R, cur) {
    var arr = [];
    R.ci.forEach(function(n, k) {
      arr.push([k, n]);
    });
    arr = optSimple(arr, cur, "city").sort(function(a, b) {
      return b[1] - a[1];
    });
    return '<option value="">' + esc(t("all")) + "</option>" + arr.slice(0, 600).map(function(a) {
      return '<option value="' + esc(a[0]) + '"' + (a[0] === cur ? " selected" : "") + ">" + esc(cityLabel(a[0])) + " (" + num(a[1]) + ")</option>";
    }).join("");
  }
  function fOptType(R, cur) {
    var one = function(k, n) {
      return n > 0 || cur === k ? '<option value="' + k + '"' + (cur === k ? " selected" : "") + ">" + esc(t(k === "gov" ? "type_gov" : "type_company")) + " (" + num(n) + ")</option>" : "";
    };
    return '<option value="">' + esc(t("any")) + "</option>" + one("company", R.ty.company) + one("gov", R.ty.gov);
  }
  function fOptTag(R, cur) {
    var arr = [];
    R.tg.forEach(function(n, k) {
      arr.push([k, n]);
    });
    arr = optSimple(arr, cur, "tag").sort(function(a, b) {
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    });
    return '<option value="">' + esc(t("all")) + "</option>" + arr.map(function(a) {
      return '<option value="' + esc(a[0]) + '"' + (cur === a[0] ? " selected" : "") + ">" + esc(a[0]) + " (" + num(a[1]) + ")</option>";
    }).join("");
  }
  function fDraft(sh) {
    var g = function(id) {
      return sh.querySelector(id);
    };
    return Object.assign(F0(), { status: +g("#fSt").value, country: +g("#fCo").value, industry: +g("#fIn").value, city: g("#fCi").value, type: g("#fTy").value, task: g("#fTa").value, tag: g("#fTg").value, email: g("#fEm").checked, phone: g("#fPh").checked, hideDnc: g("#fDn").checked, contact: g("#fCt").value });
  }
  function openFilter() {
    var R0 = facetPass(F, S.q);
    FL.R = R0;
    var sh = openSheet(sheetHead(t("filter")) + '<div class="form">' + (catOn() && syncOn() ? '<p class="muted small">' + esc(t("cat_filter_note")) + "</p>" : "") + lab(t("f_status"), '<select id="fSt">' + fOptStatus(R0, F.status) + "</select>") + lab(t("f_country"), '<input class="inp" id="fCoQ" type="search" autocomplete="off" placeholder="' + esc(t("f_country_ph")) + '"><select id="fCo" size="1">' + countryOpts(R0.co, F.country) + "</select>") + lab(t("f_industry"), '<select id="fIn">' + fOptIndustry(R0, F.industry) + "</select>") + lab(t("cat_city"), '<select id="fCi">' + fOptCity(R0, F.city) + "</select>") + lab(t("f_type"), '<select id="fTy">' + fOptType(R0, F.type) + "</select>") + lab(t("f_task"), '<select id="fTa"><option value="">' + esc(t("any")) + "</option>" + ["has", "none", "overdue", "stale"].map(function(k) {
      return '<option value="' + k + '"' + (F.task === k ? " selected" : "") + ">" + esc(t("task_" + k, { n: STALE_DAYS() })) + "</option>";
    }).join("") + "</select>") + lab(t("f_contact"), '<select id="fCt"><option value="">' + esc(t("any")) + '</option><option value="has"' + (F.contact === "has" ? " selected" : "") + ">" + esc(t("f_contact_has")) + '</option><option value="none"' + (F.contact === "none" ? " selected" : "") + ">" + esc(t("f_contact_none")) + "</option></select>") + lab(t("f_tag"), '<select id="fTg">' + fOptTag(R0, F.tag) + "</select>") + chk("fEm", t("f_email"), F.email) + chk("fPh", t("f_phone"), F.phone) + chk("fDn", t("f_hidednc"), F.hideDnc) + '<p class="fcount" id="fFound" role="status">' + esc(t("cat_f_found", { n: num(R0.n) })) + '</p><div class="row2"><button class="btn ghost" id="fReset">' + esc(t("reset")) + '</button><button class="btn primary" id="fApply">' + esc(t("apply")) + "</button></div></div>", { full: true });
    var coQ = sh.querySelector("#fCoQ"), coS = sh.querySelector("#fCo"), ft = null;
    var refill = function(skip) {
      var d = fDraft(sh), R = FL.R = facetPass(d, S.q), set = function(id, html) {
        if (id !== skip) sh.querySelector(id).innerHTML = html;
      };
      set("#fSt", fOptStatus(R, d.status));
      set("#fCo", countryOpts(R.co, d.country, cnNorm(coQ.value)));
      set("#fIn", fOptIndustry(R, d.industry));
      set("#fCi", fOptCity(R, d.city));
      set("#fTy", fOptType(R, d.type));
      set("#fTg", fOptTag(R, d.tag));
      sh.querySelector("#fFound").textContent = t("cat_f_found", { n: num(R.n) });
    };
    var sched = function(skip) {
      clearTimeout(ft);
      ft = setTimeout(function() {
        refill(skip);
      }, 60);
    };
    sh.addEventListener("change", function(ev) {
      var id = ev.target && ev.target.id;
      sched(id ? "#" + id : null);
    });
    coQ.oninput = function() {
      var q = cnNorm(coQ.value), cur = +coS.value;
      coS.innerHTML = countryOpts(FL.R.co, cur, q);
      if (q && coS.options.length > 1) {
        coS.selectedIndex = 1;
        sched("#fCo");
      }
    };
    sh.querySelector("#fReset").onclick = function() {
      F = F0();
      closeTop().then(function() {
        refreshList();
      });
    };
    sh.querySelector("#fApply").onclick = function() {
      F = fDraft(sh);
      closeTop().then(function() {
        refreshList();
      });
    };
  }
  function nfHintUpdate(n, total) {
    var el = $("#nfHint");
    if (!el) return;
    if (n || !total || !(filterActive() || S.q)) {
      el.hidden = true;
      return;
    }
    var R = facetPass(F, S.q), f = F, items = [];
    var add = function(k, label, val, cnt) {
      if (cnt > 0 && val) items.push({ k, f: label, v: val, n: cnt });
    };
    if (S.q) add("q", t("cat_nf_search"), S.q, R.relax.q);
    if (f.industry >= 0) add("industry", t("f_industry"), DICT.industry[f.industry], R.relax.industry);
    if (f.country >= 0) add("country", t("f_country"), countryName(DICT.country[f.country]), R.relax.country);
    if (f.city) add("city", t("cat_city"), cityLabel(f.city), R.relax.city);
    if (f.type) add("type", t("f_type"), t(f.type === "gov" ? "type_gov" : "type_company"), R.relax.type);
    if (f.tag) add("tag", t("f_tag"), f.tag, R.relax.tag);
    if (f.status !== -1) add("status", t("f_status"), f.status === -2 ? t("st_active") : stName(f.status), R.relax.status);
    items.sort(function(a, b) {
      return b.n - a.n;
    });
    items = items.slice(0, 4);
    var pair = f.country >= 0 && f.industry >= 0 && items.some(function(x) {
      return x.k === "industry";
    });
    el.innerHTML = "<p>" + esc(pair ? t("cat_nf_pair", { c: countryName(DICT.country[f.country]), i: DICT.industry[f.industry] }) : t("cat_nf_title")) + "</p>" + items.map(function(x) {
      return '<button class="btn ghost" type="button" data-cat="nfRelax" data-k="' + x.k + '">' + esc(t("cat_nf_drop", { f: x.f, v: x.v, n: num(x.n) })) + "</button>";
    }).join("") + (filterActive() ? '<button class="btn ghost" type="button" data-cat="nfRelax" data-k="all">' + esc(t("cat_nf_all")) + "</button>" : "") + (catOn() && syncOn() ? '<button class="btn primary" type="button" data-cat="nfCatalog">' + esc(t("cat_all_btn")) + "</button>" : "");
    el.hidden = false;
  }
  function nfRelax(k) {
    if (k === "all") {
      F = F0();
      S.q = "";
    } else if (k === "q") S.q = "";
    else if (k === "status") F.status = -1;
    else if (k === "country" || k === "industry") F[k] = -1;
    else F[k] = "";
    $("#q").value = S.q;
    refreshList();
  }
  var lab = function(l, ctl) {
    return '<label class="fld"><span>' + esc(l) + "</span>" + ctl + "</label>";
  };
  var chk = function(id, l, on) {
    return '<label class="chk"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + "><span>" + esc(l) + "</span></label>";
  };
  async function openCard(id) {
    if (window.SDOnb) SDOnb.opened();
    if (db) {
      await loadDealsCache();
      if (!UIDMAP.size) await buildUidMap();
    }
    var sh = openSheet('<div class="card-loading">' + esc(t("loading")) + "</div>", { full: true, onClose: function() {
      refreshList(true);
    } });
    sh.dataset.cid = id;
    await renderCard(sh, id);
  }
  var PENDDEL = /* @__PURE__ */ new Set(), PENDTASK = /* @__PURE__ */ new Set();
  async function renderCard(sh, id) {
    var r = await getCompany(id);
    if (!r) {
      closeTop();
      return;
    }
    await loadCfDefs();
    if (db) await loadFiles();
    var res = await Promise.all([byCid("touches", id), byCid("tasks", id)]);
    var touches = res[0].filter(function(x) {
      return !PENDDEL.has(x.id);
    }).sort(function(a, b) {
      return b.ts - a.ts;
    }), tasks = res[1].filter(function(x) {
      return !PENDTASK.has(x.id);
    }).sort(function(a, b) {
      return a.done - b.done || (a.due < b.due ? -1 : 1);
    });
    var td = today(), dnc = !!r.dnc, wa = waDigits(r.phone), cw = canWrite(r);
    var act = function(on, href, icon, label, kind) {
      return on && !dnc ? '<a class="cact" href="' + esc(href) + '" data-ext="1" data-kind="' + kind + '">' + ico(icon) + "<span>" + esc(label) + "</span></a>" : '<span class="cact off">' + ico(icon) + "<span>" + esc(label) + "</span></span>";
    };
    var site = r.website ? /^https?:\/\//i.test(r.website) ? r.website : "https://" + r.website : "";
    var contactLine = function(f, v) {
      var href = f === "email" ? "mailto:" + v : f === "phone" ? telHref(v) : /^https?:\/\//i.test(v) ? v : "https://" + v;
      return '<div class="cline">' + ico(f === "email" ? "mail" : f === "phone" ? "phone" : "globe") + (dnc ? "<span>" + esc(v) + "</span>" : '<a href="' + esc(href) + '" data-ext="1" data-kind="' + (f === "phone" ? "call" : f === "email" ? "email" : "") + '">' + esc(v) + "</a>") + "</div>";
    };
    var tpls = S.templates;
    var callBtn = r.phone ? act(r.phone, telHref(r.phone), "phone", t("c_call"), "call") : !dnc && cw ? '<button class="cact off nophone" type="button" data-act="addPhone">' + ico("phone") + "<span>" + esc(t("c_call")) + "</span></button>" : act(false, "", "phone", t("c_call"), "call");
    var taskRow = function(x) {
      return '<div class="task' + (x.done ? " done" : "") + '"><button class="cb' + (x.done ? " on" : "") + '" data-act="taskDone" data-tid="' + x.id + '" aria-label="' + esc(t("today_done")) + '">' + (x.done ? ico("check") : "") + '</button><div class="tmain"><div>' + esc(x.title) + '</div><div class="due' + (!x.done && x.due < td ? " late" : !x.done && x.due === td ? " now" : "") + '">' + fmtDate(x.due) + "</div></div>" + (x.done ? "" : snzBtn(x)) + '<button class="icbtn small" data-act="taskDel" data-tid="' + x.id + '" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button></div>";
    };
    var openT = tasks.filter(function(x) {
      return !x.done;
    }), doneT = tasks.filter(function(x) {
      return x.done;
    });
    var nextHtml = '<section class="nstep"><h3>' + esc(t("c_next")) + "</h3>" + (openT.length ? openT.map(taskRow).join("") : '<div class="nonext">' + ico("cal") + "<b>" + esc(t("c_no_next")) + "</b></div>") + (cw ? (openT.length ? "" : '<p class="muted small">' + esc(t("c_next_hint")) + "</p>") + '<div class="nchips">' + [1, 3, 7].map(function(d) {
      return '<button class="btn small ghost" type="button" data-act="nsQuick" data-d="' + d + '">' + esc(t(d === 1 ? "c_tomorrow" : d === 3 ? "c_3d" : "c_7d")) + "</button>";
    }).join("") + "</div>" : "") + (doneT.length ? '<details class="donet"><summary>' + esc(t("c_done_tasks", { n: doneT.length })) + "</summary>" + doneT.map(taskRow).join("") + "</details>" : "") + (cw ? '<details class="addtask-d"' + (sh._addOpen ? " open" : "") + "><summary>" + esc(t("c_task_other")) + '</summary><div class="addtask"><input class="inp" id="tTitle" placeholder="' + esc(t("c_task_ph")) + '"><div class="row3"><input class="inp" type="date" id="tDue" value="' + addDays(td, 1) + '"><button class="btn small ghost" data-act="tq" data-d="1">' + esc(t("c_tomorrow")) + '</button><button class="btn small ghost" data-act="tq" data-d="3">' + esc(t("c_3d")) + '</button><button class="btn small ghost" data-act="tq" data-d="7">' + esc(t("c_7d")) + '</button></div><div class="row2">' + remSelect("tRem") + (ROLE() ? assigneeSelect("tAsg", AU.uid) : "") + '</div><button class="btn primary" data-act="taskAdd">' + ico("plus") + esc(t("add")) + "</button></div></details>" : "") + "</section>";
    var html = sheetHead(r.name, (ROLE() && r.uid ? '<button class="icbtn" data-act="cxDiscussCo" aria-label="' + esc(t("cx_discuss")) + '" title="' + esc(t("cx_discuss")) + '">' + ico("chat") + "</button>" : "") + '<button class="icbtn" data-act="editCard" aria-label="' + esc(t("edit")) + '">' + ico("edit") + "</button>") + '<div class="cbody"><div class="cmeta">' + (r.type === "gov" ? '<b class="gov">' + esc(t("type_gov")) + "</b> " : '<b class="priv">' + esc(t("type_company")) + "</b> ") + esc([countryName(r.country), r.city, r.industry].filter(Boolean).join(" \xB7 ")) + "</div>" + (dnc ? '<div class="warn">' + ico("stop", "red") + esc(t("c_dnc_on")) + "</div>" : "") + (ROLE() && !cw ? '<div class="note small">' + esc(t("ro_card")) + "</div>" : "") + (ROLE() ? '<div class="ownerrow">' + lab(t("fld_owner"), ownerSelect(r)) + (r.lastTouch ? '<span class="muted small">' + esc(t("last_contact", { n: daysAgo(r.lastTouch) })) + "</span>" : "") + "</div>" : "") + '<div class="pills">' + STATUSES.map(function(s, i) {
      return '<button class="pill s' + i + (r.status === i ? " on" : "") + '" data-act="setStatus" data-st="' + i + '">' + esc(stName(i)) + "</button>";
    }).join("") + "</div>" + chChipsHtml(r, allCh(r), "c", cw && !!r.id) + '<div class="cacts">' + callBtn + act(wa, "https://wa.me/" + wa, "wa", t("c_wa"), "whatsapp") + act(wa, "https://t.me/+" + wa, "tg", t("c_tg"), "telegram") + act(r.email, "mailto:" + r.email, "mail", t("c_mail"), "email") + act(site, site, "globe", t("c_site"), "") + "</div>" + nextHtml + "<section><h3>" + esc(t("c_history")) + '</h3><div id="tl"' + (sh._tlAll ? ' class="all"' : "") + ">" + timelineHtml(touches, tasks, null) + "</div></section><section><h3>" + esc(t("c_contacts")) + "</h3>" + (r.phone ? contactLine("phone", r.phone) : "") + (r.email ? contactLine("email", r.email) : "") + (r.website ? contactLine("website", r.website) : "") + (r.person ? '<div class="kv"><span>' + esc(t("fld_person")) + "</span>" + esc(r.person) + "</div>" : "") + (r.address ? '<div class="kv"><span>' + esc(t("fld_address")) + "</span>" + esc(r.address) + "</div>" : "") + (r.lei ? '<div class="kv"><span>LEI</span>' + esc(r.lei) + "</div>" : "") + (r.extId ? '<div class="kv"><span>ID</span>' + esc(r.extId) + "</div>" : "") + (r.comment ? '<div class="kv"><span>' + esc(t("fld_comment")) + "</span>" + esc(r.comment) + "</div>" : "") + (r.alt && r.alt.length ? '<div class="sub">' + esc(t("c_alt")) + "</div>" + r.alt.map(function(a) {
      return contactLine(a.f, a.v);
    }).join("") : "") + "</section><section><h3>" + esc(t("c_tpl")) + "</h3>" + (tpls.length ? '<div class="tplrow">' + tpls.map(function(x) {
      return '<button class="btn small ghost" data-act="tplOpen" data-tpl="' + x.id + '">' + esc(x.name) + " \xB7 " + esc(String(x.lang || "").toUpperCase()) + "</button>";
    }).join("") + "</div>" : '<p class="muted">' + esc(t("tpl_none")) + "</p>") + '</section><details class="cmore"' + (sh._moreOpen ? " open" : "") + "><summary>" + esc(t("c_more")) + "</summary>" + cfSectionHtml(r, CF.defs) + (ROLE() ? contactsSectionHtml(r) : "") + filesSectionHtml(r) + "<section><h3>" + esc(t("c_tags")) + '</h3><div class="tags">' + (r.tags || []).map(function(g) {
      return '<span class="tag">' + esc(g) + '<button data-act="tagDel" data-tag="' + esc(g) + '" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button></span>";
    }).join("") + '<span class="tagadd"><input class="inp" id="tagIn" placeholder="' + esc(t("c_tag_ph")) + '"><button class="icbtn small" data-act="tagAdd" aria-label="' + esc(t("add")) + '">' + ico("plus") + "</button></span></div></section><section><h3>" + esc(t("c_consent")) + "</h3>" + lab(t("imp_basis"), '<select id="cBasis">' + BASIS.map(function(b) {
      return '<option value="' + b + '"' + (r.basis === b ? " selected" : "") + ">" + esc(t("basis_" + b)) + "</option>";
    }).join("") + "</select>") + lab(t("fld_source"), '<input class="inp" id="cSource" value="' + esc(r.source) + '">') + '<label class="chk big"><input type="checkbox" id="cDnc"' + (dnc ? " checked" : "") + "><span>" + esc(t("c_dnc")) + '</span></label><div class="muted small">' + esc(t("c_created")) + ": " + fmtTs(r.createdAt) + " \xB7 " + esc(t("c_updated")) + ": " + fmtTs(r.updatedAt) + "</div></section></details>" + (!ROLE() || isAdmin() || r.ownerId && r.ownerId === AU.uid ? '<button class="btn danger wide" data-act="cardDel">' + esc(t("c_delete")) + "</button>" : "") + '</div><div class="quick"><select id="kSel" aria-label="' + esc(t("c_touch")) + '">' + KINDS.map(function(k) {
      return '<option value="' + k + '">' + esc(t("k_" + k)) + "</option>";
    }).join("") + '</select><input class="inp" id="kText" placeholder="' + esc(t("c_touch_ph")) + '" enterkeyhint="send"><button class="btn primary" data-act="touchAdd" aria-label="' + esc(t("add")) + '">' + ico("send") + "</button></div>";
    var keepY = sh.querySelector(".cbody") ? sh.querySelector(".cbody").scrollTop : 0;
    sh.innerHTML = html;
    sh._rec = r;
    sh._tasks = tasks;
    if (keepY) sh.querySelector(".cbody").scrollTop = keepY;
    var dm = sh.querySelector("details.cmore");
    if (dm) dm.addEventListener("toggle", function() {
      sh._moreOpen = dm.open;
    });
    var da = sh.querySelector("details.addtask-d");
    if (da) da.addEventListener("toggle", function() {
      sh._addOpen = da.open;
    });
    var saveMeta = async function() {
      if (!guardWrite(r)) return renderCard(sh, id);
      r.basis = sh.querySelector("#cBasis").value;
      r.source = sh.querySelector("#cSource").value.trim();
      await putCompanies([r]);
    };
    sh.querySelector("#cBasis").onchange = saveMeta;
    sh.querySelector("#cSource").onchange = saveMeta;
    sh.querySelector("#cDnc").onchange = async function() {
      if (!guardWrite(r)) {
        this.checked = !this.checked;
        return;
      }
      r.dnc = this.checked;
      await putCompanies([r]);
      renderCard(sh, id);
    };
    var os = sh.querySelector("#cOwner");
    if (os) os.onchange = async function() {
      if (!guardWrite(r)) return renderCard(sh, id);
      r.ownerId = this.value || null;
      await putCompanies([r]);
      toast(t("c_saved"));
      renderCard(sh, id);
    };
    sh.querySelector("#tagIn").onkeydown = function(e) {
      if (e.key === "Enter") cardAction(sh, "tagAdd");
    };
    sh.querySelector("#kText").onkeydown = function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        cardAction(sh, "touchAdd");
      }
    };
    fetchHistory(r.uid).then(function(h) {
      if (h && sh._rec === r && sh.querySelector("#tl")) sh.querySelector("#tl").innerHTML = timelineHtml(touches, tasks, h);
    });
  }
  function timelineHtml(touches, tasks, hist) {
    var items = [];
    var localSt = touches.filter(function(x) {
      return x.kind === "status";
    });
    hist = (hist || []).filter(function(h) {
      return !(h.field === "status" && localSt.some(function(x) {
        return Math.abs(x.ts - Date.parse(h.created_at)) < 18e4;
      }));
    });
    touches.forEach(function(x) {
      items.push({ ts: x.ts, k: x.kind, h: '<div class="hk"><b>' + esc(t("k_" + x.kind)) + "</b> <span>" + fmtTs(x.ts) + (x.author ? " \xB7 " + esc(x.author) : "") + "</span>" + (x.kind !== "status" ? '<button class="icbtn small" data-act="touchDel" data-xid="' + x.id + '" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button>" : "") + "</div>" + (x.text ? '<div class="ht">' + esc(x.text) + "</div>" : "") });
    });
    tasks.forEach(function(x) {
      items.push({ ts: x.createdAt || 0, k: "task", h: '<div class="hk"><b>' + esc(t("tl_task")) + "</b> <span>" + fmtTs(x.createdAt) + (x.author ? " \xB7 " + esc(x.author) : "") + '</span></div><div class="ht">' + (x.done ? "<s>" : "") + esc(x.title) + (x.done ? "</s>" : "") + " \xB7 " + fmtDate(x.due) + "</div>" });
    });
    hist = [].concat.apply([], (hist || []).map(extraHist));
    (hist || []).forEach(function(x) {
      var f = x.field, lbl = x.label || (I.ru["fld_" + f] ? t("fld_" + f) : f);
      var v = function(z) {
        if (z == null || z === "") return "\u2014";
        if (f === "status" && STATUSES.indexOf(z) >= 0) return stName(STATUSES.indexOf(z));
        return String(z).slice(0, 80);
      };
      items.push({ ts: Date.parse(x.created_at) || 0, k: "hist", h: '<div class="hk"><b>' + esc(t("tl_change")) + "</b> <span>" + fmtTs(Date.parse(x.created_at)) + (x.author ? " \xB7 " + esc(x.author) : "") + '</span></div><div class="ht">' + esc(lbl) + ": " + esc(v(x.old_value)) + " \u2192 " + esc(v(x.new_value)) + "</div>" });
    });
    items.sort(function(a, b) {
      return b.ts - a.ts;
    });
    return items.length ? '<ul class="hist">' + items.map(function(x, i) {
      return '<li class="k-' + x.k + (i >= 3 ? " hmore" : "") + '">' + x.h + "</li>";
    }).join("") + "</ul>" + (items.length > 3 ? '<button class="linkbtn tlall" type="button" data-act="tlAll">' + esc(t("tl_all", { n: items.length })) + "</button>" : "") : '<p class="muted">' + esc(t("c_no_history")) + "</p>";
  }
  function localDT(d) {
    return ymd(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  async function recomputeDue(cid) {
    var ts = await byCid("tasks", cid);
    var open = ts.filter(function(x) {
      return !x.done;
    }).map(function(x) {
      return x.due;
    }).sort();
    var r = await getCompany(cid);
    var d = open[0] || "";
    if (r && r.nextDue !== d) {
      r.nextDue = d;
      await putCompanies([r], null, false);
    }
  }
  async function setStatus(r, st, extraText) {
    if (r.status === st) return;
    var tx = { cid: r.id, ts: Date.now(), kind: "status", text: t("status_changed", { a: stName(r.status), b: stName(st) }) + (extraText ? " \u2014 " + extraText : "") };
    r.status = st;
    r.lastTouch = tx.ts;
    await putCompanies([r], [tx]);
  }
  async function cardAction(sh, act, el) {
    var r = sh._rec, id = r.id;
    if (act === "tlAll") {
      sh._tlAll = true;
      var tlx = sh.querySelector("#tl");
      if (tlx) tlx.classList.add("all");
      return;
    }
    if (["tq", "tplOpen", "taskDone"].indexOf(act) < 0 && !guardWrite(r, act)) return;
    if (act === "addPhone") {
      toast(t("c_add_phone"));
      openEdit(r, function() {
        renderCard(sh, id);
      }, "phone");
      return;
    }
    if (act === "nsQuick") {
      var dd = addDays(today(), +el.dataset.d), txq = db.transaction("tasks", "readwrite");
      txq.objectStore("tasks").add({ uid: uuid(), cid: id, title: t("call_task", { n: r.name }), due: dd, done: false, createdAt: Date.now(), author: myName(), createdUid: AU.uid, assigneeId: AU.uid, remindAt: reminderTs(dd, "10:00"), pend: 1 });
      await txDone(txq);
      scheduleSync();
      scheduleReminders();
      await recomputeDue(id);
      toast(t("task_added", { d: fmtDate(dd) }));
      return renderCard(sh, id);
    }
    if (act === "taskDel" || act === "touchDel") {
      var key = act === "taskDel" ? +el.dataset.tid : +el.dataset.xid, set = act === "taskDel" ? PENDTASK : PENDDEL, undone = false;
      set.add(key);
      renderCard(sh, id);
      toast(t(act === "taskDel" ? "task_deleted" : "del_done"), t("undo"), function() {
        undone = true;
        set.delete(key);
        if (sh.isConnected) renderCard(sh, id);
      });
      setTimeout(async function() {
        if (undone) return;
        try {
          if (act === "taskDel") {
            var txd = db.transaction("tasks", "readwrite"), sd = txd.objectStore("tasks");
            var xd = await reqP(sd.get(key));
            sd.delete(key);
            queueDel("crm_tasks", xd && xd.uid);
            await txDone(txd);
            await recomputeDue(id);
          } else {
            var txh = db.transaction("touches", "readwrite"), shs = txh.objectStore("touches");
            var xh = await reqP(shs.get(key));
            shs.delete(key);
            await txDone(txh);
            if (xh && xh.pend === 0 && xh.kind !== "status") queueDel("crm_comments", xh.uid);
          }
          scheduleSync();
        } finally {
          set.delete(key);
        }
        if (sh.isConnected && sh._rec && sh._rec.id === id) renderCard(sh, id);
      }, 6e3);
      return;
    }
    if (act === "setStatus") {
      await setStatus(r, +el.dataset.st);
    } else if (act === "tq") {
      sh.querySelector("#tDue").value = addDays(today(), +el.dataset.d);
      return;
    } else if (act === "taskAdd") {
      var title = sh.querySelector("#tTitle").value.trim(), due = sh.querySelector("#tDue").value || addDays(today(), 1);
      if (!title) {
        sh.querySelector("#tTitle").focus();
        return;
      }
      var tx = db.transaction("tasks", "readwrite");
      var remSel = sh.querySelector("#tRem"), remAt = remSel && remSel.value ? reminderTs(due, remSel.value) : 0, asg = sh.querySelector("#tAsg");
      tx.objectStore("tasks").add({ uid: uuid(), cid: id, title, due, done: false, createdAt: Date.now(), author: myName(), createdUid: AU.uid, assigneeId: asg ? asg.value : AU.uid, remindAt: remAt, pend: 1 });
      await txDone(tx);
      scheduleSync();
      scheduleReminders();
      await recomputeDue(id);
    } else if (act === "taskDone" || act === "taskDel") {
      var tid = +el.dataset.tid, tx2 = db.transaction("tasks", "readwrite"), s = tx2.objectStore("tasks");
      var x = await reqP(s.get(tid));
      if (act === "taskDel") {
        s.delete(tid);
        queueDel("crm_tasks", x && x.uid);
      } else {
        x.done = !x.done;
        x.doneAt = Date.now();
        x.pend = 1;
        s.put(x);
      }
      await txDone(tx2);
      await recomputeDue(id);
      scheduleSync();
    } else if (act === "tagAdd") {
      var v = sh.querySelector("#tagIn").value.trim().replace(/,/g, " ");
      if (!v) return;
      r.tags = uniq((r.tags || []).concat([v]));
      await putCompanies([r]);
    } else if (act === "tagDel") {
      r.tags = (r.tags || []).filter(function(g) {
        return g !== el.dataset.tag;
      });
      await putCompanies([r]);
    } else if (act === "touchAdd") {
      var kind = sh.querySelector("#kSel").value, text = sh.querySelector("#kText").value.trim(), ts = Date.now();
      if (!text && kind === "note") {
        sh.querySelector("#kText").focus();
        return;
      }
      r.lastTouch = Math.max(r.lastTouch || 0, ts);
      var tl = [{ cid: id, ts, kind, text, author: myName(), authorId: AU.uid }];
      if (kind !== "note" && r.status === 0) {
        tl.push({ cid: id, ts: ts + 1, kind: "status", text: t("status_changed", { a: stName(0), b: stName(1) }) });
        r.status = 1;
        toast(t("auto_contacted"));
      }
      await putCompanies([r], tl);
    } else if (act === "touchDel") {
      var tx3 = db.transaction("touches", "readwrite"), s3 = tx3.objectStore("touches");
      var xx = await reqP(s3.get(+el.dataset.xid));
      s3.delete(+el.dataset.xid);
      await txDone(tx3);
      if (xx && xx.pend === 0 && xx.kind !== "status") queueDel("crm_comments", xx.uid);
      scheduleSync();
    } else if (act === "editCard") {
      openEdit(r, function() {
        renderCard(sh, id);
      });
      return;
    } else if (act === "tplOpen") {
      openTemplate(r, el.dataset.tpl, function() {
        renderCard(sh, id);
      });
      return;
    } else if (act === "cardDel") {
      if (!await ask(t("c_delete_q", { n: r.name }), { danger: true, ok: t("del") })) return;
      var all = await Promise.all([byCid("touches", id), byCid("tasks", id)]);
      var tx4 = db.transaction(["companies", "touches", "tasks", "idx", "meta"], "readwrite");
      tx4.objectStore("companies").delete(id);
      all[0].forEach(function(x2) {
        tx4.objectStore("touches").delete(x2.id);
      });
      all[1].forEach(function(x2) {
        tx4.objectStore("tasks").delete(x2.id);
      });
      removeEntry(id);
      DIRTYC.delete(id);
      flushIdx(tx4);
      await txDone(tx4);
      queueDel("crm_companies", r.uid);
      scheduleSync();
      toast(t("c_deleted"));
      closeTop();
      return;
    }
    renderCard(sh, id);
  }
  function openEdit(r, done, focusF) {
    var main = ["name", "phone", "city", "person"], rest = ["country", "industry", "website", "email", "inn", "lei", "address", "comment"];
    var fld = function(f) {
      if (f === "country") return lab(t("fld_country"), '<input class="inp" data-f="country" list="cnList" autocomplete="off" value="' + esc(countryName(r.country)) + '"><datalist id="cnList">' + Object.keys(CN).sort(countryCmp).map(function(c) {
        return '<option value="' + esc(countryName(c)) + '">';
      }).join("") + "</datalist>");
      var at = f === "email" ? ' type="email" inputmode="email" autocapitalize="none" spellcheck="false"' : f === "phone" ? ' type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67"' : f === "website" ? ' inputmode="url" autocapitalize="none" spellcheck="false"' : f === "inn" ? ' inputmode="numeric"' : f === "name" ? ' aria-required="true" autocomplete="organization"' : "";
      return lab(t("fld_" + f) + (f === "name" ? " *" : ""), f === "comment" ? '<textarea class="inp" rows="3" data-f="' + f + '">' + esc(r[f]) + "</textarea>" : '<input class="inp" data-f="' + f + '" value="' + esc(r[f]) + '"' + at + ">");
    };
    var openMore = rest.some(function(f) {
      return f !== "country" && r[f];
    }) || r.type === "gov" || focusF && rest.indexOf(focusF) >= 0;
    var sh = openSheet(sheetHead(r.id ? t("c_edit_title") : t("new_company")) + '<div class="form">' + main.map(fld).join("") + '<details class="efmore"' + (openMore ? " open" : "") + "><summary>" + esc(t("more_fields")) + "</summary>" + rest.map(fld).join("") + lab(t("fld_type"), '<select data-f="type"><option value="company">' + esc(t("type_company")) + '</option><option value="gov"' + (r.type === "gov" ? " selected" : "") + ">" + esc(t("type_gov")) + "</option></select>") + '</details><p class="muted small">' + esc(t("fld_required_note")) + '</p></div><div class="shfoot"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="eSave">' + esc(t("save")) + "</button></div>", { full: true, form: true, save: "#eSave" });
    var fi = focusF ? sh.querySelector("[data-f=" + focusF + "]") : null;
    if (fi) setTimeout(function() {
      try {
        fi.focus();
      } catch (e) {
      }
    }, 80);
    sh.querySelector("#eSave").onclick = async function() {
      var vals = {};
      $$("[data-f]", sh).forEach(function(el) {
        vals[el.dataset.f] = el.value.trim();
      });
      if (!vals.name) {
        fieldErr(sh.querySelector("[data-f=name]"), t("e_name_req"));
        return;
      }
      var np = !r.id && vals.phone ? normPhone(vals.phone) : "";
      if (np) {
        var dup = IDX.filter(function(e) {
          return e.s.indexOf(np) >= 0;
        })[0];
        if (dup) {
          var ch = await choose(t("dup_phone_q", { n: dup.n }), [["open", t("dup_open"), "primary"], ["save", t("dup_save_anyway"), "ghost"]]);
          if (ch === "open") {
            sh.parentNode._dirty = false;
            await closeTop();
            return openCard(dup.id);
          }
          if (ch !== "save") return;
        } else if (catOn() && syncOn()) {
          var rd = navigator.onLine === false ? null : await catRemoteFind(vals, true);
          if (rd) {
            var ch2 = await choose(t("cat_dup_remote_q", { n: rd.name, c: rd.country ? countryName(rd.country) : "\u2014" }), [["open", t("cat_dup_open"), "primary"], ["save", t("dup_save_anyway"), "ghost"]]);
            if (ch2 === "open") {
              sh.parentNode._dirty = false;
              await closeTop();
              return catOpen(rd);
            }
            if (ch2 !== "save") return;
          } else if (navigator.onLine === false) toast(t("cat_checked_local"));
        }
      }
      for (var k in vals) r[k] = vals[k];
      r.lei = (r.lei || "").toUpperCase();
      r.country = countryCode(r.country) || r.country;
      sh.parentNode._dirty = false;
      await putCompanies([r]);
      toast(t("c_saved"));
      await closeTop();
      done();
    };
  }
  var DEFAULT_TPLS = [
    { id: "ru1", lang: "ru", name: "\u0417\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u043E", subject: "SavdEx \u2014 B2B-\u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0430 \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D\u0430", body: "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, {company}!\n\n\u041C\u0435\u043D\u044F \u0437\u043E\u0432\u0443\u0442 {me}, \u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u044E SavdEx (savdex.uz) \u2014 B2B-\u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0443 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0439 \u0438\u0437 \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D\u0430, \u0433\u0434\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0438 \u0438 \u0437\u0430\u043A\u0443\u043F\u0449\u0438\u043A\u0438 \u043D\u0430\u0445\u043E\u0434\u044F\u0442 \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E, \u0431\u0435\u0437 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438.\n\n\u0418\u043D\u0442\u0435\u0440\u0435\u0441\u0435\u043D \u043B\u0438 \u0432\u0430\u043C \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D \u043A\u0430\u043A \u0440\u044B\u043D\u043E\u043A \u0441\u0431\u044B\u0442\u0430 \u0438\u043B\u0438 \u0437\u0430\u043A\u0443\u043F\u043E\u043A? \u0415\u0441\u043B\u0438 \u0442\u0435\u043C\u0430 \u043D\u0435\u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430, \u043F\u0440\u043E\u0441\u0442\u043E \u043E\u0442\u0432\u0435\u0442\u044C\u0442\u0435 \xAB\u043D\u0435\u0442\xBB \u2014 \u044F \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043F\u043E\u0431\u0435\u0441\u043F\u043E\u043A\u043E\u044E.\n\n{me}, SavdEx\n{myphone}" },
    { id: "ru2", lang: "ru", name: "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435", subject: "SavdEx \u2014 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0432\u043E\u043F\u0440\u043E\u0441", body: "\u0414\u043E\u0431\u0440\u044B\u0439 \u0434\u0435\u043D\u044C, {company}!\n\n\u041A\u043E\u0440\u043E\u0442\u043A\u043E \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E\u0441\u044C \u043A \u043C\u043E\u0435\u043C\u0443 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044E \u043E SavdEx. \u0423\u0434\u043E\u0431\u043D\u043E \u043B\u0438 \u0441\u043E\u0437\u0432\u043E\u043D\u0438\u0442\u044C\u0441\u044F \u043D\u0430 10 \u043C\u0438\u043D\u0443\u0442 \u043D\u0430 \u044D\u0442\u043E\u0439 \u043D\u0435\u0434\u0435\u043B\u0435? \u0415\u0441\u043B\u0438 \u043D\u0435\u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u043E \u2014 \u043D\u0430\u043F\u0438\u0448\u0438\u0442\u0435, \u0438 \u044F \u0437\u0430\u043A\u0440\u043E\u044E \u0432\u043E\u043F\u0440\u043E\u0441.\n\n{me}, SavdEx\n{myphone}" },
    { id: "uz1", lang: "uz", name: "Tanishuv", subject: "SavdEx \u2014 O\u2018zbekistonning B2B maydonchasi", body: "Assalomu alaykum, {company}!\n\nMening ismim {me}, men SavdEx (savdex.uz) vakiliman \u2014 bu O\u2018zbekistondagi B2B e\u2019lonlar maydonchasi bo\u2018lib, yetkazib beruvchilar va xaridorlar bir-birini to\u2018g\u2018ridan-to\u2018g\u2018ri, komissiyasiz topadi.\n\nO\u2018zbekiston bozori sizni sotish yoki xarid qilish uchun qiziqtiradimi? Agar dolzarb bo\u2018lmasa, \xAByo\u2018q\xBB deb javob bering \u2014 boshqa bezovta qilmayman.\n\n{me}, SavdEx\n{myphone}" },
    { id: "uz2", lang: "uz", name: "Eslatma", subject: "SavdEx \u2014 qisqa savol", body: "Assalomu alaykum, {company}!\n\nSavdEx haqidagi xabarimga qisqacha qaytmoqchiman. Shu hafta 10 daqiqa telefonda gaplashish qulaymi? Dolzarb bo\u2018lmasa, yozib qo\u2018ying \u2014 masalani yopaman.\n\n{me}, SavdEx\n{myphone}" },
    { id: "en1", lang: "en", name: "Introduction", subject: "SavdEx \u2014 B2B platform in Uzbekistan", body: "Hello {company} team,\n\nMy name is {me}. I represent SavdEx (savdex.uz), a B2B listings platform from Uzbekistan where suppliers and buyers connect directly, with no commission.\n\nWould Uzbekistan be of interest to you as a sales or sourcing market? If it is not relevant, just reply \u201Cno\u201D and I will not contact you again.\n\n{me}, SavdEx\n{myphone}" },
    { id: "en2", lang: "en", name: "Follow-up", subject: "SavdEx \u2014 quick question", body: "Hello {company} team,\n\nA short follow-up on my message about SavdEx. Would a 10-minute call this week work for you? If not relevant, let me know and I will close the topic.\n\n{me}, SavdEx\n{myphone}" }
  ];
  function fillTpl(s, r) {
    var v = { company: r.name, country: countryName(r.country), city: r.city, person: r.person, me: S.settings.me || "[\u0438\u043C\u044F]", myphone: S.settings.phone || "" };
    return String(s || "").replace(/\{(company|country|city|person|me|myphone)\}/g, function(m, k) {
      return v[k] || "";
    });
  }
  function bumpDaily() {
    var d = today();
    if (S.daily.d !== d) S.daily = { d, n: 0 };
    S.daily.n++;
    metaSet("daily", S.daily);
    return S.daily.n;
  }
  function openTemplate(r, tid, done) {
    var tp = S.templates.filter(function(x) {
      return x.id === tid;
    })[0];
    if (!tp) return;
    var subj = fillTpl(tp.subject, r), body = fillTpl(tp.body, r), wa = waDigits(r.phone), dnc = !!r.dnc;
    var dn = S.daily.d === today() ? S.daily.n : 0;
    var sh = openSheet(sheetHead(tp.name + " \xB7 " + String(tp.lang || "").toUpperCase()) + '<div class="form">' + (dnc ? '<div class="warn">' + ico("stop", "red") + esc(t("c_dnc_on")) + "</div>" : '<p class="note">' + esc(t("tpl_hint")) + "</p>") + (dn >= 20 ? '<div class="warn">' + esc(t("tpl_daily", { n: dn })) + "</div>" : "") + lab(t("tpl_subject"), '<input class="inp" id="pSubj" value="' + esc(subj) + '">') + lab(t("tpl_body"), '<textarea class="inp" id="pBody" rows="10">' + esc(body) + "</textarea>") + '<div class="col"><button class="btn primary" data-k="email"' + (r.email && !dnc ? "" : " disabled") + ">" + ico("mail") + esc(t("tpl_open_mail")) + '</button><button class="btn primary" data-k="whatsapp"' + (wa && !dnc ? "" : " disabled") + ">" + ico("wa") + esc(t("tpl_open_wa")) + '</button><button class="btn ghost" data-k="telegram"' + (wa && !dnc ? "" : " disabled") + ">" + ico("tg") + esc(t("tpl_open_tg")) + '</button><button class="btn ghost" data-k="copy"' + (dnc ? " disabled" : "") + ">" + esc(t("tpl_copy")) + "</button></div></div>", { full: true });
    $$("[data-k]", sh).forEach(function(b) {
      b.onclick = async function() {
        var k = b.dataset.k, s1 = sh.querySelector("#pSubj").value, b1 = sh.querySelector("#pBody").value;
        if (k === "copy") {
          await copyText(b1);
          toast(t("tpl_copied"));
          return;
        }
        var url = k === "email" ? "mailto:" + r.email + "?subject=" + encodeURIComponent(s1) + "&body=" + encodeURIComponent(b1) : k === "whatsapp" ? "https://wa.me/" + wa + "?text=" + encodeURIComponent(b1) : "https://t.me/+" + wa;
        if (k === "telegram") {
          await copyText(b1);
          toast(t("tpl_copied"));
        }
        bumpDaily();
        r.lastTouch = Date.now();
        var tl = [{ cid: r.id, ts: Date.now(), kind: k, text: t("tpl_log", { n: tp.name, c: t("k_" + k) }) }];
        if (r.status === 0) {
          r.status = 1;
          tl.push({ cid: r.id, ts: Date.now() + 1, kind: "status", text: t("status_changed", { a: stName(0), b: stName(1) }) });
        }
        await putCompanies([r], tl);
        openExt(url);
        await closeTop();
        done();
      };
    });
  }
  function copyText(s) {
    try {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s).catch(fallback);
    } catch (e) {
    }
    fallback();
    return Promise.resolve();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = s;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {
      }
      ta.remove();
    }
  }
  function openExt(url) {
    window.__lastExt = url;
    if (NATIVE) {
      window.location.href = url;
      return;
    }
    if (/^https?:/i.test(url)) window.open(url, "_blank", "noopener");
    else window.location.href = url;
  }
  async function openTasksUntil(d) {
    var all = await reqP(db.transaction("tasks").objectStore("tasks").index("due").getAll(IDBKeyRange.upperBound(d)));
    return all.filter(function(x) {
      return !x.done;
    });
  }
  async function updateTodayBadge() {
    if (!db) return;
    var n = (await openTasksUntil(today())).length;
    var b = $("#todayBadge");
    b.textContent = n > 99 ? "99+" : n;
    b.hidden = !n;
  }
  async function renderToday() {
    var td = today(), list = await openTasksUntil(addDays(td, 7));
    if (AU.uid && !isAdmin()) list = list.filter(function(x) {
      return !x.assigneeId || x.assigneeId === AU.uid;
    });
    var grp = { overdue: [], today: [], week: [] };
    list.forEach(function(x) {
      (x.due < td ? grp.overdue : x.due === td ? grp.today : grp.week).push(x);
    });
    var nostep = IDX.filter(function(e) {
      return e.st >= 1 && e.st <= 4 && !e.d;
    }).length;
    var staleMs = Date.now() - STALE_DAYS() * 864e5, stale = IDX.filter(function(e) {
      return e.st >= 1 && e.st <= 4 && (!e.lc || e.lc < staleMs) && (!AU.uid || isAdmin() || !e.ow || e.ow === AU.uid);
    }).length;
    await loadDealsCache();
    var openAll = await openTasksAll(), hasTask = new Set(openAll.map(function(x) {
      return x.dealId;
    }).filter(Boolean));
    var noTaskDeals = DL.list.filter(function(d) {
      var s = stageById(d.stage_id);
      return s && s.kind === "open" && !hasTask.has(d.id) && (isAdmin() || !d.owner_id || d.owner_id === AU.uid);
    });
    var item = function(x) {
      var e = BYID.get(x.cid), dl = x.dealId ? DL.list.filter(function(d) {
        return d.id === x.dealId;
      })[0] : null;
      var where = x.cid ? ' data-act="open" data-id="' + x.cid + '"' : dl ? ' data-act="dealOpen" data-did="' + dl.id + '"' : "";
      return '<div class="task"><button class="cb" data-act="tDone" data-tid="' + x.id + '"></button><div class="tmain"' + where + "><div>" + esc(x.title) + '</div><div class="rsub">' + esc([dl ? dl.title : "", e ? e.n : ""].filter(Boolean).join(" \xB7 ") || "\u2014") + " \xB7 " + fmtDate(x.due) + (x.remindAt ? " \xB7 \u23F0 " + fmtTs(x.remindAt).slice(11) : "") + (isAdmin() && x.assigneeId && x.assigneeId !== AU.uid ? " \xB7 " + esc(memberName(x.assigneeId)) : "") + "</div></div>" + snzBtn(x) + "</div>";
    };
    var sec = function(k, arr) {
      return arr.length ? '<h3 class="' + (k === "overdue" ? "red" : "") + '">' + esc(t("today_" + k)) + " \xB7 " + arr.length + "</h3>" + arr.map(item).join("") : "";
    };
    var gh = await goalHtml(), ch = await calendarHtml(), mo = await morningHtml();
    var calOpen = S.calOpen != null ? S.calOpen : window.innerWidth >= 900;
    var newN = IDX.filter(function(e) {
      return e.st === 0 && !(e.f & F_DNC) && (!AU.uid || isAdmin() || !e.ow || e.ow === AU.uid);
    }).length;
    var urgent = sec("overdue", grp.overdue) + sec("today", grp.today);
    var ckH = "", emH = "";
    if (window.SDOnb) {
      ckH = await SDOnb.checklist(grp.overdue.length);
      if (!urgent) emH = await SDOnb.todayEmpty(newN);
    }
    $("#v-today").innerHTML = '<div class="pad">' + ckH + mo + (urgent || emH || '<div class="emptyday"><b>' + esc(t("today_all_done")) + "</b>" + (newN ? "<p>" + esc(t("today_call_new")) + '</p><button class="btn primary" data-act="showNew">' + esc(t("today_show_new", { n: num(newN) })) + "</button>" : "") + "</div>") + gh + '<div class="row2"><button class="btn primary" data-act="quickTask">' + ico("plus") + esc(t("qa_task")) + "</button>" + (canWriteAny() ? '<button class="btn ghost" data-act="dealNew">' + ico("plus") + esc(t("d_new")) + "</button>" : "") + "</div>" + sec("week", grp.week) + '<details class="weekcal"' + (calOpen ? " open" : "") + "><summary>" + esc(t("today_week_cal")) + "</summary>" + ch + "</details>" + (noTaskDeals.length ? '<h3 class="red">' + esc(t("today_deals_notask")) + " \xB7 " + noTaskDeals.length + "</h3>" + noTaskDeals.slice(0, 20).map(function(d) {
      return '<div class="kv link" data-act="dealOpen" data-did="' + d.id + '"><span>' + esc(money(d.amount, d.currency)) + "</span>" + esc(d.title) + "</div>";
    }).join("") : "") + (nostep ? '<div class="note">' + esc(t("today_nostep", { n: num(nostep) })) + ' <button class="btn small ghost" data-act="showNoStep">' + esc(t("today_show")) + "</button></div>" : "") + (stale ? '<div class="note">' + esc(t("today_stale", { n: num(stale), d: STALE_DAYS() })) + ' <button class="btn small ghost" data-act="showStale">' + esc(t("today_show")) + "</button></div>" : "") + "</div>";
    bindCalendar($("#v-today"));
    var wc = $("#v-today details.weekcal");
    if (wc) wc.addEventListener("toggle", function() {
      S.calOpen = wc.open;
    });
    updateTodayBadge();
  }
  function renderCompanyStats(el, compact) {
    el = el || $("#v-stats");
    var total = IDX.length;
    if (!total) {
      el.innerHTML = '<div class="pad"><p class="muted">' + esc(t("stats_empty")) + "</p></div>";
      return;
    }
    var st = [0, 0, 0, 0, 0, 0, 0], byC = /* @__PURE__ */ new Map(), gov = [0, 0, 0, 0, 0, 0, 0], prv = [0, 0, 0, 0, 0, 0, 0];
    IDX.forEach(function(e) {
      st[e.st]++;
      (e.f & F_GOV ? gov : prv)[e.st]++;
      var a = byC.get(e.co);
      if (!a) {
        a = [0, 0, 0, 0, 0, 0, 0];
        byC.set(e.co, a);
      }
      a[e.st]++;
    });
    var max = Math.max.apply(null, st), sum = function(a) {
      return a.reduce(function(x, y) {
        return x + y;
      }, 0);
    };
    var closed = st[5] + st[6];
    var bars = STATUSES.map(function(s, i) {
      return '<div class="bar"><span class="bl">' + esc(stName(i)) + '</span><span class="bt"><i class="s' + i + '" style="width:' + Math.max(1, st[i] / max * 100) + '%"></i></span><span class="bn">' + num(st[i]) + " <small>" + (st[i] / total * 100).toFixed(1) + "%</small></span></div>";
    }).join("");
    var rows = [];
    byC.forEach(function(a, c) {
      rows.push([c, a]);
    });
    rows.sort(function(x, y) {
      return sum(y[1]) - sum(x[1]);
    });
    var inwork = function(a) {
      return a[1] + a[2] + a[3] + a[4];
    };
    var tbl = '<table class="tbl"><thead><tr><th>' + esc(t("stats_country")) + "</th><th>" + esc(t("all")) + "</th><th>" + esc(t("stats_inwork")) + "</th><th>" + esc(t("st_won")) + "</th><th>" + esc(t("st_lost")) + "</th></tr></thead><tbody>" + rows.slice(0, 15).map(function(r) {
      return "<tr><td>" + esc(countryName(DICT.country[r[0]]) || "\u2014") + "</td><td>" + num(sum(r[1])) + "</td><td>" + num(inwork(r[1])) + "</td><td>" + num(r[1][5]) + "</td><td>" + num(r[1][6]) + "</td></tr>";
    }).join("") + "</tbody></table>";
    var typeRow = function(l, a) {
      return "<tr><td>" + esc(l) + "</td><td>" + num(sum(a)) + "</td><td>" + num(inwork(a)) + "</td><td>" + num(a[5]) + "</td><td>" + num(a[6]) + "</td></tr>";
    };
    el.innerHTML = '<div class="pad"><h2>' + esc(t("stats_title")) + "</h2>" + (catOn() && syncOn() ? '<p class="muted small">' + esc(t("cat_stats_note")) + "</p>" : "") + '<div class="kpis"><div><b>' + num(total) + "</b><span>" + esc(t("stats_total")) + "</span></div><div><b>" + num(inwork(st)) + "</b><span>" + esc(t("stats_inwork")) + "</span></div><div><b>" + (closed ? (st[5] / closed * 100).toFixed(0) + "%" : "\u2014") + "</b><span>" + esc(t("stats_conv")) + '</span></div></div><div class="bars">' + bars + "</div><h3>" + esc(t("stats_by_country")) + "</h3>" + tbl + "<h3>" + esc(t("stats_by_type")) + '</h3><table class="tbl"><thead><tr><th></th><th>' + esc(t("all")) + "</th><th>" + esc(t("stats_inwork")) + "</th><th>" + esc(t("st_won")) + "</th><th>" + esc(t("st_lost")) + "</th></tr></thead><tbody>" + typeRow(t("type_company"), prv) + typeRow(t("type_gov"), gov) + "</tbody></table></div>";
  }
  async function renderMore() {
    var est = "";
    try {
      if (navigator.storage && navigator.storage.estimate) {
        var e = await navigator.storage.estimate();
        est = t("storage", { n: fmtBytes(e.usage || 0) });
      }
    } catch (x) {
    }
    var adm = isAdmin() || !ROLE();
    $("#v-more").innerHTML = '<div class="pad">' + (isAdmin() ? "<h3>" + esc(t("more_team")) + '</h3><div class="col"><button class="btn primary" data-act="staff">' + ico("user") + esc(t("staff")) + "</button></div>" : "") + (window.SDOnb ? SDOnb.moreRow() : "") + (window.SDTeam ? SDTeam.moreRow() : "") + "<h3>" + esc(t("more_base")) + '</h3><p class="muted">' + esc(t("more_count", { n: num(IDX.length) })) + (est ? " \xB7 " + esc(est) : "") + '</p><div class="col">' + (ROLE() ? '<button class="btn ghost" data-cat="countries">' + ico("globe") + esc(t("cat_more_btn")) + '</button><button class="btn ghost" data-cat="search">' + ico("search") + esc(t("cat_all_btn")) + "</button>" : "") + '<button class="btn primary" data-act="import">' + ico("upload") + esc(t("import_file")) + '</button><button class="btn ghost" data-act="tplDownload">' + ico("download") + esc(t("tpl_dl")) + '</button><button class="btn ghost" data-act="expAll">' + ico("download") + esc(t("exp_all")) + '</button><button class="btn ghost" data-act="expFilter">' + ico("download") + esc(t("exp_filter", { n: num(RESULT.length) })) + "</button>" + (adm ? '<button class="btn ghost" data-act="dupes">' + esc(t("dup_title")) + "</button>" : "") + (ROLE() ? '<button class="btn ghost" data-act="dealsXlsx">' + ico("download") + esc(t("dx_title")) + "</button>" : "") + "</div>" + (ROLE() ? "<h3>" + esc(t("more_sales")) + '</h3><div class="col"><button class="btn ghost" data-act="products">' + esc(t("pr_title")) + "</button>" + (isAdmin() ? '<button class="btn ghost" data-act="seller">' + esc(t("os_title")) + '</button><button class="btn ghost" data-act="leads">' + esc(t("ld_title")) + '</button><button class="btn ghost" data-act="scriptsEdit">' + esc(t("sc_edit")) + '</button><button class="btn ghost" data-act="publish">' + esc(t("upd_pub")) + "</button>" : "") + '<button class="btn ghost" data-act="telegram">' + esc(t("tg_title")) + '</button><button class="btn ghost" data-act="checkUpd">' + esc(t("upd_check")) + "</button></div>" : "") + "<h3>" + esc(t("more_tpls")) + '</h3><div class="col">' + S.templates.map(function(x) {
      return '<button class="btn ghost left" data-act="tplEdit" data-tpl="' + x.id + '"><b class="lg">' + esc(String(x.lang || "").toUpperCase()) + "</b>" + esc(x.name) + "</button>";
    }).join("") + '<button class="btn ghost" data-act="tplNew">' + ico("plus") + esc(t("tpl_new")) + "</button></div><h3>" + esc(t("more_settings")) + '</h3><div class="form">' + lab(t("set_lang"), langSelect("sLang")) + lab(t("set_me"), '<input class="inp" id="sMe" value="' + esc(S.settings.me) + '">') + lab(t("set_phone"), '<input class="inp" id="sPh" type="tel" inputmode="tel" value="' + esc(S.settings.phone) + '">') + lab(t("set_stale"), '<input class="inp" id="sSt" type="number" inputmode="numeric" min="1" max="90" value="' + STALE_DAYS() + '">') + "</div>" + themeHtml() + "<h3>" + esc(t("sync_title")) + '</h3><p class="muted">' + esc(t("sync_user", { n: (myName() || "\u2014") + (ROLE() ? " \xB7 " + t("role_" + ROLE()) : "") })) + (SY.last ? " \xB7 " + esc(t("sync_last", { n: fmtTs(SY.last) })) : "") + (RT.joined ? " \xB7 " + esc(t("sync_live")) : "") + (SY.err ? '<br><span class="red small">' + esc(SY.err) + "</span>" : "") + '</p><div class="col"><button class="btn ghost" data-act="syncNow">' + ico("sync") + esc(t("sync_now")) + '</button><button class="btn ghost" data-act="profile">' + ico("user") + esc(t("profile")) + '</button></div><details class="rare"><summary>' + esc(t("more_rare")) + '</summary><div class="col">' + (adm ? '<button class="btn ghost" data-act="fieldsAdmin">' + esc(t("cf_admin")) + "</button>" : "") + '<button class="btn ghost" data-act="demo">' + esc(t("load_demo")) + "</button>" + (canWriteAny() || !ROLE() ? '<button class="btn ghost" data-act="presetEdu">' + ico("upload") + esc(t("preset_edu")) + "</button>" : "") + '<button class="btn ghost" data-act="backup">' + ico("download") + esc(t("backup")) + '</button><button class="btn ghost" data-act="restore">' + ico("upload") + esc(t("restore")) + '</button><button class="btn ghost" data-act="undoImport">' + esc(t("imp_undo")) + "</button>" + (isAdmin() ? '<button class="btn ghost" data-act="actionLog">' + esc(t("log_title")) + "</button>" : "") + '<button class="btn danger" data-act="wipe">' + esc(t("wipe")) + "</button></div></details><h3>" + esc(t("more_antispam")) + '</h3><p class="note">' + esc(t("antispam_text")) + "</p><h3>" + esc(t("more_about")) + '</h3><div class="about"><img src="assets/savdex-logo-160.png" alt="SavdEx" width="64" height="64"><p>' + esc(t("about_text", { v: VERSION })) + '<br><b class="ver">Sotuvdesc ' + VERSION + "</b></p></div></div>";
    var saveSet = function() {
      S.settings.me = $("#sMe").value.trim();
      S.settings.phone = $("#sPh").value.trim();
      S.settings.staleDays = Math.max(1, Math.min(90, +$("#sSt").value || 7));
      metaSet("settings", S.settings);
    };
    $("#sMe").onchange = saveSet;
    $("#sPh").onchange = saveSet;
    $("#sSt").onchange = saveSet;
    $("#sLang").onchange = function() {
      setLang(this.value);
    };
    bindTheme();
  }
  function langSelect(id) {
    return '<select id="' + id + '">' + [["ru", "\u0420\u0443\u0441\u0441\u043A\u0438\u0439"], ["uz", "O\u2018zbekcha"], ["uzc", "\u040E\u0437\u0431\u0435\u043A\u0447\u0430 (\u043A\u0438\u0440\u0438\u043B\u043B)"], ["en", "English"]].map(function(l) {
      return '<option value="' + l[0] + '"' + (LANG === l[0] ? " selected" : "") + ">" + l[1] + "</option>";
    }).join("") + "</select>";
  }
  function openTplEdit(id) {
    var tp = S.templates.filter(function(x) {
      return x.id === id;
    })[0] || { id: "u" + Date.now(), lang: LANG, name: "", subject: "", body: "" };
    var isNew = S.templates.indexOf(tp) < 0;
    var sh = openSheet(sheetHead(isNew ? t("tpl_new") : tp.name) + '<div class="form">' + lab(t("tpl_name"), '<input class="inp" id="eN" value="' + esc(tp.name) + '">') + lab(t("tpl_lang"), '<select id="eL">' + ["ru", "uz", "en"].map(function(l) {
      return "<option" + (tp.lang === l ? " selected" : "") + ">" + l + "</option>";
    }).join("") + "</select>") + lab(t("tpl_subject"), '<input class="inp" id="eS" value="' + esc(tp.subject) + '">') + lab(t("tpl_body"), '<textarea class="inp" id="eB" rows="10">' + esc(tp.body) + "</textarea>") + '<p class="muted small">' + esc(t("tpl_vars")) + '</p><div class="row2">' + (isNew ? '<button class="btn ghost" data-act="close">' + esc(t("cancel")) + "</button>" : '<button class="btn danger" id="eDel">' + esc(t("del")) + "</button>") + '<button class="btn primary" id="eSave">' + esc(t("save")) + "</button></div></div>", { full: true });
    sh.querySelector("#eSave").onclick = async function() {
      tp.name = sh.querySelector("#eN").value.trim() || "Template";
      tp.lang = sh.querySelector("#eL").value;
      tp.subject = sh.querySelector("#eS").value;
      tp.body = sh.querySelector("#eB").value;
      if (isNew) S.templates.push(tp);
      await metaSet("templates", S.templates);
      await closeTop();
      renderMore();
    };
    var d = sh.querySelector("#eDel");
    if (d) d.onclick = async function() {
      if (!await ask(t("tpl_del_q", { n: tp.name }), { danger: true, ok: t("del") })) return;
      S.templates = S.templates.filter(function(x) {
        return x !== tp;
      });
      await metaSet("templates", S.templates);
      await closeTop();
      renderMore();
    };
  }
  function csvParser(onRow) {
    var delim = null, field = "", row = [], inQ = false, afterQ = false, started = false, first = true;
    function detect(text) {
      var line = text.split(/\r?\n/)[0] || "", c = { ",": 0, ";": 0, "	": 0 }, q = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') q = !q;
        else if (!q && c[ch] != null) c[ch]++;
      }
      delim = c["	"] > c[","] && c["	"] >= c[";"] ? "	" : c[";"] > c[","] ? ";" : ",";
    }
    function endRow() {
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") onRow(row);
      row = [];
      started = false;
      afterQ = false;
    }
    return {
      push: function(text) {
        if (first) {
          if (text.charCodeAt(0) === 65279) text = text.slice(1);
          while (text.charAt(0) === "#") {
            var nl = text.indexOf("\n");
            if (nl < 0) {
              text = "";
              break;
            }
            text = text.slice(nl + 1);
          }
          first = false;
        }
        if (delim === null) detect(text);
        var i = 0, n = text.length;
        while (i < n) {
          var ch = text[i];
          if (inQ) {
            if (ch === '"') {
              if (text[i + 1] === '"') {
                field += '"';
                i += 2;
                continue;
              }
              if (i + 1 === n) {
                this._pq = true;
                i++;
                continue;
              }
              inQ = false;
              afterQ = true;
              i++;
              continue;
            }
            var j = text.indexOf('"', i);
            if (j < 0) j = n;
            field += text.slice(i, j);
            i = j;
            continue;
          }
          if (this._pq) {
            this._pq = false;
            if (ch === '"') {
              field += '"';
              inQ = true;
              i++;
              continue;
            }
            inQ = false;
            afterQ = true;
          }
          if (ch === '"' && !started && field === "") {
            inQ = true;
            started = true;
            i++;
            continue;
          }
          if (ch === delim) {
            row.push(field);
            field = "";
            started = false;
            afterQ = false;
            i++;
            continue;
          }
          if (ch === "\n") {
            endRow();
            i++;
            continue;
          }
          if (ch === "\r") {
            i++;
            continue;
          }
          if (!afterQ) field += ch;
          started = true;
          i++;
        }
      },
      end: function() {
        if (this._pq) {
          this._pq = false;
          inQ = false;
        }
        if (field !== "" || row.length) endRow();
      },
      delim: function() {
        return delim;
      }
    };
  }
  function csvCell(v) {
    var s = v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v);
    if (/^[=@\t\r]/.test(s) || /^[+-]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = "'" + s;
    return /[",;\r\n]/.test(s) || /^\s|\s$/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function readSlice(file, a, b) {
    return new Promise(function(res, rej) {
      var fr = new FileReader();
      fr.onload = function() {
        res(fr.result);
      };
      fr.onerror = function() {
        rej(fr.error);
      };
      fr.readAsArrayBuffer(file.slice(a, b));
    });
  }
  async function readText(file) {
    var buf = await readSlice(file, 0, file.size);
    return new TextDecoder("utf-8").decode(buf);
  }
  var SYN = {
    name: ["name", "orglabel", "company", "companyname", "organization", "organisation", "orgname", "title", "legalname", "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", "\u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", "\u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F", "\u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F", "nomi", "kompaniya", "tashkilot", "firma", "nom"],
    country: ["country", "countrylabel", "countryname", "\u0441\u0442\u0440\u0430\u043D\u0430", "mamlakat", "davlat", "land", "pays"],
    city: ["city", "citylabel", "town", "locality", "\u0433\u043E\u0440\u043E\u0434", "shahar", "\u043D\u0430\u0441\u0435\u043B\u0435\u043D\u043D\u044B\u0439\u043F\u0443\u043D\u043A\u0442", "gorod"],
    industry: ["industry", "industrylabel", "sector", "branch", "category", "activity", "\u043E\u0442\u0440\u0430\u0441\u043B\u044C", "\u0441\u0444\u0435\u0440\u0430", "\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", "soha", "tarmoq", "yonalish", "okved"],
    type: ["type", "\u0442\u0438\u043F", "turi", "kind", "orgtype", "sectortype"],
    website: ["website", "site", "url", "web", "homepage", "www", "officialwebsite", "\u0441\u0430\u0439\u0442", "sayt", "\u0432\u0435\u0431\u0441\u0430\u0439\u0442"],
    email: ["email", "mail", "emails", "emailaddress", "\u043F\u043E\u0447\u0442\u0430", "\u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F\u043F\u043E\u0447\u0442\u0430", "\u0435\u043C\u0435\u0439\u043B", "pochta", "elpochta"],
    phone: ["phone", "phones", "phonefull", "tel", "telephone", "phonenumber", "mobile", "\u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u0442\u0435\u043B\u0435\u0444\u043E\u043D\u044B", "\u0442\u0435\u043B", "telefon", "raqam"],
    lei: ["lei", "leicode"],
    inn: ["inn", "stir", "tin", "\u0438\u043D\u043D", "\u0441\u0442\u0438\u0440", "\u0438\u043D\u043D\u0441\u0442\u0438\u0440", "stirinn", "innstir", "soliqraqami", "taxid", "vatid"],
    extId: ["org", "wikidata", "qid", "item", "externalid", "extid"],
    person: ["contact", "contactperson", "person", "\u043A\u043E\u043D\u0442\u0430\u043A\u0442", "\u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0435\u043B\u0438\u0446\u043E", "\u0444\u0438\u043E", "masul", "masulshaxs"],
    address: ["address", "\u0430\u0434\u0440\u0435\u0441", "manzil", "addr"],
    comment: ["comment", "notes", "note", "description", "\u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439", "\u043F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435", "\u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", "izoh"],
    tags: ["tags", "tag", "\u0442\u0435\u0433\u0438", "\u043C\u0435\u0442\u043A\u0438", "teglar"],
    source: ["source", "\u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A", "manba"],
    status: ["status", "\u0441\u0442\u0430\u0442\u0443\u0441", "holat", "stage", "\u044D\u0442\u0430\u043F"],
    ch_whatsapp: ["whatsapp", "\u0432\u0430\u0442\u0441\u0430\u043F", "\u0432\u043E\u0442\u0441\u0430\u043F", "\u0432\u0430\u0446\u0430\u043F", "wa", "whatsappnumber"],
    ch_telegram: ["telegram", "\u0442\u0435\u043B\u0435\u0433\u0440\u0430\u043C", "\u0442\u0435\u043B\u0435\u0433\u0440\u0430\u043C\u043C", "tg", "telegramm"],
    ch_instagram: ["instagram", "\u0438\u043D\u0441\u0442\u0430\u0433\u0440\u0430\u043C", "insta", "ig", "\u0438\u043D\u0441\u0442\u0430"],
    ch_wechat: ["wechat", "\u0432\u0438\u0447\u0430\u0442", "weixin", "\u0432\u044D\u0439\u0447\u0430\u0442", "wechatid"],
    ch_facebook: ["facebook", "\u0444\u0435\u0439\u0441\u0431\u0443\u043A", "fb"],
    ch_viber: ["viber", "\u0432\u0430\u0439\u0431\u0435\u0440"],
    ch_linkedin: ["linkedin", "\u043B\u0438\u043D\u043A\u0435\u0434\u0438\u043D"],
    ch_tiktok: ["tiktok", "\u0442\u0438\u043A\u0442\u043E\u043A"],
    ch_youtube: ["youtube", "\u044E\u0442\u0443\u0431", "youtubechannel"],
    ch_vk: ["vk", "\u0432\u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0435", "vkontakte"]
  };
  var nk = function(h) {
    return String(h || "").toLowerCase().replace(/[^a-zа-яё0-9ўқғҳ]/g, "");
  };
  function autoMap(header, sample) {
    var map = {}, used = {};
    IMPF.forEach(function(f) {
      map[f] = -1;
      for (var i = 0; i < header.length; i++) {
        if (!used[i] && SYN[f].indexOf(nk(header[i])) >= 0) {
          map[f] = i;
          used[i] = 1;
          break;
        }
      }
    });
    if (map.name < 0 && map.extId >= 0) {
      var vals = sample.map(function(r) {
        return r[map.extId] || "";
      });
      if (!vals.some(function(v) {
        return /^(https?:\/\/)?(www\.)?wikidata\.org|^Q\d+$/.test(v);
      })) {
        map.name = map.extId;
        map.extId = -1;
      }
    }
    return map;
  }
  function parseType(v) {
    v = String(v || "").toLowerCase();
    if (!v) return "";
    return /gov|гос|davlat|state|ministry|министер|public sector|government/.test(v) ? "gov" : "company";
  }
  function parseStatus(v) {
    v = String(v || "").trim().toLowerCase();
    if (!v) return 0;
    for (var i = 0; i < STATUSES.length; i++) {
      if (v === STATUSES[i] || v === String(i)) return i;
      for (var l in I) if (String(I[l]["st_" + STATUSES[i]]).toLowerCase() === v) return i;
    }
    return 0;
  }
  function rowToRec(row, map, header, opts, now) {
    var g = function(f) {
      return map[f] >= 0 ? String(row[map[f]] == null ? "" : row[map[f]]).trim() : "";
    };
    var alt = [];
    var ems = g("email").replace(/mailto:/gi, "").split(/[;,\s]+/).filter(function(x) {
      return x.indexOf("@") > 0;
    });
    var phs = g("phone").replace(/tel:/gi, "").split(/[;,\/|]+|\s{2,}/).map(function(x) {
      return x.trim();
    }).filter(function(x) {
      return digits(x).length >= 5 && !/[xх*]{2}/i.test(x);
    });
    var webs = g("website").split(/[\s,;|]+/).filter(Boolean), ch = [];
    webs = webs.filter(function(w) {
      var ct = chTypeOfUrl(w);
      if (ct) {
        chAdd(ch, { t: ct, v: w });
        return false;
      }
      return true;
    });
    CHF.forEach(function(f) {
      g(f).split(/[;\n|]+|,\s+/).map(function(x) {
        return x.trim();
      }).filter(Boolean).forEach(function(v) {
        chAdd(ch, { t: f.slice(3), v });
      });
    });
    var cm = parseChText(g("comment"));
    cm.ch.forEach(function(c) {
      chAdd(ch, c);
    });
    if (!phs.length) {
      var wa0 = ch.filter(function(c) {
        return c.t === "whatsapp" || c.t === "viber";
      })[0];
      if (wa0 && normPhone(wa0.v)) phs = [wa0.v];
    }
    ems.slice(1).forEach(function(v) {
      alt.push({ f: "email", v });
    });
    phs.slice(1).forEach(function(v) {
      alt.push({ f: "phone", v });
    });
    webs.slice(1).forEach(function(v) {
      alt.push({ f: "website", v });
    });
    var website = webs[0] || "", email = ems[0] || "", phone = phs[0] || "";
    var name = g("name") || domainOf(website) || (email ? email.split("@")[1] : "");
    if (!name) return null;
    var r = newRec({
      name,
      country: countryCode(g("country")) || g("country"),
      city: g("city"),
      industry: g("industry"),
      type: parseType(g("type")) || opts.type,
      website,
      email,
      phone,
      inn: normInn(g("inn")) || g("inn"),
      lei: g("lei").toUpperCase(),
      extId: map.extId >= 0 ? extIdOf(g("extId")) : "",
      person: g("person"),
      address: g("address"),
      comment: cm.rest,
      status: parseStatus(g("status")),
      ch,
      tags: uniq(g("tags").split(/[,;|]/).map(function(x) {
        return x.trim();
      }).filter(Boolean).concat(opts.tag ? [opts.tag] : [])),
      source: g("source") || opts.source,
      basis: opts.basis,
      alt,
      createdAt: now,
      updatedAt: now,
      ownerId: opts.ownerId || null
    });
    if (opts.keepExtra) {
      var mapped = {};
      IMPF.forEach(function(f) {
        if (map[f] >= 0) mapped[map[f]] = 1;
      });
      var ex = null;
      for (var i = 0; i < header.length; i++) if (!mapped[i] && row[i] != null && String(row[i]).trim()) {
        ex = ex || {};
        ex[header[i] || "col" + (i + 1)] = String(row[i]).trim().slice(0, 500);
      }
      r.extra = ex;
    }
    return r;
  }
  function mergeInto(ex, c) {
    var ch = [];
    ["country", "city", "industry", "inn", "lei", "extId", "person", "address", "comment", "source"].forEach(function(f) {
      if (!ex[f] && c[f]) {
        ex[f] = c[f];
        ch.push(f);
      }
    });
    ex.alt = ex.alt || [];
    ["website", "email", "phone"].forEach(function(f) {
      var vals = [c[f]].concat((c.alt || []).filter(function(a) {
        return a.f === f;
      }).map(function(a) {
        return a.v;
      })).filter(Boolean);
      vals.forEach(function(v) {
        var norm = f === "website" ? domainOf : f === "phone" ? function(x) {
          return normPhone(x) || digits(x);
        } : function(x) {
          return String(x).toLowerCase();
        };
        if (!ex[f]) {
          ex[f] = v;
          ch.push(f);
          return;
        }
        if (norm(ex[f]) === norm(v)) return;
        if (ex.alt.some(function(a) {
          return a.f === f && norm(a.v) === norm(v);
        })) return;
        if (ex.alt.length < 12) {
          ex.alt.push({ f, v });
          ch.push(f + "+");
        }
      });
    });
    var tg = uniq((ex.tags || []).concat(c.tags || []));
    if (tg.length !== (ex.tags || []).length) {
      ex.tags = tg;
      ch.push("tags");
    }
    ex.ch = ex.ch || [];
    (c.ch || []).forEach(function(x) {
      if (ex.ch.length < 30 && chAdd(ex.ch, x)) {
        if (ch.indexOf("ch") < 0) ch.push("ch");
      }
    });
    if (c.cf) {
      ex.cf = ex.cf || {};
      for (var cfk in c.cf) if (ex.cf[cfk] == null || ex.cf[cfk] === "") {
        ex.cf[cfk] = c.cf[cfk];
        if (ch.indexOf("cf") < 0) ch.push("cf");
      }
    }
    if (c.extra) {
      ex.extra = ex.extra || {};
      for (var k in c.extra) if (!ex.extra[k]) {
        ex.extra[k] = c.extra[k];
        if (ch.indexOf("extra") < 0) ch.push("extra");
      }
    }
    return uniq(ch);
  }
  async function startImport(file, preset) {
    if (syncOn() && !await metaGet("firstPull")) {
      toast(t("imp_wait_first"));
      scheduleSync(0);
      return;
    }
    try {
      var header, sample = [], isJson = /\.json$/i.test(file.name) || file.type === "application/json", jsonRows = null;
      var isXls = /\.(xlsx|xlsm|xls|ods)$/i.test(file.name) || /spreadsheet|excel/i.test(file.type || "");
      if (isXls) {
        if (!window.XLSX) throw new Error("XLSX");
        busy(t("loading"), 0.2);
        var wb = XLSX.read(new Uint8Array(await readSlice(file, 0, file.size)), { type: "array", dense: true });
        busy(null);
        var sn = wb.SheetNames[0], pref = wb.SheetNames.filter(function(n) {
          return /^(компании|companies|kompaniyalar|компаниялар)$/i.test(String(n).trim());
        })[0];
        if (pref) sn = pref;
        else if (wb.SheetNames.length > 1) sn = await pickSheet(wb.SheetNames);
        if (!sn) return;
        var aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: "", blankrows: false });
        aoa = aoa.filter(function(r) {
          return r.some(function(c) {
            return String(c).trim();
          });
        });
        if (aoa.length < 2) throw new Error("empty");
        header = aoa[0].map(function(h, i) {
          return String(h || "").trim() || "col" + (i + 1);
        });
        jsonRows = aoa.slice(1).map(function(r) {
          return header.map(function(h, i) {
            return r[i] == null ? "" : String(r[i]);
          });
        });
        sample = jsonRows.slice(0, 5);
      } else if (isJson) {
        var obj = JSON.parse(await readText(file));
        if (obj && obj.app === "sotuvdesc") return restoreFromObj(obj);
        var arr = Array.isArray(obj) ? obj : obj && (obj.companies || obj.data || obj.items || obj.results) || null;
        if (obj && obj.results && obj.results.bindings) arr = obj.results.bindings.map(function(b) {
          var o = {};
          for (var k in b) o[k] = b[k].value;
          return o;
        });
        if (!Array.isArray(arr) || !arr.length) throw new Error(t("imp_json_bad"));
        var keys = [];
        arr.slice(0, 200).forEach(function(o) {
          if (o && typeof o === "object") Object.keys(o).forEach(function(k) {
            if (keys.indexOf(k) < 0) keys.push(k);
          });
        });
        header = keys;
        jsonRows = arr.map(function(o) {
          return keys.map(function(k) {
            var v = o ? o[k] : "";
            return v == null ? "" : typeof v === "object" ? Array.isArray(v) ? v.join("; ") : JSON.stringify(v) : String(v);
          });
        });
        sample = jsonRows.slice(0, 5);
      } else {
        var buf = await readSlice(file, 0, Math.min(file.size, 262144)), rows = [];
        var p = csvParser(function(r) {
          rows.push(r);
        });
        p.push(new TextDecoder("utf-8").decode(buf));
        if (file.size <= 262144) p.end();
        if (!rows.length) throw new Error("empty");
        header = rows[0];
        sample = rows.slice(1, 6);
      }
      var map = autoMap(header, sample);
      var opts = {
        source: preset && preset.source || file.name.replace(/\.[^.]+$/, ""),
        basis: "public",
        type: "company",
        dedupe: "merge",
        keepExtra: true,
        fuzzy: true,
        ownerId: ROLE() === "manager" ? AU.uid : null,
        tag: preset && preset.tag,
        segment: preset && preset.segment,
        auto: preset && preset.auto,
        quiet: preset && preset.quiet
      };
      if (preset && preset.map) for (var pk in preset.map) {
        var hi = header.map(nk).indexOf(nk(preset.map[pk]));
        if (hi >= 0) map[pk] = hi;
      }
      if (preset) {
        run(file, header, map, opts, jsonRows);
        return;
      }
      openMapping(file, header, sample, map, opts, jsonRows);
    } catch (e) {
      busy(null);
      toast(t("imp_bad", { e: e.message || e }));
    }
  }
  function pickSheet(names) {
    return new Promise(function(res) {
      var val = null;
      var sh = openSheet(sheetHead(t("imp_sheet")) + '<div class="col">' + names.map(function(n, i) {
        return '<button class="btn ghost" data-sn="' + i + '">' + esc(n) + "</button>";
      }).join("") + "</div>", { onClose: function() {
        res(val);
      } });
      $$("[data-sn]", sh).forEach(function(b) {
        b.onclick = function() {
          val = names[+b.dataset.sn];
          closeTop();
        };
      });
    });
  }
  function openMapping(file, header, sample, map, opts, jsonRows) {
    var colOpt = function(f) {
      return '<select data-map="' + f + '"><option value="-1">' + esc(t("imp_not_use")) + "</option>" + header.map(function(h, i) {
        var ex = sample[0] && sample[0][i] ? " \u2014 " + String(sample[0][i]).slice(0, 28) : "";
        return '<option value="' + i + '"' + (map[f] === i ? " selected" : "") + ">" + esc((h || "col" + (i + 1)) + ex) + "</option>";
      }).join("") + "</select>";
    };
    var prev = '<div class="tblwrap"><table class="tbl small"><thead><tr>' + header.map(function(h) {
      return "<th>" + esc(h) + "</th>";
    }).join("") + "</tr></thead><tbody>" + sample.slice(0, 3).map(function(r) {
      return "<tr>" + header.map(function(h, i) {
        return "<td>" + esc(String(r[i] || "").slice(0, 40)) + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
    var sh = openSheet(sheetHead(t("imp_title")) + '<div class="form"><p class="muted">' + esc(t("imp_file")) + ": <b>" + esc(file.name) + "</b> (" + fmtBytes(file.size) + ')</p><div class="sub">' + esc(t("imp_rows_preview")) + " \xB7 " + esc(t("imp_prev_cap")) + "</div>" + prev + '<p class="note small">' + esc(t("tpl_hint_imp")) + ' <button class="btn small ghost" data-act="tplDownload">' + ico("download") + esc(t("tpl_dl")) + "</button></p>" + (function() {
      var L = function(f) {
        return lab(f.indexOf("ch_") === 0 ? t(f) : t("fld_" + f), colOpt(f));
      };
      var found = IMPF.filter(function(f) {
        return map[f] >= 0;
      }), rest = IMPF.filter(function(f) {
        return !(map[f] >= 0);
      });
      return '<div class="sub">' + esc(t("imp_found")) + "</div>" + found.map(L).join("") + (rest.length ? '<details class="impmore"' + (found.length ? "" : " open") + "><summary>" + esc(t("imp_more_fields", { n: rest.length })) + "</summary>" + rest.map(L).join("") + "</details>" : "");
    })() + '<details class="impopts"><summary>' + esc(t("imp_opts")) + "</summary>" + lab(t("imp_source"), '<input class="inp" id="iSrc" value="' + esc(opts.source) + '">') + lab(t("imp_basis"), '<select id="iBasis">' + BASIS.map(function(b) {
      return '<option value="' + b + '">' + esc(t("basis_" + b)) + "</option>";
    }).join("") + "</select>") + lab(t("imp_type"), '<select id="iType"><option value="company">' + esc(t("type_company")) + '</option><option value="gov">' + esc(t("type_gov")) + "</option></select>") + lab(t("imp_dedupe"), '<select id="iDd"><option value="merge">' + esc(t("dd_merge")) + '</option><option value="skip">' + esc(t("dd_skip")) + '</option><option value="all">' + esc(t("dd_all")) + "</option></select>") + chk("iFuzzy", t("imp_fuzzy_opt"), true) + chk("iExtra", t("imp_extra"), true) + (ROLE() ? lab(t("fld_owner"), '<select id="iOwner"><option value="">' + esc(t("owner_shared")) + '</option><option value="' + esc(AU.uid) + '"' + (opts.ownerId ? " selected" : "") + ">" + esc(t("owner_me")) + "</option></select>") : "") + lab(t("imp_tag"), '<input class="inp" id="iTag" placeholder="' + esc(t("imp_tag_ph")) + '">') + '</details></div><div class="shfoot"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="iGo">' + esc(t("imp_check")) + "</button></div>", { full: true });
    sh.querySelector("#iGo").onclick = async function() {
      $$("[data-map]", sh).forEach(function(s) {
        map[s.dataset.map] = +s.value;
      });
      if (map.name < 0 && map.website < 0 && map.email < 0) {
        toast(t("imp_need_name"));
        return;
      }
      opts.source = sh.querySelector("#iSrc").value.trim();
      opts.basis = sh.querySelector("#iBasis").value;
      opts.type = sh.querySelector("#iType").value;
      opts.dedupe = sh.querySelector("#iDd").value;
      opts.keepExtra = sh.querySelector("#iExtra").checked;
      opts.fuzzy = sh.querySelector("#iFuzzy").checked;
      if (sh.querySelector("#iOwner")) opts.ownerId = sh.querySelector("#iOwner").value || null;
      if (ROLE() === "manager" && opts.ownerId && opts.ownerId !== AU.uid) opts.ownerId = AU.uid;
      var tg0 = sh.querySelector("#iTag").value.trim();
      if (tg0) {
        opts.tag = tg0.replace(/,/g, " ");
        opts.segment = opts.tag;
      }
      await closeTop();
      run(file, header, map, opts, jsonRows);
    };
  }
  async function run(file, header, map, opts, jsonRows) {
    if (window.XLSX && jsonRows === void 0) jsonRows = null;
    var t0 = Date.now(), st = { rows: 0, added: 0, merged: 0, dups: 0, fileDups: 0, fuzzy: 0, empty: 0, example: 0 };
    var B = 1e3, keyMap = /* @__PURE__ */ new Map(), headerSeen = !!jsonRows, batch = [];
    var plan = { add: /* @__PURE__ */ new Map(), upd: /* @__PURE__ */ new Map(), before: /* @__PURE__ */ new Map(), fields: /* @__PURE__ */ new Map(), fuzzyIds: /* @__PURE__ */ new Set() };
    busy(t("imp_analyze"), 0);
    if (opts.dedupe !== "all" && IDX.length) {
      for (var ki = 0; ki < KEYS.length; ki++) {
        await new Promise(function(res, rej) {
          var k = KEYS[ki], cur = db.transaction("companies").objectStore("companies").index(k).openKeyCursor();
          cur.onsuccess = function() {
            var c = cur.result;
            if (!c) return res();
            if (!keyMap.has(k + ":" + c.key)) keyMap.set(k + ":" + c.key, c.primaryKey);
            c.continue();
          };
          cur.onerror = function() {
            rej(cur.error);
          };
        });
        busy(t("imp_analyze"), (ki + 1) / KEYS.length * 0.3);
        await sleep0();
      }
    }
    var fz = /* @__PURE__ */ new Map();
    if (opts.dedupe !== "all" && opts.fuzzy) IDX.forEach(function(e) {
      if (!e.ci) return;
      var nn = normName(e.n);
      if (nn.length < 3) return;
      var k = e.ci + "|" + nn.slice(0, 3);
      var a = fz.get(k);
      if (!a) {
        a = [];
        fz.set(k, a);
      }
      a.push([e.id, nn]);
    });
    var register = function(c, id) {
      KEYS.forEach(function(k) {
        (c[k] || []).forEach(function(v) {
          keyMap.set(k + ":" + v, id);
        });
      });
    };
    var lookup = function(c) {
      for (var i2 = 0; i2 < KEYS.length; i2++) {
        var a = c[KEYS[i2]] || [];
        for (var j = 0; j < a.length; j++) {
          var id = keyMap.get(KEYS[i2] + ":" + a[j]);
          if (id != null) return id;
        }
      }
      return null;
    };
    var fuzzyFind = function(c) {
      var nn = normName(c.name), ck = cityKey(c.city);
      if (!ck || nn.length < 3) return null;
      var a = fz.get(ck + "|" + nn.slice(0, 3)) || [], best = null, bs = 0;
      for (var i2 = 0; i2 < a.length; i2++) {
        var sc = similar(nn, a[i2][1]);
        if (sc > bs) {
          bs = sc;
          best = a[i2][0];
        }
      }
      return bs >= 0.86 ? best : null;
    };
    var tmpId = -1;
    async function processBatch(rows) {
      var now = Date.now(), cands = [];
      rows.forEach(function(row) {
        if (isExampleRow(row)) {
          st.example++;
          return;
        }
        var r = rowToRec(row, map, header, opts, now);
        if (!r) {
          st.empty++;
          return;
        }
        setKeys(r);
        cands.push(r);
      });
      var need = /* @__PURE__ */ new Set();
      cands.forEach(function(c) {
        var id = opts.dedupe === "all" ? null : lookup(c);
        if (id == null && opts.dedupe !== "all" && opts.fuzzy) {
          id = fuzzyFind(c);
          if (id != null) c._fz = 1;
        }
        if (id == null) {
          c.id = tmpId--;
          c._new = 1;
          plan.add.set(c.id, c);
          if (opts.dedupe !== "all") register(c, c.id);
          return;
        }
        c._m = id;
        if (opts.dedupe !== "all") register(c, id);
        if (id > 0 && !plan.upd.has(id)) need.add(id);
      });
      if (need.size) {
        var s2 = db.transaction("companies").objectStore("companies");
        await Promise.all(Array.from(need).map(function(id) {
          return reqP(s2.get(id)).then(function(r) {
            if (r) {
              plan.before.set(id, JSON.parse(JSON.stringify(r)));
              plan.upd.set(id, r);
            }
          });
        }));
      }
      cands.forEach(function(c) {
        if (c._new) {
          delete c._new;
          return;
        }
        var id = c._m, fz1 = c._fz;
        delete c._m;
        delete c._fz;
        var ex2 = id < 0 ? plan.add.get(id) : plan.upd.get(id);
        if (!ex2) {
          c.id = tmpId--;
          plan.add.set(c.id, c);
          register(c, c.id);
          return;
        }
        if (opts.dedupe === "skip") {
          if (id < 0) st.fileDups++;
          else if (!plan.fields.has(id)) plan.fields.set(id, null);
          return;
        }
        var ch = mergeInto(ex2, c);
        if (fz1 && id > 0) plan.fuzzyIds.add(id);
        if (id < 0) {
          st.fileDups++;
        } else if (ch.length) {
          var f0 = plan.fields.get(id) || [];
          plan.fields.set(id, uniq(f0.concat(ch)));
        } else if (!plan.fields.has(id)) {
          plan.fields.set(id, null);
        }
        setKeys(ex2);
        register(ex2, id);
        register(c, id);
      });
    }
    try {
      if (jsonRows) {
        for (var i = 0; i < jsonRows.length; i += B) {
          st.rows += Math.min(B, jsonRows.length - i);
          await processBatch(jsonRows.slice(i, i + B));
          busy(t("imp_analyze") + " " + num(st.rows), 0.3 + 0.7 * i / jsonRows.length);
          await sleep0();
        }
      } else {
        var parser = csvParser(function(r) {
          if (!headerSeen) {
            headerSeen = true;
            return;
          }
          batch.push(r);
        });
        var dec = new TextDecoder("utf-8"), SZ = 1 << 21;
        for (var off = 0; off < file.size; off += SZ) {
          parser.push(dec.decode(await readSlice(file, off, Math.min(file.size, off + SZ)), { stream: true }));
          while (batch.length >= B) {
            var part = batch.splice(0, B);
            st.rows += part.length;
            await processBatch(part);
            busy(t("imp_analyze") + " " + num(st.rows), Math.min(0.99, 0.3 + 0.7 * (off + SZ) / file.size));
            await sleep0();
          }
        }
        parser.push(dec.decode());
        parser.end();
        while (batch.length) {
          var part2 = batch.splice(0, B);
          st.rows += part2.length;
          await processBatch(part2);
        }
      }
    } catch (e) {
      busy(null);
      toast(t("err", { e: e.message || e }));
      return;
    }
    busy(null);
    st.added = plan.add.size;
    plan.fields.forEach(function(f) {
      if (f) st.merged++;
      else st.dups++;
    });
    st.fuzzy = plan.fuzzyIds.size;
    window.__lastAnalyze = { rows: st.rows, added: st.added, merged: st.merged, dups: st.dups + st.fileDups, fuzzy: st.fuzzy, empty: st.empty, example: st.example };
    if (opts.auto) return applyImport(file, plan, st, t0, opts);
    var ex = [];
    plan.fields.forEach(function(f, id) {
      if (f && ex.length < 6) ex.push([plan.upd.get(id), f]);
    });
    var fl = function(f) {
      return f.map(function(x) {
        var b = x.replace("+", "");
        return (b === "ch" ? t("ch_title") : b === "cf" ? t("cf_title") : I.ru["fld_" + b] ? t("fld_" + b) : b) + (x.slice(-1) === "+" ? " +" : "");
      }).join(", ");
    };
    var sh = openSheet(sheetHead(t("imp_preview")) + '<div class="form"><p class="muted">' + esc(file.name) + '</p><table class="tbl" id="impStats"><tbody>' + [["imp_rows", st.rows], ["imp_new", st.added], ["imp_upd", st.merged], ["imp_dup", st.dups + st.fileDups], ["imp_fuzzy", st.fuzzy], ["imp_empty", st.empty]].concat(st.example ? [["imp_example", st.example]] : []).map(function(a) {
      return '<tr data-k="' + a[0] + '"><td>' + esc(t(a[0])) + "</td><td><b>" + num(a[1]) + "</b></td></tr>";
    }).join("") + "</tbody></table>" + (ex.length ? '<div class="sub">' + esc(t("imp_upd_ex")) + "</div>" + ex.map(function(p) {
      return '<div class="kv"><span>' + esc(p[0].name) + "</span>" + esc(fl(p[1])) + "</div>";
    }).join("") : "") + '<p class="note small">' + esc(t("imp_hint_merge")) + '</p><p class="note small" id="impRemote"></p><div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="impGo">' + esc(t("imp_go_n", { n: num(st.added + st.merged) })) + "</button></div></div>", { full: true });
    catImportCheck(plan, sh.querySelector("#impRemote"));
    sh.querySelector("#impGo").onclick = async function() {
      await closeTop();
      applyImport(file, plan, st, t0, opts);
    };
  }
  async function applyImport(file, plan, st, t0, opts) {
    busy(t("imp_running"), 0);
    var add = Array.from(plan.add.values()), upd = [];
    plan.fields.forEach(function(f, id) {
      if (f) upd.push(plan.upd.get(id));
    });
    var addedIds = [], now = Date.now();
    try {
      var all = add.concat(upd);
      for (var i = 0; i < all.length; i += 1e3) {
        var part = all.slice(i, i + 1e3);
        var wtx = db.transaction(["companies", "idx", "meta"], "readwrite"), cs = wtx.objectStore("companies");
        part.forEach(function(r) {
          if (r.id < 0) {
            r.id = nextId++;
            r.createdAt = now;
            addedIds.push(r.id);
          }
          r.updatedAt = now;
          setKeys(r);
          cs.put(r);
          upsertEntry(entryOf(r));
          DIRTYC.add(r.id);
        });
        flushIdx(wtx);
        wtx.objectStore("meta").put({ k: "dirtyC", v: Array.from(DIRTYC) });
        await txDone(wtx);
        busy(t("imp_running"), i / all.length);
        await sleep0();
      }
      var before = [];
      if (upd.length <= 2e4) upd.forEach(function(r) {
        before.push(plan.before.get(r.id));
      });
      await metaSet("lastImport", { ts: now, file: file.name, added: addedIds, before, canUndo: upd.length <= 2e4 });
    } catch (e) {
      busy(null);
      toast(t("err", { e: e.message || e }));
      refreshList();
      return;
    }
    busy(null);
    scheduleSync();
    var sec = ((Date.now() - t0) / 1e3).toFixed(1);
    window.__lastImport = { rows: st.rows, added: st.added, merged: st.merged, skipped: st.dups + st.fileDups, dups: st.dups + st.fileDups, fuzzy: st.fuzzy, empty: st.empty, example: st.example, seconds: +sec };
    if (opts.segment) await ensureSegment(opts.segment, opts.tag);
    setTab("list");
    if (opts.quiet) return;
    openSheet(sheetHead(t("imp_done")) + '<div class="form"><table class="tbl"><tbody>' + [["imp_rows", st.rows], ["imp_new", st.added], ["imp_upd", st.merged], ["imp_dup", st.dups + st.fileDups], ["imp_empty", st.empty]].map(function(a) {
      return "<tr><td>" + esc(t(a[0])) + "</td><td><b>" + num(a[1]) + "</b></td></tr>";
    }).join("") + "<tr><td>" + esc(t("imp_time")) + "</td><td><b>" + sec + ' s</b></td></tr></tbody></table><button class="btn ghost wide" data-act="undoImport">' + esc(t("imp_undo")) + '</button><button class="btn primary wide" data-act="close">' + esc(t("close")) + "</button></div>");
  }
  async function undoImport() {
    var li = await metaGet("lastImport");
    if (!li) {
      toast(t("imp_undo_none"));
      return;
    }
    if (!li.canUndo) {
      toast(t("imp_undo_big"));
      return;
    }
    if (!await ask(t("imp_undo_q", { f: li.file, n: num(li.added.length), m: num(li.before.length) }), { danger: true, ok: t("imp_undo") })) return;
    busy(t("working"), 0);
    var s = db.transaction("companies").objectStore("companies");
    var addedRecs = (await Promise.all(li.added.map(function(id) {
      return reqP(s.get(id));
    }))).filter(Boolean);
    var tx = db.transaction(["companies", "idx", "meta"], "readwrite");
    addedRecs.forEach(function(r) {
      tx.objectStore("companies").delete(r.id);
      removeEntry(r.id);
      if (r.rts) SY.dels.push({ tbl: "crm_companies", uid: r.uid });
      DIRTYC.delete(r.id);
    });
    flushIdx(tx);
    tx.objectStore("meta").put({ k: "dels", v: SY.dels });
    tx.objectStore("meta").put({ k: "dirtyC", v: Array.from(DIRTYC) });
    tx.objectStore("meta").delete("lastImport");
    await txDone(tx);
    for (var i = 0; i < li.before.length; i += 1e3) {
      var part = li.before.slice(i, i + 1e3), s4 = db.transaction("companies").objectStore("companies");
      var cur = await Promise.all(part.map(function(r) {
        return reqP(s4.get(r.id));
      }));
      part.forEach(function(r, j) {
        if (cur[j]) {
          r.base = cur[j].base;
          r.rts = cur[j].rts;
          r.uid = cur[j].uid;
        }
      });
      await putCompanies(part);
    }
    busy(null);
    toast(t("imp_undone"));
    while (STACK.length) await closeTop();
    refreshList();
    scheduleSync();
  }
  async function ensureSegment(name, tag) {
    if (S.segments.some(function(z) {
      return z.name === name;
    })) return;
    var f = F0();
    f.tag = String(tag || name).toLowerCase();
    S.segments.push({ id: "s" + Date.now(), name, F: f, q: "", sort: "upd" });
    await viewsSave();
  }
  async function loadPreset(path, preset) {
    try {
      busy(t("loading"), 0);
      var blob = await (await fetch(path)).blob(), name = path.split("/").pop();
      var file;
      try {
        file = new File([blob], name, { type: "text/csv" });
      } catch (e) {
        file = blob;
        file.name = name;
      }
      busy(null);
      await startImport(file, preset);
    } catch (e) {
      busy(null);
      toast(t("err", { e: e.message || e }));
    }
  }
  async function loadDemo() {
    try {
      busy(t("loading"), 0);
      var resp = await fetch("sample.csv");
      var blob = await resp.blob();
      var file;
      try {
        file = new File([blob], "sample.csv", { type: "text/csv" });
      } catch (e) {
        file = blob;
        file.name = "sample.csv";
      }
      await startImport(file, { source: "Wikidata (CC0)" });
    } catch (e) {
      busy(null);
      toast(t("err", { e: e.message || e }));
    }
  }
  var CSV_COLS = ["id", "name", "country", "city", "industry", "type", "website", "email", "phone", "lei", "extId", "person", "address", "comment", "status", "tags", "source", "basis", "dnc", "alt", "lastTouch", "nextDue", "createdAt", "updatedAt"];
  async function forEachRecord(ids, fn) {
    if (!ids) {
      var last = 0;
      for (; ; ) {
        var recs = await reqP(db.transaction("companies").objectStore("companies").getAll(IDBKeyRange.lowerBound(last, true), 5e3));
        if (!recs.length) break;
        recs.forEach(fn);
        last = recs[recs.length - 1].id;
        await sleep0();
      }
      return;
    }
    for (var i = 0; i < ids.length; i += 2e3) {
      var s = db.transaction("companies").objectStore("companies");
      var part = await Promise.all(ids.slice(i, i + 2e3).map(function(id) {
        return reqP(s.get(id));
      }));
      part.forEach(function(r) {
        if (r) fn(r);
      });
      busy(t("export_running"), i / ids.length);
      await sleep0();
    }
  }
  async function exportCsv(filtered) {
    busy(t("export_running"), 0);
    try {
      var parts = ["\uFEFF" + CSV_COLS.join(",") + "\r\n"], buf = [];
      await forEachRecord(filtered ? RESULT.map(function(e) {
        return e.id;
      }) : null, function(r) {
        buf.push(CSV_COLS.map(function(c) {
          var v = r[c];
          if (c === "status") v = STATUSES[r.status | 0];
          else if (c === "dnc") v = r.dnc ? "yes" : "";
          else if (c === "alt") v = (r.alt || []).map(function(a) {
            return a.v;
          }).join("; ");
          else if (c === "lastTouch" || c === "createdAt" || c === "updatedAt") v = r[c] ? new Date(r[c]).toISOString() : "";
          return csvCell(v);
        }).join(","));
        if (buf.length >= 2e3) {
          parts.push(buf.join("\r\n") + "\r\n");
          buf = [];
        }
      });
      if (buf.length) parts.push(buf.join("\r\n") + "\r\n");
      await saveFile("sotuvdesc-" + (filtered ? "filter-" : "") + today() + ".csv", parts, "text/csv");
    } catch (e) {
      toast(t("err", { e: e.message || e }));
    }
    busy(null);
  }
  async function backupJson() {
    busy(t("export_running"), 0);
    try {
      var meta = { settings: S.settings, segments: S.segments, templates: S.templates };
      var parts = ['{"app":"sotuvdesc","schema":1,"version":"' + VERSION + '","createdAt":"' + (/* @__PURE__ */ new Date()).toISOString() + '","meta":' + JSON.stringify(meta) + ',"companies":['], buf = [], firstC = true;
      await forEachRecord(null, function(r) {
        var o = {};
        for (var k in r) if (KEYS.indexOf(k) < 0) o[k] = r[k];
        buf.push(JSON.stringify(o));
        if (buf.length >= 2e3) {
          parts.push((firstC ? "" : ",") + buf.join(","));
          firstC = false;
          buf = [];
        }
      });
      if (buf.length) parts.push((firstC ? "" : ",") + buf.join(","));
      var tx = db.transaction(["touches", "tasks"]);
      var tt = await Promise.all([reqP(tx.objectStore("touches").getAll()), reqP(tx.objectStore("tasks").getAll())]);
      parts.push('],"touches":' + JSON.stringify(tt[0]) + ',"tasks":' + JSON.stringify(tt[1]) + "}");
      await saveFile("sotuvdesc-backup-" + today() + ".json", parts, "application/json");
    } catch (e) {
      toast(t("err", { e: e.message || e }));
    }
    busy(null);
  }
  async function restoreFromObj(obj) {
    busy(null);
    if (!obj || obj.app !== "sotuvdesc" || !Array.isArray(obj.companies)) {
      toast(t("restore_bad"));
      return;
    }
    if (!await ask(t("restore_q", { n: num(obj.companies.length) }), { danger: true })) return;
    busy(t("working"), 0);
    var tx = db.transaction(["companies", "touches", "tasks", "idx", "meta"], "readwrite");
    ["companies", "touches", "tasks", "idx"].forEach(function(s2) {
      tx.objectStore(s2).clear();
    });
    tx.objectStore("meta").delete("dict");
    tx.objectStore("meta").delete("idxinfo");
    await txDone(tx);
    resetMem();
    var cs = obj.companies;
    for (var i = 0; i < cs.length; i += 2e3) {
      var w = db.transaction(["companies", "idx", "meta"], "readwrite"), s = w.objectStore("companies");
      cs.slice(i, i + 2e3).forEach(function(r) {
        var x = newRec(r);
        x.id = +r.id || nextId++;
        setKeys(x);
        s.put(x);
        upsertEntry(entryOf(x));
      });
      flushIdx(w);
      await txDone(w);
      busy(t("working"), i / cs.length);
    }
    var w2 = db.transaction(["touches", "tasks", "meta"], "readwrite");
    (obj.touches || []).forEach(function(x) {
      w2.objectStore("touches").put(x);
    });
    (obj.tasks || []).forEach(function(x) {
      w2.objectStore("tasks").put(x);
    });
    var m = obj.meta || {};
    if (m.settings) {
      S.settings = m.settings;
      w2.objectStore("meta").put({ k: "settings", v: m.settings });
    }
    if (Array.isArray(m.segments) && m.segments.length) {
      var have = new Set(S.segments.map(function(v) {
        return v.id;
      }));
      m.segments.forEach(function(v) {
        if (!have.has(v.id)) S.segments.push(v);
      });
      w2.objectStore("meta").put({ k: "settings", v: S.settings });
    }
    if (Array.isArray(m.templates)) {
      m.templates.forEach(function(x) {
        if (["ru", "uz", "en"].indexOf(x.lang) < 0) x.lang = "ru";
      });
      S.templates = m.templates;
      w2.objectStore("meta").put({ k: "templates", v: m.templates });
    }
    await txDone(w2);
    busy(null);
    toast(t("restore_done", { n: num(cs.length) }));
    setTab("list");
  }
  async function wipeAll() {
    var v = await ask(t("wipe_q"), { input: "", danger: true, ok: t("del") });
    var nzw = function(x) {
      return String(x || "").trim().toUpperCase().replace(/[‘’ʻʼ`´']/g, "'");
    };
    if (v == null || nzw(v) !== nzw(t("wipe_word"))) return;
    var tx = db.transaction(["companies", "touches", "tasks", "idx", "meta"], "readwrite");
    ["companies", "touches", "tasks", "idx"].forEach(function(s) {
      tx.objectStore(s).clear();
    });
    ["dict", "idxinfo", "segments", "pullC", "pullM", "pullK", "dirtyC", "dels", "callq"].forEach(function(k) {
      tx.objectStore("meta").delete(k);
    });
    await txDone(tx);
    resetMem();
    dictDirty = false;
    S.segments = [];
    CQ.q = null;
    metaSet("settings", S.settings);
    DIRTYC = /* @__PURE__ */ new Set();
    SY.dels = [];
    F = F0();
    S.q = "";
    $("#q").value = "";
    toast(t("wiped"));
    setTab("list");
  }
  async function saveFile(name, parts, mime) {
    var FS = PLUG.Filesystem, SH = PLUG.Share;
    if (NATIVE && FS && SH) {
      var path = "export/" + name;
      await FS.writeFile({ path, data: "", directory: "CACHE", encoding: "utf8", recursive: true });
      var acc = "";
      for (var i = 0; i < parts.length; i++) {
        acc += parts[i];
        if (acc.length > 1e6 || i === parts.length - 1) {
          await FS.appendFile({ path, data: acc, directory: "CACHE", encoding: "utf8" });
          acc = "";
        }
      }
      var uri = (await FS.getUri({ path, directory: "CACHE" })).uri;
      busy(null);
      try {
        await SH.share({ title: name, files: [uri], dialogTitle: name });
      } catch (e) {
        if (!/cancel/i.test(String(e && e.message))) {
          try {
            await SH.share({ title: name, url: uri, dialogTitle: name });
          } catch (e2) {
          }
        }
      }
      toast(t("exported", { n: name }));
      return;
    }
    var blob = new Blob(parts, { type: mime + ";charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 5e3);
    toast(t("exported", { n: name }));
  }
  function openMass() {
    var ids = S.sel.all ? RESULT.map(function(e) {
      return e.id;
    }) : Array.from(S.sel.ids);
    if (!ids.length) {
      toast(t("mass_none"));
      return;
    }
    var sh = openSheet(sheetHead(t("mass_title", { n: num(ids.length) })) + '<div class="form">' + lab(t("mass_status"), '<select id="mSt"><option value="-1">\u2014</option>' + STATUSES.map(function(s, i) {
      return '<option value="' + i + '">' + esc(stName(i)) + "</option>";
    }).join("") + "</select>") + lab(t("mass_tag"), '<input class="inp" id="mTag">') + lab(t("c_dnc"), '<select id="mDnc"><option value="">\u2014</option><option value="1">' + esc(t("mass_dnc")) + '</option><option value="0">' + esc(t("mass_undnc")) + "</option></select>") + '<div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="mGo">' + esc(t("apply")) + "</button></div></div>");
    sh.querySelector("#mGo").onclick = async function() {
      var stv = +sh.querySelector("#mSt").value, tag = sh.querySelector("#mTag").value.trim().replace(/,/g, " "), dv = sh.querySelector("#mDnc").value;
      await closeTop();
      if (stv < 0 && !tag && dv === "") return;
      if (!await ask(t("mass_confirm", { n: num(ids.length) }), { danger: true, ok: t("apply") })) return;
      if (dv === "0" && !await ask(t("mass_undnc_confirm", { n: num(ids.length) }), { danger: true, ok: t("apply") })) return;
      busy(t("working"), 0);
      var changed = 0, before = [];
      for (var i = 0; i < ids.length; i += 500) {
        var s = db.transaction("companies").objectStore("companies");
        var recs = (await Promise.all(ids.slice(i, i + 500).map(function(id) {
          return reqP(s.get(id));
        }))).filter(Boolean);
        var touches = [], now = Date.now();
        if (before.length < 2e4) recs.forEach(function(r) {
          before.push(JSON.parse(JSON.stringify(r)));
        });
        recs.forEach(function(r) {
          if (stv >= 0 && r.status !== stv) {
            touches.push({ cid: r.id, ts: now, kind: "status", text: t("status_changed", { a: stName(r.status), b: stName(stv) }) });
            r.status = stv;
          }
          if (tag) r.tags = uniq((r.tags || []).concat([tag]));
          if (dv !== "") r.dnc = dv === "1";
        });
        await putCompanies(recs, touches);
        changed += recs.length;
        busy(t("working"), i / ids.length);
        await sleep0();
      }
      busy(null);
      S.sel = null;
      refreshList(true);
      toast(t("mass_done", { n: num(changed) }), before.length === changed ? t("undo") : null, async function() {
        busy(t("working"), 0);
        var s2 = db.transaction("companies").objectStore("companies");
        for (var b = 0; b < before.length; b += 500) {
          var part = before.slice(b, b + 500), cur = await Promise.all(part.map(function(r) {
            return reqP(s2.get(r.id));
          }));
          part.forEach(function(r, i2) {
            if (cur[i2]) {
              r.base = cur[i2].base;
              r.rts = cur[i2].rts;
              r.uid = cur[i2].uid;
            }
          });
          await putCompanies(part);
          s2 = db.transaction("companies").objectStore("companies");
        }
        busy(null);
        toast(t("mass_undone"));
        refreshList(true);
      });
    };
  }
  var AU = { s: null, me: null, uid: "", refreshing: null, lost: false };
  try {
    AU.s = JSON.parse(localStorage.getItem("sd-session") || "null");
    AU.me = JSON.parse(localStorage.getItem("sd-me") || "null");
  } catch (e) {
  }
  if (AU.s && AU.s.user) AU.uid = AU.s.user.id;
  function baseUrl() {
    var c = window.SD_CONFIG || {};
    return String(c.url || "").replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }
  function anonKey() {
    var c = window.SD_CONFIG || {};
    return c.key || c.apikey || "";
  }
  function saveSession(s) {
    AU.s = s;
    AU.uid = s && s.user ? s.user.id : "";
    try {
      if (s) localStorage.setItem("sd-session", JSON.stringify(s));
      else localStorage.removeItem("sd-session");
    } catch (e) {
    }
  }
  function saveMe(m) {
    AU.me = m;
    try {
      if (m) localStorage.setItem("sd-me", JSON.stringify(m));
      else localStorage.removeItem("sd-me");
    } catch (e) {
    }
    if (m) {
      S.settings.user = m.display_name || m.email || "";
      if (!S.settings.me) S.settings.me = S.settings.user;
    }
  }
  var ROLE = function() {
    return AU.me && AU.me.status === "active" ? AU.me.role : "";
  };
  var isAdmin = function() {
    var r = ROLE();
    return r === "owner" || r === "admin";
  };
  var canWriteAny = function() {
    var r = ROLE();
    return r === "owner" || r === "admin" || r === "manager";
  };
  function canWrite(rec) {
    var r = ROLE();
    if (r === "owner" || r === "admin") return true;
    if (r !== "manager") return false;
    var o = rec ? rec.ownerId !== void 0 ? rec.ownerId : rec.owner_id : null;
    return !o || o === AU.uid;
  }
  var myName = function() {
    return AU.me && AU.me.display_name || S.settings.user || "";
  };
  async function rawFetch(method, path, body, headers) {
    var h = { apikey: anonKey(), "Content-Type": "application/json", Accept: "application/json" };
    for (var k in headers || {}) h[k] = headers[k];
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function() {
      if (ctl) ctl.abort();
    }, 6e4);
    try {
      var r = await fetch(baseUrl() + path, { method, headers: h, body: body != null ? JSON.stringify(body) : void 0, signal: ctl ? ctl.signal : void 0 });
      var txt = await r.text(), data = null;
      try {
        data = txt ? JSON.parse(txt) : null;
      } catch (e) {
        data = txt;
      }
      return { status: r.status, ok: r.ok, data };
    } finally {
      clearTimeout(to);
    }
  }
  function authErr(res) {
    var d = res.data || {}, code2 = d.error_code || d.code || "", msg = d.msg || d.message || d.error_description || d.error || "HTTP " + res.status;
    var e = new Error(msg);
    e.code = code2;
    e.status = res.status;
    return e;
  }
  async function refreshSession() {
    if (AU.refreshing) return AU.refreshing;
    AU.refreshing = (async function() {
      if (!AU.s || !AU.s.refresh_token) throw new Error("no_session");
      var res = await rawFetch("POST", "/auth/v1/token?grant_type=refresh_token", { refresh_token: AU.s.refresh_token });
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500) {
          AU.lost = true;
          throw authErr(res);
        }
        throw authErr(res);
      }
      saveSession(res.data);
      rtToken();
      return res.data;
    })();
    try {
      return await AU.refreshing;
    } finally {
      AU.refreshing = null;
    }
  }
  async function ensureFresh() {
    if (!AU.s) throw new Error("no_session");
    if ((AU.s.expires_at || 0) * 1e3 - Date.now() < 9e4) await refreshSession();
  }
  async function authed(method, path, body, prefer, retried) {
    await ensureFresh();
    var h = { Authorization: "Bearer " + AU.s.access_token };
    if (prefer) h.Prefer = prefer;
    var res = await rawFetch(method, path, body, h);
    if (res.status === 401 && !retried) {
      await refreshSession();
      return authed(method, path, body, prefer, true);
    }
    if (!res.ok) {
      var d = res.data || {};
      var e = new Error("HTTP " + res.status + " " + (d.message || d.msg || (typeof d === "string" ? d : JSON.stringify(d))).slice(0, 200));
      e.status = res.status;
      e.code = d.code;
      throw e;
    }
    return res.data;
  }
  function api(method, path, body, prefer) {
    return authed(method, "/rest/v1/" + path, body, prefer);
  }
  function rpc(fn, args) {
    return api("POST", "rpc/" + fn, args || {});
  }
  function syncOn() {
    return !!(baseUrl() && anonKey() && AU.s && ROLE());
  }
  var STAFF_DOMAIN = "staff.sotuvdesc.app";
  function loginToEmail(v) {
    v = String(v || "").trim().toLowerCase();
    return v.indexOf("@") > 0 ? v : v + "@" + STAFF_DOMAIN;
  }
  function emailToLogin(e) {
    e = String(e || "");
    return e.slice(-STAFF_DOMAIN.length - 1) === "@" + STAFF_DOMAIN ? e.slice(0, -STAFF_DOMAIN.length - 1) : e;
  }
  async function staffFn(body, withAuth) {
    var h = { "Content-Type": "application/json", apikey: anonKey() };
    if (withAuth) {
      await ensureFresh();
      h.Authorization = "Bearer " + AU.s.access_token;
    }
    var r = await fetch(baseUrl() + "/functions/v1/sotuvdesc-staff", { method: "POST", headers: h, body: JSON.stringify(body) });
    var j = {};
    try {
      j = await r.json();
    } catch (e) {
    }
    if (!r.ok) {
      var er = new Error(j.error || "HTTP " + r.status);
      er.code = j.error;
      throw er;
    }
    return j;
  }
  async function signIn(email, pw) {
    var res = await rawFetch("POST", "/auth/v1/token?grant_type=password", { email, password: pw });
    if (!res.ok) throw authErr(res);
    saveSession(res.data);
    AU.lost = false;
    return res.data;
  }
  async function signUp(email, pw, name, code2) {
    var data = { display_name: name };
    if (code2) {
      data.owner_code = code2.trim();
      data.invite_code = code2.trim().toUpperCase();
    }
    var res = await rawFetch("POST", "/auth/v1/signup", { email, password: pw, data });
    if (!res.ok) throw authErr(res);
    if (res.data && res.data.access_token) {
      saveSession(res.data);
      return "session";
    }
    try {
      await signIn(email, pw);
      return "session";
    } catch (e) {
      if (e.code === "email_not_confirmed") return "confirm";
      throw e;
    }
  }
  async function loadMe() {
    var rows = await rpc("crm_me");
    var act = (rows || []).filter(function(m) {
      return m.status === "active";
    })[0] || (rows || [])[0] || null;
    saveMe(act ? { org_id: act.org_id, org_name: act.org_name, role: act.role, status: act.status, display_name: act.display_name, email: act.email } : { status: "none", email: AU.s && AU.s.user && AU.s.user.email });
    return AU.me;
  }
  async function signOut(skipAsk) {
    if (!skipAsk) {
      var n = db ? await pendingCount() : 0;
      if (!await ask(n ? t("logout_q_pend", { n }) : t("logout_q"), { danger: true, ok: t("logout") })) return;
    }
    try {
      if (AU.s) await rawFetch("POST", "/auth/v1/logout", null, { Authorization: "Bearer " + AU.s.access_token });
    } catch (e) {
    }
    rtClose();
    saveSession(null);
    saveMe(null);
    if (db) await wipeLocal();
    while (STACK.length) await closeTop();
    showGate("login");
  }
  async function wipeLocal() {
    var stores = ["companies", "touches", "tasks", "idx", "contacts", "deals", "pipelines", "stages", "plans", "members", "products", "org_settings", "quotes", "goals", "scripts", "files", "chats", "chat_members", "chat_msgs", "chat_prefs"].concat(window.SDTeam ? SDTeam.stores : []);
    var tx = db.transaction(stores.concat(["meta"]), "readwrite");
    stores.forEach(function(s) {
      tx.objectStore(s).clear();
    });
    ["dict", "idxinfo", "pullC", "pullM", "pullK", "pullCt", "pullD", "pullP", "pullS", "pullPl", "pullPr", "pullOs", "pullQ", "pullGo", "pullSc", "pullFi", "pullCx", "pullCxM", "pullCxMsg", "fix160", "dirtyC", "dels", "dbOwner", "lastImport", "reconciled", "callq", "catCov", "catMarks", "catKeep", "catStats", "catPrune"].forEach(function(k) {
      tx.objectStore("meta").delete(k);
    });
    await txDone(tx);
    CQ.q = null;
    catReset();
    delete S.settings.syncCountries;
    delete S.settings.catV;
    delete S.settings.catIntro;
    metaSet("settings", S.settings);
    resetMem();
    dictDirty = false;
    DIRTYC = /* @__PURE__ */ new Set();
    SY.dels = [];
    F = F0();
    S.q = "";
    if ($("#q")) $("#q").value = "";
    MEM.members = [];
    MEM.stages = [];
    MEM.pipelines = [];
    if (window.SDTeam) SDTeam.reset();
    FI.list = [];
    CX.chats = /* @__PURE__ */ new Map();
    CX.mem = /* @__PURE__ */ new Map();
    CX.msgs = /* @__PURE__ */ new Map();
    CX.mid = /* @__PURE__ */ new Map();
    CX.prefs = {};
    CX.readLocal = {};
    CX.profiles = [];
    CX.blocks = [];
    CX.netAt = 0;
    CX.last = 0;
    cxBadge();
  }
  async function bindLocalOwner() {
    var own = await metaGet("dbOwner"), key = AU.uid + "|" + (AU.me && AU.me.org_id);
    if (own && own !== key) {
      await wipeLocal();
    } else if (!own && IDX.length) {
    }
    await metaSet("dbOwner", key);
  }
  function gateHtml(mode, msg) {
    var langs = '<div class="langsw gl">' + ["ru", "uz", "uzc", "en"].map(function(l) {
      return '<button data-glang="' + l + '" class="' + (l === LANG ? "on" : "") + '">' + (l === "uzc" ? "\u040E\u0417" : l.toUpperCase()) + "</button>";
    }).join("") + "</div>";
    var head = '<div class="ghead"><img src="assets/sotuvdesc-mark.svg" alt="Sotuvdesc" width="56" height="56"><div><b>Sotuvdesc</b><small>CRM \xB7 SavdEx \xB7 ' + VERSION + "</small></div>" + langs + "</div>";
    var err = msg ? '<div class="gmsg">' + esc(msg) + "</div>" : "";
    if (mode === "login") return head + "<h2>" + esc(t("g_login")) + "</h2>" + err + '<form class="form" id="gForm" autocomplete="on">' + lab(t("g_login_or_email"), '<input class="inp" id="gEmail" autocomplete="username" autocapitalize="none" spellcheck="false" required>') + lab(t("g_pass"), '<input class="inp" id="gPass" type="password" autocomplete="current-password" required>') + '<button class="btn primary wide big" type="submit">' + esc(t("g_login_btn")) + '</button></form><div class="glinks"><button class="btn ghost wide" data-gact="owner">' + esc(t("g_owner")) + '</button><button class="btn ghost wide" data-gact="register">' + esc(t("g_to_register")) + '</button><button class="linkbtn" data-gact="recover">' + esc(t("g_forgot")) + "</button></div>" + (cachedOk() ? '<button class="linkbtn" data-gact="offline">' + esc(t("g_offline")) + "</button>" : "");
    if (mode === "owner") return head + '<div class="gtop"><button class="icbtn" data-gact="login" aria-label="' + esc(t("back")) + '">' + ico("back") + "</button><h2>" + esc(t("g_owner")) + "</h2></div>" + err + '<p class="muted small">' + esc(t("g_owner_text")) + '</p><form class="form" id="gForm" autocomplete="off">' + lab(t("g_owner_code"), '<input class="inp" id="gCode" required autocomplete="off" autocapitalize="characters" spellcheck="false">') + lab(t("g_name"), '<input class="inp" id="gName" autocomplete="name" maxlength="80">') + lab(t("g_new_login"), '<input class="inp" id="gLogin" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="abdurashid">') + lab(t("g_new_pass"), '<input class="inp" id="gPass" type="password" required minlength="8" autocomplete="new-password">') + '<p class="muted small">' + esc(t("g_login_rules")) + '</p><button class="btn primary wide big" type="submit">' + esc(t("g_owner_btn")) + "</button></form>";
    if (mode === "register") return head + '<div class="gtop"><button class="icbtn" data-gact="login" aria-label="' + esc(t("back")) + '">' + ico("back") + "</button><h2>" + esc(t("g_register")) + "</h2></div>" + err + '<form class="form" id="gForm" autocomplete="on">' + lab(t("g_name"), '<input class="inp" id="gName" autocomplete="name" required maxlength="80">') + lab(t("g_login_or_email"), '<input class="inp" id="gEmail" autocomplete="username" autocapitalize="none" spellcheck="false" required>') + lab(t("g_pass_new"), '<input class="inp" id="gPass" type="password" autocomplete="new-password" required minlength="8">') + (GATE.code ? '<div class="note">' + esc(t("g_invited", { c: GATE.code })) + '</div><input type="hidden" id="gCode" value="' + esc(GATE.code) + '">' : lab(t("g_code"), '<input class="inp" id="gCode" autocomplete="off" placeholder="ABCD-2345" style="text-transform:uppercase">') + '<p class="muted small">' + esc(t("g_code_hint")) + "</p>") + '<button class="btn primary wide big" type="submit">' + esc(t("g_register_btn")) + "</button></form>";
    if (mode === "join") return head + "<h2>" + esc(t("g_join")) + "</h2>" + err + '<p class="muted">' + esc(t("g_join_text", { e: AU.s && AU.s.user && AU.s.user.email || "" })) + '</p><form class="form" id="gForm">' + lab(t("g_code"), '<input class="inp" id="gCode" required autocomplete="off" style="text-transform:uppercase" value="' + esc(GATE.code || "") + '">') + '<button class="btn primary wide big" type="submit">' + esc(t("g_join_btn")) + '</button></form><div class="col"><button class="btn ghost wide" data-gact="request">' + esc(t("g_request")) + '</button><button class="btn ghost wide" data-gact="logout">' + esc(t("logout")) + "</button></div>";
    if (mode === "pending") return head + "<h2>" + esc(t("g_pending")) + "</h2>" + err + "<p>" + esc(t("g_pending_text", { e: AU.me && AU.me.email || "", o: AU.me && AU.me.org_name || "SavdEx" })) + '</p><div class="col"><button class="btn primary" data-gact="check">' + ico("sync") + esc(t("g_check")) + '</button><button class="btn ghost" data-gact="logout">' + esc(t("logout")) + "</button></div>";
    if (mode === "blocked") return head + "<h2>" + esc(t("g_blocked")) + "</h2><p>" + esc(t("g_blocked_text")) + '</p><button class="btn ghost wide" data-gact="logout">' + esc(t("logout")) + "</button>";
    if (mode === "confirm") return head + "<h2>" + esc(t("g_confirm")) + "</h2><p>" + esc(t("g_confirm_text")) + '</p><button class="btn primary wide" data-gact="login">' + esc(t("g_login_btn")) + "</button>";
    if (mode === "wait") return head + '<p class="muted">' + esc(t("loading")) + "</p>";
    return head;
  }
  function cachedOk() {
    return !!(AU.s && AU.me && AU.me.status === "active");
  }
  var GATE = { mode: null, code: "" };
  function codeFromUrl(u) {
    var m = /[#?&](?:join|c|code)=([A-Za-z0-9-]{6,40})/.exec(String(u || ""));
    return m ? decodeURIComponent(m[1]).toUpperCase() : "";
  }
  GATE.code = codeFromUrl(location.href);
  function inviteLink(code2) {
    var w = (window.SD_CONFIG || {}).web;
    if (w) return String(w).replace(/\/+$/, "") + "/join?c=" + encodeURIComponent(code2);
    return baseUrl() ? baseUrl() + "/functions/v1/invite?c=" + encodeURIComponent(code2) : "";
  }
  function onInviteUrl(u) {
    var c = codeFromUrl(u);
    if (!c) return;
    GATE.code = c;
    if (!AU.s || GATE.mode) showGate(AU.s ? "join" : "register");
  }
  function showGate(mode, msg) {
    GATE.mode = mode;
    var g = $("#gate");
    g.innerHTML = '<div class="gbox">' + gateHtml(mode, msg) + "</div>";
    g.hidden = false;
    var f = g.querySelector("#gForm");
    if (f) {
      f.setAttribute("novalidate", "");
      f.onsubmit = function(ev) {
        ev.preventDefault();
        if (gateCheck(f)) gateSubmit(mode);
      };
    }
    var first = g.querySelector("input");
    if (first && !("ontouchstart" in window)) setTimeout(function() {
      var a = document.activeElement;
      if (a && a !== first && g.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      first.focus();
    }, 30);
  }
  function gateCheck(f) {
    var bad = $$("input", f).filter(function(i) {
      return i.required && !i.value.trim() || i.minLength > 0 && i.value && i.value.length < i.minLength;
    })[0];
    if (!bad) return true;
    var lb = bad.closest("label"), nm = lb && lb.querySelector("span") ? lb.querySelector("span").textContent : "";
    fieldErr(bad, bad.value && bad.minLength > 0 ? t("e_pw_min", { n: bad.minLength }) : t("e_fill", { f: nm }));
    return false;
  }
  function hideGate() {
    GATE.mode = null;
    $("#gate").hidden = true;
    $("#gate").innerHTML = "";
  }
  function errText(e) {
    var c = e && e.code || "", m = String(e && e.message || e || "");
    if (c === "invalid_credentials" || /invalid login/i.test(m)) return t("e_cred");
    if (c === "bad_login") return t("g_login_rules");
    if (c === "login_taken") return t("e_login_taken");
    if (c === "bad_code") return t("e_code");
    if (c === "owner_not_created") return t("e_owner_exists");
    if (c === "user_already_exists" || /already registered/i.test(m)) return t("e_exists");
    if (c === "weak_password" || /at least 6/i.test(m)) return t("e_weak");
    if (c === "over_email_send_rate_limit" || /rate limit/i.test(m)) return t("e_rate");
    if (c === "email_not_confirmed") return t("g_confirm_text");
    if (/bad_code/.test(m)) return t("e_code");
    if (/owner_exists/.test(m)) return t("e_owner_exists");
    if (/Failed to fetch|NetworkError|abort/i.test(m)) return t("e_net");
    if (/need_invite/.test(m)) return t("e_need_invite");
    if (/too_many_attempts/.test(m)) return t("e_too_many");
    if (/blocked/.test(m)) return t("g_blocked_text");
    console.warn("auth error", m);
    return t("e_generic");
  }
  async function gateSubmit(mode) {
    var g = $("#gate"), v = function(id) {
      var el = g.querySelector("#" + id);
      return el ? el.value.trim() : "";
    };
    var btn = g.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    try {
      if (mode === "login") {
        await signIn(loginToEmail(v("gEmail")), g.querySelector("#gPass").value);
        await afterLogin();
      } else if (mode === "owner") {
        var lg = v("gLogin").toLowerCase(), pw = g.querySelector("#gPass").value;
        if (!/^[a-z0-9][a-z0-9._-]{2,30}$/.test(lg)) throw Object.assign(new Error("bad_login"), { code: "bad_login" });
        await staffFn({ action: "owner", code: v("gCode"), login: lg, password: pw, name: v("gName") || lg });
        await signIn(loginToEmail(lg), pw);
        await afterLogin(v("gName") || lg);
      } else if (mode === "register") {
        var r = await signUp(loginToEmail(v("gEmail")), g.querySelector("#gPass").value, v("gName"), v("gCode"));
        if (r === "confirm") return showGate("confirm");
        GATE.code = "";
        try {
          history.replaceState(null, "", location.pathname);
        } catch (e) {
        }
        await afterLogin(v("gName"));
      } else if (mode === "join") {
        joinResult(await rpc("crm_join", { p_code: v("gCode"), p_name: S.settings.user || null }));
        await afterLogin();
      }
    } catch (e) {
      showGate(mode, errText(e));
      var em = $("#gate #gEmail");
      if (em && e && mode !== "join") em.value = v("gEmail") || "";
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  function joinResult(r) {
    if (r === "bad_code" || r === "too_many_attempts" || r === "blocked") {
      var e = new Error(r);
      e.code = r;
      throw e;
    }
    return r;
  }
  async function afterLogin(name) {
    showGate("wait");
    var me = await loadMe();
    if (me.status === "none") {
      if (GATE.code) {
        try {
          joinResult(await rpc("crm_join", { p_code: GATE.code, p_name: name || null }));
          GATE.code = "";
          return afterLogin(name);
        } catch (e) {
          return showGate("join", errText(e));
        }
      }
      return showGate("join");
    }
    if (me.status === "pending") return showGate("pending");
    if (me.status === "blocked") {
      if (db) await wipeLocal();
      return showGate("blocked");
    }
    if (name && me.display_name !== name) {
      try {
        await rpc("crm_rename_me", { p_name: name });
        me.display_name = name;
        saveMe(me);
      } catch (e) {
      }
    }
    await bindLocalOwner();
    await metaSet("settings", S.settings);
    hideGate();
    onSessionReady();
  }
  document.addEventListener("click", async function(ev) {
    var b = ev.target.closest("[data-gact],[data-glang]");
    if (!b) return;
    if (b.dataset.glang) {
      LANG = b.dataset.glang;
      try {
        localStorage.setItem("sd-lang", LANG);
      } catch (e) {
      }
      renderStatic();
      showGate(GATE.mode || "login");
      return;
    }
    var a = b.dataset.gact;
    if (a === "register" || a === "login" || a === "owner") return showGate(a);
    if (a === "logout") return signOut(true);
    if (a === "request") {
      try {
        await rpc("crm_request_join", { p_name: S.settings.user || null });
        await afterLogin();
      } catch (e) {
        showGate("join", errText(e));
      }
      return;
    }
    if (a === "offline") {
      hideGate();
      onSessionReady(true);
      return;
    }
    if (a === "check") {
      try {
        await afterLogin();
      } catch (e) {
        showGate("pending", errText(e));
      }
      return;
    }
    if (a === "recover") {
      var em = ($("#gate #gEmail") || {}).value || "";
      if (!em) return showGate("login", t("g_forgot_need"));
      var res = await rawFetch("POST", "/auth/v1/recover", { email: em.trim().toLowerCase() }).catch(function() {
        return { ok: false };
      });
      showGate("login", res.ok ? t("g_forgot_sent") : t("g_forgot_admin"));
    }
  });
  async function recoveryFromUrl() {
    var h = String(location.hash || "");
    if (h.indexOf("type=recovery") < 0) return false;
    var q = {};
    h.slice(1).split("&").forEach(function(kv) {
      var p = kv.split("=");
      q[p[0]] = decodeURIComponent(p[1] || "");
    });
    if (!q.access_token) return false;
    saveSession({ access_token: q.access_token, refresh_token: q.refresh_token, expires_at: Math.floor(Date.now() / 1e3) + (+q.expires_in || 3600), user: {} });
    try {
      history.replaceState(null, "", location.pathname);
    } catch (e) {
    }
    var np = await ask(t("pw_new_q"), { input: "", ok: t("save") });
    if (np && np.length >= 8) {
      var r = await rawFetch("PUT", "/auth/v1/user", { password: np }, { Authorization: "Bearer " + q.access_token });
      toast(r.ok ? t("pw_changed") : errText(authErr(r)));
      if (r.ok && r.data) {
        AU.s.user = r.data;
        saveSession(AU.s);
      }
    }
    return true;
  }
  async function startAuth() {
    try {
      await recoveryFromUrl();
    } catch (e) {
    }
    if (!baseUrl() || !anonKey()) {
      onSessionReady(true);
      return;
    }
    if (!AU.s) return showGate(GATE.code ? "register" : "login");
    if (navigator.onLine === false) {
      if (cachedOk()) {
        onSessionReady(true);
        return;
      }
      return showGate("login", t("e_net"));
    }
    try {
      await afterLogin();
    } catch (e) {
      if (AU.lost) {
        saveSession(null);
        return showGate("login", t("e_session"));
      }
      if (cachedOk()) {
        onSessionReady(true);
        toast(t("e_net"));
      } else showGate("login", errText(e));
    }
  }
  var READY = false;
  function onSessionReady(offline) {
    $("#userName").textContent = myName();
    applyRoleUi();
    if (window.SDOnb) SDOnb.maybeShow();
    if (READY) {
      syncBadge();
      scheduleSync(100);
      rtConnect();
      return;
    }
    setTimeout(function() {
      checkUpdate(false);
    }, 4e3);
    READY = true;
    syncBadge();
    if (!offline || navigator.onLine !== false) {
      scheduleSync(200);
      rtConnect();
    }
    setInterval(function() {
      if (!document.hidden) scheduleSync(0);
    }, 3e4);
  }
  function applyRoleUi() {
    var r = ROLE();
    document.body.dataset.role = r || "local";
    $("#btnAdd").hidden = !!r && !canWriteAny();
  }
  var ROLES = ["owner", "admin", "manager", "viewer"];
  function openProfile() {
    if (!AU.s) {
      if (baseUrl()) return showGate("login");
    }
    var m = AU.me || {};
    var sh = openSheet(sheetHead(t("profile")) + '<div class="form"><div class="about"><img src="assets/savdex-logo-160.png" alt="SavdEx" width="56" height="56"><p><b>' + esc(myName() || "\u2014") + '</b><br><span class="muted">' + esc(m.email || "") + "</span><br>" + esc(t("role_" + (m.role || "manager"))) + " \xB7 " + esc(m.org_name || "") + "</p></div>" + lab(t("g_name"), '<input class="inp" id="pName" value="' + esc(myName()) + '" maxlength="80">') + '<button class="btn ghost" id="pSave">' + esc(t("save")) + "</button>" + lab(t("set_lang"), langSelect("pLang")) + (isAdmin() ? '<button class="btn primary" data-act="staff">' + ico("user") + esc(t("staff")) + "</button>" : "") + '<button class="btn ghost" id="pPass">' + esc(t("pw_change")) + '</button><button class="btn danger" id="pOut">' + esc(t("logout")) + "</button></div>", { full: true });
    sh.querySelector("#pLang").onchange = async function() {
      var l = this.value;
      await closeTop();
      setLang(l);
    };
    sh.querySelector("#pPass").onclick = async function() {
      var np = await ask(t("pw_new_q"), { input: "", ok: t("save") });
      if (np == null) return;
      if (np.length < 8) {
        toast(t("e_weak8"));
        return;
      }
      try {
        await ensureFresh();
        var r = await rawFetch("PUT", "/auth/v1/user", { password: np }, { Authorization: "Bearer " + AU.s.access_token });
        if (!r.ok) throw authErr(r);
        toast(t("pw_changed"));
      } catch (e) {
        toast(errText(e));
      }
    };
    sh.querySelector("#pSave").onclick = async function() {
      var nm = sh.querySelector("#pName").value.trim();
      if (!nm) return;
      try {
        await rpc("crm_rename_me", { p_name: nm });
        AU.me.display_name = nm;
        saveMe(AU.me);
        await metaSet("settings", S.settings);
        $("#userName").textContent = nm;
        toast(t("c_saved"));
      } catch (e) {
        toast(errText(e));
      }
    };
    sh.querySelector("#pOut").onclick = function() {
      signOut(false);
    };
  }
  async function openStaff() {
    if (!isAdmin()) return;
    var sh = openSheet(sheetHead(t("staff")) + '<div class="form" id="stBody"><p class="muted">' + esc(t("loading")) + "</p></div>", { full: true });
    await renderStaff(sh);
  }
  async function renderStaff(sh) {
    var body = sh.querySelector("#stBody"), org = AU.me.org_id, members, invites;
    try {
      var r = await Promise.all([api("GET", "crm_members?select=*&org_id=eq." + org + "&order=created_at.asc"), api("GET", "crm_invites?select=*&org_id=eq." + org + "&revoked=eq.false&order=created_at.desc")]);
      members = r[0];
      invites = r[1].filter(function(i) {
        return Date.parse(i.expires_at) > Date.now() && i.uses < i.max_uses;
      });
    } catch (e) {
      body.innerHTML = '<p class="red">' + esc(errText(e)) + "</p>";
      return;
    }
    await storeMembers(members);
    var pend = members.filter(function(m) {
      return m.status === "pending";
    }), rest = members.filter(function(m) {
      return m.status !== "pending";
    });
    body.innerHTML = '<button class="btn primary wide big" id="stAdd">' + ico("plus") + esc(t("st_add")) + '</button><button class="btn ghost wide" id="stInvite">' + esc(t("inv_btn")) + "</button>" + (pend.length ? '<h3 class="red">' + esc(t("st_m_pending")) + " \xB7 " + pend.length + "</h3>" + pend.map(function(m) {
      return '<div class="mrow"><div class="mmain"><b>' + esc(m.display_name || m.email) + '</b><span class="muted small">' + esc(m.email || "") + '</span></div><div class="mact"><button class="btn primary" data-accept="' + m.user_id + '">' + esc(t("accept")) + '</button><button class="btn ghost" data-mtap="' + m.user_id + '">\u2026</button></div></div>';
    }).join("") : "") + "<h3>" + esc(t("staff")) + " \xB7 " + rest.length + "</h3>" + rest.map(function(m) {
      return '<button class="mrow mbtn" data-mtap="' + m.user_id + '"><span class="mmain"><b>' + esc(m.display_name || emailToLogin(m.email)) + (m.user_id === AU.uid ? " (" + esc(t("you")) + ")" : "") + '</b><span class="muted small">' + esc(emailToLogin(m.email || "")) + '</span></span><span class="rchip r-' + m.role + (m.status === "blocked" ? " blocked" : "") + '">' + esc(m.status === "blocked" ? t("st_m_blocked") : t("role_" + m.role)) + "</span></button>";
    }).join("") + (invites.length ? '<details class="invs"><summary>' + esc(t("invites")) + " \xB7 " + invites.length + "</summary>" + invites.map(function(i) {
      return '<div class="mrow"><div class="mmain"><b class="code">' + esc(i.code) + '</b><span class="muted small">' + esc(t("role_" + i.role)) + " \xB7 " + esc(t("inv_left", { n: i.max_uses - i.uses, d: fmtDate(i.expires_at.slice(0, 10)) })) + '</span></div><div class="mact"><button class="btn small ghost" data-icopy="' + esc(i.code) + '" data-irole="' + i.role + '">' + esc(t("copy_send")) + '</button><button class="btn small danger" data-irev="' + esc(i.code) + '">' + esc(t("revoke")) + "</button></div></div>";
    }).join("") + "</details>" : "");
    if (window.SDOnb) SDOnb.staffEmpty(body, members);
    var redo = function() {
      renderStaff(sh);
    };
    body.querySelector("#stInvite").onclick = function() {
      openInvite(org, redo);
    };
    body.querySelector("#stAdd").onclick = function() {
      openAddStaff(redo);
    };
    $$("[data-accept]", body).forEach(function(b) {
      b.onclick = async function() {
        try {
          await rpc("crm_set_member", { p_org: org, p_user: b.dataset.accept, p_role: "manager", p_status: "active" });
          toast(t("accepted"));
        } catch (e) {
          toast(errText(e));
        }
        redo();
      };
    });
    $$("[data-mtap]", body).forEach(function(b) {
      b.onclick = function() {
        var m = members.filter(function(x) {
          return x.user_id === b.dataset.mtap;
        })[0];
        if (m) openMember(org, m, redo);
      };
    });
    $$("[data-irev]", body).forEach(function(b) {
      b.onclick = async function() {
        try {
          await rpc("crm_revoke_invite", { p_code: b.dataset.irev });
        } catch (e) {
          toast(errText(e));
        }
        redo();
      };
    });
    $$("[data-icopy]", body).forEach(function(b) {
      b.onclick = function() {
        shareInvite(b.dataset.icopy, b.dataset.irole);
      };
    });
  }
  function openAddStaff(done) {
    var meOwner = ROLE() === "owner", role = "manager";
    var sh = openSheet(sheetHead(t("st_add")) + '<div class="form">' + lab(t("g_name"), '<input class="inp" id="asName" maxlength="80" placeholder="\u0410\u0437\u0438\u0437 \u041A\u0430\u0440\u0438\u043C\u043E\u0432">') + '<div class="seg" id="asRole">' + ["manager", "viewer"].concat(meOwner ? ["admin"] : []).map(function(x, i) {
      return '<button class="btn ' + (i === 0 ? "primary" : "ghost") + '" data-r="' + x + '">' + esc(t("role_" + x)) + "</button>";
    }).join("") + '</div><p class="muted small" id="asHelp">' + esc(t("role_help_manager")) + '</p><button class="btn primary wide big" id="asGo">' + esc(t("st_create")) + "</button></div>");
    $$("#asRole [data-r]", sh).forEach(function(b) {
      b.onclick = function() {
        role = b.dataset.r;
        $$("#asRole [data-r]", sh).forEach(function(x) {
          x.className = "btn " + (x === b ? "primary" : "ghost");
        });
        sh.querySelector("#asHelp").textContent = t("role_help_" + role);
      };
    });
    sh.querySelector("#asGo").onclick = async function() {
      var nm = sh.querySelector("#asName").value.trim();
      if (nm.length < 2) {
        sh.querySelector("#asName").focus();
        return;
      }
      this.disabled = true;
      try {
        var r = await staffFn({ action: "create", name: nm, role }, true);
        window.__lastStaff = r;
        await closeTop();
        showCredentials(r.name, r.login, r.password, r.role);
        done();
      } catch (e) {
        this.disabled = false;
        toast(errText(e));
      }
    };
  }
  function showCredentials(name, login, pw, role) {
    var text = t("st_cred_text", { n: name, l: login, p: pw, o: AU.me && AU.me.org_name || "SavdEx" });
    var sh = openSheet(sheetHead(t("st_cred_title")) + '<div class="form"><p><b>' + esc(name) + "</b>" + (role ? " \xB7 " + esc(t("role_" + role)) : "") + '</p><div class="cred"><span>' + esc(t("st_login")) + '</span><b class="code" id="crL">' + esc(login) + "</b><span>" + esc(t("g_pass")) + '</span><b class="code" id="crP">' + esc(pw) + '</b></div><p class="warn small">' + esc(t("st_cred_once")) + '</p><div class="row2"><button class="btn ghost" id="crCopy">' + esc(t("tpl_copy")) + '</button><button class="btn primary" id="crSend">' + esc(t("copy_send")) + "</button></div></div>");
    sh.querySelector("#crCopy").onclick = async function() {
      await copyText(text);
      toast(t("tpl_copied"));
    };
    sh.querySelector("#crSend").onclick = async function() {
      await copyText(text);
      if (NATIVE && PLUG.Share) {
        try {
          await PLUG.Share.share({ title: "Sotuvdesc", text, dialogTitle: t("copy_send") });
          return;
        } catch (e) {
        }
      } else if (navigator.share && !/HeadlessChrome/.test(navigator.userAgent)) {
        try {
          await navigator.share({ title: "Sotuvdesc", text });
          return;
        } catch (e) {
        }
      }
      toast(t("tpl_copied"));
    };
  }
  function openInvite(org, done) {
    var meOwner = ROLE() === "owner";
    var sh = openSheet(sheetHead(t("inv_btn")) + '<div class="form"><div class="seg" id="invRole">' + ["manager", "viewer"].concat(meOwner ? ["admin"] : []).map(function(x, i) {
      return '<button class="btn ' + (i === 0 ? "primary" : "ghost") + '" data-r="' + x + '">' + esc(t("role_" + x)) + "</button>";
    }).join("") + '</div><p class="muted small" id="invHelp">' + esc(t("role_help_manager")) + "</p>" + chk("invMulti", t("inv_multi"), false) + '<button class="btn primary wide big" id="invGo">' + esc(t("inv_make")) + '</button><p class="muted small">' + esc(t("inv_note")) + "</p></div>");
    var role = "manager";
    $$("#invRole [data-r]", sh).forEach(function(b) {
      b.onclick = function() {
        role = b.dataset.r;
        $$("#invRole [data-r]", sh).forEach(function(x) {
          x.className = "btn " + (x === b ? "primary" : "ghost");
        });
        sh.querySelector("#invHelp").textContent = t("role_help_" + role);
      };
    });
    sh.querySelector("#invGo").onclick = async function() {
      try {
        var code2 = await rpc("crm_create_invite", { p_org: org, p_role: role, p_days: 7, p_max: sh.querySelector("#invMulti").checked ? 50 : 1 });
        await closeTop();
        await shareInvite(code2, role);
        window.__lastInvite = code2;
        done();
      } catch (e) {
        toast(errText(e));
      }
    };
  }
  function openMember(org, m, done) {
    var meOwner = ROLE() === "owner", locked = m.role === "owner" || m.user_id === AU.uid || !meOwner && m.role === "admin";
    var sh = openSheet(sheetHead(m.display_name || m.email) + '<div class="form"><p class="muted">' + esc(m.email || "") + "</p>" + (locked ? '<p class="note">' + esc(m.role === "owner" ? t("role_owner") : t("m_locked")) + "</p>" : '<div class="sub">' + esc(t("m_role")) + '</div><div class="col">' + ["manager", "viewer"].concat(meOwner ? ["admin"] : []).map(function(x) {
      return '<button class="btn ' + (m.role === x && m.status === "active" ? "primary" : "ghost") + '" data-setr="' + x + '">' + esc(t("role_" + x)) + " \u2014 " + esc(t("role_help_" + x)) + "</button>";
    }).join("") + '</div><button class="btn ghost wide" data-reset="1">' + esc(t("st_reset")) + '</button><div class="row2">' + (m.status === "blocked" ? '<button class="btn ghost" data-st="active">' + esc(t("unblock")) + "</button>" : '<button class="btn ghost" data-st="blocked">' + esc(t("block")) + "</button>") + '<button class="btn danger" data-del="1">' + esc(t("del")) + "</button></div>") + "</div>");
    var rs = sh.querySelector("[data-reset]");
    if (rs) rs.onclick = async function() {
      if (!await ask(t("st_reset_q", { n: m.display_name || m.email }), { ok: t("st_reset") })) return;
      try {
        var r = await staffFn({ action: "reset", user_id: m.user_id }, true);
        await closeTop();
        showCredentials(m.display_name || r.login, r.login, r.password, m.role);
      } catch (e) {
        toast(errText(e));
      }
    };
    var set = async function(role, status) {
      try {
        await rpc("crm_set_member", { p_org: org, p_user: m.user_id, p_role: role, p_status: status });
        toast(t("c_saved"));
      } catch (e) {
        toast(errText(e));
      }
      await closeTop();
      done();
    };
    $$("[data-setr]", sh).forEach(function(b) {
      b.onclick = function() {
        set(b.dataset.setr, "active");
      };
    });
    $$("[data-st]", sh).forEach(function(b) {
      b.onclick = function() {
        set(m.role === "owner" ? "manager" : m.role, b.dataset.st);
      };
    });
    var del = sh.querySelector("[data-del]");
    if (del) del.onclick = async function() {
      if (!await ask(t("m_del_q", { n: m.display_name || m.email }), { danger: true, ok: t("del") })) return;
      try {
        await rpc("crm_remove_member", { p_org: org, p_user: m.user_id });
        toast(t("c_deleted"));
      } catch (e) {
        toast(errText(e));
      }
      await closeTop();
      done();
    };
  }
  async function shareInvite(code2, role) {
    var link = inviteLink(code2);
    var text = link ? t("inv_text_link", { l: link, c: code2, o: AU.me && AU.me.org_name || "SavdEx" }) : t("inv_text", { c: code2, r: t("role_" + role), o: AU.me && AU.me.org_name || "SavdEx" });
    await copyText(text);
    if (NATIVE && PLUG.Share) {
      try {
        await PLUG.Share.share({ title: "Sotuvdesc", text, dialogTitle: t("inv_btn") });
        return;
      } catch (e) {
      }
    } else if (navigator.share && !/HeadlessChrome/.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: "Sotuvdesc", text });
        return;
      } catch (e) {
      }
    }
    toast(t("inv_copied", { c: code2 }));
  }
  var SY = { busy: false, state: "off", err: "", pulled: 0, timer: null, dels: [], again: false, hint: null };
  var MEM = { members: [], stages: [], pipelines: [] };
  function memberName(uid) {
    if (!uid) return "";
    var m = MEM.members.filter(function(x) {
      return x.user_id === uid;
    })[0];
    return m ? m.display_name || m.email : "";
  }
  async function storeMembers(rows) {
    MEM.members = rows || [];
    var tx = db.transaction("members", "readwrite"), s = tx.objectStore("members");
    s.clear();
    MEM.members.forEach(function(m) {
      var o = {};
      for (var k in m) o[k] = m[k];
      o.id = m.user_id;
      s.put(o);
    });
    await txDone(tx);
    var mine = MEM.members.filter(function(m) {
      return m.user_id === AU.uid;
    })[0];
    if (!mine && AU.uid && MEM.members.length && AU.me && AU.me.status === "active") {
      rtClose();
      await wipeLocal();
      saveMe({ status: "none", email: AU.me.email });
      showGate("join");
      throw new Error("inactive");
    }
    if (mine && AU.me && (mine.role !== AU.me.role || mine.status !== AU.me.status)) {
      var wasSeeAll = AU.me.role !== "manager";
      AU.me.role = mine.role;
      AU.me.status = mine.status;
      AU.me.display_name = mine.display_name;
      saveMe(AU.me);
      applyRoleUi();
      if (mine.status !== "active") {
        rtClose();
        if (mine.status === "blocked") await wipeLocal();
        showGate(mine.status === "blocked" ? "blocked" : "pending");
        return;
      }
      if (wasSeeAll && mine.role === "manager") metaSet("reconciled", 0);
    }
  }
  async function loadMemCache() {
    var tx = db.transaction(["members", "stages", "pipelines"]);
    var r = await Promise.all([reqP(tx.objectStore("members").getAll()), reqP(tx.objectStore("stages").getAll()), reqP(tx.objectStore("pipelines").getAll())]);
    MEM.members = r[0];
    MEM.stages = r[1].filter(function(x) {
      return !x.deleted;
    }).sort(function(a, b) {
      return a.sort - b.sort;
    });
    MEM.pipelines = r[2].filter(function(x) {
      return !x.deleted;
    }).sort(function(a, b) {
      return a.sort - b.sort;
    });
  }
  function queueDel(tbl, uid) {
    if (!uid) return;
    SY.dels.push({ tbl, uid });
    metaSet("dels", SY.dels);
  }
  function scheduleSync(ms, hint) {
    if (!syncOn()) return;
    if (hint) {
      SY.hint = SY.hint || /* @__PURE__ */ new Set();
      SY.hint.add(hint);
    } else SY.hint = null;
    clearTimeout(SY.timer);
    SY.timer = setTimeout(syncNow, ms == null ? 1500 : ms);
    syncBadge();
  }
  function toRemote(r, withId) {
    var ex = {};
    if (r.extra) for (var k in r.extra) ex[k] = r.extra[k];
    if (r.person) ex.person = r.person;
    if (r.comment) ex.comment = r.comment;
    if (r.basis) ex.basis = r.basis;
    if (r.alt && r.alt.length) ex.alt = r.alt;
    if (r.ch && r.ch.length) ex.ch = r.ch;
    if (r.cf && Object.keys(r.cf).length) ex.cf = r.cf;
    var o = { org_id: AU.me.org_id, name: r.name, country: r.country || null, city: r.city || null, address: r.address || null, website: r.website || null, email: r.email || null, phone: r.phone || null, inn: normInn(r.inn) || (r.inn || null), industry: r.industry || null, type: r.type || "company", lei: r.lei || null, ext_id: r.extId || null, source: r.source || null, status: STATUSES[r.status | 0], tags: r.tags || [], dnd: !!r.dnc, extra: ex, owner_id: r.ownerId || null, last_contact_at: r.lastTouch ? new Date(r.lastTouch).toISOString() : null, updated_by: myName() || null, deleted: false };
    if (withId) o.id = r.uid;
    return o;
  }
  var SYNC_SKIP = { org_id: 1, updated_by: 1, deleted: 1, id: 1 };
  function baseOf(r) {
    var o = toRemote(r), b = {};
    for (var k in o) if (!SYNC_SKIP[k]) b[k] = o[k];
    return JSON.parse(JSON.stringify(b));
  }
  function diffOf(r) {
    var o = toRemote(r), base = r.base, d = {}, n = 0;
    if (!base) return null;
    for (var k in o) if (!SYNC_SKIP[k] && JSON.stringify(o[k]) !== JSON.stringify(base[k] === void 0 ? null : base[k])) {
      d[k] = o[k];
      n++;
    }
    return n ? d : {};
  }
  var RESERVED = { person: 1, comment: 1, basis: 1, alt: 1, ch: 1, cf: 1 };
  function fromRemote(row, local) {
    var r = local || newRec({}), ex = row.extra || {}, rest = null;
    for (var k in ex) if (!RESERVED[k]) {
      rest = rest || {};
      rest[k] = typeof ex[k] === "object" ? JSON.stringify(ex[k]) : String(ex[k]);
    }
    r.uid = row.id;
    r.name = row.name || "";
    r.country = row.country || "";
    r.city = row.city || "";
    r.address = row.address || "";
    r.website = row.website || "";
    r.email = row.email || "";
    r.phone = row.phone || "";
    r.inn = row.inn || "";
    r.industry = row.industry || "";
    r.type = row.type === "gov" ? "gov" : "company";
    r.lei = row.lei || "";
    r.extId = row.ext_id || "";
    r.source = row.source || "";
    r.status = Math.max(0, STATUSES.indexOf(row.status));
    r.tags = row.tags || [];
    r.dnc = !!row.dnd;
    r.ownerId = row.owner_id || null;
    r.person = ex.person || "";
    r.comment = ex.comment || "";
    r.basis = ex.basis || r.basis || "public";
    r.alt = Array.isArray(ex.alt) ? ex.alt : [];
    r.ch = Array.isArray(ex.ch) ? ex.ch.filter(function(c) {
      return c && c.t && c.v;
    }) : [];
    r.cf = ex.cf && typeof ex.cf === "object" && !Array.isArray(ex.cf) ? ex.cf : {};
    r.extra = rest;
    var lc = Date.parse(row.last_contact_at) || 0;
    if (lc > (r.lastTouch || 0)) r.lastTouch = lc;
    r.createdAt = Date.parse(row.created_at) || r.createdAt || Date.now();
    r.updatedAt = Date.parse(row.updated_at) || Date.now();
    r.rts = row.updated_at;
    r.updatedBy = row.updated_by || row.created_by || "";
    return r;
  }
  function keysetQ(mark) {
    if (!mark) return "";
    return "&or=" + encodeURIComponent('(updated_at.gt."' + mark.ts + '",and(updated_at.eq."' + mark.ts + '",id.gt.' + mark.id + "))");
  }
  async function pullTable(tbl, metaKey, apply, opt) {
    opt = opt || {};
    var mark = opt.getMark ? opt.getMark() : await metaGet(metaKey), n = 0;
    for (; ; ) {
      var kq = opt.filter ? "&and=" + encodeURIComponent("(" + opt.filter + (mark ? ',or(updated_at.gt."' + mark.ts + '",and(updated_at.eq."' + mark.ts + '",id.gt.' + mark.id + "))" : "") + ")") : keysetQ(mark);
      var rows = await api("GET", tbl + "?select=*&order=updated_at.asc,id.asc&limit=1000" + kq);
      if (!rows || !rows.length) break;
      await apply(rows);
      var last = rows[rows.length - 1];
      mark = { ts: last.updated_at, id: last.id };
      if (opt.setMark) await opt.setMark(mark);
      else await metaSet(metaKey, mark);
      n += rows.length;
      if (opt.onPage) opt.onPage(n);
      if (tbl === "crm_companies") {
        SY.pulled = n;
        syncBadge();
        if (S.tab === "list" && n === 2e3) refreshList(true);
      }
      if (rows.length < 1e3) break;
    }
    return n;
  }
  async function applyCompanies(rows) {
    var s = db.transaction("companies").objectStore("companies").index("uid");
    var locals = await Promise.all(rows.map(function(row) {
      return reqP(s.get(row.id));
    }));
    var tx = db.transaction(["companies", "idx", "meta"], "readwrite"), cs = tx.objectStore("companies");
    rows.forEach(function(row, i) {
      var loc = locals[i];
      if (row.deleted) {
        if (loc) {
          cs.delete(loc.id);
          removeEntry(loc.id);
          DIRTYC.delete(loc.id);
        }
        return;
      }
      var local = null;
      if (loc && DIRTYC.has(loc.id)) {
        local = diffOf(loc);
        if (local === null) local = (loc.updatedAt || 0) > (Date.parse(row.updated_at) || 0) ? baseOf(loc) : {};
      }
      var r = fromRemote(row, loc), base = baseOf(r);
      if (local && Object.keys(local).length) {
        var merged = Object.assign({}, row, local);
        r = fromRemote(merged, r);
        r.base = base;
        DIRTYC.add(r.id || 0);
      } else {
        r.base = base;
        if (loc) DIRTYC.delete(loc.id);
      }
      if (!r.id) r.id = nextId++;
      if (local && Object.keys(local).length) DIRTYC.add(r.id);
      setKeys(r);
      cs.put(r);
      upsertEntry(entryOf(r));
    });
    DIRTYC.delete(0);
    flushIdx(tx);
    tx.objectStore("meta").put({ k: "dirtyC", v: Array.from(DIRTYC) });
    await txDone(tx);
  }
  async function cidByUid(uids) {
    var s = db.transaction("companies").objectStore("companies").index("uid"), m = /* @__PURE__ */ new Map();
    await Promise.all(uids.map(function(u) {
      return reqP(s.getKey(u)).then(function(k) {
        if (k != null) m.set(u, k);
      });
    }));
    return m;
  }
  function applyChild(store, map) {
    return async function(rows) {
      var cuids = uniq(rows.map(function(r) {
        return r.company_id;
      }).filter(Boolean));
      await catEnsure(cuids);
      var cm = await cidByUid(cuids);
      var ix = db.transaction(store).objectStore(store).index("uid");
      var locals = await Promise.all(rows.map(function(row) {
        return reqP(ix.get(row.id));
      }));
      var tx = db.transaction(store, "readwrite"), st = tx.objectStore(store), touched = [];
      rows.forEach(function(row, i) {
        var loc = locals[i], cid = row.company_id ? cm.get(row.company_id) : 0;
        if (row.deleted || cid == null) {
          if (loc) {
            st.delete(loc.id);
            touched.push(loc.cid);
          }
          return;
        }
        if (loc && loc.pend) return;
        var o = map(row, loc || {});
        o.uid = row.id;
        o.cid = cid || 0;
        o.pend = 0;
        o.synced = 1;
        if (loc) o.id = loc.id;
        st.put(o);
        touched.push(cid);
      });
      await txDone(tx);
      if (store === "tasks") {
        notifyLeadTasks(rows);
        var u = uniq(touched).filter(Boolean);
        for (var j = 0; j < u.length; j++) await recomputeDue(u[j]);
        scheduleReminders();
      }
      if (store === "touches") {
        var u2 = uniq(touched).filter(Boolean);
        for (var k = 0; k < u2.length; k++) await bumpLastTouch(u2[k], rows);
      }
    };
  }
  async function bumpLastTouch(cid, rows) {
    var r = await getCompany(cid);
    if (!r) return;
    var mx = 0;
    rows.forEach(function(x) {
      if (x.kind !== "note" && x.kind !== "status") {
        var ts = Date.parse(x.created_at) || 0;
        if (ts > mx) mx = ts;
      }
    });
    if (mx > (r.lastTouch || 0)) {
      r.lastTouch = mx;
      await putCompanies([r], null, false, true);
    }
  }
  var mapComment = function(row, o) {
    o.kind = KINDS.indexOf(row.kind) >= 0 || row.kind === "status" ? row.kind : "note";
    o.text = row.body || "";
    o.ts = Date.parse(row.created_at) || Date.now();
    o.author = row.author || "";
    o.authorId = row.author_id || "";
    o.dealId = row.deal_id || "";
    o.contactId = row.contact_id || "";
    o.outcome = row.outcome || "";
    return o;
  };
  var mapTask = function(row, o) {
    o.title = row.title || "";
    o.due = row.due || today();
    o.done = !!row.done;
    o.author = row.author || "";
    o.assignee = row.assignee || "";
    o.assigneeId = row.assignee_id || "";
    o.createdUid = row.created_uid || "";
    o.remindAt = Date.parse(row.remind_at) || 0;
    o.dealId = row.deal_id || "";
    o.createdAt = o.createdAt || Date.parse(row.created_at) || Date.now();
    return o;
  };
  var NET_ERR = function(e) {
    return e.status === 401 || /Failed to fetch|NetworkError|abort|no_session/i.test(String(e && e.message));
  };
  async function pushCompanies() {
    var ids = Array.from(DIRTYC), pushed = 0;
    for (var i = 0; i < ids.length; i += 500) {
      var s = db.transaction("companies").objectStore("companies");
      var recs = (await Promise.all(ids.slice(i, i + 500).map(function(id) {
        return reqP(s.get(id));
      }))).filter(Boolean);
      var fresh = [], back = [];
      for (var q = 0; q < recs.length; q++) {
        var r = recs[q];
        if (!canWrite(r)) {
          DIRTYC.delete(r.id);
          SY.rejected = (SY.rejected || 0) + 1;
          continue;
        }
        if (!r.rts) {
          fresh.push(r);
          continue;
        }
        var d = diffOf(r);
        if (d === null) d = baseOf(r);
        if (!Object.keys(d).length) {
          DIRTYC.delete(r.id);
          continue;
        }
        d.updated_by = myName() || null;
        try {
          var res = await api("PATCH", "crm_companies?id=eq." + r.uid, d, "return=representation");
          if (res && res[0]) back.push([r, res[0]]);
          else {
            DIRTYC.delete(r.id);
            SY.rejected = (SY.rejected || 0) + 1;
          }
        } catch (e) {
          if (NET_ERR(e)) throw e;
          SY.err = String(e.message || e);
          DIRTYC.delete(r.id);
          SY.rejected = (SY.rejected || 0) + 1;
        }
      }
      for (var f = 0; f < fresh.length; f += 200) {
        var part = fresh.slice(f, f + 200);
        var plain = part.filter(function(r3) {
          return !r3.extId && !r3.lei;
        }), keyed = part.filter(function(r3) {
          return r3.extId || r3.lei;
        });
        try {
          if (plain.length) {
            var res1 = await api("POST", "crm_companies?on_conflict=id", plain.map(function(r3) {
              return toRemote(r3, true);
            }), "resolution=ignore-duplicates,return=representation");
            var by1 = /* @__PURE__ */ new Map();
            (res1 || []).forEach(function(row) {
              by1.set(row.id, row);
            });
            plain.forEach(function(r3) {
              var row = by1.get(r3.uid);
              if (row) back.push([r3, row]);
              else keyed.push(r3);
            });
          }
          for (var kk = 0; kk < keyed.length; kk++) {
            var r2 = keyed[kk], col = r2.extId ? "ext_id" : r2.lei ? "lei" : "id", val = r2.extId || r2.lei || r2.uid;
            var ins = await api("POST", "crm_companies?on_conflict=" + col, [toRemote(r2, true)], "resolution=ignore-duplicates,return=representation");
            if (ins && ins[0]) {
              back.push([r2, ins[0]]);
              continue;
            }
            var ex = (await api("GET", "crm_companies?select=*&" + col + "=eq." + encodeURIComponent(val) + "&limit=1"))[0];
            if (!ex) {
              DIRTYC.delete(r2.id);
              SY.rejected = (SY.rejected || 0) + 1;
              continue;
            }
            var mine = toRemote(r2), fill = {}, nf = 0;
            ["name", "country", "city", "address", "website", "email", "phone", "inn", "industry", "lei", "ext_id", "source"].forEach(function(k) {
              if ((ex[k] == null || ex[k] === "") && mine[k]) {
                fill[k] = mine[k];
                nf++;
              }
            });
            var tg = uniq((ex.tags || []).concat(mine.tags || []));
            if (tg.length !== (ex.tags || []).length) {
              fill.tags = tg;
              nf++;
            }
            var exx = Object.assign({}, ex.extra || {}), addX = false;
            for (var xk in mine.extra) if (exx[xk] == null || exx[xk] === "") {
              exx[xk] = mine.extra[xk];
              addX = true;
            }
            if (addX) {
              fill.extra = exx;
              nf++;
            }
            if (nf) {
              fill.updated_by = myName() || null;
              var up = await api("PATCH", "crm_companies?id=eq." + ex.id, fill, "return=representation");
              if (up && up[0]) ex = up[0];
            }
            back.push([r2, ex, true]);
          }
        } catch (e) {
          if (NET_ERR(e)) throw e;
          SY.err = String(e.message || e);
          part.forEach(function(r3) {
            DIRTYC.delete(r3.id);
          });
        }
      }
      var tx = db.transaction(["companies", "idx", "meta"], "readwrite"), cs = tx.objectStore("companies");
      back.forEach(function(p) {
        var r3 = p[0], row = p[1];
        if (p[2]) {
          r3 = fromRemote(row, r3);
        }
        r3.uid = row.id;
        r3.rts = row.updated_at;
        r3.base = baseOf(fromRemote(row, JSON.parse(JSON.stringify(r3))));
        setKeys(r3);
        cs.put(r3);
        upsertEntry(entryOf(r3));
        DIRTYC.delete(r3.id);
        pushed++;
      });
      flushIdx(tx);
      tx.objectStore("meta").put({ k: "dirtyC", v: Array.from(DIRTYC) });
      await txDone(tx);
      syncBadge();
    }
    return pushed;
  }
  async function pushChildren(store, tbl, toRow2, patchFields) {
    var all = (await reqP(db.transaction(store).objectStore(store).getAll())).filter(function(x2) {
      return x2.pend;
    });
    if (!all.length) return;
    var cs = db.transaction("companies").objectStore("companies");
    var cos = await Promise.all(uniq(all.map(function(x2) {
      return x2.cid;
    }).filter(Boolean)).map(function(c) {
      return reqP(cs.get(c));
    }));
    var cu = /* @__PURE__ */ new Map();
    cos.forEach(function(c) {
      if (c) cu.set(c.id, c);
    });
    var ok = all.filter(function(x2) {
      if (!x2.cid) return true;
      var c = cu.get(x2.cid);
      return c && c.rts && !DIRTYC.has(c.id);
    });
    var fresh = ok.filter(function(x2) {
      return !x2.synced || !patchFields;
    }), old = patchFields ? ok.filter(function(x2) {
      return x2.synced;
    }) : [];
    var done = [];
    for (var i = 0; i < fresh.length; i += 500) {
      var part = fresh.slice(i, i + 500);
      try {
        await api("POST", tbl + "?on_conflict=id", part.map(function(x2) {
          return toRow2(x2, x2.cid ? cu.get(x2.cid).uid : null);
        }), "resolution=merge-duplicates,return=minimal");
        done = done.concat(part);
      } catch (e) {
        if (e.status === 401 || /Failed to fetch|NetworkError|abort/i.test(String(e.message))) throw e;
        part.forEach(function(x2) {
          x2.pend = 0;
          done.push(x2);
        });
        SY.err = String(e.message);
      }
    }
    for (var j = 0; j < old.length; j++) {
      var x = old[j], row = toRow2(x, x.cid ? cu.get(x.cid).uid : null), patch = {};
      patchFields.forEach(function(f) {
        patch[f] = row[f];
      });
      try {
        await api("PATCH", tbl + "?id=eq." + x.uid, patch, "return=minimal");
        done.push(x);
      } catch (e) {
        if (e.status === 401 || /Failed to fetch|NetworkError|abort/i.test(String(e.message))) throw e;
        x.pend = 0;
        done.push(x);
        SY.err = String(e.message);
      }
    }
    if (done.length) {
      var tx = db.transaction(store, "readwrite");
      done.forEach(function(x2) {
        x2.pend = 0;
        x2.synced = 1;
        tx.objectStore(store).put(x2);
      });
      await txDone(tx);
    }
  }
  var GEN = [
    { tbl: "crm_pipelines", store: "pipelines", mk: "pullP" },
    { tbl: "crm_stages", store: "stages", mk: "pullS" },
    { tbl: "crm_contacts", store: "contacts", mk: "pullCt" },
    { tbl: "crm_deals", store: "deals", mk: "pullD" },
    { tbl: "crm_plans", store: "plans", mk: "pullPl" },
    { tbl: "crm_products", store: "products", mk: "pullPr" },
    { tbl: "crm_org_settings", store: "org_settings", mk: "pullOs" },
    { tbl: "crm_quotes", store: "quotes", mk: "pullQ" },
    { tbl: "crm_goals", store: "goals", mk: "pullGo" },
    { tbl: "crm_scripts", store: "scripts", mk: "pullSc" },
    { tbl: "crm_files", store: "files", mk: "pullFi" }
  ];
  var SERVER_ONLY = { created_at: 1, updated_at: 1, created_uid: 1 };
  function genClean(o) {
    var r = {};
    for (var k in o) if (k.charAt(0) !== "_" && !SERVER_ONLY[k]) r[k] = o[k];
    return r;
  }
  async function genPut(store, rows) {
    var tx = db.transaction(store, "readwrite"), s = tx.objectStore(store);
    rows.forEach(function(o) {
      o._pend = 1;
      o.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      if (!o.org_id && AU.me) o.org_id = AU.me.org_id;
      s.put(o);
    });
    await txDone(tx);
    scheduleSync();
  }
  function genKeys(o) {
    var r = {};
    for (var k in o) if (k.charAt(0) !== "_" && !SERVER_ONLY[k] && k !== "id" && k !== "org_id") r[k] = o[k];
    return r;
  }
  function genDiff(o) {
    if (!o._base) return null;
    var d = {}, n = 0, cur = genKeys(o);
    for (var k in cur) if (JSON.stringify(cur[k]) !== JSON.stringify(o._base[k] === void 0 ? null : o._base[k])) {
      d[k] = cur[k];
      n++;
    }
    return n ? d : {};
  }
  function genApply(store) {
    return async function(rows) {
      if (store === "deals" || store === "contacts") await catEnsure(uniq(rows.map(function(r) {
        return r.company_id;
      }).filter(Boolean)));
      var s0 = db.transaction(store).objectStore(store);
      var locals = await Promise.all(rows.map(function(r) {
        return reqP(s0.get(r.id));
      }));
      var tx = db.transaction(store, "readwrite"), s = tx.objectStore(store);
      rows.forEach(function(row, i) {
        var loc = locals[i];
        if (row.deleted) {
          s.delete(row.id);
          return;
        }
        var out = Object.assign({}, row);
        out._synced = 1;
        out._base = JSON.parse(JSON.stringify(genKeys(row)));
        if (loc && loc._pend) {
          var d = genDiff(loc);
          if (d === null) d = Date.parse(loc.updated_at) > Date.parse(row.updated_at) ? genKeys(loc) : {};
          if (Object.keys(d).length) {
            Object.assign(out, d);
            out._pend = 1;
          }
        }
        s.put(out);
      });
      await txDone(tx);
    };
  }
  async function genPush(g) {
    var all = (await reqP(db.transaction(g.store).objectStore(g.store).getAll())).filter(function(x) {
      return x._pend;
    });
    if (g.store === "quotes") {
      var pendD = (await reqP(db.transaction("deals").objectStore("deals").getAll())).filter(function(d) {
        return d._pend && !d._synced;
      }).map(function(d) {
        return d.id;
      });
      all = all.filter(function(q) {
        return !q.deal_id || pendD.indexOf(q.deal_id) < 0;
      });
    }
    if (g.store === "deals" || g.store === "contacts") all = all.filter(function(x) {
      var cid = x.company_id ? UIDMAP.get(x.company_id) : null;
      return !cid || !DIRTYC.has(cid);
    });
    if (!all.length) return;
    var fresh = all.filter(function(x) {
      return !x._synced;
    }), old = all.filter(function(x) {
      return x._synced;
    }), done = [];
    if (fresh.length) {
      try {
        await api("POST", g.tbl + "?on_conflict=id", fresh.map(genClean), "resolution=merge-duplicates,return=minimal");
        done = done.concat(fresh);
      } catch (e) {
        if (NET_ERR(e)) throw e;
        SY.err = String(e.message);
        for (var i = 0; i < fresh.length; i++) {
          try {
            await api("POST", g.tbl + "?on_conflict=id", [genClean(fresh[i])], "resolution=merge-duplicates,return=minimal");
          } catch (e2) {
            console.warn("push skip", g.tbl, e2.message);
            SY.rejected = (SY.rejected || 0) + 1;
          }
          done.push(fresh[i]);
        }
      }
    }
    for (var j = 0; j < old.length; j++) {
      var p = genDiff(old[j]);
      if (p === null) {
        p = genClean(old[j]);
        delete p.org_id;
        delete p.id;
      }
      if (Object.keys(p).length) {
        try {
          var rr = await api("PATCH", g.tbl + "?id=eq." + old[j].id, p, "return=representation");
          if (!rr || !rr.length) SY.rejected = (SY.rejected || 0) + 1;
        } catch (e3) {
          if (NET_ERR(e3)) throw e3;
          SY.err = String(e3.message);
          SY.rejected = (SY.rejected || 0) + 1;
        }
      }
      done.push(old[j]);
    }
    var tx = db.transaction(g.store, "readwrite");
    done.forEach(function(x) {
      x._pend = 0;
      x._synced = 1;
      x._base = JSON.parse(JSON.stringify(genKeys(x)));
      tx.objectStore(g.store).put(x);
    });
    await txDone(tx);
  }
  async function pushDels() {
    var left = [];
    for (var i = 0; i < SY.dels.length; i++) {
      var d = SY.dels[i];
      try {
        await api("PATCH", d.tbl + "?id=eq." + encodeURIComponent(d.uid), d.tbl === "crm_companies" || d.tbl === "crm_deals" ? { deleted: true, updated_by: myName() || null } : { deleted: true }, "return=minimal");
      } catch (e) {
        if (!/HTTP 4/.test(String(e.message))) {
          left.push(d);
          continue;
        }
        SY.rejected = (SY.rejected || 0) + 1;
        if (d.tbl === "crm_companies") {
          try {
            var back = await api("GET", "crm_companies?select=*&id=eq." + d.uid);
            if (back && back.length) await applyCompanies(back);
          } catch (e2) {
          }
        }
      }
    }
    SY.dels = left;
    await metaSet("dels", left);
  }
  async function reconcileVisible() {
    if (ROLE() !== "manager" || await metaGet("reconciled")) return;
    var ids = /* @__PURE__ */ new Set(), last = null, wsq = catOn() ? "&or=" + encodeURIComponent("(" + catWsFilter().replace(/^or\(/, "").replace(/\)$/, "") + ")") : "";
    for (; ; ) {
      var rows = await api("GET", "crm_companies?select=id&deleted=eq.false&order=id.asc&limit=1000" + wsq + (last ? "&id=gt." + last : ""));
      rows.forEach(function(r) {
        ids.add(r.id);
      });
      if (rows.length < 1e3) break;
      last = rows[rows.length - 1].id;
    }
    var drop = [];
    await forEachRecord(null, function(r) {
      if (r.rts && r.uid && !ids.has(r.uid) && !DIRTYC.has(r.id) && catInWs(r)) drop.push(r.id);
    });
    if (drop.length) {
      var tx = db.transaction(["companies", "idx", "meta"], "readwrite");
      drop.forEach(function(id) {
        tx.objectStore("companies").delete(id);
        removeEntry(id);
      });
      flushIdx(tx);
      await txDone(tx);
    }
    await metaSet("reconciled", Date.now());
  }
  var CAT = { stats: null, cov: null, marks: null, keep: null, loaded: false, prog: null, screen: null, fac: {}, home: "UZ", big: 15e3, pruning: false };
  var CAT_MINE = 'status.neq.new,owner_id.not.is.null,created_by.is.null,created_by.not.in.(loader,"\u041B\u0438\u0430\u043D\u0430 (\u0438\u043C\u043F\u043E\u0440\u0442)")';
  var catOn = function() {
    return Array.isArray(S.settings.syncCountries);
  };
  var coKey = function(v) {
    var s = String(v == null ? "" : v).trim();
    return s ? countryCode(s) || s : "";
  };
  var catQ = function(v) {
    return '"' + String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  };
  var catMissing = function(e) {
    return !!e && (e.status === 404 || e.code === "PGRST202" || e.code === "42883");
  };
  var catMb = function(kb) {
    var v = kb / 1024;
    return v < 1 ? "<1" : v < 10 ? v.toFixed(1) : String(Math.round(v));
  };
  async function catLoad() {
    if (CAT.loaded) return;
    var m = await Promise.all([metaGet("catCov"), metaGet("catMarks"), metaGet("catKeep"), metaGet("catStats")]);
    CAT.cov = Array.isArray(m[0]) ? m[0] : null;
    CAT.marks = m[1] || {};
    CAT.keep = m[2] || [];
    if (m[3] && !CAT.stats) CAT.stats = m[3];
    CAT.loaded = true;
  }
  function catReset() {
    CAT.loaded = false;
    CAT.stats = null;
    CAT.cov = null;
    CAT.marks = null;
    CAT.keep = null;
    CAT.prog = null;
    CAT.fac = {};
  }
  function catNormStats(rows) {
    var by = /* @__PURE__ */ new Map();
    (rows || []).forEach(function(r) {
      var raw = r.country == null ? "" : String(r.country), k = coKey(raw), a = by.get(k);
      if (!a) {
        a = { k, raws: [], n: 0, kb: 0 };
        by.set(k, a);
      }
      if (a.raws.indexOf(raw) < 0) a.raws.push(raw);
      a.n += +r.n || 0;
      a.kb += +r.approx_kb || 0;
    });
    var out = [];
    by.forEach(function(a) {
      out.push(a);
    });
    return out;
  }
  async function catFetchStats() {
    var rows = await rpc("crm_country_stats");
    CAT.stats = catNormStats(rows);
    await metaSet("catStats", CAT.stats);
    return CAT.stats;
  }
  function catCountryParts(keys) {
    var vals = [], nul = false, st = CAT.stats || [];
    keys.forEach(function(k) {
      var s = st.filter(function(x) {
        return x.k === k;
      })[0], raws = s ? s.raws : [k];
      raws.forEach(function(r) {
        if (r === "") nul = true;
        else if (vals.indexOf(r) < 0) vals.push(r);
      });
    });
    var p = [];
    if (vals.length) p.push("country.in.(" + vals.map(catQ).join(",") + ")");
    if (nul) p.push("country.is.null");
    return p;
  }
  var catWsFilter = function() {
    return "or(" + catCountryParts(S.settings.syncCountries || []).concat(CAT_MINE).join(",") + ")";
  };
  async function catPrepare() {
    await catLoad();
    if (catOn()) {
      if (!Array.isArray(CAT.cov)) {
        CAT.cov = [];
        await metaSet("catCov", CAT.cov);
      }
      if (!CAT.stats) {
        try {
          await catFetchStats();
        } catch (e) {
          if (NET_ERR(e)) throw e;
        }
      }
      return true;
    }
    if (CAT.missingAt && Date.now() - CAT.missingAt < 6e5) return false;
    try {
      await catFetchStats();
    } catch (e) {
      if (NET_ERR(e) || e.status >= 500) throw e;
      CAT.missingAt = Date.now();
      return false;
    }
    var keys = CAT.stats.filter(function(x) {
      return x.k === CAT.home || x.n <= CAT.big;
    }).map(function(x) {
      return x.k;
    });
    if (keys.indexOf(CAT.home) < 0) keys.push(CAT.home);
    var hadLocal = IDX.length > 0;
    await catSetSel(keys);
    if (hadLocal) {
      S.settings.catIntro = "pending";
      await metaSet("settings", S.settings);
    }
    return true;
  }
  async function catSetSel(keys) {
    await catLoad();
    var first = !catOn(), had = first ? await metaGet("pullC") : null;
    S.settings.syncCountries = keys.slice();
    S.settings.catV = 1;
    await metaSet("settings", S.settings);
    CAT.cov = first ? had ? keys.slice() : [] : (CAT.cov || []).filter(function(k) {
      return keys.indexOf(k) >= 0;
    });
    if (first) CAT.marks = {};
    if (first && had) keys.forEach(function(k) {
      CAT.marks[k] = had;
    });
    Object.keys(CAT.marks).forEach(function(k) {
      if (keys.indexOf(k) < 0) delete CAT.marks[k];
    });
    await metaSet("catCov", CAT.cov);
    await metaSet("catMarks", CAT.marks);
    await metaSet("catPrune", 1);
  }
  var catSerial = function(fn) {
    var chain = Promise.resolve();
    return function(rows) {
      var p = chain.then(function() {
        return fn(rows);
      });
      chain = p.catch(function() {
      });
      return p;
    };
  };
  async function catSyncCompanies() {
    var on = await catPrepare();
    if (!on) {
      await pullTable("crm_companies", "pullC", applyCompanies);
      return;
    }
    if (await metaGet("catPrune")) {
      try {
        await catPrune(false);
      } catch (e) {
        if (!NET_ERR(e)) console.warn("prune", e);
      }
    }
    var sel = S.settings.syncCountries.slice(), apply = catSerial(applyCompanies);
    var done = sel.filter(function(k) {
      return CAT.cov.indexOf(k) >= 0;
    }), todo = sel.filter(function(k) {
      return CAT.cov.indexOf(k) < 0;
    });
    CAT.prog = null;
    var jobs = [pullTable("crm_companies", "pullC", apply, { filter: "or(" + CAT_MINE + ")" })].concat(done.map(function(k) {
      return catStream(k, apply, true);
    })), errs = [];
    await Promise.all(jobs.map(function(j) {
      return j.catch(function(e) {
        errs.push(e);
      });
    }));
    if (errs.length) throw errs[0];
    for (var i = 0; i < todo.length; i++) if (S.settings.syncCountries.indexOf(todo[i]) >= 0) await catStream(todo[i], apply, false);
    CAT.prog = null;
    catDrawProg();
  }
  async function catStream(k, apply, incremental) {
    var st = (CAT.stats || []).filter(function(x) {
      return x.k === k;
    })[0], pr = incremental ? null : CAT.prog = { k, done: 0, total: st ? st.n : 0 };
    var parts = catCountryParts([k]), flt = parts.length > 1 ? "or(" + parts.join(",") + ")" : parts[0];
    await pullTable("crm_companies", "", apply, {
      filter: flt,
      getMark: function() {
        return CAT.marks[k] || null;
      },
      setMark: function(m) {
        CAT.marks[k] = m;
        return metaSet("catMarks", CAT.marks);
      },
      onPage: function(n) {
        if (pr) {
          pr.done = n;
          catDrawProg();
        }
      }
    });
    if (!incremental && S.settings.syncCountries.indexOf(k) >= 0 && CAT.cov.indexOf(k) < 0) {
      CAT.cov.push(k);
      await metaSet("catCov", CAT.cov);
    }
  }
  function removeEntries(set) {
    if (!set.size) return;
    set.forEach(function(id) {
      BYID.delete(id);
      DIRTY.add(Math.floor(id / CH));
    });
    IDX = IDX.filter(function(e) {
      return !set.has(e.id);
    });
    DIRTY.forEach(function(c) {
      var arr = CHUNKS.get(c);
      if (arr) CHUNKS.set(c, arr.filter(function(e) {
        return !set.has(e.id);
      }));
    });
  }
  async function catMineIds() {
    var ids = /* @__PURE__ */ new Set(), last = null;
    for (; ; ) {
      var rows = await api("GET", "crm_companies?select=id&deleted=eq.false&or=" + encodeURIComponent("(" + CAT_MINE + ")") + "&order=id.asc&limit=1000" + (last ? "&id=gt." + last : ""));
      (rows || []).forEach(function(r) {
        ids.add(r.id);
      });
      if (!rows || rows.length < 1e3) break;
      last = rows[rows.length - 1].id;
    }
    return ids;
  }
  async function catRefs() {
    var tt = await Promise.all(["touches", "tasks", "deals", "contacts"].map(function(s) {
      return reqP(db.transaction(s).objectStore(s).getAll());
    }));
    var c = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set();
    tt[0].concat(tt[1]).forEach(function(x) {
      if (x.cid) c.add(x.cid);
    });
    tt[2].concat(tt[3]).forEach(function(x) {
      if (x.company_id && !x.deleted) u.add(x.company_id);
    });
    return { c, u };
  }
  async function catPrune(showBusy) {
    if (CAT.pruning || !catOn()) return 0;
    CAT.pruning = true;
    try {
      await catLoad();
      var sel = new Set(S.settings.syncCountries), outCode = /* @__PURE__ */ new Set(), cand = [];
      DICT.country.forEach(function(raw, i2) {
        if (!sel.has(coKey(raw))) outCode.add(i2);
      });
      for (var i = 0; i < IDX.length; i++) {
        var e = IDX[i];
        if (e.st === 0 && !e.ow && outCode.has(e.co) && !DIRTYC.has(e.id)) cand.push(e.id);
      }
      if (!cand.length) {
        await metaSet("catPrune", 0);
        return 0;
      }
      var mine = await catMineIds(), refs = await catRefs(), keep = new Set(CAT.keep || []), del = [];
      for (var j = 0; j < cand.length; j += 2e3) {
        var s = db.transaction("companies").objectStore("companies");
        var part = await Promise.all(cand.slice(j, j + 2e3).map(function(id) {
          return reqP(s.get(id));
        }));
        part.forEach(function(r) {
          if (r && r.rts && !DIRTYC.has(r.id) && !mine.has(r.uid) && !keep.has(r.uid) && !refs.u.has(r.uid) && !refs.c.has(r.id)) del.push(r.id);
        });
        if (showBusy) busy(t("working"), j / cand.length / 2);
        await sleep0();
      }
      if (CAT.hook) await CAT.hook();
      var gone = 0;
      for (var k = 0; k < del.length; k += 2e3) {
        var chunk = del.slice(k, k + 2e3), tx = db.transaction(["companies", "idx", "meta", "touches", "tasks"], "readwrite"), cs = tx.objectStore("companies"), ok = [], left = chunk.length;
        chunk.forEach(function(id) {
          var r = null, nt = 0, nk2 = 0, got = 0;
          var one = function() {
            if (++got < 3) return;
            var e2 = BYID.get(id);
            if (r && r.rts && !DIRTYC.has(id) && !r.pend && r.status === 0 && !r.ownerId && e2 && e2.st === 0 && !e2.ow && !nt && !nk2 && !keep.has(r.uid) && !refs.u.has(r.uid)) ok.push(id);
            if (--left === 0) {
              ok.forEach(function(x) {
                cs.delete(x);
              });
              removeEntries(new Set(ok));
              flushIdx(tx);
              gone += ok.length;
            }
          };
          cs.get(id).onsuccess = function() {
            r = this.result;
            one();
          };
          tx.objectStore("touches").index("cid").count(id).onsuccess = function() {
            nt = this.result;
            one();
          };
          tx.objectStore("tasks").index("cid").count(id).onsuccess = function() {
            nk2 = this.result;
            one();
          };
        });
        await txDone(tx);
        if (showBusy) busy(t("working"), 0.5 + k / del.length / 2);
        await sleep0();
      }
      await metaSet("catPrune", 0);
      if (gone) await buildUidMap();
      return gone;
    } finally {
      CAT.pruning = false;
      if (showBusy) busy(null);
    }
  }
  async function catEnsure(uids) {
    if (!catOn() || !uids.length) return;
    uids = uids.filter(function(u) {
      return /^[0-9a-f-]{36}$/i.test(u);
    });
    var have = await cidByUid(uids), miss = uids.filter(function(u) {
      return !have.has(u);
    });
    for (var i = 0; i < miss.length; i += 60) {
      var rows = await api("GET", "crm_companies?select=*&id=in.(" + miss.slice(i, i + 60).join(",") + ")");
      if (rows && rows.length) await applyCompanies(rows);
    }
  }
  function catRtOk(d) {
    if (!d || d.table !== "crm_companies" || !catOn() || (d.eventType || d.type) === "DELETE") return true;
    var r = d.new || d.record;
    if (!r || r.country === void 0) return true;
    if (new Set(S.settings.syncCountries).has(coKey(r.country))) return true;
    if (r.status !== "new" || r.owner_id || r.created_by == null || r.created_by !== "loader" && r.created_by !== "\u041B\u0438\u0430\u043D\u0430 (\u0438\u043C\u043F\u043E\u0440\u0442)") return true;
    return UIDMAP.has(r.id);
  }
  async function catKeepAdd(uid) {
    await catLoad();
    CAT.keep = (CAT.keep || []).filter(function(u) {
      return u !== uid;
    });
    CAT.keep.push(uid);
    if (CAT.keep.length > 300) CAT.keep = CAT.keep.slice(-300);
    await metaSet("catKeep", CAT.keep);
  }
  var catInWs = function(r) {
    return !catOn() || r.status > 0 || !!r.ownerId || new Set(S.settings.syncCountries).has(coKey(r.country));
  };
  function catPending() {
    return catOn() && CAT.cov ? S.settings.syncCountries.filter(function(k) {
      return CAT.cov.indexOf(k) < 0;
    }) : [];
  }
  function catDrawProg() {
    var el = document.getElementById("catProg");
    if (!el) return;
    var p = CAT.prog, pend = catPending();
    if (p) {
      var tot = Math.max(p.total, p.done);
      el.hidden = false;
      el.querySelector("span").textContent = t("cat_progress", { c: countryName(p.k) || t("cat_none_country"), a: num(p.done), b: num(tot) });
      el.querySelector("i").style.width = Math.round((tot ? p.done / tot : 0) * 100) + "%";
    } else if (pend.length && SY.busy) {
      el.hidden = false;
      el.querySelector("span").textContent = t("sync_run");
      el.querySelector("i").style.width = "5%";
    } else if (S.settings.syncCountries && !pend.length) {
      el.hidden = false;
      el.querySelector("span").textContent = t("cat_progress_done");
      el.querySelector("i").style.width = "100%";
    } else el.hidden = true;
  }
  function catAfterSync() {
    catDrawProg();
    if (CAT.screen && CAT.screen.sh.isConnected) catScreenTotals();
    if (S.settings.catIntro === "pending" && SY.state === "ok" && !STACK.length) {
      S.settings.catIntro = "shown";
      metaSet("settings", S.settings);
      catIntroShow();
    }
  }
  function catIntroShow() {
    var sh = openSheet('<div class="dlg"><h3>' + esc(t("cat_upd_title")) + "</h3><p>" + esc(t("cat_upd_text")) + '</p><div class="col"><button class="btn primary" data-cat="introPick">' + esc(t("cat_upd_pick")) + '</button><button class="btn ghost" data-cat="introOk">' + esc(t("cat_upd_ok")) + "</button></div></div>");
    window.__catIntro = 1;
    return sh;
  }
  async function openCatCountries() {
    if (!syncOn()) return;
    var sh = openSheet(sheetHead(t("cat_title")) + '<div class="form" id="catBody"><p class="muted">' + esc(t("loading")) + "</p></div>", { full: true, onClose: function() {
      CAT.screen = null;
    } });
    await catLoad();
    var sc = CAT.screen = { sh, draft: null, stale: false, missing: false };
    try {
      await catFetchStats();
    } catch (e) {
      if (catMissing(e)) sc.missing = true;
      else sc.stale = true;
    }
    if (!sh.isConnected) return;
    sc.draft = new Set(catOn() ? S.settings.syncCountries : (CAT.stats || []).filter(function(x) {
      return x.k === CAT.home || x.n <= CAT.big;
    }).map(function(x) {
      return x.k;
    }));
    catScreenDraw();
  }
  var catName = function(k) {
    return k ? countryName(k) : t("cat_none_country");
  };
  function catScreenDraw() {
    var sc = CAT.screen;
    if (!sc) return;
    var body = sc.sh.querySelector("#catBody"), st = CAT.stats;
    if (sc.missing || !st || !st.length) {
      body.innerHTML = '<p class="note">' + esc(t(sc.missing ? "cat_server_old" : navigator.onLine === false || sc.stale ? "cat_need_net" : "cat_no_stats")) + '</p><button class="btn ghost" data-cat="retry">' + esc(t("cat_retry")) + "</button>";
      return;
    }
    var rows = st.slice().sort(function(a, b) {
      return a.k && b.k ? countryCmp(a.k, b.k) : a.k ? -1 : 1;
    });
    var sel = new Set(catOn() ? S.settings.syncCountries : []);
    body.innerHTML = '<p class="note">' + esc(t("cat_intro_note")) + "</p>" + (sc.stale ? '<p class="muted small">' + esc(t("cat_need_net")) + "</p>" : "") + '<div class="catlist">' + rows.map(function(x) {
      return '<label class="catc"><input type="checkbox" role="switch" data-cat="tog" data-k="' + esc(x.k) + '"' + (sc.draft.has(x.k) ? " checked" : "") + '><span class="catc-t"><b>' + esc(catName(x.k)) + "</b><small>" + esc(t("cat_row", { n: num(x.n), mb: catMb(x.kb) })) + '</small><em class="catbig" data-big="' + esc(x.k) + '"' + (x.n > CAT.big && sc.draft.has(x.k) && !sel.has(x.k) ? "" : " hidden") + ">" + esc(t("cat_big")) + "</em></span></label>";
    }).join("") + '</div><p class="cattotal" id="catTotal" role="status"></p><p class="muted small" id="catMine" hidden></p><div class="catprog" id="catProg" hidden><span></span><div class="pbar"><i></i></div></div><button class="btn primary wide big" id="catApply" data-cat="apply">' + esc(t("cat_apply")) + "</button>";
    catScreenTotals();
    catDrawProg();
  }
  function catEstimate(draft) {
    var n = 0, kb = 0, tn = 0, tkb = 0;
    (CAT.stats || []).forEach(function(x) {
      tn += x.n;
      tkb += x.kb;
      if (draft.has(x.k)) {
        n += x.n;
        kb += x.kb;
      }
    });
    var out = /* @__PURE__ */ new Set();
    DICT.country.forEach(function(raw, i2) {
      if (!draft.has(coKey(raw))) out.add(i2);
    });
    var mine = 0;
    for (var i = 0; i < IDX.length; i++) {
      var e = IDX[i];
      if ((e.st > 0 || e.ow) && out.has(e.co)) mine++;
    }
    return { n: n + mine, kb: kb + mine * (tn ? tkb / tn : 0.6), mine };
  }
  function catScreenTotals() {
    var sc = CAT.screen;
    if (!sc || !sc.draft) return;
    var tot = sc.sh.querySelector("#catTotal");
    if (!tot) return;
    var est = catEstimate(sc.draft), sel = new Set(catOn() ? S.settings.syncCountries : []);
    tot.textContent = t("cat_total", { n: num(est.n), mb: catMb(est.kb) });
    var mn = sc.sh.querySelector("#catMine");
    mn.hidden = !est.mine;
    mn.textContent = est.mine ? t("cat_mine_note", { n: num(est.mine) }) : "";
    $$("[data-big]", sc.sh).forEach(function(el) {
      var k = el.dataset.big, x = (CAT.stats || []).filter(function(s) {
        return s.k === k;
      })[0];
      el.hidden = !(x && x.n > CAT.big && sc.draft.has(k) && !sel.has(k));
    });
    var same = sc.draft.size === sel.size && Array.from(sc.draft).every(function(k) {
      return sel.has(k);
    });
    sc.sh.querySelector("#catApply").disabled = catOn() && same;
  }
  async function catApply() {
    var sc = CAT.screen;
    if (!sc || !sc.draft) return;
    if (navigator.onLine === false) {
      toast(t("cat_offline_apply"));
      return;
    }
    var old = new Set(catOn() ? S.settings.syncCountries : []), keys = Array.from(sc.draft);
    var removed = Array.from(old).filter(function(k) {
      return !sc.draft.has(k);
    });
    if (removed.length && !await ask(t("cat_remove_q", { c: removed.map(catName).join(", ") }), { ok: t("cat_remove_ok"), danger: true })) return;
    await catSetSel(keys);
    var n = 0;
    if (removed.length || !old.size) {
      try {
        n = await catPrune(true);
      } catch (e) {
        toast(NET_ERR(e) ? t("cat_offline_apply") : t("err", { e: e.message || e }));
      }
    }
    if (removed.length && n) toast(t("cat_removed", { n: num(n) }));
    refreshList(true);
    scheduleSync(0);
    if (CAT.screen) {
      catScreenDraw();
    }
  }
  function catInit() {
    var nores = $("#nores");
    if (nores && !$("#catBar")) {
      var bar = document.createElement("div");
      bar.id = "catBar";
      bar.className = "catbar";
      bar.hidden = true;
      bar.innerHTML = '<span></span><button class="btn small primary" type="button" data-cat="search"></button>';
      nores.insertAdjacentElement("afterend", bar);
    }
    document.addEventListener("click", function(ev) {
      var el = ev.target.closest && ev.target.closest("[data-cat]");
      if (!el) return;
      var a = el.dataset.cat;
      if (a === "search") return openCatalog(S.q);
      if (a === "searchq") return closeTop().then(function() {
        return openCatalog(el.dataset.q);
      });
      if (a === "countries") return openCatCountries();
      if (a === "introOk") return closeTop();
      if (a === "introPick") return closeTop().then(openCatCountries);
      var sc = CAT.screen;
      if (a === "retry" && sc) {
        sc.sh.querySelector("#catBody").innerHTML = '<p class="muted">' + esc(t("loading")) + "</p>";
        catFetchStats().then(function() {
          sc.missing = sc.stale = false;
          if (!sc.draft) sc.draft = new Set(catOn() ? S.settings.syncCountries : (CAT.stats || []).filter(function(x) {
            return x.k === CAT.home || x.n <= CAT.big;
          }).map(function(x) {
            return x.k;
          }));
          catScreenDraw();
        }, function(e) {
          sc.missing = catMissing(e);
          sc.stale = !sc.missing;
          catScreenDraw();
        });
        return;
      }
      if (a === "apply") return catApply().catch(function(e) {
        busy(null);
        toast(t("err", { e: e.message || e }));
      });
    });
    document.addEventListener("change", function(ev) {
      var el = ev.target;
      if (!el || !el.dataset || el.dataset.cat !== "tog" || !CAT.screen) return;
      if (el.checked) CAT.screen.draft.add(el.dataset.k);
      else CAT.screen.draft.delete(el.dataset.k);
      catScreenTotals();
    });
  }
  function catBarUpdate(n) {
    var bar = $("#catBar");
    if (!bar) return;
    var show = syncOn() && catOn() && (S.q || "").length >= 2;
    bar.hidden = !show;
    if (!show) return;
    bar.querySelector("span").textContent = t(n ? "cat_bar_hint" : "cat_bar_zero");
    bar.querySelector("button").textContent = t("cat_all_btn");
  }
  function catCallLabel() {
    var b = $("#btnCall");
    if (b) {
      b.querySelector("span").textContent = t("cat_call_btn");
      b.setAttribute("aria-label", t("cat_call_btn"));
    }
  }
  function catRaw(k) {
    return k;
  }
  async function openCatalog(q0, pre) {
    if (!syncOn()) return;
    await catLoad();
    if (!UIDMAP.size) await buildUidMap();
    var CS = { q: (q0 || "").trim(), country: "", industry: "", city: "", rows: [], more: false, loading: false, err: "", done: false, seq: 0 };
    var sh = openSheet(sheetHead(t("cat_search_title")) + '<div class="form catform"><input class="inp" id="cQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="' + esc(t("cat_q_ph")) + '" value="' + esc(CS.q) + '"><div class="row2"><select id="cC" aria-label="' + esc(t("cat_country")) + '"></select><select id="cI" aria-label="' + esc(t("cat_industry")) + '"></select></div><select id="cCity" aria-label="' + esc(t("cat_city")) + '"></select><button class="btn primary" type="button" id="cGo">' + esc(t("cat_find")) + '</button><div id="cRes" class="catres" aria-live="polite"></div></div>', { full: true });
    var $c = function(s) {
      return sh.querySelector(s);
    };
    var fillCountries = function() {
      $c("#cC").innerHTML = '<option value="">' + esc(t("cat_all_countries")) + "</option>" + (CAT.stats || []).slice().sort(function(a, b) {
        return a.k && b.k ? countryCmp(a.k, b.k) : a.k ? -1 : 1;
      }).map(function(x) {
        return '<option value="' + esc(x.k) + '">' + esc(catName(x.k)) + " (" + num(x.n) + ")</option>";
      }).join("");
    };
    var fillFacets = function(f) {
      var opt = function(arr, all) {
        return '<option value="">' + esc(all) + "</option>" + arr.map(function(x) {
          return '<option value="' + esc(x.v) + '">' + esc(x.v) + " (" + num(x.n) + ")</option>";
        }).join("");
      };
      $c("#cI").innerHTML = opt(f ? f.industry : [], t("cat_all_ind"));
      $c("#cCity").innerHTML = opt(f ? f.city : [], t("cat_all_city"));
      $c("#cI").disabled = $c("#cCity").disabled = !f;
    };
    fillCountries();
    fillFacets(null);
    if (!CAT.stats && navigator.onLine !== false) catFetchStats().then(function() {
      if (sh.isConnected) fillCountries();
    }, function() {
    });
    var go = function() {
      CS.q = $c("#cQ").value.trim();
      CS.rows = [];
      CS.more = false;
      catRun(CS, false, sh);
    };
    $c("#cGo").onclick = go;
    $c("#cQ").addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        go();
      }
    });
    $c("#cC").onchange = async function() {
      CS.country = this.value;
      CS.industry = CS.city = "";
      fillFacets(null);
      if (CS.country) {
        var key = catRaw(CS.country), f = CAT.fac[key];
        if (!f && navigator.onLine !== false) {
          try {
            var rows = await rpc("crm_catalog_facets", { p_country: key }) || [];
            f = CAT.fac[key] = { industry: rows.filter(function(x) {
              return /^ind/i.test(x.kind);
            }), city: rows.filter(function(x) {
              return /^cit/i.test(x.kind);
            }) };
          } catch (e) {
            f = null;
          }
        }
        if (CS.country === this.value) fillFacets(f);
      }
      go();
    };
    $c("#cI").onchange = function() {
      CS.industry = this.value;
      go();
    };
    $c("#cCity").onchange = function() {
      CS.city = this.value;
      go();
    };
    $c("#cRes").onclick = function(ev) {
      var more = ev.target.closest("[data-cmore]");
      if (more) return catRun(CS, true, sh);
      var retry = ev.target.closest("[data-cretry]");
      if (retry) return catRun(CS, CS.rows.length > 0 && retry.dataset.cretry === "more", sh);
      var row = ev.target.closest("[data-ci]");
      if (row) catOpen(CS.rows[+row.dataset.ci]);
    };
    sh._cs = CS;
    catDrawRes(CS, sh);
    if (pre && pre.country && Array.from($c("#cC").options).some(function(o) {
      return o.value === pre.country;
    })) {
      $c("#cC").value = pre.country;
      $c("#cC").onchange();
      return;
    }
    if (CS.q) go();
    else setTimeout(function() {
      $c("#cQ").focus();
    }, 60);
  }
  async function catRun(CS, more, sh) {
    var my = ++CS.seq;
    if (!more) {
      CS.rows = [];
      CS.more = false;
    }
    CS.err = "";
    CS.done = false;
    if ((CS.q || "").length === 1) {
      CS.err = "short";
      catDrawRes(CS, sh);
      return;
    }
    if (navigator.onLine === false) {
      CS.err = "offline";
      catDrawRes(CS, sh);
      return;
    }
    CS.loading = true;
    catDrawRes(CS, sh);
    var a = { p_q: CS.q || "", p_limit: 50 };
    if (CS.country) a.p_country = catRaw(CS.country);
    if (CS.industry) a.p_industry = CS.industry;
    if (CS.city) a.p_city = CS.city;
    if (more && CS.rows.length) {
      var l = CS.rows[CS.rows.length - 1];
      a.p_after_name = l.name || "";
      a.p_after_id = l.id;
    }
    try {
      var rows = await rpc("crm_company_search", a);
      if (my !== CS.seq) return;
      rows = rows || [];
      CS.rows = more ? CS.rows.concat(rows) : rows;
      CS.more = rows.length >= 50;
      CS.done = true;
    } catch (e) {
      if (my !== CS.seq) return;
      CS.err = NET_ERR(e) && e.status !== 401 || navigator.onLine === false ? "offline" : catMissing(e) ? "old" : "err";
      CS.more = more;
    }
    CS.loading = false;
    catDrawRes(CS, sh);
  }
  function catDrawRes(CS, sh) {
    var el = sh.querySelector("#cRes");
    if (!el) return;
    var h = "";
    if (CS.rows.length) {
      h += '<p class="muted small">' + esc(t("cat_found_n", { n: num(CS.rows.length) })) + "</p>" + CS.rows.map(function(r, i) {
        var local = UIDMAP.has(r.id), sub = [r.city, r.industry, r.phone].filter(Boolean).join(" \xB7 ");
        return '<button type="button" class="catr" data-ci="' + i + '"><span class="catr-m"><b>' + esc(r.name) + "</b><small>" + esc(sub) + '</small></span><i class="cattag' + (local ? " on" : "") + '">' + esc(local ? t("cat_on_phone") : r.country ? t("cat_tag", { c: countryName(r.country) }) : t("cat_search_title")) + "</i></button>";
      }).join("");
    }
    if (CS.loading) h += '<p class="muted" role="status">' + esc(t("cat_loading")) + "</p>";
    else if (CS.err) h += '<div class="note" role="alert">' + esc(t(CS.err === "offline" ? "cat_offline" : CS.err === "old" ? "cat_old" : CS.err === "short" ? "cat_q_short" : "cat_err")) + "</div>" + (CS.err === "old" || CS.err === "short" ? "" : '<button class="btn ghost" type="button" data-cretry="' + (CS.rows.length ? "more" : "first") + '">' + esc(t("cat_retry")) + "</button>");
    else if (CS.done && !CS.rows.length) h += '<p class="note">' + esc(t("cat_none")) + "</p>";
    else if (!CS.done && !CS.rows.length) h += '<p class="muted">' + esc(t("cat_hint")) + "</p>";
    if (CS.more && !CS.loading && !CS.err) h += '<button class="btn ghost wide" type="button" data-cmore="1">' + esc(t("cat_more")) + "</button>";
    el.innerHTML = h;
  }
  async function catRemoteFind(v, withName) {
    try {
      var d = normPhone(v.phone), dom = domainOf(v.website), cc = countryCode(v.country);
      var ask1 = async function(q, extra) {
        var a = Object.assign({ p_q: q, p_limit: 5 }, extra || {});
        return await rpc("crm_company_search", a) || [];
      };
      if (d && d.length >= 7) {
        var r1 = await ask1(d);
        if (r1.length) return r1[0];
      }
      if (dom && dom.indexOf(".") > 0 && !GENERIC_HOSTS[dom]) {
        var r2 = await ask1(dom);
        if (r2.length) return r2[0];
      }
      var nn = normName(v.name);
      if (withName && nn.length >= 3) {
        var r3 = await ask1(String(v.name).trim(), cc ? { p_country: cc, p_limit: 20 } : { p_limit: 20 }), ck = cityKey(v.city);
        for (var i = 0; i < r3.length; i++) if (normName(r3[i].name) === nn && (!ck || !r3[i].city || cityKey(r3[i].city) === ck)) return r3[i];
      }
    } catch (e) {
    }
    return null;
  }
  async function catImportCheck(plan, el) {
    if (!el) return;
    if (!catOn() || !syncOn()) {
      el.remove();
      return;
    }
    if (navigator.onLine === false) {
      el.textContent = t("cat_checked_local");
      return;
    }
    el.textContent = t("cat_imp_remote_run");
    var list = Array.from(plan.add.values()).filter(function(c) {
      return normPhone(c.phone) || domainOf(c.website);
    }).slice(0, 200), hit = 0, i = 0;
    var worker = async function() {
      while (i < list.length) {
        var c = list[i++];
        if (await catRemoteFind(c, false)) hit++;
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (el.isConnected) el.textContent = t("cat_imp_remote_n", { a: num(list.length), b: num(hit) });
  }
  async function catOpen(row) {
    if (!row) return;
    try {
      await applyCompanies([row]);
      var m = await cidByUid([row.id]), cid = m.get(row.id);
      if (cid == null) {
        toast(t("cat_open_fail"));
        return;
      }
      UIDMAP.set(row.id, cid);
      await catKeepAdd(row.id);
      toast(t("cat_saved_local"));
      return openCard(cid);
    } catch (e) {
      toast(NET_ERR(e) ? t("cat_offline") : t("cat_open_fail"));
    }
  }
  ICO.clock = '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-13h-2v6l5 3 1-1.6-4-2.4z"/>';
  var viewsSave = function() {
    return metaSet("settings", S.settings);
  };
  var viewObj = function(id) {
    return S.segments.filter(function(z) {
      return z.id === id;
    })[0];
  };
  var viewFull = function(v) {
    return Object.assign(F0(), v.F || {});
  };
  var viewActive = function(v) {
    return JSON.stringify(viewFull(v)) === JSON.stringify(F) && (v.q || "") === (S.q || "") && (v.sort || "upd") === S.sort;
  };
  var vcTimer;
  function viewCounts() {
    clearTimeout(vcTimer);
    vcTimer = setTimeout(function() {
      $$("#segChips .segchip[data-id]").forEach(function(b) {
        var v = viewObj(b.dataset.id), c = b.querySelector(".vc");
        if (v && c) c.textContent = num(applyFilter(viewFull(v), v.q || "", true));
      });
    }, 250);
  }
  async function viewSave() {
    var nm = await ask(t("cat_view_name"), { input: "", ok: t("save") });
    nm = nm && nm.trim();
    if (!nm) return;
    if (S.segments.some(function(v) {
      return v.name.toLowerCase() === nm.toLowerCase();
    })) {
      toast(t("cat_view_dup"));
      return;
    }
    S.segments.push({ id: "s" + Date.now(), name: nm.slice(0, 60), F: Object.assign({}, F), q: S.q, sort: S.sort });
    await viewsSave();
    toast(t("cat_view_saved"));
    renderSegChips();
  }
  async function viewMenu(id) {
    var v = viewObj(id);
    if (!v) return;
    var ch = await choose(t("cat_view_menu", { n: v.name }), [["call", t("cat_view_call"), "primary"], ["rename", t("cat_view_rename"), "ghost"], ["del", t("cat_view_delete"), "danger"], ["x", t("cancel"), "ghost"]]);
    if (ch === "call") {
      F = viewFull(v);
      S.q = v.q || "";
      S.sort = v.sort || "upd";
      $("#sort").value = S.sort;
      $("#q").value = S.q;
      refreshList();
      return cqStart();
    }
    if (ch === "rename") {
      var nm = await ask(t("cat_view_name"), { input: v.name, ok: t("save") });
      nm = nm && nm.trim();
      if (!nm || nm === v.name) return;
      if (S.segments.some(function(z) {
        return z !== v && z.name.toLowerCase() === nm.toLowerCase();
      })) {
        toast(t("cat_view_dup"));
        return;
      }
      v.name = nm.slice(0, 60);
      await viewsSave();
      toast(t("cat_view_renamed"));
      renderSegChips();
    }
    if (ch === "del" && await ask(t("cat_view_del_q", { n: v.name }), { danger: true, ok: t("del") })) {
      S.segments = S.segments.filter(function(z) {
        return z !== v;
      });
      await viewsSave();
      toast(t("cat_view_deleted"));
      renderSegChips();
    }
  }
  var snzBtn = function(x) {
    return '<button class="icbtn small snz" type="button" data-cat="snooze" data-tid="' + x.id + '" aria-label="' + esc(t("cat_snz")) + '" title="' + esc(t("cat_snz")) + '">' + ico("clock") + "</button>";
  };
  async function taskPatch(id, patch) {
    var tx = db.transaction("tasks", "readwrite"), st = tx.objectStore("tasks"), x = await reqP(st.get(id));
    if (!x) return null;
    Object.assign(x, patch);
    x.pend = 1;
    st.put(x);
    await txDone(tx);
    await recomputeDue(x.cid);
    scheduleReminders();
    scheduleSync();
    if (S.tab === "today") renderToday();
    var top = STACK.length ? STACK[STACK.length - 1].firstChild : null;
    if (top && top._rec && top._rec.id) renderCard(top, top._rec.id);
    return x;
  }
  async function catSnooze(tid) {
    var x = await reqP(db.transaction("tasks").objectStore("tasks").get(tid));
    if (!x || x.done) return;
    var ch = await choose(t("cat_snz_q", { n: x.title }), [["1h", t("cat_snz_1h"), "primary"], ["tom", t("cat_snz_tom"), "ghost"], ["3d", t("cat_snz_3d"), "ghost"], ["x", t("cancel"), "ghost"]]);
    if (!ch || ch === "x") return;
    var old = { due: x.due, remindAt: x.remindAt || 0 }, due, rem;
    if (ch === "1h") {
      rem = Date.now() + 36e5;
      due = ymd(new Date(rem));
    } else {
      due = addDays(today(), ch === "tom" ? 1 : 3);
      rem = (/* @__PURE__ */ new Date(due + "T09:00:00")).getTime();
    }
    await taskPatch(tid, { due, remindAt: rem });
    toast(t("cat_snz_done", { d: fmtTs(rem) }), t("undo"), function() {
      taskPatch(tid, old);
    });
  }
  var CQ = { q: null, sh: null };
  async function cqLoad() {
    if (CQ.q === null) CQ.q = await metaGet("callq") || false;
    return CQ.q;
  }
  var cqSave = function() {
    return metaSet("callq", CQ.q || null);
  };
  var cqLeft = function() {
    return CQ.q && CQ.q.i < CQ.q.ids.length;
  };
  function cqBuild() {
    var ids = [], dn = 0, np = 0, act = S.segments.filter(viewActive)[0];
    for (var i = 0; i < RESULT.length && ids.length < 2e3; i++) {
      var e = RESULT[i];
      if (e.f & F_DNC) {
        dn++;
        continue;
      }
      if (!(e.f & F_PHONE)) {
        np++;
        continue;
      }
      ids.push(e.id);
    }
    return { ids, i: 0, total: ids.length, done: 0, skipped: 0, dnc: dn, nophone: np, ts: Date.now(), name: act ? act.name : "" };
  }
  async function cqStart() {
    if (!db) return;
    await cqLoad();
    if (cqLeft()) {
      var ch = await choose(t("cat_call_resume_q", { n: CQ.q.i + 1, m: CQ.q.total }), [["go", t("cat_call_resume"), "primary"], ["new", t("cat_call_new"), "ghost"], ["x", t("cancel"), "ghost"]]);
      if (ch === "go") return cqOpen();
      if (ch !== "new") return;
    }
    var q = cqBuild();
    if (!q.ids.length) {
      toast(t("cat_call_none"));
      return;
    }
    CQ.q = q;
    await cqSave();
    cqOpen();
  }
  function cqOpen() {
    if (CQ.sh && CQ.sh.isConnected) return;
    var sh = openSheet(sheetHead(t("cat_call_title")) + '<div class="form cq" id="cqBody"></div>', { full: true, onClose: function() {
      CQ.sh = null;
      refreshList(true);
    } });
    CQ.sh = sh;
    cqDraw();
  }
  async function cqEnd() {
    CQ.q = false;
    await cqSave();
    callBarUpdate();
  }
  async function cqDraw() {
    var sh = CQ.sh, q = CQ.q;
    if (!sh || !sh.isConnected || !q) return;
    var body = sh.querySelector("#cqBody"), e;
    while (q.i < q.ids.length) {
      e = BYID.get(q.ids[q.i]);
      if (e && !(e.f & F_DNC) && e.f & F_PHONE) break;
      q.skipped++;
      q.i++;
    }
    if (q.i >= q.ids.length) {
      body.innerHTML = '<div class="cq-done"><h2>' + esc(t("cat_call_done_title")) + "</h2><p>" + esc(t("cat_call_done_text", { a: num(q.done), b: num(q.skipped) })) + '</p><button class="btn primary big" type="button" data-cat="cqClose">' + esc(t("cat_call_close")) + "</button></div>";
      await cqEnd();
      return;
    }
    await cqSave();
    var r = await getCompany(e.id), pct = Math.round(q.i / q.total * 100);
    body.innerHTML = '<div class="cq-prog"><span id="cqN">' + esc(t("cat_call_of", { n: num(q.i + 1), m: num(q.total) })) + "</span>" + (q.name ? '<small class="muted">' + esc(q.name) + "</small>" : "") + '</div><div class="pbar"><i style="width:' + pct + '%"></i></div><div><p class="cq-name">' + esc(e.n) + '</p><div class="cq-sub">' + esc(rowSub(e, Date.now())) + '</div><span class="chip s' + e.st + '">' + esc(stName(e.st)) + '</span></div><div class="cq-phone">' + esc(r ? r.phone : "") + '</div><button class="btn primary big" type="button" data-cat="cqCall">' + ico("phone") + esc(t("cat_call_do")) + '</button><div class="row2"><button class="btn ghost" type="button" data-cat="cqSkip">' + esc(t("cat_call_skip")) + '</button><button class="btn ghost" type="button" data-cat="cqCard">' + esc(t("cat_call_card")) + '</button></div><p class="cq-note">' + esc(t("cat_call_wait")) + "</p>" + (q.dnc || q.nophone ? '<p class="cq-note">' + esc(t("cat_call_skipped_note", { a: num(q.dnc), b: num(q.nophone) })) + "</p>" : "") + '<button class="linkbtn" type="button" data-cat="cqStop">' + esc(t("cat_call_stop")) + "</button>";
  }
  async function cqCall() {
    var q = CQ.q;
    if (!q) return;
    var r = await getCompany(q.ids[q.i]);
    if (!r) return cqNext(false);
    if (r.dnc) {
      toast(t("cat_call_dnc"));
      return cqNext(false);
    }
    var href = telHref(r.phone);
    if (!href) {
      toast(t("call_nophone"));
      return cqNext(false);
    }
    startCall({ cid: r.id, name: r.name, cq: 1 }, href);
  }
  async function cqNext(saved) {
    var q = CQ.q;
    if (!q) return;
    if (saved) q.done++;
    else q.skipped++;
    q.i++;
    await cqSave();
    setTimeout(cqDraw, 250);
  }
  function cqAfter(saved) {
    return cqNext(saved);
  }
  function callBarUpdate() {
    var bar = $("#callBar");
    if (!bar) return;
    if (CQ.q === null) {
      cqLoad().then(callBarUpdate);
      return;
    }
    var on = cqLeft() && !(CQ.sh && CQ.sh.isConnected);
    bar.hidden = !on;
    if (!on) return;
    bar.querySelector("span").textContent = t("cat_call_bar", { n: num(CQ.q.i + 1), m: num(CQ.q.total) });
    bar.querySelector("[data-cat=cqResume]").textContent = t("cat_call_resume");
    bar.querySelector("[data-cat=cqDrop]").textContent = t("cat_call_drop");
  }
  function callInit() {
    var sel = $("#btnSelect");
    if (sel && !$("#btnCall")) {
      var b = document.createElement("button");
      b.id = "btnCall";
      b.type = "button";
      b.className = "btn small ghost callmode";
      b.setAttribute("data-cat", "cqStart");
      b.innerHTML = ico("phone") + "<span></span>";
      sel.insertAdjacentElement("beforebegin", b);
    }
    var nr = $("#nores");
    if (nr && !$("#nfHint")) {
      var nh = document.createElement("div");
      nh.id = "nfHint";
      nh.className = "nfhint";
      nh.hidden = true;
      nr.insertAdjacentElement("afterend", nh);
    }
    var seg = $("#segChips");
    if (seg && !$("#callBar")) {
      var bar = document.createElement("div");
      bar.id = "callBar";
      bar.className = "callbar";
      bar.hidden = true;
      bar.innerHTML = '<span></span><button class="btn small primary" type="button" data-cat="cqResume"></button><button class="btn small ghost" type="button" data-cat="cqDrop"></button>';
      seg.insertAdjacentElement("afterend", bar);
    }
    document.addEventListener("click", function(ev) {
      var el = ev.target.closest && ev.target.closest("[data-cat]");
      if (!el) return;
      var a = el.dataset.cat;
      if (a === "snooze") {
        ev.stopPropagation();
        return catSnooze(+el.dataset.tid);
      }
      if (a === "viewMenu") return viewMenu(el.dataset.id);
      if (a === "nfRelax") return nfRelax(el.dataset.k);
      if (a === "nfCatalog") {
        var ck = F.country >= 0 ? coKey(DICT.country[F.country]) : "";
        return openCatalog(S.q, ck ? { country: ck } : null);
      }
      if (a === "cqStart") return cqStart();
      if (a === "cqResume") return cqOpen();
      if (a === "cqDrop") return cqEnd();
      if (a === "cqCall") return cqCall();
      if (a === "cqSkip") return cqNext(false);
      if (a === "cqCard") {
        var q = CQ.q;
        if (q && q.ids[q.i]) return openCard(q.ids[q.i]);
        return;
      }
      if (a === "cqStop") {
        return cqEnd().then(closeTop);
      }
      if (a === "cqClose") return closeTop();
    });
  }
  var TBL_GROUP = { crm_companies: "c", crm_comments: "m", crm_tasks: "k", crm_members: "u", crm_pipelines: "g", crm_stages: "g", crm_contacts: "g", crm_deals: "g", crm_plans: "g", crm_products: "g", crm_org_settings: "g", crm_quotes: "g", crm_goals: "g", crm_scripts: "g", crm_files: "g" };
  async function syncNow() {
    if (!syncOn() || !db) return;
    if (SY.busy) {
      SY.again = true;
      return;
    }
    if (navigator.onLine === false) {
      SY.state = "offline";
      syncBadge();
      return;
    }
    var hint = SY.hint;
    SY.hint = null;
    var want = function(g) {
      if (!hint) return true;
      var ok = false;
      hint.forEach(function(tb) {
        if (TBL_GROUP[tb] === g) ok = true;
      });
      return ok;
    };
    SY.busy = true;
    SY.state = "run";
    SY.err = "";
    syncBadge();
    try {
      if (want("u")) await storeMembers(await api("GET", "crm_members?select=*&org_id=eq." + AU.me.org_id));
      if (!ROLE()) throw new Error("inactive");
      if (want("c")) {
        await catSyncCompanies();
        await metaSet("firstPull", 1);
      }
      if (want("g")) {
        for (var gp = 0; gp < GEN.length; gp++) await pullTable(GEN[gp].tbl, GEN[gp].mk, genApply(GEN[gp].store));
      }
      await pushDels();
      SY.rejected = 0;
      await pushCompanies();
      for (var gi = 0; gi < GEN.length; gi++) await genPush(GEN[gi]);
      await pushChildren("touches", "crm_comments", function(x, cu) {
        return { id: x.uid, org_id: AU.me.org_id, company_id: cu, deal_id: x.dealId || null, contact_id: x.contactId || null, kind: x.kind, body: x.text || "", author: x.author || myName(), author_id: x.authorId || AU.uid, outcome: x.outcome || null, created_at: new Date(x.ts).toISOString(), deleted: false };
      });
      await pushChildren(
        "tasks",
        "crm_tasks",
        function(x, cu) {
          return { id: x.uid, org_id: AU.me.org_id, company_id: cu, deal_id: x.dealId || null, title: x.title, due: x.due, done: !!x.done, done_at: x.doneAt ? new Date(x.doneAt).toISOString() : null, assignee: x.assigneeId ? memberName(x.assigneeId) : x.assignee || null, assignee_id: x.assigneeId || null, author: x.author || myName() || null, created_uid: x.createdUid || AU.uid, remind_at: x.remindAt ? new Date(x.remindAt).toISOString() : null, deleted: false };
        },
        ["title", "due", "done", "done_at", "assignee", "assignee_id", "remind_at", "deal_id"]
      );
      if (want("g")) await loadMemCache();
      if (SY.rejected) toast(t("sync_rejected", { n: SY.rejected }));
      if (want("m")) await pullTable("crm_comments", "pullM", applyChild("touches", mapComment));
      if (want("k")) await pullTable("crm_tasks", "pullK", applyChild("tasks", mapTask));
      SY.state = "ok";
      SY.last = Date.now();
      setTimeout(migrateChannels, 800);
      if (!hint) reconcileVisible().catch(function(e) {
        console.warn("reconcile", e);
      });
    } catch (e) {
      SY.state = "err";
      SY.err = String(e.message || e);
      console.warn("sync", e);
      if (AU.lost) {
        rtClose();
        showGate("login", t("e_session"));
      }
    }
    SY.busy = false;
    SY.pulled = 0;
    syncBadge();
    if (!STACK.length) {
      if (S.tab === "list") refreshList(true);
      else if (S.tab === "today") renderToday();
      else if (S.tab === "stats") renderStats();
    } else {
      var top = STACK[STACK.length - 1].firstChild;
      if (top && top._rec) renderCard(top, top._rec.id);
    }
    catAfterSync();
    if (window.SDX && SDX.afterSync) SDX.afterSync();
    if (SY.state === "ok" && Date.now() - CX.last > 25e3) cxSchedule(CX.last ? 1500 : 250);
    if (SY.state === "ok" && window.SDTeam) SDTeam.sync();
    if (SY.again) {
      SY.again = false;
      scheduleSync(500);
    }
  }
  async function pendingCount() {
    var tt = await Promise.all([reqP(db.transaction("touches").objectStore("touches").getAll()), reqP(db.transaction("tasks").objectStore("tasks").getAll())]);
    var gen = 0;
    for (var i = 0; i < GEN.length; i++) gen += (await reqP(db.transaction(GEN[i].store).objectStore(GEN[i].store).getAll())).filter(function(x) {
      return x._pend;
    }).length;
    return DIRTYC.size + SY.dels.length + gen + (window.SDTeam ? SDTeam.pending() : 0) + tt[0].filter(function(x) {
      return x.pend;
    }).length + tt[1].filter(function(x) {
      return x.pend;
    }).length;
  }
  async function syncBadge() {
    var el = $("#syncBtn");
    if (!el || !db) return;
    var cls = "off", txt = t("sync_local");
    if (syncOn()) {
      var n = await pendingCount();
      if (SY.state === "run") {
        cls = "run";
        txt = SY.pulled ? t("sync_pull", { n: num(SY.pulled) }) : t("sync_run");
      } else if (SY.state === "err") {
        cls = "err";
        txt = n ? t("sync_wait", { n: num(n) }) : t("sync_err");
      } else if (SY.state === "offline" || navigator.onLine === false) {
        cls = "err";
        txt = n ? t("sync_wait", { n: num(n) }) : t("sync_offline");
      } else if (n) {
        cls = "wait";
        txt = t("sync_wait", { n: num(n) });
      } else if (SY.state === "ok") {
        cls = "ok";
        txt = RT.joined ? t("sync_live") : t("sync_ok");
      } else {
        cls = "wait";
        txt = t("sync_run");
      }
    } else if (AU.s && !ROLE()) {
      cls = "err";
      txt = t("g_pending");
    }
    el.className = "sync " + cls;
    el.querySelector("span").textContent = txt;
    el.title = txt + (SY.err ? " \u2014 " + SY.err : "");
    el.setAttribute("aria-label", txt);
    var nb = $("#netbar");
    if (nb) {
      var offl = SY.state === "offline" || navigator.onLine === false, showNb = syncOn() && (offl || SY.state === "err" && n > 0);
      nb.hidden = !showNb;
      document.body.classList.toggle("has-netbar", showNb);
      if (showNb) nb.textContent = offl ? n ? t("net_bar_wait", { n: num(n) }) : t("net_bar_off") : t("net_bar_err", { n: num(n) });
    }
  }
  async function fetchHistory(uid) {
    if (!syncOn() || navigator.onLine === false || !uid) return null;
    try {
      return await api("GET", "crm_history?select=*&company_id=eq." + encodeURIComponent(uid) + "&order=created_at.desc&limit=200");
    } catch (e) {
      return null;
    }
  }
  var RT = { ws: null, ref: 0, hb: null, retry: 0, joined: false, topic: "", timer: null, last: 0 };
  var RT_TABLES = ["crm_companies", "crm_comments", "crm_tasks", "crm_contacts", "crm_deals", "crm_pipelines", "crm_stages", "crm_plans", "crm_members", "crm_products", "crm_org_settings", "crm_quotes", "crm_goals", "crm_scripts", "crm_files"];
  function rtSend(m) {
    try {
      if (RT.ws && RT.ws.readyState === 1) RT.ws.send(JSON.stringify(m));
    } catch (e) {
    }
  }
  function rtConnect() {
    if (!syncOn() || !window.WebSocket || RT.ws && RT.ws.readyState <= 1) return;
    clearTimeout(RT.timer);
    var url = baseUrl().replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(anonKey()) + "&vsn=1.0.0";
    var ws;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      return rtRetry();
    }
    RT.ws = ws;
    RT.joined = false;
    RT.topic = "realtime:sotuvdesc-" + AU.me.org_id;
    ws.onopen = function() {
      RT.ref++;
      rtSend({ topic: RT.topic, event: "phx_join", ref: String(RT.ref), join_ref: String(RT.ref), payload: { config: {
        broadcast: { ack: false, self: false },
        presence: { key: "" },
        private: false,
        postgres_changes: RT_TABLES.map(function(tb) {
          return { event: "*", schema: "public", table: tb, filter: "org_id=eq." + AU.me.org_id };
        }).concat(CX_RT.concat(window.SDTeam ? SDTeam.rtTables() : []).map(function(tb) {
          return { event: "*", schema: "public", table: tb };
        }))
      }, access_token: AU.s.access_token } });
      clearInterval(RT.hb);
      RT.hb = setInterval(function() {
        RT.ref++;
        rtSend({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(RT.ref) });
      }, 25e3);
    };
    ws.onmessage = function(ev) {
      var m;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (m.topic !== RT.topic) return;
      if (m.event === "phx_reply" && m.payload) {
        if (m.payload.status === "ok" && m.payload.response && m.payload.response.postgres_changes) {
          RT.joined = true;
          RT.retry = 0;
          syncBadge();
        } else if (m.payload.status === "error") {
          RT.joined = false;
          syncBadge();
          try {
            ws.close();
          } catch (e) {
          }
        }
      } else if (m.event === "postgres_changes" && m.payload && m.payload.data) {
        RT.last = Date.now();
        if (window.SDTeam && SDTeam.RT.indexOf(m.payload.data.table) >= 0) SDTeam.wake(120);
        else if (CX_RT.indexOf(m.payload.data.table) >= 0) cxSchedule(120);
        else if (catRtOk(m.payload.data)) scheduleSync(350, m.payload.data.table);
      } else if (m.event === "phx_close" || m.event === "phx_error") {
        RT.joined = false;
        try {
          ws.close();
        } catch (e) {
        }
      }
    };
    ws.onclose = function() {
      clearInterval(RT.hb);
      if (RT.ws === ws) {
        RT.ws = null;
        RT.joined = false;
        syncBadge();
        rtRetry();
      }
    };
    ws.onerror = function() {
    };
  }
  function rtRetry() {
    clearTimeout(RT.timer);
    if (!syncOn()) return;
    RT.retry = Math.min(RT.retry + 1, 6);
    RT.timer = setTimeout(rtConnect, 1e3 * Math.pow(2, RT.retry));
  }
  function rtClose() {
    clearTimeout(RT.timer);
    clearInterval(RT.hb);
    var w = RT.ws;
    RT.ws = null;
    RT.joined = false;
    if (w) try {
      w.close();
    } catch (e) {
    }
  }
  function rtToken() {
    if (RT.ws && RT.joined && AU.s) {
      RT.ref++;
      rtSend({ topic: RT.topic, event: "access_token", payload: { access_token: AU.s.access_token }, ref: String(RT.ref) });
    }
  }
  var DL = { pipe: "", list: [], contacts: [], touches: [] };
  var STALE_DAYS = function() {
    return +(S.settings.staleDays || 7);
  };
  async function loadDealsCache() {
    var tx = db.transaction(["deals", "contacts"]);
    var r = await Promise.all([reqP(tx.objectStore("deals").getAll()), reqP(tx.objectStore("contacts").getAll())]);
    DL.list = r[0].filter(function(d) {
      return !d.deleted;
    });
    DL.contacts = r[1].filter(function(c) {
      return !c.deleted;
    });
  }
  function pipes() {
    return MEM.pipelines.length ? MEM.pipelines : [];
  }
  function stagesOf(pid) {
    return MEM.stages.filter(function(s) {
      return s.pipeline_id === pid;
    }).sort(function(a, b) {
      return a.sort - b.sort;
    });
  }
  function stageById(id) {
    return MEM.stages.filter(function(s) {
      return s.id === id;
    })[0];
  }
  function curPipe() {
    var ps = pipes();
    if (!ps.length) return null;
    return ps.filter(function(p) {
      return p.id === DL.pipe;
    })[0] || ps[0];
  }
  var money = function(n, cur) {
    n = Math.round(+n || 0);
    return num(n) + " " + (cur === "USD" ? "$" : "\u0441\u0443\u043C");
  };
  var UIDMAP = /* @__PURE__ */ new Map();
  async function buildUidMap() {
    UIDMAP = /* @__PURE__ */ new Map();
    await new Promise(function(res) {
      var cur = db.transaction("companies").objectStore("companies").index("uid").openKeyCursor();
      cur.onsuccess = function() {
        var c = cur.result;
        if (!c) return res();
        UIDMAP.set(c.key, c.primaryKey);
        c.continue();
      };
      cur.onerror = function() {
        res();
      };
    });
  }
  function cidOfUid(uid) {
    return uid ? UIDMAP.get(uid) : null;
  }
  function dealLastTouch(d) {
    var mx = Date.parse(d.created_at) || 0;
    DL.touches.forEach(function(x) {
      if (x.dealId === d.id && x.kind !== "status" && x.ts > mx) mx = x.ts;
    });
    var cid = cidOfUid(d.company_id), e = cid ? BYID.get(cid) : null;
    if (e && e.lc > mx) mx = e.lc;
    return mx;
  }
  async function loadDealTouches() {
    DL.touches = (await reqP(db.transaction("touches").objectStore("touches").getAll())).filter(function(x) {
      return x.dealId;
    });
  }
  async function openTasksAll() {
    return (await reqP(db.transaction("tasks").objectStore("tasks").getAll())).filter(function(x) {
      return !x.done;
    });
  }
  async function renderDeals() {
    var v = $("#v-deals");
    await loadDealsCache();
    await loadDealTouches();
    var p = curPipe();
    if (!p) {
      v.innerHTML = '<div class="pad"><p class="muted">' + esc(ROLE() ? t("d_no_pipe") : t("d_need_login")) + "</p></div>";
      return;
    }
    if (!DL.list.length && window.SDOnb) {
      v.innerHTML = SDOnb.dealsEmpty();
      return;
    }
    var st = stagesOf(p.id), open = await openTasksAll(), td = today(), stale = STALE_DAYS();
    var hasTask = new Set(open.map(function(x) {
      return x.dealId;
    }).filter(Boolean));
    var q = (S.dq || "").toLowerCase(), mineOnly = S.dmine;
    var deals = DL.list.filter(function(d) {
      return d.pipeline_id === p.id && (!mineOnly || d.owner_id === AU.uid) && (!q || (d.title + " " + (companyName(d) || "")).toLowerCase().indexOf(q) >= 0);
    });
    var cols = st.map(function(s) {
      return { s, items: deals.filter(function(d) {
        return d.stage_id === s.id;
      }) };
    });
    var orphan = deals.filter(function(d) {
      return !st.some(function(s) {
        return s.id === d.stage_id;
      });
    });
    if (orphan.length && cols[0]) cols[0].items = cols[0].items.concat(orphan);
    var sum = function(arr, cur) {
      return arr.filter(function(d) {
        return (d.currency || "UZS") === cur;
      }).reduce(function(a, d) {
        return a + (+d.amount || 0);
      }, 0);
    };
    v.innerHTML = '<div class="dhead">' + (pipes().length > 1 ? '<select id="dPipe">' + pipes().map(function(x) {
      return '<option value="' + x.id + '"' + (x.id === p.id ? " selected" : "") + ">" + esc(x.name) + "</option>";
    }).join("") + "</select>" : "<b>" + esc(p.name) + "</b>") + '<input id="dq" class="inp" type="search" placeholder="' + esc(t("d_search")) + '" value="' + esc(S.dq || "") + '"><label class="chk"><input type="checkbox" id="dMine"' + (mineOnly ? " checked" : "") + "><span>" + esc(t("d_mine")) + "</span></label>" + (canWriteAny() ? '<button class="btn small primary" data-act="dealNew">' + ico("plus") + esc(t("d_new")) + "</button>" : "") + (isAdmin() ? '<button class="btn small ghost" data-act="pipeEdit">' + esc(t("d_pipes")) + "</button>" : "") + '</div><div class="board dboard">' + cols.map(function(c) {
      var won = c.s.kind === "won", lost = c.s.kind === "lost";
      return '<div class="kcol" data-stage="' + c.s.id + '"><div class="khead ' + (won ? "s5" : lost ? "s6" : "s1") + '"><b>' + esc(c.s.name) + "</b><span>" + c.items.length + '</span></div><div class="ksum">' + esc([sum(c.items, "UZS") ? money(sum(c.items, "UZS"), "UZS") : "", sum(c.items, "USD") ? money(sum(c.items, "USD"), "USD") : ""].filter(Boolean).join(" \xB7 ") || "\u2014") + '</div><div class="klist">' + c.items.sort(function(a, b) {
        return (a.close_date || "9") < (b.close_date || "9") ? -1 : 1;
      }).map(function(d) {
        var lt = dealLastTouch(d), days = lt ? Math.floor((Date.now() - lt) / 864e5) : 0, isOpen = c.s.kind === "open";
        return '<div class="kcard deal" draggable="true" data-did="' + d.id + '"><div class="kname" data-act="dealOpen" data-did="' + d.id + '">' + esc(d.title) + '</div><div class="rsub">' + esc(companyName(d) || "") + '</div><div class="dmeta"><b>' + esc(money(d.amount, d.currency)) + "</b>" + (d.owner_id ? "<span>" + esc(memberName(d.owner_id)) + "</span>" : "") + (d.close_date ? '<span class="due' + (isOpen && d.close_date < td ? " late" : "") + '">' + fmtDate(d.close_date).slice(0, 5) + "</span>" : "") + "</div>" + (isOpen && !hasTask.has(d.id) ? '<div class="warn small">' + esc(t("d_no_task")) + "</div>" : "") + (isOpen && days >= stale ? '<div class="stale">' + esc(t("d_stale", { n: days })) + "</div>" : "") + '<button class="kmove" data-act="dealMove" data-did="' + d.id + '">' + esc(t("k_move")) + "</button></div>";
      }).join("") + "</div></div>";
    }).join("") + "</div>";
    var ps = v.querySelector("#dPipe");
    if (ps) ps.onchange = function() {
      DL.pipe = this.value;
      renderDeals();
    };
    var qi = v.querySelector("#dq"), qt;
    qi.oninput = function() {
      clearTimeout(qt);
      var val = this.value;
      qt = setTimeout(function() {
        S.dq = val;
        renderDeals().then(function() {
          var e = $("#dq");
          if (e) {
            e.focus();
            e.setSelectionRange(val.length, val.length);
          }
        });
      }, 250);
    };
    v.querySelector("#dMine").onchange = function() {
      S.dmine = this.checked;
      renderDeals();
    };
    bindDealDrag(v);
  }
  function companyName(d) {
    var cid = cidOfUid(d.company_id), e = cid ? BYID.get(cid) : null;
    return e ? e.n : "";
  }
  function bindDealDrag(v) {
    var b = v.querySelector(".dboard"), dragId = null;
    b.addEventListener("dragstart", function(e) {
      var c = e.target.closest(".kcard");
      if (c) {
        dragId = c.dataset.did;
        e.dataTransfer.setData("text/plain", dragId);
      }
    });
    b.addEventListener("dragover", function(e) {
      if (e.target.closest(".kcol")) e.preventDefault();
    });
    b.addEventListener("drop", function(e) {
      var col = e.target.closest(".kcol");
      if (!col || !dragId) return;
      e.preventDefault();
      var id = dragId;
      dragId = null;
      moveDeal(id, col.dataset.stage);
    });
  }
  async function moveDeal(id, stageId) {
    var d = DL.list.filter(function(x) {
      return x.id === id;
    })[0];
    if (!d || d.stage_id === stageId) return;
    if (!canWrite(d)) {
      toast(t("ro_card"));
      return;
    }
    var s = stageById(stageId), from = stageById(d.stage_id);
    if (s && s.kind === "lost") {
      var why = await ask(t("d_lost_q"), { input: d.lost_reason || "", ph: t("d_lost_ph"), ok: t("save") });
      if (why == null || !why.trim()) {
        toast(t("d_lost_need"));
        return;
      }
      d.lost_reason = why.trim();
    }
    d.stage_id = stageId;
    d.probability = s ? s.probability : d.probability;
    d.closed_at = s && s.kind !== "open" ? (/* @__PURE__ */ new Date()).toISOString() : null;
    d.updated_by = myName();
    await genPut("deals", [d]);
    await addTouch({ cid: cidOfUid(d.company_id) || 0, dealId: d.id, kind: "status", text: t("d_moved", { a: from ? from.name : "\u2014", b: s ? s.name : "\u2014" }) + (d.lost_reason && s && s.kind === "lost" ? " \u2014 " + d.lost_reason : "") });
    if (s && s.kind === "won") toast(t("d_won_toast", { n: money(d.amount, d.currency) }));
    if (S.tab === "deals") renderDeals();
  }
  async function addTouch(x) {
    x.ts = x.ts || Date.now();
    x.uid = x.uid || uuid();
    x.author = myName();
    x.authorId = AU.uid;
    if (x.pend == null) x.pend = x.kind === "status" && !x.dealId ? 0 : 1;
    var tx = db.transaction("touches", "readwrite");
    tx.objectStore("touches").add(x);
    await txDone(tx);
    if (x.cid && x.kind !== "status" && x.kind !== "note") {
      var r = await getCompany(x.cid);
      if (r) {
        r.lastTouch = Math.max(r.lastTouch || 0, x.ts);
        await putCompanies([r], null, true);
      }
    }
    scheduleSync();
  }
  async function openDeal(id, preset) {
    var d = id ? DL.list.filter(function(x) {
      return x.id === id;
    })[0] : null;
    if (id && !d) {
      await loadDealsCache();
      d = DL.list.filter(function(x) {
        return x.id === id;
      })[0];
    }
    var isNew = !d;
    if (isNew) {
      var p = curPipe();
      if (!p) {
        toast(t("d_no_pipe"));
        return;
      }
      var st0 = stagesOf(p.id)[0];
      d = { id: uuid(), org_id: AU.me && AU.me.org_id, pipeline_id: p.id, stage_id: st0 ? st0.id : null, company_id: null, contact_id: null, title: "", amount: 0, currency: "UZS", probability: st0 ? st0.probability : 10, owner_id: ROLE() === "manager" ? AU.uid : AU.uid || null, close_date: addDays(today(), 14), lost_reason: null, note: "", deleted: false, created_at: (/* @__PURE__ */ new Date()).toISOString() };
      for (var k in preset || {}) d[k] = preset[k];
    }
    var sh = openSheet('<div class="card-loading">' + esc(t("loading")) + "</div>", { full: true, form: true, formScope: ".form", save: "#dSave", onClose: function() {
      if (S.tab === "deals") renderDeals();
      else if (S.tab === "today") renderToday();
    } });
    renderDealSheet(sh, d, isNew);
  }
  async function renderDealSheet(sh, d, isNew) {
    if (db) await loadFiles();
    var qhtml = !isNew && ROLE() ? await quotesOfDealHtml(d) : "", schtml = !isNew ? await scriptsHtml(d) : "";
    var ro = !isNew && !canWrite(d), p = MEM.pipelines.filter(function(x) {
      return x.id === d.pipeline_id;
    })[0] || curPipe(), st = p ? stagesOf(p.id) : [];
    var cid = cidOfUid(d.company_id), ce = cid ? BYID.get(cid) : null, comp = cid ? await getCompany(cid) : null;
    var contacts = DL.contacts.filter(function(c) {
      return d.company_id && c.company_id === d.company_id;
    });
    var tasks = (await reqP(db.transaction("tasks").objectStore("tasks").getAll())).filter(function(x) {
      return x.dealId === d.id;
    }).sort(function(a, b) {
      return a.done - b.done || (a.due < b.due ? -1 : 1);
    });
    var touches = (await reqP(db.transaction("touches").objectStore("touches").getAll())).filter(function(x) {
      return x.dealId === d.id;
    }).sort(function(a, b) {
      return b.ts - a.ts;
    });
    var owners = isAdmin() ? activeMembers().filter(function(m) {
      return m.role !== "viewer";
    }) : activeMembers().filter(function(m) {
      return m.user_id === AU.uid;
    });
    var ctc = contacts.filter(function(c) {
      return c.id === d.contact_id;
    })[0];
    var phone = ctc && ctc.phone || comp && comp.phone || "", wa = waDigits(phone), td = today();
    var dis = ro ? " disabled" : "";
    sh.innerHTML = sheetHead(isNew ? t("d_new") : d.title, (!isNew && ROLE() ? '<button class="icbtn" data-act="cxDiscussDeal" data-did="' + esc(d.id) + '" aria-label="' + esc(t("cx_discuss")) + '" title="' + esc(t("cx_discuss")) + '">' + ico("chat") + "</button>" : "") + (!isNew && !ro ? '<button class="icbtn" data-act="dealDel" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button>" : "")) + '<div class="cbody">' + (ro ? '<div class="note small">' + esc(t("ro_card")) + "</div>" : "") + '<div class="pills">' + st.map(function(s) {
      return '<button class="pill ' + (s.kind === "won" ? "s5" : s.kind === "lost" ? "s6" : "s1") + (d.stage_id === s.id ? " on" : "") + '" data-dst="' + s.id + '"' + dis + ">" + esc(s.name) + "</button>";
    }).join("") + "</div>" + (!isNew && phone ? '<div class="cacts"><a class="cact" href="' + esc(telHref(phone)) + '" data-dcall="1">' + ico("phone") + "<span>" + esc(t("c_call")) + "</span></a>" + (wa ? '<a class="cact" href="https://wa.me/' + wa + '" data-dmsg="whatsapp">' + ico("wa") + '<span>WhatsApp</span></a><a class="cact" href="https://t.me/+' + wa + '" data-dmsg="telegram">' + ico("tg") + "<span>Telegram</span></a>" : "") + (cid ? '<button class="cact" data-act="open" data-id="' + cid + '">' + ico("list") + "<span>" + esc(t("d_company")) + "</span></button>" : "") + "</div>" : "") + schtml + '<div class="form">' + lab(t("d_title") + (isNew ? " *" : ""), '<input class="inp" id="dTitle" value="' + esc(d.title) + '"' + dis + ' placeholder="' + esc(t("d_title_ph")) + '">') + lab(t("d_company"), '<div class="row2"><input class="inp" id="dComp" list="dCompList" value="' + esc(ce ? ce.n : "") + '" placeholder="' + esc(t("d_company_ph")) + '"' + dis + '><datalist id="dCompList"></datalist></div>') + (contacts.length ? lab(t("d_contact"), '<select id="dContact"' + dis + '><option value="">\u2014</option>' + contacts.map(function(c) {
      return '<option value="' + c.id + '"' + (c.id === d.contact_id ? " selected" : "") + ">" + esc(c.name + (c.position ? " \xB7 " + c.position : "")) + "</option>";
    }).join("") + "</select>") : "") + '<div class="row2">' + lab(t("d_amount"), '<input class="inp" id="dAmount" type="number" min="0" step="1000" inputmode="decimal" value="' + esc(d.amount || "") + '"' + dis + ">") + lab(t("d_currency"), '<select id="dCur"' + dis + "><option" + (d.currency === "UZS" ? " selected" : "") + ">UZS</option><option" + (d.currency === "USD" ? " selected" : "") + ">USD</option></select>") + '</div><div class="row2">' + lab(t("d_prob"), '<input class="inp" id="dProb" type="number" min="0" max="100" value="' + esc(d.probability == null ? "" : d.probability) + '"' + dis + ">") + lab(t("d_close"), '<input class="inp" id="dClose" type="date" value="' + esc(d.close_date || "") + '"' + dis + ">") + "</div>" + (owners.length ? lab(t("fld_owner"), '<select id="dOwner"' + dis + ">" + (isAdmin() ? '<option value="">' + esc(t("owner_shared")) + "</option>" : "") + owners.map(function(m) {
      return '<option value="' + m.user_id + '"' + (m.user_id === d.owner_id ? " selected" : "") + ">" + esc(m.display_name || m.email) + "</option>";
    }).join("") + "</select>") : "") + ((stageById(d.stage_id) || {}).kind === "lost" || d.lost_reason ? lab(t("d_lost_reason"), '<input class="inp" id="dLost" value="' + esc(d.lost_reason || "") + '"' + dis + ">") : "") + lab(t("fld_comment"), '<textarea class="inp" id="dNote" rows="2"' + dis + ">" + esc(d.note || "") + "</textarea>") + (!ro ? '<button class="btn primary wide" id="dSave">' + esc(isNew ? t("d_create") : t("save")) + "</button>" : "") + "</div>" + (!isNew ? "<section><h3>" + esc(t("c_tasks")) + "</h3>" + (tasks.length ? tasks.map(function(x) {
      return '<div class="task' + (x.done ? " done" : "") + '"><button class="cb' + (x.done ? " on" : "") + '" data-dtask="' + x.id + '">' + (x.done ? ico("check") : "") + '</button><div class="tmain"><div>' + esc(x.title) + '</div><div class="due' + (!x.done && x.due < td ? " late" : "") + '">' + fmtDate(x.due) + (x.remindAt ? " \xB7 \u23F0 " + fmtTs(x.remindAt).slice(11) : "") + (x.assigneeId ? " \xB7 " + esc(memberName(x.assigneeId)) : "") + "</div></div></div>";
    }).join("") : '<p class="warn small">' + esc(t("d_no_task")) + "</p>") + (!ro ? '<div class="addtask"><input class="inp" id="tTitle" placeholder="' + esc(t("c_task_ph")) + '"><div class="row3"><input class="inp" type="date" id="tDue" value="' + addDays(td, 1) + '">' + remSelect("tRem") + assigneeSelect("tAsg", d.owner_id || AU.uid) + '</div><button class="btn primary" id="dTaskAdd">' + ico("plus") + esc(t("add")) + "</button></div>" : "") + "</section>" + (ROLE() ? filesBlockHtml("deal", d.id, !ro) : "") + qhtml + "<section><h3>" + esc(t("c_history")) + "</h3>" + (touches.length ? '<ul class="hist">' + touches.map(function(x) {
      return '<li class="k-' + x.kind + '"><div class="hk"><b>' + esc(t("k_" + x.kind)) + "</b> <span>" + fmtTs(x.ts) + (x.author ? " \xB7 " + esc(x.author) : "") + "</span></div>" + (x.text ? '<div class="ht">' + esc(x.text) + "</div>" : "") + "</li>";
    }).join("") + "</ul>" : '<p class="muted">' + esc(t("c_no_history")) + "</p>") + "</section>" : "") + "</div>" + (!isNew && !ro ? '<div class="quick"><select id="kSel">' + KINDS.map(function(k) {
      return '<option value="' + k + '">' + esc(t("k_" + k)) + "</option>";
    }).join("") + '</select><input class="inp" id="kText" placeholder="' + esc(t("c_touch_ph")) + '"><button class="btn primary" id="dTouch" aria-label="' + esc(t("add")) + '">' + ico("send") + "</button></div>" : "");
    sh._refiles = function() {
      renderDealSheet(sh, d, false);
    };
    var ci = sh.querySelector("#dComp"), dlist = sh.querySelector("#dCompList");
    if (ci && !ro) ci.oninput = function() {
      var q = this.value.toLowerCase().trim();
      if (q.length < 2) {
        dlist.innerHTML = "";
        return;
      }
      var out = [];
      for (var i = 0; i < IDX.length && out.length < 12; i++) if (IDX[i].n.toLowerCase().indexOf(q) >= 0) out.push(IDX[i]);
      dlist.innerHTML = out.map(function(e) {
        return '<option value="' + esc(e.n) + '">';
      }).join("");
    };
    var collect = async function() {
      var g = function(id) {
        var el = sh.querySelector("#" + id);
        return el ? el.value : void 0;
      };
      d.title = (g("dTitle") || "").trim();
      var cname = (g("dComp") || "").trim();
      if (cname) {
        var hit = IDX.filter(function(e) {
          return e.n === cname;
        })[0];
        if (hit) {
          var rr = await getCompany(hit.id);
          d.company_id = rr ? rr.uid : null;
        } else if (!ce || ce.n !== cname) {
          if (!await ask(t("d_new_company_q", { n: cname }), { ok: t("d_new_company_ok") })) {
            var dci = sh.querySelector("#dComp");
            if (dci) dci.focus();
            return false;
          }
          var nr = newRec({ name: cname, source: "manual: " + myName(), basis: "other", ownerId: ROLE() === "manager" ? AU.uid : null });
          await putCompanies([nr]);
          d.company_id = nr.uid;
          UIDMAP.set(nr.uid, nr.id);
        }
      } else d.company_id = null;
      if (!d.title) d.title = cname || t("d_new");
      d.amount = Math.max(0, +(g("dAmount") || 0));
      d.currency = g("dCur") || "UZS";
      var pr = g("dProb");
      d.probability = pr === "" || pr == null ? null : Math.max(0, Math.min(100, +pr));
      d.close_date = g("dClose") || null;
      if (g("dOwner") !== void 0) d.owner_id = g("dOwner") || null;
      if (ROLE() === "manager" && d.owner_id && d.owner_id !== AU.uid) d.owner_id = AU.uid;
      if (g("dContact") !== void 0) d.contact_id = g("dContact") || null;
      if (g("dLost") !== void 0) d.lost_reason = (g("dLost") || "").trim() || null;
      d.note = g("dNote") || "";
      d.updated_by = myName();
      return true;
    };
    var sv = sh.querySelector("#dSave");
    if (sv) sv.onclick = async function() {
      if (isNew && !(sh.querySelector("#dTitle").value || "").trim()) {
        fieldErr(sh.querySelector("#dTitle"), t("e_deal_title"));
        return;
      }
      if (!await collect()) return;
      if (sh.parentNode) sh.parentNode._dirty = false;
      var s = stageById(d.stage_id);
      if (s && s.kind === "lost" && !d.lost_reason) {
        toast(t("d_lost_need"));
        return;
      }
      await genPut("deals", [d]);
      await loadDealsCache();
      if (isNew) {
        await addTouch({ cid: cidOfUid(d.company_id) || 0, dealId: d.id, kind: "note", text: t("d_created", { n: money(d.amount, d.currency) }) });
        toast(t("d_created_toast"));
        await renderDealSheet(sh, d, false);
        var ntt = sh.querySelector("#tTitle");
        if (ntt && ntt.scrollIntoView) ntt.scrollIntoView({ block: "center" });
      } else {
        toast(t("c_saved"));
        renderDealSheet(sh, d, false);
      }
    };
    $$("[data-dst]", sh).forEach(function(b) {
      b.onclick = async function() {
        if (isNew) {
          d.stage_id = b.dataset.dst;
          renderDealSheet(sh, d, true);
          return;
        }
        if (!await collect()) return;
        await moveDeal(d.id, b.dataset.dst);
        await loadDealsCache();
        var nd = DL.list.filter(function(x) {
          return x.id === d.id;
        })[0] || d;
        renderDealSheet(sh, nd, false);
      };
    });
    var ta = sh.querySelector("#dTaskAdd");
    if (ta) ta.onclick = async function() {
      var title = sh.querySelector("#tTitle").value.trim(), due = sh.querySelector("#tDue").value || addDays(today(), 1);
      if (!title) {
        sh.querySelector("#tTitle").focus();
        return;
      }
      var rv = sh.querySelector("#tRem").value, asg = sh.querySelector("#tAsg");
      var tx = db.transaction("tasks", "readwrite");
      tx.objectStore("tasks").add({ uid: uuid(), cid: cidOfUid(d.company_id) || 0, dealId: d.id, title, due, done: false, createdAt: Date.now(), author: myName(), createdUid: AU.uid, assigneeId: asg ? asg.value : AU.uid, remindAt: reminderTs(due, rv), pend: 1 });
      await txDone(tx);
      if (cidOfUid(d.company_id)) await recomputeDue(cidOfUid(d.company_id));
      scheduleSync();
      scheduleReminders();
      renderDealSheet(sh, d, false);
    };
    $$("[data-dtask]", sh).forEach(function(b) {
      b.onclick = async function() {
        var tx = db.transaction("tasks", "readwrite"), s = tx.objectStore("tasks");
        var x = await reqP(s.get(+b.dataset.dtask));
        x.done = !x.done;
        x.doneAt = Date.now();
        x.pend = 1;
        s.put(x);
        await txDone(tx);
        if (x.cid) await recomputeDue(x.cid);
        scheduleSync();
        scheduleReminders();
        renderDealSheet(sh, d, false);
      };
    });
    var dt = sh.querySelector("#dTouch");
    if (dt) {
      var send = async function() {
        var kind = sh.querySelector("#kSel").value, text = sh.querySelector("#kText").value.trim();
        if (!text && kind === "note") return;
        await addTouch({ cid: cidOfUid(d.company_id) || 0, dealId: d.id, kind, text });
        renderDealSheet(sh, d, false);
      };
      dt.onclick = send;
      sh.querySelector("#kText").onkeydown = function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          send();
        }
      };
    }
    var qn = sh.querySelector("[data-qnew]");
    if (qn) qn.onclick = function() {
      openQuote(d);
    };
    $$("[data-qopen]", sh).forEach(function(b) {
      b.onclick = async function() {
        var q = (await genAll("quotes")).filter(function(x) {
          return x.id === b.dataset.qopen;
        })[0];
        if (!q) return;
        if (canWrite(d)) openQuote(d, q);
        else shareQuotePdf(q, d);
      };
    });
    var dd = sh.querySelector("[data-act=dealDel]");
    if (dd) dd.onclick = async function(ev) {
      ev.stopPropagation();
      if (!await ask(t("d_del_q", { n: d.title }), { danger: true, ok: t("del") })) return;
      d.deleted = true;
      await genPut("deals", [d]);
      await loadDealsCache();
      toast(t("c_deleted"));
      closeTop();
    };
    $$("a[data-dcall],a[data-dmsg]", sh).forEach(function(a) {
      a.onclick = async function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var kind = a.dataset.dcall ? "call" : a.dataset.dmsg;
        if (kind === "call") return startCall({ cid: cidOfUid(d.company_id) || 0, dealId: d.id, name: d.title }, a.getAttribute("href"));
        return startMsg({ cid: cidOfUid(d.company_id) || 0, dealId: d.id, kind, label: t("ch_" + kind) + " " + phone, name: d.title }, a.getAttribute("href"));
      };
    });
  }
  function contactsSectionHtml(r) {
    var list = DL.contacts.filter(function(c) {
      return c.company_id === r.uid;
    });
    return "<section><h3>" + esc(t("ct_title")) + " \xB7 " + list.length + "</h3>" + list.map(function(c) {
      var wa = waDigits(c.phone);
      var cch = c.extra && Array.isArray(c.extra.ch) ? c.extra.ch : [];
      return '<div class="mrow"><div class="mmain"><b>' + esc(c.name) + '</b><span class="muted small">' + esc([c.position, c.phone, c.email].filter(Boolean).join(" \xB7 ")) + "</span>" + (cch.length ? chChipsHtml(r, cch, c.id, false) : "") + '</div><div class="mact">' + (c.phone ? '<a class="btn small ghost" href="' + esc(telHref(c.phone)) + '" data-ccall="' + c.id + '">' + ico("phone") + "</a>" : "") + (wa ? '<a class="btn small ghost" href="https://wa.me/' + wa + '" data-cmsg="whatsapp" data-cid2="' + c.id + '">' + ico("wa") + "</a>" : "") + (canWrite(r) ? '<button class="btn small ghost" data-act="ctEdit" data-ctid="' + c.id + '">' + ico("edit") + "</button>" : "") + "</div></div>";
    }).join("") + (canWrite(r) ? '<button class="btn small ghost" data-act="ctEdit" data-ctid="">' + ico("plus") + esc(t("ct_add")) + "</button>" : "") + (canWriteAny() ? ' <button class="btn small primary" data-act="dealFromCompany">' + ico("plus") + esc(t("d_new")) + "</button>" : "") + dealsOfCompanyHtml(r) + "</section>";
  }
  function dealsOfCompanyHtml(r) {
    var ds = DL.list.filter(function(d) {
      return d.company_id === r.uid;
    });
    if (!ds.length) return "";
    return '<div class="sub">' + esc(t("tab_deals")) + "</div>" + ds.map(function(d) {
      var s = stageById(d.stage_id);
      return '<div class="kv link" data-act="dealOpen" data-did="' + d.id + '"><span>' + esc(s ? s.name : "") + "</span>" + esc(d.title + " \xB7 " + money(d.amount, d.currency)) + "</div>";
    }).join("");
  }
  function openContact(r, ctid, done) {
    if (db && !FI.list.length) loadFiles();
    var c = DL.contacts.filter(function(x) {
      return x.id === ctid;
    })[0] || { id: uuid(), org_id: AU.me && AU.me.org_id, company_id: r.uid, owner_id: r.ownerId || null, name: "", position: "", phone: "", phone2: "", email: "", telegram: "", note: "", deleted: false };
    var isNew = !DL.contacts.some(function(x) {
      return x.id === c.id;
    });
    c = JSON.parse(JSON.stringify(c));
    c.extra = c.extra && typeof c.extra === "object" ? c.extra : {};
    c.extra.ch = Array.isArray(c.extra.ch) ? c.extra.ch : [];
    var sh = openSheet(sheetHead(isNew ? t("ct_add") : c.name) + '<div class="form">' + ["name", "position", "phone", "phone2", "email", "telegram", "note"].map(function(f) {
      return lab(t("ct_" + f), '<input class="inp" data-cf="' + f + '" value="' + esc(c[f] || "") + '"' + (f.indexOf("phone") === 0 ? ' type="tel"' : f === "email" ? ' type="email"' : "") + ">");
    }).join("") + contactExtrasHtml(c) + (!isNew && ROLE() ? filesBlockHtml("contact", c.id, canWrite({ owner_id: c.owner_id })) : "") + '<div class="row2">' + (isNew ? '<button class="btn ghost" data-act="close">' + esc(t("cancel")) + "</button>" : '<button class="btn danger" id="ctDel">' + esc(t("del")) + "</button>") + '<button class="btn primary" id="ctSave">' + esc(t("save")) + "</button></div></div>", { full: true });
    sh._ctRec = r;
    sh._ct = c;
    sh._refiles = function() {
      refreshFilesBlock(sh);
    };
    sh._ctRedraw = function() {
      var box = sh.querySelector("#ctCh");
      if (box) box.innerHTML = chChipsHtml(null, c.extra.ch, c.id, true);
    };
    sh.querySelector("#ctSave").onclick = async function() {
      $$("[data-cf]", sh).forEach(function(el) {
        c[el.dataset.cf] = el.value.trim();
      });
      if (!c.name) {
        sh.querySelector("[data-cf=name]").focus();
        return;
      }
      readContactExtras(sh, c);
      c.updated_by = myName();
      await genPut("contacts", [c]);
      await loadDealsCache();
      await closeTop();
      done();
    };
    var del = sh.querySelector("#ctDel");
    if (del) del.onclick = async function() {
      if (!await ask(t("ct_del_q", { n: c.name }), { danger: true, ok: t("del") })) return;
      c.deleted = true;
      await genPut("contacts", [c]);
      await loadDealsCache();
      await closeTop();
      done();
    };
  }
  var CALL = { pending: null };
  function startCall(p, href) {
    p.ts = Date.now();
    CALL.pending = p;
    MSG.pending = null;
    openExt(href);
    setTimeout(function() {
      if (CALL.pending === p && !p.hid && !document.hidden) callResultPrompt();
    }, 3e3);
  }
  function startMsg(p, href) {
    p.ts = Date.now();
    MSG.pending = p;
    CALL.pending = null;
    openExt(href);
    setTimeout(function() {
      if (MSG.pending === p && !p.hid && !document.hidden) msgResultPrompt();
    }, 3e3);
  }
  async function rowCall(id) {
    var r = await getCompany(id);
    if (!r) return;
    if (r.dnc) {
      toast(t("c_dnc_on"));
      return;
    }
    var href = telHref(r.phone);
    if (!href) {
      toast(t("call_nophone"));
      return;
    }
    startCall({ cid: r.id, name: r.name }, href);
  }
  function addFollowTask(p, nd, titleKey) {
    var due = addDays(today(), +nd), tx = db.transaction("tasks", "readwrite");
    tx.objectStore("tasks").add({ uid: uuid(), cid: p.cid || 0, dealId: p.dealId || "", title: t(titleKey, { n: p.name || "" }), due, done: false, createdAt: Date.now(), author: myName(), createdUid: AU.uid, assigneeId: AU.uid, remindAt: reminderTs(due, "10:00"), pend: 1 });
    return txDone(tx);
  }
  function resultSheet(o) {
    var chosen = null, nd = null, saved = false;
    var chips = [["1", t("c_tomorrow")], ["3", t("c_3d")], ["7", t("c_7d")], ["", t("cr_never")]];
    var sh = openSheet(
      sheetHead(o.title) + '<div class="form rform"><p class="rname2">' + esc(o.name) + "</p>" + (o.hint ? '<p class="note small">' + esc(o.hint) + "</p>" : "") + '<div class="sub">' + esc(o.pick) + '</div><div class="otiles">' + o.outs.map(function(k) {
        return '<button type="button" class="otile o-' + k + '" ' + o.attr + '="' + k + '" aria-pressed="false">' + esc(t(o.prefix + k)) + "</button>";
      }).join("") + '</div><div class="sub">' + esc(t("cr_when")) + '</div><div class="nchips" id="' + o.id + 'Next">' + chips.map(function(c) {
        return '<button type="button" class="nchip" data-nd="' + c[0] + '" aria-pressed="false">' + esc(c[1]) + "</button>";
      }).join("") + '</div><div id="' + o.id + 'Fix"></div>' + lab(t("cr_comment"), '<textarea class="inp" id="' + o.textId + '" rows="2" placeholder="' + esc(o.ph) + '"></textarea>') + '</div><div class="shfoot col1"><button class="btn primary big" id="' + o.id + 'Save" disabled>' + esc(t("cr_pick_first")) + "</button>" + (o.manual ? "" : '<button class="linkbtn" type="button" id="' + o.id + 'Skip">' + esc(t("cr_skip")) + "</button>") + "</div>",
      { onClose: function() {
        if (!saved && !o.manual) o.onSkip();
      } }
    );
    var save = sh.querySelector("#" + o.id + "Save");
    var setNd = function(v) {
      nd = v;
      $$("[data-nd]", sh).forEach(function(b) {
        var on = b.dataset.nd === v;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };
    $$("[" + o.attr + "]", sh).forEach(function(b) {
      b.onclick = function() {
        chosen = b.getAttribute(o.attr);
        $$("[" + o.attr + "]", sh).forEach(function(x) {
          var on = x === b;
          x.classList.toggle("on", on);
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        setNd(o.defNext[chosen] != null ? o.defNext[chosen] : "");
        save.disabled = false;
        save.textContent = t("cr_save");
        var fx = sh.querySelector("#" + o.id + "Fix");
        if (fx) fx.innerHTML = o.fix && chosen === o.fix.out ? '<button type="button" class="btn ghost small" id="' + o.id + 'FixBtn">' + esc(t("cr_fix_phone")) + "</button>" : "";
        var fb = sh.querySelector("#" + o.id + "FixBtn");
        if (fb) fb.onclick = o.fix.fn;
      };
    });
    $$("[data-nd]", sh).forEach(function(b) {
      b.onclick = function() {
        setNd(b.dataset.nd);
      };
    });
    save.onclick = async function() {
      if (!chosen) return;
      saved = true;
      save.disabled = true;
      try {
        await o.onSave(chosen, nd, sh.querySelector("#" + o.textId).value.trim());
      } finally {
        await closeTop();
      }
      toast(t("c_saved"));
      var top = STACK.length ? STACK[STACK.length - 1].firstChild : null;
      if (top && top._rec && top._rec.id) renderCard(top, top._rec.id);
      if (S.tab === "today" && !STACK.length) renderToday();
    };
    var sk = sh.querySelector("#" + o.id + "Skip");
    if (sk) sk.onclick = function() {
      closeTop();
    };
    return sh;
  }
  function callResultPrompt() {
    if (MSG.pending && !CALL.pending) return msgResultPrompt();
    var p = CALL.pending;
    if (!p || Date.now() - p.ts > 36e5) {
      CALL.pending = null;
      return;
    }
    if (Date.now() - p.ts < 1500) return;
    CALL.pending = null;
    var touch = function(text, out) {
      return addTouch({ cid: p.cid || 0, dealId: p.dealId || "", contactId: p.contactId || "", kind: "call", text, outcome: out });
    };
    return resultSheet({
      title: t("call_result"),
      name: p.name || "",
      pick: t("cr_pick"),
      outs: ["reached", "noanswer", "callback", "wrong"],
      attr: "data-out",
      prefix: "out_",
      id: "cr",
      textId: "crText",
      ph: t("cr_comment_ph"),
      defNext: { reached: "3", noanswer: "1", callback: "1", wrong: "" },
      fix: p.cid ? { out: "wrong", fn: async function() {
        await closeTop();
        var r = await getCompany(p.cid);
        if (r) openEdit(r, function() {
        }, "phone");
      } } : null,
      onSkip: function() {
        touch(t("cr_noresult"), null);
        if (p.cq) cqAfter(false);
      },
      onSave: async function(out, nd, text) {
        if (p.cq) cqAfter(true);
        await touch(t("out_" + out) + (text ? ": " + text : ""), out);
        if ((out === "reached" || out === "callback") && p.cid) {
          var r = await getCompany(p.cid);
          if (r && r.status === 0) await setStatus(r, 1);
        }
        if (nd) {
          await addFollowTask(p, nd, "call_task");
          if (p.cid) await recomputeDue(p.cid);
          scheduleReminders();
        }
        scheduleSync();
      }
    });
  }
  async function openSearchAll() {
    await loadDealsCache();
    var sh = openSheet(sheetHead(t("sa_title")) + '<div class="form"><input class="inp" id="saQ" type="search" placeholder="' + esc(t("sa_ph")) + '" autocomplete="off"><div id="saRes"><p class="muted small">' + esc(t("sa_hint")) + "</p></div></div>", { full: true });
    var qi = sh.querySelector("#saQ"), res = sh.querySelector("#saRes"), qt;
    setTimeout(function() {
      qi.focus();
    }, 60);
    qi.oninput = function() {
      clearTimeout(qt);
      qt = setTimeout(async function() {
        var q = qi.value.trim().toLowerCase(), qd = digits(q);
        if (q.length < 2) {
          res.innerHTML = '<p class="muted small">' + esc(t("sa_hint")) + "</p>";
          return;
        }
        var toks = searchToks(q), co = [];
        for (var i = 0; i < IDX.length && co.length < 30; i++) {
          var e = IDX[i];
          if (toks.every(function(x) {
            return e.s.indexOf(x) >= 0;
          })) co.push(e);
        }
        var ct = DL.contacts.filter(function(c) {
          var s = [c.name, c.position, c.email, digits(c.phone), digits(c.phone2), c.telegram].join(" ").toLowerCase();
          return toks.every(function(x) {
            return s.indexOf(x) >= 0 || qd.length >= 5 && s.indexOf(qd) >= 0;
          });
        }).slice(0, 20);
        var dl = DL.list.filter(function(d) {
          var s = (d.title + " " + companyName(d) + " " + (d.note || "")).toLowerCase();
          return toks.every(function(x) {
            return s.indexOf(x) >= 0;
          });
        }).slice(0, 20);
        var tk = (await openTasksAll()).filter(function(x) {
          return toks.every(function(y) {
            return String(x.title).toLowerCase().indexOf(y) >= 0;
          });
        }).slice(0, 10);
        var grp = function(title, arr, fn) {
          return arr.length ? '<div class="sub">' + esc(title) + " \xB7 " + arr.length + "</div>" + arr.map(fn).join("") : "";
        };
        res.innerHTML = grp(t("tab_list"), co, function(e2) {
          return '<div class="kv link" data-act="open" data-id="' + e2.id + '"><span>' + esc(stName(e2.st)) + "</span>" + esc(e2.n) + "</div>";
        }) + grp(t("ct_title"), ct, function(c) {
          var cid = cidOfUid(c.company_id);
          return '<div class="kv link"' + (cid ? ' data-act="open" data-id="' + cid + '"' : "") + "><span>" + esc(c.position || t("ct_title")) + "</span>" + esc(c.name + (c.phone ? " \xB7 " + c.phone : "") + (cid && BYID.get(cid) ? " \u2014 " + BYID.get(cid).n : "")) + "</div>";
        }) + grp(t("tab_deals"), dl, function(d) {
          return '<div class="kv link" data-act="dealOpen" data-did="' + d.id + '"><span>' + esc(money(d.amount, d.currency)) + "</span>" + esc(d.title) + "</div>";
        }) + grp(t("c_tasks"), tk, function(x) {
          return '<div class="kv link"' + (x.cid ? ' data-act="open" data-id="' + x.cid + '"' : x.dealId ? ' data-act="dealOpen" data-did="' + x.dealId + '"' : "") + "><span>" + fmtDate(x.due) + "</span>" + esc(x.title) + "</div>";
        }) || '<p class="muted">' + esc(t("nothing_found")) + "</p>";
        if (catOn() && syncOn()) res.insertAdjacentHTML("beforeend", '<button class="btn ghost wide" type="button" data-cat="searchq" data-q="' + esc(qi.value.trim()) + '">' + esc(t("cat_all_btn")) + "</button>");
      }, 200);
    };
  }
  window.SDX = window.SDX || {};
  SDX.quickMenu = function(nr) {
    var sh = openSheet(sheetHead(t("qa_title")) + '<div class="col"><button class="btn primary" data-q="deal">' + ico("plus") + esc(t("d_new")) + '</button><button class="btn ghost" data-q="company">' + ico("plus") + esc(t("new_company")) + '</button><button class="btn ghost" data-q="task">' + ico("plus") + esc(t("qa_task")) + "</button></div>");
    $$("[data-q]", sh).forEach(function(b) {
      b.onclick = async function() {
        var q = b.dataset.q;
        await closeTop();
        if (q === "deal") return openDeal(null);
        if (q === "company") return openEdit(nr, function() {
          if (nr.id) {
            refreshList();
            openCard(nr.id);
          }
        });
        if (q === "task") return quickTask();
      };
    });
  };
  function quickTask() {
    var td = today();
    var sh = openSheet(sheetHead(t("qa_task")) + '<div class="form">' + lab(t("c_task_ph"), '<input class="inp" id="qtT">') + '<div class="row2"><input class="inp" type="date" id="qtD" value="' + addDays(td, 1) + '">' + remSelect("qtR") + "</div>" + (ROLE() ? assigneeSelect("qtA", AU.uid) : "") + '<div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="qtS">' + esc(t("save")) + "</button></div></div>", { form: true, save: "#qtS" });
    sh.querySelector("#qtS").onclick = async function() {
      var title = sh.querySelector("#qtT").value.trim(), due = sh.querySelector("#qtD").value || addDays(td, 1);
      if (!title) {
        fieldErr(sh.querySelector("#qtT"), t("c_task_ph"));
        return;
      }
      sh.parentNode._dirty = false;
      var a = sh.querySelector("#qtA");
      var tx = db.transaction("tasks", "readwrite");
      tx.objectStore("tasks").add({ uid: uuid(), cid: 0, title, due, done: false, createdAt: Date.now(), author: myName(), createdUid: AU.uid, assigneeId: a ? a.value : AU.uid, remindAt: reminderTs(due, sh.querySelector("#qtR").value), pend: 1 });
      await txDone(tx);
      scheduleSync();
      scheduleReminders();
      await closeTop();
      toast(t("c_saved"));
      if (S.tab === "today") renderToday();
    };
  }
  SDX.onResume = function() {
    setTimeout(callResultPrompt, 400);
  };
  SDX.afterSync = async function() {
    await buildUidMap();
    await loadDealsCache();
    if (!STACK.length && S.tab === "deals") renderDeals();
    scheduleReminders();
  };
  document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
      if (CALL.pending) CALL.pending.hid = true;
      if (MSG.pending) MSG.pending.hid = true;
      return;
    }
    setTimeout(callResultPrompt, 600);
  });
  function openPipeEdit(pid) {
    if (!isAdmin()) return;
    var p = MEM.pipelines.filter(function(x) {
      return x.id === pid;
    })[0] || curPipe();
    if (!p) return;
    var st = stagesOf(p.id).map(function(x) {
      var o = {};
      for (var k in x) o[k] = x[k];
      return o;
    });
    var sh = openSheet(sheetHead(t("d_pipes")) + '<div class="form">' + (MEM.pipelines.length > 1 ? lab(t("d_pipe"), '<select id="peSel">' + MEM.pipelines.map(function(x) {
      return '<option value="' + x.id + '"' + (x.id === p.id ? " selected" : "") + ">" + esc(x.name) + "</option>";
    }).join("") + "</select>") : "") + lab(t("d_pipe_name"), '<input class="inp" id="peName" value="' + esc(p.name) + '">') + '<div class="sub">' + esc(t("d_stages")) + '</div><div id="peSt"></div><button class="btn ghost" id="peAdd">' + ico("plus") + esc(t("d_stage_add")) + '</button><div class="row2"><button class="btn ghost" id="peNew">' + ico("plus") + esc(t("d_pipe_new")) + '</button><button class="btn primary" id="peSave">' + esc(t("save")) + '</button></div><p class="muted small">' + esc(t("d_pipes_hint")) + "</p></div>", { full: true });
    var draw = function() {
      sh.querySelector("#peSt").innerHTML = st.filter(function(x) {
        return !x.deleted;
      }).map(function(x) {
        return '<div class="mrow" data-i="' + st.indexOf(x) + '"><input class="inp" data-sf="name" value="' + esc(x.name) + '" style="flex:1 1 160px"><input class="inp" data-sf="probability" type="number" min="0" max="100" value="' + x.probability + '" style="width:80px" aria-label="%"><select data-sf="kind"><option value="open"' + (x.kind === "open" ? " selected" : "") + ">" + esc(t("d_kind_open")) + '</option><option value="won"' + (x.kind === "won" ? " selected" : "") + ">" + esc(t("d_kind_won")) + '</option><option value="lost"' + (x.kind === "lost" ? " selected" : "") + ">" + esc(t("d_kind_lost")) + '</option></select><button class="btn small ghost" data-up="1" aria-label="up">&#8593;</button><button class="btn small danger" data-rm="1" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button></div>";
      }).join("");
      $$("#peSt .mrow", sh).forEach(function(row) {
        var x = st[+row.dataset.i];
        $$("[data-sf]", row).forEach(function(inp) {
          inp.onchange = function() {
            x[inp.dataset.sf] = inp.dataset.sf === "probability" ? Math.max(0, Math.min(100, +inp.value || 0)) : inp.value;
          };
        });
        row.querySelector("[data-rm]").onclick = function() {
          if (DL.list.some(function(d) {
            return d.stage_id === x.id;
          })) {
            toast(t("d_stage_busy"));
            return;
          }
          x.deleted = true;
          draw();
        };
        row.querySelector("[data-up]").onclick = function() {
          var vis = st.filter(function(z) {
            return !z.deleted;
          }), i = vis.indexOf(x);
          if (i > 0) {
            var tmp = vis[i - 1].sort;
            vis[i - 1].sort = x.sort;
            x.sort = tmp;
            if (vis[i - 1].sort === x.sort) x.sort--;
            st.sort(function(a, b) {
              return a.sort - b.sort;
            });
            draw();
          }
        };
      });
    };
    draw();
    var sel = sh.querySelector("#peSel");
    if (sel) sel.onchange = async function() {
      var v = this.value;
      await closeTop();
      openPipeEdit(v);
    };
    sh.querySelector("#peAdd").onclick = function() {
      var mx = st.reduce(function(a, x) {
        return Math.max(a, x.sort);
      }, 0);
      st.push({ id: uuid(), org_id: AU.me.org_id, pipeline_id: p.id, name: t("d_stage_new"), sort: mx + 1, probability: 50, kind: "open", deleted: false });
      draw();
    };
    sh.querySelector("#peNew").onclick = async function() {
      var nm = await ask(t("d_pipe_name"), { input: "", ok: t("save") });
      if (!nm || !nm.trim()) return;
      var np = { id: uuid(), org_id: AU.me.org_id, name: nm.trim(), sort: MEM.pipelines.length, deleted: false };
      var defs = [[t("d_def_new"), 10, "open"], [t("d_def_talk"), 50, "open"], [t("d_def_offer"), 70, "open"], [t("d_def_won"), 100, "won"], [t("d_def_lost"), 0, "lost"]];
      await genPut("pipelines", [np]);
      await genPut("stages", defs.map(function(d0, i) {
        return { id: uuid(), org_id: AU.me.org_id, pipeline_id: np.id, name: d0[0], sort: i, probability: d0[1], kind: d0[2], deleted: false };
      }));
      await loadMemCache();
      DL.pipe = np.id;
      await closeTop();
      openPipeEdit(np.id);
    };
    sh.querySelector("#peSave").onclick = async function() {
      if (!st.some(function(x) {
        return !x.deleted && x.kind === "won";
      }) || !st.some(function(x) {
        return !x.deleted && x.kind === "lost";
      })) {
        toast(t("d_need_wonlost"));
        return;
      }
      st.forEach(function(x, i) {
        x.sort = i;
      });
      var nm = sh.querySelector("#peName").value.trim();
      if (nm && nm !== p.name) {
        p.name = nm;
        await genPut("pipelines", [p]);
      }
      await genPut("stages", st);
      await loadMemCache();
      toast(t("c_saved"));
      await closeTop();
      if (S.tab === "deals") renderDeals();
    };
  }
  var RP = { month: "", pipe: "", who: "" };
  function monthKey(iso) {
    return iso ? String(iso).slice(0, 7) : "";
  }
  function monthsBack(n) {
    var out = [], d = /* @__PURE__ */ new Date();
    d.setDate(1);
    for (var i = 0; i < n; i++) {
      out.push(d.getFullYear() + "-" + pad(d.getMonth() + 1));
      d.setMonth(d.getMonth() - 1);
    }
    return out;
  }
  function monthName(m) {
    if (!m) return t("r_all");
    var d = /* @__PURE__ */ new Date(m + "-01T00:00:00");
    try {
      return d.toLocaleDateString(LANG === "uz" ? "uz-Latn" : LANG, { month: "long", year: "numeric" });
    } catch (e) {
      return m;
    }
  }
  async function computeReport() {
    await loadDealsCache();
    var plans = (await reqP(db.transaction("plans").objectStore("plans").getAll())).filter(function(x) {
      return !x.deleted;
    });
    var tasks = await openTasksAll(), td = today();
    var p = MEM.pipelines.filter(function(x) {
      return x.id === RP.pipe;
    })[0] || curPipe();
    var st = p ? stagesOf(p.id) : [];
    var who = isAdmin() || ROLE() === "viewer" ? RP.who : AU.uid;
    var deals = DL.list.filter(function(d) {
      return (!p || d.pipeline_id === p.id) && (!who || d.owner_id === who);
    });
    var kind = function(d) {
      var s = stageById(d.stage_id);
      return s ? s.kind : "open";
    };
    var inMonth = function(d) {
      return !RP.month || monthKey(d.closed_at) === RP.month;
    };
    var funnel = st.filter(function(s) {
      return s.kind === "open";
    }).map(function(s) {
      var ds = deals.filter(function(d) {
        return d.stage_id === s.id;
      });
      return { id: s.id, name: s.name, n: ds.length, uzs: ds.filter(function(d) {
        return d.currency !== "USD";
      }).reduce(function(a, d) {
        return a + (+d.amount || 0);
      }, 0), usd: ds.filter(function(d) {
        return d.currency === "USD";
      }).reduce(function(a, d) {
        return a + (+d.amount || 0);
      }, 0) };
    });
    var won = deals.filter(function(d) {
      return kind(d) === "won" && inMonth(d);
    }), lost = deals.filter(function(d) {
      return kind(d) === "lost" && inMonth(d);
    });
    var sum = function(arr, cur) {
      return arr.filter(function(d) {
        return (d.currency || "UZS") === cur;
      }).reduce(function(a, d) {
        return a + (+d.amount || 0);
      }, 0);
    };
    var reasons = {};
    lost.forEach(function(d) {
      var r = (d.lost_reason || "\u2014").trim().toLowerCase();
      reasons[r] = (reasons[r] || 0) + 1;
    });
    var month = RP.month || monthsBack(1)[0];
    var people = activeMembers().filter(function(m) {
      return m.role !== "viewer" && (!who || m.user_id === who);
    });
    var pf = people.map(function(m) {
      var mine = DL.list.filter(function(d) {
        return d.owner_id === m.user_id && kind(d) === "won" && monthKey(d.closed_at) === month;
      });
      var plan = function(cur) {
        var x = plans.filter(function(pl) {
          return pl.user_id === m.user_id && String(pl.month).slice(0, 7) === month && pl.currency === cur;
        })[0];
        return x ? +x.amount : 0;
      };
      return {
        uid: m.user_id,
        name: m.display_name || m.email,
        planUzs: plan("UZS"),
        factUzs: sum(mine, "UZS"),
        planUsd: plan("USD"),
        factUsd: sum(mine, "USD"),
        overdue: tasks.filter(function(x) {
          return x.assigneeId === m.user_id && x.due < td;
        }).length
      };
    });
    var overdueAll = tasks.filter(function(x) {
      return x.due < td && (!who || x.assigneeId === who || !x.assigneeId && x.createdUid === who);
    });
    return {
      pipe: p,
      funnel,
      won: won.length,
      lost: lost.length,
      wonUzs: sum(won, "UZS"),
      wonUsd: sum(won, "USD"),
      lostUzs: sum(lost, "UZS"),
      lostUsd: sum(lost, "USD"),
      conv: won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) : null,
      reasons,
      pf,
      month,
      overdue: overdueAll.length,
      overdueList: overdueAll.slice(0, 10)
    };
  }
  async function renderStats() {
    var v = $("#v-stats");
    if (!ROLE()) {
      return renderCompanyStats(v);
    }
    var R = await computeReport();
    window.__report = R;
    var maxN = Math.max.apply(null, [1].concat(R.funnel.map(function(f) {
      return f.n;
    })));
    var admin = isAdmin() || ROLE() === "viewer";
    var cur2 = function(u, d) {
      return [u ? money(u, "UZS") : "", d ? money(d, "USD") : ""].filter(Boolean).join(" \xB7 ") || "0";
    };
    var pct = function(f, p) {
      return p ? Math.round(f / p * 100) + "%" : "\u2014";
    };
    v.innerHTML = '<div class="pad"><h2>' + esc(t("r_title")) + '</h2><div class="dhead rhead"><select id="rMonth"><option value="">' + esc(t("r_all")) + "</option>" + monthsBack(12).map(function(m) {
      return '<option value="' + m + '"' + (m === RP.month ? " selected" : "") + ">" + esc(monthName(m)) + "</option>";
    }).join("") + "</select>" + (MEM.pipelines.length > 1 ? '<select id="rPipe">' + MEM.pipelines.map(function(x) {
      return '<option value="' + x.id + '"' + (R.pipe && x.id === R.pipe.id ? " selected" : "") + ">" + esc(x.name) + "</option>";
    }).join("") + "</select>" : "") + (admin ? '<select id="rWho"><option value="">' + esc(t("r_all")) + "</option>" + activeMembers().filter(function(m) {
      return m.role !== "viewer";
    }).map(function(m) {
      return '<option value="' + m.user_id + '"' + (m.user_id === RP.who ? " selected" : "") + ">" + esc(m.display_name || m.email) + "</option>";
    }).join("") + "</select>" : "") + '</div><div class="kpis"><div data-k="won"><b>' + R.won + "</b><span>" + esc(t("r_won")) + "<br>" + esc(cur2(R.wonUzs, R.wonUsd)) + '</span></div><div data-k="lost"><b>' + R.lost + "</b><span>" + esc(t("r_lost")) + "<br>" + esc(cur2(R.lostUzs, R.lostUsd)) + '</span></div><div data-k="conv"><b>' + (R.conv == null ? "\u2014" : R.conv + "%") + "</b><span>" + esc(t("r_conv")) + '</span></div><div data-k="overdue" class="' + (R.overdue ? "bad" : "") + '"><b>' + R.overdue + "</b><span>" + esc(t("r_overdue")) + "</span></div></div><h3>" + esc(t("r_funnel")) + (R.pipe ? " \xB7 " + esc(R.pipe.name) : "") + '</h3><div class="bars">' + R.funnel.map(function(f, i) {
      return '<div class="bar" data-stage="' + esc(f.name) + '" data-n="' + f.n + '"><span class="bl">' + esc(f.name) + '</span><span class="bt"><i class="s' + Math.min(4, i + 1) + '" style="width:' + Math.max(1, f.n / maxN * 100) + '%"></i></span><span class="bn">' + f.n + " <small>" + esc(cur2(f.uzs, f.usd)) + "</small></span></div>";
    }).join("") + "</div><h3>" + esc(t("r_plan")) + " \xB7 " + esc(monthName(R.month)) + "</h3>" + (R.pf.length ? '<div class="tblwrap"><table class="tbl" id="rPlan"><thead><tr><th>' + esc(t("r_manager")) + "</th><th>" + esc(t("r_plan_col")) + "</th><th>" + esc(t("r_fact")) + "</th><th>%</th><th>" + esc(t("r_overdue")) + "</th></tr></thead><tbody>" + R.pf.map(function(r) {
      return '<tr data-uid="' + r.uid + '"><td>' + esc(r.name) + "</td><td>" + (isAdmin() ? '<button class="linkbtn" data-plan="' + r.uid + '">' + esc(cur2(r.planUzs, r.planUsd)) + "</button>" : esc(cur2(r.planUzs, r.planUsd))) + '</td><td class="fact">' + esc(cur2(r.factUzs, r.factUsd)) + "</td><td>" + esc(r.planUzs ? pct(r.factUzs, r.planUzs) : pct(r.factUsd, r.planUsd)) + '</td><td class="' + (r.overdue ? "red" : "") + '">' + r.overdue + "</td></tr>";
    }).join("") + "</tbody></table></div>" : '<p class="muted">' + esc(t("r_none")) + "</p>") + (Object.keys(R.reasons).length ? "<h3>" + esc(t("r_reasons")) + "</h3>" + Object.keys(R.reasons).sort(function(a, b) {
      return R.reasons[b] - R.reasons[a];
    }).slice(0, 8).map(function(k) {
      return '<div class="kv"><span>' + R.reasons[k] + "</span>" + esc(k) + "</div>";
    }).join("") : "") + (R.overdueList.length ? '<h3 class="red">' + esc(t("r_overdue")) + "</h3>" + R.overdueList.map(function(x) {
      return '<div class="kv link"' + (x.cid ? ' data-act="open" data-id="' + x.cid + '"' : x.dealId ? ' data-act="dealOpen" data-did="' + x.dealId + '"' : "") + '><span class="red">' + fmtDate(x.due) + "</span>" + esc(x.title) + (x.assigneeId ? " \xB7 " + esc(memberName(x.assigneeId)) : "") + "</div>";
    }).join("") : "") + '<div id="rLb"></div><details class="invs"><summary>' + esc(t("r_companies")) + '</summary><div id="rCo"></div></details></div>';
    var on = function(id, k) {
      var el = v.querySelector(id);
      if (el) el.onchange = function() {
        RP[k] = this.value;
        renderStats();
      };
    };
    on("#rMonth", "month");
    on("#rPipe", "pipe");
    on("#rWho", "who");
    $$("[data-plan]", v).forEach(function(b) {
      b.onclick = function() {
        setPlan(b.dataset.plan, R.month);
      };
    });
    renderCompanyStats(v.querySelector("#rCo"), true);
    leaderboardHtml().then(function(h) {
      var el = v.querySelector("#rLb");
      if (!el) return;
      el.innerHTML = h;
      $$("[data-lb]", el).forEach(function(b) {
        b.onclick = function() {
          LB.period = b.dataset.lb;
          renderStats();
        };
      });
    });
  }
  async function setPlan(uid, month) {
    var name = memberName(uid);
    var cur = await ask(t("d_currency"), { input: "UZS", ok: "OK" });
    if (!cur) return;
    cur = /usd|\$/i.test(cur) ? "USD" : "UZS";
    var plans = (await reqP(db.transaction("plans").objectStore("plans").getAll())).filter(function(x) {
      return !x.deleted;
    });
    var ex = plans.filter(function(pl) {
      return pl.user_id === uid && String(pl.month).slice(0, 7) === month && pl.currency === cur;
    })[0];
    var v = await ask(t("r_plan_q", { m: monthName(month), n: name, c: cur }), { input: ex ? String(ex.amount) : "", ok: t("save") });
    if (v == null) return;
    var amt = Math.max(0, +String(v).replace(/[^\d.]/g, "") || 0);
    var row = ex || { id: uuid(), org_id: AU.me.org_id, user_id: uid, month: month + "-01", currency: cur, deleted: false };
    row.amount = amt;
    await genPut("plans", [row]);
    toast(t("c_saved"));
    renderStats();
  }
  async function genAll(store) {
    return (await reqP(db.transaction(store).objectStore(store).getAll())).filter(function(x) {
      return !x.deleted;
    });
  }
  async function orgSettings() {
    var a = await genAll("org_settings");
    return a[0] || { id: AU.me && AU.me.org_id, org_id: AU.me && AU.me.org_id, quote_days: 7 };
  }
  async function openProducts() {
    var list = (await genAll("products")).sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    var admin = isAdmin();
    var sh = openSheet(sheetHead(t("pr_title")) + '<div class="form">' + (admin ? '<button class="btn primary wide big" data-pr="">' + ico("plus") + esc(t("pr_add")) + "</button>" : '<p class="muted small">' + esc(t("pr_ro")) + "</p>") + (list.length ? list.map(function(p) {
      return '<button class="mrow mbtn" data-pr="' + p.id + '"' + (admin ? "" : " disabled") + '><span class="mmain"><b>' + esc(p.name) + (p.active === false ? " \xB7 " + esc(t("pr_off")) : "") + '</b><span class="muted small">' + esc([p.sku, p.unit].filter(Boolean).join(" \xB7 ")) + '</span></span><span class="rchip">' + esc(money(p.price, p.currency)) + "</span></button>";
    }).join("") : '<p class="muted">' + esc(t("pr_empty")) + "</p>") + "</div>", { full: true });
    $$("[data-pr]", sh).forEach(function(b) {
      b.onclick = function() {
        if (!admin) return;
        editProduct(list.filter(function(p) {
          return p.id === b.dataset.pr;
        })[0], function() {
          closeTop().then(openProducts);
        });
      };
    });
  }
  function editProduct(p, done) {
    p = p || { id: uuid(), org_id: AU.me.org_id, name: "", sku: "", unit: t("pr_unit_def"), price: 0, currency: "UZS", active: true, deleted: false };
    var sh = openSheet(sheetHead(p.name || t("pr_add")) + '<div class="form">' + lab(t("pr_name"), '<input class="inp" id="pN" value="' + esc(p.name) + '">') + '<div class="row2">' + lab(t("pr_price"), '<input class="inp" id="pP" type="number" min="0" step="1000" value="' + esc(p.price) + '">') + lab(t("d_currency"), '<select id="pC"><option' + (p.currency === "UZS" ? " selected" : "") + ">UZS</option><option" + (p.currency === "USD" ? " selected" : "") + ">USD</option></select>") + '</div><div class="row2">' + lab(t("pr_unit"), '<input class="inp" id="pU" value="' + esc(p.unit) + '">') + lab(t("pr_sku"), '<input class="inp" id="pS" value="' + esc(p.sku || "") + '">') + "</div>" + chk("pA", t("pr_active"), p.active !== false) + '<div class="row2"><button class="btn danger" id="pDel">' + esc(t("del")) + '</button><button class="btn primary" id="pSave">' + esc(t("save")) + "</button></div></div>");
    sh.querySelector("#pSave").onclick = async function() {
      p.name = sh.querySelector("#pN").value.trim();
      if (!p.name) return;
      p.price = Math.max(0, +sh.querySelector("#pP").value || 0);
      p.currency = sh.querySelector("#pC").value;
      p.unit = sh.querySelector("#pU").value.trim() || t("pr_unit_def");
      p.sku = sh.querySelector("#pS").value.trim();
      p.active = sh.querySelector("#pA").checked;
      await genPut("products", [p]);
      toast(t("c_saved"));
      await closeTop();
      done();
    };
    sh.querySelector("#pDel").onclick = async function() {
      p.deleted = true;
      await genPut("products", [p]);
      await closeTop();
      done();
    };
  }
  async function openSeller() {
    var o = await orgSettings(), f = ["legal_name", "inn", "address", "phone", "email", "bank", "director"];
    var sh = openSheet(sheetHead(t("os_title")) + '<div class="form">' + f.map(function(k) {
      return lab(t("os_" + k), k === "bank" || k === "address" ? '<textarea class="inp" rows="2" data-os="' + k + '">' + esc(o[k] || "") + "</textarea>" : '<input class="inp" data-os="' + k + '" value="' + esc(o[k] || "") + '">');
    }).join("") + lab(t("os_terms"), '<textarea class="inp" rows="3" data-os="quote_terms">' + esc(o.quote_terms || "") + "</textarea>") + lab(t("os_days"), '<input class="inp" type="number" min="1" max="365" data-os="quote_days" value="' + (o.quote_days || 7) + '">') + '<button class="btn primary wide big" id="osSave">' + esc(t("save")) + "</button></div>", { full: true });
    sh.querySelector("#osSave").onclick = async function() {
      $$("[data-os]", sh).forEach(function(el) {
        o[el.dataset.os] = el.dataset.os === "quote_days" ? Math.max(1, Math.min(365, +el.value || 7)) : el.value.trim();
      });
      o.id = o.org_id = AU.me.org_id;
      await genPut("org_settings", [o]);
      toast(t("c_saved"));
      closeTop();
    };
  }
  async function openQuote(deal, quote) {
    var products = (await genAll("products")).filter(function(p) {
      return p.active !== false;
    });
    var o = await orgSettings();
    var q = quote ? JSON.parse(JSON.stringify(quote)) : {
      id: uuid(),
      org_id: AU.me.org_id,
      deal_id: deal.id,
      owner_id: deal.owner_id || AU.uid,
      number: "\u041A\u041F-" + ymd(/* @__PURE__ */ new Date()).slice(2).replace(/-/g, "") + "-" + pad((/* @__PURE__ */ new Date()).getHours()) + pad((/* @__PURE__ */ new Date()).getMinutes()),
      items: [],
      currency: deal.currency || "UZS",
      total: 0,
      valid_until: addDays(today(), o.quote_days || 7),
      note: "",
      deleted: false
    };
    if (!q.items.length && products.length === 0 && deal.amount) q.items.push({ name: deal.title, unit: t("pr_unit_def"), qty: 1, price: +deal.amount, discount: 0 });
    var sh = openSheet(sheetHead(t("q_title") + " " + q.number) + '<div class="form" id="qBody"></div>', { full: true });
    var draw = function() {
      var sum = quoteTotal(q);
      sh.querySelector("#qBody").innerHTML = (products.length ? lab(t("q_add_product"), '<select id="qProd"><option value="">' + esc(t("q_pick")) + "</option>" + products.map(function(p) {
        return '<option value="' + p.id + '">' + esc(p.name + " \u2014 " + money(p.price, p.currency)) + "</option>";
      }).join("") + "</select>") : '<p class="muted small">' + esc(t("q_no_products")) + "</p>") + '<div class="qitems">' + q.items.map(function(it, i) {
        return '<div class="qitem" data-i="' + i + '"><input class="inp" data-qf="name" value="' + esc(it.name) + '"><div class="row3"><input class="inp" data-qf="qty" type="number" min="0" step="any" value="' + it.qty + '" aria-label="' + esc(t("q_qty")) + '"><input class="inp" data-qf="price" type="number" min="0" step="any" value="' + it.price + '" aria-label="' + esc(t("pr_price")) + '"><input class="inp" data-qf="discount" type="number" min="0" max="100" value="' + (it.discount || 0) + '" aria-label="%"></div><div class="qline"><span class="qls">' + esc(it.unit || "") + " \xB7 " + esc(t("q_line", { n: money(lineSum(it), q.currency) })) + '</span><button class="btn small danger" data-qrm="' + i + '">' + ico("x") + "</button></div></div>";
      }).join("") + '</div><button class="btn ghost" id="qLine">' + ico("plus") + esc(t("q_add_line")) + '</button><div class="row2">' + lab(t("d_currency"), '<select id="qCur"><option' + (q.currency === "UZS" ? " selected" : "") + ">UZS</option><option" + (q.currency === "USD" ? " selected" : "") + ">USD</option></select>") + lab(t("q_valid"), '<input class="inp" type="date" id="qValid" value="' + esc(q.valid_until || "") + '">') + "</div>" + lab(t("fld_comment"), '<textarea class="inp" id="qNote" rows="2">' + esc(q.note || "") + "</textarea>") + '<div class="qtotal">' + esc(t("q_total")) + ': <b id="qSum">' + esc(money(sum, q.currency)) + "</b></div>" + (!o.legal_name ? '<p class="warn small">' + esc(t("q_no_seller")) + "</p>" : "") + '<button class="btn primary wide big" id="qGo"' + (q.items.length ? "" : " disabled") + ">" + esc(t("q_make")) + "</button>";
      var ps = sh.querySelector("#qProd");
      if (ps) ps.onchange = function() {
        var p = products.filter(function(x) {
          return x.id === ps.value;
        })[0];
        if (!p) return;
        q.items.push({ product_id: p.id, name: p.name, unit: p.unit, qty: 1, price: +p.price, discount: 0 });
        if (q.items.length === 1) q.currency = p.currency;
        draw();
      };
      $$(".qitem", sh).forEach(function(row) {
        var it = q.items[+row.dataset.i];
        $$("[data-qf]", row).forEach(function(inp) {
          inp.oninput = function() {
            it[inp.dataset.qf] = inp.dataset.qf === "name" ? inp.value : inp.dataset.qf === "discount" ? Math.min(100, Math.max(0, +inp.value || 0)) : Math.max(0, +inp.value || 0);
            row.querySelector(".qls").textContent = (it.unit || "") + " \xB7 " + t("q_line", { n: money(lineSum(it), q.currency) });
            sh.querySelector("#qSum").textContent = money(quoteTotal(q), q.currency);
            var g = sh.querySelector("#qGo");
            if (g) g.disabled = !q.items.length;
          };
        });
      });
      $$("[data-qrm]", sh).forEach(function(b) {
        b.onclick = function() {
          q.items.splice(+b.dataset.qrm, 1);
          draw();
        };
      });
      sh.querySelector("#qLine").onclick = function() {
        q.items.push({ name: "", unit: t("pr_unit_def"), qty: 1, price: 0, discount: 0 });
        draw();
      };
      sh.querySelector("#qCur").onchange = function() {
        q.currency = this.value;
        draw();
      };
      sh.querySelector("#qValid").onchange = function() {
        q.valid_until = this.value;
      };
      sh.querySelector("#qNote").onchange = function() {
        q.note = this.value;
      };
      var go = sh.querySelector("#qGo");
      if (go) go.onclick = async function() {
        q.items = q.items.filter(function(it) {
          return it.name && it.qty > 0;
        });
        q.total = quoteTotal(q);
        q.updated_by = myName();
        await genPut("quotes", [q]);
        deal.amount = q.total;
        deal.currency = q.currency;
        deal.updated_by = myName();
        await genPut("deals", [deal]);
        await loadDealsCache();
        await addTouch({ cid: cidOfUid(deal.company_id) || 0, dealId: deal.id, kind: "email", text: t("q_log", { n: q.number, s: money(q.total, q.currency) }) });
        await closeTop();
        await shareQuotePdf(q, deal);
      };
    };
    draw();
  }
  function lineSum(it) {
    return Math.round((+it.qty || 0) * (+it.price || 0) * (1 - Math.min(100, +it.discount || 0) / 100) * 100) / 100;
  }
  function quoteTotal(q) {
    return Math.round(q.items.reduce(function(a, it) {
      return a + lineSum(it);
    }, 0) * 100) / 100;
  }
  var PDFLIB = null;
  function loadScript(src) {
    return new Promise(function(res, rej) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = function() {
        rej(new Error("load " + src));
      };
      document.head.appendChild(s);
    });
  }
  async function fileB64(path) {
    var buf = await (await fetch(path)).arrayBuffer(), bin = "", u = new Uint8Array(buf);
    for (var i = 0; i < u.length; i += 32768) bin += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return btoa(bin);
  }
  async function pdfLib() {
    if (!PDFLIB) {
      if (!window.jspdf) await loadScript("vendor/jspdf.umd.min.js");
      PDFLIB = { reg: await fileB64("assets/pdf/Manrope-Regular.ttf"), bold: await fileB64("assets/pdf/Manrope-Bold.ttf"), logo: "data:image/png;base64," + await fileB64("assets/savdex-logo-160.png") };
    }
    return PDFLIB;
  }
  async function quotePdf(q, deal) {
    var L = await pdfLib(), o = await orgSettings();
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var fix = function(v) {
      return typeof v === "string" ? v.replace(/ʻ/g, "\u2018").replace(/ʼ/g, "\u2019") : Array.isArray(v) ? v.map(fix) : v;
    };
    var _text = doc.text.bind(doc);
    doc.text = function(txt, x, y2, o2) {
      return _text(fix(txt), x, y2, o2);
    };
    var _split = doc.splitTextToSize.bind(doc);
    doc.splitTextToSize = function(txt, w, o2) {
      return _split(fix(txt), w, o2);
    };
    doc.addFileToVFS("Manrope-Regular.ttf", L.reg);
    doc.addFont("Manrope-Regular.ttf", "Manrope", "normal");
    doc.addFileToVFS("Manrope-Bold.ttf", L.bold);
    doc.addFont("Manrope-Bold.ttf", "Manrope", "bold");
    var W = 210, M = 16, y = 16, teal = [11, 124, 147];
    var cid = cidOfUid(deal.company_id), comp = cid ? await getCompany(cid) : null;
    var ctc = DL.contacts.filter(function(c) {
      return c.id === deal.contact_id;
    })[0];
    try {
      doc.addImage(L.logo, "PNG", M, y - 2, 18, 18);
    } catch (e) {
    }
    doc.setFont("Manrope", "bold");
    doc.setFontSize(13);
    doc.text(o.legal_name || AU.me && AU.me.org_name || "SavdEx", M + 22, y + 4);
    doc.setFont("Manrope", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80);
    doc.text(doc.splitTextToSize([o.inn ? t("os_inn") + ": " + o.inn : "", o.address, [o.phone, o.email].filter(Boolean).join(" \xB7 ")].filter(Boolean).join("\n"), W - 2 * M - 22), M + 22, y + 9);
    y += 26;
    doc.setDrawColor(teal[0], teal[1], teal[2]);
    doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y);
    y += 9;
    doc.setTextColor(7, 54, 66);
    doc.setFont("Manrope", "bold");
    doc.setFontSize(16);
    doc.text(t("q_pdf_title"), M, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("Manrope", "normal");
    doc.setTextColor(60);
    doc.text(t("q_pdf_no", { n: q.number, d: fmtDate(today()) }), M, y);
    y += 8;
    doc.setTextColor(20);
    doc.setFont("Manrope", "bold");
    doc.text(t("q_pdf_to") + ":", M, y);
    doc.setFont("Manrope", "normal");
    doc.text(doc.splitTextToSize([comp ? comp.name : deal.title, ctc ? ctc.name + (ctc.position ? ", " + ctc.position : "") : "", comp && comp.phone ? comp.phone : ""].filter(Boolean).join("\n"), W - 2 * M - 30), M + 30, y);
    y += 16;
    var cols = [{ k: "#", w: 8 }, { k: t("q_col_name"), w: 74 }, { k: t("q_col_unit"), w: 14 }, { k: t("q_qty"), w: 16 }, { k: t("pr_price"), w: 26 }, { k: "%", w: 10 }, { k: t("q_col_sum"), w: 30 }];
    var head = function() {
      doc.setFillColor(240, 249, 251);
      doc.rect(M, y - 4.5, W - 2 * M, 7, "F");
      doc.setFont("Manrope", "bold");
      doc.setFontSize(8.5);
      var x = M + 1;
      cols.forEach(function(c) {
        doc.text(String(c.k), x, y);
        x += c.w;
      });
      y += 6;
      doc.setFont("Manrope", "normal");
    };
    head();
    var nm = function(v) {
      return num(Math.round(v * 100) / 100).replace(".", ",");
    };
    q.items.forEach(function(it, i) {
      var name = doc.splitTextToSize(String(it.name), cols[1].w - 2), h = Math.max(5, name.length * 4);
      if (y + h > 270) {
        doc.addPage();
        y = 20;
        head();
      }
      var x = M + 1, vals = [String(i + 1), name, it.unit || "", nm(+it.qty), nm(+it.price), String(+it.discount || 0), nm(lineSum(it))];
      vals.forEach(function(v, j) {
        doc.text(v, x, y);
        x += cols[j].w;
      });
      y += h;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(M, y - 3, W - M, y - 3);
      y += 1.5;
    });
    y += 3;
    doc.setFont("Manrope", "bold");
    doc.setFontSize(12);
    doc.setTextColor(7, 54, 66);
    doc.text(t("q_total") + ": " + money(quoteTotal(q), q.currency), W - M, y, { align: "right" });
    y += 9;
    doc.setFont("Manrope", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(40);
    if (q.valid_until) {
      doc.text(t("q_pdf_valid", { d: fmtDate(q.valid_until) }), M, y);
      y += 6;
    }
    var tail = [q.note, o.quote_terms].filter(Boolean).join("\n\n");
    if (tail) {
      var tl = doc.splitTextToSize(tail, W - 2 * M);
      if (y + tl.length * 4.5 > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(tl, M, y);
      y += tl.length * 4.5 + 4;
    }
    if (o.bank) {
      var bl = doc.splitTextToSize(t("os_bank") + ": " + o.bank, W - 2 * M);
      doc.setTextColor(90);
      doc.text(bl, M, y);
      y += bl.length * 4.5 + 4;
    }
    doc.setTextColor(20);
    doc.text(t("q_pdf_manager", { n: myName(), p: S.settings.phone || "" }), M, Math.max(y + 4, 262));
    if (o.director) doc.text(t("os_director") + ": " + o.director + "  ______________", M, Math.max(y + 10, 268));
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text("Sotuvdesc \xB7 CRM SavdEx", W - M, 288, { align: "right" });
    return doc;
  }
  async function shareQuotePdf(q, deal) {
    busy(t("working"), 0.5);
    try {
      var doc = await quotePdf(q, deal), name = q.number.replace(/[^\wА-Яа-я-]+/g, "_") + ".pdf";
      window.__lastPdf = { name, size: doc.output("arraybuffer").byteLength, pages: doc.getNumberOfPages(), total: quoteTotal(q) };
      var FS = PLUG.Filesystem, SH = PLUG.Share;
      if (NATIVE && FS && SH) {
        var b64 = doc.output("datauristring").split(",")[1];
        await FS.writeFile({ path: "quotes/" + name, data: b64, directory: "CACHE", recursive: true });
        var uri = (await FS.getUri({ path: "quotes/" + name, directory: "CACHE" })).uri;
        busy(null);
        try {
          await SH.share({ title: name, files: [uri], dialogTitle: t("q_share") });
        } catch (e) {
        }
      } else {
        busy(null);
        doc.save(name);
      }
      toast(t("q_done", { n: q.number }));
    } catch (e) {
      busy(null);
      toast(t("err", { e: e.message || e }));
      console.error(e);
    }
  }
  async function quotesOfDealHtml(d) {
    var qs = (await genAll("quotes")).filter(function(q) {
      return q.deal_id === d.id;
    }).sort(function(a, b) {
      return (b.created_at || "") < (a.created_at || "") ? -1 : 1;
    });
    return "<section><h3>" + esc(t("q_list")) + "</h3>" + qs.map(function(q) {
      return '<div class="kv link" data-qopen="' + q.id + '"><span>' + esc(money(q.total, q.currency)) + "</span>" + esc(q.number) + (q.valid_until ? " \xB7 " + esc(t("q_valid")) + " " + fmtDate(q.valid_until) : "") + "</div>";
    }).join("") + (canWrite(d) ? '<button class="btn primary" data-qnew="1">' + ico("plus") + esc(t("q_make_btn")) + "</button>" : "") + "</section>";
  }
  async function myGoal() {
    var g = (await genAll("goals")).filter(function(x) {
      return x.user_id === AU.uid;
    })[0];
    return g || { id: uuid(), org_id: AU.me && AU.me.org_id, user_id: AU.uid, day_calls: 20, day_meetings: 2, deleted: false, _new: 1 };
  }
  async function todayCounts() {
    var start = /* @__PURE__ */ new Date();
    start.setHours(0, 0, 0, 0);
    var all = await reqP(db.transaction("touches").objectStore("touches").getAll());
    var mine = all.filter(function(x) {
      return x.ts >= start.getTime() && (!AU.uid || x.authorId === AU.uid || !x.authorId && x.author === myName());
    });
    return { calls: mine.filter(function(x) {
      return x.kind === "call";
    }).length, meetings: mine.filter(function(x) {
      return x.kind === "meeting";
    }).length };
  }
  function ring(val, goal, label) {
    var pct = goal ? Math.min(1, val / goal) : 0, r = 26, c = 2 * Math.PI * r;
    return '<div class="ring"><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" class="rbg"/><circle cx="32" cy="32" r="' + r + '" class="rfg" stroke-dasharray="' + (c * pct).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 32 32)"/></svg><b>' + val + "<small>/" + goal + "</small></b><span>" + esc(label) + "</span></div>";
  }
  async function goalHtml() {
    if (!ROLE() || ROLE() === "viewer") return "";
    var g = await myGoal(), n = await todayCounts();
    window.__goal = { calls: n.calls, meetings: n.meetings, gc: g.day_calls, gm: g.day_meetings };
    return '<div class="goals" data-act="goalEdit" title="' + esc(t("g_edit")) + '">' + ring(n.calls, g.day_calls, t("g_calls")) + ring(n.meetings, g.day_meetings, t("g_meetings")) + '<div class="gtxt"><b>' + esc(t("g_today")) + '</b><span class="muted small">' + esc(n.calls >= g.day_calls && n.meetings >= g.day_meetings ? t("g_done") : t("g_left", { c: Math.max(0, g.day_calls - n.calls), m: Math.max(0, g.day_meetings - n.meetings) })) + "</span></div></div>";
  }
  async function editGoal() {
    var g = await myGoal();
    var sh = openSheet(sheetHead(t("g_edit")) + '<div class="form"><div class="row2">' + lab(t("g_calls"), '<input class="inp" id="gC" type="number" min="0" max="500" value="' + g.day_calls + '">') + lab(t("g_meetings"), '<input class="inp" id="gM" type="number" min="0" max="50" value="' + g.day_meetings + '">') + '</div><button class="btn primary wide big" id="gS">' + esc(t("save")) + "</button></div>");
    sh.querySelector("#gS").onclick = async function() {
      g.day_calls = Math.max(0, Math.min(500, +sh.querySelector("#gC").value || 0));
      g.day_meetings = Math.max(0, Math.min(50, +sh.querySelector("#gM").value || 0));
      delete g._new;
      await genPut("goals", [g]);
      await closeTop();
      renderToday();
    };
  }
  var CAL = { off: 0 };
  function weekDays(off) {
    var d = /* @__PURE__ */ new Date();
    d.setHours(0, 0, 0, 0);
    var wd = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - wd + off * 7);
    var out = [];
    for (var i = 0; i < 7; i++) {
      out.push(ymd(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  async function calendarHtml() {
    var days = weekDays(CAL.off), td = today();
    var tasks = (await reqP(db.transaction("tasks").objectStore("tasks").getAll())).filter(function(x) {
      return x.due >= days[0] && x.due <= days[6] && (!AU.uid || isAdmin() || !x.assigneeId || x.assigneeId === AU.uid);
    });
    var start = (/* @__PURE__ */ new Date(days[0] + "T00:00:00")).getTime(), end = (/* @__PURE__ */ new Date(days[6] + "T23:59:59")).getTime();
    var meets = (await reqP(db.transaction("touches").objectStore("touches").getAll())).filter(function(x) {
      return x.kind === "meeting" && x.ts >= start && x.ts <= end && (!AU.uid || isAdmin() || x.authorId === AU.uid);
    });
    var names = t("cal_days").split(",");
    window.__cal = { days, tasks: tasks.length };
    return '<div class="calhead"><button class="btn small ghost" data-cal="-1" aria-label="&lt;">&#8249;</button><b>' + fmtDate(days[0]).slice(0, 5) + " \u2013 " + fmtDate(days[6]) + '</b><button class="btn small ghost" data-cal="1" aria-label="&gt;">&#8250;</button>' + (CAL.off ? '<button class="btn small ghost" data-cal="0">' + esc(t("today_word")) + "</button>" : "") + '</div><div class="cal">' + days.map(function(d, i) {
      var dt = tasks.filter(function(x) {
        return x.due === d;
      }).sort(function(a, b) {
        return a.done - b.done || (a.remindAt || 0) - (b.remindAt || 0);
      });
      var dm = meets.filter(function(x) {
        return ymd(new Date(x.ts)) === d;
      });
      return '<div class="calday' + (d === td ? " now" : "") + (d < td ? " past" : "") + '" data-day="' + d + '"><div class="caldh"><b>' + names[i] + "</b> " + d.slice(8) + "." + d.slice(5, 7) + "</div>" + dt.map(function(x) {
        var e = BYID.get(x.cid);
        return '<div class="calt' + (x.done ? " done" : x.due < td ? " late" : "") + '" draggable="true" data-tid="' + x.id + '"' + (x.cid ? ' data-act="open" data-id="' + x.cid + '"' : x.dealId ? ' data-act="dealOpen" data-did="' + x.dealId + '"' : "") + ">" + (x.remindAt ? "<i>" + fmtTs(x.remindAt).slice(11) + "</i> " : "") + esc(x.title) + (e ? "<small>" + esc(e.n) + "</small>" : "") + "</div>";
      }).join("") + dm.map(function(x) {
        return '<div class="calm"' + (x.cid ? ' data-act="open" data-id="' + x.cid + '"' : "") + "><i>" + fmtTs(x.ts).slice(11) + "</i> " + esc(t("k_meeting")) + (x.text ? ": " + esc(x.text.slice(0, 40)) : "") + "</div>";
      }).join("") + "</div>";
    }).join("") + "</div>";
  }
  async function moveTaskDay(tid, day) {
    var tx = db.transaction("tasks", "readwrite"), s = tx.objectStore("tasks");
    var x = await reqP(s.get(+tid));
    if (!x || x.due === day) return;
    var delta = /* @__PURE__ */ new Date(day + "T00:00:00") - /* @__PURE__ */ new Date(x.due + "T00:00:00");
    x.due = day;
    if (x.remindAt) x.remindAt += delta;
    x.pend = 1;
    s.put(x);
    await txDone(tx);
    if (x.cid) await recomputeDue(x.cid);
    scheduleSync();
    scheduleReminders();
    toast(t("cal_moved", { d: fmtDate(day) }));
    renderToday();
  }
  function bindCalendar(v) {
    $$("[data-cal]", v).forEach(function(b) {
      b.onclick = function() {
        var n = +b.dataset.cal;
        CAL.off = n === 0 ? 0 : CAL.off + n;
        renderToday();
      };
    });
    var drag = null;
    v.addEventListener("dragstart", function(e) {
      var c = e.target.closest(".calt");
      if (c) {
        drag = c.dataset.tid;
        e.dataTransfer.setData("text/plain", drag);
      }
    });
    v.addEventListener("dragover", function(e) {
      if (e.target.closest(".calday")) e.preventDefault();
    });
    v.addEventListener("drop", function(e) {
      var d = e.target.closest(".calday");
      if (!d || !drag) return;
      e.preventDefault();
      var id = drag;
      drag = null;
      moveTaskDay(id, d.dataset.day);
    });
  }
  var LB = { period: "week" };
  async function leaderboardHtml() {
    if (!ROLE() || navigator.onLine === false) return "";
    var now = /* @__PURE__ */ new Date(), from = new Date(now);
    if (LB.period === "week") {
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - (from.getDay() + 6) % 7);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    var rows;
    try {
      rows = await rpc("crm_leaderboard", { p_from: from.toISOString(), p_to: new Date(now.getTime() + 864e5).toISOString() });
    } catch (e) {
      return '<p class="muted small">' + esc(t("lb_offline")) + "</p>";
    }
    window.__lb = rows;
    var sel = '<div class="seg lbseg">' + ["week", "month"].map(function(p) {
      return '<button class="btn small ' + (LB.period === p ? "primary" : "ghost") + '" data-lb="' + p + '">' + esc(t("lb_" + p)) + "</button>";
    }).join("") + "</div>";
    if (!rows || !rows.length) return "<h3>" + esc(t("lb_title")) + "</h3>" + sel + '<p class="muted">' + esc(t("r_none")) + "</p>";
    var cur2 = function(u, d) {
      return [+u ? money(u, "UZS") : "", +d ? money(d, "USD") : ""].filter(Boolean).join(" \xB7 ") || "0";
    };
    if (rows.length === 1 && rows[0].user_id === AU.uid && !(isAdmin() || ROLE() === "viewer")) {
      var r = rows[0];
      return "<h3>" + esc(t("lb_title")) + "</h3>" + sel + '<div class="lbme"><b class="lbplace">' + r.rank + "</b><div><b>" + esc(t("lb_place", { n: r.rank, m: r.total })) + '</b><span class="muted small">' + esc(t("lb_line", { w: r.won_count, s: cur2(r.won_uzs, r.won_usd), c: r.calls, o: r.overdue })) + "</span></div></div>";
    }
    return "<h3>" + esc(t("lb_title")) + "</h3>" + sel + '<div class="tblwrap"><table class="tbl" id="lbT"><thead><tr><th>#</th><th>' + esc(t("r_manager")) + "</th><th>" + esc(t("r_won")) + "</th><th>" + esc(t("lb_sum")) + "</th><th>" + esc(t("g_calls")) + "</th><th>" + esc(t("k_meeting")) + "</th><th>" + esc(t("r_overdue")) + "</th></tr></thead><tbody>" + rows.map(function(r2) {
      var stuck = r2.overdue >= 3 || +r2.calls === 0 && LB.period === "week";
      return '<tr class="' + (stuck ? "stuckrow" : "") + '"><td>' + r2.rank + "</td><td>" + esc(r2.name) + (stuck ? ' <span class="stale">' + esc(t("lb_stuck")) + "</span>" : "") + "</td><td>" + r2.won_count + "</td><td>" + esc(cur2(r2.won_uzs, r2.won_usd)) + "</td><td>" + r2.calls + "</td><td>" + r2.meetings + '</td><td class="' + (r2.overdue ? "red" : "") + '">' + r2.overdue + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  }
  async function openLeads() {
    if (!isAdmin()) return;
    var sh = openSheet(sheetHead(t("ld_title")) + '<div class="form" id="ldBody"><p class="muted">' + esc(t("loading")) + "</p></div>", { full: true });
    var draw = async function() {
      var list;
      try {
        list = await api("GET", "crm_lead_sources?select=*&deleted=eq.false&order=created_at.asc");
      } catch (e) {
        sh.querySelector("#ldBody").innerHTML = '<p class="red">' + esc(errText(e)) + "</p>";
        return;
      }
      sh.querySelector("#ldBody").innerHTML = '<p class="muted small">' + esc(t("ld_help")) + '</p><button class="btn primary wide big" id="ldNew">' + ico("plus") + esc(t("ld_new")) + "</button>" + list.map(function(s) {
        return '<div class="mrow"><div class="mmain"><b>' + esc(s.name) + (s.active ? "" : " \xB7 " + esc(t("pr_off"))) + '</b><span class="muted small code">' + esc(s.token.slice(0, 10)) + '\u2026</span></div><div class="mact"><button class="btn small ghost" data-ldcopy="' + s.id + '">' + esc(t("ld_code")) + '</button><button class="btn small ' + (s.active ? "danger" : "ghost") + '" data-ldtog="' + s.id + '">' + esc(s.active ? t("ld_off") : t("ld_on")) + "</button></div></div>";
      }).join("");
      sh.querySelector("#ldNew").onclick = async function() {
        var nm = await ask(t("ld_name_q"), { input: t("ld_name_def"), ok: t("save") });
        if (!nm || !nm.trim()) return;
        var tok = "sd_" + uuid().replace(/-/g, "") + uuid().replace(/-/g, "").slice(0, 8);
        try {
          await api("POST", "crm_lead_sources", { org_id: AU.me.org_id, name: nm.trim(), token: tok }, "return=minimal");
        } catch (e) {
          toast(errText(e));
        }
        draw();
      };
      $$("[data-ldtog]", sh).forEach(function(b) {
        b.onclick = async function() {
          var s = list.filter(function(x) {
            return x.id === b.dataset.ldtog;
          })[0];
          try {
            await api("PATCH", "crm_lead_sources?id=eq." + s.id, { active: !s.active }, "return=minimal");
          } catch (e) {
            toast(errText(e));
          }
          draw();
        };
      });
      $$("[data-ldcopy]", sh).forEach(function(b) {
        b.onclick = function() {
          var s = list.filter(function(x) {
            return x.id === b.dataset.ldcopy;
          })[0];
          showLeadSnippet(s);
        };
      });
    };
    draw();
  }
  function leadSnippet(token) {
    return '<!-- Sotuvdesc: \u0444\u043E\u0440\u043C\u0430 \u0437\u0430\u044F\u0432\u043A\u0438. \u0417\u0430\u044F\u0432\u043A\u0430 \u043F\u043E\u043F\u0430\u0434\u0430\u0435\u0442 \u0432 CRM \u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u043C\u0443 \u0441 \u0437\u0430\u0434\u0430\u0447\u0435\u0439 \xAB\u043F\u0435\u0440\u0435\u0437\u0432\u043E\u043D\u0438\u0442\u044C \u0437\u0430 15 \u043C\u0438\u043D\u0443\u0442\xBB. -->\n<form id="sd-lead" style="max-width:420px;font-family:Manrope,system-ui,sans-serif">\n  <input name="name" placeholder="\u0418\u043C\u044F / Ism" required style="display:block;width:100%;margin:6px 0;padding:12px;border:1px solid #8091A7;border-radius:12px">\n  <input name="phone" type="tel" placeholder="+998 __ ___ __ __" required style="display:block;width:100%;margin:6px 0;padding:12px;border:1px solid #8091A7;border-radius:12px">\n  <input name="company" placeholder="\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F / Kompaniya" style="display:block;width:100%;margin:6px 0;padding:12px;border:1px solid #8091A7;border-radius:12px">\n  <textarea name="comment" placeholder="\u0427\u0442\u043E \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u0443\u0435\u0442? / Nima qiziqtiradi?" style="display:block;width:100%;margin:6px 0;padding:12px;border:1px solid #8091A7;border-radius:12px"></textarea>\n  <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">\n  <button style="width:100%;padding:14px;border:0;border-radius:12px;background:#0B7C93;color:#fff;font-weight:800">\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C / Yuborish</button>\n  <p id="sd-lead-msg" style="margin:8px 0;color:#0B7C93"></p>\n</form>\n<script>\ndocument.getElementById("sd-lead").addEventListener("submit", async function (e) {\n  e.preventDefault(); var f = e.target, m = document.getElementById("sd-lead-msg");\n  var r = await fetch("' + baseUrl() + '/rest/v1/rpc/crm_lead_submit", { method: "POST", headers: { "Content-Type": "application/json", apikey: "' + anonKey() + '" },\n    body: JSON.stringify({ p_token: "' + token + '", p_name: f.name.value, p_phone: f.phone.value, p_company: f.company.value, p_comment: f.comment.value, p_source: location.hostname, p_hp: f.website.value }) });\n  m.textContent = r.ok ? "\u0421\u043F\u0430\u0441\u0438\u0431\u043E! \u041C\u044B \u043F\u0435\u0440\u0435\u0437\u0432\u043E\u043D\u0438\u043C \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 15 \u043C\u0438\u043D\u0443\u0442. / Rahmat! 15 daqiqada qo\u2018ng\u2018iroq qilamiz." : "\u041E\u0448\u0438\u0431\u043A\u0430, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435 / Xatolik";\n  if (r.ok) f.reset();\n});\n<\/script>\n';
  }
  function showLeadSnippet(s) {
    var code2 = leadSnippet(s.token);
    var sh = openSheet(sheetHead(s.name) + '<div class="form"><p class="muted small">' + esc(t("ld_snip_help")) + '</p><textarea class="inp code" rows="12" readonly id="ldSnip">' + esc(code2) + '</textarea><button class="btn primary wide" id="ldCp">' + esc(t("tpl_copy")) + "</button></div>", { full: true });
    sh.querySelector("#ldCp").onclick = async function() {
      await copyText(code2);
      toast(t("tpl_copied"));
    };
  }
  var LEADSEEN = {};
  function notifyLeadTasks(rows) {
    rows.forEach(function(r) {
      if (r.author !== "lead" || r.assignee_id !== AU.uid || r.done || LEADSEEN[r.id]) return;
      if (Date.now() - (Date.parse(r.created_at) || 0) > 30 * 6e4) return;
      LEADSEEN[r.id] = 1;
      toast(t("ld_new_toast", { n: r.title }), t("open"), function() {
        if (r.company_id && UIDMAP.get(r.company_id)) openCard(UIDMAP.get(r.company_id));
      });
      try {
        if (!NATIVE && window.Notification && Notification.permission === "granted") new Notification("Sotuvdesc: " + t("ld_new_title"), { body: r.title });
      } catch (e) {
      }
      if (NATIVE && PLUG.LocalNotifications) {
        try {
          PLUG.LocalNotifications.schedule({ notifications: [{ id: Math.abs(hashStr(r.id)) % 2e9, title: t("ld_new_title"), body: r.title, schedule: { at: new Date(Date.now() + 1e3) } }] });
        } catch (e) {
        }
      }
    });
  }
  async function scriptsFor(stageId) {
    var all = await genAll("scripts"), lang = LANG;
    var pick = function(arr) {
      var mine = arr.filter(function(x) {
        return x.lang === lang;
      });
      return mine.length ? mine : arr.filter(function(x) {
        return x.lang === "ru";
      });
    };
    var st = pick(all.filter(function(x) {
      return x.kind === "script" && (!x.stage_id || x.stage_id === stageId);
    }));
    var ob = pick(all.filter(function(x) {
      return x.kind === "objection" && (!x.stage_id || x.stage_id === stageId);
    }));
    var srt = function(a, b) {
      return (a.stage_id ? 0 : 1) - (b.stage_id ? 0 : 1) || a.sort - b.sort;
    };
    return { script: st.sort(srt), objection: ob.sort(srt) };
  }
  async function scriptsHtml(d) {
    if (!ROLE()) return "";
    var sc = await scriptsFor(d.stage_id);
    if (!sc.script.length && !sc.objection.length) return isAdmin() ? '<details class="hint"><summary>' + esc(t("sc_title")) + '</summary><p class="muted small">' + esc(t("sc_empty")) + '</p><button class="btn small ghost" data-act="scriptsEdit">' + esc(t("sc_edit")) + "</button></details>" : "";
    var card = function(x) {
      return '<div class="sccard"><b>' + esc(x.title) + '</b><div class="ht">' + esc(x.body) + "</div></div>";
    };
    return '<details class="hint" open><summary>' + esc(t("sc_title")) + "</summary>" + (sc.script.length ? '<div class="sub">' + esc(t("sc_scripts")) + "</div>" + sc.script.map(card).join("") : "") + (sc.objection.length ? '<div class="sub">' + esc(t("sc_objections")) + "</div>" + sc.objection.map(function(x) {
      return '<details class="obj"><summary>\xAB' + esc(x.title) + '\xBB</summary><div class="ht">' + esc(x.body) + "</div></details>";
    }).join("") : "") + "</details>";
  }
  var SC_SAMPLES = {
    ru: [
      ["script", 0, "\u041F\u0435\u0440\u0432\u044B\u0439 \u0437\u0432\u043E\u043D\u043E\u043A", "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u041C\u0435\u043D\u044F \u0437\u043E\u0432\u0443\u0442 {\u044F}, \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F SavdEx. \u0417\u0432\u043E\u043D\u044E \u043A\u043E\u0440\u043E\u0442\u043A\u043E: \u043F\u043E\u043C\u043E\u0433\u0430\u0435\u043C \u0443\u0437\u0431\u0435\u043A\u0441\u043A\u0438\u043C \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430\u043C \u0438 \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F\u043C \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u0431\u0435\u0437 \u043F\u043E\u0441\u0440\u0435\u0434\u043D\u0438\u043A\u043E\u0432. \u041A\u0442\u043E \u0443 \u0432\u0430\u0441 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0437\u0430 \u0437\u0430\u043A\u0443\u043F\u043A\u0438/\u0441\u0431\u044B\u0442? \u0423\u0434\u043E\u0431\u043D\u043E 2 \u043C\u0438\u043D\u0443\u0442\u044B?"],
      ["script", 3, "\u041F\u0435\u0440\u0435\u0434 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C", "\u0423\u0442\u043E\u0447\u043D\u0438\u0442\u0435: \u043E\u0431\u044A\u0451\u043C, \u0441\u0440\u043E\u043A\u0438, \u0431\u044E\u0434\u0436\u0435\u0442, \u043A\u0442\u043E \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u0442 \u0440\u0435\u0448\u0435\u043D\u0438\u0435. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0443 \u0435\u0433\u043E \u0437\u0430\u0434\u0430\u0447\u0443 \u0441\u0432\u043E\u0438\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u043C\u0438 \u2014 \u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0442\u043E\u043C \u043D\u0430\u0437\u044B\u0432\u0430\u0439\u0442\u0435 \u0446\u0435\u043D\u0443."],
      ["objection", null, "\u0414\u043E\u0440\u043E\u0433\u043E", "\u041F\u043E\u043D\u0438\u043C\u0430\u044E. \u0421 \u0447\u0435\u043C \u0441\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u0442\u0435? \u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u0435\u043C, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0442\u043E\u0438\u0442 \u043E\u0434\u0438\u043D \u043A\u043B\u0438\u0435\u043D\u0442 \u0431\u0435\u0437 \u043D\u0430\u0441 \u0438 \u0441 \u043D\u0430\u043C\u0438. \u041C\u043E\u0433\u0443 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0441\u0442\u0430\u0440\u0442 \u0441 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u0430\u043A\u0435\u0442\u0430."],
      ["objection", null, "\u041F\u043E\u0434\u0443\u043C\u0430\u0435\u043C", "\u041A\u043E\u043D\u0435\u0447\u043D\u043E. \u0427\u0442\u043E \u0438\u043C\u0435\u043D\u043D\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u043E\u0431\u0434\u0443\u043C\u0430\u0442\u044C \u2014 \u0446\u0435\u043D\u0443, \u0441\u0440\u043E\u043A\u0438 \u0438\u043B\u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u044F? \u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u043C\u0441\u044F: \u044F \u043F\u0440\u0438\u0448\u043B\u044E \u041A\u041F \u0441\u0435\u0433\u043E\u0434\u043D\u044F, \u0430 \u0432 \u0447\u0435\u0442\u0432\u0435\u0440\u0433 \u0441\u043E\u0437\u0432\u043E\u043D\u0438\u043C\u0441\u044F \u043D\u0430 5 \u043C\u0438\u043D\u0443\u0442."],
      ["objection", null, "\u0423\u0436\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u043C \u0441 \u0434\u0440\u0443\u0433\u0438\u043C\u0438", "\u041E\u0442\u043B\u0438\u0447\u043D\u043E, \u0437\u043D\u0430\u0447\u0438\u0442 \u0442\u0435\u043C\u0430 \u0432\u0430\u043C \u043D\u0443\u0436\u043D\u0430. \u0427\u0442\u043E \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u043C \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u0435 \u0443\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u0442, \u0430 \u0447\u0442\u043E \u0445\u043E\u0442\u0435\u043B\u043E\u0441\u044C \u0431\u044B \u0443\u043B\u0443\u0447\u0448\u0438\u0442\u044C? \u041C\u043E\u0436\u043D\u043E \u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u044C\u043D\u043E \u043D\u0430 \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u043C \u043E\u0431\u044A\u0451\u043C\u0435."]
    ],
    uz: [
      ["script", 0, "Birinchi qo\u2018ng\u2018iroq", "Assalomu alaykum! Ismim {\u044F}, SavdEx kompaniyasidan. Qisqa: o\u2018zbek yetkazib beruvchilar va xaridorlarga vositachisiz bir-birini topishga yordam beramiz. Xaridlar/sotuv uchun kim mas\u2019ul? 2 daqiqa vaqtingiz bormi?"],
      ["objection", null, "Qimmat", "Tushunaman. Nima bilan solishtiryapsiz? Keling, bizsiz va biz bilan bitta mijoz qanchaga tushishini hisoblaymiz. Minimal paketdan boshlashni taklif qilaman."],
      ["objection", null, "O\u2018ylab ko\u2018ramiz", "Albatta. Aynan nimani o\u2018ylamoqchisiz \u2014 narxni, muddatni yoki shartlarni? Bugun taklif yuboraman, payshanba kuni 5 daqiqa gaplashamiz."]
    ]
  };
  async function salesScriptRows() {
    var res = await fetch("presets/sales-scripts-ru-uz.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    var J = await res.json(), M = J._meta || {}, order = M.stage_order || STATUSES, titles = M.card_titles || {};
    var p = curPipe(), st = p ? stagesOf(p.id) : [], open = st.filter(function(s) {
      return s.kind === "open";
    });
    var stageFor = function(key, i) {
      if (key === "won" || key === "lost") {
        var k = st.filter(function(s) {
          return s.kind === key;
        })[0];
        return k ? k.id : void 0;
      }
      return open[i] ? open[i].id : void 0;
    };
    var me = myName() || "", fill = function(s) {
      return String(s || "").replace(/\{я\}/g, me);
    }, rows = [];
    ["ru", "uz"].forEach(function(lg) {
      var L = J[lg];
      if (!L) return;
      var tt = titles[lg] || {};
      order.forEach(function(key, i) {
        var sc = L[key], sid = stageFor(key, i);
        if (!sc || !sid) return;
        var plan = (sc.goal || "") + (sc.steps && sc.steps.length ? "\n\n" + sc.steps.map(function(x, n) {
          return n + 1 + ". " + x;
        }).join("\n") : "");
        [["plan", plan], ["call", sc.call], ["msg", sc.msg]].forEach(function(c, n) {
          if (c[1]) rows.push({ id: uuid(), org_id: AU.me.org_id, kind: "script", stage_id: sid, lang: lg, title: tt[c[0]] || c[0], body: fill(c[1]), sort: n, deleted: false });
        });
      });
      (L.objections || []).forEach(function(o, n) {
        if (o && o.q && o.a) rows.push({ id: uuid(), org_id: AU.me.org_id, kind: "objection", stage_id: null, lang: lg, title: String(o.q), body: fill(o.a), sort: n, deleted: false });
      });
    });
    return rows;
  }
  async function openScriptsEdit() {
    if (!isAdmin()) return;
    var list = (await genAll("scripts")).sort(function(a, b) {
      return a.kind.localeCompare(b.kind) || a.sort - b.sort;
    });
    var stName2 = function(id) {
      var s = stageById(id);
      return s ? s.name : t("sc_all_stages");
    };
    var sh = openSheet(sheetHead(t("sc_edit")) + '<div class="form"><button class="btn primary wide big" data-sc="">' + ico("plus") + esc(t("sc_add")) + "</button>" + (!list.length ? '<button class="btn ghost wide" id="scSamples">' + esc(t("sc_samples")) + "</button>" : "") + list.map(function(x) {
      return '<button class="mrow mbtn" data-sc="' + x.id + '"><span class="mmain"><b>' + esc(x.title) + '</b><span class="muted small">' + esc(t("sc_kind_" + x.kind) + " \xB7 " + stName2(x.stage_id) + " \xB7 " + x.lang.toUpperCase()) + "</span></span></button>";
    }).join("") + "</div>", { full: true });
    $$("[data-sc]", sh).forEach(function(b) {
      b.onclick = function() {
        editScript(list.filter(function(x) {
          return x.id === b.dataset.sc;
        })[0], function() {
          closeTop().then(openScriptsEdit);
        });
      };
    });
    var smp = sh.querySelector("#scSamples");
    if (smp) smp.onclick = async function() {
      var rows = [];
      try {
        rows = await salesScriptRows();
      } catch (e) {
        console.warn("sales scripts preset", e);
      }
      if (!rows.length) {
        var p0 = curPipe(), st0 = p0 ? stagesOf(p0.id) : [];
        ["ru", "uz"].forEach(function(lg) {
          SC_SAMPLES[lg].forEach(function(r, i) {
            rows.push({ id: uuid(), org_id: AU.me.org_id, kind: r[0], stage_id: r[1] != null && st0[r[1]] ? st0[r[1]].id : null, lang: lg, title: r[2], body: r[3].replace(/\{я\}/g, myName() || ""), sort: i, deleted: false });
          });
        });
      }
      await genPut("scripts", rows);
      window.__scLoaded = rows.length;
      toast(t("c_saved"));
      await closeTop();
      openScriptsEdit();
    };
  }
  function editScript(x, done) {
    x = x || { id: uuid(), org_id: AU.me.org_id, kind: "script", stage_id: null, lang: LANG, title: "", body: "", sort: 0, deleted: false };
    var stages = [];
    MEM.pipelines.forEach(function(p) {
      stagesOf(p.id).forEach(function(s) {
        stages.push([s.id, (MEM.pipelines.length > 1 ? p.name + ": " : "") + s.name]);
      });
    });
    var sh = openSheet(sheetHead(x.title || t("sc_add")) + '<div class="form"><div class="row3"><select id="sK"><option value="script"' + (x.kind === "script" ? " selected" : "") + ">" + esc(t("sc_kind_script")) + '</option><option value="objection"' + (x.kind === "objection" ? " selected" : "") + ">" + esc(t("sc_kind_objection")) + '</option></select><select id="sS"><option value="">' + esc(t("sc_all_stages")) + "</option>" + stages.map(function(s) {
      return '<option value="' + s[0] + '"' + (s[0] === x.stage_id ? " selected" : "") + ">" + esc(s[1]) + "</option>";
    }).join("") + '</select><select id="sL">' + ["ru", "uz", "en"].map(function(l) {
      return "<option" + (x.lang === l ? " selected" : "") + ">" + l + "</option>";
    }).join("") + "</select></div>" + lab(t("tpl_name"), '<input class="inp" id="sT" value="' + esc(x.title) + '">') + lab(t("tpl_body"), '<textarea class="inp" id="sB" rows="8">' + esc(x.body) + "</textarea>") + '<div class="row2"><button class="btn danger" id="sDel">' + esc(t("del")) + '</button><button class="btn primary" id="sSave">' + esc(t("save")) + "</button></div></div>", { full: true });
    sh.querySelector("#sSave").onclick = async function() {
      x.kind = sh.querySelector("#sK").value;
      x.stage_id = sh.querySelector("#sS").value || null;
      x.lang = sh.querySelector("#sL").value;
      x.title = sh.querySelector("#sT").value.trim();
      x.body = sh.querySelector("#sB").value;
      if (!x.title) return;
      await genPut("scripts", [x]);
      await closeTop();
      done();
    };
    sh.querySelector("#sDel").onclick = async function() {
      x.deleted = true;
      await genPut("scripts", [x]);
      await closeTop();
      done();
    };
  }
  var PUB = function() {
    return baseUrl() + "/storage/v1/object/public/sotuvdesc-public";
  };
  function verGt(a, b) {
    var x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    for (var i = 0; i < 3; i++) {
      if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    }
    return false;
  }
  async function checkUpdate(force) {
    if (!baseUrl() || navigator.onLine === false) return null;
    try {
      if (!syncOn()) return null;
      var rows = await api("GET", "crm_app_release?select=*&id=eq.1");
      var j = rows && rows[0];
      window.__upd = j || null;
      if (!j) return null;
      var isDesktop = /Electron/i.test(navigator.userAgent);
      if (!j.version || !verGt(j.version, VERSION) || isDesktop) return j;
      var seen;
      try {
        seen = localStorage.getItem("sd-upd-seen");
      } catch (e) {
      }
      if (!force && seen === j.version) return j;
      var url = NATIVE ? j.apk ? PUB() + "/" + j.apk : "" : j.setup ? PUB() + "/" + j.setup : j.apk ? PUB() + "/" + j.apk : "";
      var sh = openSheet(sheetHead(t("upd_title")) + '<div class="form"><p>' + esc(t("upd_text", { v: j.version, n: j.notes || "" })) + '</p><div class="row2"><button class="btn ghost" id="uLater">' + esc(t("upd_later")) + "</button>" + (url ? '<button class="btn primary" id="uGet">' + esc(t("upd_get")) + "</button>" : "") + "</div></div>");
      sh.querySelector("#uLater").onclick = function() {
        try {
          localStorage.setItem("sd-upd-seen", j.version);
        } catch (e) {
        }
        closeTop();
      };
      var g = sh.querySelector("#uGet");
      if (g) g.onclick = function() {
        openExt(url);
        closeTop();
      };
      return j;
    } catch (e) {
      return null;
    }
  }
  async function storagePut(name, blob, ctype) {
    await ensureFresh();
    var r = await fetch(baseUrl() + "/storage/v1/object/sotuvdesc-public/" + encodeURIComponent(name), { method: "POST", headers: { apikey: anonKey(), Authorization: "Bearer " + AU.s.access_token, "x-upsert": "true", "Content-Type": ctype || "application/octet-stream", "Cache-Control": "max-age=60" }, body: blob });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 160));
  }
  function openPublish() {
    if (!isAdmin()) return;
    var sh = openSheet(sheetHead(t("upd_pub")) + '<div class="form"><p class="muted small">' + esc(t("upd_pub_help")) + '</p><input type="file" id="pubF" multiple accept=".apk,.exe,.yml,.yaml,.blockmap">' + lab(t("upd_notes"), '<input class="inp" id="pubN" placeholder="\u041A\u041F \u0432 PDF, \u0440\u0435\u0439\u0442\u0438\u043D\u0433, \u0437\u0430\u044F\u0432\u043A\u0438 \u0441 \u0441\u0430\u0439\u0442\u0430">') + '<button class="btn primary wide big" id="pubGo">' + esc(t("upd_pub")) + '</button><div id="pubLog" class="muted small"></div></div>', { full: true });
    sh.querySelector("#pubGo").onclick = async function() {
      var files = Array.prototype.slice.call(sh.querySelector("#pubF").files || []);
      if (!files.length) return;
      var log = sh.querySelector("#pubLog"), apk = files.filter(function(f) {
        return /\.apk$/i.test(f.name);
      })[0], exe = files.filter(function(f) {
        return /\.exe$/i.test(f.name);
      })[0];
      var ver = ((apk || exe || {}).name || "").match(/(\d+\.\d+\.\d+)/);
      ver = ver ? ver[1] : VERSION;
      try {
        for (var i = 0; i < files.length; i++) {
          log.textContent = files[i].name + "\u2026";
          await storagePut(files[i].name, files[i], /\.yml$/i.test(files[i].name) ? "text/yaml" : void 0);
        }
        if (apk) {
          log.textContent = "Sotuvdesc-latest.apk\u2026";
          await storagePut("Sotuvdesc-latest.apk", apk, "application/vnd.android.package-archive");
        }
        var meta = { version: ver, notes: sh.querySelector("#pubN").value.trim(), apk: apk ? apk.name : null, setup: exe ? exe.name : null, published_at: (/* @__PURE__ */ new Date()).toISOString(), by: myName() };
        await storagePut("latest.json", new Blob([JSON.stringify(meta)], { type: "application/json" }), "application/json");
        await api("POST", "crm_app_release?on_conflict=id", { id: 1, version: meta.version, notes: meta.notes, apk: meta.apk, setup: meta.setup, published_by: AU.uid, published_at: meta.published_at }, "resolution=merge-duplicates,return=minimal");
        window.__published = meta;
        toast(t("upd_pub_done", { v: ver }));
        closeTop();
      } catch (e) {
        log.textContent = errText(e);
      }
    };
  }
  async function openTelegram() {
    var sh = openSheet(sheetHead(t("tg_title")) + '<div class="form" id="tgBody"><p class="muted">' + esc(t("loading")) + "</p></div>");
    var linked = null;
    try {
      linked = (await api("GET", "crm_tg_links?select=chat_id,linked_at"))[0];
    } catch (e) {
    }
    var bot = (window.SD_CONFIG || {}).tgBot || "";
    sh.querySelector("#tgBody").innerHTML = linked && linked.chat_id ? '<p class="note">' + esc(t("tg_linked")) + "</p>" : "<p>" + esc(t("tg_help")) + "</p>" + (bot ? "<p><b>@" + esc(bot) + "</b></p>" : '<p class="muted small">' + esc(t("tg_off")) + "</p>") + '<button class="btn primary wide" id="tgCode">' + esc(t("tg_code")) + '</button><p class="code big" id="tgOut"></p>';
    var b = sh.querySelector("#tgCode");
    if (b) b.onclick = async function() {
      try {
        var c = await rpc("crm_tg_link_code");
        sh.querySelector("#tgOut").textContent = "/start " + c;
        await copyText("/start " + c);
        toast(t("tpl_copied"));
      } catch (e) {
        toast(errText(e));
      }
    };
  }
  function guardWrite(r, act) {
    if (!ROLE()) return true;
    if (canWrite(r)) return true;
    toast(t(ROLE() === "viewer" ? "ro_viewer" : "ro_card"));
    return false;
  }
  function activeMembers() {
    return MEM.members.filter(function(m) {
      return m.status === "active";
    });
  }
  function ownerSelect(r) {
    var cur = r.ownerId || "", admin = isAdmin(), dis = !canWrite(r) ? " disabled" : "";
    var opts = [["", t("owner_shared")]];
    if (admin) activeMembers().forEach(function(m) {
      opts.push([m.user_id, (m.display_name || m.email) + (m.user_id === AU.uid ? " (" + t("you") + ")" : "")]);
    });
    else {
      opts.push([AU.uid, t("owner_me")]);
      if (cur && cur !== AU.uid) opts.push([cur, memberName(cur) || "\u2014"]);
    }
    return '<select id="cOwner"' + dis + ">" + opts.map(function(o) {
      return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select>";
  }
  function assigneeSelect(id, cur) {
    if (!isAdmin()) return "";
    var ms = activeMembers().filter(function(m) {
      return m.role !== "viewer";
    });
    if (!ms.length) return "";
    return '<select id="' + id + '" aria-label="' + esc(t("fld_assignee")) + '">' + ms.map(function(m) {
      return '<option value="' + esc(m.user_id) + '"' + (m.user_id === cur ? " selected" : "") + ">" + esc((m.display_name || m.email) + (m.user_id === AU.uid ? " (" + t("you") + ")" : "")) + "</option>";
    }).join("") + "</select>";
  }
  function remSelect(id) {
    return '<select id="' + id + '" aria-label="' + esc(t("rem_title")) + '"><option value="">' + esc(t("rem_none")) + "</option>" + ["09:00", "10:00", "12:00", "15:00", "18:00"].map(function(h) {
      return '<option value="' + h + '"' + (h === "10:00" ? " selected" : "") + ">" + esc(t("rem_at", { h })) + "</option>";
    }).join("") + '<option value="-1d">' + esc(t("rem_daybefore")) + '</option><option value="+1h">' + esc(t("rem_1h")) + "</option></select>";
  }
  function reminderTs(due, v) {
    if (!v) return 0;
    if (v === "+1h") return Date.now() + 36e5;
    if (v === "-1d") {
      var d0 = /* @__PURE__ */ new Date(due + "T18:00:00");
      d0.setDate(d0.getDate() - 1);
      return d0.getTime();
    }
    return (/* @__PURE__ */ new Date(due + "T" + v + ":00")).getTime();
  }
  function daysAgo(ms) {
    var d = Math.floor((Date.now() - ms) / 864e5);
    return d <= 0 ? t("today_word") : t("n_days_ago", { n: d });
  }
  var REM = { timer: null };
  async function scheduleReminders() {
    if (!db) return;
    var mine = (await reqP(db.transaction("tasks").objectStore("tasks").getAll())).filter(function(x) {
      return !x.done && x.remindAt && (!AU.uid || !x.assigneeId || x.assigneeId === AU.uid);
    });
    var LN = PLUG.LocalNotifications, now = Date.now();
    if (NATIVE && LN) {
      try {
        var prev = await metaGet("remIds") || [];
        if (prev.length) await LN.cancel({ notifications: prev.map(function(id) {
          return { id };
        }) });
        var list = mine.filter(function(x) {
          return x.remindAt > now;
        }).sort(function(a, b) {
          return a.remindAt - b.remindAt;
        }).slice(0, 60);
        var ids = [];
        if (list.length) {
          var perm = await LN.checkPermissions();
          if (perm.display !== "granted") perm = await LN.requestPermissions();
          if (perm.display === "granted") {
            await LN.schedule({ notifications: list.map(function(x) {
              var nid = Math.abs(hashStr(x.uid)) % 2e9;
              ids.push(nid);
              var e = BYID.get(x.cid);
              return { id: nid, title: x.title, body: (e ? e.n + " \xB7 " : "") + fmtDate(x.due), schedule: { at: new Date(x.remindAt), allowWhileIdle: true }, extra: { cid: x.cid, uid: x.uid } };
            }) });
          }
        }
        await metaSet("remIds", ids);
      } catch (e) {
        console.warn("notifications", e);
      }
      return;
    }
    clearTimeout(REM.timer);
    var next = mine.filter(function(x) {
      return x.remindAt > now;
    }).sort(function(a, b) {
      return a.remindAt - b.remindAt;
    })[0];
    if (next && next.remindAt - now < 2147483e3) REM.timer = setTimeout(function() {
      fireReminder(next);
    }, next.remindAt - now);
  }
  function fireReminder(x) {
    var e = BYID.get(x.cid);
    toast(t("rem_toast", { n: x.title + (e ? " \u2014 " + e.n : "") }), t("open"), function() {
      if (x.cid) openCard(x.cid);
    });
    try {
      if (window.Notification && Notification.permission === "granted") new Notification("Sotuvdesc: " + x.title, { body: e ? e.n : "", icon: "assets/savdex-logo-160.png" });
    } catch (er) {
    }
    setTimeout(scheduleReminders, 1e3);
  }
  function hashStr(s) {
    var h = 0;
    s = String(s || "");
    for (var i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
    return h;
  }
  function quickAdd(companyOnly) {
    if (ROLE() && !canWriteAny()) {
      toast(t("ro_viewer"));
      return;
    }
    var nr = newRec({ source: myName() ? "manual: " + myName() : "manual", basis: "other", country: CF.defCountry || "UZ", ownerId: ROLE() === "manager" ? AU.uid : null });
    nr.uid = uuid();
    if (!companyOnly && window.SDX && SDX.quickMenu) return SDX.quickMenu(nr);
    openEdit(nr, function() {
      if (nr.id) {
        refreshList();
        openCard(nr.id);
      }
    });
  }
  function fabAction() {
    if (S.tab === "list") return quickAdd(true);
    if (S.tab === "deals") {
      if (ROLE() && !canWriteAny()) {
        toast(t("ro_viewer"));
        return;
      }
      return openDeal(null);
    }
    if (S.tab === "today") return quickTask();
    return quickAdd();
  }
  function goBack() {
    if (window.SDOnb && SDOnb.back()) return true;
    if (GATE.mode) {
      if (GATE.mode === "register" || GATE.mode === "confirm") {
        showGate("login");
        return true;
      }
      exitPrompt();
      return true;
    }
    if (STACK.length) {
      guardedClose();
      return true;
    }
    if (S.tab !== "list") {
      setTab("list");
      return true;
    }
    if (S.sel) {
      S.sel = null;
      renderSelBar();
      drawRows();
      return true;
    }
    if (S.view === "board") {
      setView("list");
      return true;
    }
    if (S.q || filterActive()) {
      S.q = "";
      $("#q").value = "";
      F = F0();
      refreshList();
      return true;
    }
    exitPrompt();
    return false;
  }
  function exitPrompt() {
    if (!NATIVE) return;
    if (Date.now() - (S.backAt || 0) < 2200) {
      try {
        PLUG.App.exitApp();
      } catch (e) {
      }
      return;
    }
    S.backAt = Date.now();
    toast(t("back_exit"));
  }
  function bindBack() {
    $("#btnBack").onclick = function() {
      goBack();
    };
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && !e.defaultPrevented) {
        var tag = e.target && e.target.tagName || "";
        if (tag === "SELECT") return;
        goBack();
      }
    });
    if (NATIVE && PLUG.App && PLUG.App.addListener) {
      PLUG.App.addListener("backButton", function() {
        goBack();
      });
      PLUG.App.addListener("appUrlOpen", function(ev) {
        onInviteUrl(ev && ev.url);
      });
      PLUG.App.addListener("resume", function() {
        scheduleSync(300);
        if (window.SDX && SDX.onResume) SDX.onResume();
      });
    }
    if (NATIVE && PLUG.LocalNotifications && PLUG.LocalNotifications.addListener) {
      PLUG.LocalNotifications.addListener("localNotificationActionPerformed", function(ev) {
        var ex = ev && ev.notification && ev.notification.extra;
        if (ex && ex.chat) {
          setTab("chat");
          openChat(ex.chat);
        } else if (ex && ex.cid) openCard(ex.cid);
      });
    }
  }
  var CH_AB = { whatsapp: "WA", telegram: "TG", wechat: "WX", viber: "VB", instagram: "IG", facebook: "FB", linkedin: "IN", tiktok: "TT", youtube: "YT", vk: "VK", other: "\u2022" };
  var CH_HOSTS = [
    [/(^|\.)(t\.me|telegram\.me|telegram\.dog)$/, "telegram"],
    [/(^|\.)instagram\.com$/, "instagram"],
    [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
    [/(^|\.)linkedin\.com$/, "linkedin"],
    [/(^|\.)tiktok\.com$/, "tiktok"],
    [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
    [/(^|\.)(vk\.com|vk\.ru)$/, "vk"],
    [/(^|\.)(wa\.me|whatsapp\.com)$/, "whatsapp"]
  ];
  function chTypeOfUrl(u) {
    u = String(u || "").trim();
    if (!/^(https?:\/\/)?(www\.|m\.)?[a-z0-9.-]+\.[a-z]{2,}\//i.test(u + "/")) return "";
    var d = domainOf(u);
    for (var i = 0; i < CH_HOSTS.length; i++) if (CH_HOSTS[i][0].test(d)) return CH_HOSTS[i][1];
    return "";
  }
  function chHandle(type, v) {
    v = String(v || "").trim();
    if (!v) return "";
    var m, path = v.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/^(www\.|m\.)/i, "");
    var seg = function(re) {
      var x = re.exec(path);
      return x ? decodeURIComponent(x[1]).replace(/\/+$/, "") : "";
    };
    if (type === "whatsapp" || type === "viber") {
      m = /wa\.me\/(\d+)/i.exec(v) || /phone=%?2?B?(\d+)/i.exec(v) || /number=%2B(\d+)/i.exec(v);
      if (m) return m[1];
      return normPhone(v) || digits(v);
    }
    if (type === "telegram") {
      var h = seg(/^(?:t\.me|telegram\.me|telegram\.dog)\/(?:s\/)?([A-Za-z0-9_+]+)/i);
      if (h) return h.replace(/^\+/, "+");
      if (!/[a-z]/i.test(v) && digits(v).length >= 9) return "+" + (normPhone(v) || digits(v));
      return v.replace(/^@/, "").split(/[\s/?#]/)[0];
    }
    if (type === "instagram") return seg(/^instagram\.com\/([A-Za-z0-9_.]+)/i) || v.replace(/^@/, "").split(/[\s/?#]/)[0];
    if (type === "facebook") {
      m = /profile\.php\?id=(\d+)/i.exec(v);
      if (m) return m[1];
      return seg(/^(?:facebook\.com|fb\.com|fb\.me)\/([A-Za-z0-9_.-]+)/i) || v.replace(/^@/, "").split(/[\s?#]/)[0];
    }
    if (type === "linkedin") return seg(/^linkedin\.com\/((?:in|company|school)\/[^/?#]+)/i) || v.replace(/^@/, "");
    if (type === "tiktok") return seg(/^tiktok\.com\/@([^/?#]+)/i) || v.replace(/^@/, "").split(/[\s/?#]/)[0];
    if (type === "youtube") return seg(/^(?:youtube\.com)\/((?:@|c\/|channel\/|user\/)[^/?#]+)/i) || (v.charAt(0) === "@" ? v : v);
    if (type === "vk") return seg(/^vk\.(?:com|ru)\/([^/?#]+)/i) || v.replace(/^@/, "");
    return v;
  }
  function chKey(c) {
    var h = chHandle(c.t, c.v);
    return h ? c.t + ":" + h.toLowerCase() : "";
  }
  function chAdd(list, c) {
    if (!c || !c.t || !String(c.v || "").trim()) return false;
    var t0 = CHT.indexOf(c.t) >= 0 ? c.t : "other", x = { t: t0, v: String(c.v).trim().slice(0, 300) };
    if (c.n) x.n = String(c.n).slice(0, 200);
    var k = chKey(x);
    if (!k) return false;
    if (list.some(function(y) {
      return chKey(y) === k;
    })) return false;
    list.push(x);
    return true;
  }
  function chUrl(c) {
    var h = chHandle(c.t, c.v), v = String(c.v || "").trim();
    if (!h) return "";
    var isUrl = /^https?:\/\//i.test(v) || /^(www\.)?[a-z0-9-]+\.[a-z]{2,}\//i.test(v), full = isUrl ? /^https?:\/\//i.test(v) ? v : "https://" + v : "";
    switch (c.t) {
      case "whatsapp":
        return "https://wa.me/" + digits(h);
      case "telegram":
        return "https://t.me/" + h;
      case "viber":
        return "viber://chat?number=%2B" + digits(h);
      case "instagram":
        return "https://instagram.com/" + h;
      case "facebook":
        return full || "https://facebook.com/" + h;
      case "linkedin":
        return full || (/^(in|company|school)\//.test(h) ? "https://www.linkedin.com/" + h : "https://www.linkedin.com/search/results/all/?keywords=" + encodeURIComponent(h));
      case "tiktok":
        return "https://www.tiktok.com/@" + h;
      case "youtube":
        return full || "https://www.youtube.com/" + (h.charAt(0) === "@" || /^(c|channel|user)\//.test(h) ? h : "@" + h);
      case "vk":
        return "https://vk.com/" + h;
      case "wechat":
        return "";
      default:
        return full || (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(v) ? "mailto:" + v : "");
    }
  }
  var CH_LABELS = {
    telegram: "telegram",
    "\u0442\u0435\u043B\u0435\u0433\u0440\u0430\u043C": "telegram",
    "\u0442\u0435\u043B\u0435\u0433\u0440\u0430\u043C\u043C": "telegram",
    tg: "telegram",
    instagram: "instagram",
    "\u0438\u043D\u0441\u0442\u0430\u0433\u0440\u0430\u043C": "instagram",
    insta: "instagram",
    ig: "instagram",
    facebook: "facebook",
    "\u0444\u0435\u0439\u0441\u0431\u0443\u043A": "facebook",
    fb: "facebook",
    whatsapp: "whatsapp",
    "\u0432\u0430\u0442\u0441\u0430\u043F": "whatsapp",
    "\u0432\u043E\u0442\u0441\u0430\u043F": "whatsapp",
    wa: "whatsapp",
    wechat: "wechat",
    "\u0432\u0438\u0447\u0430\u0442": "wechat",
    weixin: "wechat",
    viber: "viber",
    "\u0432\u0430\u0439\u0431\u0435\u0440": "viber",
    linkedin: "linkedin",
    tiktok: "tiktok",
    "\u0442\u0438\u043A\u0442\u043E\u043A": "tiktok",
    youtube: "youtube",
    "\u044E\u0442\u0443\u0431": "youtube",
    vk: "vk",
    "\u0432\u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0435": "vk"
  };
  var CH_RX = /(^|[\s;,(|])(telegram|телеграмм?|tg|instagram|инстаграм|insta|ig|facebook|фейсбук|fb|whatsapp|ватсап|вотсап|wa|wechat|вичат|weixin|viber|вайбер|linkedin|tiktok|тикток|youtube|ютуб|vk|вконтакте)\s*:\s*([^;\n|]+)/gi;
  var CH_URL_RX = /(^|[\s;,(|])((?:https?:\/\/)?(?:www\.|m\.)?(?:t\.me|telegram\.me|instagram\.com|facebook\.com|fb\.com|linkedin\.com|tiktok\.com|youtube\.com|vk\.com|wa\.me)\/[^\s;,|)]+)/gi;
  function parseChText(s) {
    s = String(s || "");
    var out = [], rest = s;
    if (!s || !/[:/]/.test(s)) return { ch: out, rest: s };
    rest = rest.replace(CH_RX, function(m, pre, lb, val) {
      var tp = CH_LABELS[lb.toLowerCase()], v = val.trim();
      if (tp === "whatsapp" || tp === "viber") {
        var pm = /^[+\d][\d\s()-]{6,}\d/.exec(v);
        v = pm ? pm[0].trim() : "";
      } else v = v.split(/\s+/)[0].replace(/[.,]+$/, "");
      if (!v || v.length < 2 || !/[a-z0-9]/i.test(v)) return m;
      chAdd(out, { t: tp, v });
      return pre;
    });
    rest = rest.replace(CH_URL_RX, function(m, pre, url) {
      var tp = chTypeOfUrl(url);
      if (!tp) return m;
      chAdd(out, { t: tp, v: url.replace(/[.,]+$/, "") });
      return pre;
    });
    if (out.length) rest = rest.replace(/\s*[;|]\s*([;|]\s*)+/g, "; ").replace(/^[\s;,|]+|[\s;,|]+$/g, "").replace(/\s{2,}/g, " ");
    else rest = s;
    return { ch: out, rest };
  }
  function allCh(r) {
    var list = (r.ch || []).slice(), pc = r.comment ? parseChText(r.comment).ch : [];
    pc.forEach(function(c) {
      chAdd(list, c);
    });
    return list;
  }
  function chSearch(r) {
    return allCh(r).map(function(c) {
      var h = chHandle(c.t, c.v);
      return h + (h.charAt(0) !== "@" && c.t !== "whatsapp" && c.t !== "viber" ? " @" + h : "");
    }).join(" ");
  }
  function cfSearch(r) {
    var o = [];
    if (r.cf) {
      for (var k in r.cf) if (r.cf[k] != null && r.cf[k] !== "") o.push(String(r.cf[k]).slice(0, 80));
    }
    if (r.extra) for (var k2 in r.extra) o.push(String(r.extra[k2]).slice(0, 80));
    return o.join(" ");
  }
  function isExampleRow(row) {
    for (var i = 0; i < row.length; i++) {
      var v = String(row[i] == null ? "" : row[i]);
      if (/(^|←\s*)(ПРИМЕР|NAMUNA|EXAMPLE)\s*:/i.test(v.trim())) return true;
    }
    return false;
  }
  function chShort(c) {
    var h = chHandle(c.t, c.v);
    if (c.t === "whatsapp" || c.t === "viber") return "+" + digits(h);
    if (c.t === "telegram" && h.charAt(0) === "+") return h;
    if (/^(instagram|telegram|tiktok)$/.test(c.t)) return "@" + h;
    return h.length > 28 ? h.slice(0, 26) + "\u2026" : h;
  }
  function chChipsHtml(r, list, scope, editable) {
    if (!list.length && !editable) return "";
    return '<div class="chn-row" data-cs="' + esc(scope) + '">' + list.map(function(c, i) {
      return '<button class="chn ch-' + c.t + '" data-act="chOpen" data-ci="' + i + '" data-cs="' + esc(scope) + '" title="' + esc(t("ch_" + c.t) + ": " + c.v) + '"><b>' + CH_AB[c.t] + "</b><span>" + esc(chShort(c)) + "</span></button>";
    }).join("") + (editable ? '<button class="chn add" data-act="chAdd" data-cs="' + esc(scope) + '">' + ico("plus") + "<span>" + esc(t("ch_add")) + "</span></button>" : "") + (scope === "c" ? '<button class="chn web" data-act="webFind">' + ico("search") + "<span>" + esc(t("wf_btn")) + "</span></button>" : "") + "</div>";
  }
  function chTargets(sh, scope) {
    var r = sh._rec || sh._ctRec;
    if (scope === "c") return { rec: r, list: allCh(r), own: r.ch || [], contact: null, name: r.name };
    var c = sh._ct && sh._ct.id === scope ? sh._ct : DL.contacts.filter(function(x) {
      return x.id === scope;
    })[0];
    if (!c) return null;
    c.extra = c.extra && typeof c.extra === "object" ? c.extra : {};
    c.extra.ch = Array.isArray(c.extra.ch) ? c.extra.ch : [];
    return { rec: r, list: c.extra.ch, own: c.extra.ch, contact: c, name: c.name + (r ? " \u2014 " + r.name : "") };
  }
  async function chSave(sh, tg, newList, inForm) {
    if (!tg.contact) {
      var r = tg.rec;
      if (!guardWrite(r)) return false;
      r.ch = newList;
      var cm = parseChText(r.comment);
      if (cm.ch.length) r.comment = cm.rest;
      await putCompanies([r]);
      return true;
    }
    tg.contact.extra.ch = newList;
    if (inForm) return true;
    tg.contact.updated_by = myName();
    await genPut("contacts", [tg.contact]);
    await loadDealsCache();
    return true;
  }
  function rerenderAfterCh(sh, inForm) {
    if (inForm && sh._ctRedraw) sh._ctRedraw();
    else if (sh._rec && sh._rec.id && !inForm) renderCard(sh, sh._rec.id);
  }
  async function chAction(sh, act, el) {
    var scope = el.dataset.cs, inForm = !!el.closest(".ctform"), tg = chTargets(sh, scope);
    if (!tg) return;
    var r = tg.rec, dnc = !!(r && r.dnc);
    if (act === "chAdd") return chEdit(sh, tg, null, inForm);
    var c = tg.list[+el.dataset.ci];
    if (!c) return;
    var url = chUrl(c), mine = r ? canWrite(r) : true;
    var m = openSheet(sheetHead(t("ch_" + c.t) + " \xB7 " + chShort(c)) + '<div class="col">' + (c.n ? '<p class="muted small">' + esc(c.n) + "</p>" : "") + (dnc ? '<div class="warn">' + ico("stop", "red") + esc(t("c_dnc_on")) + "</div>" : "") + (!dnc && !inForm ? '<button class="btn primary" data-ca="open">' + esc(c.t === "wechat" || !url ? t("ch_copy_open") : t("ch_open")) + "</button>" : "") + (!inForm && r && r.id ? '<button class="btn ghost" data-ca="log">' + esc(t("ch_log")) + "</button>" : "") + '<button class="btn ghost" data-ca="copy">' + esc(t("ch_copy")) + "</button>" + (mine ? '<button class="btn ghost" data-ca="edit">' + esc(t("ch_edit")) + '</button><button class="btn danger" data-ca="del">' + esc(t("del")) + "</button>" : "") + "</div>");
    $$("[data-ca]", m).forEach(function(b) {
      b.onclick = async function() {
        var a = b.dataset.ca;
        if (a === "copy") {
          await copyText(c.v);
          toast(t("ch_copied", { v: chShort(c) }));
          return closeTop();
        }
        if (a === "log") {
          await closeTop();
          return msgResultPrompt({ cid: r.id, kind: c.t, label: t("ch_" + c.t) + " " + chShort(c), name: tg.name, contactId: tg.contact ? tg.contact.id : "" }, true);
        }
        if (a === "open") {
          await closeTop();
          MSG.pending = { cid: r ? r.id : 0, kind: c.t, ts: Date.now(), label: t("ch_" + c.t) + " " + chShort(c), name: tg.name, contactId: tg.contact ? tg.contact.id : "" };
          if (c.t === "wechat" || !url) {
            await copyText(chHandle(c.t, c.v));
            toast(c.t === "wechat" ? t("ch_wechat_hint") : t("ch_copied", { v: chShort(c) }));
            if (c.t === "wechat") {
              openExt("weixin://");
            }
            return;
          }
          openExt(url);
          return;
        }
        if (a === "edit") {
          await closeTop();
          return chEdit(sh, tg, c, inForm);
        }
        if (a === "del") {
          if (!await ask(t("ch_del_q", { n: t("ch_" + c.t) + " " + chShort(c) }), { danger: true, ok: t("del") })) return;
          var k = chKey(c), nl = tg.list.filter(function(x) {
            return chKey(x) !== k;
          });
          await closeTop();
          if (await chSave(sh, tg, nl, inForm)) {
            toast(t("c_saved"));
            rerenderAfterCh(sh, inForm);
          }
        }
      };
    });
  }
  function chEdit(sh, tg, c, inForm) {
    var m = openSheet(sheetHead(c ? t("ch_edit") : t("ch_add_title")) + '<div class="form">' + lab(t("ch_type"), '<select id="chT">' + CHT.map(function(x) {
      return '<option value="' + x + '"' + (c && c.t === x ? " selected" : "") + ">" + esc(t("ch_" + x)) + "</option>";
    }).join("") + "</select>") + lab(t("ch_value"), '<input class="inp" id="chV" value="' + esc(c ? c.v : "") + '" placeholder="@nick, +998\u2026, https://\u2026" autocomplete="off">') + lab(t("ch_note"), '<input class="inp" id="chN" value="' + esc(c && c.n ? c.n : "") + '">') + '<div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="chS">' + esc(t("save")) + "</button></div></div>");
    var vi = m.querySelector("#chV"), ti = m.querySelector("#chT");
    vi.oninput = function() {
      var g = chTypeOfUrl(vi.value);
      if (g && !c) ti.value = g;
    };
    setTimeout(function() {
      vi.focus();
    }, 60);
    m.querySelector("#chS").onclick = async function() {
      var nc = { t: ti.value, v: vi.value.trim(), n: m.querySelector("#chN").value.trim() };
      if (!nc.v || !chHandle(nc.t, nc.v)) {
        toast(t("ch_bad"));
        vi.focus();
        return;
      }
      var ok0 = c ? chKey(c) : null, nl = tg.own.filter(function(x) {
        return chKey(x) !== ok0;
      });
      var probe = tg.list.filter(function(x) {
        return chKey(x) !== ok0;
      });
      if (probe.some(function(x) {
        return chKey(x) === chKey(nc);
      })) {
        toast(t("ch_dup"));
        return;
      }
      if (!tg.contact && c) {
        var pc = tg.rec.comment ? parseChText(tg.rec.comment).ch : [];
        pc.forEach(function(x) {
          if (chKey(x) !== ok0) chAdd(nl, x);
        });
      } else if (!tg.contact) {
        var pc2 = tg.rec.comment ? parseChText(tg.rec.comment).ch : [];
        pc2.forEach(function(x) {
          chAdd(nl, x);
        });
      }
      chAdd(nl, nc);
      await closeTop();
      if (await chSave(sh, tg, nl, inForm)) {
        toast(t("c_saved"));
        rerenderAfterCh(sh, inForm);
      }
    };
  }
  var MSG = { pending: null };
  function msgResultPrompt(p, manual) {
    if (!p) {
      p = MSG.pending;
      if (!p || Date.now() - p.ts > 36e5) {
        MSG.pending = null;
        return;
      }
      if (Date.now() - p.ts < 1500) return;
      MSG.pending = null;
    }
    var kind = p.kind === "whatsapp" || p.kind === "telegram" ? p.kind : "note";
    var touch = function(text, out) {
      return addTouch({ cid: p.cid || 0, dealId: p.dealId || "", kind, contactId: p.contactId || "", text, outcome: out });
    };
    return resultSheet({
      title: t("msg_result"),
      name: (p.name || "") + (p.label ? " \xB7 " + p.label : ""),
      hint: t("msg_hint"),
      pick: t("msg_pick"),
      outs: ["agreed", "reached", "noreply", "refused"],
      attr: "data-mo",
      prefix: "msg_",
      id: "mr",
      textId: "mrText",
      ph: t("msg_ph"),
      manual,
      defNext: { agreed: "3", reached: "3", noreply: "1", refused: "" },
      onSkip: function() {
        touch(t("msg_noresult", { c: p.label || t("k_" + kind) }), null);
      },
      onSave: async function(out, nd, txt) {
        await touch((p.label ? p.label + " \u2014 " : "") + t("msg_" + out) + (txt ? ": " + txt : ""), out);
        if (p.cid && out !== "noreply") {
          var r = await getCompany(p.cid);
          if (r && r.status === 0) await setStatus(r, 1);
        }
        if (nd) {
          await addFollowTask(p, nd, "msg_task");
          if (p.cid) await recomputeDue(p.cid);
          scheduleReminders();
        }
        scheduleSync();
      }
    });
  }
  function webFindLinks(r) {
    var q = [r.name, r.city].filter(Boolean).join(" "), e = encodeURIComponent(q), en = encodeURIComponent(r.name || "");
    return [
      ["google", "https://www.google.com/search?q=" + e],
      ["yandex", "https://yandex.uz/search/?text=" + e],
      ["2gis", "https://2gis.uz/search/" + e],
      ["maps", "https://www.google.com/maps/search/" + e],
      ["instagram", "https://www.google.com/search?q=" + encodeURIComponent("site:instagram.com " + q)],
      ["telegram", "https://www.google.com/search?q=" + encodeURIComponent("site:t.me " + q)],
      ["facebook", "https://www.google.com/search?q=" + encodeURIComponent("site:facebook.com " + q)],
      ["linkedin", "https://www.linkedin.com/search/results/companies/?keywords=" + en]
    ];
  }
  function openWebFind(r) {
    var links = webFindLinks(r);
    var sh = openSheet(sheetHead(t("wf_title")) + '<div class="form"><p class="muted">' + esc([r.name, r.city].filter(Boolean).join(" \xB7 ")) + '</p><div class="wfgrid">' + links.map(function(l, i) {
      return '<button class="btn ghost" data-wf="' + i + '">' + ico("search") + esc(t("wf_" + l[0])) + "</button>";
    }).join("") + '</div><p class="note small">' + esc(t("wf_note")) + "</p></div>");
    $$("[data-wf]", sh).forEach(function(b) {
      b.onclick = function() {
        var l = links[+b.dataset.wf];
        window.__lastWebFind = l[1];
        openExt(l[1]);
      };
    });
    window.__webFind = links.map(function(l) {
      return l[1];
    });
  }
  var CF = { defs: [] };
  var CF_TYPES = ["text", "number", "date", "select", "link"];
  async function loadCfDefs() {
    if (!db) return CF.defs;
    try {
      var os = await orgSettings();
      CF.defs = Array.isArray(os.fields) ? os.fields.filter(function(f) {
        return f && f.id && f.label;
      }) : [];
      CF.defCountry = countryCode(os.default_country) || "UZ";
    } catch (e) {
    }
    return CF.defs;
  }
  function cfFor(defs, ent) {
    return defs.filter(function(f) {
      return (f.entity || "company") === ent || f.entity === "both";
    });
  }
  function cfShow(f, v) {
    if (v == null || v === "") return "";
    if (f.type === "date") return "<span>" + esc(fmtDate(String(v))) + "</span>";
    if (f.type === "link") {
      var u = /^https?:\/\//i.test(v) ? v : "https://" + v;
      return '<a href="' + esc(u) + '" data-ext="1">' + esc(v) + "</a>";
    }
    if (f.type === "number") return "<span>" + esc(num(v)) + "</span>";
    return "<span>" + esc(v) + "</span>";
  }
  function cfSectionHtml(r, defs) {
    var fs = cfFor(defs, "company"), rows = fs.filter(function(f) {
      return r.cf && r.cf[f.id] != null && r.cf[f.id] !== "";
    }).map(function(f) {
      return '<div class="kv"><span>' + esc(f.label) + "</span>" + cfShow(f, r.cf[f.id]) + "</div>";
    });
    var ex = r.extra || {};
    Object.keys(ex).forEach(function(k) {
      rows.push('<div class="kv"><span>' + esc(k) + "</span>" + esc(ex[k]) + "</div>");
    });
    var ed = r.id && canWrite(r);
    if (!rows.length && !ed) return "";
    return '<section id="cfSec"><h3>' + esc(t("cf_title")) + (ed ? ' <button class="icbtn small" data-act="cfEdit" aria-label="' + esc(t("cf_edit")) + '">' + ico("edit") + "</button>" : "") + "</h3>" + (rows.length ? rows.join("") : '<p class="muted small">' + esc(t("cf_none")) + "</p>") + "</section>";
  }
  function cfInput(f, v, attr) {
    v = v == null ? "" : v;
    if (f.type === "select") return "<select " + attr + '><option value=""></option>' + (f.options || []).map(function(o) {
      return "<option" + (String(o) === String(v) ? " selected" : "") + ">" + esc(o) + "</option>";
    }).join("") + (v && (f.options || []).indexOf(v) < 0 ? "<option selected>" + esc(v) + "</option>" : "") + "</select>";
    return '<input class="inp" ' + attr + ' value="' + esc(v) + '"' + (f.type === "number" ? ' type="number" inputmode="decimal"' : f.type === "date" ? ' type="date"' : f.type === "link" ? ' type="url" placeholder="https://"' : "") + ">";
  }
  function kvRowHtml(k, v) {
    return '<div class="kvrow"><input class="inp" data-kk value="' + esc(k) + '" placeholder="' + esc(t("cf_key")) + '"><input class="inp" data-kv value="' + esc(v) + '" placeholder="' + esc(t("cf_val")) + '"><button class="icbtn small" data-kvdel aria-label="' + esc(t("del")) + '">' + ico("x") + "</button></div>";
  }
  function openCfEdit(sh) {
    var r = sh._rec;
    if (!guardWrite(r)) return;
    var fs = cfFor(CF.defs, "company"), ex = r.extra || {};
    var m = openSheet(sheetHead(t("cf_edit")) + '<div class="form">' + fs.map(function(f) {
      return lab(f.label, cfInput(f, r.cf ? r.cf[f.id] : "", 'data-cfid="' + esc(f.id) + '"'));
    }).join("") + '<div class="sub">' + esc(t("cf_free")) + '</div><div id="kvList">' + Object.keys(ex).map(function(k) {
      return kvRowHtml(k, ex[k]);
    }).join("") + '</div><button class="btn small ghost" id="kvAdd">' + ico("plus") + esc(t("cf_add_row")) + "</button>" + (isAdmin() || !ROLE() ? '<p class="small"><button class="btn small ghost" id="cfAdm">' + esc(t("cf_admin")) + "</button></p>" : "") + '<div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="cfSave">' + esc(t("save")) + "</button></div></div>", { full: true });
    var list = m.querySelector("#kvList");
    m.querySelector("#kvAdd").onclick = function() {
      list.insertAdjacentHTML("beforeend", kvRowHtml("", ""));
      var ins = list.querySelectorAll("[data-kk]");
      ins[ins.length - 1].focus();
    };
    list.onclick = function(e) {
      var b = e.target.closest("[data-kvdel]");
      if (b) b.closest(".kvrow").remove();
    };
    var adm = m.querySelector("#cfAdm");
    if (adm) adm.onclick = async function() {
      await closeTop();
      openFieldsAdmin(function() {
        renderCard(sh, r.id);
      });
    };
    m.querySelector("#cfSave").onclick = async function() {
      var cf = {}, oldCf = r.cf || {}, ch = [];
      $$("[data-cfid]", m).forEach(function(el) {
        var v = el.value.trim();
        if (v !== "") cf[el.dataset.cfid] = v;
      });
      for (var k0 in oldCf) if (!fs.some(function(f) {
        return f.id === k0;
      })) cf[k0] = oldCf[k0];
      fs.forEach(function(f) {
        var a = oldCf[f.id] == null ? "" : String(oldCf[f.id]), b = cf[f.id] == null ? "" : String(cf[f.id]);
        if (a !== b) ch.push(f.label + ": " + (a || "\u2014") + " \u2192 " + (b || "\u2014"));
      });
      var nx = {}, n = 0;
      $$(".kvrow", m).forEach(function(row) {
        var k = row.querySelector("[data-kk]").value.trim().slice(0, 60), v = row.querySelector("[data-kv]").value.trim().slice(0, 500);
        if (k && v && !RESERVED[k] && n < 40) {
          nx[k] = v;
          n++;
        }
      });
      var keys = uniq(Object.keys(ex).concat(Object.keys(nx)));
      keys.forEach(function(k) {
        var a = ex[k] == null ? "" : String(ex[k]), b = nx[k] == null ? "" : String(nx[k]);
        if (a !== b) ch.push(k + ": " + (a || "\u2014") + " \u2192 " + (b || "\u2014"));
      });
      if (!ch.length) {
        await closeTop();
        return;
      }
      r.cf = cf;
      r.extra = n ? nx : null;
      await putCompanies([r], [{ cid: r.id, ts: Date.now(), kind: "note", text: t("cf_log", { d: ch.join("; ") }).slice(0, 1500), author: myName(), authorId: AU.uid }]);
      toast(t("c_saved"));
      await closeTop();
      renderCard(sh, r.id);
    };
  }
  function extraHist(h) {
    if (!h || h.field !== "extra") return [h];
    var a, b;
    try {
      a = JSON.parse(h.old_value || "{}") || {};
      b = JSON.parse(h.new_value || "{}") || {};
    } catch (e) {
      return [];
    }
    var lbl = { person: t("fld_person"), comment: t("fld_comment"), ch: t("ch_title"), cf: t("cf_title"), alt: t("c_alt"), basis: t("imp_basis") }, out = [];
    var sv = function(k, v) {
      if (v == null || v === "") return "";
      if (k === "ch" && Array.isArray(v)) return v.map(function(c) {
        return (CH_AB[c.t] || "") + " " + chShort(c);
      }).join(", ");
      if (k === "cf" && typeof v === "object") return Object.keys(v).map(function(x) {
        var f = CF.defs.filter(function(d) {
          return d.id === x;
        })[0];
        return (f ? f.label : x) + ": " + v[x];
      }).join(", ");
      return typeof v === "object" ? JSON.stringify(v) : String(v);
    };
    uniq(Object.keys(a).concat(Object.keys(b))).forEach(function(k) {
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push({ field: k, label: lbl[k] || k, old_value: sv(k, a[k]), new_value: sv(k, b[k]), created_at: h.created_at, author: h.author });
    });
    return out;
  }
  async function openFieldsAdmin(done) {
    var os = await orgSettings(), defs = (Array.isArray(os.fields) ? os.fields : []).slice();
    var dc = countryCode(os.default_country) || "UZ";
    var sh = openSheet(sheetHead(t("cf_admin")) + '<div class="form">' + lab(t("def_country"), '<select id="fdCo">' + Object.keys(CN).sort(countryCmp).map(function(c) {
      return '<option value="' + c + '"' + (c === dc ? " selected" : "") + ">" + esc(countryName(c)) + "</option>";
    }).join("") + "</select>") + '<p class="muted small">' + esc(t("cf_admin_hint")) + '</p><div id="fdList"></div><button class="btn ghost" id="fdNew">' + ico("plus") + esc(t("cf_new")) + '</button><div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="fdSave">' + esc(t("save")) + "</button></div></div>", { full: true, onClose: function() {
      if (done) done();
    } });
    var draw = function() {
      sh.querySelector("#fdList").innerHTML = defs.length ? defs.map(function(f, i) {
        return '<div class="kv link" data-fd="' + i + '"><span>' + esc(t("cf_t_" + f.type)) + " \xB7 " + esc(t("cf_e_" + (f.entity || "company"))) + "</span>" + esc(f.label) + "</div>";
      }).join("") : '<p class="muted small">' + esc(t("cf_none_defs")) + "</p>";
      $$("[data-fd]", sh).forEach(function(el) {
        el.onclick = function() {
          editDef(defs[+el.dataset.fd]);
        };
      });
    };
    var editDef = function(f) {
      var isNew = !f;
      f = f || { id: "f" + Date.now().toString(36), label: "", type: "text", options: [], entity: "company" };
      var m = openSheet(sheetHead(isNew ? t("cf_new") : f.label) + '<div class="form">' + lab(t("cf_label"), '<input class="inp" id="fdL" value="' + esc(f.label) + '">') + lab(t("cf_type"), '<select id="fdT">' + CF_TYPES.map(function(x) {
        return '<option value="' + x + '"' + (f.type === x ? " selected" : "") + ">" + esc(t("cf_t_" + x)) + "</option>";
      }).join("") + "</select>") + lab(t("cf_options"), '<input class="inp" id="fdO" value="' + esc((f.options || []).join(", ")) + '">') + lab(t("cf_entity"), '<select id="fdE">' + ["company", "contact", "both"].map(function(x) {
        return '<option value="' + x + '"' + ((f.entity || "company") === x ? " selected" : "") + ">" + esc(t("cf_e_" + x)) + "</option>";
      }).join("") + "</select>") + '<div class="row2">' + (isNew ? '<button class="btn ghost" data-act="close">' + esc(t("cancel")) + "</button>" : '<button class="btn danger" id="fdDel">' + esc(t("del")) + "</button>") + '<button class="btn primary" id="fdOk">' + esc(t("save")) + "</button></div></div>");
      m.querySelector("#fdOk").onclick = async function() {
        var l = m.querySelector("#fdL").value.trim().slice(0, 60);
        if (!l) {
          m.querySelector("#fdL").focus();
          return;
        }
        f.label = l;
        f.type = m.querySelector("#fdT").value;
        f.entity = m.querySelector("#fdE").value;
        f.options = f.type === "select" ? uniq(m.querySelector("#fdO").value.split(",").map(function(x) {
          return x.trim();
        }).filter(Boolean)).slice(0, 50) : [];
        if (isNew) defs.push(f);
        await closeTop();
        draw();
      };
      var del = m.querySelector("#fdDel");
      if (del) del.onclick = async function() {
        if (!await ask(t("cf_del_q", { n: f.label }), { danger: true, ok: t("del") })) return;
        defs = defs.filter(function(x) {
          return x !== f;
        });
        await closeTop();
        draw();
      };
    };
    sh.querySelector("#fdNew").onclick = function() {
      if (defs.length >= 40) return;
      editDef(null);
    };
    sh.querySelector("#fdSave").onclick = async function() {
      os.fields = defs;
      os.default_country = sh.querySelector("#fdCo").value;
      CF.defCountry = os.default_country;
      await genPut("org_settings", [os]);
      CF.defs = defs.slice();
      toast(t("cf_saved"));
      await closeTop();
    };
    draw();
  }
  var FI = { list: [] };
  var FILE_MAX = 10485760;
  var SAFE_MIME = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/bmp",
    "application/pdf",
    "application/rtf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.rar",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/aac",
    "audio/3gpp",
    "audio/amr",
    "audio/wav",
    "audio/x-m4a",
    "video/mp4",
    "video/quicktime",
    "video/3gpp",
    "video/webm"
  ];
  var VOICE_MIME = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/3gpp", "audio/amr", "audio/wav", "audio/x-m4a"];
  var EXT_MIME = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    bmp: "image/bmp",
    pdf: "application/pdf",
    rtf: "application/rtf",
    txt: "text/plain",
    csv: "text/csv",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    mp3: "audio/mpeg",
    m4a: "audio/x-m4a",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    wav: "audio/wav",
    amr: "audio/amr",
    aac: "audio/aac",
    "3gp": "video/3gpp",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm"
  };
  function safeMime(m, name) {
    m = String(m || "").split(";")[0].trim().toLowerCase();
    if (SAFE_MIME.indexOf(m) >= 0) return m;
    var x = /\.([a-z0-9]{1,5})$/i.exec(String(name || ""));
    return x && EXT_MIME[x[1].toLowerCase()] || "";
  }
  function voiceMime(m) {
    m = String(m || "").split(";")[0].trim().toLowerCase();
    return VOICE_MIME.indexOf(m) >= 0 ? m : "audio/webm";
  }
  async function loadFiles() {
    try {
      FI.list = (await reqP(db.transaction("files").objectStore("files").getAll())).filter(function(f) {
        return !f.deleted;
      });
    } catch (e) {
      FI.list = [];
    }
    return FI.list;
  }
  function filesOf(r) {
    return FI.list.filter(function(f) {
      return f.company_id === r.uid;
    }).sort(function(a, b) {
      return (b.created_at || "") < (a.created_at || "") ? -1 : 1;
    });
  }
  function filesSectionHtml(r) {
    if (!r.id) return "";
    var fs = filesOf(r), can = syncOn() && canWrite(r);
    return '<section id="fiSec"><h3>' + esc(t("fi_title")) + (fs.length ? " \xB7 " + fs.length : "") + "</h3>" + (fs.length ? '<div class="figrid">' + fs.map(function(f) {
      var del = f.created_uid === AU.uid || isAdmin();
      return '<div class="fitile"><button class="fiopen" data-act="fileOpen" data-fid="' + esc(f.id) + '">' + (f.thumb ? '<img src="' + esc(f.thumb) + '" alt="">' : '<b class="fiext">' + esc((String(f.name).split(".").pop() || "file").slice(0, 5).toUpperCase()) + "</b>") + '<span class="finame">' + esc(f.name) + '</span><span class="muted small">' + fmtBytes(f.size) + "</span></button>" + (del ? '<button class="icbtn small fidel" data-act="fileDel" data-fid="' + esc(f.id) + '" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button>" : "") + "</div>";
    }).join("") + "</div>" : '<p class="muted small">' + esc(t("fi_none")) + "</p>") + (can ? '<div class="row2"><button class="btn small ghost" data-act="filePick" data-cap="1">' + esc(t("fi_photo")) + '</button><button class="btn small ghost" data-act="filePick">' + ico("upload") + esc(t("fi_attach")) + "</button></div>" : ROLE() ? "" : '<p class="note small">' + esc(t("fi_offline")) + "</p>") + "</section>";
  }
  function safeKey(name) {
    var n = String(name || "file").normalize ? String(name || "file").normalize("NFKD") : String(name || "file");
    n = n.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^[._]+/, "");
    return (n || "file").slice(-80);
  }
  function makeThumb(file) {
    return new Promise(function(res) {
      if (!/^image\/(jpeg|png|webp|gif|bmp)/i.test(file.type || "")) return res(null);
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function() {
        try {
          var k = Math.min(1, 240 / Math.max(img.width, img.height)), c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.width * k));
          c.height = Math.max(1, Math.round(img.height * k));
          var g = c.getContext("2d");
          g.fillStyle = "#fff";
          g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          var q = 0.72, d = c.toDataURL("image/jpeg", q);
          while (d.length > 38e3 && q > 0.3) {
            q -= 0.12;
            d = c.toDataURL("image/jpeg", q);
          }
          URL.revokeObjectURL(url);
          res(d.length <= 4e4 ? d : null);
        } catch (e) {
          URL.revokeObjectURL(url);
          res(null);
        }
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        res(null);
      };
      img.src = url;
    });
  }
  function storagePath(p) {
    return p.split("/").map(encodeURIComponent).join("/");
  }
  async function uploadFile(sh, file) {
    var r = sh._rec;
    if (!file) return;
    if (file.size > FILE_MAX) {
      toast(t("fi_big"));
      return;
    }
    if (!file.size) {
      toast(t("fi_fail", { e: "0 B" }));
      return;
    }
    var fmime = safeMime(file.type, file.name);
    if (!fmime) {
      toast(t("cat_file_type"));
      return;
    }
    if (!syncOn() || navigator.onLine === false) {
      toast(t("fi_offline"));
      return;
    }
    if (!guardWrite(r)) return;
    if (!r.rts) {
      await syncNow();
      r = await getCompany(r.id);
      if (!r || !r.rts) {
        toast(t("fi_wait"));
        return;
      }
    }
    busy(t("fi_uploading"), 0.3);
    var id = uuid(), path = AU.me.org_id + "/" + id + "/" + safeKey(file.name), row = null;
    try {
      var thumb = await makeThumb(file);
      row = { id, org_id: AU.me.org_id, company_id: r.uid, contact_id: null, deal_id: null, name: String(file.name || "file").slice(0, 200), mime: fmime, size: file.size, path, thumb, author: myName() || null, deleted: false };
      await api("POST", "crm_files", row, "return=minimal");
      busy(t("fi_uploading"), 0.6);
      await ensureFresh();
      var res = await fetch(baseUrl() + "/storage/v1/object/sotuvdesc-files/" + storagePath(path), { method: "POST", headers: { apikey: anonKey(), Authorization: "Bearer " + AU.s.access_token, "Content-Type": row.mime, "x-upsert": "false" }, body: file });
      if (!res.ok) throw new Error("HTTP " + res.status + " " + (await res.text()).slice(0, 120));
      row.created_uid = AU.uid;
      row.created_at = row.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      row._synced = 1;
      row._pend = 0;
      row._base = JSON.parse(JSON.stringify(genKeys(row)));
      var tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(row);
      await txDone(tx);
      await addTouch({ cid: r.id, kind: "note", text: t("fi_log", { n: row.name }) });
      busy(null);
      toast(t("fi_done"));
      window.__lastFile = { id, name: row.name, size: row.size, thumb: !!thumb };
    } catch (e) {
      busy(null);
      toast(t("fi_fail", { e: e.message || e }));
      console.warn("upload", e);
      if (row) {
        try {
          await api("PATCH", "crm_files?id=eq." + id, { deleted: true }, "return=minimal");
        } catch (e2) {
        }
      }
    }
    await loadFiles();
    renderCard(sh, r.id);
  }
  function pickFile(sh, capture) {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.style.display = "none";
    if (capture) {
      inp.accept = "image/*";
      inp.setAttribute("capture", "environment");
    }
    inp.onchange = function() {
      var f = inp.files && inp.files[0];
      inp.remove();
      if (f) uploadFile(sh, f);
    };
    document.body.appendChild(inp);
    inp.click();
  }
  async function fileSignedUrl(f, bucket) {
    await ensureFresh();
    var res = await fetch(baseUrl() + "/storage/v1/object/sign/" + (bucket || "sotuvdesc-files") + "/" + storagePath(f.path), { method: "POST", headers: { apikey: anonKey(), Authorization: "Bearer " + AU.s.access_token, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 600 }) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    var j = await res.json(), su = j.signedURL || j.signedUrl;
    if (!su) throw new Error("no url");
    return /^https?:/.test(su) ? su : baseUrl() + "/storage/v1" + (su.charAt(0) === "/" ? su : "/" + su);
  }
  async function openFile(fid) {
    var f = FI.list.filter(function(x) {
      return x.id === fid;
    })[0];
    if (!f) return;
    if (!syncOn()) {
      toast(t("fi_offline"));
      return;
    }
    try {
      var u = await fileSignedUrl(f);
      window.__lastFileUrl = u;
      openExt(u);
    } catch (e) {
      toast(t("fi_open_fail"));
      console.warn("file", e);
    }
  }
  async function deleteFile(sh, fid) {
    var f = FI.list.filter(function(x) {
      return x.id === fid;
    })[0];
    if (!f) return;
    if (!(f.created_uid === AU.uid || isAdmin())) {
      toast(t("ro_card"));
      return;
    }
    if (!await ask(t("fi_del_q", { n: f.name }), { danger: true, ok: t("del") })) return;
    f.deleted = true;
    await genPut("files", [f]);
    await loadFiles();
    if (sh._refiles) sh._refiles();
    else if (sh._rec) renderCard(sh, sh._rec.id);
  }
  var TPL_FILE = "templates/Sotuvdesc-shablon-importa.xlsx";
  async function downloadTemplate() {
    try {
      var buf = await (await fetch(TPL_FILE)).arrayBuffer(), name = "Sotuvdesc-shablon-importa.xlsx";
      window.__tplSize = buf.byteLength;
      var FS = PLUG.Filesystem, SH = PLUG.Share;
      if (NATIVE && FS && SH) {
        var bin = "", u8 = new Uint8Array(buf);
        for (var i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
        await FS.writeFile({ path: "export/" + name, data: btoa(bin), directory: "CACHE", recursive: true });
        var uri = (await FS.getUri({ path: "export/" + name, directory: "CACHE" })).uri;
        try {
          await SH.share({ title: name, files: [uri], dialogTitle: name });
        } catch (e) {
        }
      } else {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
          URL.revokeObjectURL(a.href);
          a.remove();
        }, 5e3);
      }
      toast(t("exported", { n: name }));
    } catch (e) {
      toast(t("err", { e: e.message || e }));
    }
  }
  async function migrateChannels() {
    if (!db || MIGR.busy) return;
    MIGR.busy = true;
    try {
      var key = "chMig1:" + (AU.me && AU.me.org_id || "local");
      if (await metaGet(key)) return;
      if (syncOn() && !await metaGet("firstPull")) return;
      var last = 0, n = 0, quick = /(telegram|телеграм|tg|instagram|инстаграм|ig|facebook|fb|whatsapp|wechat|viber|tiktok|youtube|vk|linkedin)\s*:|t\.me\/|instagram\.com\/|facebook\.com\//i;
      for (; ; ) {
        var recs = await reqP(db.transaction("companies").objectStore("companies").getAll(IDBKeyRange.lowerBound(last, true), 2e3));
        if (!recs.length) break;
        last = recs[recs.length - 1].id;
        var ch = [];
        recs.forEach(function(r) {
          if (!r.comment || !quick.test(r.comment) || ROLE() && !canWrite(r)) return;
          var p = parseChText(r.comment);
          if (!p.ch.length) return;
          r.ch = r.ch || [];
          p.ch.forEach(function(c) {
            chAdd(r.ch, c);
          });
          r.comment = p.rest;
          ch.push(r);
        });
        if (ch.length) {
          await putCompanies(ch);
          n += ch.length;
        }
        await sleep0();
      }
      await metaSet(key, Date.now());
      MIGR.n = n;
      if (n) toast(t("mig_done", { n: num(n) }));
    } catch (e) {
      console.warn("migrate", e);
    } finally {
      MIGR.busy = false;
    }
  }
  var MIGR = { busy: false, n: 0 };
  function contactExtrasHtml(c) {
    var defs = cfFor(CF.defs, "contact"), ex = c.extra || {};
    return '<div class="ctform"><div class="sub">' + esc(t("ch_title")) + '</div><div id="ctCh">' + chChipsHtml(null, ex.ch || [], c.id, true) + "</div>" + defs.map(function(f) {
      return lab(f.label, cfInput(f, ex.cf ? ex.cf[f.id] : "", 'data-ccf="' + esc(f.id) + '"'));
    }).join("") + "</div>";
  }
  function readContactExtras(sh, c) {
    c.extra = c.extra && typeof c.extra === "object" ? c.extra : {};
    var cf = Object.assign({}, c.extra.cf || {});
    $$("[data-ccf]", sh).forEach(function(el) {
      var v = el.value.trim();
      if (v) cf[el.dataset.ccf] = v;
      else delete cf[el.dataset.ccf];
    });
    c.extra.cf = cf;
    if (c.telegram && !(c.extra.ch || []).some(function(x) {
      return x.t === "telegram";
    })) {
      c.extra.ch = c.extra.ch || [];
      chAdd(c.extra.ch, { t: "telegram", v: c.telegram });
    }
  }
  var CX = {
    chats: /* @__PURE__ */ new Map(),
    mem: /* @__PURE__ */ new Map(),
    msgs: /* @__PURE__ */ new Map(),
    mid: /* @__PURE__ */ new Map(),
    prefs: {},
    readLocal: {},
    busy: false,
    again: false,
    timer: null,
    openId: null,
    openSh: null,
    seg: "team",
    q: "",
    since: Date.now(),
    profiles: [],
    blocks: [],
    netAt: 0,
    rec: null,
    link: null,
    audio: null,
    teamTried: 0,
    loaded: false,
    last: 0,
    err: ""
  };
  var CX_RT = ["crm_chats", "crm_chat_members", "crm_chat_messages", "crm_chat_prefs", "crm_net_profiles"];
  var VOICE_MAX = 1048576, VOICE_SEC = 60;
  ICO.chat = '<path d="M4 4h16c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1H8l-4 4V5c0-.6.4-1 1-1zm1 2v10.2L7.2 15H19V6zm2 2h10v2H7zm0 3h7v2H7z"/>';
  ICO.mic = '<path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z"/>';
  ICO.clip = '<path d="M16.5 6.5v10a4.5 4.5 0 0 1-9 0V6a3 3 0 0 1 6 0v9.5a1.5 1.5 0 0 1-3 0V7H9v8.5a3 3 0 0 0 6 0V6a4.5 4.5 0 0 0-9 0v10.5a6 6 0 0 0 12 0v-10z"/>';
  ICO.bell = '<path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.9V4a1 1 0 0 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1z"/>';
  ICO.belloff = '<path d="M20 18.7 5.3 4 4 5.3l2.4 2.4A6 6 0 0 0 6 10v6l-2 2v1h13.7l1 1 1.3-1.3zM12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6.8V10a6 6 0 0 0-5-5.9V3a1 1 0 0 0-2 0v1.1c-.7.1-1.3.4-1.9.7z"/>';
  ICO.play = '<path d="M8 5v14l11-7z"/>';
  ICO.pause = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';
  ICO.people = '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13c-3.3 0-7 1.7-7 4.5V20h14v-2.5C16 14.7 12.3 13 9 13zm7 0c-.5 0-1 0-1.5.1A5.3 5.3 0 0 1 18 17.5V20h4v-2.5c0-2.6-3.3-4.5-6-4.5z"/>';
  ICO.dots = '<path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>';
  ICO.net = '<path d="M12 2a3 3 0 0 0-1 5.8V10H6a2 2 0 0 0-2 2v2.2a3 3 0 1 0 2 0V12h5v2.2a3 3 0 1 0 2 0V12h5v2.2a3 3 0 1 0 2 0V12a2 2 0 0 0-2-2h-5V7.8A3 3 0 0 0 12 2z"/>';
  function cxTs(s) {
    return Date.parse(s) || 0;
  }
  function cxTime(s) {
    var ms = cxTs(s);
    if (!ms) return "";
    var d = new Date(ms), now = /* @__PURE__ */ new Date();
    return ymd(d) === ymd(now) ? pad(d.getHours()) + ":" + pad(d.getMinutes()) : pad(d.getDate()) + "." + pad(d.getMonth() + 1);
  }
  function cxDay(s) {
    var d = new Date(cxTs(s)), td = today(), k = ymd(d);
    return k === td ? t("cx_today") : k === addDays(td, -1) ? t("cx_yesterday") : fmtDate(k);
  }
  function cxInit(name) {
    var p = String(name || "?").trim().split(/\s+/);
    return ((p[0] || "?").charAt(0) + (p[1] ? p[1].charAt(0) : "")).toUpperCase();
  }
  async function cxLoad() {
    try {
      var tx = db.transaction(["chats", "chat_members", "chat_msgs", "chat_prefs"]);
      var r = await Promise.all([reqP(tx.objectStore("chats").getAll()), reqP(tx.objectStore("chat_members").getAll()), reqP(tx.objectStore("chat_msgs").getAll()), reqP(tx.objectStore("chat_prefs").getAll())]);
      CX.chats = /* @__PURE__ */ new Map();
      r[0].forEach(function(c) {
        CX.chats.set(c.id, c);
      });
      CX.mem = /* @__PURE__ */ new Map();
      r[1].forEach(function(m) {
        cxMemPut(m);
      });
      CX.msgs = /* @__PURE__ */ new Map();
      CX.mid = /* @__PURE__ */ new Map();
      r[2].forEach(function(m) {
        cxMsgPut(m);
      });
      cxSortAll();
      CX.prefs = {};
      r[3].forEach(function(p) {
        CX.prefs[p.chat_id] = !!p.muted;
      });
      CX.loaded = true;
    } catch (e) {
      console.warn("chat load", e);
    }
  }
  function cxMemPut(m) {
    var mm = CX.mem.get(m.chat_id);
    if (!mm) {
      mm = /* @__PURE__ */ new Map();
      CX.mem.set(m.chat_id, mm);
    }
    mm.set(m.user_id, m);
  }
  function cxMsgPut(m) {
    var old = CX.mid.get(m.id), arr = CX.msgs.get(m.chat_id);
    if (!arr) {
      arr = [];
      CX.msgs.set(m.chat_id, arr);
    }
    if (old) {
      var i = arr.indexOf(old);
      if (i >= 0) arr[i] = m;
      else arr.push(m);
    } else arr.push(m);
    CX.mid.set(m.id, m);
  }
  function cxSortAll() {
    CX.msgs.forEach(function(arr) {
      arr.sort(function(a, b) {
        return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
      });
    });
  }
  async function cxStore(store, rows) {
    if (!rows.length) return;
    var tx = db.transaction(store, "readwrite"), s = tx.objectStore(store);
    rows.forEach(function(o) {
      s.put(o);
    });
    await txDone(tx);
  }
  function cxSchedule(ms) {
    if (!syncOn()) return;
    clearTimeout(CX.timer);
    CX.timer = setTimeout(cxSync, ms == null ? 300 : ms);
  }
  async function cxApplyChats(rows) {
    rows.forEach(function(c) {
      CX.chats.set(c.id, c);
    });
    await cxStore("chats", rows);
  }
  async function cxApplyMsgs(rows) {
    var fresh = [];
    rows.forEach(function(m) {
      var old = CX.mid.get(m.id);
      if (!old && m.author_id !== AU.uid && !m.deleted && cxTs(m.created_at) > CX.since) fresh.push(m);
      if (old && old._edit && !m.deleted) {
        m._edit = old._edit;
        m.body = old._edit.body != null ? old._edit.body : m.body;
      }
      cxMsgPut(m);
    });
    await cxStore("chat_msgs", rows);
    cxSortAll();
    fresh.forEach(cxNotify);
  }
  async function cxPullMembers() {
    var mark = await metaGet("pullCxM"), n = 0;
    for (; ; ) {
      var rows = await api("GET", "crm_chat_members?select=*&order=updated_at.asc&limit=1000" + (mark ? "&updated_at=gte." + encodeURIComponent(mark) : ""));
      if (!rows || !rows.length) break;
      rows.forEach(function(m) {
        m.k = m.chat_id + "|" + m.user_id;
        cxMemPut(m);
      });
      await cxStore("chat_members", rows);
      n += rows.length;
      var last = rows[rows.length - 1].updated_at;
      if (last === mark && rows.length < 1e3) break;
      mark = last;
      await metaSet("pullCxM", mark);
      if (rows.length < 1e3) break;
    }
    return n;
  }
  async function cxSync() {
    if (!syncOn() || !db || navigator.onLine === false) return;
    if (CX.busy) {
      CX.again = true;
      return;
    }
    if (SY.busy) {
      cxSchedule(300);
      return;
    }
    CX.busy = true;
    try {
      await cxPush();
      await pullTable("crm_chats", "pullCx", cxApplyChats);
      var vis = await api("GET", "crm_chats?select=id"), ids = new Set((vis || []).map(function(x) {
        return x.id;
      })), gone = [];
      CX.chats.forEach(function(c, id) {
        if (!ids.has(id)) gone.push(id);
      });
      if (gone.length) await cxForget(gone);
      await cxPullMembers();
      await pullTable("crm_chat_messages", "pullCxMsg", cxApplyMsgs);
      var pr = await api("GET", "crm_chat_prefs?select=chat_id,muted");
      CX.prefs = {};
      (pr || []).forEach(function(p) {
        CX.prefs[p.chat_id] = !!p.muted;
      });
      var tx = db.transaction("chat_prefs", "readwrite");
      tx.objectStore("chat_prefs").clear();
      (pr || []).forEach(function(p) {
        tx.objectStore("chat_prefs").put(p);
      });
      await txDone(tx);
      if (!cxTeam() && Date.now() - CX.teamTried > 6e4) {
        CX.teamTried = Date.now();
        await rpc("crm_chat_team");
        CX.again = true;
      }
      CX.last = Date.now();
      CX.err = "";
    } catch (e) {
      CX.err = String(e.message || e);
      console.warn("chat sync", e);
      if (AU.lost) {
        rtClose();
        showGate("login", t("e_session"));
      }
    }
    CX.busy = false;
    cxRefresh();
    if (CX.again) {
      CX.again = false;
      cxSchedule(400);
    }
  }
  async function cxForget(ids) {
    var tx = db.transaction(["chats", "chat_msgs"], "readwrite");
    ids.forEach(function(id) {
      tx.objectStore("chats").delete(id);
      (CX.msgs.get(id) || []).forEach(function(m) {
        tx.objectStore("chat_msgs").delete(m.id);
        CX.mid.delete(m.id);
      });
      CX.chats.delete(id);
      CX.msgs.delete(id);
      CX.mem.delete(id);
    });
    await txDone(tx);
    if (CX.openId && ids.indexOf(CX.openId) >= 0) {
      toast(t("cx_no_access"));
      closeTop();
    }
  }
  async function cxPush() {
    var pend = [];
    CX.mid.forEach(function(m2) {
      if (m2._pend || m2._edit) pend.push(m2);
    });
    pend.sort(function(a, b) {
      return a.created_at < b.created_at ? -1 : 1;
    });
    for (var i = 0; i < pend.length; i++) {
      var m = pend[i];
      try {
        if (m._pend) {
          await api("POST", "crm_chat_messages?on_conflict=id", [{ id: m.id, chat_id: m.chat_id, kind: "text", body: m.body, company_id: m.company_id || null, deal_id: m.deal_id || null }], "resolution=ignore-duplicates,return=minimal");
          m._pend = 0;
          m._fail = "";
        } else if (m._edit) {
          var rr = await api("PATCH", "crm_chat_messages?id=eq." + m.id, m._edit, "return=representation");
          delete m._edit;
          if (rr && rr[0]) {
            rr[0]._x = 0;
            cxMsgPut(rr[0]);
            m = rr[0];
          }
        }
      } catch (e) {
        if (NET_ERR(e)) throw e;
        if (m._pend) {
          m._pend = 0;
          m._fail = /rate_limited/.test(e.message) ? t("cx_rate") : /link_forbidden/.test(e.message) ? t("cx_link_forbidden") : /42501|403|row-level/.test(e.message) ? t("cx_cant_post") : String(e.message).slice(0, 120);
        } else {
          delete m._edit;
          toast(/edit_window_closed/.test(e.message) ? t("cx_24h") : t("err", { e: e.message }));
          try {
            var back = await api("GET", "crm_chat_messages?id=eq." + m.id);
            if (back && back[0]) cxMsgPut(back[0]), m = back[0];
          } catch (e2) {
          }
        }
      }
      await cxStore("chat_msgs", [m]);
    }
  }
  function cxTeam() {
    var c = null;
    CX.chats.forEach(function(x) {
      if (x.kind === "team" && AU.me && x.org_id === AU.me.org_id) c = x;
    });
    return c;
  }
  function cxOther(c) {
    var ks = c && c.dm_key ? c.dm_key.slice(3).split("|") : [];
    return ks[0] === AU.uid ? ks[1] : ks[0];
  }
  function cxTitle(c) {
    if (!c) return "";
    if (c.kind === "team") return t("cx_team");
    if (c.kind === "group") return c.title || t("cx_group");
    if (c.kind === "dm") return memberName(cxOther(c)) || t("cx_dm");
    if (c.kind === "net") return (AU.me && c.net_a === AU.me.org_id ? c.net_b_name : c.net_a_name) || t("cx_net");
    return "";
  }
  function cxNetOther(c) {
    return c && c.kind === "net" ? AU.me && c.net_a === AU.me.org_id ? c.net_b : c.net_a : null;
  }
  function cxList(kind) {
    var out = [];
    CX.chats.forEach(function(c) {
      if (c.deleted) return;
      if (kind === "net" ? c.kind === "net" : c.kind !== "net") out.push(c);
    });
    return out.sort(function(a, b) {
      if (a.kind === "team") return -1;
      if (b.kind === "team") return 1;
      return cxLastTs(b) - cxLastTs(a);
    });
  }
  function cxLast(c) {
    var arr = CX.msgs.get(c.id) || [];
    return arr[arr.length - 1] || null;
  }
  function cxLastTs(c) {
    var m = cxLast(c);
    return m ? cxTs(m.created_at) : cxTs(c.last_msg_at || c.created_at);
  }
  function cxMyRead(id) {
    var mm = CX.mem.get(id), me = mm && mm.get(AU.uid);
    return Math.max(me ? cxTs(me.last_read_at) : 0, CX.readLocal[id] || 0);
  }
  function cxUnread(id) {
    var lr = cxMyRead(id), c = CX.chats.get(id), n = 0;
    if (lr < 9783072e5) lr = c && c.kind === "team" ? Date.now() - 3 * 864e5 : 0;
    (CX.msgs.get(id) || []).forEach(function(m) {
      if (m.author_id !== AU.uid && !m.deleted && cxTs(m.created_at) > lr) n++;
    });
    return n;
  }
  function cxUnreadTotal(kind) {
    var n = 0;
    CX.chats.forEach(function(c) {
      if (c.deleted || CX.prefs[c.id]) return;
      if (kind && kind === "net" !== (c.kind === "net")) return;
      n += cxUnread(c.id);
    });
    return n;
  }
  function cxBadge() {
    var b = $("#chatBadge");
    if (!b) return;
    var n = syncOn() ? cxUnreadTotal() : 0;
    b.textContent = n > 99 ? "99+" : n;
    b.hidden = !n;
  }
  function cxPreview(m) {
    if (!m) return "";
    if (m.deleted) return t("cx_deleted");
    if (m.kind === "voice") return "\u{1F3A4} " + t("cx_voice") + " " + cxDur(m.duration);
    if (m.kind === "file") return "\u{1F4CE} " + (m.file_name || t("cx_file")) + (m.body ? " \u2014 " + m.body : "");
    var s = m.body || "";
    if (m.company_id || m.deal_id) s = "\u{1F517} " + s;
    return s.replace(/\s+/g, " ").slice(0, 90);
  }
  function cxDur(s) {
    s = Math.max(0, Math.round(s || 0));
    return Math.floor(s / 60) + ":" + pad(s % 60);
  }
  function cxReaders(c, m) {
    var mm = CX.mem.get(c.id), n = 0, at = cxTs(m.created_at);
    if (mm) mm.forEach(function(r, uid) {
      if (uid !== m.author_id && r.active !== false && cxTs(r.last_read_at) >= at) n++;
    });
    return n;
  }
  async function cxMarkRead(id) {
    if (!id || document.hidden) return;
    var arr = CX.msgs.get(id) || [], last = null;
    for (var i = arr.length - 1; i >= 0; i--) if (!arr[i]._pend && arr[i].author_id !== AU.uid) {
      last = arr[i];
      break;
    }
    if (!last) return;
    var ts = cxTs(last.created_at);
    if (ts <= cxMyRead(id)) return;
    CX.readLocal[id] = ts;
    cxBadge();
    if (S.tab === "chat" && !CX.openSh) renderChat();
    if (syncOn() && navigator.onLine !== false) {
      try {
        await rpc("crm_chat_read", { p_chat: id, p_at: last.created_at });
      } catch (e) {
        console.warn("read", e);
      }
    }
  }
  function cxNotify(m) {
    var c = CX.chats.get(m.chat_id);
    if (!c || CX.prefs[m.chat_id] || c.deleted) return;
    if (CX.openId === m.chat_id && !document.hidden) return;
    var title = cxTitle(c), body = (c.kind !== "dm" ? (m.author_name || memberName(m.author_id) || "") + ": " : "") + cxPreview(m);
    window.__cxNotified = (window.__cxNotified || 0) + 1;
    window.__cxLastNotify = { title, body };
    if (document.hidden) {
      if (NATIVE && PLUG.LocalNotifications) {
        try {
          PLUG.LocalNotifications.schedule({ notifications: [{ id: Math.abs(hashStr(m.id)) % 2e9, title, body, extra: { chat: m.chat_id }, schedule: { at: new Date(Date.now() + 300) } }] });
        } catch (e) {
        }
      } else if (window.Notification && Notification.permission === "granted") {
        try {
          var n = new Notification(title, { body, tag: m.chat_id, icon: "assets/sotuvdesc-mark.svg" });
          n.onclick = function() {
            window.focus();
            openChat(m.chat_id);
          };
        } catch (e) {
        }
      }
    } else if (!CX.openSh || CX.openId !== m.chat_id) toast(title + ": " + body.slice(0, 80), t("cx_open"), function() {
      openChat(m.chat_id);
    });
  }
  function cxRefresh() {
    cxBadge();
    if (CX.openSh && CX.openId) cxRedrawMsgs(CX.openSh);
    else if (S.tab === "chat" && !STACK.length) renderChat();
  }
  async function renderChat() {
    var v = $("#v-chat");
    if (!v) return;
    if (!syncOn()) {
      v.innerHTML = '<div class="pad"><h2>' + esc(t("tab_chat")) + '</h2><p class="note">' + esc(t("cx_need_login")) + "</p></div>";
      return;
    }
    if (!CX.loaded) await cxLoad();
    if (!isAdmin() && CX.seg === "net") CX.seg = "team";
    var nu = cxUnreadTotal("net"), tu = cxUnreadTotal("team");
    var keepQ = document.activeElement && document.activeElement.id === "cxQ";
    v.innerHTML = '<div class="pad cxpage">' + (isAdmin() ? '<div class="seg cxseg"><button data-act="cxSeg" data-seg="team" class="' + (CX.seg === "team" ? "on" : "") + '">' + ico("chat") + esc(t("cx_seg_team")) + (tu ? ' <b class="cxun">' + tu + "</b>" : "") + '</button><button data-act="cxSeg" data-seg="net" class="' + (CX.seg === "net" ? "on" : "") + '">' + ico("net") + esc(t("cx_seg_net")) + (nu ? ' <b class="cxun">' + nu + "</b>" : "") + "</button></div>" : "") + '<input class="inp" id="cxQ" type="search" autocomplete="off" placeholder="' + esc(t(CX.seg === "net" ? "net_search_ph" : "cx_search_ph")) + '" value="' + esc(CX.q) + '"><div id="cxBody"></div></div>';
    var q = $("#cxQ"), qt;
    q.oninput = function() {
      clearTimeout(qt);
      var val = this.value;
      qt = setTimeout(function() {
        CX.q = val.trim();
        cxBody();
      }, 200);
    };
    if (keepQ) {
      q.focus();
      try {
        q.setSelectionRange(q.value.length, q.value.length);
      } catch (e) {
      }
    }
    await cxBody();
    if (!CX.last) cxSchedule(50);
    try {
      if (!NATIVE && window.Notification && Notification.permission === "default" && !CX.askedN) {
        CX.askedN = 1;
        Notification.requestPermission();
      }
    } catch (e) {
    }
  }
  async function cxBody() {
    var box = $("#cxBody");
    if (!box) return;
    if (CX.seg === "net" && isAdmin()) return renderNet(box);
    if (CX.q) {
      box.innerHTML = cxSearchHtml(CX.q, "team");
      return;
    }
    var list = cxList("team");
    box.innerHTML = '<div class="row2 cxtop"><button class="btn ghost" data-act="cxNewDm">' + ico("user") + esc(t("cx_new_dm")) + "</button>" + (isAdmin() ? '<button class="btn ghost" data-act="cxNewGroup">' + ico("people") + esc(t("cx_new_group")) + "</button>" : "") + "</div>" + (list.length ? list.map(cxRowHtml).join("") : '<p class="muted">' + esc(CX.last ? t("cx_empty") : t("loading")) + "</p>") + (CX.err ? '<p class="red small">' + esc(t("cx_sync_err")) + "</p>" : "");
  }
  function cxRowHtml(c) {
    var m = cxLast(c), un = cxUnread(c.id), muted = CX.prefs[c.id], title = cxTitle(c);
    var who = m && c.kind !== "dm" && !m.deleted ? m.author_id === AU.uid ? t("cx_you") : m.author_name || memberName(m.author_id) || "" : m && m.author_id === AU.uid ? t("cx_you") : "";
    return '<button class="cxrow" data-act="cxOpen" data-cx="' + esc(c.id) + '"><span class="cxav k-' + c.kind + '">' + (c.kind === "team" ? ico("people") : c.kind === "group" ? ico("people") : c.kind === "net" ? ico("net") : esc(cxInit(title))) + '</span><span class="cxmain"><b>' + esc(title) + '</b><span class="rsub">' + (m ? (who ? esc(who) + ": " : "") + esc(cxPreview(m)) : esc(t(c.kind === "team" ? "cx_team_hint" : "cx_no_msgs"))) + '</span></span><span class="cxside"><span class="small muted">' + esc(m ? cxTime(m.created_at) : "") + "</span>" + (muted ? '<span class="cxmute" title="' + esc(t("cx_muted")) + '">' + ico("belloff") + "</span>" : "") + (un ? '<b class="cxun' + (muted ? " off" : "") + '">' + (un > 99 ? "99+" : un) + "</b>" : "") + "</span></button>";
  }
  function cxSearchHtml(q, kind) {
    var ql = q.toLowerCase(), hits = [];
    CX.mid.forEach(function(m) {
      var c = CX.chats.get(m.chat_id);
      if (!c || c.deleted || m.deleted || kind === "net" !== (c.kind === "net")) return;
      var s = ((m.body || "") + " " + (m.file_name || "") + " " + (m.author_name || "")).toLowerCase();
      if (s.indexOf(ql) >= 0) hits.push(m);
    });
    var chatHits = cxList(kind).filter(function(c) {
      return cxTitle(c).toLowerCase().indexOf(ql) >= 0;
    });
    hits.sort(function(a, b) {
      return a.created_at < b.created_at ? 1 : -1;
    });
    window.__cxSearch = hits.length;
    return (chatHits.length ? chatHits.map(cxRowHtml).join("") : "") + "<h3>" + esc(t("cx_found", { n: hits.length })) + "</h3>" + hits.slice(0, 100).map(function(m) {
      var c = CX.chats.get(m.chat_id);
      return '<button class="cxrow" data-act="cxOpen" data-cx="' + esc(m.chat_id) + '" data-mid="' + esc(m.id) + '"><span class="cxmain"><b>' + esc(cxTitle(c)) + " \xB7 " + esc(m.author_name || memberName(m.author_id) || "") + '</b><span class="rsub">' + esc(cxPreview(m)) + '</span></span><span class="cxside small muted">' + esc(cxTime(m.created_at)) + "</span></button>";
    }).join("");
  }
  async function openChat(id, opts) {
    opts = opts || {};
    var c = CX.chats.get(id);
    if (!c) {
      await cxSync();
      c = CX.chats.get(id);
      if (!c) {
        toast(t("cx_no_access"));
        return;
      }
    }
    if (CX.openSh && STACK.length && STACK[STACK.length - 1].firstChild === CX.openSh) await closeTop();
    if (!UIDMAP.size && db) await buildUidMap();
    var sh = openSheet("", { full: true, onClose: function() {
      if (CX.openSh !== sh) return;
      cxStopRec(true);
      if (CX.audio) {
        try {
          CX.audio.pause();
        } catch (e) {
        }
        CX.audio = null;
      }
      CX.openId = null;
      CX.openSh = null;
      CX.link = null;
      cxBadge();
      if (S.tab === "chat") renderChat();
    } });
    sh.classList.add("cxsheet");
    sh.dataset.cx = id;
    CX.openId = id;
    CX.openSh = sh;
    CX.link = opts.link || null;
    cxRenderSheet(sh);
    if (opts.mid) {
      var el = sh.querySelector('[data-mid="' + opts.mid + '"]');
      if (el) {
        el.scrollIntoView({ block: "center" });
        el.classList.add("hl");
      }
    }
    cxMarkRead(id);
  }
  function cxCanPost(c) {
    if (!c || c.deleted || !ROLE()) return false;
    if (c.kind === "net") {
      var o = cxNetOther(c);
      if (!isAdmin()) return false;
      if (CX.blocks.indexOf(o) >= 0 || c._blockedMe) return false;
    }
    return true;
  }
  function cxRenderSheet(sh) {
    var c = CX.chats.get(CX.openId);
    if (!c) return;
    var muted = CX.prefs[c.id], sub = "";
    if (c.kind === "team") sub = t("cx_members", { n: activeMembers().length });
    else if (c.kind === "group") {
      var mm = CX.mem.get(c.id), n = 0;
      if (mm) mm.forEach(function(r) {
        if (r.active !== false) n++;
      });
      sub = t("cx_members", { n });
    } else if (c.kind === "net") sub = t("cx_net_sub");
    else sub = t("cx_dm");
    var canEditGroup = c.kind === "group" && isAdmin();
    sh.innerHTML = sheetHead(cxTitle(c), '<button class="icbtn" data-act="cxMute" aria-label="' + esc(t(muted ? "cx_unmute" : "cx_mute")) + '" title="' + esc(t(muted ? "cx_unmute" : "cx_mute")) + '">' + ico(muted ? "belloff" : "bell") + "</button>" + (canEditGroup || c.kind === "net" ? '<button class="icbtn" data-act="cxMenu" aria-label="' + esc(t("cx_menu")) + '">' + ico("dots") + "</button>" : "")) + '<div class="cxsub muted small">' + esc(sub) + '</div><div class="cxmsgs" id="cxMsgs"></div><div id="cxComp"></div>';
    cxRedrawMsgs(sh, true);
    cxRenderComposer(sh);
  }
  function cxMsgsHtml(c) {
    var arr = CX.msgs.get(c.id) || [], out = [], lastDay = "", lr = cxMyRead(c.id), unreadMark = false;
    if (!arr.length) return window.SDOnb && SDOnb.chatEmpty(c) || '<p class="muted pad center">' + esc(t(c.kind === "team" ? "cx_team_hint" : "cx_no_msgs")) + "</p>";
    arr.forEach(function(m) {
      var day = cxDay(m.created_at);
      if (day !== lastDay) {
        out.push('<div class="cxday"><span>' + esc(day) + "</span></div>");
        lastDay = day;
      }
      if (!unreadMark && lr && m.author_id !== AU.uid && cxTs(m.created_at) > lr && !m._seen) {
        unreadMark = true;
        out.push('<div class="cxnew"><span>' + esc(t("cx_new_msgs")) + "</span></div>");
      }
      out.push(cxMsgHtml(c, m));
    });
    return out.join("");
  }
  function cxMsgHtml(c, m) {
    var mine = m.author_id === AU.uid, parts = [];
    if (!mine && c.kind !== "dm") parts.push('<b class="mauth">' + esc(m.author_name || memberName(m.author_id) || "\u2014") + "</b>");
    if (m.deleted) parts.push('<i class="muted">' + esc(t("cx_deleted")) + "</i>");
    else {
      if (m.company_id) {
        var cid = cidOfUid(m.company_id), e = cid ? BYID.get(cid) : null;
        parts.push('<button class="mlink" data-act="cxLink" data-co="' + esc(m.company_id) + '">' + ico("list") + "<span>" + esc(e ? e.n : t("cx_link_noaccess")) + "</span></button>");
      }
      if (m.deal_id) {
        var d = DL.list.filter(function(x) {
          return x.id === m.deal_id;
        })[0];
        parts.push('<button class="mlink" data-act="cxLink" data-deal="' + esc(m.deal_id) + '">' + ico("board") + "<span>" + esc(d ? d.title + " \xB7 " + money(d.amount, d.currency) : t("cx_link_noaccess")) + "</span></button>");
      }
      if (m.kind === "file") parts.push('<button class="mfile" data-act="cxFile" data-mid="' + esc(m.id) + '">' + (m.thumb ? '<img src="' + esc(m.thumb) + '" alt="">' : '<b class="fiext">' + esc((String(m.file_name || "file").split(".").pop() || "file").slice(0, 5).toUpperCase()) + "</b>") + "<span>" + esc(m.file_name || t("cx_file")) + " \xB7 " + esc(fmtBytes(m.file_size || 0)) + "</span></button>");
      if (m.kind === "voice") parts.push('<button class="mvoice" data-act="cxVoice" data-mid="' + esc(m.id) + '">' + ico(CX.audio && CX.audio._mid === m.id && !CX.audio.paused ? "pause" : "play") + '<span class="vbar"></span><span>' + esc(cxDur(m.duration)) + "</span></button>");
      if (m.body) parts.push('<div class="mtext">' + esc(m.body) + "</div>");
    }
    var st = "";
    if (mine && !m.deleted) {
      if (m._fail) st = '<span class="red">\u26A0 ' + esc(t("cx_failed")) + "</span>";
      else if (m._pend) st = '<span title="' + esc(t("cx_pending")) + '">\u{1F553}</span>';
      else {
        var n = cxReaders(c, m);
        st = c.kind === "dm" ? '<span class="tick' + (n ? " rd" : "") + '" title="' + esc(t(n ? "cx_read" : "cx_sent")) + '">' + (n ? "\u2713\u2713" : "\u2713") + "</span>" : n ? '<span class="tick rd">\u2713\u2713 ' + esc(t("cx_read_n", { n })) + "</span>" : '<span class="tick">\u2713</span>';
      }
    }
    return '<div class="msg' + (mine ? " mine" : "") + (m.deleted ? " del" : "") + '" data-act="cxMsg" data-mid="' + esc(m.id) + '">' + parts.join("") + '<span class="mmeta">' + (m.edited_at && !m.deleted ? esc(t("cx_edited")) + " \xB7 " : "") + esc(cxTime(m.created_at).length > 5 ? cxTime(m.created_at) : cxTime(m.created_at)) + " " + st + "</span></div>";
  }
  function cxRedrawMsgs(sh, first) {
    var c = CX.chats.get(CX.openId), box = sh.querySelector("#cxMsgs");
    if (!c || !box) return;
    var near = first || box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    box.innerHTML = cxMsgsHtml(c);
    if (window.SDOnb) SDOnb.chatAfter(sh, c);
    if (near) box.scrollTop = box.scrollHeight;
    if (!first) {
      var h = sh.querySelector(".sh-head h2");
      if (h) h.textContent = cxTitle(c);
      cxMarkRead(c.id);
      if (!sh.querySelector("#cxText") !== !cxCanPost(c)) cxRenderComposer(sh);
    }
  }
  function cxRenderComposer(sh) {
    var c = CX.chats.get(CX.openId), box = sh.querySelector("#cxComp");
    if (!c || !box) return;
    if (!cxCanPost(c)) {
      box.innerHTML = '<div class="note small cxnote">' + esc(t(c.kind === "net" ? "cx_net_blocked" : c.deleted ? "cx_archived" : "cx_cant_post")) + "</div>";
      return;
    }
    var lk = CX.link, label = "";
    if (lk && lk.company_id) {
      var cid = cidOfUid(lk.company_id), e = cid ? BYID.get(cid) : null;
      label = e ? e.n : "";
    }
    if (lk && lk.deal_id) {
      var d = DL.list.filter(function(x) {
        return x.id === lk.deal_id;
      })[0];
      label = d ? d.title : "";
    }
    var prev = sh.querySelector("#cxText"), txt = prev ? prev.value : "";
    box.innerHTML = (lk ? '<div class="cxlinkchip">' + ico(lk.deal_id ? "board" : "list") + "<span>" + esc(t("cx_link_attached", { n: label })) + '</span><button class="icbtn small" data-act="cxUnlink" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button></div>" : "") + '<div class="cxrec" id="cxRec" hidden><b class="recdot"></b><span id="cxRecT">0:00</span><span class="muted small">' + esc(t("cx_rec_max", { n: VOICE_SEC })) + '</span><button class="btn small ghost" data-act="cxRecCancel">' + esc(t("cancel")) + '</button><button class="btn small primary" data-act="cxRecSend">' + ico("send") + esc(t("cx_send")) + '</button></div><div class="cxcomp" id="cxBar"><button class="icbtn" data-act="cxAttach" aria-label="' + esc(t("cx_attach")) + '" title="' + esc(t("cx_attach")) + '">' + ico("clip") + '</button><textarea class="inp" id="cxText" rows="1" maxlength="4000" placeholder="' + esc(t("cx_ph")) + '" enterkeyhint="send">' + esc(txt) + '</textarea><button class="icbtn" data-act="cxMic" aria-label="' + esc(t("cx_voice_rec")) + '" title="' + esc(t("cx_voice_rec")) + '">' + ico("mic") + '</button><button class="btn primary cxsend" data-act="cxSend" aria-label="' + esc(t("cx_send")) + '">' + ico("send") + "</button></div>";
    var ta = box.querySelector("#cxText");
    var fit = function() {
      ta.style.height = "auto";
      ta.style.height = Math.min(140, ta.scrollHeight) + "px";
    };
    ta.oninput = fit;
    fit();
    ta.onkeydown = function(e2) {
      if (e2.key === "Enter" && !e2.shiftKey && !NATIVE && window.innerWidth > 700) {
        e2.preventDefault();
        cxSend();
      }
    };
  }
  async function cxSend() {
    var sh = CX.openSh, c = CX.chats.get(CX.openId);
    if (!sh || !c) return;
    var ta = sh.querySelector("#cxText"), body = ta ? ta.value.trim() : "";
    if (!body && CX.link) body = t("cx_link_default");
    if (!body) {
      if (ta) ta.focus();
      return;
    }
    if (body.length > 4e3) {
      toast(t("cx_too_long"));
      return;
    }
    var now = (/* @__PURE__ */ new Date()).toISOString();
    var m = { id: uuid(), chat_id: c.id, author_id: AU.uid, author_name: myName(), kind: "text", body, company_id: CX.link && CX.link.company_id || null, deal_id: CX.link && CX.link.deal_id || null, created_at: now, updated_at: now, edited_at: null, deleted: false, _pend: 1 };
    cxMsgPut(m);
    await cxStore("chat_msgs", [m]);
    CX.link = null;
    if (ta) ta.value = "";
    cxRenderComposer(sh);
    cxRedrawMsgs(sh, true);
    var nt = sh.querySelector("#cxText");
    if (nt && !NATIVE) nt.focus();
    cxSchedule(30);
  }
  async function cxSaveMsg(m) {
    cxMsgPut(m);
    await cxStore("chat_msgs", [m]);
    if (CX.openSh) cxRedrawMsgs(CX.openSh);
    cxSchedule(30);
  }
  function cxEditable(m) {
    return m.author_id === AU.uid && !m.deleted && Date.now() - cxTs(m.created_at) < 24 * 36e5 - 3e4;
  }
  async function cxMsgMenu(mid) {
    var m = CX.mid.get(mid), c = m && CX.chats.get(m.chat_id);
    if (!m || !c || m.deleted) return;
    var acts = [];
    if (m.body) acts.push(["copy", t("cx_copy")]);
    if (m._fail) acts.push(["retry", t("cx_retry")], ["drop", t("cx_drop")]);
    if (!m._fail && cxEditable(m) && !m._pend && m.kind === "text" && cxCanPost(c)) acts.push(["edit", t("edit")]);
    if (!m._fail && cxEditable(m) && !m._pend) acts.push(["del", t("del")]);
    if (m.author_id !== AU.uid && c.kind === "net") acts.push(["report", t("cx_report")]);
    if (m.author_id === AU.uid && !cxEditable(m) && !m._fail && !m._pend) acts.push(["old", t("cx_24h")]);
    if (!acts.length) return;
    var ms = openSheet(sheetHead(cxPreview(m).slice(0, 60)) + '<div class="col">' + acts.map(function(a) {
      return '<button class="btn ' + (a[0] === "del" || a[0] === "drop" || a[0] === "report" ? "danger" : "ghost") + '" data-cxa="' + a[0] + '"' + (a[0] === "old" ? " disabled" : "") + ">" + esc(a[1]) + "</button>";
    }).join("") + "</div>");
    $$("[data-cxa]", ms).forEach(function(b) {
      b.onclick = async function() {
        var a = b.dataset.cxa;
        await closeTop();
        if (a === "copy") return copyText(m.body);
        if (a === "retry") {
          m._fail = "";
          m._pend = 1;
          return cxSaveMsg(m);
        }
        if (a === "drop") {
          var arr = CX.msgs.get(m.chat_id) || [];
          CX.msgs.set(m.chat_id, arr.filter(function(x) {
            return x !== m;
          }));
          CX.mid.delete(m.id);
          var tx = db.transaction("chat_msgs", "readwrite");
          tx.objectStore("chat_msgs").delete(m.id);
          await txDone(tx);
          if (CX.openSh) cxRedrawMsgs(CX.openSh);
          return;
        }
        if (a === "edit") {
          var nv = await ask(t("cx_edit_q"), { input: m.body, ok: t("save") });
          if (nv == null || !nv.trim() || nv.trim() === m.body) return;
          if (!cxEditable(m)) {
            toast(t("cx_24h"));
            return;
          }
          m.body = nv.trim().slice(0, 4e3);
          m.edited_at = (/* @__PURE__ */ new Date()).toISOString();
          m._edit = { body: m.body };
          return cxSaveMsg(m);
        }
        if (a === "del") {
          if (!await ask(t("cx_del_q"), { danger: true, ok: t("del") })) return;
          if (!cxEditable(m)) {
            toast(t("cx_24h"));
            return;
          }
          if (m.file_path && m.author_id === AU.uid && !m._pend) await cxDelObject(m.file_path, m.kind);
          m.deleted = true;
          m.body = "";
          m.file_path = null;
          m.thumb = null;
          m.company_id = null;
          m.deal_id = null;
          m._edit = { deleted: true };
          return cxSaveMsg(m);
        }
        if (a === "report") {
          var why = await ask(t("cx_report_q"), { input: "", ok: t("cx_report") });
          if (why == null) return;
          try {
            await rpc("crm_chat_report", { p_message: m.id, p_reason: why.trim().slice(0, 500) });
            toast(t("cx_reported"));
          } catch (e) {
            toast(t("err", { e: e.message }));
          }
        }
      };
    });
  }
  function cxKey(name) {
    return safeKey(name).replace(/\.{2,}/g, ".").slice(-120) || "file";
  }
  function mimeOkChat(kind, blob, name) {
    if (kind === "voice" || safeMime(blob.type, name)) return true;
    toast(t("cat_file_type"));
    return false;
  }
  async function cxUpload(blob, kind, name, duration) {
    var c = CX.chats.get(CX.openId);
    if (!c) return;
    if (!syncOn() || navigator.onLine === false) {
      toast(t("cx_file_offline"));
      return;
    }
    if (!blob || !blob.size) {
      toast(t("fi_fail", { e: "0 B" }));
      return;
    }
    if (kind === "voice" && blob.size > VOICE_MAX) {
      toast(t("cx_voice_big"));
      return;
    }
    if (blob.size > FILE_MAX) {
      toast(t("fi_big"));
      return;
    }
    if (!mimeOkChat(kind, blob, name)) return;
    var id = uuid(), path = "chat/" + c.id + "/" + id + "/" + cxKey(name), mime = kind === "voice" ? voiceMime(blob.type) : safeMime(blob.type, name), row = null, bucket = kind === "voice" ? "sotuvdesc-voice" : "sotuvdesc-files";
    busy(t(kind === "voice" ? "cx_voice_sending" : "fi_uploading"), 0.3);
    try {
      var thumb = kind === "file" ? await makeThumb(blob) : null;
      row = { id, chat_id: c.id, kind, body: "", file_path: path, file_name: String(name || "file").slice(0, 200), file_mime: mime, file_size: blob.size, duration: kind === "voice" ? Math.max(1, Math.min(VOICE_SEC, Math.round(duration || 1))) : null, thumb };
      await api("POST", "crm_chat_messages", row, "return=minimal");
      busy(t(kind === "voice" ? "cx_voice_sending" : "fi_uploading"), 0.6);
      await ensureFresh();
      var res = await fetch(baseUrl() + "/storage/v1/object/" + bucket + "/" + storagePath(path), { method: "POST", headers: { apikey: anonKey(), Authorization: "Bearer " + AU.s.access_token, "Content-Type": mime, "x-upsert": "false" }, body: blob });
      if (!res.ok) throw new Error("HTTP " + res.status + " " + (await res.text()).slice(0, 120));
      var now = (/* @__PURE__ */ new Date()).toISOString();
      row.author_id = AU.uid;
      row.author_name = myName();
      row.created_at = row.updated_at = now;
      row.deleted = false;
      cxMsgPut(row);
      await cxStore("chat_msgs", [row]);
      busy(null);
      window.__cxLastUpload = { id, kind, size: blob.size, thumb: !!thumb, bucket, mime };
      if (CX.openSh) cxRedrawMsgs(CX.openSh, true);
      cxSchedule(100);
    } catch (e) {
      busy(null);
      toast(t("fi_fail", { e: e.message || e }));
      console.warn("chat upload", e);
      if (row) {
        try {
          await api("PATCH", "crm_chat_messages?id=eq." + id, { deleted: true }, "return=minimal");
        } catch (e2) {
        }
      }
    }
  }
  function cxPick() {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.style.display = "none";
    inp.onchange = function() {
      var f = inp.files && inp.files[0];
      inp.remove();
      if (f) cxUpload(f, "file", f.name);
    };
    document.body.appendChild(inp);
    inp.click();
  }
  async function cxSignedUrl(path, kind) {
    if (kind === "voice") {
      try {
        return await fileSignedUrl({ path }, "sotuvdesc-voice");
      } catch (e) {
      }
    }
    return fileSignedUrl({ path });
  }
  async function cxDelObject(path, kind) {
    if (!path || !syncOn() || navigator.onLine === false) return false;
    try {
      await ensureFresh();
      var bs = kind === "voice" ? ["sotuvdesc-voice", "sotuvdesc-files"] : ["sotuvdesc-files"];
      for (var i = 0; i < bs.length; i++) {
        var r = await fetch(baseUrl() + "/storage/v1/object/" + bs[i] + "/" + storagePath(path), { method: "DELETE", headers: { apikey: anonKey(), Authorization: "Bearer " + AU.s.access_token } });
        if (r.ok) {
          window.__cxDelObj = { path, bucket: bs[i] };
          return true;
        }
      }
    } catch (e) {
      console.warn("chat file delete", e);
    }
    return false;
  }
  async function cxOpenFile(mid) {
    var m = CX.mid.get(mid);
    if (!m || !m.file_path) return;
    if (!syncOn() || navigator.onLine === false) {
      toast(t("fi_offline"));
      return;
    }
    try {
      var u = await cxSignedUrl(m.file_path, m.kind);
      window.__lastFileUrl = u;
      openExt(u);
    } catch (e) {
      toast(t("fi_open_fail"));
    }
  }
  async function cxPlay(mid) {
    var m = CX.mid.get(mid);
    if (!m || !m.file_path) return;
    if (CX.audio && CX.audio._mid === mid) {
      if (CX.audio.paused) CX.audio.play();
      else CX.audio.pause();
      if (CX.openSh) cxRedrawMsgs(CX.openSh);
      return;
    }
    if (CX.audio) {
      try {
        CX.audio.pause();
      } catch (e) {
      }
    }
    try {
      var u = await cxSignedUrl(m.file_path, m.kind), a = new Audio(u);
      a._mid = mid;
      CX.audio = a;
      a.onended = a.onpause = a.onplay = function() {
        if (CX.openSh) cxRedrawMsgs(CX.openSh);
      };
      window.__cxPlayUrl = u;
      await a.play();
    } catch (e) {
      toast(t("cx_play_fail"));
      console.warn("voice", e);
    }
  }
  async function cxStartRec() {
    if (CX.rec) return;
    if (!syncOn() || navigator.onLine === false) {
      toast(t("cx_file_offline"));
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      toast(t("cx_rec_unsup"));
      return;
    }
    var stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      toast(t("cx_rec_denied"));
      return;
    }
    var types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/aac"];
    var mime = types.filter(function(x) {
      try {
        return MediaRecorder.isTypeSupported(x);
      } catch (e) {
        return false;
      }
    })[0] || "";
    var rec;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32e3 } : { audioBitsPerSecond: 32e3 });
    } catch (e) {
      rec = new MediaRecorder(stream);
    }
    var st = { rec, stream, chunks: [], t0: Date.now(), mime: rec.mimeType || mime || "audio/webm" };
    rec.ondataavailable = function(e) {
      if (e.data && e.data.size) st.chunks.push(e.data);
    };
    rec.start(500);
    CX.rec = st;
    var sh = CX.openSh;
    if (sh) {
      sh.querySelector("#cxRec").hidden = false;
      sh.querySelector("#cxBar").hidden = true;
    }
    st.timer = setInterval(function() {
      var s = (Date.now() - st.t0) / 1e3, el = CX.openSh && CX.openSh.querySelector("#cxRecT");
      if (el) el.textContent = cxDur(s);
      if (s >= VOICE_SEC) cxFinishRec(true);
    }, 250);
  }
  function cxStopRec(cancel) {
    var st = CX.rec;
    if (!st) return Promise.resolve(null);
    CX.rec = null;
    clearInterval(st.timer);
    var sh = CX.openSh;
    if (sh && sh.querySelector("#cxRec")) {
      sh.querySelector("#cxRec").hidden = true;
      sh.querySelector("#cxBar").hidden = false;
    }
    return new Promise(function(res) {
      var done = function() {
        st.stream.getTracks().forEach(function(tr) {
          tr.stop();
        });
        res(cancel ? null : { blob: new Blob(st.chunks, { type: st.mime.split(";")[0] }), sec: Math.min(VOICE_SEC, (Date.now() - st.t0) / 1e3), mime: st.mime });
      };
      if (st.rec.state === "inactive") return done();
      st.rec.onstop = done;
      try {
        st.rec.stop();
      } catch (e) {
        done();
      }
    });
  }
  async function cxFinishRec(send) {
    var r = await cxStopRec(!send);
    if (!r) return;
    if (r.sec < 0.7) {
      toast(t("cx_rec_short"));
      return;
    }
    var ext = /mp4|aac/.test(r.mime) ? "m4a" : /ogg/.test(r.mime) ? "ogg" : "webm";
    await cxUpload(r.blob, "voice", "voice-" + ymd(/* @__PURE__ */ new Date()) + "." + ext, r.sec);
  }
  function cxPickMember(title, onPick) {
    var list = activeMembers().filter(function(m) {
      return m.user_id !== AU.uid;
    });
    var sh = openSheet(sheetHead(title) + '<div class="col">' + (list.length ? list.map(function(m) {
      return '<button class="btn ghost left" data-uid="' + esc(m.user_id) + '"><span class="cxav">' + esc(cxInit(m.display_name || m.email)) + "</span>" + esc(m.display_name || m.email) + " \xB7 " + esc(t("role_" + m.role)) + "</button>";
    }).join("") : '<p class="muted">' + esc(t("cx_no_colleagues")) + "</p>") + "</div>");
    $$("[data-uid]", sh).forEach(function(b) {
      b.onclick = async function() {
        await closeTop();
        onPick(b.dataset.uid);
      };
    });
  }
  async function cxOpenDm(uid, opts) {
    try {
      busy(t("loading"), 0.5);
      var id = await rpc("crm_chat_open_dm", { p_user: uid });
      await cxSync();
      busy(null);
      await openChat(id, opts);
    } catch (e) {
      busy(null);
      toast(NET_ERR(e) ? t("cx_need_net") : t("err", { e: e.message }));
    }
  }
  function cxGroupEdit(c) {
    var cur = /* @__PURE__ */ new Set();
    if (c) {
      var mm = CX.mem.get(c.id);
      if (mm) mm.forEach(function(r, uid) {
        if (r.active !== false) cur.add(uid);
      });
    }
    var list = activeMembers().filter(function(m) {
      return m.user_id !== AU.uid;
    });
    var sh = openSheet(sheetHead(c ? t("cx_group_edit") : t("cx_new_group")) + '<div class="form">' + lab(t("cx_group_title"), '<input class="inp" id="gTitle" maxlength="80" value="' + esc(c ? c.title || "" : "") + '" placeholder="' + esc(t("cx_group_ph")) + '">') + '<div class="sub">' + esc(t("cx_group_members")) + "</div>" + list.map(function(m) {
      return chk("g_" + m.user_id, (m.display_name || m.email) + " \xB7 " + t("role_" + m.role), cur.has(m.user_id));
    }).join("") + '<div class="row2">' + (c ? '<button class="btn danger" id="gArch">' + esc(t("cx_group_archive")) + "</button>" : '<button class="btn ghost" data-act="close">' + esc(t("cancel")) + "</button>") + '<button class="btn primary" id="gSave">' + esc(t("save")) + "</button></div></div>", { full: true });
    sh.querySelector("#gSave").onclick = async function() {
      var title = sh.querySelector("#gTitle").value.trim();
      if (!title) {
        sh.querySelector("#gTitle").focus();
        return;
      }
      var ids = list.filter(function(m) {
        var el = sh.querySelector("#g_" + m.user_id);
        return el && el.checked;
      }).map(function(m) {
        return m.user_id;
      });
      try {
        busy(t("loading"), 0.5);
        var id = await rpc("crm_chat_group_save", { p_chat: c ? c.id : null, p_title: title, p_members: ids });
        await cxSync();
        busy(null);
        await closeTop();
        if (!c) openChat(id);
        else if (CX.openSh) cxRenderSheet(CX.openSh);
        toast(t("c_saved"));
      } catch (e) {
        busy(null);
        toast(/too_many_groups/.test(e.message) ? t("cx_groups_limit") : NET_ERR(e) ? t("cx_need_net") : t("err", { e: e.message }));
      }
    };
    var ar = sh.querySelector("#gArch");
    if (ar) ar.onclick = async function() {
      if (!await ask(t("cx_group_archive_q", { n: c.title }), { danger: true, ok: t("cx_group_archive") })) return;
      try {
        await rpc("crm_chat_group_archive", { p_chat: c.id });
        await cxSync();
        await closeTop();
        if (CX.openSh) await closeTop();
        toast(t("cx_archived_done"));
      } catch (e) {
        toast(t("err", { e: e.message }));
      }
    };
  }
  async function cxMenu() {
    var c = CX.chats.get(CX.openId);
    if (!c) return;
    if (c.kind === "group") return cxGroupEdit(c);
    if (c.kind === "net") {
      var other = cxNetOther(c);
      await netLoad(true);
      var blocked = CX.blocks.indexOf(other) >= 0;
      var ms = openSheet(sheetHead(cxTitle(c)) + '<div class="col"><p class="muted small">' + esc(t("net_privacy")) + '</p><button class="btn ' + (blocked ? "ghost" : "danger") + '" id="nBlock">' + esc(t(blocked ? "net_unblock" : "net_block")) + "</button></div>");
      ms.querySelector("#nBlock").onclick = async function() {
        await closeTop();
        await netBlock(other, !blocked, cxTitle(c));
        if (CX.openSh) cxRenderComposer(CX.openSh);
      };
    }
  }
  function cxDiscuss(link) {
    if (!syncOn()) {
      toast(t("cx_need_login"));
      return;
    }
    var list = cxList("team").filter(function(c) {
      return !c.deleted;
    });
    var sh = openSheet(sheetHead(t("cx_discuss")) + '<p class="muted small pad0">' + esc(t("cx_discuss_hint")) + '</p><div class="col">' + list.map(function(c) {
      return '<button class="btn ghost left" data-cxp="' + esc(c.id) + '">' + esc(cxTitle(c)) + "</button>";
    }).join("") + '<button class="btn ghost" data-cxp="__dm">' + ico("user") + esc(t("cx_new_dm")) + "</button></div>");
    $$("[data-cxp]", sh).forEach(function(b) {
      b.onclick = async function() {
        await closeTop();
        if (b.dataset.cxp === "__dm") return cxPickMember(t("cx_new_dm"), function(uid) {
          cxOpenDm(uid, { link });
        });
        openChat(b.dataset.cxp, { link });
      };
    });
  }
  async function netLoad(force) {
    if (!syncOn() || !isAdmin()) return;
    if (!force && Date.now() - CX.netAt < 15e3 && CX.profiles.length) return;
    try {
      var r = await Promise.all([api("GET", "crm_net_profiles?select=*&order=company_name.asc&limit=2000"), api("GET", "crm_net_blocks?select=blocked_org")]);
      CX.profiles = r[0] || [];
      CX.blocks = (r[1] || []).map(function(b) {
        return b.blocked_org;
      });
      CX.netAt = Date.now();
    } catch (e) {
      console.warn("net", e);
    }
  }
  async function renderNet(box) {
    box.innerHTML = '<p class="muted">' + esc(t("loading")) + "</p>";
    await netLoad();
    var myOrg = AU.me && AU.me.org_id, mine = CX.profiles.filter(function(p) {
      return p.org_id === myOrg;
    })[0], q = CX.q.toLowerCase();
    var others = CX.profiles.filter(function(p) {
      return p.org_id !== myOrg && p.visible;
    });
    if (q) others = others.filter(function(p) {
      return [p.company_name, p.city, p.industry, p.about, p.looking].join(" ").toLowerCase().indexOf(q) >= 0;
    });
    var chats = cxList("net");
    box.innerHTML = '<div class="netme"><div><b>' + esc(t("net_me")) + '</b><div class="small ' + (mine && mine.visible ? "green" : "muted") + '">' + esc(mine ? mine.visible ? t("net_visible", { n: mine.company_name }) : t("net_hidden") : t("net_off")) + '</div></div><button class="btn small primary" data-act="netEdit">' + esc(t(mine ? "edit" : "net_join")) + "</button></div>" + (chats.length && !q ? "<h3>" + esc(t("net_chats")) + "</h3>" + chats.map(cxRowHtml).join("") : "") + (q ? cxSearchHtml(CX.q, "net") : "") + "<h3>" + esc(t("net_catalog")) + " \xB7 " + others.length + "</h3>" + (others.length ? others.slice(0, 300).map(function(p) {
      return '<button class="cxrow" data-act="netCard" data-org="' + esc(p.org_id) + '"><span class="cxav k-net">' + esc(cxInit(p.company_name)) + '</span><span class="cxmain"><b>' + esc(p.company_name) + '</b><span class="rsub">' + esc([p.industry, p.city].filter(Boolean).join(" \xB7 ") || "\u2014") + "</span></span>" + (CX.blocks.indexOf(p.org_id) >= 0 ? '<span class="cxside small red">' + esc(t("net_blocked_short")) + "</span>" : "") + "</button>";
    }).join("") : '<p class="muted">' + esc(t(q ? "nothing_found" : "net_empty")) + "</p>") + '<p class="note small">' + esc(t("net_privacy")) + "</p>";
  }
  function netEdit() {
    var myOrg = AU.me && AU.me.org_id, p = CX.profiles.filter(function(x) {
      return x.org_id === myOrg;
    })[0] || { company_name: AU.me && AU.me.org_name || "", visible: false };
    var sh = openSheet(sheetHead(t("net_me")) + '<div class="form"><p class="muted small">' + esc(t("net_edit_help")) + "</p>" + lab(t("net_name"), '<input class="inp" id="nName" maxlength="120" value="' + esc(p.company_name || "") + '">') + lab(t("fld_city"), '<input class="inp" id="nCity" maxlength="80" value="' + esc(p.city || "") + '">') + lab(t("fld_industry"), '<input class="inp" id="nInd" maxlength="120" value="' + esc(p.industry || "") + '">') + lab(t("net_about"), '<textarea class="inp" id="nAbout" rows="3" maxlength="500">' + esc(p.about || "") + "</textarea>") + lab(t("net_looking"), '<textarea class="inp" id="nLook" rows="2" maxlength="500">' + esc(p.looking || "") + "</textarea>") + '<label class="chk big"><input type="checkbox" id="nVis"' + (p.visible ? " checked" : "") + "><span>" + esc(t("net_show")) + '</span></label><div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="nSave">' + esc(t("save")) + "</button></div></div>", { full: true });
    sh.querySelector("#nSave").onclick = async function() {
      var g = function(id) {
        return sh.querySelector(id).value.trim();
      };
      if (g("#nName").length < 2) {
        sh.querySelector("#nName").focus();
        return;
      }
      try {
        await rpc("crm_net_save", { p_name: g("#nName"), p_city: g("#nCity"), p_industry: g("#nInd"), p_about: g("#nAbout"), p_looking: g("#nLook"), p_visible: sh.querySelector("#nVis").checked });
        await netLoad(true);
        await closeTop();
        toast(t("c_saved"));
        renderChat();
      } catch (e) {
        toast(NET_ERR(e) ? t("cx_need_net") : t("err", { e: e.message }));
      }
    };
  }
  function netCard(org) {
    var p = CX.profiles.filter(function(x) {
      return x.org_id === org;
    })[0];
    if (!p) return;
    var blocked = CX.blocks.indexOf(org) >= 0;
    var sh = openSheet(sheetHead(p.company_name) + '<div class="cbody"><div class="cmeta">' + esc([p.industry, p.city].filter(Boolean).join(" \xB7 ")) + "</div>" + (p.about ? "<section><h3>" + esc(t("net_about")) + '</h3><div class="ht">' + esc(p.about) + "</div></section>" : "") + (p.looking ? "<section><h3>" + esc(t("net_looking")) + '</h3><div class="ht">' + esc(p.looking) + "</div></section>" : "") + '<div class="col"><button class="btn primary" id="nWrite"' + (blocked ? " disabled" : "") + ">" + ico("chat") + esc(t("net_write")) + '</button><button class="btn ' + (blocked ? "ghost" : "danger") + '" id="nBlock">' + esc(t(blocked ? "net_unblock" : "net_block")) + '</button></div><p class="note small">' + esc(t("net_privacy")) + "</p></div>", { full: true });
    sh.querySelector("#nWrite").onclick = async function() {
      try {
        busy(t("loading"), 0.5);
        var id = await rpc("crm_net_open", { p_org: org });
        await cxSync();
        busy(null);
        await closeTop();
        openChat(id);
      } catch (e) {
        busy(null);
        toast(/too_many_chats/.test(e.message) ? t("net_limit") : /blocked/.test(e.message) ? t("cx_net_blocked") : /not_in_network/.test(e.message) ? t("net_gone") : NET_ERR(e) ? t("cx_need_net") : t("err", { e: e.message }));
      }
    };
    sh.querySelector("#nBlock").onclick = async function() {
      await closeTop();
      await netBlock(org, !blocked, p.company_name);
    };
  }
  async function netBlock(org, on, name) {
    if (on && !await ask(t("net_block_q", { n: name || "" }), { danger: true, ok: t("net_block") })) return;
    try {
      await rpc("crm_net_block", { p_org: org, p_on: on });
      await netLoad(true);
      toast(t(on ? "net_blocked_done" : "net_unblocked_done"));
      cxSchedule(50);
      if (S.tab === "chat" && !STACK.length) renderChat();
    } catch (e) {
      toast(NET_ERR(e) ? t("cx_need_net") : t("err", { e: e.message }));
    }
  }
  function filesFor(kind, uid) {
    var k = kind === "deal" ? "deal_id" : "contact_id";
    return FI.list.filter(function(f) {
      return f[k] === uid;
    }).sort(function(a, b) {
      return (b.created_at || "") < (a.created_at || "") ? -1 : 1;
    });
  }
  function filesBlockHtml(kind, uid, can) {
    var fs = filesFor(kind, uid);
    return '<section class="fisec2" data-fk="' + kind + '" data-fu="' + esc(uid) + '"><h3>' + esc(t("fi_title")) + (fs.length ? " \xB7 " + fs.length : "") + "</h3>" + (fs.length ? '<div class="figrid">' + fs.map(function(f) {
      var del = f.created_uid === AU.uid || isAdmin();
      return '<div class="fitile"><button class="fiopen" data-act="fileOpen" data-fid="' + esc(f.id) + '">' + (f.thumb ? '<img src="' + esc(f.thumb) + '" alt="">' : '<b class="fiext">' + esc((String(f.name).split(".").pop() || "file").slice(0, 5).toUpperCase()) + "</b>") + '<span class="finame">' + esc(f.name) + '</span><span class="muted small">' + fmtBytes(f.size) + "</span></button>" + (del ? '<button class="icbtn small fidel" data-act="fileDel" data-fid="' + esc(f.id) + '" aria-label="' + esc(t("del")) + '">' + ico("x") + "</button>" : "") + "</div>";
    }).join("") + "</div>" : '<p class="muted small">' + esc(t("fi_none")) + "</p>") + (can && syncOn() ? '<div class="row2"><button class="btn small ghost" data-act="filePick2" data-cap="1">' + esc(t("fi_photo")) + '</button><button class="btn small ghost" data-act="filePick2">' + ico("upload") + esc(t("fi_attach")) + "</button></div>" : ROLE() ? "" : '<p class="note small">' + esc(t("fi_offline")) + "</p>") + "</section>";
  }
  function pickFile2(sh, sec, capture) {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.style.display = "none";
    if (capture) {
      inp.accept = "image/*";
      inp.setAttribute("capture", "environment");
    }
    inp.onchange = function() {
      var f = inp.files && inp.files[0];
      inp.remove();
      if (f) uploadFile2(sh, sec.dataset.fk, sec.dataset.fu, f);
    };
    document.body.appendChild(inp);
    inp.click();
  }
  async function uploadFile2(sh, kind, uid, file) {
    if (file.size > FILE_MAX) {
      toast(t("fi_big"));
      return;
    }
    if (!file.size) {
      toast(t("fi_fail", { e: "0 B" }));
      return;
    }
    var fmime = safeMime(file.type, file.name);
    if (!fmime) {
      toast(t("cat_file_type"));
      return;
    }
    if (!syncOn() || navigator.onLine === false) {
      toast(t("fi_offline"));
      return;
    }
    var store = kind === "deal" ? "deals" : "contacts", rec = (await genAll(store)).filter(function(x) {
      return x.id === uid;
    })[0];
    if (!rec) return;
    if (!rec._synced) {
      await syncNow();
      rec = (await genAll(store)).filter(function(x) {
        return x.id === uid;
      })[0];
      if (!rec || !rec._synced) {
        toast(t("fi_wait"));
        return;
      }
    }
    busy(t("fi_uploading"), 0.3);
    var id = uuid(), path = AU.me.org_id + "/" + id + "/" + safeKey(file.name), row = null;
    try {
      var thumb = await makeThumb(file);
      row = { id, org_id: AU.me.org_id, company_id: null, contact_id: kind === "contact" ? uid : null, deal_id: kind === "deal" ? uid : null, name: String(file.name || "file").slice(0, 200), mime: fmime, size: file.size, path, thumb, author: myName() || null, deleted: false };
      await api("POST", "crm_files", row, "return=minimal");
      await ensureFresh();
      var res = await fetch(baseUrl() + "/storage/v1/object/sotuvdesc-files/" + storagePath(path), { method: "POST", headers: { apikey: anonKey(), Authorization: "Bearer " + AU.s.access_token, "Content-Type": row.mime, "x-upsert": "false" }, body: file });
      if (!res.ok) throw new Error("HTTP " + res.status + " " + (await res.text()).slice(0, 120));
      row.created_uid = AU.uid;
      row.created_at = row.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      row._synced = 1;
      row._pend = 0;
      row._base = JSON.parse(JSON.stringify(genKeys(row)));
      var tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(row);
      await txDone(tx);
      if (kind === "deal") await addTouch({ cid: cidOfUid(rec.company_id) || 0, dealId: uid, kind: "note", text: t("fi_log", { n: row.name }) });
      busy(null);
      toast(t("fi_done"));
      window.__lastFile = { id, name: row.name, size: row.size, thumb: !!thumb, kind };
    } catch (e) {
      busy(null);
      toast(t("fi_fail", { e: e.message || e }));
      if (row) {
        try {
          await api("PATCH", "crm_files?id=eq." + id, { deleted: true }, "return=minimal");
        } catch (e2) {
        }
      }
    }
    await loadFiles();
    if (sh._refiles) sh._refiles();
  }
  function refreshFilesBlock(sh) {
    $$(".fisec2", sh).forEach(function(sec) {
      var can = sec.querySelector("[data-act=filePick2]") != null;
      var tmp = document.createElement("div");
      tmp.innerHTML = filesBlockHtml(sec.dataset.fk, sec.dataset.fu, can);
      sec.replaceWith(tmp.firstChild);
    });
  }
  function hasContact(e) {
    return !!(e.f & (F_EMAIL | F_PHONE | F_CH)) && ("," + e.tg + ",").indexOf(",\u043D\u0435\u0442 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430,") < 0;
  }
  async function idxFixups() {
    if (await metaGet("fix160") === 2) return;
    alive("fix160");
    var ids = await new Promise(function(res) {
      var out = /* @__PURE__ */ new Set(), req = db.transaction("companies").objectStore("companies").index("kCh").openKeyCursor();
      req.onsuccess = function() {
        var c = req.result;
        if (!c) return res(out);
        out.add(c.primaryKey);
        c.continue();
      };
      req.onerror = function() {
        res(out);
      };
    });
    var remap = /* @__PURE__ */ new Map();
    DICT.country.forEach(function(v, i2) {
      if (i2 > 0) {
        var cc = countryCode(v);
        if (cc && cc !== v) remap.set(i2, code("country", cc));
      }
    });
    var n = 0;
    for (var i = 0; i < IDX.length; i++) {
      var e = IDX[i], ch = false;
      if (ids.has(e.id) && !(e.f & F_CH)) {
        e.f |= F_CH;
        ch = true;
      }
      if (remap.has(e.co)) {
        e.co = remap.get(e.co);
        ch = true;
      }
      if (ch) {
        DIRTY.add(Math.floor(e.id / CH));
        n++;
      }
      if (i % 5e3 === 4999) {
        alive();
        await sleep0();
      }
    }
    var tx = db.transaction(["idx", "meta"], "readwrite");
    flushIdx(tx);
    tx.objectStore("meta").put({ k: "fix160", v: 2 });
    await txDone(tx);
    window.__fix160 = { ch: ids.size, changed: n };
  }
  var DUP_KEYS = [["kInn", "dup_inn"], ["kPhone", "dup_phone"], ["kEmail", "dup_email"], ["kWeb", "dup_web"], ["kCh", "dup_ch"], ["kNCity", "dup_name"]];
  async function findDupes() {
    var groups = [], seen = /* @__PURE__ */ new Set();
    for (var k = 0; k < DUP_KEYS.length; k++) {
      busy(t("dup_scan"), k / DUP_KEYS.length);
      var key = DUP_KEYS[k];
      await new Promise(function(res) {
        var cur = null, ids = [];
        var flush = function() {
          if (ids.length > 1 && ids.length <= 20) {
            var ok = ids.filter(function(id) {
              return BYID.has(id);
            });
            if (ok.length > 1) {
              var sig = ok.slice().sort(function(a, b) {
                return a - b;
              }).join(",");
              if (!seen.has(sig)) {
                seen.add(sig);
                groups.push({ ids: ok, why: key[1], val: cur });
              }
            }
          }
        };
        var req = db.transaction("companies").objectStore("companies").index(key[0]).openKeyCursor();
        req.onsuccess = function() {
          var c = req.result;
          if (!c) {
            flush();
            return res();
          }
          if (c.key !== cur) {
            flush();
            cur = c.key;
            ids = [];
          }
          if (ids.indexOf(c.primaryKey) < 0) ids.push(c.primaryKey);
          if (groups.length >= 400) {
            return res();
          }
          c.continue();
        };
        req.onerror = function() {
          res();
        };
      });
      await sleep0();
    }
    busy(null);
    return groups;
  }
  async function openDupes() {
    if (!isAdmin() && ROLE()) {
      toast(t("ro_card"));
      return;
    }
    var groups = await findDupes();
    window.__dupes = groups.length;
    var sh = openSheet(sheetHead(t("dup_title")) + '<div class="cbody"><p class="muted small">' + esc(t("dup_help")) + "</p>" + (groups.length ? groups.slice(0, 200).map(function(g, i) {
      return '<div class="dupg"><div class="small muted">' + esc(t(g.why)) + ": " + esc(String(g.val).slice(0, 60)) + "</div>" + g.ids.map(function(id) {
        var e = BYID.get(id);
        return '<div class="kv link" data-act="open" data-id="' + id + '"><span>' + esc(stName(e.st)) + "</span>" + esc(e.n) + "</div>";
      }).join("") + '<button class="btn small primary" data-dup="' + i + '">' + esc(t("dup_merge")) + "</button></div>";
    }).join("") : '<p class="muted">' + esc(t("dup_none")) + "</p>") + "</div>", { full: true });
    $$("[data-dup]", sh).forEach(function(b) {
      b.onclick = function() {
        mergeDialog(groups[+b.dataset.dup].ids, function() {
          b.closest(".dupg").remove();
        });
      };
    });
  }
  async function mergeDialog(ids, after) {
    var recs = (await Promise.all(ids.map(getCompany))).filter(Boolean);
    if (recs.length < 2) return;
    if (ROLE() && (!syncOn() || navigator.onLine === false)) {
      toast(t("dup_need_net"));
      return;
    }
    recs.sort(function(a, b) {
      return (b.lastTouch || 0) - (a.lastTouch || 0) || (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    var sh = openSheet(sheetHead(t("dup_merge")) + '<div class="form"><p class="muted small">' + esc(t("dup_pick")) + "</p>" + recs.map(function(r, i) {
      return '<label class="chk big"><input type="radio" name="dupKeep" value="' + r.id + '"' + (i === 0 ? " checked" : "") + "><span><b>" + esc(r.name) + '</b><br><span class="small muted">' + esc([r.phone, r.email, r.city, r.ownerId ? memberName(r.ownerId) : t("owner_shared")].filter(Boolean).join(" \xB7 ")) + "</span></span></label>";
    }).join("") + '<p class="note small">' + esc(t("dup_what")) + '</p><div class="row2"><button class="btn ghost" data-act="close">' + esc(t("cancel")) + '</button><button class="btn primary" id="dupGo">' + esc(t("dup_merge")) + "</button></div></div>", { full: true });
    sh.querySelector("#dupGo").onclick = async function() {
      var keepId = +sh.querySelector("input[name=dupKeep]:checked").value, keep = recs.filter(function(r) {
        return r.id === keepId;
      })[0], drops = recs.filter(function(r) {
        return r.id !== keepId;
      });
      var ownersDiffer = drops.some(function(r) {
        return (r.ownerId || null) !== (keep.ownerId || null);
      });
      if (ownersDiffer && !await ask(t("dup_owner_q"), { danger: true, ok: t("dup_merge") })) return;
      try {
        await mergeCompanies(keep, drops, ownersDiffer);
        await closeTop();
        toast(t("dup_done", { n: drops.length }));
        if (after) after();
      } catch (e) {
        busy(null);
        toast(t("err", { e: e.message || e }));
      }
    };
  }
  async function mergeCompanies(keep, drops, ownerOk) {
    busy(t("dup_merging"), 0.2);
    var fill = ["country", "city", "address", "website", "email", "phone", "inn", "industry", "lei", "extId", "person"];
    drops.forEach(function(d) {
      fill.forEach(function(f) {
        if (!keep[f] && d[f]) keep[f] = d[f];
        else if (d[f] && keep[f] !== d[f] && (f === "phone" || f === "email" || f === "website")) {
          keep.alt = keep.alt || [];
          if (!keep.alt.some(function(a) {
            return a.f === f && a.v === d[f];
          })) keep.alt.push({ f, v: d[f] });
        }
      });
      (d.tags || []).forEach(function(g) {
        if ((keep.tags || []).indexOf(g) < 0) keep.tags = (keep.tags || []).concat([g]);
      });
      (d.ch || []).forEach(function(c) {
        keep.ch = keep.ch || [];
        chAdd(keep.ch, c);
      });
      if (d.comment && (keep.comment || "").indexOf(d.comment) < 0) keep.comment = (keep.comment ? keep.comment + "\n" : "") + d.comment;
      if ((d.lastTouch || 0) > (keep.lastTouch || 0)) keep.lastTouch = d.lastTouch;
      if (d.status > keep.status && d.status < 5) keep.status = d.status;
    });
    await putCompanies([keep]);
    if (!ROLE()) {
      var tx0 = db.transaction(["touches", "tasks", "companies", "idx", "meta"], "readwrite");
      for (var i = 0; i < drops.length; i++) {
        var d0 = drops[i];
        (await reqP(tx0.objectStore("touches").index("cid").getAll(d0.id))).forEach(function(x) {
          x.cid = keep.id;
          tx0.objectStore("touches").put(x);
        });
        (await reqP(tx0.objectStore("tasks").index("cid").getAll(d0.id))).forEach(function(x) {
          x.cid = keep.id;
          tx0.objectStore("tasks").put(x);
        });
        tx0.objectStore("companies").delete(d0.id);
        removeEntry(d0.id);
      }
      flushIdx(tx0);
      await txDone(tx0);
      busy(null);
      await recomputeDue(keep.id);
      refreshList(true);
      return;
    }
    await syncNow();
    for (var j = 0; j < drops.length; j++) {
      busy(t("dup_merging"), 0.4 + 0.5 * j / drops.length);
      var dr = drops[j];
      if (!dr.rts || !keep.uid) throw new Error(t("fi_wait"));
      await rpc("crm_merge_companies", { p_keep: keep.uid, p_drop: dr.uid, p_owner_ok: !!ownerOk });
    }
    await syncNow();
    await loadDealsCache();
    busy(null);
    refreshList(true);
  }
  async function morningHtml() {
    if (!isAdmin()) return "";
    var td = today(), since = Date.now() - 864e5;
    var tasks = await openTasksAll(), overdue = tasks.filter(function(x) {
      return x.due < td;
    }), todayT = tasks.filter(function(x) {
      return x.due === td;
    });
    var leads = IDX.filter(function(e) {
      return ("," + e.tg + ",").indexOf(",\u0437\u0430\u044F\u0432\u043A\u0430,") >= 0 && e.u >= since;
    }).length;
    var touches = (await reqP(db.transaction("touches").objectStore("touches").getAll())).filter(function(x) {
      return x.ts >= (/* @__PURE__ */ new Date(td + "T00:00:00")).getTime() && x.kind !== "status";
    });
    var rows = activeMembers().filter(function(m) {
      return m.role === "manager" || m.role === "admin";
    }).map(function(m) {
      var od = overdue.filter(function(x) {
        return x.assigneeId === m.user_id;
      }).length, tt = touches.filter(function(x) {
        return x.authorId === m.user_id;
      }).length;
      return { name: m.display_name || m.email, od, tt, lag: od >= 3 || tt === 0 && (/* @__PURE__ */ new Date()).getHours() >= 12 };
    }).sort(function(a, b) {
      return b.lag - a.lag || b.od - a.od;
    });
    window.__morning = { leads, today: todayT.length, overdue: overdue.length, lag: rows.filter(function(r) {
      return r.lag;
    }).length };
    return '<div class="morning"><h3>\u2600 ' + esc(t("mo_title")) + '</h3><div class="kpis"><div><b>' + leads + "</b><span>" + esc(t("mo_leads")) + "</span></div><div><b>" + todayT.length + "</b><span>" + esc(t("mo_today")) + '</span></div><div class="' + (overdue.length ? "red" : "") + '"><b>' + overdue.length + "</b><span>" + esc(t("mo_overdue")) + "</span></div></div>" + (rows.length ? '<table class="tbl small"><tr><th>' + esc(t("mo_who")) + "</th><th>" + esc(t("mo_touch")) + "</th><th>" + esc(t("mo_od")) + "</th></tr>" + rows.map(function(r) {
      return '<tr class="' + (r.lag ? "red" : "") + '"><td>' + esc(r.name) + (r.lag ? " \xB7 " + esc(t("mo_lag")) : "") + "</td><td>" + r.tt + "</td><td>" + r.od + "</td></tr>";
    }).join("") + "</table>" : "") + "</div>";
  }
  async function openActionLog() {
    var list = activeMembers().concat(MEM.members.filter(function(m) {
      return m.status !== "active";
    }));
    var sh = openSheet(sheetHead(t("log_title")) + '<div class="form"><div class="row2">' + lab(t("log_who"), '<select id="lgWho">' + list.map(function(m) {
      return '<option value="' + esc(m.user_id) + '">' + esc(m.display_name || m.email) + "</option>";
    }).join("") + "</select>") + lab(t("log_period"), '<select id="lgDays"><option value="1">' + esc(t("log_d1")) + '</option><option value="7" selected>' + esc(t("log_d7")) + '</option><option value="30">' + esc(t("log_d30")) + "</option></select>") + '</div></div><div id="lgOut" class="pad0"></div>', { full: true });
    var load = async function() {
      var uid = sh.querySelector("#lgWho").value, days = +sh.querySelector("#lgDays").value, since = Date.now() - days * 864e5, out = sh.querySelector("#lgOut");
      out.innerHTML = '<p class="muted">' + esc(t("loading")) + "</p>";
      var hist = [];
      if (syncOn() && navigator.onLine !== false) {
        try {
          hist = await api("GET", "crm_history?select=company_id,field,old_value,new_value,created_at,entity,entity_id&author_id=eq." + encodeURIComponent(uid) + "&created_at=gte." + encodeURIComponent(new Date(since).toISOString()) + "&order=created_at.desc&limit=500");
        } catch (e) {
          hist = [];
        }
      }
      var touches = (await reqP(db.transaction("touches").objectStore("touches").getAll())).filter(function(x) {
        return x.authorId === uid && x.ts >= since;
      });
      if (!UIDMAP.size) await buildUidMap();
      var items = hist.map(function(h) {
        var cid = cidOfUid(h.company_id), e = cid ? BYID.get(cid) : null;
        var fl = t("fld_" + h.field);
        if (fl === "fld_" + h.field) fl = h.field === "merged" ? t("dup_log") : h.field;
        return { ts: cxTs(h.created_at), cid, title: e ? e.n : h.entity === "deal" ? t("tab_deals") : "\u2014", text: fl + ": " + String(h.old_value == null ? "\u2014" : h.old_value).slice(0, 60) + " \u2192 " + String(h.new_value == null ? "\u2014" : h.new_value).slice(0, 80) };
      }).concat(touches.map(function(x) {
        var e = BYID.get(x.cid);
        return { ts: x.ts, cid: x.cid, title: e ? e.n : "\u2014", text: t("k_" + x.kind) + (x.text ? ": " + x.text.slice(0, 120) : "") };
      })).sort(function(a, b) {
        return b.ts - a.ts;
      });
      window.__actionLog = items.length;
      var lastDay = "";
      out.innerHTML = items.length ? items.slice(0, 600).map(function(it) {
        var d = fmtTs(it.ts).slice(0, 10), h = d !== lastDay ? "<h3>" + esc(d) + " \xB7 " + items.filter(function(x) {
          return fmtTs(x.ts).slice(0, 10) === d;
        }).length + "</h3>" : "";
        lastDay = d;
        return h + '<div class="kv' + (it.cid ? ' link" data-act="open" data-id="' + it.cid : "") + '"><span>' + esc(fmtTs(it.ts).slice(11, 16)) + "</span><b>" + esc(it.title) + "</b> \u2014 " + esc(it.text) + "</div>";
      }).join("") : '<p class="muted">' + esc(t("log_empty")) + "</p>";
    };
    sh.querySelector("#lgWho").onchange = load;
    sh.querySelector("#lgDays").onchange = load;
    load();
  }
  async function saveBinary(name, u8, mime) {
    var FS = PLUG.Filesystem, SH = PLUG.Share;
    if (NATIVE && FS && SH) {
      var bin = "";
      for (var i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      await FS.writeFile({ path: "export/" + name, data: btoa(bin), directory: "CACHE", recursive: true });
      var uri = (await FS.getUri({ path: "export/" + name, directory: "CACHE" })).uri;
      try {
        await SH.share({ title: name, files: [uri], dialogTitle: name });
      } catch (e) {
      }
    } else {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([u8], { type: mime }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 5e3);
    }
    toast(t("exported", { n: name }));
  }
  function openDealsExport() {
    var td = today(), from = td.slice(0, 8) + "01";
    var sh = openSheet(sheetHead(t("dx_title")) + '<div class="form"><p class="muted small">' + esc(t("dx_help")) + '</p><div class="row2">' + lab(t("dx_from"), '<input class="inp" type="date" id="dxFrom" value="' + from + '">') + lab(t("dx_to"), '<input class="inp" type="date" id="dxTo" value="' + td + '">') + "</div>" + lab(t("dx_which"), '<select id="dxKind"><option value="won">' + esc(t("dx_won")) + '</option><option value="all">' + esc(t("dx_all")) + '</option><option value="lost">' + esc(t("dx_lost")) + "</option></select>") + '<button class="btn primary wide" id="dxGo">' + ico("download") + esc(t("dx_go")) + "</button></div>", { full: true });
    sh.querySelector("#dxGo").onclick = async function() {
      try {
        await loadDealsCache();
        if (!UIDMAP.size) await buildUidMap();
        var a = sh.querySelector("#dxFrom").value || "2000-01-01", b = sh.querySelector("#dxTo").value || td, kind = sh.querySelector("#dxKind").value;
        var rows = [];
        for (var i = 0; i < DL.list.length; i++) {
          var d = DL.list[i], s = stageById(d.stage_id) || {}, when = (d.closed_at || "").slice(0, 10) || (s.kind !== "open" ? (d.updated_at || "").slice(0, 10) : "") || d.close_date || (d.created_at || "").slice(0, 10);
          if (kind !== "all" && s.kind !== kind) continue;
          if (!when || when < a || when > b) continue;
          var cid = cidOfUid(d.company_id), comp = cid ? await getCompany(cid) : null, ct = DL.contacts.filter(function(c) {
            return c.id === d.contact_id;
          })[0];
          var row = {};
          row[t("dx_c_date")] = fmtDate(when);
          row[t("dx_c_deal")] = d.title;
          row[t("dx_c_company")] = comp ? comp.name : "";
          row[t("dx_c_inn")] = comp ? comp.inn || "" : "";
          row[t("dx_c_amount")] = +d.amount || 0;
          row[t("dx_c_cur")] = d.currency;
          row[t("dx_c_stage")] = s.name || "";
          row[t("dx_c_owner")] = memberName(d.owner_id) || "";
          row[t("dx_c_contact")] = ct ? ct.name + (ct.phone ? " " + ct.phone : "") : "";
          row[t("dx_c_note")] = d.note || "";
          rows.push(row);
        }
        if (!rows.length) {
          toast(t("dx_none"));
          return;
        }
        var X = window.XLSX, ws = X.utils.json_to_sheet(rows), wb = X.utils.book_new();
        ws["!cols"] = [{ wch: 11 }, { wch: 32 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 6 }, { wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 30 }];
        var sums = {};
        rows.forEach(function(r) {
          sums[r[t("dx_c_cur")]] = (sums[r[t("dx_c_cur")]] || 0) + r[t("dx_c_amount")];
        });
        X.utils.book_append_sheet(wb, ws, t("dx_sheet"));
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([[t("dx_c_cur"), t("dx_total")]].concat(Object.keys(sums).map(function(k) {
          return [k, sums[k]];
        })).concat([[t("dx_period"), fmtDate(a) + " \u2014 " + fmtDate(b)], [t("dx_count"), rows.length]])), t("dx_sum_sheet"));
        var out = X.write(wb, { bookType: "xlsx", type: "array" }), name = "Sotuvdesc-sdelki-" + a + "_" + b + ".xlsx";
        window.__dealsXlsx = { rows: rows.length, sums, name };
        await saveBinary(name, new Uint8Array(out), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      } catch (e) {
        toast(t("err", { e: e.message || e }));
      }
    };
  }
  function applyTheme() {
    var th = "light", big = false;
    try {
      th = localStorage.getItem("sd-theme") || "light";
      big = localStorage.getItem("sd-big") === "1";
    } catch (e) {
    }
    var dark = th === "dark" || th === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("bigfont", big);
    var mt = document.querySelector("meta[name=theme-color]");
    if (mt) mt.setAttribute("content", dark ? "#0B1220" : "#FFFFFF");
  }
  try {
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
  } catch (e) {
  }
  applyTheme();
  function themeHtml() {
    var th = "light", big = false;
    try {
      th = localStorage.getItem("sd-theme") || "light";
      big = localStorage.getItem("sd-big") === "1";
    } catch (e) {
    }
    return "<h3>" + esc(t("th_title")) + '</h3><div class="form">' + lab(t("th_theme"), '<select id="thSel"><option value="light"' + (th === "light" ? " selected" : "") + ">" + esc(t("th_light")) + '</option><option value="dark"' + (th === "dark" ? " selected" : "") + ">" + esc(t("th_dark")) + '</option><option value="auto"' + (th === "auto" ? " selected" : "") + ">" + esc(t("th_auto")) + "</option></select>") + '<label class="chk big"><input type="checkbox" id="thBig"' + (big ? " checked" : "") + "><span>" + esc(t("th_big")) + "</span></label></div>";
  }
  function bindTheme() {
    var s = $("#thSel"), b = $("#thBig");
    if (s) s.onchange = function() {
      try {
        localStorage.setItem("sd-theme", s.value);
      } catch (e) {
      }
      applyTheme();
    };
    if (b) b.onchange = function() {
      try {
        localStorage.setItem("sd-big", b.checked ? "1" : "0");
      } catch (e) {
      }
      applyTheme();
    };
  }
  document.addEventListener("click", async function(ev) {
    var ca = ev.target.closest("a[data-ccall],a[data-cmsg]");
    if (ca) {
      ev.preventDefault();
      var sh1 = ca.closest(".sheet"), r1 = sh1 && sh1._rec, ct1 = DL.contacts.filter(function(c) {
        return c.id === (ca.dataset.ccall || ca.dataset.cid2);
      })[0];
      if (r1) {
        var nm1 = (ct1 ? ct1.name + " \u2014 " : "") + r1.name, h1 = ca.getAttribute("href"), mk1 = ca.dataset.cmsg;
        if (ca.dataset.ccall) return startCall({ cid: r1.id, name: nm1, contactId: ct1 ? ct1.id : "" }, h1);
        if (mk1 === "whatsapp" || mk1 === "telegram") return startMsg({ cid: r1.id, kind: mk1, label: t("ch_" + mk1) + (ct1 ? " \xB7 " + ct1.name : ""), name: r1.name, contactId: ct1 ? ct1.id : "" }, h1);
        await addTouch({ cid: r1.id, kind: mk1, contactId: ct1 ? ct1.id : "", text: (ct1 ? ct1.name + ": " : "") + h1.replace(/^(tel:|mailto:)/, "") });
        if (r1.status === 0) await setStatus(r1, 1);
      }
      openExt(ca.getAttribute("href"));
      if (r1) renderCard(sh1, r1.id);
      return;
    }
    var a = ev.target.closest("a[data-ext]");
    if (a) {
      ev.preventDefault();
      var sh0 = a.closest(".sheet");
      if (sh0 && sh0._rec && a.dataset.kind) {
        var r0 = sh0._rec, k0 = a.dataset.kind, h0 = a.getAttribute("href");
        if (k0 === "call") return startCall({ cid: r0.id, name: r0.name }, h0);
        if (k0 === "whatsapp" || k0 === "telegram") return startMsg({ cid: r0.id, kind: k0, label: t("ch_" + k0) + " " + (r0.phone || ""), name: r0.name }, h0);
        r0.lastTouch = Date.now();
        var tl0 = [{ cid: r0.id, ts: Date.now(), kind: a.dataset.kind, text: a.getAttribute("href").replace(/^(tel:|mailto:)/, "").slice(0, 120) }];
        if (r0.status === 0) {
          r0.status = 1;
          tl0.push({ cid: r0.id, ts: Date.now() + 1, kind: "status", text: t("status_changed", { a: stName(0), b: stName(1) }) });
        }
        putCompanies([r0], tl0).then(function() {
          renderCard(sh0, r0.id);
        });
      }
      openExt(a.getAttribute("href"));
      return;
    }
    var el = ev.target.closest("[data-act]");
    if (!el) return;
    var act = el.dataset.act, sh = el.closest(".sheet");
    try {
      if (act === "close") return guardedClose();
      if (act === "chOpen" || act === "chAdd") {
        if (sh) return chAction(sh, act, el);
        return;
      }
      if (act === "webFind") {
        if (sh && sh._rec) return openWebFind(sh._rec);
        return;
      }
      if (act === "cfEdit") {
        if (sh && sh._rec) return openCfEdit(sh);
        return;
      }
      if (act === "filePick") {
        if (sh && sh._rec) return pickFile(sh, !!el.dataset.cap);
        return;
      }
      if (act === "fileOpen") return openFile(el.dataset.fid);
      if (act === "fileDel") {
        if (sh) return deleteFile(sh, el.dataset.fid);
        return;
      }
      if (act === "tplDownload") return downloadTemplate();
      if (act === "cxSeg") {
        CX.seg = el.dataset.seg;
        CX.q = "";
        return renderChat();
      }
      if (act === "cxOpen") return openChat(el.dataset.cx, { mid: el.dataset.mid });
      if (act === "cxNewDm") return cxPickMember(t("cx_new_dm"), function(uid) {
        cxOpenDm(uid);
      });
      if (act === "cxNewGroup") return cxGroupEdit(null);
      if (act === "cxSend") return cxSend();
      if (act === "cxAttach") return cxPick();
      if (act === "cxMic") return cxStartRec();
      if (act === "cxRecCancel") return cxStopRec(true);
      if (act === "cxRecSend") return cxFinishRec(true);
      if (act === "cxUnlink") {
        CX.link = null;
        if (CX.openSh) cxRenderComposer(CX.openSh);
        return;
      }
      if (act === "cxMsg") {
        if (ev.target.closest(".mlink,.mfile,.mvoice")) return;
        return cxMsgMenu(el.dataset.mid);
      }
      if (act === "cxFile") return cxOpenFile(el.dataset.mid);
      if (act === "cxVoice") return cxPlay(el.dataset.mid);
      if (act === "cxLink") {
        if (el.dataset.co) {
          var lc = cidOfUid(el.dataset.co);
          if (!lc) {
            toast(t("cx_link_noaccess"));
            return;
          }
          return openCard(lc);
        }
        var ld = DL.list.filter(function(x2) {
          return x2.id === el.dataset.deal;
        })[0];
        if (!ld) {
          toast(t("cx_link_noaccess"));
          return;
        }
        return openDeal(ld.id);
      }
      if (act === "cxMute") {
        var mc = CX.openId;
        var on = !CX.prefs[mc];
        try {
          await rpc("crm_chat_mute", { p_chat: mc, p_on: on });
          CX.prefs[mc] = on;
          toast(t(on ? "cx_muted_done" : "cx_unmuted_done"));
          if (CX.openSh) cxRenderSheet(CX.openSh);
          cxBadge();
        } catch (e) {
          toast(NET_ERR(e) ? t("cx_need_net") : t("err", { e: e.message }));
        }
        return;
      }
      if (act === "cxMenu") return cxMenu();
      if (act === "cxDiscussCo") {
        if (sh && sh._rec) return cxDiscuss({ company_id: sh._rec.uid });
        return;
      }
      if (act === "cxDiscussDeal") return cxDiscuss({ deal_id: el.dataset.did });
      if (act === "netEdit") return netEdit();
      if (act === "netCard") return netCard(el.dataset.org);
      if (act === "filePick2") {
        var sec = el.closest(".fisec2");
        if (sh && sec) return pickFile2(sh, sec, !!el.dataset.cap);
        return;
      }
      if (act === "dupes") return openDupes();
      if (act === "actionLog") return openActionLog();
      if (act === "dealsXlsx") return openDealsExport();
      if (act === "fieldsAdmin") return openFieldsAdmin(null);
      if (sh && sh._rec && ["setStatus", "tq", "taskAdd", "taskDone", "taskDel", "tagAdd", "tagDel", "touchAdd", "touchDel", "editCard", "tplOpen", "cardDel", "nsQuick", "addPhone", "tlAll"].indexOf(act) >= 0) return cardAction(sh, act, el);
      if (act === "rowCall") return rowCall(+el.dataset.id);
      if (act === "showNew") {
        F = F0();
        F.status = 0;
        return setTab("list");
      }
      if (act === "open") {
        var id = +el.dataset.id;
        if (el.closest("#saRes")) await closeTop();
        if (S.sel && el.classList.contains("row")) {
          if (S.sel.all) {
            S.sel = { all: false, ids: new Set(RESULT.map(function(e) {
              return e.id;
            })) };
          }
          if (S.sel.ids.has(id)) S.sel.ids.delete(id);
          else S.sel.ids.add(id);
          renderSelBar();
          drawRows();
          return;
        }
        return openCard(id);
      }
      if (act === "tDone") {
        var tx = db.transaction("tasks", "readwrite"), s = tx.objectStore("tasks");
        var x = await reqP(s.get(+el.dataset.tid));
        x.done = true;
        x.doneAt = Date.now();
        x.pend = 1;
        s.put(x);
        await txDone(tx);
        scheduleSync();
        await recomputeDue(x.cid);
        toast(t("today_done"), t("undo"), async function() {
          var tu = db.transaction("tasks", "readwrite"), su = tu.objectStore("tasks");
          var xu = await reqP(su.get(x.id));
          if (xu) {
            xu.done = false;
            xu.doneAt = 0;
            xu.pend = 1;
            su.put(xu);
          }
          await txDone(tu);
          scheduleSync();
          await recomputeDue(x.cid);
          if (S.tab === "today") renderToday();
        });
        return renderToday();
      }
      if (act === "showNoStep") {
        F = F0();
        F.status = -2;
        F.task = "none";
        return setTab("list");
      }
      if (act === "seg") {
        var sg = viewObj(el.dataset.id);
        if (sg) {
          if (viewActive(sg)) {
            F = F0();
            S.q = "";
          } else {
            F = viewFull(sg);
            S.q = sg.q || "";
            S.sort = sg.sort || "upd";
            $("#sort").value = S.sort;
          }
          $("#q").value = S.q;
          refreshList();
        }
        return;
      }
      if (act === "segSave") return viewSave();
      if (act === "selAll") {
        S.sel = { all: true, ids: /* @__PURE__ */ new Set() };
        renderSelBar();
        drawRows();
        return;
      }
      if (act === "mass") return openMass();
      if (act === "kmove") {
        var kid = +el.dataset.id, ke = BYID.get(kid);
        var ms = openSheet(sheetHead(ke ? ke.n : "") + '<div class="col">' + STATUSES.map(function(z, i) {
          return '<button class="btn ' + (ke && ke.st === i ? "primary" : "ghost") + '" data-kst="' + i + '">' + esc(stName(i)) + "</button>";
        }).join("") + "</div>");
        $$("[data-kst]", ms).forEach(function(bb) {
          bb.onclick = async function() {
            var rr2 = await getCompany(kid);
            await setStatus(rr2, +bb.dataset.kst);
            await closeTop();
            refreshList(true);
          };
        });
        return;
      }
      if (act === "profile") return openProfile();
      if (act === "staff") return openStaff();
      if (act === "syncNow") return syncNow();
      if (act === "import") return $("#fileIn").click();
      if (act === "demo") return loadDemo();
      if (act === "expAll") return exportCsv(false);
      if (act === "expFilter") return exportCsv(true);
      if (act === "backup") return backupJson();
      if (act === "restore") return $("#restoreIn").click();
      if (act === "wipe") return wipeAll();
      if (act === "tplEdit") return openTplEdit(el.dataset.tpl);
      if (act === "tplNew") return openTplEdit(null);
      if (act === "undoImport") return undoImport();
      if (act === "presetEdu") return loadPreset("presets/sotuvdesc-import-edu-centers-2026-10-26.csv", { source: "research/sotuvdesc-import-edu-centers-2026-10-26 (Goldenpages, 2GIS, top.uz, \u0441\u0430\u0439\u0442\u044B \u0446\u0435\u043D\u0442\u0440\u043E\u0432)", tag: t("seg_edu"), segment: t("seg_edu") });
      if (act === "dealOpen") {
        if (el.closest("#saRes")) await closeTop();
        return openDeal(el.dataset.did);
      }
      if (act === "dealNew") return openDeal(null);
      if (act === "dealFromCompany") {
        var rc = sh && sh._rec;
        return openDeal(null, rc ? { company_id: rc.uid, title: rc.name, owner_id: ROLE() === "manager" ? AU.uid : rc.ownerId || AU.uid } : null);
      }
      if (act === "ctEdit") {
        var rr = sh && sh._rec;
        if (rr) openContact(rr, el.dataset.ctid, function() {
          renderCard(sh, rr.id);
        });
        return;
      }
      if (act === "dealMove") {
        var dm = DL.list.filter(function(x2) {
          return x2.id === el.dataset.did;
        })[0];
        if (!dm) return;
        var ms2 = openSheet(sheetHead(dm.title) + '<div class="col">' + stagesOf(dm.pipeline_id).map(function(z) {
          return '<button class="btn ' + (dm.stage_id === z.id ? "primary" : "ghost") + '" data-mst="' + z.id + '">' + esc(z.name) + "</button>";
        }).join("") + "</div>");
        $$("[data-mst]", ms2).forEach(function(bb) {
          bb.onclick = async function() {
            await closeTop();
            await moveDeal(dm.id, bb.dataset.mst);
          };
        });
        return;
      }
      if (act === "pipeEdit") return openPipeEdit();
      if (act === "quickTask") return quickTask();
      if (act === "quickAdd") return fabAction();
      if (act === "goalEdit") return editGoal();
      if (act === "scriptsEdit") {
        if (sh) await closeTop();
        return openScriptsEdit();
      }
      if (act === "publish") return openPublish();
      if (act === "telegram") return openTelegram();
      if (act === "checkUpd") {
        var j = await checkUpdate(true);
        if (!j || !verGt(j.version, VERSION)) toast(t("upd_none", { v: VERSION }));
        return;
      }
      if (act === "products") return openProducts();
      if (act === "seller") return openSeller();
      if (act === "leads") return openLeads();
      if (act === "searchAll") return openSearchAll();
      if (act === "showStale") {
        F = F0();
        F.task = "stale";
        return setTab("list");
      }
    } catch (e) {
      busy(null);
      toast(t("err", { e: e.message || e }));
      console.error(e);
    }
  });
  var lpT;
  document.addEventListener("pointerdown", function(ev) {
    var el = ev.target.closest("[data-act=seg]");
    if (!el) return;
    lpT = setTimeout(async function() {
      viewMenu(el.dataset.id);
    }, 700);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function(n) {
    document.addEventListener(n, function() {
      clearTimeout(lpT);
    });
  });
  function bind() {
    $$(".tabs button").forEach(function(b) {
      b.onclick = function() {
        setTab(b.dataset.tab);
      };
    });
    $$("#langSw button").forEach(function(b) {
      b.onclick = function() {
        setLang(b.dataset.lang);
      };
    });
    var qt;
    $("#q").addEventListener("input", function() {
      clearTimeout(qt);
      var v = this.value;
      qt = setTimeout(function() {
        S.q = v.trim();
        refreshList();
      }, IDX.length > 5e4 ? 300 : 150);
    });
    $("#sort").onchange = function() {
      S.sort = this.value;
      refreshList();
    };
    $("#btnFilter").onclick = openFilter;
    $("#btnAdd").onclick = function() {
      quickAdd(true);
    };
    $("#btnView").onclick = function() {
      setView(S.view === "board" ? "list" : "board");
    };
    $("#syncBtn").onclick = function() {
      if (syncOn()) syncNow();
      else if (!AU.s && baseUrl()) showGate("login");
    };
    $("#userBtn").onclick = function() {
      openProfile();
    };
    var board = $("#board"), dragId = null;
    board.addEventListener("dragstart", function(e) {
      var c = e.target.closest(".kcard");
      if (c) {
        dragId = +c.dataset.id;
        e.dataTransfer.setData("text/plain", String(dragId));
        c.classList.add("drag");
      }
    });
    board.addEventListener("dragover", function(e) {
      var col = e.target.closest(".kcol");
      if (col) {
        e.preventDefault();
        $$(".kcol.over").forEach(function(x) {
          x.classList.remove("over");
        });
        col.classList.add("over");
      }
    });
    board.addEventListener("dragend", function() {
      $$(".kcol.over,.kcard.drag").forEach(function(x) {
        x.classList.remove("over");
        x.classList.remove("drag");
      });
    });
    board.addEventListener("drop", async function(e) {
      var col = e.target.closest(".kcol");
      if (!col || dragId == null) return;
      e.preventDefault();
      var r = await getCompany(dragId);
      dragId = null;
      if (r) {
        await setStatus(r, +col.dataset.st);
        refreshList(true);
      }
    });
    $("#btnSelect").onclick = function() {
      S.sel = S.sel ? null : { all: false, ids: /* @__PURE__ */ new Set() };
      renderSelBar();
      drawRows();
    };
    $("#scroller").addEventListener("scroll", function() {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(drawRows);
      }
    }, { passive: true });
    window.addEventListener("resize", function() {
      if (S.tab === "list") drawRows();
    });
    $("#fileIn").onchange = function() {
      var f = this.files[0];
      this.value = "";
      if (f) startImport(f);
    };
    $("#restoreIn").onchange = async function() {
      var f = this.files[0];
      this.value = "";
      if (!f) return;
      try {
        busy(t("loading"), 0);
        var o = JSON.parse(await readText(f));
        await restoreFromObj(o);
      } catch (e) {
        busy(null);
        toast(t("restore_bad"));
      }
    };
  }
  async function init() {
    renderStatic();
    bind();
    bindBack();
    catInit();
    callInit();
    try {
      db = await openDB();
      try {
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
      } catch (e) {
      }
      var m = await Promise.all([metaGet("settings"), metaGet("segments"), metaGet("templates"), metaGet("daily"), metaGet("dels"), metaGet("dirtyC")]);
      if (m[0]) S.settings = m[0];
      if (Array.isArray(m[1]) && m[1].length) {
        var hv = new Set(S.segments.map(function(v) {
          return v.id;
        }));
        m[1].forEach(function(v) {
          if (!hv.has(v.id)) S.segments.push(v);
        });
        await metaSet("segments", []);
        await metaSet("settings", S.settings);
      }
      S.templates = m[2] || DEFAULT_TPLS.slice();
      if (m[3]) S.daily = m[3];
      SY.dels = m[4] || [];
      DIRTYC = new Set(m[5] || []);
      $("#boot").hidden = true;
      await loadIndex();
      await loadMemCache();
      try {
        await idxFixups();
      } catch (e) {
        console.warn("fix160", e);
      }
      await cxLoad();
      cxBadge();
      if (window.SDTeam) SDTeam.boot();
    } catch (e) {
      toast(t("err", { e: e.message || e }));
      console.error(e);
    }
    $("#boot").hidden = true;
    window.__sdBooted = true;
    alive("ui");
    try {
      S.view = localStorage.getItem("sd-view") || "list";
    } catch (e) {
      S.view = "list";
    }
    setTab("list");
    setView(S.view);
    window.addEventListener("hashchange", function() {
      onInviteUrl(location.href);
    });
    window.addEventListener("online", function() {
      scheduleSync(200);
      rtConnect();
      cxSchedule(400);
      if (window.SDTeam) SDTeam.online();
    });
    window.addEventListener("pageshow", function() {
      if (window.SDTeam) SDTeam.online();
    });
    window.addEventListener("offline", function() {
      SY.state = "offline";
      syncBadge();
    });
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) {
        scheduleSync(500);
        rtConnect();
        if (CX.openId) cxMarkRead(CX.openId);
        if (window.SDTeam) SDTeam.online();
      }
    });
    await startAuth();
    if (!syncOn()) setTimeout(migrateChannels, 1500);
    window.__sdBooted = true;
    var be = document.getElementById("bootErr");
    if (be) be.remove();
    scheduleReminders();
  }
  if (window.SDOnb) SDOnb.init({
    S,
    AU,
    t,
    esc,
    num,
    metaSet,
    ROLE,
    isAdmin,
    canWriteAny,
    myName,
    syncOn,
    db: function() {
      return db;
    },
    idx: function() {
      return IDX;
    },
    members: function() {
      return MEM.members;
    },
    activeMembers,
    dealsCount: function() {
      return DL.list.length;
    },
    dealsReady: loadDealsCache,
    CX: function() {
      return CX;
    },
    sy: function() {
      return SY;
    },
    hasServer: function() {
      return !!(baseUrl() && anonKey());
    },
    setTab,
    refresh: function() {
      if (S.tab === "today") renderToday();
    },
    toast,
    importClick: function() {
      $("#fileIn").click();
    },
    quickAdd,
    openDeal,
    openStaff,
    showGate
  });
  if (window.SDTeam) SDTeam.init({
    S,
    AU,
    t,
    esc,
    uuid,
    ROLE,
    myName,
    syncOn,
    db: function() {
      return db;
    },
    members: function() {
      return MEM.members;
    },
    api,
    rpc,
    NET_ERR,
    ensureFresh,
    baseUrl,
    anonKey,
    fileSignedUrl,
    openSheet,
    sheetHead,
    closeTop,
    ask,
    toast,
    fieldErr,
    openExt,
    copyText,
    setTab,
    syncBadge,
    syncMembers: function() {
      scheduleSync(100, "crm_members");
    },
    rtRestart: function() {
      rtClose();
      rtConnect();
    }
  });
  init();
})();
