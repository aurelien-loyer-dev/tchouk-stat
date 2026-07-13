export const CATEGORIES = [
  {
    id: 'tirs',
    titleKey: 'match.categories.shots',
    deriveTotal: team => team.tGagne + team.tDonne + team.tCatche + team.tFaute,
    items: [
      { id: 'tGagne',  labelKey: 'match.stats.won',   hl: true },
      { id: 'tDonne',  labelKey: 'match.stats.given', color: 'red' },
      { id: 'tCatche', labelKey: 'match.stats.caught' },
      { id: 'tFaute',  labelKey: 'match.stats.frame', color: 'amber' },
    ],
  },
  {
    id: 'passes',
    titleKey: 'match.categories.passes',
    deriveTotal: null,
    items: [
      { id: 'pRatee', labelKey: 'match.stats.missed', color: 'amber' },
    ],
  },
  {
    id: 'fautes',
    titleKey: 'match.categories.fouls',
    deriveTotal: null,
    items: [
      { id: 'fTech', labelKey: 'match.stats.techFoul', color: 'red' },
    ],
  },
]
