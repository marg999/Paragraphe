// Deux usages : demander un lien (mot de passe oublié) ou choisir un nouveau mot de passe
// (après avoir cliqué sur le lien reçu, ou depuis « Mon compte »).
import { demarrer, sb, cadreAuth, messageAuth, esc, aller } from './app.js';

const user = await demarrer({ actif: 'mot-de-passe' });
const main = document.getElementById('contenu');

if (user) {
  main.innerHTML = cadreAuth(
    window.lienEmail?.recuperation ? 'Choisis un nouveau mot de passe' : 'Changer de mot de passe',
    '',
    `<p class="alerte" role="alert" hidden id="erreur"></p>
     <form id="form" novalidate>
       <div class="champ"><label for="mdp">Nouveau mot de passe</label><input id="mdp" type="password" autocomplete="new-password" minlength="8" required></div>
       <div class="champ"><label for="confirmation">Confirme le mot de passe</label><input id="confirmation" type="password" autocomplete="new-password" minlength="8" required></div>
       <button class="btn btn-principal" type="submit">Enregistrer le mot de passe</button>
     </form>
     <div class="liens"><a href="compte.html">Retour à mon compte</a></div>`,
  );
  const form = document.getElementById('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mdp = form.mdp.value;
    if (mdp.length < 8) return afficher('Choisis un mot de passe d’au moins 8 caractères.');
    if (mdp !== form.confirmation.value) return afficher('Les deux mots de passe ne sont pas identiques.');
    form.querySelector('button').disabled = true;
    const { error } = await sb.auth.updateUser({ password: mdp });
    if (!error) return aller('index.html', 'Mot de passe modifié.');
    form.querySelector('button').disabled = false;
    afficher(messageAuth(error));
  });
} else {
  main.innerHTML = cadreAuth(
    'Mot de passe oublié',
    'Indique ton adresse : tu recevras un lien pour choisir un nouveau mot de passe.',
    `${window.lienEmail?.erreur ? '<p class="info">Ce lien n’est plus valable. Demande un nouveau lien ci-dessous.</p>' : ''}
     <p class="alerte" role="alert" hidden id="erreur"></p>
     <form id="form" novalidate>
       <div class="champ"><label for="email">Adresse e-mail</label><input id="email" type="email" autocomplete="email" required></div>
       <button class="btn btn-principal" type="submit">Recevoir le lien</button>
     </form>
     <div class="liens"><a href="connexion.html">Retour à la connexion</a></div>`,
  );
  const form = document.getElementById('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!email) return afficher('Indique ton adresse e-mail.');
    form.querySelector('button').disabled = true;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: new URL('mot-de-passe.html', location.href).href });
    // Par discrétion, le même message s'affiche que l'adresse existe ou non.
    if (error?.code?.startsWith('over_')) {
      form.querySelector('button').disabled = false;
      return afficher(messageAuth(error));
    }
    form.outerHTML = `<p class="info" role="status">Si un carnet existe avec l’adresse ${esc(email)}, un lien vient d’y être envoyé. Pense à regarder dans les indésirables.</p>`;
    document.getElementById('erreur').hidden = true;
  });
}
function afficher(message) {
  const erreur = document.getElementById('erreur');
  erreur.textContent = message;
  erreur.hidden = false;
}
