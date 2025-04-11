"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, useState, useTransition } from "react";

import { Button } from "~/components/button";
import {
	Dialog,
	DialogContent,
	DialogTitle
} from "~/components/dialog/dialog";
import { usePurchase } from "~/hooks/use-purchase";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ManageButton: FC = () => {
	const [session] = useSession();
	const toasts = useToast();
	const { purchase } = usePurchase();
	const [pending, startTransition] = useTransition();
	const t = useTranslations();

	const [manageUrl, setManageUrl] = useState<string | null>(null);
	if (!session) return null;

	const { subscription } = session.user;
	if (
		!subscription
		|| (subscription.cancelledAt && !subscription.plan.purchasable)
	)
		return null;

	return (
		<>
			{manageUrl && (
				<Dialog
					open
					onOpenChange={(open) => {
						if (open) return;
						setManageUrl(null);
					}}
				>
					<DialogTitle className="sr-only">{t("manage_subscription")}</DialogTitle>
					<DialogContent className="w-fit overflow-hidden p-0">
						{/* eslint-disable-next-line react-dom/no-missing-iframe-sandbox */}
						<iframe
							className="max-h-[90vh] max-w-full rounded-[1.25rem] bg-[#f4f5f9]"
							height={561}
							src={manageUrl}
							width={479}
						/>
					</DialogContent>
				</Dialog>
			)}
			<div>
				<Button
					disabled={pending}
					Icon={pending ? Loader2 : undefined}
					kind="primary"
					size="sm"
					onClick={async () => {
						startTransition(async () => {
							const url = await purchase(
								subscription.active ? undefined : subscription.plan.id
							).catch(toasts.addError);
							setManageUrl(url || null);
						});
					}}
				>
					{t(subscription.cancelledAt ? "resubscribe" : "manage")}
				</Button>
			</div>
		</>
	);
};
