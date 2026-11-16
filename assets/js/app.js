/* HRITEY — Today's Bread. Vanilla JS, no tracking, no cookies, no storage. */
(function () {
  'use strict';

  var SITE = 'https://hritey.com';
  var ETH_MONTHS = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit',
    'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
  var GREG_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // Gregorian -> Julian Day Number
  function gregToJdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) -
      Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  // Julian Day Number -> Ethiopian (Amete Mihret era)
  function jdnToEthiopian(jdn) {
    var EPOCH = 1723856;
    var r = ((jdn - EPOCH) % 1461 + 1461) % 1461;
    var n = (r % 365) + 365 * Math.floor(r / 1460);
    var year = 4 * Math.floor((jdn - EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
    return { year: year, month: Math.floor(n / 30) + 1, day: (n % 30) + 1 };
  }
  function ethiopianFor(d) {
    return jdnToEthiopian(gregToJdn(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  }

  function renderDate(today) {
    var e = ethiopianFor(today);
    var box = $('date');
    box.textContent = '';
    box.appendChild(document.createTextNode(ETH_MONTHS[e.month - 1] + ' ' + e.day + ', ' + e.year + ' E.C.'));
    box.appendChild(el('span', 'dot', '·')).setAttribute('aria-hidden', 'true');
    box.appendChild(document.createTextNode(GREG_MONTHS[today.getMonth()] + ' ' + today.getDate()));
  }

  // Today's entry, else the latest entry on or before today, else the latest entry overall.
  // Returns the date key to use.
  function pickDay(days, key) {
    if (days[key]) return key;
    var keys = Object.keys(days).sort();
    var past = keys.filter(function (k) { return k <= key; });
    return past.length ? past[past.length - 1] : (keys[keys.length - 1] || null);
  }

  // Weekly theme: weeks are keyed by their Sunday; use the latest week starting on or before the day.
  function themeFor(weeks, dayKey) {
    var starts = Object.keys(weeks || {}).sort().filter(function (k) { return k <= dayKey; });
    var w = starts.length ? weeks[starts[starts.length - 1]] : null;
    return w && w.theme ? w.theme : '';
  }

  function renderTheme(theme) {
    var box = $('theme');
    box.textContent = '';
    if (!theme) { box.hidden = true; return; }
    box.appendChild(document.createTextNode('This week: '));
    box.appendChild(el('strong', null, theme));
    box.hidden = false;
  }

  // Blur the verse wording while the quiz runs, so answers come from memory.
  function setBlur(on) {
    var list = $('verses');
    list.classList.toggle('blurred', on);
    list.querySelectorAll('blockquote').forEach(function (b) {
      if (on) b.setAttribute('aria-hidden', 'true'); else b.removeAttribute('aria-hidden');
    });
    if (on && window.getSelection) {
      var sel = window.getSelection();
      if (sel && list.contains(sel.anchorNode)) sel.removeAllRanges();
    }
  }
  document.addEventListener('copy', function (e) {
    var list = $('verses');
    var sel = window.getSelection && window.getSelection();
    if (list.classList.contains('blurred') && sel && sel.rangeCount &&
        sel.getRangeAt(0).intersectsNode(list)) {
      e.preventDefault();
    }
  });

  function renderVerses(day) {
    var list = $('verses');
    list.textContent = '';
    day.verses.forEach(function (v) {
      var li = el('li', 'verse');
      li.appendChild(el('p', 'ref', v.ref));
      li.appendChild(el('blockquote', null, v.text));
      list.appendChild(li);
    });
    var c = day.commentary;
    var box = $('commentary');
    if (c && c.text && c.father && c.work) {
      box.textContent = '';
      box.appendChild(el('p', null, '“' + c.text + '”'));
      box.appendChild(el('cite', null, '— ' + c.father + ', ' + c.work));
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  }

  function setupShare(day, theme) {
    var refs = day.verses.map(function (v) { return v.ref; });
    var head = 'Today’s Bread (KJV)' + (theme ? '\nThis week: ' + theme : '');
    var full = head + '\n\n' + day.verses.map(function (v) {
      return v.ref + ' — ' + v.text;
    }).join('\n\n');
    var withUrl = full + '\n\n' + SITE;
    var enc = encodeURIComponent;
    // X: full text if it fits in a post (links count as 23), otherwise the references only.
    var xText = (full.length + 24 <= 280) ? full :
      'Today’s Bread (KJV)' + (theme ? ' · This week: ' + theme : '') + '\n' + refs.join(' · ');
    $('share-whatsapp').href = 'https://wa.me/?text=' + enc(withUrl);
    $('share-x').href = 'https://x.com/intent/post?text=' + enc(xText) + '&url=' + enc(SITE);
    $('share-facebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + enc(SITE);
    $('share-telegram').href = 'https://t.me/share/url?url=' + enc(SITE) + '&text=' + enc(full);
  }

  function setupQuiz(day) {
    var quiz = $('quiz');
    var introHTML = quiz.innerHTML;
    var qs = day.quiz || [];
    var i = 0, score = 0, running = false;

    function start() { i = 0; score = 0; running = true; setBlur(true); show(); }

    function leaveButton() {
      var b = el('button', 'link-btn', 'Leave quiz');
      b.type = 'button';
      b.addEventListener('click', reset);
      return b;
    }

    // Back to the intro card with the verses clear again.
    function reset() {
      running = false;
      setBlur(false);
      quiz.innerHTML = introHTML;
      $('quiz-start').addEventListener('click', start);
    }

    function show() {
      var q = qs[i];
      var v = day.verses[q.verse != null ? q.verse : i];
      quiz.textContent = '';
      quiz.appendChild(el('h2', null, 'Today’s Quiz')).id = 'quiz-title';
      quiz.appendChild(el('p', 'q-count', 'Question ' + (i + 1) + ' of ' + qs.length));
      quiz.appendChild(el('p', 'q-text', q.q));
      var wrap = el('div', 'choices');
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', 'Choices');
      var buttons = q.choices.map(function (txt, idx) {
        var b = el('button', 'choice', txt);
        b.type = 'button';
        b.addEventListener('click', function () { answer(idx, buttons, q, v); });
        wrap.appendChild(b);
        return b;
      });
      quiz.appendChild(wrap);
      quiz.appendChild(leaveButton());
      buttons[0].focus({ preventScroll: true });
    }

    function answer(idx, buttons, q, v) {
      var right = idx === q.answer;
      if (right) score++;
      buttons.forEach(function (b, k) {
        b.disabled = true;
        if (k === q.answer) b.classList.add('correct');
        else if (k === idx) b.classList.add('wrong');
      });
      var old = quiz.querySelector('.link-btn');
      if (old) old.remove();
      var r = el('div', 'reveal');
      r.appendChild(el('p', 'verdict', (right ? 'That’s right! ' : 'Not quite. ') + 'The answer is: ' + q.choices[q.answer] + '.'));
      r.appendChild(el('p', 'ref', v.ref));
      r.appendChild(el('blockquote', null, v.text));
      quiz.appendChild(r);
      var last = i === qs.length - 1;
      var next = el('button', 'btn', last ? 'See my score' : 'Next');
      next.type = 'button';
      next.addEventListener('click', function () { if (last) done(); else { i++; show(); } });
      quiz.appendChild(next);
      if (!last) quiz.appendChild(leaveButton());
      next.focus({ preventScroll: true });
    }

    function done() {
      running = false;
      setBlur(false);
      quiz.textContent = '';
      quiz.appendChild(el('h2', null, 'Today’s Quiz')).id = 'quiz-title';
      quiz.appendChild(el('p', 'score', 'You got ' + score + ' of ' + qs.length + '.'));
      quiz.appendChild(el('p', 'sub', score === qs.length ? 'Well done! Glory to God.' : 'Read the verses again and return tomorrow.'));
      var again = el('button', 'btn', 'Try again');
      again.type = 'button';
      again.addEventListener('click', start);
      quiz.appendChild(again);
      again.focus({ preventScroll: true });
    }

    if (!qs.length) { quiz.hidden = true; return; }
    $('quiz-start').addEventListener('click', start);
    // If the visitor leaves mid-quiz (closes the tab, goes back/forward), never come back blurred.
    window.addEventListener('pagehide', function () { if (running) reset(); });
    window.addEventListener('pageshow', function (e) { if (e.persisted && running) reset(); });
  }

  function showError() {
    $('verses').innerHTML = '';
    $('verses').appendChild(el('li', 'loading', 'Today’s bread could not be loaded. Please refresh the page.'));
    $('quiz').hidden = true;
  }

  var today = new Date();
  renderDate(today);

  fetch('data/days.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var days = data.days || {};
      var key = pickDay(days, isoDate(today));
      if (!key) throw new Error('no days');
      var day = days[key];
      var theme = themeFor(data.weeks, key);
      renderTheme(theme);
      renderVerses(day);
      setupShare(day, theme);
      setupQuiz(day);
    })
    .catch(showError);

  // Exposed for tests only (no data leaves the page).
  window.HRITEY = { ethiopianFor: ethiopianFor, pickDay: pickDay, themeFor: themeFor };
})();
