import { twMerge } from "tailwind-merge";

import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

interface Plan {
	duration: number;
	price: number;
	originalPrice?: number;
	discount?: number;
}

const PlanCard: React.FC<Plan & { highlight?: boolean }> = (props) => {
	const { duration, price, originalPrice = props.price, discount, highlight } = props;

	const containerClassName = "grow shadow-brand-1";

	const inner = (
		<div
			className={twMerge(
				"relative flex flex-col justify-between gap-8 rounded-xl p-6",
				highlight
					? "bg-white-20 dark:bg-black-80"
					: [containerClassName, "bg-white-25 dark:bg-black-80"]
			)}
		>
			<div className="flex flex-col">
				<span
					className={twMerge(
						"text-sm font-semibold text-black-60 line-through dark:text-white-50",
						price === originalPrice && "invisible"
					)}
				>
					{`$${originalPrice}`}
				</span>
				<span className="text-3xl font-semibold">${price}</span>
				<span>every {duration === 1 ? "month" : `${duration} months`}</span>
			</div>
			{discount && (
				<div
					className="absolute right-0 top-0 flex aspect-square items-center justify-center rounded-tr-xl bg-brand-gradient p-3 text-white-20"
					style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)", margin: "-1px -1px 0 0" }}
				>
					<div className="origin-center translate-x-3 -translate-y-3 rotate-45">
						<span className="font-semibold">Save {discount}%</span>
					</div>
				</div>
			)}
			<button
				type="button"
				className={twMerge(
					"focusable rounded-xl px-4 py-2 font-montserrat font-semibold",
					highlight ? "bg-brand-gradient text-white-20" : ""
				)}
			>
				Subscribe
			</button>
		</div>
	);

	return highlight ? (
		<div className={twMerge("rounded-xl bg-brand-gradient p-1 ", highlight && containerClassName)}>
			{inner}
		</div>
	) : (
		inner
	);
};

export default async function PremiumPage() {
	return (
		<SoleModelLayout containerProps={{ className: "gap-8" }} footer={{ desktopOnly: true }}>
			<>
				<ModelCard className="sm:max-w-3xl" containerProps={{ className: "gap-8" }} title="Premium">
					<ul className="list-inside list-disc">
						{[
							"See who likes you.",
							"Browse unlimited profiles.",
							"A shiny (optional) badge on your profile.",
							<span key="">
								Control your{" "}
								<InlineLink href={urls.settings.matchmaking()}>matchmaking algorithm</InlineLink>.
							</span>,
							"Experimental features as they are developed."
						].map((item, itemIdx) => (
							<li key={itemIdx}>{item}</li>
						))}
					</ul>
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:gap-4">
						{[
							{
								duration: 1,
								price: 9.99
							},
							{
								duration: 3,
								price: 24.99,
								originalPrice: 29.97,
								discount: 17,
								highlight: true
							},
							{
								duration: 6,
								originalPrice: 59.94,
								price: 39.99,
								discount: 33
							}
						].map((item, itemIdx) => (
							<PlanCard {...item} key={itemIdx} />
						))}
					</div>
					<p>
						Flirtual is still in its early days: we have 47000 users and growing, and we&apos;re
						always fixing and improving the platform. Offering Premium helps us pay for development
						and cover hosting costs. Thank you for supporting us!
					</p>
				</ModelCard>
			</>
		</SoleModelLayout>
	);
}
