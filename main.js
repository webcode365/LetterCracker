
// ===================== GLOBAL INIT =====================
let letterInput;

// Run everything after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  letterInput = document.getElementById('letterInput');

  initOptionsPanel();
  initClearButton();
  initUnscramble();
  initGameBestScore();
  loadVisitorInfo();
  setWOTD();
});

// ===================== OPTIONS PANEL =====================
function initOptionsPanel() {
  const optionsToggle = document.getElementById('optionsToggle');
  const optionsPanel = document.getElementById('optionsPanel');

  if (!optionsToggle || !optionsPanel) return;

  optionsToggle.addEventListener('click', () => {
    const open = optionsPanel.classList.toggle('open');
    const arrow = optionsToggle.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = open ? '▴' : '▾';
    optionsToggle.setAttribute('aria-expanded', open);
  });

  optionsToggle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') optionsToggle.click();
  });
}

// ===================== CLEAR BUTTON =====================
function initClearButton() {
  const clearBtn = document.getElementById('clearBtn');

  if (!clearBtn || !letterInput) return;

  clearBtn.addEventListener('click', () => {
    letterInput.value = '';
    letterInput.focus();
    clearBtn.style.opacity = '0';

    const rs = document.getElementById('resultsSection');
    if (rs) rs.style.display = 'none';
  });

  letterInput.addEventListener('input', () => {
    clearBtn.style.opacity = letterInput.value ? '1' : '0';
    letterInput.value = letterInput.value.toUpperCase().replace(/[^A-Z?*]/g, '');
  });
}

// ===================== UNSCRAMBLE =====================
function initUnscramble() {
  const btn = document.getElementById('unscrambleBtn');

  if (btn) btn.addEventListener('click', doUnscramble);

  if (letterInput) {
    letterInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doUnscramble();
    });
  }
}

let searchCount = parseInt(localStorage.getItem('lc_searches') || '0');

function doUnscramble() {
  if (!letterInput) return;

  const letters = letterInput.value.trim();
  if (!letters || letters.length < 2) {
    showToast('Please enter at least 2 letters');
    return;
  }

  const options = {
    startsWith: document.getElementById('startsWith')?.value?.trim()?.toLowerCase() || '',
    endsWith: document.getElementById('endsWith')?.value?.trim()?.toLowerCase() || '',
    mustInclude: document.getElementById('mustInclude')?.value?.trim()?.toLowerCase() || '',
    lengthFilter: document.getElementById('lengthFilter')?.value || 'all',
    sortBy: document.getElementById('sortBy')?.value || 'length'
  };

  const loadingState = document.getElementById('loadingState');
  const resultsSection = document.getElementById('resultsSection');

  if (loadingState) loadingState.style.display = 'flex';
  if (resultsSection) resultsSection.style.display = 'none';

  setTimeout(() => {
    const words = WORD_DB.unscramble(letters, options);
    displayResults(words, letters);

    if (loadingState) loadingState.style.display = 'none';

    searchCount++;
    localStorage.setItem('lc_searches', searchCount);
  }, 300);
}

// ===================== RESULTS =====================
function displayResults(words, letters) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsMeta = document.getElementById('resultsMeta');
  const resultsByLength = document.getElementById('resultsByLength');

  if (!resultsSection || !resultsByLength) return;

  resultsSection.style.display = 'block';

  if (!words || words.length === 0) {
    resultsMeta.textContent = `No words found for "${letters}"`;
    resultsByLength.innerHTML = `<p style="color:#888;padding:1rem 0;">Try different letters or use ? wildcard</p>`;
    return;
  }

  resultsMeta.textContent = `Found ${words.length} words`;

  const groups = {};
  words.forEach(w => {
    const len = w.word.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(w);
  });

  const sorted = Object.keys(groups).map(Number).sort((a, b) => b - a);

  let html = '';

  sorted.forEach(len => {
    html += `
      <div class="word-group">
        <div class="word-group-title">${len} Letters (${groups[len].length})</div>
        <div class="word-chips">
          ${groups[len].map(w =>
            `<span class="word-chip" data-word="${w.word}">
              ${w.word}
              <span class="pts">${w.points}pt</span>
            </span>`
          ).join('')}
        </div>
      </div>
    `;
  });

  resultsByLength.innerHTML = html;

  document.querySelectorAll('.word-chip').forEach(el => {
    el.addEventListener('click', () => copyWord(el.dataset.word));
  });

  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// ===================== COPY =====================
function copyWord(word) {
  navigator.clipboard?.writeText(word)
    .then(() => showToast(`Copied: ${word}`))
    .catch(() => showToast(word));
}

// ===================== TOAST =====================
function showToast(msg, time = 2000) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), time);
}

// ===================== WORD OF THE DAY =====================
function setWOTD() {
  const list = [
    { word: "EPHEMERAL", def: "Lasting a short time", points: 15 },
    { word: "QUIXOTIC", def: "Unrealistic idealism", points: 26 },
    { word: "SERENDIPITY", def: "Happy accident", points: 15 }
  ];

  const w = list[Math.floor(Date.now() / 86400000) % list.length];

  document.getElementById('wotdWord')?.textContent = w.word;
  document.getElementById('wotdDef')?.textContent = w.def;
  document.getElementById('wotdPoints')?.textContent = w.points;
}

// ===================== GAME BEST SCORE =====================
function initGameBestScore() {
  const el = document.getElementById('gameBest');
  if (el) el.textContent = localStorage.getItem('lc_game_best') || '0';
}

// ===================== VISITOR INFO (FINAL FIXED) =====================
async function loadVisitorInfo() {
  const visitorText = document.getElementById("visitorText");
  if (!visitorText) return;

  visitorText.textContent = "Detecting your location...";

  const fetchWithTimeout = (url, t = 5000) =>
    Promise.race([
      fetch(url),
      new Promise((_, r) => setTimeout(() => r(new Error("timeout")), t))
    ]);

  try {
    let res = await fetchWithTimeout("https://ipwho.is/");
    let data = await res.json();

    if (!data || !data.success) {
      res = await fetchWithTimeout("https://ipapi.co/json/");
      data = await res.json();
    }

    const city = data.city || "Unknown";
    const country = data.country || data.country_name || "Unknown";
    const ip = data.ip || "N/A";

    visitorText.textContent = `${city}, ${country} — IP: ${ip}`;

  } catch (err) {
    console.error(err);
    visitorText.textContent = "Location unavailable";
  }
}
