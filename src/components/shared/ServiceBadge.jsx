import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SERVICES } from "../../data/constants.js";
function ServiceBadge({ platformId, small }) {
  const s = SERVICES.find(sv=>sv.id===platformId);
  if (!s) return null;
  return <span style={{background:s.color,color:"#fff",fontFamily:"var(--font-head)",fontWeight:700,fontSize:small?9:11,padding:small?"2px 5px":"3px 8px",borderRadius:6,letterSpacing:.5,whiteSpace:"nowrap"}}>{s.name}</span>;
}

// ─── STAR PICKER ──────────────────────────────────────────────────────────────

export { ServiceBadge };
