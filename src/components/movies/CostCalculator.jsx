import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SERVICES } from "../../data/constants.js";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders } from "../../lib/tmdb.js";
function CostCalculatorModal({ onClose, userSubs, watchHistory, watchlist, userRatings, tier, onUpgrade }) {
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");

  const myServices = SERVICES.filter(s => userSubs.includes(s.id));
  const totalMonthly = myServices.reduce((sum,s) => sum + (s.price||0), 0);
  const totalAnnual = totalMonthly * 12;

  // Calculate watches per service from history
  const watchesByService = {};
  (watchHistory||[]).forEach(h => {
    const svc = h.service_id || (h.providers && h.providers[0]);
    if (svc) watchesByService[svc] = (watchesByService[svc]||0) + 1;
  });

  // Cost per watch per service
  const serviceStats = myServices.map(s => {
    const watches = watchesByService[s.id] || 0;
    const cpw = watches > 0 ? s.price / watches : null;
    return { ...s, watches, cpw };
  }).sort((a,b) => b.price - a.price);

  const totalWatches = Object.values(watchesByService).reduce((s,v)=>s+v,0);
  const mostUsed = serviceStats.filter(s=>s.watches>0).sort((a,b)=>b.watches-a.watches)[0];
  const leastUsed = serviceStats.filter(s=>s.watches===0 && s.price>0);
  const bestValue = serviceStats.filter(s=>s.cpw!==null).sort((a,b)=>a.cpw-b.cpw)[0];
  const worstValue = serviceStats.filter(s=>s.cpw!==null).sort((a,b)=>b.cpw-a.cpw)[0];

  // Watchlist service distribution
  const wlByService = {};
  (watchlist||[]).forEach(id => {
    // approximate from watchHistory
  });

  const generateAIReport = async () => {
    setLoading(true);
    const dataSnapshot = {
      services: serviceStats.map(s=>({name:s.name,price:s.price,watches:s.watches,cpw:s.cpw?.toFixed(2)||"no data"})),
      totalMonthly: totalMonthly.toFixed(2),
      totalWatches,
      watchlistSize: (watchlist||[]).length,
      ratingsCount: Object.keys(userRatings||{}).length,
      unusedServices: leastUsed.map(s=>s.name),
      mostUsed: mostUsed?.name || "none",
      bestValue: bestValue ? `${bestValue.name} at $${bestValue.cpw?.toFixed(2)}/watch` : "none",
    };
    try {
      const res = await fetch("/api/ai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:800,
          system:`You are a smart streaming advisor. Analyze streaming data and give brutally honest recommendations. Be specific with dollar amounts. Return ONLY valid JSON with keys: summary (2 sentences), keep (array of {service, reason}), drop (array of {service, reason, savings}), tip (one power tip). No markdown, no extra text.`,
          messages:[{role:"user",content:`Streaming data: ${JSON.stringify(dataSnapshot)}`}]
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "";
      if (!text) throw new Error("Empty AI response");
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setAiReport(parsed);
    } catch(e) {
      setAiReport({ error: e.message, summary:"", keep:[], drop:[], tip:"" });
    }
    setLoading(false);
  };

  // Free users get 1 AI report — tracked in localStorage
  const freeReportKey = "streamhub_free_report_used";
  const hasUsedFreeReport = !!localStorage.getItem(freeReportKey);
  const canAccessFree = !hasUsedFreeReport;

  const generateAIReportWithTracking = async () => {
    if (tier !== "premium" && canAccessFree) {
      localStorage.setItem(freeReportKey, "1");
    }
    await generateAIReport();
  };

  if (tier !== "premium" && hasUsedFreeReport) return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:420,border:"1px solid rgba(16,185,129,.3)",padding:32,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>💰</div>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:22,marginBottom:8}}>Liked your free report?</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:20,lineHeight:1.7}}>Upgrade to Premium for unlimited AI reports, updated every time your watch history changes.</div>
        <div style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"left"}}>
          {["Unlimited AI reports — run anytime","Cost-per-watch breakdown per service","AI verdict: Keep, Cut, or Rotate","Personalized save recommendations","Monthly & annual waste calculator"].map((f,i)=>(
            <div key={i} style={{display:"flex",gap:8,fontSize:13,color:"var(--muted)",marginBottom:i<4?8:0}}>
              <span style={{color:"var(--sports)"}}>✓</span>{f}
            </div>
          ))}
        </div>
        <button onClick={()=>{onUpgrade&&onUpgrade();onClose();}} style={{width:"100%",background:"linear-gradient(135deg,var(--gold),#f59e0b)",border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:10}}>
          Upgrade to Premium ✦
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{background:"var(--surface)",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid rgba(16,185,129,.3)",boxShadow:"0 40px 80px rgba(0,0,0,.8)"}}>

        {/* Header */}
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(245,158,11,.06))",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:2}}>💰 Streaming Intelligence</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>AI-powered analysis of your streaming value</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,color:"var(--muted)",width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:4,marginTop:14}}>
            {["overview","ai report"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"rgba(16,185,129,.2)":"none",border:tab===t?"1px solid rgba(16,185,129,.4)":"1px solid transparent",borderRadius:99,color:tab===t?"var(--sports)":"var(--muted)",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize",fontFamily:"var(--font-head)"}}>
                {t==="ai report"?"🤖 AI Report":t==="overview"?"📊 Overview":""}
              </button>
            ))}
          </div>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"20px 24px 24px"}}>

          {tab==="overview" && (
            <div>
              {/* Big total — responsive font size */}
              <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.1),rgba(16,185,129,.03))",border:"1px solid rgba(16,185,129,.2)",borderRadius:16,padding:"16px 12px",textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,letterSpacing:1.5}}>MONTHLY STREAMING SPEND</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"clamp(32px,8vw,52px)",color:"var(--sports)",lineHeight:1}}>${totalMonthly.toFixed(2)}</div>
                <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:10,flexWrap:"wrap"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>${totalAnnual.toFixed(0)}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>per year</div>
                  </div>
                  <div style={{width:1,background:"var(--border)"}}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>${(totalMonthly/30).toFixed(2)}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>per day</div>
                  </div>
                  <div style={{width:1,background:"var(--border)"}}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"rgba(240,240,250,.8)"}}>{totalWatches}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>watched</div>
                  </div>
                </div>
              </div>

              {/* Per-service cost breakdown */}
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:"var(--muted)",letterSpacing:1.2,marginBottom:10}}>COST PER SERVICE — THIS MONTH</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {serviceStats.map(s=>{
                    const pct = totalMonthly>0?(s.price/totalMonthly)*100:0;
                    const verdict = s.watches===0&&s.price>0?"⚠️ Unused":s.cpw&&s.cpw<3?"🟢 Great":s.cpw&&s.cpw<8?"🟡 Average":"🔴 Pricey";
                    return (
                      <div key={s.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,gap:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
                            <span style={{background:s.color,borderRadius:7,width:26,height:26,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",flexShrink:0}}>{s.logo}</span>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                              <div style={{fontSize:10,color:"var(--muted)"}}>
                                {s.watches>0?`${s.watches} watch${s.watches!==1?"es":""}  ·  $${s.cpw.toFixed(2)}/watch`:"No watches yet"}
                              </div>
                            </div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontFamily:"var(--font-head)",fontWeight:800,color:"var(--sports)",fontSize:13}}>${s.price.toFixed(2)}</div>
                            <div style={{fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{verdict}</div>
                          </div>
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,.05)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:s.watches===0?"rgba(239,68,68,.6)":s.color,borderRadius:99,transition:"width .6s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick insights */}
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:11,color:"var(--muted)",letterSpacing:1.2,marginBottom:2}}>QUICK INSIGHTS</div>
                {mostUsed && <div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>🏆 <strong>{mostUsed.name}</strong> is your most-used — {mostUsed.watches} watches this month</div>}
                {bestValue && <div style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>💎 Best value: <strong>{bestValue.name}</strong> at <strong>${bestValue.cpw.toFixed(2)}/watch</strong></div>}
                {worstValue && worstValue.cpw > 10 && <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>⚠️ <strong>{worstValue.name}</strong> is costing <strong>${worstValue.cpw.toFixed(2)}/watch</strong></div>}
                {leastUsed.length>0 && <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"10px 12px",fontSize:12}}>💸 <strong>{leastUsed.map(s=>s.name).join(", ")}</strong> — paid for, nothing watched. That's <strong>${leastUsed.reduce((s,sv)=>s+sv.price,0).toFixed(2)}/mo</strong> unused.</div>}
              </div>

              <button onClick={()=>setTab("ai report")} style={{width:"100%",background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(6,182,212,.2))",border:"1px solid rgba(16,185,129,.4)",borderRadius:12,color:"var(--sports)",padding:"11px 0",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,cursor:"pointer"}}>
                🤖 Get AI Recommendations →
              </button>
            </div>
          )}

          {tab==="ai report" && (
            <div>
              {!aiReport && !loading && (
                <div style={{textAlign:"center",padding:"32px 0"}}>
                  <div style={{fontSize:52,marginBottom:16}}>🤖</div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:20,marginBottom:8}}>AI Streaming Advisor</div>
                  <div style={{color:"var(--muted)",fontSize:14,marginBottom:24,lineHeight:1.7,maxWidth:380,margin:"0 auto 24px"}}>
                    AI analyzes your watch history, ratings, and watchlist to give you brutally honest advice on what to keep, what to cut, and how to save money.
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24,textAlign:"left"}}>
                    {[
                      `${myServices.length} services · $${totalMonthly.toFixed(2)}/mo`,
                      `${totalWatches} titles watched`,
                      `${(watchlist||[]).length} titles on watchlist`,
                      `${Object.keys(userRatings||{}).length} ratings given`,
                    ].map((stat,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--muted)",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{color:"var(--sports)"}}>✓</span>{stat}
                      </div>
                    ))}
                  </div>
                  <button onClick={tier==="premium"?generateAIReport:generateAIReportWithTracking} style={{background:"linear-gradient(135deg,#10b981,#06b6d4)",border:"none",borderRadius:14,color:"#fff",padding:"14px 32px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 32px rgba(16,185,129,.4)"}}>
                    ✦ Generate My Report
                  </button>
                </div>
              )}

              {loading && (
                <div style={{textAlign:"center",padding:"48px 0"}}>
                  <div style={{width:48,height:48,border:"3px solid rgba(16,185,129,.2)",borderTop:"3px solid var(--sports)",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,marginBottom:8}}>Analyzing your streaming habits...</div>
                  <div style={{color:"var(--muted)",fontSize:13}}>Calculating cost-per-watch, checking your watchlist, reviewing your ratings</div>
                </div>
              )}

              {aiReport && !loading && (
                <div>
                  {/* Show error if present */}
                  {aiReport.error && (
                    <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:16,marginBottom:16,textAlign:"center"}}>
                      <div style={{fontSize:28,marginBottom:8}}>😕</div>
                      <div style={{fontWeight:700,marginBottom:4}}>Couldn't generate report</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>{aiReport.error}</div>
                      <button onClick={()=>{setAiReport(null);generateAIReport();}} style={{background:"var(--sports)",border:"none",borderRadius:10,color:"#fff",padding:"8px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>Try Again</button>
                    </div>
                  )}
                  {/* Summary */}
                  <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(6,182,212,.08))",border:"1px solid rgba(16,185,129,.25)",borderRadius:14,padding:16,marginBottom:16}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--sports)",letterSpacing:1.2,marginBottom:8}}>AI SUMMARY</div>
                    <div style={{fontSize:14,lineHeight:1.7,color:"rgba(240,240,250,.85)"}}>{aiReport.summary}</div>
                  </div>

                  {/* Keep */}
                  {aiReport.keep?.length>0 && (
                    <div style={{marginBottom:14}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"var(--sports)",letterSpacing:1.2,marginBottom:8}}>✅ KEEP THESE</div>
                      {aiReport.keep.map((k,i)=>(
                        <div key={i} style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13}}>
                          <strong>{k.service}</strong> — {k.reason}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop */}
                  {aiReport.drop?.length>0 && (
                    <div style={{marginBottom:14}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:12,color:"#ef4444",letterSpacing:1.2,marginBottom:8}}>✂️ CONSIDER CUTTING</div>
                      {aiReport.drop.map((d,i)=>(
                        <div key={i} style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13}}>
                          <strong>{d.service}</strong> — {d.reason}
                          {d.savings && <span style={{marginLeft:8,background:"rgba(239,68,68,.15)",color:"#ef4444",borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>Save {d.savings}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tip */}
                  {aiReport.tip && (
                    <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"12px 14px",fontSize:13,marginBottom:16}}>
                      💡 <strong>Power tip:</strong> {aiReport.tip}
                    </div>
                  )}

                  <button onClick={()=>{setAiReport(null);generateAIReport();}} style={{width:"100%",background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:10,color:"var(--sports)",padding:"10px 0",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    🔄 Regenerate Report
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

// ─── MOOD SEARCH MODAL ────────────────────────────────────────────────────────
// ─── MOOD SEARCH LIMIT (1 free per day) ──────────────────────────────────────
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

export { CostCalculatorModal };
