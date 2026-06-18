const GENRE_MAP = {
  "action":           { ids:"28",       type:"movie" },
  "comedy":           { ids:"35",       type:"both"  },
  "horror":           { ids:"27",       type:"both"  },
  "romance":          { ids:"10749",    type:"both"  },
  "sci-fi":           { ids:"878",      type:"both"  },
  "scifi":            { ids:"878",      type:"both"  },
  "science fiction":  { ids:"878",      type:"both"  },
  "thriller":         { ids:"53",       type:"both"  },
  "drama":            { ids:"18",       type:"both"  },
  "animation":        { ids:"16",       type:"both"  },
  "animated":         { ids:"16",       type:"both"  },
  "documentary":      { ids:"99",       type:"both"  },
  "doc":              { ids:"99",       type:"both"  },
  "fantasy":          { ids:"14",       type:"both"  },
  "mystery":          { ids:"9648",     type:"both"  },
  "crime":            { ids:"80",       type:"both"  },
  "adventure":        { ids:"12",       type:"both"  },
  "family":           { ids:"10751",    type:"both"  },
  "kids":             { ids:"10751",    type:"both"  },
  "music":            { ids:"10402",    type:"both"  },
  "western":          { ids:"37",       type:"movie" },
  "war":              { ids:"10752",    type:"movie" },
  "history":          { ids:"36",       type:"movie" },
  "superhero":        { ids:"28,12,14", type:"both"  },
  "anime":            { ids:"16",       type:"tv",   keyword:"210024" },
  "sports":           { ids:"99",       type:"movie" },
  "funny":            { ids:"35",       type:"both"  },
  "scary":            { ids:"27",       type:"both"  },
  "spooky":           { ids:"27",       type:"both"  },
  "creepy":           { ids:"27",       type:"both"  },
  "gory":             { ids:"27",       type:"both"  },
  "not gory":         { ids:"27",       type:"both"  },
  "sad":              { ids:"18",       type:"both"  },
  "emotional":        { ids:"18",       type:"both"  },
  "feel good":        { ids:"35,10751", type:"both"  },
  "feel-good":        { ids:"35,10751", type:"both"  },
  "feelgood":         { ids:"35,10751", type:"both"  },
  "uplifting":        { ids:"35,10751", type:"both"  },
  "lighthearted":     { ids:"35,10751", type:"both"  },
  "romantic":         { ids:"10749",    type:"both"  },
  "date night":       { ids:"10749,35", type:"both"  },
  "love story":       { ids:"10749",    type:"both"  },
  "christmas":        { ids:"10751",    type:"both"  },
  "holiday":          { ids:"10751",    type:"both"  },
  "mind bending":     { ids:"878,9648", type:"both"  },
  "mind-bending":     { ids:"878,9648", type:"both"  },
  "thought provoking":{ ids:"18,878",   type:"both"  },
  "dark":             { ids:"80,53",    type:"both"  },
  "gritty":           { ids:"80,18",    type:"both"  },
  "intense":          { ids:"28,53",    type:"both"  },
  "exciting":         { ids:"28,12",    type:"both"  },
  "chill":            { ids:"35,10751", type:"both"  },
  "relaxing":         { ids:"35,10751", type:"both"  },
  "inspiring":        { ids:"18,99",    type:"both"  },
  "suspense":         { ids:"53",       type:"both"  },
  "suspenseful":      { ids:"53",       type:"both"  },
  "new":              { ids:null,        type:"new"      },
  "new releases":     { ids:null,        type:"new"      },
  "new movies":       { ids:null,        type:"new"      },
  "trending":         { ids:null,        type:"trending" },
  "popular":          { ids:null,        type:"trending" },
  "top rated":        { ids:null,        type:"top"      },
  "best":             { ids:null,        type:"top"      },
  "highest rated":    { ids:null,        type:"top"      },
};

const isGenreSearch = (q) => {
  const lower = q.toLowerCase().trim();
  // Exact match first
  if (GENRE_MAP[lower]) return GENRE_MAP[lower];
  // Partial match — check if any key is contained in the query
  for (const [key, val] of Object.entries(GENRE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
};

const doGenreSearch = async (cfg) => {
  const addProviders = async (items, cat) =>
    Promise.all((items||[]).slice(0,20).map(async m => {
      const t = m.media_type==="tv"||(m.first_air_date&&!m.release_date)?"tv":"movie";
      try { const wp=await tmdbFetch(`/${t}/${m.id}/watch/providers`); return {...m,providers:getProviders(wp),category:cat}; }
      catch { return {...m,providers:[],category:cat}; }
    }));
  if (cfg.type==="trending") { const d=await tmdbFetch("/trending/all/week?language=en-US&page=1"); return addProviders(d.results,"trending"); }
  if (cfg.type==="top") { const [mv,tv]=await Promise.all([tmdbFetch("/movie/top_rated?language=en-US&page=1"),tmdbFetch("/tv/top_rated?language=en-US&page=1")]); return addProviders([...(mv.results||[]),...(tv.results||[])].slice(0,20),"movies"); }
  if (cfg.type==="new") { const d=await tmdbFetch("/movie/now_playing?language=en-US&page=1"); return addProviders(d.results,"movies"); }
  const kw = cfg.keyword ? `&with_keywords=${cfg.keyword}` : "";
  const results = [];
  if (cfg.type==="movie"||cfg.type==="both") { const d=await tmdbFetch(`/discover/movie?with_genres=${cfg.ids}&sort_by=popularity.desc&language=en-US&page=1${kw}`); results.push(...(d.results||[]).slice(0,10).map(m=>({...m,media_type:"movie"}))); }
  if (cfg.type==="tv"||cfg.type==="both") { const d=await tmdbFetch(`/discover/tv?with_genres=${cfg.ids}&sort_by=popularity.desc&language=en-US&page=1${kw}`); results.push(...(d.results||[]).slice(0,10).map(m=>({...m,media_type:"tv"}))); }
  return addProviders(results.slice(0,20),"movies");
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export { GENRE_MAP, isGenreSearch, doGenreSearch };
