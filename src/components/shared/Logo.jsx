import { useState, useEffect, useRef, useCallback, useMemo } from "react";
const GR = [
  ["#1A1030","#8B5CF6"],["#0D1030","#6366f1"],["#180A36","#8B5CF6"],
  ["#1a1000","#F59E0B"],["#1C0C38","#A855F7"],["#0D1030","#8B5CF6"],
  ["#1f1200","#F59E0B"],["#001f0d","#10b981"],["#1a0a0a","#ef4444"],
  ["#1A1030","#8B5CF6"],["#1a1000","#F59E0B"],["#0D1030","#A855F7"],
];
// Safe gradient accessor — always returns a valid pair
const safeGR = (id) => GR[((id||0) % GR.length + GR.length) % GR.length] || GR[0];

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
              filter:"drop-shadow(0 0 12px rgba(245,158,11,.5)) drop-shadow(0 0 24px rgba(139,92,246,.3))",
              animation:"logoPulse 2.5s ease-in-out infinite",
            }}
          />
        ) : (
          <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:size*0.65,letterSpacing:"-.02em"}}>
            <span style={{background:"linear-gradient(90deg,#B45309,#F59E0B,#B45309)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>The Stream</span>
            <span style={{background:"linear-gradient(90deg,#8B5CF6,#a855f7,#8B5CF6)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradientShift 2s linear infinite"}}>Hub</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── SERVICE BADGE ────────────────────────────────────────────────────────────

export { safeGR, Logo };
