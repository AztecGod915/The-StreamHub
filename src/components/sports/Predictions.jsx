import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
function PredictionStatsBar() {
  const s = getPredStats();
  if (s.total === 0) return (
    <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span style={{fontSize:26}}>🔮</span>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,marginBottom:2,background:"linear-gradient(90deg,#C4B5FD,#818CF8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>YOUR PREDICTION RECORD</div>
          <div style={{fontSize:11,color:"rgba(240,240,250,.4)"}}>Your streak, accuracy & points will appear here</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[
          {label:"Streak",  value:"—", icon:"🔥"},
          {label:"Best",    value:"—", icon:"⚡"},
          {label:"Accuracy",value:"—", icon:"🎯"},
          {label:"Points",  value:"—", icon:"⭐"},
        ].map(stat=>(
          <div key={stat.label} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontSize:14,marginBottom:2}}>{stat.icon}</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:15,color:"rgba(240,240,250,.2)"}}>—</div>
            <div style={{fontSize:9,color:"var(--muted)",marginTop:2,fontWeight:700}}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:10,fontSize:10,color:"rgba(139,92,246,.6)",fontWeight:700,textAlign:"center",letterSpacing:.5}}>
        ↓ OPEN ANY GAME CARD BELOW TO MAKE YOUR FIRST PREDICTION
      </div>
    </div>
  );
  const acc = s.total > 0 ? Math.round(s.correct/s.total*100) : 0;
  const milestone = [...PRED_MILESTONES].reverse().find(m=>s.streak>=m.n);
  return (
    <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"12px 16px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
          🔮 Your Predictions
          {milestone && <span style={{fontSize:16}}>{milestone.icon}</span>}
        </div>
        {milestone && <div style={{fontSize:10,fontWeight:800,color:"#C4B5FD",background:"rgba(139,92,246,.15)",borderRadius:99,padding:"2px 8px"}}>{milestone.label}</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[
          {label:"Streak",value:`${s.streak} 🔥`,color:"var(--gold)"},
          {label:"Best",value:`${s.best} ⚡`,color:"#C4B5FD"},
          {label:"Accuracy",value:`${acc}%`,color:"#10B981"},
          {label:"Points",value:`${s.points}`,color:"#F59E0B"},
        ].map(stat=>(
          <div key={stat.label} style={{background:"rgba(255,255,255,.04)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:16,color:stat.color}}>{stat.value}</div>
            <div style={{fontSize:9,color:"var(--muted)",marginTop:2,fontWeight:700}}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PREDICTION SYSTEM ───────────────────────────────────────────────────────
const PRED_MILESTONES = [
  {n:1,  icon:"🎯", label:"First Blood",  msg:"You got your first one right!"},
  {n:3,  icon:"🔥", label:"On Fire",      msg:"3 in a row. You're on a roll!"},
  {n:5,  icon:"⚡", label:"Electric",     msg:"5 straight. Nobody stops you."},
  {n:7,  icon:"🧠", label:"Big Brain",    msg:"7 correct. Are you cheating?"},
  {n:10, icon:"👑", label:"Oracle",       msg:"10 in a row. You see the future."},
  {n:15, icon:"🐐", label:"GOAT",         msg:"15 straight. Undisputed legend."},
];
const getPredStats = () => {
  try { return JSON.parse(localStorage.getItem("sh_pred_stats") || '{"streak":0,"best":0,"total":0,"correct":0,"points":0}'); }
  catch { return {streak:0,best:0,total:0,correct:0,points:0}; }
};
const savePredStats = s => localStorage.setItem("sh_pred_stats", JSON.stringify(s));
const getPointsForStreak = n => n>=10?35:n>=7?25:n>=5?20:n>=3?15:10;

function PredictionCelebrationModal({ streak, points, milestone, onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,4000); return()=>clearTimeout(t); },[]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,pointerEvents:"all"}}> 
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{
        background:"var(--surface)",borderRadius:24,padding:"32px 36px",
        border:`2px solid ${milestone?.n>=10?"rgba(245,158,11,.6)":"rgba(16,185,129,.4)"}`,
        boxShadow:`0 0 60px ${milestone?.n>=10?"rgba(245,158,11,.3)":"rgba(16,185,129,.2)"}`,
        textAlign:"center",maxWidth:320,width:"100%",
        animation:"fadeIn .3s ease",
      }}>
        <div style={{fontSize:64,marginBottom:12,animation:"logoFloat 2s ease-in-out infinite"}}>{milestone?.icon||"✅"}</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:24,marginBottom:6,
          background:milestone?.n>=10?"linear-gradient(135deg,#F59E0B,#FCD34D)":"linear-gradient(135deg,#10B981,#34D399)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          {milestone?.label||"Correct!"}
        </div>
        <div style={{fontSize:14,color:"rgba(240,240,250,.6)",marginBottom:20,lineHeight:1.5}}>{milestone?.msg||"You called it right!"}</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}>
          <div style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:12,padding:"10px 20px",textAlign:"center"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,color:"#10B981"}}>+{points}</div>
            <div style={{fontSize:10,color:"var(--muted)",fontWeight:700}}>POINTS</div>
          </div>
          <div style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:12,padding:"10px 20px",textAlign:"center"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,color:"var(--gold)"}}>{streak} 🔥</div>
            <div style={{fontSize:10,color:"var(--muted)",fontWeight:700}}>STREAK</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:10,color:"var(--muted)",padding:"8px 24px",fontSize:13,cursor:"pointer",fontWeight:600}}>Keep going →</button>
      </div>
    </div>
  );
}

function PredictionPoll({ evt, user, showToast, onResult }) {
  const key = `sh_pred_${evt.id}`;
  const [myPick, setMyPick]     = useState(() => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } });
  const [community, setCommunity] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [resolved, setResolved] = useState(false);

  const isUpcoming = !evt.isLive && !evt.isOver;
  const canPredict = isUpcoming && !myPick && evt.home?.name && evt.away?.name;

  // Actual result from scores
  const actualResult = evt.isOver && evt.home?.score !== undefined && evt.away?.score !== undefined
    ? (evt.home.score > evt.away.score ? "home" : evt.away.score > evt.home.score ? "away" : "draw")
    : null;
  const predCorrect = myPick && actualResult ? myPick.pick === actualResult : null;

  // Fetch community votes once user picks
  useEffect(() => {
    if (!myPick) return;
    supabase.from("predictions").select("prediction").eq("game_id", evt.id)
      .then(({data}) => {
        if (!data?.length) return;
        const t=data.length, c=data.reduce((a,p)=>{a[p.prediction]=(a[p.prediction]||0)+1;return a;},{});
        setCommunity({home:Math.round((c.home||0)/t*100),draw:Math.round((c.draw||0)/t*100),away:Math.round((c.away||0)/t*100),total:t});
      }).catch(()=>{});
  }, [myPick]);

  // Resolve result once game is over
  useEffect(() => {
    if (!myPick || !evt.isOver || resolved || predCorrect===null) return;
    setResolved(true);
    const old = getPredStats();
    if (predCorrect) {
      const newStreak = old.streak + 1;
      const pts = getPointsForStreak(newStreak);
      const next = {streak:newStreak,best:Math.max(old.best,newStreak),total:old.total+1,correct:old.correct+1,points:old.points+pts};
      savePredStats(next);
      const milestone = [...PRED_MILESTONES].reverse().find(m=>newStreak===m.n);
      onResult?.({correct:true, streak:newStreak, points:pts, milestone});
    } else {
      savePredStats({...old,streak:0,total:old.total+1});
      onResult?.({correct:false, streak:0, points:0});
    }
  }, [evt.isOver, predCorrect, resolved]);

  const makePick = async (pick) => {
    if (!canPredict||saving) return;
    setSaving(true);
    const pred = {pick, gameId:evt.id, home:evt.home?.name, away:evt.away?.name};
    localStorage.setItem(key, JSON.stringify(pred));
    setMyPick(pred);
    if (user) {
      supabase.from("predictions").upsert({user_id:user.id,game_id:evt.id,home_team:evt.home?.name,away_team:evt.away?.name,prediction:pick},{onConflict:"user_id,game_id"}).catch(()=>{});
    }
    setSaving(false);
    showToast?.("🔮 Prediction locked in! Check back after the game.");
  };

  const teamName = p => p==="home"?evt.home?.name:p==="away"?evt.away?.name:"Draw";

  if (!evt.home?.name || !evt.away?.name) return null;

  return (
    <div style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"8px 10px 10px",background:"rgba(139,92,246,.03)"}}>
      {/* Can predict */}
      {canPredict && (
        <>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(139,92,246,.7)",letterSpacing:1.5,marginBottom:7,display:"flex",alignItems:"center",gap:5}}>
            🔮 <span>WHO WINS? PREDICT NOW</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 52px 1fr",gap:5}}>
            {["home","draw","away"].map(p=>(
              <button key={p} onClick={e=>{e.stopPropagation();makePick(p);}}
                style={{
                  background:p==="draw"?"rgba(255,255,255,.05)":"rgba(139,92,246,.1)",
                  border:`1.5px solid ${p==="draw"?"rgba(255,255,255,.1)":"rgba(139,92,246,.25)"}`,
                  borderRadius:9,padding:p==="draw"?"6px 2px":"6px 4px",
                  fontSize:p==="draw"?10:10,fontWeight:700,
                  color:p==="draw"?"rgba(240,240,250,.45)":"#C4B5FD",
                  cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                  transition:"all .15s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(139,92,246,.6)";e.currentTarget.style.background="rgba(139,92,246,.22)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=p==="draw"?"rgba(255,255,255,.1)":"rgba(139,92,246,.25)";e.currentTarget.style.background=p==="draw"?"rgba(255,255,255,.05)":"rgba(139,92,246,.1)";}}>
                {p==="draw"?"Draw":teamName(p)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Pending result — show pick + community */}
      {myPick && !evt.isOver && (
        <>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(139,92,246,.7)",letterSpacing:1.5,marginBottom:6}}>
            🔮 YOUR PICK: <span style={{color:"#C4B5FD"}}>{teamName(myPick.pick).toUpperCase()}</span>
          </div>
          {community ? (
            <div style={{display:"grid",gridTemplateColumns:"1fr 52px 1fr",gap:5}}>
              {["home","draw","away"].map(p=>(
                <div key={p} style={{
                  background:myPick.pick===p?"rgba(139,92,246,.18)":"rgba(255,255,255,.04)",
                  border:`1.5px solid ${myPick.pick===p?"rgba(139,92,246,.5)":"rgba(255,255,255,.07)"}`,
                  borderRadius:9,padding:"5px 4px",textAlign:"center",
                }}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:14,color:myPick.pick===p?"#C4B5FD":"rgba(240,240,250,.4)"}}>{community[p]}%</div>
                  <div style={{fontSize:8,color:"rgba(240,240,250,.3)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p==="draw"?"Draw":p==="home"?evt.home?.abbr||evt.home?.name:evt.away?.abbr||evt.away?.name}</div>
                </div>
              ))}
            </div>
          ) : <div style={{fontSize:9,color:"rgba(240,240,250,.3)"}}>Be the first to vote — tell your friends!</div>}
          {community && <div style={{fontSize:9,color:"rgba(240,240,250,.25)",textAlign:"center",marginTop:5}}>{community.total} StreamHub fan{community.total!==1?"s":""} predicted</div>}
        </>
      )}

      {/* Result */}
      {myPick && evt.isOver && predCorrect !== null && (
        <>
          <div style={{
            background:predCorrect?"rgba(16,185,129,.08)":"rgba(239,68,68,.06)",
            border:`1.5px solid ${predCorrect?"rgba(16,185,129,.3)":"rgba(239,68,68,.2)"}`,
            borderRadius:10,padding:"8px 10px",
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:predCorrect?"#10B981":"#ef4444"}}>
                {predCorrect?"✅ You called it!":"❌ Better luck next game"}
              </div>
              <div style={{fontSize:9,color:"rgba(240,240,250,.35)",marginTop:2}}>
                Your pick: {teamName(myPick.pick)} · Result: {actualResult?teamName(actualResult):"—"}
              </div>
            </div>
            {predCorrect && (()=>{
              const s=getPredStats();
              const m=[...PRED_MILESTONES].reverse().find(x=>s.streak>=x.n);
              return m?<div style={{textAlign:"center"}}><div style={{fontSize:20}}>{m.icon}</div><div style={{fontSize:8,fontWeight:800,color:"#10B981"}}>{m.label}</div></div>:null;
            })()}
          </div>
          {/* Share result button */}
          <button onClick={e=>{
            e.stopPropagation();
            const txt = predCorrect
              ? `✅ I predicted ${teamName(myPick.pick)} wins and I was right! 🔮 Predict tonight's games on The StreamHub → thestreamhub.app`
              : `❌ I predicted ${teamName(myPick.pick)} but got it wrong this time. Still on ${getPredStats().streak} 🔥 → thestreamhub.app`;
            if(navigator.share){navigator.share({text:txt,url:"https://thestreamhub.app"}).catch(()=>{});}
            else{navigator.clipboard.writeText(txt).then(()=>showToast?.("📋 Copied! Share with friends.")).catch(()=>{});}
          }} style={{
            width:"100%",marginTop:7,
            background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",
            borderRadius:8,padding:"6px 0",fontSize:10,fontWeight:700,
            color:"rgba(240,240,250,.5)",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:5,
          }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.1)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.05)"}>
            📤 Share your prediction
          </button>
        </>
      )}
    </div>
  );
}

export { PredictionStatsBar, PRED_MILESTONES, getPredStats, savePredStats, getPointsForStreak, PredictionCelebrationModal, PredictionPoll };
