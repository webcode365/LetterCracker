/**
 * LetterCracker — Auto Page & Sitemap Generator
 * ================================================
 * Run this script to generate all released article pages and a fresh sitemap.xml
 *
 * HOW TO RUN LOCALLY:
 *   node generate-pages.js
 *
 * REQUIREMENTS:
 *   Node.js v16 or newer (free — https://nodejs.org)
 *   Both content-registry.json and site-config.json must be in the same folder as this script.
 *
 * WHAT IT DOES:
 *   1. Reads every article from content-registry.json
 *   2. For articles whose releaseDate is today or earlier, generates an HTML file
 *   3. Sets the robots meta tag based on each article's indexInSearch flag
 *   4. Includes ad slots based on each article's showAds flag and site-config.json settings
 *   5. Generates a fresh sitemap.xml with only indexable + already-released articles
 *   6. (Optional) Pings Google / Bing / Yandex with the new sitemap URL
 *
 * Safe to run multiple times — existing files are cleanly overwritten (idempotent).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

/* ── Load config ── */
const CONFIG   = JSON.parse(fs.readFileSync('site-config.json',      'utf8'));
const REGISTRY = JSON.parse(fs.readFileSync('content-registry.json', 'utf8'));

const SITE_URL  = CONFIG.siteUrl.replace(/\/$/, '');
const OUT_DIR      = CONFIG.outputDir || '.';
const ART_PREFIX   = CONFIG.articlePrefix || 'article-';
/* ── New York timezone aware date + time ── */
const NY_NOW     = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
const TODAY_STR  = NY_NOW.toISOString().slice(0, 10);  /* YYYY-MM-DD in New York time */
const NY_HOUR    = NY_NOW.getHours();
const NY_MINUTE  = NY_NOW.getMinutes();
const NY_TIME_STR = String(NY_HOUR).padStart(2,'0') + ':' + String(NY_MINUTE).padStart(2,'0');

/* Create output directory if it doesn't exist */
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUT_DIR}/`);
}

/* ── Helpers ── */
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function adSlotHTML(label, minHeight) {
  if (!CONFIG.enableAds) return '';
  const id = CONFIG.adsenseId || 'ca-pub-XXXXXXXXXXXXXXXX';
  return `
<div class="ad-slot" style="margin:1.5rem 0;text-align:center;">
  <ins class="adsbygoogle"
    style="display:block;min-height:${minHeight}px;"
    data-ad-client="${esc(id)}"
    data-ad-slot="AUTO"
    data-ad-format="auto"
    data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`.trim();
}

function amazonSectionHTML() {
  if (!CONFIG.enableAmazon) return '';
  const tag = CONFIG.amazonTag || 'yourstore-20';
  return `
<section class="amazon-section" style="margin:2rem 0;padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;">
  <h3 style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;margin-bottom:1rem;">&#127919; Level Up Your Word Game</h3>
  <div style="display:flex;gap:10px;flex-wrap:wrap;">
    <a href="https://www.amazon.com/s?k=scrabble+board+game&tag=${esc(tag)}" target="_blank" rel="nofollow noopener"
       style="flex:1;min-width:140px;padding:.85rem;background:var(--bg2);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text1);font-size:.82rem;">
      &#127922; <strong>Scrabble Classic</strong><br>
      <span style="color:var(--accent);font-size:.78rem;">Shop on Amazon &#8594;</span>
    </a>
    <a href="https://www.amazon.com/s?k=scrabble+dictionary&tag=${esc(tag)}" target="_blank" rel="nofollow noopener"
       style="flex:1;min-width:140px;padding:.85rem;background:var(--bg2);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text1);font-size:.82rem;">
      &#128218; <strong>Scrabble Dictionary</strong><br>
      <span style="color:var(--accent);font-size:.78rem;">Shop on Amazon &#8594;</span>
    </a>
    <a href="https://www.amazon.com/s?k=word+games&tag=${esc(tag)}" target="_blank" rel="nofollow noopener"
       style="flex:1;min-width:140px;padding:.85rem;background:var(--bg2);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text1);font-size:.82rem;">
      &#9998; <strong>Word Game Sets</strong><br>
      <span style="color:var(--accent);font-size:.78rem;">Shop on Amazon &#8594;</span>
    </a>
  </div>
  <p style="font-size:.68rem;color:var(--text3);margin-top:.75rem;margin-bottom:0;">* As an Amazon Associate, LetterCracker earns from qualifying purchases.</p>
</section>`.trim();
}

function relatedToolsHTML(articleUrl) {
  /* Relative paths back to root from the output subdirectory */
  const base = OUT_DIR === '.' ? '' : '../';
  return `
<div style="margin-top:2rem;padding:1.25rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;">
  <h3 style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;margin-bottom:.75rem;">&#128295; More Free Word Tools</h3>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a href="${base}index.html"       style="padding:8px 16px;background:var(--accent);color:white;border-radius:9px;font-size:.875rem;font-weight:700;text-decoration:none;">Word Unscrambler</a>
    <a href="${base}anagram.html"     style="padding:8px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;font-size:.875rem;color:var(--text2);text-decoration:none;">Anagram Solver</a>
    <a href="${base}wordle.html"      style="padding:8px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;font-size:.875rem;color:var(--text2);text-decoration:none;">Wordle Solver</a>
    <a href="${base}dictionary.html"  style="padding:8px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;font-size:.875rem;color:var(--text2);text-decoration:none;">Dictionary Check</a>
    <a href="${base}word-scramble.html" style="padding:8px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;font-size:.875rem;color:var(--text2);text-decoration:none;">Word Scramble Game</a>
  </div>
</div>`.trim();
}


/* ── Internal Linking Engine ── */
const TOOL_KEYWORDS = {
  'word unscrambler':   'index.html',
  'unscramble':         'index.html',
  'unscrambler':        'index.html',
  'wordle solver':      'wordle.html',
  'wordle':             'wordle.html',
  'anagram solver':     'anagram.html',
  'anagram':            'anagram.html',
  'anagrams':           'anagram.html',
  'word scramble':      'word-scramble.html',
  'scramble game':      'word-scramble.html',
  'random word':        'random-word.html',
  'dictionary':         'dictionary.html',
  'define':             'dictionary.html',
  'definition':         'dictionary.html',
};

function applyInternalLinks(html, articleSlug) {
  const base = OUT_DIR === '.' ? '' : '../';
  let result = html;
  /* Only link the first occurrence of each keyword */
  Object.keys(TOOL_KEYWORDS).forEach(kw => {
    const url = base + TOOL_KEYWORDS[kw];
    /* Skip self-links */
    if (TOOL_KEYWORDS[kw].replace('.html','') === articleSlug) return;
    const escaped = kw.replace(/[-\/\^$*+?.()|[\]{}]/g,'\$&');
    const regex = new RegExp('(?<![a-zA-Z/])(' + escaped + ')(?![a-zA-Z])', 'i');
    result = result.replace(regex, `<a href="${url}" style="color:var(--accent);text-decoration:none;border-bottom:1px dotted var(--accent);">$1</a>`);
  });
  return result;
}

/* ── Cross-article internal links ── */
function buildCrossLinks(currentSlug, allReleased) {
  const base = OUT_DIR === '.' ? '' : '../';
  const currentEntry = allReleased.find(a => a.slug === currentSlug);
  if (!currentEntry) return function(html) { return html; };
  const currentTags = (currentEntry.tags || []).map(t => t.toLowerCase());

  return function(html) {
    const others = allReleased.filter(a => a.slug !== currentSlug && a.tags);
    others.forEach(other => {
      const otherTags = other.tags.map(t => t.toLowerCase());
      const shared = currentTags.some(t => otherTags.includes(t));
      if (!shared) return;
      /* Link the article title if it appears in content */
      const titleWords = other.title.toLowerCase().split(' ').slice(0, 3).join(' ');
      if (titleWords.length < 5) return;
      const escapedTitle = titleWords.replace(/[-\/\^$*+?.()|[\]{}]/g,'\$&');
      const regex = new RegExp('(?<![a-zA-Z])(' + escapedTitle + ')(?![a-zA-Z])', 'i');
      const url = `${base}${ART_PREFIX}${other.slug}.html`;
      html = html.replace(regex, `<a href="${url}" style="color:var(--accent);text-decoration:none;border-bottom:1px dotted var(--accent);">$1</a>`);
    });
    return html;
  };
}

/* ── Reading Time ── */
function calcReadingTime(html) {
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return mins + ' min read';
}

/* ── Auto FAQ Generator ── */
const FAQ_TEMPLATES = {
  wordle: [
    { q: 'What is the best starting word for Wordle?', a: 'High-frequency letter words like CRANE, SLATE, or RAISE are statistically the best starters because they cover the most common letters in English 5-letter words.' },
    { q: 'How many guesses do you get in Wordle?', a: 'You get 6 guesses to identify the hidden 5-letter word. Each guess must be a valid English word.' },
    { q: 'Can I use a Wordle solver to help?', a: 'Yes — our free Wordle Solver narrows down possible answers using your green, yellow, and grey clues to find the exact solution.' }
  ],
  scrabble: [
    { q: 'What are the highest-scoring letters in Scrabble?', a: 'Q and Z are worth 10 points each, followed by J and X at 8 points each. Using these on Double or Triple Letter Score squares maximises their value.' },
    { q: 'What is a bingo in Scrabble?', a: 'A bingo occurs when you use all 7 tiles from your rack in a single turn, earning a 50-point bonus on top of the word score.' },
    { q: 'How can I find high-scoring Scrabble words?', a: 'Use our free Word Unscrambler — enter your rack letters and results are sorted by Scrabble point value, showing your highest-scoring options first.' }
  ],
  anagram: [
    { q: 'What is an anagram?', a: 'An anagram is a word or phrase formed by rearranging all the letters of another word or phrase, using each letter exactly once.' },
    { q: 'How do I solve anagrams quickly?', a: 'Look for common prefixes, suffixes, and vowel patterns. Our free Anagram Solver can instantly find all valid words from any set of letters.' },
  ],
  default: [
    { q: 'What word tools does LetterCracker offer?', a: 'LetterCracker offers a free Word Unscrambler, Anagram Solver, Wordle Solver, Word Scramble Game, Dictionary, and Random Word Generator — all free, no registration needed.' },
    { q: 'How large is the LetterCracker word database?', a: 'Our database contains over 170,000 valid English words, covering standard Scrabble and Wordle dictionaries.' },
    { q: 'Are LetterCracker tools free to use?', a: 'Yes — all LetterCracker tools are completely free with no subscription, no registration, and no hidden costs.' }
  ]
};

function buildFAQSection(article) {
  /* Use manual FAQs if provided, else auto-generate from template */
  let faqs = [];
  if (Array.isArray(article.faqs) && article.faqs.length > 0) {
    faqs = article.faqs;
  } else {
    const cat = (article.category || '').toLowerCase();
    faqs = FAQ_TEMPLATES[cat] || FAQ_TEMPLATES['default'];
  }

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }, null, 0);

  const faqHTML = faqs.map(f => `
<div class="faq-item" style="border:1px solid var(--border);border-radius:12px;padding:1rem 1.25rem;margin-bottom:.75rem;">
  <h3 style="font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--text1);margin-bottom:.5rem;cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
    ${esc(f.q)} <span style="color:var(--text3);font-size:.75rem;float:right;margin-left:8px;">▾</span>
  </h3>
  <div class="faq-answer" style="font-size:.875rem;color:var(--text2);line-height:1.7;">${esc(f.a)}</div>
</div>`).join('');

  return `
<!-- FAQ Section -->
<section style="margin-top:2rem;" aria-label="Frequently Asked Questions">
  <h2 style="font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;margin-bottom:1rem;">❓ Frequently Asked Questions</h2>
  ${faqHTML}
</section>
<script type="application/ld+json">${faqSchema}</script>`;
}

/* ── Related Articles Section ── */
function buildRelatedArticles(currentSlug, allReleased) {
  const base = OUT_DIR === '.' ? '' : '../';
  const current = allReleased.find(a => a.slug === currentSlug);
  if (!current) return '';
  const currentTags = (current.tags || []).map(t => t.toLowerCase());
  const related = allReleased
    .filter(a => a.slug !== currentSlug && a.tags)
    .filter(a => a.tags.some(t => currentTags.includes(t.toLowerCase())))
    .slice(0, 3);
  if (!related.length) return '';
  const cards = related.map(a => `
<a href="${base}${OUT_DIR}/${a.slug}.html" style="flex:1;min-width:200px;padding:1rem;background:var(--bg2);border:1px solid var(--border);border-radius:12px;text-decoration:none;color:var(--text1);transition:.18s;display:block;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
  <div style="font-size:.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem;">${esc(a.category || 'Word Games')}</div>
  <div style="font-family:'Syne',sans-serif;font-size:.88rem;font-weight:700;line-height:1.4;">${esc(a.title)}</div>
  <div style="font-size:.78rem;color:var(--accent);margin-top:.5rem;font-weight:600;">Read →</div>
</a>`).join('');

  return `
<section style="margin-top:2rem;" aria-label="Related Articles">
  <h2 style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;margin-bottom:1rem;">📚 Related Articles</h2>
  <div style="display:flex;gap:12px;flex-wrap:wrap;">${cards}</div>
</section>`;
}

/* ── Social Share Buttons ── */
function buildSocialShare(title, url) {
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  return `
<div style="margin-top:1.75rem;padding:1rem 1.25rem;background:var(--surface);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
  <span style="font-size:.78rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-right:4px;">Share:</span>
  <a href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener" style="padding:6px 14px;background:#1da1f2;color:#fff;border-radius:8px;font-size:.78rem;font-weight:700;text-decoration:none;">𝕏 Twitter</a>
  <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" style="padding:6px 14px;background:#1877f2;color:#fff;border-radius:8px;font-size:.78rem;font-weight:700;text-decoration:none;">Facebook</a>
  <a href="https://api.whatsapp.com/send?text=${t}%20${u}" target="_blank" rel="noopener" style="padding:6px 14px;background:#25d366;color:#fff;border-radius:8px;font-size:.78rem;font-weight:700;text-decoration:none;">WhatsApp</a>
  <button onclick="navigator.clipboard&&navigator.clipboard.writeText('${url}').then(function(){this.textContent='✓ Copied!';var btn=this;setTimeout(function(){btn.textContent='Copy Link';},2000);}.bind(this))" style="padding:6px 14px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;">Copy Link</button>
</div>`;
}

/* ── Print Button ── */
function buildPrintButton() {
  return `
<button onclick="window.print()" style="margin-top:.75rem;padding:7px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;color:var(--text2);font-size:.78rem;cursor:pointer;font-family:'DM Sans',sans-serif;">🖨️ Print / Save as PDF</button>`;
}

/* ── Amazon Category Matching ── */
const AMAZON_PRODUCTS = {
  wordle: [
    { title: 'Word Puzzle Books', query: 'word+puzzle+books', emoji: '📖' },
    { title: 'Wordle Board Game', query: 'wordle+board+game', emoji: '🎲' },
    { title: 'Vocabulary Builders', query: 'vocabulary+building+books', emoji: '📚' }
  ],
  scrabble: [
    { title: 'Scrabble Classic Board Game', query: 'scrabble+board+game', emoji: '🎯' },
    { title: 'Official Scrabble Dictionary', query: 'official+scrabble+dictionary', emoji: '📖' },
    { title: 'Scrabble Tile Holder', query: 'scrabble+tile+holder+rack', emoji: '🏆' }
  ],
  anagram: [
    { title: 'Word Game Collections', query: 'word+game+collections', emoji: '🎮' },
    { title: 'Crossword Puzzle Books', query: 'crossword+puzzle+books', emoji: '✏️' },
    { title: 'Brain Training Games', query: 'brain+training+word+games', emoji: '🧠' }
  ],
  default: [
    { title: 'Scrabble Classic', query: 'scrabble+board+game', emoji: '🎲' },
    { title: 'Scrabble Dictionary', query: 'scrabble+dictionary', emoji: '📖' },
    { title: 'Word Game Sets', query: 'word+games+set', emoji: '✏️' }
  ]
};

function amazonSectionHTMLCategorised(category, tag) {
  if (!CONFIG.enableAmazon) return '';
  const cat = (category || '').toLowerCase();
  const products = AMAZON_PRODUCTS[cat] || AMAZON_PRODUCTS['default'];
  const cards = products.map(p => `
<a href="https://www.amazon.com/s?k=${p.query}&tag=${esc(tag)}" target="_blank" rel="nofollow noopener"
   style="flex:1;min-width:140px;padding:.85rem;background:var(--bg2);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text1);font-size:.82rem;">
  ${p.emoji} <strong>${p.title}</strong><br>
  <span style="color:var(--accent);font-size:.78rem;">Shop on Amazon →</span>
</a>`).join('');
  return `
<section class="amazon-section" style="margin:2rem 0;padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;">
  <h3 style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;margin-bottom:1rem;">🎯 Level Up Your Word Game</h3>
  <div style="display:flex;gap:10px;flex-wrap:wrap;">${cards}</div>
  <p style="font-size:.68rem;color:var(--text3);margin-top:.75rem;margin-bottom:0;">* As an Amazon Associate, LetterCracker earns from qualifying purchases.</p>
</section>`;
}

/* ── Scroll Progress Bar + Reading Time CSS (injected once per article) ── */
const ARTICLE_EXTRA_CSS = `
<style>
#lcScrollBar{position:fixed;top:0;left:0;width:0%;height:3px;background:var(--accent);z-index:9990;transition:width .1s linear;}
.lc-reading-meta{display:flex;align-items:center;gap:12px;font-size:.75rem;color:var(--text3);margin:.4rem 0 0;flex-wrap:wrap;}
@media print{#lcScrollBar,.theme-switcher,#navSlot,.visitor-bar,#footerSlot,.toast,#lcChatBtn,#lcChatWin,.ad-slot,.amazon-section{display:none!important;}.seo-body{max-width:100%!important;}.page-hero{page-break-inside:avoid;}}
</style>
<div id="lcScrollBar"></div>
<script>
window.addEventListener('scroll',function(){
  var el=document.getElementById('lcScrollBar');
  if(el){var pct=(window.scrollY/(document.body.scrollHeight-window.innerHeight))*100;el.style.width=Math.min(100,pct)+'%';}
},{passive:true});
</script>`;

/* ── BreadcrumbList Schema ── */
function buildBreadcrumbSchema(article) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": (article.category || 'Articles').charAt(0).toUpperCase() + (article.category || 'Articles').slice(1), "item": SITE_URL + "/category-" + (article.category || 'articles') + ".html" },
      { "@type": "ListItem", "position": 3, "name": article.title, "item": SITE_URL + "/" + ART_PREFIX + article.slug + ".html" }
    ]
  });
}

/* ── SoftwareApplication Schema (for tool pages) ── */
const TOOL_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LetterCracker",
  "url": "https://lettercracker.info",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://lettercracker.info/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});


/* ── Build one article HTML file ── */
function buildArticleHTML(article) {
  const base       = '';  /* articles now in root — no subdirectory */
  const canonical  = `${SITE_URL}/${ART_PREFIX}${article.slug}.html`;
  const robotsTag  = article.indexInSearch !== false
    ? 'index, follow'
    : 'noindex, follow';
  const showAds    = article.showAds !== false && CONFIG.enableAds;
  const adSlotsOn  = CONFIG.adSlots || {};
  const adsenseId  = CONFIG.adsenseId || 'ca-pub-XXXXXXXXXXXXXXXX';

  const tagsArray  = Array.isArray(article.tags) ? article.tags : [];
  /* Auto meta description fallback */
  if (!article.metaDescription && article.content) {
    article.metaDescription = article.content.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,155);
  }
  const tagsStr    = esc(tagsArray.join(', '));
  const pubDate    = article.releaseDate || TODAY_STR;

  const adsenseScript = showAds
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(adsenseId)}" crossorigin="anonymous"></script>`
    : '';

  const topBannerAd   = (showAds && adSlotsOn.topBanner)       ? adSlotHTML('Top Banner',        70)  : '';
  const inContentTop  = (showAds && adSlotsOn.inContentTop)    ? adSlotHTML('In-Content Top',    90)  : '';
  const inContentMid  = (showAds && adSlotsOn.inContentMiddle) ? adSlotHTML('In-Content Middle', 90)  : '';
  const inContentBot  = (showAds && adSlotsOn.inContentBottom) ? adSlotHTML('In-Content Bottom', 90)  : '';
  const endArticleAd  = (showAds && adSlotsOn.endOfArticle)    ? adSlotHTML('End of Article',    90)  : '';
  const amazonBlock   = (showAds && adSlotsOn.amazonSection && CONFIG.enableAmazon) ? amazonSectionHTML() : '';

  /* Split content in half for mid-article ad */
  let rawContent     = article.content || '<p>Content coming soon.</p>';
  rawContent         = applyInternalLinks(rawContent, article.slug);
  const fullContent  = rawContent;
  const paragraphs   = fullContent.split('</p>');
  const midPoint     = Math.floor(paragraphs.length / 2);
  const contentTop   = paragraphs.slice(0, midPoint).join('</p>') + (paragraphs.length > 1 ? '</p>' : '');
  const contentBot   = paragraphs.slice(midPoint).join('</p>');

  const relatedTools    = relatedToolsHTML(canonical);
  const readingTime     = calcReadingTime(fullContent);
  const faqSection      = buildFAQSection(article);
  const relatedArts     = buildRelatedArticles(article.slug, REGISTRY.filter(a => a.releaseDate && a.releaseDate <= TODAY_STR));
  const socialShare     = buildSocialShare(article.title, canonical);
  const printBtn        = buildPrintButton();
  const breadcrumbJson  = buildBreadcrumbSchema(article);
  const crossLinker     = buildCrossLinks(article.slug, REGISTRY.filter(a => a.releaseDate && a.releaseDate <= TODAY_STR));
  const amazonCat       = (showAds && adSlotsOn.amazonSection && CONFIG.enableAmazon) ? amazonSectionHTMLCategorised(article.category, CONFIG.amazonTag || 'yourstore-20') : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<script>(function(){var t=localStorage.getItem('lc_theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${esc(article.title)} | ${esc(CONFIG.siteName)}</title>
<meta name="description" content="${esc(article.metaDescription)}">
<meta name="robots" content="${robotsTag}">
<meta name="keywords" content="${tagsStr}">
<meta name="author" content="${esc(CONFIG.siteName)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type"        content="article">
<meta property="og:title"       content="${esc(article.title)} | ${esc(CONFIG.siteName)}">
<meta property="og:description" content="${esc(article.metaDescription)}">
<meta property="og:url"         content="${canonical}">
<meta property="og:image"       content="${esc(CONFIG.ogImage)}">
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="${esc(article.title)}">
<meta name="twitter:description" content="${esc(article.metaDescription)}">
<meta name="twitter:image"       content="${esc(CONFIG.ogImage)}">
<script type="application/ld+json">${breadcrumbJson}</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${esc(article.title)}",
  "description": "${esc(article.metaDescription)}",
  "url": "${canonical}",
  "datePublished": "${pubDate}",
  "dateModified": "${TODAY_STR}",
  "author": { "@type": "Organization", "name": "${esc(CONFIG.siteName)}", "url": "${SITE_URL}" },
  "publisher": { "@type": "Organization", "name": "${esc(CONFIG.siteName)}", "url": "${SITE_URL}" },
  "keywords": "${tagsStr}"
}
</script>
${adsenseScript}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}style.css">
<style>
.seo-body{max-width:820px;margin:0 auto;padding:2rem 1.5rem 5rem;}
.seo-body h2{font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:800;margin:1.75rem 0 .75rem;}
.seo-body p,.seo-body li{color:var(--text2);line-height:1.85;font-size:.95rem;margin-bottom:.75rem;}
.seo-body ul,.seo-body ol{padding-left:1.25rem;}
.seo-body strong{color:var(--text1);}
.seo-body a{color:var(--accent);}
.article-meta{font-size:.75rem;color:var(--text3);margin:.5rem 0 0;display:flex;gap:1rem;flex-wrap:wrap;}
.article-tag{display:inline-block;padding:2px 9px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;font-size:.68rem;color:var(--text3);margin-right:4px;}
@media(max-width:768px){.page-hero{padding:1rem!important;}.seo-body{padding:1.25rem 1rem 3rem;}}
</style>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#128292;</text></svg>">
</head>
${ARTICLE_EXTRA_CSS}
<body>

<div id="themeSwitcherSlot"></div>
<div class="visitor-bar" id="visitorBar"><div class="visitor-bar-inner"><span class="live-dot"></span><span>Loading&#8230;</span></div></div>
<div id="navSlot"></div>

<section class="page-hero">
  <h1>${esc(article.title)}</h1>
  <p>${esc(article.metaDescription)}</p>
  <div class="article-meta">
    <span>&#128197; ${pubDate}</span>
    <span>&#128209; ${esc(article.category || 'Word Games')}</span>
    <span>&#9200; ${readingTime}</span>
    ${tagsArray.map(t => `<span class="article-tag">${esc(t)}</span>`).join('')}
  </div>
</section>

${topBannerAd ? `<div class="container" style="padding:.5rem 1.5rem 0;">${topBannerAd}</div>` : ''}

<div class="seo-body">

${inContentTop}

${contentTop}

${inContentMid}

${contentBot}

${inContentBot}

<p style="margin-top:1.5rem;">Use our free <a href="${base}index.html"><strong>Word Unscrambler</strong></a> to find every possible word from any set of letters instantly.</p>

${socialShare}
${printBtn}

${endArticleAd}

${faqSection}

${relatedArts}

${relatedTools}

${amazonCat}

</div>

<div id="footerSlot"></div>
<div class="toast" id="toast"></div>
<script src="${base}shared.js"></script>
</body>
</html>`;
}

/* ── Generate sitemap.xml ── */
function buildSitemap(releasedAndIndexable) {
  const urls = [
    /* Always include core pages */
    { loc: `${SITE_URL}/`,                  priority: '1.0', changefreq: 'daily'   },
    { loc: `${SITE_URL}/anagram.html`,      priority: '0.9', changefreq: 'monthly' },
    { loc: `${SITE_URL}/wordle.html`,       priority: '0.9', changefreq: 'monthly' },
    { loc: `${SITE_URL}/word-scramble.html`,priority: '0.8', changefreq: 'monthly' },
    { loc: `${SITE_URL}/dictionary.html`,   priority: '0.8', changefreq: 'monthly' },
    { loc: `${SITE_URL}/random-word.html`,  priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/blog.html`,         priority: '0.7', changefreq: 'weekly'  },
    { loc: `${SITE_URL}/about.html`,        priority: '0.5', changefreq: 'yearly'  },
    { loc: `${SITE_URL}/contact.html`,      priority: '0.4', changefreq: 'yearly'  },
  ];

  /* Add auto-generated article pages */
  releasedAndIndexable.forEach(article => {
    urls.push({
      loc:        `${SITE_URL}/${ART_PREFIX}${article.slug}.html`,
      priority:   '0.8',
      changefreq: 'monthly',
      lastmod:    article.releaseDate,
    });
  });

  /* Add category pages */
  const categories = [...new Set(releasedAndIndexable.map(a => (a.category||'general').toLowerCase().replace(/\s+/g,'-')))];
  categories.forEach(cat => {
    urls.push({ loc: `${SITE_URL}/category-${cat}.html`, priority: '0.7', changefreq: 'weekly', lastmod: TODAY_STR });
  });

  const urlEntries = urls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${TODAY_STR}</lastmod>`}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/* ── Ping search engines with new sitemap ── */
function pingEngine(name, url) {
  return new Promise(resolve => {
    const req = https.get(url, res => {
      console.log(`  Pinged ${name}: HTTP ${res.statusCode}`);
      resolve();
    });
    req.on('error', () => {
      console.log(`  Ping ${name}: failed (network issue — will retry on next run)`);
      resolve();
    });
    req.setTimeout(8000, () => { req.destroy(); resolve(); });
  });
}

async function pingSearchEngines(sitemapUrl) {
  const engines = CONFIG.pingEngines || {};
  console.log('\nPinging search engines...');
  const pings = [];
  if (engines.google)  pings.push(pingEngine('Google',  `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`));
  if (engines.bing)    pings.push(pingEngine('Bing',    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`));
  if (engines.yandex)  pings.push(pingEngine('Yandex',  `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`));
  await Promise.all(pings);
}


/* ── Category Page Generator ── */
function buildCategoryHTML(category, articles) {
  const base     = OUT_DIR === '.' ? '' : '../';
  const catTitle = category.charAt(0).toUpperCase() + category.slice(1);
  const cards    = articles.map(a => `
<a href="${a.slug}.html" style="display:block;text-decoration:none;color:inherit;padding:1.25rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;transition:.18s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
  <div style="font-size:.68rem;color:var(--text3);margin-bottom:.35rem;">${esc(a.releaseDate || '')}</div>
  <h3 style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;color:var(--text1);margin-bottom:.5rem;line-height:1.4;">${esc(a.title)}</h3>
  <p style="font-size:.8rem;color:var(--text3);line-height:1.6;margin:0 0 .5rem;">${esc((a.metaDescription||'').slice(0,100))}${(a.metaDescription||'').length>100?'…':''}</p>
  <span style="font-size:.78rem;color:var(--accent);font-weight:600;">Read guide →</span>
</a>`).join('');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<script>(function(){var t=localStorage.getItem('lc_theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();</script>
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${catTitle} Guides &amp; Strategy Articles | LetterCracker</title>
<meta name="description" content="Browse all ${catTitle} guides, word lists, and strategy tips on LetterCracker. ${articles.length} articles published.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE_URL}/${OUT_DIR}/category-${category}.html">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔤</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}style.css">
</head>
<body>
<div id="themeSwitcherSlot"></div>
<div class="visitor-bar" id="visitorBar"><div class="visitor-bar-inner"><span class="live-dot"></span><span>Loading…</span></div></div>
<div id="navSlot"></div>
<section class="page-hero">
  <h1>${catTitle} Guides &amp; Articles</h1>
  <p>Browse all ${articles.length} ${catTitle} strategy guides, word lists, and expert tips — updated regularly.</p>
</section>
<div class="container" style="padding:2rem 1.5rem 5rem;">
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem;">
    ${cards}
  </div>
</div>
<div id="footerSlot"></div>
<div class="toast" id="toast"></div>
<script src="${base}shared.js"></script>
</body>
</html>`;
}

function generateCategoryPages(released) {
  const byCategory = {};
  released.forEach(a => {
    const cat = (a.category || 'general').toLowerCase().replace(/\s+/g,'-');
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  });
  const generated = [];
  Object.keys(byCategory).forEach(cat => {
    const filePath = path.join(OUT_DIR === '.' ? '.' : OUT_DIR, `category-${cat}.html`);
    fs.writeFileSync(filePath, buildCategoryHTML(cat, byCategory[cat]), 'utf8');
    console.log(`  ✓ category-${cat}.html  (${byCategory[cat].length} articles)`);
    generated.push({ cat, count: byCategory[cat].length, file: `category-${cat}.html` });
  });
  return generated;
}


/* ── Main run ── */
async function main() {
  console.log('='.repeat(56));
  console.log(' LetterCracker — Auto Page & Sitemap Generator');
  console.log(`  NY date/time : ${TODAY_STR} ${NY_TIME_STR} ET`);
  console.log(`  Site URL     : ${SITE_URL}`);
  console.log(`  Output dir   : ${OUT_DIR}/`);
  console.log(`  Articles in registry: ${REGISTRY.length}`);
  console.log('='.repeat(56));

  /* Separate articles into: released (past/today) vs future */
  /* ── Time-aware article filter (New York timezone) ── */
  function isArticleDue(a) {
    if (!a.releaseDate) return false;
    if (a.releaseDate > TODAY_STR) return false;          // Future date — not yet
    if (a.releaseDate < TODAY_STR) return true;           // Past date — always live
    // Same day — check publishTime
    if (!a.publishTime) return true;                      // No time set → always live today
    const [h, m] = a.publishTime.split(':').map(Number);
    return (h < NY_HOUR) || (h === NY_HOUR && m <= NY_MINUTE);
  }

  const released = REGISTRY.filter(isArticleDue);
  const future   = REGISTRY.filter(a => !isArticleDue(a));

  console.log(`\nReleased today or earlier : ${released.length} articles`);
  console.log(`Scheduled for future      : ${future.length} articles (skipped)`);

  /* Generate HTML files for all released articles */
  console.log('\nGenerating article pages...');
  let generated = 0;
  let skipped   = 0;

  released.forEach(article => {
    if (!article.slug) {
      console.log(`  SKIP (no slug): ${article.title}`);
      skipped++;
      return;
    }
    const filePath = path.join(OUT_DIR, `${ART_PREFIX}${article.slug}.html`);
    const html     = buildArticleHTML(article);
    fs.writeFileSync(filePath, html, 'utf8');
    const robotsLabel = article.indexInSearch !== false ? 'index' : 'noindex';
    const adsLabel    = article.showAds !== false && CONFIG.enableAds ? 'ads:ON' : 'ads:OFF';
    console.log(`  ✓ ${article.slug}.html  [${robotsLabel}] [${adsLabel}]`);
    generated++;
  });

  console.log(`\nGenerated: ${generated} files | Skipped: ${skipped} | Future: ${future.length}`);

  /* Generate sitemap.xml */
  const indexable = released.filter(a => a.indexInSearch !== false && a.slug);
  console.log(`\nBuilding sitemap.xml... (${indexable.length} article URLs + core pages)`);
  const sitemap = buildSitemap(indexable);
  fs.writeFileSync('sitemap.xml', sitemap, 'utf8');
  console.log('  ✓ sitemap.xml written');

  /* Ping search engines */
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  await pingSearchEngines(sitemapUrl);

  /* Duplicate slug check */
  const slugs = {};
  let dupWarnings = [];
  REGISTRY.forEach(a => {
    if (!a.slug) return;
    if (slugs[a.slug]) {
      const warn = `  ⚠️  DUPLICATE SLUG: "${a.slug}" used by "${slugs[a.slug]}" and "${a.title}"`;
      console.warn(warn);
      dupWarnings.push(warn);
    }
    slugs[a.slug] = a.title;
  });

  /* Generate category pages */
  console.log('\nGenerating category pages...');
  const catPages = generateCategoryPages(released);

  /* Build report */
  const buildReport = [
    `LetterCracker — Build Report`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Articles released : ${generated}`,
    `Articles future   : ${future.length}`,
    `Articles skipped  : ${skipped}`,
    `Category pages    : ${catPages.length}`,
    `Sitemap URLs      : ${indexable.length + 9}`,
    `Duplicate slugs   : ${dupWarnings.length}`,
    ``,
    dupWarnings.length ? 'WARNINGS:\n' + dupWarnings.join('\n') : 'No warnings.',
    ``,
    '── Category Pages ──',
    ...catPages.map(c => `  ${c.file}  (${c.count} articles)`),
    ``,
    '── Released Articles ──',
    ...released.map(a => `  [${a.indexInSearch!==false?'index':'noindex'}] ${a.slug} (${a.releaseDate})`),
  ].join('\n');

  fs.writeFileSync('last-build-report.txt', buildReport, 'utf8');
  console.log('\n  ✓ last-build-report.txt written');

  /* Summary */
  console.log('\n' + '='.repeat(56));
  console.log(' Done!');
  console.log(`  Article pages   : ${ART_PREFIX}*.html (${generated} files) — in root folder`);
  console.log(`  Category pages  : ${catPages.length}`);
  console.log(`  Sitemap         : sitemap.xml (${indexable.length + 9} URLs)`);
  console.log(`  Build report    : last-build-report.txt`);
  if (dupWarnings.length) console.warn(`  ⚠️  ${dupWarnings.length} duplicate slug(s) — check last-build-report.txt`);
  console.log(`  NY time         : ${TODAY_STR} ${NY_TIME_STR} ET`);
  console.log(`  Next step       : git add -A && git commit -m "Content release ${TODAY_STR}" && git push`);
  console.log('='.repeat(56));
}

main().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
