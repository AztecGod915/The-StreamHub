import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders } from "../../lib/tmdb.js";
import { SERVICES } from "../../data/constants.js";
function AdvancedStats({ user, watchlist, userRatings, watchHistory, onOpenHistory, onOpenWatchlist }) {
  const currentYear = new Date().getFullYear();
  const thisYear = watchHistory.filter(h => new Date(h.watched_at).getFullYear() === currentYear);
  const thisMonth = watchHistory.filter(h => new Date(h.watched_at).getMonth() === new Date().getMonth() && new Date(h.watched_at).getFullYear() === currentYear);
  const movies = watchHistory.filter(h => h.movie_type === "movie");
  const shows = watchHistory.filter(h => h.movie_type === "tv");
  const avgRating = Object.values(userRatings).length > 0 ? (Object.values(userRatings).reduce((a,b)=>a+b,0)/Object.values(userRatings).length).toFixed(1) : "—";
  const estHours = watchHistory.length > 0 ? `${Math.round(watchHistory.length * 1.8)}h` : "0h";
  const streak = thisMonth.length;

  const stats = [
    { icon:"📺", value:watchHistory.length, label:"Total Watched",  color:"var(--cyan)",    onClick: onOpenHistory },
    { icon:"🎬", value:movies.length,        label:"Movies",         color:"var(--gold)",    onClick: onOpenHistory },
    { icon:"📡", value:shows.length,         label:"TV Shows",       color:"var(--purple)",  onClick: onOpenHistory },
    { icon:"🗓️", value:thisYear.length,      label:`In ${currentYear}`, color:"var(--sports)", onClick: onOpenHistory },
    { icon:"⏱️", value:estHours,             label:"Est. Hours",    color:"var(--anime)",   onClick: null },
    { icon:"♥",  value:watchlist.length,     label:"Watchlisted",   color:"var(--danger)",  onClick: onOpenWatchlist },
    { icon:"★",  value:Object.keys(userRatings).length, label:"Rated", color:"var(--gold)", onClick: null },
    { icon:"📅", value:streak,               label:"This Month",    color:"var(--cyan)",    onClick: onOpenHistory },
  ];

  const ratingDist = [1,2,3,4,5,6,7,8,9,10].map(n => ({
    rating: n,
    count: Object.values(userRatings).filter(r => r === n).length
  }));
  const maxCount = Math.max(...ratingDist.map(r=>r.count), 1);

  return (
    <div style={{padding:"32px 0 20px",borderTop:"1px solid var(--border)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,padding:"0 24px"}}>
        <span style={{fontSize:24}}>📊</span>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20}}>Your Streaming Stats</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>
            {user ? "Click any card to explore your history" : "Sign in to track your stats"}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12,padding:"0 24px",marginBottom:24}}>
        {stats.map((s,i)=>(
          <div key={i}
            onClick={s.onClick||undefined}
            style={{
              background:"rgba(255,255,255,.03)",
              border:`1px solid ${s.color}22`,
              borderRadius:14, padding:"16px 14px", textAlign:"center",
              transition:"all .2s",
              cursor:s.onClick?"pointer":"default",
              position:"relative",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=`${s.color}66`;e.currentTarget.style.background=`${s.color}10`;e.currentTarget.style.transform=s.onClick?"translateY(-2px)":"none";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${s.color}22`;e.currentTarget.style.background="rgba(255,255,255,.03)";e.currentTarget.style.transform="none";}}>
            {s.onClick && <span style={{position:"absolute",top:8,right:8,fontSize:9,color:`${s.color}88`}}>→</span>}
            <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:s.color,lineHeight:1}}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:4,fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ratings distribution */}
      {Object.keys(userRatings).length > 0 && (
        <div style={{padding:"0 24px",marginBottom:24}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:14,color:"var(--muted)",letterSpacing:.5}}>YOUR RATING DISTRIBUTION · Avg {avgRating}/10</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:5,height:60}}>
            {ratingDist.map(({rating,count})=>(
              <div key={rating} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{
                  width:"100%",
                  background:count>0?"var(--gold)":"rgba(255,255,255,.06)",
                  borderRadius:"4px 4px 0 0",
                  height:`${Math.max((count/maxCount)*52,count>0?4:2)}px`,
                  transition:"height .5s",
                }}/>
                <span style={{fontSize:9,color:"var(--muted)",fontWeight:700}}>{rating}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fun facts */}
      {watchHistory.length > 0 && (
        <div style={{padding:"0 24px"}}>
          <div style={{background:"linear-gradient(135deg,rgba(139,92,246,.1),rgba(245,158,11,.06))",border:"1px solid rgba(245,158,11,.15)",borderRadius:16,padding:20}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,color:"var(--gold)",marginBottom:12,letterSpacing:.5}}>🎉 FUN FACTS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>📺 You've watched approximately <strong style={{color:"var(--gold)"}}>{estHours}</strong> of content</div>
              {movies.length > shows.length
                ? <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>🎬 You're a <strong style={{color:"var(--gold)"}}>Movie Person</strong> — {movies.length} movies vs {shows.length} shows</div>
                : shows.length > 0
                  ? <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>📡 You're a <strong style={{color:"var(--purple)"}}>TV Show Fan</strong> — {shows.length} shows vs {movies.length} movies</div>
                  : null}
              {parseFloat(avgRating) >= 8 && <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>⭐ You're a tough critic — your average rating is <strong style={{color:"var(--gold)"}}>{avgRating}/10</strong></div>}
              {watchlist.length >= 5 && <div style={{fontSize:13,color:"rgba(240,240,250,.75)"}}>♥ You have <strong style={{color:"var(--anime)"}}>{watchlist.length} titles</strong> saved — that's a great weekend lineup!</div>}
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div style={{textAlign:"center",padding:"20px 24px",color:"var(--muted)",fontSize:14}}>
          Sign in to track your personal streaming stats 📊
        </div>
      )}
    </div>
  );
}

// ─── MOBILE HERO WITH TRAILER ────────────────────────────────────────────────


// ─── GENRE SEARCH HELPERS ────────────────────────────────────────────────────

export { AdvancedStats };
