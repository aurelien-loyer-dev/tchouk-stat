# Changelog

Toutes les évolutions notables de Tchoukball Assistant.
Le projet suit le [versionnage sémantique](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`.

- **MAJEUR** : changement qui casse l'existant (données sauvegardées, parcours supprimé).
- **MINEUR** : nouvelle fonctionnalité compatible.
- **CORRECTIF** : correction de bug, sans nouvelle fonctionnalité.

Pour publier une version : mettre à jour `version` dans `package.json` (`npm version <majeur|mineur|correctif> --no-git-tag-version`), ajouter la section ci-dessous, commiter, puis taguer `vX.Y.Z`.

## [Non publié]

### Ajouté
- Tournois partagés : un code et deux liens par tournoi. Le lien spectateur affiche le tournoi en lecture seule, mis à jour en direct (toutes les 4 s). Le lien organisateur permet aussi de saisir les scores. On peut aussi suivre un tournoi en tapant son code. Stockage : fonction Vercel `api/tournament.js` + Upstash Redis.

## [2.0.0] - 2026-11-23

Première version numérotée. Elle regroupe la refonte complète de l'application.

### Ajouté
- Équipes aléatoires : tirage à partir d'une liste de joueurs, mixité imposée (au moins une fille par équipe si possible) et niveaux équilibrés (débutant, moyen, expérimenté), copie du résultat et lancement direct d'un match joueurs.
- Sauvegarde automatique du match en cours, restauré après un rechargement.
- Une couleur par stat sur la feuille de match et le suivi joueurs.
- Thèmes clair et sombre, interface « lignes du gymnase ».
- Traduction anglaise avec détection automatique de la langue.
- Historique des matchs complet : filtres, détail, export PDF.
- Numéro de version affiché dans le pied de page.

### Modifié
- Accueil repensé : tuiles directes, section « Organiser » (tournois, équipes aléatoires, historique).
- Code réorganisé par fonctionnalité (`src/features/`).
