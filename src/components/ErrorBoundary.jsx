import { Component } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '../lib/router'

function Fallback({ error, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="crash" role="alert">
      <h1>{t('crash.title')}</h1>
      <p>{t('crash.text')}</p>
      <div className="crash-actions">
        <Link className="btn-acc" to="/" onClick={onRetry}>{t('crash.home')}</Link>
        <button className="btn-ghost" onClick={() => window.location.reload()}>{t('crash.reload')}</button>
      </div>
      <details className="crash-details">
        <summary>{t('crash.details')}</summary>
        <pre>{String(error?.stack || error?.message || error)}</pre>
      </details>
    </div>
  )
}

// Un plantage dans un écran n'emporte plus toute l'app (écran noir) : on
// affiche un message et des issues. `resetKey` (l'adresse) efface l'erreur
// dès qu'on change de page.
export default class ErrorBoundary extends Component {
  state = { error: null, key: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.key) return { error: null, key: props.resetKey }
    return null
  }

  componentDidCatch(error, info) {
    console.error('Écran en erreur :', error, info?.componentStack)
  }

  render() {
    if (this.state.error) return <Fallback error={this.state.error} onRetry={() => this.setState({ error: null })} />
    return this.props.children
  }
}
