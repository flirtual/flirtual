"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";

import { Button } from "~/components/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/dialog/dialog";
import { usePurchase } from "~/hooks/use-purchase";
import { useToast } from "~/hooks/use-toast";

import type { PlanCardProps } from "./plan-card";

export const PlanButtonLink: FC<
	{
		active: boolean;
		lifetime: boolean;
	} & PlanCardProps
> = (props) => {
	const { highlight, id, active, lifetime, disabled } = props;

	const toasts = useToast();
	const { purchase } = usePurchase();
	const [pending, startTransition] = useTransition();
	const t = useTranslations();

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
					<DialogTitle className="sr-only">{t("purchase")}</DialogTitle>
					<DialogContent className="w-fit overflow-hidden p-0">
						{/* eslint-disable-next-line react-dom/no-missing-iframe-sandbox */}
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
				className={twMerge("relative my-auto flex h-fit", !highlight && "vision:bg-white-10")}
				disabled={disabled || pending}
				Icon={pending ? Loader2 : undefined}
				iconClassName="animate-spin absolute left-2 h-5"
				kind={highlight ? "primary" : "secondary"}
				size="sm"
				onClick={() =>
					startTransition(async () => {
						const url = await purchase(id).catch(toasts.addError);
						setPurchaseUrl(url || null);
					})}
			>
				{t(active ? "manage" : lifetime ? "purchase" : "subscribe")}
			</Button>
		</>
	);
};
