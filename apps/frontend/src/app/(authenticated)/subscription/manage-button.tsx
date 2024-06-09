"use client";

import { FC, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { useSession } from "~/hooks/use-session";
import { usePurchase } from "~/hooks/use-purchase";
import { Button } from "~/components/button";
import { useToast } from "~/hooks/use-toast";
import { Modal } from "~/components/modal";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { api } from "~/api";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "~/components/dialog/alert";
import { DialogFooter } from "~/components/dialog/dialog";

export const ManageButton: FC = () => {
	const [session] = useSession();
	const toasts = useToast();
	const { purchase } = usePurchase();
	const [pending, startTransition] = useTransition();

	const [manageUrl, setManageUrl] = useState<string | null>(null);

	if (!session) return null;

	const { subscription } = session.user;
	if (
		!subscription ||
		(subscription.cancelledAt && !subscription.plan.purchasable)
	)
		return null;

	if (subscription.platform === "stripe" && subscription.active) {
		return (
			<>
				<div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button kind="primary" size="sm">
								Cancel
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogDescription>
								Your subscription will be canceled at the end of your billing
								cycle.
							</AlertDialogDescription>
							<DialogFooter>
								<AlertDialogCancel asChild>
									<Button kind="tertiary" size="sm">
										Never mind
									</Button>
								</AlertDialogCancel>
								<AlertDialogAction asChild>
									<Button
										size="sm"
										onClick={async () => {
											await api.subscription
												.cancel()
												.then(() => {
													return toasts.add({
														duration: "long",
														value:
															"Your subscription has successfully been scheduled for cancellation."
													});
												})
												.catch(() => {
													toasts.add({
														type: "error",
														value:
															"Failed to cancel subscription, please contact us for assistance."
													});
												});
										}}
									>
										Cancel subscription
									</Button>
								</AlertDialogAction>
							</DialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
				<div className="font-bold">
					Subscription management is temporarily unavailable. If you need to
					update your billing details, first cancel your current subscription
					and then resubscribe. Please{" "}
					<InlineLink href={urls.resources.contactDirect}>
						contact us
					</InlineLink>{" "}
					if you need any assistance. Thank you for your understanding.
				</div>
			</>
		);
	}

	return (
		<>
			{manageUrl && (
				<Modal
					visible
					className="overflow-hidden p-0"
					onVisibilityChange={(open) => {
						if (open) return;
						setManageUrl(null);
					}}
				>
					<iframe
						className="max-h-[90vh] max-w-full"
						height={561}
						src={manageUrl}
						width={479}
					/>
				</Modal>
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
					{subscription.cancelledAt ? "Resubscribe" : "Manage"}
				</Button>
			</div>
		</>
	);
};
