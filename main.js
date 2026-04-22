// LetterCracker — main.js
// Handles: unscramble logic, results display, game, WOTD, visitor display

// ===================== OPTIONS PANEL =====================
const optionsToggle = document.getElementById('optionsToggle');
const optionsPanel = document.getElementById('optionsPanel');
if (optionsToggle) {
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
const clearBtn = document.getElementById('clearBtn');
const letterInput = document.getElementById('letterInput');

if (clearBtn && letterInput) {
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
const unscrambleBtn = document.getElementById('unscrambleBtn');
let searchCount = parseInt(localStorage.getItem('lc_searches') || '0');

function doUnscramble() {
  const letters = letterInput?.value?.trim();

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
    try {
      // ===================== SAFE WORD DB CHECK =====================
      if (!window.WORD_DB || typeof window.WORD_DB.unscramble !== 'function') {
        throw new Error('WORD_DB missing or not loaded');
      }

      const words = window.WORD_DB.unscramble(letters, options);

      displayResults(words, letters);

      searchCount++;
      localStorage.setItem('lc_searches', searchCount);

    } catch (err) {
      console.error(err);
      showToast('Word database error');

      if (resultsSection) {
        resultsSection.style.display = 'block';
        document.getElementById('resultsMeta').textContent =
          'Error loading results';

        document.getElementById('resultsByLength').innerHTML =
          `<p style="color:var(--text3);padding:1rem 0;">
            Word database not available. Please check words-db.js
          </p>`;
      }
    }

    if (loadingState) loadingState.style.display = 'none';
  }, 320);
}

if (unscrambleBtn) unscrambleBtn.addEventListener('click', doUnscramble);
if (letterInput) letterInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') doUnscramble();
});

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
        Try different letters or use wildcards ? *
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
            `<span class="word-chip" onclick="copyWord('${w.word}')" title="${w.points} pts">
              ${w.word}<span class="pts">${w.points}pt</span>
            </span>`
          ).join('')}
        </div>
      </div>`;
  });

  resultsByLength.innerHTML = html;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyWord(word) {
  navigator.clipboard?.writeText(word)
    .then(() => showToast(`"${word}" copied!`))
    .catch(() => showToast(word));
}

// ===================== COPY ALL =====================
document.getElementById('copyAllBtn')?.addEventListener('click', () => {
  const chips = document.querySelectorAll('.word-chip');
  const words = Array.from(chips)
    .map(c => c.textContent.replace(/\d+pt$/, '').trim())
    .join('\n');

  navigator.clipboard?.writeText(words)
    .then(() => showToast('All words copied!'))
    .catch(() => showToast('Copy failed'));
});

// ===================== EXPORT =====================
document.getElementById('exportBtn')?.addEventListener('click', () => {
  const chips = document.querySelectorAll('.word-chip');
  const rows = ['Word,Points'];

  chips.forEach(c => {
    const w = c.textContent.replace(/(\d+)pt$/, '').trim();
    const p = c.querySelector('.pts')?.textContent?.replace('pt', '') || '';
    rows.push(`${w},${p}`);
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lettercracker-results.csv';
  a.click();

  showToast('Results exported!');
});

// ===================== INPUT TAGS =====================
function setInput(val) {
  if (!letterInput) return;
  letterInput.value = val;
  clearBtn.style.opacity = '1';
  doUnscramble();
  letterInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===================== TOAST =====================
function showToast(msg, dur = 2200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ===================== WORD OF THE DAY =====================
const WOTD_LIST = [
  { word:'EPHEMERAL', phonetic:'/ɪˈfem.ər.əl/', pos:'adjective', def:'Lasting for a very short time.', points:15 },
  { word:'QUIXOTIC', phonetic:'/kwɪkˈsɒt.ɪk/', pos:'adjective', def:'Extremely idealistic.', points:26 },
];

function setWOTD() {
  const day = Math.floor(Date.now() / 86400000) % WOTD_LIST.length;
  const w = WOTD_LIST[day];

  const el = id => document.getElementById(id);

  if (el('wotdWord')) el('wotdWord').textContent = w.word;
  if (el('wotdPhonetic')) el('wotdPhonetic').textContent = w.phonetic;
  if (el('wotdPos')) el('wotdPos').textContent = w.pos;
  if (el('wotdDef')) el('wotdDef').textContent = w.def;
  if (el('wotdPoints')) el('wotdPoints').textContent = w.points;
}

setWOTD();
