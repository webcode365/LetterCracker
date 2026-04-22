// ===================== SAFE INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  console.log("LetterCracker loaded");

  safeRun(initApp);
});

function safeRun(fn) {
  try {
    fn();
  } catch (e) {
    console.error("GLOBAL ERROR:", e);
  }
}

// ===================== APP INIT =====================
function initApp() {
  setupVisitor();
  setupUnscramble();
}

// ===================== VISITOR (FIXED + SAFE) =====================
function setupVisitor() {
  const bar = document.getElementById("visitorBar");
  if (!bar) return;

  bar.innerHTML = `
    <div class="visitor-bar-inner">
      <span class="live-dot"></span>
      <span>Detecting your location...</span>
    </div>
  `;

  fetch("https://ipwho.is/")
    .then(r => r.json())
    .then(data => {
      if (!data.success) throw new Error("API failed");

      bar.innerHTML = `
        <div class="visitor-bar-inner">
          <span class="live-dot"></span>
          <span>${data.city}, ${data.country} — IP: ${data.ip}</span>
        </div>
      `;
    })
    .catch(err => {
      console.error("Visitor API error:", err);

      bar.innerHTML = `
        <div class="visitor-bar-inner">
          <span class="live-dot"></span>
          <span>Location unavailable</span>
        </div>
      `;
    });
}

// ===================== UNSCRAMBLE SAFE =====================
function setupUnscramble() {
  const btn = document.getElementById("unscrambleBtn");
  const input = document.getElementById("letterInput");

  if (!btn || !input) {
    console.warn("Missing UI elements");
    return;
  }

  btn.addEventListener("click", () => {
    runSearch(input.value);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") runSearch(input.value);
  });
}

// ===================== MAIN SEARCH =====================
function runSearch(letters) {
  const results = document.getElementById("resultsSection");
  const meta = document.getElementById("resultsMeta");
  const list = document.getElementById("resultsByLength");

  if (!letters) return;
  if (!results || !meta || !list) return;

  results.style.display = "block";

  // 🔥 CRITICAL CHECK
  if (typeof WORD_DB === "undefined") {
    meta.textContent = "❌ words-db.js NOT loaded";
    list.innerHTML = "";
    console.error("WORD_DB missing!");
    return;
  }

  let words = [];

  try {
    words = WORD_DB.unscramble(letters, {});
  } catch (e) {
    console.error("WORD_DB error:", e);
    meta.textContent = "Database error";
    return;
  }

  if (!words.length) {
    meta.textContent = "No words found";
    list.innerHTML = "";
    return;
  }

  meta.textContent = `Found ${words.length} words`;

  list.innerHTML = words.slice(0, 60).map(w =>
    `<div class="word-chip">
      ${w.word} <span>${w.points || ""}</span>
    </div>`
  ).join("");
}
