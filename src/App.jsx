// ============================================================
// FEATURE 1: Add to Calendar / Reminder — paste this helper
// function ABOVE your GameCard component
// ============================================================

function addGameReminder(evt) {
  const gameTitle = evt.shortName || evt.name || "Game";
  const gameDate  = evt.date ? new Date(evt.date) : null;
  if (!gameDate || isNaN(gameDate)) return;

  // Build .ics file content
  const pad = n => String(n).padStart(2, "0");
  const fmt = d =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const end = new Date(gameDate.getTime() + 3 * 60 * 60 * 1000); // +3hrs
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StreamHub//Game Reminder//EN",
    "BEGIN:VEVENT",
    `UID:${evt.id || Date.now()}@thestreamhub.app`,
    `SUMMARY:${gameTitle}`,
    `DTSTART:${fmt(gameDate)}`,
    `DTEND:${fmt(end)}`,
    `DESCRIPTION:Watch on The StreamHub — thestreamhub.app`,
    `URL:${evt.broadcastLink || "https://thestreamhub.app"}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${gameTitle} starts in 30 minutes!`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${gameTitle.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ============================================================
// FEATURE 1 (continued): Update your GameCard component
//
// Find your existing GameCard function and:
//  1. Add the `reminderAdded` state
//  2. Replace the date chip JSX with the new version below
// ============================================================

function GameCard({ evt, isLive, isOver, favTeam, onSelect }) {
  const [reminderAdded, setReminderAdded] = React.useState(false);
  const hasTeams = evt.home?.name && evt.away?.name;
  const isFavGame = favTeam && (evt.home?.name === favTeam || evt.away?.name === favTeam);
  const isUpcoming = !isLive && !isOver;

  const handleReminderClick = (e) => {
    e.stopPropagation(); // Don't open GameDetailModal
    addGameReminder(evt);
    setReminderAdded(true);
    setTimeout(() => setReminderAdded(false), 3000);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(evt)}
      style={{
        flexShrink: 0,
        width: 210,
        background: "rgba(255,255,255,.04)",
        border: `1px solid ${isLive ? "rgba(239,68,68,.5)" : isFavGame ? "rgba(16,185,129,.4)" : "rgba(255,255,255,.08)"}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: isLive ? "0 0 20px rgba(239,68,68,.2)" : isFavGame ? "0 0 12px rgba(16,185,129,.15)" : "none",
        cursor: "pointer",
        transition: "transform .15s, box-shadow .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {/* Top bar */}
      <div style={{
        padding: "6px 10px",
        background: isLive ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.03)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: isLive ? "#ef4444" : "var(--muted)" }}>
          {isLive
            ? `🔴 LIVE · ${evt.periodText}`
            : isOver
            ? `✓ FINAL`
            : evt.localTime || evt.localDate || "Upcoming"}
        </div>

        {/* 🔔 REMINDER BELL — only on upcoming games */}
        {isUpcoming && (
          <button
            onClick={handleReminderClick}
            title="Add to Calendar"
            style={{
              background: reminderAdded ? "rgba(16,185,129,.25)" : "rgba(255,255,255,.07)",
              border: `1px solid ${reminderAdded ? "rgba(16,185,129,.5)" : "rgba(255,255,255,.12)"}`,
              borderRadius: 6,
              color: reminderAdded ? "#10b981" : "var(--muted)",
              width: 24, height: 24,
              fontSize: 12,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s",
              flexShrink: 0,
            }}
          >
            {reminderAdded ? "✓" : "🔔"}
          </button>
        )}
      </div>

      {/* Teams / matchup */}
      {hasTeams ? (
        <div style={{ padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            {evt.away?.logo
              ? <img src={evt.away.logo} style={{ width: 30, height: 30, objectFit: "contain" }} alt="" />
              : <div style={{ fontSize: 18 }}>🏟️</div>}
            <div style={{ fontSize: 10, color: "var(--text)", marginTop: 3, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.away?.name}</div>
            {(isLive || isOver) && <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{evt.away?.score ?? "–"}</div>}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>VS</div>
          <div style={{ flex: 1, textAlign: "center" }}>
            {evt.home?.logo
              ? <img src={evt.home.logo} style={{ width: 30, height: 30, objectFit: "contain" }} alt="" />
              : <div style={{ fontSize: 18 }}>🏟️</div>}
            <div style={{ fontSize: 10, color: "var(--text)", marginTop: 3, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.home?.name}</div>
            {(isLive || isOver) && <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{evt.home?.score ?? "–"}</div>}
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 10px", fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>
          {evt.shortName || evt.name}
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{ padding: "6px 10px 10px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ fontSize: 10, color: isLive ? "#ef4444" : isOver ? "var(--muted)" : "rgba(16,185,129,.7)", fontWeight: 700, flex: 1 }}>
          {isLive ? "▶ Watch Live →" : isOver ? "" : "📺 Find where to watch →"}
        </div>
        {/* Show date on upcoming so reminder context is clear */}
        {isUpcoming && evt.localDate && (
          <div style={{ fontSize: 9, color: "var(--muted)", whiteSpace: "nowrap" }}>{evt.localDate}</div>
        )}
      </div>

      {evt.isTitleFight && (
        <div style={{ padding: "0 10px 8px", fontSize: 9, fontWeight: 800, color: "var(--gold)", letterSpacing: .5 }}>🏆 TITLE FIGHT</div>
      )}
    </div>
  );
}


// ============================================================
// FEATURE 2: Standalone Sports Hub Promo Icon
//
// Paste this component wherever you want it (above Premium
// features section, in a sidebar, or in the main content area).
//
// Pass setView (your tab-switching state setter) as a prop.
// ============================================================

function SportsHubPromo({ onNavigate }) {
  return (
    <div
      onClick={() => onNavigate("sports")}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
        background: "linear-gradient(135deg, rgba(239,68,68,.12) 0%, rgba(251,146,60,.08) 50%, rgba(16,185,129,.12) 100%)",
        border: "1px solid rgba(255,255,255,.1)",
        padding: "14px 16px",
        transition: "transform .2s, box-shadow .2s",
        boxShadow: "0 0 0 0 rgba(16,185,129,0)",
        animation: "sportsPromoGlow 3s ease-in-out infinite",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(16,185,129,.25)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 0 0 0 rgba(16,185,129,0)";
      }}
    >
      {/* Live pulse dot */}
      <div style={{
        position: "absolute", top: 10, right: 10,
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "liveDot 1.2s infinite", boxShadow: "0 0 6px #ef4444" }} />
        <span style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", letterSpacing: 1 }}>LIVE</span>
      </div>

      {/* Sport icons row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, fontSize: 22 }}>
        <span style={{ animation: "sportsBounce 2s ease-in-out infinite" }}>🏀</span>
        <span style={{ animation: "sportsBounce 2s ease-in-out .3s infinite" }}>⚽</span>
        <span style={{ animation: "sportsBounce 2s ease-in-out .6s infinite" }}>🏈</span>
        <span style={{ animation: "sportsBounce 2s ease-in-out .9s infinite" }}>⚾</span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", letterSpacing: .3, marginBottom: 2 }}>
        Sports Hub
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
        Live scores, schedules &amp; game reminders
      </div>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "linear-gradient(90deg, var(--sports,#10b981), #059669)",
        borderRadius: 8, padding: "5px 12px",
        fontSize: 11, fontWeight: 700, color: "#fff",
        boxShadow: "0 2px 10px rgba(16,185,129,.3)",
      }}>
        ▶ Watch Live Scores
        <span style={{ fontSize: 10 }}>→</span>
      </div>
    </div>
  );
}

// Add these keyframes to your existing <style> tag or CSS file:
/*
@keyframes sportsPromoGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
  50%       { box-shadow: 0 0 18px rgba(16,185,129,.18); }
}

@keyframes sportsBounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}
*/
