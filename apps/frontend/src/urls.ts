import { createPath, href } from "react-router";
import type { Path, To } from "react-router";
import { entries, fromEntries } from "remeda";
import FallbackAvatar from "virtual:remote/8d120672-c717-49d2-b9f3-2d4479bbacf6";
import Gradient from "virtual:remote/e8212f93-af6f-4a2c-ac11-cb328bbc4aa4";

import type { User } from "./api/user";
import type { Profile } from "./api/user/profile";
import type { ProfileImage } from "./api/user/profile/images";
import type { DiscoverGroup } from "./app/[locale]/(app)/(authenticated)/(onboarded)/discover/page";
import { apiUrl, bucketContentOrigin, bucketUploadsOrigin, siteOrigin } from "./const";
import { defaultLocale } from "./i18n";
import type { Locale } from "./i18n";
import { escapeVRChat } from "./vrchat";

export function ensureRelativeUrl(pathname: string) {
	if (!isInternalHref(pathname))
		throw new Error(`Must be relative url: ${pathname}`);
	return pathname;
}

export const allowedOrigins = [
	siteOrigin,
	new URL(apiUrl).origin
];

export function toAbsoluteUrl(to: Path | URL | string) {
	return new URL((typeof to === "string" || to instanceof URL) ? to : createPath(to), siteOrigin);
}

export { toAbsoluteUrl as absoluteUrl };

export function toRelativeUrl(url: { href: string; origin: string }) {
	return url.href.slice(url.origin.length);
}

export function urlEqual(a: URL, b: URL, strict: boolean = true) {
	return (
		a.origin === b.origin
		&& a.pathname === b.pathname
		&& (strict ? a.search === b.search : true)
	);
}

function url(
	pathname: string,
	query: Record<string, number | string | undefined> = {}
) {
	const searchParameters = new URLSearchParams(
		fromEntries(
			entries(query)
				.map(([k, v]) => (v ? [k, String(v)] as const : null))
				.filter(Boolean)
		)
	);

	searchParameters.sort();
	const queryString
		= [...searchParameters.keys()].length > 0
			? `?${searchParameters.toString()}`
			: "";

	return `${pathname}${queryString}`;
}

export function isInternalHref(to: To) {
	return toAbsoluteUrl(to.toString()).origin === siteOrigin;
}

export { href };

export type Page = Parameters<typeof href>[0];
export type PageParameters<T extends Page> = Parameters<typeof href<T>>[1];

type Query = ConstructorParameters<typeof URLSearchParams>[0];

type HrefWithQueryOptions<T extends Page> = {
	query?: Query;
} & (PageParameters<T> extends undefined
	? { params?: undefined }
	: { params: PageParameters<T> }
);

export function hrefWithQuery<T extends Page>(
	path: T,
	{ params, query }: HrefWithQueryOptions<T>
) {
	// @ts-expect-error: ??
	const pathname = href(path, params);

	const searchParameters = new URLSearchParams(query);
	if (searchParameters.size === 0) return pathname;

	return `${pathname}?${searchParameters.toString()}`;
}

export type FinishPage = 1 | 2 | 3 | 4 | 5;

export const bucketNames = [
	"static",
	"content",
	"uploads"
] as const;

export type BucketName = typeof bucketNames[number];

export const bucketOriginMap = {
	static: "https://static.flirtual.com",
	content: bucketContentOrigin,
	uploads: bucketUploadsOrigin
} as const satisfies Record<BucketName, string>;

export const bucketOrigins = Object.values(bucketOriginMap);

type ArbitraryImageOptions = Record<string, number | string>;

export const urls = {
	// internal
	api: apiUrl,
	media: (id: string, bucket: BucketName = "static", variant: string = "", folder: string = "") =>
		`${bucketOriginMap[bucket]}/${folder ? `${folder}/` : ""}${id}${variant ? `/${variant}` : ""}`,
	image: (image: ProfileImage, variant: string = "profile") =>
		image.externalId
			? urls.media(image.externalId, "content", variant)
			: image.originalFile
				? urls.media(image.originalFile, "uploads")
				: Gradient,
	arbitraryImage: (urlOrPathname: string, options: ArbitraryImageOptions = { quality: 90 }) =>
		`https://flirtual.com/cdn-cgi/image/${Object.entries(options).map(([key, value]) =>
			`${{
				width: "w",
				height: "h",
				format: "f",
				quality: "q",
				"slow-connection-quality": "scq"
			}[key] || key}=${value}`).join(",")}/${urlOrPathname}`,
	userAvatar: (user: { profile: Pick<Profile, "images"> } | null, variant?: string) =>
		user?.profile.images[0]
			? urls.image(user.profile.images[0], variant)
			: FallbackAvatar,
	vrchatProfile: (userId: string) =>
		`https://vrchat.com/home/user/${userId}`,
	vrchatSearch: (name: string) =>
		`https://vrchat.com/home/search/users/${encodeURIComponent(
			escapeVRChat(name)
		)}`,
	vrchatWorld: (worldId: string) =>
		`https://vrchat.com/home/world/${worldId}`,

	// pages
	default: "/",
	landing: "/",
	register: "/sign-up",
	login: (next?: string) => url("/login", { next }),
	forgotPassword: "/forgot",
	underage: "/underage",
	user: {
		me: "/me"
	},
	profile: (user?: User | string) => {
		if (!user) return "me";
		return `/${typeof user === "string" ? user : user.slug}`;
	},
	// browse: (kind?: ProspectKind) =>
	// 	url("/browse", { kind: kind === "love" ? undefined : kind }),
	discover: (group: DiscoverGroup) => url(`/${group}`),
	conversations: {
		list: () => "/matches",
		of: (conversationId: string) => `/matches/${conversationId}`
	},
	likes: "/likes",
	onboarding: (onboardingIndex: 1 | 2) => `/onboarding/${onboardingIndex}`,
	finish: (finishIndex: FinishPage) => `/finish/${finishIndex}`,
	subscription: {
		default: "/subscription",
		success: url("/subscription", { success: "true" })
	},
	news: "/news",
	confirmEmail: (
		query: any = {}
	) => url("/confirm-email", query),

	settings: {
		list: (returnTo?: string) => url("/settings", { return: returnTo }),

		// profile
		matchmaking: (returnTo?: string) =>
			url("/settings/matchmaking", { return: returnTo }),
		bio: "/settings/bio",
		info: (fragment?: string) =>
			`/settings/info${fragment ? `?af=${fragment}` : ""}`,
		interests: "/settings/interests",
		personality: "/settings/personality",
		nsfw: "/settings/nsfw",

		// account
		referral: "/settings/referral",
		appearance: "/settings/appearance",
		privacy: "/settings/privacy",
		notifications: "/settings/notifications",
		connections: "/settings/connections",
		email: "/settings/email",
		password: "/settings/password",
		deactivateAccount: "/settings/deactivate",
		reactivateAccount: "/settings/reactivate",
		deleteAccount: "/settings/delete",
		fun: "/settings/fun"
	},

	moderation: {
		flags: "/flags",
		search: "/search",
		reports: (options: { userId?: string; targetId?: string } = {}) =>
			url("/reports", options)
	},

	admin: {
		stats: "/stats",
		statsData: (name: string) =>
			`https://storage.cloud.google.com/flirtual-stats/${name}.csv`,
		statsChart: (name: string) =>
			`https://storage.cloud.google.com/flirtual-stats/${name}.svg`
	},

	debugger: "/debugger",

	resources: {
		download: "/download",
		events: "/events",
		invite: "/invite",
		networkStatus: "https://status.flirtual.net",
		press: "/press",
		pressEmail: "mailto:press@flirtual.com",
		privacyEmail: "mailto:privacy@flirtual.com",
		branding: "/branding",
		developers: "https://github.com/flirtual/flirtual",
		translate: (locale?: Locale) => `https://hosted.weblate.org/projects/flirtual/flirtual${locale && locale !== defaultLocale ? `/${locale}` : ""}`,
		about: "/about",
		communityGuidelines: "/guidelines",
		termsOfService: "/terms",
		privacyPolicy: "/privacy",
		paymentTerms: "/payments",
		contact: "https://hello.flirtu.al/",
		contactDirect: "https://hello.flirtu.al/support/tickets/new",
		vulnerabilityReport:
			"https://github.com/flirtual/flirtual/security/advisories/new"
	},

	guides: {
		mentalHealth: "/guides/mental-health"
	},

	socials: {
		discord: "https://discord.gg/flirtual",
		vrchat: "https://vrc.group/FLIRT.4525",
		twitter: "https://twitter.com/getflirtual"
	},

	apps: {
		apple: "https://apps.apple.com/app/flirtual-vr-dating-app/id6450485324",
		google: "https://play.google.com/store/apps/details?id=zone.homie.flirtual.pwa",
		microsoft: "https://apps.microsoft.com/store/detail/flirtual/9NWCSDGB6CS3",
		sideQuest: "https://sidequestvr.com/app/9195"
	}
};
