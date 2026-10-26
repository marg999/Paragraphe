// Fiche d'un livre : lecture.html?id=…
import {
  demarrer, sb, esc, nombre, pluriel, dateFr, jours, aujourdhui, icone, couverture, etoiles, pastille, parametre, aller, toast,
  sourceCouverture, lienSource, titreHtml, empreinte, exclusions, livresDeAuteur, livresDuGenre, couleurAuHasard, ecrireLecture,
  normaliser, CRITERES, FORMATS, NOMS_GENRES,
} from './app.js?v=7';

const user = await demarrer({ prive: true, actif: 'bibliotheque' });
const main = document.getElementById('contenu');
const id = parametre('id') ?? '';

async function charger() {
  const [{ data }, { data: rels }] = await Promise.all([
    sb.from('lectures').select('*').eq('id', id).maybeSingle(),
    sb.from('relectures').select('*').eq('lecture_id', id).order('debut', { ascending: false }),
  ]);
  return { l: data, relectures: rels ?? [] };
}

let { l, relectures } = await charger();
// Suggestions : chargées une seule fois, puis réaffichées si la fiche est redessinée.
let recos = null; // { auteur: [], genre: [], biblio: [] }
let recosEnCours = false;

if (!l) {
  main.innerHTML = `<div class="conteneur page introuvable"><h1 class="titre-1">Ce livre est introuvable.</h1>
    <p class="petit">Il a peut-être été retiré de ta bibliothèque.</p><a class="btn btn-principal" href="index.html">Retour à ma bibliothèque</a></div>`;
} else {
  rendre();
}


function recommandable() {
  return l.statut === 'lu' && (l.note_generale ?? 0) >= 3;
}

function rendre(erreurRelecture = '') {
  document.title = `${l.titre} · Paragraphe`;
  const d = jours(l.debut, l.fin);
  const infos = [];
  if (l.debut) infos.push(['Début', dateFr(l.debut)]);
  if (l.fin) infos.push([l.statut === 'abandonne' ? 'Arrêt' : 'Fin', dateFr(l.fin)]);
  if (d && l.statut === 'lu') infos.push(['Durée', `${pluriel(d, 'jour')}${l.pages ? ` · ${nombre(Math.round(l.pages / d))} pages par jour` : ''}`]);
  if (l.genre) infos.push(['Genre', esc(l.genre)]);
  if (l.format && FORMATS[l.format]) infos.push(['Format', FORMATS[l.format]]);
  const lien = `ajouter.html?id=${encodeURIComponent(l.id)}`;
  const source = lienSource(l.ol_key);

  main.innerHTML = `<div class="conteneur page fiche-page"><div>
    <a class="retour" href="index.html">${icone('retour')}Ma bibliothèque</a>
    <article class="fiche">
      <div class="col-couv">
        ${couverture(sourceCouverture(l), l.couleur, l.titre, 'L')}
        ${source ? `<a class="petit" href="${esc(source.url)}" rel="noopener" target="_blank">Voir sur ${source.nom}<span class="sr"> (s’ouvre dans un nouvel onglet)</span></a>` : ''}
      </div>
      <div class="contenu">
        <header class="tete">
          ${pastille(l.statut)}
          <h1 class="titre-1">${titreHtml(l)}</h1>
          <p class="petit">${esc([l.auteur, l.annee, l.pages ? `${nombre(l.pages)} pages` : null].filter(Boolean).join(' · '))}</p>
        </header>

        <div class="actions">
          ${l.statut === 'a-lire' ? '<button class="btn btn-principal" type="button" data-action="commencer">Commencer la lecture</button>' : ''}
          ${l.statut === 'en-cours' ? `<a class="btn btn-principal" href="${lien}&terminer=1">Terminer et noter</a>` : ''}
          <a class="btn btn-secondaire" href="${lien}">${icone('crayon')}Modifier</a>
          <details class="confirmer">
            <summary class="btn btn-lien danger">Retirer de ma bibliothèque</summary>
            <div class="boite-confirmer">
              <p>Retirer « ${esc(l.titre)} » ? Ta note, ton commentaire et tes relectures seront effacés.</p>
              <button class="btn btn-danger btn-petit" type="button" data-action="supprimer">${icone('corbeille')}Retirer</button>
            </div>
          </details>
        </div>

        ${infos.length ? `<dl class="infos">${infos.map(([a, b]) => `<dt class="etiquette">${a}</dt><dd>${b}</dd>`).join('')}</dl>` : ''}

        ${
          l.note_generale
            ? `<section class="carte notes" aria-label="Notes">${CRITERES.map(
                (c) => `<div class="critere"><span class="etiquette">${c.libelle}</span>${
                  l[c.cle] ? etoiles(l[c.cle], c.libelle, c.cle === 'note_generale' ? 22 : 18) : '<span class="petit">Pas noté</span>'
                }</div>`,
              ).join('')}</section>`
            : l.statut !== 'a-lire'
              ? '<p class="petit">Pas encore de note. Tu pourras noter ce livre une fois terminé.</p>'
              : ''
        }

        ${l.commentaire ? `<section class="champ"><h2 class="etiquette">Ton commentaire</h2><blockquote>${esc(l.commentaire)}</blockquote></section>` : ''}

        ${
          l.statut === 'lu'
            ? `<section class="champ relectures">
                <h2 class="etiquette">Relectures</h2>
                ${
                  relectures.length
                    ? `<ul>${relectures
                        .map(
                          (r) => `<li><span>Relu du ${dateFr(r.debut)} au ${dateFr(r.fin)} <span class="petit">· ${pluriel(jours(r.debut, r.fin) ?? 1, 'jour')}</span></span>
                          <button class="btn btn-lien btn-petit" type="button" data-relecture="${esc(r.id)}" aria-label="Supprimer la relecture du ${dateFr(r.debut)}">${icone('x', 16)}</button></li>`,
                        )
                        .join('')}</ul>`
                    : '<p class="petit">Pas encore relu.</p>'
                }
                <details class="ajout-relecture"${erreurRelecture ? ' open' : ''}>
                  <summary class="btn btn-secondaire btn-petit">${icone('relire')}Noter une relecture</summary>
                  <form class="form-relecture" novalidate>
                    <p class="aide large-form">Les deux dates sont obligatoires.</p>
                    <div class="champ"><label for="r-debut">Début <span aria-hidden="true">*</span></label><input id="r-debut" name="debut" type="date" required aria-required="true" max="${aujourdhui()}"${erreurRelecture ? ' aria-invalid="true" aria-describedby="err-relecture"' : ''}></div>
                    <div class="champ"><label for="r-fin">Fin <span aria-hidden="true">*</span></label><input id="r-fin" name="fin" type="date" required aria-required="true" max="${aujourdhui()}"${erreurRelecture ? ' aria-invalid="true" aria-describedby="err-relecture"' : ''}></div>
                    <button class="btn btn-principal" type="submit">Enregistrer la relecture</button>
                    ${erreurRelecture ? `<p class="erreur" role="alert" id="err-relecture">${esc(erreurRelecture)}</p>` : ''}
                  </form>
                </details>
              </section>`
            : ''
        }
      </div>
    </article>
    ${recommandable() ? '<section class="recos-fiche" id="recos" aria-labelledby="titre-recos"></section>' : ''}
  </div></div>`;

  if (erreurRelecture) document.getElementById('r-debut')?.focus();
  brancherActions();
  if (recommandable()) {
    afficherRecos();
    if (!recos && !recosEnCours) chargerRecos();
  }
}

function brancherActions() {
  main.querySelector('[data-action="commencer"]')?.addEventListener('click', async (e) => {
    e.target.disabled = true;
    const { error } = await sb.from('lectures').update({ statut: 'en-cours', debut: aujourdhui() }).eq('id', l.id);
    if (error) return toast('La modification n’a pas pu être enregistrée.');
    ({ l, relectures } = await charger());
    rendre();
    toast('Bonne lecture.');
  });
  main.querySelector('[data-action="supprimer"]').addEventListener('click', async (e) => {
    e.target.disabled = true;
    const { error } = await sb.from('lectures').delete().eq('id', l.id);
    if (error) {
      e.target.disabled = false;
      return toast('Le livre n’a pas pu être retiré. Réessaie dans un instant.');
    }
    aller('index.html', 'Livre retiré de ta bibliothèque.');
  });
  main.querySelectorAll('[data-relecture]').forEach((b) =>
    b.addEventListener('click', async () => {
      await sb.from('relectures').delete().eq('id', b.dataset.relecture).eq('lecture_id', l.id);
      ({ l, relectures } = await charger());
      rendre();
    }),
  );
  main.querySelector('.form-relecture')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const debut = e.target.debut.value;
    const fin = e.target.fin.value;
    if (!debut || !fin) return rendre('Indique les deux dates de ta relecture.');
    if (jours(debut, fin) === null) return rendre('La date de fin doit être après la date de début.');
    if (fin > aujourdhui()) return rendre('La date de fin ne peut pas être dans le futur.');
    const { error } = await sb.from('relectures').insert({ lecture_id: l.id, debut, fin });
    if (error) return rendre('La relecture n’a pas pu être enregistrée. Réessaie dans un instant.');
    ({ l, relectures } = await charger());
    rendre();
    toast('Relecture enregistrée.');
  });
}

// =============================================================================
//  « Si tu as aimé ce livre »
// =============================================================================
async function chargerRecos() {
  recosEnCours = true;
  const [{ data: tous }, { data: ecartees }] = await Promise.all([
    sb.from('lectures').select('*'),
    sb.from('recos_ecartees').select('ol_key'),
  ]);
  const bibliotheque = tous ?? [];
  const ex = exclusions(bibliotheque, (ecartees ?? []).map((e) => e.ol_key));
  const nomAuteur = normaliser(String(l.auteur).split(',')[0]).split(' ').pop();

  // Déjà dans ta bibliothèque : livres « À lire » du même auteur ou du même genre.
  const biblio = bibliotheque
    .filter((x) => x.id !== l.id && x.statut === 'a-lire')
    .map((x) => ({ x, poids: (normaliser(x.auteur).includes(nomAuteur) ? 2 : 0) + (l.genre && x.genre === l.genre ? 1 : 0) }))
    .filter((y) => y.poids > 0)
    .sort((a, b) => b.poids - a.poids)
    .slice(0, 4)
    .map((y) => y.x);

  const [auteur, genre] = await Promise.allSettled([
    livresDeAuteur(l.auteur, ex, 4),
    l.genre ? livresDuGenre(l.genre, ex, 8, l.id) : Promise.resolve([]),
  ]);
  const deAuteur = auteur.status === 'fulfilled' ? auteur.value : [];
  const vus = new Set(deAuteur.map(empreinte));
  const duGenre = (genre.status === 'fulfilled' ? genre.value : []).filter((x) => !vus.has(empreinte(x))).slice(0, 4);
  recos = {
    auteur: deAuteur,
    genre: duGenre,
    biblio,
    erreur: auteur.status === 'rejected' && genre.status === 'rejected',
  };
  recosEnCours = false;
  afficherRecos();
}

function carteSuggestion(x, rangee, i) {
  if (x.ajoute) {
    return `<article class="reco-carte">${couverture(sourceCouverture(x), 'nuit', x.titre, 'S')}
      <div class="reco-texte"><p class="reco-titre">${titreHtml(x)}</p><p class="petit">${esc(x.auteur)}</p>
      <p class="reco-ok" role="status">Ajouté à « À lire »</p></div></article>`;
  }
  return `<article class="reco-carte">
    ${couverture(sourceCouverture(x), ['nuit', 'caput', 'slate', 'coffee'][i % 4], x.titre, 'S')}
    <div class="reco-texte">
      <p class="reco-titre">${titreHtml(x)}</p>
      <p class="petit">${esc(x.auteur)}${x.annee ? ` · ${x.annee}` : ''}</p>
      <div class="reco-actions">
        <button class="btn btn-secondaire btn-petit" type="button" data-ajouter="${rangee}:${i}">Ajouter à « À lire »<span class="sr"> : ${esc(x.titre)}</span></button>
        <button class="btn btn-lien btn-petit" type="button" data-ecarter="${rangee}:${i}">Pas pour moi<span class="sr"> : ${esc(x.titre)}</span></button>
      </div>
    </div>
  </article>`;
}

function afficherRecos() {
  const zone = document.getElementById('recos');
  if (!zone) return;
  const titre = `<h2 class="titre-2" id="titre-recos">Si tu as aimé ce livre</h2>`;
  if (!recos) {
    zone.innerHTML = `${titre}<p class="petit" role="status">Recherche de livres proches…</p>`;
    return;
  }
  const nomAuteur = String(l.auteur).split(',')[0].trim();
  const rangees = [
    ['auteur', `Du même auteur · ${esc(nomAuteur)}`, recos.auteur],
    ['genre', `Dans le même genre · ${esc(l.genre ?? '')}`, recos.genre],
  ].filter(([, , liste]) => liste.length);
  const biblio = recos.biblio.length
    ? `<div class="rangee"><h3 class="etiquette">Déjà dans ta liste « À lire »</h3><div class="reco-grille">${recos.biblio
        .map(
          (x) => `<a class="reco-carte reco-lien" href="lecture.html?id=${encodeURIComponent(x.id)}">${couverture(sourceCouverture(x), x.couleur, x.titre, 'S')}
            <div class="reco-texte"><p class="reco-titre">${titreHtml(x)}</p><p class="petit">${esc(x.auteur)}</p><span class="pastille st-a-lire">À lire</span></div></a>`,
        )
        .join('')}</div></div>`
    : '';
  const vide = !rangees.length && !biblio;
  zone.innerHTML = `${titre}
    ${vide ? `<p class="petit">${recos.erreur ? 'Les suggestions sont indisponibles pour le moment. Réessaie un peu plus tard.' : 'Pas de suggestion pour ce livre pour l’instant.'}</p>` : ''}
    ${biblio}
    ${rangees
      .map(([cle, libelle, liste]) => `<div class="rangee"><h3 class="etiquette">${libelle}</h3><div class="reco-grille">${liste.map((x, i) => carteSuggestion(x, cle, i)).join('')}</div></div>`)
      .join('')}`;

  zone.querySelectorAll('[data-ajouter]').forEach((b) =>
    b.addEventListener('click', async () => {
      const [rangee, i] = b.dataset.ajouter.split(':');
      const x = recos[rangee][Number(i)];
      b.disabled = true;
      const { error } = await ecrireLecture((v) => sb.from('lectures').insert(v), {
        ol_key: x.olKey,
        titre: x.titre,
        auteur: x.auteur,
        annee: x.annee,
        pages: x.pages,
        couverture_id: x.couvertureId,
        genre: NOMS_GENRES.includes(x.genre) ? x.genre : null,
        langue: x.langue ?? null,
        couleur: couleurAuHasard(),
        statut: 'a-lire',
      });
      if (error) {
        b.disabled = false;
        return toast('Le livre n’a pas pu être ajouté. Réessaie dans un instant.');
      }
      x.ajoute = true;
      afficherRecos();
      toast(`${x.titre} ajouté à « À lire ».`);
    }),
  );
  zone.querySelectorAll('[data-ecarter]').forEach((b) =>
    b.addEventListener('click', async () => {
      const [rangee, i] = b.dataset.ecarter.split(':');
      const x = recos[rangee][Number(i)];
      await sb.from('recos_ecartees').upsert({ user_id: user.id, ol_key: x.olKey });
      recos[rangee] = recos[rangee].filter((y) => y !== x);
      afficherRecos();
      zone.querySelector('h2').setAttribute('tabindex', '-1');
      zone.querySelector('h2').focus();
    }),
  );
}
