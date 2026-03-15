import { getRegionFromCoords } from './geocoding.js'

const MUSIC = {
  // ── España ──────────────────────────────────────────────────────────────
  'Andalucía':            { q: 'flamenco fusión rosalía paco de lucía camarón',     style: 'Flamenco · Andalucía' },
  'Cataluña':             { q: 'rock català oques grasses manel txarango',           style: 'Rock Català · Pop' },
  'País Vasco':           { q: 'rock vasco berri txarrak soziedad alkoholika su ta gar', style: 'Rock Vasco · Euskal' },
  'Galicia':              { q: 'carlos nuñez baiuca xoel lopez música galega gaita', style: 'Celtic · Indie Galego' },
  'Comunidad Valenciana': { q: 'la habitacion roja sidonie pop rock valenciano',    style: 'Pop Rock · Valencia' },
  'Aragón':               { q: 'amaral indie rock zaragoza aragon',                  style: 'Indie Rock · Aragón' },
  'Asturias':             { q: 'fito fitipaldis le mans asturias rock cantábrico',   style: 'Rock · Asturias' },
  'Cantabria':            { q: 'cantabria surf rock blues indie norte españa',       style: 'Rock · Norte' },
  'Islas Canarias':       { q: 'música canaria modern los sabandeños timple fusión', style: 'Canarias Sound' },
  'Illes Balears':        { q: 'antonia font pop mallorquí balear indie',            style: 'Pop · Balears' },
  'Navarra':              { q: 'soziedad alkoholika punk rock pamplona navarra',     style: 'Punk Rock · Navarra' },
  'La Rioja':             { q: 'indie rock español rioja guitar pop',                style: 'Indie Rock · Rioja' },
  'Castilla y León':      { q: 'segovia salamanca indie folk castellano leonés',     style: 'Indie Folk · Castilla' },
  'Castilla-La Mancha':   { q: 'pop indie español meseta quijote new wave',         style: 'Indie Pop · La Mancha' },
  'Extremadura':          { q: 'extremoduro robe iniesta rock extremeño',            style: 'Rock · Extremadura' },
  'Comunidad de Madrid':  { q: 'c tangana izal vetusta morla indie madrid urban',   style: 'Urban · Indie · Madrid' },
  'Región de Murcia':     { q: 'pop mediterráneo indie murciano guitar',            style: 'Pop Mediterráneo' },
  'Principado de Asturias': { q: 'fito fitipaldis le mans rock asturias',           style: 'Rock · Asturias' },

  // ── Internacional ────────────────────────────────────────────────────────
  'Portugal':             { q: 'fado moderno ana moura mariza cristina branco',     style: 'Fado Moderno' },
  'France':               { q: 'daft punk phoenix french touch electro pop',        style: 'French Touch · Pop' },
  'Italy':                { q: 'lucio battisti fabrizio de andre cantautori italiani', style: 'Cantautori Italiani' },
  'Germany':              { q: 'kraftwerk rammstein krautrock german electronic',   style: 'Krautrock · Electronic' },
  'United Kingdom':       { q: 'oasis blur pulp britpop indie uk',                  style: 'Britpop · Indie UK' },
  'Morocco':              { q: 'gnawa chaabi marocain fusion modern',               style: 'Gnawa · Chaabi' },
  'Netherlands':          { q: 'tiësto armin van buuren dutch electronic trance',   style: 'Electronic · Nederland' },
  'Belgium':              { q: 'stromae angèle pop belge francophone',              style: 'Pop · Belgique' },
  'Switzerland':          { q: 'swiss indie folk rock alpenhorn modern',            style: 'Swiss Folk Rock' },
  'Austria':              { q: 'wienerlied falco austropop electronic vienna',      style: 'Austropop · Viena' },
  'Poland':               { q: 'polish jazz electronic indie pop warszawa',         style: 'Polish Underground' },
  'Czech Republic':       { q: 'prague indie alternative czech music',              style: 'Czech Indie' },
  'Greece':               { q: 'rebetiko laika ellas modern greek music',           style: 'Rebetiko · Laïká' },
}

const DEFAULT = { q: 'indie rock español contemporáneo', style: 'Indie Español' }

export async function getSpotifyData(polyline) {
  if (!polyline?.length) return null
  try {
    const [lat, lng] = polyline[Math.floor(polyline.length / 2)]
    const info = await getRegionFromCoords(lat, lng)
    const match = MUSIC[info?.region] || MUSIC[info?.country] || DEFAULT
    return {
      url:    `https://open.spotify.com/search/${encodeURIComponent(match.q)}`,
      region: info?.region || info?.country || 'tu zona',
      style:  match.style,
    }
  } catch {
    return {
      url:    `https://open.spotify.com/search/${encodeURIComponent(DEFAULT.q)}`,
      region: 'tu zona',
      style:  DEFAULT.style,
    }
  }
}
