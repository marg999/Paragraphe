// Pages sans contenu dynamique (confidentialité, page introuvable).
import { demarrer, symbole } from './app.js?v=4';

document.querySelectorAll('svg.symb').forEach((el) => (el.outerHTML = symbole('symb')));
demarrer({ actif: '' }).catch(() => {});
