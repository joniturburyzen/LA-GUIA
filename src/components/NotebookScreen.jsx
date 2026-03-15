import { useState } from 'react'
import { useLocalStorage } from '../utils/useLocalStorage.js'
import EntryForm from './EntryForm.jsx'

function NavIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
    </svg>
  )
}

function EntryCard({ entry, expanded, onToggle, onDelete, onNavigate, onViewPhoto }) {
  const date = new Date(entry.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className={`nb-card ${expanded ? 'expanded' : ''}`}>
      {/* Collapsed header — always visible */}
      <div className="nb-card-head" onClick={onToggle}>
        <div className="nb-card-icon">📓</div>
        <div className="nb-card-summary">
          <div className="nb-card-label">{entry.label}</div>
          <div className="nb-card-sub">
            {entry.location.address
              ? entry.location.address.split(',')[0]
              : 'Sin ubicación'
            } · {date}
          </div>
        </div>
        <span className="nb-card-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="nb-card-detail">
          {/* Location */}
          {entry.location.address && (
            <div className="nb-detail-row">
              <span className="nb-detail-icon">📍</span>
              <span className="nb-detail-txt">{entry.location.address}</span>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="nb-detail-row">
              <span className="nb-detail-icon">✏️</span>
              <span className="nb-detail-txt">{entry.notes}</span>
            </div>
          )}

          {/* Photos */}
          {entry.photos.length > 0 && (
            <div className="nb-photos">
              {entry.photos.map((p, i) => (
                <img
                  key={i}
                  src={p}
                  className="nb-photo-thumb"
                  alt=""
                  onClick={() => onViewPhoto(p)}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="nb-card-actions">
            {entry.location.lat && (
              <button className="nb-action-nav" onClick={onNavigate}>
                <NavIcon /> Navegar
              </button>
            )}
            <button className="nb-action-del" onClick={onDelete}>
              🗑 Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NotebookScreen({ onClose, onNavigate }) {
  const [entries, setEntries] = useLocalStorage('la-guia-notebook', [])
  const [showForm,    setShowForm]    = useState(false)
  const [expandedId,  setExpandedId]  = useState(null)
  const [viewPhoto,   setViewPhoto]   = useState(null)

  function addEntry(entry) {
    setEntries(prev => [{ id: Date.now(), ...entry }, ...prev])
  }

  function deleteEntry(id) {
    if (!confirm('¿Eliminar esta entrada?')) return
    setEntries(prev => prev.filter(e => e.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function handleNavigate(entry) {
    onNavigate({
      lat: entry.location.lat,
      lng: entry.location.lng,
      name: entry.label,
      icon: '📓',
      color: '#58a6ff',
      vicinity: entry.location.address,
    })
  }

  return (
    <div className="nb-overlay">
      {/* Photo fullscreen viewer */}
      {viewPhoto && (
        <div className="nb-photo-viewer" onClick={() => setViewPhoto(null)}>
          <img src={viewPhoto} alt="" />
          <button className="nb-photo-close">✕</button>
        </div>
      )}

      {/* Entry form */}
      {showForm && (
        <EntryForm
          onClose={() => setShowForm(false)}
          onAdd={entry => { addEntry(entry); setShowForm(false) }}
        />
      )}

      <div className="nb-screen">
        {/* Header */}
        <div className="nb-header">
          <button className="back-btn" onClick={onClose}>← Volver</button>
          <span className="nb-title">Mis Lugares</span>
        </div>

        {/* List */}
        <div className="nb-body">
          {entries.length === 0 ? (
            <div className="nb-empty">
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📓</div>
              <div>Todavía no hay entradas.</div>
              <div style={{ fontSize: '0.78rem', color: '#8b949e', marginTop: 4 }}>
                Toca "Añadir entrada" para empezar.
              </div>
            </div>
          ) : (
            entries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                onDelete={() => deleteEntry(entry.id)}
                onNavigate={() => handleNavigate(entry)}
                onViewPhoto={setViewPhoto}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="nb-footer">
          <button className="nb-add-btn" onClick={() => setShowForm(true)}>
            ＋ Añadir entrada
          </button>
        </div>
      </div>
    </div>
  )
}
