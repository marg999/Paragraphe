// =============================================================================
//  Paragraphe · code commun à toutes les pages
//  (connexion à Supabase, en-tête, outils de mise en forme, recherche de livres, bilans)
// =============================================================================
import { createClient } from './supabase.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { LOGO_VIEWBOX, LOGO_SYMBOLE, LOGO_MOT, SYMBOLE_VIEWBOX, SYMBOLE } from './marque.js';

// ---------------------------------------------------------------- Supabase
export const configOk = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('xxxx') && !SUPABASE_ANON_KEY.includes('colle-ici'),
);
export const sb = configOk
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

// ---------------------------------------------------------------- Constantes
export const STATUTS = { 'a-lire': 'À lire', 'en-cours': 'En cours', lu: 'Lu', abandonne: 'Abandonné' };
export const COULEURS = ['caput', 'slate', 'coffee', 'nuit', 'tan'];
export const CRITERES = [
  { cle: 'note_generale', libelle: 'Note générale', aide: 'Ton ressenti face au livre' },
  { cle: 'note_rythme', libelle: 'Rythme' },
  { cle: 'note_emotion', libelle: 'Émotion' },
  { cle: 'note_personnages', libelle: 'Personnages' },
];
export const GENRES = [
  { nom: 'Classiques', sujet: 'classic_literature', mots: ['classic', 'classique'] },
  { nom: 'Romans', sujet: 'fiction', mots: ['novel', 'roman', 'fiction'] },
  { nom: 'Policier', sujet: 'detective_and_mystery_stories', mots: ['detective', 'mystery', 'crime', 'policier', 'thriller'] },
  { nom: 'Science-fiction', sujet: 'science_fiction', mots: ['science fiction', 'science-fiction', 'dystopia'] },
  { nom: 'Fantasy', sujet: 'fantasy', mots: ['fantasy', 'fantastique', 'magic'] },
  { nom: 'Aventure', sujet: 'adventure_stories', mots: ['adventure', 'aventure'] },
  { nom: 'Histoire', sujet: 'history', mots: ['history', 'histoire', 'historical'] },
  { nom: 'Poésie', sujet: 'poetry', mots: ['poetry', 'poésie', 'poems'] },
  { nom: 'Théâtre', sujet: 'drama', mots: ['drama', 'théâtre', 'plays'] },
  { nom: 'Essais', sujet: 'philosophy', mots: ['essay', 'essai', 'philosophy', 'philosophie'] },
  { nom: 'Biographie', sujet: 'biography', mots: ['biography', 'biographie', 'autobiography', 'memoir'] },
  { nom: 'Bande dessinée', sujet: 'comic_books_strips_etc', mots: ['comic', 'bande dessinée', 'graphic novel', 'manga'] },
  { nom: 'Jeunesse', sujet: 'juvenile_fiction', mots: ['juvenile', 'children', 'jeunesse'] },
];
export const NOMS_GENRES = GENRES.map((g) => g.nom);
export const FORMATS = { papier: 'Papier', numerique: 'Numérique', audio: 'Audio' };

/** Titre prêt à afficher : marqué dans sa langue s'il n'est pas en français, pour que les lecteurs d'écran le prononcent bien. */
export const titreHtml = (l) => {
  const langue = l?.langue;
  return langue && langue !== 'fr' && /^[a-z]{2}$/.test(langue) ? `<span lang="${langue}">${esc(l.titre)}</span>` : esc(l?.titre);
};

// ---------------------------------------------------------------- Mise en forme
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Échappe le texte avant de l'insérer dans la page (protège contre l'injection de code). */
export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const nombre = (n) => Number(n).toLocaleString('fr-FR');
export const decimal = (n) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const pluriel = (n, mot, motPluriel = mot + 's') => `${nombre(n)} ${n > 1 ? motPluriel : mot}`;
export function dateFr(iso) {
  if (!iso) return '';
  const [a, m, j] = String(iso).slice(0, 10).split('-').map(Number);
  return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`;
}
/** Jours de lecture, début et fin compris (du 1er au 14 mars = 14 jours). */
export function jours(debut, fin) {
  if (!debut || !fin) return null;
  const d = (Date.parse(fin) - Date.parse(debut)) / 864e5;
  return d < 0 || Number.isNaN(d) ? null : Math.round(d) + 1;
}
export const aujourdhui = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const normaliser = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sansAccents = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Met en valeur la partie qui correspond à la recherche, comme dans la charte. */
export function surligner(texte, q) {
  const cible = sansAccents(q.trim());
  const i = sansAccents(texte).indexOf(cible);
  if (i < 0 || !cible) return esc(texte);
  const n = cible.length;
  return esc(texte.slice(0, i)) + '<mark>' + esc(texte.slice(i, i + n)) + '</mark>' + esc(texte.slice(i + n));
}
export const parametre = (nom) => new URLSearchParams(location.search).get(nom);

// ---------------------------------------------------------------- Éléments visuels
const ICONES = {
  recherche: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  lune: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  retour: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  crayon: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
  corbeille: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  relire: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  sortie: '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
  utilisateur: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  telecharger: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
};
export const icone = (nom, taille = 20) =>
  `<svg width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nom]}</svg>`;

export function logo(hauteur = 30) {
  const [, , l, h] = LOGO_VIEWBOX.split(' ').map(Number);
  return `<svg class="logo" viewBox="${LOGO_VIEWBOX}" height="${hauteur}" width="${Math.round((hauteur * l) / h)}" role="img" aria-label="Paragraphe"><path fill="var(--logo-symbole)" fill-rule="evenodd" d="${LOGO_SYMBOLE}"/><path fill="var(--logo-mot)" fill-rule="evenodd" d="${LOGO_MOT}"/></svg>`;
}
export const symbole = (classe = '') =>
  `<svg class="${classe}" viewBox="${SYMBOLE_VIEWBOX}" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${SYMBOLE}"/></svg>`;

/**
 * Adresse de la couverture :
 * - un nombre = couverture Open Library ;
 * - « gb:ID » = livre Google Books ;
 * - autre chose (ou rien) = pas de couverture, on affiche la couverture aux couleurs de Paragraphe.
 */
export function urlCouverture(id, taille = 'M') {
  if (typeof id === 'string' && (id.startsWith('bnf:') || id.startsWith('wd:'))) {
    const isbn = id.split('|')[1];
    return isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${taille}.jpg?default=false` : null;
  }
  if (typeof id === 'string' && id.startsWith('gb:')) {
    const zoom = taille === 'L' ? 2 : 1;
    return `https://books.google.com/books/content?id=${encodeURIComponent(id.slice(3))}&printsec=frontcover&img=1&zoom=${zoom}`;
  }
  const n = Number(id);
  return id && Number.isFinite(n) && n > 0 ? `https://covers.openlibrary.org/b/id/${n}-${taille}.jpg` : null;
}
/** Couverture d'un livre enregistré : Open Library si on a son numéro, sinon Google Books si le livre en vient. */
export const sourceCouverture = (l) => l?.couverture_id ?? l?.couvertureId ?? l?.ol_key ?? l?.olKey ?? null;
/** Lien vers la fiche du livre sur sa source. */
export function lienSource(cle) {
  if (!cle) return null;
  if (cle.startsWith('gb:')) return { url: `https://books.google.com/books?id=${encodeURIComponent(cle.slice(3))}`, nom: 'Google Books' };
  if (cle.startsWith('/works/')) return { url: `https://openlibrary.org${cle}`, nom: 'Open Library' };
  if (cle.startsWith('wd:')) {
    const q = cle.slice(3).split('|')[0];
    if (/^Q\d+$/.test(q)) return { url: `https://www.wikidata.org/wiki/${q}`, nom: 'Wikidata' };
  }
  if (cle.startsWith('bnf:')) {
    const ark = cle.slice(4).split('|')[0];
    if (/^[a-z0-9]+$/i.test(ark)) return { url: `https://catalogue.bnf.fr/ark:/12148/${ark}`, nom: 'le catalogue de la BnF' };
  }
  return null;
}
export function couverture(id, couleur = 'caput', titre = '', taille = 'M') {
  const c = COULEURS.includes(couleur) ? couleur : 'caput';
  const src = urlCouverture(id, taille);
  const img = src
    ? `<img src="${src}" alt="${titre ? `Couverture de ${esc(titre)}` : ''}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()" onload="if(this.naturalWidth<10)this.remove()">`
    : '';
  return `<div class="couv c-${c}"><span class="dos" aria-hidden="true"></span>${symbole('couv-symb')}${img}</div>`;
}
const ETOILE = 'M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z';
export function etoiles(note, libelle = 'Note', taille = 15) {
  if (note == null) return '';
  return `<span class="etoiles" role="img" aria-label="${esc(libelle)} : ${note} sur 5" style="--t:${taille}px">${[1, 2, 3, 4, 5]
    .map((i) => `<svg viewBox="0 0 24 24" class="${i <= note ? 'e-pleine' : 'e-vide'}" aria-hidden="true"><path d="${ETOILE}"/></svg>`)
    .join('')}</span>`;
}
export const pastille = (statut) => `<span class="pastille st-${statut}">${STATUTS[statut] ?? ''}</span>`;

// ---------------------------------------------------------------- Messages
const CLE_MESSAGE = 'paragraphe-message';
/** Change de page en affichant un message de confirmation à l'arrivée. */
export function aller(url, message) {
  if (message) {
    try {
      sessionStorage.setItem(CLE_MESSAGE, message);
    } catch {}
  }
  location.href = url;
}
export function toast(message) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = message;
  document.body.append(t);
  setTimeout(() => t.remove(), 4200);
}
export function messageAuth(erreur) {
  if (!erreur) return '';
  const messages = {
    invalid_credentials: 'Adresse e-mail ou mot de passe incorrect.',
    email_not_confirmed: 'Confirme d’abord ton adresse e-mail grâce au lien reçu par mail.',
    user_already_exists: 'Un carnet existe déjà avec cette adresse. Connecte-toi plutôt.',
    email_exists: 'Un carnet existe déjà avec cette adresse. Connecte-toi plutôt.',
    weak_password: 'Ce mot de passe est trop simple. Choisis-en un d’au moins 8 caractères, avec des lettres et des chiffres.',
    over_email_send_rate_limit: 'Trop d’e-mails envoyés pour le moment. Réessaie dans quelques minutes.',
    over_request_rate_limit: 'Trop de tentatives. Patiente quelques minutes avant de réessayer.',
    same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
    email_address_invalid: 'Cette adresse e-mail n’est pas valide.',
    signup_disabled: 'Les inscriptions sont fermées pour le moment.',
  };
  return messages[erreur.code] ?? 'Une erreur est survenue. Réessaie dans un instant.';
}
/** N'accepte que les retours vers une page du site (évite les redirections vers un autre site). */
export const pageSure = (suite, defaut = 'index.html') =>
  suite && /^[a-z0-9-]+\.html(\?[a-zA-Z0-9=&%_.-]*)?$/.test(suite) ? suite : defaut;

// ---------------------------------------------------------------- Thème
export const theme = () => (document.documentElement.dataset.theme === 'jour' ? 'jour' : 'soir');
function choisirTheme(t) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem('paragraphe-theme', t);
  } catch {}
  document.querySelectorAll('[data-theme-choix]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoix === t)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'jour' ? '#EDE4D3' : '#1C283D');
}

// ---------------------------------------------------------------- Mise en place d'une page
/**
 * Prépare la page : en-tête, pied de page, session.
 * - prive : réservée aux personnes connectées (sinon, renvoi vers la connexion)
 * - invite : réservée aux personnes non connectées (sinon, renvoi vers la bibliothèque)
 * Renvoie la personne connectée, ou null.
 */
export async function demarrer({ prive = false, invite = false, actif = '' } = {}) {
  const main = document.getElementById('contenu');
  if (!configOk) {
    entete(null, actif);
    main.innerHTML = `<div class="conteneur etroit page"><h1 class="titre-1">Il manque la connexion à Supabase</h1>
      <p class="lisible">Ouvre le fichier <code>config.js</code> à la racine du site et renseigne l’adresse de ton projet Supabase et sa clé publique.
      Tout est expliqué dans <code>GUIDE-MISE-EN-LIGNE.md</code>.</p></div>`;
    return new Promise(() => {}); // la page s'arrête ici
  }
  const {
    data: { session },
  } = await sb.auth.getSession();
  const user = session?.user ?? null;
  if (prive && !user) {
    location.replace(`connexion.html?suite=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}`);
    return new Promise(() => {});
  }
  if (invite && user) {
    location.replace('index.html');
    return new Promise(() => {});
  }
  entete(user, actif);
  try {
    const m = sessionStorage.getItem(CLE_MESSAGE);
    if (m) {
      sessionStorage.removeItem(CLE_MESSAGE);
      toast(m);
    }
  } catch {}
  // Déconnexion depuis un autre onglet : on revient à l'accueil.
  sb.auth.onAuthStateChange((evenement) => {
    if (evenement === 'SIGNED_OUT' && prive && !sortieEnCours) location.replace('index.html');
  });
  return user;
}

let sortieEnCours = false;
/** Déconnexion volontaire, puis direction la page indiquée. */
export async function sortir(destination) {
  sortieEnCours = true;
  await sb.auth.signOut();
  location.replace(destination);
}

export const prenomDe = (user) => user?.user_metadata?.prenom || user?.email?.split('@')[0] || '';

function entete(user, actif) {
  const t = theme();
  const liens = [
    ['index.html', 'Ma bibliothèque', 'bibliotheque'],
    ['ajouter.html', 'Ajouter une lecture', 'ajouter'],
    ['statistiques.html', 'Mes bilans', 'statistiques'],
  ];
  const nav = user
    ? `<nav aria-label="Navigation principale">${liens
        .map(([href, lib, cle]) => `<a href="${href}"${actif === cle ? ' aria-current="page"' : ''}>${lib}</a>`)
        .join('')}</nav>`
    : '';
  const droite = user
    ? `<a class="compte" href="compte.html"${actif === 'compte' ? ' aria-current="page"' : ''} title="Mon compte">${icone('utilisateur', 18)}<span>${esc(prenomDe(user))}</span></a>`
    : actif === 'connexion'
      ? ''
      : '<a class="btn btn-secondaire btn-petit" href="connexion.html">Se connecter</a>';
  document.getElementById('entete').innerHTML = `
    <div class="conteneur barre">
      <a class="lien-logo" href="index.html" aria-label="Paragraphe, accueil">${logo(30)}</a>
      ${nav}
      <div class="outils">
        <div class="theme" role="group" aria-label="Thème">
          <button type="button" data-theme-choix="soir" aria-pressed="${t === 'soir'}">${icone('lune', 15)}Soir</button>
          <button type="button" data-theme-choix="jour" aria-pressed="${t === 'jour'}">${icone('soleil', 15)}Jour</button>
        </div>
        ${droite}
      </div>
    </div>`;
  document.querySelectorAll('[data-theme-choix]').forEach((b) => b.addEventListener('click', () => choisirTheme(b.dataset.themeChoix)));
  document.getElementById('pied').innerHTML = `
    <div class="conteneur pied-contenu">
      ${logo(18)}
      <span>Ton carnet de lecture privé : note, commente, retrouve chaque livre lu.</span>
      <span>Recherche de livres grâce à <a href="https://openlibrary.org" rel="noopener">Open Library</a>, <a href="https://books.google.com" rel="noopener">Google Books</a>, la <a href="https://catalogue.bnf.fr" rel="noopener">BnF</a> et <a href="https://www.wikidata.org" rel="noopener">Wikidata</a> · <a href="confidentialite.html">Confidentialité</a> · <a href="accessibilite.html">Accessibilité : partiellement conforme</a></span>
    </div>`;
}

// ---------------------------------------------------------------- Open Library
const CHAMPS_OL =
  'key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject,language,editions,editions.title,editions.cover_i,editions.number_of_pages,editions.language';
const LANGUES = { fre: 'fr', eng: 'en', ger: 'de', spa: 'es', ita: 'it', por: 'pt', dut: 'nl', rus: 'ru', jpn: 'ja', lat: 'la', gre: 'el', chi: 'zh' };

/**
 * Devine le genre d'un livre à partir des sujets fournis par la source.
 * On compte les indices plutôt que de prendre le premier mot trouvé :
 * un roman adapté au théâtre reste un roman, et un roman d'avant 1930 est rangé dans les classiques.
 */
export function devinerGenre(sujets, annee) {
  const s = (sujets ?? []).slice(0, 60).map((x) => String(x).toLowerCase());
  if (!s.length) return null;
  const n = (...mots) => s.filter((x) => mots.some((m) => x.includes(m))).length;
  const seuil = Math.min(2, s.length);
  const fiction = n('fiction', 'novel', 'roman', 'love stories', 'short stories', 'nouvelles');
  const specifiques = [
    ['Bande dessinée', n('comic', 'bande dessinée', 'bandes dessinées', 'graphic novel', 'manga', 'roman graphique') * 2],
    ['Jeunesse', n('juvenile', 'children', 'jeunesse', 'young adult', 'livres pour enfants')],
    ['Policier', n('detective', 'mystery', 'crime', 'policier', 'policiers', 'thriller', 'murder', 'suspense', 'enquêtes')],
    ['Science-fiction', n('science fiction', 'science-fiction', 'dystopia', 'space opera')],
    ['Fantasy', n('fantasy', 'fantastique', 'magic', 'dragons')],
  ].sort((a, b) => b[1] - a[1]);
  if (specifiques[0][1] >= seuil) return specifiques[0][0];
  const classique = n('classic', 'classique');
  if (classique || (fiction && annee && annee < 1930)) return 'Classiques';
  if (fiction) return n('adventure', 'aventure', 'sea stories') >= seuil ? 'Aventure' : 'Romans';
  const autres = [
    ['Biographie', n('biography', 'biographie', 'biographies', 'autobiography', 'memoir', 'mémoires', 'autobiographie')],
    ['Poésie', n('poetry', 'poésie', 'poems', 'poèmes')],
    ['Théâtre', n('drama', 'théâtre', 'plays', 'tragedies', 'comedies')],
    ['Histoire', n('history', 'histoire')],
    ['Essais', n('essay', 'essai', 'philosophy', 'philosophie', 'social science', 'psychology')],
    ['Aventure', n('adventure', 'aventure')],
  ].sort((a, b) => b[1] - a[1]);
  return autres[0][1] > 0 ? autres[0][0] : null;
}

const accents = (t) => (String(t ?? '').match(/[À-ÿŒœ]/g) || []).length;
/** Entre deux écritures du même titre, garde celle qui a ses accents (« préjugés » plutôt que « prejuges »). */
export function meilleurTitre(a, b) {
  if (!a) return b;
  if (!b) return a;
  return normaliser(a) === normaliser(b) && accents(b) > accents(a) ? b : a;
}

function versLivre(d) {
  const ed = d.editions?.docs?.[0];
  const titre = meilleurTitre(ed?.title || d.title, d.title);
  if (!titre || !d.key) return null;
  const code = ed?.language?.[0] ?? (d.language?.includes('fre') ? 'fre' : d.language?.[0]);
  return {
    olKey: d.key,
    titre: titre.slice(0, 300),
    auteur: (d.author_name?.slice(0, 2).join(', ') || 'Auteur inconnu').slice(0, 300),
    annee: d.first_publish_year ?? null,
    pages: ed?.number_of_pages || d.number_of_pages_median || null,
    couvertureId: ed?.cover_i || d.cover_i || null,
    genre: devinerGenre(d.subject, d.first_publish_year),
    langue: LANGUES[code] ?? null,
    source: 'Open Library',
  };
}
async function interroger(params, signal) {
  const url = `https://openlibrary.org/search.json?${new URLSearchParams({ ...params, fields: CHAMPS_OL, lang: 'fr' })}`;
  const rep = await fetch(url, { signal: signal ?? AbortSignal.timeout(8000) });
  if (!rep.ok) throw new Error(`Open Library a répondu ${rep.status}`);
  const json = await rep.json();
  return (json.docs ?? []).map(versLivre).filter(Boolean);
}

// ---------------------------------------------------------------- Google Books
async function rechercherGoogle(texte, signal, extra = {}) {
  const params = new URLSearchParams({
    q: texte,
    maxResults: '12',
    printType: 'books',
    fields: 'items(id,volumeInfo(title,subtitle,authors,publishedDate,pageCount,categories,language,imageLinks/thumbnail))',
    ...extra,
  });
  const rep = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, { signal: signal ?? AbortSignal.timeout(8000) });
  if (!rep.ok) throw new Error(`Google Books a répondu ${rep.status}`);
  const json = await rep.json();
  return (json.items ?? [])
    .map((it) => {
      const v = it.volumeInfo ?? {};
      if (!v.title || !it.id) return null;
      const annee = Number.parseInt(String(v.publishedDate ?? '').slice(0, 4), 10);
      return {
        olKey: `gb:${it.id}`,
        titre: (v.subtitle && v.title.length + v.subtitle.length < 90 ? `${v.title} : ${v.subtitle}` : v.title).slice(0, 300),
        auteur: (v.authors?.slice(0, 2).join(', ') || 'Auteur inconnu').slice(0, 300),
        annee: Number.isFinite(annee) ? annee : null,
        pages: v.pageCount > 0 ? v.pageCount : null,
        couvertureId: null,
        aCouverture: Boolean(v.imageLinks?.thumbnail),
        genre: devinerGenre(v.categories, null),
        langue: /^[a-z]{2}$/.test(v.language ?? '') ? v.language : null,
        source: 'Google Books',
      };
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------- BnF (via la fonction Supabase « recherche-livres »)
let bnfAbsente = false;
/**
 * Le catalogue de la BnF n'accepte pas les appels directs depuis un navigateur :
 * on passe par une petite fonction installée dans Supabase (voir le guide).
 * Si elle n'est pas installée, on l'ignore sans bloquer la recherche.
 */
async function rechercherBnf(texte, page = 0) {
  if (bnfAbsente || !sb) return [];
  const delai = new Promise((_, refuse) => setTimeout(() => refuse(new Error('La BnF met trop de temps à répondre')), 10000));
  const { data, error } = await Promise.race([sb.functions.invoke('recherche-livres', { body: { q: texte, page } }), delai]);
  if (error) {
    if (error.context?.status === 404) bnfAbsente = true;
    throw error;
  }
  return (Array.isArray(data) ? data : [])
    .filter((d) => d && d.titre)
    .map((d) => ({
      olKey: `bnf:${d.ark ?? ''}${d.isbn ? `|${d.isbn}` : ''}`.slice(0, 80),
      titre: String(d.titre).slice(0, 300),
      auteur: String(d.auteur || 'Auteur inconnu').slice(0, 300),
      annee: Number.isFinite(d.annee) ? d.annee : null,
      pages: Number.isFinite(d.pages) ? d.pages : null,
      couvertureId: null,
      aCouverture: false,
      genre: devinerGenre(d.sujets, null),
      langue: /^[a-z]{2}$/.test(d.langue ?? '') ? d.langue : null,
      source: 'BnF',
    }));
}

// ---------------------------------------------------------------- Wikidata
const WD = 'https://www.wikidata.org/w/api.php';
// On garde les fiches qui décrivent un livre, et on écarte films, séries, personnages…
const WD_LIVRE = /(roman|livre|album|bande dessinée|bd\b|manga|essai|recueil|nouvelle|pièce|poème|poésie|conte|œuvre littéraire|ouvrage|biographie|autobiographie|novel|book|comic|graphic)/i;
const WD_EXCLU = /(film|téléfilm|série télévisée|série d'animation|jeu vidéo|personnage|chanson|épisode|groupe de|commune|famille|maison d'édition|éditeur|magazine|revue|périodique|dessin animé|émission|spectacle|comédie musicale)/i;
// « série de bande dessinée », « saga… » : c'est la série entière, pas un livre.
const WD_SERIE = /^(série|saga|cycle|trilogie|franchise|univers)\b/i;
async function wdApi(params, signal) {
  const rep = await fetch(`${WD}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`, { signal: signal ?? AbortSignal.timeout(8000) });
  if (!rep.ok) throw new Error(`Wikidata a répondu ${rep.status}`);
  return rep.json();
}
const wdValeurs = (entite, prop) => (entite?.claims?.[prop] ?? []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);
async function rechercherWikidata(texte, signal, page = 0) {
  const recherche = await wdApi(
    { action: 'wbsearchentities', search: texte, language: 'fr', uselang: 'fr', type: 'item', limit: '30', continue: String(page * 30) },
    signal,
  );
  const candidats = (recherche.search ?? [])
    .filter((r) => {
      const d = r.description ?? '';
      return WD_LIVRE.test(d) && !WD_EXCLU.test(d) && !WD_SERIE.test(d.trim());
    })
    .slice(0, 20);
  if (!candidats.length) return [];
  const { entities = {} } = await wdApi({ action: 'wbgetentities', ids: candidats.map((c) => c.id).join('|'), props: 'claims|labels', languages: 'fr|en' }, signal);
  const idsAuteurs = [...new Set(Object.values(entities).flatMap((e) => [...wdValeurs(e, 'P50'), ...wdValeurs(e, 'P170'), ...wdValeurs(e, 'P110')].map((v) => v.id)))].slice(0, 50);
  const noms = idsAuteurs.length
    ? (await wdApi({ action: 'wbgetentities', ids: idsAuteurs.join('|'), props: 'labels', languages: 'fr|en' }, signal)).entities ?? {}
    : {};
  const nom = (id) => noms[id]?.labels?.fr?.value ?? noms[id]?.labels?.en?.value ?? null;
  return candidats
    .map((c) => {
      const e = entities[c.id];
      if (!e) return null;
      const titre = e.labels?.fr?.value ?? c.label ?? e.labels?.en?.value;
      if (!titre) return null;
      const auteurs = [...wdValeurs(e, 'P50'), ...wdValeurs(e, 'P170'), ...wdValeurs(e, 'P110')].map((v) => nom(v.id)).filter(Boolean);
      const annee = Number(String(wdValeurs(e, 'P577')[0]?.time ?? '').match(/^\+?(\d{4})/)?.[1]) || null;
      const isbn = String(wdValeurs(e, 'P212')[0] ?? wdValeurs(e, 'P957')[0] ?? '').replace(/[^\dX]/gi, '') || null;
      const pages = Number(String(wdValeurs(e, 'P1104')[0]?.amount ?? '').replace('+', '')) || null;
      return {
        olKey: `wd:${c.id}${isbn ? `|${isbn}` : ''}`,
        titre: titre.slice(0, 300),
        auteur: ([...new Set(auteurs)].slice(0, 2).join(', ') || 'Auteur inconnu').slice(0, 300),
        annee,
        pages,
        couvertureId: null,
        aCouverture: false,
        genre: devinerGenre([c.description ?? ''], annee),
        langue: e.labels?.fr ? 'fr' : null,
        source: 'Wikidata',
      };
    })
    .filter(Boolean);
}

/** Clé servant à repérer un même livre, quelle que soit sa source. */
export const empreinte = (l) =>
  `${normaliser(l.titre).replace(/^(le|la|les|l|un|une|the) /, '').slice(0, 40)}|${normaliser(l.auteur).split(' ').pop()}`;
const sansCouverture = (r) => !r.couvertureId && !r.aCouverture;

/** Fusionne plusieurs listes (une de chaque à tour de rôle), retire les doublons et complète les informations. */
function fusionner(listes, max) {
  const resultat = [];
  const index = new Map();
  const longueur = Math.max(0, ...listes.map((l) => l.length));
  for (let i = 0; i < longueur; i++) {
    for (const liste of listes) {
      const livre = liste[i];
      if (!livre) continue;
      const cle = empreinte(livre);
      if (!index.has(cle)) {
        index.set(cle, resultat.length);
        resultat.push({ ...livre });
        continue;
      }
      const j = index.get(cle);
      const deja = resultat[j];
      const base = sansCouverture(deja) && !sansCouverture(livre) ? { ...livre } : deja;
      const autre = base === deja ? livre : deja;
      base.titre = meilleurTitre(base.titre, autre.titre);
      base.auteur = meilleurTitre(base.auteur, autre.auteur);
      base.pages ??= autre.pages;
      base.annee = Math.min(base.annee ?? Infinity, autre.annee ?? Infinity);
      if (base.annee === Infinity) base.annee = null;
      // Open Library connaît la date de première parution : son genre est plus fiable (ex. « Classiques »).
      base.genre = [base, autre].find((x) => x.source === 'Open Library' && x.genre)?.genre ?? base.genre ?? autre.genre;
      base.langue ??= autre.langue;
      resultat[j] = base;
    }
  }
  return resultat.slice(0, max);
}

/**
 * Recherche par titre ou auteur dans Open Library, Google Books, le catalogue de la BnF et Wikidata, en même temps.
 * La recherche n’échoue que si les deux sources sont injoignables.
 */
const PAR_PAGE = 20;
export async function rechercherLivres(texte, signal, page = 0) {
  const sources = await Promise.allSettled([
    interroger({ q: texte, limit: String(PAR_PAGE), offset: String(page * PAR_PAGE) }, signal),
    rechercherGoogle(texte, signal, { maxResults: String(PAR_PAGE), startIndex: String(page * PAR_PAGE) }),
    rechercherBnf(texte, page),
    rechercherWikidata(texte, signal, page),
  ]);
  if (sources.every((x) => x.status === 'rejected')) throw sources[0].reason;
  const listes = sources.map((x) => (x.status === 'fulfilled' ? x.value : []));
  return {
    livres: fusionner(listes, PAR_PAGE * 3),
    // S'il reste des résultats dans au moins une source, on propose « Voir plus ».
    encore: listes[0].length >= PAR_PAGE || listes[1].length >= PAR_PAGE || listes[2].length >= 15 || listes[3].length >= 10,
  };
}

// ---------------------------------------------------------------- Recommandations
/** Ce qu'il ne faut pas proposer : les livres déjà dans la bibliothèque et ceux écartés avec « Pas pour moi ». */
export function exclusions(livres, ecartees = []) {
  return {
    cles: new Set([...livres.map((l) => l.ol_key).filter(Boolean), ...ecartees]),
    empreintes: new Set(livres.map(empreinte)),
  };
}
const autorise = (ex) => (l) => !ex.cles.has(l.olKey) && !ex.empreintes.has(empreinte(l));
const avecCouvertureDabord = (liste) => [...liste.filter((l) => !sansCouverture(l)), ...liste.filter(sansCouverture)];
const decalage = (graine, max) => [...String(graine ?? '')].reduce((s, c) => s + c.charCodeAt(0), 0) % max;

/** Autres livres d'un auteur (Open Library + Google Books). */
export async function livresDeAuteur(auteur, ex, max = 4) {
  const nom = String(auteur ?? '').split(',')[0].trim();
  if (!nom || nom === 'Auteur inconnu') return [];
  const famille = normaliser(nom).split(' ').pop();
  const [ol, gb] = await Promise.allSettled([
    interroger({ author: nom, limit: '25' }),
    rechercherGoogle(`inauthor:"${nom}"`, undefined, { maxResults: '20' }),
  ]);
  if (ol.status === 'rejected' && gb.status === 'rejected') throw ol.reason;
  const liste = fusionner([ol.status === 'fulfilled' ? ol.value : [], gb.status === 'fulfilled' ? gb.value : []], 40)
    .filter((l) => normaliser(l.auteur).split(' ').includes(famille))
    .filter(autorise(ex));
  return avecCouvertureDabord(liste).slice(0, max);
}

/** Livres d'un genre, de préférence avec une édition française. La graine fait varier la sélection d'un livre à l'autre. */
export async function livresDuGenre(genre, ex, max = 4, graine = '') {
  const sujet = GENRES.find((g) => g.nom === genre)?.sujet ?? 'classic_literature';
  const offset = String(decalage(graine, 20));
  for (const q of [`subject_key:${sujet} language:fre`, `subject_key:${sujet}`]) {
    const liste = (await interroger({ q, limit: '40', offset })).filter(autorise(ex));
    if (liste.length) return avecCouvertureDabord(liste).slice(0, max).map((l) => ({ ...l, genre: l.genre ?? genre }));
  }
  return [];
}

/** Recommandation de l'accueil : d'abord un auteur que tu as aimé, sinon ton genre préféré. */
export async function recommanderAccueil(livres, ecartees) {
  const ex = exclusions(livres, ecartees);
  const lus = livres.filter((l) => l.statut === 'lu');
  const aimes = [...lus].filter((l) => (l.note_generale ?? 0) >= 4).sort((a, b) => score(b) - score(a)).slice(0, 6);
  if (aimes.length) {
    const modele = aimes[Math.floor(Math.random() * aimes.length)];
    try {
      const [livre] = await livresDeAuteur(modele.auteur, ex, 1);
      if (livre) return { livre, raison: `Parce que tu as aimé « ${modele.titre} »` };
    } catch {}
  }
  const genre = genrePrefere(lus)?.nom ?? null;
  const [livre] = await livresDuGenre(genre ?? 'Classiques', ex, 1, Date.now() % 97);
  return livre ? { livre, raison: raisonRecommandation(lus, genre !== null) } : null;
}

// ---------------------------------------------------------------- Bilans
export const lusEn = (livres, annee) => livres.filter((l) => l.statut === 'lu' && l.fin && Number(l.fin.slice(0, 4)) === annee);
export function moyennes(livres) {
  const r = {};
  for (const { cle } of CRITERES) {
    const v = livres.map((l) => l[cle]).filter((n) => typeof n === 'number');
    r[cle] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }
  return r;
}
export function genrePrefere(livres) {
  const g = new Map();
  for (const l of livres) {
    if (!l.genre) continue;
    const e = g.get(l.genre) ?? { n: 0, somme: 0, notes: 0 };
    e.n++;
    if (l.note_generale) {
      e.somme += l.note_generale;
      e.notes++;
    }
    g.set(l.genre, e);
  }
  const top = [...g.entries()].sort((a, b) => b[1].n - a[1].n || b[1].somme - a[1].somme)[0];
  return top ? { nom: top[0], n: top[1].n, moyenne: top[1].notes ? top[1].somme / top[1].notes : null } : null;
}
export function raisonRecommandation(livres, memeGenre) {
  const aimes = livres.filter((l) => (l.note_generale ?? 0) >= 4);
  if (!aimes.length) return 'Un grand classique pour commencer';
  if (!memeGenre) return 'Pour varier tes lectures';
  const m = moyennes(aimes);
  return [
    ['note_rythme', 'Parce que tu aimes les livres au rythme soutenu'],
    ['note_emotion', 'Parce que tu aimes les livres qui remuent'],
    ['note_personnages', 'Parce que tu aimes les personnages forts'],
  ].sort((a, b) => (m[b[0]] ?? 0) - (m[a[0]] ?? 0))[0][1];
}
export const score = (l) => (l.note_generale ?? 0) * 2 + (l.note_rythme ?? 0) + (l.note_emotion ?? 0) + (l.note_personnages ?? 0);
export function bilan(livres, relectures, annee) {
  const lus = lusEn(livres, annee);
  const pages = lus.reduce((s, l) => s + (l.pages ?? 0), 0);
  const durees = lus.map((l) => ({ l, d: jours(l.debut, l.fin) })).filter((x) => x.d !== null);
  const now = new Date();
  const ecoules =
    annee === now.getFullYear()
      ? Math.max(1, Math.ceil((now - new Date(annee, 0, 1)) / 864e5))
      : (annee % 4 === 0 && annee % 100 !== 0) || annee % 400 === 0 ? 366 : 365;
  const parMois = Array(12).fill(0);
  for (const l of lus) parMois[Number(l.fin.slice(5, 7)) - 1]++;
  return {
    lus,
    lusPrecedente: lusEn(livres, annee - 1).length,
    pages,
    pagesParJour: Math.round(pages / ecoules),
    dureeMoyenne: durees.length ? Math.round(durees.reduce((s, x) => s + x.d, 0) / durees.length) : null,
    genre: genrePrefere(lus),
    parMois,
    moyennes: moyennes(lus),
    nbNotes: lus.filter((l) => l.note_generale).length,
    coupsDeCoeur: lus.filter((l) => l.note_generale).sort((a, b) => score(b) - score(a)).slice(0, 3),
    plusLong: [...lus].filter((l) => l.pages).sort((a, b) => b.pages - a.pages)[0] ?? null,
    plusRapide: [...durees].sort((a, b) => a.d - b.d)[0] ?? null,
    abandonnes: livres.filter((l) => l.statut === 'abandonne' && l.fin?.startsWith(String(annee))).length,
    relus: relectures.filter((r) => r.fin.startsWith(String(annee))).length,
  };
}

// ---------------------------------------------------------------- Formulaire de lecture
export const couleurAuHasard = () => COULEURS[Math.floor(Math.random() * COULEURS.length)];
/** Lit et vérifie le formulaire « Ajouter / modifier une lecture ». */
export function lireFormulaire(fd) {
  const erreurs = {};
  const texte = (cle, max = 300) => {
    const v = String(fd.get(cle) ?? '').trim();
    return v ? v.slice(0, max) : null;
  };
  const entier = (cle, min, max) => {
    const v = Number.parseInt(String(fd.get(cle) ?? ''), 10);
    return Number.isFinite(v) && v >= min && v <= max ? v : null;
  };
  const date = (cle) => {
    const v = String(fd.get(cle) ?? '');
    return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null;
  };
  const statut = STATUTS[fd.get('statut')] ? fd.get('statut') : 'lu';
  const genre = texte('genre', 60);
  const couleur = String(fd.get('couleur') ?? '');
  const v = {
    ol_key: texte('ol_key', 80),
    titre: texte('titre') ?? '',
    auteur: texte('auteur') ?? '',
    annee: entier('annee', -3000, 2100),
    pages: entier('pages', 1, 100000),
    genre: NOMS_GENRES.includes(genre) ? genre : null,
    couverture_id: entier('couverture_id', 1, Number.MAX_SAFE_INTEGER),
    couleur: COULEURS.includes(couleur) ? couleur : couleurAuHasard(),
    statut,
    debut: date('debut'),
    fin: date('fin'),
    note_generale: entier('note_generale', 1, 5),
    note_rythme: entier('note_rythme', 1, 5),
    note_emotion: entier('note_emotion', 1, 5),
    note_personnages: entier('note_personnages', 1, 5),
    commentaire: texte('commentaire', 20000),
    format: FORMATS[fd.get('format')] ? String(fd.get('format')) : null,
    langue: /^[a-z]{2}$/.test(String(fd.get('langue') ?? '')) ? String(fd.get('langue')) : null,
  };
  if (!v.titre || !v.auteur) erreurs.livre = 'Choisis un livre dans la recherche, ou indique au moins son titre et son auteur.';
  if (statut === 'a-lire') {
    v.debut = v.fin = null;
    v.note_generale = v.note_rythme = v.note_emotion = v.note_personnages = null;
  }
  if (statut === 'en-cours') v.fin = null;
  if (v.debut && v.fin && jours(v.debut, v.fin) === null) erreurs.dates = 'La date de fin doit être après la date de début.';
  else if (v.fin && v.fin > aujourdhui()) erreurs.dates = 'La date de fin ne peut pas être dans le futur.';
  else if (statut === 'lu' && !v.fin) erreurs.dates = 'Indique la date à laquelle tu as terminé ce livre.';
  if (statut === 'lu' && !v.note_generale) erreurs.notes = 'Donne au moins une note générale à ce livre.';
  return { valeurs: v, erreurs };
}

// ---------------------------------------------------------------- Illustration (couverture de la charte)
export const composition = (classe = '') => `
  <div class="compo ${classe}" aria-hidden="true">
    <span class="ligne" style="top:40.9%"></span><span class="ligne" style="top:64.4%"></span><span class="ligne" style="top:87.7%"></span>
    <div class="b tan">${symbole('grand')}</div>
    <div class="b slate"></div><div class="b caput"></div><div class="b or"></div><div class="b coffee"></div>
  </div>`;

/** Mise en page des pages de connexion / inscription : formulaire à gauche, illustration à droite. */
export const cadreAuth = (titre, intro, contenu) => `
  <div class="conteneur cadre">
    <div class="formulaire">
      <h1 class="titre-1">${titre}</h1>
      ${intro ? `<p class="petit intro">${intro}</p>` : ''}
      ${contenu}
    </div>
    <div class="decor">${composition()}</div>
  </div>`;

// ---------------------------------------------------------------- Enregistrement
/**
 * Enregistre une lecture. Si la base n'a pas encore les colonnes « format » et « langue »
 * (mise à jour SQL pas encore faite), on enregistre sans elles plutôt que d'échouer.
 * action reçoit les valeurs et renvoie la promesse Supabase.
 */
export async function ecrireLecture(action, valeurs) {
  let r = await action(valeurs);
  if (r.error && /format|langue/.test(`${r.error.message ?? ''} ${r.error.details ?? ''}`)) {
    const { format, langue, ...reste } = valeurs;
    r = await action(reste);
    if (!r.error) r.sansFormat = true;
  }
  return r;
}
