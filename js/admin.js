/* Espace admin du site de l'Unité de Santé Publique Sud 77
   Ouverture : taper « pierre » au clavier, ou 5 tapes rapides sur le logo USP.
   Un seul mot de passe. La clé GitHub est chiffrée par ce mot de passe (AES-GCM, PBKDF2).
   Les publications écrivent le fichier js/actualites.js dans le dépôt GitHub du site. */
(function(){
  if(window.USP_ADMIN_OUVRIR) return;
  var API='https://api.github.com';
  var FICHIER_ACTU='js/actualites.js', FICHIER_CONF='js/admin-config.js';
  var session=null;           // {jeton, depot, branche, dossier}
  var donnees=null;           // copie de travail de USP_ACTU
  var fond=null;

  // ---------- Outils ----------
  function el(html){var d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function b64e(str){var o=new TextEncoder().encode(str),b='';for(var i=0;i<o.length;i++)b+=String.fromCharCode(o[i]);return btoa(b);}
  function b64d(b){var s=atob(String(b).replace(/\s/g,''));var o=new Uint8Array(s.length);for(var i=0;i<s.length;i++)o[i]=s.charCodeAt(i);return new TextDecoder().decode(o);}
  function octets2b64(u){var b='';u=new Uint8Array(u);for(var i=0;i<u.length;i++)b+=String.fromCharCode(u[i]);return btoa(b);}
  function b642octets(b){var s=atob(b),o=new Uint8Array(s.length);for(var i=0;i<s.length;i++)o[i]=s.charCodeAt(i);return o;}
  function aujourdhui(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function attendre(ms){return new Promise(function(r){setTimeout(r,ms);});}

  // ---------- Chiffrement ----------
  function cleDepuis(mdp,sel){
    return crypto.subtle.importKey('raw',new TextEncoder().encode(mdp),'PBKDF2',false,['deriveKey']).then(function(base){
      return crypto.subtle.deriveKey({name:'PBKDF2',salt:sel,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    });
  }
  function chiffrer(texte,mdp){
    var sel=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
    return cleDepuis(mdp,sel).then(function(k){return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(texte));})
      .then(function(c){return {sel:octets2b64(sel),iv:octets2b64(iv),jeton:octets2b64(c)};});
  }
  function dechiffrer(conf,mdp){
    return cleDepuis(mdp,b642octets(conf.sel)).then(function(k){return crypto.subtle.decrypt({name:'AES-GCM',iv:b642octets(conf.iv)},k,b642octets(conf.jeton));})
      .then(function(c){return new TextDecoder().decode(c);});
  }

  // ---------- GitHub ----------
  function gh(chemin,options,jeton){
    options=options||{};
    options.headers=Object.assign({'Accept':'application/vnd.github+json','Authorization':'Bearer '+(jeton||session.jeton),'X-GitHub-Api-Version':'2022-11-28'},options.headers||{});
    return fetch(API+chemin,options).then(function(r){
      if(r.status===404) return null;
      return r.json().then(function(j){ if(!r.ok){var e=new Error(j.message||('Erreur GitHub '+r.status)); e.status=r.status; throw e;} return j; });
    });
  }
  function cheminDepot(f,s){s=s||session; return (s.dossier?s.dossier.replace(/^\/+|\/+$/g,'')+'/':'')+f;}
  function lireFichier(f,s){
    s=s||session;
    return gh('/repos/'+s.depot+'/contents/'+encodeURI(cheminDepot(f,s))+'?ref='+encodeURIComponent(s.branche),{cache:'no-store'},s.jeton);
  }
  function ecrireFichier(f,contenu,message,s){
    s=s||session;
    return lireFichier(f,s).then(function(actuel){
      var corps={message:message,content:b64e(contenu),branch:s.branche};
      if(actuel && actuel.sha) corps.sha=actuel.sha;
      return gh('/repos/'+s.depot+'/contents/'+encodeURI(cheminDepot(f,s)),{method:'PUT',body:JSON.stringify(corps),headers:{'Content-Type':'application/json'}},s.jeton);
    });
  }

  // ---------- Interface ----------
  function styles(){
    if(document.getElementById('admin-styles')) return;
    var st=document.createElement('style'); st.id='admin-styles';
    st.textContent=
    '.adm-fond{position:fixed;inset:0;z-index:500;background:rgba(18,54,94,.62);display:flex;justify-content:center;align-items:flex-start;overflow-y:auto;padding:max(4vh,env(safe-area-inset-top)) 1rem 2rem;direction:ltr;text-align:left}'+
    '.adm{width:100%;max-width:720px;background:#fff;border-radius:28px 28px 28px 6px;box-shadow:0 30px 70px -20px rgba(0,0,0,.45);padding:1.4rem 1.5rem 1.6rem;color:#12365e;font-family:inherit;font-size:1rem}'+
    '.adm h2{margin:0 0 .3rem;font-size:1.4rem}.adm h3{margin:1.4rem 0 .6rem;font-size:1.1rem}'+
    '.adm-tete{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:.6rem}'+
    '.adm-x{all:unset;cursor:pointer;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:1.5rem;background:#eef6fb}'+
    '.adm p{margin:.3rem 0 .8rem;color:#4a6684}'+
    '.adm label{display:block;font-weight:700;margin:.8rem 0 .25rem}'+
    '.adm input[type=text],.adm input[type=password],.adm input[type=date],.adm input[type=url],.adm textarea{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:.7rem .85rem;border:2px solid #dbe8f2;border-radius:14px;color:#12365e;background:#fff}'+
    '.adm input:focus,.adm textarea:focus{outline:none;border-color:#006997}'+
    '.adm textarea{min-height:110px;resize:vertical}'+
    '.adm .coche{display:flex;align-items:center;gap:.5rem;font-weight:700;margin:.8rem 0}'+
    '.adm .coche input{width:20px;height:20px}'+
    '.adm-btns{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}'+
    '.adm-b{font:inherit;font-weight:700;border:0;border-radius:18px 18px 18px 4px;padding:.75rem 1.2rem;cursor:pointer;background:#12365e;color:#fff}'+
    '.adm-b.sec{background:#eef6fb;color:#12365e}.adm-b.dang{background:#fbe9ec;color:#9d1230}.adm-b.pub{background:#0e7376}'+
    '.adm-b:disabled{opacity:.5;cursor:wait}'+
    '.adm-msg{margin:.8rem 0 0;padding:.7rem .9rem;border-radius:14px;font-weight:700}.adm-msg.ok{background:#e6f4ea;color:#14532d}.adm-msg.err{background:#fbe9ec;color:#9d1230}.adm-msg:empty{display:none}'+
    '.adm-liste{list-style:none;margin:0;padding:0;display:grid;gap:.5rem}'+
    '.adm-liste li{display:flex;justify-content:space-between;align-items:center;gap:.8rem;padding:.7rem .9rem;border-radius:16px;background:#eef6fb}'+
    '.adm-liste small{display:block;color:#4a6684;font-weight:400}'+
    '.adm-liste .act{display:flex;gap:.4rem;flex:none}.adm-liste .act button{font:inherit;font-size:.9rem;border:0;border-radius:12px;padding:.4rem .7rem;cursor:pointer;background:#fff;color:#12365e;font-weight:700}'+
    '.adm-onglets{display:flex;gap:.4rem;margin:.6rem 0 0}.adm-onglets button{font:inherit;font-weight:700;border:0;border-radius:14px;padding:.55rem 1rem;cursor:pointer;background:#eef6fb;color:#12365e}.adm-onglets button.on{background:#12365e;color:#fff}'+
    '.adm-aide{font-size:.92rem;background:#fff8e1;border-radius:14px;padding:.7rem .9rem;color:#5b4500}'+
    '.adm-aide ol{margin:.3rem 0 0;padding-left:1.2rem}'+'html.adm-ouvert .halo,html.adm-ouvert main *,html.adm-ouvert main *::before,html.adm-ouvert main *::after,html.adm-ouvert .entete *{animation-play-state:paused !important}html.adm-ouvert .halo{animation:none !important}html.adm-ouvert main{visibility:hidden}'+'.adm-sel{width:100%;font:inherit;font-size:16px;padding:.6rem .7rem;border:2px solid #dbe8f2;border-radius:14px;background:#fff;color:#12365e}'+'.adm-grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0 1rem}'+'.adm-outils{display:flex;flex-wrap:wrap;gap:.35rem;margin:.2rem 0 .3rem}.adm-outils button{font:inherit;font-size:.95rem;border:1px solid #dbe8f2;background:#fff;color:#12365e;border-radius:10px;padding:.35rem .7rem;cursor:pointer;min-width:38px}'+'.adm-outils .pastille{width:30px;min-width:30px;height:30px;border-radius:50%;padding:0;border:2px solid #fff;box-shadow:0 0 0 1px #dbe8f2}'+'.adm-note{font-size:.85rem !important;margin:.1rem 0 .3rem !important}'+'.adm-apercu{margin-top:1rem;padding:1rem;border-radius:20px;background:#f5f8fb;border:1px dashed #b8cfe0}.adm-apercu > strong{display:block;margin-bottom:.6rem;font-size:.9rem;color:#4a6684}'+'.adm-apercu .annonce{padding:0}.adm-apercu .annonce .wrap{margin:0}';
    document.head.appendChild(st);
  }
  function fermer(){ if(fond){fond.remove();fond=null;document.documentElement.classList.remove('recherche-ouverte','adm-ouvert');} }
  function cadre(titre,html){
    styles(); if(fond) fond.remove();
    fond=el('<div class="adm-fond" role="dialog" aria-modal="true" aria-label="Espace admin"><div class="adm" lang="fr"><div class="adm-tete"><h2>'+esc(titre)+'</h2><button type="button" class="adm-x" aria-label="Fermer">×</button></div>'+html+'</div></div>');
    fond.querySelector('.adm-x').addEventListener('click',fermer);
    fond.addEventListener('click',function(e){if(e.target===fond)fermer();});
    document.body.appendChild(fond); document.documentElement.classList.add('recherche-ouverte','adm-ouvert');
    var champ=fond.querySelector('input'); if(champ) setTimeout(function(){champ.focus();},50);
    return fond.querySelector('.adm');
  }
  function message(boite,texte,ok){var m=boite.querySelector('.adm-msg'); m.className='adm-msg '+(ok?'ok':'err'); m.textContent=texte;}
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&fond)fermer();});

  // ---------- Configuration (premier lancement) ----------
  function ecranConfig(){
    var b=cadre('Mise en route de l\'espace admin',
      '<p>Cette étape ne se fait qu\'une fois. Elle relie l\'espace admin au dépôt GitHub du site.</p>'+
      '<div class="adm-aide"><strong>Créer la clé GitHub</strong><ol><li>Sur github.com, ouvrez Settings, puis Developer settings, puis Personal access tokens, puis Fine-grained tokens.</li><li>Cliquez sur Generate new token, donnez-lui un nom, choisissez une durée.</li><li>Dans Repository access, choisissez Only select repositories et sélectionnez uniquement le dépôt du site.</li><li>Dans Permissions, mettez Contents sur Read and write.</li><li>Générez la clé et copiez-la ici.</li></ol></div>'+
      '<label for="adm-depot">Dépôt GitHub (exemple compte/nom-du-depot)</label><input type="text" id="adm-depot" autocomplete="off" spellcheck="false" placeholder="compte/nom-du-depot">'+
      '<label for="adm-branche">Branche</label><input type="text" id="adm-branche" value="main" autocomplete="off" spellcheck="false">'+
      '<label for="adm-dossier">Dossier du site dans le dépôt (laisser vide si le site est à la racine)</label><input type="text" id="adm-dossier" autocomplete="off" spellcheck="false">'+
      '<label for="adm-jeton">Clé GitHub</label><input type="password" id="adm-jeton" autocomplete="off">'+
      '<label for="adm-m1">Mot de passe admin (12 caractères minimum)</label><input type="password" id="adm-m1" autocomplete="new-password">'+
      '<label for="adm-m2">Confirmer le mot de passe</label><input type="password" id="adm-m2" autocomplete="new-password">'+
      '<div class="adm-btns"><button type="button" class="adm-b" id="adm-ok">Enregistrer</button></div><p class="adm-msg"></p>');
    var c=window.USP_ADMIN||{};
    if(c.depot) b.querySelector('#adm-depot').value=c.depot;
    if(c.branche) b.querySelector('#adm-branche').value=c.branche;
    if(c.dossier) b.querySelector('#adm-dossier').value=c.dossier;
    b.querySelector('#adm-ok').addEventListener('click',function(){
      var bt=this, depot=b.querySelector('#adm-depot').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$|\/$/g,''),
          branche=b.querySelector('#adm-branche').value.trim()||'main', dossier=b.querySelector('#adm-dossier').value.trim(),
          jeton=b.querySelector('#adm-jeton').value.trim(), m1=b.querySelector('#adm-m1').value, m2=b.querySelector('#adm-m2').value;
      if(!/^[\w.-]+\/[\w.-]+$/.test(depot)) return message(b,'Le dépôt doit être de la forme compte/nom-du-depot.');
      if(!jeton) return message(b,'Collez la clé GitHub.');
      if(m1.length<12) return message(b,'Le mot de passe doit faire au moins 12 caractères.');
      if(m1!==m2) return message(b,'Les deux mots de passe ne sont pas identiques.');
      var s={jeton:jeton,depot:depot,branche:branche,dossier:dossier};
      bt.disabled=true; message(b,'Vérification…',true);
      gh('/repos/'+depot,{},jeton).then(function(r){
        if(!r) throw new Error('Dépôt introuvable, ou la clé n\'y a pas accès.');
        return lireFichier('index.html',s).then(function(f){ if(!f) throw new Error('Le fichier index.html est introuvable dans ce dépôt, cette branche et ce dossier.'); });
      }).then(function(){ return chiffrer(jeton,m1); })
      .then(function(chiffre){
        var conf=Object.assign({depot:depot,branche:branche,dossier:dossier},chiffre);
        var contenu='/* Configuration de l\'espace admin. Créée au premier lancement, la clé GitHub y est chiffrée par le mot de passe. */\nwindow.USP_ADMIN = '+JSON.stringify(conf)+';\n';
        return ecrireFichier(FICHIER_CONF,contenu,'Espace admin, configuration',s).then(function(){window.USP_ADMIN=conf;});
      }).then(function(){ session=s; return chargerDonnees(); })
      .then(ecranPanneau)
      .catch(function(e){bt.disabled=false; message(b,messageErreur(e));});
    });
  }
  function messageErreur(e){
    if(e && e.status===401) return 'La clé GitHub est refusée. Elle est peut-être expirée ou mal copiée.';
    if(e && e.status===403) return 'La clé GitHub n\'a pas le droit d\'écrire dans ce dépôt (Contents doit être sur Read and write).';
    if(e && e.status===409) return 'Le fichier a été modifié entre-temps. Fermez l\'admin, rouvrez-le et recommencez.';
    if(e && /Failed to fetch|NetworkError/i.test(e.message||'')) return 'Pas de connexion à GitHub. Vérifiez votre connexion internet.';
    return (e && e.message) || 'Une erreur est survenue.';
  }

  // ---------- Connexion ----------
  var essais=0;
  function ecranConnexion(){
    var b=cadre('Espace admin',
      '<label for="adm-mdp">Mot de passe</label><input type="password" id="adm-mdp" autocomplete="current-password">'+
      '<div class="adm-btns"><button type="button" class="adm-b" id="adm-ok">Entrer</button></div><p class="adm-msg"></p>');
    var champ=b.querySelector('#adm-mdp'), bt=b.querySelector('#adm-ok');
    function entrer(){
      var c=window.USP_ADMIN; bt.disabled=true; message(b,'Vérification…',true);
      attendre(Math.min(essais,5)*600).then(function(){return dechiffrer(c,champ.value);})
      .then(function(jeton){ essais=0; session={jeton:jeton,depot:c.depot,branche:c.branche||'main',dossier:c.dossier||''}; return chargerDonnees(); })
      .then(ecranPanneau)
      .catch(function(e){ bt.disabled=false; essais++;
        if(session) return message(b,messageErreur(e));
        message(b,'Mot de passe incorrect.'); champ.select(); });
    }
    bt.addEventListener('click',entrer);
    champ.addEventListener('keydown',function(e){if(e.key==='Enter')entrer();});
  }

  // ---------- Données ----------
  function analyser(texte){
    var i=texte.indexOf('{'), j=texte.lastIndexOf('}');
    var d=JSON.parse(texte.slice(i,j+1));
    d.annonce=d.annonce||{actif:false,texte:''}; d.actualites=d.actualites||[]; return d;
  }
  function chargerDonnees(){
    return lireFichier(FICHIER_ACTU).then(function(f){
      donnees = f ? analyser(b64d(f.content)) : JSON.parse(JSON.stringify(window.USP_ACTU||{annonce:{actif:false,texte:''},actualites:[]}));
      donnees.annonce=donnees.annonce||{actif:false,texte:''}; donnees.actualites=donnees.actualites||[];
    });
  }
  function publier(boite,bt){
    bt.disabled=true; message(boite,'Publication en cours…',true);
    var contenu='/* Fichier mis à jour par l\'espace admin du site. Ne pas modifier à la main. */\nwindow.USP_ACTU = '+JSON.stringify(donnees)+';\n';
    return ecrireFichier(FICHIER_ACTU,contenu,'Actualités et bandeau, mise à jour depuis l\'espace admin').then(function(){
      bt.disabled=false; window.USP_ACTU=JSON.parse(JSON.stringify(donnees)); if(window.USP_AFFICHER_ACTUS) window.USP_AFFICHER_ACTUS();
      message(boite,'Publié. Les visiteurs verront la mise à jour d\'ici quelques minutes.',true);
    }).catch(function(e){bt.disabled=false; message(boite,messageErreur(e));});
  }


  // ---------- Mise en forme ----------
  var OPTS={
    police:[['site','Police du site'],['classique','Classique (Georgia)'],['large','Large (Verdana)'],['moderne','Moderne (Trebuchet)']],
    tTitre:[['petite','Petite'],['normale','Normale'],['grande','Grande'],['tresgrande','Très grande']],
    tTexte:[['normale','Normale'],['grande','Grande'],['tresgrande','Très grande']],
    cTitre:[['navy','Bleu marine'],['bleu','Bleu'],['canard','Vert canard'],['vert','Vert'],['orange','Orange'],['rouge','Rouge'],['rose','Rose'],['noir','Noir']],
    fond:[['blanc','Blanc'],['ciel','Bleu ciel'],['jaune','Jaune pâle'],['rose','Rose pâle'],['vert','Vert pâle']],
    anim:[['aucune','Aucune'],['apparition','Apparition en douceur'],['mots','Titre qui monte mot à mot'],['pulsation','Anneau qui pulse'],['respiration','Léger balancement'],['lumiere','Lumière qui suit la souris']],
    theme:[['jaune','Jaune'],['rouge','Rouge'],['bleu','Bleu'],['vert','Vert']],
    animB:[['aucune','Aucune'],['apparition','Descend en douceur'],['pulsation','Icône qui pulse']]
  };
  var COULEURS_TEXTE=[['rouge','#be163a'],['bleu','#006997'],['canard','#0e7376'],['vert','#2e7d32'],['orange','#a85406'],['rose','#c2306a'],['navy','#12365e']];
  function choix(id,cle,val,lib){
    return '<div><label for="'+id+'">'+lib+'</label><select id="'+id+'" class="adm-sel">'+OPTS[cle].map(function(o){return '<option value="'+o[0]+'"'+(o[0]===val?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select></div>';
  }
  function barreOutils(idZone){
    return '<div class="adm-outils" data-cible="'+idZone+'"><button type="button" data-f="gras" title="Gras"><b>G</b></button><button type="button" data-f="ital" title="Italique"><i>I</i></button><button type="button" data-f="liste" title="Liste à puces">• Liste</button>'+
      COULEURS_TEXTE.map(function(c){return '<button type="button" data-c="'+c[0]+'" title="Texte en '+c[0]+'" class="pastille" style="background:'+c[1]+'"></button>';}).join('')+'</div>'+
      '<p class="adm-note">Sélectionnez des mots puis cliquez sur un bouton. Exemples : **gras**, *italique*, [rouge]texte en rouge[/rouge], une ligne commençant par « - » devient une puce.</p>';
  }
  function brancherOutils(z,apres){
    z.querySelectorAll('.adm-outils').forEach(function(bar){
      var ta=z.querySelector('#'+bar.getAttribute('data-cible'));
      bar.addEventListener('click',function(e){
        var bt=e.target.closest('button'); if(!bt) return;
        var d=ta.selectionStart, f=ta.selectionEnd, sel=ta.value.slice(d,f)||'texte', av, ap;
        if(bt.dataset.f==='gras'){av='**';ap='**';}
        else if(bt.dataset.f==='ital'){av='*';ap='*';}
        else if(bt.dataset.f==='liste'){ sel=sel.split('\n').map(function(l){return /^\s*-\s/.test(l)?l:'- '+l;}).join('\n'); av=(d>0&&ta.value[d-1]!=='\n')?'\n':''; ap=''; }
        else if(bt.dataset.c){av='['+bt.dataset.c+']';ap='[/'+bt.dataset.c+']';}
        var res = bt.dataset.f==='liste' ? av+sel : sel.split('\n').map(function(l){return l.trim()?av+l+ap:l;}).join('\n');
        ta.setRangeText(res,d,f,'select'); ta.focus(); ta.dispatchEvent(new Event('input',{bubbles:true})); if(apres) apres();
      });
    });
  }

  // ---------- Panneau ----------
  var onglet='actus', edition=null;
  function ecranPanneau(){
    var b=cadre('Espace admin',
      '<div class="adm-onglets"><button type="button" data-o="actus">Actualités</button><button type="button" data-o="bandeau">Bandeau d\'annonce</button><button type="button" data-o="reglages">Réglages</button></div>'+
      '<div class="adm-zone"></div>'+
      '<div class="adm-btns"><button type="button" class="adm-b pub" id="adm-pub">Publier</button><button type="button" class="adm-b sec" id="adm-fin">Se déconnecter</button></div><p class="adm-msg"></p>');
    b.querySelectorAll('.adm-onglets button').forEach(function(x){x.addEventListener('click',function(){onglet=x.getAttribute('data-o'); edition=null; dessiner(b);});});
    b.querySelector('#adm-pub').addEventListener('click',function(){publier(b,this);});
    b.querySelector('#adm-fin').addEventListener('click',function(){session=null;donnees=null;fermer();});
    dessiner(b);
  }
  function dessiner(b){
    b.querySelectorAll('.adm-onglets button').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-o')===onglet);});
    var z=b.querySelector('.adm-zone'); b.querySelector('.adm-msg').textContent='';
    if(onglet==='bandeau'){
      var sb=donnees.annonce.style||(donnees.annonce.style={});
      z.innerHTML='<p>Le bandeau s\'affiche en haut de toutes les pages, par exemple pour une fermeture exceptionnelle ou un changement d\'horaires.</p>'+
        '<label class="coche"><input type="checkbox" id="adm-ban-on"'+(donnees.annonce.actif?' checked':'')+'> Afficher le bandeau</label>'+
        '<label for="adm-ban-txt">Message</label>'+barreOutils('adm-ban-txt')+'<textarea id="adm-ban-txt" maxlength="400">'+esc(donnees.annonce.texte)+'</textarea>'+
        '<div class="adm-grille">'+choix('adm-ban-th','theme',sb.theme||'jaune','Couleur')+choix('adm-ban-an','animB',sb.anim||'aucune','Animation')+'</div>'+
        '<div class="adm-apercu"><strong>Aperçu</strong><div class="adm-ap"></div></div>';
      var minB=null; function apercuB(){ clearTimeout(minB); minB=setTimeout(apercuBmaintenant,250); }
      function apercuBmaintenant(){ var ap=z.querySelector('.adm-ap'); ap.innerHTML = donnees.annonce.texte && window.USP_RENDU ? window.USP_RENDU.bandeau(donnees.annonce) : '<em>Écrivez un message pour voir l\'aperçu.</em>'; }
      z.querySelector('#adm-ban-on').addEventListener('change',function(){donnees.annonce.actif=this.checked;});
      z.querySelector('#adm-ban-txt').addEventListener('input',function(){donnees.annonce.texte=this.value; apercuB();});
      z.querySelector('#adm-ban-th').addEventListener('change',function(){sb.theme=this.value; apercuB();});
      z.querySelector('#adm-ban-an').addEventListener('change',function(){sb.anim=this.value; apercuB();});
      brancherOutils(z); apercuBmaintenant();
      return;
    }
    if(onglet==='reglages'){
      z.innerHTML='<p>Dépôt relié ' + esc(session.depot) + ', branche ' + esc(session.branche) + (session.dossier?', dossier '+esc(session.dossier):'') + '.</p>'+
        '<p>Pour remplacer la clé GitHub (par exemple quand elle expire) ou changer le mot de passe, relancez la mise en route.</p>'+
        '<div class="adm-btns"><button type="button" class="adm-b sec" id="adm-reconf">Remplacer la clé ou le mot de passe</button></div>';
      z.querySelector('#adm-reconf').addEventListener('click',ecranConfig);
      return;
    }
    // Actualités
    var liste=donnees.actualites.slice().sort(function(a,c){return String(c.date).localeCompare(String(a.date));});
    var html='<p>Les actualités s\'affichent sur la page d\'accueil, les épinglées en premier, puis les plus récentes (6 au maximum).</p>';
    html+= liste.length ? '<ul class="adm-liste">'+liste.map(function(a){return '<li><span><strong>'+(a.epingle?'📌 ':'')+esc(a.titre)+'</strong><small>'+esc(a.date)+'</small></span><span class="act"><button type="button" data-m="'+esc(a.id)+'">Modifier</button><button type="button" data-s="'+esc(a.id)+'">Supprimer</button></span></li>';}).join('')+'</ul>' : '<p><em>Aucune actualité pour l\'instant.</em></p>';
    var a=edition ? donnees.actualites.filter(function(x){return x.id===edition;})[0] : null;
    html+='<h3>'+(a?'Modifier l\'actualité':'Nouvelle actualité')+'</h3>'+
      '<label for="adm-t">Titre</label><input type="text" id="adm-t" maxlength="120" value="'+esc(a?a.titre:'')+'">'+
      '<label for="adm-d">Date</label><input type="date" id="adm-d" value="'+esc(a?a.date:aujourdhui())+'">'+
      '<label for="adm-x">Texte</label>'+barreOutils('adm-x')+'<textarea id="adm-x" maxlength="1500">'+esc(a?a.texte:'')+'</textarea>'+
      '<label for="adm-l">Lien (facultatif, adresse internet ou page du site)</label><input type="text" id="adm-l" spellcheck="false" placeholder="https://… ou vaccination.html" value="'+esc(a?a.lien:'')+'">'+
      '<label class="coche"><input type="checkbox" id="adm-e"'+(a&&a.epingle?' checked':'')+'> Épingler en haut</label>'+
      '<div class="adm-grille">'+choix('adm-po','police',((a&&a.style)||{}).police||'site','Police')+choix('adm-ct','cTitre',((a&&a.style)||{}).cTitre||'navy','Couleur du titre')+choix('adm-tt','tTitre',((a&&a.style)||{}).tTitre||'normale','Taille du titre')+choix('adm-tx','tTexte',((a&&a.style)||{}).tTexte||'normale','Taille du texte')+choix('adm-fo','fond',((a&&a.style)||{}).fond||'blanc','Fond de la carte')+choix('adm-an','anim',((a&&a.style)||{}).anim||'aucune','Animation')+'</div>'+
      '<div class="adm-apercu"><strong>Aperçu</strong><div class="adm-ap actus-liste" style="grid-template-columns:1fr"></div></div>'+
      '<div class="adm-btns"><button type="button" class="adm-b" id="adm-add">'+(a?'Enregistrer la modification':'Ajouter')+'</button>'+(a?'<button type="button" class="adm-b sec" id="adm-annul">Annuler</button>':'')+'</div>';
    z.innerHTML=html;
    function lireForm(){
      return {id:a?a.id:('a'+Date.now().toString(36)),titre:z.querySelector('#adm-t').value.trim(),date:z.querySelector('#adm-d').value||aujourdhui(),texte:z.querySelector('#adm-x').value.trim(),lien:z.querySelector('#adm-l').value.trim(),epingle:z.querySelector('#adm-e').checked,
        style:{police:z.querySelector('#adm-po').value,cTitre:z.querySelector('#adm-ct').value,tTitre:z.querySelector('#adm-tt').value,tTexte:z.querySelector('#adm-tx').value,fond:z.querySelector('#adm-fo').value,anim:z.querySelector('#adm-an').value}};
    }
    var minA=null; function apercuA(){ clearTimeout(minA); minA=setTimeout(apercuAmaintenant,250); }
    function apercuAmaintenant(){ var it=lireForm(), ap=z.querySelector('.adm-ap'); ap.innerHTML = it.titre && window.USP_RENDU ? window.USP_RENDU.actu(it) : '<em>Écrivez un titre pour voir l\'aperçu.</em>'; }
    z.querySelectorAll('#adm-t,#adm-x,#adm-d,#adm-l').forEach(function(x){x.addEventListener('input',apercuA);});
    z.querySelectorAll('.adm-sel,#adm-e').forEach(function(x){x.addEventListener('change',apercuA);});
    brancherOutils(z,apercuA); apercuAmaintenant();
    z.querySelectorAll('[data-m]').forEach(function(x){x.addEventListener('click',function(){edition=x.getAttribute('data-m');dessiner(b);});});
    z.querySelectorAll('[data-s]').forEach(function(x){x.addEventListener('click',function(){
      if(!confirm('Supprimer cette actualité ? Elle disparaîtra du site après la publication.')) return;
      var id=x.getAttribute('data-s'); donnees.actualites=donnees.actualites.filter(function(y){return y.id!==id;}); edition=null; dessiner(b);
      message(b,'Supprimée. Cliquez sur Publier pour mettre le site à jour.',true);
    });});
    if(a) z.querySelector('#adm-annul').addEventListener('click',function(){edition=null;dessiner(b);});
    z.querySelector('#adm-add').addEventListener('click',function(){
      var t=z.querySelector('#adm-t').value.trim(); if(!t) return message(b,'Le titre est obligatoire.');
      var item=lireForm();
      if(item.lien && !/^(https?:\/\/|pdf\/|[\w-]+\.html)/.test(item.lien)) return message(b,'Le lien doit commencer par https:// ou être une page du site, par exemple vaccination.html.');
      if(a){donnees.actualites=donnees.actualites.map(function(y){return y.id===a.id?item:y;});} else {donnees.actualites.push(item);}
      edition=null; dessiner(b); message(b,'Enregistrée. Cliquez sur Publier pour mettre le site à jour.',true);
    });
  }

  // ---------- Ouverture ----------
  function ouvrir(){
    if(!window.isSecureContext || !window.crypto || !crypto.subtle){
      cadre('Espace admin','<p class="adm-msg err">L\'espace admin fonctionne uniquement sur le site en ligne (adresse en https).</p>'); return;
    }
    if(session && donnees) return ecranPanneau();
    var s=document.createElement('script'); s.src='js/admin-config.js?t='+Date.now();
    s.onload=s.onerror=function(){ var c=window.USP_ADMIN||{}; if(c.jeton&&c.sel&&c.iv) ecranConnexion(); else ecranConfig(); };
    document.body.appendChild(s);
  }
  window.USP_ADMIN_OUVRIR=ouvrir;
})();
