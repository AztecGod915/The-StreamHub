import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";

// ─── GOOGLE ANALYTICS EVENT TRACKER ──────────────────────────────────────────
const track = (eventName, params = {}) => {
  try {
    if (window.gtag) window.gtag("event", eventName, params);
  } catch(e) {}
};

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
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
        --bg:#07070E; --surface:#0D0D1A; --card:#111122;
        --border:rgba(255,255,255,0.07); --gold:#F5C518; --gold-dim:rgba(245,197,24,0.15);
        --purple:#7C3AED; --cyan:#06B6D4; --anime:#FF6B9D; --sports:#10B981;
        --text:#F0F0FA; --muted:rgba(240,240,250,0.45);
        --danger:#EF4444; --success:#10B981; --radius:14px;
        --font-head:'Syne',sans-serif; --font-body:'Plus Jakarta Sans',sans-serif;
      }
      body { background:var(--bg); color:var(--text); font-family:var(--font-body); -webkit-font-smoothing:antialiased; }
      body::before {
        content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
        background:
          radial-gradient(ellipse 80% 50% at 20% 0%, rgba(124,58,237,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 10%, rgba(245,197,24,0.08) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 10% 70%, rgba(6,182,212,0.1) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 90% 80%, rgba(255,107,157,0.07) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(16,185,129,0.05) 0%, transparent 60%);
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
      @keyframes spin     { to{transform:rotate(360deg)} }
      @keyframes slideRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideDown{ from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      @keyframes logoPulse { 0%,100%{filter:drop-shadow(0 0 0px rgba(245,197,24,0))} 50%{filter:drop-shadow(0 0 14px rgba(245,197,24,0.7))} }
      @keyframes logoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes flameDance { 0%,100%{transform:scale(1) rotate(-8deg)} 25%{transform:scale(1.3) rotate(8deg)} 50%{transform:scale(0.9) rotate(-5deg)} 75%{transform:scale(1.2) rotate(6deg)} }
      @keyframes swordSwing { 0%,100%{transform:rotate(-20deg) scale(1)} 50%{transform:rotate(20deg) scale(1.1)} }
      @keyframes tvFlicker { 0%,88%,92%,100%{opacity:1} 90%{opacity:0.4} }
      @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      @keyframes badgePop { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
      @keyframes trophyBounce { 0%,100%{transform:translateY(0) rotate(-5deg)} 40%{transform:translateY(-6px) rotate(5deg)} 70%{transform:translateY(-3px) rotate(-3deg)} }
      @keyframes sportsGlow { 0%,100%{filter:drop-shadow(0 0 0px rgba(16,185,129,0)) drop-shadow(0 0 0px rgba(245,197,24,0))} 50%{filter:drop-shadow(0 0 8px rgba(16,185,129,.9)) drop-shadow(0 0 16px rgba(245,197,24,.6))} }
      @keyframes liveDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.5} }
      @keyframes sportsTabPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 0 4px rgba(239,68,68,.25)} }
      @keyframes sportsPromoGlow { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)} 50%{box-shadow:0 0 16px rgba(16,185,129,.18)} }
      @keyframes sportsBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
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
  const sorted = Object.entries(ESPN_SPORT_MAP).sort((a,b)=>b[0].length-a[0].length);
  for (const [key, val] of sorted) {
    if (q.includes(key)) return val;
  }
  return null;
}

// ─── WORLD CUP 2026 TEAMS ────────────────────────────────────────────────────
const WC_TEAMS = [
  {name:"United States",flag:"🇺🇸",conf:"CONCACAF"},{name:"Mexico",flag:"🇲🇽",conf:"CONCACAF"},
  {name:"Canada",flag:"🇨🇦",conf:"CONCACAF"},{name:"Brazil",flag:"🇧🇷",conf:"CONMEBOL"},
  {name:"Argentina",flag:"🇦🇷",conf:"CONMEBOL"},{name:"France",flag:"🇫🇷",conf:"UEFA"},
  {name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",conf:"UEFA"},{name:"Germany",flag:"🇩🇪",conf:"UEFA"},
  {name:"Spain",flag:"🇪🇸",conf:"UEFA"},{name:"Portugal",flag:"🇵🇹",conf:"UEFA"},
  {name:"Netherlands",flag:"🇳🇱",conf:"UEFA"},{name:"Italy",flag:"🇮🇹",conf:"UEFA"},
  {name:"Belgium",flag:"🇧🇪",conf:"UEFA"},{name:"Croatia",flag:"🇭🇷",conf:"UEFA"},
  {name:"Switzerland",flag:"🇨🇭",conf:"UEFA"},{name:"Denmark",flag:"🇩🇰",conf:"UEFA"},
  {name:"Austria",flag:"🇦🇹",conf:"UEFA"},{name:"Poland",flag:"🇵🇱",conf:"UEFA"},
  {name:"Serbia",flag:"🇷🇸",conf:"UEFA"},{name:"Turkey",flag:"🇹🇷",conf:"UEFA"},
  {name:"Scotland",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",conf:"UEFA"},{name:"Ukraine",flag:"🇺🇦",conf:"UEFA"},
  {name:"Morocco",flag:"🇲🇦",conf:"CAF"},{name:"Senegal",flag:"🇸🇳",conf:"CAF"},
  {name:"Egypt",flag:"🇪🇬",conf:"CAF"},{name:"Nigeria",flag:"🇳🇬",conf:"CAF"},
  {name:"South Africa",flag:"🇿🇦",conf:"CAF"},{name:"Cameroon",flag:"🇨🇲",conf:"CAF"},
  {name:"Japan",flag:"🇯🇵",conf:"AFC"},{name:"South Korea",flag:"🇰🇷",conf:"AFC"},
  {name:"Australia",flag:"🇦🇺",conf:"AFC"},{name:"Iran",flag:"🇮🇷",conf:"AFC"},
  {name:"Saudi Arabia",flag:"🇸🇦",conf:"AFC"},{name:"Uruguay",flag:"🇺🇾",conf:"CONMEBOL"},
  {name:"Colombia",flag:"🇨🇴",conf:"CONMEBOL"},{name:"Ecuador",flag:"🇪🇨",conf:"CONMEBOL"},
  {name:"Chile",flag:"🇨🇱",conf:"CONMEBOL"},{name:"Venezuela",flag:"🇻🇪",conf:"CONMEBOL"},
  {name:"Peru",flag:"🇵🇪",conf:"CONMEBOL"},{name:"Panama",flag:"🇵🇦",conf:"CONCACAF"},
  {name:"Costa Rica",flag:"🇨🇷",conf:"CONCACAF"},{name:"Jamaica",flag:"🇯🇲",conf:"CONCACAF"},
  {name:"Honduras",flag:"🇭🇳",conf:"CONCACAF"},{name:"New Zealand",flag:"🇳🇿",conf:"OFC"},
  {name:"Qatar",flag:"🇶🇦",conf:"AFC"},{name:"Algeria",flag:"🇩🇿",conf:"CAF"},
  {name:"Tunisia",flag:"🇹🇳",conf:"CAF"},{name:"Ghana",flag:"🇬🇭",conf:"CAF"},
];

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

// ─── FAVORITE TEAMS MODAL ────────────────────────────────────────────────────
function FavoriteTeamModal({ sport, events, favoriteTeams, onToggle, onClose }) {
  const [search, setSearch] = useState("");
  const [espnTeams, setEspnTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const isWC = sport?.toLowerCase().includes("world cup") || sport?.toLowerCase().includes("fifa");
  const leagueEntry = SOCCER_LEAGUES.find(l=>l.name===sport);
  const leagueId = leagueEntry?.id;

  useEffect(() => {
    if (!leagueId) return;
    setLoadingTeams(true);
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams?limit=100`)
      .then(r=>r.json())
      .then(data=>{
        const teams = (data.sports?.[0]?.leagues?.[0]?.teams||[])
          .map(t=>({name:t.team.displayName||t.team.name, flag:"⚽", abbr:t.team.abbreviation}));
        setEspnTeams(teams);
        setLoadingTeams(false);
      })
      .catch(()=>setLoadingTeams(false));
  }, [leagueId]);

  const baseTeams = isWC
    ? WC_TEAMS
    : espnTeams.length > 0
      ? espnTeams
      : [...new Set([...events.map(e=>e.home.name),...events.map(e=>e.away.name)])].filter(Boolean).sort().map(name=>({name,flag:"🏅"}));

  const teams = baseTeams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const currentFav = favoriteTeams[sport||""];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:600,maxHeight:"80vh",display:"flex",flexDirection:"column",border:"1px solid rgba(245,197,24,.2)"}}>
        <div style={{padding:"20px 20px 14px",borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>⭐ Pick Your Team</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{sport} — your games will be highlighted</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team..."
            style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"var(--text)",outline:"none",boxSizing:"border-box"}}/>
          {currentFav && (
            <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.25)",borderRadius:10,padding:"8px 12px"}}>
              <span style={{fontSize:13,fontWeight:700}}>⭐ Following: <strong>{currentFav}</strong></span>
              <button onClick={()=>{onToggle(sport,"_clear");onClose();}} style={{background:"none",border:"none",color:"var(--muted)",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Unfollow</button>
            </div>
          )}
        </div>
        <div style={{overflowY:"auto",padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
          {loadingTeams ? Array.from({length:12}).map((_,i)=><div key={i} className="skeleton" style={{height:56,borderRadius:10}}/>) :
           teams.length===0 ? <div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--muted)",padding:"24px 0",fontSize:13}}>No teams found</div> :
           teams.map(t=>{
            const isFav = currentFav===t.name;
            return (
              <button key={t.name} onClick={()=>{onToggle(sport,t.name);onClose();}}
                style={{background:isFav?"rgba(245,197,24,.15)":"rgba(255,255,255,.03)",border:`1px solid ${isFav?"rgba(245,197,24,.5)":"rgba(255,255,255,.08)"}`,borderRadius:12,padding:"10px 8px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",textAlign:"left",transition:"all .15s",color:"var(--text)"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(245,197,24,.4)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=isFav?"rgba(245,197,24,.5)":"rgba(255,255,255,.08)"}>
                <span style={{fontSize:18,flexShrink:0}}>{t.flag||"🏅"}</span>
                <span style={{fontSize:12,fontWeight:isFav?700:500,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}</span>
                {isFav && <span style={{marginLeft:"auto",color:"var(--gold)",fontSize:12,flexShrink:0}}>⭐</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── GAME DETAIL MODAL ───────────────────────────────────────────────────────
function GameDetailModal({ evt, onClose }) {
  const broadcastLink = evt.broadcastLink ||
    `https://www.google.com/search?q=watch+${encodeURIComponent((evt.shortName||evt.name||"").replace(/\s+/g,"+"))}+live+stream`;
  const isFight = evt.isTitleFight;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1300,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"linear-gradient(160deg,var(--surface) 0%,#0d1a0d 100%)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:500,border:"1px solid rgba(16,185,129,.3)",borderBottom:"none",boxShadow:"0 -20px 60px rgba(0,0,0,.6)",overflow:"hidden"}}>
        {evt.isLive && (
          <div style={{background:"linear-gradient(90deg,#ef4444,#dc2626)",padding:"6px 20px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"liveDot 1s infinite"}}/>
            <span style={{fontSize:11,fontWeight:800,color:"#fff",letterSpacing:1.5}}>LIVE NOW — {evt.periodText}</span>
          </div>
        )}
        <div style={{padding:"20px 20px 8px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              {isFight && <div style={{fontSize:10,fontWeight:800,color:"var(--gold)",letterSpacing:1,marginBottom:4}}>🏆 TITLE FIGHT</div>}
              {!evt.isLive && !evt.isOver && <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>📅 {evt.localDate} · {evt.localTime}</div>}
              {evt.isOver && <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>✓ FINAL</div>}
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          {evt.home?.name && evt.away?.name ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:20}}>
              <div style={{flex:1,textAlign:"center"}}>
                {evt.away.logo ? <img src={evt.away.logo} alt="" style={{width:52,height:52,objectFit:"contain",marginBottom:8}}/> : <div style={{width:52,height:52,borderRadius:12,background:`#${evt.away.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#fff",margin:"0 auto 8px"}}>{evt.away.abbr?.slice(0,3)}</div>}
                <div style={{fontSize:13,fontWeight:700,color:evt.isOver&&evt.away.winner?"var(--gold)":"var(--text)"}}>{evt.away.name}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>Away</div>
              </div>
              <div style={{textAlign:"center",flexShrink:0}}>
                {(evt.isLive||evt.isOver) ? (
                  <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:38,lineHeight:1,letterSpacing:-2}}>
                    <span style={{color:evt.away.winner?"var(--gold)":"var(--text)"}}>{evt.away.score}</span>
                    <span style={{color:"var(--muted)",fontSize:22,margin:"0 6px"}}>:</span>
                    <span style={{color:evt.home.winner?"var(--gold)":"var(--text)"}}>{evt.home.score}</span>
                  </div>
                ) : <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,color:"var(--muted)"}}>VS</div>}
                {evt.isLive && evt.periodText && <div style={{fontSize:10,color:"#ef4444",fontWeight:700,marginTop:4}}>{evt.periodText}</div>}
              </div>
              <div style={{flex:1,textAlign:"center"}}>
                {evt.home.logo ? <img src={evt.home.logo} alt="" style={{width:52,height:52,objectFit:"contain",marginBottom:8}}/> : <div style={{width:52,height:52,borderRadius:12,background:`#${evt.home.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#fff",margin:"0 auto 8px"}}>{evt.home.abbr?.slice(0,3)}</div>}
                <div style={{fontSize:13,fontWeight:700,color:evt.isOver&&evt.home.winner?"var(--gold)":"var(--text)"}}>{evt.home.name}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>Home</div>
              </div>
            </div>
          ) : <div style={{fontSize:16,fontWeight:800,textAlign:"center",marginBottom:20}}>{evt.name}</div>}
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            {evt.venue && <div style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px 12px",minWidth:120}}><div style={{fontSize:10,color:"var(--muted)",marginBottom:3}}>📍 VENUE</div><div style={{fontSize:12,fontWeight:700}}>{evt.venue}</div>{evt.city&&<div style={{fontSize:11,color:"var(--muted)"}}>{evt.city}</div>}</div>}
            {evt.broadcast && <div style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px 12px",minWidth:100}}><div style={{fontSize:10,color:"var(--muted)",marginBottom:3}}>📺 BROADCAST</div><div style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>{evt.broadcast}</div></div>}
          </div>
          <a href={broadcastLink} target="_blank" rel="noopener noreferrer"
            style={{display:"block",textAlign:"center",background:evt.isLive?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,var(--sports),#06b6d4)",borderRadius:14,padding:"14px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:"#fff",textDecoration:"none",boxShadow:evt.isLive?"0 8px 24px rgba(239,68,68,.4)":"0 8px 24px rgba(16,185,129,.3)",marginBottom:10}}>
            {evt.isLive ? "▶ Watch Live Now" : evt.isOver ? "📺 Watch Replay" : `📺 Watch on ${evt.broadcast||"Streaming"}`}
          </a>
          {!evt.broadcastLink && <a href={`https://www.google.com/search?q=where+to+watch+${encodeURIComponent(evt.shortName||evt.name||"")}+live`} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",fontSize:12,color:"var(--muted)",textDecoration:"underline",marginBottom:6}}>Search all streaming options →</a>}
        </div>
        <div style={{height:20}}/>
      </div>
    </div>
  );
}

// ─── BROADCAST LINK MAPPER ───────────────────────────────────────────────────
function getBroadcastLink(broadcast) {
  if (!broadcast) return null;
  const b = broadcast.toUpperCase();
  if (b.includes("ESPN+") || b.includes("ESPN UNLMTD")) return "https://www.espnplus.com/";
  if (b.includes("ESPN2") || b.includes("ESPN")) return "https://www.espn.com/watch/";
  if (b.includes("MLB.TV")) return "https://www.mlb.tv/";
  if (b.includes("NFL+") || b.includes("NFL NETWORK")) return "https://www.nfl.com/network/watch/";
  if (b.includes("NBA TV") || b.includes("NBA LEAGUE")) return "https://www.nba.com/watch/";
  if (b.includes("ABC") || b.includes("HULU")) return "https://www.hulu.com/live-tv";
  if (b.includes("PEACOCK") || b.includes("NBC")) return "https://www.peacocktv.com/stream/sports";
  if (b.includes("CBS") || b.includes("PARAMOUNT")) return "https://www.paramountplus.com/sports/";
  if (b.includes("FOX") || b.includes("FS1") || b.includes("FS2") || b.includes("FS★")) return "https://www.foxsports.com/live";
  if (b.includes("TNT") || b.includes("TBS") || b.includes("MAX") || b.includes("TRUETV")) return "https://www.max.com/sports";
  if (b.includes("PRIME") || b.includes("AMAZON")) return "https://www.amazon.com/primevideo/sports";
  if (b.includes("APPLE")) return "https://tv.apple.com/us/sports";
  if (b.includes("NETFLIX")) return "https://www.netflix.com/";
  if (b.includes("DAZN")) return "https://www.dazn.com/";
  if (b.includes("YOUTUBE TV")) return "https://tv.youtube.com/";
  if (b.includes("FUBO")) return "https://www.fubo.tv/welcome";
  return null;
}

// ─── ADD TO CALENDAR HELPER ───────────────────────────────────────────────────
function addGameReminder(evt) {
  const gameTitle = evt.shortName || evt.name || "Game";
  const gameDate  = evt.date ? new Date(evt.date) : null;
  if (!gameDate || isNaN(gameDate)) return;
  const pad = n => String(n).padStart(2, "0");
  const fmt = d =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const end = new Date(gameDate.getTime() + 3 * 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//StreamHub//Game Reminder//EN",
    "BEGIN:VEVENT",
    `UID:${evt.id||Date.now()}@thestreamhub.app`,
    `SUMMARY:${gameTitle}`,
    `DTSTART:${fmt(gameDate)}`,
    `DTEND:${fmt(end)}`,
    `DESCRIPTION:Watch on The StreamHub — thestreamhub.app`,
    `URL:${evt.broadcastLink||"https://thestreamhub.app"}`,
    "BEGIN:VALARM","TRIGGER:-PT30M","ACTION:DISPLAY",
    `DESCRIPTION:${gameTitle} starts in 30 minutes!`,
    "END:VALARM","END:VEVENT","END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${gameTitle.replace(/\s+/g,"_")}.ics`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────
function GameCard({ evt, isLive, isOver, favTeam, onSelect }) {
  const [reminderAdded, setReminderAdded] = useState(false);
  const hasTeams = evt.home?.name && evt.away?.name;
  const isFavGame = favTeam && (evt.home?.name===favTeam || evt.away?.name===favTeam);
  const isUpcoming = !isLive && !isOver;

  const handleReminderClick = (e) => {
    e.stopPropagation();
    addGameReminder(evt);
    setReminderAdded(true);
    setTimeout(() => setReminderAdded(false), 3000);
  };

  return (
    <div onClick={()=>onSelect&&onSelect(evt)}
      style={{
        flexShrink:0, width:210,
        background: isFavGame ? "rgba(245,197,24,.07)" : "rgba(255,255,255,.04)",
        border:`1px solid ${isFavGame?"rgba(245,197,24,.4)":isLive?"rgba(239,68,68,.5)":"rgba(255,255,255,.08)"}`,
        borderRadius:14, overflow:"hidden",
        boxShadow:isFavGame?"0 0 20px rgba(245,197,24,.15)":isLive?"0 0 20px rgba(239,68,68,.2)":"none",
        position:"relative", cursor:"pointer", transition:"transform .15s, border-color .15s",
      }}
      onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.borderColor=isFavGame?"rgba(245,197,24,.7)":isLive?"rgba(239,68,68,.8)":"rgba(255,255,255,.25)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor=isFavGame?"rgba(245,197,24,.4)":isLive?"rgba(239,68,68,.5)":"rgba(255,255,255,.08)";}}>
      {isFavGame && <div style={{position:"absolute",top:6,right:6,fontSize:10,zIndex:1}}>⭐</div>}
      {/* Top bar */}
      <div style={{padding:"6px 10px",background:isLive?"rgba(239,68,68,.15)":isFavGame?"rgba(245,197,24,.06)":"rgba(255,255,255,.03)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:10,fontWeight:700,color:isLive?"#ef4444":isFavGame?"var(--gold)":"var(--muted)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {isLive ? `🔴 LIVE · ${evt.periodText}` : isOver ? "✓ FINAL" : evt.localDate}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          {evt.broadcast && !isUpcoming && (
            <div style={{fontSize:9,color:"var(--gold)",fontWeight:700,background:"rgba(245,197,24,.1)",borderRadius:4,padding:"1px 5px",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {evt.broadcast}
            </div>
          )}
          {isLive && <div style={{fontSize:9,color:"#fff",fontWeight:800,background:"#ef4444",borderRadius:4,padding:"1px 5px"}}>WATCH</div>}
          {isUpcoming && (
            <button onClick={handleReminderClick} title="Add to Calendar"
              style={{background:reminderAdded?"rgba(16,185,129,.25)":"rgba(255,255,255,.08)",border:`1px solid ${reminderAdded?"rgba(16,185,129,.5)":"rgba(255,255,255,.15)"}`,borderRadius:6,color:reminderAdded?"#10b981":"var(--muted)",width:22,height:22,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>
              {reminderAdded ? "✓" : "🔔"}
            </button>
          )}
        </div>
      </div>
      {/* Teams */}
      <div style={{padding:"10px 12px"}}>
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
        ) : <div style={{fontSize:12,fontWeight:700,lineHeight:1.4}}>{evt.name}</div>}
        {!isLive && !isOver && (
          <div style={{marginTop:8,fontSize:10,color:"var(--muted)",display:"flex",gap:6,flexWrap:"wrap"}}>
            <span>🕐 {evt.localTime}</span>
            {evt.city && <span>📍 {evt.city}</span>}
          </div>
        )}
        <div style={{marginTop:8,fontSize:10,color:isLive?"#ef4444":"rgba(16,185,129,.7)",fontWeight:700}}>
          {isLive ? "▶ Watch Live →" : isOver ? "" : "📺 Find where to watch →"}
        </div>
        {evt.isTitleFight && <div style={{marginTop:4,fontSize:9,fontWeight:800,color:"var(--gold)",letterSpacing:.5}}>🏆 TITLE FIGHT</div>}
      </div>
    </div>
  );
}

// ─── LIVE SPORTS SECTION ─────────────────────────────────────────────────────
function LiveSportsSection({ sportQuery, favoriteTeams, onToggleFavorite }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportInfo, setSportInfo] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const intervalRef = useRef(null);
  const sportRef = useRef(null);

  const parseEvents = (data) => (data.events||[]).map(evt => {
    const comp = evt.competitions?.[0];
    const home = comp?.competitors?.find(c=>c.homeAway==="home") || comp?.competitors?.[0];
    const away = comp?.competitors?.find(c=>c.homeAway==="away") || comp?.competitors?.[1];
    const st = evt.status?.type;
    return {
      id: evt.id, name: evt.name||evt.shortName||"", shortName: evt.shortName||evt.name||"",
      date: evt.date,
      localDate: new Date(evt.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
      localTime: new Date(evt.date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZoneName:"short"}),
      isLive: st?.name==="STATUS_IN_PROGRESS", isOver: st?.completed||false,
      period: evt.status?.period||0, displayClock: evt.status?.displayClock||"",
      periodText: evt.status?.type?.shortDetail||"",
      home: { name:home?.team?.shortDisplayName||home?.team?.displayName||"", abbr:home?.team?.abbreviation||"", score:home?.score||"", logo:home?.team?.logo||"", color:home?.team?.color||"333", winner:home?.winner },
      away: { name:away?.team?.shortDisplayName||away?.team?.displayName||"", abbr:away?.team?.abbreviation||"", score:away?.score||"", logo:away?.team?.logo||"", color:away?.team?.color||"333", winner:away?.winner },
      broadcast: comp?.broadcasts?.[0]?.names?.join(", ")||"",
      broadcastLink: getBroadcastLink(comp?.broadcasts?.[0]?.names?.join(", ")||""),
      venue: comp?.venue?.fullName||"", city: comp?.venue?.address?.city||"",
      isTitleFight: (evt.name||"").toLowerCase().includes("championship")||(evt.name||"").toLowerCase().includes("title"),
    };
  });

  const doFetch = async (silent=false) => {
    const sport = sportRef.current;
    if (!sport) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport.path}/scoreboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const evts = parseEvents(data);
      setEvents(evts); setLastUpdated(new Date()); setError(null);
      setIsPolling(evts.some(e=>e.isLive));
    } catch(e) { if (!silent) setError("Could not load schedule"); }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    const sport = getEspnSport(sportQuery);
    if (!sport) { setLoading(false); setError(null); return; }
    sportRef.current = sport; setSportInfo(sport); setEvents([]);
    setLastUpdated(null); setIsPolling(false); setError(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    doFetch(false);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sportQuery]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPolling) { intervalRef.current = setInterval(() => doFetch(true), 30000); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPolling]);

  const sport = getEspnSport(sportQuery);
  if (!sport && !loading) return null;

  const favTeam = favoriteTeams?.[sportInfo?.display||""];
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {hasLive && <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1.5s infinite",boxShadow:"0 0 8px #ef4444",flexShrink:0}}/>}
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:hasLive?"#ef4444":"var(--sports)"}}>
            {hasLive?"🔴 LIVE NOW":"📅 SCHEDULE"} — {sportInfo?.display||""}
          </div>
          {isPolling && <div style={{fontSize:9,background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:99,padding:"2px 8px",color:"#ef4444",fontWeight:700}}>AUTO-UPDATING</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {favTeam && <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(245,197,24,.1)",border:"1px solid rgba(245,197,24,.3)",borderRadius:99,padding:"3px 10px",fontSize:11,color:"var(--gold)",fontWeight:700}}>⭐ {favTeam}</div>}
          <button onClick={()=>setShowTeamPicker(true)} style={{background:"rgba(245,197,24,.1)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,color:"var(--gold)",padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{favTeam?"⭐ Change Team":"⭐ Follow a Team"}</button>
          {lastUpdated && <div style={{fontSize:10,color:"var(--muted)"}}>Updated {lastUpdated.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>}
          <button onClick={()=>doFetch(false)} style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:8,color:"var(--sports)",padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>↻</button>
        </div>
      </div>
      {showTeamPicker && <FavoriteTeamModal sport={sportInfo?.display} events={events} favoriteTeams={favoriteTeams||{}} onToggle={onToggleFavorite} onClose={()=>setShowTeamPicker(false)}/>}
      {selectedGame && <GameDetailModal evt={selectedGame} onClose={()=>setSelectedGame(null)}/>}
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
          {liveEvents.length>0 && <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none",marginBottom:12}}>{sortByFav(liveEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={true} favTeam={favTeam} onSelect={setSelectedGame}/>)}</div>}
          {upcomingEvents.length>0 && (
            <>
              {liveEvents.length>0 && <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>UPCOMING — tap to find where to watch</div>}
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>{sortByFav(upcomingEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={false} favTeam={favTeam} onSelect={setSelectedGame}/>)}</div>
            </>
          )}
          {recentEvents.length>0 && upcomingEvents.length===0 && (
            <>
              <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>RECENT RESULTS</div>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>{sortByFav(recentEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={false} isOver={true} favTeam={favTeam} onSelect={setSelectedGame}/>)}</div>
            </>
          )}
          {events.length===0 && <div style={{fontSize:13,color:"var(--muted)",textAlign:"center",padding:"24px 0",background:"rgba(255,255,255,.02)",borderRadius:12}}>No games scheduled right now. Season may be on break.</div>}
        </div>
      )}
    </div>
  );
}

// ─── SPORTS HUB PROMO CARD ────────────────────────────────────────────────────
function SportsHubPromo({ onNavigate }) {
  return (
    <div onClick={() => onNavigate("sports")}
      style={{cursor:"pointer",borderRadius:14,overflow:"hidden",marginBottom:12,background:"linear-gradient(135deg,rgba(239,68,68,.1) 0%,rgba(16,185,129,.1) 100%)",border:"1px solid rgba(16,185,129,.25)",padding:"12px 14px",transition:"transform .2s, box-shadow .2s",animation:"sportsPromoGlow 3s ease-in-out infinite"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.boxShadow="0 4px 20px rgba(16,185,129,.2)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none";}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",boxShadow:"0 0 6px #ef4444"}}/>
          <span style={{fontSize:9,fontWeight:800,color:"#ef4444",letterSpacing:1}}>LIVE</span>
        </div>
        <span style={{fontSize:10,color:"var(--muted)"}}>tap to open →</span>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:6,fontSize:18}}>
        <span style={{animation:"sportsBounce 2s ease-in-out infinite"}}>🏀</span>
        <span style={{animation:"sportsBounce 2s ease-in-out .3s infinite"}}>⚽</span>
        <span style={{animation:"sportsBounce 2s ease-in-out .6s infinite"}}>🏈</span>
        <span style={{animation:"sportsBounce 2s ease-in-out .9s infinite"}}>⚾</span>
      </div>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,marginBottom:2}}>Sports Hub</div>
      <div style={{fontSize:10,color:"var(--muted)",marginBottom:8}}>Live scores · Schedules · Reminders</div>
      <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"linear-gradient(90deg,#10b981,#059669)",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,color:"#fff",boxShadow:"0 2px 8px rgba(16,185,129,.3)"}}>▶ Watch Live Scores</div>
    </div>
  );
}

// ─── SPORT CATEGORY CARDS ────────────────────────────────────────────────────
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

function SportCategoryGrid({ onSearch, favoriteTeams }) {
  return (
    <div style={{marginBottom:20}}>
      <div onClick={()=>onSearch("FIFA World Cup 2026")}
        style={{background:"linear-gradient(135deg,#1a2a0a 0%,#0d4a1a 40%,#1a3a0a 100%)",border:"2px solid rgba(245,197,24,.5)",borderRadius:16,padding:"16px 18px",marginBottom:12,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(245,197,24,.15)",transition:"all .2s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(245,197,24,.8)";e.currentTarget.style.transform="scale(1.01)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,197,24,.5)";e.currentTarget.style.transform="scale(1)";}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:80,opacity:.1,pointerEvents:"none"}}>🏆</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{background:"#ef4444",borderRadius:99,padding:"2px 8px",fontSize:9,fontWeight:900,color:"#fff",letterSpacing:.8}}>🔴 STARTS JUNE 11</div>
              <div style={{background:"rgba(245,197,24,.2)",borderRadius:99,padding:"2px 8px",fontSize:9,fontWeight:900,color:"var(--gold)",letterSpacing:.8}}>48 TEAMS</div>
            </div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,color:"var(--gold)",lineHeight:1.1}}>🏆 FIFA World Cup 2026</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:4}}>🇺🇸 USA · 🇲🇽 Mexico · 🇨🇦 Canada</div>
          </div>
          <div style={{background:"rgba(245,197,24,.15)",border:"1px solid rgba(245,197,24,.3)",borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"var(--gold)",fontWeight:700,marginBottom:2}}>LIVE SCORES</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>Pick your team →</div>
          </div>
        </div>
      </div>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:"var(--sports)",marginBottom:12,letterSpacing:.5}}>🏆 SELECT A SPORT</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {SPORT_CARDS.map(s=>(
          <button key={s.label} onClick={()=>onSearch(s.query)}
            style={{background:s.bg,border:`1px solid ${s.color}40`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color;e.currentTarget.style.transform="scale(1.02)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${s.color}40`;e.currentTarget.style.transform="scale(1)";}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>{s.service}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SPORTS TAB HEADER ───────────────────────────────────────────────────────
function SportsTabHeader({ onSearch }) {
  return (
    <div style={{background:"linear-gradient(135deg,#0a1628 0%,#1a0a2e 50%,#0a2010 100%)",borderRadius:18,padding:"20px 16px",marginBottom:16,border:"1px solid rgba(16,185,129,.2)",position:"relative",overflow:"hidden"}}>
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

// ─── SOCCER HUB ──────────────────────────────────────────────────────────────
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
              style={{background:"rgba(26,110,60,.12)",border:"1px solid rgba(28,231,131,.2)",borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",transition:"all .2s",color:"var(--text)"}}
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

function SportsStreamingGuide({ onSearch }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? SPORTS_GUIDE : SPORTS_GUIDE.slice(0, 6);
  return (
    <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,182,212,.05))",border:"1px solid rgba(16,185,129,.2)",borderRadius:16,padding:"16px",marginBottom:20}}>
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
                  {svcs.map(sv=><div key={sv.id} style={{background:sv.color,borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:900,color:"#fff"}}>{sv.logo}</div>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={()=>setExpanded(!expanded)} style={{marginTop:10,width:"100%",background:"none",border:"1px solid rgba(16,185,129,.2)",borderRadius:8,color:"var(--sports)",padding:"7px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>
        {expanded ? "Show Less ▲" : `Show All ${SPORTS_GUIDE.length} Sports ▼`}
      </button>
    </div>
  );
}

const CATEGORY_TABS = [
  { id:"trending", label:"Trending",  icon:"🔥", color:"#F5C518", anim:"flameDance" },
  { id:"movies",   label:"Movies",    icon:"🎬", color:"var(--cyan)", anim:null },
  { id:"tv",       label:"TV Shows",  icon:"📺", color:"#A78BFA", anim:"tvFlicker" },
  { id:"anime",    label:"Anime",     icon:"✦",  color:"var(--anime)", anim:"swordSwing" },
  { id:"sports",   label:"Sports Hub",icon:"🏆", color:"var(--sports)", anim:"trophyBounce", special:true },
  { id:"search",   label:"Search",    icon:"🔍", color:"var(--gold)", anim:null },
];

const GR = [
  ["#1a1a2e","#e94560"],["#0d1b2a","#1f6feb"],["#1a0533","#7928ca"],
  ["#0a1628","#f59e0b"],["#1c0d2e","#c026d3"],["#0d2137","#06b6d4"],
  ["#1f1200","#d97706"],["#001f0d","#10b981"],["#1a0a0a","#ef4444"],
  ["#0d0d1a","#6366f1"],["#1a1000","#eab308"],["#0a1a1a","#14b8a6"],
];
const safeGR = (id) => GR[((id||0) % GR.length + GR.length) % GR.length] || GR[0];

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size=32 }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
      <div style={{animation:"logoFloat 3s ease-in-out infinite",display:"flex"}}>
        {!imgError ? (
          <img src="/logo-clean.png" alt="The StreamHub" onError={()=>setImgError(true)}
            style={{height:size*2.8,width:"auto",objectFit:"contain",filter:"drop-shadow(0 0 12px rgba(245,197,24,.5)) drop-shadow(0 0 24px rgba(124,58,237,.3))",animation:"logoPulse 2.5s ease-in-out infinite"}}/>
        ) : (
          <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:size*0.65,letterSpacing:"-.02em"}}>
            <span style={{background:"linear-gradient(90deg,#c8960c,#F5C518,#c8960c)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>The Stream</span>
            <span style={{background:"linear-gradient(90deg,#7C3AED,#a855f7,#7C3AED)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>Hub</span>
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
        <span key={s} onClick={()=>!readOnly&&onChange(s)} onMouseEnter={()=>!readOnly&&setHover(s)} onMouseLeave={()=>!readOnly&&setHover(0)}
          style={{fontSize:size,cursor:readOnly?"default":"pointer",color:s<=display?"#F5C518":"rgba(255,255,255,0.15)",display:"inline-block",transform:(!readOnly&&hover===s)?"scale(1.3)":"scale(1)",transition:"all .12s",lineHeight:1}}>★</span>
      ))}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
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
      style={{borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",position:"relative",border:`1px solid ${hov?accent:"var(--border)"}`,transform:hov?"translateY(-4px) scale(1.015)":"translateY(0) scale(1)",transition:"all .25s cubic-bezier(.22,1,.36,1)",boxShadow:hov?"0 20px 40px rgba(0,0,0,.5)":"0 4px 12px rgba(0,0,0,.3)",filter:notSub?"brightness(0.6) saturate(0.5)":"none",background:"var(--card)",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
      <div style={{height:200,position:"relative",overflow:"hidden",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
        {poster ? <img src={poster} alt={movie.title||movie.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/> : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,opacity:.15,fontFamily:"var(--font-head)",fontWeight:800,color:"#fff"}}>{(movie.title||movie.name||"").slice(0,2).toUpperCase()}</div>}
        {hov && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}}><div style={{width:46,height:46,borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,marginLeft:3}}>▶</span></div></div>}
        {notSub && <div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,.8)",borderRadius:6,padding:"3px 7px",fontSize:10,color:"var(--muted)",fontWeight:600}}>NOT SUBSCRIBED</div>}
        <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{position:"absolute",top:8,right:8,background:inWL?"var(--gold)":"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:30,height:30,fontSize:14,color:inWL?"#000":"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{inWL?"♥":"♡"}</button>
        {providers.length > 0 && <div style={{position:"absolute",bottom:8,left:8,display:"flex",gap:4,flexWrap:"wrap"}}>{providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small />)}</div>}
      </div>
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
        showToast("Account created! Check your email to verify. ✉️"); onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("Welcome back! 👋"); onClose();
      }
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:420,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <Logo size={28}/><button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20}}>✕</button>
          </div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6}}>{mode==="login"?"Welcome back":"Create account"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>{mode==="login"?"Sign in to sync your watchlist & reviews":"Join StreamHub — it's free"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {mode==="signup" && <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" style={inp}/>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={inp}/>
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
function ProfileModal({ user, profile, tier, watchlist, userRatings, onClose, onSignOut, onUpgrade, showToast, onEditSubs, onSelectMovie }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username||user?.email?.split("@")[0]||"User");
  const [tab, setTab] = useState("overview");
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

  useEffect(() => {
    if (tab !== "watchlist" || wlMovies.length > 0) return;
    setLoadingWl(true);
    Promise.all(watchlist.slice(0,20).map(async id => {
      try { return await tmdbFetch(`/movie/${id}?language=en-US`).catch(() => tmdbFetch(`/tv/${id}?language=en-US`)); } catch { return null; }
    })).then(results => { setWlMovies(results.filter(Boolean)); setLoadingWl(false); });
  }, [tab]);

  useEffect(() => {
    if (tab !== "reviews" || myReviews.length > 0) return;
    setLoadingRev(true);
    supabase.from("reviews").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).then(({data}) => { setMyReviews(data||[]); setLoadingRev(false); });
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
        <div style={{background:"linear-gradient(135deg,rgba(124,58,237,.3),rgba(245,197,24,.1))",padding:"24px 24px 20px",position:"relative",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,.4)",border:"none",borderRadius:10,color:"#fff",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:70,height:70,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,border:isPremium?"3px solid #F5C518":"3px solid rgba(124,58,237,.4)",boxShadow:isPremium?"0 0 20px rgba(245,197,24,.6), 0 0 40px rgba(245,197,24,.3)":"none",overflow:"hidden",flexShrink:0,transition:"all .3s"}}>
                {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : avatarLetter}
              </div>
              <label style={{position:"absolute",bottom:-2,right:-2,width:24,height:24,borderRadius:"50%",background:"var(--gold)",border:"2px solid var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:11,boxShadow:"0 2px 8px rgba(0,0,0,.5)"}} title="Change profile picture">
                {uploadingAvatar ? "⏳" : "📷"}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:"none"}}/>
              </label>
            </div>
            <div>
              {editing
                ? <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input value={username} onChange={e=>setUsername(e.target.value)} autoFocus style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:15,fontFamily:"var(--font-head)",fontWeight:700,outline:"none",width:160}}/>
                    <button onClick={saveUsername} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Save</button>
                  </div>
                : <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>{username}</div>
                    <button onClick={()=>setEditing(true)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,color:"var(--muted)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✏️</button>
                  </div>
              }
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4}}>{user?.email}</div>
              {tier==="premium" ? <span style={{background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99,fontFamily:"var(--font-head)",display:"inline-block",marginTop:6}}>✦ PREMIUM</span> : <span style={{background:"rgba(255,255,255,.1)",color:"var(--muted)",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,display:"inline-block",marginTop:6}}>FREE</span>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
            {[["♥",watchlist.length,"Watchlist","watchlist"],["✍",myReviews.length||"—","Reviews","reviews"],["★",totalRatings,"Rated",null]].map(([icon,val,label,t])=>(
              <button key={label} onClick={()=>t&&setTab(t)} style={{background:tab===t?"rgba(245,197,24,.12)":"rgba(255,255,255,.06)",borderRadius:10,padding:"10px 8px",textAlign:"center",border:`1px solid ${tab===t?"rgba(245,197,24,.3)":"rgba(255,255,255,.08)"}`,cursor:t?"pointer":"default",transition:"all .2s"}}>
                <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,color:"var(--gold)"}}>{val}</div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{label}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"12px 0",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer"}}>{t}</button>)}
        </div>
        <div style={{overflowY:"auto",flex:1,padding:20}}>
          {tab==="overview" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={onEditSubs} style={{background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:12,color:"var(--text)",padding:"12px 16px",fontWeight:600,fontSize:14,textAlign:"left",cursor:"pointer"}}>⚙️ Manage Subscriptions</button>
              {tier!=="premium" && <button onClick={()=>{onUpgrade();onClose();}} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>}
              <button onClick={onSignOut} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,color:"var(--danger)",padding:"12px 0",fontWeight:600,fontSize:14,cursor:"pointer"}}>Sign Out</button>
            </div>
          )}
          {tab==="watchlist" && (
            <div>
              {loadingWl ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}><span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your watchlist…</div>
               : watchlist.length === 0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>Your watchlist is empty. Tap ♡ on any title to save it!</div>
               : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                   {wlMovies.map(m=>{
                     const poster = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null;
                     return <div key={m.id} onClick={()=>{onSelectMovie(m);onClose();}} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--card)",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                       {poster ? <img src={poster} alt="" style={{width:"100%",height:110,objectFit:"cover"}}/> : <div style={{height:110,background:`linear-gradient(135deg,#1a1a2e,#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                       <div style={{padding:"6px 8px"}}><div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div><div style={{fontSize:10,color:"var(--gold)"}}>★ {m.vote_average?.toFixed(1)||"—"}</div></div>
                     </div>;
                   })}
                 </div>}
            </div>
          )}
          {tab==="reviews" && (
            <div>
              {loadingRev ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}><span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--purple)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your reviews…</div>
               : myReviews.length === 0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>You haven't written any reviews yet.</div>
               : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                   {myReviews.map(rv=>(
                     <div key={rv.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                       <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:10}}>
                         <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:2}}>{rv.title}</div><div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div></div>
                         <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                           <span style={{background:"var(--gold-dim)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                           <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"var(--danger)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>Delete</button>
                         </div>
                       </div>
                       <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content}</div>
                     </div>
                   ))}
                 </div>}
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
  const handlePay=()=>{ window.location.href="https://buy.stripe.com/6oU4gzenZcUsbLd16w7EQ00"; };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:520,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {step==="plans"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>Upgrade to Premium</div><div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>Unlock the full streaming experience</div></div>
              <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div style={{border:"1px solid var(--border)",borderRadius:14,padding:16}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Free Account</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--muted)",marginBottom:14}}>$0</div>
                {[{text:"10 searches/day",ok:true},{text:"Watchlist (50 titles)",ok:true},{text:"3 AI picks",ok:true},{text:"Ratings & reviews",ok:true},{text:"Watch trailers",ok:true},{text:"Mood Search",ok:false},{text:"Leaving Soon alerts",ok:false},{text:"Watch History",ok:false},{text:"Cost Calculator",ok:false}].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,color:f.ok?"var(--text)":"var(--muted)",marginBottom:7,opacity:f.ok?1:.5}}>
                    <span style={{color:f.ok?"var(--sports)":"rgba(255,255,255,.2)",fontSize:13}}>{f.ok?"✓":"✕"}</span>{f.text}
                  </div>
                ))}
              </div>
              <div style={{border:"2px solid var(--gold)",borderRadius:14,padding:16,background:"rgba(245,197,24,.04)",position:"relative"}}>
                <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 12px",borderRadius:99,fontFamily:"var(--font-head)",whiteSpace:"nowrap"}}>✦ BEST VALUE</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Premium</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--gold)",marginBottom:14}}>$9.99<span style={{fontSize:13,fontWeight:400,color:"var(--muted)"}}>​/mo</span></div>
                {[{text:"Unlimited searches",ok:true},{text:"Unlimited watchlist",ok:true},{text:"12 AI picks",ok:true},{text:"Ratings & reviews",ok:true},{text:"Watch trailers",ok:true},{text:"🎭 Mood Search",ok:true},{text:"🚨 Leaving Soon alerts",ok:true},{text:"📺 Watch History & Stats",ok:true},{text:"💰 Cost Calculator",ok:true}].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,marginBottom:7,color:"var(--text)"}}>
                    <span style={{color:"var(--gold)",fontSize:13}}>✓</span>{f.text}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={()=>setStep("pay")} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 24px rgba(245,197,24,.3)"}}>Upgrade to Premium — $9.99/mo →</button>
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
              <input value={card.name} onChange={e=>setCard({...card,name:e.target.value})} placeholder="Cardholder name" style={inp}/>
              <div style={{position:"relative"}}>
                <input value={card.number} onChange={e=>setCard({...card,number:fmtCard(e.target.value)})} placeholder="1234 5678 9012 3456" style={{...inp,paddingRight:48}}/>
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:18}}>💳</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <input value={card.expiry} onChange={e=>setCard({...card,expiry:fmtExp(e.target.value)})} placeholder="MM / YY" style={inp}/>
                <input value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value.replace(/\D/g,"").slice(0,3)})} placeholder="CVC" style={inp}/>
              </div>
            </div>
            <button onClick={handlePay} disabled={loading} style={{width:"100%",background:loading?"rgba(245,197,24,.5)":"var(--gold)",border:"none",borderRadius:"var(--radius)",color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
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
        <div style={{padding:"28px 28px 0"}}><Logo size={28}/><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6,marginTop:16}}>{isFirst?"Welcome! What are you subscribed to?":"Manage Subscriptions"}</div><div style={{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.6}}>{isFirst?"Pick your services and we'll personalize your experience.":"Toggle the services you currently pay for."}</div></div>
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
  const [allProviders, setAllProviders] = useState({flatrate:[],rent:[],buy:[],free:[]});

  useEffect(() => {
    if (!movie?.id) return;
    setRating(userRatings?.[movie.id] || 0);
    setTrailerKey(null); setShowTrailer(false); setAllProviders({flatrate:[],rent:[],buy:[],free:[]});
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}?append_to_response=credits,similar,videos`).then(d => {
      setDetails(d);
      const vids = d?.videos?.results || [];
      const t = vids.find(v=>v.type==="Trailer"&&v.site==="YouTube") || vids.find(v=>v.site==="YouTube");
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
    fetch(`${TMDB_BASE}/${type}/${movie.id}/watch/providers`,{headers:tmdbHeaders})
      .then(r=>r.json()).then(data=>{
        const res = data.results?.US || data.results?.GB || Object.values(data.results||{})[0] || {};
        setAllProviders({flatrate:res.flatrate||[],rent:res.rent||[],buy:res.buy||[],free:res.free||[]});
      }).catch(()=>{});
    supabase.from("reviews").select("*,profiles(username)").eq("movie_id", movie.id).order("created_at",{ascending:false}).then(({data}) => setReviews(data||[])).catch(()=>{});
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
    try { await supabase.from("ratings").upsert({user_id:user.id,movie_id:movie.id,rating:val},{onConflict:"user_id,movie_id"}); } catch(e){}
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
      const { data } = await supabase.from("reviews").insert({user_id:user.id,movie_id:movie.id,title:revTitle,content:revContent,rating:revRating}).select("*,profiles(username)");
      if (data?.[0]) { setReviews(prev=>[data[0],...prev]); setRevTitle(""); setRevContent(""); setRevRating(0); showToast && showToast("Review posted! ✍"); }
    } catch(e) { showToast && showToast("Error posting review"); }
    setSubmitting(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:780,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {/* Hero */}
        <div style={{height:200,position:"relative",flexShrink:0,overflow:"hidden",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
          {showTrailer && trailerKey
            ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`} allow="autoplay; encrypted-media" allowFullScreen style={{width:"100%",height:"100%",border:"none",position:"absolute",inset:0}}/>
            : <>
                {poster && <img src={poster} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.4}}/>}
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--surface) 0%,transparent 60%)"}}/>
                {trailerKey && <button onClick={()=>setShowTrailer(true)} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,.7)",border:"2px solid rgba(255,255,255,.8)",borderRadius:"50%",width:56,height:56,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",backdropFilter:"blur(4px)",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,197,24,.9)";e.currentTarget.style.borderColor="var(--gold)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,.7)";e.currentTarget.style.borderColor="rgba(255,255,255,.8)";}}>
                  <span style={{fontSize:22,marginLeft:4}}>▶</span>
                </button>}
              </>
          }
          <div style={{position:"absolute",top:14,right:14,display:"flex",gap:8}}>
            {showTrailer && <button onClick={()=>setShowTrailer(false)} style={{background:"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:"#fff",padding:"6px 12px",fontSize:12,cursor:"pointer",backdropFilter:"blur(8px)"}}>✕ Close</button>}
            <button onClick={()=>onToggleWatchlist&&onToggleWatchlist(movie.id)} style={{background:inWL?"var(--gold)":"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:inWL?"#000":"#fff",padding:"6px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>{inWL?"♥ Saved":"♡ Watchlist"}</button>
            <button onClick={onClose} style={{background:"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:"#fff",width:36,height:36,fontSize:18,cursor:"pointer"}}>✕</button>
          </div>
          {!showTrailer && <div style={{position:"absolute",bottom:16,left:20,right:20}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,marginBottom:6,textShadow:"0 2px 12px rgba(0,0,0,.8)"}}>{movie.title||movie.name||""}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>{releaseYear}</span>
              {genres.map(g=><span key={g.id} style={{background:"rgba(255,255,255,.12)",borderRadius:6,padding:"2px 8px",fontSize:11}}>{g.name}</span>)}
              {providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p}/>)}
            </div>
          </div>}
        </div>
        {/* Rating bar */}
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"var(--card)",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>TMDB Score</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--gold)",fontSize:22,fontFamily:"var(--font-head)",fontWeight:800}}>{tmdbRating}</span><span style={{color:"var(--muted)",fontSize:13}}>/ 10</span></div>
          </div>
          <div style={{width:1,height:36,background:"var(--border)"}}/>
          <div><div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>Your Rating</div><StarPicker value={rating} onChange={handleRate} size={16}/></div>
          {svc && <WatchButton serviceId={mainProvider} title={movie.title||movie.name||""} webUrl={svc.url} style={{marginLeft:"auto"}}/>}
          {trailerKey && !showTrailer && <button onClick={()=>setShowTrailer(true)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"var(--text)",padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginLeft:svc?"0":"auto"}}>🎬 Trailer</button>}
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"12px 20px 0",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {["overview","cast","reviews"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"8px 12px",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer"}}>{t}{t==="reviews"?` (${reviews.length})`:""}</button>)}
        </div>
        {/* Content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>
          {tab==="overview" && (
            <div>
              <p style={{fontSize:14,lineHeight:1.75,color:"rgba(240,240,250,.8)",marginBottom:20}}>{movie.overview||details?.overview||"No description available."}</p>
              {(allProviders.flatrate.length>0||allProviders.free.length>0||allProviders.rent.length>0||allProviders.buy.length>0) && (
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>WHERE TO WATCH</div>
                  {allProviders.flatrate.length>0 && <div style={{marginBottom:10}}><div style={{fontSize:11,color:"var(--sports)",fontWeight:700,marginBottom:6}}>✅ INCLUDED IN SUBSCRIPTION</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{allProviders.flatrate.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.25)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700}}>{p.logo_path&&<img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,objectFit:"cover",borderRadius:4}}/>}{p.provider_name}</div>)}</div></div>}
                  {allProviders.free.length>0 && <div style={{marginBottom:10}}><div style={{fontSize:11,color:"var(--gold)",fontWeight:700,marginBottom:6}}>🆓 FREE WITH ADS</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{allProviders.free.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700}}>{p.logo_path&&<img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}{p.provider_name}</div>)}</div></div>}
                  {allProviders.rent.length>0 && <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#a78bfa",fontWeight:700,marginBottom:6}}>💳 RENT</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{allProviders.rent.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700}}>{p.logo_path&&<img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}{p.provider_name}</div>)}</div></div>}
                  {allProviders.buy.length>0 && <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:6}}>🛒 BUY</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{allProviders.buy.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700}}>{p.logo_path&&<img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}{p.provider_name}</div>)}</div></div>}
                </div>
              )}
              {allProviders.flatrate.length===0&&allProviders.free.length===0&&allProviders.rent.length===0&&allProviders.buy.length===0&&details&&(
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:16,marginBottom:20}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:4}}>🔍 Not on streaming right now</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>May be available to rent, buy, or find for free elsewhere:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {[{name:"YouTube",url:`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title||movie.name)}`,color:"#FF0000"},{name:"Amazon",url:`https://www.amazon.com/s?k=${encodeURIComponent(movie.title||movie.name)}+movie`,color:"#00A8E1"},{name:"Apple TV",url:`https://tv.apple.com/search?term=${encodeURIComponent(movie.title||movie.name)}`,color:"#555"},{name:"Vudu",url:`https://www.vudu.com/content/movies/search?searchString=${encodeURIComponent(movie.title||movie.name)}`,color:"#3399FF"},{name:"Google Play",url:`https://play.google.com/store/search?q=${encodeURIComponent(movie.title||movie.name)}&c=movies`,color:"#4285F4"}].map(s=>(
                      <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:6,background:`${s.color}15`,border:`1px solid ${s.color}40`,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,color:"var(--text)",textDecoration:"none",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.background=`${s.color}30`} onMouseLeave={e=>e.currentTarget.style.background=`${s.color}15`}>🔗 {s.name}</a>
                    ))}
                  </div>
                </div>
              )}
              {similar.length>0 && (
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:12,color:"var(--muted)"}}>Similar Titles</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    {similar.map(sm=>{const sgr=safeGR(sm.id);const sp=sm.poster_path?`${TMDB_IMG}${sm.poster_path}`:null;return(
                      <div key={sm.id} onClick={()=>onSelectSimilar&&onSelectSimilar(sm)} style={{background:"var(--card)",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.borderColor="rgba(245,197,24,.4)";}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                        {sp?<img src={sp} alt="" style={{width:"100%",height:100,objectFit:"cover"}}/>:<div style={{height:100,background:`linear-gradient(135deg,${sgr[0]},${sgr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(sm.title||sm.name||"").slice(0,2)}</div>}
                        <div style={{padding:"6px 8px"}}><div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sm.title||sm.name||""}</div><div style={{fontSize:10,color:"var(--gold)"}}>★ {sm.vote_average?.toFixed(1)||"—"}</div></div>
                      </div>
                    );})}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab==="cast" && (
            <div>
              {cast.length===0 ? <div style={{color:"var(--muted)",textAlign:"center",padding:"32px 0"}}>No cast info available.</div>
               : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:14}}>
                   {cast.map(c=>{const cgr=safeGR(c.id);return(
                     <div key={c.id} style={{textAlign:"center"}}>
                       <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 8px",overflow:"hidden",background:`linear-gradient(135deg,${cgr[0]},${cgr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>
                         {c.profile_path?<img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{opacity:.4}}>{(c.name||"").slice(0,2)}</span>}
                       </div>
                       <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{c.name||""}</div>
                       <div style={{fontSize:11,color:"var(--muted)"}}>{c.character||""}</div>
                     </div>
                   );})}
                 </div>}
            </div>
          )}
          {tab==="reviews" && (
            <div>
              <div style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:"var(--radius)",padding:18,marginBottom:24}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,marginBottom:12,fontSize:15}}>{user?"Write a Review":"Sign in to Review"}</div>
                {user ? (
                  <div>
                    <div style={{marginBottom:10}}><div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Your Rating</div><StarPicker value={revRating} onChange={setRevRating}/></div>
                    <input value={revTitle} onChange={e=>setRevTitle(e.target.value)} placeholder="Review title..." style={{...inp,marginBottom:8}}/>
                    <textarea value={revContent} onChange={e=>setRevContent(e.target.value)} placeholder="Share your thoughts..." rows={3} style={{...inp,resize:"vertical",marginBottom:8}}/>
                    <button onClick={submitReview} disabled={submitting} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 20px",fontWeight:600,fontSize:13,cursor:"pointer"}}>{submitting?"Posting…":"Post Review"}</button>
                  </div>
                ) : <div style={{fontSize:13,color:"var(--muted)"}}>Create a free account to leave reviews.</div>}
              </div>
              {reviews.length===0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"32px 0",fontSize:14}}>No reviews yet. Be the first!</div>
               : reviews.map(rv=>(
                <div key={rv.id||Math.random()} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13}}>{((rv.profiles?.username||"U")[0]||"U").toUpperCase()}</div>
                    <div><div style={{fontWeight:600,fontSize:13}}>{rv.profiles?.username||"User"}</div><div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString()}</div></div>
                    <span style={{marginLeft:"auto",background:"rgba(245,197,24,.15)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                    {user?.id===rv.user_id && <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"#ef4444",padding:"4px 10px",fontSize:12,cursor:"pointer"}}>Delete</button>}
                  </div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:5}}>{rv.title||""}</div>
                  <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content||""}</div>
                </div>
              ))}
            </div>
          )}
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
  if (!movie) return <div style={{height:520,background:"linear-gradient(135deg,#0d0d1a,#1a0533)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:40,height:40,border:"3px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/></div>;
  const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
  const poster   = movie.poster_path   ? `${TMDB_IMG}${movie.poster_path}` : null;
  const title    = movie.title||movie.name||"";
  const year     = (movie.release_date||movie.first_air_date||"").slice(0,4);
  const rating   = movie.vote_average?.toFixed(1)||"—";
  const inWL     = watchlist.includes(movie.id);
  const providers = movie.providers||[];
  return (
    <div style={{position:"relative",height:520,overflow:"hidden",cursor:showTrailer?"default":"pointer"}} onClick={()=>!showTrailer&&onSelect(movie)}>
      {showTrailer && trailerKey ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2}} allow="autoplay; fullscreen" allowFullScreen/>
        : backdrop && <img src={backdrop} alt="" onLoad={()=>setLoaded(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:loaded?0.55:0.2,transition:"opacity 1s"}}/>}
      {!showTrailer && <>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(7,7,14,.95) 0%,rgba(7,7,14,.6) 50%,rgba(7,7,14,.2) 100%)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,transparent 40%)"}}/>
      </>}
      {showTrailer && <button onClick={e=>{e.stopPropagation();setShowTrailer(false);}} style={{position:"absolute",top:16,right:16,zIndex:10,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"#fff",padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕ Close Trailer</button>}
      {!showTrailer && (
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:"0 60px"}}>
          <div style={{maxWidth:560}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"5px 14px",marginBottom:20,fontSize:11,fontWeight:700,color:"var(--gold)",letterSpacing:.5}}>🔥 FEATURED</div>
            <h1 style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"clamp(36px,5vw,64px)",lineHeight:1.05,letterSpacing:"-.02em",marginBottom:16,textShadow:"0 4px 24px rgba(0,0,0,.8)"}}>{title}</h1>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <span style={{color:"var(--gold)",fontWeight:700,fontSize:15}}>★ {rating}</span>
              <span style={{color:"var(--muted)",fontSize:14}}>{year}</span>
              {providers.slice(0,3).map(p=><ServiceBadge key={p} platformId={p}/>)}
            </div>
            <p style={{fontSize:15,color:"rgba(240,240,250,.75)",lineHeight:1.7,marginBottom:28,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{movie.overview}</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"13px 28px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>▶ Watch Now</button>
              {trailerKey && <button onClick={e=>{e.stopPropagation();setShowTrailer(true);}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.25)",borderRadius:12,color:"#fff",padding:"13px 24px",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>🎬 Trailer</button>}
              <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,197,24,.2)":"rgba(255,255,255,.08)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.15)"}`,borderRadius:12,color:inWL?"var(--gold)":"#fff",padding:"13px 24px",fontWeight:700,fontSize:15,cursor:"pointer"}}>{inWL?"♥ Saved":"♡ Save"}</button>
            </div>
          </div>
          {poster && <img src={poster} alt={title} style={{marginLeft:"auto",height:340,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,.8)",objectFit:"cover",flexShrink:0}}/>}
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
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{icon}</span><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,color}}>{title}</div></div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>scroll(-1)} style={{background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",width:30,height:30,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <button onClick={()=>scroll(1)} style={{background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",width:30,height:30,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>
      <div ref={ref} style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 24px 8px",scrollbarWidth:"none",scrollSnapType:"x mandatory",touchAction:"pan-x"}}>
        {movies.map(m=><div key={m.id} style={{flexShrink:0,width:155,scrollSnapAlign:"start"}}><MovieCard movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={onSelect} onToggleWatchlist={onToggleWatchlist}/></div>)}
      </div>
    </div>
  );
}

// ─── SKELETON CARD ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return <div style={{borderRadius:"var(--radius)",overflow:"hidden",border:"1px solid var(--border)"}}><div className="skeleton" style={{height:200}}/><div style={{padding:"10px 12px 12px",background:"var(--card)"}}><div className="skeleton" style={{height:14,marginBottom:8,width:"80%"}}/><div className="skeleton" style={{height:11,width:"50%"}}/></div></div>;
}

// ─── DEVICE DETECTION ────────────────────────────────────────────────────────
function useDevice() {
  const [device, setDevice] = useState(() => { const w=window.innerWidth; if(w<=768)return"mobile"; if(w<=1100)return"tablet"; return"desktop"; });
  useEffect(() => {
    const fn=()=>{ const w=window.innerWidth; if(w<=768)setDevice("mobile"); else if(w<=1100)setDevice("tablet"); else setDevice("desktop"); };
    window.addEventListener("resize",fn); return()=>window.removeEventListener("resize",fn);
  }, []);
  return device;
}
function useIsMobile() { return useDevice() === "mobile"; }

// ─── APP SCHEMES / WATCH BUTTON ───────────────────────────────────────────────
const APP_SCHEMES = {
  netflix:{ios:"nflx://",android:"intent://www.netflix.com#Intent;scheme=https;package=com.netflix.mediaclient;end"},
  disney:{ios:"disneyplus://",android:"intent://www.disneyplus.com#Intent;scheme=https;package=com.disney.disneyplus;end"},
  max:{ios:"max://",android:"intent://play.max.com#Intent;scheme=https;package=com.hbo.hbonow;end"},
  hulu:{ios:"hulu://",android:"intent://www.hulu.com#Intent;scheme=https;package=com.hulu.plus;end"},
  apple:{ios:"videos://",android:null},
  prime:{ios:"aiv://",android:"intent://www.amazon.com#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end"},
  peacock:{ios:"peacock://",android:"intent://www.peacocktv.com#Intent;scheme=https;package=com.peacocktv.peacockandroid;end"},
  paramount:{ios:"paramountplus://",android:"intent://www.paramountplus.com#Intent;scheme=https;package=com.cbs.app;end"},
  crunchyroll:{ios:"crunchyroll://",android:"intent://www.crunchyroll.com#Intent;scheme=https;package=com.crunchyroll.crunchyroid;end"},
  espnplus:{ios:"sportscenter://",android:"intent://www.espn.com#Intent;scheme=https;package=com.espn.score_center;end"},
  dazn:{ios:"dazn://",android:"intent://www.dazn.com#Intent;scheme=https;package=com.dazn;end"},
  fubo:{ios:"fubo://",android:"intent://www.fubo.tv#Intent;scheme=https;package=tv.fubo.mobile;end"},
  tubi:{ios:"tubi://",android:"intent://tubitv.com#Intent;scheme=https;package=com.tubitv;end"},
};

function WatchButton({ serviceId, title, webUrl, style }) {
  const svc = SERVICES.find(s => s.id === serviceId);
  if (!svc) return null;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const handleWatch = (e) => {
    e.stopPropagation();
    const isMobileDevice=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid=/Android/i.test(navigator.userAgent);
    const scheme=APP_SCHEMES[serviceId];
    if (isMobileDevice && scheme) {
      if (isIOS && scheme.ios) { const appUrl=scheme.ios; const webFallback=svc.url+encodeURIComponent(title); window.location.href=appUrl; setTimeout(()=>{ window.open(webFallback,"_blank"); },1500); return; }
      if (isAndroid && scheme.android) { window.location.href=scheme.android; setTimeout(()=>{ window.open(svc.url+encodeURIComponent(title),"_blank"); },1500); return; }
    }
    window.open(svc.url+encodeURIComponent(title),"_blank");
  };
  return <button onClick={handleWatch} style={{display:"inline-flex",alignItems:"center",gap:8,background:svc.color,borderRadius:10,color:"#fff",padding:"9px 18px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,border:"none",cursor:"pointer",boxShadow:`0 4px 16px ${svc.color}44`,...style}}>▶ Watch on {svc.name}{isMobile&&<span style={{fontSize:10,opacity:.8}}>📱</span>}</button>;
}

// ─── LEAVING SOON MODAL ───────────────────────────────────────────────────────
function LeavingSoonModal({ onClose, userSubs, tier, onUpgrade }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (tier !== "premium") { setLoading(false); return; }
    const fetchLeaving = async () => {
      try {
        const today = new Date(); const endOfMonth = new Date(today.getFullYear(),today.getMonth()+1,0);
        const res = await fetch(`${TMDB_BASE}/discover/movie?sort_by=popularity.desc&watch_region=US&with_watch_providers=${userSubs.map(s=>({netflix:8,disney:337,max:1899,hulu:15,apple:350,prime:9,peacock:386,paramount:531,crunchyroll:283,espnplus:149})[s]).filter(Boolean).join("|")}&language=en-US&page=1`,{headers:tmdbHeaders});
        const data = await res.json();
        const results = (data.results||[]).slice(0,12).map((m,i)=>({...m,leavingDate:new Date(today.getFullYear(),today.getMonth(),today.getDate()+(i%28)+1).toLocaleDateString("en-US",{month:"short",day:"numeric"}),daysLeft:(i%28)+1}));
        setItems(results);
      } catch(e) {}
      setLoading(false);
    };
    fetchLeaving();
  }, [tier, userSubs]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(239,68,68,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(239,68,68,.12),rgba(245,197,24,.06))"}}>
          <div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>🚨 Leaving Soon</div><div style={{fontSize:13,color:"var(--muted)"}}>Titles leaving your services this month</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {tier!=="premium" ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>🚨</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>Premium Feature</div>
              <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Get notified about titles leaving your services so you never miss a show before it's gone.</div>
              <button onClick={()=>{onUpgrade();onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"12px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>
            </div>
          ) : loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:12,color:"var(--muted)"}}><span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Checking your services…</div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
              {items.map(m=>{const poster=m.poster_path?`${TMDB_IMG}${m.poster_path}`:null;const urgent=m.daysLeft<=7;return(
                <div key={m.id} style={{background:"var(--card)",borderRadius:12,overflow:"hidden",border:`1px solid ${urgent?"rgba(239,68,68,.4)":"var(--border)"}`}}>
                  {poster?<img src={poster} alt="" style={{width:"100%",height:140,objectFit:"cover"}}/>:<div style={{height:140,background:"linear-gradient(135deg,#1a0a0a,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                  <div style={{padding:"8px 10px"}}><div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div><div style={{fontSize:11,color:urgent?"var(--danger)":"var(--muted)",fontWeight:urgent?700:400}}>{urgent?"⚠️ ":"📅 "}Leaves {m.leavingDate}</div><div style={{fontSize:10,color:urgent?"var(--danger)":"var(--muted)",marginTop:2}}>{m.daysLeft} day{m.daysLeft!==1?"s":""} left</div></div>
                </div>
              );})}
            </div>}
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
    supabase.from("watch_history").select("*").eq("user_id",user.id).order("watched_at",{ascending:false}).then(({data})=>{ setHistory(data||[]); setLoading(false); });
  }, [user, tier]);
  const totalWatched=history.length,thisMonth=history.filter(h=>new Date(h.watched_at).getMonth()===new Date().getMonth()).length,thisYear=history.filter(h=>new Date(h.watched_at).getFullYear()===new Date().getFullYear()).length,movies=history.filter(h=>h.movie_type==="movie").length,shows=history.filter(h=>h.movie_type==="tv").length;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:620,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(124,58,237,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(6,182,212,.06))"}}>
          <div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>📺 Watch History & Stats</div><div style={{fontSize:13,color:"var(--muted)"}}>Everything you've watched on StreamHub</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {tier!=="premium" ? <div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:48,marginBottom:16}}>📺</div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>Premium Feature</div><div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Track everything you watch and see your streaming stats.</div><button onClick={()=>{onUpgrade();onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"12px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button></div>
          : loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:12,color:"var(--muted)"}}><span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--purple)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your history…</div>
          : <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
                {[["📺",totalWatched,"Total Watched"],["📅",thisMonth,"This Month"],["🗓️",thisYear,"This Year"],["🎬",movies,"Movies"],["📡",shows,"TV Shows"],["⭐",Math.round(totalWatched*1.2),"Hours Est."]].map(([icon,val,label])=>(
                  <div key={label} style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:12,padding:"14px 10px",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{icon}</div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,color:"var(--purple)"}}>{val}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{label}</div></div>
                ))}
              </div>
              {history.length===0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"32px 0",fontSize:14}}>No watch history yet. Click "Mark as Watched" on any title to start tracking!</div>
              : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {history.map(h=>(
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.03)",borderRadius:10,padding:"10px 12px",border:"1px solid var(--border)"}}>
                      {h.movie_poster?<img src={`${TMDB_IMG}${h.movie_poster}`} alt="" style={{width:40,height:56,objectFit:"cover",borderRadius:6,flexShrink:0}}/>:<div style={{width:40,height:56,background:"var(--card)",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎬</div>}
                      <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.movie_title}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{h.movie_type==="tv"?"📡 TV Show":"🎬 Movie"} · Watched {new Date(h.watched_at).toLocaleDateString()}</div></div>
                    </div>
                  ))}
                </div>}
            </>}
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
  const watchesByService = {};
  (watchHistory||[]).forEach(h => { const svc=h.service_id||(h.providers&&h.providers[0]); if(svc) watchesByService[svc]=(watchesByService[svc]||0)+1; });
  const serviceStats = myServices.map(s => { const watches=watchesByService[s.id]||0; const cpw=watches>0?s.price/watches:null; return {...s,watches,cpw}; }).sort((a,b)=>b.price-a.price);
  const totalWatches=Object.values(watchesByService).reduce((s,v)=>s+v,0);
  const mostUsed=serviceStats.filter(s=>s.watches>0).sort((a,b)=>b.watches-a.watches)[0];
  const leastUsed=serviceStats.filter(s=>s.watches===0&&s.price>0);
  const bestValue=serviceStats.filter(s=>s.cpw!==null).sort((a,b)=>a.cpw-b.cpw)[0];
  const worstValue=serviceStats.filter(s=>s.cpw!==null).sort((a,b)=>b.cpw-a.cpw)[0];

  const generateAIReport = async () => {
    setLoading(true);
    const dataSnapshot={services:serviceStats.map(s=>({name:s.name,price:s.price,watches:s.watches,cpw:s.cpw?.toFixed(2)||"no data"})),totalMonthly:totalMonthly.toFixed(2),totalWatches,watchlistSize:(watchlist||[]).length,ratingsCount:Object.keys(userRatings||{}).length,unusedServices:leastUsed.map(s=>s.name),mostUsed:mostUsed?.name||"none",bestValue:bestValue?`${bestValue.name} at $${bestValue.cpw?.toFixed(2)}/watch`:"none"};
    try {
      const res = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,system:`You are a smart streaming advisor. Analyze streaming data and give brutally honest recommendations. Be specific with dollar amounts. Return ONLY valid JSON with keys: summary (2 sentences), keep (array of {service, reason}), drop (array of {service, reason, savings}), tip (one power tip). No markdown, no extra text.`,messages:[{role:"user",content:`Streaming data: ${JSON.stringify(dataSnapshot)}`}]})});
      if (!res.ok) { const errData=await res.json().catch(()=>({})); throw new Error(errData.error||`HTTP ${res.status}`); }
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"";
      if (!text) throw new Error("Empty AI response");
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setAiReport(parsed);
    } catch(e) { setAiReport({error:e.message,summary:"",keep:[],drop:[],tip:""}); }
    setLoading(false);
  };

  if (tier !== "premium") return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:420,border:"1px solid rgba(16,185,129,.3)",padding:32,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>💰</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:8}}>Streaming Intelligence Report</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:20,lineHeight:1.7}}>AI analyzes your watch history, ratings, and watchlist to tell you exactly which services are worth keeping — and which ones to cut.</div>
        <div style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"left"}}>
          {["Cost-per-watch breakdown per service","AI verdict: Keep, Cut, or Rotate","Personalized save recommendations","Monthly & annual waste calculator","Best value score for your taste"].map((f,i)=><div key={i} style={{display:"flex",gap:8,fontSize:13,color:"var(--muted)",marginBottom:i<4?8:0}}><span style={{color:"var(--sports)"}}>✓</span>{f}</div>)}
        </div>
        <button onClick={()=>{onUpgrade&&onUpgrade();onClose();}} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:10}}>Upgrade to Premium ✦</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(16,185,129,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(245,197,24,.06))",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:2}}>💰 Streaming Intelligence</div><div style={{fontSize:12,color:"var(--muted)"}}>AI-powered analysis of your streaming value</div></div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"flex",gap:4,marginTop:14}}>
            {["overview","ai report"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"rgba(16,185,129,.2)":"none",border:tab===t?"1px solid rgba(16,185,129,.4)":"1px solid transparent",borderRadius:99,color:tab===t?"var(--sports)":"var(--muted)",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize",fontFamily:"var(--font-head)"}}>{t==="ai report"?"🤖 AI Report":"📊 Overview"}</button>)}
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"20px 24px 24px"}}>
          {tab==="overview" && (
            <div>
              <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.1),rgba(16,185,129,.03))",border:"1px solid rgba(16,185,129,.2)",borderRadius:16,padding:"16px 12px",textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,letterSpacing:1.5}}>MONTHLY STREAMING SPEND</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"clamp(32px,8vw,52px)",color:"var(--sports)",lineHeight:1}}>${totalMonthly.toFixed(2)}</div>
                <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:10,flexWrap:"wrap"}}>
                  <div style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>${totalAnnual.toFixed(0)}</div><div style={{fontSize:10,color:"var(--muted)"}}>per year</div></div>
                  <div style={{width:1,background:"var(--border)"}}/>
                  <div style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>${(totalMonthly/30).toFixed(2)}</div><div style={{fontSize:10,color:"var(--muted)"}}>per day</div></div>
                  <div style={{width:1,background:"var(--border)"}}/>
                  <div style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>{totalWatches}</div><div style={{fontSize:10,color:"var(--muted)"}}>watched</div></div>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>COST PER SERVICE — THIS MONTH</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {serviceStats.map(s=>{
                    const pct=totalMonthly>0?(s.price/totalMonthly)*100:0;
                    const verdict=s.watches===0&&s.price>0?"⚠️ Unused":s.cpw&&s.cpw<3?"🟢 Great":s.cpw&&s.cpw<8?"🟡 Average":"🔴 Pricey";
                    return <div key={s.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
                          <span style={{background:s.color,borderRadius:7,width:26,height:26,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",flexShrink:0}}>{s.logo}</span>
                          <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div><div style={{fontSize:10,color:"var(--muted)"}}>{s.watches>0?`${s.watches} watch${s.watches!==1?"es":""}  ·  $${s.cpw.toFixed(2)}/watch`:"No watches yet"}</div></div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:"var(--font-head)",fontWeight:800,color:"var(--sports)",fontSize:13}}>${s.price.toFixed(2)}</div><div style={{fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{verdict}</div></div>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,.05)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:s.watches===0?"rgba(239,68,68,.6)":s.color,borderRadius:99,transition:"width .6s"}}/></div>
                    </div>;
                  })}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:"var(--muted)",letterSpacing:1.2,marginBottom:2}}>QUICK INSIGHTS</div>
                {mostUsed&&<div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>🏆 <strong>{mostUsed.name}</strong> is your most-used — {mostUsed.watches} watches this month</div>}
                {bestValue&&<div style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>💎 Best value: <strong>{bestValue.name}</strong> at <strong>${bestValue.cpw.toFixed(2)}/watch</strong></div>}
                {worstValue&&worstValue.cpw>10&&<div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>⚠️ <strong>{worstValue.name}</strong> is costing <strong>${worstValue.cpw.toFixed(2)}/watch</strong></div>}
                {leastUsed.length>0&&<div style={{background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>💸 <strong>{leastUsed.map(s=>s.name).join(", ")}</strong> — paid for, nothing watched. That's <strong>${leastUsed.reduce((s,sv)=>s+sv.price,0).toFixed(2)}/mo</strong> unused.</div>}
              </div>
              <button onClick={()=>setTab("ai report")} style={{width:"100%",background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(6,182,212,.2))",border:"1px solid rgba(16,185,129,.4)",borderRadius:12,color:"var(--sports)",padding:"11px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,cursor:"pointer"}}>🤖 Get AI Recommendations →</button>
            </div>
          )}
          {tab==="ai report" && (
            <div>
              {!aiReport&&!loading&&(
                <div style={{textAlign:"center",padding:"32px 0"}}>
                  <div style={{fontSize:52,marginBottom:16}}>🤖</div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>AI Streaming Advisor</div>
                  <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.7,maxWidth:380,margin:"0 auto 24px"}}>AI analyzes your watch history, ratings, and watchlist to give you brutally honest advice on what to keep, what to cut, and how to save money.</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24,textAlign:"left"}}>
                    {[`${myServices.length} services · $${totalMonthly.toFixed(2)}/mo`,`${totalWatches} titles watched`,`${(watchlist||[]).length} titles on watchlist`,`${Object.keys(userRatings||{}).length} ratings given`].map((stat,i)=><div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--muted)",display:"flex",alignItems:"center",gap:8}}><span style={{color:"var(--sports)"}}>✓</span>{stat}</div>)}
                  </div>
                  <button onClick={generateAIReport} style={{background:"linear-gradient(135deg,#10b981,#06b6d4)",border:"none",borderRadius:14,color:"#fff",padding:"14px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 32px rgba(16,185,129,.4)"}}>✦ Generate My Report</button>
                </div>
              )}
              {loading&&<div style={{textAlign:"center",padding:"48px 0"}}><div style={{width:48,height:48,border:"3px solid rgba(16,185,129,.2)",borderTop:"3px solid var(--sports)",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/><div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,marginBottom:8}}>Analyzing your streaming habits...</div><div style={{color:"var(--muted)",fontSize:13}}>Calculating cost-per-watch, checking your watchlist, reviewing your ratings</div></div>}
              {aiReport&&!loading&&(
                <div>
                  {aiReport.error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:16,marginBottom:16,textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>😕</div><div style={{fontWeight:700,marginBottom:4}}>Couldn't generate report</div><div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>{aiReport.error}</div><button onClick={()=>{setAiReport(null);generateAIReport();}} style={{background:"var(--sports)",border:"none",borderRadius:10,color:"#fff",padding:"8px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>Try Again</button></div>}
                  <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(6,182,212,.08))",border:"1px solid rgba(16,185,129,.25)",borderRadius:14,padding:16,marginBottom:16}}><div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--sports)",letterSpacing:1.2,marginBottom:8}}>AI SUMMARY</div><div style={{fontSize:14,lineHeight:1.7,color:"rgba(240,240,250,.85)"}}>{aiReport.summary}</div></div>
                  {aiReport.keep?.length>0&&<div style={{marginBottom:14}}><div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--sports)",letterSpacing:1.2,marginBottom:8}}>✅ KEEP THESE</div>{aiReport.keep.map((k,i)=><div key={i} style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13}}><strong>{k.service}</strong> — {k.reason}</div>)}</div>}
                  {aiReport.drop?.length>0&&<div style={{marginBottom:14}}><div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"#ef4444",letterSpacing:1.2,marginBottom:8}}>✂️ CONSIDER CUTTING</div>{aiReport.drop.map((d,i)=><div key={i} style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13}}><strong>{d.service}</strong> — {d.reason}{d.savings&&<span style={{marginLeft:8,background:"rgba(239,68,68,.15)",color:"#ef4444",borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>Save {d.savings}</span>}</div>)}</div>}
                  {aiReport.tip&&<div style={{background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.2)",borderRadius:10,padding:"12px 14px",fontSize:13,marginBottom:16}}>💡 <strong>Power tip:</strong> {aiReport.tip}</div>}
                  <button onClick={()=>{setAiReport(null);generateAIReport();}} style={{width:"100%",background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:10,color:"var(--sports)",padding:"10px 0",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,cursor:"pointer"}}>🔄 Regenerate Report</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MOOD SEARCH MODAL ───────────────────────────────────────────────────────
const MOOD_SEARCH_LIMIT = 3;
const AI_PICKS_LIMIT = 3;

async function getMoodSearchCount(userId) {
  const today = new Date().toISOString().slice(0,10);
  const key = `moodSearch_${userId}_${today}`;
  return parseInt(localStorage.getItem(key)||"0",10);
}
async function incrementMoodSearchCount(userId) {
  const today = new Date().toISOString().slice(0,10);
  const key = `moodSearch_${userId}_${today}`;
  const cur = parseInt(localStorage.getItem(key)||"0",10);
  localStorage.setItem(key, String(cur+1));
}
async function getAIPicksCount(userId) {
  const today = new Date().toISOString().slice(0,10);
  const key = `aiPicks_${userId}_${today}`;
  return parseInt(localStorage.getItem(key)||"0",10);
}
async function incrementAIPicksCount(userId) {
  const today = new Date().toISOString().slice(0,10);
  const key = `aiPicks_${userId}_${today}`;
  const cur = parseInt(localStorage.getItem(key)||"0",10);
  localStorage.setItem(key, String(cur+1));
}

function MoodSearchModal({ onClose, user, tier, userSubs, onUpgrade, showToast, onSelectMovie }) {
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [aiMessage, setAiMessage] = useState("");
  const [usesLeft, setUsesLeft] = useState(null);
  const [searched, setSearched] = useState(false);

  const MOODS = [
    { emoji:"😂", label:"Something funny" },
    { emoji:"😭", label:"Good cry" },
    { emoji:"😨", label:"Scared tonight" },
    { emoji:"🤯", label:"Mind-blowing" },
    { emoji:"🥰", label:"Feel-good vibes" },
    { emoji:"🌙", label:"Late night watch" },
    { emoji:"🎉", label:"Party mode" },
    { emoji:"🧠", label:"Deep & thought-provoking" },
    { emoji:"🔥", label:"Action-packed" },
    { emoji:"💀", label:"Dark & gritty" },
    { emoji:"✨", label:"Visually stunning" },
    { emoji:"🏠", label:"Cozy night in" },
  ];

  useEffect(() => {
    if (!user) return;
    if (tier === "premium") { setUsesLeft(null); return; }
    getMoodSearchCount(user.id).then(count => setUsesLeft(Math.max(0, MOOD_SEARCH_LIMIT - count)));
  }, [user, tier]);

  const doMoodSearch = async (moodText) => {
    if (!user) { showToast("Sign in to use Mood Search! 👤"); return; }
    if (tier !== "premium") {
      const count = await getMoodSearchCount(user.id);
      if (count >= MOOD_SEARCH_LIMIT) { onUpgrade(); onClose(); return; }
    }
    setLoading(true); setResults([]); setAiMessage(""); setSearched(true);
    const activeMood = moodText || mood;
    try {
      const svcNames = userSubs.length > 0 ? SERVICES.filter(s=>userSubs.includes(s.id)).map(s=>s.name).join(", ") : "any service";
      const res = await fetch("/api/ai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system:`You are a streaming expert. Return ONLY valid JSON — no markdown, no extra text. Format: {"message":"brief friendly intro (1 sentence)","titles":[{"title":"exact title","type":"movie or tv","year":2020,"reason":"why this fits the mood in 8 words max"}]} — exactly 6 titles.`,
          messages:[{role:"user",content:`Mood: "${activeMood}". Services available: ${svcNames}. Suggest 6 titles that perfectly match this mood.`}]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setAiMessage(parsed.message||"");
      const tmdbResults = await Promise.all((parsed.titles||[]).map(async t => {
        try {
          const endpoint = t.type==="tv" ? "/search/tv" : "/search/movie";
          const searchRes = await tmdbFetch(`${endpoint}?query=${encodeURIComponent(t.title)}&language=en-US&page=1`);
          const found = searchRes.results?.[0];
          if (!found) return null;
          const wpRes = await fetch(`${TMDB_BASE}/${t.type==="tv"?"tv":"movie"}/${found.id}/watch/providers`,{headers:tmdbHeaders});
          const wpData = await wpRes.json();
          const providers = getProviders(wpData);
          return {...found, providers, category:t.type==="tv"?"tv":"movie", aiReason:t.reason};
        } catch { return null; }
      }));
      setResults(tmdbResults.filter(Boolean));
      if (tier !== "premium") await incrementMoodSearchCount(user.id);
      if (tier !== "premium") setUsesLeft(prev => Math.max(0,(prev||MOOD_SEARCH_LIMIT)-1));
    } catch(e) {
      showToast("Mood search failed — try again");
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:580,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(124,58,237,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"22px 22px 16px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(245,197,24,.06))"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:3}}>🎭 Mood Search</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>Tell us how you feel — AI finds the perfect match</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {tier!=="premium" && usesLeft!==null && <div style={{background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"4px 10px",fontSize:11,color:"var(--gold)",fontWeight:700}}>{usesLeft}/{MOOD_SEARCH_LIMIT} left</div>}
              {tier==="premium" && <div style={{background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"4px 10px",fontSize:11,color:"var(--gold)",fontWeight:700}}>✦ Unlimited</div>}
              <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={mood} onChange={e=>setMood(e.target.value)} onKeyDown={e=>e.key==="Enter"&&mood.trim()&&doMoodSearch(mood)} placeholder="Describe your mood or what you want to watch..." style={{flex:1,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:12,color:"var(--text)",padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"var(--font-body)"}}/>
            <button onClick={()=>mood.trim()&&doMoodSearch(mood)} disabled={loading||!mood.trim()} style={{background:"var(--purple)",border:"none",borderRadius:12,color:"#fff",padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer",opacity:loading||!mood.trim()?0.5:1,flexShrink:0}}>
              {loading?<span style={{display:"inline-block",width:16,height:16,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:"Search"}
            </button>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"16px 22px 22px"}}>
          {!searched && (
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>QUICK MOODS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {MOODS.map(m=>(
                  <button key={m.label} onClick={()=>doMoodSearch(m.label)} style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:12,padding:"10px 8px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",transition:"all .15s",color:"var(--text)",textAlign:"left"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,.2)";e.currentTarget.style.borderColor="rgba(124,58,237,.5)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(124,58,237,.08)";e.currentTarget.style.borderColor="rgba(124,58,237,.2)";}}>
                    <span style={{fontSize:20,flexShrink:0}}>{m.emoji}</span>
                    <span style={{fontSize:12,fontWeight:600,lineHeight:1.3}}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:48,height:48,border:"3px solid rgba(124,58,237,.2)",borderTop:"3px solid var(--purple)",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:6}}>Finding your perfect match…</div>
              <div style={{fontSize:13,color:"var(--muted)"}}>AI is searching across all streaming services</div>
            </div>
          )}
          {!loading && searched && results.length > 0 && (
            <div>
              {aiMessage && <div style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"rgba(240,240,250,.8)",fontStyle:"italic"}}>✨ {aiMessage}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {results.map(m=>{
                  const poster = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null;
                  const gr = safeGR(m.id);
                  return (
                    <div key={m.id} onClick={()=>{onSelectMovie(m);onClose();}} style={{background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.borderColor="rgba(124,58,237,.5)";}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                      {poster ? <img src={poster} alt="" style={{width:"100%",height:120,objectFit:"cover"}}/> : <div style={{height:120,background:`linear-gradient(135deg,${gr[0]},${gr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                      <div style={{padding:"8px 10px"}}>
                        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
                        <div style={{fontSize:11,color:"var(--purple)",fontStyle:"italic",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.aiReason}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{color:"var(--gold)",fontSize:11}}>★ {m.vote_average?.toFixed(1)||"—"}</span>
                          {m.providers?.slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small/>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>
              <div style={{fontSize:40,marginBottom:12}}>🤔</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,marginBottom:8}}>No results found</div>
              <div style={{fontSize:13}}>Try a different mood or description</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEW RELEASES MODAL ───────────────────────────────────────────────────────
function NewReleasesModal({ onClose, userSubs, onSelect }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchNew = async () => {
      try {
        const [movies, tv] = await Promise.all([
          tmdbFetch("/movie/now_playing?language=en-US&page=1&region=US"),
          tmdbFetch("/tv/on_the_air?language=en-US&page=1"),
        ]);
        const combined = [
          ...(movies.results||[]).slice(0,10).map(m=>({...m,category:"movie"})),
          ...(tv.results||[]).slice(0,10).map(t=>({...t,category:"tv"})),
        ].sort((a,b)=>(b.popularity||0)-(a.popularity||0));
        const withProviders = await Promise.all(combined.map(async item => {
          try {
            const type = item.category==="tv" ? "tv" : "movie";
            const wpRes = await fetch(`${TMDB_BASE}/${type}/${item.id}/watch/providers`,{headers:tmdbHeaders});
            const wpData = await wpRes.json();
            return {...item, providers:getProviders(wpData)};
          } catch { return item; }
        }));
        setReleases(withProviders);
      } catch(e) {}
      setLoading(false);
    };
    fetchNew();
  }, []);

  const filtered = filter==="all" ? releases : filter==="subscribed"
    ? releases.filter(r=>(r.providers||[]).some(p=>userSubs.includes(p)))
    : releases.filter(r=>r.category===filter);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:620,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(6,182,212,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"22px 22px 14px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"linear-gradient(135deg,rgba(6,182,212,.1),rgba(124,58,237,.06))"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:2}}>🆕 New Releases</div><div style={{fontSize:12,color:"var(--muted)"}}>What just dropped this week</div></div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["all","All"],["movie","Movies"],["tv","TV Shows"],["subscribed","My Services"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>setFilter(val)} style={{background:filter===val?"rgba(6,182,212,.2)":"rgba(255,255,255,.06)",border:`1px solid ${filter===val?"rgba(6,182,212,.5)":"rgba(255,255,255,.1)"}`,borderRadius:99,color:filter===val?"var(--cyan)":"var(--muted)",padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-head)"}}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"16px 22px 22px"}}>
          {loading ? <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>{Array.from({length:9}).map((_,i)=><div key={i} className="skeleton" style={{height:180,borderRadius:12}}/>)}</div>
          : filtered.length===0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0"}}>No releases match your filter.</div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {filtered.map(m=>{
                const poster=m.poster_path?`${TMDB_IMG}${m.poster_path}`:null;
                const gr=safeGR(m.id);
                return (
                  <div key={m.id} onClick={()=>{onSelect(m);onClose();}} style={{background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.borderColor="rgba(6,182,212,.4)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                    {poster?<img src={poster} alt="" style={{width:"100%",height:130,objectFit:"cover"}}/>:<div style={{height:130,background:`linear-gradient(135deg,${gr[0]},${gr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                    <div style={{padding:"8px 10px"}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:"var(--gold)"}}>★ {m.vote_average?.toFixed(1)||"—"}</span>
                        <span style={{fontSize:9,background:m.category==="tv"?"rgba(124,58,237,.2)":"rgba(245,197,24,.15)",color:m.category==="tv"?"var(--purple)":"var(--gold)",borderRadius:4,padding:"1px 5px",fontWeight:700}}>{m.category==="tv"?"TV":"Film"}</span>
                        {(m.providers||[]).slice(0,1).map(p=><ServiceBadge key={p} platformId={p} small/>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}
        </div>
      </div>
    </div>
  );
}

// ─── PWA INSTALL PROMPT ───────────────────────────────────────────────────────
function PWAInstallPrompt({ onDismiss }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShow(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!show) return null;
  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShow(false); onDismiss();
  };
  return (
    <div style={{position:"fixed",bottom:80,left:16,right:16,zIndex:900,background:"var(--surface)",border:"1px solid rgba(245,197,24,.3)",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,.6)",animation:"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      <div style={{width:42,height:42,borderRadius:10,background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📺</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:2}}>Install StreamHub</div>
        <div style={{fontSize:12,color:"var(--muted)"}}>Add to home screen for quick access</div>
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button onClick={onDismiss} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,color:"var(--muted)",padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Not now</button>
        <button onClick={install} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Install</button>
      </div>
    </div>
  );
}

// ─── WELCOME BANNER ───────────────────────────────────────────────────────────
function WelcomeBanner({ user, tier, onSignIn, onUpgrade }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("welcomeDismissed")==="1");
  if (dismissed) return null;
  if (user && tier==="premium") return null;
  return (
    <div style={{background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(245,197,24,.08))",border:"1px solid rgba(124,58,237,.25)",borderRadius:16,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",position:"relative"}}>
      <button onClick={()=>{setDismissed(true);localStorage.setItem("welcomeDismissed","1");}} style={{position:"absolute",top:10,right:10,background:"none",border:"none",color:"var(--muted)",fontSize:16,cursor:"pointer",lineHeight:1}}>✕</button>
      <div style={{flex:1,minWidth:200}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:4}}>{user?"🌟 Upgrade for the full experience":"👋 Welcome to StreamHub!"}</div>
        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{user?"Unlock Mood Search, AI picks, leaving-soon alerts, watch history & more.":"Search across every streaming service — Netflix, Hulu, Disney+, Prime & more."}</div>
      </div>
      <div style={{display:"flex",gap:10,flexShrink:0}}>
        {!user && <button onClick={onSignIn} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"#fff",padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Sign Up Free</button>}
        <button onClick={user?onUpgrade:onSignIn} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"9px 18px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,cursor:"pointer"}}>{user?"Upgrade ✦":"Get Started →"}</button>
      </div>
    </div>
  );
}

// ─── SEARCH LIMIT WALL ────────────────────────────────────────────────────────
function SearchLimitWall({ onSignUp, onUpgrade, isLoggedIn }) {
  return (
    <div style={{textAlign:"center",padding:"48px 20px",animation:"fadeUp .3s"}}>
      <div style={{fontSize:52,marginBottom:16}}>🔍</div>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:8}}>{isLoggedIn?"Daily Search Limit Reached":"Free Searches Used Up"}</div>
      <div style={{color:"var(--muted)",fontSize:15,marginBottom:28,lineHeight:1.7,maxWidth:400,margin:"0 auto 28px"}}>
        {isLoggedIn ? "You've used all your free searches for today. Upgrade to Premium for unlimited searches." : "You've used your free searches. Create a free account to get more — or upgrade for unlimited."}
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        {!isLoggedIn && <button onClick={onSignUp} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.2)",borderRadius:12,color:"#fff",padding:"12px 24px",fontWeight:700,fontSize:15,cursor:"pointer"}}>Create Free Account</button>}
        <button onClick={onUpgrade} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"12px 28px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>
      </div>
    </div>
  );
}

// ─── SIGNUP PROMPT ────────────────────────────────────────────────────────────
function SignupPrompt({ onSignUp }) {
  return (
    <div style={{background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(245,197,24,.08))",border:"1px solid rgba(124,58,237,.25)",borderRadius:16,padding:"20px 24px",marginTop:20,textAlign:"center"}}>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,marginBottom:6}}>Save your discoveries</div>
      <div style={{color:"var(--muted)",fontSize:14,marginBottom:16,lineHeight:1.6}}>Create a free account to build your watchlist, rate titles, and personalize your feed.</div>
      <button onClick={onSignUp} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"11px 28px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Sign Up Free →</button>
    </div>
  );
}

// ─── PERSONALIZED RECS MODAL ─────────────────────────────────────────────────
function PersonalizedRecsModal({ onClose, user, userRatings, watchlist, userSubs, tier, onUpgrade, onSelectMovie, showToast }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [usesLeft, setUsesLeft] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (tier === "premium") { setUsesLeft(null); return; }
    getAIPicksCount(user.id).then(count => setUsesLeft(Math.max(0, AI_PICKS_LIMIT - count)));
  }, [user, tier]);

  const generate = async () => {
    if (!user) { showToast("Sign in to get personalized picks! 👤"); return; }
    if (tier !== "premium") {
      const count = await getAIPicksCount(user.id);
      if (count >= AI_PICKS_LIMIT) { onUpgrade(); onClose(); return; }
    }
    setLoading(true); setRecs([]); setAiMessage("");
    const topRated = Object.entries(userRatings).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,r])=>({id,rating:r}));
    const svcNames = userSubs.length > 0 ? SERVICES.filter(s=>userSubs.includes(s.id)).map(s=>s.name).join(", ") : "any service";
    try {
      const res = await fetch("/api/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:800,
          system:`You are a streaming expert. Return ONLY valid JSON — no markdown. Format: {"message":"why you'll love these (1 sentence)","titles":[{"title":"exact title","type":"movie or tv","reason":"match reason in 8 words"}]} — exactly 8 titles.`,
          messages:[{role:"user",content:`User's top-rated IDs: ${JSON.stringify(topRated)}. Watchlist size: ${watchlist.length}. Services: ${svcNames}. Recommend 8 titles they'll love.`}]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setAiMessage(parsed.message||"");
      const results = await Promise.all((parsed.titles||[]).map(async t => {
        try {
          const endpoint = t.type==="tv" ? "/search/tv" : "/search/movie";
          const s = await tmdbFetch(`${endpoint}?query=${encodeURIComponent(t.title)}&language=en-US&page=1`);
          const found = s.results?.[0];
          if (!found) return null;
          const wpRes = await fetch(`${TMDB_BASE}/${t.type==="tv"?"tv":"movie"}/${found.id}/watch/providers`,{headers:tmdbHeaders});
          const wpData = await wpRes.json();
          return {...found, providers:getProviders(wpData), category:t.type==="tv"?"tv":"movie", aiReason:t.reason};
        } catch { return null; }
      }));
      setRecs(results.filter(Boolean));
      setGenerated(true);
      if (tier !== "premium") { await incrementAIPicksCount(user.id); setUsesLeft(prev=>Math.max(0,(prev||AI_PICKS_LIMIT)-1)); }
    } catch(e) { showToast("Failed to generate picks — try again"); }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:580,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(245,197,24,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"22px 22px 16px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"linear-gradient(135deg,rgba(245,197,24,.1),rgba(124,58,237,.06))"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:3}}>✦ AI Picks For You</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>Personalized picks based on your taste</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {tier!=="premium" && usesLeft!==null && <div style={{background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"4px 10px",fontSize:11,color:"var(--gold)",fontWeight:700}}>{usesLeft}/{AI_PICKS_LIMIT} left</div>}
              {tier==="premium" && <div style={{background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"4px 10px",fontSize:11,color:"var(--gold)",fontWeight:700}}>✦ Unlimited</div>}
              <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
            </div>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"20px 22px 22px"}}>
          {!generated && !loading && (
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:52,marginBottom:16}}>🤖</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>Personalized Just for You</div>
              <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.7,maxWidth:380,margin:"0 auto 24px"}}>AI analyzes your ratings and watchlist to find titles you'll actually love — not just popular picks.</div>
              {Object.keys(userRatings).length < 3 && <div style={{background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.2)",borderRadius:12,padding:"10px 14px",marginBottom:20,fontSize:13,color:"var(--gold)"}}>💡 Rate at least 3 titles for better recommendations (you have {Object.keys(userRatings).length})</div>}
              <button onClick={generate} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:14,color:"#000",padding:"14px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 32px rgba(245,197,24,.3)"}}>✦ Generate My Picks</button>
            </div>
          )}
          {loading && (
            <div style={{textAlign:"center",padding:"48px 0"}}>
              <div style={{width:48,height:48,border:"3px solid rgba(245,197,24,.2)",borderTop:"3px solid var(--gold)",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:6}}>Analyzing your taste…</div>
              <div style={{fontSize:13,color:"var(--muted)"}}>Matching your ratings with hidden gems</div>
            </div>
          )}
          {generated && !loading && (
            <div>
              {aiMessage && <div style={{background:"rgba(245,197,24,.06)",border:"1px solid rgba(245,197,24,.2)",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"rgba(240,240,250,.8)",fontStyle:"italic"}}>✨ {aiMessage}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
                {recs.map(m=>{
                  const poster=m.poster_path?`${TMDB_IMG}${m.poster_path}`:null;
                  const gr=safeGR(m.id);
                  return (
                    <div key={m.id} onClick={()=>{onSelectMovie(m);onClose();}} style={{background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.borderColor="rgba(245,197,24,.4)";}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                      {poster?<img src={poster} alt="" style={{width:"100%",height:120,objectFit:"cover"}}/>:<div style={{height:120,background:`linear-gradient(135deg,${gr[0]},${gr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                      <div style={{padding:"8px 10px"}}>
                        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
                        <div style={{fontSize:11,color:"var(--gold)",fontStyle:"italic",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.aiReason}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{color:"var(--gold)",fontSize:11}}>★ {m.vote_average?.toFixed(1)||"—"}</span>
                          {(m.providers||[]).slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small/>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={()=>{setGenerated(false);setRecs([]);generate();}} style={{width:"100%",background:"rgba(245,197,24,.1)",border:"1px solid rgba(245,197,24,.3)",borderRadius:10,color:"var(--gold)",padding:"10px 0",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,cursor:"pointer"}}>🔄 Generate New Picks</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADVANCED STATS ───────────────────────────────────────────────────────────
function AdvancedStats({ movies, userRatings, watchlist, tier }) {
  if (tier !== "premium") return null;
  const rated = Object.entries(userRatings);
  if (rated.length === 0) return null;
  const avgRating = rated.reduce((s,[,v])=>s+v,0)/rated.length;
  const topGenres = {};
  movies.forEach(m=>{(m.genre_ids||[]).forEach(g=>{topGenres[g]=(topGenres[g]||0)+1;});});
  return (
    <div style={{background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.15)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>✦ YOUR STATS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[["⭐",avgRating.toFixed(1),"Avg Rating"],["♥",watchlist.length,"Watchlist"],["✍",rated.length,"Rated"]].map(([icon,val,label])=>(
          <div key={label} style={{textAlign:"center",background:"rgba(255,255,255,.03)",borderRadius:10,padding:"10px 6px"}}>
            <div style={{fontSize:16,marginBottom:4}}>{icon}</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,color:"var(--purple)"}}>{val}</div>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MOBILE HERO ──────────────────────────────────────────────────────────────
function MobileHero({ movie, onSelect, onToggleWatchlist, watchlist }) {
  if (!movie) return null;
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const title = movie.title||movie.name||"";
  const inWL = watchlist.includes(movie.id);
  const providers = movie.providers||[];
  return (
    <div onClick={()=>onSelect(movie)} style={{position:"relative",height:280,overflow:"hidden",cursor:"pointer",marginBottom:4}}>
      {poster ? <img src={poster} alt={title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.5}}/> : <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#0d0d1a,#1a0533)"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,rgba(7,7,14,.5) 100%)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"16px 16px 20px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,197,24,.15)",border:"1px solid rgba(245,197,24,.3)",borderRadius:99,padding:"3px 10px",marginBottom:8,fontSize:10,fontWeight:700,color:"var(--gold)"}}>🔥 FEATURED</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,lineHeight:1.1,marginBottom:8,textShadow:"0 2px 12px rgba(0,0,0,.8)"}}>{title}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <span style={{color:"var(--gold)",fontWeight:700,fontSize:13}}>★ {movie.vote_average?.toFixed(1)||"—"}</span>
          {providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small/>)}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{flex:1,background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"10px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>▶ Watch</button>
          <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,197,24,.2)":"rgba(255,255,255,.1)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.2)"}`,borderRadius:10,color:inWL?"var(--gold)":"#fff",padding:"10px 16px",fontWeight:700,fontSize:14,cursor:"pointer"}}>{inWL?"♥":"♡"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── TABLET HERO ──────────────────────────────────────────────────────────────
function TabletHero({ movie, onSelect, onToggleWatchlist, watchlist }) {
  if (!movie) return null;
  const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : null;
  const poster   = movie.poster_path   ? `${TMDB_IMG}${movie.poster_path}` : null;
  const title    = movie.title||movie.name||"";
  const inWL     = watchlist.includes(movie.id);
  const providers = movie.providers||[];
  return (
    <div style={{position:"relative",height:340,overflow:"hidden",cursor:"pointer",marginBottom:8}} onClick={()=>onSelect(movie)}>
      {backdrop ? <img src={backdrop} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.45}}/> : <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#0d0d1a,#1a0533)"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(7,7,14,.92) 0%,rgba(7,7,14,.4) 70%,transparent 100%)"}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,transparent 50%)"}}/>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:"0 32px",gap:24}}>
        {poster && <img src={poster} alt={title} style={{height:200,borderRadius:12,boxShadow:"0 20px 50px rgba(0,0,0,.8)",objectFit:"cover",flexShrink:0}}/>}
        <div style={{flex:1,maxWidth:420}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,197,24,.15)",border:"1px solid rgba(245,197,24,.3)",borderRadius:99,padding:"3px 10px",marginBottom:12,fontSize:10,fontWeight:700,color:"var(--gold)"}}>🔥 FEATURED</div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:28,lineHeight:1.1,marginBottom:10,textShadow:"0 2px 16px rgba(0,0,0,.8)"}}>{title}</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            <span style={{color:"var(--gold)",fontWeight:700,fontSize:14}}>★ {movie.vote_average?.toFixed(1)||"—"}</span>
            {providers.slice(0,3).map(p=><ServiceBadge key={p} platformId={p}/>)}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"11px 24px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>▶ Watch Now</button>
            <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,197,24,.2)":"rgba(255,255,255,.1)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.2)"}`,borderRadius:10,color:inWL?"var(--gold)":"#fff",padding:"11px 20px",fontWeight:700,fontSize:14,cursor:"pointer"}}>{inWL?"♥ Saved":"♡ Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GENRE MAP / SEARCH HELPERS ───────────────────────────────────────────────
const GENRE_MAP = {
  "action":28, "comedy":35, "drama":18, "horror":27, "romance":10749,
  "thriller":53, "sci-fi":878, "scifi":878, "animation":16, "documentary":99,
  "fantasy":14, "mystery":9648, "crime":80, "adventure":12, "family":10751,
  "history":36, "music":10402, "war":10752, "western":37, "biography":36,
};

function isGenreSearch(q) {
  return !!GENRE_MAP[(q||"").toLowerCase().trim()];
}

async function doGenreSearch(q) {
  const genreId = GENRE_MAP[(q||"").toLowerCase().trim()];
  if (!genreId) return [];
  const data = await tmdbFetch(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&language=en-US&page=1`);
  const results = (data.results||[]).slice(0,20);
  return await Promise.all(results.map(async m=>{
    try {
      const wpRes = await fetch(`${TMDB_BASE}/movie/${m.id}/watch/providers`,{headers:tmdbHeaders});
      const wpData = await wpRes.json();
      return {...m, providers:getProviders(wpData), category:"movie"};
    } catch { return {...m, providers:[], category:"movie"}; }
  }));
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function StreamHub() {
  const device = useDevice();
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";

  // Auth state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tier, setTier] = useState("free");
  const [loadingAuth, setLoadingAuth] = useState(true);

  // UI state
  const [view, setView] = useState("trending");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [toast, setToast] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [showLeaving, setShowLeaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCostCalc, setShowCostCalc] = useState(false);
  const [showNewReleases, setShowNewReleases] = useState(false);
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

  // Content state
  const [movies, setMovies] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchLimitHit, setSearchLimitHit] = useState(false);
  const [searchCount, setSearchCount] = useState(0);

  // User data
  const [watchlist, setWatchlist] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [userSubs, setUserSubs] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [favoriteTeams, setFavoriteTeams] = useState(() => {
    try { return JSON.parse(localStorage.getItem("favoriteTeams")||"{}"); } catch { return {}; }
  });

  // Sports state
  const [sportQuery, setSportQuery] = useState("");
  const [showSoccerHub, setShowSoccerHub] = useState(false);

  const showToast = (msg) => setToast(msg);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => {
      if (session?.user) { setUser(session.user); loadUserData(session.user); }
      setLoadingAuth(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session) => {
      if (session?.user) { setUser(session.user); loadUserData(session.user); }
      else { setUser(null); setProfile(null); setTier("free"); setWatchlist([]); setUserRatings({}); setUserSubs([]); setWatchHistory([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    const [profRes, wlRes, ratRes, histRes] = await Promise.allSettled([
      supabase.from("profiles").select("*").eq("id",u.id).single(),
      supabase.from("watchlist").select("movie_id").eq("user_id",u.id),
      supabase.from("ratings").select("movie_id,rating").eq("user_id",u.id),
      supabase.from("watch_history").select("*").eq("user_id",u.id).order("watched_at",{ascending:false}),
    ]);
    if (profRes.status==="fulfilled"&&profRes.value.data) {
      const p = profRes.value.data;
      setProfile(p);
      setTier(p.tier||"free");
      setUserSubs(p.subscriptions||[]);
      if (!p.subscriptions||p.subscriptions.length===0) setTimeout(()=>setShowSetup(true),800);
    }
    if (wlRes.status==="fulfilled") setWatchlist((wlRes.value.data||[]).map(r=>r.movie_id));
    if (ratRes.status==="fulfilled") { const map={}; (ratRes.value.data||[]).forEach(r=>{map[r.movie_id]=r.rating;}); setUserRatings(map); }
    if (histRes.status==="fulfilled") setWatchHistory(histRes.value.data||[]);
  };

  // Load trending content
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [trending, trendingTV, netflixRes, disneyRes, hboRes, animeRes] = await Promise.all([
          tmdbFetch("/trending/movie/week?language=en-US"),
          tmdbFetch("/trending/tv/week?language=en-US"),
          tmdbFetch("/discover/movie?with_watch_providers=8&watch_region=US&sort_by=popularity.desc&language=en-US&page=1"),
          tmdbFetch("/discover/movie?with_watch_providers=337&watch_region=US&sort_by=popularity.desc&language=en-US&page=1"),
          tmdbFetch("/discover/movie?with_watch_providers=1899&watch_region=US&sort_by=popularity.desc&language=en-US&page=1"),
          tmdbFetch("/discover/tv?with_genres=16&with_watch_providers=283&watch_region=US&sort_by=popularity.desc&language=en-US&page=1"),
        ]);
        const addProviders = async (items, type="movie") => {
          return Promise.all(items.slice(0,12).map(async item => {
            try {
              const wpRes = await fetch(`${TMDB_BASE}/${type}/${item.id}/watch/providers`,{headers:tmdbHeaders});
              const wpData = await wpRes.json();
              return {...item, providers:getProviders(wpData), category:type};
            } catch { return {...item, providers:[], category:type}; }
          }));
        };
        const [tMovies, tTV, nfx, dis, hbo, ani] = await Promise.all([
          addProviders(trending.results||[]),
          addProviders(trendingTV.results||[], "tv"),
          addProviders(netflixRes.results||[]),
          addProviders(disneyRes.results||[]),
          addProviders(hboRes.results||[]),
          addProviders(animeRes.results||[], "tv"),
        ]);
        const all = [...tMovies,...tTV,...nfx,...dis,...hbo,...ani];
        setMovies(all);
        setFeatured(tMovies[0]||all[0]||null);
      } catch(e) {}
      setLoading(false);
    };
    load();
  }, []);

  // Search logic
  const doSearch = async (q) => {
    if (!q.trim()) { setSearchResults([]); setSearch(""); return; }
    const sportInfo = getEspnSport(q);
    if (q.toLowerCase()==="soccer_hub") { setView("sports"); setSportQuery(""); setShowSoccerHub(true); setSearch(""); return; }
    if (sportInfo || q.toLowerCase().includes("world cup") || q.toLowerCase().includes("wwe") || q.toLowerCase().includes("wrestling") || q.toLowerCase().includes("ufc") || q.toLowerCase().includes("mma") || q.toLowerCase().includes("nfl") || q.toLowerCase().includes("nba") || q.toLowerCase().includes("mlb") || q.toLowerCase().includes("nhl") || q.toLowerCase().includes("formula") || q.toLowerCase().includes("f1") || q.toLowerCase().includes("college football") || q.toLowerCase().includes("olympics")) {
      setView("sports"); setSportQuery(q); setShowSoccerHub(false); setSearch(q); return;
    }
    if (isGenreSearch(q)) {
      setSearching(true); setSearch(q); setSearchResults([]);
      const results = await doGenreSearch(q);
      setSearchResults(results); setSearching(false); return;
    }
    const SEARCH_LIMIT = user ? (tier==="premium" ? Infinity : 10) : 3;
    if (searchCount >= SEARCH_LIMIT) { setSearchLimitHit(true); return; }
    setSearching(true); setSearch(q); setSearchResults([]);
    try {
      const [mRes, tvRes] = await Promise.all([
        tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&language=en-US&page=1`),
        tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}&language=en-US&page=1`),
      ]);
      const combined = [...(mRes.results||[]).map(m=>({...m,category:"movie"})),...(tvRes.results||[]).map(t=>({...t,category:"tv"}))].sort((a,b)=>(b.popularity||0)-(a.popularity||0)).slice(0,20);
      const withProviders = await Promise.all(combined.map(async item=>{
        try {
          const type=item.category==="tv"?"tv":"movie";
          const wpRes=await fetch(`${TMDB_BASE}/${type}/${item.id}/watch/providers`,{headers:tmdbHeaders});
          const wpData=await wpRes.json();
          return {...item,providers:getProviders(wpData)};
        } catch { return item; }
      }));
      setSearchResults(withProviders);
      setSearchCount(c=>c+1);
      track("search",{search_term:q});
    } catch(e) {}
    setSearching(false);
  };

  const handleSearch = (e) => { e.preventDefault(); doSearch(searchInput); };

  const handleSetView = (v) => {
    setView(v); setSearch(""); setSearchInput(""); setSearchResults([]); setSearchLimitHit(false);
    if (v!=="sports") { setSportQuery(""); setShowSoccerHub(false); }
  };

  const toggleWatchlist = async (movieId) => {
    if (!user) { setShowAuth(true); return; }
    const inWL = watchlist.includes(movieId);
    setWatchlist(prev => inWL ? prev.filter(id=>id!==movieId) : [...prev,movieId]);
    if (inWL) { await supabase.from("watchlist").delete().eq("user_id",user.id).eq("movie_id",movieId); }
    else { await supabase.from("watchlist").insert({user_id:user.id,movie_id:movieId}); showToast("Added to watchlist! ♥"); }
  };

  const handleRate = (movieId, rating) => {
    setUserRatings(prev=>({...prev,[movieId]:rating}));
  };

  const handleSaveSubs = async (subs) => {
    setUserSubs(subs);
    if (user) await supabase.from("profiles").update({subscriptions:subs}).eq("id",user.id);
  };

  const handleToggleFavoriteTeam = (sport, teamName) => {
    setFavoriteTeams(prev => {
      const next = {...prev};
      if (teamName === "_clear") { delete next[sport]; }
      else { next[sport] = teamName; }
      localStorage.setItem("favoriteTeams", JSON.stringify(next));
      return next;
    });
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); showToast("Signed out 👋"); };

  const displayMovies = search ? searchResults : movies;
  const trending  = displayMovies.filter(m=>!m.category||m.category==="movie"||m.category==="trending").slice(0,20);
  const tvShows   = displayMovies.filter(m=>m.category==="tv").slice(0,20);
  const animeList = displayMovies.filter(m=>m.category==="anime"||((m.genre_ids||[]).includes(16)&&m.category==="tv")).slice(0,20);
  const allMovies = [...new Map([...displayMovies].map(m=>[m.id,m])).values()];

  const navTabs = CATEGORY_TABS;

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{minHeight:"100vh",paddingBottom:80}}>
        <GlobalStyles/>
        <Analytics/>
        {showToast&&toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}

        {/* Mobile Header */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid var(--border)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
          <Logo size={22}/>
          <form onSubmit={handleSearch} style={{flex:1,display:"flex",gap:8}}>
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Search movies, shows, sports…"
              style={{flex:1,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"var(--text)",padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"var(--font-body)"}}/>
            <button type="submit" style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"8px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>🔍</button>
          </form>
          <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{background:"rgba(255,255,255,.08)",border:"1px solid var(--border)",borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"var(--text)",flexShrink:0}}>
            {user?(profile?.avatar_url?<img src={profile.avatar_url} style={{width:30,height:30,borderRadius:"50%",objectFit:"cover",border:tier==="premium"?"2px solid var(--gold)":"none"}} alt=""/>:"👤"):"👤"}
          </button>
        </div>

        {/* Mobile Content */}
        <div style={{padding:"12px 12px 0"}}>
          <WelcomeBanner user={user} tier={tier} onSignIn={()=>setShowAuth(true)} onUpgrade={()=>setShowUpgrade(true)}/>

          {/* Mobile Quick Tools */}
          <div style={{display:"flex",gap:8,marginBottom:12,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
            {[
              {label:"🎭 Mood",onClick:()=>{if(!user){setShowAuth(true);return;}setShowMood(true);},premium:true},
              {label:"✦ AI Picks",onClick:()=>{if(!user){setShowAuth(true);return;}setShowPersonalized(true);},premium:true},
              {label:"🆕 New",onClick:()=>setShowNewReleases(true),premium:false},
              {label:"🚨 Leaving",onClick:()=>{if(!user){setShowAuth(true);return;}setShowLeaving(true);},premium:true},
              {label:"💰 Cost",onClick:()=>{if(!user){setShowAuth(true);return;}setShowCostCalc(true);},premium:true},
            ].map(t=>(
              <button key={t.label} onClick={t.onClick} style={{flexShrink:0,background:t.premium&&tier!=="premium"?"rgba(245,197,24,.08)":"rgba(255,255,255,.07)",border:`1px solid ${t.premium&&tier!=="premium"?"rgba(245,197,24,.2)":"rgba(255,255,255,.1)"}`,borderRadius:99,color:t.premium&&tier!=="premium"?"var(--gold)":"var(--text)",padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                {t.label}{t.premium&&tier!=="premium"?" ✦":""}
              </button>
            ))}
          </div>

          {view === "sports" ? (
            <div>
              <SportsTabHeader onSearch={(q)=>{setSportQuery(q);setShowSoccerHub(false);}}/>
              {showSoccerHub
                ? <SoccerHub onSearch={(q)=>{setSportQuery(q);setShowSoccerHub(false);}} favoriteTeams={favoriteTeams}/>
                : sportQuery
                  ? <LiveSportsSection sportQuery={sportQuery} favoriteTeams={favoriteTeams} onToggleFavorite={handleToggleFavoriteTeam}/>
                  : <SportCategoryGrid onSearch={(q)=>{if(q==="soccer_hub"){setShowSoccerHub(true);}else{setSportQuery(q);}}} favoriteTeams={favoriteTeams}/>
              }
              {!sportQuery && !showSoccerHub && <SportsStreamingGuide onSearch={setSportQuery}/>}
            </div>
          ) : (
            <div>
              {!search && <MobileHero movie={featured} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} watchlist={watchlist}/>}
              {/* Sports Hub Promo */}
              <SportsHubPromo onNavigate={(v)=>{handleSetView(v);setSearch("");}}/>
              {/* Mobile Premium Tools Strip */}
              {tier!=="premium" && !search && (
                <div style={{background:"linear-gradient(135deg,rgba(245,197,24,.08),rgba(124,58,237,.06))",border:"1px solid rgba(245,197,24,.15)",borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,marginBottom:4}}>✦ Upgrade to Premium</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>Mood Search · AI Picks · Leaving Soon · Watch History · Cost Calculator</div>
                  <button onClick={()=>setShowUpgrade(true)} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"7px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,cursor:"pointer"}}>Upgrade — $9.99/mo</button>
                </div>
              )}
              {searchLimitHit ? <SearchLimitWall onSignUp={()=>setShowAuth(true)} onUpgrade={()=>setShowUpgrade(true)} isLoggedIn={!!user}/>
              : searching ? <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>{Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}</div>
              : search && searchResults.length===0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>No results for "{search}"</div>
              : search ? (
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:12}}>{searchResults.length} results for "{search}"</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                    {searchResults.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>)}
                  </div>
                  {!user&&<SignupPrompt onSignUp={()=>setShowAuth(true)}/>}
                </div>
              ) : loading ? <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>{Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}</div>
              : (
                <div>
                  <FeaturedRow title="Trending Now" icon="🔥" movies={movies.slice(0,12)} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>
                  <FeaturedRow title="TV Shows" icon="📺" movies={tvShows} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--purple)"/>
                  <FeaturedRow title="Anime" icon="✦" movies={animeList} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--anime)"/>
                  {!user&&<SignupPrompt onSignUp={()=>setShowAuth(true)}/>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(7,7,14,.97)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--border)",display:"flex",zIndex:200,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {navTabs.map(tab=>{
            const active = tab.id==="search" ? !!search : view===tab.id&&!search;
            const isSports = tab.id==="sports";
            return (
              <button key={tab.id} onClick={()=>{if(tab.id==="search"){const q=prompt("Search…");if(q){setSearchInput(q);doSearch(q);}}else{handleSetView(tab.id);}}}
                style={{flex:1,background:"none",border:"none",color:active?tab.color:"var(--muted)",padding:"10px 4px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",position:"relative",animation:isSports?"sportsTabPulse 3s ease-in-out infinite":undefined}}>
                <span style={{fontSize:18,display:"inline-block",animation:active&&tab.anim?`${tab.anim} 0.8s ease-in-out`:undefined}}>{tab.icon}</span>
                <span style={{fontSize:9,fontWeight:active?700:500,letterSpacing:.3,whiteSpace:"nowrap"}}>{tab.label}</span>
                {isSports && <div style={{position:"absolute",top:6,right:"calc(50% - 16px)",width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.5s infinite",boxShadow:"0 0 6px #ef4444"}}/>}
                {active && <div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:tab.color,borderRadius:"0 0 2px 2px"}}/>}
              </button>
            );
          })}
        </div>

        {/* Modals */}
        {showAuth    && <AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
        {showProfile && user && <ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={handleSignOut} onUpgrade={()=>{setShowProfile(false);setShowUpgrade(true);}} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={setSelectedMovie}/>}
        {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>{setTier("premium");showToast("Welcome to Premium! ✦");setShowUpgrade(false);}}/>}
        {showSetup   && <SetupModal userSubs={userSubs} onSave={handleSaveSubs} onClose={()=>setShowSetup(false)} isFirst={userSubs.length===0}/>}
        {showMood    && <MoodSearchModal onClose={()=>setShowMood(false)} user={user} tier={tier} userSubs={userSubs} onUpgrade={()=>{setShowMood(false);setShowUpgrade(true);}} showToast={showToast} onSelectMovie={setSelectedMovie}/>}
        {showLeaving && <LeavingSoonModal onClose={()=>setShowLeaving(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>{setShowLeaving(false);setShowUpgrade(true);}}/>}
        {showHistory && <WatchHistoryModal onClose={()=>setShowHistory(false)} user={user} tier={tier} onUpgrade={()=>{setShowHistory(false);setShowUpgrade(true);}}/>}
        {showCostCalc && <CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>{setShowCostCalc(false);setShowUpgrade(true);}}/>}
        {showNewReleases && <NewReleasesModal onClose={()=>setShowNewReleases(false)} userSubs={userSubs} onSelect={setSelectedMovie}/>}
        {showPersonalized && <PersonalizedRecsModal onClose={()=>setShowPersonalized(false)} user={user} userRatings={userRatings} watchlist={watchlist} userSubs={userSubs} tier={tier} onUpgrade={()=>{setShowPersonalized(false);setShowUpgrade(true);}} onSelectMovie={setSelectedMovie} showToast={showToast}/>}
        {selectedMovie && <MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} showToast={showToast} onSelectSimilar={setSelectedMovie}/>}
        {showPWAPrompt && <PWAInstallPrompt onDismiss={()=>setShowPWAPrompt(false)}/>}
      </div>
    );
  }

  // ── TABLET LAYOUT ──────────────────────────────────────────────────────────
  if (isTablet) {
    return (
      <div style={{minHeight:"100vh",paddingBottom:80}}>
        <GlobalStyles/>
        <Analytics/>
        {showToast&&toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}

        {/* Tablet Header */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.96)",backdropFilter:"blur(16px)",borderBottom:"1px solid var(--border)",padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
          <Logo size={26}/>
          <form onSubmit={handleSearch} style={{flex:1,display:"flex",gap:8}}>
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Search movies, shows, sports, or a mood…"
              style={{flex:1,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"var(--text)",padding:"10px 16px",fontSize:14,outline:"none",fontFamily:"var(--font-body)"}}/>
            <button type="submit" style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"10px 18px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"var(--font-head)"}}>Search</button>
          </form>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {tier!=="premium"&&<button onClick={()=>setShowUpgrade(true)} style={{background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.3)",borderRadius:99,color:"var(--gold)",padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✦ Premium</button>}
            <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{background:"rgba(255,255,255,.08)",border:"1px solid var(--border)",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
              {user?(profile?.avatar_url?<img src={profile.avatar_url} style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",border:tier==="premium"?"2px solid var(--gold)":"none"}} alt=""/>:"👤"):"👤"}
            </button>
          </div>
        </div>

        {/* Tablet Content */}
        <div style={{padding:"16px 20px 0"}}>
          <WelcomeBanner user={user} tier={tier} onSignIn={()=>setShowAuth(true)} onUpgrade={()=>setShowUpgrade(true)}/>

          {view==="sports" ? (
            <div>
              <SportsTabHeader onSearch={(q)=>{setSportQuery(q);setShowSoccerHub(false);}}/>
              {showSoccerHub
                ? <SoccerHub onSearch={(q)=>{setSportQuery(q);setShowSoccerHub(false);}} favoriteTeams={favoriteTeams}/>
                : sportQuery
                  ? <LiveSportsSection sportQuery={sportQuery} favoriteTeams={favoriteTeams} onToggleFavorite={handleToggleFavoriteTeam}/>
                  : <SportCategoryGrid onSearch={(q)=>{if(q==="soccer_hub"){setShowSoccerHub(true);}else{setSportQuery(q);}}} favoriteTeams={favoriteTeams}/>
              }
              {!sportQuery && !showSoccerHub && <SportsStreamingGuide onSearch={setSportQuery}/>}
            </div>
          ) : (
            <div>
              {!search && <TabletHero movie={featured} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} watchlist={watchlist}/>}
              {/* Tablet Premium Tools */}
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                {[
                  {label:"🎭 Mood Search",onClick:()=>{if(!user){setShowAuth(true);return;}setShowMood(true);},premium:true},
                  {label:"✦ AI Picks",onClick:()=>{if(!user){setShowAuth(true);return;}setShowPersonalized(true);},premium:true},
                  {label:"🆕 New Releases",onClick:()=>setShowNewReleases(true),premium:false},
                  {label:"🚨 Leaving Soon",onClick:()=>{if(!user){setShowAuth(true);return;}setShowLeaving(true);},premium:true},
                  {label:"💰 Cost Calculator",onClick:()=>{if(!user){setShowAuth(true);return;}setShowCostCalc(true);},premium:true},
                ].map(t=>(
                  <button key={t.label} onClick={t.onClick} style={{background:t.premium&&tier!=="premium"?"rgba(245,197,24,.08)":"rgba(255,255,255,.07)",border:`1px solid ${t.premium&&tier!=="premium"?"rgba(245,197,24,.2)":"rgba(255,255,255,.1)"}`,borderRadius:99,color:t.premium&&tier!=="premium"?"var(--gold)":"var(--text)",padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                    {t.label}{t.premium&&tier!=="premium"?" ✦":""}
                  </button>
                ))}
              </div>
              {/* Sports Hub Promo for Tablet */}
              <SportsHubPromo onNavigate={(v)=>{setView(v);setSearch("");}}/>
              {/* Tablet Premium upsell */}
              {tier!=="premium"&&!search&&(
                <div style={{background:"linear-gradient(135deg,rgba(245,197,24,.08),rgba(124,58,237,.06))",border:"1px solid rgba(245,197,24,.15)",borderRadius:14,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
                  <div><div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:4}}>✦ Unlock Everything</div><div style={{fontSize:13,color:"var(--muted)"}}>Mood Search · AI Picks · Leaving Soon · Watch History · Cost Calculator</div></div>
                  <button onClick={()=>setShowUpgrade(true)} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"10px 20px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer",flexShrink:0}}>Upgrade — $9.99/mo</button>
                </div>
              )}
              {searchLimitHit ? <SearchLimitWall onSignUp={()=>setShowAuth(true)} onUpgrade={()=>setShowUpgrade(true)} isLoggedIn={!!user}/>
              : searching ? <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>{Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}</div>
              : search && searchResults.length===0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:15}}>No results for "{search}"</div>
              : search ? (
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,marginBottom:14}}>{searchResults.length} results for "{search}"</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>{searchResults.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>)}</div>
                  {!user&&<SignupPrompt onSignUp={()=>setShowAuth(true)}/>}
                </div>
              ) : loading ? <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>{Array.from({length:9}).map((_,i)=><SkeletonCard key={i}/>)}</div>
              : (
                <div>
                  <FeaturedRow title="Trending Now" icon="🔥" movies={movies.slice(0,12)} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>
                  <FeaturedRow title="TV Shows" icon="📺" movies={tvShows} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--purple)"/>
                  <FeaturedRow title="Anime" icon="✦" movies={animeList} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--anime)"/>
                  {!user&&<SignupPrompt onSignUp={()=>setShowAuth(true)}/>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tablet Bottom Nav */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(7,7,14,.97)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"center",gap:4,padding:"8px 20px",paddingBottom:"env(safe-area-inset-bottom,8px)",zIndex:200}}>
          {navTabs.map(tab=>{
            const active = view===tab.id&&!search;
            const isSports = tab.id==="sports";
            return (
              <button key={tab.id} onClick={()=>tab.id!=="search"?handleSetView(tab.id):null}
                style={{background:active?`${tab.color}18`:"none",border:active?`1px solid ${tab.color}40`:"1px solid transparent",color:active?tab.color:"var(--muted)",padding:"8px 18px",borderRadius:12,display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:active?700:500,position:"relative",transition:"all .2s",animation:isSports?"sportsTabPulse 3s ease-in-out infinite":undefined}}>
                <span style={{fontSize:16,animation:active&&tab.anim?`${tab.anim} 0.8s ease-in-out`:undefined}}>{tab.icon}</span>
                {tab.label}
                {isSports && <div style={{position:"absolute",top:6,right:10,width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.5s infinite",boxShadow:"0 0 6px #ef4444"}}/>}
              </button>
            );
          })}
        </div>

        {/* Modals */}
        {showAuth    && <AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
        {showProfile && user && <ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={handleSignOut} onUpgrade={()=>{setShowProfile(false);setShowUpgrade(true);}} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={setSelectedMovie}/>}
        {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>{setTier("premium");showToast("Welcome to Premium! ✦");setShowUpgrade(false);}}/>}
        {showSetup   && <SetupModal userSubs={userSubs} onSave={handleSaveSubs} onClose={()=>setShowSetup(false)} isFirst={userSubs.length===0}/>}
        {showMood    && <MoodSearchModal onClose={()=>setShowMood(false)} user={user} tier={tier} userSubs={userSubs} onUpgrade={()=>{setShowMood(false);setShowUpgrade(true);}} showToast={showToast} onSelectMovie={setSelectedMovie}/>}
        {showLeaving && <LeavingSoonModal onClose={()=>setShowLeaving(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>{setShowLeaving(false);setShowUpgrade(true);}}/>}
        {showHistory && <WatchHistoryModal onClose={()=>setShowHistory(false)} user={user} tier={tier} onUpgrade={()=>{setShowHistory(false);setShowUpgrade(true);}}/>}
        {showCostCalc && <CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>{setShowCostCalc(false);setShowUpgrade(true);}}/>}
        {showNewReleases && <NewReleasesModal onClose={()=>setShowNewReleases(false)} userSubs={userSubs} onSelect={setSelectedMovie}/>}
        {showPersonalized && <PersonalizedRecsModal onClose={()=>setShowPersonalized(false)} user={user} userRatings={userRatings} watchlist={watchlist} userSubs={userSubs} tier={tier} onUpgrade={()=>{setShowPersonalized(false);setShowUpgrade(true);}} onSelectMovie={setSelectedMovie} showToast={showToast}/>}
        {selectedMovie && <MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} showToast={showToast} onSelectSimilar={setSelectedMovie}/>}
      </div>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <GlobalStyles/>
      <Analytics/>
      {showToast&&toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}

      {/* Desktop Header */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 40px"}}>
        <div style={{maxWidth:1600,margin:"0 auto",height:64,display:"flex",alignItems:"center",gap:20}}>
          <Logo size={28}/>
          {/* Nav tabs */}
          <nav style={{display:"flex",gap:2,marginLeft:16}}>
            {navTabs.filter(t=>t.id!=="search").map(tab=>{
              const active = view===tab.id&&!search;
              const isSports = tab.id==="sports";
              return (
                <button key={tab.id} onClick={()=>handleSetView(tab.id)}
                  style={{background:active?`${tab.color}15`:"none",border:"none",color:active?tab.color:"var(--muted)",padding:"8px 14px",borderRadius:10,fontFamily:"var(--font-head)",fontWeight:active?700:500,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,position:"relative",transition:"all .2s",animation:isSports&&!active?"sportsTabPulse 3s ease-in-out infinite":undefined}}>
                  <span style={{animation:active&&tab.anim?`${tab.anim} 0.8s ease-in-out`:undefined}}>{tab.icon}</span>
                  {tab.label}
                  {isSports && <div style={{position:"absolute",top:5,right:8,width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.5s infinite",boxShadow:"0 0 6px #ef4444"}}/>}
                </button>
              );
            })}
          </nav>
          {/* Search */}
          <form onSubmit={handleSearch} style={{flex:1,maxWidth:440,margin:"0 16px",position:"relative"}}>
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Search movies, shows, sports, anime…"
              style={{width:"100%",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"var(--text)",padding:"10px 48px 10px 16px",fontSize:14,outline:"none",fontFamily:"var(--font-body)"}}
              onFocus={e=>e.target.style.borderColor="rgba(245,197,24,.4)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
            <button type="submit" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",fontSize:16,cursor:"pointer"}}>🔍</button>
          </form>
          {/* Header actions */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto"}}>
            {tier!=="premium"&&<button onClick={()=>setShowUpgrade(true)} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:99,color:"#000",padding:"7px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,cursor:"pointer",animation:"badgePop 2s ease-in-out infinite"}}>✦ Go Premium</button>}
            <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",overflow:"hidden",boxShadow:tier==="premium"?"0 0 12px rgba(245,197,24,.4)":"none",outline:tier==="premium"?"2px solid var(--gold)":"none",outlineOffset:2}}>
              {user?(profile?.avatar_url?<img src={profile.avatar_url} style={{width:36,height:36,objectFit:"cover",borderRadius:"50%"}} alt=""/>:"👤"):"👤"}
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Main */}
      <div style={{flex:1,display:"flex",maxWidth:1600,width:"100%",margin:"0 auto",padding:"0 40px",gap:32}}>
        {/* Main content area */}
        <main style={{flex:1,minWidth:0,paddingTop:32}}>
          <WelcomeBanner user={user} tier={tier} onSignIn={()=>setShowAuth(true)} onUpgrade={()=>setShowUpgrade(true)}/>

          {view==="sports" ? (
            <div>
              <SportsTabHeader onSearch={(q)=>{setSportQuery(q);setShowSoccerHub(false);}}/>
              {showSoccerHub
                ? <SoccerHub onSearch={(q)=>{setSportQuery(q);setShowSoccerHub(false);}} favoriteTeams={favoriteTeams}/>
                : sportQuery
                  ? <LiveSportsSection sportQuery={sportQuery} favoriteTeams={favoriteTeams} onToggleFavorite={handleToggleFavoriteTeam}/>
                  : <SportCategoryGrid onSearch={(q)=>{if(q==="soccer_hub"){setShowSoccerHub(true);}else{setSportQuery(q);}}} favoriteTeams={favoriteTeams}/>
              }
              {!sportQuery && !showSoccerHub && <SportsStreamingGuide onSearch={setSportQuery}/>}
            </div>
          ) : (
            <div>
              {!search && <HeroBanner movie={featured} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} watchlist={watchlist}/>}
              {searchLimitHit ? <SearchLimitWall onSignUp={()=>setShowAuth(true)} onUpgrade={()=>setShowUpgrade(true)} isLoggedIn={!!user}/>
              : searching ? <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginTop:24}}>{Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)}</div>
              : search && searchResults.length===0 ? <div style={{textAlign:"center",color:"var(--muted)",padding:"60px 0",fontSize:16}}>No results found for "{search}"</div>
              : search ? (
                <div style={{marginTop:24}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:18,marginBottom:16}}>{searchResults.length} results for "{search}"</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>{searchResults.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>)}</div>
                  {!user&&<SignupPrompt onSignUp={()=>setShowAuth(true)}/>}
                </div>
              ) : loading ? <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginTop:24}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
              : (
                <div>
                  <FeaturedRow title="Trending Now" icon="🔥" movies={movies.slice(0,16)} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>
                  <FeaturedRow title="TV Shows" icon="📺" movies={tvShows} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--purple)"/>
                  <FeaturedRow title="Anime" icon="✦" movies={animeList} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--anime)"/>
                  {!user&&<SignupPrompt onSignUp={()=>setShowAuth(true)}/>}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Desktop Sidebar */}
        <aside style={{width:280,paddingTop:32,flexShrink:0}}>
          <div style={{position:"sticky",top:96,display:"flex",flexDirection:"column",gap:12}}>
            {/* Sports Hub Promo */}
            <SportsHubPromo onNavigate={(v)=>{setView(v);setSearch("");}}/>
            {/* Premium Tools */}
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--muted)",letterSpacing:1.2,marginBottom:4}}>PREMIUM TOOLS</div>
              {[
                {icon:"🎭",label:"Mood Search",desc:"AI finds your perfect match",onClick:()=>{if(!user){setShowAuth(true);return;}if(tier!=="premium"){setShowUpgrade(true);return;}setShowMood(true);},locked:tier!=="premium"},
                {icon:"✦",label:"AI Picks",desc:"Personalized recommendations",onClick:()=>{if(!user){setShowAuth(true);return;}if(tier!=="premium"){setShowUpgrade(true);return;}setShowPersonalized(true);},locked:tier!=="premium"},
                {icon:"🆕",label:"New Releases",desc:"What just dropped",onClick:()=>setShowNewReleases(true),locked:false},
                {icon:"🚨",label:"Leaving Soon",desc:"Don't miss these titles",onClick:()=>{if(!user){setShowAuth(true);return;}if(tier!=="premium"){setShowUpgrade(true);return;}setShowLeaving(true);},locked:tier!=="premium"},
                {icon:"📺",label:"Watch History",desc:"Track your viewing stats",onClick:()=>{if(!user){setShowAuth(true);return;}if(tier!=="premium"){setShowUpgrade(true);return;}setShowHistory(true);},locked:tier!=="premium"},
                {icon:"💰",label:"Cost Calculator",desc:"Optimize your subscriptions",onClick:()=>{if(!user){setShowAuth(true);return;}if(tier!=="premium"){setShowUpgrade(true);return;}setShowCostCalc(true);},locked:tier!=="premium"},
              ].map(t=>(
                <button key={t.label} onClick={t.onClick} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${t.locked?"rgba(245,197,24,.15)":"rgba(255,255,255,.07)"}`,borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",transition:"all .2s",color:"var(--text)"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.08)";e.currentTarget.style.borderColor=t.locked?"rgba(245,197,24,.35)":"rgba(255,255,255,.18)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor=t.locked?"rgba(245,197,24,.15)":"rgba(255,255,255,.07)";}}>
                  <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div>
                    <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</div>
                  </div>
                  {t.locked && <span style={{fontSize:10,color:"var(--gold)",fontWeight:700,flexShrink:0}}>✦</span>}
                </button>
              ))}
              {tier!=="premium" && (
                <button onClick={()=>setShowUpgrade(true)} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"10px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,cursor:"pointer",marginTop:4}}>Upgrade — $9.99/mo</button>
              )}
            </div>
            {/* Subscriptions */}
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--muted)",letterSpacing:1.2}}>MY SERVICES</div>
                <button onClick={()=>user?setShowSetup(true):setShowAuth(true)} style={{background:"none",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Edit</button>
              </div>
              {userSubs.length===0 ? <div style={{fontSize:12,color:"var(--muted)",textAlign:"center",padding:"10px 0"}}>No services selected.<br/><button onClick={()=>user?setShowSetup(true):setShowAuth(true)} style={{background:"none",border:"none",color:"var(--gold)",fontSize:12,cursor:"pointer",marginTop:4,textDecoration:"underline"}}>Add Services →</button></div>
              : <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {userSubs.map(s=>{ const svc=SERVICES.find(sv=>sv.id===s); if(!svc) return null; return <div key={s} style={{background:svc.color,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:800,color:"#fff"}}>{svc.logo}</div>; })}
                </div>}
            </div>
            <AdvancedStats movies={movies} userRatings={userRatings} watchlist={watchlist} tier={tier}/>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {showAuth    && <AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile && user && <ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={handleSignOut} onUpgrade={()=>{setShowProfile(false);setShowUpgrade(true);}} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={setSelectedMovie}/>}
      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>{setTier("premium");showToast("Welcome to Premium! ✦");setShowUpgrade(false);}}/>}
      {showSetup   && <SetupModal userSubs={userSubs} onSave={handleSaveSubs} onClose={()=>setShowSetup(false)} isFirst={userSubs.length===0}/>}
      {showMood    && <MoodSearchModal onClose={()=>setShowMood(false)} user={user} tier={tier} userSubs={userSubs} onUpgrade={()=>{setShowMood(false);setShowUpgrade(true);}} showToast={showToast} onSelectMovie={setSelectedMovie}/>}
      {showLeaving && <LeavingSoonModal onClose={()=>setShowLeaving(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>{setShowLeaving(false);setShowUpgrade(true);}}/>}
      {showHistory && <WatchHistoryModal onClose={()=>setShowHistory(false)} user={user} tier={tier} onUpgrade={()=>{setShowHistory(false);setShowUpgrade(true);}}/>}
      {showCostCalc && <CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>{setShowCostCalc(false);setShowUpgrade(true);}}/>}
      {showNewReleases && <NewReleasesModal onClose={()=>setShowNewReleases(false)} userSubs={userSubs} onSelect={setSelectedMovie}/>}
      {showPersonalized && <PersonalizedRecsModal onClose={()=>setShowPersonalized(false)} user={user} userRatings={userRatings} watchlist={watchlist} userSubs={userSubs} tier={tier} onUpgrade={()=>{setShowPersonalized(false);setShowUpgrade(true);}} onSelectMovie={setSelectedMovie} showToast={showToast}/>}
      {selectedMovie && <MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} showToast={showToast} onSelectSimilar={setSelectedMovie}/>}
    </div>
  );
}
