import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { debounceAutocomplete, getPlaceCoords } from '../services/geocoding.js'
import { formatDistance, formatDuration } from '../services/routing.js'

const DOT_COLORS = { start: '#3fb950', stop: '#e3b341', end: '#f85149' }
const PLACEHOLDERS = { start: 'Ciudad de salida...', end: 'Destino final...', stop: 'Parada intermedia...' }

export default function RouteForm({ waypoints, onWaypointsChange, segments, totalDistance, totalDuration, isCalculating, onGenerate }) {
  const [suggestions, setSuggestions] = useState({})
  const [activeInput, setActiveInput] = useState(null)
  const inputRefs = useRef({})

  const canGenerate = waypoints.filter(w => w.lat && w.lng).length >= 2

  const handleInput = useCallback((id, value) => {
    onWaypointsChange(waypoints.map(w => w.id === id ? { ...w, name: value, lat: null, lng: null } : w))
    if (!value) { setSuggestions(s => ({ ...s, [id]: [] })); return }
    debounceAutocomplete(value, null, null, r => setSuggestions(s => ({ ...s, [id]: r })))
  }, [waypoints, onWaypointsChange])

  const handleFocus = useCallback((id) => {
    setActiveInput(id)
  }, [])

  const handleSelect = useCallback(async (id, sug) => {
    setSuggestions(s => ({ ...s, [id]: [] }))
    setActiveInput(null)
    const coords = await getPlaceCoords(sug.placeId)
    if (coords) {
      onWaypointsChange(waypoints.map(w => w.id === id ? { ...w, name: coords.name, address: coords.address, lat: coords.lat, lng: coords.lng } : w))
    }
  }, [waypoints, onWaypointsChange])

  const addStop = () => {
    const updated = [...waypoints]
    updated.splice(updated.length - 1, 0, { id: `stop-${Date.now()}`, type: 'stop', name: '', lat: null, lng: null })
    onWaypointsChange(updated)
  }

  const removeStop = id => onWaypointsChange(waypoints.filter(w => w.id !== id))

  // ── Dropdown: position calculated live from the DOM ref — never stale ──
  const activeSugs = activeInput ? (suggestions[activeInput] || []) : []
  const activeEl   = activeInput ? inputRefs.current[activeInput] : null
  const dropRect   = activeEl ? activeEl.getBoundingClientRect() : null
  const dropPos    = dropRect ? { top: dropRect.bottom + 3, left: dropRect.left, width: dropRect.width } : null

  const dropdown = activeSugs.length > 0 && dropPos ? createPortal(
    <div style={{
      position: 'fixed',
      top:      dropPos.top,
      left:     dropPos.left,
      width:    dropPos.width,
      zIndex:   99999,
      background: '#21262d',
      border: '1px solid #58a6ff44',
      borderRadius: 10,
      boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
      overflow: 'hidden',
      maxHeight: 220,
      overflowY: 'auto',
    }}>
      {activeSugs.map(s => (
        <div
          key={s.placeId}
          onMouseDown={() => handleSelect(activeInput, s)}
          onTouchStart={() => handleSelect(activeInput, s)}
          style={{ padding: '10px 14px', borderBottom: '1px solid #30363d', cursor: 'pointer' }}
          onMouseOver={e => e.currentTarget.style.background = '#30363d'}
          onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: '0.875rem', color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.main}</div>
          {s.secondary && <div style={{ fontSize: '0.72rem', color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{s.secondary}</div>}
        </div>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <>
      {dropdown}

      {/* Waypoint inputs */}
      <div className="waypoints-list">
        {waypoints.map(wp => (
          <div key={wp.id} className="waypoint-row">
            <div className="waypoint-dot" style={{ background: DOT_COLORS[wp.type] || DOT_COLORS.stop }} />
            <div className="wp-input-wrap">
              <input
                ref={el => { inputRefs.current[wp.id] = el }}
                className={`wp-input${wp.lat ? ' has-value' : ''}`}
                type="text"
                placeholder={PLACEHOLDERS[wp.type] || PLACEHOLDERS.stop}
                value={wp.name}
                onChange={e => handleInput(wp.id, e.target.value)}
                onFocus={() => handleFocus(wp.id)}
                onBlur={() => {
                  const blurredId = wp.id
                  const blurredEl = inputRefs.current[wp.id]
                  setTimeout(() => {
                    // Only clear if focus truly left (not spurious mobile keyboard blur)
                    // and if this input is still the one shown in the dropdown
                    if (document.activeElement !== blurredEl) {
                      setActiveInput(prev => prev === blurredId ? null : prev)
                    }
                  }, 200)
                }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {wp.type === 'stop' && (
              <button className="wp-remove" onMouseDown={() => removeStop(wp.id)}>✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Add stop */}
      <button className="add-stop-btn" onClick={addStop}>
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>＋</span> Añadir parada
      </button>

      {/* Mini route summary — only when we have segments */}
      {segments.length > 0 && (
        <div className="mini-route">
          {waypoints.filter(w => w.lat && w.lng).map((wp, i, arr) => {
            const seg = segments[i]
            return (
              <div key={wp.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: DOT_COLORS[wp.type] || DOT_COLORS.stop,
                    boxShadow: `0 0 6px ${DOT_COLORS[wp.type] || DOT_COLORS.stop}88`,
                  }} />
                  <span style={{ fontSize: '0.78rem', color: '#e6edf3', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {wp.name?.split(',')[0] || '—'}
                  </span>
                </div>
                {seg && i < arr.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 3, margin: '2px 0' }}>
                    <div style={{ width: 2, height: 24, background: 'repeating-linear-gradient(to bottom, #30363d 0, #30363d 3px, transparent 3px, transparent 6px)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#21262d', borderRadius: 6, padding: '3px 8px', flex: 1 }}>
                      <span style={{ fontSize: '0.68rem', color: '#58a6ff', fontWeight: 600 }}>{seg.distanceText}</span>
                      <span style={{ fontSize: '0.62rem', color: '#30363d' }}>·</span>
                      <span style={{ fontSize: '0.68rem', color: '#8b949e' }}>{seg.durationText}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {totalDistance > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 4, padding: '5px 8px',
              background: 'linear-gradient(135deg, #21262d, #161b22)',
              borderRadius: 7, border: '1px solid #30363d',
            }}>
              <span style={{ fontSize: '0.72rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
              <span style={{ fontSize: '0.78rem', color: '#3fb950', fontWeight: 700 }}>
                {formatDistance(totalDistance)} · {formatDuration(totalDuration)}
              </span>
            </div>
          )}
        </div>
      )}

      {isCalculating && (
        <div style={{ fontSize: '0.72rem', color: '#8b949e', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="spinner" style={{ fontSize: '0.85rem' }}>⟳</span> Calculando...
        </div>
      )}

      <button className="generate-btn" disabled={!canGenerate || isCalculating} onClick={onGenerate}>
        {isCalculating ? 'Calculando...' : 'Generar ruta →'}
      </button>
    </>
  )
}
