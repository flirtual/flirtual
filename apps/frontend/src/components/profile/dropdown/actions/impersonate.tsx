import { VenetianMask } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Authentication } from "~/api/auth";
import type { User } from "~/api/user";
import { DropdownMenuItem } from "~/components/dropdown";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { evictQueries, invalidate, mutate, sessionKey } from "~/query";

export const ImpersonateAction: FC<{ user: User }> = ({ user }) => {
	const session = useOptionalSession();
	const toasts = useToast();
	const { t } = useTranslation();

	if (!session || !session.user.tags?.includes("admin")) return null;

	return (
		<DropdownMenuItem
			asChild
			disabled={
				!!user.bannedAt || (session.user.id === user.id && !session.sudoerId)
			}
		>
			<button
				className="w-full gap-2"
				type="button"
				onClick={async () => {
					if (session?.sudoerId) {
						const newSession = await Authentication.revokeImpersonate();
						await evictQueries();
						await invalidate();

						await mutate(sessionKey(), newSession);

						toasts.add(t("no_longer_impersonating_name", {
							name: user.profile.displayName || t("unnamed_user")
						}));

						return;
					}

					const newSession = await Authentication.impersonate(user.id);
					await evictQueries();
					await invalidate();

					await mutate(sessionKey(), newSession);

					toasts.add(t("impersonating_name", {
						name: user.profile.displayName || t("unnamed_user")
					}));
				}}
			>
				<VenetianMask className="size-5" />
				{session.sudoerId ? "Cancel Impersonation" : "Impersonate"}
			</button>
		</DropdownMenuItem>
	);
};
