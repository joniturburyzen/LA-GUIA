import { useState, useEffect, useCallback } from 'react'
import MapView from '../components/MapView.jsx'
import RouteForm from '../components/RouteForm.jsx'
import { getDirections } from '../services/routing.js'

const DEFAULT_WAYPOINTS = [
  { id: 'start', type: 'start', name: '', lat: null, lng: null },
  { id: 'end',   type: 'end',   name: '', lat: null, lng: null },
]

export default function PlanScreen({ onGenerateRoute }) {
  const [waypoints, setWaypoints] = useState(DEFAULT_WAYPOINTS)
  const [segments, setSegments]   = useState([])
  const [polyline, setPolyline]   = useState([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)

  // Recalculate route whenever waypoints change (if ≥2 have coords)
  useEffect(() => {
    const valid = waypoints.filter(w => w.lat && w.lng)
    if (valid.length < 2) { setSegments([]); setPolyline([]); setTotalDistance(0); setTotalDuration(0); return }

    const calc = async () => {
      setIsCalculating(true)
      try {
        const result = await getDirections(valid)
        if (result) {
          setSegments(result.legs)
          setPolyline(result.polyline)
          setTotalDistance(result.totalDistance)
          setTotalDuration(result.totalDuration)
        }
      } catch (e) {
        console.warn('Directions error:', e)
      } finally {
        setIsCalculating(false)
      }
    }

    // Debounce slightly so we don't fire on every keystroke
    const t = setTimeout(calc, 300)
    return () => clearTimeout(t)
  }, [JSON.stringify(waypoints.map(w => `${w.lat},${w.lng}`))])

  const handleGenerate = useCallback(async () => {
    setIsCalculating(true)
    try {
      const valid = waypoints.filter(w => w.lat && w.lng)
      const result = await getDirections(valid)
      if (result) {
        onGenerateRoute({ ...result, waypoints })
      }
    } catch (e) {
      console.warn('Generate error:', e)
    } finally {
      setIsCalculating(false)
    }
  }, [waypoints, onGenerateRoute])

  return (
    <div className="plan-screen">
      {/* Map fills remaining space */}
      <div className="plan-map">
        <MapView waypoints={waypoints} polyline={polyline} />
      </div>

      {/* Form panel — fixed at bottom, no page scroll */}
      <div className="plan-form-panel">
        <RouteForm
          waypoints={waypoints}
          onWaypointsChange={setWaypoints}
          segments={segments}
          totalDistance={totalDistance}
          totalDuration={totalDuration}
          isCalculating={isCalculating}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  )
}
