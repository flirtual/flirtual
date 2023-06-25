import { Url } from "next/dist/shared/lib/router/router";

import { ProspectKind } from "~/api/matchmaking";

import { User } from "./api/user";
import { ConfirmEmailPageProps as ConfirmEmailPageProperties } from "./app/confirm-email/page";
import { entries, fromEntries } from "./utilities";
import { siteOrigin } from "./const";

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

export function urlEqual(a: URL, b: URL) {
	return (
		a.origin === b.origin && a.pathname === b.pathname && a.search === b.search
	);
}

function url(
	pathname: string,
	query: Record<string, string | number | undefined> = {}
) {
	const searchParameters = new URLSearchParams(
		fromEntries(
			entries(query)
				.map(([k, v]) => (v ? [k, String(v)] : null))
				.filter(Boolean)
		)
	);

	searchParameters.sort();
	const queryString =
		[...searchParameters.keys()].length > 0
			? `?${searchParameters.toString()}`
			: "";

	return `${pathname}${queryString}`;
}

export function isInternalHref(href: Url) {
	return toAbsoluteUrl(href.toString()).origin === siteOrigin;
}

export const urls = {
	// internal
	api: process.env.NEXT_PUBLIC_API_URL as string,
	media: (id: string) => `https://media.flirtu.al/${id}/`,
	userAvatar: (user: User) =>
		user.profile.images[0]?.url ??
		urls.media("e8212f93-af6f-4a2c-ac11-cb328bbc4aa4"),
	vrchat: (username: string) => `https://vrchat.com/home/search/${username}`,

	// pages
	default: "/",
	register: "/register",
	login: (next?: string) => url("/login", { next }),
	forgotPassword: "/forgot",
	user: {
		me: "/me",
		profile: (username: string) => `/${username.toLowerCase()}`
	},
	profile: (user?: User | string) =>
		`/${
			user
				? (typeof user === "string" ? user : user.username).toLowerCase()
				: "me"
		}`,
	browse: (kind?: ProspectKind) =>
		url("/browse", { kind: kind === "love" ? undefined : kind }),
	conversations: {
		list: () => "/matches",
		of: (conversationId: string) => `/matches/${conversationId}`
	},
	likes: "/likes",
	onboarding: (onboardingIndex: 1 | 2 | 3 | 4) =>
		`/onboarding/${onboardingIndex}`,
	subscription: "/subscription",
	confirmEmail: (query: ConfirmEmailPageProperties["searchParams"] = {}) =>
		url("/confirm-email", query),

	settings: {
		list: (returnTo?: string) => url("/settings", { return: returnTo }),

		// profile
		matchmaking: (returnTo?: string) =>
			url("/settings/matchmaking", { return: returnTo }),
		bio: "/settings/bio",
		tags: (fragment?: string) =>
			`/settings/tags${fragment ? `?af=${fragment}` : ""}`,
		personality: "/settings/personality",
		nsfw: "/settings/nsfw",

		// account
		appearance: "/settings/appearance",
		privacy: "/settings/privacy",
		notifications: "/settings/notifications",
		changeEmail: "/settings/change-email",
		changePassword: "/settings/change-password",
		deactivateAccount: "/settings/deactivate",
		deleteAccount: "/settings/delete"
	},

	moderation: {
		search: "/search",
		reports: "/reports",
		imageSearch: (imageLink: string) =>
			`https://lens.google.com/uploadbyurl?url=${imageLink}`
	},

	admin: {},

	debugger: {
		default: "/debugger",
		console: "/debugger/console"
	},

	resources: {
		download: "/download",
		events: "/events",
		invite: "/invite",
		networkStatus: "http://status.flirtu.al",
		press: "/press",
		branding: "/branding",
		developers: "https://github.com/flirtual",
		about: "/about",
		communityGuidelines: "/guidelines",
		termsOfService: "/terms",
		privacyPolicy: "/privacy",
		company: "https://studiopaprika.io/",
		contact: "https://hello.flirtu.al/",
		contactDirect: "https://hello.flirtu.al/support/tickets/new",
		feedback: "https://flirtual.canny.io",
		vulnerabilityReport:
			"https://github.com/flirtual/flirtual/security/advisories/new",
		mentalHealth: "/mentalhealth"
	},

	socials: {
		discord: "https://discord.com/invite/flirtual",
		vrchat: "https://vrc.group/FLIRT.4525",
		twitter: "https://twitter.com/getflirtual"
	},

	apps: {
		ios: "/ios",
		android:
			"https://play.google.com/store/apps/details?id=zone.homie.flirtual.pwa",
		windows: "https://apps.microsoft.com/store/detail/flirtual/9NWCSDGB6CS3",
		sideQuest: "https://sidequestvr.com/app/9195"
	}
};
