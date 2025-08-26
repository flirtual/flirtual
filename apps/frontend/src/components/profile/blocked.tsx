import { Trans, useTranslation } from "react-i18next";

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
				<Trans
					components={{
						highlight: <span data-mask className="font-semibold" />
					}}
					i18nKey="giant_strong_thrush_startle"
					values={{ name: user.profile.displayName || t("unnamed_user") }}
				/>
			</span>
			<BlockedActions user={user} />
		</ModelCard>
	);
};
