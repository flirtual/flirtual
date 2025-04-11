import { VenetianMask } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC } from "react";

import { Authentication } from "~/api/auth";
import { displayName, type User } from "~/api/user";
import { DropdownMenuItem } from "~/components/dropdown";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ImpersonateAction: FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();
	const t = useTranslations();

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
