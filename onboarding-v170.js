(function() {
  "use strict";
  var C = null;
  var DAY = 864e5, LIFE_DAYS = 14;
  var OB = { layer: null, step: 1, who: "owner", prevFocus: null, visit: 0, greenVisit: null, checking: false };
  var P = {
    list: "M4 6h2v2H4zm4 0h12v2H8zM4 11h2v2H4zm4 0h12v2H8zm-4 5h2v2H4zm4 0h12v2H8z",
    deals: "M3 4h5v16H3zm6.5 0h5v10h-5zM16 4h5v13h-5z",
    today: "M7 2h2v2h6V2h2v2h3c.6 0 1 .4 1 1v15c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1h3zM5 9v10h14V9zm2 2h4v4H7z",
    chat: "M4 4h16c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1H8l-4 4V5c0-.6.4-1 1-1zm1 2v10.2L7.2 15H19V6zm2 2h10v2H7zm0 3h7v2H7z",
    people: "M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z",
    check: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
    phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
    chev: "M9 6l6 6-6 6-1.4-1.4L12.2 12 7.6 7.4z",
    upload: "M11 16V7.8L8.4 10.4 7 9l5-5 5 5-1.4 1.4L13 7.8V16zM5 18h14v2H5z",
    bolt: "M13 2 4 14h6l-1 8 9-12h-6z",
    eye: "M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
  };
  function svg(n, cls) {
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + P[n] + '"/></svg>';
  }
  function T(k, v) {
    return C.t(k, v);
  }
  function E(s) {
    return C.esc(s);
  }
  function $q(s, r) {
    return (r || document).querySelector(s);
  }
  function cfg() {
    return C.S.settings;
  }
  function save() {
    try {
      return C.metaSet("settings", C.S.settings);
    } catch (e) {
      return Promise.resolve();
    }
  }
  function uid() {
    return C.AU && C.AU.uid || "local";
  }
  function clState() {
    var s = cfg();
    if (!s.cl) s.cl = {};
    return s.cl;
  }
  function defaultWho() {
    var r = C.ROLE();
    return r === "manager" || r === "viewer" ? "staff" : "owner";
  }
  function flagOff() {
    try {
      return localStorage.getItem("sd-noonb") === "1";
    } catch (e) {
      return false;
    }
  }
  function loading() {
    return C.syncOn() && !C.sy().last && C.sy().state !== "err" && C.sy().state !== "offline";
  }
  function scan(store, pred) {
    return new Promise(function(res) {
      try {
        var rq = C.db().transaction(store).objectStore(store).openCursor(null, "prev");
        rq.onsuccess = function() {
          var cur = rq.result;
          if (!cur) return res(false);
          if (pred(cur.value)) return res(true);
          cur["continue"]();
        };
        rq.onerror = function() {
          res(false);
        };
      } catch (e) {
        res(false);
      }
    });
  }
  function ownCall() {
    var me = C.AU.uid, nm = C.myName();
    return scan("touches", function(x) {
      return x.kind === "call" && (!me || x.authorId === me || !x.authorId && x.author === nm);
    });
  }
  function ownTask() {
    var me = C.AU.uid;
    return scan("tasks", function(x) {
      return !me || x.createdUid === me;
    });
  }
  function doneToday() {
    var d = /* @__PURE__ */ new Date();
    d.setHours(0, 0, 0, 0);
    var t0 = d.getTime();
    return scan("tasks", function(x) {
      return x.done && x.doneAt >= t0;
    });
  }
  function myMessage() {
    var me = C.AU.uid, hit = false;
    C.CX().msgs.forEach(function(arr) {
      if (!hit && arr) arr.forEach(function(m) {
        if (m.author_id === me && !m.deleted) hit = true;
      });
    });
    return hit;
  }
  function maybeShow() {
    if (!C || OB.layer || OB.checking || flagOff()) return;
    var key = uid(), o = cfg().onb || {};
    if (o[key]) return;
    OB.checking = true;
    ownCall().then(function(had) {
      OB.checking = false;
      if (OB.layer || (cfg().onb || {})[key]) return;
      if (had) return finish("auto");
      OB.who = defaultWho();
      OB.step = 1;
      open();
    });
  }
  function open() {
    OB.prevFocus = document.activeElement;
    var el = document.createElement("div");
    el.className = "ob";
    el.id = "obLayer";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "obH");
    document.body.appendChild(el);
    OB.layer = el;
    el.addEventListener("keydown", trapTab);
    paint(true);
  }
  function whoNow() {
    return OB.who === "owner" && C.ROLE() !== "viewer" ? "owner" : "staff";
  }
  function paint(focus) {
    var n = OB.step, o = whoNow() === "owner", body = "", foot = "";
    var top = '<div class="ob-top"><span class="ob-st">' + E(T("ob_step", { n })) + '</span><button type="button" class="ob-btn link" data-ob="skip">' + E(T("ob_skip")) + '</button></div><div class="ob-dots" aria-hidden="true"><i class="on"></i><i class="' + (n > 1 ? "on" : "") + '"></i><i class="' + (n > 2 ? "on" : "") + '"></i></div>';
    if (n === 1) {
      var card = function(v, icn) {
        var on = OB.who === v;
        return '<label class="ob-rc' + (on ? " on" : "") + '"><input type="radio" name="obwho" value="' + v + '"' + (on ? " checked" : "") + '><span class="ob-rcbody">' + svg(icn) + '<span class="t"><b>' + E(T("ob1_" + v)) + "</b><small>" + E(T("ob1_" + v + "_d")) + '</small></span><span class="ob-tick">' + (on ? svg("check") : "") + "</span></span></label>";
      };
      body = '<h1 tabindex="-1" id="obH">' + E(T("ob1_title")) + '</h1><p class="ob-sub">' + E(T("ob1_sub")) + '</p><fieldset class="ob-fs"><legend class="ob-sr">' + E(T("ob1_title")) + "</legend>" + card("owner", "bolt") + card("staff", "people") + "</fieldset>";
    } else if (n === 2) {
      var p = o ? "o" : "s", icons = o ? ["upload", "check", "eye"] : ["today", "phone", "deals"];
      body = '<h1 tabindex="-1" id="obH">' + E(T("ob2_title")) + "</h1>" + [1, 2, 3].map(function(i) {
        return '<div class="ob-ben"><div class="es-ic">' + svg(icons[i - 1]) + "</div><div><b>" + E(T("ob2_" + p + i + "_t")) + "</b><p>" + E(T("ob2_" + p + i + "_d")) + "</p></div></div>";
      }).join("");
    } else {
      var q = o ? "o" : "s";
      body = '<div class="ob-hero"><div class="es-ic">' + svg(o ? "upload" : "list") + '</div><h1 tabindex="-1" id="obH">' + E(T("ob3_" + q + "_t")) + "</h1><p>" + E(T("ob3_" + q + "_d")) + "</p></div>";
    }
    if (n < 3) foot = '<div class="ob-row">' + (n > 1 ? '<button type="button" class="ob-btn ghost" data-ob="back">' + E(T("ob_back")) + "</button>" : "") + '<button type="button" class="ob-btn primary" data-ob="next">' + E(T("ob_next")) + "</button></div>";
    else foot = '<button type="button" class="ob-btn primary wide" data-ob="go">' + E(T(o ? "ob3_o_btn" : "ob3_s_btn")) + '</button><div class="ob-row2"><button type="button" class="ob-btn link" data-ob="back">' + E(T("ob_back")) + '</button><button type="button" class="ob-btn link" data-ob="look">' + E(T("ob3_look")) + "</button></div>";
    OB.layer.innerHTML = '<div class="ob-in">' + top + '<div class="ob-b">' + body + '</div><div class="ob-f">' + foot + "</div></div>";
    if (focus) {
      var h = $q("#obH", OB.layer);
      if (h) h.focus();
    }
  }
  function go(step) {
    OB.step = Math.max(1, Math.min(3, step));
    paint(true);
  }
  function back() {
    if (!OB.layer) return false;
    if (OB.step > 1) go(OB.step - 1);
    else finish("skip");
    return true;
  }
  function finish(kind) {
    var s = cfg();
    if (!s.onb) s.onb = {};
    var who = OB.who || defaultWho();
    s.onb[uid()] = { done: 1, who: who === "owner" ? "owner" : "staff" };
    save();
    var el = OB.layer;
    OB.layer = null;
    if (el) {
      el.removeEventListener("keydown", trapTab);
      el.remove();
    }
    var pf = OB.prevFocus;
    OB.prevFocus = null;
    if (kind === "auto") return;
    if (kind === "go") {
      var imp = whoNow() === "owner";
      nav("list");
      if (imp) C.importClick();
    } else nav("today");
    if (pf && pf.focus && pf.id && document.contains(pf)) {
      try {
        pf.focus();
      } catch (e) {
      }
    }
  }
  function trapTab(e) {
    if (e.key !== "Tab" || !OB.layer) return;
    var f = Array.prototype.slice.call(OB.layer.querySelectorAll("button, input[type=radio]")).filter(function(x) {
      return !x.disabled && x.offsetParent !== null;
    });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || a.id === "obH" || !OB.layer.contains(a))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (a === last || !OB.layer.contains(a))) {
      e.preventDefault();
      first.focus();
    }
  }
  function es(o) {
    var id = "es-" + o.id;
    return '<section class="es-box' + (o.tight ? " tight" : "") + '" aria-labelledby="' + id + '"><div class="es-ic" aria-hidden="true">' + svg(o.icon) + '</div><h2 id="' + id + '">' + E(o.title) + "</h2>" + (o.text ? "<p>" + E(o.text) + "</p>" : "") + (o.btn ? '<button type="button" class="ob-btn primary" ' + (o.attr || "") + ">" + E(o.btn) + "</button>" : "") + "</section>";
  }
  var loadingHtml = function() {
    return '<p class="es-load" role="status">' + E(T("loading")) + "</p>";
  };
  function noCompanyAction() {
    var r = C.ROLE();
    if (!r || C.isAdmin()) return { btn: "es_co_btn", attr: 'data-ob="import"', text: "es_co_text" };
    if (r === "manager") return { btn: "es_co_m_btn", attr: 'data-ob="addCo"', text: "es_co_m_text" };
    return { btn: "", attr: "", text: "es_co_v_text" };
  }
  function fillEmpty(el) {
    if (!el) return;
    el.classList.add("es-wrap");
    if (loading()) {
      el.innerHTML = loadingHtml();
      return;
    }
    var a = noCompanyAction();
    el.innerHTML = es({ id: "co", icon: "list", title: T("es_co_title"), text: T(a.text), btn: a.btn ? T(a.btn) : "", attr: a.attr });
  }
  async function todayEmpty(newN) {
    var done = await doneToday();
    return es({
      id: "td",
      tight: true,
      icon: "today",
      title: T(done ? "es_td_done_title" : "es_td_title"),
      text: newN ? T("es_td_new_text", { n: C.num(newN) }) : T("es_td_text"),
      btn: T(newN ? "es_td_new_btn" : "es_td_btn"),
      attr: newN ? 'data-act="showNew"' : 'data-ob="openList"'
    });
  }
  function dealsEmpty() {
    var noco = C.idx().length === 0, r = C.ROLE();
    var btn = "", attr = "";
    if (r && !C.canWriteAny()) {
      btn = "";
    } else if (noco) {
      var a = noCompanyAction();
      btn = T("es_dl_noco_btn");
      attr = a.attr;
    } else {
      btn = T("es_dl_btn");
      attr = 'data-ob="newDeal"';
    }
    return '<div class="pad">' + es({ id: "dl", icon: "deals", title: T("es_dl_title"), text: T("es_dl_text"), btn, attr }) + "</div>";
  }
  function staffEmpty(body, members) {
    if (!body || !C.isAdmin()) return;
    var active = (members || []).filter(function(m) {
      return m.status !== "blocked";
    });
    var others = active.filter(function(m) {
      return m.user_id !== C.AU.uid;
    });
    if (others.length) return;
    var add = $q("#stAdd", body);
    if (!add) return;
    var wrap = document.createElement("div");
    wrap.innerHTML = es({ id: "st", tight: true, icon: "people", title: T("es_st_title"), text: T("es_st_text"), btn: "", attr: "" });
    var sec = wrap.firstChild;
    add.className = "ob-btn primary";
    add.style.marginTop = "8px";
    add.style.minWidth = "220px";
    sec.appendChild(add);
    var rows = body.querySelectorAll(".mrow.mbtn"), last = rows.length ? rows[rows.length - 1] : null;
    if (last && last.parentNode) last.parentNode.insertBefore(sec, last.nextSibling);
    else body.appendChild(sec);
  }
  function teamAlone(c) {
    return c && c.kind === "team" && C.isAdmin() && C.activeMembers().length <= 1;
  }
  function chatEmpty(c) {
    if (!c || c.kind !== "team") return "";
    if (teamAlone(c)) return es({ id: "ch", icon: "chat", title: T("es_ch_solo_title"), text: T("es_ch_solo_text"), btn: T("st_add"), attr: 'data-ob="addStaff"' });
    return es({ id: "ch", icon: "chat", title: T("es_ch_title"), text: T("es_ch_text"), btn: T("es_ch_btn"), attr: 'data-ob="hello"' });
  }
  function chatAfter(sh, c) {
    if (!sh) return;
    var empty = !(C.CX().msgs.get(c.id) || []).length;
    sh.classList.toggle("ob-solo", !!(empty && teamAlone(c)));
  }
  var ITEMS = { owner: ["co", "staff", "call", "step", "deal"], staff: ["open", "call", "step", "deal", "chat"], local: ["co", "open", "call", "step", "team"] };
  function kindOf() {
    var r = C.ROLE();
    if (!r) return "local";
    if (r === "viewer") return "";
    var o = (cfg().onb || {})[uid()], who = o && o.who ? o.who : defaultWho();
    return who === "owner" && C.isAdmin() ? "owner" : "staff";
  }
  async function doneMap(items) {
    var m = {}, c = clState();
    var work = items.map(function(k) {
      if (k === "co") m.co = C.idx().length >= 1;
      else if (k === "staff") m.staff = C.members().filter(function(x) {
        return x.status === "active";
      }).length >= 2;
      else if (k === "open") m.open = !!c.opened;
      else if (k === "deal") m.deal = C.dealsCount() >= 1;
      else if (k === "chat") m.chat = myMessage();
      else if (k === "team") m.team = false;
      else if (k === "call") return ownCall().then(function(v) {
        m.call = v;
      });
      else if (k === "step") return ownTask().then(function(v) {
        m.step = v;
      });
      return null;
    });
    await Promise.all(work);
    return m;
  }
  async function checklist(overdue) {
    var kind = kindOf();
    if (!kind || !C.hasServer() || flagOff()) return "";
    var c = clState(), now = Date.now();
    if (c.hidden) return "";
    if (!c.shown) {
      c.shown = now;
      save();
    } else if (now - c.shown >= LIFE_DAYS * DAY) {
      c.hidden = true;
      c.auto = "time";
      save();
      return "";
    }
    var items = ITEMS[kind];
    if (items.indexOf("deal") >= 0 && C.dealsReady) {
      try {
        await C.dealsReady();
      } catch (e) {
      }
    }
    var dm = await doneMap(items);
    var n = items.filter(function(k) {
      return dm[k];
    }).length;
    if (n === items.length) {
      if (c.doneSeen && OB.greenVisit !== OB.visit) {
        c.hidden = true;
        c.auto = "done";
        save();
        return "";
      }
      if (!c.doneSeen) {
        c.doneSeen = 1;
        save();
      }
      OB.greenVisit = OB.visit;
      return '<section class="ck ok" aria-labelledby="ckT"><b id="ckT">' + svg("check") + E(T("ck_done_title")) + "</b><p>" + E(T("ck_done_text")) + '</p><button type="button" class="ob-btn ghost wide" data-ob="clHide">' + E(T("ck_hide")) + "</button></section>";
    }
    var open2 = c.open != null ? !!c.open : !overdue;
    var first = items.filter(function(k) {
      return !dm[k];
    })[0];
    var head = '<button type="button" class="ck-head" data-ob="clToggle" aria-expanded="' + open2 + '" aria-controls="ckList" aria-label="' + E(T("ck_title") + ", " + T("ck_aria", { n }) + ". " + T(open2 ? "ck_collapse" : "ck_expand")) + '"><span class="ck-row1"><b id="ckT">' + E(T("ck_title")) + "</b><span>" + E(T("ck_progress", { n })) + '</span></span><span class="ck-bar" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="' + n + '" aria-hidden="true"><i style="width:' + n * 20 + '%"></i></span></button>';
    var list = "";
    if (open2) {
      list = '<ul id="ckList">' + items.map(function(k) {
        var d = !!dm[k], now1 = k === first;
        return '<li class="' + (d ? "done" : "") + (now1 ? " now" : "") + '"><button type="button" class="ck-item" data-ob="ck" data-k="' + k + '"><span class="ck-mark">' + (d ? svg("check") : "") + '</span><span class="ck-tx"><b>' + E(T("ck_" + k + "_t")) + '<span class="ob-sr"> \u2014 ' + E(T(d ? "ck_ok" : "ck_todo")) + "</span></b>" + (now1 ? "<small>" + E(T("ck_" + k + "_h")) + "</small>" : "") + "</span>" + (d ? "" : svg("chev", "ck-chev")) + "</button></li>";
      }).join("") + '</ul><div class="ck-foot"><button type="button" class="ob-btn link" data-ob="clHide">' + E(T("ck_hide")) + "</button></div>";
    }
    return '<section class="ck" aria-labelledby="ckT">' + head + list + "</section>";
  }
  function moreRow() {
    if (!C || !kindOf() || !C.hasServer()) return "";
    if (!clState().hidden) return "";
    return '<button type="button" class="ck-restore" data-ob="clRestore">' + svg("check") + "<span><b>" + E(T("ck_restore")) + "</b><small>" + E(T("ck_restore_d")) + "</small></span></button>";
  }
  function opened() {
    if (!C) return;
    var c = clState();
    if (c.opened) return;
    c.opened = true;
    save();
  }
  function nav(tab) {
    OB.visit++;
    C.setTab(tab);
  }
  function ckGo(k) {
    if (k === "co") return C.importClick();
    if (k === "staff") return C.openStaff();
    if (k === "deal") return nav("deals");
    if (k === "chat") return nav("chat");
    if (k === "team") return C.showGate("login");
    return nav("list");
  }
  document.addEventListener("click", function(ev) {
    if (!C) return;
    var tb = ev.target.closest && ev.target.closest(".tabs button");
    if (tb) OB.visit++;
    var el = ev.target.closest && ev.target.closest("[data-ob]");
    if (!el) return;
    var a = el.getAttribute("data-ob");
    if (a === "next") return go(OB.step + 1);
    if (a === "back") return go(OB.step - 1);
    if (a === "skip") return finish("skip");
    if (a === "go") return finish("go");
    if (a === "look") return finish("look");
    if (a === "import") return C.importClick();
    if (a === "addCo") return C.quickAdd(true);
    if (a === "openList") return nav("list");
    if (a === "newDeal") return C.openDeal(null);
    if (a === "addStaff") return C.openStaff();
    if (a === "hello") {
      var ta = document.getElementById("cxText");
      if (ta) {
        ta.value = T("es_ch_hello");
        try {
          ta.dispatchEvent(new Event("input", { bubbles: true }));
        } catch (e) {
        }
        ta.focus();
      }
      return;
    }
    if (a === "ck") return ckGo(el.getAttribute("data-k"));
    if (a === "clToggle") {
      var c = clState(), now = el.getAttribute("aria-expanded") === "true";
      c.open = !now;
      save();
      return C.refresh();
    }
    if (a === "clHide") {
      var cs = clState();
      cs.hidden = true;
      cs.auto = "";
      save();
      C.refresh();
      C.toast(T("ck_hidden"), T("undo"), function() {
        var c2 = clState();
        c2.hidden = false;
        save();
        C.refresh();
      });
      return;
    }
    if (a === "clRestore") {
      var cr = clState();
      cr.hidden = false;
      cr.auto = "";
      cr.shown = Date.now();
      cr.doneSeen = 0;
      save();
      OB.greenVisit = null;
      return nav("today");
    }
  });
  document.addEventListener("change", function(ev) {
    var r = ev.target;
    if (!OB.layer || !r || r.name !== "obwho") return;
    OB.who = r.value;
    Array.prototype.forEach.call(OB.layer.querySelectorAll(".ob-rc"), function(l) {
      var inp = l.querySelector("input"), on = inp.checked;
      l.classList.toggle("on", on);
      l.querySelector(".ob-tick").innerHTML = on ? svg("check") : "";
    });
  });
  window.SDOnb = {
    // app.js отдаёт доступ к своим функциям: {S, AU, t, esc, num, metaSet, ROLE, isAdmin, canWriteAny, db, idx, members, activeMembers, dealsCount, CX, sy, syncOn, hasServer, myName,
    //   setTab, refresh, toast, importClick, quickAdd, openDeal, openStaff, showGate}
    init: function(ctx) {
      C = ctx;
    },
    maybeShow,
    back,
    isOpen: function() {
      return !!OB.layer;
    },
    state: function() {
      return { step: OB.step, visit: OB.visit, greenVisit: OB.greenVisit };
    },
    fillEmpty,
    todayEmpty,
    dealsEmpty,
    staffEmpty,
    chatEmpty,
    chatAfter,
    checklist,
    moreRow,
    opened
  };
})();
