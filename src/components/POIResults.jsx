const PRICE = ['', '€', '€€', '€€€', '€€€€']

export default function POIResults({ category, pois, spotifyData, isLoading }) {
  if (isLoading) {
    return (
      <div className="poi-results">
        <div className="poi-loading"><span className="spinner">⟳</span> Buscando...</div>
      </div>
    )
  }

  if (category === 'spotify') {
    if (!spotifyData) return (
      <div className="poi-results">
        <div className="poi-loading"><span className="spinner">⟳</span> Detectando región...</div>
      </div>
    )
    return (
      <div className="poi-results">
        <a className="spotify-card" href={spotifyData.url} target="_blank" rel="noopener noreferrer">
          <span className="spotify-emoji">🎵</span>
          <div className="spotify-info">
            <div className="spotify-title">Música de {spotifyData.region}</div>
            <div className="spotify-sub">{spotifyData.style} · Abrir en Spotify</div>
          </div>
          <span className="spotify-arrow">→</span>
        </a>
        <div style={{ fontSize: '0.75rem', color: '#8b949e', padding: '4px 4px 0' }}>
          Sugerencia basada en el punto medio de tu ruta
        </div>
      </div>
    )
  }

  if (!category) return null

  if (!pois.length) {
    return (
      <div className="poi-results">
        <div className="poi-empty">No se encontraron resultados en esta zona</div>
      </div>
    )
  }

  return (
    <div className="poi-results">
      {pois.map(poi => (
        <div key={poi.id} className="poi-card">
          <div className="poi-icon-wrap" style={{ background: poi.color + '22' }}>
            {poi.icon}
          </div>
          <div className="poi-info">
            <div className="poi-name">{poi.name}</div>
            <div className="poi-meta">
              {poi.rating && (
                <span className="poi-rating">⭐ {poi.rating.toFixed(1)} ({poi.totalRatings?.toLocaleString()})</span>
              )}
              {poi.priceLevel != null && (
                <span className="poi-price">{PRICE[poi.priceLevel]}</span>
              )}
              {poi.isOpen !== undefined && (
                <span className={`poi-open ${poi.isOpen ? 'yes' : 'no'}`}>
                  {poi.isOpen ? '● Abierto' : '● Cerrado'}
                </span>
              )}
            </div>
            {poi.vicinity && <div className="poi-address">{poi.vicinity}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
