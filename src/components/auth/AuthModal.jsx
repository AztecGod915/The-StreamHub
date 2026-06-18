import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { Logo } from "../shared/Logo.jsx";
function AuthModal({ onClose, showToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inp = {background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",padding:"11px 14px",width:"100%",fontSize:14,outline:"none",fontFamily:"var(--font-body)"};

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ username } } });
        if (error) throw error;
        showToast("Account created! Check your email to verify. ✉️");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("Welcome back! 👋");
        onClose();
      }
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:420,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <Logo size={28} />
            <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:20}}>✕</button>
          </div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:6}}>{mode==="login"?"Welcome back":"Create account"}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>{mode==="login"?"Sign in to sync your watchlist & reviews":"Join StreamHub — it's free"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {mode==="signup" && <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" style={inp} />}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={inp} />
          </div>
          {err && <div style={{color:"var(--danger)",fontSize:12,marginBottom:12}}>{err}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:"var(--gold)",border:"none",borderRadius:12,color:"#000",padding:14,fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<span style={{display:"inline-block",width:18,height:18,border:"2px solid #000",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:null}
            {mode==="login"?"Sign In":"Create Account"}
          </button>
          <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"var(--muted)"}}>
            {mode==="login"?"Don't have an account?":"Already have an account?"}
            <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}} style={{background:"none",border:"none",color:"var(--gold)",fontWeight:700,fontSize:13,marginLeft:6}}>{mode==="login"?"Sign Up":"Sign In"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AuthModal };
