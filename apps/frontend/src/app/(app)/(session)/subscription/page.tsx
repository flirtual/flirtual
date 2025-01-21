import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { User } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { ManageButton } from "./manage-button";
import { PlanList } from "./plan-list";
import {
	MatchSubscriptionPlatform,
	PlatformMismatchMessage
} from "./platform-mismatch";
import { SuccessMessage } from "./success-message";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("premium")
	};
}

export default async function SubscriptionPage() {
	const t = await getTranslations();

	const [
		{
			user: { emailConfirmedAt, subscription }
		},
		userCount,
		formatter
	] = await Promise.all([
		Authentication.getSession(),
		User.getApproximateCount(),
		getFormatter()
	]);

	if (!emailConfirmedAt)
		redirect(urls.confirmEmail({ to: urls.subscription.default }));

	return (
		<ModelCard
			className="desktop:max-w-3xl"
			containerProps={{ className: "gap-8" }}
			title={t("flirtual_premium")}
		>
			<SuccessMessage />
			<PlatformMismatchMessage />
			{subscription && (
				<div data-mask className="flex flex-col gap-4">
					<h1 className="text-2xl font-semibold">
						{t(subscription.active ? "active_subscription" : "inactive_subscription")}
					</h1>
					<div className="flex flex-col">
						<div className="flex items-center gap-2">
							<Sparkles className="inline size-5" />
							<span>{t(`attributes.${subscription.plan.id}.name` as any)}</span>
						</div>
						<span className="ml-5 pl-2 text-sm text-black-30 vision:text-white-50 dark:text-white-50">
							{subscription.cancelledAt
								? t("canceled_on_date", { date: new Date(subscription.cancelledAt) })
								: t("since_date", { date: new Date(subscription.createdAt) })}
						</span>
					</div>
				</div>
			)}
			<MatchSubscriptionPlatform>
				<ManageButton />
			</MatchSubscriptionPlatform>
			<div className="flex flex-col gap-8">
				{subscription?.active
					? (
							<ul className="text-lg">
								<li>
									👀
									{" "}
									<InlineLink href={urls.likes}>
										{t("many_direct_chipmunk_sew")}
									</InlineLink>
								</li>
								<li>
									♾️
									{" "}
									<InlineLink href={urls.browse()}>
										{t("civil_active_nils_value")}
									</InlineLink>
								</li>
								<li>
									🎚️
									{" "}
									<InlineLink href={urls.settings.matchmaking()}>
										{t("sharp_calm_stork_cry")}
									</InlineLink>
								</li>
								<li>
									💃
									{" "}
									<InlineLink href={urls.settings.appearance}>
										{t("many_top_quail_embrace")}
									</InlineLink>
								</li>
							</ul>
						)
					: (
							<ul className="flex flex-col gap-4">
								<li className="flex flex-col">
									<span className="text-lg font-semibold">
										👀
										{" "}
										{t("many_direct_chipmunk_sew")}
									</span>
									{t("brave_late_dolphin_dart")}
								</li>
								<li className="flex flex-col">
									<span className="text-lg font-semibold">
										♾️
										{" "}
										{t("civil_active_nils_value")}
									</span>
									{t("flat_topical_hornet_nourish")}
								</li>
								<li className="flex flex-col">
									<span className="text-lg font-semibold">
										🎚️
										{" "}
										{t("sharp_calm_stork_cry")}
									</span>
									<span>
										{t("stock_zany_puma_gulp")}
										{" "}
										<InlineLink href={urls.settings.matchmaking()}>
											{t("check_this_out_for_free")}
										</InlineLink>
									</span>
								</li>
								<li className="flex flex-col">
									<span className="text-lg font-semibold">
										💃
										{" "}
										{t("many_top_quail_embrace")}
									</span>
									<span>
										{t("late_full_rat_stab")}
										{" "}
										<InlineLink href={urls.settings.appearance}>
											{t("check_this_out_for_free")}
										</InlineLink>
									</span>
								</li>
							</ul>
						)}
				<MatchSubscriptionPlatform>
					<PlanList />
				</MatchSubscriptionPlatform>
				{" "}
			</div>
			<div className="flex flex-col gap-4">
				<p>
					{t("drab_lucky_lemming_feel", {
						number: formatter.number(userCount)
					})}
					{" "}
					{subscription
						? t("basic_wide_ape_buy")
						: t("loved_many_raven_pout")}
				</p>
				<p>
					{t(subscription?.active ? "lost_spare_millipede_nurture" : "cute_smug_ocelot_flip")}
				</p>
			</div>
			<div className="text-center">
				<InlineLink href={urls.resources.paymentTerms}>
					{t("payment_terms_and_refund_policy")}
				</InlineLink>
			</div>
		</ModelCard>
	);
}
