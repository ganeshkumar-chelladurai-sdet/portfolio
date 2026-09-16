/* =============================================================
   Ganeshkumar Chelladurai - portfolio interactions
   No dependencies. Degrades gracefully without JS.
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Theme ---------- */
  var themeBtn = $('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      themeBtn.setAttribute('aria-label', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      try { localStorage.setItem('gc-theme', next); } catch (e) { /* private mode */ }
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = $('.nav-toggle');
  var nav = $('#site-nav');
  if (navToggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        navToggle.focus();
      }
    });
  }

  /* ---------- Scroll progress + sticky header ---------- */
  var bar = $('.scroll-progress');
  var header = $('.header');
  var ticking = false;

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.setProperty('--p', p.toFixed(4));
    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    reveals.forEach(function (el, i) {
      // stagger siblings within the same parent
      var sibs = el.parentElement ? $$('.reveal', el.parentElement) : [];
      var idx = sibs.indexOf(el);
      el.style.setProperty('--d', (idx > 0 ? Math.min(idx, 5) * 70 : 0) + 'ms');
      revealObs.observe(el);
    });
  }

  /* ---------- Scroll-spy nav ---------- */
  var navLinks = $$('#site-nav a[href^="#"]');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var visible = new Map();
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      var bestId = null, best = 0;
      visible.forEach(function (ratio, id) {
        if (ratio > best) { best = ratio; bestId = id; }
      });
      navLinks.forEach(function (a) {
        var on = bestId && a.getAttribute('href') === '#' + bestId;
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-72px 0px -55% 0px', threshold: [0, 0.15, 0.4, 0.75] });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Count-up stats ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    if (reduceMotion) { el.textContent = prefix + target + suffix; return; }

    var dur = 1300, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (k < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var counters = $$('[data-count]');
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(countUp);
    } else {
      var countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          countObs.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { countObs.observe(el); });
    }
  }

  /* ---------- Project progress bars ---------- */
  var bars = $$('.progress i[data-pct]');
  if (bars.length) {
    var fill = function (el) { el.style.width = el.dataset.pct + '%'; };
    if (!('IntersectionObserver' in window) || reduceMotion) {
      bars.forEach(fill);
    } else {
      var barObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          fill(entry.target);
          barObs.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      bars.forEach(function (el) { barObs.observe(el); });
    }
  }

  /* ---------- Skill filters ---------- */
  var filterBtns = $$('.filter-btn');
  var skillGroups = $$('.skill-group');
  if (filterBtns.length && skillGroups.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.filter;
        filterBtns.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        skillGroups.forEach(function (g) {
          g.hidden = !(key === 'all' || g.dataset.cat === key);
        });
      });
    });
  }

  /* ---------- Hero glow follows pointer ---------- */
  var hero = $('.hero');
  var glow = $('.hero-glow');
  if (hero && glow && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(2) + '%');
      glow.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(2) + '%');
    });
  }

  /* ---------- Terminal test-run animation ---------- */
  var term = $('#terminal-body');
  if (term) {
    var SCRIPT = [
      { text: '$ mvn -q test -Dsuite=regression', cls: 't-prompt', pause: 420 },
      { text: '', pause: 120 },
      { text: 'SeleniumLoginFramework :: parallel(4)', cls: 't-dim', pause: 300 },
      { text: '  PASS  valid credentials        0.84s', cls: 't-pass', pause: 170 },
      { text: '  PASS  invalid password         0.61s', cls: 't-pass', pause: 170 },
      { text: '  PASS  auto-redirect dialog     1.12s', cls: 't-pass', pause: 170 },
      { text: '  PASS  role dropdown select     0.73s', cls: 't-pass', pause: 240 },
      { text: '', pause: 120 },
      { text: '$ pytest -q api/ etl/', cls: 't-prompt', pause: 420 },
      { text: '  PASS  api contract + chaining  1.30s', cls: 't-pass', pause: 170 },
      { text: '  PASS  etl source-to-target     2.05s', cls: 't-pass', pause: 300 },
      { text: '', pause: 120 },
      { text: 'Tests: 6 passed, 6 total   Time: 6.65s', cls: 't-key', pause: 260 },
      { text: 'Coverage +30%  Manual -50%  Release -20%', cls: 't-warn', pause: 300 },
      { text: '', pause: 120 },
      { text: '$ open-to-work --loc "Dublin, IE" --remote', cls: 't-prompt', pause: 300 }
    ];

    var renderAll = function () {
      term.innerHTML = '';
      SCRIPT.forEach(function (line) {
        var el = document.createElement('span');
        el.className = 'ln ' + (line.cls || '');
        el.textContent = line.text || ' ';
        term.appendChild(el);
      });
    };

    if (reduceMotion) {
      renderAll();
    } else {
      var caret = document.createElement('span');
      caret.className = 'caret';

      var i = 0;
      var playLine = function () {
        if (i >= SCRIPT.length) { return; }
        var line = SCRIPT[i++];
        var el = document.createElement('span');
        el.className = 'ln ' + (line.cls || '');
        term.insertBefore(el, caret);

        if (!line.text) {
          el.innerHTML = '&nbsp;';
          window.setTimeout(playLine, line.pause || 120);
          return;
        }

        // Prompt lines type character by character; output lines appear whole.
        if (line.cls === 't-prompt') {
          var c = 0;
          var typeChar = function () {
            el.textContent = line.text.slice(0, ++c);
            if (c < line.text.length) window.setTimeout(typeChar, 26);
            else window.setTimeout(playLine, line.pause || 200);
          };
          typeChar();
        } else {
          el.textContent = line.text;
          window.setTimeout(playLine, line.pause || 160);
        }
      };

      // Only start once the terminal is actually on screen.
      var start = function () {
        term.innerHTML = '';
        term.appendChild(caret);
        playLine();
      };

      if ('IntersectionObserver' in window) {
        var termObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            termObs.disconnect();
            window.setTimeout(start, 350);
          });
        }, { threshold: 0.25 });
        termObs.observe(term);
      } else {
        start();
      }
    }
  }

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
