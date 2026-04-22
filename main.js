// LetterCracker — main.js

// ===================== GLOBAL ELEMENTS =====================
const letterInput = document.getElementById('letterInput');
const unscrambleBtn = document.getElementById('unscrambleBtn');
const clearBtn = document.getElementById('clearBtn');

let searchCount = parseInt(localStorage.getItem('lc_searches') || '0');

// ===================== OPTIONS PANEL =====================
const optionsToggle = document.getElementById('optionsToggle');
const optionsPanel = document.getElementById('optionsPanel');

if (optionsToggle && optionsPanel) {
  optionsToggle.addEventListener('click', () => {
    const open = optionsPanel.classList.toggle('open');
    const arrow = optionsToggle.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = open ? '▴' : '▾';
    optionsToggle.setAttribute('aria-expanded', open);
  });
}

// ===================== CLEAR INPUT =====================
if (clearBtn && letterInput) {
  clearBtn.addEventListener('click', () => {
    letterInput.value = '';
    document.getElementById('resultsSection').style.display = 'none';
  });

  letterInput.addEventListener('input', () => {
    letterInput.value = letterInput.value.toUpperCase().replace(/[^A-Z?*]/g, '');
  });
}

// ===================== UNSCRAMBLE CORE (FIXED) =====================
function doUnscramble() {
  const letters = letterInput?.value?.trim()?.toUpperCase();

  if (!letters || letters.length < 2) {
    showToast("Enter at least 2 letters");
    return;
  }

  const loadingState = document.getElementById('loadingState');
  const resultsSection = document.getElementById('resultsSection');

  if (loadingState) loadingState.style.display = 'flex';
  if (resultsSection) resultsSection.style.display = 'none';

  setTimeout(() => {
    try {

      // ================= SAFE WORD DB CHECK =================
      if (!window.WORD_DB) {
        throw new Error("WORD_DB not found (words-db.js not loaded)");
      }

      if (typeof window.WORD_DB.unscramble !== "function") {
        throw new Error("WORD_DB.unscramble is not a function");
      }

      const options = {
        startsWith: document.getElementById('startsWith')?.value?.toLowerCase() || '',
        endsWith: document.getElementById('endsWith')?.value?.toLowerCase() || '',
        mustInclude: document.getElementById('mustInclude')?.value?.toLowerCase() || '',
        lengthFilter: document.getElementById('lengthFilter')?.value || 'all',
        sortBy: document.getElementById('sortBy')?.value || 'length'
      };

      const words = window.WORD_DB.unscramble(letters, options) || [];

      displayResults(words, letters);

      searchCount++;
      localStorage.setItem('lc_searches', searchCount);

    } catch (err) {
      console.error("Unscramble Error:", err);

      showToast("Word engine error");

      const resultsSection = document.getElementById('resultsSection');
      const resultsMeta = document.getElementById('resultsMeta');
      const resultsByLength = document.getElementById('resultsByLength');

      if (resultsSection) resultsSection.style.display = 'block';

      if (resultsMeta) {
        resultsMeta.textContent = "Error: Word system failed";
      }

      if (resultsByLength) {
        resultsByLength.innerHTML =
          `<p style="color:red;padding:10px;">
            WORD_DB is missing or broken.<br>
            Check words-db.js file in your project.
          </p>`;
      }

    } finally {
      if (loadingState) loadingState.style.display = 'none';
    }
  }, 200);
}

// ===================== DISPLAY RESULTS =====================
function displayResults(words, letters) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsMeta = document.getElementById('resultsMeta');
  const resultsByLength = document.getElementById('resultsByLength');

  if (!resultsSection || !resultsByLength) return;

  resultsSection.style.display = 'block';

  if (!words.length) {
    resultsMeta.textContent = `No words found for "${letters}"`;
    resultsByLength.innerHTML = `<p>No results found</p>`;
    return;
  }

  resultsMeta.textContent = `Found ${words.length} words from "${letters}"`;

  const groups = {};

  words.forEach(w => {
    const word = w.word || w;
    const len = word.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(word);
  });

  let html = '';

  Object.keys(groups)
    .sort((a, b) => b - a)
    .forEach(len => {
      html += `
        <div class="word-group">
          <div class="word-group-title">${len} Letters</div>
          <div class="word-chips">
            ${groups[len].map(w =>
              `<span class="word-chip" onclick="copyWord('${w}')">
                ${w}
              </span>`
            ).join('')}
          </div>
        </div>`;
    });

  resultsByLength.innerHTML = html;
}

// ===================== COPY =====================
function copyWord(word) {
  navigator.clipboard.writeText(word);
  showToast(word + " copied");
}

// ===================== BUTTON EVENTS =====================
if (unscrambleBtn) {
  unscrambleBtn.addEventListener('click', doUnscramble);
}

if (letterInput) {
  letterInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doUnscramble();
  });
}

// ===================== TOAST =====================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
