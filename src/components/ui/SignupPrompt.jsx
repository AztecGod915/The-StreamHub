import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function SignupPrompt({ onSignup, onDismiss, searchesUsed }) {
  return (
    <div style={{
      position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)",
      zIndex:290, width:"calc(100% - 28px)", maxWidth:460,
      background:"linear-gradient(135deg,rgba(10,8,26,.98),rgba(18,10,36,.98))",
      border:"1px solid rgba(245,158,11,.4)",
      borderRadius:20, padding:"20px",
      boxShadow:"0 20px 60px rgba(0,0,0,.8), 0 0 40px rgba(245,158,11,.1)",
      animation:"fadeUp .4s cubic-bezier(.22,1,.36,1)",
    }}>
      <button onClick={onDismiss} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:"rgba(240,240,250,.25)",fontSize:16,cursor:"pointer"}}>✕</button>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <img src="/logo-clean.png" alt="" onError={e=>e.target.style.display="none"}
          style={{height:44,width:"auto",objectFit:"contain",flexShrink:0,filter:"drop-shadow(0 0 10px rgba(245,158,11,.5))"}} />
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
          {icon:"🆕", text:"New Releases Alert",     color:"var(--purple)"},
        ].map((b,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"9px 10px"}}>
            <span style={{fontSize:16,color:b.color}}>{b.icon}</span>
            <span style={{fontSize:11,fontWeight:600,color:"rgba(240,240,250,.8)",lineHeight:1.3}}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onSignup} style={{flex:1,background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 6px 20px rgba(245,158,11,.3)"}}>
          🚀 Sign Up Free
        </button>
        <button onClick={onDismiss} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"rgba(240,240,250,.35)",padding:"12px 16px",fontSize:13,cursor:"pointer"}}>Later</button>
      </div>
    </div>
  );
}

// ─── PERSONALIZED AI RECOMMENDATIONS ─────────────────────────────────────────

export { SignupPrompt };
