/* LetterCracker — shared.js
   Injects: visitor bar, navbar, footer, lead popup, scroll-to-top, theme switcher
   Phase 1: All lettercracker.com → lettercracker.info
   Phase 3: Navbar is position:sticky (handled in style.css); JS adds .scrolled class
   Note: The inline theme-flash script lives in each HTML <head> — this file
         also sets the theme on DOMContentLoaded to keep buttons in sync.
*/

// ===================== THEME KEY =====================
var THEME_KEY = 'lc_theme';

// ===================== GEO / IP DETECTION =====================
function fetchVisitorGeo() {
  var cached = sessionStorage.getItem('lc_geo');
  if (cached) { try { return Promise.resolve(JSON.parse(cached)); } catch(e) {} }

  // Primary: ip-api.com
  return fetch('https://ip-api.com/json/?fields=status,query,city,regionName,country,org')
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.status === 'success') {
        var geo = { ip: d.query||'—', city: d.city||'', region: d.regionName||'', country: d.country||'', isp: d.org||'' };
        sessionStorage.setItem('lc_geo', JSON.stringify(geo));
        return geo;
      }
      throw new Error('ip-api failed');
    })
    .catch(function(){
      // Fallback: ipapi.co
      return fetch('https://ipapi.co/json/')
        .then(function(r){ return r.json(); })
        .then(function(d){
          var geo = { ip: d.ip||'—', city: d.city||'', region: d.region||'', country: d.country_name||'', isp: d.org||'' };
          sessionStorage.setItem('lc_geo', JSON.stringify(geo));
          return geo;
        })
        .catch(function(){
          return { ip:'—', city:'—', region:'—', country:'—', isp:'—' };
        });
    });
}

// ===================== VISITOR BAR INJECTION =====================
function injectVisitorBar() {
  var bar = document.getElementById('visitorBar');
  if (!bar) return;
  fetchVisitorGeo().then(function(geo) {
    var parts = [geo.city, geo.region, geo.country].filter(Boolean);
    var loc   = parts.join(', ') || '—';
    bar.innerHTML =
      '<div class="visitor-bar-inner">' +
        '<span class="live-dot"></span>' +
        '<span>Your IP &#8212; <strong>' + geo.ip + '</strong> &nbsp;|&nbsp; Location &#8212; <strong>' + loc + '</strong></span>' +
      '</div>';
  });
}

// ===================== NAVBAR HTML =====================
// PHASE 1: All hrefs already relative — footer domain corrected below
var NAV_HTML =
'<nav class="navbar" id="navbar">' +
  '<div class="nav-inner">' +
    '<a href="index.html" class="logo">' +
      '<span class="logo-icon">L&#10216;C&#10217;</span>' +
      '<span class="logo-text">LetterCracker</span>' +
    '</a>' +
    '<button class="hamburger" id="hamburger" aria-label="Open menu">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
    '<ul class="nav-links" id="navLinks">' +
      '<li><a href="index.html" id="navHome">Unscrambler</a></li>' +
      '<li class="dropdown">' +
        '<a href="#" class="dropdown-toggle">Tools &#9660;</a>' +
        '<ul class="dropdown-menu">' +
          '<li><a href="anagram.html">Anagram Solver</a></li>' +
          '<li><a href="wordle.html">Wordle Solver</a></li>' +
          '<li><a href="dictionary.html">Dictionary Check</a></li>' +
          '<li><a href="random-word.html">Random Word</a></li>' +
          '<li><a href="word-scramble.html">Word Scramble Game</a></li>' +
        '</ul>' +
      '</li>' +
      '<li><a href="blog.html">Blog</a></li>' +
      '<li><a href="about.html">About</a></li>' +
      '<li><a href="contact.html">Contact</a></li>' +
      /* Admin link intentionally hidden from public navbar — access via /admin-login.html directly */
    '</ul>' +
    '<button id="lcSearchTrigger" aria-label="Search articles" title="Search articles (Ctrl+K)"' +
      ' style="background:none;border:1.5px solid var(--border);border-radius:9px;color:var(--text2);font-size:.85rem;cursor:pointer;padding:5px 12px;transition:.15s;display:flex;align-items:center;gap:5px;white-space:nowrap;"' +
      ' onmouseover="this.style.borderColor=\'var(--accent)\';this.style.color=\'var(--accent)\'"' +
      ' onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--text2)\'">' +
      '🔍 <span style="font-size:.78rem;">Search</span>' +
    '</button>' +
  '</div>' +
'</nav>';

// ===================== FOOTER HTML =====================
// PHASE 1: lettercracker.com → lettercracker.info in footer text
var FOOTER_HTML =
'<footer class="footer">' +
  '<div class="footer-inner">' +
    '<div class="footer-grid">' +
      '<div class="footer-brand">' +
        '<div class="logo"><span class="logo-icon">L&#10216;C&#10217;</span><span class="logo-text">LetterCracker</span></div>' +
        '<p>The fastest, smartest word unscrambler on the web. Free forever. Trusted by word game lovers worldwide.</p>' +
        '<div class="social-links">' +
          '<a href="#" aria-label="Twitter">&#120143;</a>' +
          '<a href="#" aria-label="Facebook">f</a>' +
          '<a href="#" aria-label="Instagram">&#9689;</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-col"><h4>Tools</h4><ul>' +
        '<li><a href="index.html">Word Unscrambler</a></li>' +
        '<li><a href="anagram.html">Anagram Solver</a></li>' +
        '<li><a href="wordle.html">Wordle Solver</a></li>' +
        '<li><a href="dictionary.html">Dictionary Check</a></li>' +
        '<li><a href="random-word.html">Random Word</a></li>' +
        '<li><a href="word-scramble.html">Word Scramble Game</a></li>' +
      '</ul></div>' +
      '<div class="footer-col"><h4>Company</h4><ul>' +
        '<li><a href="about.html">About Us</a></li>' +
        '<li><a href="blog.html">Blog</a></li>' +
        '<li><a href="contact.html">Contact</a></li>' +
        '<li><a href="sitemap.html">Sitemap</a></li>' +
      '</ul></div>' +
      '<div class="footer-col"><h4>Legal</h4><ul>' +
        '<li><a href="privacy.html">Privacy Policy</a></li>' +
        '<li><a href="terms.html">Terms of Service</a></li>' +
        '<li><a href="disclaimer.html">Disclaimer</a></li>' +
        '<li><a href="cookies.html">Cookie Policy</a></li>' +
      '</ul></div>' +
    '</div>' +
    '<div class="footer-bottom">' +
      '<p>&#169; <span id="footerYear">' + new Date().getFullYear() + '</span> LetterCracker.info &#8212; All rights reserved. Built with &#10084;&#65039; for word game lovers.</p>' +
      '<p class="footer-disclaimer">LetterCracker is not affiliated with Scrabble&#174;, Hasbro&#174;, or Mattel&#174;.</p>' +
      /* Issue 6: Green blinking status button — bottom-right of footer */
      '<div style="display:flex;justify-content:center;margin-top:.75rem;">' +
        '<a href="status.html" target="_blank" rel="noopener" class="status-footer-btn" aria-label="Check site status">' +
          '<span class="status-footer-dot"></span>' +
          'All Systems Operational' +
        '</a>' +
      '</div>' +
    '</div>' +
  '</div>' +
'</footer>';

// ===================== THEME SWITCHER HTML =====================
var THEME_SWITCHER_HTML =
'<div class="theme-switcher" id="themeSwitcher">' +
  '<button class="theme-btn theme-btn-active-display" id="themeBtnActive" title="Change Theme"></button>' +
  '<div class="theme-btn-list">' +
    '<button class="theme-btn" data-theme="dark"  title="Dark">&#127761;</button>' +
    '<button class="theme-btn" data-theme="light" title="Light">&#9728;&#65039;</button>' +
    '<button class="theme-btn" data-theme="ocean" title="Ocean">&#127754;</button>' +
    '<button class="theme-btn" data-theme="green" title="Green">&#127807;</button>' +
    '<button class="theme-btn" data-theme="red"   title="Red">&#128293;</button>' +
  '</div>' +
'</div>';

// ===================== SCROLL TO TOP =====================
var SCROLL_TOP_HTML = '<button id="scrollTopBtn" aria-label="Scroll to top" title="Back to top">&#8593;</button>';

// ===================== COOKIE BANNER =====================
var COOKIE_HTML =
'<div class="cookie-banner" id="cookieBanner" style="display:none">' +
  '<div class="cookie-inner">' +
    '<p>&#127850; We use cookies to enhance your experience. <a href="cookies.html">Learn more</a></p>' +
    '<div class="cookie-btns">' +
      '<button onclick="acceptCookies()">Accept All</button>' +
      '<button onclick="declineCookies()" class="outline-btn">Decline</button>' +
    '</div>' +
  '</div>' +
'</div>';

// ===================== LEAD CAPTURE POPUP =====================
var POPUP_HTML =
'<div class="lead-overlay" id="leadOverlay" style="display:none">' +
  '<div class="lead-popup" id="leadPopup">' +
    '<button class="lead-close" id="leadClose" aria-label="Close">&#10005;</button>' +
    '<div class="lead-header">' +
      '<div class="lead-badge">&#127919; Limited Time</div>' +
      '<h2 class="lead-title">Unlock Your <span>Word Game</span> Superpowers!</h2>' +
      '<p class="lead-sub">Join 50,000+ word game enthusiasts. Get tips, tricks &amp; exclusive word lists &#8212; free.</p>' +
    '</div>' +
    '<div class="popup-ad-slot ads-hidden" id="popupAdSlot">' +
      '<div class="ad-placeholder" style="min-height:50px;font-size:0.7rem;margin-bottom:8px;">Ad</div>' +
    '</div>' +
    '<div class="lead-form" id="leadForm">' +
      '<div class="lead-field">' +
        '<label>Full Name *</label>' +
        '<input type="text" id="popupName" placeholder="Your name" autocomplete="name">' +
      '</div>' +
      '<div class="lead-field">' +
        '<label>Email Address *</label>' +
        '<input type="email" id="popupEmail" placeholder="you@email.com" autocomplete="email">' +
      '</div>' +
      '<div class="lead-field">' +
        '<label>WhatsApp / Mobile</label>' +
        '<input type="tel" id="popupPhone" placeholder="+1 234 567 8900" autocomplete="tel">' +
      '</div>' +
      '<button class="lead-submit" id="leadSubmit">Get Free Access &#8594;</button>' +
      '<p class="lead-privacy">&#128274; 100% free. No spam. Unsubscribe anytime.</p>' +
    '</div>' +
    '<div class="lead-success" id="leadSuccess" style="display:none">' +
      '<div class="success-icon">&#127881;</div>' +
      '<h3>You\'re In!</h3>' +
      '<p>Welcome to the LetterCracker community. Check your inbox for your welcome gift!</p>' +
    '</div>' +
  '</div>' +
'</div>';

// ===================== INJECT EVERYTHING =====================
document.addEventListener('DOMContentLoaded', function() {
  injectFavicon();
  injectGA4();
  injectCanonical();
  injectSecurityMeta();
  registerServiceWorker();
  injectVisitorBar();

  var navSlot = document.getElementById('navSlot');
  if (navSlot) navSlot.innerHTML = NAV_HTML;

  var footerSlot = document.getElementById('footerSlot');
  if (footerSlot) footerSlot.innerHTML = FOOTER_HTML;

  var tsSlot = document.getElementById('themeSwitcherSlot');
  if (tsSlot) tsSlot.innerHTML = THEME_SWITCHER_HTML;

  document.body.insertAdjacentHTML('beforeend', SCROLL_TOP_HTML);
  document.body.insertAdjacentHTML('beforeend', COOKIE_HTML);
  document.body.insertAdjacentHTML('beforeend', POPUP_HTML);
  document.body.insertAdjacentHTML('beforeend', AD_POPUP_HTML);
  document.body.insertAdjacentHTML('afterbegin', SEARCH_BAR_HTML);

  initThemeSwitcher();
  initNavbar();
  initScrollTop();
  initCookieBanner();
  initLeadPopup();
  markActiveNavLink();
  initDropdowns();
  applyAdVisibility();
  initGlobalSearch();
  initAdPopup();
  initChatbot();
});

// ===================== THEME SWITCHER LOGIC =====================
var THEME_ICONS = { dark: '🌑', light: '☀️', ocean: '🌊', green: '🌿', red: '🔥' };
function initThemeSwitcher() {
  var saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  var activeBtn = document.getElementById('themeBtnActive');
  if (activeBtn) {
    activeBtn.textContent = THEME_ICONS[saved] || '🎨';
    activeBtn.title = 'Theme: ' + saved.charAt(0).toUpperCase() + saved.slice(1) + ' — hover to change';
  }

  document.querySelectorAll('.theme-btn[data-theme]').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.theme === saved);
    btn.addEventListener('click', function() {
      var t = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(THEME_KEY, t);
      document.querySelectorAll('.theme-btn[data-theme]').forEach(function(b) {
        b.classList.toggle('active', b.dataset.theme === t);
      });
      if (activeBtn) {
        activeBtn.textContent = THEME_ICONS[t] || '🎨';
        activeBtn.title = 'Theme: ' + t.charAt(0).toUpperCase() + t.slice(1) + ' — hover to change';
      }
    });
  });

  /* ── Mobile tap-to-expand (touch devices don't fire :hover) ── */
  var switcher = document.getElementById('themeSwitcher');
  if (activeBtn && switcher) {
    activeBtn.addEventListener('click', function(e) {
      if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 768) {
        e.stopPropagation();
        switcher.classList.toggle('lc-expanded');
      }
    });
    document.addEventListener('click', function(e) {
      if (switcher && !switcher.contains(e.target)) {
        switcher.classList.remove('lc-expanded');
      }
    });
    document.querySelectorAll('.theme-btn[data-theme]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setTimeout(function() { switcher.classList.remove('lc-expanded'); }, 250);
      });
    });
  }
}

// ===================== NAVBAR =====================
// PHASE 3: Navbar is position:sticky in CSS (style.css). JS adds .scrolled class for shadow/bg change.
function initNavbar() {
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  var navbar    = document.getElementById('navbar');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    // Close menu when a link is tapped on mobile
    navLinks.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  }

  if (navbar) {
    window.addEventListener('scroll', function() {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }
}

function initDropdowns() {
  document.querySelectorAll('.dropdown').forEach(function(dd) {
    var toggle = dd.querySelector('.dropdown-toggle');
    var menu   = dd.querySelector('.dropdown-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      var open = menu.style.display === 'block';
      document.querySelectorAll('.dropdown-menu').forEach(function(m) { m.style.display = 'none'; });
      menu.style.display = open ? 'none' : 'block';
    });
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest || !e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(function(m) { m.style.display = 'none'; });
    }
  });
}

function markActiveNavLink() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ===================== SCROLL TO TOP =====================
function initScrollTop() {
  var btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', function() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

// ===================== COOKIE BANNER =====================
function initCookieBanner() {
  var banner = document.getElementById('cookieBanner');
  if (!banner) return;
  if (!localStorage.getItem('lc_cookies')) {
    setTimeout(function() { banner.style.display = 'flex'; }, 2000);
  }
}

function acceptCookies() {
  localStorage.setItem('lc_cookies', 'accepted');
  var b = document.getElementById('cookieBanner');
  if (b) b.style.display = 'none';
}

function declineCookies() {
  localStorage.setItem('lc_cookies', 'declined');
  var b = document.getElementById('cookieBanner');
  if (b) b.style.display = 'none';
}

// ===================== LEAD CAPTURE POPUP =====================
function initLeadPopup() {
  var overlay   = document.getElementById('leadOverlay');
  var closeBtn  = document.getElementById('leadClose');
  var submitBtn = document.getElementById('leadSubmit');
  if (!overlay) return;

  function shouldShowPopup() {
    var raw        = localStorage.getItem('lc_popup_interval');
    var intervalMs = (raw === null || raw === '') ? 0 : parseInt(raw, 10);
    var safeInterval = isNaN(intervalMs) ? 0 : intervalMs;
    var lastShownRaw = localStorage.getItem('lc_popup_last_shown');
    var lastShown    = lastShownRaw ? parseInt(lastShownRaw, 10) : 0;
    if (safeInterval === 0) {
      return !sessionStorage.getItem('lc_popup_shown_session');
    }
    return (Date.now() - lastShown) >= safeInterval;
  }

  if (shouldShowPopup()) {
    setTimeout(function() {
      overlay.style.display = 'flex';
      localStorage.setItem('lc_popup_last_shown', Date.now().toString());
      sessionStorage.setItem('lc_popup_shown_session', '1');
    }, 8000);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      overlay.style.display = 'none';
      localStorage.setItem('lc_popup_last_shown', Date.now().toString());
    });
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      localStorage.setItem('lc_popup_last_shown', Date.now().toString());
    }
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var nameEl  = document.getElementById('popupName');
      var emailEl = document.getElementById('popupEmail');
      var phoneEl = document.getElementById('popupPhone');
      var name    = nameEl  ? nameEl.value.trim()  : '';
      var email   = emailEl ? emailEl.value.trim() : '';
      var phone   = phoneEl ? phoneEl.value.trim() : '';

      if (!name || !email) { alert('Please enter your name and email.'); return; }
      if (!/\S+@\S+\.\S+/.test(email)) { alert('Please enter a valid email.'); return; }

      submitBtn.textContent = 'Saving\u2026';
      submitBtn.disabled    = true;

      fetchVisitorGeo().then(function(geo) {
        var deviceInfo = getDeviceInfo();
        var leadData = {
          timestamp:    new Date().toISOString(),
          name:         name,
          email:        email,
          phone:        phone || '—',
          country:      geo.country,
          ip:           geo.ip,
          isp:          geo.isp,
          city:         geo.city,
          region:       geo.region,
          browser:      deviceInfo.browser,
          device_type:  deviceInfo.type,
          device_model: deviceInfo.model,
          os:           deviceInfo.os,
          referrer:     document.referrer || 'direct',
          page:         window.location.href,
          source:       'popup'
        };

        // Save to localStorage for admin panel
        var existing = [];
        try { existing = JSON.parse(localStorage.getItem('lc_leads') || '[]'); } catch(e) {}
        existing.push(leadData);
        localStorage.setItem('lc_leads', JSON.stringify(existing));

        // POST to Google Sheets Apps Script if URL is configured
        var sheetUrl = localStorage.getItem('lc_sheets_url');
        if (sheetUrl) {
          fetch(sheetUrl, {
            method:  'POST',
            mode:    'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(leadData)
          }).catch(function(){});
        }

        var formEl    = document.getElementById('leadForm');
        var successEl = document.getElementById('leadSuccess');
        if (formEl)    formEl.style.display    = 'none';
        if (successEl) successEl.style.display = 'block';
        localStorage.setItem('lc_lead_done', '1');
        setTimeout(function() { overlay.style.display = 'none'; }, 3000);
      });
    });
  }
}

function getDeviceInfo() {
  var ua      = navigator.userAgent;
  var type    = 'Desktop';
  var model   = '—';
  var os      = '—';
  var browser = '—';

  if (/Mobi|Android/i.test(ua))  type = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) type = 'Tablet';

  if (/iPhone/.test(ua))        { model = 'iPhone'; os = 'iOS'; }
  else if (/iPad/.test(ua))     { model = 'iPad'; os = 'iPadOS'; }
  else if (/Android/.test(ua))  { os = 'Android'; var m = ua.match(/Android [^;]+; ([^)]+)/); model = m ? m[1] : 'Android'; }
  else if (/Windows/.test(ua))  os = 'Windows';
  else if (/Mac/.test(ua))      os = 'macOS';
  else if (/Linux/.test(ua))    os = 'Linux';

  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua))                browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Edg\//.test(ua))                    browser = 'Edge';
  else if (/OPR\//.test(ua))                    browser = 'Opera';

  return { type: type, model: model, os: os, browser: browser };
}

// ===================== SECURITY META TAGS =====================
function injectSecurityMeta() {
  var metas = [
    { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
    { 'http-equiv': 'Referrer-Policy',         content: 'strict-origin-when-cross-origin' },
    { name: 'format-detection', content: 'telephone=no' }
  ];
  metas.forEach(function(attrs) {
    var m = document.createElement('meta');
    Object.keys(attrs).forEach(function(k) { m.setAttribute(k, attrs[k]); });
    document.head.appendChild(m);
  });
}


// ===================== SITE-WIDE SEARCH BAR =====================
var SEARCH_BAR_HTML =
'<div id="lcSearchBarWrap" style="display:none;position:fixed;top:0;left:0;right:0;z-index:8500;padding:.75rem 1rem;background:var(--surface);border-bottom:1px solid var(--border);box-shadow:0 4px 20px rgba(0,0,0,.25);">' +
  '<div style="max-width:680px;margin:0 auto;position:relative;">' +
    '<input type="text" id="lcGlobalSearch" placeholder="Search articles, guides, tips… (Ctrl+K)" autocomplete="off" maxlength="100"' +
      ' style="width:100%;padding:10px 44px 10px 42px;background:var(--bg2);border:2px solid var(--accent);border-radius:12px;color:var(--text1);font-family:\'DM Sans\',sans-serif;font-size:.9rem;outline:none;box-sizing:border-box;">' +
    '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:1rem;pointer-events:none;">🔍</span>' +
    '<button id="lcSearchClose" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text3);font-size:1.1rem;cursor:pointer;padding:2px 6px;" aria-label="Close search">✕</button>' +
    '<div id="lcGlobalResults" style="position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--surface);border:1.5px solid var(--border);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;max-height:380px;overflow-y:auto;z-index:8600;"></div>' +
  '</div>' +
'</div>';

function initGlobalSearch() {
  if (window.location.pathname.toLowerCase().indexOf('admin') !== -1) return;
  var wrap    = document.getElementById('lcSearchBarWrap');
  var input   = document.getElementById('lcGlobalSearch');
  var results = document.getElementById('lcGlobalResults');
  var closeBtn= document.getElementById('lcSearchClose');
  if (!wrap || !input) return;
  /* ── Pre-fetch registry immediately — search is instant, no network delay ── */
  var allArticles = [];
  var registryLoaded = false;

  function loadRegistry() {
    if (registryLoaded) return;
    var isArticlePage = window.location.pathname.indexOf('/seo-articles/') !== -1;
    var base = isArticlePage ? '../' : '';
    fetch(base + 'content-registry.json')
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(data) {
        var today = new Date().toISOString().slice(0, 10);
        allArticles = data.filter(function(a) { return a.releaseDate && a.releaseDate <= today; });
        registryLoaded = true;
      }).catch(function() {});
  }
  /* Pre-load immediately so search is instant when opened */
  setTimeout(loadRegistry, 500);

  function openSearch() {
    wrap.style.display = 'block';
    setTimeout(function() { input.focus(); input.select(); }, 60);
  }
  function closeSearch() {
    wrap.style.display = 'none';
    if (results) results.style.display = 'none';
    input.value = '';
  }

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape' && wrap.style.display !== 'none') closeSearch();
  });
  var trigger = document.getElementById('lcSearchTrigger');
  if (trigger) trigger.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  document.addEventListener('click', function(e) {
    if (wrap.style.display !== 'none' && !wrap.contains(e.target) && e.target.id !== 'lcSearchTrigger') closeSearch();
  });

  function doSearch(q) {
    if (!results) return;
    q = (q || '').trim().toLowerCase();
    if (!q) { results.style.display = 'none'; return; }
    var base = window.location.pathname.indexOf('/seo-articles/') !== -1 ? '../' : '';
    var matches = allArticles.filter(function(a) {
      return (a.title||'').toLowerCase().indexOf(q) !== -1 ||
             (a.metaDescription||'').toLowerCase().indexOf(q) !== -1 ||
             (Array.isArray(a.tags) ? a.tags.join(' ') : '').toLowerCase().indexOf(q) !== -1 ||
             (a.category||'').toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
    if (!matches.length) {
      results.innerHTML = '<div style="padding:1rem 1.25rem;font-size:.85rem;color:var(--text3);">No articles found for <strong>' + q + '</strong></div>';
      results.style.display = 'block'; return;
    }
    results.innerHTML = matches.map(function(a) {
      var url = base + 'seo-articles/' + (a.slug||'') + '.html';
      var cat = (a.category||'article'); cat = cat.charAt(0).toUpperCase() + cat.slice(1);
      return '<a href="' + url + '" onclick="document.getElementById(\'lcSearchBarWrap\').style.display=\'none\'" ' +
        'style="display:flex;gap:10px;align-items:flex-start;padding:.85rem 1.25rem;text-decoration:none;color:var(--text1);border-bottom:.5px solid var(--border);transition:.15s;" ' +
        'onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'\'">' +
          '<span style="font-size:1.1rem;flex-shrink:0;margin-top:2px;">📄</span>' +
          '<div><div style="font-size:.84rem;font-weight:700;line-height:1.35;">' + (a.title||'') + '</div>' +
          '<div style="font-size:.71rem;color:var(--text3);margin-top:2px;">' + cat + (a.releaseDate?' · '+a.releaseDate:'') + '</div></div>' +
        '</a>';
    }).join('') +
    '<div style="padding:.55rem 1.25rem;font-size:.7rem;color:var(--text3);">' + matches.length + ' result' + (matches.length!==1?'s':'') +
    ' · Press <kbd style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-size:.68rem;">Esc</kbd> to close</div>';
    results.style.display = 'block';
  }

  input.addEventListener('input', function() { doSearch(this.value); });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && results && results.querySelector('a')) results.querySelector('a').click();
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.pathname.indexOf('admin') === -1) {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  }
}

// ===================== CANONICAL TAG INJECTION =====================
function injectCanonical() {
  if (document.querySelector('link[rel="canonical"]')) return;
  var link = document.createElement('link');
  link.rel  = 'canonical';
  link.href = window.location.href.split('?')[0].split('#')[0];
  document.head.appendChild(link);
}


function injectGA4() {
  var gaId = (localStorage.getItem('lc_ga_id') || '').trim();
  if (!gaId || gaId === 'G-XXXXXXXXXX') return;
  // Skip on admin pages
  if (window.location.pathname.indexOf('admin') !== -1) return;
  // Don't inject twice
  if (document.querySelector('script[data-lc-ga4]')) return;
  var s1 = document.createElement('script');
  s1.async = true;
  s1.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
  s1.setAttribute('data-lc-ga4', '1');
  document.head.appendChild(s1);
  var s2 = document.createElement('script');
  s2.setAttribute('data-lc-ga4', '1');
  s2.textContent = 'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","' + gaId.replace(/"/g, '') + '");';
  document.head.appendChild(s2);
}

// ===================== FAVICON INJECTION =====================
function injectFavicon() {
  if (document.querySelector('link[rel="icon"]')) return; // page already has one
  var link = document.createElement('link');
  link.rel  = 'icon';
  link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔤</text></svg>";
  document.head.appendChild(link);
}


// ===================== CHATBOT (Lexi) =====================
// Defined directly here — same pattern as lead popup. No external file needed.
var CHATBOT_CSS =
'<style id="lc-chatbot-css">' +
'#lcChatBtn{position:fixed;bottom:24px;right:90px;width:52px;height:52px;border-radius:50%;background:var(--accent);color:#fff;border:none;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.35);z-index:8000;transition:.2s;display:flex;align-items:center;justify-content:center;}' +
'#lcChatBtn:hover{transform:scale(1.08);}' +
'#lcChatBtn .lc-notif{position:absolute;top:-3px;right:-3px;width:13px;height:13px;background:#ff3b30;border-radius:50%;border:2px solid var(--bg);display:none;}' +
'#lcChatWin{position:fixed;bottom:90px;right:24px;width:340px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 110px);background:var(--surface);border:1px solid var(--border);border-radius:20px;box-shadow:0 16px 60px rgba(0,0,0,.4);z-index:8001;display:none;flex-direction:column;overflow:hidden;}' +
'#lcChatWin.lc-open{display:flex;animation:lcSlideUp .22s ease;}' +
'@keyframes lcSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
'.lc-head{background:var(--accent);padding:11px 14px;display:flex;align-items:center;gap:9px;flex-shrink:0;}' +
'.lc-av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1rem;}' +
'.lc-head-info{flex:1;}' +
'.lc-bot-name{color:#fff;font-weight:700;font-size:.88rem;font-family:"Syne",sans-serif;}' +
'.lc-bot-status{color:rgba(255,255,255,.8);font-size:.68rem;}' +
'.lc-close-btn{background:none;border:none;color:rgba(255,255,255,.85);font-size:1.15rem;cursor:pointer;padding:2px 6px;border-radius:6px;}' +
'.lc-close-btn:hover{background:rgba(255,255,255,.15);}' +
'#lcChatMsgs{flex:1;overflow-y:auto;padding:12px 11px;display:flex;flex-direction:column;gap:9px;}' +
'.lc-m{max-width:83%;padding:8px 12px;border-radius:15px;font-size:.81rem;line-height:1.55;word-break:break-word;}' +
'.lc-m.bot{background:var(--surface2);color:var(--text1);border-bottom-left-radius:4px;align-self:flex-start;}' +
'.lc-m.usr{background:var(--accent);color:#fff;border-bottom-right-radius:4px;align-self:flex-end;}' +
'.lc-m a{color:var(--accent);}' +
'.lc-m.usr a{color:#fff;}' +
'.lc-dot{display:flex;gap:4px;align-items:center;padding:9px 13px;background:var(--surface2);border-radius:15px;border-bottom-left-radius:4px;align-self:flex-start;width:50px;}' +
'.lc-dot span{width:6px;height:6px;background:var(--text3);border-radius:50%;animation:lcB 1.2s infinite;}' +
'.lc-dot span:nth-child(2){animation-delay:.2s;}.lc-dot span:nth-child(3){animation-delay:.4s;}' +
'@keyframes lcB{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}' +
'.lc-qb{display:flex;flex-wrap:wrap;gap:5px;padding:0 11px 7px;}' +
'.lc-q{padding:4px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;font-size:.71rem;color:var(--text2);cursor:pointer;transition:.15s;font-family:"DM Sans",sans-serif;}' +
'.lc-q:hover{border-color:var(--accent);color:var(--accent);}' +
'.lc-inp-row{display:flex;gap:6px;padding:9px 11px;border-top:1px solid var(--border);flex-shrink:0;}' +
'#lcChatInp{flex:1;padding:7px 11px;background:var(--bg2);border:1.5px solid var(--border);border-radius:9px;color:var(--text1);font-family:"DM Sans",sans-serif;font-size:.82rem;outline:none;}' +
'#lcChatInp:focus{border-color:var(--accent);}' +
'#lcChatSnd{padding:7px 13px;background:var(--accent);color:#fff;border:none;border-radius:9px;font-weight:700;font-size:.82rem;cursor:pointer;}' +
'#lcChatSnd:hover{opacity:.88;}' +
'.lc-pw{text-align:center;font-size:.61rem;color:var(--text3);padding:3px 0 5px;}' +
'</style>';

var CHATBOT_HTML =
'<button id="lcChatBtn" title="Chat with Lexi" aria-label="Chat">' +
  '💬<span class="lc-notif"></span>' +
'</button>' +
'<div id="lcChatWin" role="dialog" aria-label="Chat with Lexi">' +
  '<div class="lc-head">' +
    '<div class="lc-av">🔤</div>' +
    '<div class="lc-head-info">' +
      '<div class="lc-bot-name">Lexi</div>' +
      '<div class="lc-bot-status">● Online — LetterCracker Assistant</div>' +
    '</div>' +
    '<button class="lc-close-btn" id="lcChatX">✕</button>' +
  '</div>' +
  '<div id="lcChatMsgs"></div>' +
  '<div class="lc-qb" id="lcQB"></div>' +
  '<div class="lc-inp-row">' +
    '<input type="text" id="lcChatInp" placeholder="Type a message…" autocomplete="off" maxlength="300">' +
    '<button id="lcChatSnd">Send</button>' +
  '</div>' +
  '<div class="lc-pw">Powered by LetterCracker</div>' +
'</div>';

var LC_KB = [
  {p:['hello','hi','hey','good morning','good evening','howdy'],r:'Hi there! 👋 I\'m Lexi, your LetterCracker assistant. I can help you find the right word tool or answer word game questions. What can I help you with today?'},
  {p:['unscramble','scrambled','jumble','rearrange letters','word finder','find words'],r:'Our <a href="index.html">Word Unscrambler</a> is perfect for that! Enter up to 45 letters and it finds every valid word instantly — sorted by Scrabble score. 🔤'},
  {p:['wordle','daily puzzle','5 letter','wordle solver','wordle help'],r:'Stuck on Wordle? Our <a href="wordle.html">Wordle Solver</a> narrows down answers using your green, yellow, and grey clues. 🟩'},
  {p:['anagram','same letters','anagram solver'],r:'Our <a href="anagram.html">Anagram Solver</a> finds every word from rearranging your letters. Great for Scrabble and crosswords! ♻️'},
  {p:['scrabble','high score','scrabble words','tile score'],r:'For Scrabble, our <a href="index.html">Word Unscrambler</a> sorts results by point value so your highest-scoring play always appears first! 🏆'},
  {p:['dictionary','definition','meaning','define','look up'],r:'Our <a href="dictionary.html">Dictionary</a> lets you look up definitions for any word. 📖'},
  {p:['word game','game','play','word scramble','word puzzle'],r:'Try our <a href="word-scramble.html">Word Scramble Game</a> — Easy, Medium, and Hard difficulty with a timer! 🎮'},
  {p:['random word','random','word of the day'],r:'Check our <a href="random-word.html">Random Word Generator</a> for a surprise word with its definition! 🎲'},
  {p:['blog','article','guide','tips','strategy'],r:'We publish word game guides and Scrabble/Wordle tips regularly. Check our <a href="blog.html">Blog</a>! 📚'},
  {p:['contact','email','support','problem','bug','feedback'],r:'Use our <a href="contact.html">Contact Page</a> — we read every message and reply quickly! ✉️'},
  {p:['about','what is lettercracker','what is this site'],r:'LetterCracker is a free suite of word game tools — Unscrambler, Anagram Solver, Wordle Solver, Scramble Game, Dictionary and more. All free, no signup needed! <a href="about.html">Learn more →</a>'},
  {p:['free','cost','price','subscription'],r:'All LetterCracker tools are completely free — no subscription, no registration, no hidden costs. 🎉'},
  {p:['how many words','word list','database'],r:'Our database contains over 170,000 valid English words. You can unscramble up to 45 letters at once!'},
  {p:['status','down','offline','not working'],r:'Check our <a href="status.html">Status Page</a> for real-time uptime of all tools. 🟢'},
  {p:['subscribe','newsletter','updates','notify','sign up','get notified'],r:'I can add you to our updates list right here! What\'s your name?',a:'lead'},
  {p:['thank','thanks','thank you','great','awesome','perfect'],r:'Happy to help! Anything else I can assist you with? 😊'},
  {p:['bye','goodbye','see you','exit'],r:'Goodbye! Enjoy your word games! 👋'}
];

var LC_FALLBACKS = [
  'I\'m not sure about that, but I can help you find the right word tool! Looking to unscramble letters, solve Wordle, or something else?',
  'Try our <a href="index.html">Word Unscrambler</a> or <a href="contact.html">contact us</a> directly for more help!',
  'Check out our <a href="blog.html">blog articles</a> — we cover lots of word game topics there!',
  'Could you rephrase that? I can help with Wordle, Scrabble, anagrams, definitions, and more!'
];

function initChatbot() {
  if (window.location.pathname.toLowerCase().indexOf('admin') !== -1) return;
  if (document.getElementById('lcChatBtn')) return; /* already mounted */

  document.body.insertAdjacentHTML('beforeend', CHATBOT_CSS + CHATBOT_HTML);

  var btn    = document.getElementById('lcChatBtn');
  var win    = document.getElementById('lcChatWin');
  var xBtn   = document.getElementById('lcChatX');
  var msgs   = document.getElementById('lcChatMsgs');
  var inp    = document.getElementById('lcChatInp');
  var sndBtn = document.getElementById('lcChatSnd');
  var qb     = document.getElementById('lcQB');

  if (!btn || !win) return;

  var isOpen = false;
  var chatStarted = false;
  var leadState = {active:false,step:0,name:'',email:'',phone:''};

  function openChat() {
    isOpen = true;
    win.classList.add('lc-open');
    var notif = btn.querySelector('.lc-notif');
    if (notif) notif.style.display = 'none';
    sessionStorage.setItem('lc_chat_opened','1');
    if (!chatStarted) { chatStarted = true; greet(); }
    setTimeout(function(){if(inp)inp.focus();},250);
  }
  function closeChat() { isOpen = false; win.classList.remove('lc-open'); }

  btn.addEventListener('click', function(){ isOpen ? closeChat() : openChat(); });
  if (xBtn) xBtn.addEventListener('click', closeChat);

  function addMsg(html, cls) {
    var d = document.createElement('div');
    d.className = 'lc-m ' + cls;
    d.innerHTML = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    var t = document.createElement('div');
    t.className = 'lc-dot'; t.id = 'lcDot';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
  }
  function hideTyping() { var t=document.getElementById('lcDot'); if(t)t.remove(); }

  function botReply(html) {
    showTyping();
    setTimeout(function(){ hideTyping(); addMsg(html,'bot'); }, 550 + Math.random()*250);
  }

  function setQB(items) {
    qb.innerHTML = '';
    (items||[]).forEach(function(it){
      var b = document.createElement('button');
      b.className = 'lc-q'; b.textContent = it.label;
      b.addEventListener('click', function(){
        addMsg(lcEsc(it.label),'usr'); qb.innerHTML=''; handleInp(it.value||it.label);
      });
      qb.appendChild(b);
    });
  }

  function greet() {
    setTimeout(function(){
      botReply('👋 Hi! I\'m <strong>Lexi</strong>, your LetterCracker assistant. How can I help you?');
      setTimeout(function(){
        setQB([
          {label:'Unscramble letters',value:'unscramble'},
          {label:'Help with Wordle',value:'wordle'},
          {label:'Scrabble words',value:'scrabble words'},
          {label:'Find a definition',value:'dictionary'},
          {label:'Get updates',value:'subscribe'}
        ]);
      },900);
    },350);
  }

  function lcEsc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function isEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}

  function saveChatLead(name,email,phone){
    var leads=JSON.parse(localStorage.getItem('lc_leads')||'[]');
    var entry={id:Date.now().toString(),name:name,email:email,phone:phone||'',source:'chatbot',timestamp:new Date().toISOString(),page:window.location.href,referrer:document.referrer||''};
    leads.unshift(entry);localStorage.setItem('lc_leads',JSON.stringify(leads));
    var url=localStorage.getItem('lc_sheets_url');
    if(url)fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({type:'lead'},entry))}).catch(function(){});
  }

  function handleLeadStep(text){
    if(leadState.step===1){
      if(text.trim().length<2){botReply('Please tell me your name (at least 2 characters).');return;}
      leadState.name=text.trim();leadState.step=2;
      botReply('Nice to meet you, <strong>'+lcEsc(leadState.name)+'</strong>! What\'s your email address?');return;
    }
    if(leadState.step===2){
      if(!isEmail(text.trim())){botReply('That doesn\'t look valid. Please try again (e.g. name@example.com).');return;}
      leadState.email=text.trim();leadState.step=3;
      botReply('Got it! You can also share your phone number, or type <strong>skip</strong> to continue.');return;
    }
    if(leadState.step===3){
      if(text.toLowerCase()!=='skip')leadState.phone=text.trim();
      saveChatLead(leadState.name,leadState.email,leadState.phone);
      leadState={active:false,step:0,name:'',email:'',phone:''};
      botReply('✅ You\'re all set, <strong>'+lcEsc(leadState.name||'there')+'</strong>! We\'ll keep you updated. Anything else I can help with?');
      setQB([{label:'Try Word Unscrambler',value:'unscramble'},{label:'Try Wordle Solver',value:'wordle'},{label:'Browse articles',value:'blog'}]);
    }
  }

  function handleInp(text){
    if(!text||!text.trim())return;
    qb.innerHTML='';
    if(leadState.active){handleLeadStep(text);return;}
    var lower=text.toLowerCase().replace(/[^\w\s]/g,'');
    var matched=null;
    for(var i=0;i<LC_KB.length;i++){
      var entry=LC_KB[i];
      for(var j=0;j<entry.p.length;j++){
        if(lower.indexOf(entry.p[j])!==-1){matched=entry;break;}
      }
      if(matched)break;
    }
    if(matched){
      if(matched.a==='lead'){leadState.active=true;leadState.step=1;botReply(matched.r);return;}
      botReply(matched.r);
      setTimeout(function(){setQB([{label:'🔤 Unscramble',value:'unscramble'},{label:'🟩 Wordle Solver',value:'wordle'},{label:'📖 Dictionary',value:'dictionary'},{label:'📬 Get updates',value:'subscribe'}]);},850);
      return;
    }
    botReply(LC_FALLBACKS[Math.floor(Math.random()*LC_FALLBACKS.length)]);
  }

  function send(){
    var val=(inp.value||'').trim();
    if(!val)return;
    addMsg(lcEsc(val),'usr');
    inp.value='';qb.innerHTML='';
    handleInp(val);
  }

  sndBtn.addEventListener('click',send);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')send();});

  /* Notification dot after 10 seconds on first visit */
  if(!sessionStorage.getItem('lc_chat_opened')){
    setTimeout(function(){
      if(!isOpen){var n=btn.querySelector('.lc-notif');if(n)n.style.display='block';}
    },10000);
  }
}

// ===================== AD POPUP HTML =====================
var AD_POPUP_HTML =
'<div class="ad-pop-overlay" id="adPopOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9998;display:none;align-items:center;justify-content:center;padding:1rem;">' +
  '<div class="ad-pop-box" id="adPopBox" style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:0;max-width:480px;width:100%;position:relative;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.5);">' +
    '<button id="adPopClose" style="position:absolute;top:12px;right:14px;background:var(--surface2);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;font-size:1rem;cursor:pointer;color:var(--text2);z-index:2;display:none;">&#10005;</button>' +
    '<div id="adPopImageWrap" style="display:none;width:100%;max-height:220px;overflow:hidden;">' +
      '<img id="adPopImage" src="" alt="" style="width:100%;object-fit:cover;display:block;">' +
    '</div>' +
    '<div style="padding:1.5rem 1.5rem 1.25rem;">' +
      '<div id="adPopHeadline" style="font-family:\'Syne\',sans-serif;font-size:1.2rem;font-weight:800;color:var(--text1);margin-bottom:.5rem;"></div>' +
      '<div id="adPopBody" style="font-size:.88rem;color:var(--text2);line-height:1.65;margin-bottom:1rem;"></div>' +
      '<div id="adPopCustom" style="margin-bottom:.75rem;"></div>' +
      '<a id="adPopCta" href="#" target="_blank" rel="noopener" style="padding:10px 22px;background:var(--accent);color:#fff;border-radius:10px;font-weight:700;font-size:.875rem;text-decoration:none;display:none;">Learn More</a>' +
    '</div>' +
  '</div>' +
'</div>';

// ===================== AD POPUP LOGIC =====================
function initAdPopup() {
  if (window.location.pathname.indexOf('admin') !== -1) return false;

  var enabled = localStorage.getItem('lc_adpop_enabled') === '1';
  if (!enabled) return false;

  // Date range check
  var today    = new Date().toISOString().slice(0, 10);
  var startDt  = localStorage.getItem('lc_adpop_start_date') || '';
  var endDt    = localStorage.getItem('lc_adpop_end_date')   || '';
  if (startDt && today < startDt) return false;
  if (endDt   && today > endDt)   return false;

  // Target pages check
  var targetRaw = localStorage.getItem('lc_adpop_target') || 'all';
  if (targetRaw !== 'all') {
    var targets  = targetRaw.split(',').map(function(t){ return t.trim().toLowerCase(); });
    var pagePath = window.location.pathname.toLowerCase();
    var matches  = targets.some(function(t){ return pagePath.indexOf(t) !== -1; });
    if (!matches) return false;
  }

  // Frequency check
  var freq      = localStorage.getItem('lc_adpop_frequency') || 'session';
  var lastShown = parseInt(localStorage.getItem('lc_adpop_last_shown') || '0', 10);
  var now       = Date.now();
  if (freq === 'session' && sessionStorage.getItem('lc_adpop_shown')) return false;
  if (freq === 'daily'   && (now - lastShown) < 86400000)  return false;
  if (freq === 'weekly'  && (now - lastShown) < 604800000) return false;

  // Require at least some content configured
  var headline   = localStorage.getItem('lc_adpop_headline')    || '';
  var bodyText   = localStorage.getItem('lc_adpop_body')        || '';
  var imageUrl   = localStorage.getItem('lc_adpop_image_url')   || '';
  var customHtml = localStorage.getItem('lc_adpop_custom_html') || '';
  if (!headline && !bodyText && !customHtml && !imageUrl) return false;

  var ctaText    = localStorage.getItem('lc_adpop_cta_text')    || 'Learn More';
  var ctaUrl     = localStorage.getItem('lc_adpop_cta_url')     || '';
  var closeDelay = parseInt(localStorage.getItem('lc_adpop_close_delay') || '0', 10);

  var overlay = document.getElementById('adPopOverlay');
  if (!overlay) return false;

  // Populate content
  var imgWrap = document.getElementById('adPopImageWrap');
  var imgEl   = document.getElementById('adPopImage');
  if (imageUrl && imgWrap && imgEl) {
    imgEl.src = imageUrl;
    imgWrap.style.display = 'block';
    imgEl.onerror = function(){ imgWrap.style.display = 'none'; };
  }
  var hl = document.getElementById('adPopHeadline');
  if (hl) hl.textContent = headline;
  var bd = document.getElementById('adPopBody');
  if (bd) bd.textContent = bodyText;
  var cu = document.getElementById('adPopCustom');
  if (cu && customHtml) cu.innerHTML = customHtml;

  // CTA button — only show if a real URL is configured
  var cta = document.getElementById('adPopCta');
  if (cta) {
    if (ctaUrl && ctaUrl !== '#' && ctaUrl !== '') {
      cta.textContent   = ctaText;
      cta.href          = ctaUrl;
      cta.style.display = 'inline-block';
    } else {
      cta.style.display = 'none';
    }
  }

  // Close button with optional delay
  var closeBtn = document.getElementById('adPopClose');
  if (closeBtn) {
    if (closeDelay > 0) {
      setTimeout(function(){ closeBtn.style.display = 'flex'; }, closeDelay * 1000);
    } else {
      closeBtn.style.display = 'flex';
    }
    closeBtn.addEventListener('click', function(){ overlay.style.display = 'none'; });
  }
  overlay.addEventListener('click', function(e){
    if (e.target === overlay) overlay.style.display = 'none';
  });

  // Record shown timestamps
  localStorage.setItem('lc_adpop_last_shown', now.toString());
  sessionStorage.setItem('lc_adpop_shown', '1');

  // Hand off to trigger — popup is confirmed ready to show
  triggerAdPopup();
  return true;
}

function showAdPopupNow() {
  var overlay = document.getElementById('adPopOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function triggerAdPopup() {
  var trigger   = localStorage.getItem('lc_adpop_trigger')    || 'delay';
  var delayS    = parseInt(localStorage.getItem('lc_adpop_delay') || '5', 10);
  var scrollPct = parseInt(localStorage.getItem('lc_adpop_scroll_pct') || '50', 10);

  if (trigger === 'delay') {
    setTimeout(showAdPopupNow, Math.max(0, delayS) * 1000);
  } else if (trigger === 'scroll') {
    var fired = false;
    window.addEventListener('scroll', function onScroll() {
      if (fired) return;
      var scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= scrollPct) {
        fired = true;
        showAdPopupNow();
        window.removeEventListener('scroll', onScroll);
      }
    }, { passive: true });
  } else if (trigger === 'exit') {
    var fired = false;
    document.addEventListener('mouseleave', function onLeave(e) {
      if (fired || e.clientY > 20) return;
      fired = true;
      showAdPopupNow();
      document.removeEventListener('mouseleave', onLeave);
    });
  }
}


function applyAdVisibility() {
  var adsOn    = localStorage.getItem('lc_ads_enabled')    === '1';
  var mapOn    = localStorage.getItem('lc_map_enabled')    === '1';
  var amazonOn = localStorage.getItem('lc_amazon_enabled') === '1';

  document.querySelectorAll('.ad-slot, .ads-hidden, .popup-ad-slot').forEach(function(el) {
    el.style.display = adsOn ? 'block' : 'none';
  });

  var mapSection = document.getElementById('worldMapSection');
  if (mapSection) mapSection.style.display = mapOn ? 'block' : 'none';

  document.querySelectorAll('.amazon-section').forEach(function(el) {
    el.style.display = amazonOn ? 'block' : 'none';
  });
}
