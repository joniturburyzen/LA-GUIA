import { getRegionFromCoords } from './geocoding.js'

const MUSIC = {
  'Andalucía':               { q: 'flamenco andaluz tradicional',           style: 'Flamenco' },
  'Cataluña':                { q: 'música tradicional catalana sardana',     style: 'Sardana · Folk català' },
  'País Vasco':              { q: 'música vasca tradicional txalaparta',     style: 'Música vasca' },
  'Galicia':                 { q: 'música gallega gaita tradicional',        style: 'Folk Galego' },
  'Comunidad Valenciana':    { q: 'música valenciana dolçaina tradicional',  style: 'Folk valenciano' },
  'Aragón':                  { q: 'jota aragonesa tradicional folk',         style: 'Jota aragonesa' },
  'Asturias':                { q: 'música asturiana gaita folk',             style: 'Folk asturiano' },
  'Cantabria':               { q: 'música cántabra folk tradicional',        style: 'Folk cántabro' },
  'Islas Canarias':          { q: 'música canaria timple folía tradicional', style: 'Música canaria' },
  'Illes Balears':           { q: 'música balear mallorquín tradicional',    style: 'Folk balear' },
  'Navarra':                 { q: 'música navarra jota folk',                style: 'Jota navarra' },
  'La Rioja':                { q: 'música riojana folk tradicional',         style: 'Folk riojano' },
  'Castilla y León':         { q: 'folk castellano leonés tradicional',      style: 'Folk castellano' },
  'Castilla-La Mancha':      { q: 'música manchega jota folk',               style: 'Folk manchego' },
  'Extremadura':             { q: 'música extremeña folk tradicional',       style: 'Folk extremeño' },
  'Comunidad de Madrid':     { q: 'chotis madrileño música popular Madrid',  style: 'Chotis madrileño' },
  'Región de Murcia':        { q: 'música murciana parrandas tradicional',   style: 'Parrandas' },
  'Portugal':                { q: 'fado português tradicional',              style: 'Fado' },
  'France':                  { q: 'chanson française folk traditionnelle',   style: 'Chanson française' },
  'Italy':                   { q: 'musica folk italiana tradizionale',       style: 'Folk italiano' },
  'Germany':                 { q: 'deutsche volksmusik traditional folk',    style: 'Volksmusik' },
  'United Kingdom':          { q: 'british folk traditional celtic',         style: 'British folk' },
  'Morocco':                 { q: 'musique gnawa marocaine traditionnelle',  style: 'Música marroquí' },
}

const DEFAULT = { q: 'música folk española tradicional', style: 'Folk español' }

export async function getSpotifyData(polyline) {
  if (!polyline?.length) return null
  try {
    const [lat, lng] = polyline[Math.floor(polyline.length / 2)]
    const info = await getRegionFromCoords(lat, lng)
    const match = MUSIC[info?.region] || MUSIC[info?.country] || DEFAULT
    return {
      url: `https://open.spotify.com/search/${encodeURIComponent(match.q)}`,
      region: info?.region || info?.country || 'tu zona',
      style: match.style,
    }
  } catch {
    return { url: `https://open.spotify.com/search/${encodeURIComponent(DEFAULT.q)}`, region: 'tu zona', style: DEFAULT.style }
  }
}
