"use client";

import { useTranslations } from "next-intl";
import type { Dispatch, FC, SetStateAction } from "react";
import { twMerge } from "tailwind-merge";

import { usePlans } from "~/hooks/use-plans";
import { usePurchase } from "~/hooks/use-purchase";
import { useOptionalSession } from "~/hooks/use-session";

import { PlanButtonLink } from "./plan-button-link";

export interface PlanCardProps {
	id: string;
	oneMonthId?: string;
	duration: string;
	disabled: boolean;
	setPurchasePending: Dispatch<SetStateAction<boolean>>;
	price: number;
	originalPrice?: number;
	discount?: number;
	highlight?: boolean;
	description?: string;
}

export const PlanCard: FC<PlanCardProps> = (props) => {
	const {
		id,
		oneMonthId,
		disabled,
		duration,
		price: webPrice,
		originalPrice: originalWebPrice = webPrice,
		discount: originalDiscount,
		highlight,
		description
	} = props;
	const session = useOptionalSession();
	const t = useTranslations();

	const { packages } = usePurchase();
	const plans = usePlans();

	const plan = plans?.find((p) => p.id === id);
	const currentPackage = packages.find(
		(p) => p.identifier === plan?.revenuecatId
	);
	const basePlan = plans?.find((p) => p.id === oneMonthId);
	const basePackage = packages.find(
		(p) => p.identifier === basePlan?.revenuecatId
	);

	const user = session?.user;
	if (!user) return null;

	const price = currentPackage ? currentPackage.product.price : webPrice;
	const displayPrice = currentPackage
		? currentPackage.product.priceString
		: `$${webPrice}`;
	const originalPrice
		= currentPackage && basePackage
			? (basePackage.product.price ?? 0)
			* Number.parseInt(
				currentPackage.product.subscriptionPeriod?.slice(1, 2) ?? "0"
			)
			: originalWebPrice;
	const discount
		= originalDiscount
			?? Math.round(((originalPrice - price) / originalPrice) * 100);

	const activePlan
		= (user.subscription?.active && user.subscription.plan.id === id)
			?? false;

	const containerClassName = "grow shadow-brand-1";

	const inner = (
		<div
			className={twMerge(
				"relative flex flex-col justify-between gap-16 rounded-xl p-6 vision:text-black-80",
				highlight
					? "bg-white-20 shadow-brand-inset dark:bg-black-80"
					: [
							containerClassName,
							"bg-white-25 vision:bg-white-25/70 dark:bg-black-80"
						],
				duration === "lifetime" && (description ? "gap-4" : "desktop:flex-row")
			)}
		>
			<div className="flex flex-col">
				<span
					className={twMerge(
						"font-montserrat text-sm font-semibold text-black-60 line-through dark:text-white-50",
						duration === "lifetime" && "hidden",
						duration !== "lifetime"
						&& price === originalPrice
						&& "hidden desktop:invisible desktop:block"
					)}
				>
					{originalPrice}
				</span>
				<span className="break-all font-montserrat text-3xl font-semibold">
					{displayPrice}
				</span>
				<span className="mt-1 text-xl">{duration}</span>
			</div>
			{!!discount && duration !== "lifetime" && (
				<div
					style={{
						clipPath: "polygon(100% 0, 0 0, 100% 100%)",
						margin: "-1px -1px 0 0"
					}}
					className="absolute right-0 top-0 flex aspect-square items-center justify-center rounded-tr-xl bg-brand-gradient p-3 text-white-20"
				>
					<div className="origin-center -translate-y-3 translate-x-3 rotate-45">
						<span className="font-semibold">
							{t("save_percent", { number: discount })}
						</span>
					</div>
				</div>
			)}
			{description && <span>{description}</span>}
			<PlanButtonLink
				{...props}
				active={activePlan}
				disabled={disabled}
				lifetime={duration === "lifetime"}
			/>
		</div>
	);

	return highlight
		? (
				<div
					className={twMerge(
						"rounded-2xl bg-brand-gradient p-1",
						highlight && containerClassName
					)}
				>
					{inner}
				</div>
			)
		: (
				inner
			);
};
