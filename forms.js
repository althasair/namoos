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
    var sup = (c.doc && c.doc.supervisor && c.doc.supervisor.who) || (me().role === 'supervisor' ? me().name : (c.supervisors || [])[0] || '');
    var coord = (c.doc && c.doc.coordinator && c.doc.coordinator.who) || (F().coordinators || [])[0] || '';
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
    var sup = (a.doc && a.doc.supervisor && a.doc.supervisor.who) || (me().role === 'supervisor' ? me().name : (a.supervisors || [])[0] || '');
    var coord = (a.doc && a.doc.coordinator && a.doc.coordinator.who) || (F().coordinators || [])[0] || '';
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
    var tardy = !isAbs && /^التأخر عن الطابور/.test(x.violation || '');
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
    return '<table class="nf-sig"><tr>' + list.map(function (p) { return '<td><b>' + p[0] + '</b><div class="nm">' + (p[1] ? e(p[1]) : '&nbsp;') + '</div><div class="ln">التوقيع: ............................</div></td>'; }).join('') + '</tr></table>';
  }

  /* ---------- أي الاستمارات تظهر لكل بطاقة ---------- */
  var DEF = {
    f10: { title: 'استمارة تحويل حالة سلوكية', no: 10, build: function (o) { return f10(o); } },
    f9: { title: 'استمارة تحويل حالة غياب', no: 9, build: function (o) { return f9(o); } },
    f5c: { title: 'استمارة جلسة فردية', no: 5, build: function (o) { return f5(o, false); } },
    f5a: { title: 'استمارة جلسة فردية', no: 5, build: function (o) { return f5(o, true); } }
  };
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
    var ids = available(kind, o);
    if (!ids.length) return '';
    return '<div class="nf-btns">' + ids.map(function (id) {
      return '<button type="button" class="nf-pbtn" data-nform="' + id + '" data-nk="' + kind + '" data-nid="' + e(o.id) + '">🖨 طباعة: ' + DEF[id].title + ' (نموذج ' + DEF[id].no + ')</button>';
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
      '<div class="nf-stage"><article class="nf-paper" id="nf-paper">' + d.build(o) + '</article></div></div>';
    m.hidden = false; document.body.classList.add('nf-open');
    var paper = document.getElementById('nf-paper');
    fit(paper);
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
      return window.html2canvas(paper, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
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

  window.NamoosForms = { init: function (ctx) { N = ctx; }, buttons: buttons, _build: function (id, o) { return DEF[id].build(o); } };
})();
