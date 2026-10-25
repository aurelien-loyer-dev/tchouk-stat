import { useTranslation } from 'react-i18next'
import { playerTeamScore, playerDerivedStats } from '../../../lib/playerStats'
import { fmtClock, fmtDayLabel, fmtTime } from '../../../lib/format'
import { teamSwatchStyle } from '../../../lib/teamColor'
import PageHeader from '../../../components/PageHeader'
import ScoreHero from '../../../components/ScoreHero'
import { DetailActions } from './MatchDetail'

export default function PlayerMatchDetail({ match, onClose, onDelete }) {
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
        title={t('history.modes.player')}
        subtitle={`${fmtDayLabel(playedAt)} · ${fmtTime(playedAt)}`}
        onBack={onClose}
        actions={<DetailActions match={match} onDelete={onDelete} />}
      />

      <ScoreHero
        teams={teamGroups.map((g, i) => ({ name: g.name, score: i === 0 ? score0 : score1, color: g.color }))}
        meta={`${settings?.halfCount}×${settings?.halfDurationMin} min · ${t('history.duration')} ${fmtClock(durationSec)} · ${t('history.footerPlayer', { count: players.length })}`}
      />

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
