/**
 * منصة نوماس — متابعة السلوك والانضباط
 * مدرسة الشيماء الثانوية للبنات — العام الدراسي 2026 – 2027
 *
 * الخادم (Google Apps Script) — يُلصق هذا الملف كاملًا في محرر Apps Script المرتبط بملف «قاعدة بيانات نوماس».
 * كل البيانات (الطالبات، أولياء الأمور، الأرقام السرية، السجلات) محفوظة في ملف Google Sheets فقط،
 * ولا يوجد أي منها في كود الموقع العلني.
 */

var TZ = 'Asia/Qatar';
var VERSION = '2.6.0';

/* ============================================================
 *  أسماء الأوراق والأعمدة
 * ============================================================ */
var SH = {
  settings: 'الإعدادات', users: 'المستخدمون', students: 'الطالبات', schedule: 'الجدول', sections: 'الشعب',
  classViol: 'المخالفات الصفية', lists: 'القوائم', offViol: 'مخالفات السياسة', maxRep: 'الحد الأقصى',
  texts: 'نصوص السياسة', roles: 'جهات السياسة', days: 'أيام الدراسة',
  teacher: 'سجل المعلمات', cases: 'الحالات', tardy: 'سجل التأخير', messages: 'الرسائل', mailLog: 'سجل الإرسال',
  abs: 'سجل الغياب', absPolicy: 'سياسة الغياب', absExams: 'اختبارات الأهلية', absExcuses: 'أعذار الغياب'
};

var COLS = {
  teacher: ['المعرف', 'وقت الإدخال', 'المعلمة', 'المادة', 'الشعبة', 'التاريخ', 'الطالبة', 'المخالفة',
    'تم التنفيذ', 'التواصل مع ولي الأمر', 'تاريخ التواصل', 'ملاحظات', 'رقم التحويل', 'محذوف'],
  cases: ['رقم الحالة', 'وقت الإنشاء', 'المصدر', 'رقم التحويل', 'المعلمة', 'التاريخ', 'الشعبة', 'الطالبة', 'المخالفة',
    'سجّلتها', 'المشرفة: تاريخ التنفيذ', 'المشرفة: التواصل مع ولي الأمر', 'المشرفة: ملاحظات', 'المشرفة: من وثّقت',
    'المنسقة: تاريخ التنفيذ', 'المنسقة: الإجراء المتخذ', 'المنسقة: ملاحظات',
    'الاجتماعية: تاريخ التنفيذ', 'الاجتماعية: الإجراء المتخذ', 'الاجتماعية: ملاحظات',
    'النفسية: تاريخ التنفيذ', 'النفسية: الإجراء المتخذ', 'النفسية: ملاحظات',
    'الإدارة: تاريخ التنفيذ', 'الإدارة: الإجراء المتخذ', 'الإدارة: ملاحظات', 'محذوف'],
  tardy: ['المعرف', 'وقت الإدخال', 'التاريخ', 'الشعبة', 'الطالبة', 'سجّلتها', 'ملاحظات', 'محذوف'],
  messages: ['المعرف', 'الوقت', 'من', 'إلى', 'الموضوع', 'النص', 'الحالة', 'مقروءة', 'النوع', 'الرابط'],
  mailLog: ['الوقت', 'إلى', 'الموضوع', 'النتيجة'],
  abs: ['المعرف', 'وقت الإدخال', 'التاريخ', 'الشعبة', 'الطالبة', 'الحصة', 'سجّلتها', 'حضرت متأخرة', 'أكّدتها',
    'القرار', 'نوع العذر', 'ملاحظات القرار', 'قررتها', 'وقت القرار',
    'المشرفة: تاريخ التنفيذ', 'المشرفة: التواصل مع ولي الأمر', 'المشرفة: ملاحظات', 'المشرفة: من وثّقت',
    'المنسقة: تاريخ التنفيذ', 'المنسقة: الإجراء المتخذ', 'المنسقة: ملاحظات',
    'الاجتماعية: تاريخ التنفيذ', 'الاجتماعية: الإجراء المتخذ', 'الاجتماعية: ملاحظات',
    'النفسية: تاريخ التنفيذ', 'النفسية: الإجراء المتخذ', 'النفسية: ملاحظات',
    'الإدارة: تاريخ التنفيذ', 'الإدارة: الإجراء المتخذ', 'الإدارة: ملاحظات', 'محذوف']
};

/* الأدوار في المنصة */
var ROLE_OF = {
  'معلمة': 'teacher', 'مشرفة إدارية': 'supervisor', 'منسقة شؤون الطالبات': 'coordinator',
  'أخصائية اجتماعية': 'social', 'أخصائية نفسية': 'psych', 'الإدارة': 'admin', 'النائب الإداري': 'admin',
  'حصر الحضور': 'daily'
};
var ROLE_LABEL = { teacher: 'معلمة', supervisor: 'مشرفة إدارية', coordinator: 'منسقة شؤون الطالبات',
  social: 'أخصائية اجتماعية', psych: 'أخصائية نفسية', admin: 'الإدارة', daily: 'حصر الحضور' };
/* ترتيب الإجراء في السياسة */
var CHAIN = ['supervisor', 'coordinator', 'social', 'psych', 'admin'];
var STAGE_PREFIX = { supervisor: 'المشرفة', coordinator: 'المنسقة', social: 'الاجتماعية', psych: 'النفسية', admin: 'الإدارة' };

/* ============================================================
 *  نقطة الدخول
 * ============================================================ */
function doGet(e) {
  return out_({ ok: true, name: 'نوماس', version: VERSION });
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return out_({ ok: false, error: 'طلب غير صالح' });
  }
  try {
    var res = route_(req);
    res.ok = true;
    return out_(res);
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

var PUBLIC = { login: 1, ping: 1 };
var WRITES = { sendForm: 1, editTeacher: 1, editCase: 1, editTardy: 1, editAbsence: 1, recordTeacher: 1, updateTeacher: 1, deleteTeacher: 1, createCase: 1, documentCase: 1, deleteCase: 1,
  recordTardy: 1, deleteTardy: 1, sendMessage: 1, markRead: 1,
  recordAbsence: 1, markLateArrival: 1, decideAbsence: 1, documentAbsence: 1, deleteAbsence: 1 };

function route_(req) {
  var a = req.action;
  if (a === 'ping') return { name: 'نوماس', version: VERSION };
  if (a === 'login') return login_(req);
  var me = verify_(req.token);
  autoImportAbs_();
  var fn = API[a];
  if (!fn) throw new Error('إجراء غير معروف');
  if (WRITES[a]) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { var r = fn(me, req); flush_(); return r; } finally { lock.releaseLock(); }
  }
  return fn(me, req);
}

/* ============================================================
 *  الدخول والجلسة
 * ============================================================ */
function secret_() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SECRET', s); }
  return s;
}

function sign_(payload) {
  var body = Utilities.base64EncodeWebSafe(Utilities.newBlob(JSON.stringify(payload)).getBytes());
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret_()));
  return body + '.' + sig;
}

function verify_(token) {
  if (!token || String(token).indexOf('.') < 0) throw new Error('AUTH');
  var parts = String(token).split('.');
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret_()));
  if (sig !== parts[1]) throw new Error('AUTH');
  var p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  if (!p.exp || p.exp < Date.now()) throw new Error('AUTH');
  var u = findUser_(p.n, p.r);
  if (!u) throw new Error('AUTH');
  return u;
}

function login_(req) {
  var role = String(req.role || ''), pin = String(req.pin || '').trim();
  var cache = CacheService.getScriptCache();
  var key = 'fail_' + role;
  var fails = Number(cache.get(key) || 0);
  if (fails >= 15) throw new Error('محاولات كثيرة، انتظري عشر دقائق ثم أعيدي المحاولة');
  var match = users_().filter(function (u) { return u.role === role && u.pin === pin; });
  if (match.length !== 1) {
    cache.put(key, String(fails + 1), 600);
    throw new Error('الرقم السري غير صحيح لهذه الصفة');
  }
  var u = match[0];
  var days = Number(setting_('مدة الجلسة بالأيام', 30)) || 30;
  return { token: sign_({ n: u.name, r: u.role, exp: Date.now() + days * 86400000 }), me: publicUser_(u) };
}

function publicUser_(u) {
  return { name: u.name, role: u.role, roleLabel: ROLE_LABEL[u.role], sections: u.sections };
}

/* ============================================================
 *  قراءة الأوراق
 * ============================================================ */
var _cache = {};
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name) {
  var s = ss_().getSheetByName(name);
  if (!s) throw new Error('الورقة غير موجودة: ' + name);
  return s;
}
function rows_(name) {
  if (_cache[name]) return _cache[name];
  var v = sheet_(name).getDataRange().getValues();
  var head = v.shift().map(function (h) { return String(h).trim(); });
  var list = v.filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); })
    .map(function (r, i) { var o = { _row: i + 2 }; head.forEach(function (h, j) { o[h] = (h === 'الشعبة' && r[j] instanceof Date) ? secFromDate_(r[j]) : r[j]; }); return o; });
  _cache[name] = list;
  return list;
}
// شعبة كُتبت يدويًا في الورقة فحوّلها Sheets إلى تاريخ (10-5 ← 5 أكتوبر): تُعاد إلى صيغتها
function secFromDate_(d) { return Utilities.formatDate(d, ss_().getSpreadsheetTimeZone(), 'M-d'); }
function flush_() { _cache = {}; }
function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function iso_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  var s = str_(v);
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : s;
}
function now_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }

function append_(name, cols, obj) {
  var sh = sheet_(name);
  sh.appendRow(cols.map(function (c) { return obj[c] === undefined ? '' : obj[c]; }));
  delete _cache[name];
}
function appendMany_(name, cols, objs) {
  if (!objs.length) return;
  var sh = sheet_(name);
  var vals = objs.map(function (obj) { return cols.map(function (c) { return obj[c] === undefined ? '' : obj[c]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, vals.length, cols.length).setValues(vals);
  delete _cache[name];
}
function update_(name, rowObj, changes) {
  var sh = sheet_(name);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  Object.keys(changes).forEach(function (k) {
    var j = head.indexOf(k);
    if (j < 0) throw new Error('عمود غير موجود: ' + k);
    sh.getRange(rowObj._row, j + 1).setValue(changes[k]);
  });
  delete _cache[name];
}

function setting_(k, def) {
  var r = rows_(SH.settings).filter(function (x) { return str_(x['المفتاح']) === k; })[0];
  return r && str_(r['القيمة']) !== '' ? r['القيمة'] : def;
}

function users_() {
  return rows_(SH.users).map(function (r) {
    return { name: str_(r['الاسم']), roleAr: str_(r['الصفة']), role: ROLE_OF[str_(r['الصفة'])] || '',
      email: str_(r['البريد الإلكتروني']), pin: str_(r['الرقم السري']),
      sections: str_(r['الشعب']).split(/[،,]\s*/).map(str_).filter(String) };
  }).filter(function (u) { return u.name && u.role; });
}
function findUser_(name, role) {
  return users_().filter(function (u) { return u.name === name && u.role === role; })[0];
}
function usersByRole_(role) { return users_().filter(function (u) { return u.role === role; }); }

/* ============================================================
 *  محرك السياسة — مطابق لمنطق نظام Excel المعتمد
 * ============================================================ */
function policy_() {
  if (_cache._policy) return _cache._policy;
  var P = { classV: {}, classList: [], off: {}, offList: [], max: {}, texts: {}, roles: {} };
  rows_(SH.classViol).forEach(function (r) {
    var v = { label: str_(r['المخالفة']), code: str_(r['الرمز']), degree: str_(r['الدرجة']), max: Number(r['الحد الأقصى']) || 0,
      steps: ['ت1', 'ت2', 'ت3', 'ت4', 'ت5', 'ت6'].map(function (k) { return str_(r[k]); }),
      cat: Number(r['الفئة']) || 1, official: str_(r['البند في السياسة']) };
    if (v.label) { P.classV[v.label] = v; P.classList.push(v); }
  });
  rows_(SH.offViol).forEach(function (r) {
    var v = { name: str_(r['المخالفة']), code: str_(r['رمز الجدول']), short: str_(r['الاسم المختصر']),
      degree: str_(r['الدرجة']).replace('الدرجة_', 'الدرجة ') };
    if (v.name) { P.off[v.name] = v; P.offList.push(v); }
  });
  rows_(SH.maxRep).forEach(function (r) { if (str_(r['رمز الجدول'])) P.max[str_(r['رمز الجدول'])] = Number(r['أقصى تكرار']) || 0; });
  rows_(SH.texts).forEach(function (r) {
    var k = str_(r['مفتاح']);
    if (k) P.texts[k] = {
      teacher: str_(r['نص المعلمة']), supervisor: str_(r['نص المشرفة']), coordinator: str_(r['نص المنسقة/الفريق']),
      social: str_(r['نص الاجتماعية']), psych: str_(r['نص النفسية']), admin: str_(r['نص الإدارة']) };
  });
  rows_(SH.roles).forEach(function (r) {
    var k = str_(r['مفتاح']), who = str_(r['الجهة']);
    if (!k) return;
    (P.roles[k] = P.roles[k] || []).push(who);
  });
  _cache._policy = P;
  return P;
}

/** مفتاح السياسة: رمز الجدول + رقم التكرار، أو «+» عند تجاوز أقصى تكرار */
function policyKey_(code, rep) {
  var P = policy_();
  var mx = P.max[code] || 0;
  return code + '|' + (mx && rep > mx ? '+' : rep);
}

/** الجهات المطلوبة للمفتاح — نفس شروط نظام Excel */
function required_(key) {
  var who = policy_().roles[key] || [];
  var has = function (test) { return who.some(test); };
  var t = policy_().texts[key] || {};
  return {
    supervisor: has(function (w) { return /^المشرف الإداري/.test(w) || w === 'ملاحظ الحافلة' || w === 'الحارس أو المناوب'; }),
    coordinator: has(function (w) { return w === 'منسق شؤون الطلبة' || w === 'فريق إدارة سلوك الطلبة'; }),
    social: has(function (w) { return /^الأخصائي الاجتماعي/.test(w); }),
    psych: has(function (w) { return /^الأخصائي النفسي/.test(w); }),
    admin: has(function (w) { return w === 'إدارة المدرسة'; }),
    team: has(function (w) { return w === 'فريق إدارة سلوك الطلبة'; }),
    guardian: /ولي الأمر/.test(t.supervisor || ''),
    pledge: /تعهد/.test(t.supervisor || '')
  };
}

/* ---------- أيام الدراسة والمهلة ---------- */
function days_() {
  if (_cache._days) return _cache._days;
  var d = rows_(SH.days).map(function (r) { return iso_(r['التاريخ']); }).filter(String).sort();
  _cache._days = d;
  return d;
}
function isSchoolDay_(d) { return days_().indexOf(d) >= 0; }
/** عدد الأيام الدراسية بعد التاريخ حتى اليوم */
function schoolDaysSince_(d) {
  var t = today_();
  return days_().filter(function (x) { return x > d && x <= t; }).length;
}
/** آخر موعد = التاريخ + المهلة أيامًا دراسية */
/** بداية المهلة: تاريخ الواقعة، أو يوم إدخالها إن أُدخلت بأثر رجعي — فلا تُحتسب السجلات السابقة متأخرة */
function startDay_(d, createdDay) { return /^\d{4}-\d{2}-\d{2}$/.test(createdDay || '') && createdDay > d ? createdDay : d; }
function deadline_(d) {
  var g = Number(setting_('المهلة', 2)) || 2;
  var list = days_().filter(function (x) { return x > d; });
  return list.length >= g ? list[g - 1] : d;
}
function allowedDates_() {
  var w = Number(setting_('نافذة التوثيق', 0)) || 0;
  var all = days_();
  if (!w) return all.filter(function (x) { return x <= today_(); });
  var t = today_();
  var past = all.filter(function (x) { return x <= t; }).slice(-(w + 1));
  var future = all.filter(function (x) { return x > t; }).slice(0, w);
  return past.concat(future);
}
function checkDate_(d) {
  if (!d) throw new Error('اختاري التاريخ');
  if (!isSchoolDay_(d)) throw new Error('التاريخ ليس يومًا دراسيًا');
  if (allowedDates_().indexOf(d) < 0) throw new Error('التاريخ خارج نافذة التوثيق المسموح بها');
}

/* ---------- الطالبات والجدول ---------- */
/** الحصة المشتركة تُكتب «اسم / اسم»، فتظهر لكل معلمة من المشتركات فيها */
function teaches_(r, name) {
  return str_(r['المعلمة']).split('/').map(str_).indexOf(name) >= 0;
}
function students_() {
  return rows_(SH.students).map(function (r) {
    return { name: str_(r['الاسم']), section: str_(r['الشعبة']), guardian: str_(r['ولي الأمر']), phone: str_(r['هاتف ولي الأمر']), qid: str_(r['الرقم الشخصي']), nat: str_(r['الجنسية']) };
  }).filter(function (s) { return s.name && s.section; });
}
function student_(name, section) {
  return students_().filter(function (s) { return s.name === name && s.section === section; })[0];
}
function sectionInfo_(section) {
  var r = rows_(SH.sections).filter(function (x) { return str_(x['الشعبة']) === section; })[0] || {};
  var sups = str_(r['المشرفة/المشرفات']).split(/[،,]\s*/).map(str_).filter(String);
  return { supervisors: sups, social: str_(r['الأخصائية الاجتماعية']) };
}
function allSections_() { return rows_(SH.sections).map(function (r) { return str_(r['الشعبة']); }).filter(String); }

/* ============================================================
 *  سجلات المعلمات (المخالفات الصفية)
 * ============================================================ */
function teacherRecords_() {
  return rows_(SH.teacher).filter(function (r) { return str_(r['محذوف']) !== 'نعم'; });
}
function orderKey_(r, dateCol, timeCol) { return iso_(r[dateCol]) + '|' + str_(r[timeCol]) + '|' + str_(r['المعرف'] || r['رقم الحالة']); }

/** يحسب كل ما يُشتق من سجل المعلمة: رقم التنبيه، الإجراء، ولي الأمر، التحويل، مفتاح السياسة */
function enrichTeacher_(all) {
  var P = policy_();
  var sorted = all.slice().sort(function (a, b) { return orderKey_(a, 'التاريخ', 'وقت الإدخال') < orderKey_(b, 'التاريخ', 'وقت الإدخال') ? -1 : 1; });
  var alertCount = {}, officialCount = {};
  return sorted.map(function (r) {
    var v = P.classV[str_(r['المخالفة'])] || {};
    var date = iso_(r['التاريخ']);
    var o = { id: str_(r['المعرف']), created: str_(r['وقت الإدخال']), createdDay: iso_(r['وقت الإدخال']), teacher: str_(r['المعلمة']), subject: str_(r['المادة']),
      section: str_(r['الشعبة']), date: date, student: str_(r['الطالبة']), violation: str_(r['المخالفة']),
      degree: v.degree || '', cat: v.cat || 1, official: v.official || '',
      done: str_(r['تم التنفيذ']), contact: str_(r['التواصل مع ولي الأمر']), contactDate: iso_(r['تاريخ التواصل']),
      notes: str_(r['ملاحظات']), transferNo: str_(r['رقم التحويل']), _row: r._row };
    var off = P.off[o.official] || {};
    o.officialShort = off.short || o.official;
    if (o.cat === 1) {
      var k = [o.student, o.section, o.violation, o.subject].join('|');
      alertCount[k] = (alertCount[k] || 0) + 1;
      o.alert = alertCount[k];
      if (o.alert > v.max) {
        o.action = '⛔ تجاوز الحد الأقصى — يُرفع للمشرفة وفق اللائحة';
      } else {
        o.action = v.steps[o.alert - 1] || '';
      }
    } else {
      o.alert = '';
      o.action = 'بلاغ فوري للمشرفة — ' + String(v.steps[0] || '').replace('تنبيه انفرادي 1 + ', '');
    }
    o.guardianRequired = o.cat === 2 ? false : /ولي الأمر/.test(o.action);
    o.guardianNote = o.cat === 2 ? 'تتولاه المشرفة' : (o.guardianRequired ? 'مطلوب' : 'لا يوجد إجراء مطلوب');
    o.transferRequired = o.cat === 2 || /المشرف/.test(o.action) || (o.cat === 1 && o.alert > v.max);
    o.kind = o.cat === 2 ? 'بلاغ' : 'تحويل';
    // تكرار المخالفة في السياسة (لنص إجراء المشرفة المتوقع)
    var ok = [o.student, o.section, o.official].join('|');
    officialCount[ok] = (officialCount[ok] || 0) + 1;
    var rep = o.cat === 1 ? o.alert : officialCount[ok];
    o.policyKey = off.code ? policyKey_(off.code, rep) : '';
    o.teacherPolicyText = (P.texts[o.policyKey] || {}).teacher || '';
    o.supervisorPolicyText = (P.texts[o.policyKey] || {}).supervisor || '';
    // المتابعة
    var due = deadline_(startDay_(date, o.createdDay));
    o.due = due;
    var late = today_() > due;
    if (o.done !== 'نعم') o.status = late ? { code: 'late', text: '⛔ متأخر: لم يُوثَّق تنفيذ إجراء المعلمة' } : { code: 'todo', text: '⏳ وثّقي تنفيذ الإجراء' };
    else if (o.guardianRequired && (!o.contact || !o.contactDate)) o.status = late ? { code: 'late', text: '⛔ متأخر: لم يُوثَّق التواصل مع ولي الأمر' } : { code: 'todo', text: '⏳ وثّقي التواصل مع ولي الأمر وتاريخه' };
    else o.status = { code: 'done', text: '✔ موثّق' };
    // الالتزام: 1 في الوقت، 2 متأخر، 3 لم يُنفّذ بعد انتهاء المهلة، 4 ضمن المهلة
    var docDate = o.guardianRequired ? o.contactDate : (o.done === 'نعم' ? date : '');
    o.compliance = o.status.code === 'done' ? (o.guardianRequired && o.contactDate > due ? 2 : 1) : (late ? 3 : 4);
    return o;
  });
}

/* ============================================================
 *  الحالات الرسمية (صفحات المشرفة ومن بعدها)
 * ============================================================ */
function caseRows_() { return rows_(SH.cases).filter(function (r) { return str_(r['محذوف']) !== 'نعم'; }); }

function enrichCases_(all, teacherIndex) {
  var P = policy_();
  var tIdx = teacherIndex || {};
  var sorted = all.slice().sort(function (a, b) { return orderKey_(a, 'التاريخ', 'وقت الإنشاء') < orderKey_(b, 'التاريخ', 'وقت الإنشاء') ? -1 : 1; });
  var count = {}, seen = {};
  var isPriorDoc = function (d) { return /^سجل سابق/.test(d.notes || '') || d.action === 'سجل سابق' || d.who === 'سجل سابق'; };
  return sorted.map(function (r) {
    var off = P.off[str_(r['المخالفة'])] || {};
    var c = { id: str_(r['رقم الحالة']), created: str_(r['وقت الإنشاء']), createdDay: iso_(r['وقت الإنشاء']), source: str_(r['المصدر']), transferNo: str_(r['رقم التحويل']),
      teacher: str_(r['المعلمة']), date: iso_(r['التاريخ']), section: str_(r['الشعبة']), student: str_(r['الطالبة']),
      violation: str_(r['المخالفة']), short: off.short || str_(r['المخالفة']), degree: off.degree || '', code: off.code || '',
      by: str_(r['سجّلتها']), _row: r._row, doc: {} };
    CHAIN.forEach(function (st) {
      var p = STAGE_PREFIX[st];
      c.doc[st] = { date: iso_(r[p + ': تاريخ التنفيذ']),
        action: str_(r[p + ': الإجراء المتخذ'] || ''), contact: str_(r[p + ': التواصل مع ولي الأمر'] || ''),
        notes: str_(r[p + ': ملاحظات']), who: str_(r[p + ': من وثّقت'] || '') };
    });
    // التكرار: من تنبيه المعلمة في التحويل الصفي، وإلا بعدد مرات المخالفة نفسها للطالبة
    var k = [c.student, c.section, c.violation].join('|');
    count[k] = (count[k] || 0) + 1;
    var t = c.transferNo ? tIdx[c.transferNo] : null;
    c.rep = (t && t.cat === 1 && Number(t.alert)) ? Number(t.alert) : count[k];
    c.key = c.code ? policyKey_(c.code, c.rep) : '';
    c.req = c.key ? required_(c.key) : {};
    var tx = P.texts[c.key] || {};
    c.text = { teacher: tx.teacher, supervisor: tx.supervisor, coordinator: tx.coordinator, social: tx.social, psych: tx.psych, admin: tx.admin };
    c.teacherDid = t ? (t.done === 'نعم' ? 'نُفّذ' : 'لم يُوثَّق') + (t.contact ? ' • ' + t.contact : '') + (t.notes ? ' • ' + t.notes : '') : '';
    c.teacherAlert = t ? (t.cat === 1 ? 'التنبيه ' + t.alert : 'بلاغ') : '';
    var info = sectionInfo_(c.section);
    c.supervisors = info.supervisors; c.social = info.social;
    var stu = student_(c.student, c.section) || {};
    c.guardian = stu.guardian ? stu.guardian + (stu.phone ? ' ☎ ' + stu.phone : '') : '';
    c.qid = stu.qid || ''; c.nat = stu.nat || ''; c.phone = stu.phone || ''; c.gName = stu.guardian || ''; c.subject = t ? (t.subject || '') : '';
    // لا يبدأ دور جهة قبل أن تُستكمل فعليًا إجراءات الجهات السابقة: إن كانت دراسة الحالة أو التدخل أو اجتماع الفريق
    // في تكرارات سابقة مسجّلة «سجل سابق» فقط (دون توثيق فعلي)، تُضاف تلك الجهات إلى هذه الحالة قبل الجهة التالية
    c.extra = {};
    var live = !CHAIN.some(function (st) { return c.doc[st].date && isPriorDoc(c.doc[st]); });
    if (live) {
      (seen[k] || []).forEach(function (o) {
        ['coordinator', 'social', 'psych'].forEach(function (st) {
          if (o.req[st] && o.doc[st].date && isPriorDoc(o.doc[st]) && !c.req[st]) {
            c.extra[st] = c.extra[st] || []; c.extra[st].push({ rep: o.rep, text: o.text[st] || '' });
          }
        });
      });
      Object.keys(c.extra).forEach(function (st) {
        var l = c.extra[st], last = l[l.length - 1];
        c.req[st] = true;
        c.text[st] = 'استكمال ما لم يُوثَّق فعليًا في التكرار ' + l.map(function (x) { return x.rep; }).join(' و') + ' قبل انتقال الحالة للجهة التالية: ' + last.text +
          (st === 'social' || st === 'psych' ? ' — مع كتابة ملخص دراسة الحالة في الملاحظات' : '');
      });
    }
    // لا يبدأ دور المنسقة/الأخصائيتين/الإدارة في هذا التكرار قبل اكتمال إجراءات التكرار السابق
    c.waitPrev = (seen[k] || []).filter(function (o) { return o.pending.some(function (st) { return st !== 'supervisor'; }); }).map(function (o) { return o.id; });
    c.afterPrev = '';
    (seen[k] || []).forEach(function (o) { CHAIN.forEach(function (st) { if (st !== 'supervisor' && o.doc[st].date && !isPriorDoc(o.doc[st]) && o.doc[st].date > c.afterPrev) c.afterPrev = o.doc[st].date; }); });
    computeStages_(c);
    (seen[k] = seen[k] || []).push(c);
    return c;
  });
}

/** يحدد لكل جهة: مطلوبة؟ دورها بدأ؟ موثّقة؟ آخر موعد؟ — بالترتيب: المشرفة ← المنسقة ← الاجتماعية ← النفسية ← الإدارة */
function computeStages_(c) {
  var prevDone = startDay_(c.date, c.createdDay); // يبدأ دور أول جهة من تاريخ المخالفة، أو من يوم إدخالها إن أُدخلت بأثر رجعي
  var blocked = false;
  c.stages = {};
  var exStart = iso_(setting_('بداية استكمال الإجراءات', '2026-11-09'));
  CHAIN.forEach(function (st) {
    var need = !!c.req[st];
    var d = c.doc[st];
    if (need && c.extra && c.extra[st] && prevDone < exStart) prevDone = exStart; // مهلة الاستكمال تبدأ من تفعيله لا من تاريخ المخالفة
    if (need && st !== 'supervisor' && c.afterPrev && prevDone < c.afterPrev) prevDone = c.afterPrev; // تبدأ المهلة بعد آخر إجراء في التكرار السابق
    if (need && st !== 'supervisor' && c.waitPrev && c.waitPrev.length) blocked = true;
    var documented = need && !!d.date && (st !== 'supervisor' || !c.req.guardian || !!d.contact);
    var s = { need: need, documented: documented, open: false, start: '', due: '', late: false, compliance: 0 };
    if (need) {
      s.open = !blocked;            // دورها بدأ عندما اكتملت كل الجهات قبلها
      s.start = prevDone;
      s.due = deadline_(prevDone);
      if (documented) {
        s.compliance = d.date <= s.due ? 1 : 2;
        prevDone = d.date > prevDone ? d.date : prevDone;
      } else {
        s.late = s.open && today_() > s.due;
        s.compliance = s.open ? (s.late ? 3 : 4) : 5; // 5 = لم يحن دورها بعد
        blocked = true;
      }
    }
    c.stages[st] = s;
  });
  var pending = CHAIN.filter(function (st) { return c.stages[st].need && !c.stages[st].documented; });
  var lateNow = pending.filter(function (st) { return c.stages[st].late; });
  c.pending = pending;
  c.next = pending[0] || '';
  if (!pending.length) c.status = { code: 'done', text: '✔ اكتملت الإجراءات' };
  else if (lateNow.length) c.status = { code: 'late', text: '⛔ متأخر: ' + lateNow.map(function (s) { return STAGE_PREFIX[s]; }).join(' • ') };
  else if (c.waitPrev && c.waitPrev.length && pending[0] !== 'supervisor') c.status = { code: 'wait', text: '⏳ بانتظار اكتمال إجراءات الحالة السابقة ' + c.waitPrev.join('، ') + ' قبل دور ' + STAGE_PREFIX[pending[0]] };
  else c.status = { code: 'wait', text: '⏳ بانتظار: ' + STAGE_PREFIX[pending[0]] };
}

function allData_() {
  if (_cache._all) return _cache._all;
  var t = enrichTeacher_(teacherRecords_());
  var idx = {};
  t.forEach(function (r) { if (r.transferNo) idx[r.transferNo] = r; });
  var c = enrichCases_(caseRows_(), idx);
  var byTransfer = {};
  c.forEach(function (x) { if (x.transferNo) byTransfer[x.transferNo] = x; });
  t.forEach(function (r) {
    var cs = r.transferNo ? byTransfer[r.transferNo] : null;
    r.caseId = cs ? cs.id : '';
    r.caseStatus = cs ? cs.status.text : '';
    r.after = cs ? caseSummary_(cs) : '';
  });
  attachHistory_(c);
  _cache._all = { teacher: t, cases: c };
  return _cache._all;
}

/** سجل الإجراءات السابقة للطالبة في المخالفة نفسها — يظهر لكل جهة قبل أن تنفّذ دورها */
function attachHistory_(cases) {
  var by = {};
  cases.forEach(function (c) { var k = [c.student, c.section, c.violation].join('|'); (by[k] = by[k] || []).push(c); });
  var isPrior = function (d) { return /^سجل سابق/.test(d.notes || '') || d.action === 'سجل سابق' || d.who === 'سجل سابق'; };
  var steps = function (c, upto) {
    var out = [];
    if (c.teacherDid) out.push({ st: 'teacher', need: true, done: /^نُفّذ/.test(c.teacherDid), date: c.date, action: c.teacherDid, text: c.text.teacher || '' });
    CHAIN.forEach(function (st) {
      if (upto && st === upto) upto = '#';
      if (upto === '#') return;
      var x = c.stages[st]; if (!x.need) return;
      var d = c.doc[st];
      out.push({ st: st, need: true, done: x.documented, prior: x.documented && isPrior(d), date: d.date, action: d.action || d.contact || '', notes: isPrior(d) ? '' : d.notes, who: d.who && d.who !== 'سجل سابق' ? d.who : '', text: c.text[st] || '' });
    });
    return out;
  };
  cases.forEach(function (c) {
    if (c.status.code === 'done') return;
    var list = by[[c.student, c.section, c.violation].join('|')] || [];
    c.history = list.filter(function (o) { return o.id !== c.id && (o.date < c.date || (o.date === c.date && o.rep < c.rep)); })
      .map(function (o) { return { id: o.id, rep: o.rep, date: o.date, steps: steps(o) }; });
    c.current = steps(c, c.next);
  });
}

function caseSummary_(c) {
  var parts = [];
  CHAIN.forEach(function (st) {
    var s = c.stages[st];
    if (!s.need) return;
    parts.push(STAGE_PREFIX[st] + ': ' + (s.documented ? 'نُفّذ ' + arDate_(c.doc[st].date) : (s.open ? 'بانتظار' : 'لم يحن دورها')));
  });
  return parts.join(' • ');
}

var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function arDate_(d) {
  if (!d) return '';
  var p = d.split('-');
  return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1];
}

/* ============================================================
 *  الرسائل والتنبيهات (داخل المنصة + نسخة على البريد)
 * ============================================================ */
function notify_(toNames, subject, body, caseId, kind, link) {
  var from = 'منصة نوماس';
  (toNames || []).filter(String).forEach(function (to) {
    append_(SH.messages, COLS.messages, { 'المعرف': 'ر-' + Utilities.getUuid().slice(0, 8), 'الوقت': now_(), 'من': from, 'إلى': to,
      'الموضوع': subject, 'النص': body, 'الحالة': caseId || '', 'مقروءة': '', 'النوع': kind || 'تنبيه', 'الرابط': link || '' });
    email_(to, subject, body);
  });
}

function email_(toName, subject, body) {
  var mode = str_(setting_('إرسال البريد', 'تلقائي'));
  if (mode !== 'تلقائي') return;
  var u = users_().filter(function (x) { return x.name === toName && x.email; })[0];
  if (!u) return;
  var res = 'تم';
  try {
    var site = str_(setting_('رابط المنصة', ''));
    var html = '<div dir="rtl" style="font-family:Tahoma,Arial;font-size:15px;line-height:1.9;text-align:right">' +
      esc_(body).replace(/\n/g, '<br>') +
      (site ? '<br><br><a href="' + site + '">فتح منصة نوماس</a>' : '') +
      '<br><br><span style="color:#777;font-size:12px">حيث يُصان السَّنع، ويُبنى النوماس — مدرسة الشيماء الثانوية للبنات</span></div>';
    MailApp.sendEmail({ to: u.email, subject: subject, body: body + (site ? '\n\n' + site : ''), htmlBody: html, name: 'منصة نوماس' });
  } catch (err) { res = 'تعذّر: ' + err; }
  append_(SH.mailLog, COLS.mailLog, { 'الوقت': now_(), 'إلى': u.email, 'الموضوع': subject, 'النتيجة': res });
}
function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** يرسل لكل جهة جاء دورها بعد التحديث، مرة واحدة فقط */
function notifyStageOpen_(c) {
  var st = c.next;
  if (!st) return;
  var to = stageOwners_(c, st);
  var subj = 'حالة ' + c.id + ' بانتظار إجرائكِ — ' + c.student + ' (' + c.section + ')';
  var body = 'السلام عليكم ورحمة الله وبركاته،\n' +
    'نشكر لكِ جهودكِ المخلصة وحرصكِ الدائم على متابعة طالباتنا، ونحيطكِ علمًا بوصول الحالة الآتية إليكِ وفق السياسة:\n' +
    '• الطالبة: ' + c.student + ' — الشعبة ' + c.section + '\n' +
    '• المخالفة: ' + c.violation + ' — التكرار ' + c.rep + '\n' +
    '• تاريخ المخالفة: ' + arDate_(c.date) + '\n' +
    '• المطلوب منكِ حسب السياسة: ' + (c.text[st] || '') + '\n' +
    (st === 'coordinator' && c.req.pledge ? '📎 مرفق: التعهد الخطي للطالبة (تسلّمه المشرفة)\n' : '') +
    'يرجى تنفيذ الإجراء وتوثيقه في المنصة خلال المهلة المعتمدة.\n' +
    'وتفضلوا بقبول فائق الاحترام والتقدير،';
  notify_(to, subj, body, c.id, 'حالة', st);
}

function stageOwners_(c, st) {
  if (st === 'supervisor') return c.supervisors;
  if (st === 'coordinator') return usersByRole_('coordinator').map(function (u) { return u.name; });
  if (st === 'social') return c.social ? [c.social] : usersByRole_('social').map(function (u) { return u.name; });
  if (st === 'psych') return usersByRole_('psych').map(function (u) { return u.name; });
  if (st === 'admin') return usersByRole_('admin').map(function (u) { return u.name; });
  return [];
}

/* ============================================================
 *  الواجهات (API)
 * ============================================================ */
var API = {};

API.me = function (me) {
  return { me: publicUser_(me) };
};

/** بيانات البدء لكل دور + المهام المعلّقة للنافذة الأولى */
API.bootstrap = function (me) {
  var P = policy_();
  var data = allData_();
  var res = { me: publicUser_(me), today: today_(), dates: allowedDates_(), deadlineDays: Number(setting_('المهلة', 2)) || 2,
    lists: lists_(), forms: formsInfo_(), staff: users_().map(function (u) { return { name: u.name, role: u.role, roleLabel: ROLE_LABEL[u.role] }; }) };
  if (me.role === 'daily') {
    res.tasks = []; res.taskCounts = { beh: 0, abs: 0 }; res.abs = null; res.unread = unread_(me);
    return res;
  }
  if (me.role === 'teacher') {
    var asg = rows_(SH.schedule).filter(function (r) { return teaches_(r, me.name); })
      .map(function (r) { return { section: str_(r['الشعبة']), subject: str_(r['المادة']) }; });
    var secs = {};
    asg.forEach(function (a) { secs[a.section] = 1; });
    res.assignments = asg;
    res.students = studentsFor_(Object.keys(secs));
    res.violations = P.classList.map(function (v) {
      return { label: v.label, degree: v.degree, cat: v.cat, max: v.max, official: v.official, steps: v.steps };
    });
    res.records = data.teacher.filter(function (r) { return r.teacher === me.name; }).map(teacherPublic_).reverse();
  } else {
    res.sections = sectionsFor_(me);
    res.students = studentsFor_(res.sections);
    res.violations = P.offList.map(function (v) { return { label: v.name, short: v.short, degree: v.degree, code: v.code }; });
    res.cases = casesFor_(me, data.cases).map(casePublic_);
    if (me.role === 'supervisor' || me.role === 'admin') res.tardy = tardyFor_(me).slice(-300).reverse();
  }
  res.tasks = tasks_(me, data);
  try { res.abs = absBoot_(me); } catch (err) { res.abs = null; res.absError = String(err && err.message || err); }
  var at = res.abs ? res.abs.tasks : [];
  res.tasks = res.tasks.concat(at);
  res.taskCounts = { beh: res.tasks.length - at.length, abs: at.length };
  if (res.abs) delete res.abs.tasks;
  res.unread = unread_(me);
  return res;
};

function lists_() {
  var out = {};
  var r = rows_(SH.lists);
  ['التواصل مع ولي الأمر', 'ملاحظات المعلمة', 'إجراءات المنسقة', 'إجراءات الاجتماعية', 'إجراءات النفسية'].forEach(function (k) {
    out[k] = r.map(function (x) { return str_(x[k]); }).filter(String);
  });
  out['تواصل المشرفة'] = ['هاتفيًا', 'رسالة نصية', 'حضور ولي الأمر', 'لم يرد ولي الأمر'];
  out['إجراءات الإدارة'] = ['اجتماع فريق إدارة سلوك الطلبة', 'استدعاء ولي الأمر', 'إيقاف تعليمي وفق السياسة', 'إحالة لقسم حماية ورعاية الطلبة', 'أخرى (اكتبيها)'];
  return out;
}

function sectionsFor_(me) {
  if (me.role === 'supervisor') {
    return allSections_().filter(function (s) { return sectionInfo_(s).supervisors.indexOf(me.name) >= 0; });
  }
  if (me.role === 'social') {
    return allSections_().filter(function (s) { return sectionInfo_(s).social === me.name; });
  }
  return allSections_();
}
function studentsFor_(secs) {
  var out = {};
  secs.forEach(function (s) { out[s] = []; });
  students_().forEach(function (st) { if (out[st.section]) out[st.section].push(st.name); });
  return out;
}

function teacherPublic_(r) {
  return { id: r.id, subject: r.subject, section: r.section, date: r.date, student: r.student, violation: r.violation,
    degree: r.degree, cat: r.cat, alert: r.alert, action: r.action, guardianRequired: r.guardianRequired, guardianNote: r.guardianNote,
    done: r.done, contact: r.contact, contactDate: r.contactDate, notes: r.notes, transferNo: r.transferNo, kind: r.kind,
    transferRequired: r.transferRequired, status: r.status, due: r.due, caseId: r.caseId, caseStatus: r.caseStatus, after: r.after,
    teacherPolicyText: r.teacherPolicyText };
}

function casePublic_(c) {
  return { id: c.id, source: c.source, transferNo: c.transferNo, teacher: c.teacher, date: c.date, section: c.section,
    student: c.student, violation: c.violation, short: c.short, degree: c.degree, rep: c.rep, key: c.key, req: c.req, text: c.text,
    doc: c.doc, stages: c.stages, status: c.status, next: c.next, teacherDid: c.teacherDid, teacherAlert: c.teacherAlert,
    guardian: c.guardian, supervisors: c.supervisors, social: c.social, by: c.by,
    qid: c.qid, nat: c.nat, phone: c.phone, gName: c.gName, subject: c.subject, history: c.history || [], current: c.current || [] };
}

/** الحالات التي تخص المستخدمة */
function casesFor_(me, cases) {
  if (me.role === 'admin') return cases;
  if (me.role === 'supervisor') return cases.filter(function (c) { return c.supervisors.indexOf(me.name) >= 0; });
  if (me.role === 'coordinator') return cases.filter(function (c) { return c.req.coordinator; });
  if (me.role === 'social') return cases.filter(function (c) { return c.req.social && (c.social === me.name || !c.social); });
  if (me.role === 'psych') return cases.filter(function (c) { return c.req.psych; });
  return [];
}

/** المهام المعلّقة — تظهر في النافذة الأولى بعد الدخول */
function tasks_(me, data) {
  var list = [];
  if (me.role === 'teacher') {
    data.teacher.filter(function (r) { return r.teacher === me.name && r.status.code !== 'done'; }).forEach(function (r) {
      list.push({ type: 'teacher', id: r.id, title: r.student + ' — ' + r.section, sub: r.status.text, late: r.status.code === 'late' });
    });
  } else {
    var st = me.role;
    casesFor_(me, data.cases).forEach(function (c) {
      var s = c.stages[st];
      if (s && s.need && s.open && !s.documented) {
        list.push({ type: 'case', id: c.id, title: c.student + ' — ' + c.section, sub: c.short + ' • التكرار ' + c.rep + (s.late ? ' • ⛔ متأخر' : ' • آخر موعد ' + arDate_(s.due)), late: s.late });
      }
    });
  }
  list.sort(function (a, b) { return (b.late ? 1 : 0) - (a.late ? 1 : 0); });
  return list;
}

function unread_(me) {
  return rows_(SH.messages).filter(function (m) { return str_(m['إلى']) === me.name && str_(m['مقروءة']) !== 'نعم'; }).length;
}

/** نبض كل دقيقة: عدد الرسائل غير المقروءة والمهام — لتشغيل التنبيه الصوتي */
API.poll = function (me) {
  var data = allData_();
  var msgs = rows_(SH.messages).filter(function (m) { return str_(m['إلى']) === me.name && str_(m['مقروءة']) !== 'نعم'; });
  var last = msgs.length ? msgs[msgs.length - 1] : null;
  var nb = me.role === 'daily' ? 0 : tasks_(me, data).length, na = 0;
  if (me.role !== 'daily') try { na = absTasks_(me, absData_()).length; } catch (err) { }
  return { unread: msgs.length, tasks: nb + na, taskCounts: { beh: nb, abs: na }, last: last ? { subject: str_(last['الموضوع']), time: str_(last['الوقت']) } : null };
};


/* ============================================================
 *  حصيلة اليوم — التأخير الصباحي والغياب (لصفة «حصر الحضور» والإدارة)
 * ============================================================ */
API.dailyReport = function (me, req) {
  if (me.role !== 'daily' && me.role !== 'admin') throw new Error('هذه الصفحة لحصر الحضور');
  var d = str_(req.date) || today_();
  var stIdx = {};
  students_().forEach(function (s) { stIdx[s.name + '|' + s.section] = s; });
  var row = function (name, section, n) {
    var s = stIdx[name + '|' + section] || {};
    return { qid: s.qid || '', student: name, section: section, grade: section.split('-')[0], n: n, phone: s.phone || '', guardian: s.guardian || '' };
  };
  var sortFn = function (a, b) { return a.section === b.section ? (a.student < b.student ? -1 : 1) : (secKey_(a.section) < secKey_(b.section) ? -1 : 1); };
  // التأخير: من «التأخير الصباحي» + مخالفات التأخر المسجّلة «خارج الصف» — عدد المرات حتى التاريخ المختار
  var ev = [];
  tardyRows_().forEach(function (r) { ev.push({ date: iso_(r['التاريخ']), student: str_(r['الطالبة']), section: str_(r['الشعبة']), src: 'التأخير الصباحي' }); });
  allData_().cases.forEach(function (c) {
    if (c.source === 'خارج الصف' && /^التأخر/.test(c.violation)) ev.push({ date: c.date, student: c.student, section: c.section, src: c.short || c.violation });
  });
  var cnt = {}, seenD = {}, tardy = [], seenT = {};
  ev.sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (e) {
    if (!e.date || e.date > d) return;
    var k = e.student + '|' + e.section;
    if (seenD[k + '|' + e.date]) return;          // اليوم الواحد يُحتسب مرة واحدة
    seenD[k + '|' + e.date] = 1;
    cnt[k] = (cnt[k] || 0) + 1;
    if (e.date === d && !seenT[k]) { seenT[k] = 1; tardy.push({ k: k, student: e.student, section: e.section, src: e.src }); }
  });
  tardy = tardy.map(function (t) { var o = row(t.student, t.section, cnt[t.k]); o.src = t.src; return o; }).sort(sortFn);
  // الغياب: أيام الغياب المحتسبة حتى التاريخ المختار (دون «حضرت متأخرة» والمكرر)
  var aCnt = {}, abs = [], seenA = {};
  absData_().forEach(function (a) {
    if (a.kind === 'late' || a.kind === 'dup' || a.date > d) return;
    var k = a.student + '|' + a.section;
    aCnt[k] = (aCnt[k] || 0) + 1;
    if (a.date === d && !seenA[k]) { seenA[k] = 1; abs.push(a); }
  });
  abs = abs.map(function (a) { var o = row(a.student, a.section, aCnt[a.student + '|' + a.section]); o.decision = a.decision || 'بانتظار قرار المشرفة'; return o; }).sort(sortFn);
  var t0 = today_(), lastT = '', lastA = '';
  ev.forEach(function (e) { if (e.date && e.date <= t0 && e.date > lastT) lastT = e.date; });
  absData_().forEach(function (a) { if (a.kind !== 'late' && a.kind !== 'dup' && a.date <= t0 && a.date > lastA) lastA = a.date; });
  return { date: d, tardy: tardy, absence: abs, last: { tardy: lastT, absence: lastA } };
};
function secKey_(s) { var p = String(s).split('-'); return ('00' + p[0]).slice(-2) + '-' + ('00' + (p[1] || '')).slice(-2); }


/* ============================================================
 *  الاستمارات الرسمية — الأسماء في خانات التوقيع، والإرسال بالبريد مع النسخة
 * ============================================================ */
function formsInfo_() {
  var vp = usersByRole_('admin').filter(function (u) { return u.roleAr === 'النائب الإداري'; })[0];
  return { principal: str_(setting_('اسم مديرة المدرسة', 'شيخة الرميحي')), adminVP: vp ? vp.name : '',
    coordinators: usersByRole_('coordinator').map(function (u) { return u.name; }),
    psych: usersByRole_('psych').map(function (u) { return u.name; }), year: str_(setting_('العام الدراسي', '')) };
}
function ccEmails_() {
  var v = str_(setting_('بريد نسخة الاستمارات', ''));
  if (v) return v.split(/[،,;\s]+/).filter(String);
  var out = [];
  users_().forEach(function (u) { if (u.email && (u.roleAr === 'النائب الإداري' || u.name === str_(setting_('اسم مديرة المدرسة', 'شيخة الرميحي')))) out.push(u.email); });
  return out;
}
API.sendForm = function (me, req) {
  if (me.role === 'teacher' || me.role === 'daily') throw new Error('الإرسال للإدارة والمشرفات والأخصائيات');
  var to = users_().filter(function (u) { return u.name === str_(req.to) && u.email; })[0];
  if (!to) throw new Error('لا يوجد بريد مسجّل لـ ' + str_(req.to));
  var b64 = String(req.pdf || '').replace(/^data:[^,]+,/, '');
  if (!b64) throw new Error('الاستمارة غير جاهزة');
  if (b64.length > 9000000) throw new Error('حجم الاستمارة كبير');
  var name = (str_(req.title) || 'استمارة') + ' — ' + str_(req.student) + '.pdf';
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), 'application/pdf', name);
  var cc = ccEmails_().filter(function (e) { return e !== to.email; });
  var subject = str_(req.title) + ' — ' + str_(req.student) + (req.section ? ' (' + str_(req.section) + ')' : '');
  var note = str_(req.note);
  var body = 'السلام عليكم ورحمة الله وبركاته،\nنرفق لكم ' + str_(req.title) + ' للطالبة ' + str_(req.student) +
    (req.section ? ' — الشعبة ' + str_(req.section) : '') + '.\n' + (note ? note + '\n' : '') + '\nمرسلة من: ' + me.name + ' (' + ROLE_LABEL[me.role] + ')';
  var html = '<div dir="rtl" style="font-family:Tahoma,Arial;font-size:15px;line-height:1.9;text-align:right">' + esc_(body).replace(/\n/g, '<br>') + '</div>';
  var res = 'تم';
  try {
    MailApp.sendEmail({ to: to.email, cc: cc.join(','), subject: subject, body: body, htmlBody: html, attachments: [blob], name: 'منصة نوماس — ' + me.name });
  } catch (err) { res = 'تعذّر: ' + err; }
  append_(SH.mailLog, COLS.mailLog, { 'الوقت': now_(), 'إلى': to.email + (cc.length ? ' • نسخة: ' + cc.join('، ') : ''), 'الموضوع': subject, 'النتيجة': res });
  if (res !== 'تم') throw new Error('تعذّر الإرسال، حاولي مرة أخرى');
  append_(SH.messages, COLS.messages, { 'المعرف': 'ر-' + Utilities.getUuid().slice(0, 8), 'الوقت': now_(), 'من': me.name, 'إلى': to.name,
    'الموضوع': subject, 'النص': body + '\n📎 الاستمارة مرفقة في بريدكِ الرسمي.', 'الحالة': str_(req.caseId), 'مقروءة': '', 'النوع': 'استمارة', 'الرابط': '' });
  flush_();
  return { sent: true, to: to.name, cc: cc.length };
};

/* ---------- المعلمة ---------- */
API.recordTeacher = function (me, req) {
  if (me.role !== 'teacher') throw new Error('هذه الصفحة للمعلمات');
  var P = policy_();
  var subject = str_(req.subject), section = str_(req.section), date = str_(req.date), student = str_(req.student), viol = str_(req.violation);
  var ok = rows_(SH.schedule).some(function (r) { return teaches_(r, me.name) && str_(r['الشعبة']) === section && str_(r['المادة']) === subject; });
  if (!ok) throw new Error('المادة غير مقررة لكِ في هذه الشعبة');
  checkDate_(date);
  if (!student_(student, section)) throw new Error('الطالبة لا تتبع الشعبة المختارة');
  if (!P.classV[viol]) throw new Error('المخالفة غير موجودة في القائمة');
  var id = 'م-' + pad_(rows_(SH.teacher).length + 1, 4);
  append_(SH.teacher, COLS.teacher, { 'المعرف': id, 'وقت الإدخال': now_(), 'المعلمة': me.name, 'المادة': subject, 'الشعبة': section,
    'التاريخ': date, 'الطالبة': student, 'المخالفة': viol });
  flush_();
  var rec = allData_().teacher.filter(function (r) { return r.id === id; })[0];
  var stu = student_(student, section);
  return { record: teacherPublic_(rec), guardian: rec.guardianRequired ? { name: stu.guardian, phone: stu.phone } : null };
};

/** توثيق المعلمة: التنفيذ والتواصل والملاحظات، ثم التحويل التلقائي للمشرفة إن طلبته السياسة */
API.updateTeacher = function (me, req) {
  var r = teacherRecords_().filter(function (x) { return str_(x['المعرف']) === str_(req.id) && str_(x['المعلمة']) === me.name; })[0];
  if (!r) throw new Error('السجل غير موجود');
  var ch = {};
  if (req.done !== undefined) ch['تم التنفيذ'] = str_(req.done);
  if (req.contact !== undefined) ch['التواصل مع ولي الأمر'] = str_(req.contact);
  if (req.contactDate !== undefined) { if (req.contactDate) checkDate_(str_(req.contactDate)); ch['تاريخ التواصل'] = str_(req.contactDate); }
  if (req.notes !== undefined) ch['ملاحظات'] = str_(req.notes);
  update_(SH.teacher, r, ch);
  flush_();
  var rec = allData_().teacher.filter(function (x) { return x.id === str_(req.id); })[0];
  var transferred = null;
  if (rec.transferRequired && !rec.transferNo && rec.done === 'نعم') transferred = transfer_(me, rec);
  flush_();
  rec = allData_().teacher.filter(function (x) { return x.id === str_(req.id); })[0];
  return { record: teacherPublic_(rec), transferred: transferred };
};

function transfer_(me, rec) {
  var P = policy_();
  var tno = 'ت-' + pad_(nextNo_(rows_(SH.teacher).map(function (x) { return str_(x['رقم التحويل']); })), 4);
  var row = teacherRecords_().filter(function (x) { return str_(x['المعرف']) === rec.id; })[0];
  update_(SH.teacher, row, { 'رقم التحويل': tno });
  if (!P.off[rec.official]) throw new Error('بند السياسة غير معرّف لهذه المخالفة');
  var cid = newCaseId_();
  append_(SH.cases, COLS.cases, { 'رقم الحالة': cid, 'وقت الإنشاء': now_(), 'المصدر': 'داخل الصف', 'رقم التحويل': tno, 'المعلمة': me.name,
    'التاريخ': rec.date, 'الشعبة': rec.section, 'الطالبة': rec.student, 'المخالفة': rec.official, 'سجّلتها': me.name });
  flush_();
  var c = allData_().cases.filter(function (x) { return x.id === cid; })[0];
  // رسالة المعلمة للمشرفة — نفس صياغة النظام المعتمد
  var t = allData_().teacher.filter(function (x) { return x.id === rec.id; })[0];
  var subj = (t.cat === 2 ? 'بلاغ ' : 'تحويل ') + tno + ' — ' + rec.student + ' (' + rec.section + ')';
  var body = 'الأستاذة الفاضلة المحترمة،\nالسلام عليكم ورحمة الله وبركاته،\n' +
    'نشكر لكِ جهودكِ المخلصة وحرصكِ الدائم على متابعة انضباط طالباتنا، ونحيطكِ علمًا ب' + (t.cat === 2 ? 'بلاغ مخالفة سلوكية' : 'تحويل مخالفة صفية') + ' رقم ' + tno + ' وفق التفاصيل الآتية:\n' +
    '• الطالبة: ' + rec.student + ' — الشعبة ' + rec.section + '\n' +
    '• المخالفة: ' + rec.official + (t.cat === 1 ? ' — التنبيه ' + t.alert : '') + '\n' +
    '• التاريخ والمادة: ' + arDate_(rec.date) + ' — ' + rec.subject.replace(/\s*\(.*\)$/, '') + '\n' +
    '• ما قامت به المعلمة: ' + (t.done === 'نعم' ? 'نُفّذ الإجراء' : 'لم يُوثَّق التنفيذ') + (t.contact ? ' • ' + t.contact : '') + (t.notes ? ' • ' + t.notes : '') + '\n' +
    '• المطلوب منكِ حسب السياسة: ' + (c.text.supervisor || 'يُحدَّد عند القيد') + '\n' +
    'الحالة ظاهرة في صفحتكِ بالمنصة برقم ' + c.id + '، يرجى اتخاذ الإجراء وتوثيقه خلال المهلة المعتمدة.\n' +
    'وتفضلوا بقبول فائق الاحترام والتقدير،\nالمعلمة/ ' + me.name;
  notify_(c.supervisors, subj, body, c.id, 'تحويل', 'supervisor');
  return { transferNo: tno, caseId: cid, supervisors: c.supervisors };
}

/** بيانات ولي الأمر لسجل المعلمة — تظهر فقط إذا كان التواصل من إجرائها حسب السياسة */
API.guardianFor = function (me, req) {
  var rec = allData_().teacher.filter(function (x) { return x.id === str_(req.id) && x.teacher === me.name; })[0];
  if (!rec) throw new Error('السجل غير موجود');
  if (!rec.guardianRequired) return { guardian: null };
  var stu = student_(rec.student, rec.section) || {};
  return { guardian: { name: stu.guardian, phone: stu.phone } };
};

API.deleteTeacher = function (me, req) {
  var r = teacherRecords_().filter(function (x) { return str_(x['المعرف']) === str_(req.id) && str_(x['المعلمة']) === me.name; })[0];
  if (!r) throw new Error('السجل غير موجود');
  update_(SH.teacher, r, { 'محذوف': 'نعم' });
  var tno = str_(r['رقم التحويل']);
  if (tno) caseRows_().filter(function (x) { return str_(x['رقم التحويل']) === tno; }).forEach(function (x) { update_(SH.cases, x, { 'محذوف': 'نعم' }); });
  flush_();
  return { deleted: true, caseDeleted: !!tno };
};

/** تعديل سجل المعلمة (التاريخ أو المخالفة)، ويتعدل معه سجل الحالة المحوّلة */
API.editTeacher = function (me, req) {
  var P = policy_();
  var r = teacherRecords_().filter(function (x) { return str_(x['المعرف']) === str_(req.id) && str_(x['المعلمة']) === me.name; })[0];
  if (!r) throw new Error('السجل غير موجود');
  var ch = {};
  if (req.date) { checkDate_(str_(req.date)); ch['التاريخ'] = str_(req.date); }
  if (req.violation) { if (!P.classV[str_(req.violation)]) throw new Error('المخالفة غير موجودة في القائمة'); ch['المخالفة'] = str_(req.violation); }
  update_(SH.teacher, r, ch);
  flush_();
  var rec = allData_().teacher.filter(function (x) { return x.id === str_(req.id); })[0];
  if (rec.transferNo) {
    caseRows_().filter(function (x) { return str_(x['رقم التحويل']) === rec.transferNo; }).forEach(function (x) {
      var cc = {}; if (ch['التاريخ']) cc['التاريخ'] = ch['التاريخ']; if (ch['المخالفة']) cc['المخالفة'] = rec.official;
      update_(SH.cases, x, cc);
    });
    flush_();
    rec = allData_().teacher.filter(function (x) { return x.id === str_(req.id); })[0];
  }
  return { record: teacherPublic_(rec) };
};

/* ---------- المشرفة: حالة خارج الصف ---------- */
API.createCase = function (me, req) {
  if (me.role !== 'supervisor' && me.role !== 'admin') throw new Error('تسجيل المخالفات خارج الصف للمشرفات');
  var P = policy_();
  var section = str_(req.section), date = str_(req.date), student = str_(req.student), viol = str_(req.violation);
  if (me.role === 'supervisor' && sectionsFor_(me).indexOf(section) < 0) throw new Error('الشعبة ليست ضمن شعبكِ');
  checkDate_(date);
  if (!student_(student, section)) throw new Error('الطالبة لا تتبع الشعبة المختارة');
  if (!P.off[viol]) throw new Error('المخالفة غير موجودة في السياسة');
  var cid = newCaseId_();
  append_(SH.cases, COLS.cases, { 'رقم الحالة': cid, 'وقت الإنشاء': now_(), 'المصدر': 'خارج الصف', 'التاريخ': date, 'الشعبة': section,
    'الطالبة': student, 'المخالفة': viol, 'سجّلتها': me.name });
  flush_();
  var c = allData_().cases.filter(function (x) { return x.id === cid; })[0];
  if (c.next && c.next !== 'supervisor') notifyStageOpen_(c);
  return { case: casePublic_(c) };
};

function newCaseId_() {
  return 'ح-' + pad_(nextNo_(rows_(SH.cases).map(function (x) { return str_(x['رقم الحالة']); })), 4);
}
/** الرقم التالي = أكبر رقم مستخدم + 1، فلا يتكرر رقم بعد نقل بيانات أو حذف */
function nextNo_(ids) {
  var m = 0;
  ids.forEach(function (id) { var n = Number(String(id).replace(/[^0-9]/g, '')); if (n > m) m = n; });
  return m + 1;
}
function pad_(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }

/** توثيق أي جهة لدورها في الحالة */
API.documentCase = function (me, req) {
  var st = me.role === 'admin' ? 'admin' : me.role;
  if (CHAIN.indexOf(st) < 0) throw new Error('لا يوجد دور توثيق لهذه الصفة');
  var c = allData_().cases.filter(function (x) { return x.id === str_(req.id); })[0];
  if (!c) throw new Error('الحالة غير موجودة');
  if (casesFor_(me, [c]).length === 0) throw new Error('الحالة لا تخصكِ');
  var s = c.stages[st];
  if (!s || !s.need) throw new Error('لا يوجد إجراء مطلوب منكِ في هذه الحالة حسب السياسة');
  if (!s.open) throw new Error(c.waitPrev && c.waitPrev.length && st !== 'supervisor' ? 'لم يحن دوركِ بعد — بانتظار اكتمال إجراءات الحالة السابقة ' + c.waitPrev.join('، ') : 'لم يحن دوركِ بعد — بانتظار ' + STAGE_PREFIX[c.next]);
  var d = str_(req.date);
  if (d) { checkDate_(d); if (d < c.date) throw new Error('تاريخ التنفيذ قبل تاريخ المخالفة'); }
  var p = STAGE_PREFIX[st], ch = {};
  ch[p + ': تاريخ التنفيذ'] = d;
  ch[p + ': ملاحظات'] = str_(req.notes);
  if (st === 'supervisor') { ch['المشرفة: التواصل مع ولي الأمر'] = str_(req.contact); ch['المشرفة: من وثّقت'] = me.name; }
  else ch[p + ': الإجراء المتخذ'] = str_(req.taken);
  if ((st === 'social' || st === 'psych') && d && str_(req.notes).length < 15) throw new Error('اكتبي ملخص دراسة الحالة أو التدخل في الملاحظات (سطر واحد على الأقل)؛ لتطّلع عليه الجهة التالية');
  if (st === 'supervisor' && c.req.guardian && d && !str_(req.contact)) throw new Error('السياسة تطلب التواصل مع ولي الأمر — اختاري طريقة التواصل');
  var row = caseRows_().filter(function (x) { return str_(x['رقم الحالة']) === c.id; })[0];
  var before = c.next;
  var waiting = allData_().cases.filter(function (x) { return (x.waitPrev || []).indexOf(c.id) >= 0; }).map(function (x) { return x.id; });
  update_(SH.cases, row, ch);
  flush_();
  var c2 = allData_().cases.filter(function (x) { return x.id === c.id; })[0];
  if (c2.next && c2.next !== before) notifyStageOpen_(c2);
  // اكتملت هذه الحالة ← يبدأ دور الجهة التالية في التكرار الذي كان ينتظرها
  allData_().cases.filter(function (x) { return waiting.indexOf(x.id) >= 0 && !(x.waitPrev || []).length && x.next && x.next !== 'supervisor'; })
    .forEach(function (x) { notifyStageOpen_(x); });
  if (!c2.next && before && c2.teacher) {
    notify_([c2.teacher], 'اكتملت إجراءات الحالة ' + c2.id, 'نحيطكِ علمًا باكتمال جميع الإجراءات المطلوبة وفق السياسة للحالة ' + c2.id +
      ' (الطالبة ' + c2.student + ' — الشعبة ' + c2.section + ').\nلأنّ الطِّيب نوماس.', c2.id, 'إشعار', 'teacher');
  }
  return { case: casePublic_(c2) };
};

function canFixCase_(me, c) {
  if (me.role === 'admin') return true;
  if (c.by === me.name) return true;
  return me.role === 'supervisor' && sectionsFor_(me).indexOf(c.section) >= 0;
}
API.deleteCase = function (me, req) {
  var c = allData_().cases.filter(function (x) { return x.id === str_(req.id); })[0];
  if (!c) throw new Error('الحالة غير موجودة');
  if (!canFixCase_(me, c)) throw new Error('الحذف لمشرفة الشعبة أو الإدارة');
  var row = caseRows_().filter(function (x) { return str_(x['رقم الحالة']) === c.id; })[0];
  update_(SH.cases, row, { 'محذوف': 'نعم' });
  flush_();
  return { deleted: true };
};
/** تعديل تاريخ المخالفة أو نوعها — يُعاد حساب التكرار والإجراءات تلقائيًا */
API.editCase = function (me, req) {
  var P = policy_();
  var c = allData_().cases.filter(function (x) { return x.id === str_(req.id); })[0];
  if (!c) throw new Error('الحالة غير موجودة');
  if (!canFixCase_(me, c)) throw new Error('التعديل لمشرفة الشعبة أو الإدارة');
  var ch = {};
  if (req.date) { checkDate_(str_(req.date)); ch['التاريخ'] = str_(req.date); }
  if (req.violation) { if (!P.off[str_(req.violation)]) throw new Error('المخالفة غير موجودة في السياسة'); ch['المخالفة'] = str_(req.violation); }
  var row = caseRows_().filter(function (x) { return str_(x['رقم الحالة']) === c.id; })[0];
  update_(SH.cases, row, ch);
  flush_();
  return { case: casePublic_(allData_().cases.filter(function (x) { return x.id === c.id; })[0]) };
};

/* ---------- سجل التأخير الصباحي ---------- */
function tardyRows_() { return rows_(SH.tardy).filter(function (r) { return str_(r['محذوف']) !== 'نعم'; }); }
function tardyFor_(me) {
  var secs = sectionsFor_(me);
  var cnt = {};
  return tardyRows_().slice().sort(function (a, b) { return orderKey_(a, 'التاريخ', 'وقت الإدخال') < orderKey_(b, 'التاريخ', 'وقت الإدخال') ? -1 : 1; })
    .map(function (r) {
      var k = str_(r['الطالبة']) + '|' + str_(r['الشعبة']);
      cnt[k] = (cnt[k] || 0) + 1;
      return { id: str_(r['المعرف']), date: iso_(r['التاريخ']), section: str_(r['الشعبة']), student: str_(r['الطالبة']), by: str_(r['سجّلتها']),
        notes: str_(r['ملاحظات']), n: cnt[k], created: str_(r['وقت الإدخال']) };
    }).filter(function (r) { return secs.indexOf(r.section) >= 0; });
}
var TARDY_V = 'التأخر عن الطابور الصباحي / عدم المشاركة فيه';
/** كل تأخير صباحي = مخالفة «التأخر عن الطابور الصباحي» (الدرجة الأولى) بحالة مرتبطة به، فيُحسب التكرار والإجراء حسب السياسة.
 *  التأخيرات المسجّلة قبل هذه الميزة تُضاف حالاتها موثّقة (سجل سابق) لتدخل في التكرار فقط دون مهام. */
function syncTardyCases_() {
  var cases = caseRows_();
  var linked = {}, byDay = {};
  cases.forEach(function (c) {
    if (str_(c['رقم التحويل'])) linked[str_(c['رقم التحويل'])] = 1;
    if (str_(c['المخالفة']) === TARDY_V) byDay[str_(c['الطالبة']) + '|' + str_(c['الشعبة']) + '|' + iso_(c['التاريخ'])] = 1;
  });
  var base = nextNo_(rows_(SH.cases).map(function (x) { return str_(x['رقم الحالة']); })), add = [];
  tardyRows_().forEach(function (r) {
    var id = str_(r['المعرف']), d = iso_(r['التاريخ']);
    if (!d || linked[id]) return;
    var k = str_(r['الطالبة']) + '|' + str_(r['الشعبة']) + '|' + d;
    if (byDay[k]) return;               // مسجّلة مسبقًا كمخالفة في اليوم نفسه
    byDay[k] = 1;
    var o = { 'رقم الحالة': 'ح-' + pad_(base + add.length, 4), 'وقت الإنشاء': iso_(r['وقت الإدخال']) || d, 'المصدر': 'خارج الصف', 'رقم التحويل': id,
      'التاريخ': d, 'الشعبة': str_(r['الشعبة']), 'الطالبة': str_(r['الطالبة']), 'المخالفة': TARDY_V, 'سجّلتها': str_(r['سجّلتها']),
      'المشرفة: التواصل مع ولي الأمر': 'سجل سابق', 'المشرفة: من وثّقت': 'سجل سابق' };
    CHAIN.forEach(function (st) { o[STAGE_PREFIX[st] + ': تاريخ التنفيذ'] = d; o[STAGE_PREFIX[st] + ': ملاحظات'] = 'سجل سابق — من سجل التأخير الصباحي'; });
    ['المنسقة', 'الاجتماعية', 'النفسية', 'الإدارة'].forEach(function (p) { o[p + ': الإجراء المتخذ'] = 'سجل سابق'; });
    add.push(o);
  });
  appendMany_(SH.cases, COLS.cases, add);
  return add.length;
}
API.recordTardy = function (me, req) {
  if (me.role !== 'supervisor' && me.role !== 'admin') throw new Error('سجل التأخير للمشرفات');
  var section = str_(req.section);
  if (me.role === 'supervisor' && sectionsFor_(me).indexOf(section) < 0) throw new Error('الشعبة ليست ضمن شعبكِ');
  // عدة تواريخ لطالبة (بأثر رجعي) أو عدة طالبات في يوم واحد
  var entries = (req.entries && req.entries.length) ? req.entries.map(function (e) { return { student: str_(e.student), date: str_(e.date) }; })
    : (req.students || [req.student]).map(function (n) { return { student: str_(n), date: str_(req.date) }; });
  entries = entries.filter(function (e) { return e.student && e.date; });
  if (!entries.length) throw new Error('اختاري الطالبة والتاريخ');
  entries.forEach(function (e) { checkDate_(e.date); if (!student_(e.student, section)) throw new Error('الطالبة لا تتبع الشعبة المختارة: ' + e.student); });
  syncTardyCases_(); flush_();
  var exists = {}, caseDay = {};
  tardyRows_().forEach(function (r) { exists[str_(r['الطالبة']) + '|' + str_(r['الشعبة']) + '|' + iso_(r['التاريخ'])] = 1; });
  caseRows_().forEach(function (c) { if (str_(c['المخالفة']) === TARDY_V) caseDay[str_(c['الطالبة']) + '|' + str_(c['الشعبة']) + '|' + iso_(c['التاريخ'])] = 1; });
  var tRows = [], cRows = [], skipped = [], ids = [];
  var base = nextNo_(rows_(SH.cases).map(function (x) { return str_(x['رقم الحالة']); }));
  entries.sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (e) {
    var k = e.student + '|' + section + '|' + e.date;
    if (exists[k]) { skipped.push(e.student + ' (' + e.date + ')'); return; }   // مسجّلة متأخرة في اليوم نفسه — لا تتكرر
    exists[k] = 1;
    var id = 'ت-ص-' + Utilities.getUuid().slice(0, 6);
    tRows.push({ 'المعرف': id, 'وقت الإدخال': now_(), 'التاريخ': e.date, 'الشعبة': section, 'الطالبة': e.student, 'سجّلتها': me.name, 'ملاحظات': str_(req.notes) });
    ids.push(id);
    if (!caseDay[k]) {
      caseDay[k] = 1;
      cRows.push({ 'رقم الحالة': 'ح-' + pad_(base + cRows.length, 4), 'وقت الإنشاء': now_(), 'المصدر': 'خارج الصف', 'رقم التحويل': id,
        'التاريخ': e.date, 'الشعبة': section, 'الطالبة': e.student, 'المخالفة': TARDY_V, 'سجّلتها': me.name });
    }
  });
  appendMany_(SH.tardy, COLS.tardy, tRows);
  appendMany_(SH.cases, COLS.cases, cRows);
  flush_();
  var all = allData_().cases, made = [];
  cRows.forEach(function (o) {
    var c = all.filter(function (x) { return x.id === o['رقم الحالة']; })[0];
    if (!c) return;
    if (c.next && c.next !== 'supervisor') notifyStageOpen_(c);
    made.push({ id: c.id, student: c.student, date: c.date, rep: c.rep, need: c.next ? (c.text[c.next] || '') : '', next: c.next || '' });
  });
  return { added: tRows.length, skipped: skipped, ids: ids, cases: made, tardy: tardyFor_(me).slice(-300).reverse() };
};
function canFixTardy_(me, r) {
  return me.role === 'admin' || str_(r['سجّلتها']) === me.name || (me.role === 'supervisor' && sectionsFor_(me).indexOf(str_(r['الشعبة'])) >= 0);
}
API.deleteTardy = function (me, req) {
  var r = tardyRows_().filter(function (x) { return str_(x['المعرف']) === str_(req.id); })[0];
  if (!r) throw new Error('السجل غير موجود');
  if (!canFixTardy_(me, r)) throw new Error('الحذف لمشرفة الشعبة أو الإدارة');
  update_(SH.tardy, r, { 'محذوف': 'نعم' });
  caseRows_().filter(function (x) { return str_(x['رقم التحويل']) === str_(req.id); }).forEach(function (x) { update_(SH.cases, x, { 'محذوف': 'نعم' }); });
  flush_();
  return { deleted: true };
};
API.editTardy = function (me, req) {
  var r = tardyRows_().filter(function (x) { return str_(x['المعرف']) === str_(req.id); })[0];
  if (!r) throw new Error('السجل غير موجود');
  if (!canFixTardy_(me, r)) throw new Error('التعديل لمشرفة الشعبة أو الإدارة');
  var d = str_(req.date); checkDate_(d);
  var dup = tardyRows_().some(function (x) { return x !== r && str_(x['الطالبة']) === str_(r['الطالبة']) && str_(x['الشعبة']) === str_(r['الشعبة']) && iso_(x['التاريخ']) === d; });
  if (dup) throw new Error('الطالبة مسجّلة متأخرة في هذا اليوم مسبقًا');
  update_(SH.tardy, r, { 'التاريخ': d });
  caseRows_().filter(function (x) { return str_(x['رقم التحويل']) === str_(req.id); }).forEach(function (x) { update_(SH.cases, x, { 'التاريخ': d }); });
  flush_();
  return { tardy: tardyFor_(me).slice(-300).reverse() };
};

/* ---------- الرسائل ---------- */
API.messages = function (me) {
  var all = rows_(SH.messages);
  var inbox = all.filter(function (m) { return str_(m['إلى']) === me.name; });
  var sent = all.filter(function (m) { return str_(m['من']) === me.name; });
  var map = function (m) {
    return { id: str_(m['المعرف']), time: str_(m['الوقت']), from: str_(m['من']), to: str_(m['إلى']), subject: str_(m['الموضوع']),
      body: str_(m['النص']), caseId: str_(m['الحالة']), read: str_(m['مقروءة']) === 'نعم', kind: str_(m['النوع']) };
  };
  return { inbox: inbox.map(map).reverse().slice(0, 200), sent: sent.map(map).reverse().slice(0, 100) };
};
API.sendMessage = function (me, req) {
  var to = (req.to || []).map(str_).filter(String);
  if (!to.length) throw new Error('اختاري المرسَل إليها');
  var valid = users_().map(function (u) { return u.name; });
  to.forEach(function (n) { if (valid.indexOf(n) < 0) throw new Error('اسم غير موجود: ' + n); });
  var subject = str_(req.subject) || 'رسالة من ' + me.name, body = str_(req.body);
  if (!body) throw new Error('اكتبي نص الرسالة');
  to.forEach(function (n) {
    append_(SH.messages, COLS.messages, { 'المعرف': 'ر-' + Utilities.getUuid().slice(0, 8), 'الوقت': now_(), 'من': me.name, 'إلى': n,
      'الموضوع': subject, 'النص': body, 'الحالة': str_(req.caseId), 'مقروءة': '', 'النوع': 'رسالة' });
    email_(n, subject + ' — من ' + me.name, body + '\n\n' + me.name + ' — ' + ROLE_LABEL[me.role]);
  });
  return { sent: to.length };
};
API.markRead = function (me, req) {
  var ids = req.ids || [];
  rows_(SH.messages).filter(function (m) { return str_(m['إلى']) === me.name && (ids === 'all' || ids.indexOf(str_(m['المعرف'])) >= 0) && str_(m['مقروءة']) !== 'نعم'; })
    .forEach(function (m) { update_(SH.messages, m, { 'مقروءة': 'نعم' }); });
  return { unread: unread_(me) };
};

/* ============================================================
 *  لوحة التحكم والتقرير الشهري (الإدارة)
 * ============================================================ */
API.dashboard = function (me, req) {
  if (me.role !== 'admin' && me.role !== 'supervisor') throw new Error('لوحة التحكم للإدارة');
  var data = allData_();
  var secs = sectionsFor_(me);
  var inSec = function (s) { return secs.indexOf(s) >= 0; };
  var cases = data.cases.filter(function (c) { return inSec(c.section); });
  var teach = data.teacher.filter(function (r) { return inSec(r.section); });
  var tardy = tardyFor_(me);
  var studs = students_().filter(function (s) { return inSec(s.section); });
  var from = str_(req.from) || '0000', to = str_(req.to) || '9999';
  var inP = function (d) { return d >= from && d <= to; };
  var pc = cases.filter(function (c) { return inP(c.date); }), pt = teach.filter(function (r) { return inP(r.date); }), pd = tardy.filter(function (r) { return inP(r.date); });
  var uniq = function (arr, f) { var m = {}; arr.forEach(function (x) { m[f(x)] = 1; }); return Object.keys(m).length; };
  var countBy = function (arr, f) { var m = {}; arr.forEach(function (x) { var k = f(x); m[k] = (m[k] || 0) + 1; }); return m; };
  var top = function (m, n) { return Object.keys(m).map(function (k) { return { k: k, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, n || 5); };
  var grade = function (s) { return s.split('-')[0]; };
  var degOrder = ['الدرجة الأولى', 'الدرجة الثانية', 'الدرجة الثالثة', 'الدرجة الرابعة'];
  var byDeg = countBy(pc, function (c) { return c.degree; });
  var repeatOff = countBy(pc, function (c) { return c.student + '|' + c.section; });
  var tardyStud = countBy(pd, function (r) { return r.student + '|' + r.section; });
  var months = [];
  ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06'].forEach(function (m) {
    months.push({ m: m, cases: cases.filter(function (c) { return c.date.slice(0, 7) === m; }).length,
      classroom: teach.filter(function (r) { return r.date.slice(0, 7) === m; }).length,
      tardy: tardy.filter(function (r) { return r.date.slice(0, 7) === m; }).length });
  });
  // الالتزام بالأسماء
  var comp = {};
  var addC = function (who, role, code) {
    var k = who + '|' + role; comp[k] = comp[k] || { name: who, role: role, req: 0, onTime: 0, late: 0, notDone: 0, within: 0 };
    var o = comp[k]; if (code === 5 || !code) return; o.req++;
    if (code === 1) o.onTime++; else if (code === 2) o.late++; else if (code === 3) o.notDone++; else if (code === 4) o.within++;
  };
  pc.forEach(function (c) {
    CHAIN.forEach(function (st) {
      var s = c.stages[st]; if (!s.need) return;
      var owners = st === 'supervisor' ? [c.supervisors.join('، ')] : stageOwners_(c, st);
      if (st === 'admin') owners = ['الإدارة'];
      owners.forEach(function (o) { addC(o, ROLE_LABEL[st], s.compliance); });
    });
  });
  pt.forEach(function (r) { addC(r.teacher, 'معلمة', r.compliance); });
  return {
    period: { from: from, to: to },
    tiles: { students: studs.length, tardy: pd.length, tardyStudents: uniq(pd, function (r) { return r.student + '|' + r.section; }),
      tardyRepeat: Object.keys(tardyStud).filter(function (k) { return tardyStud[k] > 1; }).length,
      cases: pc.length, serious: (byDeg['الدرجة الثالثة'] || 0) + (byDeg['الدرجة الرابعة'] || 0),
      repeatOffenders: Object.keys(repeatOff).filter(function (k) { return repeatOff[k] > 1; }).length,
      pending: pc.filter(function (c) { return c.status.code !== 'done'; }).length,
      lateCases: pc.filter(function (c) { return c.status.code === 'late'; }).length,
      classroom: pt.length, transfers: pt.filter(function (r) { return r.transferNo; }).length },
    byDegree: degOrder.map(function (d) { return { k: d, n: byDeg[d] || 0 }; }),
    byGrade: ['10', '11', '12'].map(function (g) {
      return { k: g, cases: pc.filter(function (c) { return grade(c.section) === g; }).length,
        classroom: pt.filter(function (r) { return grade(r.section) === g; }).length,
        tardy: pd.filter(function (r) { return grade(r.section) === g; }).length,
        students: studs.filter(function (s) { return grade(s.section) === g; }).length };
    }),
    topSections: top(countBy(pc.concat(pt.map(function (r) { return { section: r.section }; })), function (x) { return x.section; }), 6),
    topViolations: top(countBy(pc, function (c) { return c.short; }), 6),
    topStudents: top(countBy(pc, function (c) { return c.student + ' — ' + c.section; }), 6),
    topTardy: top(countBy(pd, function (r) { return r.student + ' — ' + r.section; }), 6),
    months: months,
    compliance: Object.keys(comp).map(function (k) { return comp[k]; }).filter(function (o) { return o.req > 0; })
      .sort(function (a, b) { return a.role < b.role ? -1 : a.role > b.role ? 1 : a.name < b.name ? -1 : 1; }),
    critical: pc.filter(function (c) { return c.degree === 'الدرجة الرابعة' || c.req.admin; }).map(function (c) {
      return { id: c.id, student: c.student, section: c.section, short: c.short, degree: c.degree, rep: c.rep, status: c.status.text };
    }),
    late: pc.filter(function (c) { return c.status.code === 'late'; }).map(function (c) {
      return { id: c.id, student: c.student, section: c.section, short: c.short, status: c.status.text };
    })
  };
};

/* ============================================================
 *  الغياب — مطابق لنظام الغياب المعتمد (Excel) وسياسة الغياب
 *  المعلمة تسجّل ← المشرفة تقرر (بعذر / بدون عذر / قيد الاستلام) وتُخطر ولي الأمر
 *  ← رقم اليوم بدون عذر يحدد الإجراء ← المنسقة ← الاجتماعية ← النفسية ← فريق إدارة السلوك
 * ============================================================ */
var ABS_DECISIONS = ['بدون عذر', 'بعذر', 'عذر قيد الاستلام'];
var ABS_CONTACT = ['هاتفيًا', 'رسالة نصية', 'هاتفيًا ورسالة نصية', 'حضر ولي الأمر', 'لم يرد ولي الأمر'];

function absPolicy_() {
  if (_cache._absPol) return _cache._absPol;
  var P = { texts: {}, excuses: [], exams: [] };
  rows_(SH.absPolicy).forEach(function (r) {
    var k = str_(r['مفتاح']);
    if (k) P.texts[k] = { teacher: str_(r['نص المعلمة']), supervisor: str_(r['نص المشرفة']), coordinator: str_(r['نص المنسقة']),
      social: str_(r['نص الاجتماعية']), psych: str_(r['نص النفسية']), admin: str_(r['نص الفريق']), elig: str_(r['الأهلية']) };
  });
  rows_(SH.absExcuses).forEach(function (r) { if (str_(r['العذر'])) P.excuses.push({ name: str_(r['العذر']), only12: str_(r['خاص بالثاني عشر']) === 'نعم' }); });
  rows_(SH.absExams).forEach(function (r) {
    if (!str_(r['الاختبار'])) return;
    P.exams.push({ name: str_(r['الاختبار']), date: iso_(r['تاريخ البدء']), limit: Number(r['الحد (أيام بدون عذر)']) || 0,
      grades: str_(r['الصفوف']).split(/[،,\s]+/).map(str_).filter(String) });
  });
  P.exams.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  _cache._absPol = P;
  return P;
}
function nthSchoolDayAfter_(d, n) {
  var list = days_().filter(function (x) { return x > d; });
  return list.length >= n ? list[n - 1] : (list[list.length - 1] || d);
}
function absRows_() { return rows_(SH.abs).filter(function (r) { return str_(r['محذوف']) !== 'نعم'; }); }

/** يحسب لكل سجل: هل يُحتسب، القرار الفعلي، رقم اليوم بدون عذر، مفتاح السياسة، الجهات المطلوبة ومراحلها */
function absData_() {
  if (_cache._abs) return _cache._abs;
  var P = absPolicy_();
  var excuseDays = Number(setting_('مهلة العذر', 2)) || 2;
  var t = today_();
  var sorted = absRows_().slice().sort(function (a, b) { return orderKey_(a, 'التاريخ', 'وقت الإدخال') < orderKey_(b, 'التاريخ', 'وقت الإدخال') ? -1 : 1; });
  var seen = {}, uCount = {};
  var list = [];
  sorted.forEach(function (r) {
    var a = { id: str_(r['المعرف']), created: str_(r['وقت الإدخال']), createdDay: iso_(r['وقت الإدخال']), date: iso_(r['التاريخ']), section: str_(r['الشعبة']), student: str_(r['الطالبة']),
      period: str_(r['الحصة']), by: str_(r['سجّلتها']), lateArrival: str_(r['حضرت متأخرة']) === 'نعم', confirmedBy: str_(r['أكّدتها']),
      decision: str_(r['القرار']), excuse: str_(r['نوع العذر']), decNotes: str_(r['ملاحظات القرار']), decBy: str_(r['قررتها']), decTime: str_(r['وقت القرار']),
      doc: {}, _row: r._row };
    CHAIN.forEach(function (st) {
      var p = STAGE_PREFIX[st];
      a.doc[st] = { date: iso_(r[p + ': تاريخ التنفيذ']), action: str_(r[p + ': الإجراء المتخذ'] || ''), contact: str_(r[p + ': التواصل مع ولي الأمر'] || ''),
        notes: str_(r[p + ': ملاحظات']), who: str_(r[p + ': من وثّقت'] || '') };
    });
    a.grade = a.section.split('-')[0];
    var sk = a.student + '|' + a.section;
    var info = sectionInfo_(a.section);
    a.supervisors = info.supervisors; a.social = info.social;
    a.req = {}; a.stages = {}; a.text = {}; a.n = 0; a.key = ''; a.flag = '';
    if (a.lateArrival) { a.kind = 'late'; a.status = { code: 'none', text: '⏰ حضرت متأخرة — لا يُحتسب غيابًا' }; list.push(a); return; }
    var dk = sk + '|' + a.date;
    if (seen[dk]) { a.kind = 'dup'; a.status = { code: 'none', text: '↺ مسجّلة مسبقًا لهذا اليوم — لا تُكرر' }; list.push(a); return; }
    seen[dk] = 1;
    // القرار الفعلي حسب السياسة
    var exc = P.excuses.filter(function (e) { return e.name === a.excuse; })[0];
    if (!a.decision) a.kind = 'undecided';
    else if (a.decision === 'بدون عذر') a.kind = 'U';
    else if (a.decision === 'بعذر') {
      if (exc && exc.only12 && a.grade !== '12') { a.kind = 'U'; a.flag = '⚠ العذر خاص بطالبات الثاني عشر — احتُسب بدون عذر'; }
      else a.kind = 'E';
    } else if (a.decision === 'عذر قيد الاستلام') {
      a.excuseDue = nthSchoolDayAfter_(a.date, excuseDays);
      if (t > a.excuseDue) { a.kind = 'U'; a.flag = '⚠ انتهت مهلة العذر (' + arDate_(a.excuseDue) + ') — احتُسب بدون عذر'; }
      else a.kind = 'P';
    } else a.kind = 'undecided';
    if (a.kind === 'undecided') {
      a.decDue = deadline_(startDay_(a.date, a.createdDay));
      a.decLate = t > a.decDue;
      a.status = a.decLate ? { code: 'late', text: '⛔ متأخر: لم تحدد المشرفة القرار' } : { code: 'wait', text: '⏳ بانتظار قرار المشرفة' };
    } else if (a.kind === 'E') a.status = { code: 'none', text: '✔ غياب بعذر' + (a.excuse ? ' — ' + a.excuse : '') };
    else if (a.kind === 'P') a.status = { code: 'none', text: '⏳ عذر قيد الاستلام حتى ' + arDate_(a.excuseDue) };
    else {
      uCount[sk] = (uCount[sk] || 0) + 1;
      a.n = uCount[sk];
      a.key = (a.grade === '12' ? 'G12' : 'G1011') + '|' + (a.n > 16 ? '+' : a.n);
      var tx = P.texts[a.key] || {};
      a.text = tx;
      a.req = { supervisor: !!tx.supervisor, coordinator: !!tx.coordinator, social: !!tx.social, psych: !!tx.psych, admin: !!tx.admin,
        guardian: /ولي الأمر/.test(tx.supervisor || ''), pledge: /تعهد/.test(tx.supervisor || '') };
      a.elig = tx.elig || '';
      computeStages_(a);
    }
    list.push(a);
  });
  _cache._abs = list;
  return list;
}

function absPublic_(a) {
  var stu = student_(a.student, a.section) || {};
  return { id: a.id, date: a.date, section: a.section, student: a.student, period: a.period, by: a.by, kind: a.kind, flag: a.flag,
    decision: a.decision, excuse: a.excuse, decNotes: a.decNotes, decBy: a.decBy, excuseDue: a.excuseDue || '', decDue: a.decDue || '', decLate: !!a.decLate,
    n: a.n, key: a.key, req: a.req, text: a.text, elig: a.elig || '', doc: a.doc, stages: a.stages, status: a.status, next: a.next || '',
    guardian: stu.guardian || '', phone: stu.phone || '', qid: stu.qid || '', nat: stu.nat || '', lateArrival: a.lateArrival, confirmedBy: a.confirmedBy, supervisors: a.supervisors, social: a.social };
}

/** من يرى السجل */
function absFor_(me, list) {
  if (me.role === 'admin') return list;
  if (me.role === 'supervisor') return list.filter(function (a) { return a.supervisors.indexOf(me.name) >= 0; });
  if (me.role === 'coordinator') return list.filter(function (a) { return a.req.coordinator; });
  if (me.role === 'social') return list.filter(function (a) { return a.req.social && (a.social === me.name || !a.social); });
  if (me.role === 'psych') return list.filter(function (a) { return a.req.psych; });
  if (me.role === 'teacher') return list.filter(function (a) { return a.by === me.name; });
  return [];
}
function teacherSections_(me) {
  var m = {};
  rows_(SH.schedule).forEach(function (r) { if (teaches_(r, me.name)) m[str_(r['الشعبة'])] = 1; });
  return allSections_().filter(function (s) { return m[s]; });
}
function absSections_(me) { return me.role === 'teacher' ? teacherSections_(me) : sectionsFor_(me); }

/** مهام الغياب: قرارات المشرفة (مجمّعة بالشعبة واليوم) + توثيق كل جهة جاء دورها */
function absTasks_(me, list) {
  var out = [];
  if (me.role === 'teacher') return out;
  var mine = absFor_(me, list);
  if (me.role === 'supervisor' || me.role === 'admin') {
    var groups = {};
    mine.filter(function (a) { return a.kind === 'undecided' && (me.role === 'supervisor' || a.decLate); }).forEach(function (a) {
      var g = a.section + '|' + a.date; (groups[g] = groups[g] || []).push(a);
    });
    if (me.role === 'supervisor') Object.keys(groups).forEach(function (g) {
      var arr = groups[g], late = arr.some(function (a) { return a.decLate; });
      out.push({ type: 'absDecide', sec: 'abs', id: 'D:' + g, title: 'قرار غياب الشعبة ' + arr[0].section + ' — ' + arDate_(arr[0].date),
        sub: arr.length + (arr.length === 1 ? ' طالبة' : ' طالبات') + ' • حددي: بعذر أم بدون عذر' + (late ? ' • ⛔ متأخر' : ''), late: late });
    });
  }
  var st = me.role;
  mine.forEach(function (a) {
    var s = a.stages && a.stages[st];
    if (s && s.need && s.open && !s.documented) {
      out.push({ type: 'abs', sec: 'abs', id: a.id, title: a.student + ' — ' + a.section,
        sub: 'غياب بدون عذر • اليوم رقم ' + a.n + (s.late ? ' • ⛔ متأخر' : ' • آخر موعد ' + arDate_(s.due)), late: s.late });
    }
  });
  out.sort(function (x, y) { return (y.late ? 1 : 0) - (x.late ? 1 : 0); });
  return out;
}

/** إحصاء كل طالبة والأهلية للاختبارات (المادة 3.4.1.3) */
function absStudents_(list, secs) {
  var P = absPolicy_(), t = today_();
  var m = {};
  students_().forEach(function (s) { if (!secs || secs.indexOf(s.section) >= 0) m[s.name + '|' + s.section] = { student: s.name, section: s.section, total: 0, U: 0, E: 0, P: 0, last: '', uDates: [] }; });
  list.forEach(function (a) {
    var o = m[a.student + '|' + a.section];
    if (!o || a.kind === 'late' || a.kind === 'dup') return;
    o.total++; if (a.date > o.last) o.last = a.date;
    if (a.kind === 'U') { o.U++; o.uDates.push(a.date); } else if (a.kind === 'E') o.E++; else if (a.kind === 'P' || a.kind === 'undecided') o.P++;
  });
  return Object.keys(m).map(function (k) {
    var o = m[k], g = o.section.split('-')[0];
    var exams = P.exams.filter(function (e) { return e.grades.indexOf(g) >= 0; });
    o.denied = [];
    exams.forEach(function (e) {
      var before = o.uDates.filter(function (d) { return d < e.date; }).length;
      if (before > e.limit && (t >= e.date || o.U > e.limit)) o.denied.push(e.name);
    });
    var next = exams.filter(function (e) { return e.date > t; })[0];
    if (next) {
      var left = next.limit - o.U;
      o.next = { name: next.name, date: next.date, limit: next.limit, left: left,
        text: left < 0 ? '⛔ غير مؤهلة لـ' + next.name + ' (تجاوزت ' + next.limit + ' أيام)' : left <= 2 ? '⚠ متبقٍ ' + left + ' ' + (left === 1 ? 'يوم' : 'أيام') + ' قبل ' + next.name : '✔ مؤهلة — متبقٍ ' + left + ' أيام قبل ' + next.name };
    } else o.next = null;
    o.risk = !!(o.next && o.next.left <= 2 && o.next.left >= 0);
    delete o.uDates;
    return o;
  });
}

function absBoot_(me) {
  var P = absPolicy_();
  var list = absData_();
  var secs = absSections_(me);
  var mine = absFor_(me, list);
  if (me.role !== 'teacher' && me.role !== 'supervisor' && me.role !== 'admin') mine = mine.filter(function (a) { return a.kind === 'U'; });
  var res = { sections: secs, students: studentsFor_(secs), excuses: P.excuses.map(function (e) { return e.name; }), decisions: ABS_DECISIONS, contacts: ABS_CONTACT,
    exams: P.exams, excuseDays: Number(setting_('مهلة العذر', 2)) || 2,
    records: mine.slice(-1500).map(absPublic_).reverse(), tasks: absTasks_(me, list) };
  // ما سُجّل اليوم في شعب المعلمة (لتأكيد معلمة الحصة الثانية)
  var t = today_();
  res.todayInSections = list.filter(function (a) { return a.date === t && secs.indexOf(a.section) >= 0; }).map(function (a) {
    return { id: a.id, section: a.section, student: a.student, period: a.period, by: a.by, lateArrival: a.lateArrival };
  });
  return res;
}

/* ---------- الواجهات ---------- */
API.recordAbsence = function (me, req) {
  if (['teacher', 'supervisor', 'admin'].indexOf(me.role) < 0) throw new Error('تسجيل الغياب للمعلمات والمشرفات');
  var section = str_(req.section), period = str_(req.period) || 'الأولى';
  if (absSections_(me).indexOf(section) < 0) throw new Error('الشعبة ليست ضمن شعبكِ');
  // عدة تواريخ لطالبة (بأثر رجعي) أو عدة طالبات في يوم واحد
  var entries = (req.entries && req.entries.length) ? req.entries.map(function (e) { return { student: str_(e.student), date: str_(e.date) }; })
    : (req.students || []).map(function (n) { return { student: str_(n), date: str_(req.date) }; });
  entries = entries.filter(function (e) { return e.student && e.date; });
  if (!entries.length) throw new Error('اختاري الطالبات الغائبات');
  var dec = str_(req.decision);
  if (dec && (me.role === 'teacher' || ABS_DECISIONS.indexOf(dec) < 0)) dec = '';
  var existing = {};
  absData_().forEach(function (a) { if (a.section === section && a.kind !== 'late') existing[a.student + '|' + a.date] = 1; });
  var rowsAdd = [], skipped = [];
  var base = nextNo_(rows_(SH.abs).map(function (x) { return str_(x['المعرف']); }));
  entries.sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (e) {
    checkDate_(e.date);
    if (!student_(e.student, section)) throw new Error('الطالبة لا تتبع الشعبة المختارة: ' + e.student);
    var k = e.student + '|' + e.date;
    if (existing[k]) { skipped.push(e.student + ' (' + e.date + ')'); return; }
    existing[k] = 1;
    var o = { 'المعرف': 'غ-' + pad_(base + rowsAdd.length, 4), 'وقت الإدخال': now_(), 'التاريخ': e.date, 'الشعبة': section, 'الطالبة': e.student,
      'الحصة': period, 'سجّلتها': me.name };
    if (dec && dec !== 'بعذر') { o['القرار'] = dec; o['قررتها'] = me.name; o['وقت القرار'] = now_(); }
    rowsAdd.push(o);
  });
  appendMany_(SH.abs, COLS.abs, rowsAdd);
  flush_();
  if (rowsAdd.length && me.role === 'teacher') {
    var sups = sectionInfo_(section).supervisors.filter(function (x) { return x !== me.name; });
    var dates = {}; rowsAdd.forEach(function (o) { (dates[o['التاريخ']] = dates[o['التاريخ']] || []).push(o['الطالبة']); });
    Object.keys(dates).forEach(function (d) {
      var added = dates[d];
      var body = 'السلام عليكم ورحمة الله وبركاته،\nنحيطكِ علمًا بغياب ' + (added.length === 1 ? 'الطالبة الآتية' : 'الطالبات الآتيات') + ' من الشعبة ' + section +
        ' يوم ' + arDate_(d) + ' (رصد الحصة ' + period + '):\n' + added.map(function (n) { return '• ' + n; }).join('\n') +
        '\nيرجى تحديد القرار (بعذر / بدون عذر) وإخطار ولي الأمر وفق سياسة الغياب.\nوتفضلوا بقبول فائق الاحترام والتقدير،\n' + me.name;
      notify_(sups, 'غياب الشعبة ' + section + ' — ' + arDate_(d) + ' (' + added.length + ')', body, '', 'غياب', 'abs');
    });
  }
  return { added: rowsAdd.length, skipped: skipped, abs: absBoot_(me) };
};

/** معلمة الحصة الثانية: الطالبة حضرت متأخرة (لا يُحتسب) أو التراجع عن ذلك */
API.markLateArrival = function (me, req) {
  var a = absData_().filter(function (x) { return x.id === str_(req.id); })[0];
  if (!a) throw new Error('السجل غير موجود');
  if (absSections_(me).indexOf(a.section) < 0) throw new Error('الشعبة ليست ضمن شعبكِ');
  if (a.decision) throw new Error('حددت المشرفة القرار لهذا الغياب — للتعديل تواصلي معها');
  var row = absRows_().filter(function (x) { return str_(x['المعرف']) === a.id; })[0];
  update_(SH.abs, row, { 'حضرت متأخرة': req.late ? 'نعم' : '', 'أكّدتها': me.name });
  flush_();
  return { abs: absBoot_(me) };
};

/** قرار المشرفة لعدة طالبات دفعة واحدة */
API.decideAbsence = function (me, req) {
  if (me.role !== 'supervisor' && me.role !== 'admin') throw new Error('القرار للمشرفة الإدارية');
  var items = req.items || [];
  if (!items.length) throw new Error('لا توجد قرارات للحفظ');
  var P = absPolicy_();
  var all = absData_();
  items.forEach(function (it) {
    var a = all.filter(function (x) { return x.id === str_(it.id); })[0];
    if (!a) throw new Error('السجل غير موجود');
    if (absFor_(me, [a]).length === 0) throw new Error('الشعبة ليست ضمن شعبكِ');
    var d = str_(it.decision);
    if (ABS_DECISIONS.indexOf(d) < 0) throw new Error('اختاري القرار لكل طالبة');
    if (d === 'بعذر' && !P.excuses.some(function (e) { return e.name === str_(it.excuse); })) throw new Error('اختاري نوع العذر المقبول حسب المادة 3.4.1.4 — ' + a.student);
    var row = absRows_().filter(function (x) { return str_(x['المعرف']) === a.id; })[0];
    update_(SH.abs, row, { 'القرار': d, 'نوع العذر': d === 'بعذر' ? str_(it.excuse) : '', 'ملاحظات القرار': str_(it.notes), 'قررتها': me.name, 'وقت القرار': now_() });
  });
  flush_();
  return { abs: absBoot_(me) };
};

API.documentAbsence = function (me, req) {
  var st = me.role;
  if (CHAIN.indexOf(st) < 0) throw new Error('لا يوجد دور توثيق لهذه الصفة');
  var a = absData_().filter(function (x) { return x.id === str_(req.id); })[0];
  if (!a) throw new Error('السجل غير موجود');
  if (absFor_(me, [a]).length === 0) throw new Error('الحالة لا تخصكِ');
  var s = a.stages[st];
  if (!s || !s.need) throw new Error('لا يوجد إجراء مطلوب منكِ في هذه الحالة حسب السياسة');
  if (!s.open) throw new Error('لم يحن دوركِ بعد — بانتظار ' + STAGE_PREFIX[a.next]);
  var d = str_(req.date);
  if (!d) throw new Error('اختاري تاريخ التنفيذ');
  checkDate_(d); if (d < a.date) throw new Error('تاريخ التنفيذ قبل تاريخ الغياب');
  var p = STAGE_PREFIX[st], ch = {};
  ch[p + ': تاريخ التنفيذ'] = d;
  ch[p + ': ملاحظات'] = str_(req.notes);
  if (st === 'supervisor') {
    if (a.req.guardian && !str_(req.contact)) throw new Error('السياسة تطلب إخطار ولي الأمر — اختاري طريقة التواصل');
    ch['المشرفة: التواصل مع ولي الأمر'] = str_(req.contact); ch['المشرفة: من وثّقت'] = me.name;
  } else {
    if (!str_(req.taken)) throw new Error('اختاري الإجراء المتخذ');
    ch[p + ': الإجراء المتخذ'] = str_(req.taken);
  }
  var row = absRows_().filter(function (x) { return str_(x['المعرف']) === a.id; })[0];
  var before = a.next;
  update_(SH.abs, row, ch);
  flush_();
  var a2 = absData_().filter(function (x) { return x.id === a.id; })[0];
  if (a2.next && a2.next !== before) notifyAbsStage_(a2);
  return { record: absPublic_(a2), abs: absBoot_(me) };
};

function notifyAbsStage_(a) {
  var st = a.next; if (!st) return;
  var to = stageOwners_(a, st);
  var subj = 'غياب بدون عذر بانتظار إجرائكِ — ' + a.student + ' (' + a.section + ')';
  var body = 'السلام عليكم ورحمة الله وبركاته،\n' +
    'نشكر لكِ جهودكِ المخلصة وحرصكِ الدائم على متابعة طالباتنا، ونحيطكِ علمًا بوصول الحالة الآتية إليكِ وفق سياسة الغياب:\n' +
    '• الطالبة: ' + a.student + ' — الشعبة ' + a.section + '\n' +
    '• غياب بدون عذر يوم ' + arDate_(a.date) + ' — اليوم رقم ' + a.n + ' من أيام غيابها بدون عذر\n' +
    '• المطلوب منكِ حسب السياسة: ' + (a.text[st] || '') + '\n' +
    (a.elig ? '• ⛔ ' + a.elig + '\n' : '') +
    'يرجى تنفيذ الإجراء وتوثيقه في المنصة خلال المهلة المعتمدة.\nوتفضلوا بقبول فائق الاحترام والتقدير،';
  notify_(to, subj, body, a.id, 'غياب', st);
}

function canFixAbs_(me, a) {
  if (me.role === 'admin' || a.by === me.name) return true;
  return me.role === 'supervisor' && absFor_(me, [a]).length > 0;
}
API.deleteAbsence = function (me, req) {
  var a = absData_().filter(function (x) { return x.id === str_(req.id); })[0];
  if (!a) throw new Error('السجل غير موجود');
  if (!canFixAbs_(me, a)) throw new Error('الحذف لمن سجّلته أو مشرفة الشعبة أو الإدارة');
  var row = absRows_().filter(function (x) { return str_(x['المعرف']) === a.id; })[0];
  update_(SH.abs, row, { 'محذوف': 'نعم' });
  flush_();
  return { abs: absBoot_(me) };
};
API.editAbsence = function (me, req) {
  var a = absData_().filter(function (x) { return x.id === str_(req.id); })[0];
  if (!a) throw new Error('السجل غير موجود');
  if (!canFixAbs_(me, a)) throw new Error('التعديل لمن سجّلته أو مشرفة الشعبة أو الإدارة');
  var d = str_(req.date); checkDate_(d);
  var row = absRows_().filter(function (x) { return str_(x['المعرف']) === a.id; })[0];
  update_(SH.abs, row, { 'التاريخ': d });
  flush_();
  return { abs: absBoot_(me) };
};

/** متابعة الطالبات والأهلية */
API.absStudents = function (me) {
  if (me.role === 'teacher') throw new Error('هذه الصفحة للإدارة والمشرفات والأخصائيات');
  var secs = absSections_(me);
  var s = absStudents_(absData_(), secs).filter(function (o) { return o.total > 0 || o.denied.length; });
  s.sort(function (a, b) { return b.U - a.U || b.total - a.total; });
  return { students: s, exams: absPolicy_().exams };
};

/** لوحة الغياب */
API.absDashboard = function (me, req) {
  if (me.role !== 'admin' && me.role !== 'supervisor') throw new Error('لوحة التحكم للإدارة');
  var secs = sectionsFor_(me);
  var from = str_(req.from) || '0000', to = str_(req.to) || '9999';
  var all = absData_().filter(function (a) { return secs.indexOf(a.section) >= 0 && a.kind !== 'dup'; });
  var inP = function (d) { return d >= from && d <= to; };
  var L = all.filter(function (a) { return inP(a.date); });
  var counted = L.filter(function (a) { return a.kind !== 'late'; });
  var studs = students_().filter(function (s) { return secs.indexOf(s.section) >= 0; });
  var t = today_();
  var sd = days_().filter(function (d) { return d <= t && inP(d); }).length;
  var countBy = function (arr, f) { var m = {}; arr.forEach(function (x) { var k = f(x); m[k] = (m[k] || 0) + 1; }); return m; };
  var top = function (m, n) { return Object.keys(m).map(function (k) { return { k: k, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, n || 6); };
  var stu = absStudents_(absData_(), secs);
  var U = counted.filter(function (a) { return a.kind === 'U'; });
  var comp = {};
  var addC = function (who, role, code) {
    var k = who + '|' + role; comp[k] = comp[k] || { name: who, role: role, req: 0, onTime: 0, late: 0, notDone: 0, within: 0 };
    var o = comp[k]; if (code === 5 || !code) return; o.req++;
    if (code === 1) o.onTime++; else if (code === 2) o.late++; else if (code === 3) o.notDone++; else if (code === 4) o.within++;
  };
  U.forEach(function (a) {
    CHAIN.forEach(function (st) {
      var s = a.stages[st]; if (!s || !s.need) return;
      var owners = st === 'supervisor' ? [a.supervisors.join('، ')] : st === 'admin' ? ['الإدارة'] : stageOwners_(a, st);
      owners.forEach(function (o) { addC(o, ROLE_LABEL[st], s.compliance); });
    });
  });
  counted.filter(function (a) { return a.kind === 'undecided'; }).forEach(function (a) { addC(a.supervisors.join('، '), 'مشرفة إدارية (القرار)', a.decLate ? 3 : 4); });
  var months = ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06'].map(function (m) {
    var x = all.filter(function (a) { return a.kind !== 'late' && a.date.slice(0, 7) === m; });
    return { m: m, total: x.length, U: x.filter(function (a) { return a.kind === 'U'; }).length };
  });
  var grade = function (s) { return s.split('-')[0]; };
  return {
    period: { from: from, to: to },
    tiles: { students: studs.length, schoolDays: sd, total: counted.length, U: U.length, E: counted.filter(function (a) { return a.kind === 'E'; }).length,
      P: counted.filter(function (a) { return a.kind === 'P'; }).length, undecided: counted.filter(function (a) { return a.kind === 'undecided'; }).length,
      lateArrivals: L.filter(function (a) { return a.kind === 'late'; }).length,
      absentStudents: Object.keys(countBy(counted, function (a) { return a.student + '|' + a.section; })).length,
      rate: studs.length && sd ? Math.round(1000 * counted.length / (studs.length * sd)) / 10 : 0,
      denied: stu.filter(function (o) { return o.denied.length; }).length, risk: stu.filter(function (o) { return o.risk; }).length,
      pending: U.filter(function (a) { return a.status.code !== 'done'; }).length, lateActions: U.filter(function (a) { return a.status.code === 'late'; }).length },
    months: months,
    byGrade: ['10', '11', '12'].map(function (g) {
      var x = counted.filter(function (a) { return grade(a.section) === g; });
      var n = studs.filter(function (s) { return grade(s.section) === g; }).length;
      return { k: g, students: n, total: x.length, U: x.filter(function (a) { return a.kind === 'U'; }).length, rate: n && sd ? Math.round(1000 * x.length / (n * sd)) / 10 : 0 };
    }),
    topSections: top(countBy(counted, function (a) { return a.section; })),
    topStudents: top(countBy(U, function (a) { return a.student + ' — ' + a.section; })),
    compliance: Object.keys(comp).map(function (k) { return comp[k]; }).filter(function (o) { return o.req > 0; }),
    denied: stu.filter(function (o) { return o.denied.length; }).map(function (o) { return { student: o.student, section: o.section, U: o.U, denied: o.denied }; }),
    late: U.filter(function (a) { return a.status.code === 'late'; }).map(function (a) { return { id: a.id, student: a.student, section: a.section, n: a.n, status: a.status.text }; })
  };
};

/* ============================================================
 *  التهيئة (تُشغَّل مرة واحدة من محرر Apps Script)
 * ============================================================ */
function setup() {
  var ss = ss_();
  var need = { teacher: SH.teacher, cases: SH.cases, tardy: SH.tardy, messages: SH.messages, mailLog: SH.mailLog, abs: SH.abs };
  Object.keys(need).forEach(function (k) {
    var name = need[k], sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    var cols = COLS[k];
    var head = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
    if (String(head[0] || '') !== cols[0]) { sh.clear(); sh.getRange(1, 1, 1, cols.length).setValues([cols]); }
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  });
  secret_();
  var st = ss.getSheetByName(SH.settings);
  var keys = st.getRange(2, 1, Math.max(1, st.getLastRow() - 1), 1).getValues().map(function (r) { return String(r[0]); });
  if (keys.indexOf('رابط المنصة') < 0) st.appendRow(['رابط المنصة', 'https://althasair.github.io/namoos/', 'يظهر في الإيميلات']);
  if (keys.indexOf('مدة الجلسة بالأيام') < 0) st.appendRow(['مدة الجلسة بالأيام', 30, 'تبقى الموظفة مسجّلة الدخول على جهازها هذه المدة']);
  if (keys.indexOf('مهلة العذر') < 0) st.appendRow(['مهلة العذر', 2, 'أيام دراسية لاستلام العذر، بعدها يُحتسب الغياب بدون عذر (المادة 3.4.1.5)']);
  return 'تمت التهيئة';
}

/** اختبار سريع للإيميل: يرسل رسالة تجريبية لصاحبة الحساب */
function testEmail() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'تجربة منصة نوماس', 'وصلت رسالة التجربة بنجاح.');
}

/* ============================================================
 *  استيراد تقرير الغياب اليومي الرسمي (ورقة «استيراد الغياب»)
 *  كل صف: الرقم الشخصي | الاسم | الشعبة | بدون عذر | بعذر | الحالة
 *  التواريخ بصيغة MMDD مفصولة بمسافة. الأيام السابقة لليوم تُحتسب في التكرار فقط
 *  (تُوثّق «سجل سابق»)، وغياب اليوم يدخل دورة الإجراءات كالمعتاد.
 *  يعمل تلقائيًا مع أول طلب بعد النشر، ويمكن تشغيله يدويًا: importAbsenceReport
 * ============================================================ */
var ABS_IMPORT_SHEET = 'استيراد الغياب';
function autoImportAbs_() {
  try { autoImportAbsRun_(); } catch (e) {}
}
function autoImportAbsRun_() {
  var sh = ss_().getSheetByName(ABS_IMPORT_SHEET);
  if (!sh || sh.getLastRow() < 2) return;
  var st = sh.getRange(2, 6, sh.getLastRow() - 1, 1).getValues();
  if (!st.some(function (r) { return !str_(r[0]); })) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try { importAbsenceReport(); } catch (e) { try { sh.getRange(1, 8).setValue('تعذر الاستيراد: ' + (e && e.message || e)); } catch (e2) {} }
  finally { lock.releaseLock(); flush_(); }
}
function importAbsenceReport() {
  var sh = ss_().getSheetByName(ABS_IMPORT_SHEET);
  if (!sh || sh.getLastRow() < 2) return 'لا توجد بيانات';
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  var t = today_(), stamp = now_(), SRC = 'تقرير الغياب الرسمي';
  var ymd = function (x) { x = ('0000' + str_(x)).slice(-4); var m = Number(x.slice(0, 2)); return (m >= 8 ? '2026' : '2027') + '-' + x.slice(0, 2) + '-' + x.slice(2); };
  // الطالبات حسب الرقم الشخصي (وإضافة من لم تُسجّل بعد)
  var studs = students_(), byQ = {};
  studs.forEach(function (s) { if (s.qid) byQ[s.qid] = s; });
  var addStu = [];
  data.forEach(function (r) {
    var q = str_(r[0]).replace(/^'/, '');
    if (!str_(r[5]) && q && !byQ[q] && str_(r[1]) && str_(r[2])) { byQ[q] = { name: str_(r[1]), section: str_(r[2]), qid: q }; addStu.push(byQ[q]); }
  });
  if (addStu.length) {
    var ssh = sheet_(SH.students), head = ssh.getRange(1, 1, 1, ssh.getLastColumn()).getValues()[0].map(str_);
    appendMany_(SH.students, head, addStu.map(function (s) { return { 'الاسم': s.name, 'الشعبة': s.section, 'الرقم الشخصي': "'" + s.qid }; }));
  }
  // السجلات الموجودة: لا تكرار، وتُستكمل القرارات الفارغة فقط (لا يُغيَّر قرار وضعته الموظفة)
  var existing = {};
  rows_(SH.abs).forEach(function (r) { var k = str_(r['الطالبة']) + '|' + str_(r['الشعبة']) + '|' + iso_(r['التاريخ']); (existing[k] = existing[k] || []).push(r); });
  var base = nextNo_(rows_(SH.abs).map(function (x) { return str_(x['المعرف']); }));
  var add = [], filled = 0, conflicts = [];
  data.forEach(function (r, i) {
    if (str_(r[5])) return;
    var s = byQ[str_(r[0]).replace(/^'/, '')];
    if (!s) { data[i][5] = 'لم تُعرف الطالبة'; return; }
    var sups = sectionInfo_(s.section).supervisors.join('، ') || SRC;
    var items = [];
    str_(r[3]).split(/\s+/).filter(String).forEach(function (d) { items.push({ date: ymd(d), dec: 'بدون عذر' }); });
    str_(r[4]).split(/\s+/).filter(String).forEach(function (d) { items.push({ date: ymd(d), dec: 'بعذر' }); });
    items.forEach(function (it) {
      var ex = existing[s.name + '|' + s.section + '|' + it.date];
      if (ex) {
        ex.forEach(function (row) {
          if (str_(row['محذوف']) === 'نعم' || str_(row['حضرت متأخرة']) === 'نعم') return;
          if (!str_(row['القرار'])) { update_(SH.abs, row, { 'القرار': it.dec, 'ملاحظات القرار': 'من ' + SRC, 'قررتها': SRC, 'وقت القرار': stamp }); filled++; }
          else if (str_(row['القرار']) !== it.dec) conflicts.push(s.name + ' ' + it.date);
        });
        return;
      }
      var past = it.date < t;
      var o = { 'المعرف': 'غ-' + pad_(base + add.length, 4), 'وقت الإدخال': past ? it.date + 'T07:30:00' : stamp, 'التاريخ': it.date,
        'الشعبة': s.section, 'الطالبة': s.name, 'الحصة': 'الأولى', 'سجّلتها': sups,
        'القرار': it.dec, 'ملاحظات القرار': 'من ' + SRC, 'قررتها': SRC, 'وقت القرار': past ? it.date + 'T08:00:00' : stamp };
      if (past && it.dec === 'بدون عذر') {
        o['المشرفة: التواصل مع ولي الأمر'] = 'سجل سابق'; o['المشرفة: من وثّقت'] = 'سجل سابق';
        CHAIN.forEach(function (stg) { o[STAGE_PREFIX[stg] + ': تاريخ التنفيذ'] = it.date; o[STAGE_PREFIX[stg] + ': ملاحظات'] = 'سجل سابق — من ' + SRC; });
        ['المنسقة', 'الاجتماعية', 'النفسية', 'الإدارة'].forEach(function (p) { o[p + ': الإجراء المتخذ'] = 'سجل سابق'; });
      }
      add.push(o);
      existing[s.name + '|' + s.section + '|' + it.date] = [o];
    });
    data[i][5] = 'تم ' + stamp.slice(0, 10);
  });
  add.sort(function (a, b) { return a['التاريخ'] < b['التاريخ'] ? -1 : 1; });
  add.forEach(function (o, k) { o['المعرف'] = 'غ-' + pad_(base + k, 4); });
  appendMany_(SH.abs, COLS.abs, add);
  sh.getRange(2, 6, data.length, 1).setValues(data.map(function (r) { return [r[5]]; }));
  var msg = 'أُضيف ' + add.length + ' سجل غياب، واستُكمل قرار ' + filled + ' سجل، وأُضيفت ' + addStu.length + ' طالبة. اختلاف مع قرار سابق: ' + conflicts.length;
  sh.getRange(1, 8).setValue(msg);
  if (conflicts.length) sh.getRange(2, 8, conflicts.length, 1).setValues(conflicts.map(function (c) { return [c]; }));
  flush_();
  return msg;
}
