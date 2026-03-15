import { useState } from 'react'
import MapPicker from './MapPicker.jsx'
import { workerPost } from '../services/api.js'
import PixelButton from './PixelButton.jsx'

// Compress image to max 900px JPEG 0.75 before storing in localStorage
function compressImage(dataURL) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const MAX = 900
      const ratio = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => resolve(dataURL) // fallback: keep original
    img.src = dataURL
  })
}

export default function EntryForm({ onClose, onAdd }) {
  const [label,         setLabel]         = useState('')
  const [location,      setLocation]      = useState({ address: '', lat: null, lng: null })
  const [photos,        setPhotos]        = useState([])
  const [notes,         setNotes]         = useState('')
  const [showMap,       setShowMap]       = useState(false)
  const [gettingGPS,    setGettingGPS]    = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  function handleGPS() {
    setGettingGPS(true)
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const data = await workerPost('/geocode', { lat, lng })
          const address = data.results?.[0]?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setLocation({ lat, lng, address })
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
        }
        setGettingGPS(false)
      },
      () => { alert('No se pudo obtener la ubicación'); setGettingGPS(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    ) ?? (alert('GPS no disponible'), setGettingGPS(false))
  }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setLoadingPhotos(true)
    const compressed = await Promise.all(
      files.map(f => new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = ev => compressImage(ev.target.result).then(resolve)
        reader.readAsDataURL(f)
      }))
    )
    setPhotos(prev => [...prev, ...compressed])
    setLoadingPhotos(false)
    e.target.value = ''
  }

  function handleAdd() {
    if (!label.trim()) { alert('Añade una etiqueta'); return }
    onAdd({
      label:    label.trim(),
      location,
      photos,
      notes:    notes.trim(),
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="ef-overlay">
      <div className="ef-sheet">
        <div className="place-panel-handle" />
        <div className="ef-header">
          <span className="ef-title">Nueva entrada</span>
          <button className="place-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="ef-body">
          {/* Etiqueta */}
          <div className="ef-field">
            <label className="ef-label">Etiqueta *</label>
            <input
              className="wp-input"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej: Hotel Barcelona, Restaurante favorito..."
              autoFocus
            />
          </div>

          {/* Localización */}
          <div className="ef-field">
            <label className="ef-label">Localización</label>
            {location.address && (
              <div className="ef-loc-preview">📍 {location.address}</div>
            )}
            <div className="ef-btn-row">
              <button className="ef-btn" onClick={handleGPS} disabled={gettingGPS}>
                {gettingGPS ? <span className="spinner">⟳</span> : '📡'} Usar ubicación
              </button>
              <button className="ef-btn" onClick={() => setShowMap(true)}>
                🗺 Mapa
              </button>
            </div>
          </div>

          {/* Fotos */}
          <div className="ef-field">
            <label className="ef-label">Fotos</label>
            <label className="ef-photo-btn">
              {loadingPhotos ? <><span className="spinner">⟳</span> Procesando...</> : '📷 Añadir imágenes'}
              <input
                type="file" accept="image/*" multiple
                onChange={handlePhotos}
                style={{ display: 'none' }}
                disabled={loadingPhotos}
              />
            </label>
            {photos.length > 0 && (
              <div className="ef-thumbs">
                {photos.map((p, i) => (
                  <div key={i} className="ef-thumb-wrap">
                    <img src={p} className="ef-thumb" alt="" />
                    <button
                      className="ef-thumb-del"
                      onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="ef-field">
            <label className="ef-label">Notas</label>
            <textarea
              className="ef-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones, recomendaciones..."
              rows={3}
            />
          </div>
        </div>

        <div className="ef-footer">
          <PixelButton className="place-nav-btn" onClick={handleAdd}>
            ＋ Añadir entrada
          </PixelButton>
        </div>
      </div>

      {showMap && (
        <MapPicker
          onSelect={loc => { setLocation(loc); setShowMap(false) }}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  )
}
