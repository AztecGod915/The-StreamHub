import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TMDB_IMG } from "../../lib/tmdb.js";
import { SERVICES } from "../../data/constants.js";
import { Logo,  safeGR } from "../shared/Logo.jsx";
import { ServiceBadge } from "../shared/ServiceBadge.jsx";
function MovieCard({ movie, watchlist, userRatings, userSubs, onSelect, onToggleWatchlist }) {
  const [hov, setHov] = useState(false);
  const gr = safeGR(movie.id);
  const inWL = watchlist.includes(movie.id);
  const providers = movie.providers || [];
  const mainProvider = providers[0];
  const notSub = mainProvider && userSubs.length > 0 && !userSubs.includes(mainProvider);
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const rating = movie.vote_average ? (movie.vote_average).toFixed(1) : "—";
  const accent = movie.category === "anime" ? "var(--anime)" : movie.category === "tv" ? "var(--purple)" : "var(--gold)";

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onSelect(movie)}
      style={{borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",position:"relative",
        border:`1px solid ${hov?accent:"var(--border)"}`,
        transform:hov?"translateY(-4px) scale(1.015)":"translateY(0) scale(1)",
        transition:"all .25s cubic-bezier(.22,1,.36,1)",
        boxShadow:hov?"0 20px 40px rgba(0,0,0,.5)":"0 4px 12px rgba(0,0,0,.3)",
        filter:notSub?"brightness(0.6) saturate(0.5)":"none",
        background:"var(--card)",
        WebkitTapHighlightColor:"transparent",
        touchAction:"manipulation",
      }}>      {/* Poster */}
      <div style={{height:200,position:"relative",overflow:"hidden",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
        {poster
          ? <img src={poster} alt={movie.title||movie.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy" />
          : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,opacity:.15,fontFamily:"var(--font-head)",fontWeight:800,color:"#fff"}}>{(movie.title||movie.name||"").slice(0,2).toUpperCase()}</div>
        }
        {hov && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}}><div style={{width:46,height:46,borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,marginLeft:3}}>▶</span></div></div>}
        {notSub && <div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,.8)",borderRadius:6,padding:"3px 7px",fontSize:10,color:"var(--muted)",fontWeight:600}}>NOT SUBSCRIBED</div>}
        <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}}
          style={{position:"absolute",top:8,right:8,background:inWL?"var(--gold)":"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:30,height:30,fontSize:14,color:inWL?"#000":"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
          {inWL?"♥":"♡"}
        </button>
        {providers.length > 0 && (
          <div style={{position:"absolute",bottom:8,left:8,display:"flex",gap:4,flexWrap:"wrap"}}>
            {providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small />)}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{padding:"10px 12px 12px"}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{movie.title||movie.name}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:"var(--muted)"}}>{(movie.release_date||movie.first_air_date||"").slice(0,4)}</span>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{color:accent,fontSize:12}}>★</span>
            <span style={{fontSize:12,fontWeight:600}}>{rating}</span>
            {userRatings[movie.id] && <span style={{fontSize:10,color:"var(--cyan)",marginLeft:4}}>You:{userRatings[movie.id]}★</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────

export { MovieCard };
