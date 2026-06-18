import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders } from "../../lib/tmdb.js";
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

export { PersonalizedRecsModal };
