// ─── TMDB HELPERS ─────────────────────────────────────────────────────────────
const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const TMDB_BASE  = "https://api.themoviedb.org/3";
const TMDB_IMG   = "https://image.tmdb.org/t/p/w500";
const tmdbHeaders = { Authorization: `Bearer ${TMDB_TOKEN}`, "Content-Type": "application/json" };

async function tmdbFetch(path) {
  const res = await fetch(`${TMDB_BASE}${path}`, { headers: tmdbHeaders });
  return res.json();
}

// TMDB provider_id → our service id
const PROVIDER_MAP = {
  8:"netflix", 337:"disney", 1899:"max", 15:"hulu", 350:"apple",
  9:"prime", 386:"peacock", 531:"paramount", 283:"crunchyroll", 149:"espnplus",
  192:"youtube", 1969:"youtubetv", 73:"tubi", 257:"fubo",
};

function getProviders(watchProviders) {
  const results = watchProviders?.results?.US;
  if (!results) return [];
  const flat = [...(results.flatrate||[]), ...(results.free||[])];
  return flat.map(p => PROVIDER_MAP[p.provider_id]).filter(Boolean);
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────

export { TMDB_TOKEN, TMDB_BASE, TMDB_IMG, tmdbHeaders, tmdbFetch, PROVIDER_MAP, getProviders };