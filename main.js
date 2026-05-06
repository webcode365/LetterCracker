// LetterCracker — main.js
// Handles: unscramble logic, results display, game, WOTD, visitor display
// Phase 1/2/3: No domain or HTML changes needed here — pure JS logic file.
// All existing game logic and word-solving algorithms preserved exactly.

// ===================== OPTIONS PANEL =====================
var optionsToggle = document.getElementById('optionsToggle');
var optionsPanel  = document.getElementById('optionsPanel');
if (optionsToggle) {
  optionsToggle.addEventListener('click', function() {
    var open  = optionsPanel.classList.toggle('open');
    var arrow = optionsToggle.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = open ? '▴' : '▾';
    optionsToggle.setAttribute('aria-expanded', open);
  });
  optionsToggle.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') optionsToggle.click();
  });
}

// ===================== CLEAR BTN =====================
var clearBtn    = document.getElementById('clearBtn');
var letterInput = document.getElementById('letterInput');
if (clearBtn && letterInput) {
  clearBtn.addEventListener('click', function() {
    letterInput.value = '';
    letterInput.focus();
    clearBtn.style.opacity = '0';
    var rs = document.getElementById('resultsSection');
    if (rs) rs.style.display = 'none';
  });
  letterInput.addEventListener('input', function() {
    clearBtn.style.opacity = letterInput.value ? '1' : '0';
    letterInput.value = letterInput.value.toUpperCase().replace(/[^A-Z?*]/g, '');
  });
}

// ===================== UNSCRAMBLE =====================
var unscrambleBtn = document.getElementById('unscrambleBtn');
var searchCount   = parseInt(localStorage.getItem('lc_searches') || '0');

function doUnscramble() {
  var letters = letterInput && letterInput.value && letterInput.value.trim();
  if (!letters || letters.length < 2) { showToast('Please enter at least 2 letters'); return; }

  var options = {
    startsWith:   (document.getElementById('startsWith')   && document.getElementById('startsWith').value   && document.getElementById('startsWith').value.trim().toLowerCase())   || '',
    endsWith:     (document.getElementById('endsWith')     && document.getElementById('endsWith').value     && document.getElementById('endsWith').value.trim().toLowerCase())     || '',
    mustInclude:  (document.getElementById('mustInclude')  && document.getElementById('mustInclude').value  && document.getElementById('mustInclude').value.trim().toLowerCase())  || '',
    lengthFilter: (document.getElementById('lengthFilter') && document.getElementById('lengthFilter').value) || 'all',
    sortBy:       (document.getElementById('sortBy')       && document.getElementById('sortBy').value)       || 'length',
  };

  var loadingState   = document.getElementById('loadingState');
  var resultsSection = document.getElementById('resultsSection');
  if (loadingState)   loadingState.style.display   = 'flex';
  if (resultsSection) resultsSection.style.display = 'none';

  /* unscramble is now async — returns a Promise */
  WORD_DB.unscramble(letters, options).then(function(words) {
    displayResults(words, letters);
    if (loadingState) loadingState.style.display = 'none';
    searchCount++;
    localStorage.setItem('lc_searches', searchCount);
  });
}

if (unscrambleBtn) unscrambleBtn.addEventListener('click', doUnscramble);
if (letterInput)   letterInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doUnscramble(); });

function displayResults(words, letters) {
  var resultsSection  = document.getElementById('resultsSection');
  var resultsMeta     = document.getElementById('resultsMeta');
  var resultsByLength = document.getElementById('resultsByLength');
  if (!resultsSection || !resultsByLength) return;

  resultsSection.style.display = 'block';

  if (!words || words.length === 0) {
    resultsMeta.textContent    = 'No valid words found for "' + letters + '"';
    resultsByLength.innerHTML  = '<p style="color:var(--text3);font-size:0.9rem;padding:1rem 0;">Try removing some letters, or check your spelling. Use ? for blank tiles.</p>';
    return;
  }

  resultsMeta.textContent = 'Found ' + words.length + ' word' + (words.length !== 1 ? 's' : '') + ' from "' + letters + '"';

  // Group by length
  var groups = {};
  words.forEach(function(w) {
    var len = w.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(w);
  });

  var sortOrder = Object.keys(groups).map(Number).sort(function(a, b) { return b - a; });
  var html = '';
  sortOrder.forEach(function(len) {
    var label = len === 1 ? '1 Letter' : len + ' Letters';
    html += '<div class="word-group">' +
      '<div class="word-group-title">' + label + ' (' + groups[len].length + ')</div>' +
      '<div class="word-chips">' +
        groups[len].map(function(w) {
          var pts = WORD_DB.getPoints(w);
          return '<span class="word-chip" onclick="copyWord(\'' + w + '\')" title="' + pts + ' pts">' + w + '<span class="pts">' + pts + 'pt</span></span>';
        }).join('') +
      '</div>' +
    '</div>';
  });
  resultsByLength.innerHTML = html;

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyWord(word) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(word)
      .then(function() { showToast('"' + word + '" copied!'); })
      .catch(function() { showToast(word); });
  }
}

// Copy All
var copyAllBtn = document.getElementById('copyAllBtn');
if (copyAllBtn) {
  copyAllBtn.addEventListener('click', function() {
    var chips = document.querySelectorAll('.word-chip');
    var words = Array.from(chips).map(function(c) { return c.textContent.replace(/\d+pt$/, '').trim(); }).join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(words)
        .then(function() { showToast('All words copied!'); })
        .catch(function() { showToast('Copy failed'); });
    }
  });
}

// Export CSV
var exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', function() {
    var chips = document.querySelectorAll('.word-chip');
    var rows  = ['Word,Points'];
    chips.forEach(function(c) {
      var w = c.textContent.replace(/(\d+)pt$/, '').trim();
      var p = c.querySelector('.pts') && c.querySelector('.pts').textContent
        ? c.querySelector('.pts').textContent.replace('pt', '') : '';
      rows.push(w + ',' + p);
    });
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'lettercracker-results.csv';
    a.click();
    showToast('Results exported!');
  });
}

// Set input from tag click
function setInput(val) {
  if (!letterInput) return;
  letterInput.value = val;
  if (clearBtn) clearBtn.style.opacity = '1';
  doUnscramble();
  letterInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===================== TOAST =====================
function showToast(msg, dur) {
  var duration = dur || 2200;
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, duration);
}

// ===================== WORD OF THE DAY =====================
var WOTD_LIST = [
  {word:'ABERRANT',phonetic:'/ æbˈer.ənt/',pos:'adjective',def:'Departing from an accepted standard; abnormal.',example:'The scientist noted the aberrant results and repeated the experiment.',points:10},
  {word:'ABEYANCE',phonetic:'/ əˈbeɪ.əns/',pos:'noun',def:'A state of temporary suspension or inactivity.',example:'The project was held in abeyance until new funding arrived.',points:15},
  {word:'ABJURE',phonetic:'/ æbˈdʒʊər/',pos:'verb',def:'To formally renounce or reject a belief or claim.',example:'The politician abjured his earlier statements under public pressure.',points:15},
  {word:'ABSCOND',phonetic:'/ æbˈskɒnd/',pos:'verb',def:'To leave hurriedly and secretly, typically to avoid consequences.',example:"The treasurer absconded with the company's funds overnight.",points:12},
  {word:'ABSTAIN',phonetic:'/ əbˈsteɪn/',pos:'verb',def:'To restrain oneself from doing or enjoying something.',example:'She chose to abstain from voting on the controversial motion.',points:9},
  {word:'ABSTRUSE',phonetic:'/ æbˈstruːs/',pos:'adjective',def:'Difficult to understand; obscure.',example:"The professor's abstruse lecture confused most of the students.",points:10},
  {word:'ACCOLADE',phonetic:'/ ˈæk.ə.leɪd/',pos:'noun',def:'An award or privilege granted as a special honor.',example:'Winning the Nobel Prize is the highest accolade a scientist can receive.',points:13},
  {word:'ACERBIC',phonetic:'/ əˈsɜː.bɪk/',pos:'adjective',def:'Sharp and forthright in tone; harsh.',example:'Her acerbic wit made her columns entertaining but sometimes cruel.',points:13},
  {word:'ACQUIESCE',phonetic:'/ ˌæk.wiˈes/',pos:'verb',def:'To accept something reluctantly but without protest.',example:'He acquiesced to the demands despite his personal objections.',points:22},
  {word:'ACRIMONY',phonetic:'/ ˈæk.rɪ.mə.ni/',pos:'noun',def:'Bitterness or ill feeling in speech or manner.',example:'The divorce was marked by acrimony on both sides.',points:15},
  {word:'ADAMANT',phonetic:'/ ˈæd.ə.mənt/',pos:'adjective',def:'Refusing to be persuaded; firmly resolute.',example:'She was adamant that she had witnessed the crime firsthand.',points:10},
  {word:'ADMONISH',phonetic:'/ ədˈmɒn.ɪʃ/',pos:'verb',def:'To warn or reprimand firmly but not harshly.',example:'The teacher admonished the students for talking during the exam.',points:14},
  {word:'ADROIT',phonetic:'/ əˈdrɔɪt/',pos:'adjective',def:'Clever or skillful in using the hands or mind.',example:'The adroit negotiator secured a deal that satisfied both parties.',points:7},
  {word:'ADULATION',phonetic:'/ ˌæd.jʊˈleɪ.ʃən/',pos:'noun',def:'Excessive admiration or flattery.',example:'The pop star received adulation from millions of devoted fans.',points:10},
  {word:'ADVERSE',phonetic:'/ ˈæd.vɜːs/',pos:'adjective',def:'Preventing success or development; harmful.',example:'The team played well despite adverse weather conditions.',points:11},
  {word:'AESTHETIC',phonetic:'/ iːsˈθet.ɪk/',pos:'adjective',def:'Concerned with beauty or the appreciation of beauty.',example:'The architect had a strong aesthetic sense evident in every design.',points:14},
  {word:'AFFABLE',phonetic:'/ ˈæf.ə.bəl/',pos:'adjective',def:'Friendly, good-natured, and easy to talk to.',example:'The affable host made every guest feel welcome at the party.',points:15},
  {word:'AFFLUENT',phonetic:'/ ˈæf.lu.ənt/',pos:'adjective',def:'Having a great deal of money; wealthy.',example:'The affluent neighborhood was lined with large, well-kept homes.',points:14},
  {word:'ALACRITY',phonetic:'/ əˈlæk.rɪ.ti/',pos:'noun',def:'Brisk and cheerful readiness.',example:'The volunteers responded to the disaster with remarkable alacrity.',points:13},
  {word:'ALIENATE',phonetic:'/ ˈeɪ.li.ə.neɪt/',pos:'verb',def:'To cause someone to feel isolated or estranged.',example:'His arrogant attitude alienated his colleagues at work.',points:8},
  {word:'ALLEGORY',phonetic:'/ ˈæl.ɪ.ɡər.i/',pos:'noun',def:'A story with a hidden meaning, typically moral or political.',example:"Orwell's Animal Farm is a famous allegory about political corruption.",points:12},
  {word:'ALLEVIATE',phonetic:'/ əˈliː.vi.eɪt/',pos:'verb',def:'To make suffering or a problem less severe.',example:"The new medication helped alleviate the patient's chronic pain.",points:12},
  {word:'ALTRUISTIC',phonetic:'/ ˌæl.truˈɪs.tɪk/',pos:'adjective',def:'Showing selfless concern for the well-being of others.',example:'Her altruistic decision to donate her salary surprised everyone.',points:12},
  {word:'AMBIGUOUS',phonetic:'/ æmˈbɪɡ.ju.əs/',pos:'adjective',def:'Open to more than one interpretation; unclear.',example:'The contract contained an ambiguous clause that led to a legal dispute.',points:14},
  {word:'AMBIVALENT',phonetic:'/ æmˈbɪv.ə.lənt/',pos:'adjective',def:'Having mixed feelings about something.',example:'She felt ambivalent about accepting the job offer abroad.',points:17},
  {word:'AMELIORATE',phonetic:'/ əˈmiː.li.ə.reɪt/',pos:'verb',def:'To make something bad or unsatisfactory better.',example:'New policies were introduced to ameliorate the living conditions.',points:12},
  {word:'AMIABLE',phonetic:'/ ˈeɪ.mi.ə.bəl/',pos:'adjective',def:'Having a friendly and pleasant manner.',example:'The amiable professor was always willing to help struggling students.',points:11},
  {word:'ANACHRONISM',phonetic:'/ əˈnæk.rə.nɪ.z(ə)m/',pos:'noun',def:'A thing or person that belongs to a different time period.',example:'Using a typewriter in 2024 is quite an anachronism.',points:18},
  {word:'ANARCHY',phonetic:'/ ˈæn.ə.ki/',pos:'noun',def:'A state of disorder due to absence of authority.',example:'After the coup, the country descended into anarchy for several months.',points:15},
  {word:'ANOMALY',phonetic:'/ əˈnɒm.ə.li/',pos:'noun',def:'Something that deviates from what is standard or expected.',example:'The data showed an anomaly that scientists could not immediately explain.',points:12},
  {word:'ANTIPATHY',phonetic:'/ ænˈtɪp.ə.θi/',pos:'noun',def:'A deep-seated feeling of dislike or aversion.',example:'He felt a strong antipathy toward dishonesty in any form.',points:17},
  {word:'APATHY',phonetic:'/ ˈæp.ə.θi/',pos:'noun',def:'Lack of interest or concern; indifference.',example:'Voter apathy led to record-low turnout in the local elections.',points:14},
  {word:'ARBITRARY',phonetic:'/ ˈɑː.bɪ.trər.i/',pos:'adjective',def:'Based on random choice rather than reason or system.',example:'The arbitrary selection process seemed unfair to many applicants.',points:14},
  {word:'ARCANE',phonetic:'/ ɑːˈkeɪn/',pos:'adjective',def:'Known by few; mysterious or secret.',example:'The professor specialized in arcane medieval manuscripts.',points:8},
  {word:'ARDUOUS',phonetic:'/ ˈɑː.dju.əs/',pos:'adjective',def:'Requiring great effort; exhausting.',example:'The arduous trek through the mountains took three days.',points:8},
  {word:'ASCERTAIN',phonetic:'/ ˌæs.əˈteɪn/',pos:'verb',def:'To find out with certainty; to determine.',example:'Investigators worked hard to ascertain the cause of the explosion.',points:11},
  {word:'ASPIRE',phonetic:'/ əˈspaɪər/',pos:'verb',def:'To direct hopes and ambitions toward achieving something.',example:'She aspires to become the first woman to lead the organization.',points:8},
  {word:'ASSIDUOUS',phonetic:'/ əˈsɪd.ju.əs/',pos:'adjective',def:'Showing great care and perseverance.',example:'The assiduous student reviewed her notes every evening without fail.',points:10},
  {word:'ASSUAGE',phonetic:'/ əˈsweɪdʒ/',pos:'verb',def:'To make an unpleasant feeling less intense.',example:'He tried to assuage her guilt by reminding her it was an accident.',points:8},
  {word:'ASTUTE',phonetic:'/ əˈstjuːt/',pos:'adjective',def:'Having an ability to accurately assess situations; shrewd.',example:'The astute investor recognized the opportunity before others did.',points:6},
  {word:'ATROPHY',phonetic:'/ ˈæt.rə.fi/',pos:'verb',def:'To gradually decline in effectiveness or vigor through underuse.',example:'Without practice, her language skills began to atrophy.',points:15},
  {word:'AUDACIOUS',phonetic:'/ ɔːˈdeɪ.ʃəs/',pos:'adjective',def:'Showing a willingness to take surprising, bold risks.',example:'The audacious plan to climb the north face shocked experienced climbers.',points:12},
  {word:'AUSPICIOUS',phonetic:'/ ɔːˈspɪʃ.əs/',pos:'adjective',def:'Giving a favorable indication of future success.',example:'Their first meeting felt auspicious — they agreed on everything.',points:14},
  {word:'AUSTERE',phonetic:'/ ɒˈstɪər/',pos:'adjective',def:'Severe or strict in manner; without luxury or comfort.',example:'The prison had an austere appearance with bare concrete walls.',points:7},
  {word:'AVARICE',phonetic:'/ ˈæv.ər.ɪs/',pos:'noun',def:'Extreme greed for wealth or material gain.',example:'His avarice drove him to embezzle funds from his own charity.',points:12},
  {word:'BANAL',phonetic:'/ bəˈnɑːl/',pos:'adjective',def:'So lacking originality as to be obvious and boring.',example:"The film's banal plot disappointed critics who expected more.",points:7},
  {word:'BELLIGERENT',phonetic:'/ bəˈlɪdʒ.ər.ənt/',pos:'adjective',def:'Hostile and aggressive; inclined to start quarrels.',example:'The belligerent neighbor argued with everyone on the street.',points:14},
  {word:'BENEVOLENT',phonetic:'/ bəˈnev.ə.lənt/',pos:'adjective',def:'Well-meaning and kindly toward others.',example:'The benevolent donor gave millions to build schools in rural areas.',points:15},
  {word:'BENIGN',phonetic:'/ bɪˈnaɪn/',pos:'adjective',def:'Gentle and kindly; not harmful.',example:'The doctor confirmed the tumor was benign and required no treatment.',points:9},
  {word:'BOLSTER',phonetic:'/ ˈbəʊl.stər/',pos:'verb',def:'To support or strengthen something that is weak.',example:'The government announced new measures to bolster the struggling economy.',points:9},
  {word:'BREVITY',phonetic:'/ ˈbrev.ɪ.ti/',pos:'noun',def:'Concise and exact use of words; shortness of time.',example:'The speech was praised for its brevity and clarity.',points:15},
  {word:'CAPRICIOUS',phonetic:'/ kəˈprɪʃ.əs/',pos:'adjective',def:'Given to sudden changes of mood or behavior.',example:'The capricious weather ruined their outdoor wedding plans.',points:16},
  {word:'CATALYST',phonetic:'/ ˈkæt.ə.lɪst/',pos:'noun',def:'A person or thing that precipitates an event.',example:'The assassination was the catalyst for the outbreak of war.',points:13},
  {word:'CAUSTIC',phonetic:'/ ˈkɔː.stɪk/',pos:'adjective',def:'Sarcastic in a way that is unkind; corrosive to flesh.',example:'His caustic remarks about her work left her feeling dejected.',points:11},
  {word:'COGENT',phonetic:'/ ˈkəʊ.dʒənt/',pos:'adjective',def:'Clear, logical, and convincing.',example:'Her cogent argument persuaded even the most skeptical members.',points:9},
  {word:'COMPLACENT',phonetic:'/ kəmˈpleɪ.sənt/',pos:'adjective',def:'Showing uncritical satisfaction with oneself.',example:'The team became complacent after their early-season victories.',points:18},
  {word:'CONFLUENCE',phonetic:'/ ˈkɒn.flu.əns/',pos:'noun',def:'The junction of two rivers; a coming together of people or things.',example:'At the confluence of the two rivers, the town had grown into a city.',points:17},
  {word:'COPIOUS',phonetic:'/ ˈkəʊ.pi.əs/',pos:'adjective',def:'Abundant in supply or quantity; plentiful.',example:'She took copious notes during the lecture.',points:11},
  {word:'CRYPTIC',phonetic:'/ ˈkrɪp.tɪk/',pos:'adjective',def:'Having a meaning that is mysterious or obscure.',example:'She left a cryptic note that nobody could fully decipher.',points:16},
  {word:'CYNICAL',phonetic:'/ ˈsɪn.ɪ.kəl/',pos:'adjective',def:'Believing people are motivated purely by self-interest.',example:'His cynical view of politics made him reluctant to vote.',points:14},
  {word:'DEFT',phonetic:'/ deft/',pos:'adjective',def:'Demonstrating skill and cleverness.',example:'With a deft movement, the surgeon closed the incision perfectly.',points:8},
  {word:'DESPONDENT',phonetic:'/ dɪˈspɒn.dənt/',pos:'adjective',def:'In low spirits from loss of hope or courage.',example:'After failing the exam twice, she felt utterly despondent.',points:14},
  {word:'DILIGENT',phonetic:'/ ˈdɪl.ɪ.dʒənt/',pos:'adjective',def:'Having or showing care and conscientiousness in work.',example:'The diligent student reviewed every chapter before the final exam.',points:10},
  {word:'DISCERN',phonetic:'/ dɪˈsɜːn/',pos:'verb',def:'To perceive or recognize something clearly.',example:'It was difficult to discern the truth among so many conflicting accounts.',points:10},
  {word:'DISSENT',phonetic:'/ dɪˈsent/',pos:'noun',def:'The expression of opposition to official policy.',example:'The new law was met with widespread dissent from civil groups.',points:8},
  {word:'ECCENTRIC',phonetic:'/ ɪkˈsen.trɪk/',pos:'adjective',def:'Unconventional and slightly strange in behavior.',example:'The eccentric scientist kept live insects in his office.',points:15},
  {word:'EGREGIOUS',phonetic:'/ ɪˈɡriː.dʒəs/',pos:'adjective',def:'Outstandingly bad; shocking.',example:'The judge called it an egregious violation of human rights.',points:11},
  {word:'ELUSIVE',phonetic:'/ ɪˈluː.sɪv/',pos:'adjective',def:'Difficult to find, catch, or achieve.',example:'The solution to the problem proved elusive for months.',points:10},
  {word:'ENIGMA',phonetic:'/ ɪˈnɪɡ.mə/',pos:'noun',def:'A person or thing that is mysterious and difficult to understand.',example:'The ancient inscription remained an enigma to archaeologists.',points:9},
  {word:'EPHEMERAL',phonetic:'/ ɪˈfem.ər.əl/',pos:'adjective',def:'Lasting for only a very short time.',example:'The ephemeral beauty of cherry blossoms lasts just one week.',points:16},
  {word:'EQUIVOCAL',phonetic:'/ ɪˈkwɪv.ə.kəl/',pos:'adjective',def:'Open to more than one interpretation; ambiguous.',example:'His equivocal reply left everyone uncertain of his true intentions.',points:23},
  {word:'ERUDITE',phonetic:'/ ˈer.ʊ.daɪt/',pos:'adjective',def:'Having or showing great knowledge or learning.',example:'The erudite professor could discuss philosophy, science, and art equally.',points:8},
  {word:'EUPHEMISM',phonetic:'/ ˈjuː.fə.mɪ.z(ə)m/',pos:'noun',def:'A mild expression substituted for one that might offend.',example:'Passed away is a common euphemism for died.',points:18},
  {word:'EXACERBATE',phonetic:'/ ɪɡˈzæs.ə.beɪt/',pos:'verb',def:'To make a problem or bad situation worse.',example:'The drought was exacerbated by the unusually high temperatures.',points:21},
  {word:'EXONERATE',phonetic:'/ ɪɡˈzɒn.ər.eɪt/',pos:'verb',def:'To absolve from blame or criminal charges.',example:'New DNA evidence exonerated the man who had served fifteen years.',points:16},
  {word:'EXPLICIT',phonetic:'/ ɪkˈsplɪs.ɪt/',pos:'adjective',def:'Stated clearly and in detail, leaving no room for confusion.',example:'The contract contained explicit instructions on payment terms.',points:19},
  {word:'FABRICATE',phonetic:'/ ˈfæb.rɪ.keɪt/',pos:'verb',def:'To invent information in order to deceive.',example:'He fabricated an alibi but was exposed by security footage.',points:16},
  {word:'FALLACY',phonetic:'/ ˈfæl.ə.si/',pos:'noun',def:'A mistaken belief based on unsound argument.',example:'The idea that vaccines cause autism is a dangerous fallacy.',points:15},
  {word:'FERVENT',phonetic:'/ ˈfɜː.vənt/',pos:'adjective',def:'Having or displaying passionate intensity.',example:'He was a fervent supporter of environmental protection.',points:13},
  {word:'FRUGAL',phonetic:'/ ˈfruː.ɡəl/',pos:'adjective',def:'Sparing or economical with regard to money or food.',example:'His frugal lifestyle allowed him to retire at the age of forty.',points:10},
  {word:'FUTILE',phonetic:'/ ˈfjuː.taɪl/',pos:'adjective',def:'Incapable of producing any useful result; pointless.',example:'All efforts to stop the flooding proved futile.',points:9},
  {word:'GRANDEUR',phonetic:'/ ˈɡræn.dʒər/',pos:'noun',def:'Splendor and impressiveness, especially of appearance.',example:'Tourists came from all over to admire the grandeur of the palace.',points:10},
  {word:'GUILE',phonetic:'/ ɡaɪl/',pos:'noun',def:'Sly or cunning intelligence; craftiness.',example:'He used guile rather than force to achieve his objectives.',points:6},
  {word:'HARBINGER',phonetic:'/ ˈhɑː.bɪn.dʒər/',pos:'noun',def:'A person or thing that announces the approach of something.',example:"The cuckoo's call is considered a harbinger of spring.",points:15},
  {word:'HEGEMONY',phonetic:'/ hɪˈɡem.ə.ni/',pos:'noun',def:'Leadership or dominance, especially of one country over others.',example:'The empire maintained its hegemony through military strength.',points:17},
  {word:'HUBRIS',phonetic:'/ ˈhjuː.brɪs/',pos:'noun',def:'Excessive pride or self-confidence leading to downfall.',example:'His hubris blinded him to the legitimate concerns of his team.',points:11},
  {word:'HYPOTHESIS',phonetic:'/ haɪˈpɒθ.ə.sɪs/',pos:'noun',def:'A proposed explanation based on limited evidence.',example:'The scientist formed a hypothesis and designed experiments to test it.',points:21},
  {word:'IMMUTABLE',phonetic:'/ ɪˈmjuː.tə.bəl/',pos:'adjective',def:'Unchanging over time; unable to be changed.',example:'The laws of mathematics are considered immutable.',points:15},
  {word:'IMPERIOUS',phonetic:'/ ɪmˈpɪər.i.əs/',pos:'adjective',def:'Assuming power or authority without justification; arrogant.',example:'His imperious manner made subordinates reluctant to speak openly.',points:13},
  {word:'IMPETUOUS',phonetic:'/ ɪmˈpetʃ.u.əs/',pos:'adjective',def:'Acting without thought or care; impulsive.',example:'His impetuous decision to quit cost him years of career progress.',points:13},
  {word:'INEVITABLE',phonetic:'/ ɪnˈev.ɪ.tə.bəl/',pos:'adjective',def:'Certain to happen; unavoidable.',example:'Change is inevitable in any dynamic organization.',points:15},
  {word:'INGENIOUS',phonetic:'/ ɪnˈdʒiː.ni.əs/',pos:'adjective',def:'Clever, original, and inventive.',example:'The ingenious solution used materials that were already on site.',points:10},
  {word:'INTEGRITY',phonetic:'/ ɪnˈteɡ.rɪ.ti/',pos:'noun',def:'The quality of being honest and having strong moral principles.',example:'Her integrity was never questioned during her long career.',points:13},
  {word:'INTRINSIC',phonetic:'/ ɪnˈtrɪn.zɪk/',pos:'adjective',def:'Belonging naturally; essential; fundamental.',example:'The intrinsic value of education goes beyond earning potential.',points:11},
  {word:'JARGON',phonetic:'/ ˈdʒɑː.ɡən/',pos:'noun',def:'Special words used by a particular group that are hard for others to understand.',example:'The legal jargon in the contract confused the average reader.',points:14},
  {word:'JUXTAPOSE',phonetic:'/ ˈdʒʌk.stə.pəʊz/',pos:'verb',def:'To place side by side for comparison or contrast.',example:'The exhibition juxtaposes ancient artifacts with modern interpretations.',points:25},
  {word:'LABYRINTH',phonetic:'/ ˈlæb.ɪ.rɪnθ/',pos:'noun',def:'A complicated network of passages; a complex situation.',example:'Navigating the tax system felt like moving through a labyrinth.',points:17},
  {word:'LAMENT',phonetic:'/ ləˈment/',pos:'verb',def:'To express passionate grief or regret about something.',example:'She lamented the loss of the old neighborhood library.',points:8},
  {word:'LETHARGIC',phonetic:'/ ləˈθɑː.dʒɪk/',pos:'adjective',def:'Affected by lethargy; sluggish and apathetic.',example:'After the long journey, everyone felt too lethargic to unpack.',points:15},
  {word:'LUCID',phonetic:'/ ˈluː.sɪd/',pos:'adjective',def:'Expressed clearly; easy to understand; rational.',example:'Despite his age, the professor remained lucid and sharp.',points:8},
  {word:'MALEVOLENT',phonetic:'/ məˈlev.ə.lənt/',pos:'adjective',def:'Having or showing a wish to do evil to others.',example:"The story's villain was purely malevolent with no redeeming qualities.",points:15},
  {word:'MALLEABLE',phonetic:'/ ˈmæl.i.ə.bəl/',pos:'adjective',def:'Easily influenced; pliable; able to be shaped.',example:'Young minds are malleable and absorb new languages quickly.',points:13},
  {word:'METICULOUS',phonetic:'/ məˈtɪk.jʊ.ləs/',pos:'adjective',def:'Showing great attention to detail; very careful.',example:'The meticulous accountant never made a single arithmetic error.',points:14},
  {word:'MITIGATE',phonetic:'/ ˈmɪt.ɪ.ɡeɪt/',pos:'verb',def:'To make less severe, serious, or painful.',example:'Steps were taken to mitigate the environmental impact of the factory.',points:11},
  {word:'MUNDANE',phonetic:'/ mʌnˈdeɪn/',pos:'adjective',def:'Lacking interest or excitement; dull.',example:'He longed for adventure after years of mundane office work.',points:10},
  {word:'NEFARIOUS',phonetic:'/ nɪˈfeər.i.əs/',pos:'adjective',def:'Wicked or criminal in nature.',example:'The nefarious scheme defrauded thousands of elderly people.',points:12},
  {word:'OBSCURE',phonetic:'/ əbˈskjʊər/',pos:'adjective',def:'Not discovered or known about; uncertain.',example:'The artist remained obscure during her lifetime but is now celebrated.',points:11},
  {word:'OMINOUS',phonetic:'/ ˈɒm.ɪ.nəs/',pos:'adjective',def:'Giving the impression something bad is going to happen.',example:'Dark ominous clouds gathered on the horizon before the storm.',points:9},
  {word:'OPULENT',phonetic:'/ ˈɒp.jʊ.lənt/',pos:'adjective',def:'Ostentatiously rich and luxurious.',example:'The opulent interior of the palace left visitors speechless.',points:9},
  {word:'PARADIGM',phonetic:'/ ˈpær.ə.daɪm/',pos:'noun',def:'A typical example or pattern of something; a framework.',example:'The discovery created a new paradigm for understanding the universe.',points:14},
  {word:'PARADOX',phonetic:'/ ˈpær.ə.dɒks/',pos:'noun',def:'A statement that seems self-contradictory but contains truth.',example:'It is a paradox that standing still can sometimes move a situation forward.',points:17},
  {word:'PARAMOUNT',phonetic:'/ ˈpær.ə.maʊnt/',pos:'adjective',def:'More important than anything else; supreme.',example:'Patient safety is of paramount importance in any medical procedure.',points:13},
  {word:'PENSIVE',phonetic:'/ ˈpen.sɪv/',pos:'adjective',def:'Engaged in deep or serious thought.',example:'He sat by the window in a pensive mood, staring at the rain.',points:12},
  {word:'PERENNIAL',phonetic:'/ pəˈren.i.əl/',pos:'adjective',def:'Lasting or existing for a long or apparently infinite time.',example:'Funding for public education is a perennial political debate.',points:11},
  {word:'PERVASIVE',phonetic:'/ pəˈveɪ.sɪv/',pos:'adjective',def:'Spreading widely throughout an area or group.',example:'Distrust of politicians had become pervasive in the society.',points:17},
  {word:'PLAUSIBLE',phonetic:'/ ˈplɔː.zɪ.bəl/',pos:'adjective',def:'Seeming reasonable or probable; credible.',example:'Her explanation was plausible but not entirely convincing.',points:13},
  {word:'PRAGMATIC',phonetic:'/ præɡˈmæt.ɪk/',pos:'adjective',def:'Dealing with things sensibly and realistically.',example:'A pragmatic approach to the problem yielded quick results.',points:16},
  {word:'PRECARIOUS',phonetic:'/ prɪˈkeər.i.əs/',pos:'adjective',def:'Not securely held; dependent on chance; uncertain.',example:'The climber found herself in a precarious position on the rockface.',points:14},
  {word:'PROFOUND',phonetic:'/ prəˈfaʊnd/',pos:'adjective',def:'Very great or intense; having deep insight.',example:'Her speech had a profound effect on every person in the audience.',points:14},
  {word:'PRUDENT',phonetic:'/ ˈpruː.dənt/',pos:'adjective',def:'Acting with care and thought for the future.',example:'It is prudent to save money before making large investments.',points:10},
  {word:'QUANDARY',phonetic:'/ ˈkwɒn.dər.i/',pos:'noun',def:'A state of perplexity or uncertainty; a difficult situation.',example:'She was in a quandary over whether to report her colleague.',points:21},
  {word:'RANCOR',phonetic:'/ ˈræŋ.kər/',pos:'noun',def:'Bitterness or resentment, especially when long-standing.',example:'Years of rancor between the families made cooperation impossible.',points:8},
  {word:'RESILIENT',phonetic:'/ rɪˈzɪl.i.ənt/',pos:'adjective',def:'Able to withstand or recover quickly from difficulties.',example:'Children are often more resilient than adults give them credit for.',points:9},
  {word:'RHETORIC',phonetic:'/ ˈret.ər.ɪk/',pos:'noun',def:'Persuasive language used in speaking or writing.',example:"The candidate's rhetoric was inspiring but short on concrete policy.",points:13},
  {word:'RIGOROUS',phonetic:'/ ˈrɪɡ.ər.əs/',pos:'adjective',def:'Extremely thorough and careful; demanding.',example:'The study underwent rigorous peer review before publication.',points:9},
  {word:'SAGACIOUS',phonetic:'/ səˈɡeɪ.ʃəs/',pos:'adjective',def:'Having good judgement; showing wisdom.',example:'The sagacious leader anticipated the crisis months in advance.',points:12},
  {word:'SKEPTICAL',phonetic:'/ ˈskep.tɪ.kəl/',pos:'adjective',def:'Not easily convinced; having doubts.',example:"She remained skeptical of the new treatment's claimed benefits.",points:17},
  {word:'SPURIOUS',phonetic:'/ ˈspjʊər.i.əs/',pos:'adjective',def:'Not being what it purports to be; false.',example:'The report was based on spurious data and later retracted.',points:10},
  {word:'STOIC',phonetic:'/ ˈstəʊ.ɪk/',pos:'adjective',def:'Enduring pain or hardship without complaint.',example:'He remained stoic throughout the difficult medical procedures.',points:7},
  {word:'SUBTLE',phonetic:'/ ˈsʌt.əl/',pos:'adjective',def:'So delicate or precise as to be difficult to analyze.',example:'There was a subtle shift in his tone that she immediately noticed.',points:8},
  {word:'SUCCINCT',phonetic:'/ səkˈsɪŋkt/',pos:'adjective',def:'Briefly and clearly expressed.',example:'His succinct summary captured the key points in under a minute.',points:14},
  {word:'SUPERFLUOUS',phonetic:'/ suːˈpɜː.flu.əs/',pos:'adjective',def:'Unnecessary, especially through being more than enough.',example:"The long introduction was superfluous and tried the reader's patience.",points:16},
  {word:'SYCOPHANT',phonetic:'/ ˈsɪk.ə.fənt/',pos:'noun',def:'A person who acts obsequiously to gain advantage.',example:'The CEO surrounded himself with sycophants who never challenged him.',points:19},
  {word:'TENACIOUS',phonetic:'/ tɪˈneɪ.ʃəs/',pos:'adjective',def:'Tending to keep a firm hold; determined.',example:"The tenacious lawyer refused to give up on her client's case.",points:11},
  {word:'THOROUGH',phonetic:'/ ˈθʌr.ə/',pos:'adjective',def:'Complete with regard to every detail; not superficial.',example:'The auditor carried out a thorough examination of the accounts.',points:15},
  {word:'TRANSIENT',phonetic:'/ ˈtræn.zi.ənt/',pos:'adjective',def:'Lasting only for a short time; impermanent.',example:'The pain was transient and disappeared within a few hours.',points:9},
  {word:'TREPIDATION',phonetic:'/ ˌtrep.ɪˈdeɪ.ʃən/',pos:'noun',def:'A feeling of fear or anxiety about something uncertain.',example:'She approached the interview with a mixture of excitement and trepidation.',points:14},
  {word:'UBIQUITOUS',phonetic:'/ juːˈbɪk.wɪ.təs/',pos:'adjective',def:'Present, appearing, or found everywhere.',example:'Smartphones have become ubiquitous in modern daily life.',points:21},
  {word:'UNPRECEDENTED',phonetic:'/ ʌnˈpres.ɪ.den.tɪd/',pos:'adjective',def:'Never done or known before.',example:'The storm caused unprecedented damage along the coastline.',points:19},
  {word:'VACILLATE',phonetic:'/ ˈvæs.ɪ.leɪt/',pos:'verb',def:'To waver between different opinions or actions; to be indecisive.',example:'He vacillated for weeks before finally choosing a career path.',points:14},
  {word:'VENERATE',phonetic:'/ ˈven.ər.eɪt/',pos:'verb',def:'To regard with great respect and reverence.',example:'The community gathered to venerate the memory of their founder.',points:11},
  {word:'VERBOSE',phonetic:'/ vɜːˈbəʊs/',pos:'adjective',def:'Using more words than needed; wordy.',example:'The verbose report could have been summarized in two pages.',points:12},
  {word:'VINDICATE',phonetic:'/ ˈvɪn.dɪ.keɪt/',pos:'verb',def:'To clear from blame or suspicion; to justify.',example:'The new evidence fully vindicated the accused man.',points:15},
  {word:'VOLATILE',phonetic:'/ ˈvɒl.ə.taɪl/',pos:'adjective',def:'Liable to change rapidly and unpredictably; explosive.',example:'The volatile stock market made investors nervous throughout the year.',points:11},
  {word:'ZEALOUS',phonetic:'/ ˈzel.əs/',pos:'adjective',def:'Having or showing great energy or enthusiasm for a cause.',example:'The zealous campaigner knocked on hundreds of doors every weekend.',points:16},
  {word:'ZEAL',phonetic:'/ ziːl/',pos:'noun',def:'Great energy or enthusiasm in pursuit of a cause.',example:'She approached every task with infectious zeal and dedication.',points:13},
  {word:'ZENITH',phonetic:'/ ˈzen.ɪθ/',pos:'noun',def:'The time at which something is most powerful; the highest point.',example:'At the zenith of his career he was the most celebrated writer alive.',points:18}
];

function setWOTD() {
  var day = Math.floor(Date.now() / 86400000) % WOTD_LIST.length;
  var w   = WOTD_LIST[day];
  var el  = function(n) { return document.getElementById(n); };
  if (el('wotdWord'))     el('wotdWord').textContent     = w.word.charAt(0).toUpperCase() + w.word.slice(1).toLowerCase();
  if (el('wotdPhonetic')) el('wotdPhonetic').textContent = w.phonetic;
  if (el('wotdPos'))      el('wotdPos').textContent      = w.pos;
  if (el('wotdDef'))      el('wotdDef').textContent      = w.def;
  if (el('wotdExample'))  el('wotdExample').textContent  = w.example || '';
  if (el('wotdPoints'))   el('wotdPoints').textContent   = w.points;
}
setWOTD();

// ===================== WORD SCRAMBLE GAME =====================
var GAME_WORDS = [
  'PLANET','GARDEN','BRIDGE','CASTLE','FLOWER','MONKEY','SHADOW','TURTLE',
  'CANDLE','BUTTER','SIMPLE','ORANGE','PURPLE','SILVER','GOLDEN','WINTER',
  'SPRING','SUMMER','DRAGON','PIRATE','JUNGLE','ROCKET','FINGER','MIRROR',
  'WONDER','BLANKET','CHICKEN','DOLPHIN','FREEDOM','HARVEST','JOURNEY','KINGDOM',
  'LIBRARY','MORNING','NETWORK','OUTSIDE','PATTERN','QUARTER','RAINBOW','SERIOUS',
  'THUNDER','UNIFORM','VILLAGE','WARRIOR','VICTORY','WELCOME','YOUTUBE','CRYSTAL'
];

var gameState = {
  active: false, score: 0, timer: null, timeLeft: 60,
  currentWord: '', scrambled: '', wordPool: [], answered: []
};

function shuffleArray(arr) { return arr.slice().sort(function() { return Math.random() - 0.5; }); }

function scrambleWord(word) {
  var letters = word.split('');
  var scrambled;
  do { scrambled = shuffleArray(letters).join(''); } while (scrambled === word && word.length > 1);
  return scrambled;
}

function startGame() {
  gameState.score    = 0;
  gameState.timeLeft = 60;
  gameState.wordPool = shuffleArray(GAME_WORDS);
  gameState.answered = [];
  gameState.active   = true;

  document.getElementById('gameStart').style.display = 'none';
  document.getElementById('gameOver').style.display  = 'none';
  document.getElementById('gamePlay').style.display  = 'block';
  document.getElementById('gameAnswer').classList.remove('visible');
  document.getElementById('gameFeedback').textContent = '';

  updateGameUI();
  nextWord();

  if (gameState.timer) clearInterval(gameState.timer);
  gameState.timer = setInterval(function() {
    gameState.timeLeft--;
    var timerEl = document.getElementById('gameTimer');
    var barEl   = document.getElementById('timerBar');
    if (timerEl) {
      timerEl.textContent = gameState.timeLeft;
      timerEl.className   = 'hud-value' + (gameState.timeLeft <= 10 ? ' timer-warning' : '');
    }
    if (barEl) barEl.style.width = (gameState.timeLeft / 60 * 100) + '%';
    if (gameState.timeLeft <= 0) endGame();
  }, 1000);

  var gameInput = document.getElementById('gameInput');
  if (gameInput) {
    gameInput.focus();
    gameInput.addEventListener('keydown', gameKeydown);
  }
}

function gameKeydown(e) { if (e.key === 'Enter') checkGameAnswer(); }

function nextWord() {
  if (gameState.wordPool.length === 0) gameState.wordPool = shuffleArray(GAME_WORDS);
  gameState.currentWord = gameState.wordPool.pop();
  gameState.scrambled   = scrambleWord(gameState.currentWord);
  var el = document.getElementById('gameScrambled');
  if (el) {
    el.innerHTML = gameState.scrambled.split('').map(function(l) {
      return '<span class="letter-tile">' + l + '</span>';
    }).join('');
  }
  document.getElementById('gameInput').value = '';
  document.getElementById('gameAnswer').classList.remove('visible');
  document.getElementById('gameFeedback').textContent = '';
}

function checkGameAnswer() {
  if (!gameState.active) return;
  var input = document.getElementById('gameInput');
  var guess = (input && input.value ? input.value : '').trim().toUpperCase();
  if (!guess) return;

  if (guess === gameState.currentWord) {
    var pts = gameState.currentWord.length >= 7 ? 3 : gameState.currentWord.length >= 5 ? 2 : 1;
    gameState.score += pts;
    updateGameUI();
    showFeedback('✓ Correct! +' + pts + ' point' + (pts > 1 ? 's' : ''), true);
    document.querySelectorAll('.letter-tile').forEach(function(t) { t.style.color = 'var(--green)'; });
    setTimeout(nextWord, 600);
  } else {
    showFeedback('✗ Try again!', false);
    input.value = '';
    document.querySelectorAll('.letter-tile').forEach(function(t) {
      t.style.color = 'var(--red)';
      setTimeout(function() { t.style.color = ''; }, 500);
    });
  }
}

function showFeedback(msg, correct) {
  var el = document.getElementById('gameFeedback');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'game-feedback ' + (correct ? 'feedback-correct' : 'feedback-wrong');
}

function skipWord() {
  if (!gameState.active) return;
  var ansEl   = document.getElementById('gameAnswer');
  var ansWord = document.getElementById('answerWord');
  if (ansEl && ansWord) { ansWord.textContent = gameState.currentWord; ansEl.classList.add('visible'); }
  setTimeout(nextWord, 1200);
}

function showHint() {
  if (!gameState.active) return;
  var hint = gameState.currentWord[0] + '_'.repeat(gameState.currentWord.length - 1);
  showFeedback('Hint: ' + hint, true);
}

function updateGameUI() {
  var scoreEl = document.getElementById('gameScore');
  var bestEl  = document.getElementById('gameBest');
  var best    = Math.max(parseInt(localStorage.getItem('lc_game_best') || '0'), gameState.score);
  localStorage.setItem('lc_game_best', best);
  if (scoreEl) scoreEl.textContent = gameState.score;
  if (bestEl)  bestEl.textContent  = best;
}

function endGame() {
  gameState.active = false;
  clearInterval(gameState.timer);
  var best = Math.max(parseInt(localStorage.getItem('lc_game_best') || '0'), gameState.score);
  localStorage.setItem('lc_game_best', best);
  document.getElementById('gamePlay').style.display = 'none';
  document.getElementById('gameOver').style.display = 'block';
  document.getElementById('finalScore').textContent      = gameState.score;
  document.getElementById('bestScoreDisplay').textContent = best;
}

function resetGame() {
  clearInterval(gameState.timer);
  gameState.active = false;
  document.getElementById('gamePlay').style.display  = 'none';
  document.getElementById('gameOver').style.display  = 'none';
  document.getElementById('gameStart').style.display = 'block';
}

// Init best score display on load
document.addEventListener('DOMContentLoaded', function() {
  var best = document.getElementById('gameBest');
  if (best) best.textContent = localStorage.getItem('lc_game_best') || '0';
});
