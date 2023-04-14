import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

export default function MentalHealthPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full sm:max-w-2xl" title="Mental health resources">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Crisis Hotlines</h1>
						<ul>
							<li>
								🌐{" "}
								<InlineLink href="https://wikipedia.org/wiki/List_of_suicide_crisis_lines">
									Wikipedia
								</InlineLink>
							</li>
							<li>
								🌐{" "}
								<InlineLink href="https://www.befrienders.org/">Befrienders Worldwide</InlineLink>
							</li>
							<li>
								🌐 <InlineLink href="https://findahelpline.com/">Find A Helpline</InlineLink>
							</li>
							<li>
								🌐{" "}
								<InlineLink href="https://faq.whatsapp.com/3243110509092762/">
									Global Suicide Hotline Resources
								</InlineLink>
							</li>
							<li>
								🇺🇸 🇬🇧 🇨🇦 🇮🇪{" "}
								<InlineLink href="https://www.crisistextline.org/">Crisis Textline</InlineLink>
							</li>
							<li>
								🇺🇸 National Suicide Hotline: ☎️{" "}
								<InlineLink href="tel:1-800-784-2433">1-800-784-2433</InlineLink>
							</li>
							<li>
								🇺🇸 The Trevor Project: ☎️{" "}
								<InlineLink href="tel:1-866-488-7386">1-866-488-7386</InlineLink>
							</li>
							<li>
								🇺🇸 Trans Lifeline: ☎️{" "}
								<InlineLink href="tel:1-877-565-8860">1-877-565-8860</InlineLink>
							</li>
							<li>
								🇬🇧 🇮🇪 the Samaritans: ☎️ <InlineLink href="tel:116123">116123</InlineLink>
							</li>
						</ul>
					</div>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Discord</h1>
						<p>
							<InlineLink href="https://discord.gg/advice">Chill & Advice</InlineLink>: Relationship
							and general advice, peer support or 1-on-1 with vetted advisors.
						</p>
					</div>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">VR/PC/iOS</h1>
						<p>
							<InlineLink href="https://www.inner.world/">Innerworld</InlineLink>: Peer support
							mental health groups in VR.
						</p>
					</div>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
