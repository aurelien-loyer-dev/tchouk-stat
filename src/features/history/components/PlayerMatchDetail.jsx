import { useTranslation } from 'react-i18next'
import { playerTeamScore, playerDerivedStats } from '../../../lib/playerStats'
import { fmtClock, fmtDateTime } from '../../../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../../../lib/teamColor'
import { downloadMatchPdf } from '../pdf'

export default function PlayerMatchDetail({ match, onClose }) {
  const { t } = useTranslation()
  const { players = [], teams = [], settings, numTeams: nt = 2, playedAt, durationSec } = match
  const n      = nt
  const score0 = playerTeamScore(players, 0, n)
  const score1 = n === 2 ? playerTeamScore(players, 1, n) : null

  const teamGroups = [
    { name: teams[0]?.name || t('playerResults.defaultTeam1'), color: settings?.teamColors?.[0], grp: players.filter(p => p.teamIdx === 0) },
    ...(n === 2 ? [{ name: teams[1]?.name || t('playerResults.defaultTeam2'), color: settings?.teamColors?.[1], grp: players.filter(p => p.teamIdx === 1) }] : []),
  ]

  return (
    <div className="hist-detail">
      <div className="hist-detail-header">
        <button className="btn-ghost hist-back" onClick={onClose}>{t('common.back')}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hist-detail-date">{fmtDateTime(playedAt)}</div>
          <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>{t('history.pdfBtn')}</button>
        </div>
      </div>

      <div className="mr-detail-names">
        <span className="mr-name" style={{ fontSize: 15 }}>
          {settings?.teamColors?.[0] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[0])} />}
          {teams[0]?.name}
        </span>
        {n === 2 && (
          <span className="mr-name" style={{ fontSize: 15 }}>
            {settings?.teamColors?.[1] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[1])} />}
            {teams[1]?.name}
          </span>
        )}
      </div>
      <div className="rf" style={{ marginBottom: 8 }}>
        {n === 2 ? (
          <>
            <span style={settings?.teamColors?.[0] ? teamTextStyle(settings.teamColors[0]) : { color: 'var(--txt)' }}>{score0}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={settings?.teamColors?.[1] ? teamTextStyle(settings.teamColors[1]) : { color: 'var(--txt)' }}>{score1}</span>
          </>
        ) : (
          <span style={settings?.teamColors?.[0] ? teamTextStyle(settings.teamColors[0]) : { color: 'var(--txt)' }}>{score0} pts</span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ctitle">{t('history.summaryTitle')}</div>
        <div className="si"><div className="si-l">{t('results.ui.format')}</div><span className="si-v" style={{ fontSize: 14 }}>{settings?.halfCount}×{settings?.halfDurationMin} min</span></div>
        <div className="si"><div className="si-l">{t('history.actualDuration')}</div><span className="si-v" style={{ fontSize: 14 }}>{fmtClock(durationSec)}</span></div>
        <div className="si"><div className="si-l">{t('history.playersLabel')}</div><span className="si-v" style={{ fontSize: 14 }}>{players.length}</span></div>
      </div>

      {teamGroups.map(({ name, color, grp }) => (
        <div className="card" key={name} style={{ marginBottom: 12, borderTop: `3px solid ${color || 'var(--acc)'}` }}>
          <div className="ctitle">
            {color && <span className="team-dot" style={teamSwatchStyle(color)} />}
            {name}
          </div>
          {grp.length === 0
            ? <div style={{ color: 'var(--dim)', fontSize: 13 }}>{t('history.noPlayersShort')}</div>
            : (
              <div className="hist-player-table">
                <div className="hist-player-hd">
                  <span>{t('history.playerTableCols.player')}</span>
                  <span>{t('history.playerTableCols.pts')}</span>
                  <span>{t('history.playerTableCols.shots')}</span>
                  <span>{t('history.playerTableCols.eff')}</span>
                  <span>{t('history.playerTableCols.def')}</span>
                  <span>{t('history.playerTableCols.fouls')}</span>
                </div>
                {grp.map(p => {
                  const d = playerDerivedStats(p)
                  return (
                    <div className="hist-player-row" key={p.id}>
                      <span className="hist-player-name">{p.name}</span>
                      <span><strong>{p.pointsMarques}</strong></span>
                      <span>{d.tirsTotal}</span>
                      <span>{d.tirsTotal > 0 ? `${Math.round(p.pointsMarques / d.tirsTotal * 100)}%` : '—'}</span>
                      <span>{d.defTotal}</span>
                      <span>{d.fautesTotal}</span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      ))}
    </div>
  )
}
