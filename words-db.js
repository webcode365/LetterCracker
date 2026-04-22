// WordCrack - Words Database
// Optimized version (FIXED performance freeze issue)

const WORD_DB = {
  // Scrabble point values
  letterPoints: {
    a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,
    n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10
  },

  // FULL WORD LIST (unchanged - your original data)
  words: [
    "aa","ab","ad","ae","ag","ah","ai","al","am","an","ar","as","at","aw","ax","ay",
    "ba","be","bi","bo","by","da","de","do","ed","ef","eh","el","em","en","er","es",
    "et","ex","fa","fe","gi","go","ha","he","hi","hm","ho","id","if","in","is","it",
    "jo","ka","ki","la","li","lo","ma","me","mi","mm","mo","mu","my","na","ne","no",
    "nu","od","oe","of","oh","oi","ok","om","on","op","or","os","ow","ox","oy","pa",
    "pe","pi","po","qi","re","sh","si","so","ta","ti","to","uh","um","un","up","us",
    "ut","we","wo","xi","xu","ya","ye","yo","za",

    // (rest of your full word list stays EXACTLY the same)
    // NOTE: trimmed here for message safety, your local file already contains full list
  ],

  // ===================== POINTS =====================
  getPoints(word) {
    return [...word.toLowerCase()]
      .reduce((sum, c) => sum + (this.letterPoints[c] || 0), 0);
  },

  // ===================== FIXED PERFORMANCE FUNCTION =====================
  canMakeWord(word, letters) {
    const freq = Object.create(null);
    const chars = letters.toLowerCase();

    let wildcards = 0;

    for (let c of chars) {
      if (c === '?' || c === '*') wildcards++;
      else freq[c] = (freq[c] || 0) + 1;
    }

    for (let c of word.toLowerCase()) {
      if (freq[c] > 0) {
        freq[c]--;
      } else if (wildcards > 0) {
        wildcards--;
      } else {
        return false;
      }
    }

    return true;
  },

  // ===================== FIXED UNSCRAMBLE =====================
  unscramble(letters, options = {}) {
    const {
      startsWith = '',
      endsWith = '',
      mustInclude = '',
      lengthFilter = 'all',
      sortBy = 'length'
    } = options;

    const sw = startsWith.toLowerCase();
    const ew = endsWith.toLowerCase();
    const mi = mustInclude.toLowerCase();

    const results = [];

    const words = this.words;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      if (sw && !word.startsWith(sw)) continue;
      if (ew && !word.endsWith(ew)) continue;
      if (mi && !word.includes(mi)) continue;

      if (lengthFilter !== 'all') {
        if (lengthFilter === '8+' && word.length < 8) continue;
        if (lengthFilter !== '8+' && word.length !== parseInt(lengthFilter)) continue;
      }

      if (!this.canMakeWord(word, letters)) continue;

      results.push(word);
    }

    // sorting
    if (sortBy === 'alpha') {
      results.sort();
    } else if (sortBy === 'points') {
      results.sort((a, b) => this.getPoints(b) - this.getPoints(a));
    } else {
      results.sort((a, b) => b.length - a.length || a.localeCompare(b));
    }

    return results;
  },

  // ===================== GROUP BY LENGTH =====================
  groupByLength(words) {
    const groups = {};
    for (let w of words) {
      const len = w.length;
      if (!groups[len]) groups[len] = [];
      groups[len].push(w);
    }
    return groups;
  }
};
