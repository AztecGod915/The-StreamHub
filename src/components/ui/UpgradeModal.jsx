import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { SERVICES } from "../../data/constants.js";
import { Logo } from "../shared/Logo.jsx";
function UpgradeModal({ onClose, onComplete }) {
  const [step,setStep]=useState("plans");
  const [card,setCard]=useState({name:"",number:"",expiry:"",cvc:""});
  const [loading,setLoading]=useState(false);
  const fmtCard=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?d.slice(0,2)+"/"+d.slice(2):d;};
  const inp={background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",width:"100%",fontSize:14,outline:"none",fontFamily:"var(--font-body)"};
  const handlePay=()=>{
    window.location.href="https://buy.stripe.com/6oU4gzenZcUsbLd16w7EQ00";
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:520,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        {step==="plans"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22}}>Upgrade to Premium</div>
                <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>Unlock the full streaming experience</div>
              </div>
              <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>✕</button>
            </div>

            {/* Comparison */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {/* Free */}
              <div style={{border:"1px solid var(--border)",borderRadius:14,padding:16}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Free Account</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--muted)",marginBottom:14}}>$0</div>
                {[
                  {text:"10 searches/day",      ok:true},
                  {text:"Watchlist (50 titles)", ok:true},
                  {text:"3 AI picks",            ok:true},
                  {text:"Ratings & reviews",     ok:true},
                  {text:"Watch trailers",        ok:true},
                  {text:"Mood Search",           ok:false},
                  {text:"Leaving Soon alerts",   ok:false},
                  {text:"Watch History",         ok:false},
                  {text:"Cost Calculator",       ok:false},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,color:f.ok?"var(--text)":"var(--muted)",marginBottom:7,opacity:f.ok?1:.5}}>
                    <span style={{color:f.ok?"var(--sports)":"rgba(255,255,255,.2)",fontSize:13}}>{f.ok?"✓":"✕"}</span>{f.text}
                  </div>
                ))}
              </div>

              {/* Premium */}
              <div style={{border:"2px solid var(--gold)",borderRadius:14,padding:16,background:"rgba(245,158,11,.04)",position:"relative"}}>
                <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 12px",borderRadius:99,fontFamily:"var(--font-head)",whiteSpace:"nowrap"}}>✦ BEST VALUE</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,marginBottom:2}}>Premium</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,color:"var(--gold)",marginBottom:14}}>$9.99<span style={{fontSize:13,fontWeight:400,color:"var(--muted)"}}>/mo</span></div>
                {[
                  {text:"Unlimited searches",         ok:true},
                  {text:"Unlimited watchlist",        ok:true},
                  {text:"12 AI picks",                ok:true},
                  {text:"Ratings & reviews",          ok:true},
                  {text:"Watch trailers",             ok:true},
                  {text:"🎭 Mood Search",             ok:true},
                  {text:"🚨 Leaving Soon alerts",     ok:true},
                  {text:"📺 Watch History & Stats",   ok:true},
                  {text:"💰 Cost Calculator",         ok:true},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,marginBottom:7,color:"var(--text)"}}>
                    <span style={{color:"var(--gold)",fontSize:13}}>✓</span>{f.text}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={()=>setStep("pay")} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 24px rgba(245,158,11,.3)"}}>
              Upgrade to Premium — $9.99/mo →
            </button>
            <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginTop:10}}>Cancel anytime · No hidden fees · Secured by Stripe</div>
          </div>
        )}
        {step==="pay"&&(
          <div style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
              <button onClick={()=>setStep("plans")} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:8,color:"var(--text)",width:32,height:32,fontSize:16}}>←</button>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20}}>Payment Details</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
              <input value={card.name} onChange={e=>setCard({...card,name:e.target.value})} placeholder="Cardholder name" style={inp} />
              <div style={{position:"relative"}}>
                <input value={card.number} onChange={e=>setCard({...card,number:fmtCard(e.target.value)})} placeholder="1234 5678 9012 3456" style={{...inp,paddingRight:48}} />
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:18}}>💳</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <input value={card.expiry} onChange={e=>setCard({...card,expiry:fmtExp(e.target.value)})} placeholder="MM / YY" style={inp} />
                <input value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value.replace(/\D/g,"").slice(0,3)})} placeholder="CVC" style={inp} />
              </div>
            </div>
            <button onClick={handlePay} disabled={loading} style={{width:"100%",background:loading?"rgba(245,158,11,.5)":"var(--gold)",border:"none",borderRadius:"var(--radius)",color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              {loading?<><span style={{display:"inline-block",width:18,height:18,border:"2px solid #000",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Processing…</>:"Pay $9.99 / month"}
            </button>
            <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginTop:14}}>🔒 Secured by <span style={{color:"#6772e5",fontWeight:700}}>Stripe</span> · SSL Encrypted</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETUP MODAL ──────────────────────────────────────────────────────────────
function SetupModal({ userSubs, onSave, onClose, isFirst }) {
  const [selected, setSelected] = useState(new Set(userSubs));
  const toggle = id => setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  return (
    <div onClick={isFirst?null:onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(12px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:560,border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.9)",overflow:"hidden"}}>
        <div style={{padding:"28px 28px 0"}}>
          <Logo size={28} />
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6,marginTop:16}}>{isFirst?"Welcome! What are you subscribed to?":"Manage Subscriptions"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.6}}>{isFirst?"Pick your services and we'll personalize your experience.":"Toggle the services you currently pay for."}</div>
        </div>
        <div style={{padding:"0 28px",maxHeight:340,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,paddingBottom:24}}>
            {SERVICES.map(s=>{
              const on=selected.has(s.id);
              return <button key={s.id} onClick={()=>toggle(s.id)} style={{background:on?`${s.color}20`:"rgba(255,255,255,.04)",border:`2px solid ${on?s.color:"rgba(255,255,255,.08)"}`,borderRadius:12,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .2s",position:"relative"}}>
                {on&&<span style={{position:"absolute",top:6,right:8,color:s.color,fontSize:14,fontWeight:800}}>✓</span>}
                <span style={{background:on?s.color:"rgba(255,255,255,.12)",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>{s.logo}</span>
                <span style={{fontSize:11,fontWeight:700,color:on?"#fff":"var(--muted)",textAlign:"center"}}>{s.name}</span>
              </button>;
            })}
          </div>
        </div>
        <div style={{padding:"16px 28px 28px",borderTop:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:13,color:"var(--muted)",flex:1}}>{selected.size} service{selected.size!==1?"s":""} selected</span>
          {!isFirst&&<button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:10,color:"var(--text)",padding:"10px 20px",fontSize:14,fontWeight:600}}>Cancel</button>}
          <button onClick={()=>{onSave([...selected]);onClose();}} style={{background:"var(--gold)",border:"none",borderRadius:10,color:"#000",padding:"10px 24px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14}}>{isFirst?"Let's Go →":"Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── HERO BANNER ─────────────────────────────────────────────────────────────

export { UpgradeModal, SetupModal };
