// api/weekly-digest.js
// Sends weekly StreamHub recap emails every Sunday at 10 AM UTC
// Cron: 0 10 * * 0

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Uses Resend for email (free up to 3000/mo) — add RESEND_API_KEY to Vercel env vars
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "StreamHub <hello@thestreamhub.app>";

async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  return res.ok;
}

function buildEmailHtml({ username, predStreak, predTotal, predCorrect, predPoints, favoriteTeams, tier }) {
  const accuracy = predTotal > 0 ? Math.round(predCorrect / predTotal * 100) : 0;
  const teamList = Object.values(favoriteTeams || {}).flat().filter(Boolean).slice(0, 5);
  const isPremium = tier === "premium";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your StreamHub Weekly Recap</title>
</head>
<body style="margin:0;padding:0;background:#09070F;font-family:system-ui,sans-serif;color:#F0F0FA;">
  <div style="max-width:520px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="text-align:center;padding:32px 20px 24px;background:linear-gradient(135deg,rgba(139,92,246,.2),rgba(245,158,11,.1));border-radius:20px;margin-bottom:20px;border:1px solid rgba(139,92,246,.2);">
      <div style="font-size:32px;margin-bottom:8px;">⚡</div>
      <div style="font-size:22px;font-weight:900;color:#F59E0B;margin-bottom:4px;">The StreamHub</div>
      <div style="font-size:14px;color:rgba(240,240,250,.5);">Your weekly recap${username ? `, ${username}` : ""}</div>
    </div>

    ${predTotal > 0 ? `
    <!-- Prediction Stats -->
    <div style="background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);border-radius:16px;padding:20px;margin-bottom:16px;">
      <div style="font-size:16px;font-weight:800;margin-bottom:16px;">🔮 Your Prediction Record</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
        <div>
          <div style="font-size:22px;font-weight:900;color:#C4B5FD;">${predPoints}</div>
          <div style="font-size:10px;color:rgba(240,240,250,.4);margin-top:2px;">POINTS</div>
        </div>
        <div>
          <div style="font-size:22px;font-weight:900;color:#F59E0B;">${predStreak}🔥</div>
          <div style="font-size:10px;color:rgba(240,240,250,.4);margin-top:2px;">STREAK</div>
        </div>
        <div>
          <div style="font-size:22px;font-weight:900;color:#10B981;">${predCorrect}/${predTotal}</div>
          <div style="font-size:10px;color:rgba(240,240,250,.4);margin-top:2px;">CORRECT</div>
        </div>
        <div>
          <div style="font-size:22px;font-weight:900;color:#06B6D4;">${accuracy}%</div>
          <div style="font-size:10px;color:rgba(240,240,250,.4);margin-top:2px;">ACCURACY</div>
        </div>
      </div>
    </div>
    ` : ""}

    ${teamList.length > 0 ? `
    <!-- Favorite Teams -->
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;margin-bottom:16px;">
      <div style="font-size:16px;font-weight:800;margin-bottom:12px;">⭐ Your Teams This Week</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${teamList.map(t => `<span style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700;color:#F59E0B;">${t}</span>`).join("")}
      </div>
      <div style="font-size:12px;color:rgba(240,240,250,.4);margin-top:10px;">Get notified when they play → enable alerts in the app</div>
    </div>
    ` : ""}

    ${!isPremium ? `
    <!-- Upgrade CTA -->
    <div style="background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(139,92,246,.08));border:1px solid rgba(245,158,11,.3);border-radius:16px;padding:20px;margin-bottom:16px;text-align:center;">
      <div style="font-size:20px;font-weight:900;margin-bottom:6px;">✦ Upgrade to Premium</div>
      <div style="font-size:13px;color:rgba(240,240,250,.55);margin-bottom:16px;">Unlock Watch Tonight, New Releases, Leaving Soon alerts and more</div>
      <a href="https://thestreamhub.app" style="display:inline-block;background:#F59E0B;color:#000;font-weight:900;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">Get Premium — $7.99/mo →</a>
    </div>
    ` : ""}

    <!-- CTA -->
    <div style="text-align:center;padding:20px;">
      <a href="https://thestreamhub.app" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#6366f1);color:#fff;font-weight:800;font-size:15px;padding:13px 32px;border-radius:12px;text-decoration:none;">Open The StreamHub →</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:11px;color:rgba(240,240,250,.25);padding:16px 0;border-top:1px solid rgba(255,255,255,.06);">
      © 2026 The StreamHub · <a href="https://thestreamhub.app" style="color:rgba(240,240,250,.35);text-decoration:none;">thestreamhub.app</a>
      <br>You're receiving this because you have a StreamHub account.
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  // Security check
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!RESEND_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY not configured" });
  }

  try {
    // Fetch all users with emails
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, email, tier, pred_streak, pred_total, pred_correct, pred_points, favorite_teams")
      .not("email", "is", null)
      .limit(500);

    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const p of profiles || []) {
      if (!p.email) continue;

      const html = buildEmailHtml({
        username: p.username,
        predStreak: p.pred_streak || 0,
        predTotal: p.pred_total || 0,
        predCorrect: p.pred_correct || 0,
        predPoints: p.pred_points || 0,
        favoriteTeams: p.favorite_teams || {},
        tier: p.tier || "free",
      });

      const ok = await sendEmail(
        p.email,
        `⚡ Your StreamHub Weekly Recap${p.pred_streak > 2 ? ` — ${p.pred_streak}🔥 streak!` : ""}`,
        html
      );

      if (ok) sent++; else failed++;

      // Rate limit: ~2 emails/second
      await new Promise(r => setTimeout(r, 500));
    }

    return res.status(200).json({ sent, failed, total: profiles?.length || 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}