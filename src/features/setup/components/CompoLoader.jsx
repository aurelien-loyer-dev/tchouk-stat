import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { teamSwatchStyle } from '../../../lib/teamColor'

// Gestionnaire de compositions sauvegardées (charger / éditer / supprimer)
export default function CompoLoader({ compos, onLoad, onSave, onDelete, onUpdate, currentTeamLabel }) {
  const { t } = useTranslation()
  const [open, setOpen]         = useState(false)
  const [saveName, setSaveName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft]       = useState(null)

  function startEdit(c) {
    setEditingId(c.id)
    setDraft({ name: c.name, teamName: c.teamName, color: c.color, players: [...c.players] })
  }

  function cancelEdit() { setEditingId(null); setDraft(null) }

  function confirmEdit() {
    if (!draft) return
    onUpdate(editingId, {
      name:     draft.name.trim() || draft.teamName,
      teamName: draft.teamName,
      color:    draft.color,
      players:  draft.players.filter(p => p.trim()),
    })
    cancelEdit()
  }

  function draftSetPlayer(i, val) {
    setDraft(d => { const p = [...d.players]; p[i] = val; return { ...d, players: p } })
  }

  function handleSave() {
    const n = saveName.trim()
    if (!n) return
    onSave(n)
    setSaveName('')
  }

  return (
    <div className="ps-compo-mgr">
      <button className="btn-mini ps-compo-toggle" onClick={() => setOpen(v => !v)}>
        {open ? t('setup.compos.toggleOpen') : t('setup.compos.toggleClosed')}
      </button>
      {open && (
        <div className="ps-compo-panel">
          {compos.length === 0
            ? <div className="ps-compo-empty">{t('setup.compos.empty')}</div>
            : compos.map(c => (
                <div key={c.id}>
                  {editingId === c.id && draft ? (
                    <div className="ps-compo-edit">
                      <div className="ps-compo-edit-row">
                        <input
                          className="ps-compo-edit-input"
                          placeholder={t('setup.compos.namePlaceholder')}
                          value={draft.name}
                          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        />
                      </div>
                      <div className="ps-compo-edit-row">
                        <input
                          className="ps-compo-edit-input"
                          placeholder={t('setup.compos.teamNamePlaceholder')}
                          value={draft.teamName}
                          onChange={e => setDraft(d => ({ ...d, teamName: e.target.value }))}
                        />
                        <input
                          type="color"
                          className="color-in ps-compo-edit-color"
                          value={draft.color}
                          onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                        />
                      </div>
                      <div className="ps-compo-edit-players">
                        {draft.players.map((p, i) => (
                          <div className="ps-player-row" key={i}>
                            <input
                              type="text"
                              placeholder={t('setup.compos.playerPlaceholder', { n: i + 1 })}
                              value={p}
                              onChange={e => draftSetPlayer(i, e.target.value)}
                            />
                            {draft.players.length > 1 && (
                              <button className="btn-mini ps-rm-btn"
                                onClick={() => setDraft(d => ({ ...d, players: d.players.filter((_, j) => j !== i) }))}>×</button>
                            )}
                          </div>
                        ))}
                        <button className="btn-mini ps-add-btn"
                          onClick={() => setDraft(d => ({ ...d, players: [...d.players, ''] }))}>{t('setup.compos.addPlayer')}</button>
                      </div>
                      <div className="ps-compo-edit-actions">
                        <button className="btn-mini ps-compo-ok" onClick={confirmEdit}>{t('setup.compos.validate')}</button>
                        <button className="btn-mini" onClick={cancelEdit}>{t('setup.compos.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="ps-compo-item">
                      <span className="ps-compo-dot" style={teamSwatchStyle(c.color)} />
                      <span className="ps-compo-lbl">
                        <span className="ps-compo-name">{c.name}</span>
                        <span className="ps-compo-meta">{c.teamName} · {t('setup.compos.playersCount', { count: c.players.length })}</span>
                      </span>
                      <button className="btn-mini" onClick={() => { onLoad(c); setOpen(false) }}>{t('setup.compos.load')}</button>
                      <button className="btn-mini ps-compo-edit-btn" onClick={() => startEdit(c)}>✏</button>
                      <button className="btn-mini ps-compo-del" onClick={() => onDelete(c.id)}>×</button>
                    </div>
                  )}
                </div>
              ))
          }
          <div className="ps-compo-save">
            <input
              type="text"
              placeholder={currentTeamLabel ? t('setup.compos.saveNamedPlaceholder', { name: currentTeamLabel }) : t('setup.compos.savePlaceholder')}
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onFocus={() => { if (!saveName && currentTeamLabel) setSaveName(currentTeamLabel) }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button className="btn-mini" onClick={handleSave}>{t('setup.compos.save')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
