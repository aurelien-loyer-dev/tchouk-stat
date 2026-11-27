import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '../../lib/router'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import content from './content'
import './guide.css'

function Block({ block }) {
  const body = (() => {
    switch (block.type) {
      case 'steps':
        return (
          <ol className="gd-steps">
            {block.items.map((text, i) => <li key={i}>{text}</li>)}
          </ol>
        )
      case 'stats':
      case 'terms':
        return (
          <dl className="gd-terms">
            {block.items.map(item => (
              <div key={item.term} className={`gd-term${item.color ? ` stat-${item.color}` : ''}`}>
                <dt>
                  {item.color && <span className="stat-chip" aria-hidden="true" />}
                  {item.term}
                </dt>
                <dd>{item.desc}</dd>
              </div>
            ))}
          </dl>
        )
      case 'note':
        return <p className="gd-note">{block.text}</p>
      default:
        return null
    }
  })()
  return (
    <>
      {block.heading && <h3 className="gd-h3">{block.heading}</h3>}
      {body}
    </>
  )
}

// Guide d'utilisation : sommaire collant à gauche (en haut sur mobile), une
// section par partie de l'app, avec un lien pour l'ouvrir.
// Défilement vers une section du sommaire, sans passer par la navigation de
// l'app (qui remonterait en haut de page) ; le focus suit pour le clavier.
function goTo(e, id) {
  const target = document.getElementById(id)
  if (!target) return
  e.preventDefault()
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  history.replaceState(history.state, '', `#${id}`)
  const heading = target.querySelector('h2')
  if (heading) {
    heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })
  }
}

export default function Guide({ onBack }) {
  const { i18n } = useTranslation()
  const c = content[i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr']

  // Arrivée par un lien vers une section (/guide#tournois).
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <div className="guide">
      <PageHeader title={c.title} subtitle={c.subtitle} onBack={onBack} />

      <div className="gd-layout">
        <nav className="gd-toc" aria-label={c.tocLabel}>
          <p className="gd-toc-title">{c.tocLabel}</p>
          <ol>
            {c.sections.map(s => (
              <li key={s.id}><a href={`#${s.id}`} onClick={e => goTo(e, s.id)}>{s.title}</a></li>
            ))}
          </ol>
        </nav>

        <div className="gd-body">
          {c.sections.map(s => (
            <section key={s.id} id={s.id} className="gd-sec" aria-labelledby={`${s.id}-title`}>
              <div className="gd-sec-head">
                <h2 id={`${s.id}-title`}>{s.title}</h2>
                {s.to && (
                  <Link className="btn-mini" to={s.to}>
                    {c.open}<Icon name="chevron" size={16} />
                  </Link>
                )}
              </div>
              <p className="gd-intro">{s.intro}</p>
              {s.blocks.map((b, i) => <Block key={i} block={b} />)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
