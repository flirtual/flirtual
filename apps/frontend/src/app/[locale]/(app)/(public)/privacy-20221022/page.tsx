import { useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { SupersededPolicy } from "~/components/superseded-policy";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("privacy_policy_outdated") }
	]);
};

export default function PrivacyPage() {
	const { t } = useTranslation();

	const privacySettingLink = (
		<InlineLink href={urls.settings.privacy}>privacy settings</InlineLink>
	);

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "gap-4" }}
			title={t("privacy_policy_outdated")}
		>
			<SupersededPolicy
				current={urls.resources.privacyPolicy}
				introduced={new Date("2022-10-22")}
				superseded={new Date("2023-06-05")}
			/>
			<p>
				Your username, your display name, your profile pictures, your bio, your
				age, your gender, your matchmaking preferences, your personal interest
				tags, your selected VR apps/games, and whether or not you are new to VR
				will be visible to other users. Your additional profile information
				(including your sexuality, NSFW tags, country, linked accounts, etc.)
				will be visible or hidden to other users depending on your
				{" "}
				{privacySettingLink}
				, which you can modify at any time. Your personality
				traits (which we identify based on your answers to our personality
				questionnaire) will be visible or hidden to other users depending on
				your
				{" "}
				{privacySettingLink}
				, but your specific questionnaire answers will
				not be visible.
			</p>
			<p>
				We use Matomo Analytics for secure, on-premises data analytics. We may
				share anonymized statistics about Flirtual (for example, the number of
				users that use a particular Social VR app or game). You can opt out of
				these statistics in your
				{" "}
				{privacySettingLink}
				.
			</p>
			<p>
				Your messages and message history with other users are hosted by and
				shared with TalkJS, but will not be shared with other third-parties.
			</p>

			<p>
				Your account email will not be shown to other users. Your account email
				may be accessed by TalkJS in order to deliver message notifications via
				email, but will not be shared with other third-parties. You may opt out
				of
				{" "}
				<InlineLink href={urls.settings.notifications}>
					message email notifications
				</InlineLink>
				, which will remove your email address from TalkJS&apos; records.
			</p>
			<p>
				If you suspect your account has been compromised, please
				{" "}
				<InlineLink href={urls.settings.password}>
					change your password
				</InlineLink>
				{" "}
				immediately and
				{" "}
				<InlineLink href={urls.resources.contact}>report the issue</InlineLink>
				{" "}
				with the word &apos;URGENT&apos; in the subject line. In the message,
				include your username, the last time you accessed the site, and any
				details that led you to suspect a break-in.
			</p>
			<p>Your password is stored hashed and salted.</p>
			<p>
				The Website runs on a virtualized server hosted in the United States by
				Google LLC. For additional information regarding Google&apos;s privacy
				practices, please review the
				{" "}
				<InlineLink href="https://cloud.google.com/terms/cloud-privacy-notice">
					Google Cloud Privacy Notice
				</InlineLink>
				{" "}
				and
				{" "}
				<InlineLink href="https://policies.google.com/privacy">
					Privacy Policy
				</InlineLink>
				.
			</p>
			<p>
				We employ the third-party services of Cloudflare, Redis Labs, Amazon Web
				Services, Uploadcare, TalkJS, and Elasticsearch to enable, secure, and
				improve our services and performance. For additional information
				regarding Cloudflare&apos;s privacy practices, please review their
				{" "}
				<InlineLink href="https://www.cloudflare.com/privacypolicy/">
					Privacy Policy
				</InlineLink>
				. For additional information regarding Redis Labs’ privacy practices,
				please review their
				{" "}
				<InlineLink href="https://redislabs.com/wp-content/uploads/2020/08/privacy-policy.pdf">
					Privacy Policy
				</InlineLink>
				. For additional information regarding Amazon Web Services’ privacy
				practices, please review their
				{" "}
				<InlineLink href="https://aws.amazon.com/compliance/data-privacy/">
					Data Privacy Center
				</InlineLink>
				. For additional information regarding Uploadcare’s privacy practices,
				please review their
				{" "}
				<InlineLink href="https://uploadcare.com/about/privacy-policy/">
					Privacy Policy
				</InlineLink>
				. For additional information regarding TalkJS&apos; privacy practices,
				please review their
				{" "}
				<InlineLink href="https://talkjs.com/terms">
					Terms of Service
				</InlineLink>
				. For additional information regarding Elasticsearch&apos;s privacy
				practices, please review their
				{" "}
				<InlineLink href="https://www.elastic.co/legal/privacy-statement">
					Privacy Statement
				</InlineLink>
				.
			</p>
			<p>
				If you find a vulnerability or privacy leak, please report it to us
				discreetly via
				{" "}
				<InlineLink href={urls.resources.vulnerabilityReport}>
					GitHub
				</InlineLink>
				{" "}
				or
				{" "}
				<InlineLink href={urls.resources.contactDirect}>email</InlineLink>
				.
			</p>
			<p>
				You can review data that we have on file in your
				{" "}
				<InlineLink href={urls.settings.list()}>account settings</InlineLink>
				,
				and in your messages. You can request all of your data that we have on
				file by emailing us, and will receive it within 30 days.
			</p>
		</ModelCard>
	);
}
