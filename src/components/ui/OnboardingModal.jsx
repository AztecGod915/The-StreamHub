import { useState, useEffect, useRef, useCallback, useMemo } from "react";
function OnboardingModal({ onFinish }) {
  const [step, setStep] = useState(0);
  const [demoMood, setDemoMood] = useState(null);

  const STEPS = [
    {
      id: "welcome",
      icon: "🎬",
      color: "#8B5CF6",
      title: "Welcome to StreamHub",
      subtitle: "The smarter way to find what to watch",
      content: null,
    },
    {
      id: "mood",
      icon: "🎭",
      color: "#A855F7",
      title: "Tell AI your vibe",
      subtitle: "Describe any mood — AI finds the perfect match in seconds. Completely free.",
      content: "mood",
    },
    {
      id: "sports",
      icon: "🏆",
      color: "#10B981",
      title: "Live sports + streaming, together",
      subtitle: "World Cup scores, team schedules, and reminders — right alongside your shows.",
      content: "sports",
    },
    {
      id: "personal",
      icon: "✦",
      color: "#F59E0B",
      title: "Gets smarter over time",
      subtitle: "Rate what you watch. The more you rate, the better your For You picks get.",
      content: "personal",
    },
  ];

  const DEMO_MOODS = [
    { label: "Something scary 😱",     result: "Hereditary (2018) — A24's most terrifying film. On Max." },
    { label: "Perfect date night 💕",  result: "When Harry Met Sally (1989) — timeless comfort. On Tubi free." },
    { label: "Mind-bending sci-fi 🌌", result: "Annihilation (2018) — unforgettable and strange. On Paramount+." },
    { label: "Feel-good & funny 😂",   result: "The Grand Budapest Hotel (2014) — pure joy. On Max." },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("streamhub_onboarded", "1");
      onFinish();
    } else {
      setDemoMood(null);
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:2000,
      background:"rgba(0,0,0,.92)", backdropFilter:"blur(16px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, animation:"fadeIn .3s ease",
    }}>
      <div style={{
        background:"var(--surface)", borderRadius:24,
        width:"100%", maxWidth:480,
        border:`1px solid ${current.color}44`,
        boxShadow:`0 0 60px ${current.color}22, 0 40px 80px rgba(0,0,0,.6)`,
        overflow:"hidden", transition:"border-color .4s",
      }}>

        {/* Progress bar */}
        <div style={{height:3, background:"rgba(255,255,255,.06)"}}>
          <div style={{height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${current.color},${current.color}cc)`, borderRadius:99, transition:"width .4s ease"}}/>
        </div>

        {/* Step dots */}
        <div style={{display:"flex", justifyContent:"center", gap:6, paddingTop:16}}>
          {STEPS.map((_,i) => (
            <div key={i} style={{
              width: i===step?20:6, height:6, borderRadius:99,
              background: i<=step ? current.color : "rgba(255,255,255,.12)",
              transition:"all .3s ease",
            }}/>
          ))}
        </div>

        {/* Content */}
        <div style={{padding:"24px 28px 28px"}}>
          {/* Icon */}
          <div style={{
            width:64, height:64, borderRadius:18,
            background:`${current.color}18`, border:`1.5px solid ${current.color}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:30, marginBottom:18,
            boxShadow:`0 8px 24px ${current.color}22`,
          }}>
            {current.icon}
          </div>

          {/* Title & subtitle */}
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:22,marginBottom:8,lineHeight:1.2}}>{current.title}</div>
          <div style={{fontSize:14,color:"rgba(240,240,250,.65)",lineHeight:1.6,marginBottom:20}}>{current.subtitle}</div>

          {/* Step-specific content */}
          {current.content === "mood" && (
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,marginBottom:10}}>TRY IT — TAP A VIBE:</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {DEMO_MOODS.map((m,i) => (
                  <button key={i} onClick={()=>setDemoMood(demoMood===i?null:i)}
                    style={{
                      background:demoMood===i?"rgba(139,92,246,.2)":"rgba(255,255,255,.04)",
                      border:`1px solid ${demoMood===i?"rgba(139,92,246,.6)":"rgba(255,255,255,.1)"}`,
                      borderRadius:10, padding:"9px 14px",
                      color: demoMood===i?"#C4B5FD":"var(--text)",
                      fontSize:13, fontWeight:600, cursor:"pointer",
                      textAlign:"left", transition:"all .2s",
                    }}>
                    {m.label}
                    {demoMood===i && (
                      <div className="fadeUp" style={{marginTop:8,fontSize:12,color:"#C4B5FD",borderTop:"1px solid rgba(139,92,246,.2)",paddingTop:8,fontWeight:700}}>
                        ✦ AI picked: {m.result}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.content === "sports" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {icon:"🔴",label:"Live Scores",desc:"World Cup, NFL, NBA, MLB and more"},
                {icon:"🔔",label:"Game Reminders",desc:"Add any game to your calendar"},
                {icon:"⭐",label:"Follow Teams",desc:"Your teams highlighted across all sports"},
                {icon:"🎬",label:"Sports + Movies",desc:"Watch docs while your team rests"},
              ].map((f,i)=>(
                <div key={i} style={{background:"rgba(16,185,129,.07)",border:"1px solid rgba(16,185,129,.2)",borderRadius:12,padding:"10px 12px"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{f.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{f.label}</div>
                  <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.4}}>{f.desc}</div>
                </div>
              ))}
            </div>
          )}

          {current.content === "personal" && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"⭐",label:"Rate what you watch",desc:"Tap stars after any movie or show"},
                  {icon:"❤️",label:"Build your Watchlist",desc:"Save titles to watch later"},
                  {icon:"✦",label:"For You gets smarter",desc:"AI learns your taste from every rating"},
                  {icon:"🚨",label:"Leaving Soon alerts",desc:"7-day free trial — know before it's gone"},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<3?"1px solid rgba(255,255,255,.05)":"none"}}>
                    <div style={{width:32,height:32,borderRadius:8,background:"rgba(245,158,11,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{f.icon}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{f.label}</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <button onClick={handleNext}
            style={{
              width:"100%", background:`linear-gradient(135deg,${current.color},${current.color}cc)`,
              border:"none", borderRadius:14, color:"#fff",
              padding:"14px 0", fontFamily:"var(--font-head)",
              fontWeight:900, fontSize:15, cursor:"pointer",
              boxShadow:`0 8px 24px ${current.color}44`,
              transition:"all .2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".9"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            {isLast ? "🚀 Let's go — pick my services" : step===1&&demoMood===null ? "Next →" : "Next →"}
          </button>

          {step > 0 && (
            <button onClick={()=>{setStep(s=>s-1);setDemoMood(null);}}
              style={{width:"100%",background:"none",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer",marginTop:8,padding:"6px 0"}}>
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { OnboardingModal };
