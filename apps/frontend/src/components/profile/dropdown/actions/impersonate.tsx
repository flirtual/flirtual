import { VenetianMask } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Authentication } from "~/api/auth";
import { displayName } from "~/api/user";
import type { User } from "~/api/user";
import { DropdownMenuItem } from "~/components/dropdown";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ImpersonateAction: FC<{ user: User }> = ({ user }) => {
	const session = useOptionalSession();
	const navigate = useNavigate();
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
						await Authentication.revokeImpersonate();

						toasts.add(t("no_longer_impersonating_name", { name: displayName(user) }));
						router.refresh();
						return;
					}

					await Authentication.impersonate(user.id);

					toasts.add(t("impersonating_name", { name: displayName(user) }));
					router.refresh();
				}}
			>
				<VenetianMask className="size-5" />
				{session.sudoerId ? "Cancel Impersonation" : "Impersonate"}
			</button>
		</DropdownMenuItem>
	);
};
