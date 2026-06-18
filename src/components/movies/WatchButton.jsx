import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getPlatformLink } from "../../lib/utils.js";
import { SERVICES } from "../../data/constants.js";
const APP_SCHEMES = {
  netflix:     { ios:"nflx://",                          android:"intent://www.netflix.com#Intent;scheme=https;package=com.netflix.mediaclient;end" },
  disney:      { ios:"disneyplus://",                    android:"intent://www.disneyplus.com#Intent;scheme=https;package=com.disney.disneyplus;end" },
  max:         { ios:"max://",                           android:"intent://play.max.com#Intent;scheme=https;package=com.hbo.hbonow;end" },
  hulu:        { ios:"hulu://",                          android:"intent://www.hulu.com#Intent;scheme=https;package=com.hulu.plus;end" },
  apple:       { ios:"videos://",                        android:null },
  prime:       { ios:"aiv://",                           android:"intent://www.amazon.com#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end" },
  peacock:     { ios:"peacock://",                       android:"intent://www.peacocktv.com#Intent;scheme=https;package=com.peacocktv.peacockandroid;end" },
  paramount:   { ios:"paramountplus://",                 android:"intent://www.paramountplus.com#Intent;scheme=https;package=com.cbs.app;end" },
  crunchyroll: { ios:"crunchyroll://",                   android:"intent://www.crunchyroll.com#Intent;scheme=https;package=com.crunchyroll.crunchyroid;end" },
  espnplus:    { ios:"sportscenter://",                  android:"intent://www.espn.com#Intent;scheme=https;package=com.espn.score_center;end" },
  dazn:        { ios:"dazn://",                          android:"intent://www.dazn.com#Intent;scheme=https;package=com.dazn;end" },
  fubo:        { ios:"fubo://",                          android:"intent://www.fubo.tv#Intent;scheme=https;package=tv.fubo.mobile;end" },
  tubi:        { ios:"tubi://",                          android:"intent://tubitv.com#Intent;scheme=https;package=com.tubitv;end" },
};

function getWatchUrl(serviceId, title, webUrl) {
  // webUrl should be a TMDB watch page or platform homepage — never a search URL
  const scheme = APP_SCHEMES[serviceId];
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isIOS && scheme?.ios) return scheme.ios;
  if (isAndroid && scheme?.android) return scheme.android;
  return webUrl || "https://www.themoviedb.org";
}

function WatchButton({ serviceId, title, webUrl, movieId, style }) {
  const svc = SERVICES.find(s => s.id === serviceId);
  if (!svc) return null;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Reliable watch URL: TMDB JustWatch page > passed webUrl > platform homepage
  const reliableUrl = webUrl && webUrl.includes("themoviedb.org")
    ? webUrl
    : movieId
      ? `https://www.themoviedb.org/movie/${movieId}/watch?locale=US`
      : svc.homeUrl || `https://www.${svc.name.toLowerCase().replace(/[^a-z]/g,"")}.com/`;

  const handleWatch = (e) => {
    e.stopPropagation();
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const scheme = APP_SCHEMES[serviceId];

    // On mobile: try native app first, fall back to TMDB watch page
    if (isIOS && scheme?.ios) {
      window.location.href = scheme.ios;
      setTimeout(() => window.open(reliableUrl, "_blank"), 1500);
      return;
    }
    if (isAndroid && scheme?.android) {
      window.location.href = scheme.android;
      setTimeout(() => window.open(reliableUrl, "_blank"), 1500);
      return;
    }
    // Desktop or no app scheme — open TMDB watch page
    window.open(reliableUrl, "_blank");
  };

  return (
    <button onClick={handleWatch}
      style={{
        display:"inline-flex", alignItems:"center", gap:8,
        background:svc.color, borderRadius:10, color:"#fff",
        padding:"9px 18px", fontFamily:"var(--font-head)",
        fontWeight:800, fontSize:13, border:"none", cursor:"pointer",
        boxShadow:`0 4px 16px ${svc.color}44`,
        ...style
      }}>
      ▶ Watch on {svc.name}
      {isMobile && <span style={{fontSize:10,opacity:.8}}>📱</span>}
    </button>
  );
}

// ─── WELCOME BANNER ───────────────────────────────────────────────────────────

export { APP_SCHEMES, getWatchUrl, WatchButton };
