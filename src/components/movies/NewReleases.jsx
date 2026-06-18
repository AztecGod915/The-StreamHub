import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders } from "../../lib/tmdb.js";
import { SERVICES } from "../../data/constants.js";
import { tmdbFetch } from "../../lib/tmdb.js";
function NewReleasesModal({ onClose, user, tier, userSubs, onSelect, onUpgrade }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const myServices = SERVICES.filter(s => userSubs.includes(s.id));

  useEffect(() => {
    const fetchNewReleases = async () => {
      setLoading(true);
      try {
        // Fetch new releases from TMDB - movies and TV
        const [movies, tv] = await Promise.all([
          tmdbFetch("/movie/now_playing?language=en-US&page=1"),
          tmdbFetch("/tv/on_the_air?language=en-US&page=1"),
        ]);
        const movieItems = (movies.results||[]).slice(0,10).map(m=>({...m,mediaType:"movie"}));
        const tvItems = (tv.results||[]).slice(0,10).map(t=>({...t,mediaType:"tv"}));
        // Merge and sort by popularity
        const all = [...movieItems,...tvItems].sort((a,b)=>(b.popularity||0)-(a.popularity||0));
        setReleases(all);
      } catch(e) { setReleases([]); }
      setLoading(false);
    };
    fetchNewReleases();
  }, []);

  if (tier !== "premium") return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:420,border:"1px solid rgba(6,182,212,.3)",padding:32,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🆕</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:8}}>New Releases</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:20,lineHeight:1.7}}>
          See what just dropped on your streaming services — movies, shows, and series premieres, updated daily.
        </div>
        <button onClick={()=>{onUpgrade&&onUpgrade();onClose();}} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:10}}>
          Upgrade to Premium ✦
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );

  const filtered = filter === "all" ? releases : releases.filter(r => r.mediaType === filter);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(6,182,212,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>

        {/* Header */}
        <div style={{padding:"20px 24px 14px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,rgba(6,182,212,.12),rgba(139,92,246,.06))",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:2}}>🆕 New Releases</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>Latest drops across all streaming services</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          {/* Filter tabs */}
          <div style={{display:"flex",gap:6}}>
            {[{id:"all",label:"All"},{ id:"movie",label:"🎬 Movies"},{id:"tv",label:"📺 Shows"}].map(f=>(
              <button key={f.id} onClick={()=>setFilter(f.id)}
                style={{background:filter===f.id?"rgba(139,92,246,.2)":"rgba(255,255,255,.05)",border:`1px solid ${filter===f.id?"rgba(139,92,246,.5)":"transparent"}`,borderRadius:99,color:filter===f.id?"#C4B5FD":"var(--muted)",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-head)"}}>
                {f.label}
              </button>
            ))}
            {myServices.length > 0 && (
              <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>
                <div style={{fontSize:10,color:"var(--muted)"}}>YOUR SERVICES:</div>
                {myServices.slice(0,4).map(s=>(
                  <div key={s.id} style={{background:s.color,borderRadius:6,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff"}}>{s.logo}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>
          {loading ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
              {[...Array(8)].map((_,i)=><div key={i} className="skeleton" style={{height:200,borderRadius:12}}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>No releases found.</div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
              {filtered.map(item=>{
                const gr = safeGR(item.id);
                const poster = item.poster_path ? `${TMDB_IMG}${item.poster_path}` : null;
                const title = item.title || item.name || "";
                const date = item.release_date || item.first_air_date || "";
                const daysAgo = date ? Math.floor((Date.now()-new Date(date))/86400000) : null;
                return (
                  <div key={item.id} onClick={()=>{onSelect({...item,providers:[],category:item.mediaType});onClose();}}
                    style={{borderRadius:12,overflow:"hidden",cursor:"pointer",border:"1px solid var(--border)",background:"var(--card)",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.borderColor="rgba(6,182,212,.5)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                    <div style={{height:180,position:"relative",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
                      {poster && <img src={poster} alt={title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                      <div style={{position:"absolute",top:6,left:6,background:item.mediaType==="tv"?"rgba(139,92,246,.9)":"rgba(245,158,11,.9)",borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:900,color:item.mediaType==="tv"?"#fff":"#000"}}>
                        {item.mediaType==="tv"?"TV":"MOVIE"}
                      </div>
                      {daysAgo !== null && daysAgo <= 7 && (
                        <div style={{position:"absolute",top:6,right:6,background:"rgba(16,185,129,.9)",borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:900,color:"#fff"}}>
                          {daysAgo === 0 ? "TODAY" : `${daysAgo}d ago`}
                        </div>
                      )}
                    </div>
                    <div style={{padding:"8px 10px 10px"}}>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:10,color:"var(--muted)"}}>{date.slice(0,4)}</div>
                        <div style={{fontSize:10,color:"var(--gold)"}}>★ {item.vote_average?.toFixed(1)||"—"}</div>
                      </div>
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

// ─── PWA INSTALL PROMPT ───────────────────────────────────────────────────────

export { NewReleasesModal };
