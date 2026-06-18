import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { TEAM_SPORT_MAP } from "../../data/sportsData.js";
import { getBroadcastLink } from "./SportsStreaming.jsx";
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

export { OlympicsPlaceholder, SportMovieBridge, SoccerHub, TeamNextGameSearch, SPORT_CARDS };
