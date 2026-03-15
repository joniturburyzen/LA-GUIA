const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function googleUrl(endpoint, params) {
  return `https://maps.googleapis.com/maps/api/${endpoint}?${new URLSearchParams(params)}`
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    const url = new URL(request.url)
    const path = url.pathname
    const KEY = env.GOOGLE_KEY

    if (!KEY) return json({ error: 'GOOGLE_KEY not configured' }, 500)

    let body = {}
    if (request.method === 'POST') {
      try { body = await request.json() } catch {}
    }

    try {

      // ─── Autocomplete mientras escribes una dirección ───────────────────────
      if (path === '/autocomplete') {
        const { input, lat, lng } = body
        if (!input) return json({ error: 'input required' }, 400)

        const params = {
          input,
          key: KEY,
          language: 'es',
          components: '', // sin restricción de país para viajes internacionales
        }
        if (lat && lng) {
          params.location = `${lat},${lng}`
          params.radius = 50000
        }

        const res = await fetch(googleUrl('place/autocomplete/json', params))
        const data = await res.json()
        return json(data)
      }

      // ─── Calcular ruta con paradas intermedias ───────────────────────────────
      if (path === '/directions') {
        const { origin, destination, waypoints } = body
        if (!origin || !destination) return json({ error: 'origin and destination required' }, 400)

        const params = {
          origin,
          destination,
          key: KEY,
          language: 'es',
          units: 'metric',
          alternatives: 'false',
        }
        if (waypoints?.length) {
          params.waypoints = waypoints.join('|')
        }

        const res = await fetch(googleUrl('directions/json', params))
        const data = await res.json()
        return json(data)
      }

      // ─── Buscar POIs cercanos a un punto de la ruta ──────────────────────────
      if (path === '/places') {
        const { lat, lng, radius = 5000, type, keyword } = body
        if (!lat || !lng) return json({ error: 'lat and lng required' }, 400)

        const params = {
          location: `${lat},${lng}`,
          radius,
          key: KEY,
          language: 'es',
        }
        if (type) params.type = type
        if (keyword) params.keyword = keyword

        const res = await fetch(googleUrl('place/nearbysearch/json', params))
        const data = await res.json()
        return json(data)
      }

      // ─── Buscar POIs a lo largo de toda la ruta (múltiples puntos) ──────────
      if (path === '/places/route') {
        const { points, type, keyword, radius = 8000 } = body
        if (!points?.length) return json({ error: 'points array required' }, 400)

        // Busca en paralelo en cada punto de muestra de la ruta
        const requests = points.map(({ lat, lng }) => {
          const params = {
            location: `${lat},${lng}`,
            radius,
            key: KEY,
            language: 'es',
          }
          if (type) params.type = type
          if (keyword) params.keyword = keyword
          return fetch(googleUrl('place/nearbysearch/json', params)).then(r => r.json())
        })

        const results = await Promise.all(requests)

        // Unificar y deduplicar por place_id
        const seen = new Set()
        const places = []
        for (const r of results) {
          for (const place of (r.results || [])) {
            if (!seen.has(place.place_id)) {
              seen.add(place.place_id)
              places.push(place)
            }
          }
        }

        // Ordenar por rating desc
        places.sort((a, b) => (b.rating || 0) - (a.rating || 0))

        return json({ status: 'OK', results: places.slice(0, 20) })
      }

      // ─── Detalle de un lugar (horario, teléfono, web, fotos) ────────────────
      if (path === '/place-details') {
        const { place_id } = body
        if (!place_id) return json({ error: 'place_id required' }, 400)

        const params = {
          place_id,
          key: KEY,
          language: 'es',
          fields: [
            'name', 'rating', 'user_ratings_total', 'formatted_address',
            'formatted_phone_number', 'website', 'opening_hours',
            'price_level', 'photos', 'geometry', 'types', 'url'
          ].join(','),
        }

        const res = await fetch(googleUrl('place/details/json', params))
        const data = await res.json()
        return json(data)
      }

      // ─── Geocodificación inversa (coords → región, para Spotify) ────────────
      if (path === '/geocode') {
        const { lat, lng, address } = body
        if (!lat && !address) return json({ error: 'lat/lng or address required' }, 400)

        const params = { key: KEY, language: 'es' }
        if (lat && lng) params.latlng = `${lat},${lng}`
        if (address) params.address = address

        const res = await fetch(googleUrl('geocode/json', params))
        const data = await res.json()
        return json(data)
      }

      // ─── Foto de un lugar (proxy para evitar CORS de Google) ────────────────
      if (path === '/photo') {
        const { photo_reference, maxwidth = 400 } = body
        if (!photo_reference) return json({ error: 'photo_reference required' }, 400)

        const params = { photo_reference, maxwidth, key: KEY }
        const res = await fetch(googleUrl('place/photo', params))

        // Google redirige a la imagen real, devolvemos la URL final
        return json({ url: res.url })
      }

      return json({ error: `Unknown endpoint: ${path}` }, 404)

    } catch (err) {
      return json({ error: err.message }, 500)
    }
  }
}
