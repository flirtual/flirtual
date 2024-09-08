import { getTranslations } from "next-intl/server";
import { match, P } from "ts-pattern";

import { Authentication } from "~/api/auth";

import { Banner, BannerLink } from "../banner";

export default async function () {
	const session = await Authentication.getSession();
	const t = await getTranslations("banners");

	return match(session.user)
		.with({ emailConfirmedAt: P.nullish }, () => (
			<Banner>
				{t.rich("confirm_email", {
					link: (children) => (
						<BannerLink href="/confirm-email">{children}</BannerLink>
					)
				})}
			</Banner>
		))
		.with({ status: P.not(P.union("finished_profile", "visible")) }, () => (
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
		))
		.otherwise(() => null);
}
