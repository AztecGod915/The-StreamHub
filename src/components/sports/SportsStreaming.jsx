const SPORTS_STREAM_MAP = {
  "NFL": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Peacock",     url:"https://www.peacocktv.com/",         color:"#000000", icon:"🦚" },
    { name:"Paramount+",  url:"https://www.paramountplus.com/",     color:"#0064FF", icon:"P+" },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "NBA": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Max",         url:"https://www.max.com/",               color:"#002BE7", icon:"M"  },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "MLB": [
    { name:"MLB.TV",      url:"https://www.mlb.tv/",               color:"#002D72", icon:"⚾"  },
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Peacock",     url:"https://www.peacocktv.com/",         color:"#000000", icon:"🦚" },
    { name:"Apple TV+",   url:"https://tv.apple.com/",              color:"#555555", icon:"🍎" },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
  ],
  "NHL": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Max",         url:"https://www.max.com/",               color:"#002BE7", icon:"M"  },
    { name:"Hulu",        url:"https://www.hulu.com/",              color:"#1CE783", icon:"H"  },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
  ],
  "FIFA World Cup 2026": [
    { name:"Fox Sports",  url:"https://www.foxsports.com/",         color:"#003087", icon:"🦊" },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
    { name:"Hulu",        url:"https://www.hulu.com/",              color:"#1CE783", icon:"H"  },
    { name:"Sling TV",    url:"https://www.sling.com/",             color:"#0097D4", icon:"S"  },
  ],
  "Premier League": [
    { name:"Peacock",     url:"https://www.peacocktv.com/",         color:"#000000", icon:"🦚" },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "La Liga": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "Bundesliga": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "Serie A": [
    { name:"Paramount+",  url:"https://www.paramountplus.com/",     color:"#0064FF", icon:"P+" },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "Ligue 1": [
    { name:"beIN Sports", url:"https://www.beinsports.com/",        color:"#E4002B", icon:"b"  },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "Champions League": [
    { name:"Paramount+",  url:"https://www.paramountplus.com/",     color:"#0064FF", icon:"P+" },
    { name:"CBS Sports",  url:"https://www.cbssports.com/",         color:"#003087", icon:"CBS"},
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
  "Europa League": [
    { name:"Paramount+",  url:"https://www.paramountplus.com/",     color:"#0064FF", icon:"P+" },
    { name:"CBS Sports",  url:"https://www.cbssports.com/",         color:"#003087", icon:"CBS"},
  ],
  "MLS": [
    { name:"Apple TV+",   url:"https://tv.apple.com/",              color:"#555555", icon:"🍎" },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
  ],
  "UFC": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
  ],
  "Formula 1": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Hulu",        url:"https://www.hulu.com/",              color:"#1CE783", icon:"H"  },
    { name:"YouTube TV",  url:"https://tv.youtube.com/",            color:"#FF0000", icon:"▶"  },
  ],
  "College Football": [
    { name:"ESPN+",       url:"https://plus.espn.com/",            color:"#E8002D", icon:"E+" },
    { name:"Peacock",     url:"https://www.peacocktv.com/",         color:"#000000", icon:"🦚" },
    { name:"Paramount+",  url:"https://www.paramountplus.com/",     color:"#0064FF", icon:"P+" },
    { name:"Fubo",        url:"https://www.fubo.tv/",               color:"#FA4616", icon:"F"  },
  ],
};
function getSportStreamers(sportDisplay) {
  if (!sportDisplay) return [];
  if (SPORTS_STREAM_MAP[sportDisplay]) return SPORTS_STREAM_MAP[sportDisplay];
  for (const [key, val] of Object.entries(SPORTS_STREAM_MAP)) {
    if (sportDisplay.includes(key)||key.includes(sportDisplay)) return val;
  }
  return [];
}

function getBroadcastLink(broadcast) {
  if (!broadcast) return "";
  const b = broadcast.toUpperCase();
  if (b.includes("ESPN+") || b.includes("ESPN UNLMTD") || b.includes("ESPNPLUS")) return "https://plus.espn.com/";
  if (b.includes("ESPN2")) return "https://www.espn.com/watch/";
  if (b.includes("ESPNU")) return "https://www.espn.com/watch/";
  if (b.includes("ESPN")) return "https://www.espn.com/watch/";
  if (b.includes("MLB.TV")) return "https://www.mlb.tv/";
  if (b.includes("NFL+") || b.includes("NFL NETWORK")) return "https://www.nfl.com/";
  if (b.includes("NBA TV") || b.includes("NBA LEAGUE")) return "https://www.nba.com/";
  if (b.includes("HULU")) return "https://www.hulu.com/";
  if (b.includes("ABC")) return "https://abc.com/";
  if (b.includes("PEACOCK")) return "https://www.peacocktv.com/";
  if (b.includes("NBC SPORTS") || b.includes("NBCSN") || b.includes("NBC")) return "https://www.nbc.com/";
  if (b.includes("PARAMOUNT")) return "https://www.paramountplus.com/";
  if (b.includes("CBS SPORTS") || b.includes("CBS")) return "https://www.cbssports.com/";
  if (b.includes("FS1") || b.includes("FS2") || b.includes("FOX SPORTS") || b.includes("FOX")) return "https://www.foxsports.com/";
  if (b.includes("TNT") || b.includes("TBS") || b.includes("TRUETV") || b.includes("MAX")) return "https://www.max.com/";
  if (b.includes("PRIME") || b.includes("AMAZON")) return "https://www.amazon.com/video/";
  if (b.includes("APPLE TV") || b.includes("APPLE")) return "https://tv.apple.com/";
  if (b.includes("NETFLIX")) return "https://www.netflix.com/";
  if (b.includes("DAZN")) return "https://www.dazn.com/";
  if (b.includes("YOUTUBE TV") || b.includes("YOUTUBETV")) return "https://tv.youtube.com/";
  if (b.includes("YOUTUBE")) return "https://www.youtube.com/";
  if (b.includes("FUBO")) return "https://www.fubo.tv/";
  if (b.includes("DISNEY")) return "https://www.disneyplus.com/";
  if (b.includes("SLING")) return "https://www.sling.com/";
  if (b.includes("BEIN")) return "https://www.beinsports.com/";
  if (b.includes("TENNIS CHANNEL")) return "https://www.tennischannel.com/";
  if (b.includes("GOLF CHANNEL")) return "https://www.golfchannel.com/";
  return "";
}

export { SPORTS_STREAM_MAP, getSportStreamers, getBroadcastLink };
