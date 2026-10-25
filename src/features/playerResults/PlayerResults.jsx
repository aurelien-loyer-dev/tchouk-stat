import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { playerTeamScore } from '../../lib/playerStats'
import { pct } from '../../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../../lib/teamColor'
import Icon from '../../components/Icon'
import { offScore, defScore, mvpScore, topPlayers, AWARDS } from './awards'
import { generatePlayerPdf, generateFullPdf } from './pdf'
import './playerResults.css'

export default function PlayerResults({ teams, players, numTeams, settings, summary, onNew }) {
  const { t } = useTranslation()
  const n = numTeams ?? 2

  const c1 = settings?.teamColors?.[0] || '#0e9f8f'
  const c2 = settings?.teamColors?.[1] || '#d14343'

  const score0       = playerTeamScore(players, 0, n)
  const score1       = n === 2 ? playerTeamScore(players, 1, n) : null
  const team1Players = players.filter(p => p.teamIdx === 0)
  const team2Players = n === 2 ? players.filter(p => p.teamIdx === 1) : []

  const [showPicker, setShowPicker] = useState(false)

  // Top 3 par distinction, avec gestion des ex aequo
  const computedAwards = {
    bopm: topPlayers(players, offScore),
    bdpm: topPlayers(players, defScore),
    mvp:  topPlayers(players, mvpScore),
  }

  function teamName(p) {
    return p.teamIdx === 0 ? (teams[0]?.name || t('playerResults.defaultTeam1')) : (teams[1]?.name || t('playerResults.defaultTeam2'))
  }

  function handleGeneratePlayerPdf(player) {
    generatePlayerPdf(player, { teams, n, score0, score1, teamName, t })
  }

  function handleGenerateFullPdf() {
    generateFullPdf({ teams, players, n, score0, score1, settings, summary, team1Players, team2Players, computedAwards, t })
  }

  return (
    <>
      <div className="res-hero">
        <div className="mr-detail-names">
          {teams.slice(0, n).map((team, i) => (
            <span className="mr-name" key={i}>
              <span className="team-dot" style={teamSwatchStyle(i === 0 ? c1 : c2)} />{team.name}
            </span>
          ))}
        </div>
        <div className="rf">
          {n === 2 ? (
            <>
              <span style={teamTextStyle(c1)}>{score0}</span>
              <span className="rf-sep">–</span>
              <span style={teamTextStyle(c2)}>{score1}</span>
            </>
          ) : (
            <span style={teamTextStyle(c1)}>{score0}</span>
          )}
        </div>
      </div>

      {/* ── Distinctions automatiques ── */}
      {players.length > 0 && (
        <div className="card awards-card">
          <div className="ctitle">{t('awards.sectionTitle')}</div>
          {AWARDS.map(award => {
            const groups = computedAwards[award.key]
            if (!groups || groups.length === 0) return null
            return (
              <div key={award.key} className="award-section">
                <div className="award-header">
                  <span className="award-badge" style={{ '--aw': award.color }}>{t(award.labelKey)}</span>
                  <div className="award-info">
                    <span className="award-full">{award.full}</span>
                    <span className="award-desc">{t(award.descKey)}</span>
                  </div>
                </div>
                <div className="award-ranking">
                  {groups.map(({ rank, players: gPlayers }) =>
                    gPlayers.map((p, i) => (
                      <div key={p.id} className="award-rank-row">
                        <span className={`award-rank-num${rank === 1 ? ' top' : ''}`} style={{ '--aw': award.color }}>
                          {i === 0 ? rank : ''}
                        </span>
                        <span className={`award-rank-name${rank === 1 ? ' top' : ''}`}>
                          {p.name}
                        </span>
                        {i > 0 && <span className="award-eq-badge">{t('awards.exAequo')}</span>}
                        <span className="award-rank-hint">{award.hint(p, pct, t)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="actions-row">
        <button className="btn-ghost" onClick={handleGenerateFullPdf}>
          <Icon name="download" size={18} />{t('playerResults.downloadFullPdf')}
        </button>
        <button className="btn-acc" onClick={onNew}>
          {t('playerResults.newMatch')}
        </button>
      </div>

      {/* ── PDF stats d'un joueur (sélecteur) ── */}
      {players.length > 0 && (
        <div className="player-pdf-wrap">
          <button
            className="btn-ghost player-pdf-btn"
            onClick={() => setShowPicker(s => !s)}
            aria-expanded={showPicker}
          >
            {t('playerResults.pdfPlayerStatsBtn')}
            <Icon name="down" size={18} className={`rot${showPicker ? ' open' : ''}`} />
          </button>
          {showPicker && (
            <div className="player-pdf-panel">
              {players.map(p => (
                <button
                  key={p.id}
                  className="player-pdf-item"
                  onClick={() => { handleGeneratePlayerPdf(p); setShowPicker(false) }}
                >
                  <span className="player-pdf-name">{p.name}</span>
                  <span className="player-pdf-team">{teamName(p)}</span>
                  <Icon name="download" size={16} className="player-pdf-ico" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
