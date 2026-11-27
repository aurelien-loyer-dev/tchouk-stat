// Contenu du guide, par langue. Gardé ici plutôt que dans les fichiers de
// traduction : ce sont des textes longs, relus et modifiés ensemble.
//
// Blocs disponibles dans `blocks` :
//   { type: 'steps', items: [texte] }                 étapes numérotées
//   { type: 'terms', items: [{ term, desc }] }        définitions
//   { type: 'stats', items: [{ color, term, desc }] } stats avec leur couleur
//   { type: 'note',  text }                           remarque à retenir
// `heading` (facultatif) ajoute un intertitre avant le bloc.

const fr = {
  title: 'Guide',
  subtitle: 'Comment fonctionne chaque partie de l’app, pour les organisateurs comme pour le public.',
  tocLabel: 'Sommaire',
  open: 'Ouvrir',
  sections: [
    {
      id: 'essentiel',
      title: 'L’essentiel',
      intro: 'Tchoukball Assistant fonctionne dans le navigateur, sans compte. Il marche sur téléphone, tablette et ordinateur.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: 'Vos données', desc: 'Matchs, tournois et compositions sont enregistrés dans ce navigateur. Effacer les données du navigateur les supprime.' },
            { term: 'Match en cours', desc: 'Il est sauvegardé à chaque action. Si la page se ferme, l’accueil propose de le reprendre là où il en était.' },
            { term: 'Thème et langue', desc: 'Les boutons en haut à droite passent en thème clair ou sombre et en anglais. Le choix est mémorisé.' },
            { term: 'Installer l’app', desc: 'Sur Android et ordinateur, appuyez sur Installer dans la barre du haut. Sur iPhone et iPad, dans Safari : bouton Partager, puis « Sur l’écran d’accueil ».' },
            { term: 'Sans réseau', desc: 'Une fois ouverte une première fois, l’app fonctionne hors ligne : saisie des matchs, scoreur, historique, tournois. Seuls le partage en direct et la synchronisation attendent le retour du réseau.' },
            { term: 'Mises à jour', desc: 'Quand une nouvelle version est prête, un bandeau propose de recharger. Rien n’est perdu, même en plein match.' },
          ],
        },
      ],
    },
    {
      id: 'feuille',
      title: 'Feuille de stats',
      to: '/stats',
      intro: 'Pour suivre toutes les actions des deux équipes pendant le match. Une personne au bord du terrain suffit.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Donnez un nom et une couleur à chaque équipe, puis réglez le nombre et la durée des mi-temps.',
            'Appuyez sur Démarrer pour lancer le chrono.',
            'À chaque action, touchez le + de la bonne ligne. Une erreur ? Le bouton Annuler, en bas de l’écran, défait la dernière action (plusieurs fois de suite si besoin, ou Ctrl+Z).',
            'À la fin, appuyez sur Fin du match pour voir les résultats.',
          ],
        },
        {
          type: 'stats',
          heading: 'Ce que compte chaque ligne',
          items: [
            { color: 'yellow', term: 'Ballons', desc: 'Une possession de ballon. Sert à calculer la conversion (tirs par possession).' },
            { color: 'green', term: 'Gagné', desc: 'Tir marqué : +1 point pour l’équipe.' },
            { color: 'red', term: 'Donné', desc: 'Tir qui offre le point à l’adversaire : +1 point pour l’autre équipe.' },
            { color: 'blue', term: 'Catché', desc: 'Tir rattrapé par la défense adverse : pas de point, la possession est perdue.' },
            { color: 'orange', term: 'Cadre', desc: 'Faute sur tir (zone, cadre…) : pas de point, le ballon passe à l’adversaire.' },
            { color: 'violet', term: 'Passe ratée', desc: 'Passe perdue ou mal donnée.' },
            { color: 'magenta', term: 'Faute technique', desc: 'Faute hors tir : marcher, plus de trois passes, etc.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Chrono',
          items: [
            { term: 'Démarrer / Pause', desc: 'Lance ou arrête le temps de la mi-temps.' },
            { term: 'MT suiv.', desc: 'Passe à la mi-temps suivante.' },
            { term: 'Reset MT / Reset tout', desc: 'Remet à zéro le chrono de la mi-temps, ou celui du match entier. Les stats ne bougent pas.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Résultats',
          items: [
            { term: 'Efficacité offensive', desc: 'Tirs gagnés divisés par le total des tirs.' },
            { term: 'Efficacité défensive', desc: 'Tirs adverses catchés divisés par le total des tirs adverses.' },
            { term: 'Conversion', desc: 'Nombre de tirs par possession.' },
            { term: 'Timeline', desc: 'L’évolution du score minute par minute, avec chaque tir.' },
            { term: 'PDF', desc: 'La feuille de match complète, à télécharger et à partager.' },
          ],
        },
      ],
    },
    {
      id: 'joueurs',
      title: 'Stats joueurs',
      to: '/players',
      intro: 'Pour suivre chaque joueur individuellement, avec une ou deux équipes.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Choisissez une ou deux équipes, puis entrez les noms des joueurs. Le bouton Compos sauvegarde une équipe pour la recharger la prochaine fois.',
            'Pendant le match, touchez d’abord une stat, puis le joueur concerné.',
            'La stat reste sélectionnée : vous pouvez toucher plusieurs joueurs à la suite.',
            'Remplacements : les 7 premiers joueurs de chaque équipe commencent sur le terrain. Touchez Terrain / Banc sur une carte pour faire sortir ou entrer un joueur ; son temps de jeu suit le chrono et apparaît dans les résultats, l’historique, la saison et l’export Excel.',
          ],
        },
        {
          type: 'stats',
          heading: 'Les stats',
          items: [
            { color: 'green', term: 'Points marqués', desc: 'Tir réussi du joueur : +1 pour son équipe.' },
            { color: 'slate', term: 'Tirs non transformés', desc: 'Tir sans point (catché par l’adversaire).' },
            { color: 'red', term: 'Points donnés', desc: 'Tir qui offre le point à l’adversaire.' },
            { color: 'orange', term: 'Fautes de tir', desc: 'Faute commise au moment du tir.' },
            { color: 'blue', term: 'Défense solo', desc: 'Ballon rattrapé seul en défense.' },
            { color: 'aqua', term: 'Participation déf.', desc: 'Participation à une défense réussie.' },
            { color: 'yellow', term: 'Défense ratée', desc: 'Ballon que le joueur aurait dû rattraper.' },
            { color: 'violet', term: 'Passe ratée', desc: 'Passe perdue ou mal donnée.' },
            { color: 'magenta', term: 'Faute technique', desc: 'Faute hors tir.' },
            { color: 'ink', term: 'Sanctions', desc: 'Avertissement ou exclusion.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Distinctions du match',
          items: [
            { term: 'BOPM', desc: 'Meilleur attaquant : points marqués, efficacité et points donnés.' },
            { term: 'BDPM', desc: 'Meilleur défenseur : défenses solo et participations défensives.' },
            { term: 'MVP', desc: 'Joueur le plus complet, attaque, défense et fautes comprises.' },
          ],
        },
      ],
    },
    {
      id: 'saison',
      title: 'Joueurs et saison',
      to: '/season',
      intro: 'Chaque match suivi en stats joueurs alimente la fiche des joueurs : un repère pour le coach sur toute la saison.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: 'Tableau', desc: 'Matchs joués, points, moyenne par match, efficacité, défenses, fautes et minutes jouées de chaque joueur. Touchez un en-tête pour trier.' },
            { term: 'Période', desc: 'Saison en cours (depuis le 1er septembre) ou tout l’historique.' },
            { term: 'Fiche joueur', desc: 'Ses chiffres clés, ses points match après match, toutes ses stats (total et par match) et la liste de ses matchs.' },
            { term: 'Même joueur', desc: 'Un joueur est reconnu par son nom : gardez la même orthographe d’un match à l’autre (les compos sauvegardées aident).' },
          ],
        },
      ],
    },
    {
      id: 'scoreur',
      title: 'Scoreur',
      to: '/scoreboard',
      intro: 'Un grand tableau de score pour le public : sur une télé, un vidéoprojecteur ou une tablette tournée vers les tribunes.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: '+1 / −1', desc: 'Les gros boutons sous chaque score. Annuler, en bas, défait le dernier point.' },
            { term: 'Chrono', desc: 'Touchez le chrono pour le mettre en pause ou le relancer.' },
            { term: 'Logos', desc: 'Ajoutez le logo de chaque équipe avant le match ; il s’affiche dans son camp.' },
            { term: 'Fin', desc: 'Affiche le score final et le détail par mi-temps.' },
          ],
        },
        { type: 'note', text: 'En mode scoreur, seul le score est enregistré dans l’historique, pas les stats.' },
      ],
    },
    {
      id: 'direct',
      title: 'Diffuser un match en direct',
      intro: 'Le score et le chrono s’affichent sur un autre écran, pilotés depuis votre téléphone : la télé de la salle, ou le téléphone des spectateurs.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Pendant un match (feuille de stats, stats joueurs ou scoreur), appuyez sur Diffuser, puis Lancer la diffusion.',
            'Sur la télé ou le vidéoprojecteur, ouvrez le lien affiché (ou scannez le QR code) et passez en plein écran.',
            'Continuez à saisir sur le téléphone : la télé suit le score, le chrono et la mi-temps en direct.',
          ],
        },
        {
          type: 'terms',
          items: [
            { term: 'Matchs suivants', desc: 'Le lien reste le même : au match suivant, la télé change d’affiche toute seule.' },
            { term: 'Public', desc: 'Le même lien marche sur téléphone : les absents suivent le match de chez eux.' },
            { term: 'Arrêter', desc: 'Diffuser, puis Arrêter la diffusion : le lien ne fonctionne plus.' },
          ],
        },
      ],
    },
    {
      id: 'historique',
      title: 'Historique',
      to: '/history',
      intro: 'Tous les matchs terminés, du plus récent au plus ancien.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: 'Rechercher', desc: 'Tapez le nom d’une équipe.' },
            { term: 'Filtrer', desc: 'Par type de match : feuille de stats, stats joueurs ou scoreur.' },
            { term: 'Détail', desc: 'Touchez un match pour revoir toutes ses stats et sa timeline.' },
            { term: 'PDF', desc: 'Retéléchargez la feuille de match à tout moment.' },
            { term: 'Excel', desc: 'Exporte un match, tout l’historique ou les stats de la saison en fichier CSV, à ouvrir dans Excel, Numbers ou Google Sheets.' },
            { term: 'Image', desc: 'Crée une image au format story (score final, fiche joueur, podium d’un tournoi, classement d’un championnat) à partager sur Instagram, WhatsApp ou Facebook, ou à télécharger.' },
          ],
        },
      ],
    },
    {
      id: 'tournois',
      title: 'Tournois',
      to: '/tournaments',
      intro: 'Créez le tournoi, l’app génère les matchs, les répartit sur les terrains et tient le classement à jour.',
      blocks: [
        {
          type: 'terms',
          heading: 'Les formats',
          items: [
            { term: 'Tous contre tous', desc: 'Chaque équipe rencontre toutes les autres.' },
            { term: 'Poules', desc: 'Les équipes sont réparties en poules ; les premières de chaque poule vont en phase finale.' },
            { term: 'Ronde suisse', desc: 'À chaque ronde, les équipes de classement proche se rencontrent. Idéal avec beaucoup d’équipes et peu de temps.' },
            { term: 'Double élimination', desc: 'Une défaite envoie dans le tableau de repêchage, la deuxième élimine. Les vainqueurs du tableau principal et du repêchage jouent la grande finale ; si l’équipe du repêchage la gagne, une finale décisive peut être rejouée. L’ordre de la liste sert de têtes de série.' },
            { term: 'Phase finale', desc: 'Facultative : finale seule, ou demi-finales, quarts… Pas de match nul possible.' },
            { term: 'Classement complet', desc: 'Avec des poules, chaque équipe joue ensuite pour sa place.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Options',
          items: [
            { term: 'Terrains', desc: 'Les matchs sont répartis sur les terrains disponibles. Une équipe ne joue jamais deux matchs en même temps.' },
            { term: 'Aller-retour', desc: 'Chaque affiche est jouée deux fois.' },
            { term: 'Arbitrage', desc: 'Chaque match est arbitré par une équipe au repos, choisie automatiquement : jamais une équipe qui joue au même moment, de préférence pas juste avant ou après, et le même nombre d’arbitrages pour tous. Visible sur le planning et sur la page publique.' },
            { term: 'Horaires', desc: 'Heure de début, mi-temps, pauses et changements : l’app estime l’heure de chaque match et l’heure de fin, et les recalcule selon l’avancement.' },
          ],
        },
        {
          type: 'steps',
          heading: 'Pendant le tournoi',
          items: [
            'Suivez les onglets Planning, Résultats, Classement (Tableau en double élimination) et Équipes.',
            'Saisissez un score directement, ou appuyez sur Jouer maintenant pour suivre le match avec la feuille de stats, les stats joueurs ou le scoreur.',
            'À la fin d’un match lancé depuis le tournoi, son score est reporté automatiquement.',
            'Pas de téléphone à chaque table ? « Feuilles de match (PDF) », dans le planning, imprime une feuille pré-remplie par match à jouer (phase, terrain, heure, arbitre), deux par page.',
            'Quand tous les matchs sont joués, validez le tournoi pour afficher le podium et le classement final, à exporter en PDF.',
          ],
        },
      ],
    },
    {
      id: 'championnat',
      title: 'Championnat sur plusieurs journées',
      to: '/tournaments',
      intro: 'Chaque journée est un tournoi. Le championnat les regroupe et additionne les points de chaque équipe.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Dans Tournois, en bas : donnez un nom au championnat et créez-le.',
            'Cochez les tournois qui en font partie (une journée chacun) et choisissez le barème.',
            'Le classement général se met à jour à chaque journée ; une journée en cours compte de façon provisoire.',
          ],
        },
        {
          type: 'terms',
          heading: 'Les barèmes',
          items: [
            { term: 'Selon le nombre d’équipes', desc: 'Le dernier de la journée marque 1 point, l’avant-dernier 2… le vainqueur autant de points qu’il y avait d’équipes.' },
            { term: 'Barème fixe', desc: '10 points au vainqueur, puis 8, 6, 5, 4, 3, 2, et 1 point de participation.' },
            { term: 'Égalité', desc: 'Départagée par le nombre de victoires de journée, puis de 2es places, etc.' },
          ],
        },
      ],
    },
    {
      id: 'public',
      title: 'Partager avec le public',
      intro: 'Les spectateurs suivent le tournoi en direct sur leur téléphone, sans rien installer.',
      blocks: [
        {
          type: 'steps',
          heading: 'Côté organisateur',
          items: [
            'Dans le tournoi, appuyez sur Partager, puis sur Activer le partage.',
            'Affichez le QR code à l’entrée de la salle, ou envoyez le lien spectateur.',
            'Donnez le lien organisateur aux personnes qui saisissent les scores, et à elles seules.',
          ],
        },
        {
          type: 'terms',
          heading: 'Les deux liens',
          items: [
            { term: 'Lien spectateur', desc: 'Lecture seule, mis à jour en direct. À partager largement.' },
            { term: 'Lien organisateur', desc: 'Permet de saisir et corriger les scores. À garder pour l’équipe d’organisation.' },
            { term: 'Code du tournoi', desc: 'Une alternative au lien : à entrer dans Tournois, puis Suivre.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Côté public',
          items: [
            { term: 'Rejoindre', desc: 'Scannez le QR code avec l’appareil photo, ouvrez le lien, ou entrez le code dans Tournois.' },
            { term: 'En direct', desc: 'La page se met à jour seule, avec l’heure de la dernière mise à jour.' },
            { term: 'Suivre une équipe', desc: 'Affiche uniquement ses prochains matchs et ses résultats.' },
            { term: 'Me prévenir', desc: 'Après avoir choisi une équipe : une notification (et une vibration) quand elle passe au prochain créneau, puis quand son match commence, et de même quand elle doit arbitrer. La page doit rester ouverte, même en arrière-plan.' },
            { term: 'Plein écran', desc: 'Pour afficher le tournoi sur une télé ou un vidéoprojecteur.' },
            { term: 'Écran de salle', desc: 'Dans Partager, « Écran de salle » ouvre une page pour la télé de l’accueil : elle alterne toute seule terrains, prochains matchs, classement (ou tableau) et derniers résultats, avec le QR code pour suivre sur son téléphone. Flèches pour changer de vue, espace pour mettre en pause.' },
          ],
        },
        { type: 'note', text: 'Arrêter le partage désactive les liens. Le tournoi reste sur votre appareil. Sans connexion, les scores saisis sont envoyés dès le retour du réseau.' },
      ],
    },
    {
      id: 'equipes',
      title: 'Équipes aléatoires',
      to: '/teams',
      intro: 'Pour former des équipes équilibrées en quelques secondes, à l’entraînement ou avant un tournoi.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Ajoutez les joueurs un par un, ou collez une liste : un joueur par ligne, par exemple « Dupont Marie, F, 3 » (F ou G, niveau 1 à 3).',
            'Choisissez le nombre d’équipes, la mixité et l’équilibre des niveaux.',
            'Appuyez sur Créer les équipes. Refaites le tirage autant de fois que nécessaire.',
            'Copiez les équipes, créez un tournoi avec elles, ou lancez directement un match en stats joueurs.',
          ],
        },
      ],
    },
  ],
}

const en = {
  title: 'Guide',
  subtitle: 'How each part of the app works, for organizers and for the crowd.',
  tocLabel: 'Contents',
  open: 'Open',
  sections: [
    {
      id: 'essentiel',
      title: 'The basics',
      intro: 'Tchoukball Assistant runs in the browser, with no account. It works on phones, tablets and computers.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: 'Your data', desc: 'Matches, tournaments and line-ups are saved in this browser. Clearing the browser data deletes them.' },
            { term: 'Match in progress', desc: 'It is saved after every action. If the page closes, the home screen offers to pick it up where it left off.' },
            { term: 'Theme and language', desc: 'The buttons at the top right switch between light and dark themes and to French. Your choice is remembered.' },
            { term: 'Install the app', desc: 'On Android and computers, press Install in the top bar. On iPhone and iPad, in Safari: Share button, then “Add to Home Screen”.' },
            { term: 'Without network', desc: 'Once opened a first time, the app works offline: match tracking, scoreboard, history, tournaments. Only live sharing and sync wait for the network to come back.' },
            { term: 'Updates', desc: 'When a new version is ready, a banner offers to reload. Nothing is lost, even mid-match.' },
          ],
        },
      ],
    },
    {
      id: 'feuille',
      title: 'Stat sheet',
      to: '/stats',
      intro: 'Track every action of both teams during the match. One person at the side of the court is enough.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Give each team a name and a color, then set the number and length of halves.',
            'Press Start to run the clock.',
            'For each action, tap the + on the right line. Made a mistake? The Undo button at the bottom of the screen reverts the last action (several times in a row if needed, or Ctrl+Z).',
            'When it ends, press End match to see the results.',
          ],
        },
        {
          type: 'stats',
          heading: 'What each line counts',
          items: [
            { color: 'yellow', term: 'Balls', desc: 'One possession. Used to compute conversion (shots per possession).' },
            { color: 'green', term: 'Won', desc: 'Scored shot: +1 point for the team.' },
            { color: 'red', term: 'Given', desc: 'Shot that gives the point away: +1 point for the other team.' },
            { color: 'blue', term: 'Caught', desc: 'Shot caught by the opposing defense: no point, possession lost.' },
            { color: 'orange', term: 'Frame', desc: 'Shooting fault (zone, frame…): no point, the ball goes to the opponent.' },
            { color: 'violet', term: 'Missed pass', desc: 'Pass lost or badly thrown.' },
            { color: 'magenta', term: 'Technical foul', desc: 'Foul outside a shot: walking, more than three passes, etc.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Clock',
          items: [
            { term: 'Start / Pause', desc: 'Runs or stops the time of the half.' },
            { term: 'Next half', desc: 'Moves to the next half.' },
            { term: 'Reset half / Reset all', desc: 'Resets the clock of the half, or of the whole match. Stats stay as they are.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Results',
          items: [
            { term: 'Offensive efficiency', desc: 'Shots won divided by total shots.' },
            { term: 'Defensive efficiency', desc: 'Opponent shots caught divided by total opponent shots.' },
            { term: 'Conversion', desc: 'Shots per possession.' },
            { term: 'Timeline', desc: 'How the score moved minute by minute, with every shot.' },
            { term: 'PDF', desc: 'The full match sheet, to download and share.' },
          ],
        },
      ],
    },
    {
      id: 'joueurs',
      title: 'Player stats',
      to: '/players',
      intro: 'Track each player individually, with one or two teams.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Choose one or two teams, then enter the player names. The Lineups button saves a team so you can load it next time.',
            'During the match, tap a stat first, then the player.',
            'The stat stays selected: you can tap several players in a row.',
            'Substitutions: the first 7 players of each team start on court. Tap On court / Bench on a card to take a player off or bring them on; their playing time follows the clock and shows in the results, history, season and Excel export.',
          ],
        },
        {
          type: 'stats',
          heading: 'The stats',
          items: [
            { color: 'green', term: 'Points scored', desc: 'Successful shot: +1 for their team.' },
            { color: 'slate', term: 'Unconverted shots', desc: 'Shot without a point (caught by the opponent).' },
            { color: 'red', term: 'Points given', desc: 'Shot that gives the point to the opponent.' },
            { color: 'orange', term: 'Shooting faults', desc: 'Fault made while shooting.' },
            { color: 'blue', term: 'Solo defense', desc: 'Ball caught alone in defense.' },
            { color: 'aqua', term: 'Def. participation', desc: 'Part of a successful defense.' },
            { color: 'yellow', term: 'Missed defense', desc: 'Ball the player should have caught.' },
            { color: 'violet', term: 'Missed pass', desc: 'Pass lost or badly thrown.' },
            { color: 'magenta', term: 'Technical foul', desc: 'Foul outside a shot.' },
            { color: 'ink', term: 'Sanctions', desc: 'Warning or exclusion.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Match awards',
          items: [
            { term: 'BOPM', desc: 'Best attacker: points scored, efficiency and points given.' },
            { term: 'BDPM', desc: 'Best defender: solo defenses and defensive participations.' },
            { term: 'MVP', desc: 'Most complete player, counting attack, defense and fouls.' },
          ],
        },
      ],
    },
    {
      id: 'saison',
      title: 'Players and season',
      to: '/season',
      intro: 'Every match tracked with player stats feeds the player cards: a reference for the coach across the season.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: 'Table', desc: 'Games played, points, average per match, efficiency, defense, fouls and minutes played for each player. Tap a header to sort.' },
            { term: 'Period', desc: 'This season (since September 1st) or the whole history.' },
            { term: 'Player card', desc: 'Key numbers, points match after match, every stat (total and per match) and the list of their matches.' },
            { term: 'Same player', desc: 'Players are matched by name: keep the same spelling from one match to the next (saved lineups help).' },
          ],
        },
      ],
    },
    {
      id: 'scoreur',
      title: 'Scoreboard',
      to: '/scoreboard',
      intro: 'A big scoreboard for the crowd: on a TV, a projector or a tablet facing the stands.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: '+1 / −1', desc: 'The large buttons under each score. Undo, at the bottom, reverts the last point.' },
            { term: 'Clock', desc: 'Tap the clock to pause or resume it.' },
            { term: 'Logos', desc: 'Add each team’s logo before the match; it shows on their side.' },
            { term: 'End', desc: 'Shows the final score and the score of each half.' },
          ],
        },
        { type: 'note', text: 'In scoreboard mode, only the score is saved to the history, not the stats.' },
      ],
    },
    {
      id: 'direct',
      title: 'Broadcast a match live',
      intro: 'The score and clock show on another screen, controlled from your phone: the hall’s TV, or the spectators’ phones.',
      blocks: [
        {
          type: 'steps',
          items: [
            'During a match (stat sheet, player stats or scoreboard), press Broadcast, then Start broadcasting.',
            'On the TV or projector, open the link shown (or scan the QR code) and go full screen.',
            'Keep entering on the phone: the TV follows the score, clock and half live.',
          ],
        },
        {
          type: 'terms',
          items: [
            { term: 'Next matches', desc: 'The link stays the same: at the next match, the TV switches by itself.' },
            { term: 'Crowd', desc: 'The same link works on phones: people who could not come follow from home.' },
            { term: 'Stop', desc: 'Broadcast, then Stop broadcasting: the link stops working.' },
          ],
        },
      ],
    },
    {
      id: 'historique',
      title: 'History',
      to: '/history',
      intro: 'Every finished match, newest first.',
      blocks: [
        {
          type: 'terms',
          items: [
            { term: 'Search', desc: 'Type a team name.' },
            { term: 'Filter', desc: 'By match type: stat sheet, player stats or scoreboard.' },
            { term: 'Details', desc: 'Tap a match to see all its stats and its timeline again.' },
            { term: 'PDF', desc: 'Download the match sheet again at any time.' },
            { term: 'Excel', desc: 'Exports a match, the whole history or the season stats as a CSV file, to open in Excel, Numbers or Google Sheets.' },
            { term: 'Image', desc: 'Creates a story-format image (final score, player card, tournament podium, league standings) to share on Instagram, WhatsApp or Facebook, or to download.' },
          ],
        },
      ],
    },
    {
      id: 'tournois',
      title: 'Tournaments',
      to: '/tournaments',
      intro: 'Create the tournament; the app builds the fixtures, spreads them across courts and keeps the standings up to date.',
      blocks: [
        {
          type: 'terms',
          heading: 'Formats',
          items: [
            { term: 'Round robin', desc: 'Every team plays every other team.' },
            { term: 'Groups', desc: 'Teams are split into groups; the top teams of each group go to the knockout stage.' },
            { term: 'Swiss rounds', desc: 'Each round, teams with a similar ranking play each other. Ideal with many teams and little time.' },
            { term: 'Double elimination', desc: 'A loss sends a team to the lower bracket, a second one eliminates it. The upper and lower bracket winners play the grand final; if the lower-bracket team wins it, a deciding final can be replayed. The list order sets the seeds.' },
            { term: 'Knockout stage', desc: 'Optional: final only, or semi-finals, quarter-finals… No draws allowed.' },
            { term: 'Full placement', desc: 'With groups, every team then plays for its final place.' },
          ],
        },
        {
          type: 'terms',
          heading: 'Options',
          items: [
            { term: 'Courts', desc: 'Matches are spread over the available courts. A team never plays two matches at once.' },
            { term: 'Home and away', desc: 'Every fixture is played twice.' },
            { term: 'Refereeing', desc: 'Each match is refereed by a resting team, picked automatically: never a team playing at the same time, preferably not right before or after, and the same number of duties for everyone. Shown on the schedule and the public page.' },
            { term: 'Schedule', desc: 'Start time, halves, breaks and changeovers: the app estimates when each match starts and when the day ends, and updates it as play goes on.' },
          ],
        },
        {
          type: 'steps',
          heading: 'During the tournament',
          items: [
            'Use the Schedule, Results, Standings (Bracket in double elimination) and Teams tabs.',
            'Enter a score directly, or press Play now to track the match with the stat sheet, player stats or the scoreboard.',
            'When a match started from the tournament ends, its score is reported automatically.',
            'No phone at every table? “Match sheets (PDF)”, in the schedule, prints one pre-filled sheet per match to play (stage, court, time, referee), two per page.',
            'Once every match is played, validate the tournament to show the podium and the final standings, which you can export as a PDF.',
          ],
        },
      ],
    },
    {
      id: 'championnat',
      title: 'League over several matchdays',
      to: '/tournaments',
      intro: 'Each matchday is a tournament. The league groups them and adds up each team’s points.',
      blocks: [
        {
          type: 'steps',
          items: [
            'In Tournaments, at the bottom: name the league and create it.',
            'Tick the tournaments that belong to it (one matchday each) and choose the points scale.',
            'The overall standings update after each matchday; a matchday in progress counts provisionally.',
          ],
        },
        {
          type: 'terms',
          heading: 'Points scales',
          items: [
            { term: 'By number of teams', desc: 'Last on the day scores 1 point, second to last 2… the winner as many points as there were teams.' },
            { term: 'Fixed scale', desc: '10 points for the winner, then 8, 6, 5, 4, 3, 2, and 1 point for taking part.' },
            { term: 'Ties', desc: 'Broken by the number of matchday wins, then 2nd places, and so on.' },
          ],
        },
      ],
    },
    {
      id: 'public',
      title: 'Sharing with the crowd',
      intro: 'Spectators follow the tournament live on their phones, with nothing to install.',
      blocks: [
        {
          type: 'steps',
          heading: 'For organizers',
          items: [
            'In the tournament, press Share, then Turn on sharing.',
            'Show the QR code at the entrance, or send the spectator link.',
            'Give the organizer link only to the people who enter scores.',
          ],
        },
        {
          type: 'terms',
          heading: 'The two links',
          items: [
            { term: 'Spectator link', desc: 'Read-only, updated live. Share it widely.' },
            { term: 'Organizer link', desc: 'Lets you enter and correct scores. Keep it within the organizing team.' },
            { term: 'Tournament code', desc: 'An alternative to the link: enter it in Tournaments, then Follow.' },
          ],
        },
        {
          type: 'terms',
          heading: 'For the crowd',
          items: [
            { term: 'Join', desc: 'Scan the QR code with the camera, open the link, or enter the code in Tournaments.' },
            { term: 'Live', desc: 'The page updates by itself and shows when it was last updated.' },
            { term: 'Follow a team', desc: 'Shows only that team’s next matches and results.' },
            { term: 'Notify me', desc: 'Once a team is chosen: a notification (and a vibration) when it moves to the next slot, then when its match starts, and likewise when it has to referee. The page must stay open, even in the background.' },
            { term: 'Full screen', desc: 'To show the tournament on a TV or a projector.' },
            { term: 'Hall screen', desc: 'In Share, “Hall screen” opens a page for the TV at the entrance: it cycles through courts, next matches, standings (or bracket) and latest results, with the QR code to follow on a phone. Arrow keys switch views, space pauses.' },
          ],
        },
        { type: 'note', text: 'Stopping sharing disables the links. The tournament stays on your device. Offline, scores you enter are sent as soon as the connection is back.' },
      ],
    },
    {
      id: 'equipes',
      title: 'Random teams',
      to: '/teams',
      intro: 'Build balanced teams in seconds, for training or before a tournament.',
      blocks: [
        {
          type: 'steps',
          items: [
            'Add players one by one, or paste a list: one player per line, for example “Smith Mary, F, 3” (F or G, level 1 to 3).',
            'Choose the number of teams, mixed teams and level balancing.',
            'Press Create teams. Redraw as many times as you need.',
            'Copy the teams, create a tournament with them, or start a player-stats match right away.',
          ],
        },
      ],
    },
  ],
}

export default { fr, en }
