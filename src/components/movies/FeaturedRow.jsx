import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MovieCard } from "./MovieCard.jsx";
function FeaturedRow({ title, icon, movies, watchlist, userRatings, userSubs, onSelect, onToggleWatchlist, color="var(--gold)" }) {
  const ref = useRef(null);
  const scroll = dir => ref.current?.scrollBy({left:dir*340,behavior:"smooth"});
  if (!movies||!movies.length) return null;
  return (
    <div style={{marginBottom:36}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{icon}</span>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,color}}>{title}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>scroll(-1)} style={{background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",width:30,height:30,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <button onClick={()=>scroll(1)}  style={{background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",width:30,height:30,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>
      <div ref={ref} style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 24px 8px",scrollbarWidth:"none",scrollSnapType:"x mandatory",touchAction:"pan-x"}}>
        {movies.map(m=>(
          <div key={m.id} style={{flexShrink:0,width:155,scrollSnapAlign:"start"}}>
            <MovieCard movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={onSelect} onToggleWatchlist={onToggleWatchlist} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DEVICE DETECTION ────────────────────────────────────────────────────────
function useDevice() {
  const [device, setDevice] = useState(() => {
    const w = window.innerWidth;
    if (w <= 768) return "mobile";
    if (w <= 1100) return "tablet";
    return "desktop";
  });
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      if (w <= 768) setDevice("mobile");
      else if (w <= 1100) setDevice("tablet");
      else setDevice("desktop");
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return device;
}
function useIsMobile() { return useDevice() === "mobile"; }

export { FeaturedRow };
