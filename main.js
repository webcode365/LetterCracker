// ===================== BASIC INIT =====================
const letterInput = document.getElementById('letterInput');
const unscrambleBtn = document.getElementById('unscrambleBtn');
const clearBtn = document.getElementById('clearBtn');

let searchCount = parseInt(localStorage.getItem('lc_searches') || '0');

// ===================== SMALL FALLBACK DICTIONARY =====================
// (prevents TOTAL failure if words-db.js breaks)
const FALLBACK_WORDS = [
  "APPLE","ORANGE","BANANA","GRAPE","PEAR","PEACH","PLANE","PLANT",
  "GARDEN","CASTLE","BRIDGE","MONKEY","PLANET","SILVER","GOLD","SWORD",
  "WATER","FIRE","EARTH","WIND","STONE","LIGHT","DARK","HOUSE","WORLD",
  "WORD","WORDS","SCRABBLE","PUZZLE","LETTER","CRACK","CRACKER"
];

// ===================== SAFE SCRAMBLE ENGINE =====================
function getWordList() {
  try {
    if (window.WORD_DB && Array.isArray(window.WORD_DB.words)) {
      return window.WORD_DB.words;
    }
  } catch (e) {}
  return FALLBACK_WORDS;
}

// check if word can be built from letters
function canForm(word, letters) {
  const arr = letters.split('');
  for (let ch of word) {
    const i = arr.indexOf(ch);
    if (i === -1) return false;
    arr.splice(i, 1);
  }
  return true;
}

// score (simple scrabble-style)
function scoreWord(w) {
  return w.length;
}

// ===================== UNSCRAMBLE CORE =====================
function doUnscramble() {
  const letters = letterInput?.value?.trim()?.toUpperCase();

  if (!letters || letters.length < 2) {
    showToast("Enter at least 2 letters");
    return;
  }

  const loading = document.getElementById('loadingState');
  const resultsSection = document.getElementById('resultsSection');

  if (loading) loading.style.display = 'flex';
  if (resultsSection) resultsSection.style.display = 'none';

  setTimeout(() => {
    try {
      const dict = getWordList();

      const results = [];

      for (let w of dict) {
        const word = w.word || w;

        if (!word) continue;

        const upper = word.toUpperCase();

        if (canForm(upper, letters)) {
          results.push({
            word: upper,
            points: scoreWord(upper)
          });
        }
      }

      displayResults(results, letters);

      searchCount++;
      localStorage.setItem('lc_searches', searchCount);

    } catch (err) {
      console.error(err);
      showToast("Error processing words");
    }

    if (loading) loading.style.display = 'none';
  }, 200);
}

// ===================== DISPLAY RESULTS =====================
function displayResults(words, letters) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsMeta = document.getElementById('resultsMeta');
  const resultsByLength = document.getElementById('resultsByLength');

  if (!resultsSection || !resultsByLength) return;

  resultsSection.style.display = 'block';

  if (!words || words.length === 0) {
    resultsMeta.textContent = `No words found for "${letters}"`;
    resultsByLength.innerHTML = `<p style="color:var(--text3)">Try different letters</p>`;
    return;
  }

  resultsMeta.textContent = `Found ${words.length} word(s) from "${letters}"`;

  const groups = {};

  words.forEach(w => {
    const len = w.word.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(w);
  });

  let html = '';

  Object.keys(groups)
    .sort((a,b)=>b-a)
    .forEach(len => {
      html += `
        <div class="word-group">
          <div class="word-group-title">${len} Letters (${groups[len].length})</div>
          <div class="word-chips">
            ${groups[len].map(w =>
              `<span class="word-chip" onclick="copyWord('${w.word}')">
                ${w.word} <span class="pts">${w.points}pt</span>
              </span>`
            ).join('')}
          </div>
        </div>`;
    });

  resultsByLength.innerHTML = html;
  resultsSection.scrollIntoView({ behavior: "smooth" });
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

  letterInput.addEventListener('input', () => {
    letterInput.value = letterInput.value.toUpperCase().replace(/[^A-Z?*]/g,'');
  });
}

// ===================== CLEAR =====================
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    letterInput.value = '';
    document.getElementById('resultsSection').style.display = 'none';
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
