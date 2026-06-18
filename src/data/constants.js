const SPORTS_GUIDE = [
  { sport:"WWE",             icon:"💪", services:["peacock"],                        note:"Peacock exclusive — all Raw, SmackDown & PPVs" },
  { sport:"UFC",             icon:"🥊", services:["espnplus"],                       note:"ESPN+ exclusive — all Fight Nights & PPVs" },
  { sport:"NFL",             icon:"🏈", services:["peacock","prime","espnplus","youtubetv","netflix"], note:"Sunday Night: Peacock · Thursday: Prime · Monday: ESPN+" },
  { sport:"NBA",             icon:"🏀", services:["max","espnplus","youtubetv"],      note:"TNT games on Max · ESPN/ABC games on ESPN+" },
  { sport:"MLB",             icon:"⚾", services:["apple","espnplus","peacock"],      note:"Friday Night Baseball: Apple TV+ · Others: ESPN+/Peacock" },
  { sport:"NHL",             icon:"🏒", services:["espnplus","max","peacock"],        note:"ESPN+ · TNT/TBS games on Max · Some on Peacock" },
  { sport:"Premier League",  icon:"⚽", services:["peacock"],                        note:"Peacock exclusive in the US" },
  { sport:"Champions League",icon:"🏆", services:["paramount","peacock"],            note:"Paramount+ & CBS Sports" },
  { sport:"MLS",             icon:"⚽", services:["apple"],                          note:"Apple TV+ exclusive — MLS Season Pass" },
  { sport:"Formula 1",       icon:"🏎️", services:["espnplus","youtubetv"],           note:"ESPN & ESPN+ — all races live" },
  { sport:"College Football", icon:"🏈", services:["espnplus","max","peacock","youtubetv"], note:"Split across ESPN+, ABC, CBS, NBC" },
  { sport:"Boxing / DAZN",   icon:"🥊", services:["dazn"],                           note:"DAZN — major boxing events" },
];

const SERVICES = [
  { id:"netflix",     name:"Netflix",      color:"#E50914", logo:"N",   deal:null,                         url:"https://www.netflix.com/search?q=",          price:17.99 },
  { id:"disney",      name:"Disney+",      color:"#0063E5", logo:"D+",  deal:null,                         url:"https://www.disneyplus.com/search/",          price:13.99 },
  { id:"max",         name:"Max",          color:"#002BE7", logo:"M",   deal:null,                         url:"https://www.max.com/search?q=",              price:16.99 },
  { id:"hulu",        name:"Hulu",         color:"#1CE783", logo:"H",   deal:"2 months free",              url:"https://www.hulu.com/search?q=",             price:17.99 },
  { id:"apple",       name:"Apple TV+",    color:"#555",    logo:"A",   deal:"$2.99/mo first year",        url:"https://tv.apple.com/search?term=",          price:13.99 },
  { id:"prime",       name:"Prime",        color:"#00A8E1", logo:"P",   deal:null,                         url:"https://www.amazon.com/s?k=",                price:8.99  },
  { id:"peacock",     name:"Peacock",      color:"#E81C2E", logo:"Pk",  deal:"50% off annual",             url:"https://www.peacocktv.com/search?q=",        price:10.99 },
  { id:"paramount",   name:"Paramount+",   color:"#0064FF", logo:"P+",  deal:"30-day trial",               url:"https://www.paramountplus.com/search/?q=",   price:8.99  },
  { id:"crunchyroll", name:"Crunchyroll",  color:"#F47521", logo:"CR",  deal:"14-day free trial",          url:"https://www.crunchyroll.com/search?q=",      price:7.99  },
  { id:"espnplus",    name:"ESPN+",        color:"#E31837", logo:"E+",  deal:null,                         url:"https://www.espn.com/espnplus/player/",      price:11.99 },
  { id:"dazn",        name:"DAZN",         color:"#C8A900", logo:"DZ",  deal:"Cancel anytime",             url:"https://www.dazn.com/search?q=",             price:19.99 },
  { id:"fubo",        name:"Fubo",         color:"#FF6B00", logo:"F",   deal:"5-day free trial",           url:"https://www.fubo.tv/welcome",                price:82.99 },
  { id:"youtube",     name:"YouTube",      color:"#FF0000", logo:"YT",  deal:"Free with ads",              url:"https://www.youtube.com/results?search_query=", price:0  },
  { id:"youtubetv",   name:"YouTube TV",   color:"#FF0000", logo:"YTV", deal:"Free trial",                 url:"https://tv.youtube.com/",                    price:72.99 },
  { id:"tubi",        name:"Tubi",         color:"#FA4343", logo:"Tu",  deal:"Always Free! 🎉",            url:"https://tubitv.com/search/",                 price:0     },
];

const CATEGORY_TABS = [
  { id:"movies",   label:"Movies",    icon:"🎬", color:"#06B6D4",  anim:null },
  { id:"tv",       label:"TV Shows",  icon:"📺", color:"#A78BFA",  anim:"tvFlicker" },
  { id:"anime",    label:"Anime",     icon:"✦",  color:"var(--anime)", anim:"swordSwing" },
  { id:"watchlist",label:"Watchlist", icon:"❤️", color:"#ef4444",  anim:null },
  { id:"stats",    label:"My Stats",  icon:"📊", color:"#10B981",  anim:null },
];

export { SPORTS_GUIDE, SERVICES, CATEGORY_TABS };
