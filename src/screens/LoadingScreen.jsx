import { useState, useEffect, useRef } from 'react'
import RotatingEarth from '../components/Globe.jsx'

export default function LoadingScreen({ onComplete }) {
  const [globeLoaded, setGlobeLoaded] = useState(false)
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [zooming, setZooming] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const completedRef = useRef(false)

  // 5-second minimum timer
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 5000)
    return () => clearTimeout(t)
  }, [])

  // Start zoom when BOTH conditions are met
  useEffect(() => {
    if (globeLoaded && minTimePassed && !zooming) setZooming(true)
  }, [globeLoaded, minTimePassed])

  // Overlay fade → transition
  useEffect(() => {
    if (!zooming) return
    const t1 = setTimeout(() => setOverlayOpacity(1), 900)   // fade starts at 0.9s
    const t2 = setTimeout(() => {                              // transition at 2.2s
      if (!completedRef.current) { completedRef.current = true; onComplete() }
    }, 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [zooming])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000814', overflow: 'hidden' }}>

      {/* Globe fullscreen */}
      <RotatingEarth
        zooming={zooming}
        onZoomComplete={() => {}}
        onLoad={() => setGlobeLoaded(true)}
      />

      {/* App name — top center */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '48px 24px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        pointerEvents: 'none', zIndex: 3,
        background: 'linear-gradient(to bottom, rgba(0,8,20,0.85) 0%, transparent 100%)',
      }}>
        <div style={{
          fontSize: 'clamp(2rem, 10vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '0.3em',
          color: '#ffffff',
          textTransform: 'uppercase',
          textShadow: '0 0 30px rgba(88,166,255,0.8), 0 0 60px rgba(88,166,255,0.4)',
          lineHeight: 1,
        }}>
          La Guía
        </div>
        <div style={{
          width: 60, height: 1,
          background: 'linear-gradient(to right, transparent, #58a6ff, transparent)',
          margin: '4px 0',
        }} />
        <div style={{
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          color: 'rgba(88,166,255,0.6)',
          textTransform: 'uppercase',
        }}>
          Tu compañero de viaje
        </div>
      </div>

      {/* Hint — bottom */}
      {!zooming && (
        <div style={{
          position: 'absolute', bottom: '8%', left: 0, right: 0,
          textAlign: 'center', pointerEvents: 'none', zIndex: 3,
          fontSize: '0.68rem', letterSpacing: '0.15em',
          color: 'rgba(88,166,255,0.4)', textTransform: 'uppercase',
        }}>
          Arrastra para explorar · Scroll para zoom
        </div>
      )}

      {/* Transition overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0d1117',
        opacity: overlayOpacity,
        transition: 'opacity 1.2s ease',
        pointerEvents: 'none', zIndex: 10,
      }} />
    </div>
  )
}
