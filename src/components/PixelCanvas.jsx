import { useEffect, forwardRef } from 'react'

function registerPixelCanvas() {
  if (typeof window === 'undefined' || customElements.get('pixel-canvas')) return

  class Pixel {
    constructor(canvas, ctx, x, y, color, speed, delay) {
      this.width = canvas.width
      this.height = canvas.height
      this.ctx = ctx
      this.x = x; this.y = y; this.color = color
      this.speed = (Math.random() * 0.8 + 0.1) * speed
      this.size = 0
      this.sizeStep = Math.random() * 0.4
      this.minSize = 0.5
      this.maxSizeInteger = 2
      this.maxSize = Math.random() * (2 - 0.5) + 0.5
      this.delay = delay
      this.counter = 0
      this.counterStep = Math.random() * 4 + (canvas.width + canvas.height) * 0.01
      this.isIdle = false; this.isReverse = false; this.isShimmer = false
    }

    draw() {
      const off = this.maxSizeInteger * 0.5 - this.size * 0.5
      this.ctx.fillStyle = this.color
      this.ctx.fillRect(this.x + off, this.y + off, this.size, this.size)
    }

    appear() {
      this.isIdle = false
      if (this.counter <= this.delay) { this.counter += this.counterStep; return }
      if (this.size >= this.maxSize) this.isShimmer = true
      this.isShimmer ? this.shimmer() : (this.size += this.sizeStep)
      this.draw()
    }

    disappear() {
      this.isShimmer = false; this.counter = 0
      if (this.size <= 0) { this.isIdle = true; return }
      this.size -= 0.1
      this.draw()
    }

    shimmer() {
      if (this.size >= this.maxSize) this.isReverse = true
      else if (this.size <= this.minSize) this.isReverse = false
      this.size += this.isReverse ? -this.speed : this.speed
    }
  }

  class PixelCanvasElement extends HTMLElement {
    constructor() {
      super()
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      this.pixels = []; this.animation = null
      this.timeInterval = 1000 / 60
      this.timePrevious = performance.now()
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      this._init = false; this._ro = null; this._parent = null

      const shadow = this.attachShadow({ mode: 'open' })
      const style = document.createElement('style')
      style.textContent = ':host{display:grid;inline-size:100%;block-size:100%;overflow:hidden}'
      shadow.appendChild(style)
      shadow.appendChild(this.canvas)
    }

    get colors() { return this.dataset.colors?.split(',') || ['#1e3a5f','#2563eb','#58a6ff'] }
    get gap()    { return Math.max(4, Math.min(50, Number(this.dataset.gap)  || 5)) }
    get speed()  { return this.reducedMotion ? 0 : Math.max(0, Math.min(100, Number(this.dataset.speed) || 35)) * 0.001 }
    get noFocus(){ return this.hasAttribute('data-no-focus') }
    get variant(){ return this.dataset.variant || 'default' }

    connectedCallback() {
      if (this._init) return
      this._init = true
      this._parent = this.parentElement

      requestAnimationFrame(() => {
        this.handleResize()
        this._ro = new ResizeObserver(() => requestAnimationFrame(() => this.handleResize()))
        this._ro.observe(this)
      })

      this._onEnter = () => this.handleAnimation('appear')
      this._onLeave = () => this.handleAnimation('disappear')
      this._onFocus = () => this.handleAnimation('appear')
      this._onBlur  = () => this.handleAnimation('disappear')

      this._parent?.addEventListener('mouseenter', this._onEnter)
      this._parent?.addEventListener('mouseleave', this._onLeave)
      if (!this.noFocus) {
        this._parent?.addEventListener('focus', this._onFocus, { capture: true })
        this._parent?.addEventListener('blur',  this._onBlur,  { capture: true })
      }
    }

    disconnectedCallback() {
      this._init = false
      this._ro?.disconnect()
      this._parent?.removeEventListener('mouseenter', this._onEnter)
      this._parent?.removeEventListener('mouseleave', this._onLeave)
      if (!this.noFocus) {
        this._parent?.removeEventListener('focus', this._onFocus, { capture: true })
        this._parent?.removeEventListener('blur',  this._onBlur,  { capture: true })
      }
      if (this.animation) { cancelAnimationFrame(this.animation); this.animation = null }
      this._parent = null
    }

    handleResize() {
      if (!this.ctx || !this._init) return
      const rect = this.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const dpr = window.devicePixelRatio || 1
      this.canvas.width  = Math.floor(rect.width)  * dpr
      this.canvas.height = Math.floor(rect.height) * dpr
      this.canvas.style.width  = `${Math.floor(rect.width)}px`
      this.canvas.style.height = `${Math.floor(rect.height)}px`
      this.ctx.setTransform(1,0,0,1,0,0)
      this.ctx.scale(dpr, dpr)
      this.createPixels()
    }

    distCenter(x, y)     { const dx=x-this.canvas.width/2, dy=y-this.canvas.height/2; return Math.sqrt(dx*dx+dy*dy) }
    distBottomLeft(x, y) { const dx=x, dy=this.canvas.height-y; return Math.sqrt(dx*dx+dy*dy) }

    createPixels() {
      if (!this.ctx) return
      this.pixels = []
      for (let x = 0; x < this.canvas.width; x += this.gap) {
        for (let y = 0; y < this.canvas.height; y += this.gap) {
          const color = this.colors[Math.floor(Math.random() * this.colors.length)]
          const delay = this.reducedMotion ? 0
            : this.variant === 'icon' ? this.distCenter(x, y) : this.distBottomLeft(x, y)
          this.pixels.push(new Pixel(this.canvas, this.ctx, x, y, color, this.speed, delay))
        }
      }
    }

    handleAnimation(name) {
      if (this.animation) cancelAnimationFrame(this.animation)
      const tick = () => {
        this.animation = requestAnimationFrame(tick)
        const now = performance.now(), passed = now - this.timePrevious
        if (passed < this.timeInterval) return
        this.timePrevious = now - (passed % this.timeInterval)
        if (!this.ctx) return
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        let allIdle = true
        for (const p of this.pixels) { p[name](); if (!p.isIdle) allIdle = false }
        if (allIdle) { cancelAnimationFrame(this.animation); this.animation = null }
      }
      tick()
    }
  }

  customElements.define('pixel-canvas', PixelCanvasElement)
}

export const PixelCanvas = forwardRef(({ gap, speed, colors, variant, noFocus, style, ...props }, ref) => {
  useEffect(() => { registerPixelCanvas() }, [])

  return (
    <pixel-canvas
      ref={ref}
      data-gap={gap}
      data-speed={speed}
      data-colors={colors?.join(',')}
      data-variant={variant}
      {...(noFocus && { 'data-no-focus': '' })}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%', ...style }}
      {...props}
    />
  )
})
PixelCanvas.displayName = 'PixelCanvas'
