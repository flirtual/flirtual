import { Metadata } from "next";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";

export const metadata: Metadata = {
	title: "Community Guidelines"
};

export default function GuidelinesPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full sm:max-w-2xl" title="Community Guidelines">
				<div className="flex flex-col gap-8">
					<p>
						We want Flirtual to be a positive, welcoming space for everyone. These community
						guidelines give more information on how we moderate user profiles and behaviour on
						Flirtual. Breaking these guidelines will result in account moderation, such as a
						permanent ban from Flirtual.
					</p>

					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Respect each other</h1>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								No hate speech or hateful actions against any group
							</h2>
							<p>
								This includes racist, sexist, or otherwise hateful symbols and content against
								certain groups in your Flirtual profile or conversations.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No harassment</h2>
							<p>
								This includes bullying, unsolicited sexual content, direct or indirect threats,
								doxxing, witch-hunts, stalking, or attacking other users on your profile.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								No spam, trolling, impersonation, misrepresentation, or scams
							</h2>
							<p>
								Do not try and take advantage of other users on Flirtual. Do not pretend that you
								are someone you are not.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No NSFW pictures</h2>
							<p>
								Full nudity is not allowed on Flirtual, for both in-person and avatar pictures. This
								includes no &quot;pasties&quot;, highly revealing clothing, or highly sexualized
								poses.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">Limited NSFW on a profile</h2>
							<p>
								Please avoid graphic NSFW text in your bio. The majority of your bio should also be
								SFW, not NSFW. Please limit NSFW words or phrases used in your profile. You are free
								to use the NSFW tags and non-graphic custom interests.
							</p>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Stay on topic</h1>
						<p className="italic">
							Flirtual is a platform for dating and making friends. The main purpose of your profile
							and behaviour on Flirtual should follow that.
						</p>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No solicitation</h2>
							<p>
								Do not ask other users for money or post monetized social links (e.g. PayPal). Do
								not advertise or market products or services on Flirtual.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								No controversial or highly political content
							</h2>
							<p>Please talk about politics/religion/controversial topics somewhere else.</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								No violent content or depictions of violence
							</h2>
							<p>
								Gore or violent pictures that shock people will be removed and may lead to a ban.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No pictures of children or minors</h2>
							<p>
								We do not tolerate content involving minors, such as real-life pictures of children.
								This is for the safety of users and children.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">Limited self-promotion</h2>
							<p>
								You can link non-payment-related social links in your bio (such as Instagram or
								Discord), but self-promotion or any promotion cannot be the main purpose of your
								Flirtual profile or account.{" "}
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No self-harm content</h2>
							<p>
								Self-harm content is not allowed on Flirtual. We have some{" "}
								<InlineLink href={urls.resources.mentalHealth}>mental health resources</InlineLink>{" "}
								that may be helpful.
							</p>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Respect Flirtual</h1>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No illegal activity</h2>
							<p>
								Do not do anything on Flirtual that breaks your local laws or the laws of the United
								States, where Flirtual is hosted.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No underage users </h2>
							<p>Flirtual is strictly 18+. </p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No duplicate accounts</h2>
							<p>Duplicate accounts will be banned. Your most active account will be kept.</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								Breaking Flirtual Community Guidelines outside of Flirtual
							</h2>
							<p>
								We can moderate users that break the Terms of Service or Community Guidelines on
								Flirtual. However, if rule-breaking happens on a different platform other than
								Flirtual, we may not have the power to moderate. If you see a Flirtual user breaking
								guidelines outside of Flirtual, feel free to report them on Flirtual, but make sure
								to report them on that platform too (e.g. Discord).
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">No attacking other users on your profile</h2>
							<p>
								Do not post the username or call out other Flirtual users in your bio. We handle
								moderation ourselves while respecting user privacy. You can flag a profile for our
								moderation team by pressing the &quot;Report&quot; button at the bottom of their
								profile.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">Do not abuse or damage Flirtual products</h2>
							<p>
								Misusing Flirtual or attempts to maliciously exploit Flirtual will be investigated.
								Good-faith vulnerability research in accordance with our Terms of Service is
								welcome, and bugs can be reported via{" "}
								<InlineLink href={urls.resources.vulnerabilityReport}>GitHub</InlineLink> or{" "}
								<InlineLink href={urls.resources.contactDirect}>email</InlineLink>.
							</p>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<p className="italic">
							If you see something against the rules or something that makes you feel unsafe, please
							let us know.
						</p>

						<div className="flex flex-col gap-1">
							<h3 className="font-semibold">Make a report</h3>
							<p>
								Press the &quot;Report&quot; button at the bottom of someone&apos;s profile to flag
								it for our moderation team. Please include any relevant information or evidence in
								your report.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h3 className="font-semibold">Moderation appeals</h3>
							<p>
								If your account has been banned, you will receive an email with the reason for your
								ban. If you would like to appeal this decision, please reply to the ban email. If
								you have not received a response to your appeal within 30 days, it has been reviewed
								and denied.
							</p>
						</div>

						<div className="flex flex-col gap-1">
							<h3 className="font-semibold">More info</h3>
							<ul>
								<li>
									<InlineLink href={urls.resources.termsOfService}>Terms of Service</InlineLink>
								</li>
								<li>
									<InlineLink href={urls.resources.privacyPolicy}>Privacy Policy</InlineLink>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
