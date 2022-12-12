import { User } from "./api/user";
import { ConfirmEmailPageProps } from "./app/(authenticated)/(sole-model)/confirm-email/page";
import { LoginPageProps } from "./app/(guest)/login/page";

export const siteOrigin = process.env.NEXT_PUBLIC_ORIGIN as string;
if (!siteOrigin) throw new ReferenceError("Site origin not defined");

export const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
if (!apiUrl) throw new ReferenceError("Site origin not defined");

export function toAbsoluteUrl(href: string) {
	return new URL(href, siteOrigin);
}

export function isInternalHref(href: string) {
	return toAbsoluteUrl(href).origin === siteOrigin;
}

export function pageUrl<T extends { params: { [K: string]: string } } = never>(
	pathname: string,
	defaults: T["params"] = {}
) {
	return (query?: NonNullable<T["params"]>) => {
		const object = query ?? defaults;
		const searchParams = new URLSearchParams(object);
		searchParams.sort();

		return `${pathname}${Object.keys(object).length ? `?${searchParams.toString()}` : ""}`;
	};
}

export const urls = {
	// internal
	api: pageUrl(process.env.NEXT_PUBLIC_API_URL as string),
	media: (id: string) => `https://media.flirtu.al/${id}/`,
	userAvatar: (user: User) => {
		const avatarId = user.profile.images[0]?.externalId ?? "e8212f93-af6f-4a2c-ac11-cb328bbc4aa4";
		return urls.media(avatarId);
	},

	// pages
	register: pageUrl("/register"),
	login: pageUrl<LoginPageProps>("/login"),
	forgotPassword: pageUrl("/forgot-password"),
	logout: pageUrl("/logout"),
	user: (username: string) => `/${username}`,
	onboarding: (onboardingIdx: 1 | 2 | 3 | 4) => `/onboarding/${onboardingIdx}`,
	premium: pageUrl("/premium"),
	confirmEmail: pageUrl<ConfirmEmailPageProps>("/confirm-email"),

	settings: {
		default: pageUrl("/settings"),

		// profile
		matchmaking: pageUrl("/settings/matchmaking"),
		biography: pageUrl("/settings/biography"),
		tags: pageUrl("/settings/tags"),
		personality: pageUrl("/settings/personality"),
		nsfw: pageUrl("/settings/privacy"),

		// account
		privacy: pageUrl("/settings/privacy"),
		notifications: pageUrl("/settings/notifications"),
		changeEmail: pageUrl("/settings/change-email"),
		changePassword: pageUrl("/settings/change-password"),
		deactivateAccount: pageUrl("/settings/deactivate"),
		deleteAccount: pageUrl("/settings/delete")
	},

	resources: {
		networkStatus: pageUrl("https://status.flirtu.al"),
		about: pageUrl("/about"),
		communityGuidelines: pageUrl("/community-guidelines"),
		termsOfService: pageUrl("/terms-of-service"),
		privacyPolicy: pageUrl("/privacy-policy"),
		company: pageUrl("https://studiopaprika.io/")
	},

	socials: {
		twitter: pageUrl("https://twitter.com/getflirtual"),
		instagram: pageUrl("https://instagram.com/flirtual"),
		discord: pageUrl("https://discord.com/invite/flirtual")
	},

	apps: {
		android: pageUrl("https://play.google.com/store/apps/details?id=zone.homie.flirtual.pwa"),
		windows: pageUrl("https://apps.microsoft.com/store/detail/flirtual/9NWCSDGB6CS3"),
		sideQuest: pageUrl("https://sidequestvr.com/app/9195")
	}
};
