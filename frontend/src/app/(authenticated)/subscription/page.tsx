import { SparklesIcon } from "@heroicons/react/24/solid";
import { Metadata } from "next";

import { api } from "~/api";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";
import { withSession } from "~/server-utilities";
import { formatDate } from "~/date";

import { SuccessMessage } from "./success-message";
import { PlanCard } from "./plan-card";

export const metadata: Metadata = {
	title: "Subscription"
};

export default async function SubscriptionPage() {
	const { user } = await withSession();
	const { subscription } = user;

	return (
		<SoleModelLayout containerProps={{ className: "gap-8" }} footer={{ desktopOnly: true }}>
			<ModelCard
				className="sm:max-w-3xl"
				containerProps={{ className: "gap-8" }}
				title="Flirtual Premium"
			>
				<SuccessMessage />
				{subscription && (
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">
							{subscription.active ? "Active" : "Inactive"} Subscription
						</h1>
						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<SparklesIcon className="inline h-5 w-5" />
								<span>{subscription.plan.name}</span>
							</div>
							<span className="ml-5 pl-2 text-sm text-black-30 dark:text-white-50">
								{subscription.cancelledAt
									? `Cancelled on ${formatDate(subscription.cancelledAt)}`
									: `Since ${formatDate(subscription.updatedAt)}`}
							</span>
						</div>
						<div className="mt-2 flex gap-4">
							{subscription.active ? (
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
									href={api.subscription.checkoutUrl(subscription.plan.id)}
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
					{subscription?.plan.id !== "ccd77191-c9aa-4b01-859d-e6475a87e82e" && (
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:gap-4">
							{[
								{
									id: "cea4b769-ad78-4b8a-bbcc-da7685ec8eb8",
									duration: "every 1 month",
									price: 9.99
								},
								{
									id: "8026d1d7-dd88-46c2-866c-55d11447e0da",
									duration: "every 3 months",
									price: 24.99,
									originalPrice: 29.97,
									discount: 17,
									highlight: true
								},
								{
									id: "d494397e-8485-454c-ae9a-77d74c7b53b3",
									duration: "every 6 months",
									originalPrice: 59.94,
									price: 39.99,
									discount: 33
								}
							].map((item) => {
								// @ts-expect-error: Server Component
								return <PlanCard {...item} key={item.id} />;
							})}
							{/* @ts-expect-error: Server Component */}
							<PlanCard
								discount={user.tags?.includes("legacy_vrlfp") ? 50 : undefined}
								duration="Lifetime"
								id="ccd77191-c9aa-4b01-859d-e6475a87e82e"
								originalPrice={99.99}
								price={user.tags?.includes("legacy_vrlfp") ? 49.99 : 99.99}
							/>
						</div>
					)}
				</div>
				<p>
					Flirtual is still in its early days: we have 50000 users and growing, and we&apos;re
					always fixing and improving the platform. Offering Premium helps us pay for development
					and cover hosting costs. Thank you for supporting us!
				</p>
			</ModelCard>
		</SoleModelLayout>
	);
}
