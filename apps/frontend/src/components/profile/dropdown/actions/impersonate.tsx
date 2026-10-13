import { VenetianMask } from "lucide-react";
import type { FC } from "react";

import type { User } from "~/api/user";
import { DropdownMenuItem } from "~/components/dropdown";
import { impersonate, revokeImpersonate, useOptionalSession } from "~/hooks/use-session";

export const ImpersonateAction: FC<{ user: User }> = ({ user }) => {
	const session = useOptionalSession();

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
				onClick={() => session.sudoerId ? revokeImpersonate() : impersonate(user.id)}
			>
				<VenetianMask className="size-5" />
				{session.sudoerId ? "Cancel Impersonation" : "Impersonate"}
			</button>
		</DropdownMenuItem>
	);
};
