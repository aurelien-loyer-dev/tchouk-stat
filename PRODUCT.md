# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Coachs, arbitres de table et bénévoles de clubs de tchoukball qui suivent un match en direct, principalement sur tablette ou ordinateur posé au bord du terrain (le mobile reste supporté). Ils tapent vite pendant l'action et relisent les chiffres après le match.

## Product Purpose
Tchoukball Assistant permet de noter les statistiques d'un match (par équipe ou par joueur), d'afficher un grand tableau de score, de gérer des tournois (poules, round-robin, système suisse, phases finales) et d'exporter les résultats en PDF. Le succès : saisir sans erreur pendant le jeu, comprendre les résultats d'un coup d'œil.

## Operating Context
Usage en salle ou en extérieur, souvent sous éclairage variable, pendant le jeu. Données stockées en local (localStorage), synchronisation optionnelle des matchs via Supabase. Interface bilingue FR/EN (détection automatique).

## Capabilities and Constraints
- Modes : feuille de stats d'équipe, stats par joueur, tableau de score plein écran, tournois.
- Historique des matchs, compositions d'équipes sauvegardées, export PDF.
- Couleurs d'équipe choisies par l'utilisateur : elles doivent rester lisibles sur fond clair comme sombre.
- Stack : React 19 + Vite, CSS par feature, i18next.

## Brand Commitments
- Nom : « Tchoukball Assistant ». Crédit en pied de page avec le logo AL (`src/public/logo_al.png`).
- Ton : sobre, direct, sans jargon inutile.

## Product Principles
1. La saisie en direct passe avant tout : grosses cibles, retour immédiat, aucune action destructrice sans confirmation.
2. Lisible d'un coup d'œil : chiffres grands et tabulaires, hiérarchie claire.
3. Sobre : la couleur sert l'information (équipes, états), pas la décoration.
4. Thème clair et sombre de même qualité ; par défaut celui du système, avec un choix mémorisé.

## Accessibility & Inclusion
Contraste WCAG AA minimum dans les deux thèmes, focus clavier visible, respect de `prefers-reduced-motion`.
