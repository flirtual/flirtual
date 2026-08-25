import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import type { Entitlement } from "~/api/subscription";
import { managedElsewhere, matchesPlatform } from "~/api/subscription";
import { activeEntitlements, premium } from "~/api/user";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

const osName = {
	apple: "ios",
	android: "android"
} as const;

const storeName = {
	app_store: "ios",
	play_store: "android"
} as const;

export const EntitlementMismatch: FC<{ entitlement: Entitlement }> = ({
	entitlement
}) => {
	const { platform, native } = useDevice();
	const { t } = useTranslation();

	if (platform === "web" || !managedElsewhere(entitlement, platform, native))
		return null;

	return (
		<span className="text-black-30 vision:text-white-50 dark:text-white-50">
			⚠️
			{" "}
			{entitlement.store === "chargebee"
				? t("gross_each_cobra_talk", {
						platform: t(osName[platform])
					})
				: t("caring_smug_felix_gleam", {
						currentPlatform: t(osName[platform]),
						otherPlatform: t(storeName[entitlement.store as keyof typeof storeName])
					})}
		</span>
	);
};

export const VisionMessage: FC = () => {
	const { vision } = useDevice();
	const session = useOptionalSession();
	const { t } = useTranslation();

	if (!vision || !session) return null;

	return (
		<div className="rounded-lg bg-brand-gradient px-6 py-4">
			<span className="font-montserrat text-lg text-white-10">
				{t(premium(session.user) ? "dull_steep_tadpole_grin" : "light_wacky_tadpole_enrich")}
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

	const entitlement = activeEntitlements(session.user).find(
		(entitlement) => entitlement.kind !== "consumable"
	);

	if (!entitlement) return children;
	if (entitlement.store === "promotional" || entitlement.store === "stripe")
		return null;

	return matchesPlatform(entitlement, platform, native) ? children : null;
};
