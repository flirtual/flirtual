import { useTranslations } from "next-intl";

import { type User, displayName } from "~/api/user";

import { ModelCard } from "../model-card";

import { BlockedActions } from "./blocked-actions";

export const BlockedProfile: React.FC<{ user: User }> = ({ user }) => {
	const t = useTranslations("profile");

	return (
		<ModelCard
			title={t("merry_yummy_bulldog_quell")}
			containerProps={{
				className: "gap-8"
			}}
		>
			<span>
				{t.rich("giant_strong_thrush_startle", {
					displayName: displayName(user),
					highlight: (children) => (
						<span data-sentry-mask className="font-semibold">
							{children}
						</span>
					)
				})}
			</span>
			<BlockedActions user={user} />
		</ModelCard>
	);
};
