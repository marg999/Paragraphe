import { demarrer, sb, cadreAuth, messageAuth, esc, aller } from './app.js?v=4';

await demarrer({ invite: true, actif: 'inscription' });
const main = document.getElementById('contenu');
main.innerHTML = cadreAuth(
  'Créer mon carnet',
  'Gratuit et privé : toi seul vois tes lectures, tes notes et tes commentaires.',
  `<p class="alerte" role="alert" hidden id="erreur"></p>
   <p class="aide legende-obligatoire">Les champs marqués d’un astérisque (<span class="obligatoire" aria-hidden="true">*</span>) sont obligatoires.</p>
     <form id="form" novalidate>
     <div class="champ"><label for="prenom">Prénom ou pseudo</label><input id="prenom" name="prenom" type="text" autocomplete="given-name" maxlength="60"></div>
     <div class="champ"><label for="email">Adresse e-mail <span class="obligatoire" aria-hidden="true">*</span></label><input id="email" name="email" type="email" autocomplete="email" required aria-required="true" aria-describedby="erreur"></div>
     <div class="champ">
       <label for="mot_de_passe">Mot de passe <span class="obligatoire" aria-hidden="true">*</span></label>
       <input id="mot_de_passe" name="mot_de_passe" type="password" autocomplete="new-password" minlength="8" required aria-required="true" aria-describedby="aide-mdp erreur">
       <span class="aide" id="aide-mdp">Au moins 8 caractères.</span>
     </div>
     <button class="btn btn-principal" type="submit">Créer mon carnet</button>
   </form>
   <div class="liens"><span class="petit">Déjà un carnet ?</span><a href="connexion.html">Me connecter</a></div>`,
);

const form = document.getElementById('form');
const erreur = document.getElementById('erreur');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prenom = form.prenom.value.trim().slice(0, 60);
  const email = form.email.value.trim();
  const motDePasse = form.mot_de_passe.value;
  if (!email) return afficher('Indique ton adresse e-mail.');
  if (motDePasse.length < 8) return afficher('Choisis un mot de passe d’au moins 8 caractères.');
  const bouton = form.querySelector('button');
  bouton.disabled = true;
  const { data, error } = await sb.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { prenom }, emailRedirectTo: new URL('index.html', location.href).href },
  });
  if (error) {
    bouton.disabled = false;
    return afficher(messageAuth(error));
  }
  if (data.session) return aller('index.html', 'Bienvenue sur Paragraphe.');
  document.querySelector('.formulaire').innerHTML = `
    <h1 class="titre-1">Vérifie ta boîte mail</h1>
    <p class="info" role="status">Nous avons envoyé un lien de confirmation à <strong>${esc(email)}</strong>.
    Clique dessus pour ouvrir ton carnet. Pense à regarder dans les indésirables.</p>
    <div class="liens"><a href="connexion.html">Retour à la connexion</a></div>`;
});
function afficher(message) {
  const erreur = document.getElementById('erreur');
  erreur.textContent = message;
  erreur.hidden = false;
  erreur.setAttribute('tabindex', '-1');
  erreur.focus();
}
