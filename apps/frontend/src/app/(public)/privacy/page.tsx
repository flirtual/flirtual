import { Metadata } from "next";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";

export const metadata: Metadata = {
	title: "Privacy Policy"
};

export default function PrivacyPage() {
	const privacySettingLink = (
		<InlineLink href={urls.settings.privacy}>privacy settings</InlineLink>
	);

	return (
		<SoleModelLayout>
			<ModelCard
				className="w-full sm:max-w-2xl"
				containerProps={{ className: "gap-4" }}
				title="Privacy Policy"
			>
				<p>
					Your username, your display name, your profile pictures, your bio,
					your age, your gender, your matchmaking preferences, your personal
					interest tags, your selected VR apps/games, and whether or not you are
					new to VR will be visible to other users. Your additional profile
					information (including your sexuality, NSFW tags, country, linked
					accounts, etc.) will be visible or hidden to other users depending on
					your {privacySettingLink}, which you can modify at any time. Your
					personality traits (which we identify based on your answers to our
					personality questionnaire) will be visible or hidden to other users
					depending on your {privacySettingLink}, but your specific
					questionnaire answers will not be visible.
				</p>
				<p>
					We use first-party, on-premises data analytics. We may share
					anonymized statistics about Flirtual (for example, the number of users
					that use a particular Social VR app or game). You can opt out of these
					statistics in your {privacySettingLink}.
				</p>
				<p>
					Your messages and message history with other users are hosted by and
					shared with TalkJS, but will not be shared with other third-parties.
				</p>

				<p>
					Your account email will not be shown to other users. Your account
					email may be accessed by third parties in order to deliver
					transactional, marketing, and support messages according to your
					preferences. You may opt out of{" "}
					<InlineLink href={urls.settings.notifications}>
						message email notifications
					</InlineLink>
					, which will remove your email address from TalkJS&apos; records.
				</p>
				<p>
					If you suspect your account has been compromised, please{" "}
					<InlineLink href={urls.settings.changePassword}>
						change your password
					</InlineLink>{" "}
					immediately and{" "}
					<InlineLink href={urls.resources.contact}>
						report the issue
					</InlineLink>{" "}
					with the word &apos;URGENT&apos; in the subject line. In the message,
					include your username, the last time you accessed the site, and any
					details that led you to suspect a break-in.
				</p>
				<p>Your password is stored hashed and salted.</p>
				<p>
					We use certain trusted third parties that provide services to
					Flirtual. We may share user personal data with these third parties,
					but only for the purpose of providing their services. For more
					information and examples, see below.
				</p>
				<p>
					<strong>Cloud Hosting Services:</strong> to provide reliable and
					secure infrastructure for managing and operating our platform (for
					example, Fly.io and Vercel).
				</p>
				<p>
					<strong>In-App Functionality Services:</strong> to facilitate key
					features such as messaging and optimized image hosting within our app
					(for example, TalkJS).
				</p>
				<p>
					<strong>Billing Services:</strong> to manage payments and
					subscriptions (for example, Stripe).
				</p>
				<p>
					<strong>Social Media Services:</strong> to allow users to connect
					their accounts with our platform and facilitate social interactions
					(for example, Discord).
				</p>
				<p>
					<strong>Security and Performance Services:</strong> to safeguard our
					platform, protect our users, and enhance overall performance (for
					example, Cloudflare).
				</p>
				<p>
					<strong>Insight and Improvement Services:</strong> to gather user
					feedback and perform analytics for continual improvement of our
					platform (for example, Canny).
				</p>
				<p>
					<strong>Communication Services:</strong> to assist with sending
					transactional and marketing communications to users (for example,
					Amazon Web Services).
				</p>
				<p>
					<strong>Moderation Services:</strong> to ensure appropriate conduct
					within the app and maintain community standards (for example, Google
					Cloud).
				</p>
				<p>
					<strong>IT Services:</strong> to assist in various operations of our
					business, such as when a user interacts with our support services,
					which may involve processing users&apos; personal data (for example,
					Freshworks).
				</p>
				<p>
					We review third parties we engage with to ensure they have adequate
					data protection and information security measures in place. We take
					measures to protect and anonymize data shared with third parties, as
					appropriate given the nature of the services provided. We only provide
					trusted third parties with the personal data necessary for the service
					they are providing.
				</p>
				<p>
					If you find a vulnerability or privacy leak, please report it to us
					discreetly via{" "}
					<InlineLink href={urls.resources.vulnerabilityReport}>
						GitHub
					</InlineLink>{" "}
					or <InlineLink href={urls.resources.contactDirect}>email</InlineLink>.
				</p>
				<p>
					You can review data that we have on file in your{" "}
					<InlineLink href={urls.settings.list()}>account settings</InlineLink>,
					and in your messages. You can request all of your data that we have on
					file by emailing us, and will receive it within 30 days.
				</p>
			</ModelCard>
		</SoleModelLayout>
	);
}
