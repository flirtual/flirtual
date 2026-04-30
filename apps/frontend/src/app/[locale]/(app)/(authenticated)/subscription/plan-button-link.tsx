import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Button } from "~/components/button";
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
	const { t } = useTranslation();

	return (
		<Button
			className={twMerge("relative my-auto flex", !highlight && "vision:bg-white-10")}
			disabled={disabled || pending}
			Icon={pending ? Loader2 : undefined}
			iconClassName="animate-spin absolute left-2 h-5"
			kind={highlight ? "primary" : "secondary"}
			size="sm"
			onClick={() =>
				startTransition(async () => {
					await purchase(id).catch(toasts.addError);
				})}
		>
			{t(active ? "manage" : lifetime ? "purchase" : "subscribe")}
		</Button>
	);
};
