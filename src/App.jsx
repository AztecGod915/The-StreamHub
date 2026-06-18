import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import { supabase } from "./lib/supabase.js";
import { track, urlBase64ToUint8Array } from "./lib/utils.js";
import { TMDB_BASE, TMDB_IMG, tmdbHeaders, tmdbFetch, PROVIDER_MAP, getProviders } from "./lib/tmdb.js";
import { GENRE_MAP, isGenreSearch, doGenreSearch } from "./data/genreData.js";
import { SERVICES, CATEGORY_TABS, SPORTS_GUIDE } from "./data/constants.js";
import GlobalStyles from "./styles/GlobalStyles.jsx";

// Sports
import LiveSportsSection from "./components/sports/LiveSportsSection.jsx";
import { SportCategoryGrid, SportsTabHeader, SportsStreamingGuide } from "./components/sports/SportsUI.jsx";
import { TeamNextGameSearch, SportMovieBridge, SoccerHub, OlympicsPlaceholder } from "./components/sports/SportsHub.jsx";
import { PredictionCelebrationModal, PredictionStatsBar } from "./components/sports/Predictions.jsx";

// Movies
import { MovieCard } from "./components/movies/MovieCard.jsx";
import { MovieModal } from "./components/movies/MovieModal.jsx";
import { FeaturedRow } from "./components/movies/FeaturedRow.jsx";
import { MoodSearchModal, getMoodSearchCount, incrementMoodSearchCount, getAIPicksCount, incrementAIPicksCount } from "./components/movies/MoodSearch.jsx";
import { NewReleasesModal } from "./components/movies/NewReleases.jsx";
import { LeavingSoonModal, WatchHistoryModal } from "./components/movies/LeavingSoonModal.jsx";
import { CostCalculatorModal } from "./components/movies/CostCalculator.jsx";
import { PersonalizedRecsModal } from "./components/movies/PersonalizedRecs.jsx";
import { AdvancedStats } from "./components/movies/AdvancedStats.jsx";
import { WatchButton } from "./components/movies/WatchButton.jsx";

// Shared
import { Logo } from "./components/shared/Logo.jsx";
import { ServiceBadge } from "./components/shared/ServiceBadge.jsx";
import { ShareModal, getStreak, getShareLinks } from "./components/shared/ShareModal.jsx";

// UI
import { Toast } from "./components/ui/Toast.jsx";
import { CookieConsent } from "./components/ui/CookieConsent.jsx";
import { DailyPickBanner } from "./components/ui/DailyPickBanner.jsx";
import { OnboardingModal } from "./components/ui/OnboardingModal.jsx";
import { WatchTonightModal } from "./components/ui/WatchTonightModal.jsx";
import { MobileBottomNav, useDevice, useIsMobile } from "./components/ui/MobileBottomNav.jsx";
import { UpgradeModal, SetupModal } from "./components/ui/UpgradeModal.jsx";
import { InstallPrompt, SkeletonCard } from "./components/ui/InstallPrompt.jsx";
import { WelcomeBanner, getSearchCount, incrementSearchCount, resetSearchCount, SearchLimitWall } from "./components/ui/WelcomeBanner.jsx";
import { SignupPrompt } from "./components/ui/SignupPrompt.jsx";

// Auth & Profile
import { AuthModal } from "./components/auth/AuthModal.jsx";
import { ProfileModal, StreakAvatar } from "./components/profile/ProfileModal.jsx";
import { StreakRewardsModal } from "./components/profile/ProfileModal.jsx";

export default function StreamHub() {
  const isMobile = useIsMobile();
  const device = useDevice();

  // ── Auth state ──
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ── App state ──
  const [view, setView] = useState("home");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [movies, setMovies] = useState([]);
  const [featuredRows, setFeaturedRows] = useState({ trending:[], newReleases:[], topRated:[], anime:[], sports:[] });
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [userSubs, setUserSubs] = useState(["netflix","disney","max"]);
  const [showSetup, setShowSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load saved subs from localStorage on startup (for non-logged-in users)
  useEffect(() => {
    const saved = localStorage.getItem("streamhub_subs");
    const done  = localStorage.getItem("streamhub_setup_done");
    const onboarded = localStorage.getItem("streamhub_onboarded");
    if (saved) { try { setUserSubs(JSON.parse(saved)); } catch(e) {} }
    if (!done && !onboarded) setShowOnboarding(true);  // new user → onboarding first
    else if (!done) setShowSetup(true);                 // seen onboarding, not setup yet
  }, []);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tier, setTier] = useState("free");
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // Register push subscription and store in Supabase
  const registerPush = async (userId) => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        subscription: JSON.stringify(sub),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } catch(e) { console.warn("Push registration failed:", e); }
  };

  const requestNotifications = async () => {
    if (!user) { setShowAuth(true); return; }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") { await registerPush(user.id); showToast("🔔 Notifications enabled!"); }
  };
  const [toast, setToast] = useState(null);
  const [filterPlat, setFilterPlat] = useState(null);
  const [showLeavingSoon, setShowLeavingSoon] = useState(false);
  const [showWatchHistory, setShowWatchHistory] = useState(false);
  const [showNewReleases, setShowNewReleases] = useState(false);
  const [showCostCalc, setShowCostCalc] = useState(false);
  const [showWatchTonight, setShowWatchTonight] = useState(false);
  const [predCelebration, setPredCelebration] = useState(null); // {correct,streak,points,milestone}
  const handlePredResult = (result) => {
    if (result.correct) setPredCelebration(result);
  };

  const [favoriteTeams, setFavoriteTeams] = useState(() => {
    try { return JSON.parse(localStorage.getItem("streamhub_fav_teams")||"{}"); }
    catch { return {}; }
  });
  // favoriteTeams[sport] is now an array of team names (or legacy string)
  const getFavArr = (teams, sport) => {
    const v = teams?.[sport]; if (!v) return [];
    return Array.isArray(v) ? v : [v]; // backward compat
  };
  const toggleFavoriteTeam = useCallback((sport, teamName) => {
    setFavoriteTeams(prev => {
      const updated = { ...prev };
      if (teamName === "_clear") { delete updated[sport]; }
      else {
        const arr = getFavArr(prev, sport);
        updated[sport] = arr.includes(teamName)
          ? arr.filter(n=>n!==teamName)
          : [...arr, teamName];
        if (updated[sport].length===0) delete updated[sport];
      }
      localStorage.setItem("streamhub_fav_teams", JSON.stringify(updated));
      supabase.auth.getSession().then(({data:{session}})=>{
        if (session?.user) {
          supabase.from("profiles").update({favorite_teams:updated}).eq("id",session.user.id).catch(()=>{});
        } else if (teamName !== "_clear" && Object.keys(updated).length===1 && !prev[sport]) {
          showToast("⭐ Team saved! Sign in to sync across all your devices.");
        }
      });
      return updated;
    });
  }, []);
  const [showMoodSearch, setShowMoodSearch] = useState(false);
  const [showPersonalizedRecs, setShowPersonalizedRecs] = useState(false);
  const [shareContent, setShareContent] = useState(null); // {title,text,url}
  const [streak] = useState(()=>getStreak());

  const handleShareMovie = (movie, context="") => {
    const title = movie.title||movie.name||"";
    const text = context==="mood"
      ? `🎭 AI Mood Search just found me the perfect match: "${title}" — try it on The StreamHub!`
      : context==="rated"
        ? `⭐ Just rated "${title}" on The StreamHub — check it out!`
        : `📺 Watching "${title}" — found it on The StreamHub, the AI streaming assistant!`;
    setShareContent({title, text, url:"https://thestreamhub.app"});
  };
  const [watchHistory, setWatchHistory] = useState([]);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showSearchLimit, setShowSearchLimit] = useState(false);
  const [searchesUsed, setSearchesUsed] = useState(getSearchCount());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Show PWA install prompt after 60s on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem("streamhub_install_dismissed");
    if (!isMobile || dismissed) return;
    const timer = setTimeout(() => setShowInstallPrompt(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  // Show signup prompt after 30 seconds for non-logged-in users
  useEffect(() => {
    if (user) { resetSearchCount(); setSearchesUsed(0); return; }
    const dismissed = localStorage.getItem("streamhub_signup_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setShowSignupPrompt(true), 30000);
    return () => clearTimeout(timer);
  }, [user]);
  const searchTimer = useRef(null);

  const showToast = msg => setToast(msg);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user||null);
      if (session?.user) loadUserData(session.user);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((ev, session) => {
      setUser(session?.user||null);
      if (session?.user) {
        loadUserData(session.user);
      } else if (ev === "SIGNED_OUT") {
        // Only clear data when user explicitly signs out
        setWatchlist([]);
        setUserRatings({});
        setFavoriteTeams(JSON.parse(localStorage.getItem("streamhub_fav_teams")||"{}"));
      }
      // TOKEN_REFRESHED, INITIAL_SESSION etc. — do nothing extra
    });

    // ── Handle Stripe payment success ──────────────────────────────
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // Clean the URL
      window.history.replaceState({}, "", "/");
      // Wait for auth to load then upgrade
      const upgradeUser = async () => {
        const { data:{ session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from("profiles").update({ tier:"premium" }).eq("id", session.user.id);
          setTier("premium");
          showToast("🎉 Welcome to Premium! All features unlocked.");
        } else {
          // Store flag so we can upgrade after they sign in
          localStorage.setItem("streamhub_pending_upgrade", "true");
          showToast("Payment received! Sign in to activate Premium.");
        }
      };
      setTimeout(upgradeUser, 1500);
    }

    // ── Upgrade pending from before sign-in ─────────────────────────
    if (localStorage.getItem("streamhub_pending_upgrade") === "true") {
      const tryPendingUpgrade = async () => {
        const { data:{ session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from("profiles").update({ tier:"premium" }).eq("id", session.user.id);
          setTier("premium");
          localStorage.removeItem("streamhub_pending_upgrade");
          showToast("🎉 Premium activated! Welcome.");
        }
      };
      setTimeout(tryPendingUpgrade, 2000);
    }

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    // Load profile
    let { data:prof } = await supabase.from("profiles").select("*").eq("id",u.id).single();
    if (!prof) {
      const localFt=(()=>{try{return JSON.parse(localStorage.getItem("streamhub_fav_teams")||"{}");}catch{return{};}})();
      const hasFt=Object.keys(localFt).length>0;
      await supabase.from("profiles").insert({id:u.id,username:u.email.split("@")[0],tier:"free",setup_done:false,...(hasFt?{favorite_teams:localFt}:{})});
      prof={id:u.id,username:u.email.split("@")[0],tier:"free",setup_done:false,...(hasFt?{favorite_teams:localFt}:{})};
    }
    setProfile(prof);
    setTier(prof.tier||"free");

    // Load subscriptions from profile
    if (prof.subscriptions) {
      try {
        const subs = typeof prof.subscriptions === "string" ? JSON.parse(prof.subscriptions) : prof.subscriptions;
        setUserSubs(subs);
        localStorage.setItem("streamhub_subs", JSON.stringify(subs));
      } catch(e) {}
    }

    // Load favorite teams — merge localStorage (pre-login) with cloud
    try {
      const localFt = JSON.parse(localStorage.getItem("streamhub_fav_teams")||"{}");
      const cloudFtRaw = prof.favorite_teams;
      const cloudFt = cloudFtRaw ? (typeof cloudFtRaw==="string"?JSON.parse(cloudFtRaw):cloudFtRaw) : {};
      const hasLocal = Object.keys(localFt).length>0;
      const hasCloud = Object.keys(cloudFt).length>0;
      if (hasCloud||hasLocal) {
        const merged = {...localFt,...cloudFt};
        setFavoriteTeams(merged);
        localStorage.setItem("streamhub_fav_teams",JSON.stringify(merged));
        if (hasLocal) supabase.from("profiles").update({favorite_teams:merged}).eq("id",u.id).catch(()=>{});
      }
    } catch(e) {}

    // Hide setup if user already completed it
    if (prof.setup_done) {
      setShowSetup(false);
      localStorage.setItem("streamhub_setup_done", "true");
    }

    // Load watchlist
    const { data:wl } = await supabase.from("watchlist").select("movie_id").eq("user_id",u.id);
    setWatchlist((wl||[]).map(w=>w.movie_id));
    // Load ratings
    const { data:rt } = await supabase.from("ratings").select("movie_id,rating").eq("user_id",u.id);
    const ratMap = {};
    (rt||[]).forEach(r=>ratMap[r.movie_id]=r.rating);
    setUserRatings(ratMap);
    // Load watch history for stats
    const { data:wh } = await supabase.from("watch_history").select("*").eq("user_id",u.id).order("watched_at",{ascending:false});
    setWatchHistory(wh||[]);
  };

  // ── Fetch featured rows for homepage ──
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const [trendData, newData, topData, animeData, sportsData] = await Promise.all([
          tmdbFetch("/trending/all/week?language=en-US&page=1"),
          tmdbFetch("/movie/now_playing?language=en-US&page=1"),
          tmdbFetch("/movie/top_rated?language=en-US&page=1"),
          tmdbFetch("/discover/tv?with_keywords=210024&sort_by=popularity.desc&language=en-US&page=1"),
          tmdbFetch("/discover/movie?with_genres=99&with_keywords=6075|1284|2702&sort_by=popularity.desc&language=en-US&page=1"),
        ]);
        const addProviders = async (items, category) => {
          return Promise.all((items||[]).slice(0,20).map(async m => {
            const type = m.media_type==="tv"||(m.first_air_date&&!m.release_date)?"tv":"movie";
            try { const wp=await tmdbFetch(`/${type}/${m.id}/watch/providers`); return {...m,providers:getProviders(wp),category}; }
            catch { return {...m,providers:[],category}; }
          }));
        };
        const [trending,newReleases,topRated,anime,sports] = await Promise.all([
          addProviders(trendData.results,"trending"),
          addProviders(newData.results,"movies"),
          addProviders(topData.results,"movies"),
          addProviders(animeData.results,"anime"),
          addProviders(sportsData.results,"sports"),
        ]);
        setFeaturedRows({ trending, newReleases, topRated, anime, sports });
      } catch(e) { console.error(e); }
    };
    loadFeatured();
  }, []);

  // ── Fetch TMDB content ──
  useEffect(() => {
    const viewMap = {
      trending: "/trending/all/week",
      movies:   "/movie/popular",
      tv:       "/tv/popular",
      anime:    "/discover/tv?with_keywords=210024&sort_by=popularity.desc",
      sports:   "/discover/movie?with_genres=99&with_keywords=6075|1284|2702&sort_by=popularity.desc",
      watchlist: null,
    };
    const path = viewMap[view];
    if (!path) { setLoading(false); return; }
    setLoading(true);
    tmdbFetch(`${path}${path.includes('?')?'&':'?'}language=en-US&page=1`).then(async data => {
      const results = (data.results||[]).slice(0,20);
      const withProviders = await Promise.all(results.map(async m => {
        const type = m.media_type==="tv"||(m.first_air_date&&!m.release_date) ? "tv" : "movie";
        try {
          const wp = await tmdbFetch(`/${type}/${m.id}/watch/providers`);
          return { ...m, providers: getProviders(wp), category: view };
        } catch { return { ...m, providers:[], category:view }; }
      }));
      setMovies(withProviders);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [view]);

  // ── Smart Search ──
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      // Enforce search limit for non-logged-in users
      if (!user) {
        const count = getSearchCount();
        if (count >= SEARCH_LIMIT) {
          setShowSearchLimit(true);
          setSearching(false);
          return;
        }
        incrementSearchCount();
        setSearchesUsed(getSearchCount());
      }
      setSearching(true);
      track("search", { search_term: search.trim(), is_mood_search: !!isGenreSearch(search) });
      try {
        const genreConfig = isGenreSearch(search);
        if (genreConfig) {
          // Genre/mood search
          const results = await doGenreSearch(genreConfig);
          setSearchResults(results);
        } else {
          // Title search
          const data = await tmdbFetch(`/search/multi?query=${encodeURIComponent(search)}&language=en-US&page=1`);
          const results = (data.results||[]).filter(r=>r.media_type!=="person").slice(0,20);
          const withProviders = await Promise.all(results.map(async m => {
            const type = m.media_type==="tv" ? "tv" : "movie";
            try {
              const wp = await tmdbFetch(`/${type}/${m.id}/watch/providers`);
              return { ...m, providers:getProviders(wp), category:m.media_type };
            } catch { return { ...m, providers:[], category:m.media_type }; }
          }));
          setSearchResults(withProviders);
        }
      } catch(e) { console.error(e); }
      setSearching(false);
    }, 500);
  }, [search]);

  // ── Watchlist ──
  const toggleWatchlist = async (movieId) => {
    if (!user) {
      showToast("Sign up free to save your watchlist! 👤");
      track("watchlist_attempt_no_auth");
      return; // Just toast - don't show blocking prompt
    }
    const inWL = watchlist.includes(movieId);
    const FREE_WL_LIMIT = 50;
    if (!inWL && tier !== "premium" && watchlist.length >= FREE_WL_LIMIT) {
      showToast("Upgrade to Premium for unlimited watchlist! ✦");
      setShowUpgrade(true);
      return;
    }
    if (inWL) {
      setWatchlist(prev=>prev.filter(x=>x!==movieId));
      await supabase.from("watchlist").delete().eq("user_id",user.id).eq("movie_id",movieId);
      showToast("Removed from watchlist");
      track("watchlist_remove", { movie_id: movieId });
    } else {
      setWatchlist(prev=>[...prev,movieId]);
      await supabase.from("watchlist").insert({user_id:user.id,movie_id:movieId});
      showToast("Added to watchlist ♥");
      track("watchlist_add", { movie_id: movieId });
    }
  };

  const handleSaveUserSubs = async (subs) => {
    setUserSubs(subs);
    localStorage.setItem("streamhub_subs", JSON.stringify(subs));
    localStorage.setItem("streamhub_setup_done", "true");
    setShowSetup(false);
    track("setup_complete", { services_count: subs.length });
    if (user) {
      await supabase.from("profiles").update({
        subscriptions: JSON.stringify(subs),
        setup_done: true,
      }).eq("id", user.id);
    }
  };

  // Load saved subs from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem("streamhub_subs");
    if (saved) {
      try { setUserSubs(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const handleSelectMovie = (movie) => {
    if (!movie) return;
    setSelectedMovie(movie);
  };

  const handleSportSearch = (query) => {
    setSearch(query);
    setView("sports");
  };

  const handleSetView = (v) => { setView(v); track("tab_change", { tab: v }); };

  const handleRate = (movieId, val) => {
    setUserRatings(p=>({...p,[movieId]:val}));
  };

  const markAsWatched = async (movie) => {
    if (!user) return showToast("Sign in to track history! 👤");
    await supabase.from("watch_history").upsert({
      user_id: user.id,
      movie_id: movie.id,
      movie_title: movie.title||movie.name||"",
      movie_poster: movie.poster_path||null,
      movie_type: movie.first_air_date ? "tv" : "movie",
    }, { onConflict:"user_id,movie_id" });
    showToast("Added to watch history ✅");
    track("mark_watched", { movie_title: movie.title||movie.name, movie_type: movie.first_air_date?"tv":"movie" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
    showToast("Signed out 👋");
    track("sign_out");
  };

  // ── Display movies ──
  const displayMovies = search.trim() ? searchResults : view==="watchlist"
    ? movies.filter(m=>watchlist.includes(m.id))
    : movies;

  const filtered = displayMovies.filter(m => !filterPlat || m.providers?.includes(filterPlat));

  const subscribed = SERVICES.filter(s=>userSubs.includes(s.id));
  const unsubscribed = SERVICES.filter(s=>!userSubs.includes(s.id));

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)",paddingBottom:80}}>
        {/* Mobile Header */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(9,7,15,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(245,158,11,.1)",paddingTop:"env(safe-area-inset-top)"}}>
          {/* Top row - logo + buttons */}
          <div style={{display:"flex",alignItems:"center",padding:"10px 14px 8px",gap:10}}>
            {/* Home button + Logo */}
            <div style={{flex:1,display:"flex",alignItems:"center",gap:0}}>
              <button onClick={()=>{setView("home");setSearch("");}}
                style={{background:view==="home"&&!search.trim()?"rgba(245,158,11,.15)":"rgba(255,255,255,.06)",border:`1px solid ${view==="home"&&!search.trim()?"rgba(245,158,11,.4)":"rgba(255,255,255,.1)"}`,borderRadius:10,color:view==="home"&&!search.trim()?"var(--gold)":"var(--muted)",width:34,height:34,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:10}}>
                🏠
              </button>
              <div style={{width:"1px",height:28,background:"rgba(255,255,255,.1)",flexShrink:0,marginRight:10}}/>
              <img
                src="/logo-clean.png"
                alt="The StreamHub"
                onClick={()=>{setView("home");setSearch("");}}
                onError={e=>e.target.style.display="none"}
                style={{
                  height:52, width:"auto", maxWidth:160,
                  objectFit:"contain", cursor:"pointer",
                  filter:"drop-shadow(0 0 10px rgba(245,158,11,.5)) drop-shadow(0 0 20px rgba(139,92,246,.3))",
                  animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3s ease-in-out infinite",
                }}
              />
            </div>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:99,fontFamily:"var(--font-head)",flexShrink:0}}>✦ PRO</span>
              :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"var(--gold)",border:"none",borderRadius:9,color:"#000",padding:"7px 12px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>Upgrade ✦</button>
            }
            <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{
                width:36,height:36,borderRadius:"50%",
                background:"var(--purple)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,
                border:tier==="premium"?"2.5px solid #F59E0B":"2px solid rgba(139,92,246,.4)",
                boxShadow:tier==="premium"?"0 0 12px rgba(245,158,11,.5)":"none",
                color:"#fff",flexShrink:0,cursor:"pointer",
                overflow:"hidden",padding:0,
                transition:"all .3s",
              }}>
                {user && profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : user?(profile?.username||user.email||"U")[0].toUpperCase():"?"
                }
              </button>
          </div>
          {/* Search bar - full width, prominent */}
          <div style={{padding:"0 14px 10px",position:"relative"}}>
            <span style={{position:"absolute",left:26,top:"50%",transform:"translateY(-60%)",color:"var(--gold)",fontSize:16}}>🔍</span>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by title, genre or mood…"
              style={{
                width:"100%", background:"rgba(255,255,255,.1)",
                border:"1.5px solid rgba(245,158,11,.4)",
                borderRadius:14, color:"var(--text)",
                padding:"12px 16px 12px 38px",
                fontSize:15, outline:"none",
                boxShadow:"0 2px 16px rgba(245,158,11,.1)",
              }}
            />
          </div>

        </div>

        {/* WelcomeBanner for new users — above brand banner */}
        {!user && view==="home" && !search.trim() && <WelcomeBanner />}

        {/* 🎭 AI BRAND BANNER — mobile, right under search bar */}
        {!search.trim() && view==="home" && (
          <div style={{
            margin:"4px 14px 16px",
            borderRadius:20,
            overflow:"hidden",
            position:"relative",
            background:"linear-gradient(135deg,#0d0520 0%,#12053a 40%,#0a1628 100%)",
            border:"1px solid rgba(139,92,246,.35)",
            boxShadow:"0 8px 40px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.06)",
            padding:"18px 16px 16px",
            textAlign:"center",
          }}>
            {/* glow blobs */}
            <div style={{position:"absolute",top:-30,left:-30,width:120,height:120,borderRadius:"50%",background:"rgba(139,92,246,.25)",filter:"blur(40px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,107,157,.2)",filter:"blur(40px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:160,height:80,borderRadius:"50%",background:"rgba(6,182,212,.12)",filter:"blur(30px)",pointerEvents:"none"}}/>
            {/* tagline */}
            <div style={{
              fontFamily:"var(--font-head)", fontWeight:800,
              fontSize:20, letterSpacing:"-.02em", marginBottom:12,
              background:"linear-gradient(90deg,#C4B5FD,#E9D5FF,#F59E0B,#C4B5FD)",
              backgroundSize:"200% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 3s linear infinite",
              position:"relative",
            }}>Your AI Streaming Assistant</div>
            {/* pills */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,position:"relative",width:"100%"}}>
              {[
                {word:"SEARCH", bg:"#F59E0B", glow:"rgba(245,158,11,.7)"},
                {word:"FIND",   bg:"#8B5CF6", glow:"rgba(139,92,246,.7)"},
                {word:"ENJOY",  bg:"#FFFFFF", glow:"rgba(255,255,255,.6)"},
              ].map((item,i)=>(
                <div key={item.word} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{
                    background:item.bg, borderRadius:99,
                    padding:"7px 11px",
                    fontFamily:"var(--font-head)", fontWeight:900,
                    fontSize:11, letterSpacing:1.5, color:"#000",
                    boxShadow:`0 0 14px ${item.glow}, 0 0 28px ${item.glow}66`,
                    whiteSpace:"nowrap",
                  }}>{item.word}</div>
                  {i<2 && <span style={{color:"rgba(255,255,255,.35)",fontSize:12,fontWeight:700}}>—</span>}
                </div>
              ))}
            </div>
            {/* Mood Search CTA with usage info */}
            <button onClick={()=>setShowMoodSearch(true)}
              style={{marginTop:12,background:"rgba(139,92,246,.2)",border:"1px solid rgba(139,92,246,.5)",borderRadius:12,color:"#c4b5fd",padding:"10px 16px",fontSize:11,fontWeight:700,fontFamily:"var(--font-head)",cursor:"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <span>🎭 Try Mood Search — describe any vibe</span>
              <span style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:"3px 8px",fontSize:10,fontWeight:600,color:"rgba(196,181,253,.7)",whiteSpace:"nowrap"}}>
                "🎭 Free for everyone"
              </span>
            </button>

          </div>
        )}

        {/* Search status */}
        {search.trim() && (
          <div style={{padding:"12px 14px 0",fontSize:13,color:"var(--muted)"}}>
            {searching?"Searching…":`${searchResults.length} results for "${search}"`}
          </div>
        )}

        {/* Daily Pick Banner */}
        {view==="home"&&!search.trim()&&featuredRows.trending?.length>0&&(
          <DailyPickBanner
            movie={(featuredRows.trending||[]).filter(m=>(m.providers||[]).length>0)[new Date().getDay()%Math.max(1,(featuredRows.trending||[]).filter(m=>(m.providers||[]).length>0).slice(0,8).length)]||featuredRows.topRated?.[0]}
            onSelect={handleSelectMovie}
            onShare={(m)=>handleShareMovie(m)}
          />
        )}

        {/* Sports Hub + Premium Tools — home view only */}
        {view==="home"&&!search.trim()&&(<>
        <div style={{padding:"0 14px 12px"}}>
          <button onClick={()=>{setView("sports");setSearch("");}}
            style={{
              width:"100%",
              background:"linear-gradient(135deg,rgba(7,15,7,.95) 0%,rgba(10,30,15,.95) 50%,rgba(5,20,10,.95) 100%)",
              border:"1.5px solid rgba(16,185,129,.45)",
              borderRadius:16, padding:"13px 16px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              cursor:"pointer",
              boxShadow:"0 4px 24px rgba(16,185,129,.15), inset 0 1px 0 rgba(16,185,129,.1)",
              transition:"all .2s",
            }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(.98)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{position:"relative",width:42,height:42,borderRadius:12,background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:22,animation:"trophyBounce 2s ease-in-out infinite, sportsGlow 2s ease-in-out infinite"}}>🏆</span>
                <div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",border:"1.5px solid var(--bg)",boxShadow:"0 0 6px #ef4444"}}/>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,color:"#fff",marginBottom:2}}>Sports Hub</div>
                <div style={{fontSize:11,color:"rgba(16,185,129,.8)",fontWeight:600}}>Live scores · Schedules · World Cup 🔴</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.35)",borderRadius:99,padding:"3px 8px",fontSize:9,fontWeight:800,color:"#ef4444",letterSpacing:.5}}>LIVE</div>
              <span style={{color:"rgba(16,185,129,.6)",fontSize:16}}>›</span>
            </div>
          </button>
        </div>

        {/* Mobile Premium Tools Strip */}
        <div style={{padding:"0 14px 16px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
          <div style={{display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
            {[
              {icon:"💰", label:"Cost Report",  sub:"AI tells you what to keep or cut",     onClick:()=>setShowCostCalc(true),          color:"#10B981",grad:"rgba(16,185,129,.1)"},
              {icon:"🌙", label:"Watch Tonight",sub:"AI picks one perfect thing right now",  onClick:()=>setShowWatchTonight(true),      color:"#8B5CF6",grad:"rgba(139,92,246,.12)"},
              {icon:"✦", label:"For You",      sub:"Personalized picks from your taste",  onClick:()=>setShowPersonalizedRecs(true), color:"#F59E0B",grad:"rgba(245,158,11,.1)"},
              {icon:"🚨", label:"Leaving Soon", sub:"Titles leaving your services soon",    onClick:()=>setShowLeavingSoon(true),       color:"#EF4444",grad:"rgba(239,68,68,.1)"},
            ].map(item=>(
              <button key={item.label} onClick={item.onClick}
                style={{flexShrink:0,background:item.grad,border:`1.5px solid ${item.color}55`,borderRadius:16,padding:"14px 14px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",minWidth:144,transition:"all .2s",position:"relative"}}
                onTouchStart={e=>e.currentTarget.style.borderColor=`${item.color}cc`}
                onTouchEnd={e=>e.currentTarget.style.borderColor=`${item.color}55`}>
                {item.live && <div style={{position:"absolute",top:8,right:8,background:"#ef4444",borderRadius:99,padding:"2px 6px",fontSize:8,fontWeight:900,color:"#fff",animation:"pulse 1.5s infinite"}}>LIVE</div>}
                {!item.live && tier!=="premium" && <div style={{position:"absolute",top:8,right:8,background:"var(--gold)",color:"#000",fontSize:7,fontWeight:900,padding:"2px 5px",borderRadius:99}}>PRO</div>}
                <span style={{fontSize:28,lineHeight:1,animation:item.live?"trophyBounce 2s ease-in-out infinite":undefined}}>{item.icon}</span>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:"#fff"}}>{item.label}</div>
                <div style={{fontSize:10,color:"rgba(240,240,250,.5)",lineHeight:1.4}}>{item.sub}</div>
              </button>
            ))}
          </div>
        </div>
        </>)}

        {/* Mobile content area */}
        {view==="home"&&!search.trim() ? (
          <div>
            {/* Other featured rows */}
            {[
              {title:"New on Streaming",icon:"🆕",key:"newReleases",color:"#10B981"},
              {title:"Top Rated",icon:"⭐",key:"topRated",color:"var(--purple)"},
              {title:"Anime",icon:"✦",key:"anime",color:"var(--anime)"},
              {title:"Sports & Docs",icon:"🏆",key:"sports",color:"var(--sports)"},
            ].map(row=>(
              <div key={row.title} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 14px",marginBottom:10}}>
                  <span>{row.icon}</span>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:row.color}}>{row.title}</div>
                </div>
                <div style={{display:"flex",flexWrap:"nowrap",gap:10,overflowX:"auto",padding:"2px 14px 4px",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
                  {(featuredRows[row.key]||[]).slice(0,10).map(m=>(
                    <div key={m.id} style={{flexShrink:0,width:130}}>
                      <MovieCard movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : view==="sports" ? (
          /* ── DEDICATED SPORTS HUB ── */
          <div style={{padding:"12px 14px",overflowY:"auto",flex:1}}>
            {!search.trim() ? (
              <>
                <PredictionStatsBar/>
                <TeamNextGameSearch favoriteTeams={favoriteTeams}/>
                <SportCategoryGrid onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                <SportsStreamingGuide onSearch={handleSportSearch}/>
              </>
            ) : (
              <>
                <button onClick={()=>setSearch("")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:99,color:"var(--muted)",padding:"5px 12px",fontSize:12,cursor:"pointer",marginBottom:14}}>← Back to Sports</button>
                {search==="soccer_hub" ? <SoccerHub onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                  : search.toLowerCase().includes("olympic") ? <OlympicsPlaceholder/>
                  : <><LiveSportsSection sportQuery={search} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavoriteTeam} user={user} showToast={showToast} onPredResult={handlePredResult}/><SportMovieBridge activeSport={search} onSelect={handleSelectMovie}/></>}
              </>
            )}
          </div>
        ) : view==="stats" ? (
          <div style={{padding:"14px 14px 100px"}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,marginBottom:2}}>📊 My Stats</div>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Your streaming activity at a glance</div>
            <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} onOpenHistory={()=>setShowWatchHistory(true)} onOpenWatchlist={()=>handleSetView("watchlist")}/>
          </div>
        ) : (
          /* Regular grid */
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,padding:"12px 14px"}}>
            {loading&&!search
              ? Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)
              : filtered.length===0
                ? <div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--muted)",padding:"60px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty. Tap ♡ to save titles!":"No results found."}</div>
                : filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)
            }
          </div>
        )}

        <MobileBottomNav view={view} setView={v=>{handleSetView(v);setSearch("");}} watchlist={watchlist} tier={tier} onProfile={()=>user?setShowProfile(true):setShowAuth(true)} />

        {/* Advanced Stats Section */}

        {/* Spacer so content scrolls fully above bottom nav + tagline */}
        <div style={{height:160}} />

      </div>

      {/* Modals */}
      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:'movie'})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} userSubs={userSubs} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}} notifPermission={notifPermission} onRequestNotif={requestNotifications} streak={streak}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showOnboarding&&<OnboardingModal onFinish={()=>{setShowOnboarding(false);setShowSetup(true);}}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} profile={profile}/>}
      {showNewReleases&&<NewReleasesModal onClose={()=>setShowNewReleases(false)} user={user} tier={tier} userSubs={userSubs} onSelect={handleSelectMovie} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showWatchTonight&&<WatchTonightModal onClose={()=>setShowWatchTonight(false)} user={user} tier={tier} userSubs={userSubs} watchlist={watchlist} userRatings={userRatings} onUpgrade={()=>setShowUpgrade(true)} onSelect={handleSelectMovie}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {shareContent&&<ShareModal title={shareContent.title} text={shareContent.text} url={shareContent.url} onClose={()=>setShareContent(null)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {predCelebration&&<PredictionCelebrationModal streak={predCelebration.streak} points={predCelebration.points} milestone={predCelebration.milestone} onClose={()=>setPredCelebration(null)}/>}
      <CookieConsent/>
      <Analytics />
    </>
  );

  // ─── TABLET LAYOUT ───────────────────────────────────────────────────────────
  if (device === "tablet") return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)",paddingBottom:72}}>
        {/* Tablet Header */}
        <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(9,7,15,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(245,158,11,.15)",paddingTop:"env(safe-area-inset-top)"}}>
          <div style={{display:"flex",alignItems:"center",padding:"10px 20px",gap:12,height:64}}>

            {/* Home button + Logo */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <button onClick={()=>{setView("home");setSearch("");}}
                style={{background:view==="home"&&!search?"rgba(245,158,11,.15)":"rgba(255,255,255,.06)",border:`1px solid ${view==="home"&&!search?"rgba(245,158,11,.4)":"rgba(255,255,255,.1)"}`,borderRadius:10,color:view==="home"&&!search?"var(--gold)":"var(--muted)",width:36,height:36,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                🏠
              </button>
              <img src="/logo-clean.png" alt="StreamHub" onClick={()=>{setView("home");setSearch("");}}
                onError={e=>e.target.style.display="none"}
                style={{height:36,width:"auto",objectFit:"contain",cursor:"pointer",filter:"drop-shadow(0 0 8px rgba(245,158,11,.4))"}}/>
            </div>

            <div style={{flex:1,position:"relative",maxWidth:380}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontSize:15}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, genre or mood…"
                style={{width:"100%",background:"rgba(255,255,255,.07)",border:"2px solid rgba(245,158,11,.45)",borderRadius:12,color:"var(--text)",padding:"9px 14px 9px 38px",fontSize:14,outline:"none",boxShadow:"0 0 16px rgba(245,158,11,.12)"}}
                onFocus={e=>{e.target.style.border="2px solid #F59E0B";e.target.style.boxShadow="0 0 24px rgba(245,158,11,.3)";}}
                onBlur={e=>{e.target.style.border="2px solid rgba(245,158,11,.45)";e.target.style.boxShadow="0 0 16px rgba(245,158,11,.12)";}}
              />
            </div>
            <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
              {tier==="premium"
                ?<span style={{background:"var(--gold)",color:"#000",fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,fontFamily:"var(--font-head)"}}>✦ PREMIUM</span>
                :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"9px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,boxShadow:"0 0 16px rgba(245,158,11,.35)",cursor:"pointer"}}>Upgrade ✦</button>
              }
              {!user
                ?<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",border:"1px solid rgba(139,92,246,.4)",borderRadius:10,color:"#fff",padding:"9px 16px",fontWeight:800,fontSize:13,fontFamily:"var(--font-head)",boxShadow:"0 0 16px rgba(139,92,246,.35)",cursor:"pointer"}}>👤 Sign In</button>
                :<button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{
                width:36,height:36,borderRadius:"50%",
                background:"var(--purple)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,
                border:tier==="premium"?"2.5px solid #F59E0B":"2px solid rgba(139,92,246,.4)",
                boxShadow:tier==="premium"?"0 0 12px rgba(245,158,11,.5)":"none",
                color:"#fff",flexShrink:0,cursor:"pointer",
                overflow:"hidden",padding:0,
                transition:"all .3s",
              }}>
                {user && profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : user?(profile?.username||user.email||"U")[0].toUpperCase():"?"
                }
              </button>
              }
            </div>
          </div>

        </header>

        {/* Tablet Hero with Trailer */}
        {!user && view==="home" && !search.trim() && <WelcomeBanner />}

        {/* 🎭 AI BRAND BANNER — tablet, above hero */}
        {view==="home"&&!search.trim()&&(
          <div style={{
            margin:"12px 20px 0",
            borderRadius:24,
            overflow:"hidden",
            position:"relative",
            background:"linear-gradient(135deg,#0d0520 0%,#12053a 40%,#0a1628 100%)",
            border:"1px solid rgba(139,92,246,.35)",
            boxShadow:"0 12px 60px rgba(139,92,246,.3), inset 0 1px 0 rgba(255,255,255,.07)",
            padding:"22px 106px",
          }}>
            {/* glow blobs */}
            <div style={{position:"absolute",top:-40,left:-40,width:200,height:200,borderRadius:"50%",background:"rgba(139,92,246,.2)",filter:"blur(60px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(255,107,157,.15)",filter:"blur(60px)",pointerEvents:"none"}}/>
            {/* Left glowing logo — absolutely centered vertically */}
            <img src="/logo-clean.png" alt="" style={{
              position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              height:72, width:"auto", objectFit:"contain",
              filter:"drop-shadow(0 0 18px rgba(245,158,11,.8)) drop-shadow(0 0 36px rgba(139,92,246,.6))",
              animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3s ease-in-out infinite",
            }}/>
            {/* Center content */}
            <div style={{textAlign:"center"}}>
              <div style={{
                fontFamily:"var(--font-head)", fontWeight:800,
                fontSize:22, letterSpacing:"-.02em", marginBottom:12, lineHeight:1.2,
                background:"linear-gradient(90deg,#C4B5FD,#E9D5FF,#F59E0B,#C4B5FD)",
                backgroundSize:"200% auto",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                animation:"gradientShift 3s linear infinite",
              }}>Your AI Streaming Assistant</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10,flexWrap:"nowrap"}}>
                {[
                  {word:"SEARCH", bg:"#F59E0B", glow:"rgba(245,158,11,.7)"},
                  {word:"FIND",   bg:"#8B5CF6", glow:"rgba(139,92,246,.7)"},
                  {word:"ENJOY",  bg:"#FFFFFF", glow:"rgba(255,255,255,.6)"},
                ].map((item,i)=>(
                  <div key={item.word} style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{
                      background:item.bg, borderRadius:99,
                      padding:"8px 16px",
                      fontFamily:"var(--font-head)", fontWeight:900,
                      fontSize:12, letterSpacing:2, color:"#000",
                      boxShadow:`0 0 16px ${item.glow}, 0 0 32px ${item.glow}55`,
                      whiteSpace:"nowrap",
                    }}>{item.word}</div>
                    {i<2 && <span style={{color:"rgba(255,255,255,.35)",fontSize:14,fontWeight:700}}>—</span>}
                  </div>
                ))}
              </div>
              {/* Mood Search CTA with usage info — centered */}
              <div style={{display:"flex",justifyContent:"center",marginTop:10,pointerEvents:"all"}}>
                <button onClick={()=>setShowMoodSearch(true)}
                  style={{background:"rgba(139,92,246,.2)",border:"1px solid rgba(139,92,246,.5)",borderRadius:12,color:"#c4b5fd",padding:"9px 18px",fontSize:11,fontWeight:700,fontFamily:"var(--font-head)",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:12,transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(139,92,246,.35)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(139,92,246,.2)"}>
                  <span>🎭 Try Mood Search — describe any vibe</span>
                  <span style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:"3px 10px",fontSize:10,fontWeight:600,color:"rgba(196,181,253,.7)",whiteSpace:"nowrap"}}>
                    "🎭 Free"
                  </span>
                </button>
              </div>

            </div>
            {/* Right glowing logo — absolutely centered vertically */}
            <img src="/logo-clean.png" alt="" style={{
              position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
              height:72, width:"auto", objectFit:"contain",
              filter:"drop-shadow(0 0 18px rgba(245,158,11,.8)) drop-shadow(0 0 36px rgba(139,92,246,.6))",
              animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3.4s ease-in-out infinite",
            }}/>
          </div>
        )}

        {/* Tablet Hero with Trailer */}


        {/* Tablet Grid */}
        <div style={{padding:"20px 20px 120px"}}>
          {/* Tablet Premium Tools — home view only */}
          {view==="home"&&!search.trim()&&<div style={{marginBottom:24}}>
            {/* Sports Hub Button */}
            <button onClick={()=>{setView("sports");setSearch("");}}
              style={{
                width:"100%", marginBottom:14,
                background:"linear-gradient(135deg,rgba(7,15,7,.95),rgba(10,30,15,.95))",
                border:"1.5px solid rgba(16,185,129,.4)", borderRadius:16,
                padding:"14px 18px", display:"flex", alignItems:"center",
                justifyContent:"space-between", cursor:"pointer",
                boxShadow:"0 4px 20px rgba(16,185,129,.12)",
              }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{position:"relative",width:44,height:44,borderRadius:12,background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:22,animation:"trophyBounce 2s ease-in-out infinite, sportsGlow 2s ease-in-out infinite"}}>🏆</span>
                  <div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",border:"1.5px solid var(--bg)",boxShadow:"0 0 6px #ef4444"}}/>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:"#fff",marginBottom:2}}>Sports Hub</div>
                  <div style={{fontSize:12,color:"rgba(16,185,129,.8)"}}>Live scores · Schedules · World Cup 🔴</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.35)",borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:800,color:"#ef4444"}}>LIVE</div>
                <span style={{color:"rgba(16,185,129,.6)",fontSize:18}}>›</span>
              </div>
            </button>
            <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:12,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[
                {icon:"💰", label:"Cost Report",  sub:"AI tells you what to keep or cut",          onClick:()=>setShowCostCalc(true),color:"#10B981",grad:"rgba(16,185,129,.1)"},
                {icon:"🌙", label:"Watch Tonight",sub:"AI picks one perfect thing right now",  onClick:()=>setShowWatchTonight(true),color:"#8B5CF6",grad:"rgba(139,92,246,.12)"},
                {icon:"✦", label:"For You",      sub:"Personalized picks from your taste",         onClick:()=>setShowPersonalizedRecs(true),color:"#F59E0B",grad:"rgba(245,158,11,.1)"},
                {icon:"🚨", label:"Leaving Soon", sub:"Titles leaving your services soon",          onClick:()=>setShowLeavingSoon(true),color:"#EF4444",grad:"rgba(239,68,68,.1)"},
              ].map(item=>(
                <button key={item.label} onClick={item.onClick}
                  style={{background:item.grad,border:`1.5px solid ${item.color}55`,borderRadius:14,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",transition:"all .2s",width:"100%",position:"relative",textAlign:"left"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${item.color}aa`;e.currentTarget.style.background=`${item.color}18`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=`${item.color}55`;e.currentTarget.style.background=item.grad;}}>
                  {tier!=="premium"&&<div style={{position:"absolute",top:8,right:8,background:"var(--gold)",color:"#000",fontSize:7,fontWeight:900,padding:"2px 5px",borderRadius:99}}>PRO</div>}
                  <span style={{fontSize:26,lineHeight:1}}>{item.icon}</span>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:12,color:"#fff",marginTop:2}}>{item.label}</div>
                  <div style={{fontSize:10,color:"rgba(240,240,250,.5)",lineHeight:1.4}}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>}
          {view==="home"&&!search.trim() ? (
            <div>
              {[{title:"New on Streaming",icon:"🆕",key:"newReleases",color:"#10B981"},{title:"Top Rated",icon:"⭐",key:"topRated",color:"var(--purple)"},{title:"Anime",icon:"✦",key:"anime",color:"var(--anime)"},{title:"Sports & Docs",icon:"🏆",key:"sports",color:"var(--sports)"}].map(row=>(
                <div key={row.title} style={{marginBottom:32}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <span style={{fontSize:18}}>{row.icon}</span>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:17,color:row.color}}>{row.title}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {(featuredRows[row.key]||[]).slice(0,8).map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                  </div>
                </div>
              ))}
            </div>
          ) : view==="sports" ? (
            /* ── DEDICATED SPORTS HUB — tablet ── */
            <div>
              {!search.trim() ? (
                <>
                  <PredictionStatsBar/>
                <TeamNextGameSearch favoriteTeams={favoriteTeams}/>
                <SportCategoryGrid onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                  <SportsStreamingGuide onSearch={handleSportSearch}/>
                </>
              ) : (
                <>
                  <button onClick={()=>setSearch("")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:99,color:"var(--muted)",padding:"5px 12px",fontSize:12,cursor:"pointer",marginBottom:16}}>← Back to Sports</button>
                  {search==="soccer_hub" ? <SoccerHub onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                    : search.toLowerCase().includes("olympic") ? <OlympicsPlaceholder/>
                    : <><LiveSportsSection sportQuery={search} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavoriteTeam} user={user} showToast={showToast} onPredResult={handlePredResult}/><SportMovieBridge activeSport={search} onSelect={handleSelectMovie}/></>}
                </>
              )}
            </div>
          ) : view==="stats" ? (
            <div style={{padding:"0 0 40px"}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,marginBottom:2}}>📊 My Stats</div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Your streaming activity at a glance</div>
              <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} onOpenHistory={()=>setShowWatchHistory(true)} onOpenWatchlist={()=>handleSetView("watchlist")}/>
            </div>
          ) : (
            <>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18,marginBottom:16}}>
                {search.trim() ? (searching?"Searching…":`${searchResults.length} results for "${search}"`) : CATEGORY_TABS.find(t=>t.id===view)?.icon+" "+CATEGORY_TABS.find(t=>t.id===view)?.label}
                {!search&&!loading&&<span style={{fontWeight:400,fontSize:14,color:"var(--muted)",marginLeft:10}}>{filtered.length} titles</span>}
              </div>
              {loading&&!search
                ?<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
                :filtered.length===0
                  ?<div style={{textAlign:"center",color:"var(--muted)",padding:"80px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty!":"No results found."}</div>
                  :<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                  </div>
              }
            </>
          )}
        </div>

        {/* Advanced Stats Section */}

        {/* Spacer so content scrolls above bottom nav */}
        <div style={{height:100}} />

        {/* Tablet Bottom Nav */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(9,7,15,.98)",borderTop:"1px solid rgba(245,158,11,.1)",display:"flex",backdropFilter:"blur(20px)"}}>
          {[
                    {id:"movies",  icon:"🎬",label:"Movies",  color:"#06B6D4",anim:null},
            {id:"tv",      icon:"📺",label:"TV",      color:"#A78BFA",anim:"tvFlicker"},
            {id:"anime",   icon:"✦", label:"Anime",   color:"#FF6B9D",anim:"swordSwing"},
            {id:"watchlist",icon:"♥",label:"Watchlist",color:"#F59E0B",anim:null},
            {id:"stats",    icon:"📊",label:"Stats",    color:"#10B981",anim:null},
          ].map(t=>{
            const active=view===t.id;
            return <button key={t.id} onClick={()=>{setView(t.id);setSearch("");}}
              style={{flex:1,background:"none",border:"none",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:active?t.color:"rgba(240,240,250,.35)",position:"relative",cursor:"pointer"}}>
              {t.special ? (
                <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                  {!active && <div style={{position:"absolute",inset:-4,borderRadius:"50%",animation:"sportsTabPulse 2s ease-in-out infinite",pointerEvents:"none"}}/>}
                  <span style={{fontSize:22,lineHeight:1,display:"inline-block",animation:`trophyBounce 2s ease-in-out infinite, sportsGlow ${active?"1s":"2s"} ease-in-out infinite`,filter:active?`drop-shadow(0 0 12px #10B981) drop-shadow(0 0 24px rgba(245,158,11,.5))`:`drop-shadow(0 0 6px rgba(16,185,129,.6))`}}>🏆</span>
                  <div style={{position:"absolute",top:-2,right:-4,width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s ease-in-out infinite",boxShadow:"0 0 6px #ef4444"}}/>
                </div>
              ) : (
                <span style={{fontSize:22,lineHeight:1,filter:active?`drop-shadow(0 0 8px ${t.color}cc)`:"none",display:"inline-block",animation:active&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none"}}>{t.icon}</span>
              )}
              <span style={{fontSize:10,fontWeight:800,fontFamily:"var(--font-head)",color:t.special?(active?"#10B981":"rgba(16,185,129,.8)"):(active?t.color:"rgba(240,240,250,.35)")}}>{t.label}</span>
              {active&&<span style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:36,height:2.5,background:t.color,borderRadius:99,boxShadow:`0 0 8px ${t.color}`}}/>}
            </button>;
          })}
          <button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{flex:1,background:"none",border:"none",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:"rgba(240,240,250,.35)",cursor:"pointer"}}>
            <span style={{fontSize:22}}>👤</span>
            <span style={{fontSize:10,fontWeight:800,fontFamily:"var(--font-head)"}}>Profile</span>
          </button>
        </div>
      </div>

      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:'movie'})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} userSubs={userSubs} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}} notifPermission={notifPermission} onRequestNotif={requestNotifications} streak={streak}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showOnboarding&&<OnboardingModal onFinish={()=>{setShowOnboarding(false);setShowSetup(true);}}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} profile={profile}/>}
      {showNewReleases&&<NewReleasesModal onClose={()=>setShowNewReleases(false)} user={user} tier={tier} userSubs={userSubs} onSelect={handleSelectMovie} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showWatchTonight&&<WatchTonightModal onClose={()=>setShowWatchTonight(false)} user={user} tier={tier} userSubs={userSubs} watchlist={watchlist} userRatings={userRatings} onUpgrade={()=>setShowUpgrade(true)} onSelect={handleSelectMovie}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {shareContent&&<ShareModal title={shareContent.title} text={shareContent.text} url={shareContent.url} onClose={()=>setShareContent(null)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {predCelebration&&<PredictionCelebrationModal streak={predCelebration.streak} points={predCelebration.points} milestone={predCelebration.milestone} onClose={()=>setPredCelebration(null)}/>}
      <CookieConsent/>
      <Analytics />
    </>
  );

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        {/* Header */}
        <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(9,7,15,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(245,158,11,.15)",padding:"0 20px",height:64,display:"flex",alignItems:"center",gap:12}}>
          <nav style={{display:"flex",gap:2,marginLeft:8,flexShrink:0}}>
            <button onClick={()=>{setView("home");setSearch("");window.scrollTo(0,0);}}
              style={{background:"none",border:"none",color:view==="home"&&!search?"var(--gold)":"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"6px 10px",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              🏠 Home
            </button>
            {CATEGORY_TABS.filter(t=>t.id!=="search").map(t=>(
              <button key={t.id} onClick={()=>{setView(t.id);setSearch("");}}
                style={{background:view===t.id?`${t.color}15`:"none",border:"none",color:view===t.id?t.color:"var(--muted)",fontFamily:"var(--font-head)",fontWeight:700,fontSize:13,padding:"6px 10px",borderRadius:9,transition:"all .2s",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",boxShadow:view===t.id?`0 0 14px ${t.color}30`:"none",cursor:"pointer"}}>
                <span style={{display:"inline-block",position:"relative",
                    animation:t.special?`trophyBounce 2s ease-in-out infinite, sportsGlow ${view===t.id?"1s":"2.5s"} ease-in-out infinite`:view===t.id&&t.anim?`${t.anim} 1.5s ease-in-out infinite`:"none"}}>
                  {t.icon}
                  {t.special&&<span style={{position:"absolute",top:-2,right:-3,width:6,height:6,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",boxShadow:"0 0 5px #ef4444"}}/>}
                </span>
                {t.label}
              </button>
            ))}
          </nav>
          {/* Search bar */}
          <div style={{flex:1,minWidth:160,maxWidth:320,position:"relative",marginLeft:8}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontSize:15,zIndex:1}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, genre or mood…"
              style={{width:"100%",background:"rgba(255,255,255,.07)",border:"2px solid rgba(245,158,11,.5)",borderRadius:12,color:"var(--text)",padding:"9px 14px 9px 36px",fontSize:13,outline:"none",boxShadow:"0 0 16px rgba(245,158,11,.15)"}}
              onFocus={e=>{e.target.style.border="2px solid #F59E0B";e.target.style.boxShadow="0 0 24px rgba(245,158,11,.35)";}}
              onBlur={e=>{e.target.style.border="2px solid rgba(245,158,11,.5)";e.target.style.boxShadow="0 0 16px rgba(245,158,11,.15)";}}
            />
          </div>
          {/* Right buttons */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexShrink:0}}>
            {tier==="premium"
              ?<span style={{background:"var(--gold)",color:"#000",fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,fontFamily:"var(--font-head)",whiteSpace:"nowrap"}}>✦ PREMIUM</span>
              :<button onClick={()=>{setShowUpgrade(true);track("upgrade_click");}} style={{background:"linear-gradient(135deg,#F59E0B,#f59e0b)",border:"none",borderRadius:10,color:"#000",padding:"9px 16px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,boxShadow:"0 0 16px rgba(245,158,11,.4)",whiteSpace:"nowrap",cursor:"pointer"}}>Upgrade ✦</button>
            }
            {!user
              ?<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",border:"1px solid rgba(139,92,246,.5)",borderRadius:10,color:"#fff",padding:"9px 18px",fontWeight:800,fontSize:13,fontFamily:"var(--font-head)",boxShadow:"0 0 16px rgba(139,92,246,.4)",whiteSpace:"nowrap",cursor:"pointer"}}>👤 Sign In</button>
              :<button onClick={()=>user?setShowProfile(true):setShowAuth(true)} style={{
                width:36,height:36,borderRadius:"50%",
                background:"var(--purple)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,
                border:tier==="premium"?"2.5px solid #F59E0B":"2px solid rgba(139,92,246,.4)",
                boxShadow:tier==="premium"?"0 0 12px rgba(245,158,11,.5)":"none",
                color:"#fff",flexShrink:0,cursor:"pointer",
                overflow:"hidden",padding:0,
                transition:"all .3s",
              }}>
                {user && profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : user?(profile?.username||user.email||"U")[0].toUpperCase():"?"
                }
              </button>
            }
          </div>
        </header>

        {/* 🎭 AI BRAND BANNER — full width, above all three columns */}
        {view==="home"&&!search.trim()&&(
          <div style={{
            margin:"0",
            padding:"0 24px 0",
            maxWidth:1440,
            marginLeft:"auto",
            marginRight:"auto",
          }}>
            {!user && <WelcomeBanner />}
            <div style={{
              borderRadius:24,
              overflow:"hidden",
              position:"relative",
              background:"linear-gradient(135deg,#0d0520 0%,#12053a 45%,#0a1628 100%)",
              border:"1px solid rgba(139,92,246,.4)",
              boxShadow:"0 12px 60px rgba(139,92,246,.3), inset 0 1px 0 rgba(255,255,255,.08)",
              padding:"24px 32px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:20,
            }}>
              {/* glow blobs */}
              <div style={{position:"absolute",top:-60,left:-60,width:260,height:260,borderRadius:"50%",background:"rgba(139,92,246,.18)",filter:"blur(80px)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:-60,right:-60,width:260,height:260,borderRadius:"50%",background:"rgba(255,107,157,.14)",filter:"blur(80px)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:400,height:100,background:"rgba(6,182,212,.07)",filter:"blur(60px)",pointerEvents:"none"}}/>
              {/* Left glowing logo */}
              <img src="/logo-clean.png" alt="" style={{
                height:90, width:"auto", objectFit:"contain", flexShrink:0,
                filter:"drop-shadow(0 0 20px rgba(245,158,11,.9)) drop-shadow(0 0 40px rgba(139,92,246,.7))",
                animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3s ease-in-out infinite",
              }}/>
              {/* Center content — absolutely centered in the banner */}
              <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",textAlign:"center",width:"60%",pointerEvents:"none"}}>
                <div style={{
                  fontFamily:"var(--font-head)", fontWeight:800,
                  fontSize:30, letterSpacing:"-.02em", marginBottom:14,
                  background:"linear-gradient(90deg,#C4B5FD,#E9D5FF,#F59E0B,#C4B5FD)",
                  backgroundSize:"200% auto",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  animation:"gradientShift 3s linear infinite",
                  whiteSpace:"nowrap",
                }}>Your AI Streaming Assistant</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12,pointerEvents:"all"}}>
                  {[
                    {word:"SEARCH", bg:"#F59E0B", glow:"rgba(245,158,11,.7)"},
                    {word:"FIND",   bg:"#8B5CF6", glow:"rgba(139,92,246,.7)"},
                    {word:"ENJOY",  bg:"#FFFFFF", glow:"rgba(255,255,255,.6)"},
                  ].map((item,i)=>(
                    <div key={item.word} style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{
                        background:item.bg, borderRadius:99,
                        padding:"10px 26px",
                        fontFamily:"var(--font-head)", fontWeight:900,
                        fontSize:14, letterSpacing:3, color:"#000",
                        boxShadow:`0 0 20px ${item.glow}, 0 0 40px ${item.glow}55`,
                        whiteSpace:"nowrap",
                      }}>{item.word}</div>
                      {i<2 && <span style={{color:"rgba(255,255,255,.3)",fontSize:20,fontWeight:700}}>—</span>}
                    </div>
                  ))}
                </div>

              </div>
              {/* Right glowing logo */}
              <img src="/logo-clean.png" alt="" style={{
                height:90, width:"auto", objectFit:"contain", flexShrink:0,
                filter:"drop-shadow(0 0 20px rgba(245,158,11,.9)) drop-shadow(0 0 40px rgba(139,92,246,.7))",
                animation:"logoPulse 2.5s ease-in-out infinite, logoFloat 3.6s ease-in-out infinite",
              }}/>
            </div>
          </div>
        )}

        {/* ── MOOD SEARCH + SPORTS HUB — featured cards below banner, desktop only ── */}
        {view==="home"&&!search.trim()&&(
          <div style={{padding:"0 24px 20px",maxWidth:1440,margin:"0 auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

              {/* Mood Search card */}
              <div onClick={()=>setShowMoodSearch(true)}
                style={{
                  background:"linear-gradient(135deg,#0d0520 0%,#1a0540 60%,#0a0320 100%)",
                  border:"1.5px solid rgba(139,92,246,.5)",
                  borderRadius:18, padding:"20px 24px",
                  cursor:"pointer", position:"relative", overflow:"hidden",
                  boxShadow:"0 8px 32px rgba(139,92,246,.2)",
                  transition:"all .25s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(139,92,246,.9)";e.currentTarget.style.boxShadow="0 12px 40px rgba(139,92,246,.4)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(139,92,246,.5)";e.currentTarget.style.boxShadow="0 8px 32px rgba(139,92,246,.2)";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(139,92,246,.15)",filter:"blur(50px)",pointerEvents:"none"}}/>
                <div style={{position:"absolute",bottom:-30,left:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,107,157,.1)",filter:"blur(40px)",pointerEvents:"none"}}/>
                <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:16}}>
                  <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#8B5CF6,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 6px 20px rgba(139,92,246,.5)"}}>🎭</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,background:"linear-gradient(90deg,#c4b5fd,#f0abfc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Mood Search</div>
                      <span style={{background:"var(--gold)",color:"#000",fontSize:9,fontWeight:900,padding:"2px 7px",borderRadius:99,fontFamily:"var(--font-head)"}}>AI</span>
                    </div>
                    <div style={{fontSize:13,color:"rgba(196,181,253,.8)",lineHeight:1.6,marginBottom:14}}>
                      Describe your perfect movie night — AI finds the <em>exact</em> match. No scrolling, no browsing. Just vibes.
                      <div style={{marginTop:8}}>
                        <span style={{background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.3)",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#C4B5FD"}}>🎭 Free for all users</span>
                      </div>
                    </div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(139,92,246,.3)",border:"1px solid rgba(139,92,246,.6)",borderRadius:99,padding:"7px 16px",fontSize:12,fontWeight:700,color:"#c4b5fd"}}>
                      ✦ Try Mood Search →
                    </div>
                  </div>
                </div>
              </div>

              {/* Sports Hub card */}
              <div onClick={()=>{setView("sports");setSearch("");}}
                style={{
                  background:"linear-gradient(135deg,#030f03 0%,#0a2010 60%,#031208 100%)",
                  border:"1.5px solid rgba(16,185,129,.5)",
                  borderRadius:18, padding:"20px 24px",
                  cursor:"pointer", position:"relative", overflow:"hidden",
                  boxShadow:"0 8px 32px rgba(16,185,129,.15)",
                  transition:"all .25s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(16,185,129,.9)";e.currentTarget.style.boxShadow="0 12px 40px rgba(16,185,129,.35)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(16,185,129,.5)";e.currentTarget.style.boxShadow="0 8px 32px rgba(16,185,129,.15)";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(16,185,129,.12)",filter:"blur(50px)",pointerEvents:"none"}}/>
                <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:16}}>
                  <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
                    <div style={{width:52,height:52,borderRadius:14,background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
                      <span style={{animation:"trophyBounce 2s ease-in-out infinite, sportsGlow 2s ease-in-out infinite"}}>🏆</span>
                    </div>
                    <div style={{position:"absolute",top:-3,right:-3,width:12,height:12,borderRadius:"50%",background:"#ef4444",animation:"liveDot 1.2s infinite",boxShadow:"0 0 8px #ef4444",border:"2px solid #030f03"}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,background:"linear-gradient(90deg,#6ee7b7,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Sports Hub</div>
                      <span style={{background:"#ef4444",color:"#fff",fontSize:9,fontWeight:900,padding:"2px 7px",borderRadius:99,fontFamily:"var(--font-head)",animation:"pulse 1.5s infinite"}}>🔴 LIVE</span>
                    </div>
                    <div style={{fontSize:13,color:"rgba(110,231,183,.75)",lineHeight:1.6,marginBottom:14}}>
                      Live scores, full schedules & reminders for every game — NFL, NBA, MLB, NHL, World Cup 2026 and more.
                    </div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.5)",borderRadius:99,padding:"7px 16px",fontSize:12,fontWeight:700,color:"#6ee7b7"}}>
                      🏟️ Open Sports Hub →
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        <div style={{display:"flex",padding:`${(view==="home"&&!search.trim()||view==="trending"&&!search.trim())?"0":"20px"} 24px 20px`,gap:20,maxWidth:1440,margin:"0 auto"}}>
          {/* Main */}
          <main style={{flex:1,minWidth:0}}>
            {/* Homepage hero + rows */}
            {view==="home"&&!search.trim() ? (
              <div>
                <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.06)"}}>

                </div>
                <div style={{paddingTop:24}}>

                  <FeaturedRow title="New on Streaming" icon="🆕" movies={featuredRows.newReleases} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="#10B981" />

                  <FeaturedRow title="Top Rated All Time" icon="⭐" movies={featuredRows.topRated} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--purple)" />
                  <FeaturedRow title="Anime" icon="✦" movies={featuredRows.anime} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--anime)" />
                  <FeaturedRow title="Sports & Docs" icon="🏆" movies={featuredRows.sports} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist} color="var(--sports)" />
                </div>
              </div>
            ) : view==="sports" ? (
              /* ── DEDICATED SPORTS HUB — desktop ── */
              <div>
                {!search.trim() ? (
                  <>
                    <PredictionStatsBar/>
                <TeamNextGameSearch favoriteTeams={favoriteTeams}/>
                <SportCategoryGrid onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                    <SportsStreamingGuide onSearch={handleSportSearch}/>
                  </>
                ) : (
                  <>
                    <button onClick={()=>setSearch("")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:99,color:"var(--muted)",padding:"5px 12px",fontSize:12,cursor:"pointer",marginBottom:16}}>← Back to Sports Hub</button>
                    {search==="soccer_hub" ? <SoccerHub onSearch={handleSportSearch} favoriteTeams={favoriteTeams}/>
                      : search.toLowerCase().includes("olympic") ? <OlympicsPlaceholder/>
                      : <LiveSportsSection sportQuery={search} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavoriteTeam} user={user} showToast={showToast} onPredResult={handlePredResult}/>}
                  </>
                )}
              </div>
            ) : view==="stats" ? (
              <div style={{padding:"0 0 40px"}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:20,marginBottom:2}}>📊 My Stats</div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Your streaming activity at a glance</div>
                <AdvancedStats user={user} watchlist={watchlist} userRatings={userRatings} watchHistory={watchHistory} onOpenHistory={()=>setShowWatchHistory(true)} onOpenWatchlist={()=>handleSetView("watchlist")}/>
              </div>
            ) : (
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:18}}>
                    {search.trim()
                      ? searching?"Searching…":`${searchResults.length} results for "${search}"`
                      : CATEGORY_TABS.find(t=>t.id===view)?.icon+" "+CATEGORY_TABS.find(t=>t.id===view)?.label
                    }
                    {!search&&!loading&&<span style={{fontWeight:400,fontSize:14,color:"var(--muted)",marginLeft:10}}>{filtered.length} titles</span>}
                  </div>
                  {!user&&<button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"8px 18px",fontWeight:700,fontSize:13}}>👤 Sign in to save watchlist</button>}
                </div>
                {loading&&!search
                  ? <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i}/>)}</div>
                  : filtered.length===0
                    ? <div style={{textAlign:"center",color:"var(--muted)",padding:"80px 0",fontSize:15}}>{view==="watchlist"?"Your watchlist is empty. Click ♡ to save titles!":"No results found."}</div>
                    : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>
                        {filtered.map(m=><MovieCard key={m.id} movie={m} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={handleSelectMovie} onToggleWatchlist={toggleWatchlist}/>)}
                      </div>
                }
              </>
            )}
          </main>

          {/* Right Sidebar */}
          <aside style={{width:220,flexShrink:0}}>
            {!user&&(
              <div style={{background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.25)",borderRadius:"var(--radius)",padding:16,marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:8}}>👤</div>
                <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:14,marginBottom:6}}>Create an Account</div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>Save your watchlist, write reviews and sync across devices.</div>
                <button onClick={()=>{setShowAuth(true);track("sign_in_click");}} style={{width:"100%",background:"var(--purple)",border:"none",borderRadius:10,color:"#fff",padding:"9px 0",fontWeight:700,fontSize:13,cursor:"pointer"}}>Sign Up Free</button>
              </div>
            )}

            {/* Premium Tools */}
            <div style={{marginTop:16}}>
              {/* Sports Hub Button */}
              {/* Mood Search & Sports Hub are featured below the banner — not duplicated here */}
              {view==="home"&&<>
              <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:1.2,marginBottom:10,fontFamily:"var(--font-head)"}}>✦ PREMIUM TOOLS</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"💰",label:"Cost Report",  sub:"AI analyzes which services to keep or cut",onClick:()=>setShowCostCalc(true),color:"#10B981",grad:"rgba(16,185,129,.07)"},
                  {icon:"🌙",label:"Watch Tonight",sub:"AI picks one perfect thing right now",onClick:()=>setShowWatchTonight(true),color:"#8B5CF6",grad:"rgba(139,92,246,.1)"},
                  {icon:"✦",label:"For You",      sub:"Personalized picks from your ratings & watchlist",onClick:()=>setShowPersonalizedRecs(true),color:"#F59E0B",grad:"rgba(245,158,11,.08)"},
                  {icon:"🚨",label:"Leaving Soon", sub:"Titles leaving your services this month",onClick:()=>setShowLeavingSoon(true),color:"#EF4444",grad:"rgba(239,68,68,.07)"},
                ].map(item=>(
                  <button key={item.label} onClick={item.onClick}
                    style={{background:item.grad,border:`1.5px solid ${item.color}44`,borderRadius:12,padding:"11px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"all .2s",textAlign:"left",width:"100%"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${item.color}99`;e.currentTarget.style.background=`${item.color}14`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=`${item.color}44`;e.currentTarget.style.background=item.grad;}}>
                    <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:800,color:"var(--text)",display:"flex",alignItems:"center",gap:5,marginBottom:2}}>{item.label}{tier!=="premium"&&<span style={{background:"var(--gold)",color:"#000",fontSize:7,fontWeight:800,padding:"1px 4px",borderRadius:99}}>PRO</span>}</div>
                      <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.4}}>{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              </>}
            </div>

          </aside>
        </div>

        {/* Footer */}
        <div style={{position:"relative",overflow:"hidden",borderTop:"2px solid rgba(245,158,11,.2)"}}>
        {/* Advanced Stats Section */}

          {/* Footer hero tagline */}
          <div style={{
            padding:"48px 40px 32px",
            background:"linear-gradient(180deg,rgba(10,8,24,0.98) 0%,rgba(12,8,28,1) 100%)",
            textAlign:"center",position:"relative",
          }}>
            <div style={{
              fontFamily:"var(--font-head)", fontWeight:800,
              fontSize:"clamp(24px,3vw,42px)",
              letterSpacing:"-.01em", marginBottom:10,
              background:"linear-gradient(90deg,#F59E0B,#ffffff,#8B5CF6,#C4B5FD,#F59E0B)",
              backgroundSize:"300% auto",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              animation:"gradientShift 4s linear infinite",
            }}>Your AI Streaming Assistant</div>
            <div style={{
              fontSize:12, letterSpacing:4, marginBottom:36,
              color:"rgba(240,240,250,.55)", display:"inline-block",
              background:"rgba(255,255,255,.05)",
              padding:"6px 20px", borderRadius:99,
              border:"1px solid rgba(255,255,255,.1)",
            }}>THE STREAMHUB</div>

            {/* Word pills */}
            <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap",marginBottom:36}}>
              {[
                {word:"SEARCH", color:"#000",    bg:"#F59E0B",  shadow:"rgba(245,158,11,.6)"},
                {word:"·",      color:"rgba(240,240,250,.4)", bg:"transparent", shadow:"none"},
                {word:"FIND",   color:"#fff",    bg:"#8B5CF6",  shadow:"rgba(139,92,246,.5)"},
                {word:"·",      color:"rgba(240,240,250,.4)", bg:"transparent", shadow:"none"},
                {word:"ENJOY",  color:"#000",    bg:"#FFFFFF",  shadow:"rgba(255,255,255,.4)"},
              ].map((p,i)=>(
                <span key={i} style={{
                  fontFamily:"var(--font-head)", fontWeight:800,
                  fontSize: p.word==="·" ? 28 : 20,
                  color:p.color, letterSpacing: p.word==="·" ? 0 : 4,
                  background:p.bg, borderRadius:99,
                  padding: p.word==="·" ? "0 8px" : "10px 32px",
                  display:"inline-flex", alignItems:"center",
                  boxShadow: p.shadow!=="none" ? `0 0 28px ${p.shadow}, 0 4px 12px rgba(0,0,0,.4)` : "none",
                  animation: p.word!=="·" ? `badgePop 3s ease-in-out infinite` : "none",
                  animationDelay:`${i*0.4}s`,
                }}>{p.word}</span>
              ))}
            </div>

            {/* Bottom bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,paddingTop:24,borderTop:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <img src="/logo-clean.png" alt="The StreamHub" onClick={()=>{setView("home");setSearch("");window.scrollTo(0,0);}} style={{height:52,objectFit:"contain",filter:"drop-shadow(0 0 10px rgba(245,158,11,.5))",cursor:"pointer"}} />
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>
                    <span style={{color:"#F59E0B"}}>The Stream</span>
                    <span style={{color:"#8B5CF6"}}>Hub</span>
                  </div>
                  <div style={{fontSize:10,color:"var(--gold)",letterSpacing:1,fontFamily:"var(--font-head)",fontWeight:700}}>YOUR AI STREAMING ASSISTANT</div>
                </div>
              </div>
              <div style={{fontSize:11,color:"var(--muted)"}}>© 2025 StreamHub · Not affiliated with any streaming service.</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {["Netflix","Disney+","Max","Hulu","Crunchyroll","ESPN+","DAZN"].map(n=>(
                  <span key={n} style={{fontSize:10,color:"rgba(240,240,250,.2)",letterSpacing:.5}}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Left side tagline banner removed */}
        {/* Right side tagline banner removed */}
      </div>

      {selectedMovie&&<MovieModal movie={selectedMovie} watchlist={watchlist} userRatings={userRatings} myVotes={{}} user={user} onClose={()=>setSelectedMovie(null)} onRate={handleRate} onToggleWatchlist={toggleWatchlist} onVote={()=>{}} showToast={showToast} onSelectSimilar={(m)=>setSelectedMovie({...m,providers:[],category:'movie'})}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showProfile&&user&&<ProfileModal user={user} profile={profile} tier={tier} watchlist={watchlist} userRatings={userRatings} onClose={()=>setShowProfile(false)} onSignOut={signOut} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} userSubs={userSubs} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onSelectMovie={(m)=>{setSelectedMovie(m);setShowProfile(false);}} notifPermission={notifPermission} onRequestNotif={requestNotifications} streak={streak}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")}/>}
      {showOnboarding&&<OnboardingModal onFinish={()=>{setShowOnboarding(false);setShowSetup(true);}}/>}
      {showSetup&&<SetupModal userSubs={userSubs} onSave={handleSaveUserSubs} onClose={()=>setShowSetup(false)} isFirst={!localStorage.getItem("streamhub_setup_done")}/>}
      {showLeavingSoon&&<LeavingSoonModal onClose={()=>setShowLeavingSoon(false)} userSubs={userSubs} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} profile={profile}/>}
      {showNewReleases&&<NewReleasesModal onClose={()=>setShowNewReleases(false)} user={user} tier={tier} userSubs={userSubs} onSelect={handleSelectMovie} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showCostCalc&&<CostCalculatorModal onClose={()=>setShowCostCalc(false)} userSubs={userSubs} watchHistory={watchHistory} watchlist={watchlist} userRatings={userRatings} tier={tier} onUpgrade={()=>setShowUpgrade(true)}/>}
      {showWatchTonight&&<WatchTonightModal onClose={()=>setShowWatchTonight(false)} user={user} tier={tier} userSubs={userSubs} watchlist={watchlist} userRatings={userRatings} onUpgrade={()=>setShowUpgrade(true)} onSelect={handleSelectMovie}/>}
      {showMoodSearch&&<MoodSearchModal onClose={()=>setShowMoodSearch(false)} tier={tier} onUpgrade={()=>setShowUpgrade(true)} onResults={(q)=>setSearch(q)}/>}
      {showPersonalizedRecs&&<PersonalizedRecsModal onClose={()=>setShowPersonalizedRecs(false)} user={user} tier={tier} onUpgrade={()=>setShowUpgrade(true)} watchlist={watchlist} userRatings={userRatings} onResults={(q)=>setSearch(q)}/>}
      {showSignupPrompt&&!user&&<SignupPrompt onSignup={()=>{setShowSignupPrompt(false);setShowAuth(true);}} onDismiss={()=>{setShowSignupPrompt(false);localStorage.setItem("streamhub_signup_dismissed","true");}} searchesUsed={searchesUsed}/>}
      {showSearchLimit&&!user&&<SearchLimitWall onSignup={()=>{setShowSearchLimit(false);setShowAuth(true);}} onDismiss={()=>setShowSearchLimit(false)}/>}
      {showInstallPrompt&&<InstallPrompt onDismiss={()=>{setShowInstallPrompt(false);localStorage.setItem("streamhub_install_dismissed","true");}}/>}
      {shareContent&&<ShareModal title={shareContent.title} text={shareContent.text} url={shareContent.url} onClose={()=>setShareContent(null)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {predCelebration&&<PredictionCelebrationModal streak={predCelebration.streak} points={predCelebration.points} milestone={predCelebration.milestone} onClose={()=>setPredCelebration(null)}/>}
      <CookieConsent/>
      <Analytics />
    </>
  );
}
       