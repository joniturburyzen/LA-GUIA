import { useState } from 'react'
import PlacePanel from './PlacePanel.jsx'
import { workerPost } from '../services/api.js'

const PRICE = ['', '€', '€€', '€€€', '€€€€']
const HAS_DETAIL = new Set(['restaurantes', 'cultura'])

// Navigate icon (compass arrow)
function NavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
    </svg>
  )
}

// Phone icon
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  )
}

export default function POIResults({ category, pois, spotifyData, isLoading, onNavigate }) {
  const [activePoi, setActivePoi]   = useState(null)
  const [callingId, setCallingId]   = useState(null) // poi.id being looked up for call

  async function handleCall(e, poi) {
    e.stopPropagation()
    setCallingId(poi.id)
    try {
      const data = await workerPost('/place-details', { place_id: poi.id })
      const phone = data.result?.formatted_phone_number
      if (phone) {
        window.location.href = `tel:${phone}`
      } else {
        alert('Teléfono no disponible')
      }
    } catch {
      alert('No se pudo obtener el teléfono')
    } finally {
      setCallingId(null)
    }
  }

  function handleNavigateClick(e, poi) {
    e.stopPropagation()
    onNavigate(poi)
  }

  // ── Spotify ──────────────────────────────────────────────
  if (category === 'spotify') {
    if (!spotifyData) return (
      <div className="poi-results">
        <div className="poi-loading"><span className="spinner">⟳</span> Detectando región...</div>
      </div>
    )
    return (
      <div className="poi-results">
        <a className="spotify-card" href={spotifyData.url} target="_blank" rel="noopener noreferrer">
          <span className="spotify-emoji">🎵</span>
          <div className="spotify-info">
            <div className="spotify-title">Música de {spotifyData.region}</div>
            <div className="spotify-sub">{spotifyData.style} · Abrir en Spotify</div>
          </div>
          <span className="spotify-arrow">→</span>
        </a>
        <div style={{ fontSize: '0.75rem', color: '#8b949e', padding: '4px 4px 0' }}>
          Sugerencia basada en el punto medio de tu ruta
        </div>
      </div>
    )
  }

  if (!category) return null

  if (isLoading) return (
    <div className="poi-results">
      <div className="poi-loading"><span className="spinner">⟳</span> Buscando...</div>
    </div>
  )

  if (!pois.length) return (
    <div className="poi-results">
      <div className="poi-empty">No se encontraron resultados en esta zona</div>
    </div>
  )

  const clickable = HAS_DETAIL.has(category)

  return (
    <div className="poi-results">
      {activePoi && (
        <PlacePanel
          poi={activePoi}
          onClose={() => setActivePoi(null)}
          onNavigate={onNavigate}
        />
      )}

      {pois.map(poi => (
        <div
          key={poi.id}
          className="poi-card"
          onClick={() => clickable && setActivePoi(poi)}
          style={{ cursor: clickable ? 'pointer' : 'default' }}
        >
          <div className="poi-icon-wrap" style={{ background: poi.color + '22' }}>
            {poi.icon}
          </div>

          <div className="poi-info">
            <div className="poi-name">{poi.name}</div>
            <div className="poi-meta">
              {poi.rating && (
                <span className="poi-rating">⭐ {poi.rating.toFixed(1)}
                  <span style={{ color: '#8b949e' }}> ({poi.totalRatings?.toLocaleString()})</span>
                </span>
              )}
              {poi.priceLevel != null && (
                <span className="poi-price">{PRICE[poi.priceLevel]}</span>
              )}
              {poi.isOpen !== undefined && (
                <span className={`poi-open ${poi.isOpen ? 'yes' : 'no'}`}>
                  {poi.isOpen ? '● Abierto' : '● Cerrado'}
                </span>
              )}
            </div>
            {poi.vicinity && <div className="poi-address">{poi.vicinity}</div>}
            {clickable && (
              <div style={{ fontSize: '0.65rem', color: '#58a6ff44', marginTop: 2 }}>
                Toca para más info
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="poi-actions">
            {category === 'restaurantes' && (
              <button
                className="poi-action-btn poi-call-btn"
                onClick={e => handleCall(e, poi)}
                title="Llamar"
                disabled={callingId === poi.id}
              >
                {callingId === poi.id
                  ? <span className="spinner" style={{ fontSize: '0.7rem' }}>⟳</span>
                  : <PhoneIcon />
                }
              </button>
            )}
            <button
              className="poi-action-btn poi-nav-btn-sm"
              onClick={e => handleNavigateClick(e, poi)}
              title="Navegar"
            >
              <NavIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
