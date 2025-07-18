import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { SupersededPolicy } from "~/components/superseded-policy";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("terms_outdated")
	};
}

export default function TermsPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			title={t("terms_outdated")}
		>
			<div className="flex flex-col gap-4">
				<SupersededPolicy
					current={urls.resources.termsOfService}
					introduced={new Date("2023-05-30")}
					superseded={new Date("2023-10-11")}
				/>
				<p>
					This website (the &quot;Website&quot;) is operated by STUDIO PAPRIKA,
					INC. (&quot;us&quot;, &quot;we&quot;, or &quot;Studio Paprika&quot;).
				</p>

				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Rules</h1>
					<p>In order to use this Website, you must:</p>
					<ol className="list-decimal pl-4">
						<li>be at least 18 years of age;</li>
						<li>
							be legally permitted to do so under United States and local laws;
						</li>
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
						<li>break local or United States law;</li>
						<li>solicit money from or defraud other Website users;</li>
						<li>
							impersonate any person or entity or post any images of another
							person without his or her permission;
						</li>
						<li>
							post any abusive, racist, sexist, derogatory, defamatory, illegal,
							NSFW, or otherwise harmful content to the site;
						</li>
						<li>harass any of the users on this platform;</li>
						<li>
							knowingly post malicious code, or links to malicious sites, that
							could harm other users;
						</li>
						<li>post spam on profiles;</li>
						<li>infringe on any copyright;</li>
						<li>
							use this service in order to damage Studio Paprika or the Website.
						</li>
					</ol>
				</div>

				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Safety</h1>
					<p>
						We advise you to use caution when interacting with other users of
						the website. We are not responsible for the behavior of users on or
						off of the website or for your interactions with other users. We do
						not screen users.
					</p>
				</div>
				<div className="flex flex-col gap-2">
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
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Third Party Services</h1>
					<p>Studio Paprika is not responsible for third-party services.</p>
				</div>
				<div className="flex flex-col gap-2">
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
						if
						you would like to appeal a moderation decision or have your data
						deleted early.
					</p>
					<p>Your data will be backed up regularly.</p>
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Security</h1>
					<p>
						The Website runs on infrastructure provided by third parties. This
						infrastructure is protected by industry standard security efforts
						such as firewalls.
					</p>
					<p>
						Your connection to the Website uses
						{" "}
						<InlineLink href="https://www.ssllabs.com/ssltest/analyze.html?d=flirtu.al&latest">
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
						webpages to which the Website links, and that link to the Website.
						We do not have any control over those non-Studio Paprika websites,
						and are not responsible for their contents or their use. By linking
						to a non-Studio Paprika website, Studio Paprika does not represent
						or imply that it endorses such website. You are responsible for
						taking precautions as necessary to protect yourself and your
						computer systems from viruses, worms, Trojan horses, and other
						harmful or destructive content. Studio Paprika disclaims any
						responsibility for any harm resulting from your use of non-Studio
						Paprika websites and webpages.
					</p>
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Disclaimers</h1>
					<p>
						In no event will Studio Paprika, or its suppliers or licensors, be
						liable with respect to any subject matter of this Agreement under
						any contract, negligence, strict liability or other legal or
						equitable theory for: (i) any special, incidental or consequential
						damages; (ii) the cost of procurement for substitute products or
						services; (iii) for interruption of use or loss or corruption of
						data; or (iv) for any amounts that exceed the fees paid by you to
						Studio Paprika under this Agreement during the twelve (12) month
						period prior to the cause of action. Studio Paprika shall have no
						liability for any failure or delay due to matters beyond their
						reasonable control. The foregoing shall not apply to the extent
						prohibited by applicable law.
					</p>
				</div>
			</div>
		</ModelCard>
	);
}
