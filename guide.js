// Comment ça marche : présentation de Paragraphe, accessible à tout le monde (connecté ou non).
import { demarrer, icone, composition } from './app.js?v=8';

const user = await demarrer({ actif: 'guide' });

const FONCTIONS = [
  ['recherche', 'Retrouver n’importe quel livre', 'Tape un titre ou un auteur : Paragraphe cherche dans quatre grands catalogues de livres à la fois. Sur téléphone, tu peux aussi scanner le code-barres au dos du livre.'],
  ['etoile', 'Noter sur quatre critères', 'Une note générale, puis le rythme, l’émotion et les personnages. De quoi te souvenir de ce qui t’a plu, ou pas, des années plus tard.'],
  ['calendrier', 'Garder la trace de tes lectures', 'Tes dates de début et de fin, la durée calculée toute seule, le format (papier, numérique, audio), ton commentaire et tes relectures.'],
  ['cible', 'Te fixer un objectif', 'Choisis combien de livres tu veux lire dans l’année, et suis ta progression depuis ta bibliothèque.'],
  ['bilans', 'Découvrir tes bilans', 'Chaque mois et chaque année : livres terminés, pages lues, calendrier de lecture, coups de cœur et ton profil de lecteur.'],
  ['ampoule', 'Trouver ta prochaine lecture', 'Des suggestions d’après les livres que tu as aimés : du même auteur, du même genre, ou déjà dans ta liste « À lire ».'],
];

const ETAPES = [
  ['Crée ton carnet', 'Une adresse e-mail et un mot de passe suffisent. C’est gratuit.', user ? null : ['inscription.html', 'Créer mon carnet']],
  ['Installe l’application', 'Sur ton téléphone, ajoute Paragraphe à ton écran d’accueil : il s’ouvrira en plein écran, comme une application.', ['compte.html#application', 'Voir comment faire']],
  ['Ajoute tes dernières lectures', 'Commence par les 3 ou 4 livres que tu as lus récemment, avec leur note. Ta bibliothèque prend vie tout de suite.', ['ajouter.html', 'Ajouter un livre']],
  ['Fixe ton objectif de l’année', 'Depuis ta bibliothèque, clique sur « Modifier » dans l’encadré Objectif. Tu pourras le changer quand tu veux.', ['index.html', 'Ouvrir ma bibliothèque']],
];

const QUESTIONS = [
  ['Qui peut voir mes lectures ?', 'Personne d’autre que toi. Il n’y a ni profil public, ni abonnés, ni partage : les autres lecteurs ne peuvent jamais voir ton carnet. Tous les détails sont dans la page <a href="confidentialite.html">Confidentialité</a>.'],
  ['Je ne trouve pas mon livre, que faire ?', 'Essaie avec le titre seul, puis avec le nom de l’auteur seul. Tu peux aussi taper les 13 chiffres écrits sous le code-barres, ou le scanner avec ton téléphone. En bas de la liste, « Voir plus de résultats » affiche la suite. Si le livre reste introuvable, choisis « Ajouter manuellement » : tu écris toi-même le titre et l’auteur.', 'trouver'],
  ['Dois-je remplir tous les critères de note ?', 'Non. Pour un livre lu, seule la note générale est demandée. Le rythme, l’émotion et les personnages sont facultatifs, mais ils rendent tes bilans plus intéressants.'],
  ['Comment fonctionnent les suggestions ?', 'Elles s’appuient sur les livres que tu as notés 4 ou 5 étoiles : leurs auteurs et leurs genres. Si une suggestion ne te tente pas, touche « Pas pour moi » : elle ne te sera plus proposée.'],
  ['Est-ce que ça marche sans Internet ?', 'L’application s’ouvre, mais tes lectures sont enregistrées en ligne : elles s’affichent dès que la connexion revient. Rien n’est perdu.'],
  ['Comment récupérer ou supprimer mes données ?', 'Dans Mon compte, « Exporter mon carnet » te donne un fichier à ouvrir avec Excel, Numbers ou Google Sheets. Tu peux aussi y supprimer ton compte : tout est alors effacé.'],
  ['Est-ce que c’est payant ?', 'Non. Paragraphe est gratuit et sans publicité.'],
];

document.getElementById('contenu').innerHTML = `<div class="guide">
  <section class="conteneur guide-hero">
    <div class="texte">
      <p class="etiquette accent">Comment ça marche</p>
      <h1 class="affiche">Ton carnet de lecture, pas un réseau social.</h1>
      <p class="chapo">Paragraphe est un carnet rien qu’à toi. Tu y gardes chaque livre lu, ce que tu en as pensé et le temps qu’il t’a accompagné. Pas d’abonnés, pas de likes, pas de classement : tu lis à ton rythme, et tu notes pour te souvenir.</p>
    </div>
    ${composition('compo-hero')}
  </section>

  <section class="conteneur guide-section" aria-labelledby="t-idee">
    <h2 class="titre-1" id="t-idee">L’idée</h2>
    <div class="trois">
      <article><span class="pastille-icone">${icone('cadenas', 22)}</span><h3 class="titre-2">Privé</h3>
        <p class="petit">Ton carnet n’est visible que par toi. Ce que tu lis, ce que tu en penses et ce que tu abandonnes ne regarde que toi.</p></article>
      <article><span class="pastille-icone">${icone('coeur', 22)}</span><h3 class="titre-2">Pour toi</h3>
        <p class="petit">Rien à prouver à personne. Pas de compteur d’abonnés, pas de défi public : seulement tes lectures et tes souvenirs.</p></article>
      <article><span class="pastille-icone">${icone('livre', 22)}</span><h3 class="titre-2">Simple</h3>
        <p class="petit">Gratuit, sans publicité, sur ordinateur comme sur téléphone. Tes données t’appartiennent et tu peux les récupérer à tout moment.</p></article>
    </div>
  </section>

  <section class="conteneur guide-section" aria-labelledby="t-faire">
    <h2 class="titre-1" id="t-faire">Ce que tu peux faire</h2>
    <div class="fonctions">
      ${FONCTIONS.map(([ic, titre, texte]) => `<article class="carte fonction"><span class="pastille-icone">${icone(ic, 22)}</span><h3 class="titre-2">${titre}</h3><p class="petit">${texte}</p></article>`).join('')}
    </div>
  </section>

  <section class="conteneur guide-section" aria-labelledby="t-commencer">
    <h2 class="titre-1" id="t-commencer">Bien commencer</h2>
    <p class="petit lisible">Quatre étapes, quelques minutes, et ton carnet est prêt.</p>
    <ol class="etapes">
      ${ETAPES.map(
        ([titre, texte, lien], i) => `<li class="etape">
          <span class="numero" aria-hidden="true">${i + 1}</span>
          <div><h3 class="titre-2">${titre}</h3><p class="petit">${texte}</p>
          ${lien ? `<a class="btn btn-lien" href="${lien[0]}">${lien[1]}</a>` : '<p class="fait">' + icone('coche', 18) + 'C’est déjà fait.</p>'}</div>
        </li>`,
      ).join('')}
    </ol>
  </section>

  <section class="conteneur etroit guide-section" aria-labelledby="t-questions">
    <h2 class="titre-1" id="t-questions">Questions fréquentes</h2>
    <div class="faq">
      ${QUESTIONS.map(([q, r, ancre]) => `<details${ancre ? ` id="${ancre}"` : ''}><summary>${q}</summary><p>${r}</p></details>`).join('')}
    </div>
  </section>

  <section class="conteneur guide-fin">
    <p class="affiche-petite">Prêt à ouvrir ton carnet ?</p>
    ${
      user
        ? `<a class="btn btn-principal" href="ajouter.html">${icone('plus')}Ajouter un livre</a>`
        : '<div class="actions"><a class="btn btn-principal" href="inscription.html">Créer mon carnet</a><a class="btn btn-secondaire" href="connexion.html">Me connecter</a></div>'
    }
  </section>
</div>`;

// Lien direct vers une question (ex. guide.html#trouver) : on l'ouvre.
const cible = location.hash && document.getElementById(location.hash.slice(1));
if (cible?.tagName === 'DETAILS') {
  cible.open = true;
  cible.scrollIntoView({ block: 'center' });
}
