import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const LAND_URL = 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json'

export default function RotatingEarth({ zooming, onZoomComplete, onLoad }) {
  const canvasRef = useRef(null)
  const projRef   = useRef(null)
  const radiusRef = useRef(null)
  const renderRef = useRef(null)
  const timerRef  = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = window.innerWidth
    const H = window.innerHeight
    const radius = Math.min(W, H) / 2.1
    const dpr = window.devicePixelRatio || 1

    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(dpr, dpr)

    const proj = d3.geoOrthographic()
      .scale(radius)
      .translate([W / 2, H / 2])
      .clipAngle(90)

    const path = d3.geoPath().projection(proj).context(ctx)
    projRef.current   = proj
    radiusRef.current = radius

    const allDots = []
    let landFeatures = null

    // ─── point-in-polygon helpers ─────────────────────────────
    const ptInPoly = (pt, ring) => {
      let inside = false
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j]
        if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi)
          inside = !inside
      }
      return inside
    }

    const ptInFeature = (pt, feat) => {
      const { type, coordinates } = feat.geometry
      const polys = type === 'Polygon' ? [coordinates] : coordinates
      return polys.some(poly => ptInPoly(pt, poly[0]) && !poly.slice(1).some(hole => ptInPoly(pt, hole)))
    }

    const genDots = (feat, spacing = 16) => {
      const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feat)
      const step = spacing * 0.08
      const dots = []
      for (let lng = minLng; lng <= maxLng; lng += step)
        for (let lat = minLat; lat <= maxLat; lat += step)
          if (ptInFeature([lng, lat], feat)) dots.push([lng, lat])
      return dots
    }

    // ─── render ───────────────────────────────────────────────
    const render = () => {
      ctx.clearRect(0, 0, W, H)
      const scale = proj.scale()
      const sf = scale / radius

      // Ocean
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, scale, 0, 2 * Math.PI)
      ctx.fillStyle = '#000814'
      ctx.fill()
      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 1.5 * sf
      ctx.stroke()

      if (!landFeatures) return

      // Graticule
      const graticule = d3.geoGraticule()
      ctx.beginPath(); path(graticule())
      ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 0.4 * sf; ctx.globalAlpha = 0.18; ctx.stroke(); ctx.globalAlpha = 1

      // Land outline
      ctx.beginPath()
      landFeatures.features.forEach(f => path(f))
      ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 0.7 * sf; ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1

      // Dots
      ctx.fillStyle = '#58a6ff'
      allDots.forEach(([lng, lat]) => {
        const p = proj([lng, lat])
        if (p && p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 1.4 * sf, 0, 2 * Math.PI)
          ctx.globalAlpha = 0.75; ctx.fill()
        }
      })
      ctx.globalAlpha = 1
    }

    renderRef.current = render

    // ─── rotation ─────────────────────────────────────────────
    const rot = [0, -20]
    let autoRotate = true

    timerRef.current = d3.timer(() => {
      if (autoRotate) { rot[0] += 0.25; proj.rotate(rot); render() }
    })

    // ─── mouse interaction ────────────────────────────────────
    const onDown = (startX, startY) => {
      autoRotate = false
      const sr = [...rot]
      const onMove = (dx, dy) => {
        rot[0] = sr[0] + dx * 0.5
        rot[1] = Math.max(-85, Math.min(85, sr[1] - dy * 0.5))
        proj.rotate(rot); render()
      }
      return onMove
    }

    const handleMouseDown = e => {
      const move = onDown(e.clientX, e.clientY)
      const mm = ev => move(ev.clientX - e.clientX, ev.clientY - e.clientY)
      const mu = () => { setTimeout(() => { autoRotate = true }, 100); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu) }
      document.addEventListener('mousemove', mm)
      document.addEventListener('mouseup', mu)
    }

    const handleTouchStart = e => {
      const t0 = e.touches[0]
      const move = onDown(t0.clientX, t0.clientY)
      const tm = ev => { const t = ev.touches[0]; move(t.clientX - t0.clientX, t.clientY - t0.clientY) }
      const te = () => { setTimeout(() => { autoRotate = true }, 100); canvas.removeEventListener('touchmove', tm); canvas.removeEventListener('touchend', te) }
      canvas.addEventListener('touchmove', tm, { passive: true })
      canvas.addEventListener('touchend', te)
    }

    const handleWheel = e => {
      e.preventDefault()
      const s = e.deltaY > 0 ? 0.88 : 1.14
      proj.scale(Math.max(radius * 0.4, Math.min(radius * 4, proj.scale() * s)))
      render()
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    // ─── load GeoJSON ─────────────────────────────────────────
    fetch(LAND_URL)
      .then(r => r.json())
      .then(data => {
        landFeatures = data
        data.features.forEach(f => genDots(f, 16).forEach(d => allDots.push(d)))
        render()
        onLoad?.()
      })
      .catch(() => onLoad?.())

    return () => {
      timerRef.current?.stop()
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // ─── ZOOM: scale projection rapidly (camera crash effect) ─────
  useEffect(() => {
    if (!zooming || !projRef.current) return
    const startScale = projRef.current.scale()
    const targetScale = radiusRef.current * 12   // 12× zoom = rushing crash
    const start = Date.now()
    const dur = 1600   // ms
    let rafId
    let done = false

    const animate = () => {
      if (done) return
      const t = Math.min((Date.now() - start) / dur, 1)
      const e = t * t * t * t   // quartic ease-in: slow start → violent acceleration
      projRef.current.scale(startScale + (targetScale - startScale) * e)
      renderRef.current?.()
      if (t < 1) rafId = requestAnimationFrame(animate)
      else { done = true; onZoomComplete?.() }
    }

    rafId = requestAnimationFrame(animate)
    return () => { done = true; cancelAnimationFrame(rafId) }
  }, [zooming])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, display: 'block', cursor: 'grab' }}
    />
  )
}
