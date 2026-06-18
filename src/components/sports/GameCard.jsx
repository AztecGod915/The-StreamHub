import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PredictionPoll } from "./Predictions.jsx";
import { getReminderLinks, downloadICS, openLink } from "./GameDetailModal.jsx";
function GameCard({ evt, isLive, isOver, favTeam, onSelect, user, showToast, onPredResult }) {
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

      {/* 🔮 Prediction Poll */}
      <PredictionPoll evt={evt} user={user} showToast={showToast} onResult={onPredResult}/>
    </div>
  );
}

// ─── SCHEDULE GAME ROW (own state for reminder toggle) ───────────────────────

export default GameCard;
