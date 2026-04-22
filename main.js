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
  optionsToggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') optionsToggle.click(); });
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
  if (!letters || letters.length < 2) { showToast('Please enter at least 2 letters'); return; }

  const options = {
    startsWith:   document.getElementById('startsWith')?.value?.trim()?.toLowerCase() || '',
    endsWith:     document.getElementById('endsWith')?.value?.trim()?.toLowerCase() || '',
    mustInclude:  document.getElementById('mustInclude')?.value?.trim()?.toLowerCase() || '',
    lengthFilter: document.getElementById('lengthFilter')?.value || 'all',
    sortBy:       document.getElementById('sortBy')?.value || 'length',
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
  }, 320);
}

if (unscrambleBtn) unscrambleBtn.addEventListener('click', doUnscramble);
if (letterInput) letterInput.addEventListener('keydown', e => { if (e.key === 'Enter') doUnscramble(); });

function displayResults(words, letters) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsMeta = document.getElementById('resultsMeta');
  const resultsByLength = document.getElementById('resultsByLength');
  if (!resultsSection || !resultsByLength) return;

  resultsSection.style.display = 'block';

  if (!words || words.length === 0) {
    resultsMeta.textContent = `No valid words found for "${letters}"`;
    resultsByLength.innerHTML = `<p style="color:var(--text3);font-size:0.9rem;padding:1rem 0;">Try removing some letters, or check your spelling. Use ? for blank tiles.</p>`;
    return;
  }

  resultsMeta.textContent = `Found ${words.length} word${words.length !== 1 ? 's' : ''} from "${letters}"`;

  // Group by length
  const groups = {};
  words.forEach(w => {
    const len = w.word.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(w);
  });

  const sortOrder = Object.keys(groups).map(Number).sort((a, b) => b - a);
  let html = '';
  sortOrder.forEach(len => {
    const label = len === 1 ? '1 Letter' : `${len} Letters`;
    html += `<div class="word-group">
      <div class="word-group-title">${label} (${groups[len].length})</div>
      <div class="word-chips">
        ${groups[len].map(w => `<span class="word-chip" onclick="copyWord('${w.word}')" title="${w.points} pts">${w.word}<span class="pts">${w.points}pt</span></span>`).join('')}
      </div>
    </div>`;
  });
  resultsByLength.innerHTML = html;

  // Scroll into view smoothly
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyWord(word) {
  navigator.clipboard?.writeText(word).then(() => showToast(`"${word}" copied!`)).catch(() => showToast(word));
}

// Copy All
document.getElementById('copyAllBtn')?.addEventListener('click', () => {
  const chips = document.querySelectorAll('.word-chip');
  const words = Array.from(chips).map(c => c.textContent.replace(/\d+pt$/, '').trim()).join('\n');
  navigator.clipboard?.writeText(words).then(() => showToast('All words copied!')).catch(() => showToast('Copy failed'));
});

// Export CSV
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

// Set input from tag click
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
  { word:'EPHEMERAL', phonetic:'/ɪˈfem.ər.əl/', pos:'adjective', def:'Lasting for only a brief time; transitory.', points:15 },
  { word:'QUIXOTIC', phonetic:'/kwɪkˈsɒt.ɪk/', pos:'adjective', def:'Exceedingly idealistic; unrealistic and impractical.', points:26 },
  { word:'LUMINOUS', phonetic:'/ˈluː.mɪ.nəs/', pos:'adjective', def:'Full of or shedding light; bright or shining.', points:10 },
  { word:'SERENDIPITY', phonetic:'/ˌser.ənˈdɪp.ɪ.ti/', pos:'noun', def:'The occurrence of events by chance in a happy way.', points:15 },
  { word:'MELLIFLUOUS', phonetic:'/məˈlɪf.lu.əs/', pos:'adjective', def:'Sweet or musical; pleasant to hear.', points:17 },
  { word:'PERSPICACIOUS', phonetic:'/ˌpɜː.spɪˈkeɪ.ʃəs/', pos:'adjective', def:'Having a ready insight; shrewd.', points:22 },
  { word:'LABYRINTHINE', phonetic:'/ˌlæb.ɪˈrɪn.θɪn/', pos:'adjective', def:'Like a labyrinth; intricate and confusing.', points:22 },
];
function setWOTD() {
  const day = Math.floor(Date.now() / 86400000) % WOTD_LIST.length;
  const w = WOTD_LIST[day];
  const el = n => document.getElementById(n);
  if (el('wotdWord')) el('wotdWord').textContent = w.word;
  if (el('wotdPhonetic')) el('wotdPhonetic').textContent = w.phonetic;
  if (el('wotdPos')) el('wotdPos').textContent = w.pos;
  if (el('wotdDef')) el('wotdDef').textContent = w.def;
  if (el('wotdPoints')) el('wotdPoints').textContent = w.points;
}
setWOTD();

// ===================== WORD SCRAMBLE GAME =====================
const GAME_WORDS = [
  'PLANET','GARDEN','BRIDGE','CASTLE','FLOWER','MONKEY','SHADOW','TURTLE',
  'CANDLE','BUTTER','SIMPLE','ORANGE','PURPLE','SILVER','GOLDEN','WINTER',
  'SPRING','SUMMER','DRAGON','PIRATE','JUNGLE','ROCKET','FINGER','MIRROR',
  'WONDER','BLANKET','CHICKEN','DOLPHIN','FREEDOM','HARVEST','JOURNEY','KINGDOM',
  'LIBRARY','MORNING','NETWORK','OUTSIDE','PATTERN','QUARTER','RAINBOW','SERIOUS',
  'THUNDER','UNIFORM','VILLAGE','WARRIOR','VICTORY','WELCOME','YOUTUBE','CRYSTAL'
];

let gameState = {
  active: false, score: 0, timer: null, timeLeft: 60,
  currentWord: '', scrambled: '', wordPool: [], answered: []
};

function shuffleArray(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function scrambleWord(word) {
  const letters = word.split('');
  let scrambled;
  do { scrambled = shuffleArray(letters).join(''); } while (scrambled === word && word.length > 1);
  return scrambled;
}

function startGame() {
  gameState.score = 0;
  gameState.timeLeft = 60;
  gameState.wordPool = shuffleArray(GAME_WORDS);
  gameState.answered = [];
  gameState.active = true;

  document.getElementById('gameStart').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('gamePlay').style.display = 'block';
  document.getElementById('gameAnswer').classList.remove('visible');
  document.getElementById('gameFeedback').textContent = '';

  updateGameUI();
  nextWord();

  if (gameState.timer) clearInterval(gameState.timer);
  gameState.timer = setInterval(() => {
    gameState.timeLeft--;
    const timerEl = document.getElementById('gameTimer');
    const barEl = document.getElementById('timerBar');
    if (timerEl) {
      timerEl.textContent = gameState.timeLeft;
      timerEl.className = 'hud-value' + (gameState.timeLeft <= 10 ? ' timer-warning' : '');
    }
    if (barEl) barEl.style.width = (gameState.timeLeft / 60 * 100) + '%';
    if (gameState.timeLeft <= 0) endGame();
  }, 1000);

  document.getElementById('gameInput')?.focus();
  document.getElementById('gameInput')?.addEventListener('keydown', gameKeydown);
}

function gameKeydown(e) { if (e.key === 'Enter') checkGameAnswer(); }

function nextWord() {
  if (gameState.wordPool.length === 0) gameState.wordPool = shuffleArray(GAME_WORDS);
  gameState.currentWord = gameState.wordPool.pop();
  gameState.scrambled = scrambleWord(gameState.currentWord);
  const el = document.getElementById('gameScrambled');
  if (el) {
    el.innerHTML = gameState.scrambled.split('').map(
      l => `<span class="letter-tile">${l}</span>`
    ).join('');
  }
  document.getElementById('gameInput').value = '';
  document.getElementById('gameAnswer').classList.remove('visible');
  document.getElementById('gameFeedback').textContent = '';
}

function checkGameAnswer() {
  if (!gameState.active) return;
  const input = document.getElementById('gameInput');
  const guess = (input?.value || '').trim().toUpperCase();
  if (!guess) return;

  if (guess === gameState.currentWord) {
    const pts = gameState.currentWord.length >= 7 ? 3 : gameState.currentWord.length >= 5 ? 2 : 1;
    gameState.score += pts;
    updateGameUI();
    showFeedback(`✓ Correct! +${pts} point${pts > 1 ? 's' : ''}`, true);
    document.querySelectorAll('.letter-tile').forEach(t => t.style.color = 'var(--green)');
    setTimeout(nextWord, 600);
  } else {
    showFeedback('✗ Try again!', false);
    input.value = '';
    document.querySelectorAll('.letter-tile').forEach(t => { t.style.color = 'var(--red)'; setTimeout(() => t.style.color = '', 500); });
  }
}

function showFeedback(msg, correct) {
  const el = document.getElementById('gameFeedback');
  if (!el) return;
  el.textContent = msg;
  el.className = 'game-feedback ' + (correct ? 'feedback-correct' : 'feedback-wrong');
}

function skipWord() {
  if (!gameState.active) return;
  const ansEl = document.getElementById('gameAnswer');
  const ansWord = document.getElementById('answerWord');
  if (ansEl && ansWord) { ansWord.textContent = gameState.currentWord; ansEl.classList.add('visible'); }
  setTimeout(nextWord, 1200);
}

function showHint() {
  if (!gameState.active) return;
  const hint = gameState.currentWord[0] + '_'.repeat(gameState.currentWord.length - 1);
  showFeedback(`Hint: ${hint}`, true);
}

function updateGameUI() {
  const scoreEl = document.getElementById('gameScore');
  const bestEl = document.getElementById('gameBest');
  const best = Math.max(parseInt(localStorage.getItem('lc_game_best') || '0'), gameState.score);
  localStorage.setItem('lc_game_best', best);
  if (scoreEl) scoreEl.textContent = gameState.score;
  if (bestEl) bestEl.textContent = best;
}

function endGame() {
  gameState.active = false;
  clearInterval(gameState.timer);
  const best = Math.max(parseInt(localStorage.getItem('lc_game_best') || '0'), gameState.score);
  localStorage.setItem('lc_game_best', best);
  document.getElementById('gamePlay').style.display = 'none';
  document.getElementById('gameOver').style.display = 'block';
  document.getElementById('finalScore').textContent = gameState.score;
  document.getElementById('bestScoreDisplay').textContent = best;
}

function resetGame() {
  clearInterval(gameState.timer);
  gameState.active = false;
  document.getElementById('gamePlay').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('gameStart').style.display = 'block';
}

// Init best score display
document.addEventListener('DOMContentLoaded', () => {
  const best = document.getElementById('gameBest');
  if (best) best.textContent = localStorage.getItem('lc_game_best') || '0';
});

async function loadVisitorInfo() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const city = data.city || "";
    const country = data.country_name || "";
    const ip = data.ip || "";

    const visitorBar = document.getElementById("visitorBar");

    if (visitorBar) {
      visitorBar.innerHTML = `
        <div class="visitor-bar-inner">
          <span class="live-dot"></span>
          <span>${city}, ${country} — IP: ${ip}</span>
        </div>
      `;
    }

  } catch (err) {
    console.error("Visitor info failed:", err);
  }
}

loadVisitorInfo();
