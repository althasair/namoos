/* =========================================================================
 *  نوماس — الاستمارات الرسمية (استمارات العمل الاجتماعي 2026)
 *  نص الاستمارات كما هو دون تعديل؛ التنسيق فقط. تتعبأ من بيانات الحالة،
 *  ثم معاينة ← طباعة (ورقة واحدة) أو إرسال بالبريد مع نسخة للنائبة الإدارية ومديرة المدرسة.
 * ========================================================================= */
(function () {
  var N = null; // يربطه app.js: { S, api, toast, esc, ar, arFull }
  var GR = { '10': 'العاشر', '11': 'الحادي عشر', '12': 'الثاني عشر' };
  var ORD = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
  var WD = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var DEG = { '1': 'الأولى', '2': 'الثانية', '3': 'الثالثة', '4': 'الرابعة' };
  var CUR = null;
  // الرقم الشخصي القطري: الخانة 1 القرن، 2-3 سنة الميلاد، 4-6 رمز الجنسية (الترقيم الدولي ISO)
  var NAT = { '634': 'قطرية', '818': 'مصرية', '400': 'أردنية', '736': 'سودانية', '729': 'سودانية', '760': 'سورية', '788': 'تونسية', '886': 'يمنية', '887': 'يمنية',
    '586': 'باكستانية', '368': 'عراقية', '364': 'إيرانية', '012': 'جزائرية', '356': 'هندية', '504': 'مغربية', '512': 'عُمانية', '840': 'أمريكية',
    '478': 'موريتانية', '706': 'صومالية', '682': 'سعودية', '422': 'لبنانية', '434': 'ليبية', '048': 'بحرينية', '784': 'إماراتية', '414': 'كويتية',
    '826': 'بريطانية', '792': 'تركية', '004': 'أفغانية', '036': 'أسترالية', '050': 'بنغلاديشية', '230': 'إثيوبية', '231': 'إثيوبية', '275': 'فلسطينية',
    '608': 'فلبينية', '360': 'إندونيسية', '144': 'سريلانكية', '524': 'نيبالية', '124': 'كندية', '250': 'فرنسية', '276': 'ألمانية', '232': 'إريترية' };
  function natOf(q) { q = String(q || '').replace(/\D/g, ''); return q.length === 11 ? (NAT[q.substr(3, 3)] || '') : ''; }
  function yearOf(q) { q = String(q || '').replace(/\D/g, ''); if (q.length !== 11) return ''; var c = q[0] === '2' ? 1900 : q[0] === '3' ? 2000 : 0; return c ? String(c + Number(q.substr(1, 2))) : ''; }

  function e(s) { return N.esc(s); }
  function dmy(d) { if (!d) return ''; var p = d.split('-'); return Number(p[2]) + ' / ' + Number(p[1]) + ' / ' + p[0]; }
  function dm(d) { if (!d) return ''; var p = d.split('-'); return Number(p[2]) + '/' + Number(p[1]); }
  function wd(d) { return WD[new Date(d + 'T12:00:00').getDay()]; }
  function today() { return N.S.boot.today; }
  function grade(sec) { return GR[String(sec).split('-')[0]] || ''; }
  function ord(n) { return ORD[n] || String(n || ''); }
  function deg(x) { x = String(x || ''); return DEG[x] || x; }
  function acts(txt) { return String(txt || '').split(/\s*•\s*|\n+/).map(function (s) { return s.trim(); }).filter(String); }
  function F() { return N.S.boot.forms || {}; }
  function me() { return N.S.me; }

  /* ---------- قطع مشتركة ---------- */
  function ed(v, ph) { // خانة قابلة للكتابة في المعاينة
    return '<span class="nf-ed" contenteditable="true" spellcheck="false" data-ph="' + e(ph || '') + '">' + e(v || '') + '</span>';
  }
  function bx(label, on) { return '<span class="nf-cb' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + !!on + '" tabindex="0">' + (on ? '☑' : '☐') + '</span> ' + label; }
  function qidBoxes(q) {
    q = String(q || '').replace(/\D/g, '');
    var h = '';
    for (var i = 0; i < 11; i++) h += '<td class="nf-q">' + (q[i] ? '<span class="v">' + q[i] + '</span>' : '&nbsp;') + '</td>';
    return '<table class="nf-qt" dir="ltr"><tr>' + h + '</tr></table>';
  }
  function head(no, title, sub) {
    return '<div class="nf-top"><span class="nf-tag">نموذج ' + no + '</span>' + (sub ? '<span class="nf-sub">' + sub + '</span>' : '') + '</div>' +
      '<div class="nf-title">' + title + '</div>';
  }
  function foot() { return '<div class="nf-foot">استمارات العمل الاجتماعي 2026</div>'; }
  function numbered(list) {
    if (!list.length) return '1- ' + ed('', '') + '<br>2- ' + ed('', '') + '<br>3- ' + ed('', '');
    return list.slice(0, 6).map(function (x, i) { return (i + 1) + '- <span class="v">' + e(x) + '</span>'; }).join('<br>');
  }

  /* ---------- نموذج 10: تحويل حالة سلوكية ---------- */
  function f10(c) {
    var sup = realWho(c.doc && c.doc.supervisor && c.doc.supervisor.who) || (me().role === 'supervisor' ? me().name : (c.supervisors || [])[0] || '');
    var coord = realWho(c.doc && c.doc.coordinator && c.doc.coordinator.who) || (F().coordinators || [])[0] || '';
    var t = today();
    return head(10, 'استمارة تحويل حالة سلوكية من المشرف الإداري الى الاختصاصي الاجتماعي', 'الاختصاصي الاجتماعي') +
      '<table class="nf"><tr><td class="l">اليوم</td><td class="v">' + wd(t) + '</td><td class="l">التاريخ</td><td class="v">' + dmy(t) + '</td></tr></table>' +
      '<table class="nf">' +
      '<tr><th colspan="4">بيانـــات الطالـــب</th></tr>' +
      '<tr><td class="l">اسم الطالب</td><td class="v" colspan="3">' + e(c.student) + '</td></tr>' +
      '<tr><td class="l">الصف</td><td class="v">' + grade(c.section) + '</td><td class="l">الشعبة</td><td class="v">' + e(c.section) + '</td></tr>' +
      '<tr><td class="l">الرقم الشخصي</td><td colspan="3" class="p0">' + qidBoxes(c.qid) + '</td></tr>' +
      '<tr><td class="l">تاريخ الميلاد</td><td>' + ed(yearOf(c.qid) ? '     /     / ' + yearOf(c.qid) : '', '') + '</td><td class="l">الجنسية</td><td>' + ed(c.nat || natOf(c.qid), '') + '</td></tr>' +
      '<tr><td class="l">الحالة الدراسية</td><td>' + bx('مترفع') + ' &nbsp;&nbsp; ' + bx('باق') + '</td><td class="l">رقم ولي الأمر</td><td class="v" dir="ltr">' + e(c.phone || '') + '</td></tr>' +
      '</table>' +
      '<table class="nf">' +
      '<tr><th colspan="6">بيانات المخالفة</th></tr>' +
      '<tr><td class="l">نوع المخالفة</td><td class="v" colspan="5">' + e(c.violation) + '</td></tr>' +
      '<tr><td class="l">درجة المخالفة</td><td class="v">' + e(deg(c.degree)) + '</td><td class="l">المــادة</td><td class="v">' + (c.subject ? e(String(c.subject).replace(/\s*\([^)]*\)\s*/g, '')) : '—') + '</td><td class="l">المخالفة للمرة</td><td class="v">' + ord(c.rep) + '</td></tr>' +
      '</table>' +
      '<table class="nf two">' +
      '<tr><th colspan="2">إجراءات المعلم</th><th colspan="2">إجراءات المشرف الإداري</th></tr>' +
      '<tr><td colspan="2" class="acts">' + (c.source === 'خارج الصف' ? '—' : numbered(acts(c.text && c.text.teacher))) + '</td><td colspan="2" class="acts">' + numbered(acts(c.text && c.text.supervisor)) + '</td></tr>' +
      '<tr><td class="l">المعلم</td><td class="v">' + (c.teacher ? e(c.teacher) : '—') + '</td><td class="l">المشرف الإداري</td><td class="v">' + e(sup) + '</td></tr>' +
      '<tr><td class="l">منسق شؤون الطلاب</td><td class="v" colspan="3">' + e(coord) + '</td></tr>' +
      '</table>' +
      sigs([['الاختصاصي الاجتماعي', c.social || '']]) + foot();
  }

  /* ---------- نموذج 9: تحويل حالة غياب ---------- */
  function f9(a) {
    var recs = ((N.S.boot.abs && N.S.boot.abs.records) || []).filter(function (x) { return x.student === a.student && x.section === a.section && x.kind === 'U' && x.date <= a.date; })
      .sort(function (x, y) { return x.date < y.date ? -1 : 1; });
    if (!recs.some(function (x) { return x.id === a.id; })) recs.push(a);
    var dates = recs.map(function (x) { return x.date; });
    var days = N.S.boot.dates || [];
    var cont = dates.length > 1 && dates.every(function (d, i) { return i === 0 || days.indexOf(d) === days.indexOf(dates[i - 1]) + 1; });
    var seenA = {}, supActs = [];
    recs.forEach(function (x) {
      var dd = (x.doc && x.doc.supervisor && x.doc.supervisor.date) || x.date;
      acts(x.text && x.text.supervisor).forEach(function (t) { if (!seenA[t]) { seenA[t] = 1; supActs.push(t + ' — ' + dm(dd)); } });
    });
    var sup = realWho(a.doc && a.doc.supervisor && a.doc.supervisor.who) || (me().role === 'supervisor' ? me().name : (a.supervisors || [])[0] || '');
    var coord = realWho(a.doc && a.doc.coordinator && a.doc.coordinator.who) || (F().coordinators || [])[0] || '';
    var t = today();
    return head(9, 'تحويل حالة غياب من المشرف الإداري الى الاختصاصي الاجتماعي', 'الاختصاصي الاجتماعي') +
      '<table class="nf"><tr><td class="l">اليوم</td><td class="v">' + wd(t) + '</td><td class="l">التاريخ</td><td class="v">' + dmy(t) + '</td></tr></table>' +
      '<table class="nf">' +
      '<tr><th colspan="4">بيانـــات الطالـــب</th></tr>' +
      '<tr><td class="l">اسم الطالب</td><td class="v" colspan="3">' + e(a.student) + '</td></tr>' +
      '<tr><td class="l">الصف</td><td class="v">' + grade(a.section) + '</td><td class="l">الشعبة</td><td class="v">' + e(a.section) + '</td></tr>' +
      '<tr><td class="l">الرقم الشخصي</td><td colspan="3" class="p0">' + qidBoxes(a.qid) + '</td></tr>' +
      '<tr><td class="l">ولي الأمر</td><td class="v">' + e(a.guardian || '') + '</td><td class="l">رقم الهاتف</td><td class="v" dir="ltr">' + e(a.phone || '') + '</td></tr>' +
      '</table>' +
      '<table class="nf">' +
      '<tr><th colspan="4">بيانـــات الغياب</th></tr>' +
      '<tr><td class="l">عدد أيام الغياب</td><td class="v">' + recs.length + (recs.length === 1 ? ' يوم' : recs.length === 2 ? ' يومان' : recs.length <= 10 ? ' أيام' : ' يومًا') + ' بدون عذر</td><td class="l">نوع التعليم</td><td>' + bx('مدمج', true) + ' &nbsp;/&nbsp; ' + bx('عن بعد') + '</td></tr>' +
      '<tr><td class="l">تاريخ أيام الغياب</td><td class="v">' + dates.map(dm).join(' • ') + '</td><td class="l">نوع الغياب</td><td>' + bx('متقطع', !cont) + ' &nbsp;/&nbsp; ' + bx('مستمر', cont) + '</td></tr>' +
      '<tr><td class="l">سبب الغياب</td><td colspan="3">' + ed(a.excuse ? 'بعذر: ' + a.excuse : 'بدون عذر', '') + '</td></tr>' +
      '</table>' +
      '<table class="nf">' +
      '<tr><th colspan="2">الإجراءات</th></tr>' +
      '<tr><td class="l">إجراء<br>المشرف الإداري</td><td class="acts">' + numbered(supActs) + '</td></tr>' +
      '<tr><td class="l">المشرف الإداري</td><td class="v">' + e(sup) + '</td></tr>' +
      '<tr><td class="l">منسق شؤون الطلاب</td><td class="v">' + e(coord) + '</td></tr>' +
      '</table>' +
      sigs([['الاختصاصي الاجتماعي', a.social || '']]) + foot();
  }

  /* ---------- نموذج 5: جلسة فردية / إرشاد فردي ---------- */
  function f5(x, isAbs) {
    var tardy = !isAbs && /^(التأخير الصباحي|التأخر عن الطابور)/.test(x.violation || '');
    var beh = !isAbs && !tardy;
    var soc = me().role === 'social' ? me().name : (x.social || '');
    var t = today();
    var row = function (l, v) { return '<tr><td class="l">' + l + '</td><td colspan="3">' + v + '</td></tr>'; };
    var g = function (items) { return '<div class="nf-g">' + items.map(function (i) { return '<span>' + i + '</span>'; }).join('') + '</div>'; };
    return head(5, 'جلسة فردية / إرشاد فردي') +
      '<table class="nf">' +
      '<tr><td class="l">التاريخ</td><td class="v">' + dmy(t) + ' م</td><td class="l">اليوم</td><td class="v">' + wd(t) + '</td></tr>' +
      '<tr><td class="l">اسم الطالب</td><td class="v">' + e(x.student) + '</td><td class="l">الصف والشعبة</td><td class="v">' + e(x.section) + '</td></tr>' +
      row('رقم الجلسة الفردية/الإرشاد الفردي', ed('', '')) +
      row('نوع الإرشاد', g([bx('سلوكية', beh), bx('غياب', !!isAbs), bx('تأخر صباحي', tardy), bx('تأخر دراسي'), bx('أخرى تذكر')])) +
      row('الهدف', g([bx('تعديل السلوك غير المرغوب', beh), bx('تحسين التحصيل الدراسي'), bx('تعزيز الانضباط والالتزام بالأنظمة المدرسية'), bx('الحد من الغياب / التأخير الصباحي', !!isAbs || tardy), bx('أخرى: ' + ed('', ''))])) +
      row('ما تم مناقشته', g([bx('أسباب المشكلة الحالية و اثارها السلبية'), bx('العلاقة مع الزملاء و الاخرين'), bx('مستوى التحصيل الدراسي و المهام الدراسية'), bx('الغياب والتأخر الصباحي'), bx('الأنظمة والتعليمات المدرسية'), bx('أساليب حل المشكلات.'), bx('خطة التحسين والمتابعة'), bx('أخرى: ' + ed('', ''))])) +
      row('الاستراتيجيات / المبادئ / القيم',
        '<div class="nf-sl">الاستراتيجيات المستخدمة:</div>' + g([bx('الحوار والمناقشة'), bx('الاستماع الفعال'), bx('الإرشاد الفردي'), bx('التعزيز الإيجابي'), bx('تعديل السلوك'), bx('حل المشكلات'), bx('الإقناع والتوجيه'), bx('النمذجة'), bx('التعاقد السلوكي'), bx('المتابعة والتقويم'), bx('أخرى: ' + ed('', ''))]) +
        '<div class="nf-sl">المبادئ المستخدمة:</div>' + g([bx('السرية المهنية'), bx('مراعاة الفروق الفردية'), bx('الاحترام المتبادل'), bx('المشاركة في اتخاذ القرار'), bx('تقبل الطالب'), bx('بناء العلاقة المهنية'), bx('أخرى: ' + ed('', ''))]) +
        '<div class="nf-sl">القيم المستخدمة في الجلسة:</div>' + g([bx('المسؤولية'), bx('الاحترام'), bx('الانضباط'), bx('التعاون'), bx('التسامح'), bx('تقدير الذات'), bx('أخرى: ' + ed('', ''))])) +
      row('النتيجة', g([bx('لا يوجد'), bx('قليل'), bx('تجاوب ملحوظ')])) +
      row('التوصيات', g([bx('إشراك الطالب بنشاط  اجتماعي'), bx('تعزيز سلوك الطالب'), bx('متابعة إرشاد الطالب'), bx('التواصل مع ولي الأمر'), bx('تطبيق سياسة إدارة سلوك الطلبة 2026'), bx('إجراءات أخرى ' + ed('', ''))])) +
      '<tr><td class="l">الاختصاصي الاجتماعي</td><td class="v" colspan="3">' + e(soc) + '</td></tr>' +
      '<tr><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v" colspan="3">' + e(F().adminVP || '') + '</td></tr>' +
      '</table>' + foot();
  }

  function sigs(list) {
    return '<table class="nf-sig"><tr>' + list.map(function (p) { return '<td><b>' + p[0] + '</b><div class="nm">' + (p[1] ? e(p[1]) : '&nbsp;') + '</div><div class="ln">&nbsp;</div></td>'; }).join('') + '</tr></table>';
  }

  /* =========================================================
   *  استمارات دليل فريق إدارة سلوك الطلبة 2026 (نماذج 1–8)
   *  نصوص النماذج كما وردت في الدليل دون تعديل — التنسيق فقط
   * ========================================================= */
  function gHead(no, title) {
    return '<span class="nf-gd" hidden></span><div class="nf-top"><span class="nf-tag">نموذج رقم (' + no + ')</span><span class="nf-sub">إدارة شؤون المدارس والطلبة — قسم حماية ورعاية الطلبة</span></div><div class="nf-title">' + title + '</div>';
  }
  function gFoot() { return '<div class="nf-foot">دليل فريق إدارة سلوك الطلبة 2026</div>'; }
  function dayRow(d) { return '<table class="nf"><tr><td class="l">اليوم</td><td class="v">' + wd(d) + '</td><td class="l">التاريخ</td><td class="v">' + dmy(d) + '</td></tr></table>'; }
  function stuRows(o, withG) {
    return '<tr><th colspan="4">بيانـــات الطالـــب</th></tr>' +
      '<tr><td class="l">اسم الطالب</td><td class="v" colspan="3">' + e(o.student) + '</td></tr>' +
      '<tr><td class="l">الصف</td><td class="v">' + grade(o.section) + '</td><td class="l">الشعبة</td><td class="v">' + e(o.section) + '</td></tr>' +
      '<tr><td class="l">الرقم الشخصي</td><td colspan="3" class="p0">' + qidBoxes(o.qid) + '</td></tr>' +
      (withG ? '<tr><td class="l">ولي الأمر</td><td class="v">' + e(String(o.gName || '').replace(/\s*\([^)]*\)\s*$/, '')) + '</td><td class="l">رقم الهاتف</td><td class="v" dir="ltr">' + e(o.phone || '') + '</td></tr>' : '');
  }
  function isAbs(o) { return o && o.n !== undefined && o.violation === undefined; }
  function vName(o) { return isAbs(o) ? 'الغياب بدون عذر' : o.violation; }
  // مخالفات الطالبة حتى تاريخ هذه الحالة (الأحدث أولًا)
  // مخالفات البند نفسه فقط (كل بند في السياسة ورقة منفصلة)، من الأقدم إلى الأحدث
  function sameList(o, max) {
    var v = vName(o);
    var L = priorList(o, 999).filter(function (x) { return x.v === v; });
    L = L.slice(0, max); L.reverse(); return L;
  }
  function priorList(o, max) {
    var b = N.S.boot, out = [];
    (b.cases || []).forEach(function (c) { if (c.student === o.student && c.section === o.section && c.date <= o.date) out.push({ date: c.date, v: c.violation, deg: deg(c.degree), rep: c.rep, act: actDone(c) }); });
    ((b.abs && b.abs.records) || []).forEach(function (a) { if (a.kind === 'U' && a.student === o.student && a.section === o.section && a.date <= o.date) out.push({ date: a.date, v: 'الغياب بدون عذر', deg: '—', rep: a.n, act: actDone(a) }); });
    out.sort(function (x, y) { return x.date < y.date ? 1 : -1; });
    var cur = out.filter(function (x) { return x.date === o.date && (x.v === vName(o)); })[0];
    if (!cur) out.unshift({ date: o.date, v: vName(o), deg: isAbs(o) ? '—' : deg(o.degree), rep: isAbs(o) ? o.n : o.rep, act: actDone(o) });
    return out.slice(0, max);
  }
  function actDone(o) {
    var r = [];
    ['supervisor', 'coordinator', 'social', 'psych', 'admin'].forEach(function (st) {
      var d = o.doc && o.doc[st]; if (!d || !d.date || /^سجل سابق/.test(d.notes || '') || d.action === 'سجل سابق') return;
      var x = [d.contact, d.action].filter(Boolean).join(' • '); if (x) r.push(x);
    });
    return r.join(' • ');
  }
  function teamActs(o) { // إجراءات الفريق الواردة في السياسة لهذه الحالة
    var all = [];
    ['coordinator', 'admin'].forEach(function (st) { acts(o.text && o.text[st]).forEach(function (t) { if (/فريق إدارة السلوك|\(فريق/.test(t)) all.push(t.replace(/^\(فريق إدارة السلوك\)\s*/, '')); }); });
    return all;
  }
  function sepDays(o) {
    var t = acts((o.text && (o.text.coordinator || '')) + ' • ' + (o.text && o.text.admin || '')).join(' ');
    var m = t.match(/فصل[^•]*?(يوما واحدا|يومين|ثلاث أيام|ثلاثة أيام|خمس أيام|خمسة أيام)/);
    return m ? { 'يوما واحدا': 1, 'يومين': 2, 'ثلاث أيام': 3, 'ثلاثة أيام': 3, 'خمس أيام': 5, 'خمسة أيام': 5 }[m[1]] : '';
  }
  function people() {
    var f = F();
    return { coord: (f.coordinators || [])[0] || '', vp: f.adminVP || 'وداد الكربي', pr: f.principal || 'شيخة الرميحي' };
  }
  function sgRow(l, v) { return '<tr><td class="l">' + l + '</td><td class="v">' + (v ? e(v) : '&nbsp;') + '</td><td class="sgn">&nbsp;</td></tr>'; }

  /* نموذج (1) تعهد طالب (المشرف الإداري) */
  function g1(o) {
    var P = people(), sup = realWho(o.doc && o.doc.supervisor && o.doc.supervisor.who) || (me().role === 'supervisor' ? me().name : (o.supervisors || [])[0] || '');
    var L = sameList(o, 3); while (L.length < 3) L.push(null);
    // الإجراءات الوقائية المعتمدة في المدرسة (كما في الاستمارة الورقية) — قابلة للتعديل
    var pre = ['توعية أولياء الأمور بسياسة إدارة السلوك', 'توعية وإرشاد بسياسة إدارة سلوك الطلبة ونشرها في الأقسام', 'المتابعة المستمرة بالمرور على الصفوف وملاحظة الطلبة'];
    return gHead(1, 'تعهـــد طــــالب (المشرف الإداري)') +
      '<table class="nf"><tr><th colspan="8">بيانات المخالفة</th></tr>' + L.map(function (x) {
        return '<tr><td class="l">نوع المخالفة</td><td class="v">' + (x ? e(x.v) : '') + '</td><td class="l">درجة المخالفة</td><td class="v">' + (x ? e(x.deg) : '') + '</td><td class="l">المخالفة للمرة</td><td class="v nw">( ' + (x ? ord(x.rep) : '&nbsp;&nbsp;&nbsp;') + ' )</td><td class="l">تاريخ المخالفة</td><td class="v nw">' + (x ? dmy(x.date) : '') + '</td></tr>';
      }).join('') + '</table>' +
      '<div class="nf-box"><b>أتعهد أنا الطالب: <span class="v">' + e(o.student) + '</span></b><br>بالالتزام الكامل بلوائح ونظم المدرسة وعدم تكرار المخالفات التي سبق وقمت بها.<br>وفي حالة تكرار ذلك سوف تقوم إدارة المدرسة باتخاذ الإجراءات المتبعة حسب اللوائح والقوانين الخاصة بسياسة إدارة سلوك الطلبة 2026 بوزارة التربية والتعليم والتعليم العالي.</div>' +
      dayRow(today()) + '<table class="nf">' + stuRows(o, false) + '</table>' +
      '<table class="nf"><tr><th colspan="3">الإجراءات الوقائية التي تم اتخاذها مع الطالب</th></tr>' +
      [0, 1, 2].map(function (i) { return '<tr><td colspan="3">' + (i + 1) + '- ' + ed(pre[i] || '', '') + '</td></tr>'; }).join('') +
      '<tr><td class="l">توقيع الطالب</td><td class="l">رقم جوال ولي الأمر</td><td class="l">توقيع المشرف الإداري</td></tr>' +
      '<tr><td class="sgn">&nbsp;</td><td class="v" dir="ltr" style="text-align:center">' + e(o.phone || '') + '</td><td class="v sgn2" style="text-align:center">' + e(sup) + '</td></tr>' +
      '<tr><td class="l">منسق شؤون الطلاب</td><td class="v" colspan="2">' + e(P.coord) + '</td></tr>' +
      '<tr><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v" colspan="2">' + e(P.vp) + '</td></tr></table>' +
      '<div class="nf-note">❖ يتم توقيع الطالب في حال وصول المخالفات لعدد 3 مخالفات وبعدها يتم تحويل الطالب مع الاستمارة واستمارة التحويل لتوقيعها من قبل منسق شؤون الطلبة لاتخاذ الإجراء حسب السياسة ومن ثم للاختصاصي الاجتماعي لدراستها سواء سلوكية أو غياب.</div>' + gFoot();
  }
  /* نموذج (2) إثبات واقعة */
  function g2(o) {
    var P = people(), pre = acts(o.text && o.text.supervisor);
    var done = actDone(o);
    return gHead(2, 'إثبات واقعة') + dayRow(today()) +
      '<table class="nf">' + stuRows(o, true) +
      '<tr><td class="l">نوع الواقعة</td><td class="v">' + e(vName(o)) + '</td><td class="l">عدد مرات حدوثها</td><td class="v">' + (isAbs(o) ? o.n : o.rep) + '</td></tr>' +
      '<tr><td class="l">الموضوع</td><td colspan="3" style="height:5em;vertical-align:top">' + ed(isAbs(o) ? 'غياب الطالبة بدون عذر بتاريخ ' + dmy(o.date) : (o.violation + ' بتاريخ ' + dmy(o.date)), '') + '</td></tr>' +
      '<tr><td class="l">الإجراءات الأولية التي تمت</td><td colspan="3" style="height:5em;vertical-align:top">' + (done ? '<span class="v">' + e(done) + '</span>' : numbered(pre)) + '</td></tr>' +
      '<tr><td colspan="4">إخطار ولي الأمر بالواقعة والإجراء التالي لما بعد إثبات الواقعة: ' + bx('تم', !!(o.doc && o.doc.supervisor && o.doc.supervisor.contact)) + ' &nbsp;&nbsp; ' + bx('لم يتم') + '</td></tr>' +
      '<tr><td class="l" colspan="2">اسم الطالب</td><td class="l" colspan="2">التوقيع</td></tr><tr><td class="v" colspan="2">' + e(o.student) + '</td><td colspan="2" class="sgn">&nbsp;</td></tr></table>' +
      '<div class="nf-rec"><b>توصيات إدارة المدرسة</b><div class="ln2">' + ed('', '') + '</div></div>' +
      sigs([['منسق شؤون الطلاب', P.coord], ['نائب المدير للشؤون الإدارية وشؤون الطلاب', P.vp], ['يعتمد / مدير المدرسة', P.pr]]) + gFoot();
  }
  function pledge3(o) {
    var L = sameList(o, 3);
    return '<div class="nf-box" style="text-align:right">أتعهد أنا الطالب/ <span class="v">' + e(o.student) + '</span> بالصف/ <span class="v">' + grade(o.section) + ' (' + e(o.section) + ')</span><br>بالالتزام الكامل بلوائح ونظم المدرسة وعدم تكرار المخالفات التي سبق وقمت بها والمتمثلة في الآتي:<br>' +
      [0, 1, 2].map(function (i) { return (i + 1) + '. ' + (L[i] ? '<span class="v">' + e(L[i].v) + ' (' + dmy(L[i].date) + ')</span>' : ed('', '')); }).join('<br>') +
      '<br>وفي حالة تكرار ذلك سوف تقوم إدارة المدرسة باتخاذ الإجراءات المتبعة حسب اللوائح والقوانين الخاصة بسياسة إدارة سلوك الطلبة 2026 بوزارة التربية والتعليم والتعليم العالي.</div>';
  }
  /* نموذج (3) فصل داخلي */
  function g3(o) {
    var P = people(), n = sepDays(o);
    return gHead(3, 'فصل داخلي لطالب مع تعهد بعدم تكرار المخالفة') + dayRow(today()) +
      '<table class="nf">' + stuRows(o, true) + '<tr><td class="l">تاريخ الفصل</td><td colspan="3">' + ed('', '') + (n ? ' <span class="v">(' + (n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n + ' أيام') + ' حسب السياسة)</span>' : '') + '</td></tr></table>' +
      pledge3(o) +
      '<table class="nf"><tr><td class="l">ملاحظـــــة:</td><td>- لا يتم فصل الطالب إلا بعد إشعار ولي الأمر<br>- توفير وجبة صحية للطالب<br>- تحديد شخص مسؤول عن الطالب مع توفير المادة التعليمية خلال فترة الفصل</td></tr>' +
      '<tr><td class="l">توقيع الطالب</td><td class="l">توقيع منسق شؤون الطلاب</td></tr><tr><td class="sgn">&nbsp;</td><td class="v sgn2" style="text-align:center">' + e(P.coord) + '</td></tr>' +
      '<tr><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v">' + e(P.vp) + '</td></tr><tr><td class="l">يعتمد / مدير المدرسة</td><td class="v">' + e(P.pr) + '</td></tr></table>' +
      '<div class="nf-note">❖ يؤدي الطالب خلال الفصل الداخلي خدمة مجتمعية أو تعليمية</div>' + gFoot();
  }
  /* نموذج (4) فصل خارجي */
  function g4(o) {
    var P = people(), n = sepDays(o);
    return gHead(4, 'فصل خارجي لطالب مع تعهد بعدم تكرار المخالفة') + dayRow(today()) +
      '<table class="nf">' + stuRows(o, true) + '</table>' +
      '<table class="nf"><tr><td class="l" rowspan="3">عدد أيام فصل الطالب</td><td rowspan="3" class="v" style="text-align:center">' + (n || ed('', '')) + '</td><td class="l" rowspan="3">تاريخ الفصل</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td></tr><tr><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td></tr><tr><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td></tr></table>' +
      pledge3(o) +
      '<table class="nf"><tr><td class="l">ملاحظـــــة:</td><td>لا يتم فصل الطالب إلا بعد إشعار ولي الامر</td></tr>' +
      '<tr><td class="l">توقيع الطالب</td><td class="l">توقيع منسق شؤون الطلاب</td></tr><tr><td class="sgn">&nbsp;</td><td class="v sgn2" style="text-align:center">' + e(P.coord) + '</td></tr>' +
      '<tr><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v">' + e(P.vp) + '</td></tr><tr><td class="l">يعتمد / مدير المدرسة</td><td class="v">' + e(P.pr) + '</td></tr></table>' + gFoot();
  }
  /* نموذج (5) تقرير نهائي عن حالة طالب */
  function g5(o) {
    var st = me().role === 'psych' ? 'psych' : me().role === 'social' ? 'social' : (o.doc && o.doc.psych && o.doc.psych.date ? 'psych' : 'social');
    var d = (o.doc && o.doc[st]) || {}, d2 = (o.doc && o.doc[st === 'social' ? 'psych' : 'social']) || {};
    var who = me().role === st ? me().name : (st === 'social' ? o.social : '') || '';
    return gHead(5, 'تقرير نهائي عن حالة طالب (يرفع من قبل الاختصاصي النفسي أو الاجتماعي)') + dayRow(today()) +
      '<table class="nf"><tr><th colspan="4">بيانـــات الطالـــب</th></tr><tr><td class="l">اسم المدرسة</td><td class="v" colspan="3">مدرسة الشيماء الثانوية للبنات</td></tr>' + stuRows(o, false).replace(/^<tr><th[^]*?<\/tr>/, '') + '</table>' +
      '<table class="nf"><tr><th colspan="2">تقرير المشكلة</th></tr>' +
      '<tr><td class="l">عرض المشكلة<br><small>(مرفق نموذج بحث حالة)</small></td><td style="height:6em;vertical-align:top">' + ed(vName(o) + ' — ' + (isAbs(o) ? 'الغياب بدون عذر رقم ' + o.n : 'للمرة ' + ord(o.rep)) + (d.notes && !/^سجل سابق/.test(d.notes) ? '. ' + d.notes : ''), '') + '</td></tr>' +
      '<tr><td class="l">الإجراءات العلاجية<br><small>(مرفق)</small></td><td style="height:6em;vertical-align:top">' + ed([d.action, d2.date && !/^سجل سابق/.test(d2.notes || '') ? d2.action + (d2.notes ? ': ' + d2.notes : '') : ''].filter(Boolean).join(' • '), '') + '</td></tr>' +
      '<tr><td class="l">التوصيات لفريق إدارة سلوك الطلبة</td><td style="height:6em;vertical-align:top">' + ed('', '') + '</td></tr></table>' +
      '<table class="nf"><tr><td class="l">اسم الاختصاصي النفسي / الاجتماعي</td><td class="l">التوقيع</td></tr><tr><td class="v sgn2" style="text-align:center">' + e(who) + '</td><td class="sgn">&nbsp;</td></tr></table>' +
      '<div class="nf-note">❖ يتم طلب هذا التقرير من قبل فريق إدارة سلوك الطلبة</div>' + gFoot();
  }
  /* نموذج (6) مقابلة ولي أمر مع فريق إدارة سلوك الطلبة */
  function g6(o) {
    var P = people(), g = String(o.gName || ''), rel = (g.match(/\(([^)]+)\)\s*$/) || [])[1] || '', gn = g.replace(/\s*\([^)]*\)\s*$/, '');
    var soc = o.social || '', psy = ((N.S.boot.staff || []).filter(function (u) { return u.role === 'psych'; })[0] || {}).name || '';
    return gHead(6, 'مقابلة ولي أمر مع فريق إدارة سلوك الطلبة') + dayRow(today()) +
      '<table class="nf"><tr><td class="l">نوع المخالفة</td><td class="v">' + e(vName(o)) + '</td></tr></table>' +
      '<div class="nf-box" style="text-align:right">أتعهد أنا ولي امر الطالب: <span class="v">' + e(o.student) + '</span><br>في الصف: <span class="v">' + grade(o.section) + ' (' + e(o.section) + ')</span><br>بمتابعة التزام ابني بكافة اللوائح والنظم المدرسية الخاصة بسياسة إدارة سلوك الطلبة 2025 في المدارس الحكومية وفي حال قيامه بمخالفة تلك السياسة فلإدارة المدرسة الحق في اتخاذ ما تراه مناسبا وفق ما ورد من إجراءات تطبيق المخالفات في سياسة إدارة سلوك الطلبة 2026، وهذا تعهد مني بذلك.</div>' +
      '<table class="nf"><tr><th colspan="6">بيانات ولي الأمر</th></tr>' +
      '<tr><td class="l">ولي أمر الطالب</td><td class="v" colspan="5">' + e(o.student) + '</td></tr>' +
      '<tr><td class="l">اسم ولي الأمر</td><td class="v">' + e(gn) + '</td><td class="l">صلة القرابة</td><td class="v">' + e(rel) + '</td><td class="l">رقم الهاتف</td><td class="v" dir="ltr">' + e(o.phone || '') + '</td></tr>' +
      '<tr><td class="l">التوقيع</td><td colspan="5" class="sgn">&nbsp;</td></tr>' +
      '<tr><td class="l">منسق شؤون الطلاب</td><td class="v" colspan="5">' + e(P.coord) + '</td></tr>' +
      '<tr><td class="l">الاختصاصي الاجتماعي</td><td class="v" colspan="5">' + e(soc) + '</td></tr>' +
      '<tr><td class="l">الاختصاصي النفسي</td><td class="v" colspan="5">' + e(psy) + '</td></tr>' +
      '<tr><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v" colspan="5">' + e(P.vp) + '</td></tr>' +
      '<tr><td class="l">يعتمد / مدير المدرسة</td><td class="v" colspan="5">' + e(P.pr) + '</td></tr></table>' +
      '<div class="nf-note">❖ في حال استدعاء ولي الأمر أكثر من مره ولم يحضر يتم إرسال رسالة نصية لولي الأمر بقرار فريق إدارة سلوك الطلبة</div>' + gFoot();
  }
  function teamMembers() {
    var P = people(), st = N.S.boot.staff || [], one = function (r) { return (st.filter(function (u) { return u.role === r; })[0] || {}).name || ''; };
    return [['مدير المدرسة', P.pr], ['نائب المدير للشؤون الإدارية وشؤون الطلاب', P.vp], ['نائب المدير للشؤون الأكاديمية وشؤون الطلاب (عند الحاجة)', 'آسيا الذبياني'], ['منسق شؤون الطلبة', P.coord], ['المعلم (في حال ارتباطه بالمشكلة)', ''], ['الاختصاصي الاجتماعي', ''], ['الاختصاصي النفسي', one('psych')], ['المشرف الإداري', '']];
  }
  /* نموذج (7) محضر اجتماع الفريق لمجموعة من الطلاب */
  function g7(o) {
    var M = teamMembers(); M[5][1] = o.social || ''; M[7][1] = (o.supervisors || [])[0] || '';
    return gHead(7, 'محضر اجتماع فريق إدارة سلوك الطلبة لمجموعة من الطلاب') +
      '<table class="nf"><tr><td class="l">اليوم</td><td class="l">التاريخ</td><td class="l">الوقت</td><td class="l">المكان</td><td class="l">عدد الحضور</td><td class="l">عدد الغياب</td><td class="l">رقم الاجتماع</td></tr><tr><td class="v">' + wd(today()) + '</td><td class="v">' + dmy(today()) + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td></tr></table>' +
      '<table class="nf"><tr><td class="l">م</td><td class="l">اسم الطالب</td><td class="l">الصف</td><td class="l">المخالفة</td></tr><tr><td>1</td><td class="v">' + e(o.student) + '</td><td class="v">' + e(o.section) + '</td><td class="v">' + e(vName(o)) + '</td></tr>' +
      [2, 3, 4].map(function (i) { return '<tr><td>' + i + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td></tr>'; }).join('') + '</table>' +
      '<table class="nf"><tr><th colspan="3">أعضاء فريق إدارة سلوك الطلبة</th></tr><tr><td class="l">م</td><td class="l">الاسم</td><td class="l">المسمى الوظيفي</td></tr>' + M.map(function (m, i) { return '<tr><td>' + (i + 1) + '</td><td class="v">' + (m[1] ? e(m[1]) : ed('', '')) + '</td><td>' + m[0] + '</td></tr>'; }).join('') + '</table>' +
      '<table class="nf"><tr><th>عرض المشكلة</th></tr><tr><td style="height:3em">' + ed('', '') + '</td></tr><tr><th>الإجراءات العلاجية السابقة</th></tr><tr><td>1- ' + ed(actDone(o), '') + '<br>2- ' + ed('', '') + '</td></tr><tr><th>القرارات التي اتخذت</th></tr><tr><td>' + numbered(teamActs(o).slice(0, 4)) + '</td></tr></table>' +
      '<table class="nf"><tr><th colspan="3">توقيع أعضاء الفريق</th></tr><tr><td class="l">م</td><td class="l">الاسم</td><td class="l">التوقيع</td></tr>' + [1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<tr><td>' + i + '</td><td>' + ed('', '') + '</td><td class="sgn">&nbsp;</td></tr>'; }).join('') + '</table>' +
      '<div class="nf-note">❖ يتم طلب جميع الإجراءات الخاصة بالطالب من المشرف الإداري والإجراءات الوقائية مثل دراسة ومتابعة الطالب من قبل الاختصاصي النفسي أو الاجتماعي</div>' +
      '<div class="nf-appr">يعتمد،<br>رئيس الفريق<br>' + e(people().pr) + '<br>......................................</div>' + gFoot();
  }
  /* نموذج (8) محضر اجتماع الفريق مع طالب */
  function g8(o) {
    var L = priorList(o, 3); while (L.length < 3) L.push(null);
    var dec = teamActs(o);
    return gHead(8, 'محضر اجتماع فريق إدارة سلوك الطلبة مع طالب') + dayRow(today()) +
      '<table class="nf">' + stuRows(o, false) + '</table>' +
      '<table class="nf"><tr><td class="l">م</td><td class="l">التاريخ</td><td class="l">المخالفة</td><td class="l">الإجراء المتخذ</td></tr>' + L.map(function (x, i) {
        return '<tr><td>' + (i + 1) + '</td><td class="v">' + (x ? dmy(x.date) : '') + '</td><td class="v">' + (x ? e(x.v) + ' (' + ord(x.rep) + ')' : '') + '</td><td class="v">' + (x ? e(x.act || '') : '') + '</td></tr>'; }).join('') + '</table>' +
      '<div class="nf-box" style="text-align:right"><b>أولا:</b> بيان بعدم التزام الطالب باللوائح والنظم المدرسية ومخالفاته السابقة بالمجتمع المدرسي وأساليب تعديل السلوك التي اتخذت حياله وتوقيتاته الزمنية.<br><b>ثانيا:</b> قرار فريق إدارة سلوك الطلبة بالمدرسة في اجتماعه بتاريخ <span class="v">' + dmy(today()) + '</span><br>بناء على ما سبق وبعد الاطلاع على:<br>1. الدراسة الفردية الاجتماعية او النفسية للطالب والمقدمة من الاختصاصي الاجتماعي/ النفسي بالمدرسة.<br>2. ملف الطالب وما تضمن من إفادات خطية للطالب وذوي العلاقة.<br>3. الإجراءات التي اتبعت حيال الطالب إزاء مخالفته اللوائح والنظم المدرسية.<br>وبعد تيقن الفريق من تدرج الإجراءات طبقا لسياسة إدارة سلوك الطلبة 2026، وعدم التزام الطالب بكافة الإجراءات التي اتبعت حياله في إطار الجهود لتعديل سلوكه السلبي.<br>ونظرا لما بدر منه بتاريخ <span class="v">' + dmy(o.date) + '</span> فقد قررت الفريق الآتي:-</div>' +
      '<table class="nf"><tr><th>قرار أعضاء الفريق</th></tr><tr><td style="min-height:4em">' + numbered(dec.slice(0, 5)) + '</td></tr></table>' +
      '<table class="nf"><tr><th colspan="4">توقيع أعضاء الفريق</th></tr><tr><td class="l">م</td><td class="l">الاسم</td><td class="l">المسمى الوظيفي</td><td class="l">التوقيع</td></tr>' +
      teamMembers().filter(function (m) { return m[1]; }).concat([['', ''], ['', '']]).slice(0, 6).map(function (m, i) { return '<tr><td>' + (i + 1) + '</td><td class="v">' + (m[1] ? e(m[1]) : ed('', '')) + '</td><td>' + (m[0] || ed('', '')) + '</td><td class="sgn">&nbsp;</td></tr>'; }).join('') + '</table>' +
      '<div class="nf-note">❖ يتم طلب جميع الإجراءات الخاصة بالطالب من المشرف الإداري والإجراءات الوقائية مثل دراسة حالة ومتابعة الطالب من قبل الاختصاصي النفسي أو الاجتماعي.</div>' +
      '<div class="nf-appr">يعتمد،<br>رئيس الفريق<br>' + e(people().pr) + '<br>......................................</div>' + gFoot();
  }

  /* قرار عدم الأهلية لدخول الاختبار (الحرمان) — لا يوجد له نموذج رسمي في الدليل؛ صيغته من نص سياسة الغياب 2026 */
  function eligInfo(o) {
    var t = txt(o, 'admin') + ' • ' + txt(o, 'coordinator'), el = String(o.elig || '');
    var warn = /بالعلم بعدم أهلية|إنذار نهائي/.test(t) && !/^غير مؤهلة/.test(el) ? true : /بالعلم بعدم أهلية|إنذار نهائي/.test(t) && !/قرار عدم أهلية/.test(t);
    var exam = (t.match(/(?:عدم أهلية الطالب|بعدم أهلية الطالب)\s*(?:ل\s*)?لدخول\s*(اختبار[^•]*?)(?:\s*وإخطار|\s*في حال|\s*•|$)/) || [])[1] || el.replace(/^غير مؤهلة لدخول\s*/, '').replace(/\s*وإخطار.*$/, '');
    return { warn: warn, exam: String(exam || '').trim() };
  }
  function g9(o) {
    var P = people(), I = eligInfo(o);
    var recs = ((N.S.boot.abs && N.S.boot.abs.records) || []).filter(function (x) { return x.student === o.student && x.section === o.section && x.kind === 'U' && x.date <= o.date; })
      .sort(function (x, y) { return x.date < y.date ? -1 : 1; });
    if (!recs.some(function (x) { return x.id === o.id; })) recs.push(o);
    var dates = recs.map(function (x) { return dmy(x.date); });
    var cnt = Math.max(recs.length, Number(o.n) || 0);
    var soc = o.social || '';
    var title = I.warn ? 'إشعار ولي الأمر بالعلم بعدم أهلية الطالب لدخول الاختبار' : 'قرار عدم أهلية الطالب لدخول الاختبار وإخطار ولي الأمر';
    return '<span class="nf-gd" hidden></span><div class="nf-top"><span class="nf-tag">سياسة الغياب 2026</span><span class="nf-sub">فريق إدارة سلوك الطلبة — مدرسة الشيماء الثانوية للبنات</span></div><div class="nf-title">' + title + '</div>' +
      dayRow(today()) + '<table class="nf">' + stuRows(o, true) + '</table>' +
      '<table class="nf"><tr><th colspan="4">بيان الغياب بدون عذر رسمي</th></tr>' +
      '<tr><td class="l">عدد أيام الغياب بدون عذر</td><td class="v">' + cnt + '</td><td class="l">الاختبار</td><td class="v">' + e(I.exam || '') + '</td></tr>' +
      '<tr><td class="l">تواريخ الغياب</td><td colspan="3" class="v" style="font-size:.85em;line-height:1.7">' + dates.join(' ، ') + '</td></tr></table>' +
      '<div class="nf-box" style="text-align:right">' + (I.warn ?
        'بناءً على سياسة إدارة سلوك الطلبة 2026 (إجراءات الغياب بدون عذر)، وبعد استنفاد الإجراءات السابقة، يُحاط ولي أمر الطالب علمًا بأنه في حال تجاوز غياب الطالب بدون عذر رسمي الحد المسموح به فإن الطالب يصبح غير مؤهل لدخول <span class="v">' + e(I.exam || '..............') + '</span>.' :
        'بناءً على سياسة إدارة سلوك الطلبة 2026 (إجراءات الغياب بدون عذر)، ونظرًا لتغيّب الطالب بدون عذر رسمي (<span class="v">' + cnt + '</span>) أيام، وبعد استنفاد الإجراءات السابقة، فقد قرر فريق إدارة سلوك الطلبة في اجتماعه بتاريخ <span class="v">' + dmy(today()) + '</span> عدم أهلية الطالب لدخول <span class="v">' + e(I.exam || '..............') + '</span> وإخطار ولي الأمر بذلك.') + '</div>' +
      '<table class="nf"><tr><th colspan="4">إقرار ولي الأمر</th></tr><tr><td colspan="4" style="line-height:1.9">أقر أنا ولي أمر الطالب: <span class="v">' + e(o.student) + '</span> بعلمي بما ورد أعلاه، وأتعهد بالتزام الطالب بالدوام المدرسي.</td></tr>' +
      '<tr><td class="l">اسم ولي الأمر</td><td class="v">' + e(String(o.gName || '').replace(/\s*\([^)]*\)\s*$/, '')) + '</td><td class="l">التوقيع</td><td class="sgn">&nbsp;</td></tr>' +
      '<tr><td class="l">طريقة الإخطار</td><td colspan="3">' + bx('حضوريًا') + ' &nbsp; ' + bx('هاتفيًا') + ' &nbsp; ' + bx('رسالة نصية') + ' &nbsp; ' + bx('لم يحضر — أُرسلت رسالة نصية بالقرار') + '</td></tr></table>' +
      '<table class="nf"><tr><th colspan="3">أعضاء فريق إدارة سلوك الطلبة</th></tr><tr><td class="l">المسمى الوظيفي</td><td class="l">الاسم</td><td class="l">التوقيع</td></tr>' +
      [['منسق شؤون الطلبة', P.coord], ['الاختصاصي الاجتماعي', soc], ['نائب المدير للشؤون الإدارية وشؤون الطلاب', P.vp]].map(function (m) { return '<tr><td>' + m[0] + '</td><td class="v">' + e(m[1]) + '</td><td class="sgn">&nbsp;</td></tr>'; }).join('') + '</table>' +
      '<div class="nf-appr">يعتمد،<br>مدير المدرسة / رئيس الفريق<br>' + e(P.pr) + '<br>......................................</div>' +
      '<div class="nf-foot">صيغة القرار مأخوذة من نصوص سياسة الغياب 2026 — لا يوجد له نموذج في دليل الفريق</div>';
  }

  /* متى يُفتح كل نموذج: عند بلوغ الحالة خطوة السياسة الخاصة به (لا قبلها) */
  // الأسماء الحقيقية فقط: «نُقلت من نظام Excel» و«سجل سابق» ليست أسماء موظفات
  function realWho(w) { w = String(w || '').trim(); return /^(نُقلت|نقلت|سجل سابق)/.test(w) ? '' : w; }
  function isPriorDoc(d) { return !!d && (/^سجل سابق/.test(d.notes || '') || d.action === 'سجل سابق' || d.who === 'سجل سابق'); }
  function reached(o, st) { var s = o.stages && o.stages[st]; return !!(s && s.need && (s.open || s.documented) && !(s.documented && isPriorDoc(o.doc && o.doc[st]))); }
  function myTurn(o, st) { var s = o.stages && o.stages[st]; return !!(s && s.need && s.open && !s.documented); }
  function txt(o, st) { return String(o.text && o.text[st] || ''); }
  var GUIDE = {
    g1: { title: 'تعهد طالب', no: 'رقم 1', st: 'supervisor', roles: ['supervisor'], when: function (o) { return reached(o, 'supervisor') && (/^(التأخير الصباحي|التأخر عن الطابور)/.test(o.violation || '') || /تعهد\s*(خطي\s*(\(\d\)\s*)?للطالب|الطالب\s*خطيا)|تنبيه خطي للطالب/.test(txt(o, 'supervisor'))); }, build: g1 },
    g2: { title: 'إثبات واقعة', no: 'رقم 2', st: 'coordinator', roles: ['coordinator'], when: function (o) { return reached(o, 'coordinator') && !isAbs(o); }, build: g2 },
    g3: { title: 'فصل داخلي مع تعهد', no: 'رقم 3', st: 'coordinator', roles: ['coordinator'], when: function (o) { return reached(o, 'coordinator') && /فصل داخلي/.test(txt(o, 'coordinator') + txt(o, 'admin')); }, build: g3 },
    g4: { title: 'فصل خارجي مع تعهد', no: 'رقم 4', st: 'coordinator', roles: ['coordinator'], when: function (o) { return reached(o, 'coordinator') && /فصل خارجي|من الحافلة|فصل الطالب من الدوام/.test(txt(o, 'coordinator') + txt(o, 'admin')); }, build: g4 },
    g5s: { title: 'تقرير نهائي عن حالة طالب', no: 'رقم 5', st: 'social', roles: ['social'], when: function (o) { return reached(o, 'social'); }, build: g5 },
    g5p: { title: 'تقرير نهائي عن حالة طالب', no: 'رقم 5', st: 'psych', roles: ['psych'], when: function (o) { return reached(o, 'psych'); }, build: g5 },
    g6: { title: 'مقابلة ولي أمر مع الفريق', no: 'رقم 6', st: 'admin', roles: ['admin'], when: function (o) { return /فريق إدارة سلوك|فريق إدارة السلوك/.test(txt(o, 'coordinator') + txt(o, 'admin')) && (reached(o, 'coordinator') || reached(o, 'admin')); }, build: g6 },
    g7: { title: 'محضر اجتماع الفريق لمجموعة', no: 'رقم 7', st: 'admin', roles: ['admin'], when: function (o) { return GUIDE.g6.when(o); }, build: g7 },
    g9: { title: 'قرار عدم الأهلية لدخول الاختبار', no: 'سياسة الغياب', st: 'admin', roles: ['admin', 'coordinator'], absOnly: true, when: function (o) { var t = txt(o, 'admin') + txt(o, 'coordinator'); return /عدم أهلية|بعدم أهلية|إنذار نهائي/.test(t + (o.elig || '')) && (reached(o, 'admin') || reached(o, 'coordinator')); }, build: g9 },
    g8: { title: 'محضر اجتماع الفريق مع طالب', no: 'رقم 8', st: 'admin', roles: ['admin'], when: function (o) { return GUIDE.g6.when(o); }, build: g8 }
  };
  // نماذج الغياب (abs): المشرفة تملك مرحلة «الفريق» في الغياب تحت admin
  function guideFor(kind, o) {
    var r = me().role, out = [];
    Object.keys(GUIDE).forEach(function (id) {
      var g = GUIDE[id];
      if (g.roles.indexOf(r) < 0) return;
      if (kind === 'abs' && o.kind !== 'U') return;
      if (kind === 'abs' && id === 'g2') return;
      if (kind !== 'abs' && g.absOnly) return;
      try { if (g.when(o)) out.push(id); } catch (err) {}
    });
    return out;
  }

  /* ---------- أي الاستمارات تظهر لكل بطاقة ---------- */
  var DEF = {
    f10: { title: 'استمارة تحويل حالة سلوكية', no: 10, build: function (o) { return f10(o); } },
    f9: { title: 'استمارة تحويل حالة غياب', no: 9, build: function (o) { return f9(o); } },
    f5c: { title: 'استمارة جلسة فردية', no: 5, build: function (o) { return f5(o, false); } },
    f5a: { title: 'استمارة جلسة فردية', no: 5, build: function (o) { return f5(o, true); } }
  };
  Object.keys(GUIDE).forEach(function (id) { DEF[id] = { title: GUIDE[id].title, no: GUIDE[id].no + ' — دليل الفريق', build: GUIDE[id].build, st: GUIDE[id].st }; });
  function available(kind, o) {
    var r = me().role, out = [];
    if (!o || !o.req) return out;
    var staff = ['supervisor', 'coordinator', 'social', 'admin'].indexOf(r) >= 0;
    if (kind === 'case') {
      if (o.req.social && staff) out.push('f10');
      if (o.req.social && (r === 'social' || r === 'admin')) out.push('f5c');
    } else {
      if (o.kind === 'U' && o.req.social && staff) out.push('f9');
      if (o.req.social && (r === 'social' || r === 'admin')) out.push('f5a');
    }
    return out;
  }
  function buttons(kind, o) {
    var ids = available(kind, o).concat(guideFor(kind, o));
    if (!ids.length) return '';
    return '<div class="nf-btns">' + ids.map(function (id) {
      var stg = DEF[id].st, flash = stg && me().role === stg && (myTurn(o, stg) || (stg === 'admin' && (myTurn(o, 'coordinator') || myTurn(o, 'admin')))) ? ' flash' : '';
      return '<button type="button" class="nf-pbtn' + flash + '" data-nform="' + id + '" data-nk="' + kind + '" data-nid="' + e(o.id) + '">🖨 ' + DEF[id].title + ' (نموذج ' + DEF[id].no + ')</button>';
    }).join('') + '</div>';
  }

  /* ---------- المعاينة والطباعة والإرسال ---------- */
  function find(kind, id) {
    var b = N.S.boot;
    if (kind === 'case') return (b.cases || []).filter(function (c) { return c.id === id; })[0];
    return ((b.abs && b.abs.records) || []).filter(function (a) { return a.id === id; })[0];
  }
  function fit(paper) { // ورقة واحدة: نصغّر الخط حتى تدخل في A4
    var maxH = 277 * 3.7795;
    var fs = 15;
    paper.style.fontSize = fs + 'px';
    while (paper.scrollHeight > maxH && fs > 8.2) { fs -= 0.3; paper.style.fontSize = fs + 'px'; }
  }
  function open(id, kind, oid) {
    var o = find(kind, oid);
    if (!o) { N.toast('لم أجد بيانات الحالة — حدّثي الصفحة', 'bad'); return; }
    var d = DEF[id];
    CUR = { id: id, o: o, d: d, kind: kind };
    var staff = (N.S.boot.staff || []).filter(function (u) { return u.name !== me().name && u.role !== 'teacher' && u.role !== 'daily'; });
    var defTo = (F().coordinators || [])[0] || '';
    if (me().role === 'coordinator') defTo = o.social || '';
    var m = document.getElementById('nf-modal');
    if (!m) { m = document.createElement('div'); m.id = 'nf-modal'; document.body.appendChild(m); }
    m.innerHTML = '<div class="nf-back"></div><div class="nf-dlg" role="dialog" aria-modal="true" aria-label="معاينة الاستمارة">' +
      '<div class="nf-bar"><b>معاينة: ' + d.title + ' — ' + e(o.student) + '</b>' +
      '<div class="nf-acts"><button class="btn" id="nf-print" type="button">🖨 طباعة</button><button class="btn sec" id="nf-mailt" type="button">✉ إرسال بالبريد</button><button class="btn sec" id="nf-close" type="button">إغلاق</button></div></div>' +
      '<div class="nf-mail" id="nf-mail" hidden><div class="field"><label class="lbl" for="nf-to">إلى</label><select class="inp" id="nf-to">' +
      staff.map(function (u) { return '<option value="' + e(u.name) + '"' + (u.name === defTo ? ' selected' : '') + '>' + e(u.name) + ' — ' + e(u.roleLabel || '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="nf-cc">نسخة تلقائيًا: <b>النائبة الإدارية' + (F().adminVP ? ' (' + e(F().adminVP) + ')' : '') + '</b> و<b>مديرة المدرسة' + (F().principal ? ' (' + e(F().principal) + ')' : '') + '</b> — والاستمارة مرفقة PDF</div>' +
      '<div class="field"><label class="lbl" for="nf-note">ملاحظة (اختياري)</label><input class="inp" id="nf-note"></div>' +
      '<button class="btn" id="nf-send" type="button">إرسال</button></div>' +
      '<p class="nf-hint">الخانات الزرقاء تعبّأت تلقائيًا. يمكنكِ الكتابة في الخانات المنقطة والتأشير على المربعات قبل الطباعة.</p>' +
      '<div class="nf-stage"><article class="nf-paper' + (/^g/.test(id) ? ' nf-gdoc' : '') + '" id="nf-paper">' + d.build(o) + '</article></div></div>';
    m.hidden = false; document.body.classList.add('nf-open');
    var paper = document.getElementById('nf-paper');
    fit(paper);
    if (window.NamoosSig) { NamoosSig.decorate(paper, 'td.sgn, td.sgn2, .nf-sig td, .nf-appr', function () { fit(paper); }); NamoosSig.autoMine(paper, me().name, function () { fit(paper); }); }
    paper.addEventListener('click', function (ev) {
      var cb = ev.target.closest('.nf-cb'); if (!cb) return;
      var on = !cb.classList.contains('on'); cb.classList.toggle('on', on); cb.textContent = on ? '☑' : '☐'; cb.setAttribute('aria-checked', on);
    });
    paper.addEventListener('keydown', function (ev) { if ((ev.key === ' ' || ev.key === 'Enter') && ev.target.classList.contains('nf-cb')) { ev.preventDefault(); ev.target.click(); } });
    paper.addEventListener('input', function () { fit(paper); });
    document.getElementById('nf-close').onclick = close;
    m.querySelector('.nf-back').onclick = close;
    document.getElementById('nf-print').onclick = function () { fit(paper); document.body.classList.add('nf-printing'); setTimeout(function () { window.print(); }, 60); };
    document.getElementById('nf-mailt').onclick = function () { var x = document.getElementById('nf-mail'); x.hidden = !x.hidden; };
    document.getElementById('nf-send').onclick = send;
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('nf-printing'); });
  function close() { var m = document.getElementById('nf-modal'); if (m) { m.hidden = true; m.innerHTML = ''; } document.body.classList.remove('nf-open'); }

  function loadLibs() {
    if (window.html2canvas && window.jspdf) return Promise.resolve();
    var add = function (src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); };
    return add('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').then(function () { return add('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'); });
  }
  function toPdf(paper) {
    return loadLibs().then(function () {
      paper.classList.add('nf-snap');
      return window.html2canvas(paper, { scale: 2, backgroundColor: '#ffffff', useCORS: true, ignoreElements: function (el) { return el.classList && el.classList.contains('nf-noprint'); } });
    }).then(function (cv) {
      paper.classList.remove('nf-snap');
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var w = 190, h = cv.height * w / cv.width;
      if (h > 277) { h = 277; w = cv.width * h / cv.height; }
      pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', (210 - w) / 2, 10, w, h);
      return pdf.output('datauristring');
    });
  }
  function send() {
    var btn = document.getElementById('nf-send'); if (btn.disabled) return;
    var to = document.getElementById('nf-to').value;
    if (!to) { N.toast('اختاري الجهة', 'bad'); return; }
    btn.disabled = true; btn.textContent = 'جارٍ تجهيز الاستمارة وإرسالها…';
    var paper = document.getElementById('nf-paper');
    toPdf(paper).then(function (pdf) {
      return N.api('sendForm', { to: to, title: CUR.d.title + ' (نموذج ' + CUR.d.no + ')', student: CUR.o.student, section: CUR.o.section, caseId: CUR.o.id, note: document.getElementById('nf-note').value, pdf: pdf });
    }).then(function (r) {
      N.toast('✔ أُرسلت الاستمارة إلى ' + r.to + (r.cc ? ' مع نسخة للنائبة الإدارية ومديرة المدرسة' : ''), 'ok', 6000);
      close();
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = 'إرسال';
      N.toast(err && err.message ? err.message : 'تعذّر الإرسال', 'bad');
    });
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-nform]');
    if (!b || !N) return;
    ev.preventDefault(); ev.stopPropagation();
    open(b.dataset.nform, b.dataset.nk, b.dataset.nid);
  });

  // شرائح النماذج لصفحة «تنظيم مهامي»: المطلوب الآن أصفر (معبّأ وجاهز)، وغير المطلوب في هذه المرحلة رمادي
  function chips(kind, o) {
    var r = me().role, req = available(kind, o).concat(guideFor(kind, o)), all = [];
    var staff = ['supervisor', 'coordinator', 'social', 'admin'].indexOf(r) >= 0;
    if (staff) all.push(kind === 'case' ? 'f10' : 'f9');
    Object.keys(GUIDE).forEach(function (id) {
      var g = GUIDE[id]; if (g.roles.indexOf(r) < 0) return;
      if (kind === 'abs' && id === 'g2') return; if (kind !== 'abs' && g.absOnly) return;
      all.push(id);
    });
    req.forEach(function (id) { if (all.indexOf(id) < 0) all.push(id); });
    var seen = {};
    return all.filter(function (id) { var t = DEF[id].title; if (seen[t]) return false; seen[t] = 1; return true; }).map(function (id) {
      var on = req.indexOf(id) >= 0;
      return on ? '<button type="button" class="fchip on" data-nform="' + id + '" data-nk="' + kind + '" data-nid="' + e(o.id) + '" title="مطلوب الآن — معبّأ وجاهز للطباعة">🖨 ' + DEF[id].title + '</button>' :
        '<span class="fchip off" title="غير مطلوب في هذه المرحلة">' + DEF[id].title + '</span>';
    }).join('');
  }
  window.NamoosForms = { init: function (ctx) { N = ctx; }, buttons: buttons, chips: chips, _build: function (id, o) { return DEF[id].build(o); } };
})();
