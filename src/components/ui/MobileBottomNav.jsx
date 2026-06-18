import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

function MobileBottomNav({ view, setView, watchlist, onProfile, tier }) {
  const tabs=[
    {id:"movies",    icon:"🎬", label:"Movies",  color:"#06B6D4", anim:null},
    {id:"tv",        icon:"📺", label:"TV",      color:"#A78BFA", anim:"tvFlicker"},
    {id:"sports",    icon:"🏆", label:"Sports",  color:"#10B981", anim:"trophyBounce"},
    {id:"watchlist", icon:"❤️", label:"Saved",   color:"#ef4444", anim:null},
    {id:"stats",     icon:"📊", label:"Stats",   color:"#10B981", anim:null},
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(9,7,15,.98)",borderTop:"1px solid rgba(255,255,255,.08)",display:"flex",backdropFilter:"blur(20px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {tabs.map(t=>{
        const active = view===t.id;
        const count = t.id==="watchlist"&&watchlist.length>0 ? watchlist.length : 0;
        return (
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active?t.color:"rgba(240,240,250,.38)",position:"relative",transition:"color .2s",cursor:"pointer"}}>
            {/* Active background pill */}
            {active && <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",width:40,height:32,borderRadius:10,background:`${t.color}14`,pointerEvents:"none"}}/>}
            <span style={{
              fontSize:21, lineHeight:1,
              filter:active?`drop-shadow(0 0 8px ${t.color}cc)`:"none",
              transition:"filter .2s", display:"inline-block",
              animation:active&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none",
              position:"relative", zIndex:1,
            }}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:800,fontFamily:"var(--font-head)",letterSpacing:.3,position:"relative",zIndex:1}}>{t.label}</span>
            {count>0&&<span style={{position:"absolute",top:4,left:"50%",marginLeft:7,background:"#ef4444",color:"#fff",borderRadius:99,minWidth:16,height:16,fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",boxShadow:"0 0 6px rgba(239,68,68,.6)"}}>{count>99?"99+":count}</span>}
            {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2.5,background:t.color,borderRadius:99,boxShadow:`0 0 8px ${t.color}`}}/>}
          </button>
        );
      })}
      {/* Profile button */}
      <button onClick={onProfile}
        style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:"rgba(240,240,250,.38)",cursor:"pointer",position:"relative"}}>
        {tier==="premium" && <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",width:40,height:32,borderRadius:10,background:"rgba(245,158,11,.08)",pointerEvents:"none"}}/>}
        <span style={{fontSize:21,lineHeight:1,position:"relative",zIndex:1}}>👤</span>
        <span style={{fontSize:9,fontWeight:800,fontFamily:"var(--font-head)",letterSpacing:.3,position:"relative",zIndex:1}}>Profile</span>
        {tier==="premium" && <div style={{position:"absolute",top:3,right:"calc(50% - 18px)",width:7,height:7,borderRadius:"50%",background:"var(--gold)",boxShadow:"0 0 5px var(--gold)"}}/>}
      </button>
    </div>
  );
}

export { useDevice, useIsMobile, MobileBottomNav };
