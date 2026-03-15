import { workerPost } from './api.js'
import { samplePolyline } from './routing.js'

export const CATEGORY_CONFIG = {
  restaurantes: { type: 'restaurant',        radius: 8000,  icon: '🍽', color: '#ef4444', label: 'Restaurantes' },
  cultura:      { type: 'tourist_attraction', radius: 15000, icon: '🏛', color: '#8b5cf6', label: 'Cultura' },
  gasolineras:  { type: 'gas_station',        radius: 6000,  icon: '⛽', color: '#f97316', label: 'Gasolineras' },
  parking:      { type: 'parking',            radius: 2000,  icon: '🅿', color: '#22c55e', label: 'Parking' },
}

export async function fetchPOIs(category, polyline, destWaypoint) {
  const cfg = CATEGORY_CONFIG[category]
  if (!cfg) return []

  // Parking: only near destination. Others: distributed along route.
  const points = category === 'parking'
    ? [destWaypoint]
    : samplePolyline(polyline, category === 'gasolineras' ? 8 : 5)

  const data = await workerPost('/places/route', {
    points,
    type: cfg.type,
    radius: cfg.radius,
  })

  if (data.status !== 'OK') return []

  return data.results.map(place => ({
    id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    rating: place.rating,
    totalRatings: place.user_ratings_total,
    priceLevel: place.price_level,
    vicinity: place.vicinity,
    isOpen: place.opening_hours?.open_now,
    photoRef: place.photos?.[0]?.photo_reference,
    category,
    icon: cfg.icon,
    color: cfg.color,
  }))
}
