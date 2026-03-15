import { useState, useEffect } from 'react'
import MapView from '../components/MapView.jsx'
import { workerPost } from '../services/api.js'
import { decodePolyline } from '../services/routing.js'

export default function NavigationScreen({ poi, onBack }) {
  const [phase, setPhase] = useState('locating') // locating | routing | ready | error
  const [userPos, setUserPos] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización')
      setPhase('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserPos({ lat, lng })
        setPhase('routing')

        workerPost('/directions', {
          origin: `${lat},${lng}`,
          destination: `${poi.lat},${poi.lng}`,
        })
          .then(data => {
            if (data.routes?.[0]) {
              const leg = data.routes[0].legs[0]
              const polyline = decodePolyline(data.routes[0].overview_polyline.points)
              const steps = (leg.steps || []).slice(0, 5).map(s => ({
                text: s.html_instructions.replace(/<[^>]+>/g, ''),
                dist: s.distance?.text,
              }))
              setRouteInfo({ polyline, distance: leg.distance?.text, duration: leg.duration?.text, steps })
              setPhase('ready')
            } else {
              setError('No se encontró ruta')
              setPhase('error')
            }
          })
          .catch(() => { setError('Error calculando ruta'); setPhase('error') })
      },
      () => { setError('No se pudo obtener tu ubicación. Activa el GPS.'); setPhase('error') },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }, [])

  const waypoints = userPos ? [
    { id: 'from', type: 'start', name: 'Tu posición', lat: userPos.lat, lng: userPos.lng },
    { id: 'to',   type: 'end',   name: poi.name,      lat: poi.lat,     lng: poi.lng     },
  ] : []

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}&travelmode=driving`

  return (
    <div className="nav-screen">
      {/* Header */}
      <div className="nav-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <div className="nav-header-dest">
          <span>{poi.icon}</span>
          <span className="nav-dest-name">{poi.name}</span>
        </div>
      </div>

      {/* Map */}
      <div className="nav-map-wrap">
        {(phase === 'locating' || phase === 'routing') && (
          <div className="nav-phase-msg">
            <span className="spinner">⟳</span>
            {phase === 'locating' ? 'Obteniendo tu posición...' : 'Calculando ruta...'}
          </div>
        )}
        {phase === 'error' && (
          <div className="nav-phase-msg nav-phase-error">{error}</div>
        )}
        {(phase === 'ready' || phase === 'routing') && waypoints.length === 2 && (
          <MapView
            waypoints={waypoints}
            polyline={routeInfo?.polyline || []}
            pois={[]}
          />
        )}
      </div>

      {/* Bottom panel */}
      <div className="nav-panel">
        {phase === 'ready' && routeInfo && (
          <>
            {/* Stats */}
            <div className="nav-stats-row">
              <div className="nav-stat">
                <span className="nav-stat-val">{routeInfo.distance}</span>
                <span className="nav-stat-lbl">Distancia</span>
              </div>
              <div className="nav-stat-div" />
              <div className="nav-stat">
                <span className="nav-stat-val" style={{ color: '#e3b341' }}>{routeInfo.duration}</span>
                <span className="nav-stat-lbl">Tiempo est.</span>
              </div>
            </div>

            {/* Address */}
            {poi.vicinity && (
              <div className="nav-address">📍 {poi.vicinity}</div>
            )}

            {/* Steps */}
            {routeInfo.steps.length > 0 && (
              <div className="nav-steps">
                {routeInfo.steps.map((step, i) => (
                  <div key={i} className="nav-step">
                    <span className="nav-step-n">{i + 1}</span>
                    <span className="nav-step-txt">{step.text}</span>
                    <span className="nav-step-dist">{step.dist}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* External Maps button — always visible */}
        <a className="nav-ext-btn" href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Abrir en Google Maps
        </a>
      </div>
    </div>
  )
}
