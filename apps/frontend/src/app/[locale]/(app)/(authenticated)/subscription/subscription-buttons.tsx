import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { usePurchase } from "~/hooks/use-purchase";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const SubscriptionButtons: FC = () => {
	const session = useOptionalSession();
	const toasts = useToast();
	const { purchase } = usePurchase();
	const { native } = useDevice();
	const [pendingAction, setPendingAction] = useState<"manage" | "resubscribe" | null>(null);
	const { t } = useTranslation();

	if (!session) return null;

	const { subscription } = session.user;
	if (!subscription) return null;

	const showResubscribe = !!subscription.cancelledAt && subscription.plan.purchasable;
	const showManage = !subscription.cancelledAt || (subscription.platform === "chargebee" && !native);

	if (!showResubscribe && !showManage) return null;

	return (
		<div className="flex flex-wrap gap-2">
			{showResubscribe && (
				<Button
					disabled={pendingAction !== null}
					kind="primary"
					pending={pendingAction === "resubscribe"}
					size="sm"
					onClick={async () => {
						setPendingAction("resubscribe");
						await purchase(subscription.plan.id).catch(toasts.addError);
						setPendingAction(null);
					}}
				>
					{t("resubscribe")}
				</Button>
			)}
			{showManage && (
				<Button
					disabled={pendingAction !== null}
					kind={showResubscribe ? "secondary" : "primary"}
					pending={pendingAction === "manage"}
					size="sm"
					onClick={async () => {
						setPendingAction("manage");
						await purchase().catch(toasts.addError);
						setPendingAction(null);
					}}
				>
					{t("manage")}
				</Button>
			)}
		</div>
	);
};
