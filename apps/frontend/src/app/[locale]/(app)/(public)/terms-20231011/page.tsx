import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { PolicyDates } from "~/components/policy-dates";
import { siteOrigin } from "~/const";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	const superseded = new Date("2025-12-04");
	const isOutdated = superseded < new Date();
	const titleKey = isOutdated ? "terms_outdated" : "terms_of_service";

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t(titleKey) }) }
	]);
};

export default function TermsPage() {
	const { t } = useTranslation();

	const superseded = new Date("2025-12-04");
	const isOutdated = superseded < new Date();
	const titleKey = isOutdated ? "terms_outdated" : "terms_of_service";

	return (
		<ModelCard
			className="select-children w-full desktop:max-w-2xl"
			containerProps={{ className: "gap-4" }}
			title={t(titleKey)}
		>
			<PolicyDates
				introduced={new Date("2023-10-11")}
				otherPolicy={urls.resources.termsOfService}
				superseded={superseded}
			/>
			<p>
				This service (the &apos;Service&apos;) is operated by ROVR LABS INC.,
				doing business as Flirtual (&apos;us&apos;, &apos;we&apos;, or
				&apos;Flirtual&apos;).
			</p>
			<h1 className="text-2xl font-semibold">Rules</h1>
			<p>In order to use this Service, you must:</p>
			<ol className="list-decimal pl-4">
				<li>be at least 18 years of age;</li>
				<li>be legally permitted to do so under Canadian and local laws</li>
				<li>have never been convicted of a felony;</li>
				<li>
					not be required to register as a sex offender on any government
					registry;
				</li>
				<li>
					agree to be bound by these Terms of Service and our
					{" "}
					<InlineLink href={urls.resources.privacyPolicy}>
						Privacy Policy
					</InlineLink>
					.
				</li>
			</ol>
			<p>You agree not to:</p>
			<ol className="list-decimal pl-4">
				<li>break local or Canadian law;</li>
				<li>solicit money from or defraud other users;</li>
				<li>
					impersonate any person or entity or post any images of another
					person without his or her permission;
				</li>
				<li>
					post any abusive, racist, sexist, derogatory, defamatory, illegal,
					NSFW, or otherwise harmful content to the Service;
				</li>
				<li>harass any of the users on this platform;</li>
				<li>
					knowingly post malicious code, or links to malicious sites, that
					could harm other users;
				</li>
				<li>post spam on profiles;</li>
				<li>infringe on any copyright;</li>
				<li>use this service in order to damage Flirtual or the Service.</li>
			</ol>
			<p>
				Please review our
				{" "}
				<InlineLink href={urls.resources.communityGuidelines}>
					Community Guidelines
				</InlineLink>
				{" "}
				for more information on how we moderate user profiles and behavior
				on the Service. Breaking these guidelines will result in account
				moderation, such as a permanent ban from the Service. We reserve the
				right to moderate accounts at our discretion.
			</p>
			<h1 className="text-2xl font-semibold">Safety</h1>
			<p>
				We advise you to use caution when interacting with other users of
				the Service. We are not responsible for the behavior of users on or
				off of the Service or for your interactions with other users. We do
				not screen users.
			</p>
			<h1 className="text-2xl font-semibold">Privacy</h1>
			<p>
				You authorize us to use and display certain information about you.
				Please see our
				{" "}
				<InlineLink href={urls.resources.privacyPolicy}>
					Privacy Policy
				</InlineLink>
				{" "}
				for more information.
			</p>
			<h1 className="text-2xl font-semibold">Third Party Services</h1>
			<p>Flirtual is not responsible for third-party services.</p>
			<h1 className="text-2xl font-semibold">Rights</h1>
			<p>
				You can close your account at any time in your
				{" "}
				<InlineLink href={urls.settings.deleteAccount}>
					account settings
				</InlineLink>
				.
			</p>
			<p>
				You will be given advance notice of any changes to these terms or
				any new features that affect privacy.
			</p>
			<p>
				Moderation decisions will be made by our moderation team. You have
				the right to receive an explanation if your profile is modified or
				your account is cancelled for violation of these Terms of Use. You
				do not have the right to receive advance notice of these changes to
				your account.
			</p>
			<p>
				If your account is cancelled for violation of these Terms of Use,
				your data will be kept for 30 days so that we can review moderation
				decisions and reverse them if necessary. Please
				{" "}
				<InlineLink href={urls.resources.contact}>contact us</InlineLink>
				{" "}
				if you would like to appeal a moderation decision or have your data
				deleted early.
			</p>
			<p>Your data will be backed up regularly.</p>
			<h1 className="text-2xl font-semibold">Security</h1>
			<p>
				The Service runs on infrastructure provided by third parties. This
				infrastructure is protected by industry standard security efforts
				such as firewalls.
			</p>
			<p>
				Your connection to the Service uses
				{" "}
				<InlineLink
					href={`https://www.ssllabs.com/ssltest/analyze.html?d=${siteOrigin}&latest`}
				>
					strong transport encryption
				</InlineLink>
				.
			</p>
			<p>Your password is stored securely hashed and salted.</p>
			<p>
				You are responsible for keeping your account password safe. You are
				responsible for all activities that occur with your account
				credentials.
			</p>
			<p>
				Despite best efforts, there is no such thing as perfect security
				online. We do not guarantee the absolute protection of your data.
			</p>
			<p>
				We have not reviewed, and cannot review, all of the material,
				including computer software, made available through the websites and
				webpages to which the Service links, and that link to the Service.
				We do not have any control over those non-Flirtual websites, and are
				not responsible for their contents or their use. By linking to a
				non-Flirtual website, Flirtual does not represent or imply that it
				endorses such website. You are responsible for taking precautions as
				necessary to protect yourself and your computer systems from
				viruses, worms, Trojan horses, and other harmful or destructive
				content. Flirtual disclaims any responsibility for any harm
				resulting from your use of non-Flirtual websites and webpages.
			</p>
			<h1 className="text-2xl font-semibold">Disclaimers</h1>
			<p>
				In no event will Flirtual, or its suppliers or licensors, be liable
				with respect to any subject matter of this Agreement under any
				contract, negligence, strict liability or other legal or equitable
				theory for: (i) any special, incidental or consequential damages;
				(ii) the cost of procurement for substitute products or services;
				(iii) for interruption of use or loss or corruption of data; or (iv)
				for any amounts that exceed the fees paid by you to Flirtual under
				this Agreement during the twelve (12) month period prior to the
				cause of action. Flirtual shall have no liability for any failure or
				delay due to matters beyond their reasonable control. The foregoing
				shall not apply to the extent prohibited by applicable law.
			</p>
		</ModelCard>
	);
}
