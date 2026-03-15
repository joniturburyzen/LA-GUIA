import { PixelCanvas } from './PixelCanvas.jsx'

// Colores de píxeles coherentes con la paleta de la app
const COLORS_BLUE   = ['#0c2340','#1d4ed8','#3b82f6','#58a6ff','#93c5fd']
const COLORS_GREEN  = ['#052e16','#15803d','#22c55e','#3fb950','#86efac']

export default function PixelButton({ children, className, style, pixelColors, disabled, ...props }) {
  const colors = pixelColors ?? COLORS_BLUE

  return (
    <button
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      disabled={disabled}
      {...props}
    >
      {!disabled && (
        <PixelCanvas gap={7} speed={28} colors={colors} variant="default" />
      )}
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
        {children}
      </span>
    </button>
  )
}

export { COLORS_BLUE, COLORS_GREEN }
