import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function InstallPrompt({ onDismiss }) {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (
    <div style={{
      position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)",
      zIndex:350, width:"calc(100% - 28px)", maxWidth:400,
      background:"linear-gradient(135deg,rgba(9,7,15,.98),rgba(12,8,28,.98))",
      border:"1px solid rgba(139,92,246,.4)",
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
        <div style={{fontSize:12,color:"rgba(240,240,250,.6)",lineHeight:1.7,background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"10px 12px"}}>
          Tap <strong style={{color:"#fff"}}>Share</strong> → <strong style={{color:"#fff"}}>"Add to Home Screen"</strong> to install The StreamHub on your iPhone
        </div>
      ) : (
        <div style={{fontSize:12,color:"rgba(240,240,250,.6)",lineHeight:1.7,background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"10px 12px"}}>
          Tap <strong style={{color:"#fff"}}>⋮ Menu</strong> → <strong style={{color:"#fff"}}>"Add to Home Screen"</strong> to install The StreamHub
        </div>
      )}
    </div>
  );
}

// ─── SKELETON CARD (outside component to prevent remount) ───────────────────
function SkeletonCard() {
  return (
    <div style={{borderRadius:"var(--radius)",overflow:"hidden",border:"1px solid var(--border)"}}>
      <div className="skeleton" style={{height:200}} />
      <div style={{padding:"10px 12px 12px",background:"var(--card)"}}>
        <div className="skeleton" style={{height:14,marginBottom:8,width:"80%"}} />
        <div className="skeleton" style={{height:11,width:"50%"}} />
      </div>
    </div>
  );
}

// ─── DEEP LINK HELPER ────────────────────────────────────────────────────────
// App URL schemes for mobile — tries to open the native app first,

export { InstallPrompt, SkeletonCard };
