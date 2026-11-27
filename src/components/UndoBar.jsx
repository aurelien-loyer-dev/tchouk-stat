import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import './UndoBar.css'

// Ctrl+Z / Cmd+Z annule la dernière action (sauf pendant la saisie d'un texte).
export function useUndoShortcut(onUndo, enabled) {
  useEffect(() => {
    if (!enabled) return undefined
    function onKey(e) {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== 'z') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      onUndo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onUndo, enabled])
}

// Bouton flottant « Annuler » en bas de l'écran de match : rappelle la
// dernière action (stat, sens, équipe ou joueur) et la défait. Plusieurs
// appuis remontent l'historique du match.
export default function UndoBar({ label, onUndo }) {
  const { t } = useTranslation()
  useUndoShortcut(onUndo, !!label)
  if (!label) return null
  return (
    <div className="undo-bar" role="region" aria-label={t('undo.region')}>
      <button className="undo-btn" onClick={onUndo} title={t('undo.shortcut')}>
        <Icon name="undo" size={18} />
        <span className="undo-text">
          <span className="undo-action">{t('undo.button')}</span>
          <span className="undo-label">{label}</span>
        </span>
      </button>
    </div>
  )
}
