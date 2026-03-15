import { getRegionFromCoords } from './geocoding.js'

// Keys = administrative_area_level_1 as returned by Google Geocoding in Spanish
// (the worker calls /geocode with language:'es')
const BY_REGION = {
  // ── Comunidades autónomas españolas ────────────────────────────────────
  'Andalucía':                    { q: 'flamenco fusión rosalía paco de lucía camarón',       style: 'Flamenco · Andalucía' },
  'Cataluña':                     { q: 'rock català oques grasses manel txarango',             style: 'Rock Català · Pop' },
  'País Vasco':                   { q: 'rock vasco berri txarrak soziedad alkoholika',         style: 'Rock Vasco · Euskal' },
  'Galicia':                      { q: 'carlos nuñez baiuca xoel lopez música galega gaita',  style: 'Celtic · Indie Galego' },
  'Comunidad Valenciana':         { q: 'la habitacion roja sidonie pop rock valenciano',       style: 'Pop Rock · Valencia' },
  'Aragón':                       { q: 'amaral indie rock zaragoza aragon',                    style: 'Indie Rock · Aragón' },
  'Principado de Asturias':       { q: 'fito fitipaldis le mans asturias rock cantábrico',    style: 'Rock · Asturias' },
  'Asturias':                     { q: 'fito fitipaldis le mans asturias rock cantábrico',    style: 'Rock · Asturias' },
  'Cantabria':                    { q: 'cantabria surf rock blues indie norte españa',         style: 'Rock · Cantabria' },
  'Islas Canarias':               { q: 'música canaria moderna los sabandeños timple fusión', style: 'Canarias Sound' },
  'Illes Balears':                { q: 'antonia font pop mallorquí balear indie',              style: 'Pop · Balears' },
  'Navarra':                      { q: 'soziedad alkoholika punk rock pamplona navarra',       style: 'Punk Rock · Navarra' },
  'Comunidad Foral de Navarra':   { q: 'soziedad alkoholika punk rock pamplona navarra',       style: 'Punk Rock · Navarra' },
  'La Rioja':                     { q: 'indie rock español rioja guitar pop',                  style: 'Indie Rock · Rioja' },
  'Castilla y León':              { q: 'segovia salamanca indie folk castellano leonés',       style: 'Indie Folk · Castilla' },
  'Castilla-La Mancha':           { q: 'pop indie español meseta new wave',                   style: 'Indie Pop · La Mancha' },
  'Extremadura':                  { q: 'extremoduro robe iniesta rock extremeño',              style: 'Rock · Extremadura' },
  'Comunidad de Madrid':          { q: 'c tangana izal vetusta morla indie madrid urban',     style: 'Urban · Indie · Madrid' },
  'Región de Murcia':             { q: 'pop mediterráneo indie murciano guitar rock',          style: 'Pop Mediterráneo' },

  // ── Naciones del Reino Unido (Google devuelve en español) ──────────────
  'Escocia':          { q: 'biffy clyro travis frightened rabbit runrig scottish rock celtic', style: 'Rock Escocés · Celtic' },
  'Gales':            { q: 'stereophonics manic street preachers feeder super furry welsh rock', style: 'Rock Galés' },
  'Inglaterra':       { q: 'oasis blur coldplay arctic monkeys english indie rock',             style: 'Britpop · Indie England' },
  'Irlanda del Norte': { q: 'snow patrol therapy ash northern ireland rock',                   style: 'Rock · Irlanda del Norte' },

  // ── Regiones francesas (en español) ────────────────────────────────────
  'Bretaña':          { q: 'musique celtique bretagne alan stivell gaeltacht', style: 'Celta · Bretaña' },
  'Bretagne':         { q: 'musique celtique bretagne alan stivell gaeltacht', style: 'Celta · Bretaña' },
  'Provenza-Alpes-Costa Azul': { q: 'provence folk electro french riviera',   style: 'French Riviera Sound' },

  // ── Otras regiones notables ────────────────────────────────────────────
  'Bavaria':          { q: 'bavarian traditional folk oktoberfest alphorn',    style: 'Bavarian Folk' },
  'Bayern':           { q: 'bavarian traditional folk oktoberfest alphorn',    style: 'Bavarian Folk' },
  'Sicilia':          { q: 'musica siciliana folk tarantella mediterranea',     style: 'Folk Siciliano' },
  'Sicilia (Sicilia)': { q: 'musica siciliana folk tarantella mediterranea',   style: 'Folk Siciliano' },
  'Toscana':          { q: 'cantautori toscani folk italiano de andre',        style: 'Folk Toscano' },
}

// Keys = ISO 3166-1 alpha-2 country codes (language-neutral, from countryCode field)
const BY_CODE = {
  'ES': { q: 'indie rock español contemporáneo',                                style: 'Indie Español' },
  'PT': { q: 'fado moderno ana moura mariza cristina branco',                   style: 'Fado Moderno' },
  'GB': { q: 'oasis blur coldplay arctic monkeys britpop indie uk',             style: 'Britpop · Indie UK' },
  'IE': { q: 'u2 the cranberries thin lizzy pogues irish rock celtic',          style: 'Irish Rock · Celtic' },
  'FR': { q: 'daft punk phoenix air gainsbourg serge french touch electro pop', style: 'French Touch · Pop' },
  'IT': { q: 'lucio battisti fabrizio de andre pino daniele cantautori',        style: 'Cantautori Italiani' },
  'DE': { q: 'kraftwerk can neu rammstein krautrock german electronic',         style: 'Krautrock · Electronic' },
  'AT': { q: 'falco austropop wienerlied electronic vienna',                    style: 'Austropop · Viena' },
  'CH': { q: 'swiss indie folk rock heilsarmee züri west',                      style: 'Swiss Indie Rock' },
  'BE': { q: 'stromae angèle deus tc matic pop belge',                         style: 'Pop · Belgique' },
  'NL': { q: 'tiësto armin van buuren bløf dutch electronic trance',           style: 'Electronic · Nederland' },
  'SE': { q: 'abba robyn avicii björk swedish pop electro',                    style: 'Swedish Pop · Electro' },
  'NO': { q: 'a-ha röyksopp aurora sigrid norwegian pop',                      style: 'Nordic Pop · Norway' },
  'DK': { q: 'lukas graham volbeat michael learns to rock danish',             style: 'Danish Pop Rock' },
  'FI': { q: 'nightwish him lordi apocalyptica finnish metal',                 style: 'Finnish Rock · Metal' },
  'IS': { q: 'sigur ros björk of monsters and men icelandic ambient',          style: 'Icelandic Post-rock' },
  'GR': { q: 'rebetiko laika george dalaras modern greek music',               style: 'Rebetiko · Laïká' },
  'TR': { q: 'arabesk anatolian rock sezen aksu turkish',                      style: 'Arabesk · Anatolian Rock' },
  'MA': { q: 'gnawa chaabi marocain hassan hakmoun fusion',                    style: 'Gnawa · Chaabi' },
  'PL': { q: 'myslovitz brodka polish jazz underground electronic',            style: 'Polish Underground' },
  'CZ': { q: 'prague plastic people of the universe czech indie',              style: 'Czech Indie' },
  'HU': { q: 'másfél quimby budapest indie folk hungarian rock',               style: 'Hungarian Rock · Folk' },
  'RO': { q: 'romanian folk traditional folk dance doina',                     style: 'Folk Rumano' },
  'HR': { q: 'klapa dalmatinska tamburica croatian folk',                      style: 'Klapa · Folk Croata' },
  'US': { q: 'americana folk indie rock usa heartland',                        style: 'Americana · Indie USA' },
  'CA': { q: 'arcade fire leonard cohen joni mitchell canadian indie',         style: 'Indie Canadiense' },
  'MX': { q: 'rock mexicano café tacvba caifanes molotov',                     style: 'Rock Mexicano' },
  'AR': { q: 'soda stereo charly garcia los redondos rock argentino',          style: 'Rock · Argentina' },
  'CL': { q: 'los jaivas los prisioneros francisca valenzuela rock chileno',   style: 'Rock Chileno' },
  'CO': { q: 'carlos vives vallenato shakira pop colombiano',                  style: 'Vallenato · Pop Colombiano' },
  'BR': { q: 'bossa nova mpb tropicália caetano veloso gilberto gil',          style: 'MPB · Tropicália' },
  'JP': { q: 'city pop japanese indie rock happy end',                         style: 'City Pop · Japón' },
  'AU': { q: 'tame impala courtney barnett gotye australian indie',            style: 'Australian Indie' },
  'NZ': { q: 'the clean flying nun records new zealand indie',                 style: 'NZ Indie' },
  'ZA': { q: 'afrobeat south africa ladysmith black mambazo isicathamiya',     style: 'Afrobeat · Sudáfrica' },
  'NG': { q: 'fela kuti afrobeat afrobeats burna boy nigeria',                 style: 'Afrobeat · Nigeria' },
  'EG': { q: 'om kalthoum abdel halim hafez arabic classic egypt',             style: 'Clásico Árabe · Egipto' },
  'IN': { q: 'bollywood hindustani classical raga rahman',                     style: 'Bollywood · Ragas' },
}

const DEFAULT = { q: 'world music indie folk alternativo', style: 'World Music' }

export async function getSpotifyData(polyline) {
  if (!polyline?.length) return null
  try {
    const [lat, lng] = polyline[Math.floor(polyline.length / 2)]
    const info = await getRegionFromCoords(lat, lng)

    // Priority: specific region name > country code > default
    const match = BY_REGION[info?.region] || BY_CODE[info?.countryCode] || DEFAULT

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
