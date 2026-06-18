import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { getSportStreamers } from "./SportsStreaming.jsx";
import { getPredStats, PRED_MILESTONES, getPointsForStreak, savePredStats } from "./Predictions.jsx";
import { getTeamsForSport,  getTeamLogo } from "../../data/sportsData.js";
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
function GameDetailModal({ evt, onClose, user, showToast, onPredResult }) {
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
          <a href={broadcastLink||`https://www.google.com/search?q=where+to+watch+${encodeURIComponent(evt.shortName||evt.name||"")}+live+stream`}
            target="_blank" rel="noopener noreferrer"
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
            {evt.isLive ? "▶ Watch Live Now" : evt.isOver ? "📺 Watch Replay / Highlights" : "📺 Where to Watch →"}
          </a>

          {/* Streaming service badges */}
          {(()=>{
            const streamers = getSportStreamers(evt._sportDisplay||"");
            if (!streamers.length) return null;
            return (
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"var(--muted)",textAlign:"center",marginBottom:6,letterSpacing:.5,textTransform:"uppercase"}}>
                  {evt.broadcast ? "Also available on" : "Usually available on"}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {streamers.map(s=>(
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,color:"#fff",textDecoration:"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.14)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.06)"}>
                      <span style={{fontSize:13}}>{s.icon}</span><span>{s.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
          <a href={`https://www.google.com/search?q=where+to+watch+${encodeURIComponent(evt.shortName||evt.name||"")}+live+stream`}
            target="_blank" rel="noopener noreferrer"
            style={{display:"block",textAlign:"center",fontSize:11,color:"var(--muted)",textDecoration:"underline",marginBottom:6,opacity:.7}}>
            Search all options on Google →
          </a>

          {/* ── 🔮 PREDICTION SECTION ─────────────────────────────── */}
          {evt.home?.name && evt.away?.name && (
            <GamePrediction evt={evt} user={user} showToast={showToast} onPredResult={onPredResult}/>
          )}
        </div>
        <div style={{height:20}}/>
      </div>
    </div>
  );
}

// ─── GAME PREDICTION (lives inside GameDetailModal) ──────────────────────────
function GamePrediction({ evt, user, showToast, onPredResult }) {
  const key = `sh_pred_${evt.id}`;
  const [myPick, setMyPick]   = useState(() => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } });
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [community, setCommunity] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [resolved, setResolved] = useState(false);
  const isUpcoming = !evt.isLive && !evt.isOver;
  const canPredict = isUpcoming && !myPick;

  // Determine actual result once game is over
  const actualResult = evt.isOver && evt.home?.score !== undefined && evt.away?.score !== undefined
    ? (Number(evt.home.score) > Number(evt.away.score) ? "home"
       : Number(evt.away.score) > Number(evt.home.score) ? "away" : "draw")
    : null;
  const predCorrect = myPick && actualResult ? myPick.pick === actualResult : null;

  // Fetch community votes when we have a pick
  useEffect(() => {
    if (!myPick) return;
    supabase.from("predictions").select("prediction").eq("game_id", evt.id)
      .then(({ data }) => {
        if (!data?.length) return;
        const t = data.length;
        const c = data.reduce((a,p) => { a[p.prediction]=(a[p.prediction]||0)+1; return a; }, {});
        setCommunity({
          home: Math.round((c.home||0)/t*100),
          draw: Math.round((c.draw||0)/t*100),
          away: Math.round((c.away||0)/t*100),
          total: t,
        });
      }).catch(()=>{});
  }, [myPick]);

  // Resolve result when game ends
  useEffect(() => {
    if (!myPick || !evt.isOver || resolved || predCorrect===null) return;
    setResolved(true);
    const old = getPredStats();
    if (predCorrect) {
      const newStreak = old.streak + 1;
      const pts = getPointsForStreak(newStreak);
      savePredStats({ streak:newStreak, best:Math.max(old.best,newStreak), total:old.total+1, correct:old.correct+1, points:old.points+pts });
      const milestone = [...PRED_MILESTONES].reverse().find(m => newStreak === m.n);
      onPredResult?.({ correct:true, streak:newStreak, points:pts, milestone });
    } else {
      savePredStats({ ...old, streak:0, total:old.total+1 });
      onPredResult?.({ correct:false, streak:0, points:0 });
    }
  }, [evt.isOver, predCorrect, resolved]);

  const teamLabel = p => p==="home" ? evt.home?.name : p==="away" ? evt.away?.name : "Draw";

  const makePick = async (pick) => {
    if (!canPredict || saving) return;
    setSaving(true);
    const hs = homeScore.trim() || null;
    const as = awayScore.trim() || null;
    const pred = { pick, gameId:evt.id, home:evt.home?.name, away:evt.away?.name, homeScore:hs, awayScore:as };
    localStorage.setItem(key, JSON.stringify(pred));
    setMyPick(pred);
    if (user) {
      supabase.from("predictions").upsert({
        user_id: user.id, game_id: evt.id,
        home_team: evt.home?.name, away_team: evt.away?.name,
        prediction: pick,
        predicted_home_score: hs, predicted_away_score: as,
      }, { onConflict:"user_id,game_id" }).catch(()=>{});
    }
    setSaving(false);
    showToast?.("🔮 Prediction locked in! Check back after the game.");
  };

  const shareResult = () => {
    const scoreStr = myPick?.homeScore && myPick?.awayScore
      ? ` (${myPick.awayScore}-${myPick.homeScore})`
      : "";
    const streak = getPredStats().streak;
    const txt = predCorrect
      ? `✅ I predicted ${teamLabel(myPick.pick)}${scoreStr} wins and I was RIGHT! 🔮 Can you beat my ${streak} 🔥 streak? → thestreamhub.app`
      : `❌ I predicted ${teamLabel(myPick.pick)} but got it wrong. Still hunting that streak 🔥 → thestreamhub.app`;
    if (navigator.share) {
      navigator.share({ text:txt, url:"https://thestreamhub.app" }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(txt)
        .then(() => showToast?.("📋 Copied! Paste it anywhere to share."))
        .catch(() => showToast?.("📋 " + txt));
    }
  };

  return (
    <div style={{marginTop:12,borderTop:"1px solid rgba(139,92,246,.2)",paddingTop:14}}>
      {/* Header */}
      <div style={{fontSize:11,fontWeight:800,color:"#C4B5FD",letterSpacing:1,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
        🔮 <span>{canPredict ? "PREDICT THE RESULT" : myPick && !evt.isOver ? "YOUR PREDICTION" : evt.isOver ? "PREDICTION RESULT" : "PREDICTIONS"}</span>
      </div>

      {/* ── Can predict ── */}
      {canPredict && (
        <>
          {/* Score input row */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:10,color:"var(--muted)",marginBottom:4,fontWeight:700}}>{evt.away?.name}</div>
              <input
                type="number" min="0" max="99" placeholder="0"
                value={awayScore}
                onChange={e=>setAwayScore(e.target.value)}
                onClick={e=>e.stopPropagation()}
                style={{
                  width:"100%",textAlign:"center",
                  background:"rgba(139,92,246,.1)",border:"1.5px solid rgba(139,92,246,.3)",
                  borderRadius:10,padding:"10px 6px",
                  fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,color:"#C4B5FD",
                  outline:"none",
                }}
              />
            </div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:"var(--muted)",flexShrink:0}}>—</div>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:10,color:"var(--muted)",marginBottom:4,fontWeight:700}}>{evt.home?.name}</div>
              <input
                type="number" min="0" max="99" placeholder="0"
                value={homeScore}
                onChange={e=>setHomeScore(e.target.value)}
                onClick={e=>e.stopPropagation()}
                style={{
                  width:"100%",textAlign:"center",
                  background:"rgba(139,92,246,.1)",border:"1.5px solid rgba(139,92,246,.3)",
                  borderRadius:10,padding:"10px 6px",
                  fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,color:"#C4B5FD",
                  outline:"none",
                }}
              />
            </div>
          </div>

          {/* Winner pick buttons */}
          <div style={{fontSize:9,color:"var(--muted)",textAlign:"center",marginBottom:7,fontWeight:700,letterSpacing:.5}}>WHO WINS?</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 60px 1fr",gap:6,marginBottom:8}}>
            {["away","draw","home"].map(p => (
              <button key={p} onClick={e=>{e.stopPropagation(); makePick(p);}}
                disabled={saving}
                style={{
                  background:"rgba(139,92,246,.12)",
                  border:"1.5px solid rgba(139,92,246,.3)",
                  borderRadius:10,padding:"9px 4px",
                  fontSize:11,fontWeight:800,color:"#C4B5FD",
                  cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                  transition:"all .15s",opacity:saving?.5:1,
                }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(139,92,246,.28)";e.currentTarget.style.borderColor="rgba(139,92,246,.7)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,92,246,.12)";e.currentTarget.style.borderColor="rgba(139,92,246,.3)";}}>
                {p==="draw" ? "🤝 Draw" : p==="away" ? evt.away?.abbr||evt.away?.name : evt.home?.abbr||evt.home?.name}
              </button>
            ))}
          </div>
          <div style={{fontSize:9,color:"rgba(240,240,250,.25)",textAlign:"center"}}>Tap to lock in • Can't change after</div>
        </>
      )}

      {/* ── Pending (picked, game not over) ── */}
      {myPick && !evt.isOver && (
        <>
          <div style={{background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.25)",borderRadius:12,padding:"10px 14px",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:800,color:"#C4B5FD",marginBottom:4}}>
              🔮 {teamLabel(myPick.pick)} to win
              {myPick.awayScore!=null && myPick.homeScore!=null && myPick.awayScore!=="" && myPick.homeScore!==""
                ? ` · ${myPick.awayScore}–${myPick.homeScore}` : ""}
            </div>
            <div style={{fontSize:10,color:"rgba(240,240,250,.4)"}}>Locked in — check back after the final whistle</div>
          </div>
          {community ? (
            <>
              <div style={{fontSize:9,color:"var(--muted)",marginBottom:6,fontWeight:700,letterSpacing:.5}}>COMMUNITY VOTES</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 60px 1fr",gap:6,marginBottom:6}}>
                {["away","draw","home"].map(p=>(
                  <div key={p} style={{
                    background:myPick.pick===p?"rgba(139,92,246,.2)":"rgba(255,255,255,.04)",
                    border:`1.5px solid ${myPick.pick===p?"rgba(139,92,246,.5)":"rgba(255,255,255,.08)"}`,
                    borderRadius:10,padding:"8px 4px",textAlign:"center",
                  }}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,color:myPick.pick===p?"#C4B5FD":"rgba(240,240,250,.35)"}}>{community[p]}%</div>
                    <div style={{fontSize:8,color:"rgba(240,240,250,.3)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {p==="draw"?"Draw":p==="away"?evt.away?.abbr||evt.away?.name:evt.home?.abbr||evt.home?.name}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:9,color:"rgba(240,240,250,.25)",textAlign:"center",marginBottom:8}}>{community.total} StreamHub fan{community.total!==1?"s":""} predicted</div>
            </>
          ) : (
            <div style={{fontSize:10,color:"rgba(240,240,250,.3)",textAlign:"center",marginBottom:8}}>Be the first — share with friends to see the vote!</div>
          )}
          {/* Share before result */}
          <button onClick={e=>{
            e.stopPropagation();
            const scoreStr = myPick.awayScore!=null&&myPick.homeScore!=null&&myPick.awayScore!==""&&myPick.homeScore!==""
              ? ` ${myPick.awayScore}–${myPick.homeScore}` : "";
            const txt = `🔮 I'm predicting ${teamLabel(myPick.pick)}${scoreStr} in ${evt.shortName||evt.name}. Can you top it? → thestreamhub.app`;
            if(navigator.share){navigator.share({text:txt,url:"https://thestreamhub.app"}).catch(()=>{});}
            else{navigator.clipboard.writeText(txt).then(()=>showToast?.("📋 Copied!")).catch(()=>{});}
          }} style={{
            width:"100%",background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",
            borderRadius:10,padding:"8px 0",fontSize:11,fontWeight:700,color:"#C4B5FD",
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
          }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(139,92,246,.22)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(139,92,246,.12)"}>
            📤 Share your prediction
          </button>
        </>
      )}

      {/* ── Result ── */}
      {myPick && evt.isOver && predCorrect !== null && (
        <>
          <div style={{
            background:predCorrect?"rgba(16,185,129,.1)":"rgba(239,68,68,.08)",
            border:`1.5px solid ${predCorrect?"rgba(16,185,129,.4)":"rgba(239,68,68,.25)"}`,
            borderRadius:12,padding:"12px 14px",marginBottom:10,
          }}>
            <div style={{fontSize:16,fontWeight:800,color:predCorrect?"#10B981":"#ef4444",marginBottom:4}}>
              {predCorrect ? "✅ You called it!" : "❌ Better luck next game"}
            </div>
            <div style={{fontSize:11,color:"rgba(240,240,250,.5)"}}>
              Your pick: {teamLabel(myPick.pick)}
              {myPick.awayScore!=null&&myPick.homeScore!=null&&myPick.awayScore!==""&&myPick.homeScore!==""
                ? ` · ${myPick.awayScore}–${myPick.homeScore}` : ""}
              {" · "}Result: {actualResult ? teamLabel(actualResult) : "—"}
              {evt.away?.score!=null&&evt.home?.score!=null ? ` · ${evt.away.score}–${evt.home.score}` : ""}
            </div>
            {predCorrect && (()=>{
              const s = getPredStats();
              const m = [...PRED_MILESTONES].reverse().find(x=>s.streak>=x.n);
              return m ? (
                <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:20}}>{m.icon}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:800,color:"#10B981"}}>{m.label}</div>
                    <div style={{fontSize:10,color:"rgba(240,240,250,.4)"}}>🔥 {s.streak} streak · {s.points} pts</div>
                  </div>
                </div>
              ) : (
                <div style={{marginTop:6,fontSize:10,color:"rgba(240,240,250,.4)"}}>
                  🔥 {getPredStats().streak} streak · {getPredStats().points} pts
                </div>
              );
            })()}
          </div>
          <button onClick={e=>{e.stopPropagation();shareResult();}}
            style={{
              width:"100%",
              background:predCorrect?"rgba(16,185,129,.12)":"rgba(255,255,255,.06)",
              border:`1px solid ${predCorrect?"rgba(16,185,129,.3)":"rgba(255,255,255,.12)"}`,
              borderRadius:10,padding:"10px 0",fontSize:12,fontWeight:700,
              color:predCorrect?"#10B981":"rgba(240,240,250,.5)",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".8"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            📤 Share your {predCorrect?"win":"prediction"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── BROADCAST LINK MAPPER ───────────────────────────────────────────────────
// ─── SPORTS STREAMING MAP ────────────────────────────────────────────────────

export { FavoriteTeamModal, toCalDate, getReminderLinks, downloadICS, openLink, GameDetailModal, GamePrediction };
