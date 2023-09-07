"use client";

import { FC, useState } from "react";
import { Loader2 } from "lucide-react";

import { useSession } from "~/hooks/use-session";
import { usePurchase } from "~/hooks/use-purchase";
import { Button } from "~/components/button";

export const ManageButton: FC = () => {
	const [session] = useSession();
	const { purchase } = usePurchase();
	const [pending, setPending] = useState(false);

	if (!session) return null;

	const { subscription } = session.user;
	if (
		!subscription ||
		(subscription.cancelledAt && !subscription.plan.purchasable)
	)
		return null;

	return (
		<div className="flex gap-4">
			<Button
				disabled={pending}
				Icon={pending ? Loader2 : undefined}
				kind="primary"
				size="sm"
				onClick={() => {
					setPending(true);
					void purchase(subscription.plan.id).finally(() => setPending(false));
				}}
			>
				{subscription.cancelledAt ? "Resubscribe" : "Manage"}
			</Button>
		</div>
	);
};
