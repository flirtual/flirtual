// URL patterns and player URLs adapted from https://github.com/itteco/iframely/tree/962bf92/plugins/domains
// Copyright (c) 2013-2022 Itteco Software Corp., MIT License: https://github.com/itteco/iframely/blob/962bf92/LICENSE
//
// Only rules that build a player from the URL alone, for allowlisted sites whose oEmbed is missing,
// needs an access token, or returns a script where an iframe would do. Everything else goes through
// oEmbed and the page's own metadata.

import type { Player } from "./markup";

export interface RuleContext {
	/** Hostnames the player ends up embedded under, for providers that check (Twitch). */
	parents: Array<string>;
}

interface Rule {
	re: Array<RegExp>;
	player: (match: RegExpExecArray, url: URL, context: RuleContext) => Player | null;
}

// "1h2m3s", "90s" or "90".
function seconds(value: string | null): number | null {
	if (!value) return null;
	if (/^\d+$/.test(value)) return Number(value);

	const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
	if (!match || !match[0]) return null;

	const [, h = "0", m = "0", s = "0"] = match;
	return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

const twitchReserved = new Set(["directory", "downloads", "drops", "inventory", "jobs", "login", "p", "prime", "search", "settings", "signup", "store", "subscriptions", "turbo", "videos", "wallet"]);
const kickReserved = new Set(["browse", "categories", "category", "dashboard", "following", "privacy-policy", "search", "terms-of-service", "video"]);

const rules: Array<Rule> = [
	// youtube.com/youtube.video.js, youtube.shorts.js
	{
		re: [
			/^https?:\/\/(?:www\.|m\.|music\.)?youtube\.com\/(?:tv#\/)?watch\/?\?(?:[^&]+&)*v=([\w-]+)/i,
			/^https?:\/\/youtu\.be\/([\w-]+)/i,
			/^https?:\/\/(?:www\.)?youtube\.com\/(?:embed|live|v)\/([\w-]+)/i,
			/^https?:\/\/(?:www\.)?youtube\.com\/(shorts)\/([\w-]+)/i
		],
		player(match, url) {
			const short = match[1] === "shorts";
			const id = short ? match[2] : match[1];

			const src = new URL(`https://www.youtube.com/embed/${id}`);
			const start = seconds(url.searchParams.get("t") ?? url.searchParams.get("start"));
			if (start) src.searchParams.set("start", String(start));

			return short
				? { kind: "iframe", src: src.href, aspectRatio: 9 / 16, maxWidth: 320, autoplay: "autoplay=1" }
				: { kind: "iframe", src: src.href, aspectRatio: 16 / 9, autoplay: "autoplay=1" };
		}
	},
	// youtube.com/youtube.playlist.js
	{
		re: [/^https?:\/\/(?:www\.|m\.)?youtube\.com\/playlist\?(?:[^&]+&)*list=([\w-]+)/i],
		player: (match) => ({ kind: "iframe", src: `https://www.youtube.com/embed/videoseries?list=${match[1]}`, aspectRatio: 16 / 9, autoplay: "autoplay=1" })
	},
	// twitch.tv/twitch.tv.js, clips.twitch.tv.js: https://dev.twitch.tv/docs/embed/video-and-clips
	{
		re: [
			/^https?:\/\/clips\.twitch\.tv\/([\w-]+)\/?(?:\?.*)?$/i,
			/^https?:\/\/(?:www\.|m\.)?twitch\.tv\/\w+\/clip\/([\w-]+)/i,
			/^https?:\/\/(?:www\.|m\.|go\.)?twitch\.tv\/(?:\w+\/)?videos?\/(\d+)/i,
			/^https?:\/\/(?:www\.|m\.|go\.)?twitch\.tv\/(\w+)\/?(?:\?.*)?$/i
		],
		player(match, _url, { parents }) {
			const [whole, id] = match;
			const clip = /clips\.twitch\.tv|\/clip\//i.test(whole);
			const video = !clip && /\/videos?\//i.test(whole);
			if (!clip && !video && twitchReserved.has(id.toLowerCase())) return null;

			const src = clip
				? new URL(`https://clips.twitch.tv/embed?clip=${id}`)
				: new URL(`https://player.twitch.tv/?${video ? "video" : "channel"}=${id}`);

			src.searchParams.set("autoplay", "false");
			for (const parent of parents) src.searchParams.append("parent", parent);

			return { kind: "iframe", src: src.href, aspectRatio: 16 / 9, autoplay: "autoplay=true" };
		}
	},
	// instagram.com/instagram.com.js. Instagram's oEmbed needs a Meta app token; its /embed page doesn't.
	{
		re: [
			/^https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?(p|tv|reels?)\/([\w-]+)/i,
			/^https?:\/\/(?:www\.)?instagr\.am\/(?:[\w.-]+\/)?(p)\/([\w-]+)/i
		],
		player: (match) => ({
			kind: "iframe",
			src: `https://www.instagram.com/${match[1].toLowerCase().startsWith("reel") ? "reel" : "p"}/${match[2]}/embed/`,
			height: 640,
			maxWidth: 400
		})
	},
	// facebook.com/facebook.video.js: https://developers.facebook.com/docs/plugins/embedded-video-player
	{
		re: [
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/(?:video\/)?video\.php.*[?&](?:v|id)=\d+/i,
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/[\w.]+\/videos\/(?:[\w-]+\/)?\d+/i,
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/watch\/?\?(?:.+&)?v=\d+/i,
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/(reel)\/\d+/i,
			/^https?:\/\/fb\.watch\/[\w-]+/i
		],
		player: (match, url) => {
			const src = new URL("https://www.facebook.com/plugins/video.php?show_text=false");
			src.searchParams.set("href", url.href);
			return match[1]
				? { kind: "iframe", src: src.href, aspectRatio: 9 / 16, maxWidth: 320, autoplay: "autoplay=true" }
				: { kind: "iframe", src: src.href, aspectRatio: 16 / 9, autoplay: "autoplay=true" };
		}
	},
	// facebook.com/facebook.post.js: https://developers.facebook.com/docs/plugins/embedded-posts
	{
		re: [
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/(?:permalink|story)\.php\?[^/]+\d{10,}/i,
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/photo(?:\.php|\/)?\?(?:[^?]+)?fbid=\d{10,}/i,
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/[^/]+\/(?:posts|activity)\/(?:[^/]+\/)?(?:\d{10,}|pfbid[\w.-]+)/i,
			/^https?:\/\/(?:www|m|business)\.facebook\.com\/[^/]+\/photos(?:\/[^/]+)?\/\d{10,}/i
		],
		player: (_match, url) => {
			const src = new URL("https://www.facebook.com/plugins/post.php?show_text=true&width=500");
			src.searchParams.set("href", url.href);
			return { kind: "iframe", src: src.href, height: 560, maxWidth: 500 };
		}
	},
	// pinterest.com/pinterest.pin.js
	{
		re: [/^https?:\/\/(?:\w{2,3}\.)?pinterest(?:\.com?)?\.\w{2,3}\/pin\/(?:[^/]+-)?(\d+)/i],
		player: (match) => ({ kind: "iframe", src: `https://assets.pinterest.com/ext/embed.html?id=${match[1]}`, height: 560, maxWidth: 345 })
	},
	// itunes.apple.com/apple.music.js: https://embed.music.apple.com mirrors music.apple.com's paths.
	{
		re: [/^https?:\/\/music\.apple\.com\/(\w{2}\/(?:album|playlist|music-video|song|station)\/.+)$/i],
		player: (match, url) => ({
			kind: "iframe",
			src: `https://embed.music.apple.com/${match[1]}`,
			height: url.searchParams.has("i") || /\/song\//i.test(match[1]) ? 175 : 450,
			maxWidth: 660
		})
	},
	// github.gist.js: the gist's own script writes it out.
	{
		re: [/^https?:\/\/gist\.github\.com\/([\w.-]+)\/([\da-f]+)\/?(?:[?#].*)?$/i],
		player: (match) => ({
			kind: "html",
			html: `<script src="https://gist.github.com/${match[1]}/${match[2]}.js"></script>`,
			scripts: ["https://gist.github.com"]
		})
	},
	// Not in Iframely: TikTok's oEmbed is a script, its player API is an iframe.
	// https://developers.tiktok.com/doc/embed-player
	{
		re: [/^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i],
		player: (match) => ({ kind: "iframe", src: `https://www.tiktok.com/player/v1/${match[1]}?music_info=1&description=1`, aspectRatio: 9 / 16, maxWidth: 325, autoplay: "autoplay=1" })
	},
	// Not in Iframely: Kick channels have no oEmbed. https://player.kick.com/{channel}
	{
		re: [/^https?:\/\/(?:www\.)?kick\.com\/([\w-]+)\/?(?:\?.*)?$/i],
		player: (match) => kickReserved.has(match[1].toLowerCase())
			? null
			: { kind: "iframe", src: `https://player.kick.com/${match[1]}?autoplay=false`, aspectRatio: 16 / 9, autoplay: "autoplay=true" }
	},
	// Not in Iframely: nicovideo's og:video is its player page, mislabelled video/mp4.
	{
		re: [/^https?:\/\/(?:www\.|sp\.)?nicovideo\.jp\/watch\/([a-z]{2}\d+|\d+)/i],
		player: (match) => ({ kind: "iframe", src: `https://embed.nicovideo.jp/watch/${match[1]}`, aspectRatio: 16 / 9, autoplay: "autoplay=1" })
	},
	// domains/google.com/docs.google.com.js: a published form embeds at ?embedded=true.
	{
		re: [/^https:\/\/docs\.google\.com\/(?:a\/[\w.-]+\/)?forms\/(?:u\/\d\/)?d\/e\/([\w-]+)\/viewform/i],
		player: (match) => ({ kind: "iframe", src: `https://docs.google.com/forms/d/e/${match[1]}/viewform?embedded=true`, height: 640, maxWidth: 640 })
	},
	// Not in Iframely: Threads posts have an /embed page, its oEmbed needs a Meta app token.
	{
		re: [/^https?:\/\/(?:www\.)?threads\.(?:com|net)\/(@[\w.]+)\/post\/([\w-]+)/i],
		player: (match) => ({ kind: "iframe", src: `https://www.threads.com/${match[1]}/post/${match[2]}/embed`, height: 600, maxWidth: 500 })
	},
	// sketchfab.com has oEmbed, but its model URLs alone are enough.
	{
		re: [/^https?:\/\/(?:www\.)?sketchfab\.com\/(?:3d-models\/(?:[\w-]+-)?|models\/)([\da-f]{32})/i],
		player: (match) => ({ kind: "iframe", src: `https://sketchfab.com/models/${match[1]}/embed`, aspectRatio: 16 / 9, autoplay: "autostart=1" })
	}
];

export function rulePlayer(url: URL, context: RuleContext): Player | null {
	for (const rule of rules) {
		for (const re of rule.re) {
			const match = re.exec(url.href);
			if (match) return rule.player(match, url, context);
		}
	}

	return null;
}
