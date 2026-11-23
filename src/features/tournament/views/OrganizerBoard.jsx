import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'
import { involves, isPlayed, listFixtures, nextStep, recentResults, standingTables, upcoming } from '../overview'
import MatchRow from '../components/MatchRow'
import CrossTable from '../components/CrossTable'
import ValidationBanner from '../components/ValidationBanner'
import ScoreEntry from '../components/board/ScoreEntry'
import StandingsBoard from '../components/board/StandingsBoard'
import BracketBoard from '../components/board/BracketBoard'
import TeamFilter from '../components/board/TeamFilter'

const TABS = ['todo', 'done', 'table']

function FixtureEditRow({ fixture, tournament, onUpdate, focusTeam }) {
  const m = fixture.match
  const mine = focusTeam && involves(fixture, focusTeam)
  return (
    <div className={`ob-row${mine ? ' ob-row-mine' : ''}`}>
      {fixture.label && <span className="fx-label ob-row-label">{fixture.label}</span>}
      <MatchRow
        key={m.id + m.score1 + m.score2 + m.team1 + m.team2}
        match={m}
        onScore={(s1, s2) => onUpdate(fixture.save(tournament, s1, s2))}
      />
    </div>
  )
}

// Poste de pilotage : prochain match en grand, ce qu'il reste à jouer,
// l'action qui débloque la suite, puis résultats et classements.
export default function OrganizerBoard({ tournament, onUpdate, finished, onValidate }) {
  const { t } = useTranslation()
  const [tab, setTab]     = useState('todo')
  const [focus, setFocus] = useState(null)

  const fixtures = useMemo(() => listFixtures(tournament), [tournament])
  const tables   = useMemo(() => standingTables(tournament), [tournament])
  const todo     = useMemo(() => upcoming(fixtures), [fixtures])
  const done     = useMemo(() => recentResults(fixtures), [fixtures])
  const step     = nextStep(tournament)

  const playedCount = fixtures.filter(f => isPlayed(f.match)).length
  const pct = fixtures.length ? Math.round((playedCount / fixtures.length) * 100) : 0
  const blocked = fixtures.length - playedCount - todo.length // en attente des tours précédents

  const featured = todo[0]
  const todoList = (focus ? todo.filter(f => involves(f, focus)) : todo).filter(f => f !== featured || focus)
  const doneList = focus ? done.filter(f => involves(f, focus)) : done
  const counts   = { todo: todo.length, done: done.length }


  return (
    <div className="ob">
      <div className="ob-prog">
        <div className="ob-prog-text">
          <strong>{t('tournament.matchesPlayed', { done: playedCount, total: fixtures.length })}</strong>
          {blocked > 0 && <span>{t('tournament.board.waiting', { count: blocked })}</span>}
        </div>
        <div className="trn-prog-track"><div className="trn-prog-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      {step && (
        <div className="ob-step" role="status">
          <div>
            <div className="ob-step-title">{t(`tournament.board.step.${step.kind}.title`, { n: step.n })}</div>
            <div className="ob-step-text">{t(`tournament.board.step.${step.kind}.text`)}</div>
          </div>
          <button className="btn-acc" onClick={() => onUpdate(step.apply(tournament))}>
            {t(`tournament.board.step.${step.kind}.button`, { n: step.n })}
            <Icon name="chevron" size={18} />
          </button>
        </div>
      )}

      {finished && !step && <ValidationBanner onValidate={onValidate} />}

      {featured && (
        <ScoreEntry
          fixture={featured}
          knockout={featured.stage === 'knockout'}
          onSave={(s1, s2) => onUpdate(featured.save(tournament, s1, s2))}
        />
      )}

      {featured && todo.length > 1 && (
        <div className="ob-then">
          <span className="ob-then-label">{t('tournament.board.then')}</span>
          {todo.slice(1, 4).map(f => (
            <span key={f.match.id} className="ob-then-item">
              {f.match.team1} <span className="ob-then-vs">{t('tournament.board.vs')}</span> {f.match.team2}
            </span>
          ))}
        </div>
      )}

      <div className="ob-tabs" role="tablist">
        {TABS.map(id => (
          <button key={id} role="tab" aria-selected={tab === id} className={`ob-tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>
            {t(`tournament.board.tabs.${id}`)}
            {id in counts && <span className="ob-count">{counts[id]}</span>}
          </button>
        ))}
      </div>

      {tab !== 'table' && (
        <TeamFilter teams={tournament.teams} value={focus} onChange={setFocus} label={t('tournament.board.filterTeam')} />
      )}

      {tab === 'todo' && (
        todoList.length === 0 ? (featured && !focus ? (
          <p className="ob-hint">{t('tournament.board.onlyFeatured')}</p>
        ) : (
          <p className="ob-empty">{focus ? t('tournament.board.noUpcomingTeam', { team: focus }) : t('tournament.board.noUpcoming')}</p>
        )) : (
          <div className="ob-list">
            {todoList.map(f => <FixtureEditRow key={f.match.id} fixture={f} tournament={tournament} onUpdate={onUpdate} focusTeam={focus} />)}
          </div>
        )
      )}

      {tab === 'done' && (
        doneList.length === 0 ? (
          <p className="ob-empty">{t('tournament.board.noResults')}</p>
        ) : (
          <>
            <p className="ob-hint">{t('tournament.board.editHint')}</p>
            <div className="ob-list">
              {doneList.map(f => <FixtureEditRow key={f.match.id} fixture={f} tournament={tournament} onUpdate={onUpdate} focusTeam={focus} />)}
            </div>
          </>
        )
      )}

      {tab === 'table' && (
        <div className="ob-tables">
          <div className={`sp-tables${tables.length > 1 ? ' sp-tables-multi' : ''}`}>
            {tables.map(table => (
              <div key={table.id} className="ob-table-block">
                <StandingsBoard table={table} fixtures={fixtures} detailed />
                {tournament.format !== 'swiss' && (
                  <details className="ob-xt">
                    <summary>{t('tournament.crossTable')}</summary>
                    <CrossTable teams={table.teams} matches={table.matches} />
                  </details>
                )}
              </div>
            ))}
          </div>
          {tournament.knockoutRounds && (
            <>
              <h3 className="sp-sec-title">{t('tournament.pdf.knockoutStage')}</h3>
              <BracketBoard rounds={tournament.knockoutRounds} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
