import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const CATEGORIES = [
  { id: 'restaurantes', icon: '🍽', label: 'Restaurantes', color: '#ef4444', bg: '#ef444428' },
  { id: 'cultura',      icon: '🏛', label: 'Cultura',      color: '#8b5cf6', bg: '#8b5cf628' },
  { id: 'gasolineras',  icon: '⛽', label: 'Gasolineras',  color: '#f97316', bg: '#f9731628' },
  { id: 'parking',      icon: '🅿', label: 'Parking',      color: '#22c55e', bg: '#22c55e28' },
  { id: 'spotify',      icon: '🎵', label: 'Música',       color: '#1db954', bg: '#1db95428' },
]

const N      = CATEGORIES.length           // 5
const FACE_W = 150                         // px
const FACE_H = 115                         // px
const RADIUS = Math.round(N * FACE_W / (2 * Math.PI))  // ≈ 119px

export default function CategoryMenu({ active, onSelect }) {
  const containerRef = useRef(null)
  const rawRot = useMotionValue(0)
  const rot    = useSpring(rawRot, { stiffness: 220, damping: 30 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // ── Wheel (desktop + trackpad) ──────────────────────────
    const onWheel = e => {
      e.preventDefault()
      rawRot.set(rawRot.get() - e.deltaY * 0.3)
    }

    // ── Touch scroll (mobile) ───────────────────────────────
    let lastY = 0
    const onTouchStart = e => { lastY = e.touches[0].clientY }
    const onTouchMove  = e => {
      e.preventDefault()
      const dy = e.touches[0].clientY - lastY
      lastY = e.touches[0].clientY
      // swipe-up (dy < 0) → same direction as scroll-down → decrease rotation
      rawRot.set(rawRot.get() + dy * 0.55)
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
      background: '#0d1117',
      borderTop: '1px solid #30363d',
      borderBottom: '1px solid #30363d',
      padding: '10px 0 14px',
    }}>
      {/* Hint */}
      <div style={{
        fontSize: '0.58rem',
        letterSpacing: '0.18em',
        color: 'rgba(88,166,255,0.35)',
        textAlign: 'center',
        marginBottom: 14,
        textTransform: 'uppercase',
      }}>
        ↕ Scroll para girar · Toca para seleccionar
      </div>

      {/* 3D carousel — centered, rotates in place */}
      <div
        ref={containerRef}
        style={{
          height: FACE_H,
          perspective: '700px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'ns-resize',
          touchAction: 'none',
          // Side fade: hides edges of other faces
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
          maskImage:        'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        {/* The cylinder — rotates around its own Y axis, never translates */}
        <motion.div
          style={{
            width:            FACE_W,
            height:           FACE_H,
            position:         'relative',
            transformStyle:   'preserve-3d',
            rotateY:          rot,
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
                  gap: 6,
                  borderRadius: 14,
                  background: isActive ? cat.color + '55' : cat.bg,
                  border:     `2px solid ${isActive ? cat.color : cat.color + '50'}`,
                  cursor:     'pointer',
                  backfaceVisibility:       'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transition: 'background 0.2s, border-color 0.2s',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{cat.icon}</span>
                <span style={{
                  fontSize:  '0.62rem',
                  fontWeight: isActive ? 700 : 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isActive ? cat.color : 'rgba(255,255,255,0.75)',
                  textAlign: 'center',
                }}>
                  {cat.label}
                </span>
                {isActive && (
                  <div style={{ width: 24, height: 2, borderRadius: 1, background: cat.color, marginTop: 1 }} />
                )}
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
