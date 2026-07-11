import { Gift } from "lucide-react";
import type { FC } from "react";

import { promotionalPlanId } from "~/api/plan";
import { User } from "~/api/user";
import { DropdownMenuItem } from "~/components/dropdown";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey, userKey } from "~/query";

export const PromotionalPremiumAction: FC<{ user: User }> = ({ user }) => {
	const session = useOptionalSession();
	const toasts = useToast();

	if (!session || !session.user.tags?.includes("admin")) return null;

	const active = !!user.subscription?.active;
	const isPromotional = user.subscription?.plan.id === promotionalPlanId;

	const hasPromotional = active && isPromotional;
	const hasOtherActiveSubscription = active && !isPromotional;

	return (
		<DropdownMenuItem asChild disabled={hasOtherActiveSubscription}>
			<button
				className="w-full gap-2"
				type="button"
				onClick={async () => {
					try {
						await (hasPromotional
							? User.revokePromotionalPremium(user.id)
							: User.grantPromotionalPremium(user.id));
					}
					catch (reason) {
						await toasts.addError(reason);
						return;
					}

					await invalidate({ queryKey: userKey(user.id) });
					if (user.id === session.user.id)
						await invalidate({ queryKey: sessionKey() });

					toasts.add(
						hasPromotional
							? "Revoked Promotional Premium"
							: "Granted Promotional Premium"
					);
				}}
			>
				<Gift className="size-5" />
				{hasPromotional
					? "Revoke Promotional Premium"
					: "Grant Promotional Premium"}
			</button>
		</DropdownMenuItem>
	);
};
