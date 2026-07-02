/* ===========================================================
   FIBEL — „Litera Ei cu Herzchen" · Claudia Toth © 2026
   Abecedar german interactiv pentru copii 4–8 ani.
   Temă: Eis 🍦 · „Ei wie Eis" · „Herzchen isst ein Eis".
   Ei = DIFTONG (se citește „ai").

   16 secțiuni: Start · Litera Ei · Suche Ei · Cuvinte · Citește (cuvinte+propoziții) ·
   Legare silabe (tap-tap) · Joc Ei · Wo hörst du Ei · der/die/das · Povestea lui Herzchen ·
   Carduri · Trasează (cu săgeți) · Scrie tu! (construiește cuvântul) ·
   Scrie propoziția (literă cu literă, cu săgeți) · Test · Diplomă.

   AUDIO: 🇩🇪 Hedda (WAV) · feedback = efecte WebAudio (fără voci de browser).
   =========================================================== */

const ICON = 'images/icons/';
const TOTAL_STEPS = 16;

/* ---------- dictionar de cuvinte ---------- */
const EI = {
  eis:       {de:'das Eis',       icon:'eis',       audio:'ei-eis',       gen:'n', art:'das', ro:'înghețata',  m:true},
  ei:        {de:'das Ei',        icon:'ei',        audio:'ei-ei',        gen:'n', art:'das', ro:'oul',        m:true},
  eimer:     {de:'der Eimer',     icon:'eimer',     audio:'ei-eimer',     gen:'m', art:'der', ro:'găleata',    m:true},
  eiche:     {de:'die Eiche',     icon:'eiche',     audio:'ei-eiche',     gen:'f', art:'die', ro:'stejarul',   m:true},
  eisenbahn: {de:'die Eisenbahn', icon:'eisenbahn', audio:'ei-eisenbahn', gen:'f', art:'die', ro:'trenul',     m:true},
  eisbaer:   {de:'der Eisbär',    icon:'eisbaer',   audio:'ei-eisbaer',   gen:'m', art:'der', ro:'ursul polar',m:true},
  maus:  {de:'die Maus',  icon:'m-maus',audio:'ei-maus',  gen:'f', art:'die', ro:'șoricelul', m:false},
  mond:  {de:'der Mond',  icon:'m-mond',audio:'ei-mond',  gen:'m', art:'der', ro:'luna',      m:false},
  ball:  {de:'der Ball',  icon:'ball',  audio:'ei-ball',  gen:'m', art:'der', ro:'mingea',    m:false},
  katze: {de:'die Katze', icon:'katze', audio:'ei-katze', gen:'f', art:'die', ro:'pisica',    m:false},
  apfel: {de:'der Apfel', icon:'apfel', audio:'ei-apfel', gen:'m', art:'der', ro:'mărul',     m:false},
  obst:  {de:'das Obst',  icon:'obst',  audio:'ei-obst',  gen:'n', art:'das', ro:'fructele',  m:false},
  tiger: {de:'der Tiger', icon:'tiger', audio:'ei-tiger', gen:'m', art:'der', ro:'tigrul',    m:false},
};
const WORDS_EI = ['eis','ei','eimer','eiche','eisenbahn','eisbaer'];
const GAME_POOL= ['eis','maus','ei','ball','eimer','katze'];
const ART_QUIZ = ['eis','ei','eimer','eiche'];
const GRID = [
  ['Ei','m','ei','N','b'],['l','ei','M','Ei','n'],['Ei','o','ei','d','Ei'],['t','Ei','a','ei','B'],['d','ei','M','Ei','w'],
];
const STORY = [
  {de:'Das ist <b class="m-bold">Herzchen</b>.',                          ro:'Acesta e Herzchen (inimioara).', icon:'herzchen', audio:'st-1'},
  {de:'<b class="m-bold">Herzchen</b> sieht ein <b class="m-bold">Eis</b>.',ro:'Herzchen vede o înghețată.',    icon:'eis',      audio:'st-2'},
  {de:'<b class="m-bold">Herzchen</b> isst ein <b class="m-bold">Eis</b>.', ro:'Herzchen mănâncă o înghețată.', icon:'eis',      audio:'st-3'},
  {de:'<b class="m-bold">Herzchen</b> ist glücklich.',                    ro:'Herzchen e fericit.',            icon:'herzchen', audio:'st-4'},
];
const QUIZ = [
  {type:'audio',   ans:'eis',     opts:['eis','maus','ball']},
  {type:'findm',   ans:'ei',      opts:['ei','katze','mond']},
  {type:'article', word:'eiche'},
  {type:'audio',   ans:'eisbaer', opts:['eisbaer','apfel','tiger']},
  {type:'findm',   ans:'eimer',   opts:['eimer','ball','obst']},
];
const LETTER = 'Ei';
const POS = [
  {icon:'eis',   audio:'ei-eis',   pos:'a'},
  {icon:'ei',    audio:'ei-ei',    pos:'a'},
  {icon:'eimer', audio:'ei-eimer', pos:'a'},
  {icon:'eiche', audio:'ei-eiche', pos:'a'},
];

/* ============== AUDIO ============== */
let curAudio = null;
function play(file, done){
  try { if (curAudio){ curAudio.pause(); curAudio = null; } } catch(e){}
  if (!file){ if (done) done(); return; }
  const a = new Audio('audio/' + file + '.wav'); curAudio = a;
  a.onended = () => { if (done) done(); };
  a.onerror = () => { if (done) done(); };
  const p = a.play(); if (p && p.catch) p.catch(()=>{ if (done) done(); });
}
let actx = null;
function tone(freq, dur, type, delay){
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + (delay||0);
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type||'sine'; o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.28, t0+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.start(t0); o.stop(t0+dur+0.02);
  }catch(e){}
}
function ding(){ tone(880,0.14,'sine',0); tone(1320,0.20,'sine',0.12); }
function buzz(){ tone(196,0.22,'triangle',0); }

/* ============== progres (salvare + reluare) ============== */
const PKEY = 'fibel-ei-step';
function saveProgress(n){ try{ localStorage.setItem(PKEY, String(n)); }catch(e){} }
function loadProgress(){ try{ return parseInt(localStorage.getItem(PKEY)||'0',10)||0; }catch(e){ return 0; } }
function clearProgress(){ try{ localStorage.removeItem(PKEY); }catch(e){} }

/* ============== UI helpers ============== */
const stage = document.getElementById('stage');
let step = 0;
function renderDots(){
  const d = document.getElementById('dots'); d.innerHTML = '';
  for (let i=0;i<TOTAL_STEPS;i++){
    const s = document.createElement('div');
    s.className = 'dot' + (i<step?' done':'') + (i===step?' active':'');
    s.title = 'Pasul ' + (i+1);
    (function(j){ s.onclick = ()=>go(j); })(i);
    d.appendChild(s);
  }
  const b = document.getElementById('backBtn'), f = document.getElementById('fwdBtn');
  if (b) b.disabled = (step <= 0);
  if (f) f.disabled = (step >= TOTAL_STEPS-1);
}
function show(html){ stage.innerHTML = '<div class="screen on">' + html + '</div>'; renderDots(); }
function go(n){ step = n; saveProgress(n); SCREENS[n](); window.scrollTo(0,0); }
function hero(cls){ return '<img class="mimi'+(cls?' '+cls:'')+'" src="'+ICON+'herzchen.svg" alt="Herzchen">'; }
function nextBtn(){ return '<div class="btn-row"><button class="big-btn amber" id="nb">Mai departe →</button></div>'; }
function wireNext(n){ const b=document.getElementById('nb'); if(b) b.onclick=()=>go(n); }
function escapeHtml(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function spreadShuffle(arr, isCorrect, cols){
  let a, tries=0;
  do { a = shuffle(arr); tries++;
    const hit = new Set(); a.forEach((k,i)=>{ if(isCorrect(k)) hit.add(i%cols); });
    if (hit.size>1) return a;
  } while(tries<25);
  return a;
}
function artBtns(){
  return '<div class="art-buttons">' +
    '<button class="art-btn der" data-g="m"><svg class="art-shape" viewBox="0 0 24 24"><polygon points="12,3 22,21 2,21"/></svg>der</button>' +
    '<button class="art-btn die" data-g="f"><svg class="art-shape" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>die</button>' +
    '<button class="art-btn das" data-g="n"><svg class="art-shape" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18"/></svg>das</button>' +
  '</div>';
}
function confetti(){
  const ems = ['🦋','⭐','🌟','🧡','🎨'];
  for (let i=0;i<22;i++){
    const c = document.createElement('div'); c.className='confetti'; c.textContent=ems[i%ems.length];
    c.style.left=Math.floor(Math.random()*100)+'vw'; c.style.animationDelay=(Math.random()*0.6)+'s';
    document.body.appendChild(c); setTimeout(()=>c.remove(),2600);
  }
}

/* ============== SCREENS ============== */
const SCREENS = {};

/* 0 — START */
SCREENS[0] = function(){
  const saved = loadProgress();
  const cont = (saved>0 && saved<TOTAL_STEPS-1)
    ? '<button class="big-btn amber" id="contBtn">▶ Continuă (pasul '+(saved+1)+')</button>' : '';
  show(
    hero() +
    '<p class="kicker">FIBEL · Abecedar german</p>' +
    '<h1 class="title">Litera Ei cu Herzchen</h1>' +
    '<button class="big-btn" id="startBtn">▶ Hai să ne jucăm!</button>' + cont +
    '<p class="parent-note">Pentru părinte: parcurge ecranele cu copilul. Herzchen spune cuvintele în germană (🔊), copilul ascultă, atinge și repetă.</p>' +
    '<button class="parent-btn" id="parentOpen">👩‍🏫 Pentru părinți</button>'
  );
  document.getElementById('startBtn').onclick = ()=>{ play('ei-wie-eis'); go(1); };
  const cb = document.getElementById('contBtn'); if (cb) cb.onclick = ()=>go(saved);
  document.getElementById('parentOpen').onclick = openParent;
};

/* 1 — LITERA Ei ei */
SCREENS[1] = function(){
  show(
    hero('small') +
    '<p class="kicker">Höre und wiederhole · Ascultă și repetă</p>' +
    '<div class="letter-hero">Ei<span class="lo">ei</span></div>' +
    '<div class="btn-row">' +
      '<button class="big-btn" id="bName">🔊 Ei</button>' +
      '<button class="big-btn amber" id="bMaus">🔊 Ei wie Eis</button>' +
    '</div>' +
    '<p class="parent-note">Atinge: „Ei" — se citește „ai" (un singur sunet!) · „Ei wie Eis" = Ei ca în Eis (înghețată).</p>' +
    nextBtn()
  );
  document.getElementById('bName').onclick = ()=>play('ei-name');
  document.getElementById('bMaus').onclick = ()=>play('ei-wie-eis');
  setTimeout(()=>play('ei-wie-eis'), 350);
  wireNext(2);
};

/* 2 — SUCHE Ei und ei */
SCREENS[2] = function(){
  let total = 0, cells = '';
  GRID.forEach(row=> row.forEach(ch=>{
    const isM = (ch==='Ei'||ch==='ei'); if(isM) total++;
    cells += '<div class="lcell" data-m="'+(isM?1:0)+'">'+ch+'</div>';
  }));
  show(
    '<p class="kicker">Suche Ei und ei 🔍</p>' +
    '<h1 class="title" style="font-size:1.4rem">Atinge toți Ei și ei</h1>' +
    '<div class="letter-grid">'+cells+'</div>' +
    '<p class="counter" id="cnt">0 / '+total+'</p>' +
    nextBtn()
  );
  let found = 0;
  stage.querySelectorAll('.lcell').forEach(el=>{
    el.onclick = function(){
      if (el.classList.contains('found')) return;
      if (el.dataset.m === '1'){
        el.classList.add('found'); found++; ding();
        document.getElementById('cnt').textContent = found+' / '+total;
        if (found>=total){ confetti(); setTimeout(()=>go(3), 900); }
      } else { el.classList.add('miss'); buzz(); setTimeout(()=>el.classList.remove('miss'),450); }
    };
  });
  wireNext(3);
};

/* 3 — CUVINTE CU Ei */
SCREENS[3] = function(){
  let cards = WORDS_EI.map(k=>{
    const w = EI[k];
    return '<div class="card" data-k="'+k+'">' +
      '<div class="circle ring-'+w.gen+'"><img src="'+ICON+w.icon+'.svg" alt="'+w.de+'"></div>' +
      '<div class="word"><span class="art-'+w.gen+'">'+w.art+'</span> '+w.de.split(' ')[1] +
        '<span class="ro">'+w.ro+'</span></div></div>';
  }).join('');
  show(
    '<p class="kicker">Atinge fiecare imagine 🧡</p>' +
    '<h1 class="title" style="font-size:1.5rem">Cuvinte cu Ei</h1>' +
    '<div class="cards">'+cards+'</div>' + nextBtn()
  );
  stage.querySelectorAll('.card').forEach(el=>{ el.onclick = ()=>{ el.classList.add('tapped'); play(EI[el.dataset.k].audio); }; });
  wireNext(4);
};

/* 4 — CITEȘTE! cuvinte + propoziții */
SCREENS[4] = function(){
  const READ = [
    {t:'Eis', a:'ei-eis'}, {t:'Ei', a:'ei-ei'}, {t:'Nina', a:'ei-nina'},
    {t:'Nora', a:'ei-nora'}, {t:'Oma', a:'ei-oma'}, {t:'Tom', a:'ei-tom'}
  ];
  const SENT = [
    {t:'Tom malt.', a:'st-tommalt'}, {t:'Nina malt.', a:'st-ninamalt'}
  ];
  let pills = READ.map((w,i)=>'<div class="readword" data-i="'+i+'">'+w.t+'</div>').join('');
  let sents = SENT.map((s,i)=>'<div class="readsent" data-s="'+i+'"><span>'+s.t+'</span><span class="rs-play">🔊</span></div>').join('');
  show(
    hero('small') +
    '<p class="kicker">Citește! 📖</p>' +
    '<h1 class="title" style="font-size:1.1rem">Cu literele învățate + Ei</h1>' +
    '<div class="read-row">'+pills+'</div>' +
    '<p class="kicker" style="margin-top:8px;color:var(--terra)">Și propoziții! ✨</p>' +
    '<div class="sent-col">'+sents+'</div>' +
    '<p class="parent-note">Atinge cuvintele și propozițiile. Copilul citește din literele învățate. 🎉</p>' + nextBtn()
  );
  stage.querySelectorAll('.readword').forEach(el=>{ el.onclick=()=>{ el.classList.add('tapped'); play(READ[+el.dataset.i].a); }; });
  stage.querySelectorAll('.readsent').forEach(el=>{ el.onclick=()=>{ el.classList.add('tapped'); play(SENT[+el.dataset.s].a); }; });
  wireNext(5);
};

/* 5 — LEGARE SILABE */
SCREENS[5] = function(){
  const LEFT  = ['Ei','No','Mo','O'];
  const RIGHT = ['mer','ra','na','ma'];
  const VALID = {
    'Ei|mer': {w:'Eimer', a:'ei-eimer'},
    'No|ra':  {w:'Nora',  a:'ei-nora'},
    'Mo|na':  {w:'Mona',  a:'ei-mona'},
    'O|ma':   {w:'Oma',   a:'ei-oma'}
  };
  const need = LEFT.length;
  let leftTiles  = shuffle(LEFT).map((s,i)=>'<button class="syll s-left" data-s="'+s+'" data-i="'+i+'">'+s+'</button>').join('');
  let rightTiles = shuffle(RIGHT).map((s,i)=>'<button class="syll s-right" data-s="'+s+'" data-i="'+i+'">'+s+'</button>').join('');
  show(
    hero('small') +
    '<p class="kicker">Verbinde die Silben 🔗</p>' +
    '<h1 class="title" style="font-size:1.15rem">Leagă silabele → cuvântul</h1>' +
    '<p class="parent-note" style="margin-top:0">Atinge o silabă din stânga, apoi una din dreapta ca să faci un cuvânt.</p>' +
    '<div class="syll-wrap" id="sw">' +
      '<svg class="syll-lines" id="slines"></svg>' +
      '<div class="syll-col">'+leftTiles+'</div>' +
      '<div class="syll-col">'+rightTiles+'</div>' +
    '</div>' +
    '<div class="syll-made" id="smade"></div>' +
    nextBtn()
  );
  let selLeft = null, done = 0;
  const sw = document.getElementById('sw');
  const slines = document.getElementById('slines');
  function center(el){
    const r = el.getBoundingClientRect(), w = sw.getBoundingClientRect();
    return { x: r.left - w.left + r.width/2, y: r.top - w.top + r.height/2 };
  }
  function clearSel(){ stage.querySelectorAll('.s-left.sel').forEach(e=>e.classList.remove('sel')); selLeft=null; }
  stage.querySelectorAll('.s-left').forEach(el=>{
    el.onclick = function(){
      if (el.classList.contains('done')) return;
      clearSel(); el.classList.add('sel'); selLeft = el;
    };
  });
  stage.querySelectorAll('.s-right').forEach(el=>{
    el.onclick = function(){
      if (!selLeft){ buzz(); return; }
      const hit = VALID[selLeft.dataset.s + '|' + el.dataset.s];
      if (hit){
        const a = center(selLeft), b = center(el), ns = 'http://www.w3.org/2000/svg';
        const ln = document.createElementNS(ns,'line');
        ln.setAttribute('x1',a.x); ln.setAttribute('y1',a.y);
        ln.setAttribute('x2',b.x); ln.setAttribute('y2',b.y);
        ln.setAttribute('class','sl-line');
        slines.appendChild(ln);
        selLeft.classList.add('done'); selLeft.classList.remove('sel');
        ding(); play(hit.a);
        document.getElementById('smade').innerHTML += '<span class="made-pill">'+hit.w+' ✓</span>';
        selLeft = null; done++;
        if (done>=need){ confetti(); setTimeout(()=>go(6), 1200); }
      } else {
        buzz(); el.classList.add('bad'); setTimeout(()=>el.classList.remove('bad'),450); clearSel();
      }
    };
  });
  wireNext(6);
};

/* 6 — JOC: beginnt mit Ei? */
SCREENS[6] = function(){
  let tiles = spreadShuffle(GAME_POOL, k=>EI[k].m, 2).map(k=>
    '<div class="tile" data-k="'+k+'" style="position:relative"><img src="'+ICON+EI[k].icon+'.svg" alt="'+EI[k].de+'"></div>'
  ).join('');
  show(
    hero('small') +
    '<p class="game-q">Atinge ce începe cu <span class="m-hi">Ei</span>!</p>' +
    '<div class="game-grid">'+tiles+'</div>' +
    '<p class="parent-note">Welches Bild beginnt mit Ei?</p>'
  );
  let found = 0; const need = GAME_POOL.filter(k=>EI[k].m).length;
  stage.querySelectorAll('.tile').forEach(el=>{
    el.onclick = function(){
      const w = EI[el.dataset.k];
      if (el.classList.contains('good')) return;
      if (w.m){ el.classList.add('good'); ding(); play(w.audio); found++;
        if (found>=need){ confetti(); setTimeout(()=>go(7), 1000); }
      } else { el.classList.add('bad'); buzz(); setTimeout(()=>el.classList.remove('bad'),450); }
    };
  });
};

/* 7 — WO HÖRST DU? */
SCREENS[7] = function(){
  let qi = 0;
  function round(){
    const it = POS[qi];
    show(
      hero('small') +
      '<p class="kicker">Wo hörst du das <span class="m-hi">'+LETTER+'</span>? 👂</p>' +
      '<div class="circle" style="margin:0 auto;border-color:var(--auriu)"><img src="'+ICON+it.icon+'.svg" alt=""></div>' +
      '<button class="sound-btn pulse" id="paudio" aria-label="Asculta">🔊</button>' +
      '<div class="pos-row">' +
        '<button class="pos-btn" data-p="a"><span class="pos-dots"><b>●</b>○○</span>la început<small>am Anfang</small></button>' +
        '<button class="pos-btn" data-p="m"><span class="pos-dots">○<b>●</b>○</span>la mijloc<small>in der Mitte</small></button>' +
        '<button class="pos-btn" data-p="e"><span class="pos-dots">○○<b>●</b></span>la sfârșit<small>am Ende</small></button>' +
      '</div>' +
      '<p class="fb" id="fb">&nbsp;</p>' +
      '<p class="counter">'+(qi+1)+' / '+POS.length+'</p>'
    );
    play(it.audio);
    document.getElementById('paudio').onclick = ()=>play(it.audio);
    const fb=document.getElementById('fb');
    stage.querySelectorAll('.pos-btn').forEach(b=>{
      b.onclick=function(){
        if(b.dataset.p===it.pos){
          ding(); b.classList.add('good'); fb.className='fb ok'; fb.textContent='✓ Bravo!';
          qi++;
          if(qi<POS.length) setTimeout(round,1000);
          else { confetti(); setTimeout(()=>go(8),1000); }
        } else { buzz(); b.classList.add('bad'); fb.className='fb no'; fb.textContent='Mai ascultă o dată!'; setTimeout(()=>b.classList.remove('bad'),450); }
      };
    });
  }
  round();
};

/* 8 — der / die / das */
SCREENS[8] = function(){
  let idx = 0;
  function round(){
    const w = EI[ART_QUIZ[idx]];
    show(
      '<p class="kicker">der · die · das?</p>' +
      '<div class="circle ring-'+w.gen+'" style="margin:0 auto"><img src="'+ICON+w.icon+'.svg" alt="'+w.de+'"></div>' +
      '<h1 class="title" style="font-size:1.6rem">___ '+w.de.split(' ')[1]+'<span class="word"><span class="ro">'+w.ro+'</span></span></h1>' +
      artBtns() +
      '<p class="fb" id="fb">&nbsp;</p>' +
      '<p class="counter">'+(idx+1)+' / '+ART_QUIZ.length+'</p>'
    );
    play(w.audio);
    const fb = document.getElementById('fb');
    stage.querySelectorAll('.art-btn').forEach(b=>{
      b.onclick = function(){
        if (b.dataset.g === w.gen){
          ding(); fb.className='fb ok'; fb.textContent='✓ '+w.de; play(w.audio);
          idx++;
          if (idx < ART_QUIZ.length) setTimeout(round, 1100);
          else { confetti(); setTimeout(()=>go(9), 1100); }
        } else { buzz(); fb.className='fb no'; fb.textContent='Mai încearcă!'; }
      };
    });
  }
  round();
};

/* 9 — POVESTEA LUI HERZCHEN */
SCREENS[9] = function(){
  let rows = STORY.map((s,i)=>
    '<div class="story-row" data-i="'+i+'">' +
      '<img src="'+ICON+s.icon+'.svg" alt="">' +
      '<div><div class="s-de">'+s.de+'</div><div class="s-ro">'+s.ro+'</div></div>' +
      '<div class="s-play">🔊</div></div>'
  ).join('');
  show(
    hero('small') +
    '<p class="kicker">Povestea lui Herzchen 📖</p>' +
    '<div class="story">'+rows+'</div>' +
    '<div class="btn-row">' +
      '<button class="big-btn" id="playAll">🔊 Ascultă tot</button>' +
      '<button class="big-btn amber" id="nb">Mai departe →</button></div>'
  );
  stage.querySelectorAll('.story-row').forEach(el=>{
    el.onclick = ()=>{ el.classList.add('read'); play(STORY[+el.dataset.i].audio); };
  });
  document.getElementById('playAll').onclick = function(){
    let i = 0;
    (function chain(){
      if (i>=STORY.length) return;
      const row = stage.querySelector('.story-row[data-i="'+i+'"]'); if (row) row.classList.add('read');
      play(STORY[i].audio, ()=>{ i++; setTimeout(chain, 250); });
    })();
  };
  wireNext(10);
};

/* 10 — CARDURI */
SCREENS[10] = function(){
  let i = 0;
  function card(){
    const w = EI[WORDS_EI[i]];
    show(
      '<p class="kicker">Carduri · Întoarce cardul 🃏</p>' +
      '<div class="flip-card" id="fc"><div class="flip-inner">' +
        '<div class="flip-face flip-front">' +
          '<div class="circle ring-'+w.gen+'"><img src="'+ICON+w.icon+'.svg" alt=""></div>' +
          '<div class="flip-hint">Atinge cardul 👆</div></div>' +
        '<div class="flip-face flip-back">' +
          '<div class="big-word"><span class="art-'+w.gen+'">'+w.art+'</span> '+w.de.split(' ')[1] +
          '<span class="ro">'+w.ro+'</span></div>' +
          '<div class="flip-hint">🔊</div></div>' +
      '</div></div>' +
      '<div class="flashnav">' +
        '<button class="navbtn" id="cprev">←</button>' +
        '<span class="counter">'+(i+1)+' / '+WORDS_EI.length+'</span>' +
        '<button class="navbtn" id="cnext">→</button></div>' +
      nextBtn()
    );
    const fc = document.getElementById('fc');
    fc.onclick = ()=>{ fc.classList.toggle('flipped'); play(w.audio); };
    play(w.audio);
    const pv=document.getElementById('cprev'), nx=document.getElementById('cnext');
    pv.disabled = (i<=0); nx.disabled = (i>=WORDS_EI.length-1);
    pv.onclick = ()=>{ if(i>0){ i--; card(); } };
    nx.onclick = ()=>{ if(i<WORDS_EI.length-1){ i++; card(); } };
    wireNext(11);
  }
  card();
};

/* 11 — TRASEAZA Ei / ei — cu SĂGEȚI */
SCREENS[11] = function(){
  let glyph = 'Ei';
  const STROKE = {'Ei':'stroke-big','ei':'stroke-small'};
  function render(){
    show(
      '<p class="kicker">Schreiben · ① urmează săgețile verzi ✏️</p>' +
      '<div class="btn-row" style="margin-bottom:2px">' +
        '<button class="big-btn'+(glyph==='Ei'?'':' amber')+'" id="gM">Ei mare</button>' +
        '<button class="big-btn'+(glyph==='ei'?'':' amber')+'" id="gm">ei mic</button></div>' +
      '<div class="trace-wrap"><img class="trace-stroke" src="'+ICON+STROKE[glyph]+'.svg" alt="">' +
        '<canvas id="traceCanvas" width="260" height="260"></canvas></div>' +
      '<div class="btn-row">' +
        '<button class="big-btn amber" id="clearBtn">↺ Șterge</button>' +
        '<button class="big-btn" id="doneTrace">Gata! ✓</button></div>'
    );
    const cv = document.getElementById('traceCanvas'); const ctx = cv.getContext('2d');
    ctx.lineWidth=9; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#10b981';
    let drawing=false;
    function pos(e){ const r=cv.getBoundingClientRect(); const p=e.touches?e.touches[0]:e;
      return {x:(p.clientX-r.left)*(cv.width/r.width), y:(p.clientY-r.top)*(cv.height/r.height)}; }
    cv.addEventListener('pointerdown',e=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault();});
    cv.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault();});
    window.addEventListener('pointerup',()=>{drawing=false;});
    document.getElementById('clearBtn').onclick=()=>ctx.clearRect(0,0,cv.width,cv.height);
    document.getElementById('gM').onclick=()=>{glyph='Ei';render();};
    document.getElementById('gm').onclick=()=>{glyph='ei';render();};
    document.getElementById('doneTrace').onclick=()=>{ ding(); go(12); };
  }
  render();
};

/* 12 — SCRIE TU! construiește cuvântul */
SCREENS[12] = function(){
  const BUILD = [
    {w:'Ei',  a:'ei-ei'},
    {w:'Eis', a:'ei-eis'},
    {w:'Tom', a:'ei-tom'},
    {w:'Oma', a:'ei-oma'}
  ];
  let idx = 0;
  function round(){
    const it = BUILD[idx];
    const target = it.w.split('');
    let slots = target.map((c,i)=>'<span class="bslot" data-i="'+i+'"></span>').join('');
    let tiles = shuffle(target).map((c,i)=>'<button class="bletter" data-c="'+c+'" data-i="'+i+'">'+c+'</button>').join('');
    show(
      hero('small') +
      '<p class="kicker">Scrie tu! ✍️ · Construiește cuvântul</p>' +
      '<button class="sound-btn pulse" id="bsound" aria-label="Ascultă">🔊</button>' +
      '<div class="build-slots">'+slots+'</div>' +
      '<div class="build-pool">'+tiles+'</div>' +
      '<p class="fb" id="fb">&nbsp;</p>' +
      '<p class="counter">'+(idx+1)+' / '+BUILD.length+'</p>'
    );
    play(it.a);
    document.getElementById('bsound').onclick = ()=>play(it.a);
    let pos = 0;
    const fb = document.getElementById('fb');
    stage.querySelectorAll('.bletter').forEach(el=>{
      el.onclick = function(){
        if (el.classList.contains('used')) return;
        if (el.dataset.c === target[pos]){
          const slot = stage.querySelector('.bslot[data-i="'+pos+'"]');
          slot.textContent = el.dataset.c; slot.classList.add('filled');
          el.classList.add('used'); ding(); pos++;
          if (pos>=target.length){
            fb.className='fb ok'; fb.textContent='✓ '+it.w; play(it.a);
            idx++;
            if (idx<BUILD.length) setTimeout(round, 1300);
            else { confetti(); setTimeout(()=>go(13), 1300); }
          }
        } else { buzz(); el.classList.add('bad'); fb.className='fb no'; fb.textContent='Care literă urmează?'; setTimeout(()=>el.classList.remove('bad'),450); }
      };
    });
  }
  round();
};

/* 13 — SCRIE PROPOZIȚIA */
SCREENS[13] = function(){
  const GLYPH = {'N':'s-cap-n','S':'s-cap-s','R':'s-cap-r','L':'s-cap-l','M':'s-cap-m','T':'s-cap-t',
                 'n':'s-n','s':'s-s','r':'s-r','t':'s-t','m':'s-m','a':'s-a','i':'s-i','l':'s-l','o':'s-o'};
  const SENT = [
    {t:'Tom malt.', a:'st-tommalt'},
    {t:'Nina malt.', a:'st-ninamalt'}
  ];
  function rowHtml(text){
    let cells='';
    for (const ch of text){
      if (ch===' ') cells += '<span class="stl-gap"></span>';
      else if (GLYPH[ch]) cells += '<span class="stl-cell"><img src="'+ICON+GLYPH[ch]+'.svg" alt="'+ch+'"></span>';
      else cells += '<span class="stl-punct">'+ch+'</span>';
    }
    return cells;
  }
  let rows = SENT.map((s,i)=>
    '<div class="stl-block">' +
      '<div class="stl-head"><span>'+s.t+'</span>' +
        '<button class="stl-mini" data-a="'+s.a+'">🔊</button>' +
        '<button class="stl-mini stl-clear" data-i="'+i+'">↺</button></div>' +
      '<div class="stl-wrap" data-i="'+i+'">'+rowHtml(s.t)+
        '<canvas class="stl-canvas" data-i="'+i+'"></canvas></div>' +
    '</div>'
  ).join('');
  show(
    hero('small') +
    '<p class="kicker">Scrie propoziția ✏️ · urmează săgețile</p>' +
    '<p class="parent-note" style="margin-top:0">Fiecare literă cu săgețuța ei. Trasează cu degetul peste literele cenușii.</p>' +
    rows +
    '<div class="btn-row"><button class="big-btn" id="doneS">Gata! ✓</button></div>'
  );
  stage.querySelectorAll('.stl-wrap').forEach(wrap=>{
    const cv = wrap.querySelector('.stl-canvas');
    const r = wrap.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width)); cv.height = Math.max(1, Math.round(r.height));
    const ctx = cv.getContext('2d');
    ctx.lineWidth=6; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#10b981';
    let drawing=false;
    function pos(e){ const b=cv.getBoundingClientRect(); const p=e.touches?e.touches[0]:e;
      return {x:(p.clientX-b.left)*(cv.width/b.width), y:(p.clientY-b.top)*(cv.height/b.height)}; }
    cv.addEventListener('pointerdown',e=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault();});
    cv.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault();});
    window.addEventListener('pointerup',()=>{drawing=false;});
  });
  stage.querySelectorAll('.stl-mini').forEach(b=>{ if(b.dataset.a) b.onclick=()=>play(b.dataset.a); });
  stage.querySelectorAll('.stl-clear').forEach(b=> b.onclick=function(){
    const cv = stage.querySelector('.stl-canvas[data-i="'+b.dataset.i+'"]');
    cv.getContext('2d').clearRect(0,0,cv.width,cv.height);
  });
  document.getElementById('doneS').onclick=()=>{ ding(); go(14); };
};

/* 14 — TEST */
SCREENS[14] = function(){
  let qi = 0, stars = 0;
  function starbar(){
    let s=''; for(let k=0;k<QUIZ.length;k++) s += (k<stars ? '⭐' : '<span class="off">⭐</span>');
    return '<div class="quiz-stars">'+s+'</div>';
  }
  function win(){ stars++; ding(); qi++;
    if (qi < QUIZ.length) setTimeout(q, 950);
    else { confetti(); setTimeout(()=>go(15), 1000); }
  }
  function wrong(el){ buzz(); el.classList.add('bad'); setTimeout(()=>el.classList.remove('bad'),450); }
  function q(){
    const it = QUIZ[qi]; let body='';
    if (it.type==='audio'){
      body = '<p class="game-q">Ascultă 🔊 și atinge imaginea</p>' +
        '<button class="sound-btn pulse" id="qaudio" aria-label="Ascultă">🔊</button>' +
        '<div class="opt-grid">'+ shuffle(it.opts).map(k=>'<div class="opt" data-k="'+k+'"><img src="'+ICON+EI[k].icon+'.svg" alt=""></div>').join('') +'</div>';
    } else if (it.type==='findm'){
      body = '<p class="game-q">Care începe cu <span class="m-hi">Ei</span>?</p>' +
        '<div class="opt-grid">'+ shuffle(it.opts).map(k=>'<div class="opt" data-k="'+k+'"><img src="'+ICON+EI[k].icon+'.svg" alt=""></div>').join('') +'</div>';
    } else {
      const w = EI[it.word];
      body = '<p class="game-q">der · die · das?</p>' +
        '<div class="circle ring-'+w.gen+'" style="margin:0 auto"><img src="'+ICON+w.icon+'.svg" alt=""></div>' +
        '<h1 class="title" style="font-size:1.4rem">___ '+w.de.split(' ')[1]+'</h1>' +
        artBtns();
    }
    show(hero('small') + '<p class="kicker">Provocarea lui Herzchen 🏆</p>' + starbar() + body +
         '<p class="counter">'+(qi+1)+' / '+QUIZ.length+'</p>');
    if (it.type==='audio'){
      const wa = EI[it.ans];
      document.getElementById('qaudio').onclick = ()=>play(wa.audio);
      setTimeout(()=>play(wa.audio), 350);
      stage.querySelectorAll('.opt').forEach(el=> el.onclick = function(){
        if (el.dataset.k === it.ans){ el.classList.add('good'); play(EI[el.dataset.k].audio); win(); } else wrong(el);
      });
    } else if (it.type==='findm'){
      stage.querySelectorAll('.opt').forEach(el=> el.onclick = function(){
        if (EI[el.dataset.k].m){ el.classList.add('good'); play(EI[el.dataset.k].audio); win(); } else wrong(el);
      });
    } else {
      const w = EI[it.word]; play(w.audio);
      stage.querySelectorAll('.art-btn').forEach(b=> b.onclick = function(){
        if (b.dataset.g === w.gen){ play(w.audio); win(); } else wrong(b);
      });
    }
  }
  q();
};

/* 15 — BRAVO + DIPLOMA + rima */
SCREENS[15] = function(){
  show(
    hero() +
    '<h1 class="title">Bravo! 🎉</h1>' +
    '<div class="stars-won">⭐⭐⭐⭐⭐</div>' +
    '<div class="story" style="max-width:380px"><div class="story-row read" id="rima">' +
      '<img src="'+ICON+'eis.svg" alt="">' +
      '<div><div class="s-de"><b class="m-bold">Ei</b> wie <b class="m-bold">Eis</b>.<br><b class="m-bold">Herzchen</b> isst ein <b class="m-bold">Eis</b>.</div>' +
      '<div class="s-ro">Ei ca în Eis. Herzchen mănâncă o înghețată.</div></div>' +
      '<div class="s-play">🔊</div></div></div>' +
    '<div class="diploma-card">' +
      '<div style="font-weight:700;color:#065f46">🏅 Diploma ta</div>' +
      '<input class="name-input" id="dipName" placeholder="Scrie numele copilului" maxlength="28">' +
      '<button class="big-btn" id="printDip">🖨️ Tipărește diploma</button>' +
      '<button class="big-btn amber" id="printColor">🖨️ Pagina de colorat 🎨</button>' +
    '</div>' +
    '<div class="btn-row"><button class="big-btn amber" id="again">🔁 Încă o dată</button></div>'
  );
  confetti(); play('rima');
  document.getElementById('rima').onclick = ()=>play('rima');
  document.getElementById('printDip').onclick = printDiploma;
  document.getElementById('printColor').onclick = printColoring;
  document.getElementById('again').onclick = ()=>{ clearProgress(); go(0); };
};

/* asteapta sa se incarce imaginile din elementul de print, apoi printeaza */
function printAfterImages(el){
  const imgs = el.querySelectorAll('img');
  let pending = 0, done = false;
  function go(){ if (done) return; done = true; window.print(); }
  imgs.forEach(im=>{
    if (!im.complete){ pending++;
      im.addEventListener('load', ()=>{ if (--pending<=0) go(); });
      im.addEventListener('error', ()=>{ if (--pending<=0) go(); });
    }
  });
  if (pending === 0) go(); else setTimeout(go, 1800);
}

function printDiploma(){
  const name = (document.getElementById('dipName').value||'').trim() || '. . . . . . . . . .';
  const d = new Date();
  const date = d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();
  document.getElementById('coloring-print').innerHTML = '';
  document.getElementById('diploma-print').innerHTML =
    '<div class="dip">' +
      '<div class="dip-brand"><img src="images/butterfly-emerald.png" class="bf-inline" alt="">Claudia Toth · FIBEL · Deutsch für Kinder</div>' +
      '<img src="'+ICON+'herzchen.svg" alt="Herzchen">' +
      '<h1>URKUNDE</h1>' +
      '<div class="dip-text">Diese Urkunde bekommt</div>' +
      '<div class="dip-name">'+escapeHtml(name)+'</div>' +
      '<div class="dip-text">Du hast den Buchstaben gelernt:</div>' +
      '<div class="dip-letter">Ei ei</div>' +
      '<div class="dip-text">Ei wie Eis — mit Herzchen! 🧡</div>' +
      '<div class="dip-stars">⭐ ⭐ ⭐ ⭐ ⭐</div>' +
      '<div class="dip-foot">Datum: '+date+' · Claudia Toth · © 2026</div>' +
    '</div>';
  printAfterImages(document.getElementById('diploma-print'));
}

function printColoring(){
  document.getElementById('diploma-print').innerHTML = '';
  document.getElementById('coloring-print').innerHTML =
    '<div class="color-page">' +
      '<div class="cp-head"><img src="images/butterfly-emerald.png" class="bf-inline" alt="">Claudia Toth · FIBEL · ABC-Geschichte mit Herzchen · Ausmalbild</div>' +
      '<h2 class="cp-title">Ei — Herzchen isst ein Eis</h2>' +
      '<img src="'+ICON+'herzchen-color.svg" alt="Herzchen isst ein Eis">' +
      '<div class="cp-sentence">Herzchen isst ein Eis.</div>' +
      '<div class="cp-foot">Colorează imaginea și citește propoziția! · © 2026</div>' +
    '</div>';
  printAfterImages(document.getElementById('coloring-print'));
}

/* ============== navigare globala ============== */
(function initNav(){
  const b = document.getElementById('backBtn'), f = document.getElementById('fwdBtn');
  if (b) b.onclick = ()=>{ if (step>0) go(step-1); };
  if (f) f.onclick = ()=>{ if (step<TOTAL_STEPS-1) go(step+1); };
})();

/* ============== mod parinte/profesor ============== */
function openParent(){ const ov=document.getElementById('parentOverlay'); if (ov) ov.classList.add('on'); }
(function initParent(){
  const ov=document.getElementById('parentOverlay'),
        cl=document.getElementById('parentClose'), wl=document.getElementById('parentWords');
  if (wl) wl.innerHTML = WORDS_EI.map(k=>'<span>'+EI[k].de+'</span>').join('');
  if (cl) cl.onclick = ()=>ov.classList.remove('on');
  if (ov) ov.onclick = (e)=>{ if (e.target===ov) ov.classList.remove('on'); };
})();

/* ============== boot ============== */
go(0);
