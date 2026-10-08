/* Recherche dans le site : fonctionne entièrement dans le navigateur, dans la langue choisie.
   L'index (js/recherche-index.js) n'est chargé qu'à la première ouverture. */
(function(){
  var T={
    fr:['Rechercher','Rechercher dans le site','Aucun résultat. Essayez un autre mot, ou consultez la page « Où et quand nous trouver ».','Suggestions','Fermer','Vaccination','Tuberculose','Contraception','Frottis'],
    en:['Search','Search the site','No results. Try another word, or see the “Where and when to find us” page.','Suggestions','Close','Vaccination','Tuberculosis','Contraception','Smear test'],
    ar:['بحث','ابحث في الموقع','لا توجد نتائج. جرّب كلمة أخرى أو اطّلع على صفحة «أين ومتى تجدوننا».','اقتراحات','إغلاق','التلقيح','السل','منع الحمل','مسحة عنق الرحم'],
    tr:['Ara','Sitede ara','Sonuç bulunamadı. Başka bir kelime deneyin veya “Bizi nerede ve ne zaman bulabilirsiniz” sayfasına bakın.','Öneriler','Kapat','Aşılama','Tüberküloz','Doğum kontrolü','Smear'],
    ps:['لټون','په وېب‌پاڼه کې لټون','هېڅ پایله ونه موندل شوه. بله کلمه وازمویئ یا «موږ چېرته او کله پیدا کړئ» پاڼه وګورئ.','وړاندیزونه','بندول','واکسین','نری رنځ','د حمل مخنیوی','سمیر'],
    ku:['گەڕان','لە ماڵپەڕەکەدا بگەڕێ','هیچ ئەنجامێک نییە. وشەیەکی تر تاقی بکەرەوە یان سەیری پەڕەی «لە کوێ و کەی دەمانبیننەوە» بکە.','پێشنیارەکان','داخستن','ڤاکسین','سیل','ڕێگری لە سکپڕی','سمێر'],
    ro:['Căutare','Căutați în site','Niciun rezultat. Încercați alt cuvânt sau consultați pagina „Unde și când ne găsiți”.','Sugestii','Închide','Vaccinare','Tuberculoză','Contracepție','Test Papanicolau'],
    ka:['ძებნა','საიტზე ძებნა','შედეგი ვერ მოიძებნა. სცადეთ სხვა სიტყვა ან იხილეთ გვერდი „სად და როდის გვიპოვოთ“.','შემოთავაზებები','დახურვა','ვაქცინაცია','ტუბერკულოზი','კონტრაცეფცია','ნაცხი'],
    sq:['Kërko','Kërko në faqe','Asnjë rezultat. Provoni një fjalë tjetër ose shikoni faqen «Ku dhe kur të na gjeni».','Sugjerime','Mbyll','Vaksinim','Tuberkulozi','Kontracepsioni','Papanikolau'],
    am:['ፈልግ','በድረ ገጹ ውስጥ ይፈልጉ','ምንም ውጤት አልተገኘም። ሌላ ቃል ይሞክሩ ወይም «የት እና መቼ ያገኙናል» የሚለውን ገጽ ይመልከቱ።','ጥቆማዎች','ዝጋ','ክትባት','ሳንባ ነቀርሳ','የወሊድ መከላከያ','ፓፕ ስሚር'],
    zh:['搜索','在本站搜索','没有结果。请尝试其他词语，或查看“我们的地点和时间”页面。','建议','关闭','疫苗接种','结核病','避孕','涂片'],
    prs:['جستجو','در ویب‌سایت جستجو کنید','هیچ نتیجه‌ای یافت نشد. کلمهٔ دیگری را امتحان کنید یا صفحهٔ «ما را کجا و چه وقت پیدا کنید» را ببینید.','پیشنهادها','بستن','واکسین','توبرکلوز','جلوگیری از حمل','پاپ‌اسمیر'],
    es:['Buscar','Buscar en el sitio','No hay resultados. Pruebe otra palabra o consulte la página «Dónde y cuándo encontrarnos».','Sugerencias','Cerrar','Vacunación','Tuberculosis','Anticoncepción','Citología'],
    pt:['Pesquisar','Pesquisar no site','Sem resultados. Experimente outra palavra ou consulte a página «Onde e quando nos encontrar».','Sugestões','Fechar','Vacinação','Tuberculose','Contraceção','Papanicolau'],
    ru:['Поиск','Поиск по сайту','Ничего не найдено. Попробуйте другое слово или откройте страницу «Где и когда нас найти».','Подсказки','Закрыть','Вакцинация','Туберкулёз','Контрацепция','Мазок'],
    uk:['Пошук','Пошук на сайті','Нічого не знайдено. Спробуйте інше слово або відкрийте сторінку «Де і коли нас знайти».','Підказки','Закрити','Вакцинація','Туберкульоз','Контрацепція','Мазок']
  };
  T.mo=T.ro;
  // Synonymes : mots du quotidien → mots utilisés sur le site (forme sans accents, en minuscules)
  var SYN={
    'sida':'vih','hiv':'vih','aids':'hiv','mst':'ist','test hiv':'depistage vih','capote':'preservatifs','preservatif':'preservatifs',
    'pilule du lendemain':'contraception d urgence','pillule':'pilule','morning after pill':'emergency contraception',
    'gyneco':'gynecologique','gynecologue':'gynecologique','enceinte':'grossesse','pregnant':'pregnancy','pap smear':'smear test',
    'papillomavirus':'hpv','meningite':'meningocoques','tb':'tuberculose','bk':'tuberculose','radio des poumons':'radio',
    'ror':'rougeole','dtp':'diphterie','secu':'securite sociale','ame':'aide medicale','cmu':'complementaire sante solidaire','css':'complementaire sante solidaire',
    'mna':'mineurs non accompagnes','camion':'pass mobile','horaires':'horaires','horaire':'horaires','adresse':'rue','telephone':'telephone',
    'urgences':'urgences','urgence':'urgence','tpe':'tpe','pep':'pep','prep':'prep','vaccin':'vaccin','vacin':'vaccin','vaccins':'vaccin'
  };
  var SUGG_FIXES=['PrEP','BCG','PASS'];

  function langue(){ var l=document.documentElement.getAttribute('lang')||'fr'; return T[l]?l:'fr'; }
  function tr(i){ return (T[langue()]||T.fr)[i]; }
  function norm(s){
    return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ٰٟ]/g,'')
      .replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/[ىي]/g,'ی').replace(/ك/g,'ک').replace(/ـ/g,'')
      .replace(/[’'`]/g,' ').replace(/œ/g,'oe');
  }
  function mots(s){ return norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean); }
  var CJK=/[㐀-鿿]/;
  function lev(a,b,max){
    if(Math.abs(a.length-b.length)>max) return max+1;
    var p=[],i,j; for(j=0;j<=b.length;j++) p[j]=j;
    for(i=1;i<=a.length;i++){ var c=[i],m=i; for(j=1;j<=b.length;j++){ c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); if(c[j]<m)m=c[j]; } if(m>max) return max+1; p=c; }
    return p[b.length];
  }

  // ----- Index -----
  var IDX=null, PREP={}, chargement=null;
  function charger(){
    if(window.USP_RECHERCHE){ IDX=window.USP_RECHERCHE; return Promise.resolve(); }
    if(chargement) return chargement;
    chargement=new Promise(function(ok,ko){ var s=document.createElement('script'); s.src='js/recherche-index.js'; s.onload=function(){IDX=window.USP_RECHERCHE;ok();}; s.onerror=ko; document.head.appendChild(s); });
    return chargement;
  }
  function val(o,l){ return (o&&(o[l]||o.fr))||''; }
  function preparer(l){
    if(PREP[l]) return PREP[l];
    var voc={}, docs=IDX.e.map(function(e,i){
      var t=val(e.t,l), x=val(e.x,l), tf=e.t.fr, xf=e.x.fr;
      var mt=mots(t+' '+(l!=='fr'?tf:'')), mx=mots(x+' '+(l!=='fr'?xf:'')+' '+val(e.s,l));
      mt.concat(mx).forEach(function(w){ voc[w]=1; });
      return {e:e,t:t,x:x,mt:new Set(mt),mx:new Set(mx),brut:norm(t+' '+x+' '+tf+' '+xf)};
    });
    PREP[l]={docs:docs,voc:Object.keys(voc)};
    return PREP[l];
  }
  function correspondances(q,voc){
    var r=new Set(); if(q.length<2) return r;
    var max=q.length>=8?2:(q.length>=5?1:0);
    voc.forEach(function(w){
      if(w.indexOf(q)===0) r.add(w);
      else if(max && w.length>=q.length-1 && lev(q,w.slice(0,q.length+1),max)<=max) r.add(w);
      else if(max && lev(q,w,max)<=max) r.add(w);
    });
    return r;
  }
  function chercherUne(q,l){
    var P=preparer(l), n=norm(q).trim(); if(!n) return [];
    if(CJK.test(n)){
      var cle=n.replace(/\s+/g,'');
      return P.docs.map(function(d){ var s=0; if(norm(d.t).replace(/\s+/g,'').indexOf(cle)>=0) s+=5; if(d.brut.replace(/\s+/g,'').indexOf(cle)>=0) s+=1; return {d:d,s:s,m:new Set([cle])}; }).filter(function(r){return r.s>0;});
    }
    var qs=mots(q).filter(function(w){return w.length>1 || /\d/.test(w);}); if(!qs.length) return [];
    var ens=qs.map(function(w){ return correspondances(w,P.voc); });
    var tous=new Set(); ens.forEach(function(s){ s.forEach(function(w){tous.add(w);}); });
    return P.docs.map(function(d){
      var s=0;
      for(var i=0;i<ens.length;i++){
        var dansT=false,dansX=false; ens[i].forEach(function(w){ if(d.mt.has(w)) dansT=true; else if(d.mx.has(w)) dansX=true; });
        if(!dansT && !dansX) return null;
        s+=dansT?3:1;
      }
      if(qs.length>1 && d.brut.indexOf(qs.join(' '))>=0) s+=4;
      return {d:d,s:s,m:tous};
    }).filter(Boolean);
  }
  function chercher(q,l){
    var variantes=[q], n=' '+mots(q).join(' ')+' ';
    Object.keys(SYN).forEach(function(k){ if(n.indexOf(' '+k+' ')>=0) variantes.push(n.replace(' '+k+' ',' '+SYN[k]+' ').trim()); });
    var best={};
    variantes.forEach(function(v,i){ chercherUne(v,l).forEach(function(r){ var k=IDX.e.indexOf(r.d.e); r.s-=i?0.5:0; if(!best[k]||best[k].s<r.s) best[k]=r; }); });
    var res=Object.keys(best).map(function(k){return best[k];});
    // une seule entrée par ancre
    var vus={}; res.sort(function(a,b){return b.s-a.s;});
    return res.filter(function(r){ var k=r.d.e.p+'#'+r.d.e.a+'|'+r.d.t; if(vus[k]) return false; vus[k]=1; return true; }).slice(0,8);
  }
  function esc(s){ return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function surligner(txt,m,court){
    var morceaux=txt.split(/([^\p{L}\p{N}]+)/u), premier=-1;
    var html=morceaux.map(function(p,i){
      var w=norm(p); var ok=w && (m.has(w) || (CJK.test(p) && Array.from(m).some(function(x){return p.indexOf(x)>=0;})));
      if(ok && premier<0) premier=i;
      return ok?'<mark>'+esc(p)+'</mark>':esc(p);
    });
    if(!court) return html.join('');
    var deb=Math.max(0,premier-16), fin=Math.min(html.length,deb+60);
    return (deb>0?'… ':'')+html.slice(deb,fin).join('')+(fin<html.length?' …':'');
  }

  // ----- Interface -----
  var LOUPE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>';
  var btn=document.createElement('button'); btn.type='button'; btn.className='btn-recherche'; btn.innerHTML=LOUPE;
  var wrap=document.querySelector('.langPanelWrap');
  if(wrap){ var rang=document.createElement('div'); rang.className='outils-entete'; wrap.parentNode.insertBefore(rang,wrap); rang.appendChild(wrap); rang.appendChild(btn); }
  else { var ent=document.querySelector('.entete .wrap'); if(ent) ent.appendChild(btn); }

  var fond=document.createElement('div'); fond.className='recherche-fond'; fond.hidden=true;
  fond.innerHTML='<div class="recherche-boite" role="dialog" aria-modal="true">'+
    '<div class="recherche-ligne">'+LOUPE+'<input type="search" class="recherche-champ" autocomplete="off" spellcheck="false" enterkeyhint="search"><button type="button" class="recherche-fermer">×</button></div>'+
    '<div class="recherche-sugg"></div><ul class="recherche-res" role="listbox"></ul><p class="recherche-vide" hidden></p></div>';
  document.body.appendChild(fond);
  var champ=fond.querySelector('.recherche-champ'), liste=fond.querySelector('.recherche-res'), vide=fond.querySelector('.recherche-vide'), sugg=fond.querySelector('.recherche-sugg'), fermerB=fond.querySelector('.recherche-fermer');
  var choix=-1, minuterie=null, dernierFocus=null;

  function libelles(){
    btn.setAttribute('aria-label',tr(0)); btn.title=tr(0);
    champ.placeholder=tr(1); champ.setAttribute('aria-label',tr(1));
    fermerB.setAttribute('aria-label',tr(4)); vide.textContent=tr(2);
    var l=langue(), mots_=SUGG_FIXES.concat([tr(5),tr(6),tr(7),tr(8)]);
    if(l==='fr') mots_.splice(3,0,'TPE'); else mots_.splice(3,0,'PEP');
    sugg.innerHTML='<span class="recherche-sugg-titre">'+esc(tr(3))+'</span>'+mots_.map(function(m){return '<button type="button">'+esc(m)+'</button>';}).join('');
  }
  libelles();
  document.addEventListener('usp-langue',function(){ libelles(); if(!fond.hidden) lancer(); });

  function lien(e){ return e.p+(e.a?'#'+e.a:''); }
  function afficher(res){
    var l=langue(); choix=-1;
    liste.innerHTML=res.map(function(r,i){
      var e=r.d.e, page=val(IDX.pages[e.p],l), titre=r.d.t||e.t.fr, sec=val(e.s,l);
      var chemin=(page!==titre?page:'')+(sec && sec!==titre?(page!==titre?' › ':'')+sec:'');
      return '<li role="option" id="rres'+i+'"><a href="'+lien(e)+'"><span class="rres-chemin">'+esc(chemin)+'</span><span class="rres-titre">'+surligner(titre,r.m,false)+'</span><span class="rres-extrait">'+surligner(r.d.x||e.x.fr,r.m,true)+'</span></a></li>';
    }).join('');
    vide.hidden=!!res.length || !champ.value.trim();
    sugg.hidden=!!champ.value.trim();
  }
  function lancer(){
    var q=champ.value.trim();
    if(!q){ liste.innerHTML=''; vide.hidden=true; sugg.hidden=false; return; }
    charger().then(function(){ afficher(chercher(q,langue())); });
  }
  function ouvrir(){
    dernierFocus=document.activeElement; fond.hidden=false; document.documentElement.classList.add('recherche-ouverte');
    var l=langue(); fond.setAttribute('dir',['ar','ps','ku','prs'].indexOf(l)>=0?'rtl':'ltr');
    setTimeout(function(){champ.focus();},30); charger().catch(function(){});
  }
  function fermer(){ fond.hidden=true; document.documentElement.classList.remove('recherche-ouverte'); if(dernierFocus&&dernierFocus.focus) dernierFocus.focus(); }
  btn.addEventListener('click',ouvrir);
  fermerB.addEventListener('click',fermer);
  fond.addEventListener('click',function(e){ if(e.target===fond) fermer(); });
  champ.addEventListener('input',function(){ clearTimeout(minuterie); minuterie=setTimeout(lancer,120); });
  sugg.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; champ.value=b.textContent; lancer(); champ.focus(); });
  function marquer(i){ var it=liste.querySelectorAll('li'); if(!it.length) return; choix=(i+it.length)%it.length; it.forEach(function(x,k){x.classList.toggle('actif',k===choix);}); it[choix].scrollIntoView({block:'nearest'}); champ.setAttribute('aria-activedescendant','rres'+choix); }
  document.addEventListener('keydown',function(e){
    if(!fond.hidden){
      if(e.key==='Escape'){ fermer(); }
      else if(e.key==='ArrowDown'){ e.preventDefault(); marquer(choix+1); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); marquer(choix-1); }
      else if(e.key==='Enter' && document.activeElement===champ){ var a=liste.querySelectorAll('li a')[Math.max(choix,0)]; if(a){ e.preventDefault(); a.click(); } }
      else if(e.key==='Tab'){ var f=[].slice.call(fond.querySelectorAll('input,button:not([hidden]),a')).filter(function(x){return x.offsetParent;}); if(f.length){ var i=f.indexOf(document.activeElement); if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus();} else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus();} } }
    } else if((e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)) || ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){ e.preventDefault(); ouvrir(); }
  });
  // Clic sur un résultat de la page en cours : aller directement à l'endroit
  liste.addEventListener('click',function(e){
    var a=e.target.closest('a'); if(!a) return;
    var u=a.getAttribute('href'), p=u.split('#')[0], ici=(location.pathname.split('/').pop()||'index.html');
    if(p===ici){ e.preventDefault(); fermer(); history.replaceState(null,'','#'+(u.split('#')[1]||'')); atteindre(u.split('#')[1]); }
  });

  // ----- Arrivée sur une ancre : ouvrir la question et la mettre en évidence -----
  function atteindre(id){
    if(!id){ window.scrollTo({top:0,behavior:'smooth'}); return; }
    var el=document.getElementById(id); if(!el) return;
    var acc=el.closest('.acc'), cible=acc||el;
    if(acc && !acc.classList.contains('ouverte')) el.click();
    cible.classList.add('apparait','vu');
    setTimeout(function(){
      var h=(document.querySelector('.entete')||{}).offsetHeight||70, n=(document.querySelector('.sousnav')||{}).offsetHeight||0;
      window.scrollTo({top:cible.getBoundingClientRect().top+window.pageYOffset-h-n-16,behavior:'smooth'});
      cible.classList.remove('trouve'); void cible.offsetWidth; cible.classList.add('trouve');
    },acc?480:60);
  }
  if(location.hash.length>1){ var id=decodeURIComponent(location.hash.slice(1)); setTimeout(function(){atteindre(id);},350); }
})();
