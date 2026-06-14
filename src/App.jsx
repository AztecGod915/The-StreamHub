// ─── PLATFORM DEEP LINK BUILDER ──────────────────────────────────────────────
// TMDB's watch page (powered by JustWatch) is the most reliable link.
// It shows the movie on each platform and hands off correctly.
// We use it as primary and fall back to platform homepages — never search URLs
// which most platforms block from external referrers.
function getPlatformLink(providerName, movieId, movieTitle, tmdbLink) {
  // Primary: TMDB/JustWatch link for this specific movie
  if (tmdbLink) return tmdbLink;
  // Secondary: direct TMDB watch page if no link stored yet
  if (movieId) return `https://www.themoviedb.org/movie/${movieId}/watch?locale=US`;
  // Last resort: platform homepage (user can search from there)
  const homes = {
    "Netflix":              "https://www.netflix.com",
    "Hulu":                 "https://www.hulu.com",
    "Disney Plus":          "https://www.disneyplus.com",
    "Disney+":              "https://www.disneyplus.com",
    "Max":                  "https://www.max.com",
    "HBO Max":              "https://www.max.com",
    "Apple TV Plus":        "https://tv.apple.com",
    "Apple TV+":            "https://tv.apple.com",
    "Amazon Prime Video":   "https://www.amazon.com/video",
    "Prime Video":          "https://www.amazon.com/video",
    "Peacock":              "https://www.peacocktv.com",
    "Peacock Premium":      "https://www.peacocktv.com",
    "Paramount Plus":       "https://www.paramountplus.com",
    "Paramount+":           "https://www.paramountplus.com",
    "Tubi":                 "https://tubitv.com",
    "Crunchyroll":          "https://www.crunchyroll.com",
    "ESPN Plus":            "https://www.espnplus.com",
    "YouTube":              "https://www.youtube.com",
    "Fubo":                 "https://www.fubo.tv",
  };
  return homes[providerName] || "https://www.themoviedb.org";
}

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";

// ─── VAPID KEY HELPER ─────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ─── GOOGLE ANALYTICS EVENT TRACKER ──────────────────────────────────────────
const track = (eventName, params = {}) => {
  try {
    if (window.gtag) window.gtag("event", eventName, params);
  } catch(e) {}
};

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "streamhub_auth",
    }
  }
);

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
const GlobalStyles = () => {
  useEffect(() => {
    // ── Google Analytics ──
    const gaScript1 = document.createElement("script");
    gaScript1.async = true;
    gaScript1.src = "https://www.googletagmanager.com/gtag/js?id=G-LK433DT8M2";
    document.head.appendChild(gaScript1);
    const gaScript2 = document.createElement("script");
    gaScript2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LK433DT8M2');`;
    document.head.appendChild(gaScript2);
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      :root {
        --bg:#09070F; --surface:#1A1030; --card:#130E24;
        --border:rgba(139,92,246,0.12); --gold:#F59E0B; --gold-dim:rgba(245,158,11,0.15);
        --purple:#8B5CF6; --cyan:#06B6D4; --anime:#FF6B9D; --sports:#10B981;
        --text:#F0F0FA; --muted:rgba(240,240,250,0.45);
        --danger:#EF4444; --success:#10B981; --radius:14px;
        --font-head:'Syne',sans-serif; --font-body:'Plus Jakarta Sans',sans-serif;
      }
      body { background:var(--bg); color:var(--text); font-family:var(--font-body); -webkit-font-smoothing:antialiased; }
      body::before {
        content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
        background:
          radial-gradient(ellipse 80% 50% at 20% 0%, rgba(139,92,246,0.22) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 10%, rgba(245,158,11,0.08) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 10% 70%, rgba(139,92,246,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 90% 80%, rgba(245,158,11,0.06) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%);
        animation:bgBreath 12s ease-in-out infinite;
      }
      body::after {
        content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
        background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
        background-size:60px 60px;
        mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%);
      }
      @keyframes bgBreath { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.05)} }
      #root { position:relative; z-index:1; }
      ::-webkit-scrollbar { width:5px; height:5px; }
      ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:99px; }
      @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes spinRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes spin     { to{transform:rotate(360deg)} }
      @keyframes slideRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideDown{ from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      @keyframes logoPulse { 0%,100%{filter:drop-shadow(0 0 0px rgba(245,158,11,0))} 50%{filter:drop-shadow(0 0 14px rgba(245,158,11,0.7))} }
      @keyframes logoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes flameDance { 0%,100%{transform:scale(1) rotate(-8deg)} 25%{transform:scale(1.3) rotate(8deg)} 50%{transform:scale(0.9) rotate(-5deg)} 75%{transform:scale(1.2) rotate(6deg)} }
      @keyframes swordSwing { 0%,100%{transform:rotate(-20deg) scale(1)} 50%{transform:rotate(20deg) scale(1.1)} }
      @keyframes tvFlicker { 0%,88%,92%,100%{opacity:1} 90%{opacity:0.4} }
      @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      @keyframes badgePop { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
      @keyframes trophyBounce { 0%,100%{transform:translateY(0) rotate(-5deg)} 40%{transform:translateY(-6px) rotate(5deg)} 70%{transform:translateY(-3px) rotate(-3deg)} }
      @keyframes sportsGlow { 0%,100%{filter:drop-shadow(0 0 0px rgba(16,185,129,0)) drop-shadow(0 0 0px rgba(245,158,11,0))} 50%{filter:drop-shadow(0 0 8px rgba(16,185,129,.9)) drop-shadow(0 0 16px rgba(245,158,11,.6))} }
      @keyframes liveDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.5} }
      @keyframes sportsTabPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 0 4px rgba(239,68,68,.25)} }
      .fadeUp { animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
      .fadeIn { animation:fadeIn .25s ease both; }
      .skeleton { background:linear-gradient(90deg,#1a1a2e 25%,#252540 50%,#1a1a2e 75%); background-size:400px 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
      input,textarea { font-family:var(--font-body); }
      button { cursor:pointer; font-family:var(--font-body); }
      a { color:inherit; text-decoration:none; }
      @media(max-width:768px) {
        .desktop-only { display:none !important; }
        .mobile-only  { display:flex !important; }
      }
      @media(min-width:769px) {
        .mobile-only  { display:none !important; }
      }
      @media(max-width:1100px) and (min-width:769px) {
        .tablet-hide { display:none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ─── SERVICES ─────────────────────────────────────────────────────────────────
// ─── ESPN SPORT ENDPOINT MAP ─────────────────────────────────────────────────
const ESPN_SPORT_MAP = {
  "nfl":            { path:"football/nfl",             display:"NFL",                  icon:"🏈" },
  "nba":            { path:"basketball/nba",           display:"NBA",                  icon:"🏀" },
  "mlb":            { path:"baseball/mlb",             display:"MLB",                  icon:"⚾" },
  "nhl":            { path:"hockey/nhl",               display:"NHL",                  icon:"🏒" },
  "soccer":         { path:"soccer/eng.1",             display:"Premier League",        icon:"⚽" },
  "world cup":      { path:"soccer/fifa.world",        display:"FIFA World Cup 2026",   icon:"🏆" },
  "fifa":           { path:"soccer/fifa.world",        display:"FIFA World Cup 2026",   icon:"🏆" },
  "ufc":            { path:"mma/ufc",                  display:"UFC",                  icon:"🥊" },
  "mma":            { path:"mma/ufc",                  display:"UFC",                  icon:"🥊" },
  "formula":        { path:"racing/f1",                display:"Formula 1",            icon:"🏎️" },
  "college":        { path:"football/college-football",display:"College Football",      icon:"🏈" },
  "ncaa":           { path:"football/college-football",display:"College Football",      icon:"🏈" },
  // ── Soccer leagues by ID ───
  "eng.1":          { path:"soccer/eng.1",          display:"Premier League",     icon:"⚽" },
  "esp.1":          { path:"soccer/esp.1",          display:"La Liga",            icon:"⚽" },
  "ger.1":          { path:"soccer/ger.1",          display:"Bundesliga",         icon:"⚽" },
  "ita.1":          { path:"soccer/ita.1",          display:"Serie A",            icon:"⚽" },
  "fra.1":          { path:"soccer/fra.1",          display:"Ligue 1",            icon:"⚽" },
  "uefa.champions": { path:"soccer/uefa.champions", display:"Champions League",   icon:"🏆" },
  "uefa.europa":    { path:"soccer/uefa.europa",    display:"Europa League",      icon:"🇪🇺" },
  "usa.1":          { path:"soccer/usa.1",          display:"MLS",                icon:"⚽" },
  "mex.1":          { path:"soccer/mex.1",          display:"Liga MX",            icon:"⚽" },
  "ned.1":          { path:"soccer/ned.1",          display:"Eredivisie",         icon:"⚽" },
  "por.1":          { path:"soccer/por.1",          display:"Primeira Liga",      icon:"⚽" },
  "sco.1":          { path:"soccer/sco.1",          display:"Scottish Prem",      icon:"⚽" },
  "bra.1":          { path:"soccer/bra.1",          display:"Brasileirão",        icon:"⚽" },
  "arg.1":          { path:"soccer/arg.1",          display:"Liga Argentina",     icon:"⚽" },
  "eng.2":          { path:"soccer/eng.2",          display:"Championship",       icon:"⚽" },
  "tur.1":          { path:"soccer/tur.1",          display:"Süper Lig",          icon:"⚽" },
};

function getEspnSport(query) {
  const q = (query||"").toLowerCase();
  // Check longer keys first to avoid "soccer" matching before "world cup soccer"
  const sorted = Object.entries(ESPN_SPORT_MAP).sort((a,b)=>b[0].length-a[0].length);
  for (const [key, val] of sorted) {
    if (q.includes(key)) return val;
  }
  return null;
}

// ─── WORLD CUP 2026 TEAMS ────────────────────────────────────────────────────
const WC_TEAMS = [
  {name:"United States",   flag:"🇺🇸", conf:"CONCACAF"},
  {name:"Mexico",          flag:"🇲🇽", conf:"CONCACAF"},
  {name:"Canada",          flag:"🇨🇦", conf:"CONCACAF"},
  {name:"Brazil",          flag:"🇧🇷", conf:"CONMEBOL"},
  {name:"Argentina",       flag:"🇦🇷", conf:"CONMEBOL"},
  {name:"France",          flag:"🇫🇷", conf:"UEFA"},
  {name:"England",         flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf:"UEFA"},
  {name:"Germany",         flag:"🇩🇪", conf:"UEFA"},
  {name:"Spain",           flag:"🇪🇸", conf:"UEFA"},
  {name:"Portugal",        flag:"🇵🇹", conf:"UEFA"},
  {name:"Netherlands",     flag:"🇳🇱", conf:"UEFA"},
  {name:"Italy",           flag:"🇮🇹", conf:"UEFA"},
  {name:"Belgium",         flag:"🇧🇪", conf:"UEFA"},
  {name:"Croatia",         flag:"🇭🇷", conf:"UEFA"},
  {name:"Switzerland",     flag:"🇨🇭", conf:"UEFA"},
  {name:"Denmark",         flag:"🇩🇰", conf:"UEFA"},
  {name:"Austria",         flag:"🇦🇹", conf:"UEFA"},
  {name:"Poland",          flag:"🇵🇱", conf:"UEFA"},
  {name:"Serbia",          flag:"🇷🇸", conf:"UEFA"},
  {name:"Turkey",          flag:"🇹🇷", conf:"UEFA"},
  {name:"Scotland",        flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf:"UEFA"},
  {name:"Ukraine",         flag:"🇺🇦", conf:"UEFA"},
  {name:"Morocco",         flag:"🇲🇦", conf:"CAF"},
  {name:"Senegal",         flag:"🇸🇳", conf:"CAF"},
  {name:"Egypt",           flag:"🇪🇬", conf:"CAF"},
  {name:"Nigeria",         flag:"🇳🇬", conf:"CAF"},
  {name:"South Africa",    flag:"🇿🇦", conf:"CAF"},
  {name:"Cameroon",        flag:"🇨🇲", conf:"CAF"},
  {name:"Japan",           flag:"🇯🇵", conf:"AFC"},
  {name:"South Korea",     flag:"🇰🇷", conf:"AFC"},
  {name:"Australia",       flag:"🇦🇺", conf:"AFC"},
  {name:"Iran",            flag:"🇮🇷", conf:"AFC"},
  {name:"Saudi Arabia",    flag:"🇸🇦", conf:"AFC"},
  {name:"Uruguay",         flag:"🇺🇾", conf:"CONMEBOL"},
  {name:"Colombia",        flag:"🇨🇴", conf:"CONMEBOL"},
  {name:"Ecuador",         flag:"🇪🇨", conf:"CONMEBOL"},
  {name:"Chile",           flag:"🇨🇱", conf:"CONMEBOL"},
  {name:"Venezuela",       flag:"🇻🇪", conf:"CONMEBOL"},
  {name:"Peru",            flag:"🇵🇪", conf:"CONMEBOL"},
  {name:"Panama",          flag:"🇵🇦", conf:"CONCACAF"},
  {name:"Costa Rica",      flag:"🇨🇷", conf:"CONCACAF"},
  {name:"Jamaica",         flag:"🇯🇲", conf:"CONCACAF"},
  {name:"Honduras",        flag:"🇭🇳", conf:"CONCACAF"},
  {name:"New Zealand",     flag:"🇳🇿", conf:"OFC"},
  {name:"Qatar",           flag:"🇶🇦", conf:"AFC"},
  {name:"Algeria",         flag:"🇩🇿", conf:"CAF"},
  {name:"Tunisia",         flag:"🇹🇳", conf:"CAF"},
  {name:"Ghana",           flag:"🇬🇭", conf:"CAF"},
];

// ─── FAVORITE TEAMS MODAL ────────────────────────────────────────────────────
// ─── TEAM LOGO DATA ───────────────────────────────────────────────────────────
const TEAM_LOGOS = {
  // NBA
  "Atlanta Hawks":{abbr:"atl",l:"nba"},"Boston Celtics":{abbr:"bos",l:"nba"},"Brooklyn Nets":{abbr:"bkn",l:"nba"},"Charlotte Hornets":{abbr:"cha",l:"nba"},"Chicago Bulls":{abbr:"chi",l:"nba"},"Cleveland Cavaliers":{abbr:"cle",l:"nba"},"Dallas Mavericks":{abbr:"dal",l:"nba"},"Denver Nuggets":{abbr:"den",l:"nba"},"Detroit Pistons":{abbr:"det",l:"nba"},"Golden State Warriors":{abbr:"gs",l:"nba"},"Houston Rockets":{abbr:"hou",l:"nba"},"Indiana Pacers":{abbr:"ind",l:"nba"},"Los Angeles Clippers":{abbr:"lac",l:"nba"},"Los Angeles Lakers":{abbr:"lal",l:"nba"},"Memphis Grizzlies":{abbr:"mem",l:"nba"},"Miami Heat":{abbr:"mia",l:"nba"},"Milwaukee Bucks":{abbr:"mil",l:"nba"},"Minnesota Timberwolves":{abbr:"min",l:"nba"},"New Orleans Pelicans":{abbr:"no",l:"nba"},"New York Knicks":{abbr:"ny",l:"nba"},"Oklahoma City Thunder":{abbr:"okc",l:"nba"},"Orlando Magic":{abbr:"orl",l:"nba"},"Philadelphia 76ers":{abbr:"phi",l:"nba"},"Phoenix Suns":{abbr:"phx",l:"nba"},"Portland Trail Blazers":{abbr:"por",l:"nba"},"Sacramento Kings":{abbr:"sac",l:"nba"},"San Antonio Spurs":{abbr:"sa",l:"nba"},"Toronto Raptors":{abbr:"tor",l:"nba"},"Utah Jazz":{abbr:"utah",l:"nba"},"Washington Wizards":{abbr:"wsh",l:"nba"},
  // NFL
  "Arizona Cardinals":{abbr:"ari",l:"nfl"},"Atlanta Falcons":{abbr:"atl",l:"nfl"},"Baltimore Ravens":{abbr:"bal",l:"nfl"},"Buffalo Bills":{abbr:"buf",l:"nfl"},"Carolina Panthers":{abbr:"car",l:"nfl"},"Chicago Bears":{abbr:"chi",l:"nfl"},"Cincinnati Bengals":{abbr:"cin",l:"nfl"},"Cleveland Browns":{abbr:"cle",l:"nfl"},"Dallas Cowboys":{abbr:"dal",l:"nfl"},"Denver Broncos":{abbr:"den",l:"nfl"},"Detroit Lions":{abbr:"det",l:"nfl"},"Green Bay Packers":{abbr:"gb",l:"nfl"},"Houston Texans":{abbr:"hou",l:"nfl"},"Indianapolis Colts":{abbr:"ind",l:"nfl"},"Jacksonville Jaguars":{abbr:"jax",l:"nfl"},"Kansas City Chiefs":{abbr:"kc",l:"nfl"},"Las Vegas Raiders":{abbr:"lv",l:"nfl"},"Los Angeles Chargers":{abbr:"lac",l:"nfl"},"Los Angeles Rams":{abbr:"lar",l:"nfl"},"Miami Dolphins":{abbr:"mia",l:"nfl"},"Minnesota Vikings":{abbr:"min",l:"nfl"},"New England Patriots":{abbr:"ne",l:"nfl"},"New Orleans Saints":{abbr:"no",l:"nfl"},"New York Giants":{abbr:"nyg",l:"nfl"},"New York Jets":{abbr:"nyj",l:"nfl"},"Philadelphia Eagles":{abbr:"phi",l:"nfl"},"Pittsburgh Steelers":{abbr:"pit",l:"nfl"},"San Francisco 49ers":{abbr:"sf",l:"nfl"},"Seattle Seahawks":{abbr:"sea",l:"nfl"},"Tampa Bay Buccaneers":{abbr:"tb",l:"nfl"},"Tennessee Titans":{abbr:"ten",l:"nfl"},"Washington Commanders":{abbr:"wsh",l:"nfl"},
  // MLB
  "Arizona Diamondbacks":{abbr:"ari",l:"mlb"},"Atlanta Braves":{abbr:"atl",l:"mlb"},"Baltimore Orioles":{abbr:"bal",l:"mlb"},"Boston Red Sox":{abbr:"bos",l:"mlb"},"Chicago Cubs":{abbr:"chc",l:"mlb"},"Chicago White Sox":{abbr:"cws",l:"mlb"},"Cincinnati Reds":{abbr:"cin",l:"mlb"},"Cleveland Guardians":{abbr:"cle",l:"mlb"},"Colorado Rockies":{abbr:"col",l:"mlb"},"Detroit Tigers":{abbr:"det",l:"mlb"},"Houston Astros":{abbr:"hou",l:"mlb"},"Kansas City Royals":{abbr:"kc",l:"mlb"},"Los Angeles Angels":{abbr:"laa",l:"mlb"},"Los Angeles Dodgers":{abbr:"lad",l:"mlb"},"Miami Marlins":{abbr:"mia",l:"mlb"},"Milwaukee Brewers":{abbr:"mil",l:"mlb"},"Minnesota Twins":{abbr:"min",l:"mlb"},"New York Mets":{abbr:"nym",l:"mlb"},"New York Yankees":{abbr:"nyy",l:"mlb"},"Oakland Athletics":{abbr:"oak",l:"mlb"},"Philadelphia Phillies":{abbr:"phi",l:"mlb"},"Pittsburgh Pirates":{abbr:"pit",l:"mlb"},"San Diego Padres":{abbr:"sd",l:"mlb"},"San Francisco Giants":{abbr:"sf",l:"mlb"},"Seattle Mariners":{abbr:"sea",l:"mlb"},"St. Louis Cardinals":{abbr:"stl",l:"mlb"},"Tampa Bay Rays":{abbr:"tb",l:"mlb"},"Texas Rangers":{abbr:"tex",l:"mlb"},"Toronto Blue Jays":{abbr:"tor",l:"mlb"},"Washington Nationals":{abbr:"wsh",l:"mlb"},
  // NHL
  "Anaheim Ducks":{abbr:"ana",l:"nhl"},"Boston Bruins":{abbr:"bos",l:"nhl"},"Buffalo Sabres":{abbr:"buf",l:"nhl"},"Calgary Flames":{abbr:"cgy",l:"nhl"},"Carolina Hurricanes":{abbr:"car",l:"nhl"},"Chicago Blackhawks":{abbr:"chi",l:"nhl"},"Colorado Avalanche":{abbr:"col",l:"nhl"},"Columbus Blue Jackets":{abbr:"cbj",l:"nhl"},"Dallas Stars":{abbr:"dal",l:"nhl"},"Detroit Red Wings":{abbr:"det",l:"nhl"},"Edmonton Oilers":{abbr:"edm",l:"nhl"},"Florida Panthers":{abbr:"fla",l:"nhl"},"Los Angeles Kings":{abbr:"la",l:"nhl"},"Minnesota Wild":{abbr:"min",l:"nhl"},"Montreal Canadiens":{abbr:"mtl",l:"nhl"},"Nashville Predators":{abbr:"nsh",l:"nhl"},"New Jersey Devils":{abbr:"njd",l:"nhl"},"New York Islanders":{abbr:"nyi",l:"nhl"},"New York Rangers":{abbr:"nyr",l:"nhl"},"Ottawa Senators":{abbr:"ott",l:"nhl"},"Philadelphia Flyers":{abbr:"phi",l:"nhl"},"Pittsburgh Penguins":{abbr:"pit",l:"nhl"},"San Jose Sharks":{abbr:"sjs",l:"nhl"},"Seattle Kraken":{abbr:"sea",l:"nhl"},"St. Louis Blues":{abbr:"stl",l:"nhl"},"Tampa Bay Lightning":{abbr:"tb",l:"nhl"},"Toronto Maple Leafs":{abbr:"tor",l:"nhl"},"Utah Hockey Club":{abbr:"utah",l:"nhl"},"Vancouver Canucks":{abbr:"van",l:"nhl"},"Vegas Golden Knights":{abbr:"vgk",l:"nhl"},"Washington Capitals":{abbr:"wsh",l:"nhl"},"Winnipeg Jets":{abbr:"wpg",l:"nhl"},
};

function getTeamLogo(name) {
  const t = TEAM_LOGOS[name];
  if (!t) return null;
  return `https://a.espncdn.com/i/teamlogos/${t.l}/500/${t.abbr}.png`;
}

// ─── ALL-TEAMS LISTS ─────────────────────────────────────────────────────────
const ALL_TEAMS = {
  "NFL": ["Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills","Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns","Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers","Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs","Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins","Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants","New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers","Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders"],
  "NBA": ["Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets","Chicago Bulls","Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets","Detroit Pistons","Golden State Warriors","Houston Rockets","Indiana Pacers","Los Angeles Clippers","Los Angeles Lakers","Memphis Grizzlies","Miami Heat","Milwaukee Bucks","Minnesota Timberwolves","New Orleans Pelicans","New York Knicks","Oklahoma City Thunder","Orlando Magic","Philadelphia 76ers","Phoenix Suns","Portland Trail Blazers","Sacramento Kings","San Antonio Spurs","Toronto Raptors","Utah Jazz","Washington Wizards"],
  "MLB": ["Arizona Diamondbacks","Atlanta Braves","Baltimore Orioles","Boston Red Sox","Chicago Cubs","Chicago White Sox","Cincinnati Reds","Cleveland Guardians","Colorado Rockies","Detroit Tigers","Houston Astros","Kansas City Royals","Los Angeles Angels","Los Angeles Dodgers","Miami Marlins","Milwaukee Brewers","Minnesota Twins","New York Mets","New York Yankees","Oakland Athletics","Philadelphia Phillies","Pittsburgh Pirates","San Diego Padres","San Francisco Giants","Seattle Mariners","St. Louis Cardinals","Tampa Bay Rays","Texas Rangers","Toronto Blue Jays","Washington Nationals"],
  "NHL": ["Anaheim Ducks","Boston Bruins","Buffalo Sabres","Calgary Flames","Carolina Hurricanes","Chicago Blackhawks","Colorado Avalanche","Columbus Blue Jackets","Dallas Stars","Detroit Red Wings","Edmonton Oilers","Florida Panthers","Los Angeles Kings","Minnesota Wild","Montreal Canadiens","Nashville Predators","New Jersey Devils","New York Islanders","New York Rangers","Ottawa Senators","Philadelphia Flyers","Pittsburgh Penguins","San Jose Sharks","Seattle Kraken","St. Louis Blues","Tampa Bay Lightning","Toronto Maple Leafs","Utah Hockey Club","Vancouver Canucks","Vegas Golden Knights","Washington Capitals","Winnipeg Jets"],
  "UFC": ["Ilia Topuria","Jon Jones","Islam Makhachev","Alex Pereira","Leon Edwards","Sean O'Malley","Dricus du Plessis","Merab Dvalishvili","Tom Aspinall","Shavkat Rakhmonov","Conor McGregor","Khamzat Chimaev","Charles Oliveira","Justin Gaethje","Max Holloway","Amanda Nunes","Zhang Weili","Valentina Shevchenko","Alexa Grasso","Julianna Peña"],
  "WWE": ["Cody Rhodes","Roman Reigns","Seth Rollins","CM Punk","Drew McIntyre","Gunther","Sami Zayn","Kevin Owens","Rhea Ripley","Becky Lynch","Charlotte Flair","Bianca Belair","John Cena","Randy Orton","The Rock","Dominik Mysterio","Jey Uso","Damian Priest","Liv Morgan","Nia Jax"],
  "MLS": ["Atlanta United","Austin FC","Charlotte FC","Chicago Fire","FC Cincinnati","Colorado Rapids","Columbus Crew","D.C. United","FC Dallas","Houston Dynamo","Inter Miami CF","LA Galaxy","LAFC","Minnesota United","CF Montréal","Nashville SC","New England Revolution","New York City FC","New York Red Bulls","Orlando City","Philadelphia Union","Portland Timbers","Real Salt Lake","San Jose Earthquakes","Seattle Sounders","Sporting Kansas City","Toronto FC","Vancouver Whitecaps"],
  "LIGA MX": ["Club América","Chivas de Guadalajara","Cruz Azul","Pumas UNAM","Tigres UANL","CF Monterrey","Deportivo Toluca","Necaxa","Santos Laguna","Atlas FC","Mazatlán FC","Querétaro FC","FC Juárez","Club Tijuana","Atlético de San Luis","CF Pachuca","Club León","Club Puebla","Club Necaxa","Atletico San Luis"],
  "PREMIER LEAGUE": ["Arsenal","Aston Villa","Bournemouth","Brentford","Brighton","Chelsea","Crystal Palace","Everton","Fulham","Ipswich Town","Leicester City","Liverpool","Manchester City","Manchester United","Newcastle United","Nottingham Forest","Southampton","Tottenham Hotspur","West Ham United","Wolverhampton"],
  "LA LIGA": ["Athletic Bilbao","Atlético Madrid","Barcelona","Betis","Celta Vigo","Espanyol","Getafe","Girona","Las Palmas","Leganés","Mallorca","Osasuna","Rayo Vallecano","Real Madrid","Real Sociedad","Real Valladolid","Sevilla","Valencia","Villarreal","Alavés"],
  "BUNDESLIGA": ["Augsburg","Bayer Leverkusen","Bayern Munich","Bochum","Borussia Dortmund","Borussia Mönchengladbach","Eintracht Frankfurt","Freiburg","Heidenheim","Hoffenheim","Holstein Kiel","Mainz","RB Leipzig","Stuttgart","Union Berlin","Werder Bremen","Wolfsburg","St. Pauli"],
  "SERIE A": ["AC Milan","Atalanta","Bologna","Cagliari","Como","Empoli","Fiorentina","Genoa","Inter Milan","Juventus","Lazio","Lecce","Monza","Napoli","Parma","Roma","Torino","Udinese","Venezia","Verona"],
  "LIGUE 1": ["Angers","Auxerre","Brest","Lens","Lille","Lyon","Marseille","Monaco","Montpellier","Nantes","Nice","Paris Saint-Germain","Reims","Rennes","Saint-Étienne","Strasbourg","Toulouse"],
};

function getTeamsForSport(sportDisplay, events, espnTeams) {
  if (!sportDisplay) return [];
  const upper = sportDisplay.toUpperCase();

  // Direct key match first
  for (const [key, teams] of Object.entries(ALL_TEAMS)) {
    if (upper.includes(key)) return teams.map(n=>({name:n,flag:"🏅"}));
  }

  // Soccer league name fallbacks
  const soccerMap = {
    "PREMIER LEAGUE": "PREMIER LEAGUE", "LA LIGA": "LA LIGA",
    "BUNDESLIGA": "BUNDESLIGA", "SERIE A": "SERIE A",
    "LIGUE 1": "LIGUE 1", "LIGA MX": "LIGA MX",
  };
  for (const [keyword, key] of Object.entries(soccerMap)) {
    if (upper.includes(keyword) && ALL_TEAMS[key]) {
      return ALL_TEAMS[key].map(n=>({name:n,flag:"⚽"}));
    }
  }

  // ESPN API teams (for other soccer leagues)
  if (espnTeams.length > 0) return espnTeams;

  // World Cup
  if (upper.includes("WORLD CUP")||upper.includes("FIFA")) return WC_TEAMS;

  // Fallback: extract from current schedule
  return [...new Set([...events.map(e=>e.home?.name),...events.map(e=>e.away?.name)])].filter(Boolean).sort().map(n=>({name:n,flag:"🏅"}));
}

function FavoriteTeamModal({ sport, events, favoriteTeams, onToggle, onClose }) {
  const [search, setSearch] = useState("");
  const [espnTeams, setEspnTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const leagueEntry = SOCCER_LEAGUES.find(l=>l.name===sport);
  const leagueId = leagueEntry?.id;

  useEffect(() => {
    if (!leagueId) return;
    setLoadingTeams(true);
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams?limit=100`)
      .then(r=>r.json())
      .then(data=>{
        setEspnTeams((data.sports?.[0]?.leagues?.[0]?.teams||[]).map(t=>({
          name:t.team.displayName||t.team.name,
          flag:"⚽",
          logo:t.team.logos?.[0]?.href||"",
        })));
        setLoadingTeams(false);
      })
      .catch(()=>setLoadingTeams(false));
  }, [leagueId]);

  const allTeams = getTeamsForSport(sport, events, espnTeams);
  const teams = allTeams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const favArr = (() => { const v=favoriteTeams[sport||""]; return Array.isArray(v)?v:(v?[v]:[]); })();

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:600,maxHeight:"80vh",display:"flex",flexDirection:"column",border:"1px solid rgba(245,158,11,.2)"}}>
        <div style={{padding:"20px 20px 14px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>⭐ Follow Teams</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{sport} · tap to follow/unfollow · {allTeams.length} teams</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search teams…"
            style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"var(--text)",outline:"none",boxSizing:"border-box"}}/>
          {/* Currently following */}
          {favArr.length>0 && (
            <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:11,color:"var(--muted)",fontWeight:700}}>Following:</span>
              {favArr.map(name=>(
                <div key={name} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.35)",borderRadius:99,padding:"3px 10px 3px 6px"}}>
                  <span style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>{name}</span>
                  <button onClick={()=>onToggle(sport,name)} style={{background:"none",border:"none",color:"rgba(245,158,11,.6)",fontSize:12,cursor:"pointer",padding:0,lineHeight:1}}>✕</button>
                </div>
              ))}
              <button onClick={()=>{onToggle(sport,"_clear");}} style={{fontSize:10,color:"var(--muted)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Clear all</button>
            </div>
          )}
        </div>
        <div style={{overflowY:"auto",padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
          {loadingTeams ? Array.from({length:12}).map((_,i)=><div key={i} className="skeleton" style={{height:72,borderRadius:12}}/>) :
           teams.length===0 ? <div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--muted)",padding:"24px 0",fontSize:13}}>No teams found</div> :
           teams.map(t=>{
            const isFav = favArr.includes(t.name);
            const logo = t.logo || getTeamLogo(t.name);
            return (
              <button key={t.name} onClick={()=>onToggle(sport,t.name)}
                style={{
                  background:isFav?"rgba(245,158,11,.15)":"rgba(255,255,255,.04)",
                  border:`2px solid ${isFav?"rgba(245,158,11,.6)":"rgba(255,255,255,.1)"}`,
                  borderRadius:14,padding:"12px 10px",
                  display:"flex",alignItems:"center",gap:10,
                  cursor:"pointer",textAlign:"left",transition:"all .15s",color:"var(--text)",
                  boxShadow:isFav?"0 0 12px rgba(245,158,11,.2)":"none",
                  position:"relative",
                }}>
                {isFav && <div style={{position:"absolute",top:6,right:6,fontSize:12}}>✓</div>}
                {logo
                  ? <img src={logo} alt={t.name} style={{width:36,height:36,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
                  : <span style={{fontSize:24,flexShrink:0,lineHeight:1}}>{t.flag||"🏅"}</span>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:isFav?800:600,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                  {isFav && <div style={{fontSize:10,color:"var(--gold)",marginTop:2}}>⭐ Following</div>}
                </div>
              </button>
            );
           })
          }
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={onClose} style={{width:"100%",background:"var(--purple)",border:"none",borderRadius:12,color:"#fff",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>
            ✓ Done ({favArr.length} team{favArr.length!==1?"s":""} followed)
          </button>
        </div>
      </div>
    </div>
  );
}





// ─── CALENDAR REMINDER HELPERS ───────────────────────────────────────────────
function toCalDate(dateStr) {
  return new Date(dateStr).toISOString().replace(/[-:]|\.\d{3}/g,"");
}

function getReminderLinks(evt) {
  const title   = encodeURIComponent(evt.name||evt.shortName||"Sports Event");
  const start   = toCalDate(evt.date);
  const endTime = new Date(new Date(evt.date).getTime()+3*60*60*1000).toISOString();
  const end     = toCalDate(endTime);
  const details = encodeURIComponent(`Watch on: ${evt.broadcast||"Check streaming services"}\nVenue: ${evt.venue||evt.city||""}`);
  const loc     = encodeURIComponent(evt.venue||evt.city||"");
  return {
    google:  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${loc}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(evt.date)}&enddt=${encodeURIComponent(endTime)}&body=${details}&location=${loc}`,
  };
}

function downloadICS(evt) {
  const title   = evt.name||evt.shortName||"Sports Event";
  const start   = toCalDate(evt.date);
  const end     = toCalDate(new Date(new Date(evt.date).getTime()+3*60*60*1000).toISOString());
  const icsText = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//StreamHub//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `LOCATION:${evt.venue||evt.city||""}`,
    `DESCRIPTION:Watch on ${evt.broadcast||"streaming"}`,
    "END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([icsText],{type:"text/calendar"}));
  const a = document.createElement("a");
  a.href = url; a.download = `${(evt.shortName||"game").replace(/\s+/g,"-")}.ics`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function openLink(url) {
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── GAME DETAIL MODAL ───────────────────────────────────────────────────────
function GameDetailModal({ evt, onClose }) {
  const [showReminder, setShowReminder] = useState(false);
  const broadcastLink = evt.broadcastLink ||
    `https://www.google.com/search?q=watch+${encodeURIComponent((evt.shortName||evt.name||"").replace(/\s+/g,"+"))}+live+stream`;
  const isFight = evt.isTitleFight;
  const isUpcoming = !evt.isLive && !evt.isOver;
  const reminderLinks = isUpcoming ? getReminderLinks(evt) : null;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1300,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60,paddingBottom:20,paddingLeft:12,paddingRight:12,overflowY:"auto",backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{
        background:"linear-gradient(160deg,var(--surface) 0%,#0d1a0d 100%)",
        borderRadius:18,width:"100%",maxWidth:500,
        border:"1px solid rgba(16,185,129,.3)",
        boxShadow:"0 20px 60px rgba(0,0,0,.7)",
        overflow:"hidden",
      }}>
        {/* Live indicator stripe */}
        {evt.isLive && (
          <div style={{background:"linear-gradient(90deg,#ef4444,#dc2626)",padding:"6px 20px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"liveDot 1s infinite"}}/>
            <span style={{fontSize:11,fontWeight:800,color:"#fff",letterSpacing:1.5}}>LIVE NOW — {evt.periodText}</span>
          </div>
        )}
        {/* Upcoming stripe */}
        {isUpcoming && (
          <div style={{background:"linear-gradient(90deg,rgba(16,185,129,.2),rgba(6,182,212,.15))",padding:"6px 20px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,fontWeight:800,color:"var(--sports)",letterSpacing:1}}>📅 UPCOMING · {evt.localDate} · {evt.localTime}</span>
          </div>
        )}

        <div style={{padding:"20px 20px 8px"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              {isFight && <div style={{fontSize:10,fontWeight:800,color:"var(--gold)",letterSpacing:1,marginBottom:4}}>🏆 TITLE FIGHT</div>}
              {evt.isOver && <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>✓ FINAL</div>}
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>

          {/* Score / Matchup */}
          {evt.home?.name && evt.away?.name ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:20}}>
              {/* Away */}
              <div style={{flex:1,textAlign:"center"}}>
                {evt.away.logo
                  ? <img src={evt.away.logo} alt="" style={{width:52,height:52,objectFit:"contain",marginBottom:8}}/>
                  : <div style={{width:52,height:52,borderRadius:12,background:`#${evt.away.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#fff",margin:"0 auto 8px"}}>{evt.away.abbr?.slice(0,3)}</div>
                }
                <div style={{fontSize:13,fontWeight:700,color:evt.isOver&&evt.away.winner?"var(--gold)":"var(--text)"}}>{evt.away.name}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>Away</div>
              </div>

              {/* Score / VS */}
              <div style={{textAlign:"center",flexShrink:0}}>
                {(evt.isLive||evt.isOver) ? (
                  <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:38,lineHeight:1,letterSpacing:-2}}>
                    <span style={{color:evt.away.winner?"var(--gold)":"var(--text)"}}>{evt.away.score}</span>
                    <span style={{color:"var(--muted)",fontSize:22,margin:"0 6px"}}>:</span>
                    <span style={{color:evt.home.winner?"var(--gold)":"var(--text)"}}>{evt.home.score}</span>
                  </div>
                ) : (
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,color:"var(--muted)"}}>VS</div>
                )}
                {evt.isLive && evt.periodText && (
                  <div style={{fontSize:10,color:"#ef4444",fontWeight:700,marginTop:4}}>{evt.periodText}</div>
                )}
              </div>

              {/* Home */}
              <div style={{flex:1,textAlign:"center"}}>
                {evt.home.logo
                  ? <img src={evt.home.logo} alt="" style={{width:52,height:52,objectFit:"contain",marginBottom:8}}/>
                  : <div style={{width:52,height:52,borderRadius:12,background:`#${evt.home.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#fff",margin:"0 auto 8px"}}>{evt.home.abbr?.slice(0,3)}</div>
                }
                <div style={{fontSize:13,fontWeight:700,color:evt.isOver&&evt.home.winner?"var(--gold)":"var(--text)"}}>{evt.home.name}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>Home</div>
              </div>
            </div>
          ) : (
            <div style={{fontSize:16,fontWeight:800,textAlign:"center",marginBottom:20}}>{evt.name}</div>
          )}

          {/* Venue + broadcast */}
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            {evt.venue && (
              <div style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px 12px",minWidth:120}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:3}}>📍 VENUE</div>
                <div style={{fontSize:12,fontWeight:700}}>{evt.venue}</div>
                {evt.city && <div style={{fontSize:11,color:"var(--muted)"}}>{evt.city}</div>}
              </div>
            )}
            {evt.broadcast && (
              <div style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px 12px",minWidth:100}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:3}}>📺 BROADCAST</div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>{evt.broadcast}</div>
              </div>
            )}
          </div>

          {/* 🔔 Set Reminder — upcoming games only */}
          {isUpcoming && reminderLinks && (
            <div style={{marginBottom:12}}>
              <button onClick={()=>setShowReminder(!showReminder)}
                style={{
                  width:"100%", background:showReminder?"rgba(245,158,11,.15)":"rgba(245,158,11,.08)",
                  border:"1px solid rgba(245,158,11,.3)", borderRadius:12,
                  color:"var(--gold)", padding:"11px 0",
                  fontFamily:"var(--font-head)", fontWeight:800, fontSize:14,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  transition:"all .2s",
                }}>
                🔔 {showReminder ? "Choose Calendar ↑" : "Set a Reminder"}
              </button>
              {showReminder && (
                <div className="fadeUp" style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[
                    { label:"Google Calendar", icon:"📅", color:"#4285F4", action:()=>openLink(reminderLinks.google)  },
                    { label:"Apple Calendar",  icon:"🍎", color:"#555555", action:()=>downloadICS(evt)                },
                    { label:"Outlook",         icon:"📧", color:"#0078D4", action:()=>openLink(reminderLinks.outlook) },
                  ].map(cal=>(
                    <button key={cal.label}
                      onClick={()=>{ cal.action(); setTimeout(()=>setShowReminder(false),300); }}
                      style={{
                        flex:1, minWidth:90, textAlign:"center",
                        background:`${cal.color}15`, border:`1px solid ${cal.color}40`,
                        borderRadius:10, padding:"10px 6px",
                        fontSize:11, fontWeight:700, color:"var(--text)",
                        cursor:"pointer", display:"flex",
                        flexDirection:"column", alignItems:"center", gap:4,
                        transition:"all .2s",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background=`${cal.color}30`}
                      onMouseLeave={e=>e.currentTarget.style.background=`${cal.color}15`}>
                      <span style={{fontSize:20}}>{cal.icon}</span>
                      <span>{cal.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watch button */}
          <a href={broadcastLink||"#"} onClick={e=>{if(!broadcastLink){e.preventDefault();}}} target="_blank" rel="noopener noreferrer"
            style={{
              display:"block", textAlign:"center",
              background: evt.isLive
                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : isUpcoming
                  ? "linear-gradient(135deg,rgba(16,185,129,.3),rgba(6,182,212,.3))"
                  : "linear-gradient(135deg,var(--surface),rgba(255,255,255,.05))",
              borderRadius:14, padding:"14px 0",
              fontFamily:"var(--font-head)", fontWeight:800, fontSize:15,
              color: evt.isLive ? "#fff" : isUpcoming ? "var(--sports)" : "var(--muted)",
              textDecoration:"none",
              border: evt.isLive ? "none" : "1px solid rgba(16,185,129,.3)",
              boxShadow: evt.isLive ? "0 8px 24px rgba(239,68,68,.4)" : "none",
              marginBottom:10,
            }}>
            {evt.isLive ? "▶ Watch Live Now" : evt.isOver ? "📺 Watch Replay / Highlights" : `📺 Where to Watch →`}
          </a>

          {!evt.broadcastLink && (
            <a href={`https://www.google.com/search?q=where+to+watch+${encodeURIComponent(evt.shortName||evt.name||"")}+live`}
              target="_blank" rel="noopener noreferrer"
              style={{display:"block",textAlign:"center",fontSize:12,color:"var(--muted)",textDecoration:"underline",marginBottom:6}}>
              Search all streaming options →
            </a>
          )}
        </div>
        <div style={{height:20}}/>
      </div>
    </div>
  );
}

// ─── BROADCAST LINK MAPPER ───────────────────────────────────────────────────
function getBroadcastLink(broadcast) {
  if (!broadcast) return "";
  const b = broadcast.toUpperCase();
  // Use root domain URLs — platform deep paths often block external navigation
  if (b.includes("ESPN+") || b.includes("ESPN UNLMTD")) return "https://plus.espn.com/";
  if (b.includes("ESPN2") || b.includes("ESPN")) return "https://www.espn.com/watch/";
  if (b.includes("MLB.TV")) return "https://www.mlb.tv/";
  if (b.includes("NFL+") || b.includes("NFL NETWORK")) return "https://www.nfl.com/";
  if (b.includes("NBA TV") || b.includes("NBA LEAGUE")) return "https://www.nba.com/";
  if (b.includes("HULU")) return "https://www.hulu.com/";
  if (b.includes("ABC")) return "https://abc.com/";
  if (b.includes("PEACOCK")) return "https://www.peacocktv.com/";
  if (b.includes("NBC")) return "https://www.nbc.com/";
  if (b.includes("PARAMOUNT")) return "https://www.paramountplus.com/";
  if (b.includes("CBS")) return "https://www.cbssports.com/";
  if (b.includes("FOX") || b.includes("FS1") || b.includes("FS2")) return "https://www.foxsports.com/";
  if (b.includes("TNT") || b.includes("TBS") || b.includes("TRUETV") || b.includes("MAX")) return "https://www.max.com/";
  if (b.includes("PRIME") || b.includes("AMAZON")) return "https://www.amazon.com/video/";
  if (b.includes("APPLE")) return "https://tv.apple.com/";
  if (b.includes("NETFLIX")) return "https://www.netflix.com/";
  if (b.includes("DAZN")) return "https://www.dazn.com/";
  if (b.includes("YOUTUBE TV")) return "https://tv.youtube.com/";
  if (b.includes("FUBO")) return "https://www.fubo.tv/";
  if (b.includes("DISNEY")) return "https://www.disneyplus.com/";
  return "";
}

function LiveSportsSection({ sportQuery, favoriteTeams, onToggleFavorite }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportInfo, setSportInfo] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const intervalRef = useRef(null);
  const sportRef = useRef(null);   // always has the latest sport — no stale closure

  // All ESPN status names that mean "this match is currently happening"
  const LIVE_STATUSES = new Set([
    "STATUS_IN_PROGRESS",
    "STATUS_HALFTIME",
    "STATUS_EXTRA_TIME_IN_PROGRESS",
    "STATUS_EXTRA_TIME_HALF",
    "STATUS_SHOOTOUT_IN_PROGRESS",
    "STATUS_OVERTIME",
    "STATUS_FIRST_HALF",
    "STATUS_SECOND_HALF",
    "STATUS_END_PERIOD",
  ]);

  // Parse ESPN events from API response
  const parseEvents = (data) => (data.events||[]).map(evt => {
    const comp = evt.competitions?.[0];
    const home = comp?.competitors?.find(c=>c.homeAway==="home") || comp?.competitors?.[0];
    const away = comp?.competitors?.find(c=>c.homeAway==="away") || comp?.competitors?.[1];
    const st = evt.status?.type;
    const statusName = st?.name || "";
    const isHalftime = statusName === "STATUS_HALFTIME" || statusName === "STATUS_EXTRA_TIME_HALF";
    const isShootout = statusName === "STATUS_SHOOTOUT_IN_PROGRESS";
    const isExtraTime = statusName === "STATUS_EXTRA_TIME_IN_PROGRESS";
    const isLive = LIVE_STATUSES.has(statusName) && !st?.completed;

    // Build a clear period label for soccer
    let periodText = st?.shortDetail || "";
    if (isHalftime)  periodText = "Half Time";
    if (isExtraTime) periodText = "Extra Time · " + (st?.displayClock || "");
    if (isShootout)  periodText = "⚽ Penalty Shootout";

    return {
      id: evt.id,
      name: evt.name||evt.shortName||"",
      shortName: evt.shortName||evt.name||"",
      date: evt.date,
      localDate: new Date(evt.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
      localTime: new Date(evt.date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZoneName:"short"}),
      isLive,
      isHalftime,
      isShootout,
      isExtraTime,
      isOver: st?.completed||false,
      period: evt.status?.period||0,
      displayClock: evt.status?.displayClock||"",
      periodText,
      home: { name:home?.team?.shortDisplayName||home?.team?.displayName||"", abbr:home?.team?.abbreviation||"", score:home?.score??"-", logo:home?.team?.logo||"", color:home?.team?.color||"333", winner:home?.winner },
      away: { name:away?.team?.shortDisplayName||away?.team?.displayName||"", abbr:away?.team?.abbreviation||"", score:away?.score??"-", logo:away?.team?.logo||"", color:away?.team?.color||"333", winner:away?.winner },
      broadcast: comp?.broadcasts?.[0]?.names?.join(", ")||"",
      broadcastLink: getBroadcastLink(comp?.broadcasts?.[0]?.names?.join(", ")||""),
      venue: comp?.venue?.fullName||"",
      city: comp?.venue?.address?.city||"",
      isTitleFight: (evt.name||"").toLowerCase().includes("championship")||(evt.name||"").toLowerCase().includes("title"),
    };
  });

  // Core fetch function — reads sport from ref, no stale closure
  const doFetch = async (silent=false) => {
    const sport = sportRef.current;
    if (!sport) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport.path}/scoreboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const evts = parseEvents(data);
      setEvents(evts);
      setLastUpdated(new Date());
      setError(null);
      // Keep polling if any game is live OR if any game starts within the next 90 minutes
      const now = Date.now();
      const hasSoonGame = evts.some(e => !e.isOver && !e.isLive && new Date(e.date).getTime() - now < 90*60*1000);
      setIsPolling(evts.some(e=>e.isLive) || hasSoonGame);
    } catch(e) {
      if (!silent) setError("Could not load schedule");
    }
    if (!silent) setLoading(false);
  };

  // When sport changes: update ref, reset state, fetch fresh
  useEffect(() => {
    const sport = getEspnSport(sportQuery);
    if (!sport) { setLoading(false); setError(null); return; }
    sportRef.current = sport;
    setSportInfo(sport);
    setEvents([]);
    setLastUpdated(null);
    setIsPolling(false);
    setError(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    doFetch(false);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sportQuery]);

  // Polling: 20s when games are live, 60s when games start soon
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPolling) {
      const hasLive = events.some(e=>e.isLive);
      intervalRef.current = setInterval(() => doFetch(true), hasLive ? 20000 : 60000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPolling, events]);

  const sport = getEspnSport(sportQuery);
  if (!sport && !loading) return null;

  const favTeam = (() => {
    const v = favoriteTeams?.[sportInfo?.display||""];
    return Array.isArray(v) ? v : (v ? [v] : []);
  })();
  const liveEvents = events.filter(e=>e.isLive);
  const upcomingEvents = events.filter(e=>!e.isLive&&!e.isOver);
  const recentEvents = events.filter(e=>e.isOver).slice(-4).reverse();
  const hasLive = liveEvents.length > 0;

  const sortByFav = (evts) => {
    if (!favTeam) return evts.slice(0,8);
    const fav = evts.filter(e=>e.home.name===favTeam||e.away.name===favTeam);
    const rest = evts.filter(e=>e.home.name!==favTeam&&e.away.name!==favTeam);
    return [...fav,...rest].slice(0,8);
  };

  return (
    <div style={{marginBottom:20}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {hasLive && <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1.5s infinite",boxShadow:"0 0 8px #ef4444",flexShrink:0}}/>}
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:hasLive?"#ef4444":"var(--sports)"}}>
            {hasLive?"🔴 LIVE NOW":"📅 SCHEDULE"} — {sportInfo?.display||""}
          </div>
          {isPolling && <div style={{fontSize:9,background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:99,padding:"2px 8px",color:"#ef4444",fontWeight:700}}>AUTO-UPDATING</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {favTeam && <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:99,padding:"3px 10px",fontSize:11,color:"var(--gold)",fontWeight:700}}>⭐ {favTeam}</div>}
          <button onClick={()=>setShowTeamPicker(true)} style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.25)",borderRadius:99,color:"var(--gold)",padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            {favTeam?"⭐ Change Team":"⭐ Follow a Team"}
          </button>
          {lastUpdated && <div style={{fontSize:10,color:"var(--muted)"}}>Updated {lastUpdated.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>}
          <button onClick={()=>setShowFullSchedule(true)} style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:8,color:"var(--sports)",padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>📅 All Games</button>
          <button onClick={()=>doFetch(false)} style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:8,color:"var(--sports)",padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>↻</button>
        </div>
      </div>

      {showTeamPicker && (
        <FavoriteTeamModal sport={sportInfo?.display} events={events} favoriteTeams={favoriteTeams||{}} onToggle={onToggleFavorite} onClose={()=>setShowTeamPicker(false)}/>
      )}
      {selectedGame && (
        <GameDetailModal evt={selectedGame} onClose={()=>setSelectedGame(null)}/>
      )}
      {showFullSchedule && (
        <WeeklyScheduleModal sportQuery={sportQuery} sportDisplay={sportInfo?.display||""} onClose={()=>setShowFullSchedule(false)}/>
      )}

      {loading ? (
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
          {[1,2,3].map(i=><div key={i} className="skeleton" style={{flexShrink:0,width:200,height:110,borderRadius:12}}/>)}
        </div>
      ) : error ? (
        <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,padding:16,textAlign:"center"}}>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>{error}</div>
          <button onClick={()=>doFetch(false)} style={{background:"var(--sports)",border:"none",borderRadius:8,color:"#fff",padding:"6px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Try Again</button>
        </div>
      ) : (
        <div>
          {hasLive && <div style={{fontSize:11,color:"#ef4444",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>TAP A GAME TO WATCH LIVE</div>}
          {liveEvents.length>0 && (
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none",marginBottom:12}}>
              {sortByFav(liveEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={true} favTeam={favTeam} onSelect={setSelectedGame}/>)}
            </div>
          )}
          {upcomingEvents.length>0 && (
            <>
              {liveEvents.length>0 && <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>UPCOMING — tap to find where to watch</div>}
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
                {sortByFav(upcomingEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={false} favTeam={favTeam} onSelect={setSelectedGame}/>)}
              </div>
            </>
          )}
          {recentEvents.length>0 && upcomingEvents.length===0 && (
            <>
              <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>RECENT RESULTS</div>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
                {sortByFav(recentEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={false} isOver={true} favTeam={favTeam} onSelect={setSelectedGame}/>)}
              </div>
            </>
          )}
          {events.length===0 && (
            <div style={{fontSize:13,color:"var(--muted)",textAlign:"center",padding:"24px 0",background:"rgba(255,255,255,.02)",borderRadius:12}}>
              No games scheduled right now. Season may be on break.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GameCard({ evt, isLive, isOver, favTeam, onSelect }) {
  const [showReminder, setShowReminder] = useState(false);
  const hasTeams = evt.home?.name && evt.away?.name;
  const favArr = Array.isArray(favTeam) ? favTeam : (favTeam ? [favTeam] : []);
  const isFavGame = favArr.length>0 && (favArr.some(n=>n===evt.home?.name||n===evt.away?.name));
  const isUpcoming = !isLive && !isOver;
  const remLinks = isUpcoming ? getReminderLinks(evt) : null;

  return (
    <div style={{
      flexShrink:0, width:215,
      background: isFavGame ? "rgba(245,158,11,.07)" : "rgba(255,255,255,.04)",
      border:`1px solid ${isFavGame?"rgba(245,158,11,.4)":isLive?"rgba(239,68,68,.5)":"rgba(255,255,255,.08)"}`,
      borderRadius:14, overflow:"hidden",
      boxShadow:isFavGame?"0 0 20px rgba(245,158,11,.15)":isLive?"0 0 20px rgba(239,68,68,.2)":"none",
      position:"relative",
    }}>
      {isFavGame && <div style={{position:"absolute",top:6,right:6,fontSize:10,zIndex:1}}>⭐</div>}

      {/* Clickable main body */}
      <div onClick={()=>onSelect&&onSelect(evt)} style={{cursor:"pointer"}}
        onMouseEnter={e=>e.currentTarget.style.opacity=".88"}
        onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
        <div style={{padding:"6px 10px",background:isLive?(evt.isHalftime?"rgba(245,158,11,.12)":evt.isShootout?"rgba(139,92,246,.15)":"rgba(239,68,68,.15)"):isFavGame?"rgba(245,158,11,.06)":"rgba(255,255,255,.03)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:10,fontWeight:700,color:isLive?(evt.isHalftime?"var(--gold)":evt.isShootout?"#C4B5FD":"#ef4444"):isFavGame?"var(--gold)":"var(--muted)"}}>
            {isLive
              ? evt.isHalftime  ? "⏸ HALF TIME"
              : evt.isShootout  ? "🥅 PENALTIES"
              : evt.isExtraTime ? `⚽ ET · ${evt.displayClock||evt.periodText}`
              : `🔴 ${evt.periodText||"LIVE"}`
              : isOver ? "✓ FINAL" : evt.localDate}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {evt.broadcast && <div style={{fontSize:9,color:"var(--gold)",fontWeight:700,background:"rgba(245,158,11,.1)",borderRadius:4,padding:"1px 5px",maxWidth:72,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{evt.broadcast}</div>}
            {isLive && !evt.isHalftime && <div style={{fontSize:9,color:"#fff",fontWeight:800,background:evt.isShootout?"#8B5CF6":"#ef4444",borderRadius:4,padding:"1px 5px"}}>{evt.isShootout?"PKS":"WATCH"}</div>}
            {evt.isHalftime && <div style={{fontSize:9,color:"#000",fontWeight:800,background:"var(--gold)",borderRadius:4,padding:"1px 5px"}}>HT</div>}
          </div>
        </div>
        <div style={{padding:"10px 12px 8px"}}>
          {hasTeams ? (
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0,flex:1}}>
                  {evt.away.logo ? <img src={evt.away.logo} alt="" style={{width:22,height:22,objectFit:"contain",flexShrink:0}}/> : <div style={{width:22,height:22,borderRadius:4,background:`#${evt.away.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:"#fff",flexShrink:0}}>{evt.away.abbr?.slice(0,3)}</div>}
                  <span style={{fontSize:13,fontWeight:evt.away.winner?800:600,opacity:isOver&&!evt.away.winner?0.7:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:evt.away.name===favTeam?"var(--gold)":"var(--text)"}}>{evt.away.name}</span>
                </div>
                {(isLive||isOver)&&<span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,color:evt.away.winner?"var(--gold)":"var(--text)",flexShrink:0,marginLeft:6}}>{evt.away.score}</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0,flex:1}}>
                  {evt.home.logo ? <img src={evt.home.logo} alt="" style={{width:22,height:22,objectFit:"contain",flexShrink:0}}/> : <div style={{width:22,height:22,borderRadius:4,background:`#${evt.home.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:"#fff",flexShrink:0}}>{evt.home.abbr?.slice(0,3)}</div>}
                  <span style={{fontSize:13,fontWeight:evt.home.winner?800:600,opacity:isOver&&!evt.home.winner?0.7:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:evt.home.name===favTeam?"var(--gold)":"var(--text)"}}>{evt.home.name}</span>
                </div>
                {(isLive||isOver)&&<span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,color:evt.home.winner?"var(--gold)":"var(--text)",flexShrink:0,marginLeft:6}}>{evt.home.score}</span>}
              </div>
            </>
          ) : (
            <div style={{fontSize:12,fontWeight:700,lineHeight:1.4}}>{evt.name}</div>
          )}
          {isUpcoming && evt.localTime && (
            <div style={{marginTop:6,fontSize:10,color:"var(--muted)",display:"flex",gap:6,flexWrap:"wrap"}}>
              <span>🕐 {evt.localTime}</span>
              {evt.city && <span>📍 {evt.city}</span>}
            </div>
          )}
          {isLive && <div style={{marginTop:6,fontSize:10,color:"#ef4444",fontWeight:700}}>▶ Tap to watch live →</div>}
          {evt.isTitleFight && <div style={{marginTop:4,fontSize:9,fontWeight:800,color:"var(--gold)",letterSpacing:.5}}>🏆 TITLE FIGHT</div>}
        </div>
      </div>

      {/* 🔔 Inline reminder row for upcoming only */}
      {isUpcoming && remLinks && (
        <div style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"6px 8px",background:"rgba(255,255,255,.02)"}}>
          {!showReminder ? (
            <button onClick={e=>{e.stopPropagation();setShowReminder(true);}}
              style={{width:"100%",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:8,color:"var(--gold)",padding:"5px 0",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              🔔 Set Reminder
            </button>
          ) : (
            <div className="fadeUp" style={{display:"flex",gap:5,alignItems:"center"}}>
              {[
                {icon:"📅",label:"Google", action:()=>openLink(remLinks.google)},
                {icon:"🍎",label:"Apple",  action:()=>downloadICS(evt)},
                {icon:"📧",label:"Outlook",action:()=>openLink(remLinks.outlook)},
              ].map(cal=>(
                <button key={cal.label} onClick={e=>{e.stopPropagation();cal.action();setShowReminder(false);}}
                  style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 2px",fontSize:9,fontWeight:700,color:"var(--text)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <span style={{fontSize:14}}>{cal.icon}</span>
                  <span>{cal.label}</span>
                </button>
              ))}
              <button onClick={e=>{e.stopPropagation();setShowReminder(false);}}
                style={{background:"none",border:"none",color:"var(--muted)",fontSize:16,cursor:"pointer",padding:"0 2px",lineHeight:1}}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SCHEDULE GAME ROW (own state for reminder toggle) ───────────────────────
function ScheduleGameRow({ evt, isLast }) {
  const [showRem, setShowRem] = useState(false);
  const isUpcoming = !evt.isLive && !evt.isOver;
  const remLinks = isUpcoming ? getReminderLinks(evt) : null;

  return (
    <div style={{
      padding:"12px 20px",
      borderBottom:!isLast?"1px solid rgba(255,255,255,.04)":"none",
      background:evt.isLive?"rgba(239,68,68,.04)":"transparent",
      transition:"background .2s",
    }}
    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
    onMouseLeave={e=>e.currentTarget.style.background=evt.isLive?"rgba(239,68,68,.04)":"transparent"}>
      {/* Teams row */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            {evt.away.logo && <img src={evt.away.logo} alt="" style={{width:20,height:20,objectFit:"contain",flexShrink:0}}/>}
            <span style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{evt.away.name||evt.name}</span>
            {(evt.isLive||evt.isOver)&&<span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:evt.away.winner?"var(--gold)":"var(--text)",marginLeft:"auto",flexShrink:0}}>{evt.away.score}</span>}
          </div>
          {evt.home.name && (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {evt.home.logo && <img src={evt.home.logo} alt="" style={{width:20,height:20,objectFit:"contain",flexShrink:0}}/>}
              <span style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{evt.home.name}</span>
              {(evt.isLive||evt.isOver)&&<span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:evt.home.winner?"var(--gold)":"var(--text)",marginLeft:"auto",flexShrink:0}}>{evt.home.score}</span>}
            </div>
          )}
        </div>
        {/* Status */}
        <div style={{flexShrink:0,textAlign:"right"}}>
          {evt.isLive
            ? <div style={{background:"#ef4444",borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:800,color:"#fff"}}>🔴 LIVE</div>
            : evt.isOver
              ? <div style={{fontSize:10,color:"var(--muted)",fontWeight:700}}>FINAL</div>
              : <div style={{fontSize:11,color:"var(--muted)",fontWeight:600}}>{evt.localTime}</div>
          }
        </div>
      </div>

      {/* Venue + broadcast */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:isUpcoming&&remLinks?8:0}}>
        {evt.venue && <span style={{fontSize:10,color:"var(--muted)"}}>📍 {evt.venue}{evt.city?`, ${evt.city}`:""}</span>}
        {evt.broadcast && <span style={{fontSize:9,background:"rgba(245,158,11,.1)",color:"var(--gold)",borderRadius:4,padding:"1px 6px",fontWeight:700}}>{evt.broadcast}</span>}
      </div>

      {/* Reminder */}
      {isUpcoming && remLinks && (
        !showRem ? (
          <button onClick={()=>setShowRem(true)}
            style={{background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",borderRadius:8,color:"var(--gold)",padding:"4px 12px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
            🔔 Set Reminder
          </button>
        ) : (
          <div className="fadeUp" style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            {[
              {icon:"📅",label:"Google Calendar", action:()=>openLink(remLinks.google)},
              {icon:"🍎",label:"Apple Calendar",  action:()=>downloadICS(evt)},
              {icon:"📧",label:"Outlook",         action:()=>openLink(remLinks.outlook)},
            ].map(cal=>(
              <button key={cal.label} onClick={()=>{cal.action();setShowRem(false);}}
                style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:8,padding:"5px 10px",fontSize:10,fontWeight:700,color:"var(--text)",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                {cal.icon} {cal.label}
              </button>
            ))}
            <button onClick={()=>setShowRem(false)} style={{background:"none",border:"none",color:"var(--muted)",fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
        )
      )}
    </div>
  );
}

// ─── WEEKLY SCHEDULE MODAL ────────────────────────────────────────────────────
function WeeklyScheduleModal({ sportQuery, sportDisplay, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    const sport = getEspnSport(sportQuery);
    if (!sport) { setLoading(false); return; }
    fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport.path}/scoreboard`)
      .then(r=>r.json())
      .then(data=>{
        const evts = (data.events||[]).map(evt=>{
          const comp = evt.competitions?.[0];
          const home = comp?.competitors?.find(c=>c.homeAway==="home")||comp?.competitors?.[0];
          const away = comp?.competitors?.find(c=>c.homeAway==="away")||comp?.competitors?.[1];
          const st = evt.status?.type;
          return {
            id:evt.id, name:evt.name||evt.shortName||"",
            date:evt.date,
            localDate:new Date(evt.date).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),
            localTime:new Date(evt.date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZoneName:"short"}),
            dayKey:new Date(evt.date).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),
            isLive:["STATUS_IN_PROGRESS","STATUS_HALFTIME","STATUS_EXTRA_TIME_IN_PROGRESS","STATUS_EXTRA_TIME_HALF","STATUS_SHOOTOUT_IN_PROGRESS","STATUS_OVERTIME"].includes(st?.name)&&!st?.completed,
            isOver:st?.completed||false,
            periodText:st?.type?.shortDetail||"",
            home:{name:home?.team?.shortDisplayName||home?.team?.displayName||"",score:home?.score??"-",logo:home?.team?.logo||"",color:home?.team?.color||"333",winner:home?.winner},
            away:{name:away?.team?.shortDisplayName||away?.team?.displayName||"",score:away?.score??"-",logo:away?.team?.logo||"",color:away?.team?.color||"333",winner:away?.winner},
            broadcast:comp?.broadcasts?.[0]?.names?.join(", ")||"",
            venue:comp?.venue?.fullName||"",
            city:comp?.venue?.address?.city||"",
            isTitleFight:(evt.name||"").toLowerCase().includes("championship"),
          };
        });
        const g = {};
        evts.forEach(e=>{ if (!g[e.dayKey]) g[e.dayKey]=[]; g[e.dayKey].push(e); });
        setEvents(evts);
        setGrouped(g);
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  },[sportQuery]);

  const upcoming = events.filter(e=>!e.isOver).length;
  const isWC = sportQuery?.toLowerCase().includes("world")||sportQuery?.toLowerCase().includes("fifa");

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1300,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:56,paddingBottom:20,paddingLeft:12,paddingRight:12,overflowY:"auto",backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{
        background:"var(--surface)", borderRadius:18,
        width:"100%", maxWidth:600,
        border:`1px solid ${isWC?"rgba(245,158,11,.4)":"rgba(16,185,129,.3)"}`,
        display:"flex", flexDirection:"column",
        boxShadow:"0 20px 60px rgba(0,0,0,.7)",
      }}>
        <div style={{
          padding:"18px 20px 14px",
          background:isWC?"linear-gradient(135deg,rgba(26,42,10,.9),rgba(13,74,26,.9))":"linear-gradient(135deg,rgba(10,20,10,.9),rgba(13,74,26,.8))",
          borderBottom:`1px solid ${isWC?"rgba(245,158,11,.2)":"rgba(16,185,129,.2)"}`,
          flexShrink:0,
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:isWC?"var(--gold)":"var(--sports)"}}>
                {isWC?"🏆":"📅"} {sportDisplay} — Full Schedule
              </div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>
                {upcoming} upcoming · tap 🔔 on any game to add a reminder
              </div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
        </div>

        <div style={{overflowY:"auto",flex:1}}>
          {loading ? (
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:8}}>
              {[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{height:72,borderRadius:12}}/>)}
            </div>
          ) : events.length===0 ? (
            <div style={{textAlign:"center",padding:"40px 20px",color:"var(--muted)",fontSize:14}}>No games scheduled right now</div>
          ) : (
            Object.entries(grouped).map(([day,dayEvts])=>(
              <div key={day}>
                <div style={{padding:"12px 20px 8px",fontSize:10,fontWeight:800,color:"var(--muted)",letterSpacing:1.5,background:"rgba(255,255,255,.02)",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:8}}>
                  {dayEvts.some(e=>e.isLive)&&<span style={{color:"#ef4444"}}>🔴</span>}
                  {day.toUpperCase()}
                  <span style={{color:"rgba(255,255,255,.2)",fontWeight:400}}>({dayEvts.length} game{dayEvts.length!==1?"s":""})</span>
                </div>
                {dayEvts.map((evt,i)=>(
                  <ScheduleGameRow key={evt.id} evt={evt} isLast={i===dayEvts.length-1}/>
                ))}
              </div>
            ))
          )}
          <div style={{height:20}}/>
        </div>
      </div>
    </div>
  );
}


// ─── OLYMPICS PLACEHOLDER ────────────────────────────────────────────────────
function OlympicsPlaceholder() {
  const LA2028 = new Date("2028-07-14T20:00:00");
  const now = new Date();
  const diff = Math.max(0, LA2028 - now);
  const days  = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const mins  = Math.floor((diff % (1000*60*60)) / (1000*60));

  const SPORTS = [
    {icon:"🏊",name:"Swimming"},     {icon:"🏃",name:"Track & Field"},
    {icon:"🤸",name:"Gymnastics"},   {icon:"🏀",name:"Basketball"},
    {icon:"⚽",name:"Soccer"},       {icon:"🎾",name:"Tennis"},
    {icon:"🚴",name:"Cycling"},      {icon:"🥊",name:"Boxing"},
    {icon:"🏐",name:"Volleyball"},   {icon:"🤼",name:"Wrestling"},
    {icon:"🏋️",name:"Weightlifting"},{icon:"🎿",name:"Skateboarding"},
  ];

  return (
    <div style={{maxWidth:600}}>
      {/* Hero card */}
      <div style={{
        background:"linear-gradient(135deg,#0a0518 0%,#18103a 50%,#0a1628 100%)",
        border:"1.5px solid rgba(139,92,246,.4)",
        borderRadius:20, padding:"24px 20px", marginBottom:16,
        position:"relative", overflow:"hidden",
      }}>
        {/* Glow */}
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(139,92,246,.15)",filter:"blur(60px)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:160,height:160,borderRadius:"50%",background:"rgba(245,158,11,.1)",filter:"blur(50px)",pointerEvents:"none"}}/>

        {/* Olympic rings — proper interlocking SVG (back→front z-order) */}
        <svg viewBox="0 0 240 140" style={{width:"100%",maxWidth:240,marginBottom:16}} xmlns="http://www.w3.org/2000/svg">
          {/* Drawing order: Red, Green, Black, Yellow, Blue (back to front)
              This produces: Blue in front of Yellow, Yellow in front of Black,
              Black in front of Green, Green in front of Red */}
          <circle cx="182" cy="52" r="42" fill="none" stroke="#DF0024" strokeWidth="13"/>
          <circle cx="148" cy="92" r="42" fill="none" stroke="#009F6B" strokeWidth="13"/>
          <circle cx="114" cy="52" r="42" fill="none" stroke="#2d2d2d"  strokeWidth="13"/>
          <circle cx="80"  cy="92" r="42" fill="none" stroke="#F4C300" strokeWidth="13"/>
          <circle cx="48"  cy="52" r="42" fill="none" stroke="#0085C7" strokeWidth="13"/>
        </svg>


        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:99,padding:"3px 12px",fontSize:10,fontWeight:800,color:"#F59E0B",letterSpacing:.8}}>COMING 2028</div>
            <div style={{background:"rgba(0,133,199,.15)",border:"1px solid rgba(0,133,199,.3)",borderRadius:99,padding:"3px 12px",fontSize:10,fontWeight:800,color:"#60A5FA",letterSpacing:.8}}>PEACOCK EXCLUSIVE</div>
          </div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:26,lineHeight:1.1,marginBottom:4}}>
            <span style={{background:"linear-gradient(90deg,#8B5CF6,#C4B5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Los Angeles</span>
            <span style={{color:"var(--text)"}}> 2028</span>
          </div>
          <div style={{fontSize:13,color:"rgba(240,240,250,.6)",marginBottom:20}}>XXXIV Summer Olympic Games · July 14 – July 30, 2028 · Los Angeles, CA</div>

          {/* Countdown */}
          <div style={{display:"flex",gap:12,marginBottom:20}}>
            {[[days,"Days"],[hours,"Hours"],[mins,"Minutes"]].map(([val,label])=>(
              <div key={label} style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",borderRadius:12,padding:"14px 16px",textAlign:"center",flex:1}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:28,color:"#C4B5FD",lineHeight:1}}>{val}</div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontWeight:700,letterSpacing:.8}}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <a href="https://www.peacocktv.com/stream/sports" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#E31837",borderRadius:12,padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:"#fff",textDecoration:"none"}}>
            📺 Watch on Peacock →
          </a>
        </div>
      </div>

      {/* Featured sports */}
      <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(139,92,246,.15)",borderRadius:16,padding:"16px 16px 12px"}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:"#C4B5FD",letterSpacing:.8,marginBottom:14}}>🏅 FEATURED SPORTS · LA 2028</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
          {SPORTS.map(s=>(
            <div key={s.name} style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.15)",borderRadius:10,padding:"10px 8px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>{s.icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:"rgba(240,240,250,.75)"}}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:12,fontSize:11,color:"var(--muted)",textAlign:"center",lineHeight:1.6}}>
        Live scores and schedules will appear here when the Games begin on July 14, 2028.
      </div>
    </div>
  );
}

// ─── SPORT CATEGORY CARDS ────────────────────────────────────────────────────
// ─── SOCCER LEAGUES ──────────────────────────────────────────────────────────
const SOCCER_LEAGUES = [
  { id:"eng.1",          name:"Premier League",     flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", country:"England"     },
  { id:"esp.1",          name:"La Liga",            flag:"🇪🇸", country:"Spain"       },
  { id:"ger.1",          name:"Bundesliga",         flag:"🇩🇪", country:"Germany"     },
  { id:"ita.1",          name:"Serie A",            flag:"🇮🇹", country:"Italy"       },
  { id:"fra.1",          name:"Ligue 1",            flag:"🇫🇷", country:"France"      },
  { id:"uefa.champions", name:"Champions League",   flag:"🏆", country:"Europe"      },
  { id:"uefa.europa",    name:"Europa League",      flag:"🇪🇺", country:"Europe"      },
  { id:"usa.1",          name:"MLS",                flag:"🇺🇸", country:"USA"         },
  { id:"mex.1",          name:"Liga MX",            flag:"🇲🇽", country:"Mexico"      },
  { id:"ned.1",          name:"Eredivisie",         flag:"🇳🇱", country:"Netherlands" },
  { id:"por.1",          name:"Primeira Liga",      flag:"🇵🇹", country:"Portugal"    },
  { id:"sco.1",          name:"Scottish Prem",      flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", country:"Scotland"    },
  { id:"bra.1",          name:"Brasileirão",        flag:"🇧🇷", country:"Brazil"      },
  { id:"arg.1",          name:"Liga Argentina",     flag:"🇦🇷", country:"Argentina"   },
  { id:"eng.2",          name:"Championship",       flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", country:"England 2"   },
  { id:"tur.1",          name:"Süper Lig",          flag:"🇹🇷", country:"Turkey"      },
];

// ─── SPORTS × MOVIES BRIDGE ─────────────────────────────────────────────────
function SportMovieBridge({ activeSport, onSelect }) {
  const [films, setFilms] = useState([]);
  const SPORT_QUERIES = {
    "FIFA World Cup 2026":"soccer documentary",
    "Soccer":"soccer football documentary",
    "NFL":"American football NFL documentary",
    "NBA":"basketball NBA documentary",
    "MLB":"baseball documentary",
    "NHL":"hockey documentary",
    "UFC":"MMA martial arts boxing documentary",
    "WWE":"wrestling documentary",
    "Tennis":"tennis documentary",
    "Golf":"golf documentary",
    "Olympics":"Olympics documentary",
  };
  const sport = activeSport ? Object.keys(SPORT_QUERIES).find(k=>activeSport.includes(k)) : null;
  const query = sport ? SPORT_QUERIES[sport] : null;

  useEffect(()=>{
    if (!query) { setFilms([]); return; }
    fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1`,
      {headers:{Authorization:`Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,"Content-Type":"application/json"}})
      .then(r=>r.json())
      .then(d=>setFilms((d.results||[]).filter(m=>m.poster_path&&(m.vote_average||0)>5).slice(0,8)))
      .catch(()=>{});
  },[query]);

  if (!query||films.length===0) return null;

  return (
    <div style={{marginTop:16,borderRadius:16,background:"rgba(255,255,255,.02)",border:"1px solid rgba(139,92,246,.15)",overflow:"hidden"}}>
      <div style={{padding:"12px 16px 10px",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>🎬</span>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:"#C4B5FD"}}>Watch while you wait</div>
          <div style={{fontSize:10,color:"var(--muted)"}}>Best {sport} films & docs streaming now</div>
        </div>
      </div>
      <div style={{display:"flex",gap:10,overflowX:"auto",padding:"12px 16px 14px",scrollbarWidth:"none"}}>
        {films.map(m=>(
          <div key={m.id} onClick={()=>onSelect&&onSelect({...m,providers:[]})}
            style={{flexShrink:0,width:88,cursor:"pointer",transition:"transform .2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <img src={`https://image.tmdb.org/t/p/w185${m.poster_path}`} alt={m.title||m.name}
              style={{width:88,height:132,objectFit:"cover",borderRadius:10,display:"block",marginBottom:5}}
              onError={e=>e.target.style.display="none"}/>
            <div style={{fontSize:10,fontWeight:700,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
            <div style={{fontSize:9,color:"var(--gold)"}}>★ {(m.vote_average||0).toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoccerHub({ onSearch, favoriteTeams }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{fontSize:22}}>⚽</span>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,color:"#1CE783"}}>Soccer Hub</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>Pick a league for live scores & schedules</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
        {SOCCER_LEAGUES.map(league=>{
          const hasFav = favoriteTeams?.[league.id];
          return (
            <button key={league.id} onClick={()=>onSearch(league.id)}
              style={{
                background:"rgba(26,110,60,.12)",
                border:"1px solid rgba(28,231,131,.2)",
                borderRadius:12, padding:"10px 12px",
                display:"flex",alignItems:"center",gap:10,
                cursor:"pointer", textAlign:"left", transition:"all .2s",
                color:"var(--text)",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(26,110,60,.25)";e.currentTarget.style.borderColor="rgba(28,231,131,.5)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(26,110,60,.12)";e.currentTarget.style.borderColor="rgba(28,231,131,.2)";}}>
              <span style={{fontSize:20,flexShrink:0}}>{league.flag}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{league.name}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>{league.country}</div>
              </div>
              {hasFav && <span style={{fontSize:12,flexShrink:0}}>⭐</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SPORT_CARDS = [
  { label:"💪 WWE",        query:"WWE wrestling",          color:"#CC0000", bg:"rgba(204,0,0,.15)",     service:"Peacock" },
  { label:"🥊 UFC",        query:"UFC mixed martial arts", color:"#D20A0A", bg:"rgba(210,10,10,.15)",   service:"ESPN+" },
  { label:"🏈 NFL",        query:"NFL football",           color:"#013369", bg:"rgba(1,51,105,.2)",     service:"Multi" },
  { label:"🏀 NBA",        query:"NBA basketball",         color:"#C9082A", bg:"rgba(201,8,42,.15)",    service:"Max/ESPN+" },
  { label:"⚾ MLB",        query:"MLB baseball",           color:"#002D72", bg:"rgba(0,45,114,.2)",     service:"Apple TV+" },
  { label:"🏒 NHL",        query:"NHL hockey",             color:"#000000", bg:"rgba(100,100,130,.2)",  service:"ESPN+" },
  { label:"⚽ Soccer",     query:"soccer_hub",             color:"#1A6E3C", bg:"rgba(26,110,60,.2)",    service:"All Leagues" },
  { label:"🏎️ F1",        query:"Formula 1 racing",       color:"#E8002D", bg:"rgba(232,0,45,.15)",    service:"ESPN+" },
  { label:"🏈 College",   query:"college football NCAA",  color:"#FF6B00", bg:"rgba(255,107,0,.15)",   service:"Multi" },
  { label:"🏊 Olympics",   query:"Olympics sports",        color:"#0085C7", bg:"rgba(0,133,199,.15)",   service:"Peacock" },
];

// ─── TEAM NEXT GAME SEARCH ────────────────────────────────────────────────────
const TEAM_SPORT_MAP = [
  {label:"⚽ Soccer / World Cup", path:"soccer/fifa.world", fullTournament:true},
  {label:"⚽ Premier League",     path:"soccer/eng.1"},
  {label:"⚽ La Liga",            path:"soccer/esp.1"},
  {label:"⚽ MLS",                path:"soccer/usa.1"},
  {label:"🏈 NFL",               path:"football/nfl"},
  {label:"🏀 NBA",               path:"basketball/nba"},
  {label:"⚾ MLB",               path:"baseball/mlb"},
  {label:"🏒 NHL",               path:"hockey/nhl"},
  {label:"⚽ Champions League",  path:"soccer/uefa.champions"},
  {label:"🏀 WNBA",             path:"basketball/wnba"},
];

function TeamNextGameSearch({ favoriteTeams }) {
  const [query, setQuery]       = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-show favorite team's next game on mount
  useEffect(() => {
    const favName = Object.values(favoriteTeams||{})[0];
    if (favName && !searched) searchTeam(favName, true);
  }, [favoriteTeams]);

  const searchTeam = async (name, silent=false) => {
    const term = (name||query).trim().toLowerCase();
    if (!term) return;
    if (!silent) setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      // Search across all major sports simultaneously
      const results = await Promise.all(
        TEAM_SPORT_MAP.map(async sp => {
          try {
            let events = [];
            if (sp.fullTournament) {
              const today = new Date();
              const dateStrs = Array.from({length:14},(_,i)=>{
                const d=new Date(today); d.setDate(today.getDate()+i);
                return d.toISOString().slice(0,10).replace(/-/g,"");
              });
              const allRes = await Promise.all(
                dateStrs.map(dt=>fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp.path}/scoreboard?dates=${dt}`)
                  .then(r=>r.ok?r.json():null).catch(()=>null))
              );
              events = allRes.flatMap(d=>(d?.events||[]));
            } else {
              const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp.path}/scoreboard`);
              if (!r.ok) return null;
              const d = await r.json();
              events = d.events||[];
            }
            for (const evt of events) {
              const comp = evt.competitions?.[0];
              const home = comp?.competitors?.find(c=>c.homeAway==="home");
              const away = comp?.competitors?.find(c=>c.homeAway==="away");
              const hn = (home?.team?.displayName||home?.team?.shortDisplayName||"").toLowerCase();
              const an = (away?.team?.displayName||away?.team?.shortDisplayName||"").toLowerCase();
              if (hn.includes(term) || an.includes(term)) {
                const st = evt.status?.type;
                const isOver = st?.completed;
                const isLive = !isOver && ["STATUS_IN_PROGRESS","STATUS_HALFTIME","STATUS_EXTRA_TIME_IN_PROGRESS","STATUS_SHOOTOUT_IN_PROGRESS"].includes(st?.name);
                return {
                  sport: sp.label,
                  name: evt.shortName||evt.name||"",
                  date: new Date(evt.date),
                  localDate: new Date(evt.date).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),
                  localTime: new Date(evt.date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZoneName:"short"}),
                  home: { name:home?.team?.shortDisplayName||"", score:home?.score??"", logo:home?.team?.logo||"", winner:home?.winner },
                  away: { name:away?.team?.shortDisplayName||"", score:away?.score??"", logo:away?.team?.logo||"", winner:away?.winner },
                  venue: comp?.venue?.fullName||"",
                  city: comp?.venue?.address?.city||"",
                  broadcast: comp?.broadcasts?.[0]?.names?.join(", ")||"",
                  isLive, isOver,
                  period: st?.shortDetail||"",
                };
              }
            }
          } catch { return null; }
          return null;
        })
      );

      // Prefer live → upcoming → most recent
      const found = results.filter(Boolean);
      const live    = found.find(e=>e.isLive);
      const upcoming= found.filter(e=>!e.isOver&&!e.isLive).sort((a,b)=>a.date-b.date)[0];
      const finished= found.filter(e=>e.isOver).sort((a,b)=>b.date-a.date)[0];
      setResult(live||upcoming||finished||null);
    } catch {}

    if (!silent) setLoading(false);
  };

  // Flatten all followed teams across sports into quick-buttons
  const allFavTeams = Object.entries(favoriteTeams||{}).flatMap(([sport,v])=>{
    const arr = Array.isArray(v)?v:(v?[v]:[]);
    return arr.map(name=>({sport,name}));
  });

  return (
    <div style={{marginBottom:16,borderRadius:16,background:"rgba(255,255,255,.03)",border:"1px solid rgba(139,92,246,.2)",overflow:"hidden"}}>
      {/* Header + search */}
      <div style={{padding:"14px 16px 12px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:"#C4B5FD",marginBottom:10}}>
          🔍 Find Any Team's Next Game
        </div>
        <div style={{display:"flex",gap:8}}>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&searchTeam(query)}
            placeholder="Search any team — Lakers, Arsenal, Cowboys…"
            style={{flex:1,background:"rgba(255,255,255,.07)",border:"1px solid rgba(139,92,246,.3)",borderRadius:10,color:"var(--text)",padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"var(--font-head)"}}
          />
          <button onClick={()=>searchTeam(query)}
            style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 16px",fontWeight:800,fontSize:13,cursor:"pointer",flexShrink:0}}>
            {loading?"…":"Go"}
          </button>
        </div>
        {/* Favorite team quick buttons — all teams across all sports */}
        {allFavTeams.length>0&&(
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {allFavTeams.map(({sport,name})=>(
              <button key={sport+name} onClick={()=>{setQuery(name);searchTeam(name);}}
                style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:99,color:"var(--gold)",padding:"3px 10px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                ⭐ {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result */}
      {loading && (
        <div style={{padding:"16px",display:"flex",gap:8}}>
          {[1,2,3].map(i=><div key={i} className="skeleton" style={{flex:1,height:60,borderRadius:10}}/>)}
        </div>
      )}
      {!loading && searched && !result && (
        <div style={{padding:"20px 16px",textAlign:"center",color:"var(--muted)",fontSize:13}}>
          No upcoming games found for "<strong>{query}</strong>" — try a different spelling or check back later.
        </div>
      )}
      {!loading && result && (
        <div style={{padding:"14px 16px"}}>
          <div style={{fontSize:10,color:"var(--muted)",fontWeight:700,letterSpacing:1,marginBottom:8}}>{result.sport.toUpperCase()}</div>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            {/* Teams */}
            <div style={{flex:1,minWidth:160}}>
              {[result.away,result.home].map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i===0?6:0}}>
                  {t.logo&&<img src={t.logo} alt="" style={{width:24,height:24,objectFit:"contain"}}/>}
                  <span style={{fontWeight:700,fontSize:14,flex:1}}>{t.name}</span>
                  {(result.isLive||result.isOver)&&<span style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:16,color:t.winner?"var(--gold)":"var(--text)"}}>{t.score}</span>}
                </div>
              ))}
            </div>
            {/* Status */}
            <div style={{flexShrink:0,textAlign:"center",minWidth:100}}>
              {result.isLive
                ? <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.4)",borderRadius:8,padding:"6px 10px",color:"#ef4444",fontWeight:800,fontSize:11}}>🔴 LIVE NOW<br/><span style={{fontSize:10,fontWeight:600}}>{result.period}</span></div>
                : result.isOver
                  ? <div style={{fontSize:11,color:"var(--muted)",fontWeight:700}}>FINAL</div>
                  : <div style={{background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.3)",borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#C4B5FD"}}>{result.localDate}</div>
                      <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{result.localTime}</div>
                      {result.broadcast&&<div style={{fontSize:9,color:"var(--gold)",marginTop:3,fontWeight:700}}>{result.broadcast}</div>}
                    </div>
              }
            </div>
          </div>
          {result.venue&&<div style={{marginTop:8,fontSize:10,color:"var(--muted)"}}>📍 {result.venue}{result.city?`, ${result.city}`:""}</div>}
        </div>
      )}
    </div>
  );
}

function SportCategoryGrid({ onSearch, favoriteTeams }) {
  return (
    <div style={{marginBottom:20}}>
      {/* World Cup Hero Card */}
      <div onClick={()=>onSearch("FIFA World Cup 2026")}
        style={{
          background:"linear-gradient(135deg,#1a2a0a 0%,#0d4a1a 40%,#1a3a0a 100%)",
          border:"2px solid rgba(245,158,11,.5)",
          borderRadius:16, padding:"16px 18px", marginBottom:12,
          cursor:"pointer", position:"relative", overflow:"hidden",
          boxShadow:"0 8px 32px rgba(245,158,11,.15)",
          transition:"all .2s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(245,158,11,.8)";e.currentTarget.style.transform="scale(1.01)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,158,11,.5)";e.currentTarget.style.transform="scale(1)";}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:80,opacity:.1,pointerEvents:"none"}}>🏆</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{background:"#ef4444",borderRadius:99,padding:"2px 8px",fontSize:9,fontWeight:900,color:"#fff",letterSpacing:.8}}>🔴 STARTS JUNE 11</div>
              <div style={{background:"rgba(245,158,11,.2)",borderRadius:99,padding:"2px 8px",fontSize:9,fontWeight:900,color:"var(--gold)",letterSpacing:.8}}>48 TEAMS</div>
            </div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,color:"var(--gold)",lineHeight:1.1}}>🏆 FIFA World Cup 2026</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:4}}>🇺🇸 USA · 🇲🇽 Mexico · 🇨🇦 Canada</div>
          </div>
          <div style={{background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"var(--gold)",fontWeight:700,marginBottom:2}}>LIVE SCORES</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>Pick your team →</div>
          </div>
        </div>
      </div>

      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:"var(--sports)",marginBottom:12,letterSpacing:.5}}>
        🏆 SELECT A SPORT
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {SPORT_CARDS.map(s=>{
          const favV = favoriteTeams?.[s.label];
          const favTeams = Array.isArray(favV)?favV:(favV?[favV]:[]);
          return (
          <button key={s.label} onClick={()=>onSearch(s.query)}
            style={{
              background:s.bg, border:`1px solid ${favTeams.length>0?s.color+"88":s.color+"40"}`,
              borderRadius:14, padding:"12px 14px",
              display:"flex",flexDirection:"column",gap:6,
              cursor:"pointer", textAlign:"left",
              transition:"all .2s",
              boxShadow:favTeams.length>0?`0 0 12px ${s.color}22`:"none",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color;e.currentTarget.style.transform="scale(1.02)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=favTeams.length>0?`${s.color}88`:`${s.color}40`;e.currentTarget.style.transform="scale(1)";}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>{s.service}</div>
              </div>
              <span style={{fontSize:22}}>{s.icon}</span>
            </div>
            {/* Followed teams mini-strip */}
            {favTeams.length>0&&(
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {favTeams.map(name=>{
                  const logo = getTeamLogo(name);
                  return (
                    <div key={name} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.25)",borderRadius:99,padding:"2px 6px 2px 4px"}}>
                      {logo
                        ? <img src={logo} alt={name} style={{width:14,height:14,objectFit:"contain",borderRadius:"50%"}} onError={e=>e.target.style.display="none"}/>
                        : <span style={{fontSize:10}}>⭐</span>
                      }
                      <span style={{fontSize:9,fontWeight:700,color:"var(--gold)",whiteSpace:"nowrap",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis"}}>{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SPORTS TAB HEADER ───────────────────────────────────────────────────────
function SportsTabHeader({ onSearch }) {
  return (
    <div style={{
      background:"linear-gradient(135deg,#0a1628 0%,#1a0a2e 50%,#0a2010 100%)",
      borderRadius:18, padding:"20px 16px", marginBottom:16,
      border:"1px solid rgba(16,185,129,.2)",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"rgba(16,185,129,.1)",filter:"blur(40px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-20,left:-20,width:120,height:120,borderRadius:"50%",background:"rgba(239,68,68,.08)",filter:"blur(30px)",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{fontSize:28}}>🏆</div>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,lineHeight:1,background:"linear-gradient(90deg,#10b981,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Sports Hub</div>
            <div style={{fontSize:11,color:"rgba(240,240,250,.5)",marginTop:2}}>Live scores · Schedules · Where to watch</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
          {["🔴 Live Scores","📅 Schedules","📺 Stream Guide","🥊 WWE & UFC"].map(tag=>(
            <div key={tag} style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.2)",borderRadius:99,padding:"3px 10px",fontSize:10,color:"var(--sports)",fontWeight:700}}>{tag}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SPORTS STREAMING GUIDE ───────────────────────────────────────────────────
const SPORTS_GUIDE = [
  { sport:"WWE",             icon:"💪", services:["peacock"],                        note:"Peacock exclusive — all Raw, SmackDown & PPVs" },
  { sport:"UFC",             icon:"🥊", services:["espnplus"],                       note:"ESPN+ exclusive — all Fight Nights & PPVs" },
  { sport:"NFL",             icon:"🏈", services:["peacock","prime","espnplus","youtubetv","netflix"], note:"Sunday Night: Peacock · Thursday: Prime · Monday: ESPN+" },
  { sport:"NBA",             icon:"🏀", services:["max","espnplus","youtubetv"],      note:"TNT games on Max · ESPN/ABC games on ESPN+" },
  { sport:"MLB",             icon:"⚾", services:["apple","espnplus","peacock"],      note:"Friday Night Baseball: Apple TV+ · Others: ESPN+/Peacock" },
  { sport:"NHL",             icon:"🏒", services:["espnplus","max","peacock"],        note:"ESPN+ · TNT/TBS games on Max · Some on Peacock" },
  { sport:"Premier League",  icon:"⚽", services:["peacock"],                        note:"Peacock exclusive in the US" },
  { sport:"Champions League",icon:"🏆", services:["paramount","peacock"],            note:"Paramount+ & CBS Sports" },
  { sport:"MLS",             icon:"⚽", services:["apple"],                          note:"Apple TV+ exclusive — MLS Season Pass" },
  { sport:"Formula 1",       icon:"🏎️", services:["espnplus","youtubetv"],           note:"ESPN & ESPN+ — all races live" },
  { sport:"College Football", icon:"🏈", services:["espnplus","max","peacock","youtubetv"], note:"Split across ESPN+, ABC, CBS, NBC" },
  { sport:"Boxing / DAZN",   icon:"🥊", services:["dazn"],                           note:"DAZN — major boxing events" },
];


const SERVICES = [
  { id:"netflix",     name:"Netflix",      color:"#E50914", logo:"N",   deal:null,                         url:"https://www.netflix.com/search?q=",          price:17.99 },
  { id:"disney",      name:"Disney+",      color:"#0063E5", logo:"D+",  deal:null,                         url:"https://www.disneyplus.com/search/",          price:13.99 },
  { id:"max",         name:"Max",          color:"#002BE7", logo:"M",   deal:null,                         url:"https://www.max.com/search?q=",              price:16.99 },
  { id:"hulu",        name:"Hulu",         color:"#1CE783", logo:"H",   deal:"2 months free",              url:"https://www.hulu.com/search?q=",             price:17.99 },
  { id:"apple",       name:"Apple TV+",    color:"#555",    logo:"A",   deal:"$2.99/mo first year",        url:"https://tv.apple.com/search?term=",          price:13.99 },
  { id:"prime",       name:"Prime",        color:"#00A8E1", logo:"P",   deal:null,                         url:"https://www.amazon.com/s?k=",                price:8.99  },
  { id:"peacock",     name:"Peacock",      color:"#E81C2E", logo:"Pk",  deal:"50% off annual",             url:"https://www.peacocktv.com/search?q=",        price:10.99 },
  { id:"paramount",   name:"Paramount+",   color:"#0064FF", logo:"P+",  deal:"30-day trial",               url:"https://www.paramountplus.com/search/?q=",   price:8.99  },
  { id:"crunchyroll", name:"Crunchyroll",  color:"#F47521", logo:"CR",  deal:"14-day free trial",          url:"https://www.crunchyroll.com/search?q=",      price:7.99  },
  { id:"espnplus",    name:"ESPN+",        color:"#E31837", logo:"E+",  deal:null,                         url:"https://www.espn.com/espnplus/player/",      price:11.99 },
  { id:"dazn",        name:"DAZN",         color:"#C8A900", logo:"DZ",  deal:"Cancel anytime",             url:"https://www.dazn.com/search?q=",             price:19.99 },
  { id:"fubo",        name:"Fubo",         color:"#FF6B00", logo:"F",   deal:"5-day free trial",           url:"https://www.fubo.tv/welcome",                price:82.99 },
  { id:"youtube",     name:"YouTube",      color:"#FF0000", logo:"YT",  deal:"Free with ads",              url:"https://www.youtube.com/results?search_query=", price:0  },
  { id:"youtubetv",   name:"YouTube TV",   color:"#FF0000", logo:"YTV", deal:"Free trial",                 url:"https://tv.youtube.com/",                    price:72.99 },
  { id:"tubi",        name:"Tubi",         color:"#FA4343", logo:"Tu",  deal:"Always Free! 🎉",            url:"https://tubitv.com/search/",                 price:0     },
];

// ─── SPORTS STREAMING GUIDE COMPONENT ────────────────────────────────────────
function SportsStreamingGuide({ onSearch }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? SPORTS_GUIDE : SPORTS_GUIDE.slice(0, 6);
  return (
    <div style={{
      background:"linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,182,212,.05))",
      border:"1px solid rgba(16,185,129,.2)",
      borderRadius:16, padding:"16px", marginBottom:20,
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:"var(--sports)"}}>📺 Where To Watch Sports</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Click any sport to search</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {shown.map(s=>{
          const svcs = s.services.map(id=>SERVICES.find(sv=>sv.id===id)).filter(Boolean);
          return (
            <div key={s.sport} onClick={()=>onSearch(s.sport)}
              style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"10px 12px",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(16,185,129,.4)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.06)"}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{s.sport}</div>
                    <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{s.note}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",flexShrink:0}}>
                  {svcs.map(sv=>(
                    <div key={sv.id} style={{background:sv.color,borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:900,color:"#fff"}}>{sv.logo}</div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={()=>setExpanded(!expanded)}
        style={{marginTop:10,width:"100%",background:"none",border:"1px solid rgba(16,185,129,.2)",borderRadius:8,color:"var(--sports)",padding:"7px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>
        {expanded ? "Show Less ▲" : `Show All ${SPORTS_GUIDE.length} Sports ▼`}
      </button>
    </div>
  );
}

const CATEGORY_TABS = [
  { id:"top10",    label:"Top 10",    icon:"🔥", color:"#F59E0B",  anim:"flameDance" },
  { id:"movies",   label:"Movies",    icon:"🎬", color:"#06B6D4",  anim:null },
  { id:"tv",       label:"TV Shows",  icon:"📺", color:"#A78BFA",  anim:"tvFlicker" },
  { id:"anime",    label:"Anime",     icon:"✦",  color:"var(--anime)", anim:"swordSwing" },
  { id:"watchlist",label:"Watchlist", icon:"❤️", color:"#ef4444",  anim:null },
];

const GR = [
  ["#1A1030","#8B5CF6"],["#0D1030","#6366f1"],["#180A36","#8B5CF6"],
  ["#1a1000","#F59E0B"],["#1C0C38","#A855F7"],["#0D1030","#8B5CF6"],
  ["#1f1200","#F59E0B"],["#001f0d","#10b981"],["#1a0a0a","#ef4444"],
  ["#1A1030","#8B5CF6"],["#1a1000","#F59E0B"],["#0D1030","#A855F7"],
];
// Safe gradient accessor — always returns a valid pair
const safeGR = (id) => GR[((id||0) % GR.length + GR.length) % GR.length] || GR[0];

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size=32 }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
      <div style={{animation:"logoFloat 3s ease-in-out infinite",display:"flex"}}>
        {!imgError ? (
          <img
            src="/logo-clean.png"
            alt="The StreamHub"
            onError={()=>setImgError(true)}
            style={{
              height: size * 2.8,
              width: "auto",
              objectFit:"contain",
              filter:"drop-shadow(0 0 12px rgba(245,158,11,.5)) drop-shadow(0 0 24px rgba(139,92,246,.3))",
              animation:"logoPulse 2.5s ease-in-out infinite",
            }}
          />
        ) : (
          <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:size*0.65,letterSpacing:"-.02em"}}>
            <span style={{background:"linear-gradient(90deg,#B45309,#F59E0B,#B45309)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>The Stream</span>
            <span style={{background:"linear-gradient(90deg,#8B5CF6,#a855f7,#8B5CF6)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>Hub</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── SERVICE BADGE ────────────────────────────────────────────────────────────
function ServiceBadge({ platformId, small }) {
  const s = SERVICES.find(sv=>sv.id===platformId);
  if (!s) return null;
  return <span style={{background:s.color,color:"#fff",fontFamily:"var(--font-head)",fontWeight:700,fontSize:small?9:11,padding:small?"2px 5px":"3px 8px",borderRadius:6,letterSpacing:.5,whiteSpace:"nowrap"}}>{s.name}</span>;
}

// ─── STAR PICKER ──────────────────────────────────────────────────────────────
function StarPicker({ value, onChange, size=18, readOnly=false }) {
  const [hover, setHover] = useState(0);
  const display = hover||value;
  return (
    <div style={{display:"flex",gap:2}}>
      {Array.from({length:10},(_,i)=>i+1).map(s=>(
        <span key={s} onClick={()=>!readOnly&&onChange(s)}
          onMouseEnter={()=>!readOnly&&setHover(s)} onMouseLeave={()=>!readOnly&&setHover(0)}
          style={{fontSize:size,cursor:readOnly?"default":"pointer",color:s<=display?"#F59E0B":"rgba(255,255,255,0.15)",display:"inline-block",transform:(!readOnly&&hover===s)?"scale(1.3)":"scale(1)",transition:"all .12s",lineHeight:1}}>★</span>
      ))}
    </div>
  );
}

// ─── STREAK TRACKER ──────────────────────────────────────────────────────────
function getStreak() {
  try {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const data = JSON.parse(localStorage.getItem("streamhub_streak")||"{}");
    if (data.lastVisit===today) return data.streak||1;
    const streak = data.lastVisit===yesterday ? (data.streak||1)+1 : 1;
    localStorage.setItem("streamhub_streak", JSON.stringify({lastVisit:today,streak}));
    return streak;
  } catch { return 1; }
}

function getStreakEmoji(streak) {
  if (streak>=30) return "🏆";
  if (streak>=14) return "🔥";
  if (streak>=7)  return "⚡";
  if (streak>=3)  return "✨";
  return "🌱";
}

// ─── SHARE HELPERS ────────────────────────────────────────────────────────────
async function nativeShare(title, text, url) {
  if (navigator.share) {
    try { await navigator.share({title, text, url}); return true; }
    catch(e) { return false; }
  }
  return false;
}

function getShareLinks(text, url) {
  const encoded = encodeURIComponent(text+" "+url);
  return {
    twitter:   `https://twitter.com/intent/tweet?text=${encoded}`,
    facebook:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    whatsapp:  `https://wa.me/?text=${encoded}`,
    reddit:    `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  };
}

function ShareModal({ title, text, url, onClose }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = url || "https://thestreamhub.app";
  const links = getShareLinks(text, fullUrl);

  const copyLink = () => {
    navigator.clipboard?.writeText(fullUrl+"\n\n"+text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  const tryNativeShare = async () => {
    const shared = await nativeShare(title, text, fullUrl);
    if (shared) onClose();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1400,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:500,border:"1px solid var(--border)",borderBottom:"none",boxShadow:"0 -20px 60px rgba(0,0,0,.6)",overflow:"hidden"}}>
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17}}>Share</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,color:"var(--muted)",width:28,height:28,fontSize:14,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{text}</div>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
          {/* Native share on mobile */}
          {"share" in navigator && (
            <button onClick={tryNativeShare}
              style={{background:"linear-gradient(135deg,var(--purple),#7C3AED)",border:"none",borderRadius:12,color:"#fff",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              📤 Share via Phone
            </button>
          )}
          {/* Platform buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"𝕏 Twitter / X",     href:links.twitter,  color:"#000",   text:"#fff"},
              {label:"💬 WhatsApp",         href:links.whatsapp, color:"#25D366",text:"#fff"},
              {label:"👾 Reddit",           href:links.reddit,   color:"#FF4500",text:"#fff"},
              {label:"📘 Facebook",         href:links.facebook, color:"#1877F2",text:"#fff"},
            ].map(p=>(
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
                style={{background:p.color,borderRadius:10,padding:"10px 0",textAlign:"center",fontSize:12,fontWeight:700,color:p.text,textDecoration:"none",display:"block"}}>
                {p.label}
              </a>
            ))}
          </div>
          {/* Copy link */}
          <button onClick={copyLink}
            style={{background:copied?"rgba(16,185,129,.15)":"rgba(255,255,255,.05)",border:`1px solid ${copied?"rgba(16,185,129,.4)":"var(--border)"}`,borderRadius:10,color:copied?"var(--sports)":"var(--muted)",padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
            {copied?"✅ Copied!":"🔗 Copy Link"}
          </button>
        </div>
        <div style={{height:16}}/>
      </div>
    </div>
  );
}

// ─── DAILY PICK BANNER ────────────────────────────────────────────────────────
function DailyPickBanner({ movie, onSelect, onShare }) {
  if (!movie) return null;
  const dayOfYear = Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/(1000*60*60*24));
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const provider = movie.providers?.[0];
  const svc = SERVICES.find(s=>s.id===provider);

  return (
    <div style={{margin:"0 14px 16px",borderRadius:16,overflow:"hidden",background:"linear-gradient(135deg,rgba(139,92,246,.2),rgba(6,182,212,.12))",border:"1px solid rgba(139,92,246,.35)",position:"relative",cursor:"pointer"}}
      onClick={()=>onSelect(movie)}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.3)"}}/>
      {poster&&<img src={poster} alt="" style={{position:"absolute",right:0,top:0,height:"100%",width:120,objectFit:"cover",maskImage:"linear-gradient(to left,rgba(0,0,0,.6),transparent)",WebkitMaskImage:"linear-gradient(to left,rgba(0,0,0,.6),transparent)"}}/>}
      <div style={{position:"relative",padding:"14px 16px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <div style={{background:"var(--purple)",borderRadius:99,padding:"3px 10px",fontSize:9,fontWeight:900,color:"#fff",letterSpacing:.8}}>🎯 TODAY'S PICK — DAY {dayOfYear}</div>
          {svc&&<div style={{background:svc.color,borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:800,color:"#fff"}}>{svc.name}</div>}
        </div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,marginBottom:4,maxWidth:"75%"}}>{movie.title||movie.name}</div>
        <div style={{fontSize:11,color:"rgba(240,240,250,.6)",marginBottom:10,maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{movie.overview?.slice(0,80)}...</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700}}>▶ Watch Now</div>
          <button onClick={e=>{e.stopPropagation();onShare(movie);}}
            style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,color:"var(--text)",cursor:"pointer"}}>
            📤 Share
          </button>
          <div style={{marginLeft:"auto",color:"var(--gold)",fontSize:13,fontWeight:700}}>★ {movie.vote_average?.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
// ─── TOP 10 TRENDING SECTION ──────────────────────────────────────────────────
function Top10TrendingSection({ movies, onSelect, userSubs }) {
  if (!movies || movies.length === 0) return (
    <div style={{padding:"40px 0",display:"flex",flexDirection:"column",gap:12}}>
      {Array.from({length:5}).map((_,i)=>(
        <div key={i} className="skeleton" style={{height:88,borderRadius:14}}/>
      ))}
    </div>
  );

  const top10 = movies.slice(0, 10);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {top10.map((movie, idx) => {
        const rank = idx + 1;
        const title = movie.title || movie.name || "";
        const year = (movie.release_date || movie.first_air_date || "").slice(0,4);
        const isTV = !!movie.first_air_date;
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
        const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null;
        const providers = movie.providers || [];
        const subs = SERVICES.filter(s => providers.includes(s.id) && userSubs.includes(s.id));
        const others = SERVICES.filter(s => providers.includes(s.id) && !userSubs.includes(s.id));

        return (
          <div key={movie.id} onClick={() => onSelect(movie)}
            style={{
              display:"flex", alignItems:"center", gap:12,
              background:"rgba(255,255,255,.03)",
              border:"1px solid rgba(255,255,255,.06)",
              borderRadius:14, padding:"10px 14px",
              cursor:"pointer", transition:"all .2s",
              position:"relative", overflow:"hidden",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.07)";e.currentTarget.style.borderColor="rgba(139,92,246,.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.03)";e.currentTarget.style.borderColor="rgba(255,255,255,.06)";}}>

            {/* Rank number */}
            <div style={{
              fontFamily:"var(--font-head)", fontWeight:900,
              fontSize: rank <= 3 ? 36 : 28,
              color: rank===1 ? "#F59E0B" : rank===2 ? "#C0C0C0" : rank===3 ? "#CD7F32" : "rgba(255,255,255,.15)",
              minWidth: rank <= 9 ? 36 : 46,
              textAlign:"center", flexShrink:0, lineHeight:1,
              textShadow: rank <= 3 ? `0 0 20px currentColor` : "none",
            }}>
              {rank}
            </div>

            {/* Poster */}
            {poster
              ? <img src={poster} alt={title} style={{width:46,height:69,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
              : <div style={{width:46,height:69,borderRadius:8,background:"rgba(139,92,246,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🎬</div>
            }

            {/* Info */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {year && <span style={{fontSize:11,color:"var(--muted)"}}>{year}</span>}
                <span style={{fontSize:10,background:isTV?"rgba(139,92,246,.2)":"rgba(6,182,212,.15)",color:isTV?"#C4B5FD":"#67E8F9",borderRadius:4,padding:"1px 6px",fontWeight:700}}>{isTV?"TV":"Movie"}</span>
                {rating && <span style={{fontSize:11,color:"#F59E0B",fontWeight:700}}>★ {rating}</span>}
              </div>
              {/* Streaming badges */}
              {providers.length > 0 && (
                <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                  {subs.slice(0,3).map(s=>(
                    <div key={s.id} style={{background:s.color,borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:800,color:"#fff"}}>{s.logo}</div>
                  ))}
                  {others.slice(0,subs.length>0?1:3).map(s=>(
                    <div key={s.id} style={{background:"rgba(255,255,255,.1)",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:600,color:"var(--muted)"}}>{s.name}</div>
                  ))}
                  {subs.length===0 && others.length===0 && (
                    <span style={{fontSize:10,color:"var(--muted)"}}>Not on streaming</span>
                  )}
                </div>
              )}
            </div>

            {/* Arrow */}
            <span style={{color:"var(--muted)",fontSize:16,flexShrink:0}}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── ONBOARDING MODAL ─────────────────────────────────────────────────────────
function OnboardingModal({ onFinish }) {
  const [step, setStep] = useState(0);
  const [demoMood, setDemoMood] = useState(null);

  const STEPS = [
    {
      id: "welcome",
      icon: "🎬",
      color: "#8B5CF6",
      title: "Welcome to StreamHub",
      subtitle: "The smarter way to find what to watch",
      content: null,
    },
    {
      id: "mood",
      icon: "🎭",
      color: "#A855F7",
      title: "Tell AI your vibe",
      subtitle: "Describe any mood — AI finds the perfect match in seconds. Completely free.",
      content: "mood",
    },
    {
      id: "sports",
      icon: "🏆",
      color: "#10B981",
      title: "Live sports + streaming, together",
      subtitle: "World Cup scores, team schedules, and reminders — right alongside your shows.",
      content: "sports",
    },
    {
      id: "personal",
      icon: "✦",
      color: "#F59E0B",
      title: "Gets smarter over time",
      subtitle: "Rate what you watch. The more you rate, the better your For You picks get.",
      content: "personal",
    },
  ];

  const DEMO_MOODS = [
    { label: "Something scary 😱",     result: "Hereditary (2018) — A24's most terrifying film. On Max." },
    { label: "Perfect date night 💕",  result: "When Harry Met Sally (1989) — timeless comfort. On Tubi free." },
    { label: "Mind-bending sci-fi 🌌", result: "Annihilation (2018) — unforgettable and strange. On Paramount+." },
    { label: "Feel-good & funny 😂",   result: "The Grand Budapest Hotel (2014) — pure joy. On Max." },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("streamhub_onboarded", "1");
      onFinish();
    } else {
      setDemoMood(null);
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:2000,
      background:"rgba(0,0,0,.92)", backdropFilter:"blur(16px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, animation:"fadeIn .3s ease",
    }}>
      <div style={{
        background:"var(--surface)", borderRadius:24,
        width:"100%", maxWidth:480,
        border:`1px solid ${current.color}44`,
        boxShadow:`0 0 60px ${current.color}22, 0 40px 80px rgba(0,0,0,.6)`,
        overflow:"hidden", transition:"border-color .4s",
      }}>

        {/* Progress bar */}
        <div style={{height:3, background:"rgba(255,255,255,.06)"}}>
          <div style={{height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${current.color},${current.color}cc)`, borderRadius:99, transition:"width .4s ease"}}/>
        </div>

        {/* Step dots */}
        <div style={{display:"flex", justifyContent:"center", gap:6, paddingTop:16}}>
          {STEPS.map((_,i) => (
            <div key={i} style={{
              width: i===step?20:6, height:6, borderRadius:99,
              background: i<=step ? current.color : "rgba(255,255,255,.12)",
              transition:"all .3s ease",
            }}/>
          ))}
        </div>

        {/* Content */}
        <div style={{padding:"24px 28px 28px"}}>
          {/* Icon */}
          <div style={{
            width:64, height:64, borderRadius:18,
            background:`${current.color}18`, border:`1.5px solid ${current.color}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:30, marginBottom:18,
            boxShadow:`0 8px 24px ${current.color}22`,
          }}>
            {current.icon}
          </div>

          {/* Title & subtitle */}
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,marginBottom:8,lineHeight:1.2}}>{current.title}</div>
          <div style={{fontSize:14,color:"rgba(240,240,250,.65)",lineHeight:1.6,marginBottom:20}}>{current.subtitle}</div>

          {/* Step-specific content */}
          {current.content === "mood" && (
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,marginBottom:10}}>TRY IT — TAP A VIBE:</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {DEMO_MOODS.map((m,i) => (
                  <button key={i} onClick={()=>setDemoMood(demoMood===i?null:i)}
                    style={{
                      background:demoMood===i?"rgba(139,92,246,.2)":"rgba(255,255,255,.04)",
                      border:`1px solid ${demoMood===i?"rgba(139,92,246,.6)":"rgba(255,255,255,.1)"}`,
                      borderRadius:10, padding:"9px 14px",
                      color: demoMood===i?"#C4B5FD":"var(--text)",
                      fontSize:13, fontWeight:600, cursor:"pointer",
                      textAlign:"left", transition:"all .2s",
                    }}>
                    {m.label}
                    {demoMood===i && (
                      <div className="fadeUp" style={{marginTop:8,fontSize:12,color:"#C4B5FD",borderTop:"1px solid rgba(139,92,246,.2)",paddingTop:8,fontWeight:700}}>
                        ✦ AI picked: {m.result}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.content === "sports" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {icon:"🔴",label:"Live Scores",desc:"World Cup, NFL, NBA, MLB and more"},
                {icon:"🔔",label:"Game Reminders",desc:"Add any game to your calendar"},
                {icon:"⭐",label:"Follow Teams",desc:"Your teams highlighted across all sports"},
                {icon:"🎬",label:"Sports + Movies",desc:"Watch docs while your team rests"},
              ].map((f,i)=>(
                <div key={i} style={{background:"rgba(16,185,129,.07)",border:"1px solid rgba(16,185,129,.2)",borderRadius:12,padding:"10px 12px"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{f.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{f.label}</div>
                  <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.4}}>{f.desc}</div>
                </div>
              ))}
            </div>
          )}

          {current.content === "personal" && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"⭐",label:"Rate what you watch",desc:"Tap stars after any movie or show"},
                  {icon:"❤️",label:"Build your Watchlist",desc:"Save titles to watch later"},
                  {icon:"✦",label:"For You gets smarter",desc:"AI learns your taste from every rating"},
                  {icon:"🚨",label:"Leaving Soon alerts",desc:"7-day free trial — know before it's gone"},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<3?"1px solid rgba(255,255,255,.05)":"none"}}>
                    <div style={{width:32,height:32,borderRadius:8,background:"rgba(245,158,11,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{f.icon}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{f.label}</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <button onClick={handleNext}
            style={{
              width:"100%", background:`linear-gradient(135deg,${current.color},${current.color}cc)`,
              border:"none", borderRadius:14, color:"#fff",
              padding:"14px 0", fontFamily:"var(--font-head)",
              fontWeight:900, fontSize:15, cursor:"pointer",
              boxShadow:`0 8px 24px ${current.color}44`,
              transition:"all .2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".9"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            {isLast ? "🚀 Let's go — pick my services" : step===1&&demoMood===null ? "Next →" : "Next →"}
          </button>

          {step > 0 && (
            <button onClick={()=>{setStep(s=>s-1);setDemoMood(null);}}
              style={{width:"100%",background:"none",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer",marginTop:8,padding:"6px 0"}}>
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COOKIE / GDPR CONSENT BANNER ────────────────────────────────────────────
function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem("streamhub_consent"); }
    catch { return false; }
  });
  const [showMore, setShowMore] = useState(false);

  const accept = () => {
    try { localStorage.setItem("streamhub_consent", "accepted"); } catch {}
    setVisible(false);
  };
  const decline = () => {
    try { localStorage.setItem("streamhub_consent", "declined"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:9999,
      background:"rgba(26,16,48,.97)", backdropFilter:"blur(20px)",
      borderTop:"1px solid rgba(139,92,246,.3)",
      boxShadow:"0 -8px 40px rgba(0,0,0,.6)",
      padding:"16px 20px",
      animation:"fadeIn .3s ease",
    }}>
      <div style={{maxWidth:900, margin:"0 auto"}}>
        {!showMore ? (
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:260}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:4}}>
                🍪 We use cookies & data
              </div>
              <div style={{fontSize:12,color:"rgba(240,240,250,.65)",lineHeight:1.5}}>
                We save your preferences, watch history, and usage data to personalise your experience.
                {" "}<button onClick={()=>setShowMore(true)} style={{background:"none",border:"none",color:"var(--purple)",fontSize:12,cursor:"pointer",padding:0,textDecoration:"underline",fontWeight:700}}>More info</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={decline}
                style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"rgba(240,240,250,.6)",padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Decline
              </button>
              <button onClick={accept}
                style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 22px",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(139,92,246,.4)"}}>
                I Agree ✓
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:10}}>What data we collect</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10,marginBottom:14}}>
              {[
                {icon:"🔐",title:"Account data",desc:"Email and username stored securely via Supabase. Required to use the app.",required:true},
                {icon:"📺",title:"Watch activity",desc:"Your watchlist, ratings, and watch history to personalise recommendations.",required:true},
                {icon:"🏆",title:"Favourite teams",desc:"Sports teams you follow, synced across your devices.",required:true},
                {icon:"📊",title:"Analytics",desc:"Anonymous usage data (pages visited, features used) via Google Analytics to improve the app.",required:false},
              ].map(item=>(
                <div key={item.title} style={{background:"rgba(255,255,255,.04)",border:`1px solid rgba(255,255,255,.07)`,borderRadius:10,padding:"10px 12px",display:"flex",gap:10}}>
                  <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                      {item.title}
                      {item.required
                        ? <span style={{fontSize:9,background:"rgba(239,68,68,.2)",color:"#ef4444",borderRadius:99,padding:"1px 5px",fontWeight:800}}>REQUIRED</span>
                        : <span style={{fontSize:9,background:"rgba(139,92,246,.2)",color:"#c4b5fd",borderRadius:99,padding:"1px 5px",fontWeight:800}}>OPTIONAL</span>
                      }
                    </div>
                    <div style={{fontSize:11,color:"rgba(240,240,250,.55)",marginTop:2,lineHeight:1.4}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"rgba(240,240,250,.4)",marginBottom:12}}>
              We never sell your data. You can delete your account and all associated data at any time from your profile settings.
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={decline}
                style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"rgba(240,240,250,.6)",padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Decline optional data
              </button>
              <button onClick={accept}
                style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 22px",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(139,92,246,.4)"}}>
                Accept all & continue ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[]);
  return <div style={{position:"fixed",bottom:24,right:24,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"12px 20px",zIndex:2000,fontWeight:600,fontSize:14,boxShadow:"0 12px 32px rgba(0,0,0,.5)",animation:"slideRight .3s cubic-bezier(.22,1,.36,1) both",display:"flex",alignItems:"center",gap:10}}><span style={{color:"var(--gold)",fontSize:16}}>✦</span>{msg}</div>;
}

// ─── MOVIE CARD ───────────────────────────────────────────────────────────────
function MovieCard({ movie, watchlist, userRatings, userSubs, onSelect, onToggleWatchlist }) {
  const [hov, setHov] = useState(false);
  const gr = safeGR(movie.id);
  const inWL = watchlist.includes(movie.id);
  const providers = movie.providers || [];
  const mainProvider = providers[0];
  const notSub = mainProvider && userSubs.length > 0 && !userSubs.includes(mainProvider);
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const rating = movie.vote_average ? (movie.vote_average).toFixed(1) : "—";
  const accent = movie.category === "anime" ? "var(--anime)" : movie.category === "tv" ? "var(--purple)" : "var(--gold)";

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onSelect(movie)}
      style={{borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",position:"relative",
        border:`1px solid ${hov?accent:"var(--border)"}`,
        transform:hov?"translateY(-4px) scale(1.015)":"translateY(0) scale(1)",
        transition:"all .25s cubic-bezier(.22,1,.36,1)",
        boxShadow:hov?"0 20px 40px rgba(0,0,0,.5)":"0 4px 12px rgba(0,0,0,.3)",
        filter:notSub?"brightness(0.6) saturate(0.5)":"none",
        background:"var(--card)",
        WebkitTapHighlightColor:"transparent",
        touchAction:"manipulation",
      }}>      {/* Poster */}
      <div style={{height:200,position:"relative",overflow:"hidden",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
        {poster
          ? <img src={poster} alt={movie.title||movie.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy" />
          : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,opacity:.15,fontFamily:"var(--font-head)",fontWeight:800,color:"#fff"}}>{(movie.title||movie.name||"").slice(0,2).toUpperCase()}</div>
        }
        {hov && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}}><div style={{width:46,height:46,borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,marginLeft:3}}>▶</span></div></div>}
        {notSub && <div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,.8)",borderRadius:6,padding:"3px 7px",fontSize:10,color:"var(--muted)",fontWeight:600}}>NOT SUBSCRIBED</div>}
        <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}}
          style={{position:"absolute",top:8,right:8,background:inWL?"var(--gold)":"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:30,height:30,fontSize:14,color:inWL?"#000":"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
          {inWL?"♥":"♡"}
        </button>
        {providers.length > 0 && (
          <div style={{position:"absolute",bottom:8,left:8,display:"flex",gap:4,flexWrap:"wrap"}}>
            {providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small />)}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{padding:"10px 12px 12px"}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{movie.title||movie.name}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:"var(--muted)"}}>{(movie.release_date||movie.first_air_date||"").slice(0,4)}</span>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{color:accent,fontSize:12}}>★</span>
            <span style={{fontSize:12,fontWeight:600}}>{rating}</span>
            {userRatings[movie.id] && <span style={{fontSize:10,color:"var(--cyan)",marginLeft:4}}>You:{userRatings[movie.id]}★</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, showToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inp = {background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",width:"100%",fontSize:14,outline:"none",fontFamily:"var(--font-body)"};

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ username } } });
        if (error) throw error;
        showToast("Account created! Check your email to verify. ✉️");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("Welcome back! 👋");
        onClose();
      }
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:420,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <Logo size={28} />
            <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20}}>✕</button>
          </div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6}}>{mode==="login"?"Welcome back":"Create account"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>{mode==="login"?"Sign in to sync your watchlist & reviews":"Join StreamHub — it's free"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {mode==="signup" && <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" style={inp} />}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={inp} />
          </div>
          {err && <div style={{color:"var(--danger)",fontSize:12,marginBottom:12}}>{err}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<span style={{display:"inline-block",width:18,height:18,border:"2px solid #000",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:null}
            {mode==="login"?"Sign In":"Create Account"}
          </button>
          <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"var(--muted)"}}>
            {mode==="login"?"Don't have an account?":"Already have an account?"}
            <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}} style={{background:"none",border:"none",color:"var(--gold)",fontWeight:700,fontSize:13,marginLeft:6}}>{mode==="login"?"Sign Up":"Sign In"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
// ─── STREAK AVATAR ────────────────────────────────────────────────────────────
function StreakAvatar({ streak, profile, user, size=80 }) {
  const lvl = streak>=30?"legend":streak>=14?"champion":streak>=7?"warrior":streak>=3?"loyal":"newcomer";
  const cfg = {
    newcomer: {ring:"rgba(139,92,246,.4)",  glow:"none",                              badge:"🌱", label:"Newcomer",   color:"#8B5CF6", anim:false},
    loyal:    {ring:"rgba(139,92,246,.85)", glow:"0 0 18px rgba(139,92,246,.5)",      badge:"✨", label:"Loyal Viewer",color:"#C4B5FD", anim:false},
    warrior:  {ring:"rgba(245,158,11,.9)",  glow:"0 0 24px rgba(245,158,11,.55)",     badge:"⚡", label:"Week Warrior", color:"#F59E0B", anim:true},
    champion: {ring:"rgba(239,68,68,.9)",   glow:"0 0 28px rgba(239,68,68,.5)",       badge:"🔥", label:"Binge Champ", color:"#EF4444", anim:true},
    legend:   {ring:"rgba(245,158,11,1)",   glow:"0 0 36px rgba(245,158,11,.7)",      badge:"👑", label:"Legend",      color:"#F59E0B", anim:true},
  }[lvl];
  const initials = (profile?.username||user?.email||"?")[0].toUpperCase();
  const fs = Math.round(size*0.38);
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      {/* Animated glow ring */}
      <div style={{position:"absolute",inset:-3,borderRadius:"50%",border:`2.5px solid ${cfg.ring}`,boxShadow:cfg.glow,animation:cfg.anim?"spinRing 4s linear infinite":undefined,zIndex:0}}/>
      {/* Second ring for legend */}
      {lvl==="legend"&&<div style={{position:"absolute",inset:-7,borderRadius:"50%",border:"1.5px solid rgba(245,158,11,.35)",animation:"spinRing 8s linear infinite reverse",zIndex:0}}/>}
      {/* Avatar circle */}
      <div style={{position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",zIndex:1,background:"var(--surface)"}}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${cfg.ring},rgba(26,16,48,.9))`,fontFamily:"var(--font-head)",fontWeight:900,fontSize:fs,color:"#fff"}}>{initials}</div>
        }
      </div>
      {/* Level badge */}
      <div style={{position:"absolute",bottom:-2,right:-2,width:Math.round(size*0.32),height:Math.round(size*0.32),borderRadius:"50%",background:"var(--bg)",border:`2px solid ${cfg.ring}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.16),zIndex:2}}>
        {cfg.badge}
      </div>
    </div>
  );
}

// ─── STREAK REWARDS MODAL ─────────────────────────────────────────────────────
function StreakRewardsModal({ streak, onClose }) {
  const TIERS = [
    {days:1,  badge:"🌱", title:"Newcomer",     reward:"Your journey begins. Welcome to StreamHub!", color:"#8B5CF6", earned:streak>=1},
    {days:3,  badge:"✨", title:"Loyal Viewer",  reward:"You've built a habit. Personalized picks are sharpening.",color:"#A78BFA",earned:streak>=3},
    {days:7,  badge:"⚡", title:"Week Warrior",  reward:"7 days straight! Your avatar frame unlocks a gold ring.",color:"#F59E0B",earned:streak>=7},
    {days:14, badge:"🔥", title:"Binge Champion", reward:"Two weeks! Your profile glows red — true dedication.",   color:"#EF4444",earned:streak>=14},
    {days:30, badge:"👑", title:"StreamHub Legend",reward:"30 days. You've earned the crown. Rotating gold ring activated.", color:"#F59E0B",earned:streak>=30},
  ];
  const current = [...TIERS].reverse().find(t=>streak>=t.days) || TIERS[0];
  const next    = TIERS.find(t=>streak<t.days);
  const pct     = next ? Math.round((streak/next.days)*100) : 100;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1400,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60,paddingBottom:20,paddingLeft:12,paddingRight:12,overflowY:"auto",backdropFilter:"blur(12px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:420,overflow:"hidden",border:"1px solid rgba(139,92,246,.4)",boxShadow:"0 20px 60px rgba(139,92,246,.3)"}}>
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#1A1030,#0F082A)",padding:"20px 20px 16px",borderBottom:"1px solid rgba(139,92,246,.2)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18}}>🔥 Viewing Streak</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,color:"var(--muted)",width:28,height:28,fontSize:14,cursor:"pointer"}}>✕</button>
          </div>
          {/* Level previews */}
          <div style={{display:"flex",gap:10,marginBottom:14,justifyContent:"center"}}>
            {[
              {streak:1,  badge:"🌱",label:"New",    days:"Day 1"},
              {streak:3,  badge:"✨",label:"Loyal",  days:"Day 3"},
              {streak:7,  badge:"⚡",label:"Warrior",days:"Day 7"},
              {streak:14, badge:"🔥",label:"Champ",  days:"Day 14"},
              {streak:30, badge:"👑",label:"Legend", days:"Day 30"},
            ].map(t=>{
              const earned=streak>=t.streak;
              const lvl=t.streak>=30?"legend":t.streak>=14?"champion":t.streak>=7?"warrior":t.streak>=3?"loyal":"newcomer";
              const colors={newcomer:"#8B5CF6",loyal:"#C4B5FD",warrior:"#F59E0B",champion:"#EF4444",legend:"#F59E0B"}[lvl];
              return (
                <div key={t.streak} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,opacity:earned?1:.4}}>
                  <div style={{width:44,height:44,borderRadius:"50%",border:`2.5px solid ${colors}`,boxShadow:earned?`0 0 12px ${colors}66`:"none",background:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,position:"relative"}}>
                    {t.badge}
                    {streak===t.streak&&<div style={{position:"absolute",inset:-4,borderRadius:"50%",border:`2px solid ${colors}`,animation:"spinRing 3s linear infinite"}}/>}
                  </div>
                  <div style={{fontSize:8,color:earned?colors:"var(--muted)",fontWeight:800,letterSpacing:.5}}>{t.days}</div>
                  <div style={{fontSize:9,color:"rgba(240,240,250,.5)",fontWeight:600}}>{t.label}</div>
                </div>
              );
            })}
          </div>

          {/* Current streak display */}
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:48,lineHeight:1,background:`linear-gradient(135deg,${current.color},#fff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{streak}</div>
              <div style={{fontSize:10,color:"var(--muted)",fontWeight:700,letterSpacing:.8}}>DAY{streak!==1?"S":""}</div>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:20}}>{current.badge}</span>
                <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,color:current.color}}>{current.title}</span>
              </div>
              <div style={{fontSize:11,color:"rgba(240,240,250,.6)",lineHeight:1.5,maxWidth:200}}>{current.reward}</div>
            </div>
          </div>
          {/* Progress to next tier */}
          {next && (
            <div style={{marginTop:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--muted)",marginBottom:5}}>
                <span>Next: {next.badge} {next.title}</span>
                <span>{streak} / {next.days} days</span>
              </div>
              <div style={{height:6,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:`linear-gradient(90deg,#8B5CF6,${next.color})`,transition:"width .6s ease"}}/>
              </div>
              <div style={{fontSize:10,color:"rgba(240,240,250,.4)",marginTop:4}}>{next.days-streak} more day{next.days-streak!==1?"s":""} to unlock {next.badge} {next.title}</div>
            </div>
          )}
          {!next && <div style={{marginTop:10,fontSize:12,color:"var(--gold)",fontWeight:700}}>👑 Maximum level reached. You are a StreamHub Legend.</div>}
        </div>
        {/* All milestones */}
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:10,fontWeight:800,color:"var(--muted)",letterSpacing:1.2,marginBottom:2}}>ALL MILESTONES</div>
          {TIERS.map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,background:t.earned?"rgba(139,92,246,.08)":"rgba(255,255,255,.02)",border:`1px solid ${t.earned?t.color+"44":"rgba(255,255,255,.06)"}`,opacity:t.earned?1:.55}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:t.earned?`${t.color}22`:"rgba(255,255,255,.05)",border:`2px solid ${t.earned?t.color:"rgba(255,255,255,.1)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {t.earned?t.badge:"🔒"}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:t.earned?t.color:"var(--muted)"}}>{t.title}</span>
                  <span style={{fontSize:9,background:"rgba(255,255,255,.06)",borderRadius:99,padding:"1px 6px",color:"var(--muted)",fontWeight:700}}>Day {t.days}</span>
                  {t.earned&&<span style={{fontSize:9,background:`${t.color}22`,borderRadius:99,padding:"1px 6px",color:t.color,fontWeight:800}}>EARNED ✓</span>}
                </div>
                <div style={{fontSize:11,color:"rgba(240,240,250,.5)",marginTop:2,lineHeight:1.4}}>{t.reward}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"0 16px 16px",fontSize:11,color:"var(--muted)",textAlign:"center",lineHeight:1.6}}>
          Come back every day to keep your streak alive. Missing a day resets your progress.
        </div>
      </div>
    </div>
  );
}

// ─── MANAGE SUBSCRIPTIONS PANEL ───────────────────────────────────────────────
function SubscriptionManagerPanel({ userSubs: initialSubs=[], onToggle, onDone }) {
  const [localSubs, setLocalSubs] = useState(initialSubs);
  const toggleLocal = (id) => setLocalSubs(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const handleDone = () => { onToggle(localSubs); onDone(); };

  // Use price directly from SERVICES (already defined on each service object)
  const subList = SERVICES.filter(s=>localSubs.includes(s.id));
  const totalSubs = subList.length;
  const est = subList.reduce((sum,s) => sum + (s.price||0), 0);

  // Helper: format price nicely
  const fmtPrice = (s) => s.price > 0 ? `$${s.price.toFixed(2)}/mo` : "Free";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0,height:"100%"}}>
      {/* Summary bar */}
      <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:"#C4B5FD",marginBottom:2}}>📊 Your Streaming Bill</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>{totalSubs} service{totalSubs!==1?"s":""} active</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,color:"var(--gold)"}}>${est.toFixed(2)}</div>
            <div style={{fontSize:10,color:"var(--muted)"}}>/month est.</div>
          </div>
        </div>
      </div>

      {/* Service list */}
      <div style={{display:"flex",flexDirection:"column",gap:8,flex:1,overflowY:"auto"}}>
        {SERVICES.map(s=>{
          const active=localSubs.includes(s.id);
          return (
            <div key={s.id} onClick={()=>toggleLocal(s.id)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:active?`${s.color}12`:"rgba(255,255,255,.03)",border:`1.5px solid ${active?s.color+"55":"rgba(255,255,255,.07)"}`,cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=active?s.color+"99":"rgba(255,255,255,.15)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=active?s.color+"55":"rgba(255,255,255,.07)"}>
              {/* Logo bubble */}
              <div style={{width:38,height:38,borderRadius:10,background:active?s.color:"rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0,transition:"background .2s"}}>
                {s.logo}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,color:active?"#fff":"var(--muted)"}}>{s.name}</div>
                <div style={{fontSize:11,color:active?"rgba(240,240,250,.6)":"rgba(240,240,250,.3)",marginTop:1}}>{fmtPrice(s)}</div>
              </div>
              {/* Toggle switch */}
              <div style={{width:44,height:24,borderRadius:99,background:active?"var(--gold)":"rgba(255,255,255,.1)",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:active?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 2px 4px rgba(0,0,0,.3)"}}/>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={handleDone}
        style={{marginTop:16,width:"100%",background:"var(--purple)",border:"none",borderRadius:12,color:"#fff",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>
        ✓ Done
      </button>
    </div>
  );
}

function ProfileModal({ user, profile, tier, watchlist, userRatings, userSubs=[], onClose, onSignOut, onUpgrade, showToast, onEditSubs, onSelectMovie, notifPermission, onRequestNotif, streak }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username||user?.email?.split("@")[0]||"User");
  const [tab, setTab] = useState("overview");
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showSubManager, setShowSubManager] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [wlMovies, setWlMovies] = useState([]);
  const [loadingWl, setLoadingWl] = useState(false);
  const [loadingRev, setLoadingRev] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url||null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarLetter = username[0]?.toUpperCase()||"U";
  const totalRatings = Object.keys(userRatings).length;
  const isPremium = tier === "premium";

  const saveUsername = async () => {
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (!error) { showToast("Username updated!"); setEditing(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast("Image must be under 2MB");
    setUploadingAvatar(true);
    try {
      // Convert to base64 and store in profile
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const { error } = await supabase.from("profiles").update({ avatar_url: base64 }).eq("id", user.id);
        if (!error) { setAvatarUrl(base64); showToast("Profile picture updated! 🎉"); }
        else showToast("Failed to update picture");
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch(e) { showToast("Failed to upload"); setUploadingAvatar(false); }
  };

  // Load watchlist movies from TMDB when tab opens
  useEffect(() => {
    if (tab !== "watchlist" || wlMovies.length > 0) return;
    setLoadingWl(true);
    Promise.all(watchlist.slice(0,20).map(async id => {
      try { return await tmdbFetch(`/movie/${id}?language=en-US`).catch(() => tmdbFetch(`/tv/${id}?language=en-US`)); }
      catch { return null; }
    })).then(results => {
      setWlMovies(results.filter(Boolean));
      setLoadingWl(false);
    });
  }, [tab]);

  // Load user's reviews
  useEffect(() => {
    if (tab !== "reviews" || myReviews.length > 0) return;
    setLoadingRev(true);
    supabase.from("reviews").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).then(({data}) => {
      setMyReviews(data||[]);
      setLoadingRev(false);
    });
  }, [tab]);

  const deleteReview = async (id) => {
    await supabase.from("reviews").delete().eq("id", id);
    setMyReviews(prev => prev.filter(r => r.id !== id));
    showToast("Review deleted");
  };

  const tabs = ["overview","watchlist","reviews"];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"90vh",border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)",overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,rgba(139,92,246,.3),rgba(245,158,11,.1))",padding:"24px 24px 20px",position:"relative",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,.4)",border:"none",borderRadius:10,color:"#fff",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {/* Avatar with upload */}
            {/* Streak avatar — ring glows with level */}
            <div style={{position:"relative",flexShrink:0}}>
              <StreakAvatar streak={streak} profile={{...profile,avatar_url:avatarUrl}} user={user} size={80}/>
              <label style={{position:"absolute",bottom:-2,right:-2,width:22,height:22,borderRadius:"50%",background:"var(--gold)",border:"2px solid var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,boxShadow:"0 2px 8px rgba(0,0,0,.5)",zIndex:10}} title="Change profile picture">
                {uploadingAvatar?"⏳":"📷"}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:"none"}}/>
              </label>
            </div>
            <div>
              {editing
                ? <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input value={username} onChange={e=>setUsername(e.target.value)} autoFocus style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:15,fontFamily:"var(--font-head)",fontWeight:700,outline:"none",width:160}} />
                    <button onClick={saveUsername} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Save</button>
                  </div>
                : <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>{username}</div>
                    <button onClick={()=>setEditing(true)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,color:"var(--muted)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✏️</button>
                  </div>
              }
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4}}>{user?.email}</div>
              {tier==="premium"
                ? <span style={{background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99,fontFamily:"var(--font-head)",display:"inline-block",marginTop:6}}>✦ PREMIUM</span>
                : <span style={{background:"rgba(255,255,255,.1)",color:"var(--muted)",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,display:"inline-block",marginTop:6}}>FREE</span>
              }
              {streak>=1 && (
                <button onClick={()=>setShowStreakModal(true)}
                  style={{background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"var(--gold)",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:99,fontFamily:"var(--font-head)",display:"inline-flex",alignItems:"center",gap:4,marginTop:6,marginLeft:6,cursor:"pointer"}}>
                  {getStreakEmoji(streak)} {streak} day streak →
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
            {[["♥",watchlist.length,"Watchlist","watchlist"],["✍",myReviews.length||"—","Reviews","reviews"],["★",totalRatings,"Rated",null]].map(([icon,val,label,t])=>(
              <button key={label} onClick={()=>t&&setTab(t)}
                style={{background:tab===t?"rgba(245,158,11,.12)":"rgba(255,255,255,.06)",borderRadius:10,padding:"10px 8px",textAlign:"center",border:`1px solid ${tab===t?"rgba(245,158,11,.3)":"rgba(255,255,255,.08)"}`,cursor:t?"pointer":"default",transition:"all .2s"}}>
                <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,color:"var(--gold)"}}>{val}</div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"12px 0",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer"}}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>

          {/* Overview tab */}
          {tab==="overview" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {showSubManager ? (
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"16px"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:12}}>📡 Manage Subscriptions</div>
                  <SubscriptionManagerPanel
                    userSubs={userSubs}
                    onToggle={(newSubs)=>{/* subs managed locally in panel */}}
                    onDone={()=>setShowSubManager(false)}
                  />
                </div>
              ) : (
                <button onClick={()=>setShowSubManager(true)}
                  style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.3)",borderRadius:12,color:"#C4B5FD",padding:"12px 16px",fontWeight:700,fontSize:14,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>📡</span>
                    <div>
                      <div style={{fontWeight:800,color:"#fff"}}>Manage Subscriptions</div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Add or remove streaming services</div>
                    </div>
                  </div>
                  <span style={{color:"var(--muted)",fontSize:16}}>›</span>
                </button>
              )}
              {tier!=="premium" && <button onClick={()=>{onUpgrade();onClose();}} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>}

              {/* Notification opt-in */}
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:14,padding:"14px 16px",marginTop:4}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:3}}>🔔 Game & Content Alerts</div>
                    <div style={{fontSize:12,color:"var(--muted)"}}>
                      {notifPermission==="granted"
                        ? "✅ Notifications enabled — you'll get game alerts & weekly picks"
                        : notifPermission==="denied"
                          ? "❌ Blocked in browser settings — enable in site permissions"
                          : "Get notified when your team plays & weekly streaming picks"}
                    </div>
                  </div>
                  {notifPermission!=="granted" && notifPermission!=="denied" && (
                    <button onClick={onRequestNotif}
                      style={{background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(6,182,212,.2))",border:"1px solid rgba(16,185,129,.4)",borderRadius:10,color:"var(--sports)",padding:"8px 14px",fontWeight:800,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"var(--font-head)"}}>
                      Enable
                    </button>
                  )}
                </div>
              </div>
              <button onClick={onSignOut} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,color:"var(--danger)",padding:"12px 0",fontWeight:600,fontSize:14,cursor:"pointer"}}>Sign Out</button>
            </div>
          )}

          {/* Watchlist tab */}
          {tab==="watchlist" && (
            <div>
              {loadingWl ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}>
                  <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your watchlist…
                </div>
              ) : watchlist.length === 0 ? (
                <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>Your watchlist is empty. Tap ♡ on any title to save it!</div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {wlMovies.map(m=>{
                    const poster = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null;
                    return (
                      <div key={m.id} onClick={()=>{onSelectMovie(m);onClose();}} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--card)",transition:"transform .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                        {poster ? <img src={poster} alt="" style={{width:"100%",height:110,objectFit:"cover"}}/> : <div style={{height:110,background:`linear-gradient(135deg,#1a1a2e,#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                        <div style={{padding:"6px 8px"}}>
                          <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
                          <div style={{fontSize:10,color:"var(--gold)"}}>★ {m.vote_average?.toFixed(1)||"—"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {tab==="reviews" && (
            <div>
              {/* Community reviews header */}
              {reviews.length > 0 && (
                <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>
                    Community Reviews
                    {communityRating && <span style={{color:"#C4B5FD",marginLeft:8,fontSize:13}}>✦ {communityRating.avg} avg · {communityRating.count} rating{communityRating.count!==1?"s":""}</span>}
                  </div>
                </div>
              )}
              {loadingRev ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}>
                  <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--purple)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your reviews…
                </div>
              ) : myReviews.length === 0 ? (
                <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>You haven't written any reviews yet. Open any title and share your thoughts!</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {myReviews.map(rv=>(
                    <div key={rv.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:10}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:2}}>{rv.title}</div>
                          <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <span style={{background:"var(--gold-dim)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                          <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"var(--danger)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>Delete</button>
                        </div>
                      </div>
                      <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    {showStreakModal && <StreakRewardsModal streak={streak} onClose={()=>setShowStreakModal(false)}/>}
    </div>
  );
}

// ─── MOVIE MODAL ──────────────────────────────────────────────────────────────
function MovieModal({ movie, watchlist, userRatings, user, onClose, onRate, onToggleWatchlist, showToast, onSelectSimilar }) {
  const [tab, setTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [details, setDetails] = useState(null);
  const [rating, setRating] = useState(0);
  const [revTitle, setRevTitle] = useState("");
  const [revContent, setRevContent] = useState("");
  const [revRating, setRevRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [allProviders, setAllProviders] = useState({flatrate:[],rent:[],buy:[],free:[],link:""});
  const [communityRating, setCommunityRating] = useState(null);

  useEffect(() => {
    if (!movie?.id) return;
    setRating(userRatings?.[movie.id] || 0);
    setTrailerKey(null); setShowTrailer(false);
    setAllProviders({flatrate:[],rent:[],buy:[],free:[],link:""});
    setCommunityRating(null);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}?append_to_response=credits,similar,videos`).then(d => {
      setDetails(d);
      const vids = d?.videos?.results || [];
      const t = vids.find(v=>v.type==="Trailer"&&v.site==="YouTube") || vids.find(v=>v.site==="YouTube");
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
    // Fetch watch providers (rent/buy/stream/free)
    fetch(`${TMDB_BASE}/${type}/${movie.id}/watch/providers`,{headers:tmdbHeaders})
      .then(r=>r.json()).then(data=>{
        const res = data.results?.US || data.results?.GB || Object.values(data.results||{})[0] || {};
        setAllProviders({
          flatrate: res.flatrate||[],
          rent:     res.rent||[],
          buy:      res.buy||[],
          free:     res.free||[],
          link:     res.link||"",   // TMDB JustWatch link — opens platform picker
        });
      }).catch(()=>{});
    supabase.from("reviews").select("*,profiles(username)").eq("movie_id", movie.id).order("created_at", {ascending:false}).then(({data}) => setReviews(data||[])).catch(()=>{});
    // Fetch community rating aggregate
    supabase.from("ratings").select("rating").eq("movie_id", movie.id).then(({data}) => {
      if (data && data.length > 0) {
        const avg = data.reduce((s,r)=>s+r.rating,0) / data.length;
        setCommunityRating({avg:Math.round(avg*10)/10, count:data.length});
      } else {
        setCommunityRating(null);
      }
    }).catch(()=>{});
  }, [movie?.id]);

  if (!movie) return null;

  const inWL = (watchlist||[]).includes(movie.id);
  const providers = movie.providers || [];
  const mainProvider = providers[0];
  const svc = SERVICES.find(s => s.id === mainProvider);
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const tmdbRating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : "—";
  const releaseYear = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  const genres = details?.genres?.slice(0, 3) || [];
  const cast = details?.credits?.cast?.slice(0, 5) || [];
  const similar = details?.similar?.results?.slice(0, 6) || [];
  const gr = safeGR(movie.id);
  const inp = {background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"10px 14px",width:"100%",fontSize:13,outline:"none"};

  const handleRate = async (val) => {
    if (!user) return showToast && showToast("Sign in to rate! 👤");
    setRating(val);
    if (onRate) onRate(movie.id, val);
    try {
      await supabase.from("ratings").upsert({user_id:user.id, movie_id:movie.id, rating:val}, {onConflict:"user_id,movie_id"});
      // Refresh community rating after user rates
      const {data} = await supabase.from("ratings").select("rating").eq("movie_id", movie.id);
      if (data?.length > 0) {
        const avg = data.reduce((s,r)=>s+r.rating,0)/data.length;
        setCommunityRating({avg:Math.round(avg*10)/10, count:data.length});
      }
    } catch(e){}
    showToast && showToast(`Rated ${val}/10 ★`);
  };

  const deleteReview = async (id) => {
    try { await supabase.from("reviews").delete().eq("id", id); } catch(e){}
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast && showToast("Review deleted");
  };

  const submitReview = async () => {
    if (!user) return showToast && showToast("Sign in to review! 👤");
    if (!revRating) return showToast && showToast("Add a star rating!");
    if (!revTitle.trim()) return showToast && showToast("Add a title!");
    if (revContent.trim().length < 10) return showToast && showToast("Review too short!");
    setSubmitting(true);
    try {
      const { data } = await supabase.from("reviews").insert({user_id:user.id, movie_id:movie.id, title:revTitle, content:revContent, rating:revRating}).select("*,profiles(username)");
      if (data?.[0]) { setReviews(prev => [data[0], ...prev]); setRevTitle(""); setRevContent(""); setRevRating(0); showToast && showToast("Review posted! ✍"); }
    } catch(e) { showToast && showToast("Error posting review"); }
    setSubmitting(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:780,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {/* Hero */}
        <div style={{height:200,position:"relative",flexShrink:0,overflow:"hidden",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
          {showTrailer && trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{width:"100%",height:"100%",border:"none",position:"absolute",inset:0}}
            />
          ) : (
            <>
              {poster && <img src={poster} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.4}} />}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--surface) 0%,transparent 60%)"}} />
              {trailerKey && (
                <button onClick={()=>setShowTrailer(true)}
                  style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
                    background:"rgba(0,0,0,.7)",border:"2px solid rgba(255,255,255,.8)",borderRadius:"50%",
                    width:56,height:56,display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",backdropFilter:"blur(4px)",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,158,11,.9)";e.currentTarget.style.borderColor="var(--gold)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,.7)";e.currentTarget.style.borderColor="rgba(255,255,255,.8)";}}>
                  <span style={{fontSize:22,marginLeft:4}}>▶</span>
                </button>
              )}
            </>
          )}
          <div style={{position:"absolute",top:14,right:14,display:"flex",gap:8}}>
            {showTrailer && <button onClick={()=>setShowTrailer(false)} style={{background:"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:"#fff",padding:"6px 12px",fontSize:12,cursor:"pointer",backdropFilter:"blur(8px)"}}>✕ Close</button>}
            <button onClick={()=>onToggleWatchlist&&onToggleWatchlist(movie.id)} style={{background:inWL?"var(--gold)":"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:inWL?"#000":"#fff",padding:"6px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>{inWL?"♥ Saved":"♡ Watchlist"}</button>
            <button onClick={onClose} style={{background:"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:"#fff",width:36,height:36,fontSize:18,cursor:"pointer"}}>✕</button>
          </div>
          {!showTrailer && (
            <div style={{position:"absolute",bottom:16,left:20,right:20}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,marginBottom:6,textShadow:"0 2px 12px rgba(0,0,0,.8)"}}>{movie.title||movie.name||""}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>{releaseYear}</span>
                {genres.map(g=><span key={g.id} style={{background:"rgba(255,255,255,.12)",borderRadius:6,padding:"2px 8px",fontSize:11}}>{g.name}</span>)}
                {providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p}/>)}
              </div>
            </div>
          )}
        </div>

        {/* Rating bar */}
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"var(--card)",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>TMDB Score</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:"var(--gold)",fontSize:22,fontFamily:"var(--font-head)",fontWeight:800}}>{tmdbRating}</span>
              <span style={{color:"var(--muted)",fontSize:13}}>/ 10</span>
            </div>
          </div>
          <div style={{width:1,height:36,background:"var(--border)"}}/>
          {communityRating && communityRating.count >= 1 && (
            <>
              <div>
                <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>✦ StreamHub</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:"#C4B5FD",fontSize:22,fontFamily:"var(--font-head)",fontWeight:800}}>{communityRating.avg}</span>
                  <span style={{color:"var(--muted)",fontSize:11}}>{communityRating.count} rating{communityRating.count!==1?"s":""}</span>
                </div>
              </div>
              <div style={{width:1,height:36,background:"var(--border)"}}/>
            </>
          )}
          <div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>Your Rating</div>
            <StarPicker value={rating} onChange={handleRate} size={16}/>
          </div>
          {svc && (
            <WatchButton serviceId={mainProvider} title={movie.title||movie.name||""} movieId={movie.id} webUrl={allProviders.link||""} style={{marginLeft:"auto"}}/>
          )}
          {trailerKey && !showTrailer && (
            <button onClick={()=>setShowTrailer(true)}
              style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"var(--text)",padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginLeft:svc?"0":"auto"}}>
              🎬 Trailer
            </button>
          )}
          <button onClick={()=>{
              const txt=`📺 "${movie.title||movie.name}" — found on The StreamHub, the AI streaming assistant! thestreamhub.app`;
              if(navigator.share){navigator.share({title:movie.title||movie.name,text:txt,url:"https://thestreamhub.app"}).catch(()=>{});}
              else{window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}`,"_blank");}
            }}
            style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"var(--muted)",padding:"9px 14px",fontWeight:700,fontSize:13,cursor:"pointer",marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
            📤 Share
          </button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"12px 20px 0",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {["overview","cast","reviews"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"8px 12px",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer"}}>
              {t}{t==="reviews"?` (${reviews.length})`:""}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>

          {tab==="overview" && (
            <div>
              <p style={{fontSize:14,lineHeight:1.75,color:"rgba(240,240,250,.8)",marginBottom:20}}>{movie.overview||details?.overview||"No description available."}</p>

              {/* Where to Watch / Find It */}
              {(allProviders.flatrate.length>0 || allProviders.free.length>0 || allProviders.rent.length>0 || allProviders.buy.length>0) && (
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>WHERE TO WATCH</div>

                  {/* Streaming (included) */}
                  {allProviders.flatrate.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"var(--sports)",fontWeight:700,marginBottom:6}}>✅ INCLUDED IN SUBSCRIPTION</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.flatrate.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.25)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(16,185,129,.2)";e.currentTarget.style.borderColor="rgba(16,185,129,.5)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(16,185,129,.1)";e.currentTarget.style.borderColor="rgba(16,185,129,.25)";}}>
                            <div style={{width:20,height:20,borderRadius:5,overflow:"hidden",flexShrink:0}}>
                              {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                            </div>
                            {p.provider_name}
                            <span style={{fontSize:10,opacity:.6}}>▶</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Free */}
                  {allProviders.free.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"var(--gold)",fontWeight:700,marginBottom:6}}>🆓 FREE WITH ADS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.free.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,158,11,.18)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,158,11,.08)";}}>
                            {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}
                            {p.provider_name}
                            <span style={{fontSize:10,opacity:.6}}>▶</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rent */}
                  {allProviders.rent.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,marginBottom:6}}>💳 RENT</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.rent.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(139,92,246,.18)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,92,246,.08)";}}>
                            {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}
                            {p.provider_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buy */}
                  {allProviders.buy.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:6}}>🛒 BUY</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.buy.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,158,11,.18)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,158,11,.08)";}}>
                            {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}
                            {p.provider_name}
                            <span style={{fontSize:10,opacity:.6}}>▶</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Not available anywhere — show search options */}
              {allProviders.flatrate.length===0 && allProviders.free.length===0 && allProviders.rent.length===0 && allProviders.buy.length===0 && details && (
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:16,marginBottom:20}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:4}}>🔍 Not on streaming right now</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>This title may be available to rent, buy, or find for free elsewhere:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {[
                      {name:"YouTube",    url:`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title||movie.name)}`,    color:"#FF0000"},
                      {name:"Amazon",     url:`https://www.amazon.com/s?k=${encodeURIComponent(movie.title||movie.name)}+movie`,                color:"#00A8E1"},
                      {name:"Apple TV",   url:`https://tv.apple.com/search?term=${encodeURIComponent(movie.title||movie.name)}`,                color:"#555"},
                      {name:"Vudu",       url:`https://www.vudu.com/content/movies/search?searchString=${encodeURIComponent(movie.title||movie.name)}`, color:"#3399FF"},
                      {name:"Google Play",url:`https://play.google.com/store/search?q=${encodeURIComponent(movie.title||movie.name)}&c=movies`, color:"#4285F4"},
                    ].map(s=>(
                      <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{display:"flex",alignItems:"center",gap:6,background:`${s.color}15`,border:`1px solid ${s.color}40`,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,color:"var(--text)",textDecoration:"none",transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=`${s.color}30`}
                        onMouseLeave={e=>e.currentTarget.style.background=`${s.color}15`}>
                        🔗 {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {similar.length>0 && (
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:12,color:"var(--muted)"}}>Similar Titles</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    {similar.map(sm=>{
                      const sgr = safeGR(sm.id);
                      const sp = sm.poster_path ? `${TMDB_IMG}${sm.poster_path}` : null;
                      return (
                        <div key={sm.id} onClick={()=>onSelectSimilar&&onSelectSimilar(sm)}
                          style={{background:"var(--card)",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"all .2s"}}
                          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.borderColor="rgba(245,158,11,.4)";}}
                          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                          {sp ? <img src={sp} alt="" style={{width:"100%",height:100,objectFit:"cover"}}/>
                               : <div style={{height:100,background:`linear-gradient(135deg,${sgr[0]},${sgr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(sm.title||sm.name||"").slice(0,2)}</div>}
                          <div style={{padding:"6px 8px"}}>
                            <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sm.title||sm.name||""}</div>
                            <div style={{fontSize:10,color:"var(--gold)"}}>★ {sm.vote_average?.toFixed(1)||"—"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==="cast" && (
            <div>
              {cast.length===0
                ? <div style={{color:"var(--muted)",textAlign:"center",padding:"32px 0"}}>No cast info available.</div>
                : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:14}}>
                    {cast.map(c=>{
                      const cgr = safeGR(c.id);
                      return (
                        <div key={c.id} style={{textAlign:"center"}}>
                          <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 8px",overflow:"hidden",background:`linear-gradient(135deg,${cgr[0]},${cgr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>
                            {c.profile_path ? <img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                            : <span style={{opacity:.4}}>{(c.name||"").slice(0,2)}</span>}
                          </div>
                          <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{c.name||""}</div>
                          <div style={{fontSize:11,color:"var(--muted)"}}>{c.character||""}</div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {tab==="reviews" && (
            <div>
              <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:"var(--radius)",padding:18,marginBottom:24}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,marginBottom:12,fontSize:15}}>{user?"Write a Review":"Sign in to Review"}</div>
                {user ? (
                  <div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Your Rating</div>
                      <StarPicker value={revRating} onChange={setRevRating}/>
                    </div>
                    <input value={revTitle} onChange={e=>setRevTitle(e.target.value)} placeholder="Review title..." style={{...inp,marginBottom:8}}/>
                    <textarea value={revContent} onChange={e=>setRevContent(e.target.value)} placeholder="Share your thoughts..." rows={3} style={{...inp,resize:"vertical",marginBottom:8}}/>
                    <button onClick={submitReview} disabled={submitting} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 20px",fontWeight:600,fontSize:13,cursor:"pointer"}}>
                      {submitting?"Posting…":"Post Review"}
                    </button>
                  </div>
                ) : <div style={{fontSize:13,color:"var(--muted)"}}>Create a free account to leave reviews.</div>}
              </div>
              {reviews.length===0
                ? <div style={{textAlign:"center",color:"var(--muted)",padding:"32px 0",fontSize:14}}>No reviews yet. Be the first!</div>
                : reviews.map(rv=>(
                    <div key={rv.id||Math.random()} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13}}>
                          {((rv.profiles?.username||"U")[0]||"U").toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>{rv.profiles?.username||"User"}</div>
                          <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString()}</div>
                        </div>
                        <span style={{marginLeft:"auto",background:"rgba(245,158,11,.15)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                        {user?.id===rv.user_id && <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"#ef4444",padding:"4px 10px",fontSize:12,cursor:"pointer"}}>Delete</button>}
                      </div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:5}}>{rv.title||""}</div>
                      <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content||""}</div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── UPGRADE MODAL ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onComplete }) {
  const [step,setStep]=useState("plans");
  const [card,setCard]=useState({name:"",number:"",expiry:"",cvc:""});
  const [loading,setLoading]=useState(false);
  const fmtCard=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?d.slice(0,2)+"/"+d.slice(2):d;};
  const inp={background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",width:"100%",fontSize:14,outline:"none",fontFamily:"var(--font-body)"};
  const handlePay=()=>{
    window.location.href="https://buy.stripe.com/6oU4gzenZcUsbLd16w7EQ00";
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:520,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {step==="plans"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>Upgrade to Premium</div>
                <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>Unlock the full streaming experience</div>
              </div>
              <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
            </div>

            {/* Comparison */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {/* Free */}
              <div style={{border:"1px solid var(--border)",borderRadius:14,padding:16}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Free Account</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--muted)",marginBottom:14}}>$0</div>
                {[
                  {text:"10 searches/day",      ok:true},
                  {text:"Watchlist (50 titles)", ok:true},
                  {text:"3 AI picks",            ok:true},
                  {text:"Ratings & reviews",     ok:true},
                  {text:"Watch trailers",        ok:true},
                  {text:"Mood Search",           ok:false},
                  {text:"Leaving Soon alerts",   ok:false},
                  {text:"Watch History",         ok:false},
                  {text:"Cost Calculator",       ok:false},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,color:f.ok?"var(--text)":"var(--muted)",marginBottom:7,opacity:f.ok?1:.5}}>
                    <span style={{color:f.ok?"var(--sports)":"rgba(255,255,255,.2)",fontSize:13}}>{f.ok?"✓":"✕"}</span>{f.text}
                  </div>
                ))}
              </div>

              {/* Premium */}
              <div style={{border:"2px solid var(--gold)",borderRadius:14,padding:16,background:"rgba(245,158,11,.04)",position:"relative"}}>
                <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 12px",borderRadius:99,fontFamily:"var(--font-head)",whiteSpace:"nowrap"}}>✦ BEST VALUE</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Premium</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--gold)",marginBottom:14}}>$9.99<span style={{fontSize:13,fontWeight:400,color:"var(--muted)"}}>/mo</span></div>
                {[
                  {text:"Unlimited searches",         ok:true},
                  {text:"Unlimited watchlist",        ok:true},
                  {text:"12 AI picks",                ok:true},
                  {text:"Ratings & reviews",          ok:true},
                  {text:"Watch trailers",             ok:true},
                  {text:"🎭 Mood Search",             ok:true},
                  {text:"🚨 Leaving Soon alerts",     ok:true},
                  {text:"📺 Watch History & Stats",   ok:true},
                  {text:"💰 Cost Calculator",         ok:true},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,marginBottom:7,color:"var(--text)"}}>
                    <span style={{color:"var(--gold)",fontSize:13}}>✓</span>{f.text}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={()=>setStep("pay")} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 24px rgba(245,158,11,.3)"}}>
              Upgrade to Premium — $9.99/mo →
            </button>
            <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginTop:10}}>Cancel anytime · No hidden fees · Secured by Stripe</div>
          </div>
        )}
        {step==="pay"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
              <button onClick={()=>setStep("plans")} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:8,color:"var(--text)",width:32,height:32,fontSize:16}}>←</button>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20}}>Payment Details</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
              <input value={card.name} onChange={e=>setCard({...card,name:e.target.value})} placeholder="Cardholder name" style={inp} />
              <div style={{position:"relative"}}>
                <input value={card.number} onChange={e=>setCard({...card,number:fmtCard(e.target.value)})} placeholder="1234 5678 9012 3456" style={{...inp,paddingRight:48}} />
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:18}}>💳</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <input value={card.expiry} onChange={e=>setCard({...card,expiry:fmtExp(e.target.value)})} placeholder="MM / YY" style={inp} />
                <input value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value.replace(/\D/g,"").slice(0,3)})} placeholder="CVC" style={inp} />
              </div>
            </div>
            <button onClick={handlePay} disabled={loading} style={{width:"100%",background:loading?"rgba(245,158,11,.5)":"var(--gold)",border:"none",borderRadius:"var(--radius)",color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              {loading?<><span style={{display:"inline-block",width:18,height:18,border:"2px solid #000",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Processing…</>:"Pay $9.99 / month"}
            </button>
            <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginTop:14}}>🔒 Secured by <span style={{color:"#6772e5",fontWeight:700}}>Stripe</span> · SSL Encrypted</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETUP MODAL ──────────────────────────────────────────────────────────────
function SetupModal({ userSubs, onSave, onClose, isFirst }) {
  const [selected, setSelected] = useState(new Set(userSubs));
  const toggle = id => setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  return (
    <div onClick={isFirst?null:onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(12px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:560,border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.9)",overflow:"hidden"}}>
        <div style={{padding:"28px 28px 0"}}>
          <Logo size={28} />
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6,marginTop:16}}>{isFirst?"Welcome! What are you subscribed to?":"Manage Subscriptions"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.6}}>{isFirst?"Pick your services and we'll personalize your experience.":"Toggle the services you currently pay for."}</div>
        </div>
        <div style={{padding:"0 28px",maxHeight:340,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,paddingBottom:24}}>
            {SERVICES.map(s=>{
              const on=selected.has(s.id);
              return <button key={s.id} onClick={()=>toggle(s.id)} style={{background:on?`${s.color}20`:"rgba(255,255,255,.04)",border:`2px solid ${on?s.color:"rgba(255,255,255,.08)"}`,borderRadius:12,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .2s",position:"relative"}}>
                {on&&<span style={{position:"absolute",top:6,right:8,color:s.color,fontSize:14,fontWeight:800}}>✓</span>}
                <span style={{background:on?s.color:"rgba(255,255,255,.12)",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>{s.logo}</span>
                <span style={{fontSize:11,fontWeight:700,color:on?"#fff":"var(--muted)",textAlign:"center"}}>{s.name}</span>
              </button>;
            })}
          </div>
        </div>
        <div style={{padding:"16px 28px 28px",borderTop:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:13,color:"var(--muted)",flex:1}}>{selected.size} service{selected.size!==1?"s":""} selected</span>
          {!isFirst&&<button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:10,color:"var(--text)",padding:"10px 20px",fontSize:14,fontWeight:600}}>Cancel</button>}
          <button onClick={()=>{onSave([...selected]);onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"10px 24px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14}}>{isFirst?"Let's Go →":"Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
function HeroBanner({ movie, onSelect, onToggleWatchlist, watchlist }) {
  const [loaded, setLoaded] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setTrailerKey(null); setShowTrailer(false);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}/videos?language=en-US`).then(data => {
      const t = (data.results||[]).find(v=>v.type==="Trailer"&&v.site==="YouTube")||(data.results||[])[0];
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
  }, [movie?.id]);

  if (!movie) return (
    <div style={{height:520,background:"linear-gradient(135deg,#0d0d1a,#1a0533)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:40,height:40,border:"3px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}} />
    </div>
  );
  const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
  const poster   = movie.poster_path   ? `${TMDB_IMG}${movie.poster_path}` : null;
  const title    = movie.title||movie.name||"";
  const year     = (movie.release_date||movie.first_air_date||"").slice(0,4);
  const rating   = movie.vote_average?.toFixed(1)||"—";
  const inWL     = watchlist.includes(movie.id);
  const providers = movie.providers||[];
  return (
    <div style={{position:"relative",height:520,overflow:"hidden",cursor:showTrailer?"default":"pointer"}} onClick={()=>!showTrailer&&onSelect(movie)}>
      {/* Trailer or backdrop */}
      {showTrailer && trailerKey
        ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2}} allow="autoplay; fullscreen" allowFullScreen />
        : backdrop && <img src={backdrop} alt="" onLoad={()=>setLoaded(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:loaded?0.55:0.2,transition:"opacity 1s"}} />
      }
      {!showTrailer && <>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(9,7,15,.95) 0%,rgba(9,7,15,.6) 50%,rgba(9,7,15,.2) 100%)"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,transparent 40%)"}} />
      </>}
      {showTrailer && <button onClick={e=>{e.stopPropagation();setShowTrailer(false);}} style={{position:"absolute",top:16,right:16,zIndex:10,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"#fff",padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕ Close Trailer</button>}
      {!showTrailer && (
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:"0 60px"}}>
          <div style={{maxWidth:560}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.25)",borderRadius:99,padding:"5px 14px",marginBottom:20,fontSize:11,fontWeight:700,color:"var(--gold)",letterSpacing:.5}}>🔥 FEATURED</div>
            <h1 style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"clamp(36px,5vw,64px)",lineHeight:1.05,letterSpacing:"-.02em",marginBottom:16,textShadow:"0 4px 24px rgba(0,0,0,.8)"}}>{title}</h1>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <span style={{color:"var(--gold)",fontWeight:700,fontSize:15}}>★ {rating}</span>
              <span style={{color:"var(--muted)",fontSize:14}}>{year}</span>
              {providers.slice(0,3).map(p=><ServiceBadge key={p} platformId={p} />)}
            </div>
            <p style={{fontSize:15,color:"rgba(240,240,250,.75)",lineHeight:1.7,marginBottom:28,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{movie.overview}</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"13px 28px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>▶ Watch Now</button>
              {trailerKey && <button onClick={e=>{e.stopPropagation();setShowTrailer(true);}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.25)",borderRadius:12,color:"#fff",padding:"13px 24px",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>🎬 Trailer</button>}
              <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,158,11,.2)":"rgba(255,255,255,.08)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.15)"}`,borderRadius:12,color:inWL?"var(--gold)":"#fff",padding:"13px 24px",fontWeight:700,fontSize:15,cursor:"pointer"}}>
                {inWL?"♥ Saved":"♡ Save"}
              </button>
            </div>
          </div>
          {poster && <img src={poster} alt={title} style={{marginLeft:"auto",height:340,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,.8)",objectFit:"cover",flexShrink:0}} />}
        </div>
      )}
    </div>
  );
}

// ─── FEATURED ROW ─────────────────────────────────────────────────────────────
function FeaturedRow({ title, icon, movies, watchlist, userRatings, userSubs, onSelect, onToggleWatchlist, color="var(--gold)" }) {
  const ref = useRef(null);
  const scroll = dir => ref.current?.scrollBy({left:dir*340,behavior:"smooth"});
  if (!movies||!movies.length) return null;
  return (
    <div style={{marginBottom:36}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{icon}</span>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,color}}>{title}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>scroll(-1)} style={{background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",width:30,height:30,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <button onClick={()=>scroll(1)}  style={{background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",width:30,height:30,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>
      <div ref={ref} style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 24px 8px",scrollbarWidth:"none",scrollSnapType:"x mandatory",touchAction:"pan-x"}}>
        {movies.map(m=>(
          <div key={m.id} style={{flexShrink:0,width:155,scrollSnapAlign:"start"}}>
            <MovieCard movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={onSelect} onToggleWatchlist={onToggleWatchlist} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DEVICE DETECTION ────────────────────────────────────────────────────────
function useDevice() {
  const [device, setDevice] = useState(() => {
    const w = window.innerWidth;
    if (w <= 768) return "mobile";
    if (w <= 1100) return "tablet";
    return "desktop";
  });
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      if (w <= 768) setDevice("mobile");
      else if (w <= 1100) setDevice("tablet");
      else setDevice("desktop");
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return device;
}
function useIsMobile() { return useDevice() === "mobile"; }

function MobileBottomNav({ view, setView, watchlist, onProfile, tier }) {
  const tabs=[
    {id:"top10",     icon:"🔥", label:"Top 10",     color:"#F59E0B", anim:null},
    {id:"movies",    icon:"🎬", label:"Movies",    color:"#06B6D4", anim:null},
    {id:"tv",        icon:"📺", label:"TV",        color:"#A78BFA", anim:"tvFlicker"},
    {id:"anime",     icon:"✦",  label:"Anime",     color:"#FF6B9D", anim:"swordSwing"},
    {id:"watchlist", icon:"❤️", label:"Watchlist", color:"#ef4444", anim:null},
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(9,7,15,.98)",borderTop:"1px solid rgba(255,255,255,.08)",display:"flex",backdropFilter:"blur(20px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {tabs.map(t=>{
        const active = view===t.id;
        const count = t.id==="watchlist"&&watchlist.length>0 ? watchlist.length : 0;
        return (
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active?t.color:"rgba(240,240,250,.38)",position:"relative",transition:"color .2s",cursor:"pointer"}}>
            {/* Active background pill */}
            {active && <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",width:40,height:32,borderRadius:10,background:`${t.color}14`,pointerEvents:"none"}}/>}
            <span style={{
              fontSize:21, lineHeight:1,
              filter:active?`drop-shadow(0 0 8px ${t.color}cc)`:"none",
              transition:"filter .2s", display:"inline-block",
              animation:active&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none",
              position:"relative", zIndex:1,
            }}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:800,fontFamily:"var(--font-head)",letterSpacing:.3,position:"relative",zIndex:1}}>{t.label}</span>
            {count>0&&<span style={{position:"absolute",top:4,left:"50%",marginLeft:7,background:"#ef4444",color:"#fff",borderRadius:99,minWidth:16,height:16,fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",boxShadow:"0 0 6px rgba(239,68,68,.6)"}}>{count>99?"99+":count}</span>}
            {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2.5,background:t.color,borderRadius:99,boxShadow:`0 0 8px ${t.color}`}}/>}
          </button>
        );
      })}
      {/* Profile button */}
      <button onClick={onProfile}
        style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:"rgba(240,240,250,.38)",cursor:"pointer",position:"relative"}}>
        {tier==="premium" && <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",width:40,height:32,borderRadius:10,background:"rgba(245,158,11,.08)",pointerEvents:"none"}}/>}
        <span style={{fontSize:21,lineHeight:1,position:"relative",zIndex:1}}>👤</span>
        <span style={{fontSize:9,fontWeight:800,fontFamily:"var(--font-head)",letterSpacing:.3,position:"relative",zIndex:1}}>Profile</span>
        {tier==="premium" && <div style={{position:"absolute",top:3,right:"calc(50% - 18px)",width:7,height:7,borderRadius:"50%",background:"var(--gold)",boxShadow:"0 0 5px var(--gold)"}}/>}
      </button>
    </div>
  );
}

// ─── LEAVING SOON MODAL ───────────────────────────────────────────────────────
function LeavingSoonModal({ onClose, userSubs, tier, onUpgrade, watchlist=[], profile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 7-day free trial calculation
  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at)) / 86400000)
    : 999;
  const inFreeTrial = accountAgeDays < 7;
  const daysLeft = Math.max(0, 7 - accountAgeDays);
  const hasAccess = tier === "premium" || inFreeTrial;

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    const fetchLeaving = async () => {
      try {
        const today = new Date();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
        const dateStr = endOfMonth.toISOString().split("T")[0];
        const res = await fetch(`${TMDB_BASE}/discover/movie?sort_by=popularity.desc&watch_region=US&with_watch_providers=${userSubs.map(s=>({netflix:8,disney:337,max:1899,hulu:15,apple:350,prime:9,peacock:386,paramount:531,crunchyroll:283,espnplus:149})[s]).filter(Boolean).join("|")}&language=en-US&page=1`, { headers: tmdbHeaders });
        const data = await res.json();
        // Simulate leaving soon with popular titles
        const results = (data.results||[]).slice(0,12).map((m,i) => ({
          ...m,
          leavingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (i%28)+1).toLocaleDateString("en-US",{month:"short",day:"numeric"}),
          daysLeft: (i%28)+1,
        }));
        setItems(results);
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    fetchLeaving();
  }, [hasAccess, userSubs]);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(239,68,68,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(239,68,68,.12),rgba(245,158,11,.06))"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>🚨 Leaving Soon</div>
            <div style={{fontSize:13,color:"var(--muted)"}}>Titles leaving your services this month</div>
            {tier!=="premium"&&inFreeTrial&&(
              <div style={{marginTop:8,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:8,padding:"6px 12px",fontSize:11,color:"var(--sports)",fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
                🎁 Free trial · {daysLeft} day{daysLeft!==1?"s":""} remaining
              </div>
            )}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {!hasAccess ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>🚨</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>Upgrade to Keep Access</div>
              <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Your 7-day free trial has ended. Upgrade to never miss a title leaving your services.</div>
              <button onClick={()=>{onUpgrade();onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"12px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>
            </div>
          ) : loading ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:12,color:"var(--muted)"}}>
              <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              Checking your services…
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
              {items.map(m=>{
                const poster = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null;
                const urgent = m.daysLeft <= 7;
                return (
                  <div key={m.id} style={{background:"var(--card)",borderRadius:12,overflow:"hidden",border:`1px solid ${urgent?"rgba(239,68,68,.4)":"var(--border)"}`}}>
                    {poster ? <img src={poster} alt="" style={{width:"100%",height:140,objectFit:"cover"}}/> : <div style={{height:140,background:"linear-gradient(135deg,#1a0a0a,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                    <div style={{padding:"8px 10px"}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
                      <div style={{fontSize:11,color:urgent?"var(--danger)":"var(--muted)",fontWeight:urgent?700:400}}>
                        {urgent?"⚠️ ":"📅 "}Leaves {m.leavingDate}
                      </div>
                      <div style={{fontSize:10,color:urgent?"var(--danger)":"var(--muted)",marginTop:2}}>{m.daysLeft} day{m.daysLeft!==1?"s":""} left</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WATCH HISTORY MODAL ──────────────────────────────────────────────────────
function WatchHistoryModal({ onClose, user, tier, onUpgrade }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user || tier !== "premium") { setLoading(false); return; }
    supabase.from("watch_history").select("*").eq("user_id", user.id).order("watched_at",{ascending:false}).then(({data}) => {
      setHistory(data||[]);
      setLoading(false);
    });
  }, [user, tier]);

  const totalWatched = history.length;
  const thisMonth = history.filter(h => new Date(h.watched_at).getMonth() === new Date().getMonth()).length;
  const thisYear = history.filter(h => new Date(h.watched_at).getFullYear() === new Date().getFullYear()).length;
  const movies = history.filter(h => h.movie_type === "movie").length;
  const shows = history.filter(h => h.movie_type === "tv").length;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:620,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(139,92,246,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(139,92,246,.15),rgba(6,182,212,.06))"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>📺 Watch History & Stats</div>
            <div style={{fontSize:13,color:"var(--muted)"}}>Everything you've watched on StreamHub</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {tier !== "premium" ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>📺</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>Premium Feature</div>
              <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Track everything you watch and see your streaming stats — total watched, this month, movies vs shows and more.</div>
              <button onClick={()=>{onUpgrade();onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"12px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>
            </div>
          ) : loading ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:12,color:"var(--muted)"}}>
              <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--purple)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your history…
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
                {[["📺",totalWatched,"Total Watched"],["📅",thisMonth,"This Month"],["🗓️",thisYear,"This Year"],["🎬",movies,"Movies"],["📡",shows,"TV Shows"],["⭐",Math.round(totalWatched*1.2),"Hours Est."]].map(([icon,val,label])=>(
                  <div key={label} style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,color:"var(--purple)"}}>{val}</div>
                    <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{label}</div>
                  </div>
                ))}
              </div>
              {/* History list */}
              {history.length === 0 ? (
                <div style={{textAlign:"center",color:"var(--muted)",padding:"32px 0",fontSize:14}}>
                  No watch history yet. Click "Mark as Watched" on any title to start tracking!
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {history.map(h=>(
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.03)",borderRadius:10,padding:"10px 12px",border:"1px solid var(--border)"}}>
                      {h.movie_poster ? <img src={`${TMDB_IMG}${h.movie_poster}`} alt="" style={{width:40,height:56,objectFit:"cover",borderRadius:6,flexShrink:0}}/> : <div style={{width:40,height:56,background:"var(--card)",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎬</div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.movie_title}</div>
                        <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{h.movie_type==="tv"?"📡 TV Show":"🎬 Movie"} · Watched {new Date(h.watched_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COST CALCULATOR MODAL ────────────────────────────────────────────────────
function CostCalculatorModal({ onClose, userSubs, watchHistory, watchlist, userRatings, tier, onUpgrade }) {
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");

  const myServices = SERVICES.filter(s => userSubs.includes(s.id));
  const totalMonthly = myServices.reduce((sum,s) => sum + (s.price||0), 0);
  const totalAnnual = totalMonthly * 12;

  // Calculate watches per service from history
  const watchesByService = {};
  (watchHistory||[]).forEach(h => {
    const svc = h.service_id || (h.providers && h.providers[0]);
    if (svc) watchesByService[svc] = (watchesByService[svc]||0) + 1;
  });

  // Cost per watch per service
  const serviceStats = myServices.map(s => {
    const watches = watchesByService[s.id] || 0;
    const cpw = watches > 0 ? s.price / watches : null;
    return { ...s, watches, cpw };
  }).sort((a,b) => b.price - a.price);

  const totalWatches = Object.values(watchesByService).reduce((s,v)=>s+v,0);
  const mostUsed = serviceStats.filter(s=>s.watches>0).sort((a,b)=>b.watches-a.watches)[0];
  const leastUsed = serviceStats.filter(s=>s.watches===0 && s.price>0);
  const bestValue = serviceStats.filter(s=>s.cpw!==null).sort((a,b)=>a.cpw-b.cpw)[0];
  const worstValue = serviceStats.filter(s=>s.cpw!==null).sort((a,b)=>b.cpw-a.cpw)[0];

  // Watchlist service distribution
  const wlByService = {};
  (watchlist||[]).forEach(id => {
    // approximate from watchHistory
  });

  const generateAIReport = async () => {
    setLoading(true);
    const dataSnapshot = {
      services: serviceStats.map(s=>({name:s.name,price:s.price,watches:s.watches,cpw:s.cpw?.toFixed(2)||"no data"})),
      totalMonthly: totalMonthly.toFixed(2),
      totalWatches,
      watchlistSize: (watchlist||[]).length,
      ratingsCount: Object.keys(userRatings||{}).length,
      unusedServices: leastUsed.map(s=>s.name),
      mostUsed: mostUsed?.name || "none",
      bestValue: bestValue ? `${bestValue.name} at $${bestValue.cpw?.toFixed(2)}/watch` : "none",
    };
    try {
      const res = await fetch("/api/ai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:800,
          system:`You are a smart streaming advisor. Analyze streaming data and give brutally honest recommendations. Be specific with dollar amounts. Return ONLY valid JSON with keys: summary (2 sentences), keep (array of {service, reason}), drop (array of {service, reason, savings}), tip (one power tip). No markdown, no extra text.`,
          messages:[{role:"user",content:`Streaming data: ${JSON.stringify(dataSnapshot)}`}]
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "";
      if (!text) throw new Error("Empty AI response");
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setAiReport(parsed);
    } catch(e) {
      setAiReport({ error: e.message, summary:"", keep:[], drop:[], tip:"" });
    }
    setLoading(false);
  };

  // Free users get 1 AI report — tracked in localStorage
  const freeReportKey = "streamhub_free_report_used";
  const hasUsedFreeReport = !!localStorage.getItem(freeReportKey);
  const canAccessFree = !hasUsedFreeReport;

  const generateAIReportWithTracking = async () => {
    if (tier !== "premium" && canAccessFree) {
      localStorage.setItem(freeReportKey, "1");
    }
    await generateAIReport();
  };

  if (tier !== "premium" && hasUsedFreeReport) return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:420,border:"1px solid rgba(16,185,129,.3)",padding:32,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>💰</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:8}}>Liked your free report?</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:20,lineHeight:1.7}}>Upgrade to Premium for unlimited AI reports, updated every time your watch history changes.</div>
        <div style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"left"}}>
          {["Unlimited AI reports — run anytime","Cost-per-watch breakdown per service","AI verdict: Keep, Cut, or Rotate","Personalized save recommendations","Monthly & annual waste calculator"].map((f,i)=>(
            <div key={i} style={{display:"flex",gap:8,fontSize:13,color:"var(--muted)",marginBottom:i<4?8:0}}>
              <span style={{color:"var(--sports)"}}>✓</span>{f}
            </div>
          ))}
        </div>
        <button onClick={()=>{onUpgrade&&onUpgrade();onClose();}} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:10}}>
          Upgrade to Premium ✦
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(16,185,129,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>

        {/* Header */}
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(245,158,11,.06))",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:2}}>💰 Streaming Intelligence</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>AI-powered analysis of your streaming value</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:4,marginTop:14}}>
            {["overview","ai report"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"rgba(16,185,129,.2)":"none",border:tab===t?"1px solid rgba(16,185,129,.4)":"1px solid transparent",borderRadius:99,color:tab===t?"var(--sports)":"var(--muted)",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize",fontFamily:"var(--font-head)"}}>
                {t==="ai report"?"🤖 AI Report":t==="overview"?"📊 Overview":""}
              </button>
            ))}
          </div>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"20px 24px 24px"}}>

          {tab==="overview" && (
            <div>
              {/* Big total — responsive font size */}
              <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.1),rgba(16,185,129,.03))",border:"1px solid rgba(16,185,129,.2)",borderRadius:16,padding:"16px 12px",textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,letterSpacing:1.5}}>MONTHLY STREAMING SPEND</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"clamp(32px,8vw,52px)",color:"var(--sports)",lineHeight:1}}>${totalMonthly.toFixed(2)}</div>
                <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:10,flexWrap:"wrap"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>${totalAnnual.toFixed(0)}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>per year</div>
                  </div>
                  <div style={{width:1,background:"var(--border)"}}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>${(totalMonthly/30).toFixed(2)}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>per day</div>
                  </div>
                  <div style={{width:1,background:"var(--border)"}}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>{totalWatches}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>watched</div>
                  </div>
                </div>
              </div>

              {/* Per-service cost breakdown */}
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>COST PER SERVICE — THIS MONTH</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {serviceStats.map(s=>{
                    const pct = totalMonthly>0?(s.price/totalMonthly)*100:0;
                    const verdict = s.watches===0&&s.price>0?"⚠️ Unused":s.cpw&&s.cpw<3?"🟢 Great":s.cpw&&s.cpw<8?"🟡 Average":"🔴 Pricey";
                    return (
                      <div key={s.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,gap:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
                            <span style={{background:s.color,borderRadius:7,width:26,height:26,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",flexShrink:0}}>{s.logo}</span>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                              <div style={{fontSize:10,color:"var(--muted)"}}>
                                {s.watches>0?`${s.watches} watch${s.watches!==1?"es":""}  ·  $${s.cpw.toFixed(2)}/watch`:"No watches yet"}
                              </div>
                            </div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontFamily:"var(--font-head)",fontWeight:800,color:"var(--sports)",fontSize:13}}>${s.price.toFixed(2)}</div>
                            <div style={{fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{verdict}</div>
                          </div>
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,.05)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:s.watches===0?"rgba(239,68,68,.6)":s.color,borderRadius:99,transition:"width .6s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick insights */}
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:"var(--muted)",letterSpacing:1.2,marginBottom:2}}>QUICK INSIGHTS</div>
                {mostUsed && <div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>🏆 <strong>{mostUsed.name}</strong> is your most-used — {mostUsed.watches} watches this month</div>}
                {bestValue && <div style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>💎 Best value: <strong>{bestValue.name}</strong> at <strong>${bestValue.cpw.toFixed(2)}/watch</strong></div>}
                {worstValue && worstValue.cpw > 10 && <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>⚠️ <strong>{worstValue.name}</strong> is costing <strong>${worstValue.cpw.toFixed(2)}/watch</strong></div>}
                {leastUsed.length>0 && <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>💸 <strong>{leastUsed.map(s=>s.name).join(", ")}</strong> — paid for, nothing watched. That's <strong>${leastUsed.reduce((s,sv)=>s+sv.price,0).toFixed(2)}/mo</strong> unused.</div>}
              </div>

              <button onClick={()=>setTab("ai report")} style={{width:"100%",background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(6,182,212,.2))",border:"1px solid rgba(16,185,129,.4)",borderRadius:12,color:"var(--sports)",padding:"11px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,cursor:"pointer"}}>
                🤖 Get AI Recommendations →
              </button>
            </div>
          )}

          {tab==="ai report" && (
            <div>
              {!aiReport && !loading && (
                <div style={{textAlign:"center",padding:"32px 0"}}>
                  <div style={{fontSize:52,marginBottom:16}}>🤖</div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>AI Streaming Advisor</div>
                  <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.7,maxWidth:380,margin:"0 auto 24px"}}>
                    AI analyzes your watch history, ratings, and watchlist to give you brutally honest advice on what to keep, what to cut, and how to save money.
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24,textAlign:"left"}}>
                    {[
                      `${myServices.length} services · $${totalMonthly.toFixed(2)}/mo`,
                      `${totalWatches} titles watched`,
                      `${(watchlist||[]).length} titles on watchlist`,
                      `${Object.keys(userRatings||{}).length} ratings given`,
                    ].map((stat,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--muted)",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{color:"var(--sports)"}}>✓</span>{stat}
                      </div>
                    ))}
                  </div>
                  <button onClick={tier==="premium"?generateAIReport:generateAIReportWithTracking} style={{background:"linear-gradient(135deg,#10b981,#06b6d4)",border:"none",borderRadius:14,color:"#fff",padding:"14px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 32px rgba(16,185,129,.4)"}}>
                    ✦ Generate My Report
                  </button>
                </div>
              )}

              {loading && (
                <div style={{textAlign:"center",padding:"48px 0"}}>
                  <div style={{width:48,height:48,border:"3px solid rgba(16,185,129,.2)",borderTop:"3px solid var(--sports)",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,marginBottom:8}}>Analyzing your streaming habits...</div>
                  <div style={{color:"var(--muted)",fontSize:13}}>Calculating cost-per-watch, checking your watchlist, reviewing your ratings</div>
                </div>
              )}

              {aiReport && !loading && (
                <div>
                  {/* Show error if present */}
                  {aiReport.error && (
                    <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:16,marginBottom:16,textAlign:"center"}}>
                      <div style={{fontSize:28,marginBottom:8}}>😕</div>
                      <div style={{fontWeight:700,marginBottom:4}}>Couldn't generate report</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>{aiReport.error}</div>
                      <button onClick={()=>{setAiReport(null);generateAIReport();}} style={{background:"var(--sports)",border:"none",borderRadius:10,color:"#fff",padding:"8px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>Try Again</button>
                    </div>
                  )}
                  {/* Summary */}
                  <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(6,182,212,.08))",border:"1px solid rgba(16,185,129,.25)",borderRadius:14,padding:16,marginBottom:16}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--sports)",letterSpacing:1.2,marginBottom:8}}>AI SUMMARY</div>
                    <div style={{fontSize:14,lineHeight:1.7,color:"rgba(240,240,250,.85)"}}>{aiReport.summary}</div>
                  </div>

                  {/* Keep */}
                  {aiReport.keep?.length>0 && (
                    <div style={{marginBottom:14}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--sports)",letterSpacing:1.2,marginBottom:8}}>✅ KEEP THESE</div>
                      {aiReport.keep.map((k,i)=>(
                        <div key={i} style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13}}>
                          <strong>{k.service}</strong> — {k.reason}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop */}
                  {aiReport.drop?.length>0 && (
                    <div style={{marginBottom:14}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"#ef4444",letterSpacing:1.2,marginBottom:8}}>✂️ CONSIDER CUTTING</div>
                      {aiReport.drop.map((d,i)=>(
                        <div key={i} style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13}}>
                          <strong>{d.service}</strong> — {d.reason}
                          {d.savings && <span style={{marginLeft:8,background:"rgba(239,68,68,.15)",color:"#ef4444",borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>Save {d.savings}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tip */}
                  {aiReport.tip && (
                    <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"12px 14px",fontSize:13,marginBottom:16}}>
                      💡 <strong>Power tip:</strong> {aiReport.tip}
                    </div>
                  )}

                  <button onClick={()=>{setAiReport(null);generateAIReport();}} style={{width:"100%",background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:10,color:"var(--sports)",padding:"10px 0",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    🔄 Regenerate Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MOOD SEARCH MODAL ────────────────────────────────────────────────────────
// ─── MOOD SEARCH LIMIT (1 free per day) ──────────────────────────────────────
function getMoodSearchCount() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem("streamhub_mood_v3") || "{}");
  if (stored.date !== today) return 0;
  return stored.count || 0;
}
function incrementMoodSearchCount() {
  const today = new Date().toDateString();
  const count = getMoodSearchCount();
  localStorage.setItem("streamhub_mood_v3", JSON.stringify({ date: today, count: count + 1 }));
}

// ─── AI PICKS LIMIT (weekly reset) ───────────────────────────────────────────
function getAIPicksCount() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const stored = JSON.parse(localStorage.getItem("streamhub_aipicks_data") || "{}");
  if (stored.week !== week) return 0;
  return stored.count || 0;
}
function incrementAIPicksCount() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const count = getAIPicksCount();
  localStorage.setItem("streamhub_aipicks_data", JSON.stringify({ week, count: count + 1 }));
}

function MoodSearchModal({ onClose, tier, onUpgrade, onResults }) {
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const freeMoodUsed = false; // Mood Search is free for all users

  const moods = [
    "Something scary but not too gory 😱",
    "Funny and lighthearted 😂",
    "A good cry 😢",
    "Action-packed and thrilling ⚡",
    "Perfect for date night 💕",
    "Something for the whole family 👨‍👩‍👧",
    "Mind-bending and thought-provoking 🧠",
    "Feel-good and uplifting ☀️",
    "Dark and gritty 🖤",
    "Epic adventure 🗺️",
  ];

  const search = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:500,
          system:`You are an expert film and TV critic. When given a mood or vibe, suggest exactly 3 highly specific titles that genuinely match. Include a mix of movie and TV types. Be specific — no generic blockbusters unless they truly fit. Return ONLY valid JSON, no markdown: {"items":[{"title":"exact title","year":2019,"type":"movie","reason":"one specific sentence why this fits","genre":"Genre","platform":"Netflix","tmdb_search":"exact title"}]}`,
          messages:[{
            role:"user",
            content:`Give me 3 titles that perfectly match this mood: "${mood}". Make them varied and specific.`
          }]
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.error?.message || errData.error || `API error ${res.status}`);
      }
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"";
      if (!txt) throw new Error("Empty response from AI");
      const clean = txt.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      if (!parsed.items?.length) throw new Error("No results returned");
      setResult(parsed);
      if (tier !== "premium") incrementMoodSearchCount();
    } catch(e) {
      console.error("Mood search error:", e);
      setResult({ error: e.message, items:[] });
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1100,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:56,paddingBottom:20,paddingLeft:12,paddingRight:12,overflowY:"auto",backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{
        background:"linear-gradient(180deg,#140B30 0%,#0F082A 100%)",
        borderRadius:20,
        width:"100%", maxWidth:640,
        overflow:"hidden",
        display:"flex", flexDirection:"column",
        border:"1px solid rgba(139,92,246,.4)",
        boxShadow:"0 20px 80px rgba(139,92,246,.4)",
      }}>
        {/* Header */}
        <div style={{
          padding:"20px 20px 16px",
          background:"linear-gradient(135deg,rgba(139,92,246,.25),rgba(255,107,157,.1))",
          borderBottom:"1px solid rgba(139,92,246,.2)",
          position:"relative",
        }}>
          <div style={{position:"absolute",top:-40,left:-40,width:150,height:150,borderRadius:"50%",background:"rgba(139,92,246,.2)",filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:-40,right:-40,width:150,height:150,borderRadius:"50%",background:"rgba(255,107,157,.15)",filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{
                width:40,height:40,borderRadius:12,
                background:"linear-gradient(135deg,#8B5CF6,#A855F7)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,boxShadow:"0 4px 20px rgba(139,92,246,.5)",
              }}>🎭</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",gap:8}}>
                  Mood Search
                  <span style={{background:"linear-gradient(90deg,#F59E0B,#f59e0b)",color:"#000",fontSize:9,fontWeight:900,padding:"2px 8px",borderRadius:99,letterSpacing:.5}}>✦ PRO</span>
                </div>
                <div style={{fontSize:12,color:"rgba(196,181,253,.8)"}}>Describe any vibe — AI finds the perfect match</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <div style={{background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.3)",borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#C4B5FD"}}>
                🎭 Free
              </div>
              <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,color:"var(--muted)",width:28,height:28,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
          </div>
          {/* Example prompts as inspiration */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,position:"relative"}}>
            {['"scary but not gory"','"fun date night"','"mind-bending sci-fi"','"feel-good comedy"'].map(ex=>(
              <button key={ex} onClick={()=>setMood(ex.replace(/"/g,""))}
                style={{background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.3)",borderRadius:99,color:"#c4b5fd",padding:"4px 12px",fontSize:11,cursor:"pointer",fontStyle:"italic"}}>
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px 24px",flex:1}}>
          {/* Main input */}
          <div style={{position:"relative",marginBottom:16}}>
            <div style={{
              position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
              fontSize:20,pointerEvents:"none",
            }}>🎭</div>
            <input
              value={mood} onChange={e=>setMood(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&search()}
              placeholder='Type anything... "cozy rainy day movie" or "action like John Wick"'
              autoFocus
              style={{
                width:"100%", background:"rgba(139,92,246,.1)",
                border:"1.5px solid rgba(139,92,246,.5)",
                borderRadius:16, color:"var(--text)",
                padding:"14px 16px 14px 46px",
                fontSize:14, outline:"none",
                boxShadow:"0 4px 20px rgba(139,92,246,.15)",
              }}
            />
            <button onClick={search} disabled={loading||!mood.trim()}
              style={{
                position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                background:mood.trim()?"linear-gradient(135deg,#8B5CF6,#A855F7)":"rgba(255,255,255,.1)",
                border:"none",borderRadius:10,color:"#fff",
                padding:"7px 16px",fontFamily:"var(--font-head)",fontWeight:800,
                fontSize:12,cursor:mood.trim()?"pointer":"default",
                display:"flex",alignItems:"center",gap:6,
                transition:"all .2s",opacity:!mood.trim()?0.5:1,
              }}>
              {loading?<span style={{display:"inline-block",width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:<>✦ Find</>}
            </button>
          </div>

          {/* Quick mood chips */}
          {!result && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"rgba(196,181,253,.6)",marginBottom:10,letterSpacing:1.5,fontWeight:700}}>QUICK PICKS — tap to try</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {moods.map(m=>(
                  <button key={m} onClick={()=>setMood(m)}
                    style={{
                      background:mood===m?"rgba(139,92,246,.3)":"rgba(255,255,255,.05)",
                      border:`1px solid ${mood===m?"rgba(139,92,246,.7)":"rgba(255,255,255,.1)"}`,
                      borderRadius:99,color:mood===m?"#c4b5fd":"var(--muted)",
                      padding:"7px 14px",fontSize:12,cursor:"pointer",
                      transition:"all .2s",
                    }}>{m}</button>
                ))}
              </div>
            </div>
          )}
          {/* Results */}
          {result && (
            <div>
              {result.error ? (
                <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:20,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>😕</div>
                  <div style={{fontWeight:700,marginBottom:4}}>Couldn't get results</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>{result.error}</div>
                  <button onClick={()=>{setResult(null);search();}} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"8px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>Try Again</button>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:11,color:"rgba(196,181,253,.6)",marginBottom:12,letterSpacing:1.2,fontWeight:700}}>
                    {result.items?.length || 0} RESULTS FOR "{mood.toUpperCase()}"
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {result.items?.map((item,i)=>(
                      <div key={i} style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"12px 14px",animation:`fadeUp .3s ${i*0.06}s both`,transition:"border-color .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(139,92,246,.5)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(139,92,246,.2)"}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:5}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>
                              {item.title} <span style={{fontSize:12,color:"var(--muted)",fontWeight:400}}>({item.year})</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                              <span style={{background:"rgba(255,255,255,.07)",borderRadius:6,padding:"2px 7px",fontSize:10,color:"var(--muted)"}}>{item.type==="tv"?"📺 TV":"🎬 Movie"}</span>
                              {item.genre&&<span style={{background:"rgba(255,255,255,.07)",borderRadius:6,padding:"2px 7px",fontSize:10,color:"var(--muted)"}}>{item.genre}</span>}
                              {item.platform&&<span style={{background:"rgba(139,92,246,.25)",borderRadius:6,padding:"2px 7px",fontSize:10,color:"#c4b5fd",fontWeight:700}}>{item.platform}</span>}
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <button onClick={()=>{onResults(item.tmdb_search||item.title);onClose();}}
                              style={{background:"linear-gradient(135deg,#8B5CF6,#A855F7)",border:"none",borderRadius:10,color:"#fff",padding:"7px 12px",fontSize:11,fontWeight:800,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
                              Search →
                            </button>
                            <button onClick={()=>{
                              const shareText = `🎭 AI Mood Search just matched me with "${item.title}" — perfectly fits my vibe! Try The StreamHub:`;
                              if(navigator.share){navigator.share({title:item.title,text:shareText,url:"https://thestreamhub.app"}).catch(()=>{});}
                              else{window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText+" https://thestreamhub.app")}`,"_blank");}
                            }}
                              style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"var(--muted)",padding:"7px 10px",fontSize:13,cursor:"pointer",flexShrink:0}}>
                              📤
                            </button>
                          </div>
                        </div>
                        <div style={{fontSize:12,color:"rgba(196,181,253,.8)",lineHeight:1.5,fontStyle:"italic"}}>"{item.reason}"</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>{setResult(null);setMood("");}} style={{marginTop:12,width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:10,color:"var(--muted)",padding:"10px 0",fontSize:13,cursor:"pointer"}}>
                    🔄 Try a different mood
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEW RELEASES MODAL ───────────────────────────────────────────────────────
function NewReleasesModal({ onClose, user, tier, userSubs, onSelect, onUpgrade }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const myServices = SERVICES.filter(s => userSubs.includes(s.id));

  useEffect(() => {
    const fetchNewReleases = async () => {
      setLoading(true);
      try {
        // Fetch new releases from TMDB - movies and TV
        const [movies, tv] = await Promise.all([
          tmdbFetch("/movie/now_playing?language=en-US&page=1"),
          tmdbFetch("/tv/on_the_air?language=en-US&page=1"),
        ]);
        const movieItems = (movies.results||[]).slice(0,10).map(m=>({...m,mediaType:"movie"}));
        const tvItems = (tv.results||[]).slice(0,10).map(t=>({...t,mediaType:"tv"}));
        // Merge and sort by popularity
        const all = [...movieItems,...tvItems].sort((a,b)=>(b.popularity||0)-(a.popularity||0));
        setReleases(all);
      } catch(e) { setReleases([]); }
      setLoading(false);
    };
    fetchNewReleases();
  }, []);

  if (tier !== "premium") return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:420,border:"1px solid rgba(6,182,212,.3)",padding:32,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🆕</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:8}}>New Releases</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:20,lineHeight:1.7}}>
          See what just dropped on your streaming services — movies, shows, and series premieres, updated daily.
        </div>
        <button onClick={()=>{onUpgrade&&onUpgrade();onClose();}} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:10}}>
          Upgrade to Premium ✦
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );

  const filtered = filter === "all" ? releases : releases.filter(r => r.mediaType === filter);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(6,182,212,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>

        {/* Header */}
        <div style={{padding:"20px 24px 14px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,rgba(6,182,212,.12),rgba(139,92,246,.06))",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:2}}>🆕 New Releases</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>Latest drops across all streaming services</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          {/* Filter tabs */}
          <div style={{display:"flex",gap:6}}>
            {[{id:"all",label:"All"},{ id:"movie",label:"🎬 Movies"},{id:"tv",label:"📺 Shows"}].map(f=>(
              <button key={f.id} onClick={()=>setFilter(f.id)}
                style={{background:filter===f.id?"rgba(139,92,246,.2)":"rgba(255,255,255,.05)",border:`1px solid ${filter===f.id?"rgba(139,92,246,.5)":"transparent"}`,borderRadius:99,color:filter===f.id?"#C4B5FD":"var(--muted)",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-head)"}}>
                {f.label}
              </button>
            ))}
            {myServices.length > 0 && (
              <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>
                <div style={{fontSize:10,color:"var(--muted)"}}>YOUR SERVICES:</div>
                {myServices.slice(0,4).map(s=>(
                  <div key={s.id} style={{background:s.color,borderRadius:6,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff"}}>{s.logo}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>
          {loading ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
              {[...Array(8)].map((_,i)=><div key={i} className="skeleton" style={{height:200,borderRadius:12}}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>No releases found.</div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
              {filtered.map(item=>{
                const gr = safeGR(item.id);
                const poster = item.poster_path ? `${TMDB_IMG}${item.poster_path}` : null;
                const title = item.title || item.name || "";
                const date = item.release_date || item.first_air_date || "";
                const daysAgo = date ? Math.floor((Date.now()-new Date(date))/86400000) : null;
                return (
                  <div key={item.id} onClick={()=>{onSelect({...item,providers:[],category:item.mediaType});onClose();}}
                    style={{borderRadius:12,overflow:"hidden",cursor:"pointer",border:"1px solid var(--border)",background:"var(--card)",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.borderColor="rgba(6,182,212,.5)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                    <div style={{height:180,position:"relative",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
                      {poster && <img src={poster} alt={title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                      <div style={{position:"absolute",top:6,left:6,background:item.mediaType==="tv"?"rgba(139,92,246,.9)":"rgba(245,158,11,.9)",borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:900,color:item.mediaType==="tv"?"#fff":"#000"}}>
                        {item.mediaType==="tv"?"TV":"MOVIE"}
                      </div>
                      {daysAgo !== null && daysAgo <= 7 && (
                        <div style={{position:"absolute",top:6,right:6,background:"rgba(16,185,129,.9)",borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:900,color:"#fff"}}>
                          {daysAgo === 0 ? "TODAY" : `${daysAgo}d ago`}
                        </div>
                      )}
                    </div>
                    <div style={{padding:"8px 10px 10px"}}>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:10,color:"var(--muted)"}}>{date.slice(0,4)}</div>
                        <div style={{fontSize:10,color:"var(--gold)"}}>★ {item.vote_average?.toFixed(1)||"—"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PWA INSTALL PROMPT ───────────────────────────────────────────────────────
function InstallPrompt({ onDismiss }) {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (
    <div style={{
      position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)",
      zIndex:350, width:"calc(100% - 28px)", maxWidth:400,
      background:"linear-gradient(135deg,rgba(9,7,15,.98),rgba(12,8,28,.98))",
      border:"1px solid rgba(139,92,246,.4)",
      borderRadius:18, padding:"16px 18px",
      boxShadow:"0 20px 60px rgba(0,0,0,.8)",
      animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
    }}>
      <button onClick={onDismiss} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:"rgba(240,240,250,.3)",fontSize:16,cursor:"pointer"}}>✕</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <img src="/icons/icon-72x72.png" alt="" style={{width:48,height:48,borderRadius:12,flexShrink:0}} />
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:2}}>Add to Home Screen</div>
          <div style={{fontSize:12,color:"rgba(240,240,250,.5)"}}>Get the full app experience — free</div>
        </div>
      </div>
      {isIOS ? (
        <div style={{fontSize:12,color:"rgba(240,240,250,.6)",lineHeight:1.7,background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"10px 12px"}}>
          Tap <strong style={{color:"#fff"}}>Share</strong> → <strong style={{color:"#fff"}}>"Add to Home Screen"</strong> to install The StreamHub on your iPhone
        </div>
      ) : (
        <div style={{fontSize:12,color:"rgba(240,240,250,.6)",lineHeight:1.7,background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"10px 12px"}}>
          Tap <strong style={{color:"#fff"}}>⋮ Menu</strong> → <strong style={{color:"#fff"}}>"Add to Home Screen"</strong> to install The StreamHub
        </div>
      )}
    </div>
  );
}

// ─── SKELETON CARD (outside component to prevent remount) ───────────────────
function SkeletonCard() {
  return (
    <div style={{borderRadius:"var(--radius)",overflow:"hidden",border:"1px solid var(--border)"}}>
      <div className="skeleton" style={{height:200}} />
      <div style={{padding:"10px 12px 12px",background:"var(--card)"}}>
        <div className="skeleton" style={{height:14,marginBottom:8,width:"80%"}} />
        <div className="skeleton" style={{height:11,width:"50%"}} />
      </div>
    </div>
  );
}

// ─── DEEP LINK HELPER ────────────────────────────────────────────────────────
// App URL schemes for mobile — tries to open the native app first,
// falls back to website if app not installed
const APP_SCHEMES = {
  netflix:     { ios:"nflx://",                          android:"intent://www.netflix.com#Intent;scheme=https;package=com.netflix.mediaclient;end" },
  disney:      { ios:"disneyplus://",                    android:"intent://www.disneyplus.com#Intent;scheme=https;package=com.disney.disneyplus;end" },
  max:         { ios:"max://",                           android:"intent://play.max.com#Intent;scheme=https;package=com.hbo.hbonow;end" },
  hulu:        { ios:"hulu://",                          android:"intent://www.hulu.com#Intent;scheme=https;package=com.hulu.plus;end" },
  apple:       { ios:"videos://",                        android:null },
  prime:       { ios:"aiv://",                           android:"intent://www.amazon.com#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end" },
  peacock:     { ios:"peacock://",                       android:"intent://www.peacocktv.com#Intent;scheme=https;package=com.peacocktv.peacockandroid;end" },
  paramount:   { ios:"paramountplus://",                 android:"intent://www.paramountplus.com#Intent;scheme=https;package=com.cbs.app;end" },
  crunchyroll: { ios:"crunchyroll://",                   android:"intent://www.crunchyroll.com#Intent;scheme=https;package=com.crunchyroll.crunchyroid;end" },
  espnplus:    { ios:"sportscenter://",                  android:"intent://www.espn.com#Intent;scheme=https;package=com.espn.score_center;end" },
  dazn:        { ios:"dazn://",                          android:"intent://www.dazn.com#Intent;scheme=https;package=com.dazn;end" },
  fubo:        { ios:"fubo://",                          android:"intent://www.fubo.tv#Intent;scheme=https;package=tv.fubo.mobile;end" },
  tubi:        { ios:"tubi://",                          android:"intent://tubitv.com#Intent;scheme=https;package=com.tubitv;end" },
};

function getWatchUrl(serviceId, title, webUrl) {
  // webUrl should be a TMDB watch page or platform homepage — never a search URL
  const scheme = APP_SCHEMES[serviceId];
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isIOS && scheme?.ios) return scheme.ios;
  if (isAndroid && scheme?.android) return scheme.android;
  return webUrl || "https://www.themoviedb.org";
}

function WatchButton({ serviceId, title, webUrl, movieId, style }) {
  const svc = SERVICES.find(s => s.id === serviceId);
  if (!svc) return null;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Reliable watch URL: TMDB JustWatch page > passed webUrl > platform homepage
  const reliableUrl = webUrl && webUrl.includes("themoviedb.org")
    ? webUrl
    : movieId
      ? `https://www.themoviedb.org/movie/${movieId}/watch?locale=US`
      : svc.homeUrl || `https://www.${svc.name.toLowerCase().replace(/[^a-z]/g,"")}.com/`;

  const handleWatch = (e) => {
    e.stopPropagation();
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const scheme = APP_SCHEMES[serviceId];

    // On mobile: try native app first, fall back to TMDB watch page
    if (isIOS && scheme?.ios) {
      window.location.href = scheme.ios;
      setTimeout(() => window.open(reliableUrl, "_blank"), 1500);
      return;
    }
    if (isAndroid && scheme?.android) {
      window.location.href = scheme.android;
      setTimeout(() => window.open(reliableUrl, "_blank"), 1500);
      return;
    }
    // Desktop or no app scheme — open TMDB watch page
    window.open(reliableUrl, "_blank");
  };

  return (
    <button onClick={handleWatch}
      style={{
        display:"inline-flex", alignItems:"center", gap:8,
        background:svc.color, borderRadius:10, color:"#fff",
        padding:"9px 18px", fontFamily:"var(--font-head)",
        fontWeight:800, fontSize:13, border:"none", cursor:"pointer",
        boxShadow:`0 4px 16px ${svc.color}44`,
        ...style
      }}>
      ▶ Watch on {svc.name}
      {isMobile && <span style={{fontSize:10,opacity:.8}}>📱</span>}
    </button>
  );
}

// ─── WELCOME BANNER ───────────────────────────────────────────────────────────
function WelcomeBanner() {
  return (
    <div style={{padding:"12px 14px 4px"}}>
      <div style={{
        background:"linear-gradient(135deg,rgba(139,92,246,.25) 0%,rgba(9,7,15,.9) 40%,rgba(245,158,11,.12) 100%)",
        border:"1px solid rgba(245,158,11,.25)",
        borderRadius:20,
        padding:"20px 20px",
        textAlign:"center",
        position:"relative",
        overflow:"hidden",
        boxShadow:"0 8px 32px rgba(139,92,246,.2), 0 0 0 1px rgba(245,158,11,.08)",
      }}>
        {/* Decorative background orbs */}
        <div style={{position:"absolute",top:-40,left:-40,width:180,height:180,borderRadius:"50%",background:"rgba(139,92,246,.15)",filter:"blur(40px)",pointerEvents:"none"}} />
        <div style={{position:"absolute",bottom:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(245,158,11,.1)",filter:"blur(40px)",pointerEvents:"none"}} />

        {/* Badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.25)",borderRadius:99,padding:"4px 14px",marginBottom:14,fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:.8}}>
          ✦ FREE TO START — NO CREDIT CARD REQUIRED
        </div>

        {/* THE STREAMHUB — main headline */}
        <div style={{marginBottom:12}}>
          <div style={{
            fontFamily:"var(--font-head)", fontWeight:900,
            lineHeight:1, letterSpacing:"-.03em",
            marginBottom:4,
          }}>
            <span style={{
              background:"linear-gradient(90deg,rgba(255,255,255,.7),rgba(255,255,255,.9))",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              fontSize:"clamp(16px,3.5vw,32px)", fontWeight:800, letterSpacing:".05em",
              display:"block", marginBottom:-2,
            }}>THE</span>
            <span style={{
              fontSize:"clamp(32px,8vw,72px)",
              background:"linear-gradient(90deg,#F59E0B 0%,#FBBF24 40%,#ffffff 60%,#E9D5FF 80%,#C4B5FD 100%)",
              backgroundSize:"200% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 3s linear infinite",
              filter:"drop-shadow(0 0 20px rgba(245,158,11,.6))",
              display:"inline",
            }}>Stream</span><span style={{
              fontSize:"clamp(32px,8vw,72px)",
              background:"linear-gradient(90deg,#8B5CF6,#a78bfa,#8B5CF6)",
              backgroundSize:"200% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 3s linear infinite reverse",
              filter:"drop-shadow(0 0 20px rgba(139,92,246,.8))",
              display:"inline",
            }}>Hub</span>
          </div>
        </div>

        {/* Subtext */}
        <div style={{fontSize:"clamp(11px,2vw,15px)",color:"rgba(240,240,250,.55)",maxWidth:580,margin:"0 auto 16px",lineHeight:1.7}}>
          Searches Netflix, Disney+, Max, Hulu, Crunchyroll, ESPN+, Tubi and more — all at once.
        </div>

        {/* Service dots */}
        <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
          {[
            {name:"Netflix",color:"#E50914"},
            {name:"Disney+",color:"#0063E5"},
            {name:"Max",color:"#002BE7"},
            {name:"Hulu",color:"#1CE783"},
            {name:"Prime",color:"#8B5CF6"},
            {name:"Crunchyroll",color:"#F47521"},
            {name:"ESPN+",color:"#E31837"},
            {name:"Tubi",color:"#A855F7"},
          ].map(s=>(
            <div key={s.name} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:99,padding:"4px 10px",fontSize:11,fontWeight:600,color:"rgba(240,240,250,.6)"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0}} />
              {s.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIGNUP PROMPT ────────────────────────────────────────────────────────────
// ─── SEARCH LIMIT WALL ────────────────────────────────────────────────────────
const SEARCH_LIMIT = 10;

function getSearchCount() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem("streamhub_search_data") || "{}");
  // Reset if it's a new day
  if (stored.date !== today) return 0;
  return stored.count || 0;
}

function incrementSearchCount() {
  const today = new Date().toDateString();
  const count = getSearchCount();
  localStorage.setItem("streamhub_search_data", JSON.stringify({ date: today, count: count + 1 }));
}

function resetSearchCount() {
  localStorage.removeItem("streamhub_search_data");
}

function SearchLimitWall({ onSignup, onDismiss, searchesUsed }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .3s"}}>
      <div style={{
        background:"linear-gradient(135deg,#120930,#1A1038)",
        border:"1px solid rgba(245,158,11,.4)",
        borderRadius:24, padding:"36px 32px", maxWidth:420, width:"100%",
        boxShadow:"0 32px 80px rgba(0,0,0,.8), 0 0 60px rgba(245,158,11,.1)",
        textAlign:"center", animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
      }}>
        {/* Logo */}
        <img src="/logo-clean.png" alt="" onError={e=>e.target.style.display="none"}
          style={{height:80,width:"auto",objectFit:"contain",marginBottom:20,filter:"drop-shadow(0 0 20px rgba(245,158,11,.5))"}} />

        {/* Limit reached badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",borderRadius:99,padding:"5px 14px",marginBottom:16,fontSize:12,fontWeight:700,color:"#f87171"}}>
          🔍 You've used all {SEARCH_LIMIT} free searches
        </div>

        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,marginBottom:8,lineHeight:1.2}}>
          Create a free account<br/>to keep searching
        </div>
        <div style={{fontSize:14,color:"rgba(240,240,250,.5)",marginBottom:28,lineHeight:1.7}}>
          It's completely free — no credit card needed
        </div>

        {/* Benefits */}
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:"18px 20px",marginBottom:24,textAlign:"left"}}>
          {[
            {icon:"🔍", title:"Unlimited searches", desc:"Search as much as you want"},
            {icon:"♥",  title:"Save to Watchlist", desc:"Up to 50 titles across all devices"},
            {icon:"✦",  title:"AI Picks for you",  desc:"Personalized recommendations"},
            {icon:"🆕", title:"New Releases",       desc:"Fresh drops on your services"},
            {icon:"⭐", title:"Ratings & Reviews",  desc:"Rate and review any title"},
          ].map((b,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:i<4?14:0}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{b.icon}</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,color:"var(--text)"}}>{b.title}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{b.desc}</div>
              </div>
              <div style={{marginLeft:"auto",color:"var(--sports)",fontSize:14}}>✓</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onSignup} style={{width:"100%",background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:14,color:"#000",padding:"15px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,cursor:"pointer",marginBottom:10,boxShadow:"0 8px 24px rgba(245,158,11,.35)"}}>
          🚀 Create Free Account
        </button>
        <button onClick={onDismiss} style={{background:"none",border:"none",color:"rgba(240,240,250,.3)",fontSize:13,cursor:"pointer",padding:"8px 0"}}>
          Maybe later
        </button>

        {/* Premium tease */}
        <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.06)",fontSize:12,color:"rgba(240,240,250,.3)"}}>
          Want even more? <span style={{color:"var(--gold)",fontWeight:700}}>Premium ($9.99/mo)</span> unlocks unlimited watchlist, ad-free, AI mood search & more ✦
        </div>
      </div>
    </div>
  );
}

// ─── SIGNUP PROMPT (30 second popup) ─────────────────────────────────────────
function SignupPrompt({ onSignup, onDismiss, searchesUsed }) {
  return (
    <div style={{
      position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)",
      zIndex:290, width:"calc(100% - 28px)", maxWidth:460,
      background:"linear-gradient(135deg,rgba(10,8,26,.98),rgba(18,10,36,.98))",
      border:"1px solid rgba(245,158,11,.4)",
      borderRadius:20, padding:"20px",
      boxShadow:"0 20px 60px rgba(0,0,0,.8), 0 0 40px rgba(245,158,11,.1)",
      animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
    }}>
      <button onClick={onDismiss} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:"rgba(240,240,250,.25)",fontSize:16,cursor:"pointer"}}>✕</button>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <img src="/logo-clean.png" alt="" onError={e=>e.target.style.display="none"}
          style={{height:44,width:"auto",objectFit:"contain",flexShrink:0,filter:"drop-shadow(0 0 10px rgba(245,158,11,.5))"}} />
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Join free — it's worth it</div>
          <div style={{fontSize:11,color:"rgba(240,240,250,.4)"}}>
            {searchesUsed > 0 ? `You've made ${searchesUsed} searches — keep going for free!` : "No credit card. No catch."}
          </div>
        </div>
      </div>

      {/* Benefits grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {icon:"♥",  text:"Save your Watchlist",   color:"var(--danger)"},
          {icon:"✦",  text:"Get AI Picks for you",  color:"var(--gold)"},
          {icon:"🔍", text:"Unlimited searches",     color:"var(--cyan)"},
          {icon:"🆕", text:"New Releases Alert",     color:"var(--purple)"},
        ].map((b,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"9px 10px"}}>
            <span style={{fontSize:16,color:b.color}}>{b.icon}</span>
            <span style={{fontSize:11,fontWeight:600,color:"rgba(240,240,250,.8)",lineHeight:1.3}}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onSignup} style={{flex:1,background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 6px 20px rgba(245,158,11,.3)"}}>
          🚀 Sign Up Free
        </button>
        <button onClick={onDismiss} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"rgba(240,240,250,.35)",padding:"12px 16px",fontSize:13,cursor:"pointer"}}>Later</button>
      </div>
    </div>
  );
}

// ─── PERSONALIZED AI RECOMMENDATIONS ─────────────────────────────────────────
function PersonalizedRecsModal({ onClose, user, tier, onUpgrade, watchlist, userRatings, onResults }) {
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState(null);

  const getRecs = async () => {
    if (tier !== "premium") { onUpgrade(); onClose(); return; }
    // Track weekly usage
    incrementAIPicksCount();
    setLoading(true);
    try {
      const recCount = tier === "premium" ? 6 : 3;
      const topRated = Object.entries(userRatings)
        .sort((a,b) => b[1]-a[1])
        .slice(0, tier === "premium" ? 10 : 5)
        .map(([id, rating]) => `Movie ID ${id} rated ${rating}/10`);
      const watchlistSize = watchlist.length;
      const prompt = `You are a personalized streaming expert. Based on this user's taste profile:
- They have ${watchlistSize} titles saved to their watchlist
- Their top rated titles (by ID and rating): ${topRated.join(", ") || "No ratings yet"}
- Watchlist movie IDs: ${watchlist.slice(0, tier === "premium" ? 20 : 10).join(", ") || "Empty"}

Suggest ${recCount} highly personalized movie or TV show recommendations. Focus on variety — mix genres but match the quality level of their rated titles. Return ONLY valid JSON:
{"items":[{"title":"...","year":2023,"type":"movie or tv","reason":"personalized reason based on their taste in one sentence","genre":"...","tmdb_search":"exact title"}]}`;

      const res = await fetch("/api/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:800, messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed = JSON.parse(txt.replace(/```json|```/g,"").trim());
      setRecs(parsed.items||[]);
    } catch(e) { setRecs([]); }
    setLoading(false);
  };

  useEffect(() => { if (user && tier==="premium") getRecs(); }, []);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:580,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(245,158,11,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(245,158,11,.12),rgba(139,92,246,.08))"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>✦ Personalized For You <span style={{background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99,marginLeft:6}}>PRO</span></div>
            <div style={{fontSize:13,color:"var(--muted)"}}>AI picks based on your actual taste and watchlist</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {tier !== "premium" ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>✦</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>Premium Feature</div>
              <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Our AI studies your watchlist and ratings to suggest titles you'll actually love — not just popular picks, but YOUR kind of content.</div>
              <button onClick={()=>{onUpgrade();onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"12px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>
            </div>
          ) : loading ? (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:48,height:48,border:"3px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,marginBottom:8}}>Analyzing your taste…</div>
              <div style={{color:"var(--muted)",fontSize:13}}>Looking at your watchlist and ratings to find perfect matches</div>
            </div>
          ) : recs && recs.length > 0 ? (
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:16,color:"var(--muted)"}}>PICKED JUST FOR YOU</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {recs.map((item,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:14,display:"flex",gap:12,alignItems:"flex-start",animation:`fadeUp .3s ${i*0.08}s both`}}>
                    <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(135deg,${GR[i%GR.length][0]},${GR[i%GR.length][1]})`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,position:"relative"}}>
                      {item.title.slice(0,2)}
                      <span style={{position:"absolute",top:-6,right:-6,background:"var(--gold)",color:"#000",borderRadius:99,width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>#{i+1}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14}}>{item.title} <span style={{color:"var(--muted)",fontWeight:400,fontSize:12}}>({item.year})</span></div>
                      <div style={{fontSize:11,color:"var(--gold)",marginBottom:3}}>{item.genre}</div>
                      <div style={{fontSize:12,color:"var(--muted)",margin:"3px 0",lineHeight:1.5}}>{item.reason}</div>
                      <button onClick={()=>{onResults(item.tmdb_search||item.title);onClose();}} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:8,color:"#000",padding:"5px 14px",fontSize:11,fontWeight:800,cursor:"pointer",marginTop:6}}>Find on StreamHub →</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={getRecs} style={{marginTop:16,width:"100%",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,color:"var(--gold)",padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>✦ Refresh Recommendations</button>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>📋</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,marginBottom:8}}>Add to your watchlist first!</div>
              <div style={{color:"var(--muted)",fontSize:14,lineHeight:1.6}}>Save some titles and rate a few movies so our AI can learn your taste and make personalized picks.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADVANCED STATS SECTION ───────────────────────────────────────────────────
function AdvancedStats({ user, watchlist, userRatings, watchHistory, onOpenHistory, onOpenWatchlist }) {
  const currentYear = new Date().getFullYear();
  const thisYear = watchHistory.filter(h => new Date(h.watched_at).getFullYear() === currentYear);
  const thisMonth = watchHistory.filter(h => new Date(h.watched_at).getMonth() === new Date().getMonth() && new Date(h.watched_at).getFullYear() === currentYear);
  const movies = watchHistory.filter(h => h.movie_type === "movie");
  const shows = watchHistory.filter(h => h.movie_type === "tv");
  const avgRating = Object.values(userRatings).length > 0 ? (Object.values(userRatings).reduce((a,b)=>a+b,0)/Object.values(userRatings).length).toFixed(1) : "—";
  const estHours = watchHistory.length > 0 ? `${Math.round(watchHistory.length * 1.8)}h` : "0h";
  const streak = thisMonth.length;

  const stats = [
    { icon:"📺", value:watchHistory.length, label:"Total Watched",  color:"var(--cyan)",    onClick: onOpenHistory },
    { icon:"🎬", value:movies.length,        label:"Movies",         color:"var(--gold)",    onClick: onOpenHistory },
    { icon:"📡", value:shows.length,         label:"TV Shows",       color:"var(--purple)",  onClick: onOpenHistory },
    { icon:"🗓️", value:thisYear.length,      label:`In ${currentYear}`, color:"var(--sports)", onClick: onOpenHistory },
    { icon:"⏱️", value:estHours,             label:"Est. Hours",    color:"var(--anime)",   onClick: null },
    { icon:"♥",  value:watchlist.length,     label:"Watchlisted",   color:"var(--danger)",  onClick: onOpenWatchlist },
    { icon:"★",  value:Object.keys(userRatings).length, label:"Rated", color:"var(--gold)", onClick: null },
    { icon:"📅", value:streak,               label:"This Month",    color:"var(--cyan)",    onClick: onOpenHistory },
  ];

  const ratingDist = [1,2,3,4,5,6,7,8,9,10].map(n => ({
    rating: n,
    count: Object.values(userRatings).filter(r => r === n).length
  }));
  const maxCount = Math.max(...ratingDist.map(r=>r.count), 1);

  return (
    <div style={{padding:"32px 0 20px",borderTop:"1px solid var(--border)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,padding:"0 24px"}}>
        <span style={{fontSize:24}}>📊</span>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20}}>Your Streaming Stats</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>
            {user ? "Click any card to explore your history" : "Sign in to track your stats"}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12,padding:"0 24px",marginBottom:24}}>
        {stats.map((s,i)=>(
          <div key={i}
            onClick={s.onClick||undefined}
            style={{
              background:"rgba(255,255,255,.03)",
              border:`1px solid ${s.color}22`,
              borderRadius:14, padding:"16px 14px", textAlign:"center",
              transition:"all .2s",
              cursor:s.onClick?"pointer":"default",
              position:"relative",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=`${s.color}66`;e.currentTarget.style.background=`${s.color}10`;e.currentTarget.style.transform=s.onClick?"translateY(-2px)":"none";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${s.color}22`;e.currentTarget.style.background="rgba(255,255,255,.03)";e.currentTarget.style.transform="none";}}>
            {s.onClick && <span style={{position:"absolute",top:8,right:8,fontSize:9,color:`${s.color}88`}}>→</span>}
            <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:s.color,lineHeight:1}}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:4,fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ratings distribution */}
      {Object.keys(userRatings).length > 0 && (
        <div style={{padding:"0 24px",marginBottom:24}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:14,color:"var(--muted)",letterSpacing:.5}}>YOUR RATING DISTRIBUTION · Avg {avgRating}/10</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:5,height:60}}>
            {ratingDist.map(({rating,count})=>(
              <div key={rating} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{
                  width:"100%",
                  background:count>0?"var(--gold)":"rgba(255,255,255,.06)",
                  borderRadius:"4px 4px 0 0",
                  height:`${Math.max((count/maxCount)*52,count>0?4:2)}px`,
                  transition:"height .5s",
                }}/>
                <span style={{fontSize:9,color:"var(--muted)",fontWeight:700}}>{rating}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fun facts */}
      {watchHistory.length > 0 && (
        <div style={{padding:"0 24px"}}>
          <div style={{background:"linear-gradient(135deg,rgba(139,92,246,.1),rgba(245,158,11,.06))",border:"1px solid rgba(245,158,11,.15)",borderRadius:16,padding:20}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,color:"var(--gold)",marginBottom:12,letterSpacing:.5}}>🎉 FUN FACTS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>📺 You've watched approximately <strong style={{color:"var(--gold)"}}>{estHours}</strong> of content</div>
              {movies.length > shows.length
                ? <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>🎬 You're a <strong style={{color:"var(--gold)"}}>Movie Person</strong> — {movies.length} movies vs {shows.length} shows</div>
                : shows.length > 0
                  ? <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>📡 You're a <strong style={{color:"var(--purple)"}}>TV Show Fan</strong> — {shows.length} shows vs {movies.length} movies</div>
                  : null}
              {parseFloat(avgRating) >= 8 && <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>⭐ You're a tough critic — your average rating is <strong style={{color:"var(--gold)"}}>{avgRating}/10</strong></div>}
              {watchlist.length >= 5 && <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>♥ You have <strong style={{color:"var(--anime)"}}>{watchlist.length} titles</strong> saved — that's a great weekend lineup!</div>}
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div style={{textAlign:"center",padding:"20px 24px",color:"var(--muted)",fontSize:14}}>
          Sign in to track your personal streaming stats 📊
        </div>
      )}
    </div>
  );
}

// ─── MOBILE HERO WITH TRAILER ────────────────────────────────────────────────
function MobileHero({ movie, watchlist, onSelect, onToggleWatchlist }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  useEffect(() => {
    if (!movie) return;
    setTrailerKey(null); setShowTrailer(false);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}/videos?language=en-US`).then(data => {
      const t = (data.results||[]).find(v=>v.type==="Trailer"&&v.site==="YouTube")||(data.results||[])[0];
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
  }, [movie?.id]);
  if (!movie) return null;
  const inWL = watchlist.includes(movie.id);
  return (
    <div style={{margin:"0 14px 20px",borderRadius:16,overflow:"hidden",position:"relative",height:showTrailer?220:220}}>
      {showTrailer && trailerKey
        ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2,borderRadius:16}} allow="autoplay; fullscreen" allowFullScreen />
        : movie.backdrop_path && <img src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.5}} />
      }
      {!showTrailer && <>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(9,7,15,.95) 0%,transparent 60%)"}} />
        <img src="/logo-clean.png" alt="" style={{position:"absolute",top:10,right:10,height:36,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(245,158,11,.6))",opacity:.85}} />
      </>}
      {showTrailer && <button onClick={e=>{e.stopPropagation();setShowTrailer(false);}} style={{position:"absolute",top:8,right:8,zIndex:10,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#fff",padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✕</button>}
      {!showTrailer && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 14px 14px"}}>
          <div style={{fontSize:9,fontWeight:800,color:"var(--gold)",letterSpacing:1,marginBottom:4}}>🔥 FEATURED</div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,marginBottom:6}}>{movie.title||movie.name}</div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{color:"var(--gold)",fontSize:12}}>★ {movie.vote_average?.toFixed(1)}</span>
            {(movie.providers||[]).slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small />)}
            <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
              <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 12px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,cursor:"pointer"}}>▶ Watch</button>
              {trailerKey && <button onClick={e=>{e.stopPropagation();setShowTrailer(true);}} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>🎬 Trailer</button>}
              <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,158,11,.2)":"rgba(255,255,255,.1)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.2)"}`,borderRadius:8,color:inWL?"var(--gold)":"#fff",padding:"6px 10px",fontSize:11,cursor:"pointer"}}>{inWL?"♥":"♡"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TABLET HERO WITH TRAILER ─────────────────────────────────────────────────
function TabletHero({ movie, watchlist, onSelect, onToggleWatchlist }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  useEffect(() => {
    if (!movie) return;
    setTrailerKey(null); setShowTrailer(false);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}/videos?language=en-US`).then(data => {
      const t = (data.results||[]).find(v=>v.type==="Trailer"&&v.site==="YouTube")||(data.results||[])[0];
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
  }, [movie?.id]);
  if (!movie) return null;
  const inWL = watchlist.includes(movie.id);
  return (
    <div style={{position:"relative",height:300,overflow:"hidden",cursor:showTrailer?"default":"pointer"}} onClick={()=>!showTrailer&&onSelect(movie)}>
      {showTrailer && trailerKey
        ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2}} allow="autoplay; fullscreen" allowFullScreen />
        : movie.backdrop_path && <img src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.5}} />
      }
      {!showTrailer && <>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(9,7,15,.95) 0%,rgba(9,7,15,.5) 60%,rgba(9,7,15,.1) 100%)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,transparent 50%)"}}/>
      </>}
      {showTrailer && <button onClick={e=>{e.stopPropagation();setShowTrailer(false);}} style={{position:"absolute",top:12,right:12,zIndex:10,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"#fff",padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕ Close</button>}
      {!showTrailer && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 24px 24px",display:"flex",alignItems:"flex-end",gap:20}}>
          {movie.poster_path&&<img src={`${TMDB_IMG}${movie.poster_path}`} alt="" style={{height:150,borderRadius:12,boxShadow:"0 16px 40px rgba(0,0,0,.8)",flexShrink:0}}/>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:800,color:"var(--gold)",letterSpacing:1,marginBottom:6}}>🔥 FEATURED</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,marginBottom:8}}>{movie.title||movie.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <span style={{color:"var(--gold)",fontWeight:700}}>★ {movie.vote_average?.toFixed(1)}</span>
              {(movie.providers||[]).slice(0,3).map(p=><ServiceBadge key={p} platformId={p}/>)}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"10px 22px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>▶ Watch Now</button>
              {trailerKey && <button onClick={e=>{e.stopPropagation();setShowTrailer(true);}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.25)",borderRadius:10,color:"#fff",padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>🎬 Trailer</button>}
              <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,158,11,.2)":"rgba(255,255,255,.1)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.2)"}`,borderRadius:10,color:inWL?"var(--gold)":"#fff",padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>{inWL?"♥ Saved":"♡ Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GENRE SEARCH HELPERS ────────────────────────────────────────────────────
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
export default function StreamHub() {
  const isMobile = useIsMobile();
  const device = useDevice();

  // ── Auth state ──
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ── App state ──
  const [view, setView] = useState("home");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [movies, setMovies] = useState([]);
  const [featuredRows, setFeaturedRows] = useState({ trending:[], newReleases:[], topRated:[], anime:[], sports:[] });
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [userSubs, setUserSubs] = useState(["netflix","disney","max"]);
  const [showSetup, setShowSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load saved subs from localStorage on startup (for non-logged-in users)
  useEffect(() => {
    const saved = localStorage.getItem("streamhub_subs");
    const done  = localStorage.getItem("streamhub_setup_done");
    const onboarded = localStorage.getItem("streamhub_onboarded");
    if (saved) { try { setUserSubs(JSON.parse(saved)); } catch(e) {} }
    if (!done && !onboarded) setShowOnboarding(true);  // new user → onboarding first
    else if (!done) setShowSetup(true);                 // seen onboarding, not setup yet
  }, []);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tier, setTier] = useState("free");
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // Register push subscription and store in Supabase
  const registerPush = async (userId) => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        subscription: JSON.stringify(sub),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } catch(e) { console.warn("Push registration failed:", e); }
  };

  const requestNotifications = async () => {
    if (!user) { setShowAuth(true); return; }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") { await registerPush(user.id); showToast("🔔 Notifications enabled!"); }
  };
  const [toast, setToast] = useState(null);
  const [filterPlat, setFilterPlat] = useState(null);
  const [showLeavingSoon, setShowLeavingSoon] = useState(false);
  const [showWatchHistory, setShowWatchHistory] = useState(false);
  const [showNewReleases, setShowNewReleases] = useState(false);
  const [showCostCalc, setShowCostCalc] = useState(false);

  const [favoriteTeams, setFavoriteTeams] = useState(() => {
    try { return JSON.parse(localStorage.getItem("streamhub_fav_teams")||"{}"); }
    catch { return {}; }
  });
  // favoriteTeams[sport] is now an array of team names (or legacy string)
  const getFavArr = (teams, sport) => {
    const v = teams?.[sport]; if (!v) return [];
    return Array.isArray(v) ? v : [v]; // backward compat
  };
  const toggleFavoriteTeam = (sport, teamName) => {
    setFavoriteTeams(prev => {
      const updated = { ...prev };
      if (teamName === "_clear") { delete updated[sport]; }
      else {
        const arr = getFavArr(prev, sport);
        updated[sport] = arr.includes(teamName)
          ? arr.filter(n=>n!==teamName)   // remove
          : [...arr, teamName];            // add
        if (updated[sport].length===0) delete updated[sport];
      }
      // Save to localStorage immediately
      localStorage.setItem("streamhub_fav_teams", JSON.stringify(updated));
      // Sync to Supabase in background if logged in
      supabase.auth.getSession().then(({data:{session}})=>{
        if (session?.user) {
          supabase.from("profiles")
            .update({ favorite_teams: updated })
            .eq("id", session.user.id)
            .catch(()=>{});
        }
      });
      return updated;
    });
  };
  const [showMoodSearch, setShowMoodSearch] = useState(false);
  const [showPersonalizedRecs, setShowPersonalizedRecs] = useState(false);
  const [shareContent, setShareContent] = useState(null); // {title,text,url}
  const [streak] = useState(()=>getStreak());

  const handleShareMovie = (movie, context="") => {
    const title = movie.title||movie.name||"";
    const text = context==="mood"
      ? `🎭 AI Mood Search just found me the perfect match: "${title}" — try it on The StreamHub!`
      : context==="rated"
        ? `⭐ Just rated "${title}" on The StreamHub — check it out!`
        : `📺 Watching "${title}" — found it on The StreamHub, the AI streaming assistant!`;
    setShareContent({title, text, url:"https://thestreamhub.app"});
  };
  const [watchHistory, setWatchHistory] = useState([]);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showSearchLimit, setShowSearchLimit] = useState(false);
  const [searchesUsed, setSearchesUsed] = useState(getSearchCount());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Show PWA install prompt after 60s on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem("streamhub_install_dismissed");
    if (!isMobile || dismissed) return;
    const timer = setTimeout(() => setShowInstallPrompt(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  // Show signup prompt after 30 seconds for non-logged-in users
  useEffect(() => {
    if (user) { resetSearchCount(); setSearchesUsed(0); return; }
    const dismissed = localStorage.getItem("streamhub_signup_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setShowSignupPrompt(true), 30000);
    return () => clearTimeout(timer);
  }, [user]);
  const searchTimer = useRef(null);

  const showToast = msg => setToast(msg);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user||null);
      if (session?.user) loadUserData(session.user);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((ev, session) => {
      setUser(session?.user||null);
      if (session?.user) {
        loadUserData(session.user);
      } else if (ev === "SIGNED_OUT") {
        // Only clear data when user explicitly signs out
        setWatchlist([]);
        setUserRatings({});
        setFavoriteTeams(JSON.parse(localStorage.getItem("streamhub_fav_teams")||"{}"));
      }
      // TOKEN_REFRESHED, INITIAL_SESSION etc. — do nothing extra
    });

    // ── Handle Stripe payment success ──────────────────────────────
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // Clean the URL
      window.history.replaceState({}, "", "/");
      // Wait for auth to load then upgrade
      const upgradeUser = async () => {
        const { data:{ session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from("profiles").update({ tier:"premium" }).eq("id", session.user.id);
          setTier("premium");
          showToast("🎉 Welcome to Premium! All features unlocked.");
        } else {
          // Store flag so we can upgrade after they sign in
          localStorage.setItem("streamhub_pending_upgrade", "true");
          showToast("Payment received! Sign in to activate Premium.");
        }
      };
      setTimeout(upgradeUser, 1500);
    }

    // ── Upgrade pending from before sign-in ─────────────────────────
    if (localStorage.getItem("streamhub_pending_upgrade") === "true") {
      const tryPendingUpgrade = async () => {
        const { data:{ session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from("profiles").update({ tier:"premium" }).eq("id", session.user.id);
          setTier("premium");
          localStorage.removeItem("streamhub_pending_upgrade");
          showToast("🎉 Premium activated! Welcome.");
        }
      };
      setTimeout(tryPendingUpgrade, 2000);
    }

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    // Load profile
    let { data:prof } = await supabase.from("profiles").select("*").eq("id",u.id).single();
    if (!prof) {
      await supabase.from("profiles").insert({ id:u.id, username:u.email.split("@")[0], tier:"free", setup_done:false });
      prof = { id:u.id, username:u.email.split("@")[0], tier:"free", setup_done:false };
    }
    setProfile(prof);
    setTier(prof.tier||"free");

    // Load subscriptions from profile
    if (prof.subscriptions) {
      try {
        const subs = typeof prof.subscriptions === "string" ? JSON.parse(prof.subscriptions) : prof.subscriptions;
        setUserSubs(subs);
        localStorage.setItem("streamhub_subs", JSON.stringify(subs));
      } catch(e) {}
    }

    // Load favorite teams from Supabase (overrides localStorage — cloud wins)
    if (prof.favorite_teams) {
      try {
        const ft = typeof prof.favorite_teams === "string" ? JSON.parse(prof.favorite_teams) : prof.favorite_teams;
        if (ft && typeof ft === "object") {
          setFavoriteTeams(ft);
          localStorage.setItem("streamhub_fav_teams", JSON.stringify(ft));
        }
      } catch(e) {}
    }

    // Hide setup if user already completed it
    if (prof.setup_done) {
      setShowSetup(false);
      localStorage.setItem("streamhub_setup_done", "true");
    }

    // Load watchlist
    const { data:wl } = await supabase.from("watchlist").select("movie_id").eq("user_id",u.id);
    setWatchlist((wl||[]).map(w=>w.movie_id));
    // Load ratings
    const { data:rt } = await supabase.from("ratings").select("movie_id,rating").eq("user_id",u.id);
    const ratMap = {};
    (rt||[]).forEach(r=>ratMap[r.movie_id]=r.rating);
    setUserRatings(ratMap);
    // Load watch history for stats
    const { data:wh } = await supabase.from("watch_history").select("*").eq("user_id",u.id).order("watched_at",{ascending:false});
    setWatchHistory(wh||[]);
  };

  // ── Fetch featured rows for homepage ──
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const [trendData, newData, topData, animeData, sportsData] = await Promise.all([
          tmdbFetch("/trending/all/week?language=en-US&page=1"),
          tmdbFetch("/movie/now_playing?language=en-US&page=1"),
          tmdbFetch("/movie/top_rated?language=en-US&page=1"),
          tmdbFetch("/discover/tv?with_keywords=210024&sort_by=popularity.desc&language=en-US&page=1"),
          tmdbFetch("/discover/movie?with_genres=99&with_keywords=6075|1284|2702&sort_by=popularity.desc&language=en-US&page=1"),
        ]);
        const addProviders = async (items, category) => {
          return Promise.all((items||[]).slice(0,20).map(async m => {
            const type = m.media_type==="tv"||(m.first_air_date&&!m.release_date)?"tv":"movie";
            try { const wp=await tmdbFetch(`/${type}/${m.id}/watch/providers`); return {...m,providers:getProviders(wp),category}; }
            catch { return {...m,providers:[],category}; }
          }));
        };
        const [trending,newReleases,topRated,anime,sports] = await Promise.all([
          addProviders(trendData.results,"trending"),
          addProviders(newData.results,"movies"),
          addProviders(topData.results,"movies"),
          addProviders(animeData.results,"anime"),
          addProviders(sportsData.results,"sports"),
        ]);
        setFeaturedRows({ trending, newReleases, topRated, anime, sports });
      } catch(e) { console.error(e); }
    };
    loadFeatured();
  }, []);

  // ── Fetch TMDB content ──
  useEffect(() => {
    const viewMap = {
      trending: "/trending/all/week",
      movies:   "/movie/popular",
      tv:       "/tv/popular",
      anime:    "/discover/tv?with_keywords=210024&sort_by=popularity.desc",
      sports:   "/discover/movie?with_genres=99&with_keywords=6075|1284|2702&sort_by=popularity.desc",
      watchlist: null,
    };
    const path = viewMap[view];
    if (!path) { setLoading(false); return; }
    setLoading(true);
    tmdbFetch(`${path}${path.includes('?')?'&':'?'}language=en-US&page=1`).then(async data => {
      const results = (data.results||[]).slice(0,20);
      const withProviders = await Promise.all(results.map(async m => {
        const type = m.media_type==="tv"||(m.first_air_date&&!m.release_date) ? "tv" : "movie";
        try {
          const wp = await tmdbFetch(`/${type}/${m.id}/watch/providers`);
          return { ...m, providers: getProviders(wp), category: view };
        } catch { return { ...m, providers:[], category:view }; }
      }));
      setMovies(withProviders);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [view]);

  // ── Smart Search ──
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      // Enforce search limit for non-logged-in users
      if (!user) {
        const count = getSearchCount();
        if (count >= SEARCH_LIMIT) {
          setShowSearchLimit(true);
          setSearching(false);
          return;
        }
        incrementSearchCount();
        setSearchesUsed(getSearchCount());
      }
      setSearching(true);
      track("search", { search_term: search.trim(), is_mood_search: !!isGenreSearch(search) });
      try {
        const genreConfig = isGenreSearch(search);
        if (genreConfig) {
          // Genre/mood search
          const results = await doGenreSearch(genreConfig);
          setSearchResults(results);
        } else {
          // Title search
          const data = await tmdbFetch(`/search/multi?query=${encodeURIComponent(search)}&language=en-US&page=1`);
          const results = (data.results||[]).filter(r=>r.media_type!=="person").slice(0,20);
          const withProviders = await Promise.all(results.map(async m => {
            const type = m.media_type==="tv" ? "tv" : "movie";
            try {
              const wp = await tmdbFetch(`/${type}/${m.id}/watch/providers`);
              return { ...m, providers:getProviders(wp), category:m.media_type };
            } catch { return { ...m, providers:[], category:m.media_type }; }
          }));
          setSearchResults(withProviders);
        }
      } catch(e) { console.error(e); }
      setSearching(false);
    }, 500);
  }, [search]);

  // ── Watchlist ──
  const toggleWatchlist = async (movieId) => {
    if (!user) {
      showToast("Sign up free to save your watchlist! 👤");
      track("watchlist_attempt_no_auth");
      return; // Just toast - don't show blocking prompt
    }
    const inWL = watchlist.includes(movieId);
    const FREE_WL_LIMIT = 50;
    if (!inWL && tier !== "premium" && watchlist.length >= FREE_WL_LIMIT) {
      showToast("Upgrade to Premium for unlimited watchlist! ✦");
      setShowUpgrade(true);
      return;
    }
    if (inWL) {
      setWatchlist(prev=>prev.filter(x=>x!==movieId));
      await supabase.from("watchlist").delete().eq("user_id",user.id).eq("movie_id",movieId);
      showToast("Removed from watchlist");
      track("watchlist_remove", { movie_id: movieId });
    } else {
      setWatchlist(prev=>[...prev,movieId]);
      await supabase.from("watchlist").insert({user_id:user.id,movie_id:movieId});
      showToast("Added to watchlist ♥");
      track("watchlist_add", { movie_id: movieId });
    }
  };

  const handleSaveUserSubs = async (subs) => {
    setUserSubs(subs);
    localStorage.setItem("streamhub_subs", JSON.stringify(subs));
    localStorage.setItem("streamhub_setup_done", "true");
    setShowSetup(false);
    track("setup_complete", { services_count: subs.length });
    if (user) {
      await supabase.from("profiles").update({
        subscriptions: JSON.stringify(subs),
        setup_done: true,
      }).eq("id", user.id);
    }
  };

  // Load saved subs from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem("streamhub_subs");
    if (saved) {
      try { setUserSubs(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const handleSelectMovie = (movie) => {
    if (!movie) return;
    setSelectedMovie(movie);
  };

  const handleSportSearch = (query) => {
    setSearch(query);
    setView("sports");
  };

  const handleSetView = (v) => { setView(v); track("tab_change", { tab: v }); };

  const handleRate = (movieId, val) => {
    setUserRatings(p=>({...p,[movieId]:val}));
  };

  const markAsWatched = async (movie) => {
    if (!user) return showToast("Sign in to track history! 👤");
    await supabase.from("watch_history").upsert({
      user_id: user.id,
      movie_id: movie.id,
      movie_title: movie.title||movie.name||"",
      movie_poster: movie.poster_path||null,
      movie_type: movie.first_air_date ? "tv" : "movie",
    }, { onConflict:"user_id,movie_id" });
    showToast("Added to watch history ✅");
    track("mark_watched", { movie_title: movie.title||movie.name, movie_type: movie.first_air_date?"tv":"movie" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
    showToast("Signed out 👋");
    track("sign_out");
  };

  // ── Display movies ──
  const displayMovies = search.trim() ? searchResults : view==="watchlist"
    ? movies.filter(m=>watchlist.includes(m.id))
    : movies;

  const filtered = displayMovies.filter(m => !filterPlat || m.providers?.includes(filterPlat));

  const subscribed = SERVICES.filter(s=>userSubs.includes(s.id));
  const unsubscribed = SERVICES.filter(s=>!userSubs.includes(s.id));

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)",paddingBottom:80}}>
        {/* Mobile Header */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(9,7,15,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(245,158,11,.1)",paddingTop:"env(safe-area-inset-top)"}}>
          {/* Top row - logo + buttons */}
          <div style={{display:"flex",alignItems:"center",padding:"10px 14px 8px",gap:10}}>
            {/* Home button + Logo */}
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>{setView("home");setSearch("");}}
                style={{background:view==="home"&&!search.trim()?"rgba(245,158,11,.15)":"rgba(255,255,255,.06)",border:`1px solid ${view==="home"&&!search.trim()?"rgba(245,158,11,.4)":"rgba(255,255,255,.1)"}`,borderRadius:10,color:view==="home"&&!search.trim()?"var(--gold)":"var(--muted)",width:36,height:36,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                🏠
              </button>
              <img
                src="/logo-clean.png"
                alt="The StreamHub"
                onClick={()=>{setView("home");setSearch("");}}
                onError={e=>e.target.style.display="none"}
                style={{
                  height:64, width:"auto", maxWidth:180,
                  objectFit:"contain", cursor:"pointer",
                  filter:"drop-shadow(0 0 10px rgba(245,158,11,.5)) drop-shadow(0 0 20px rgba(139,92,246,.3))",
                  animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3s ease-in-out infinite",
                }}
              />
            </div>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:99,fontFamily:"var(--font-head)",flexShrink:0}}>✦ PRO</span>
              :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"var(--gold)",border:"none",borderRadius:9,color:"#000",padding:"7px 12px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>Upgrade ✦</button>
            }
            <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{
                width:36,height:36,borderRadius:"50%",
                background:"var(--purple)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,
                border:tier==="premium"?"2.5px solid #F59E0B":"2px solid rgba(139,92,246,.4)",
                boxShadow:tier==="premium"?"0 0 12px rgba(245,158,11,.5)":"none",
                color:"#fff",flexShrink:0,cursor:"pointer",
                overflow:"hidden",padding:0,
                transition:"all .3s",
              }}>
                {user && profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : user?(profile?.username||user.email||"U")[0].toUpperCase():"?"
                }
              </button>
          </div>
          {/* Search bar - full width, prominent */}
          <div style={{padding:"0 14px 10px",position:"relative"}}>
            <span style={{position:"absolute",left:26,top:"50%",transform:"translateY(-60%)",color:"var(--gold)",fontSize:16}}>🔍</span>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by title, genre or mood…"
              style={{
                width:"100%", background:"rgba(255,255,255,.1)",
                border:"1.5px solid rgba(245,158,11,.4)",
                borderRadius:14, color:"var(--text)",
                padding:"12px 16px 12px 38px",
                fontSize:15, outline:"none",
                boxShadow:"0 2px 16px rgba(245,158,11,.1)",
              }}
            />
          </div>

        </div>

        {/* WelcomeBanner for new users — above brand banner */}
        {!user && view==="home" && !search.trim() && <WelcomeBanner />}

        {/* 🎭 AI BRAND BANNER — mobile, right under search bar */}
        {!search.trim() && view==="trending" && (
          <div style={{
            margin:"4px 14px 16px",
            borderRadius:20,
            overflow:"hidden",
            position:"relative",
            background:"linear-gradient(135deg,#0d0520 0%,#12053a 40%,#0a1628 100%)",
            border:"1px solid rgba(139,92,246,.35)",
            boxShadow:"0 8px 40px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.06)",
            padding:"18px 16px 16px",
            textAlign:"center",
          }}>
            {/* glow blobs */}
            <div style={{position:"absolute",top:-30,left:-30,width:120,height:120,borderRadius:"50%",background:"rgba(139,92,246,.25)",filter:"blur(40px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,107,157,.2)",filter:"blur(40px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:160,height:80,borderRadius:"50%",background:"rgba(6,182,212,.12)",filter:"blur(30px)",pointerEvents:"none"}}/>
            {/* tagline */}
            <div style={{
              fontFamily:"var(--font-head)", fontWeight:800,
              fontSize:20, letterSpacing:"-.02em", marginBottom:12,
              background:"linear-gradient(90deg,#C4B5FD,#E9D5FF,#F59E0B,#C4B5FD)",
              backgroundSize:"200% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 3s linear infinite",
              position:"relative",
            }}>Your AI Streaming Assistant</div>
            {/* pills */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,position:"relative",width:"100%"}}>
              {[
                {word:"SEARCH", bg:"#F59E0B", glow:"rgba(245,158,11,.7)"},
                {word:"FIND",   bg:"#8B5CF6", glow:"rgba(139,92,246,.7)"},
                {word:"ENJOY",  bg:"#FFFFFF", glow:"rgba(255,255,255,.6)"},
              ].map((item,i)=>(
                <div key={item.word} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{
                    background:item.bg, borderRadius:99,
                    padding:"7px 11px",
                    fontFamily:"var(--font-head)", fontWeight:900,
                    fontSize:11, letterSpacing:1.5, color:"#000",
                    boxShadow:`0 0 14px ${item.glow}, 0 0 28px ${item.glow}66`,
                    whiteSpace:"nowrap",
                  }}>{item.word}</div>
                  {i<2 && <span style={{color:"rgba(255,255,255,.35)",fontSize:12,fontWeight:700}}>—</span>}
                </div>
              ))}
            </div>
            {/* Mood Search CTA with usage info */}
            <button onClick={()=>setShowMoodSearch(true)}
              style={{marginTop:12,background:"rgba(139,92,246,.2)",border:"1px solid rgba(139,92,246,.5)",borderRadius:12,color:"#c4b5fd",padding:"10px 16px",fontSize:11,fontWeight:700,fontFamily:"var(--font-head)",cursor:"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <span>🎭 Try Mood Search — describe any vibe</span>
              <span style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:"3px 8px",fontSize:10,fontWeight:600,color:"rgba(196,181,253,.7)",whiteSpace:"nowrap"}}>
                "🎭 Free for everyone"
              </span>
            </button>

          </div>
        )}

        {/* Search status */}
        {search.trim() && (
          <div style={{padding:"12px 14px 0",fontSize:13,color:"var(--muted)"}}>
            {searching?"Searching…":`${searchResults.length} results for "${search}"`}
          </div>
        )}

        {/* Daily Pick Banner */}
        {view==="home"&&!search.trim()&&featuredRows.trending?.length>0&&(
          <DailyPickBanner
            movie={(featuredRows.trending||[]).filter(m=>(m.providers||[]).length>0)[new Date().getDay()%Math.max(1,(featuredRows.trending||[]).filter(m=>(m.providers||[]).length>0).slice(0,8).length)]||featuredRows.topRated?.[0]}
            onSelect={handleSelectMovie}
            onShare={(m)=>handleShareMovie(m)}
          />
        )}

        {/* Sports Hub standalone button */}
        <div style={{padding:"0 14px 12px"}}>
          <button onClick={()=>{setView("sports");setSearch("");}}
            style={{
              width:"100%",
              background:"linear-gradient(135deg,rgba(7,15,7,.95) 0%,rgba(10,30,15,.95) 50%,rgba(5,20,10,.95) 100%)",
              border:"1.5px solid rgba(16,185,129,.45)",
              borderRadius:16, padding:"13px 16px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              cursor:"pointer",
              boxShadow:"0 4px 24px rgba(16,185,129,.15), inset 0 1px 0 rgba(16,185,129,.1)",
              transition:"all .2s",
            }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(.98)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{position:"relative",width:42,height:42,borderRadius:12,background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:22,animation:"trophyBounce 2s ease-in-out infinite, sportsGlow 2s ease-in-out infinite"}}>🏆</span>
                <div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",border:"1.5px solid var(--bg)",boxShadow:"0 0 6px #ef4444"}}/>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:"#fff",marginBottom:2}}>Sports Hub</div>
                <div style={{fontSize:11,color:"rgba(16,185,129,.8)",fontWeight:600}}>Live scores · Schedules · World Cup 🔴</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.35)",borderRadius:99,padding:"3px 8px",fontSize:9,fontWeight:800,color:"#ef4444",letterSpacing:.5}}>LIVE</div>
              <span style={{color:"rgba(16,185,129,.6)",fontSize:16}}>›</span>
            </div>
          </button>
        </div>

        {/* Mobile Premium Tools Strip */}
        <div style={{padding:"0 14px 16px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
          <div style={{display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
            {[
              {icon:"✦", label:"For You",      sub:"Personalized picks from your taste",  onClick:()=>setShowPersonalizedRecs(true), color:"#F59E0B",grad:"rgba(245,158,11,.1)"},

              {icon:"🚨", label:"Leaving Soon", sub:"Titles leaving your services soon",    onClick:()=>setShowLeavingSoon(true),       color:"#EF4444",grad:"rgba(239,68,68,.1)"},
              {icon:"🆕", label:"New Releases", sub:"Fresh drops on streaming now",         onClick:()=>setShowNewReleases(true),       color:"#8B5CF6",grad:"rgba(139,92,246,.08)"},
              {icon:"💰", label:"Cost Report",  sub:"AI tells you what to keep or cut",     onClick:()=>setShowCostCalc(true),          color:"#10B981",grad:"rgba(16,185,129,.1)"},
            ].map(item=>(
              <button key={item.label} onClick={item.onClick}
                style={{flexShrink:0,background:item.grad,border:`1.5px solid ${item.color}55`,borderRadius:16,padding:"14px 14px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",minWidth:144,transition:"all .2s",position:"relative"}}
                onTouchStart={e=>e.currentTarget.style.borderColor=`${item.color}cc`}
                onTouchEnd={e=>e.currentTarget.style.borderColor=`${item.color}55`}>
                {item.live && <div style={{position:"absolute",top:8,right:8,background:"#ef4444",borderRadius:99,padding:"2px 6px",fontSize:8,fontWeight:900,color:"#fff",animation:"pulse 1.5s infinite"}}>LIVE</div>}
                {!item.live && tier!=="premium" && <div style={{position:"absolute",top:8,right:8,background:"var(--gold)",color:"#000",fontSize:7,fontWeight:900,padding:"2px 5px",borderRadius:99}}>PRO</div>}
                <span style={{fontSize:28,lineHeight:1,animation:item.live?"trophyBounce 2s ease-in-out infinite":undefined}}>{item.icon}</span>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:"#fff"}}>{item.label}</div>
                <div style={{fontSize:10,color:"rgba(240,240,250,.5)",lineHeight:1.4}}>{item.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Hero + Featured Rows for trending */}
        {view==="home"&&!search.trim() ? (
          <div>
            {/* Other featured rows */}
            {[
              {title:"New in Cinemas",icon:"🎬",key:"newReleases",color:"var(--cyan)"},
              {title:"Top Rated",icon:"⭐",key:"topRated",color:"var(--purple)"},
              {title:"Anime",icon:"✦",key:"anime",color:"var(--anime)"},
              {title:"Sports & Docs",icon:"🏆",key:"sports",color:"var(--sports)"},
            ].map(row=>(
              <div key={row.key} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 14px",marginBottom:10}}>
                  <span>{row.icon}</span>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:row.color}}>{row.title}</div>
                </div>
                <div style={{display:"flex",gap:10,overflowX:"auto",padding:"2px 14px 4px",scrollbarWidth:"none"}}>
                  {(featuredRows[row.key]||[]).slice(0,10).map(m=>(
                    <div key={m.id} style={{flexShrink:0,width:130}}>
                      <MovieCard movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
                ) : view==="trending" ? (
          <div style={{padding:"0 14px 20px"}}>
            <div style={{paddingTop:16,paddingBottom:8}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,marginBottom:2}}>🔥 Top 10 Trending</div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Across all streaming services · Updated daily</div>
            </div>
            <Top10TrendingSection movies={featuredRows.trending} onSelect={handleSelectMovie} userSubs={userSubs}/>
          </div>
        ) : view==="sports" ? (
          /* ── DEDICATED SPORTS HUB ── */
          <div style={{padding:"12px 14px",overflowY:"auto",flex:1}}>
            {!search.trim() ? (
              <>
                <TeamNextGameSearch favoriteTeams={favoriteTeams}/>
                <SportCategoryGrid onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                <SportsStreamingGuide onSearch={handleSportSearch}/>
              </>
            ) : (
              <>
                <button onClick={()=>setSearch("")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:99,color:"var(--muted)",padding:"5px 12px",fontSize:12,cursor:"pointer",marginBottom:14}}>← Back to Sports</button>
                {search==="soccer_hub" ? <SoccerHub onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                  : search.toLowerCase().includes("olympic") ? <OlympicsPlaceholder/>
                  : <><LiveSportsSection sportQuery={search} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavoriteTeam}/><SportMovieBridge activeSport={search} onSelect={handleSelectMovie}/></>}
              </>
            )}
          </div>
        ) : (
          /* Regular grid */
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,padding:"12px 14px"}}>
            {loading&&!search
              ? Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)
              : filtered.length===0
                ? <div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--muted)",padding:"60px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty. Tap ♡ to save titles!":"No results found."}</div>
                : filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)
            }
          </div>
        )}

        <MobileBottomNav view={view} setView={v=>{handleSetView(v);setSearch("");}} watchlist={watchlist} tier={tier} onProfile={()=>user?setShowProfile(true):setShowAuth(true)} />

        {/* Advanced Stats Section */}
        <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} onOpenHistory={()=>setShowWatchHistory(true)} onOpenWatchlist={()=>handleSetView("watchlist")}/>

        {/* Spacer so content scrolls fully above bottom nav + tagline */}
        <div style={{height:160}} />

      </div>

      {/* Modals */}
      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:'movie'})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} userSubs={userSubs} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}} notifPermission={notifPermission} onRequestNotif={requestNotifications} streak={streak}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showOnboarding&&<OnboardingModal onFinish={()=>{setShowOnboarding(false);setShowSetup(true);}}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} profile={profile}/>}
      {showNewReleases&&<NewReleasesModal onClose={()=>setShowNewReleases(false)} user={user} tier={tier} userSubs={userSubs} onSelect={handleSelectMovie} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {shareContent&&<ShareModal title={shareContent.title} text={shareContent.text} url={shareContent.url} onClose={()=>setShareContent(null)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      <CookieConsent/>
      <Analytics />
    </>
  );

  // ─── TABLET LAYOUT ───────────────────────────────────────────────────────────
  if (device === "tablet") return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)",paddingBottom:72}}>
        {/* Tablet Header */}
        <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(9,7,15,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(245,158,11,.15)",paddingTop:"env(safe-area-inset-top)"}}>
          <div style={{display:"flex",alignItems:"center",padding:"10px 20px",gap:12,height:64}}>
            <div style={{flex:1,position:"relative",maxWidth:400}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontSize:15}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, genre or mood…"
                style={{width:"100%",background:"rgba(255,255,255,.07)",border:"2px solid rgba(245,158,11,.45)",borderRadius:12,color:"var(--text)",padding:"9px 14px 9px 38px",fontSize:14,outline:"none",boxShadow:"0 0 16px rgba(245,158,11,.12)"}}
                onFocus={e=>{e.target.style.border="2px solid #F59E0B";e.target.style.boxShadow="0 0 24px rgba(245,158,11,.3)";}}
                onBlur={e=>{e.target.style.border="2px solid rgba(245,158,11,.45)";e.target.style.boxShadow="0 0 16px rgba(245,158,11,.12)";}}
              />
            </div>
            <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
              {tier==="premium"
                ?<span style={{background:"var(--gold)",color:"#000",fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,fontFamily:"var(--font-head)"}}>✦ PREMIUM</span>
                :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"9px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,boxShadow:"0 0 16px rgba(245,158,11,.35)",cursor:"pointer"}}>Upgrade ✦</button>
              }
              {!user
                ?<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",border:"1px solid rgba(139,92,246,.4)",borderRadius:10,color:"#fff",padding:"9px 16px",fontWeight:800,fontSize:13,fontFamily:"var(--font-head)",boxShadow:"0 0 16px rgba(139,92,246,.35)",cursor:"pointer"}}>👤 Sign In</button>
                :<button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{
                width:36,height:36,borderRadius:"50%",
                background:"var(--purple)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,
                border:tier==="premium"?"2.5px solid #F59E0B":"2px solid rgba(139,92,246,.4)",
                boxShadow:tier==="premium"?"0 0 12px rgba(245,158,11,.5)":"none",
                color:"#fff",flexShrink:0,cursor:"pointer",
                overflow:"hidden",padding:0,
                transition:"all .3s",
              }}>
                {user && profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : user?(profile?.username||user.email||"U")[0].toUpperCase():"?"
                }
              </button>
              }
            </div>
          </div>

        </header>

        {/* Tablet Hero with Trailer */}
        {!user && view==="home" && !search.trim() && <WelcomeBanner />}

        {/* 🎭 AI BRAND BANNER — tablet, above hero */}
        {view==="home"&&!search.trim()&&(
          <div style={{
            margin:"12px 20px 0",
            borderRadius:24,
            overflow:"hidden",
            position:"relative",
            background:"linear-gradient(135deg,#0d0520 0%,#12053a 40%,#0a1628 100%)",
            border:"1px solid rgba(139,92,246,.35)",
            boxShadow:"0 12px 60px rgba(139,92,246,.3), inset 0 1px 0 rgba(255,255,255,.07)",
            padding:"22px 106px",
          }}>
            {/* glow blobs */}
            <div style={{position:"absolute",top:-40,left:-40,width:200,height:200,borderRadius:"50%",background:"rgba(139,92,246,.2)",filter:"blur(60px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(255,107,157,.15)",filter:"blur(60px)",pointerEvents:"none"}}/>
            {/* Left glowing logo — absolutely centered vertically */}
            <img src="/logo-clean.png" alt="" style={{
              position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              height:72, width:"auto", objectFit:"contain",
              filter:"drop-shadow(0 0 18px rgba(245,158,11,.8)) drop-shadow(0 0 36px rgba(139,92,246,.6))",
              animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3s ease-in-out infinite",
            }}/>
            {/* Center content */}
            <div style={{textAlign:"center"}}>
              <div style={{
                fontFamily:"var(--font-head)", fontWeight:800,
                fontSize:22, letterSpacing:"-.02em", marginBottom:12, lineHeight:1.2,
                background:"linear-gradient(90deg,#C4B5FD,#E9D5FF,#F59E0B,#C4B5FD)",
                backgroundSize:"200% auto",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                animation:"gradientShift 3s linear infinite",
              }}>Your AI Streaming Assistant</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10,flexWrap:"nowrap"}}>
                {[
                  {word:"SEARCH", bg:"#F59E0B", glow:"rgba(245,158,11,.7)"},
                  {word:"FIND",   bg:"#8B5CF6", glow:"rgba(139,92,246,.7)"},
                  {word:"ENJOY",  bg:"#FFFFFF", glow:"rgba(255,255,255,.6)"},
                ].map((item,i)=>(
                  <div key={item.word} style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{
                      background:item.bg, borderRadius:99,
                      padding:"8px 16px",
                      fontFamily:"var(--font-head)", fontWeight:900,
                      fontSize:12, letterSpacing:2, color:"#000",
                      boxShadow:`0 0 16px ${item.glow}, 0 0 32px ${item.glow}55`,
                      whiteSpace:"nowrap",
                    }}>{item.word}</div>
                    {i<2 && <span style={{color:"rgba(255,255,255,.35)",fontSize:14,fontWeight:700}}>—</span>}
                  </div>
                ))}
              </div>
              {/* Mood Search CTA with usage info — centered */}
              <div style={{display:"flex",justifyContent:"center",marginTop:10,pointerEvents:"all"}}>
                <button onClick={()=>setShowMoodSearch(true)}
                  style={{background:"rgba(139,92,246,.2)",border:"1px solid rgba(139,92,246,.5)",borderRadius:12,color:"#c4b5fd",padding:"9px 18px",fontSize:11,fontWeight:700,fontFamily:"var(--font-head)",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:12,transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(139,92,246,.35)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(139,92,246,.2)"}>
                  <span>🎭 Try Mood Search — describe any vibe</span>
                  <span style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:"3px 10px",fontSize:10,fontWeight:600,color:"rgba(196,181,253,.7)",whiteSpace:"nowrap"}}>
                    "🎭 Free"
                  </span>
                </button>
              </div>

            </div>
            {/* Right glowing logo — absolutely centered vertically */}
            <img src="/logo-clean.png" alt="" style={{
              position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
              height:72, width:"auto", objectFit:"contain",
              filter:"drop-shadow(0 0 18px rgba(245,158,11,.8)) drop-shadow(0 0 36px rgba(139,92,246,.6))",
              animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3.4s ease-in-out infinite",
            }}/>
          </div>
        )}

        {/* Tablet Hero with Trailer */}


        {/* Tablet Grid */}
        <div style={{padding:"20px 20px 120px"}}>
          {/* Tablet Premium Tools */}
          <div style={{marginBottom:24}}>
            {/* Sports Hub Button */}
            <button onClick={()=>{setView("sports");setSearch("");}}
              style={{
                width:"100%", marginBottom:14,
                background:"linear-gradient(135deg,rgba(7,15,7,.95),rgba(10,30,15,.95))",
                border:"1.5px solid rgba(16,185,129,.4)", borderRadius:16,
                padding:"14px 18px", display:"flex", alignItems:"center",
                justifyContent:"space-between", cursor:"pointer",
                boxShadow:"0 4px 20px rgba(16,185,129,.12)",
              }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{position:"relative",width:44,height:44,borderRadius:12,background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:22,animation:"trophyBounce 2s ease-in-out infinite, sportsGlow 2s ease-in-out infinite"}}>🏆</span>
                  <div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",border:"1.5px solid var(--bg)",boxShadow:"0 0 6px #ef4444"}}/>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:"#fff",marginBottom:2}}>Sports Hub</div>
                  <div style={{fontSize:12,color:"rgba(16,185,129,.8)"}}>Live scores · Schedules · World Cup 🔴</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.35)",borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:800,color:"#ef4444"}}>LIVE</div>
                <span style={{color:"rgba(16,185,129,.6)",fontSize:18}}>›</span>
              </div>
            </button>
            <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:12,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[
                {icon:"✦", label:"For You",      sub:"Personalized picks from your taste",         onClick:()=>setShowPersonalizedRecs(true),color:"#F59E0B",grad:"rgba(245,158,11,.1)"},
                {icon:"🚨", label:"Leaving Soon", sub:"Titles leaving your services soon",          onClick:()=>setShowLeavingSoon(true),color:"#EF4444",grad:"rgba(239,68,68,.1)"},
                {icon:"🆕", label:"New Releases", sub:"Fresh drops across all streaming platforms", onClick:()=>setShowNewReleases(true),color:"#8B5CF6",grad:"rgba(139,92,246,.08)"},
                {icon:"💰", label:"Cost Report",  sub:"AI tells you what to keep or cut",          onClick:()=>setShowCostCalc(true),color:"#10B981",grad:"rgba(16,185,129,.1)"},
              ].map(item=>(
                <button key={item.label} onClick={item.onClick}
                  style={{background:item.grad,border:`1.5px solid ${item.color}55`,borderRadius:14,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",transition:"all .2s",width:"100%",position:"relative",textAlign:"left"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${item.color}aa`;e.currentTarget.style.background=`${item.color}18`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=`${item.color}55`;e.currentTarget.style.background=item.grad;}}>
                  {tier!=="premium"&&<div style={{position:"absolute",top:8,right:8,background:"var(--gold)",color:"#000",fontSize:7,fontWeight:900,padding:"2px 5px",borderRadius:99}}>PRO</div>}
                  <span style={{fontSize:26,lineHeight:1}}>{item.icon}</span>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:"#fff",marginTop:2}}>{item.label}</div>
                  <div style={{fontSize:10,color:"rgba(240,240,250,.5)",lineHeight:1.4}}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>
          {view==="home"&&!search.trim() ? (
            <div>
              {[{title:"Trending",icon:"🔥",key:"trending",color:"var(--gold)"},{title:"New in Cinemas",icon:"🎬",key:"newReleases",color:"var(--cyan)"},{title:"Top Rated",icon:"⭐",key:"topRated",color:"var(--purple)"},{title:"Anime",icon:"✦",key:"anime",color:"var(--anime)"},{title:"Sports & Docs",icon:"🏆",key:"sports",color:"var(--sports)"}].map(row=>(
                <div key={row.key} style={{marginBottom:32}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <span style={{fontSize:18}}>{row.icon}</span>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,color:row.color}}>{row.title}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {(featuredRows[row.key]||[]).slice(0,8).map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                  </div>
                </div>
              ))}
            </div>
                  ) : view==="trending" ? (
          <div style={{padding:"0 14px 20px"}}>
            <div style={{paddingTop:16,paddingBottom:8}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,marginBottom:2}}>🔥 Top 10 Trending</div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Across all streaming services · Updated daily</div>
            </div>
            <Top10TrendingSection movies={featuredRows.trending} onSelect={handleSelectMovie} userSubs={userSubs}/>
          </div>
        ) : view==="sports" ? (
            /* ── DEDICATED SPORTS HUB — tablet ── */
            <div>
              {!search.trim() ? (
                <>
                  <TeamNextGameSearch favoriteTeams={favoriteTeams}/>
                <SportCategoryGrid onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                  <SportsStreamingGuide onSearch={handleSportSearch}/>
                </>
              ) : (
                <>
                  <button onClick={()=>setSearch("")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:99,color:"var(--muted)",padding:"5px 12px",fontSize:12,cursor:"pointer",marginBottom:16}}>← Back to Sports</button>
                  {search==="soccer_hub" ? <SoccerHub onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                    : search.toLowerCase().includes("olympic") ? <OlympicsPlaceholder/>
                    : <><LiveSportsSection sportQuery={search} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavoriteTeam}/><SportMovieBridge activeSport={search} onSelect={handleSelectMovie}/></>}
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,marginBottom:16}}>
                {search.trim() ? (searching?"Searching…":`${searchResults.length} results for "${search}"`) : CATEGORY_TABS.find(t=>t.id===view)?.icon+" "+CATEGORY_TABS.find(t=>t.id===view)?.label}
                {!search&&!loading&&<span style={{fontWeight:400,fontSize:14,color:"var(--muted)",marginLeft:10}}>{filtered.length} titles</span>}
              </div>
              {loading&&!search
                ?<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
                :filtered.length===0
                  ?<div style={{textAlign:"center",color:"var(--muted)",padding:"80px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty!":"No results found."}</div>
                  :<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                  </div>
              }
            </>
          )}
        </div>

        {/* Advanced Stats Section */}
        <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} onOpenHistory={()=>setShowWatchHistory(true)} onOpenWatchlist={()=>handleSetView("watchlist")}/>

        {/* Spacer so content scrolls above bottom nav */}
        <div style={{height:100}} />

        {/* Tablet Bottom Nav */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(9,7,15,.98)",borderTop:"1px solid rgba(245,158,11,.1)",display:"flex",backdropFilter:"blur(20px)"}}>
          {[
            {id:"top10",     icon:"🔥", label:"Top 10",     color:"#F59E0B", anim:null},
            {id:"movies",  icon:"🎬",label:"Movies",  color:"#06B6D4",anim:null},
            {id:"tv",      icon:"📺",label:"TV",      color:"#A78BFA",anim:"tvFlicker"},
            {id:"anime",   icon:"✦", label:"Anime",   color:"#FF6B9D",anim:"swordSwing"},
            {id:"watchlist",icon:"♥",label:"Watchlist",color:"#F59E0B",anim:null},
          ].map(t=>{
            const active=view===t.id;
            return <button key={t.id} onClick={()=>{setView(t.id);setSearch("");}}
              style={{flex:1,background:"none",border:"none",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:active?t.color:"rgba(240,240,250,.35)",position:"relative",cursor:"pointer"}}>
              {t.special ? (
                <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                  {!active && <div style={{position:"absolute",inset:-4,borderRadius:"50%",animation:"sportsTabPulse 2s ease-in-out infinite",pointerEvents:"none"}}/>}
                  <span style={{fontSize:22,lineHeight:1,display:"inline-block",animation:`trophyBounce 2s ease-in-out infinite, sportsGlow ${active?"1s":"2s"} ease-in-out infinite`,filter:active?`drop-shadow(0 0 12px #10B981) drop-shadow(0 0 24px rgba(245,158,11,.5))`:`drop-shadow(0 0 6px rgba(16,185,129,.6))`}}>🏆</span>
                  <div style={{position:"absolute",top:-2,right:-4,width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s ease-in-out infinite",boxShadow:"0 0 6px #ef4444"}}/>
                </div>
              ) : (
                <span style={{fontSize:22,lineHeight:1,filter:active?`drop-shadow(0 0 8px ${t.color}cc)`:"none",display:"inline-block",animation:active&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none"}}>{t.icon}</span>
              )}
              <span style={{fontSize:10,fontWeight:800,fontFamily:"var(--font-head)",color:t.special?(active?"#10B981":"rgba(16,185,129,.8)"):(active?t.color:"rgba(240,240,250,.35)")}}>{t.label}</span>
              {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:36,height:2.5,background:t.color,borderRadius:99,boxShadow:`0 0 8px ${t.color}`}}/>}
            </button>;
          })}
          <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{flex:1,background:"none",border:"none",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:"rgba(240,240,250,.35)",cursor:"pointer"}}>
            <span style={{fontSize:22}}>👤</span>
            <span style={{fontSize:10,fontWeight:800,fontFamily:"var(--font-head)"}}>Profile</span>
          </button>
        </div>
      </div>

      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:'movie'})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} userSubs={userSubs} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}} notifPermission={notifPermission} onRequestNotif={requestNotifications} streak={streak}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showOnboarding&&<OnboardingModal onFinish={()=>{setShowOnboarding(false);setShowSetup(true);}}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} profile={profile}/>}
      {showNewReleases&&<NewReleasesModal onClose={()=>setShowNewReleases(false)} user={user} tier={tier} userSubs={userSubs} onSelect={handleSelectMovie} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {shareContent&&<ShareModal title={shareContent.title} text={shareContent.text} url={shareContent.url} onClose={()=>setShareContent(null)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      <CookieConsent/>
      <Analytics />
    </>
  );

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        {/* Header */}
        <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(9,7,15,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(245,158,11,.15)",padding:"0 20px",height:64,display:"flex",alignItems:"center",gap:12}}>
          <nav style={{display:"flex",gap:2,marginLeft:8,flexShrink:0}}>
            <button onClick={()=>{setView("home");setSearch("");window.scrollTo(0,0);}}
              style={{background:"none",border:"none",color:view==="home"&&!search?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"6px 10px",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              🏠 Home
            </button>
            {CATEGORY_TABS.filter(t=>t.id!=="search").map(t=>(
              <button key={t.id} onClick={()=>{setView(t.id);setSearch("");}}
                style={{background:view===t.id?`${t.color}15`:"none",border:"none",color:view===t.id?t.color:"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"6px 10px",borderRadius:9,transition:"all .2s",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",boxShadow:view===t.id?`0 0 14px ${t.color}30`:"none",cursor:"pointer"}}>
                <span style={{display:"inline-block",position:"relative",
                    animation:t.special?`trophyBounce 2s ease-in-out infinite, sportsGlow ${view===t.id?"1s":"2.5s"} ease-in-out infinite`:view===t.id&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none"}}>
                  {t.icon}
                  {t.special&&<span style={{position:"absolute",top:-2,right:-3,width:6,height:6,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",boxShadow:"0 0 5px #ef4444"}}/>}
                </span>
                {t.label}
              </button>
            ))}
          </nav>
          {/* Search bar */}
          <div style={{flex:1,minWidth:160,maxWidth:320,position:"relative",marginLeft:8}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontSize:15,zIndex:1}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, genre or mood…"
              style={{width:"100%",background:"rgba(255,255,255,.07)",border:"2px solid rgba(245,158,11,.5)",borderRadius:12,color:"var(--text)",padding:"9px 14px 9px 36px",fontSize:13,outline:"none",boxShadow:"0 0 16px rgba(245,158,11,.15)"}}
              onFocus={e=>{e.target.style.border="2px solid #F59E0B";e.target.style.boxShadow="0 0 24px rgba(245,158,11,.35)";}}
              onBlur={e=>{e.target.style.border="2px solid rgba(245,158,11,.5)";e.target.style.boxShadow="0 0 16px rgba(245,158,11,.15)";}}
            />
          </div>
          {/* Right buttons */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexShrink:0}}>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,fontFamily:"var(--font-head)",whiteSpace:"nowrap"}}>✦ PREMIUM</span>
              :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"9px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,boxShadow:"0 0 16px rgba(245,158,11,.4)",whiteSpace:"nowrap",cursor:"pointer"}}>Upgrade ✦</button>
            }
            {!user
              ?<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",border:"1px solid rgba(139,92,246,.5)",borderRadius:10,color:"#fff",padding:"9px 18px",fontWeight:800,fontSize:13,fontFamily:"var(--font-head)",boxShadow:"0 0 16px rgba(139,92,246,.4)",whiteSpace:"nowrap",cursor:"pointer"}}>👤 Sign In</button>
              :<button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{
                width:36,height:36,borderRadius:"50%",
                background:"var(--purple)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,
                border:tier==="premium"?"2.5px solid #F59E0B":"2px solid rgba(139,92,246,.4)",
                boxShadow:tier==="premium"?"0 0 12px rgba(245,158,11,.5)":"none",
                color:"#fff",flexShrink:0,cursor:"pointer",
                overflow:"hidden",padding:0,
                transition:"all .3s",
              }}>
                {user && profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : user?(profile?.username||user.email||"U")[0].toUpperCase():"?"
                }
              </button>
            }
          </div>
        </header>

        {/* 🎭 AI BRAND BANNER — full width, above all three columns */}
        {view==="home"&&!search.trim()&&(
          <div style={{
            margin:"0",
            padding:"0 24px 0",
            maxWidth:1440,
            marginLeft:"auto",
            marginRight:"auto",
          }}>
            {!user && <WelcomeBanner />}
            <div style={{
              borderRadius:24,
              overflow:"hidden",
              position:"relative",
              background:"linear-gradient(135deg,#0d0520 0%,#12053a 45%,#0a1628 100%)",
              border:"1px solid rgba(139,92,246,.4)",
              boxShadow:"0 12px 60px rgba(139,92,246,.3), inset 0 1px 0 rgba(255,255,255,.08)",
              padding:"24px 32px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:20,
            }}>
              {/* glow blobs */}
              <div style={{position:"absolute",top:-60,left:-60,width:260,height:260,borderRadius:"50%",background:"rgba(139,92,246,.18)",filter:"blur(80px)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:-60,right:-60,width:260,height:260,borderRadius:"50%",background:"rgba(255,107,157,.14)",filter:"blur(80px)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:400,height:100,background:"rgba(6,182,212,.07)",filter:"blur(60px)",pointerEvents:"none"}}/>
              {/* Left glowing logo */}
              <img src="/logo-clean.png" alt="" style={{
                height:90, width:"auto", objectFit:"contain", flexShrink:0,
                filter:"drop-shadow(0 0 20px rgba(245,158,11,.9)) drop-shadow(0 0 40px rgba(139,92,246,.7))",
                animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3s ease-in-out infinite",
              }}/>
              {/* Center content — absolutely centered in the banner */}
              <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",textAlign:"center",width:"60%",pointerEvents:"none"}}>
                <div style={{
                  fontFamily:"var(--font-head)", fontWeight:800,
                  fontSize:30, letterSpacing:"-.02em", marginBottom:14,
                  background:"linear-gradient(90deg,#C4B5FD,#E9D5FF,#F59E0B,#C4B5FD)",
                  backgroundSize:"200% auto",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  animation:"gradientShift 3s linear infinite",
                  whiteSpace:"nowrap",
                }}>Your AI Streaming Assistant</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12,pointerEvents:"all"}}>
                  {[
                    {word:"SEARCH", bg:"#F59E0B", glow:"rgba(245,158,11,.7)"},
                    {word:"FIND",   bg:"#8B5CF6", glow:"rgba(139,92,246,.7)"},
                    {word:"ENJOY",  bg:"#FFFFFF", glow:"rgba(255,255,255,.6)"},
                  ].map((item,i)=>(
                    <div key={item.word} style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{
                        background:item.bg, borderRadius:99,
                        padding:"10px 26px",
                        fontFamily:"var(--font-head)", fontWeight:900,
                        fontSize:14, letterSpacing:3, color:"#000",
                        boxShadow:`0 0 20px ${item.glow}, 0 0 40px ${item.glow}55`,
                        whiteSpace:"nowrap",
                      }}>{item.word}</div>
                      {i<2 && <span style={{color:"rgba(255,255,255,.3)",fontSize:20,fontWeight:700}}>—</span>}
                    </div>
                  ))}
                </div>

              </div>
              {/* Right glowing logo */}
              <img src="/logo-clean.png" alt="" style={{
                height:90, width:"auto", objectFit:"contain", flexShrink:0,
                filter:"drop-shadow(0 0 20px rgba(245,158,11,.9)) drop-shadow(0 0 40px rgba(139,92,246,.7))",
                animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3.6s ease-in-out infinite",
              }}/>
            </div>
          </div>
        )}

        {/* ── MOOD SEARCH + SPORTS HUB — featured cards below banner, desktop only ── */}
        {view==="home"&&!search.trim()&&(
          <div style={{padding:"0 24px 20px",maxWidth:1440,margin:"0 auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

              {/* Mood Search card */}
              <div onClick={()=>setShowMoodSearch(true)}
                style={{
                  background:"linear-gradient(135deg,#0d0520 0%,#1a0540 60%,#0a0320 100%)",
                  border:"1.5px solid rgba(139,92,246,.5)",
                  borderRadius:18, padding:"20px 24px",
                  cursor:"pointer", position:"relative", overflow:"hidden",
                  boxShadow:"0 8px 32px rgba(139,92,246,.2)",
                  transition:"all .25s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(139,92,246,.9)";e.currentTarget.style.boxShadow="0 12px 40px rgba(139,92,246,.4)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(139,92,246,.5)";e.currentTarget.style.boxShadow="0 8px 32px rgba(139,92,246,.2)";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(139,92,246,.15)",filter:"blur(50px)",pointerEvents:"none"}}/>
                <div style={{position:"absolute",bottom:-30,left:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,107,157,.1)",filter:"blur(40px)",pointerEvents:"none"}}/>
                <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:16}}>
                  <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#8B5CF6,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 6px 20px rgba(139,92,246,.5)"}}>🎭</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,background:"linear-gradient(90deg,#c4b5fd,#f0abfc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Mood Search</div>
                      <span style={{background:"var(--gold)",color:"#000",fontSize:9,fontWeight:900,padding:"2px 7px",borderRadius:99,fontFamily:"var(--font-head)"}}>AI</span>
                    </div>
                    <div style={{fontSize:13,color:"rgba(196,181,253,.8)",lineHeight:1.6,marginBottom:14}}>
                      Describe your perfect movie night — AI finds the <em>exact</em> match. No scrolling, no browsing. Just vibes.
                      <div style={{marginTop:8}}>
                        <span style={{background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.3)",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#C4B5FD"}}>🎭 Free for all users</span>
                      </div>
                    </div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(139,92,246,.3)",border:"1px solid rgba(139,92,246,.6)",borderRadius:99,padding:"7px 16px",fontSize:12,fontWeight:700,color:"#c4b5fd"}}>
                      ✦ Try Mood Search →
                    </div>
                  </div>
                </div>
              </div>

              {/* Sports Hub card */}
              <div onClick={()=>{setView("sports");setSearch("");}}
                style={{
                  background:"linear-gradient(135deg,#030f03 0%,#0a2010 60%,#031208 100%)",
                  border:"1.5px solid rgba(16,185,129,.5)",
                  borderRadius:18, padding:"20px 24px",
                  cursor:"pointer", position:"relative", overflow:"hidden",
                  boxShadow:"0 8px 32px rgba(16,185,129,.15)",
                  transition:"all .25s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(16,185,129,.9)";e.currentTarget.style.boxShadow="0 12px 40px rgba(16,185,129,.35)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(16,185,129,.5)";e.currentTarget.style.boxShadow="0 8px 32px rgba(16,185,129,.15)";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(16,185,129,.12)",filter:"blur(50px)",pointerEvents:"none"}}/>
                <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:16}}>
                  <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
                    <div style={{width:52,height:52,borderRadius:14,background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
                      <span style={{animation:"trophyBounce 2s ease-in-out infinite, sportsGlow 2s ease-in-out infinite"}}>🏆</span>
                    </div>
                    <div style={{position:"absolute",top:-3,right:-3,width:12,height:12,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",boxShadow:"0 0 8px #ef4444",border:"2px solid #030f03"}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,background:"linear-gradient(90deg,#6ee7b7,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Sports Hub</div>
                      <span style={{background:"#ef4444",color:"#fff",fontSize:9,fontWeight:900,padding:"2px 7px",borderRadius:99,fontFamily:"var(--font-head)",animation:"pulse 1.5s infinite"}}>🔴 LIVE</span>
                    </div>
                    <div style={{fontSize:13,color:"rgba(110,231,183,.75)",lineHeight:1.6,marginBottom:14}}>
                      Live scores, full schedules & reminders for every game — NFL, NBA, MLB, NHL, World Cup 2026 and more.
                    </div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.5)",borderRadius:99,padding:"7px 16px",fontSize:12,fontWeight:700,color:"#6ee7b7"}}>
                      🏟️ Open Sports Hub →
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        <div style={{display:"flex",padding:`${(view==="home"&&!search.trim()||view==="trending"&&!search.trim())?"0":"20px"} 24px 20px`,gap:20,maxWidth:1440,margin:"0 auto"}}>
          {/* Main */}
          <main style={{flex:1,minWidth:0}}>
            {/* Homepage hero + rows */}
            {view==="home"&&!search.trim() ? (
              <div>
                <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.06)"}}>

                </div>
                <div style={{paddingTop:24}}>

                  <FeaturedRow title="New in Cinemas" icon="🎬" movies={featuredRows.newReleases} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--cyan)" />
                  <FeaturedRow title="Top Rated All Time" icon="⭐" movies={featuredRows.topRated} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--purple)" />
                  <FeaturedRow title="Anime" icon="✦" movies={featuredRows.anime} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--anime)" />
                  <FeaturedRow title="Sports & Docs" icon="🏆" movies={featuredRows.sports} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--sports)" />
                </div>
              </div>
                    ) : view==="trending" ? (
          <div style={{padding:"0 14px 20px"}}>
            <div style={{paddingTop:16,paddingBottom:8}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,marginBottom:2}}>🔥 Top 10 Trending</div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Across all streaming services · Updated daily</div>
            </div>
            <Top10TrendingSection movies={featuredRows.trending} onSelect={handleSelectMovie} userSubs={userSubs}/>
          </div>
        ) : view==="sports" ? (
              /* ── DEDICATED SPORTS HUB — desktop ── */
              <div>
                {!search.trim() ? (
                  <>
                    <TeamNextGameSearch favoriteTeams={favoriteTeams}/>
                <SportCategoryGrid onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                    <SportsStreamingGuide onSearch={handleSportSearch}/>
                  </>
                ) : (
                  <>
                    <button onClick={()=>setSearch("")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:99,color:"var(--muted)",padding:"5px 12px",fontSize:12,cursor:"pointer",marginBottom:16}}>← Back to Sports Hub</button>
                    {search==="soccer_hub" ? <SoccerHub onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                      : search.toLowerCase().includes("olympic") ? <OlympicsPlaceholder/>
                      : <LiveSportsSection sportQuery={search} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavoriteTeam}/>}
                  </>
                )}
              </div>
            ) : (
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>
                    {search.trim()
                      ? searching?"Searching…":`${searchResults.length} results for "${search}"`
                      : CATEGORY_TABS.find(t=>t.id===view)?.icon+" "+CATEGORY_TABS.find(t=>t.id===view)?.label
                    }
                    {!search&&!loading&&<span style={{fontWeight:400,fontSize:14,color:"var(--muted)",marginLeft:10}}>{filtered.length} titles</span>}
                  </div>
                  {!user&&<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"8px 18px",fontWeight:700,fontSize:13}}>👤 Sign in to save watchlist</button>}
                </div>
                {loading&&!search
                  ? <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
                  : filtered.length===0
                    ? <div style={{textAlign:"center",color:"var(--muted)",padding:"80px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty. Click ♡ to save titles!":"No results found."}</div>
                    : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>
                        {filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                      </div>
                }
              </>
            )}
          </main>

          {/* Right Sidebar */}
          <aside style={{width:220,flexShrink:0}}>
            {!user&&(
              <div style={{background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.25)",borderRadius:"var(--radius)",padding:16,marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:8}}>👤</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:6}}>Create an Account</div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>Save your watchlist, write reviews and sync across devices.</div>
                <button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{width:"100%",background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 0",fontWeight:700,fontSize:13,cursor:"pointer"}}>Sign Up Free</button>
              </div>
            )}

            {/* Premium Tools */}
            <div style={{marginTop:16}}>
              {/* Sports Hub Button */}
              {/* Mood Search & Sports Hub are featured below the banner — not duplicated here */}
              <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"✦",label:"For You",      sub:"Personalized picks from your ratings & watchlist",onClick:()=>setShowPersonalizedRecs(true),color:"#F59E0B",grad:"rgba(245,158,11,.08)"},
                  {icon:"🚨",label:"Leaving Soon", sub:"Titles leaving your services this month",onClick:()=>setShowLeavingSoon(true),color:"#EF4444",grad:"rgba(239,68,68,.07)"},
                  {icon:"🆕",label:"New Releases", sub:"Fresh drops across all streaming platforms",onClick:()=>setShowNewReleases(true),color:"#8B5CF6",grad:"rgba(139,92,246,.07)"},
                  {icon:"💰",label:"Cost Report",  sub:"AI analyzes which services to keep or cut",onClick:()=>setShowCostCalc(true),color:"#10B981",grad:"rgba(16,185,129,.07)"},
                ].map(item=>(
                  <button key={item.label} onClick={item.onClick}
                    style={{background:item.grad,border:`1.5px solid ${item.color}44`,borderRadius:12,padding:"11px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"all .2s",textAlign:"left",width:"100%"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${item.color}99`;e.currentTarget.style.background=`${item.color}14`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=`${item.color}44`;e.currentTarget.style.background=item.grad;}}>
                    <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:800,color:"var(--text)",display:"flex",alignItems:"center",gap:5,marginBottom:2}}>{item.label}{tier!=="premium"&&<span style={{background:"var(--gold)",color:"#000",fontSize:7,fontWeight:800,padding:"1px 4px",borderRadius:99}}>PRO</span>}</div>
                      <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.4}}>{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </aside>
        </div>

        {/* Footer */}
        <div style={{position:"relative",overflow:"hidden",borderTop:"2px solid rgba(245,158,11,.2)"}}>
        {/* Advanced Stats Section */}
        <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} />

          {/* Footer hero tagline */}
          <div style={{
            padding:"48px 40px 32px",
            background:"linear-gradient(180deg,rgba(10,8,24,0.98) 0%,rgba(12,8,28,1) 100%)",
            textAlign:"center",position:"relative",
          }}>
            <div style={{
              fontFamily:"var(--font-head)", fontWeight:800,
              fontSize:"clamp(24px,3vw,42px)",
              letterSpacing:"-.01em", marginBottom:10,
              background:"linear-gradient(90deg,#F59E0B,#ffffff,#8B5CF6,#C4B5FD,#F59E0B)",
              backgroundSize:"300% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 4s linear infinite",
            }}>Your AI Streaming Assistant</div>
            <div style={{
              fontSize:12, letterSpacing:4, marginBottom:36,
              color:"rgba(240,240,250,.55)", display:"inline-block",
              background:"rgba(255,255,255,.05)",
              padding:"6px 20px", borderRadius:99,
              border:"1px solid rgba(255,255,255,.1)",
            }}>THE STREAMHUB</div>

            {/* Word pills */}
            <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap",marginBottom:36}}>
              {[
                {word:"SEARCH", color:"#000",    bg:"#F59E0B",  shadow:"rgba(245,158,11,.6)"},
                {word:"·",      color:"rgba(240,240,250,.4)", bg:"transparent", shadow:"none"},
                {word:"FIND",   color:"#fff",    bg:"#8B5CF6",  shadow:"rgba(139,92,246,.5)"},
                {word:"·",      color:"rgba(240,240,250,.4)", bg:"transparent", shadow:"none"},
                {word:"ENJOY",  color:"#000",    bg:"#FFFFFF",  shadow:"rgba(255,255,255,.4)"},
              ].map((p,i)=>(
                <span key={i} style={{
                  fontFamily:"var(--font-head)", fontWeight:800,
                  fontSize: p.word==="·" ? 28 : 20,
                  color:p.color, letterSpacing: p.word==="·" ? 0 : 4,
                  background:p.bg, borderRadius:99,
                  padding: p.word==="·" ? "0 8px" : "10px 32px",
                  display:"inline-flex", alignItems:"center",
                  boxShadow: p.shadow!=="none" ? `0 0 28px ${p.shadow}, 0 4px 12px rgba(0,0,0,.4)` : "none",
                  animation: p.word!=="·" ? `badgePop 3s ease-in-out infinite` : "none",
                  animationDelay:`${i*0.4}s`,
                }}>{p.word}</span>
              ))}
            </div>

            {/* Bottom bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,paddingTop:24,borderTop:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <img src="/logo-clean.png" alt="The StreamHub" onClick={()=>{setView("home");setSearch("");window.scrollTo(0,0);}} style={{height:52,objectFit:"contain",filter:"drop-shadow(0 0 10px rgba(245,158,11,.5))",cursor:"pointer"}} />
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>
                    <span style={{color:"#F59E0B"}}>The Stream</span>
                    <span style={{color:"#8B5CF6"}}>Hub</span>
                  </div>
                  <div style={{fontSize:10,color:"var(--gold)",letterSpacing:1,fontFamily:"var(--font-head)",fontWeight:700}}>YOUR AI STREAMING ASSISTANT</div>
                </div>
              </div>
              <div style={{fontSize:11,color:"var(--muted)"}}>© 2025 StreamHub · Not affiliated with any streaming service.</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {["Netflix","Disney+","Max","Hulu","Crunchyroll","ESPN+","DAZN"].map(n=>(
                  <span key={n} style={{fontSize:10,color:"rgba(240,240,250,.2)",letterSpacing:.5}}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Left side tagline banner removed */}
        {/* Right side tagline banner removed */}
      </div>

      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:'movie'})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} userSubs={userSubs} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}} notifPermission={notifPermission} onRequestNotif={requestNotifications} streak={streak}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showOnboarding&&<OnboardingModal onFinish={()=>{setShowOnboarding(false);setShowSetup(true);}}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} profile={profile}/>}
      {showNewReleases&&<NewReleasesModal onClose={()=>setShowNewReleases(false)} user={user} tier={tier} userSubs={userSubs} onSelect={handleSelectMovie} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {shareContent&&<ShareModal title={shareContent.title} text={shareContent.text} url={shareContent.url} onClose={()=>setShareContent(null)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      <CookieConsent/>
      <Analytics />
    </>
  );
}
       