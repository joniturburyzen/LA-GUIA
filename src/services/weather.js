const WMO_ICON = (c) => {
  if (c === 0) return '☀️'
  if (c <= 2)  return '🌤'
  if (c <= 3)  return '☁️'
  if (c <= 48) return '🌫'
  if (c <= 67) return '🌧'
  if (c <= 77) return '❄️'
  if (c <= 82) return '🌦'
  return '⛈'
}

export async function getWeatherForWaypoints(waypoints) {
  return Promise.all(
    waypoints.map(async (wp) => {
      if (!wp.lat || !wp.lng) return { id: wp.id, error: true }
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${wp.lat}&longitude=${wp.lng}&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`
        const res = await fetch(url)
        const data = await res.json()
        const c = data.current
        return {
          id: wp.id,
          temp: Math.round(c.temperature_2m),
          icon: WMO_ICON(c.weather_code),
          wind: Math.round(c.wind_speed_10m),
        }
      } catch {
        return { id: wp.id, error: true }
      }
    })
  )
}
