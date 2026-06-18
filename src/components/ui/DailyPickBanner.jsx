import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SERVICES } from "../../data/constants.js";
import { TMDB_IMG } from "../../lib/tmdb.js";
function DailyPickBanner({ movie, onSelect, onShare }) {
  if (!movie) return null;
  const dayOfYear = Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/(1000*60*60*24));
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const provider = movie.providers?.[0];
  const svc = SERVICES.find(s=>s.id===provider);

  return (
    <div style={{margin:"0 14px 16px",borderRadius:16,overflow:"hidden",background:"linear-gradient(135deg,rgba(139,92,246,.2),rgba(6,182,212,.12))",border:"1px solid rgba(139,92,246,.35)",position:"relative",cursor:"pointer"}}
      onClick={()=>onSelect(movie)}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.3)"}}/>
      {poster&&<img src={poster} alt="" style={{position:"absolute",right:0,top:0,height:"100%",width:120,objectFit:"cover",maskImage:"linear-gradient(to left,rgba(0,0,0,.6),transparent)",WebkitMaskImage:"linear-gradient(to left,rgba(0,0,0,.6),transparent)"}}/>}
      <div style={{position:"relative",padding:"14px 16px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <div style={{background:"var(--purple)",borderRadius:99,padding:"3px 10px",fontSize:9,fontWeight:900,color:"#fff",letterSpacing:.8}}>🎯 TODAY'S PICK — DAY {dayOfYear}</div>
          {svc&&<div style={{background:svc.color,borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:800,color:"#fff"}}>{svc.name}</div>}
        </div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,marginBottom:4,maxWidth:"75%"}}>{movie.title||movie.name}</div>
        <div style={{fontSize:11,color:"rgba(240,240,250,.6)",marginBottom:10,maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{movie.overview?.slice(0,80)}...</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700}}>▶ Watch Now</div>
          <button onClick={e=>{e.stopPropagation();onShare(movie);}}
            style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,color:"var(--text)",cursor:"pointer"}}>
            📤 Share
          </button>
          <div style={{marginLeft:"auto",color:"var(--gold)",fontSize:13,fontWeight:700}}>★ {movie.vote_average?.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
// ─── TOP 10 TRENDING SECTION ──────────────────────────────────────────────────

// ─── ONBOARDING MODAL ─────────────────────────────────────────────────────────

export { DailyPickBanner };
