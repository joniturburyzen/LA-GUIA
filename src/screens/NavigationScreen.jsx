import { useState, useEffect, useRef, useCallback } from 'react'
import MapView from '../components/MapView.jsx'
import { workerPost } from '../services/api.js'
import { decodePolyline } from '../services/routing.js'

const MODES = [
  { id: 'driving',   icon: '🚗', label: 'Coche' },
  { id: 'walking',   icon: '🚶', label: 'A pie' },
  { id: 'bicycling', icon: '🚴', label: 'Bici'  },
]

// Haversine distance in metres
function distMeters(lat1, lng1, lat2, lng2) {
  const R  = 6371000
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function NavigationScreen({ poi, onBack }) {
  const [phase,       setPhase]       = useState('locating') // locating | routing | ready | error
  const [userPos,     setUserPos]     = useState(null)
  const [routeInfo,   setRouteInfo]   = useState(null)
  const [error,       setError]       = useState(null)
  const [mode,        setMode]        = useState('driving')
  const [currentStep, setCurrentStep] = useState(0)

  const userPosRef = useRef(null)   // latest GPS fix (avoids stale closures in watch callback)
  const calcedRef  = useRef(false)  // first route calculation done
  const modeRef    = useRef('driving')
  const watchIdRef = useRef(null)
  const stepRefs   = useRef([])

  // Keep modeRef in sync with state
  useEffect(() => { modeRef.current = mode }, [mode])

  // ── Route calculation ─────────────────────────────────────────────────
  const calcRoute = useCallback((pos, travelMode) => {
    setPhase('routing')
    setCurrentStep(0)
    stepRefs.current = []

    workerPost('/directions', {
      origin:      `${pos.lat},${pos.lng}`,
      destination: `${poi.lat},${poi.lng}`,
      mode:        travelMode,
    })
      .then(data => {
        if (data.routes?.[0]) {
          const leg      = data.routes[0].legs[0]
          const polyline = decodePolyline(data.routes[0].overview_polyline.points)
          const steps    = (leg.steps || []).map(s => ({
            text: s.html_instructions.replace(/<[^>]+>/g, ''),
            dist: s.distance?.text,
            lat:  s.start_location?.lat,
            lng:  s.start_location?.lng,
          }))
          setRouteInfo({ polyline, distance: leg.distance?.text, duration: leg.duration?.text, steps })
          setPhase('ready')
        } else {
          setError('No se encontró ruta')
          setPhase('error')
        }
      })
      .catch(() => { setError('Error calculando ruta'); setPhase('error') })
  }, [poi])

  // ── GPS watch — real-time position tracking ───────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización')
      setPhase('error')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        userPosRef.current = p
        setUserPos(p)
        // First position: trigger initial route calculation
        if (!calcedRef.current) {
          calcedRef.current = true
          calcRoute(p, modeRef.current)
        }
      },
      () => { setError('No se pudo obtener tu ubicación. Activa el GPS.'); setPhase('error') },
      { enableHighAccuracy: true, timeout: 12000 }
    )

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [calcRoute])

  // ── Advance step by proximity (look ahead up to 6 steps) ─────────────
  useEffect(() => {
    if (!routeInfo?.steps || !userPos || phase !== 'ready') return
    const steps = routeInfo.steps
    setCurrentStep(prev => {
      for (let i = prev + 1; i < Math.min(prev + 6, steps.length); i++) {
        if (!steps[i].lat) continue
        const d = distMeters(userPos.lat, userPos.lng, steps[i].lat, steps[i].lng)
        if (d < 40) return i   // within 40 m → advance to that step
      }
      return prev
    })
  }, [userPos, routeInfo, phase])

  // ── Auto-scroll current step to top of the list ───────────────────────
  useEffect(() => {
    stepRefs.current[currentStep]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentStep])

  // ── Mode change: recalculate with latest position ─────────────────────
  function handleModeChange(newMode) {
    if (newMode === mode) return
    setMode(newMode)
    modeRef.current = newMode
    if (userPosRef.current) calcRoute(userPosRef.current, newMode)
  }

  // ── Derived values ────────────────────────────────────────────────────
  const waypoints = userPos ? [
    { id: 'from', type: 'start', name: 'Tu posición', lat: userPos.lat, lng: userPos.lng },
    { id: 'to',   type: 'end',   name: poi.name,      lat: poi.lat,     lng: poi.lng     },
  ] : []

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}&travelmode=${mode}`

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

      {/* Mode selector */}
      <div className="nav-mode-bar">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`nav-mode-btn${mode === m.id ? ' active' : ''}`}
            onClick={() => handleModeChange(m.id)}
            disabled={phase === 'routing'}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Map — fills remaining space, updates as position changes */}
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
        {waypoints.length === 2 && (
          <MapView waypoints={waypoints} polyline={routeInfo?.polyline || []} pois={[]} />
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

            {/* Steps — all steps, auto-scroll as position advances */}
            {routeInfo.steps.length > 0 && (
              <div className="nav-steps">
                {routeInfo.steps.map((step, i) => (
                  <div
                    key={i}
                    ref={el => { stepRefs.current[i] = el }}
                    className={`nav-step${
                      i === currentStep ? ' nav-step-current' :
                      i < currentStep   ? ' nav-step-done'    : ''
                    }`}
                  >
                    <span className="nav-step-n">{i + 1}</span>
                    <span className="nav-step-txt">{step.text}</span>
                    <span className="nav-step-dist">{step.dist}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* External Maps — always visible */}
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
