// Mon compte : profil, mot de passe, export, suppression.
import { demarrer, sb, esc, dateFr, icone, toast, sortir, STATUTS, etatInstallation, installer, aideIphone } from './app.js?v=8';

const user = await demarrer({ prive: true, actif: 'compte' });
const main = document.getElementById('contenu');
const { count } = await sb.from('lectures').select('id', { count: 'exact', head: true });
const prenom = user.user_metadata?.prenom ?? '';

main.innerHTML = `<div class="conteneur etroit page compte-page">
  <div><h1 class="titre-1">Mon compte</h1>
    <p class="petit">Carnet ouvert le ${dateFr(user.created_at)} · ${count ?? 0} ${count === 1 ? 'livre' : 'livres'}</p></div>

  <section class="carte bloc">
    <h2 class="titre-2">Profil</h2>
    <form class="form" id="profil">
      <div class="champ"><label for="prenom">Prénom ou pseudo</label><input id="prenom" name="prenom" type="text" maxlength="60" value="${esc(prenom)}"></div>
      <div class="champ"><span class="etiquette">Adresse e-mail</span><p>${esc(user.email)}</p></div>
      <button class="btn btn-principal" type="submit">Enregistrer</button>
    </form>
  </section>

  <section class="carte bloc">
    <h2 class="titre-2">Sécurité</h2>
    <p class="petit">Pour changer de mot de passe, choisis-en un nouveau.</p>
    <a class="btn btn-secondaire" href="mot-de-passe.html">Changer mon mot de passe</a>
  </section>

  <section class="carte bloc" id="application" aria-labelledby="t-appli">
    <h2 class="titre-2" id="t-appli">Application</h2>
    <div id="zone-installation"></div>
  </section>

  <section class="carte bloc">
    <h2 class="titre-2">Aide</h2>
    <p class="petit">Tout ce que tu peux faire avec Paragraphe, et les réponses aux questions fréquentes.</p>
    <a class="btn btn-secondaire" href="guide.html">${icone('aide')}Comment ça marche</a>
  </section>

  <section class="carte bloc">
    <h2 class="titre-2">Mes données</h2>
    <p class="petit">Télécharge toutes tes lectures dans un fichier que tu peux ouvrir avec Excel, Numbers ou Google Sheets.</p>
    <button class="btn btn-secondaire" type="button" id="exporter">${icone('telecharger')}Exporter mon carnet</button>
  </section>

  <section class="carte bloc zone-danger">
    <h2 class="titre-2">Supprimer mon compte</h2>
    <p class="petit">Ton carnet, tes notes, tes commentaires et tes relectures seront définitivement effacés. Pense à exporter ton carnet avant.</p>
    <details>
      <summary class="btn btn-danger">Supprimer mon compte</summary>
      <form class="form confirmer" id="suppression" novalidate>
        <div class="champ"><label for="confirmation">Tape SUPPRIMER pour confirmer <span class="obligatoire" aria-hidden="true">*</span></label><input id="confirmation" type="text" autocomplete="off" required aria-required="true" aria-describedby="erreur-suppression"></div>
        <p class="erreur" role="alert" hidden id="erreur-suppression"></p>
        <button class="btn btn-danger" type="submit">${icone('corbeille')}Supprimer définitivement</button>
      </form>
    </details>
  </section>

  <button class="btn btn-lien" type="button" id="deconnexion">${icone('sortie')}Me déconnecter</button>
</div>`;

document.getElementById('profil').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await sb.auth.updateUser({ data: { prenom: e.target.prenom.value.trim().slice(0, 60) } });
  if (error) return toast('Le profil n’a pas pu être mis à jour. Réessaie dans un instant.');
  toast('Profil mis à jour.');
  const span = document.querySelector('.compte span');
  if (span) span.textContent = e.target.prenom.value.trim() || user.email.split('@')[0];
});

document.getElementById('exporter').addEventListener('click', async () => {
  const { data, error } = await sb.from('lectures').select('*').order('fin', { ascending: false, nullsFirst: false });
  if (error) return toast('Export impossible pour le moment.');
  const colonnes = [
    ['Titre', (l) => l.titre], ['Auteur', (l) => l.auteur], ['Année', (l) => l.annee], ['Pages', (l) => l.pages],
    ['Genre', (l) => l.genre], ['Statut', (l) => STATUTS[l.statut]], ['Début', (l) => l.debut], ['Fin', (l) => l.fin],
    ['Note générale', (l) => l.note_generale], ['Rythme', (l) => l.note_rythme], ['Émotion', (l) => l.note_emotion],
    ['Personnages', (l) => l.note_personnages], ['Commentaire', (l) => l.commentaire],
  ];
  const cellule = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // empêche le tableur d'interpréter une formule
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [colonnes.map(([t]) => t).join(';'), ...(data ?? []).map((l) => colonnes.map(([, f]) => cellule(f(l))).join(';'))].join('\r\n');
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  lien.download = `paragraphe-${new Date().toISOString().slice(0, 10)}.csv`;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 2000);
});

document.getElementById('suppression').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erreur = document.getElementById('erreur-suppression');
  if (e.target.confirmation.value.trim().toUpperCase() !== 'SUPPRIMER') {
    erreur.textContent = 'Tape SUPPRIMER en capitales pour confirmer.';
    erreur.hidden = false;
    return;
  }
  const { error } = await sb.rpc('supprimer_mon_compte');
  if (error) {
    erreur.textContent = 'La suppression n’a pas pu aboutir. Vérifie que le schéma de la base est à jour (guide, étape 2).';
    erreur.hidden = false;
    return;
  }
  sortir('connexion.html?etat=supprime');
});

document.getElementById('deconnexion').addEventListener('click', () => sortir('connexion.html?etat=deconnecte'));

// ---- Installation de l'application
function majInstallation() {
  const zone = document.getElementById('zone-installation');
  const etat = etatInstallation();
  zone.innerHTML =
    etat === 'installee'
      ? '<p class="petit">Paragraphe est installé sur cet appareil. Tu peux l’ouvrir depuis ton écran d’accueil.</p>'
      : etat === 'android'
        ? `<p class="petit">Installe Paragraphe sur ton téléphone : une icône sur l’écran d’accueil, et le carnet s’ouvre en plein écran comme une application.</p>
           <button class="btn btn-principal" type="button" id="installer">${icone('telephone')}Installer l’application</button>`
        : etat === 'iphone'
          ? `<p class="petit">Sur iPhone et iPad, l’installation se fait depuis Safari, en trois gestes :</p>${aideIphone()}`
          : `<p class="petit">Sur ton téléphone, ouvre Paragraphe dans Chrome (Android) ou Safari (iPhone) : tu pourras l’ajouter à ton écran d’accueil comme une application.</p>`;
  document.getElementById('installer')?.addEventListener('click', async () => {
    if (await installer()) toast('Paragraphe est installé.');
    majInstallation();
  });
}
majInstallation();
document.addEventListener('installation-possible', majInstallation);
