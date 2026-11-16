/* HRITEY — Today's Bread. Vanilla JS, no tracking, no cookies, no storage. */
(function () {
  'use strict';

  var SITE = 'https://hritey.com';
  var ETH_MONTHS = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit',
    'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
  var GREG_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var GREG_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseKey(k) { var p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(k, n) { var d = parseKey(k); d.setDate(d.getDate() + n); return isoDate(d); }

  // ---- Dates -------------------------------------------------------------
  function gregToJdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) -
      Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function jdnToEthiopian(jdn) {
    var EPOCH = 1723856; // Amete Mihret
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

  // ---- Data lookup -------------------------------------------------------
  // Today's key, else the latest key before today, else the latest key.
  function pickDay(days, key) {
    if (days[key]) return key;
    var keys = Object.keys(days).sort();
    var past = keys.filter(function (k) { return k <= key; });
    return past.length ? past[past.length - 1] : (keys[keys.length - 1] || null);
  }
  // Weeks are keyed by their Sunday; use the latest week starting on or before the day.
  function themeFor(weeks, dayKey) {
    var starts = Object.keys(weeks || {}).sort().filter(function (k) { return k <= dayKey; });
    var w = starts.length ? weeks[starts[starts.length - 1]] : null;
    return w && w.theme ? w.theme : '';
  }

  function renderTheme(theme, side) {
    var box = $('theme');
    box.textContent = '';
    if (!theme) { box.hidden = true; } else {
      box.appendChild(document.createTextNode('This week: '));
      box.appendChild(el('strong', null, theme));
      box.hidden = false;
    }
    var s = $('side');
    s.textContent = side || '';
    s.hidden = !side;
  }

  function renderNotice(key, todayKey) {
    var n = $('notice');
    if (key < todayKey) {
      var d = parseKey(key);
      n.textContent = 'New verses coming soon. Showing the bread for ' +
        GREG_LONG[d.getMonth()] + ' ' + d.getDate() + '.';
      n.hidden = false;
    } else {
      n.hidden = true;
    }
  }

  // ---- Verses + old-word help --------------------------------------------
  function oldWords(text, glossary) {
    var seen = [], out = [];
    (text.match(/[A-Za-z]+/g) || []).forEach(function (w) {
      var k = w.toLowerCase();
      var g = glossary[k];
      if (g && seen.indexOf(k) < 0) {
        seen.push(k);
        out.push(typeof g === 'object' ? (g.word || k) + ': ' + g.means : k + ': ' + g);
      }
    });
    return out;
  }
  // KJV verses that end in ':' or ';' get a soft CSS end mark (text itself unchanged).
  function verseQuote(text) {
    var q = el('blockquote', null, text);
    if (/[:;]$/.test(text.trim())) q.classList.add('cont');
    return q;
  }

  function renderVerses(day, glossary) {
    var list = $('verses');
    list.textContent = '';
    day.verses.forEach(function (v) {
      var li = el('li', 'verse');
      li.appendChild(el('p', 'ref', v.ref));
      li.appendChild(verseQuote(v.text));
      var words = oldWords(v.text, glossary || {});
      if (words.length) {
        var g = el('p', 'words', words.join(' · '));
        g.setAttribute('aria-label', 'Old words: ' + words.join(', '));
        li.appendChild(g);
      }
      list.appendChild(li);
    });
    var c = day.commentary, box = $('commentary');
    if (c && c.text && c.father && c.work) {
      box.textContent = '';
      box.appendChild(el('p', null, '“' + c.text + '”'));
      box.appendChild(el('cite', null, '— ' + c.father + ', ' + c.work));
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  }

  // Blur verse wording + word help while the quiz runs, so answers come from memory.
  function setBlur(on) {
    var list = $('verses');
    list.classList.toggle('blurred', on);
    list.querySelectorAll('blockquote, .words').forEach(function (b) {
      if (on) b.setAttribute('aria-hidden', 'true'); else b.removeAttribute('aria-hidden');
    });
    if (on && window.getSelection) {
      var sel = window.getSelection();
      if (sel && list.contains(sel.anchorNode)) sel.removeAllRanges();
    }
    listen.quizMode(on);
  }
  document.addEventListener('copy', function (e) {
    var list = $('verses');
    var sel = window.getSelection && window.getSelection();
    if (list.classList.contains('blurred') && sel && sel.rangeCount &&
        sel.getRangeAt(0).intersectsNode(list)) e.preventDefault();
  });

  // ---- Listen (browser speech; soft-launch test) --------------------------
  var listen = (function () {
    var btn = $('listen');
    var synth = window.speechSynthesis;
    var ok = !!(synth && window.SpeechSynthesisUtterance);
    var parts = [], speaking = false;

    function spokenRef(ref) { return ref.replace(/(\d+):(\d+)/, '$1, verse $2'); }
    // Spoken text only (the displayed verse stays exact KJV): avoid letter-by-letter or odd readings.
    var SAY = [[/\bLORD\b/g, 'Lord'], [/\bGOD\b/g, 'God'], [/\bJESUS\b/g, 'Jesus'],
      [/\bshew\b/g, 'show'], [/\bShew\b/g, 'Show'], [/\bshewed\b/g, 'showed'], [/\bsheweth\b/g, 'showeth']];
    function speakable(t) { SAY.forEach(function (r) { t = t.replace(r[0], r[1]); }); return t; }
    function pickVoice() {
      var vs = synth.getVoices() || [];
      var en = vs.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
      var pref = en.filter(function (v) { return /en-(US|GB)/i.test(v.lang) && v.localService; });
      return pref[0] || en[0] || null;
    }
    function label(on) {
      speaking = on;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.querySelector('.lbl').textContent = on ? 'Stop' : 'Listen';
      btn.classList.toggle('on', on);
    }
    function stop() { if (ok) synth.cancel(); label(false); }
    function play() {
      // iOS Safari: cancel() right before speak() can silently drop the queue, so only cancel if busy.
      if (synth.speaking || synth.pending) synth.cancel();
      if (synth.paused) synth.resume();
      var voice = pickVoice();
      parts.forEach(function (t, i) {
        var u = new SpeechSynthesisUtterance(t);
        u.lang = voice ? voice.lang : 'en-US';
        if (voice) u.voice = voice;
        u.rate = 0.88;
        u.pitch = 1;
        if (i === parts.length - 1) { u.onend = function () { label(false); }; }
        u.onerror = function (e) { if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; label(false); };
        synth.speak(u);
      });
      label(true);
    }
    if (ok) {
      btn.hidden = false;
      if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = function () {};
      synth.getVoices();
      btn.addEventListener('click', function () { if (speaking) stop(); else play(); });
      window.addEventListener('pagehide', stop);
    }
    return {
      speakable: speakable,
      set: function (day) {
        parts = day.verses.map(function (v) { return spokenRef(v.ref) + '. ' + speakable(v.text); });
      },
      quizMode: function (on) { if (!ok) return; if (on) stop(); btn.disabled = on; }
    };
  })();

  // ---- Share -------------------------------------------------------------
  function shareText(day, theme) {
    var head = 'Today’s Bread (KJV)' + (theme ? '\nThis week: ' + theme : '');
    return head + '\n\n' + day.verses.map(function (v) { return v.ref + ' — ' + v.text; }).join('\n\n');
  }
  function setupShare(day, theme) {
    var refs = day.verses.map(function (v) { return v.ref; });
    var full = shareText(day, theme);
    var enc = encodeURIComponent;
    var xText = (full.length + 24 <= 280) ? full :
      'Today’s Bread (KJV)' + (theme ? ' · This week: ' + theme : '') + '\n' + refs.join(' · ');
    $('share-whatsapp').href = 'https://wa.me/?text=' + enc(full + '\n\n' + SITE);
    $('share-x').href = 'https://x.com/intent/post?text=' + enc(xText) + '&url=' + enc(SITE);
    $('share-facebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + enc(SITE);
    $('share-telegram').href = 'https://t.me/share/url?url=' + enc(SITE) + '&text=' + enc(full);
    setupPicture(day, theme, full);
  }

  // Picture of today's bread, drawn on a canvas in the HRITEY style (no upload, no server).
  function wrap(ctx, text, maxW) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else { line = t; }
    });
    if (line) lines.push(line);
    return lines;
  }
  function drawCard(day, theme, side) {
    var W = 1080, H = 1350, P = 96;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    var INK = '#261e18', SOFT = '#6e5c4a', GOLD = '#d6bc94', SERIF = '"Crimson Text", Georgia, serif';
    x.fillStyle = '#fef4e8'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#e2d7c6'; x.lineWidth = 3;
    x.strokeRect(36, 36, W - 72, H - 72);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    var theo = document.querySelector('.theotokos');
    var y = 110;
    if (theo && theo.complete && theo.naturalWidth) { x.drawImage(theo, W / 2 - 42, y, 84, 134); y += 134 + 70; }
    x.fillStyle = INK; x.font = '600 64px ' + SERIF;
    x.fillText('Today’s Bread', W / 2, y); y += 50;
    if (theme) {
      x.fillStyle = SOFT; x.font = '400 34px ' + SERIF;
      x.fillText('This week: ' + theme + (side ? ' · ' + side : ''), W / 2, y); y += 34;
    }
    // Fit verses: shrink font until all three fit.
    var size = 44, blocks, total;
    var GAP = 80; // space around each dashed divider
    var avail = H - 250 - (y + 40);
    for (; size >= 28; size -= 2) {
      x.font = 'italic 400 ' + size + 'px ' + SERIF;
      blocks = day.verses.map(function (v) { return { ref: v.ref, lines: wrap(x, v.text, W - 2 * P) }; });
      total = blocks.reduce(function (s, b) { return s + size * 1.1 + 14 + b.lines.length * size * 1.4 + size * 0.4; }, 0) + 2 * GAP;
      if (total <= avail) break;
    }
    y += 40 + Math.max(0, (avail - total) / 2);
    x.textAlign = 'left';
    blocks.forEach(function (b, i) {
      if (i) {
        x.strokeStyle = GOLD; x.lineWidth = 2; x.setLineDash([12, 9]);
        y += GAP / 2;
        x.beginPath(); x.moveTo(P, y); x.lineTo(W - P, y); x.stroke(); x.setLineDash([]);
        y += GAP / 2;
      }
      x.fillStyle = INK; x.font = '400 ' + Math.round(size * 1.05) + 'px ' + SERIF;
      y += size * 1.1; x.fillText(b.ref, P, y); y += 14;
      x.font = 'italic 400 ' + size + 'px ' + SERIF;
      b.lines.forEach(function (ln) { y += size * 1.4; x.fillText(ln, P, y); });
      y += size * 0.4;
    });
    x.textAlign = 'center';
    x.fillStyle = INK; x.font = '600 52px ' + SERIF;
    x.fillText('HRITEY', W / 2, H - 120);
    x.fillStyle = SOFT; x.font = '400 30px ' + SERIF;
    x.fillText(SITE.replace('https://', '') + ' · Read. Reflect. Return tomorrow.', W / 2, H - 76);
    return c;
  }
  function setupPicture(day, theme, text) {
    var btn = $('share-picture');
    var side = day.side || '';
    var canShareFiles = false;
    try {
      canShareFiles = !!(navigator.canShare && window.File &&
        navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 't.png', { type: 'image/png' })] }));
    } catch (e) { canShareFiles = false; }
    btn.textContent = canShareFiles ? 'Share as picture' : 'Save picture';
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var fontsReady = document.fonts && document.fonts.load ?
        Promise.all([document.fonts.load('600 64px "Crimson Text"'), document.fonts.load('italic 400 40px "Crimson Text"')]) :
        Promise.resolve();
      fontsReady.then(function () {
        var c = drawCard(day, theme, side);
        c.toBlob(function (blob) {
          if (!blob) return;
          var name = 'hritey-todays-bread.png';
          if (canShareFiles) {
            var file = new File([blob], name, { type: 'image/png' });
            navigator.share({ files: [file], title: 'Today’s Bread', text: text + '\n\n' + SITE })
              .catch(function () { /* user cancelled */ });
          } else {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          }
        }, 'image/png');
      });
    });
    window.HRITEY.drawCard = function () { return drawCard(day, theme, side); };
  }

  // ---- Quiz --------------------------------------------------------------
  function setupQuiz(day, nextSide) {
    var quiz = $('quiz');
    var introHTML = quiz.innerHTML;
    var qs = day.quiz || [];
    var i = 0, score = 0, running = false;

    function heading() { quiz.appendChild(el('h2', null, 'Today’s Quiz')).id = 'quiz-title'; }
    function start() { i = 0; score = 0; running = true; setBlur(true); show(); }
    function leaveButton() {
      var b = el('button', 'link-btn', 'Leave quiz');
      b.type = 'button';
      b.addEventListener('click', reset);
      return b;
    }
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
      heading();
      quiz.appendChild(el('p', 'q-count', 'Question ' + (i + 1) + ' of ' + qs.length));
      quiz.appendChild(el('p', 'q-text', q.q));
      var wrapEl = el('div', 'choices');
      wrapEl.setAttribute('role', 'group');
      wrapEl.setAttribute('aria-label', 'Choices');
      var buttons = q.choices.map(function (txt, idx) {
        var b = el('button', 'choice', txt);
        b.type = 'button';
        b.addEventListener('click', function () { answer(idx, buttons, q, v); });
        wrapEl.appendChild(b);
        return b;
      });
      quiz.appendChild(wrapEl);
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
      r.appendChild(verseQuote(v.text));
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
      heading();
      quiz.appendChild(el('p', 'score', 'You got ' + score + ' of ' + qs.length + '.'));
      quiz.appendChild(el('p', 'sub', score === qs.length ? 'Well done! Glory to God.' : 'Read the verses again and return tomorrow.'));
      if (nextSide) {
        var t = el('p', 'tomorrow');
        t.appendChild(document.createTextNode('Tomorrow: '));
        t.appendChild(el('strong', null, nextSide));
        quiz.appendChild(t);
      }
      var again = el('button', 'btn', 'Try again');
      again.type = 'button';
      again.addEventListener('click', start);
      quiz.appendChild(again);
      again.focus({ preventScroll: true });
    }

    if (!qs.length) { quiz.hidden = true; return; }
    $('quiz-start').addEventListener('click', start);
    // Leaving mid-quiz (closing, back/forward) never leaves the verses blurred.
    window.addEventListener('pagehide', function () { if (running) reset(); });
    window.addEventListener('pageshow', function (e) { if (e.persisted && running) reset(); });
  }

  // ---- Social placeholders: accounts not live yet, so don't jump to top ----
  document.querySelectorAll('a[data-soon]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  function showError() {
    $('verses').innerHTML = '';
    $('verses').appendChild(el('li', 'loading', 'Today’s bread could not be loaded. Please refresh the page.'));
    $('quiz').hidden = true;
  }

  window.HRITEY = { ethiopianFor: ethiopianFor, pickDay: pickDay, themeFor: themeFor };
  window.HRITEY.speakable = function (t) { return listen.speakable(t); };

  var today = new Date();
  var todayKey = isoDate(today);
  renderDate(today);

  fetch('data/days.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var days = data.days || {};
      var key = pickDay(days, todayKey);
      if (!key) throw new Error('no days');
      var day = days[key];
      var theme = themeFor(data.weeks, key);
      var next = days[addDays(key, 1)];
      renderTheme(theme, day.side);
      renderNotice(key, todayKey);
      renderVerses(day, data.glossary);
      listen.set(day);
      setupShare(day, theme);
      setupQuiz(day, next && next.side);
    })
    .catch(showError);
})();
