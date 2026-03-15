import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTR  = '&copy; <a href="https://carto.com/">CARTO</a>'

const DOT_COLORS = { start: '#3fb950', stop: '#e3b341', end: '#f85149' }

function waypointIcon(type, label) {
  const bg = DOT_COLORS[type] || '#e3b341'
  return L.divIcon({
    html: `<div class="map-marker" style="background:${bg}">${label}</div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
  })
}

function poiIcon(color, emoji) {
  return L.divIcon({
    html: `<div class="poi-marker" style="background:${color}">${emoji}</div>`,
    className: '', iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -14],
  })
}

function waypointLabel(index, total) {
  if (index === 0) return 'A'
  if (index === total - 1) return 'B'
  return String(index)
}

function FitBounds({ waypoints, polyline }) {
  const map = useMap()

  useEffect(() => {
    const pts = waypoints.filter(w => w.lat && w.lng).map(w => [w.lat, w.lng])
    if (pts.length >= 2) {
      map.fitBounds(pts, { padding: [30, 30], animate: true, maxZoom: 14 })
    } else if (pts.length === 1) {
      map.setView(pts[0], 13, { animate: true })
    }
  }, [JSON.stringify(waypoints.map(w => `${w.lat},${w.lng}`))])

  return null
}

export default function MapView({ waypoints = [], polyline = [], pois = [], center = [40.416, -3.703], zoom = 6 }) {
  const validWaypoints = waypoints.filter(w => w.lat && w.lng)

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <TileLayer url={TILES} attribution={ATTR} />

      <FitBounds waypoints={waypoints} polyline={polyline} />

      {/* Route polyline */}
      {polyline.length > 1 && (
        <Polyline positions={polyline} color="#58a6ff" weight={3} opacity={0.85} />
      )}

      {/* Waypoint markers */}
      {validWaypoints.map((wp, i) => (
        <Marker
          key={wp.id}
          position={[wp.lat, wp.lng]}
          icon={waypointIcon(wp.type, waypointLabel(i, validWaypoints.length))}
        >
          <Popup>{wp.name || wp.address || 'Parada'}</Popup>
        </Marker>
      ))}

      {/* POI markers */}
      {pois.map(poi => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
          icon={poiIcon(poi.color, poi.icon)}
        >
          <Popup>
            <strong>{poi.name}</strong>
            {poi.rating && <div>⭐ {poi.rating} ({poi.totalRatings})</div>}
            {poi.vicinity && <div style={{ color: '#8b949e', fontSize: '0.75rem' }}>{poi.vicinity}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
