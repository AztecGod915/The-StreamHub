import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { getEspnSport, getTeamsForSport, WC_TEAMS, ALL_TEAMS } from "../../data/sportsData.js";
import { PredictionStatsBar, PredictionCelebrationModal } from "./Predictions.jsx";
import GameCard from "./GameCard.jsx";
import { GameDetailModal, FavoriteTeamModal } from "./GameDetailModal.jsx";
import { WeeklyScheduleModal } from "./WeeklySchedule.jsx";
function LiveSportsSection({ sportQuery, favoriteTeams, onToggleFavorite, user, showToast, onPredResult }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportInfo, setSportInfo] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const intervalRef = useRef(null);
  const sportRef = useRef(null);   // always has the latest sport — no stale closure

  // All ESPN status names that mean "this match is currently happening"
  const LIVE_STATUSES = new Set([
    "STATUS_IN_PROGRESS",
    "STATUS_HALFTIME",
    "STATUS_EXTRA_TIME_IN_PROGRESS",
    "STATUS_EXTRA_TIME_HALF",
    "STATUS_SHOOTOUT_IN_PROGRESS",
    "STATUS_OVERTIME",
    "STATUS_FIRST_HALF",
    "STATUS_SECOND_HALF",
    "STATUS_END_PERIOD",
  ]);

  // Parse ESPN events from API response
  const parseEvents = (data) => (data.events||[]).map(evt => {
    const comp = evt.competitions?.[0];
    const home = comp?.competitors?.find(c=>c.homeAway==="home") || comp?.competitors?.[0];
    const away = comp?.competitors?.find(c=>c.homeAway==="away") || comp?.competitors?.[1];
    const st = evt.status?.type;
    const statusName = st?.name || "";
    const isHalftime = statusName === "STATUS_HALFTIME" || statusName === "STATUS_EXTRA_TIME_HALF";
    const isShootout = statusName === "STATUS_SHOOTOUT_IN_PROGRESS";
    const isExtraTime = statusName === "STATUS_EXTRA_TIME_IN_PROGRESS";
    const isLive = LIVE_STATUSES.has(statusName) && !st?.completed;

    // Build a clear period label for soccer
    let periodText = st?.shortDetail || "";
    if (isHalftime)  periodText = "Half Time";
    if (isExtraTime) periodText = "Extra Time · " + (st?.displayClock || "");
    if (isShootout)  periodText = "⚽ Penalty Shootout";

    return {
      id: evt.id,
      name: evt.name||evt.shortName||"",
      shortName: evt.shortName||evt.name||"",
      date: evt.date,
      localDate: new Date(evt.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
      localTime: new Date(evt.date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZoneName:"short"}),
      isLive,
      isHalftime,
      isShootout,
      isExtraTime,
      isOver: st?.completed||false,
      period: evt.status?.period||0,
      displayClock: evt.status?.displayClock||"",
      periodText,
      home: { name:home?.team?.shortDisplayName||home?.team?.displayName||"", abbr:home?.team?.abbreviation||"", score:home?.score??"-", logo:home?.team?.logo||"", color:home?.team?.color||"333", winner:home?.winner },
      away: { name:away?.team?.shortDisplayName||away?.team?.displayName||"", abbr:away?.team?.abbreviation||"", score:away?.score??"-", logo:away?.team?.logo||"", color:away?.team?.color||"333", winner:away?.winner },
      broadcast: comp?.broadcasts?.[0]?.names?.join(", ")||"",
      broadcastLink: getBroadcastLink(comp?.broadcasts?.[0]?.names?.join(", ")||""),
      _sportDisplay: sportRef.current?.display||"",
      venue: comp?.venue?.fullName||"",
      city: comp?.venue?.address?.city||"",
      isTitleFight: (evt.name||"").toLowerCase().includes("championship")||(evt.name||"").toLowerCase().includes("title"),
    };
  });

  // Core fetch function — reads sport from ref, no stale closure
  const doFetch = async (silent=false) => {
    const sport = sportRef.current;
    if (!sport) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport.path}/scoreboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const evts = parseEvents(data);
      setEvents(evts);
      setLastUpdated(new Date());
      setError(null);
      // Keep polling if any game is live OR if any game starts within the next 90 minutes
      const now = Date.now();
      const hasSoonGame = evts.some(e => !e.isOver && !e.isLive && new Date(e.date).getTime() - now < 90*60*1000);
      setIsPolling(evts.some(e=>e.isLive) || hasSoonGame);
    } catch(e) {
      if (!silent) setError("Could not load schedule");
    }
    if (!silent) setLoading(false);
  };

  // When sport changes: update ref, reset state, fetch fresh
  useEffect(() => {
    const sport = getEspnSport(sportQuery);
    if (!sport) { setLoading(false); setError(null); return; }
    sportRef.current = sport;
    setSportInfo(sport);
    setEvents([]);
    setLastUpdated(null);
    setIsPolling(false);
    setError(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    doFetch(false);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sportQuery]);

  // Polling: 20s when games are live, 60s when games start soon
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPolling) {
      const hasLive = events.some(e=>e.isLive);
      intervalRef.current = setInterval(() => doFetch(true), hasLive ? 20000 : 60000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPolling, events]);

  const sport = getEspnSport(sportQuery);
  if (!sport && !loading) return null;

  const favTeam = (() => {
    const v = favoriteTeams?.[sportInfo?.display||""];
    return Array.isArray(v) ? v : (v ? [v] : []);
  })();
  const liveEvents = events.filter(e=>e.isLive);
  const upcomingEvents = events.filter(e=>!e.isLive&&!e.isOver);
  const recentEvents = events.filter(e=>e.isOver).slice(-4).reverse();
  const hasLive = liveEvents.length > 0;

  const sortByFav = (evts) => {
    if (!favTeam) return evts.slice(0,8);
    const fav = evts.filter(e=>e.home.name===favTeam||e.away.name===favTeam);
    const rest = evts.filter(e=>e.home.name!==favTeam&&e.away.name!==favTeam);
    return [...fav,...rest].slice(0,8);
  };

  return (
    <div style={{marginBottom:20}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {hasLive && <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1.5s infinite",boxShadow:"0 0 8px #ef4444",flexShrink:0}}/>}
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:hasLive?"#ef4444":"var(--sports)"}}>
            {hasLive?"🔴 LIVE NOW":"📅 SCHEDULE"} — {sportInfo?.display||""}
          </div>
          {isPolling && <div style={{fontSize:9,background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:99,padding:"2px 8px",color:"#ef4444",fontWeight:700}}>AUTO-UPDATING</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {favTeam && <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:99,padding:"3px 10px",fontSize:11,color:"var(--gold)",fontWeight:700}}>⭐ {favTeam}</div>}
          <button onClick={()=>setShowTeamPicker(true)} style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.25)",borderRadius:99,color:"var(--gold)",padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            {favTeam?"⭐ Change Team":"⭐ Follow a Team"}
          </button>
          {lastUpdated && <div style={{fontSize:10,color:"var(--muted)"}}>Updated {lastUpdated.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>}
          <button onClick={()=>setShowFullSchedule(true)} style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:8,color:"var(--sports)",padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>📅 All Games</button>
          <button onClick={()=>doFetch(false)} style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:8,color:"var(--sports)",padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>↻</button>
        </div>
      </div>

      {showTeamPicker && (
        <FavoriteTeamModal sport={sportInfo?.display} events={events} favoriteTeams={favoriteTeams||{}} onToggle={onToggleFavorite} onClose={()=>setShowTeamPicker(false)}/>
      )}
      {selectedGame && (
        <GameDetailModal evt={selectedGame} onClose={()=>setSelectedGame(null)} user={user} showToast={showToast} onPredResult={onPredResult}/>
      )}
      {showFullSchedule && (
        <WeeklyScheduleModal sportQuery={sportQuery} sportDisplay={sportInfo?.display||""} onClose={()=>setShowFullSchedule(false)}/>
      )}

      {loading ? (
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
          {[1,2,3].map(i=><div key={i} className="skeleton" style={{flexShrink:0,width:200,height:110,borderRadius:12}}/>)}
        </div>
      ) : error ? (
        <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,padding:16,textAlign:"center"}}>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>{error}</div>
          <button onClick={()=>doFetch(false)} style={{background:"var(--sports)",border:"none",borderRadius:8,color:"#fff",padding:"6px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Try Again</button>
        </div>
      ) : (
        <div>
          {hasLive && <div style={{fontSize:11,color:"#ef4444",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>TAP A GAME TO WATCH LIVE</div>}
          {liveEvents.length>0 && (
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none",marginBottom:12}}>
              {sortByFav(liveEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={true} favTeam={favTeam} onSelect={setSelectedGame} user={user} showToast={showToast} onPredResult={onPredResult}/>)}
            </div>
          )}
          {upcomingEvents.length>0 && (
            <>
              {liveEvents.length>0 && <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>UPCOMING — tap to find where to watch</div>}
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
                {sortByFav(upcomingEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={false} favTeam={favTeam} onSelect={setSelectedGame} user={user} showToast={showToast} onPredResult={onPredResult}/>)}
              </div>
            </>
          )}
          {recentEvents.length>0 && upcomingEvents.length===0 && (
            <>
              <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1.2,fontWeight:700,marginBottom:8}}>RECENT RESULTS</div>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
                {sortByFav(recentEvents).map(evt=><GameCard key={evt.id} evt={evt} isLive={false} isOver={true} favTeam={favTeam} onSelect={setSelectedGame} user={user} showToast={showToast} onPredResult={onPredResult}/>)}
              </div>
            </>
          )}
          {events.length===0 && (
            <div style={{fontSize:13,color:"var(--muted)",textAlign:"center",padding:"24px 0",background:"rgba(255,255,255,.02)",borderRadius:12}}>
              No games scheduled right now. Season may be on break.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PREDICTION STATS BAR ────────────────────────────────────────────────────

export default LiveSportsSection;
