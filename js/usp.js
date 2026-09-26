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
        entrees.forEach(function(en){ev.classList.toggle('ouvert',en.isIntersecting);});
      },{threshold:0}).observe(ev);
    } else { ev.classList.add('ouvert'); }
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
})();
