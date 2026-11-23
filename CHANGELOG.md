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
- Tableau spectateur : bandeau « En direct », classements lisibles avec la forme récente (V/N/D) et les qualifiés, prochains matchs, derniers résultats (les nouveaux sont signalés), tableau final en colonnes, suivi d'une équipe, mode plein écran pour projeter.
- Poste organisateur : prochain match en grand avec compteurs +/−, aperçu des matchs suivants, étape à débloquer mise en avant (phase finale, ronde suivante…), onglets À jouer / Résultats / Classement, filtre par équipe.
- QR code du lien spectateur, affichable en grand pour la salle.

- Vraies adresses pour chaque écran : `/stats`, `/players`, `/scoreboard`, `/match`, `/match/results`, `/history/…`, `/tournaments/…`, `/teams`. Le bouton Précédent du navigateur fonctionne, et les liens peuvent s'ouvrir dans un nouvel onglet.
- Lien de partage plus court : `/t/CODE` (les anciens liens `#trn=` marchent toujours).
- Le logo et le nom de l'app ramènent à l'accueil.
- Accueil : carte « Match en cours » pour reprendre ou abandonner un match laissé ouvert.
- Page « introuvable » pour les adresses inconnues.
- Accessibilité : lien d'évitement, titre d'onglet par page, focus placé sur le titre à chaque changement d'écran, libellés sur tous les champs, classement utilisable au clavier, annonce des nouveaux résultats aux lecteurs d'écran.

- Équipes aléatoires → tournoi : on peut nommer les équipes tirées, puis « Créer un tournoi avec ces équipes ». Le formulaire de tournoi propose aussi « Importer le dernier tirage ». Les compositions suivent : onglet « Équipes » côté organisateur, composition de l'équipe suivie côté spectateur.
- Tournoi → match : depuis le prochain match d'un tournoi, lancer le scoreur, la feuille de stats ou les stats joueurs (avec les joueurs du tirage). À la fin du match, le score est reporté automatiquement dans le tournoi, et envoyé au serveur s'il est partagé. « Jouer maintenant » choisit un autre match à mettre en avant (plusieurs terrains).
- Accessibilité : les boutons +1 / −1 de la feuille de stats disent à quelle équipe ils s'appliquent.

### Corrigé
- Historique : ouvrir un match aux données incomplètes (ancienne version, ligne Supabase abîmée) faisait planter toute l'app (écran noir). Les matchs sont maintenant remis en forme au chargement, et un écran qui plante affiche un message avec un retour à l'accueil au lieu d'un écran noir.
- Le bouton « Valider le tournoi » n'apparaît plus avant la phase finale quand celle-ci reste à jouer.

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
