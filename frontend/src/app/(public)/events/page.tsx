import { Metadata } from "next";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";
import { Image } from "~/components/image";

import { DiscordEmbed } from "./discord-embed";

export const metadata: Metadata = {
	title: "Events"
};

export default function EventsPage() {
	return (
		<SoleModelLayout>
			<ModelCard
				className="w-full sm:max-w-2xl"
				containerProps={{ className: "gap-8" }}
				title="Events"
			>
				<div className="flex flex-col gap-4">
					<h1 className="text-2xl font-semibold">VRChat invite</h1>
					<p>If an event is happening now, this button will take you there!</p>
					<p>
						Start VRChat first and then click &quot;invite me&quot; on the next page. You&apos;ll
						get an invite from yourself in-game.{" "}
						<InlineLink href="https://discord.com/channels/455219574036496404/829507992743444531/1018385627022106715">
							Need help joining?
						</InlineLink>
					</p>
					<ButtonLink href={urls.resources.invite}>Join event</ButtonLink>
				</div>
				<div className="flex flex-col gap-4">
					<h1 className="text-2xl font-semibold">Upcoming events</h1>
					<p>
						We host speed matching and DJ events every weekend in VRChat, and you&apos;re invited!
					</p>
					<p>
						For our event schedule and announcements,{" "}
						<InlineLink href={urls.socials.discord}>join our Discord server</InlineLink>.
					</p>
					<DiscordEmbed />
				</div>
				<div className="flex flex-col gap-4">
					<h1 className="text-2xl font-semibold">VRChat worlds</h1>
					<p>
						Our weekly events are hosted in our VRChat worlds, but you can join them anytime! Feel
						free to use them for your own events too.
					</p>
					<Image
						alt="Flirtual Speed Dating"
						className="w-full max-w-sm rounded-xl shadow-brand-1"
						height={900}
						src={urls.media("b593e4e1-bef3-4ab8-b9ea-74628ebf694b")}
						width={1200}
					/>
					<h2 className="text-xl font-semibold">Flirtual Speed Dating</h2>
					<p>
						Get to know people in 1-on-1 speed dating/friend-making rounds. Each round is 3 minutes
						long (the host can choose a round length from 3-7 minutes). Conversation prompts,
						interest tags, and night mode included.
					</p>
					<ButtonLink href="/speeddate">Flirtual Speed Dating</ButtonLink>
					<Image
						alt="The Flirtual Club"
						className="w-full max-w-sm rounded-xl shadow-brand-1"
						height={900}
						src={urls.media("660c7e75-9634-45d1-a306-628eeef0a620")}
						width={1200}
					/>
					<h2 className="text-xl font-semibold">The Flirtual Club</h2>
					<p>Outdoor music festival with audiolink. Vibe on.</p>
					<ButtonLink href="/club">The Flirtual Club</ButtonLink>
					<p>
						Created by <InlineLink href="https://www.faxmashine.com/">Faxmashine</InlineLink>, our
						worlds are compatible with PCVR, Quest, and Desktop. New to VRChat?{" "}
						<InlineLink href="https://vrchat.com/">Sign up for free.</InlineLink>
					</p>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
