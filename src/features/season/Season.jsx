import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, navigate } from '../../lib/router'
import { fmtWhen } from '../../lib/format'
import { PLAYER_STATS } from '../../lib/playerStats'
import { seasonPlayers, seasonStart } from '../../lib/season'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import TeamFilter from '../tournament/components/board/TeamFilter'
import '../tournament/board.css'
import './season.css'

const pctLabel = v => (v == null ? '—' : `${Math.round(v * 100)} %`)
const avg = (n, d) => (d ? (n / d).toFixed(1).replace('.0', '') : '0')

const COLUMNS = [
  { id: 'name',   get: p => p.name.toLocaleLowerCase('fr'), num: false },
  { id: 'played', get: p => p.played },
  { id: 'pts',    get: p => p.totals.pointsMarques },
  { id: 'avg',    get: p => p.perMatch },
  { id: 'eff',    get: p => p.derived.effOff ?? -1 },
  { id: 'def',    get: p => p.derived.defTotal },
  { id: 'fouls',  get: p => p.derived.fautesTotal },
]

// Points par match, du plus ancien au plus récent, avec la moyenne.
function PointsChart({ matches }) {
  const { t } = useTranslation()
  const W = 640, H = 180, pad = { l: 28, r: 8, t: 12, b: 22 }
  const pts = matches.map(m => m.stats.pointsMarques)
  const max = Math.max(4, ...pts)
  const step = (W - pad.l - pad.r) / Math.max(1, matches.length)
  const bw = Math.max(6, Math.min(36, step * 0.6))
  const y = v => pad.t + (H - pad.t - pad.b) * (1 - v / max)
  const mean = pts.reduce((a, b) => a + b, 0) / (pts.length || 1)
  const ticks = [0, Math.round(max / 2), max]
  return (
    <figure className="ssn-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('season.chartLabel')}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="ssn-grid" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="ssn-axis">{v}</text>
          </g>
        ))}
        {matches.map((m, i) => {
          const v = m.stats.pointsMarques
          const x = pad.l + step * i + (step - bw) / 2
          return (
            <rect key={m.id} x={x} y={y(v)} width={bw} height={Math.max(0, y(0) - y(v))} rx="3" className="ssn-bar">
              <title>{`${fmtWhen(m.playedAt)} · ${m.opponent ? t('season.vsShort', { team: m.opponent }) + ' · ' : ''}${t('season.ptsN', { count: v })}`}</title>
            </rect>
          )
        })}
        <line x1={pad.l} x2={W - pad.r} y1={y(mean)} y2={y(mean)} className="ssn-mean" />
      </svg>
      <figcaption>
        <span className="ssn-leg ssn-leg-bar" />{t('season.chartBars')}
        <span className="ssn-leg ssn-leg-mean" />{t('season.chartMean', { n: avg(mean * 10, 10) })}
      </figcaption>
    </figure>
  )
}

function PlayerDetail({ player, onBack }) {
  const { t } = useTranslation()
  const wins = player.matches.filter(m => m.result === 'W').length
  const draws = player.matches.filter(m => m.result === 'D').length
  const losses = player.matches.filter(m => m.result === 'L').length
  const tiles = [
    { label: t('season.cols.played'), value: player.played },
    { label: t('season.cols.pts'), value: player.totals.pointsMarques },
    { label: t('season.cols.avg'), value: avg(player.totals.pointsMarques, player.played) },
    { label: t('season.cols.eff'), value: pctLabel(player.derived.effOff) },
    { label: t('season.cols.def'), value: player.derived.defTotal },
    { label: t('season.record'), value: `${wins}-${draws}-${losses}`, hint: t('season.recordHint') },
  ]
  const recent = [...player.matches].reverse()
  return (
    <div className="ssn">
      <PageHeader title={player.name} subtitle={[player.teams.join(', '), t('season.matchesN', { count: player.played })].filter(Boolean).join(' · ')}
                  onBack={onBack} backLabel={t('season.title')} />

      <dl className="ssn-tiles">
        {tiles.map(tile => (
          <div key={tile.label} className="ssn-tile" title={tile.hint}>
            <dt>{tile.label}</dt>
            <dd>{tile.value}</dd>
          </div>
        ))}
      </dl>

      {player.matches.length > 1 && (
        <section className="sec">
          <h2 className="sec-title">{t('season.progress')}</h2>
          <PointsChart matches={player.matches} />
        </section>
      )}

      <section className="sec">
        <h2 className="sec-title">{t('season.allStats')}</h2>
        <div className="table-scroll">
          <table className="data-table ssn-stats">
            <thead><tr><th>{t('season.stat')}</th><th>{t('season.total')}</th><th>{t('season.perMatch')}</th></tr></thead>
            <tbody>
              {PLAYER_STATS.map(s => (
                <tr key={s.id} className={`stat-${s.color}`}>
                  <td><span className="ssn-stat-name"><span className="stat-chip" aria-hidden="true" />{t(s.labelKey)}</span></td>
                  <td><strong>{player.totals[s.id]}</strong></td>
                  <td>{avg(player.totals[s.id], player.played)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <h2 className="sec-title">{t('season.matches')}</h2>
        <div className="rows">
          {recent.map(m => {
            const shots = m.stats.pointsMarques + m.stats.pointsDonnes + m.stats.fautesTir
            return (
              <Link key={m.id} className="row-link ssn-match" to={`/history/${m.id}`}>
                {m.result && <span className={`ssn-res ssn-res-${m.result}`} title={t(`tournament.board.form.${m.result}`)}>{t(`tournament.board.formShort.${m.result}`)}</span>}
                <span className="row-text">
                  <span className="row-label">{m.opponent ? t('season.vs', { team: m.opponent }) : m.team}</span>
                  <span className="row-desc">{fmtWhen(m.playedAt)}{m.opponent ? ` · ${m.team}` : ''}</span>
                </span>
                <span className="ssn-match-nums">
                  <span><strong>{m.stats.pointsMarques}</strong> {t('playerMatch.ptsShort')}</span>
                  <span>{shots ? `${Math.round(m.stats.pointsMarques / shots * 100)} %` : '—'}</span>
                  <span>{m.stats.defenseSolo + m.stats.participationDef} {t('season.defShort')}</span>
                </span>
                <Icon name="chevron" size={18} className="row-chev" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// Saison : tous les joueurs suivis en mode « stats joueurs », triables, avec
// une fiche par joueur (progression, toutes les stats, ses matchs).
export default function Season({ history, playerKey: selected, onBack }) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState('season') // 'season' | 'all'
  const [team, setTeam] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ id: 'pts', dir: -1 })

  const players = useMemo(
    () => seasonPlayers(history, { since: period === 'season' ? seasonStart() : null }),
    [history, period],
  )
  const allPlayers = useMemo(() => seasonPlayers(history), [history])

  if (selected) {
    const player = players.find(p => p.key === selected) || allPlayers.find(p => p.key === selected)
    if (player) return <PlayerDetail player={player} onBack={() => navigate('/season')} />
  }

  const teams = [...new Set(players.map(p => p.teams[0]).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const col = COLUMNS.find(c => c.id === sort.id) || COLUMNS[2]
  const q = query.trim().toLocaleLowerCase('fr')
  const rows = players
    .filter(p => !team || p.teams.includes(team))
    .filter(p => !q || p.key.includes(q))
    .sort((a, b) => {
      const va = col.get(a), vb = col.get(b)
      const c = typeof va === 'string' ? va.localeCompare(vb) : va - vb
      return c * (col.num === false ? -sort.dir : sort.dir) || b.totals.pointsMarques - a.totals.pointsMarques
    })

  const head = id => (
    <th aria-sort={sort.id === id ? (sort.dir === -1 ? 'descending' : 'ascending') : 'none'}>
      <button className={`ssn-sort${sort.id === id ? ' on' : ''}`} onClick={() => setSort(s => ({ id, dir: s.id === id ? -s.dir : -1 }))}>
        {t(`season.cols.${id}`)}
        {sort.id === id && <Icon name="down" size={14} className={sort.dir === 1 ? 'ssn-up' : ''} />}
      </button>
    </th>
  )

  return (
    <div className="ssn">
      <PageHeader title={t('season.title')} subtitle={t('season.subtitle')} onBack={onBack} />

      {allPlayers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">{t('season.emptyTitle')}</div>
          <p className="empty-text">{t('season.emptyText')}</p>
          <Link className="btn-acc" to="/players">{t('season.emptyCta')}</Link>
        </div>
      ) : (
        <>
          <div className="ssn-tools">
            <div className="seg ssn-period" role="group" aria-label={t('season.period')}>
              <button className={period === 'season' ? 'on' : ''} onClick={() => setPeriod('season')}>{t('season.thisSeason')}</button>
              <button className={period === 'all' ? 'on' : ''} onClick={() => setPeriod('all')}>{t('season.allTime')}</button>
            </div>
            <input type="text" className="ssn-search" placeholder={t('season.search')} value={query} onChange={e => setQuery(e.target.value)} aria-label={t('season.search')} />
          </div>
          {teams.length > 1 && <TeamFilter teams={teams} value={team} onChange={setTeam} label={t('season.team')} />}

          {rows.length === 0 ? (
            <p className="tl-empty">{players.length ? t('season.noMatch') : t('season.noneThisSeason')}</p>
          ) : (
            <div className="table-scroll ssn-table-wrap">
              <table className="data-table ssn-table">
                <thead>
                  <tr>
                    {head('name')}
                    {head('played')}
                    {head('pts')}
                    {head('avg')}
                    {head('eff')}
                    {head('def')}
                    {head('fouls')}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => (
                    <tr key={p.key} className="ssn-row" onClick={() => navigate(`/season/${encodeURIComponent(p.key)}`)}>
                      <td>
                        <Link className="ssn-name" to={`/season/${encodeURIComponent(p.key)}`} onClick={e => e.stopPropagation()}>{p.name}</Link>
                        <span className="ssn-team">{p.teams[0]}</span>
                      </td>
                      <td>{p.played}</td>
                      <td><strong>{p.totals.pointsMarques}</strong></td>
                      <td>{avg(p.totals.pointsMarques, p.played)}</td>
                      <td>{pctLabel(p.derived.effOff)}</td>
                      <td>{p.derived.defTotal}</td>
                      <td>{p.derived.fautesTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
