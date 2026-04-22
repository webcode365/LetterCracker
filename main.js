// LetterCracker — main.js
// Handles: unscramble logic, results display, game, WOTD, visitor display

let letterInput;

// ===================== INIT =====================
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

// ===================== CLEAR BTN =====================
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
  const unscrambleBtn = document.getElementById('unscrambleBtn');

  if (unscrambleBtn) unscrambleBtn.addEventListener('click', doUnscramble);
  if (letterInput) letterInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doUnscramble();
  });
}

let searchCount = parseInt(localStorage.getItem('lc_searches') || '0');

function doUnscramble() {
  if (!letterInput) return;

  const letters = letterInput.value?.trim();
  if (!letters || letters.length < 2) {
    showToast('Please enter at least 2 letters');
    return;
  }

  const options = {
    startsWith: document.getElementById('startsWith')?.value?.trim()?.toLowerCase() || '',
    endsWith: document.getElementById('endsWith')?.value?.trim()?.toLowerCase() || '',
    mustInclude: document.getElementById('mustInclude')?.value?.trim()?.toLowerCase() || '',
    lengthFilter: document.getElementById('lengthFilter')?.value || 'all',
    sortBy: document.getElementById('sortBy')?.value || 'length',
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
    resultsMeta.textContent = `No valid words found for "${letters}"`;
    resultsByLength.innerHTML =
      `<p style="color:var(--text3);font-size:0.9rem;padding:1rem 0;">
      Try removing some letters or check spelling. Use ? for blanks.
      </p>`;
    return;
  }

  resultsMeta.textContent = `Found ${words.length} word${words.length !== 1 ? 's' : ''} from "${letters}"`;

  const groups = {};
  words.forEach(w => {
    const len = w.word.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(w);
  });

  const sortOrder = Object.keys(groups).map(Number).sort((a, b) => b - a);

  let html = '';

  sortOrder.forEach(len => {
    html += `
      <div class="word-group">
        <div class="word-group-title">${len} Letters (${groups[len].length})</div>
        <div class="word-chips">
          ${groups[len].map(w =>
            `<span class="word-chip" data-word="${w.word}" title="${w.points} pts">
              ${w.word}
              <span class="pts">${w.points}pt</span>
            </span>`
          ).join('')}
        </div>
      </div>
    `;
  });

  resultsByLength.innerHTML = html;

  // attach click events safely
  document.querySelectorAll('.word-chip').forEach(el => {
    el.addEventListener('click', () => copyWord(el.dataset.word));
  });

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===================== COPY =====================
function copyWord(word) {
  navigator.clipboard?.writeText(word)
    .then(() => showToast(`"${word}" copied!`))
    .catch(() => showToast(word));
}

// Copy All
document.getElementById('copyAllBtn')?.addEventListener('click', () => {
  const words = Array.from(document.querySelectorAll('.word-chip'))
    .map(c => c.dataset.word)
    .join('\n');

  navigator.clipboard?.writeText(words)
    .then(() => showToast('All words copied!'))
    .catch(() => showToast('Copy failed'));
});

// Export CSV
document.getElementById('exportBtn')?.addEventListener('click', () => {
  const rows = ['Word,Points'];

  document.querySelectorAll('.word-chip').forEach(c => {
    rows.push(`${c.dataset.word},${c.querySelector('.pts')?.textContent.replace('pt', '') || ''}`);
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lettercracker-results.csv';
  a.click();

  showToast('Results exported!');
});

// ===================== TOAST =====================
function showToast(msg, dur = 2200) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), dur);
}

// ===================== WORD OF THE DAY =====================
function setWOTD() {
  const WOTD_LIST = [
    { word:'EPHEMERAL', phonetic:'/ɪˈfem.ər.əl/', pos:'adjective', def:'Lasting briefly.', points:15 },
    { word:'QUIXOTIC', phonetic:'/kwɪkˈsɒt.ɪk/', pos:'adjective', def:'Unrealistic idealism.', points:26 },
    { word:'SERENDIPITY', phonetic:'/ˌser.ənˈdɪp.ɪ.ti/', pos:'noun', def:'Happy chance events.', points:15 },
  ];

  const day = Math.floor(Date.now() / 86400000) % WOTD_LIST.length;
  const w = WOTD_LIST[day];

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('wotdWord', w.word);
  set('wotdPhonetic', w.phonetic);
  set('wotdPos', w.pos);
  set('wotdDef', w.def);
  set('wotdPoints', w.points);
}

// ===================== GAME BEST SCORE =====================
function initGameBestScore() {
  const best = document.getElementById('gameBest');
  if (best) best.textContent = localStorage.getItem('lc_game_best') || '0';
}

// ===================== VISITOR INFO =====================
async function loadVisitorInfo() {
  const visitorBar = document.getElementById("visitorBar");
  if (!visitorBar) return;

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const city = data.city || "Unknown";
    const country = data.country_name || "Unknown";
    const ip = data.ip || "N/A";

    visitorBar.innerHTML = `
      <div class="visitor-bar-inner">
        <span class="live-dot"></span>
        <span>${city}, ${country} — IP: ${ip}</span>
      </div>
    `;
  } catch (err) {
    visitorBar.innerHTML = `
      <div class="visitor-bar-inner">
        <span class="live-dot"></span>
        <span>Location unavailable</span>
      </div>
    `;
  }
}
