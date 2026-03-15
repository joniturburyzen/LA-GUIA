import { workerPost } from './api.js'

// Decode Google's encoded polyline format → [[lat, lng], ...]
export function decodePolyline(encoded) {
  const points = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let shift = 0, result = 0, b
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)
    shift = 0; result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)
    points.push([lat / 1e5, lng / 1e5])
  }
  return points
}

export async function getDirections(waypoints) {
  if (waypoints.length < 2) return null
  const valid = waypoints.filter(w => w.lat && w.lng)
  if (valid.length < 2) return null

  const [first, ...rest] = valid
  const last = rest.pop()
  const midStops = rest.map(w => `${w.lat},${w.lng}`)

  const data = await workerPost('/directions', {
    origin: `${first.lat},${first.lng}`,
    destination: `${last.lat},${last.lng}`,
    waypoints: midStops,
  })

  if (data.status !== 'OK') return null

  const route = data.routes[0]
  const legs = route.legs.map((leg, i) => ({
    index: i,
    from: valid[i].name,
    to: valid[i + 1].name,
    distance: leg.distance.value,
    duration: leg.duration.value,
    distanceText: leg.distance.text,
    durationText: leg.duration.text,
  }))

  const polyline = decodePolyline(route.overview_polyline.points)
  const totalDistance = legs.reduce((s, l) => s + l.distance, 0)
  const totalDuration = legs.reduce((s, l) => s + l.duration, 0)

  return { legs, polyline, totalDistance, totalDuration, waypoints: valid }
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(0)} km`
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// Sample N evenly-distributed points from a polyline
export function samplePolyline(polyline, n = 6) {
  if (!polyline || polyline.length === 0) return []
  if (polyline.length <= n) return polyline.map(([lat, lng]) => ({ lat, lng }))
  const step = Math.floor(polyline.length / n)
  return Array.from({ length: n }, (_, i) => {
    const [lat, lng] = polyline[i * step]
    return { lat, lng }
  })
}
