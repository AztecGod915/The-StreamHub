// ─── PLATFORM DEEP LINK BUILDER ──────────────────────────────────────────────
// TMDB's watch page (powered by JustWatch) is the most reliable link.
// It shows the movie on each platform and hands off correctly.
// We use it as primary and fall back to platform homepages — never search URLs
// which most platforms block from external referrers.
function getPlatformLink(providerName, movieId, movieTitle, tmdbLink) {
  // Primary: TMDB/JustWatch link for this specific movie
  if (tmdbLink) return tmdbLink;
  // Secondary: direct TMDB watch page if no link stored yet
  if (movieId) return `https://www.themoviedb.org/movie/${movieId}/watch?locale=US`;
  // Last resort: platform homepage (user can search from there)
  const homes = {
    "Netflix":              "https://www.netflix.com",
    "Hulu":                 "https://www.hulu.com",
    "Disney Plus":          "https://www.disneyplus.com",
    "Disney+":              "https://www.disneyplus.com",
    "Max":                  "https://www.max.com",
    "HBO Max":              "https://www.max.com",
    "Apple TV Plus":        "https://tv.apple.com",
    "Apple TV+":            "https://tv.apple.com",
    "Amazon Prime Video":   "https://www.amazon.com/video",
    "Prime Video":          "https://www.amazon.com/video",
    "Peacock":              "https://www.peacocktv.com",
    "Peacock Premium":      "https://www.peacocktv.com",
    "Paramount Plus":       "https://www.paramountplus.com",
    "Paramount+":           "https://www.paramountplus.com",
    "Tubi":                 "https://tubitv.com",
    "Crunchyroll":          "https://www.crunchyroll.com",
    "ESPN Plus":            "https://www.espnplus.com",
    "YouTube":              "https://www.youtube.com",
    "Fubo":                 "https://www.fubo.tv",
  };
  return homes[providerName] || "https://www.themoviedb.org";
}

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";

// ─── VAPID KEY HELPER ─────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ─── GOOGLE ANALYTICS EVENT TRACKER ──────────────────────────────────────────
const track = (eventName, params = {}) => {
  try {
    if (window.gtag) window.gtag("event", eventName, params);
  } catch(e) {}
};

export { getPlatformLink, urlBase64ToUint8Array, track };
