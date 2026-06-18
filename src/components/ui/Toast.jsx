import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function Toast({ msg, onDone }) {
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[]);
  return <div style={{position:"fixed",bottom:24,right:24,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"12px 20px",zIndex:2000,fontWeight:600,fontSize:14,boxShadow:"0 12px 32px rgba(0,0,0,.5)",animation:"slideRight .3s cubic-bezier(.22,1,.36,1) both",display:"flex",alignItems:"center",gap:10}}><span style={{color:"var(--gold)",fontSize:16}}>✦</span>{msg}</div>;
}

export { Toast };
