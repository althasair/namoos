/* منصة نوماس — الواجهة */
(function () {
  'use strict';
  var API = (window.NAMOOS_CONFIG || {}).API_URL || '';
  var app = document.getElementById('app');
  var S = { sec: '', taskCounts: { beh: 0, abs: 0 }, token: '', me: null, boot: null, view: '', focus: '', last: { unread: 0, tasks: 0 }, rec: {}, out: {}, tardy: {}, filter: {}, dashPeriod: '', reportMonth: '' };

  /* ---------------- أدوات ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  function ar(d) { if (!d) return ''; var p = d.split('-'); return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1]; }
  function arFull(d) { if (!d) return ''; var x = new Date(d + 'T12:00:00'); return WD[x.getDay()] + ' ' + ar(d); }
  function subj(s) { return String(s || '').replace(/\s*\(.*\)\s*$/, ''); }
  function degCls(d) { return d.indexOf('الأولى') >= 0 ? 'd1' : d.indexOf('الثانية') >= 0 ? 'd2' : d.indexOf('الثالثة') >= 0 ? 'd3' : d.indexOf('الرابعة') >= 0 ? 'd4' : ''; }
  function norm(s) { return String(s || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }
  var ICON = {
    bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    out: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
    search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55636A" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E7275" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };
  var PATTERN = '<svg class="pat" aria-hidden="true" width="100%" height="100%"><defs><pattern id="pt" width="124" height="124" patternUnits="userSpaceOnUse"><g fill="none" stroke="#E6E9EC" stroke-width="1.2"><rect x="34" y="34" width="56" height="56"/><rect x="34" y="34" width="56" height="56" transform="rotate(45 62 62)"/><circle cx="62" cy="62" r="14"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#pt)"/></svg>';
  var VERSE = '﴿ وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ ﴾';
  var VERSE2 = '﴿ وَاجْعَل لِّي لِسَانَ صِدْقٍ فِي الْآخِرِينَ ﴾';
  var T1 = 'لأنّ الطِّيب نوماس', T2 = 'حيث يُصان السَّنع، ويُبنى النوماس', T3 = 'أخلاقٌ نعتزّ بها، وأثرٌ نُذكر به';

  /* ---------------- الاتصال بالخادم ---------------- */
  var busy = 0;
  function loading(on) {
    busy += on ? 1 : -1;
    var el = $('#ld');
    if (busy > 0 && !el) { el = document.createElement('div'); el.id = 'ld'; el.className = 'loading'; el.innerHTML = '<div class="spin" role="status" aria-label="جارٍ التحميل"></div>'; document.body.appendChild(el); }
    if (busy <= 0 && el) { busy = 0; el.remove(); }
  }
  function api(action, data, quiet) {
    if (!API) return Promise.reject(new Error('المنصة قيد التهيئة: لم يُضبط رابط الخادم بعد'));
    var body = Object.assign({ action: action, token: S.token }, data || {});
    if (!quiet) loading(true);
    return fetch(API, { method: 'POST', body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!quiet) loading(false);
        if (!res.ok) {
          if (res.error === 'AUTH') { logout(true); throw new Error('انتهت الجلسة، سجّلي الدخول مرة أخرى'); }
          throw new Error(res.error || 'تعذّر تنفيذ الطلب');
        }
        return res;
      }, function (err) {
        if (!quiet) loading(false);
        throw new Error('تعذّر الاتصال بالمنصة — تحققي من الإنترنت');
      });
  }
  if (window.NamoosForms) setTimeout(function () { NamoosForms.init({ S: S, api: api, toast: toast, esc: esc, ar: ar, arFull: arFull }); }, 0);
  function toast(msg, kind, ms) {
    var t = $('#toast'); if (t) t.remove();
    t = document.createElement('div'); t.id = 'toast'; t.className = 'toast ' + (kind || ''); t.setAttribute('role', 'status');
    t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, ms || 4200);
  }
  function fail(e) { toast(e.message || String(e), 'bad', 6000); }

  /* ---------------- الصوت والإشعارات ---------------- */
  var actx = null;
  function chime() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      [[880, 0], [1174.7, 0.16], [1568, 0.32]].forEach(function (n) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t + n[1]); g.gain.exponentialRampToValueAtTime(0.25, t + n[1] + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.5);
        o.connect(g); g.connect(actx.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.55);
      });
    } catch (e) { /* الصوت غير متاح */ }
  }
  function sysNotify(title, body) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, { body: body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', lang: 'ar', dir: 'rtl', tag: 'namoos' }); });
      } else { new Notification(title, { body: body, icon: 'icons/icon-192.png' }); }
    } catch (e) { }
  }
  function askNotify() {
    if (!('Notification' in window)) { toast('هذا المتصفح لا يدعم تنبيهات الجهاز، وستصلكِ التنبيهات داخل المنصة وعلى البريد', '', 6000); return; }
    Notification.requestPermission().then(function (p) { toast(p === 'granted' ? 'تم تفعيل تنبيهات الجهاز' : 'لم تُفعَّل تنبيهات الجهاز', p === 'granted' ? 'ok' : ''); renderModalNotifyBtn(); });
  }
  var pollTimer = null;
  function startPoll() {
    clearInterval(pollTimer);
    pollTimer = setInterval(poll, 45000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
  }
  function poll() {
    if (!S.token) return;
    api('poll', {}, true).then(function (r) {
      var more = r.unread > S.last.unread || r.tasks > S.last.tasks;
      if (more) {
        chime();
        var msg = r.unread > S.last.unread && r.last ? 'رسالة جديدة: ' + r.last.subject : 'وصلتكِ مهمة جديدة في نوماس';
        toast('🔔 ' + msg, 'ok', 7000);
        sysNotify('نوماس', msg);
        refresh(true);
      }
      S.last = { unread: r.unread, tasks: r.tasks };
      if (r.taskCounts) S.taskCounts = r.taskCounts;
      setBadges(r.unread, r.tasks);
    }).catch(function () { });
  }
  function setBadges(unread, tasks) {
    var b = $('#bellBadge'); if (b) { b.textContent = unread; b.classList.toggle('hidden', !unread); }
    var tc = S.taskCounts || { beh: tasks, abs: 0 };
    [['tasks', tc.beh], ['abstasks', tc.abs], ['sec-beh', tc.beh], ['sec-abs', tc.abs]].forEach(function (p) {
      $$('[data-count="' + p[0] + '"]').forEach(function (el) { el.textContent = p[1]; el.classList.toggle('hidden', !p[1]); });
    });
    $$('[data-count="messages"]').forEach(function (el) { el.textContent = unread; el.classList.toggle('hidden', !unread); });
    try { if (navigator.setAppBadge) navigator.setAppBadge(unread + tasks).catch(function () { }); } catch (e) { }
  }

  /* ---------------- الدخول ---------------- */
  var ROLES = [['teacher', 'معلمة'], ['supervisor', 'مشرفة إدارية'], ['coordinator', 'منسقة'], ['social', 'أخصائية اجتماعية'], ['psych', 'أخصائية نفسية'], ['admin', 'الإدارة'], ['daily', 'حصر الحضور']];
  function renderLogin(msg) {
    var role = store('namoos_role') || 'teacher';
    app.innerHTML =
      '<main class="login">' +
      '<section class="brand">' + PATTERN +
      '<div class="school">مدرسة الشيماء الثانوية للبنات</div>' +
      '<div><h1><img src="icons/logo.png" alt="نوماس"></h1><div class="tag" style="margin-top:14px">' + T1 + '</div>' +
      '<div class="verse" style="margin-top:22px">' + VERSE + '</div><div class="vref">سورة القلم، الآية 4</div></div>' +
      '<div class="foot">منصة متابعة السلوك والانضباط وفق السياسة • العام الدراسي 2026 – 2027</div>' +
      '</section>' +
      '<section class="login-side"><form class="login-card" id="lf" autocomplete="off">' +
      '<div><h2>مرحبًا بكِ</h2><p class="sub">اختاري صفتكِ وأدخلي رقمكِ السري</p></div>' +
      '<div><div class="lbl" id="rl">الصفة</div><div class="pills" role="group" aria-labelledby="rl">' +
      ROLES.map(function (r) { return '<button type="button" class="pill" data-role="' + r[0] + '" aria-pressed="' + (r[0] === role) + '">' + r[1] + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="field"><label class="lbl" for="pin">الرقم السري</label><input id="pin" class="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password" required></div>' +
      '<div class="err" id="lerr">' + esc(msg || '') + '</div>' +
      '<button class="btn wide" type="submit">دخول</button>' +
      '<div class="note">' + ICON.lock + '<span>كل موظفة ترى صفحتها فقط، وبيانات الطالبات محفوظة خارج الموقع.</span></div>' +
      '<a class="guide-link" href="guide/">📘 دليل الاستخدام المصوّر</a>' +
      '</form></section></main>';
    $$('.pill').forEach(function (b) {
      b.onclick = function () { $$('.pill').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); role = b.dataset.role; $('#pin').focus(); };
    });
    $('#lf').onsubmit = function (e) {
      e.preventDefault();
      var pin = $('#pin').value.trim();
      if (!pin) { $('#lerr').textContent = 'أدخلي الرقم السري'; return; }
      api('login', { role: role, pin: pin }).then(function (r) {
        S.token = r.token; store('namoos_token', r.token); store('namoos_role', role);
        start(true);
      }).catch(function (err) { $('#lerr').textContent = err.message; $('#pin').select(); });
    };
    setTimeout(function () { var p = $('#pin'); if (p) p.focus(); }, 50);
  }
  function logout(silent) {
    S.token = ''; S.me = null; S.boot = null; store('namoos_token', null); clearInterval(pollTimer);
    renderLogin(silent ? 'انتهت الجلسة، سجّلي الدخول مرة أخرى' : '');
  }

  /* ---------------- التشغيل ---------------- */
  var NAV = {
    teacher: [['record', 'تسجيل مخالفة'], ['mine', 'حالاتي', 'tasks'], ['messages', 'الرسائل', 'messages']],
    supervisor: [['tasks', 'الوارد', 'tasks'], ['outside', 'مخالفة خارج الصف'], ['tardy', 'التأخير الصباحي'], ['cases', 'كل الحالات'], ['dash', 'لوحة شعبي'], ['messages', 'الرسائل', 'messages']],
    coordinator: [['tasks', 'المهام', 'tasks'], ['cases', 'كل الحالات'], ['messages', 'الرسائل', 'messages']],
    social: [['tasks', 'المهام', 'tasks'], ['cases', 'كل الحالات'], ['messages', 'الرسائل', 'messages']],
    psych: [['tasks', 'المهام', 'tasks'], ['cases', 'كل الحالات'], ['messages', 'الرسائل', 'messages']],
    admin: [['dash', 'لوحة التحكم'], ['report', 'التقرير الشهري'], ['tasks', 'مهام الإدارة', 'tasks'], ['cases', 'كل الحالات'], ['outside', 'تسجيل مخالفة'], ['tardy', 'التأخير الصباحي'], ['messages', 'الرسائل', 'messages']],
    daily: [['dTardy', 'حصيلة التأخير'], ['dAbs', 'حصيلة الغياب'], ['messages', 'الرسائل', 'messages']]
  };
  var NAV_ABS = {
    teacher: [['absRec', 'تسجيل الغياب'], ['absMine', 'غياب سجّلته'], ['messages', 'الرسائل', 'messages']],
    supervisor: [['absTasks', 'وارد الغياب', 'abstasks'], ['absRec', 'تسجيل الغياب'], ['absLog', 'سجل الغياب'], ['absStud', 'متابعة الطالبات'], ['absDash', 'لوحة الغياب'], ['messages', 'الرسائل', 'messages']],
    coordinator: [['absTasks', 'مهام الغياب', 'abstasks'], ['absLog', 'حالات الغياب'], ['absStud', 'متابعة الطالبات'], ['messages', 'الرسائل', 'messages']],
    social: [['absTasks', 'مهام الغياب', 'abstasks'], ['absLog', 'حالات الغياب'], ['absStud', 'متابعة الطالبات'], ['messages', 'الرسائل', 'messages']],
    psych: [['absTasks', 'مهام الغياب', 'abstasks'], ['absLog', 'حالات الغياب'], ['absStud', 'متابعة الطالبات'], ['messages', 'الرسائل', 'messages']],
    daily: [['dTardy', 'حصيلة التأخير'], ['dAbs', 'حصيلة الغياب'], ['messages', 'الرسائل', 'messages']],
    admin: [['absDash', 'لوحة الغياب'], ['report', 'التقرير الشهري'], ['absTasks', 'مهام الغياب', 'abstasks'], ['absLog', 'سجل الغياب'], ['absStud', 'متابعة الطالبات'], ['absDep', 'المحرومات'], ['messages', 'الرسائل', 'messages']]
  };
  function hasAbs() { return !!(S.boot && S.boot.abs); }
  function navList() { return (S.sec === 'abs' && hasAbs() ? NAV_ABS : NAV)[S.me.role]; }
  function setSec(sec, v) {
    S.sec = sec; store('namoos_sec', sec);
    S.view = v || navList()[0][0];
    shell(); setBadges(S.last.unread, S.last.tasks);
  }
  function start(fromLogin) {
    api('bootstrap').then(function (b) {
      S.boot = b; S.me = b.me;
      S.last = { unread: b.unread, tasks: b.tasks.length };
      S.taskCounts = b.taskCounts || { beh: b.tasks.length, abs: 0 };
      if (!S.sec) S.sec = store('namoos_sec') || 'beh';
      if (!S.view || !navList().some(function (n) { return n[0] === S.view; })) S.view = navList()[0][0];
      shell();
      setBadges(b.unread, b.tasks.length);
      if (b.tasks.length || b.unread) showTasksModal();
      startPoll();
    }).catch(function (e) { if (S.token) renderLogin(e.message); });
  }
  function refresh(quiet) {
    return api('bootstrap', {}, quiet).then(function (b) { S.boot = b; S.me = b.me; S.last.tasks = b.tasks.length; S.last.unread = b.unread; S.taskCounts = b.taskCounts || S.taskCounts; setBadges(b.unread, b.tasks.length); if (['record', 'outside', 'tardy', 'messages', 'absRec'].indexOf(S.view) < 0) view(S.view, true); });
  }

  function shell() {
    var me = S.me;
    app.innerHTML =
      '<header class="top"><div style="display:flex;align-items:center;gap:16px"><span class="logo"><img src="icons/logo-bar.png" alt="نوماس"></span><span class="tv verse">' + VERSE + '</span></div>' +
      '<div class="right"><div class="who"><b>أ. ' + esc(me.name) + '</b><span>' + esc(me.roleLabel) + '</span></div>' +
      '<button class="iconbtn" id="bell" aria-label="الرسائل">' + ICON.bell + '<span class="badge hidden" id="bellBadge">0</span></button>' +
      '<button class="iconbtn" id="lo" aria-label="تسجيل الخروج">' + ICON.out + '</button></div></header>' +
      '<div class="shell"><nav class="nav" aria-label="أقسام المنصة">' +
      navList().map(function (n) { return '<button data-v="' + n[0] + '"' + (S.view === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + (n[2] ? '<span class="n hidden" data-count="' + n[2] + '">0</span>' : '') + '</button>'; }).join('') +
      '</nav><main class="main" id="main"></main></div>';
    $$('.nav button').forEach(function (b) { b.onclick = function () { S.focus = ''; view(b.dataset.v); }; });
    $('#bell').onclick = function () { view('messages'); };
    $('#lo').onclick = function () { if (confirm('تسجيل الخروج من نوماس؟')) logout(); };
    view(S.view);
  }

  function view(v, keepScroll) {
    S.view = v;
    $$('.nav button').forEach(function (b) { if (b.dataset.v === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    var m = $('#main'); if (!m) return;
    var fn = { record: vRecord, mine: vMine, tasks: vTasks, cases: vCases, outside: vOutside, tardy: vTardy, messages: vMessages, dash: vDash, report: vReport,
      absRec: vAbsRec, absMine: vAbsMine, absTasks: vAbsTasks, absLog: vAbsLog, absStud: vAbsStud, absDep: vAbsDep, absDash: vAbsDash, dTardy: vDaily, dAbs: vDaily }[v];
    m.innerHTML = secSwitch() + welcome() + '<div id="vw"></div>';
    $$('[data-sec]', m).forEach(function (b) { b.onclick = function () { if (b.dataset.sec !== S.sec) setSec(b.dataset.sec); }; });
    fn($('#vw'));
    if (!keepScroll) window.scrollTo(0, 0);
  }
  function secSwitch() {
    if (!hasAbs()) return '';
    return '<div class="secsw noprint" role="tablist" aria-label="القسم">' + [['beh', 'السلوك والانضباط', 'tasks'], ['abs', 'الحضور والغياب', 'abstasks']].map(function (x) {
      var n = S.taskCounts[x[0]] || 0;
      return '<button role="tab" data-sec="' + x[0] + '" aria-selected="' + (S.sec === x[0]) + '">' + x[1] + '<span class="n' + (n ? '' : ' hidden') + '" data-count="sec-' + x[0] + '">' + n + '</span></button>';
    }).join('') + '</div>';
  }
  function welcome() {
    return '<div class="welcome"><b>مرحبًا أ. ' + esc(S.me.name) + '</b><span class="tg">' + T2 + '</span></div>';
  }

  /* ---------------- نافذة المهام عند الدخول ---------------- */
  function showTasksModal() {
    var b = S.boot, t = b.tasks;
    var m = document.createElement('div'); m.className = 'modal'; m.id = 'tm';
    var goView = S.me.role === 'teacher' ? 'mine' : S.me.role === 'daily' ? 'dTardy' : 'tasks';
    m.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="tmh">' +
      '<h3 id="tmh">مرحبًا أ. ' + esc(S.me.name) + '</h3>' +
      (t.length ? '<p class="sub">لديكِ <b>' + t.length + '</b> ' + (t.length === 1 ? 'مهمة' : 'مهام') + ' بانتظار إجرائكِ' + (t.some(function (x) { return x.late; }) ? '، منها متأخرة ⛔' : '') + ':</p>' +
        '<div class="items">' + t.slice(0, 6).map(function (x) {
          return '<div class="task' + (x.late ? ' late' : '') + '"><div><b>' + esc(x.title) + '</b> <span class="chip ' + (x.sec === 'abs' ? 'ap' : 'tq') + '">' + (x.sec === 'abs' ? 'غياب' : 'سلوك') + '</span><div class="sub">' + esc(x.sub) + '</div></div>' +
            '<button class="btn sm" data-go="' + esc(x.id) + '">انتقلي إليها</button></div>';
        }).join('') + '</div>' +
        (t.length > 6 ? '<p class="sub">و' + (t.length - 6) + ' مهام أخرى في صفحة المهام.</p>' : '') : '') +
      (b.unread ? '<div class="task"><div><b>لديكِ ' + b.unread + ' ' + (b.unread === 1 ? 'رسالة جديدة' : 'رسائل جديدة') + '</b></div><button class="btn sm sec" data-go="__msgs">فتح الرسائل</button></div>' : '') +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center"><span id="nbtn"></span>' +
      '<button class="btn" data-go="__all">' + (t.length ? 'ابدئي بالمهام' : 'متابعة') + '</button></div></div>';
    document.body.appendChild(m);
    renderModalNotifyBtn();
    $$('[data-go]', m).forEach(function (btn) {
      btn.onclick = function () {
        var g = btn.dataset.go; m.remove();
        if (g === '__msgs') return view('messages');
        var task = g === '__all' ? t[0] : t.filter(function (x) { return x.id === g; })[0];
        S.focus = task ? task.id : '';
        if (!task) return view(S.view);
        var sec = task.sec === 'abs' ? 'abs' : 'beh';
        var target = sec === 'abs' ? 'absTasks' : goView;
        if (sec !== S.sec) setSec(sec, target); else view(target);
      };
    });
  }
  function renderModalNotifyBtn() {
    var el = $('#nbtn'); if (!el) return;
    if ('Notification' in window && Notification.permission === 'default') {
      el.innerHTML = '<button class="btn sm sec" type="button">🔔 تفعيل تنبيهات الجهاز</button>';
      el.firstChild.onclick = askNotify;
    } else el.innerHTML = '';
  }

  /* ---------------- مكونات مشتركة ---------------- */
  function datesOptions(sel, min) {
    var d = (S.boot.dates || []).slice().reverse().filter(function (x) { return !min || x >= min; });
    if (!sel) sel = d.indexOf(S.boot.today) >= 0 ? S.boot.today : d[0];
    return d.map(function (x) { return '<option value="' + x + '"' + (x === sel ? ' selected' : '') + '>' + arFull(x) + (x === S.boot.today ? ' (اليوم)' : '') + '</option>'; }).join('');
  }
  function searchList(id, placeholder) {
    return '<div class="search"><input class="inp" id="' + id + '" type="search" placeholder="' + placeholder + '" aria-label="' + placeholder + '">' + ICON.search + '</div>';
  }
  function step(n, title, body, state) {
    return '<section class="step card ' + (state || '') + '"><div class="sh"><span class="num">' + n + '</span>' + title + '</div>' + body + '</section>';
  }
  function violationList(listEl, items, selected, q, onPick) {
    var qn = norm(q);
    var groups = {};
    items.filter(function (v) { return !qn || norm(v.label + ' ' + (v.short || '')).indexOf(qn) >= 0; }).forEach(function (v) { (groups[v.degree] = groups[v.degree] || []).push(v); });
    var html = Object.keys(groups).map(function (g) {
      return '<div class="grp">' + esc(g.indexOf('الدرجة') === 0 ? g : 'الدرجة ' + g) + '</div>' + groups[g].map(function (v) {
        var label = v.label.replace(/^\((الأولى|الثانية|الثالثة|الرابعة)\)\s*/, '');
        return '<button type="button" data-v="' + esc(v.label) + '" aria-pressed="' + (v.label === selected) + '"><span>' + esc(label) + '</span>' +
          (v.cat === 2 ? '<span class="chip red">بلاغ فوري</span>' : '') + '</button>';
      }).join('');
    }).join('') || '<div class="empty">لا توجد مخالفة بهذا الاسم — جرّبي كلمة أخرى</div>';
    listEl.innerHTML = html;
    $$('button', listEl).forEach(function (b) { b.onclick = function () { onPick(b.dataset.v); }; });
  }
  function studentList(listEl, names, selected, q, onPick) {
    var qn = norm(q);
    var f = names.filter(function (n) { return !qn || norm(n).indexOf(qn) >= 0; });
    listEl.innerHTML = f.map(function (n) { return '<button type="button" data-s="' + esc(n) + '" aria-pressed="' + (n === selected) + '"><span>' + esc(n) + '</span></button>'; }).join('') || '<div class="empty">لا توجد طالبة بهذا الاسم</div>';
    $$('button', listEl).forEach(function (b) { b.onclick = function () { onPick(b.dataset.s); }; });
  }
  function listOptions(key, sel) {
    return '<option value="">— اختاري —</option>' + (S.boot.lists[key] || []).map(function (x) { return '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
  }
  function tel(phone) { return phone ? '<a href="tel:' + esc(phone.replace(/\s/g, '')) + '">' + esc(phone) + '</a>' : ''; }

  /* =====================================================
   *  المعلمة: تسجيل مخالفة صفية — خطوات متتالية
   * ===================================================== */
  function vRecord(el) {
    var b = S.boot, R = S.rec;
    if (R.asg == null && b.assignments.length === 1) R.asg = 0;
    if (!R.date) R.date = (b.dates.indexOf(b.today) >= 0 ? b.today : b.dates[b.dates.length - 1]);
    var a = R.asg != null ? b.assignments[R.asg] : null;
    var s1 = a ? 'done' : '', s2 = a ? 'done' : 'locked', s3 = !a ? 'locked' : (R.student ? 'done' : ''), s4 = !R.student ? 'locked' : (R.violation ? 'done' : '');
    el.innerHTML =
      '<div><h2 class="pt">تسجيل مخالفة صفية</h2><p class="sub">أربع خطوات، وبعدها يظهر لكِ المطلوب منكِ حسب السياسة.</p></div>' +
      step(1, 'المادة والشعبة', '<div class="opts">' + b.assignments.map(function (x, i) {
        return '<button type="button" class="opt" data-a="' + i + '" aria-pressed="' + (R.asg === i) + '">' + esc(subj(x.subject)) + ' • ' + esc(x.section) + '</button>';
      }).join('') + (b.assignments.length ? '' : '<div class="sub">لا توجد مواد مسندة لكِ في الجدول — تواصلي مع الإدارة</div>') + '</div>', s1) +
      step(2, 'التاريخ', '<select class="inp" id="rd" aria-label="التاريخ">' + datesOptions(R.date) + '</select>', s2) +
      step(3, 'الطالبة', searchList('rsq', 'ابحثي باسم الطالبة') + '<div class="list" id="rsl"></div>', s3) +
      step(4, 'المخالفة', searchList('rvq', 'ابحثي عن المخالفة: تأخر، هاتف، كتب…') + '<div class="list" id="rvl"></div>', s4) +
      '<div id="rres"></div>' +
      '<button class="btn wide" id="rsave" ' + (a && R.student && R.violation ? '' : 'disabled') + '>تسجيل المخالفة</button>';
    $$('[data-a]', el).forEach(function (x) { x.onclick = function () { R.asg = Number(x.dataset.a); R.student = ''; vRecord(el); var q = $('#rsq'); if (q) q.focus(); }; });
    $('#rd').onchange = function () { R.date = this.value; };
    if (a) {
      var names = b.students[a.section] || [];
      var drawS = function () { studentList($('#rsl'), names, R.student, $('#rsq').value, function (n) { R.student = n; vRecord(el); var q = $('#rvq'); if (q) q.focus(); }); };
      $('#rsq').oninput = drawS; drawS();
    }
    if (R.student) {
      var drawV = function () { violationList($('#rvl'), b.violations, R.violation, $('#rvq').value, function (v) { R.violation = v; vRecord(el); $('#rsave').focus(); $('#rsave').scrollIntoView({ block: 'center', behavior: 'smooth' }); }); };
      $('#rvq').oninput = drawV; drawV();
    }
    $('#rsave').onclick = function () {
      api('recordTeacher', { subject: a.subject, section: a.section, date: R.date, student: R.student, violation: R.violation }).then(function (r) {
        b.records.unshift(r.record);
        R.student = ''; R.violation = '';
        el.innerHTML = '<div><h2 class="pt">تم تسجيل المخالفة</h2><p class="sub">الخطوة التالية: نفّذي الإجراء ثم وثّقيه هنا.</p></div><div id="rdoc"></div>';
        docTeacher($('#rdoc'), r.record, r.guardian, function () { vRecord(el); });
        el.scrollIntoView({ behavior: 'smooth' });
      }).catch(fail);
    };
  }

  /** توثيق المعلمة لإجرائها، ثم التحويل التلقائي */
  function docTeacher(box, rec, guardian, onNew) {
    var needG = rec.guardianRequired;
    box.innerHTML =
      '<div class="policy"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><h3>المطلوب منكِ حسب السياسة</h3>' +
      '<div class="meta" style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip ' + degCls(rec.degree) + '">الدرجة ' + esc(rec.degree) + '</span>' +
      (rec.cat === 1 ? '<span class="chip dark">التنبيه ' + rec.alert + '</span>' : '<span class="chip red">بلاغ فوري</span>') + '</div></div>' +
      '<div class="act">' + esc(rec.action) + '</div>' +
      '<div class="sub">' + esc(rec.student) + ' • ' + esc(rec.section) + ' • ' + esc(subj(rec.subject)) + ' • ' + arFull(rec.date) + '</div>' +
      (needG && guardian ? '<div class="tel">' + ICON.phone + '<span>ولي الأمر: ' + esc(guardian.name) + ' • ' + tel(guardian.phone) + '</span></div>' : '') +
      (rec.transferRequired ? '<div class="note" style="background:#fff">بعد التوثيق تُحوَّل الحالة تلقائيًا إلى المشرفة الإدارية، وتصلها رسالة وتنبيه.</div>' : '') +
      '</div>' +
      '<form class="card grid g3" id="tdf" style="margin-top:14px">' +
      '<div class="field"><label class="lbl" for="tdone">هل نفّذتِ الإجراء؟</label><select class="inp" id="tdone"><option value="نعم"' + (rec.done !== 'لا' ? ' selected' : '') + '>نعم، نفّذته</option><option value="لا"' + (rec.done === 'لا' ? ' selected' : '') + '>ليس بعد</option></select></div>' +
      (needG ? '<div class="field"><label class="lbl" for="tct">التواصل مع ولي الأمر</label><select class="inp" id="tct">' + listOptions('التواصل مع ولي الأمر', rec.contact) + '</select></div>' +
        '<div class="field"><label class="lbl" for="tcd">تاريخ التواصل</label><select class="inp" id="tcd">' + datesOptions(rec.contactDate || '', rec.date) + '</select></div>' : '') +
      '<div class="field"><label class="lbl" for="tnt">ملاحظات (اختياري)</label><select class="inp" id="tnt">' + listOptions('ملاحظات المعلمة', rec.notes) + '</select></div>' +
      '<div class="field" style="grid-column:1/-1"><button class="btn wide" type="submit">' + (rec.transferRequired && !rec.transferNo ? 'حفظ التوثيق وتحويل الحالة للمشرفة' : 'حفظ التوثيق') + '</button></div>' +
      '</form>';
    $('#tdf', box).onsubmit = function (e) {
      e.preventDefault();
      var data = { id: rec.id, done: $('#tdone', box).value, notes: $('#tnt', box).value };
      if (needG) {
        data.contact = $('#tct', box).value; data.contactDate = $('#tcd', box).value;
        if (data.done === 'نعم' && !data.contact) { toast('السياسة تطلب التواصل مع ولي الأمر — اختاري طريقة التواصل', 'bad'); return; }
      }
      api('updateTeacher', data).then(function (r) {
        var i = S.boot.records.findIndex(function (x) { return x.id === rec.id; });
        if (i >= 0) S.boot.records[i] = r.record;
        var tr = r.transferred;
        box.innerHTML = '<div class="done-box"><b style="font-size:20px">✔ تم حفظ التوثيق</b>' +
          (tr ? '<span>تم تحويل الحالة رقم ' + esc(tr.transferNo) + ' إلى أ. ' + esc(tr.supervisors.join(' وأ. ')) + '، ووصلتها رسالة وتنبيه داخل المنصة ونسخة على بريدها.</span>' : '') +
          '<span class="tg">' + T1 + '</span></div>' +
          (onNew ? '<button class="btn wide" style="margin-top:14px" id="again">تسجيل مخالفة جديدة</button>' : '');
        if (onNew) $('#again', box).onclick = onNew;
        refresh(true);
      }).catch(fail);
    };
  }

  /* ---------- المعلمة: حالاتي ---------- */
  function vMine(el) {
    var recs = S.boot.records, f = S.filter.mine || 'todo';
    var flt = { todo: function (r) { return r.status.code !== 'done'; }, sent: function (r) { return !!r.transferNo; }, all: function () { return true; } };
    var list = recs.filter(flt[f]);
    el.innerHTML = '<div><h2 class="pt">حالاتي</h2><p class="sub">كل ما سجّلتِه، وما تم فيه بعد التحويل.</p></div>' +
      '<div class="opts">' + [['todo', 'بحاجة لتوثيق'], ['sent', 'المحوّلة للمشرفة'], ['all', 'الكل']].map(function (x) {
        return '<button class="opt" data-f="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + ' (' + recs.filter(flt[x[0]]).length + ')</button>';
      }).join('') + '</div>' +
      '<div class="items" id="ml">' + (list.length ? list.map(function (r) {
        var late = r.status.code === 'late';
        return '<article class="item' + (late ? ' late' : '') + (S.focus === r.id ? ' focus' : '') + '" id="it-' + esc(r.id) + '">' +
          '<div class="hd"><div><div class="nm">' + esc(r.student) + ' — ' + esc(r.section) + '</div><div class="row">' + esc(r.violation.replace(/^\(.+?\)\s*/, '')) + ' • ' + esc(subj(r.subject)) + ' • ' + arFull(r.date) + '</div></div>' +
          '<div class="meta"><span class="chip ' + (r.status.code === 'done' ? 'ok' : late ? 'red' : 'ap') + '">' + esc(r.status.text) + '</span>' +
          (r.cat === 1 ? '<span class="chip">التنبيه ' + r.alert + '</span>' : '<span class="chip red">بلاغ</span>') + (r.transferNo ? '<span class="chip tq">' + esc(r.transferNo) + '</span>' : '') + '</div></div>' +
          '<div class="req">' + esc(r.action) + '</div>' +
          (r.after ? '<div class="row">ما تم بعد التحويل: ' + esc(r.after) + '</div>' : '') +
          (r.status.code !== 'done' ? '<button class="btn sm" data-doc="' + esc(r.id) + '">وثّقي الآن</button><div id="dd-' + esc(r.id) + '"></div>' : '') + fixBar('trec', r) +
          '</article>';
      }).join('') : '<div class="empty"><span class="tg">' + T1 + '</span>لا توجد سجلات هنا</div>') + '</div>';
    $$('[data-f]', el).forEach(function (b) { b.onclick = function () { S.filter.mine = b.dataset.f; vMine(el); }; });
    $$('[data-doc]', el).forEach(function (b) {
      b.onclick = function () {
        var r = recs.filter(function (x) { return x.id === b.dataset.doc; })[0];
        b.remove();
        api('guardianFor', { id: r.id }).then(function (g) { docTeacher($('#dd-' + r.id, el), r, g.guardian, null); }).catch(fail);
      };
    });
    if (S.focus) { var fe = document.getElementById('it-' + S.focus); if (fe) { fe.scrollIntoView({ block: 'center' }); var bb = $('[data-doc]', fe); if (bb) bb.click(); } S.focus = ''; }
  }

  /* =====================================================
   *  المهام: المشرفة / المنسقة / الأخصائيتان / الإدارة
   * ===================================================== */
  var STAGE = { supervisor: 'المشرفة', coordinator: 'المنسقة', social: 'الاجتماعية', psych: 'النفسية', admin: 'الإدارة' };
  var CHAIN = ['supervisor', 'coordinator', 'social', 'psych', 'admin'];
  function myStage() { return S.me.role; }
  function stageChips(c) {
    return '<div class="timeline">' + CHAIN.filter(function (s) { return c.stages[s] && c.stages[s].need; }).map(function (s) {
      var st = c.stages[s], d = c.doc[s];
      var cls = st.documented ? 'ok' : st.late ? 'red' : st.open ? 'ap' : '';
      var txt = STAGE[s] + ': ' + (st.documented ? 'نُفّذ ' + ar(d.date) : st.late ? 'متأخر' : st.open ? 'بانتظار' : 'لم يحن دورها');
      return '<span class="chip ' + cls + '">' + txt + '</span>';
    }).join('') + '</div>';
  }
  function caseHead(c) {
    return '<div class="hd"><div><div class="nm">' + esc(c.student) + ' — ' + esc(c.section) + '</div>' +
      '<div class="row">' + esc(c.short) + ' • ' + arFull(c.date) + ' • ' + esc(c.source) + (c.teacher ? ' • المعلمة أ. ' + esc(c.teacher) : '') + '</div></div>' +
      '<div class="meta"><span class="chip ' + degCls(c.degree) + '">' + esc(c.degree) + '</span><span class="chip dark">التكرار ' + c.rep + '</span><span class="chip">' + esc(c.id) + '</span></div></div>';
  }
  function actionList(st) { return { coordinator: 'إجراءات المنسقة', social: 'إجراءات الاجتماعية', psych: 'إجراءات النفسية', admin: 'إجراءات الإدارة' }[st]; }
  function caseForm(c, st) {
    var s = c.stages[st];
    var f = '<form class="cf" data-id="' + esc(c.id) + '">' +
      '<div class="field"><label class="lbl">تاريخ التنفيذ</label><select class="inp" name="date">' + datesOptions(c.doc[st].date || '', s.start || c.date) + '</select></div>';
    if (st === 'supervisor') {
      f += c.req.guardian ? '<div class="field"><label class="lbl">التواصل مع ولي الأمر (مطلوب)</label><select class="inp" name="contact">' + listOptions('تواصل المشرفة', c.doc.supervisor.contact) + '</select></div>' : '';
      f += '<div class="field"><label class="lbl">ملاحظات (اختياري)</label><input class="inp" name="notes" value="' + esc(c.doc.supervisor.notes) + '" placeholder="مثل: سُلّم التعهد للمنسقة"></div>';
    } else {
      f += '<div class="field"><label class="lbl">الإجراء المتخذ</label><select class="inp" name="taken">' + listOptions(actionList(st), c.doc[st].action) + '</select></div>';
      f += '<div class="field"><label class="lbl">ملاحظات (اختياري)</label><input class="inp" name="notes" value="' + esc(c.doc[st].notes) + '"></div>';
    }
    f += '<div class="field" style="grid-column:1/-1"><button class="btn wide" type="submit">حفظ وتوثيق التنفيذ</button></div></form>';
    return f;
  }
  function caseCard(c, withForm) {
    var st = myStage(), s = c.stages[st] || {};
    var txt = c.text[st];
    return '<article class="item' + (s.late ? ' late' : '') + (S.focus === c.id ? ' focus' : '') + '" id="it-' + esc(c.id) + '">' + caseHead(c) +
      (c.teacherDid ? '<div class="row">ما قامت به المعلمة (' + esc(c.teacherAlert) + '): ' + esc(c.teacherDid) + '</div>' : '') +
      (c.guardian && (st !== 'supervisor' || c.req.guardian) ? '<div class="row">' + ICON.phone + ' ولي الأمر: ' + esc(c.guardian.split('☎')[0]) + ' • ' + tel((c.guardian.split('☎')[1] || '').trim()) + '</div>' : '') +
      (txt ? '<div class="req"><b>المطلوب منكِ حسب السياسة: </b>' + esc(txt) + '</div>' : '') +
      (st === 'supervisor' && c.req.pledge && c.req.coordinator ? '<div class="note">📎 بعد أخذ التعهد الخطي سلّميه للمنسقة، فهي الجهة التالية في هذه الحالة.</div>' : '') +
      stageChips(c) + (window.NamoosForms ? NamoosForms.buttons('case', c) : '') + fixBar('case', c) +
      (withForm ? '<div>' + (s.late ? '<span class="chip red">⛔ متأخر — آخر موعد كان ' + ar(s.due) + '</span>' : '<span class="chip ap">آخر موعد: ' + arFull(s.due) + '</span>') + '</div>' + caseForm(c, st) : '<div class="row">' + esc(c.status.text) + '</div>') +
      '</article>';
  }
  function bindCaseForms(el, after) {
    $$('form.cf', el).forEach(function (f) {
      f.onsubmit = function (e) {
        e.preventDefault();
        var d = { id: f.dataset.id, date: f.date.value, notes: f.notes ? f.notes.value : '' };
        if (f.contact) { d.contact = f.contact.value; if (!d.contact) { toast('السياسة تطلب التواصل مع ولي الأمر — اختاري طريقة التواصل', 'bad'); return; } }
        if (f.taken) { d.taken = f.taken.value; if (!d.taken) { toast('اختاري الإجراء المتخذ', 'bad'); return; } }
        api('documentCase', d).then(function (r) {
          var c = r.case;
          var i = S.boot.cases.findIndex(function (x) { return x.id === c.id; });
          if (i >= 0) S.boot.cases[i] = c; else S.boot.cases.push(c);
          var next = c.next ? 'انتقلت الحالة إلى ' + STAGE[c.next] + '، ووصلتها رسالة وتنبيه.' : 'اكتملت إجراءات الحالة. ' + T1 + '.';
          toast('✔ تم التوثيق — ' + next, 'ok', 6000);
          if (after) after(c);
          refresh(true);
        }).catch(fail);
      };
    });
  }
  function myOpenCases() {
    var st = myStage();
    return S.boot.cases.filter(function (c) { var s = c.stages[st]; return s && s.need && s.open && !s.documented; })
      .sort(function (a, b) { var la = a.stages[st].late ? 0 : 1, lb = b.stages[st].late ? 0 : 1; return la - lb || (a.date < b.date ? -1 : 1); });
  }
  function vTasks(el) {
    var list = myOpenCases();
    el.innerHTML = '<div><h2 class="pt">' + (S.me.role === 'supervisor' ? 'الوارد' : 'المهام') + '</h2><p class="sub">الحالات التي جاء دوركِ فيها حسب السياسة، والمتأخرة أولًا. بعد الحفظ تنتقل الحالة تلقائيًا للجهة التالية.</p></div>' +
      '<div class="items">' + (list.length ? list.map(function (c) { return caseCard(c, true); }).join('') :
        '<div class="empty card"><span class="tg">' + T3 + '</span>لا توجد مهام بانتظاركِ الآن</div>') + '</div>';
    bindCaseForms(el, function () { S.focus = (myOpenCases()[0] || {}).id || ''; vTasks(el); if (S.focus) { var n = document.getElementById('it-' + S.focus); if (n) n.scrollIntoView({ block: 'start', behavior: 'smooth' }); } });
    if (S.focus) { var fe = document.getElementById('it-' + S.focus); if (fe) setTimeout(function () { fe.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60); }
  }

  /* ---------- كل الحالات ---------- */
  function vCases(el) {
    var f = S.filter.cases || 'all', q = S.filter.q || '';
    var all = S.boot.cases.slice().reverse();
    var flt = { all: function () { return true; }, wait: function (c) { return c.status.code === 'wait'; }, late: function (c) { return c.status.code === 'late'; }, done: function (c) { return c.status.code === 'done'; } };
    var list = all.filter(flt[f]).filter(function (c) { return !q || norm(c.student + ' ' + c.section + ' ' + c.short + ' ' + c.id).indexOf(norm(q)) >= 0; });
    el.innerHTML = '<div><h2 class="pt">كل الحالات</h2><p class="sub">متابعة مسار كل حالة عند كل جهة.</p></div>' +
      '<div class="opts">' + [['all', 'الكل'], ['wait', 'بانتظار'], ['late', 'متأخرة'], ['done', 'مكتملة']].map(function (x) {
        return '<button class="opt" data-f="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + ' (' + all.filter(flt[x[0]]).length + ')</button>';
      }).join('') + '</div>' + searchList('cq', 'ابحثي باسم الطالبة أو الشعبة أو رقم الحالة') +
      '<div class="items" id="cl">' + (list.slice(0, 150).map(function (c) { return caseCard(c, false); }).join('') || '<div class="empty">لا توجد حالات</div>') + '</div>';
    var cq = $('#cq'); cq.value = q;
    cq.oninput = function () { S.filter.q = cq.value; var pos = cq.selectionStart; vCases(el); var n = $('#cq'); n.focus(); n.setSelectionRange(pos, pos); };
    $$('[data-f]', el).forEach(function (b) { b.onclick = function () { S.filter.cases = b.dataset.f; vCases(el); }; });
  }

  /* =====================================================
   *  المشرفة: مخالفة خارج الصف
   * ===================================================== */
  function vOutside(el) {
    var b = S.boot, O = S.out;
    if (!O.date) O.date = b.dates.indexOf(b.today) >= 0 ? b.today : b.dates[b.dates.length - 1];
    if (!O.section && b.sections.length === 1) O.section = b.sections[0];
    el.innerHTML = '<div><h2 class="pt">' + (S.me.role === 'admin' ? 'تسجيل مخالفة' : 'مخالفة خارج الصف') + '</h2><p class="sub">الطابور، الممرات، الحافلة، الهروب… تُسجَّل هنا ويظهر الإجراء حسب السياسة فورًا.</p></div>' +
      step(1, 'الشعبة', '<div class="opts">' + b.sections.map(function (s) { return '<button class="opt" data-s="' + s + '" aria-pressed="' + (O.section === s) + '">' + s + '</button>'; }).join('') + '</div>', O.section ? 'done' : '') +
      step(2, 'التاريخ', '<select class="inp" id="od">' + datesOptions(O.date) + '</select>', O.section ? 'done' : 'locked') +
      step(3, 'الطالبة', searchList('osq', 'ابحثي باسم الطالبة') + '<div class="list" id="osl"></div>', !O.section ? 'locked' : O.student ? 'done' : '') +
      step(4, 'المخالفة حسب السياسة', searchList('ovq', 'ابحثي عن المخالفة: هروب، مظهر، هاتف، حافلة…') + '<div class="list" id="ovl"></div>', !O.student ? 'locked' : O.violation ? 'done' : '') +
      '<button class="btn wide" id="osave" ' + (O.section && O.student && O.violation ? '' : 'disabled') + '>تسجيل المخالفة</button><div id="ores"></div>';
    $$('[data-s]', el).forEach(function (x) { x.onclick = function () { O.section = x.dataset.s; O.student = ''; vOutside(el); $('#osq').focus(); }; });
    $('#od').onchange = function () { O.date = this.value; };
    if (O.section) { var ds = function () { studentList($('#osl'), b.students[O.section] || [], O.student, $('#osq').value, function (n) { O.student = n; vOutside(el); $('#ovq').focus(); }); }; $('#osq').oninput = ds; ds(); }
    if (O.student) { var dv = function () { violationList($('#ovl'), b.violations, O.violation, $('#ovq').value, function (v) { O.violation = v; vOutside(el); $('#osave').scrollIntoView({ block: 'center', behavior: 'smooth' }); }); }; $('#ovq').oninput = dv; dv(); }
    $('#osave').onclick = function () {
      api('createCase', { section: O.section, date: O.date, student: O.student, violation: O.violation }).then(function (r) {
        var c = r.case; S.boot.cases.push(c);
        O.student = ''; O.violation = '';
        var mine = c.stages[myStage()] && c.stages[myStage()].need && c.stages[myStage()].open;
        el.innerHTML = '<div><h2 class="pt">تم تسجيل الحالة ' + esc(c.id) + '</h2><p class="sub">' + (mine ? 'الخطوة التالية: نفّذي إجراءكِ ثم وثّقيه هنا.' : 'لا يوجد إجراء مطلوب منكِ في هذه الحالة حسب السياسة.') + '</p></div>' +
          '<div class="items">' + caseCard(c, mine) + '</div><button class="btn sec wide" id="onew">تسجيل مخالفة أخرى</button>';
        bindCaseForms(el, function () { vOutside(el); });
        $('#onew').onclick = function () { vOutside(el); };
        refresh(true);
      }).catch(fail);
    };
  }


  /* =====================================================
   *  التعديل والحذف — لكل السجلات
   * ===================================================== */
  function canFix(kind, o) {
    var r = S.me.role, me = S.me.name;
    if (r === 'admin') return true;
    if (kind === 'trec') return r === 'teacher';
    if (kind === 'case') return o.by === me || (r === 'supervisor' && (S.boot.sections || []).indexOf(o.section) >= 0);
    if (kind === 'abs') return o.by === me || r === 'supervisor';
    if (kind === 'tardy') return true;
    return false;
  }
  function myDocDone(kind, o) { var st = myStage(); return o.doc && o.doc[st] && o.doc[st].date && o.stages && o.stages[st] && o.stages[st].need; }
  function fixBar(kind, o) {
    var core = canFix(kind, o), doc = kind !== 'trec' && myDocDone(kind, o);
    if (!core && !doc) return '';
    return '<div class="fx-bar"><button type="button" class="btn sm sec" data-fx-edit="' + kind + '" data-fx-id="' + esc(o.id) + '">✏️ تعديل</button>' +
      (core ? '<button type="button" class="btn sm sec fx-del" data-fx-del="' + kind + '" data-fx-id="' + esc(o.id) + '">🗑 حذف</button>' : '') + '</div>';
  }
  function fxFind(kind, id) {
    var b = S.boot;
    var arr = kind === 'case' ? b.cases : kind === 'trec' ? b.records : kind === 'tardy' ? b.tardy : (b.abs && b.abs.records);
    return (arr || []).filter(function (x) { return x.id === id; })[0];
  }
  function fxClose() { var m = document.getElementById('fx'); if (m) m.remove(); document.body.classList.remove('nf-open'); }
  function fxDone(msg) { fxClose(); toast(msg || '✔ تم الحفظ', 'ok'); refresh(true); }
  function fxOpen(kind, id) {
    var o = fxFind(kind, id); if (!o) { toast('لم أجد السجل — حدّثي الصفحة', 'bad'); return; }
    var core = canFix(kind, o), st = myStage(), b = S.boot, h = '';
    var title = { case: 'تعديل الحالة ' + o.id, trec: 'تعديل سجل المخالفة', abs: 'تعديل سجل الغياب', tardy: 'تعديل سجل التأخير' }[kind];
    if (core) {
      h += '<form class="card grid g2" id="fx-core"><div class="field"><label class="lbl" for="fx-date">' + (kind === 'abs' ? 'تاريخ الغياب' : kind === 'tardy' ? 'تاريخ التأخير' : 'تاريخ المخالفة') + '</label><select class="inp" id="fx-date">' + datesOptions(o.date) + '</select></div>';
      if (kind === 'case' || kind === 'trec') {
        var cur = kind === 'case' ? o.violation : o.violation;
        h += '<div class="field"><label class="lbl" for="fx-v">المخالفة</label><select class="inp" id="fx-v">' + (b.violations || []).map(function (v) { return '<option' + (v.label === cur ? ' selected' : '') + '>' + esc(v.label) + '</option>'; }).join('') + '</select></div>';
      }
      if (kind === 'abs' && (S.me.role === 'supervisor' || S.me.role === 'admin') && o.kind !== 'late') {
        h += '<div class="field"><label class="lbl" for="fx-d">قرار المشرفة</label><select class="inp" id="fx-d"><option value="">— دون تغيير —</option>' + ['بدون عذر', 'بعذر', 'عذر قيد الاستلام'].map(function (d) { return '<option' + (d === o.decision ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label class="lbl" for="fx-e">نوع العذر (عند «بعذر»)</label><select class="inp" id="fx-e"><option value="">—</option>' + (AB().excuses || []).map(function (x) { return '<option' + (x === o.excuse ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>';
      }
      h += '<div class="field" style="grid-column:1/-1"><button class="btn wide" type="submit">حفظ التعديل</button></div></form>';
    }
    if (kind === 'case' && myDocDone(kind, o)) h += '<div class="card"><h3 style="margin:0 0 8px">تعديل توثيقي</h3>' + caseForm(o, st) + '</div>';
    if (kind === 'abs' && myDocDone(kind, o)) h += '<div class="card"><h3 style="margin:0 0 8px">تعديل توثيقي</h3>' + absForm(o, st) + '</div>';
    if (kind === 'trec' && o.done) h += '<div class="card"><h3 style="margin:0 0 8px">تعديل توثيقي</h3><div id="fx-tdoc"><button class="btn sm" id="fx-tdocb" type="button">افتحي التوثيق</button></div></div>';
    var m = document.createElement('div'); m.id = 'fx';
    m.innerHTML = '<div class="nf-back"></div><div class="fx-dlg" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="nf-bar"><b>' + esc(title) + ' — ' + esc(o.student) + '</b><button class="btn sec" id="fx-x" type="button">إغلاق</button></div><div class="fx-body">' + h + '</div></div>';
    document.body.appendChild(m); document.body.classList.add('nf-open');
    $('#fx-x').onclick = fxClose; m.querySelector('.nf-back').onclick = fxClose;
    var body = m.querySelector('.fx-body');
    bindCaseForms(body, function () { fxClose(); });
    bindAbsForms(body, function () { fxClose(); });
    var tb = $('#fx-tdocb'); if (tb) tb.onclick = function () { api('guardianFor', { id: o.id }).then(function (g) { docTeacher($('#fx-tdoc'), o, g.guardian, null); }).catch(fail); };
    var cf = $('#fx-core');
    if (cf) cf.onsubmit = function (e) {
      e.preventDefault();
      var d = { id: o.id }, nd = $('#fx-date').value; if (nd && nd !== o.date) d.date = nd;
      var vv = $('#fx-v'); if (vv && vv.value !== o.violation) d.violation = vv.value;
      var p = Promise.resolve(), any = false;
      if (kind === 'case' && (d.date || d.violation)) { any = true; p = api('editCase', d); }
      if (kind === 'trec' && (d.date || d.violation)) { any = true; p = api('editTeacher', d); }
      if (kind === 'tardy' && d.date) { any = true; p = api('editTardy', d); }
      if (kind === 'abs') {
        if (d.date) { any = true; p = api('editAbsence', d); }
        var dd = $('#fx-d');
        if (dd && dd.value && (dd.value !== o.decision || ($('#fx-e').value || '') !== (o.excuse || ''))) {
          if (dd.value === 'بعذر' && !$('#fx-e').value) { toast('اختاري نوع العذر', 'bad'); return; }
          any = true; p = p.then(function () { return api('decideAbsence', { items: [{ id: o.id, decision: dd.value, excuse: $('#fx-e').value }] }); });
        }
      }
      if (!any) { toast('لم يتغير شيء', 'bad'); return; }
      p.then(function () { fxDone('✔ تم حفظ التعديل — وأُعيد حساب التكرار والإجراءات تلقائيًا'); }).catch(fail);
    };
  }
  function fxDelete(kind, id) {
    var o = fxFind(kind, id); if (!o) return;
    var msg = kind === 'trec' && o.transferNo ? 'حذف هذا السجل؟ سيُحذف معه التحويل ' + o.transferNo + ' والحالة المرتبطة به عند المشرفة.' : 'حذف هذا السجل نهائيًا من الإحصاءات؟';
    if (!confirm(msg)) return;
    var a = { case: 'deleteCase', trec: 'deleteTeacher', abs: 'deleteAbsence', tardy: 'deleteTardy' }[kind];
    api(a, { id: id }).then(function () { fxDone('✔ تم الحذف'); }).catch(fail);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-fx-edit],[data-fx-del]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.dataset.fxEdit) fxOpen(t.dataset.fxEdit, t.dataset.fxId); else fxDelete(t.dataset.fxDel, t.dataset.fxId);
  }, true);

  /* ---------- التأخير الصباحي ---------- */
  function vTardy(el) {
    var b = S.boot, T = S.tardy;
    if (!T.date) T.date = b.dates.indexOf(b.today) >= 0 ? b.today : b.dates[b.dates.length - 1];
    T.sel = T.sel || {};
    var recent = (b.tardy || []).slice().sort(function (x, y) { return (y.created || '') < (x.created || '') ? -1 : (y.created || '') > (x.created || '') ? 1 : 0; }).slice(0, 40);
    var fresh = T.fresh || {};
    el.innerHTML = '<div><h2 class="pt">التأخير الصباحي</h2><p class="sub">اختاري الشعبة، ثم أشّري على كل المتأخرات دفعة واحدة.</p></div>' +
      '<div class="card grid g2"><div class="field"><label class="lbl" for="tdd">التاريخ</label><select class="inp" id="tdd">' + datesOptions(T.date) + '</select></div>' +
      '<div class="field"><label class="lbl" for="tds">الشعبة</label><select class="inp" id="tds"><option value="">— اختاري —</option>' + b.sections.map(function (s) { return '<option' + (T.section === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></div>' +
      (T.section ? searchList('tq', 'ابحثي باسم الطالبة') + '<div class="list" id="tl"></div>' +
        '<button class="btn wide" id="tsave">تسجيل التأخير (' + Object.keys(T.sel).length + ')</button>' : '') +
      '<div class="card"><h3 style="margin:0 0 10px">آخر ما سُجّل</h3><div class="tw"><table class="t"><thead><tr><th>التاريخ</th><th>الطالبة</th><th>الشعبة</th><th>رقم التأخير</th><th></th></tr></thead><tbody>' +
      (recent.map(function (r) { return '<tr' + (fresh[r.id] ? ' style="background:var(--ok-l)"' : '') + '><td>' + (r.date ? arFull(r.date) : 'سجل سابق بلا تاريخ') + '</td><td>' + esc(r.student) + '</td><td>' + esc(r.section) + '</td><td><span class="chip ' + (r.n > 1 ? 'ap' : '') + '">' + r.n + '</span></td><td>' + (r.by === S.me.name || S.me.role === 'admin' ? '<button class="btn sm sec" data-del="' + esc(r.id) + '">حذف</button>' : '') + '</td></tr>'; }).join('') || '<tr><td colspan="5">لا توجد سجلات</td></tr>') +
      '</tbody></table></div></div>';
    $('#tdd').onchange = function () { T.date = this.value; };
    $('#tds').onchange = function () { T.section = this.value; T.sel = {}; vTardy(el); };
    if (T.section) {
      var draw = function () {
        var qn = norm($('#tq').value);
        $('#tl').innerHTML = (b.students[T.section] || []).filter(function (n) { return !qn || norm(n).indexOf(qn) >= 0; }).map(function (n) {
          return '<button type="button" data-t="' + esc(n) + '" aria-pressed="' + !!T.sel[n] + '"><span>' + esc(n) + '</span><span>' + (T.sel[n] ? '✔' : '') + '</span></button>';
        }).join('');
        $$('[data-t]', $('#tl')).forEach(function (x) { x.onclick = function () { var n = x.dataset.t; if (T.sel[n]) delete T.sel[n]; else T.sel[n] = 1; draw(); $('#tsave').textContent = 'تسجيل التأخير (' + Object.keys(T.sel).length + ')'; }; });
      };
      $('#tq').oninput = draw; draw();
      $('#tsave').onclick = function () {
        var list = Object.keys(T.sel);
        if (!list.length) { toast('أشّري على الطالبات المتأخرات', 'bad'); return; }
        var btn = this; if (btn.disabled) return;
        btn.disabled = true; btn.textContent = 'جارٍ الحفظ… انتظري لحظة';
        api('recordTardy', { section: T.section, date: T.date || $('#tdd').value, students: list }).then(function (r) {
          b.tardy = r.tardy; T.sel = {}; if (r.added) { T.fresh = {}; (r.ids || []).forEach(function (id) { T.fresh[id] = 1; }); }
          var msg = r.added ? '✔ حُفظ ' + r.added + ' ' + (r.added === 1 ? 'تأخير' : 'حالات تأخير') + ' — يظهر باللون الأخضر في «آخر ما سُجّل»' : '';
          if (r.skipped && r.skipped.length) msg += (msg ? '\n' : '') + '↺ مسجّلة مسبقًا لهذا اليوم: ' + r.skipped.join('، ');
          toast(msg, r.added ? 'ok' : 'bad', 7000); vTardy(el);
        }).catch(function (e) { btn.disabled = false; btn.textContent = 'تسجيل التأخير (' + list.length + ')'; fail(e); });
      };
    }
    $$('[data-del]', el).forEach(function (x) {
      x.onclick = function () { if (!confirm('حذف هذا السجل؟')) return; api('deleteTardy', { id: x.dataset.del }).then(function () { b.tardy = b.tardy.filter(function (r) { return r.id !== x.dataset.del; }); vTardy(el); }).catch(fail); };
    });
  }

  /* =====================================================
   *  الرسائل
   * ===================================================== */
  function vMessages(el) {
    el.innerHTML = '<div><h2 class="pt">الرسائل</h2><p class="sub">تصل الرسالة داخل المنصة مع تنبيه صوتي، ونسخة على البريد الرسمي.</p></div><div id="mx"></div>';
    api('messages').then(function (r) {
      var tab = S.filter.msg || 'inbox';
      var staff = S.boot.staff.filter(function (u) { return u.name !== S.me.name; });
      var to = {};
      var box = $('#mx');
      box.innerHTML = '<div class="opts">' + [['inbox', 'الوارد (' + r.inbox.filter(function (m) { return !m.read; }).length + ' جديدة)'], ['new', 'رسالة جديدة'], ['sent', 'المرسلة']].map(function (x) {
        return '<button class="opt" data-t="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + x[1] + '</button>';
      }).join('') + '</div><div id="mb" style="margin-top:12px"></div>';
      $$('[data-t]', box).forEach(function (b) { b.onclick = function () { S.filter.msg = b.dataset.t; vMessages(el); }; });
      var mb = $('#mb');
      if (tab === 'new') {
        mb.innerHTML = '<form class="card grid" id="mf">' +
          '<div class="field"><label class="lbl" for="mto">إلى</label>' + searchList('mto', 'ابحثي بالاسم أو الصفة') + '<div class="recips" id="mrc" style="margin-top:8px"></div><div class="list" id="mtl" style="max-height:220px;margin-top:8px"></div></div>' +
          '<div class="field"><label class="lbl" for="ms">الموضوع</label><input class="inp" id="ms" required></div>' +
          '<div class="field"><label class="lbl" for="mbd">النص</label><textarea class="inp" id="mbd" required></textarea></div>' +
          '<button class="btn wide" type="submit">إرسال</button></form>';
        var drawTo = function () {
          var qn = norm($('#mto').value);
          $('#mtl').innerHTML = staff.filter(function (u) { return !qn || norm(u.name + ' ' + u.roleLabel).indexOf(qn) >= 0; }).slice(0, 60).map(function (u) {
            return '<button type="button" data-n="' + esc(u.name) + '" aria-pressed="' + !!to[u.name] + '"><span>' + esc(u.name) + '</span><span class="chip">' + esc(u.roleLabel) + '</span></button>';
          }).join('');
          $('#mrc').innerHTML = Object.keys(to).map(function (n) { return '<span class="chip tq">' + esc(n) + '</span>'; }).join('');
          $$('[data-n]', $('#mtl')).forEach(function (x) { x.onclick = function () { var n = x.dataset.n; if (to[n]) delete to[n]; else to[n] = 1; drawTo(); }; });
        };
        $('#mto').oninput = drawTo; drawTo();
        $('#mf').onsubmit = function (e) {
          e.preventDefault();
          if (!Object.keys(to).length) { toast('اختاري المرسَل إليها', 'bad'); return; }
          api('sendMessage', { to: Object.keys(to), subject: $('#ms').value, body: $('#mbd').value }).then(function (x) { toast('✔ تم الإرسال إلى ' + x.sent, 'ok'); S.filter.msg = 'sent'; vMessages(el); }).catch(fail);
        };
      } else {
        var list = tab === 'inbox' ? r.inbox : r.sent;
        mb.innerHTML = '<div class="items">' + (list.map(function (m) {
          return '<div class="msg' + (tab === 'inbox' && !m.read ? ' unread' : '') + '" data-m="' + esc(m.id) + '" tabindex="0">' +
            '<div class="hd" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>' + esc(m.subject) + '</b><span class="sub">' + esc(tab === 'inbox' ? m.from : 'إلى: ' + m.to) + ' • ' + esc(ar(m.time.slice(0, 10))) + ' ' + esc(m.time.slice(11, 16)) + '</span></div>' +
            '<div class="body hidden">' + esc(m.body) + '</div>' +
            (m.caseId && S.me.role !== 'teacher' ? '<button class="btn sm sec hidden" data-case="' + esc(m.caseId) + '">فتح الحالة ' + esc(m.caseId) + '</button>' : '') +
            '</div>';
        }).join('') || '<div class="empty">لا توجد رسائل</div>') + '</div>' +
          (tab === 'inbox' && r.inbox.some(function (m) { return !m.read; }) ? '<button class="btn sec" id="mall" style="margin-top:10px">تحديد الكل كمقروء</button>' : '');
        $$('.msg', mb).forEach(function (x) {
          x.onclick = function (e) {
            if (e.target.dataset.case) {
              S.focus = e.target.dataset.case;
              if (S.focus.indexOf('غ-') === 0) return setSec('abs', absOpen().some(function (a) { return a.id === S.focus; }) ? 'absTasks' : 'absLog');
              return setSec('beh', myOpenCases().some(function (c) { return c.id === S.focus; }) ? 'tasks' : 'cases');
            }
            $$('.body,[data-case]', x).forEach(function (n) { n.classList.toggle('hidden'); });
            if (x.classList.contains('unread')) { x.classList.remove('unread'); api('markRead', { ids: [x.dataset.m] }, true).then(function (q) { S.last.unread = q.unread; setBadges(q.unread, S.last.tasks); }); }
          };
        });
        var ma = $('#mall'); if (ma) ma.onclick = function () { api('markRead', { ids: 'all' }).then(function (q) { S.last.unread = 0; setBadges(0, S.last.tasks); vMessages(el); }); };
      }
    }).catch(fail);
  }

  /* =====================================================
   *  لوحة التحكم
   * ===================================================== */
  var SCHOOL_MONTHS = ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06'];
  function monthLabel(m) { var p = m.split('-'); return MONTHS[Number(p[1]) - 1] + ' ' + p[0]; }
  function monthRange(m) { if (!m) return { from: '', to: '' }; return { from: m + '-01', to: m + '-31' }; }
  function bars(list, label) {
    var mx = Math.max.apply(null, list.map(function (x) { return x.n; }).concat([1]));
    return list.map(function (x) { return '<div class="barrow"><span>' + esc(label ? label(x.k) : x.k) + '</span><div class="bar" style="width:' + Math.max(2, Math.round(100 * x.n / mx)) + '%"></div><b>' + x.n + '</b></div>'; }).join('') || '<div class="sub">لا توجد بيانات</div>';
  }
  function vDash(el) {
    var per = S.dashPeriod;
    el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px"><div><h2 class="pt">' + (S.me.role === 'admin' ? 'لوحة التحكم' : 'لوحة شعبي') + '</h2><p class="sub">مؤشرات السلوك والانضباط والالتزام بتنفيذ الإجراءات.</p></div>' +
      '<select class="inp" id="dp" style="width:auto"><option value="">كل العام الدراسي</option>' + SCHOOL_MONTHS.map(function (m) { return '<option value="' + m + '"' + (per === m ? ' selected' : '') + '>' + monthLabel(m) + '</option>'; }).join('') + '</select></div><div id="dx"></div>';
    $('#dp').onchange = function () { S.dashPeriod = this.value; vDash(el); };
    api('dashboard', monthRange(per)).then(function (d) {
      var t = d.tiles;
      var mx = Math.max.apply(null, d.months.map(function (m) { return Math.max(m.cases, m.classroom, m.tardy); }).concat([1]));
      $('#dx').innerHTML =
        '<div class="grid g4">' +
        [['الطالبات', t.students], ['مرات التأخير الصباحي', t.tardy], ['المتأخرات', t.tardyStudents], ['تكرر تأخرهن', t.tardyRepeat],
          ['المخالفات الرسمية', t.cases], ['مخالفات جسيمة (3 و 4)', t.serious, 1], ['متكررات المخالفة', t.repeatOffenders], ['حالات بانتظار إجراء', t.pending],
          ['حالات متأخرة', t.lateCases, 1], ['مخالفات صفية (معلمات)', t.classroom], ['تحويلات للمشرفات', t.transfers]].map(function (x) {
          return '<div class="tile' + (x[2] && x[1] ? ' warn' : '') + '"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>';
        }).join('') + '</div>' +
        '<div class="card"><h3 style="margin:0 0 6px">التحليل الشهري</h3><div class="sub">الفيروزي: المخالفات الرسمية • المشمشي: التأخير الصباحي</div><div class="cols">' + d.months.map(function (m) {
          return '<div class="c"><div style="display:flex;gap:3px;align-items:flex-end;height:130px;width:100%;justify-content:center"><i style="height:' + Math.round(120 * m.cases / mx) + 'px" title="' + m.cases + '"></i><i class="ap" style="height:' + Math.round(120 * m.tardy / mx) + 'px" title="' + m.tardy + '"></i></div>' + MONTHS[Number(m.m.split('-')[1]) - 1].slice(0, 5) + '</div>';
        }).join('') + '</div></div>' +
        '<div class="grid g2"><div class="card"><h3 style="margin:0 0 10px">حسب الدرجة</h3>' + bars(d.byDegree) + '</div>' +
        '<div class="card"><h3 style="margin:0 0 10px">مقارنة الصفوف</h3><div class="tw"><table class="t"><thead><tr><th>الصف</th><th>الطالبات</th><th>رسمية</th><th>صفية</th><th>تأخير</th></tr></thead><tbody>' +
        d.byGrade.map(function (g) { return '<tr><td>' + { 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر' }[g.k] + '</td><td>' + g.students + '</td><td>' + g.cases + '</td><td>' + g.classroom + '</td><td>' + g.tardy + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>' +
        '<div class="grid g2"><div class="card"><h3 style="margin:0 0 10px">أكثر الشعب مخالفات</h3>' + bars(d.topSections) + '</div><div class="card"><h3 style="margin:0 0 10px">أكثر المخالفات تكرارًا</h3>' + bars(d.topViolations) + '</div></div>' +
        '<div class="grid g2"><div class="card"><h3 style="margin:0 0 10px">أكثر الطالبات مخالفات</h3>' + bars(d.topStudents) + '</div><div class="card"><h3 style="margin:0 0 10px">أكثر الطالبات تأخرًا</h3>' + bars(d.topTardy) + '</div></div>' +
        '<div class="card"><h3 style="margin:0 0 10px">الالتزام بتنفيذ الإجراءات بالأسماء</h3><div class="tw"><table class="t"><thead><tr><th>الاسم</th><th>الصفة</th><th>المطلوب</th><th>في الوقت</th><th>متأخر</th><th>لم يُنفّذ</th><th>ضمن المهلة</th><th>نسبة الالتزام</th></tr></thead><tbody>' +
        (d.compliance.map(function (c) { var base = c.req - c.within; return '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.role) + '</td><td>' + c.req + '</td><td>' + c.onTime + '</td><td>' + c.late + '</td><td>' + c.notDone + '</td><td>' + c.within + '</td><td><b>' + (base ? Math.round(100 * c.onTime / base) + '%' : '—') + '</b></td></tr>'; }).join('') || '<tr><td colspan="8">لا توجد إجراءات في الفترة</td></tr>') + '</tbody></table></div></div>' +
        (d.late.length ? '<div class="card"><h3 style="margin:0 0 10px">⛔ حالات متأخرة</h3><div class="items">' + d.late.map(function (c) { return '<div class="task late"><div><b>' + esc(c.student) + ' — ' + esc(c.section) + '</b><div class="sub">' + esc(c.short) + ' • ' + esc(c.id) + ' • ' + esc(c.status) + '</div></div></div>'; }).join('') + '</div></div>' : '') +
        (d.critical.length ? '<div class="card"><h3 style="margin:0 0 10px">الحالات الحرجة</h3><div class="items">' + d.critical.map(function (c) { return '<div class="task"><div><b>' + esc(c.student) + ' — ' + esc(c.section) + '</b><div class="sub">' + esc(c.short) + ' • ' + esc(c.degree) + ' • التكرار ' + c.rep + ' • ' + esc(c.status) + '</div></div></div>'; }).join('') + '</div></div>' : '');
    }).catch(fail);
  }

  /* =====================================================
   *  التقرير الشهري
   * ===================================================== */
  function num(n, one, two, few, many) { return n === 0 ? 'لا ' + few : n === 1 ? one : n === 2 ? two : n <= 10 ? n + ' ' + few : n + ' ' + many; }
  function vReport(el) {
    var m = S.reportMonth || (S.boot.today || '').slice(0, 7);
    var i = SCHOOL_MONTHS.indexOf(m), prev = i > 0 ? SCHOOL_MONTHS[i - 1] : '';
    el.innerHTML = '<div class="noprint" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px"><div><h2 class="pt">التقرير الشهري</h2><p class="sub">يُكتب تلقائيًا من بيانات المنصة، وجاهز للطباعة.</p></div>' +
      '<div style="display:flex;gap:8px"><select class="inp" id="rm" style="width:auto">' + SCHOOL_MONTHS.map(function (x) { return '<option value="' + x + '"' + (x === m ? ' selected' : '') + '>' + monthLabel(x) + '</option>'; }).join('') + '</select><button class="btn" id="rp">طباعة</button></div></div><div id="rx"></div>';
    $('#rm').onchange = function () { S.reportMonth = this.value; vReport(el); };
    $('#rp').onclick = function () { window.print(); };
    Promise.all([api('dashboard', monthRange(m)), prev ? api('dashboard', monthRange(prev), true) : Promise.resolve(null),
      api('absDashboard', monthRange(m), true), prev ? api('absDashboard', monthRange(prev), true) : Promise.resolve(null)]).then(function (res) {
      var d = res[0], p = res[1], t = d.tiles, ad = res[2], ap = res[3], at = ad.tiles, apt = ap ? ap.tiles : {};
      d.compliance = d.compliance.concat(ad.compliance.map(function (c) { return Object.assign({}, c, { role: c.role + ' (الغياب)' }); }));
      var cmp = function (a, b) { if (!p) return '—'; return a > b ? '▲ ارتفاع' : a < b ? '▼ انخفاض' : '= ثابت'; };
      var good = d.compliance.filter(function (c) { return c.req - c.within > 0 && c.late + c.notDone === 0; });
      var late = d.compliance.filter(function (c) { return c.late + c.notDone > 0; });
      var gName = function (c) { return c.role === 'الإدارة' ? 'الإدارة' : 'أ. ' + c.name; };
      var absNarr = at.total ? ' وفي جانب الحضور سُجّل ' + num(at.total, 'يوم غياب واحد', 'يوما غياب', 'أيام غياب', 'يوم غياب') + ' بنسبة غياب ' + at.rate + '%، منها ' + at.U + ' بدون عذر و' + at.E + ' بعذر' + (at.P + at.undecided ? ' و' + (at.P + at.undecided) + ' قيد العذر أو القرار' : '') + (at.denied ? '، وبلغ عدد الطالبات غير المؤهلات لدخول الاختبار وفق المادة 3.4.1.3 (' + at.denied + ')' : '') + '.' : ' ولم يُسجَّل غياب خلال الشهر.';
      var narrative = (t.cases + t.classroom + t.tardy === 0) ? 'لم تُسجَّل خلال شهر ' + monthLabel(m) + ' مخالفات أو حالات تأخير.' :
        'خلال شهر ' + monthLabel(m) + ' تم تسجيل ' + num(t.classroom, 'مخالفة صفية واحدة', 'مخالفتين صفيتين', 'مخالفات صفية', 'مخالفة صفية') + ' من المعلمات، وتحويل ' + t.transfers + ' منها إلى المشرفات الإداريات، وتسجيل ' +
        num(t.cases, 'مخالفة سلوكية رسمية واحدة', 'مخالفتين سلوكيتين رسميتين', 'مخالفات سلوكية رسمية', 'مخالفة سلوكية رسمية') + '، و' + num(t.tardy, 'حالة تأخير صباحي واحدة', 'حالتي تأخير صباحي', 'حالات تأخير صباحي', 'حالة تأخير صباحي') + '. ' +
        (d.topViolations.length ? 'وتوزعت المخالفات حسب النوع كالآتي: ' + d.topViolations.map(function (v) { return '«' + v.k + '» (' + v.n + ')'; }).join('، ') + '. ' : '') +
        (late.length ? 'وتم اتخاذ الإجراءات اللازمة وفق السياسة، إلا أنه لوحظ تأخر في تنفيذ الإجراءات أو توثيقها لدى: ' + late.map(function (c) { return gName(c) + ' (' + (c.late ? 'متأخر: ' + c.late : '') + (c.late && c.notDone ? ' • ' : '') + (c.notDone ? 'لم يُنفّذ: ' + c.notDone : '') + ')'; }).join('، ') + '، وذلك وفق المهلة المعتمدة (' + (S.boot.deadlineDays === 2 ? 'يومان دراسيان' : S.boot.deadlineDays + ' أيام دراسية') + ').' : 'وتم اتخاذ الإجراءات اللازمة وفق السياسة في الوقت المحدد، دون رصد أي تأخر.');
      narrative += absNarr;
      var row = function (lab, a, b) { return '<tr><td>' + lab + '</td><td>' + a + '</td><td>' + (p ? b : '—') + '</td><td>' + cmp(a, b) + '</td></tr>'; };
      var pt = p ? p.tiles : {};
      var recs = [];
      recs.push(late.length ? 'متابعة الالتزام بالمهلة المعتمدة لتنفيذ الإجراءات وتوثيقها، ومراجعة الحالات المتأخرة مع المعنيات.' : 'الاستمرار في الالتزام المتميز بتنفيذ الإجراءات وتوثيقها في الوقت المحدد.');
      recs.push(d.topSections.length ? 'تفعيل خطة لتعزيز السلوك الإيجابي في الشعب الأعلى تكرارًا للمخالفات (' + d.topSections.slice(0, 2).map(function (x) { return x.k; }).join('، ') + ') بالتنسيق مع المشرفات والأخصائيتين الاجتماعيتين.' : 'المحافظة على مستوى الانضباط في جميع الشعب.');
      recs.push(d.topViolations.length ? 'تنفيذ برامج توعوية وقائية للحد من مخالفة «' + d.topViolations[0].k + '» بوصفها الأكثر تكرارًا خلال الشهر.' : 'مواصلة البرامج الوقائية للمخالفات الصفية.');
      recs.push(at.U ? 'متابعة الطالبات المتكرر غيابهن بدون عذر' + (ad.topStudents.length ? ' (ومنهن ' + ad.topStudents.slice(0, 2).map(function (x) { return x.k; }).join('، ') + ')' : '') + ' مع أولياء الأمور والأخصائيتين، وإخطار ' + (at.risk ? 'أولياء أمور المعرّضات للحرمان (' + at.risk + ') قبل الاختبار القادم.' : 'أولياء الأمور بحدود الأهلية للاختبارات.') : 'تكريم الطالبات المنتظمات في الحضور وتعزيز الانضباط.');
      recs.push(t.tardyRepeat ? 'متابعة الطالبات المتكرر تأخرهن صباحًا (' + t.tardyRepeat + ') مع أولياء الأمور.' : 'تكريم الطالبات المنضبطات وتعزيز السلوك الإيجابي.');
      $('#rx').innerHTML = '<article class="report">' +
        '<h1>مدرسة الشيماء الثانوية للبنات</h1><div style="text-align:center;font-weight:700;margin-top:6px">التقرير الشهري لمتابعة السلوك والانضباط والحضور والالتزام بتنفيذ الإجراءات — ' + monthLabel(m) + '</div>' +
        '<div class="verse" style="text-align:center;color:var(--tq);font-size:20px;margin-top:8px">' + VERSE2 + '</div>' +
        '<div style="text-align:center;color:var(--mut);font-size:13px">العام الدراسي 2026 – 2027 • ' + T3 + '</div>' +
        '<p style="background:var(--ap-l);padding:14px 16px;border-radius:8px;margin-top:18px">' + esc(narrative) + '</p>' +
        '<h2>أولًا: ملخص الشهر</h2><div class="tw"><table class="t"><thead><tr><th>البند</th><th>الشهر الحالي</th><th>الشهر السابق</th><th>التغيّر</th></tr></thead><tbody>' +
        row('المخالفات الصفية المسجّلة من المعلمات', t.classroom, pt.classroom) + row('التحويلات للمشرفات', t.transfers, pt.transfers) + row('المخالفات السلوكية الرسمية', t.cases, pt.cases) +
        row('مخالفات جسيمة (الدرجتان 3 و4)', t.serious, pt.serious) + row('حالات التأخير الصباحي', t.tardy, pt.tardy) + '</tbody></table></div>' +
        '<h2>ثانيًا: المخالفات الرسمية حسب الدرجة</h2><div class="tw"><table class="t"><thead><tr><th>الدرجة</th><th>العدد</th></tr></thead><tbody>' + d.byDegree.map(function (x) { return '<tr><td>' + x.k + '</td><td>' + x.n + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<h2>ثالثًا: المتابعة حسب الصف الدراسي</h2><div class="tw"><table class="t"><thead><tr><th>الصف</th><th>مخالفات صفية</th><th>مخالفات رسمية</th><th>تأخير صباحي</th></tr></thead><tbody>' + d.byGrade.map(function (g) { return '<tr><td>' + { 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر' }[g.k] + '</td><td>' + g.classroom + '</td><td>' + g.cases + '</td><td>' + g.tardy + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<h2>رابعًا: الشعب والمخالفات الأكثر تكرارًا</h2><div class="grid g2"><div class="tw"><table class="t"><thead><tr><th>الشعبة</th><th>العدد</th></tr></thead><tbody>' + (d.topSections.map(function (x) { return '<tr><td>' + x.k + '</td><td>' + x.n + '</td></tr>'; }).join('') || '<tr><td colspan="2">لا توجد مخالفات مسجلة خلال الشهر</td></tr>') + '</tbody></table></div>' +
        '<div class="tw"><table class="t"><thead><tr><th>المخالفة</th><th>العدد</th></tr></thead><tbody>' + (d.topViolations.map(function (x) { return '<tr><td>' + esc(x.k) + '</td><td>' + x.n + '</td></tr>'; }).join('') || '<tr><td colspan="2">لا توجد مخالفات</td></tr>') + '</tbody></table></div></div>' +
        '<h2>خامسًا: الانضباط في الحضور (الغياب)</h2><div class="tw"><table class="t"><thead><tr><th>البند</th><th>الشهر الحالي</th><th>الشهر السابق</th><th>التغيّر</th></tr></thead><tbody>' +
        row('أيام الغياب المسجّلة', at.total, apt.total) + row('الغياب بدون عذر', at.U, apt.U) + row('الغياب بعذر', at.E, apt.E) + row('قيد العذر أو بانتظار القرار', at.P + at.undecided, (apt.P || 0) + (apt.undecided || 0)) +
        row('نسبة الغياب %', at.rate, apt.rate) + row('غير مؤهلات لدخول الاختبار', at.denied, apt.denied) + '</tbody></table></div>' +
        '<div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>الصف</th><th>أيام الغياب</th><th>بدون عذر</th><th>نسبة الغياب</th></tr></thead><tbody>' + ad.byGrade.map(function (g) { return '<tr><td>' + { 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر' }[g.k] + '</td><td>' + g.total + '</td><td>' + g.U + '</td><td>' + g.rate + '%</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<h2>سادسًا: الالتزام بتنفيذ الإجراءات وتوثيقها حسب الجهة</h2><div class="tw"><table class="t"><thead><tr><th>الاسم</th><th>الصفة</th><th>المطلوب</th><th>في الوقت</th><th>متأخر</th><th>لم يُنفّذ</th><th>ضمن المهلة</th></tr></thead><tbody>' +
        (d.compliance.map(function (c) { return '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.role) + '</td><td>' + c.req + '</td><td>' + c.onTime + '</td><td>' + c.late + '</td><td>' + c.notDone + '</td><td>' + c.within + '</td></tr>'; }).join('') || '<tr><td colspan="7">لا توجد إجراءات مطلوبة خلال الشهر</td></tr>') + '</tbody></table></div>' +
        '<h2>سابعًا: الإشادة</h2><p>' + (good.length ? 'أتقدم بخالص الشكر والتقدير إلى: ' + good.map(gName).join('، ') + '؛ لالتزامهن بتنفيذ جميع الإجراءات المطلوبة وتوثيقها في الوقت المحدد.' : 'لم تكتمل خلال الشهر إجراءات منتهية المهلة تسمح بالإشادة بجهة محددة.') + '</p>' +
        '<h2>ثامنًا: الحالات الحرجة</h2><p>' + (d.critical.length ? d.critical.map(function (c) { return c.student + ' (' + c.section + ') — ' + c.short + '، ' + c.degree; }).join('؛ ') + '.' : 'لم تُسجَّل خلال الشهر مخالفات من الدرجة الرابعة أو حالات مرفوعة لإدارة المدرسة.') + '</p>' +
        (ad.denied.length ? '<p>الطالبات غير المؤهلات لدخول الاختبار بسبب الغياب بدون عذر: ' + ad.denied.map(function (o) { return o.student + ' (' + o.section + ') — ' + o.U + ' أيام'; }).join('؛ ') + '.</p>' : '') +
        '<h2>تاسعًا: التوصيات</h2><p><b>وأوصي بما يلي:</b></p><ul style="line-height:2.1">' + recs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<div class="sig"><div><b>النائبة الإدارية</b>أ. وداد الكربي</div><div><b>نائب المديرة للشؤون الأكاديمية</b>أ. آسيا الذبياني</div><div><b>مديرة المدرسة</b>أ. شيخة الرميحي</div></div>' +
        '</article>';
    }).catch(fail);
  }

  /* =====================================================
   *  الغياب
   * ===================================================== */
  function AB() { return S.boot.abs; }
  var KIND = { U: ['بدون عذر', 'red'], E: ['بعذر', 'ok'], P: ['عذر قيد الاستلام', 'ap'], undecided: ['بانتظار القرار', 'ap'], late: ['حضرت متأخرة', ''], dup: ['مكررة', ''] };
  function smsText(a) {
    var u = a.kind === 'U';
    return 'ولي أمر الطالبة/ ' + a.student + ' المحترم\nالسلام عليكم ورحمة الله وبركاته،\nتشكر إدارة مدرسة الشيماء الثانوية للبنات حرصكم وتعاونكم الدائم، ' +
      (u ? 'ونحيطكم علمًا بغياب ابنتكم يوم ' + arFull(a.date) + ' بدون عذر، وهو اليوم رقم ' + a.n + ' من أيام غيابها بدون عذر' + (a.elig ? '، وبذلك أصبحت ' + a.elig : '') + '، ونأمل تعاونكم في الحرص على انتظامها في الدوام المدرسي.'
        : 'ونحيطكم علمًا بغياب ابنتكم يوم ' + arFull(a.date) + '، ونرجو تزويد المدرسة بسبب الغياب أو العذر الرسمي خلال ' + (AB().excuseDays === 2 ? 'يومين دراسيين' : AB().excuseDays + ' أيام دراسية') + '.') +
      '\nوتفضلوا بقبول فائق الاحترام والتقدير،\nإدارة مدرسة الشيماء الثانوية للبنات';
  }
  function smsTools(a) {
    var ph = String(a.phone || '').replace(/[^\d+]/g, '');
    return '<div class="smsbox"><div class="sms">' + esc(smsText(a)).replace(/\n/g, '<br>') + '</div><div class="opts">' +
      '<button type="button" class="btn sm sec" data-copy="' + esc(a.id) + '">نسخ الرسالة</button>' +
      (ph ? '<a class="btn sm sec" href="sms:' + esc(ph) + '?&body=' + encodeURIComponent(smsText(a)) + '">إرسال رسالة نصية</a>' +
        '<a class="btn sm sec" target="_blank" rel="noopener" href="https://wa.me/' + esc(ph.replace(/^\+/, '').replace(/^(\d{8})$/, '974$1')) + '?text=' + encodeURIComponent(smsText(a)) + '">واتساب</a>' : '') +
      '</div></div>';
  }
  function bindCopy(el, list) {
    $$('[data-copy]', el).forEach(function (b) {
      b.onclick = function () {
        var a = list.filter(function (x) { return x.id === b.dataset.copy; })[0];
        var txt = smsText(a);
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('✔ نُسخت الرسالة', 'ok'); }, function () {
          var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('✔ نُسخت الرسالة', 'ok'); } catch (e) { } ta.remove();
        });
      };
    });
  }
  function absChip(a) { var k = KIND[a.kind] || ['', '']; return '<span class="chip ' + k[1] + '">' + k[0] + (a.kind === 'U' ? ' • اليوم ' + a.n : '') + '</span>'; }
  function absHead(a) {
    return '<div class="hd"><div><div class="nm">' + esc(a.student) + ' — ' + esc(a.section) + '</div>' +
      '<div class="row">غياب ' + arFull(a.date) + (a.period ? ' • رُصد في الحصة ' + esc(a.period) : '') + (a.by ? ' • سجّلته أ. ' + esc(a.by) : '') + '</div></div>' +
      '<div class="meta">' + absChip(a) + '<span class="chip">' + esc(a.id) + '</span></div></div>';
  }
  function absStageChips(a) { return a.kind === 'U' ? stageChips(a) : ''; }
  function absCard(a, withForm) {
    var st = myStage(), s = (a.stages || {})[st] || {};
    var txt = a.text ? a.text[st] : '';
    var g = a.guardian ? '<div class="row">' + ICON.phone + ' ولي الأمر: ' + esc(a.guardian) + (a.phone ? ' • ' + tel(a.phone) : '') + '</div>' : '';
    return '<article class="item' + (s.late ? ' late' : '') + (S.focus === a.id ? ' focus' : '') + '" id="it-' + esc(a.id) + '">' + absHead(a) +
      (a.flag ? '<div class="note">' + esc(a.flag) + '</div>' : '') +
      (a.decision ? '<div class="row">قرار المشرفة: ' + esc(a.decision) + (a.excuse ? ' — ' + esc(a.excuse) : '') + (a.decBy ? ' • أ. ' + esc(a.decBy) : '') + '</div>' : '') +
      g + (withForm && txt ? '<div class="req"><b>المطلوب منكِ حسب السياسة: </b>' + esc(txt) + '</div>' : '') +
      (a.elig ? '<div class="note" style="background:var(--red-l);color:var(--red)">⛔ ' + esc(a.elig) + '</div>' : '') +
      (withForm && st === 'supervisor' ? '<details><summary class="btn sm sec" style="width:max-content">💬 رسالة ولي الأمر جاهزة</summary>' + smsTools(a) + '</details>' : '') +
      absStageChips(a) + (window.NamoosForms ? NamoosForms.buttons('abs', a) : '') + fixBar('abs', a) +
      (withForm ? '<div>' + (s.late ? '<span class="chip red">⛔ متأخر — آخر موعد كان ' + ar(s.due) + '</span>' : '<span class="chip ap">آخر موعد: ' + arFull(s.due) + '</span>') + '</div>' + absForm(a, st)
        : '<div class="row">' + esc(a.status.text) + '</div>') +
      '</article>';
  }
  function absForm(a, st) {
    var s = a.stages[st];
    var f = '<form class="af" data-id="' + esc(a.id) + '"><div class="field"><label class="lbl">تاريخ التنفيذ</label><select class="inp" name="date">' + datesOptions(a.doc[st].date || '', s.start || a.date) + '</select></div>';
    if (st === 'supervisor') {
      f += '<div class="field"><label class="lbl">إخطار ولي الأمر (مطلوب)</label><select class="inp" name="contact"><option value="">— اختاري —</option>' + AB().contacts.map(function (x) { return '<option' + (x === a.doc.supervisor.contact ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>';
    } else {
      f += '<div class="field"><label class="lbl">الإجراء المتخذ</label><select class="inp" name="taken">' + listOptions(actionList(st), a.doc[st].action) + '</select></div>';
    }
    f += '<div class="field"><label class="lbl">ملاحظات (اختياري)</label><input class="inp" name="notes" value="' + esc(a.doc[st].notes) + '"></div>' +
      '<div class="field" style="grid-column:1/-1"><button class="btn wide" type="submit">حفظ وتوثيق التنفيذ</button></div></form>';
    return f;
  }
  function bindAbsForms(el, after) {
    $$('form.af', el).forEach(function (f) {
      f.onsubmit = function (e) {
        e.preventDefault();
        var d = { id: f.dataset.id, date: f.date.value, notes: f.notes.value };
        if (f.contact) { d.contact = f.contact.value; if (!d.contact) { toast('السياسة تطلب إخطار ولي الأمر — اختاري طريقة التواصل', 'bad'); return; } }
        if (f.taken) { d.taken = f.taken.value; if (!d.taken) { toast('اختاري الإجراء المتخذ', 'bad'); return; } }
        api('documentAbsence', d).then(function (r) {
          S.boot.abs = Object.assign(S.boot.abs, r.abs);
          var a = r.record;
          toast('✔ تم التوثيق — ' + (a.next ? 'انتقلت الحالة إلى ' + STAGE[a.next] + '، ووصلتها رسالة وتنبيه.' : 'اكتملت الإجراءات. ' + T1 + '.'), 'ok', 6000);
          if (after) after(a);
          refresh(true);
        }).catch(fail);
      };
    });
    $$('[data-adel]', el).forEach(function (b) {
      b.onclick = function () { if (!confirm('حذف سجل الغياب نهائيًا من الإحصاءات؟')) return; api('deleteAbsence', { id: b.dataset.adel }).then(function (r) { S.boot.abs = Object.assign(S.boot.abs, r.abs); toast('تم الحذف', 'ok'); view(S.view, true); }).catch(fail); };
    });
  }

  /* ---------- تسجيل الغياب (المعلمة / المشرفة) ---------- */
  function vAbsRec(el) {
    var b = S.boot, A = AB(), R = S.absr = S.absr || {};
    if (!R.date) R.date = b.dates.indexOf(b.today) >= 0 ? b.today : b.dates[b.dates.length - 1];
    if (!R.section && A.sections.length === 1) R.section = A.sections[0];
    if (!R.period) R.period = 'الأولى';
    R.sel = R.sel || {};
    var already = {};
    A.records.concat(A.todayInSections || []).forEach(function (x) { if (x.section === R.section && (x.date || b.today) === R.date && !x.lateArrival) already[x.student] = 1; });
    el.innerHTML = '<div><h2 class="pt">تسجيل الغياب</h2><p class="sub">في منتصف الحصة: اختاري الشعبة، ثم أشّري على الغائبات واضغطي «تسجيل». يصل الغياب للمشرفة فورًا.</p></div>' +
      step(1, 'الشعبة', '<div class="opts">' + A.sections.map(function (s) { return '<button class="opt" data-s="' + s + '" aria-pressed="' + (R.section === s) + '">' + s + '</button>'; }).join('') +
        (A.sections.length ? '' : '<div class="sub">لا توجد شعب مسندة لكِ في الجدول — تواصلي مع الإدارة</div>') + '</div>', R.section ? 'done' : '') +
      step(2, 'التاريخ والحصة', '<div class="grid g2"><select class="inp" id="ard" aria-label="التاريخ">' + datesOptions(R.date) + '</select>' +
        '<div class="opts">' + ['الأولى', 'الثانية'].map(function (p) { return '<button class="opt" data-p="' + p + '" aria-pressed="' + (R.period === p) + '">الحصة ' + p + '</button>'; }).join('') + '</div></div>', R.section ? 'done' : 'locked') +
      step(3, 'الطالبات الغائبات', R.section ? searchList('arq', 'ابحثي باسم الطالبة') + '<div class="list" id="arl"></div>' : '', R.section ? (Object.keys(R.sel).length ? 'done' : '') : 'locked') +
      '<button class="btn wide" id="arsave" ' + (R.section && Object.keys(R.sel).length ? '' : 'disabled') + '>تسجيل الغياب (' + Object.keys(R.sel).length + ')</button>' +
      '<div id="artoday"></div>';
    $$('[data-s]', el).forEach(function (x) { x.onclick = function () { R.section = x.dataset.s; R.sel = {}; vAbsRec(el); }; });
    $$('[data-p]', el).forEach(function (x) { x.onclick = function () { R.period = x.dataset.p; vAbsRec(el); }; });
    $('#ard').onchange = function () { R.date = this.value; R.sel = {}; vAbsRec(el); };
    if (R.section) {
      var draw = function () {
        var qn = norm($('#arq').value);
        $('#arl').innerHTML = (A.students[R.section] || []).filter(function (n) { return !qn || norm(n).indexOf(qn) >= 0; }).map(function (n) {
          if (already[n]) return '<button type="button" disabled><span>' + esc(n) + '</span><span class="chip">مسجّلة</span></button>';
          return '<button type="button" data-t="' + esc(n) + '" aria-pressed="' + !!R.sel[n] + '"><span>' + esc(n) + '</span><span>' + (R.sel[n] ? '✔' : '') + '</span></button>';
        }).join('');
        $$('[data-t]', $('#arl')).forEach(function (x) { x.onclick = function () { var n = x.dataset.t; if (R.sel[n]) delete R.sel[n]; else R.sel[n] = 1; draw(); var sv = $('#arsave'); sv.textContent = 'تسجيل الغياب (' + Object.keys(R.sel).length + ')'; sv.disabled = !Object.keys(R.sel).length; }; });
      };
      $('#arq').oninput = draw; draw();
    }
    $('#arsave').onclick = function () {
      var list = Object.keys(R.sel);
      api('recordAbsence', { section: R.section, date: R.date, period: R.period, students: list }).then(function (r) {
        S.boot.abs = Object.assign(S.boot.abs, r.abs); R.sel = {};
        el.innerHTML = '<div class="done-box"><b style="font-size:20px">✔ تم تسجيل ' + (r.added === 1 ? 'غياب طالبة واحدة' : r.added === 2 ? 'غياب طالبتين' : 'غياب ' + r.added + ' طالبات') + '</b>' +
          '<span>وصل الغياب إلى المشرفة الإدارية للشعبة ' + esc(R.section) + ' مع رسالة وتنبيه، وهي تحدد القرار وتُخطر ولي الأمر.</span>' +
          (r.skipped.length ? '<span>لم تُكرَّر: ' + esc(r.skipped.join('، ')) + ' (مسجّلة مسبقًا لهذا اليوم)</span>' : '') +
          '<span class="tg">' + T1 + '</span></div><button class="btn wide" style="margin-top:14px" id="aragain">تسجيل غياب شعبة أخرى</button>';
        $('#aragain').onclick = function () { R.section = A.sections.length === 1 ? A.sections[0] : ''; vAbsRec(el); };
        refresh(true);
      }).catch(fail);
    };
    // تأكيد معلمة الحصة الثانية
    if (R.section && R.date === b.today) {
      var td = (A.todayInSections || []).filter(function (x) { return x.section === R.section; });
      if (td.length) {
        $('#artoday').innerHTML = '<div class="card"><h3 style="margin:0 0 6px">غياب اليوم في ' + esc(R.section) + '</h3><p class="sub">لمعلمة الحصة الثانية: إذا حضرت الطالبة متأخرة اضغطي «حضرت متأخرة» فلا يُحتسب غيابًا.</p><div class="items">' +
          td.map(function (x) {
            return '<div class="task"><div><b>' + esc(x.student) + '</b><div class="sub">الحصة ' + esc(x.period) + ' • أ. ' + esc(x.by) + (x.lateArrival ? ' • ⏰ حضرت متأخرة' : '') + '</div></div>' +
              '<button class="btn sm ' + (x.lateArrival ? '' : 'sec') + '" data-la="' + esc(x.id) + '" data-v="' + (x.lateArrival ? '' : '1') + '">' + (x.lateArrival ? 'تراجع: ما زالت غائبة' : 'حضرت متأخرة') + '</button></div>';
          }).join('') + '</div></div>';
        $$('[data-la]', el).forEach(function (x) {
          x.onclick = function () { api('markLateArrival', { id: x.dataset.la, late: !!x.dataset.v }).then(function (r) { S.boot.abs = Object.assign(S.boot.abs, r.abs); toast('✔ تم التحديث', 'ok'); vAbsRec(el); }).catch(fail); };
        });
      }
    }
  }

  /* ---------- المعلمة: غياب سجّلته ---------- */
  function vAbsMine(el) {
    var list = AB().records;
    el.innerHTML = '<div><h2 class="pt">غياب سجّلته</h2><p class="sub">ما سجّلتِه من غياب، وقرار المشرفة فيه.</p></div>' +
      '<div class="items">' + (list.slice(0, 200).map(function (a) {
        return '<article class="item">' + absHead(a) + '<div class="row">' + esc(a.status.text) + '</div>' +
          fixBar('abs', a) + '</article>';
      }).join('') || '<div class="empty card"><span class="tg">' + T1 + '</span>لم تسجّلي غيابًا بعد</div>') + '</div>';
    $$('[data-mdel]', el).forEach(function (b) {
      b.onclick = function () { if (!confirm('حذف هذا السجل؟')) return; api('deleteAbsence', { id: b.dataset.mdel }).then(function (r) { S.boot.abs = Object.assign(S.boot.abs, r.abs); vAbsMine(el); }).catch(fail); };
    });
  }

  /* ---------- مهام الغياب ---------- */
  function absOpen() {
    var st = myStage();
    return AB().records.filter(function (a) { var s = (a.stages || {})[st]; return a.kind === 'U' && s && s.need && s.open && !s.documented; })
      .sort(function (x, y) { var lx = x.stages[st].late ? 0 : 1, ly = y.stages[st].late ? 0 : 1; return lx - ly || (x.date < y.date ? -1 : 1); });
  }
  function vAbsTasks(el) {
    var A = AB(), isSup = S.me.role === 'supervisor';
    var und = isSup ? A.records.filter(function (a) { return a.kind === 'undecided'; }) : [];
    var groups = {};
    und.forEach(function (a) { var g = a.section + '|' + a.date; (groups[g] = groups[g] || []).push(a); });
    var gkeys = Object.keys(groups).sort(function (x, y) { return x.split('|')[1] < y.split('|')[1] ? -1 : 1; });
    var open = absOpen();
    el.innerHTML = '<div><h2 class="pt">' + (isSup ? 'وارد الغياب' : 'مهام الغياب') + '</h2><p class="sub">' + (isSup ? 'أولًا: حددي قرار كل غياب وأخطري ولي الأمر. ثانيًا: نفّذي إجراء السياسة حسب رقم اليوم بدون عذر.' : 'حالات الغياب بدون عذر التي جاء دوركِ فيها حسب السياسة، والمتأخرة أولًا.') + '</p></div>' +
      (gkeys.length ? '<h3 style="margin:4px 0">① قرارات الغياب (' + und.length + ')</h3>' + gkeys.map(function (g) {
        var arr = groups[g], late = arr.some(function (a) { return a.decLate; });
        return '<form class="card dec" data-g="' + esc(g) + '" style="gap:10px;display:flex;flex-direction:column' + (late ? ';border-color:#EDB1AC' : '') + '"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center"><b>الشعبة ' + esc(arr[0].section) + ' — ' + arFull(arr[0].date) + '</b>' +
          (late ? '<span class="chip red">⛔ متأخر — آخر موعد ' + ar(arr[0].decDue) + '</span>' : '<span class="chip ap">آخر موعد: ' + arFull(arr[0].decDue) + '</span>') +
          '<button type="button" class="btn sm sec" data-allu="' + esc(g) + '">الكل بدون عذر</button></div>' +
          arr.map(function (a) {
            return '<div class="decrow" data-id="' + esc(a.id) + '"><div><b>' + esc(a.student) + '</b><div class="sub">' + (a.guardian ? esc(a.guardian) + ' • ' : '') + tel(a.phone) + ' • الحصة ' + esc(a.period) + ' • أ. ' + esc(a.by) + '</div></div>' +
              '<select class="inp" name="d"><option value="">— القرار —</option>' + A.decisions.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>' +
              '<select class="inp hidden" name="e"><option value="">— نوع العذر (المادة 3.4.1.4) —</option>' + A.excuses.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' +
              '<details><summary class="sub" style="cursor:pointer;color:var(--tq)">💬 رسالة ولي الأمر جاهزة</summary>' + smsTools(a) + '</details></div>';
          }).join('') + '<button class="btn wide" type="submit">حفظ القرارات</button></form>';
      }).join('') : '') +
      (isSup ? '<h3 style="margin:10px 0 4px">② إجراءات السياسة (' + open.length + ')</h3>' : '') +
      '<div class="items">' + (open.length ? open.map(function (a) { return absCard(a, true); }).join('') :
        (gkeys.length ? '' : '<div class="empty card"><span class="tg">' + T3 + '</span>لا توجد مهام غياب بانتظاركِ الآن</div>')) + '</div>';
    bindCopy(el, A.records);
    $$('.decrow select[name=d]', el).forEach(function (s) { s.onchange = function () { $('select[name=e]', s.parentNode).classList.toggle('hidden', s.value !== 'بعذر'); }; });
    $$('[data-allu]', el).forEach(function (b) { b.onclick = function () { $$('select[name=d]', b.closest('form')).forEach(function (s) { s.value = 'بدون عذر'; s.onchange(); }); }; });
    $$('form.dec', el).forEach(function (f) {
      f.onsubmit = function (e) {
        e.preventDefault();
        var items = [], bad = '';
        $$('.decrow', f).forEach(function (r) {
          var d = $('select[name=d]', r).value, x = $('select[name=e]', r).value;
          if (!d) return;
          if (d === 'بعذر' && !x) bad = 'اختاري نوع العذر لـ ' + $('b', r).textContent;
          items.push({ id: r.dataset.id, decision: d, excuse: x });
        });
        if (bad) { toast(bad, 'bad'); return; }
        if (!items.length) { toast('اختاري القرار لطالبة واحدة على الأقل', 'bad'); return; }
        api('decideAbsence', { items: items }).then(function (r) {
          S.boot.abs = Object.assign(S.boot.abs, r.abs);
          var u = items.filter(function (i) { return i.decision === 'بدون عذر'; }).length;
          toast('✔ حُفظت القرارات' + (u ? ' — ظهر لكِ إجراء السياسة لـ ' + u + ' في القسم الثاني' : ''), 'ok', 6000);
          vAbsTasks(el); refresh(true);
        }).catch(fail);
      };
    });
    bindAbsForms(el, function () { S.focus = (absOpen()[0] || {}).id || ''; vAbsTasks(el); if (S.focus) { var n = document.getElementById('it-' + S.focus); if (n) n.scrollIntoView({ block: 'start', behavior: 'smooth' }); } });
    if (S.focus) { var fe = document.getElementById('it-' + S.focus); if (fe) setTimeout(function () { fe.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60); }
  }


  /* ---------- حصيلة اليوم (حصر الحضور) ---------- */
  function vDaily(el) {
    var kind = S.view === 'dAbs' ? 'absence' : 'tardy';
    var isA = kind === 'absence';
    var date = S.filter.dday || S.boot.today, g = S.filter.dg || 'all';
    el.innerHTML = '<div><h2 class="pt">' + (isA ? 'حصيلة اليوم من الغياب' : 'حصيلة اليوم من التأخير الصباحي') + '</h2><p class="sub">' +
      (isA ? 'الطالبات المسجّلات غائبات في اليوم المختار، مع عدد أيام غيابهن حتى هذا اليوم.' : 'المتأخرات في اليوم المختار من «التأخير الصباحي» ومن مخالفات التأخر المسجّلة خارج الصف، مع عدد مرات التأخر حتى هذا اليوم.') + '</p></div>' +
      '<div class="card grid g3 noprint"><div class="field"><label class="lbl" for="dd">اليوم</label><select class="inp" id="dd">' + datesOptions(date) + '</select></div>' +
      '<div class="field"><span class="lbl">الصف</span><div class="opts">' + [['all', 'الكل'], ['10', 'العاشر'], ['11', 'الحادي عشر'], ['12', 'الثاني عشر']].map(function (x) { return '<button class="opt" data-g="' + x[0] + '" aria-pressed="' + (g === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><span class="lbl">تصدير</span><div class="opts"><button class="btn sm sec" id="dcopy">نسخ للإكسل</button><button class="btn sm sec" id="dcsv">تنزيل ملف</button><button class="btn sm sec" id="dprint">طباعة</button></div></div></div>' +
      '<div id="dres"><div class="empty">جارٍ التحميل…</div></div>';
    $('#dd').onchange = function () { S.filter.dday = this.value; vDaily(el); };
    $$('[data-g]', el).forEach(function (b) { b.onclick = function () { S.filter.dg = b.dataset.g; vDaily(el); }; });
    var cols = ['م', 'الرقم الشخصي', 'اسم الطالبة', 'الشعبة', 'الصف', isA ? 'تكرار الغياب' : 'تكرار التأخير', 'هاتف ولي الأمر'];
    api('dailyReport', { date: date }, true).then(function (r) {
      var list = r[kind].filter(function (x) { return g === 'all' || x.grade === g; });
      var rows = list.map(function (x, i) { return [i + 1, x.qid, x.student, x.section, x.grade, x.n, x.phone]; });
      var gc = {}; list.forEach(function (x) { gc[x.grade] = (gc[x.grade] || 0) + 1; });
      $('#dres').innerHTML = '<div class="printhead"><b>' + (isA ? 'حصيلة الغياب' : 'حصيلة التأخير الصباحي') + ' — ' + arFull(r.date) + '</b></div>' +
        '<div class="grid g4" style="margin:12px 0"><div class="tile"><b>' + list.length + '</b><span>' + (isA ? 'غائبة' : 'متأخرة') + '</span></div>' +
        ['10', '11', '12'].map(function (k) { return '<div class="tile"><b>' + (gc[k] || 0) + '</b><span>الصف ' + (k === '10' ? 'العاشر' : k === '11' ? 'الحادي عشر' : 'الثاني عشر') + '</span></div>'; }).join('') + '</div>' +
        (rows.length ? '<div class="items dcards">' + list.map(function (x, i) { return '<div class="item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>' + (i + 1) + '. ' + esc(x.student) + '</b><span class="chip ' + (x.n >= 3 ? 'red' : 'ap') + '">' + (isA ? 'الغياب: ' : 'التأخير: ') + x.n + '</span></div><div class="sub">الشعبة ' + esc(x.section) + ' • الرقم الشخصي <bdi dir="ltr">' + esc(x.qid || '—') + '</bdi>' + (isA && x.decision ? ' • ' + esc(x.decision) : '') + (!isA && x.src ? ' • ' + esc(x.src) : '') + '</div><div class="row">' + ICON.phone + ' ولي الأمر: ' + tel(x.phone) + '</div></div>'; }).join('') + '</div>' + '<table class="t dtable"><thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
          list.map(function (x, i) {
            return '<tr><td>' + (i + 1) + '</td><td dir="ltr" style="text-align:right">' + esc(x.qid || '—') + '</td><td><b>' + esc(x.student) + '</b>' + (isA && x.decision ? '<div class="sub">' + esc(x.decision) + '</div>' : '') + (!isA && x.src ? '<div class="sub">' + esc(x.src) + '</div>' : '') + '</td><td>' + esc(x.section) + '</td><td>' + esc(x.grade) + '</td><td><span class="chip ' + (x.n >= (isA ? 3 : 3) ? 'red' : 'ap') + '">' + x.n + '</span></td><td>' + tel(x.phone) + '</td></tr>';
          }).join('') + '</tbody></table>' : '<div class="empty card"><span class="tg">' + T3 + '</span>' + (isA ? 'لا يوجد غياب مسجّل في هذا اليوم' : 'لا يوجد تأخير مسجّل في هذا اليوم') + (r.last && r.last[kind] && r.last[kind] !== r.date ? '<br><button class="btn sm sec" id="dlast" style="margin-top:10px">اعرضي آخر يوم فيه تسجيل: ' + arFull(r.last[kind]) + '</button>' : '') + '</div>');
      var dl = $('#dlast'); if (dl) dl.onclick = function () { S.filter.dday = r.last[kind]; vDaily(el); };
      var tsv = [cols].concat(rows).map(function (r) { return r.join('\t'); }).join('\n');
      $('#dcopy').onclick = function () {
        (navigator.clipboard ? navigator.clipboard.writeText(tsv) : Promise.reject()).then(function () { toast('✔ نُسخ الجدول — الصقيه في إكسل', 'ok'); }).catch(function () { toast('تعذّر النسخ، استخدمي «تنزيل ملف»', 'bad'); });
      };
      $('#dcsv').onclick = function () {
        var csv = '﻿' + [cols].concat(rows).map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = (isA ? 'حصيلة الغياب ' : 'حصيلة التأخير ') + r.date + '.csv'; document.body.appendChild(a); a.click(); a.remove();
      };
      $('#dprint').onclick = function () { window.print(); };
    }).catch(fail);
  }

  /* ---------- سجل الغياب ---------- */
  function vAbsLog(el) {
    var f = S.filter.abs || 'all', q = S.filter.aq || '';
    var all = AB().records.filter(function (a) { return a.kind !== 'dup'; });
    var flt = { all: function () { return true; }, undecided: function (a) { return a.kind === 'undecided'; }, U: function (a) { return a.kind === 'U'; },
      wait: function (a) { return a.kind === 'U' && a.status.code !== 'done'; }, late: function (a) { return a.status.code === 'late'; }, E: function (a) { return a.kind === 'E'; }, P: function (a) { return a.kind === 'P'; } };
    var tabs = S.me.role === 'supervisor' || S.me.role === 'admin' ? [['all', 'الكل'], ['undecided', 'بانتظار القرار'], ['U', 'بدون عذر'], ['wait', 'إجراءات معلقة'], ['late', 'متأخرة'], ['P', 'قيد العذر'], ['E', 'بعذر']] : [['all', 'الكل'], ['wait', 'معلقة'], ['late', 'متأخرة']];
    var list = all.filter(flt[f]).filter(function (a) { return !q || norm(a.student + ' ' + a.section + ' ' + a.id).indexOf(norm(q)) >= 0; });
    el.innerHTML = '<div><h2 class="pt">' + (S.me.role === 'admin' || S.me.role === 'supervisor' ? 'سجل الغياب' : 'حالات الغياب') + '</h2><p class="sub">كل غياب، وقراره، ومسار إجراءاته عند كل جهة.</p></div>' +
      '<div class="opts">' + tabs.map(function (x) { return '<button class="opt" data-f="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + ' (' + all.filter(flt[x[0]]).length + ')</button>'; }).join('') + '</div>' +
      searchList('aq', 'ابحثي باسم الطالبة أو الشعبة') +
      '<div class="items">' + (list.slice(0, 150).map(function (a) { return absCard(a, false); }).join('') || '<div class="empty">لا توجد سجلات</div>') + '</div>';
    var aq = $('#aq'); aq.value = q;
    aq.oninput = function () { S.filter.aq = aq.value; var pos = aq.selectionStart; vAbsLog(el); var n = $('#aq'); n.focus(); n.setSelectionRange(pos, pos); };
    $$('[data-f]', el).forEach(function (b) { b.onclick = function () { S.filter.abs = b.dataset.f; vAbsLog(el); }; });
    bindAbsForms(el);
  }

  /* ---------- متابعة الطالبات والأهلية ---------- */
  function vAbsStud(el, deniedOnly) {
    el.innerHTML = '<div class="noprint" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px"><div><h2 class="pt">' + (deniedOnly ? 'قائمة المحرومات من دخول الاختبارات' : 'متابعة الطالبات') + '</h2><p class="sub">' +
      (deniedOnly ? 'تُبنى تلقائيًا من الغياب بدون عذر مقارنةً بحدود المادة 3.4.1.3 وتواريخ الاختبارات.' : 'غياب كل طالبة وأهليتها للاختبار القادم.') + '</p></div>' + (deniedOnly ? '<button class="btn" id="dprint">طباعة</button>' : '') + '</div><div id="sx"></div>';
    if (deniedOnly) $('#dprint').onclick = function () { window.print(); };
    api('absStudents').then(function (r) {
      var f = S.filter.st || 'all', q = S.filter.sq || '';
      var all = r.students;
      if (deniedOnly) all = all.filter(function (o) { return o.denied.length; });
      var flt = { all: function () { return true; }, risk: function (o) { return o.risk; }, denied: function (o) { return o.denied.length; } };
      var list = (deniedOnly ? all : all.filter(flt[f])).filter(function (o) { return !q || norm(o.student + ' ' + o.section).indexOf(norm(q)) >= 0; });
      var draw = function () {
        $('#sx').innerHTML = (deniedOnly ? '' : '<div class="opts">' + [['all', 'كل من غابت'], ['risk', 'معرّضات للحرمان'], ['denied', 'غير مؤهلات']].map(function (x) { return '<button class="opt" data-f="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + ' (' + all.filter(flt[x[0]]).length + ')</button>'; }).join('') + '</div>') +
          '<div class="noprint">' + searchList('sq', 'ابحثي باسم الطالبة أو الشعبة') + '</div>' +
          '<div class="card"><div class="tw"><table class="t"><thead><tr><th>م</th><th>الطالبة</th><th>الشعبة</th><th>أيام الغياب</th><th>بدون عذر</th><th>بعذر</th><th>قيد القرار/العذر</th><th>آخر غياب</th><th>' + (deniedOnly ? 'قرار عدم الأهلية' : 'الأهلية') + '</th></tr></thead><tbody>' +
          (list.map(function (o, i) {
            var el2 = o.denied.length ? '<span class="chip red">غير مؤهلة: ' + esc(o.denied.join('، ')) + '</span>' : o.next ? '<span class="chip ' + (o.next.left < 0 ? 'red' : o.risk ? 'ap' : 'ok') + '">' + esc(o.next.text) + '</span>' : '—';
            return '<tr><td>' + (i + 1) + '</td><td>' + esc(o.student) + '</td><td>' + esc(o.section) + '</td><td>' + o.total + '</td><td><b>' + o.U + '</b></td><td>' + o.E + '</td><td>' + o.P + '</td><td>' + (o.last ? ar(o.last) : '') + '</td><td>' + el2 + '</td></tr>';
          }).join('') || '<tr><td colspan="9">' + (deniedOnly ? 'لا توجد طالبات غير مؤهلات حتى الآن' : 'لا توجد بيانات') + '</td></tr>') + '</tbody></table></div></div>' +
          '<div class="card"><h3 style="margin:0 0 8px">حدود الأهلية (المادة 3.4.1.3)</h3><div class="tw"><table class="t"><thead><tr><th>الاختبار</th><th>تاريخ البدء</th><th>الحد الأقصى بدون عذر</th><th>الصفوف</th></tr></thead><tbody>' +
          r.exams.map(function (e) { return '<tr><td>' + esc(e.name) + '</td><td>' + arFull(e.date) + '</td><td>' + e.limit + ' أيام</td><td>' + esc(e.grades.join('، ')) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
        var sq = $('#sq'); sq.value = q;
        sq.oninput = function () { S.filter.sq = sq.value; vAbsStud(el, deniedOnly); };
        $$('[data-f]', el).forEach(function (b) { b.onclick = function () { S.filter.st = b.dataset.f; vAbsStud(el, deniedOnly); }; });
      };
      draw();
    }).catch(fail);
  }
  function vAbsDep(el) { vAbsStud(el, true); }

  /* ---------- لوحة الغياب ---------- */
  function vAbsDash(el) {
    var per = S.dashPeriod;
    el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px"><div><h2 class="pt">لوحة الغياب</h2><p class="sub">مؤشرات الحضور والغياب والأهلية والالتزام بإجراءات سياسة الغياب.</p></div>' +
      '<select class="inp" id="dp" style="width:auto"><option value="">كل العام الدراسي</option>' + SCHOOL_MONTHS.map(function (m) { return '<option value="' + m + '"' + (per === m ? ' selected' : '') + '>' + monthLabel(m) + '</option>'; }).join('') + '</select></div><div id="dx"></div>';
    $('#dp').onchange = function () { S.dashPeriod = this.value; vAbsDash(el); };
    api('absDashboard', monthRange(per)).then(function (d) {
      var t = d.tiles;
      var mx = Math.max.apply(null, d.months.map(function (m) { return m.total; }).concat([1]));
      $('#dx').innerHTML = '<div class="grid g4">' +
        [['أيام الغياب المسجّلة', t.total], ['بدون عذر', t.U, 1], ['بعذر', t.E], ['قيد العذر', t.P], ['بانتظار قرار المشرفة', t.undecided, 1], ['حضرن متأخرات (لم يُحتسب)', t.lateArrivals],
          ['طالبات غِبن', t.absentStudents], ['نسبة الغياب', t.rate + '%'], ['غير مؤهلات للاختبار', t.denied, 1], ['معرّضات للحرمان', t.risk, 1], ['إجراءات معلقة', t.pending], ['إجراءات متأخرة', t.lateActions, 1]].map(function (x) {
          return '<div class="tile' + (x[2] && x[1] ? ' warn' : '') + '"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>';
        }).join('') + '</div>' +
        '<div class="card"><h3 style="margin:0 0 6px">التحليل الشهري</h3><div class="sub">الفيروزي: كل الغياب • المشمشي: بدون عذر</div><div class="cols">' + d.months.map(function (m) {
          return '<div class="c"><div style="display:flex;gap:3px;align-items:flex-end;height:130px;width:100%;justify-content:center"><i style="height:' + Math.round(120 * m.total / mx) + 'px" title="' + m.total + '"></i><i class="ap" style="height:' + Math.round(120 * m.U / mx) + 'px" title="' + m.U + '"></i></div>' + MONTHS[Number(m.m.split('-')[1]) - 1].slice(0, 5) + '</div>';
        }).join('') + '</div></div>' +
        '<div class="grid g2"><div class="card"><h3 style="margin:0 0 10px">مقارنة الصفوف</h3><div class="tw"><table class="t"><thead><tr><th>الصف</th><th>الطالبات</th><th>أيام الغياب</th><th>بدون عذر</th><th>النسبة</th></tr></thead><tbody>' +
        d.byGrade.map(function (g) { return '<tr><td>' + { 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر' }[g.k] + '</td><td>' + g.students + '</td><td>' + g.total + '</td><td>' + g.U + '</td><td>' + g.rate + '%</td></tr>'; }).join('') + '</tbody></table></div></div>' +
        '<div class="card"><h3 style="margin:0 0 10px">أكثر الشعب غيابًا</h3>' + bars(d.topSections) + '</div></div>' +
        '<div class="card"><h3 style="margin:0 0 10px">أكثر الطالبات غيابًا بدون عذر</h3>' + bars(d.topStudents) + '</div>' +
        '<div class="card"><h3 style="margin:0 0 10px">الالتزام بإجراءات سياسة الغياب بالأسماء</h3><div class="tw"><table class="t"><thead><tr><th>الاسم</th><th>الصفة</th><th>المطلوب</th><th>في الوقت</th><th>متأخر</th><th>لم يُنفّذ</th><th>ضمن المهلة</th><th>نسبة الالتزام</th></tr></thead><tbody>' +
        (d.compliance.map(function (c) { var base = c.req - c.within; return '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.role) + '</td><td>' + c.req + '</td><td>' + c.onTime + '</td><td>' + c.late + '</td><td>' + c.notDone + '</td><td>' + c.within + '</td><td><b>' + (base ? Math.round(100 * c.onTime / base) + '%' : '—') + '</b></td></tr>'; }).join('') || '<tr><td colspan="8">لا توجد إجراءات في الفترة</td></tr>') + '</tbody></table></div></div>' +
        (d.denied.length ? '<div class="card"><h3 style="margin:0 0 10px">⛔ غير مؤهلات لدخول الاختبار</h3><div class="items">' + d.denied.map(function (o) { return '<div class="task late"><div><b>' + esc(o.student) + ' — ' + esc(o.section) + '</b><div class="sub">بدون عذر: ' + o.U + ' • ' + esc(o.denied.join('، ')) + '</div></div></div>'; }).join('') + '</div></div>' : '') +
        (d.late.length ? '<div class="card"><h3 style="margin:0 0 10px">⛔ إجراءات متأخرة</h3><div class="items">' + d.late.map(function (a) { return '<div class="task late"><div><b>' + esc(a.student) + ' — ' + esc(a.section) + '</b><div class="sub">اليوم ' + a.n + ' بدون عذر • ' + esc(a.id) + ' • ' + esc(a.status) + '</div></div></div>'; }).join('') + '</div></div>' : '');
    }).catch(fail);
  }

  /* ---------------- البدء ---------------- */
  if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); }); }
  S.token = store('namoos_token') || '';
  if (!API) {
    renderLogin('المنصة قيد التهيئة — سيتم تفعيلها قريبًا');
  } else if (S.token) start(false);
  else renderLogin('');
})();
