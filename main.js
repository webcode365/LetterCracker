
// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  try {
    setupGlobals();
    initOptionsPanel();
    initClearButton();
    initUnscramble();
    initGameBestScore();
    loadVisitorInfo();
    setWOTD();
  } catch (e) {
    console.error("Init error:", e);
  }
}

// ===================== GLOBAL =====================
let letterInput;

function setupGlobals() {
  letterInput = document.getElementById('letterInput');
}

// ===================== OPTIONS =====================
function initOptionsPanel() {
  const toggle = document.getElementById('optionsToggle');
  const panel = document.getElementById('optionsPanel');

  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    const arrow = toggle.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = open ? '▴' : '▾';
  });
}

// ===================== CLEAR =====================
function initClearButton() {
  const btn = document.getElementById('clearBtn');
  if (!btn || !letterInput) return;

  btn.addEventListener('click', () => {
    letterInput.value = '';
  });

  letterInput.addEventListener('input', () => {
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

function doUnscramble() {
  if (!letterInput) return;

  const letters = letterInput.value.trim();
  if (!letters) return;

  const resultsSection = document.getElementById('resultsSection');
  const meta = document.getElementById('resultsMeta');
  const list = document.getElementById('resultsByLength');

  if (!resultsSection || !meta || !list) return;

  resultsSection.style.display = 'block';

  const words = WORD_DB?.unscramble ? WORD_DB.unscramble(letters, {}) : [];

  if (!words.length) {
    meta.textContent = "No results found";
    list.innerHTML = "";
    return;
  }

  meta.textContent = `Found ${words.length} words`;

  list.innerHTML = words.slice(0, 50).map(w =>
    `<div class="word-chip">${w.word} <span>${w.points || ''}</span></div>`
  ).join('');
}

// ===================== GAME BEST SCORE =====================
function initGameBestScore() {
  const el = document.getElementById('gameBest');
  if (!el) return;
  el.textContent = localStorage.getItem('lc_game_best') || '0';
}

// ===================== WORD OF THE DAY =====================
function setWOTD() {
  const word = document.getElementById('wotdWord');
  const def = document.getElementById('wotdDef');
  const pts = document.getElementById('wotdPoints');

  if (word) word.textContent = "EPHEMERAL";
  if (def) def.textContent = "Lasting a short time";
  if (pts) pts.textContent = "15";
}

// ===================== VISITOR INFO (SAFE VERSION) =====================
async function loadVisitorInfo() {
  const el = document.getElementById("visitorText");
  if (!el) return;

  el.textContent = "Detecting your location...";

  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();

    if (!data.success) throw new Error();

    el.textContent = `${data.city}, ${data.country} — IP: ${data.ip}`;

  } catch (e) {
    el.textContent = "Location unavailable";
  }
}
