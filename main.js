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
  // Bug 2 fix: WORD_DB.unscramble() returns plain strings, not {word, points} objects
  const groups = {};
  words.forEach(w => {
    const len = w.length;
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
        ${groups[len].map(w => { const pts = WORD_DB.getPoints(w); return `<span class="word-chip" onclick="copyWord('${w}')" title="${pts} pts">${w}<span class="pts">${pts}pt</span></span>`; }).join('')}
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
  {word:'ABERRANT',phonetic:'/ æbˈer.ənt/',pos:'adjective',def:'Departing from an accepted standard; abnormal.',example:'The scientist noted the aberrant results and repeated the experiment.',points:10},
  {word:'ABEYANCE',phonetic:'/ əˈbeɪ.əns/',pos:'noun',def:'A state of temporary suspension or inactivity.',example:'The project was held in abeyance until new funding arrived.',points:15},
  {word:'ABJURE',phonetic:'/ æbˈdʒʊər/',pos:'verb',def:'To formally renounce or reject a belief or claim.',example:'The politician abjured his earlier statements under public pressure.',points:15},
  {word:'ABSCOND',phonetic:'/ æbˈskɒnd/',pos:'verb',def:'To leave hurriedly and secretly, typically to avoid consequences.',example:'The treasurer absconded with the company\'s funds overnight.',points:12},
  {word:'ABSTAIN',phonetic:'/ əbˈsteɪn/',pos:'verb',def:'To restrain oneself from doing or enjoying something.',example:'She chose to abstain from voting on the controversial motion.',points:9},
  {word:'ABSTRUSE',phonetic:'/ æbˈstruːs/',pos:'adjective',def:'Difficult to understand; obscure.',example:'The professor\'s abstruse lecture confused most of the students.',points:10},
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
  {word:'AGGRANDIZE',phonetic:'/ əˈɡræn.daɪz/',pos:'verb',def:'To increase the power or reputation of someone, often by exaggeration.',example:'He tended to aggrandize his role in the project when speaking to clients.',points:22},
  {word:'AGNOSTIC',phonetic:'/ æɡˈnɒs.tɪk/',pos:'noun',def:'A person who believes nothing is known about the existence of God.',example:'As an agnostic, she neither confirmed nor denied the existence of a higher power.',points:11},
  {word:'ALACRITY',phonetic:'/ əˈlæk.rɪ.ti/',pos:'noun',def:'Brisk and cheerful readiness.',example:'The volunteers responded to the disaster with remarkable alacrity.',points:13},
  {word:'ALIENATE',phonetic:'/ ˈeɪ.li.ə.neɪt/',pos:'verb',def:'To cause someone to feel isolated or estranged.',example:'His arrogant attitude alienated his colleagues at work.',points:8},
  {word:'ALLEGORY',phonetic:'/ ˈæl.ɪ.ɡər.i/',pos:'noun',def:'A story with a hidden meaning, typically moral or political.',example:'Orwell\'s Animal Farm is a famous allegory about political corruption.',points:12},
  {word:'ALLEVIATE',phonetic:'/ əˈliː.vi.eɪt/',pos:'verb',def:'To make suffering or a problem less severe.',example:'The new medication helped alleviate the patient\'s chronic pain.',points:12},
  {word:'ALTRUISTIC',phonetic:'/ ˌæl.truˈɪs.tɪk/',pos:'adjective',def:'Showing selfless concern for the well-being of others.',example:'Her altruistic decision to donate her salary surprised everyone.',points:12},
  {word:'AMALGAMATE',phonetic:'/ əˈmæl.ɡə.meɪt/',pos:'verb',def:'To combine or unite to form one organization or structure.',example:'The two rival companies decided to amalgamate to survive the recession.',points:15},
  {word:'AMBIGUOUS',phonetic:'/ æmˈbɪɡ.ju.əs/',pos:'adjective',def:'Open to more than one interpretation; unclear.',example:'The contract contained an ambiguous clause that led to a legal dispute.',points:14},
  {word:'AMBIVALENT',phonetic:'/ æmˈbɪv.ə.lənt/',pos:'adjective',def:'Having mixed feelings about something.',example:'She felt ambivalent about accepting the job offer abroad.',points:17},
  {word:'AMELIORATE',phonetic:'/ əˈmiː.li.ə.reɪt/',pos:'verb',def:'To make something bad or unsatisfactory better.',example:'New policies were introduced to ameliorate the living conditions.',points:12},
  {word:'AMIABLE',phonetic:'/ ˈeɪ.mi.ə.bəl/',pos:'adjective',def:'Having a friendly and pleasant manner.',example:'The amiable professor was always willing to help struggling students.',points:11},
  {word:'ANACHRONISM',phonetic:'/ əˈnæk.rə.nɪ.z(ə)m/',pos:'noun',def:'A thing or person that belongs to a different time period.',example:'Using a typewriter in 2024 is quite an anachronism.',points:18},
  {word:'ANALOGOUS',phonetic:'/ əˈnæl.ə.ɡəs/',pos:'adjective',def:'Comparable in certain respects; similar in function.',example:'The human eye is analogous to a camera in how it captures images.',points:10},
  {word:'ANARCHY',phonetic:'/ ˈæn.ə.ki/',pos:'noun',def:'A state of disorder due to absence of authority.',example:'After the coup, the country descended into anarchy for several months.',points:15},
  {word:'ANECDOTE',phonetic:'/ ˈæn.ɪk.dəʊt/',pos:'noun',def:'A short amusing or interesting story about a real incident.',example:'She shared a funny anecdote about her first day at the new school.',points:11},
  {word:'ANOMALY',phonetic:'/ əˈnɒm.ə.li/',pos:'noun',def:'Something that deviates from what is standard or expected.',example:'The data showed an anomaly that scientists could not immediately explain.',points:12},
  {word:'ANTAGONIST',phonetic:'/ ænˈtæɡ.ə.nɪst/',pos:'noun',def:'A person who actively opposes or is hostile to another.',example:'In the novel, the antagonist schemes constantly against the hero.',points:11},
  {word:'ANTIPATHY',phonetic:'/ ænˈtɪp.ə.θi/',pos:'noun',def:'A deep-seated feeling of dislike or aversion.',example:'He felt a strong antipathy toward dishonesty in any form.',points:17},
  {word:'APATHY',phonetic:'/ ˈæp.ə.θi/',pos:'noun',def:'Lack of interest or concern; indifference.',example:'Voter apathy led to record-low turnout in the local elections.',points:14},
  {word:'APPEASE',phonetic:'/ əˈpiːz/',pos:'verb',def:'To make someone less angry or hostile by conceding to their demands.',example:'The government tried to appease protesters by announcing reforms.',points:11},
  {word:'ARBITRARY',phonetic:'/ ˈɑː.bɪ.trər.i/',pos:'adjective',def:'Based on random choice rather than reason or system.',example:'The arbitrary selection process seemed unfair to many applicants.',points:14},
  {word:'ARCANE',phonetic:'/ ɑːˈkeɪn/',pos:'adjective',def:'Known by few; mysterious or secret.',example:'The professor specialized in arcane medieval manuscripts.',points:8},
  {word:'ARDUOUS',phonetic:'/ ˈɑː.dju.əs/',pos:'adjective',def:'Requiring great effort; exhausting.',example:'The arduous trek through the mountains took three days.',points:8},
  {word:'ARTICULATE',phonetic:'/ ɑːˈtɪk.jʊ.lət/',pos:'adjective',def:'Having or showing the ability to speak fluently and clearly.',example:'The articulate student impressed the judges at the debate competition.',points:12},
  {word:'ASCERTAIN',phonetic:'/ ˌæs.əˈteɪn/',pos:'verb',def:'To find out with certainty; to determine.',example:'Investigators worked hard to ascertain the cause of the explosion.',points:11},
  {word:'ASCETIC',phonetic:'/ əˈset.ɪk/',pos:'adjective',def:'Characterized by severe self-discipline and abstention from pleasure.',example:'The monk led an ascetic life in a remote mountain monastery.',points:11},
  {word:'ASPIRE',phonetic:'/ əˈspaɪər/',pos:'verb',def:'To direct one\'s hopes and ambitions toward achieving something.',example:'She aspires to become the first woman to lead the organization.',points:8},
  {word:'ASSIDUOUS',phonetic:'/ əˈsɪd.ju.əs/',pos:'adjective',def:'Showing great care and perseverance.',example:'The assiduous student reviewed her notes every evening without fail.',points:10},
  {word:'ASSUAGE',phonetic:'/ əˈsweɪdʒ/',pos:'verb',def:'To make an unpleasant feeling less intense.',example:'He tried to assuage her guilt by reminding her it was an accident.',points:8},
  {word:'ASTUTE',phonetic:'/ əˈstjuːt/',pos:'adjective',def:'Having an ability to accurately assess situations; shrewd.',example:'The astute investor recognized the opportunity before others did.',points:6},
  {word:'ATROPHY',phonetic:'/ ˈæt.rə.fi/',pos:'verb',def:'To gradually decline in effectiveness or vigor through underuse.',example:'Without practice, her language skills began to atrophy.',points:15},
  {word:'AUDACIOUS',phonetic:'/ ɔːˈdeɪ.ʃəs/',pos:'adjective',def:'Showing a willingness to take surprising, bold risks.',example:'The audacious plan to climb the north face shocked experienced climbers.',points:12},
  {word:'AUGMENT',phonetic:'/ ɔːɡˈment/',pos:'verb',def:'To make something greater by adding to it; to increase.',example:'He augmented his income by taking on freelance projects.',points:10},
  {word:'AUSPICIOUS',phonetic:'/ ɔːˈspɪʃ.əs/',pos:'adjective',def:'Giving a favorable indication of future success.',example:'Their first meeting felt auspicious — they agreed on everything.',points:14},
  {word:'AUSTERE',phonetic:'/ ɒˈstɪər/',pos:'adjective',def:'Severe or strict in manner; without luxury or comfort.',example:'The prison had an austere appearance with bare concrete walls.',points:7},
  {word:'AUTHENTIC',phonetic:'/ ɔːˈθen.tɪk/',pos:'adjective',def:'Of undisputed origin; genuine.',example:'The museum acquired an authentic painting from the Renaissance period.',points:14},
  {word:'AUTOCRATIC',phonetic:'/ ˌɔː.təˈkræt.ɪk/',pos:'adjective',def:'Relating to a ruler who has absolute power.',example:'The autocratic leader dismissed all opposition without debate.',points:14},
  {word:'AVARICE',phonetic:'/ ˈæv.ər.ɪs/',pos:'noun',def:'Extreme greed for wealth or material gain.',example:'His avarice drove him to embezzle funds from his own charity.',points:12},
  {word:'AVERSION',phonetic:'/ əˈvɜː.ʃən/',pos:'noun',def:'A strong dislike or disinclination toward something.',example:'She had a lifelong aversion to public speaking.',points:11},
  {word:'BANAL',phonetic:'/ bəˈnɑːl/',pos:'adjective',def:'So lacking originality as to be obvious and boring.',example:'The film\'s banal plot disappointed critics who expected more.',points:7},
  {word:'BELLIGERENT',phonetic:'/ bəˈlɪdʒ.ər.ənt/',pos:'adjective',def:'Hostile and aggressive; inclined to start quarrels.',example:'The belligerent neighbor argued with everyone on the street.',points:14},
  {word:'BENEVOLENT',phonetic:'/ bəˈnev.ə.lənt/',pos:'adjective',def:'Well-meaning and kindly toward others.',example:'The benevolent donor gave millions to build schools in rural areas.',points:15},
  {word:'BENIGN',phonetic:'/ bɪˈnaɪn/',pos:'adjective',def:'Gentle and kindly; not harmful.',example:'The doctor confirmed the tumor was benign and required no treatment.',points:9},
  {word:'BEQUEATH',phonetic:'/ bɪˈkwiːð/',pos:'verb',def:'To leave property or assets to someone by a will.',example:'She chose to bequeath her entire art collection to the national gallery.',points:22},
  {word:'BOLSTER',phonetic:'/ ˈbəʊl.stər/',pos:'verb',def:'To support or strengthen something that is weak.',example:'The government announced new measures to bolster the struggling economy.',points:9},
  {word:'BOMBASTIC',phonetic:'/ bɒmˈbæs.tɪk/',pos:'adjective',def:'High-sounding language with little real meaning; pompous.',example:'His bombastic speech impressed few but irritated many.',points:17},
  {word:'BREVITY',phonetic:'/ ˈbrev.ɪ.ti/',pos:'noun',def:'Concise and exact use of words; shortness of time.',example:'The speech was praised for its brevity and clarity.',points:15},
  {word:'BUOYANT',phonetic:'/ ˈbɔɪ.ənt/',pos:'adjective',def:'Cheerful and optimistic; able to float.',example:'Despite the setbacks, she remained buoyant and focused on the goal.',points:12},
  {word:'CAPRICIOUS',phonetic:'/ kəˈprɪʃ.əs/',pos:'adjective',def:'Given to sudden changes of mood or behavior.',example:'The capricious weather ruined their outdoor wedding plans.',points:16},
  {word:'CATALYST',phonetic:'/ ˈkæt.ə.lɪst/',pos:'noun',def:'A person or thing that precipitates an event.',example:'The assassination was the catalyst for the outbreak of war.',points:13},
  {word:'CAUSTIC',phonetic:'/ ˈkɔː.stɪk/',pos:'adjective',def:'Sarcastic in a way that is unkind; corrosive to flesh.',example:'His caustic remarks about her work left her feeling dejected.',points:11},
  {word:'CENSURE',phonetic:'/ ˈsen.ʃər/',pos:'verb',def:'To express severe disapproval of someone or their actions.',example:'The council voted to censure the official for misconduct.',points:9},
  {word:'CHRONICLE',phonetic:'/ ˈkrɒn.ɪ.kəl/',pos:'verb',def:'To record a series of events in factual and detailed way.',example:'The journalist spent years chronicling the effects of the civil war.',points:16},
  {word:'CIRCUMSPECT',phonetic:'/ ˈsɜː.kəm.spekt/',pos:'adjective',def:'Wary and unwilling to take risks.',example:'He was circumspect in his response, careful not to offend anyone.',points:21},
  {word:'CLANDESTINE',phonetic:'/ klænˈdes.tɪn/',pos:'adjective',def:'Kept secret, especially for illicit reasons.',example:'They held clandestine meetings in an abandoned warehouse.',points:14},
  {word:'CLEMENCY',phonetic:'/ ˈklem.ən.si/',pos:'noun',def:'Mercy and leniency shown toward an offender.',example:'The judge showed clemency given the defendant\'s difficult circumstances.',points:17},
  {word:'COERCE',phonetic:'/ kəʊˈɜːs/',pos:'verb',def:'To persuade someone to do something by force or threats.',example:'He was accused of trying to coerce witnesses into changing testimony.',points:10},
  {word:'COGENT',phonetic:'/ ˈkəʊ.dʒənt/',pos:'adjective',def:'Clear, logical, and convincing.',example:'Her cogent argument persuaded even the most skeptical members.',points:9},
  {word:'COMPLACENT',phonetic:'/ kəmˈpleɪ.sənt/',pos:'adjective',def:'Showing uncritical satisfaction with oneself or one\'s achievements.',example:'The team became complacent after their early-season victories.',points:18},
  {word:'CONCEDE',phonetic:'/ kənˈsiːd/',pos:'verb',def:'To admit that something is true or valid after resistance.',example:'He finally conceded that his initial estimate had been wrong.',points:12},
  {word:'CONCILIATORY',phonetic:'/ kənˈsɪl.i.ə.tər.i/',pos:'adjective',def:'Intended to make someone less angry or more friendly.',example:'Her conciliatory tone helped ease the tension in the room.',points:19},
  {word:'CONDONE',phonetic:'/ kənˈdəʊn/',pos:'verb',def:'To accept or allow behavior that is considered wrong.',example:'The school refused to condone any form of bullying.',points:10},
  {word:'CONFLUENCE',phonetic:'/ ˈkɒn.flu.əns/',pos:'noun',def:'The junction of two rivers; a coming together of people or things.',example:'At the confluence of the two rivers, the town had grown into a city.',points:17},
  {word:'CONVOLUTED',phonetic:'/ ˈkɒn.və.luː.tɪd/',pos:'adjective',def:'Extremely complex and difficult to follow.',example:'The instructions were so convoluted that nobody could follow them.',points:16},
  {word:'COPIOUS',phonetic:'/ ˈkəʊ.pi.əs/',pos:'adjective',def:'Abundant in supply or quantity; plentiful.',example:'She took copious notes during the lecture.',points:11},
  {word:'CORROBORATE',phonetic:'/ kəˈrɒb.ə.reɪt/',pos:'verb',def:'To confirm or give support to a statement or theory.',example:'The witness was called to corroborate the defendant\'s alibi.',points:15},
  {word:'CREDULOUS',phonetic:'/ ˈkredʒ.ʊ.ləs/',pos:'adjective',def:'Having too great a readiness to believe things.',example:'The credulous investor lost his savings to the scam artist.',points:12},
  {word:'CRYPTIC',phonetic:'/ ˈkrɪp.tɪk/',pos:'adjective',def:'Having a meaning that is mysterious or obscure.',example:'She left a cryptic note that nobody could fully decipher.',points:16},
  {word:'CULPABLE',phonetic:'/ ˈkʌl.pə.bəl/',pos:'adjective',def:'Deserving blame for a fault or wrong.',example:'The investigation found the manager culpable for the safety failure.',points:14},
  {word:'CURSORY',phonetic:'/ ˈkɜː.sər.i/',pos:'adjective',def:'Hasty and therefore not thorough or detailed.',example:'A cursory glance at the report revealed several glaring errors.',points:12},
  {word:'CYNICAL',phonetic:'/ ˈsɪn.ɪ.kəl/',pos:'adjective',def:'Believing people are motivated purely by self-interest.',example:'His cynical view of politics made him reluctant to vote.',points:14},
  {word:'DEBILITATE',phonetic:'/ dɪˈbɪl.ɪ.teɪt/',pos:'verb',def:'To make someone very weak and infirm.',example:'The illness debilitated him so severely he could not leave bed.',points:13},
  {word:'DEFERENCE',phonetic:'/ ˈdef.ər.əns/',pos:'noun',def:'Respectful submission to the opinion of another.',example:'In deference to the elders, the younger members stayed quiet.',points:15},
  {word:'DEFT',phonetic:'/ deft/',pos:'adjective',def:'Demonstrating skill and cleverness.',example:'With a deft movement, the surgeon closed the incision perfectly.',points:8},
  {word:'DELINEATE',phonetic:'/ dɪˈlɪn.i.eɪt/',pos:'verb',def:'To describe or portray something precisely.',example:'The treaty carefully delineated the borders between the two nations.',points:10},
  {word:'DENOUNCE',phonetic:'/ dɪˈnaʊns/',pos:'verb',def:'To publicly declare something to be wrong or evil.',example:'World leaders were quick to denounce the unprovoked attack.',points:11},
  {word:'DEPICT',phonetic:'/ dɪˈpɪkt/',pos:'verb',def:'To represent by a drawing, painting, or other art form.',example:'The mural depicts scenes from the town\'s industrial history.',points:11},
  {word:'DEPRECATE',phonetic:'/ ˈdep.rɪ.keɪt/',pos:'verb',def:'To express disapproval of; to belittle.',example:'He deprecated his own achievements out of modesty.',points:14},
  {word:'DERIDE',phonetic:'/ dɪˈraɪd/',pos:'verb',def:'To express contempt for; to ridicule.',example:'Critics derided the film as predictable and poorly written.',points:8},
  {word:'DESPONDENT',phonetic:'/ dɪˈspɒn.dənt/',pos:'adjective',def:'In low spirits from loss of hope or courage.',example:'After failing the exam twice, she felt utterly despondent.',points:14},
  {word:'DILIGENT',phonetic:'/ ˈdɪl.ɪ.dʒənt/',pos:'adjective',def:'Having or showing care and conscientiousness in one\'s work.',example:'The diligent student reviewed every chapter before the final exam.',points:10},
  {word:'DISCERN',phonetic:'/ dɪˈsɜːn/',pos:'verb',def:'To perceive or recognize something clearly.',example:'It was difficult to discern the truth among so many conflicting accounts.',points:10},
  {word:'DISDAIN',phonetic:'/ dɪsˈdeɪn/',pos:'noun',def:'The feeling that someone or something is unworthy of respect.',example:'She regarded his excuses with barely concealed disdain.',points:9},
  {word:'DISPARAGE',phonetic:'/ dɪˈspær.ɪdʒ/',pos:'verb',def:'To regard or represent as being of little worth; belittle.',example:'He constantly disparaged his colleagues behind their backs.',points:13},
  {word:'DISSENT',phonetic:'/ dɪˈsent/',pos:'noun',def:'The expression of opposition to official policy.',example:'The new law was met with widespread dissent from civil groups.',points:8},
  {word:'DIVERGE',phonetic:'/ daɪˈvɜːdʒ/',pos:'verb',def:'To develop in a different direction; to differ.',example:'Their opinions began to diverge sharply on the question of reform.',points:12},
  {word:'DOGMATIC',phonetic:'/ dɒɡˈmæt.ɪk/',pos:'adjective',def:'Inclined to lay down principles as incontrovertibly true.',example:'His dogmatic approach left no room for alternative viewpoints.',points:14},
  {word:'ECCENTRIC',phonetic:'/ ɪkˈsen.trɪk/',pos:'adjective',def:'Unconventional and slightly strange in behavior.',example:'The eccentric scientist kept live insects in his office.',points:15},
  {word:'EGREGIOUS',phonetic:'/ ɪˈɡriː.dʒəs/',pos:'adjective',def:'Outstandingly bad; shocking.',example:'The judge called it an egregious violation of human rights.',points:11},
  {word:'ELUSIVE',phonetic:'/ ɪˈluː.sɪv/',pos:'adjective',def:'Difficult to find, catch, or achieve.',example:'The solution to the problem proved elusive for months.',points:10},
  {word:'EMULATE',phonetic:'/ ˈem.jʊ.leɪt/',pos:'verb',def:'To match or surpass by imitation; to copy.',example:'Young athletes often try to emulate the stars they admire.',points:9},
  {word:'ENIGMA',phonetic:'/ ɪˈnɪɡ.mə/',pos:'noun',def:'A person or thing that is mysterious and difficult to understand.',example:'The ancient inscription remained an enigma to archaeologists.',points:9},
  {word:'ENUMERATE',phonetic:'/ ɪˈnjuː.mər.eɪt/',pos:'verb',def:'To mention a number of things one by one.',example:'The report enumerates ten specific areas for improvement.',points:11},
  {word:'EPHEMERAL',phonetic:'/ ɪˈfem.ər.əl/',pos:'adjective',def:'Lasting for only a very short time.',example:'The ephemeral beauty of cherry blossoms lasts just one week.',points:16},
  {word:'EQUIVOCAL',phonetic:'/ ɪˈkwɪv.ə.kəl/',pos:'adjective',def:'Open to more than one interpretation; ambiguous.',example:'His equivocal reply left everyone uncertain of his true intentions.',points:23},
  {word:'ERADICATE',phonetic:'/ ɪˈræd.ɪ.keɪt/',pos:'verb',def:'To destroy completely; to put an end to.',example:'The vaccination campaign aimed to eradicate the disease globally.',points:12},
  {word:'ERUDITE',phonetic:'/ ˈer.ʊ.daɪt/',pos:'adjective',def:'Having or showing great knowledge or learning.',example:'The erudite professor could discuss philosophy, science, and art equally.',points:8},
  {word:'ESOTERIC',phonetic:'/ ˌes.əˈter.ɪk/',pos:'adjective',def:'Intended for or understood by only a small group.',example:'His esoteric research had little application outside academia.',points:10},
  {word:'ESTEEM',phonetic:'/ ɪˈstiːm/',pos:'noun',def:'Respect and admiration for a person or quality.',example:'She was held in high esteem by her colleagues and students alike.',points:8},
  {word:'EUPHEMISM',phonetic:'/ ˈjuː.fə.mɪ.z(ə)m/',pos:'noun',def:'A mild expression substituted for one that might offend.',example:'Passed away is a common euphemism for died.',points:18},
  {word:'EXACERBATE',phonetic:'/ ɪɡˈzæs.ə.beɪt/',pos:'verb',def:'To make a problem or bad situation worse.',example:'The drought was exacerbated by the unusually high temperatures.',points:21},
  {word:'EXEMPLIFY',phonetic:'/ ɪɡˈzem.plɪ.faɪ/',pos:'verb',def:'To be a typical example of; to illustrate by example.',example:'Her career exemplifies what can be achieved through hard work.',points:26},
  {word:'EXHAUSTIVE',phonetic:'/ ɪɡˈzɔː.stɪv/',pos:'adjective',def:'Including all or most possibilities; thorough.',example:'The team conducted an exhaustive search of the building.',points:23},
  {word:'EXONERATE',phonetic:'/ ɪɡˈzɒn.ər.eɪt/',pos:'verb',def:'To absolve from blame or criminal charges.',example:'New DNA evidence exonerated the man who had served fifteen years.',points:16},
  {word:'EXPEDIENT',phonetic:'/ ɪkˈspiː.di.ənt/',pos:'adjective',def:'Convenient and practical though possibly improper.',example:'It was expedient to accept the offer, even if not entirely ethical.',points:19},
  {word:'EXPLICIT',phonetic:'/ ɪkˈsplɪs.ɪt/',pos:'adjective',def:'Stated clearly and in detail, leaving no room for confusion.',example:'The contract contained explicit instructions on payment terms.',points:19},
  {word:'EXTOL',phonetic:'/ ɪkˈstəʊl/',pos:'verb',def:'To praise enthusiastically.',example:'The coach extolled the team\'s effort despite the loss.',points:12},
  {word:'FABRICATE',phonetic:'/ ˈfæb.rɪ.keɪt/',pos:'verb',def:'To invent information in order to deceive.',example:'He fabricated an alibi but was exposed by security footage.',points:16},
  {word:'FALLACY',phonetic:'/ ˈfæl.ə.si/',pos:'noun',def:'A mistaken belief based on unsound argument.',example:'The idea that vaccines cause autism is a dangerous fallacy.',points:15},
  {word:'FASTIDIOUS',phonetic:'/ fæˈstɪd.i.əs/',pos:'adjective',def:'Very attentive to accuracy and detail; difficult to please.',example:'The fastidious editor corrected even the smallest punctuation errors.',points:14},
  {word:'FATHOM',phonetic:'/ ˈfæð.əm/',pos:'verb',def:'To understand after much thought.',example:'She could not fathom why he had rejected such a good offer.',points:14},
  {word:'FERVENT',phonetic:'/ ˈfɜː.vənt/',pos:'adjective',def:'Having or displaying passionate intensity.',example:'He was a fervent supporter of environmental protection.',points:13},
  {word:'FLAGRANT',phonetic:'/ ˈfleɪ.ɡrənt/',pos:'adjective',def:'Conspicuously or obviously offensive; blatant.',example:'The referee penalized the player for a flagrant foul.',points:12},
  {word:'FLOURISH',phonetic:'/ ˈflʌr.ɪʃ/',pos:'verb',def:'To grow or develop in a healthy or vigorous way.',example:'The small business flourished under her skilled management.',points:14},
  {word:'FOMENT',phonetic:'/ fəʊˈment/',pos:'verb',def:'To instigate or stir up undesirable sentiment or action.',example:'The extremist group tried to foment unrest among the population.',points:11},
  {word:'FORMIDABLE',phonetic:'/ ˈfɔː.mɪ.də.bəl/',pos:'adjective',def:'Inspiring fear or respect through being impressively strong.',example:'She was a formidable opponent in any legal argument.',points:18},
  {word:'FORTUITOUS',phonetic:'/ fɔːˈtjuː.ɪ.təs/',pos:'adjective',def:'Happening by accident or chance rather than design.',example:'Their fortuitous meeting at the airport led to a lifelong friendship.',points:13},
  {word:'FRUGAL',phonetic:'/ ˈfruː.ɡəl/',pos:'adjective',def:'Sparing or economical with regard to money or food.',example:'His frugal lifestyle allowed him to retire at the age of forty.',points:10},
  {word:'FUTILE',phonetic:'/ ˈfjuː.taɪl/',pos:'adjective',def:'Incapable of producing any useful result; pointless.',example:'All efforts to stop the flooding proved futile.',points:9},
  {word:'GARRULOUS',phonetic:'/ ˈɡær.ʊ.ləs/',pos:'adjective',def:'Excessively talkative about trivial matters.',example:'The garrulous passenger talked throughout the entire flight.',points:10},
  {word:'GRANDEUR',phonetic:'/ ˈɡræn.dʒər/',pos:'noun',def:'Splendor and impressiveness, especially of appearance.',example:'Tourists came from all over to admire the grandeur of the palace.',points:10},
  {word:'GRATUITOUS',phonetic:'/ ɡrəˈtjuː.ɪ.təs/',pos:'adjective',def:'Uncalled for; lacking good reason; unwarranted.',example:'The film was criticized for its gratuitous violence.',points:11},
  {word:'GREGARIOUS',phonetic:'/ ɡrɪˈɡeər.i.əs/',pos:'adjective',def:'Fond of the company of others; sociable.',example:'A gregarious person by nature, she thrived in large social gatherings.',points:12},
  {word:'GUILE',phonetic:'/ ɡaɪl/',pos:'noun',def:'Sly or cunning intelligence; craftiness.',example:'He used guile rather than force to achieve his objectives.',points:6},
  {word:'HACKNEYED',phonetic:'/ ˈhæk.niːd/',pos:'adjective',def:'Lacking significance through being overused; trite.',example:'The speech was full of hackneyed phrases that moved no one.',points:22},
  {word:'HAMPER',phonetic:'/ ˈhæm.pər/',pos:'verb',def:'To hinder or impede the movement or progress of.',example:'Poor planning hampered the relief effort during the disaster.',points:13},
  {word:'HARBINGER',phonetic:'/ ˈhɑː.bɪn.dʒər/',pos:'noun',def:'A person or thing that announces the approach of something.',example:'The cuckoo\'s call is considered a harbinger of spring.',points:15},
  {word:'HEGEMONY',phonetic:'/ hɪˈɡem.ə.ni/',pos:'noun',def:'Leadership or dominance, especially of one country over others.',example:'The empire maintained its hegemony through military strength.',points:17},
  {word:'HERESY',phonetic:'/ ˈher.ɪ.si/',pos:'noun',def:'Belief or opinion contrary to orthodox doctrine.',example:'Suggesting the earth moved around the sun was once considered heresy.',points:12},
  {word:'HUBRIS',phonetic:'/ ˈhjuː.brɪs/',pos:'noun',def:'Excessive pride or self-confidence leading to downfall.',example:'His hubris blinded him to the legitimate concerns of his team.',points:11},
  {word:'HYPOCRITE',phonetic:'/ ˈhɪp.ə.krɪt/',pos:'noun',def:'A person who pretends to have virtues they lack.',example:'Calling for sacrifice while living lavishly made him a hypocrite.',points:19},
  {word:'HYPOTHESIS',phonetic:'/ haɪˈpɒθ.ə.sɪs/',pos:'noun',def:'A proposed explanation based on limited evidence.',example:'The scientist formed a hypothesis and designed experiments to test it.',points:21},
  {word:'ICONOCLAST',phonetic:'/ aɪˈkɒn.ə.klæst/',pos:'noun',def:'A person who challenges cherished beliefs or institutions.',example:'The reformer was an iconoclast who questioned every tradition.',points:14},
  {word:'IMMUTABLE',phonetic:'/ ɪˈmjuː.tə.bəl/',pos:'adjective',def:'Unchanging over time; unable to be changed.',example:'The laws of mathematics are considered immutable.',points:15},
  {word:'IMPARTIAL',phonetic:'/ ɪmˈpɑː.ʃəl/',pos:'adjective',def:'Treating all rivals or disputants equally; unbiased.',example:'A jury must remain impartial throughout the entire trial.',points:13},
  {word:'IMPEDE',phonetic:'/ ɪmˈpiːd/',pos:'verb',def:'To delay or prevent by obstructing; to hinder.',example:'Fallen trees impeded the rescue team\'s progress through the forest.',points:11},
  {word:'IMPERIOUS',phonetic:'/ ɪmˈpɪər.i.əs/',pos:'adjective',def:'Assuming power or authority without justification; arrogant.',example:'His imperious manner made subordinates reluctant to speak openly.',points:13},
  {word:'IMPETUOUS',phonetic:'/ ɪmˈpetʃ.u.əs/',pos:'adjective',def:'Acting without thought or care; impulsive.',example:'His impetuous decision to quit cost him years of career progress.',points:13},
  {word:'IMPLICIT',phonetic:'/ ɪmˈplɪs.ɪt/',pos:'adjective',def:'Implied though not directly expressed.',example:'There was an implicit understanding that no one would discuss the matter.',points:14},
  {word:'INADVERTENT',phonetic:'/ ˌɪn.ədˈvɜː.tənt/',pos:'adjective',def:'Not resulting from deliberate planning; unintentional.',example:'The inadvertent disclosure of the report caused significant embarrassment.',points:15},
  {word:'INCISIVE',phonetic:'/ ɪnˈsaɪ.sɪv/',pos:'adjective',def:'Intelligently analytical and clear-thinking.',example:'Her incisive commentary cut through the political spin.',points:13},
  {word:'INCONGRUOUS',phonetic:'/ ɪnˈkɒŋ.ɡru.əs/',pos:'adjective',def:'Not in harmony or keeping with the surroundings.',example:'A neon sign looked incongruous on the medieval stone building.',points:14},
  {word:'INDOLENT',phonetic:'/ ˈɪn.də.lənt/',pos:'adjective',def:'Wanting to avoid activity or exertion; lazy.',example:'The indolent student barely completed any assignments.',points:9},
  {word:'INEPT',phonetic:'/ ɪˈnept/',pos:'adjective',def:'Having or showing no skill; clumsy.',example:'The inept repair made the appliance worse than before.',points:7},
  {word:'INEVITABLE',phonetic:'/ ɪnˈev.ɪ.tə.bəl/',pos:'adjective',def:'Certain to happen; unavoidable.',example:'Change is inevitable in any dynamic organization.',points:15},
  {word:'INFER',phonetic:'/ ɪnˈfɜːr/',pos:'verb',def:'To deduce or conclude from evidence and reasoning.',example:'From her tone, we could infer that she was disappointed.',points:8},
  {word:'INGENIOUS',phonetic:'/ ɪnˈdʒiː.ni.əs/',pos:'adjective',def:'Clever, original, and inventive.',example:'The ingenious solution used materials that were already on site.',points:10},
  {word:'INHERENT',phonetic:'/ ɪnˈhɪər.ənt/',pos:'adjective',def:'Existing as a natural or permanent essential quality.',example:'There is an inherent risk in any financial investment.',points:11},
  {word:'INNOCUOUS',phonetic:'/ ɪˈnɒk.ju.əs/',pos:'adjective',def:'Not harmful or offensive; harmless.',example:'What seemed an innocuous comment sparked a major controversy.',points:11},
  {word:'INSIPID',phonetic:'/ ɪnˈsɪp.ɪd/',pos:'adjective',def:'Lacking vigor or interest; dull.',example:'The novel was widely criticized as insipid and predictable.',points:10},
  {word:'INTEGRITY',phonetic:'/ ɪnˈteɡ.rɪ.ti/',pos:'noun',def:'The quality of being honest and having strong moral principles.',example:'Her integrity was never questioned during her long career.',points:13},
  {word:'INTRINSIC',phonetic:'/ ɪnˈtrɪn.zɪk/',pos:'adjective',def:'Belonging naturally; essential; fundamental.',example:'The intrinsic value of education goes beyond earning potential.',points:11},
  {word:'INUNDATE',phonetic:'/ ˈɪn.ʌn.deɪt/',pos:'verb',def:'To overwhelm with things to be dealt with.',example:'After the announcement, the office was inundated with calls.',points:9},
  {word:'IRREVOCABLE',phonetic:'/ ɪˈrev.ə.kə.bəl/',pos:'adjective',def:'Not able to be changed, reversed, or recovered.',example:'Once signed, the document constituted an irrevocable commitment.',points:18},
  {word:'JARGON',phonetic:'/ ˈdʒɑː.ɡən/',pos:'noun',def:'Special words used by a particular group that are hard for others to understand.',example:'The legal jargon in the contract confused the average reader.',points:14},
  {word:'JUXTAPOSE',phonetic:'/ ˈdʒʌk.stə.pəʊz/',pos:'verb',def:'To place side by side for comparison or contrast.',example:'The exhibition juxtaposes ancient artifacts with modern interpretations.',points:25},
  {word:'KINDLE',phonetic:'/ ˈkɪn.dəl/',pos:'verb',def:'To light or set on fire; to arouse a feeling.',example:'The teacher\'s enthusiasm kindled a love of science in many students.',points:11},
  {word:'LABYRINTH',phonetic:'/ ˈlæb.ɪ.rɪnθ/',pos:'noun',def:'A complicated network of passages; a complex situation.',example:'Navigating the tax system felt like moving through a labyrinth.',points:17},
  {word:'LAMENT',phonetic:'/ ləˈment/',pos:'verb',def:'To express passionate grief or regret about something.',example:'She lamented the loss of the old neighborhood library.',points:8},
  {word:'LAUDABLE',phonetic:'/ ˈlɔː.də.bəl/',pos:'adjective',def:'Deserving praise and commendation.',example:'Her laudable commitment to charity work inspired many others.',points:11},
  {word:'LETHARGIC',phonetic:'/ ləˈθɑː.dʒɪk/',pos:'adjective',def:'Affected by lethargy; sluggish and apathetic.',example:'After the long journey, everyone felt too lethargic to unpack.',points:15},
  {word:'LEVITY',phonetic:'/ ˈlev.ɪ.ti/',pos:'noun',def:'The treatment of a serious matter with humor.',example:'A touch of levity helped ease the tension in the difficult meeting.',points:12},
  {word:'LUCID',phonetic:'/ ˈluː.sɪd/',pos:'adjective',def:'Expressed clearly; easy to understand; rational.',example:'Despite his age, the professor remained lucid and sharp.',points:8},
  {word:'MALEVOLENT',phonetic:'/ məˈlev.ə.lənt/',pos:'adjective',def:'Having or showing a wish to do evil to others.',example:'The story\'s villain was purely malevolent with no redeeming qualities.',points:15},
  {word:'MALLEABLE',phonetic:'/ ˈmæl.i.ə.bəl/',pos:'adjective',def:'Easily influenced; pliable; able to be shaped.',example:'Young minds are malleable and absorb new languages quickly.',points:13},
  {word:'METICULOUS',phonetic:'/ məˈtɪk.jʊ.ləs/',pos:'adjective',def:'Showing great attention to detail; very careful.',example:'The meticulous accountant never made a single arithmetic error.',points:14},
  {word:'MITIGATE',phonetic:'/ ˈmɪt.ɪ.ɡeɪt/',pos:'verb',def:'To make less severe, serious, or painful.',example:'Steps were taken to mitigate the environmental impact of the factory.',points:11},
  {word:'MUNDANE',phonetic:'/ mʌnˈdeɪn/',pos:'adjective',def:'Lacking interest or excitement; dull.',example:'He longed for adventure after years of mundane office work.',points:10},
  {word:'NEFARIOUS',phonetic:'/ nɪˈfeər.i.əs/',pos:'adjective',def:'Wicked or criminal in nature.',example:'The nefarious scheme defrauded thousands of elderly people.',points:12},
  {word:'NEGLIGENT',phonetic:'/ ˈneɡ.lɪ.dʒənt/',pos:'adjective',def:'Failing to take proper care of something.',example:'The company was found negligent for ignoring safety warnings.',points:11},
  {word:'OBSCURE',phonetic:'/ əbˈskjʊər/',pos:'adjective',def:'Not discovered or known about; uncertain.',example:'The artist remained obscure during her lifetime but is now celebrated.',points:11},
  {word:'OBSTINATE',phonetic:'/ ˈɒb.stɪ.nət/',pos:'adjective',def:'Stubbornly refusing to change one\'s opinion.',example:'His obstinate refusal to listen caused the negotiations to collapse.',points:11},
  {word:'OMINOUS',phonetic:'/ ˈɒm.ɪ.nəs/',pos:'adjective',def:'Giving the impression something bad is going to happen.',example:'Dark ominous clouds gathered on the horizon before the storm.',points:9},
  {word:'OPULENT',phonetic:'/ ˈɒp.jʊ.lənt/',pos:'adjective',def:'Ostentatiously rich and luxurious.',example:'The opulent interior of the palace left visitors speechless.',points:9},
  {word:'OSTENTATIOUS',phonetic:'/ ˌɒs.tenˈteɪ.ʃəs/',pos:'adjective',def:'Characterized by vulgar or pretentious display.',example:'His ostentatious lifestyle was an obvious attempt to impress others.',points:12},
  {word:'PACIFY',phonetic:'/ ˈpæs.ɪ.faɪ/',pos:'verb',def:'To quell the anger or agitation of; to appease.',example:'The manager tried to pacify the angry customers with refunds.',points:16},
  {word:'PARADIGM',phonetic:'/ ˈpær.ə.daɪm/',pos:'noun',def:'A typical example or pattern of something; a framework.',example:'The discovery created a new paradigm for understanding the universe.',points:14},
  {word:'PARADOX',phonetic:'/ ˈpær.ə.dɒks/',pos:'noun',def:'A statement that seems self-contradictory but contains truth.',example:'It is a paradox that standing still can sometimes move a situation forward.',points:17},
  {word:'PARAMOUNT',phonetic:'/ ˈpær.ə.maʊnt/',pos:'adjective',def:'More important than anything else; supreme.',example:'Patient safety is of paramount importance in any medical procedure.',points:13},
  {word:'PARSIMONIOUS',phonetic:'/ ˌpɑː.sɪˈməʊ.ni.əs/',pos:'adjective',def:'Unwilling to spend money or use resources; miserly.',example:'The parsimonious owner refused to invest in basic office supplies.',points:16},
  {word:'PATRONIZE',phonetic:'/ ˈpæt.rə.naɪz/',pos:'verb',def:'To treat someone as if they are less intelligent than they are.',example:'She hated being patronized by colleagues who assumed she was inexperienced.',points:20},
  {word:'PENSIVE',phonetic:'/ ˈpen.sɪv/',pos:'adjective',def:'Engaged in deep or serious thought.',example:'He sat by the window in a pensive mood, staring at the rain.',points:12},
  {word:'PERENNIAL',phonetic:'/ pəˈren.i.əl/',pos:'adjective',def:'Lasting or existing for a long or apparently infinite time.',example:'Funding for public education is a perennial political debate.',points:11},
  {word:'PERFUNCTORY',phonetic:'/ pəˈfʌŋk.tər.i/',pos:'adjective',def:'Carried out without care; routine and superficial.',example:'The perfunctory inspection failed to catch the structural flaw.',points:21},
  {word:'PERIPHERAL',phonetic:'/ pəˈrɪf.ər.əl/',pos:'adjective',def:'Relating to or situated on the edge; of minor importance.',example:'The committee dismissed the issue as peripheral to the main debate.',points:17},
  {word:'PERPETUATE',phonetic:'/ pəˈpetʃ.u.eɪt/',pos:'verb',def:'To make something continue indefinitely.',example:'Stereotypes in media can perpetuate harmful social attitudes.',points:14},
  {word:'PERVASIVE',phonetic:'/ pəˈveɪ.sɪv/',pos:'adjective',def:'Spreading widely throughout an area or group.',example:'Distrust of politicians had become pervasive in the society.',points:17},
  {word:'PLAUSIBLE',phonetic:'/ ˈplɔː.zɪ.bəl/',pos:'adjective',def:'Seeming reasonable or probable; credible.',example:'Her explanation was plausible but not entirely convincing.',points:13},
  {word:'POIGNANT',phonetic:'/ ˈpɔɪ.njənt/',pos:'adjective',def:'Evoking a keen sense of sadness or regret.',example:'The memorial service was a poignant reminder of those lost.',points:11},
  {word:'PRAGMATIC',phonetic:'/ præɡˈmæt.ɪk/',pos:'adjective',def:'Dealing with things sensibly and realistically.',example:'A pragmatic approach to the problem yielded quick results.',points:16},
  {word:'PRECARIOUS',phonetic:'/ prɪˈkeər.i.əs/',pos:'adjective',def:'Not securely held; dependent on chance; uncertain.',example:'The climber found herself in a precarious position on the rockface.',points:14},
  {word:'PRECEDENT',phonetic:'/ ˈpres.ɪ.dənt/',pos:'noun',def:'An earlier event serving as an example for the future.',example:'The judge\'s ruling set an important precedent for future cases.',points:14},
  {word:'PREDISPOSE',phonetic:'/ ˌpriː.dɪˈspəʊz/',pos:'verb',def:'To make someone liable or inclined to a specified attitude.',example:'Genetics can predispose individuals to certain medical conditions.',points:15},
  {word:'PREEMINENT',phonetic:'/ priːˈem.ɪ.nənt/',pos:'adjective',def:'Surpassing all others; superior.',example:'She was regarded as the preeminent authority on Roman history.',points:14},
  {word:'PRETENTIOUS',phonetic:'/ prɪˈten.ʃəs/',pos:'adjective',def:'Attempting to impress by affecting importance one does not have.',example:'The pretentious restaurant charged enormous prices for tiny portions.',points:13},
  {word:'PRODIGAL',phonetic:'/ ˈprɒd.ɪ.ɡəl/',pos:'adjective',def:'Spending resources freely and recklessly; wastefully extravagant.',example:'His prodigal spending habits left him deeply in debt.',points:12},
  {word:'PROFOUND',phonetic:'/ prəˈfaʊnd/',pos:'adjective',def:'Very great or intense; having deep insight.',example:'Her speech had a profound effect on every person in the audience.',points:14},
  {word:'PROLIFERATE',phonetic:'/ prəˈlɪf.ər.eɪt/',pos:'verb',def:'To increase rapidly in number; to multiply.',example:'Social media platforms have proliferated over the past decade.',points:16},
  {word:'PRUDENT',phonetic:'/ ˈpruː.dənt/',pos:'adjective',def:'Acting with care and thought for the future.',example:'It is prudent to save money before making large investments.',points:10},
  {word:'QUALIFIED',phonetic:'/ ˈkwɒl.ɪ.faɪd/',pos:'adjective',def:'Having the abilities or qualifications for something; limited.',example:'The review gave a qualified endorsement of the new treatment.',points:22},
  {word:'QUANDARY',phonetic:'/ ˈkwɒn.dər.i/',pos:'noun',def:'A state of perplexity or uncertainty; a difficult situation.',example:'She was in a quandary over whether to report her colleague.',points:21},
  {word:'QUERULOUS',phonetic:'/ ˈkwer.ʊ.ləs/',pos:'adjective',def:'Complaining in a petulant or whining manner.',example:'The querulous customer complained about everything on the menu.',points:18},
  {word:'QUINTESSENTIAL',phonetic:'/ ˌkwɪn.tɪˈsen.ʃəl/',pos:'adjective',def:'Representing the most perfect or typical example.',example:'The film is the quintessential coming-of-age story.',points:23},
  {word:'RANCOR',phonetic:'/ ˈræŋ.kər/',pos:'noun',def:'Bitterness or resentment, especially when long-standing.',example:'Years of rancor between the families made cooperation impossible.',points:8},
  {word:'RAUCOUS',phonetic:'/ ˈrɔː.kəs/',pos:'adjective',def:'Making or constituting a disturbingly harsh noise.',example:'The raucous crowd celebrated long into the night.',points:9},
  {word:'RECALCITRANT',phonetic:'/ rɪˈkæl.sɪ.trənt/',pos:'adjective',def:'Having an obstinately uncooperative attitude.',example:'The recalcitrant student refused to follow any classroom rules.',points:16},
  {word:'RECONCILE',phonetic:'/ ˈrek.ən.saɪl/',pos:'verb',def:'To make compatible; to settle a conflict.',example:'It was hard to reconcile his kind words with his harsh actions.',points:13},
  {word:'REFUTE',phonetic:'/ rɪˈfjuːt/',pos:'verb',def:'To prove a statement or theory wrong.',example:'The lawyer worked hard to refute the prosecution\'s key evidence.',points:9},
  {word:'RELEGATE',phonetic:'/ ˈrel.ɪ.ɡeɪt/',pos:'verb',def:'To consign to an inferior rank or position.',example:'The manager was relegated to a minor advisory role after the scandal.',points:9},
  {word:'RELINQUISH',phonetic:'/ rɪˈlɪŋ.kwɪʃ/',pos:'verb',def:'To voluntarily cease to keep or claim; to surrender.',example:'She reluctantly relinquished her leadership position due to ill health.',points:22},
  {word:'REPARATION',phonetic:'/ ˌrep.əˈreɪ.ʃən/',pos:'noun',def:'The action of making amends for a wrong.',example:'The government paid reparations to communities affected by the policy.',points:12},
  {word:'REPRIMAND',phonetic:'/ ˈrep.rɪ.mɑːnd/',pos:'verb',def:'To formally express disapproval; to rebuke officially.',example:'The officer was reprimanded for his conduct during the incident.',points:14},
  {word:'RESILIENT',phonetic:'/ rɪˈzɪl.i.ənt/',pos:'adjective',def:'Able to withstand or recover quickly from difficulties.',example:'Children are often more resilient than adults give them credit for.',points:9},
  {word:'RETICENT',phonetic:'/ ˈret.ɪ.sənt/',pos:'adjective',def:'Not revealing one\'s thoughts or feelings readily.',example:'He was reticent about his past and rarely spoke of his childhood.',points:10},
  {word:'RHETORIC',phonetic:'/ ˈret.ər.ɪk/',pos:'noun',def:'Persuasive language used in speaking or writing.',example:'The candidate\'s rhetoric was inspiring but short on concrete policy.',points:13},
  {word:'RIGOROUS',phonetic:'/ ˈrɪɡ.ər.əs/',pos:'adjective',def:'Extremely thorough and careful; demanding.',example:'The study underwent rigorous peer review before publication.',points:9},
  {word:'RUDIMENTARY',phonetic:'/ ˌruː.dɪˈmen.tər.i/',pos:'adjective',def:'Involving or limited to basic principles; undeveloped.',example:'The survivors built rudimentary shelters from branches and leaves.',points:17},
  {word:'SAGACIOUS',phonetic:'/ səˈɡeɪ.ʃəs/',pos:'adjective',def:'Having good judgement; showing wisdom.',example:'The sagacious leader anticipated the crisis months in advance.',points:12},
  {word:'SANCTION',phonetic:'/ ˈsæŋk.ʃən/',pos:'noun',def:'A threatened penalty for disobeying a law or rule.',example:'Economic sanctions were imposed on the country after the invasion.',points:10},
  {word:'SKEPTICAL',phonetic:'/ ˈskep.tɪ.kəl/',pos:'adjective',def:'Not easily convinced; having doubts.',example:'She remained skeptical of the new treatment\'s claimed benefits.',points:17},
  {word:'SOLVENT',phonetic:'/ ˈsɒl.vənt/',pos:'adjective',def:'Having assets exceeding liabilities; financially sound.',example:'After restructuring, the company is finally solvent again.',points:10},
  {word:'SPURIOUS',phonetic:'/ ˈspjʊər.i.əs/',pos:'adjective',def:'Not being what it purports to be; false.',example:'The report was based on spurious data and later retracted.',points:10},
  {word:'STAGNANT',phonetic:'/ ˈstæɡ.nənt/',pos:'adjective',def:'Not flowing or moving; showing no activity.',example:'The economy remained stagnant for three consecutive years.',points:9},
  {word:'STOIC',phonetic:'/ ˈstəʊ.ɪk/',pos:'adjective',def:'Enduring pain or hardship without complaint.',example:'He remained stoic throughout the difficult medical procedures.',points:7},
  {word:'STRIDENT',phonetic:'/ ˈstraɪ.dənt/',pos:'adjective',def:'Presenting a point of view in an excessively forceful way.',example:'Her strident criticism silenced many potential supporters.',points:9},
  {word:'SUBTLE',phonetic:'/ ˈsʌt.əl/',pos:'adjective',def:'So delicate or precise as to be difficult to analyze.',example:'There was a subtle shift in his tone that she immediately noticed.',points:8},
  {word:'SUCCINCT',phonetic:'/ səkˈsɪŋkt/',pos:'adjective',def:'Briefly and clearly expressed.',example:'His succinct summary captured the key points in under a minute.',points:14},
  {word:'SUPERFLUOUS',phonetic:'/ suːˈpɜː.flu.əs/',pos:'adjective',def:'Unnecessary, especially through being more than enough.',example:'The long introduction was superfluous and tried the reader\'s patience.',points:16},
  {word:'SUPPRESS',phonetic:'/ səˈpres/',pos:'verb',def:'To forcibly put an end to; to prevent from being known.',example:'The government tried to suppress news of the protests.',points:12},
  {word:'SYCOPHANT',phonetic:'/ ˈsɪk.ə.fənt/',pos:'noun',def:'A person who acts obsequiously to gain advantage.',example:'The CEO surrounded himself with sycophants who never challenged him.',points:19},
  {word:'TANGENTIAL',phonetic:'/ tænˈdʒen.ʃəl/',pos:'adjective',def:'Diverging from the point; of peripheral relevance.',example:'His tangential remarks distracted from the main discussion.',points:11},
  {word:'TENACIOUS',phonetic:'/ tɪˈneɪ.ʃəs/',pos:'adjective',def:'Tending to keep a firm hold; determined.',example:'The tenacious lawyer refused to give up on her client\'s case.',points:11},
  {word:'TENTATIVE',phonetic:'/ ˈten.tə.tɪv/',pos:'adjective',def:'Not certain or fixed; provisional; hesitant.',example:'She made a tentative agreement to attend, subject to confirmation.',points:12},
  {word:'THOROUGH',phonetic:'/ ˈθʌr.ə/',pos:'adjective',def:'Complete with regard to every detail; not superficial.',example:'The auditor carried out a thorough examination of the accounts.',points:15},
  {word:'TRACTABLE',phonetic:'/ ˈtræk.tə.bəl/',pos:'adjective',def:'Easy to control or influence; docile.',example:'The new software is tractable enough for non-technical users.',points:13},
  {word:'TRANSIENT',phonetic:'/ ˈtræn.zi.ənt/',pos:'adjective',def:'Lasting only for a short time; impermanent.',example:'The pain was transient and disappeared within a few hours.',points:9},
  {word:'TRANSPARENT',phonetic:'/ trænsˈpær.ənt/',pos:'adjective',def:'Easy to see through; having no hidden agenda.',example:'The committee called for a more transparent decision-making process.',points:13},
  {word:'TREPIDATION',phonetic:'/ ˌtrep.ɪˈdeɪ.ʃən/',pos:'noun',def:'A feeling of fear or anxiety about something uncertain.',example:'She approached the interview with a mixture of excitement and trepidation.',points:14},
  {word:'TRIVIAL',phonetic:'/ ˈtrɪv.i.əl/',pos:'adjective',def:'Of little importance; not serious.',example:'She dismissed his concern as trivial and moved on quickly.',points:10},
  {word:'TRUNCATE',phonetic:'/ trʌŋˈkeɪt/',pos:'verb',def:'To shorten by cutting off the top or end.',example:'The editor truncated the article to fit the available space.',points:10},
  {word:'TURBULENT',phonetic:'/ ˈtɜː.bjʊ.lənt/',pos:'adjective',def:'Characterized by conflict, disorder, or confusion.',example:'The company went through a turbulent period following the merger.',points:11},
  {word:'UBIQUITOUS',phonetic:'/ juːˈbɪk.wɪ.təs/',pos:'adjective',def:'Present, appearing, or found everywhere.',example:'Smartphones have become ubiquitous in modern daily life.',points:21},
  {word:'UNDERMINE',phonetic:'/ ˌʌn.dəˈmaɪn/',pos:'verb',def:'To erode the base of; to weaken or damage gradually.',example:'Constant criticism can undermine a person\'s confidence over time.',points:12},
  {word:'UNIFORM',phonetic:'/ ˈjuː.nɪ.fɔːm/',pos:'adjective',def:'Remaining the same in all cases and at all times; consistent.',example:'The results were uniform across all test groups.',points:12},
  {word:'UNPRECEDENTED',phonetic:'/ ʌnˈpres.ɪ.den.tɪd/',pos:'adjective',def:'Never done or known before.',example:'The storm caused unprecedented damage along the coastline.',points:19},
  {word:'UNSCRUPULOUS',phonetic:'/ ʌnˈskruː.pjʊ.ləs/',pos:'adjective',def:'Having or showing no moral principles; dishonest.',example:'The unscrupulous dealer sold counterfeit goods to unsuspecting buyers.',points:16},
  {word:'VACILLATE',phonetic:'/ ˈvæs.ɪ.leɪt/',pos:'verb',def:'To waver between different opinions or actions; to be indecisive.',example:'He vacillated for weeks before finally choosing a career path.',points:14},
  {word:'VENERATE',phonetic:'/ ˈven.ər.eɪt/',pos:'verb',def:'To regard with great respect and reverence.',example:'The community gathered to venerate the memory of their founder.',points:11},
  {word:'VERBOSE',phonetic:'/ vɜːˈbəʊs/',pos:'adjective',def:'Using more words than needed; wordy.',example:'The verbose report could have been summarized in two pages.',points:12},
  {word:'VIABLE',phonetic:'/ ˈvaɪ.ə.bəl/',pos:'adjective',def:'Capable of working successfully; feasible.',example:'The committee assessed whether the proposal was financially viable.',points:11},
  {word:'VINDICATE',phonetic:'/ ˈvɪn.dɪ.keɪt/',pos:'verb',def:'To clear from blame or suspicion; to justify.',example:'The new evidence fully vindicated the accused man.',points:15},
  {word:'VIRULENT',phonetic:'/ ˈvɪr.ʊ.lənt/',pos:'adjective',def:'Extremely severe or harmful; bitterly hostile.',example:'A virulent strain of the virus spread rapidly across the region.',points:11},
  {word:'VOLATILE',phonetic:'/ ˈvɒl.ə.taɪl/',pos:'adjective',def:'Liable to change rapidly and unpredictably; explosive.',example:'The volatile stock market made investors nervous throughout the year.',points:11},
  {word:'ZEALOUS',phonetic:'/ ˈzel.əs/',pos:'adjective',def:'Having or showing great energy or enthusiasm for a cause.',example:'The zealous campaigner knocked on hundreds of doors every weekend.',points:16},
  {word:'ZEAL',phonetic:'/ ziːl/',pos:'noun',def:'Great energy or enthusiasm in pursuit of a cause.',example:'She approached every task with infectious zeal and dedication.',points:13},
  {word:'ABASE',phonetic:'/ əˈbeɪs/',pos:'verb',def:'To lower in rank or esteem; to humble.',example:'He refused to abase himself by apologizing for the truth.',points:7},
  {word:'ABATE',phonetic:'/ əˈbeɪt/',pos:'verb',def:'To become less intense or widespread.',example:'The storm finally abated after three days of fierce winds.',points:7},
  {word:'ABDICATE',phonetic:'/ ˈæb.dɪ.keɪt/',pos:'verb',def:'To fail to fulfill a duty or responsibility.',example:'The king abdicated his throne in favor of his eldest son.',points:13},
  {word:'ABERRATION',phonetic:'/ ˌæb.əˈreɪ.ʃən/',pos:'noun',def:'A departure from what is normal or expected.',example:'The cold snap in July was a meteorological aberration.',points:12},
  {word:'ABNEGATE',phonetic:'/ ˈæb.nɪ.ɡeɪt/',pos:'verb',def:'To renounce or reject something; to deny oneself.',example:'The monk abnegated all worldly pleasures to pursue spiritual goals.',points:11},
  {word:'ABROGATE',phonetic:'/ ˈæb.rə.ɡeɪt/',pos:'verb',def:'To repeal or do away with a law or agreement.',example:'The new government moved swiftly to abrogate the treaty.',points:11},
  {word:'ABSTINENCE',phonetic:'/ ˈæb.stɪ.nəns/',pos:'noun',def:'The practice of restraining oneself from indulging in something.',example:'The doctor recommended complete abstinence from alcohol.',points:14},
  {word:'ACUMEN',phonetic:'/ ˈæk.jʊ.mən/',pos:'noun',def:'The ability to make good judgements quickly; sharpness.',example:'His business acumen turned a small shop into a national chain.',points:10},
  {word:'ADULTERATE',phonetic:'/ əˈdʌl.tər.eɪt/',pos:'verb',def:'To make impure by adding inferior substances.',example:'The investigation found that the spices had been adulterated with fillers.',points:11},
  {word:'AGGRAVATE',phonetic:'/ ˈæɡ.rə.veɪt/',pos:'verb',def:'To make a problem worse; to annoy or exasperate.',example:'Scratching will only aggravate the skin condition further.',points:14},
  {word:'ALOOF',phonetic:'/ əˈluːf/',pos:'adjective',def:'Not friendly or forthcoming; distant and cold.',example:'The new manager seemed aloof and hard to approach.',points:8},
  {word:'AMORPHOUS',phonetic:'/ eɪˈmɔː.fəs/',pos:'adjective',def:'Without a clearly defined shape or form.',example:'The amorphous mass of fog rolled slowly over the valley.',points:16},
  {word:'ANACHRONISTIC',phonetic:'/ əˌnæk.rəˈnɪs.tɪk/',pos:'adjective',def:'Belonging or appropriate to an earlier period of time.',example:'The anachronistic customs of the village attracted curious tourists.',points:20},
  {word:'ANOINT',phonetic:'/ əˈnɔɪnt/',pos:'verb',def:'To ceremonially appoint someone to a high position.',example:'The elders anointed her as the new leader of the community.',points:6},
  {word:'ANTAGONIZE',phonetic:'/ ænˈtæɡ.ə.naɪz/',pos:'verb',def:'To cause someone to become hostile.',example:'His sarcastic remarks only served to antagonize the already angry crowd.',points:20},
  {word:'ANTITHESIS',phonetic:'/ ænˈtɪθ.ə.sɪs/',pos:'noun',def:'The direct opposite of something.',example:'Cruelty is the antithesis of compassion.',points:13},
  {word:'APOCRYPHAL',phonetic:'/ əˈpɒk.rɪ.fəl/',pos:'adjective',def:'Of doubtful authenticity; widely circulated but unlikely to be true.',example:'The story of his miraculous recovery is probably apocryphal.',points:22},
  {word:'APPREHENSIVE',phonetic:'/ ˌæp.rɪˈhen.sɪv/',pos:'adjective',def:'Anxious or fearful that something bad will happen.',example:'She was apprehensive about her first performance on the main stage.',points:22},
  {word:'ASCENDANCY',phonetic:'/ əˈsen.dən.si/',pos:'noun',def:'Occupation of a position of dominant power or influence.',example:'The party steadily gained ascendancy over its rivals.',points:18},
  {word:'ASPERSION',phonetic:'/ əˈspɜː.ʃən/',pos:'noun',def:'An attack on the reputation or integrity of someone.',example:'He cast aspersions on her character without any evidence.',points:11},
  {word:'ATONE',phonetic:'/ əˈtəʊn/',pos:'verb',def:'To make amends for a wrong or injury.',example:'He sought to atone for past mistakes through years of charity work.',points:5},
  {word:'AUDACITY',phonetic:'/ ɔːˈdæs.ɪ.ti/',pos:'noun',def:'A willingness to take bold risks; impudent boldness.',example:'She had the audacity to challenge the senior professor in front of everyone.',points:14},
  {word:'BENEVOLENCE',phonetic:'/ bəˈnev.ə.ləns/',pos:'noun',def:'The quality of being kind and generous.',example:'His benevolence toward the homeless was widely admired.',points:18},
  {word:'BERATE',phonetic:'/ bɪˈreɪt/',pos:'verb',def:'To scold or criticize someone angrily.',example:'The coach berated the player for arriving late to practice.',points:8},
  {word:'BEWILDERMENT',phonetic:'/ bɪˈwɪl.də.mənt/',pos:'noun',def:'A feeling of being confused or puzzled.',example:'The sudden rule change caused bewilderment among the students.',points:20},
  {word:'BIASED',phonetic:'/ ˈbaɪ.əst/',pos:'adjective',def:'Unfairly prejudiced for or against someone.',example:'The judge was removed for making biased rulings.',points:9},
  {word:'BLATANT',phonetic:'/ ˈbleɪ.tənt/',pos:'adjective',def:'Done openly and unashamedly; completely obvious.',example:'It was a blatant lie that everyone in the room could see through.',points:9},
  {word:'CANDID',phonetic:'/ ˈkæn.dɪd/',pos:'adjective',def:'Truthful and straightforward; frank.',example:'She appreciated his candid feedback even if it stung.',points:10},
  {word:'CAPITULATE',phonetic:'/ kəˈpɪtʃ.ʊ.leɪt/',pos:'verb',def:'To cease to resist; to give in.',example:'After hours of debate, he finally capitulated to their demands.',points:14},
  {word:'CHICANERY',phonetic:'/ ʃɪˈkeɪ.nər.i/',pos:'noun',def:'The use of trickery to achieve a goal.',example:'The election was marred by chicanery and fraudulent voting.',points:19},
  {word:'CIRCUMVENT',phonetic:'/ ˌsɜː.kəmˈvent/',pos:'verb',def:'To find a way around an obstacle or rule.',example:'The company tried to circumvent tax regulations through offshore accounts.',points:19},
  {word:'COALESCE',phonetic:'/ ˌkəʊ.əˈles/',pos:'verb',def:'To come together to form one mass or whole.',example:'The various factions coalesced into a united opposition party.',points:12},
  {word:'COERCION',phonetic:'/ kəʊˈɜː.ʃən/',pos:'noun',def:'The practice of persuading someone by force or threats.',example:'The confession was obtained through coercion and was ruled inadmissible.',points:12},
  {word:'COLLUSION',phonetic:'/ kəˈluː.ʒən/',pos:'noun',def:'Secret or illegal cooperation in order to deceive others.',example:'The antitrust investigation uncovered collusion among the major suppliers.',points:11},
  {word:'COMMENSURATE',phonetic:'/ kəˈmen.sjʊ.rət/',pos:'adjective',def:'Corresponding in size or degree; proportionate.',example:'Her salary was commensurate with her level of experience.',points:18},
  {word:'COMPEL',phonetic:'/ kəmˈpel/',pos:'verb',def:'To force someone to do something.',example:'Circumstances compelled her to make a decision sooner than planned.',points:12},
  {word:'CONDESCEND',phonetic:'/ ˌkɒn.dɪˈsend/',pos:'verb',def:'To behave as if one is superior to others.',example:'She refused to condescend to her students regardless of the topic.',points:16},
  {word:'CONFOUND',phonetic:'/ kənˈfaʊnd/',pos:'verb',def:'To cause surprise or confusion in; to puzzle.',example:'The unexpected results confounded even the most experienced researchers.',points:14},
  {word:'CONTENTIOUS',phonetic:'/ kənˈten.ʃəs/',pos:'adjective',def:'Causing or likely to cause an argument; controversial.',example:'Immigration has long been a contentious issue in the debate.',points:13},
  {word:'CONTRITE',phonetic:'/ ˈkɒn.traɪt/',pos:'adjective',def:'Feeling or expressing remorse for one\'s wrongdoing.',example:'He appeared genuinely contrite during the public apology.',points:10},
  {word:'COUNTERACT',phonetic:'/ ˌkaʊn.tərˈækt/',pos:'verb',def:'To act against to reduce its force or effect.',example:'The antidote was administered to counteract the effects of the poison.',points:14},
  {word:'CREDIBLE',phonetic:'/ ˈkred.ɪ.bəl/',pos:'adjective',def:'Able to be believed; convincing.',example:'The report was based on credible sources and thorough investigation.',points:13},
  {word:'CURTAIL',phonetic:'/ kɜːˈteɪl/',pos:'verb',def:'To reduce in extent or quantity; to impose a restriction.',example:'Budget cuts forced the charity to curtail its overseas programs.',points:9},
  {word:'DAUNTING',phonetic:'/ ˈdɔːn.tɪŋ/',pos:'adjective',def:'Seeming difficult to deal with in prospect; intimidating.',example:'The daunting pile of exam papers discouraged even the best students.',points:10},
  {word:'DEBUNK',phonetic:'/ ˌdiːˈbʌŋk/',pos:'verb',def:'To expose the falseness or hollowness of a myth or claim.',example:'The documentary debunked many popular myths about nutrition.',points:13},
  {word:'DECISIVE',phonetic:'/ dɪˈsaɪ.sɪv/',pos:'adjective',def:'Settling an issue; having the ability to decide quickly.',example:'A decisive leader inspires confidence even in uncertain times.',points:14},
  {word:'DECREE',phonetic:'/ dɪˈkriː/',pos:'noun',def:'An official order issued by a legal authority.',example:'The king issued a decree banning the import of foreign goods.',points:9},
  {word:'DEFAME',phonetic:'/ dɪˈfeɪm/',pos:'verb',def:'To damage the good reputation of someone; to slander.',example:'The tabloid article was found to defame the celebrity without cause.',points:12},
  {word:'DEFER',phonetic:'/ dɪˈfɜːr/',pos:'verb',def:'To put off to a later time; to submit to another\'s authority.',example:'The committee deferred its final decision until all evidence was reviewed.',points:9},
  {word:'DELIBERATE',phonetic:'/ dɪˈlɪb.ər.ɪt/',pos:'adjective',def:'Done consciously and intentionally; slow and careful.',example:'The deliberate pace of the investigation frustrated the victims\' families.',points:13},
  {word:'DEPRAVITY',phonetic:'/ dɪˈpræv.ɪ.ti/',pos:'noun',def:'Moral corruption; extreme wickedness.',example:'The report catalogued the depravity of the regime in graphic detail.',points:18},
  {word:'DESPOTIC',phonetic:'/ dɪˈspɒt.ɪk/',pos:'adjective',def:'Of or typical of a despot; tyrannical.',example:'The despotic ruler crushed all forms of political opposition.',points:13},
  {word:'DEVIOUS',phonetic:'/ ˈdiː.vi.əs/',pos:'adjective',def:'Showing a skillful use of underhanded tactics to achieve goals.',example:'His devious plan unraveled when an accomplice confessed.',points:11},
  {word:'DIFFIDENCE',phonetic:'/ ˈdɪf.ɪ.dəns/',pos:'noun',def:'Modest or shy reluctance to express one\'s views.',example:'Her diffidence in meetings masked a brilliant analytical mind.',points:20},
  {word:'DILETTANTE',phonetic:'/ ˌdɪl.ɪˈtæn.ti/',pos:'noun',def:'A person who cultivates an interest without real commitment.',example:'Critics dismissed him as a dilettante rather than a serious artist.',points:11},
  {word:'DISCREDIT',phonetic:'/ dɪsˈkred.ɪt/',pos:'verb',def:'To harm the reputation of; to cause to be doubted.',example:'The new findings discredited the long-held scientific consensus.',points:13},
  {word:'DISCRETION',phonetic:'/ dɪˈskreʃ.ən/',pos:'noun',def:'The quality of behaving so as to avoid causing offense.',example:'Employees are expected to handle client information with discretion.',points:13},
  {word:'DISDAINFUL',phonetic:'/ dɪsˈdeɪn.fəl/',pos:'adjective',def:'Showing contempt or lack of respect.',example:'His disdainful attitude toward junior staff cost him their loyalty.',points:15},
  {word:'ELOQUENT',phonetic:'/ ˈel.ə.kwənt/',pos:'adjective',def:'Fluent or persuasive in speaking or writing.',example:'The eloquent speech moved the entire audience to tears.',points:17},
  {word:'EMBELLISH',phonetic:'/ ɪmˈbel.ɪʃ/',pos:'verb',def:'To make more attractive; to add details to a story.',example:'She tended to embellish her travel stories with invented details.',points:16},
  {word:'EMBROIL',phonetic:'/ ɪmˈbrɔɪl/',pos:'verb',def:'To involve someone deeply in an argument or conflict.',example:'He found himself embroiled in a legal dispute that lasted years.',points:11},
  {word:'EMPHATIC',phonetic:'/ ɪmˈfæt.ɪk/',pos:'adjective',def:'Expressing something forcibly and clearly.',example:'His emphatic denial was broadcast widely but convinced few.',points:17},
  {word:'ENCUMBER',phonetic:'/ ɪnˈkʌm.bər/',pos:'verb',def:'To restrict or burden with something.',example:'The heavy pack encumbered the hikers on the steep mountain trail.',points:14},
  {word:'ENDORSE',phonetic:'/ ɪnˈdɔːs/',pos:'verb',def:'To declare one\'s public approval or support of.',example:'The celebrity agreed to endorse the new sports drink brand.',points:8},
  {word:'ENERVATE',phonetic:'/ ˈen.ə.veɪt/',pos:'verb',def:'To cause someone to feel drained of energy.',example:'The oppressive heat enervated the athletes before the race even began.',points:11},
  {word:'ENGROSS',phonetic:'/ ɪnˈɡrəʊs/',pos:'verb',def:'To absorb all the attention or interest of.',example:'The novel was so engrossing she read it in a single sitting.',points:8},
  {word:'ENNUI',phonetic:'/ ˈɒn.wiː/',pos:'noun',def:'A feeling of listlessness and dissatisfaction arising from a lack of excitement.',example:'The endless routine filled her with a growing sense of ennui.',points:5},
  {word:'EQUITABLE',phonetic:'/ ˈek.wɪ.tə.bəl/',pos:'adjective',def:'Fair and impartial; treating all people equally.',example:'The lawyers sought an equitable distribution of the estate.',points:20},
  {word:'EVANESCENT',phonetic:'/ ˌev.əˈnes.ənt/',pos:'adjective',def:'Quickly fading or disappearing; transitory.',example:'The evanescent colors of the sunset faded within minutes.',points:15},
  {word:'EXCORIATE',phonetic:'/ ɪkˈskɔː.ri.eɪt/',pos:'verb',def:'To criticize someone harshly.',example:'The columnist excoriated the government for its slow response.',points:18},
  {word:'EXEMPLAR',phonetic:'/ ɪɡˈzem.plər/',pos:'noun',def:'A person or thing serving as a typical example or model.',example:'She was held up as an exemplar of professional integrity.',points:19},
  {word:'EXPEDITE',phonetic:'/ ˈek.spɪ.daɪt/',pos:'verb',def:'To make something happen sooner or more quickly.',example:'The manager expedited the approval process to meet the deadline.',points:18},
  {word:'EXTRAPOLATE',phonetic:'/ ɪkˈstræp.ə.leɪt/',pos:'verb',def:'To extend conclusions from known facts to unknown situations.',example:'From early sales data, analysts extrapolated full-year revenue projections.',points:20},
  {word:'EXUBERANT',phonetic:'/ ɪɡˈzjuː.bər.ənt/',pos:'adjective',def:'Filled with lively energy and excitement.',example:'The exuberant crowd erupted as the team scored the winning goal.',points:18},
  {word:'FACETIOUS',phonetic:'/ fəˈsiː.ʃəs/',pos:'adjective',def:'Treating serious issues with inappropriate humor.',example:'His facetious remarks during the memorial were considered disrespectful.',points:14},
  {word:'FALLIBLE',phonetic:'/ ˈfæl.ɪ.bəl/',pos:'adjective',def:'Capable of making mistakes; not infallible.',example:'Even the most experienced doctors are fallible.',points:13},
  {word:'FLAMBOYANT',phonetic:'/ flæmˈbɔɪ.ənt/',pos:'adjective',def:'Tending to attract attention through exuberance or style.',example:'The flamboyant designer arrived at the gala in a gold suit.',points:20},
  {word:'FLEDGLING',phonetic:'/ ˈfledʒ.lɪŋ/',pos:'adjective',def:'New and inexperienced; emerging.',example:'The fledgling company secured its first major contract after six months.',points:15},
  {word:'FORESTALL',phonetic:'/ fɔːˈstɔːl/',pos:'verb',def:'To prevent something by taking action in advance.',example:'She forestalled the complaint by addressing the issue immediately.',points:12},
  {word:'FRIVOLOUS',phonetic:'/ ˈfrɪv.ə.ləs/',pos:'adjective',def:'Not having a serious purpose; lighthearted and silly.',example:'The judge dismissed the lawsuit as frivolous and without merit.',points:15},
  {word:'FRUGALITY',phonetic:'/ fruːˈɡæl.ɪ.ti/',pos:'noun',def:'The quality of being economical with money or resources.',example:'Her frugality allowed her to retire comfortably at sixty.',points:16},
  {word:'FULSOME',phonetic:'/ ˈfʊl.səm/',pos:'adjective',def:'Complimentary to an excessive degree; insincere.',example:'The fulsome praise in the review seemed more like flattery than criticism.',points:12},
  {word:'GALVANIZE',phonetic:'/ ˈɡæl.və.naɪz/',pos:'verb',def:'To shock or excite someone into taking action.',example:'The documentary galvanized public support for environmental reform.',points:22},
  {word:'GLIB',phonetic:'/ ɡlɪb/',pos:'adjective',def:'Fluent but insincere and shallow.',example:'His glib answers failed to satisfy the panel of interviewers.',points:7},
  {word:'GRAVITY',phonetic:'/ ˈɡræv.ɪ.ti/',pos:'noun',def:'The quality of being serious; extreme importance.',example:'The gravity of the situation was evident on every face in the room.',points:14},
  {word:'GRIEVOUS',phonetic:'/ ˈɡriː.vəs/',pos:'adjective',def:'Very severe or serious; causing great pain.',example:'The accident resulted in grievous injuries to two passengers.',points:12},
  {word:'HAMSTRING',phonetic:'/ ˈhæm.strɪŋ/',pos:'verb',def:'To severely restrict the efficiency or effectiveness of.',example:'Lack of funding hamstrung the project from the very start.',points:15},
  {word:'HARANGUE',phonetic:'/ həˈræŋ/',pos:'verb',def:'To lecture or scold someone at length.',example:'The angry supervisor harangued the team for over an hour.',points:12},
  {word:'HAUGHTY',phonetic:'/ ˈhɔː.ti/',pos:'adjective',def:'Arrogantly superior and disdainful.',example:'Her haughty manner put off many potential friends.',points:17},
  {word:'HEDONISM',phonetic:'/ ˈhiː.də.nɪ.z(ə)m/',pos:'noun',def:'The pursuit of pleasure as the highest good.',example:'His philosophy of hedonism led him to prioritize enjoyment above all else.',points:14},
  {word:'HERETICAL',phonetic:'/ həˈret.ɪ.kəl/',pos:'adjective',def:'Believing in or practicing heresy; going against doctrine.',example:'The scientist\'s heretical ideas were mocked before being proven correct.',points:14},
  {word:'HYPERBOLE',phonetic:'/ haɪˈpɜː.bə.li/',pos:'noun',def:'Exaggerated statements not meant to be taken literally.',example:'Saying he could eat a horse was, of course, hyperbole.',points:19},
  {word:'ICONOCLASTIC',phonetic:'/ aɪˌkɒn.əˈklæs.tɪk/',pos:'adjective',def:'Attacking or rejecting established norms.',example:'Her iconoclastic approach to teaching challenged every assumption.',points:18},
  {word:'ILLUMINATE',phonetic:'/ ɪˈluː.mɪ.neɪt/',pos:'verb',def:'To shed light on; to help clarify or explain.',example:'The biography does much to illuminate the poet\'s inner life.',points:12},
  {word:'IMMINENT',phonetic:'/ ˈɪm.ɪ.nənt/',pos:'adjective',def:'About to happen very soon.',example:'The weather forecast warned that a severe storm was imminent.',points:12},
  {word:'IMPECCABLE',phonetic:'/ ɪmˈpek.ə.bəl/',pos:'adjective',def:'In accordance with the highest standards; faultless.',example:'Her impeccable taste was evident in every corner of the apartment.',points:20},
  {word:'IMPLICATION',phonetic:'/ ˌɪm.plɪˈkeɪ.ʃən/',pos:'noun',def:'A conclusion that can be drawn from something although not directly stated.',example:'The implication of the report was that management had known all along.',points:17},
  {word:'INCOHERENT',phonetic:'/ ˌɪn.kəʊˈhɪər.ənt/',pos:'adjective',def:'Expressed in an unclear or confusing way.',example:'His incoherent explanation left the committee more confused than before.',points:15},
  {word:'INCORRIGIBLE',phonetic:'/ ɪnˈkɒr.ɪ.dʒɪ.bəl/',pos:'adjective',def:'Not able to be corrected or reformed.',example:'The incorrigible troublemaker was eventually expelled from school.',points:17},
  {word:'INCRIMINATE',phonetic:'/ ɪnˈkrɪm.ɪ.neɪt/',pos:'verb',def:'To make someone appear guilty of a crime or wrongdoing.',example:'The emails found on his computer incriminated him completely.',points:15},
  {word:'INDIGNANT',phonetic:'/ ɪnˈdɪɡ.nənt/',pos:'adjective',def:'Feeling or showing anger about unfair treatment.',example:'She was indignant at being passed over for promotion again.',points:11},
  {word:'INDISPUTABLE',phonetic:'/ ˌɪn.dɪˈspjuː.tə.bəl/',pos:'adjective',def:'Unable to be challenged or denied.',example:'The video footage provided indisputable proof of the incident.',points:17},
  {word:'INDOCTRINATE',phonetic:'/ ɪnˈdɒk.trɪ.neɪt/',pos:'verb',def:'To teach someone to accept a set of beliefs uncritically.',example:'The cult used fear and isolation to indoctrinate its members.',points:15},
  {word:'INEFFABLE',phonetic:'/ ɪnˈef.ə.bəl/',pos:'adjective',def:'Too great or extreme to be expressed in words.',example:'Standing at the edge of the Grand Canyon filled her with ineffable awe.',points:17},
  {word:'INERTIA',phonetic:'/ ɪˈnɜː.ʃə/',pos:'noun',def:'A tendency to do nothing or remain unchanged.',example:'Organizational inertia prevented any meaningful reform from taking place.',points:7},
  {word:'INEXORABLE',phonetic:'/ ɪˈnek.sər.ə.bəl/',pos:'adjective',def:'Impossible to stop or prevent.',example:'The inexorable rise of technology transformed every industry.',points:19},
  {word:'INFALLIBLE',phonetic:'/ ɪnˈfæl.ɪ.bəl/',pos:'adjective',def:'Never failing; always effective; incapable of error.',example:'No system is infallible, and this one had clear weaknesses.',points:15},
  {word:'INFAMY',phonetic:'/ ˈɪn.fə.mi/',pos:'noun',def:'The state of being well known for a bad quality or deed.',example:'The general lived out his days in infamy after the massacre.',points:14},
  {word:'INGENUOUS',phonetic:'/ ɪnˈdʒen.ju.əs/',pos:'adjective',def:'Innocent and unsuspecting; naively simple.',example:'Her ingenuous trust in strangers occasionally put her in difficult situations.',points:10},
  {word:'INIMICAL',phonetic:'/ ɪˈnɪm.ɪ.kəl/',pos:'adjective',def:'Tending to obstruct or harm; hostile.',example:'Such policies are inimical to free and fair competition.',points:12},
  {word:'INNATE',phonetic:'/ ɪˈneɪt/',pos:'adjective',def:'Inborn; natural; not learned.',example:'She had an innate ability to put nervous people at ease.',points:6},
  {word:'INQUISITIVE',phonetic:'/ ɪnˈkwɪz.ɪ.tɪv/',pos:'adjective',def:'Having a strong desire to learn or know.',example:'An inquisitive child, he questioned everything he encountered.',points:23},
  {word:'INSATIABLE',phonetic:'/ ɪnˈseɪ.ʃə.bəl/',pos:'adjective',def:'Impossible to satisfy.',example:'Her insatiable curiosity drove her to explore every corner of the library.',points:12},
  {word:'INSOLENT',phonetic:'/ ˈɪn.sə.lənt/',pos:'adjective',def:'Showing a rude and arrogant lack of respect.',example:'The insolent reply he gave his teacher earned him a detention.',points:8},
  {word:'INSTIGATE',phonetic:'/ ˈɪn.stɪ.ɡeɪt/',pos:'verb',def:'To bring about or initiate; to provoke.',example:'The leaked document instigated a full parliamentary inquiry.',points:10},
  {word:'INTRANSIGENT',phonetic:'/ ɪnˈtræn.zɪ.dʒənt/',pos:'adjective',def:'Unwilling to change one\'s views or agree.',example:'The intransigent negotiator refused every compromise offered.',points:13},
  {word:'INVOKE',phonetic:'/ ɪnˈvəʊk/',pos:'verb',def:'To call on for support; to cite as an authority.',example:'The defense lawyer invoked the right to silence on behalf of her client.',points:13},
  {word:'JEOPARDIZE',phonetic:'/ ˈdʒep.ə.daɪz/',pos:'verb',def:'To put someone or something into a situation of risk.',example:'His reckless behavior jeopardized the entire team\'s chances.',points:29},
  {word:'JUDICIOUS',phonetic:'/ dʒuːˈdɪʃ.əs/',pos:'adjective',def:'Having or showing good judgement; sensible.',example:'A judicious use of resources helped the charity maximize its impact.',points:19},
  {word:'LACONIC',phonetic:'/ ləˈkɒn.ɪk/',pos:'adjective',def:'Using very few words to express a lot.',example:'His laconic reply conveyed more than a lengthy explanation ever could.',points:11},
  {word:'LATENT',phonetic:'/ ˈleɪ.tənt/',pos:'adjective',def:'Existing but not yet developed or manifest.',example:'The scan revealed a latent condition that had gone undetected for years.',points:6},
  {word:'LAUD',phonetic:'/ lɔːd/',pos:'verb',def:'To praise highly.',example:'Critics lauded the film as the most original of the decade.',points:5},
  {word:'LAX',phonetic:'/ læks/',pos:'adjective',def:'Not sufficiently strict; negligent.',example:'Lax security at the venue allowed unauthorized personnel to enter.',points:10},
  {word:'LENIENT',phonetic:'/ ˈliː.ni.ənt/',pos:'adjective',def:'More merciful or tolerant than expected.',example:'The lenient sentence surprised many who had expected a harsh penalty.',points:7},
  {word:'LISTLESS',phonetic:'/ ˈlɪst.ləs/',pos:'adjective',def:'Lacking energy or enthusiasm; lethargic.',example:'She spent the afternoon in a listless daze, unable to concentrate.',points:8},
  {word:'MAGNANIMOUS',phonetic:'/ mæɡˈnæn.ɪ.məs/',pos:'adjective',def:'Generous or forgiving, especially toward a rival.',example:'The magnanimous winner congratulated her opponent warmly.',points:16},
  {word:'MALIGN',phonetic:'/ məˈlaɪn/',pos:'verb',def:'To speak about someone in a critically unfair way.',example:'He felt that the press had unfairly maligned his reputation.',points:9},
  {word:'MENDACIOUS',phonetic:'/ menˈdeɪ.ʃəs/',pos:'adjective',def:'Not telling the truth; lying.',example:'The mendacious politician denied allegations that were clearly proven.',points:15},
  {word:'MERETRICIOUS',phonetic:'/ ˌmer.ɪˈtrɪʃ.əs/',pos:'adjective',def:'Apparently attractive but having no real value.',example:'The meretricious advertisements promised results that were impossible.',points:16},
  {word:'MERITOCRACY',phonetic:'/ ˌmer.ɪˈtɒk.rə.si/',pos:'noun',def:'A system in which advancement is based on ability.',example:'She believed the company operated as a true meritocracy.',points:20},
  {word:'MISANTHROPE',phonetic:'/ ˈmɪs.ən.θrəʊp/',pos:'noun',def:'A person who dislikes humankind and avoids human society.',example:'The misanthrope lived alone in a remote cabin in the mountains.',points:18},
  {word:'MISNOMER',phonetic:'/ ˌmɪsˈnəʊ.mər/',pos:'noun',def:'A wrong or inaccurate name or designation.',example:'Calling it a \'free\' service was a misnomer since data was collected.',points:12},
  {word:'MOLLIFY',phonetic:'/ ˈmɒl.ɪ.faɪ/',pos:'verb',def:'To appease the anger or anxiety of someone.',example:'He tried to mollify the upset customer with a full refund.',points:15},
  {word:'MOROSE',phonetic:'/ məˈrəʊs/',pos:'adjective',def:'Sullen and ill-tempered; gloomy.',example:'He became increasingly morose after losing his job.',points:8},
  {word:'MULTIFACETED',phonetic:'/ ˌmʌl.tiˈfæs.ɪ.tɪd/',pos:'adjective',def:'Having many different aspects or features.',example:'The issue of poverty is multifaceted and requires complex solutions.',points:20},
  {word:'NAIVETY',phonetic:'/ naɪˈiː.və.ti/',pos:'noun',def:'Lack of experience or judgement; innocence.',example:'Her naivety made her vulnerable to exploitation.',points:13},
  {word:'NEBULOUS',phonetic:'/ ˈneb.jʊ.ləs/',pos:'adjective',def:'Not clear or exact; vague.',example:'He had only a nebulous sense of what the project would involve.',points:10},
  {word:'NONCHALANT',phonetic:'/ ˈnɒn.ʃə.lɑːnt/',pos:'adjective',def:'Feeling or appearing casually calm and relaxed.',example:'He appeared nonchalant about the results, though he was anxious inside.',points:15},
  {word:'OBDURATE',phonetic:'/ ˈɒb.djʊ.rɪt/',pos:'adjective',def:'Stubbornly refusing to change one\'s opinion.',example:'Despite all arguments, he remained obdurate in his position.',points:11},
  {word:'OBSEQUIOUS',phonetic:'/ əbˈsiː.kwi.əs/',pos:'adjective',def:'Obedient or attentive to an excessive degree.',example:'The obsequious assistant agreed with everything his boss said.',points:21},
  {word:'OBTUSE',phonetic:'/ əbˈtjuːs/',pos:'adjective',def:'Annoyingly insensitive or slow to understand.',example:'He seemed obtuse about the effect his words had on others.',points:8},
  {word:'OMNIPOTENT',phonetic:'/ ɒmˈnɪp.ə.tənt/',pos:'adjective',def:'Having unlimited or very great power.',example:'The story features an omnipotent deity who controls all events.',points:14},
  {word:'OPPORTUNISTIC',phonetic:'/ ˌɒp.ə.tjuːˈnɪs.tɪk/',pos:'adjective',def:'Exploiting immediate opportunities regardless of ethics.',example:'His opportunistic behavior during the crisis earned him no respect.',points:19},
  {word:'OPPRESS',phonetic:'/ əˈpres/',pos:'verb',def:'To keep in subservience and hardship through unjust use of authority.',example:'The regime continued to oppress its citizens for decades.',points:11},
  {word:'OSTRACIZE',phonetic:'/ ˈɒs.trə.saɪz/',pos:'verb',def:'To exclude from society or a group.',example:'After the scandal, he was ostracized by his former colleagues.',points:20},
  {word:'OVERT',phonetic:'/ əʊˈvɜːt/',pos:'adjective',def:'Done openly and without concealment.',example:'There was overt hostility between the two candidates at the debate.',points:8},
  {word:'PANDER',phonetic:'/ ˈpæn.dər/',pos:'verb',def:'To indulge an immoral wish in someone.',example:'The politician was accused of pandering to public fear rather than addressing facts.',points:9},
  {word:'PARTISAN',phonetic:'/ ˈpɑː.tɪ.zæn/',pos:'adjective',def:'Prejudiced in favor of a particular cause; biased.',example:'The coverage was clearly partisan and offered only one perspective.',points:10},
  {word:'PEDANTIC',phonetic:'/ pɪˈdæn.tɪk/',pos:'adjective',def:'Overly concerned with minor details or rules; narrow-minded.',example:'His pedantic corrections were more irritating than helpful.',points:13},
  {word:'PERFIDIOUS',phonetic:'/ pəˈfɪd.i.əs/',pos:'adjective',def:'Deceitful and untrustworthy; treacherous.',example:'His perfidious betrayal shocked even those who had never trusted him.',points:16},
  {word:'PERSPICUOUS',phonetic:'/ pəˈspɪk.ju.əs/',pos:'adjective',def:'Clearly expressed and easily understood.',example:'The judge asked for a more perspicuous summary of the legal argument.',points:17},
  {word:'PETULANT',phonetic:'/ ˈpetʃ.ʊ.lənt/',pos:'adjective',def:'Childishly sulky or bad-tempered.',example:'He gave a petulant response when he didn\'t get his own way.',points:10},
  {word:'PIETY',phonetic:'/ ˈpaɪ.ɪ.ti/',pos:'noun',def:'The quality of being religious or reverent.',example:'Her deep piety was reflected in her daily prayers and service to others.',points:10},
  {word:'PLACATE',phonetic:'/ pləˈkeɪt/',pos:'verb',def:'To make someone less angry or hostile; to appease.',example:'The manager tried to placate the frustrated client with a discount.',points:11},
  {word:'POLARIZE',phonetic:'/ ˈpəʊ.lə.raɪz/',pos:'verb',def:'To divide into two sharply contrasting groups.',example:'The controversial policy polarized public opinion almost overnight.',points:19},
  {word:'POMPOUS',phonetic:'/ ˈpɒm.pəs/',pos:'adjective',def:'Affectedly and irritatingly grand or self-important.',example:'The pompous official spoke for forty minutes without saying much.',points:13},
  {word:'PRECLUDE',phonetic:'/ prɪˈkluːd/',pos:'verb',def:'To prevent something from happening; to make impossible.',example:'His injury precluded any possibility of competing in the final.',points:13},
  {word:'PRECOCIOUS',phonetic:'/ prɪˈkəʊ.ʃəs/',pos:'adjective',def:'Unusually advanced or mature, especially in mental ability.',example:'The precocious child read novels intended for teenagers.',points:16},
  {word:'PRESUMPTUOUS',phonetic:'/ prɪˈzʌmp.tju.əs/',pos:'adjective',def:'Failing to observe the limits of what is permitted; overconfident.',example:'It was presumptuous to assume he would be invited without being asked.',points:18},
  {word:'PRODIGIOUS',phonetic:'/ prəˈdɪdʒ.əs/',pos:'adjective',def:'Remarkably great in extent, size, or degree.',example:'She had a prodigious memory, recalling events from decades earlier.',points:14},
  {word:'PROFLIGATE',phonetic:'/ ˈprɒf.lɪ.ɡɪt/',pos:'adjective',def:'Recklessly extravagant; licentious.',example:'His profligate spending left him bankrupt within two years.',points:16},
  {word:'PROFUSE',phonetic:'/ prəˈfjuːs/',pos:'adjective',def:'Produced in large quantities; plentiful.',example:'The grateful patient sent profuse thanks to the entire medical team.',points:12},
  {word:'PROPAGATE',phonetic:'/ ˈprɒp.ə.ɡeɪt/',pos:'verb',def:'To spread and promote widely; to breed.',example:'Social media allows misinformation to propagate faster than ever before.',points:14},
  {word:'PROPITIOUS',phonetic:'/ prəˈpɪʃ.əs/',pos:'adjective',def:'Giving or indicating a good chance of success.',example:'The clear skies and calm seas made it a propitious day for sailing.',points:14},
  {word:'PROSAIC',phonetic:'/ prəˈzeɪ.ɪk/',pos:'adjective',def:'Having the style of prose; lacking imagination; dull.',example:'His prosaic writing style made even exciting events seem boring.',points:11},
  {word:'PUNGENT',phonetic:'/ ˈpʌn.dʒənt/',pos:'adjective',def:'Having a sharply strong taste or smell.',example:'The pungent smell of the cheese filled the entire kitchen.',points:10},
  {word:'PUGNACIOUS',phonetic:'/ pʌɡˈneɪ.ʃəs/',pos:'adjective',def:'Eager or quick to argue, quarrel, or fight.',example:'The pugnacious lawyer rarely missed an opportunity to challenge opposing counsel.',points:15},
  {word:'QUELL',phonetic:'/ kwel/',pos:'verb',def:'To suppress or put an end to a rebellion or unrest.',example:'Police were called to quell the disturbance outside the stadium.',points:14},
  {word:'QUINTESSENCE',phonetic:'/ kwɪnˈtes.əns/',pos:'noun',def:'The most perfect example of a quality or class.',example:'She was the quintessence of calm in the midst of chaos.',points:23},
  {word:'RAMPANT',phonetic:'/ ˈræm.pənt/',pos:'adjective',def:'Flourishing or spreading unchecked.',example:'Corruption was rampant throughout every level of government.',points:11},
  {word:'RATIFY',phonetic:'/ ˈræt.ɪ.faɪ/',pos:'verb',def:'To give formal consent to; to make officially valid.',example:'The senate voted to ratify the international climate agreement.',points:12},
  {word:'RECANT',phonetic:'/ rɪˈkænt/',pos:'verb',def:'To say that one no longer holds a previously expressed opinion.',example:'Under pressure, the witness recanted his original testimony.',points:8},
  {word:'RECLUSIVE',phonetic:'/ rɪˈkluː.sɪv/',pos:'adjective',def:'Avoiding the company of other people; solitary.',example:'The reclusive author had not given an interview in thirty years.',points:14},
  {word:'REDRESS',phonetic:'/ rɪˈdres/',pos:'noun',def:'Remedy or compensation for a wrong or grievance.',example:'The victims sought legal redress for the damage caused to their homes.',points:8},
  {word:'RELENTLESS',phonetic:'/ rɪˈlent.ləs/',pos:'adjective',def:'Unceasingly intense; never giving up.',example:'The relentless pressure of the campaign eventually produced results.',points:10},
  {word:'REPUDIATE',phonetic:'/ rɪˈpjuː.di.eɪt/',pos:'verb',def:'To refuse to accept; to deny the truth or validity of.',example:'She repudiated the accusations in a strongly worded statement.',points:12},
  {word:'RESCIND',phonetic:'/ rɪˈsɪnd/',pos:'verb',def:'To revoke, cancel, or repeal a law or agreement.',example:'The board voted to rescind the policy following widespread criticism.',points:10},
  {word:'RESOLUTE',phonetic:'/ ˈrez.ə.luːt/',pos:'adjective',def:'Admirably purposeful, determined, and unwavering.',example:'She remained resolute in her decision despite enormous pressure.',points:8},
  {word:'RESTIVE',phonetic:'/ ˈres.tɪv/',pos:'adjective',def:'Unable to keep still or silent; restlessly impatient.',example:'The crowd grew restive as delays mounted at the airport.',points:10},
  {word:'REVERENCE',phonetic:'/ ˈrev.ər.əns/',pos:'noun',def:'Deep respect for someone or something.',example:'The villagers held their ancient traditions in great reverence.',points:14},
  {word:'SARDONIC',phonetic:'/ sɑːˈdɒn.ɪk/',pos:'adjective',def:'Grimly mocking or cynical in tone.',example:'His sardonic humor could be funny or cutting depending on his mood.',points:11},
  {word:'SCRUTINIZE',phonetic:'/ ˈskruː.tɪ.naɪz/',pos:'verb',def:'To examine or inspect closely and thoroughly.',example:'Auditors were asked to scrutinize every financial transaction.',points:21},
  {word:'SERENE',phonetic:'/ sɪˈriːn/',pos:'adjective',def:'Calm, peaceful, and untroubled.',example:'The serene lake reflected the mountains perfectly at dawn.',points:6},
  {word:'SIGNIFICANT',phonetic:'/ sɪɡˈnɪf.ɪ.kənt/',pos:'adjective',def:'Sufficiently great or important to be worthy of attention.',example:'The study showed a significant improvement in patient outcomes.',points:17},
  {word:'SKEPTICISM',phonetic:'/ ˈskep.tɪ.sɪ.z(ə)m/',pos:'noun',def:'A doubtful attitude; questioning the truth of something.',example:'His skepticism about the new treatment turned out to be well-founded.',points:20},
  {word:'SOLEMN',phonetic:'/ ˈsɒl.əm/',pos:'adjective',def:'Formal and dignified; deeply sincere.',example:'The solemn ceremony honored those who had sacrificed their lives.',points:8},
  {word:'SOLICIT',phonetic:'/ səˈlɪs.ɪt/',pos:'verb',def:'To ask for or try to obtain something from someone.',example:'The charity solicited donations through a nationwide campaign.',points:9},
  {word:'SOMBER',phonetic:'/ ˈsɒm.bər/',pos:'adjective',def:'Dark or dull in color; oppressively gloomy in mood.',example:'The atmosphere at the funeral was somber and deeply emotional.',points:10},
  {word:'SOVEREIGNTY',phonetic:'/ ˈsɒv.rɪn.ti/',pos:'noun',def:'Supreme power, especially over a nation.',example:'The treaty was seen as a threat to national sovereignty.',points:18},
  {word:'SPECIOUS',phonetic:'/ ˈspiː.ʃəs/',pos:'adjective',def:'Superficially plausible but actually wrong.',example:'The specious argument fooled many who didn\'t examine the facts.',points:12},
  {word:'SPORADIC',phonetic:'/ spəˈræd.ɪk/',pos:'adjective',def:'Occurring at irregular intervals; not continuous.',example:'There were sporadic outbreaks of violence across the region.',points:13},
  {word:'STEADFAST',phonetic:'/ ˈsted.fɑːst/',pos:'adjective',def:'Resolutely firm and unwavering.',example:'She remained steadfast in her commitment to justice.',points:13},
  {word:'STIGMATIZE',phonetic:'/ ˈstɪɡ.mə.taɪz/',pos:'verb',def:'To mark out and describe shamefully.',example:'Mental illness is still unfairly stigmatized in many societies.',points:22},
  {word:'STRINGENT',phonetic:'/ ˈstrɪn.dʒənt/',pos:'adjective',def:'Strict, precise, and requiring careful attention.',example:'More stringent safety standards were introduced after the accident.',points:10},
  {word:'SUBJUGATE',phonetic:'/ ˈsʌb.dʒʊ.ɡeɪt/',pos:'verb',def:'To bring under domination or control.',example:'The empire sought to subjugate every neighboring territory.',points:19},
  {word:'SUBSTANTIATE',phonetic:'/ səbˈstæn.ʃi.eɪt/',pos:'verb',def:'To provide evidence to support or prove the truth of.',example:'She was unable to substantiate her claims with concrete evidence.',points:14},
  {word:'SUBVERT',phonetic:'/ səbˈvɜːt/',pos:'verb',def:'To undermine the power and authority of an established system.',example:'The spy ring sought to subvert the government from within.',points:12},
  {word:'SUPERFICIAL',phonetic:'/ ˌsuː.pəˈfɪʃ.əl/',pos:'adjective',def:'Existing or occurring at the surface; lacking depth.',example:'His interest in history was superficial at best.',points:18},
  {word:'SUPPLANT',phonetic:'/ səˈplɑːnt/',pos:'verb',def:'To supersede and replace someone or something.',example:'Digital photography quickly supplanted traditional film.',points:12},
  {word:'SURPASS',phonetic:'/ səˈpɑːs/',pos:'verb',def:'To exceed; to be greater or better than.',example:'The new record surpassed everything achieved in the previous decade.',points:9},
  {word:'SURREPTITIOUS',phonetic:'/ ˌsʌr.əpˈtɪʃ.əs/',pos:'adjective',def:'Kept secret, especially because it would not be approved of.',example:'He cast a surreptitious glance at his rival\'s answer sheet.',points:15},
  {word:'TACIT',phonetic:'/ ˈtæs.ɪt/',pos:'adjective',def:'Understood without being stated; implied.',example:'There was a tacit agreement among the group not to discuss it.',points:7},
  {word:'TENUOUS',phonetic:'/ ˈten.ju.əs/',pos:'adjective',def:'Very weak or slight; lacking substance.',example:'The connection between the two events was tenuous at best.',points:7},
  {word:'TIRADE',phonetic:'/ ˈtaɪ.reɪd/',pos:'noun',def:'A long, angry speech of criticism.',example:'The coach launched into a tirade after the team\'s poor performance.',points:7},
  {word:'TORPOR',phonetic:'/ ˈtɔː.pər/',pos:'noun',def:'A state of physical or mental inactivity; lethargy.',example:'The long winter months left the entire village in a state of torpor.',points:8},
  {word:'TRANSGRESS',phonetic:'/ trænzˈɡres/',pos:'verb',def:'To go beyond the limits of what is morally or legally acceptable.',example:'Those who transgress the law must accept the consequences.',points:11},
  {word:'TRITE',phonetic:'/ traɪt/',pos:'adjective',def:'Overused and lacking originality; hackneyed.',example:'The essay was full of trite observations that added nothing new.',points:5},
  {word:'TRUCULENT',phonetic:'/ ˈtrʌk.jʊ.lənt/',pos:'adjective',def:'Eager to argue or fight; aggressively defiant.',example:'His truculent attitude during the hearing alienated the jury.',points:11},
  {word:'TYRANNY',phonetic:'/ ˈtɪr.ə.ni/',pos:'noun',def:'Cruel and oppressive government or rule.',example:'The revolution was a direct response to decades of tyranny.',points:13},
  {word:'UNEQUIVOCAL',phonetic:'/ ˌʌn.ɪˈkwɪv.ə.kəl/',pos:'adjective',def:'Leaving no doubt; unambiguous.',example:'Her unequivocal statement left no room for misinterpretation.',points:25},
  {word:'VICARIOUS',phonetic:'/ vɪˈkeər.i.əs/',pos:'adjective',def:'Experienced in the imagination through another person.',example:'He lived vicariously through the adventures described in travel books.',points:14},
  {word:'VILIFY',phonetic:'/ ˈvɪl.ɪ.faɪ/',pos:'verb',def:'To speak or write about in an abusively dismissive way.',example:'The press mercilessly vilified the disgraced politician.',points:15},
  {word:'VINDICTIVE',phonetic:'/ vɪnˈdɪk.tɪv/',pos:'adjective',def:'Having or showing a strong desire for revenge.',example:'The vindictive supervisor used every opportunity to embarrass her former friend.',points:19},
  {word:'VITRIOLIC',phonetic:'/ ˌvɪt.riˈɒl.ɪk/',pos:'adjective',def:'Filled with bitter criticism or malice.',example:'The vitriolic review was more personal attack than literary analysis.',points:14},
  {word:'WANE',phonetic:'/ weɪn/',pos:'verb',def:'To decrease in vigor, power, or extent.',example:'Public enthusiasm for the project began to wane after the delays.',points:7},
  {word:'WHIMSICAL',phonetic:'/ ˈwɪm.zɪ.kəl/',pos:'adjective',def:'Playfully quaint or fanciful, especially in an appealing way.',example:'The whimsical illustrations made the children\'s book a delight.',points:19},
  {word:'WRATH',phonetic:'/ rɒθ/',pos:'noun',def:'Extreme anger.',example:'He faced the full wrath of his supervisor after the costly error.',points:11},
  {word:'XENOPHOBIA',phonetic:'/ ˌzen.əˈfəʊ.bi.ə/',pos:'noun',def:'Dislike or prejudice against people from other countries.',example:'The report highlighted a rise in xenophobia following the economic downturn.',points:24},
  {word:'ZEALOTRY',phonetic:'/ ˈzel.ə.tri/',pos:'noun',def:'Fanatical devotion to a cause.',example:'Religious zealotry drove the movement to extremes no one anticipated.',points:20}
,
  {word:'ABRIDGE',phonetic:'/ əˈbrɪdʒ/',pos:'verb',def:'To shorten a text while retaining the sense.',example:'The publisher asked her to abridge the novel for younger readers.',points:11},
  {word:'ABSOLVE',phonetic:'/ əbˈzɒlv/',pos:'verb',def:'To declare someone free from guilt or blame.',example:'The court absolved him of all charges due to lack of evidence.',points:12},
  {word:'ABSTRACTION',phonetic:'/ æbˈstræk.ʃən/',pos:'noun',def:'The quality of dealing with ideas rather than events.',example:'His speech was full of abstraction and short on practical solutions.',points:15},
  {word:'ACCEDE',phonetic:'/ əkˈsiːd/',pos:'verb',def:'To agree to a demand or request.',example:'The company acceded to the union\'s demands after weeks of negotiation.',points:11},
  {word:'ACCENTUATE',phonetic:'/ əkˈsen.tʃu.eɪt/',pos:'verb',def:'To make something more noticeable or prominent.',example:'The bright lighting accentuated the flaws in the paintwork.',points:14},
  {word:'ACCOMPLISH',phonetic:'/ əˈkʌm.plɪʃ/',pos:'verb',def:'To achieve or complete successfully.',example:'She accomplished more in one year than most do in five.',points:21},
  {word:'ACCOUNTABILITY',phonetic:'/ əˌkaʊn.təˈbɪl.ɪ.ti/',pos:'noun',def:'The fact of being responsible for one\'s actions.',example:'Accountability in government requires transparency at every level.',points:23},
  {word:'ACRIMONIOUS',phonetic:'/ ˌæk.rɪˈməʊ.ni.əs/',pos:'adjective',def:'Angry and bitter, especially in speech or manner.',example:'The acrimonious dispute between the partners ended in court.',points:15},
  {word:'ADHERE',phonetic:'/ ədˈhɪər/',pos:'verb',def:'To stick firmly; to follow a rule or belief closely.',example:'All participants must adhere strictly to the competition rules.',points:10},
  {word:'ADJACENT',phonetic:'/ əˈdʒeɪ.sənt/',pos:'adjective',def:'Next to or adjoining something else.',example:'The hotel is adjacent to the main conference centre.',points:18},
  {word:'ADJUDICATE',phonetic:'/ əˈdʒuː.dɪ.keɪt/',pos:'verb',def:'To make a formal judgement on a disputed matter.',example:'An independent panel was appointed to adjudicate the dispute.',points:21},
  {word:'ADMONITION',phonetic:'/ ˌæd.məˈnɪʃ.ən/',pos:'noun',def:'A firm warning or reprimand.',example:'Despite repeated admonitions, the student continued to talk in class.',points:13},
  {word:'ADVOCATE',phonetic:'/ ˈæd.və.keɪt/',pos:'verb',def:'To publicly recommend or support a course of action.',example:'She advocates for stronger environmental protections at every summit.',points:14},
  {word:'AFFIRMATION',phonetic:'/ ˌæf.əˈmeɪ.ʃən/',pos:'noun',def:'The action of confirming something to be true; emotional support.',example:'Daily affirmations helped rebuild her confidence after the setback.',points:19},
  {word:'AGGRESSION',phonetic:'/ əˈɡreʃ.ən/',pos:'noun',def:'Hostile or violent behavior; forcefulness.',example:'The unprovoked aggression of the invading force shocked the world.',points:12},
  {word:'AGITATE',phonetic:'/ ˈædʒ.ɪ.teɪt/',pos:'verb',def:'To campaign for social or political change; to disturb.',example:'Activists agitated for reform throughout the decade.',points:8},
  {word:'ALLEGIANCE',phonetic:'/ əˈliː.dʒəns/',pos:'noun',def:'Loyalty or commitment to a person, group, or cause.',example:'The soldiers swore allegiance to their country and its constitution.',points:13},
  {word:'ALLUDE',phonetic:'/ əˈluːd/',pos:'verb',def:'To suggest or call attention to indirectly.',example:'The speaker alluded to recent scandals without naming anyone directly.',points:7},
  {word:'ALTERCATION',phonetic:'/ ˌɒl.təˈkeɪ.ʃən/',pos:'noun',def:'A noisy argument or disagreement.',example:'A brief altercation between the two drivers held up traffic.',points:13},
  {word:'AMASS',phonetic:'/ əˈmæs/',pos:'verb',def:'To gather together or accumulate a large amount.',example:'Over decades, he amassed a remarkable collection of rare books.',points:7},
  {word:'AMBIANCE',phonetic:'/ ˈæm.bi.əns/',pos:'noun',def:'The character and atmosphere of a place.',example:'The restaurant\'s warm ambiance made it perfect for a romantic evening.',points:14},
  {word:'AMEND',phonetic:'/ əˈmend/',pos:'verb',def:'To make minor changes to improve a text or law.',example:'Parliament voted to amend the constitution for the first time in decades.',points:8},
  {word:'AMPLE',phonetic:'/ ˈæm.pəl/',pos:'adjective',def:'Enough or more than enough; plentiful.',example:'There was ample time to finish the exam before the bell rang.',points:9},
  {word:'ANTAGONISM',phonetic:'/ ænˈtæɡ.ə.nɪ.z(ə)m/',pos:'noun',def:'Active hostility or opposition.',example:'Long-standing antagonism between the two tribes made peace difficult.',points:13},
  {word:'APPALL',phonetic:'/ əˈpɔːl/',pos:'verb',def:'To greatly dismay or horrify someone.',example:'The conditions in the factory appalled the health inspector.',points:10},
  {word:'APPARENT',phonetic:'/ əˈpær.ənt/',pos:'adjective',def:'Clearly visible or understood; seeming real.',example:'It was apparent from her expression that something had gone wrong.',points:12},
  {word:'APPREHEND',phonetic:'/ ˌæp.rɪˈhend/',pos:'verb',def:'To arrest someone; to understand the meaning of something.',example:'Police moved quickly to apprehend the suspect near the scene.',points:17},
  {word:'APPROPRIATE',phonetic:'/ əˈprəʊ.pri.eɪt/',pos:'adjective',def:'Suitable or proper in the circumstances.',example:'It is not appropriate to use informal language in a formal report.',points:17},
  {word:'ARDENT',phonetic:'/ ˈɑː.dənt/',pos:'adjective',def:'Very enthusiastic or passionate.',example:'She was an ardent supporter of universal access to education.',points:7},
  {word:'ARTICULATION',phonetic:'/ ɑːˌtɪk.jʊˈleɪ.ʃən/',pos:'noun',def:'The action of expressing something clearly.',example:'Clear articulation of the problem is the first step toward solving it.',points:14},
  {word:'ASPIRATION',phonetic:'/ ˌæs.pɪˈreɪ.ʃən/',pos:'noun',def:'A hope or ambition for the future.',example:'Her aspiration to become a doctor drove her to study relentlessly.',points:12},
  {word:'ASSERT',phonetic:'/ əˈsɜːt/',pos:'verb',def:'To state a fact or belief confidently.',example:'He asserted his innocence despite the mounting evidence against him.',points:6},
  {word:'ASSESSMENT',phonetic:'/ əˈses.mənt/',pos:'noun',def:'The action of evaluating someone or something.',example:'A thorough assessment of the damage was completed within days.',points:12},
  {word:'ATTENTIVE',phonetic:'/ əˈten.tɪv/',pos:'adjective',def:'Paying close attention; considerate of the needs of others.',example:'An attentive listener, she rarely interrupted and always responded thoughtfully.',points:12},
  {word:'ATTRIBUTE',phonetic:'/ əˈtrɪb.juːt/',pos:'verb',def:'To regard something as being caused by a person or thing.',example:'Experts attribute the rise in costs to increased global demand.',points:11},
  {word:'AVID',phonetic:'/ ˈæv.ɪd/',pos:'adjective',def:'Having an eager desire; keenly interested.',example:'An avid reader since childhood, she had devoured thousands of books.',points:8},
  {word:'BACKLASH',phonetic:'/ ˈbæk.læʃ/',pos:'noun',def:'A strong negative reaction by a group of people.',example:'The new law triggered an immediate backlash from civil rights groups.',points:19},
  {word:'BEACON',phonetic:'/ ˈbiː.kən/',pos:'noun',def:'A guiding light; something that gives hope or direction.',example:'The school served as a beacon of hope in the impoverished community.',points:10},
  {word:'BELIE',phonetic:'/ bɪˈlaɪ/',pos:'verb',def:'To fail to give a true impression of something.',example:'Her calm expression belied the anxiety she felt inside.',points:7},
  {word:'BENEFACTOR',phonetic:'/ ˈben.ɪ.fæk.tər/',pos:'noun',def:'A person who gives money or other help to a person or cause.',example:'An anonymous benefactor donated enough to rebuild the school.',points:17},
  {word:'BLIGHT',phonetic:'/ blaɪt/',pos:'noun',def:'A thing that spoils or damages something; a disease.',example:'Unemployment was described as a blight on the entire generation.',points:12},
  {word:'BOURGEOIS',phonetic:'/ ˈbʊər.ʒwɑː/',pos:'adjective',def:'Relating to the middle class; preoccupied with respectability.',example:'Critics accused the film of promoting a bourgeois worldview.',points:12},
  {word:'BRAZEN',phonetic:'/ ˈbreɪ.zən/',pos:'adjective',def:'Bold and without shame; impudent.',example:'The thief made a brazen escape in broad daylight.',points:17},
  {word:'BRISK',phonetic:'/ brɪsk/',pos:'adjective',def:'Active and energetic; quick and businesslike.',example:'She set a brisk pace that left the others struggling to keep up.',points:11},
  {word:'BUREAUCRACY',phonetic:'/ bjʊˈrɒk.rə.si/',pos:'noun',def:'A system of government with many complicated rules and processes.',example:'Navigating the bureaucracy required patience and persistence.',points:20},
  {word:'CANDOR',phonetic:'/ ˈkæn.dər/',pos:'noun',def:'The quality of being open and honest in expression.',example:'His candor about the project\'s failures earned him unexpected respect.',points:9},
  {word:'CENSORSHIP',phonetic:'/ ˈsen.sə.ʃɪp/',pos:'noun',def:'The suppression of speech or public communication.',example:'Journalists protested the government\'s growing use of censorship.',points:17},
  {word:'CHARISMA',phonetic:'/ kəˈrɪz.mə/',pos:'noun',def:'Compelling attractiveness or charm that inspires devotion.',example:'His natural charisma made him a magnet for followers.',points:15},
  {word:'CIRCUMSTANTIAL',phonetic:'/ ˌsɜː.kəmˈstæn.ʃəl/',pos:'adjective',def:'Based on inference, not direct evidence.',example:'The prosecution\'s case relied entirely on circumstantial evidence.',points:20},
  {word:'CIVIC',phonetic:'/ ˈsɪv.ɪk/',pos:'adjective',def:'Relating to a city or citizens; relating to citizenship.',example:'Voting is a fundamental civic duty in any democracy.',points:12},
  {word:'CLARIFY',phonetic:'/ ˈklær.ɪ.faɪ/',pos:'verb',def:'To make a statement easier to understand.',example:'The minister was asked to clarify his position on the new policy.',points:15},
  {word:'COGNITIVE',phonetic:'/ ˈkɒɡ.nɪ.tɪv/',pos:'adjective',def:'Relating to the mental processes of thought and understanding.',example:'The study examined the cognitive effects of sleep deprivation.',points:15},
  {word:'COHERENT',phonetic:'/ kəʊˈhɪər.ənt/',pos:'adjective',def:'Logical and consistent; forming a unified whole.',example:'The report was coherent and well-argued throughout.',points:13},
  {word:'COLLABORATE',phonetic:'/ kəˈlæb.ə.reɪt/',pos:'verb',def:'To work jointly with others on an activity.',example:'The two universities collaborated on a landmark cancer research project.',points:15},
  {word:'COMMEMORATE',phonetic:'/ kəˈmem.ə.reɪt/',pos:'verb',def:'To recall and show respect for someone in a ceremony.',example:'The monument was built to commemorate those who died in the conflict.',points:19},
  {word:'COMMODIFY',phonetic:'/ kəˈmɒd.ɪ.faɪ/',pos:'verb',def:'To treat something as a mere commodity.',example:'Critics argued that the app commodified personal relationships.',points:22},
  {word:'COMMUNAL',phonetic:'/ ˈkɒm.jʊ.nəl/',pos:'adjective',def:'Shared by all members of a community; of common use.',example:'The communal garden was maintained by residents on a rota basis.',points:14},
  {word:'COMPASSION',phonetic:'/ kəmˈpæʃ.ən/',pos:'noun',def:'Sympathetic concern for the sufferings of others.',example:'The nurse showed remarkable compassion toward every patient.',points:16},
  {word:'COMPETENT',phonetic:'/ ˈkɒm.pɪ.tənt/',pos:'adjective',def:'Having the necessary ability or knowledge to do something.',example:'She proved to be a highly competent manager under pressure.',points:15},
  {word:'COMPLACENCY',phonetic:'/ kəmˈpleɪ.sən.si/',pos:'noun',def:'A feeling of smug or uncritical satisfaction with oneself.',example:'Complacency among the leading team allowed their rivals to catch up.',points:24},
  {word:'COMPREHENSIVE',phonetic:'/ ˌkɒm.prɪˈhen.sɪv/',pos:'adjective',def:'Including or dealing with all aspects; thorough.',example:'The government published a comprehensive plan to tackle homelessness.',points:25},
  {word:'CONCUR',phonetic:'/ kənˈkɜːr/',pos:'verb',def:'To agree; to happen at the same time.',example:'The panel concurred that further investigation was necessary.',points:10},
  {word:'CONDEMNATION',phonetic:'/ ˌkɒn.demˈneɪ.ʃən/',pos:'noun',def:'The expression of very strong disapproval.',example:'The attack drew immediate condemnation from leaders worldwide.',points:17},
  {word:'CONDUCIVE',phonetic:'/ kənˈdjuː.sɪv/',pos:'adjective',def:'Making a certain situation or outcome likely.',example:'A quiet environment is far more conducive to productive study.',points:17},
  {word:'CONGENIAL',phonetic:'/ kənˈdʒiː.ni.əl/',pos:'adjective',def:'Pleasant because of a personality that suits one\'s own.',example:'He found the small team congenial and quickly settled in.',points:12},
  {word:'CONJECTURE',phonetic:'/ kənˈdʒek.tʃər/',pos:'noun',def:'An opinion formed without sufficient proof.',example:'The cause of the fire remained a matter of conjecture.',points:21},
  {word:'CONNOTATION',phonetic:'/ ˌkɒn.əˈteɪ.ʃən/',pos:'noun',def:'An idea or feeling that a word evokes beyond its literal meaning.',example:'The word home carries warm connotations of safety and belonging.',points:13},
  {word:'CONSCIENTIOUS',phonetic:'/ ˌkɒn.ʃiˈen.ʃəs/',pos:'adjective',def:'Wishing to do one\'s work well; thorough.',example:'The conscientious student double-checked every answer before submitting.',points:17},
  {word:'CONSENSUS',phonetic:'/ kənˈsen.səs/',pos:'noun',def:'General agreement among a group of people.',example:'After hours of debate the committee reached a consensus.',points:11},
  {word:'CONSPIRE',phonetic:'/ kənˈspaɪər/',pos:'verb',def:'To make secret plans jointly to commit an unlawful act.',example:'Three officials conspired to falsify the election results.',points:12},
  {word:'CONTEMPLATE',phonetic:'/ ˈkɒn.tem.pleɪt/',pos:'verb',def:'To look at thoughtfully; to think deeply about.',example:'She sat quietly and contemplated her next move.',points:17},
  {word:'CONTEND',phonetic:'/ kənˈtend/',pos:'verb',def:'To struggle to deal with; to assert something.',example:'Lawyers contended that the evidence had been improperly obtained.',points:10},
  {word:'CONTRADICT',phonetic:'/ ˌkɒn.trəˈdɪkt/',pos:'verb',def:'To deny the truth of a statement made by someone.',example:'His actions directly contradicted his earlier promises.',points:15},
  {word:'CONTRIBUTE',phonetic:'/ kənˈtrɪb.juːt/',pos:'verb',def:'To give something in order to help achieve a result.',example:'Every member of the team contributed to the project\'s success.',points:14},
  {word:'CONVENE',phonetic:'/ kənˈviːn/',pos:'verb',def:'To come together for a meeting or activity.',example:'The board convened an emergency session to address the crisis.',points:12},
  {word:'CONVICTION',phonetic:'/ kənˈvɪk.ʃən/',pos:'noun',def:'A firmly held belief; a formal declaration of guilt.',example:'She spoke with great conviction about the need for reform.',points:17},
  {word:'COOPERATE',phonetic:'/ kəʊˈɒp.ər.eɪt/',pos:'verb',def:'To work together toward a shared goal.',example:'Both nations agreed to cooperate on reducing carbon emissions.',points:13},
  {word:'CREDIBILITY',phonetic:'/ ˌkred.ɪˈbɪl.ɪ.ti/',pos:'noun',def:'The quality of being trusted and believed.',example:'The scandal severely damaged the organization\'s credibility.',points:19},
  {word:'CRITERIA',phonetic:'/ kraɪˈtɪər.i.ə/',pos:'noun',def:'Principles or standards for judging something.',example:'All candidates must meet specific criteria to qualify.',points:10},
  {word:'CULTIVATE',phonetic:'/ ˈkʌl.tɪ.veɪt/',pos:'verb',def:'To prepare land for crops; to develop a skill or relationship.',example:'She cultivated a reputation for fairness over many years.',points:14},
  {word:'CUMULATIVE',phonetic:'/ ˈkjuː.mjʊ.lə.tɪv/',pos:'adjective',def:'Increasing by successive additions; building up.',example:'The cumulative effect of small daily habits can be transformative.',points:17},
  {word:'CYNICISM',phonetic:'/ ˈsɪn.ɪ.sɪ.z(ə)m/',pos:'noun',def:'An inclination to believe people are motivated by self-interest.',example:'Years of disappointment had filled him with deep cynicism.',points:17},
  {word:'DECORUM',phonetic:'/ dɪˈkɔː.rəm/',pos:'noun',def:'Behavior in keeping with good taste and propriety.',example:'The judges expected all participants to maintain proper decorum.',points:12},
  {word:'DEDUCE',phonetic:'/ dɪˈdjuːs/',pos:'verb',def:'To arrive at a conclusion using reasoning from evidence.',example:'From the clues provided, she was able to deduce the answer.',points:10},
  {word:'DEFICIENCY',phonetic:'/ dɪˈfɪʃ.ən.si/',pos:'noun',def:'A lack or shortage; a failing or shortcoming.',example:'A vitamin D deficiency can lead to serious health complications.',points:21},
  {word:'DEFINITIVE',phonetic:'/ dɪˈfɪn.ɪ.tɪv/',pos:'adjective',def:'Most reliable or authoritative; final.',example:'This biography is considered the definitive account of her life.',points:17},
  {word:'DEGENERATE',phonetic:'/ dɪˈdʒen.ər.eɪt/',pos:'verb',def:'To decline or deteriorate physically or morally.',example:'Without proper maintenance, the building quickly degenerated.',points:12},
  {word:'DELEGATE',phonetic:'/ ˈdel.ɪ.ɡeɪt/',pos:'verb',def:'To entrust a task to another person.',example:'A good manager knows when to delegate and when to act directly.',points:10},
  {word:'DELIBERATION',phonetic:'/ dɪˌlɪb.əˈreɪ.ʃən/',pos:'noun',def:'Long and careful consideration or discussion.',example:'After much deliberation, the jury returned a unanimous verdict.',points:15},
  {word:'DEMEANOR',phonetic:'/ dɪˈmiː.nər/',pos:'noun',def:'Outward behavior or bearing.',example:'His calm demeanor during the crisis reassured everyone around him.',points:11},
  {word:'DEMOCRACY',phonetic:'/ dɪˈmɒk.rə.si/',pos:'noun',def:'A system of government by the whole population.',example:'Protecting free elections is essential to any functioning democracy.',points:19},
  {word:'DEMOGRAPHICS',phonetic:'/ ˌdem.əˈɡræf.ɪks/',pos:'noun',def:'Statistical data relating to a population.',example:'The campaign targeted key demographics through tailored messaging.',points:23},
  {word:'DEPLETE',phonetic:'/ dɪˈpliːt/',pos:'verb',def:'To reduce severely in quantity, quality, or force.',example:'Years of overfishing have depleted many marine species.',points:10},
  {word:'DERIVE',phonetic:'/ dɪˈraɪv/',pos:'verb',def:'To obtain something from a specified source.',example:'He derived great satisfaction from helping others succeed.',points:10},
  {word:'DETERIORATE',phonetic:'/ dɪˈtɪər.i.ə.reɪt/',pos:'verb',def:'To become progressively worse.',example:'Relations between the two countries deteriorated rapidly.',points:12},
  {word:'DETRACT',phonetic:'/ dɪˈtrækt/',pos:'verb',def:'To diminish the worth or value of something.',example:'A single grammatical error should not detract from an otherwise strong essay.',points:10},
  {word:'DEVIATE',phonetic:'/ ˈdiː.vi.eɪt/',pos:'verb',def:'To depart from an established course or norm.',example:'The pilot was forced to deviate from the planned route due to weather.',points:11},
  {word:'DIMINISH',phonetic:'/ dɪˈmɪn.ɪʃ/',pos:'verb',def:'To make or become less.',example:'Nothing could diminish her determination to succeed.',points:14},
  {word:'DISCREPANCY',phonetic:'/ dɪˈskrep.ən.si/',pos:'noun',def:'A lack of compatibility between facts or figures.',example:'Auditors found a significant discrepancy in the financial accounts.',points:21},
  {word:'DISCRIMINATE',phonetic:'/ dɪˈskrɪm.ɪ.neɪt/',pos:'verb',def:'To make an unjust distinction in treatment; to recognize a distinction.',example:'It is illegal to discriminate against employees on the basis of age.',points:17},
  {word:'DISMANTLE',phonetic:'/ dɪsˈmæn.tl/',pos:'verb',def:'To take apart piece by piece; to put an end to a system.',example:'Campaigners demanded that the apartheid system be dismantled.',points:12},
  {word:'DISPEL',phonetic:'/ dɪˈspel/',pos:'verb',def:'To make something go away or disappear.',example:'The results helped dispel long-standing myths about diet and health.',points:9},
  {word:'DISPROPORTIONATE',phonetic:'/ ˌdɪs.prəˈpɔː.ʃən.ɪt/',pos:'adjective',def:'Too large or too small in comparison with something else.',example:'The penalty seemed disproportionate to the minor offence committed.',points:21},
  {word:'DISRUPT',phonetic:'/ dɪsˈrʌpt/',pos:'verb',def:'To interrupt or disturb the normal course of something.',example:'The strike threatened to disrupt travel across the country.',points:10},
  {word:'DISTINCTION',phonetic:'/ dɪˈstɪŋk.ʃən/',pos:'noun',def:'A difference between similar things; excellence.',example:'She graduated with distinction from one of the country\'s top universities.',points:14},
  {word:'DIVERSE',phonetic:'/ daɪˈvɜːs/',pos:'adjective',def:'Showing a great deal of variety; very different.',example:'The city is home to a diverse mix of cultures and traditions.',points:11},
  {word:'DOCTRINE',phonetic:'/ ˈdɒk.trɪn/',pos:'noun',def:'A set of beliefs or principles held by an organization.',example:'The doctrine of free speech is central to democratic societies.',points:11},
  {word:'DOMINATE',phonetic:'/ ˈdɒm.ɪ.neɪt/',pos:'verb',def:'To have the most important or powerful position.',example:'For decades, a single company dominated the global market.',points:11},
  {word:'DYNAMIC',phonetic:'/ daɪˈnæm.ɪk/',pos:'adjective',def:'Characterized by constant change and activity; energetic.',example:'The dynamic start-up adapted quickly to every market shift.',points:15},
  {word:'ELABORATE',phonetic:'/ ɪˈlæb.ər.ɪt/',pos:'adjective',def:'Involving many carefully arranged parts; detailed.',example:'The elaborate plan involved dozens of people working in secret.',points:11},
  {word:'ELICIT',phonetic:'/ ɪˈlɪs.ɪt/',pos:'verb',def:'To draw out a response or information.',example:'The counselor used gentle questions to elicit the child\'s feelings.',points:8},
  {word:'EMINENT',phonetic:'/ ˈem.ɪ.nənt/',pos:'adjective',def:'Famous and respected, especially in a profession.',example:'An eminent surgeon was flown in to perform the complex operation.',points:9},
  {word:'EMPATHY',phonetic:'/ ˈem.pə.θi/',pos:'noun',def:'The ability to understand and share the feelings of another.',example:'Good teachers show genuine empathy toward their students.',points:17},
  {word:'EMPIRICAL',phonetic:'/ emˈpɪr.ɪ.kəl/',pos:'adjective',def:'Based on observation or experience rather than theory.',example:'The study produced empirical evidence supporting the new hypothesis.',points:15},
  {word:'ENRICH',phonetic:'/ ɪnˈrɪtʃ/',pos:'verb',def:'To improve or enhance the quality or value of.',example:'Travel abroad enriched her understanding of different cultures.',points:11},
  {word:'ERODE',phonetic:'/ ɪˈrəʊd/',pos:'verb',def:'To gradually destroy or be destroyed by natural forces.',example:'Trust in the institution had slowly eroded over many years.',points:6},
  {word:'ESCALATE',phonetic:'/ ˈes.kə.leɪt/',pos:'verb',def:'To increase rapidly; to become more intense.',example:'What began as a disagreement quickly escalated into a full dispute.',points:10},
  {word:'ETHICAL',phonetic:'/ ˈeθ.ɪ.kəl/',pos:'adjective',def:'Relating to moral principles; morally correct.',example:'The board faced an ethical dilemma with no easy solution.',points:12},
  {word:'EVALUATE',phonetic:'/ ɪˈvæl.ju.eɪt/',pos:'verb',def:'To assess or judge the value or quality of.',example:'Students were asked to evaluate the arguments presented in the essay.',points:11},
  {word:'EXAGGERATE',phonetic:'/ ɪɡˈzædʒ.ər.eɪt/',pos:'verb',def:'To represent something as greater than it really is.',example:'He tended to exaggerate his achievements when meeting new people.',points:19},
  {word:'EXCLUDE',phonetic:'/ ɪkˈskluːd/',pos:'verb',def:'To deny access to; to leave out.',example:'The selection criteria effectively excluded applicants without degrees.',points:17},
  {word:'EXERT',phonetic:'/ ɪɡˈzɜːt/',pos:'verb',def:'To apply a force or influence; to make a great effort.',example:'She exerted enormous effort to finish the project on time.',points:12},
  {word:'EXHAUST',phonetic:'/ ɪɡˈzɔːst/',pos:'verb',def:'To tire out completely; to use up entirely.',example:'The long negotiation exhausted both sides.',points:17},
  {word:'EXHIBIT',phonetic:'/ ɪɡˈzɪb.ɪt/',pos:'verb',def:'To display publicly; to show a quality or feeling.',example:'The patient began to exhibit symptoms two days after exposure.',points:19},
  {word:'EXPLOIT',phonetic:'/ ɪkˈsplɔɪt/',pos:'verb',def:'To make use of unfairly for one\'s own advantage.',example:'The documentary exposed how corporations exploit cheap labor overseas.',points:16},
  {word:'FACILITATE',phonetic:'/ fəˈsɪl.ɪ.teɪt/',pos:'verb',def:'To make an action or process easier.',example:'The new software will facilitate faster communication between teams.',points:15},
  {word:'FEASIBLE',phonetic:'/ ˈfiː.zɪ.bəl/',pos:'adjective',def:'Possible and practical to achieve.',example:'The engineers assessed whether the plan was technically feasible.',points:13},
  {word:'FIDELITY',phonetic:'/ fɪˈdel.ɪ.ti/',pos:'noun',def:'Faithfulness to a person, cause, or belief; accuracy.',example:'She admired his fidelity to the principles he had always championed.',points:15},
  {word:'FLUCTUATE',phonetic:'/ ˈflʌk.tʃu.eɪt/',pos:'verb',def:'To rise and fall irregularly in number or amount.',example:'Share prices fluctuated wildly throughout the volatile trading session.',points:14},
  {word:'FORMULATE',phonetic:'/ ˈfɔː.mjʊ.leɪt/',pos:'verb',def:'To create or develop a plan or idea methodically.',example:'The team spent weeks formulating a strategy to address the problem.',points:14},
  {word:'FOSTER',phonetic:'/ ˈfɒs.tər/',pos:'verb',def:'To encourage the development of something.',example:'The program was designed to foster creativity among young learners.',points:9},
  {word:'FRAGILE',phonetic:'/ ˈfrædʒ.aɪl/',pos:'adjective',def:'Easily broken or damaged; delicate.',example:'The peace agreement was fragile and could collapse at any time.',points:11},
  {word:'FUNDAMENTAL',phonetic:'/ ˌfʌn.dəˈmen.tl/',pos:'adjective',def:'Forming the necessary base or core; essential.',example:'Access to clean water is a fundamental human right.',points:17},
  {word:'GENERATE',phonetic:'/ ˈdʒen.ər.eɪt/',pos:'verb',def:'To produce or create something.',example:'The new initiative generated significant interest from investors.',points:9},
  {word:'GENUINE',phonetic:'/ ˈdʒen.ju.ɪn/',pos:'adjective',def:'Truly what it is said to be; authentic.',example:'Her concern for the community appeared entirely genuine.',points:8},
  {word:'GLOBALIZATION',phonetic:'/ ˌɡləʊ.bəl.aɪˈzeɪ.ʃən/',pos:'noun',def:'The process of international integration of economies and cultures.',example:'Globalization has transformed patterns of trade and communication.',points:25},
  {word:'GOVERN',phonetic:'/ ˈɡʌv.ən/',pos:'verb',def:'To conduct the policy and affairs of a country.',example:'Elected officials are accountable to those they govern.',points:10},
  {word:'HIERARCHY',phonetic:'/ ˈhaɪ.ər.ɑː.ki/',pos:'noun',def:'A system ranked according to status or authority.',example:'The rigid hierarchy in the organization stifled innovation.',points:20},
  {word:'HIGHLIGHT',phonetic:'/ ˈhaɪ.laɪt/',pos:'verb',def:'To draw attention to something; to emphasize.',example:'The report highlighted several areas where improvement was urgently needed.',points:20},
  {word:'IMPLEMENT',phonetic:'/ ˈɪm.plɪ.ment/',pos:'verb',def:'To put a decision or plan into effect.',example:'The new safety regulations will be implemented from next month.',points:15},
  {word:'IMPLICATIONS',phonetic:'/ ˌɪm.plɪˈkeɪ.ʃənz/',pos:'noun',def:'The likely consequences of something.',example:'The implications of the new law for small businesses were unclear.',points:18},
  {word:'INCENTIVE',phonetic:'/ ɪnˈsen.tɪv/',pos:'noun',def:'A thing that motivates someone to do something.',example:'The company offered financial incentives to attract top graduates.',points:14},
  {word:'INCLUSIVE',phonetic:'/ ɪnˈkluː.sɪv/',pos:'adjective',def:'Not excluding any group; covering all cases.',example:'The organization adopted a more inclusive approach to recruitment.',points:14},
  {word:'INDIGENOUS',phonetic:'/ ɪnˈdɪdʒ.ɪ.nəs/',pos:'adjective',def:'Originating or occurring naturally in a particular place.',example:'The survey studied the rights of indigenous communities in the region.',points:12},
  {word:'INEQUALITY',phonetic:'/ ˌɪn.ɪˈkwɒl.ɪ.ti/',pos:'noun',def:'Difference in size, degree, or circumstances; lack of equality.',example:'Addressing income inequality remains a core political challenge.',points:22},
  {word:'INEVITABLY',phonetic:'/ ɪnˈev.ɪ.tə.bli/',pos:'adverb',def:'As is certain to happen; unavoidably.',example:'Such rapid growth will inevitably lead to environmental strain.',points:18},
  {word:'INFRASTRUCTURE',phonetic:'/ ˈɪn.frəˌstrʌk.tʃər/',pos:'noun',def:'The basic systems and services needed for a country to function.',example:'Investment in infrastructure creates jobs and stimulates growth.',points:19},
  {word:'INITIATIVE',phonetic:'/ ɪˈnɪʃ.ə.tɪv/',pos:'noun',def:'The ability to assess situations independently; a plan of action.',example:'She showed great initiative by identifying the problem before anyone else.',points:13},
  {word:'INNOVATE',phonetic:'/ ˈɪn.ə.veɪt/',pos:'verb',def:'To introduce new methods or ideas.',example:'Companies that fail to innovate risk being overtaken by competitors.',points:11},
  {word:'INSIGHTFUL',phonetic:'/ ˈɪn.saɪt.fəl/',pos:'adjective',def:'Having or showing an accurate understanding of something.',example:'Her insightful analysis uncovered trends others had missed entirely.',points:17},
  {word:'INSTITUTION',phonetic:'/ ˌɪn.stɪˈtjuː.ʃən/',pos:'noun',def:'An organization founded for a social, educational, or public purpose.',example:'The university is one of the oldest educational institutions in the country.',points:11},
  {word:'INTEGRATE',phonetic:'/ ˈɪn.tɪ.ɡreɪt/',pos:'verb',def:'To combine parts into a whole; to bring different groups together.',example:'The program aimed to integrate refugees into local communities.',points:10},
  {word:'INTERVENE',phonetic:'/ ˌɪn.təˈviːn/',pos:'verb',def:'To come between parties in a dispute to prevent harm.',example:'The international community was slow to intervene in the conflict.',points:12},
  {word:'INVESTIGATE',phonetic:'/ ɪnˈves.tɪ.ɡeɪt/',pos:'verb',def:'To carry out a systematic inquiry into something.',example:'Police were called to investigate the suspicious disappearance.',points:15},
  {word:'JUSTIFY',phonetic:'/ ˈdʒʌs.tɪ.faɪ/',pos:'verb',def:'To show or prove to be right or reasonable.',example:'She struggled to justify the decision even to herself.',points:20},
  {word:'LANDMARK',phonetic:'/ ˈlænd.mɑːk/',pos:'noun',def:'An event marking an important stage; a notable feature.',example:'The ruling was described as a landmark in the history of civil rights.',points:15},
  {word:'LEGISLATION',phonetic:'/ ˌledʒ.ɪˈsleɪ.ʃən/',pos:'noun',def:'Laws considered collectively; the process of making laws.',example:'New legislation was passed to protect consumers from fraud.',points:12},
  {word:'LEGITIMATE',phonetic:'/ lɪˈdʒɪt.ɪ.mɪt/',pos:'adjective',def:'Conforming to the law or to rules; justifiable.',example:'Workers have a legitimate right to demand safe working conditions.',points:13},
  {word:'LIBERALIZE',phonetic:'/ ˈlɪb.ər.ə.laɪz/',pos:'verb',def:'To remove or relax restrictions.',example:'The government moved to liberalize trade policies to attract investment.',points:21},
  {word:'MAGNITUDE',phonetic:'/ ˈmæɡ.nɪ.tjuːd/',pos:'noun',def:'The great size or extent of something; importance.',example:'Few had grasped the full magnitude of the economic crisis.',points:13},
  {word:'MANIFOLD',phonetic:'/ ˈmæn.ɪ.fəʊld/',pos:'adjective',def:'Many and various; having many features.',example:'The benefits of exercise are manifold and well documented.',points:14},
  {word:'MARGINALIZE',phonetic:'/ ˈmɑː.dʒɪ.nə.laɪz/',pos:'verb',def:'To treat as unimportant or powerless.',example:'The policy inadvertently marginalized those most in need of support.',points:23},
  {word:'MEDIATE',phonetic:'/ ˈmiː.di.eɪt/',pos:'verb',def:'To intervene in a dispute to bring about agreement.',example:'A neutral third party was brought in to mediate between the two sides.',points:10},
  {word:'MERIT',phonetic:'/ ˈmer.ɪt/',pos:'noun',def:'The quality of being good and deserving praise.',example:'Promotion should be based solely on merit and performance.',points:7},
  {word:'METHODOLOGY',phonetic:'/ ˌmeθ.əˈdɒl.ə.dʒi/',pos:'noun',def:'A system of methods used in a field.',example:'The research methodology was rigorous and clearly documented.',points:21},
  {word:'MISCONCEPTION',phonetic:'/ ˌmɪs.kənˈsep.ʃən/',pos:'noun',def:'A view or opinion that is incorrect because of faulty reasoning.',example:'There is a common misconception that all fats are unhealthy.',points:21},
  {word:'MOBILIZE',phonetic:'/ ˈməʊ.bɪ.laɪz/',pos:'verb',def:'To prepare and organize troops or people for action.',example:'The charity mobilized thousands of volunteers after the earthquake.',points:21},
  {word:'MODERATE',phonetic:'/ ˈmɒd.ər.ɪt/',pos:'adjective',def:'Average in amount, intensity, or degree; not extreme.',example:'A moderate approach to the issue found support across party lines.',points:11},
  {word:'MOMENTUM',phonetic:'/ məˈmen.təm/',pos:'noun',def:'The force gained by movement; the impetus of a cause.',example:'The campaign gathered momentum after the first televised debate.',points:14},
  {word:'MOTIVATE',phonetic:'/ ˈməʊ.tɪ.veɪt/',pos:'verb',def:'To provide a reason for doing something; to inspire.',example:'A great teacher can motivate students to exceed their own expectations.',points:13},
  {word:'MUTUAL',phonetic:'/ ˈmjuː.tʃu.əl/',pos:'adjective',def:'Experienced or done by both parties; shared.',example:'The agreement was based on mutual respect and shared interests.',points:8},
  {word:'NARRATIVE',phonetic:'/ ˈnær.ə.tɪv/',pos:'noun',def:'A spoken or written account of connected events; a story.',example:'The political narrative shifted dramatically after the election.',points:12},
  {word:'NEGOTIATE',phonetic:'/ nɪˈɡəʊ.ʃi.eɪt/',pos:'verb',def:'To obtain or bring about by discussion.',example:'Both parties agreed to negotiate the terms of the new contract.',points:10},
  {word:'NEUTRAL',phonetic:'/ ˈnjuː.trəl/',pos:'adjective',def:'Not taking sides in a conflict; impartial.',example:'Switzerland has maintained a neutral stance in international conflicts.',points:7},
  {word:'NOTION',phonetic:'/ ˈnəʊ.ʃən/',pos:'noun',def:'A concept or belief held by a person.',example:'The notion that success comes easily is a dangerous illusion.',points:6},
  {word:'OBJECTIVE',phonetic:'/ əbˈdʒek.tɪv/',pos:'adjective',def:'Not influenced by personal feelings; impartial.',example:'An objective assessment of the risks is essential before proceeding.',points:23},
  {word:'OBLIGATION',phonetic:'/ ˌɒb.lɪˈɡeɪ.ʃən/',pos:'noun',def:'An act or course of action to which a person is morally bound.',example:'Parents have a legal and moral obligation to educate their children.',points:13},
  {word:'OBSOLETE',phonetic:'/ ˌɒb.səˈliːt/',pos:'adjective',def:'No longer in use; out of date.',example:'The technology became obsolete within just a few years of its release.',points:10},
  {word:'OBTAIN',phonetic:'/ əbˈteɪn/',pos:'verb',def:'To get something, especially by making an effort.',example:'She worked hard to obtain the qualifications needed for the role.',points:8},
  {word:'OPPOSITION',phonetic:'/ ˌɒp.əˈzɪʃ.ən/',pos:'noun',def:'Resistance or dissent; a group of opponents.',example:'The proposal faced fierce opposition from environmental groups.',points:14},
  {word:'OPTIMISTIC',phonetic:'/ ˌɒp.tɪˈmɪs.tɪk/',pos:'adjective',def:'Hopeful and confident about the future.',example:'Despite the setbacks, she remained optimistic about the outcome.',points:16},
  {word:'OVERSHADOW',phonetic:'/ ˌəʊ.vəˈʃæd.əʊ/',pos:'verb',def:'To cast a shadow over; to make seem less important.',example:'The scandal overshadowed what had been a successful first term.',points:20},
  {word:'PHENOMENON',phonetic:'/ fɪˈnɒm.ɪ.nən/',pos:'noun',def:'A remarkable or exceptional thing; an observable event.',example:'Social media is a relatively recent cultural phenomenon.',points:17},
  {word:'PINPOINT',phonetic:'/ ˈpɪn.pɔɪnt/',pos:'verb',def:'To identify precisely.',example:'Scientists were finally able to pinpoint the cause of the illness.',points:12},
  {word:'PLEAD',phonetic:'/ pliːd/',pos:'verb',def:'To make an earnest appeal; to formally state guilt or innocence.',example:'She pleaded with the authorities to release her brother.',points:8},
  {word:'PLEDGE',phonetic:'/ pledʒ/',pos:'verb',def:'To commit by a solemn promise.',example:'All candidates pledged to uphold the values of the organization.',points:10},
  {word:'PLENTIFUL',phonetic:'/ ˈplen.tɪ.fəl/',pos:'adjective',def:'Existing in or yielding great quantities; abundant.',example:'Food was plentiful during the harvest season.',points:14},
  {word:'POLARIZATION',phonetic:'/ ˌpəʊ.lər.aɪˈzeɪ.ʃən/',pos:'noun',def:'Division into two sharply contrasting groups or sets of opinions.',example:'Political polarization made compromise virtually impossible.',points:23},
  {word:'POSTULATE',phonetic:'/ ˈpɒs.tʃʊ.leɪt/',pos:'verb',def:'To suggest or assume the existence of something as a basis for reasoning.',example:'The scientist postulated a link between the two variables.',points:11},
  {word:'PRECEDE',phonetic:'/ prɪˈsiːd/',pos:'verb',def:'To come before something in time, order, or position.',example:'A brief introduction will precede the main presentation.',points:12},
  {word:'PREMISE',phonetic:'/ ˈprem.ɪs/',pos:'noun',def:'A previous statement from which another is inferred.',example:'The entire argument rests on a faulty premise.',points:11},
  {word:'PREVALENT',phonetic:'/ ˈprev.ə.lənt/',pos:'adjective',def:'Widespread in a particular area at a particular time.',example:'Misinformation became increasingly prevalent on social media platforms.',points:14},
  {word:'PRIORITIZE',phonetic:'/ praɪˈɒr.ɪ.taɪz/',pos:'verb',def:'To designate as most important; to deal with first.',example:'Managers must learn to prioritize tasks effectively under pressure.',points:21},
  {word:'PROPONENT',phonetic:'/ prəˈpəʊ.nənt/',pos:'noun',def:'A person who supports a theory, proposal, or course of action.',example:'She was a vocal proponent of universal basic income.',points:13},
  {word:'PROSPERITY',phonetic:'/ prɒˈsper.ɪ.ti/',pos:'noun',def:'The state of being successful, especially financially.',example:'Economic prosperity depends on stable governance and strong institutions.',points:17},
  {word:'PROVOKE',phonetic:'/ prəˈvəʊk/',pos:'verb',def:'To stimulate a reaction; to deliberately annoy.',example:'His comments provoked an immediate and angry response.',points:16},
  {word:'PURSUE',phonetic:'/ pəˈsjuː/',pos:'verb',def:'To follow in order to catch; to continue along a path.',example:'She decided to pursue a career in medicine after volunteering abroad.',points:8},
  {word:'RATIONAL',phonetic:'/ ˈræʃ.ən.əl/',pos:'adjective',def:'Based on logic or reason; sensible.',example:'A rational approach to the problem led to a workable solution.',points:8},
  {word:'REINFORCE',phonetic:'/ ˌriː.ɪnˈfɔːs/',pos:'verb',def:'To strengthen or support; to add to the existing force.',example:'Regular revision reinforces learning and aids long-term retention.',points:14},
  {word:'RELEVANCE',phonetic:'/ ˈrel.ɪ.vəns/',pos:'noun',def:'The quality of being closely connected to the subject.',example:'Students questioned the relevance of the assignment to their course.',points:14},
  {word:'RELUCTANT',phonetic:'/ rɪˈlʌk.tənt/',pos:'adjective',def:'Unwilling and hesitant; disinclined.',example:'He was reluctant to accept help even when he clearly needed it.',points:11},
  {word:'REMEDY',phonetic:'/ ˈrem.ɪ.di/',pos:'noun',def:'A solution to a problem; a treatment for illness.',example:'The committee proposed several remedies to the housing shortage.',points:12},
  {word:'REPRESENTATION',phonetic:'/ ˌrep.rɪ.zenˈteɪ.ʃən/',pos:'noun',def:'The action of standing in for someone; a depiction.',example:'Better representation of women in leadership is long overdue.',points:16},
  {word:'RESILIENCE',phonetic:'/ rɪˈzɪl.i.əns/',pos:'noun',def:'The capacity to recover quickly from difficulties.',example:'The resilience of the community after the floods was remarkable.',points:12},
  {word:'RESOLVE',phonetic:'/ rɪˈzɒlv/',pos:'verb',def:'To settle a dispute; to decide firmly on a course of action.',example:'Both parties worked to resolve the dispute without going to court.',points:10},
  {word:'RESOURCES',phonetic:'/ rɪˈzɔː.sɪz/',pos:'noun',def:'A stock or supply of money, materials, or other assets.',example:'The project lacked the resources needed to achieve its ambitious goals.',points:11},
  {word:'RETALIATE',phonetic:'/ rɪˈtæl.i.eɪt/',pos:'verb',def:'To make an attack in return for a similar attack.',example:'When provoked, she chose not to retaliate but to walk away.',points:9},
  {word:'SCRUTINY',phonetic:'/ ˈskruː.tɪ.ni/',pos:'noun',def:'Critical observation or examination.',example:'The company\'s finances were subjected to intense public scrutiny.',points:13},
  {word:'SEGREGATE',phonetic:'/ ˈseɡ.rɪ.ɡeɪt/',pos:'verb',def:'To set apart from the rest or from each other.',example:'Schools in the region had been racially segregated for decades.',points:11},
  {word:'SEQUENCE',phonetic:'/ ˈsiː.kwəns/',pos:'noun',def:'A particular order in which related things follow each other.',example:'The report should present findings in a logical sequence.',points:19},
  {word:'SIMULATE',phonetic:'/ ˈsɪm.jʊ.leɪt/',pos:'verb',def:'To imitate the appearance or character of something.',example:'Researchers used a computer model to simulate the earthquake\'s impact.',points:10},
  {word:'SKEPTIC',phonetic:'/ ˈskep.tɪk/',pos:'noun',def:'A person inclined to question accepted opinions.',example:'Even the biggest skeptics were convinced by the experimental results.',points:15},
  {word:'SOLIDARITY',phonetic:'/ ˌsɒl.ɪˈdær.ɪ.ti/',pos:'noun',def:'Unity and agreement of feeling or action among a group.',example:'The workers showed solidarity by refusing to cross the picket line.',points:14},
  {word:'SPECULATE',phonetic:'/ ˈspek.jʊ.leɪt/',pos:'verb',def:'To form a theory without firm evidence; to invest in risky ventures.',example:'It would be irresponsible to speculate about the cause before the inquiry.',points:13},
  {word:'STABILITY',phonetic:'/ stəˈbɪl.ɪ.ti/',pos:'noun',def:'The state of being stable; resistance to change.',example:'Political stability is essential for economic growth and development.',points:14},
  {word:'STAKEHOLDER',phonetic:'/ ˈsteɪk.həʊl.dər/',pos:'noun',def:'A person with an interest or concern in something.',example:'All stakeholders were consulted before the final decision was made.',points:19},
  {word:'STEREOTYPE',phonetic:'/ ˈster.i.ə.taɪp/',pos:'noun',def:'A widely held but oversimplified image of a person or thing.',example:'The documentary challenged harmful stereotypes about the community.',points:15},
  {word:'STIMULATE',phonetic:'/ ˈstɪm.jʊ.leɪt/',pos:'verb',def:'To encourage or arouse interest or activity.',example:'New investment was needed to stimulate growth in the rural economy.',points:11},
  {word:'SUBJECTIVE',phonetic:'/ səbˈdʒek.tɪv/',pos:'adjective',def:'Based on personal feelings rather than facts.',example:'Art criticism is inevitably subjective to some degree.',points:24},
  {word:'SUBSEQUENT',phonetic:'/ ˈsʌb.sɪ.kwənt/',pos:'adjective',def:'Coming after something in time; following.',example:'Subsequent investigations revealed far more than initially suspected.',points:21},
  {word:'SUSTAIN',phonetic:'/ səˈsteɪn/',pos:'verb',def:'To maintain for an extended period; to support.',example:'It proved difficult to sustain the high levels of growth over time.',points:7},
  {word:'SYSTEMATIC',phonetic:'/ ˌsɪs.təˈmæt.ɪk/',pos:'adjective',def:'Done according to a fixed plan; methodical.',example:'A systematic approach to revision produces the best exam results.',points:17},
  {word:'TACITURN',phonetic:'/ ˈtæs.ɪ.tɜːn/',pos:'adjective',def:'Reserved or uncommunicative in speech.',example:'The taciturn detective revealed nothing until the very last moment.',points:10},
  {word:'TANGIBLE',phonetic:'/ ˈtæn.dʒɪ.bəl/',pos:'adjective',def:'Perceptible by touch; clear and definite.',example:'The new policy produced tangible improvements within the first year.',points:11},
  {word:'THEORETICAL',phonetic:'/ ˌθɪər.iˈet.ɪ.kəl/',pos:'adjective',def:'Based on theory rather than practice; not yet proved.',example:'The idea remained theoretical until experiments confirmed its validity.',points:16},
  {word:'TOLERATE',phonetic:'/ ˈtɒl.ər.eɪt/',pos:'verb',def:'To allow something without hindrance; to endure.',example:'A healthy society must tolerate a diversity of opinions.',points:8},
  {word:'UNIVERSAL',phonetic:'/ ˌjuː.nɪˈvɜː.səl/',pos:'adjective',def:'Applicable to all cases; involving the whole world.',example:'Access to education should be a universal right.',points:12},
  {word:'VALIDATE',phonetic:'/ ˈvæl.ɪ.deɪt/',pos:'verb',def:'To check or prove the validity of something.',example:'Independent experts were asked to validate the research findings.',points:12},
  {word:'VARIABLE',phonetic:'/ ˈveər.i.ə.bəl/',pos:'noun',def:'An element that can change or be changed.',example:'Temperature is a key variable that affects the outcome of the experiment.',points:13},
  {word:'VERSATILE',phonetic:'/ ˈvɜː.sə.taɪl/',pos:'adjective',def:'Able to adapt to many different functions or activities.',example:'A versatile player, she excelled in both attack and defence.',points:12},
  {word:'VIRTUALLY',phonetic:'/ ˈvɜː.tʃu.ə.li/',pos:'adverb',def:'Nearly; almost entirely.',example:'Virtually every student passed the revised examination.',points:15},
  {word:'VULNERABILITY',phonetic:'/ ˌvʌl.nər.əˈbɪl.ɪ.ti/',pos:'noun',def:'The quality of being exposed to the possibility of harm.',example:'The report identified key areas of vulnerability in the national grid.',points:21},
  {word:'WARRANT',phonetic:'/ ˈwɒr.ənt/',pos:'verb',def:'To justify or necessitate; to officially authorize.',example:'The evidence was not sufficient to warrant a full investigation.',points:10},
  {word:'WIDESPREAD',phonetic:'/ ˈwaɪd.spred/',pos:'adjective',def:'Found or distributed over a large area.',example:'There was widespread support for the proposed changes.',points:17},
  {word:'WILLINGNESS',phonetic:'/ ˈwɪl.ɪŋ.nəs/',pos:'noun',def:'The quality of being ready to do something eagerly.',example:'Her willingness to take on extra responsibility impressed her supervisor.',points:15},
  {word:'YIELD',phonetic:'/ jiːld/',pos:'verb',def:'To produce or provide; to give way under pressure.',example:'The negotiations finally yielded a historic peace agreement.',points:9}
,
  {word:'ABJECTION',phonetic:'/ æbˈdʒek.ʃən/',pos:'noun',def:'A state of misery and degradation.',example:'The documentary depicted the abjection of life in the refugee camps.',points:20},
  {word:'ABOLISH',phonetic:'/ əˈbɒl.ɪʃ/',pos:'verb',def:'To formally put an end to a system or practice.',example:'Campaigners fought for decades to abolish the death penalty.',points:12},
  {word:'ABOMINABLE',phonetic:'/ əˈbɒm.ɪ.nə.bəl/',pos:'adjective',def:'Causing moral revulsion; very bad or unpleasant.',example:'The conditions in the prison were described as abominable.',points:16},
  {word:'ABUNDANT',phonetic:'/ əˈbʌn.dənt/',pos:'adjective',def:'Present in great quantities; more than enough.',example:'The region is abundant in natural resources yet remains poor.',points:11},
  {word:'ACCELERATE',phonetic:'/ əkˈsel.ər.eɪt/',pos:'verb',def:'To begin to move more quickly; to increase the rate of.',example:'New technology is expected to accelerate economic development.',points:14},
  {word:'ACCLAIM',phonetic:'/ əˈkleɪm/',pos:'noun',def:'Enthusiastic and public praise.',example:'Her debut novel received widespread critical acclaim.',points:13},
  {word:'ACCOMMODATE',phonetic:'/ əˈkɒm.ə.deɪt/',pos:'verb',def:'To provide a room or space for; to adapt to.',example:'The hall can accommodate up to five hundred guests.',points:20},
  {word:'ACCUMULATE',phonetic:'/ əˈkjuː.mjʊ.leɪt/',pos:'verb',def:'To gather together or acquire an increasing quantity of.',example:'Over the years he had accumulated a vast personal fortune.',points:16},
  {word:'ACQUAINT',phonetic:'/ əˈkweɪnt/',pos:'verb',def:'To make someone aware of or familiar with something.',example:'She took time to acquaint herself with the new procedures.',points:19},
  {word:'ACTIVATE',phonetic:'/ ˈæk.tɪ.veɪt/',pos:'verb',def:'To make something active or operative.',example:'A code is required to activate the software on your device.',points:13},
  {word:'ADEPT',phonetic:'/ əˈdept/',pos:'adjective',def:'Very skilled or proficient at something.',example:'She was adept at navigating complex political situations.',points:8},
  {word:'ADVERSITY',phonetic:'/ ədˈvɜː.sɪ.ti/',pos:'noun',def:'Difficulties; misfortune.',example:'He showed remarkable courage in the face of adversity.',points:16},
  {word:'AFFINITY',phonetic:'/ əˈfɪn.ɪ.ti/',pos:'noun',def:'A natural liking for and understanding of someone or something.',example:'She felt an immediate affinity with the people of the village.',points:17},
  {word:'AGGRIEVE',phonetic:'/ əˈɡriːv/',pos:'verb',def:'To feel resentment at having been treated unfairly.',example:'The aggrieved workers staged a walkout in protest.',points:13},
  {word:'ALLAY',phonetic:'/ əˈleɪ/',pos:'verb',def:'To diminish or put at rest fear or concern.',example:'The minister spoke publicly to allay fears about the new policy.',points:8},
  {word:'ALLEGATION',phonetic:'/ ˌæl.ɪˈɡeɪ.ʃən/',pos:'noun',def:'A claim that someone has done something illegal or wrong.',example:'Serious allegations of fraud were levelled against the director.',points:11},
  {word:'ALLOCATE',phonetic:'/ ˈæl.ə.keɪt/',pos:'verb',def:'To distribute resources or duties for a particular purpose.',example:'The government pledged to allocate more funds to healthcare.',points:10},
  {word:'ALTRUISM',phonetic:'/ ˈæl.tru.ɪ.z(ə)m/',pos:'noun',def:'Selfless concern for the well-being of others.',example:'Her decision to donate her savings was pure altruism.',points:10},
  {word:'AMBIVALENCE',phonetic:'/ æmˈbɪv.ə.ləns/',pos:'noun',def:'The state of having mixed feelings about something.',example:'His ambivalence toward the proposal made it hard to know his true view.',points:20},
  {word:'ANALOGY',phonetic:'/ əˈnæl.ə.dʒi/',pos:'noun',def:'A comparison between two things for the purpose of explanation.',example:'She used the analogy of a leaking boat to describe the organization.',points:11},
  {word:'ANECDOTAL',phonetic:'/ ˌæn.ɪkˈdəʊ.tl/',pos:'adjective',def:'Based on personal accounts rather than systematic study.',example:'The evidence for the treatment\'s effectiveness was largely anecdotal.',points:12},
  {word:'ANNOTATION',phonetic:'/ ˌæn.əˈteɪ.ʃən/',pos:'noun',def:'A note added to a text as explanation or comment.',example:'Her annotations in the margin revealed a sharp and critical mind.',points:10},
  {word:'ANTIQUATED',phonetic:'/ ˈæn.tɪ.kweɪ.tɪd/',pos:'adjective',def:'Old-fashioned or outdated.',example:'The antiquated system struggled to cope with modern demands.',points:20},
  {word:'APPRECIATE',phonetic:'/ əˈpriː.ʃi.eɪt/',pos:'verb',def:'To recognize the value of; to be grateful for.',example:'She appreciated his honest feedback even though it was difficult to hear.',points:16},
  {word:'APPRISE',phonetic:'/ əˈpraɪz/',pos:'verb',def:'To inform or tell someone.',example:'Please apprise me of any changes to the schedule immediately.',points:11},
  {word:'APPROXIMATE',phonetic:'/ əˈprɒk.sɪ.mɪt/',pos:'adjective',def:'Close to the actual but not completely accurate.',example:'The approximate cost of the project is two million pounds.',points:24},
  {word:'ARCHAIC',phonetic:'/ ɑːˈkeɪ.ɪk/',pos:'adjective',def:'Very old or old-fashioned; no longer current.',example:'The archaic law had not been enforced for over a century.',points:14},
  {word:'ASPERSE',phonetic:'/ əˈspɜːs/',pos:'verb',def:'To attack or criticize the reputation of someone.',example:'He was accused of aspersing his rival\'s character without evidence.',points:9},
  {word:'ASSUMPTION',phonetic:'/ əˈsʌmp.ʃən/',pos:'noun',def:'A thing taken for granted without proof.',example:'The entire argument rested on an unproven assumption.',points:14},
  {word:'ASSURANCE',phonetic:'/ əˈʃʊər.əns/',pos:'noun',def:'A promise; freedom from doubt; confidence.',example:'He gave his assurance that the work would be completed on time.',points:11},
  {word:'ATTRITION',phonetic:'/ əˈtrɪʃ.ən/',pos:'noun',def:'The process of reducing strength through sustained pressure.',example:'A war of attrition eventually weakened both sides.',points:9},
  {word:'BAFFLING',phonetic:'/ ˈbæf.lɪŋ/',pos:'adjective',def:'Impossible to understand; perplexing.',example:'The baffling results led the team to repeat the experiment.',points:17},
  {word:'BANISH',phonetic:'/ ˈbæn.ɪʃ/',pos:'verb',def:'To send someone away from a country as official punishment.',example:'The disgraced noble was banished from the kingdom forever.',points:11},
  {word:'BELABOR',phonetic:'/ bɪˈleɪ.bər/',pos:'verb',def:'To argue or elaborate a point excessively.',example:'There is no need to belabor the point — everyone understands it.',points:11},
  {word:'BENEFICIARY',phonetic:'/ ˌben.ɪˈfɪʃ.ər.i/',pos:'noun',def:'A person who benefits from something such as a will or insurance.',example:'She was named as the sole beneficiary in her aunt\'s will.',points:21},
  {word:'BESEECH',phonetic:'/ bɪˈsiːtʃ/',pos:'verb',def:'To ask someone urgently and fervently for something.',example:'She beseeched the committee to reconsider their decision.',points:14},
  {word:'BESTOW',phonetic:'/ bɪˈstəʊ/',pos:'verb',def:'To give something as an honor or present.',example:'The university bestowed an honorary degree on the celebrated author.',points:11},
  {word:'BIAS',phonetic:'/ ˈbaɪ.əs/',pos:'noun',def:'Prejudice in favor of or against one group; a tendency.',example:'The study was criticized for its obvious bias toward positive results.',points:6},
  {word:'CAJOLE',phonetic:'/ kəˈdʒəʊl/',pos:'verb',def:'To persuade someone by sustained coaxing or flattery.',example:'He cajoled his reluctant colleague into presenting at the conference.',points:15},
  {word:'CALLOUS',phonetic:'/ ˈkæl.əs/',pos:'adjective',def:'Showing an insensitive disregard for others.',example:'The callous remark left everyone in the room speechless.',points:9},
  {word:'CAPACIOUS',phonetic:'/ kəˈpeɪ.ʃəs/',pos:'adjective',def:'Having a lot of space inside; roomy.',example:'The capacious auditorium could seat over two thousand people.',points:15},
  {word:'CEASE',phonetic:'/ siːs/',pos:'verb',def:'To come or bring to an end.',example:'Hostilities between the two nations finally ceased after years of conflict.',points:7},
  {word:'CHASTISE',phonetic:'/ tʃæˈstaɪz/',pos:'verb',def:'To rebuke or reprimand severely.',example:'The headteacher chastised the students for their disruptive behavior.',points:13},
  {word:'CHRONIC',phonetic:'/ ˈkrɒn.ɪk/',pos:'adjective',def:'Persisting for a long time; constantly recurring.',example:'She suffered from a chronic condition that required daily medication.',points:14},
  {word:'CIVIL',phonetic:'/ ˈsɪv.əl/',pos:'adjective',def:'Relating to citizens; courteous and polite.',example:'Despite their differences, both parties maintained civil dialogue.',points:10},
  {word:'CLAMOR',phonetic:'/ ˈklæm.ər/',pos:'noun',def:'A loud and confused noise; a strong demand.',example:'There was a growing clamor from the public for greater accountability.',points:10},
  {word:'COGNIZANT',phonetic:'/ ˈkɒɡ.nɪ.zənt/',pos:'adjective',def:'Having knowledge or awareness.',example:'She was fully cognizant of the risks before making her decision.',points:21},
  {word:'COHERENCE',phonetic:'/ kəʊˈhɪər.əns/',pos:'noun',def:'The quality of being logical and consistent.',example:'The essay lacked coherence and jumped between unrelated points.',points:16},
  {word:'COINCIDE',phonetic:'/ ˌkəʊ.ɪnˈsaɪd/',pos:'verb',def:'To occur at the same time; to correspond exactly.',example:'His visit happened to coincide with the city\'s annual festival.',points:13},
  {word:'COMMODIOUS',phonetic:'/ kəˈməʊ.di.əs/',pos:'adjective',def:'Roomy and comfortable.',example:'The commodious apartment offered space that city living rarely affords.',points:17},
  {word:'COMMOTION',phonetic:'/ kəˈməʊ.ʃən/',pos:'noun',def:'A state of confused and noisy disturbance.',example:'A sudden commotion in the corridor interrupted the lecture.',points:15},
  {word:'COMPENDIUM',phonetic:'/ kəmˈpen.di.əm/',pos:'noun',def:'A collection of concise but detailed information.',example:'The encyclopedia is a compendium of human knowledge.',points:19},
  {word:'COMPLIANT',phonetic:'/ kəmˈplaɪ.ənt/',pos:'adjective',def:'Inclined to agree with others or obey rules.',example:'A compliant workforce is not always the most innovative one.',points:15},
  {word:'CONCEITED',phonetic:'/ kənˈsiː.tɪd/',pos:'adjective',def:'Excessively proud of oneself; vain.',example:'His conceited attitude drove away potential allies.',points:14},
  {word:'CONFRONT',phonetic:'/ kənˈfrʌnt/',pos:'verb',def:'To face up to and deal with a problem; to challenge.',example:'She decided to confront the issue head-on rather than avoid it.',points:13},
  {word:'CONGENITAL',phonetic:'/ kənˈdʒen.ɪ.tl/',pos:'adjective',def:'Present from birth; innate.',example:'The child was born with a congenital heart defect.',points:13},
  {word:'CONJURE',phonetic:'/ ˈkʌn.dʒər/',pos:'verb',def:'To make appear as if by magic; to evoke.',example:'Her words conjured vivid images of the landscapes she described.',points:16},
  {word:'CONSECRATE',phonetic:'/ ˈkɒn.sɪ.kreɪt/',pos:'verb',def:'To make or declare something sacred.',example:'The ground was consecrated before the new chapel was built.',points:14},
  {word:'CONSOLIDATE',phonetic:'/ kənˈsɒl.ɪ.deɪt/',pos:'verb',def:'To combine several things into a single more effective whole.',example:'The merger will consolidate the two companies into a global leader.',points:14},
  {word:'CONSTERNATION',phonetic:'/ ˌkɒn.stəˈneɪ.ʃən/',pos:'noun',def:'Anxiety or dismay typically caused by something unexpected.',example:'The sudden announcement caused widespread consternation.',points:15},
  {word:'CONSTRAIN',phonetic:'/ kənˈstreɪn/',pos:'verb',def:'To compel or force toward a particular course; to restrict.',example:'Budget limitations constrained the scope of the research project.',points:11},
  {word:'CONTENTMENT',phonetic:'/ kənˈtent.mənt/',pos:'noun',def:'A state of happiness and satisfaction.',example:'True contentment comes from within rather than from material possessions.',points:15},
  {word:'CONTRABAND',phonetic:'/ ˈkɒn.trə.bænd/',pos:'noun',def:'Goods that have been imported or exported illegally.',example:'Customs officers seized a large quantity of contraband at the port.',points:15},
  {word:'CONTROVERSY',phonetic:'/ ˈkɒn.trə.vɜː.si/',pos:'noun',def:'Prolonged public disagreement or heated debate.',example:'The new curriculum changes sparked immediate controversy.',points:19},
  {word:'CONVICT',phonetic:'/ kənˈvɪkt/',pos:'verb',def:'To declare guilty of a criminal offence.',example:'The jury took only two hours to convict the defendant.',points:14},
  {word:'CORPULENT',phonetic:'/ ˈkɔː.pjʊ.lənt/',pos:'adjective',def:'Fat; having a large heavy body.',example:'The corpulent figure at the door bore little resemblance to his old photo.',points:13},
  {word:'COUNTERPRODUCTIVE',phonetic:'/ ˌkaʊn.tə.prəˈdʌk.tɪv/',pos:'adjective',def:'Having the opposite of the desired effect.',example:'Working excessive hours often proves counterproductive in the long run.',points:27},
  {word:'CULPRIT',phonetic:'/ ˈkʌl.prɪt/',pos:'noun',def:'A person responsible for a crime or other misdeed.',example:'It took investigators months to identify the true culprit.',points:11},
  {word:'DAMPEN',phonetic:'/ ˈdæm.pən/',pos:'verb',def:'To make slightly wet; to make less strong or enthusiastic.',example:'Bad weather dampened the spirits of the outdoor festival-goers.',points:11},
  {word:'DAUNTLESS',phonetic:'/ ˈdɔːnt.ləs/',pos:'adjective',def:'Showing fearlessness and determination.',example:'The dauntless explorer pressed on despite the worsening conditions.',points:10},
  {word:'DEBACLE',phonetic:'/ dɪˈbɑː.kəl/',pos:'noun',def:'A sudden, complete disaster or failure.',example:'The product launch was a debacle that cost the company millions.',points:12},
  {word:'DECEIVE',phonetic:'/ dɪˈsiːv/',pos:'verb',def:'To cause to believe something that is not true.',example:'He deceived investors by falsifying the company\'s financial records.',points:13},
  {word:'DECIPHER',phonetic:'/ dɪˈsaɪ.fər/',pos:'verb',def:'To succeed in understanding something difficult or illegible.',example:'Scholars spent years trying to decipher the ancient script.',points:16},
  {word:'DECRY',phonetic:'/ dɪˈkraɪ/',pos:'verb',def:'To publicly denounce something as wrong.',example:'Human rights groups were quick to decry the new restrictions.',points:11},
  {word:'DEFIANCE',phonetic:'/ dɪˈfaɪ.əns/',pos:'noun',def:'Open resistance; bold disobedience.',example:'She wore the banned symbol in open defiance of the authorities.',points:14},
  {word:'DEFERENTIAL',phonetic:'/ ˌdef.əˈren.ʃəl/',pos:'adjective',def:'Showing deference; respectfully submissive.',example:'A deferential manner is expected when addressing senior officials.',points:15},
  {word:'DEJECTED',phonetic:'/ dɪˈdʒek.tɪd/',pos:'adjective',def:'Sad and dispirited; low in spirits.',example:'After the loss, the team sat dejected in the changing room.',points:19},
  {word:'DELUSION',phonetic:'/ dɪˈluː.ʒən/',pos:'noun',def:'A belief that is not true and not based on reality.',example:'He lived under the delusion that everyone admired him.',points:9},
  {word:'DERIVATIVE',phonetic:'/ dɪˈrɪv.ə.tɪv/',pos:'adjective',def:'Imitative of the work of another artist; lacking originality.',example:'Critics dismissed the film as derivative and predictable.',points:17},
  {word:'DESECRATE',phonetic:'/ ˈdes.ɪ.kreɪt/',pos:'verb',def:'To treat a sacred place or thing with violent disrespect.',example:'Vandals desecrated the war memorial overnight.',points:12},
  {word:'DETER',phonetic:'/ dɪˈtɜːr/',pos:'verb',def:'To discourage someone from doing something by instilling doubt.',example:'Stiff penalties are intended to deter would-be offenders.',points:6},
  {word:'DETRIMENTAL',phonetic:'/ ˌdet.rɪˈmen.tl/',pos:'adjective',def:'Causing harm or damage.',example:'Prolonged stress is detrimental to both mental and physical health.',points:14},
  {word:'DIFFUSE',phonetic:'/ dɪˈfjuːz/',pos:'verb',def:'To spread over a wide area; to make less intense.',example:'The manager worked hard to diffuse the tension in the room.',points:14},
  {word:'DILIGENCE',phonetic:'/ ˈdɪl.ɪ.dʒəns/',pos:'noun',def:'Careful and persistent work or effort.',example:'Her diligence throughout the year was rewarded with top marks.',points:13},
  {word:'DISCERNMENT',phonetic:'/ dɪˈsɜːn.mənt/',pos:'noun',def:'The ability to judge well; good taste and insight.',example:'The appointment required someone with great discernment and experience.',points:16},
  {word:'DISCORD',phonetic:'/ ˈdɪs.kɔːd/',pos:'noun',def:'Disagreement between people; lack of harmony.',example:'Discord within the committee paralysed the decision-making process.',points:11},
  {word:'DISCRETIONARY',phonetic:'/ dɪˈskreʃ.ən.ər.i/',pos:'adjective',def:'Available for use at the discretion of the user; not fixed.',example:'The fund provides discretionary grants to eligible applicants.',points:19},
  {word:'DISENCHANTED',phonetic:'/ ˌdɪs.ɪnˈtʃɑːn.tɪd/',pos:'adjective',def:'Disillusioned; no longer enchanted or idealistic.',example:'Many voters felt disenchanted after years of broken promises.',points:19},
  {word:'DISPASSIONATE',phonetic:'/ dɪˈspæʃ.ən.ɪt/',pos:'adjective',def:'Not influenced by strong emotion; impartial.',example:'A dispassionate analysis of the data revealed a clear trend.',points:16},
  {word:'DISPARITY',phonetic:'/ dɪˈspær.ɪ.ti/',pos:'noun',def:'A great difference between things; inequality.',example:'The disparity in income between the richest and poorest grew wider.',points:15},
  {word:'DISREGARD',phonetic:'/ ˌdɪs.rɪˈɡɑːd/',pos:'verb',def:'To pay no attention to; to treat as unimportant.',example:'He disregarded all warnings and proceeded with the risky plan.',points:12},
  {word:'DISSERTATION',phonetic:'/ ˌdɪs.əˈteɪ.ʃən/',pos:'noun',def:'A long essay on a subject submitted for a degree.',example:'She spent three years researching and writing her doctoral dissertation.',points:13},
  {word:'DISTORT',phonetic:'/ dɪˈstɔːt/',pos:'verb',def:'To pull out of shape; to give a misleading account of.',example:'The newspaper was accused of distorting the facts of the story.',points:8},
  {word:'DIVERGENT',phonetic:'/ daɪˈvɜː.dʒənt/',pos:'adjective',def:'Tending to be different or develop in different directions.',example:'The two experts held divergent views on how to tackle the problem.',points:14},
  {word:'DIVULGE',phonetic:'/ daɪˈvʌldʒ/',pos:'verb',def:'To make secret information known.',example:'She refused to divulge the source of her information.',points:12},
  {word:'DORMANT',phonetic:'/ ˈdɔː.mənt/',pos:'adjective',def:'Temporarily inactive; in a sleeping state.',example:'The volcano had been dormant for over a century before erupting.',points:10},
  {word:'DUBIOUS',phonetic:'/ ˈdjuː.bi.əs/',pos:'adjective',def:'Hesitating or doubting; not to be relied upon.',example:'The legality of the arrangement was dubious at best.',points:10},
  {word:'EARNEST',phonetic:'/ ˈɜː.nɪst/',pos:'adjective',def:'Intensely serious; sincere.',example:'He made an earnest appeal for donations to rebuild the school.',points:7},
  {word:'EBULLIENT',phonetic:'/ ɪˈbʊl.i.ənt/',pos:'adjective',def:'Cheerful and full of energy.',example:'Her ebullient personality lifted the mood of everyone around her.',points:11},
  {word:'EFFICACIOUS',phonetic:'/ ˌef.ɪˈkeɪ.ʃəs/',pos:'adjective',def:'Successful in producing the desired or intended result.',example:'The new drug was found to be highly efficacious in clinical trials.',points:21},
  {word:'EFFRONTERY',phonetic:'/ ɪˈfrʌn.tər.i/',pos:'noun',def:'Insolent boldness; audacious behavior.',example:'He had the effrontery to demand a raise the day after being late.',points:19},
  {word:'ELATION',phonetic:'/ ɪˈleɪ.ʃən/',pos:'noun',def:'Great happiness and exhilaration.',example:'The crowd erupted in elation as the final whistle blew.',points:7},
  {word:'EMBODY',phonetic:'/ ɪmˈbɒd.i/',pos:'verb',def:'To be an expression of or give a tangible form to.',example:'She embodied the values of courage and compassion throughout her career.',points:14},
  {word:'EMINENCE',phonetic:'/ ˈem.ɪ.nəns/',pos:'noun',def:'The state of being famous and respected within a field.',example:'The scientist achieved eminence through decades of groundbreaking research.',points:12},
  {word:'EMPHASIS',phonetic:'/ ˈem.fə.sɪs/',pos:'noun',def:'Special importance or prominence given to something.',example:'The new curriculum places greater emphasis on critical thinking skills.',points:15},
  {word:'EMPIRICISM',phonetic:'/ emˈpɪr.ɪ.sɪ.z(ə)m/',pos:'noun',def:'The theory that knowledge comes from sensory experience.',example:'Empiricism underpins the entire scientific method.',points:18},
  {word:'ENACT',phonetic:'/ ɪˈnækt/',pos:'verb',def:'To make something into law; to put into practice.',example:'Parliament enacted the legislation after months of debate.',points:7},
  {word:'ENCROACH',phonetic:'/ ɪnˈkrəʊtʃ/',pos:'verb',def:'To gradually intrude on another\'s territory or rights.',example:'Urban sprawl continued to encroach on valuable agricultural land.',points:15},
  {word:'ENDURANCE',phonetic:'/ ɪnˈdjʊər.əns/',pos:'noun',def:'The ability to sustain prolonged stressful effort.',example:'Long-distance running requires both physical and mental endurance.',points:12},
  {word:'ENFORCE',phonetic:'/ ɪnˈfɔːs/',pos:'verb',def:'To compel observance of or compliance with a law or rule.',example:'Police struggled to enforce the new restrictions effectively.',points:12},
  {word:'ENGAGE',phonetic:'/ ɪnˈɡeɪdʒ/',pos:'verb',def:'To participate or become involved; to attract attention.',example:'The exhibition was designed to engage visitors of all ages.',points:8},
  {word:'ENHANCE',phonetic:'/ ɪnˈhɑːns/',pos:'verb',def:'To intensify or improve the quality or value of something.',example:'Regular feedback is one of the most effective ways to enhance performance.',points:12},
  {word:'ENLIGHTEN',phonetic:'/ ɪnˈlaɪ.tən/',pos:'verb',def:'To give greater knowledge or understanding.',example:'The lecture did much to enlighten students about the topic.',points:13},
  {word:'ENTERPRISE',phonetic:'/ ˈen.tə.praɪz/',pos:'noun',def:'A business; a bold and difficult undertaking.',example:'The new enterprise created over a hundred jobs in the region.',points:12},
  {word:'ENTICE',phonetic:'/ ɪnˈtaɪs/',pos:'verb',def:'To attract or tempt by offering pleasure or advantage.',example:'Special offers were designed to entice new customers to the store.',points:8},
  {word:'EQUANIMITY',phonetic:'/ ˌiː.kwəˈnɪm.ɪ.ti/',pos:'noun',def:'Calmness and composure, especially in difficult situations.',example:'She faced the devastating news with remarkable equanimity.',points:24},
  {word:'EQUIVOCATE',phonetic:'/ ɪˈkwɪv.ə.keɪt/',pos:'verb',def:'To use ambiguous language so as to avoid commitment.',example:'Politicians often equivocate when asked for direct answers.',points:24},
  {word:'EVASIVE',phonetic:'/ ɪˈveɪ.sɪv/',pos:'adjective',def:'Tending to avoid commitment; not straightforward.',example:'His evasive answers only deepened the committee\'s suspicion.',points:13},
  {word:'EVOKE',phonetic:'/ ɪˈvəʊk/',pos:'verb',def:'To bring a feeling or memory to mind.',example:'The old photograph evoked powerful memories of her childhood.',points:12},
  {word:'EXASPERATE',phonetic:'/ ɪɡˈzæs.pər.eɪt/',pos:'verb',def:'To irritate and frustrate intensely.',example:'The constant delays exasperated everyone waiting at the airport.',points:19},
  {word:'EXECUTE',phonetic:'/ ˈek.sɪ.kjuːt/',pos:'verb',def:'To carry out or accomplish a task; to put to death officially.',example:'The team executed the plan with impressive precision.',points:16},
  {word:'EXEMPT',phonetic:'/ ɪɡˈzempt/',pos:'adjective',def:'Free from an obligation or liability imposed on others.',example:'Small businesses are exempt from the new reporting requirements.',points:17},
  {word:'EXORBITANT',phonetic:'/ ɪɡˈzɔː.bɪ.tənt/',pos:'adjective',def:'Unreasonably large; excessive in price.',example:'The exorbitant cost of housing in the city forced many to move away.',points:19},
  {word:'EXPOSITION',phonetic:'/ ˌek.spəˈzɪʃ.ən/',pos:'noun',def:'A comprehensive description or explanation; a large public exhibition.',example:'The book opens with a clear exposition of the author\'s central argument.',points:19},
  {word:'EXPUNGE',phonetic:'/ ɪkˈspʌndʒ/',pos:'verb',def:'To remove completely; to erase.',example:'He requested that all records of the incident be expunged.',points:17},
  {word:'FALLACIOUS',phonetic:'/ fəˈleɪ.ʃəs/',pos:'adjective',def:'Based on a mistaken belief; logically unsound.',example:'The argument was exposed as fallacious by a single counterexample.',points:15},
  {word:'FANATICAL',phonetic:'/ fəˈnæt.ɪ.kəl/',pos:'adjective',def:'Filled with excessive enthusiasm for a cause or belief.',example:'His fanatical devotion to the ideology alarmed moderate supporters.',points:14},
  {word:'FATHOMLESS',phonetic:'/ ˈfæð.əm.ləs/',pos:'adjective',def:'Too deep to be measured; impossible to fully understand.',example:'The fathomless depths of the ocean remain largely unexplored.',points:18},
  {word:'FEIGN',phonetic:'/ feɪn/',pos:'verb',def:'To pretend to be affected by a feeling or condition.',example:'She feigned surprise although she had known about the party for weeks.',points:9},
  {word:'FERVID',phonetic:'/ ˈfɜː.vɪd/',pos:'adjective',def:'Intensely enthusiastic or passionate; feverish.',example:'His fervid support for the cause never wavered despite setbacks.',points:13},
  {word:'FITFUL',phonetic:'/ ˈfɪt.fəl/',pos:'adjective',def:'Active or occurring in an irregular pattern; intermittent.',example:'After a fitful night\'s sleep, she felt unable to concentrate.',points:12},
  {word:'FLIPPANT',phonetic:'/ ˈflɪp.ənt/',pos:'adjective',def:'Not showing the proper seriousness; glib.',example:'His flippant response to the tragedy offended many viewers.',points:15},
  {word:'FORTHRIGHT',phonetic:'/ ˈfɔːθ.raɪt/',pos:'adjective',def:'Direct and outspoken; straightforward.',example:'His forthright manner left no doubt about where he stood.',points:20},
  {word:'FRAUDULENT',phonetic:'/ ˈfrɔː.djʊ.lənt/',pos:'adjective',def:'Obtained or done by deception; involving fraud.',example:'The company was found guilty of fraudulent accounting practices.',points:14},
  {word:'FRIVOLITY',phonetic:'/ frɪˈvɒl.ɪ.ti/',pos:'noun',def:'The quality of not having a serious purpose.',example:'There was no room for frivolity in the tense weeks before the election.',points:18},
  {word:'FRUSTRATE',phonetic:'/ frʌˈstreɪt/',pos:'verb',def:'To prevent a plan from progressing; to cause annoyance.',example:'Bureaucratic obstacles frustrated every attempt at reform.',points:12},
  {word:'GALLING',phonetic:'/ ˈɡɔː.lɪŋ/',pos:'adjective',def:'Causing annoyance or resentment.',example:'It was galling to be criticised by someone less experienced.',points:9},
  {word:'GARNER',phonetic:'/ ˈɡɑː.nər/',pos:'verb',def:'To gather or collect something, especially information or support.',example:'Her campaign garnered support from across the political spectrum.',points:7},
  {word:'GENUINELY',phonetic:'/ ˈdʒen.ju.ɪn.li/',pos:'adverb',def:'In a truthful, authentic way.',example:'He was genuinely surprised by the scale of the public reaction.',points:13},
  {word:'GERMANE',phonetic:'/ dʒɜːˈmeɪn/',pos:'adjective',def:'Relevant to a subject under consideration.',example:'The historical context is germane to understanding the poem\'s meaning.',points:10},
  {word:'GLUT',phonetic:'/ ɡlʌt/',pos:'noun',def:'An excessively large supply of something.',example:'A glut of cheap imports drove local manufacturers out of business.',points:5},
  {word:'GOAD',phonetic:'/ ɡəʊd/',pos:'verb',def:'To provoke or annoy someone so as to stimulate an action.',example:'His critics tried to goad him into making a rash public statement.',points:6},
  {word:'GRACIOUS',phonetic:'/ ˈɡreɪ.ʃəs/',pos:'adjective',def:'Courteous, kind, and pleasant.',example:'The gracious host made every guest feel at ease immediately.',points:11},
  {word:'GRATITUDE',phonetic:'/ ˈɡræt.ɪ.tjuːd/',pos:'noun',def:'The quality of being thankful; readiness to show appreciation.',example:'She expressed her gratitude in a heartfelt letter to her mentor.',points:11},
  {word:'GRAVE',phonetic:'/ ɡreɪv/',pos:'adjective',def:'Giving cause for alarm; serious.',example:'The doctor\'s expression was grave as she delivered the diagnosis.',points:9},
  {word:'GRIEVANCE',phonetic:'/ ˈɡriː.vəns/',pos:'noun',def:'A real or perceived wrong giving cause for complaint.',example:'Employees were encouraged to raise any grievances with the HR team.',points:15},
  {word:'HALLMARK',phonetic:'/ ˈhɔːl.mɑːk/',pos:'noun',def:'A distinctive feature or characteristic.',example:'Precision and clarity are the hallmarks of her writing style.',points:17},
  {word:'HAPHAZARD',phonetic:'/ ˌhæpˈhæz.əd/',pos:'adjective',def:'Lacking any obvious principle of organisation; random.',example:'The haphazard filing system made finding documents almost impossible.',points:27},
  {word:'HARSH',phonetic:'/ hɑːʃ/',pos:'adjective',def:'Unpleasantly rough or jarring; cruel.',example:'The harsh winter conditions claimed many lives that year.',points:11},
  {word:'HASTEN',phonetic:'/ ˈheɪ.sən/',pos:'verb',def:'To be quick to do something; to cause to happen sooner.',example:'The intervention hastened the end of the conflict by several months.',points:9},
  {word:'HEINOUS',phonetic:'/ ˈheɪ.nəs/',pos:'adjective',def:'Utterly odious or wicked.',example:'The heinous crime shocked an entire nation.',points:10},
  {word:'HERALD',phonetic:'/ ˈher.əld/',pos:'verb',def:'To signal the approach of something; to publicly proclaim.',example:'The announcement heralded a new era of cooperation between the nations.',points:10},
  {word:'HINDER',phonetic:'/ ˈhɪn.dər/',pos:'verb',def:'To create difficulties for; to obstruct.',example:'Poor communication hindered progress at every stage of the project.',points:10},
  {word:'HOLLOW',phonetic:'/ ˈhɒl.əʊ/',pos:'adjective',def:'Having a hole inside; lacking real significance.',example:'His promises rang hollow given his track record of broken commitments.',points:12},
  {word:'HOMOGENEOUS',phonetic:'/ ˌhɒm.əˈdʒiː.ni.əs/',pos:'adjective',def:'Of the same kind; uniform in composition.',example:'The study found the population to be far less homogeneous than assumed.',points:17},
  {word:'HYPOCRITICAL',phonetic:'/ ˌhɪp.əˈkrɪt.ɪ.kəl/',pos:'adjective',def:'Behaving in a way that contradicts one\'s stated beliefs.',example:'It seemed hypocritical to preach austerity while spending lavishly.',points:24},
  {word:'IDEALIZE',phonetic:'/ aɪˈdɪə.laɪz/',pos:'verb',def:'To regard or represent as perfect or better than in reality.',example:'Young people often idealize their heroes and overlook their flaws.',points:18},
  {word:'IGNORANCE',phonetic:'/ ˈɪɡ.nər.əns/',pos:'noun',def:'Lack of knowledge or information.',example:'Ignorance of the law is no defence in a court of justice.',points:12},
  {word:'IMMERSE',phonetic:'/ ɪˈmɜːs/',pos:'verb',def:'To dip or submerge; to involve deeply in an activity.',example:'She immersed herself in the local culture during her time abroad.',points:11},
  {word:'IMPASSIONED',phonetic:'/ ɪmˈpæʃ.ənd/',pos:'adjective',def:'Filled with or showing great emotion.',example:'He delivered an impassioned plea for justice that moved the audience.',points:16},
  {word:'IMPUNITY',phonetic:'/ ɪmˈpjuː.nɪ.ti/',pos:'noun',def:'Exemption from punishment or freedom from the consequences of an action.',example:'Corruption flourishes when officials act with impunity.',points:15},
  {word:'INADVERTENTLY',phonetic:'/ ˌɪn.ədˈvɜː.tənt.li/',pos:'adverb',def:'Without intention; accidentally.',example:'She inadvertently revealed confidential information in the interview.',points:20},
  {word:'INCITE',phonetic:'/ ɪnˈsaɪt/',pos:'verb',def:'To encourage or stir up violent or unlawful behavior.',example:'The speech was found to incite hatred against a minority group.',points:8},
  {word:'INCUMBENT',phonetic:'/ ɪnˈkʌm.bənt/',pos:'adjective',def:'Necessary as a duty; currently holding an office.',example:'It is incumbent on all citizens to report criminal activity.',points:15},
  {word:'INDUCE',phonetic:'/ ɪnˈdjuːs/',pos:'verb',def:'To bring about or give rise to; to persuade.',example:'The offer of a bonus induced many employees to work overtime.',points:9},
  {word:'INDULGE',phonetic:'/ ɪnˈdʌldʒ/',pos:'verb',def:'To allow oneself to enjoy something; to satisfy a desire.',example:'She allowed herself to indulge in a rare weekend of rest.',points:9},
  {word:'INFURIATE',phonetic:'/ ɪnˈfjʊər.i.eɪt/',pos:'verb',def:'To make someone extremely angry.',example:'The repeated delays infuriated commuters who had been waiting for hours.',points:12},
  {word:'INGENUITY',phonetic:'/ ˌɪn.dʒəˈnjuː.ɪ.ti/',pos:'noun',def:'The quality of being clever, original, and inventive.',example:'The engineer\'s ingenuity solved a problem that had stumped the team.',points:13},
  {word:'INIMITABLE',phonetic:'/ ɪˈnɪm.ɪ.tə.bəl/',pos:'adjective',def:'So good or unusual as to be impossible to copy; unique.',example:'She performed with an inimitable style that set her apart from everyone.',points:14},
  {word:'INSTILL',phonetic:'/ ɪnˈstɪl/',pos:'verb',def:'To gradually but firmly establish an idea or attitude.',example:'Good teachers instill a love of learning that lasts a lifetime.',points:7},
  {word:'INSURGENT',phonetic:'/ ɪnˈsɜː.dʒənt/',pos:'noun',def:'A rebel or revolutionary fighting against a government.',example:'Insurgents launched a series of coordinated attacks overnight.',points:10},
  {word:'INTEGRAL',phonetic:'/ ˈɪn.tɪ.ɡrəl/',pos:'adjective',def:'Necessary to make a whole complete; fundamental.',example:'Communication is integral to the success of any team.',points:9},
  {word:'INTIMIDATE',phonetic:'/ ɪnˈtɪm.ɪ.deɪt/',pos:'verb',def:'To frighten someone into doing something.',example:'Witnesses claimed they had been intimidated into withdrawing their statements.',points:13},
  {word:'INTREPID',phonetic:'/ ɪnˈtrep.ɪd/',pos:'adjective',def:'Fearless and adventurous; courageous.',example:'The intrepid journalist reported from the most dangerous conflict zones.',points:11},
  {word:'IRONY',phonetic:'/ ˈaɪ.rə.ni/',pos:'noun',def:'Expression of meaning using language that normally expresses the opposite.',example:'The irony was that his speech on honesty was full of exaggerations.',points:8},
  {word:'IRRELEVANT',phonetic:'/ ɪˈrel.ɪ.vənt/',pos:'adjective',def:'Not connected with or relevant to something.',example:'Several of the submitted documents were entirely irrelevant to the case.',points:13},
  {word:'JUBILANT',phonetic:'/ ˈdʒuː.bɪ.lənt/',pos:'adjective',def:'Feeling or expressing great happiness and triumph.',example:'The jubilant fans poured into the streets after the historic victory.',points:17},
  {word:'LABORIOUS',phonetic:'/ ləˈbɔː.ri.əs/',pos:'adjective',def:'Requiring considerable time and effort; not fluent.',example:'The laborious process of sorting thousands of files took weeks.',points:11},
  {word:'LAVISH',phonetic:'/ ˈlæv.ɪʃ/',pos:'adjective',def:'Sumptuously rich, elaborate, or luxurious.',example:'The lavish banquet left guests in awe of the host\'s generosity.',points:12},
  {word:'LEGACY',phonetic:'/ ˈleɡ.ə.si/',pos:'noun',def:'Something handed down from a predecessor; long-lasting impact.',example:'Her greatest legacy was the network of schools she established.',points:12},
  {word:'LOFTY',phonetic:'/ ˈlɒf.ti/',pos:'adjective',def:'Of imposing height; noble in character; haughty.',example:'He spoke with lofty ambitions that few believed he could achieve.',points:11},
  {word:'LUCRATIVE',phonetic:'/ ˈluː.krə.tɪv/',pos:'adjective',def:'Producing a great deal of profit.',example:'The lucrative contract transformed the small firm into a major player.',points:14},
  {word:'LUDICROUS',phonetic:'/ ˈluː.dɪ.krəs/',pos:'adjective',def:'So foolish or unreasonable as to be amusing; absurd.',example:'The suggestion was so ludicrous that several people laughed aloud.',points:12},
  {word:'MAGNIFY',phonetic:'/ ˈmæɡ.nɪ.faɪ/',pos:'verb',def:'To make something appear larger; to exaggerate.',example:'Media coverage tended to magnify every minor setback into a crisis.',points:16},
  {word:'MALICE',phonetic:'/ ˈmæl.ɪs/',pos:'noun',def:'The intention or desire to do evil; ill will.',example:'The attack appeared to be driven by pure malice rather than motive.',points:10},
  {word:'MANIFEST',phonetic:'/ ˈmæn.ɪ.fest/',pos:'verb',def:'To display or show a quality or feeling clearly.',example:'His anxiety manifested itself in a series of nervous habits.',points:13},
  {word:'MANIPULATE',phonetic:'/ məˈnɪp.jʊ.leɪt/',pos:'verb',def:'To handle or control in a skillful way; to influence unfairly.',example:'She accused him of manipulating the figures to show a false profit.',points:14},
  {word:'MEANDER',phonetic:'/ miˈæn.dər/',pos:'verb',def:'To follow a winding course; to speak in a wandering way.',example:'The river meandered through lush farmland before reaching the sea.',points:10},
  {word:'MILITANT',phonetic:'/ ˈmɪl.ɪ.tənt/',pos:'adjective',def:'Combative and aggressive in support of a cause.',example:'A militant faction within the party opposed any form of compromise.',points:10},
  {word:'MOOT',phonetic:'/ muːt/',pos:'adjective',def:'Subject to debate; having no practical significance.',example:'Whether the original decision was correct is now a moot point.',points:6},
  {word:'MORIBUND',phonetic:'/ ˈmɒr.ɪ.bʌnd/',pos:'adjective',def:'At the point of death; in terminal decline.',example:'The moribund industry had not seen innovation for three decades.',points:13},
  {word:'MULTIFARIOUS',phonetic:'/ ˌmʌl.tɪˈfeər.i.əs/',pos:'adjective',def:'Many and of various types.',example:'She had multifarious interests ranging from chess to mountaineering.',points:17},
  {word:'MUNIFICENT',phonetic:'/ mjuːˈnɪf.ɪ.sənt/',pos:'adjective',def:'More generous than is usual or necessary.',example:'The munificent donation allowed the charity to expand its services.',points:17},
  {word:'MYOPIC',phonetic:'/ maɪˈɒp.ɪk/',pos:'adjective',def:'Shortsighted; lacking foresight or intellectual insight.',example:'A myopic focus on short-term gains led to long-term problems.',points:15},
  {word:'NARCISSISTIC',phonetic:'/ ˌnɑː.sɪˈsɪs.tɪk/',pos:'adjective',def:'Having an excessive interest in or admiration of oneself.',example:'His narcissistic tendencies made him unable to accept any criticism.',points:16},
  {word:'NEGATE',phonetic:'/ nɪˈɡeɪt/',pos:'verb',def:'To make ineffective; to deny the existence of.',example:'One careless mistake can negate months of careful preparation.',points:7},
  {word:'NIHILISM',phonetic:'/ ˈnaɪ.ɪ.lɪ.z(ə)m/',pos:'noun',def:'The rejection of all moral and religious principles.',example:'His nihilism left him without a framework for making ethical decisions.',points:13},
  {word:'NOMINAL',phonetic:'/ ˈnɒm.ɪ.nəl/',pos:'adjective',def:'Existing in name only; very small in amount.',example:'He retained a nominal role in the company after stepping down.',points:9},
  {word:'NONCHALANCE',phonetic:'/ ˈnɒn.ʃə.lɑːns/',pos:'noun',def:'A casual lack of concern; indifference.',example:'She greeted the news with a nonchalance that surprised everyone.',points:18},
  {word:'NUANCE',phonetic:'/ ˈnjuː.ɑːns/',pos:'noun',def:'A subtle difference in meaning, expression, or tone.',example:'A skilled translator must be sensitive to every nuance of the original.',points:8},
  {word:'OBFUSCATE',phonetic:'/ ˈɒb.fə.skeɪt/',pos:'verb',def:'To make unclear or confusing; to bewilder.',example:'Legal language is sometimes used to obfuscate rather than clarify.',points:16},
  {word:'OBLIQUE',phonetic:'/ əˈbliːk/',pos:'adjective',def:'Not expressed directly; indirect.',example:'His oblique reference to the scandal was not lost on the audience.',points:18},
  {word:'OBSOLESCENCE',phonetic:'/ ˌɒb.səˈles.əns/',pos:'noun',def:'The process of becoming outdated or out of use.',example:'Planned obsolescence encourages consumers to replace products too quickly.',points:18},
  {word:'OMIT',phonetic:'/ əʊˈmɪt/',pos:'verb',def:'To leave out or exclude; to fail to include.',example:'The editor omitted three chapters without consulting the author.',points:6},
  {word:'OPAQUE',phonetic:'/ əʊˈpeɪk/',pos:'adjective',def:'Not transparent; not clear or easy to understand.',example:'The instructions were so opaque that nobody could follow them.',points:17},
  {word:'OPPRESSIVE',phonetic:'/ əˈpres.ɪv/',pos:'adjective',def:'Unjustly inflicting hardship; weighing heavily on the mind.',example:'The oppressive heat made outdoor work almost unbearable.',points:17},
  {word:'ORTHODOX',phonetic:'/ ˈɔː.θə.dɒks/',pos:'adjective',def:'Following traditional or established beliefs; conventional.',example:'His orthodox approach was safe but unlikely to produce new insights.',points:19},
  {word:'OUTRAGE',phonetic:'/ ˈaʊt.reɪdʒ/',pos:'noun',def:'An extremely strong reaction of anger or indignation.',example:'The verdict caused outrage among human rights campaigners worldwide.',points:8},
  {word:'OVERARCHING',phonetic:'/ ˌəʊ.vərˈɑː.tʃɪŋ/',pos:'adjective',def:'Comprehensive; forming an arch over everything.',example:'The overarching goal of the program is to reduce youth unemployment.',points:20},
  {word:'PALLIATE',phonetic:'/ ˈpæl.i.eɪt/',pos:'verb',def:'To make a disease or its symptoms less severe without curing it.',example:'The treatment palliated symptoms but did not address the underlying cause.',points:10},
  {word:'PALPABLE',phonetic:'/ ˈpæl.pə.bəl/',pos:'adjective',def:'So intense as to seem almost tangible; able to be touched.',example:'The tension in the room was palpable as the verdict was read.',points:14},
  {word:'PARADOXICAL',phonetic:'/ ˌpær.əˈdɒk.sɪ.kəl/',pos:'adjective',def:'Seemingly absurd or self-contradictory but possibly true.',example:'It is paradoxical that greater choice can sometimes lead to less satisfaction.',points:23},
  {word:'PATHETIC',phonetic:'/ pəˈθet.ɪk/',pos:'adjective',def:'Arousing pity or sadness; depressingly inadequate.',example:'His pathetic excuse for missing the deadline convinced no one.',points:15},
  {word:'PATRONAGE',phonetic:'/ ˈpæt.rə.nɪdʒ/',pos:'noun',def:'Support given by a patron; power to give jobs as a reward.',example:'The arts depend heavily on both public funding and private patronage.',points:12},
  {word:'PECULIAR',phonetic:'/ pɪˈkjuː.li.ər/',pos:'adjective',def:'Different from what is normal or expected; strange.',example:'There was something peculiar about his account of the evening.',points:12},
  {word:'PEERLESS',phonetic:'/ ˈpɪə.ləs/',pos:'adjective',def:'Better than all others; unrivalled.',example:'Her peerless command of the language dazzled native speakers.',points:10},
  {word:'PENITENT',phonetic:'/ ˈpen.ɪ.tənt/',pos:'adjective',def:'Feeling or showing sorrow for wrongdoing.',example:'The penitent offender wrote letters of apology to all his victims.',points:10},
  {word:'PERCEPTION',phonetic:'/ pəˈsep.ʃən/',pos:'noun',def:'The ability to understand; a way of seeing or interpreting.',example:'Public perception of the policy changed after the report was published.',points:16},
  {word:'PERPETUAL',phonetic:'/ pəˈpetʃ.u.əl/',pos:'adjective',def:'Never ending; occurring repeatedly and so frequently.',example:'The perpetual noise from the construction site disturbed the residents.',points:13},
  {word:'PERSEVERE',phonetic:'/ ˌpɜː.sɪˈvɪər/',pos:'verb',def:'To continue despite difficulty or delay in achieving success.',example:'She persevered through years of rejection before being published.',points:14},
  {word:'PERTINENT',phonetic:'/ ˈpɜː.tɪ.nənt/',pos:'adjective',def:'Relevant or applicable to a particular matter.',example:'Please include only information that is pertinent to the case.',points:11},
  {word:'PERTURB',phonetic:'/ pəˈtɜːb/',pos:'verb',def:'To make someone anxious or unsettled.',example:'The news perturbed the financial markets significantly.',points:11},
  {word:'PESSIMISTIC',phonetic:'/ ˌpes.ɪˈmɪs.tɪk/',pos:'adjective',def:'Tending to see the worst aspect of things.',example:'He was pessimistic about the economy recovering quickly.',points:17},
  {word:'PLACID',phonetic:'/ ˈplæs.ɪd/',pos:'adjective',def:'Not easily upset or excited; calm and peaceful.',example:'The placid lake reflected the mountains perfectly on the still morning.',points:11},
  {word:'POPULISM',phonetic:'/ ˈpɒp.jʊ.lɪ.z(ə)m/',pos:'noun',def:'Political approach appealing to ordinary people against elites.',example:'Populism often thrives during periods of economic instability.',points:14},
  {word:'PORTEND',phonetic:'/ pɔːˈtend/',pos:'verb',def:'To be a sign or warning of something to come.',example:'Dark clouds on the horizon seemed to portend a difficult season ahead.',points:10},
  {word:'PREDOMINANT',phonetic:'/ prɪˈdɒm.ɪ.nənt/',pos:'adjective',def:'Present as the strongest or main element.',example:'English is the predominant language used in international business.',points:16},
  {word:'PRESCIENT',phonetic:'/ ˈpres.i.ənt/',pos:'adjective',def:'Having knowledge of events before they take place.',example:'Her prescient warning about market instability was largely ignored.',points:13},
  {word:'PRESTIGE',phonetic:'/ presˈtiːʒ/',pos:'noun',def:'Widespread respect and admiration earned through achievement.',example:'The award brought considerable prestige to the entire department.',points:11},
  {word:'PROTAGONIST',phonetic:'/ prəˈtæɡ.ə.nɪst/',pos:'noun',def:'The main character in a story; a leading figure in a cause.',example:'The novel\'s protagonist overcomes tremendous hardship to find redemption.',points:14},
  {word:'PROVENANCE',phonetic:'/ ˈprɒv.ə.nəns/',pos:'noun',def:'The place of origin or earliest history of something.',example:'Experts questioned the provenance of the painting.',points:17},
  {word:'PROVOCATIVE',phonetic:'/ prəˈvɒk.ə.tɪv/',pos:'adjective',def:'Deliberately causing a strong reaction.',example:'The artist was known for making provocative work that challenged norms.',points:21},
  {word:'PRUDENCE',phonetic:'/ ˈpruː.dəns/',pos:'noun',def:'The quality of being prudent; caution and good judgement.',example:'Financial prudence requires planning for unexpected expenses.',points:13},
  {word:'RAMIFICATION',phonetic:'/ ˌræm.ɪ.fɪˈkeɪ.ʃən/',pos:'noun',def:'A complex or unwelcome consequence of an action.',example:'The ramifications of the decision were not fully understood at the time.',points:19},
  {word:'REACTIONARY',phonetic:'/ riˈæk.ʃən.ər.i/',pos:'adjective',def:'Opposing political or social progress; extremely conservative.',example:'The reactionary faction within the party blocked every reform effort.',points:16},
  {word:'REBUKE',phonetic:'/ rɪˈbjuːk/',pos:'verb',def:'To express sharp disapproval or criticism of someone.',example:'The chairman rebuked the committee member for leaking the document.',points:12},
  {word:'RECTIFY',phonetic:'/ ˈrek.tɪ.faɪ/',pos:'verb',def:'To put right; to correct something that is wrong.',example:'Steps were immediately taken to rectify the error in the report.',points:15},
  {word:'REDOLENT',phonetic:'/ ˈred.ə.lənt/',pos:'adjective',def:'Strongly reminiscent or suggestive of something.',example:'The old library was redolent of years of scholarship and quiet study.',points:9},
  {word:'REDUNDANT',phonetic:'/ rɪˈdʌn.dənt/',pos:'adjective',def:'No longer needed; superfluous; laid off from work.',example:'The new software made several administrative roles redundant.',points:11},
  {word:'REFRAIN',phonetic:'/ rɪˈfreɪn/',pos:'verb',def:'To stop oneself from doing something.',example:'Delegates were asked to refrain from using phones during the session.',points:10},
  {word:'REITERATE',phonetic:'/ riˈɪt.ər.eɪt/',pos:'verb',def:'To say something again or a number of times for emphasis.',example:'She reiterated her commitment to transparency throughout the campaign.',points:9},
  {word:'REMEDIATE',phonetic:'/ rɪˈmiː.di.eɪt/',pos:'verb',def:'To remedy something; to restore to a good condition.',example:'The company was ordered to remediate the contaminated land.',points:12},
  {word:'REMORSE',phonetic:'/ rɪˈmɔːs/',pos:'noun',def:'Deep regret or guilt for a wrongdoing.',example:'He expressed genuine remorse for the harm his actions had caused.',points:9},
  {word:'RENAISSANCE',phonetic:'/ rɪˈneɪ.səns/',pos:'noun',def:'A revival of interest in something; a cultural rebirth.',example:'The city is experiencing a cultural renaissance after years of decline.',points:13},
  {word:'RENOUNCE',phonetic:'/ rɪˈnaʊns/',pos:'verb',def:'To formally abandon or give up a claim or right.',example:'She renounced her citizenship in protest against the government\'s actions.',points:10},
  {word:'REPREHENSIBLE',phonetic:'/ ˌrep.rɪˈhen.sɪ.bəl/',pos:'adjective',def:'Deserving censure or condemnation.',example:'His reprehensible conduct during the trial was condemned by all parties.',points:20},
  {word:'RETICENCE',phonetic:'/ ˈret.ɪ.səns/',pos:'noun',def:'The quality of being uncommunicative; reserve.',example:'His reticence in meetings was sometimes mistaken for lack of interest.',points:13},
  {word:'REVERE',phonetic:'/ rɪˈvɪər/',pos:'verb',def:'To feel deep respect or admiration for something.',example:'He was revered by students and colleagues alike for his wisdom.',points:9},
  {word:'RIGIDITY',phonetic:'/ rɪˈdʒɪd.ɪ.ti/',pos:'noun',def:'The quality of being unable to be changed; inflexibility.',example:'The rigidity of the rules frustrated those trying to find creative solutions.',points:13},
  {word:'SAGACITY',phonetic:'/ səˈɡæs.ɪ.ti/',pos:'noun',def:'Ability to make good decisions; wisdom.',example:'She was admired for her sagacity in navigating complex negotiations.',points:14},
  {word:'SANGUINE',phonetic:'/ ˈsæŋ.ɡwɪn/',pos:'adjective',def:'Optimistic, especially in difficult situations.',example:'Despite the setbacks, he remained sanguine about the project\'s prospects.',points:9},
  {word:'SCANDALOUS',phonetic:'/ ˈskæn.də.ləs/',pos:'adjective',def:'Causing general public outrage by perceived immorality.',example:'The scandalous revelations forced several senior officials to resign.',points:13},
  {word:'SCRUPULOUS',phonetic:'/ ˈskruː.pjʊ.ləs/',pos:'adjective',def:'Very careful about doing what is honest and morally right.',example:'A scrupulous journalist verifies every fact before publishing.',points:14},
  {word:'SHREWD',phonetic:'/ ʃruːd/',pos:'adjective',def:'Having sharp powers of judgement; astute.',example:'A shrewd negotiator, she never revealed her hand too early.',points:13},
  {word:'SINISTER',phonetic:'/ ˈsɪn.ɪ.stər/',pos:'adjective',def:'Giving the impression that something bad will happen; evil.',example:'There was something sinister about the way he watched the crowd.',points:8},
  {word:'SLANDER',phonetic:'/ ˈslɑːn.dər/',pos:'noun',def:'The action of making false spoken statements damaging to reputation.',example:'He sued the journalist for slander after the broadcast.',points:8},
  {word:'SOPHISTRY',phonetic:'/ ˈsɒf.ɪ.stri/',pos:'noun',def:'The use of clever but false arguments; deceptive reasoning.',example:'The lawyer\'s sophistry confused the jury for a time but not the judge.',points:17},
  {word:'SPARTAN',phonetic:'/ ˈspɑː.tən/',pos:'adjective',def:'Showing or characterized by austerity or a lack of comfort.',example:'The soldiers trained under spartan conditions with minimal equipment.',points:9},
  {word:'SQUANDER',phonetic:'/ ˈskwɒn.dər/',pos:'verb',def:'To waste in a reckless or foolish manner.',example:'He squandered his inheritance within five years of receiving it.',points:18},
  {word:'STAGNATION',phonetic:'/ stæɡˈneɪ.ʃən/',pos:'noun',def:'The state of not flowing or moving; lack of activity or development.',example:'Economic stagnation left millions unable to find meaningful work.',points:11},
  {word:'STEM',phonetic:'/ stem/',pos:'verb',def:'To stop or restrict the flow of something.',example:'New policies were needed to stem the tide of illegal activity.',points:6},
  {word:'STOICISM',phonetic:'/ ˈstəʊ.ɪ.sɪ.z(ə)m/',pos:'noun',def:'Endurance of pain without complaint; stoic philosophy.',example:'His stoicism in the face of personal tragedy inspired many.',points:12},
  {word:'SUBORDINATE',phonetic:'/ səˈbɔː.dɪ.nɪt/',pos:'adjective',def:'Lower in rank or position; less important.',example:'Personal gain must always be subordinate to the public interest.',points:14},
  {word:'SUBSTANTIVE',phonetic:'/ ˈsʌb.stən.tɪv/',pos:'adjective',def:'Having a firm basis in reality; important and meaningful.',example:'The report made several substantive recommendations for reform.',points:16},
  {word:'SUPERFLUITY',phonetic:'/ ˌsuː.pəˈfluː.ɪ.ti/',pos:'noun',def:'An unnecessarily large amount of something.',example:'A superfluity of regulations can be as damaging as a lack of them.',points:19},
  {word:'SUSCEPTIBLE',phonetic:'/ səˈsep.tɪ.bəl/',pos:'adjective',def:'Likely or liable to be influenced or harmed.',example:'Young children are particularly susceptible to respiratory infections.',points:17},
  {word:'SYMPATHY',phonetic:'/ ˈsɪm.pə.θi/',pos:'noun',def:'Feelings of pity for someone else\'s misfortune.',example:'She expressed her deep sympathy for the families of the victims.',points:21},
  {word:'SYNTHESIS',phonetic:'/ ˈsɪn.θə.sɪs/',pos:'noun',def:'The combination of elements to form a new whole.',example:'The essay achieved a brilliant synthesis of multiple theoretical perspectives.',points:15},
  {word:'TACTFUL',phonetic:'/ ˈtækt.fəl/',pos:'adjective',def:'Having or showing skill in dealing with sensitive situations.',example:'A tactful response acknowledged the problem without assigning blame.',points:12},
  {word:'TAINT',phonetic:'/ teɪnt/',pos:'verb',def:'To contaminate or pollute; to affect with a bad quality.',example:'The scandal tainted the reputation of the entire institution.',points:5},
  {word:'TERSE',phonetic:'/ tɜːs/',pos:'adjective',def:'Sparing with words; brief to the point of seeming rude.',example:'His terse reply made it clear he did not wish to discuss the matter.',points:5},
  {word:'TORTUOUS',phonetic:'/ ˈtɔː.tʃu.əs/',pos:'adjective',def:'Full of twists and turns; excessively complex.',example:'The tortuous legal process lasted over five years.',points:8},
  {word:'TRANSCEND',phonetic:'/ trænˈsend/',pos:'verb',def:'To go beyond the range or limits of something.',example:'Her performance transcended technique to become something truly spiritual.',points:12},
  {word:'TRANSGRESSION',phonetic:'/ trænzˈɡreʃ.ən/',pos:'noun',def:'An act that goes against a law or rule; an offence.',example:'Even minor transgressions of the code of conduct were taken seriously.',points:14},
  {word:'TRIVIALIZE',phonetic:'/ ˈtrɪv.i.ə.laɪz/',pos:'verb',def:'To make something seem less important than it really is.',example:'Critics accused the documentary of trivializing a serious issue.',points:22},
  {word:'UNANIMOUS',phonetic:'/ juːˈnæn.ɪ.məs/',pos:'adjective',def:'Fully in agreement; with the consent of all.',example:'The committee reached a unanimous decision to approve the proposal.',points:11},
  {word:'UNETHICAL',phonetic:'/ ʌnˈeθ.ɪ.kəl/',pos:'adjective',def:'Not morally correct.',example:'The company was fined for unethical practices in its supply chain.',points:14},
  {word:'UNJUST',phonetic:'/ ʌnˈdʒʌst/',pos:'adjective',def:'Not based on or behaving according to what is fair.',example:'Protesters argued the sentence was unjust and disproportionate.',points:13},
  {word:'UPHOLD',phonetic:'/ ˌʌpˈhəʊld/',pos:'verb',def:'To confirm or support; to maintain a custom or practice.',example:'The appeal court upheld the original verdict.',points:12},
  {word:'USURP',phonetic:'/ juːˈzɜːp/',pos:'verb',def:'To take a position of power illegally or by force.',example:'He attempted to usurp control of the board through procedural manoeuvres.',points:7},
  {word:'VACUOUS',phonetic:'/ ˈvæk.ju.əs/',pos:'adjective',def:'Having or showing a lack of thought; empty.',example:'The vacuous speech said nothing of substance for forty minutes.',points:12},
  {word:'VENGEANCE',phonetic:'/ ˈven.dʒəns/',pos:'noun',def:'Punishment inflicted in retaliation for a wrong.',example:'He pursued vengeance for years rather than accepting the legal outcome.',points:15},
  {word:'VERACITY',phonetic:'/ vəˈræs.ɪ.ti/',pos:'noun',def:'The quality of conforming to facts; truthfulness.',example:'Journalists are expected to confirm the veracity of every claim.',points:16},
  {word:'VETO',phonetic:'/ ˈviː.təʊ/',pos:'verb',def:'To reject a decision or proposal by authority.',example:'The president threatened to veto the bill if it passed without amendment.',points:7},
  {word:'VIGILANCE',phonetic:'/ ˈvɪdʒ.ɪ.ləns/',pos:'noun',def:'The action of keeping careful watch.',example:'Constant vigilance is required to prevent security breaches.',points:15},
  {word:'VISCERAL',phonetic:'/ ˈvɪs.ər.əl/',pos:'adjective',def:'Relating to deep inward feelings rather than reason.',example:'The film provoked a visceral reaction in audiences across the world.',points:13},
  {word:'VITUPERATE',phonetic:'/ vɪˈtjuː.pər.eɪt/',pos:'verb',def:'To blame or insult in strong or violent language.',example:'The politician vituperated his opponents in a series of angry tweets.',points:15},
  {word:'VORACIOUS',phonetic:'/ vəˈreɪ.ʃəs/',pos:'adjective',def:'Wanting or devouring great quantities; excessively eager.',example:'A voracious reader, she finished two novels every week.',points:14},
  {word:'VULNERABLE',phonetic:'/ ˈvʌl.nər.ə.bəl/',pos:'adjective',def:'Susceptible to physical or emotional harm.',example:'Children are among the most vulnerable members of any society.',points:15},
  {word:'WARY',phonetic:'/ ˈweər.i/',pos:'adjective',def:'Feeling or showing caution about possible dangers.',example:'She was wary of making promises she might not be able to keep.',points:10},
  {word:'WIELD',phonetic:'/ wiːld/',pos:'verb',def:'To hold and use a weapon or tool; to exercise power.',example:'She wielded considerable influence within the organization.',points:9},
  {word:'WISTFUL',phonetic:'/ ˈwɪst.fəl/',pos:'adjective',def:'Having a feeling of vague or regretful longing.',example:'A wistful expression crossed her face as she recalled her childhood.',points:13},
  {word:'XENOPHOBIC',phonetic:'/ ˌzen.əˈfəʊ.bɪk/',pos:'adjective',def:'Having or showing a dislike of people from other countries.',example:'The xenophobic rhetoric in the campaign disturbed many observers.',points:26},
  {word:'YEARN',phonetic:'/ jɜːn/',pos:'verb',def:'To have an intense longing for something.',example:'She yearned for a life beyond the confines of the small town.',points:8},
  {word:'ZENITH',phonetic:'/ ˈzen.ɪθ/',pos:'noun',def:'The time at which something is most powerful; the highest point.',example:'At the zenith of his career he was the most celebrated writer alive.',points:18}
];
function setWOTD() {
  const day = Math.floor(Date.now() / 86400000) % WOTD_LIST.length;
  const w = WOTD_LIST[day];
  const el = n => document.getElementById(n);
  if (el('wotdWord'))     el('wotdWord').textContent     = w.word;
  if (el('wotdPhonetic')) el('wotdPhonetic').textContent = w.phonetic;
  if (el('wotdPos'))      el('wotdPos').textContent      = w.pos;
  if (el('wotdDef'))      el('wotdDef').textContent      = w.def;
  if (el('wotdExample'))  el('wotdExample').textContent  = w.example || '';
  if (el('wotdPoints'))   el('wotdPoints').textContent   = w.points;
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
