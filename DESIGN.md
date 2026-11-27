# Design — Tchoukball Assistant

Direction : **table de marque**. Un outil de mesure sobre, pas une affiche : gris neutres (graphite), filets fins, actions en encre. Aucune couleur décorative : la couleur ne sert qu'à distinguer (équipes, états, une couleur par stat). Un seul élément expressif : les chiffres larges des scores et du chrono, comme sur un panneau d'affichage.

## Thème

- Clair et sombre, de qualité égale. Par défaut le réglage du système ; le bouton de la barre d'app force l'autre thème et le mémorise (`localStorage: tchouk_theme`).
- `index.html` pose `data-theme` avant le premier rendu (pas de flash). Logique : `src/theme/useTheme.js`.
- Tous les jetons sont dans `src/index.css` (`:root`, `[data-theme="dark"]` et le repli `prefers-color-scheme`).

## Jetons

| Rôle | Clair | Sombre |
|---|---|---|
| `--bg` fond | `#f3f4f6` | `#0e1012` |
| `--s1` surface | `#ffffff` | `#16191c` |
| `--s2` surface enfoncée / survol | `#eceef1` | `#1e2226` |
| `--bdr` filet | `#dfe2e6` | `#2a2f35` |
| `--bdr-strong` filet fort / contour de champ | `#c4c9d0` | `#3b424a` |
| `--txt` encre | `#14171b` | `#eceef1` |
| `--dim` texte secondaire | `#59616b` | `#9aa3ad` |
| `--acc` actions principales, focus, sélection (= encre) | `#14171b` | `#eceef1` |
| `--shell` panneau plein (en-têtes des pages publiques de tournoi) | `#14171b` | `#1e2226` |
| `--ok` / `--err` / `--warn` | `#1d7a3a` / `#bf2a2a` / `#8f5600` | `#4cc27a` / `#f2777a` / `#e3a646` |

Pastilles de mode : stats = `--acc`, joueurs = `--mode-player`, scoreur = `--warn`.

Chaque état a sa version douce (`--ok-soft`, `--err-soft`, `--warn-soft`, `--acc-soft`) pour les fonds.

### Règles de couleur
- L'accent sert uniquement aux actions principales, au focus et à la sélection.
- **Une couleur par stat**, pour repérer une ligne de mémoire sans lire : pastille carrée devant le libellé, bouton + au fond légèrement teinté (10 %) et au signe coloré. Palette catégorielle validée (contraste + daltonisme) ; le libellé reste toujours visible, la couleur n'est jamais seule.

| Stat (feuille / joueurs) | Couleur | Clair | Sombre |
|---|---|---|---|
| Ballons · Défense ratée | jaune `--st-yellow` | `#eda100` | `#c98500` |
| Gagné · Points marqués | vert `--st-green` | `#008300` | `#008300` |
| Donné · Points donnés | rouge `--st-red` | `#e34948` | `#e66767` |
| Catché · Défense solo | bleu `--st-blue` | `#2a78d6` | `#3987e5` |
| Cadre · Fautes de tir | orange `--st-orange` | `#eb6834` | `#d95926` |
| Passe ratée | violet `--st-violet` | `#6250d6` | `#9085e9` |
| Faute technique | magenta `--st-magenta` | `#e87ba4` | `#d55181` |
| Participation déf. | aqua `--st-aqua` | `#1baf7a` | `#199e70` |
| Tirs non transformés · Score adverse | ardoise `--st-slate` | `#6b7a89` | `#8796a5` |
| Sanctions | encre `--txt` | | |

- Les valeurs restent en encre (`--txt`), jamais dans la couleur de la stat.
- Rouge / vert / ambre d'état (`--err`, `--ok`, `--warn`) restent réservés aux actions destructrices, aux variations ±1 et aux alertes.
- Couleurs d'équipe : choisies par l'utilisateur. Le texte coloré passe par `teamTextStyle()` (mélange `color-mix` avec l'encre du thème pour rester lisible), les pastilles par `teamSwatchStyle()` (anneau fin).

## Logo

- Le cadre de renvoi vu de face, filet visible, et le ballon qui en repart (deux traits de mouvement). Blanc sur tuile encre `#14171b`, coins 15/64.
- Fichiers : `public/icons/logo.svg` (tuile arrondie, favicon), `logo-full.svg` (fond plein, pour les icônes « maskable » et Apple, dessin réduit à 74 % pour rester dans la zone sûre), PNG 32, 180, 192 et 512 générés à partir de ces SVG.

## Typographie

- **Archivo Variable** (auto-hébergée via `@fontsource-variable/archivo`), chiffres tabulaires partout.
- Chargée avec ses deux axes (`@fontsource-variable/archivo/standard.css` : graisse et chasse). Chasse large `--wide` (125 %) pour les titres h1, la marque, les scores, le chrono et les compteurs d'accueil ; chasse normale pour tout le reste.
- Échelle fixe : 13 (libellés de section) · 14–15 (secondaire) · 16 (corps) · 17–20 (titres de bloc) · 28–44 (h1) · 40 (chrono) · 56–72 (scores), jusqu'à ~320px sur le tableau de score plein écran.
- Graisses : 500–550 texte, 600–650 libellés/titres, 700–750 chiffres.
- Pas de capitales espacées : les titres de section sont en casse normale, soulignés d'un filet.

## Composants

- **Barre d'app** (`components/AppBar.jsx`) : surface translucide (`--s1` + flou) et filet bas, logo en tuile (couleur du texte, dessin couleur du fond) et nom en chasse large, langue, thème. Collante.
- **Accueil** : titre « Nouveau match » et sous-titre à gauche, compteurs matchs / tournois à droite (chiffres larges), sans panneau coloré. Les trois modes de saisie forment une seule bande divisée par des filets (`.launch`), pas trois cartes. « Organiser » est une liste à filets (`.rows`) avec le nombre d'éléments à droite.
- **Carte de match** (`components/MatchCard.jsx`) : pastille de mode, barres de couleur d'équipe, vainqueur en gras, actions PDF / suppression.
- **Guide** (`features/guide/`) : sommaire collant à gauche (puces en haut sur mobile), une section par partie de l'app avec un bouton Ouvrir. Étapes numérotées seulement pour les vraies séquences ; définitions en lignes à filet (terme | explication), avec la pastille de couleur pour les stats. Textes FR/EN dans `content.js`.
- **Écran de diffusion** (`features/live/LiveMatchBoard.jsx`, `/m/CODE`) : sans barre d'app ni pied de page, chrono et scores en chasse large au plus grand, pastille En direct / Terminé, plein écran.
- **ScoreHero** (`components/ScoreHero.jsx`) : score final des écrans Résultats et Historique, une colonne par équipe coiffée d'un trait de sa couleur, séparées par un filet.
- **En-tête d'écran** (`components/PageHeader.jsx`) : lien Retour avec chevron, titre, sous-titre, actions.
- **Icônes** (`components/Icon.jsx`) : un seul jeu, trait 2px, 24×24. Pas de glyphes Unicode comme icônes.
- **Boutons** : `.btn-acc` (principal), `.btn-ghost` (secondaire), `.btn-danger`, `.btn-mini`, `.btn-link`, `.icon-btn`. Hauteur 48px (36–44 pour les petits).
- **Compteurs de stats** : pastille de couleur · libellé · − · valeur · +, cibles de 56–64px, le + porte la couleur de la stat.
- **Signature** : les chiffres larges (scores, chrono). La ligne médiane sépare les deux camps du scoreur, chaque camp coiffé d'une bande de sa couleur (le logo n'apparaît que s'il a été ajouté).
- Rayons : 12px (panneaux), 8px (contrôles), pilule pour les petites étiquettes. Élévation par filet ; seule une légère ombre au survol des éléments cliquables (tuiles, cartes de match).

## PWA

- `public/manifest.webmanifest` (nom, icônes, raccourcis), `src/sw-template.js` transformé en `dist/sw.js` au build (plugin `pwa` de `vite.config.js`, liste de pré-cache générée).
- Pages : réseau d'abord (3 s), puis `/index.html` en cache. Fichiers du build : cache d'abord. `/api/…` et autres domaines : jamais en cache.
- Mise à jour : la nouvelle version attend ; `PwaBanner` propose « Recharger » (message `SKIP_WAITING`). Pastille « Hors ligne » dans la barre d'app.

## Mouvement

150–250 ms, ease-out. Seuls les compteurs « rebondissent » quand ils changent. `prefers-reduced-motion` coupe tout.

## Mise en page

Contenu max 1120px (formulaires et listes ~760px), gouttière 24px (16px sur mobile). Pensé d'abord pour tablette/ordinateur : deux colonnes d'équipes côte à côte, une seule colonne sous 720px.
