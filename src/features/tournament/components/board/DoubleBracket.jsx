import { useTranslation } from 'react-i18next'
import BracketBoard from './BracketBoard'

// Double élimination : tableau principal, tableau de repêchage, puis la
// grande finale (et la finale décisive tant qu'elle peut encore avoir lieu).
export default function DoubleBracket({ bracket, focusTeam, headingLevel = 3 }) {
  const { t } = useTranslation()
  const H = `h${headingLevel}`
  const finals = bracket.final.filter(r => r.matches.some(m => m.team1 !== 'BYE'))
  // La finale décisive n'a lieu que si l'équipe du repêchage gagne la grande finale.
  const resetLive = bracket.final[1]?.matches.some(m => m.team1 !== 'BYE' && m.team1 !== 'TBD')
  return (
    <div className="dbk">
      <section className="dbk-part">
        <H className="dbk-title">{t('tournament.double.upper')}</H>
        <BracketBoard rounds={bracket.upper} focusTeam={focusTeam} markFinal={false} />
      </section>
      <section className="dbk-part">
        <H className="dbk-title">{t('tournament.double.lower')}</H>
        <p className="dbk-hint">{t('tournament.double.lowerHint')}</p>
        <BracketBoard rounds={bracket.lower} focusTeam={focusTeam} markFinal={false} />
      </section>
      <section className="dbk-part">
        <H className="dbk-title">{t('tournament.double.final')}</H>
        {resetLive && <p className="dbk-hint">{t('tournament.double.resetHint')}</p>}
        <BracketBoard rounds={finals} focusTeam={focusTeam} />
      </section>
    </div>
  )
}
