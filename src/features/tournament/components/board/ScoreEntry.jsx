import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../../components/Icon'

function Side({ team, value, onChange, onStep, align }) {
  const { t } = useTranslation()
  const n = value === '' ? 0 : Number(value)
  return (
    <div className={`se-side se-${align}`}>
      <span className="se-team">{team}</span>
      <div className="se-counter">
        <button type="button" className="se-step" onClick={() => onStep(-1)}
                disabled={n <= 0} aria-label={t('tournament.board.minusOne', { team })}>
          <Icon name="minus" size={20} />
        </button>
        <input className="se-input" type="number" inputMode="numeric" min="0" value={value} placeholder="0"
               aria-label={t('tournament.board.scoreOf', { team })}
               onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))} />
        <button type="button" className="se-step se-plus" onClick={() => onStep(1)}
                aria-label={t('tournament.board.plusOne', { team })}>
          <Icon name="plus" size={20} />
        </button>
      </div>
    </div>
  )
}

// Saisie du prochain match : gros compteurs, validation en un geste.
export default function ScoreEntry({ fixture, onSave, knockout, onPlay, canPlayers, kicker, compact }) {
  const { t } = useTranslation()
  const m = fixture.match
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')

  useEffect(() => { setS1(''); setS2('') }, [m.id, m.team1, m.team2])

  // Mise à jour fonctionnelle : plusieurs appuis rapides comptent tous.
  const step = set => d => set(v => String(Math.max(0, (v === '' ? 0 : Number(v)) + d)))

  // Un côté non touché compte 0 : 12 d'un côté suffit pour valider un 12-0.
  const ready = s1 !== '' || s2 !== ''
  const n1 = Number(s1 || 0), n2 = Number(s2 || 0)
  const drawInKnockout = knockout && ready && n1 === n2

  function submit(e) {
    e.preventDefault()
    if (!ready || drawInKnockout) return
    onSave(n1, n2)
  }

  return (
    <form className={`se${compact ? ' se-compact' : ''}`} onSubmit={submit}>
      <header className="se-head">
        <span className="se-kicker">{kicker || t('tournament.board.nextMatch')}</span>
        {fixture.label && <span className="fx-label">{fixture.label}</span>}
      </header>
      <div className="se-board">
        <Side team={m.team1} value={s1} onChange={setS1} onStep={step(setS1)} align="l" />
        <span className="se-dash" aria-hidden="true">–</span>
        <Side team={m.team2} value={s2} onChange={setS2} onStep={step(setS2)} align="r" />
      </div>
      {drawInKnockout && <p className="se-warn">{t('tournament.board.noDrawKnockout')}</p>}
      <button type="submit" className="btn-acc se-save" disabled={!ready || drawInKnockout}>
        {t('tournament.board.saveScore')}
      </button>
      {onPlay && (
        <div className="se-play">
          <span className="se-play-label">{t('tournament.board.playLive')}</span>
          <div className="se-play-btns">
            <button type="button" className="btn-mini" onClick={() => onPlay('scorer')}>
              <Icon name="scoreboard" size={16} />{t('setup.formTitle.scorer')}
            </button>
            <button type="button" className="btn-mini" onClick={() => onPlay('stats')}>
              <Icon name="sheet" size={16} />{t('setup.formTitle.stats')}
            </button>
            {canPlayers && (
              <button type="button" className="btn-mini" onClick={() => onPlay('player')}>
                <Icon name="players" size={16} />{t('setup.formTitle.player')}
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
