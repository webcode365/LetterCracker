/* LetterCracker Word Database Loader v2
   370,079 words in 9 shards by word length.
   Shards live in word-shards/ folder.
   getPoints() and canMakeWord() stay synchronous.
   unscramble() is now async (returns Promise).
   All other pages use loadAll() or loadByLengths().
*/
var WORD_DB=(function(){'use strict';
var SHARD_MAP=[
  {name:'wd-2-4',  min:2, max:4 },
  {name:'wd-5-6',  min:5, max:6 },
  {name:'wd-7',    min:7, max:7 },
  {name:'wd-8',    min:8, max:8 },
  {name:'wd-9',    min:9, max:9 },
  {name:'wd-10',   min:10,max:10},
  {name:'wd-11-12',min:11,max:12},
  {name:'wd-13-15',min:13,max:15},
  {name:'wd-16up', min:16,max:99}
];
var _cache={},_loading={},_allLoaded=false;
function basePath(){
  var p=window.location.pathname;
  if(p.indexOf('/seo-articles/')!==-1||p.indexOf('/word-shards/')!==-1)return '../word-shards/';
  return 'word-shards/';
}
function loadShard(name){
  if(_cache[name])return Promise.resolve();
  if(_loading[name])return _loading[name];
  if(window.LC_SHARDS&&window.LC_SHARDS[name]){_cache[name]=true;return Promise.resolve();}
  _loading[name]=new Promise(function(resolve){
    var s=document.createElement('script');
    s.src=basePath()+name+'.js?_v=1';
    s.onload=function(){_cache[name]=true;delete _loading[name];resolve();};
    s.onerror=function(){delete _loading[name];resolve();};
    document.head.appendChild(s);
  });
  return _loading[name];
}
function shardWords(name){return(window.LC_SHARDS&&window.LC_SHARDS[name])||[];}
function shardsForMaxLen(maxLen){return SHARD_MAP.filter(function(s){return s.min<=maxLen;}).map(function(s){return s.name;});}
function shardForLen(len){var s=SHARD_MAP.filter(function(s){return len>=s.min&&len<=s.max;})[0];return s?s.name:'wd-16up';}
function showLoader(){var e=document.getElementById('lcDictLoader');if(!e){e=document.createElement('div');e.id='lcDictLoader';e.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--accent,#007aff);color:#fff;padding:8px 20px;border-radius:20px;font-family:sans-serif;font-size:.82rem;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);';document.body.appendChild(e);}e.textContent='⏳ Loading dictionary…';e.style.display='block';e.style.opacity='1';}
function hideLoader(){var e=document.getElementById('lcDictLoader');if(e){e.style.opacity='0';setTimeout(function(){e.style.display='none';},350);}}
var letterPoints={a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10};
function getPoints(word){return word.toLowerCase().split('').reduce(function(s,c){return s+(letterPoints[c]||0);},0);}
function canMakeWord(word,letters){
  var lw=word.toLowerCase(),la=letters.toLowerCase().split('');
  var wc=la.filter(function(c){return c==='?'||c==='*';}).length;
  var av=la.filter(function(c){return c!=='?'&&c!=='*';});
  var wu=0,chars=lw.split('');
  for(var i=0;i<chars.length;i++){var idx=av.indexOf(chars[i]);if(idx!==-1){av.splice(idx,1);}else{wu++;if(wu>wc)return false;}}
  return true;
}
function unscramble(letters,options){
  options=options||{};
  var sw=(options.startsWith||'').toLowerCase();
  var ew=(options.endsWith||'').toLowerCase();
  var mi=(options.mustInclude||'').toLowerCase();
  var lf=options.lengthFilter||'all';
  var sb=options.sortBy||'length';
  var cl=letters.toLowerCase().replace(/[^a-z?*]/g,'');
  var maxLen=cl.length;
  var needed;
  if(lf!=='all'&&lf!=='8+'){needed=[shardForLen(parseInt(lf))];}
  else if(lf==='8+'){needed=SHARD_MAP.filter(function(s){return s.max>=8;}).map(function(s){return s.name;});}
  else{needed=shardsForMaxLen(maxLen);}
  var fetch=needed.some(function(n){return!_cache[n];});
  if(fetch)showLoader();
  return Promise.all(needed.map(loadShard)).then(function(){
    if(fetch)hideLoader();
    var pool=[];needed.forEach(function(n){pool=pool.concat(shardWords(n));});
    var res=pool.filter(function(w){
      if(!canMakeWord(w,cl))return false;
      if(sw&&!w.startsWith(sw))return false;
      if(ew&&!w.endsWith(ew))return false;
      if(mi&&!w.includes(mi))return false;
      if(lf!=='all'){if(lf==='8+'){if(w.length<8)return false;}else if(w.length!==parseInt(lf))return false;}
      return true;
    });
    if(sb==='alpha'){res.sort();}
    else if(sb==='points'){res.sort(function(a,b){return getPoints(b)-getPoints(a);});}
    else{res.sort(function(a,b){return b.length-a.length||a.localeCompare(b);});}
    return res;
  });
}
function loadAll(onProgress){
  if(_allLoaded){var c=[];SHARD_MAP.forEach(function(s){c=c.concat(shardWords(s.name));});return Promise.resolve(c);}
  showLoader();
  var total=SHARD_MAP.length,done=0;
  return Promise.all(SHARD_MAP.map(function(s){
    return loadShard(s.name).then(function(){done++;if(onProgress)onProgress(Math.round(done/total*100));});
  })).then(function(){
    hideLoader();_allLoaded=true;
    var all=[];SHARD_MAP.forEach(function(s){all=all.concat(shardWords(s.name));});
    return all;
  });
}
function loadByLengths(lengths){
  var needed=[];
  lengths.forEach(function(len){var n=shardForLen(len);if(needed.indexOf(n)===-1)needed.push(n);});
  var fetch=needed.some(function(n){return!_cache[n];});
  if(fetch)showLoader();
  return Promise.all(needed.map(loadShard)).then(function(){
    hideLoader();
    var words=[];needed.forEach(function(n){words=words.concat(shardWords(n));});
    return words.filter(function(w){return lengths.indexOf(w.length)!==-1;});
  });
}
function groupByLength(words){var g={};words.forEach(function(w){if(!g[w.length])g[w.length]=[];g[w.length].push(w);});return g;}
/* Compatibility shim for WORD_DB.words.filter/includes/slice */
var _proxy={
  filter:function(fn){var a=[];SHARD_MAP.forEach(function(s){a=a.concat(shardWords(s.name));});return a.filter(fn);},
  includes:function(w){return shardWords(shardForLen(w.length)).indexOf(w.toLowerCase())!==-1;},
  slice:function(){var a=[];SHARD_MAP.forEach(function(s){a=a.concat(shardWords(s.name));});return a.slice.apply(a,arguments);},
  forEach:function(fn){SHARD_MAP.forEach(function(s){shardWords(s.name).forEach(fn);});}
};
Object.defineProperty(_proxy,'length',{get:function(){return SHARD_MAP.reduce(function(sum,s){return sum+shardWords(s.name).length;},0);}});
return{letterPoints:letterPoints,words:_proxy,getPoints:getPoints,canMakeWord:canMakeWord,unscramble:unscramble,loadAll:loadAll,loadByLengths:loadByLengths,groupByLength:groupByLength,shardInfo:SHARD_MAP};
})();
