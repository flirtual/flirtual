import { SparklesIcon } from "@heroicons/react/24/solid";

import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";
import { formatDate } from "~/date";
import { withSession } from "~/server-utilities";
import { api } from "~/api";

import { SuccessMessage } from "./success-message";
import { PlanList } from "./plan-list";
import { ManageButton } from "./manage-button";
import {
	MatchSubscriptionPlatform,
	PlatformMismatchMessage
} from "./platform-mismatch";

export default async function SubscriptionPage() {
	const { user } = await withSession();
	const { subscription } = user;

	const totalUsers = await api.user.count();

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
				<PlatformMismatchMessage />
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
					</div>
				)}
				<MatchSubscriptionPlatform>
					<ManageButton />
				</MatchSubscriptionPlatform>
				<div className="flex flex-col gap-8">
					{subscription?.active ? (
						<ul className="select-none text-lg">
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
							<li>
								💅{" "}
								<InlineLink href={urls.settings.appearance}>
									Customize your profile colors
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
							<li className="flex flex-col">
								<span className="text-lg font-semibold">
									💅 Customize your profile colors
								</span>
								<span>
									Stand out from the crowd! Pick a custom color scheme for your
									profile to show off your style and make a memorable first
									impression.{" "}
									<InlineLink href={urls.settings.appearance}>
										(Check it out)
									</InlineLink>
								</span>
							</li>
						</ul>
					)}
					<MatchSubscriptionPlatform>
						<PlanList />
					</MatchSubscriptionPlatform>{" "}
				</div>
				<p>
					Flirtual is still in its early days: we have{" "}
					<span className="font-semibold">
						{Math.floor(totalUsers / 1000) * 1000} users
					</span>{" "}
					and growing, and we&apos;re always releasing new features and
					improving the platform. Offering Premium helps us pay for development
					and cover hosting costs.{" "}
					{subscription
						? "Thank you for supporting us!"
						: "If you like what we're doing, consider supporting us by subscribing!"}
				</p>
			</ModelCard>
		</SoleModelLayout>
	);
}
