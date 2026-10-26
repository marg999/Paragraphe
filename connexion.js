import { demarrer, sb, cadreAuth, messageAuth, pageSure, parametre, esc } from './app.js?v=7';

await demarrer({ invite: true, actif: 'connexion' });
const suite = pageSure(parametre('suite'));
const INFOS = {
  'lien-invalide': 'Ce lien n’est plus valable. Connecte-toi, ou demande un nouveau lien.',
  deconnecte: 'Tu es déconnecté. À bientôt.',
  supprime: 'Ton compte et toutes tes données ont été supprimés.',
};
const info = INFOS[parametre('etat')] ?? (window.lienEmail?.erreur ? INFOS['lien-invalide'] : '');

document.getElementById('contenu').innerHTML = cadreAuth(
  'Content de te revoir',
  'Connecte-toi pour retrouver ta bibliothèque.',
  `${info ? `<p class="info">${esc(info)}</p>` : ''}
   <p class="alerte" role="alert" hidden id="erreur"></p>
   <p class="aide legende-obligatoire">Les champs marqués d’un astérisque (<span class="obligatoire" aria-hidden="true">*</span>) sont obligatoires.</p>
     <form id="form" novalidate>
     <div class="champ"><label for="email">Adresse e-mail <span class="obligatoire" aria-hidden="true">*</span></label><input id="email" name="email" type="email" autocomplete="email" required aria-required="true" aria-describedby="erreur"></div>
     <div class="champ"><label for="mot_de_passe">Mot de passe <span class="obligatoire" aria-hidden="true">*</span></label><input id="mot_de_passe" name="mot_de_passe" type="password" autocomplete="current-password" required aria-required="true" aria-describedby="erreur"></div>
     <button class="btn btn-principal" type="submit">Me connecter</button>
   </form>
   <div class="liens"><a href="mot-de-passe.html">Mot de passe oublié ?</a><a href="inscription.html">Créer mon carnet</a></div>`,
);

const form = document.getElementById('form');
const erreur = document.getElementById('erreur');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  const motDePasse = form.mot_de_passe.value;
  if (!email || !motDePasse) return afficher('Indique ton adresse e-mail et ton mot de passe.');
  const bouton = form.querySelector('button');
  bouton.disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email, password: motDePasse });
  if (!error) return location.replace(suite);
  bouton.disabled = false;
  afficher(messageAuth(error));
});
function afficher(message) {
  const erreur = document.getElementById('erreur');
  erreur.textContent = message;
  erreur.hidden = false;
  erreur.setAttribute('tabindex', '-1');
  erreur.focus();
}
