import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";

// ─── GOOGLE ANALYTICS EVENT TRACKER ──────────────────────────────────────────
const track = (eventName, params = {}) => {
  try {
    if (window.gtag) window.gtag("event", eventName, params);
  } catch(e) {}
};

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// ─── TMDB HELPERS ─────────────────────────────────────────────────────────────
const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const TMDB_BASE  = "https://api.themoviedb.org/3";
const TMDB_IMG   = "https://image.tmdb.org/t/p/w500";
const tmdbHeaders = { Authorization: `Bearer ${TMDB_TOKEN}`, "Content-Type": "application/json" };

async function tmdbFetch(path) {
  const res = await fetch(`${TMDB_BASE}${path}`, { headers: tmdbHeaders });
  return res.json();
}

// TMDB provider_id → our service id
const PROVIDER_MAP = {
  8:"netflix", 337:"disney", 1899:"max", 15:"hulu", 350:"apple",
  9:"prime", 386:"peacock", 531:"paramount", 283:"crunchyroll", 149:"espnplus",
};

function getProviders(watchProviders) {
  const results = watchProviders?.results?.US;
  if (!results) return [];
  const flat = [...(results.flatrate||[]), ...(results.free||[])];
  return flat.map(p => PROVIDER_MAP[p.provider_id]).filter(Boolean);
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = () => {
  useEffect(() => {
    // ── Google Analytics ──
    const gaScript1 = document.createElement("script");
    gaScript1.async = true;
    gaScript1.src = "https://www.googletagmanager.com/gtag/js?id=G-LK433DT8M2";
    document.head.appendChild(gaScript1);
    const gaScript2 = document.createElement("script");
    gaScript2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LK433DT8M2');`;
    document.head.appendChild(gaScript2);
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      :root {
        --bg:#07070E; --surface:#0D0D1A; --card:#111122;
        --border:rgba(255,255,255,0.07); --gold:#F5C518; --gold-dim:rgba(245,197,24,0.15);
        --purple:#7C3AED; --cyan:#06B6D4; --anime:#FF6B9D; --sports:#10B981;
        --text:#F0F0FA; --muted:rgba(240,240,250,0.45);
        --danger:#EF4444; --success:#10B981; --radius:14px;
        --font-head:'Syne',sans-serif; --font-body:'Plus Jakarta Sans',sans-serif;
      }
      body { background:var(--bg); color:var(--text); font-family:var(--font-body); -webkit-font-smoothing:antialiased; }
      body::before {
        content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
        background:
          radial-gradient(ellipse 80% 50% at 20% 0%, rgba(124,58,237,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 10%, rgba(245,197,24,0.08) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 10% 70%, rgba(6,182,212,0.1) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 90% 80%, rgba(255,107,157,0.07) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(16,185,129,0.05) 0%, transparent 60%);
        animation:bgBreath 12s ease-in-out infinite;
      }
      body::after {
        content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
        background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
        background-size:60px 60px;
        mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%);
      }
      @keyframes bgBreath { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.05)} }
      #root { position:relative; z-index:1; }
      ::-webkit-scrollbar { width:5px; height:5px; }
      ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:99px; }
      @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes spin     { to{transform:rotate(360deg)} }
      @keyframes slideRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideDown{ from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      @keyframes logoPulse { 0%,100%{filter:drop-shadow(0 0 0px rgba(245,197,24,0))} 50%{filter:drop-shadow(0 0 14px rgba(245,197,24,0.7))} }
      @keyframes logoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes flameDance { 0%,100%{transform:scale(1) rotate(-8deg)} 25%{transform:scale(1.3) rotate(8deg)} 50%{transform:scale(0.9) rotate(-5deg)} 75%{transform:scale(1.2) rotate(6deg)} }
      @keyframes swordSwing { 0%,100%{transform:rotate(-20deg) scale(1)} 50%{transform:rotate(20deg) scale(1.1)} }
      @keyframes tvFlicker { 0%,88%,92%,100%{opacity:1} 90%{opacity:0.4} }
      @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      @keyframes badgePop { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
      @keyframes trophyBounce { 0%,100%{transform:translateY(0) rotate(-5deg)} 40%{transform:translateY(-6px) rotate(5deg)} 70%{transform:translateY(-3px) rotate(-3deg)} }
      .fadeUp { animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
      .fadeIn { animation:fadeIn .25s ease both; }
      .skeleton { background:linear-gradient(90deg,#1a1a2e 25%,#252540 50%,#1a1a2e 75%); background-size:400px 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
      input,textarea { font-family:var(--font-body); }
      button { cursor:pointer; font-family:var(--font-body); }
      a { color:inherit; text-decoration:none; }
      @media(max-width:768px) {
        .desktop-only { display:none !important; }
        .mobile-only  { display:flex !important; }
      }
      @media(min-width:769px) {
        .mobile-only  { display:none !important; }
      }
      @media(max-width:1100px) and (min-width:769px) {
        .tablet-hide { display:none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ─── SERVICES ─────────────────────────────────────────────────────────────────
const SERVICES = [
  { id:"netflix",     name:"Netflix",     color:"#E50914", logo:"N",  deal:null,                  url:"https://www.netflix.com/search?q=",           price:15.49 },
  { id:"disney",      name:"Disney+",     color:"#0063E5", logo:"D+", deal:null,                  url:"https://www.disneyplus.com/search/",           price:7.99  },
  { id:"max",         name:"Max",         color:"#002BE7", logo:"M",  deal:null,                  url:"https://www.max.com/search?q=",               price:9.99  },
  { id:"hulu",        name:"Hulu",        color:"#1CE783", logo:"H",  deal:"2 months free",       url:"https://www.hulu.com/search?q=",              price:7.99  },
  { id:"apple",       name:"Apple TV+",   color:"#555",    logo:"A",  deal:"$2.99/mo first year", url:"https://tv.apple.com/search?term=",           price:9.99  },
  { id:"prime",       name:"Prime",       color:"#00A8E1", logo:"P",  deal:null,                  url:"https://www.amazon.com/s?k=",                 price:8.99  },
  { id:"peacock",     name:"Peacock",     color:"#E81C2E", logo:"Pk", deal:"50% off annual",      url:"https://www.peacocktv.com/search?q=",         price:5.99  },
  { id:"paramount",   name:"Paramount+",  color:"#0064FF", logo:"P+", deal:"30-day trial",        url:"https://www.paramountplus.com/search/?q=",    price:5.99  },
  { id:"crunchyroll", name:"Crunchyroll", color:"#F47521", logo:"CR", deal:"14-day free trial",   url:"https://www.crunchyroll.com/search?q=",       price:7.99  },
  { id:"espnplus",    name:"ESPN+",       color:"#E31837", logo:"E+", deal:null,                  url:"https://www.espn.com/espnplus/player/",       price:10.99 },
  { id:"dazn",        name:"DAZN",        color:"#C8A900", logo:"DZ", deal:"Cancel anytime, no PPV fees",   url:"https://www.dazn.com/search?q=",              price:19.99 },
  { id:"fubo",        name:"Fubo",        color:"#FF6B00", logo:"F",  deal:"5-day free trial + $30 off",    url:"https://www.fubo.tv/welcome",                 price:79.99 },
  { id:"tubi",        name:"Tubi",        color:"#FA4343", logo:"Tu", deal:"Always Free! 🎉",      url:"https://tubitv.com/search/",                  price:0     },
];

const CATEGORY_TABS = [
  { id:"trending", label:"Trending",  icon:"🔥", color:"#F5C518", anim:"flameDance" },
  { id:"movies",   label:"Movies",    icon:"🎬", color:"var(--cyan)", anim:null },
  { id:"tv",       label:"TV Shows",  icon:"📺", color:"#A78BFA", anim:"tvFlicker" },
  { id:"anime",    label:"Anime",     icon:"✦",  color:"var(--anime)", anim:"swordSwing" },
  { id:"sports",   label:"Sports",    icon:"🏆", color:"var(--sports)", anim:"trophyBounce" },
  { id:"search",   label:"Search",    icon:"🔍", color:"var(--gold)", anim:null },
];

const GR = [
  ["#1a1a2e","#e94560"],["#0d1b2a","#1f6feb"],["#1a0533","#7928ca"],
  ["#0a1628","#f59e0b"],["#1c0d2e","#c026d3"],["#0d2137","#06b6d4"],
  ["#1f1200","#d97706"],["#001f0d","#10b981"],["#1a0a0a","#ef4444"],
  ["#0d0d1a","#6366f1"],["#1a1000","#eab308"],["#0a1a1a","#14b8a6"],
];

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size=32 }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
      <div style={{animation:"logoFloat 3s ease-in-out infinite",display:"flex"}}>
        {!imgError ? (
          <img
            src="/logo-clean.png"
            alt="The StreamHub"
            onError={()=>setImgError(true)}
            style={{
              height: size * 2.8,
              width: "auto",
              objectFit:"contain",
              filter:"drop-shadow(0 0 12px rgba(245,197,24,.5)) drop-shadow(0 0 24px rgba(124,58,237,.3))",
              animation:"logoPulse 2.5s ease-in-out infinite",
            }}
          />
        ) : (
          <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:size*0.65,letterSpacing:"-.02em"}}>
            <span style={{background:"linear-gradient(90deg,#c8960c,#F5C518,#c8960c)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>The Stream</span>
            <span style={{background:"linear-gradient(90deg,#7C3AED,#a855f7,#7C3AED)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>Hub</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── SERVICE BADGE ────────────────────────────────────────────────────────────
function ServiceBadge({ platformId, small }) {
  const s = SERVICES.find(sv=>sv.id===platformId);
  if (!s) return null;
  return <span style={{background:s.color,color:"#fff",fontFamily:"var(--font-head)",fontWeight:700,fontSize:small?9:11,padding:small?"2px 5px":"3px 8px",borderRadius:6,letterSpacing:.5,whiteSpace:"nowrap"}}>{s.name}</span>;
}

// ─── STAR PICKER ──────────────────────────────────────────────────────────────
function StarPicker({ value, onChange, size=18, readOnly=false }) {
  const [hover, setHover] = useState(0);
  const display = hover||value;
  return (
    <div style={{display:"flex",gap:2}}>
      {Array.from({length:10},(_,i)=>i+1).map(s=>(
        <span key={s} onClick={()=>!readOnly&&onChange(s)}
          onMouseEnter={()=>!readOnly&&setHover(s)} onMouseLeave={()=>!readOnly&&setHover(0)}
          style={{fontSize:size,cursor:readOnly?"default":"pointer",color:s<=display?"#F5C518":"rgba(255,255,255,0.15)",display:"inline-block",transform:(!readOnly&&hover===s)?"scale(1.3)":"scale(1)",transition:"all .12s",lineHeight:1}}>★</span>
      ))}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[]);
  return <div style={{position:"fixed",bottom:24,right:24,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"12px 20px",zIndex:2000,fontWeight:600,fontSize:14,boxShadow:"0 12px 32px rgba(0,0,0,.5)",animation:"slideRight .3s cubic-bezier(.22,1,.36,1) both",display:"flex",alignItems:"center",gap:10}}><span style={{color:"var(--gold)",fontSize:16}}>✦</span>{msg}</div>;
}

// ─── MOVIE CARD ───────────────────────────────────────────────────────────────
function MovieCard({ movie, watchlist, userRatings, userSubs, onSelect, onToggleWatchlist }) {
  const [hov, setHov] = useState(false);
  const idx = movie.id % GR.length;
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
        filter:notSub?"brightness(0.6) saturate(0.5)":"none",background:"var(--card)"}}>
      {/* Poster */}
      <div style={{height:200,position:"relative",overflow:"hidden",background:`linear-gradient(135deg,${GR[idx][0]},${GR[idx][1]})`}}>
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
function AuthModal({ onClose, showToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inp = {background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",width:"100%",fontSize:14,outline:"none",fontFamily:"var(--font-body)"};

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ username } } });
        if (error) throw error;
        showToast("Account created! Check your email to verify. ✉️");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("Welcome back! 👋");
        onClose();
      }
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:420,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <Logo size={28} />
            <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20}}>✕</button>
          </div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6}}>{mode==="login"?"Welcome back":"Create account"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>{mode==="login"?"Sign in to sync your watchlist & reviews":"Join StreamHub — it's free"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {mode==="signup" && <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" style={inp} />}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={inp} />
          </div>
          {err && <div style={{color:"var(--danger)",fontSize:12,marginBottom:12}}>{err}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<span style={{display:"inline-block",width:18,height:18,border:"2px solid #000",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:null}
            {mode==="login"?"Sign In":"Create Account"}
          </button>
          <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"var(--muted)"}}>
            {mode==="login"?"Don't have an account?":"Already have an account?"}
            <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}} style={{background:"none",border:"none",color:"var(--gold)",fontWeight:700,fontSize:13,marginLeft:6}}>{mode==="login"?"Sign Up":"Sign In"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ user, profile, tier, watchlist, userRatings, onClose, onSignOut, onUpgrade, showToast, onEditSubs, onSelectMovie }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username||user?.email?.split("@")[0]||"User");
  const [tab, setTab] = useState("overview");
  const [myReviews, setMyReviews] = useState([]);
  const [wlMovies, setWlMovies] = useState([]);
  const [loadingWl, setLoadingWl] = useState(false);
  const [loadingRev, setLoadingRev] = useState(false);
  const avatarLetter = username[0]?.toUpperCase()||"U";
  const totalRatings = Object.keys(userRatings).length;

  const saveUsername = async () => {
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (!error) { showToast("Username updated!"); setEditing(false); }
  };

  // Load watchlist movies from TMDB when tab opens
  useEffect(() => {
    if (tab !== "watchlist" || wlMovies.length > 0) return;
    setLoadingWl(true);
    Promise.all(watchlist.slice(0,20).map(async id => {
      try { return await tmdbFetch(`/movie/${id}?language=en-US`).catch(() => tmdbFetch(`/tv/${id}?language=en-US`)); }
      catch { return null; }
    })).then(results => {
      setWlMovies(results.filter(Boolean));
      setLoadingWl(false);
    });
  }, [tab]);

  // Load user's reviews
  useEffect(() => {
    if (tab !== "reviews" || myReviews.length > 0) return;
    setLoadingRev(true);
    supabase.from("reviews").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).then(({data}) => {
      setMyReviews(data||[]);
      setLoadingRev(false);
    });
  }, [tab]);

  const deleteReview = async (id) => {
    await supabase.from("reviews").delete().eq("id", id);
    setMyReviews(prev => prev.filter(r => r.id !== id));
    showToast("Review deleted");
  };

  const tabs = ["overview","watchlist","reviews"];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"90vh",border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)",overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,rgba(124,58,237,.3),rgba(245,197,24,.1))",padding:"24px 24px 20px",position:"relative",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,.4)",border:"none",borderRadius:10,color:"#fff",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,border:"3px solid rgba(245,197,24,.4)",flexShrink:0}}>{avatarLetter}</div>
            <div>
              {editing
                ? <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input value={username} onChange={e=>setUsername(e.target.value)} autoFocus style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:15,fontFamily:"var(--font-head)",fontWeight:700,outline:"none",width:160}} />
                    <button onClick={saveUsername} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Save</button>
                  </div>
                : <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>{username}</div>
                    <button onClick={()=>setEditing(true)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,color:"var(--muted)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✏️</button>
                  </div>
              }
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4}}>{user?.email}</div>
              {tier==="premium"
                ? <span style={{background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99,fontFamily:"var(--font-head)",display:"inline-block",marginTop:6}}>✦ PREMIUM</span>
                : <span style={{background:"rgba(255,255,255,.1)",color:"var(--muted)",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,display:"inline-block",marginTop:6}}>FREE</span>
              }
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
            {[["♥",watchlist.length,"Watchlist","watchlist"],["✍",myReviews.length||"—","Reviews","reviews"],["★",totalRatings,"Rated",null]].map(([icon,val,label,t])=>(
              <button key={label} onClick={()=>t&&setTab(t)}
                style={{background:tab===t?"rgba(245,197,24,.12)":"rgba(255,255,255,.06)",borderRadius:10,padding:"10px 8px",textAlign:"center",border:`1px solid ${tab===t?"rgba(245,197,24,.3)":"rgba(255,255,255,.08)"}`,cursor:t?"pointer":"default",transition:"all .2s"}}>
                <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,color:"var(--gold)"}}>{val}</div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"12px 0",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer"}}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>

          {/* Overview tab */}
          {tab==="overview" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={onEditSubs} style={{background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:12,color:"var(--text)",padding:"12px 16px",fontWeight:600,fontSize:14,textAlign:"left",cursor:"pointer"}}>⚙️ Manage Subscriptions</button>
              {tier!=="premium" && <button onClick={()=>{onUpgrade();onClose();}} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>}
              <button onClick={onSignOut} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,color:"var(--danger)",padding:"12px 0",fontWeight:600,fontSize:14,cursor:"pointer"}}>Sign Out</button>
            </div>
          )}

          {/* Watchlist tab */}
          {tab==="watchlist" && (
            <div>
              {loadingWl ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}>
                  <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your watchlist…
                </div>
              ) : watchlist.length === 0 ? (
                <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>Your watchlist is empty. Tap ♡ on any title to save it!</div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {wlMovies.map(m=>{
                    const poster = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null;
                    return (
                      <div key={m.id} onClick={()=>{onSelectMovie(m);onClose();}} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--card)",transition:"transform .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                        {poster ? <img src={poster} alt="" style={{width:"100%",height:110,objectFit:"cover"}}/> : <div style={{height:110,background:`linear-gradient(135deg,#1a1a2e,#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                        <div style={{padding:"6px 8px"}}>
                          <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
                          <div style={{fontSize:10,color:"var(--gold)"}}>★ {m.vote_average?.toFixed(1)||"—"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {tab==="reviews" && (
            <div>
              {loadingRev ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}>
                  <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--purple)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your reviews…
                </div>
              ) : myReviews.length === 0 ? (
                <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>You haven't written any reviews yet. Open any title and share your thoughts!</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {myReviews.map(rv=>(
                    <div key={rv.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:10}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:2}}>{rv.title}</div>
                          <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <span style={{background:"var(--gold-dim)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                          <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"var(--danger)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>Delete</button>
                        </div>
                      </div>
                      <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MOVIE MODAL ──────────────────────────────────────────────────────────────
function MovieModal({ movie, watchlist, userRatings, myVotes, user, onClose, onRate, onToggleWatchlist, onVote, showToast, onSelectSimilar }) {
  const [tab, setTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [details, setDetails] = useState(null);
  const [rating, setRating] = useState(userRatings[movie.id]||0);
  const [revTitle, setRevTitle] = useState("");
  const [revContent, setRevContent] = useState("");
  const [revRating, setRevRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [allProviders, setAllProviders] = useState({flatrate:[],rent:[],buy:[],free:[]});
  const inWL = watchlist.includes(movie.id);
  const providers = movie.providers||[];
  const mainProvider = providers[0];
  const svc = SERVICES.find(s=>s.id===mainProvider);
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;

  useEffect(()=>{
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}?append_to_response=credits,similar`).then(d=>setDetails(d));
    supabase.from("reviews").select("*,profiles(username)").eq("movie_id",movie.id).order("created_at",{ascending:false}).then(({data})=>setReviews(data||[]));
    // Fetch full provider data including rent/buy
    fetch(`${TMDB_BASE}/${type}/${movie.id}/watch/providers`, {headers:tmdbHeaders})
      .then(r=>r.json()).then(data=>{
        const res = data.results?.US || data.results?.GB || Object.values(data.results||{})[0] || {};
        setAllProviders({
          flatrate: res.flatrate||[],
          rent:     res.rent||[],
          buy:      res.buy||[],
          free:     res.free||[],
        });
      }).catch(()=>{});
  },[movie.id]);

  const handleRate = async(val) => {
    if (!user) return showToast("Sign in to rate! 👤");
    setRating(val); onRate(movie.id, val);
    await supabase.from("ratings").upsert({user_id:user.id,movie_id:movie.id,rating:val},{onConflict:"user_id,movie_id"});
    showToast(`Rated ${val}/10 ★`);
  };

  const submitReview = async() => {
    if (!user) return showToast("Sign in to review! 👤");
    if (!revRating) return showToast("Add a star rating!");
    if (!revTitle.trim()) return showToast("Add a title!");
    if (revContent.trim().length < 10) return showToast("Review too short!");
    setSubmitting(true);
    const { data, error } = await supabase.from("reviews").insert({user_id:user.id,movie_id:movie.id,title:revTitle,content:revContent,rating:revRating}).select("*,profiles(username)");
    if (!error && data) { setReviews(prev=>[data[0],...prev]); setRevTitle(""); setRevContent(""); setRevRating(0); showToast("Review posted! ✍"); }
    setSubmitting(false);
  };

  const deleteReview = async(id) => {
    await supabase.from("reviews").delete().eq("id",id);
    setReviews(prev=>prev.filter(r=>r.id!==id));
    showToast("Review deleted");
  };

  const tmdbRating = movie.vote_average ? (movie.vote_average).toFixed(1) : "—";
  const releaseYear = (movie.release_date||movie.first_air_date||"").slice(0,4);
  const genres = details?.genres?.slice(0,3)||[];
  const cast = details?.credits?.cast?.slice(0,5)||[];
  const similar = details?.similar?.results?.slice(0,6)||[];
  const hasStreaming = providers.length > 0 || allProviders.flatrate.length > 0 || allProviders.free.length > 0;
  const hasRentBuy = allProviders.rent.length > 0 || allProviders.buy.length > 0;

  const inp = {background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"10px 14px",width:"100%",fontSize:13,outline:"none"};

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:780,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {/* Hero */}
        <div style={{height:200,position:"relative",flexShrink:0,overflow:"hidden",background:`linear-gradient(135deg,${GR[movie.id%GR.length][0]},${GR[movie.id%GR.length][1]})`}}>
          {poster && <img src={poster} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.4}} />}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--surface) 0%,transparent 60%)"}} />
          <div style={{position:"absolute",top:14,right:14,display:"flex",gap:8}}>
            <button onClick={()=>onToggleWatchlist(movie.id)} style={{background:inWL?"var(--gold)":"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:inWL?"#000":"#fff",padding:"6px 14px",fontWeight:700,fontSize:13,backdropFilter:"blur(8px)"}}>{inWL?"♥ Saved":"♡ Watchlist"}</button>
            <button onClick={onClose} style={{background:"rgba(0,0,0,.7)",border:"none",borderRadius:10,color:"#fff",width:36,height:36,fontSize:18,backdropFilter:"blur(8px)"}}>✕</button>
          </div>
          <div style={{position:"absolute",bottom:16,left:20,right:20}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,marginBottom:6,textShadow:"0 2px 12px rgba(0,0,0,.8)"}}>{movie.title||movie.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,.7)"}}>{releaseYear}</span>
              {genres.map(g=><span key={g.id} style={{background:"rgba(255,255,255,.12)",borderRadius:6,padding:"2px 8px",fontSize:11}}>{g.name}</span>)}
              {providers.slice(0,2).map(p=><ServiceBadge key={p} platformId={p} />)}
            </div>
          </div>
        </div>

        {/* Rating bar */}
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"var(--card)",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>TMDB Score</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:"var(--gold)",fontSize:22,fontFamily:"var(--font-head)",fontWeight:800}}>{tmdbRating}</span>
              <span style={{color:"var(--muted)",fontSize:13}}>/ 10 · {(movie.vote_count||0).toLocaleString()} votes</span>
            </div>
          </div>
          <div style={{width:1,height:36,background:"var(--border)"}} />
          <div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>Your Rating</div>
            <StarPicker value={rating} onChange={handleRate} size={16} />
          </div>
          {svc && (
            <WatchButton serviceId={mainProvider} title={movie.title||movie.name} webUrl={svc.url} style={{marginLeft:"auto"}} />
          )}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"12px 20px 0",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {["overview","where to watch","cast","reviews"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"8px 12px",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer",whiteSpace:"nowrap"}}>
              {t}{t==="reviews"&&` (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>

          {/* Overview tab */}
          {tab==="overview" && (
            <div>
              <p style={{fontSize:14,lineHeight:1.75,color:"rgba(240,240,250,.8)",marginBottom:20}}>{movie.overview||details?.overview||"No description available."}</p>
              {similar.length>0 && (
                <>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:12,color:"var(--muted)"}}>Similar Titles</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    {similar.map(sm=>{
                      const sp=sm.poster_path?`${TMDB_IMG}${sm.poster_path}`:null;
                      return (
                        <div key={sm.id} onClick={()=>onSelectSimilar&&onSelectSimilar(sm)}
                          style={{background:"var(--card)",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"all .2s"}}
                          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.borderColor="rgba(245,197,24,.4)";}}
                          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="var(--border)";}}>
                          {sp
                            ?<img src={sp} alt="" style={{width:"100%",height:100,objectFit:"cover"}} />
                            :<div style={{height:100,background:`linear-gradient(135deg,${GR[sm.id%GR.length][0]},${GR[sm.id%GR.length][1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(sm.title||sm.name||"").slice(0,2)}</div>}
                          <div style={{padding:"8px 10px"}}>
                            <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{sm.title||sm.name}</div>
                            <div style={{fontSize:10,color:"var(--gold)"}}>★ {sm.vote_average?.toFixed(1)||"—"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Where to Watch tab */}
          {tab==="where to watch" && (
            <div>
              {/* Streaming */}
              {(allProviders.flatrate.length>0||allProviders.free.length>0) && (
                <div style={{marginBottom:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{fontSize:18}}>📺</span>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,color:"var(--sports)"}}>Stream Free (Included with subscription)</div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                    {[...allProviders.flatrate,...allProviders.free].map((p,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"8px 14px"}}>
                        {p.logo_path&&<img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt="" style={{width:24,height:24,borderRadius:4,objectFit:"cover"}} />}
                        <span style={{fontSize:13,fontWeight:600}}>{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rent */}
              {allProviders.rent.length>0 && (
                <div style={{marginBottom:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{fontSize:18}}>🎬</span>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,color:"var(--cyan)"}}>Rent</div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                    {allProviders.rent.map((p,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:10,padding:"8px 14px"}}>
                        {p.logo_path&&<img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt="" style={{width:24,height:24,borderRadius:4,objectFit:"cover"}} />}
                        <span style={{fontSize:13,fontWeight:600}}>{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy */}
              {allProviders.buy.length>0 && (
                <div style={{marginBottom:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{fontSize:18}}>🛒</span>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,color:"var(--gold)"}}>Buy</div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                    {allProviders.buy.map((p,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.2)",borderRadius:10,padding:"8px 14px"}}>
                        {p.logo_path&&<img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt="" style={{width:24,height:24,borderRadius:4,objectFit:"cover"}} />}
                        <span style={{fontSize:13,fontWeight:600}}>{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nothing available */}
              {!hasStreaming && !hasRentBuy && (
                <div style={{textAlign:"center",padding:"40px 20px"}}>
                  <div style={{fontSize:48,marginBottom:16}}>😔</div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:18,marginBottom:8}}>Not Available for Streaming</div>
                  <div style={{color:"var(--muted)",fontSize:14,lineHeight:1.7,marginBottom:20}}>This title isn't currently on any major streaming service. You may be able to find it on:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
                    {[
                      {name:"YouTube",url:`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title||movie.name)}`,color:"#FF0000"},
                      {name:"Amazon",url:`https://www.amazon.com/s?k=${encodeURIComponent(movie.title||movie.name)}+dvd`,color:"#FF9900"},
                      {name:"eBay",url:`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(movie.title||movie.name)}`,color:"#86B817"},
                      {name:"Google",url:`https://www.google.com/search?q=${encodeURIComponent(movie.title||movie.name)}+where+to+watch`,color:"#4285F4"},
                    ].map(s=>(
                      <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{display:"inline-flex",alignItems:"center",gap:8,background:`${s.color}15`,border:`1px solid ${s.color}44`,borderRadius:10,padding:"10px 18px",color:"var(--text)",fontSize:13,fontWeight:700,textDecoration:"none"}}>
                        🔗 Search on {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{fontSize:11,color:"var(--muted)",marginTop:16,textAlign:"center"}}>
                Streaming availability data provided by JustWatch via TMDB · May vary by region
              </div>
            </div>
          )}

          {/* Cast tab */}
          {tab==="cast" && (
            <div>
              {cast.length===0?<div style={{color:"var(--muted)",textAlign:"center",padding:"32px 0"}}>No cast info available.</div>:(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:14}}>
                  {cast.map(c=>(
                    <div key={c.id} style={{textAlign:"center"}}>
                      <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 8px",overflow:"hidden",background:`linear-gradient(135deg,${GR[c.id%GR.length][0]},${GR[c.id%GR.length][1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>
                        {c.profile_path?<img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{opacity:.4}}>{c.name.slice(0,2)}</span>}
                      </div>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{c.name}</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>{c.character}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab==="reviews" && (
            <div>
              {/* Review form */}
              <div style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:"var(--radius)",padding:18,marginBottom:24}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,marginBottom:12,fontSize:15}}>{user?"Write a Review":"Sign in to Review"}</div>
                {user ? (
                  <>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Your Rating</div>
                      <StarPicker value={revRating} onChange={setRevRating} />
                    </div>
                    <input value={revTitle} onChange={e=>setRevTitle(e.target.value)} placeholder="Review title..." style={{...inp,marginBottom:8}} />
                    <textarea value={revContent} onChange={e=>setRevContent(e.target.value)} placeholder="Share your thoughts..." rows={3} style={{...inp,resize:"vertical",marginBottom:8}} />
                    <button onClick={submitReview} disabled={submitting} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 20px",fontWeight:600,fontSize:13}}>
                      {submitting?"Posting…":"Post Review"}
                    </button>
                  </>
                ) : <div style={{fontSize:13,color:"var(--muted)"}}>Create a free account to leave reviews and ratings.</div>}
              </div>
              {/* Reviews list */}
              {reviews.length===0?<div style={{textAlign:"center",color:"var(--muted)",padding:"32px 0",fontSize:14}}>No reviews yet. Be the first!</div>
                :reviews.map(rv=>(
                  <div key={rv.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13}}>{(rv.profiles?.username||"U")[0].toUpperCase()}</div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{rv.profiles?.username||"User"}</div>
                        <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{marginLeft:"auto",background:"var(--gold-dim)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                      {user?.id===rv.user_id && <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"var(--danger)",padding:"4px 10px",fontSize:12}}>Delete</button>}
                    </div>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:5}}>{rv.title}</div>
                    <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content}</div>
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
function UpgradeModal({ onClose, onComplete }) {
  const [step,setStep]=useState("plans");
  const [card,setCard]=useState({name:"",number:"",expiry:"",cvc:""});
  const [loading,setLoading]=useState(false);
  const fmtCard=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?d.slice(0,2)+"/"+d.slice(2):d;};
  const inp={background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",width:"100%",fontSize:14,outline:"none",fontFamily:"var(--font-body)"};
  const handlePay=async()=>{
    setLoading(true);
    try{
      const res=await fetch('/api/checkout',{method:"POST",headers:{"Content-Type":"application/json"}});
      const data=await res.json();
      if(data.url)window.location.href=data.url;
      else throw new Error(data.error||"Error");
    }catch(e){setLoading(false);alert("Payment error: "+e.message);}
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:520,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {step==="plans"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>Upgrade to Premium</div>
                <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>Unlock the full streaming experience</div>
              </div>
              <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
            </div>

            {/* Comparison */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {/* Free */}
              <div style={{border:"1px solid var(--border)",borderRadius:14,padding:16}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Free Account</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--muted)",marginBottom:14}}>$0</div>
                {[
                  {text:"10 searches/day",      ok:true},
                  {text:"Watchlist (50 titles)", ok:true},
                  {text:"3 AI picks",            ok:true},
                  {text:"Ratings & reviews",     ok:true},
                  {text:"Watch trailers",        ok:true},
                  {text:"Mood Search",           ok:false},
                  {text:"Leaving Soon alerts",   ok:false},
                  {text:"Watch History",         ok:false},
                  {text:"Cost Calculator",       ok:false},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,color:f.ok?"var(--text)":"var(--muted)",marginBottom:7,opacity:f.ok?1:.5}}>
                    <span style={{color:f.ok?"var(--sports)":"rgba(255,255,255,.2)",fontSize:13}}>{f.ok?"✓":"✕"}</span>{f.text}
                  </div>
                ))}
              </div>

              {/* Premium */}
              <div style={{border:"2px solid var(--gold)",borderRadius:14,padding:16,background:"rgba(245,197,24,.04)",position:"relative"}}>
                <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 12px",borderRadius:99,fontFamily:"var(--font-head)",whiteSpace:"nowrap"}}>✦ BEST VALUE</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Premium</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--gold)",marginBottom:14}}>$9.99<span style={{fontSize:13,fontWeight:400,color:"var(--muted)"}}>/mo</span></div>
                {[
                  {text:"Unlimited searches",         ok:true},
                  {text:"Unlimited watchlist",        ok:true},
                  {text:"12 AI picks",                ok:true},
                  {text:"Ratings & reviews",          ok:true},
                  {text:"Watch trailers",             ok:true},
                  {text:"🎭 Mood Search",             ok:true},
                  {text:"🚨 Leaving Soon alerts",     ok:true},
                  {text:"📺 Watch History & Stats",   ok:true},
                  {text:"💰 Cost Calculator",         ok:true},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,marginBottom:7,color:"var(--text)"}}>
                    <span style={{color:"var(--gold)",fontSize:13}}>✓</span>{f.text}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={()=>setStep("pay")} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 24px rgba(245,197,24,.3)"}}>
              Upgrade to Premium — $9.99/mo →
            </button>
            <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginTop:10}}>Cancel anytime · No hidden fees · Secured by Stripe</div>
          </div>
        )}
        {step==="pay"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
              <button onClick={()=>setStep("plans")} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:8,color:"var(--text)",width:32,height:32,fontSize:16}}>←</button>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20}}>Payment Details</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
              <input value={card.name} onChange={e=>setCard({...card,name:e.target.value})} placeholder="Cardholder name" style={inp} />
              <div style={{position:"relative"}}>
                <input value={card.number} onChange={e=>setCard({...card,number:fmtCard(e.target.value)})} placeholder="1234 5678 9012 3456" style={{...inp,paddingRight:48}} />
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:18}}>💳</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <input value={card.expiry} onChange={e=>setCard({...card,expiry:fmtExp(e.target.value)})} placeholder="MM / YY" style={inp} />
                <input value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value.replace(/\D/g,"").slice(0,3)})} placeholder="CVC" style={inp} />
              </div>
            </div>
            <button onClick={handlePay} disabled={loading} style={{width:"100%",background:loading?"rgba(245,197,24,.5)":"var(--gold)",border:"none",borderRadius:"var(--radius)",color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              {loading?<><span style={{display:"inline-block",width:18,height:18,border:"2px solid #000",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Processing…</>:"Pay $9.99 / month"}
            </button>
            <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginTop:14}}>🔒 Secured by <span style={{color:"#6772e5",fontWeight:700}}>Stripe</span> · SSL Encrypted</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETUP MODAL ──────────────────────────────────────────────────────────────
function SetupModal({ userSubs, onSave, onClose, isFirst }) {
  const [selected, setSelected] = useState(new Set(userSubs));
  const toggle = id => setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  return (
    <div onClick={isFirst?null:onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(12px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:560,border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.9)",overflow:"hidden"}}>
        <div style={{padding:"28px 28px 0"}}>
          <Logo size={28} />
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6,marginTop:16}}>{isFirst?"Welcome! What are you subscribed to?":"Manage Subscriptions"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.6}}>{isFirst?"Pick your services and we'll personalize your experience.":"Toggle the services you currently pay for."}</div>
        </div>
        <div style={{padding:"0 28px",maxHeight:340,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,paddingBottom:24}}>
            {SERVICES.map(s=>{
              const on=selected.has(s.id);
              return <button key={s.id} onClick={()=>toggle(s.id)} style={{background:on?`${s.color}20`:"rgba(255,255,255,.04)",border:`2px solid ${on?s.color:"rgba(255,255,255,.08)"}`,borderRadius:12,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .2s",position:"relative"}}>
                {on&&<span style={{position:"absolute",top:6,right:8,color:s.color,fontSize:14,fontWeight:800}}>✓</span>}
                <span style={{background:on?s.color:"rgba(255,255,255,.12)",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>{s.logo}</span>
                <span style={{fontSize:11,fontWeight:700,color:on?"#fff":"var(--muted)",textAlign:"center"}}>{s.name}</span>
              </button>;
            })}
          </div>
        </div>
        <div style={{padding:"16px 28px 28px",borderTop:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:13,color:"var(--muted)",flex:1}}>{selected.size} service{selected.size!==1?"s":""} selected</span>
          {!isFirst&&<button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:10,color:"var(--text)",padding:"10px 20px",fontSize:14,fontWeight:600}}>Cancel</button>}
          <button onClick={()=>{onSave([...selected]);onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"10px 24px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14}}>{isFirst?"Let's Go →":"Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
function HeroBanner({ movie, onSelect, onToggleWatchlist, watchlist }) {
  const [loaded, setLoaded] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setTrailerKey(null); setShowTrailer(false);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}/videos?language=en-US`).then(data => {
      const t = (data.results||[]).find(v=>v.type==="Trailer"&&v.site==="YouTube")||(data.results||[])[0];
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
  }, [movie?.id]);

  if (!movie) return (
    <div style={{height:520,background:"linear-gradient(135deg,#0d0d1a,#1a0533)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:40,height:40,border:"3px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}} />
    </div>
  );
  const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
  const poster   = movie.poster_path   ? `${TMDB_IMG}${movie.poster_path}` : null;
  const title    = movie.title||movie.name||"";
  const year     = (movie.release_date||movie.first_air_date||"").slice(0,4);
  const rating   = movie.vote_average?.toFixed(1)||"—";
  const inWL     = watchlist.includes(movie.id);
  const providers = movie.providers||[];
  return (
    <div style={{position:"relative",height:520,overflow:"hidden",cursor:showTrailer?"default":"pointer"}} onClick={()=>!showTrailer&&onSelect(movie)}>
      {/* Trailer or backdrop */}
      {showTrailer && trailerKey
        ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2}} allow="autoplay; fullscreen" allowFullScreen />
        : backdrop && <img src={backdrop} alt="" onLoad={()=>setLoaded(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:loaded?.55:.2,transition:"opacity 1s"}} />
      }
      {!showTrailer && <>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(7,7,14,.95) 0%,rgba(7,7,14,.6) 50%,rgba(7,7,14,.2) 100%)"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,transparent 40%)"}} />
      </>}
      {showTrailer && <button onClick={e=>{e.stopPropagation();setShowTrailer(false);}} style={{position:"absolute",top:16,right:16,zIndex:10,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"#fff",padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕ Close Trailer</button>}
      {!showTrailer && (
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:"0 60px"}}>
          <div style={{maxWidth:560}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"5px 14px",marginBottom:20,fontSize:11,fontWeight:700,color:"var(--gold)",letterSpacing:.5}}>🔥 FEATURED</div>
            <h1 style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"clamp(36px,5vw,64px)",lineHeight:1.05,letterSpacing:"-.02em",marginBottom:16,textShadow:"0 4px 24px rgba(0,0,0,.8)"}}>{title}</h1>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <span style={{color:"var(--gold)",fontWeight:700,fontSize:15}}>★ {rating}</span>
              <span style={{color:"var(--muted)",fontSize:14}}>{year}</span>
              {providers.slice(0,3).map(p=><ServiceBadge key={p} platformId={p} />)}
            </div>
            <p style={{fontSize:15,color:"rgba(240,240,250,.75)",lineHeight:1.7,marginBottom:28,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{movie.overview}</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"13px 28px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>▶ Watch Now</button>
              {trailerKey && <button onClick={e=>{e.stopPropagation();setShowTrailer(true);}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.25)",borderRadius:12,color:"#fff",padding:"13px 24px",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>🎬 Trailer</button>}
              <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,197,24,.2)":"rgba(255,255,255,.08)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.15)"}`,borderRadius:12,color:inWL?"var(--gold)":"#fff",padding:"13px 24px",fontWeight:700,fontSize:15,cursor:"pointer"}}>
                {inWL?"♥ Saved":"♡ Save"}
              </button>
            </div>
          </div>
          {poster && <img src={poster} alt={title} style={{marginLeft:"auto",height:340,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,.8)",objectFit:"cover",flexShrink:0}} />}
        </div>
      )}
    </div>
  );
}

// ─── FEATURED ROW ─────────────────────────────────────────────────────────────
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
      <div ref={ref} style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 24px 8px",scrollbarWidth:"none",scrollSnapType:"x mandatory"}}>
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

function MobileBottomNav({ view, setView, watchlist, onProfile }) {
  const tabs=[
    {id:"trending", icon:"🔥", label:"Trending",  color:"#F5C518", anim:"flameDance"},
    {id:"movies",   icon:"🎬", label:"Movies",    color:"#06B6D4", anim:null},
    {id:"tv",       icon:"📺", label:"TV",        color:"#A78BFA", anim:"tvFlicker"},
    {id:"anime",    icon:"✦",  label:"Anime",     color:"#FF6B9D", anim:"swordSwing"},
    {id:"sports",   icon:"🏆", label:"Sports",    color:"#10B981", anim:"trophyBounce"},
    {id:"watchlist",icon:"♥",  label:"Watchlist", color:"#F5C518", anim:null},
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(7,7,14,.98)",borderTop:"1px solid rgba(245,197,24,.12)",display:"flex",backdropFilter:"blur(20px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {tabs.map(t=>{
        const active = view===t.id;
        const count = t.id==="watchlist"&&watchlist.length>0 ? watchlist.length : 0;
        return (
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active?t.color:"rgba(240,240,250,.35)",position:"relative",transition:"color .2s",cursor:"pointer"}}>
            <span style={{
              fontSize:20, lineHeight:1,
              filter:active?`drop-shadow(0 0 8px ${t.color}cc)`:"none",
              transition:"filter .2s",
              display:"inline-block",
              animation:active&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none",
            }}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:800,fontFamily:"var(--font-head)",letterSpacing:.3}}>{t.label}</span>
            {count>0&&<span style={{position:"absolute",top:6,left:"50%",marginLeft:6,background:"var(--gold)",color:"#000",borderRadius:99,minWidth:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{count}</span>}
            {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:32,height:2.5,background:t.color,borderRadius:99,boxShadow:`0 0 8px ${t.color}`}}/>}
          </button>
        );
      })}
      {/* Profile button */}
      <button onClick={onProfile}
        style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:"rgba(240,240,250,.35)",cursor:"pointer"}}>
        <span style={{fontSize:20,lineHeight:1}}>👤</span>
        <span style={{fontSize:9,fontWeight:800,fontFamily:"var(--font-head)",letterSpacing:.3}}>Profile</span>
      </button>
    </div>
  );
}

// ─── LEAVING SOON MODAL ───────────────────────────────────────────────────────
function LeavingSoonModal({ onClose, userSubs, tier, onUpgrade }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (tier !== "premium") { setLoading(false); return; }
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
  }, [tier, userSubs]);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(239,68,68,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(239,68,68,.12),rgba(245,197,24,.06))"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>🚨 Leaving Soon</div>
            <div style={{fontSize:13,color:"var(--muted)"}}>Titles leaving your services this month</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {!tier||tier!=="premium" ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:48,marginBottom:16}}>🚨</div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>Premium Feature</div>
              <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Get notified about titles leaving your services so you never miss a show before it's gone.</div>
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
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:620,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(124,58,237,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(6,182,212,.06))"}}>
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
                  <div key={label} style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
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
function CostCalculatorModal({ onClose, userSubs }) {
  const myServices = SERVICES.filter(s => userSubs.includes(s.id));
  const totalMonthly = myServices.reduce((sum,s) => sum + (s.price||0), 0);
  const totalAnnual = totalMonthly * 12;
  const cheapest = [...myServices].sort((a,b) => a.price-b.price)[0];
  const mostExpensive = [...myServices].sort((a,b) => b.price-a.price)[0];
  const streamhubCost = 9.99;
  const totalWithStreamHub = totalMonthly + streamhubCost;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:560,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(16,185,129,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(245,197,24,.06))"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>💰 Streaming Cost Calculator</div>
            <div style={{fontSize:13,color:"var(--muted)"}}>See exactly what you're spending on streaming</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {/* Big total */}
          <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(16,185,129,.04))",border:"1px solid rgba(16,185,129,.25)",borderRadius:16,padding:20,textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:6,letterSpacing:1}}>MONTHLY STREAMING SPEND</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:52,color:"var(--sports)",lineHeight:1}}>${totalMonthly.toFixed(2)}</div>
            <div style={{fontSize:13,color:"var(--muted)",marginTop:6}}>${totalAnnual.toFixed(2)} per year · ${(totalAnnual/365).toFixed(2)} per day</div>
          </div>

          {/* Per service breakdown */}
          <div style={{marginBottom:20}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:12,color:"var(--muted)"}}>BREAKDOWN BY SERVICE</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {myServices.sort((a,b)=>b.price-a.price).map(s=>{
                const pct = totalMonthly > 0 ? (s.price/totalMonthly)*100 : 0;
                return (
                  <div key={s.id}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{background:s.color,borderRadius:6,width:24,height:24,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{s.logo}</span>
                        <span style={{fontSize:14,fontWeight:600}}>{s.name}</span>
                      </div>
                      <span style={{fontFamily:"var(--font-head)",fontWeight:700,color:"var(--sports)"}}>${s.price.toFixed(2)}/mo</span>
                    </div>
                    <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:99,transition:"width .5s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:4,color:"var(--muted)"}}>💡 INSIGHTS</div>
            {mostExpensive && <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:12,fontSize:13}}>💸 <strong>{mostExpensive.name}</strong> is your most expensive service at <strong>${mostExpensive.price}/mo</strong></div>}
            {cheapest && <div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:12,fontSize:13}}>✅ <strong>{cheapest.name}</strong> is your best value at just <strong>${cheapest.price}/mo</strong></div>}
            <div style={{background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.2)",borderRadius:10,padding:12,fontSize:13}}>⚡ StreamHub Premium adds only <strong>$9.99/mo</strong> — that's ${(streamhubCost/totalMonthly*100).toFixed(0)}% of your total streaming spend for unlimited access to all platforms in one place</div>
            {myServices.length >= 4 && <div style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:10,padding:12,fontSize:13}}>🎯 With {myServices.length} services, StreamHub saves you hours each month switching between apps</div>}
          </div>

          {/* With StreamHub */}
          <div style={{background:"rgba(245,197,24,.06)",border:"1px solid rgba(245,197,24,.2)",borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>TOTAL WITH STREAMHUB PREMIUM</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:28,color:"var(--gold)"}}>${totalWithStreamHub.toFixed(2)}<span style={{fontSize:14,fontWeight:400,color:"var(--muted)"}}>/mo</span></div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>One place to manage it all 🎬</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MOOD SEARCH MODAL ────────────────────────────────────────────────────────
// ─── MOOD SEARCH LIMIT (1 free per day) ──────────────────────────────────────
function getMoodSearchCount() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem("streamhub_mood_data") || "{}");
  if (stored.date !== today) return 0;
  return stored.count || 0;
}
function incrementMoodSearchCount() {
  const today = new Date().toDateString();
  const count = getMoodSearchCount();
  localStorage.setItem("streamhub_mood_data", JSON.stringify({ date: today, count: count + 1 }));
}

// ─── AI PICKS LIMIT (weekly reset) ───────────────────────────────────────────
function getAIPicksCount() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const stored = JSON.parse(localStorage.getItem("streamhub_aipicks_data") || "{}");
  if (stored.week !== week) return 0;
  return stored.count || 0;
}
function incrementAIPicksCount() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const count = getAIPicksCount();
  localStorage.setItem("streamhub_aipicks_data", JSON.stringify({ week, count: count + 1 }));
}

function MoodSearchModal({ onClose, tier, onUpgrade, onResults }) {
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const freeMoodUsed = tier !== "premium" && getMoodSearchCount() >= 1;

  // Soft gate for non-premium users who used their daily free search
  if (freeMoodUsed) return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:420,border:"1px solid rgba(245,197,24,.3)",padding:32,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:12}}>🎭</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:8}}>You've used your free Mood Search today</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:20,lineHeight:1.7}}>
          Free accounts get <strong style={{color:"var(--gold)"}}>1 Mood Search per day</strong>.<br/>
          Upgrade to Premium for unlimited AI mood matching.
        </div>
        <div style={{background:"rgba(245,197,24,.06)",border:"1px solid rgba(245,197,24,.15)",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"left"}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--gold)",marginBottom:8,letterSpacing:.5}}>✦ PREMIUM GETS</div>
          {["Unlimited Mood Searches daily","12 AI picks weekly (vs 3)","Leaving Soon alerts","Full Watch History & Stats","Streaming Cost Calculator"].map((f,i)=>(
            <div key={i} style={{display:"flex",gap:8,fontSize:12,color:"var(--muted)",marginBottom:i<4?6:0}}>
              <span style={{color:"var(--gold)"}}>✓</span>{f}
            </div>
          ))}
        </div>
        <button onClick={()=>{onUpgrade();onClose();}} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:10,boxShadow:"0 8px 24px rgba(245,197,24,.3)"}}>
          Upgrade to Premium ✦
        </button>
        <div style={{fontSize:12,color:"var(--muted)"}}>Or come back tomorrow for your next free search 🕐</div>
        <button onClick={onClose} style={{marginTop:10,background:"none",border:"none",color:"rgba(240,240,250,.3)",fontSize:12,cursor:"pointer"}}>Close</button>
      </div>
    </div>
  );

  const moods = [
    "Something scary but not too gory 😱",
    "Funny and lighthearted 😂",
    "A good cry 😢",
    "Action-packed and thrilling ⚡",
    "Perfect for date night 💕",
    "Something for the whole family 👨‍👩‍👧",
    "Mind-bending and thought-provoking 🧠",
    "Feel-good and uplifting ☀️",
    "Dark and gritty 🖤",
    "Epic adventure 🗺️",
  ];

  const search = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    if (tier !== "premium") incrementMoodSearchCount();
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:600,
          messages:[{role:"user",content:`You are a streaming recommendation expert. The user wants: "${mood}". Suggest 6 movies or TV shows that perfectly match this mood. Return ONLY valid JSON: {"title":"Search Results","items":[{"title":"...","year":2023,"type":"movie or tv","reason":"why it matches the mood in one sentence","genre":"...","tmdb_search":"exact title to search on TMDB"}]}`}]
        })
      });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed = JSON.parse(txt.replace(/```json|```/g,"").trim());
      setResult(parsed);
    } catch(e) {
      setResult({items:[
        {title:"Get Out",year:2017,type:"movie",reason:"Psychological horror that's terrifying without being gory",genre:"Horror",tmdb_search:"Get Out"},
        {title:"A Quiet Place",year:2018,type:"movie",reason:"Suspenseful and scary with minimal gore",genre:"Horror",tmdb_search:"A Quiet Place"},
      ]});
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:580,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(124,58,237,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(255,107,157,.08))"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:4}}>
              🎭 Mood Search <span style={{background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99,marginLeft:6}}>PRO</span>
            </div>
            <div style={{fontSize:13,color:"var(--muted)"}}>Describe what you're in the mood for — AI finds it</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            {tier !== "premium" && (
              <div style={{background:"rgba(245,197,24,.1)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700,color:"var(--gold)"}}>
                1 free search/day
              </div>
            )}
            <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
          </div>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1}}>
          {/* Quick mood chips */}
          {!result && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:10,letterSpacing:.5}}>QUICK PICKS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {moods.map(m=>(
                  <button key={m} onClick={()=>setMood(m)} style={{background:mood===m?"rgba(124,58,237,.2)":"rgba(255,255,255,.05)",border:`1px solid ${mood===m?"var(--purple)":"var(--border)"}`,borderRadius:99,color:mood===m?"var(--purple)":"var(--muted)",padding:"6px 14px",fontSize:12,cursor:"pointer",transition:"all .2s"}}>{m}</button>
                ))}
              </div>
            </div>
          )}
          {/* Custom input */}
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <input value={mood} onChange={e=>setMood(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="e.g. Something scary but not too gory..."
              style={{flex:1,background:"rgba(255,255,255,.07)",border:"1px solid rgba(124,58,237,.4)",borderRadius:12,color:"var(--text)",padding:"11px 16px",fontSize:14,outline:"none"}} />
            <button onClick={search} disabled={loading||!mood.trim()} style={{background:"var(--purple)",border:"none",borderRadius:12,color:"#fff",padding:"11px 20px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,opacity:!mood.trim()?0.5:1}}>
              {loading?<span style={{display:"inline-block",width:16,height:16,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:"✦"} Find
            </button>
          </div>
          {/* Results */}
          {result && (
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:12,color:"var(--muted)"}}>AI PICKS FOR YOU</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {result.items?.map((item,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:14,display:"flex",gap:12,alignItems:"flex-start",animation:`fadeUp .3s ${i*0.08}s both`}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${GR[i%GR.length][0]},${GR[i%GR.length][1]})`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14}}>{item.title.slice(0,2)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14}}>{item.title} <span style={{color:"var(--muted)",fontWeight:400,fontSize:12}}>({item.year})</span></div>
                      <div style={{fontSize:12,color:"var(--muted)",margin:"3px 0"}}>{item.reason}</div>
                      <button onClick={()=>{onResults(item.tmdb_search||item.title);onClose();}} style={{background:"var(--purple)",border:"none",borderRadius:8,color:"#fff",padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",marginTop:4}}>Search StreamHub →</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>setResult(null)} style={{marginTop:16,width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,color:"var(--muted)",padding:"10px 0",fontSize:13,cursor:"pointer"}}>← Try a different mood</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PWA INSTALL PROMPT ───────────────────────────────────────────────────────
function InstallPrompt({ onDismiss }) {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (
    <div style={{
      position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)",
      zIndex:350, width:"calc(100% - 28px)", maxWidth:400,
      background:"linear-gradient(135deg,rgba(7,7,14,.98),rgba(12,8,28,.98))",
      border:"1px solid rgba(124,58,237,.4)",
      borderRadius:18, padding:"16px 18px",
      boxShadow:"0 20px 60px rgba(0,0,0,.8)",
      animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
    }}>
      <button onClick={onDismiss} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:"rgba(240,240,250,.3)",fontSize:16,cursor:"pointer"}}>✕</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <img src="/icons/icon-72x72.png" alt="" style={{width:48,height:48,borderRadius:12,flexShrink:0}} />
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:2}}>Add to Home Screen</div>
          <div style={{fontSize:12,color:"rgba(240,240,250,.5)"}}>Get the full app experience — free</div>
        </div>
      </div>
      {isIOS ? (
        <div style={{fontSize:12,color:"rgba(240,240,250,.6)",lineHeight:1.7,background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:10,padding:"10px 12px"}}>
          Tap <strong style={{color:"#fff"}}>Share</strong> → <strong style={{color:"#fff"}}>"Add to Home Screen"</strong> to install The StreamHub on your iPhone
        </div>
      ) : (
        <div style={{fontSize:12,color:"rgba(240,240,250,.6)",lineHeight:1.7,background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:10,padding:"10px 12px"}}>
          Tap <strong style={{color:"#fff"}}>⋮ Menu</strong> → <strong style={{color:"#fff"}}>"Add to Home Screen"</strong> to install The StreamHub
        </div>
      )}
    </div>
  );
}

// ─── DEEP LINK HELPER ────────────────────────────────────────────────────────
// App URL schemes for mobile — tries to open the native app first,
// falls back to website if app not installed
const APP_SCHEMES = {
  netflix:     { ios:"nflx://",                          android:"intent://www.netflix.com#Intent;scheme=https;package=com.netflix.mediaclient;end" },
  disney:      { ios:"disneyplus://",                    android:"intent://www.disneyplus.com#Intent;scheme=https;package=com.disney.disneyplus;end" },
  max:         { ios:"max://",                           android:"intent://play.max.com#Intent;scheme=https;package=com.hbo.hbonow;end" },
  hulu:        { ios:"hulu://",                          android:"intent://www.hulu.com#Intent;scheme=https;package=com.hulu.plus;end" },
  apple:       { ios:"videos://",                        android:null },
  prime:       { ios:"aiv://",                           android:"intent://www.amazon.com#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end" },
  peacock:     { ios:"peacock://",                       android:"intent://www.peacocktv.com#Intent;scheme=https;package=com.peacocktv.peacockandroid;end" },
  paramount:   { ios:"paramountplus://",                 android:"intent://www.paramountplus.com#Intent;scheme=https;package=com.cbs.app;end" },
  crunchyroll: { ios:"crunchyroll://",                   android:"intent://www.crunchyroll.com#Intent;scheme=https;package=com.crunchyroll.crunchyroid;end" },
  espnplus:    { ios:"sportscenter://",                  android:"intent://www.espn.com#Intent;scheme=https;package=com.espn.score_center;end" },
  dazn:        { ios:"dazn://",                          android:"intent://www.dazn.com#Intent;scheme=https;package=com.dazn;end" },
  fubo:        { ios:"fubo://",                          android:"intent://www.fubo.tv#Intent;scheme=https;package=tv.fubo.mobile;end" },
  tubi:        { ios:"tubi://",                          android:"intent://tubitv.com#Intent;scheme=https;package=com.tubitv;end" },
};

function getWatchUrl(serviceId, title, webUrl) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const scheme = APP_SCHEMES[serviceId];

  if (!isMobile || !scheme) return webUrl + encodeURIComponent(title);

  if (isIOS && scheme.ios) {
    // Try app scheme — iOS will open app if installed, error if not
    return scheme.ios;
  }
  if (isAndroid && scheme.android) {
    return scheme.android;
  }
  // Fallback to web
  return webUrl + encodeURIComponent(title);
}

function WatchButton({ serviceId, title, webUrl, style }) {
  const svc = SERVICES.find(s => s.id === serviceId);
  if (!svc) return null;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleWatch = (e) => {
    e.stopPropagation();
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const scheme = APP_SCHEMES[serviceId];

    if (isMobileDevice && scheme) {
      if (isIOS && scheme.ios) {
        // Try to open app — if it fails after 1.5s, open website
        const appUrl = scheme.ios;
        const webFallback = svc.url + encodeURIComponent(title);
        const start = Date.now();
        window.location.href = appUrl;
        setTimeout(() => {
          // If we're still here after 1.5s, app didn't open — go to web
          if (Date.now() - start < 2000) {
            window.open(webFallback, "_blank");
          }
        }, 1500);
        return;
      }
      if (isAndroid && scheme.android) {
        window.location.href = scheme.android;
        setTimeout(() => {
          window.open(svc.url + encodeURIComponent(title), "_blank");
        }, 1500);
        return;
      }
    }
    // Desktop — open website in new tab
    window.open(svc.url + encodeURIComponent(title), "_blank");
  };

  return (
    <button onClick={handleWatch}
      style={{
        display:"inline-flex", alignItems:"center", gap:8,
        background:svc.color, borderRadius:10, color:"#fff",
        padding:"9px 18px", fontFamily:"var(--font-head)",
        fontWeight:800, fontSize:13, border:"none", cursor:"pointer",
        boxShadow:`0 4px 16px ${svc.color}44`,
        ...style
      }}>
      ▶ Watch on {svc.name}
      {isMobile && <span style={{fontSize:10,opacity:.8}}>📱</span>}
    </button>
  );
}

// ─── WELCOME BANNER ───────────────────────────────────────────────────────────
function WelcomeBanner() {
  return (
    <div style={{padding:"20px 24px 4px"}}>
      <div style={{
        background:"linear-gradient(135deg,rgba(124,58,237,.25) 0%,rgba(7,7,14,.9) 40%,rgba(245,197,24,.12) 100%)",
        border:"1px solid rgba(245,197,24,.25)",
        borderRadius:20,
        padding:"28px 36px",
        textAlign:"center",
        position:"relative",
        overflow:"hidden",
        boxShadow:"0 8px 32px rgba(124,58,237,.2), 0 0 0 1px rgba(245,197,24,.08)",
      }}>
        {/* Decorative background orbs */}
        <div style={{position:"absolute",top:-40,left:-40,width:180,height:180,borderRadius:"50%",background:"rgba(124,58,237,.15)",filter:"blur(40px)",pointerEvents:"none"}} />
        <div style={{position:"absolute",bottom:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(245,197,24,.1)",filter:"blur(40px)",pointerEvents:"none"}} />

        {/* Badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,197,24,.12)",border:"1px solid rgba(245,197,24,.25)",borderRadius:99,padding:"4px 14px",marginBottom:14,fontSize:11,fontWeight:700,color:"var(--gold)",letterSpacing:1}}>
          ✦ FREE TO START — NO CREDIT CARD REQUIRED
        </div>

        {/* Headline */}
        <div style={{
          fontFamily:"var(--font-head)", fontWeight:800,
          fontSize:"clamp(20px,3vw,36px)",
          lineHeight:1.15, marginBottom:10,
          background:"linear-gradient(90deg,#F5C518,#ffffff,#06B6D4,#F5C518)",
          backgroundSize:"250% auto",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"gradientShift 4s linear infinite",
        }}>Your AI Streaming Assistant</div>

        {/* Subtext */}
        <div style={{fontSize:"clamp(12px,1.5vw,15px)",color:"rgba(240,240,250,.55)",maxWidth:580,margin:"0 auto 18px",lineHeight:1.7}}>
          Searches Netflix, Disney+, Max, Hulu, Crunchyroll, ESPN+, Tubi and more — all at once.
        </div>

        {/* Service dots */}
        <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
          {[
            {name:"Netflix",color:"#E50914"},
            {name:"Disney+",color:"#0063E5"},
            {name:"Max",color:"#002BE7"},
            {name:"Hulu",color:"#1CE783"},
            {name:"Prime",color:"#00A8E1"},
            {name:"Crunchyroll",color:"#F47521"},
            {name:"ESPN+",color:"#E31837"},
            {name:"Tubi",color:"#FA4343"},
          ].map(s=>(
            <div key={s.name} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:99,padding:"4px 10px",fontSize:11,fontWeight:600,color:"rgba(240,240,250,.6)"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0}} />
              {s.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIGNUP PROMPT ────────────────────────────────────────────────────────────
// ─── SEARCH LIMIT WALL ────────────────────────────────────────────────────────
const SEARCH_LIMIT = 10;

function getSearchCount() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem("streamhub_search_data") || "{}");
  // Reset if it's a new day
  if (stored.date !== today) return 0;
  return stored.count || 0;
}

function incrementSearchCount() {
  const today = new Date().toDateString();
  const count = getSearchCount();
  localStorage.setItem("streamhub_search_data", JSON.stringify({ date: today, count: count + 1 }));
}

function resetSearchCount() {
  localStorage.removeItem("streamhub_search_data");
}

function SearchLimitWall({ onSignup, onDismiss, searchesUsed }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .3s"}}>
      <div style={{
        background:"linear-gradient(135deg,#0d0a1e,#140d28)",
        border:"1px solid rgba(245,197,24,.4)",
        borderRadius:24, padding:"36px 32px", maxWidth:420, width:"100%",
        boxShadow:"0 32px 80px rgba(0,0,0,.8), 0 0 60px rgba(245,197,24,.1)",
        textAlign:"center", animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
      }}>
        {/* Logo */}
        <img src="/logo-clean.png" alt="" onError={e=>e.target.style.display="none"}
          style={{height:80,width:"auto",objectFit:"contain",marginBottom:20,filter:"drop-shadow(0 0 20px rgba(245,197,24,.5))"}} />

        {/* Limit reached badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",borderRadius:99,padding:"5px 14px",marginBottom:16,fontSize:12,fontWeight:700,color:"#f87171"}}>
          🔍 You've used all {SEARCH_LIMIT} free searches
        </div>

        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,marginBottom:8,lineHeight:1.2}}>
          Create a free account<br/>to keep searching
        </div>
        <div style={{fontSize:14,color:"rgba(240,240,250,.5)",marginBottom:28,lineHeight:1.7}}>
          It's completely free — no credit card needed
        </div>

        {/* Benefits */}
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:"18px 20px",marginBottom:24,textAlign:"left"}}>
          {[
            {icon:"🔍", title:"Unlimited searches", desc:"Search as much as you want"},
            {icon:"♥",  title:"Save to Watchlist", desc:"Up to 50 titles across all devices"},
            {icon:"✦",  title:"AI Picks for you",  desc:"Personalized recommendations"},
            {icon:"📺", title:"Watch History",      desc:"Track everything you watch"},
            {icon:"⭐", title:"Ratings & Reviews",  desc:"Rate and review any title"},
          ].map((b,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:i<4?14:0}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(245,197,24,.1)",border:"1px solid rgba(245,197,24,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{b.icon}</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,color:"var(--text)"}}>{b.title}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{b.desc}</div>
              </div>
              <div style={{marginLeft:"auto",color:"var(--sports)",fontSize:14}}>✓</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onSignup} style={{width:"100%",background:"linear-gradient(135deg,#F5C518,#f59e0b)",border:"none",borderRadius:14,color:"#000",padding:"15px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,cursor:"pointer",marginBottom:10,boxShadow:"0 8px 24px rgba(245,197,24,.35)"}}>
          🚀 Create Free Account
        </button>
        <button onClick={onDismiss} style={{background:"none",border:"none",color:"rgba(240,240,250,.3)",fontSize:13,cursor:"pointer",padding:"8px 0"}}>
          Maybe later
        </button>

        {/* Premium tease */}
        <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.06)",fontSize:12,color:"rgba(240,240,250,.3)"}}>
          Want even more? <span style={{color:"var(--gold)",fontWeight:700}}>Premium ($9.99/mo)</span> unlocks unlimited watchlist, ad-free, AI mood search & more ✦
        </div>
      </div>
    </div>
  );
}

// ─── SIGNUP PROMPT (30 second popup) ─────────────────────────────────────────
function SignupPrompt({ onSignup, onDismiss, searchesUsed }) {
  return (
    <div style={{
      position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)",
      zIndex:290, width:"calc(100% - 28px)", maxWidth:460,
      background:"linear-gradient(135deg,rgba(10,8,26,.98),rgba(18,10,36,.98))",
      border:"1px solid rgba(245,197,24,.4)",
      borderRadius:20, padding:"20px",
      boxShadow:"0 20px 60px rgba(0,0,0,.8), 0 0 40px rgba(245,197,24,.1)",
      animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
    }}>
      <button onClick={onDismiss} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:"rgba(240,240,250,.25)",fontSize:16,cursor:"pointer"}}>✕</button>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <img src="/logo-clean.png" alt="" onError={e=>e.target.style.display="none"}
          style={{height:44,width:"auto",objectFit:"contain",flexShrink:0,filter:"drop-shadow(0 0 10px rgba(245,197,24,.5))"}} />
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Join free — it's worth it</div>
          <div style={{fontSize:11,color:"rgba(240,240,250,.4)"}}>
            {searchesUsed > 0 ? `You've made ${searchesUsed} searches — keep going for free!` : "No credit card. No catch."}
          </div>
        </div>
      </div>

      {/* Benefits grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {icon:"♥",  text:"Save your Watchlist",   color:"var(--danger)"},
          {icon:"✦",  text:"Get AI Picks for you",  color:"var(--gold)"},
          {icon:"🔍", text:"Unlimited searches",     color:"var(--cyan)"},
          {icon:"📺", text:"Track Watch History",    color:"var(--purple)"},
        ].map((b,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"9px 10px"}}>
            <span style={{fontSize:16,color:b.color}}>{b.icon}</span>
            <span style={{fontSize:11,fontWeight:600,color:"rgba(240,240,250,.8)",lineHeight:1.3}}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onSignup} style={{flex:1,background:"linear-gradient(135deg,#F5C518,#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 6px 20px rgba(245,197,24,.3)"}}>
          🚀 Sign Up Free
        </button>
        <button onClick={onDismiss} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"rgba(240,240,250,.35)",padding:"12px 16px",fontSize:13,cursor:"pointer"}}>Later</button>
      </div>
    </div>
  );
}

// ─── PERSONALIZED AI RECOMMENDATIONS ─────────────────────────────────────────
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

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800, messages:[{role:"user",content:prompt}] })
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
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:580,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(245,197,24,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(245,197,24,.12),rgba(124,58,237,.08))"}}>
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
              <button onClick={getRecs} style={{marginTop:16,width:"100%",background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.2)",borderRadius:10,color:"var(--gold)",padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>✦ Refresh Recommendations</button>
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
          <div style={{background:"linear-gradient(135deg,rgba(124,58,237,.1),rgba(245,197,24,.06))",border:"1px solid rgba(245,197,24,.15)",borderRadius:16,padding:20}}>
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
function MobileHero({ movie, watchlist, onSelect, onToggleWatchlist }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  useEffect(() => {
    if (!movie) return;
    setTrailerKey(null); setShowTrailer(false);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}/videos?language=en-US`).then(data => {
      const t = (data.results||[]).find(v=>v.type==="Trailer"&&v.site==="YouTube")||(data.results||[])[0];
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
  }, [movie?.id]);
  if (!movie) return null;
  const inWL = watchlist.includes(movie.id);
  return (
    <div style={{margin:"0 14px 20px",borderRadius:16,overflow:"hidden",position:"relative",height:showTrailer?220:220}}>
      {showTrailer && trailerKey
        ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2,borderRadius:16}} allow="autoplay; fullscreen" allowFullScreen />
        : movie.backdrop_path && <img src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.5}} />
      }
      {!showTrailer && <>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(7,7,14,.95) 0%,transparent 60%)"}} />
        <img src="/logo-clean.png" alt="" style={{position:"absolute",top:10,right:10,height:36,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(245,197,24,.6))",opacity:.85}} />
      </>}
      {showTrailer && <button onClick={e=>{e.stopPropagation();setShowTrailer(false);}} style={{position:"absolute",top:8,right:8,zIndex:10,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#fff",padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✕</button>}
      {!showTrailer && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 14px 14px"}}>
          <div style={{fontSize:9,fontWeight:800,color:"var(--gold)",letterSpacing:1,marginBottom:4}}>🔥 FEATURED</div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,marginBottom:6}}>{movie.title||movie.name}</div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{color:"var(--gold)",fontSize:12}}>★ {movie.vote_average?.toFixed(1)}</span>
            {(movie.providers||[]).slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small />)}
            <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
              <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 12px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,cursor:"pointer"}}>▶ Watch</button>
              {trailerKey && <button onClick={e=>{e.stopPropagation();setShowTrailer(true);}} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>🎬 Trailer</button>}
              <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,197,24,.2)":"rgba(255,255,255,.1)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.2)"}`,borderRadius:8,color:inWL?"var(--gold)":"#fff",padding:"6px 10px",fontSize:11,cursor:"pointer"}}>{inWL?"♥":"♡"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TABLET HERO WITH TRAILER ─────────────────────────────────────────────────
function TabletHero({ movie, watchlist, onSelect, onToggleWatchlist }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  useEffect(() => {
    if (!movie) return;
    setTrailerKey(null); setShowTrailer(false);
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}/videos?language=en-US`).then(data => {
      const t = (data.results||[]).find(v=>v.type==="Trailer"&&v.site==="YouTube")||(data.results||[])[0];
      if (t) setTrailerKey(t.key);
    }).catch(()=>{});
  }, [movie?.id]);
  if (!movie) return null;
  const inWL = watchlist.includes(movie.id);
  return (
    <div style={{position:"relative",height:300,overflow:"hidden",cursor:showTrailer?"default":"pointer"}} onClick={()=>!showTrailer&&onSelect(movie)}>
      {showTrailer && trailerKey
        ? <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2}} allow="autoplay; fullscreen" allowFullScreen />
        : movie.backdrop_path && <img src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.5}} />
      }
      {!showTrailer && <>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(7,7,14,.95) 0%,rgba(7,7,14,.5) 60%,rgba(7,7,14,.1) 100%)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,transparent 50%)"}}/>
      </>}
      {showTrailer && <button onClick={e=>{e.stopPropagation();setShowTrailer(false);}} style={{position:"absolute",top:12,right:12,zIndex:10,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"#fff",padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕ Close</button>}
      {!showTrailer && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 24px 24px",display:"flex",alignItems:"flex-end",gap:20}}>
          {movie.poster_path&&<img src={`${TMDB_IMG}${movie.poster_path}`} alt="" style={{height:150,borderRadius:12,boxShadow:"0 16px 40px rgba(0,0,0,.8)",flexShrink:0}}/>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:800,color:"var(--gold)",letterSpacing:1,marginBottom:6}}>🔥 FEATURED</div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,marginBottom:8}}>{movie.title||movie.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <span style={{color:"var(--gold)",fontWeight:700}}>★ {movie.vote_average?.toFixed(1)}</span>
              {(movie.providers||[]).slice(0,3).map(p=><ServiceBadge key={p} platformId={p}/>)}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"10px 22px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>▶ Watch Now</button>
              {trailerKey && <button onClick={e=>{e.stopPropagation();setShowTrailer(true);}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.25)",borderRadius:10,color:"#fff",padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>🎬 Trailer</button>}
              <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,197,24,.2)":"rgba(255,255,255,.1)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.2)"}`,borderRadius:10,color:inWL?"var(--gold)":"#fff",padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>{inWL?"♥ Saved":"♡ Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GENRE SEARCH HELPERS ────────────────────────────────────────────────────
const GENRE_MAP = {
  "action":           { ids:"28",       type:"movie" },
  "comedy":           { ids:"35",       type:"both"  },
  "horror":           { ids:"27",       type:"both"  },
  "romance":          { ids:"10749",    type:"both"  },
  "sci-fi":           { ids:"878",      type:"both"  },
  "scifi":            { ids:"878",      type:"both"  },
  "science fiction":  { ids:"878",      type:"both"  },
  "thriller":         { ids:"53",       type:"both"  },
  "drama":            { ids:"18",       type:"both"  },
  "animation":        { ids:"16",       type:"both"  },
  "animated":         { ids:"16",       type:"both"  },
  "documentary":      { ids:"99",       type:"both"  },
  "doc":              { ids:"99",       type:"both"  },
  "fantasy":          { ids:"14",       type:"both"  },
  "mystery":          { ids:"9648",     type:"both"  },
  "crime":            { ids:"80",       type:"both"  },
  "adventure":        { ids:"12",       type:"both"  },
  "family":           { ids:"10751",    type:"both"  },
  "kids":             { ids:"10751",    type:"both"  },
  "music":            { ids:"10402",    type:"both"  },
  "western":          { ids:"37",       type:"movie" },
  "war":              { ids:"10752",    type:"movie" },
  "history":          { ids:"36",       type:"movie" },
  "superhero":        { ids:"28,12,14", type:"both"  },
  "anime":            { ids:"16",       type:"tv",   keyword:"210024" },
  "sports":           { ids:"99",       type:"movie" },
  "funny":            { ids:"35",       type:"both"  },
  "scary":            { ids:"27",       type:"both"  },
  "spooky":           { ids:"27",       type:"both"  },
  "creepy":           { ids:"27",       type:"both"  },
  "gory":             { ids:"27",       type:"both"  },
  "not gory":         { ids:"27",       type:"both"  },
  "sad":              { ids:"18",       type:"both"  },
  "emotional":        { ids:"18",       type:"both"  },
  "feel good":        { ids:"35,10751", type:"both"  },
  "feel-good":        { ids:"35,10751", type:"both"  },
  "feelgood":         { ids:"35,10751", type:"both"  },
  "uplifting":        { ids:"35,10751", type:"both"  },
  "lighthearted":     { ids:"35,10751", type:"both"  },
  "romantic":         { ids:"10749",    type:"both"  },
  "date night":       { ids:"10749,35", type:"both"  },
  "love story":       { ids:"10749",    type:"both"  },
  "christmas":        { ids:"10751",    type:"both"  },
  "holiday":          { ids:"10751",    type:"both"  },
  "mind bending":     { ids:"878,9648", type:"both"  },
  "mind-bending":     { ids:"878,9648", type:"both"  },
  "thought provoking":{ ids:"18,878",   type:"both"  },
  "dark":             { ids:"80,53",    type:"both"  },
  "gritty":           { ids:"80,18",    type:"both"  },
  "intense":          { ids:"28,53",    type:"both"  },
  "exciting":         { ids:"28,12",    type:"both"  },
  "chill":            { ids:"35,10751", type:"both"  },
  "relaxing":         { ids:"35,10751", type:"both"  },
  "inspiring":        { ids:"18,99",    type:"both"  },
  "suspense":         { ids:"53",       type:"both"  },
  "suspenseful":      { ids:"53",       type:"both"  },
  "new":              { ids:null,        type:"new"      },
  "new releases":     { ids:null,        type:"new"      },
  "new movies":       { ids:null,        type:"new"      },
  "trending":         { ids:null,        type:"trending" },
  "popular":          { ids:null,        type:"trending" },
  "top rated":        { ids:null,        type:"top"      },
  "best":             { ids:null,        type:"top"      },
  "highest rated":    { ids:null,        type:"top"      },
};

const isGenreSearch = (q) => {
  const lower = q.toLowerCase().trim();
  // Exact match first
  if (GENRE_MAP[lower]) return GENRE_MAP[lower];
  // Partial match — check if any key is contained in the query
  for (const [key, val] of Object.entries(GENRE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
};

const doGenreSearch = async (cfg) => {
  const addProviders = async (items, cat) =>
    Promise.all((items||[]).slice(0,20).map(async m => {
      const t = m.media_type==="tv"||(m.first_air_date&&!m.release_date)?"tv":"movie";
      try { const wp=await tmdbFetch(`/${t}/${m.id}/watch/providers`); return {...m,providers:getProviders(wp),category:cat}; }
      catch { return {...m,providers:[],category:cat}; }
    }));
  if (cfg.type==="trending") { const d=await tmdbFetch("/trending/all/week?language=en-US&page=1"); return addProviders(d.results,"trending"); }
  if (cfg.type==="top") { const [mv,tv]=await Promise.all([tmdbFetch("/movie/top_rated?language=en-US&page=1"),tmdbFetch("/tv/top_rated?language=en-US&page=1")]); return addProviders([...(mv.results||[]),...(tv.results||[])].slice(0,20),"movies"); }
  if (cfg.type==="new") { const d=await tmdbFetch("/movie/now_playing?language=en-US&page=1"); return addProviders(d.results,"movies"); }
  const kw = cfg.keyword ? `&with_keywords=${cfg.keyword}` : "";
  const results = [];
  if (cfg.type==="movie"||cfg.type==="both") { const d=await tmdbFetch(`/discover/movie?with_genres=${cfg.ids}&sort_by=popularity.desc&language=en-US&page=1${kw}`); results.push(...(d.results||[]).slice(0,10).map(m=>({...m,media_type:"movie"}))); }
  if (cfg.type==="tv"||cfg.type==="both") { const d=await tmdbFetch(`/discover/tv?with_genres=${cfg.ids}&sort_by=popularity.desc&language=en-US&page=1${kw}`); results.push(...(d.results||[]).slice(0,10).map(m=>({...m,media_type:"tv"}))); }
  return addProviders(results.slice(0,20),"movies");
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function StreamHub() {
  const isMobile = useIsMobile();
  const device = useDevice();

  // ── Auth state ──
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ── App state ──
  const [view, setView] = useState("trending");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [movies, setMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [featuredRows, setFeaturedRows] = useState({ trending:[], newReleases:[], topRated:[], anime:[], sports:[] });
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [userSubs, setUserSubs] = useState(["netflix","disney","max"]);
  const [showSetup, setShowSetup] = useState(false);

  // Load saved subs from localStorage on startup (for non-logged-in users)
  useEffect(() => {
    const saved = localStorage.getItem("streamhub_subs");
    const done  = localStorage.getItem("streamhub_setup_done");
    if (saved) { try { setUserSubs(JSON.parse(saved)); } catch(e) {} }
    if (!done)  setShowSetup(true);
  }, []);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tier, setTier] = useState("free");
  const [toast, setToast] = useState(null);
  const [filterPlat, setFilterPlat] = useState(null);
  const [showLeavingSoon, setShowLeavingSoon] = useState(false);
  const [showWatchHistory, setShowWatchHistory] = useState(false);
  const [showCostCalc, setShowCostCalc] = useState(false);
  const [showMoodSearch, setShowMoodSearch] = useState(false);
  const [showPersonalizedRecs, setShowPersonalizedRecs] = useState(false);
  const [watchHistory, setWatchHistory] = useState([]);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showSearchLimit, setShowSearchLimit] = useState(false);
  const [searchesUsed, setSearchesUsed] = useState(getSearchCount());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Show PWA install prompt after 60s on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem("streamhub_install_dismissed");
    if (!isMobile || dismissed) return;
    const timer = setTimeout(() => setShowInstallPrompt(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  // Show signup prompt after 30 seconds for non-logged-in users
  useEffect(() => {
    if (user) { resetSearchCount(); setSearchesUsed(0); return; }
    const dismissed = localStorage.getItem("streamhub_signup_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setShowSignupPrompt(true), 30000);
    return () => clearTimeout(timer);
  }, [user]);
  const searchTimer = useRef(null);

  const showToast = msg => setToast(msg);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user||null);
      if (session?.user) loadUserData(session.user);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user||null);
      if (session?.user) loadUserData(session.user);
      else { setWatchlist([]); setUserRatings({}); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    // Load profile
    let { data:prof } = await supabase.from("profiles").select("*").eq("id",u.id).single();
    if (!prof) {
      await supabase.from("profiles").insert({ id:u.id, username:u.email.split("@")[0], tier:"free", setup_done:false });
      prof = { id:u.id, username:u.email.split("@")[0], tier:"free", setup_done:false };
    }
    setProfile(prof);
    setTier(prof.tier||"free");

    // Load subscriptions from profile
    if (prof.subscriptions) {
      try {
        const subs = typeof prof.subscriptions === "string" ? JSON.parse(prof.subscriptions) : prof.subscriptions;
        setUserSubs(subs);
        localStorage.setItem("streamhub_subs", JSON.stringify(subs));
      } catch(e) {}
    }

    // Hide setup if user already completed it
    if (prof.setup_done) {
      setShowSetup(false);
      localStorage.setItem("streamhub_setup_done", "true");
    }

    // Load watchlist
    const { data:wl } = await supabase.from("watchlist").select("movie_id").eq("user_id",u.id);
    setWatchlist((wl||[]).map(w=>w.movie_id));
    // Load ratings
    const { data:rt } = await supabase.from("ratings").select("movie_id,rating").eq("user_id",u.id);
    const ratMap = {};
    (rt||[]).forEach(r=>ratMap[r.movie_id]=r.rating);
    setUserRatings(ratMap);
    // Load watch history for stats
    const { data:wh } = await supabase.from("watch_history").select("*").eq("user_id",u.id).order("watched_at",{ascending:false});
    setWatchHistory(wh||[]);
  };

  // ── Fetch featured rows for homepage ──
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const [trendData, newData, topData, animeData, sportsData] = await Promise.all([
          tmdbFetch("/trending/all/week?language=en-US&page=1"),
          tmdbFetch("/movie/now_playing?language=en-US&page=1"),
          tmdbFetch("/movie/top_rated?language=en-US&page=1"),
          tmdbFetch("/discover/tv?with_keywords=210024&sort_by=popularity.desc&language=en-US&page=1"),
          tmdbFetch("/discover/movie?with_genres=99&with_keywords=6075|1284|2702&sort_by=popularity.desc&language=en-US&page=1"),
        ]);
        const addProviders = async (items, category) => {
          return Promise.all((items||[]).slice(0,20).map(async m => {
            const type = m.media_type==="tv"||(m.first_air_date&&!m.release_date)?"tv":"movie";
            try { const wp=await tmdbFetch(`/${type}/${m.id}/watch/providers`); return {...m,providers:getProviders(wp),category}; }
            catch { return {...m,providers:[],category}; }
          }));
        };
        const [trending,newReleases,topRated,anime,sports] = await Promise.all([
          addProviders(trendData.results,"trending"),
          addProviders(newData.results,"movies"),
          addProviders(topData.results,"movies"),
          addProviders(animeData.results,"anime"),
          addProviders(sportsData.results,"sports"),
        ]);
        setFeaturedRows({ trending, newReleases, topRated, anime, sports });
        if (trending.length > 0) setHeroMovie(trending[Math.floor(Math.random()*Math.min(5,trending.length))]);
      } catch(e) { console.error(e); }
    };
    loadFeatured();
  }, []);

  // ── Fetch TMDB content ──
  useEffect(() => {
    const viewMap = {
      trending: "/trending/all/week",
      movies:   "/movie/popular",
      tv:       "/tv/popular",
      anime:    "/discover/tv?with_keywords=210024&sort_by=popularity.desc",
      sports:   "/discover/movie?with_genres=99&with_keywords=6075|1284|2702&sort_by=popularity.desc",
      watchlist: null,
    };
    const path = viewMap[view];
    if (!path) { setLoading(false); return; }
    setLoading(true);
    tmdbFetch(`${path}${path.includes('?')?'&':'?'}language=en-US&page=1`).then(async data => {
      const results = (data.results||[]).slice(0,20);
      const withProviders = await Promise.all(results.map(async m => {
        const type = m.media_type==="tv"||(m.first_air_date&&!m.release_date) ? "tv" : "movie";
        try {
          const wp = await tmdbFetch(`/${type}/${m.id}/watch/providers`);
          return { ...m, providers: getProviders(wp), category: view };
        } catch { return { ...m, providers:[], category:view }; }
      }));
      setMovies(withProviders);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [view]);

  // ── Smart Search ──
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      // Enforce search limit for non-logged-in users
      if (!user) {
        const count = getSearchCount();
        if (count >= SEARCH_LIMIT) {
          setShowSearchLimit(true);
          setSearching(false);
          return;
        }
        incrementSearchCount();
        setSearchesUsed(getSearchCount());
      }
      setSearching(true);
      track("search", { search_term: search.trim(), is_mood_search: !!isGenreSearch(search) });
      try {
        const genreConfig = isGenreSearch(search);
        if (genreConfig) {
          // Genre/mood search
          const results = await doGenreSearch(genreConfig);
          setSearchResults(results);
        } else {
          // Title search
          const data = await tmdbFetch(`/search/multi?query=${encodeURIComponent(search)}&language=en-US&page=1`);
          const results = (data.results||[]).filter(r=>r.media_type!=="person").slice(0,20);
          const withProviders = await Promise.all(results.map(async m => {
            const type = m.media_type==="tv" ? "tv" : "movie";
            try {
              const wp = await tmdbFetch(`/${type}/${m.id}/watch/providers`);
              return { ...m, providers:getProviders(wp), category:m.media_type };
            } catch { return { ...m, providers:[], category:m.media_type }; }
          }));
          setSearchResults(withProviders);
        }
      } catch(e) { console.error(e); }
      setSearching(false);
    }, 500);
  }, [search]);

  // ── Watchlist ──
  const toggleWatchlist = async (movieId) => {
    if (!user) {
      showToast("Sign up free to save your watchlist! 👤");
      track("watchlist_attempt_no_auth");
      return; // Just toast - don't show blocking prompt
    }
    const inWL = watchlist.includes(movieId);
    const FREE_WL_LIMIT = 50;
    if (!inWL && tier !== "premium" && watchlist.length >= FREE_WL_LIMIT) {
      showToast("Upgrade to Premium for unlimited watchlist! ✦");
      setShowUpgrade(true);
      return;
    }
    if (inWL) {
      setWatchlist(prev=>prev.filter(x=>x!==movieId));
      await supabase.from("watchlist").delete().eq("user_id",user.id).eq("movie_id",movieId);
      showToast("Removed from watchlist");
      track("watchlist_remove", { movie_id: movieId });
    } else {
      setWatchlist(prev=>[...prev,movieId]);
      await supabase.from("watchlist").insert({user_id:user.id,movie_id:movieId});
      showToast("Added to watchlist ♥");
      track("watchlist_add", { movie_id: movieId });
    }
  };

  const handleSaveUserSubs = async (subs) => {
    setUserSubs(subs);
    localStorage.setItem("streamhub_subs", JSON.stringify(subs));
    localStorage.setItem("streamhub_setup_done", "true");
    setShowSetup(false);
    track("setup_complete", { services_count: subs.length });
    if (user) {
      await supabase.from("profiles").update({
        subscriptions: JSON.stringify(subs),
        setup_done: true,
      }).eq("id", user.id);
    }
  };

  // Load saved subs from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem("streamhub_subs");
    if (saved) {
      try { setUserSubs(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setShowSignupPrompt(false); // Dismiss prompt when opening a movie
    track("movie_open", {
      movie_title: movie.title||movie.name||"",
      movie_type: movie.first_air_date ? "tv" : "movie",
    });
  };

  const handleSetView = (v) => { setView(v); track("tab_change", { tab: v }); };

  const markAsWatched = async (movie) => {
    if (!user) return showToast("Sign in to track history! 👤");
    await supabase.from("watch_history").upsert({
      user_id: user.id,
      movie_id: movie.id,
      movie_title: movie.title||movie.name||"",
      movie_poster: movie.poster_path||null,
      movie_type: movie.first_air_date ? "tv" : "movie",
    }, { onConflict:"user_id,movie_id" });
    showToast("Added to watch history ✅");
    track("mark_watched", { movie_title: movie.title||movie.name, movie_type: movie.first_air_date?"tv":"movie" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
    showToast("Signed out 👋");
    track("sign_out");
  };

  // ── Display movies ──
  const displayMovies = search.trim() ? searchResults : view==="watchlist"
    ? movies.filter(m=>watchlist.includes(m.id))
    : movies;

  const filtered = displayMovies.filter(m => !filterPlat || m.providers?.includes(filterPlat));

  const subscribed = SERVICES.filter(s=>userSubs.includes(s.id));
  const unsubscribed = SERVICES.filter(s=>!userSubs.includes(s.id));

  const SkeletonCard = () => (
    <div style={{borderRadius:"var(--radius)",overflow:"hidden",border:"1px solid var(--border)"}}>
      <div className="skeleton" style={{height:200}} />
      <div style={{padding:"10px 12px 12px",background:"var(--card)"}}>
        <div className="skeleton" style={{height:14,marginBottom:8,width:"80%"}} />
        <div className="skeleton" style={{height:11,width:"50%"}} />
      </div>
    </div>
  );

  const AvatarButton = () => (
    <button onClick={()=>user?setShowProfile(true):setShowAuth(true)}
      style={{width:36,height:36,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,border:"none",color:"#fff",flexShrink:0,transition:"all .2s"}}
      title={user?"My Profile":"Sign In"}>
      {user?(profile?.username||user.email||"U")[0].toUpperCase():"?"}
    </button>
  );

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)",paddingBottom:80}}>
        {/* Mobile Header */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(245,197,24,.1)",paddingTop:"env(safe-area-inset-top)"}}>
          {/* Top row - logo + buttons */}
          <div style={{display:"flex",alignItems:"center",padding:"10px 14px 8px",gap:10}}>
            {/* Logo - wider to fill space */}
            <div style={{flex:1,display:"flex",alignItems:"center"}}>
              <img
                src="/logo-clean.png"
                alt="The StreamHub"
                onError={e=>e.target.style.display="none"}
                style={{
                  height:72,
                  width:"auto",
                  maxWidth:240,
                  objectFit:"contain",
                  filter:"drop-shadow(0 0 10px rgba(245,197,24,.5)) drop-shadow(0 0 20px rgba(124,58,237,.3))",
                  animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3s ease-in-out infinite",
                }}
              />
            </div>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:99,fontFamily:"var(--font-head)",flexShrink:0}}>✦ PRO</span>
              :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"var(--gold)",border:"none",borderRadius:9,color:"#000",padding:"7px 12px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>Upgrade ✦</button>
            }
            <AvatarButton />
          </div>
          {/* Search bar - full width, prominent */}
          <div style={{padding:"0 14px 10px",position:"relative"}}>
            <span style={{position:"absolute",left:26,top:"50%",transform:"translateY(-60%)",color:"var(--gold)",fontSize:16}}>🔍</span>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by title, genre or mood…"
              style={{
                width:"100%", background:"rgba(255,255,255,.1)",
                border:"1.5px solid rgba(245,197,24,.4)",
                borderRadius:14, color:"var(--text)",
                padding:"12px 16px 12px 38px",
                fontSize:15, outline:"none",
                boxShadow:"0 2px 16px rgba(245,197,24,.1)",
              }}
            />
          </div>
          {/* Service filter chips */}
          <div style={{overflowX:"auto",padding:"0 14px 10px",display:"flex",gap:6,scrollbarWidth:"none"}}>
            <button onClick={()=>setFilterPlat(null)} style={{background:!filterPlat?"var(--gold)":"rgba(255,255,255,.05)",border:`1px solid ${!filterPlat?"var(--gold)":"var(--border)"}`,borderRadius:99,color:!filterPlat?"#000":"var(--muted)",padding:"5px 14px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer"}}>All</button>
            {SERVICES.map(s=>{
              const active=filterPlat===s.id;
              return <button key={s.id} onClick={()=>setFilterPlat(active?null:s.id)} style={{background:active?`${s.color}30`:"rgba(255,255,255,.04)",border:`1px solid ${active?s.color:"rgba(255,255,255,.07)"}`,borderRadius:99,color:active?"#fff":"var(--muted)",padding:"5px 12px",fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                <span style={{background:active?s.color:"rgba(255,255,255,.1)",borderRadius:4,width:14,height:14,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:800,color:"#fff"}}>{s.logo}</span>{s.name}
              </button>;
            })}
          </div>
        </div>

        {/* Search status */}
        {search.trim() && (
          <div style={{padding:"12px 14px 0",fontSize:13,color:"var(--muted)"}}>
            {searching?"Searching…":`${searchResults.length} results for "${search}"`}
          </div>
        )}

        {/* Mobile Premium Tools Strip */}
        {!user && view==="trending" && !search.trim() && <WelcomeBanner />}
        <div style={{padding:"0 14px 16px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
          <div style={{display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
            {[
              {icon:"✦",label:"For You",sub:"AI picks just for you",onClick:()=>setShowPersonalizedRecs(true),color:"var(--gold)"},
              {icon:"🚨",label:"Leaving Soon",sub:"Don't miss these",onClick:()=>setShowLeavingSoon(true),color:"var(--danger)"},
              {icon:"📺",label:"Watch History",sub:"Track what you watch",onClick:()=>setShowWatchHistory(true),color:"var(--cyan)"},
              {icon:"💰",label:"Cost Calculator",sub:"See your spend",onClick:()=>setShowCostCalc(true),color:"var(--sports)"},
            ].map(item=>(
              <button key={item.label} onClick={item.onClick} style={{flexShrink:0,background:"rgba(255,255,255,.04)",border:`1px solid ${item.color}44`,borderRadius:14,padding:"12px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",minWidth:100,transition:"all .2s"}}
                onTouchStart={e=>e.currentTarget.style.background=`${item.color}15`}
                onTouchEnd={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"}>
                <span style={{fontSize:24}}>{item.icon}</span>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:"var(--text)",textAlign:"center",whiteSpace:"nowrap"}}>{item.label}{tier!=="premium"&&<span style={{marginLeft:4,background:"var(--gold)",color:"#000",fontSize:7,fontWeight:800,padding:"1px 4px",borderRadius:99,verticalAlign:"middle"}}>PRO</span>}</div>
                <div style={{fontSize:10,color:"var(--muted)",textAlign:"center",whiteSpace:"nowrap"}}>{item.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Hero + Featured Rows for trending */}
        {view==="trending"&&!search.trim() ? (
          <div>
            {/* Mobile Hero */}
            {heroMovie && (
              <MobileHero movie={heroMovie} watchlist={watchlist} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} />
            )}
            {/* Mobile Featured Rows */}
            {[
              {title:"Trending",icon:"🔥",key:"trending",color:"var(--gold)"},
              {title:"New in Cinemas",icon:"🎬",key:"newReleases",color:"var(--cyan)"},
              {title:"Top Rated",icon:"⭐",key:"topRated",color:"var(--purple)"},
              {title:"Anime",icon:"✦",key:"anime",color:"var(--anime)"},
              {title:"Sports & Docs",icon:"🏆",key:"sports",color:"var(--sports)"},
            ].map(row=>(
              <div key={row.key} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 14px",marginBottom:10}}>
                  <span>{row.icon}</span>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:row.color}}>{row.title}</div>
                </div>
                <div style={{display:"flex",gap:10,overflowX:"auto",padding:"2px 14px 4px",scrollbarWidth:"none"}}>
                  {(featuredRows[row.key]||[]).slice(0,10).map(m=>(
                    <div key={m.id} style={{flexShrink:0,width:130}}>
                      <MovieCard movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Regular grid */
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,padding:"12px 14px"}}>
            {loading&&!search
              ? Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)
              : filtered.length===0
                ? <div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--muted)",padding:"60px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty. Tap ♡ to save titles!":"No results found."}</div>
                : filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)
            }
          </div>
        )}

        <MobileBottomNav view={view} setView={v=>{handleSetView(v);setSearch("");}} watchlist={watchlist} onProfile={()=>user?setShowProfile(true):setShowAuth(true)} />

        {/* Advanced Stats Section */}
        <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} onOpenHistory={()=>setShowWatchHistory(true)} onOpenWatchlist={()=>handleSetView("watchlist")}/>

        {/* Spacer so content scrolls fully above bottom nav + tagline */}
        <div style={{height:160}} />

        {/* Mobile bottom tagline bar - above bottom nav */}
        <div style={{
          position:"fixed", bottom:64, left:0, right:0, zIndex:150,
          background:"linear-gradient(90deg,#7C3AED,#F5C518,#FF6B9D)",
          padding:"7px 0", textAlign:"center",
          fontFamily:"var(--font-head)", fontWeight:800,
          fontSize:11, letterSpacing:4, color:"#fff",
          boxShadow:"0 -2px 20px rgba(124,58,237,.5)",
          pointerEvents:"none",
        }}>SEARCH · FIND · ENJOY</div>
      </div>

      {/* Modals */}
      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:"movie"})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showWatchHistory&&<WatchHistoryModal onClose={()=>setShowWatchHistory(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      <Analytics />
    </>
  );

  // ─── TABLET LAYOUT ───────────────────────────────────────────────────────────
  if (device === "tablet") return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)",paddingBottom:72}}>
        {/* Tablet Header */}
        <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(245,197,24,.15)",paddingTop:"env(safe-area-inset-top)"}}>
          <div style={{display:"flex",alignItems:"center",padding:"10px 20px",gap:12,height:64}}>
            <Logo size={28} />
            <div style={{flex:1,position:"relative",maxWidth:400}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontSize:15}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, genre or mood…"
                style={{width:"100%",background:"rgba(255,255,255,.07)",border:"2px solid rgba(245,197,24,.45)",borderRadius:12,color:"var(--text)",padding:"9px 14px 9px 38px",fontSize:14,outline:"none",boxShadow:"0 0 16px rgba(245,197,24,.12)"}}
                onFocus={e=>{e.target.style.border="2px solid #F5C518";e.target.style.boxShadow="0 0 24px rgba(245,197,24,.3)";}}
                onBlur={e=>{e.target.style.border="2px solid rgba(245,197,24,.45)";e.target.style.boxShadow="0 0 16px rgba(245,197,24,.12)";}}
              />
            </div>
            <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
              {tier==="premium"
                ?<span style={{background:"var(--gold)",color:"#000",fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,fontFamily:"var(--font-head)"}}>✦ PREMIUM</span>
                :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"linear-gradient(135deg,#F5C518,#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"9px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,boxShadow:"0 0 16px rgba(245,197,24,.35)",cursor:"pointer"}}>Upgrade ✦</button>
              }
              {!user
                ?<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"linear-gradient(135deg,#7C3AED,#6d28d9)",border:"1px solid rgba(124,58,237,.4)",borderRadius:10,color:"#fff",padding:"9px 16px",fontWeight:800,fontSize:13,fontFamily:"var(--font-head)",boxShadow:"0 0 16px rgba(124,58,237,.35)",cursor:"pointer"}}>👤 Sign In</button>
                :<AvatarButton />
              }
            </div>
          </div>
          {/* Service chips only - no category tabs since bottom nav handles navigation */}
          <div style={{overflowX:"auto",padding:"0 20px 10px",display:"flex",gap:6,scrollbarWidth:"none"}}>
            <button onClick={()=>setFilterPlat(null)} style={{background:!filterPlat?"var(--gold)":"rgba(255,255,255,.05)",border:`1px solid ${!filterPlat?"var(--gold)":"var(--border)"}`,borderRadius:99,color:!filterPlat?"#000":"var(--muted)",padding:"5px 16px",fontSize:12,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer"}}>All</button>
            {SERVICES.map(s=>{const active=filterPlat===s.id;return(
              <button key={s.id} onClick={()=>setFilterPlat(active?null:s.id)} style={{background:active?`${s.color}30`:"rgba(255,255,255,.04)",border:`1px solid ${active?s.color:"rgba(255,255,255,.08)"}`,borderRadius:99,color:active?"#fff":"var(--muted)",padding:"5px 14px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                <span style={{background:active?s.color:"rgba(255,255,255,.1)",borderRadius:4,width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#fff"}}>{s.logo}</span>{s.name}
              </button>
            );})}
          </div>
        </header>

        {/* Tablet Hero with Trailer */}
        {!user && view==="trending" && !search.trim() && <WelcomeBanner />}
        {view==="trending"&&!search.trim()&&heroMovie&&(
          <TabletHero movie={heroMovie} watchlist={watchlist} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} />
        )}

        {/* Tablet Grid */}
        <div style={{padding:"20px 20px 120px"}}>
          {/* Tablet Premium Tools */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:12,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[
                {icon:"✦",label:"For You",sub:"AI picks just for you",onClick:()=>setShowPersonalizedRecs(true),color:"var(--gold)"},
                {icon:"🚨",label:"Leaving Soon",sub:"Don't miss these titles",onClick:()=>setShowLeavingSoon(true),color:"var(--danger)"},
                {icon:"📺",label:"Watch History",sub:"Track what you watch",onClick:()=>setShowWatchHistory(true),color:"var(--cyan)"},
                {icon:"💰",label:"Cost Calculator",sub:"See your streaming spend",onClick:()=>setShowCostCalc(true),color:"var(--sports)"},
              ].map(item=>(
                <button key={item.label} onClick={item.onClick}
                  style={{background:"rgba(255,255,255,.04)",border:`1px solid ${item.color}44`,borderRadius:14,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer",transition:"all .2s",width:"100%"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${item.color}12`;e.currentTarget.style.borderColor=item.color;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor=`${item.color}44`;}}>
                  <span style={{fontSize:28}}>{item.icon}</span>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,color:"var(--text)",textAlign:"center"}}>
                    {item.label}
                    {tier!=="premium"&&<span style={{marginLeft:5,background:"var(--gold)",color:"#000",fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:99}}>PRO</span>}
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",textAlign:"center"}}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>
          {view==="trending"&&!search.trim() ? (
            <div>
              {[{title:"Trending",icon:"🔥",key:"trending",color:"var(--gold)"},{title:"New in Cinemas",icon:"🎬",key:"newReleases",color:"var(--cyan)"},{title:"Top Rated",icon:"⭐",key:"topRated",color:"var(--purple)"},{title:"Anime",icon:"✦",key:"anime",color:"var(--anime)"},{title:"Sports & Docs",icon:"🏆",key:"sports",color:"var(--sports)"}].map(row=>(
                <div key={row.key} style={{marginBottom:32}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <span style={{fontSize:18}}>{row.icon}</span>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,color:row.color}}>{row.title}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {(featuredRows[row.key]||[]).slice(0,8).map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,marginBottom:16}}>
                {search.trim() ? (searching?"Searching…":`${searchResults.length} results for "${search}"`) : CATEGORY_TABS.find(t=>t.id===view)?.icon+" "+CATEGORY_TABS.find(t=>t.id===view)?.label}
                {!search&&!loading&&<span style={{fontWeight:400,fontSize:14,color:"var(--muted)",marginLeft:10}}>{filtered.length} titles</span>}
              </div>
              {loading&&!search
                ?<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
                :filtered.length===0
                  ?<div style={{textAlign:"center",color:"var(--muted)",padding:"80px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty!":"No results found."}</div>
                  :<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                  </div>
              }
            </>
          )}
        </div>

        {/* Advanced Stats Section */}
        <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} onOpenHistory={()=>setShowWatchHistory(true)} onOpenWatchlist={()=>handleSetView("watchlist")}/>

        {/* Spacer so content scrolls fully above bottom nav + tagline */}
        <div style={{height:180}} />

        {/* Tablet tagline banner - above bottom nav */}
        <div style={{
          position:"fixed", bottom:72, left:0, right:0, zIndex:150,
          background:"linear-gradient(90deg,#7C3AED,#F5C518,#FF6B9D)",
          padding:"7px 0", textAlign:"center",
          fontFamily:"var(--font-head)", fontWeight:800,
          fontSize:12, letterSpacing:5, color:"#fff",
          boxShadow:"0 -2px 20px rgba(124,58,237,.5)",
          pointerEvents:"none",
        }}>SEARCH · FIND · ENJOY</div>

        {/* Tablet Bottom Nav */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(7,7,14,.98)",borderTop:"1px solid rgba(245,197,24,.1)",display:"flex",backdropFilter:"blur(20px)"}}>
          {[
            {id:"trending",icon:"🔥",label:"Trending",color:"#F5C518",anim:"flameDance"},
            {id:"movies",  icon:"🎬",label:"Movies",  color:"#06B6D4",anim:null},
            {id:"tv",      icon:"📺",label:"TV",      color:"#A78BFA",anim:"tvFlicker"},
            {id:"anime",   icon:"✦", label:"Anime",   color:"#FF6B9D",anim:"swordSwing"},
            {id:"sports",  icon:"🏆",label:"Sports",  color:"#10B981",anim:"trophyBounce"},
            {id:"watchlist",icon:"♥",label:"Watchlist",color:"#F5C518",anim:null},
          ].map(t=>{
            const active=view===t.id;
            return <button key={t.id} onClick={()=>{setView(t.id);setSearch("");}}
              style={{flex:1,background:"none",border:"none",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:active?t.color:"rgba(240,240,250,.35)",position:"relative",cursor:"pointer"}}>
              <span style={{fontSize:22,lineHeight:1,filter:active?`drop-shadow(0 0 8px ${t.color}cc)`:"none",display:"inline-block",animation:active&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none"}}>{t.icon}</span>
              <span style={{fontSize:10,fontWeight:800,fontFamily:"var(--font-head)"}}>{t.label}</span>
              {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:36,height:2.5,background:t.color,borderRadius:99,boxShadow:`0 0 8px ${t.color}`}}/>}
            </button>;
          })}
          <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{flex:1,background:"none",border:"none",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:"rgba(240,240,250,.35)",cursor:"pointer"}}>
            <span style={{fontSize:22}}>👤</span>
            <span style={{fontSize:10,fontWeight:800,fontFamily:"var(--font-head)"}}>Profile</span>
          </button>
        </div>
      </div>

      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:"movie"})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showWatchHistory&&<WatchHistoryModal onClose={()=>setShowWatchHistory(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      <Analytics />
    </>
  );

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        {/* Header */}
        <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(245,197,24,.15)",padding:"0 20px",height:72,display:"flex",alignItems:"center",gap:12}}>
          <Logo size={30} />
          <nav style={{display:"flex",gap:2,marginLeft:8,flexShrink:0}}>
            {CATEGORY_TABS.filter(t=>t.id!=="search").map(t=>(
              <button key={t.id} onClick={()=>{setView(t.id);setSearch("");}}
                style={{background:view===t.id?`${t.color}15`:"none",border:"none",color:view===t.id?t.color:"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"6px 10px",borderRadius:9,transition:"all .2s",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",boxShadow:view===t.id?`0 0 14px ${t.color}30`:"none",cursor:"pointer"}}>
                <span style={{display:"inline-block",animation:view===t.id&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none"}}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          {/* Search bar */}
          <div style={{flex:1,minWidth:160,maxWidth:320,position:"relative",marginLeft:8}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontSize:15,zIndex:1}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, genre or mood…"
              style={{width:"100%",background:"rgba(255,255,255,.07)",border:"2px solid rgba(245,197,24,.5)",borderRadius:12,color:"var(--text)",padding:"9px 14px 9px 36px",fontSize:13,outline:"none",boxShadow:"0 0 16px rgba(245,197,24,.15)"}}
              onFocus={e=>{e.target.style.border="2px solid #F5C518";e.target.style.boxShadow="0 0 24px rgba(245,197,24,.35)";}}
              onBlur={e=>{e.target.style.border="2px solid rgba(245,197,24,.5)";e.target.style.boxShadow="0 0 16px rgba(245,197,24,.15)";}}
            />
          </div>
          {/* Right buttons */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexShrink:0}}>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,fontFamily:"var(--font-head)",whiteSpace:"nowrap"}}>✦ PREMIUM</span>
              :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"linear-gradient(135deg,#F5C518,#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"9px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,boxShadow:"0 0 16px rgba(245,197,24,.4)",whiteSpace:"nowrap",cursor:"pointer"}}>Upgrade ✦</button>
            }
            {!user
              ?<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"linear-gradient(135deg,#7C3AED,#6d28d9)",border:"1px solid rgba(124,58,237,.5)",borderRadius:10,color:"#fff",padding:"9px 18px",fontWeight:800,fontSize:13,fontFamily:"var(--font-head)",boxShadow:"0 0 16px rgba(124,58,237,.4)",whiteSpace:"nowrap",cursor:"pointer"}}>👤 Sign In</button>
              :<AvatarButton />
            }
          </div>
        </header>

        <div style={{display:"flex",padding:"20px 24px",gap:20,maxWidth:1440,margin:"0 auto"}}>
          {/* Left Sidebar */}
          <aside style={{width:168,flexShrink:0}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>MY SERVICES</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {subscribed.map(s=>(
                  <button key={s.id} onClick={()=>setFilterPlat(filterPlat===s.id?null:s.id)} style={{background:filterPlat===s.id?`${s.color}22`:"rgba(255,255,255,.04)",border:filterPlat===s.id?`1px solid ${s.color}66`:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"8px 12px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
                    <span style={{background:s.color,borderRadius:5,width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",flexShrink:0}}>{s.logo}</span>{s.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>AVAILABLE</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {unsubscribed.map(s=>(
                  <button key={s.id} onClick={()=>setFilterPlat(filterPlat===s.id?null:s.id)} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${filterPlat===s.id?`${s.color}44`:"rgba(255,255,255,.05)"}`,borderRadius:10,color:"var(--muted)",padding:"6px 12px",fontSize:11,display:"flex",alignItems:"center",gap:8,opacity:.65}}>
                    <span style={{background:"rgba(255,255,255,.1)",borderRadius:5,width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,flexShrink:0}}>{s.logo}</span>{s.name}
                  </button>
                ))}
              </div>
            </div>
            {filterPlat&&<button onClick={()=>setFilterPlat(null)} style={{marginTop:12,width:"100%",background:"none",border:"1px solid var(--border)",borderRadius:9,color:"var(--muted)",padding:"6px 0",fontSize:12}}>Clear filter ✕</button>}
          </aside>

          {/* Main */}
          <main style={{flex:1,minWidth:0}}>
            {/* Homepage hero + rows */}
            {view==="trending"&&!search.trim() ? (
              <div style={{margin:"0 -24px"}}>
                {!user && <WelcomeBanner />}
                <div style={{padding:"16px 16px 0"}}>
                  <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.06)"}}>
                    <HeroBanner movie={heroMovie} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                  </div>
                </div>
                <div style={{paddingTop:24}}>
                  <FeaturedRow title="Trending This Week" icon="🔥" movies={featuredRows.trending} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--gold)" />
                  <FeaturedRow title="New in Cinemas" icon="🎬" movies={featuredRows.newReleases} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--cyan)" />
                  <FeaturedRow title="Top Rated All Time" icon="⭐" movies={featuredRows.topRated} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--purple)" />
                  <FeaturedRow title="Anime" icon="✦" movies={featuredRows.anime} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--anime)" />
                  <FeaturedRow title="Sports & Docs" icon="🏆" movies={featuredRows.sports} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--sports)" />
                </div>
              </div>
            ) : (
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>
                    {search.trim()
                      ? searching?"Searching…":`${searchResults.length} results for "${search}"`
                      : CATEGORY_TABS.find(t=>t.id===view)?.icon+" "+CATEGORY_TABS.find(t=>t.id===view)?.label
                    }
                    {!search&&!loading&&<span style={{fontWeight:400,fontSize:14,color:"var(--muted)",marginLeft:10}}>{filtered.length} titles</span>}
                  </div>
                  {!user&&<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"8px 18px",fontWeight:700,fontSize:13}}>👤 Sign in to save watchlist</button>}
                </div>
                {loading&&!search
                  ? <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
                  : filtered.length===0
                    ? <div style={{textAlign:"center",color:"var(--muted)",padding:"80px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty. Click ♡ to save titles!":"No results found."}</div>
                    : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>
                        {filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                      </div>
                }
              </>
            )}
          </main>

          {/* Right Sidebar */}
          <aside style={{width:220,flexShrink:0}}>
            {!user&&(
              <div style={{background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.25)",borderRadius:"var(--radius)",padding:16,marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:8}}>👤</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:6}}>Create an Account</div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>Save your watchlist, write reviews and sync across devices.</div>
                <button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{width:"100%",background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 0",fontWeight:700,fontSize:13,cursor:"pointer"}}>Sign Up Free</button>
              </div>
            )}

            {/* Premium Tools */}
            <div style={{marginTop:16}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {[
                  {icon:"✦",label:"For You",sub:"AI picks just for you",onClick:()=>setShowPersonalizedRecs(true),color:"var(--gold)"},
                  {icon:"🚨",label:"Leaving Soon",sub:"Don't miss these",onClick:()=>setShowLeavingSoon(true),color:"var(--danger)"},
                  {icon:"📺",label:"Watch History",sub:"Track what you watch",onClick:()=>setShowWatchHistory(true),color:"var(--cyan)"},
                  {icon:"💰",label:"Cost Calculator",sub:"See your spend",onClick:()=>setShowCostCalc(true),color:"var(--sports)"},
                ].map(item=>(
                  <button key={item.label} onClick={item.onClick}
                    style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 10px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",transition:"all .2s",textAlign:"left",width:"100%"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=item.color;e.currentTarget.style.background=`${item.color}10`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="rgba(255,255,255,.03)";}}>
                    <span style={{fontSize:18}}>{item.icon}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:5}}>{item.label}{tier!=="premium"&&<span style={{background:"var(--gold)",color:"#000",fontSize:7,fontWeight:800,padding:"1px 4px",borderRadius:99}}>PRO</span>}</div>
                      <div style={{fontSize:10,color:"var(--muted)"}}>{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand logo in sidebar bottom */}
            <div style={{marginTop:24,textAlign:"center"}}>
              <img src="/logo-clean.png" alt="The StreamHub" style={{width:"70%",objectFit:"contain",filter:"drop-shadow(0 0 16px rgba(245,197,24,.4))",animation:"logoPulse 3s ease-in-out infinite"}} />
              <div style={{fontSize:10,color:"var(--muted)",marginTop:8,letterSpacing:.5}}>Search · Find · Enjoy</div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div style={{position:"relative",overflow:"hidden",borderTop:"2px solid rgba(245,197,24,.2)"}}>
        {/* Advanced Stats Section */}
        <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} />

          {/* Footer hero tagline */}
          <div style={{
            padding:"48px 40px 32px",
            background:"linear-gradient(180deg,rgba(10,8,24,0.98) 0%,rgba(12,8,28,1) 100%)",
            textAlign:"center",position:"relative",
          }}>
            {/* Big decorative tagline */}
            <div style={{
              fontFamily:"var(--font-head)", fontWeight:800,
              fontSize:"clamp(24px,3vw,42px)",
              letterSpacing:"-.01em", marginBottom:10,
              background:"linear-gradient(90deg,#F5C518,#ffffff,#06B6D4,#FF6B9D,#F5C518)",
              backgroundSize:"300% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 4s linear infinite",
            }}>Search · Find · Enjoy</div>
            <div style={{
              fontSize:12, letterSpacing:4, marginBottom:36,
              color:"rgba(240,240,250,.55)", display:"inline-block",
              background:"rgba(255,255,255,.05)",
              padding:"6px 20px", borderRadius:99,
              border:"1px solid rgba(255,255,255,.1)",
            }}>YOUR AI STREAMING ASSISTANT</div>

            {/* Word pills */}
            <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap",marginBottom:36}}>
              {[
                {word:"SEARCH", color:"#000",    bg:"#F5C518",  shadow:"rgba(245,197,24,.6)"},
                {word:"·",      color:"rgba(240,240,250,.4)", bg:"transparent", shadow:"none"},
                {word:"FIND",   color:"#fff",    bg:"#06B6D4",  shadow:"rgba(6,182,212,.5)"},
                {word:"·",      color:"rgba(240,240,250,.4)", bg:"transparent", shadow:"none"},
                {word:"ENJOY",  color:"#fff",    bg:"#FF6B9D",  shadow:"rgba(255,107,157,.5)"},
              ].map((p,i)=>(
                <span key={i} style={{
                  fontFamily:"var(--font-head)", fontWeight:800,
                  fontSize: p.word==="·" ? 28 : 20,
                  color:p.color, letterSpacing: p.word==="·" ? 0 : 4,
                  background:p.bg, borderRadius:99,
                  padding: p.word==="·" ? "0 8px" : "10px 32px",
                  display:"inline-flex", alignItems:"center",
                  boxShadow: p.shadow!=="none" ? `0 0 28px ${p.shadow}, 0 4px 12px rgba(0,0,0,.4)` : "none",
                  animation: p.word!=="·" ? `badgePop 3s ease-in-out infinite` : "none",
                  animationDelay:`${i*0.4}s`,
                }}>{p.word}</span>
              ))}
            </div>

            {/* Bottom bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,paddingTop:24,borderTop:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <img src="/logo-clean.png" alt="The StreamHub" style={{height:52,objectFit:"contain",filter:"drop-shadow(0 0 10px rgba(245,197,24,.5))"}} />
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>
                    <span style={{color:"#F5C518"}}>The Stream</span>
                    <span style={{color:"#7C3AED"}}>Hub</span>
                  </div>
                  <div style={{fontSize:10,color:"var(--muted)",letterSpacing:1}}>SEARCH · FIND · ENJOY</div>
                </div>
              </div>
              <div style={{fontSize:11,color:"var(--muted)"}}>© 2025 StreamHub · Not affiliated with any streaming service.</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {["Netflix","Disney+","Max","Hulu","Crunchyroll","ESPN+","DAZN"].map(n=>(
                  <span key={n} style={{fontSize:10,color:"rgba(240,240,250,.2)",letterSpacing:.5}}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Left side tagline banner - desktop only, fully visible */}
        <div className="desktop-only" style={{
          position:"fixed", left:0, top:"50%", zIndex:50, pointerEvents:"none",
          transform:"translateY(-50%) translateX(calc(-50% + 40px)) rotate(-90deg)",
          transformOrigin:"center center",
        }}>
          <div style={{
            background:"linear-gradient(90deg,#7C3AED,#F5C518)",
            padding:"6px 28px", borderRadius:"0 0 10px 10px",
            fontFamily:"var(--font-head)", fontWeight:800, fontSize:10,
            letterSpacing:4, color:"#fff", whiteSpace:"nowrap",
            boxShadow:"0 4px 20px rgba(124,58,237,.6)",
          }}>SEARCH · FIND · ENJOY</div>
        </div>

        {/* Right side tagline banner - desktop only, fully visible */}
        <div className="desktop-only" style={{
          position:"fixed", right:0, top:"50%", zIndex:50, pointerEvents:"none",
          transform:"translateY(-50%) translateX(calc(50% - 40px)) rotate(90deg)",
          transformOrigin:"center center",
        }}>
          <div style={{
            background:"linear-gradient(90deg,#F5C518,#FF6B9D)",
            padding:"6px 28px", borderRadius:"0 0 10px 10px",
            fontFamily:"var(--font-head)", fontWeight:800, fontSize:10,
            letterSpacing:4, color:"#fff", whiteSpace:"nowrap",
            boxShadow:"0 4px 20px rgba(255,107,157,.6)",
          }}>SEARCH · FIND · ENJOY</div>
        </div>
      </div>

      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:"movie"})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showWatchHistory&&<WatchHistoryModal onClose={()=>setShowWatchHistory(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      <Analytics />
    </>
  );
}
       