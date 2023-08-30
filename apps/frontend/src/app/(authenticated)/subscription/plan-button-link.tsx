"use client";

import { FC, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "~/components/button";
import { usePurchase } from "~/hooks/use-purchase";

import { PlanCardProps } from "./plan-card";

export const PlanButtonLink: FC<
	PlanCardProps & {
		active: boolean;
		lifetime: boolean;
	}
> = (props) => {
	const { highlight, id, active, lifetime } = props;

	const { purchase } = usePurchase();
	const [pending, setPending] = useState(false);

	return (
		<Button
			className="relative flex"
			disabled={props.disabled || pending}
			Icon={pending ? Loader2 : undefined}
			iconClassName="animate-spin absolute left-2 h-5"
			kind={highlight ? "primary" : "secondary"}
			size="sm"
			onClick={() => {
				setPending(true);
				void purchase(id).finally(() => setPending(false));
			}}
		>
			{active ? "Manage" : lifetime ? "Purchase" : "Subscribe"}
		</Button>
	);
};
