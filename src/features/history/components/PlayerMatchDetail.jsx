import { useTranslation } from 'react-i18next'
import { playerTeamScore, playerDerivedStats } from '../../../lib/playerStats'
import { fmtClock, fmtDateTime } from '../../../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../../../lib/teamColor'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'
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
      <PageHeader
        title={fmtDateTime(playedAt)}
        onBack={onClose}
        actions={(
          <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>
            <Icon name="download" size={16} />{t('history.pdfBtn')}
          </button>
        )}
      />

      <div className="mr-detail-names">
        <span className="mr-name">
          {settings?.teamColors?.[0] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[0])} />}
          {teams[0]?.name}
        </span>
        {n === 2 && (
          <span className="mr-name">
            {settings?.teamColors?.[1] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[1])} />}
            {teams[1]?.name}
          </span>
        )}
      </div>
      <div className="rf">
        {n === 2 ? (
          <>
            <span style={settings?.teamColors?.[0] ? teamTextStyle(settings.teamColors[0]) : undefined}>{score0}</span>
            <span className="rf-sep">–</span>
            <span style={settings?.teamColors?.[1] ? teamTextStyle(settings.teamColors[1]) : undefined}>{score1}</span>
          </>
        ) : (
          <span style={settings?.teamColors?.[0] ? teamTextStyle(settings.teamColors[0]) : undefined}>{score0} pts</span>
        )}
      </div>

      <div className="card">
        <div className="ctitle">{t('history.summaryTitle')}</div>
        <div className="si"><div className="si-l">{t('results.ui.format')}</div><span className="si-v sub">{settings?.halfCount}×{settings?.halfDurationMin} min</span></div>
        <div className="si"><div className="si-l">{t('history.actualDuration')}</div><span className="si-v sub">{fmtClock(durationSec)}</span></div>
        <div className="si"><div className="si-l">{t('history.playersLabel')}</div><span className="si-v sub">{players.length}</span></div>
      </div>

      {teamGroups.map(({ name, color, grp }) => (
        <div className="card card-team" key={name}>
          <div className="ctitle">
            {color && <span className="team-dot" style={teamSwatchStyle(color)} />}
            {name}
          </div>
          {grp.length === 0
            ? <div className="tl-empty">{t('history.noPlayersShort')}</div>
            : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('history.playerTableCols.player')}</th>
                      <th>{t('history.playerTableCols.pts')}</th>
                      <th>{t('history.playerTableCols.shots')}</th>
                      <th>{t('history.playerTableCols.eff')}</th>
                      <th>{t('history.playerTableCols.def')}</th>
                      <th>{t('history.playerTableCols.fouls')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.map(p => {
                      const d = playerDerivedStats(p)
                      return (
                        <tr key={p.id}>
                          <td className="hist-player-name">{p.name}</td>
                          <td><strong>{p.pointsMarques}</strong></td>
                          <td>{d.tirsTotal}</td>
                          <td>{d.tirsTotal > 0 ? `${Math.round(p.pointsMarques / d.tirsTotal * 100)}%` : '—'}</td>
                          <td>{d.defTotal}</td>
                          <td>{d.fautesTotal}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      ))}
    </div>
  )
}
