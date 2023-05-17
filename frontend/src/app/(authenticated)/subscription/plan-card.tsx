import { twMerge } from "tailwind-merge";

import { withSession } from "~/server-utilities";

import { PlanButtonLink } from "./plan-button.link";

export interface PlanCardProps {
	id: string;
	duration: string;
	price: number;
	originalPrice?: number;
	discount?: number;
	highlight?: boolean;
	description?: string;
}

export async function PlanCard(props: PlanCardProps) {
	const { duration, price, originalPrice = props.price, discount, highlight, description } = props;
	const { user } = await withSession();

	const activePlan = (user.subscription?.active && user.subscription.plan.id === props.id) ?? false;

	const containerClassName = "grow shadow-brand-1";

	const inner = (
		<div
			className={twMerge(
				"relative flex flex-col justify-between gap-16 rounded-xl p-6",
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
							(duration === "Lifetime" ? "hidden" : "hidden sm:invisible sm:block")
					)}
				>
					{`$${originalPrice}`}
				</span>
				<span className="font-montserrat text-3xl font-semibold">${price}</span>
				<span className="mt-1 text-xl">{duration}</span>
			</div>
			{discount && (
				<div
					className="absolute right-0 top-0 flex aspect-square items-center justify-center rounded-tr-xl bg-brand-gradient p-3 text-white-20"
					style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)", margin: "-1px -1px 0 0" }}
				>
					<div className="origin-center -translate-y-3 translate-x-3 rotate-45">
						<span className="font-semibold">Save {discount}%</span>
					</div>
				</div>
			)}
			{description && <span>{description}</span>}
			<PlanButtonLink {...props} active={activePlan} lifetime={duration === "Lifetime"} />
		</div>
	);

	return highlight ? (
		<div className={twMerge("rounded-xl bg-brand-gradient p-1", highlight && containerClassName)}>
			{inner}
		</div>
	) : (
		inner
	);
}
