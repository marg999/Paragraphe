// Page d'accueil : présentation si on n'est pas connecté, bibliothèque sinon.
import {
  demarrer, sb, esc, sourceCouverture, nombre, pluriel, dateFr, jours, icone, symbole, couverture, etoiles, pastille, composition,
  STATUTS, NOMS_GENRES, lusEn, recommanderAccueil, normaliser, couleurAuHasard, toast, aller, titreHtml, ecrireLecture,
  etatInstallation, installer, aideIphone,
} from './app.js?v=7';

const user = await demarrer({ actif: 'bibliotheque' });
const main = document.getElementById('contenu');

if (!user) {
  main.innerHTML = accueil();
} else {
  await bibliotheque();
}

// =============================================================================
function accueil() {
  return `<div class="accueil">
    <section class="conteneur hero">
      <div class="texte">
        <p class="etiquette accent">Carnet de lecture privé</p>
        <h1 class="affiche">Chaque livre lu mérite sa page.</h1>
        <p class="chapo">Note tes lectures sur quatre critères, garde tes impressions, suis ton objectif de l’année. Personne d’autre que toi ne voit ton carnet.</p>
        <div class="actions">
          <a class="btn btn-principal" href="inscription.html">Créer mon carnet</a>
          <a class="btn btn-secondaire" href="connexion.html">Me connecter</a>
        </div>
      </div>
      ${composition('compo-hero')}
    </section>
    <section class="conteneur points" aria-label="Ce que tu peux faire">
      <article>
        <p class="etiquette">Note</p>
        <h2 class="titre-2">Quatre critères, cinq étoiles</h2>
        <p class="petit">Note générale, rythme, émotion, personnages : de quoi te souvenir de ce qui t’a plu, ou pas.</p>
        <div class="exemple carte">
          <div><span class="etiquette">Rythme</span>${etoiles(3, 'Rythme')}</div>
          <div><span class="etiquette">Émotion</span>${etoiles(5, 'Émotion')}</div>
        </div>
      </article>
      <article>
        <p class="etiquette">Retrouve</p>
        <h2 class="titre-2">Toute ta bibliothèque</h2>
        <p class="petit">Cherche n’importe quel livre par titre ou auteur. Tes lectures sont classées : à lire, en cours, lues, abandonnées.</p>
      </article>
      <article>
        <p class="etiquette">Fais le bilan</p>
        <h2 class="titre-2">Ton année en lecture</h2>
        <p class="petit">Livres lus, pages tournées, durée moyenne, genre préféré, coups de cœur : ton année se résume d’un coup d’œil.</p>
      </article>
    </section>
  </div>`;
}

// =============================================================================
async function bibliotheque() {
  const annee = new Date().getFullYear();
  const etat = {
    livres: [],
    objectif: null,
    filtre: new URLSearchParams(location.search).get('statut') ?? 'tous',
    q: new URLSearchParams(location.search).get('q') ?? '',
    tri: new URLSearchParams(location.search).get('tri') ?? 'recent',
  };

  async function charger() {
    const [rl, ro] = await Promise.all([
      sb.from('lectures').select('*').order('updated_at', { ascending: false }),
      sb.from('objectifs').select('nombre').eq('annee', annee).maybeSingle(),
    ]);
    if (rl.error) {
      main.innerHTML = `<div class="conteneur page"><p class="alerte" role="alert">Impossible de charger ta bibliothèque.
        Vérifie ta connexion, ou que le schéma de la base a bien été installé (voir le guide, étape 2).</p></div>`;
      return false;
    }
    etat.livres = rl.data ?? [];
    etat.objectif = ro.data?.nombre ?? null;
    return true;
  }

  if (!(await charger())) return;

  main.innerHTML = `<div class="conteneur page biblio">
    <div class="entete-page">
      <div><h1 class="titre-1">Ma bibliothèque</h1><p class="petit" id="resume"></p></div>
      <a class="btn btn-principal" href="ajouter.html">${icone('plus')}Ajouter un livre</a>
    </div>
    <div id="invitation-appli"></div>
    <div class="duo">
      <section class="carte objectif" id="objectif" aria-labelledby="titre-objectif"></section>
      <section class="carte reco" id="reco" aria-label="Recommandation"><span class="etiquette">Recommandation</span><p class="petit">Recherche d’un livre pour toi…</p></section>
    </div>
    <div id="liste"></div>
  </div>`;

  rendreObjectif();
  rendreListe();
  chargerReco();
  invitationAppli();
  document.addEventListener('installation-possible', invitationAppli);

  // ---------------------------------------------------------------- Invitation à installer l'application
  function invitationAppli() {
    const zone = document.getElementById('invitation-appli');
    let masquee = false;
    try {
      masquee = localStorage.getItem('paragraphe-invitation-appli') === 'non';
    } catch {}
    const etat = etatInstallation();
    const telephone = matchMedia('(max-width: 767px), (pointer: coarse)').matches;
    if (masquee || !telephone || (etat !== 'android' && etat !== 'iphone')) {
      zone.innerHTML = '';
      return;
    }
    zone.innerHTML = `<section class="carte invitation" aria-labelledby="t-invitation">
      <div class="invitation-texte">
        <h2 class="etiquette" id="t-invitation">Paragraphe sur ton téléphone</h2>
        <p>Ajoute le carnet à ton écran d’accueil : il s’ouvrira en plein écran, comme une application.</p>
        ${etat === 'iphone' ? aideIphone() : ''}
      </div>
      <div class="invitation-actions">
        ${etat === 'android' ? `<button class="btn btn-principal btn-petit" type="button" data-installer>${icone('telephone')}Installer</button>` : ''}
        <button class="btn btn-lien btn-petit" type="button" data-plus-tard>Plus tard</button>
      </div>
    </section>`;
    zone.querySelector('[data-installer]')?.addEventListener('click', async () => {
      if (await installer()) toast('Paragraphe est installé.');
      invitationAppli();
    });
    zone.querySelector('[data-plus-tard]').addEventListener('click', () => {
      try {
        localStorage.setItem('paragraphe-invitation-appli', 'non');
      } catch {}
      zone.innerHTML = '';
      toast('Tu pourras installer l’application depuis Mon compte.');
    });
  }

  // ---------------------------------------------------------------- Objectif annuel
  function rendreObjectif() {
    const lus = lusEn(etat.livres, annee).length;
    const cible = etat.objectif ?? 20;
    const pct = Math.min(100, Math.round((lus / cible) * 100));
    const reste = cible - lus;
    const el = document.getElementById('objectif');
    el.innerHTML = `
      <div class="haut">
        <h2 class="etiquette" id="titre-objectif">Objectif ${annee}</h2>
        <details class="modifier">
          <summary class="btn-lien">Modifier</summary>
          <form class="form-objectif">
            <label for="objectif-nombre" class="sr">Nombre de livres visé en ${annee}</label>
            <input id="objectif-nombre" name="nombre" type="number" min="1" max="1000" value="${cible}" required>
            <button class="btn btn-principal btn-petit" type="submit">Enregistrer</button>
          </form>
        </details>
      </div>
      <p class="gros num">${nombre(lus)} <small>sur ${pluriel(cible, 'livre')}</small></p>
      <div class="jauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progression de l’objectif annuel"><i style="width:${pct}%"></i></div>
      <p class="petit">${reste > 0 ? `Encore ${pluriel(reste, 'livre')} d’ici le 31 décembre.` : `Objectif atteint. Bravo pour ces ${pluriel(lus, 'livre')}.`}</p>`;
    el.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const n = Number.parseInt(e.target.nombre.value, 10);
      if (!(n >= 1 && n <= 1000)) return;
      const { error } = await sb.from('objectifs').upsert({ user_id: user.id, annee, nombre: n });
      if (error) return toast('L’objectif n’a pas pu être enregistré. Réessaie dans un instant.');
      etat.objectif = n;
      rendreObjectif();
      toast('Objectif mis à jour.');
    });
  }

  // ---------------------------------------------------------------- Liste des livres
  function rendreListe() {
    const L = etat.livres;
    const nbLu = L.filter((l) => l.statut === 'lu').length;
    document.getElementById('resume').textContent = L.length
      ? `${pluriel(L.length, 'livre')} dans ta bibliothèque, dont ${nombre(nbLu)} ${nbLu > 1 ? 'lus' : 'lu'}.`
      : 'Ton carnet est prêt.';
    const liste = document.getElementById('liste');
    if (!L.length) {
      liste.innerHTML = `<div class="vide">${symbole('vide-symbole')}
        <h2 class="titre-2">Ta bibliothèque t’attend.</h2>
        <p class="petit">Ajoute ton premier livre pour commencer ton carnet.</p>
        <a class="btn btn-principal" href="ajouter.html">${icone('plus')}Ajouter un livre</a></div>`;
      return;
    }
    const compte = (s) => (s === 'tous' ? L.length : L.filter((l) => l.statut === s).length);
    const qn = normaliser(etat.q);
    const ref = (l) => l.fin || l.debut || l.created_at || '';
    const tris = {
      recent: (a, b) => ref(b).localeCompare(ref(a)),
      note: (a, b) => (b.note_generale ?? -1) - (a.note_generale ?? -1),
      titre: (a, b) => a.titre.localeCompare(b.titre, 'fr'),
      auteur: (a, b) => a.auteur.localeCompare(b.auteur, 'fr'),
    };
    const visibles = L.filter((l) => (etat.filtre === 'tous' || l.statut === etat.filtre) && (!qn || normaliser(`${l.titre} ${l.auteur}`).includes(qn))).sort(
      tris[etat.tri] ?? tris.recent,
    );

    const outilsExistants = document.getElementById('outils');
    if (!outilsExistants) {
      liste.innerHTML = `
        <div class="outils" id="outils">
          <div class="filtres" role="group" aria-label="Filtrer par statut" id="filtres"></div>
          <form class="recherche" role="search" id="recherche">
            <div class="avec-icone">${icone('recherche')}<label for="q" class="sr">Chercher dans ma bibliothèque</label>
              <input id="q" type="search" placeholder="Titre ou auteur" value="${esc(etat.q)}"></div>
            <label for="tri" class="sr">Trier</label>
            <select id="tri">
              ${[['recent', 'Plus récents'], ['note', 'Mieux notés'], ['titre', 'Titre A → Z'], ['auteur', 'Auteur A → Z']]
                .map(([v, t]) => `<option value="${v}"${etat.tri === v ? ' selected' : ''}>${t}</option>`)
                .join('')}
            </select>
          </form>
        </div>
        <div id="grille"></div>`;
      document.getElementById('filtres').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        etat.filtre = b.dataset.f;
        majAdresse();
        rendreListe();
      });
      document.getElementById('q').addEventListener('input', (e) => {
        etat.q = e.target.value;
        majAdresse();
        rendreListe();
      });
      document.getElementById('tri').addEventListener('change', (e) => {
        etat.tri = e.target.value;
        majAdresse();
        rendreListe();
      });
      document.getElementById('recherche').addEventListener('submit', (e) => e.preventDefault());
    }
    document.getElementById('filtres').innerHTML = [['tous', 'Tous'], ...Object.entries(STATUTS)]
      .map(([k, v]) => `<button type="button" data-f="${k}" aria-pressed="${etat.filtre === k}">${v}<span class="n">${compte(k)}</span></button>`)
      .join('');
    const grille = document.getElementById('grille');
    if (!visibles.length) {
      grille.className = '';
      grille.innerHTML = `<div class="vide"><h2 class="titre-2">Aucun livre ici.</h2><p class="petit">Change de filtre ou de recherche pour retrouver tes lectures.</p></div>`;
      return;
    }
    grille.className = 'grille';
    grille.innerHTML = visibles.map(carteLivre).join('');
  }

  function majAdresse() {
    const p = new URLSearchParams();
    if (etat.filtre !== 'tous') p.set('statut', etat.filtre);
    if (etat.q) p.set('q', etat.q);
    if (etat.tri !== 'recent') p.set('tri', etat.tri);
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
  }

  // ---------------------------------------------------------------- Recommandation
  async function chargerReco() {
    const box = document.getElementById('reco');
    let livre = null;
    let raison = '';
    try {
      const { data: ecartees } = await sb.from('recos_ecartees').select('ol_key');
      const proposition = await recommanderAccueil(etat.livres, (ecartees ?? []).map((e) => e.ol_key));
      if (proposition) ({ livre, raison } = proposition);
    } catch {
      box.innerHTML = `<span class="etiquette">Recommandation</span><p class="petit">Les suggestions sont indisponibles pour le moment. Réessaie un peu plus tard.</p>`;
      return;
    }
    if (!livre) {
      const message = etat.livres.some((l) => l.statut === 'lu')
        ? 'Aucune nouvelle suggestion pour l’instant. Reviens un peu plus tard.'
        : 'Note quelques livres terminés pour recevoir des suggestions à ton goût.';
      box.innerHTML = `<span class="etiquette">Recommandation</span><p class="petit">${message}</p>`;
      return;
    }
    box.innerHTML = `<div class="contenu">
      ${couverture(sourceCouverture(livre), 'nuit', livre.titre)}
      <div class="texte">
        <p class="etiquette">${esc(raison)}</p>
        <p class="titre-livre">${titreHtml(livre)}</p>
        <p class="petit">${esc(livre.auteur)}${livre.annee ? ` · ${livre.annee}` : ''}${livre.pages ? ` · ${nombre(livre.pages)} pages` : ''}</p>
        <div class="actions">
          <button class="btn btn-principal" type="button" data-reco="ajouter">Ajouter à « À lire »</button>
          <button class="btn btn-lien" type="button" data-reco="ecarter">Pas pour moi</button>
        </div>
      </div></div>`;
    box.querySelector('[data-reco="ajouter"]').addEventListener('click', async (e) => {
      e.target.disabled = true;
      const { error } = await ecrireLecture((v) => sb.from('lectures').insert(v), {
        langue: livre.langue ?? null,
        ol_key: livre.olKey,
        titre: livre.titre,
        auteur: livre.auteur,
        annee: livre.annee,
        pages: livre.pages,
        couverture_id: livre.couvertureId,
        genre: NOMS_GENRES.includes(livre.genre) ? livre.genre : null,
        couleur: couleurAuHasard(),
        statut: 'a-lire',
      });
      if (error) {
        e.target.disabled = false;
        return toast('Le livre n’a pas pu être ajouté. Réessaie dans un instant.');
      }
      aller('index.html', `${livre.titre} ajouté à « À lire ».`);
    });
    box.querySelector('[data-reco="ecarter"]').addEventListener('click', async () => {
      await sb.from('recos_ecartees').upsert({ user_id: user.id, ol_key: livre.olKey });
      box.innerHTML = `<span class="etiquette">Recommandation</span><p class="petit">Recherche d’un autre livre…</p>`;
      chargerReco();
    });
  }
}

function carteLivre(l) {
  const d = jours(l.debut, l.fin);
  const sous =
    l.statut === 'lu' && d ? `Lu en ${pluriel(d, 'jour')}`
    : l.statut === 'en-cours' && l.debut ? `Commencé le ${dateFr(l.debut)}`
    : l.statut === 'abandonne' && l.fin ? `Arrêté le ${dateFr(l.fin)}`
    : '';
  return `<a class="livre" href="lecture.html?id=${encodeURIComponent(l.id)}">
    ${couverture(sourceCouverture(l), l.couleur, l.titre)}
    <div class="livre-meta">
      ${pastille(l.statut)}
      <span class="livre-titre">${titreHtml(l)}</span>
      <span class="petit">${esc(l.auteur)}${l.annee ? ` · ${l.annee}` : ''}</span>
      ${l.note_generale ? etoiles(l.note_generale, 'Note générale') : ''}
      ${sous ? `<span class="petit">${sous}</span>` : ''}
    </div>
  </a>`;
}
