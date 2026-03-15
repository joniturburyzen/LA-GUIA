import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet'
import { workerPost } from '../services/api.js'

// Inner component: handles map clicks and renders the circle
function InnerPicker({ pending, onPick, circleClicked, onConfirm }) {
  useMapEvents({
    click(e) {
      if (circleClicked.current) { circleClicked.current = false; return }
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  if (!pending) return null

  return (
    <Circle
      center={[pending.lat, pending.lng]}
      radius={400}
      pathOptions={{ color: '#58a6ff', fillColor: '#58a6ff', fillOpacity: 0.3, weight: 2 }}
      eventHandlers={{
        click: () => { circleClicked.current = true; onConfirm() },
      }}
    />
  )
}

export default function MapPicker({ onSelect, onClose }) {
  const [pending,  setPending]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [center,   setCenter]   = useState([40.4168, -3.7038])
  const circleClicked = useRef(false)

  // Try to center on user's location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    )
  }, [])

  async function handleConfirm() {
    if (!pending) return
    setLoading(true)
    try {
      const data = await workerPost('/geocode', { lat: pending.lat, lng: pending.lng })
      const address = data.results?.[0]?.formatted_address
        || `${pending.lat.toFixed(5)}, ${pending.lng.toFixed(5)}`
      onSelect({ lat: pending.lat, lng: pending.lng, address })
    } catch {
      onSelect({ lat: pending.lat, lng: pending.lng, address: `${pending.lat.toFixed(5)}, ${pending.lng.toFixed(5)}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="map-picker-overlay">
      <div className="map-picker">
        <div className="map-picker-header">
          <span className="map-picker-title">Selecciona ubicación</span>
          <button className="place-panel-close" onClick={onClose}>✕</button>
        </div>
        <p className="map-picker-hint">Toca el mapa · Toca el círculo azul para confirmar</p>

        <div className="map-picker-map">
          <MapContainer
            key={center.toString()}
            center={center}
            zoom={6}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <InnerPicker
              pending={pending}
              onPick={setPending}
              circleClicked={circleClicked}
              onConfirm={handleConfirm}
            />
          </MapContainer>
        </div>

        {pending && (
          <div className="map-picker-footer">
            <span className="map-picker-coords">
              {pending.lat.toFixed(4)}, {pending.lng.toFixed(4)}
            </span>
            <button
              className="place-nav-btn"
              style={{ padding: '9px 20px', width: 'auto', minWidth: 120 }}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? <span className="spinner">⟳</span> : '✓ Confirmar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
