import { useState, useEffect, useCallback, useRef } from "react";

// ─── FONTS & GLOBAL STYLES ───────────────────────────────────────────────────
const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: #07070E;
        --surface: #0D0D1A;
        --card: #111122;
        --border: rgba(255,255,255,0.07);
        --gold: #F5C518;
        --gold-dim: rgba(245,197,24,0.15);
        --purple: #7C3AED;
        --purple-dim: rgba(124,58,237,0.15);
        --cyan: #06B6D4;
        --anime: #FF6B9D;
        --sports: #10B981;
        --text: #F0F0FA;
        --muted: rgba(240,240,250,0.45);
        --danger: #EF4444;
        --success: #10B981;
        --radius: 14px;
        --font-head: 'Syne', sans-serif;
        --font-body: 'Plus Jakarta Sans', sans-serif;
      }
      body { background: var(--bg); color: var(--text); font-family: var(--font-body); -webkit-font-smoothing: antialiased; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes slideRight { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }
      @keyframes pulse { 0%,100% { opacity:.6; } 50% { opacity:1; } }
      @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      .fadeUp { animation: fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
      .fadeIn { animation: fadeIn .25s ease both; }
      input, textarea, select { font-family: var(--font-body); }
      button { cursor: pointer; font-family: var(--font-body); }
      a { color: inherit; text-decoration: none; }

      /* ── MOBILE ── */
      .mobile-only { display: none; }
      .desktop-only { display: flex; }
      @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
      @media (max-width: 768px) {
        .mobile-only  { display: flex; }
        .desktop-only { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const SERVICES = [
  { id:"netflix",     name:"Netflix",     color:"#E50914", logo:"N",  subscribed:true,  deal:null,                  url:"https://www.netflix.com/search?q=" },
  { id:"disney",      name:"Disney+",     color:"#0063E5", logo:"D+", subscribed:true,  deal:null,                  url:"https://www.disneyplus.com/search/" },
  { id:"max",         name:"Max",         color:"#002BE7", logo:"M",  subscribed:true,  deal:null,                  url:"https://www.max.com/search?q=" },
  { id:"hulu",        name:"Hulu",        color:"#1CE783", logo:"H",  subscribed:false, deal:"2 months free",       url:"https://www.hulu.com/search?q=" },
  { id:"apple",       name:"Apple TV+",   color:"#555",    logo:"A",  subscribed:false, deal:"$2.99/mo first year", url:"https://tv.apple.com/search?term=" },
  { id:"prime",       name:"Prime",       color:"#00A8E1", logo:"P",  subscribed:false, deal:null,                  url:"https://www.amazon.com/s?k=" },
  { id:"peacock",     name:"Peacock",     color:"#E81C2E", logo:"Pk", subscribed:false, deal:"50% off annual",      url:"https://www.peacocktv.com/search?q=" },
  { id:"paramount",   name:"Paramount+",  color:"#0064FF", logo:"P+", subscribed:false, deal:"30-day trial",        url:"https://www.paramountplus.com/search/?q=" },
  { id:"crunchyroll", name:"Crunchyroll", color:"#F47521", logo:"CR", subscribed:false, deal:"14-day free trial",   url:"https://www.crunchyroll.com/search?q=" },
  { id:"espnplus",    name:"ESPN+",       color:"#E31837", logo:"E+", subscribed:false, deal:null,                  url:"https://www.espn.com/espnplus/player/" },
  { id:"dazn",        name:"DAZN",        color:"#C8A900", logo:"DZ", subscribed:false, deal:"First month $1.99",   url:"https://www.dazn.com/search?q=" },
  { id:"fubo",        name:"Fubo",        color:"#FF6B00", logo:"F",  subscribed:false, deal:"7-day free trial",    url:"https://www.fubo.tv/welcome" },
];

const GR = [
  ["#1a1a2e","#e94560"],["#0d1b2a","#1f6feb"],["#1a0533","#7928ca"],
  ["#0a1628","#f59e0b"],["#1c0d2e","#c026d3"],["#0d2137","#06b6d4"],
  ["#1f1200","#d97706"],["#001f0d","#10b981"],["#1a0a0a","#ef4444"],
  ["#0d0d1a","#6366f1"],["#1a1000","#eab308"],["#0a1a1a","#14b8a6"],
  ["#1a0a18","#f472b6"],["#0d1a08","#22c55e"],["#180d00","#fb923c"],
  ["#080d1a","#818cf8"],["#1a0808","#f87171"],["#081a18","#34d399"],
  ["#120818","#c084fc"],["#081808","#4ade80"],
];

const MOVIES = [
  // ── Movies & TV ──
  { id:1,  title:"Oppenheimer",         year:2023, platform:"prime",       category:"movies-tv", genre:["Drama","History"],     overview:"The story of J. Robert Oppenheimer and the Manhattan Project." },
  { id:2,  title:"Barbie",              year:2023, platform:"max",         category:"movies-tv", genre:["Comedy","Fantasy"],    overview:"Barbie and Ken embark on a journey of self-discovery in the real world." },
  { id:3,  title:"Succession",          year:2023, platform:"max",         category:"movies-tv", genre:["Drama","TV Series"],   overview:"The Roy family's power struggles in their global media empire." },
  { id:4,  title:"The Bear",            year:2023, platform:"hulu",        category:"movies-tv", genre:["Drama","TV Series"],   overview:"A young chef returns home to run his family's sandwich shop in Chicago." },
  { id:5,  title:"Dune: Part Two",      year:2024, platform:"max",         category:"movies-tv", genre:["Sci-Fi","Epic"],       overview:"Paul Atreides unites with the Fremen to take revenge on the conspirators." },
  { id:6,  title:"The Mandalorian",     year:2023, platform:"disney",      category:"movies-tv", genre:["Sci-Fi","TV Series"],  overview:"A lone bounty hunter in the outer reaches of the galaxy." },
  { id:7,  title:"Wednesday",           year:2022, platform:"netflix",     category:"movies-tv", genre:["Horror","Comedy"],     overview:"Wednesday Addams investigates a murder spree while attending Nevermore Academy." },
  { id:8,  title:"Stranger Things",     year:2022, platform:"netflix",     category:"movies-tv", genre:["Horror","Sci-Fi"],     overview:"Kids in Hawkins battle supernatural forces from the Upside Down." },
  { id:9,  title:"House of Dragon",     year:2023, platform:"max",         category:"movies-tv", genre:["Fantasy","TV Series"], overview:"The story of House Targaryen set 200 years before Game of Thrones." },
  { id:10, title:"Ted Lasso",           year:2023, platform:"apple",       category:"movies-tv", genre:["Comedy","TV Series"],  overview:"An American football coach hired to manage an English soccer team." },
  { id:11, title:"Andor",              year:2022, platform:"disney",      category:"movies-tv", genre:["Sci-Fi","TV Series"],  overview:"Cassian Andor's journey toward becoming a rebel spy." },
  { id:12, title:"Beef",               year:2023, platform:"netflix",     category:"movies-tv", genre:["Drama","Comedy"],      overview:"Two strangers whose road rage incident sets off a chain of unexpected events." },
  // ── Anime ──
  { id:13, title:"Attack on Titan",     year:2023, platform:"crunchyroll", category:"anime",     genre:["Anime","Action"],      overview:"Humanity fights for survival against giant humanoid Titans in the epic series finale." },
  { id:14, title:"Demon Slayer S3",     year:2023, platform:"crunchyroll", category:"anime",     genre:["Anime","Action"],      overview:"Tanjiro enters the Swordsmith Village arc in a visually stunning new season." },
  { id:15, title:"One Piece",           year:2023, platform:"crunchyroll", category:"anime",     genre:["Anime","Adventure"],   overview:"Luffy and the Straw Hats continue their epic quest to find the legendary One Piece." },
  { id:16, title:"Jujutsu Kaisen S2",   year:2023, platform:"crunchyroll", category:"anime",     genre:["Anime","Horror"],      overview:"The Shibuya Incident arc delivers the most intense battles in the series yet." },
  { id:17, title:"My Hero Academia S6", year:2023, platform:"crunchyroll", category:"anime",     genre:["Anime","Action"],      overview:"Class 1-A faces their darkest hours in the Paranormal Liberation War arc." },
  { id:18, title:"Chainsaw Man",        year:2022, platform:"crunchyroll", category:"anime",     genre:["Anime","Horror"],      overview:"Denji merges with his devil dog Pochita to become the Chainsaw Man in this brutal series." },
  { id:19, title:"Spy x Family",        year:2023, platform:"crunchyroll", category:"anime",     genre:["Anime","Comedy"],      overview:"A spy, assassin, and telepath form a fake family with hilariously real feelings." },
  { id:20, title:"Vinland Saga S2",     year:2023, platform:"netflix",     category:"anime",     genre:["Anime","Drama"],       overview:"Thorfinn pursues pacifism and purpose in this breathtaking redemption arc." },
  // ── Sports ──
  { id:21, title:"UFC 300",             year:2024, platform:"espnplus",    category:"sports",    genre:["Sports","MMA"],        overview:"One of the most stacked cards in UFC history — multiple championship fights on one night." },
  { id:22, title:"NFL Playoffs 2024",   year:2024, platform:"espnplus",    category:"sports",    genre:["Sports","Football"],   overview:"The road to Super Bowl LVIII — every playoff game, every moment, every miracle catch." },
  { id:23, title:"Champions League",    year:2024, platform:"dazn",        category:"sports",    genre:["Sports","Soccer"],     overview:"Europe's elite clubs battle it out in the world's most prestigious club competition." },
  { id:24, title:"F1: Drive to Survive",year:2024, platform:"netflix",     category:"sports",    genre:["Sports","Documentary"],overview:"Behind the scenes of Formula 1's most dramatic season yet in this global hit docuseries." },
  { id:25, title:"Premier League",      year:2024, platform:"fubo",        category:"sports",    genre:["Sports","Soccer"],     overview:"Live matches and highlights from the world's most-watched football league every week." },
  { id:26, title:"Canelo vs. Munguia",  year:2024, platform:"dazn",        category:"sports",    genre:["Sports","Boxing"],     overview:"The Mexican superfight — Canelo defends his super middleweight titles against rising star Munguia." },
  { id:27, title:"NBA League Pass",     year:2024, platform:"espnplus",    category:"sports",    genre:["Sports","Basketball"], overview:"Every game, every team, every night — the full NBA season in stunning HD." },
  { id:28, title:"WWE SmackDown",       year:2024, platform:"peacock",     category:"sports",    genre:["Sports","Wrestling"],  overview:"The blue brand delivers weekly action, drama, and championship moments every Friday." },
];

const INIT_RATINGS = {
  1:{avg:8.9,count:1241}, 2:{avg:7.4,count:893},  3:{avg:9.2,count:2103},
  4:{avg:8.7,count:756},  5:{avg:8.5,count:1432}, 6:{avg:8.0,count:1890},
  7:{avg:7.6,count:1123}, 8:{avg:8.8,count:2341}, 9:{avg:8.3,count:1670},
  10:{avg:8.6,count:934}, 11:{avg:9.0,count:1122},12:{avg:8.2,count:678},
  // Anime
  13:{avg:9.5,count:3421},14:{avg:9.1,count:2890},15:{avg:8.9,count:4120},
  16:{avg:9.3,count:3100},17:{avg:8.7,count:2200},18:{avg:8.8,count:1980},
  19:{avg:8.6,count:1750},20:{avg:9.0,count:1340},
  // Sports
  21:{avg:9.2,count:876}, 22:{avg:8.8,count:1230},23:{avg:8.5,count:2100},
  24:{avg:8.3,count:1560},25:{avg:8.1,count:980}, 26:{avg:8.7,count:654},
  27:{avg:8.4,count:1890},28:{avg:7.9,count:1100},
};

const INIT_REVIEWS = {
  1:[
    { id:"r1", movieId:1, user:"cinephile99", avatar:"C", title:"A Masterpiece of Modern Cinema", content:"Nolan outdoes himself. The practical effects and Cillian Murphy's performance are absolutely mesmerizing. The trinity test scene alone is worth the price of admission.", rating:10, helpful:42, unhelpful:3, ts: Date.now()-86400000*5 },
    { id:"r2", movieId:1, user:"filmcritic77", avatar:"F", title:"Dense but rewarding", content:"Three hours that fly by. The non-linear narrative takes patience but pays off beautifully. RDJ's comeback role as Strauss is the film's secret weapon.", rating:9, helpful:28, unhelpful:2, ts: Date.now()-86400000*3 },
  ],
  2:[
    { id:"r3", movieId:2, user:"barbiefan", avatar:"B", title:"Surprisingly deep and hilarious", content:"What looked like a silly toy movie turned into sharp social commentary. Margot Robbie is perfect. The Kens subplot is genuinely funny and weirdly poignant.", rating:8, helpful:19, unhelpful:4, ts: Date.now()-86400000*7 },
  ],
  5:[
    { id:"r4", movieId:5, user:"scifi_lover", avatar:"S", title:"Villeneuve does it again", content:"The scale is absolutely breathtaking. Zendaya and Chalamet have incredible chemistry. The final battle sequence is the best action setpiece in years.", rating:9, helpful:35, unhelpful:1, ts: Date.now()-86400000*2 },
  ],
  8:[
    { id:"r5", movieId:8, user:"nostalgic_gamer", avatar:"N", title:"Still the best on Netflix", content:"Season 4 delivered everything fans wanted. The Vecna storyline is genuinely terrifying and the Hawkins kids are all grown up in the best way. Volume 2's finale made me cry.", rating:9, helpful:67, unhelpful:5, ts: Date.now()-86400000*10 },
  ],
  13:[
    { id:"r6", movieId:13, user:"otaku_prime", avatar:"O", title:"The Greatest Anime Finale Ever", content:"MAPPA delivered beyond expectations. The final season conclusion had me crying multiple times. An absolutely perfect ending to a generational series. Nothing comes close.", rating:10, helpful:134, unhelpful:4, ts: Date.now()-86400000*8 },
  ],
  16:[
    { id:"r7", movieId:16, user:"jjk_stan", avatar:"J", title:"Shibuya Incident is INSANE", content:"Episode 9 alone was better than most full seasons of anything I've watched. The animation quality is on a completely different level. MAPPA absolutely cooked with this one.", rating:10, helpful:89, unhelpful:2, ts: Date.now()-86400000*4 },
  ],
  21:[
    { id:"r8", movieId:21, user:"mma_fan", avatar:"M", title:"Greatest UFC card ever assembled", content:"Main card delivered top to bottom. Alex Pereira's performance was superhuman. The co-main was equally insane. Worth every single penny of the PPV.", rating:9, helpful:56, unhelpful:3, ts: Date.now()-86400000*6 },
  ],
  23:[
    { id:"r9", movieId:23, user:"footy_head", avatar:"F", title:"The pinnacle of club football", content:"Nothing beats Champions League nights. The drama, the atmosphere, the moments — you can't recreate this anywhere else. DAZN's coverage has been excellent.", rating:9, helpful:44, unhelpful:2, ts: Date.now()-86400000*3 },
  ],
};

// ─── CATEGORY TABS ───────────────────────────────────────────────────────────
const CATEGORY_TABS = [
  { id:"all",       label:"All",         icon:"🌐", color:"var(--gold)" },
  { id:"movies-tv", label:"Movies & TV", icon:"🎬", color:"var(--cyan)" },
  { id:"anime",     label:"Anime",       icon:"⚔️",  color:"var(--anime)" },
  { id:"sports",    label:"Sports",      icon:"🏆", color:"var(--sports)" },
];

const CATEGORY_COLOR = { "all":"var(--gold)", "movies-tv":"var(--cyan)", "anime":"var(--anime)", "sports":"var(--sports)" };
const CARD_ACCENT = { "anime":"var(--anime)", "sports":"var(--sports)" };
function Logo({ size = 32 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#F5C518"/>
        <rect x="3" y="3" width="34" height="34" rx="8" fill="#0D0D1A"/>
        <path d="M8 10 Q8 6 12 6 L28 6 Q36 6 36 14 L36 22 Q36 28 30 30 L20 34 L10 30 Q8 28 8 22 Z" fill="#F5C518" opacity=".15"/>
        <polygon points="16,13 16,27 28,20" fill="#F5C518"/>
        <circle cx="11" cy="20" r="3" fill="#7C3AED"/>
        <circle cx="11" cy="20" r="1.5" fill="#F5C518"/>
      </svg>
      <span style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize: size * 0.6, letterSpacing:"-0.02em" }}>
        <span style={{ color:"#fff" }}>Stream</span>
        <span style={{ color:"#F5C518" }}>Hub</span>
      </span>
    </div>
  );
}

// ─── STAR PICKER ─────────────────────────────────────────────────────────────
function StarPicker({ value, onChange, size = 18, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div style={{ display:"flex", gap:2 }}>
      {Array.from({length:10}, (_,i) => i+1).map(s => (
        <span
          key={s}
          onClick={() => !readOnly && onChange(s)}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{
            fontSize: size, cursor: readOnly ? "default" : "pointer",
            color: s <= display ? "#F5C518" : "rgba(255,255,255,0.15)",
            transition:"color .1s", lineHeight:1,
            transform: (!readOnly && hover === s) ? "scale(1.3)" : "scale(1)",
            display:"inline-block", transition:"all .12s",
          }}
        >★</span>
      ))}
    </div>
  );
}

// ─── SERVICE BADGE ────────────────────────────────────────────────────────────
function ServiceBadge({ platformId, small }) {
  const s = SERVICES.find(sv => sv.id === platformId);
  if (!s) return null;
  return (
    <span style={{
      background: s.color, color:"#fff", fontFamily:"var(--font-head)", fontWeight:700,
      fontSize: small ? 9 : 11, padding: small ? "2px 5px" : "3px 8px",
      borderRadius:6, letterSpacing:.5, whiteSpace:"nowrap",
    }}>{s.name}</span>
  );
}

// ─── CATEGORY CHIP ────────────────────────────────────────────────────────────
function CategoryChip({ cat }) {
  if (!cat || cat === "movies-tv") return null;
  const color = CARD_ACCENT[cat] || "var(--gold)";
  const label = cat === "anime" ? "⚔️ Anime" : "🏆 Sports";
  return (
    <span style={{ background:`${color}25`, color, fontSize:9, fontWeight:800,
      padding:"2px 7px", borderRadius:99, fontFamily:"var(--font-head)", letterSpacing:.5,
      border:`1px solid ${color}44`, whiteSpace:"nowrap" }}>{label}</span>
  );
}
function MovieCard({ movie, ratings, watchlist, userRatings, userSubs, onSelect, onToggleWatchlist }) {
  const [hov, setHov] = useState(false);
  const [idx] = useState(() => (movie.id - 1) % GR.length);
  const rt = ratings[movie.id] || { avg:0, count:0 };
  const inWL = watchlist.includes(movie.id);
  const notSub = !userSubs.includes(movie.platform);
  const accent = CARD_ACCENT[movie.category];
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(movie)}
      style={{
        borderRadius: "var(--radius)", overflow:"hidden", cursor:"pointer", position:"relative",
        background: `linear-gradient(160deg, ${GR[idx][0]}, ${GR[idx][1]})`,
        border: `1px solid ${hov ? (accent||"rgba(245,197,24,.4)") : "var(--border)"}`,
        transform: hov ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
        transition:"all .25s cubic-bezier(.22,1,.36,1)",
        boxShadow: hov ? `0 20px 40px rgba(0,0,0,.5), 0 0 0 1px ${GR[idx][1]}44` : "0 4px 12px rgba(0,0,0,.3)",
        filter: notSub ? "brightness(0.65) saturate(0.5)" : "none",
      }}
    >
      {/* Poster area */}
      <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        {accent && <div style={{ position:"absolute", inset:0, background:`${accent}14`, pointerEvents:"none" }} />}
        <div style={{ fontSize:60, opacity:.15, fontFamily:"var(--font-head)", fontWeight:800, userSelect:"none", color:"#fff" }}>
          {movie.title.slice(0,2).toUpperCase()}
        </div>
        {hov && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", animation:"fadeIn .2s" }}>
            <div style={{ width:46, height:46, borderRadius:"50%", background:accent||"rgba(245,197,24,.9)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:18, marginLeft:3 }}>▶</span>
            </div>
          </div>
        )}
        {notSub && (
          <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,.7)", borderRadius:6, padding:"3px 7px", fontSize:10, color:"var(--muted)", fontWeight:600 }}>
            NOT SUBSCRIBED
          </div>
        )}
        <div style={{ position:"absolute", bottom:8, left:8 }}><CategoryChip cat={movie.category} /></div>
        {/* Watchlist btn */}
        <button
          onClick={e => { e.stopPropagation(); onToggleWatchlist(movie.id); }}
          style={{
            position:"absolute", top:8, right:8, background: inWL ? "var(--gold)" : "rgba(0,0,0,.6)",
            border:"none", borderRadius:"50%", width:30, height:30, fontSize:14,
            color: inWL ? "#000" : "#fff", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .2s",
          }}
        >{inWL ? "♥" : "♡"}</button>
      </div>
      {/* Info */}
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:13, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{movie.title}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:11, color:"var(--muted)" }}>{movie.year}</span>
          <ServiceBadge platformId={movie.platform} small />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ color:"var(--gold)", fontSize:13 }}>★</span>
          <span style={{ fontSize:12, fontWeight:600 }}>{rt.avg.toFixed(1)}</span>
          <span style={{ fontSize:10, color:"var(--muted)" }}>({rt.count.toLocaleString()})</span>
          {userRatings[movie.id] && <span style={{ fontSize:10, color:"var(--cyan)", marginLeft:"auto" }}>You: {userRatings[movie.id]}★</span>}
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW FORM ─────────────────────────────────────────────────────────────
function ReviewForm({ movieId, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [err, setErr] = useState("");
  const inp = { background:"rgba(255,255,255,.05)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", padding:"10px 14px", width:"100%", fontSize:13, outline:"none" };
  return (
    <div style={{ background:"rgba(124,58,237,.08)", border:"1px solid rgba(124,58,237,.2)", borderRadius:"var(--radius)", padding:18, marginBottom:24 }}>
      <div style={{ fontFamily:"var(--font-head)", fontWeight:700, marginBottom:14, fontSize:15 }}>Write a Review</div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6 }}>Your Rating</div>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Review title..." style={{...inp, marginBottom:10}} />
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Share your thoughts..." rows={3} style={{...inp, resize:"vertical", marginBottom:8}} />
      {err && <div style={{ color:"var(--danger)", fontSize:12, marginBottom:8 }}>{err}</div>}
      <button
        onClick={() => {
          if (!rating) return setErr("Please add a star rating.");
          if (!title.trim()) return setErr("Please add a title.");
          if (content.trim().length < 10) return setErr("Review too short.");
          setErr("");
          onSubmit({ rating, title, content });
          setRating(0); setTitle(""); setContent("");
        }}
        style={{ background:"var(--purple)", border:"none", borderRadius:10, color:"#fff", padding:"9px 20px", fontWeight:600, fontSize:13, transition:"opacity .2s" }}
      >Post Review</button>
    </div>
  );
}

// ─── REVIEW ITEM ─────────────────────────────────────────────────────────────
function ReviewItem({ rev, myVote, onVote, onEdit, onDelete, isMe }) {
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState(rev.title);
  const [eContent, setEContent] = useState(rev.content);
  const [eRating, setERating] = useState(rev.rating);
  const daysAgo = Math.floor((Date.now() - rev.ts) / 86400000);
  return (
    <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:16, marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--purple)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-head)", fontWeight:700, fontSize:13 }}>{rev.avatar}</div>
        <div>
          <div style={{ fontWeight:600, fontSize:13 }}>{rev.user}</div>
          <div style={{ fontSize:11, color:"var(--muted)" }}>{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          <span style={{ background:"var(--gold-dim)", color:"var(--gold)", borderRadius:6, padding:"2px 8px", fontSize:12, fontWeight:700 }}>★ {rev.rating}</span>
        </div>
      </div>
      {editing ? (
        <div>
          <StarPicker value={eRating} onChange={setERating} size={16} />
          <input value={eTitle} onChange={e=>setETitle(e.target.value)} style={{ background:"rgba(255,255,255,.06)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", padding:"8px 12px", width:"100%", fontSize:13, marginTop:8, marginBottom:8, outline:"none" }} />
          <textarea value={eContent} onChange={e=>setEContent(e.target.value)} rows={3} style={{ background:"rgba(255,255,255,.06)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", padding:"8px 12px", width:"100%", fontSize:13, resize:"vertical", outline:"none", marginBottom:8 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { onEdit(rev.id, eRating, eTitle, eContent); setEditing(false); }} style={{ background:"var(--purple)", border:"none", borderRadius:8, color:"#fff", padding:"7px 16px", fontWeight:600, fontSize:12 }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ background:"rgba(255,255,255,.07)", border:"none", borderRadius:8, color:"var(--text)", padding:"7px 16px", fontSize:12 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:5 }}>{rev.title}</div>
          <div style={{ fontSize:13, color:"rgba(240,240,250,.75)", lineHeight:1.6, marginBottom:12 }}>{rev.content}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:"var(--muted)" }}>Helpful?</span>
            <button onClick={() => onVote(rev.id, "up")} style={{ background: myVote==="up" ? "var(--success)" : "rgba(255,255,255,.07)", border:"none", borderRadius:7, color: myVote==="up" ? "#000" : "var(--text)", padding:"4px 10px", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>👍 {rev.helpful + (myVote==="up" ? 1 : 0)}</button>
            <button onClick={() => onVote(rev.id, "down")} style={{ background: myVote==="down" ? "var(--danger)" : "rgba(255,255,255,.07)", border:"none", borderRadius:7, color: myVote==="down" ? "#fff" : "var(--text)", padding:"4px 10px", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>👎 {rev.unhelpful + (myVote==="down" ? 1 : 0)}</button>
            {isMe && (
              <>
                <button onClick={() => setEditing(true)} style={{ marginLeft:"auto", background:"none", border:"1px solid rgba(255,255,255,.15)", borderRadius:7, color:"var(--muted)", padding:"4px 10px", fontSize:12 }}>Edit</button>
                <button onClick={() => onDelete(rev.id)} style={{ background:"none", border:"1px solid rgba(239,68,68,.3)", borderRadius:7, color:"var(--danger)", padding:"4px 10px", fontSize:12 }}>Delete</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MOVIE MODAL ─────────────────────────────────────────────────────────────
function MovieModal({ movie, ratings, reviews, userRatings, watchlist, myVotes, onClose, onRate, onAddReview, onEditReview, onDeleteReview, onVote, onToggleWatchlist }) {
  const [tab, setTab] = useState("overview");
  const [idx] = useState(() => (movie.id - 1) % GR.length);
  const rt = ratings[movie.id] || { avg:0, count:0 };
  const revList = reviews[movie.id] || [];
  const inWL = watchlist.includes(movie.id);
  const userRat = userRatings[movie.id] || 0;
  const similar = MOVIES.filter(m => m.id !== movie.id && m.genre.some(g => movie.genre.includes(g))).slice(0,4);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)", animation:"fadeIn .2s" }}>
      <div onClick={e => e.stopPropagation()} className="fadeUp" style={{ background:"var(--surface)", borderRadius:20, width:"100%", maxWidth:760, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", border:"1px solid var(--border)", boxShadow:"0 40px 80px rgba(0,0,0,.7)" }}>
        {/* Hero Banner */}
        <div style={{ height:180, background:`linear-gradient(160deg,${GR[idx][0]},${GR[idx][1]})`, position:"relative", flexShrink:0 }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, var(--surface) 0%, transparent 60%)" }} />
          <div style={{ position:"absolute", top:14, right:14, display:"flex", gap:8 }}>
            <button onClick={() => onToggleWatchlist(movie.id)} style={{ background: inWL ? "var(--gold)" : "rgba(0,0,0,.6)", border:"none", borderRadius:10, color: inWL ? "#000" : "#fff", padding:"6px 14px", fontWeight:700, fontSize:13, backdropFilter:"blur(8px)" }}>{inWL ? "♥ Saved" : "♡ Watchlist"}</button>
            <button onClick={onClose} style={{ background:"rgba(0,0,0,.6)", border:"none", borderRadius:10, color:"#fff", width:36, height:36, fontSize:18, backdropFilter:"blur(8px)" }}>✕</button>
          </div>
          <div style={{ position:"absolute", bottom:16, left:20, right:20 }}>
            <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:26, marginBottom:6, textShadow:"0 2px 12px rgba(0,0,0,.8)" }}>{movie.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, color:"rgba(255,255,255,.7)" }}>{movie.year}</span>
              {movie.genre.map(g => <span key={g} style={{ background:"rgba(255,255,255,.12)", borderRadius:6, padding:"2px 8px", fontSize:11 }}>{g}</span>)}
              <ServiceBadge platformId={movie.platform} />
            </div>
          </div>
        </div>
        {/* Rating Bar */}
        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 20px", borderBottom:"1px solid var(--border)", flexShrink:0, background:"var(--card)", flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:3 }}>Community Score</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:"var(--gold)", fontSize:22, fontFamily:"var(--font-head)", fontWeight:800 }}>{rt.avg.toFixed(1)}</span>
              <span style={{ color:"var(--muted)", fontSize:13 }}>/ 10 · {rt.count.toLocaleString()} ratings</span>
            </div>
          </div>
          <div style={{ width:1, height:36, background:"var(--border)" }} />
          <div>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>Your Rating</div>
            <StarPicker value={userRat} onChange={v => onRate(movie.id, v)} size={16} />
          </div>
          <div style={{ marginLeft:"auto" }}>
            {(() => {
              const svc = SERVICES.find(s => s.id === movie.platform);
              if (!svc) return null;
              const url = svc.url + encodeURIComponent(movie.title);
              return (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:8, background:svc.color, borderRadius:10, color:"#fff", padding:"9px 18px", fontFamily:"var(--font-head)", fontWeight:800, fontSize:13, textDecoration:"none" }}
                  onClick={e => e.stopPropagation()}>
                  ▶ Watch on {svc.name}
                </a>
              );
            })()}
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:4, padding:"12px 20px 0", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          {["overview","reviews"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background:"none", border:"none", color: tab===t ? "var(--gold)" : "var(--muted)", fontFamily:"var(--font-head)", fontWeight:700, fontSize:14, padding:"8px 16px", borderBottom: tab===t ? "2px solid var(--gold)" : "2px solid transparent", marginBottom:-1, transition:"all .2s", textTransform:"capitalize" }}>{t} {t==="reviews" && `(${revList.length})`}</button>
          ))}
        </div>
        {/* Tab Content */}
        <div style={{ overflowY:"auto", flex:1, padding:20 }}>
          {tab === "overview" ? (
            <div>
              <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(240,240,250,.8)", marginBottom:24 }}>{movie.overview}</p>
              {similar.length > 0 && (
                <>
                  <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:15, marginBottom:14, color:"var(--muted)" }}>Similar Titles</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                    {similar.map(sm => {
                      const srt = ratings[sm.id] || {avg:0};
                      const sidx = (sm.id-1) % GR.length;
                      return (
                        <div key={sm.id} style={{ background:`linear-gradient(135deg,${GR[sidx][0]},${GR[sidx][1]})`, borderRadius:10, padding:12, border:"1px solid var(--border)" }}>
                          <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:12, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sm.title}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
                            <span style={{ fontSize:11, color:"var(--gold)" }}>★</span>
                            <span style={{ fontSize:11 }}>{srt.avg.toFixed(1)}</span>
                          </div>
                          <ServiceBadge platformId={sm.platform} small />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <ReviewForm movieId={movie.id} onSubmit={(data) => onAddReview(movie.id, data)} />
              {revList.length === 0 ? (
                <div style={{ textAlign:"center", color:"var(--muted)", padding:"32px 0", fontSize:14 }}>No reviews yet. Be the first!</div>
              ) : (
                revList.map(rv => (
                  <ReviewItem
                    key={rv.id}
                    rev={rv}
                    myVote={myVotes[rv.id]}
                    onVote={onVote}
                    onEdit={onEditReview}
                    onDelete={onDeleteReview}
                    isMe={rv.user === "You"}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UPGRADE MODAL ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onComplete }) {
  const [step, setStep] = useState("plans"); // plans | pay | success
  const [card, setCard] = useState({ name:"", number:"", expiry:"", cvc:"" });
  const [loading, setLoading] = useState(false);
  const formatCard = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry = v => { const d = v.replace(/\D/g,"").slice(0,4); return d.length > 2 ? d.slice(0,2)+"/"+d.slice(2) : d; };
  const inp = { background:"rgba(255,255,255,.06)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", padding:"11px 14px", width:"100%", fontSize:14, outline:"none", fontFamily:"var(--font-body)" };
  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (err) {
      setLoading(false);
      alert('Payment error: ' + err.message + '\n\nMake sure your Stripe keys are set in Vercel.');
    }
  };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)", animation:"fadeIn .2s" }}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{ background:"var(--surface)", borderRadius:20, width:"100%", maxWidth:480, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 40px 80px rgba(0,0,0,.8)" }}>
        {step === "plans" && (
          <div style={{ padding:28 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:22 }}>Choose Your Plan</div>
              <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--muted)", fontSize:20 }}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
              {/* Free */}
              <div style={{ border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:18 }}>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:17, marginBottom:4 }}>Free</div>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:26, color:"var(--muted)", marginBottom:14 }}>$0</div>
                {["Browse & search","Basic ratings","Community reviews","Watchlist (up to 10)","Ads included"].map(f=>(
                  <div key={f} style={{ display:"flex", gap:8, alignItems:"center", fontSize:13, color:"var(--muted)", marginBottom:8 }}>
                    <span style={{ color:"var(--muted)" }}>○</span> {f}
                  </div>
                ))}
              </div>
              {/* Premium */}
              <div style={{ border:"2px solid var(--gold)", borderRadius:"var(--radius)", padding:18, background:"rgba(245,197,24,.04)", position:"relative" }}>
                <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"var(--gold)", color:"#000", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:99, fontFamily:"var(--font-head)" }}>MOST POPULAR</div>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:17, marginBottom:4 }}>Premium</div>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:26, color:"var(--gold)", marginBottom:14 }}>$9.99<span style={{ fontSize:14, fontWeight:400 }}>/mo</span></div>
                {["Everything in Free","AI Recommendations","Ad-free experience","Unlimited watchlist","Priority support","Early access features"].map(f=>(
                  <div key={f} style={{ display:"flex", gap:8, alignItems:"center", fontSize:13, marginBottom:8 }}>
                    <span style={{ color:"var(--gold)" }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setStep("pay")} style={{ width:"100%", background:"var(--gold)", border:"none", borderRadius:"var(--radius)", color:"#000", padding:14, fontFamily:"var(--font-head)", fontWeight:800, fontSize:15, letterSpacing:.3 }}>Upgrade to Premium →</button>
          </div>
        )}
        {step === "pay" && (
          <div style={{ padding:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              <button onClick={() => setStep("plans")} style={{ background:"rgba(255,255,255,.07)", border:"none", borderRadius:8, color:"var(--text)", width:32, height:32, fontSize:16 }}>←</button>
              <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:20 }}>Payment Details</div>
            </div>
            <div style={{ background:"rgba(245,197,24,.08)", border:"1px solid rgba(245,197,24,.2)", borderRadius:"var(--radius)", padding:14, marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>StreamHub Premium</div>
                <div style={{ fontSize:13, color:"var(--muted)" }}>Billed monthly · Cancel anytime</div>
              </div>
              <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:20, color:"var(--gold)" }}>$9.99</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              <input value={card.name} onChange={e=>setCard({...card,name:e.target.value})} placeholder="Cardholder name" style={inp} />
              <div style={{ position:"relative" }}>
                <input value={card.number} onChange={e=>setCard({...card,number:formatCard(e.target.value)})} placeholder="1234 5678 9012 3456" style={{...inp, paddingRight:48}} />
                <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:18 }}>💳</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <input value={card.expiry} onChange={e=>setCard({...card,expiry:formatExpiry(e.target.value)})} placeholder="MM / YY" style={inp} />
                <input value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value.replace(/\D/g,"").slice(0,3)})} placeholder="CVC" style={inp} />
              </div>
            </div>
            <button
              onClick={handlePay}
              disabled={loading}
              style={{ width:"100%", background: loading ? "rgba(245,197,24,.5)" : "var(--gold)", border:"none", borderRadius:"var(--radius)", color:"#000", padding:14, fontFamily:"var(--font-head)", fontWeight:800, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
            >
              {loading ? <><span style={{ display:"inline-block", width:18, height:18, border:"2px solid #000", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }} /> Processing…</> : "Pay $9.99 / month"}
            </button>
            <div style={{ textAlign:"center", fontSize:11, color:"var(--muted)", marginTop:14, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span>🔒</span> Secured by <span style={{ color:"#6772e5", fontWeight:700 }}>Stripe</span> · SSL Encrypted
            </div>
          </div>
        )}
        {step === "success" && (
          <div style={{ padding:40, textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
            <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:24, marginBottom:8 }}>Welcome to Premium!</div>
            <div style={{ color:"var(--muted)", fontSize:14, marginBottom:24, lineHeight:1.6 }}>You now have access to AI recommendations and an ad-free experience. Enjoy StreamHub at its best!</div>
            <button onClick={() => { onComplete(); onClose(); }} style={{ background:"var(--gold)", border:"none", borderRadius:"var(--radius)", color:"#000", padding:"12px 32px", fontFamily:"var(--font-head)", fontWeight:800, fontSize:15 }}>Start Exploring ✨</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARE MODAL ──────────────────────────────────────────────────────────────
function ShareModal({ watchlist, onClose, showToast }) {
  const link = `https://streamhub.app/watchlist/user-${Math.random().toString(36).slice(2,8)}`;
  const wlMovies = MOVIES.filter(m => watchlist.includes(m.id));
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)", animation:"fadeIn .2s" }}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{ background:"var(--surface)", borderRadius:20, width:"100%", maxWidth:440, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 40px 80px rgba(0,0,0,.8)" }}>
        <div style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:20 }}>Share Watchlist</div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--muted)", fontSize:20 }}>✕</button>
          </div>
          {wlMovies.length === 0 ? (
            <div style={{ color:"var(--muted)", textAlign:"center", padding:"24px 0", fontSize:14 }}>Your watchlist is empty. Add some movies first!</div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
                {wlMovies.slice(0,6).map(m => {
                  const idx = (m.id-1) % GR.length;
                  return (
                    <div key={m.id} style={{ background:`linear-gradient(135deg,${GR[idx][0]},${GR[idx][1]})`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                      <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:10, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.title}</div>
                      <ServiceBadge platformId={m.platform} small />
                    </div>
                  );
                })}
              </div>
              {wlMovies.length > 6 && <div style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginBottom:16 }}>+{wlMovies.length-6} more</div>}
              <div style={{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:12, display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ fontSize:12, color:"var(--muted)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{link}</div>
                <button onClick={() => { navigator.clipboard?.writeText(link); showToast("Link copied! 🔗"); onClose(); }} style={{ background:"var(--gold)", border:"none", borderRadius:8, color:"#000", padding:"6px 14px", fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}>Copy</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[["Twitter/X","#1DA1F2","𝕏"],["WhatsApp","#25D366","💬"],["Email","var(--purple)","✉"]].map(([n,c,i]) => (
                  <button key={n} onClick={() => { showToast(`Sharing via ${n}!`); onClose(); }} style={{ background:c, border:"none", borderRadius:10, color:"#fff", padding:"10px 0", fontSize:12, fontWeight:700 }}>{i} {n}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI RECS PANEL ────────────────────────────────────────────────────────────
function AIRecsPanel({ tier, watchlist, onUpgrade }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const wlMovies = MOVIES.filter(m => watchlist.includes(m.id));
  const getAI = async () => {
    if (tier !== "premium") return onUpgrade();
    setLoading(true);
    try {
      const prompt = `You are a movie/TV recommendation engine. The user has watched: ${wlMovies.map(m=>m.title).join(", ") || "various popular titles"}. Give 4 personalized recommendations. Return ONLY valid JSON: {"recs":[{"title":"...","year":2024,"reason":"one short sentence","genre":"Drama","platform":"netflix"}]}. Platform must be one of: netflix, disney, max, hulu, prime, apple, peacock, paramount.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600, messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text || "{}";
      const clean = txt.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setRecs(parsed.recs || []);
      setRan(true);
    } catch(e) {
      setRecs([{title:"The Crown",year:2023,reason:"Drama with incredible performances",genre:"Drama",platform:"netflix"},{title:"Severance",year:2023,reason:"Mind-bending thriller you'll love",genre:"Sci-Fi",platform:"apple"},{title:"The Last of Us",year:2023,reason:"Emotional post-apocalyptic masterpiece",genre:"Drama",platform:"max"},{title:"Abbott Elementary",year:2023,reason:"Heartwarming workplace comedy",genre:"Comedy",platform:"hulu"}]);
      setRan(true);
    }
    setLoading(false);
  };
  return (
    <div style={{ background:"linear-gradient(135deg, rgba(124,58,237,.12), rgba(6,182,212,.08))", border:"1px solid rgba(124,58,237,.25)", borderRadius:"var(--radius)", padding:18, marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>✨</span>
          <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:15 }}>AI Recommendations</div>
          {tier !== "premium" && <span style={{ background:"var(--gold)", color:"#000", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:99, fontFamily:"var(--font-head)" }}>PREMIUM</span>}
        </div>
        <button onClick={getAI} disabled={loading} style={{ background: tier==="premium" ? "var(--purple)" : "var(--gold)", border:"none", borderRadius:9, color: tier==="premium" ? "#fff" : "#000", padding:"7px 14px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
          {loading ? <span style={{ display:"inline-block", width:14, height:14, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }} /> : "✦"}
          {tier!=="premium" ? "Unlock AI" : ran ? "Refresh" : "Get Recs"}
        </button>
      </div>
      {tier !== "premium" && !ran && (
        <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>Upgrade to Premium for personalized AI movie & show picks based on your watchlist and taste.</div>
      )}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--muted)", fontSize:13, padding:"8px 0" }}>
          <span style={{ display:"inline-block", width:16, height:16, border:"2px solid var(--purple)", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
          Consulting the AI oracle…
        </div>
      )}
      {recs.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {recs.map((r,i) => (
            <div key={i} style={{ background:"rgba(0,0,0,.3)", borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"flex-start", gap:12, animation:`fadeUp .3s ${i*0.08}s both` }}>
              <div style={{ width:36, height:36, borderRadius:9, background:`linear-gradient(135deg,${GR[i][0]},${GR[i][1]})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-head)", fontWeight:800, fontSize:13 }}>{r.title.slice(0,2)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:13, marginBottom:3 }}>{r.title} <span style={{ color:"var(--muted)", fontWeight:400 }}>({r.year})</span></div>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:5 }}>{r.reason}</div>
                <ServiceBadge platformId={r.platform} small />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"12px 20px", zIndex:2000, fontWeight:600, fontSize:14, boxShadow:"0 12px 32px rgba(0,0,0,.5)", animation:"slideRight .3s cubic-bezier(.22,1,.36,1) both", display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ color:"var(--gold)", fontSize:16 }}>✦</span> {msg}
    </div>
  );
}

// ─── AD BANNER ────────────────────────────────────────────────────────────────
function AdBanner() {
  return (
    <div style={{ background:"rgba(255,255,255,.03)", border:"1px dashed rgba(255,255,255,.1)", borderRadius:"var(--radius)", padding:16, textAlign:"center", marginBottom:16 }}>
      <div style={{ fontSize:9, color:"var(--muted)", marginBottom:8, letterSpacing:1 }}>ADVERTISEMENT</div>
      <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6 }}>🍿 Limited offer — 3 months of Hulu for the price of 1. Stream thousands of shows & movies. <span style={{ color:"var(--gold)", fontWeight:700 }}>Claim Now →</span></div>
    </div>
  );
}

// ─── SETUP MODAL (My Subscriptions) ─────────────────────────────────────────
function SetupModal({ userSubs, onSave, onClose, isFirst }) {
  const [selected, setSelected] = useState(new Set(userSubs));
  const toggle = id => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  return (
    <div onClick={isFirst ? null : onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.92)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(12px)", animation:"fadeIn .2s" }}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{ background:"var(--surface)", borderRadius:22, width:"100%", maxWidth:560, border:"1px solid var(--border)", boxShadow:"0 40px 80px rgba(0,0,0,.9)", overflow:"hidden" }}>
        <div style={{ padding:"28px 28px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
            <Logo size={28} />
          </div>
          <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:22, marginBottom:6, marginTop:16 }}>
            {isFirst ? "Welcome! What are you subscribed to?" : "Manage Subscriptions"}
          </div>
          <div style={{ fontSize:13, color:"var(--muted)", marginBottom:24, lineHeight:1.6 }}>
            {isFirst ? "Pick your services so StreamHub can personalize your experience. You can change this anytime." : "Toggle the services you currently pay for."}
          </div>
        </div>
        <div style={{ padding:"0 28px", maxHeight:340, overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, paddingBottom:24 }}>
            {SERVICES.map(s => {
              const on = selected.has(s.id);
              return (
                <button key={s.id} onClick={() => toggle(s.id)} style={{
                  background: on ? `${s.color}20` : "rgba(255,255,255,.04)",
                  border: `2px solid ${on ? s.color : "rgba(255,255,255,.08)"}`,
                  borderRadius:12, padding:"12px 10px", display:"flex", flexDirection:"column",
                  alignItems:"center", gap:8, transition:"all .2s", position:"relative",
                }}>
                  {on && <span style={{ position:"absolute", top:6, right:8, color:s.color, fontSize:14, fontWeight:800 }}>✓</span>}
                  <span style={{ background: on ? s.color : "rgba(255,255,255,.12)", borderRadius:8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", transition:"background .2s" }}>{s.logo}</span>
                  <span style={{ fontSize:11, fontWeight:700, color: on ? "#fff" : "var(--muted)", textAlign:"center", lineHeight:1.3 }}>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding:"16px 28px 28px", borderTop:"1px solid var(--border)", display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:13, color:"var(--muted)", flex:1 }}>{selected.size} service{selected.size !== 1 ? "s" : ""} selected</span>
          {!isFirst && <button onClick={onClose} style={{ background:"rgba(255,255,255,.07)", border:"none", borderRadius:10, color:"var(--text)", padding:"10px 20px", fontSize:14, fontWeight:600 }}>Cancel</button>}
          <button onClick={() => { onSave([...selected]); onClose(); }} style={{ background:"var(--gold)", border:"none", borderRadius:10, color:"#000", padding:"10px 24px", fontFamily:"var(--font-head)", fontWeight:800, fontSize:14 }}>
            {isFirst ? "Let's Go →" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ onClose, userSubs, tier, watchlist, reviews, userRatings, onEditSubs, onUpgrade, showToast }) {
  const [name, setName] = useState("StreamHub User");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const totalReviews = Object.values(reviews).flat().filter(r => r.user === "You").length;
  const totalRatings = Object.keys(userRatings).length;
  const avatarLetter = name.trim()[0]?.toUpperCase() || "U";
  const myServices = SERVICES.filter(s => userSubs.includes(s.id));
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)", animation:"fadeIn .2s" }}>
      <div onClick={e=>e.stopPropagation()} className="fadeUp" style={{ background:"var(--surface)", borderRadius:22, width:"100%", maxWidth:500, border:"1px solid var(--border)", boxShadow:"0 40px 80px rgba(0,0,0,.8)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg, rgba(124,58,237,.3), rgba(245,197,24,.1))", padding:"28px 28px 24px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(0,0,0,.4)", border:"none", borderRadius:10, color:"#fff", width:32, height:32, fontSize:16 }}>✕</button>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--purple)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-head)", fontWeight:800, fontSize:26, border:"3px solid rgba(245,197,24,.4)" }}>{avatarLetter}</div>
            <div>
              {editing ? (
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input value={draft} onChange={e=>setDraft(e.target.value)} autoFocus style={{ background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.2)", borderRadius:8, color:"#fff", padding:"6px 10px", fontSize:15, fontFamily:"var(--font-head)", fontWeight:700, outline:"none", width:180 }} />
                  <button onClick={()=>{setName(draft);setEditing(false);showToast("Name updated!");}} style={{ background:"var(--gold)", border:"none", borderRadius:8, color:"#000", padding:"6px 12px", fontWeight:700, fontSize:12 }}>Save</button>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:18 }}>{name}</div>
                  <button onClick={()=>{setDraft(name);setEditing(true);}} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:6, color:"var(--muted)", padding:"3px 8px", fontSize:11 }}>✏️ Edit</button>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
                {tier === "premium" ? <span style={{ background:"var(--gold)", color:"#000", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:99, fontFamily:"var(--font-head)" }}>✦ PREMIUM</span>
                  : <span style={{ background:"rgba(255,255,255,.1)", color:"var(--muted)", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99 }}>FREE</span>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding:"20px 28px 28px", display:"flex", flexDirection:"column", gap:20 }}>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[["♥", watchlist.length, "Watchlist"],["★", totalRatings, "Rated"],["✍", totalReviews, "Reviews"]].map(([icon,val,label])=>(
              <div key={label} style={{ background:"rgba(255,255,255,.04)", borderRadius:12, padding:"14px 10px", textAlign:"center", border:"1px solid var(--border)" }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:22, color:"var(--gold)" }}>{val}</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
          {/* My Subscriptions */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:1.2, fontFamily:"var(--font-head)" }}>MY SUBSCRIPTIONS</div>
              <button onClick={onEditSubs} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, color:"var(--muted)", padding:"4px 12px", fontSize:12, fontWeight:600 }}>Edit</button>
            </div>
            {myServices.length === 0 ? (
              <div style={{ fontSize:13, color:"var(--muted)", padding:"12px 0" }}>No services selected. <button onClick={onEditSubs} style={{ background:"none", border:"none", color:"var(--gold)", fontSize:13, fontWeight:700, padding:0 }}>Add some →</button></div>
            ) : (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {myServices.map(s=>(
                  <span key={s.id} style={{ background:`${s.color}20`, border:`1px solid ${s.color}44`, borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ background:s.color, borderRadius:4, width:16, height:16, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800 }}>{s.logo}</span>
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Upgrade CTA */}
          {tier !== "premium" && (
            <button onClick={()=>{onUpgrade();onClose();}} style={{ width:"100%", background:"linear-gradient(135deg,var(--gold),#f59e0b)", border:"none", borderRadius:12, color:"#000", padding:"12px 0", fontFamily:"var(--font-head)", fontWeight:800, fontSize:15 }}>Upgrade to Premium ✦</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── USE IS MOBILE ────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
function MobileBottomNav({ view, setView, watchlist, onProfile }) {
  const tabs = [
    { id:"home",      icon:"🎬", label:"Home" },
    { id:"discover",  icon:"🔥", label:"Discover" },
    { id:"watchlist", icon:"♥",  label:"Watchlist" },
    { id:"profile",   icon:"👤", label:"Profile" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"rgba(7,7,14,.97)", borderTop:"1px solid var(--border)", display:"flex", backdropFilter:"blur(20px)", paddingBottom:"env(safe-area-inset-bottom)" }}>
      {tabs.map(t => {
        const active = t.id === "profile" ? false : view === t.id;
        const count = t.id === "watchlist" && watchlist.length > 0 ? watchlist.length : 0;
        return (
          <button key={t.id} onClick={() => t.id === "profile" ? onProfile() : setView(t.id)}
            style={{ flex:1, background:"none", border:"none", padding:"10px 0 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color: active ? "var(--gold)" : "var(--muted)", transition:"color .2s", position:"relative" }}>
            <span style={{ fontSize:20, lineHeight:1 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, fontFamily:"var(--font-head)" }}>{t.label}</span>
            {count > 0 && <span style={{ position:"absolute", top:6, left:"50%", marginLeft:4, background:"var(--gold)", color:"#000", borderRadius:99, minWidth:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{count}</span>}
            {active && <span style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:28, height:2, background:"var(--gold)", borderRadius:99 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── MOBILE HEADER ────────────────────────────────────────────────────────────
function MobileHeader({ tier, onUpgrade, search, setSearch }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(7,7,14,.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"0 14px", height:56, gap:10 }}>
        <Logo size={24} />
        <div style={{ flex:1 }} />
        <button onClick={() => setSearchOpen(s => !s)} style={{ background:"rgba(255,255,255,.07)", border:"none", borderRadius:10, width:36, height:36, fontSize:16, color:"var(--text)", display:"flex", alignItems:"center", justifyContent:"center" }}>🔍</button>
        {tier === "premium"
          ? <span style={{ background:"var(--gold)", color:"#000", fontSize:9, fontWeight:800, padding:"3px 8px", borderRadius:99, fontFamily:"var(--font-head)" }}>✦ PRO</span>
          : <button onClick={onUpgrade} style={{ background:"var(--gold)", border:"none", borderRadius:9, color:"#000", padding:"7px 12px", fontFamily:"var(--font-head)", fontWeight:800, fontSize:12 }}>Upgrade ✦</button>
        }
      </div>
      {searchOpen && (
        <div style={{ padding:"0 14px 12px", animation:"slideDown .2s ease" }}>
          <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search movies, anime, sports…"
            style={{ width:"100%", background:"rgba(255,255,255,.08)", border:"1px solid var(--border)", borderRadius:12, color:"var(--text)", padding:"10px 16px", fontSize:15, outline:"none" }} />
        </div>
      )}
    </div>
  );
}

// ─── MOBILE SERVICE CHIPS ─────────────────────────────────────────────────────
function MobileServiceChips({ userSubs, filterPlat, setFilterPlat }) {
  return (
    <div style={{ overflowX:"auto", padding:"12px 14px", display:"flex", gap:8, scrollbarWidth:"none" }}>
      <button onClick={() => setFilterPlat(null)} style={{ background: !filterPlat ? "var(--gold)" : "rgba(255,255,255,.06)", border:`1px solid ${!filterPlat ? "var(--gold)" : "var(--border)"}`, borderRadius:99, color: !filterPlat ? "#000" : "var(--muted)", padding:"6px 16px", fontSize:12, fontWeight:700, whiteSpace:"nowrap", fontFamily:"var(--font-head)" }}>All</button>
      {SERVICES.map(s => {
        const active = filterPlat === s.id;
        const isSub = userSubs.includes(s.id);
        return (
          <button key={s.id} onClick={() => setFilterPlat(active ? null : s.id)} style={{ background: active ? `${s.color}30` : "rgba(255,255,255,.04)", border:`1px solid ${active ? s.color : "rgba(255,255,255,.08)"}`, borderRadius:99, color: active ? "#fff" : isSub ? "var(--text)" : "var(--muted)", padding:"6px 14px", fontSize:12, fontWeight:600, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6, opacity: isSub ? 1 : 0.6 }}>
            <span style={{ background: active ? s.color : "rgba(255,255,255,.1)", borderRadius:4, width:16, height:16, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:"#fff" }}>{s.logo}</span>
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── MOBILE CATEGORY TABS ─────────────────────────────────────────────────────
function MobileCategoryTabs({ category, setCategory }) {
  return (
    <div style={{ overflowX:"auto", padding:"0 14px 12px", display:"flex", gap:8, scrollbarWidth:"none" }}>
      {CATEGORY_TABS.map(tab => {
        const active = category === tab.id;
        return (
          <button key={tab.id} onClick={() => setCategory(tab.id)} style={{ background: active ? `${tab.color}18` : "rgba(255,255,255,.04)", border:`1px solid ${active ? `${tab.color}55` : "var(--border)"}`, borderRadius:20, color: active ? tab.color : "var(--muted)", padding:"7px 14px", fontSize:12, fontWeight:700, fontFamily:"var(--font-head)", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── MOBILE DEALS SHEET ───────────────────────────────────────────────────────
function MobileDealsSheet({ userSubs, tier, onClose }) {
  const unsubbed = SERVICES.filter(s => !userSubs.includes(s.id) && s.deal);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:300, display:"flex", alignItems:"flex-end" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", background:"var(--surface)", borderRadius:"20px 20px 0 0", padding:"20px 16px 40px", maxHeight:"80vh", overflowY:"auto", animation:"slideUp .3s cubic-bezier(.22,1,.36,1)" }}>
        <div style={{ width:36, height:4, background:"rgba(255,255,255,.15)", borderRadius:99, margin:"0 auto 20px" }} />
        <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:18, marginBottom:16 }}>🔥 Current Deals</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {unsubbed.length === 0
            ? <div style={{ color:"var(--muted)", textAlign:"center", padding:"24px 0" }}>You're subscribed to all services!</div>
            : unsubbed.map(s => (
              <div key={s.id} style={{ background:"rgba(245,197,24,.06)", border:"1px solid rgba(245,197,24,.2)", borderRadius:14, padding:16, display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ background:s.color, borderRadius:10, width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>{s.logo}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{s.name}</div>
                  <div style={{ fontSize:13, color:"var(--gold)", fontWeight:600 }}>{s.deal}</div>
                </div>
                <button style={{ background:"var(--gold)", border:"none", borderRadius:10, color:"#000", padding:"8px 14px", fontWeight:800, fontSize:12, flexShrink:0 }}>Get →</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── MOBILE AI PANEL ──────────────────────────────────────────────────────────
function MobileAIBanner({ tier, watchlist, onUpgrade }) {
  const [open, setOpen] = useState(false);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const getAI = async () => {
    if (tier !== "premium") return onUpgrade();
    setLoading(true);
    try {
      const wlMovies = MOVIES.filter(m => watchlist.includes(m.id));
      const prompt = `Recommend 3 streaming titles for someone who likes: ${wlMovies.map(m=>m.title).join(", ")||"popular titles"}. Return ONLY JSON: {"recs":[{"title":"...","year":2024,"reason":"short reason","platform":"netflix"}]}. Platform: netflix|disney|max|hulu|prime|apple|peacock|paramount|crunchyroll|espnplus|dazn|fubo.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:prompt}]}) });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed = JSON.parse(txt.replace(/```json|```/g,"").trim());
      setRecs(parsed.recs||[]);
    } catch { setRecs([{title:"Severance",year:2023,reason:"Mind-bending thriller",platform:"apple"},{title:"The Bear",year:2023,reason:"Intense drama",platform:"hulu"},{title:"Andor",year:2022,reason:"Best Star Wars in years",platform:"disney"}]); }
    setLoading(false); setOpen(true);
  };
  return (
    <div style={{ margin:"0 14px 14px", background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(6,182,212,.08))", border:"1px solid rgba(124,58,237,.3)", borderRadius:14, overflow:"hidden" }}>
      <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:18 }}>✨</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:14 }}>AI Picks</div>
          <div style={{ fontSize:11, color:"var(--muted)" }}>{tier==="premium" ? "Personalized for you" : "Premium feature"}</div>
        </div>
        <button onClick={getAI} disabled={loading} style={{ background:tier==="premium"?"var(--purple)":"var(--gold)", border:"none", borderRadius:9, color:tier==="premium"?"#fff":"#000", padding:"7px 14px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
          {loading ? <span style={{ display:"inline-block", width:12, height:12, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }} /> : "✦"}
          {tier!=="premium" ? "Unlock" : "Get Picks"}
        </button>
      </div>
      {open && recs.length > 0 && (
        <div style={{ borderTop:"1px solid rgba(124,58,237,.2)", padding:"10px 14px 14px", display:"flex", flexDirection:"column", gap:8 }}>
          {recs.map((r,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,${GR[i][0]},${GR[i][1]})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-head)", fontWeight:800, fontSize:11 }}>{r.title.slice(0,2)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:12 }}>{r.title} <span style={{ color:"var(--muted)", fontWeight:400 }}>({r.year})</span></div>
                <div style={{ fontSize:11, color:"var(--muted)" }}>{r.reason}</div>
              </div>
              <ServiceBadge platformId={r.platform} small />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MOBILE LAYOUT ────────────────────────────────────────────────────────────
function MobileLayout({ view, setView, category, setCategory, search, setSearch, filtered, ratings, watchlist, userRatings, userSubs, filterPlat, setFilterPlat, tier, onUpgrade, onSelect, onToggleWatchlist, showToast, reviews, myVotes, onProfile }) {
  const [showDeals, setShowDeals] = useState(false);
  const unsubDeals = SERVICES.filter(s => !userSubs.includes(s.id) && s.deal).length;

  const sectionTitle = { home:"🎬 All Titles", discover:"🔥 Top Rated", watchlist:"♥ Watchlist" }[view];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", paddingBottom:80 }}>
      <MobileHeader tier={tier} onUpgrade={onUpgrade} search={search} setSearch={setSearch} />

      {/* Service chips */}
      <MobileServiceChips userSubs={userSubs} filterPlat={filterPlat} setFilterPlat={setFilterPlat} />

      {/* Category tabs */}
      <MobileCategoryTabs category={category} setCategory={setCategory} />

      {/* AI Banner */}
      <MobileAIBanner tier={tier} watchlist={watchlist} onUpgrade={onUpgrade} />

      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px 12px" }}>
        <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:17 }}>
          {sectionTitle}
          <span style={{ fontWeight:400, fontSize:13, color:"var(--muted)", marginLeft:8 }}>{filtered.length}</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {unsubDeals > 0 && (
            <button onClick={() => setShowDeals(true)} style={{ background:"rgba(245,197,24,.12)", border:"1px solid rgba(245,197,24,.3)", borderRadius:10, color:"var(--gold)", padding:"6px 12px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
              🔥 Deals <span style={{ background:"var(--gold)", color:"#000", borderRadius:99, width:16, height:16, fontSize:9, fontWeight:800, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{unsubDeals}</span>
            </button>
          )}
        </div>
      </div>

      {/* Movie Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", color:"var(--muted)", padding:"60px 20px", fontSize:15 }}>
          {view==="watchlist" ? "Your watchlist is empty. Tap ♡ on any title!" : "No titles found."}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, padding:"0 14px" }}>
          {filtered.map(m => (
            <MovieCard key={m.id} movie={m} ratings={ratings} watchlist={watchlist} userRatings={userRatings} userSubs={userSubs} onSelect={onSelect} onToggleWatchlist={onToggleWatchlist} />
          ))}
        </div>
      )}

      {/* Bottom Nav */}
      <MobileBottomNav view={view} setView={setView} watchlist={watchlist} onProfile={onProfile} />

      {/* Deals Sheet */}
      {showDeals && <MobileDealsSheet userSubs={userSubs} tier={tier} onClose={() => setShowDeals(false)} />}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function StreamHub() {
  const isMobile = useIsMobile();
  const [view, setView] = useState("home"); // home | watchlist | discover
  const [category, setCategory] = useState("all");
  const [userSubs, setUserSubs] = useState(["netflix","disney","max"]);
  const [showSetup, setShowSetup] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlat, setFilterPlat] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [watchlist, setWatchlist] = useState([1,3,5,8]);
  const [ratings, setRatings] = useState(INIT_RATINGS);
  const [userRatings, setUserRatings] = useState({});
  const [reviews, setReviews] = useState(INIT_REVIEWS);
  const [myVotes, setMyVotes] = useState({});
  const [tier, setTier] = useState("free"); // free | premium
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = msg => setToast(msg);

  const toggleWatchlist = id => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
    showToast(watchlist.includes(id) ? "Removed from watchlist" : "Added to watchlist ♥");
  };

  const handleRate = (movieId, val) => {
    const old = userRatings[movieId];
    setUserRatings(p => ({...p, [movieId]: val}));
    setRatings(p => {
      const r = p[movieId] || {avg:val,count:0};
      if (old) { const newAvg = ((r.avg * r.count) - old + val) / r.count; return {...p, [movieId]:{avg:newAvg, count:r.count}}; }
      const newAvg = (r.avg * r.count + val) / (r.count + 1);
      return {...p, [movieId]:{avg:newAvg, count:r.count+1}};
    });
    showToast(`Rated ${val}/10 ★`);
  };

  const handleAddReview = (movieId, data) => {
    const newRev = { id:`r${Date.now()}`, movieId, user:"You", avatar:"Y", title:data.title, content:data.content, rating:data.rating, helpful:0, unhelpful:0, ts:Date.now() };
    setReviews(p => ({...p, [movieId]: [newRev, ...(p[movieId]||[])]}));
    showToast("Review posted! ✍");
  };

  const handleEditReview = (revId, rating, title, content) => {
    setReviews(p => {
      const updated = {};
      for (const [k,v] of Object.entries(p)) { updated[k] = v.map(r => r.id===revId ? {...r,rating,title,content} : r); }
      return updated;
    });
    showToast("Review updated!");
  };

  const handleDeleteReview = revId => {
    setReviews(p => {
      const updated = {};
      for (const [k,v] of Object.entries(p)) { updated[k] = v.filter(r => r.id!==revId); }
      return updated;
    });
    showToast("Review deleted");
  };

  const handleVote = (revId, dir) => {
    if (myVotes[revId]) return;
    setMyVotes(p => ({...p, [revId]: dir}));
    showToast(dir==="up" ? "Marked helpful 👍" : "Noted 👎");
  };

  // Filtered movies
  const allMovies = view === "watchlist" ? MOVIES.filter(m=>watchlist.includes(m.id)) : view === "discover" ? [...MOVIES].sort((a,b)=>(ratings[b.id]?.avg||0)-(ratings[a.id]?.avg||0)) : MOVIES;
  const filtered = allMovies.filter(m => {
    const q = search.toLowerCase();
    const matchQ = !q || m.title.toLowerCase().includes(q) || m.genre.some(g=>g.toLowerCase().includes(q));
    const matchP = !filterPlat || m.platform === filterPlat;
    const matchC = category === "all" || m.category === category;
    return matchQ && matchP && matchC;
  });
  const subscribed = SERVICES.filter(s => userSubs.includes(s.id));
  const unsubscribed = SERVICES.filter(s => !userSubs.includes(s.id));

  // ── MOBILE RENDER ──
  if (isMobile) return (
    <>
      <GlobalStyles />
      <MobileLayout
        view={view} setView={setView}
        category={category} setCategory={setCategory}
        search={search} setSearch={setSearch}
        filtered={filtered}
        ratings={ratings} watchlist={watchlist}
        userRatings={userRatings} userSubs={userSubs}
        filterPlat={filterPlat} setFilterPlat={setFilterPlat}
        tier={tier} onUpgrade={() => setShowUpgrade(true)}
        onSelect={setSelectedMovie}
        onToggleWatchlist={toggleWatchlist}
        showToast={showToast}
        reviews={reviews} myVotes={myVotes}
        onProfile={() => setShowProfile(true)}
      />
      {selectedMovie && <MovieModal movie={selectedMovie} ratings={ratings} reviews={reviews} userRatings={userRatings} watchlist={watchlist} myVotes={myVotes} onClose={() => setSelectedMovie(null)} onRate={handleRate} onAddReview={handleAddReview} onEditReview={handleEditReview} onDeleteReview={handleDeleteReview} onVote={handleVote} onToggleWatchlist={toggleWatchlist} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onComplete={() => setTier("premium")} />}
      {showSetup && <SetupModal userSubs={userSubs} onSave={setUserSubs} onClose={() => setShowSetup(false)} isFirst={true} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} userSubs={userSubs} tier={tier} watchlist={watchlist} reviews={reviews} userRatings={userRatings} onEditSubs={() => { setShowProfile(false); setShowSetup(true); }} onUpgrade={() => setShowUpgrade(true)} showToast={showToast} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"var(--font-body)" }}>

        {/* ── HEADER ── */}
        <header className="header-inner" style={{ position:"sticky", top:0, zIndex:100, background:"rgba(7,7,14,.85)", backdropFilter:"blur(16px)", borderBottom:"1px solid var(--border)", padding:"0 24px", height:64, display:"flex", alignItems:"center", gap:16 }}>
          <Logo size={28} />
          <nav className="header-nav" style={{ display:"flex", gap:4, marginLeft:16 }}>
            {[["home","Home"],["discover","Discover"],["watchlist","Watchlist"]].map(([v,l]) => (
              <button key={v} onClick={()=>setView(v)} style={{ background: view===v ? "rgba(245,197,24,.12)" : "none", border:"none", color: view===v ? "var(--gold)" : "var(--muted)", fontFamily:"var(--font-head)", fontWeight:600, fontSize:14, padding:"6px 14px", borderRadius:9, transition:"all .2s" }}>{l}{v==="watchlist" && watchlist.length > 0 && <span style={{ marginLeft:6, background:"var(--gold)", color:"#000", borderRadius:99, width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800 }}>{watchlist.length}</span>}</button>
            ))}
          </nav>
          {/* Search */}
          <div className="header-search" style={{ flex:1, maxWidth:360, position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)", fontSize:15 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search movies, anime, sports…" style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid var(--border)", borderRadius:11, color:"var(--text)", padding:"9px 14px 9px 36px", fontSize:14, outline:"none" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:"auto" }}>
            {tier === "premium" ? (
              <span style={{ background:"var(--gold)", color:"#000", fontSize:11, fontWeight:800, padding:"4px 10px", borderRadius:99, fontFamily:"var(--font-head)" }}>✦ PREMIUM</span>
            ) : (
              <button onClick={()=>setShowUpgrade(true)} style={{ background:"linear-gradient(135deg,var(--gold),#f59e0b)", border:"none", borderRadius:10, color:"#000", padding:"7px 16px", fontFamily:"var(--font-head)", fontWeight:800, fontSize:13 }}>Upgrade ✦</button>
            )}
            <div onClick={()=>setShowProfile(true)} style={{ width:36, height:36, borderRadius:"50%", background:"var(--purple)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-head)", fontWeight:700, fontSize:14, cursor:"pointer", border:"2px solid transparent", transition:"border-color .2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}
              title="My Profile">U</div>
          </div>
        </header>

        <div className="layout-wrap" style={{ display:"flex", padding:"20px 24px", gap:20, maxWidth:1440, margin:"0 auto" }}>

          {/* ── LEFT SIDEBAR ── */}
          <aside className="sidebar-left" style={{ width:168, flexShrink:0 }}>
            {/* Subscribed */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:1.2, marginBottom:10, fontFamily:"var(--font-head)" }}>MY SERVICES</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {subscribed.map(s => (
                  <button key={s.id} onClick={()=>setFilterPlat(filterPlat===s.id?null:s.id)} style={{ background: filterPlat===s.id ? `${s.color}22` : "rgba(255,255,255,.04)", border: filterPlat===s.id ? `1px solid ${s.color}66` : "1px solid var(--border)", borderRadius:10, color:"var(--text)", padding:"8px 12px", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, transition:"all .2s", cursor:"pointer" }}>
                    <span style={{ background:s.color, borderRadius:5, width:20, height:20, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#fff", flexShrink:0 }}>{s.logo}</span>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Unsubscribed */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:1.2, marginBottom:10, fontFamily:"var(--font-head)" }}>AVAILABLE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {unsubscribed.map(s => (
                  <button key={s.id} onClick={()=>setFilterPlat(filterPlat===s.id?null:s.id)} style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${filterPlat===s.id ? `${s.color}44` : "rgba(255,255,255,.05)"}`, borderRadius:10, color:"var(--muted)", padding:"7px 12px", fontSize:12, display:"flex", alignItems:"center", gap:8, cursor:"pointer", opacity:.65, transition:"opacity .2s" }}>
                    <span style={{ background:"rgba(255,255,255,.1)", borderRadius:5, width:20, height:20, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, flexShrink:0 }}>{s.logo}</span>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Filter clear */}
            {filterPlat && (
              <button onClick={()=>setFilterPlat(null)} style={{ marginTop:12, width:"100%", background:"none", border:"1px solid var(--border)", borderRadius:9, color:"var(--muted)", padding:"6px 0", fontSize:12 }}>Clear filter ✕</button>
            )}
          </aside>

          {/* ── MAIN ── */}
          <main className="main-content" style={{ flex:1, minWidth:0 }}>
            {/* AI Panel */}
            <div className="ai-panel">
            <AIRecsPanel tier={tier} watchlist={watchlist} onUpgrade={()=>setShowUpgrade(true)} />
            </div>

            {/* ── CATEGORY TABS ── */}
            <div className="cat-tabs" style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
              {CATEGORY_TABS.map(tab => {
                const active = category === tab.id;
                const count = tab.id === "all" ? MOVIES.length : MOVIES.filter(m => m.category === tab.id).length;
                return (
                  <button key={tab.id} onClick={() => setCategory(tab.id)} style={{
                    background: active ? `${tab.color}18` : "rgba(255,255,255,.04)",
                    border: `1px solid ${active ? `${tab.color}55` : "var(--border)"}`,
                    borderRadius:20, color: active ? tab.color : "var(--muted)",
                    padding:"7px 16px", fontSize:13, fontWeight:700, fontFamily:"var(--font-head)",
                    transition:"all .2s", display:"flex", alignItems:"center", gap:6,
                  }}>
                    <span>{tab.icon}</span>
                    {tab.label}
                    <span style={{ background: active ? `${tab.color}25` : "rgba(255,255,255,.08)", borderRadius:99, padding:"1px 7px", fontSize:11, fontWeight:800 }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Section header */}
            <div className="section-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:18 }}>
                {view==="home" && "🎬 All Titles"}
                {view==="discover" && "🔥 Top Rated"}
                {view==="watchlist" && "♥ Your Watchlist"}
                {filtered.length > 0 && <span style={{ fontWeight:400, fontSize:14, color:"var(--muted)", marginLeft:10 }}>{filtered.length} titles</span>}
              </div>
              {view==="watchlist" && watchlist.length > 0 && (
                <button onClick={()=>setShowShare(true)} style={{ background:"var(--purple)", border:"none", borderRadius:10, color:"#fff", padding:"7px 16px", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                  🔗 Share Watchlist
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", color:"var(--muted)", padding:"60px 0", fontSize:15 }}>
                {view==="watchlist" ? "Your watchlist is empty. Click ♡ on any title to add it!" : "No titles found. Try a different search or filter."}
              </div>
            ) : (
              <div className="movie-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:14 }}>
                {filtered.map(m => (
                  <MovieCard
                    key={m.id}
                    movie={m}
                    ratings={ratings}
                    watchlist={watchlist}
                    userRatings={userRatings}
                    userSubs={userSubs}
                    onSelect={setSelectedMovie}
                    onToggleWatchlist={toggleWatchlist}
                  />
                ))}
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="sidebar-right" style={{ width:220, flexShrink:0 }}>
            {/* Deals */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--gold)", letterSpacing:1.2, marginBottom:12, fontFamily:"var(--font-head)" }}>🔥 DEALS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {unsubscribed.filter(s=>s.deal).map(s => (
                  <div key={s.id} style={{ background:"rgba(245,197,24,.06)", border:"1px solid rgba(245,197,24,.2)", borderRadius:"var(--radius)", padding:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ background:s.color, borderRadius:5, width:22, height:22, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#fff" }}>{s.logo}</span>
                      <span style={{ fontWeight:700, fontSize:13 }}>{s.name}</span>
                    </div>
                    <div style={{ fontSize:11, color:"var(--gold)", fontWeight:600, marginBottom:8 }}>{s.deal}</div>
                    <button style={{ width:"100%", background:"var(--gold)", border:"none", borderRadius:8, color:"#000", padding:"6px 0", fontSize:11, fontWeight:800 }}>Get Deal →</button>
                  </div>
                ))}
              </div>
            </div>
            {/* Ad (free tier only) */}
            {tier === "free" && <AdBanner />}
            {/* Trending */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:1.2, marginBottom:12, fontFamily:"var(--font-head)" }}>📈 TRENDING</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {MOVIES.slice().sort((a,b)=>(ratings[b.id]?.count||0)-(ratings[a.id]?.count||0)).slice(0,5).map((m,i) => {
                  const rt = ratings[m.id] || {avg:0};
                  return (
                    <div key={m.id} onClick={()=>setSelectedMovie(m)} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"6px 8px", borderRadius:9, transition:"background .2s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      <span style={{ fontFamily:"var(--font-head)", fontWeight:800, color:"var(--muted)", fontSize:13, width:16 }}>{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.title}</div>
                        <div style={{ fontSize:11, color:"var(--gold)" }}>★ {rt.avg.toFixed(1)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── MODALS ── */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          ratings={ratings}
          reviews={reviews}
          userRatings={userRatings}
          watchlist={watchlist}
          myVotes={myVotes}
          onClose={() => setSelectedMovie(null)}
          onRate={handleRate}
          onAddReview={handleAddReview}
          onEditReview={handleEditReview}
          onDeleteReview={handleDeleteReview}
          onVote={handleVote}
          onToggleWatchlist={toggleWatchlist}
        />
      )}
      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onComplete={()=>setTier("premium")} />}
      {showShare && <ShareModal watchlist={watchlist} onClose={()=>setShowShare(false)} showToast={showToast} />}
      {showSetup && <SetupModal userSubs={userSubs} onSave={setUserSubs} onClose={()=>setShowSetup(false)} isFirst={true} />}
      {showProfile && <ProfileModal onClose={()=>setShowProfile(false)} userSubs={userSubs} tier={tier} watchlist={watchlist} reviews={reviews} userRatings={userRatings} onEditSubs={()=>{setShowProfile(false);setShowSetup(true);}} onUpgrade={()=>setShowUpgrade(true)} showToast={showToast} />}
      {toast && <Toast msg={toast} onDone={()=>setToast(null)} />}
    </>
  );
}
