"use client";

import React from "react";
import { twMerge } from "tailwind-merge";
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { api } from "~/api";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { useSessionUser } from "~/hooks/use-session";
import { urls } from "~/urls";

interface Plan {
	id: string;
	duration: number;
	price: number;
	originalPrice?: number;
	discount?: number;
}

const PlanCard: React.FC<Plan & { highlight?: boolean }> = (props) => {
	const { duration, price, originalPrice = props.price, discount, highlight } = props;

	const user = useSessionUser();
	if (!user) return null;

	const activePlan = (user.subscription?.active && user.subscription.plan.id === props.id) ?? false;

	const containerClassName = "grow shadow-brand-1";

	const inner = (
		<div
			className={twMerge(
				"relative flex flex-col justify-between gap-16 rounded-xl p-6",
				highlight
					? "bg-white-20 dark:bg-black-80"
					: [containerClassName, "bg-white-25 dark:bg-black-80"]
			)}
		>
			<div className="flex flex-col">
				<span
					className={twMerge(
						"font-montserrat text-sm font-semibold text-black-60 line-through dark:text-white-50",
						price === originalPrice && "invisible"
					)}
				>
					{`$${originalPrice}`}
				</span>
				<span className="font-montserrat text-3xl font-semibold">${price}</span>
				<span>every {duration === 1 ? "month" : `${duration} months`}</span>
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
			<ButtonLink
				href={activePlan ? api.subscription.manageUrl() : api.subscription.checkoutUrl(props.id)}
				kind={highlight ? "primary" : "secondary"}
				size="sm"
				target="_self"
			>
				{activePlan ? "Manage" : "Subscribe"}
			</ButtonLink>
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

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "long",
		day: "2-digit",
		year: "numeric"
	});
}

export default function SubscriptionPage() {
	const searchParams = useSearchParams();

	const user = useSessionUser();
	if (!user) return null;

	return (
		<SoleModelLayout containerProps={{ className: "gap-8" }} footer={{ desktopOnly: true }}>
			<ModelCard
				className="sm:max-w-3xl"
				containerProps={{ className: "gap-8" }}
				title="Flirtual Premium"
			>
				{searchParams.has("success") && (
					<div className="flex gap-4 overflow-hidden rounded-xl bg-brand-gradient px-1">
						<div className="flex w-full flex-col gap-4 rounded-xl bg-white-25 p-6 dark:bg-black-80">
							<div className="relative">
								<h1 className="text-xl font-semibold">We&apos;ve received your order.</h1>
								<Link className="absolute right-0 top-0" href={urls.subscription}>
									<XMarkIcon className="h-6 w-6" />
								</Link>
							</div>
							<div className="flex flex-col">
								<span>Your subscription should now be applied to your account.</span>
								<span>
									If your subscription is missing or you need any other help, please{" "}
									<InlineLink href={urls.resources.contact}>contact us</InlineLink>.
								</span>
							</div>
						</div>
					</div>
				)}
				{user.subscription && (
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">
							{user.subscription.active ? "Active" : "Inactive"} Subscription
						</h1>
						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<SparklesIcon className="inline h-5 w-5" />
								<span>{user.subscription.plan.name}</span>
							</div>
							<span className="ml-5 pl-2 text-sm text-black-30 dark:text-white-50">
								{user.subscription.cancelledAt
									? `Cancelled on ${formatDate(user.subscription.cancelledAt)}`
									: `Since ${formatDate(user.subscription.updatedAt)}`}
							</span>
						</div>
						<div className="mt-2 flex gap-4">
							{user.subscription.active ? (
								<ButtonLink
									href={api.subscription.manageUrl()}
									kind="primary"
									size="sm"
									target="_self"
								>
									Manage
								</ButtonLink>
							) : (
								<ButtonLink
									href={api.subscription.checkoutUrl(user.subscription.plan.id)}
									kind="primary"
									size="sm"
									target="_self"
								>
									Resubscribe
								</ButtonLink>
							)}
						</div>
					</div>
				)}
				<div className="flex flex-col gap-4">
					<ul className="list-inside list-disc">
						{[
							"See who likes you before you match.",
							"Browse unlimited profiles.",
							<span key="">
								<InlineLink href={urls.settings.matchmaking()}>
									Control your matchmaking priorities
								</InlineLink>
								.
							</span>
						].map((item, itemIdx) => (
							<li key={itemIdx}>{item}</li>
						))}
					</ul>
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:gap-4">
						{[
							{
								id: "cea4b769-ad78-4b8a-bbcc-da7685ec8eb8",
								duration: 1,
								price: 9.99
							},
							{
								id: "8026d1d7-dd88-46c2-866c-55d11447e0da",
								duration: 3,
								price: 24.99,
								originalPrice: 29.97,
								discount: 17,
								highlight: true
							},
							{
								id: "d494397e-8485-454c-ae9a-77d74c7b53b3",
								duration: 6,
								originalPrice: 59.94,
								price: 39.99,
								discount: 33
							}
						].map((item) => (
							<PlanCard {...item} key={item.id} />
						))}
					</div>
				</div>

				<p>
					Flirtual is still in its early days: we have 47000 users and growing, and we&apos;re
					always fixing and improving the platform. Offering Premium helps us pay for development
					and cover hosting costs. Thank you for supporting us!
				</p>
			</ModelCard>
		</SoleModelLayout>
	);
}
