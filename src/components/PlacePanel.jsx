import { useState, useEffect } from 'react'
import { workerPost } from '../services/api.js'
import PixelButton from './PixelButton.jsx'

const PRICE = ['', '€', '€€', '€€€', '€€€€']

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export default function PlacePanel({ poi, onClose, onNavigate }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => {
    setLoading(true)
    setDetails(null)
    setPhotoUrl(null)
    workerPost('/place-details', { place_id: poi.id })
      .then(data => {
        const d = data.result || {}
        setDetails(d)
        if (d.photos?.[0]?.photo_reference) {
          workerPost('/photo', { photo_reference: d.photos[0].photo_reference, maxwidth: 600 })
            .then(r => setPhotoUrl(r.url))
            .catch(() => {})
        }
      })
      .catch(() => setDetails({}))
      .finally(() => setLoading(false))
  }, [poi.id])

  return (
    <div className="place-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="place-panel">
        {/* Handle */}
        <div className="place-panel-handle" />

        {/* Close */}
        <button className="place-panel-close" onClick={onClose}>✕</button>

        {/* Photo */}
        {photoUrl && (
          <img
            className="place-panel-photo"
            src={photoUrl}
            alt={poi.name}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}

        <div className="place-panel-body">
          {/* Category chip */}
          <div className="place-panel-chip" style={{ background: poi.color + '22', color: poi.color }}>
            {poi.icon} {poi.category === 'restaurantes' ? 'Restaurante' : poi.category === 'cultura' ? 'Cultura & ocio' : poi.category}
          </div>

          {/* Name */}
          <div className="place-panel-name">{details?.name || poi.name}</div>

          {/* Rating / price / status */}
          {!loading && (
            <div className="place-panel-meta">
              {details?.rating && (
                <span className="poi-rating">⭐ {details.rating.toFixed(1)}
                  <span style={{ color: '#8b949e', fontWeight: 400 }}> ({details.user_ratings_total?.toLocaleString()})</span>
                </span>
              )}
              {details?.price_level != null && (
                <span className="poi-price">{PRICE[details.price_level]}</span>
              )}
              {details?.opening_hours?.open_now !== undefined && (
                <span className={`poi-open ${details.opening_hours.open_now ? 'yes' : 'no'}`}>
                  {details.opening_hours.open_now ? '● Abierto' : '● Cerrado'}
                </span>
              )}
            </div>
          )}

          {loading && <div className="place-panel-loading"><span className="spinner">⟳</span> Cargando...</div>}

          {!loading && details && (
            <>
              {/* Address */}
              {details.formatted_address && (
                <div className="place-detail-row">
                  <span className="place-detail-icon">📍</span>
                  <span className="place-detail-text">{details.formatted_address}</span>
                </div>
              )}

              {/* Phone */}
              {details.formatted_phone_number && (
                <a className="place-detail-row place-detail-link" href={`tel:${details.formatted_phone_number}`}>
                  <span className="place-detail-icon">📞</span>
                  <span className="place-detail-text">{details.formatted_phone_number}</span>
                  <span className="place-detail-arrow">Llamar →</span>
                </a>
              )}

              {/* Website */}
              {details.website && (
                <a className="place-detail-row place-detail-link" href={details.website} target="_blank" rel="noopener noreferrer">
                  <span className="place-detail-icon">🌐</span>
                  <span className="place-detail-text">{hostname(details.website)}</span>
                  <span className="place-detail-arrow">↗</span>
                </a>
              )}

              {/* Google Maps link */}
              {details.url && (
                <a className="place-detail-row place-detail-link" href={details.url} target="_blank" rel="noopener noreferrer">
                  <span className="place-detail-icon">🗺</span>
                  <span className="place-detail-text">Ver en Google Maps</span>
                  <span className="place-detail-arrow">↗</span>
                </a>
              )}

              {/* Hours */}
              {details.opening_hours?.weekday_text?.length > 0 && (
                <div className="place-hours">
                  <div className="place-hours-title">Horario</div>
                  {details.opening_hours.weekday_text.map((line, i) => {
                    const [day, hours] = line.split(': ')
                    return (
                      <div key={i} className="place-hours-row">
                        <span className="place-hours-day">{day}</span>
                        <span className="place-hours-time">{hours}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigate button */}
        <div className="place-panel-footer">
          <PixelButton className="place-nav-btn" onClick={() => { onClose(); onNavigate(poi) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
            Navegar aquí
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
