// WordCrack - Words Database
// Contains valid English words for unscrambling
// In production, expand this or load from a server-side API

const WORD_DB = {
  // Scrabble point values
  letterPoints: {
    a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,
    n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10
  },

  // Comprehensive word list (2-8 letters)
  words: [
    // 2-letter words
    "aa","ab","ad","ae","ag","ah","ai","al","am","an","ar","as","at","aw","ax","ay",
    "ba","be","bi","bo","by","da","de","do","ed","ef","eh","el","em","en","er","es",
    "et","ex","fa","fe","gi","go","ha","he","hi","hm","ho","id","if","in","is","it",
    "jo","ka","ki","la","li","lo","ma","me","mi","mm","mo","mu","my","na","ne","no",
    "nu","od","oe","of","oh","oi","ok","om","on","op","or","os","ow","ox","oy","pa",
    "pe","pi","po","qi","re","sh","si","so","ta","ti","to","uh","um","un","up","us",
    "ut","we","wo","xi","xu","ya","ye","yo","za",
    // 3-letter words
    "aah","aal","aas","aba","abs","aby","ace","ach","act","add","ado","ads","adz",
    "aff","aft","aga","age","ago","ags","aha","ahi","ahs","aid","aim","ain","air",
    "ais","ait","aka","ake","ala","alb","ale","all","alp","als","alt","ama","ami",
    "amp","amu","ana","and","ane","ani","ant","any","ape","app","apt","arb","arc",
    "are","ark","arm","art","ash","ask","asp","ass","ate","atm","ave","avo","awa",
    "awe","awl","awn","axe","aye","baa","bad","bag","ban","bar","bat","bay","bed",
    "beg","bet","bid","big","bit","boa","bob","bog","boo","bot","bow","box","boy",
    "bra","bro","bub","bud","bug","bun","bur","bus","but","buy","cab","can","cap",
    "car","cat","caw","cay","chi","cob","cod","cog","col","con","coo","cop","cor",
    "cos","cot","cow","coy","cry","cub","cud","cup","cur","cut","dab","dad","dag",
    "dam","day","deb","den","dew","did","dig","dim","din","dip","dis","doe","dog",
    "don","dor","dot","dry","dub","dud","due","dug","dun","duo","ear","eat","eel",
    "egg","ego","elf","elk","elm","ems","end","eon","era","eve","ewe","eye","fad",
    "fan","far","fat","fax","fay","fed","fen","few","fez","fib","fig","fin","fit",
    "fix","fly","foe","fog","fon","for","fox","fry","fub","fun","fur","gab","gag",
    "gal","gap","gas","gay","gel","gem","get","gig","gin","gnu","god","got","gum",
    "gun","gut","guy","gym","had","hag","ham","has","hat","hay","hem","hen","her",
    "hew","hex","hid","him","his","hit","hob","hod","hoe","hog","hop","hot","how",
    "hub","hug","hum","hun","hut","ice","icy","ill","imp","inn","ion","ire","irk",
    "ivy","jab","jag","jam","jar","jaw","jay","jet","jig","job","jog","joy","jug",
    "jut","keg","kin","kit","lab","lac","lag","lam","lap","law","lax","lay","lea",
    "led","leg","let","lid","lip","lit","log","lot","low","lug","mad","man","map",
    "mar","mat","maw","may","men","met","mid","mix","mob","mod","mop","mow","mud",
    "mug","nab","nag","nap","nay","net","new","nil","nip","nit","nob","nod","nor",
    "not","nun","oak","oar","oat","odd","ode","off","oft","ohm","oil","old","one",
    "opt","orb","ore","out","owe","owl","own","pad","pan","pap","par","pat","pay",
    "pea","peg","pen","pep","per","pet","pie","pig","pin","pit","ply","pod","pop",
    "pot","pow","pro","pub","pug","pun","pup","pus","put","rag","ram","ran","rat",
    "raw","ray","red","ref","rep","rev","rig","rim","rip","rob","rod","rot","row",
    "rub","rue","rug","rum","run","rut","sad","sag","sap","sat","saw","say","sea",
    "set","sew","she","shy","sin","sip","sir","sis","sit","six","ski","sky","sly",
    "sob","sod","son","sop","sot","sow","soy","spa","spy","sty","sub","sue","sum",
    "sun","tab","tan","tap","tar","tax","ten","the","thy","tie","tin","tip","toe",
    "ton","too","top","toy","try","tub","tug","two","urn","use","van","vat","via",
    "vie","vim","wad","war","was","wax","way","web","wed","wig","win","wit","woe",
    "wok","won","woo","wry","yak","yam","yap","yaw","yes","yet","yew","you","zag",
    "zap","zed","zig","zip","zit","zoo",
    // 4-letter words
    "able","ably","abut","acid","acme","acre","aged","agee","ager","ages","agha",
    "agio","agly","agma","agon","ague","aide","airy","ails","aims","airs","aits",
    "aced","aces","ache","achy","alms","aloe","also","alto","alts","alum","amah",
    "ambo","amen","amps","anal","anew","anga","anoa","anon","ante","anti","ants",
    "apes","apex","area","ares","arks","army","arts","ashy","atom","atop","aunt",
    "aura","auto","avid","away","awed","axes","axis","axle","back","bail","bait",
    "bake","bald","bale","balk","ball","balm","band","bane","bang","bank","bard",
    "bare","bark","barn","base","bash","bask","bass","bath","bead","beam","bean",
    "bear","beat","beef","beer","bees","bell","belt","bend","best","bias","bike",
    "bile","bill","bind","bird","bite","blot","blow","blue","boar","boat","bold",
    "bolt","bond","bone","book","boom","boot","bore","born","boss","both","brag",
    "bred","brew","buck","bulk","bull","bump","bunk","burn","burp","buzz","cage",
    "cake","call","came","cane","care","cart","case","cash","cast","cave","cell",
    "cent","chap","char","chat","chef","chew","chin","chip","chop","clad","clam",
    "clap","claw","clay","clip","club","clue","coal","coat","code","coil","coin",
    "cold","come","cook","cool","cope","copy","cord","core","corn","cost","crew",
    "crop","cure","curl","cute","damp","dare","dark","dart","data","date","dawn",
    "dead","deal","dear","deck","deed","deep","deer","deft","deny","desk","dial",
    "dice","diet","dirt","disc","dish","disk","dock","dome","doom","dorm","dove",
    "down","drab","drag","drip","drop","drub","drug","drum","dual","dune","dusk",
    "dust","each","earl","earn","ease","east","edge","edgy","emit","epic","ergo",
    "exam","face","fact","fail","fair","fake","fall","fame","fang","fast","fate",
    "fell","felt","fend","fern","fide","file","fill","film","find","fire","firm",
    "fish","fist","flag","flaw","flea","fled","flew","flip","flit","flow","foam",
    "fold","folk","fond","food","fool","ford","fore","form","fort","foul","four",
    "fowl","free","fret","from","fuel","full","fume","fund","fuse","gale","gall",
    "game","gang","garb","gate","gave","gaze","gear","geld","gent","germ","gift",
    "girl","gist","give","glad","glee","glen","glib","glob","glow","glue","goal",
    "goat","gold","good","goop","gore","gown","grab","grad","gray","grew","grid",
    "grim","grin","grip","grit","grow","grub","gulf","gull","gust","hack","hail",
    "hair","half","hall","halt","hand","hang","hard","hare","harm","harp","hash",
    "haul","haze","hazy","head","heal","heap","heat","heel","help","herb","herd",
    "hero","hide","high","hill","hint","hire","hoax","hold","hole","holy","home",
    "hoop","horn","host","hour","huge","hull","hump","hunt","hurl","hurt","hymn",
    "icon","idle","inch","into","iron","isle","itch","jack","jade","jail","jest",
    "join","joke","jolt","jump","just","keen","keep","kelp","kern","kill","kind",
    "king","kiss","kite","knee","knew","knit","knob","knot","know","lack","laid",
    "lake","lame","lamp","land","lane","lark","lash","last","late","laud","lava",
    "lawn","lead","leaf","leak","lean","leap","left","lend","lens","less","lick",
    "life","lift","like","lime","link","lion","list","live","load","loam","loan",
    "lock","loft","loom","loop","lore","lorn","lose","loss","lost","loud","lush",
    "lust","lute","mace","made","mail","main","make","male","mall","mane","mare",
    "mark","mask","mass","mast","mate","maze","meal","mean","meat","meet","melt",
    "memo","mere","mesh","mild","milk","mill","mind","mine","mint","mire","miss",
    "mist","mode","mole","molt","monk","moon","moor","more","most","moth","move",
    "much","mull","murk","muse","mutt","myth","nail","name","nave","near","neat",
    "neck","need","neon","news","next","nice","nine","node","nose","note","null",
    "numb","nurse","obey","odds","once","only","open","orca","over","oven","pack",
    "page","paid","pair","pale","palm","pane","park","part","pass","past","path",
    "pave","peak","peal","pear","peel","peer","pest","pick","pile","pill","pine",
    "pink","pipe","plan","play","plea","plod","plot","plow","ploy","plum","plus",
    "poem","poet","pole","poll","pond","pool","pore","port","pose","post","pray",
    "prep","prey","prim","prod","prow","pull","pump","pure","push","quay","quit",
    "quiz","race","rack","rage","rail","rain","rake","rang","rank","rant","rasp",
    "rate","read","real","reap","rear","reel","rein","rely","rent","rest","rice",
    "rich","ride","rife","rift","ring","riot","rise","risk","rite","road","roam",
    "roar","robe","rock","role","roll","roof","room","rope","rose","rosy","rote",
    "rout","rove","ruby","rude","ruin","rule","rush","rust","safe","saga","sail",
    "sake","salt","same","sand","sane","sang","sank","sash","save","scan","scar",
    "seal","seam","seep","self","send","shed","ship","shop","show","shun","shut",
    "sick","side","sigh","silk","sill","sing","sink","site","size","skid","skim",
    "skin","skip","slab","slap","sled","slim","slip","slob","slop","slot","slow",
    "slug","slum","slut","smug","snap","snow","soak","sock","soil","sold","sole",
    "some","song","soot","sore","sort","soul","soup","sour","span","spar","spat",
    "sped","spin","spit","spot","spun","stab","stag","star","stay","stem","step",
    "stew","stop","stub","stud","stun","such","sulk","surf","swam","swap","swat",
    "sway","swim","swum","tail","tale","talk","tall","tame","tank","tart","task",
    "teak","teal","tear","teem","tell","term","test","than","that","them","then",
    "thick","thin","this","thorn","thus","tide","tidy","tile","time","tint","tiny",
    "tire","toad","told","toll","tomb","tone","tool","tore","torn","toss","tour",
    "town","trek","trim","trip","true","tube","tune","turf","turn","twig","type",
    "ugly","undo","unit","upon","used","user","vain","vale","vane","vary","vast",
    "veil","vein","vend","verb","very","vest","veto","view","vine","vise","volt",
    "vows","wade","wage","wake","walk","wall","wand","want","ward","warm","wart",
    "wary","wave","weak","weal","wean","weed","weld","well","welt","went","were",
    "wham","what","when","whom","wick","wide","wife","wild","will","wilt","wink",
    "wire","wise","wish","with","woke","wolf","wood","wool","word","wore","work",
    "worm","worn","wove","wrap","wren","yell","yoga","yolk","yore","your","zeal",
    "zero","zest","zinc","zone","zoom",
    // 5-letter words (selection)
    "abbey","abbot","abyss","ached","acorn","acres","actor","acute","adage","adapt",
    "added","adept","admit","adopt","adult","aegis","afoot","after","again","agate",
    "agile","aglow","agony","agree","ahead","aided","aided","aisle","alarm","album",
    "algae","alien","align","alike","alive","allay","aloft","aloof","altar","alter",
    "among","angel","anger","angle","angry","angst","annex","antic","aptly","arbor",
    "ardor","argue","arise","armor","aroma","arose","array","arrow","arson","aside",
    "askew","assay","asset","atlas","atone","attic","audit","avoid","avow","awful",
    "axiom","azure","badge","barge","basic","basis","batch","baton","bawdy","bazaar",
    "beach","beady","beard","beast","began","begin","being","below","bench","berth",
    "beset","bevel","biome","birch","bison","bites","bland","blank","blast","blaze",
    "bleak","bleed","bless","blimp","blind","block","blood","blown","blunt","blurb",
    "blurt","blush","board","boggy","booze","bored","boxed","brace","brain","brash",
    "brass","brave","brawl","brawn","broad","broil","brook","broth","brown","brunt",
    "brush","buddy","budge","bugle","build","built","bulge","burly","buyer","byway",
    "cabal","camel","candy","canon","carry","cedar","chalk","chant","chaos","cheap",
    "check","cheek","cheer","chess","chest","chief","child","china","choke","chord",
    "chose","civic","civil","claim","clamp","clash","clasp","class","clean","clear",
    "clerk","click","cliff","climb","cling","clink","cloak","clone","close","cloth",
    "cloud","cluck","clump","coach","comet","comic","comfy","comma","count","court",
    "cover","covet","cozy","crack","crane","crash","crave","crazy","creak","creek",
    "crest","crime","crisp","cross","crowd","crown","cruel","crush","crust","crux",
    "cycle","daisy","dance","daily","datum","debts","decal","decay","decoy","delta",
    "depot","depth","derby","digit","dingy","disco","discs","ditch","ditto","ditty",
    "dizzy","dodge","dogma","dowdy","dowry","dozen","draft","drain","drama","drape",
    "drawl","drawn","dread","dream","dress","dried","drift","drill","drink","drive",
    "drone","drove","drown","dryer","early","earth","edify","eight","eject","elder",
    "elite","elbow","elope","embed","emote","empower","empty","enact","enemy","ensue",
    "entry","envoy","epoch","equip","erase","essay","ethos","evade","event","every",
    "exact","exalt","exist","extol","extra","exult","fable","faint","fancy","farce",
    "fatal","fault","feast","fence","ferry","fetch","fever","fewer","fiber","fifth",
    "fifty","fight","finch","first","fixed","fjord","flame","flare","flash","flask",
    "fatal","flesh","flock","flood","floor","floss","flour","fluid","flunk","focus",
    "foray","force","forge","forgo","forum","found","frail","frame","fraud","freak",
    "fresh","fritz","front","frost","frown","froze","frugal","funny","fuzzy","gamer",
    "gamut","gauze","gavel","gears","geese","genre","ghost","giant","giddy","girth",
    "given","gland","glare","glass","gleam","glide","gloss","glove","glyph","gonna",
    "gouge","gourd","grace","grade","grasp","graze","greed","greet","grief","gripe",
    "groan","grope","gross","grout","grove","growl","guile","guise","gusto","gypsy",
    "habit","haiku","hairy","happy","hardy","haven","havoc","heart","hefty","heist",
    "hence","heron","hinge","hippo","hitch","hoard","hobby","holly","honey","honor",
    "hopeful","hornet","hotel","human","humor","husky","hutch","hyena","ideal","image",
    "imply","inept","inert","infer","ingot","input","inter","intro","irony","issue",
    "itchy","ivory","jazzy","jewel","jiffy","juicy","jumpy","kapow","karate","kazoo",
    "kebab","knave","kneel","knife","knock","known","kudos","label","lance","lanky",
    "large","laser","latch","later","lathe","latte","launch","layer","leaky","leapt",
    "lease","least","leave","lemma","lemon","level","lever","light","limit","lingo",
    "liner","liner","liver","llama","local","lodge","logic","loose","lofty","lucid",
    "lucky","lunar","lurid","lusty","lyric","magic","major","manor","maple","march",
    "marry","marsh","match","mayor","mealy","media","merry","metal","might","mirth",
    "miser","moist","money","moral","mortal","mossy","mourn","mouse","mouth","muddy",
    "mulch","murky","music","musty","myrrh","nasal","nasty","naval","needy","nerve",
    "never","nicer","night","ninja","noble","noise","norma","north","noted","novel",
    "nurse","nymph","occur","octet","olive","onset","opera","orbit","order","other",
    "ought","ounce","outer","ovary","oxide","ozone","paint","panda","panic","panel",
    "party","pasta","patch","pause","pedal","penny","perch","phase","phone","photo",
    "piano","piece","pinch","pitch","pixel","pizza","place","plain","plait","plane",
    "plank","plant","plate","plaza","pluck","plume","plunge","point","pound","power",
    "press","price","pride","prime","print","prior","prize","probe","prone","proof",
    "prose","proud","prude","prune","psalm","pulse","punch","pupil","purge","quack",
    "qualm","queen","query","queue","quick","quiet","quite","quota","quote","rabbi",
    "rabid","radar","radio","rainy","raise","rally","ranch","rapid","ratio","raven",
    "realm","rebel","rebus","reign","repay","reply","rerun","resin","rider","ridge",
    "ripen","risky","rival","river","robin","rocky","rouge","rough","round","rouse",
    "royal","rugby","ruler","rural","rusty","salve","sandy","sauce","scale","scene",
    "scone","scoop","scope","score","scout","scull","scuzz","seize","sense","seven",
    "sewer","shade","shady","shake","shall","shame","sharp","shear","shelf","shine",
    "shirk","shock","shore","short","shout","shove","sigma","silky","since","sixth",
    "sixty","skill","skimp","skull","slate","slave","sleek","sleep","sleet","slept",
    "slice","slide","slime","sloth","smart","smash","smell","smile","smite","smoke",
    "snack","snake","snare","snarl","sneak","sniff","snore","solar","solid","solve",
    "sorry","south","space","spade","spare","spark","spawn","speak","spear","speck",
    "speed","spent","spill","spine","spite","spoon","spore","spray","squad","squat",
    "squib","staid","stain","stair","stake","stale","stall","stamp","stank","stark",
    "start","state","stead","steal","steam","steel","steer","stern","stick","stiff",
    "still","sting","stink","stock","stomp","stone","stood","store","stark","storm",
    "stout","stove","strap","straw","stray","strip","strut","stuck","study","stuff",
    "stunt","suave","sugar","suite","super","surge","swamp","swear","sweep","sweet",
    "swept","swerve","swipe","sword","sworn","syrup","taboo","tacky","talon","taupe",
    "tawny","teach","teeth","tempo","tense","tepid","terse","tests","their","theme",
    "there","these","thick","thief","third","thorn","those","three","threw","throb",
    "throw","thud","tidal","tiger","tight","timed","tired","titan","title","today",
    "token","tonic","torch","total","totem","touch","tough","towel","trace","track",
    "trade","trail","train","trait","tramp","trash","trawl","trend","triad","trial",
    "tribe","trick","tricky","tried","trout","tower","truce","trunk","truss","trust",
    "truth","tulip","tumor","tuner","tunic","tutor","twice","twill","twirl","ulcer",
    "ultra","uncle","undue","union","unite","unity","until","upper","urban","usher",
    "usual","usurp","utter","vague","valid","valor","value","valve","vault","venal",
    "verse","vigor","viral","virus","visit","visor","vivid","vocal","vodka","voice",
    "voter","voyeur","waken","waltz","waste","watch","weary","weave","weird","wheat",
    "where","which","while","whiff","whirl","white","whole","whose","wield","wiles",
    "wince","witch","witty","woman","women","woods","world","worry","worse","worst",
    "worth","would","wound","wrath","wreak","wreck","wrest","wrote","yacht","yearn",
    "yield","young","yours","youth","zesty","zilch","zippy",
    // 6-letter words (selection)
    "abroad","absent","accent","access","accrue","action","actual","affirm","afford",
    "afraid","agency","agenda","almost","always","amount","animal","annual","anyone",
    "appear","around","arrest","arrive","artist","aspire","attach","attack","attain",
    "attend","avenge","backup","battle","beauty","became","become","before","belief",
    "belong","beyond","bottom","bounce","broken","budget","burden","bureau","burrow",
    "button","cactus","camera","candle","castle","casual","cattle","center","change",
    "chapel","charge","choice","circle","closet","cobalt","coffee","colony","column",
    "combat","comedy","common","comply","corner","costly","cotton","course","cousin",
    "create","credit","crisis","critic","cursor","custom","danger","debris","decent",
    "decide","defeat","defend","define","degree","deploy","desert","desire","detect",
    "device","differ","dinner","direct","divide","doctor","domain","donate","double",
    "dragon","drawer","driven","easily","effect","eighth","either","eleven","empire",
    "enable","engine","entire","escape","evolve","except","excess","excuse","expand",
    "expect","export","extend","fabric","factor","failed","family","famous","father",
    "forest","formal","former","freeze","friend","frozen","future","garlic","gather",
    "gentle","global","govern","ground","growth","guitar","hammer","handle","harbor",
    "hatred","heaven","hollow","honest","hungry","hunter","ignore","impact","import",
    "indoor","inform","insect","insist","insult","intent","island","joyful","kernel",
    "launch","lessen","letter","mirror","monkey","mother","muscle","mutton","nation",
    "nature","nectar","needle","normal","notice","number","object","obtain","office",
    "online","opened","option","orange","origin","output","oyster","palace","paper",
    "parent","patrol","pencil","people","period","permit","person","phrase","pillow",
    "pirate","planet","player","policy","prefer","prison","profit","proper","pursue",
    "python","rabbit","rather","reason","record","reform","reject","relate","relief",
    "remain","remind","remote","remove","repair","repeat","rescue","reveal","review",
    "ritual","rocket","rubble","saddle","salmon","sample","school","second","secret",
    "secure","select","sermon","shadow","shovel","single","social","socket","source",
    "spider","spirit","splash","string","strong","struck","submit","suburb","summer",
    "system","taking","target","temple","tender","throat","ticket","timber","toggle",
    "tongue","treaty","trophy","trying","tunnel","twelve","twenty","tycoon","update",
    "useful","valley","velvet","vessel","victim","vision","wealth","weapon","winter",
    "wonder","worker","worthy","writer","yellow","zealot",
    // 7-letter words (selection)
    "ability","absence","account","acquire","achieve","ancient","arrival","article",
    "attempt","balance","battery","because","believe","benefit","between","cabinet",
    "captain","capture","careful","certain","chapter","citizen","climate","comfort",
    "command","company","compare","concern","confirm","connect","contain","control",
    "correct","country","courage","crystal","culture","current","despite","destroy",
    "develop","digital","display","distant","disturb","dynasty","earlier","economy",
    "element","example","explain","explore","express","extreme","fantasy","fashion",
    "finance","freedom","general","genuine","history","holiday","however","imagine",
    "improve","include","initial","inspire","install","instead","journey","kingdom",
    "kitchen","knowledge","machine","measure","mention","mission","mistake","natural",
    "nothing","opinion","perfect","perhaps","present","problem","produce","promise",
    "protect","provide","publish","purpose","reality","receive","require","resolve",
    "respect","restore","reverse","section","service","shelter","silence","similar",
    "society","someone","species","success","support","surface","teacher","through",
    "traffic","trigger","trouble","typical","unusual","version","village","warrior",
    "welcome","without","whether","working","zealous",
    // 8-letter words (selection)
    "absolute","abstract","accident","accurate","actually","addition","advanced",
    "although","analysis","animated","anywhere","approach","argument","arranged",
    "backfire","balanced","building","business","campaign","casualty","category",
    "chemical","children","clearest","combined","combined","consider","continue",
    "convince","creation","criminal","customer","daughter","deadline","decision",
    "decrease","delivery","describe","designed","dialogue","discover","document",
    "dominate","dramatic","economic","electric","enormous","everyone","exchange",
    "exercise","existing","expected","familiar","finished","football","frontier",
    "generate","greatest","handbook","heritage","historic","hospital","identify",
    "increase","indicate","industry","interest","language","learning","majority",
    "material","military","mountain","movement","multiple","national","negative",
    "notebook","official","organize","physical","positive","practice","precious",
    "preserve","previous","priority","probable","progress","property","proposal",
    "complete","reaching","resource","response","schedule","security","sentence",
    "separate","settings","solution","standard","strategy","strength","struggle",
    "terrible","together","transfer","ultimate","universe","valuable","violence",
    "whatever","yourself"
  ],

  getPoints(word) {
    return [...word.toLowerCase()].reduce((sum, c) => sum + (this.letterPoints[c] || 0), 0);
  },

  canMakeWord(word, letters) {
    const lowerWord = word.toLowerCase();
    const letterArr = [...letters.toLowerCase()];
    const wildcards = letterArr.filter(c => c === '?' || c === '*').length;
    const available = letterArr.filter(c => c !== '?' && c !== '*');
    let wildcardsUsed = 0;

    for (const ch of lowerWord) {
      const idx = available.indexOf(ch);
      if (idx !== -1) {
        available.splice(idx, 1);
      } else {
        wildcardsUsed++;
        if (wildcardsUsed > wildcards) return false;
      }
    }
    return true;
  },

  unscramble(letters, options = {}) {
    const { startsWith = '', endsWith = '', mustInclude = '', minLen = 2, maxLen = 15, lengthFilter = 'all', sortBy = 'length' } = options;
    const sw = startsWith.toLowerCase();
    const ew = endsWith.toLowerCase();
    const mi = mustInclude.toLowerCase();
    const lf = lengthFilter;

    let results = this.words.filter(word => {
      if (!this.canMakeWord(word, letters)) return false;
      if (sw && !word.startsWith(sw)) return false;
      if (ew && !word.endsWith(ew)) return false;
      if (mi && !word.includes(mi)) return false;
      if (lf !== 'all') {
        if (lf === '8+') { if (word.length < 8) return false; }
        else if (word.length !== parseInt(lf)) return false;
      }
      return true;
    });

    if (sortBy === 'alpha') {
      results.sort();
    } else if (sortBy === 'points') {
      results.sort((a, b) => this.getPoints(b) - this.getPoints(a));
    } else {
      // by length desc
      results.sort((a, b) => b.length - a.length || a.localeCompare(b));
    }

    return results;
  },

  groupByLength(words) {
    const groups = {};
    words.forEach(w => {
      const len = w.length;
      if (!groups[len]) groups[len] = [];
      groups[len].push(w);
    });
    return groups;
  }
};
