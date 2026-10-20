(function(){
  var barre=document.querySelector('.progression');
  var entete=document.querySelector('.entete');
  function defile(){
    var h=document.documentElement;
    var max=h.scrollHeight-h.clientHeight;
    if(barre) barre.style.transform='scaleX('+(max>0?h.scrollTop/max:0)+')';
    if(entete){
      entete.classList.toggle('reduit',h.scrollTop>40);
      h.style.setProperty('--h-entete',entete.offsetHeight+'px');
    }
  }
  window.addEventListener('scroll',defile,{passive:true});
  window.addEventListener('resize',defile);
  defile();
  if(entete) entete.addEventListener('transitionend',defile);

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
    carte.addEventListener('pointermove',function(e){
      var r=carte.getBoundingClientRect(), px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
      carte.style.setProperty('--mx',(px*100)+'%'); carte.style.setProperty('--my',(py*100)+'%');
      if(reduit || e.pointerType!=='mouse' || !carte.classList.contains('vu')) return;
      carte.style.setProperty('--ry',((px-.5)*7)+'deg'); carte.style.setProperty('--rx',((.5-py)*6)+'deg');
    });
  });

  // Cartes vivantes : la lumière suit le pointeur
  document.querySelectorAll('.lieu, .contact, .suite .carte').forEach(function(carte){
    carte.addEventListener('pointermove',function(e){
      var r=carte.getBoundingClientRect();
      carte.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%'); carte.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
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
  var ACTU=window.USP_ACTU||{}, A=ACTU.annonce||{}, bandeau=null;
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  if(A.actif && A.texte && principal){
    bandeau=document.createElement('div'); bandeau.className='annonce'; bandeau.setAttribute('role','status');
    bandeau.innerHTML='<div class="wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg><p style="margin:0" lang="fr" dir="auto"></p></div>';
    bandeau.querySelector('p').textContent=A.texte;
    principal.insertBefore(bandeau,principal.firstChild);
  }
  // Actualités (accueil)
  var blocActus=document.getElementById('actualites');
  function afficherActus(){
    if(!blocActus) return;
    var liste=(ACTU.actualites||[]).slice().sort(function(a,b){return (b.epingle?1:0)-(a.epingle?1:0) || String(b.date).localeCompare(String(a.date));}).slice(0,6);
    blocActus.hidden=!liste.length;
    var l=document.documentElement.lang||'fr', fmt;
    try{fmt=new Intl.DateTimeFormat(l,{day:'numeric',month:'long',year:'numeric'});}catch(e){fmt=new Intl.DateTimeFormat('fr',{day:'numeric',month:'long',year:'numeric'});}
    blocActus.querySelector('.actus-liste').innerHTML=liste.map(function(a){
      var d=''; if(a.date){var x=new Date(a.date+'T12:00:00'); if(!isNaN(x)) d='<time datetime="'+esc(a.date)+'">'+esc(fmt.format(x))+'</time>';}
      var lien=a.lien && /^(https?:\/\/|pdf\/|[\w-]+\.html)/.test(a.lien) ? '<a class="actu-lien" href="'+esc(a.lien)+'"'+(/^https?:|\.pdf$/.test(a.lien)?' target="_blank" rel="noopener"':'')+'>'+esc(txt('plus'))+'</a>' : '';
      return '<article class="actu'+(a.epingle?' epinglee':'')+'">'+d+'<h3 lang="fr" dir="auto">'+esc(a.titre)+'</h3>'+(a.texte?'<p lang="fr" dir="auto">'+esc(a.texte).replace(/\n/g,'<br>')+'</p>':'')+lien+'</article>';
    }).join('');
  }
  afficherActus(); document.addEventListener('usp-langue',afficherActus);
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
