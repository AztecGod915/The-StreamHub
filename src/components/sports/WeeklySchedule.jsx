import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getReminderLinks, downloadICS, openLink } from "./GameDetailModal.jsx";
import { getEspnSport } from "../../data/sportsData.js";
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
    fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport.path}/scoreboard${
  sport.path.includes('fifa.world')
    ? '?limit=200&dates=20260611-20260719'
    : '?limit=100'
}`)
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

export { ScheduleGameRow, WeeklyScheduleModal };
