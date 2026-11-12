/* نوماس — توقيعي: لوحة رسم/رفع التوقيع، وإضافته في خانات التوقيع بالاستمارات والتقارير.
 * التوقيع خاص بصاحبته: يُحفظ باسمها ولا يظهر إلا حين تضيفه هي بنفسها. */
(function () {
  'use strict';
  var N = null, CACHE = null;
  function api(a, d) { return N.api(a, d || {}); }
  function get() {
    if (CACHE !== null) return Promise.resolve(CACHE);
    return api('mySignature').then(function (r) { CACHE = r.data || ''; return CACHE; });
  }

  /* ---------- لوحة التوقيع ---------- */
  function pad(onSaved) {
    var m = document.getElementById('sg-modal');
    if (!m) { m = document.createElement('div'); m.id = 'sg-modal'; document.body.appendChild(m); }
    m.innerHTML = '<div class="nf-back"></div><div class="sg-dlg" role="dialog" aria-modal="true" aria-label="توقيعي">' +
      '<div class="sg-head"><b>✍ توقيعي</b><button type="button" class="btn sec" id="sg-x">إغلاق</button></div>' +
      '<p class="sub">وقّعي داخل المربع بإصبعكِ أو بالفأرة، أو ارفعي صورة توقيعكِ. التوقيع خاص بكِ، ولا يظهر في أي ورقة إلا حين تضغطين أنتِ «أضيفي توقيعي».</p>' +
      '<div class="sg-cur" id="sg-cur"></div>' +
      '<canvas id="sg-c" width="900" height="300" aria-label="مربع التوقيع"></canvas>' +
      '<div class="sg-acts"><button type="button" class="btn sec" id="sg-clear">مسح</button>' +
      '<label class="btn sec" style="cursor:pointer">📷 رفع صورة توقيع<input type="file" id="sg-file" accept="image/*" hidden></label>' +
      '<button type="button" class="btn" id="sg-save">حفظ توقيعي</button>' +
      '<button type="button" class="btn sec" id="sg-del" hidden>حذف توقيعي</button></div></div>';
    m.hidden = false;
    var c = m.querySelector('#sg-c'), x = c.getContext('2d'), drawn = false, down = false, last = null;
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#13235B'; x.lineWidth = 5;
    var pos = function (ev) { var r = c.getBoundingClientRect(); return { x: (ev.clientX - r.left) * c.width / r.width, y: (ev.clientY - r.top) * c.height / r.height }; };
    c.addEventListener('pointerdown', function (ev) { ev.preventDefault(); down = true; last = pos(ev); c.setPointerCapture(ev.pointerId); x.beginPath(); x.arc(last.x, last.y, 2.4, 0, 7); x.fillStyle = '#13235B'; x.fill(); drawn = true; });
    c.addEventListener('pointermove', function (ev) { if (!down) return; var p = pos(ev); x.beginPath(); x.moveTo(last.x, last.y); x.lineTo(p.x, p.y); x.stroke(); last = p; drawn = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { c.addEventListener(t, function () { down = false; }); });
    var close = function () { m.hidden = true; m.innerHTML = ''; };
    m.querySelector('#sg-x').onclick = close; m.querySelector('.nf-back').onclick = close;
    m.querySelector('#sg-clear').onclick = function () { x.clearRect(0, 0, c.width, c.height); drawn = false; };
    m.querySelector('#sg-file').onchange = function () {
      var f = this.files && this.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var img = new Image();
        img.onload = function () {
          x.clearRect(0, 0, c.width, c.height);
          var k = Math.min(c.width / img.width, c.height / img.height) * 0.95, w = img.width * k, h = img.height * k;
          x.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
          // الخلفية البيضاء ← شفافة، ليظهر التوقيع فوق الاسم
          var d = x.getImageData(0, 0, c.width, c.height), a = d.data;
          for (var i = 0; i < a.length; i += 4) { var l = (a[i] + a[i + 1] + a[i + 2]) / 3; if (l > 200) a[i + 3] = 0; else if (l > 150) a[i + 3] = Math.round(a[i + 3] * (200 - l) / 50); }
          x.putImageData(d, 0, 0); drawn = true;
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    get().then(function (s) {
      if (s) { m.querySelector('#sg-cur').innerHTML = '<span>توقيعكِ المحفوظ:</span><img src="' + s + '" alt="توقيعي">'; m.querySelector('#sg-del').hidden = false; }
    }).catch(function () {});
    m.querySelector('#sg-del').onclick = function () {
      if (!confirm('حذف توقيعكِ المحفوظ؟')) return;
      api('deleteSignature').then(function () { CACHE = ''; N.toast('تم حذف التوقيع'); close(); }).catch(function (e) { N.toast(e.message, 'bad'); });
    };
    m.querySelector('#sg-save').onclick = function () {
      if (!drawn) { N.toast('وقّعي داخل المربع أولًا', 'bad'); return; }
      var data = trim(c);
      if (!data) { N.toast('المربع فارغ', 'bad'); return; }
      var b = this; b.disabled = true;
      api('saveSignature', { data: data }).then(function () {
        CACHE = data; N.toast('تم حفظ توقيعكِ ✔'); close(); if (onSaved) onSaved(data);
      }).catch(function (e) { b.disabled = false; N.toast(e.message, 'bad'); });
    };
  }
  // قصّ الفراغ حول التوقيع وتصغيره ليبقى خفيفًا
  function trim(c) {
    var x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (var y = 0; y < c.height; y++) for (var i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 10) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return '';
    var pad = 8; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
    var w = x1 - x0 + 1, h = y1 - y0 + 1, out = '', k = Math.min(1, 480 / w, 160 / h);
    for (var t = 0; t < 6; t++) {
      var o = document.createElement('canvas'); o.width = Math.max(1, Math.round(w * k)); o.height = Math.max(1, Math.round(h * k));
      o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height);
      out = o.toDataURL('image/png');
      if (out.length < 45000) return out;
      k *= 0.75;
    }
    return out;
  }

  /* ---------- «أضيفي توقيعي» في خانات التوقيع ---------- */
  function place(cell, s) {
    var old = cell.querySelector('.sgw'); if (old) old.remove();
    var w = document.createElement('span'); w.className = 'sgw';
    w.innerHTML = '<img class="sgimg" src="' + s + '" alt="التوقيع"><button type="button" class="sgx nf-noprint noprint" title="إزالة التوقيع" aria-label="إزالة التوقيع">×</button>';
    cell.classList.add('sg-has'); cell.appendChild(w);
    w.querySelector('.sgx').onclick = function (ev) { ev.stopPropagation(); w.remove(); cell.classList.remove('sg-has'); };
  }
  function decorate(root, selectors, after) {
    if (!root || !N) return;
    root.querySelectorAll(selectors).forEach(function (cell) {
      if (cell.querySelector('.sgadd')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sgadd nf-noprint noprint'; b.textContent = '✍ أضيفي توقيعي';
      b.onclick = function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        get().then(function (s) {
          if (s) { place(cell, s); if (after) after(); }
          else pad(function (d) { place(cell, d); if (after) after(); });
        }).catch(function (e) { N.toast(e.message, 'bad'); });
      };
      cell.appendChild(b);
    });
  }

  // توقيعي تلقائيًا في الخانة التي تحمل اسمي (تستطيع إزالته بـ ×)
  function autoMine(root, name, after) {
    if (!root || !name || !N) return;
    var n = String(name).trim();
    get().then(function (s) {
      if (!s) return;
      root.querySelectorAll('td.sgn2, .nf-sig td, .nf-appr, .report .sig > div, .mylog .mlme').forEach(function (cell) {
        if (cell.querySelector('.sgw') || cell.getAttribute('data-as')) return;
        var t = (cell.textContent || '').replace('✍ أضيفي توقيعي', '');
        if (t.indexOf(n) >= 0) { cell.setAttribute('data-as', '1'); place(cell, s); }
      });
      if (after) after();
    }).catch(function () {});
  }
  // أول دخول: اطلبي التوقيع مرة واحدة إن لم يكن محفوظًا
  function askOnce(user) {
    var k = 'nm_sigask_' + user;
    try { if (localStorage.getItem(k)) return; } catch (e) {}
    get().then(function (s) {
      if (s) return;
      try { localStorage.setItem(k, '1'); } catch (e) {}
      pad();
      var m = document.getElementById('sg-modal'); if (!m) return;
      var h = m.querySelector('.sub'); if (h) h.insertAdjacentHTML('beforebegin', '<div class="why" style="margin:6px 0">مرحبًا بكِ 🌿 أضيفي توقيعكِ مرة واحدة، وسيظهر تلقائيًا في خانة توقيعكِ بكل النماذج والتقارير. يمكنكِ تغييره لاحقًا من أيقونة ✍ في الأعلى.</div>');
    }).catch(function () {});
  }
  window.NamoosSig = { init: function (ctx) { N = ctx; }, open: function () { pad(); }, decorate: decorate, autoMine: autoMine, askOnce: askOnce, reset: function () { CACHE = null; } };
})();
