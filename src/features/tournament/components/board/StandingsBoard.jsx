import { useTranslation } from 'react-i18next'
import { teamForm } from '../../overview'

function FormDots({ form }) {
  const { t } = useTranslation()
  if (!form.length) return <span className="stb-form stb-form-empty">—</span>
  return (
    <span className="stb-form" aria-label={form.map(r => t(`tournament.board.form.${r}`)).join(', ')}>
      {form.map((r, i) => <span key={i} className={`stb-dot stb-dot-${r}`} title={t(`tournament.board.form.${r}`)}>{t(`tournament.board.formShort.${r}`)}</span>)}
    </span>
  )
}

// Classement lisible de loin : rang, équipe, forme récente, différence, points.
// `detailed` ajoute V / N / D / BP / BC pour les organisateurs.
export default function StandingsBoard({ table, fixtures, focusTeam, onPickTeam, detailed }) {
  const { t } = useTranslation()
  const s = t('tournament.standings', { returnObjects: true })
  const { rows, qualifyN, title } = table

  return (
    <section className="stb">
      {title && <h3 className="stb-title">{title}</h3>}
      <div className="stb-scroll">
        <table className={`stb-table${detailed ? ' stb-detailed' : ''}`}>
          <thead>
            <tr>
              <th className="stb-rank-h" scope="col"><span aria-hidden="true">#</span><span className="sr-only">{t('tournament.board.rank')}</span></th>
              <th className="stb-team-h">{s.team}</th>
              <th className="stb-form-h">{t('tournament.board.formTitle')}</th>
              <th title={s.playedTitle}>{s.played}</th>
              {detailed && <>
                <th title={s.wonTitle}>{s.won}</th>
                <th title={s.drawnTitle}>{s.drawn}</th>
                <th title={s.lostTitle}>{s.lost}</th>
                <th title={s.gfTitle}>{s.gf}</th>
                <th title={s.gaTitle}>{s.ga}</th>
              </>}
              <th title={s.diffTitle}>{s.diff}</th>
              <th className="stb-pts-h">{s.pts}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const cls = [
                i < 3 && r.played > 0 && `stb-top stb-top-${i + 1}`,
                qualifyN > 0 && i < qualifyN && 'stb-q',
                qualifyN > 0 && i === qualifyN - 1 && 'stb-q-last',
                focusTeam === r.team && 'stb-focus',
              ].filter(Boolean).join(' ')
              return (
                <tr key={r.team} className={cls}>
                  <td className="stb-rank"><span>{i + 1}</span></td>
                  <td className="stb-team">
                    {onPickTeam ? (
                      <button className="stb-pick" onClick={() => onPickTeam(r.team)} aria-pressed={focusTeam === r.team}
                              title={t('tournament.board.followThis', { team: r.team })}>{r.team}</button>
                    ) : r.team}
                  </td>
                  <td className="stb-form-c"><FormDots form={teamForm(r.team, fixtures)} /></td>
                  <td>{r.played}</td>
                  {detailed && <><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td><td>{r.gf}</td><td>{r.ga}</td></>}
                  <td className={r.gd > 0 ? 'stb-pos' : r.gd < 0 ? 'stb-neg' : ''}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                  <td className="stb-pts">{r.pts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {qualifyN > 0 && <p className="stb-note"><span className="stb-q-swatch" />{t('tournament.board.qualified', { count: qualifyN })}</p>}
    </section>
  )
}
