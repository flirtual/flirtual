import { Sparkles } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { Entitlement } from "~/api/subscription";
import { InlineLink } from "~/components/inline-link";
import { useSession } from "~/hooks/use-session";
import { useUserCount } from "~/hooks/use-user";
import { useLocale } from "~/i18n";
import { urls } from "~/urls";

import { PlanList } from "./plan-list";
import {
	MatchSubscriptionPlatform,
	VisionMessage
} from "./platform-mismatch";
import { EntitlementButtons } from "./subscription-buttons";
import { SuccessMessage } from "./success-message";

const EntitlementStatus: FC<{ entitlement: Entitlement }> = ({
	entitlement
}) => {
	const { t } = useTranslation();

	if (entitlement.renewalPending) return t("renewal_pending");

	if (!entitlement.active) {
		return entitlement.entitledUntil
			? t("canceled_on_date", { date: new Date(entitlement.entitledUntil) })
			: t("since_date", { date: new Date(entitlement.createdAt) });
	}

	// One-time entitlements don't expire.
	if (!entitlement.entitledUntil)
		return t("since_date", { date: new Date(entitlement.createdAt) });

	const days = Math.max(
		0,
		Math.ceil(
			(new Date(entitlement.entitledUntil).getTime() - Date.now()) / 86_400_000
		)
	);

	return t(entitlement.renews ? "renews_in_days" : "expires_in_days", {
		count: days
	});
};

export const SubscriptionForm: FC = () => {
	const [locale] = useLocale();
	const { t } = useTranslation();

	const { user } = useSession();
	const userCount = useUserCount();

	const entitlements = (user.entitlements ?? []).filter(
		(entitlement) => entitlement.kind !== "consumable"
	);

	const active = entitlements.filter((entitlement) => entitlement.active);

	// Everything they hold, or the most recently ended thing they held.
	const shown
		= active.length > 0
			? active
			: entitlements
					.toSorted(
						(a, b) =>
							new Date(b.entitledUntil ?? b.createdAt).getTime()
								- new Date(a.entitledUntil ?? a.createdAt).getTime()
					)
					.slice(0, 1);

	return (
		<>
			<SuccessMessage />
			<VisionMessage />
			{shown.length > 0 && (
				<div data-mask className="flex flex-col gap-4">
					<h1 className="text-2xl font-semibold">
						{t(active.length > 0 ? "active_subscription" : "inactive_subscription")}
					</h1>
					<div className="flex flex-col gap-6">
						{shown.map((entitlement) => (
							<div key={entitlement.id} className="flex flex-col gap-2">
								<div className="flex flex-col">
									<div className="flex items-center gap-2">
										<Sparkles className="inline size-5" />
										<span>{t(`attributes.${entitlement.plan.id}.name` as any)}</span>
									</div>
									<span className="ml-5 pl-2 text-sm text-black-30 vision:text-white-50 dark:text-white-50">
										<EntitlementStatus entitlement={entitlement} />
									</span>
								</div>
								<EntitlementButtons entitlement={entitlement} />
							</div>
						))}
					</div>
				</div>
			)}
			<div className="flex flex-col gap-8">
				{active.length > 0
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
									<InlineLink href={urls.discover("dates")}>
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
						number: new Intl.NumberFormat(locale).format(userCount)
					})}
					{" "}
					{entitlements.length > 0
						? t("basic_wide_ape_buy")
						: t("loved_many_raven_pout")}
				</p>
				<p>
					{t(active.length > 0 ? "lost_spare_millipede_nurture" : "cute_smug_ocelot_flip")}
				</p>
			</div>
			<div className="text-center">
				<InlineLink href={urls.resources.paymentTerms}>
					{t("payment_terms_and_refund_policy")}
				</InlineLink>
			</div>
		</>
	);
};
