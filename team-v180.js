(function() {
  "use strict";
  var C = null;
  var RT_TABLES = ["crm_team_tasks", "crm_task_events", "crm_daily_reports"];
  var STORES = ["tt_tasks", "tt_events", "tt_reports", "tt_outbox", "tt_meta"];
  var KP = { tt_tasks: "id", tt_events: "id", tt_reports: "k", tt_outbox: "id", tt_meta: "k" };
  var PAGE = 300, RH = 76, VIRT = 300, TZ_MS = 5 * 36e5, DAY = 864e5, POLL_MS = 25e3, META_MS = 3e5;
  var OPEN = { "new": 1, in_progress: 1, stuck: 1 };
  var FLAG_KEY = "sd-tt-on";
  var TT = {
    on: false,
    probed: 0,
    loaded: false,
    loading: null,
    tasks: /* @__PURE__ */ new Map(),
    ev: /* @__PURE__ */ new Map(),
    evId: /* @__PURE__ */ new Map(),
    reports: /* @__PURE__ */ new Map(),
    ob: /* @__PURE__ */ new Map(),
    depts: [],
    settings: null,
    dayoff: {},
    prefs: null,
    view: "",
    seg: "today",
    q: "",
    busy: false,
    again: false,
    timer: null,
    poll: null,
    last: 0,
    metaAt: 0,
    err: "",
    pend: 0,
    card: null,
    board: null,
    boardDay: "",
    up: null,
    rfT: null,
    rep: { date: "" },
    mm: null,
    mmSrc: null,
    vt: null,
    tgTimer: null
  };
  function T(k, v) {
    return C.t(k, v);
  }
  function has(k) {
    return C.t(k) !== k;
  }
  function E(s) {
    return C.esc(s);
  }
  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function $$(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function uid() {
    return C.AU && C.AU.uid || "";
  }
  function orgId() {
    return C.AU && C.AU.me ? C.AU.me.org_id : "";
  }
  function uuid() {
    return C.uuid();
  }
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function yieldMain() {
    return new Promise(function(r) {
      setTimeout(r, 0);
    });
  }
  function budget() {
    var t0 = performance.now();
    return function() {
      if (performance.now() - t0 > 12) {
        return yieldMain().then(function() {
          t0 = performance.now();
        });
      }
      return null;
    };
  }
  function ms(s) {
    return Date.parse(s) || 0;
  }
  function tkDay(msv) {
    return new Date(msv + TZ_MS).toISOString().slice(0, 10);
  }
  function todayTk() {
    return tkDay(Date.now());
  }
  function addDay(s, n) {
    var d = /* @__PURE__ */ new Date(s + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function dow(s) {
    var d = (/* @__PURE__ */ new Date(s + "T00:00:00Z")).getUTCDay();
    return d === 0 ? 7 : d;
  }
  function hm(msv) {
    var d = new Date(msv + TZ_MS);
    return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
  }
  function dmy(s) {
    return s ? s.slice(8, 10) + "." + s.slice(5, 7) : "";
  }
  function dt(msv) {
    return msv ? dmy(tkDay(msv)) + " " + hm(msv) : "";
  }
  function ago(msv) {
    return hm(msv);
  }
  function jclone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  var P = {
    plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
    check: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
    tasks: "M19 3h-4.2A3 3 0 0 0 9.2 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-2 14-4-4 1.4-1.4L10 14.2l6.6-6.6L18 9z",
    cam: "M9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    clip: "M16.5 6.5v10a4.5 4.5 0 0 1-9 0V6a3 3 0 0 1 6 0v9.5a1.5 1.5 0 0 1-3 0V7H9v8.5a3 3 0 0 0 6 0V6a4.5 4.5 0 0 0-9 0v10.5a6 6 0 0 0 12 0v-10z",
    send: "M2 21l21-9L2 3v7l15 2-15 2z",
    alert: "M12 2 1 21h22zm1 15h-2v-2h2zm0-4h-2V9h2z",
    x: "M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z",
    doc: "M6 2h9l5 5v15H6zm8 1.5V8h4.5zM8 12h8v2H8zm0 4h8v2H8z",
    team: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13c-3.3 0-7 1.7-7 4.5V20h14v-2.5C16 14.7 12.3 13 9 13zm7 0c-.5 0-1 0-1.5.1A5.3 5.3 0 0 1 18 17.5V20h4v-2.5c0-2.6-3.3-4.5-6-4.5z",
    clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.4l3.6 2.1-1 1.7L11 13V7z",
    bell: "M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.9V4a1 1 0 0 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1z",
    file: "M6 2h9l5 5v15H6zm8 1.5V8h4.5z"
  };
  function ico(n, cls) {
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + P[n] + '"/></svg>';
  }
  function dbh() {
    return C.db();
  }
  function rq(r) {
    return new Promise(function(res, rej) {
      r.onsuccess = function() {
        res(r.result);
      };
      r.onerror = function() {
        rej(r.error);
      };
    });
  }
  function txd(tx) {
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
  }
  async function put(store, rows) {
    if (!rows.length || !dbh()) return;
    for (var i = 0; i < rows.length; i += 100) {
      var tx = dbh().transaction(store, "readwrite"), st_ = tx.objectStore(store);
      rows.slice(i, i + 100).forEach(function(o) {
        st_.put(o);
      });
      await txd(tx);
      if (i + 100 < rows.length) await yieldMain();
    }
  }
  function putMany(pairs) {
    var names = [], seen = {};
    pairs.forEach(function(p) {
      if (p[1].length && !seen[p[0]]) {
        seen[p[0]] = 1;
        names.push(p[0]);
      }
    });
    if (!names.length || !dbh()) return Promise.resolve();
    var tx = dbh().transaction(names, "readwrite");
    pairs.forEach(function(p) {
      var s = tx.objectStore(p[0]);
      p[1].forEach(function(o) {
        s.put(o);
      });
    });
    return txd(tx);
  }
  function del(store, keys) {
    if (!keys.length || !dbh()) return Promise.resolve();
    var tx = dbh().transaction(store, "readwrite"), s = tx.objectStore(store);
    keys.forEach(function(k) {
      s.delete(k);
    });
    return txd(tx);
  }
  async function readAll(store, each) {
    var last = null;
    for (; ; ) {
      var range = last == null ? null : IDBKeyRange.lowerBound(last, true);
      var rows = await rq(dbh().transaction(store).objectStore(store).getAll(range, 1e3));
      if (!rows.length) break;
      each(rows);
      last = rows[rows.length - 1][KP[store]];
      if (rows.length < 1e3) break;
      await yieldMain();
    }
  }
  function metaGet(k) {
    return rq(dbh().transaction("tt_meta").objectStore("tt_meta").get(k)).then(function(r) {
      return r ? r.v : void 0;
    });
  }
  function metaSet(k, v) {
    return put("tt_meta", [{ k, v }]);
  }
  function role() {
    return C.ROLE();
  }
  function isLead() {
    var r = role();
    return r === "owner" || r === "admin";
  }
  function isOwner() {
    return role() === "owner";
  }
  function members() {
    var src = C.members();
    if (TT.mmSrc !== src || !TT.mm) {
      TT.mm = /* @__PURE__ */ new Map();
      (src || []).forEach(function(m) {
        TT.mm.set(m.user_id, m);
      });
      TT.mmSrc = src;
    }
    return TT.mm;
  }
  function me() {
    return members().get(uid()) || null;
  }
  function pname(id) {
    var m = members().get(id);
    return m ? m.display_name || m.email || "\u2014" : id === uid() ? C.myName() : "\u2014";
  }
  function activeMembers() {
    var o = [];
    members().forEach(function(m) {
      if (m.status === "active") o.push(m);
    });
    o.sort(function(a, b) {
      return String(pname(a.user_id)).localeCompare(pname(b.user_id));
    });
    return o;
  }
  function deptOf(id) {
    var m = members().get(id);
    return m ? m.department_id || null : null;
  }
  function deptName(id) {
    for (var i = 0; i < TT.depts.length; i++) if (TT.depts[i].id === id) return TT.depts[i].name;
    return "";
  }
  function liveDepts() {
    return TT.depts.filter(function(d) {
      return !d.deleted;
    });
  }
  function headDepts() {
    return liveDepts().filter(function(d) {
      return d.head_id === uid();
    }).map(function(d) {
      return d.id;
    });
  }
  function isHead() {
    return headDepts().length > 0;
  }
  function canBoard() {
    return isLead() || isHead();
  }
  function assignable() {
    var out = [], seen = {};
    if (isLead()) return activeMembers();
    var hd = headDepts(), my = deptOf(uid());
    activeMembers().forEach(function(m) {
      var d = m.department_id;
      if (m.user_id === uid() || d && (hd.indexOf(d) >= 0 || d === my)) {
        if (!seen[m.user_id]) {
          seen[m.user_id] = 1;
          out.push(m);
        }
      }
    });
    if (!seen[uid()]) {
      var mm = me();
      if (mm) out.unshift(mm);
    }
    return out;
  }
  function creatorIsLead(t) {
    var m = members().get(t.created_by);
    return !!m && (m.role === "owner" || m.role === "admin");
  }
  function headOfAssignee(t) {
    var d = deptOf(t.assignee_id);
    return !!d && headDepts().indexOf(d) >= 0;
  }
  function canManage(t) {
    return t.created_by === uid() || isLead() || headOfAssignee(t) && !creatorIsLead(t);
  }
  function canStatus(t) {
    return t.assignee_id === uid() || headOfAssignee(t) && creatorIsLead(t);
  }
  function eff(t) {
    return t._edit ? Object.assign({}, t, t._edit) : t;
  }
  function isOpen(t) {
    return !!OPEN[t.status];
  }
  function isOver(t) {
    return isOpen(t) && !!t.due_date && t.due_date < todayTk();
  }
  function evs(taskId) {
    var a = (TT.ev.get(taskId) || []).filter(function(e) {
      return !e.deleted;
    });
    a.sort(function(x, y) {
      return ms(x.occurred_at) - ms(y.occurred_at) || (x.id < y.id ? -1 : 1);
    });
    return a;
  }
  function filesOf(taskId) {
    return (TT.ev.get(taskId) || []).filter(function(e) {
      return !e.deleted && (e.kind === "photo" || e.kind === "file");
    });
  }
  function evPut(e) {
    var old = TT.evId.get(e.id), arr = TT.ev.get(e.task_id);
    if (!arr) {
      arr = [];
      TT.ev.set(e.task_id, arr);
    }
    if (old) {
      var i = arr.indexOf(old);
      if (i >= 0) arr[i] = e;
      else arr.push(e);
    } else arr.push(e);
    TT.evId.set(e.id, e);
  }
  function recount() {
    var n = 0;
    TT.tasks.forEach(function(t) {
      if (t._pend && !t._fail || t._edit) n++;
    });
    TT.evId.forEach(function(e) {
      if (e._pend && !e._fail) n++;
    });
    TT.reports.forEach(function(r) {
      if (r._pend) n++;
    });
    TT.pend = n;
  }
  function errCode(e) {
    var m = String(e && e.message || e);
    var c = m.match(/rate_limited|assign_forbidden|task_deleted|edit_window_closed|too_many_files|bad_date|event_immutable|forbidden|bad_status|file_too_big|row-level security|23514|22023/);
    if (c) return c[0] === "row-level security" ? "forbidden" : c[0];
    return e && e.status === 403 ? "forbidden" : e && e.status === 400 ? "bad" : "err";
  }
  function errText(code) {
    return has("tt_e_" + code) ? T("tt_e_" + code) : T("tt_e_err");
  }
  function isNet(e) {
    return C.NET_ERR(e);
  }
  async function load() {
    if (TT.loaded) return;
    if (TT.loading) return TT.loading;
    TT.loading = (async function() {
      TT.tasks = /* @__PURE__ */ new Map();
      TT.ev = /* @__PURE__ */ new Map();
      TT.evId = /* @__PURE__ */ new Map();
      TT.reports = /* @__PURE__ */ new Map();
      TT.ob = /* @__PURE__ */ new Map();
      await readAll("tt_tasks", function(rows) {
        rows.forEach(function(r) {
          TT.tasks.set(r.id, r);
        });
      });
      await readAll("tt_events", function(rows) {
        rows.forEach(evPut);
      });
      await readAll("tt_reports", function(rows) {
        rows.forEach(function(r) {
          TT.reports.set(r.k, r);
        });
      });
      await readAll("tt_outbox", function(rows) {
        rows.forEach(function(r) {
          TT.ob.set(r.id, r);
        });
      });
      var cfg = await metaGet("cfg") || {};
      TT.depts = cfg.depts || [];
      TT.settings = cfg.settings || null;
      TT.dayoff = cfg.dayoff || {};
      TT.prefs = cfg.prefs || null;
      TT.metaAt = 0;
      TT.boardCache = await metaGet("board") || null;
      TT.loaded = true;
      recount();
    })();
    try {
      await TT.loading;
    } finally {
      TT.loading = null;
    }
  }
  function setOn(v) {
    var changed = TT.on !== v;
    TT.on = v;
    try {
      if (v) localStorage.setItem(FLAG_KEY, orgId());
      else localStorage.removeItem(FLAG_KEY);
    } catch (e) {
    }
    shell();
    if (v && changed && C.rtRestart) C.rtRestart();
  }
  async function probe() {
    if (TT.probed && Date.now() - TT.probed < 6e4) return;
    TT.probed = Date.now();
    try {
      await C.api("GET", "crm_team_settings?select=org_id&limit=1");
      setOn(true);
    } catch (e) {
      if (isNet(e)) return;
      if (e.status === 404 || e.status === 403 || e.code === "PGRST205" || e.code === "42P01" || e.code === "42501") setOn(false);
    }
  }
  function shell() {
    var on = TT.on && C.syncOn();
    var b = $(".tabs button[data-tab=tasks]");
    if (b) b.hidden = !on;
    document.body.classList.toggle("tt-on", on);
    document.body.classList.toggle("tt-only", !!(on && TT.prefs && TT.prefs.tasks_only));
    badge();
  }
  function applyOnly() {
    var only = TT.on && TT.prefs && TT.prefs.tasks_only;
    if (only && !TT.onlyDone) {
      TT.onlyDone = 1;
      if (["list", "deals", "today", "stats"].indexOf(C.S.tab) >= 0) C.setTab("tasks");
    }
    if (!only) TT.onlyDone = 0;
  }
  function badge() {
    var el = $("#ttBadge");
    if (!el) return;
    var n = 0, over = false, td = todayTk();
    if (TT.loaded && uid()) TT.tasks.forEach(function(raw) {
      var t = eff(raw);
      if (t.deleted || t.assignee_id !== uid() || !isOpen(t)) return;
      if (!t.due_date || t.due_date <= td) {
        n++;
        if (t.due_date && t.due_date < td) over = true;
      }
    });
    el.textContent = n > 99 ? "99+" : String(n);
    el.hidden = !n;
    el.classList.toggle("warn", over);
  }
  async function pullPaged(tbl, mkey, filter, apply) {
    var mark = await metaGet(mkey), n = 0;
    for (; ; ) {
      var cond = filter ? [filter] : [];
      if (mark) cond.push('or(updated_at.gt."' + mark.ts + '",and(updated_at.eq."' + mark.ts + '",id.gt.' + mark.id + "))");
      var rows = await C.api("GET", tbl + "?select=*&order=updated_at.asc,id.asc&limit=" + PAGE + (cond.length ? "&and=" + encodeURIComponent("(" + cond.join(",") + ")") : ""));
      if (!rows || !rows.length) break;
      await apply(rows);
      var last = rows[rows.length - 1];
      mark = { ts: last.updated_at, id: last.id };
      await metaSet(mkey, mark);
      n += rows.length;
      if (rows.length < PAGE) break;
      await yieldMain();
    }
    return n;
  }
  async function applyTasks(rows) {
    var out = [], b = budget(), w;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], old = TT.tasks.get(r.id);
      if (old && old._edit) r._edit = old._edit;
      TT.tasks.set(r.id, r);
      out.push(r);
      if (w = b()) await w;
    }
    await put("tt_tasks", out);
  }
  async function applyEvents(rows) {
    var out = [], b = budget(), w;
    for (var i = 0; i < rows.length; i++) {
      evPut(rows[i]);
      out.push(rows[i]);
      if (w = b()) await w;
    }
    await put("tt_events", out);
  }
  async function applyReports(rows) {
    var out = [];
    rows.forEach(function(r) {
      r.k = r.user_id + "|" + r.report_date;
      var old = TT.reports.get(r.k);
      if (old && old._pend) return;
      TT.reports.set(r.k, r);
      out.push(r);
    });
    await put("tt_reports", out);
  }
  async function pullMeta() {
    var r = await Promise.all([
      C.api("GET", "crm_departments?select=*&order=name.asc"),
      C.api("GET", "crm_team_settings?select=*"),
      C.api("GET", "crm_team_dayoff?select=*&active=eq.true"),
      C.api("GET", "crm_team_prefs?select=*&user_id=eq." + encodeURIComponent(uid()))
    ]);
    TT.depts = r[0] || [];
    TT.settings = (r[1] || [])[0] || null;
    TT.dayoff = {};
    (r[2] || []).forEach(function(d) {
      TT.dayoff[d.day] = d.note || "";
    });
    TT.prefs = (r[3] || [])[0] || null;
    TT.metaAt = Date.now();
    await metaSet("cfg", { depts: TT.depts, settings: TT.settings, dayoff: TT.dayoff, prefs: TT.prefs, at: TT.metaAt });
    shell();
    applyOnly();
  }
  async function reconcile() {
    var ids = /* @__PURE__ */ new Set(), last = "";
    for (; ; ) {
      var rows = await C.api("GET", "crm_team_tasks?select=id&deleted=eq.false&status=in.(new,in_progress,stuck)&order=id.asc&limit=1000" + (last ? "&id=gt." + last : ""));
      if (!rows || !rows.length) break;
      rows.forEach(function(r) {
        ids.add(r.id);
      });
      last = rows[rows.length - 1].id;
      if (rows.length < 1e3) break;
    }
    var gone = [];
    TT.tasks.forEach(function(t) {
      if (!t._pend && !t._edit && !t._rej && !t.deleted && OPEN[t.status] && !ids.has(t.id)) gone.push(t.id);
    });
    if (!gone.length) return;
    var evIds = [];
    gone.forEach(function(id) {
      TT.tasks.delete(id);
      (TT.ev.get(id) || []).forEach(function(e) {
        if (!e._pend) {
          evIds.push(e.id);
          TT.evId.delete(e.id);
        }
      });
      TT.ev.delete(id);
    });
    await del("tt_tasks", gone);
    await del("tt_events", evIds);
  }
  async function pullDepts() {
    var d = await C.api("GET", "crm_departments?select=*&order=name.asc");
    if (JSON.stringify(d || []) !== JSON.stringify(TT.depts)) {
      TT.depts = d || [];
      await metaSet("cfg", { depts: TT.depts, settings: TT.settings, dayoff: TT.dayoff, prefs: TT.prefs, at: TT.metaAt });
    }
  }
  async function pullAll(force) {
    if (force || Date.now() - TT.metaAt > META_MS || !TT.settings) await pullMeta();
    else await pullDepts();
    var lead = canBoard();
    var cut90 = new Date(Date.now() - 90 * DAY).toISOString(), cutE = new Date(Date.now() - (lead ? 7 : 30) * DAY).toISOString();
    await pullPaged("crm_team_tasks", "pullT", 'or(status.in.(new,in_progress,stuck),updated_at.gte."' + cut90 + '")', applyTasks);
    await pullPaged("crm_task_events", "pullE", 'created_at.gte."' + cutE + '"', applyEvents);
    if (force || Date.now() - (TT.recAt || 0) > (lead ? META_MS : 6e4)) {
      await reconcile();
      TT.recAt = Date.now();
    }
    await pullPaged("crm_daily_reports", "pullR", "user_id.eq." + uid() + ",report_date.gte." + addDay(todayTk(), -60), applyReports);
  }
  async function fetchTaskEvents(id) {
    if (!C.syncOn() || navigator.onLine === false) return;
    try {
      var rows = await C.api("GET", "crm_task_events?select=*&task_id=eq." + encodeURIComponent(id) + "&order=occurred_at.asc&limit=300");
      if (rows && rows.length) {
        await applyEvents(rows);
      }
    } catch (e) {
    }
  }
  function ready(o) {
    return !o._fail && !(o._wait > Date.now());
  }
  var MAXTRY = 8;
  function transient(e) {
    var c = e && e.status;
    return !c || c === 408 || c === 429 || c >= 500 || isNet(e);
  }
  function backoff(o) {
    o._try = (o._try || 0) + 1;
    var d = Math.min(3e5, 5e3 * Math.pow(2, o._try - 1));
    o._wait = Date.now() + Math.round(d * (0.8 + Math.random() * 0.4));
    return o._try;
  }
  function clearTry(o) {
    delete o._try;
    delete o._wait;
    delete o._fail;
  }
  function isWait(e, c) {
    return c === "rate_limited" || transient(e);
  }
  async function failItem(obj, store, e) {
    if (isNet(e)) throw e;
    var c = errCode(e);
    if (isWait(e, c)) {
      if (backoff(obj) <= MAXTRY) return c;
      obj._fail = "retry";
      delete obj._wait;
      await put(store, [obj]);
      return "retry";
    }
    obj._fail = c;
    await put(store, [obj]);
    return c;
  }
  function resetWaits() {
    var f = function(o) {
      delete o._wait;
    };
    TT.tasks.forEach(f);
    TT.evId.forEach(f);
    TT.ob.forEach(f);
    TT.reports.forEach(f);
  }
  function nextWait() {
    var m = 0, now = Date.now();
    var f = function(o) {
      if (o._wait > now && (!m || o._wait < m)) m = o._wait;
    };
    TT.tasks.forEach(f);
    TT.evId.forEach(f);
    TT.ob.forEach(f);
    TT.reports.forEach(f);
    return m;
  }
  async function pushNewTask(t) {
    try {
      await C.api("POST", "crm_team_tasks?on_conflict=id", [{ id: t.id, org_id: orgId(), title: t.title, body: t.body || "", assignee_id: t.assignee_id, priority: t.priority | 0, due_date: t.due_date || null }], "resolution=ignore-duplicates,return=minimal");
      t._pend = 0;
      clearTry(t);
      await put("tt_tasks", [t]);
    } catch (e) {
      await failItem(t, "tt_tasks", e);
    }
  }
  var PATCHABLE = ["title", "body", "assignee_id", "priority", "due_date", "status", "stuck_reason", "status_at", "deleted"];
  async function pushEdit(t) {
    var snap = Object.assign({}, t._edit), body2 = {};
    PATCHABLE.forEach(function(k2) {
      if (k2 in snap) body2[k2] = snap[k2];
    });
    if (body2.status && body2.status !== "stuck") delete body2.stuck_reason;
    try {
      var r = await C.api("PATCH", "crm_team_tasks?id=eq." + encodeURIComponent(t.id), body2, "return=representation");
      var row = r && r[0], rest = null;
      if (t._edit) {
        for (var k in snap) if (JSON.stringify(t._edit[k]) === JSON.stringify(snap[k])) delete t._edit[k];
      }
      if (t._edit && Object.keys(t._edit).length) rest = t._edit;
      if (row) {
        if (rest) row._edit = rest;
        TT.tasks.set(t.id, row);
        await put("tt_tasks", [row]);
      } else await rejectEdit(t, "forbidden");
    } catch (e) {
      if (isNet(e)) throw e;
      var c = errCode(e);
      if (isWait(e, c)) {
        if (backoff(t) > MAXTRY) await rejectEdit(t, "retry");
        else await put("tt_tasks", [t]);
        return;
      }
      if (c === "task_deleted") t._gone = 1;
      await rejectEdit(t, c);
    }
  }
  async function rejectEdit(t, code) {
    t._rej = { edit: Object.assign({}, t._edit || {}), code };
    delete t._edit;
    delete t._try;
    delete t._wait;
    await put("tt_tasks", [t]);
    recount();
  }
  async function pushEvent(e) {
    var row = { id: e.id, task_id: e.task_id, kind: e.kind, body: e.body || "", occurred_at: e.occurred_at };
    if (e.kind !== "comment") {
      row.file_path = e.file_path;
      row.file_name = e.file_name;
      row.file_mime = e.file_mime;
      row.file_size = e.file_size;
      row.uploaded = false;
      if (e.thumb) row.thumb = e.thumb;
    }
    try {
      await C.api("POST", "crm_task_events?on_conflict=id", [row], "resolution=ignore-duplicates,return=minimal");
      e._pend = 0;
      clearTry(e);
      await put("tt_events", [e]);
    } catch (er) {
      if (isNet(er)) throw er;
      var c = errCode(er);
      if (c === "task_deleted") {
        await dropEvent(e);
        var tk = TT.tasks.get(e.task_id);
        if (tk) {
          tk._gone = 1;
          await put("tt_tasks", [tk]);
        }
        return;
      }
      await failItem(e, "tt_events", er);
      if (e._fail) {
        var ob = TT.ob.get(e.id);
        if (ob) {
          ob._fail = e._fail;
          await put("tt_outbox", [ob]);
        }
      }
    }
  }
  async function dropEvent(e) {
    var arr = TT.ev.get(e.task_id);
    if (arr) {
      var i = arr.indexOf(e);
      if (i >= 0) arr.splice(i, 1);
    }
    TT.evId.delete(e.id);
    TT.ob.delete(e.id);
    await del("tt_events", [e.id]);
    await del("tt_outbox", [e.id]);
  }
  async function storageUpload(path, buf, mime) {
    await C.ensureFresh();
    var url = C.baseUrl() + "/storage/v1/object/sotuvdesc-files/" + path.split("/").map(encodeURIComponent).join("/");
    var r = await fetch(url, { method: "POST", headers: { apikey: C.anonKey(), Authorization: "Bearer " + C.AU.s.access_token, "Content-Type": mime, "x-upsert": "false" }, body: new Blob([buf], { type: mime }) });
    if (r.ok) return;
    var txt = "";
    try {
      txt = await r.text();
    } catch (e) {
    }
    if (r.status === 409 || /Duplicate|already exists/i.test(txt)) return;
    var er = new Error("HTTP " + r.status + " " + txt.slice(0, 160));
    er.status = r.status;
    throw er;
  }
  async function pushFile(ob) {
    var e = TT.evId.get(ob.id);
    if (!e) {
      TT.ob.delete(ob.id);
      await del("tt_outbox", [ob.id]);
      return;
    }
    if (e._pend || !ready(ob)) return;
    try {
      if (!ob.up) {
        await storageUpload(ob.path, ob.buf, ob.mime);
        ob.up = 1;
        await put("tt_outbox", [ob]);
      }
      await C.api("PATCH", "crm_task_events?id=eq." + encodeURIComponent(ob.id), { uploaded: true }, "return=minimal");
      e.uploaded = true;
      delete e._fail;
      TT.ob.delete(ob.id);
      await put("tt_events", [e]);
      await del("tt_outbox", [ob.id]);
    } catch (er) {
      if (isNet(er)) throw er;
      var c = errCode(er);
      if (isWait(er, c)) {
        if (backoff(ob) <= MAXTRY) return;
        c = "retry";
      }
      ob._fail = c === "err" && er.status ? "http" + er.status : c;
      delete ob._wait;
      e._fail = ob._fail;
      await put("tt_outbox", [ob]);
      await put("tt_events", [e]);
    }
  }
  async function pushReport(r) {
    var row = { org_id: orgId(), user_id: uid(), report_date: r.report_date, done_text: r.done_text, how_text: r.how_text, tomorrow_text: r.tomorrow_text, help_text: r.help_text, task_ids: r.task_ids || [], status: r.status };
    try {
      var res = await C.api("POST", "crm_daily_reports?on_conflict=org_id,user_id,report_date", [row], "resolution=merge-duplicates,return=representation");
      var s = res && res[0];
      if (s) {
        s.k = s.user_id + "|" + s.report_date;
        TT.reports.set(s.k, s);
        await put("tt_reports", [s]);
      } else {
        r._pend = 0;
        await put("tt_reports", [r]);
      }
    } catch (e) {
      if (isNet(e)) throw e;
      var c = errCode(e);
      if (isWait(e, c)) {
        if (backoff(r) <= MAXTRY) return;
        c = "retry";
      }
      r._pend = 0;
      r._fail = c;
      delete r._wait;
      delete r._try;
      await put("tt_reports", [r]);
      C.toast(errText(c));
    }
  }
  function collect(map, fn) {
    var o = [];
    map.forEach(function(v) {
      if (fn(v)) o.push(v);
    });
    return o;
  }
  async function push() {
    var list, i;
    list = collect(TT.tasks, function(x) {
      return x._pend && ready(x);
    }).sort(function(a, b) {
      return ms(a.created_at) - ms(b.created_at);
    });
    for (i = 0; i < list.length; i++) await pushNewTask(list[i]);
    list = collect(TT.tasks, function(x) {
      return !x._pend && x._edit && ready(x);
    });
    for (i = 0; i < list.length; i++) await pushEdit(list[i]);
    list = collect(TT.evId, function(x) {
      return x._pend && ready(x);
    }).sort(function(a, b) {
      return ms(a.created_at) - ms(b.created_at);
    });
    for (i = 0; i < list.length; i++) {
      var tk = TT.tasks.get(list[i].task_id);
      if (tk && (tk._pend || tk._fail)) continue;
      await pushEvent(list[i]);
    }
    list = collect(TT.ob, function() {
      return true;
    });
    for (i = 0; i < list.length; i++) await pushFile(list[i]);
    list = collect(TT.reports, function(x) {
      return x._pend && ready(x);
    });
    for (i = 0; i < list.length; i++) await pushReport(list[i]);
    recount();
  }
  function schedule(msv) {
    if (!C || !C.syncOn()) return;
    clearTimeout(TT.timer);
    TT.timer = setTimeout(function() {
      sync();
    }, msv == null ? 300 : msv);
  }
  function wake(msv) {
    schedule(msv == null ? 120 : msv);
  }
  function ensurePoll() {
    if (TT.poll) return;
    TT.poll = setInterval(function() {
      if (document.hidden || !C.syncOn() || navigator.onLine === false) return;
      if (Date.now() - TT.last > POLL_MS - 1e3) sync();
    }, POLL_MS);
  }
  async function sync(force) {
    if (!C.syncOn() || !dbh() || navigator.onLine === false) return;
    if (TT.busy) {
      TT.again = true;
      return;
    }
    TT.busy = true;
    ensurePoll();
    if (force === true || TT.resetW) {
      TT.resetW = 0;
      resetWaits();
    }
    try {
      if (!TT.on) await probe();
      if (TT.on) {
        if (!TT.loaded) await load();
        await push();
        await pullAll(force === true);
        TT.last = Date.now();
        TT.err = "";
      }
    } catch (e) {
      TT.err = String(e && e.message || e);
      if (!isNet(e)) console.warn("team sync", e);
    }
    TT.busy = false;
    recount();
    badge();
    if (C.syncBadge) C.syncBadge();
    refresh();
    var nw = nextWait();
    if (nw) schedule(Math.max(1e3, nw - Date.now() + 300));
    if (TT.again) {
      TT.again = false;
      schedule(300);
    }
  }
  function nowIso() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function after(light) {
    recount();
    badge();
    if (C.syncBadge) C.syncBadge();
    if (!light) refresh();
    schedule(0);
  }
  async function createTasks(f) {
    var rows = [], t0 = nowIso();
    f.assignees.forEach(function(a) {
      rows.push({ id: uuid(), org_id: orgId(), title: f.title, body: f.body || "", assignee_id: a, created_by: uid(), priority: f.priority | 0, due_date: f.due || null, status: "new", stuck_reason: null, status_at: null, done_at: null, created_at: t0, updated_at: t0, deleted: false, _pend: 1 });
    });
    rows.forEach(function(r) {
      TT.tasks.set(r.id, r);
    });
    await put("tt_tasks", rows);
    after();
    return rows;
  }
  async function patchTask(id, patch) {
    var t = TT.tasks.get(id);
    if (!t) return;
    var cur = eff(t), ch = {};
    Object.keys(patch).forEach(function(k) {
      if (JSON.stringify(cur[k]) !== JSON.stringify(patch[k]) || k === "status_at") ch[k] = patch[k];
    });
    if (!Object.keys(ch).length) return;
    t._edit = Object.assign(t._edit || {}, ch);
    delete t._wait;
    await put("tt_tasks", [t]);
    after();
  }
  function setStatus(id, st, reason) {
    var cur = TT.tasks.get(id);
    cur = cur ? eff(cur) : null;
    if (cur && cur.status === st && (st !== "stuck" || cur.stuck_reason === reason)) return Promise.resolve();
    return patchTask(id, { status: st, stuck_reason: st === "stuck" ? reason : null, status_at: nowIso() });
  }
  function localEvent(taskId, kind, extra) {
    var t0 = nowIso();
    return Object.assign({ id: uuid(), org_id: orgId(), task_id: taskId, actor_id: uid(), kind, old_status: null, new_status: null, body: "", file_path: null, file_name: null, file_mime: null, file_size: null, thumb: null, uploaded: false, purged_at: null, occurred_at: t0, created_at: t0, updated_at: t0, deleted: false, _pend: 1 }, extra || {});
  }
  async function addComment(taskId, text) {
    text = String(text || "").trim().slice(0, 2e3);
    if (!text) return;
    var e = localEvent(taskId, "comment", { body: text });
    evPut(e);
    await put("tt_events", [e]);
    after();
  }
  async function retryItem(kind, id) {
    if (kind === "rej") {
      var tr = TT.tasks.get(id);
      if (!tr || !tr._rej) return;
      tr._edit = Object.assign(tr._edit || {}, tr._rej.edit);
      delete tr._rej;
      clearTry(tr);
      await put("tt_tasks", [tr]);
      return after();
    }
    if (kind === "rep") {
      var rr = TT.reports.get(id);
      if (!rr) return;
      rr._pend = 1;
      clearTry(rr);
      await put("tt_reports", [rr]);
      return after();
    }
    var o = kind === "task" ? TT.tasks.get(id) : TT.evId.get(id);
    if (!o) return;
    clearTry(o);
    var ob = TT.ob.get(id);
    if (ob) {
      delete ob._fail;
      delete ob._wait;
      delete ob._try;
      await put("tt_outbox", [ob]);
    }
    await put(kind === "task" ? "tt_tasks" : "tt_events", [o]);
    after();
  }
  async function dropItem(kind, id) {
    if (kind === "rej") {
      var tj = TT.tasks.get(id);
      if (tj) {
        delete tj._rej;
        await put("tt_tasks", [tj]);
      }
      return after();
    }
    if (kind === "rep") {
      var rp = TT.reports.get(id);
      if (rp) {
        TT.reports.delete(id);
        await del("tt_reports", [id]);
        await del("tt_meta", ["pullR"]);
      }
      return after();
    }
    if (kind === "task") {
      var t = TT.tasks.get(id);
      if (!t) return;
      if (t._pend) {
        TT.tasks.delete(id);
        await del("tt_tasks", [id]);
      } else {
        clearTry(t);
        await put("tt_tasks", [t]);
      }
    } else {
      var e = TT.evId.get(id);
      if (!e) return;
      if (e._pend) {
        await dropEvent(e);
      } else if (!stuckFile(e)) return deleteEvent(id);
      else {
        try {
          await C.api("PATCH", "crm_task_events?id=eq." + encodeURIComponent(id), { deleted: true }, "return=minimal");
        } catch (er) {
        }
        e.deleted = true;
        TT.ob.delete(id);
        await put("tt_events", [e]);
        await del("tt_outbox", [id]);
      }
    }
    after();
  }
  async function deleteEvent(id) {
    var e = TT.evId.get(id);
    if (!e) return;
    if (e._pend) return dropItem("ev", id);
    try {
      await C.api("PATCH", "crm_task_events?id=eq." + encodeURIComponent(id), { deleted: true }, "return=minimal");
      e.deleted = true;
      await put("tt_events", [e]);
      after();
    } catch (er) {
      C.toast(isNet(er) ? T("tt_need_net") : errText(errCode(er)));
    }
  }
  var SIDE = 1280, SIDE_HD = 1600, PHOTO_SOFT = 220 * 1024, PHOTO_SOFT_HD = 400 * 1024, PHOTO_HARD = 1e3 * 1024, FILE_MAX = 5242880, MAX_FILES = 20;
  function loadImage(file) {
    return new Promise(function(res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function() {
        res({ img, url });
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        rej(new Error("image_decode"));
      };
      img.src = url;
    });
  }
  function toBlobJpeg(cv, q) {
    return new Promise(function(res) {
      if (!cv.toBlob) return res(null);
      try {
        cv.toBlob(function(b) {
          res(b);
        }, "image/jpeg", q);
      } catch (e) {
        res(null);
      }
    });
  }
  function dataUrlBlob(du) {
    var p = du.split(","), bin = atob(p[1]), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: "image/jpeg" });
  }
  async function encodeJpeg(cv, q) {
    var b = await toBlobJpeg(cv, q);
    if (!b || b.type !== "image/jpeg") {
      var du = cv.toDataURL("image/jpeg", q);
      if (!/^data:image\/jpeg/.test(du)) throw new Error("jpeg_unsupported");
      b = dataUrlBlob(du);
    }
    return b;
  }
  function blobBuf(b) {
    if (b.arrayBuffer) return b.arrayBuffer();
    return new Promise(function(res, rej) {
      var fr = new FileReader();
      fr.onload = function() {
        res(fr.result);
      };
      fr.onerror = function() {
        rej(fr.error);
      };
      fr.readAsArrayBuffer(b);
    });
  }
  function makeThumb(cv) {
    var sizes = [320, 256, 200, 160, 128, 96], qs = [0.55, 0.4, 0.3], out = "", t = document.createElement("canvas"), cx = t.getContext("2d");
    for (var i = 0; i < sizes.length; i++) {
      var s = Math.min(1, sizes[i] / Math.max(cv.width, cv.height));
      t.width = Math.max(1, Math.round(cv.width * s));
      t.height = Math.max(1, Math.round(cv.height * s));
      cx.fillStyle = "#fff";
      cx.fillRect(0, 0, t.width, t.height);
      cx.drawImage(cv, 0, 0, t.width, t.height);
      for (var j = 0; j < qs.length; j++) {
        out = t.toDataURL("image/jpeg", qs[j]);
        if (out.length <= 11800 && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(out)) {
          t.width = t.height = 0;
          return out;
        }
      }
    }
    t.width = t.height = 0;
    return "";
  }
  function drawScaled(img, side) {
    var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, side / Math.max(w, h));
    var cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * k));
    cv.height = Math.max(1, Math.round(h * k));
    var cx = cv.getContext("2d");
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, cv.width, cv.height);
    cx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  }
  async function compressPhoto(file, hd) {
    var li = await loadImage(file), img = li.img, cv = null;
    try {
      if (img.decode) {
        try {
          await img.decode();
        } catch (e) {
        }
      }
      if (!img.naturalWidth || !img.naturalHeight) throw new Error("image_decode");
      cv = drawScaled(img, hd ? SIDE_HD : SIDE);
      await yieldMain();
      var qs = hd ? [0.78, 0.75] : [0.72, 0.65, 0.6], soft = hd ? PHOTO_SOFT_HD : PHOTO_SOFT, blob = null;
      for (var qi = 0; qi < qs.length; qi++) {
        blob = await encodeJpeg(cv, qs[qi]);
        if (blob.size <= soft) break;
      }
      if (blob.size > PHOTO_HARD) {
        cv.width = cv.height = 0;
        cv = drawScaled(img, 1024);
        blob = await encodeJpeg(cv, 0.6);
      }
      if (blob.size > PHOTO_HARD) throw new Error("photo_big");
      var out = { buf: await blobBuf(blob), size: blob.size, mime: blob.type, w: cv.width, h: cv.height, thumb: "" };
      await yieldMain();
      out.thumb = makeThumb(cv);
      return out;
    } finally {
      if (cv) cv.width = cv.height = 0;
      URL.revokeObjectURL(li.url);
      img.src = "";
    }
  }
  var MIME_OK = {};
  "image/jpeg image/png image/webp image/gif image/heic image/heif image/bmp application/pdf application/rtf text/plain text/csv application/msword application/vnd.openxmlformats-officedocument.wordprocessingml.document application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet application/vnd.ms-excel.sheet.macroEnabled.12 application/vnd.ms-powerpoint application/vnd.openxmlformats-officedocument.presentationml.presentation application/vnd.oasis.opendocument.text application/vnd.oasis.opendocument.spreadsheet application/vnd.oasis.opendocument.presentation application/zip application/x-zip-compressed application/vnd.rar application/x-rar-compressed application/x-7z-compressed audio/webm audio/ogg audio/mp4 audio/mpeg audio/aac audio/3gpp audio/amr audio/wav audio/x-m4a video/mp4 video/quicktime video/3gpp video/webm".split(" ").forEach(function(m) {
    MIME_OK[m] = 1;
  });
  var EXT_MIME = {
    pdf: "application/pdf",
    rtf: "application/rtf",
    txt: "text/plain",
    csv: "text/csv",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/x-m4a",
    ogg: "audio/ogg",
    aac: "audio/aac"
  };
  function fileMime(f) {
    var t = String(f.type || "").toLowerCase().split(";")[0];
    if (t) return MIME_OK[t] ? t : "";
    var m = /\.([a-z0-9]{1,5})$/i.exec(f.name || "");
    return m && EXT_MIME[m[1].toLowerCase()] || "";
  }
  function safeName(n) {
    n = String(n || "file").replace(/[\\\/\u0000-\u001f\u007f]+/g, "_").replace(/\.\.+/g, ".").trim();
    if (n.length > 120) {
      var m = n.match(/\.[A-Za-z0-9]{1,8}$/);
      n = n.slice(0, 110) + (m ? m[0] : "");
    }
    return n || "file";
  }
  async function addOne(taskId, f, hd) {
    var isImg = /^image\//.test(f.type || "") || /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(f.name || "");
    var id = uuid(), name, mime, buf, size, thumb = null, kind;
    if (isImg) {
      var c = await compressPhoto(f, hd);
      kind = "photo";
      buf = c.buf;
      size = c.size;
      mime = c.mime;
      thumb = c.thumb || null;
      name = "photo-" + tkDay(Date.now()).replace(/-/g, "") + "-" + hm(Date.now()).replace(":", "") + "-" + id.slice(0, 4) + ".jpg";
    } else {
      if (f.size > FILE_MAX) {
        C.toast(T("tt_file_big"));
        return false;
      }
      mime = fileMime(f);
      if (!mime) {
        C.toast(T("tt_file_type"));
        return false;
      }
      kind = "file";
      name = safeName(f.name);
      buf = await blobBuf(f);
      size = buf.byteLength;
      if (!size) return false;
    }
    var path = "tasks/" + taskId + "/" + id + "/" + name;
    var e = localEvent(taskId, kind, { id, file_path: path, file_name: name, file_mime: mime, file_size: size, thumb });
    var ob = { id, task_id: taskId, path, mime, buf, size, name, up: 0 };
    TT.ob.set(id, ob);
    evPut(e);
    await putMany([["tt_events", [e]], ["tt_outbox", [ob]]]);
    return true;
  }
  async function addFiles(taskId, list, hd) {
    var files = Array.prototype.slice.call(list || []).slice(0, 5), have = filesOf(taskId).length;
    if (have + files.length > MAX_FILES) {
      C.toast(T("tt_e_too_many_files"));
      files = files.slice(0, Math.max(0, MAX_FILES - have));
    }
    if (!files.length) return;
    TT.up = { n: 0, m: files.length };
    for (var i = 0; i < files.length; i++) {
      TT.up.n = i + 1;
      drawCard();
      try {
        await addOne(taskId, files[i], hd);
      } catch (e) {
        console.warn("photo", e);
        C.toast(T("tt_photo_fail"));
      }
      await yieldMain();
    }
    TT.up = null;
    after();
  }
  function pickFiles(taskId, photo, hd) {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.style.display = "none";
    if (photo) {
      inp.accept = "image/*";
      inp.multiple = true;
    }
    inp.onchange = function() {
      var l = inp.files;
      setTimeout(function() {
        inp.remove();
      }, 0);
      if (l && l.length) addFiles(taskId, l, hd);
    };
    document.body.appendChild(inp);
    inp.click();
  }
  async function openPhoto(eid) {
    var e = TT.evId.get(eid);
    if (!e) return;
    var ob = TT.ob.get(eid), url = "";
    try {
      if (ob && ob.buf) url = URL.createObjectURL(new Blob([ob.buf], { type: ob.mime }));
      else {
        if (e.purged_at) {
          C.toast(T("tt_purged"));
          return;
        }
        if (navigator.onLine === false) {
          C.toast(T("tt_need_net"));
          return;
        }
        url = await C.fileSignedUrl({ path: e.file_path });
      }
    } catch (er) {
      C.toast(T("tt_open_fail"));
      return;
    }
    if (e.kind === "file") {
      C.openExt(url);
      return;
    }
    var sh = C.openSheet(C.sheetHead(e.file_name || T("tt_photo")) + '<div class="tt-view"><img src="' + E(url) + '" alt="' + E(e.file_name || T("tt_photo")) + '"></div>', { full: true, onClose: function() {
      if (/^blob:/.test(url)) URL.revokeObjectURL(url);
    } });
    return sh;
  }
  function repKey(date) {
    return uid() + "|" + date;
  }
  function pStr(v) {
    return String(v == null ? "" : v);
  }
  async function saveDraft(date, f) {
    await metaSet("draft:" + date, { done: f.done, how: f.how, tomorrow: f.tomorrow, help: f.help, task_ids: f.task_ids || [], at: Date.now() });
  }
  async function submitReport(date, f) {
    var k = repKey(date), old = TT.reports.get(k) || {};
    var r = Object.assign({}, old, { k, org_id: orgId(), user_id: uid(), report_date: date, done_text: f.done, how_text: f.how, tomorrow_text: f.tomorrow, help_text: f.help, task_ids: f.task_ids || [], status: "submitted", _pend: 1 });
    delete r._fail;
    delete r._wait;
    TT.reports.set(k, r);
    await put("tt_reports", [r]);
    await del("tt_meta", ["draft:" + date]);
    after();
  }
  function wdList() {
    return TT.prefs && TT.prefs.work_days && TT.prefs.work_days.length ? TT.prefs.work_days : TT.settings && TT.settings.workdays || [1, 2, 3, 4, 5, 6];
  }
  function isWorkday(date) {
    if (TT.dayoff[date] != null) return false;
    return wdList().indexOf(dow(date)) >= 0;
  }
  function reportRequired() {
    return TT.prefs && TT.prefs.report_required != null ? !!TT.prefs.report_required : role() !== "owner";
  }
  function canEditReport(date) {
    return date >= addDay(todayTk(), -1) && date <= todayTk();
  }
  function dfull(s) {
    return s ? s.slice(8, 10) + "." + s.slice(5, 7) + "." + s.slice(0, 4) : "";
  }
  function stChip(s) {
    return '<span class="tt-st tt-st-' + E(s) + '">' + E(T("tt_s_" + s)) + "</span>";
  }
  function lab(id, key, ctl) {
    return '<div class="tt-fld"><label class="tt-l" for="' + E(id) + '">' + E(T(key)) + "</label>" + ctl + "</div>";
  }
  function okThumb(s) {
    return typeof s === "string" && /^data:image\/(jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(s);
  }
  function empty(msg, btn) {
    return '<div class="tt-empty"><div class="es-ic">' + ico("tasks") + "</div><p>" + E(msg) + "</p>" + (btn || "") + "</div>";
  }
  function render() {
    var v = $("#v-tasks");
    if (!v) return;
    if (!C.syncOn()) {
      v.innerHTML = '<div class="pad"><h2>' + E(T("tt_title")) + '</h2><p class="note">' + E(T("tt_need_login")) + "</p></div>";
      return;
    }
    if (!TT.loaded) {
      v.innerHTML = '<div class="pad"><p class="muted">' + E(T("loading")) + "</p></div>";
      load().then(function() {
        if (C.S.tab === "tasks") render();
      }, function() {
      });
      schedule(0);
      return;
    }
    if (!TT.view || TT.view === "team" && !canBoard()) TT.view = canBoard() ? "team" : "tasks";
    var tabs = (canBoard() ? [["team", "tt_v_team"]] : []).concat([["tasks", "tt_v_tasks"], ["report", "tt_v_report"]]);
    v.innerHTML = '<div class="tt"><div class="tt-head"><h2>' + E(T("tt_title")) + '</h2><button type="button" class="btn primary tt-addb" data-tm="new" aria-label="' + E(T("tt_add")) + '">' + ico("plus") + "<span>" + E(T("tt_add")) + '</span></button></div><div class="tt-nav" role="group" aria-label="' + E(T("tt_title")) + '">' + tabs.map(function(x) {
      return '<button type="button" data-tm="view" data-v="' + E(x[0]) + '" aria-pressed="' + (TT.view === x[0]) + '">' + E(T(x[1])) + "</button>";
    }).join("") + '</div><div id="ttFail"></div><div id="ttBody"></div></div>';
    body();
    failBanner();
  }
  function failedItems() {
    var o = [];
    TT.tasks.forEach(function(t) {
      if (t._pend && t._fail) o.push({ k: "task", id: t.id, title: t.title, code: t._fail, what: T("tt_new") });
      else if (t._rej) o.push({ k: "rej", id: t.id, title: t.title, code: t._rej.code, what: t._rej.edit && t._rej.edit.status ? T("tt_status") + ": " + T("tt_s_" + t._rej.edit.status) : T("tt_edit") });
    });
    TT.evId.forEach(function(e) {
      if (!e._fail || e.deleted) return;
      var tk = TT.tasks.get(e.task_id);
      o.push({ k: "ev", id: e.id, title: tk ? tk.title : "", code: e._fail, what: e.kind === "comment" ? String(e.body || "").slice(0, 80) : e.file_name || T("tt_file") });
    });
    TT.reports.forEach(function(r) {
      if (r._fail) o.push({ k: "rep", id: r.k, title: T("tt_v_report") + " \xB7 " + dfull(r.report_date), code: r._fail, what: "" });
    });
    return o;
  }
  function failBanner() {
    var b = $("#ttFail");
    if (!b) return;
    var n = failedItems().length;
    b.innerHTML = n ? '<button type="button" class="btn tt-failb" data-tm="failed">' + ico("alert") + "<span>" + E(T("tt_failed", { n })) + "</span></button>" : "";
  }
  function stuckFile(e) {
    var ob = TT.ob.get(e.id);
    return !!(e._fail || ob && (ob._try || ob._fail));
  }
  function failBtns(k, id) {
    return '<div class="tt-phb"><button type="button" class="btn ghost small" data-tm="retry" data-k="' + E(k) + '" data-id="' + E(id) + '">' + E(T("tt_retry")) + '</button><button type="button" class="btn danger small" data-tm="drop" data-k="' + E(k) + '" data-id="' + E(id) + '">' + E(T("tt_drop")) + "</button></div>";
  }
  function openFailed() {
    var sh = C.openSheet(C.sheetHead(T("tt_failed_h")) + '<div class="col" id="ttFl"></div>', { full: true, onClose: function() {
      TT.fsh = null;
    } });
    TT.fsh = sh;
    drawFailed();
    return sh;
  }
  function drawFailed() {
    var sh = TT.fsh;
    if (!sh || !sh.isConnected) return;
    var box = $("#ttFl", sh), l = failedItems();
    if (!box) return;
    box.innerHTML = l.length ? l.map(function(x) {
      return '<div class="tt-frow"><b>' + E(x.title || "") + "</b>" + (x.what ? '<span class="tt-etx">' + E(x.what) + "</span>" : "") + '<span class="tt-q red">' + E(T("tt_notsent", { e: errText(x.code) })) + "</span>" + failBtns(x.k, x.id) + "</div>";
    }).join("") : '<p class="muted">' + E(T("tt_failed_none")) + "</p>";
  }
  function body() {
    if (TT.view === "team") viewTeam();
    else if (TT.view === "report") viewReport();
    else viewTasks();
  }
  function refresh() {
    clearTimeout(TT.rfT);
    TT.rfT = setTimeout(doRefresh, 40);
  }
  function doRefresh() {
    if (!TT.loaded) return;
    if (C.S.tab === "tasks" && $("#ttBody") && TT.view === "team" && !canBoard()) render();
    else if (C.S.tab === "tasks" && $("#ttBody")) {
      refreshView();
      failBanner();
    }
    if (TT.fsh && TT.fsh.isConnected) drawFailed();
    if (TT.card && TT.card.sh && TT.card.sh.isConnected) drawCard();
    if (TT.person && TT.person.sh && TT.person.sh.isConnected) drawPerson();
  }
  function refreshView() {
    if (TT.view === "tasks") drawList();
    else if (TT.view === "report") repBanner();
    else if (TT.view === "team" && TT.board && Date.now() - TT.board.reqAt > 3e3 && !TT.busyBoard) {
      TT.busyBoard = 1;
      loadBoard(TT.boardDay || todayTk(), true).then(function() {
        TT.busyBoard = 0;
        if (TT.view === "team" && $("#ttBody")) paintTeam();
      });
    }
  }
  function inSeg(t, seg, td) {
    var me_ = uid();
    if (seg === "byme") return t.created_by === me_ && t.assignee_id !== me_;
    if (t.assignee_id !== me_) return false;
    if (seg === "done") return t.status === "done";
    if (!isOpen(t)) return false;
    if (seg === "open") return true;
    return !t.due_date || t.due_date <= td;
  }
  function listItems(seg, q) {
    var td = todayTk(), out = [];
    TT.tasks.forEach(function(raw) {
      var t = eff(raw);
      if (t.deleted || raw._gone) return;
      if (!inSeg(t, seg, td)) return;
      if (q && t.title.toLowerCase().indexOf(q) < 0) return;
      out.push(t);
    });
    if (seg === "done") out.sort(function(a, b) {
      return ms(b.status_at || b.updated_at) - ms(a.status_at || a.updated_at);
    });
    else out.sort(function(a, b) {
      var oa = isOver(a) ? 0 : 1, ob_ = isOver(b) ? 0 : 1;
      if (oa !== ob_) return oa - ob_;
      var da = a.due_date || "9999", db_ = b.due_date || "9999";
      if (da !== db_) return da < db_ ? -1 : 1;
      if ((a.priority | 0) !== (b.priority | 0)) return (b.priority | 0) - (a.priority | 0);
      return ms(b.created_at) - ms(a.created_at);
    });
    return out;
  }
  function photoCount(id) {
    var n = 0;
    (TT.ev.get(id) || []).forEach(function(e) {
      if (e.kind === "photo" && !e.deleted) n++;
    });
    return n;
  }
  function rowHtml(t) {
    var over = isOver(t), cnt = photoCount(t.id), q = !!(t._pend || t._edit), p = t.priority | 0;
    var due = t.due_date ? T(over ? "tt_overdue" : "tt_due", { d: dmy(t.due_date) }) : "";
    return '<button type="button" class="tt-row' + (over ? " over" : "") + (t.status === "done" ? " done" : "") + '" data-tm="open" data-id="' + E(t.id) + '"><span class="tt-pri p' + p + '" aria-hidden="true"></span><span class="tt-rmain"><b class="tt-rt">' + E(t.title) + '</b><span class="tt-rs">' + stChip(t.status) + (p ? '<span class="tt-pc p' + p + '">' + E(T("tt_p" + p)) + "</span>" : "") + (due ? '<span class="tt-due' + (over ? " red" : "") + '">' + E(due) + "</span>" : "") + (TT.seg === "byme" ? '<span class="tt-who">' + E(pname(t.assignee_id)) + "</span>" : "") + (cnt ? '<span class="tt-cnt">' + ico("cam") + cnt + "</span>" : "") + (q ? '<span class="tt-q">' + E(T("tt_queued")) + "</span>" : "") + "</span></span></button>";
  }
  function viewTasks() {
    var box = $("#ttBody");
    if (!box) return;
    box.innerHTML = '<div class="tt-seg" id="ttSeg" role="group" aria-label="' + E(T("tt_v_tasks")) + '"></div><input class="inp tt-in tt-q-in" id="ttQ" type="search" autocomplete="off" enterkeyhint="search" placeholder="' + E(T("tt_search")) + '" aria-label="' + E(T("tt_search")) + '" value="' + E(TT.q) + '"><div id="ttList" class="tt-list" aria-live="polite"></div>';
    drawList();
  }
  function drawList() {
    var box = $("#ttList");
    if (!box) return;
    var segs = ["today", "open", "done", "byme"], q = TT.q.toLowerCase(), td = todayTk(), cnt = { today: 0, open: 0, done: 0, byme: 0 };
    TT.tasks.forEach(function(raw) {
      var t = eff(raw);
      if (t.deleted || raw._gone) return;
      for (var i = 0; i < segs.length; i++) if (inSeg(t, segs[i], td)) cnt[segs[i]]++;
    });
    var sg = $("#ttSeg");
    if (sg) sg.innerHTML = segs.map(function(s) {
      return '<button type="button" data-tm="seg" data-s="' + s + '" aria-pressed="' + (TT.seg === s) + '">' + E(T("tt_seg_" + s)) + " <b>" + cnt[s] + "</b></button>";
    }).join("");
    var items = TT.items = listItems(TT.seg, q);
    if (!items.length) {
      TT.vt = null;
      box.style.height = "";
      box.style.position = "";
      box.innerHTML = empty(T(q ? "tt_nothing" : "tt_empty_" + TT.seg), !q && TT.seg !== "done" ? '<button type="button" class="btn primary" data-tm="new">' + ico("plus") + E(T("tt_add")) + "</button>" : "");
      return;
    }
    if (items.length <= VIRT) {
      TT.vt = null;
      box.style.height = "";
      box.style.position = "";
      box.innerHTML = items.map(rowHtml).join("");
      return;
    }
    box.style.height = items.length * RH + "px";
    box.style.position = "relative";
    TT.vt = true;
    paintWin();
  }
  function paintWin() {
    var box = $("#ttList"), sc = $("#v-tasks"), items = TT.items;
    if (!box || !sc || !TT.vt || !items) return;
    var top = sc.scrollTop - box.offsetTop, a = Math.max(0, Math.floor(top / RH) - 6), b = Math.min(items.length, Math.ceil((top + sc.clientHeight) / RH) + 6);
    box.innerHTML = '<div class="tt-win" style="transform:translateY(' + a * RH + 'px)">' + items.slice(a, b).map(rowHtml).join("") + "</div>";
  }
  function openCard(id) {
    var sh = C.openSheet(C.sheetHead(T("tt_task")) + '<div class="col tt-cardbody"></div><div class="tt-comp" id="ttFoot"></div>', { full: true, onClose: function() {
      TT.card = null;
    } });
    TT.card = { sh, id };
    drawCard(true);
    fetchTaskEvents(id).then(function() {
      drawCard();
    });
    return sh;
  }
  function cardMain(id) {
    var raw = TT.tasks.get(id);
    if (!raw) return '<p class="muted">' + E(T("tt_gone")) + "</p>";
    var t = eff(raw), gone = !!(t.deleted || raw._gone), q = !!(raw._pend || raw._edit), over = isOver(t), p = t.priority | 0, h;
    h = '<h3 class="tt-ct">' + E(t.title) + '</h3><div class="tt-chips">' + stChip(t.status) + (p ? '<span class="tt-pc p' + p + '">' + E(T("tt_p" + p)) + "</span>" : "") + (q ? '<span class="tt-q">' + E(T("tt_queued")) + "</span>" : "") + "</div>";
    if (gone) h += '<p class="note tt-warn" role="alert">' + E(T("tt_gone")) + "</p>";
    if (raw._pend && raw._fail) h += '<div class="note tt-warn" role="alert"><p>' + E(T("tt_notsent", { e: errText(raw._fail) })) + '</p><div class="row2"><button type="button" class="btn ghost" data-tm="retry" data-k="task" data-id="' + E(id) + '">' + E(T("tt_retry")) + '</button><button type="button" class="btn danger" data-tm="drop" data-k="task" data-id="' + E(id) + '">' + E(T("tt_drop")) + "</button></div></div>";
    if (raw._rej) h += '<div class="note tt-warn" role="alert"><p>' + E(T("tt_notsent", { e: errText(raw._rej.code) })) + "</p>" + failBtns("rej", id) + "</div>";
    var dn = deptName(deptOf(t.assignee_id));
    h += '<dl class="tt-facts"><dt>' + E(T("tt_by")) + "</dt><dd>" + E(pname(t.created_by)) + " \xB7 " + E(dt(ms(t.created_at))) + "</dd><dt>" + E(T("tt_who")) + "</dt><dd>" + E(pname(t.assignee_id)) + (dn ? " \xB7 " + E(dn) : "") + "</dd>" + (t.due_date ? "<dt>" + E(T("tt_f_due")) + '</dt><dd class="' + (over ? "red" : "") + '">' + E(dfull(t.due_date)) + (over ? " \xB7 " + E(T("tt_late")) : "") + "</dd>" : "") + "</dl>";
    if (t.body) h += '<p class="tt-body">' + E(t.body) + "</p>";
    if (t.status === "stuck" && t.stuck_reason) h += '<p class="note tt-stuck">' + E(T("tt_reason", { r: t.stuck_reason })) + "</p>";
    if (!gone && canStatus(t) && t.status !== "cancelled") {
      h += '<div class="tt-sbtns" role="group" aria-label="' + E(T("tt_status")) + '">' + [["in_progress", "tt_b_prog"], ["done", "tt_b_done"], ["stuck", "tt_b_stuck"]].map(function(x) {
        return '<button type="button" class="btn tt-sb tt-sb-' + x[0] + (t.status === x[0] ? " on" : "") + '" data-tm="st" data-st="' + x[0] + '" aria-pressed="' + (t.status === x[0]) + '">' + (t.status === x[0] ? ico("check") : "") + E(T(x[1])) + "</button>";
      }).join("") + "</div>";
    }
    if (!gone && canManage(t)) h += '<div class="tt-mng"><button type="button" class="btn ghost small" data-tm="edit" data-id="' + E(id) + '">' + E(T("tt_edit")) + '</button><button type="button" class="btn ghost small" data-tm="' + (t.status === "cancelled" ? "restore" : "cancel") + '" data-id="' + E(id) + '">' + E(T(t.status === "cancelled" ? "tt_restore" : "tt_cancel")) + '</button><button type="button" class="btn danger small" data-tm="del" data-id="' + E(id) + '">' + E(T("tt_del")) + "</button></div>";
    var fl = filesOf(id).sort(function(a, b) {
      return ms(a.occurred_at) - ms(b.occurred_at);
    });
    var ph = fl.filter(function(e) {
      return e.kind === "photo";
    }), fi = fl.filter(function(e) {
      return e.kind === "file";
    });
    if (ph.length) h += '<h4 class="tt-h">' + E(T("tt_photos")) + '</h4><div class="tt-grid">' + ph.map(phHtml).join("") + "</div>";
    if (fi.length) h += '<h4 class="tt-h">' + E(T("tt_files")) + '</h4><div class="col">' + fi.map(function(e) {
      return '<button type="button" class="btn ghost left tt-fl" data-tm="viewph" data-id="' + E(e.id) + '">' + ico("file") + "<span>" + E(e.file_name || T("tt_file")) + "</span><small>" + E(fmtSize(e.file_size)) + "</small>" + fileState(e) + "</button>" + (stuckFile(e) && e.actor_id === uid() ? failBtns("ev", e.id) : "");
    }).join("") + "</div>";
    h += '<h4 class="tt-h">' + E(T("tt_log")) + '</h4><ul class="tt-log">' + logHtml(id, raw) + "</ul>";
    return h;
  }
  function fmtSize(n) {
    n = n | 0;
    return n >= 1048576 ? (n / 1048576).toFixed(1) + " " + T("tt_mb") : Math.max(1, Math.round(n / 1024)) + " " + T("tt_kb");
  }
  function fileState(e) {
    if (e._fail) return '<span class="tt-q red">' + E(T("tt_notsent", { e: errText(e._fail.indexOf("http") === 0 ? "err" : e._fail) })) + "</span>";
    if (e.purged_at) return '<span class="tt-q">' + E(T("tt_purged")) + "</span>";
    if (e._pend || !e.uploaded) return '<span class="tt-q">' + E(T(e.actor_id === uid() ? "tt_queued" : "tt_loading_file")) + "</span>";
    return "";
  }
  function phHtml(e) {
    var tile = '<button type="button" class="tt-ph" data-tm="viewph" data-id="' + E(e.id) + '" aria-label="' + E(T("tt_photo")) + '">' + (okThumb(e.thumb) ? '<img src="' + E(e.thumb) + '" alt="' + E(T("tt_photo")) + '" width="96" height="96" loading="lazy">' : ico("cam")) + fileState(e) + "</button>";
    return stuckFile(e) && e.actor_id === uid() ? '<div class="tt-phw">' + tile + failBtns("ev", e.id) + "</div>" : tile;
  }
  function logHtml(id, raw) {
    var rows = evs(id).map(function(e) {
      return evHtml(e);
    }).join("");
    var ed = raw && raw._edit && raw._edit.status ? '<li class="tt-ev pend"><span class="tt-et">' + E(T("tt_you")) + " \xB7 " + E(hm(Date.now())) + '</span><span class="tt-etx">' + E(T("tt_k_status", { a: T("tt_s_" + raw.status), b: T("tt_s_" + raw._edit.status) })) + '</span><span class="tt-q">' + E(T("tt_queued")) + "</span></li>" : "";
    return rows + ed || '<li class="muted">' + E(T("tt_log_empty")) + "</li>";
  }
  function evHtml(e) {
    var when = ms(e.occurred_at), sent = ms(e.created_at), who = e.actor_id === uid() ? T("tt_you") : pname(e.actor_id), tx = "", extra = "";
    if (e.kind === "status") tx = T("tt_k_status", { a: e.old_status ? T("tt_s_" + e.old_status) : "\u2014", b: e.new_status ? T("tt_s_" + e.new_status) : "\u2014" }) + (e.body ? " \u2014 " + e.body : "");
    else if (e.kind === "comment") tx = e.body;
    else if (e.kind === "photo" || e.kind === "file") tx = T("tt_k_" + e.kind) + (e.file_name ? ": " + e.file_name : "");
    else tx = T("tt_k_" + e.kind) + (e.body ? ": " + e.body : "");
    if (e._pend) extra = '<span class="tt-q">' + E(T("tt_queued")) + "</span>";
    if (e._fail && e.kind === "comment") extra = '<span class="tt-q red">' + E(T("tt_notsent", { e: errText(e._fail) })) + '</span> <button type="button" class="btn ghost small" data-tm="retry" data-k="ev" data-id="' + E(e.id) + '">' + E(T("tt_retry")) + '</button> <button type="button" class="btn danger small" data-tm="drop" data-k="ev" data-id="' + E(e.id) + '">' + E(T("tt_drop")) + "</button>";
    else if (!e._pend && sent - when > 6e5 && e.kind !== "created") extra = '<span class="tt-late">' + E(T("tt_late_sent", { a: hm(when), b: hm(sent) })) + "</span>";
    var del_ = e.actor_id === uid() && !e._pend && (e.kind === "comment" || e.kind === "photo" || e.kind === "file") && Date.now() - sent < 864e5 ? ' <button type="button" class="tt-x" data-tm="drop" data-k="ev" data-id="' + E(e.id) + '" aria-label="' + E(T("tt_del")) + '">' + ico("x") + "</button>" : "";
    return '<li class="tt-ev k-' + E(e.kind) + (e._pend ? " pend" : "") + '"><span class="tt-et">' + E(who) + " \xB7 " + E(dt(when)) + '</span><span class="tt-etx">' + E(tx) + "</span>" + extra + del_ + "</li>";
  }
  function drawCard(first) {
    var c = TT.card;
    if (!c || !c.sh.isConnected) return;
    var bd = $(".tt-cardbody", c.sh), ft = $("#ttFoot", c.sh);
    if (!bd) return;
    var sc = bd.scrollTop;
    bd.innerHTML = cardMain(c.id);
    bd.scrollTop = sc;
    var raw = TT.tasks.get(c.id), gone = !raw || raw.deleted || raw._gone || raw._edit && raw._edit.deleted;
    if (first || !ft.firstChild) {
      ft.innerHTML = '<p class="tt-up" id="ttUp" role="status" hidden></p><textarea id="ttCm" class="inp tt-in" rows="2" maxlength="2000" placeholder="' + E(T("tt_cm_ph")) + '" aria-label="' + E(T("tt_cm_ph")) + '"></textarea><div class="tt-cbtns"><button type="button" class="btn ghost" data-tm="photo">' + ico("cam") + "<span>" + E(T("tt_photo")) + '</span></button><button type="button" class="btn ghost" data-tm="photohd" aria-label="' + E(T("tt_photo_hd_h")) + '" title="' + E(T("tt_photo_hd_h")) + '">' + ico("cam") + "<span>" + E(T("tt_photo_hd")) + '</span></button><button type="button" class="btn ghost" data-tm="attach">' + ico("clip") + "<span>" + E(T("tt_file")) + '</span></button><button type="button" class="btn primary tt-send" data-tm="comment">' + ico("send") + "<span>" + E(T("tt_send")) + "</span></button></div>";
    }
    ft.hidden = !!gone;
    var up = $("#ttUp", c.sh);
    if (up) {
      up.hidden = !TT.up;
      if (TT.up) up.textContent = T("tt_uploading", { n: TT.up.n, m: TT.up.m });
    }
  }
  function stuckDialog(id) {
    var sh = C.openSheet(C.sheetHead(T("tt_stuck_title")) + '<div class="col"><label class="tt-l" for="ttRs">' + E(T("tt_stuck_why")) + '</label><textarea id="ttRs" class="inp tt-in" rows="4" maxlength="500" aria-describedby="ttRsH"></textarea><p class="muted small" id="ttRsH">' + E(T("tt_stuck_hint")) + '</p><button type="button" class="btn primary wide" id="ttRsOk" disabled>' + E(T("tt_save")) + "</button></div>");
    var ta = $("#ttRs", sh), ok = $("#ttRsOk", sh);
    ta.oninput = function() {
      ok.disabled = ta.value.trim().length < 3;
    };
    ok.onclick = async function() {
      var r = ta.value.trim();
      if (r.length < 3) return;
      ok.disabled = true;
      await C.closeTop();
      await setStatus(id, "stuck", r);
    };
    setTimeout(function() {
      ta.focus();
    }, 60);
  }
  function openTaskForm(editId) {
    var raw = editId ? TT.tasks.get(editId) : null, t = raw ? eff(raw) : null, asg = assignable(), multi = !t && asg.length > 1;
    var who = "";
    if (multi) {
      who = '<fieldset class="tt-who-fs"><legend class="tt-l">' + E(T("tt_f_who")) + '</legend><div class="tt-whol">' + asg.map(function(m) {
        var dn = deptName(m.department_id);
        return '<label class="tt-chk"><input type="checkbox" name="ttA" value="' + E(m.user_id) + '"' + (m.user_id === uid() ? " checked" : "") + "><span>" + E(pname(m.user_id)) + (m.user_id === uid() ? " (" + E(T("tt_you")) + ")" : "") + (dn ? "<small> \xB7 " + E(dn) + "</small>" : "") + "</span></label>";
      }).join("") + "</div></fieldset>";
    } else if (t) {
      var opts = asg.slice();
      if (!opts.some(function(m) {
        return m.user_id === t.assignee_id;
      }) && members().get(t.assignee_id)) opts.push(members().get(t.assignee_id));
      who = lab("ttW", "tt_f_who", '<select class="inp tt-in" id="ttW">' + opts.map(function(m) {
        return '<option value="' + E(m.user_id) + '"' + (m.user_id === t.assignee_id ? " selected" : "") + ">" + E(pname(m.user_id)) + "</option>";
      }).join("") + "</select>");
    } else who = '<p class="muted small">' + E(T("tt_self_only")) + "</p>";
    var pr = t ? t.priority | 0 : 0;
    var html = C.sheetHead(T(t ? "tt_edit" : "tt_new")) + '<div class="form tt-f">' + lab("ttT", "tt_f_title", '<input class="inp tt-in" id="ttT" maxlength="200" autocomplete="off" value="' + E(t ? t.title : "") + '">') + lab("ttB", "tt_f_body", '<textarea class="inp tt-in" id="ttB" rows="4" maxlength="4000">' + E(t ? t.body : "") + "</textarea>") + who + lab("ttD", "tt_f_due", '<input class="inp tt-in" id="ttD" type="date" value="' + E(t && t.due_date ? t.due_date : "") + '">') + lab("ttP", "tt_f_pri", '<select class="inp tt-in" id="ttP">' + [0, 1, 2].map(function(n) {
      return '<option value="' + n + '"' + (pr === n ? " selected" : "") + ">" + E(T("tt_pf" + n)) + "</option>";
    }).join("") + "</select>") + '</div><div class="shfoot"><button type="button" class="btn ghost" data-act="close">' + E(T("cancel")) + '</button><button type="button" class="btn primary" id="ttSave">' + E(T(t ? "tt_save" : "tt_create")) + "</button></div>";
    var sh = C.openSheet(html, { full: true, form: true, save: "#ttSave" });
    $("#ttSave", sh).onclick = async function() {
      var inp = $("#ttT", sh), title = inp.value.trim();
      if (!title) {
        C.fieldErr(inp, T("tt_e_title"));
        return;
      }
      var f = { title, body: $("#ttB", sh).value.trim(), due: $("#ttD", sh).value || null, priority: +$("#ttP", sh).value | 0 };
      if (!t) {
        var sel = multi ? $$("input[name=ttA]:checked", sh).map(function(x) {
          return x.value;
        }) : [uid()];
        if (!sel.length) {
          C.toast(T("tt_e_nobody"));
          return;
        }
        f.assignees = sel;
        $("#ttSave", sh).disabled = true;
        await createTasks(f);
        await C.closeTop();
        C.toast(T("tt_created", { n: sel.length }));
        if (C.S.tab === "tasks" && TT.view === "tasks") drawList();
      } else {
        var wsel = $("#ttW", sh);
        $("#ttSave", sh).disabled = true;
        await patchTask(editId, { title: f.title, body: f.body, due_date: f.due, priority: f.priority, assignee_id: wsel ? wsel.value : t.assignee_id });
        await C.closeTop();
      }
    };
    setTimeout(function() {
      var i = $("#ttT", sh);
      if (i && !i.value) i.focus();
    }, 80);
    return sh;
  }
  var DOW_KEYS = ["tt_dow1", "tt_dow2", "tt_dow3", "tt_dow4", "tt_dow5", "tt_dow6", "tt_dow7"];
  async function viewReport() {
    var box = $("#ttBody");
    if (!box) return;
    var date = TT.rep.date || todayTk();
    TT.rep.date = date;
    box.innerHTML = '<p class="muted pad">' + E(T("loading")) + "</p>";
    var draft = await metaGet("draft:" + date), row = TT.reports.get(repKey(date));
    if (TT.view !== "report" || $("#ttBody") !== box || TT.rep.date !== date) return;
    var f;
    if (draft) f = { done: pStr(draft.done), how: pStr(draft.how), tomorrow: pStr(draft.tomorrow), help: pStr(draft.help), task_ids: draft.task_ids || [] };
    else if (row) f = { done: row.done_text, how: row.how_text, tomorrow: row.tomorrow_text, help: row.help_text, task_ids: row.task_ids || [] };
    else f = { done: "", how: "", tomorrow: "", help: "", task_ids: [] };
    TT.rep.f = f;
    paintReport();
  }
  function dayTasks(date) {
    var out = [];
    TT.tasks.forEach(function(raw) {
      var t = eff(raw);
      if (t.deleted || t.assignee_id !== uid()) return;
      var at = ms(t.status_at || "");
      if (!at || tkDay(at) !== date) return;
      if (t.status === "done" || t.status === "in_progress" || t.status === "stuck") out.push(t);
    });
    out.sort(function(a, b) {
      return (a.status === "done" ? 0 : 1) - (b.status === "done" ? 0 : 1) || ms(b.status_at) - ms(a.status_at);
    });
    return out.slice(0, 12);
  }
  function repBannerHtml(date) {
    var row = TT.reports.get(repKey(date)), work = isWorkday(date);
    if (row && row._fail) return '<div class="note tt-warn" role="alert"><p>' + E(T("tt_notsent", { e: errText(row._fail) })) + "</p>" + failBtns("rep", row.k) + "</div>";
    if (row && row._pend) return '<p class="note" role="status">' + E(T("tt_rep_pending")) + "</p>";
    if (row && row.status === "submitted") return '<p class="note tt-ok" role="status">' + ico("check") + E(T("tt_rep_done", { t: row.submitted_at ? hm(ms(row.submitted_at)) : "" })) + (row.is_late ? " \xB7 " + E(T("tt_rep_late")) : "") + "</p>";
    if (!work) return '<p class="note" role="status">' + E(T("tt_rep_dayoff")) + "</p>";
    if (!reportRequired()) return '<p class="note" role="status">' + E(T("tt_rep_optional")) + "</p>";
    return '<p class="note tt-warn" role="status">' + E(T("tt_rep_none")) + "</p>";
  }
  function repBanner() {
    var b = $("#ttRepSt");
    if (b) b.innerHTML = repBannerHtml(TT.rep.date);
  }
  function paintReport() {
    var box = $("#ttBody");
    if (!box) return;
    var date = TT.rep.date, td = todayTk(), f = TT.rep.f, row = TT.reports.get(repKey(date)), edit = canEditReport(date), sub = row && row.status === "submitted";
    var chipsT = edit ? dayTasks(date) : [];
    var wd = wdList(), rt = String(TT.prefs && TT.prefs.report_time || TT.settings && TT.settings.report_time || "18:00").slice(0, 5);
    var hist = [];
    TT.reports.forEach(function(r) {
      if (r.user_id === uid() && r.status === "submitted") hist.push(r);
    });
    hist.sort(function(a, b) {
      return a.report_date < b.report_date ? 1 : -1;
    });
    var dates = [td, addDay(td, -1)];
    var fld = function(id, key, val) {
      return lab(id, key, '<textarea class="inp tt-in" id="' + id + '" rows="3" maxlength="4000"' + (edit ? "" : " readonly") + ">" + E(val) + "</textarea>");
    };
    box.innerHTML = '<div class="tt-rep"><div class="tt-days" role="group" aria-label="' + E(T("tt_rep_date")) + '">' + dates.map(function(d) {
      return '<button type="button" data-tm="repdate" data-d="' + E(d) + '" aria-pressed="' + (d === date) + '">' + E(T(d === td ? "tt_today" : "tt_yesterday")) + " \xB7 " + E(dmy(d)) + "</button>";
    }).join("") + (dates.indexOf(date) < 0 ? '<button type="button" aria-pressed="true">' + E(dfull(date)) + "</button>" : "") + '</div><div id="ttRepSt">' + repBannerHtml(date) + "</div>" + (chipsT.length ? '<p class="tt-l">' + E(T("tt_rep_chips")) + '</p><div class="tt-chipsrow">' + chipsT.map(function(t) {
      return '<button type="button" class="tt-tchip" data-tm="repchip" data-id="' + E(t.id) + '">' + (t.status === "done" ? ico("check") : "") + E(t.title.length > 40 ? t.title.slice(0, 38) + "\u2026" : t.title) + "</button>";
    }).join("") + "</div>" : "") + '<form id="ttRepForm" class="tt-f" novalidate>' + fld("ttRd", "tt_rep_done_l", f.done) + fld("ttRh", "tt_rep_how_l", f.how) + fld("ttRt", "tt_rep_tom_l", f.tomorrow) + fld("ttRp", "tt_rep_help_l", f.help) + (edit ? '<button type="submit" class="btn primary wide" id="ttRepGo">' + E(T(sub ? "tt_rep_save" : "tt_rep_go")) + "</button>" : '<p class="muted small">' + E(T("tt_rep_closed")) + "</p>") + '</form><details class="tt-wd"' + (TT.rep.wdOpen ? " open" : "") + "><summary>" + E(T("tt_wd_title")) + '</summary><p class="muted small">' + E(T("tt_wd_hint")) + '</p><div class="tt-days" id="ttWd" role="group" aria-label="' + E(T("tt_wd_title")) + '">' + DOW_KEYS.map(function(k, i) {
      return '<button type="button" data-tm="wd" data-n="' + (i + 1) + '" aria-pressed="' + (wd.indexOf(i + 1) >= 0) + '">' + E(T(k)) + "</button>";
    }).join("") + "</div>" + lab("ttRT", "tt_wd_time", '<input class="inp tt-in" id="ttRT" type="time" value="' + E(rt) + '">') + '<div class="row2"><button type="button" class="btn ghost" data-tm="wdreset">' + E(T("tt_wd_reset")) + '</button><button type="button" class="btn primary" data-tm="wdsave">' + E(T("tt_save")) + "</button></div></details>" + (hist.length ? '<h4 class="tt-h">' + E(T("tt_rep_hist")) + '</h4><div class="col">' + hist.slice(0, 30).map(function(r) {
      return '<button type="button" class="btn ghost left" data-tm="repdate" data-d="' + E(r.report_date) + '">' + ico("doc") + "<span>" + E(dfull(r.report_date)) + "</span>" + (r.is_late ? "<small>" + E(T("tt_rep_late")) + "</small>" : "") + "</button>";
    }).join("") + "</div>" : "") + "</div>";
    var form = $("#ttRepForm");
    if (form) form.onsubmit = function(ev) {
      ev.preventDefault();
      repSubmit();
    };
  }
  function repRead() {
    var g = function(id) {
      var el = $("#" + id);
      return el ? el.value : "";
    };
    var f = TT.rep.f || {};
    TT.rep.f = { done: g("ttRd"), how: g("ttRh"), tomorrow: g("ttRt"), help: g("ttRp"), task_ids: f.task_ids || [] };
    return TT.rep.f;
  }
  function repDraftSoon() {
    clearTimeout(TT.rep.t);
    TT.rep.t = setTimeout(function() {
      var f = repRead();
      saveDraft(TT.rep.date, f);
    }, 2e3);
  }
  function repFlush() {
    if (TT.rep.t && $("#ttRd")) {
      clearTimeout(TT.rep.t);
      TT.rep.t = 0;
      saveDraft(TT.rep.date, repRead());
    }
  }
  async function repSubmit() {
    var f = repRead();
    if (f.done.trim().length < 3) {
      C.fieldErr($("#ttRd"), T("tt_e_rep_done"));
      return;
    }
    clearTimeout(TT.rep.t);
    TT.rep.t = 0;
    var go = $("#ttRepGo");
    if (go) go.disabled = true;
    await submitReport(TT.rep.date, f);
    paintReport();
  }
  async function wdSave(reset2) {
    if (navigator.onLine === false) {
      C.toast(T("tt_need_net"));
      return;
    }
    var days = $$("#ttWd button[aria-pressed=true]").map(function(b) {
      return +b.dataset.n;
    }), rt = ($("#ttRT") || {}).value || "";
    if (!reset2 && !days.length) {
      C.toast(T("tt_e_wd"));
      return;
    }
    try {
      var a = { p_user: uid() };
      if (reset2) a.p_reset_schedule = true;
      else {
        a.p_work_days = days;
        if (/^\d\d:\d\d$/.test(rt)) a.p_report_time = rt;
      }
      await C.rpc("crm_team_prefs_save", a);
      await pullMeta();
      TT.rep.wdOpen = true;
      C.toast(T("tt_saved"));
      paintReport();
    } catch (e) {
      C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
    }
  }
  async function loadBoard(day, force) {
    if (!force && TT.board && TT.board.day === day && Date.now() - TT.board.reqAt < 3e3) return;
    try {
      var d = await C.rpc("crm_team_board", { p_day: day });
      TT.board = { day, data: d, at: Date.now(), reqAt: Date.now(), live: true };
      TT.boardErr = "";
      metaSet("board", { day, data: d, at: TT.board.at });
    } catch (e) {
      var c = TT.boardCache;
      TT.boardErr = isNet(e) ? "" : errText(errCode(e));
      if (c && c.day === day) TT.board = { day, data: c.data, at: c.at, reqAt: Date.now(), live: false };
      else if (!TT.board || TT.board.day !== day) TT.board = null;
    }
  }
  async function viewTeam() {
    var box = $("#ttBody");
    if (!box) return;
    var day = TT.boardDay || todayTk();
    TT.boardDay = day;
    box.innerHTML = '<p class="muted pad">' + E(T("loading")) + "</p>";
    await loadBoard(day, true);
    if (TT.view !== "team" || $("#ttBody") !== box) return;
    paintTeam();
  }
  function repState(p) {
    return p.report_status || "none";
  }
  function paintTeam() {
    var box = $("#ttBody");
    if (!box) return;
    var day = TT.boardDay || todayTk(), td = todayTk();
    var head = '<div class="tt-days" role="group" aria-label="' + E(T("tt_rep_date")) + '">' + [td, addDay(td, -1)].map(function(d2) {
      return '<button type="button" data-tm="bday" data-d="' + E(d2) + '" aria-pressed="' + (d2 === day) + '">' + E(T(d2 === td ? "tt_today" : "tt_yesterday")) + " \xB7 " + E(dmy(d2)) + "</button>";
    }).join("") + '<input class="inp tt-in tt-date" type="date" id="ttBd" value="' + E(day) + '" max="' + E(td) + '" aria-label="' + E(T("tt_rep_date")) + '"></div>';
    if (!TT.board || !TT.board.data) {
      box.innerHTML = head + '<p class="note tt-warn" role="alert">' + E(TT.boardErr || T("tt_board_none")) + "</p>";
      return;
    }
    var d = TT.board.data, tl = d.tiles || {}, people = d.people || [];
    var missing = people.filter(function(p) {
      return p.report_required && p.workday !== false && (repState(p) === "none" || repState(p) === "draft");
    });
    var tile = function(cls, n, key) {
      return '<div class="tt-tile ' + cls + '"><b>' + E(String(n == null ? 0 : n)) + "</b><span>" + E(T(key)) + "</span></div>";
    };
    var st = d.storage;
    box.innerHTML = head + '<p class="muted small tt-asof" role="status">' + E(T(TT.board.live ? "tt_asof" : "tt_asof_cache", { t: hm(TT.board.at) })) + (d.scope === "department" ? " \xB7 " + E(T("tt_scope_dept")) : "") + '</p><div class="tt-tiles">' + tile("ok", tl.done_day, "tt_t_done") + tile("", tl.in_progress, "tt_t_prog") + tile(tl.stuck ? "bad" : "", tl.stuck, "tt_t_stuck") + tile(tl.overdue ? "warn" : "", tl.overdue, "tt_t_over") + '<div class="tt-tile wide"><b>' + E(String(tl.reports_submitted || 0)) + " / " + E(String(tl.reports_required || 0)) + "</b><span>" + E(T("tt_t_rep")) + "</span></div></div>" + (st && st.percent != null ? '<p class="note' + (st.percent >= 70 ? " tt-warn" : "") + '">' + E(T("tt_storage", { p: Math.round(st.percent) })) + (st.percent >= 90 ? " \xB7 " + E(T("tt_storage_full")) : "") + "</p>" : "") + '<div class="tt-acts"><button type="button" class="btn ghost" data-tm="missing">' + ico("doc") + "<span>" + E(T("tt_missing", { n: missing.length })) + '</span></button><button type="button" class="btn ghost" data-tm="feed">' + ico("clock") + "<span>" + E(T("tt_feed")) + "</span></button>" + (isLead() ? '<button type="button" class="btn ghost" data-tm="depts">' + ico("team") + "<span>" + E(T("tt_depts")) + '</span></button><button type="button" class="btn ghost" data-tm="settings">' + ico("clock") + "<span>" + E(T("tt_settings_s")) + "</span></button>" : "") + '</div><div class="tt-people" role="list">' + (people.length ? people.map(personRow).join("") : '<p class="muted pad">' + E(T("tt_no_people")) + "</p>") + "</div>";
  }
  function personRow(p) {
    var rs = repState(p), nm = p.name || pname(p.user_id), la = p.last_activity ? hm(ms(p.last_activity)) : "";
    var num = function(cls, n, key) {
      return n ? '<span class="tt-n ' + cls + '">' + E(T(key)) + " " + n + "</span>" : "";
    };
    return '<button type="button" class="tt-prow" role="listitem" data-tm="person" data-id="' + E(p.user_id) + '"><span class="tt-pn"><b>' + E(nm) + "</b><small>" + E(p.department || "") + '</small></span><span class="tt-pnums">' + num("stuck", p.stuck, "tt_t_stuck") + num("over", p.overdue, "tt_t_over") + '<span class="tt-n">' + E(T("tt_t_prog")) + " " + (p.in_progress | 0) + '</span><span class="tt-n ok">' + E(T("tt_t_done")) + " " + (p.done_day | 0) + '</span></span><span class="tt-prs"><span class="tt-rst r-' + E(rs) + '">' + E(T("tt_rs_" + rs)) + "</span><small>" + E(la ? T("tt_last", { t: la }) : T("tt_no_act")) + "</small></span></button>";
  }
  async function openPerson(id) {
    var sh = C.openSheet(C.sheetHead(pname(id)) + '<div class="col tt-pbody" id="ttPb"></div>', { full: true, onClose: function() {
      TT.person = null;
    } });
    TT.person = { sh, id, day: TT.boardDay || todayTk(), rep: null, feed: null, prefs: null, loaded: false };
    drawPerson();
    var day = TT.person.day, pr = TT.person;
    var r = await Promise.all([
      C.api("GET", "crm_daily_reports?select=*&user_id=eq." + encodeURIComponent(id) + "&report_date=eq." + day).catch(function() {
        return null;
      }),
      C.rpc("crm_team_feed", { p_day: day, p_limit: 100 }).catch(function() {
        return null;
      }),
      C.api("GET", "crm_team_prefs?select=*&user_id=eq." + encodeURIComponent(id)).catch(function() {
        return null;
      })
    ]);
    if (TT.person !== pr) return;
    pr.rep = r[0] ? r[0][0] || false : null;
    pr.feed = (r[1] || []).filter(function(e) {
      return e.actor_id === id;
    });
    pr.prefs = r[2] ? r[2][0] || false : null;
    pr.loaded = true;
    drawPerson();
  }
  function drawPerson() {
    var pr = TT.person;
    if (!pr || !pr.sh.isConnected) return;
    var box = $("#ttPb", pr.sh);
    if (!box) return;
    var p = null, id = pr.id;
    if (TT.board && TT.board.data) (TT.board.data.people || []).forEach(function(x) {
      if (x.user_id === id) p = x;
    });
    var m = members().get(id) || {}, dn = deptName(m.department_id), req = pr.prefs ? pr.prefs.report_required !== false : p ? p.report_required !== false : true, only = !!(pr.prefs && pr.prefs.tasks_only);
    var tasks = [];
    TT.tasks.forEach(function(raw) {
      var t = eff(raw);
      if (t.deleted || t.assignee_id !== id) return;
      if (isOpen(t) || t.status === "done" && tkDay(ms(t.status_at || t.updated_at)) === pr.day) tasks.push(t);
    });
    tasks.sort(function(a, b) {
      var d = (isOver(b) ? 1 : 0) - (isOver(a) ? 1 : 0);
      if (d) return d;
      var x = a.due_date || "9", y = b.due_date || "9";
      return x < y ? -1 : x > y ? 1 : 0;
    });
    var h = '<p class="tt-psub">' + E(dn || T("tt_no_dept")) + (m.role ? " \xB7 " + E(T("role_" + m.role)) : "") + "</p>";
    if (p) h += '<div class="tt-tiles s4">' + [["", p.in_progress, "tt_t_prog"], [p.stuck ? "bad" : "", p.stuck, "tt_t_stuck"], [p.overdue ? "warn" : "", p.overdue, "tt_t_over"], ["ok", p.done_day, "tt_t_done"]].map(function(x) {
      return '<div class="tt-tile ' + x[0] + '"><b>' + (x[1] | 0) + "</b><span>" + E(T(x[2])) + "</span></div>";
    }).join("") + "</div>";
    h += '<h4 class="tt-h">' + E(T("tt_v_report")) + " \xB7 " + E(dfull(pr.day)) + "</h4>";
    if (!pr.loaded) h += '<p class="muted">' + E(T("loading")) + "</p>";
    else if (!pr.rep) h += '<p class="note tt-warn">' + E(T("tt_rep_none")) + "</p>";
    else h += '<dl class="tt-rdl"><dt>' + E(T("tt_rep_done_l")) + "</dt><dd>" + E(pr.rep.done_text) + "</dd><dt>" + E(T("tt_rep_how_l")) + "</dt><dd>" + E(pr.rep.how_text) + "</dd><dt>" + E(T("tt_rep_tom_l")) + "</dt><dd>" + E(pr.rep.tomorrow_text) + "</dd><dt>" + E(T("tt_rep_help_l")) + "</dt><dd>" + E(pr.rep.help_text) + '</dd></dl><p class="muted small">' + E(T("tt_rep_done", { t: pr.rep.submitted_at ? hm(ms(pr.rep.submitted_at)) : "" })) + (pr.rep.is_late ? " \xB7 " + E(T("tt_rep_late")) : "") + "</p>";
    h += '<div class="tt-acts"><button type="button" class="btn primary" data-tm="remind" data-id="' + E(id) + '">' + ico("bell") + "<span>" + E(T("tt_remind")) + "</span></button></div>" + (p ? '<p class="muted small">' + E(T(p.tg_connected ? "tt_tg_on" : "tt_tg_off")) + "</p>" : "");
    h += '<h4 class="tt-h">' + E(T("tt_tasks_h")) + " (" + tasks.length + ")</h4>" + (tasks.length ? '<div class="tt-plist">' + tasks.slice(0, 60).map(rowHtml).join("") + "</div>" : '<p class="muted">' + E(T("tt_empty_open")) + "</p>");
    h += '<h4 class="tt-h">' + E(T("tt_feed")) + " \xB7 " + E(dfull(pr.day)) + "</h4>" + (!pr.loaded ? "" : pr.feed && pr.feed.length ? '<ul class="tt-log">' + pr.feed.map(function(e) {
      return feedItem(e, true);
    }).join("") + "</ul>" : '<p class="muted">' + E(T("tt_log_empty")) + "</p>");
    h += '<h4 class="tt-h">' + E(T("tt_pset")) + '</h4><label class="tt-chk"><input type="checkbox" data-tm-in="reqd" data-id="' + E(id) + '"' + (req ? " checked" : "") + "><span>" + E(T("tt_pset_req")) + '</span></label><label class="tt-chk"><input type="checkbox" data-tm-in="only" data-id="' + E(id) + '"' + (only ? " checked" : "") + "><span>" + E(T("tt_pset_only")) + "</span></label>";
    if (isOwner()) h += lab("ttPd", "tt_pset_dept", '<select class="inp tt-in" id="ttPd" data-tm-in="dept" data-id="' + E(id) + '"><option value="">' + E(T("tt_no_dept")) + "</option>" + liveDepts().map(function(d) {
      return '<option value="' + E(d.id) + '"' + (d.id === m.department_id ? " selected" : "") + ">" + E(d.name) + "</option>";
    }).join("") + "</select>");
    var sc = box.scrollTop;
    box.innerHTML = h;
    box.scrollTop = sc;
  }
  function feedItem(e, noWho) {
    var when = ms(e.occurred_at), sent = ms(e.created_at), tx;
    if (e.kind === "status") tx = T("tt_k_status", { a: e.old_status ? T("tt_s_" + e.old_status) : "\u2014", b: e.new_status ? T("tt_s_" + e.new_status) : "\u2014" }) + (e.body ? " \u2014 " + e.body : "");
    else if (e.kind === "comment") tx = e.body;
    else tx = T("tt_k_" + e.kind) + (e.file_name ? ": " + e.file_name : "") + (e.kind !== "photo" && e.kind !== "file" && e.body ? ": " + e.body : "");
    var late = sent - when > 6e5 ? '<span class="tt-late">' + E(T("tt_late_sent", { a: hm(when), b: hm(sent) })) + "</span>" : "";
    return '<li class="tt-ev k-' + E(e.kind) + '"><span class="tt-et">' + E(hm(when)) + (noWho ? "" : " \xB7 " + E(e.actor_name || pname(e.actor_id))) + '</span><button type="button" class="tt-lnk" data-tm="open" data-id="' + E(e.task_id) + '">' + E(e.task_title || "") + '</button><span class="tt-etx">' + E(tx) + "</span>" + (okThumb(e.thumb) ? '<img class="tt-fthumb" src="' + E(e.thumb) + '" alt="' + E(T("tt_photo")) + '" width="64" height="64" loading="lazy">' : "") + late + "</li>";
  }
  function openMissing() {
    if (!TT.board || !TT.board.data) return;
    var people = (TT.board.data.people || []).filter(function(p) {
      return p.report_required && p.workday !== false && (repState(p) === "none" || repState(p) === "draft");
    });
    var sh = C.openSheet(C.sheetHead(T("tt_missing_h")) + '<div class="col">' + (people.length ? '<button type="button" class="btn primary" data-tm="remindall">' + ico("bell") + "<span>" + E(T("tt_remind_all")) + "</span></button>" + people.map(function(p) {
      return '<div class="tt-mrow"><span><b>' + E(p.name || pname(p.user_id)) + "</b><small>" + E(p.department || "") + (p.tg_connected ? "" : " \xB7 " + T("tt_tg_off")) + '</small></span><button type="button" class="btn ghost small" data-tm="remind" data-id="' + E(p.user_id) + '">' + E(T("tt_remind_one")) + "</button></div>";
    }).join("") : '<p class="muted">' + E(T("tt_missing_none")) + "</p>") + "</div>", { full: true });
    return sh;
  }
  async function remind(id) {
    try {
      var r = await C.rpc("crm_team_remind", { p_user: id });
      C.toast(T(r === "queued" ? "tt_rm_queued" : r === "throttled" ? "tt_rm_throttled" : "tt_rm_notg"));
    } catch (e) {
      C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
    }
  }
  async function remindAll() {
    try {
      var n = await C.rpc("crm_team_remind_missing", { p_day: TT.boardDay || todayTk() });
      C.toast(T("tt_rm_all", { n: n | 0 }));
    } catch (e) {
      C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
    }
  }
  async function openFeed() {
    var day = TT.boardDay || todayTk();
    var sh = C.openSheet(C.sheetHead(T("tt_feed") + " \xB7 " + dmy(day)) + '<div class="col"><ul class="tt-log" id="ttFeed"></ul><p class="muted" id="ttFeedSt">' + E(T("loading")) + '</p><button type="button" class="btn ghost" id="ttFeedMore" hidden>' + E(T("tt_more")) + "</button></div>", { full: true });
    var st = { before: null, beforeId: null, any: false };
    var load_ = async function() {
      var more = $("#ttFeedMore", sh), stt = $("#ttFeedSt", sh), ul = $("#ttFeed", sh);
      try {
        var a = { p_day: day, p_limit: 50 };
        if (st.before) {
          a.p_before = st.before;
          a.p_before_id = st.beforeId;
        }
        var rows = await C.rpc("crm_team_feed", a) || [];
        if (rows.length) {
          ul.insertAdjacentHTML("beforeend", rows.map(function(e) {
            return feedItem(e, false);
          }).join(""));
          st.any = true;
          var l = rows[rows.length - 1];
          st.before = l.occurred_at;
          st.beforeId = l.id;
        }
        stt.textContent = st.any ? "" : T("tt_log_empty");
        more.hidden = rows.length < 50;
      } catch (e) {
        stt.textContent = isNet(e) ? T("tt_need_net") : errText(errCode(e));
      }
    };
    $("#ttFeedMore", sh).onclick = load_;
    load_();
  }
  function memberOptions(sel, withNone) {
    return (withNone ? '<option value="">' + E(T("tt_no_head")) + "</option>" : "") + activeMembers().map(function(m) {
      return '<option value="' + E(m.user_id) + '"' + (m.user_id === sel ? " selected" : "") + ">" + E(pname(m.user_id)) + "</option>";
    }).join("");
  }
  function openDepts() {
    var sh = C.openSheet(C.sheetHead(T("tt_depts")) + '<div class="col" id="ttDp"></div>', { full: true, onClose: function() {
      TT.dp = null;
    } });
    TT.dp = sh;
    drawDepts();
    return sh;
  }
  function drawDepts() {
    var sh = TT.dp;
    if (!sh || !sh.isConnected) return;
    var own = isOwner(), ds = liveDepts(), cnt = {};
    members().forEach(function(m) {
      if (m.status === "active" && m.department_id) cnt[m.department_id] = (cnt[m.department_id] || 0) + 1;
    });
    var h = '<p class="muted small">' + E(T(own ? "tt_depts_hint" : "tt_depts_ro")) + "</p>";
    h += ds.map(function(d) {
      return '<div class="tt-dept"><div class="tt-dh"><b>' + E(d.name) + "</b><small>" + E(T("tt_dept_n", { n: cnt[d.id] || 0 })) + "</small></div>" + (own ? '<label class="tt-l" for="ttH' + E(d.id) + '">' + E(T("tt_head")) + '</label><select class="inp tt-in" id="ttH' + E(d.id) + '" data-tm-in="head" data-id="' + E(d.id) + '">' + memberOptions(d.head_id, true) + '</select><button type="button" class="btn danger small" data-tm="deptarch" data-id="' + E(d.id) + '">' + E(T("tt_dept_arch")) + "</button>" : '<p class="muted small">' + E(T("tt_head")) + ": " + E(d.head_id ? pname(d.head_id) : T("tt_no_head")) + "</p>") + "</div>";
    }).join("") || '<p class="muted">' + E(T("tt_no_depts")) + "</p>";
    if (own) {
      h += '<h4 class="tt-h">' + E(T("tt_dept_new")) + "</h4>" + lab("ttDn", "tt_dept_name", '<input class="inp tt-in" id="ttDn" maxlength="80" autocomplete="off">') + lab("ttDh", "tt_head", '<select class="inp tt-in" id="ttDh">' + memberOptions("", true) + "</select>") + '<button type="button" class="btn primary" data-tm="deptnew">' + ico("plus") + E(T("tt_dept_add")) + '</button><h4 class="tt-h">' + E(T("tt_people_dept")) + "</h4>" + activeMembers().map(function(m) {
        return '<div class="tt-mrow"><span><b>' + E(pname(m.user_id)) + '</b></span><select class="inp tt-in tt-sel" data-tm-in="mdept" data-id="' + E(m.user_id) + '" aria-label="' + E(pname(m.user_id)) + '"><option value="">' + E(T("tt_no_dept")) + "</option>" + ds.map(function(d) {
          return '<option value="' + E(d.id) + '"' + (d.id === m.department_id ? " selected" : "") + ">" + E(d.name) + "</option>";
        }).join("") + "</select></div>";
      }).join("");
    }
    var box = $("#ttDp", sh), sc = box ? box.scrollTop : 0;
    if (box) {
      box.innerHTML = h;
      box.scrollTop = sc;
    }
  }
  async function deptOp(fn) {
    try {
      await fn();
      await pullMeta();
      if (C.syncMembers) C.syncMembers();
      drawDepts();
      C.toast(T("tt_saved"));
    } catch (e) {
      C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
      drawDepts();
    }
  }
  function openSettings() {
    var s = TT.settings || {}, wd = s.workdays || [1, 2, 3, 4, 5, 6], tm = function(k, d) {
      return String(s[k] || d).slice(0, 5);
    };
    var off = Object.keys(TT.dayoff).sort();
    var sh = C.openSheet(C.sheetHead(T("tt_settings")) + '<div class="form tt-f"><p class="tt-l">' + E(T("tt_s_wd")) + '</p><div class="tt-days" id="ttSwd" role="group">' + DOW_KEYS.map(function(k, i) {
      return '<button type="button" data-tm="swd" aria-pressed="' + (wd.indexOf(i + 1) >= 0) + '" data-n="' + (i + 1) + '">' + E(T(k)) + "</button>";
    }).join("") + "</div>" + lab("ttSr", "tt_s_rep", '<input class="inp tt-in" id="ttSr" type="time" value="' + E(tm("report_time", "18:00")) + '">') + lab("ttSd", "tt_s_dig", '<input class="inp tt-in" id="ttSd" type="time" value="' + E(tm("digest_time", "09:00")) + '">') + lab("ttSq1", "tt_s_q1", '<input class="inp tt-in" id="ttSq1" type="time" value="' + E(tm("quiet_from", "21:00")) + '">') + lab("ttSq2", "tt_s_q2", '<input class="inp tt-in" id="ttSq2" type="time" value="' + E(tm("quiet_to", "08:00")) + '">') + lab("ttSp", "tt_s_ret", '<input class="inp tt-in" id="ttSp" type="number" inputmode="numeric" min="14" max="365" value="' + E(String(s.photo_retention_days || 60)) + '">') + '<button type="button" class="btn primary" data-tm="setsave">' + E(T("tt_save")) + '</button><h4 class="tt-h">' + E(T("tt_s_off")) + "</h4>" + lab("ttOd", "tt_f_due", '<input class="inp tt-in" id="ttOd" type="date">') + lab("ttOn", "tt_s_note", '<input class="inp tt-in" id="ttOn" maxlength="100" autocomplete="off">') + '<button type="button" class="btn ghost" data-tm="offadd">' + ico("plus") + E(T("tt_s_offadd")) + '</button><div id="ttOff">' + offHtml(off) + "</div></div>", { full: true });
    return sh;
  }
  function offHtml(off) {
    return off.map(function(d) {
      return '<div class="tt-mrow"><span><b>' + E(dfull(d)) + "</b><small>" + E(TT.dayoff[d] || "") + '</small></span><button type="button" class="btn ghost small" data-tm="offdel" data-d="' + E(d) + '">' + E(T("tt_del")) + "</button></div>";
    }).join("");
  }
  function botName() {
    var b = (window.SD_CONFIG || {}).tgBot || TT.settings && TT.settings.tg_bot || "";
    return /^[A-Za-z0-9_]{5,32}$/.test(b) ? b : "";
  }
  function langCode() {
    var l = document.documentElement.lang || "";
    return /^uz-Cyrl/i.test(l) ? "uzc" : /^uz/i.test(l) ? "uz" : "ru";
  }
  function saveLang() {
    var lc = langCode(), save = function(l) {
      return C.rpc("crm_team_prefs_save", { p_user: uid(), p_lang: l });
    };
    return save(lc).catch(function(e) {
      if (lc === "uzc" && !isNet(e)) return save("uz");
    }).then(function() {
      return pullMeta();
    }).catch(function() {
    });
  }
  async function openTg() {
    var sh = C.openSheet(C.sheetHead(T("tt_tg_title")) + '<div class="col" id="ttTg"><p class="muted">' + E(T("loading")) + "</p></div>", { onClose: function() {
      clearInterval(TT.tgTimer);
      TT.tgTimer = null;
      TT.tg = null;
    } });
    TT.tg = { sh, code: null };
    await tgDraw(true);
    return sh;
  }
  async function tgDraw(poll) {
    var g = TT.tg;
    if (!g || !g.sh.isConnected) return;
    var box = $("#ttTg", g.sh), st = null;
    try {
      st = await C.rpc("crm_tg_status");
    } catch (e) {
      box.innerHTML = '<p class="note tt-warn">' + E(isNet(e) ? T("tt_need_net") : errText(errCode(e))) + "</p>";
      return;
    }
    if (!TT.tg || TT.tg !== g) return;
    var bot = botName(), on = TT.prefs ? TT.prefs.tg_notify !== false : true;
    if (st && st.connected) {
      clearInterval(TT.tgTimer);
      TT.tgTimer = null;
      if ((!TT.prefs || TT.prefs.lang !== langCode()) && TT.langTry !== langCode()) {
        TT.langTry = langCode();
        saveLang();
      }
      box.innerHTML = '<p class="note tt-ok" role="status">' + ico("check") + E(T("tt_tg_linked", { n: st.tg_username ? "@" + st.tg_username : st.tg_name || "" })) + '</p><label class="tt-chk"><input type="checkbox" data-tm-in="tgnotify"' + (on ? " checked" : "") + "><span>" + E(T("tt_tg_notify")) + '</span></label><button type="button" class="btn danger" data-tm="tgdis">' + E(T("tt_tg_dis")) + "</button>";
      return;
    }
    var link = g.code && bot ? "https://t.me/" + encodeURIComponent(bot) + "?start=" + encodeURIComponent(g.code) : "";
    box.innerHTML = "<p>" + E(T("tt_tg_help")) + "</p>" + (bot ? "" : '<p class="muted small">' + E(T("tt_tg_nobot")) + "</p>") + (g.code ? (link ? '<a class="btn primary wide" id="ttTgLink" href="' + E(link) + '" target="_blank" rel="noopener">' + ico("send") + E(T("tt_tg_open")) + "</a>" : "") + '<p class="muted small">' + E(T("tt_tg_code_h")) + '</p><p class="code big" id="ttTgCode">/start ' + E(g.code) + '</p><button type="button" class="btn ghost" data-tm="tgcopy">' + E(T("tt_tg_copy")) + '</button><p class="muted small" role="status">' + E(T("tt_tg_wait")) + "</p>" : '<button type="button" class="btn primary wide" data-tm="tgconn">' + ico("send") + E(T("tt_tg_conn")) + "</button>");
    if (g.code && !TT.tgTimer) TT.tgTimer = setInterval(function() {
      if (!TT.tg || !TT.tg.sh.isConnected) {
        clearInterval(TT.tgTimer);
        TT.tgTimer = null;
        return;
      }
      tgDraw(false);
    }, 3e3);
  }
  function moreRow() {
    if (!TT.on || !C || !C.syncOn()) return "";
    return "<h3>" + E(T("tt_more_h")) + '</h3><div class="col"><button type="button" class="btn ghost" data-tm="tg">' + ico("send") + E(T("tt_tg_title")) + "</button>" + (isLead() ? '<button type="button" class="btn ghost" data-tm="depts">' + ico("team") + E(T("tt_depts")) + '</button><button type="button" class="btn ghost" data-tm="settings">' + ico("clock") + E(T("tt_settings")) + "</button>" : "") + "</div>";
  }
  async function openTask(id) {
    if (TT.card && TT.card.id === id && TT.card.sh.isConnected) return;
    if (!TT.tasks.has(id) && C.syncOn() && navigator.onLine !== false) {
      try {
        var r = await C.api("GET", "crm_team_tasks?select=*&id=eq." + encodeURIComponent(id));
        if (r && r[0]) {
          TT.tasks.set(id, r[0]);
          await put("tt_tasks", [r[0]]);
        }
      } catch (e) {
      }
    }
    openCard(id);
  }
  function toggleBtn(el) {
    el.setAttribute("aria-pressed", String(el.getAttribute("aria-pressed") !== "true"));
  }
  function onClick(ev) {
    var el = ev.target.closest && ev.target.closest("[data-tm]");
    if (!el) return;
    var a = el.dataset.tm, id = el.dataset.id, cid = TT.card ? TT.card.id : "";
    if (a === "view") {
      TT.view = el.dataset.v;
      $$(".tt-nav button").forEach(function(b) {
        b.setAttribute("aria-pressed", String(b === el));
      });
      repFlush();
      body();
      return;
    }
    if (a === "seg") {
      TT.seg = el.dataset.s;
      drawList();
      return;
    }
    if (a === "open") return openTask(id);
    if (a === "new") return openTaskForm();
    if (a === "st") {
      var st = el.dataset.st;
      if (!cid) return;
      var cur = TT.tasks.get(cid);
      if (cur && eff(cur).status === st && st !== "stuck") return;
      if (st === "stuck") return stuckDialog(cid);
      return setStatus(cid, st);
    }
    if (a === "edit") return openTaskForm(id);
    if (a === "cancel") return patchTask(id, { status: "cancelled" });
    if (a === "restore") return patchTask(id, { status: "new" });
    if (a === "del") {
      C.ask(T("tt_del_q"), { danger: true, ok: T("tt_del") }).then(function(ok) {
        if (ok) patchTask(id, { deleted: true }).then(function() {
          C.closeTop();
        });
      });
      return;
    }
    if (a === "photo") {
      if (cid) pickFiles(cid, true, false);
      return;
    }
    if (a === "photohd") {
      if (cid) pickFiles(cid, true, true);
      return;
    }
    if (a === "attach") {
      if (cid) pickFiles(cid, false);
      return;
    }
    if (a === "comment") {
      var ta = $("#ttCm");
      if (!ta || !cid) return;
      if (!ta.value.trim()) {
        ta.focus();
        return;
      }
      var v = ta.value;
      ta.value = "";
      return addComment(cid, v);
    }
    if (a === "viewph") return openPhoto(id);
    if (a === "failed") return openFailed();
    if (a === "retry") return retryItem(el.dataset.k, id);
    if (a === "drop") return dropItem(el.dataset.k, id);
    if (a === "evdel") return deleteEvent(id);
    if (a === "repdate") {
      repFlush();
      TT.rep.date = el.dataset.d;
      return viewReport();
    }
    if (a === "repchip") {
      var t = TT.tasks.get(id), ta2 = $("#ttRd");
      if (!t || !ta2) return;
      ta2.value += (ta2.value && !/\n$/.test(ta2.value) ? "\n" : "") + "\u2022 " + t.title + "\n";
      var f = repRead();
      if (f.task_ids.indexOf(id) < 0 && f.task_ids.length < 50) f.task_ids.push(id);
      repDraftSoon();
      return;
    }
    if (a === "wd" || a === "swd") return toggleBtn(el);
    if (a === "wdsave") return wdSave(false);
    if (a === "wdreset") return wdSave(true);
    if (a === "bday") {
      TT.boardDay = el.dataset.d;
      return viewTeam();
    }
    if (a === "person") return openPerson(id);
    if (a === "missing") return openMissing();
    if (a === "feed") return openFeed();
    if (a === "depts") return openDepts();
    if (a === "settings") return openSettings();
    if (a === "remind") return remind(id);
    if (a === "remindall") return remindAll();
    if (a === "deptnew") {
      var nm = $("#ttDn"), name = nm.value.trim();
      if (!name) {
        C.fieldErr(nm, T("tt_e_title"));
        return;
      }
      return deptOp(function() {
        return C.rpc("crm_dept_save", { p_id: null, p_name: name, p_head: $("#ttDh").value || null });
      });
    }
    if (a === "deptarch") {
      C.ask(T("tt_dept_arch_q"), { danger: true, ok: T("tt_dept_arch") }).then(function(ok) {
        if (ok) deptOp(function() {
          return C.rpc("crm_dept_archive", { p_id: id });
        });
      });
      return;
    }
    if (a === "setsave") {
      var days = $$("#ttSwd button[aria-pressed=true]").map(function(b) {
        return +b.dataset.n;
      });
      if (!days.length) {
        C.toast(T("tt_e_wd"));
        return;
      }
      return C.rpc("crm_team_settings_save", { p_workdays: days, p_report_time: $("#ttSr").value || null, p_digest_time: $("#ttSd").value || null, p_quiet_from: $("#ttSq1").value || null, p_quiet_to: $("#ttSq2").value || null, p_photo_retention_days: +$("#ttSp").value || null }).then(function() {
        return pullMeta();
      }).then(function() {
        C.toast(T("tt_saved"));
      }, function(e) {
        C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
      });
    }
    if (a === "offadd") {
      var d = $("#ttOd");
      if (!d.value) {
        C.fieldErr(d, T("tt_e_date"));
        return;
      }
      return C.rpc("crm_team_dayoff_set", { p_day: d.value, p_on: true, p_note: $("#ttOn").value.trim() || null }).then(function() {
        return pullMeta();
      }).then(function() {
        var o = $("#ttOff");
        if (o) o.innerHTML = offHtml(Object.keys(TT.dayoff).sort());
        d.value = "";
        C.toast(T("tt_saved"));
      }, function(e) {
        C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
      });
    }
    if (a === "offdel") return C.rpc("crm_team_dayoff_set", { p_day: el.dataset.d, p_on: false }).then(function() {
      return pullMeta();
    }).then(function() {
      var o = $("#ttOff");
      if (o) o.innerHTML = offHtml(Object.keys(TT.dayoff).sort());
    }, function(e) {
      C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
    });
    if (a === "tg") return openTg();
    if (a === "tgconn") return saveLang().then(function() {
      return C.rpc("crm_tg_connect");
    }).then(function(r) {
      if (TT.tg) {
        TT.tg.code = r && r.code;
        tgDraw(true);
      }
    }, function(e) {
      C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
    });
    if (a === "tgdis") return C.rpc("crm_tg_disconnect").then(function() {
      if (TT.tg) {
        TT.tg.code = null;
        tgDraw(true);
      }
    }, function() {
      C.toast(T("tt_e_err"));
    });
    if (a === "tgcopy") {
      if (TT.tg && TT.tg.code && C.copyText) C.copyText("/start " + TT.tg.code).then(function() {
        C.toast(T("tt_copied"));
      }, function() {
      });
      return;
    }
  }
  function prefSave(args, done) {
    return C.rpc("crm_team_prefs_save", args).then(function() {
      return pullMeta();
    }).then(function() {
      if (done) done();
      C.toast(T("tt_saved"));
    }, function(e) {
      C.toast(isNet(e) ? T("tt_need_net") : errText(errCode(e)));
    });
  }
  function onChange(ev) {
    var el = ev.target;
    if (!el.getAttribute || !el.getAttribute("data-tm-in")) {
      if (el.id === "ttBd" && el.value) {
        TT.boardDay = el.value;
        viewTeam();
      }
      return;
    }
    var a = el.getAttribute("data-tm-in"), id = el.dataset.id;
    if (a === "head") {
      var d = liveDepts().filter(function(x) {
        return x.id === id;
      })[0];
      if (d) deptOp(function() {
        return C.rpc("crm_dept_save", { p_id: id, p_name: d.name, p_head: el.value || null });
      });
      return;
    }
    if (a === "mdept" || a === "dept") {
      deptOp(function() {
        return C.rpc("crm_member_dept_set", { p_user: id, p_dept: el.value || null }).then(function() {
          var m = members().get(id);
          if (m) m.department_id = el.value || null;
        });
      }).then(function() {
        if (TT.person) drawPerson();
      });
      return;
    }
    if (a === "reqd") return prefSave({ p_user: id, p_report_required: el.checked }, function() {
      if (TT.person && TT.person.prefs) TT.person.prefs.report_required = el.checked;
    });
    if (a === "only") return prefSave({ p_user: id, p_tasks_only: el.checked }, function() {
      if (TT.person && TT.person.prefs) TT.person.prefs.tasks_only = el.checked;
    });
    if (a === "tgnotify") return prefSave({ p_user: uid(), p_tg_notify: el.checked });
  }
  var qT = 0;
  function onInput(ev) {
    var el = ev.target;
    if (el.id === "ttQ") {
      clearTimeout(qT);
      var v = el.value;
      qT = setTimeout(function() {
        TT.q = v.trim();
        drawList();
      }, 200);
      return;
    }
    if (el.closest && el.closest("#ttRepForm")) repDraftSoon();
  }
  function boot() {
    try {
      var o = orgId();
      if (o && localStorage.getItem(FLAG_KEY) === o) TT.on = true;
    } catch (e) {
    }
    shell();
    if (dbh()) load().then(function() {
      badge();
    }, function() {
    });
  }
  function reset() {
    TT.tasks = /* @__PURE__ */ new Map();
    TT.ev = /* @__PURE__ */ new Map();
    TT.evId = /* @__PURE__ */ new Map();
    TT.reports = /* @__PURE__ */ new Map();
    TT.ob = /* @__PURE__ */ new Map();
    TT.depts = [];
    TT.settings = null;
    TT.dayoff = {};
    TT.prefs = null;
    TT.board = null;
    TT.boardCache = null;
    TT.loaded = false;
    TT.on = false;
    TT.probed = 0;
    TT.metaAt = 0;
    TT.pend = 0;
    TT.card = null;
    TT.person = null;
    TT.view = "";
    try {
      localStorage.removeItem(FLAG_KEY);
    } catch (e) {
    }
    shell();
  }
  function init(ctx) {
    C = ctx;
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("input", onInput);
    var sc = $("#v-tasks"), raf = 0;
    if (sc) sc.addEventListener("scroll", function() {
      if (TT.vt && !raf) {
        raf = requestAnimationFrame(function() {
          raf = 0;
          paintWin();
        });
      }
    }, { passive: true });
    document.addEventListener("click", function(ev) {
      var b = ev.target.closest && ev.target.closest(".tabs button");
      if (b) setTimeout(function() {
        try {
          b.scrollIntoView({ inline: "nearest", block: "nearest" });
        } catch (e) {
        }
      }, 0);
    });
    document.addEventListener("visibilitychange", function() {
      if (document.hidden) repFlush();
    });
    window.addEventListener("pagehide", repFlush);
  }
  window.SDTeam = {
    init,
    boot,
    sync,
    wake,
    render,
    reset,
    moreRow,
    RT: RT_TABLES,
    stores: STORES,
    pending: function() {
      return TT.pend;
    },
    rtTables: function() {
      return TT.on ? RT_TABLES : [];
    },
    online: function() {
      TT.resetW = 1;
      schedule(200);
    }
  };
})();
