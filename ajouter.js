// Ajouter une lecture (ajouter.html) ou la modifier (ajouter.html?id=…, avec &terminer=1 pour « Terminer et noter »).
import {
  demarrer, sb, esc, nombre, jours, icone, couverture, surligner, aujourdhui, parametre, aller, toast,
  STATUTS, CRITERES, NOMS_GENRES, lireFormulaire, rechercherLivres,
} from './app.js';

await demarrer({ prive: true, actif: 'ajouter' });
const main = document.getElementById('contenu');
const id = parametre('id');
const terminer = parametre('terminer') !== null;
let lecture = null;

if (id) {
  const { data } = await sb.from('lectures').select('*').eq('id', id).maybeSingle();
  if (!data) {
    main.innerHTML = `<div class="conteneur page"><h1 class="titre-1">Ce livre est introuvable.</h1><a class="btn btn-principal" href="index.html">Retour à ma bibliothèque</a></div>`;
  } else lecture = data;
}

if (!id || lecture) {
  let valeurs = lecture ? { ...lecture } : { statut: 'lu' };
  if (terminer) valeurs = { ...valeurs, statut: 'lu', fin: valeurs.fin ?? aujourdhui() };
  document.title = `${lecture ? (terminer ? 'Terminer et noter' : 'Modifier une lecture') : 'Ajouter une lecture'} · Paragraphe`;
  main.innerHTML = `<div class="conteneur page">
    <div class="entete-page"><div>
      ${lecture ? `<a class="retour" href="lecture.html?id=${encodeURIComponent(lecture.id)}">${icone('retour')}${esc(lecture.titre)}</a>` : ''}
      <h1 class="titre-1">${lecture ? (terminer ? 'Terminer et noter' : 'Modifier une lecture') : 'Ajouter une lecture'}</h1>
      ${lecture ? '' : '<p class="petit">Cherche le livre, note-le sur quatre critères et garde une trace de ce qu’il t’a laissé.</p>'}
    </div></div>
    <div id="zone-form"></div>
  </div>`;
  afficherFormulaire(valeurs, {});
}

// =============================================================================
function afficherFormulaire(v, erreurs) {
  const statut = v.statut ?? 'lu';
  const etat = v.titre ? (v.ol_key ? 'choisi' : 'manuel') : 'recherche';
  const duree = jours(v.debut, v.fin);
  const annuler = lecture ? `lecture.html?id=${encodeURIComponent(lecture.id)}` : 'index.html';
  const etoile = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z"/></svg>';
  const zone = document.getElementById('zone-form');
  zone.innerHTML = `<form class="form-lecture" novalidate>
    <div class="col">
      <div class="champ bloc-recherche"${etat !== 'recherche' ? ' hidden' : ''}>
        <label for="recherche">Titre ou auteur</label>
        <div class="recherche">
          <div class="avec-icone">${icone('recherche')}
            <input id="recherche" type="search" autocomplete="off" placeholder="Ex. Les Misérables, Dumas…" role="combobox"
              aria-expanded="false" aria-controls="suggestions" aria-autocomplete="list" aria-describedby="etat-recherche">
          </div>
          <div class="suggestions" id="suggestions" role="listbox" aria-label="Livres trouvés" hidden></div>
        </div>
        <p class="aide" id="etat-recherche" aria-live="polite"></p>
      </div>
      <button type="button" class="btn btn-lien btn-manuel" data-vers="manuel"${etat !== 'recherche' ? ' hidden' : ''}>Livre introuvable ? Ajouter manuellement</button>

      <div class="carte choisi"${etat !== 'choisi' ? ' hidden' : ''}>
        <div class="choisi-couv" data-choisi-couv>${couverture(v.couverture_id, v.couleur ?? 'caput', v.titre, 'S')}</div>
        <div class="choisi-texte">
          <p class="titre-livre" data-choisi-titre>${esc(v.titre)}</p>
          <p class="petit" data-choisi-meta>${esc([v.auteur, v.annee, v.pages ? `${nombre(v.pages)} pages` : null].filter(Boolean).join(' · '))}</p>
          <div class="choisi-actions">
            <button type="button" class="btn btn-lien" data-vers="manuel">Modifier les informations</button>
            <button type="button" class="btn btn-lien" data-vers="recherche" data-vider>Changer de livre</button>
          </div>
        </div>
      </div>

      <div class="manuel"${etat !== 'manuel' ? ' hidden' : ''}>
        <div class="champ large"><label for="titre">Titre</label><input id="titre" name="titre" type="text" maxlength="300" value="${esc(v.titre)}"${erreurs.livre ? ' aria-invalid="true"' : ''}></div>
        <div class="champ large"><label for="auteur">Auteur</label><input id="auteur" name="auteur" type="text" maxlength="300" value="${esc(v.auteur)}"${erreurs.livre ? ' aria-invalid="true"' : ''}></div>
        <div class="champ"><label for="annee">Année de parution</label><input id="annee" name="annee" type="number" inputmode="numeric" min="-3000" max="2100" value="${esc(v.annee)}"></div>
        <div class="champ"><label for="pages">Nombre de pages</label><input id="pages" name="pages" type="number" inputmode="numeric" min="1" max="100000" value="${esc(v.pages)}"></div>
        <button type="button" class="btn btn-lien large retour-recherche" data-vers="recherche" data-vider>Revenir à la recherche</button>
      </div>
      <input type="hidden" name="ol_key" value="${esc(v.ol_key)}">
      <input type="hidden" name="couverture_id" value="${esc(v.couverture_id)}">
      <input type="hidden" name="couleur" value="${esc(v.couleur)}">
      ${erreurs.livre ? `<p class="erreur" role="alert">${esc(erreurs.livre)}</p>` : ''}

      <div class="champ">
        <label for="genre">Genre</label>
        <select id="genre" name="genre"><option value="">Choisir un genre</option>
          ${NOMS_GENRES.map((g) => `<option value="${g}"${v.genre === g ? ' selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>

      <fieldset class="champ"><legend>Statut</legend>
        <div class="segments">
          ${Object.entries(STATUTS)
            .map(([k, lib]) => `<span><input class="sr" type="radio" name="statut" id="statut-${k}" value="${k}"${statut === k ? ' checked' : ''}><label for="statut-${k}">${lib}</label></span>`)
            .join('')}
        </div>
      </fieldset>

      <div class="champ">
        <label for="commentaire">Ton commentaire</label>
        <textarea id="commentaire" name="commentaire" maxlength="20000" placeholder="Ce que tu as retenu, une phrase qui t’a marqué, ce que tu en dirais à un ami.">${esc(v.commentaire)}</textarea>
      </div>
    </div>

    <div class="col">
      <div class="champ" data-si-statut="lu en-cours abandonne">
        <span class="etiquette">Notation · 4 critères sur 5 étoiles</span>
        <div class="carte notation">
          ${CRITERES.map(
            (c, i) => `<fieldset class="critere${i === 0 ? ' principal' : ''}">
              <legend><span class="etiquette">${c.libelle}</span>${c.aide ? `<span class="petit">${c.aide}</span>` : ''}</legend>
              <div class="choix">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (n) => `<input class="sr" type="radio" name="${c.cle}" id="${c.cle}-${n}" value="${n}"${v[c.cle] === n ? ' checked' : ''}>
                    <label for="${c.cle}-${n}" title="${n} sur 5">${etoile}<span class="sr">${n} ${n > 1 ? 'étoiles' : 'étoile'}</span></label>`,
                  )
                  .join('')}
              </div>
            </fieldset>`,
          ).join('')}
        </div>
        ${erreurs.notes ? `<p class="erreur" role="alert">${esc(erreurs.notes)}</p>` : ''}
      </div>

      <fieldset class="champ" data-si-statut="lu en-cours abandonne">
        <legend>Dates et durée calculée</legend>
        <div class="dates">
          <div class="champ"><label for="debut">Début de lecture</label><input id="debut" name="debut" type="date" value="${esc(v.debut)}"></div>
          <div class="champ" data-si-statut="lu abandonne"><label for="fin" data-libelle-fin>Fin de lecture</label><input id="fin" name="fin" type="date" value="${esc(v.fin)}"${erreurs.dates ? ' aria-invalid="true"' : ''}></div>
          <div class="duree num" aria-live="polite" data-duree><b>${duree ? nombre(duree) : '–'}</b><span class="petit">${duree === 1 ? 'jour' : 'jours'} de lecture</span></div>
        </div>
        <p class="erreur" role="alert" data-erreur-dates${erreurs.dates ? '' : ' hidden'}>${esc(erreurs.dates)}</p>
      </fieldset>

      ${erreurs.general ? `<p class="alerte" role="alert">${esc(erreurs.general)}</p>` : ''}
      <div class="actions">
        <button class="btn btn-principal" type="submit">${lecture ? 'Enregistrer les modifications' : 'Enregistrer ma lecture'}</button>
        <a class="btn btn-secondaire" href="${annuler}">Annuler</a>
      </div>
    </div>
  </form>`;
  brancher(zone.querySelector('form'));
  zone.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// =============================================================================
function brancher(form) {
  const $ = (s) => form.querySelector(s);
  const champ = (nom) => form.elements.namedItem(nom);
  const recherche = $('#recherche');
  const liste = $('#suggestions');
  const etatRecherche = $('#etat-recherche');
  let resultats = [];
  let actif = -1;
  let minuteur;
  let controleur;

  function afficher(etat) {
    $('.bloc-recherche').hidden = etat !== 'recherche';
    $('.btn-manuel').hidden = etat !== 'recherche';
    $('.choisi').hidden = etat !== 'choisi';
    $('.manuel').hidden = etat !== 'manuel';
  }
  function vider() {
    for (const n of ['titre', 'auteur', 'annee', 'pages', 'ol_key', 'couverture_id']) champ(n).value = '';
  }
  form.querySelectorAll('[data-vers]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.hasAttribute('data-vider')) vider();
      const vers = b.dataset.vers;
      if (vers === 'manuel' && !champ('titre').value) champ('titre').value = recherche.value.trim();
      afficher(vers);
      (vers === 'manuel' ? champ('titre') : recherche).focus();
    }),
  );

  // ---- Recherche Open Library ----
  function fermer() {
    liste.hidden = true;
    recherche.setAttribute('aria-expanded', 'false');
    recherche.removeAttribute('aria-activedescendant');
    actif = -1;
  }
  function rendre(q) {
    liste.innerHTML = resultats.length
      ? resultats
          .map(
            (r, i) => `<button type="button" class="sug" role="option" id="sug-${i}" data-i="${i}" aria-selected="false">
              ${couverture(r.couvertureId, ['caput', 'slate', 'coffee', 'nuit', 'tan'][i % 5], '', 'S')}
              <span><b>${surligner(r.titre, q)}</b><span class="petit">${surligner(r.auteur, q)}${r.annee ? ` · ${r.annee}` : ''}</span></span>
            </button>`,
          )
          .join('')
      : `<p class="aucun">Aucun livre trouvé pour « ${esc(q)} ». Vérifie l’orthographe, ou ajoute-le manuellement.</p>`;
    liste.hidden = false;
    recherche.setAttribute('aria-expanded', 'true');
  }
  async function chercher() {
    const q = recherche.value.trim();
    if (q.length < 2) {
      fermer();
      etatRecherche.textContent = '';
      return;
    }
    controleur?.abort();
    controleur = new AbortController();
    const minuterie = setTimeout(() => controleur.abort(), 9000);
    etatRecherche.textContent = 'Recherche…';
    try {
      resultats = await rechercherLivres(q, controleur.signal);
      etatRecherche.textContent = resultats.length ? `${resultats.length} livres trouvés.` : '';
      rendre(q);
    } catch (e) {
      if (e.name === 'AbortError' && recherche.value.trim() !== q) return;
      fermer();
      etatRecherche.textContent = 'La recherche est indisponible pour le moment. Ajoute le livre manuellement.';
    } finally {
      clearTimeout(minuterie);
    }
  }
  recherche.addEventListener('input', () => {
    clearTimeout(minuteur);
    minuteur = setTimeout(chercher, 300);
  });
  recherche.addEventListener('keydown', (e) => {
    const items = [...liste.querySelectorAll('.sug')];
    if (e.key === 'Escape') return fermer();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (actif >= 0) choisir(actif);
      return;
    }
    if (liste.hidden || !items.length || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    actif = (actif + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items.forEach((it, i) => it.setAttribute('aria-selected', String(i === actif)));
    recherche.setAttribute('aria-activedescendant', `sug-${actif}`);
    items[actif].scrollIntoView({ block: 'nearest' });
  });
  liste.addEventListener('click', (e) => {
    const b = e.target.closest('.sug');
    if (b) choisir(Number(b.dataset.i));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.recherche')) fermer();
  });
  function choisir(i) {
    const r = resultats[i];
    if (!r) return;
    champ('titre').value = r.titre;
    champ('auteur').value = r.auteur;
    champ('annee').value = r.annee ?? '';
    champ('pages').value = r.pages ?? '';
    champ('ol_key').value = r.olKey;
    champ('couverture_id').value = r.couvertureId ?? '';
    if (r.genre && !champ('genre').value) champ('genre').value = r.genre;
    $('[data-choisi-titre]').textContent = r.titre;
    $('[data-choisi-meta]').textContent = [r.auteur, r.annee, r.pages ? `${nombre(r.pages)} pages` : null].filter(Boolean).join(' · ');
    $('[data-choisi-couv]').innerHTML = couverture(r.couvertureId, champ('couleur').value || 'caput', r.titre, 'M');
    fermer();
    afficher('choisi');
    etatRecherche.textContent = '';
    $('.choisi [data-vers="manuel"]').focus();
  }

  // ---- Champs selon le statut ----
  function majStatut() {
    const statut = form.querySelector('input[name="statut"]:checked')?.value ?? 'lu';
    form.querySelectorAll('[data-si-statut]').forEach((el) => (el.hidden = !el.dataset.siStatut.split(' ').includes(statut)));
    $('[data-libelle-fin]').textContent = statut === 'abandonne' ? 'Arrêt de la lecture' : 'Fin de lecture';
    majDuree();
  }
  form.querySelectorAll('input[name="statut"]').forEach((r) => r.addEventListener('change', majStatut));

  // ---- Durée calculée ----
  const MESSAGE_ORDRE = 'La date de fin doit être après la date de début.';
  function majDuree() {
    const debut = champ('debut').value;
    const finVisible = !$('[data-libelle-fin]').closest('[data-si-statut]').hidden;
    const fin = finVisible ? champ('fin').value : '';
    const d = debut && fin ? Math.round((Date.parse(fin) - Date.parse(debut)) / 864e5) + 1 : null;
    const invalide = d !== null && d < 1;
    $('[data-duree]').innerHTML = `<b>${d && d > 0 ? nombre(d) : '–'}</b><span class="petit">${d === 1 ? 'jour' : 'jours'} de lecture</span>`;
    const err = $('[data-erreur-dates]');
    if (invalide) {
      err.textContent = MESSAGE_ORDRE;
      err.hidden = false;
    } else if (err.textContent === MESSAGE_ORDRE) err.hidden = true;
    champ('fin').setAttribute('aria-invalid', String(invalide));
  }
  champ('debut').addEventListener('input', majDuree);
  champ('fin').addEventListener('input', majDuree);
  majStatut();

  // ---- Envoi ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { valeurs, erreurs } = lireFormulaire(new FormData(form));
    if (Object.keys(erreurs).length) return afficherFormulaire(valeurs, erreurs);
    const bouton = form.querySelector('button[type="submit"]');
    bouton.disabled = true;
    if (lecture) {
      const { error } = await sb.from('lectures').update({ ...valeurs, couleur: lecture.couleur }).eq('id', lecture.id);
      if (!error) return aller(`lecture.html?id=${encodeURIComponent(lecture.id)}`, 'Modifications enregistrées.');
    } else {
      const { error } = await sb.from('lectures').insert(valeurs);
      if (!error) return aller('index.html', 'Lecture enregistrée.');
    }
    bouton.disabled = false;
    toast('La lecture n’a pas pu être enregistrée. Réessaie dans un instant.');
  });
}
