// Ajouter une lecture (ajouter.html) ou la modifier (ajouter.html?id=…, avec &terminer=1 pour « Terminer et noter »).
import {
  demarrer, sb, esc, sourceCouverture, nombre, jours, icone, couverture, surligner, aujourdhui, parametre, aller, toast,
  STATUTS, CRITERES, NOMS_GENRES, FORMATS, lireFormulaire, rechercherLivres, titreHtml, ecrireLecture, empreinte, isbnValide,
} from './app.js?v=9';

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
  const etoileObligatoire = '<span class="obligatoire" aria-hidden="true">*</span>';
  const decrit = (...ids) => {
    const liste = ids.filter(Boolean);
    return liste.length ? ` aria-describedby="${liste.join(' ')}"` : '';
  };
  zone.innerHTML = `<form class="form-lecture" novalidate>
    <p class="aide legende-obligatoire">Les champs marqués d’un astérisque (${etoileObligatoire}) sont obligatoires. La note générale et la date de fin ne le sont que pour un livre lu.</p>
    <div class="col">
      <div class="champ bloc-recherche"${etat !== 'recherche' ? ' hidden' : ''}>
        <label for="recherche">Titre ou auteur ${etoileObligatoire}</label>
        <div class="recherche">
          <div class="avec-icone">${icone('recherche')}
            <input id="recherche" type="search" autocomplete="off" placeholder="Ex. Les Misérables, Dumas…" role="combobox"
              aria-expanded="false" aria-controls="liste-sug" aria-autocomplete="list" aria-required="true"${erreurs.livre ? ' aria-invalid="true"' : ''}${decrit('etat-recherche', erreurs.livre && 'err-livre')}>
          </div>
          <div class="suggestions" id="suggestions" hidden>
            <div role="listbox" id="liste-sug" aria-label="Livres trouvés"></div>
            <button type="button" class="plus-resultats" hidden>Voir plus de résultats</button>
          </div>
        </div>
        <p class="aide" id="etat-recherche" aria-live="polite"></p>
        <button type="button" class="btn btn-secondaire btn-scan" data-scanner hidden>${icone('codebarres')}Scanner le code-barres</button>
        <p class="aide">Tu ne trouves pas ton livre ? <a href="guide.html#trouver">Nos conseils</a></p>
      </div>
      <button type="button" class="btn btn-lien btn-manuel" data-vers="manuel"${etat !== 'recherche' ? ' hidden' : ''}>Livre introuvable ? Ajouter manuellement</button>

      <div class="carte choisi"${etat !== 'choisi' ? ' hidden' : ''}>
        <div class="choisi-couv" data-choisi-couv>${couverture(sourceCouverture(v), v.couleur ?? 'caput', v.titre, 'S')}</div>
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
        <div class="champ large"><label for="titre">Titre ${etoileObligatoire}</label><input id="titre" name="titre" type="text" maxlength="300" required aria-required="true" value="${esc(v.titre)}"${erreurs.livre ? ' aria-invalid="true"' : ''}${decrit(erreurs.livre && 'err-livre')}></div>
        <div class="champ large"><label for="auteur">Auteur ${etoileObligatoire}</label><input id="auteur" name="auteur" type="text" maxlength="300" required aria-required="true" value="${esc(v.auteur)}"${erreurs.livre ? ' aria-invalid="true"' : ''}${decrit(erreurs.livre && 'err-livre')}></div>
        <div class="champ"><label for="annee">Année de parution</label><input id="annee" name="annee" type="number" inputmode="numeric" min="-3000" max="2100" value="${esc(v.annee)}"></div>
        <div class="champ"><label for="pages">Nombre de pages</label><input id="pages" name="pages" type="number" inputmode="numeric" min="1" max="100000" value="${esc(v.pages)}"></div>
        <button type="button" class="btn btn-lien large retour-recherche" data-vers="recherche" data-vider>Revenir à la recherche</button>
      </div>
      <input type="hidden" name="ol_key" value="${esc(v.ol_key)}">
      <input type="hidden" name="couverture_id" value="${esc(v.couverture_id)}">
      <input type="hidden" name="couleur" value="${esc(v.couleur)}">
      <input type="hidden" name="langue" value="${esc(v.langue)}">
      ${erreurs.livre ? `<p class="erreur" role="alert" id="err-livre">${esc(erreurs.livre)}</p>` : ''}

      <div class="champ">
        <label for="genre">Genre</label>
        <select id="genre" name="genre" aria-describedby="aide-genre"><option value="">Choisir un genre</option>
          ${NOMS_GENRES.map((g) => `<option value="${g}"${v.genre === g ? ' selected' : ''}>${g}</option>`).join('')}
        </select>
        <p class="aide" id="aide-genre" hidden>Genre proposé automatiquement d’après la fiche du livre : vérifie-le.</p>
      </div>
      <fieldset class="champ"><legend>Statut</legend>
        <div class="segments">
          ${Object.entries(STATUTS)
            .map(([k, lib]) => `<span><input class="sr" type="radio" name="statut" id="statut-${k}" value="${k}"${statut === k ? ' checked' : ''}><label for="statut-${k}">${lib}</label></span>`)
            .join('')}
        </div>
      </fieldset>

      <fieldset class="champ"><legend>Format <span class="facultatif">(facultatif)</span></legend>
        <div class="segments">
          ${Object.entries(FORMATS)
            .map(([k, lib]) => `<span><input class="sr" type="radio" name="format" id="format-${k}" value="${k}"${v.format === k ? ' checked' : ''}><label for="format-${k}">${lib}</label></span>`)
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
            (c, i) => `<fieldset class="critere${i === 0 ? ' principal' : ''}"${i === 0 && erreurs.notes ? ' aria-describedby="err-notes"' : ''}>
              <legend><span class="etiquette">${c.libelle}${i === 0 ? ` <span data-etoile-lu>${etoileObligatoire}</span>` : ''}</span>${c.aide ? `<span class="petit">${c.aide}</span>` : ''}</legend>
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
        ${erreurs.notes ? `<p class="erreur" role="alert" id="err-notes">${esc(erreurs.notes)}</p>` : ''}
      </div>

      <fieldset class="champ" data-si-statut="lu en-cours abandonne">
        <legend>Dates et durée calculée</legend>
        <div class="dates">
          <div class="champ"><label for="debut">Début de lecture</label><input id="debut" name="debut" type="date" value="${esc(v.debut)}"></div>
          <div class="champ" data-si-statut="lu abandonne"><label for="fin"><span data-libelle-fin>Fin de lecture</span> <span data-etoile-lu>${etoileObligatoire}</span></label><input id="fin" name="fin" type="date" value="${esc(v.fin)}"${erreurs.dates ? ' aria-invalid="true" aria-describedby="err-dates"' : ''}></div>
          <div class="duree num" aria-live="polite" data-duree><b>${duree ? nombre(duree) : '–'}</b><span class="petit">${duree === 1 ? 'jour' : 'jours'} de lecture</span></div>
        </div>
        <p class="erreur" role="alert" id="err-dates" data-erreur-dates${erreurs.dates ? '' : ' hidden'}>${esc(erreurs.dates)}</p>
      </fieldset>

      ${erreurs.general ? `<p class="alerte" role="alert">${esc(erreurs.general)}</p>` : ''}
      <div class="actions">
        <button class="btn btn-principal" type="submit">${lecture ? 'Enregistrer les modifications' : 'Enregistrer ma lecture'}</button>
        <a class="btn btn-secondaire" href="${annuler}">Annuler</a>
      </div>
    </div>
  </form>`;
  zone.insertAdjacentHTML('beforeend', `<dialog class="fenetre-scan" aria-labelledby="titre-scan">
    <div class="scan-contenu">
      <h2 class="titre-2" id="titre-scan">Scanner le code-barres</h2>
      <p class="petit">Place le code-barres au dos du livre dans le cadre. Le livre est recherché dès qu’il est lu.</p>
      <div class="scan-video"><video playsinline muted autoplay aria-hidden="true"></video><span class="scan-cadre" aria-hidden="true"></span></div>
      <p class="scan-etat" role="status" aria-live="polite">Ouverture de la caméra…</p>
      <div class="actions">
        <button type="button" class="btn btn-secondaire" data-fermer-scan>Annuler</button>
      </div>
      <p class="aide">Tu peux aussi taper les 13 chiffres de l’ISBN dans la recherche.</p>
    </div>
  </dialog>`);
  brancher(zone.querySelector('form'));
  if (erreurs.livre) (zone.querySelector('.manuel:not([hidden]) #titre') ?? zone.querySelector('#recherche'))?.focus();
  else if (erreurs.notes) zone.querySelector('#note_generale-1')?.focus();
  else if (erreurs.dates) zone.querySelector('#fin')?.focus();
  else zone.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// =============================================================================
function brancher(form) {
  const $ = (s) => form.querySelector(s);
  const champ = (nom) => form.elements.namedItem(nom);
  const recherche = $('#recherche');
  const boite = $('#suggestions');
  const liste = $('#liste-sug');
  const boutonPlus = $('.plus-resultats');
  let page = 0;
  let qCourante = '';
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
    for (const n of ['titre', 'auteur', 'annee', 'pages', 'ol_key', 'couverture_id', 'langue']) champ(n).value = '';
    $('#aide-genre').hidden = true;
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

  // ---- Recherche de livres (Open Library + Google Books + BnF) ----
  function fermer() {
    boite.hidden = true;
    recherche.setAttribute('aria-expanded', 'false');
    recherche.removeAttribute('aria-activedescendant');
    actif = -1;
  }
  function rendre(q) {
    liste.innerHTML = resultats.length
      ? resultats
          .map(
            (r, i) => `<button type="button" class="sug" role="option" id="sug-${i}" data-i="${i}" aria-selected="false">
              ${couverture(sourceCouverture(r), ['caput', 'slate', 'coffee', 'nuit', 'tan'][i % 5], '', 'S')}
              <span><b${r.langue && r.langue !== 'fr' ? ` lang="${r.langue}"` : ''}>${surligner(r.titre, q)}</b><span class="petit">${surligner(r.auteur, q)}${r.annee ? ` · ${r.annee}` : ''}<span class="source"> · ${r.source}</span></span></span>
            </button>`,
          )
          .join('')
      : `<p class="aucun">Aucun livre trouvé pour « ${esc(q)} ». Vérifie l’orthographe, ou ajoute-le manuellement.</p>`;
    boite.hidden = false;
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
      const r = await rechercherLivres(q, controleur.signal, 0);
      page = 0;
      qCourante = q;
      resultats = r.livres;
      boutonPlus.hidden = !r.encore || !resultats.length;
      if (r.isbn && resultats.length === 1) {
        // ISBN scanné ou tapé : un seul livre correspond, on le choisit directement.
        rendre(q);
        choisir(0);
        etatRecherche.textContent = `Livre trouvé : ${resultats[0].titre}.`;
        return;
      }
      etatRecherche.textContent = resultats.length
        ? `${resultats.length} livres trouvés.`
        : r.isbn ? 'Aucun livre trouvé pour cet ISBN. Ajoute-le manuellement.' : '';
      rendre(q);
    } catch (e) {
      if (e.name === 'AbortError' && recherche.value.trim() !== q) return;
      fermer();
      etatRecherche.textContent = 'La recherche est indisponible pour le moment. Ajoute le livre manuellement.';
    } finally {
      clearTimeout(minuterie);
    }
  }
  // ---- Scan du code-barres ----
  const fenetre = document.querySelector('.fenetre-scan');
  const video = fenetre.querySelector('video');
  const etatScan = fenetre.querySelector('.scan-etat');
  const boutonScan = $('[data-scanner]');
  let flux = null;
  let lecteur = null;
  let enCours = false;
  boutonScan.hidden = !navigator.mediaDevices?.getUserMedia;

  const chargerZxing = () =>
    window.ZXing
      ? Promise.resolve()
      : new Promise((ok, ko) => {
          const script = document.createElement('script');
          script.src = 'zxing.js?v=9';
          script.onload = ok;
          script.onerror = () => ko(new Error('Lecteur de code-barres indisponible'));
          document.head.append(script);
        });

  function arreterScan() {
    enCours = false;
    try {
      lecteur?.reset();
    } catch {}
    lecteur = null;
    flux?.getTracks().forEach((t) => t.stop());
    flux = null;
    video.srcObject = null;
  }
  function codeLu(code) {
    if (!enCours) return;
    const isbn = isbnValide(code);
    if (!isbn) {
      etatScan.textContent = 'Ce code-barres n’est pas celui d’un livre. Cherche le code qui commence par 978 ou 979.';
      return;
    }
    arreterScan();
    fenetre.close();
    navigator.vibrate?.(60);
    recherche.value = isbn;
    chercher();
    recherche.focus();
  }
  async function scanner() {
    etatScan.textContent = 'Ouverture de la caméra…';
    fenetre.showModal();
    enCours = true;
    const contraintes = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false };
    try {
      const natif = 'BarcodeDetector' in window && (await window.BarcodeDetector.getSupportedFormats?.())?.includes('ean_13');
      if (natif) {
        flux = await navigator.mediaDevices.getUserMedia(contraintes);
        video.srcObject = flux;
        await video.play();
        etatScan.textContent = 'Recherche du code-barres…';
        const detecteur = new window.BarcodeDetector({ formats: ['ean_13'] });
        const boucle = async () => {
          if (!enCours) return;
          try {
            const [code] = await detecteur.detect(video);
            if (code) codeLu(code.rawValue);
          } catch {}
          if (enCours) setTimeout(boucle, 200);
        };
        boucle();
      } else {
        await chargerZxing();
        if (!enCours) return;
        const indices = new Map([[window.ZXing.DecodeHintType.POSSIBLE_FORMATS, [window.ZXing.BarcodeFormat.EAN_13]]]);
        lecteur = new window.ZXing.BrowserMultiFormatReader(indices, 200);
        etatScan.textContent = 'Recherche du code-barres…';
        await lecteur.decodeFromConstraints(contraintes, video, (resultat) => {
          if (resultat) codeLu(resultat.getText());
        });
        flux = video.srcObject;
      }
    } catch (e) {
      arreterScan();
      etatScan.textContent =
        e?.name === 'NotAllowedError'
          ? 'L’accès à la caméra a été refusé. Autorise-le dans les réglages de ton navigateur, ou tape l’ISBN dans la recherche.'
          : e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError'
            ? 'Aucune caméra n’a été trouvée sur cet appareil. Tape l’ISBN dans la recherche.'
            : 'La caméra n’a pas pu démarrer. Tape l’ISBN dans la recherche.';
    }
  }
  boutonScan.addEventListener('click', scanner);
  fenetre.querySelector('[data-fermer-scan]').addEventListener('click', () => fenetre.close());
  fenetre.addEventListener('close', arreterScan);

  boutonPlus.addEventListener('click', async () => {
    boutonPlus.disabled = true;
    boutonPlus.textContent = 'Chargement…';
    try {
      const r = await rechercherLivres(qCourante, undefined, page + 1);
      page += 1;
      const deja = new Set(resultats.map(empreinte));
      const nouveaux = r.livres.filter((x) => !deja.has(empreinte(x)));
      resultats = [...resultats, ...nouveaux];
      const avant = liste.scrollTop;
      rendre(qCourante);
      boite.scrollTop = boite.scrollHeight;
      liste.scrollTop = avant;
      boutonPlus.hidden = !r.encore || !nouveaux.length;
      etatRecherche.textContent = nouveaux.length ? `${nouveaux.length} livres de plus, ${resultats.length} au total.` : 'Pas d’autre résultat.';
    } catch {
      etatRecherche.textContent = 'Impossible de charger plus de résultats pour le moment.';
    } finally {
      boutonPlus.disabled = false;
      boutonPlus.textContent = 'Voir plus de résultats';
    }
  });
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
    if (boite.hidden || !items.length || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
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
    champ('langue').value = r.langue ?? '';
    if (r.genre && !champ('genre').value) {
      champ('genre').value = r.genre;
      $('#aide-genre').hidden = false;
    }
    $('[data-choisi-titre]').textContent = r.titre;
    $('[data-choisi-meta]').textContent = [r.auteur, r.annee, r.pages ? `${nombre(r.pages)} pages` : null].filter(Boolean).join(' · ');
    $('[data-choisi-couv]').innerHTML = couverture(sourceCouverture(r), champ('couleur').value || 'caput', r.titre, 'M');
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
    form.querySelectorAll('[data-etoile-lu]').forEach((el) => (el.hidden = statut !== 'lu'));
    champ('fin').setAttribute('aria-required', String(statut === 'lu'));
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
    champ('fin').setAttribute('aria-invalid', String(invalide || (!err.hidden && Boolean(err.textContent))));
    if (err.hidden) champ('fin').removeAttribute('aria-describedby');
    else champ('fin').setAttribute('aria-describedby', 'err-dates');
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
    const avertissement = (r) => (r.sansFormat && valeurs.format ? ' Le format n’a pas pu être gardé : la mise à jour de la base reste à faire.' : '');
    if (lecture) {
      const r = await ecrireLecture((x) => sb.from('lectures').update({ ...x, couleur: lecture.couleur }).eq('id', lecture.id), valeurs);
      if (!r.error) return aller(`lecture.html?id=${encodeURIComponent(lecture.id)}`, 'Modifications enregistrées.' + avertissement(r));
    } else {
      const r = await ecrireLecture((x) => sb.from('lectures').insert(x), valeurs);
      if (!r.error) return aller('index.html', 'Lecture enregistrée.' + avertissement(r));
    }
    bouton.disabled = false;
    toast('La lecture n’a pas pu être enregistrée. Réessaie dans un instant.');
  });
}
