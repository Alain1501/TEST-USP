/* Cartes interactives des lieux de l'Unité de Santé Publique (Leaflet + Plan IGN)
   - #carte-usp : grande carte de la page « Où et quand nous trouver » (fenêtres reprises des fiches de la page)
   - .mini-carte[data-sites="melun,pass"] : petite carte à côté d'une adresse */
(function(){
  if(!window.L) return;
  var SITES={
    melun:    {nom:'Unité de Santé Publique',                                        adr:'8 rue de Vaux, 77000 Melun',                            q:'8 rue de Vaux 77000 Melun',                     ll:[48.5405,2.6600], c:'#be163a', avec:'clat'},
    pass:     {nom:'PASS, Hôpital de Melun',                                         adr:'270 avenue Marc Jacquet, 77000 Melun',                  q:'270 avenue Marc Jacquet 77000 Melun',           ll:[48.5582,2.6780], c:'#c4650a'},
    nemours:  {nom:'Centre Hospitalier du Sud Seine-et-Marne, site de Nemours',      adr:'15 rue des Chaudins, 77140 Nemours',                    q:'15 rue des Chaudins 77140 Nemours',             ll:[48.2655,2.6980], c:'#1ca6a9'},
    savigny:  {nom:'Centre Françoise Dolto',                                         adr:'Chemin du Plessis, 77176 Savigny-le-Temple',            q:'Chemin du Plessis 77176 Savigny-le-Temple',     ll:[48.5760,2.5840], c:'#e3b900'},
    montereau:{nom:'Centre Hospitalier du Sud Seine-et-Marne, site de Montereau',    adr:'1 rue Victor Hugo, Pavillon B1 Chirurgie, 77130 Montereau', q:'1 rue Victor Hugo 77130 Montereau-Fault-Yonne', ll:[48.3850,2.9530], c:'#f1861b'}
  };
  var TUILES='https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
  var PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  function langue(){ return document.documentElement.getAttribute('lang')||'fr'; }
  function ui(cle,def){ var U=(window.USP_LANGUES||{}).ui||{}; return (U[cle]&&(U[cle][langue()]||U[cle].fr))||def; }
  function itineraire(s){ return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(s.nom+', '+s.adr); }

  // Coordonnées exactes : Base Adresse Nationale (Géoplateforme), mises en cache
  var CLE='usp-geo-v1', cache={}, attentes={};
  try{cache=JSON.parse(localStorage.getItem(CLE)||'{}');}catch(e){}
  function position(id){
    var s=SITES[id];
    if(cache[s.q]) return Promise.resolve(cache[s.q]);
    if(attentes[id]) return attentes[id];
    if(!window.fetch) return Promise.resolve(null);
    attentes[id]=fetch('https://data.geopf.fr/geocodage/search?limit=1&q='+encodeURIComponent(s.q))
      .then(function(x){return x.json();})
      .then(function(j){ var f=j&&j.features&&j.features[0];
        if(f&&f.properties&&f.properties.score>0.5){ var ll=[f.geometry.coordinates[1],f.geometry.coordinates[0]]; cache[s.q]=ll; try{localStorage.setItem(CLE,JSON.stringify(cache));}catch(e){} return ll; }
        return null; }).catch(function(){return null;});
    return attentes[id];
  }

  var cartes=[];
  function creer(el,ids,contenu,opts){
    var carte=L.map(el,{scrollWheelZoom:false,zoomControl:true,attributionControl:true});
    carte.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    L.tileLayer(TUILES,{maxZoom:19,minZoom:6,attribution:'&copy; <a href="https://www.ign.fr/" target="_blank" rel="noopener">IGN</a> Géoplateforme'}).addTo(carte);
    carte.on('click',function(){carte.scrollWheelZoom.enable();});
    carte.on('mouseout',function(){carte.scrollWheelZoom.disable();});
    var reperes=ids.map(function(id){
      var s=SITES[id];
      var icone=L.divIcon({className:'',html:'<div class="repere" style="--rc:'+s.c+'"></div>',iconSize:[34,34],iconAnchor:[17,34],popupAnchor:[0,-32]});
      var m=L.marker(s.ll,{icon:icone,keyboard:true,title:s.nom}).addTo(carte);
      m.bindPopup(function(){return contenu(id);},{maxWidth:300,minWidth:220,autoPanPadding:[20,20]});
      return {id:id,m:m};
    });
    function cadrer(){
      if(reperes.length===1) carte.setView(reperes[0].m.getLatLng(),opts.zoom||16);
      else carte.fitBounds(L.latLngBounds(reperes.map(function(r){return r.m.getLatLng();})),{padding:[40,40]});
    }
    cadrer();
    Promise.all(reperes.map(function(r){ return position(r.id).then(function(ll){ if(ll) r.m.setLatLng(ll); }); })).then(cadrer);
    var c={carte:carte,reperes:reperes,contenu:contenu,cadrer:cadrer,el:el};
    cartes.push(c); return c;
  }

  // Grande carte : fenêtres reprises des fiches de la page
  function fiche(id){
    var a=document.querySelector('.lieu[data-lieu="'+id+'"]'); if(!a) return '';
    var c=a.cloneNode(true);
    c.querySelectorAll('.plan,.plaquette-pass').forEach(function(n){n.remove();});
    c.removeAttribute('style'); c.className='popup-lieu';
    if(['melun','nemours','savigny','montereau'].indexOf(id)>=0){
      var tel=document.querySelector('.lieu[data-lieu="rens"] a[href^="tel:"]');
      if(tel){ var ptel=tel.closest('p').cloneNode(true); var bas=c.querySelector('.bas-carte'); ptel.classList.add('popup-tel'); if(bas) c.insertBefore(ptel,bas); else c.appendChild(ptel); }
    }
    c.querySelectorAll('[data-i18n],[data-i18n-ui]').forEach(function(n){n.removeAttribute('data-i18n');n.removeAttribute('data-i18n-ui');});
    return c.outerHTML;
  }
  var grande=document.getElementById('carte-usp');
  if(grande){
    creer(grande,['melun','pass','nemours','savigny','montereau'],function(id){ return fiche(id)+(SITES[id].avec?fiche(SITES[id].avec):''); },{});
  }

  // Petites cartes à côté des adresses
  function simple(id){
    var s=SITES[id];
    return '<div class="popup-lieu"><h2>'+s.nom+'</h2><div class="adresse"><p>'+s.adr+'</p></div>'+
      '<p class="bas-carte"><a class="sy-rendre" href="'+itineraire(s)+'" target="_blank" rel="noopener">'+PIN+'<span>'+ui('syRendre',"S'y rendre")+'</span></a> '+
      '<a class="popup-lien" href="ou-et-quand.html">'+ui('ouq','Où et quand nous trouver')+'</a></p></div>';
  }
  document.querySelectorAll('.mini-carte').forEach(function(el){
    var ids=(el.getAttribute('data-sites')||'').split(',').map(function(x){return x.trim();}).filter(function(x){return SITES[x];});
    if(ids.length) creer(el,ids,simple,{zoom:16});
  });

  // Langue : les fenêtres ouvertes suivent
  document.addEventListener('usp-langue',function(){
    cartes.forEach(function(c){ c.reperes.forEach(function(r){ if(r.m.isPopupOpen()) r.m.getPopup().setContent(c.contenu(r.id)); }); });
  });
  // Recalage (apparition animée, ouverture d'une question dépliable)
  function recaler(){ cartes.forEach(function(c){ c.carte.invalidateSize(); c.cadrer(); }); }
  setTimeout(recaler,400);
  document.addEventListener('click',function(e){ if(e.target.closest && e.target.closest('.acc button')) setTimeout(recaler,520); });
})();
