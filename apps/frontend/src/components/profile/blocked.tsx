import { useTranslation } from "react-i18next";

import { displayName } from "~/api/user";
import type { User } from "~/api/user";

import { ModelCard } from "../model-card";
import { BlockedActions } from "./blocked-actions";

export const BlockedProfile: React.FC<{ user: User }> = ({ user }) => {
	const { t } = useTranslation();

	return (
		<ModelCard
			containerProps={{
				className: "gap-8"
			}}
			title={t("account_blocked")}
		>
			<span>
				{t.rich("giant_strong_thrush_startle", {
					name: displayName(user),
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
