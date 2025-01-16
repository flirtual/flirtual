import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("payment_terms")
	};
}

export default async function PaymentsPage() {
	const t = await getTranslations();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("payment_terms")}>
			<div className="select-children flex flex-col gap-4">
				<MachineTranslatedLegal original="/payments?language=en" />
				<p>
					California subscribers: you may cancel your subscription and request a
					refund at any time before midnight of the third business day following
					the date you purchased any Premium subscription. If you subscribed
					through your Apple ID, refunds are handled by Apple. Please visit
					{" "}
					<InlineLink href="https://getsupport.apple.com">
						Apple Support
					</InlineLink>
					{" "}
					to request a refund. If you subscribed through our website or Google
					Play, please
					{" "}
					<InlineLink href={urls.resources.contactDirect}>
						contact us
					</InlineLink>
					{" "}
					to request a refund. Please use your Flirtual account email address in
					your refund request.
				</p>

				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Subscriptions</h1>
					<p>
						Subscriptions automatically renew until you cancel. To avoid being
						charged for a new subscription period, you must cancel your
						subscription as outlined below before the current subscription
						period ends. Deleting your account does not cancel Apple ID or
						Google Play subscriptions. Uninstalling the app from your device
						does not cancel your subscription, or delete your account.
					</p>
					<p>
						To cancel your subscription, log in to your account, click/tap your
						profile icon in the corner, then &quot;Premium&quot;, then the
						&quot;Manage&quot; button.
					</p>
					<p>
						If you subscribed through your Apple ID, you can also cancel your
						subscription through the App Store, or contact
						{" "}
						<InlineLink href="https://getsupport.apple.com">
							Apple Support
						</InlineLink>
						{" "}
						for help.
					</p>
					<p>
						If you subscribed through Google Play, you can also cancel your
						subscription through Google Play, or contact
						{" "}
						<InlineLink href="https://support.google.com/googleplay">
							Google Play Support
						</InlineLink>
						{" "}
						for help.
					</p>
					<p>
						After canceling your subscription, you can continue using the
						service until the end of your current subscription term. The
						subscription will not renew.
					</p>
					<p>
						If you initiate a chargeback or reverse a payment, Flirtual may
						immediately terminate your account and assume you no longer want the
						subscription. If the chargeback is overturned, please
						{" "}
						<InlineLink href={urls.resources.contactDirect}>
							contact us
						</InlineLink>
						{" "}
						within 30 days to resume your subscription.
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Account deletion</h1>
					<p>
						You can delete your account at any time by logging in to Flirtual,
						clicking/tapping on your profile icon in the corner, then
						&quot;Settings&quot;, then &quot;Deactivate account&quot;, then
						&quot;Permanently delete your account&quot;.
					</p>
					<p>
						Flirtual reserves the right to investigate and, if necessary,
						suspend or terminate your account without a refund, or prevent you
						from accessing Flirtual, if it believes you have violated our
						{" "}
						<InlineLink href={urls.resources.termsOfService}>
							Terms of Service
						</InlineLink>
						{" "}
						or
						{" "}
						<InlineLink href={urls.resources.communityGuidelines}>
							Community Guidelines
						</InlineLink>
						, misused Flirtual, or engaged in behavior deemed inappropriate or
						unlawful, on or off Flirtual.
					</p>
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Refunds</h1>
					<p>
						Generally, all purchases, including but not limited to Flirtual
						Premium subscriptions, are non-refundable. Special terms for refunds
						apply in the EU, EEA, UK, Switzerland, Korea, Israel, Arizona,
						California, Colorado, Connecticut, Illinois, Iowa, Minnesota, New
						York, North Carolina, Ohio, Rhode Island, and Wisconsin.
					</p>
					<p>
						For subscribers residing in the EU, EEA, UK, and Switzerland: In
						accordance with local law, you are entitled to a full refund within
						14 days after your subscription begins. This 14-day period starts
						when the subscription starts.
					</p>
					<p>
						For subscribers residing in Germany: You may terminate your
						subscription after it has renewed with a one-month notice period.
						Your right to terminate for cause will not be affected.
					</p>
					<p>
						For subscribers and purchasers of Virtual Items residing in the
						Republic of Korea: In accordance with local law, you are entitled to
						a full refund of your subscription and/or unused Virtual Items
						within 7 days following the purchase. This 7-day period starts
						immediately upon the purchase.
					</p>
					<p>
						For subscribers residing in Arizona, California, Colorado,
						Connecticut, Illinois, Iowa, Minnesota, New York, North Carolina,
						Ohio, Rhode Island, Wisconsin, and Israel: You may cancel your
						subscription without penalty or obligation at any time before
						midnight on the third business day after the date you subscribed
						(excluding Sundays and holidays). If you pass away before the end of
						your subscription period, your estate is entitled to a refund for
						the portion of the subscription payment applicable to the period
						after your death. If you become disabled and unable to use Flirtual
						before the end of your subscription period, you are entitled to a
						refund for the portion of the subscription payment applicable to the
						period after your disability, by providing the company notice in the
						same manner as requesting a refund as described below.
					</p>
					<p>
						In addition to canceling your subscription, you must request a
						refund in order to receive one. If you subscribed through your Apple
						ID, refunds are handled by Apple. Please visit
						{" "}
						<InlineLink href="https://getsupport.apple.com">
							Apple Support
						</InlineLink>
						{" "}
						to request a refund, or visit the App Store, click/tap on your Apple
						ID, then &quot;Purchase history&quot;, find the transaction for your
						Flirtual subscription, and click/tap &quot;Report Problem&quot; to
						request a refund. If you subscribed through our website or Google
						Play, please
						{" "}
						<InlineLink href={urls.resources.contactDirect}>
							contact us
						</InlineLink>
						{" "}
						to request a refund. Please use your Flirtual account email address
						in your refund request.
					</p>
					<p>
						By using our app and making in-app purchases, you consent to our
						sharing of data regarding your usage and consumption of purchased
						content with Apple, as part of our efforts to resolve refund
						requests. This information may include details about how you have
						accessed and interacted with the purchased content. The purpose of
						sharing this data is to help Apple make an informed decision
						regarding refund requests. We ensure that such data sharing is done
						in compliance with Apple's policies and only as necessary to process
						your requests.
					</p>
				</div>
			</div>
		</ModelCard>
	);
}
