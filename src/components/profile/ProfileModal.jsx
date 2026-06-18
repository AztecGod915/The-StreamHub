import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { ShareModal,  getStreak, getStreakEmoji } from "../shared/ShareModal.jsx";
import { ServiceBadge } from "../shared/ServiceBadge.jsx";
import { StarPicker } from "../shared/StarPicker.jsx";
import { SERVICES } from "../../data/constants.js";
import { TMDB_IMG,  tmdbFetch } from "../../lib/tmdb.js";
import { Logo } from "../shared/Logo.jsx";
function StreakAvatar({ streak, profile, user, size=80 }) {
  const lvl = streak>=30?"legend":streak>=14?"champion":streak>=7?"warrior":streak>=3?"loyal":"newcomer";
  const cfg = {
    newcomer: {ring:"rgba(139,92,246,.4)",  glow:"none",                              badge:"🌱", label:"Newcomer",   color:"#8B5CF6", anim:false},
    loyal:    {ring:"rgba(139,92,246,.85)", glow:"0 0 18px rgba(139,92,246,.5)",      badge:"✨", label:"Loyal Viewer",color:"#C4B5FD", anim:false},
    warrior:  {ring:"rgba(245,158,11,.9)",  glow:"0 0 24px rgba(245,158,11,.55)",     badge:"⚡", label:"Week Warrior", color:"#F59E0B", anim:true},
    champion: {ring:"rgba(239,68,68,.9)",   glow:"0 0 28px rgba(239,68,68,.5)",       badge:"🔥", label:"Binge Champ", color:"#EF4444", anim:true},
    legend:   {ring:"rgba(245,158,11,1)",   glow:"0 0 36px rgba(245,158,11,.7)",      badge:"👑", label:"Legend",      color:"#F59E0B", anim:true},
  }[lvl];
  const initials = (profile?.username||user?.email||"?")[0].toUpperCase();
  const fs = Math.round(size*0.38);
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      {/* Animated glow ring */}
      <div style={{position:"absolute",inset:-3,borderRadius:"50%",border:`2.5px solid ${cfg.ring}`,boxShadow:cfg.glow,animation:cfg.anim?"spinRing 4s linear infinite":undefined,zIndex:0}}/>
      {/* Second ring for legend */}
      {lvl==="legend"&&<div style={{position:"absolute",inset:-7,borderRadius:"50%",border:"1.5px solid rgba(245,158,11,.35)",animation:"spinRing 8s linear infinite reverse",zIndex:0}}/>}
      {/* Avatar circle */}
      <div style={{position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",zIndex:1,background:"var(--surface)"}}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${cfg.ring},rgba(26,16,48,.9))`,fontFamily:"var(--font-head)",fontWeight:900,fontSize:fs,color:"#fff"}}>{initials}</div>
        }
      </div>
      {/* Level badge */}
      <div style={{position:"absolute",bottom:-2,right:-2,width:Math.round(size*0.32),height:Math.round(size*0.32),borderRadius:"50%",background:"var(--bg)",border:`2px solid ${cfg.ring}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.16),zIndex:2}}>
        {cfg.badge}
      </div>
    </div>
  );
}

// ─── STREAK REWARDS MODAL ─────────────────────────────────────────────────────
function StreakRewardsModal({ streak, onClose }) {
  const TIERS = [
    {days:1,  badge:"🌱", title:"Newcomer",     reward:"Your journey begins. Welcome to StreamHub!", color:"#8B5CF6", earned:streak>=1},
    {days:3,  badge:"✨", title:"Loyal Viewer",  reward:"You've built a habit. Personalized picks are sharpening.",color:"#A78BFA",earned:streak>=3},
    {days:7,  badge:"⚡", title:"Week Warrior",  reward:"7 days straight! Your avatar frame unlocks a gold ring.",color:"#F59E0B",earned:streak>=7},
    {days:14, badge:"🔥", title:"Binge Champion", reward:"Two weeks! Your profile glows red — true dedication.",   color:"#EF4444",earned:streak>=14},
    {days:30, badge:"👑", title:"StreamHub Legend",reward:"30 days. You've earned the crown. Rotating gold ring activated.", color:"#F59E0B",earned:streak>=30},
  ];
  const current = [...TIERS].reverse().find(t=>streak>=t.days) || TIERS[0];
  const next    = TIERS.find(t=>streak<t.days);
  const pct     = next ? Math.round((streak/next.days)*100) : 100;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1400,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60,paddingBottom:20,paddingLeft:12,paddingRight:12,overflowY:"auto",backdropFilter:"blur(12px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:420,overflow:"hidden",border:"1px solid rgba(139,92,246,.4)",boxShadow:"0 20px 60px rgba(139,92,246,.3)"}}>
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#1A1030,#0F082A)",padding:"20px 20px 16px",borderBottom:"1px solid rgba(139,92,246,.2)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:18}}>🔥 Viewing Streak</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,color:"var(--muted)",width:28,height:28,fontSize:14,cursor:"pointer"}}>✕</button>
          </div>
          {/* Level previews */}
          <div style={{display:"flex",gap:10,marginBottom:14,justifyContent:"center"}}>
            {[
              {streak:1,  badge:"🌱",label:"New",    days:"Day 1"},
              {streak:3,  badge:"✨",label:"Loyal",  days:"Day 3"},
              {streak:7,  badge:"⚡",label:"Warrior",days:"Day 7"},
              {streak:14, badge:"🔥",label:"Champ",  days:"Day 14"},
              {streak:30, badge:"👑",label:"Legend", days:"Day 30"},
            ].map(t=>{
              const earned=streak>=t.streak;
              const lvl=t.streak>=30?"legend":t.streak>=14?"champion":t.streak>=7?"warrior":t.streak>=3?"loyal":"newcomer";
              const colors={newcomer:"#8B5CF6",loyal:"#C4B5FD",warrior:"#F59E0B",champion:"#EF4444",legend:"#F59E0B"}[lvl];
              return (
                <div key={t.streak} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,opacity:earned?1:.4}}>
                  <div style={{width:44,height:44,borderRadius:"50%",border:`2.5px solid ${colors}`,boxShadow:earned?`0 0 12px ${colors}66`:"none",background:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,position:"relative"}}>
                    {t.badge}
                    {streak===t.streak&&<div style={{position:"absolute",inset:-4,borderRadius:"50%",border:`2px solid ${colors}`,animation:"spinRing 3s linear infinite"}}/>}
                  </div>
                  <div style={{fontSize:8,color:earned?colors:"var(--muted)",fontWeight:800,letterSpacing:.5}}>{t.days}</div>
                  <div style={{fontSize:9,color:"rgba(240,240,250,.5)",fontWeight:600}}>{t.label}</div>
                </div>
              );
            })}
          </div>

          {/* Current streak display */}
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:48,lineHeight:1,background:`linear-gradient(135deg,${current.color},#fff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{streak}</div>
              <div style={{fontSize:10,color:"var(--muted)",fontWeight:700,letterSpacing:.8}}>DAY{streak!==1?"S":""}</div>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:20}}>{current.badge}</span>
                <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,color:current.color}}>{current.title}</span>
              </div>
              <div style={{fontSize:11,color:"rgba(240,240,250,.6)",lineHeight:1.5,maxWidth:200}}>{current.reward}</div>
            </div>
          </div>
          {/* Progress to next tier */}
          {next && (
            <div style={{marginTop:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--muted)",marginBottom:5}}>
                <span>Next: {next.badge} {next.title}</span>
                <span>{streak} / {next.days} days</span>
              </div>
              <div style={{height:6,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:`linear-gradient(90deg,#8B5CF6,${next.color})`,transition:"width .6s ease"}}/>
              </div>
              <div style={{fontSize:10,color:"rgba(240,240,250,.4)",marginTop:4}}>{next.days-streak} more day{next.days-streak!==1?"s":""} to unlock {next.badge} {next.title}</div>
            </div>
          )}
          {!next && <div style={{marginTop:10,fontSize:12,color:"var(--gold)",fontWeight:700}}>👑 Maximum level reached. You are a StreamHub Legend.</div>}
        </div>
        {/* All milestones */}
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:10,fontWeight:800,color:"var(--muted)",letterSpacing:1.2,marginBottom:2}}>ALL MILESTONES</div>
          {TIERS.map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,background:t.earned?"rgba(139,92,246,.08)":"rgba(255,255,255,.02)",border:`1px solid ${t.earned?t.color+"44":"rgba(255,255,255,.06)"}`,opacity:t.earned?1:.55}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:t.earned?`${t.color}22`:"rgba(255,255,255,.05)",border:`2px solid ${t.earned?t.color:"rgba(255,255,255,.1)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {t.earned?t.badge:"🔒"}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:t.earned?t.color:"var(--muted)"}}>{t.title}</span>
                  <span style={{fontSize:9,background:"rgba(255,255,255,.06)",borderRadius:99,padding:"1px 6px",color:"var(--muted)",fontWeight:700}}>Day {t.days}</span>
                  {t.earned&&<span style={{fontSize:9,background:`${t.color}22`,borderRadius:99,padding:"1px 6px",color:t.color,fontWeight:800}}>EARNED ✓</span>}
                </div>
                <div style={{fontSize:11,color:"rgba(240,240,250,.5)",marginTop:2,lineHeight:1.4}}>{t.reward}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"0 16px 16px",fontSize:11,color:"var(--muted)",textAlign:"center",lineHeight:1.6}}>
          Come back every day to keep your streak alive. Missing a day resets your progress.
        </div>
      </div>
    </div>
  );
}

// ─── MANAGE SUBSCRIPTIONS PANEL ───────────────────────────────────────────────
function SubscriptionManagerPanel({ userSubs: initialSubs=[], onToggle, onDone }) {
  const [localSubs, setLocalSubs] = useState(initialSubs);
  const toggleLocal = (id) => setLocalSubs(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const handleDone = () => { onToggle(localSubs); onDone(); };

  // Use price directly from SERVICES (already defined on each service object)
  const subList = SERVICES.filter(s=>localSubs.includes(s.id));
  const totalSubs = subList.length;
  const est = subList.reduce((sum,s) => sum + (s.price||0), 0);

  // Helper: format price nicely
  const fmtPrice = (s) => s.price > 0 ? `$${s.price.toFixed(2)}/mo` : "Free";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0,height:"100%"}}>
      {/* Summary bar */}
      <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,color:"#C4B5FD",marginBottom:2}}>📊 Your Streaming Bill</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>{totalSubs} service{totalSubs!==1?"s":""} active</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,color:"var(--gold)"}}>${est.toFixed(2)}</div>
            <div style={{fontSize:10,color:"var(--muted)"}}>/month est.</div>
          </div>
        </div>
      </div>

      {/* Service list */}
      <div style={{display:"flex",flexDirection:"column",gap:8,flex:1,overflowY:"auto"}}>
        {SERVICES.map(s=>{
          const active=localSubs.includes(s.id);
          return (
            <div key={s.id} onClick={()=>toggleLocal(s.id)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:active?`${s.color}12`:"rgba(255,255,255,.03)",border:`1.5px solid ${active?s.color+"55":"rgba(255,255,255,.07)"}`,cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=active?s.color+"99":"rgba(255,255,255,.15)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=active?s.color+"55":"rgba(255,255,255,.07)"}>
              {/* Logo bubble */}
              <div style={{width:38,height:38,borderRadius:10,background:active?s.color:"rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0,transition:"background .2s"}}>
                {s.logo}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,color:active?"#fff":"var(--muted)"}}>{s.name}</div>
                <div style={{fontSize:11,color:active?"rgba(240,240,250,.6)":"rgba(240,240,250,.3)",marginTop:1}}>{fmtPrice(s)}</div>
              </div>
              {/* Toggle switch */}
              <div style={{width:44,height:24,borderRadius:99,background:active?"var(--gold)":"rgba(255,255,255,.1)",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:active?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 2px 4px rgba(0,0,0,.3)"}}/>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={handleDone}
        style={{marginTop:16,width:"100%",background:"var(--purple)",border:"none",borderRadius:12,color:"#fff",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,cursor:"pointer"}}>
        ✓ Done
      </button>
    </div>
  );
}

function ProfileModal({ user, profile, tier, watchlist, userRatings, userSubs=[], onClose, onSignOut, onUpgrade, showToast, onEditSubs, onSelectMovie, notifPermission, onRequestNotif, streak }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username||user?.email?.split("@")[0]||"User");
  const [tab, setTab] = useState("overview");
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showSubManager, setShowSubManager] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [wlMovies, setWlMovies] = useState([]);
  const [loadingWl, setLoadingWl] = useState(false);
  const [loadingRev, setLoadingRev] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url||null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarLetter = username[0]?.toUpperCase()||"U";
  const totalRatings = Object.keys(userRatings).length;
  const isPremium = tier === "premium";

  const saveUsername = async () => {
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (!error) { showToast("Username updated!"); setEditing(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast("Image must be under 2MB");
    setUploadingAvatar(true);
    try {
      // Convert to base64 and store in profile
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const { error } = await supabase.from("profiles").update({ avatar_url: base64 }).eq("id", user.id);
        if (!error) { setAvatarUrl(base64); showToast("Profile picture updated! 🎉"); }
        else showToast("Failed to update picture");
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch(e) { showToast("Failed to upload"); setUploadingAvatar(false); }
  };

  // Load watchlist movies from TMDB when tab opens
  useEffect(() => {
    if (tab !== "watchlist" || wlMovies.length > 0) return;
    setLoadingWl(true);
    Promise.all(watchlist.slice(0,20).map(async id => {
      try { return await tmdbFetch(`/movie/${id}?language=en-US`).catch(() => tmdbFetch(`/tv/${id}?language=en-US`)); }
      catch { return null; }
    })).then(results => {
      setWlMovies(results.filter(Boolean));
      setLoadingWl(false);
    });
  }, [tab]);

  // Load user's reviews
  useEffect(() => {
    if (tab !== "reviews" || myReviews.length > 0) return;
    setLoadingRev(true);
    supabase.from("reviews").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).then(({data}) => {
      setMyReviews(data||[]);
      setLoadingRev(false);
    });
  }, [tab]);

  const deleteReview = async (id) => {
    await supabase.from("reviews").delete().eq("id", id);
    setMyReviews(prev => prev.filter(r => r.id !== id));
    showToast("Review deleted");
  };

  const tabs = ["overview","watchlist","reviews"];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"90vh",border:"1px solid var(--border)",boxShadow:"0 40px 80px rgba(0,0,0,.8)",overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,rgba(139,92,246,.3),rgba(245,158,11,.1))",padding:"24px 24px 20px",position:"relative",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,.4)",border:"none",borderRadius:10,color:"#fff",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {/* Avatar with upload */}
            {/* Streak avatar — ring glows with level */}
            <div style={{position:"relative",flexShrink:0}}>
              <StreakAvatar streak={streak} profile={{...profile,avatar_url:avatarUrl}} user={user} size={80}/>
              <label style={{position:"absolute",bottom:-2,right:-2,width:22,height:22,borderRadius:"50%",background:"var(--gold)",border:"2px solid var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,boxShadow:"0 2px 8px rgba(0,0,0,.5)",zIndex:10}} title="Change profile picture">
                {uploadingAvatar?"⏳":"📷"}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:"none"}}/>
              </label>
            </div>
            <div>
              {editing
                ? <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input value={username} onChange={e=>setUsername(e.target.value)} autoFocus style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#fff",padding:"6px 10px",fontSize:15,fontFamily:"var(--font-head)",fontWeight:700,outline:"none",width:160}} />
                    <button onClick={saveUsername} style={{background:"var(--gold)",border:"none",borderRadius:8,color:"#000",padding:"6px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Save</button>
                  </div>
                : <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>{username}</div>
                    <button onClick={()=>setEditing(true)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,color:"var(--muted)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✏️</button>
                  </div>
              }
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4}}>{user?.email}</div>
              {tier==="premium"
                ? <span style={{background:"var(--gold)",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99,fontFamily:"var(--font-head)",display:"inline-block",marginTop:6}}>✦ PREMIUM</span>
                : <span style={{background:"rgba(255,255,255,.1)",color:"var(--muted)",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,display:"inline-block",marginTop:6}}>FREE</span>
              }
              {streak>=1 && (
                <button onClick={()=>setShowStreakModal(true)}
                  style={{background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"var(--gold)",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:99,fontFamily:"var(--font-head)",display:"inline-flex",alignItems:"center",gap:4,marginTop:6,marginLeft:6,cursor:"pointer"}}>
                  {getStreakEmoji(streak)} {streak} day streak →
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
            {[["♥",watchlist.length,"Watchlist","watchlist"],["✍",myReviews.length||"—","Reviews","reviews"],["★",totalRatings,"Rated",null]].map(([icon,val,label,t])=>(
              <button key={label} onClick={()=>t&&setTab(t)}
                style={{background:tab===t?"rgba(245,158,11,.12)":"rgba(255,255,255,.06)",borderRadius:10,padding:"10px 8px",textAlign:"center",border:`1px solid ${tab===t?"rgba(245,158,11,.3)":"rgba(255,255,255,.08)"}`,cursor:t?"pointer":"default",transition:"all .2s"}}>
                <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,color:"var(--gold)"}}>{val}</div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:"none",border:"none",color:tab===t?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"12px 0",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"all .2s",textTransform:"capitalize",cursor:"pointer"}}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{overflowY:"auto",flex:1,padding:20}}>

          {/* Overview tab */}
          {tab==="overview" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {showSubManager ? (
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"16px"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,marginBottom:12}}>📡 Manage Subscriptions</div>
                  <SubscriptionManagerPanel
                    userSubs={userSubs}
                    onToggle={(newSubs)=>{/* subs managed locally in panel */}}
                    onDone={()=>setShowSubManager(false)}
                  />
                </div>
              ) : (
                <button onClick={()=>setShowSubManager(true)}
                  style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.3)",borderRadius:12,color:"#C4B5FD",padding:"12px 16px",fontWeight:700,fontSize:14,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>📡</span>
                    <div>
                      <div style={{fontWeight:800,color:"#fff"}}>Manage Subscriptions</div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Add or remove streaming services</div>
                    </div>
                  </div>
                  <span style={{color:"var(--muted)",fontSize:16}}>›</span>
                </button>
              )}
              {tier!=="premium" && <button onClick={()=>{onUpgrade();onClose();}} style={{background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"12px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer"}}>Upgrade to Premium ✦</button>}

              {/* Notification opt-in */}
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:14,padding:"14px 16px",marginTop:4}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:3}}>🔔 Game & Content Alerts</div>
                    <div style={{fontSize:12,color:"var(--muted)"}}>
                      {notifPermission==="granted"
                        ? "✅ Notifications enabled — you'll get game alerts & weekly picks"
                        : notifPermission==="denied"
                          ? "❌ Blocked in browser settings — enable in site permissions"
                          : "Get notified when your team plays & weekly streaming picks"}
                    </div>
                  </div>
                  {notifPermission!=="granted" && notifPermission!=="denied" && (
                    <button onClick={onRequestNotif}
                      style={{background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(6,182,212,.2))",border:"1px solid rgba(16,185,129,.4)",borderRadius:10,color:"var(--sports)",padding:"8px 14px",fontWeight:800,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"var(--font-head)"}}>
                      Enable
                    </button>
                  )}
                </div>
              </div>
              <button onClick={onSignOut} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,color:"var(--danger)",padding:"12px 0",fontWeight:600,fontSize:14,cursor:"pointer"}}>Sign Out</button>
            </div>
          )}

          {/* Watchlist tab */}
          {tab==="watchlist" && (
            <div>
              {loadingWl ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}>
                  <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your watchlist…
                </div>
              ) : watchlist.length === 0 ? (
                <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>Your watchlist is empty. Tap ♡ on any title to save it!</div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {wlMovies.map(m=>{
                    const poster = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null;
                    return (
                      <div key={m.id} onClick={()=>{onSelectMovie(m);onClose();}} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--card)",transition:"transform .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                        {poster ? <img src={poster} alt="" style={{width:"100%",height:110,objectFit:"cover"}}/> : <div style={{height:110,background:`linear-gradient(135deg,#1a1a2e,#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:.3,fontFamily:"var(--font-head)",fontWeight:800}}>{(m.title||m.name||"").slice(0,2)}</div>}
                        <div style={{padding:"6px 8px"}}>
                          <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||m.name}</div>
                          <div style={{fontSize:10,color:"var(--gold)"}}>★ {m.vote_average?.toFixed(1)||"—"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {tab==="reviews" && (
            <div>
              {/* Community reviews header */}
              {reviews.length > 0 && (
                <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>
                    Community Reviews
                    {communityRating && <span style={{color:"#C4B5FD",marginLeft:8,fontSize:13}}>✦ {communityRating.avg} avg · {communityRating.count} rating{communityRating.count!==1?"s":""}</span>}
                  </div>
                </div>
              )}
              {loadingRev ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:10,color:"var(--muted)"}}>
                  <span style={{display:"inline-block",width:20,height:20,border:"2px solid var(--purple)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Loading your reviews…
                </div>
              ) : myReviews.length === 0 ? (
                <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0",fontSize:14}}>You haven't written any reviews yet. Open any title and share your thoughts!</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {myReviews.map(rv=>(
                    <div key={rv.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:10}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:2}}>{rv.title}</div>
                          <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(rv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <span style={{background:"var(--gold-dim)",color:"var(--gold)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>★ {rv.rating}</span>
                          <button onClick={()=>deleteReview(rv.id)} style={{background:"none",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"var(--danger)",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>Delete</button>
                        </div>
                      </div>
                      <div style={{fontSize:13,color:"rgba(240,240,250,.75)",lineHeight:1.6}}>{rv.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    {showStreakModal && <StreakRewardsModal streak={streak} onClose={()=>setShowStreakModal(false)}/>}
    </div>
  );
}

export { StreakAvatar, StreakRewardsModal, SubscriptionManagerPanel, ProfileModal };
