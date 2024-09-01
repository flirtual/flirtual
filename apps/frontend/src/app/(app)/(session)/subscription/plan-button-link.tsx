"use client";

import { type FC, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Button } from "~/components/button";
import { usePurchase } from "~/hooks/use-purchase";
import { useToast } from "~/hooks/use-toast";
import { Dialog, DialogContent } from "~/components/dialog/dialog";

import type { PlanCardProps } from "./plan-card";

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
				<Dialog
					open
					onOpenChange={(open) => {
						if (open) return;
						setPurchaseUrl(null);
					}}
				>
					<DialogContent className="w-fit overflow-hidden p-0">
						<iframe
							className="max-h-[90vh] max-w-full rounded-[1.25rem] bg-[#f4f5f9]"
							height={561}
							src={purchaseUrl}
							width={479}
						/>
					</DialogContent>
				</Dialog>
			)}
			<Button
				className={twMerge("relative flex", !highlight && "vision:bg-white-10")}
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
