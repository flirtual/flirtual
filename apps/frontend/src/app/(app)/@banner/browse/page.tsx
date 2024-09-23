import { getTranslations } from "next-intl/server";

import { Authentication } from "~/api/auth";

import { Banner, BannerLink } from "../banner";

export default async function () {
	const session = await Authentication.getSession();
	const t = await getTranslations("banners");

	if (!["finished_profile", "visible"].includes(session.user.status)) {
		return (
			<Banner>
				{t.rich("finish_profile", {
					link: (children) => (
						<BannerLink
							href={
								session.user.status === "registered"
									? "/onboarding/1"
									: "/finish/1"
							}
						>
							{children}
						</BannerLink>
					)
				})}
			</Banner>
		);
	}

	if (!session.user.emailConfirmedAt) {
		return (
			<Banner>
				{t.rich("confirm_email", {
					link: (children) => (
						<BannerLink href="/confirm-email">{children}</BannerLink>
					)
				})}
			</Banner>
		);
	}

	return null;
}
