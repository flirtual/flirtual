"use client";

import { Dispatch, FC, SetStateAction } from "react";

import { ButtonLink } from "~/components/button";
import { api } from "~/api";
import { useProgressiveWebApp } from "~/hooks/use-pwa";
import { useToast } from "~/hooks/use-toast";

import { PlanCardProps } from "./plan-card";

export const PlanButtonLink: FC<
	PlanCardProps & {
		active: boolean;
		lifetime: boolean;
		// product: Product | null;
		setPurchasePending: Dispatch<SetStateAction<boolean>>;
	}
> = (props) => {
	const { highlight, id, active, lifetime } = props;

	const toasts = useToast();
	const isPwa = useProgressiveWebApp();

	// const [pending, setPending] = useState(false);

	/* useEffect(() => {
		setPurchasePending(pending);
	}, [pending, setPurchasePending]); */

	/* if (product) {
		return (
			<Button
				disabled={props.disabled || pending}
				kind={highlight ? "primary" : "secondary"}
				size="sm"
				onClick={async () => {
					setPending(true);
					const offer = product.getOffer();

					if (!offer) {
						toasts.addError("Unknown product offer");
						return;
					}

					if (!offer.canPurchase) {
						toasts.addError("Cannot purchase product offer");
						return;
					}

					const error = await offer.order().catch((reason) => reason);
					if (error) toasts.addError(error);
					setPending(false);
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
			kind={highlight ? "primary" : "secondary"}
			size="sm"
			target="_self"
			href={
				active
					? api.subscription.manageUrl().toString()
					: api.subscription.checkoutUrl(id).toString()
			}
			onClick={(event) => {
				if (!isPwa) return;
				toasts.add({
					type: "warning",
					value:
						"Sorry, we cannot take payments in the app. Subscriptions can be purchased on our website using a desktop or mobile browser."
				});

				event.preventDefault();
			}}
		>
			{active ? "Manage" : lifetime ? "Purchase" : "Subscribe"}
		</ButtonLink>
	);
};
