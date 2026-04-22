/* LetterCracker — shared.js
   Injects: visitor bar, navbar, footer, lead popup, scroll-to-top, theme switcher sync
   Loaded on every page via <script src="shared.js"></script>
*/

// ===================== THEME SWITCHER =====================
const THEME_KEY = 'lc_theme';
(function () {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

// ===================== GEO / IP DETECTION =====================
async function fetchVisitorGeo() {
  const cached = sessionStorage.getItem('lc_geo');
  if (cached) return JSON.parse(cached);
  try {
    const r = await fetch('https://ipapi.co/json/');
    const d = await r.json();
    const geo = { ip: d.ip || '—', city: d.city || '', region: d.region || '', country: d.country_name || '', isp: d.org || '' };
    sessionStorage.setItem('lc_geo', JSON.stringify(geo));
    return geo;
  } catch {
    return { ip: '—', city: '—', region: '—', country: '—', isp: '—' };
  }
}

// ===================== VISITOR BAR INJECTION =====================
function injectVisitorBar() {
  const bar = document.getElementById('visitorBar');
  if (!bar) return;
  fetchVisitorGeo().then(geo => {
    const loc = [geo.city, geo.region, geo.country].filter(Boolean).join(', ');
    bar.innerHTML = `
      <div class="visitor-bar-inner">
        <span class="live-dot"></span>
        <span>Your IP — <strong>${geo.ip}</strong> &nbsp;|&nbsp; Location — <strong>${loc || '—'}</strong></span>
      </div>`;
  });
}

// ===================== NAVBAR HTML =====================
const NAV_HTML = `
<nav class="navbar" id="navbar">
  <div class="nav-inner">
    <a href="index.html" class="logo">
      <span class="logo-icon">L⟨C⟩</span>
      <span class="logo-text">LetterCracker</span>
    </a>
    <button class="hamburger" id="hamburger" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links" id="navLinks">
      <li><a href="index.html" id="navHome">Unscrambler</a></li>
      <li class="dropdown">
        <a href="#" class="dropdown-toggle">Tools ▾</a>
        <ul class="dropdown-menu">
          <li><a href="anagram.html">Anagram Solver</a></li>
          <li><a href="wordle.html">Wordle Solver</a></li>
          <li><a href="dictionary.html">Dictionary Check</a></li>
          <li><a href="random-word.html">Random Word</a></li>
          <li><a href="word-scramble.html">Word Scramble Game</a></li>
        </ul>
      </li>
      <li><a href="blog.html">Blog</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="contact.html">Contact</a></li>
      <li><a href="admin-login.html" class="btn-nav">Admin</a></li>
    </ul>
  </div>
</nav>`;

// ===================== FOOTER HTML =====================
const FOOTER_HTML = `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo"><span class="logo-icon">L⟨C⟩</span><span class="logo-text">LetterCracker</span></div>
        <p>The fastest, smartest word unscrambler on the web. Free forever. Trusted by word game lovers worldwide.</p>
        <div class="social-links">
          <a href="#" aria-label="Twitter">𝕏</a>
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="Instagram">◉</a>
        </div>
        <!-- Google Analytics placeholder -->
        <!-- GA_TAG_PLACEHOLDER -->
      </div>
      <div class="footer-col"><h4>Tools</h4><ul>
        <li><a href="index.html">Word Unscrambler</a></li>
        <li><a href="anagram.html">Anagram Solver</a></li>
        <li><a href="wordle.html">Wordle Solver</a></li>
        <li><a href="dictionary.html">Dictionary Check</a></li>
        <li><a href="random-word.html">Random Word</a></li>
        <li><a href="word-scramble.html">Word Scramble Game</a></li>
      </ul></div>
      <div class="footer-col"><h4>Company</h4><ul>
        <li><a href="about.html">About Us</a></li>
        <li><a href="blog.html">Blog</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="sitemap.html">Sitemap</a></li>
      </ul></div>
      <div class="footer-col"><h4>Legal</h4><ul>
        <li><a href="privacy.html">Privacy Policy</a></li>
        <li><a href="terms.html">Terms of Service</a></li>
        <li><a href="disclaimer.html">Disclaimer</a></li>
        <li><a href="cookies.html">Cookie Policy</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <p>© <span id="footerYear">${new Date().getFullYear()}</span> LetterCracker.com — All rights reserved. Built with ❤️ for word game lovers.</p>
      <p class="footer-disclaimer">LetterCracker is not affiliated with Scrabble®, Hasbro®, or Mattel®.</p>
    </div>
  </div>
</footer>`;

// ===================== THEME SWITCHER HTML =====================
const THEME_SWITCHER_HTML = `
<div class="theme-switcher" id="themeSwitcher">
  <button class="theme-btn" data-theme="dark" title="Dark">🌑</button>
  <button class="theme-btn" data-theme="light" title="Light">☀️</button>
  <button class="theme-btn" data-theme="ocean" title="Ocean">🌊</button>
  <button class="theme-btn" data-theme="green" title="Green">🌿</button>
  <button class="theme-btn" data-theme="red" title="Red">🔥</button>
</div>`;

// ===================== SCROLL TO TOP =====================
const SCROLL_TOP_HTML = `<button id="scrollTopBtn" aria-label="Scroll to top" title="Back to top">↑</button>`;

// ===================== COOKIE BANNER =====================
const COOKIE_HTML = `
<div class="cookie-banner" id="cookieBanner" style="display:none">
  <div class="cookie-inner">
    <p>🍪 We use cookies to enhance your experience. <a href="cookies.html">Learn more</a></p>
    <div class="cookie-btns">
      <button onclick="acceptCookies()">Accept All</button>
      <button onclick="declineCookies()" class="outline-btn">Decline</button>
    </div>
  </div>
</div>`;

// ===================== LEAD CAPTURE POPUP =====================
const POPUP_HTML = `
<div class="lead-overlay" id="leadOverlay" style="display:none">
  <div class="lead-popup" id="leadPopup">
    <button class="lead-close" id="leadClose" aria-label="Close">✕</button>
    <div class="lead-header">
      <div class="lead-badge">🎯 Limited Time</div>
      <h2 class="lead-title">Unlock Your <span>Word Game</span> Superpowers!</h2>
      <p class="lead-sub">Join 50,000+ word game enthusiasts. Get tips, tricks & exclusive word lists — free.</p>
    </div>
    <!-- Ad slot near CTA for visibility (Google-compliant: not overlapping button) -->
    <div class="popup-ad-slot ads-hidden" id="popupAdSlot">
      <!-- AdSense responsive unit here -->
      <div class="ad-placeholder" style="min-height:50px;font-size:0.7rem;margin-bottom:8px;">Ad</div>
    </div>
    <div class="lead-form" id="leadForm">
      <div class="lead-field">
        <label>Full Name *</label>
        <input type="text" id="popupName" placeholder="Your name" autocomplete="name">
      </div>
      <div class="lead-field">
        <label>Email Address *</label>
        <input type="email" id="popupEmail" placeholder="you@email.com" autocomplete="email">
      </div>
      <div class="lead-field">
        <label>WhatsApp / Mobile</label>
        <input type="tel" id="popupPhone" placeholder="+1 234 567 8900" autocomplete="tel">
      </div>
      <button class="lead-submit" id="leadSubmit">Get Free Access →</button>
      <p class="lead-privacy">🔒 100% free. No spam. Unsubscribe anytime.</p>
    </div>
    <div class="lead-success" id="leadSuccess" style="display:none">
      <div class="success-icon">🎉</div>
      <h3>You're In!</h3>
      <p>Welcome to the LetterCracker community. Check your inbox for your welcome gift!</p>
    </div>
  </div>
</div>`;

// ===================== INJECT EVERYTHING =====================
document.addEventListener('DOMContentLoaded', () => {
  // Inject visitor bar
  injectVisitorBar();

  // Inject navbar
  const navSlot = document.getElementById('navSlot');
  if (navSlot) navSlot.innerHTML = NAV_HTML;

  // Inject footer
  const footerSlot = document.getElementById('footerSlot');
  if (footerSlot) footerSlot.innerHTML = FOOTER_HTML;

  // Inject theme switcher
  const tsSlot = document.getElementById('themeSwitcherSlot');
  if (tsSlot) tsSlot.innerHTML = THEME_SWITCHER_HTML;

  // Inject scroll-to-top
  document.body.insertAdjacentHTML('beforeend', SCROLL_TOP_HTML);

  // Inject cookie banner
  document.body.insertAdjacentHTML('beforeend', COOKIE_HTML);

  // Inject lead popup
  document.body.insertAdjacentHTML('beforeend', POPUP_HTML);

  // Init all shared behaviors
  initThemeSwitcher();
  initNavbar();
  initScrollTop();
  initCookieBanner();
  initLeadPopup();
  markActiveNavLink();
  initDropdowns();

  // Show ads if admin enabled
  applyAdVisibility();
});

// ===================== THEME SWITCHER LOGIC =====================
function initThemeSwitcher() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === saved);
    btn.addEventListener('click', () => {
      const t = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(THEME_KEY, t);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
    });
  });
}

// ===================== NAVBAR =====================
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navbar = document.getElementById('navbar');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
  }
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }
}

function initDropdowns() {
  document.querySelectorAll('.dropdown').forEach(dd => {
    const toggle = dd.querySelector('.dropdown-toggle');
    const menu = dd.querySelector('.dropdown-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', e => {
      e.preventDefault();
      const open = menu.style.display === 'block';
      document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
      menu.style.display = open ? 'none' : 'block';
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
    }
  });
}

function markActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ===================== SCROLL TO TOP =====================
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===================== COOKIE BANNER =====================
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  if (!localStorage.getItem('lc_cookies')) {
    setTimeout(() => banner.style.display = 'flex', 2000);
  }
}
function acceptCookies() {
  localStorage.setItem('lc_cookies', 'accepted');
  const b = document.getElementById('cookieBanner');
  if (b) b.style.display = 'none';
}
function declineCookies() {
  localStorage.setItem('lc_cookies', 'declined');
  const b = document.getElementById('cookieBanner');
  if (b) b.style.display = 'none';
}

// ===================== LEAD CAPTURE POPUP =====================
function initLeadPopup() {
  const overlay = document.getElementById('leadOverlay');
  const closeBtn = document.getElementById('leadClose');
  const submitBtn = document.getElementById('leadSubmit');
  if (!overlay) return;

  // --- Frequency logic (admin-controlled) ---
  // lc_popup_interval: milliseconds between showings (0 = once per session)
  // lc_popup_last_shown: timestamp of last display
  // lc_lead_done: recorded on submit (for admin stats) but does NOT suppress re-display

  function shouldShowPopup() {
    // Issue 2 fix: popup always reappears for all visitors (including those who submitted)
    // Only the admin-set interval controls frequency — lc_lead_done no longer suppresses it

    const raw = localStorage.getItem('lc_popup_interval');
    // If key missing or null, treat as "once per session"
    const intervalMs = (raw === null || raw === '') ? 0 : parseInt(raw, 10);
    const safeInterval = isNaN(intervalMs) ? 0 : intervalMs;
    const lastShownRaw = localStorage.getItem('lc_popup_last_shown');
    const lastShown = lastShownRaw ? parseInt(lastShownRaw, 10) : 0;

    // 0 means "once per browser session only"
    if (safeInterval === 0) {
      return !sessionStorage.getItem('lc_popup_shown_session');
    }

    // Show if enough time has passed since last display
    return (Date.now() - lastShown) >= safeInterval;
  }

  if (shouldShowPopup()) {
    setTimeout(() => {
      overlay.style.display = 'flex';
      localStorage.setItem('lc_popup_last_shown', Date.now().toString());
      sessionStorage.setItem('lc_popup_shown_session', '1');
    }, 8000);
  }

  closeBtn?.addEventListener('click', () => {
    overlay.style.display = 'none';
    // Record dismiss time so interval resets from here
    localStorage.setItem('lc_popup_last_shown', Date.now().toString());
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      localStorage.setItem('lc_popup_last_shown', Date.now().toString());
    }
  });

  submitBtn?.addEventListener('click', async () => {
    const name = document.getElementById('popupName')?.value?.trim();
    const email = document.getElementById('popupEmail')?.value?.trim();
    const phone = document.getElementById('popupPhone')?.value?.trim();
    if (!name || !email) { alert('Please enter your name and email.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { alert('Please enter a valid email.'); return; }

    submitBtn.textContent = 'Saving…';
    submitBtn.disabled = true;

    const geo = await fetchVisitorGeo();
    const deviceInfo = getDeviceInfo();

    const leadData = {
      timestamp: new Date().toISOString(),
      name, email, phone: phone || '—',
      country: geo.country, ip: geo.ip, isp: geo.isp,
      city: geo.city, region: geo.region,
      browser: deviceInfo.browser,
      device_type: deviceInfo.type,
      device_model: deviceInfo.model,
      os: deviceInfo.os,
      referrer: document.referrer || 'direct',
      page: window.location.href,
      source: 'popup'
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('lc_leads') || '[]');
    existing.push(leadData);
    localStorage.setItem('lc_leads', JSON.stringify(existing));

    // Also POST to Google Sheets if webhook URL is configured
    const sheetUrl = localStorage.getItem('lc_sheets_url');
    if (sheetUrl) {
      fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      }).catch(() => {}); // silent fail
    }

    // Show success
    document.getElementById('leadForm').style.display = 'none';
    document.getElementById('leadSuccess').style.display = 'block';
    localStorage.setItem('lc_lead_done', '1');
    setTimeout(() => overlay.style.display = 'none', 3000);
  });
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let type = 'Desktop', model = '—', os = '—', browser = '—';
  if (/Mobi|Android/i.test(ua)) type = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) type = 'Tablet';

  if (/iPhone/.test(ua)) { model = 'iPhone'; os = 'iOS'; }
  else if (/iPad/.test(ua)) { model = 'iPad'; os = 'iPadOS'; }
  else if (/Android/.test(ua)) { os = 'Android'; model = ua.match(/Android [^;]+; ([^)]+)/)?.[1] || 'Android'; }
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';

  return { type, model, os, browser };
}

// ===================== AD VISIBILITY (admin-controlled) =====================
function applyAdVisibility() {
  const adsOn = localStorage.getItem('lc_ads_enabled') === '1';
  document.querySelectorAll('.ad-slot, .ads-hidden, .popup-ad-slot').forEach(el => {
    el.style.display = adsOn ? 'block' : 'none';
  });
  // world map
  const mapSection = document.getElementById('worldMapSection');
  const mapOn = localStorage.getItem('lc_map_enabled') === '1';
  if (mapSection) mapSection.style.display = mapOn ? 'block' : 'none';
}
