import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function WelcomeBanner() {
  return (
    <div style={{padding:"12px 14px 4px"}}>
      <div style={{
        background:"linear-gradient(135deg,rgba(139,92,246,.25) 0%,rgba(9,7,15,.9) 40%,rgba(245,158,11,.12) 100%)",
        border:"1px solid rgba(245,158,11,.25)",
        borderRadius:20,
        padding:"20px 20px",
        textAlign:"center",
        position:"relative",
        overflow:"hidden",
        boxShadow:"0 8px 32px rgba(139,92,246,.2), 0 0 0 1px rgba(245,158,11,.08)",
      }}>
        {/* Decorative background orbs */}
        <div style={{position:"absolute",top:-40,left:-40,width:180,height:180,borderRadius:"50%",background:"rgba(139,92,246,.15)",filter:"blur(40px)",pointerEvents:"none"}} />
        <div style={{position:"absolute",bottom:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(245,158,11,.1)",filter:"blur(40px)",pointerEvents:"none"}} />

        {/* Badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.25)",borderRadius:99,padding:"4px 14px",marginBottom:14,fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:.8}}>
          ✦ FREE TO START — NO CREDIT CARD REQUIRED
        </div>

        {/* THE STREAMHUB — main headline */}
        <div style={{marginBottom:12}}>
          <div style={{
            fontFamily:"var(--font-head)", fontWeight:900,
            lineHeight:1, letterSpacing:"-.03em",
            marginBottom:4,
          }}>
            <span style={{
              background:"linear-gradient(90deg,rgba(255,255,255,.7),rgba(255,255,255,.9))",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              fontSize:"clamp(16px,3.5vw,32px)", fontWeight:800, letterSpacing:".05em",
              display:"block", marginBottom:-2,
            }}>THE</span>
            <span style={{
              fontSize:"clamp(32px,8vw,72px)",
              background:"linear-gradient(90deg,#F59E0B 0%,#FBBF24 40%,#ffffff 60%,#E9D5FF 80%,#C4B5FD 100%)",
              backgroundSize:"200% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 3s linear infinite",
              filter:"drop-shadow(0 0 20px rgba(245,158,11,.6))",
              display:"inline",
            }}>Stream</span><span style={{
              fontSize:"clamp(32px,8vw,72px)",
              background:"linear-gradient(90deg,#8B5CF6,#a78bfa,#8B5CF6)",
              backgroundSize:"200% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 3s linear infinite reverse",
              filter:"drop-shadow(0 0 20px rgba(139,92,246,.8))",
              display:"inline",
            }}>Hub</span>
          </div>
        </div>

        {/* Subtext */}
        <div style={{fontSize:"clamp(11px,2vw,15px)",color:"rgba(240,240,250,.55)",maxWidth:580,margin:"0 auto 16px",lineHeight:1.7}}>
          Searches Netflix, Disney+, Max, Hulu, Crunchyroll, ESPN+, Tubi and more — all at once.
        </div>

        {/* Service dots */}
        <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
          {[
            {name:"Netflix",color:"#E50914"},
            {name:"Disney+",color:"#0063E5"},
            {name:"Max",color:"#002BE7"},
            {name:"Hulu",color:"#1CE783"},
            {name:"Prime",color:"#8B5CF6"},
            {name:"Crunchyroll",color:"#F47521"},
            {name:"ESPN+",color:"#E31837"},
            {name:"Tubi",color:"#A855F7"},
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
        background:"linear-gradient(135deg,#120930,#1A1038)",
        border:"1px solid rgba(245,158,11,.4)",
        borderRadius:24, padding:"36px 32px", maxWidth:420, width:"100%",
        boxShadow:"0 32px 80px rgba(0,0,0,.8), 0 0 60px rgba(245,158,11,.1)",
        textAlign:"center", animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
      }}>
        {/* Logo */}
        <img src="/logo-clean.png" alt="" onError={e=>e.target.style.display="none"}
          style={{height:80,width:"auto",objectFit:"contain",marginBottom:20,filter:"drop-shadow(0 0 20px rgba(245,158,11,.5))"}} />

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
            {icon:"🆕", title:"New Releases",       desc:"Fresh drops on your services"},
            {icon:"⭐", title:"Ratings & Reviews",  desc:"Rate and review any title"},
          ].map((b,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:i<4?14:0}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{b.icon}</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,color:"var(--text)"}}>{b.title}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{b.desc}</div>
              </div>
              <div style={{marginLeft:"auto",color:"var(--sports)",fontSize:14}}>✓</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onSignup} style={{width:"100%",background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:14,color:"#000",padding:"15px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,cursor:"pointer",marginBottom:10,boxShadow:"0 8px 24px rgba(245,158,11,.35)"}}>
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

export { WelcomeBanner, getSearchCount, incrementSearchCount, resetSearchCount, SearchLimitWall };
