import { ConfirmEmailPageProps } from "./app/(authenticated)/(sole-model)/confirm-email/page";
import { LoginPageProps } from "./app/(guest)/login/page";

export function pageUrl<T extends { params: { [K: string]: string } }>(
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
	register: pageUrl("/register"),
	login: pageUrl<LoginPageProps>("/login"),
	logout: pageUrl("/logout"),
	user: (username: string) => pageUrl(`/${username}`)(),
	onboarding: (onboardingIdx: 1 | 2 | 3 | 4) => pageUrl(`/onboarding/${onboardingIdx}`)(),
	premium: pageUrl("/premium"),
	confirmEmail: pageUrl<ConfirmEmailPageProps>("/confirm-email"),
	settings: {
		default: pageUrl("/settings"),
		privacy: pageUrl("/settings/privacy"),
		notifications: pageUrl("/settings/notifications"),
		changeEmail: pageUrl("/settings/change-email"),
		changePassword: pageUrl("/settings/change-password"),
		deactivateAccount: pageUrl("/settings/deactivate"),
		deleteAccount: pageUrl("/settings/delete")
	}
};
