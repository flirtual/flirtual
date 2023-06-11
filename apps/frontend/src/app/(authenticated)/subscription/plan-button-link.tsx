"use client";

import { FC } from "react";

import { PlanCardProps } from "./plan-card";

import { ButtonLink } from "~/components/button";
import { api } from "~/api";
import { useProgressiveWebApp } from "~/hooks/use-pwa";
import { useToast } from "~/hooks/use-toast";

export const PlanButtonLink: FC<
	PlanCardProps & { active: boolean; lifetime: boolean }
> = (props) => {
	const { highlight, id, active, lifetime } = props;

	const toasts = useToast();
	const isPwa = useProgressiveWebApp();

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
					label:
						"Sorry, we cannot take payments in the app. Subscriptions can be purchased on our website using a desktop or mobile browser."
				});

				event.preventDefault();
			}}
		>
			{active ? "Manage" : lifetime ? "Purchase" : "Subscribe"}
		</ButtonLink>
	);
};
