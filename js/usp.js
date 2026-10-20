(function(){
  var barre=document.querySelector('.progression');
  var entete=document.querySelector('.entete');
  // Défilement : un seul calcul par image affichée, et la hauteur de l'en-tête n'est relue que si elle change
  var h=document.documentElement, attente=false, reduitAvant=null, hauteurAvant=0;
  function mesurerEntete(){
    if(!entete) return;
    var ht=entete.offsetHeight;
    if(ht!==hauteurAvant){hauteurAvant=ht; h.style.setProperty('--h-entete',ht+'px');}
  }
  function defile(){
    attente=false;
    var y=window.scrollY||h.scrollTop, max=h.scrollHeight-h.clientHeight;
    if(barre) barre.style.transform='scaleX('+(max>0?y/max:0)+')';
    if(entete){
      var r=y>40;
      if(r!==reduitAvant){reduitAvant=r; entete.classList.toggle('reduit',r);}
    }
  }
  function demander(){ if(!attente){attente=true; requestAnimationFrame(defile);} }
  window.addEventListener('scroll',demander,{passive:true});
  window.addEventListener('resize',function(){demander(); mesurerEntete();});
  defile(); mesurerEntete();
  if(entete) entete.addEventListener('transitionend',function(e){ if(e.target.tagName==='IMG'||e.target===entete) mesurerEntete(); });

  var io='IntersectionObserver' in window;

  // L'éventail se referme quand il sort de l'écran et se rouvre à chaque retour
  document.querySelectorAll('.eventail').forEach(function(ev){
    if(io){
      new IntersectionObserver(function(entrees){
        entrees.forEach(function(en){
          ev.classList.toggle('ouvert',en.isIntersecting);
          if(!en.isIntersecting) ev.querySelectorAll('.p').forEach(function(p){p.classList.remove('pret');});
        });
      },{threshold:0}).observe(ev);
    } else { ev.classList.add('ouvert'); }
  });

  // Une fois ouvert, chaque pétale devient réactif au survol des portes
  document.querySelectorAll('.eventail .p').forEach(function(p){
    p.addEventListener('animationend',function(){p.classList.add('pret');});
  });

  // Apparition en cascade au défilement
  var elements=document.querySelectorAll('.apparait');
  if(!io){elements.forEach(function(e){e.classList.add('vu')});}
  else{
    var obs=new IntersectionObserver(function(entrees){
      entrees.forEach(function(en){
        if(!en.isIntersecting)return;
        var el=en.target;
        var rang=Array.prototype.indexOf.call(el.parentNode.querySelectorAll(':scope > .apparait'),el);
        el.style.transitionDelay=(Math.max(rang,0)*110)+'ms';
        el.classList.add('vu');
        el.addEventListener('transitionend',function fin(e){if(e.target===el&&e.propertyName==='opacity'){el.style.transitionDelay='';el.removeEventListener('transitionend',fin);}});
        obs.unobserve(el);
      });
    },{threshold:.12});
    elements.forEach(function(e){obs.observe(e)});
  }

  // Questions dépliables
  document.querySelectorAll('.acc').forEach(function(acc){
    var btn=acc.querySelector('button');
    if(!btn) return;
    btn.addEventListener('click',function(){
      var ouvrir=!acc.classList.contains('ouverte');
      acc.classList.toggle('ouverte',ouvrir);
      btn.setAttribute('aria-expanded',ouvrir?'true':'false');
    });
  });

  // Sous-navigation qui suit la lecture
  var liens=document.querySelectorAll('.sousnav a');
  if(liens.length && io){
    var parId={};
    liens.forEach(function(a){parId[a.getAttribute('href').slice(1)]=a;});
    var espion=new IntersectionObserver(function(entrees){
      entrees.forEach(function(en){
        if(!en.isIntersecting) return;
        var cible=parId[en.target.id];
        liens.forEach(function(a){a.classList.toggle('actif',a===cible);});
        var ul=cible.parentNode.parentNode;
        ul.scrollTo({left:cible.offsetLeft-ul.clientWidth/2+cible.clientWidth/2,behavior:'smooth'});
      });
    },{rootMargin:'-35% 0px -60% 0px'});
    Object.keys(parId).forEach(function(id){
      var s=document.getElementById(id);
      if(s) espion.observe(s);
    });
  }

  // ===== Effets visuels repris du site de vaccination au collège =====
  var reduit=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fond animé
  var halo=document.createElement('div'); halo.className='halo'; halo.setAttribute('aria-hidden','true');
  document.body.insertBefore(halo,document.body.firstChild);

  // Titre principal qui monte mot à mot
  function decouper(h1,anime){
    var mots=h1.textContent.trim().split(/\s+/);
    h1.classList.add('mots'); h1.classList.toggle('sans-anim',!anime);
    // Un titre resté en français garde le sens de lecture de gauche à droite, même sur une page en arabe
    if(/[\u0590-\u08FF]/.test(h1.textContent)) h1.removeAttribute('dir'); else h1.setAttribute('dir','ltr');
    h1.innerHTML=mots.map(function(m,k){return '<span class="w" style="--k:'+k+'">'+m.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span>';}).join(' ');
  }
  var titre=document.querySelector('main h1');
  if(titre){
    decouper(titre,!reduit);
    document.addEventListener('usp-langue',function(){decouper(titre,false);});
  }

  // Portes : inclinaison suivant le pointeur, lumière qui suit la souris, lien avec l'éventail
  document.querySelectorAll('.porte').forEach(function(carte){
    var classes=['survol-'+(carte.getAttribute('data-petale')||'')].concat([].filter.call(carte.classList,function(c){return c!=='porte'&&c!=='apparait'&&c!=='vu';}).map(function(c){return 'survol-'+c;}));
    function entrer(){classes.forEach(function(c){document.body.classList.add(c);});}
    function sortir(){classes.forEach(function(c){document.body.classList.remove(c);});carte.style.setProperty('--rx','0deg');carte.style.setProperty('--ry','0deg');}
    carte.addEventListener('pointerenter',entrer);
    carte.addEventListener('pointerleave',sortir);
    carte.addEventListener('focus',entrer);
    carte.addEventListener('blur',sortir);
    var dernier=null, prevu=false;
    carte.addEventListener('pointermove',function(e){
      if(e.pointerType!=='mouse') return;
      dernier=e; if(prevu) return; prevu=true;
      requestAnimationFrame(function(){
        prevu=false; var ev=dernier, r=carte.getBoundingClientRect(), px=(ev.clientX-r.left)/r.width, py=(ev.clientY-r.top)/r.height;
        carte.style.setProperty('--mx',(px*100)+'%'); carte.style.setProperty('--my',(py*100)+'%');
        if(reduit || !carte.classList.contains('vu')) return;
        carte.style.setProperty('--ry',((px-.5)*7)+'deg'); carte.style.setProperty('--rx',((.5-py)*6)+'deg');
      });
    });
  });

  // Cartes vivantes : la lumière suit le pointeur
  document.querySelectorAll('.lieu, .contact, .suite .carte').forEach(function(carte){
    var dernier=null, prevu=false;
    carte.addEventListener('pointermove',function(e){
      if(e.pointerType!=='mouse') return;
      dernier=e; if(prevu) return; prevu=true;
      requestAnimationFrame(function(){
        prevu=false; var r=carte.getBoundingClientRect();
        carte.style.setProperty('--mx',((dernier.clientX-r.left)/r.width*100)+'%'); carte.style.setProperty('--my',((dernier.clientY-r.top)/r.height*100)+'%');
      });
    });
  });

  // Accessibilité : chaque carte a un nom distinct, tiré du titre de sa section
  document.querySelectorAll('.mini-carte, .carte-usp').forEach(function(c,i){
    var sec=c.closest('section, article'), h=sec && sec.querySelector('h2');
    c.setAttribute('aria-label','Carte'+(h?', '+h.textContent.trim():' '+(i+1)));
  });

  // ===== Lien d'évitement, bouton retour en haut, bandeau d'annonces =====
  var UI=(window.USP_LANGUES||{}).ui||{};
  function txt(k){var l=document.documentElement.lang||'fr', d=UI[k]||{}; return d[l]||d.fr||'';}
  var principal=document.querySelector('main');
  if(principal){ if(!principal.id) principal.id='contenu'; principal.setAttribute('tabindex','-1'); }
  var evit=document.createElement('a'); evit.className='evitement'; evit.href='#'+(principal?principal.id:'');
  document.body.insertBefore(evit,document.body.firstChild);
  var haut=document.createElement('button'); haut.type='button'; haut.className='haut';
  haut.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  haut.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduit?'auto':'smooth'}); if(principal) principal.focus({preventScroll:true});});
  document.body.appendChild(haut);
  function montrerHaut(){haut.classList.toggle('visible',window.scrollY>window.innerHeight*0.8);}
  window.addEventListener('scroll',montrerHaut,{passive:true}); montrerHaut();
  // ===== Actualités et bandeau, publiés depuis l'espace admin =====
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  // Valeurs autorisées pour la mise en forme (rien d'autre n'est accepté)
  var POLICES={site:"'Atkinson Hyperlegible',Verdana,sans-serif",classique:"Georgia,'Times New Roman',serif",large:"Verdana,Geneva,sans-serif",moderne:"'Trebuchet MS','Segoe UI',sans-serif"};
  var TT={petite:'1.05rem',normale:'1.2rem',grande:'1.5rem',tresgrande:'1.9rem'};
  var TX={normale:'1rem',grande:'1.15rem',tresgrande:'1.3rem'};
  var COUL={navy:'#12365e',bleu:'#006997',canard:'#0e7376',vert:'#2e7d32',orange:'#a85406',rouge:'#be163a',rose:'#c2306a',noir:'#1a1a1a'};
  var FONDS={blanc:'#ffffff',ciel:'#eef6fb',jaune:'#fff4d6',rose:'#fdeef4',vert:'#e8f5ec',orange:'#fdf0e3',gris:'#f3f4f6'};
  var FX={aucune:1,apparition:1,fondu:1,gauche:1,droite:1,zoom:1,rebond:1,mots:1,pulsation:1,battement:1,respiration:1,secousse:1,clignote:1,reflet:1,lumiere:1};
  var DUREES={'0.5':1,'1':1,'1.5':1,'2':1,'3':1,'5':1,'8':1};
  var REPET={'1':'1','2':'2','3':'3','boucle':'infinite'};
  var DELAIS={'0':1,'0.3':1,'0.6':1,'1':1,'2':1};
  // Liens autorisés : pages du site (avec rubrique), documents, sites internet, itinéraires, téléphone, e-mail
  function lienSur(h){ return typeof h==='string' && /^(https:\/\/|http:\/\/|[\w-]+\.html(#[\w-]+)?$|#[\w-]+$|docs\/[\w.\-]+$|pdf\/[\w.\/-]+$|tel:\+?[\d ]+$|mailto:[^\s"<>]+$)/.test(h); }
  function lienExterne(h){ return /^https?:|^docs\/|^pdf\/|\.pdf$/i.test(h); }
  var PALETTE=Object.keys(COUL).map(function(k){return [k,COUL[k]];});
  function rgb(h){ var m=/^#?([0-9a-f]{6})$/i.exec(h); if(m){var n=parseInt(m[1],16);return [n>>16,(n>>8)&255,n&255];} m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(h); return m?[+m[1],+m[2],+m[3]]:null; }
  function couleurPalette(c){ var v=rgb(String(c||'').trim()); if(!v) return null; var best=null,d=1e9; PALETTE.forEach(function(p){var w=rgb(p[1]),x=(w[0]-v[0])*(w[0]-v[0])+(w[1]-v[1])*(w[1]-v[1])+(w[2]-v[2])*(w[2]-v[2]); if(x<d){d=x;best=p[1];}}); return best; }
  // Nettoyage du texte mis en forme dans l'admin : seules quelques balises sûres sont gardées
  function nettoyer(html){
    var tpl=document.createElement('template'); tpl.innerHTML=String(html||'');
    function rendre(n){
      if(n.nodeType===3) return esc(n.nodeValue);
      if(n.nodeType!==1) return '';
      var t=n.tagName, inner=''; for(var c=n.firstChild;c;c=c.nextSibling) inner+=rendre(c);
      var coul=null;
      if(t==='FONT') coul=n.getAttribute('color');
      if(n.style && n.style.color) coul=n.style.color;
      var poids=n.style && (n.style.fontWeight==='bold' || +n.style.fontWeight>=600), ital=n.style && n.style.fontStyle==='italic';
      var out;
      switch(t){
        case 'B': case 'STRONG': out='<strong>'+inner+'</strong>'; break;
        case 'I': case 'EM': out='<em>'+inner+'</em>'; break;
        case 'U': out='<u>'+inner+'</u>'; break;
        case 'BR': return '<br>';
        case 'UL': case 'OL': out='<'+t.toLowerCase()+'>'+inner+'</'+t.toLowerCase()+'>'; break;
        case 'LI': out='<li>'+inner+'</li>'; break;
        case 'P': case 'DIV': out=inner?'<p>'+inner+'</p>':''; break;
        case 'A':
          var h=n.getAttribute('href')||'';
          out=lienSur(h)?'<a href="'+esc(h)+'"'+(lienExterne(h)?' target="_blank" rel="noopener"':'')+'>'+inner+'</a>':inner; break;
        default: out=inner;
      }
      if(poids && t!=='B' && t!=='STRONG') out='<strong>'+out+'</strong>';
      if(ital && t!=='I' && t!=='EM') out='<em>'+out+'</em>';
      if(coul){ var p=couleurPalette(coul); if(p && p!==COUL.navy) out='<span style="color:'+p+'">'+out+'</span>'; }
      return out;
    }
    var r=''; for(var c=tpl.content.firstChild;c;c=c.nextSibling) r+=rendre(c);
    return r;
  }
  // Ancien format (**gras**, *italique*, [rouge]…[/rouge], lignes « - »), toujours accepté
  function enrichir(t){
    var lignes=esc(t).split('\n'), html='', liste=false;
    lignes.forEach(function(l){
      if(/^\s*[-•]\s+/.test(l)){ if(!liste){html+='<ul>';liste=true;} html+='<li>'+l.replace(/^\s*[-•]\s+/,'')+'</li>'; return; }
      if(liste){html+='</ul>';liste=false;}
      html+=(l.trim()?l:'')+'\n';
    });
    if(liste) html+='</ul>';
    html=html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\*)/g,'$1<em>$2</em>')
             .replace(/\[(navy|bleu|canard|vert|orange|rouge|rose|noir)\]([\s\S]+?)\[\/\1\]/g,function(_,c,x){return '<span style="color:'+COUL[c]+'">'+x+'</span>';});
    return html.replace(/\n+$/,'').replace(/\n(?!<\/?(ul|li))/g,'<br>').replace(/\n/g,'');
  }
  function corps(o){ return o.html ? nettoyer(o.html) : enrichir(o.texte||''); }
  var ICO_DOC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>';
  var ICO_MAP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  var ICO_FL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function boutons(o){
    var l=(o.boutons||[]).slice();
    if(o.lien && !l.length) l.push({lib:txt('plus'),href:o.lien});
    l=l.filter(function(b){return b && b.href && lienSur(b.href);});
    if(!l.length) return '';
    return '<div class="actu-boutons">'+l.map(function(b){
      var ico=/^docs\/|^pdf\/|\.pdf$/i.test(b.href)?ICO_DOC:(/google\.[a-z.]+\/maps/.test(b.href)?ICO_MAP:ICO_FL);
      return '<a class="actu-btn" href="'+esc(b.href)+'"'+(lienExterne(b.href)?' target="_blank" rel="noopener"':'')+'>'+ico+'<span>'+esc(b.lib||txt('plus'))+'</span></a>';
    }).join('')+'</div>';
  }
  function fxAttrs(st,defaut){
    var fx=FX[st.anim]?st.anim:(defaut||'aucune');
    var d=DUREES[st.duree]?st.duree:'', r=REPET[st.repet]||'', dl=DELAIS[st.delai]?st.delai:'';
    var v=(d?'--fxd:'+d+'s;':'')+(r?'--fxr:'+r+';':'')+(dl?'--fxl:'+dl+'s;':'');
    return {cls:' fx-'+fx, css:v};
  }
  function motsAnimes(t){return esc(t).split(/\s+/).map(function(w,k){return '<span class="w" style="--k:'+k+'">'+w+'</span>';}).join(' ');}
  function renduActu(a,fmt){
    var st=a.style||{}, fx=fxAttrs(st);
    var css='font-family:'+(POLICES[st.police]||POLICES.site)+';--actu-titre:'+(COUL[st.cTitre]||COUL.navy)+';--actu-fond:'+(FONDS[st.fond]||FONDS.blanc)+';--actu-tt:'+(TT[st.tTitre]||TT.normale)+';--actu-tx:'+(TX[st.tTexte]||TX.normale)+';'+fx.css;
    var d=''; if(a.date){var x=new Date(a.date+'T12:00:00'); if(!isNaN(x)) d='<time datetime="'+esc(a.date)+'">'+esc((fmt||new Intl.DateTimeFormat('fr',{day:'numeric',month:'long',year:'numeric'})).format(x))+'</time>';}
    var c=corps(a);
    return '<article class="actu'+fx.cls+(a.epingle?' epinglee':'')+'" style="'+css+'">'+d+'<h3 lang="fr" dir="auto">'+(st.anim==='mots'?motsAnimes(a.titre):esc(a.titre))+'</h3>'+(c?'<div class="actu-texte" lang="fr" dir="auto">'+c+'</div>':'')+boutons(a)+'</article>';
  }
  var THEMES={jaune:1,orange:1,rouge:1,rose:1,bleu:1,vert:1,marine:1};
  function renduBandeau(A){
    var st=A.style||{}, fx=fxAttrs(st);
    return '<div class="annonce theme-'+(THEMES[st.theme]?st.theme:'jaune')+fx.cls+'" role="status" style="'+fx.css+'"><div class="wrap"><span class="annonce-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg></span><div class="annonce-texte" lang="fr" dir="auto">'+corps(A)+boutons(A)+'</div></div></div>';
  }
  window.USP_RENDU={actu:renduActu,bandeau:renduBandeau,texte:enrichir,nettoyer:nettoyer,lienSur:lienSur};

  var blocActus=document.getElementById('actualites');
  function afficherActus(){
    var ACTU=window.USP_ACTU||{};
    var bandeaux=(ACTU.annonces||[]).slice(); if(ACTU.annonce) bandeaux.unshift(ACTU.annonce);
    document.querySelectorAll('main > .annonces').forEach(function(x){x.remove();});
    var actifs=bandeaux.filter(function(A){return A && A.actif && (A.html||A.texte);});
    if(actifs.length && principal){
      var t=document.createElement('div'); t.className='annonces'; t.innerHTML=actifs.map(renduBandeau).join(''); principal.insertBefore(t,principal.firstChild);
    }
    if(!blocActus) return;
    var liste=(ACTU.actualites||[]).slice().sort(function(a,b){return (b.epingle?1:0)-(a.epingle?1:0) || String(b.date).localeCompare(String(a.date));}).slice(0,6);
    blocActus.hidden=!liste.length;
    var l=document.documentElement.lang||'fr', fmt;
    try{fmt=new Intl.DateTimeFormat(l,{day:'numeric',month:'long',year:'numeric'});}catch(e){fmt=new Intl.DateTimeFormat('fr',{day:'numeric',month:'long',year:'numeric'});}
    blocActus.querySelector('.actus-liste').innerHTML=liste.map(function(a){return renduActu(a,fmt);}).join('');
  }
  window.USP_AFFICHER_ACTUS=afficherActus;
  // Lumière qui suit la souris sur les actualités qui l'utilisent
  document.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse') return;
    var c=e.target.closest && e.target.closest('.actu.fx-lumiere'); if(!c) return;
    var r=c.getBoundingClientRect(), px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
    c.style.setProperty('--mx',(px*100)+'%'); c.style.setProperty('--my',(py*100)+'%');
    if(!reduit){c.style.setProperty('--ry',((px-.5)*6)+'deg'); c.style.setProperty('--rx',((.5-py)*5)+'deg');}
  },{passive:true});
  document.addEventListener('pointerout',function(e){var c=e.target.closest&&e.target.closest('.actu.fx-lumiere'); if(c&&!c.contains(e.relatedTarget)){c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg');}});
  // Le fichier des actualités est toujours rechargé à neuf, pour que chaque publication apparaisse sans attendre le cache du navigateur
  if(window.USP_ACTU) afficherActus();
  var sActu=document.createElement('script'); sActu.src='js/actualites.js?t='+Date.now();
  sActu.onload=afficherActus; document.head.appendChild(sActu);
  document.addEventListener('usp-langue',afficherActus);
  function libellesUI(){
    evit.textContent=txt('evitement'); haut.setAttribute('aria-label',txt('haut')); haut.title=txt('haut');
  }
  libellesUI(); document.addEventListener('usp-langue',libellesUI);

  // ===== Accès admin caché : « pierre » au clavier, ou 5 tapes rapides sur le logo =====
  function ouvrirAdmin(){
    if(window.USP_ADMIN_OUVRIR){window.USP_ADMIN_OUVRIR();return;}
    var s=document.createElement('script'); s.src='js/admin.js?t='+Date.now(); s.onload=function(){window.USP_ADMIN_OUVRIR&&window.USP_ADMIN_OUVRIR();}; document.body.appendChild(s);
  }
  var frappe='';
  document.addEventListener('keydown',function(e){
    var t=e.target; if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if(!e.key || e.key.length!==1 || e.ctrlKey || e.metaKey || e.altKey){return;}
    frappe=(frappe+e.key.toLowerCase()).slice(-6);
    if(frappe==='pierre'){frappe=''; ouvrirAdmin();}
  });
  var logo=document.querySelector('.entete .logo-usp'), lienLogo=logo && logo.closest('a');
  if(lienLogo){
    var tapes=0, minut=null;
    lienLogo.addEventListener('click',function(e){
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.button) return;
      e.preventDefault(); tapes++; clearTimeout(minut);
      if(tapes>=5){tapes=0; ouvrirAdmin(); return;}
      minut=setTimeout(function(){var n=tapes; tapes=0; if(n===1) location.href=lienLogo.getAttribute('href');},450);
    });
  }
})();
