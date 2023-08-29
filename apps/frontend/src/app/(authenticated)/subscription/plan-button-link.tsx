"use client";

import { FC, useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { CapacitorPurchases } from "@capgo/capacitor-purchases";
import { useRouter } from "next/navigation";

import { ButtonLink } from "~/components/button";
import { api } from "~/api";
import { usePlans } from "~/hooks/use-plans";
import { urls } from "~/urls";
import { useDevice } from "~/hooks/use-device";
import { useToast } from "~/hooks/use-toast";

import { PlanCardProps } from "./plan-card";

export const PlanButtonLink: FC<
	PlanCardProps & {
		active: boolean;
		lifetime: boolean;
	}
> = (props) => {
	const { highlight, id, active, lifetime } = props;

	const router = useRouter();
	const { native } = useDevice();
	const toasts = useToast();

	const plans = usePlans();
	const plan = useMemo(() => plans.find((plan) => plan.id === id), [plans, id]);

	const [pending, setPending] = useState(false);

	const purchase = useCallback(async () => {
		if (!plan || !plan.googleId || !plan.appleId || !plan.revenuecatId)
			throw new Error("Plan not available yet");

		const options = {
			identifier: plan?.revenuecatId,
			offeringIdentifier: "default"
		};

		console.log("Attempting purchase", plan.name, options);
		setPending(true);

		await CapacitorPurchases.purchasePackage(options)
			.then(() => {
				setPending(false);

				router.refresh();
				return router.push(urls.subscription.success);
			})
			.catch((reason) => {
				toasts.addError(reason);
				setPending(false);
			});
	}, [plan, router, toasts]);

	/* if (plan) {
		return (
			<Button
				disabled={props.disabled || pending}
				kind={highlight ? "primary" : "secondary"}
				size="sm"
				onClick={async () => {
					console.log("click");
				}}
			>
				{active ? "Manage" : lifetime ? "Purchase" : "Subscribe"}
				{pending && (
					<Loader2 className="absolute right-12 h-4 w-4 animate-spin" />
				)}
			</Button>
		);
	} */

	return (
		<ButtonLink
			disabled={props.disabled || pending}
			kind={highlight ? "primary" : "secondary"}
			size="sm"
			target="_self"
			href={
				active
					? api.subscription.manageUrl().toString()
					: api.subscription.checkoutUrl(id).toString()
			}
			onClick={(event) => {
				if (!native) return;

				event.preventDefault();
				void purchase();
			}}
		>
			{active ? "Manage" : lifetime ? "Purchase" : "Subscribe"}
			{pending && (
				<Loader2 className="absolute right-12 h-4 w-4 animate-spin" />
			)}
		</ButtonLink>
	);
};
