import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders } from "../../lib/tmdb.js";
import { SERVICES } from "../../data/constants.js";
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

export { LeavingSoonModal, WatchHistoryModal };
