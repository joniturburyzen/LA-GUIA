import { workerPost } from './api.js'

let timer = null

export function debounceAutocomplete(input, lat, lng, callback, delay = 450) {
  clearTimeout(timer)
  if (!input || input.length < 2) { callback([]); return }
  timer = setTimeout(async () => {
    try {
      const data = await workerPost('/autocomplete', { input, lat, lng })
      if (data.status === 'OK') {
        callback(data.predictions.map(p => ({
          placeId: p.place_id,
          main: p.structured_formatting?.main_text || p.description,
          secondary: p.structured_formatting?.secondary_text || '',
          description: p.description,
        })))
      } else {
        callback([])
      }
    } catch {
      callback([])
    }
  }, delay)
}

export async function getPlaceCoords(placeId) {
  try {
    const data = await workerPost('/place-details', { place_id: placeId })
    if (data.status === 'OK') {
      const loc = data.result.geometry.location
      return {
        lat: loc.lat,
        lng: loc.lng,
        name: data.result.name || data.result.formatted_address.split(',')[0],
        address: data.result.formatted_address,
      }
    }
  } catch {}
  return null
}

export async function getRegionFromCoords(lat, lng) {
  try {
    const data = await workerPost('/geocode', { lat, lng })
    if (data.status === 'OK' && data.results.length > 0) {
      const comps = data.results[0].address_components
      const region = comps.find(c => c.types.includes('administrative_area_level_1'))
      const country = comps.find(c => c.types.includes('country'))
      return {
        region: region?.long_name,
        country: country?.long_name,
        countryCode: country?.short_name,
      }
    }
  } catch {}
  return null
}
