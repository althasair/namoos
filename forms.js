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


  /* ---------- قوائم الإجراءات: قائمة منسدلة بكل الاحتمالات + إضافة أكثر من بند + كتابة حرة ---------- */
  var ACT_CAT = [
    ['إجراءات وقائية وتوعوية', ['النشر والتوعية في الطابور الصباحي', 'شرح الدليل التنظيمي لإدارة سلوك الطلبة', 'شرح سياسة إدارة سلوك الطلبة 2026 للطالبة', 'شرح سياسة الغياب 2026 للطالبة وولي الأمر', 'توعية أولياء الأمور بسياسة إدارة السلوك', 'توعية وإرشاد بسياسة إدارة سلوك الطلبة ونشرها في الأقسام', 'المتابعة المستمرة بالمرور على الصفوف وملاحظة الطلبة', 'الإذاعة المدرسية التوعوية', 'توزيع نشرات ومطويات توعوية', 'حصة توجيه وإرشاد جمعي', 'لقاء توعوي مع أولياء الأمور', 'نشر السياسة عبر مجموعات أولياء الأمور', 'تعزيز السلوك الإيجابي وتكريم الملتزمات', 'إشراك الطالبة في الأنشطة المدرسية']],
    ['إجراءات المعلمة والمشرفة الإدارية', ['التنبيه الشفهي الانفرادي بأسلوب تربوي', 'التنبيه الخطي للطالبة', 'إشعار ولي الأمر هاتفيًا', 'إشعار ولي الأمر برسالة نصية', 'لم يرد ولي الأمر — تم إرسال رسالة نصية', 'تعهد خطي (1) للطالبة بعدم تكرار المخالفة', 'تعهد خطي (2) للطالبة بعدم تكرار المخالفة', 'تعهد خطي (3) للطالبة بعدم تكرار المخالفة', 'الإحالة إلى المشرفة الإدارية', 'الإحالة إلى منسقة شؤون الطالبات']],
    ['إجراءات منسقة شؤون الطالبات', ['طلب استدعاء ولي الأمر خطيًا للحضور إلى المدرسة', 'الاجتماع بولي الأمر وتسليمه نسخة من السياسة', 'تعهد خطي لولي الأمر بالتزام الطالبة', 'إثبات واقعة', 'الإحالة إلى الأخصائية الاجتماعية', 'الإحالة إلى الأخصائية النفسية', 'الإحالة إلى فريق إدارة سلوك الطلبة']],
    ['الإرشاد والدراسة (الأخصائيات)', ['توجيه وإرشاد فردي للطالبة', 'جلسات إرشادية فردية', 'دراسة حالة الطالبة', 'متابعة دراسة الحالة', 'وضع خطة علاجية لتعديل السلوك', 'عقد سلوكي مع الطالبة', 'التواصل مع ولي الأمر لمتابعة الطالبة', 'متابعة التحصيل الدراسي للطالبة', 'تقديم الخدمات الإرشادية لتعديل السلوك']],
    ['قرارات فريق إدارة سلوك الطلبة والإدارة', ['استدعاء ولي الأمر لحضور اجتماع فريق إدارة سلوك الطلبة', 'توقيع ولي الأمر على تعهد خلال الاجتماع', 'تعهد نهائي للطالبة بالالتزام', 'فصل مؤقت للطالبة (فصل داخلي) يومًا واحدًا', 'فصل مؤقت للطالبة (فصل داخلي) ثلاثة أيام', 'إيقاف تعليمي وفق السياسة', 'احتساب التأخير يوم غياب بدون عذر', 'حرمان الطالبة من دخول اختبار منتصف الفصل الأول', 'حرمان الطالبة من دخول اختبار نهاية الفصل الأول', 'حرمان الطالبة من دخول اختبار منتصف الفصل الثاني', 'حرمان الطالبة من دخول اختبار نهاية الفصل الثاني', 'إشعار ولي الأمر بعدم أهلية الطالبة لدخول الاختبار', 'الإحالة إلى قسم حماية ورعاية الطلبة', 'متابعة الطالبة من المشرفة الإدارية', 'متابعة الطالبة من الأخصائية الاجتماعية أو النفسية']]
  ];
  function polActs(o) { var L = []; ['teacher', 'supervisor', 'coordinator', 'social', 'psych', 'admin'].forEach(function (st) { acts(o && o.text && o.text[st]).forEach(function (t) { t = t.replace(/^\(فريق إدارة السلوك\)\s*/, ''); if (L.indexOf(t) < 0) L.push(t); }); }); return L; }
  function alRow(v) { return '<div class="nf-alr"><span class="nf-aln"></span>' + ed(v, 'اكتبي أو اختاري من القائمة') + '<button type="button" class="nf-aldel" title="حذف البند" aria-label="حذف البند">×</button></div>'; }
  function alist(items, o, min) {
    items = (items || []).filter(Boolean); min = min || 2; while (items.length < min) items.push('');
    var pol = polActs(o), grp = function (t, L) { return '<optgroup label="' + e(t) + '">' + L.map(function (x) { return '<option>' + e(x) + '</option>'; }).join('') + '</optgroup>'; };
    return '<div class="nf-al">' + items.map(alRow).join('') +
      '<div class="nf-alc"><select class="nf-alsel" aria-label="إضافة إجراء من القائمة"><option value="">▾ اختاري إجراءً من القائمة لإضافته…</option>' + (pol.length ? grp('من السياسة لهذه الحالة', pol) : '') + ACT_CAT.map(function (g) { return grp(g[0], g[1]); }).join('') + '</select>' +
      '<button type="button" class="nf-aladd">＋ إضافة بند</button></div></div>';
  }
  function alWire(paper) {
    paper.addEventListener('change', function (ev) {
      var sl = ev.target.closest('.nf-alsel'); if (!sl || !sl.value) return;
      var al = sl.closest('.nf-al'), eds = al.querySelectorAll('.nf-alr .nf-ed'), empty = [].filter.call(eds, function (x) { return !x.textContent.trim(); })[0];
      if (!empty) { al.querySelector('.nf-alc').insertAdjacentHTML('beforebegin', alRow('')); empty = al.querySelectorAll('.nf-alr .nf-ed'); empty = empty[empty.length - 1]; }
      empty.textContent = sl.value; sl.value = ''; fit(paper); fsSave();
    });
    paper.addEventListener('click', function (ev) {
      var a = ev.target.closest('.nf-aladd'), d = ev.target.closest('.nf-aldel');
      if (a) { a.closest('.nf-alc').insertAdjacentHTML('beforebegin', alRow('')); var L = a.closest('.nf-al').querySelectorAll('.nf-alr .nf-ed'); L[L.length - 1].focus(); fit(paper); fsSave(); }
      if (d) { var al = d.closest('.nf-al'); if (al.querySelectorAll('.nf-alr').length > 1) d.closest('.nf-alr').remove(); else d.closest('.nf-alr').querySelector('.nf-ed').textContent = ''; fit(paper); fsSave(); }
    });
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
  /* أيام الغياب بدون عذر للطالبة حتى تاريخ السجل — من القائمة الكاملة للخادم (uDates) حتى لا تسقط الأيام القديمة */
  function uRecs(o) {
    var A = N.S.boot.abs || {}, recs = (A.records || []).filter(function (x) { return x.student === o.student && x.section === o.section && x.kind === 'U' && x.date <= o.date; });
    var seen = {}; recs.forEach(function (x) { seen[x.date] = 1; });
    ((A.uDates || {})[o.student + '|' + o.section] || []).forEach(function (d) { if (d <= o.date && !seen[d]) { seen[d] = 1; recs.push({ date: d, kind: 'U', student: o.student, section: o.section }); } });
    if (!recs.some(function (x) { return x.id === o.id || x.date === o.date; })) recs.push(o);
    return recs.sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : 0; });
  }
  function f9(a) {
    var recs = uRecs(a);
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
      '<tr><td class="l">الاختصاصي الاجتماعي</td><td class="v sgn2" colspan="3">' + e(soc) + '</td></tr>' +
      '<tr><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v sgn2 sgvp" colspan="3">' + e(F().adminVP || '') + '</td></tr>' +
      '</table>' + foot();
  }


  /* ---------- نموذج 6: بحث حالة (استمارات العمل الاجتماعي 2026) — نصه كما هو، يمتد على صفحتين كالأصل ---------- */
  function f6(o) {
    var t = today(), v = String(o.violation || '');
    var tardy = /^(التأخير الصباحي|التأخر عن الطابور)/.test(v);
    var A = N.S.boot.abs || {}, ud = {};
    ((A.uDates || {})[o.student + '|' + o.section] || []).forEach(function (d) { ud[d] = 1; });
    (A.records || []).forEach(function (x) { if (x.student === o.student && x.section === o.section && x.kind === 'U') ud[x.date] = 1; });
    var nAbs = Object.keys(ud).length;
    var g = String(o.gName || ''), rel = (g.match(/\(([^)]+)\)\s*$/) || [])[1] || '', gn = g.replace(/\s*\([^)]*\)\s*$/, '');
    var soc = me().role === 'social' ? me().name : (o.social || '');
    var L = function (x) { return '<td class="l">' + x + '</td>'; };
    var W = function (x, cs) { return '<td' + (cs ? ' colspan="' + cs + '"' : '') + '>' + x + '</td>'; };
    var gr = function (items) { return '<div class="nf-g">' + items.map(function (i) { return '<span>' + i + '</span>'; }).join('') + '</div>'; };
    var lines = function (n) { var h = ''; for (var i = 0; i < n; i++) h += ed('', '') + '<br>'; return h; };
    var blank = function (cols, n) { var h = ''; for (var i = 0; i < n; i++) { h += '<tr>'; for (var j = 0; j < cols; j++) h += '<td>&nbsp;</td>'; h += '</tr>'; } return h; };
    return head(6, 'بحث حالة (' + ed(tardy ? 'التأخير الصباحي' : v, '') + ')') +
      '<table class="nf">' +
      '<tr>' + L('اليوم') + '<td class="v">' + wd(t) + '</td>' + L('التاريخ') + '<td class="v">' + dmy(t) + '</td></tr>' +
      '<tr><th colspan="4">البيانـــات الأولية</th></tr>' +
      '<tr>' + L('اسم الطالب') + '<td class="v">' + e(o.student) + '</td>' + L('الجنسية') + '<td>' + ed(o.nat || natOf(o.qid), '') + '</td></tr>' +
      '<tr>' + L('الصف') + '<td class="v">' + grade(o.section) + '</td>' + L('الشعبة') + '<td class="v">' + e(o.section) + '</td></tr>' +
      '<tr>' + L('الرقم الشخصي') + '<td colspan="3" class="p0">' + qidBoxes(o.qid) + '</td></tr>' +
      '<tr>' + L('العمر') + W(ed('', '')) + L('تاريخ الميلاد') + W(ed(yearOf(o.qid) ? '     /     / ' + yearOf(o.qid) : '', '')) + '</tr>' +
      '<tr>' + L('عدد سنوات الرسوب') + W(ed('', '')) + L('الحالة الدراسية') + W(bx('مترفع') + ' &nbsp;&nbsp; ' + bx('باق')) + '</tr>' +
      '<tr>' + L('عدد مرات الفصل المؤقت') + W(ed('', '')) + L('عدد أيام الغياب') + W('( <span class="v">' + nAbs + '</span> ) &nbsp;' + bx('متقطع') + ' &nbsp; ' + bx('مستمر')) + '</tr>' +
      '<tr>' + L('المستوى الدراسي') + W(bx('ممتاز') + ' ' + bx('جيد جدا') + ' ' + bx('جيد') + ' ' + bx('مقبول') + ' ' + bx('ضعيف')) + L('الحالة الصحية') + W(bx('توجد') + ' &nbsp; ' + bx('لا توجد')) + '</tr>' +
      '<tr><th colspan="4">بيانات ولي الأمر</th></tr>' +
      '<tr>' + L('الاسم') + '<td class="v">' + e(gn) + '</td>' + L('صلة القرابة') + W(ed(rel, '')) + '</tr>' +
      '<tr>' + L('المهنة') + W(ed('', ''), 3) + '</tr>' +
      '<tr>' + L('الحالة الاجتماعية') + W(ed('', '')) + L('عنوان السكن') + W(ed('', '')) + '</tr>' +
      '<tr>' + L('رقم الجوال') + W('الأب: ' + ed('', '')) + W('الأم: ' + ed('', ''), 2) + '</tr>' +
      '<tr><th colspan="4">التكوين الأسري</th></tr>' +
      '<tr><td colspan="4">عدد الأفراد: ' + ed('', '') + ' &nbsp;&nbsp; ذكور: ' + ed('', '') + ' &nbsp;&nbsp; إناث: ' + ed('', '') + ' &nbsp;&nbsp; ترتيب الطالب بينهم: ' + ed('', '') + '</td></tr>' +
      '<tr><th colspan="4">ملخص تشخيص الحالة</th></tr>' +
      '<tr><th colspan="4" class="sub">وصف المشكلة</th></tr>' +
      '<tr><td colspan="4">' + gr([bx('غياب متكرر عن المدرسة'), bx('تأخر صباحي متكرر', tardy), bx('ضعف تحصيل دراسي'), bx('نوم داخل الصف', /النوم/.test(v)), bx('مشكلات مع المعلمين'), bx('ممارسة تنمر على الآخرين', /التنمر/.test(v))]) + 'أخرى: ' + ed('', '') + '</td></tr>' +
      '<tr><th colspan="4" class="sub">العبارات التشخيصية</th></tr>' +
      '<tr><th colspan="2" class="sub">الأسباب الذاتية</th><th colspan="2" class="sub">الأسباب البيئية</th></tr>' +
      '<tr><td colspan="2" style="vertical-align:top">' + [bx('تعرض الطالب لضغوط اجتماعية أثرت في توافقه المدرسي.'), bx('معاناة الطالب من مشكلات صحية أانعكست على أدائه المدرسي.'), bx('ضعف المهارات الاجتماعية ومهارات حل المشكلات.'), bx('وجود مشكلات تتعلق باستخدام التقنية أو الألعاب الإلكترونية.'), bx('ضعف مهارات تنظيم الوقت وإدارة الواجبات الدراسية.'), bx('أخرى: ' + ed('', ''))].join('<br>') + '</td>' +
      '<td colspan="2" style="vertical-align:top">' + [bx('وجود مؤشرات على اضطرابات أسرية .'), bx('وجود مشكلات في تكوين العلاقات مع الزملاء أو المعلمين.'), bx('ضعف المشاركة في الأنشطة المدرسية.'), bx('ضعف الإمكانيات المادية.'), bx('ضعف الاستجابة الأسرية والتعاون مع المدرسة.'), bx('أخرى: ' + ed('', ''))].join('<br>') + '</td></tr>' +
      '<tr><th colspan="4">أولاً: تحديد و وصف الاستجابات السلوكية غير السوية التي ستكون هدفاً للتغيير</th></tr>' +
      '<tr>' + L('التحديد') + W(bx('طبقة سلوكية واحـــــــــدة: ( ' + ed('', '') + ' )') + '<br>' + bx('طبقة سلوكية متعـددة: ( ' + ed('', '') + ' + ' + ed('', '') + ' )'), 3) + '</tr>' +
      '<tr>' + L('الوصف') + W(gr([bx('وجود سلوك ينبغي إلغاؤه: ' + ed('', '')), bx('وجود سلوك ينبغي إيجاده: ' + ed('', '')), bx('وجود سلوك ينبغي إنقاصه: ' + ed('', '')), bx('وجود سلوك ينبغي زيادته: ' + ed('', ''))]), 3) + '</tr>' +
      '</table>' +
      '<table class="nf">' +
      '<tr><th colspan="2">ثانياً: تحديد خط الأساس baseline</th></tr>' +
      '<tr><th class="sub">السلوك</th><th class="sub">التكرار المبدئي (خط الأساس)</th></tr>' + blank(2, 2) +
      '<tr><th colspan="2">ثالثاً: عملية التدخل العلاجي</th></tr>' +
      '<tr><th colspan="2" class="sub">أولاً: الأساليب الخاصة بإيجاد وزيادة السلوك</th></tr>' +
      '<tr><td colspan="2">1. التدعيــــــــم: ' + lines(1) + '2. تشكيـــل الاستجابـــة: ' + lines(1) + '3. تشكيل المثير (اطفاؤه): ' + lines(1) + '</td></tr>' +
      '<tr><th colspan="2" class="sub">ثانياً: الأساليب الخاصة بإلغاء وإنقاص السلوك</th></tr>' +
      '<tr><td colspan="2">1. العقاب التربــــوي: ' + lines(1) + '2. الانطفاء الإجرائي: ' + lines(1) + '3. الممارسة السلبية: ' + lines(1) + '</td></tr>' +
      '</table>' +
      '<table class="nf">' +
      '<tr><th colspan="3">متابعة الحالة</th></tr>' +
      '<tr><th class="sub" style="width:12%">المتابعة</th><th class="sub" style="width:18%">التاريخ</th><th class="sub">ما يلاحظ على الحالة</th></tr>' + blank(3, 6) +
      '<tr><th colspan="3">رابعا: تقييم نتائج التدخل العلاجي</th></tr>' +
      '<tr><th class="sub">السلوك</th><th class="sub">التكرار قبل التدخل</th><th class="sub">التكرار بعد التدخل</th></tr>' + blank(3, 2) +
      '<tr><td colspan="3" style="text-align:center">نسبة تحقيق الأهداف = <span style="display:inline-block;vertical-align:middle;text-align:center"><span style="display:block;border-bottom:1px solid #111;padding:0 6px">التكرار المبدئي ( &nbsp;&nbsp;&nbsp; ) – التكرار بعد التدخل( &nbsp;&nbsp;&nbsp; )</span><span style="display:block;padding:0 6px">التكرار المبدئــــي ( &nbsp;&nbsp;&nbsp; ) – التكرار المستهدف( &nbsp;&nbsp;&nbsp; )</span></span> X 100 =</td></tr>' +
      '<tr><th colspan="3">خامسا: رأي الاختصاصي الاجتماعي</th></tr>' +
      '<tr><td colspan="3">' + gr([bx('استمرار متابعة الحالة لمدة ' + ed('', '')), bx('إشراك الطالب في نشاط مدرسي مناسب.'), bx('تعزيز السلوك الإيجابي .'), bx('تحويل الطالب إلى الاختصاصي النفسي'), bx('تحويل الطالب إلى قسم حماية ورعاية الطلبة.'), bx('إغلاق الحالة بعد تحقق الأهداف واستقرار السلوك &nbsp; / &nbsp;&nbsp; / &nbsp;&nbsp; 202')]) + 'أخرى: ' + ed('', '') + '</td></tr>' +
      '</table>' +
      '<table class="nf"><tr><td class="l">اسم الاختصاصي الاجتماعي</td><td class="v">' + e(soc) + '</td><td class="l">التوقيع</td><td class="sgn">&nbsp;</td></tr></table>' + foot();
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
    // الإجراءات الوقائية المعتمدة في المدرسة (كما في الاستمارة الورقية) — قائمة قابلة للإضافة والتعديل
    var pre = ['توعية أولياء الأمور بسياسة إدارة السلوك', 'توعية وإرشاد بسياسة إدارة سلوك الطلبة ونشرها في الأقسام', 'المتابعة المستمرة بالمرور على الصفوف وملاحظة الطلبة'];
    return gHead(1, 'تعهـــد طــــالب (المشرف الإداري)') +
      '<table class="nf"><tr><th colspan="8">بيانات المخالفة</th></tr>' + L.map(function (x) {
        return '<tr><td class="l">نوع المخالفة</td><td class="v">' + (x ? e(x.v) : '') + '</td><td class="l">درجة المخالفة</td><td class="v">' + (x ? e(x.deg) : '') + '</td><td class="l">المخالفة للمرة</td><td class="v nw">( ' + (x ? ord(x.rep) : '&nbsp;&nbsp;&nbsp;') + ' )</td><td class="l">تاريخ المخالفة</td><td class="v nw">' + (x ? dmy(x.date) : '') + '</td></tr>';
      }).join('') + '</table>' +
      '<div class="nf-box"><b>أتعهد أنا الطالب: <span class="v">' + e(o.student) + '</span></b><br>بالالتزام الكامل بلوائح ونظم المدرسة وعدم تكرار المخالفات التي سبق وقمت بها.<br>وفي حالة تكرار ذلك سوف تقوم إدارة المدرسة باتخاذ الإجراءات المتبعة حسب اللوائح والقوانين الخاصة بسياسة إدارة سلوك الطلبة 2026 بوزارة التربية والتعليم والتعليم العالي.</div>' +
      dayRow(today()) + '<table class="nf">' + stuRows(o, false) + '</table>' +
      '<table class="nf"><tr><th colspan="3">الإجراءات الوقائية التي تم اتخاذها مع الطالب</th></tr>' +
      '<tr><td colspan="3" style="text-align:right">' + alist(pre, null, 3) + '</td></tr>' +
      '<tr><td class="l">توقيع الطالب</td><td class="l">رقم جوال ولي الأمر</td><td class="l">توقيع المشرف الإداري</td></tr>' +
      '<tr><td class="sgn sgs" data-who="' + e(o.student) + '">&nbsp;</td><td class="v" dir="ltr" style="text-align:center">' + e(o.phone || '') + '</td><td class="v sgn2" style="text-align:center">' + e(sup) + '</td></tr>' +
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
      '<tr><td class="l">الإجراءات الأولية التي تمت</td><td colspan="3" style="height:5em;vertical-align:top">' + alist(done ? done.split(' • ') : pre, o) + '</td></tr>' +
      '<tr><td colspan="4">إخطار ولي الأمر بالواقعة والإجراء التالي لما بعد إثبات الواقعة: ' + bx('تم', !!(o.doc && o.doc.supervisor && o.doc.supervisor.contact)) + ' &nbsp;&nbsp; ' + bx('لم يتم') + '</td></tr>' +
      '<tr><td class="l" colspan="2">اسم الطالب</td><td class="l" colspan="2">التوقيع</td></tr><tr><td class="v" colspan="2">' + e(o.student) + '</td><td colspan="2" class="sgn sgs" data-who="' + e(o.student) + '">&nbsp;</td></tr></table>' +
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
      '<tr><td class="l">توقيع الطالب</td><td class="l">توقيع منسق شؤون الطلاب</td></tr><tr><td class="sgn sgs" data-who="' + e(o.student) + '">&nbsp;</td><td class="v sgn2" style="text-align:center">' + e(P.coord) + '</td></tr>' +
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
      '<tr><td class="l">توقيع الطالب</td><td class="l">توقيع منسق شؤون الطلاب</td></tr><tr><td class="sgn sgs" data-who="' + e(o.student) + '">&nbsp;</td><td class="v sgn2" style="text-align:center">' + e(P.coord) + '</td></tr>' +
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
      '<tr><td class="l">الإجراءات العلاجية<br><small>(مرفق)</small></td><td style="height:6em;vertical-align:top">' + alist([d.action, d2.date && !/^سجل سابق/.test(d2.notes || '') ? d2.action + (d2.notes ? ': ' + d2.notes : '') : ''], o) + '</td></tr>' +
      '<tr><td class="l">التوصيات لفريق إدارة سلوك الطلبة</td><td style="height:6em;vertical-align:top">' + alist([], o) + '</td></tr></table>' +
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
      '<tr><td class="l">التوقيع</td><td colspan="5" class="sgn sgs" data-gl="ولي الأمر">&nbsp;</td></tr>' +
      '<tr><td class="l">منسق شؤون الطلاب</td><td class="v sgn2" colspan="5">' + e(P.coord) + '</td></tr>' +
      teamSocs(o).map(function (n) { return '<tr><td class="l">الاختصاصي الاجتماعي</td><td class="v sgn2" colspan="5">' + e(n) + '</td></tr>'; }).join('') +
      '<tr><td class="l">الاختصاصي النفسي</td><td class="v sgn2" colspan="5">' + e(psy) + '</td></tr>' +
      '<tr><td class="l">المشرف الإداري</td><td class="v sgn2" colspan="5">' + e(teamSup()) + '</td></tr>' +
      '<tr><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v sgn2 sgvp" colspan="5">' + e(P.vp) + '</td></tr>' +
      '<tr><td class="l">يعتمد / مدير المدرسة</td><td class="v sgn2" colspan="5">' + e(P.pr) + '</td></tr></table>' +
      '<div class="nf-note">❖ في حال استدعاء ولي الأمر أكثر من مره ولم يحضر يتم إرسال رسالة نصية لولي الأمر بقرار فريق إدارة سلوك الطلبة</div>' + gFoot();
  }
  /* أعضاء ثابتون في كل اجتماعات الفريق: الأخصائية ياسمين ناصر (مع أخصائية الشعبة إن اختلفت) والمشرفة الإدارية مرام القديري */
  function stName(p, d) { var u = (N.S.boot.staff || []).filter(function (x) { return String(x.name || '').indexOf(p) === 0; })[0]; return (u && u.name) || d; }
  function teamSocs(o) { var y = stName('ياسمين', 'ياسمين ناصر'), L = []; [o && o.social, y].forEach(function (n) { if (n && L.indexOf(n) < 0) L.push(n); }); return L; }
  function teamSup() { return stName('مرام', 'مرام القديري'); }
  function teamMembers(o) {
    var P = people(), st = N.S.boot.staff || [], one = function (r) { return (st.filter(function (u) { return u.role === r; })[0] || {}).name || ''; };
    return [['مدير المدرسة', P.pr], ['نائب المدير للشؤون الإدارية وشؤون الطلاب', P.vp], ['نائب المدير للشؤون الأكاديمية وشؤون الطلاب (عند الحاجة)', 'آسيا الذبياني'], ['منسق شؤون الطلبة', P.coord], ['المعلم (في حال ارتباطه بالمشكلة)', '']].concat(teamSocs(o).map(function (n) { return ['الاختصاصي الاجتماعي', n]; })).concat([['الاختصاصي النفسي', one('psych')], ['المشرف الإداري', teamSup()]]);
  }
  /* عرض المشكلة تلقائيًا حسب نوع الحالة (قابل للتعديل) */
  function probText(o) {
    if (isAbs(o)) { var n = Math.max(uRecs(o).length, Number(o.n) || 0); return 'تجاوزت الطالبة الحد المسموح به للغياب بدون عذر وفق سياسة الغياب 2026، إذ بلغ عدد أيام غيابها بدون عذر (' + n + ') ' + (n > 2 && n < 11 ? 'أيام' : 'يومًا') + '، رغم الإجراءات العلاجية السابقة.'; }
    if (/^التأخير الصباحي/.test(o.violation || '')) return 'تكرار التأخير الصباحي للطالبة للمرة ' + ord(o.rep) + '، وتجاوزها الحد المسموح به وفق سياسة إدارة سلوك الطلبة 2026، رغم الإجراءات العلاجية السابقة.';
    return 'تكرار الطالبة مخالفة «' + (o.violation || '') + '» للمرة ' + ord(o.rep) + '، رغم الإجراءات العلاجية السابقة وفق سياسة إدارة سلوك الطلبة 2026.';
  }
  /* نموذج (7) محضر اجتماع الفريق لمجموعة من الطلاب */
  function g7(o) {
    var M = teamMembers(o);
    return gHead(7, 'محضر اجتماع فريق إدارة سلوك الطلبة لمجموعة من الطلاب') +
      '<table class="nf"><tr><td class="l">اليوم</td><td class="l">التاريخ</td><td class="l">الوقت</td><td class="l">المكان</td><td class="l">عدد الحضور</td><td class="l">عدد الغياب</td><td class="l">رقم الاجتماع</td></tr><tr><td class="v">' + wd(today()) + '</td><td class="v">' + dmy(today()) + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td></tr></table>' +
      '<table class="nf"><tr><td class="l">م</td><td class="l">اسم الطالب</td><td class="l">الصف</td><td class="l">المخالفة</td></tr><tr><td>1</td><td class="v">' + e(o.student) + '</td><td class="v">' + e(o.section) + '</td><td class="v">' + e(vName(o)) + '</td></tr>' +
      [2, 3, 4].map(function (i) { return '<tr><td>' + i + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td><td>' + ed('', '') + '</td></tr>'; }).join('') + '</table>' +
      '<table class="nf"><tr><th colspan="3">أعضاء فريق إدارة سلوك الطلبة</th></tr><tr><td class="l">م</td><td class="l">الاسم</td><td class="l">المسمى الوظيفي</td></tr>' + M.map(function (m, i) { return '<tr><td>' + (i + 1) + '</td><td class="v">' + (m[1] ? e(m[1]) : ed('', '')) + '</td><td>' + m[0] + '</td></tr>'; }).join('') + '</table>' +
      '<table class="nf"><tr><th>عرض المشكلة</th></tr><tr><td style="height:3em">' + ed(probText(o), '') + '</td></tr><tr><th>الإجراءات العلاجية السابقة</th></tr><tr><td style="text-align:right">' + alist(actDone(o).split(' • '), o) + '</td></tr><tr><th>القرارات التي اتخذت</th></tr><tr><td style="text-align:right">' + alist(teamActs(o), o) + '</td></tr></table>' +
      '<table class="nf"><tr><th colspan="3">توقيع أعضاء الفريق</th></tr><tr><td class="l">م</td><td class="l">الاسم</td><td class="l">التوقيع</td></tr>' + M.filter(function (m) { return m[1]; }).concat([['', '']]).map(function (m, i) { return '<tr><td>' + (i + 1) + '</td><td class="v">' + (m[1] ? e(m[1]) : ed('', '')) + '</td><td class="sgn">&nbsp;</td></tr>'; }).join('') + '</table>' +
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
      '<table class="nf"><tr><th>قرار أعضاء الفريق</th></tr><tr><td style="min-height:4em;text-align:right">' + alist(dec, o) + '</td></tr></table>' +
      '<table class="nf"><tr><th colspan="4">توقيع أعضاء الفريق</th></tr><tr><td class="l">م</td><td class="l">الاسم</td><td class="l">المسمى الوظيفي</td><td class="l">التوقيع</td></tr>' +
      teamMembers(o).filter(function (m) { return m[1]; }).concat([['', ''], ['', '']]).slice(0, 9).map(function (m, i) { return '<tr><td>' + (i + 1) + '</td><td class="v">' + (m[1] ? e(m[1]) : ed('', '')) + '</td><td>' + (m[0] || ed('', '')) + '</td><td class="sgn">&nbsp;</td></tr>'; }).join('') + '</table>' +
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
  /* استمارات سياسة تعزيز انضباط حضور الطلبة (الإنذارات وقرارات عدم التقديم) — مربوطة بأيام السياسة 3.4.1.2 والحدود في 3.4.1.3
     الصفوف حتى الحادي عشر: إنذار 3،5 (منتصف الأول 5) • قرار 6 • إنذار 7،8 (نهاية الأول 8) • قرار 9 • إنذار 10،11 (منتصف الثاني 11) • قرار 12 • إنذار 13،14 (نهاية الثاني 15) • قرار 16
     الصف الثاني عشر (لا منتصف فصل): إنذار 3،5،7،8 (نهاية الأول 8) • قرار 9 • إنذار 10،11،13،14 (نهاية الثاني 15) • قرار 16 */
  var EXM = { m1: ['منتصف الفصل الدراسي الأول', 'خمسة أيام'], e1: ['نهاية الفصل الدراسي الأول', 'ثمانية أيام'], m2: ['منتصف الفصل الدراسي الثاني', 'أحد عشر يومًا'], e2: ['نهاية الفصل الدراسي الثاني', 'خمسة عشر يومًا'] };
  function absSpec(o) {
    if (!o || o.kind !== 'U') return null;
    var n = Number(o.n) || 0, g12 = String(o.section || '').split('-')[0] === '12';
    var W = g12 ? { 3: 'e1', 5: 'e1', 7: 'e1', 8: 'e1', 10: 'e2', 11: 'e2', 13: 'e2', 14: 'e2', 15: 'e2' } : { 3: 'm1', 5: 'm1', 7: 'e1', 8: 'e1', 10: 'm2', 11: 'm2', 13: 'e2', 14: 'e2', 15: 'e2' };
    var D = g12 ? { 9: ['e1', 'e2'], 16: ['r1', ''] } : { 6: ['m1', 'e1'], 9: ['e1', 'm2'], 12: ['m2', 'e2'], 16: ['r1', ''] };
    if (W[n]) return { type: 'w', n: n, ex: W[n], fin: n === 15 }; // 15 يومًا: «إنذار نهائي» في ملحقات السياسة
    if (D[n]) return { type: 'd', n: n, ex: D[n][0], next: D[n][1] };
    return null;
  }
  function daysTxt(n) { return n + (n >= 3 && n <= 10 ? ' أيام' : ' يومًا'); }
  function wA(o) {
    var P = people(), S = absSpec(o) || { type: 'w', n: Number(o.n) || 0, ex: 'm1' };
    var recs = uRecs(o).slice(0, S.n);
    var dots = function (v) { return v ? '<span class="v">' + e(v) + '</span>' : '..............................'; };
    var row = function (i) { var x = recs[i]; return '<td>' + (i + 1) + '</td><td class="v">' + (x ? wd(x.date) : '') + '</td><td class="v">' + (x ? dmy(x.date) : '') + '</td>'; };
    var tbl = S.n <= 3 ? '<table class="nf nf-w3t"><tr><td class="l">م</td><td class="l">اليوم</td><td class="l">التاريخ</td></tr>' + [0, 1, 2].map(function (i) { return '<tr>' + row(i) + '</tr>'; }).join('') + '</table>'
      : '<table class="nf nf-w3t nf-w6"><tr><td class="l">م</td><td class="l">اليوم</td><td class="l">التاريخ</td><td class="l">م</td><td class="l">اليوم</td><td class="l">التاريخ</td></tr>' +
        (function () { // ترتيب جدول الملحقات الرسمي: (1،4) (2،5) (3،6) ثم (7،8) (9،10) …
          var pr = [[0, 3], [1, 4], [2, 5]]; for (var m = 6; m < S.n; m += 2) pr.push([m, m + 1]);
          return pr.map(function (q) { return '<tr>' + row(q[0]) + (q[1] < S.n ? row(q[1]) : '<td class="nf-gr" colspan="3"></td>') + '</tr>'; }).join('');
        })() + '</table>';
    var head = '<div class="nf-w3">' + (S.type === 'w' ? '<div class="nf-w3h">استمارات سياسة تعزيز انضباط حضور الطلبة:</div>' : '') +
      '<div class="nf-w3box">' + (S.type === 'w' ? (S.fin ? 'إنذار نهائي<br>(بعدم تقديم اختبار (' + EXM.e2[0] + '))' : 'إنذار<br>غياب بدون عذر لعدد (' + daysTxt(S.n) + ')') : 'إبلاغ بعدم تقديم<br>اختبار (' + (S.ex === 'r1' ? 'الدور الأول' : EXM[S.ex][0]) + ')') + '</div>' +
      '<p>التاريخ: <span class="v">' + dmy(today()) + '</span> م</p>' +
      '<p>الفاضل ولي أمر الطالب: ' + dots(o.student) + ' &nbsp; الصف: ' + dots(grade(o.section)) + ' &nbsp; الشعبة: ' + dots(o.section) + '</p>' +
      '<p>نفيدكم علمًا بأن عدد أيام غياب ابنكم/ابنتكم عن المدرسة بدون عذر قد وصل مدة (' + daysTxt(S.n) + ') بتاريخ:</p>' + tbl;
    var body;
    if (S.type === 'w') {
      var X = EXM[S.ex];
      body = '<p style="text-align:justify">وكما تعلمون بأن تكرار الغياب يؤثر سلبًا على مستوى التحصيل الأكاديمي للطالب، وفي حال تجاوز المدة المسموح بها بالغياب سيتم تطبيق القرار الوزاري رقم (23) لسنة 2014م والذي يقضي: <u>بعدم ' + (S.n >= 10 ? 'تقديم' : 'دخول') + ' الطالب المتغيب بدون عذر اختبار (' + X[0] + ') إذا تجاوز مدة غيابه بدون عذر مقبول (' + X[1] + ' تمدرس).</u></p>' +
        '<div class="nf-w3s"><u>إقرار وتعهد</u></div>' +
        '<p>أتعهد أنا ولي أمر الطالب: ' + dots(o.student) + ' &nbsp; الصف: ' + dots(grade(o.section)) + ' &nbsp; الشعبة: ' + dots(o.section) + '</p>' +
        '<p style="text-align:justify">بعدم تجاوز الطالب أيام الغياب المحددة (' + X[1] + ' تمدرس) والتي تؤدي إلى تطبيق القرار الوزاري رقم (23) لسنة 2014م بعدم ' + (S.n === 10 || S.n === 11 ? 'دخول' : 'تقديم') + ' اختبار (' + X[0] + ') في حالة الغياب بدون عذر مقبول للأيام المحددة في القرار.</p>';
    } else if (S.ex === 'r1') {
      body = '<p style="text-align:justify">وبذلك قد بلغ الطالب: ' + daysTxt(S.n) + ' بدون عذر مقبول رغم الإنذارات السابقة مما يمنعه من دخول اختبار الدور الأول، وعليه فقد تقرر:</p>' +
        '<p style="text-align:justify">عدم السماح للطالب من دخول اختبار الدور الأول وتطبيق القرار الوزاري رقم (23) لسنة 2014م بعدم تقديم الطالب المتغيب بدون عذر اختبار (نهاية العام الدراسي – الدور الأول).</p>';
    } else {
      body = '<p style="text-align:justify">وبذلك قد بلغ نصاب غياب الطالب: ' + daysTxt(S.n) + ' بدون عذر مقبول بالرغم من إنذاره وهذا الحد يمنعه من دخول اختبار (' + EXM[S.ex][0] + ')، وعليه فقد تقرر:</p>' +
        '<ul class="nf-w3l"><li>عدم السماح للطالب من دخول اختبار ' + EXM[S.ex][0] + '.</li><li>نوصي بمساعدة وتحفيز الطالب على الحضور والانتظام بالدراسة ليتسنى له دخول اختبار (' + EXM[S.next][0] + ').</li></ul>';
    }
    return head + body +
      '<table class="nf"><tr><td class="l">الطالب</td><td class="v" colspan="3">' + e(o.student) + '</td></tr>' +
      '<tr><td class="l">توقيع ولي الأمر</td><td class="sgn sgs" data-gl="ولي الأمر">&nbsp;</td><td>اليوم: ..............</td><td>التاريخ: &nbsp;&nbsp; / &nbsp;&nbsp; /</td></tr>' +
      '<tr><td class="l">منسق شؤون الطلبة</td><td class="v sgn2">' + e(P.coord) + '</td><td class="l">نائب المدير للشؤون الإدارية وشؤون الطلاب</td><td class="v sgn2">' + e(P.vp) + '</td></tr>' +
      '<tr><td class="l">مدير المدرسة</td><td class="v sgn2" colspan="3">' + e(P.pr) + '</td></tr></table>' +
      '<div class="nf-w3n"><b><u>ملاحظة:</u></b> في حال رفض ولي الأمر <u>التوقيع أو الحضور</u> يتم اعتماده من قبل كل من المشرف الإداري ومنسق شؤون الطلبة والنائب الإداري ومدير المدرسة وإرسال <u>رسالة نصية لولي الأمر</u> تثبت ذلك.</div></div>';
  }
  function g9(o) {
    var P = people(), I = eligInfo(o);
    var recs = uRecs(o);
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
      '<tr><td class="l">اسم ولي الأمر</td><td class="v">' + e(String(o.gName || '').replace(/\s*\([^)]*\)\s*$/, '')) + '</td><td class="l">التوقيع</td><td class="sgn sgs" data-gl="ولي الأمر">&nbsp;</td></tr>' +
      '<tr><td class="l">طريقة الإخطار</td><td colspan="3">' + bx('حضوريًا') + ' &nbsp; ' + bx('هاتفيًا') + ' &nbsp; ' + bx('رسالة نصية') + ' &nbsp; ' + bx('لم يحضر — أُرسلت رسالة نصية بالقرار') + '</td></tr></table>' +
      '<table class="nf"><tr><th colspan="3">أعضاء فريق إدارة سلوك الطلبة</th></tr><tr><td class="l">المسمى الوظيفي</td><td class="l">الاسم</td><td class="l">التوقيع</td></tr>' +
      [['منسق شؤون الطلبة', P.coord]].concat(teamSocs(o).map(function (n) { return ['الاختصاصي الاجتماعي', n]; })).concat([['المشرف الإداري', teamSup()], ['نائب المدير للشؤون الإدارية وشؤون الطلاب', P.vp]]).map(function (m) { return '<tr><td>' + m[0] + '</td><td class="v">' + e(m[1]) + '</td><td class="sgn">&nbsp;</td></tr>'; }).join('') + '</table>' +
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
    g1: { title: 'تعهد طالب', no: 'رقم 1', st: 'supervisor', roles: ['supervisor'], when: function (o) { return reached(o, 'supervisor') && (/تعهد\s*(خطي\s*(\(\d\)\s*)?للطالب|الطالب\s*خطيا)|تنبيه خطي للطالب/.test(txt(o, 'supervisor'))); }, build: g1 },
    g2: { title: 'إثبات واقعة', no: 'رقم 2', st: 'coordinator', roles: ['coordinator'], when: function (o) { return reached(o, 'coordinator') && !isAbs(o); }, build: g2 },
    g3: { title: 'فصل داخلي مع تعهد', no: 'رقم 3', st: 'coordinator', roles: ['coordinator'], when: function (o) { return reached(o, 'coordinator') && /فصل داخلي/.test(txt(o, 'coordinator') + txt(o, 'admin')); }, build: g3 },
    g4: { title: 'فصل خارجي مع تعهد', no: 'رقم 4', st: 'coordinator', roles: ['coordinator'], when: function (o) { return reached(o, 'coordinator') && /فصل خارجي|من الحافلة|فصل الطالب من الدوام/.test(txt(o, 'coordinator') + txt(o, 'admin')); }, build: g4 },
    g5s: { title: 'تقرير نهائي عن حالة طالب', no: 'رقم 5', st: 'social', roles: ['social'], when: function (o) { return reached(o, 'social'); }, build: g5 },
    g5p: { title: 'تقرير نهائي عن حالة طالب', no: 'رقم 5', st: 'psych', roles: ['psych'], when: function (o) { return reached(o, 'psych'); }, build: g5 },
    g6: { title: 'مقابلة ولي أمر مع الفريق', no: 'رقم 6', st: 'admin', roles: ['admin'], when: function (o) { return /فريق إدارة سلوك|فريق إدارة السلوك/.test(txt(o, 'coordinator') + txt(o, 'admin')) && (reached(o, 'coordinator') || reached(o, 'admin')); }, build: g6 },
    g7: { title: 'محضر اجتماع الفريق لمجموعة', no: 'رقم 7', st: 'admin', roles: ['admin'], when: function (o) { return GUIDE.g6.when(o); }, build: g7 },
    wA: { title: 'استمارة الغياب (إنذار / إبلاغ بعدم تقديم)', btnT: function (o) { var S = absSpec(o); return S ? (S.type === 'w' ? (S.fin ? 'إنذار نهائي ' : 'إنذار غياب ') + daysTxt(S.n) : 'إبلاغ بعدم تقديم ' + (S.ex === 'r1' ? 'الدور الأول' : EXM[S.ex][0])) : ''; }, no: 'سياسة الحضور', st: 'supervisor', roles: ['supervisor', 'coordinator', 'admin'], absOnly: true, when: function (o) { return !!absSpec(o); }, build: wA },
    g9: { title: 'قرار عدم الأهلية لدخول الاختبار', no: 'سياسة الغياب', st: 'admin', roles: [], absOnly: true, when: function (o) { var t = txt(o, 'admin') + txt(o, 'coordinator'); return /عدم أهلية|بعدم أهلية|إنذار نهائي/.test(t + (o.elig || '')) && (reached(o, 'admin') || reached(o, 'coordinator')); }, build: g9 },
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
    f10: { title: 'استمارة تحويل حالة سلوكية', btn: 'التحويل السلوكي', no: 10, build: function (o) { return f10(o); } },
    f9: { title: 'استمارة تحويل حالة غياب', no: 9, build: function (o) { return f9(o); } },
    f6: { title: 'بحث حالة', btn: 'دراسة الحالة (بحث حالة)', no: 6, pages: 2, build: function (o) { return f6(o); } },
    f5c: { title: 'استمارة جلسة فردية', no: 5, build: function (o) { return f5(o, false); } },
    f5a: { title: 'استمارة جلسة فردية', no: 5, build: function (o) { return f5(o, true); } }
  };
  Object.keys(GUIDE).forEach(function (id) { DEF[id] = { title: GUIDE[id].title, no: GUIDE[id].no + ' — دليل الفريق', build: GUIDE[id].build, st: GUIDE[id].st, btnT: GUIDE[id].btnT }; });
  function available(kind, o) {
    var r = me().role, out = [];
    if (!o || !o.req) return out;
    var staff = ['supervisor', 'coordinator', 'social', 'admin'].indexOf(r) >= 0;
    if (kind === 'case') {
      // التحويل السلوكي: حين تحيل السياسة الحالة إلى الاختصاصي، أو عند وصول مخالفات البند إلى 3
      // (ملاحظة نموذج 1 في الدليل: «يتم توقيع الطالب في حال وصول المخالفات لعدد 3 مخالفات وبعدها يتم تحويل الطالب مع الاستمارة واستمارة التحويل»)
      // التأخير الصباحي (مادة 3.4.2.2): التحويل فقط حيث ينص الجدول على الإحالة للاختصاصي (التكرار 3 و4 و5)
      var tdy = /^(التأخير الصباحي|التأخر عن الطابور)/.test(o.violation || '');
      var toSpec = tdy ? (o.req.social || o.req.psych || /الإحالة إلى الاختصاصي|الإحالة إلى الأخصائي/.test(txt(o, 'supervisor') + txt(o, 'coordinator'))) : (o.req.social || o.req.psych || Number(o.rep) >= 3);
      if (staff && toSpec && (r !== 'supervisor' || reached(o, 'supervisor'))) out.push('f10');
      if (o.req.social && (r === 'social' || r === 'admin')) out.push('f5c');
      // التأخير الصباحي: دراسة الحالة في المرة السادسة (نموذج 6 «بحث حالة») — حيث نص الأخصائية «دراسة حالة»
      if (tdy && o.req.social && /دراسة حالة/.test(txt(o, 'social')) && (r === 'social' || r === 'admin')) out.push('f6');
    } else {
      if (o.kind === 'U' && o.req.social && staff) out.push('f9');
      if (o.req.social && (r === 'social' || r === 'admin')) out.push('f5a');
    }
    return out;
  }
  /* كل الاستمارات الورقية المطلوبة لحالة (بغض النظر عن صفة المستخدمة) — للتقرير الشهري */
  function required(kind, o) {
    var out = [];
    if (!o) return out;
    Object.keys(GUIDE).forEach(function (id) {
      var g = GUIDE[id];
      if (kind === 'abs' && o.kind !== 'U') return;
      if (kind === 'abs' && id === 'g2') return;
      if (kind !== 'abs' && g.absOnly) return;
      if (id === 'g5p' && out.indexOf('g5s') >= 0 && !reached(o, 'psych')) return;
      try { if (g.when(o)) out.push(id); } catch (err) {}
    });
    if (o.req) {
      if (kind === 'case') {
        var tdy = /^(التأخير الصباحي|التأخر عن الطابور)/.test(o.violation || '');
        var toSpec = tdy ? (o.req.social || o.req.psych || /الإحالة إلى الاختصاصي|الإحالة إلى الأخصائي/.test(txt(o, 'supervisor') + txt(o, 'coordinator'))) : (o.req.social || o.req.psych || Number(o.rep) >= 3);
        if (toSpec && reached(o, 'supervisor')) out.push('f10');
        if (o.req.social && reached(o, 'social')) out.push('f5c');
        if (tdy && o.req.social && /دراسة حالة/.test(txt(o, 'social'))) out.push('f6');
      } else {
        if (o.kind === 'U' && o.req.social) out.push('f9');
        if (o.req.social && reached(o, 'social')) out.push('f5a');
      }
    }
    return out.map(function (id) { return { id: id, key: [id, kind, o.id].join('|'), title: (DEF[id] || {}).title || id }; });
  }
  function buttons(kind, o) {
    var ids = guideFor(kind, o).concat(available(kind, o));
    if (!ids.length) return '';
    var lines = ids.map(function (id) { var L = ((N.S.boot && N.S.boot.approvals) || []).filter(function (a) { return a.key === [id, kind, o.id].join('|'); }); return L.length ? trail(L, true).replace('<div class="amsg">', '<div class="amsg"><b>' + e(DEF[id].title) + ':</b> ') : ''; }).join('');
    return '<div class="nf-btns">' + ids.map(function (id) {
      var stg = DEF[id].st, flash = stg && me().role === stg && (myTurn(o, stg) || (stg === 'admin' && (myTurn(o, 'coordinator') || myTurn(o, 'admin')))) ? ' flash' : '';
      return '<button type="button" class="nf-pbtn' + flash + '" data-nform="' + id + '" data-nk="' + kind + '" data-nid="' + e(o.id) + '">🖨 ' + (id === 'g1' ? 'التعهد (نموذج ' + DEF[id].no + ')' : DEF[id].btnT ? DEF[id].btnT(o) : (DEF[id].btn || DEF[id].title) + ' (نموذج ' + DEF[id].no + ')') + '</button>';
    }).join('') + '</div>' + (lines ? '<div class="nf-aplines">' + lines + '</div>' : '');
  }

  /* ---------- المعاينة والطباعة والإرسال ---------- */
  function find(kind, id) {
    var b = N.S.boot;
    if (kind === 'case') return (b.cases || []).filter(function (c) { return c.id === id; })[0];
    return ((b.abs && b.abs.records) || []).filter(function (a) { return a.id === id; })[0];
  }
  function fit(paper) { // ورقة واحدة (أو عدد صفحات الاستمارة الأصلية): نصغّر الخط حتى تدخل في A4
    var maxH = 277 * 3.7795 * ((CUR && CUR.d && CUR.d.pages) || 1);
    var fs = 15;
    paper.style.fontSize = fs + 'px';
    while (paper.scrollHeight > maxH && fs > 8.2) { fs -= 0.3; paper.style.fontSize = fs + 'px'; }
  }
  /* ---------- حفظ تعبئة الاستمارة (المربعات والخانات) لتبقى كلما فُتحت ---------- */
  function fsKey() { return CUR ? [CUR.id, CUR.kind, CUR.o.id].join('|') : ''; }
  function fsGet(paper) {
    return JSON.stringify({ cb: [].map.call(paper.querySelectorAll('.nf-cb'), function (x) { return x.classList.contains('on') ? 1 : 0; }),
      al: [].map.call(paper.querySelectorAll('.nf-al'), function (x) { return x.querySelectorAll('.nf-alr').length; }),
      ed: [].map.call(paper.querySelectorAll('.nf-ed'), function (x) { return x.innerText.replace(/\u00a0/g, ' ').trim(); }) });
  }
  function fsApply(paper, raw) {
    var d; try { d = JSON.parse(raw); } catch (e) { return false; }
    if (!d) return false;
    var als = paper.querySelectorAll('.nf-al');
    if ((d.al || []).length === als.length) [].forEach.call(als, function (al, i) {
      var rows = al.querySelectorAll('.nf-alr'), want = d.al[i] || 1;
      for (var k = rows.length; k < want; k++) al.querySelector('.nf-alc').insertAdjacentHTML('beforebegin', alRow(''));
      for (k = rows.length - 1; k >= want; k--) rows[k].remove();
    });
    var cbs = paper.querySelectorAll('.nf-cb'), eds = paper.querySelectorAll('.nf-ed');
    if ((d.cb || []).length === cbs.length) [].forEach.call(cbs, function (x, i) { var on = !!d.cb[i]; x.classList.toggle('on', on); x.textContent = on ? '☑' : '☐'; x.setAttribute('aria-checked', on); });
    if ((d.ed || []).length === eds.length) [].forEach.call(eds, function (x, i) { x.textContent = d.ed[i] || ''; });
    fit(paper); return true;
  }
  var fsTimer = null, fsLast = '', fsDirty = false;
  function fsSave(now) {
    var paper = document.getElementById('nf-paper'); if (!paper || !CUR) return;
    var key = fsKey(), data = fsGet(paper);
    if (data === fsLast) return;
    fsDirty = true;
    try { localStorage.setItem('nf:' + key, data); } catch (e) {}
    clearTimeout(fsTimer);
    var go = function () { fsLast = data; N.api('saveFormState', { key: key, data: data }, true).catch(function () { fsLast = ''; }); };
    if (now) go(); else fsTimer = setTimeout(go, 1500);
  }

  function socOf(sec) { var u = (N.S.boot.staff || []).filter(function (x) { return x.role === 'social' && (x.sections || []).indexOf(sec) >= 0; })[0]; return u ? u.name : ''; }
  /* خانات توقيع شخص في الاستمارة: الخانة التي تحمل اسمه (والنائبة الإدارية أيضًا خانة sgvp) */
  function nameCells(paper, name) {
    var n = String(name || '').trim(); if (!n) return [];
    var vp = n === String(F().adminVP || '').trim();
    return [].filter.call(paper.querySelectorAll('td.sgvp, td.sgn2, td.sgn, .nf-sig td, .nf-appr, td.v'), function (c) {
      if (vp && c.classList.contains('sgvp')) return true;
      return !c.classList.contains('l') && (c.textContent || '').replace(/✍ [^✍]*$/, '').indexOf(n) >= 0;
    }).filter(function (c, i, a) { return !a.some(function (o) { return o !== c && o.contains(c); }); });
  }
  function vpCells(paper) { return nameCells(paper, F().adminVP); }
  function apprList(key) { return ((N.S.boot && N.S.boot.approvals) || []).filter(function (a) { return a.key === key; }); }
  function apprFor(key) { var l = apprList(key); return l.filter(function (a) { return a.to === me().name && a.status === 'بانتظار الاعتماد'; })[0] || l[0] || null; }
  var dt = function (x) { return String(x || '').replace('T', ' ').slice(0, 16); };
  /* مسار الاعتماد (كما في سنابل): ✔ المرسِلة ← ✔/⏳ كل جهة ← ◻ الجهات التالية */
  function trail(L, compact) {
    L = (L || []).slice().sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    if (!L.length) return '';
    var by = {}; L.forEach(function (a) { by[a.to] = a; });
    var order = []; L.forEach(function (a) { if (order.indexOf(a.to) < 0) order.push(a.to); });
    var last = by[order[order.length - 1]];
    var nxt = String((last && last.next) || '').split('،').filter(function (n) { return n && order.indexOf(n) < 0; });
    var fwdNow = last && last.status === 'معتمدة'; // اعتُمدت الخطوة الأخيرة وأُحيلت تلقائيًا للتالية
    var st = function (cls, ic, who, sub) { return '<span class="atr ' + cls + '"><i>' + ic + '</i><b>' + e(who) + '</b><small>' + sub + '</small></span>'; };
    var out = [st('ok', '✔', 'أ. ' + L[0].by, 'أرسلت واعتمدت — ' + e(dt(L[0].at)))];
    order.forEach(function (n) { var a = by[n]; out.push(a.status === 'معتمدة' ? st('ok', '✔', 'أ. ' + (a.approver || n), 'تم الاعتماد — ' + e(dt(a.approvedAt))) : st('wait', '⏳', 'أ. ' + n, 'قيد الاعتماد منذ ' + e(dt(a.at)) + (a.remindedAt ? ' • ذُكّرت ' + e(dt(a.remindedAt)) : ''))); });
    nxt.forEach(function (n, i) { out.push(fwdNow && !i ? st('wait', '⏳', 'أ. ' + n, 'قيد الاعتماد') : st('next', '◻', 'أ. ' + n, 'تصلها بعد الاعتماد')); });
    var done = order.every(function (n) { return by[n].status === 'معتمدة'; }) && !nxt.length;
    // جملة توضح أين صار النموذج الآن
    var okN = order.filter(function (n) { return by[n].status === 'معتمدة'; }).map(function (n) { return 'أ. ' + (by[n].approver || n); });
    var pend = order.filter(function (n) { return by[n].status !== 'معتمدة'; }).concat(fwdNow && nxt[0] ? [nxt[0]] : [])[0];
    var lbl = function (n) { var u = (N.S.boot.staff || []).filter(function (x) { return x.name === n; })[0]; var r = n === F().adminVP ? 'النائبة الإدارية' : u ? ({ coordinator: 'شؤون الطالبات', social: 'الأخصائية الاجتماعية', psych: 'الأخصائية النفسية', supervisor: 'المشرفة', admin: 'الإدارة' })[u.role] : ''; return r ? r + ' (أ. ' + n + ')' : 'أ. ' + n; };
    var msg = done ? '✔ اكتمل الاعتماد: اعتمدته ' + okN.join(' ثم ') + '، والنموذج محفوظ وجاهز للطباعة والتحميل.'
      : okN.length ? '✔ تم اعتماده من ' + okN.join(' ثم ') + ' وتم نقله إلى ' + lbl(pend) + ' — قيد الاعتماد.'
      : '✔ تم الاعتماد وإرساله إلى ' + lbl(pend) + ' — قيد الاعتماد.';
    if (compact) return '<div class="amsg">' + e(msg) + '</div>';
    return '<div class="atrail">' + out.join('<span class="arr">←</span>') + (done ? '<span class="atr all">✔ اكتمل الاعتماد</span>' : '') + '</div><div class="amsg">' + e(msg) + '</div>';
  }
  function apprShow(paper, list) {
    var st = document.getElementById('nf-apst'); if (!st || !CUR) return;
    if (list) CUR.aps = list; else if (!CUR.aps) CUR.aps = apprList(fsKey());
    var L = CUR.aps || [], mine = me().name;
    // آخر حالة لكل مستلمة
    var by = {}; L.forEach(function (a) { var k = a.to || ''; if (!by[k] || (a.status === 'معتمدة') || a.at > by[k].at) by[k] = a; });
    var items = Object.keys(by).map(function (k) { return by[k]; });
    st.innerHTML = trail(L);
    st.hidden = !items.length;
    CUR.ap = items.filter(function (a) { return a.to === mine && a.status === 'بانتظار الاعتماد'; })[0] || null;
    var coord = (F().coordinators || [])[0] || '', vp = F().adminVP || '';
    var pendTo = function (n) { return items.some(function (a) { return a.to === n && a.status === 'بانتظار الاعتماد'; }); };
    var okBy = function (n) { return items.some(function (a) { return a.to === n && a.status === 'معتمدة'; }); };
    var tc = null, rq = document.getElementById('nf-reqap'), apb = document.getElementById('nf-approve'), rm = document.getElementById('nf-remind');
    var myPend = items.filter(function (a) { return a.status === 'بانتظار الاعتماد' && (a.by === mine || me().role === 'admin') && a.to !== mine; })[0] || null;
    CUR.rem = myPend;
    if (rm) { rm.hidden = !myPend; if (myPend) rm.textContent = '🔔 تذكير أ. ' + myPend.to + ' بالاعتماد'; }
    var inFlow = items.length > 0;
    if (rq) { var pc0 = policyChain(CUR.o); rq.hidden = !pc0.length || inFlow || me().role === 'teacher'; rq.title = pc0.length ? 'يُرسل تلقائيًا حسب السياسة إلى: ' + pc0.map(function (x) { return (ROLE_AR[x.st] || '') + ' (أ. ' + x.name + ')'; }).join(' ← ') : ''; }
    if (apb) apb.hidden = !CUR.ap;
    var wd = document.getElementById('nf-withdraw'), rv = document.getElementById('nf-revoke');
    var reqBy = L.length ? L.slice().sort(function (a, b) { return a.at < b.at ? -1 : 1; })[0].by : '';
    CUR.wd = items.filter(function (a) { return a.status === 'بانتظار الاعتماد'; })[0] || null;
    if (wd) wd.hidden = !(CUR.wd && (reqBy === mine || me().role === 'admin'));
    // إلغاء اعتمادي: اعتمدتُ أنا، والجهة التالية لم تعتمد بعد
    var myOk = items.filter(function (a) { return a.status === 'معتمدة' && a.approver === mine; })[0];
    var laterOk = myOk && items.some(function (a) { return a.at > myOk.at && a.status === 'معتمدة'; });
    CUR.rv = myOk && !laterOk ? myOk : null;
    if (rv) rv.hidden = !CUR.rv;
    // توقيع كل من اعتمدت (المحفوظ لحظة اعتمادها) يظهر في خانتها لكل من يفتح الاستمارة
    if (window.NamoosSig) items.forEach(function (a) {
      if (a.status !== 'معتمدة' || !a.sig || a.approver === mine) return;
      nameCells(paper, a.approver).forEach(function (c) { if (!c.querySelector('.sgw')) { c.setAttribute('data-as', '1'); NamoosSig.place(c, a.sig); } });
    });
    fit(paper);
  }
  /* مسار الاعتماد من السياسة: الجهات المطلوبة في هذه الحالة بعد جهتي (منسقة شؤون الطالبات، الأخصائية الاجتماعية، النفسية، فريق إدارة السلوك)، وتنتهي بالنائبة الإدارية */
  var ORDER = ['supervisor', 'coordinator', 'social', 'psych', 'admin'];
  var ROLE_AR = { coordinator: 'شؤون الطالبات', social: 'الأخصائية الاجتماعية', psych: 'الأخصائية النفسية', admin: 'النائبة الإدارية' };
  function policyChain(o) {
    var staff = N.S.boot.staff || [], byR = function (r) { var u = staff.filter(function (x) { return x.role === r; })[0]; return u ? u.name : ''; };
    var who = { coordinator: (F().coordinators || [])[0] || byR('coordinator'), social: o.social || byR('social'), psych: o.psych || byR('psych'), admin: F().adminVP };
    var mine = ORDER.indexOf(me().role === 'admin' ? 'admin' : me().role), out = [];
    ORDER.forEach(function (st, i) { if (i > mine && st !== 'supervisor' && o.req && o.req[st] && who[st]) out.push({ st: st, name: who[st] }); });
    if (F().adminVP && !out.some(function (x) { return x.name === F().adminVP; })) out.push({ st: 'admin', name: F().adminVP });
    return out.filter(function (x, i, a) { return x.name !== me().name && a.findIndex(function (y) { return y.name === x.name; }) === i; });
  }
  function reqAppr(paper, chain, b) {
    if (b.disabled) return; b.disabled = true; fsSave(true);
    N.api('requestApproval', { chain: chain, key: fsKey(), form: CUR.id, kind: CUR.kind, caseId: CUR.o.id, title: CUR.d.title, student: CUR.o.student, section: CUR.o.section })
      .then(function (r) { var pc = policyChain(CUR.o)[0]; N.toast('✔ تم الاعتماد وإرساله إلى ' + (pc && ROLE_AR[pc.st] ? ROLE_AR[pc.st] + ' (أ. ' + r.to + ')' : 'أ. ' + r.to), 'ok', 7000); return N.refresh && N.refresh(); })
      .then(function () { apprShow(paper, apprList(fsKey())); })
      .catch(function (err) { N.toast(err.message, 'bad'); }).then(function () { b.disabled = false; });
  }
  function open(id, kind, oid, apReq) {
    var o = find(kind, oid);
    if (!o) { N.toast('لم أجد بيانات الحالة — حدّثي الصفحة', 'bad'); return; }
    var d = DEF[id];
    CUR = { id: id, o: o, d: d, kind: kind };
    CUR.ap = null; CUR.aps = null;
    var staff = (N.S.boot.staff || []).filter(function (u) { return u.name !== me().name && u.role !== 'teacher' && u.role !== 'daily'; });
    // «إلى» حسب السياسة: الجهة التي تُحال إليها الحالة في نص إجراء الموظفة نفسها (ويمكن تغييرها)
    var byRole = function (r) { var u = staff.filter(function (x) { return x.role === r; })[0]; return u ? u.name : ''; };
    var ST = { supervisor: 'supervisor', coordinator: 'coordinator', social: 'social', psych: 'psych', admin: 'admin' }[me().role] || 'supervisor';
    var pt = txt(o, ST);
    var defTo = '';
    if (/الأخصائي النفسي|الاختصاصي النفسي/.test(pt) && !/الاجتماعي/.test(pt)) defTo = o.psych || byRole('psych');
    else if (/الأخصائي الاجتماعي|الاختصاصي الاجتماعي/.test(pt)) defTo = o.social || byRole('social');
    else if (/منسق شؤون الطلبة|فريق إدارة سلوك/.test(pt)) defTo = (F().coordinators || [])[0] || byRole('coordinator');
    if (!defTo) defTo = me().role === 'coordinator' ? (o.social || byRole('social')) : ((F().coordinators || [])[0] || byRole('coordinator'));
    if (me().role !== 'coordinator') defTo = (F().coordinators || [])[0] || byRole('coordinator') || defTo; // زر «إرسال إلى شؤون الطالبات»
    var m = document.getElementById('nf-modal');
    if (!m) { m = document.createElement('div'); m.id = 'nf-modal'; document.body.appendChild(m); }
    m.innerHTML = '<div class="nf-back"></div><div class="nf-dlg" role="dialog" aria-modal="true" aria-label="معاينة الاستمارة">' +
      '<div class="nf-bar"><b>معاينة: ' + d.title + ' — ' + e(o.student) + '</b>' +
      '<div class="nf-acts"><button class="btn" id="nf-print" type="button">🖨 طباعة</button><button class="btn sec" id="nf-dl" type="button">⬇ تحميل PDF</button><button class="btn" id="nf-reqap" type="button" hidden>✔ اعتماد</button><button class="btn sec" id="nf-remind" type="button" hidden>🔔 تذكير بالاعتماد</button><button class="btn" id="nf-approve" type="button" hidden>✔ اعتماد وتوقيع</button><button class="btn sec" id="nf-withdraw" type="button" hidden>↩ سحب طلب الاعتماد</button><button class="btn sec" id="nf-revoke" type="button" hidden>↩ إلغاء اعتمادي</button><button class="btn sec" id="nf-close" type="button">إغلاق</button></div><div class="nf-apst" id="nf-apst" hidden></div></div>' +
      '<p class="nf-hint">' + (id === 'g1' ? 'نموذج رقم (1) كما في دليل فريق إدارة سلوك الطلبة 2026، تعبّأت بياناته تلقائيًا ولا يُعدَّل نصه. أضيفي توقيعكِ، ودعي الطالبة توقّع إلكترونيًا.' : 'الخانات الزرقاء تعبّأت تلقائيًا. يمكنكِ الكتابة في الخانات المنقطة والتأشير على المربعات قبل الطباعة.') + '</p>' +
      '<div class="nf-stage"><article class="nf-paper' + (/^[gw]/.test(id) ? ' nf-gdoc' : '') + (d.pages > 1 ? ' nf-multi' : '') + '" id="nf-paper">' + d.build(o) + '</article></div></div>';
    m.hidden = false; document.body.classList.add('nf-open');
    var paper = document.getElementById('nf-paper');
    fit(paper);
    if (window.NamoosSig) { NamoosSig.decorate(paper, 'td.sgn, td.sgn2, .nf-sig td, .nf-appr', function () { fit(paper); }); NamoosSig.autoMine(paper, me().name, function () { fit(paper); }); }
    paper.addEventListener('click', function (ev) {
      var cb = ev.target.closest('.nf-cb'); if (!cb) return;
      var on = !cb.classList.contains('on'); cb.classList.toggle('on', on); cb.textContent = on ? '☑' : '☐'; cb.setAttribute('aria-checked', on);
    });
    paper.addEventListener('keydown', function (ev) { if ((ev.key === ' ' || ev.key === 'Enter') && ev.target.classList.contains('nf-cb')) { ev.preventDefault(); ev.target.click(); } });
    paper.addEventListener('input', function () { fit(paper); fsSave(); });
    alWire(paper);
    paper.addEventListener('click', function (ev) { if (ev.target.closest('.nf-cb')) fsSave(); });
    // ما حُفظ سابقًا: من هذا الجهاز فورًا، ثم من الخادم (يظهر للجميع)
    fsLast = ''; fsDirty = false; var key0 = fsKey();
    try { var loc = localStorage.getItem('nf:' + key0); if (loc) { fsApply(paper, loc); fsLast = loc; } } catch (e) {}
    N.api('formState', { key: key0 }, true).then(function (r) { if (!(CUR && fsKey() === key0 && document.getElementById('nf-paper') === paper)) return; if (r && r.data && !fsDirty) { fsApply(paper, r.data); fsLast = r.data; try { localStorage.setItem('nf:' + key0, r.data); } catch (e) {} } if (r && r.approval) apprShow(paper, [].concat(r.approval)); }).catch(function () {});
    document.getElementById('nf-close').onclick = close;
    m.querySelector('.nf-back').onclick = close;
    document.getElementById('nf-print').onclick = function () { fsSave(true); fit(paper); document.body.classList.add('nf-printing'); setTimeout(function () { window.print(); }, 60); };
    apprShow(paper);
    document.getElementById('nf-reqap').onclick = function () { reqAppr(paper, policyChain(CUR.o).map(function (x) { return x.name; }), this); };
    var act = function (b, api, id, okMsg) {
      if (b.disabled || !id) return; if (!confirm(b.textContent.replace('↩ ', '') + '؟')) return; b.disabled = true;
      N.api(api, { id: id }).then(function () { N.toast(okMsg, 'ok', 5000); return N.refresh && N.refresh(); })
        .then(function () { CUR.aps = null; apprShow(paper, apprList(fsKey())); }).catch(function (err) { N.toast(err.message, 'bad'); }).then(function () { b.disabled = false; });
    };
    document.getElementById('nf-withdraw').onclick = function () { act(this, 'withdrawApproval', CUR.wd && CUR.wd.id, '↩ سُحب طلب الاعتماد، ويمكنكِ الاعتماد من جديد متى شئتِ'); };
    document.getElementById('nf-revoke').onclick = function () { act(this, 'revokeApproval', CUR.rv && CUR.rv.id, '↩ أُلغي اعتمادكِ، وعادت الاستمارة عندكِ قيد الاعتماد'); };
    document.getElementById('nf-remind').onclick = function () {
      var b = this; if (b.disabled || !CUR.rem) return; b.disabled = true;
      N.api('remindApproval', { id: CUR.rem.id }).then(function () { N.toast('🔔 أُرسل تذكير إلى أ. ' + CUR.rem.to, 'ok'); return N.refresh && N.refresh(); })
        .then(function () { apprShow(paper, apprList(fsKey())); }).catch(function (err) { N.toast(err.message, 'bad'); }).then(function () { b.disabled = false; });
    };
    document.getElementById('nf-approve').onclick = function () {
      var b = this; if (b.disabled || !CUR.ap) return;
      var cells = nameCells(paper, me().name);
      // توقيعي يوضع في خانتي تلقائيًا عند الاعتماد (خانة التوقيع إن وُجدت، وإلا الخانة التي تحمل اسمي)
      var sigCells = cells.filter(function (c) { return c.matches('td.sgn, td.sgn2, td.sgvp, .nf-sig td, .nf-appr'); });
      var target = (sigCells.length ? sigCells : cells).filter(function (c) { return !c.querySelector('.sgw'); });
      var placed = cells.some(function (c) { return c.querySelector('.sgw'); });
      b.disabled = true;
      var pre = placed || !cells.length || !window.NamoosSig ? Promise.resolve() : NamoosSig.mine().then(function (sg) {
        if (!sg) { b.disabled = false; NamoosSig.open(function (d) { target.slice(0, 1).forEach(function (c) { NamoosSig.place(c, d); }); fit(paper); }); throw new Error('احفظي توقيعكِ أولًا، ثم اضغطي «✔ اعتماد وتوقيع» مرة أخرى'); }
        target.slice(0, 1).forEach(function (c) { c.setAttribute('data-as', '1'); NamoosSig.place(c, sg); }); fit(paper);
      });
      pre.then(function () { return N.api('approveForm', { id: CUR.ap.id }); }).then(function (r) {
        N.toast('✔ تم الاعتماد' + (r.forwardedTo ? '، وأُحيلت تلقائيًا إلى أ. ' + r.forwardedTo : '، واكتمل اعتماد الاستمارة وعادت موقّعة إلى أ. ' + CUR.ap.by), 'ok', 6000);
        var ap = CUR.ap; return (N.refresh ? N.refresh() : Promise.resolve()).then(function () { apprShow(paper, apprList(fsKey()).map(function (x) { return x.id === ap.id ? Object.assign({}, x, { status: 'معتمدة', approver: me().name, approvedAt: r.approvedAt }) : x; })); });
      }).catch(function (err) { N.toast(err.message, 'bad'); b.disabled = false; });
    };
    document.getElementById('nf-dl').onclick = function () {
      var b = this; if (b.disabled) return; b.disabled = true; var lbl = b.textContent; b.textContent = 'جارٍ التجهيز…'; fsSave(true);
      toPdf(paper, true).then(function (pdf) { pdf.save((CUR.d.title + ' — ' + CUR.o.student + '.pdf').replace(/[\\/:*?"<>|]/g, ' ')); })
        .catch(function () { N.toast('تعذّر تجهيز الملف، حاولي مرة أخرى', 'bad'); })
        .then(function () { b.disabled = false; b.textContent = lbl; });
    };
    var mt = document.getElementById('nf-mailt'); if (mt) mt.onclick = function () { var x = document.getElementById('nf-mail'); x.hidden = !x.hidden; };
    // أُلغي الإرسال بالبريد: الاعتماد يصل للمستلمة على حسابها داخل المنصة
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('nf-printing'); });
  function close() { fsSave(true); var m = document.getElementById('nf-modal'); if (m) { m.hidden = true; m.innerHTML = ''; } document.body.classList.remove('nf-open'); }

  function loadLibs() {
    if (window.html2canvas && window.jspdf) return Promise.resolve();
    var add = function (src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); };
    return add('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').then(function () { return add('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'); });
  }
  function toPdf(paper, asDoc) {
    return loadLibs().then(function () {
      paper.classList.add('nf-snap');
      return window.html2canvas(paper, { scale: 2, backgroundColor: '#ffffff', useCORS: true, ignoreElements: function (el) { return el.classList && el.classList.contains('nf-noprint'); } });
    }).then(function (cv) {
      paper.classList.remove('nf-snap');
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var w = 190, h = cv.height * w / cv.width;
      var pages = (CUR && CUR.d && CUR.d.pages) || 1;
      if (pages > 1 && h > 277) { // استمارة متعددة الصفحات: تُقسَّم الصورة على صفحات A4
        var sliceH = Math.floor(cv.width * 277 / 190);
        for (var y = 0, pg = 0; y < cv.height; y += sliceH, pg++) {
          var c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = Math.min(sliceH, cv.height - y);
          var cx = c2.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c2.width, c2.height); cx.drawImage(cv, 0, -y);
          if (pg) pdf.addPage();
          pdf.addImage(c2.toDataURL('image/jpeg', 0.92), 'JPEG', 10, 10, 190, c2.height * 190 / c2.width);
        }
        return asDoc ? pdf : pdf.output('datauristring');
      }
      if (h > 277) { h = 277; w = cv.width * h / cv.height; }
      pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', (210 - w) / 2, 10, w, h);
      return asDoc ? pdf : pdf.output('datauristring');
    });
  }
  function send() {
    var btn = document.getElementById('nf-send'); if (btn.disabled) return;
    var to = 'لجنة الضبط السلوكي';
    btn.disabled = true; btn.textContent = 'جارٍ تجهيز الاستمارة وإرسالها…';
    var paper = document.getElementById('nf-paper');
    toPdf(paper).then(function (pdf) {
      return N.api('sendForm', { committee: true, to: to, title: CUR.d.title + ' (نموذج ' + CUR.d.no + ')', student: CUR.o.student, section: CUR.o.section, caseId: CUR.o.id, note: document.getElementById('nf-note').value, pdf: pdf });
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
  window.NamoosForms = { init: function (ctx) { N = ctx; }, buttons: buttons, required: required, chips: chips, _build: function (id, o) { return DEF[id].build(o); }, _open: function (id, kind, oid, ap) { return open(id, kind, oid, ap); }, trail: trail,
    download: function (id, kind, oid) { open(id, kind, oid); setTimeout(function () { var b = document.getElementById('nf-dl'); if (b) b.click(); }, 1200); } };
})();
