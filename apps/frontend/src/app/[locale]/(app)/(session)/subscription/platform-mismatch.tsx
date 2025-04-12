"use client";

import { useTranslations } from "next-intl";
import type { FC, PropsWithChildren } from "react";

import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

const osName = {
	apple: "ios",
	android: "android"
} as const;

export const PlatformMismatchMessage: FC = () => {
	const { platform, native, vision } = useDevice();
	const session = useOptionalSession();
	const t = useTranslations();

	if (!session) return null;
	const { subscription } = session.user;

	if (vision) return (
		<div className="rounded-lg bg-brand-gradient px-6 py-4">
			<span className="font-montserrat text-lg text-white-10">
				{t(subscription?.active ? "dull_steep_tadpole_grin" : "light_wacky_tadpole_enrich")}
			</span>
		</div>
	);

	if (
		!subscription
		|| !subscription.active
		|| subscription.platform === "unknown"
		|| (["chargebee", "stripe"].includes(subscription.platform)
			&& (platform === "web" || !native))
		|| (subscription.platform === "ios" && platform === "apple" && native)
		|| (subscription.platform === "android" && platform === "android" && native)
	)
		return null;

	return (
		<div className="rounded-lg bg-brand-gradient px-6 py-4">
			<span className="font-montserrat text-lg text-white-10">
				{(platform !== "web" && !["chargebee", "stripe"].includes(subscription.platform))
					? t("caring_smug_felix_gleam", {
							currentPlatform: t(osName[platform]),
							// @ts-expect-error: "chargebee" is not assignable.
							otherPlatform: t(subscription.platform)
						})
					: (platform !== "web" && ["chargebee", "stripe"].includes(subscription.platform))
							? t("gross_each_cobra_talk", {
									platform: t(osName[platform])
								})
							: t("elegant_chunky_frog_soar", {
									// @ts-expect-error: "chargebee" is not assignable.
									platform: t(subscription.platform)
								})}
			</span>
		</div>
	);
};

export const MatchSubscriptionPlatform: FC<PropsWithChildren> = ({
	children
}) => {
	const { platform, native, vision } = useDevice();
	const session = useOptionalSession();

	if (vision) return null;
	if (!session) return children;
	const { subscription } = session.user;

	if (
		!subscription
		|| !subscription.active
		|| (["chargebee", "stripe"].includes(subscription.platform)
			&& (platform === "web" || !native))
		|| (subscription.platform === "ios" && platform === "apple" && native)
		|| (subscription.platform === "android" && platform === "android" && native)
	)
		return children;

	return null;
};
