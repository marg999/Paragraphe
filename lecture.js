// Fiche d'un livre : lecture.html?id=…
import {
  demarrer, sb, esc, sourceCouverture, lienSource, nombre, pluriel, dateFr, jours, aujourdhui, icone, couverture, etoiles, pastille, parametre, aller, toast, CRITERES,
} from './app.js';

await demarrer({ prive: true, actif: 'bibliotheque' });
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
if (!l) {
  main.innerHTML = `<div class="conteneur page introuvable"><h1 class="titre-1">Ce livre est introuvable.</h1>
    <p class="petit">Il a peut-être été retiré de ta bibliothèque.</p><a class="btn btn-principal" href="index.html">Retour à ma bibliothèque</a></div>`;
} else {
  rendre();
}

function rendre(erreurRelecture = '') {
  document.title = `${l.titre} · Paragraphe`;
  const d = jours(l.debut, l.fin);
  const infos = [];
  if (l.debut) infos.push(['Début', dateFr(l.debut)]);
  if (l.fin) infos.push([l.statut === 'abandonne' ? 'Arrêt' : 'Fin', dateFr(l.fin)]);
  if (d && l.statut === 'lu') infos.push(['Durée', `${pluriel(d, 'jour')}${l.pages ? ` · ${nombre(Math.round(l.pages / d))} pages par jour` : ''}`]);
  if (l.genre) infos.push(['Genre', esc(l.genre)]);
  const lien = `ajouter.html?id=${encodeURIComponent(l.id)}`;

  main.innerHTML = `<div class="conteneur page fiche-page"><div>
    <a class="retour" href="index.html">${icone('retour')}Ma bibliothèque</a>
    <article class="fiche">
      <div class="col-couv">
        ${couverture(sourceCouverture(l), l.couleur, l.titre, 'L')}
        ${(() => {
          const s = lienSource(l.ol_key);
          return s ? `<a class="petit" href="${esc(s.url)}" rel="noopener" target="_blank">Voir sur ${s.nom}<span class="sr"> (nouvel onglet)</span></a>` : '';
        })()}
      </div>
      <div class="contenu">
        <header class="tete">
          ${pastille(l.statut)}
          <h1 class="titre-1">${esc(l.titre)}</h1>
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
                    <div class="champ"><label for="r-debut">Début</label><input id="r-debut" name="debut" type="date" required max="${aujourdhui()}"></div>
                    <div class="champ"><label for="r-fin">Fin</label><input id="r-fin" name="fin" type="date" required max="${aujourdhui()}"></div>
                    <button class="btn btn-principal" type="submit">Enregistrer la relecture</button>
                    ${erreurRelecture ? `<p class="erreur" role="alert">${esc(erreurRelecture)}</p>` : ''}
                  </form>
                </details>
              </section>`
            : ''
        }
      </div>
    </article></div></div>`;

  // ---- Actions ----
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
