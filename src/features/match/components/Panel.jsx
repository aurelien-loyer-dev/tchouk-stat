import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../constants'
import StatRow from './StatRow'
import CatHeader from './CatHeader'

export default function Panel({ team, teamIdx, numTeams, onAdj }) {
  const { t } = useTranslation()
  const cls = numTeams === 2 ? `p${teamIdx}` : 'ps'

  return (
    <div className={`panel ${cls}`}>
      <div className="ph">{team.name}</div>

      {/* Possession */}
      <div className="cat-hd cat-first"><span>{t('match.categories.possession')}</span></div>
      <StatRow
        label={t('match.stats.balls')}
        count={team.pos}
        onInc={() => onAdj(teamIdx, 'pos', 1)}
        onDec={() => onAdj(teamIdx, 'pos', -1)}
      />

      {/* Catégories */}
      {CATEGORIES.map(cat => (
        <div key={cat.id}>
          <CatHeader
            title={t(cat.titleKey)}
            total={cat.deriveTotal ? cat.deriveTotal(team) : null}
          />
          {cat.items.map(item => (
            <StatRow
              key={item.id}
              label={t(item.labelKey)}
              count={team[item.id]}
              hl={item.hl}
              color={item.color}
              onInc={() => onAdj(teamIdx, item.id, 1)}
              onDec={() => onAdj(teamIdx, item.id, -1)}
            />
          ))}
        </div>
      ))}

      {/* Score adverse (1 équipe uniquement) */}
      {numTeams === 1 && (
        <>
          <div className="cat-hd"><span>{t('match.categories.opponent')}</span></div>
          <StatRow
            label={t('match.stats.opponentScore')}
            count={team.padv}
            onInc={() => onAdj(teamIdx, 'padv', 1)}
            onDec={() => onAdj(teamIdx, 'padv', -1)}
          />
        </>
      )}
    </div>
  )
}
