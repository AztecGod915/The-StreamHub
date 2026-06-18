// api/notify-teams.js
// Vercel serverless function — sends push notifications for upcoming favorite team games
// Called by a Vercel cron job every morning at 8 AM (configured in vercel.json)

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role key — server-side only
);

webpush.setVapidDetails(
  "mailto:support@thestreamhub.app",
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Fetch today's games from ESPN for a sport path
async function getTodaysGames(sportPath) {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard`,
      { headers: { "User-Agent": "StreamHub/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events || []).map(evt => {
      const comp = evt.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      const gameTime = new Date(evt.date);
      const minutesUntil = Math.floor((gameTime - Date.now()) / 60000);
      return {
        id: evt.id,
        name: evt.name || evt.shortName || "",
        homeTeam: home?.team?.shortDisplayName || home?.team?.displayName || "",
        awayTeam: away?.team?.shortDisplayName || away?.team?.displayName || "",
        time: gameTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }),
        minutesUntil,
        broadcast: comp?.broadcasts?.[0]?.names?.join(", ") || "",
      };
    }).filter(g => g.minutesUntil > 0 && g.minutesUntil < 180); // games in next 3 hours
  } catch (e) {
    return [];
  }
}

// Sport paths to check
const SPORT_PATHS = [
  "soccer/fifa.world",
  "football/nfl",
  "basketball/nba",
  "baseball/mlb",
  "hockey/nhl",
  "soccer/eng.1",
  "soccer/esp.1",
  "soccer/ger.1",
  "soccer/ita.1",
  "soccer/fra.1",
  "soccer/uefa.champions",
  "soccer/usa.1",
  "mma/ufc",
  "racing/f1",
];

export default async function handler(req, res) {
  // Security: only allow cron calls or authorized requests
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Fetch all upcoming games across sports
    const allGames = [];
    for (const path of SPORT_PATHS) {
      const games = await getTodaysGames(path);
      allGames.push(...games);
    }

    if (allGames.length === 0) {
      return res.status(200).json({ sent: 0, message: "No upcoming games" });
    }

    // 2. Get all push subscriptions with favorite teams
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("user_id, subscription, favorite_teams")
      .not("subscription", "is", null)
      .not("favorite_teams", "is", null);

    if (error || !subs?.length) {
      return res.status(200).json({ sent: 0, message: "No subscriptions" });
    }

    // 3. For each subscriber, check if any favorite team is playing
    let sent = 0;
    for (const sub of subs) {
      const favTeams = sub.favorite_teams || {};
      const allFavTeamNames = Object.values(favTeams).flat().filter(Boolean);
      if (!allFavTeamNames.length) continue;

      // Find games featuring their favorite teams
      const myGames = allGames.filter(g =>
        allFavTeamNames.some(team =>
          g.homeTeam.toLowerCase().includes(team.toLowerCase()) ||
          g.awayTeam.toLowerCase().includes(team.toLowerCase()) ||
          team.toLowerCase().includes(g.homeTeam.toLowerCase()) ||
          team.toLowerCase().includes(g.awayTeam.toLowerCase())
        )
      );

      if (!myGames.length) continue;

      // Send one notification per subscriber (group multiple games)
      const firstGame = myGames[0];
      const title = myGames.length === 1
        ? `⚽ ${firstGame.homeTeam} vs ${firstGame.awayTeam}`
        : `🏆 ${myGames.length} of your teams play today!`;
      const body = myGames.length === 1
        ? `Kicks off at ${firstGame.time}${firstGame.broadcast ? ` · ${firstGame.broadcast}` : ""} → thestreamhub.app`
        : myGames.map(g => `${g.homeTeam} vs ${g.awayTeam} at ${g.time}`).join(" · ");

      try {
        const pushSub = JSON.parse(sub.subscription);
        await webpush.sendNotification(pushSub, JSON.stringify({
          title,
          body,
          url: "https://thestreamhub.app",
          tag: "team-game-alert",
          icon: "/icons/icon-192x192.png",
        }));
        sent++;
      } catch (pushError) {
        // Subscription expired — remove it
        if (pushError.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("user_id", sub.user_id);
        }
      }
    }

    return res.status(200).json({ sent, total: subs.length, games: allGames.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}