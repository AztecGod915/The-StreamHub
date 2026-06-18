import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function getStreak() {
  try {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const data = JSON.parse(localStorage.getItem("streamhub_streak")||"{}");
    if (data.lastVisit===today) return data.streak||1;
    const streak = data.lastVisit===yesterday ? (data.streak||1)+1 : 1;
    localStorage.setItem("streamhub_streak", JSON.stringify({lastVisit:today,streak}));
    return streak;
  } catch { return 1; }
}

function getStreakEmoji(streak) {
  if (streak>=30) return "🏆";
  if (streak>=14) return "🔥";
  if (streak>=7)  return "⚡";
  if (streak>=3)  return "✨";
  return "🌱";
}

// ─── SHARE HELPERS ────────────────────────────────────────────────────────────
async function nativeShare(title, text, url) {
  if (navigator.share) {
    try { await navigator.share({title, text, url}); return true; }
    catch(e) { return false; }
  }
  return false;
}

function getShareLinks(text, url) {
  const encoded = encodeURIComponent(text+" "+url);
  return {
    twitter:   `https://twitter.com/intent/tweet?text=${encoded}`,
    facebook:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    whatsapp:  `https://wa.me/?text=${encoded}`,
    reddit:    `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  };
}

function ShareModal({ title, text, url, onClose }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = url || "https://thestreamhub.app";
  const links = getShareLinks(text, fullUrl);

  const copyLink = () => {
    navigator.clipboard?.writeText(fullUrl+"\n\n"+text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  const tryNativeShare = async () => {
    const shared = await nativeShare(title, text, fullUrl);
    if (shared) onClose();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1400,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:500,border:"1px solid var(--border)",borderBottom:"none",boxShadow:"0 -20px 60px rgba(0,0,0,.6)",overflow:"hidden"}}>
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17}}>Share</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,color:"var(--muted)",width:28,height:28,fontSize:14,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{text}</div>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
          {/* Native share on mobile */}
          {"share" in navigator && (
            <button onClick={tryNativeShare}
              style={{background:"linear-gradient(135deg,var(--purple),#7C3AED)",border:"none",borderRadius:12,color:"#fff",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              📤 Share via Phone
            </button>
          )}
          {/* Platform buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"𝕏 Twitter / X",     href:links.twitter,  color:"#000",   text:"#fff"},
              {label:"💬 WhatsApp",         href:links.whatsapp, color:"#25D366",text:"#fff"},
              {label:"👾 Reddit",           href:links.reddit,   color:"#FF4500",text:"#fff"},
              {label:"📘 Facebook",         href:links.facebook, color:"#1877F2",text:"#fff"},
            ].map(p=>(
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
                style={{background:p.color,borderRadius:10,padding:"10px 0",textAlign:"center",fontSize:12,fontWeight:700,color:p.text,textDecoration:"none",display:"block"}}>
                {p.label}
              </a>
            ))}
          </div>
          {/* Copy link */}
          <button onClick={copyLink}
            style={{background:copied?"rgba(16,185,129,.15)":"rgba(255,255,255,.05)",border:`1px solid ${copied?"rgba(16,185,129,.4)":"var(--border)"}`,borderRadius:10,color:copied?"var(--sports)":"var(--muted)",padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
            {copied?"✅ Copied!":"🔗 Copy Link"}
          </button>
        </div>
        <div style={{height:16}}/>
      </div>
    </div>
  );
}

// ─── DAILY PICK BANNER ────────────────────────────────────────────────────────

export { getStreak, getStreakEmoji, getShareLinks, ShareModal };
