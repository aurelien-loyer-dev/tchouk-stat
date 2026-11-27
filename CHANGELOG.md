# Changelog

Toutes les évolutions notables de Tchoukball Assistant.
Le projet suit le [versionnage sémantique](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`.

- **MAJEUR** : changement qui casse l'existant (données sauvegardées, parcours supprimé).
- **MINEUR** : nouvelle fonctionnalité compatible.
- **CORRECTIF** : correction de bug, sans nouvelle fonctionnalité.

**Chaque push sur `main` publie une version.** Notez les changements au fil de l'eau dans « [Non publié] », puis :

- `npm run release` : correctif (2.1.0 → 2.1.1), le cas par défaut ;
- `npm run release -- minor` : nouvelle fonctionnalité (→ 2.2.0) ;
- `npm run release -- major` : changement qui casse l'existant (→ 3.0.0).

Le script incrémente `package.json`, transforme « [Non publié] » en section datée, commite, tague `vX.Y.Z` et pousse. Un hook git (`.githooks/pre-push`, installé par `npm install`) refuse un push sur `main` dont la version n'a pas changé.

## [Non publié]

## [2.5.2] - 2026-11-27

### Ajouté
- Partage en image : bouton Image sur les résultats d'un match (tous modes, et dans l'historique), la fiche joueur de la saison, la fin d'un tournoi et le classement d'un championnat. Image au format story (1080 × 1920) avec aperçu, partagée depuis le téléphone ou téléchargée en PNG.
- Stats joueurs : temps de jeu et remplacements. Les 7 premiers de chaque équipe démarrent sur le terrain, un bouton Terrain / Banc par joueur gère les entrées et sorties (annulables), au temps du chrono. Temps de jeu dans les résultats, l'historique, la saison (colonne Min) et l'export Excel.
- Championnat sur plusieurs journées : regrouper des tournois (une journée chacun), barème selon le nombre d'équipes ou fixe (10-8-6-5-4-3-2-1), classement général avec le détail de chaque journée, journées en cours provisoires, export Excel. Section en bas de la liste des tournois.
- Feuilles de match imprimables : un PDF avec une feuille par match à jouer, dans l'ordre du planning, deux par page A4. Pré-remplies (tournoi, phase, terrain, heure, arbitre), avec grille de points, score par mi-temps, remarques et signatures.
- Écran de salle (`/hall/CODE`) pour un tournoi partagé : plein écran pour la télé de l'accueil, qui alterne terrains (et créneau suivant), prochains matchs, classement ou tableau et derniers résultats, avec QR code et code du tournoi. Lien dans le panneau de partage.
- Tournois : arbitrage par les équipes au repos, attribué automatiquement et équilibré (jamais une équipe qui joue au même créneau, de préférence pas juste avant ou après). Arbitre affiché sur les terrains, le planning, les résultats et la page publique ; l'équipe suivie est prévenue quand elle doit arbitrer.

## [2.5.1] - 2026-11-27

### Ajouté
- Page publique d'un tournoi : alerte « ton équipe joue bientôt ». En suivant une équipe, un bandeau dit quand elle joue ; avec « Me prévenir », notification et vibration au créneau suivant puis au début du match, une seule fois par match, même onglet en arrière-plan.
- Export Excel (CSV) : un match (résultats et historique, avec toutes les stats et la chronologie), tout l'historique, la saison des joueurs et les matchs d'un joueur. Séparateur et virgule décimale adaptés à la langue.
- Fiches joueurs sur la saison (`/season`) : cumul des matchs en stats joueurs (matchs joués, points, moyenne, efficacité, défenses, fautes), tri, filtre par équipe et par période, fiche par joueur avec ses points match après match, toutes ses stats et ses matchs.
- Diffuser un match en direct : depuis la feuille de stats, les stats joueurs ou le scoreur, un lien et un QR code ouvrent un écran de score (télé de la salle, téléphones du public) piloté depuis le téléphone. Score, chrono et mi-temps en direct, même lien pour les matchs suivants (`/m/CODE`, `api/match.js`).
- Annuler la dernière action pendant un match (feuille de stats, stats joueurs, scoreur) : bouton qui rappelle l'action annulée, plusieurs annulations de suite, raccourci Ctrl+Z / ⌘Z.
- Application installable (PWA) : bouton Installer dans la barre d'app, raccourcis vers la feuille de stats, le scoreur et les tournois, fonctionnement complet hors ligne (indicateur « Hors ligne »), bandeau quand une nouvelle version est prête.
- Nouveau logo : le cadre de renvoi et le ballon. Il remplace l'ancien pictogramme dans la barre d'app et sert d'icône d'onglet et d'icône d'application.

## [2.4.0] - 2026-11-27

### Ajouté
- Tournois en double élimination : tableau principal, tableau de repêchage (une deuxième défaite élimine) et grande finale, avec finale décisive facultative si l'équipe du repêchage gagne. Têtes de série selon l'ordre de la liste, exempts gérés automatiquement, corrections de score répercutées sur la suite du tableau. Visible côté organisateur, sur la page publique, dans le classement final et le PDF.

### Corrigé
- Guide : les liens du sommaire ramenaient en haut de page (surtout visible sur téléphone). Un changement d'ancre ne compte plus comme une navigation.

## [2.3.0] - 2026-11-27

### Ajouté
- Guide (`/guide`, lien dans la barre d'app et sur l'accueil) : comment fonctionne chaque partie de l'app, la signification de chaque stat avec sa couleur, les formats de tournoi et le partage avec le public. En français et en anglais.

### Modifié
- Nouveau design, plus sobre : gris neutres au lieu du crème et du bleu-vert, actions en encre, barre d'app claire. Chiffres larges pour les scores, le chrono et les titres.
- Accueil refait : « Nouveau match » au lieu de « Prêt pour le match ? », les trois modes de saisie dans une seule bande, « Organiser » en liste avec le nombre de tournois et de matchs.
- Boutons + des stats plus discrets : fond légèrement teinté et signe coloré (chaque stat garde sa couleur).
- Le demi-cercle sous les scores est retiré.

## [2.2.0] - 2026-11-23

### Ajouté
- Horaires de tournoi : heure de début, nombre et durée des mi-temps, pauses, temps de changement. Heure estimée de chaque créneau et de chaque match en cours, heure de fin estimée (phases à venir comprises), recalculées selon l'avancement. Modifiables à tout moment ; visibles sur la page publique.
- Aller-retour pour les formats tous contre tous et poules.
- Les matchs lancés depuis un tournoi reprennent son nombre et sa durée de mi-temps.

## [2.1.0] - 2026-11-23

### Ajouté
- Tournois partagés : un code et deux liens par tournoi. Le lien spectateur affiche le tournoi en lecture seule, mis à jour en direct (toutes les 4 s). Le lien organisateur permet aussi de saisir les scores. On peut aussi suivre un tournoi en tapant son code. Stockage : fonction Vercel `api/tournament.js` + Upstash Redis.
- Tableau spectateur : bandeau « En direct », classements lisibles avec la forme récente (V/N/D) et les qualifiés, prochains matchs, derniers résultats (les nouveaux sont signalés), tableau final en colonnes, suivi d'une équipe, mode plein écran pour projeter.
- Poste organisateur : prochain match en grand avec compteurs +/−, aperçu des matchs suivants, étape à débloquer mise en avant (phase finale, ronde suivante…), onglets À jouer / Résultats / Classement, filtre par équipe.
- QR code du lien spectateur, affichable en grand pour la salle.
- Vraies adresses pour chaque écran : `/stats`, `/players`, `/scoreboard`, `/match`, `/match/results`, `/history/…`, `/tournaments/…`, `/teams`. Le bouton Précédent du navigateur fonctionne, et les liens peuvent s'ouvrir dans un nouvel onglet.
- Liens de partage plus courts : `/live/CODE` pour suivre, `/t/CODE#key=…` pour co-organiser (les anciens liens `#trn=` marchent toujours).
- Le logo et le nom de l'app ramènent à l'accueil.
- Accueil : carte « Match en cours » pour reprendre ou abandonner un match laissé ouvert.
- Page « introuvable » pour les adresses inconnues.
- Accessibilité : lien d'évitement, titre d'onglet par page, focus placé sur le titre à chaque changement d'écran, libellés sur tous les champs, classement utilisable au clavier, annonce des nouveaux résultats aux lecteurs d'écran.
- Équipes aléatoires → tournoi : on peut nommer les équipes tirées, puis « Créer un tournoi avec ces équipes ». Le formulaire de tournoi propose aussi « Importer le dernier tirage ». Les compositions suivent : onglet « Équipes » côté organisateur, composition de l'équipe suivie côté spectateur.
- Tournoi → match : depuis le prochain match d'un tournoi, lancer le scoreur, la feuille de stats ou les stats joueurs (avec les joueurs du tirage). À la fin du match, le score est reporté automatiquement dans le tournoi, et envoyé au serveur s'il est partagé.
- Accessibilité : les boutons +1 / −1 de la feuille de stats disent à quelle équipe ils s'appliquent.
- Terrains : nombre de terrains disponibles (à la création ou à tout moment). Les matchs sont répartis sur les terrains sans qu'une équipe joue deux fois en même temps ; un terrain libéré prend automatiquement le match suivant. Une carte de saisie par terrain, et un onglet « Planning » qui montre l'ordre des matchs par créneau.
- Chrono global informatif : nom, durée, démarrer / pause / +1 min / remise à zéro. Visible en grand sur la page publique.
- Page publique `/live/CODE` (lien spectateur et QR code) : toujours en lecture seule, même sur l'appareil de l'organisateur. Elle montre les matchs en cours par terrain, l'ordre des matchs à venir, les résultats, le classement et le chrono.

### Corrigé
- Historique vide : la page plantait (`onStartNew is not defined`), son bouton « Commencer » mène maintenant à l'accueil.
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
