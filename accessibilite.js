// Déclaration d'accessibilité (modèle du RGAA, version 4.1).
import { demarrer, esc } from './app.js?v=6';
import * as config from './config.js';

await demarrer({ actif: '' });
// Adresse de contact facultative : ajoute dans config.js la ligne
//   export const CONTACT_EMAIL = 'ton-adresse@exemple.fr';
const contact = typeof config.CONTACT_EMAIL === 'string' && config.CONTACT_EMAIL.includes('@') ? config.CONTACT_EMAIL : null;

document.getElementById('contenu').innerHTML = `<div class="conteneur etroit page texte-simple">
  <h1 class="titre-1">Déclaration d’accessibilité</h1>
  <p>Paragraphe s’engage à rendre son site accessible à toutes et à tous, conformément au Référentiel général d’amélioration de l’accessibilité (RGAA), version 4.1.</p>
  <p>Cette déclaration s’applique au site Paragraphe, carnet de lecture en ligne.</p>

  <h2 class="titre-2">État de conformité</h2>
  <p>Le site est <strong>partiellement conforme</strong> au RGAA 4.1. Il n’a pas encore fait l’objet d’un audit complet : cet état repose sur des vérifications faites pendant sa conception.</p>

  <h2 class="titre-2">Ce qui a été pris en compte</h2>
  <ul class="liste-texte">
    <li>Contrastes des textes et des champs suffisants dans les thèmes Soir et Jour.</li>
    <li>Navigation complète au clavier, focus toujours visible et lien d’accès direct au contenu.</li>
    <li>Champs de formulaire étiquetés, champs obligatoires signalés, erreurs reliées au champ concerné.</li>
    <li>Notes en étoiles lisibles par les lecteurs d’écran, graphiques accompagnés d’une description.</li>
    <li>Langue des pages déclarée, et langue des titres étrangers quand elle est connue.</li>
    <li>Animations désactivées si tu le demandes dans les réglages de ton appareil.</li>
  </ul>

  <h2 class="titre-2">Contenus qui peuvent poser problème</h2>
  <ul class="liste-texte">
    <li>Les couvertures et une partie des informations des livres viennent d’Open Library, de Google Books, de Wikidata et du catalogue de la BnF. Leur qualité (titres, textes alternatifs, langue) ne dépend pas de Paragraphe.</li>
    <li>La langue d’un titre étranger ne peut pas toujours être déterminée, notamment pour les livres ajoutés à la main.</li>
    <li>Le calendrier de lecture de la page « Mes bilans » s’appuie sur la couleur ; le détail de chaque jour est disponible pour les lecteurs d’écran et au survol.</li>
  </ul>

  <h2 class="titre-2">Établissement de cette déclaration</h2>
  <p>Déclaration établie le 26 octobre 2026.</p>
  <p>Technologies utilisées : HTML, CSS, JavaScript.</p>

  <h2 class="titre-2">Retour d’information et contact</h2>
  <p>Si tu n’arrives pas à accéder à un contenu ou à une fonctionnalité, signale-le : nous te proposerons une solution ou une autre façon d’y accéder.</p>
  ${
    contact
      ? `<p>Écris à <a href="mailto:${esc(contact)}">${esc(contact)}</a>.</p>`
      : '<p>Contacte l’administrateur du site par l’adresse qui t’a envoyé l’e-mail de confirmation d’inscription.</p>'
  }

  <h2 class="titre-2">Voies de recours</h2>
  <p>Si tu as signalé un défaut d’accessibilité sans obtenir de réponse satisfaisante, tu peux saisir le Défenseur des droits :</p>
  <ul class="liste-texte">
    <li>par le formulaire en ligne sur <a href="https://www.defenseurdesdroits.fr" rel="noopener">defenseurdesdroits.fr</a> ;</li>
    <li>en contactant le délégué du Défenseur des droits de ta région ;</li>
    <li>par courrier, gratuitement : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07.</li>
  </ul>
</div>`;
