import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const CATEGORIES = [
  { id: 'restaurantes', icon: '🍽', label: 'Restaurantes', color: '#ef4444', bg: '#ef444428' },
  { id: 'cultura',      icon: '🏛', label: 'Cultura',      color: '#8b5cf6', bg: '#8b5cf628' },
  { id: 'gasolineras',  icon: '⛽', label: 'Gasolineras',  color: '#f97316', bg: '#f9731628' },
  { id: 'parking',      icon: '🅿', label: 'Parking',      color: '#22c55e', bg: '#22c55e28' },
  { id: 'spotify',      icon: '🎵', label: 'Música',       color: '#1db954', bg: '#1db95428' },
]

const N      = CATEGORIES.length
const FACE_W = 168
const FACE_H = 148
const RADIUS = Math.round(N * FACE_W / (2 * Math.PI))  // ≈ 134px

export default function CategoryMenu({ active, onSelect }) {
  const containerRef = useRef(null)
  const rawRot = useMotionValue(0)
  const rot    = useSpring(rawRot, { stiffness: 220, damping: 30 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = e => {
      e.preventDefault()
      rawRot.set(rawRot.get() - (e.deltaX + e.deltaY) * 0.3)
    }

    let lastX = 0
    const onTouchStart = e => { lastX = e.touches[0].clientX }
    const onTouchMove  = e => {
      e.preventDefault()
      const dx = e.touches[0].clientX - lastX
      lastX = e.touches[0].clientX
      rawRot.set(rawRot.get() + dx * 0.55)
    }

    el.addEventListener('wheel',      onWheel,      { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true  })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })

    return () => {
      el.removeEventListener('wheel',      onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
    }
  }, [rawRot])

  return (
    <div style={{
      background: 'linear-gradient(180deg, #070f26 0%, #0b1735 50%, #070f26 100%)',
      borderTop:    '1px solid rgba(88,166,255,0.18)',
      borderBottom: '1px solid rgba(88,166,255,0.18)',
      padding: '14px 0 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Ambient radial glow behind carousel */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 55% 110% at 50% 55%, rgba(88,166,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Hint */}
      <div style={{
        fontSize: '0.63rem',
        letterSpacing: '0.2em',
        color: 'rgba(88,166,255,0.65)',
        textAlign: 'center',
        marginBottom: 16,
        textTransform: 'uppercase',
        position: 'relative',
        zIndex: 1,
        fontWeight: 600,
      }}>
        ↔ Desliza para girar · Toca para seleccionar
      </div>

      {/* Carousel wrapper */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Center selector frame */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: FACE_W + 12,
          height: FACE_H + 10,
          borderRadius: 20,
          border: '1px solid rgba(88,166,255,0.32)',
          boxShadow: '0 0 28px rgba(88,166,255,0.12), inset 0 0 28px rgba(88,166,255,0.06)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Top/bottom fade lines on frame */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: FACE_W + 12,
          height: 2,
          background: 'linear-gradient(to right, transparent, rgba(88,166,255,0.45), transparent)',
          pointerEvents: 'none',
          zIndex: 3,
        }} />

        {/* 3D carousel */}
        <div
          ref={containerRef}
          style={{
            height: FACE_H,
            perspective: '900px',
            perspectiveOrigin: '50% 50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'ew-resize',
            touchAction: 'none',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
            maskImage:        'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* The cylinder */}
          <motion.div
            style={{
              width:          FACE_W,
              height:         FACE_H,
              position:       'relative',
              transformStyle: 'preserve-3d',
              rotateY:        rot,
            }}
          >
            {CATEGORIES.map((cat, i) => {
              const faceAngle = (i / N) * 360
              const isActive  = active === cat.id

              return (
                <div
                  key={cat.id}
                  onClick={() => onSelect(isActive ? null : cat.id)}
                  style={{
                    position:   'absolute',
                    inset:      0,
                    transform:  `rotateY(${faceAngle}deg) translateZ(${RADIUS}px)`,
                    display:    'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 17,
                    background: isActive
                      ? `linear-gradient(160deg, ${cat.color}60 0%, ${cat.color}32 100%)`
                      : 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                    border: `1.5px solid ${isActive ? cat.color : cat.color + '58'}`,
                    borderTop: `1.5px solid ${isActive ? cat.color : 'rgba(255,255,255,0.14)'}`,
                    cursor: 'pointer',
                    backfaceVisibility:       'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
                    userSelect: 'none',
                    boxShadow: isActive
                      ? `0 0 36px ${cat.color}60, 0 0 72px ${cat.color}22, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.28)`
                      : `0 10px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.22)`,
                  }}
                >
                  <span style={{
                    fontSize: '2.4rem',
                    lineHeight: 1,
                    filter: isActive ? `drop-shadow(0 0 10px ${cat.color})` : 'none',
                    transition: 'filter 0.25s',
                  }}>
                    {cat.icon}
                  </span>
                  <span style={{
                    fontSize: '0.67rem',
                    fontWeight: isActive ? 700 : 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: isActive ? cat.color : 'rgba(255,255,255,0.82)',
                    textAlign: 'center',
                    textShadow: isActive ? `0 0 14px ${cat.color}88` : 'none',
                    transition: 'color 0.25s, text-shadow 0.25s',
                  }}>
                    {cat.label}
                  </span>
                  {isActive && (
                    <div style={{
                      width: 32, height: 2.5, borderRadius: 2,
                      background: `linear-gradient(to right, transparent, ${cat.color}, transparent)`,
                      boxShadow: `0 0 10px ${cat.color}`,
                    }} />
                  )}
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
