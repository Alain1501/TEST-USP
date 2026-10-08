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
})();
