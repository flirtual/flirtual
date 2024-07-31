import { VenetianMask } from "lucide-react";

import { api } from "~/api";
import { type User, displayName } from "~/api/user";
import { DropdownMenuItem } from "~/components/dropdown";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

import type { FC } from "react";

export const ImpersonateAction: FC<{ user: User }> = ({ user }) => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

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
						const newSession = await api.auth.revokeSudo();

						toasts.add(`No longer impersonating ${displayName(user)}`);
						await mutateSession(newSession);
						return;
					}

					const newSession = await api.auth.sudo({
						body: { userId: user.id }
					});

					toasts.add(`Impersonating ${displayName(user)}`);
					await mutateSession(newSession);
				}}
			>
				<VenetianMask className="size-5" />
				{session.sudoerId ? "Cancel Impersonation" : "Impersonate"}
			</button>
		</DropdownMenuItem>
	);
};
