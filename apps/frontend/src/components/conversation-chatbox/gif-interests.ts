// Shared interests suggest a GIF search.
export const interestQueries: ReadonlyArray<readonly [interestId: string, query: string]> = [
	["BTGLoHoCuPjvY2NrRKSWpb", "anime"], // Anime 🌸
	["Bmkx6cmyU9kbuA3pdwv43o", "cuddle"], // Cuddles 🥰
	["MTmW4A9pTEqZem2wZvGN3F", "furry"], // Furry 🐾
	["cqaodBdFdfeegFVzxuA3QB", "blender 3d"], // 3D modeling
	["g2fAPyAgPKt7WaoVZYxPm2", "planes"], // Aviation ✈️
	["Eu7WzNKBxcQKXhPWgAWAYW", "cars"], // Cars 🚗
	["JTnaqV7ZtSm7ecGmk9JbUN", "chess"], // Chess ♟️
	["4vTwGjfH9oEk6fLthm4HjX", "cosplay"], // Cosplay 👘
	["cEfjsZtYLiWDSMSeg7q8V5", "vr dancing"], // Dancing 💃
	["koZvXYA7RHi7hgPN7b3Vca", "disney"], // Disney
	["6bNZo7xhhuEXCekE5PyU2Z", "diy"], // DIY 🛠️
	["xXDcmmB7yrZEMWi4ZLg6z3", "dogs"], // Dogs 🐶
	["rsdnj8EDHstxBCLX4Z7kEn", "dnd"], // Dungeons & Dragons 🏰
	["BrKGJW7c8TvnQh7zxbJNuQ", "fish"], // Fishing 🎣
	["QSS6J4qhxDDiyWrbVoHxyY", "game dev"], // Game dev
	["P8E5xJTRAgxycZMErjVMYa", "gardening"], // Gardening 🪴
	["JGwyrqtUfCC7HVNZ2ot8LV", "guitar"], // Guitar 🎸
	["ZwP6JmwP2Hk8PMpujmvGDY", "k-drama"], // K-drama 🇰🇷
	["K9MHU3GP3kVfW8yck8ZPdg", "karaoke"], // Karaoke 🎤
	["uDxAuTWV85Jr7r8YbnDxnd", "magic the gathering"], // Magic: The Gathering
	["KsQnqSKQQKjhTvdHhYX86G", "anime"], // Manga 📚
	["g7SwgV8y7JQNG4UrQUJUCP", "marvel"], // Marvel
	["fAgh4qEey9okWzNjooerLG", "meditation"], // Meditation 🧘
	["uwhn9iPM4kntT2Bq2WDXKN", "motorcycles"], // Motorcycles 🏍️
	["KqYcEh6DTSd62kVJUU2Aim", "piano"], // Piano 🎹
	["2gBkrkuQN6PjTEeexms7nf", "programming"], // Programming ⌨️
	["svS7TMjzrzjmsh2X3Qe23e", "space"], // Space 🪐
	["Z3JAwEM6n7wuc5dAXX36DQ", "star wars"], // Star Wars
	["V6dXwTJecCTbaUy4nbZip4", "vocaloid"], // Vocaloid
	["jJmDX2sxgQ6YGVXN2CNJFV", "vtuber"], // VTuber
	["tqFRhDSaSL6m2d9YHGQdSA", "warhammer"], // Warhammer
	["neCdcEJXKyQdf4uSqd5Jig", "yoga"], // Yoga 🧘
	["NZjaoEMBizfYF2ScZbYAuG", "420"], // 420 friendly 🍁
	["8VvHQ63mBuCLdtc5bXcAdb", "coffee"], // Caffeinated ☕️
	["fM4o5U2ebgVDFEvsD66hEe", "cheers"], // Drinking buddies 🍻
	["mNhUREva2s5sfkMxLfwqk3", "emo"], // Emo 🖤
	["3jGAehpXeSjweUPwpTRvJZ", "femboy"], // Femboy
	["658ffCwnSFxaY3hQSDvkGW", "forklift"], // Forklift certified 🦺
	["7PSViCMY8iKswNUxAjDwiY", "goth"], // Goth 🕷️
	["BJwi9ji9dCqrX6YwqVLb2X", "headpat"], // Headpats
	["B4vkCyhTZJX5SvkQ7RWoJm", "kawaii"], // Kawaii 💖
	["BmuNHSVwKnyyVMUqEMqpYg", "mech"], // Mech pilot 🤖
	["JTp3btTZgozbnvZoatpJwR", "meme"], // Memelord
	["vHWMgQ4fHUwUxY72vi5Sz7", "anime"], // Otaku
	["pHU7w3PAb7fhcTDqFQWMKX", "tsundere"], // Tsundere 💢
	["WEnom9DcbnWrCepxx2PNnE", "yandere"], // Yandere 😍
	["ZH7obevCWQmuLmHGQgaTF7", "among us"], // Among Us
	["sZZJLGtJX8MohZENZX9GdJ", "apex legends"], // Apex Legends
	["qdRj5abyaGBYsFaeXxaZ9P", "arc raiders"], // ARC Raiders
	["y6mH6biHKb5u7DWiAx65t4", "avakin life"], // Avakin Life
	["GfBVjXqiaoeRyr8XHzehGo", "baldurs gate 3"], // Baldur's Gate 3
	["TU3ZGBcDFWFbSmwMjjnEn9", "battlefield"], // Battlefield
	["UXCy3bePW2WMDA6RCv6iZh", "call of duty"], // Call of Duty
	["XESzLLYMMdaVqTQ8Tv6Qig", "counter strike"], // Counter Strike
	["JctyN5EwihD2pa9zVktx2o", "dead by daylight"], // Dead by Daylight
	["V7nnYFUmEahv69NVybWzrP", "destiny 2"], // Destiny 2
	["hh5U4kzyVvP2GWVwHUVjWS", "dota 2"], // Dota 2
	["LJ4cdsqKZVJDp5Gy6zBP7W", "elden ring"], // Elden Ring
	["xHBPtTXA6S5ptoJ9nH3GB7", "ffxiv"], // Final Fantasy XIV
	["wNLsMkCkrPbHHwpRbPrm7E", "fnaf"], // Five Nights at Freddy's
	["iH4ixES2RmvvG5F69eQjQe", "fortnite"], // Fortnite
	["vFjxVagULNzG4SQgncbcGN", "genshin impact"], // Genshin Impact
	["Hnr8pBT5G3XxNmYgabRTVU", "gta"], // Grand Theft Auto
	["yuA96WnDtShVGMZYJXHbRc", "halo"], // Halo
	["BnehkvnigVVEAhAu6sPH25", "helldivers"], // Helldivers 2
	["ydnaNfxjyfW8gYSLnosMYN", "honkai star rail"], // Honkai: Star Rail
	["u8ZKWRf3XK3ipbHo5cuArS", "imvu"], // IMVU
	["Ajo23jt7zDTZjJ85ib7uSS", "kingdom hearts"], // Kingdom Hearts
	["ZA7gUc3YbdSdhSbwpnt8rm", "league of legends"], // League of Legends
	["Pg5LjgRVQTuZuXdG9aPPaD", "marvel rivals"], // Marvel Rivals
	["gbeLm6w9S7jTuHZ3b6jhCc", "monster hunter"], // Monster Hunter
	["DBQsu388Xfn2KcE5oW2ae2", "osu"], // osu!
	["LNJB83mjPSFgWnjKuLBSEG", "overwatch"], // Overwatch
	["AGGf3KdZzJAqaZNGvNPcvM", "path of exile"], // Path of Exile
	["A55Aw7nfXg2A75uwNJhwrh", "persona"], // Persona
	["BBQbPpGQv5QA6tbm6qV8Vg", "pokemon"], // Pokémon
	["45Dmuuq5V8xdNTsivEEizE", "pubg"], // PUBG: Battlegrounds
	["wp6pryLafKY7wrW3zjYaqE", "rainbow six siege"], // Rainbow Six Siege
	["LpaAvRMRqT3yWQskovUta4", "rocket league"], // Rocket League
	["kK3comfAcSAtJtQunqV6QZ", "rust"], // Rust
	["uiEz3zZDfe7UaJgoodssZE", "second life"], // Second Life
	["ASpc5rzmzRBhGzoW4Dt7A2", "stardew valley"], // Stardew Valley
	["3b7sZwdYj6tNAziQQuCKEE", "tf2"], // Team Fortress 2
	["PKDvhwaZutvjysHXqsiURL", "terraria"], // Terraria
	["oYpeL2jBcwYoQfjs8gAHCN", "the sims"], // The Sims
	["dQdjQyL9M8kCxrL9Si2zqM", "touhou"], // Touhou
	["YCg9tPA8V3bfbjDqoM79ei", "undertale"], // Undertale
	["p39ZFJiMxJoCGZNRjo4osC", "valorant"], // Valorant
	["P3eB38Lh8ZegBq4KdBAF3n", "warframe"], // Warframe
	["j7cbohAXG2oFtBJqpxhKmL", "world of warcraft"], // World of Warcraft
	["FXz9VcUhgQp6eexp25zkBX", "wuthering waves"], // Wuthering Waves
	["cU8xQqQfNN6n8xDAHkpdN9", "zepeto"], // Zepeto
	["ygSknA4rAWip5bDjXwawYd", "jazz"], // Jazz 🎷
	["rY6Mf9bdYcpLbCWpVBnhym", "k-pop"], // K-pop 🇰🇷
	["9LGdoTTRR6eDXjTRqEwrxD", "metal"], // Metal 🤘
	["dEWG2fauN29LXFiaGSAvK4", "punk"], // Punk 🧷
	["bR2veGptTAE4VHitxqZxJV", "street fighter"], // Fighting games 🥊
	["M9FwNtCEQT3xUNV4EsnQ3d", "rhythm games"], // Rhythm games 🎼
];
