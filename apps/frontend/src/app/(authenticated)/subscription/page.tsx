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
import { PlanList } from "./plan-list";

export const metadata: Metadata = {
	title: "Subscription"
};

export default async function SubscriptionPage() {
	const { user } = await withSession();
	const { subscription } = user;

	return (
		<SoleModelLayout
			containerProps={{ className: "gap-8" }}
			footer={{ desktopOnly: true }}
		>
			<ModelCard
				className="sm:max-w-3xl"
				containerProps={{ className: "gap-8" }}
				title="Flirtual Premium"
			>
				<SuccessMessage />
				{subscription && (
					<div data-sentry-mask className="flex flex-col gap-4">
						<h1 className="select-none text-2xl font-semibold">
							{subscription.active ? "Active" : "Inactive"} Subscription
						</h1>
						<div className="flex select-none flex-col">
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
				<div className="flex flex-col gap-8">
					{subscription?.active ? (
						<ul className="select-none text-xl">
							<li>
								👀{" "}
								<InlineLink href={urls.likes}>
									See who likes you before you match
								</InlineLink>
							</li>
							<li>
								♾️{" "}
								<InlineLink href={urls.browse()}>
									Browse unlimited profiles
								</InlineLink>
							</li>
							<li>
								🎚️{" "}
								<InlineLink href={urls.settings.matchmaking()}>
									Control your matchmaking priorities
								</InlineLink>
							</li>
						</ul>
					) : (
						<ul className="flex select-none flex-col gap-4">
							<li className="flex flex-col">
								<span className="text-lg font-semibold">
									👀 See who likes you before you match
								</span>
								No more guesswork. Discover who&apos;s already interested in
								you, match faster and never miss a potential connection.
							</li>
							<li className="flex flex-col">
								<span className="text-lg font-semibold">
									♾️ Browse unlimited profiles
								</span>
								Can&apos;t get enough of us? Remove the daily limit and browse a
								wider range of profiles, whenever you want.
							</li>
							<li className="flex flex-col">
								<span className="text-lg font-semibold">
									🎚️ Control your matchmaking priorities
								</span>
								<span>
									Sometimes one size doesn&apos;t fit all. Customize your
									algorithm to find exactly the right people for you.{" "}
									<InlineLink href={urls.settings.matchmaking()}>
										(Check it out)
									</InlineLink>
								</span>
							</li>
						</ul>
					)}
					<PlanList />
				</div>
				<p className="select-none">
					Flirtual is still in its early days: we have 50000 users and growing,
					and we&apos;re always fixing and improving the platform. Offering
					Premium helps us pay for development and cover hosting costs. Thank
					you for supporting us!
				</p>
			</ModelCard>
		</SoleModelLayout>
	);
}
