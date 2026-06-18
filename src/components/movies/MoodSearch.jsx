import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders } from "../../lib/tmdb.js";
import { SERVICES } from "../../data/constants.js";
function getMoodSearchCount() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem("streamhub_mood_v3") || "{}");
  if (stored.date !== today) return 0;
  return stored.count || 0;
}
function incrementMoodSearchCount() {
  const today = new Date().toDateString();
  const count = getMoodSearchCount();
  localStorage.setItem("streamhub_mood_v3", JSON.stringify({ date: today, count: count + 1 }));
}

// ─── AI PICKS LIMIT (weekly reset) ───────────────────────────────────────────
function getAIPicksCount() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const stored = JSON.parse(localStorage.getItem("streamhub_aipicks_data") || "{}");
  if (stored.week !== week) return 0;
  return stored.count || 0;
}
function incrementAIPicksCount() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const count = getAIPicksCount();
  localStorage.setItem("streamhub_aipicks_data", JSON.stringify({ week, count: count + 1 }));
}

function MoodSearchModal({ onClose, tier, onUpgrade, onResults }) {
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const freeMoodUsed = false; // Mood Search is free for all users

  const moods = [
    "Something scary but not too gory 😱",
    "Funny and lighthearted 😂",
    "A good cry 😢",
    "Action-packed and thrilling ⚡",
    "Perfect for date night 💕",
    "Something for the whole family 👨‍👩‍👧",
    "Mind-bending and thought-provoking 🧠",
    "Feel-good and uplifting ☀️",
    "Dark and gritty 🖤",
    "Epic adventure 🗺️",
  ];

  const search = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:500,
          system:`You are an expert film and TV critic. When given a mood or vibe, suggest exactly 3 highly specific titles that genuinely match. Include a mix of movie and TV types. Be specific — no generic blockbusters unless they truly fit. Return ONLY valid JSON, no markdown: {"items":[{"title":"exact title","year":2019,"type":"movie","reason":"one specific sentence why this fits","genre":"Genre","platform":"Netflix","tmdb_search":"exact title"}]}`,
          messages:[{
            role:"user",
            content:`Give me 3 titles that perfectly match this mood: "${mood}". Make them varied and specific.`
          }]
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.error?.message || errData.error || `API error ${res.status}`);
      }
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"";
      if (!txt) throw new Error("Empty response from AI");
      const clean = txt.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      if (!parsed.items?.length) throw new Error("No results returned");
      setResult(parsed);
      if (tier !== "premium") incrementMoodSearchCount();
    } catch(e) {
      console.error("Mood search error:", e);
      setResult({ error: e.message, items:[] });
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1100,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:56,paddingBottom:20,paddingLeft:12,paddingRight:12,overflowY:"auto",backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{
        background:"linear-gradient(180deg,#140B30 0%,#0F082A 100%)",
        borderRadius:20,
        width:"100%", maxWidth:640,
        overflow:"hidden",
        display:"flex", flexDirection:"column",
        border:"1px solid rgba(139,92,246,.4)",
        boxShadow:"0 20px 80px rgba(139,92,246,.4)",
      }}>
        {/* Header */}
        <div style={{
          padding:"20px 20px 16px",
          background:"linear-gradient(135deg,rgba(139,92,246,.25),rgba(255,107,157,.1))",
          borderBottom:"1px solid rgba(139,92,246,.2)",
          position:"relative",
        }}>
          <div style={{position:"absolute",top:-40,left:-40,width:150,height:150,borderRadius:"50%",background:"rgba(139,92,246,.2)",filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:-40,right:-40,width:150,height:150,borderRadius:"50%",background:"rgba(255,107,157,.15)",filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{
                width:40,height:40,borderRadius:12,
                background:"linear-gradient(135deg,#8B5CF6,#A855F7)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,boxShadow:"0 4px 20px rgba(139,92,246,.5)",
              }}>🎭</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",gap:8}}>
                  Mood Search
                  <span style={{background:"linear-gradient(90deg,#F59E0B,#f59e0b)",color:"#000",fontSize:9,fontWeight:900,padding:"2px 8px",borderRadius:99,letterSpacing:.5}}>✦ PRO</span>
                </div>
                <div style={{fontSize:12,color:"rgba(196,181,253,.8)"}}>Describe any vibe — AI finds the perfect match</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <div style={{background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.3)",borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#C4B5FD"}}>
                🎭 Free
              </div>
              <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,color:"var(--muted)",width:28,height:28,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
          </div>
          {/* Example prompts as inspiration */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,position:"relative"}}>
            {['"scary but not gory"','"fun date night"','"mind-bending sci-fi"','"feel-good comedy"'].map(ex=>(
              <button key={ex} onClick={()=>setMood(ex.replace(/"/g,""))}
                style={{background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.3)",borderRadius:99,color:"#c4b5fd",padding:"4px 12px",fontSize:11,cursor:"pointer",fontStyle:"italic"}}>
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px 24px",flex:1}}>
          {/* Main input */}
          <div style={{position:"relative",marginBottom:16}}>
            <div style={{
              position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
              fontSize:20,pointerEvents:"none",
            }}>🎭</div>
            <input
              value={mood} onChange={e=>setMood(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&search()}
              placeholder='Type anything... "cozy rainy day movie" or "action like John Wick"'
              autoFocus
              style={{
                width:"100%", background:"rgba(139,92,246,.1)",
                border:"1.5px solid rgba(139,92,246,.5)",
                borderRadius:16, color:"var(--text)",
                padding:"14px 16px 14px 46px",
                fontSize:14, outline:"none",
                boxShadow:"0 4px 20px rgba(139,92,246,.15)",
              }}
            />
            <button onClick={search} disabled={loading||!mood.trim()}
              style={{
                position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                background:mood.trim()?"linear-gradient(135deg,#8B5CF6,#A855F7)":"rgba(255,255,255,.1)",
                border:"none",borderRadius:10,color:"#fff",
                padding:"7px 16px",fontFamily:"var(--font-head)",fontWeight:800,
                fontSize:12,cursor:mood.trim()?"pointer":"default",
                display:"flex",alignItems:"center",gap:6,
                transition:"all .2s",opacity:!mood.trim()?0.5:1,
              }}>
              {loading?<span style={{display:"inline-block",width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:<>✦ Find</>}
            </button>
          </div>

          {/* Quick mood chips */}
          {!result && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"rgba(196,181,253,.6)",marginBottom:10,letterSpacing:1.5,fontWeight:700}}>QUICK PICKS — tap to try</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {moods.map(m=>(
                  <button key={m} onClick={()=>setMood(m)}
                    style={{
                      background:mood===m?"rgba(139,92,246,.3)":"rgba(255,255,255,.05)",
                      border:`1px solid ${mood===m?"rgba(139,92,246,.7)":"rgba(255,255,255,.1)"}`,
                      borderRadius:99,color:mood===m?"#c4b5fd":"var(--muted)",
                      padding:"7px 14px",fontSize:12,cursor:"pointer",
                      transition:"all .2s",
                    }}>{m}</button>
                ))}
              </div>
            </div>
          )}
          {/* Results */}
          {result && (
            <div>
              {result.error ? (
                <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:20,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>😕</div>
                  <div style={{fontWeight:700,marginBottom:4}}>Couldn't get results</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>{result.error}</div>
                  <button onClick={()=>{setResult(null);search();}} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"8px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>Try Again</button>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:11,color:"rgba(196,181,253,.6)",marginBottom:12,letterSpacing:1.2,fontWeight:700}}>
                    {result.items?.length || 0} RESULTS FOR "{mood.toUpperCase()}"
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {result.items?.map((item,i)=>(
                      <div key={i} style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"12px 14px",animation:`fadeUp .3s ${i*0.06}s both`,transition:"border-color .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(139,92,246,.5)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(139,92,246,.2)"}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:5}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>
                              {item.title} <span style={{fontSize:12,color:"var(--muted)",fontWeight:400}}>({item.year})</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                              <span style={{background:"rgba(255,255,255,.07)",borderRadius:6,padding:"2px 7px",fontSize:10,color:"var(--muted)"}}>{item.type==="tv"?"📺 TV":"🎬 Movie"}</span>
                              {item.genre&&<span style={{background:"rgba(255,255,255,.07)",borderRadius:6,padding:"2px 7px",fontSize:10,color:"var(--muted)"}}>{item.genre}</span>}
                              {item.platform&&<span style={{background:"rgba(139,92,246,.25)",borderRadius:6,padding:"2px 7px",fontSize:10,color:"#c4b5fd",fontWeight:700}}>{item.platform}</span>}
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <button onClick={()=>{onResults(item.tmdb_search||item.title);onClose();}}
                              style={{background:"linear-gradient(135deg,#8B5CF6,#A855F7)",border:"none",borderRadius:10,color:"#fff",padding:"7px 12px",fontSize:11,fontWeight:800,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
                              Search →
                            </button>
                            <button onClick={()=>{
                              const shareText = `🎭 AI Mood Search just matched me with "${item.title}" — perfectly fits my vibe! Try The StreamHub:`;
                              if(navigator.share){navigator.share({title:item.title,text:shareText,url:"https://thestreamhub.app"}).catch(()=>{});}
                              else{window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText+" https://thestreamhub.app")}`,"_blank");}
                            }}
                              style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:"var(--muted)",padding:"7px 10px",fontSize:13,cursor:"pointer",flexShrink:0}}>
                              📤
                            </button>
                          </div>
                        </div>
                        <div style={{fontSize:12,color:"rgba(196,181,253,.8)",lineHeight:1.5,fontStyle:"italic"}}>"{item.reason}"</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>{setResult(null);setMood("");}} style={{marginTop:12,width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",borderRadius:10,color:"var(--muted)",padding:"10px 0",fontSize:13,cursor:"pointer"}}>
                    🔄 Try a different mood
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEW RELEASES MODAL ───────────────────────────────────────────────────────

export { getMoodSearchCount, incrementMoodSearchCount, getAIPicksCount, incrementAIPicksCount, MoodSearchModal };
