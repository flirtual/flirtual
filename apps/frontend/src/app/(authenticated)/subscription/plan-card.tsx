"use client";

import { twMerge } from "tailwind-merge";
import { Dispatch, FC, SetStateAction } from "react";

import { useSession } from "~/hooks/use-session";
import { usePurchase } from "~/hooks/use-purchase";
import { usePlans } from "~/hooks/use-plans";
import { useDevice } from "~/hooks/use-device";

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
		duration,
		price: stripePrice,
		originalPrice: originalStripePrice = stripePrice,
		discount: originalDiscount,
		highlight,
		description
	} = props;
	const [session] = useSession();

	const { packages } = usePurchase();
	const { native } = useDevice();
	const plans = usePlans();

	const plan = plans?.find((p) => p.id === props.id);
	const currentPackage = packages.find(
		(p) => p.identifier === plan?.revenuecatId
	);
	const basePlan = plans?.find((p) => p.id === props.oneMonthId);
	const basePackage = packages.find(
		(p) => p.identifier === basePlan?.revenuecatId
	);

	const user = session?.user;
	if (!user) return null;

	const price = currentPackage ? currentPackage.product.price : stripePrice;
	const displayPrice = currentPackage
		? currentPackage.product.priceString
		: `$${stripePrice}`;
	const originalPrice =
		currentPackage && basePackage
			? (basePackage.product.price ?? 0) *
			  Number.parseInt(
					currentPackage.product.subscriptionPeriod?.slice(1, 2) ?? "0"
			  )
			: originalStripePrice;
	const discount =
		originalDiscount ??
		Math.round(((originalPrice - price) / originalPrice) * 100);

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
						currentPackage &&
							currentPackage?.identifier === basePackage?.identifier &&
							"hidden sm:invisible sm:block",
						duration === "Lifetime" && "hidden"
					)}
				>
					{originalPrice}
				</span>
				<span className="font-montserrat text-3xl font-semibold">
					{displayPrice}
				</span>
				<span className="mt-1 text-xl">{duration}</span>
			</div>
			{!!discount && (
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
				disabled={props.disabled}
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
