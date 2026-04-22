// ===================== VISITOR INFO (FIXED + RELIABLE) =====================
async function loadVisitorInfo() {
  const visitorBar = document.getElementById("visitorBar");
  if (!visitorBar) return;

  // Show loading state immediately
  visitorBar.innerHTML = `
    <div class="visitor-bar-inner">
      <span class="live-dot"></span>
      <span>Detecting your location...</span>
    </div>
  `;

  try {
    // STEP 1: Primary API (most reliable free option)
    let res = await fetch("https://ipwho.is/");
    let data = await res.json();

    // STEP 2: If failed, fallback API
    if (!data || !data.success) {
      res = await fetch("https://ipapi.co/json/");
      data = await res.json();
    }

    const city = data.city || "Unknown";
    const country =
      data.country ||
      data.country_name ||
      "Unknown";
    const ip = data.ip || "N/A";

    visitorBar.innerHTML = `
      <div class="visitor-bar-inner">
        <span class="live-dot"></span>
        <span>${city}, ${country} — IP: ${ip}</span>
      </div>
    `;

  } catch (err) {
    console.error("Visitor detection failed:", err);

    visitorBar.innerHTML = `
      <div class="visitor-bar-inner">
        <span class="live-dot"></span>
        <span>Location unavailable</span>
      </div>
    `;
  }
}

// Call it once page loads (IMPORTANT)
document.addEventListener("DOMContentLoaded", loadVisitorInfo);
