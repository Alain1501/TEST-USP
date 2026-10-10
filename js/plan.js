/* Plan d'accès PASS : langue du plan et plaquette à télécharger */
(function(){
  var figs=[].slice.call(document.querySelectorAll('figure.plan'));
  if(!figs.length) return;
  var PLANS={fr:'img/plans/plan-pass-fr.png',en:'img/plans/plan-pass-en.png',pt:'img/plans/plan-pass-pt.png',ro:'img/plans/plan-pass-ro.png',tr:'img/plans/plan-pass-tr.png',ar:'img/plans/plan-pass-ar.png'};
  var PDFS={fr:'pdf/pass/plaquette-pass-fr.pdf',en:'pdf/pass/plaquette-pass-en.pdf',pt:'pdf/pass/plaquette-pass-pt.pdf',ro:'pdf/pass/plaquette-pass-ro.pdf',tr:'pdf/pass/plaquette-pass-tr.pdf',ar:'pdf/pass/plaquette-pass-ar.pdf'};
  var ALIAS={mo:'ro'};      // le moldave utilise la plaquette en roumain
  var manuel=null;          // langue choisie à la main dans la liste du plan
  function pour(l){ l=ALIAS[l]||l; return PLANS[l]?l:'fr'; }
  function montrer(l){
    figs.forEach(function(f){
      var img=f.querySelector('.plan-img'), s=f.querySelector('.plan-langue');
      if(img && img.getAttribute('src')!==PLANS[l]) img.setAttribute('src',PLANS[l]);
      if(s) s.value=l;
    });
    document.querySelectorAll('.plan-pdf').forEach(function(a){ a.setAttribute('href',PDFS[l]); a.removeAttribute('download'); a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); });
  }
  figs.forEach(function(f){
    var s=f.querySelector('.plan-langue');
    if(s) s.addEventListener('change',function(){ manuel=s.value; montrer(manuel); });
  });
  document.addEventListener('usp-langue',function(e){ if(!manuel) montrer(pour(e.detail)); });
  montrer(pour(document.documentElement.getAttribute('lang')||'fr'));
})();
