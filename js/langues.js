window.USP_LANGUES={"langs": ["fr", "en", "ar", "tr", "ps", "ku", "ro", "ka", "sq", "am", "zh", "prs", "es", "pt", "ru", "uk", "mo"], "labels": {"fr": "Français", "ar": "العربية", "tr": "Türkçe", "en": "English", "ps": "پښتو", "ku": "Kurdî (Soranî)", "ka": "ქართული", "ro": "Română", "sq": "Shqip", "am": "አማርኛ", "zh": "中文", "prs": "دری", "es": "Español", "pt": "Português", "ru": "Русский", "uk": "Українська", "mo": "Moldovenească"}, "flags": {"fr": "img/drapeaux/fr.png", "en": "img/drapeaux/gb-eng.png", "ar": "img/drapeaux/sa.png", "tr": "img/drapeaux/tr.png", "ps": "img/drapeaux/af.png", "ku": "img/drapeaux/iq.png", "ro": "img/drapeaux/ro.png", "ka": "img/drapeaux/ge.png", "sq": "img/drapeaux/al.png", "am": "img/drapeaux/et.png", "zh": "img/drapeaux/cn.png", "prs": "img/drapeaux/af.png", "es": "img/drapeaux/es.png", "pt": "img/drapeaux/pt.png", "ru": "img/drapeaux/ru.png", "uk": "img/drapeaux/ua.png", "mo": "img/drapeaux/md.png"}, "choisir": {"fr": "Choisissez votre langue", "en": "Choose your language", "ar": "اختر لغتك", "tr": "Dilinizi seçin", "ps": "خپله ژبه وټاکئ", "ku": "زمانەکەت هەڵبژێرە", "ro": "Alegeți limba dumneavoastră", "ka": "აირჩიეთ თქვენი ენა", "sq": "Zgjidhni gjuhën tuaj", "am": "ቋንቋዎን ይምረጡ", "zh": "选择您的语言", "prs": "زبان خود را انتخاب کنید", "es": "Elija su idioma", "pt": "Escolha o seu idioma", "ru": "Выберите свой язык", "uk": "Оберіть свою мову", "mo": "Alegeți limba dumneavoastră"}, "rtl": ["ar", "ps", "ku", "prs"], "ui": {"syRendre": {"fr": "S'y rendre", "en": "Get directions", "ar": "الاتجاهات", "tr": "Yol tarifi", "ps": "لارښوونه", "ku": "ڕێنمایی ڕێگا", "ro": "Cum ajungeți", "mo": "Cum ajungeți", "ka": "მარშრუტი", "sq": "Udhëzime", "am": "አቅጣጫ", "zh": "路线", "prs": "مسیر", "es": "Cómo llegar", "pt": "Como chegar", "ru": "Маршрут", "uk": "Маршрут"}, "accueil": {"fr": "Accueil", "en": "Home", "ar": "الصفحة الرئيسية", "tr": "Ana sayfa", "ps": "کور پاڼه", "ku": "سەرەتا", "ro": "Acasă", "mo": "Acasă", "ka": "მთავარი", "sq": "Kreu", "am": "መነሻ ገጽ", "zh": "首页", "prs": "صفحهٔ اصلی", "es": "Inicio", "pt": "Início", "ru": "Главная", "uk": "Головна"}, "ouq": {"fr": "Où et quand nous trouver", "en": "Where and when to find us", "ar": "أين ومتى تجدوننا", "tr": "Bizi nerede ve ne zaman bulabilirsiniz", "ps": "موږ چېرته او کله پیدا کړئ", "ku": "لە کوێ و کەی دەمانبیننەوە", "ro": "Unde și când ne găsiți", "mo": "Unde și când ne găsiți", "ka": "სად და როდის გვიპოვოთ", "sq": "Ku dhe kur të na gjeni", "am": "የት እና መቼ ያገኙናል", "zh": "我们的地点和时间", "prs": "ما را کجا و چه وقت پیدا کنید", "es": "Dónde y cuándo encontrarnos", "pt": "Onde e quando nos encontrar", "ru": "Где и когда нас найти", "uk": "Де і коли нас знайти"}}, "degrades": {"fr": "linear-gradient(90deg,#002395,#ED2939)", "en": "linear-gradient(90deg,#00247D,#CF142B)", "ar": "linear-gradient(90deg,#006C35,#0a8f46)", "tr": "linear-gradient(90deg,#E30A17,#b5050f)", "ps": "linear-gradient(90deg,#000000,#D32011,#007A36)", "ku": "linear-gradient(90deg,#EE1B24,#FDE816,#007A3D)", "ro": "linear-gradient(90deg,#002B7F,#FCD116,#CE1126)", "ka": "linear-gradient(90deg,#FF0000,#c40000)", "sq": "linear-gradient(90deg,#E41E20,#2b2b2b)", "am": "linear-gradient(90deg,#078930,#FCDD09,#DA121A)", "zh": "linear-gradient(90deg,#DE2910,#FFDE00)", "prs": "linear-gradient(90deg,#000000,#D32011,#007A36)", "es": "linear-gradient(90deg,#AA151B,#F1BF00)", "pt": "linear-gradient(90deg,#046A38,#DA291C,#FFCC00)", "ru": "linear-gradient(90deg,#0039A6,#D52B1E)", "uk": "linear-gradient(90deg,#005BBB,#FFD500)", "mo": "linear-gradient(90deg,#002B7F,#FCD116,#CE1126)"}};
(function(){
  var L=window.USP_LANGUES, P=window.USP_PAGE||{};
  var CLE='usp-langue';
  var entete=document.querySelector('.entete .wrap');
  if(!entete) return;

  // Sélecteur de langue, copie conforme de celui du site de vaccination au collège
  var CHEVRON='<svg class="langChevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function drapeau(l,cls){return '<img class="'+cls+'" src="'+(L.flags[l]||L.flags.fr)+'" alt="">';}
  var bloc=document.createElement('div');
  bloc.className='langButtons'; bloc.setAttribute('aria-label','Langue');
  bloc.innerHTML='<span class="langHint" aria-hidden="true"></span>'+
    '<div class="langPanelWrap"><button type="button" class="langSwitcherBtn" aria-haspopup="listbox" aria-expanded="false">'+
    '<span class="langSwitcherFlag"></span><span class="langSwitcherText"></span>'+CHEVRON+'</button>'+
    '<div class="langPanel" role="listbox" hidden></div></div>';
  var logoG=entete.querySelector('.logo-lien, .logo-ghsif');
  entete.insertBefore(bloc, logoG);
  var btn=bloc.querySelector('.langSwitcherBtn'), panel=bloc.querySelector('.langPanel');
  var txt=bloc.querySelector('.langSwitcherText'), drap=bloc.querySelector('.langSwitcherFlag');
  var hint=bloc.querySelector('.langHint');

  // La phrase d'invitation défile dans les 17 langues, aux couleurs de chaque drapeau
  var i=0;
  function peindre(){var c=L.langs[i%L.langs.length]; hint.textContent=L.choisir[c]||''; hint.style.backgroundImage=L.degrades[c]||L.degrades.fr;}
  peindre();
  setInterval(function(){
    hint.style.opacity=0;
    setTimeout(function(){i=(i+1)%L.langs.length; peindre(); hint.style.opacity=1;},300);
  },1800);

  var langue='fr';
  function construirePanneau(){
    txt.textContent=L.labels[langue]||langue;
    drap.innerHTML=drapeau(langue,'langDrapeau');
    panel.innerHTML='';
    L.langs.forEach(function(l){
      var on=l===langue, b=document.createElement('button'); b.type='button';
      b.setAttribute('role','option'); b.setAttribute('aria-selected',on?'true':'false');
      b.className='langOption'+(on?' active':'');
      b.setAttribute('lang',l);
      b.innerHTML='<span class="langCheck" aria-hidden="true">'+(on?'✓':'')+'</span>'+drapeau(l,'langOptionFlag')+'<span>'+(L.labels[l]||l)+'</span>';
      b.addEventListener('click',function(){panel.hidden=true;btn.setAttribute('aria-expanded','false');if(l!==langue)changer(l);});
      panel.appendChild(b);
    });
  }
  btn.addEventListener('click',function(e){e.stopPropagation();panel.hidden=!panel.hidden;btn.setAttribute('aria-expanded',panel.hidden?'false':'true');});
  document.addEventListener('click',function(e){if(!panel.hidden && !bloc.contains(e.target)){panel.hidden=true;btn.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){panel.hidden=true;btn.setAttribute('aria-expanded','false');}});

  // Textes d'origine (français), pour pouvoir revenir en arrière
  var elts=[].slice.call(document.querySelectorAll('[data-i18n]'));
  elts.forEach(function(el){el.__fr=el.innerHTML;});
  var ui=[].slice.call(document.querySelectorAll('[data-i18n-ui]'));
  var pageTraduite=Object.keys(P).length>0;

  function appliquer(l){
    var traduite = l==='fr' || (pageTraduite && Object.keys(P).some(function(k){return P[k][l];}));
    var eff = traduite ? l : 'fr';
    elts.forEach(function(el){var k=el.getAttribute('data-i18n'); el.innerHTML=(eff!=='fr' && P[k] && P[k][eff]) ? P[k][eff] : el.__fr;});
    ui=[].slice.call(document.querySelectorAll('[data-i18n-ui]'));
    ui.forEach(function(el){var k=el.getAttribute('data-i18n-ui'); var d=L.ui[k]; if(d) el.textContent=d[eff]||d.fr;});
    document.documentElement.setAttribute('lang',eff);
    document.documentElement.setAttribute('dir',L.rtl.indexOf(eff)>=0?'rtl':'ltr');
    document.body.classList.toggle('rtl',L.rtl.indexOf(eff)>=0);
    document.body.classList.toggle('page-non-traduite',!traduite);
  }
  function changer(l){
    langue=l;
    try{localStorage.setItem(CLE,l);}catch(e){}
    var main=document.querySelector('main');
    if(main){main.classList.add('langFade');}
    setTimeout(function(){appliquer(l);construirePanneau();if(main){main.classList.remove('langFade');}document.dispatchEvent(new CustomEvent('usp-langue',{detail:l}));},220);
  }

  var q=new URLSearchParams(location.search).get('lang');
  var memo=null; try{memo=localStorage.getItem(CLE);}catch(e){}
  langue=(q && L.langs.indexOf(q)>=0)?q:(memo && L.langs.indexOf(memo)>=0?memo:'fr');
  construirePanneau();
  if(langue!=='fr') appliquer(langue);
})();
