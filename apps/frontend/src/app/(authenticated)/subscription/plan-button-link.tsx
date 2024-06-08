"use client";

import { FC, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "~/components/button";
import { usePurchase } from "~/hooks/use-purchase";
import { useToast } from "~/hooks/use-toast";
import { Modal } from "~/components/modal";

import { PlanCardProps } from "./plan-card";

export const PlanButtonLink: FC<
	PlanCardProps & {
		active: boolean;
		lifetime: boolean;
	}
> = (props) => {
	const { highlight, id, active, lifetime } = props;

	const toasts = useToast();
	const { purchase } = usePurchase();
	const [pending, startTransition] = useTransition();

	const [purchaseUrl, setPurchaseUrl] = useState<string | null>(null);

	return (
		<>
			{purchaseUrl && (
				<Modal
					visible
					className="overflow-hidden p-0"
					onVisibilityChange={(open) => {
						if (open) return;
						setPurchaseUrl(null);
					}}
				>
					<iframe
						className="max-h-[90vh] max-w-full"
						height={561}
						src={purchaseUrl}
						width={479}
					/>
				</Modal>
			)}
			<Button
				className="relative flex"
				disabled={props.disabled || pending}
				Icon={pending ? Loader2 : undefined}
				iconClassName="animate-spin absolute left-2 h-5"
				kind={highlight ? "primary" : "secondary"}
				size="sm"
				onClick={() =>
					startTransition(async () => {
						const url = await purchase(id).catch(toasts.addError);
						setPurchaseUrl(url || null);
					})
				}
			>
				{active ? "Manage" : lifetime ? "Purchase" : "Subscribe"}
			</Button>
		</>
	);
};
