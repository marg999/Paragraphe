// Mes bilans : statistiques.html?vue=mois&mois=2026-10  ou  statistiques.html?vue=annee&annee=2026
import {
  demarrer, sb, esc, nombre, decimal, pluriel, dateFr, jours, aujourdhui, couverture, etoiles, parametre, sourceCouverture, titreHtml,
  bilan, moyennes, genrePrefere, score, MOIS_COURTS, CRITERES, FORMATS,
} from './app.js?v=9';

await demarrer({ prive: true, actif: 'statistiques' });
const main = document.getElementById('contenu');
const [{ data: l, error }, { data: r }] = await Promise.all([sb.from('lectures').select('*'), sb.from('relectures').select('*')]);
const livres = l ?? [];
const relectures = r ?? [];

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const de = (mot) => (/^[aeiouyhéèêâàîôû]/i.test(mot) ? `d’${mot}` : `de ${mot}`);
const aujourd = aujourdhui();
const moisCourant = aujourd.slice(0, 7);
const anneeCourante = Number(aujourd.slice(0, 4));
const cleMois = (a, m) => `${a}-${String(m).padStart(2, '0')}`;
const decaler = (cle, n) => {
  const [a, m] = cle.split('-').map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return cleMois(d.getFullYear(), d.getMonth() + 1);
};
const libelleMois = (cle) => {
  const [a, m] = cle.split('-').map(Number);
  return `${MOIS[m - 1]} ${a}`;
};
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const libelleCritere = { note_rythme: 'le rythme', note_emotion: 'l’émotion', note_personnages: 'les personnages' };
const vitesse = (l) => {
  const d = jours(l.debut, l.fin);
  return d && l.pages ? l.pages / d : null;
};
const PLURIELS = {
  Classiques: 'classiques', Romans: 'romans', Policier: 'polars', 'Science-fiction': 'livres de science-fiction', Fantasy: 'livres de fantasy',
  Aventure: 'romans d’aventure', Histoire: 'livres d’histoire', Poésie: 'recueils de poésie', Théâtre: 'pièces de théâtre', Essais: 'essais',
  Biographie: 'biographies', 'Bande dessinée': 'bandes dessinées', Jeunesse: 'livres jeunesse',
};
const genrePluriel = (g) => PLURIELS[g] ?? g.toLowerCase();
const moyenne = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

// Première période qui contient des données, pour ne pas remonter indéfiniment dans le passé.
const datesConnues = livres.flatMap((x) => [x.debut, x.fin]).concat(relectures.flatMap((x) => [x.debut, x.fin])).filter(Boolean).sort();
const premierMois = (datesConnues[0] ?? aujourd).slice(0, 7);
const premiereAnnee = Number(premierMois.slice(0, 4));

const etat = {
  vue: parametre('vue') === 'annee' ? 'annee' : 'mois',
  mois: /^\d{4}-\d{2}$/.test(parametre('mois') ?? '') ? parametre('mois') : moisCourant,
  annee: Number(parametre('annee')) || anneeCourante,
};
if (etat.mois > moisCourant) etat.mois = moisCourant;
if (etat.annee > anneeCourante) etat.annee = anneeCourante;

if (error) {
  main.innerHTML = `<div class="conteneur page"><p class="alerte" role="alert">Impossible de charger tes lectures. Réessaie dans un instant.</p></div>`;
} else {
  main.innerHTML = `<div class="conteneur page stats">
    <div class="entete-page"><div>
      <h1 class="titre-1">Mes bilans</h1>
      <p class="petit">Tes lectures, mois par mois et année par année.</p>
    </div></div>
    <div class="barre-bilan">
      <div class="onglets" role="group" aria-label="Type de bilan">
        <button type="button" data-vue="mois">Mois</button>
        <button type="button" data-vue="annee">Année</button>
      </div>
      <div class="periode">
        <button type="button" class="fleche" data-pas="-1"></button>
        <h2 class="titre-2" id="periode" aria-live="polite"></h2>
        <button type="button" class="fleche" data-pas="1"></button>
      </div>
    </div>
    <div id="bilan" class="bilan"></div>
  </div>`;
  main.querySelectorAll('[data-vue]').forEach((b) =>
    b.addEventListener('click', () => {
      etat.vue = b.dataset.vue;
      if (etat.vue === 'annee') etat.annee = Number(etat.mois.slice(0, 4));
      rendre();
    }),
  );
  main.querySelectorAll('[data-pas]').forEach((b) =>
    b.addEventListener('click', () => {
      const pas = Number(b.dataset.pas);
      if (etat.vue === 'mois') etat.mois = decaler(etat.mois, pas);
      else etat.annee += pas;
      rendre();
    }),
  );
  // Les barres du graphique annuel ouvrent le mois correspondant.
  main.addEventListener('click', (e) => {
    const lien = e.target.closest('[data-ouvrir-mois]');
    if (!lien) return;
    e.preventDefault();
    etat.vue = 'mois';
    etat.mois = lien.dataset.ouvrirMois;
    rendre();
    document.getElementById('periode').scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  rendre();
}

function rendre() {
  const p = new URLSearchParams({ vue: etat.vue });
  if (etat.vue === 'mois') p.set('mois', etat.mois);
  else p.set('annee', etat.annee);
  history.replaceState(null, '', `?${p}`);

  main.querySelectorAll('[data-vue]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vue === etat.vue)));
  const [prec, suiv] = main.querySelectorAll('[data-pas]');
  const estMois = etat.vue === 'mois';
  prec.innerHTML = `<span aria-hidden="true">‹</span><span class="sr">${estMois ? 'Mois précédent' : 'Année précédente'}</span>`;
  suiv.innerHTML = `<span aria-hidden="true">›</span><span class="sr">${estMois ? 'Mois suivant' : 'Année suivante'}</span>`;
  prec.disabled = estMois ? etat.mois <= premierMois : etat.annee <= premiereAnnee;
  suiv.disabled = estMois ? etat.mois >= moisCourant : etat.annee >= anneeCourante;
  document.getElementById('periode').textContent = estMois ? majuscule(libelleMois(etat.mois)) : String(etat.annee);
  document.title = `Mes bilans · ${estMois ? libelleMois(etat.mois) : etat.annee} · Paragraphe`;
  document.getElementById('bilan').innerHTML = estMois ? vueMois(etat.mois) : vueAnnee(etat.annee);
}

// =============================================================================
//  Bilan du mois
// =============================================================================
function lusDuMois(cle) {
  return livres.filter((x) => x.statut === 'lu' && x.fin?.startsWith(cle));
}

/** Nombre de livres en cours pour chaque jour du mois, et livres terminés ce jour-là. */
function calendrier(cle) {
  const [a, m] = cle.split('-').map(Number);
  const nbJours = new Date(a, m, 0).getDate();
  const periodes = [
    ...livres
      .filter((x) => x.debut && x.statut !== 'a-lire')
      .map((x) => ({ debut: x.debut, fin: x.fin || (x.statut === 'en-cours' ? aujourd : x.debut), titre: x.titre, finit: x.statut === 'lu' ? x.fin : null })),
    ...relectures.map((x) => {
      const livre = livres.find((y) => y.id === x.lecture_id);
      return { debut: x.debut, fin: x.fin, titre: livre ? `${livre.titre} (relecture)` : 'Relecture', finit: null };
    }),
  ];
  const jour = [];
  for (let j = 1; j <= nbJours; j++) {
    const date = `${cle}-${String(j).padStart(2, '0')}`;
    const enCours = periodes.filter((x) => x.debut <= date && date <= x.fin);
    jour.push({ date, j, futur: date > aujourd, enCours, termines: periodes.filter((x) => x.finit === date).map((x) => x.titre) });
  }
  const decal = (new Date(a, m - 1, 1).getDay() + 6) % 7; // lundi = 0
  return { jour, decal, joursLus: jour.filter((x) => x.enCours.length).length, joursEcoules: jour.filter((x) => !x.futur).length };
}

function calendrierHtml(cle, cal) {
  const cases = [...Array(cal.decal).fill(null), ...cal.jour];
  while (cases.length % 7) cases.push(null);
  const semaines = [];
  for (let i = 0; i < cases.length; i += 7) semaines.push(cases.slice(i, i + 7));
  const td = (x) => {
    if (!x) return '<td class="vide-cal"></td>';
    const n = x.enCours.length;
    const classe = x.futur ? 'futur' : x.termines.length ? 'fin' : n >= 2 ? 'lecture-2' : n === 1 ? 'lecture-1' : '';
    const detail = x.termines.length
      ? `terminé : ${x.termines.join(', ')}`
      : n
        ? `en cours : ${x.enCours.map((y) => y.titre).join(', ')}`
        : x.futur ? '' : 'pas de lecture';
    return `<td class="${classe}"${detail ? ` title="${esc(detail)}"` : ''}><span aria-hidden="true">${x.j}</span><span class="sr">${x.j} ${MOIS[Number(cle.slice(5)) - 1]}${detail ? `, ${esc(detail)}` : ''}</span></td>`;
  };
  return `<table class="calendrier">
    <caption class="sr">Calendrier de lecture ${de(libelleMois(cle))}</caption>
    <thead><tr>${['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((d) => `<th scope="col"><abbr title="${d}">${d[0].toUpperCase()}</abbr></th>`).join('')}</tr></thead>
    <tbody>${semaines.map((s) => `<tr>${s.map(td).join('')}</tr>`).join('')}</tbody>
  </table>
  <div class="legende" aria-hidden="true">
    <span><i class="lecture-1"></i>Un livre en cours</span>
    <span><i class="lecture-2"></i>Plusieurs</span>
    <span><i class="fin"></i>Livre terminé</span>
  </div>`;
}

function analyseMois(cle, lus, cal) {
  const phrases = [];
  const precedent = decaler(cle, -1);
  const nomPrec = MOIS[Number(precedent.slice(5)) - 1];
  const nPrec = lusDuMois(precedent).length;
  if (!lus.length && !cal.joursLus) return ['Pas de lecture enregistrée ce mois-ci. Ta bibliothèque t’attend.'];

  if (lus.length) {
    const ecart = lus.length - nPrec;
    const comparaison =
      ecart === 0 ? `autant qu’en ${nomPrec}`
      : ecart > 0 ? `${ecart === 1 ? 'un' : nombre(ecart)} de plus qu’en ${nomPrec}`
      : `${Math.abs(ecart) === 1 ? 'un' : nombre(Math.abs(ecart))} de moins qu’en ${nomPrec}`;
    phrases.push(`Tu as terminé ${pluriel(lus.length, 'livre')}, ${comparaison}.`);
  } else {
    phrases.push(`Aucun livre terminé ce mois-ci, mais tu as lu ${pluriel(cal.joursLus, 'jour')}.`);
  }
  if (cal.joursEcoules >= 7 && cal.joursLus) {
    const part = cal.joursLus / cal.joursEcoules;
    phrases.push(
      part >= 0.8 ? `Une lecture presque quotidienne : ${nombre(cal.joursLus)} jours sur ${nombre(cal.joursEcoules)}.`
      : `Tu as lu ${nombre(cal.joursLus)} jours sur ${nombre(cal.joursEcoules)}.`,
    );
  }
  const g = genrePrefere(lus);
  if (lus.length >= 2 && g && g.n / lus.length >= 0.5) phrases.push(`Un mois placé sous le signe des ${genrePluriel(g.nom)} : ${g.n} livres sur ${lus.length}.`);

  const notesMois = lus.map((x) => x.note_generale).filter(Boolean);
  const notesTout = livres.filter((x) => x.statut === 'lu').map((x) => x.note_generale).filter(Boolean);
  const mm = moyenne(notesMois);
  const mt = moyenne(notesTout);
  if (mm && mt && notesTout.length >= 4 && notesMois.length >= 1) {
    if (mm - mt >= 0.4) phrases.push(`Un mois généreux : ta note moyenne (${decimal(mm)}) dépasse ton habitude (${decimal(mt)}).`);
    else if (mt - mm >= 0.4) phrases.push(`Un mois plus exigeant : ta note moyenne (${decimal(mm)}) est sous ton habitude (${decimal(mt)}).`);
  }
  const vm = moyenne(lus.map(vitesse).filter(Boolean));
  const vt = moyenne(livres.filter((x) => x.statut === 'lu').map(vitesse).filter(Boolean));
  if (vm && vt && Math.abs(vm - vt) / vt >= 0.2) {
    phrases.push(`Tu as lu ${vm > vt ? 'plus vite' : 'plus lentement'} que d’habitude : ${nombre(Math.round(vm))} pages par jour contre ${nombre(Math.round(vt))}.`);
  }
  const formats = lus.map((x) => x.format).filter(Boolean);
  if (formats.length >= 2) {
    const top = Object.entries(formats.reduce((o, f) => ((o[f] = (o[f] ?? 0) + 1), o), {})).sort((a, b) => b[1] - a[1])[0];
    if (top[1] / formats.length > 0.5 && top[0] !== 'papier') phrases.push(`Surtout en ${FORMATS[top[0]].toLowerCase()} ce mois-ci.`);
  }
  return phrases.slice(0, 5);
}

function vueMois(cle) {
  const lus = lusDuMois(cle);
  const cal = calendrier(cle);
  const precedent = decaler(cle, -1);
  const nPrec = lusDuMois(precedent).length;
  const ecart = lus.length - nPrec;
  const pages = lus.reduce((s, x) => s + (x.pages ?? 0), 0);
  const notes = lus.map((x) => x.note_generale).filter(Boolean);
  const nomPrec = MOIS[Number(precedent.slice(5)) - 1];
  const tuiles = [
    ['Livres terminés', nombre(lus.length), ecart === 0 ? `comme en ${nomPrec}` : `${ecart > 0 ? '+' : ''}${nombre(ecart)} par rapport à ${nomPrec}`],
    ['Pages lues', nombre(pages), cal.joursEcoules ? `soit ${pluriel(Math.round(pages / cal.joursEcoules), 'page')} par jour` : ''],
    ['Jours de lecture', nombre(cal.joursLus), `sur ${nombre(cal.joursEcoules)} ${cal.joursEcoules > 1 ? 'jours' : 'jour'}`],
    ['Note moyenne', notes.length ? decimal(moyenne(notes)) : '–', notes.length ? 'sur 5' : 'pas encore de note'],
  ];
  const coeur = [...lus].filter((x) => x.note_generale).sort((a, b) => score(b) - score(a))[0];

  return `
    <div class="tuiles">${tuiles.map(([t, v, n]) => `<div class="tuile"><span class="etiquette">${t}</span><span class="valeur num">${v}</span><span class="petit">${n}</span></div>`).join('')}</div>
    <div class="duo duo-mois">
      <section class="carte" aria-labelledby="t-cal"><h3 class="titre-2" id="t-cal">Calendrier de lecture</h3><div class="defile">${calendrierHtml(cle, cal)}</div></section>
      <section class="carte" aria-labelledby="t-analyse">
        <h3 class="titre-2" id="t-analyse">En quelques mots</h3>
        <ul class="analyse">${analyseMois(cle, lus, cal).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        ${coeur ? `<div class="coeur"><span class="etiquette">Coup de cœur du mois</span>
          <a href="lecture.html?id=${encodeURIComponent(coeur.id)}" class="coeur-lien">${couverture(sourceCouverture(coeur), coeur.couleur, coeur.titre, 'S')}
          <span><span class="titre-livre">${titreHtml(coeur)}</span><span class="petit">${esc(coeur.auteur)}</span></span></a>${etoiles(coeur.note_generale, 'Note générale')}</div>` : ''}
      </section>
    </div>
    <section class="carte" aria-labelledby="t-liste">
      <h3 class="titre-2" id="t-liste">Livres terminés en ${MOIS[Number(cle.slice(5)) - 1]}</h3>
      ${lus.length ? listeLivres([...lus].sort((a, b) => a.fin.localeCompare(b.fin))) : `<p class="petit vide-liste">Aucun livre terminé ce mois-ci.${cle === moisCourant ? ' Il reste encore quelques jours.' : ''}</p>`}
    </section>`;
}

function listeLivres(liste) {
  return `<ol class="podium liste-mois">${liste
    .map((x) => {
      const d = jours(x.debut, x.fin);
      return `<li>${couverture(sourceCouverture(x), x.couleur, x.titre, 'S')}
        <a href="lecture.html?id=${encodeURIComponent(x.id)}" class="podium-texte"><span class="titre-livre">${titreHtml(x)}</span>
        <span class="petit">${esc(x.auteur)} · fini le ${dateFr(x.fin)}${d ? ` · lu en ${pluriel(d, 'jour')}` : ''}</span></a>
        ${etoiles(x.note_generale, 'Note générale')}</li>`;
    })
    .join('')}</ol>`;
}

// =============================================================================
//  Bilan de l'année
// =============================================================================
function profil(lus, annee, parMois) {
  const phrases = [];
  const m = moyennes(lus);
  const criteres = ['note_rythme', 'note_emotion', 'note_personnages'].filter((k) => m[k] != null).sort((a, b) => m[b] - m[a]);
  if (criteres.length >= 2 && lus.filter((x) => x.note_rythme || x.note_emotion || x.note_personnages).length >= 3) {
    const [haut, , bas] = [criteres[0], criteres[1], criteres[criteres.length - 1]];
    phrases.push(`Ce que tu apprécies le plus : ${libelleCritere[haut]} (${decimal(m[haut])} / 5 en moyenne).`);
    if (m[haut] - m[bas] >= 0.4) phrases.push(`Tu notes plus sévèrement ${libelleCritere[bas]} (${decimal(m[bas])} / 5).`);
  }
  const g = genrePrefere(lus);
  if (g && lus.length >= 3) phrases.push(`Les ${genrePluriel(g.nom)} représentent ${Math.round((g.n / lus.length) * 100)} % de tes lectures.`);
  const auteurs = Object.entries(lus.reduce((o, x) => ((o[x.auteur] = (o[x.auteur] ?? 0) + 1), o), {})).sort((a, b) => b[1] - a[1]);
  if (auteurs[0]?.[1] >= 2) phrases.push(`Ton auteur de l’année : ${auteurs[0][0]}, avec ${auteurs[0][1]} livres.`);
  const courts = lus.filter((x) => x.pages && x.pages < 300).map(vitesse).filter(Boolean);
  const longs = lus.filter((x) => x.pages && x.pages >= 300).map(vitesse).filter(Boolean);
  if (courts.length >= 2 && longs.length >= 2) {
    const vc = moyenne(courts);
    const vl = moyenne(longs);
    if (Math.abs(vc - vl) / Math.min(vc, vl) >= 0.2) {
      phrases.push(
        vl > vc
          ? `Tu avances plus vite dans les livres longs : ${nombre(Math.round(vl))} pages par jour, contre ${nombre(Math.round(vc))} pour les livres courts.`
          : `Tu avances plus vite dans les livres courts : ${nombre(Math.round(vc))} pages par jour, contre ${nombre(Math.round(vl))} pour les livres longs.`,
      );
    }
  }
  const max = Math.max(...parMois);
  if (max >= 2) phrases.push(`Ton mois le plus riche : ${MOIS[parMois.indexOf(max)]}, avec ${max} livres.`);
  return phrases;
}

function barres(titre, entrees, total) {
  if (!entrees.length) return '';
  return `<div class="repartition"><h4 class="etiquette">${titre}</h4>${entrees
    .map(([nom, n]) => {
      const pct = Math.round((n / total) * 100);
      return `<div class="moy"><div class="moy-haut"><span>${esc(nom)}</span><span class="num">${nombre(n)} · ${pct} %</span></div><div class="barre-moy"><i style="width:${pct}%"></i></div></div>`;
    })
    .join('')}</div>`;
}

function vueAnnee(annee) {
  const b = bilan(livres, relectures, annee);
  const ecart = b.lus.length - b.lusPrecedente;
  const tuiles = [
    [`Livres lus en ${annee}`, nombre(b.lus.length), b.lusPrecedente || ecart ? `${ecart >= 0 ? '+' : ''}${nombre(ecart)} par rapport à ${annee - 1}` : 'Ta première année sur Paragraphe'],
    ['Pages lues', nombre(b.pages), `soit ${pluriel(b.pagesParJour, 'page')} par jour`],
    ['Durée moyenne', b.dureeMoyenne ? nombre(b.dureeMoyenne) : '–', 'jours par livre'],
    ['Genre préféré', b.genre ? esc(b.genre.nom) : '–', b.genre ? `${pluriel(b.genre.n, 'livre')}${b.genre.moyenne ? `, note moyenne ${decimal(b.genre.moyenne)}` : ''}` : 'Indique le genre de tes livres pour le savoir', true],
  ];
  const tuilesHtml = `<div class="tuiles">${tuiles
    .map(([t, v, n, mot]) => `<div class="tuile"><span class="etiquette">${t}</span><span class="valeur num${mot ? ' mot' : ''}">${v}</span><span class="petit">${n}</span></div>`)
    .join('')}</div>`;
  if (!b.lus.length) {
    return `${tuilesHtml}<div class="carte vide-stats"><h3 class="titre-2">Pas encore de livre terminé en ${annee}.</h3>
      <p class="petit">Dès que tu termines un livre, ton bilan prend forme ici.</p><a class="btn btn-principal" href="ajouter.html">Ajouter une lecture</a></div>`;
  }

  // Graphique : livres terminés par mois (chaque barre ouvre le bilan du mois)
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
        const cle = cleMois(annee, i + 1);
        const barre = n > 0
          ? `<rect class="barre" x="${x}" y="${y(n)}" width="${w}" height="${(n / max) * hu}" rx="4"/><text class="valeur-barre" x="${x + w / 2}" y="${y(n) - 6}" text-anchor="middle">${n}</text>`
          : `<rect class="barre-vide" x="${x}" y="${haut + hu - 3}" width="${w}" height="3" rx="1.5"/>`;
        const etiquette = `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${MOIS_COURTS[i]}</text>`;
        return cle <= moisCourant && cle >= premierMois
          ? `<a href="?vue=mois&amp;mois=${cle}" data-ouvrir-mois="${cle}" class="lien-mois" aria-label="Voir le bilan ${de(MOIS[i])}"><rect class="zone" x="${g + i * lm}" y="${haut}" width="${lm}" height="${H - haut}"/>${barre}${etiquette}</a>`
          : barre + etiquette;
      })
      .join('')}
  </svg>`;

  const phrases = profil(b.lus, annee, b.parMois);
  const genres = Object.entries(b.lus.filter((x) => x.genre).reduce((o, x) => ((o[x.genre] = (o[x.genre] ?? 0) + 1), o), {})).sort((p, q) => q[1] - p[1]);
  const auteurs = Object.entries(b.lus.reduce((o, x) => ((o[x.auteur] = (o[x.auteur] ?? 0) + 1), o), {})).sort((p, q) => q[1] - p[1]).filter(([, n]) => n >= 2).slice(0, 3);
  const formats = Object.entries(b.lus.filter((x) => x.format).reduce((o, x) => ((o[FORMATS[x.format]] = (o[FORMATS[x.format]] ?? 0) + 1), o), {})).sort((p, q) => q[1] - p[1]);

  return `${tuilesHtml}
    <div class="duo">
      <section class="carte" aria-labelledby="t-graph"><h3 class="titre-2" id="t-graph">Livres terminés par mois</h3>
        <p class="petit">Clique sur un mois pour voir son bilan.</p><div class="defile">${graphique}</div></section>
      <section class="carte" aria-labelledby="t-notes"><h3 class="titre-2" id="t-notes">Tes notes moyennes</h3><div class="moyennes">
        ${CRITERES.map((c) => {
          const v = b.moyennes[c.cle];
          return `<div class="moy"><div class="moy-haut"><span class="etiquette">${c.libelle}</span><span class="num">${v != null ? `${decimal(v)} / 5` : '–'}</span></div>
            <div class="barre-moy"><i style="width:${((v ?? 0) / 5) * 100}%"></i></div></div>`;
        }).join('')}
        <p class="petit">Calculé sur ${pluriel(b.nbNotes, 'livre noté', 'livres notés')} en ${annee}.</p>
      </div></section>
    </div>

    <section class="carte profil" aria-labelledby="t-profil">
      <h3 class="titre-2" id="t-profil">Ton profil de lecteur</h3>
      <div class="profil-grille">
        <ul class="analyse">${(phrases.length ? phrases : ['Termine et note quelques livres de plus pour découvrir ton profil.']).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        <div class="profil-barres">
          ${barres('Genres', genres, b.lus.length)}
          ${auteurs.length ? barres('Auteurs les plus lus', auteurs, b.lus.length) : ''}
          ${barres('Formats', formats, b.lus.length)}
        </div>
      </div>
    </section>

    <section class="carte" aria-labelledby="t-coeur"><h3 class="titre-2" id="t-coeur">Tes coups de cœur de l’année</h3>
      <ol class="podium">${b.coupsDeCoeur
        .map(
          (x, i) => `<li><span class="rang">${i + 1}</span>${couverture(sourceCouverture(x), x.couleur, x.titre, 'S')}
            <a href="lecture.html?id=${encodeURIComponent(x.id)}" class="podium-texte"><span class="titre-livre">${titreHtml(x)}</span>
            <span class="petit">${esc(x.auteur)} · fini le ${dateFr(x.fin)}</span></a>${etoiles(x.note_generale, 'Note générale')}</li>`,
        )
        .join('')}</ol>
    </section>

    <section class="faits" aria-label="En bref">
      ${b.plusLong ? `<div class="fait"><span class="etiquette">Le plus long</span><a href="lecture.html?id=${encodeURIComponent(b.plusLong.id)}">${titreHtml(b.plusLong)}</a><span class="petit">${nombre(b.plusLong.pages)} pages</span></div>` : ''}
      ${b.plusRapide ? `<div class="fait"><span class="etiquette">Lu le plus vite</span><a href="lecture.html?id=${encodeURIComponent(b.plusRapide.l.id)}">${titreHtml(b.plusRapide.l)}</a><span class="petit">en ${pluriel(b.plusRapide.d, 'jour')}</span></div>` : ''}
      <div class="fait"><span class="etiquette">Relectures</span><span class="gros num">${nombre(b.relus)}</span><span class="petit">${b.relus > 1 ? 'livres relus' : 'livre relu'} en ${annee}</span></div>
      <div class="fait"><span class="etiquette">Abandonnés</span><span class="gros num">${nombre(b.abandonnes)}</span><span class="petit">et c’est très bien ainsi</span></div>
    </section>`;
}
