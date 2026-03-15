import { useState, useEffect } from 'react'
import MapView from '../components/MapView.jsx'
import CategoryMenu from '../components/CategoryMenu.jsx'
import POIResults from '../components/POIResults.jsx'
import { formatDistance, formatDuration } from '../services/routing.js'
import { fetchPOIs } from '../services/pois.js'
import { getSpotifyData } from '../services/spotify.js'
import { getWeatherForWaypoints } from '../services/weather.js'

const DOT_COLORS = { start: '#3fb950', stop: '#e3b341', end: '#f85149' }

export default function RouteScreen({ data, onBack, onNavigate }) {
  const [mapExpanded,    setMapExpanded]    = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [pois,           setPois]           = useState([])
  const [isLoadingPois,  setIsLoadingPois]  = useState(false)
  const [spotifyData,    setSpotifyData]    = useState(null)
  const [weather,        setWeather]        = useState({})

  const { legs, polyline, totalDistance, totalDuration, waypoints } = data || {}
  const valid = waypoints?.filter(w => w.lat && w.lng) || []
  const dest  = valid[valid.length - 1]

  useEffect(() => {
    if (!valid.length) return
    getWeatherForWaypoints(valid).then(results => {
      const map = {}; results.forEach(r => { if (!r.error) map[r.id] = r }); setWeather(map)
    })
    if (polyline?.length) getSpotifyData(polyline).then(setSpotifyData)
  }, [])

  useEffect(() => {
    if (!activeCategory || activeCategory === 'spotify') { setPois([]); return }
    setIsLoadingPois(true); setPois([])
    fetchPOIs(activeCategory, polyline, valid)
      .then(setPois).catch(() => setPois([])).finally(() => setIsLoadingPois(false))
  }, [activeCategory])

  const from  = valid[0]?.name?.split(',')[0] || '—'
  const to    = valid[valid.length - 1]?.name?.split(',')[0] || '—'

  return (
    <div className="route-screen">
      {/* Header */}
      <div className="route-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <span className="route-title" style={{ fontSize: '0.85rem' }}>
          {from} → {to}
        </span>
      </div>

      <div className="route-body">

        {/* Map — tap to expand */}
        <div className={`route-map-wrap${mapExpanded ? ' expanded' : ''}`} onClick={() => setMapExpanded(v => !v)}>
          <MapView waypoints={valid} polyline={polyline} pois={pois} />
          <div className="map-expand-hint">{mapExpanded ? '↙ Reducir' : '↗ Ampliar mapa'}</div>
        </div>

        {/* ── COMPACT SUMMARY ───────────────────────────────── */}
        <div style={{ padding: '12px 14px 8px' }}>

          {/* Stats strip — full width, 3 columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            background: 'linear-gradient(135deg, #0e1c3e, #121e44)',
            border: '1px solid rgba(88,166,255,0.16)',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 10,
          }}>
            {[
              { label: 'Distancia', value: formatDistance(totalDistance), color: '#58a6ff' },
              { label: 'Tiempo',    value: formatDuration(totalDuration),  color: '#e3b341' },
              { label: 'Paradas',   value: valid.length,                   color: '#3fb950' },
            ].map((stat, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '10px 6px',
                borderRight: i < 2 ? '1px solid rgba(88,166,255,0.12)' : 'none',
              }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.02em' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '0.6rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Horizontal route strip — scrollable */}
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content', padding: '2px 2px' }}>
              {valid.map((wp, i) => {
                const seg = legs?.[i]
                const w   = weather[wp.id]
                return (
                  <div key={wp.id} style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Stop card */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      background: '#0e1c3e',
                      border: `1px solid ${DOT_COLORS[wp.type] || DOT_COLORS.stop}55`,
                      borderRadius: 10,
                      padding: '7px 10px',
                      minWidth: 80, maxWidth: 100,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: DOT_COLORS[wp.type] || DOT_COLORS.stop,
                        boxShadow: `0 0 8px ${DOT_COLORS[wp.type] || DOT_COLORS.stop}`,
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600, color: '#e6edf3',
                        textAlign: 'center', lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', maxWidth: 80,
                      }}>
                        {wp.name?.split(',')[0] || `Parada ${i + 1}`}
                      </span>
                      {w && (
                        <span style={{ fontSize: '0.65rem', color: '#8b949e', whiteSpace: 'nowrap' }}>
                          {w.icon} {w.temp}°C
                        </span>
                      )}
                    </div>

                    {/* Segment connector */}
                    {seg && i < valid.length - 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 4px', minWidth: 70 }}>
                        <span style={{ fontSize: '0.62rem', color: '#58a6ff', fontWeight: 600, whiteSpace: 'nowrap' }}>{seg.distanceText}</span>
                        <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, rgba(88,166,255,0.22) 60%, transparent)', margin: '3px 0' }} />
                        <span style={{ fontSize: '0.6rem', color: '#8b949e', whiteSpace: 'nowrap' }}>{seg.durationText}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category menu — 3D carousel */}
        <CategoryMenu
          active={activeCategory}
          onSelect={cat => setActiveCategory(prev => prev === cat ? null : cat)}
        />

        {/* Results */}
        {activeCategory && (
          <POIResults
            category={activeCategory}
            pois={pois}
            spotifyData={spotifyData}
            isLoading={isLoadingPois}
            onNavigate={onNavigate}
          />
        )}

      </div>
    </div>
  )
}
