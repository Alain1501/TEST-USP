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
    '.adm-aide ol{margin:.3rem 0 0;padding-left:1.2rem}'+'html.adm-ouvert .halo,html.adm-ouvert main *,html.adm-ouvert main *::before,html.adm-ouvert main *::after,html.adm-ouvert .entete *{animation-play-state:paused !important}html.adm-ouvert .halo{animation:none !important}html.adm-ouvert main{visibility:hidden}'+'.adm-sel{width:100%;font:inherit;font-size:16px;padding:.6rem .7rem;border:2px solid #dbe8f2;border-radius:14px;background:#fff;color:#12365e}'+'.adm-grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0 1rem}'+'.adm-outils{display:flex;flex-wrap:wrap;gap:.35rem;margin:.2rem 0 .3rem}.adm-outils button{font:inherit;font-size:.95rem;border:1px solid #dbe8f2;background:#fff;color:#12365e;border-radius:10px;padding:.35rem .7rem;cursor:pointer;min-width:38px}'+'.adm-outils .pastille{width:30px;min-width:30px;height:30px;border-radius:50%;padding:0;border:2px solid #fff;box-shadow:0 0 0 1px #dbe8f2}'+'.adm-note{font-size:.85rem !important;margin:.1rem 0 .3rem !important}'+'.adm-apercu{margin-top:1rem;padding:1rem;border-radius:20px;background:#f5f8fb;border:1px dashed #b8cfe0}.adm-apercu > strong{display:block;margin-bottom:.6rem;font-size:.9rem;color:#4a6684}'+'.adm-apercu .annonce{padding:0}.adm-apercu .annonce .wrap{margin:0}'+'.adm-editeur{min-height:120px;max-height:320px;overflow:auto;padding:.75rem .9rem;border:2px solid #dbe8f2;border-radius:14px;background:#fff;line-height:1.55;outline:none}.adm-editeur:focus{border-color:#006997}.adm-editeur p{margin:0 0 .4rem}.adm-editeur a{color:#006997;text-decoration:underline}'+'.adm-lienbox{background:#f5f8fb;border:1px solid #dbe8f2;border-radius:14px;padding:.4rem .9rem .9rem;margin:.3rem 0 .5rem}'+'.adm-ajout{margin-top:.6rem;background:#f5f8fb;border-radius:14px;padding:.6rem .9rem}.adm-ajout summary{cursor:pointer;font-weight:700}'+'.adm input[type=file]{font:inherit;font-size:.95rem;margin:.2rem 0}'+'.adm-choix li.sel{background:#dcecf7;box-shadow:0 0 0 2px #006997 inset}.adm-bas{position:sticky;bottom:-1.6rem;background:#fff;padding:.8rem 0 .4rem;margin-top:1rem;border-top:1px solid #eef2f6}';
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
    return JSON.parse(texte.slice(i,j+1));
  }
  function preparer(d){
    d=d||{}; d.actualites=d.actualites||[]; d.annonces=d.annonces||[];
    if(d.annonce){ var A=d.annonce; if(A.texte||A.html){ A.id=A.id||'b'+Date.now().toString(36); d.annonces.unshift(A);} delete d.annonce; }
    d.annonces.forEach(function(x,k){ x.id=x.id||('b'+k+Date.now().toString(36)); });
    d.actualites.forEach(function(x,k){ x.id=x.id||('a'+k+Date.now().toString(36)); });
    d.annonces.forEach(normaliser); d.actualites.forEach(normaliser);
    return d;
  }
  function chargerDonnees(){
    return lireFichier(FICHIER_ACTU).then(function(f){
      donnees = preparer(f ? analyser(b64d(f.content)) : JSON.parse(JSON.stringify(window.USP_ACTU||{})));
      modifie=false;
    });
  }
  function publier(boite,bt){
    bt.disabled=true; message(boite,'Publication en cours…',true);
    // Les éléments laissés vides ne sont pas publiés
    var net=function(x){var y=JSON.parse(JSON.stringify(x)); y.html=window.USP_RENDU.nettoyer(y.html||''); return y;};
    var propre={actualites:donnees.actualites.filter(function(x){return (x.titre||'').trim();}).map(net),annonces:donnees.annonces.filter(function(x){return !vide(x.html);}).map(net)};
    var contenu='/* Fichier mis à jour par l\'espace admin du site. Ne pas modifier à la main. */\nwindow.USP_ACTU = '+JSON.stringify(propre)+';\n';
    return ecrireFichier(FICHIER_ACTU,contenu,'Actualités et bandeau, mise à jour depuis l\'espace admin').then(function(){
      bt.disabled=false; modifie=false; bt.textContent='Publier'; window.USP_ACTU=JSON.parse(JSON.stringify(propre)); if(window.USP_AFFICHER_ACTUS) window.USP_AFFICHER_ACTUS();
      message(boite,'Publié. Les visiteurs verront la mise à jour d\'ici quelques minutes.',true);
    }).catch(function(e){bt.disabled=false; message(boite,messageErreur(e));});
  }


  // ---------- Mise en forme ----------
  var DEST={"pages": [["Accueil", [["Accueil, page entière", "index.html"], ["Accueil, Que souhaitez-vous faire ?", "index.html#portes"], ["Accueil, Actualités", "index.html#actualites"], ["Accueil, Nos lieux d'accueil", "index.html#nos-lieux"]]], ["Dépistage et santé sexuelle", [["Dépistage et santé sexuelle, page entière", "depistage-sante-sexuelle.html"], ["Se faire dépister", "depistage-sante-sexuelle.html#depistage"], ["La PrEP, se protéger du VIH avant une exposition", "depistage-sante-sexuelle.html#prep"], ["Le TPE, un traitement d'urgence après une exposition au VIH", "depistage-sante-sexuelle.html#tpe"], ["Questions fréquentes", "depistage-sante-sexuelle.html#questions"]]], ["Vaccination", [["Vaccination, page entière", "vaccination.html"], ["Se faire vacciner", "vaccination.html#vacciner"], ["Quels vaccins, à quel âge ?", "vaccination.html#ages"], ["Les méningites", "vaccination.html#meningites"], ["Le BCG, vaccin contre la tuberculose", "vaccination.html#bcg"], ["Vaccination au collège", "vaccination.html#college"], ["Vaccins du voyageur", "vaccination.html#voyage"], ["Questions fréquentes", "vaccination.html#questions"], ["Documents et liens utiles", "vaccination.html#ressources"]]], ["Tuberculose", [["Tuberculose, page entière", "tuberculose.html"], ["Comprendre la tuberculose", "tuberculose.html#comprendre"], ["J'ai été en contact avec une personne malade", "tuberculose.html#contact"], ["Mon test est positif, qu'est-ce que ça veut dire ?", "tuberculose.html#positif"], ["Le traitement", "tuberculose.html#traitement"], ["Vrai ou faux ?", "tuberculose.html#vrai-faux"], ["Nous contacter", "tuberculose.html#contacter"], ["Pour les professionnels de santé", "tuberculose.html#professionnels"]]], ["Accès aux soins", [["Accès aux soins, page entière", "acces-aux-soins.html"], ["La PASS, Permanence d'Accès aux Soins de Santé", "acces-aux-soins.html#pass"], ["La PASS Mobile", "acces-aux-soins.html#pass-mobile"], ["Je viens d'arriver en France, un bilan de santé", "acces-aux-soins.html#arrivee"], ["Mineurs non accompagnés", "acces-aux-soins.html#mna"], ["Langues", "acces-aux-soins.html#langues"]]], ["Santé des femmes", [["Santé des femmes, page entière", "sante-des-femmes.html"], ["Consultation gynécologique", "sante-des-femmes.html#consultation"], ["Dépistage du cancer du col de l'utérus", "sante-des-femmes.html#col"], ["Suivi de grossesse", "sante-des-femmes.html#grossesse"], ["Contraception", "sante-des-femmes.html#contraception"], ["Violences conjugales", "sante-des-femmes.html#violences"]]], ["Où et quand nous trouver", [["Où et quand nous trouver, page entière", "ou-et-quand.html"], ["Carte de nos lieux", "ou-et-quand.html#carte"], ["Melun, Unité de Santé Publique", "ou-et-quand.html#lieu-melun"], ["Nemours, Centre Hospitalier du Sud Seine-et-Marne, site de Nemours", "ou-et-quand.html#lieu-nemours"], ["Savigny-le-Temple, Centre Françoise Dolto", "ou-et-quand.html#lieu-savigny"], ["Montereau, Centre Hospitalier du Sud Seine-et-Marne, site de Montereau", "ou-et-quand.html#lieu-montereau"], ["Tuberculose, CLAT Sud 77", "ou-et-quand.html#lieu-clat"], ["PASS, accès aux soins", "ou-et-quand.html#lieu-pass"], ["Pour tout renseignement", "ou-et-quand.html#lieu-rens"]]]], "itin": [["Unité de Santé Publique, 8 rue de Vaux, 77000 Melun", "https://www.google.com/maps/dir/?api=1&destination=Unit%C3%A9%20de%20Sant%C3%A9%20Publique%2C%208%20rue%20de%20Vaux%2C%2077000%20Melun"], ["PASS, Hôpital de Melun, 270 avenue Marc Jacquet, 77000 Melun", "https://www.google.com/maps/dir/?api=1&destination=PASS%2C%20H%C3%B4pital%20de%20Melun%2C%20270%20avenue%20Marc%20Jacquet%2C%2077000%20Melun"], ["Centre Hospitalier du Sud Seine-et-Marne, site de Nemours, 15 rue des Chaudins, 77140 Nemours", "https://www.google.com/maps/dir/?api=1&destination=Centre%20Hospitalier%20du%20Sud%20Seine-et-Marne%2C%20site%20de%20Nemours%2C%2015%20rue%20des%20Chaudins%2C%2077140%20Nemours"], ["Centre Françoise Dolto, Chemin du Plessis, 77176 Savigny-le-Temple", "https://www.google.com/maps/dir/?api=1&destination=Centre%20Fran%C3%A7oise%20Dolto%2C%20Chemin%20du%20Plessis%2C%2077176%20Savigny-le-Temple"], ["Centre Hospitalier du Sud Seine-et-Marne, site de Montereau, 1 rue Victor Hugo, Pavillon B1 Chirurgie, 77130 Montereau", "https://www.google.com/maps/dir/?api=1&destination=Centre%20Hospitalier%20du%20Sud%20Seine-et-Marne%2C%20site%20de%20Montereau%2C%201%20rue%20Victor%20Hugo%2C%20Pavillon%20B1%20Chirurgie%2C%2077130%20Montereau"]]};
  var OPTS={
    police:[['site','Police du site'],['classique','Classique (Georgia)'],['large','Large (Verdana)'],['moderne','Moderne (Trebuchet)']],
    tTitre:[['petite','Petite'],['normale','Normale'],['grande','Grande'],['tresgrande','Très grande']],
    tTexte:[['normale','Normale'],['grande','Grande'],['tresgrande','Très grande']],
    cTitre:[['navy','Bleu marine'],['bleu','Bleu'],['canard','Vert canard'],['vert','Vert'],['orange','Orange'],['rouge','Rouge'],['rose','Rose'],['noir','Noir']],
    fond:[['blanc','Blanc'],['ciel','Bleu ciel'],['jaune','Jaune pâle'],['rose','Rose pâle'],['vert','Vert pâle'],['orange','Orange pâle'],['gris','Gris clair']],
    anim:[['aucune','Aucune'],['apparition','Apparition en montant'],['fondu','Fondu'],['gauche','Arrive par la gauche'],['droite','Arrive par la droite'],['zoom','Zoom'],['rebond','Rebond'],['mots','Titre qui monte mot à mot'],['pulsation','Anneau qui pulse'],['battement','Battement de cœur'],['respiration','Léger balancement'],['secousse','Petite secousse'],['clignote','Clignotement doux'],['reflet','Reflet lumineux'],['lumiere','Lumière qui suit la souris']],
    animB:[['aucune','Aucune'],['apparition','Descend en douceur'],['fondu','Fondu'],['gauche','Arrive par la gauche'],['droite','Arrive par la droite'],['zoom','Zoom'],['rebond','Rebond'],['pulsation','Icône qui pulse'],['battement','Battement de cœur'],['secousse','Petite secousse'],['clignote','Clignotement doux'],['reflet','Reflet lumineux']],
    duree:[['','Durée normale'],['0.5','Très rapide (0,5 s)'],['1','Rapide (1 s)'],['1.5','1,5 s'],['2','Moyenne (2 s)'],['3','Lente (3 s)'],['5','Très lente (5 s)'],['8','Extra lente (8 s)']],
    repet:[['','Répétition normale'],['1','Une fois'],['2','Deux fois'],['3','Trois fois'],['boucle','En boucle']],
    delai:[['','Sans délai'],['0.3','Après 0,3 s'],['0.6','Après 0,6 s'],['1','Après 1 s'],['2','Après 2 s']],
    theme:[['jaune','Jaune'],['orange','Orange'],['rouge','Rouge'],['rose','Rose'],['bleu','Bleu'],['vert','Vert'],['marine','Bleu marine (fond foncé)']]
  };
  var COULEURS_TEXTE=[['Bleu marine (normal)','#12365e'],['Rouge','#be163a'],['Bleu','#006997'],['Vert canard','#0e7376'],['Vert','#2e7d32'],['Orange','#a85406'],['Rose','#c2306a'],['Noir','#1a1a1a']];
  function choix(id,cle,val,lib){
    return '<div><label for="'+id+'">'+lib+'</label><select id="'+id+'" class="adm-sel" data-cle="'+cle+'">'+OPTS[cle].map(function(o){return '<option value="'+o[0]+'"'+(o[0]===(val||'')?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select></div>';
  }
  function blocAnimation(pref,st,liste){
    return '<h3>Animation</h3><div class="adm-grille">'+choix(pref+'-an',liste,st.anim||'aucune','Effet')+choix(pref+'-du','duree',st.duree,'Durée')+choix(pref+'-re','repet',st.repet,'Répétition')+choix(pref+'-de','delai',st.delai,'Départ')+'</div>'+
      '<div class="adm-btns" style="margin-top:.5rem"><button type="button" class="adm-b sec adm-rejouer">▶ Rejouer l\'animation dans l\'aperçu</button></div>';
  }
  function lireAnimation(z,pref,st){ st.anim=z.querySelector('#'+pref+'-an').value; st.duree=z.querySelector('#'+pref+'-du').value; st.repet=z.querySelector('#'+pref+'-re').value; st.delai=z.querySelector('#'+pref+'-de').value; }

  // Éditeur de texte : ce que l'on voit est ce qui sera publié
  function editeur(id,html){
    return '<div class="adm-outils" data-ed="'+id+'">'+
      '<button type="button" data-cmd="bold" title="Gras"><b>G</b></button><button type="button" data-cmd="italic" title="Italique"><i>I</i></button><button type="button" data-cmd="underline" title="Souligné"><u>S</u></button>'+
      '<button type="button" data-cmd="insertUnorderedList" title="Liste à puces">• Liste</button>'+
      COULEURS_TEXTE.map(function(c){return '<button type="button" data-coul="'+c[1]+'" title="'+c[0]+'" class="pastille" style="background:'+c[1]+'"></button>';}).join('')+
      '<button type="button" data-lien="1" title="Mettre un lien sur les mots sélectionnés">🔗 Lien</button><button type="button" data-cmd="unlink" title="Retirer le lien">Retirer le lien</button><button type="button" data-cmd="removeFormat" title="Effacer la mise en forme">Effacer la mise en forme</button></div>'+
      '<div class="adm-lienbox" data-pour="'+id+'" hidden></div>'+
      '<div class="adm-editeur" id="'+id+'" contenteditable="true" role="textbox" aria-multiline="true">'+html+'</div>'+
      '<p class="adm-note">Sélectionnez des mots, puis choisissez gras, couleur ou lien. Pour changer une couleur, resélectionnez les mots et cliquez sur la nouvelle couleur.</p>';
  }
  function choixDestination(pref){
    var pages=DEST.pages.map(function(g){return '<optgroup label="'+esc(g[0])+'">'+g[1].map(function(i){return '<option value="'+esc(i[1])+'">'+esc(i[0])+'</option>';}).join('')+'</optgroup>';}).join('');
    var itin=DEST.itin.map(function(i){return '<option value="'+esc(i[1])+'" data-lib="Comment s\'y rendre">'+esc(i[0])+'</option>';}).join('');
    return '<div class="adm-dest" data-pref="'+pref+'">'+
      '<label for="'+pref+'-type">Vers</label><select id="'+pref+'-type" class="adm-sel adm-dtype"><option value="page">Une rubrique du site</option><option value="itin">Un itinéraire (comment s\'y rendre)</option><option value="doc">Un document à joindre (PDF, image, Word…)</option><option value="web">Une adresse internet</option><option value="tel">Un numéro de téléphone</option></select>'+
      '<div data-t="page"><label for="'+pref+'-page">Rubrique</label><select id="'+pref+'-page" class="adm-sel">'+pages+'</select></div>'+
      '<div data-t="itin" hidden><label for="'+pref+'-itin">Lieu</label><select id="'+pref+'-itin" class="adm-sel">'+itin+'</select></div>'+
      '<div data-t="doc" hidden><label for="'+pref+'-doc">Fichier (15 Mo au maximum)</label><input type="file" id="'+pref+'-doc" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.txt"><p class="adm-note">Le fichier est envoyé dans le dossier « docs » du site au moment où vous validez.</p></div>'+
      '<div data-t="web" hidden><label for="'+pref+'-web">Adresse internet</label><input type="url" id="'+pref+'-web" placeholder="https://…"></div>'+
      '<div data-t="tel" hidden><label for="'+pref+'-tel">Numéro</label><input type="text" id="'+pref+'-tel" placeholder="01 81 74 28 50"></div>'+
    '</div>';
  }
  function brancherDestination(box){
    var t=box.querySelector('.adm-dtype');
    t.addEventListener('change',function(){ box.querySelectorAll('[data-t]').forEach(function(d){d.hidden=d.getAttribute('data-t')!==t.value;}); });
  }
  function nomFichier(n){
    var p=n.lastIndexOf('.'), base=(p>0?n.slice(0,p):n), ext=(p>0?n.slice(p+1):'').toLowerCase().replace(/[^a-z0-9]/g,'');
    base=base.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'document';
    return new Date().toISOString().slice(0,10)+'-'+base+(ext?'.'+ext:'');
  }
  function envoyerDocument(fichier){
    if(fichier.size>15*1024*1024) return Promise.reject(new Error('Le fichier dépasse 15 Mo.'));
    return new Promise(function(ok,ko){var r=new FileReader(); r.onload=function(){ok(String(r.result).split(',')[1]);}; r.onerror=function(){ko(new Error('Lecture du fichier impossible.'));}; r.readAsDataURL(fichier);})
      .then(function(b64){
        var nom=nomFichier(fichier.name), chemin='docs/'+nom;
        return gh('/repos/'+session.depot+'/contents/'+encodeURI(cheminDepot(chemin)),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Document ajouté depuis l\'espace admin',content:b64,branch:session.branche})})
          .then(function(){return {href:chemin,lib:'Télécharger le document'};});
      });
  }
  // Lit la destination choisie ; renvoie {href, lib} (le document est envoyé sur GitHub si besoin)
  function lireDestination(box){
    var pref=box.getAttribute('data-pref'), t=box.querySelector('.adm-dtype').value;
    if(t==='page'){var s=box.querySelector('#'+pref+'-page'); return Promise.resolve({href:s.value,lib:s.options[s.selectedIndex].text.replace(/, page entière$/,'')});}
    if(t==='itin'){var s2=box.querySelector('#'+pref+'-itin'); return Promise.resolve({href:s2.value,lib:'Comment s\'y rendre'});}
    if(t==='web'){var u=box.querySelector('#'+pref+'-web').value.trim(); if(!/^https?:\/\/\S+$/.test(u)) return Promise.reject(new Error('L\'adresse internet doit commencer par https://')); return Promise.resolve({href:u,lib:'En savoir plus'});}
    if(t==='tel'){var n=box.querySelector('#'+pref+'-tel').value.replace(/[^\d+]/g,''); if(n.length<3) return Promise.reject(new Error('Numéro de téléphone incomplet.')); return Promise.resolve({href:'tel:'+(n.charAt(0)==='0'?'+33'+n.slice(1):n),lib:'Appeler le '+box.querySelector('#'+pref+'-tel').value.trim()});}
    var f=box.querySelector('#'+pref+'-doc').files[0]; if(!f) return Promise.reject(new Error('Choisissez un fichier.'));
    return envoyerDocument(f);
  }
  function brancherEditeur(z,b,id,change){
    var ed=z.querySelector('#'+id), bar=z.querySelector('.adm-outils[data-ed="'+id+'"]'), boite=z.querySelector('.adm-lienbox[data-pour="'+id+'"]'), plage=null;
    try{document.execCommand('styleWithCSS',false,true);}catch(e){}
    function garder(){var s=window.getSelection(); if(s.rangeCount && ed.contains(s.anchorNode)) plage=s.getRangeAt(0).cloneRange();}
    function remettre(){ if(!plage) return; ed.focus(); var s=window.getSelection(); s.removeAllRanges(); s.addRange(plage); }
    ed.addEventListener('keyup',garder); ed.addEventListener('mouseup',garder); ed.addEventListener('input',function(){garder(); change();});
    ed.addEventListener('paste',function(e){ e.preventDefault(); var t=(e.clipboardData||window.clipboardData).getData('text/plain'); document.execCommand('insertText',false,t); });
    bar.addEventListener('mousedown',function(e){ if(e.target.closest('button')) e.preventDefault(); });
    bar.addEventListener('click',function(e){
      var bt=e.target.closest('button'); if(!bt) return;
      if(bt.dataset.lien){
        garder(); if(!plage || plage.collapsed){ message(b,'Sélectionnez d\'abord les mots sur lesquels mettre le lien.'); return; }
        boite.hidden=false; boite.innerHTML=choixDestination(id+'-l')+'<div class="adm-btns"><button type="button" class="adm-b" data-ok="1">Mettre le lien</button><button type="button" class="adm-b sec" data-ann="1">Annuler</button></div>';
        brancherDestination(boite.querySelector('.adm-dest'));
        boite.querySelector('[data-ann]').onclick=function(){boite.hidden=true;boite.innerHTML='';};
        boite.querySelector('[data-ok]').onclick=function(){
          var o=this; o.disabled=true; message(b,'…',true);
          lireDestination(boite.querySelector('.adm-dest')).then(function(r){
            remettre(); document.execCommand('createLink',false,r.href); boite.hidden=true; boite.innerHTML=''; message(b,'Lien ajouté.',true); change();
          }).catch(function(err){o.disabled=false; message(b,messageErreur(err));});
        };
        return;
      }
      ed.focus(); if(plage){var s=window.getSelection(); if(!s.rangeCount||!ed.contains(s.anchorNode)){s.removeAllRanges(); s.addRange(plage);}}
      if(bt.dataset.coul) document.execCommand('foreColor',false,bt.dataset.coul);
      else document.execCommand(bt.dataset.cmd,false,null);
      garder(); change();
    });
  }
  // Liste de boutons (liens, itinéraires, documents) sous le texte
  function blocBoutons(pref,liste){
    return '<h3>Boutons sous le texte</h3><div class="adm-bliste">'+(liste.length?'<ul class="adm-liste">'+liste.map(function(x,i){return '<li><span><strong>'+esc(x.lib)+'</strong><small>'+esc(x.href.length>70?x.href.slice(0,70)+'…':x.href)+'</small></span><span class="act"><button type="button" data-bh="'+i+'">↑</button><button type="button" data-bs="'+i+'">Retirer</button></span></li>';}).join('')+'</ul>':'<p><em>Aucun bouton.</em></p>')+'</div>'+
      '<details class="adm-ajout"><summary>Ajouter un bouton (rubrique du site, itinéraire, document, site internet, téléphone)</summary>'+choixDestination(pref)+
      '<label for="'+pref+'-lib">Texte du bouton (facultatif)</label><input type="text" id="'+pref+'-lib" maxlength="60" placeholder="Rempli automatiquement si vide">'+
      '<div class="adm-btns"><button type="button" class="adm-b" data-badd="1">Ajouter le bouton</button></div></details>';
  }
  function brancherBoutons(z,b,pref,liste,redessiner,change){
    var box=z.querySelector('.adm-dest[data-pref="'+pref+'"]'); if(box) brancherDestination(box);
    z.querySelectorAll('[data-bs]').forEach(function(x){x.onclick=function(){liste.splice(+x.dataset.bs,1); redessiner();};});
    z.querySelectorAll('[data-bh]').forEach(function(x){x.onclick=function(){var i=+x.dataset.bh; if(i>0){var t=liste[i-1];liste[i-1]=liste[i];liste[i]=t;} redessiner();};});
    var add=z.querySelector('[data-badd]');
    if(add) add.onclick=function(){
      var o=this; o.disabled=true; message(b,'…',true);
      lireDestination(box).then(function(r){
        var lib=z.querySelector('#'+pref+'-lib').value.trim(); liste.push({lib:lib||r.lib,href:r.href}); redessiner(); message(b,'Bouton ajouté. Pensez à publier.',true);
      }).catch(function(err){o.disabled=false; message(b,messageErreur(err));});
    };
  }
  function rejouer(z){ var ap=z.querySelector('.adm-ap'); if(!ap) return; var h=ap.innerHTML; ap.innerHTML=''; void ap.offsetWidth; ap.innerHTML=h; }

  // ---------- Panneau ----------
  // Toutes les modifications restent en mémoire, d'un onglet à l'autre, jusqu'au clic sur « Publier »
  var onglet='actus', selActu=null, selBan=null, modifie=false;
  function marquer(b){ modifie=true; var p=b && b.querySelector('#adm-pub'); if(p) p.textContent='Publier les modifications ●'; }
  window.addEventListener('beforeunload',function(e){ if(modifie){ e.preventDefault(); e.returnValue=''; } });
  function ecranPanneau(){
    var b=cadre('Espace admin',
      '<div class="adm-onglets"><button type="button" data-o="actus">Actualités</button><button type="button" data-o="bandeau">Bandeaux d\'annonce</button><button type="button" data-o="reglages">Réglages</button></div>'+
      '<div class="adm-zone"></div>'+
      '<div class="adm-btns adm-bas"><button type="button" class="adm-b pub" id="adm-pub">Publier</button><button type="button" class="adm-b sec" id="adm-fin">Se déconnecter</button></div><p class="adm-msg"></p>');
    b.querySelectorAll('.adm-onglets button').forEach(function(x){x.addEventListener('click',function(){onglet=x.getAttribute('data-o'); dessiner(b);});});
    b.querySelector('#adm-pub').addEventListener('click',function(){publier(b,this);});
    b.querySelector('#adm-fin').addEventListener('click',function(){
      if(modifie && !confirm('Des modifications ne sont pas publiées. Se déconnecter quand même ? Elles seront perdues.')) return;
      session=null;donnees=null;modifie=false;fermer();
    });
    if(modifie) marquer(b);
    dessiner(b);
  }
  function texteInitial(o){ return o.html ? window.USP_RENDU.nettoyer(o.html) : (o.texte ? window.USP_RENDU.texte(o.texte) : ''); }
  function normaliser(o){
    if(!o.html && o.texte){ o.html=texteInitial(o); } delete o.texte;
    o.boutons=o.boutons||[]; if(o.lien && !o.boutons.length) o.boutons=[{lib:'En savoir plus',href:o.lien}]; delete o.lien;
    o.style=o.style||{}; return o;
  }
  function vide(html){ return !String(html||'').replace(/<[^>]+>|&nbsp;|\s/g,''); }
  function listeElements(items,sel,titre,type){
    return '<ul class="adm-liste adm-choix">'+items.map(function(x){
      var nom = type==='ban' ? (vide(x.html)?'(bandeau vide)':String(x.html).replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim().slice(0,70)) : ((x.epingle?'📌 ':'')+(x.titre||'(sans titre)'));
      var info = type==='ban' ? (x.actif?'Affiché':'Masqué') : x.date;
      return '<li class="'+(x.id===sel?'sel':'')+'"><span><strong>'+esc(nom)+'</strong><small>'+esc(info)+'</small></span><span class="act"><button type="button" data-ouv="'+esc(x.id)+'">'+(x.id===sel?'En cours':'Modifier')+'</button><button type="button" data-sup="'+esc(x.id)+'">Supprimer</button></span></li>';
    }).join('')+'</ul>';
  }
  function dessiner(b){
    b.querySelectorAll('.adm-onglets button').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-o')===onglet);});
    var z=b.querySelector('.adm-zone'); b.querySelector('.adm-msg').textContent='';
    if(onglet==='reglages'){
      z.innerHTML='<p>Dépôt relié ' + esc(session.depot) + ', branche ' + esc(session.branche) + (session.dossier?', dossier '+esc(session.dossier):'') + '.</p>'+
        '<p>Pour remplacer la clé GitHub (par exemple quand elle expire) ou changer le mot de passe, relancez la mise en route.</p>'+
        '<div class="adm-btns"><button type="button" class="adm-b sec" id="adm-reconf">Remplacer la clé ou le mot de passe</button></div>';
      z.querySelector('#adm-reconf').addEventListener('click',ecranConfig);
      return;
    }
    var ban=onglet==='bandeau', items=ban?donnees.annonces:donnees.actualites;
    if(!ban) items.sort(function(a,c){return (c.epingle?1:0)-(a.epingle?1:0)||String(c.date).localeCompare(String(a.date));});
    var sel=ban?selBan:selActu, X=items.filter(function(x){return x.id===sel;})[0];
    if(!X && items.length){ X=items[0]; sel=X.id; if(ban) selBan=sel; else selActu=sel; }
    var html= ban ? '<p>Les bandeaux s\'affichent en haut de toutes les pages, les uns sous les autres. Ils servent par exemple pour une fermeture exceptionnelle ou un changement d\'horaires.</p>'
                  : '<p>Les actualités s\'affichent sur la page d\'accueil, les épinglées en premier, puis les plus récentes (6 au maximum).</p>';
    html+=(items.length?listeElements(items,sel,'',ban?'ban':'actu'):'<p><em>'+(ban?'Aucun bandeau pour l\'instant.':'Aucune actualité pour l\'instant.')+'</em></p>');
    html+='<div class="adm-btns" style="margin-top:.6rem"><button type="button" class="adm-b sec" id="adm-nouveau">+ '+(ban?'Nouveau bandeau':'Nouvelle actualité')+'</button></div>';
    if(X){
      normaliser(X); var st=X.style;
      if(ban){
        html+='<h3>Bandeau en cours de modification</h3>'+
          '<label class="coche"><input type="checkbox" id="adm-on"'+(X.actif?' checked':'')+'> Afficher ce bandeau sur le site</label>'+
          '<label>Message</label>'+editeur('adm-ed',texteInitial(X))+
          '<div class="adm-grille">'+choix('adm-th','theme',st.theme||'jaune','Couleur du bandeau')+'</div>'+
          blocAnimation('adm-a',st,'animB')+blocBoutons('adm-bt',X.boutons)+
          '<div class="adm-apercu"><strong>Aperçu</strong><div class="adm-ap"></div></div>';
      } else {
        html+='<h3>Actualité en cours de modification</h3>'+
          '<label for="adm-t">Titre</label><input type="text" id="adm-t" maxlength="120" value="'+esc(X.titre)+'">'+
          '<label for="adm-d">Date</label><input type="date" id="adm-d" value="'+esc(X.date)+'">'+
          '<label>Texte</label>'+editeur('adm-ed',texteInitial(X))+
          '<label class="coche"><input type="checkbox" id="adm-e"'+(X.epingle?' checked':'')+'> Épingler en haut</label>'+
          '<h3>Présentation</h3><div class="adm-grille">'+choix('adm-po','police',st.police||'site','Police')+choix('adm-ct','cTitre',st.cTitre||'navy','Couleur du titre')+choix('adm-tt','tTitre',st.tTitre||'normale','Taille du titre')+choix('adm-tx','tTexte',st.tTexte||'normale','Taille du texte')+choix('adm-fo','fond',st.fond||'blanc','Fond de la carte')+'</div>'+
          blocAnimation('adm-a',st,'anim')+blocBoutons('adm-bt',X.boutons)+
          '<div class="adm-apercu"><strong>Aperçu</strong><div class="adm-ap actus-liste" style="grid-template-columns:1fr"></div></div>';
      }
    }
    z.innerHTML=html;
    z.querySelector('#adm-nouveau').onclick=function(){
      var n = ban ? {id:'b'+Date.now().toString(36),actif:true,html:'',style:{},boutons:[]} : {id:'a'+Date.now().toString(36),titre:'',date:aujourdhui(),html:'',epingle:false,style:{},boutons:[]};
      items.unshift(n); if(ban) selBan=n.id; else selActu=n.id; marquer(b); dessiner(b);
      var f=z.querySelector(ban?'#adm-ed':'#adm-t'); if(f) f.focus();
    };
    z.querySelectorAll('[data-ouv]').forEach(function(x){x.onclick=function(){ if(ban) selBan=x.dataset.ouv; else selActu=x.dataset.ouv; dessiner(b); };});
    z.querySelectorAll('[data-sup]').forEach(function(x){x.onclick=function(){
      if(!confirm(ban?'Supprimer ce bandeau ?':'Supprimer cette actualité ?')) return;
      var id=x.dataset.sup, l=items.filter(function(y){return y.id!==id;});
      if(ban){donnees.annonces=l; if(selBan===id) selBan=null;} else {donnees.actualites=l; if(selActu===id) selActu=null;}
      marquer(b); dessiner(b); message(b,'Supprimé. Cliquez sur Publier pour mettre le site à jour.',true);
    };});
    if(!X) return;
    var minu=null;
    function lire(){
      X.html=z.querySelector('#adm-ed').innerHTML; lireAnimation(z,'adm-a',X.style);
      if(ban){ X.actif=z.querySelector('#adm-on').checked; X.style.theme=z.querySelector('#adm-th').value; }
      else { X.titre=z.querySelector('#adm-t').value.trim(); X.date=z.querySelector('#adm-d').value||aujourdhui(); X.epingle=z.querySelector('#adm-e').checked;
        X.style.police=z.querySelector('#adm-po').value; X.style.cTitre=z.querySelector('#adm-ct').value; X.style.tTitre=z.querySelector('#adm-tt').value; X.style.tTexte=z.querySelector('#adm-tx').value; X.style.fond=z.querySelector('#adm-fo').value; }
    }
    function apercu(){
      var ap=z.querySelector('.adm-ap');
      if(ban) ap.innerHTML = !vide(X.html) ? window.USP_RENDU.bandeau(X) : '<em>Écrivez un message pour voir l\'aperçu.</em>';
      else ap.innerHTML = X.titre ? window.USP_RENDU.actu(X) : '<em>Écrivez un titre pour voir l\'aperçu.</em>';
    }
    function maj(){ lire(); marquer(b); clearTimeout(minu); minu=setTimeout(function(){apercu(); majListe();},250); }
    function majListe(){ var li=z.querySelector('.adm-choix li.sel strong'); if(!li) return; li.textContent = ban ? (vide(X.html)?'(bandeau vide)':X.html.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim().slice(0,70)) : ((X.epingle?'📌 ':'')+(X.titre||'(sans titre)')); }
    z.querySelectorAll('#adm-t,#adm-d').forEach(function(x){x.addEventListener('input',maj);});
    z.querySelectorAll('.adm-sel[data-cle],#adm-e,#adm-on').forEach(function(x){x.addEventListener('change',maj);});
    brancherEditeur(z,b,'adm-ed',maj);
    brancherBoutons(z,b,'adm-bt',X.boutons,function(){lire(); marquer(b); dessiner(b);},maj);
    z.querySelector('.adm-rejouer').onclick=function(){rejouer(z);};
    apercu();
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
