"use client";

import { twMerge } from "tailwind-merge";
import { FC, useMemo } from "react";

import { useSession } from "~/hooks/use-session";
import { usePurchase } from "~/hooks/use-purchase";
import { useDevice } from "~/hooks/use-device";
import { usePlans } from "~/hooks/use-plans";

import { PlanButtonLink } from "./plan-button-link";

export interface PlanCardProps {
	id: string;
	oneMonthId?: string;
	duration: string;
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
		duration,
		price: stripePrice,
		originalPrice: originalStripePrice = stripePrice,
		discount,
		highlight,
		description
	} = props;
	const [session] = useSession();
	const { platform } = useDevice();

	const plans = usePlans();
	const plan = useMemo(() => plans.find((plan) => plan.id === id), [plans, id]);
	const oneMonthPlan = useMemo(
		() => plans.find((plan) => plan.id === oneMonthId),
		[plans, oneMonthId]
	);

	const { products } = usePurchase();
	const platformId = platform === "ios" ? plan?.appleId : plan?.googleId;
	const oneMonthPlatformId =
		platform === "ios" ? oneMonthPlan?.appleId : oneMonthPlan?.googleId;

	const product = platformId ? products[platformId] : null;
	const oneMonthProduct = oneMonthPlatformId
		? products[oneMonthPlatformId]
		: null;

	const user = session?.user;
	if (!user) return null;

	console.log(product);

	const price = product
		? product.pricing!.priceMicros! / 1_000_000
		: stripePrice;
	const originalPrice = product
		? ((oneMonthProduct?.pricing?.priceMicros ?? 0) / 1_000_000) *
		  Number.parseInt(product?.pricing?.billingPeriod?.slice(1, 2) ?? "0")
		: originalStripePrice;

	const activePlan =
		(user.subscription?.active && user.subscription.plan.id === props.id) ??
		false;

	const containerClassName = "grow shadow-brand-1";

	const inner = (
		<div
			className={twMerge(
				"relative flex select-none flex-col justify-between gap-16 rounded-xl p-6",
				highlight
					? "bg-white-20 dark:bg-black-80"
					: [containerClassName, "bg-white-25 dark:bg-black-80"],
				duration === "Lifetime" && (description ? "gap-4" : "sm:flex-row")
			)}
		>
			<div className="flex flex-col">
				<span
					className={twMerge(
						"font-montserrat text-sm font-semibold text-black-60 line-through dark:text-white-50",
						price === originalPrice &&
							(duration === "Lifetime"
								? "hidden"
								: "hidden sm:invisible sm:block")
					)}
				>
					{`$${originalPrice}`}
				</span>
				<span className="font-montserrat text-3xl font-semibold">{price}</span>
				<span className="mt-1 text-xl">{duration}</span>
			</div>
			{discount && (
				<div
					className="absolute right-0 top-0 flex aspect-square items-center justify-center rounded-tr-xl bg-brand-gradient p-3 text-white-20"
					style={{
						clipPath: "polygon(100% 0, 0 0, 100% 100%)",
						margin: "-1px -1px 0 0"
					}}
				>
					<div className="origin-center -translate-y-3 translate-x-3 rotate-45">
						<span className="font-semibold">Save {discount}%</span>
					</div>
				</div>
			)}
			{description && <span>{description}</span>}
			<PlanButtonLink
				{...props}
				active={activePlan}
				lifetime={duration === "Lifetime"}
			/>
		</div>
	);

	return highlight ? (
		<div
			className={twMerge(
				"rounded-xl bg-brand-gradient p-1",
				highlight && containerClassName
			)}
		>
			{inner}
		</div>
	) : (
		inner
	);
};
