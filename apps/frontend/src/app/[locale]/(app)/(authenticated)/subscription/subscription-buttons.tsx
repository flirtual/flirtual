import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { Entitlement } from "~/api/subscription";
import { managedElsewhere } from "~/api/subscription";
import { premium } from "~/api/user";
import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { usePurchase } from "~/hooks/use-purchase";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import { EntitlementMismatch } from "./platform-mismatch";

export const EntitlementButtons: FC<{ entitlement: Entitlement }> = ({
	entitlement
}) => {
	const session = useOptionalSession();
	const toasts = useToast();
	const { purchase } = usePurchase();
	const { native, platform } = useDevice();
	const [pendingAction, setPendingAction] = useState<
		"manage" | "resubscribe" | null
	>(null);
	const { t } = useTranslation();

	if (!session) return null;

	const showResubscribe
		= !premium(session.user)
			&& !entitlement.active
			&& entitlement.kind === "subscription"
			&& entitlement.plan.purchasable;

	const mismatch = managedElsewhere(entitlement, platform, native);

	const storeUrl
		= entitlement.store === "app_store" || entitlement.store === "play_store"
			? urls.manageSubscription[entitlement.store]
			: null;

	const manage
		= mismatch
			? null
			: entitlement.store === "chargebee"
				? !native
						? () => purchase()
						: null
				: entitlement.active && storeUrl
					? native
						? () => purchase()
						: async () => void window.open(storeUrl, "_blank")
					: null;

	if (!showResubscribe && !manage && !mismatch) return null;

	return (
		<div className="flex flex-wrap gap-2">
			{mismatch && <EntitlementMismatch entitlement={entitlement} />}
			{showResubscribe && (
				<Button
					disabled={pendingAction !== null}
					kind="primary"
					pending={pendingAction === "resubscribe"}
					size="sm"
					onClick={async () => {
						setPendingAction("resubscribe");
						await purchase(entitlement.plan.id).catch(toasts.addError);
						setPendingAction(null);
					}}
				>
					{t("resubscribe")}
				</Button>
			)}
			{manage && (
				<Button
					disabled={pendingAction !== null}
					kind={showResubscribe ? "secondary" : "primary"}
					pending={pendingAction === "manage"}
					size="sm"
					onClick={async () => {
						setPendingAction("manage");
						await manage().catch(toasts.addError);
						setPendingAction(null);
					}}
				>
					{t("manage")}
				</Button>
			)}
		</div>
	);
};
