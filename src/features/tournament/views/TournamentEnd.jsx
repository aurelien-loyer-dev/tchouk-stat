import { useTranslation } from 'react-i18next'
import { getTournamentEndState } from '../../../lib/tournament'
import FinalRankingTable from '../components/FinalRankingTable'
import { downloadTournamentPdf } from '../pdf'

export default function TournamentEnd({ tournament, onBack }) {
  const { t } = useTranslation()
  const { finalRanking, winner, allMatches } = getTournamentEndState(tournament)
  const topThree   = finalRanking.slice(0, 3)
  const totalPlayed = allMatches.filter(m => m.score1 !== null && m.score2 !== null).length
  const hasKnockout = !!tournament.knockoutRounds

  return (
    <div className="trn-end">
      <div className="trn-end-hero">
        <div className="trn-end-title">{t('tournament.finished')}</div>
        <div className="trn-end-subtitle">
          {winner ? t('tournament.winnerLabel', { winner }) : t('tournament.rankingAvailable')}
        </div>
        <div className="trn-end-meta">
          {t('tournament.matchesTeamsMeta', { played: totalPlayed, teams: tournament.teams.length })}
        </div>
      </div>

      <div className="trn-section">{t('tournament.podium')}</div>
      <div className="trn-podium">
        {topThree.map((row, i) => (
          <div key={row.team} className={`trn-podium-card trn-podium-${i + 1}`}>
            <div className="trn-podium-rank">#{i + 1}</div>
            <div className="trn-podium-team">{row.team}</div>
            <div className="trn-podium-points">{row.pts} pts</div>
          </div>
        ))}
      </div>

      <div className="trn-section">{t('tournament.finalRanking')}</div>
      <FinalRankingTable ranking={finalRanking} hasKnockout={hasKnockout} />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-mini" onClick={() => downloadTournamentPdf(tournament)}>{t('history.pdfBtn')}</button>
        <button className="btn-acc trn-end-btn" onClick={onBack}>{t('tournament.backToList')}</button>
      </div>
    </div>
  )
}
