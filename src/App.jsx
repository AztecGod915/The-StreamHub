import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

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
      ::-webkit-scrollbar { width:5px; height:5px; }
      ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:99px; }
      @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes spin     { to{transform:rotate(360deg)} }
      @keyframes slideRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideDown{ from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ─── SERVICES ─────────────────────────────────────────────────────────────────
const SERVICES = [
  { id:"netflix",     name:"Netflix",     color:"#E50914", logo:"N",  deal:null,                  url:"https://www.netflix.com/search?q=" },
  { id:"disney",      name:"Disney+",     color:"#0063E5", logo:"D+", deal:null,                  url:"https://www.disneyplus.com/search/" },
  { id:"max",         name:"Max",         color:"#002BE7", logo:"M",  deal:null,                  url:"https://www.max.com/search?q=" },
  { id:"hulu",        name:"Hulu",        color:"#1CE783", logo:"H",  deal:"2 months free",       url:"https://www.hulu.com/search?q=" },
  { id:"apple",       name:"Apple TV+",   color:"#555",    logo:"A",  deal:"$2.99/mo first year", url:"https://tv.apple.com/search?term=" },
  { id:"prime",       name:"Prime",       color:"#00A8E1", logo:"P",  deal:null,                  url:"https://www.amazon.com/s?k=" },
  { id:"peacock",     name:"Peacock",     color:"#E81C2E", logo:"Pk", deal:"50% off annual",      url:"https://www.peacocktv.com/search?q=" },
  { id:"paramount",   name:"Paramount+",  color:"#0064FF", logo:"P+", deal:"30-day trial",        url:"https://www.paramountplus.com/search/?q=" },
  { id:"crunchyroll", name:"Crunchyroll", color:"#F47521", logo:"CR", deal:"14-day free trial",   url:"https://www.crunchyroll.com/search?q=" },
  { id:"espnplus",    name:"ESPN+",       color:"#E31837", logo:"E+", deal:null,                  url:"https://www.espn.com/espnplus/player/" },
  { id:"dazn",        name:"DAZN",        color:"#C8A900", logo:"DZ", deal:"First month $1.99",   url:"https://www.dazn.com/search?q=" },
  { id:"fubo",        name:"Fubo",        color:"#FF6B00", logo:"F",  deal:"7-day free trial",    url:"https://www.fubo.tv/welcome" },
];

const CATEGORY_TABS = [
  { id:"trending", label:"Trending",   icon:"🔥", color:"var(--gold)" },
  { id:"movies",   label:"Movies",     icon:"🎬", color:"var(--cyan)" },
  { id:"tv",       label:"TV Shows",   icon:"📺", color:"var(--purple)" },
  { id:"anime",    label:"Anime",      icon:"⚔️",  color:"var(--anime)" },
  { id:"search",   label:"Search",     icon:"🔍", color:"var(--gold)" },
];

const GR = [
  ["#1a1a2e","#e94560"],["#0d1b2a","#1f6feb"],["#1a0533","#7928ca"],
  ["#0a1628","#f59e0b"],["#1c0d2e","#c026d3"],["#0d2137","#06b6d4"],
  ["#1f1200","#d97706"],["#001f0d","#10b981"],["#1a0a0a","#ef4444"],
  ["#0d0d1a","#6366f1"],["#1a1000","#eab308"],["#0a1a1a","#14b8a6"],
];

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size=32 }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#F5C518"/>
        <rect x="3" y="3" width="34" height="34" rx="8" fill="#0D0D1A"/>
        <polygon points="16,13 16,27 28,20" fill="#F5C518"/>
        <circle cx="11" cy="20" r="3" fill="#7C3AED"/>
        <circle cx="11" cy="20" r="1.5" fill="#F5C518"/>
      </svg>
      <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:size*0.6,letterSpacing:"-.02em"}}>
        <span style={{color:"#fff"}}>Stream</span><span style={{color:"#F5C518"}}>Hub</span>
      </span>
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
function ProfileModal({ user, profile, tier, watchlist, userRatings, onClose, onSignOut, onUpgrade, showToast, onEditSubs }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username||user?.email?.split("@")[0]||"User");
  const avatarLetter = username[0]?.toUpperCase()||"U";
  const totalRatings = Object.keys(userRatings).length;

  const saveUsername = async () => {
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (!error) { showToast("Username updated!"); setEditing(false); }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:480,border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,rgba(124,58,237,.3),rgba(245,197,24,.1))",padding:"28px 28px 24px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,.4)",border:"none",borderRadius:10,color:"#fff",width:32,height:32,fontSize:16}}>✕</button>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,border:"3px solid rgba(245,197,24,.4)"}}>{avatarLetter}</div>
            <div>
              {editing
                ? <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input value={username} onChange={e=>setUsername(e.target.value)} autoFocus style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:15,fontFamily:"var(--font-head)",fontWeight:700,outline:"none",width:180}} />
                    <button onClick={saveUsername} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 12px",fontWeight:700,fontSize:12}}>Save</button>
                  </div>
                : <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>{username}</div>
                    <button onClick={()=>setEditing(true)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,color:"var(--muted)",padding:"3px 8px",fontSize:11}}>✏️ Edit</button>
                  </div>
              }
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4}}>{user?.email}</div>
              {tier==="premium"
                ? <span style={{background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99,fontFamily:"var(--font-head)",display:"inline-block",marginTop:6}}>✦ PREMIUM</span>
                : <span style={{background:"rgba(255,255,255,.1)",color:"var(--muted)",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,display:"inline-block",marginTop:6}}>FREE</span>
              }
            </div>
          </div>
        </div>
        <div style={{padding:"20px 28px 28px",display:"flex",flexDirection:"column",gap:20}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[["♥",watchlist.length,"Watchlist"],["★",totalRatings,"Rated"],["📧",user?.email?.split("@")[0]||"—","Account"]].map(([icon,val,label])=>(
              <div key={label} style={{background:"rgba(255,255,255,.04)",borderRadius:12,padding:"14px 10px",textAlign:"center",border:"1px solid var(--border)"}}>
                <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,color:"var(--gold)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>
          <button onClick={onEditSubs} style={{background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:12,color:"var(--text)",padding:"12px 0",fontWeight:600,fontSize:14}}>⚙️ Manage Subscriptions</button>
          {tier!=="premium" && <button onClick={()=>{onUpgrade();onClose();}} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>Upgrade to Premium ✦</button>}
          <button onClick={onSignOut} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,color:"var(--danger)",padding:"12px 0",fontWeight:600,fontSize:14}}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// ─── MOVIE MODAL ──────────────────────────────────────────────────────────────
function MovieModal({ movie, watchlist, userRatings, myVotes, user, onClose, onRate, onToggleWatchlist, onVote, showToast }) {
  const [tab, setTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [details, setDetails] = useState(null);
  const [rating, setRating] = useState(userRatings[movie.id]||0);
  const [revTitle, setRevTitle] = useState("");
  const [revContent, setRevContent] = useState("");
  const [revRating, setRevRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const inWL = watchlist.includes(movie.id);
  const providers = movie.providers||[];
  const mainProvider = providers[0];
  const svc = SERVICES.find(s=>s.id===mainProvider);
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;

  useEffect(()=>{
    // Load TMDB details
    const type = movie.first_air_date ? "tv" : "movie";
    tmdbFetch(`/${type}/${movie.id}?append_to_response=credits,similar`).then(d=>setDetails(d));
    // Load reviews from Supabase
    supabase.from("reviews").select("*,profiles(username)").eq("movie_id",movie.id).order("created_at",{ascending:false}).then(({data})=>setReviews(data||[]));
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
  const similar = details?.similar?.results?.slice(0,4)||[];

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
            <a href={svc.url+encodeURIComponent(movie.title||movie.name)} target="_blank" rel="noopener noreferrer"
              onClick={e=>e.stopPropagation()}
              style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:8,background:svc.color,borderRadius:10,color:"#fff",padding:"9px 18px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13}}>
              ▶ Watch on {svc.name}
            </a>
          )}
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"12px 20px 0",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {["overview","cast","reviews"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,padding:"8px 16px",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize"}}>{t}{t==="reviews"&&` (${reviews.length})`}</button>
          ))}
        </div>
        {/* Tab Content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>
          {tab==="overview" && (
            <div>
              <p style={{fontSize:14,lineHeight:1.75,color:"rgba(240,240,250,.8)",marginBottom:20}}>{movie.overview||details?.overview||"No description available."}</p>
              {similar.length>0 && (
                <>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,marginBottom:12,color:"var(--muted)"}}>Similar Titles</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {similar.map(sm=>{
                      const sp=sm.poster_path?`${TMDB_IMG}${sm.poster_path}`:null;
                      return <div key={sm.id} style={{background:"var(--card)",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)"}}>
                        {sp?<img src={sp} alt="" style={{width:"100%",height:80,objectFit:"cover"}} />:<div style={{height:80,background:`linear-gradient(135deg,${GR[sm.id%GR.length][0]},${GR[sm.id%GR.length][1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(sm.title||sm.name||"").slice(0,2)}</div>}
                        <div style={{padding:"6px 8px"}}><div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sm.title||sm.name}</div><div style={{fontSize:10,color:"var(--gold)"}}>★ {sm.vote_average?.toFixed(1)||"—"}</div></div>
                      </div>;
                    })}
                  </div>
                </>
              )}
            </div>
          )}
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
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:480,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {step==="plans"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>Choose Your Plan</div>
              <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
              <div style={{border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:18}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,marginBottom:4}}>Free</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,color:"var(--muted)",marginBottom:14}}>$0</div>
                {["Search millions of titles","Community ratings & reviews","Watchlist (up to 10)","Deep links to services","Ads included"].map(f=><div key={f} style={{display:"flex",gap:8,alignItems:"center",fontSize:13,color:"var(--muted)",marginBottom:8}}><span>○</span>{f}</div>)}
              </div>
              <div style={{border:"2px solid var(--gold)",borderRadius:"var(--radius)",padding:18,background:"rgba(245,197,24,.04)",position:"relative"}}>
                <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:99,fontFamily:"var(--font-head)"}}>BEST VALUE</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,marginBottom:4}}>Premium</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:26,color:"var(--gold)",marginBottom:14}}>$9.99<span style={{fontSize:14,fontWeight:400}}>/mo</span></div>
                {["Everything in Free","AI Recommendations","Ad-free experience","Unlimited watchlist","Priority support","Early access"].map(f=><div key={f} style={{display:"flex",gap:8,alignItems:"center",fontSize:13,marginBottom:8}}><span style={{color:"var(--gold)"}}>✓</span>{f}</div>)}
              </div>
            </div>
            <button onClick={()=>setStep("pay")} style={{width:"100%",background:"var(--gold)",border:"none",borderRadius:"var(--radius)",color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>Upgrade to Premium →</button>
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
    <div style={{position:"relative",height:520,overflow:"hidden",cursor:"pointer"}} onClick={()=>onSelect(movie)}>
      {backdrop && <img src={backdrop} alt="" onLoad={()=>setLoaded(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:loaded?.55:.2,transition:"opacity 1s"}} />}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(7,7,14,.95) 0%,rgba(7,7,14,.6) 50%,rgba(7,7,14,.2) 100%)"}} />
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,var(--bg) 0%,transparent 40%)"}} />
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
          <div style={{display:"flex",gap:12}}>
            <button onClick={e=>{e.stopPropagation();onSelect(movie);}} style={{background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:"13px 28px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",gap:8}}>▶ Watch Now</button>
            <button onClick={e=>{e.stopPropagation();onToggleWatchlist(movie.id);}} style={{background:inWL?"rgba(245,197,24,.2)":"rgba(255,255,255,.08)",border:`1px solid ${inWL?"var(--gold)":"rgba(255,255,255,.15)"}`,borderRadius:12,color:inWL?"var(--gold)":"#fff",padding:"13px 24px",fontWeight:700,fontSize:15}}>
              {inWL?"♥ Saved":"♡ Save"}
            </button>
          </div>
        </div>
        {poster && <img src={poster} alt={title} style={{marginLeft:"auto",height:340,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,.8)",objectFit:"cover",flexShrink:0}} />}
      </div>
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

// ─── MOBILE COMPONENTS ────────────────────────────────────────────────────────
function useIsMobile() {
  const [m,setM]=useState(()=>window.innerWidth<=768);
  useEffect(()=>{const fn=()=>setM(window.innerWidth<=768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  return m;
}

function MobileBottomNav({ view, setView, watchlist, onProfile }) {
  const tabs=[{id:"trending",icon:"🔥",label:"Trending"},{id:"movies",icon:"🎬",label:"Movies"},{id:"tv",icon:"📺",label:"TV"},{id:"watchlist",icon:"♥",label:"Watchlist"},{id:"profile_tab",icon:"👤",label:"Profile"}];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(7,7,14,.97)",borderTop:"1px solid var(--border)",display:"flex",backdropFilter:"blur(20px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {tabs.map(t=>{
        const active=t.id==="profile_tab"?false:view===t.id;
        const count=t.id==="watchlist"&&watchlist.length>0?watchlist.length:0;
        return <button key={t.id} onClick={()=>t.id==="profile_tab"?onProfile():setView(t.id)}
          style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active?"var(--gold)":"var(--muted)",position:"relative"}}>
          <span style={{fontSize:18,lineHeight:1}}>{t.icon}</span>
          <span style={{fontSize:9,fontWeight:700,fontFamily:"var(--font-head)"}}>{t.label}</span>
          {count>0&&<span style={{position:"absolute",top:6,left:"50%",marginLeft:4,background:"var(--gold)",color:"#000",borderRadius:99,minWidth:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{count}</span>}
          {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2,background:"var(--gold)",borderRadius:99}}/>}
        </button>;
      })}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function StreamHub() {
  const isMobile = useIsMobile();

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
  const [showSetup, setShowSetup] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tier, setTier] = useState("free");
  const [toast, setToast] = useState(null);
  const [filterPlat, setFilterPlat] = useState(null);
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
      await supabase.from("profiles").insert({ id:u.id, username:u.email.split("@")[0], tier:"free" });
      prof = { id:u.id, username:u.email.split("@")[0], tier:"free" };
    }
    setProfile(prof);
    setTier(prof.tier||"free");
    // Load watchlist
    const { data:wl } = await supabase.from("watchlist").select("movie_id").eq("user_id",u.id);
    setWatchlist((wl||[]).map(w=>w.movie_id));
    // Load ratings
    const { data:rt } = await supabase.from("ratings").select("movie_id,rating").eq("user_id",u.id);
    const ratMap = {};
    (rt||[]).forEach(r=>ratMap[r.movie_id]=r.rating);
    setUserRatings(ratMap);
  };

  // ── Fetch featured rows for homepage ──
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const [trendData, newData, topData, animeData] = await Promise.all([
          tmdbFetch("/trending/all/week?language=en-US&page=1"),
          tmdbFetch("/movie/now_playing?language=en-US&page=1"),
          tmdbFetch("/movie/top_rated?language=en-US&page=1"),
          tmdbFetch("/discover/tv?with_keywords=210024&sort_by=popularity.desc&language=en-US&page=1"),
        ]);
        const addProviders = async (items, category) => {
          return Promise.all((items||[]).slice(0,20).map(async m => {
            const type = m.media_type==="tv"||(m.first_air_date&&!m.release_date)?"tv":"movie";
            try { const wp=await tmdbFetch(`/${type}/${m.id}/watch/providers`); return {...m,providers:getProviders(wp),category}; }
            catch { return {...m,providers:[],category}; }
          }));
        };
        const [trending,newReleases,topRated,anime] = await Promise.all([
          addProviders(trendData.results,"trending"),
          addProviders(newData.results,"movies"),
          addProviders(topData.results,"movies"),
          addProviders(animeData.results,"anime"),
        ]);
        setFeaturedRows({ trending, newReleases, topRated, anime, sports:[] });
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
      watchlist: null,
    };
    const path = viewMap[view];
    if (!path) { setLoading(false); return; }
    setLoading(true);
    tmdbFetch(`${path}&language=en-US&page=1`).then(async data => {
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

  // ── Search ──
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
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
      setSearching(false);
    }, 500);
  }, [search]);

  // ── Watchlist ──
  const toggleWatchlist = async (movieId) => {
    if (!user) return showToast("Sign in to save! 👤");
    const inWL = watchlist.includes(movieId);
    if (inWL) {
      setWatchlist(prev=>prev.filter(x=>x!==movieId));
      await supabase.from("watchlist").delete().eq("user_id",user.id).eq("movie_id",movieId);
      showToast("Removed from watchlist");
    } else {
      setWatchlist(prev=>[...prev,movieId]);
      await supabase.from("watchlist").insert({user_id:user.id,movie_id:movieId});
      showToast("Added to watchlist ♥");
    }
  };

  const handleRate = (movieId, val) => {
    setUserRatings(p=>({...p,[movieId]:val}));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
    showToast("Signed out 👋");
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
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",padding:"0 14px",height:56,gap:10}}>
            <Logo size={22} />
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontSize:14}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search any movie, show…"
                style={{width:"100%",background:"rgba(255,255,255,.07)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"8px 12px 8px 32px",fontSize:13,outline:"none"}} />
            </div>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:99,fontFamily:"var(--font-head)"}}>✦ PRO</span>
              :<button onClick={()=>setShowUpgrade(true)} style={{background:"var(--gold)",border:"none",borderRadius:9,color:"#000",padding:"7px 10px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,whiteSpace:"nowrap"}}>Upgrade ✦</button>
            }
            <AvatarButton />
          </div>
          {/* Category tabs */}
          <div style={{overflowX:"auto",padding:"0 14px 10px",display:"flex",gap:8,scrollbarWidth:"none"}}>
            {CATEGORY_TABS.map(tab=>{
              const active=view===tab.id;
              return <button key={tab.id} onClick={()=>{setView(tab.id);setSearch("");}} style={{background:active?`${tab.color}18`:"rgba(255,255,255,.04)",border:`1px solid ${active?`${tab.color}55`:"var(--border)"}`,borderRadius:20,color:active?tab.color:"var(--muted)",padding:"6px 14px",fontSize:12,fontWeight:700,fontFamily:"var(--font-head)",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}><span>{tab.icon}</span>{tab.label}</button>;
            })}
          </div>
          {/* Service filter chips */}
          <div style={{overflowX:"auto",padding:"0 14px 10px",display:"flex",gap:6,scrollbarWidth:"none"}}>
            <button onClick={()=>setFilterPlat(null)} style={{background:!filterPlat?"var(--gold)":"rgba(255,255,255,.05)",border:`1px solid ${!filterPlat?"var(--gold)":"var(--border)"}`,borderRadius:99,color:!filterPlat?"#000":"var(--muted)",padding:"5px 14px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>All</button>
            {SERVICES.map(s=>{
              const active=filterPlat===s.id;
              return <button key={s.id} onClick={()=>setFilterPlat(active?null:s.id)} style={{background:active?`${s.color}30`:"rgba(255,255,255,.04)",border:`1px solid ${active?s.color:"rgba(255,255,255,.07)"}`,borderRadius:99,color:active?"#fff":"var(--muted)",padding:"5px 12px",fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
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

        {/* Mobile Hero + Featured Rows for trending */}
        {view==="trending"&&!search.trim() ? (
          <div>
            {/* Mobile Hero */}
            {heroMovie && (
              <div style={{margin:"0 14px 20px",borderRadius:16,overflow:"hidden",position:"relative",height:220,cursor:"pointer"}} onClick={()=>setSelectedMovie(heroMovie)}>
                {heroMovie.backdrop_path && <img src={`https://image.tmdb.org/t/p/w780${heroMovie.backdrop_path}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.5}} />}
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(7,7,14,.95) 0%,transparent 60%)"}} />
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 16px 16px"}}>
                  <div style={{fontSize:9,fontWeight:800,color:"var(--gold)",letterSpacing:1,marginBottom:6}}>🔥 FEATURED</div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:6}}>{heroMovie.title||heroMovie.name}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:"var(--gold)",fontSize:12}}>★ {heroMovie.vote_average?.toFixed(1)}</span>
                    {(heroMovie.providers||[]).slice(0,2).map(p=><ServiceBadge key={p} platformId={p} small />)}
                  </div>
                </div>
              </div>
            )}
            {/* Mobile Featured Rows */}
            {[
              {title:"Trending",icon:"🔥",key:"trending",color:"var(--gold)"},
              {title:"New in Cinemas",icon:"🎬",key:"newReleases",color:"var(--cyan)"},
              {title:"Top Rated",icon:"⭐",key:"topRated",color:"var(--purple)"},
              {title:"Anime",icon:"⚔️",key:"anime",color:"var(--anime)"},
            ].map(row=>(
              <div key={row.key} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 14px",marginBottom:10}}>
                  <span>{row.icon}</span>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:row.color}}>{row.title}</div>
                </div>
                <div style={{display:"flex",gap:10,overflowX:"auto",padding:"2px 14px 4px",scrollbarWidth:"none"}}>
                  {(featuredRows[row.key]||[]).slice(0,10).map(m=>(
                    <div key={m.id} style={{flexShrink:0,width:130}}>
                      <MovieCard movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} />
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
                : filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>)
            }
          </div>
        )}

        <MobileBottomNav view={view} setView={v=>{setView(v);setSearch("");}} watchlist={watchlist} onProfile={()=>user?setShowProfile(true):setShowAuth(true)} />
      </div>

      {/* Modals */}
      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={setUserSubs} onClose={()=>setShowSetup(false)} isFirst={true}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </>
  );

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        {/* Header */}
        <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,7,14,.88)",backdropFilter:"blur(16px)",borderBottom:"1px solid var(--border)",padding:"0 24px",height:64,display:"flex",alignItems:"center",gap:16}}>
          <Logo size={28} />
          <nav style={{display:"flex",gap:4,marginLeft:16}}>
            {CATEGORY_TABS.filter(t=>t.id!=="search").map(t=>(
              <button key={t.id} onClick={()=>{setView(t.id);setSearch("");}} style={{background:view===t.id?`${t.color}15`:"none",border:"none",color:view===t.id?t.color:"var(--muted)",fontFamily:"var(--font-head)",fontWeight:600,fontSize:14,padding:"6px 14px",borderRadius:9,transition:"all .2s"}}>{t.icon} {t.label}</button>
            ))}
          </nav>
          <div style={{flex:1,maxWidth:400,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontSize:15}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search any movie, show, sport…"
              style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:11,color:"var(--text)",padding:"9px 14px 9px 36px",fontSize:14,outline:"none"}} />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto"}}>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:99,fontFamily:"var(--font-head)"}}>✦ PREMIUM</span>
              :<button onClick={()=>setShowUpgrade(true)} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"7px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13}}>Upgrade ✦</button>
            }
            {!user
              ? <button onClick={()=>setShowAuth(true)} style={{background:"rgba(255,255,255,.08)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"7px 16px",fontWeight:600,fontSize:13}}>Sign In</button>
              : <AvatarButton />
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
                <HeroBanner movie={heroMovie} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <div style={{paddingTop:32}}>
                  <FeaturedRow title="Trending This Week" icon="🔥" movies={featuredRows.trending} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--gold)" />
                  <FeaturedRow title="New in Cinemas" icon="🎬" movies={featuredRows.newReleases} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--cyan)" />
                  <FeaturedRow title="Top Rated All Time" icon="⭐" movies={featuredRows.topRated} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--purple)" />
                  <FeaturedRow title="Anime" icon="⚔️" movies={featuredRows.anime} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist} color="var(--anime)" />
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
                  {!user&&<button onClick={()=>setShowAuth(true)} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"8px 18px",fontWeight:700,fontSize:13}}>👤 Sign in to save watchlist</button>}
                </div>
                {loading&&!search
                  ? <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
                  : filtered.length===0
                    ? <div style={{textAlign:"center",color:"var(--muted)",padding:"80px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty. Click ♡ to save titles!":"No results found."}</div>
                    : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>
                        {filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={setSelectedMovie} onToggleWatchlist={toggleWatchlist}/>)}
                      </div>
                }
              </>
            )}
          </main>

          {/* Right Sidebar */}
          <aside style={{width:220,flexShrink:0}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:12,fontFamily:"var(--font-head)"}}>🔥 DEALS</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {unsubscribed.filter(s=>s.deal).map(s=>(
                  <div key={s.id} style={{background:"rgba(245,197,24,.06)",border:"1px solid rgba(245,197,24,.2)",borderRadius:"var(--radius)",padding:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{background:s.color,borderRadius:5,width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{s.logo}</span>
                      <span style={{fontWeight:700,fontSize:13}}>{s.name}</span>
                    </div>
                    <div style={{fontSize:11,color:"var(--gold)",fontWeight:600,marginBottom:8}}>{s.deal}</div>
                    <button style={{width:"100%",background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 0",fontSize:11,fontWeight:800}}>Get Deal →</button>
                  </div>
                ))}
              </div>
            </div>
            {!user&&(
              <div style={{background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.25)",borderRadius:"var(--radius)",padding:16,marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:8}}>👤</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:6}}>Create an Account</div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>Save your watchlist, write reviews and sync across devices.</div>
                <button onClick={()=>setShowAuth(true)} style={{width:"100%",background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 0",fontWeight:700,fontSize:13}}>Sign Up Free</button>
              </div>
            )}
            {tier==="free"&&<div style={{background:"rgba(255,255,255,.03)",border:"1px dashed rgba(255,255,255,.1)",borderRadius:"var(--radius)",padding:16,textAlign:"center"}}><div style={{fontSize:9,color:"var(--muted)",marginBottom:8,letterSpacing:1}}>ADVERTISEMENT</div><div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>🍿 3 months of Hulu for the price of 1. <span style={{color:"var(--gold)",fontWeight:700}}>Claim Now →</span></div></div>}
          </aside>
        </div>
      </div>

      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={setUserSubs} onClose={()=>setShowSetup(false)} isFirst={true}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </>
  );
}
       