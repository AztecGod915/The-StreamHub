import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { tmdbFetch,  TMDB_BASE, tmdbHeaders, TMDB_IMG } from "../../lib/tmdb.js";
import { SERVICES } from "../../data/constants.js";
function WatchTonightModal({ onClose, user, tier, userSubs, watchlist, userRatings, onUpgrade, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [pick, setPick]     = useState(null);
  const [error, setError]   = useState(null);

  const FREE_KEY = "streamhub_watch_tonight_used";
  const hasUsedFree = !!localStorage.getItem(FREE_KEY);
  const canAccess   = tier === "premium" || !hasUsedFree;

  useEffect(() => { if (canAccess) generate(); }, []);

  const generate = async () => {
    setLoading(true); setPick(null); setError(null);
    const h = new Date().getHours();
    const timeOfDay = h<12?"morning":h<17?"afternoon":h<21?"evening":"late night";
    const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
    const isWeekend = [0,6].includes(new Date().getDay());
    const services = (userSubs||[]).map(id=>SERVICES.find(s=>s.id===id)?.name).filter(Boolean);
    const prompt = `You are a personal streaming assistant. Pick ONE perfect movie or show for this user to watch right now.

User profile:
- It is ${timeOfDay} on a ${day}${isWeekend?" (weekend)":""}
- Their streaming services: ${services.length?services.join(", "):"Netflix, Hulu, Disney+"}
- Watchlist size: ${(watchlist||[]).length} saved titles
- Ratings given: ${Object.keys(userRatings||{}).length}

Pick something AVAILABLE on one of their services that fits the time and day. Respond ONLY with this JSON (no markdown, no backticks):
{"title":"Movie Name","year":2023,"type":"movie","service":"Netflix","reason":"One sentence why this is perfect for right now","duration":"1h 52m","vibe":"gripping thriller"}`;
    try {
      const res = await fetch("/api/ai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:300,
          messages:[{role:"user",content:prompt}]
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error||`HTTP ${res.status}`);
      }
      const data = await res.json();
      const text = (data.content?.find(b=>b.type==="text")?.text || data.content?.[0]?.text || "")
        .replace(/```json|```/g,"").trim();
      if (!text) throw new Error("Empty response from AI");
      const parsed = JSON.parse(text);
      // Fetch poster from TMDB
      const sr = await tmdbFetch(`/search/multi?query=${encodeURIComponent(parsed.title)}&language=en-US&page=1`);
      const found = (sr.results||[]).find(m=>{
        const y = parseInt((m.release_date||m.first_air_date||"0").slice(0,4));
        return !parsed.year || Math.abs(y-parsed.year)<=1;
      }) || sr.results?.[0];
      if (tier!=="premium") localStorage.setItem(FREE_KEY,"1");
      setPick({...parsed, movie:found||null});
    } catch(e) {
      console.error("Watch Tonight error:", e);
      setError("Couldn't generate a pick. Try again!");
    }
    setLoading(false);
  };

  const svc = pick ? SERVICES.find(s=>s.name===pick.service||s.id===pick.service?.toLowerCase()) : null;

  // Paywall
  if (!canAccess) return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:420,border:"1px solid rgba(139,92,246,.3)",padding:32,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🌙</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>You've used your free Watch Tonight</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Upgrade to Premium for unlimited instant picks — every night, every mood.</div>
        <button onClick={()=>{onUpgrade();onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"12px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:24,width:"100%",maxWidth:460,border:"1px solid rgba(139,92,246,.25)",boxShadow:"0 40px 80px rgba(0,0,0,.8)",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(139,92,246,.1),rgba(9,7,15,0))"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18}}>🌙 Watch Tonight</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>AI picks one perfect thing for right now</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
        </div>

        {/* Body */}
        <div style={{padding:20}}>
          {loading && (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:48,height:48,border:"3px solid rgba(139,92,246,.2)",borderTopColor:"var(--purple)",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:6}}>Finding your perfect watch…</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>Checking your services · Matching your vibe</div>
            </div>
          )}

          {error && (
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:36,marginBottom:12}}>😔</div>
              <div style={{fontSize:14,color:"var(--muted)",marginBottom:16}}>{error}</div>
              <button onClick={generate} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 22px",fontWeight:700,cursor:"pointer"}}>Try Again</button>
            </div>
          )}

          {pick && !loading && (
            <div>
              {/* Movie card */}
              <div style={{display:"flex",gap:14,marginBottom:16}}>
                {pick.movie?.poster_path
                  ? <img src={`https://image.tmdb.org/t/p/w185${pick.movie.poster_path}`} alt={pick.title} style={{width:90,height:135,objectFit:"cover",borderRadius:12,flexShrink:0,boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}/>
                  : <div style={{width:90,height:135,borderRadius:12,background:"rgba(139,92,246,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🎬</div>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18,marginBottom:4,lineHeight:1.2}}>{pick.title}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {pick.year&&<span style={{fontSize:11,color:"var(--muted)"}}>{pick.year}</span>}
                    <span style={{fontSize:10,background:"rgba(139,92,246,.2)",color:"#C4B5FD",borderRadius:4,padding:"1px 6px",fontWeight:700}}>{pick.type==="movie"?"Movie":"TV"}</span>
                    {pick.vibe&&<span style={{fontSize:10,color:"var(--muted)",fontStyle:"italic"}}>"{pick.vibe}"</span>}
                  </div>
                  {pick.duration&&<div style={{fontSize:11,color:"var(--muted)",marginBottom:6}}>⏱ {pick.duration}</div>}
                  {svc&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:svc.color,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:800,color:"#fff"}}>{svc.logo} {svc.name}</div>}
                </div>
              </div>

              {/* AI Reason */}
              <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:800,color:"var(--purple)",letterSpacing:.5,marginBottom:5}}>✦ WHY TONIGHT</div>
                <div style={{fontSize:13,lineHeight:1.6,color:"rgba(240,240,250,.85)"}}>{pick.reason}</div>
              </div>

              {/* Actions */}
              <div style={{display:"flex",gap:8}}>
                {pick.movie&&<button onClick={()=>{onSelect({...pick.movie,providers:[]});onClose();}}
                  style={{flex:1,background:"var(--purple)",border:"none",borderRadius:12,color:"#fff",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>
                  ▶ Open {pick.type==="movie"?"Movie":"Show"}
                </button>}
                <button onClick={generate}
                  style={{background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:12,color:"var(--muted)",padding:"12px 16px",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                  ↻ Different pick
                </button>
              </div>
              {tier!=="premium"&&<div style={{textAlign:"center",fontSize:10,color:"var(--muted)",marginTop:8}}>1 free pick used · <button onClick={()=>{onUpgrade();onClose();}} style={{background:"none",border:"none",color:"var(--gold)",fontSize:10,cursor:"pointer",fontWeight:700}}>Upgrade for unlimited ✦</button></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COOKIE / GDPR CONSENT BANNER ────────────────────────────────────────────

export { WatchTonightModal };
