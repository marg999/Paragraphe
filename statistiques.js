// Mon année en lecture : statistiques.html?annee=2026
import { demarrer, sb, esc, nombre, decimal, pluriel, dateFr, couverture, etoiles, parametre, bilan, MOIS_COURTS, CRITERES } from './app.js';

await demarrer({ prive: true, actif: 'statistiques' });
const main = document.getElementById('contenu');
const [{ data: l, error }, { data: r }] = await Promise.all([sb.from('lectures').select('*'), sb.from('relectures').select('*')]);
const livres = l ?? [];
const relectures = r ?? [];

if (error) {
  main.innerHTML = `<div class="conteneur page"><p class="alerte" role="alert">Impossible de charger tes lectures. Réessaie dans un instant.</p></div>`;
} else {
  const courante = new Date().getFullYear();
  const annees = [...new Set([courante, ...livres.filter((x) => x.statut === 'lu' && x.fin).map((x) => Number(x.fin.slice(0, 4)))])].sort((a, b) => b - a);
  const demandee = Number(parametre('annee'));
  rendre(annees.includes(demandee) ? demandee : courante, annees);
}

function rendre(annee, annees) {
  const b = bilan(livres, relectures, annee);
  const ecart = b.lus.length - b.lusPrecedente;
  const tuiles = [
    [`Livres lus en ${annee}`, nombre(b.lus.length), b.lusPrecedente || ecart ? `${ecart >= 0 ? '+' : ''}${nombre(ecart)} par rapport à ${annee - 1}` : 'Ta première année sur Paragraphe'],
    ['Pages lues', nombre(b.pages), `soit ${pluriel(b.pagesParJour, 'page')} par jour`],
    ['Durée moyenne', b.dureeMoyenne ? nombre(b.dureeMoyenne) : '–', 'jours par livre'],
    ['Genre préféré', b.genre ? esc(b.genre.nom) : '–', b.genre ? `${pluriel(b.genre.n, 'livre')}${b.genre.moyenne ? `, note moyenne ${decimal(b.genre.moyenne)}` : ''}` : 'Indique le genre de tes livres pour le savoir', true],
  ];

  // Graphique : livres terminés par mois
  const L = 640, H = 260, g = 36, bas = 28, haut = 18;
  const max = Math.max(2, ...b.parMois);
  const pas = max <= 5 ? 1 : Math.ceil(max / 4);
  const grad = Array.from({ length: Math.floor(max / pas) + 1 }, (_, i) => i * pas);
  const hu = H - bas - haut;
  const lm = (L - g - 8) / 12;
  const y = (v) => haut + hu - (v / max) * hu;
  const graphique = `<svg class="graph" viewBox="0 0 ${L} ${H}" role="img" aria-label="Livres terminés par mois en ${annee} : ${b.parMois.map((n, i) => `${MOIS_COURTS[i]} ${n}`).join(', ')}">
    ${grad.map((v) => `<line class="grille" x1="${g}" x2="${L - 8}" y1="${y(v)}" y2="${y(v)}"/><text x="${g - 10}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
    ${b.parMois
      .map((n, i) => {
        const x = g + i * lm + lm * 0.2;
        const w = lm * 0.6;
        return `${
          n > 0
            ? `<rect class="barre" x="${x}" y="${y(n)}" width="${w}" height="${(n / max) * hu}" rx="4"/><text class="valeur-barre" x="${x + w / 2}" y="${y(n) - 6}" text-anchor="middle">${n}</text>`
            : `<rect class="barre-vide" x="${x}" y="${haut + hu - 3}" width="${w}" height="3" rx="1.5"/>`
        }<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${MOIS_COURTS[i]}</text>`;
      })
      .join('')}
  </svg>`;

  main.innerHTML = `<div class="conteneur page stats">
    <div class="entete-page">
      <div><p class="etiquette">Bilan ${annee}</p><h1 class="affiche titre-stats">Mon année en lecture</h1></div>
      ${
        annees.length > 1
          ? `<div class="choix-annee"><label for="annee" class="sr">Année</label><select id="annee">${annees
              .map((a) => `<option value="${a}"${a === annee ? ' selected' : ''}>${a}</option>`)
              .join('')}</select></div>`
          : ''
      }
    </div>
    <div class="tuiles">${tuiles
      .map(([t, v, n, mot]) => `<div class="tuile"><span class="etiquette">${t}</span><span class="valeur num${mot ? ' mot' : ''}">${v}</span><span class="petit">${n}</span></div>`)
      .join('')}</div>
    ${
      !b.lus.length
        ? `<div class="carte vide-stats"><h2 class="titre-2">Pas encore de livre terminé en ${annee}.</h2>
            <p class="petit">Dès que tu termines un livre, ton bilan prend forme ici.</p><a class="btn btn-principal" href="ajouter.html">Ajouter une lecture</a></div>`
        : `<div class="duo">
            <section class="carte"><h2 class="titre-2">Livres terminés par mois</h2><div class="defile">${graphique}</div></section>
            <section class="carte"><h2 class="titre-2">Tes notes moyennes</h2><div class="moyennes">
              ${CRITERES.map((c) => {
                const m = b.moyennes[c.cle];
                return `<div class="moy"><div class="moy-haut"><span class="etiquette">${c.libelle}</span><span class="num">${m != null ? `${decimal(m)} / 5` : '–'}</span></div>
                  <div class="barre-moy"><i style="width:${((m ?? 0) / 5) * 100}%"></i></div></div>`;
              }).join('')}
              <p class="petit">Calculé sur ${pluriel(b.nbNotes, 'livre noté', 'livres notés')} en ${annee}.</p>
            </div></section>
          </div>
          <section class="carte"><h2 class="titre-2">Tes coups de cœur de l’année</h2>
            <ol class="podium">${b.coupsDeCoeur
              .map(
                (x, i) => `<li><span class="rang">${i + 1}</span>${couverture(x.couverture_id, x.couleur, x.titre, 'S')}
                  <a href="lecture.html?id=${encodeURIComponent(x.id)}" class="podium-texte"><span class="titre-livre">${esc(x.titre)}</span>
                  <span class="petit">${esc(x.auteur)} · fini le ${dateFr(x.fin)}</span></a>${etoiles(x.note_generale, 'Note générale')}</li>`,
              )
              .join('')}</ol>
          </section>
          <section class="faits" aria-label="En bref">
            ${b.plusLong ? `<div class="fait"><span class="etiquette">Le plus long</span><a href="lecture.html?id=${encodeURIComponent(b.plusLong.id)}">${esc(b.plusLong.titre)}</a><span class="petit">${nombre(b.plusLong.pages)} pages</span></div>` : ''}
            ${b.plusRapide ? `<div class="fait"><span class="etiquette">Lu le plus vite</span><a href="lecture.html?id=${encodeURIComponent(b.plusRapide.l.id)}">${esc(b.plusRapide.l.titre)}</a><span class="petit">en ${pluriel(b.plusRapide.d, 'jour')}</span></div>` : ''}
            <div class="fait"><span class="etiquette">Relectures</span><span class="gros num">${nombre(b.relus)}</span><span class="petit">${b.relus > 1 ? 'livres relus' : 'livre relu'} en ${annee}</span></div>
            <div class="fait"><span class="etiquette">Abandonnés</span><span class="gros num">${nombre(b.abandonnes)}</span><span class="petit">et c’est très bien ainsi</span></div>
          </section>`
    }
  </div>`;
  document.getElementById('annee')?.addEventListener('change', (e) => {
    const a = Number(e.target.value);
    history.replaceState(null, '', `?annee=${a}`);
    rendre(a, annees);
  });
}
