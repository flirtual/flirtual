import type { Url } from "next/dist/shared/lib/router/router";
import { entries, fromEntries } from "remeda";

import type { ProspectKind } from "~/api/matchmaking";

import type { User } from "./api/user";
import type { Profile } from "./api/user/profile";
import type { ProfileImage } from "./api/user/profile/images";
import type { ConfirmEmailPageProps as ConfirmEmailPageProperties } from "./app/(app)/(public)/confirm-email/page";
import { siteOrigin } from "./const";
import { escapeVRChat } from "./vrchat";

export function ensureRelativeUrl(pathname: string) {
	if (!isInternalHref(pathname))
		throw new Error(`Must be relative url: ${pathname}`);
	return pathname;
}

export function toAbsoluteUrl(href: string) {
	return new URL(href, siteOrigin);
}

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

export function isInternalHref(href: Url) {
	return toAbsoluteUrl(href.toString()).origin === siteOrigin;
}

export type FinishPage = 1 | 2 | 3 | 4 | 5;

export const imageOrigins = [
	"https://files.flirtu.al",
	"https://img.flirtu.al",
	"https://pfp.flirtu.al",
	"https://pfpup.flirtu.al"
];

export const urls = {
	// internal
	api: process.env.NEXT_PUBLIC_API_URL as string,
	media: (id: string, bucket?: string, variant?: string) =>
		`https://${bucket ?? "img"}.flirtu.al/${id}${variant ? `/${variant}` : ""}`,
	pfp: (image: ProfileImage, variant: string = "profile") =>
		image.externalId
			? urls.media(image.externalId, "pfp", variant)
			: image.originalFile
				? urls.media(image.originalFile, "pfpup")
				: urls.media("e8212f93-af6f-4a2c-ac11-cb328bbc4aa4"),
	userAvatar: (user: { profile: Pick<Profile, "images"> } | null, variant?: string) =>
		user?.profile.images[0]
			? urls.pfp(user.profile.images[0], variant)
			: urls.media("8d120672-c717-49d2-b9f3-2d4479bbacf6"),
	vrchat: (username: string) =>
		`https://vrchat.com/home/search/users/${encodeURIComponent(
			escapeVRChat(username)
		)}`,

	// pages
	default: "/",
	landing: "/home",
	register: "/onboarding/0",
	login: (next?: string) => url("/login", { next }),
	forgotPassword: "/forgot",
	user: {
		me: "/me"
	},
	profile: (user?: User | string) => {
		if (!user) return "me";
		return `/${typeof user === "string" ? user : user.slug}`;
	},
	browse: (kind?: ProspectKind) =>
		url("/browse", { kind: kind === "love" ? undefined : kind }),
	conversations: {
		list: () => "/matches",
		of: (conversationId: string) => `/matches/${conversationId}`
	},
	likes: "/likes",
	onboarding: (onboardingIndex: 1 | 2) => `/onboarding/${onboardingIndex}`,
	finish: (finishIndex: FinishPage) => `/finish/${finishIndex}`,
	subscription: {
		default: "/subscription",
		success: url("/subscription", { success: "yes" })
	},
	confirmEmail: (
		query: Awaited<ConfirmEmailPageProperties["searchParams"]> = {}
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
		deleteAccount: "/settings/delete",
		fun: "/settings/fun"
	},

	moderation: {
		search: "/search",
		reports: (options: { userId?: string; targetId?: string } = {}) =>
			url("/reports", options),
		imageSearch: (imageLink: string) =>
			`https://lens.google.com/uploadbyurl?url=${imageLink}`
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
		pressEmail: "mailto:press@flirtu.al",
		branding: "/branding",
		developers: "https://github.com/flirtual",
		about: "/about",
		communityGuidelines: "/guidelines",
		termsOfService: "/terms",
		privacyPolicy: "/privacy",
		paymentTerms: "/payments",
		contact: "https://hello.flirtu.al/",
		contactDirect: "https://hello.flirtu.al/support/tickets/new",
		feedback: "https://flirtual.canny.io",
		vulnerabilityReport:
			"https://github.com/flirtual/flirtual/security/advisories/new"
	},

	guides: {
		mentalHealth: "/guides/mental-health"
	},

	socials: {
		discord: "https://discord.com/invite/flirtual",
		vrchat: "https://vrc.group/FLIRT.4525",
		twitter: "https://twitter.com/getflirtual"
	},

	apps: {
		apple: "https://apps.apple.com/app/flirtual-vr-dating-app/id6450485324",
		google:
			"https://play.google.com/store/apps/details?id=zone.homie.flirtual.pwa",
		microsoft: "https://apps.microsoft.com/store/detail/flirtual/9NWCSDGB6CS3",
		sideQuest: "https://sidequestvr.com/app/9195"
	}
};
