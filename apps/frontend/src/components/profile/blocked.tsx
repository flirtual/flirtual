import { useTranslations } from "next-intl";

import { displayName, type User } from "~/api/user";

import { ModelCard } from "../model-card";
import { BlockedActions } from "./blocked-actions";

export const BlockedProfile: React.FC<{ user: User }> = ({ user }) => {
	const t = useTranslations("profile");

	return (
		<ModelCard
			containerProps={{
				className: "gap-8"
			}}
			title={t("merry_yummy_bulldog_quell")}
		>
			<span>
				{t.rich("giant_strong_thrush_startle", {
					displayName: displayName(user),
					highlight: (children) => (
						<span data-mask className="font-semibold">
							{children}
						</span>
					)
				})}
			</span>
			<BlockedActions user={user} />
		</ModelCard>
	);
};
