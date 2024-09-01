import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";
import { formatDate } from "~/date";
import { getSession } from "~/server-utilities";
import { api } from "~/api";

import { SuccessMessage } from "./success-message";
import { PlanList } from "./plan-list";
import { ManageButton } from "./manage-button";
import {
	MatchSubscriptionPlatform,
	PlatformMismatchMessage
} from "./platform-mismatch";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Premium"
};

export default async function SubscriptionPage() {
	const { user } = await getSession();
	const { subscription } = user;

	const totalUsers = await api.user.count();

	if (!user.emailConfirmedAt)
		redirect(urls.confirmEmail({ to: urls.subscription.default }));

	return (
		<ModelCard
			className="desktop:max-w-3xl"
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
							<Sparkles className="inline size-5" />
							<span>{subscription.plan.name}</span>
						</div>
						<span className="ml-5 pl-2 text-sm text-black-30 vision:text-white-50 dark:text-white-50">
							{subscription.cancelledAt
								? `Canceled on ${formatDate(subscription.cancelledAt)}`
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
							No more guesswork. Discover who&apos;s already interested in you,
							match faster and never miss a potential connection.
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
									(Check&nbsp;it&nbsp;out)
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
									(Check&nbsp;it&nbsp;out)
								</InlineLink>
							</span>
						</li>
					</ul>
				)}
				<MatchSubscriptionPlatform>
					<PlanList />
				</MatchSubscriptionPlatform>{" "}
			</div>
			<div className="flex flex-col gap-4">
				<p>
					Flirtual is still in its early days: we have{" "}
					<span className="font-semibold">
						{(Math.floor(totalUsers / 1000) * 1000).toLocaleString()} users
					</span>{" "}
					and growing, and we&apos;re always releasing new features and
					improving the platform. Offering Premium helps us pay for development
					and cover hosting costs.{" "}
					{subscription
						? "Thank you for supporting us!"
						: "If you like what we're doing, consider supporting us by subscribing!"}
				</p>
				{subscription?.active && subscription.platform === "stripe" ? (
					<p>
						You can cancel your subscription at any time by pressing the
						&quot;Cancel&quot; button above.
					</p>
				) : (
					<p>
						You can modify or cancel your subscription at any time by{" "}
						{!subscription?.active && <>coming back to this page and</>}{" "}
						pressing the &quot;Manage&quot; button.
					</p>
				)}
			</div>
			<div className="text-center">
				<InlineLink href={urls.resources.paymentTerms}>
					Payment Terms and Refund Policy
				</InlineLink>
			</div>
		</ModelCard>
	);
}
