const ESPN_SPORT_MAP = {
  "nfl":            { path:"football/nfl",             display:"NFL",                  icon:"🏈" },
  "nba":            { path:"basketball/nba",           display:"NBA",                  icon:"🏀" },
  "mlb":            { path:"baseball/mlb",             display:"MLB",                  icon:"⚾" },
  "nhl":            { path:"hockey/nhl",               display:"NHL",                  icon:"🏒" },
  "soccer":         { path:"soccer/eng.1",             display:"Premier League",        icon:"⚽" },
  "world cup":      { path:"soccer/fifa.world",        display:"FIFA World Cup 2026",   icon:"🏆" },
  "fifa":           { path:"soccer/fifa.world",        display:"FIFA World Cup 2026",   icon:"🏆" },
  "ufc":            { path:"mma/ufc",                  display:"UFC",                  icon:"🥊" },
  "mma":            { path:"mma/ufc",                  display:"UFC",                  icon:"🥊" },
  "formula":        { path:"racing/f1",                display:"Formula 1",            icon:"🏎️" },
  "college":        { path:"football/college-football",display:"College Football",      icon:"🏈" },
  "ncaa":           { path:"football/college-football",display:"College Football",      icon:"🏈" },
  // ── Soccer leagues by ID ───
  "eng.1":          { path:"soccer/eng.1",          display:"Premier League",     icon:"⚽" },
  "esp.1":          { path:"soccer/esp.1",          display:"La Liga",            icon:"⚽" },
  "ger.1":          { path:"soccer/ger.1",          display:"Bundesliga",         icon:"⚽" },
  "ita.1":          { path:"soccer/ita.1",          display:"Serie A",            icon:"⚽" },
  "fra.1":          { path:"soccer/fra.1",          display:"Ligue 1",            icon:"⚽" },
  "uefa.champions": { path:"soccer/uefa.champions", display:"Champions League",   icon:"🏆" },
  "uefa.europa":    { path:"soccer/uefa.europa",    display:"Europa League",      icon:"🇪🇺" },
  "usa.1":          { path:"soccer/usa.1",          display:"MLS",                icon:"⚽" },
  "mex.1":          { path:"soccer/mex.1",          display:"Liga MX",            icon:"⚽" },
  "ned.1":          { path:"soccer/ned.1",          display:"Eredivisie",         icon:"⚽" },
  "por.1":          { path:"soccer/por.1",          display:"Primeira Liga",      icon:"⚽" },
  "sco.1":          { path:"soccer/sco.1",          display:"Scottish Prem",      icon:"⚽" },
  "bra.1":          { path:"soccer/bra.1",          display:"Brasileirão",        icon:"⚽" },
  "arg.1":          { path:"soccer/arg.1",          display:"Liga Argentina",     icon:"⚽" },
  "eng.2":          { path:"soccer/eng.2",          display:"Championship",       icon:"⚽" },
  "tur.1":          { path:"soccer/tur.1",          display:"Süper Lig",          icon:"⚽" },
};

function getEspnSport(query) {
  const q = (query||"").toLowerCase();
  // Check longer keys first to avoid "soccer" matching before "world cup soccer"
  const sorted = Object.entries(ESPN_SPORT_MAP).sort((a,b)=>b[0].length-a[0].length);
  for (const [key, val] of sorted) {
    if (q.includes(key)) return val;
  }
  return null;
}

// ─── WORLD CUP 2026 TEAMS ────────────────────────────────────────────────────
const WC_TEAMS = [
  {name:"United States",   flag:"🇺🇸", conf:"CONCACAF"},
  {name:"Mexico",          flag:"🇲🇽", conf:"CONCACAF"},
  {name:"Canada",          flag:"🇨🇦", conf:"CONCACAF"},
  {name:"Brazil",          flag:"🇧🇷", conf:"CONMEBOL"},
  {name:"Argentina",       flag:"🇦🇷", conf:"CONMEBOL"},
  {name:"France",          flag:"🇫🇷", conf:"UEFA"},
  {name:"England",         flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf:"UEFA"},
  {name:"Germany",         flag:"🇩🇪", conf:"UEFA"},
  {name:"Spain",           flag:"🇪🇸", conf:"UEFA"},
  {name:"Portugal",        flag:"🇵🇹", conf:"UEFA"},
  {name:"Netherlands",     flag:"🇳🇱", conf:"UEFA"},
  {name:"Italy",           flag:"🇮🇹", conf:"UEFA"},
  {name:"Belgium",         flag:"🇧🇪", conf:"UEFA"},
  {name:"Croatia",         flag:"🇭🇷", conf:"UEFA"},
  {name:"Switzerland",     flag:"🇨🇭", conf:"UEFA"},
  {name:"Denmark",         flag:"🇩🇰", conf:"UEFA"},
  {name:"Austria",         flag:"🇦🇹", conf:"UEFA"},
  {name:"Poland",          flag:"🇵🇱", conf:"UEFA"},
  {name:"Serbia",          flag:"🇷🇸", conf:"UEFA"},
  {name:"Turkey",          flag:"🇹🇷", conf:"UEFA"},
  {name:"Scotland",        flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf:"UEFA"},
  {name:"Ukraine",         flag:"🇺🇦", conf:"UEFA"},
  {name:"Morocco",         flag:"🇲🇦", conf:"CAF"},
  {name:"Senegal",         flag:"🇸🇳", conf:"CAF"},
  {name:"Egypt",           flag:"🇪🇬", conf:"CAF"},
  {name:"Nigeria",         flag:"🇳🇬", conf:"CAF"},
  {name:"South Africa",    flag:"🇿🇦", conf:"CAF"},
  {name:"Cameroon",        flag:"🇨🇲", conf:"CAF"},
  {name:"Japan",           flag:"🇯🇵", conf:"AFC"},
  {name:"South Korea",     flag:"🇰🇷", conf:"AFC"},
  {name:"Australia",       flag:"🇦🇺", conf:"AFC"},
  {name:"Iran",            flag:"🇮🇷", conf:"AFC"},
  {name:"Saudi Arabia",    flag:"🇸🇦", conf:"AFC"},
  {name:"Uruguay",         flag:"🇺🇾", conf:"CONMEBOL"},
  {name:"Colombia",        flag:"🇨🇴", conf:"CONMEBOL"},
  {name:"Ecuador",         flag:"🇪🇨", conf:"CONMEBOL"},
  {name:"Chile",           flag:"🇨🇱", conf:"CONMEBOL"},
  {name:"Venezuela",       flag:"🇻🇪", conf:"CONMEBOL"},
  {name:"Peru",            flag:"🇵🇪", conf:"CONMEBOL"},
  {name:"Panama",          flag:"🇵🇦", conf:"CONCACAF"},
  {name:"Costa Rica",      flag:"🇨🇷", conf:"CONCACAF"},
  {name:"Jamaica",         flag:"🇯🇲", conf:"CONCACAF"},
  {name:"Honduras",        flag:"🇭🇳", conf:"CONCACAF"},
  {name:"New Zealand",     flag:"🇳🇿", conf:"OFC"},
  {name:"Qatar",           flag:"🇶🇦", conf:"AFC"},
  {name:"Algeria",         flag:"🇩🇿", conf:"CAF"},
  {name:"Tunisia",         flag:"🇹🇳", conf:"CAF"},
  {name:"Ghana",           flag:"🇬🇭", conf:"CAF"},
];

// ─── FAVORITE TEAMS MODAL ────────────────────────────────────────────────────
// ─── TEAM LOGO DATA ───────────────────────────────────────────────────────────
const TEAM_LOGOS = {
  // NBA
  "Atlanta Hawks":{abbr:"atl",l:"nba"},"Boston Celtics":{abbr:"bos",l:"nba"},"Brooklyn Nets":{abbr:"bkn",l:"nba"},"Charlotte Hornets":{abbr:"cha",l:"nba"},"Chicago Bulls":{abbr:"chi",l:"nba"},"Cleveland Cavaliers":{abbr:"cle",l:"nba"},"Dallas Mavericks":{abbr:"dal",l:"nba"},"Denver Nuggets":{abbr:"den",l:"nba"},"Detroit Pistons":{abbr:"det",l:"nba"},"Golden State Warriors":{abbr:"gs",l:"nba"},"Houston Rockets":{abbr:"hou",l:"nba"},"Indiana Pacers":{abbr:"ind",l:"nba"},"Los Angeles Clippers":{abbr:"lac",l:"nba"},"Los Angeles Lakers":{abbr:"lal",l:"nba"},"Memphis Grizzlies":{abbr:"mem",l:"nba"},"Miami Heat":{abbr:"mia",l:"nba"},"Milwaukee Bucks":{abbr:"mil",l:"nba"},"Minnesota Timberwolves":{abbr:"min",l:"nba"},"New Orleans Pelicans":{abbr:"no",l:"nba"},"New York Knicks":{abbr:"ny",l:"nba"},"Oklahoma City Thunder":{abbr:"okc",l:"nba"},"Orlando Magic":{abbr:"orl",l:"nba"},"Philadelphia 76ers":{abbr:"phi",l:"nba"},"Phoenix Suns":{abbr:"phx",l:"nba"},"Portland Trail Blazers":{abbr:"por",l:"nba"},"Sacramento Kings":{abbr:"sac",l:"nba"},"San Antonio Spurs":{abbr:"sa",l:"nba"},"Toronto Raptors":{abbr:"tor",l:"nba"},"Utah Jazz":{abbr:"utah",l:"nba"},"Washington Wizards":{abbr:"wsh",l:"nba"},
  // NFL
  "Arizona Cardinals":{abbr:"ari",l:"nfl"},"Atlanta Falcons":{abbr:"atl",l:"nfl"},"Baltimore Ravens":{abbr:"bal",l:"nfl"},"Buffalo Bills":{abbr:"buf",l:"nfl"},"Carolina Panthers":{abbr:"car",l:"nfl"},"Chicago Bears":{abbr:"chi",l:"nfl"},"Cincinnati Bengals":{abbr:"cin",l:"nfl"},"Cleveland Browns":{abbr:"cle",l:"nfl"},"Dallas Cowboys":{abbr:"dal",l:"nfl"},"Denver Broncos":{abbr:"den",l:"nfl"},"Detroit Lions":{abbr:"det",l:"nfl"},"Green Bay Packers":{abbr:"gb",l:"nfl"},"Houston Texans":{abbr:"hou",l:"nfl"},"Indianapolis Colts":{abbr:"ind",l:"nfl"},"Jacksonville Jaguars":{abbr:"jax",l:"nfl"},"Kansas City Chiefs":{abbr:"kc",l:"nfl"},"Las Vegas Raiders":{abbr:"lv",l:"nfl"},"Los Angeles Chargers":{abbr:"lac",l:"nfl"},"Los Angeles Rams":{abbr:"lar",l:"nfl"},"Miami Dolphins":{abbr:"mia",l:"nfl"},"Minnesota Vikings":{abbr:"min",l:"nfl"},"New England Patriots":{abbr:"ne",l:"nfl"},"New Orleans Saints":{abbr:"no",l:"nfl"},"New York Giants":{abbr:"nyg",l:"nfl"},"New York Jets":{abbr:"nyj",l:"nfl"},"Philadelphia Eagles":{abbr:"phi",l:"nfl"},"Pittsburgh Steelers":{abbr:"pit",l:"nfl"},"San Francisco 49ers":{abbr:"sf",l:"nfl"},"Seattle Seahawks":{abbr:"sea",l:"nfl"},"Tampa Bay Buccaneers":{abbr:"tb",l:"nfl"},"Tennessee Titans":{abbr:"ten",l:"nfl"},"Washington Commanders":{abbr:"wsh",l:"nfl"},
  // MLB
  "Arizona Diamondbacks":{abbr:"ari",l:"mlb"},"Atlanta Braves":{abbr:"atl",l:"mlb"},"Baltimore Orioles":{abbr:"bal",l:"mlb"},"Boston Red Sox":{abbr:"bos",l:"mlb"},"Chicago Cubs":{abbr:"chc",l:"mlb"},"Chicago White Sox":{abbr:"cws",l:"mlb"},"Cincinnati Reds":{abbr:"cin",l:"mlb"},"Cleveland Guardians":{abbr:"cle",l:"mlb"},"Colorado Rockies":{abbr:"col",l:"mlb"},"Detroit Tigers":{abbr:"det",l:"mlb"},"Houston Astros":{abbr:"hou",l:"mlb"},"Kansas City Royals":{abbr:"kc",l:"mlb"},"Los Angeles Angels":{abbr:"laa",l:"mlb"},"Los Angeles Dodgers":{abbr:"lad",l:"mlb"},"Miami Marlins":{abbr:"mia",l:"mlb"},"Milwaukee Brewers":{abbr:"mil",l:"mlb"},"Minnesota Twins":{abbr:"min",l:"mlb"},"New York Mets":{abbr:"nym",l:"mlb"},"New York Yankees":{abbr:"nyy",l:"mlb"},"Oakland Athletics":{abbr:"oak",l:"mlb"},"Philadelphia Phillies":{abbr:"phi",l:"mlb"},"Pittsburgh Pirates":{abbr:"pit",l:"mlb"},"San Diego Padres":{abbr:"sd",l:"mlb"},"San Francisco Giants":{abbr:"sf",l:"mlb"},"Seattle Mariners":{abbr:"sea",l:"mlb"},"St. Louis Cardinals":{abbr:"stl",l:"mlb"},"Tampa Bay Rays":{abbr:"tb",l:"mlb"},"Texas Rangers":{abbr:"tex",l:"mlb"},"Toronto Blue Jays":{abbr:"tor",l:"mlb"},"Washington Nationals":{abbr:"wsh",l:"mlb"},
  // NHL
  "Anaheim Ducks":{abbr:"ana",l:"nhl"},"Boston Bruins":{abbr:"bos",l:"nhl"},"Buffalo Sabres":{abbr:"buf",l:"nhl"},"Calgary Flames":{abbr:"cgy",l:"nhl"},"Carolina Hurricanes":{abbr:"car",l:"nhl"},"Chicago Blackhawks":{abbr:"chi",l:"nhl"},"Colorado Avalanche":{abbr:"col",l:"nhl"},"Columbus Blue Jackets":{abbr:"cbj",l:"nhl"},"Dallas Stars":{abbr:"dal",l:"nhl"},"Detroit Red Wings":{abbr:"det",l:"nhl"},"Edmonton Oilers":{abbr:"edm",l:"nhl"},"Florida Panthers":{abbr:"fla",l:"nhl"},"Los Angeles Kings":{abbr:"la",l:"nhl"},"Minnesota Wild":{abbr:"min",l:"nhl"},"Montreal Canadiens":{abbr:"mtl",l:"nhl"},"Nashville Predators":{abbr:"nsh",l:"nhl"},"New Jersey Devils":{abbr:"njd",l:"nhl"},"New York Islanders":{abbr:"nyi",l:"nhl"},"New York Rangers":{abbr:"nyr",l:"nhl"},"Ottawa Senators":{abbr:"ott",l:"nhl"},"Philadelphia Flyers":{abbr:"phi",l:"nhl"},"Pittsburgh Penguins":{abbr:"pit",l:"nhl"},"San Jose Sharks":{abbr:"sjs",l:"nhl"},"Seattle Kraken":{abbr:"sea",l:"nhl"},"St. Louis Blues":{abbr:"stl",l:"nhl"},"Tampa Bay Lightning":{abbr:"tb",l:"nhl"},"Toronto Maple Leafs":{abbr:"tor",l:"nhl"},"Utah Hockey Club":{abbr:"utah",l:"nhl"},"Vancouver Canucks":{abbr:"van",l:"nhl"},"Vegas Golden Knights":{abbr:"vgk",l:"nhl"},"Washington Capitals":{abbr:"wsh",l:"nhl"},"Winnipeg Jets":{abbr:"wpg",l:"nhl"},
};

function getTeamLogo(name) {
  const t = TEAM_LOGOS[name];
  if (!t) return null;
  return `https://a.espncdn.com/i/teamlogos/${t.l}/500/${t.abbr}.png`;
}

// ─── ALL-TEAMS LISTS ─────────────────────────────────────────────────────────
const ALL_TEAMS = {
  "NFL": ["Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills","Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns","Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers","Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs","Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins","Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants","New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers","Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders"],
  "NBA": ["Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets","Chicago Bulls","Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets","Detroit Pistons","Golden State Warriors","Houston Rockets","Indiana Pacers","Los Angeles Clippers","Los Angeles Lakers","Memphis Grizzlies","Miami Heat","Milwaukee Bucks","Minnesota Timberwolves","New Orleans Pelicans","New York Knicks","Oklahoma City Thunder","Orlando Magic","Philadelphia 76ers","Phoenix Suns","Portland Trail Blazers","Sacramento Kings","San Antonio Spurs","Toronto Raptors","Utah Jazz","Washington Wizards"],
  "MLB": ["Arizona Diamondbacks","Atlanta Braves","Baltimore Orioles","Boston Red Sox","Chicago Cubs","Chicago White Sox","Cincinnati Reds","Cleveland Guardians","Colorado Rockies","Detroit Tigers","Houston Astros","Kansas City Royals","Los Angeles Angels","Los Angeles Dodgers","Miami Marlins","Milwaukee Brewers","Minnesota Twins","New York Mets","New York Yankees","Oakland Athletics","Philadelphia Phillies","Pittsburgh Pirates","San Diego Padres","San Francisco Giants","Seattle Mariners","St. Louis Cardinals","Tampa Bay Rays","Texas Rangers","Toronto Blue Jays","Washington Nationals"],
  "NHL": ["Anaheim Ducks","Boston Bruins","Buffalo Sabres","Calgary Flames","Carolina Hurricanes","Chicago Blackhawks","Colorado Avalanche","Columbus Blue Jackets","Dallas Stars","Detroit Red Wings","Edmonton Oilers","Florida Panthers","Los Angeles Kings","Minnesota Wild","Montreal Canadiens","Nashville Predators","New Jersey Devils","New York Islanders","New York Rangers","Ottawa Senators","Philadelphia Flyers","Pittsburgh Penguins","San Jose Sharks","Seattle Kraken","St. Louis Blues","Tampa Bay Lightning","Toronto Maple Leafs","Utah Hockey Club","Vancouver Canucks","Vegas Golden Knights","Washington Capitals","Winnipeg Jets"],
  "UFC": ["Ilia Topuria","Jon Jones","Islam Makhachev","Alex Pereira","Leon Edwards","Sean O'Malley","Dricus du Plessis","Merab Dvalishvili","Tom Aspinall","Shavkat Rakhmonov","Conor McGregor","Khamzat Chimaev","Charles Oliveira","Justin Gaethje","Max Holloway","Amanda Nunes","Zhang Weili","Valentina Shevchenko","Alexa Grasso","Julianna Peña"],
  "WWE": ["Cody Rhodes","Roman Reigns","Seth Rollins","CM Punk","Drew McIntyre","Gunther","Sami Zayn","Kevin Owens","Rhea Ripley","Becky Lynch","Charlotte Flair","Bianca Belair","John Cena","Randy Orton","The Rock","Dominik Mysterio","Jey Uso","Damian Priest","Liv Morgan","Nia Jax"],
  "MLS": ["Atlanta United","Austin FC","Charlotte FC","Chicago Fire","FC Cincinnati","Colorado Rapids","Columbus Crew","D.C. United","FC Dallas","Houston Dynamo","Inter Miami CF","LA Galaxy","LAFC","Minnesota United","CF Montréal","Nashville SC","New England Revolution","New York City FC","New York Red Bulls","Orlando City","Philadelphia Union","Portland Timbers","Real Salt Lake","San Jose Earthquakes","Seattle Sounders","Sporting Kansas City","Toronto FC","Vancouver Whitecaps"],
  "LIGA MX": ["Club América","Chivas de Guadalajara","Cruz Azul","Pumas UNAM","Tigres UANL","CF Monterrey","Deportivo Toluca","Necaxa","Santos Laguna","Atlas FC","Mazatlán FC","Querétaro FC","FC Juárez","Club Tijuana","Atlético de San Luis","CF Pachuca","Club León","Club Puebla","Club Necaxa","Atletico San Luis"],
  "PREMIER LEAGUE": ["Arsenal","Aston Villa","Bournemouth","Brentford","Brighton","Chelsea","Crystal Palace","Everton","Fulham","Ipswich Town","Leicester City","Liverpool","Manchester City","Manchester United","Newcastle United","Nottingham Forest","Southampton","Tottenham Hotspur","West Ham United","Wolverhampton"],
  "LA LIGA": ["Athletic Bilbao","Atlético Madrid","Barcelona","Betis","Celta Vigo","Espanyol","Getafe","Girona","Las Palmas","Leganés","Mallorca","Osasuna","Rayo Vallecano","Real Madrid","Real Sociedad","Real Valladolid","Sevilla","Valencia","Villarreal","Alavés"],
  "BUNDESLIGA": ["Augsburg","Bayer Leverkusen","Bayern Munich","Bochum","Borussia Dortmund","Borussia Mönchengladbach","Eintracht Frankfurt","Freiburg","Heidenheim","Hoffenheim","Holstein Kiel","Mainz","RB Leipzig","Stuttgart","Union Berlin","Werder Bremen","Wolfsburg","St. Pauli"],
  "SERIE A": ["AC Milan","Atalanta","Bologna","Cagliari","Como","Empoli","Fiorentina","Genoa","Inter Milan","Juventus","Lazio","Lecce","Monza","Napoli","Parma","Roma","Torino","Udinese","Venezia","Verona"],
  "LIGUE 1": ["Angers","Auxerre","Brest","Lens","Lille","Lyon","Marseille","Monaco","Montpellier","Nantes","Nice","Paris Saint-Germain","Reims","Rennes","Saint-Étienne","Strasbourg","Toulouse"],
};

function getTeamsForSport(sportDisplay, events, espnTeams) {
  if (!sportDisplay) return [];
  const upper = sportDisplay.toUpperCase();

  // Direct key match first
  for (const [key, teams] of Object.entries(ALL_TEAMS)) {
    if (upper.includes(key)) return teams.map(n=>({name:n,flag:"🏅"}));
  }

  // Soccer league name fallbacks
  const soccerMap = {
    "PREMIER LEAGUE": "PREMIER LEAGUE", "LA LIGA": "LA LIGA",
    "BUNDESLIGA": "BUNDESLIGA", "SERIE A": "SERIE A",
    "LIGUE 1": "LIGUE 1", "LIGA MX": "LIGA MX",
  };
  for (const [keyword, key] of Object.entries(soccerMap)) {
    if (upper.includes(keyword) && ALL_TEAMS[key]) {
      return ALL_TEAMS[key].map(n=>({name:n,flag:"⚽"}));
    }
  }

  // ESPN API teams (for other soccer leagues)
  if (espnTeams.length > 0) return espnTeams;

  // World Cup
  if (upper.includes("WORLD CUP")||upper.includes("FIFA")) return WC_TEAMS;

  // Fallback: extract from current schedule
  return [...new Set([...events.map(e=>e.home?.name),...events.map(e=>e.away?.name)])].filter(Boolean).sort().map(n=>({name:n,flag:"🏅"}));
}


const TEAM_SPORT_MAP = [
  {label:"⚽ Soccer / World Cup", path:"soccer/fifa.world", fullTournament:true},
  {label:"⚽ Premier League",     path:"soccer/eng.1"},
  {label:"⚽ La Liga",            path:"soccer/esp.1"},
  {label:"⚽ MLS",                path:"soccer/usa.1"},
  {label:"🏈 NFL",               path:"football/nfl"},
  {label:"🏀 NBA",               path:"basketball/nba"},
  {label:"⚾ MLB",               path:"baseball/mlb"},
  {label:"🏒 NHL",               path:"hockey/nhl"},
  {label:"⚽ Champions League",  path:"soccer/uefa.champions"},
  {label:"🏀 WNBA",             path:"basketball/wnba"},
];

export { ESPN_SPORT_MAP, WC_TEAMS, TEAM_LOGOS, ALL_TEAMS, getEspnSport, getTeamLogo, getTeamsForSport, TEAM_SPORT_MAP };