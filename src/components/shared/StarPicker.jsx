import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function StarPicker({ value, onChange, size=18, readOnly=false }) {
  const [hover, setHover] = useState(0);
  const display = hover||value;
  return (
    <div style={{display:"flex",gap:2}}>
      {Array.from({length:10},(_,i)=>i+1).map(s=>(
        <span key={s} onClick={()=>!readOnly&&onChange(s)}
          onMouseEnter={()=>!readOnly&&setHover(s)} onMouseLeave={()=>!readOnly&&setHover(0)}
          style={{fontSize:size,cursor:readOnly?"default":"pointer",color:s<=display?"#F59E0B":"rgba(255,255,255,0.15)",display:"inline-block",transform:(!readOnly&&hover===s)?"scale(1.3)":"scale(1)",transition:"all .12s",lineHeight:1}}>★</span>
      ))}
    </div>
  );
}

export { StarPicker };
