import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SERVICES, SPORTS_GUIDE } from "../../data/constants.js";
import { SPORT_CARDS } from "./SportsHub.jsx";
import { getTeamLogo } from "../../data/sportsData.js";
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

export { SportCategoryGrid, SportsTabHeader, SportsStreamingGuide };
