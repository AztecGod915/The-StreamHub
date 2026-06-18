import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem("streamhub_consent"); }
    catch { return false; }
  });
  const [showMore, setShowMore] = useState(false);

  const accept = () => {
    try { localStorage.setItem("streamhub_consent", "accepted"); } catch {}
    setVisible(false);
  };
  const decline = () => {
    try { localStorage.setItem("streamhub_consent", "declined"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:9999,
      background:"rgba(26,16,48,.97)", backdropFilter:"blur(20px)",
      borderTop:"1px solid rgba(139,92,246,.3)",
      boxShadow:"0 -8px 40px rgba(0,0,0,.6)",
      padding:"16px 20px",
      animation:"fadeIn .3s ease",
    }}>
      <div style={{maxWidth:900, margin:"0 auto"}}>
        {!showMore ? (
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:260}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,marginBottom:4}}>
                🍪 We use cookies & data
              </div>
              <div style={{fontSize:12,color:"rgba(240,240,250,.65)",lineHeight:1.5}}>
                We save your preferences, watch history, and usage data to personalise your experience.
                {" "}<button onClick={()=>setShowMore(true)} style={{background:"none",border:"none",color:"var(--purple)",fontSize:12,cursor:"pointer",padding:0,textDecoration:"underline",fontWeight:700}}>More info</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={decline}
                style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"rgba(240,240,250,.6)",padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Decline
              </button>
              <button onClick={accept}
                style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 22px",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(139,92,246,.4)"}}>
                I Agree ✓
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:10}}>What data we collect</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10,marginBottom:14}}>
              {[
                {icon:"🔐",title:"Account data",desc:"Email and username stored securely via Supabase. Required to use the app.",required:true},
                {icon:"📺",title:"Watch activity",desc:"Your watchlist, ratings, and watch history to personalise recommendations.",required:true},
                {icon:"🏆",title:"Favourite teams",desc:"Sports teams you follow, synced across your devices.",required:true},
                {icon:"📊",title:"Analytics",desc:"Anonymous usage data (pages visited, features used) via Google Analytics to improve the app.",required:false},
              ].map(item=>(
                <div key={item.title} style={{background:"rgba(255,255,255,.04)",border:`1px solid rgba(255,255,255,.07)`,borderRadius:10,padding:"10px 12px",display:"flex",gap:10}}>
                  <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                      {item.title}
                      {item.required
                        ? <span style={{fontSize:9,background:"rgba(239,68,68,.2)",color:"#ef4444",borderRadius:99,padding:"1px 5px",fontWeight:800}}>REQUIRED</span>
                        : <span style={{fontSize:9,background:"rgba(139,92,246,.2)",color:"#c4b5fd",borderRadius:99,padding:"1px 5px",fontWeight:800}}>OPTIONAL</span>
                      }
                    </div>
                    <div style={{fontSize:11,color:"rgba(240,240,250,.55)",marginTop:2,lineHeight:1.4}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"rgba(240,240,250,.4)",marginBottom:12}}>
              We never sell your data. You can delete your account and all associated data at any time from your profile settings.
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={decline}
                style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"rgba(240,240,250,.6)",padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Decline optional data
              </button>
              <button onClick={accept}
                style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 22px",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(139,92,246,.4)"}}>
                Accept all & continue ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { CookieConsent };
