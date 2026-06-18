import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders, tmdbFetch } from "../../lib/tmdb.js";
import { SERVICES } from "../../data/constants.js";
import { ServiceBadge } from "../shared/ServiceBadge.jsx";
import { StarPicker } from "../shared/StarPicker.jsx";
import { WatchButton } from "./WatchButton.jsx";
import { safeGR } from "../shared/Logo.jsx";
function MovieModal({ movie, watchlist, userRatings, user, onClose, onRate, onToggleWatchlist, showToast, onSelectSimilar }) {
  const [tab, setTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [details, setDetails] = useState(null);
  const [rating, setRating] = useState(0);
  const [revTitle, setRevTitle] = useState("");
  const [revContent, setRevContent] = useState("");
  const [revRating, setRevRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [allProviders, setAllProviders] = useState({flatrate:[],rent:[],buy:[],free:[],link:""});
  const [communityRating, setCommunityRating] = useState(null);

  useEffect(() => {
    if (!movie?.id) return;
    setRating(userRatings?.[movie.id] || 0);
    setTrailerKey(null); setShowTrailer(false);
    setAllProviders({flatrate:[],rent:[],buy:[],free:[],link:""});
    setCommunityRating(null);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}?append_to_response=credits,similar,videos`).then(d => {
      setDetails(d);
      const vids = d?.videos?.results || [];
      const t = vids.find(v=>v.type==="Trailer"&&v.site==="YouTube") || vids.find(v=>v.site==="YouTube");
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
    // Fetch watch providers (rent/buy/stream/free)
    fetch(`${TMDB_BASE}/${type}/${movie.id}/watch/providers`,{headers:tmdbHeaders})
      .then(r=>r.json()).then(data=>{
        const res = data.results?.US || data.results?.GB || Object.values(data.results||{})[0] || {};
        setAllProviders({
          flatrate: res.flatrate||[],
          rent:     res.rent||[],
          buy:      res.buy||[],
          free:     res.free||[],
          link:     res.link||"",   // TMDB JustWatch link — opens platform picker
        });
      }).catch(()=>{});
    supabase.from("reviews").select("*,profiles(username)").eq("movie_id", movie.id).order("created_at", {ascending:false}).then(({data}) => setReviews(data||[])).catch(()=>{});
    // Fetch community rating aggregate
    supabase.from("ratings").select("rating").eq("movie_id", movie.id).then(({data}) => {
      if (data && data.length > 0) {
        const avg = data.reduce((s,r)=>s+r.rating,0) / data.length;
        setCommunityRating({avg:Math.round(avg*10)/10, count:data.length});
      } else {
        setCommunityRating(null);
      }
    }).catch(()=>{});
  }, [movie?.id]);

  if (!movie) return null;

  const inWL = (watchlist||[]).includes(movie.id);
  const providers = movie.providers || [];
  const mainProvider = providers[0];
  const svc = SERVICES.find(s => s.id === mainProvider);
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const tmdbRating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : "—";
  const releaseYear = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  const genres = details?.genres?.slice(0, 3) || [];
  const cast = details?.credits?.cast?.slice(0, 5) || [];
  const similar = details?.similar?.results?.slice(0, 6) || [];
  const gr = safeGR(movie.id);
  const inp = {background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"10px 14px",width:"100%",fontSize:13,outline:"none"};

  const handleRate = async (val) => {
    if (!user) return showToast && showToast("Sign in to rate! 👤");
    setRating(val);
    if (onRate) onRate(movie.id, val);
    try {
      await supabase.from("ratings").upsert({user_id:user.id, movie_id:movie.id, rating:val}, {onConflict:"user_id,movie_id"});
      // Refresh community rating after user rates
      const {data} = await supabase.from("ratings").select("rating").eq("movie_id", movie.id);
      if (data?.length > 0) {
        const avg = data.reduce((s,r)=>s+r.rating,0)/data.length;
        setCommunityRating({avg:Math.round(avg*10)/10, count:data.length});
      }
    } catch(e){}
    showToast && showToast(`Rated ${val}/10 ★`);
  };

  const deleteReview = async (id) => {
    try { await supabase.from("reviews").delete().eq("id", id); } catch(e){}
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast && showToast("Review deleted");
  };

  const submitReview = async () => {
    if (!user) return showToast && showToast("Sign in to review! 👤");
    if (!revRating) return showToast && showToast("Add a star rating!");
    if (!revTitle.trim()) return showToast && showToast("Add a title!");
    if (revContent.trim().length < 10) return showToast && showToast("Review too short!");
    setSubmitting(true);
    try {
      const { data } = await supabase.from("reviews").insert({user_id:user.id, movie_id:movie.id, title:revTitle, content:revContent, rating:revRating}).select("*,profiles(username)");
      if (data?.[0]) { setReviews(prev => [data[0], ...prev]); setRevTitle(""); setRevContent(""); setRevRating(0); showToast && showToast("Review posted! ✍"); }
    } catch(e) { showToast && showToast("Error posting review"); }
    setSubmitting(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:780,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {/* Hero */}
        <div style={{height:200,position:"relative",flexShrink:0,overflow:"hidden",background:`linear-gradient(135deg,${gr[0]},${gr[1]})`}}>
          {showTrailer && trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{width:"100%",height:"100%",border:"none",position:"absolute",inset:0}}
            />
          ) : (
            <>
              {poster && <img src={poster} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.4}} />}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--surface) 0%,transparent 60%)"}} />
              {trailerKey && (
                <button onClick={()=>setShowTrailer(true)}
                  style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
                    background:"rgba(0,0,0,.7)",border:"2px solid rgba(255,255,255,.8)",borderRadius:"50%",
                    width:56,height:56,display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",backdropFilter:"blur(4px)",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,158,11,.9)";e.currentTarget.style.borderColor="var(--gold)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,.7)";e.currentTarget.style.borderColor="rgba(255,255,255,.8)";}}>
                  <span style={{fontSize:22,marginLeft:4}}>▶</span>
                </button>
              )}
            </>
          )}
          <div style={{position:"absolute",top:14,right:14,display:"flex",gap:8}}>
            {showTrailer && <button onClick={()=>setShowTrailer(false)} style={{background:"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:"#fff",padding:"6px 12px",fontSize:12,cursor:"pointer",backdropFilter:"blur(8px)"}}>✕ Close</button>}
            <button onClick={()=>onToggleWatchlist&&onToggleWatchlist(movie.id)} style={{background:inWL?"var(--gold)":"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:inWL?"#000":"#fff",padding:"6px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>{inWL?"♥ Saved":"♡ Watchlist"}</button>
            <button onClick={onClose} style={{background:"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:"#fff",width:36,height:36,fontSize:18,cursor:"pointer"}}>✕</button>
          </div>
          {!showTrailer && (
            <div style={{position:"absolute",bottom:16,left:20,right:20}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,marginBottom:6,textShadow:"0 2px 12px rgba(0,0,0,.8)"}}>{movie.title||movie.name||""}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>{releaseYear}</span>
                {genres.map(g=><span key={g.id} style={{background:"rgba(255,255,255,.12)",borderRadius:6,padding:"2px 8px",fontSize:11}}>{g.name}</span>)}
                {providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p}/>)}
              </div>
            </div>
          )}
        </div>

        {/* Rating bar */}
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"var(--card)",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>TMDB Score</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:"var(--gold)",fontSize:22,fontFamily:"var(--font-head)",fontWeight:800}}>{tmdbRating}</span>
              <span style={{color:"var(--muted)",fontSize:13}}>/ 10</span>
            </div>
          </div>
          <div style={{width:1,height:36,background:"var(--border)"}}/>
          {communityRating && communityRating.count >= 1 && (
            <>
              <div>
                <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>✦ StreamHub</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:"#C4B5FD",fontSize:22,fontFamily:"var(--font-head)",fontWeight:800}}>{communityRating.avg}</span>
                  <span style={{color:"var(--muted)",fontSize:11}}>{communityRating.count} rating{communityRating.count!==1?"s":""}</span>
                </div>
              </div>
              <div style={{width:1,height:36,background:"var(--border)"}}/>
            </>
          )}
          <div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>Your Rating</div>
            <StarPicker value={rating} onChange={handleRate} size={16}/>
          </div>
          {svc && (
            <WatchButton serviceId={mainProvider} title={movie.title||movie.name||""} movieId={movie.id} webUrl={allProviders.link||""} style={{marginLeft:"auto"}}/>
          )}
          {trailerKey && !showTrailer && (
            <button onClick={()=>setShowTrailer(true)}
              style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"var(--text)",padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginLeft:svc?"0":"auto"}}>
              🎬 Trailer
            </button>
          )}
          <button onClick={()=>{
              const txt=`📺 "${movie.title||movie.name}" — found on The StreamHub, the AI streaming assistant! thestreamhub.app`;
              if(navigator.share){navigator.share({title:movie.title||movie.name,text:txt,url:"https://thestreamhub.app"}).catch(()=>{});}
              else{window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}`,"_blank");}
            }}
            style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"var(--muted)",padding:"9px 14px",fontWeight:700,fontSize:13,cursor:"pointer",marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
            📤 Share
          </button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"12px 20px 0",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {["overview","cast","reviews"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"8px 12px",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer"}}>
              {t}{t==="reviews"?` (${reviews.length})`:""}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>

          {tab==="overview" && (
            <div>
              <p style={{fontSize:14,lineHeight:1.75,color:"rgba(240,240,250,.8)",marginBottom:20}}>{movie.overview||details?.overview||"No description available."}</p>

              {/* Where to Watch / Find It */}
              {(allProviders.flatrate.length>0 || allProviders.free.length>0 || allProviders.rent.length>0 || allProviders.buy.length>0) && (
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>WHERE TO WATCH</div>

                  {/* Streaming (included) */}
                  {allProviders.flatrate.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"var(--sports)",fontWeight:700,marginBottom:6}}>✅ INCLUDED IN SUBSCRIPTION</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.flatrate.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.25)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(16,185,129,.2)";e.currentTarget.style.borderColor="rgba(16,185,129,.5)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(16,185,129,.1)";e.currentTarget.style.borderColor="rgba(16,185,129,.25)";}}>
                            <div style={{width:20,height:20,borderRadius:5,overflow:"hidden",flexShrink:0}}>
                              {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                            </div>
                            {p.provider_name}
                            <span style={{fontSize:10,opacity:.6}}>▶</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Free */}
                  {allProviders.free.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"var(--gold)",fontWeight:700,marginBottom:6}}>🆓 FREE WITH ADS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.free.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,158,11,.18)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,158,11,.08)";}}>
                            {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}
                            {p.provider_name}
                            <span style={{fontSize:10,opacity:.6}}>▶</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rent */}
                  {allProviders.rent.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,marginBottom:6}}>💳 RENT</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.rent.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(139,92,246,.18)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,92,246,.08)";}}>
                            {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}
                            {p.provider_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buy */}
                  {allProviders.buy.length>0 && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:6}}>🛒 BUY</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {allProviders.buy.map((p,i)=>(
                          <a key={i} href={getPlatformLink(p.provider_name, movie.id, movie.title||movie.name, allProviders.link)} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",alignItems:"center",gap:6,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,textDecoration:"none",color:"var(--text)",cursor:"pointer",transition:"all .2s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,158,11,.18)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,158,11,.08)";}}>
                            {p.logo_path && <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>}
                            {p.provider_name}
                            <span style={{fontSize:10,opacity:.6}}>▶</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Not available anywhere — show search options */}
              {allProviders.flatrate.length===0 && allProviders.free.length===0 && allProviders.rent.length===0 && allProviders.buy.length===0 && details && (
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:16,marginBottom:20}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,marginBottom:4}}>🔍 Not on streaming right now</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>This title may be available to rent, buy, or find for free elsewhere:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {[
                      {name:"YouTube",    url:`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title||movie.name)}`,    color:"#FF0000"},
                      {name:"Amazon",     url:`https://www.amazon.com/s?k=${encodeURIComponent(movie.title||movie.name)}+movie`,                color:"#00A8E1"},
                      {name:"Apple TV",   url:`https://tv.apple.com/search?term=${encodeURIComponent(movie.title||movie.name)}`,                color:"#555"},
                      {name:"Vudu",       url:`https://www.vudu.com/content/movies/search?searchString=${encodeURIComponent(movie.title||movie.name)}`, color:"#3399FF"},
                      {name:"Google Play",url:`https://play.google.com/store/search?q=${encodeURIComponent(movie.title||movie.name)}&c=movies`, color:"#4285F4"},
                    ].map(s=>(
                      <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{display:"flex",alignItems:"center",gap:6,background:`${s.color}15`,border:`1px solid ${s.color}40`,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,color:"var(--text)",textDecoration:"none",transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=`${s.color}30`}
                        onMouseLeave={e=>e.currentTarget.style.background=`${s.color}15`}>
                        🔗 {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {similar.length>0 && (
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:12,color:"var(--muted)"}}>Similar Titles</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    {similar.map(sm=>{
                      const sgr = safeGR(sm.id);
                      const sp = sm.poster_path ? `${TMDB_IMG}${sm.poster_path}` : null;
                      return (
                        <div key={sm.id} onClick={()=>onSelectSimilar&&onSelectSimilar(sm)}
                          style={{background:"var(--card)",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"all .2s"}}
                          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.borderColor="rgba(245,158,11,.4)";}}
                          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                          {sp ? <img src={sp} alt="" style={{width:"100%",height:100,objectFit:"cover"}}/>
                               : <div style={{height:100,background:`linear-gradient(135deg,${sgr[0]},${sgr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(sm.title||sm.name||"").slice(0,2)}</div>}
                          <div style={{padding:"6px 8px"}}>
                            <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sm.title||sm.name||""}</div>
                            <div style={{fontSize:10,color:"var(--gold)"}}>★ {sm.vote_average?.toFixed(1)||"—"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==="cast" && (
            <div>
              {cast.length===0
                ? <div style={{color:"var(--muted)",textAlign:"center",padding:"32px 0"}}>No cast info available.</div>
                : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:14}}>
                    {cast.map(c=>{
                      const cgr = safeGR(c.id);
                      return (
                        <div key={c.id} style={{textAlign:"center"}}>
                          <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 8px",overflow:"hidden",background:`linear-gradient(135deg,${cgr[0]},${cgr[1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>
                            {c.profile_path ? <img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                            : <span style={{opacity:.4}}>{(c.name||"").slice(0,2)}</span>}
                          </div>
                          <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{c.name||""}</div>
                          <div style={{fontSize:11,color:"var(--muted)"}}>{c.character||""}</div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {tab==="reviews" && (
            <div>
              <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:"var(--radius)",padding:18,marginBottom:24}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,marginBottom:12,fontSize:15}}>{user?"Write a Review":"Sign in to Review"}</div>
                {user ? (
                  <div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Your Rating</div>
                      <StarPicker value={revRating} onChange={setRevRating}/>
                    </div>
                    <input value={revTitle} onChange={e=>setRevTitle(e.target.value)} placeholder="Review title..." style={{...inp,marginBottom:8}}/>
                    <textarea value={revContent} onChange={e=>setRevContent(e.target.value)} placeholder="Share your thoughts..." rows={3} style={{...inp,resize:"vertical",marginBottom:8}}/>
                    <button onClick={submitReview} disabled={submitting} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 20px",fontWeight:600,fontSize:13,cursor:"pointer"}}>
                      {submitting?"Posting…":"Post Review"}
                    </button>
                  </div>
                ) : <div style={{fontSize:13,color:"var(--muted)"}}>Create a free account to leave reviews.</div>}
              </div>
              {reviews.length===0
                ? <div style={{textAlign:"center",color:"var(--muted)",padding:"32px 0",fontSize:14}}>No reviews yet. Be the first!</div>
                : reviews.map(rv=>(
                    <div key={rv.id||Math.random()} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13}}>
                          {((rv.profiles?.username||"U")[0]||"U").toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>{rv.profiles?.username||"User"}</div>
                          <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString()}</div>
                        </div>
                        <span style={{marginLeft:"auto",background:"rgba(245,158,11,.15)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                        {user?.id===rv.user_id && <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"#ef4444",padding:"4px 10px",fontSize:12,cursor:"pointer"}}>Delete</button>}
                      </div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:5}}>{rv.title||""}</div>
                      <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content||""}</div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── UPGRADE MODAL ────────────────────────────────────────────────────────────

export { MovieModal };
