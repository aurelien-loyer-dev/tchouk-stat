import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, navigate } from '../../lib/router'
import { fmtWhen } from '../../lib/format'
import { leagueStandings } from '../../lib/league'
import { downloadCsv } from '../../lib/csv'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import ShareImage from '../../components/ShareImage'
import { leagueShare } from '../../lib/shareSpecs'
import { useLeagues } from './useLeagues'
import './league.css'

// 1re, 2e… / 1st, 2nd, 3rd…
function ordinal(n, lang) {
  if (!lang?.startsWith('en')) return n === 1 ? 're' : 'e'
  const s = n % 100
  if (s >= 11 && s <= 13) return 'th'
  return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'
}

// Liste des championnats, sous la liste des tournois.
export function LeagueSection() {
  const { t } = useTranslation()
  const { leagues, create } = useLeagues()
  const [name, setName] = useState('')

  function submit(e) {
    e.preventDefault()
    const l = create(name.trim() || t('league.defaultName', { year: new Date().getFullYear() }))
    setName('')
    navigate(`/leagues/${l.id}`)
  }

  return (
    <section className="sec lg-section">
      <h2 className="sec-title">{t('league.title')}</h2>
      <p className="lg-intro">{t('league.intro')}</p>
      {leagues.length > 0 && (
        <div className="rows">
          {leagues.map(l => (
            <Link key={l.id} className="row-link" to={`/leagues/${l.id}`}>
              <span className="row-text">
                <span className="row-label">{l.name}</span>
                <span className="row-desc">{t('league.daysN', { count: l.tournamentIds.length })}</span>
              </span>
              <Icon name="chevron" size={18} className="row-chev" />
            </Link>
          ))}
        </div>
      )}
      <form className="lg-new" onSubmit={submit}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('league.namePlaceholder')} aria-label={t('league.nameLabel')} />
        <button className="btn-ghost" type="submit"><Icon name="plus" size={18} />{t('league.create')}</button>
      </form>
    </section>
  )
}

// Un championnat : barème, journées (tournois cochés), classement général.
export default function League({ id, tournaments }) {
  const { t, i18n } = useTranslation()
  const { leagues, update, remove } = useLeagues()
  const league = leagues.find(l => l.id === id)
  // Réglages ouverts d'office pour un championnat encore vide.
  const [editing, setEditing] = useState(() => !league?.tournamentIds.length)
  const standings = useMemo(() => (league ? leagueStandings(league, tournaments) : null), [league, tournaments])

  if (!league) {
    return (
      <div className="lg">
        <PageHeader title={t('league.notFound')} onBack={() => navigate('/tournaments')} backLabel={t('tournament.title')} />
      </div>
    )
  }

  const { days, rows } = standings
  const toggle = tid => update(league.id, {
    tournamentIds: league.tournamentIds.includes(tid) ? league.tournamentIds.filter(x => x !== tid) : [...league.tournamentIds, tid],
  })
  const anyProvisional = days.some(d => !d.finished)

  function exportCsv() {
    const head = [t('league.cols.rank'), t('league.cols.team'), t('league.cols.pts'), t('league.cols.played'), ...days.map((d, i) => `${t('league.dayShort', { n: i + 1 })} ${d.tournament.name}`)]
    downloadCsv(league.name, [head, ...rows.map((r, i) => [i + 1, r.team, r.pts, r.played, ...r.results.map(x => (x ? `${x.rank} (${x.pts})` : ''))])])
  }

  return (
    <div className="lg">
      <PageHeader
        title={league.name}
        subtitle={`${t('league.daysN', { count: days.length })} · ${t('tournament.teamsCount', { count: rows.length })}`}
        onBack={() => navigate('/tournaments')}
        backLabel={t('tournament.title')}
        actions={(
          <>
            {rows.length > 0 && <ShareImage className="btn-mini" getSpec={() => leagueShare(league, standings, t)} />}
            {rows.length > 0 && <button className="btn-mini" onClick={exportCsv}><Icon name="sheet" size={16} />{t('csv.button')}</button>}
            <button className="btn-mini" onClick={() => setEditing(e => !e)} aria-expanded={editing}><Icon name="edit" size={16} />{t('league.settings')}</button>
          </>
        )}
      />

      {editing && (
        <section className="lg-settings">
          <label className="field">
            <span className="flabel">{t('league.nameLabel')}</span>
            <input type="text" value={league.name} onChange={e => update(league.id, { name: e.target.value })} />
          </label>
          <div className="field">
            <span className="flabel">{t('league.scale')}</span>
            <div className="seg">
              <button className={league.scale === 'rank' ? 'on' : ''} onClick={() => update(league.id, { scale: 'rank' })}>{t('league.scaleRank')}</button>
              <button className={league.scale === 'fixed' ? 'on' : ''} onClick={() => update(league.id, { scale: 'fixed' })}>{t('league.scaleFixed')}</button>
            </div>
            <p className="lg-hint">{league.scale === 'fixed' ? t('league.scaleFixedHint') : t('league.scaleRankHint')}</p>
          </div>
          <fieldset className="lg-days">
            <legend className="flabel">{t('league.daysLabel')}</legend>
            {tournaments.length === 0 && <p className="lg-hint">{t('league.noTournaments')}</p>}
            {tournaments.map(tour => (
              <label key={tour.id} className="lg-day">
                <input type="checkbox" checked={league.tournamentIds.includes(tour.id)} onChange={() => toggle(tour.id)} />
                <span className="lg-day-name">{tour.name}</span>
                <span className="lg-day-meta">{tour.createdAt ? fmtWhen(tour.createdAt) : ''} · {t('tournament.teamsCount', { count: tour.teams.length })}</span>
              </label>
            ))}
          </fieldset>
          <button className="btn-link lg-delete" onClick={() => { if (window.confirm(t('league.deleteConfirm'))) { remove(league.id); navigate('/tournaments') } }}>
            {t('league.delete')}
          </button>
        </section>
      )}

      {rows.length > 0 && (
        <section className="sec">
          <h2 className="sec-title">{t('league.standings')}</h2>
          <div className="table-scroll lg-table-wrap">
            <table className="data-table lg-table">
              <thead>
                <tr>
                  <th>{t('league.cols.rank')}</th>
                  <th>{t('league.cols.team')}</th>
                  <th>{t('league.cols.pts')}</th>
                  <th title={t('league.cols.playedTitle')}>{t('league.cols.played')}</th>
                  {days.map((d, i) => (
                    <th key={d.tournament.id} title={d.tournament.name}>
                      <Link to={`/tournaments/${d.tournament.id}`}>{t('league.dayShort', { n: i + 1 })}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.team} className={i < 3 ? `lg-top lg-top-${i + 1}` : ''}>
                    <td className="lg-rank">{i + 1}</td>
                    <td className="lg-team">{r.team}</td>
                    <td><strong>{r.pts}</strong></td>
                    <td>{r.played}</td>
                    {r.results.map((x, di) => (
                      <td key={di} className={`lg-cell${x?.provisional ? ' lg-prov' : ''}`} title={x?.provisional ? t('league.provisionalCell') : undefined}>
                        {x ? <><span className="lg-place">{x.rank}<sup>{ordinal(x.rank, i18n.language)}</sup></span><span className="lg-pts">{x.pts}</span></> : <span className="lg-none">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lg-hint">
            {league.scale === 'fixed' ? t('league.scaleFixedHint') : t('league.scaleRankHint')}
            {anyProvisional && <> {t('league.provisional')}</>}
          </p>
        </section>
      )}

      {days.length > 0 && (
        <section className="sec">
          <h2 className="sec-title">{t('league.daysLabel')}</h2>
          <div className="rows">
            {days.map((d, i) => (
              <Link key={d.tournament.id} className="row-link" to={`/tournaments/${d.tournament.id}`}>
                <span className="lg-daynum">{t('league.dayShort', { n: i + 1 })}</span>
                <span className="row-text">
                  <span className="row-label">{d.tournament.name}</span>
                  <span className="row-desc">
                    {d.finished ? t('league.winner', { team: d.ranking[0] }) : t('league.inProgress')}
                    {' · '}{t('tournament.teamsCount', { count: d.ranking.length })}
                  </span>
                </span>
                <Icon name="chevron" size={18} className="row-chev" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
