import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
        --bg:#09070F; --surface:#1A1030; --card:#130E24;
        --border:rgba(139,92,246,0.12); --gold:#F59E0B; --gold-dim:rgba(245,158,11,0.15);
        --purple:#8B5CF6; --cyan:#06B6D4; --anime:#FF6B9D; --sports:#10B981;
        --text:#F0F0FA; --muted:rgba(240,240,250,0.45);
        --danger:#EF4444; --success:#10B981; --radius:14px;
        --font-head:'Syne',sans-serif; --font-body:'Plus Jakarta Sans',sans-serif;
      }
      body { background:var(--bg); color:var(--text); font-family:var(--font-body); -webkit-font-smoothing:antialiased; }
      body::before {
        content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
        background:
          radial-gradient(ellipse 80% 50% at 20% 0%, rgba(139,92,246,0.22) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 10%, rgba(245,158,11,0.08) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 10% 70%, rgba(139,92,246,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 90% 80%, rgba(245,158,11,0.06) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%);
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
      @keyframes spinRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes spin     { to{transform:rotate(360deg)} }
      @keyframes slideRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideDown{ from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      @keyframes logoPulse { 0%,100%{filter:drop-shadow(0 0 0px rgba(245,158,11,0))} 50%{filter:drop-shadow(0 0 14px rgba(245,158,11,0.7))} }
      @keyframes logoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes flameDance { 0%,100%{transform:scale(1) rotate(-8deg)} 25%{transform:scale(1.3) rotate(8deg)} 50%{transform:scale(0.9) rotate(-5deg)} 75%{transform:scale(1.2) rotate(6deg)} }
      @keyframes swordSwing { 0%,100%{transform:rotate(-20deg) scale(1)} 50%{transform:rotate(20deg) scale(1.1)} }
      @keyframes tvFlicker { 0%,88%,92%,100%{opacity:1} 90%{opacity:0.4} }
      @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      @keyframes badgePop { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
      @keyframes trophyBounce { 0%,100%{transform:translateY(0) rotate(-5deg)} 40%{transform:translateY(-6px) rotate(5deg)} 70%{transform:translateY(-3px) rotate(-3deg)} }
      @keyframes sportsGlow { 0%,100%{filter:drop-shadow(0 0 0px rgba(16,185,129,0)) drop-shadow(0 0 0px rgba(245,158,11,0))} 50%{filter:drop-shadow(0 0 8px rgba(16,185,129,.9)) drop-shadow(0 0 16px rgba(245,158,11,.6))} }
      @keyframes liveDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.5} }
      @keyframes sportsTabPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 0 4px rgba(239,68,68,.25)} }
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
// ─── ESPN SPORT ENDPOINT MAP ─────────────────────────────────────────────────

export default GlobalStyles;
