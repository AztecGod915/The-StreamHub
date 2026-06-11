import https from 'https';

const ESPN_LEAGUES = {
  nfl: 'football/nfl', nba: 'basketball/nba',
  mlb: 'baseball/mlb', nhl: 'hockey/nhl',
  ufc: 'mma/ufc', soccer: 'soccer/eng.1',
};

async function espnFetch(leaguePath) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'site.api.espn.com',
      path: `/apis/site/v2/sports/${leaguePath}/scoreboard`,
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    });
    req.on('error', () => resolve({}));
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get all profiles with favorite teams
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, favorite_teams')
      .not('favorite_teams', 'is', null);

    // Get all push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription');

    const subMap = {};
    for (const s of (subs || [])) subMap[s.user_id] = s.subscription;

    // Fetch upcoming games for each league
    const upcomingByTeam = {};
    for (const [, leaguePath] of Object.entries(ESPN_LEAGUES)) {
      const data = await espnFetch(leaguePath);
      for (const evt of (data.events || [])) {
        const comp = evt.competitions?.[0];
        const home = comp?.competitors?.find(c => c.homeAway === 'home');
        const away = comp?.competitors?.find(c => c.homeAway === 'away');
        const gameTime = new Date(evt.date);
        const now = new Date();
        const minsUntil = (gameTime - now) / 60000;

        // Alert if game is 30-90 minutes away
        if (minsUntil >= 20 && minsUntil <= 90) {
          for (const team of [home?.team?.displayName, away?.team?.displayName]) {
            if (team) {
              upcomingByTeam[team] = {
                name: evt.name || evt.shortName,
                time: gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                broadcast: comp?.broadcasts?.[0]?.names?.[0] || 'Check your streaming apps',
              };
            }
          }
        }
      }
    }

    let notified = 0;
    for (const profile of (profiles || [])) {
      const favTeams = profile.favorite_teams || {};
      const sub = subMap[profile.id];
      if (!sub) continue;

      for (const [, teamName] of Object.entries(favTeams)) {
        if (upcomingByTeam[teamName]) {
          const game = upcomingByTeam[teamName];
          // In production: send push via web-push package
          // await webpush.sendNotification(JSON.parse(sub), JSON.stringify({
          //   title: `🏆 ${teamName} plays soon!`,
          //   body: `${game.name} starts at ${game.time} · Watch on ${game.broadcast}`,
          //   url: '/?view=sports',
          //   tag: `game-${teamName}`,
          // }));
          notified++;
        }
      }
    }

    return res.status(200).json({ notified, teamsWithGames: Object.keys(upcomingByTeam).length });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
