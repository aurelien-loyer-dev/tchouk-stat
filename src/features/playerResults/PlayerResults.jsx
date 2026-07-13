import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { playerTeamScore } from '../../lib/playerStats'
import { pct } from '../../lib/format'
import { teamTextStyle } from '../../lib/teamColor'
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
      <div className="rf">
        {n === 2 ? (
          <>
            <span style={teamTextStyle(c1)}>{score0}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={teamTextStyle(c2)}>{score1}</span>
          </>
        ) : (
          <span style={teamTextStyle(c1)}>{score0}</span>
        )}
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
                  <span className="award-badge" style={{ background: award.color }}>{t(award.labelKey)}</span>
                  <div className="award-info">
                    <span className="award-full">{award.full}</span>
                    <span className="award-desc">{t(award.descKey)}</span>
                  </div>
                </div>
                <div className="award-ranking">
                  {groups.map(({ rank, players: gPlayers }) =>
                    gPlayers.map((p, i) => (
                      <div key={p.id} className="award-rank-row">
                        <span
                          className="award-rank-num"
                          style={{ color: rank === 1 ? award.color : undefined }}
                        >
                          {i === 0 ? rank : ''}
                        </span>
                        <span
                          className="award-rank-name"
                          style={{ color: rank === 1 && i === 0 ? award.color : undefined, fontWeight: rank === 1 ? 900 : 600 }}
                        >
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

      {/* ── PDF stats d'un joueur (sélecteur) ── */}
      {players.length > 0 && (
        <div className="player-pdf-wrap">
          <button
            className="btn-ghost player-pdf-btn"
            onClick={() => setShowPicker(s => !s)}
          >
            {t('playerResults.pdfPlayerStatsBtn')} {showPicker ? '▲' : '▼'}
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
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 280, marginTop: 4 }}
        onClick={handleGenerateFullPdf}
      >
        {t('playerResults.downloadFullPdf')}
      </button>

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 200, marginTop: 8 }}
        onClick={onNew}
      >
        {t('playerResults.newMatch')}
      </button>
    </>
  )
}
