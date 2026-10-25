// Chaque stat a sa propre couleur (palette validée daltonisme, voir DESIGN.md) :
// la couleur sert à repérer la ligne d'un coup d'œil, pas à juger bon/mauvais.
export const CATEGORIES = [
  {
    id: 'tirs',
    titleKey: 'match.categories.shots',
    deriveTotal: team => team.tGagne + team.tDonne + team.tCatche + team.tFaute,
    items: [
      { id: 'tGagne',  labelKey: 'match.stats.won',      color: 'green' },
      { id: 'tDonne',  labelKey: 'match.stats.given',    color: 'red' },
      { id: 'tCatche', labelKey: 'match.stats.caught',   color: 'blue' },
      { id: 'tFaute',  labelKey: 'match.stats.frame',    color: 'orange' },
    ],
  },
  {
    id: 'passes',
    titleKey: 'match.categories.passes',
    deriveTotal: null,
    items: [
      { id: 'pRatee', labelKey: 'match.stats.missed', color: 'violet' },
    ],
  },
  {
    id: 'fautes',
    titleKey: 'match.categories.fouls',
    deriveTotal: null,
    items: [
      { id: 'fTech', labelKey: 'match.stats.techFoul', color: 'magenta' },
    ],
  },
]
