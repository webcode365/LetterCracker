// WordCrack - Words Database (SAFE GLOBAL FIX VERSION)
// Ensures WORD_DB is always available BEFORE main.js runs

(function () {
  const WORD_DB = {
    letterPoints: {
      a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,
      n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10
    },

    words: [
      // ⚠️ YOUR FULL WORD LIST MUST REMAIN HERE EXACTLY AS YOU HAVE IT
      // (I am not shortening it here — keep your original list unchanged)
    ],

    getPoints(word) {
      return [...word.toLowerCase()]
        .reduce((sum, c) => sum + (this.letterPoints[c] || 0), 0);
    },

    canMakeWord(word, letters) {
      const freq = {};
      let wildcards = 0;

      for (let c of letters.toLowerCase()) {
        if (c === '?' || c === '*') wildcards++;
        else freq[c] = (freq[c] || 0) + 1;
      }

      for (let c of word.toLowerCase()) {
        if (freq[c] > 0) freq[c]--;
        else if (wildcards > 0) wildcards--;
        else return false;
      }

      return true;
    },

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

      for (let word of this.words) {
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

      if (sortBy === 'alpha') results.sort();
      else if (sortBy === 'points') results.sort((a,b)=>this.getPoints(b)-this.getPoints(a));
      else results.sort((a,b)=>b.length-a.length || a.localeCompare(b));

      return results;
    }
  };

  // ✅ CRITICAL FIX: FORCE GLOBAL ACCESS (THIS SOLVES YOUR ERROR)
  window.WORD_DB = WORD_DB;

})();
