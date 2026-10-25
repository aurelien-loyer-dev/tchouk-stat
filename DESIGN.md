# Design — Tchoukball Assistant

Direction : **lignes du gymnase**. Une interface d'outil sobre qui emprunte la salle de sport, pas le tableau de bord générique : sol clair (érable) ou sombre (parquet laqué), filets fins comme les lignes du terrain, un seul accent bleu-vert.

## Thème

- Clair et sombre, de qualité égale. Par défaut le réglage du système ; le bouton de la barre d'app force l'autre thème et le mémorise (`localStorage: tchouk_theme`).
- `index.html` pose `data-theme` avant le premier rendu (pas de flash). Logique : `src/theme/useTheme.js`.
- Tous les jetons sont dans `src/index.css` (`:root`, `[data-theme="dark"]` et le repli `prefers-color-scheme`).

## Jetons

| Rôle | Clair | Sombre |
|---|---|---|
| `--bg` fond | `#f4efe6` | `#14120f` |
| `--s1` surface | `#fcfaf6` | `#1d1a16` |
| `--s2` surface enfoncée / survol | `#ede6da` | `#27231e` |
| `--bdr` filet | `#dcd2c1` | `#332e27` |
| `--bdr-strong` filet fort / contour de champ | `#c3b6a1` | `#4a4339` |
| `--txt` encre | `#1d1915` | `#eee8de` |
| `--dim` texte secondaire | `#5f5548` | `#a99d8c` |
| `--acc` accent (actions, focus, sélection) | `#0d6a70` | `#5fb8b9` |
| `--ok` / `--err` / `--warn` | `#2c7a35` / `#b3261e` / `#94570a` | `#6cc475` / `#f08277` / `#e3a646` |

Chaque état a sa version douce (`--ok-soft`, `--err-soft`, `--warn-soft`, `--acc-soft`) pour les fonds.

### Règles de couleur
- L'accent sert uniquement aux actions principales, au focus et à la sélection.
- Vert / rouge / ambre uniquement pour le sens des stats (gagné, donné/faute, cadre/passe ratée).
- Couleurs d'équipe : choisies par l'utilisateur. Le texte coloré passe par `teamTextStyle()` (mélange `color-mix` avec l'encre du thème pour rester lisible), les pastilles par `teamSwatchStyle()` (anneau fin).

## Typographie

- **Archivo Variable** (auto-hébergée via `@fontsource-variable/archivo`), chiffres tabulaires partout.
- Échelle fixe : 13 (libellés de section) · 14–15 (secondaire) · 16 (corps) · 17–18 (titres de bloc) · 28 (h1) · 40 (chrono) · 56–72 (scores), jusqu'à ~320px sur le tableau de score plein écran.
- Graisses : 500–550 texte, 600–650 libellés/titres, 700–750 chiffres.
- Pas de capitales espacées : les titres de section sont en casse normale, soulignés d'un filet.

## Composants

- **Barre d'app** (`components/AppBar.jsx`) : marque (la zone interdite en deux traits), langue, thème. Collante.
- **En-tête d'écran** (`components/PageHeader.jsx`) : lien Retour avec chevron, titre, sous-titre, actions.
- **Icônes** (`components/Icon.jsx`) : un seul jeu, trait 2px, 24×24. Pas de glyphes Unicode comme icônes.
- **Listes de choix** : lignes pleine largeur séparées par des filets (accueil), pas de grille de cartes.
- **Boutons** : `.btn-acc` (principal), `.btn-ghost` (secondaire), `.btn-danger`, `.btn-mini`, `.btn-link`, `.icon-btn`. Hauteur 48px (36–44 pour les petits).
- **Compteurs de stats** : libellé · − · valeur · +, cibles de 56–64px, le + porte la teinte d'état.
- **Signature** : le demi-cercle de la zone interdite tracé en filet sous le séparateur du tableau de score (`.sb-scores::after`) ; la ligne médiane sépare les deux camps du scoreur.
- Rayons : 12px (panneaux), 8px (contrôles), pilule pour les petites étiquettes. Élévation par filet, pas d'ombre sur les panneaux.

## Mouvement

150–250 ms, ease-out. Seuls les compteurs « rebondissent » quand ils changent. `prefers-reduced-motion` coupe tout.

## Mise en page

Contenu max 1120px (formulaires et listes ~760px), gouttière 24px (16px sur mobile). Pensé d'abord pour tablette/ordinateur : deux colonnes d'équipes côte à côte, une seule colonne sous 720px.
