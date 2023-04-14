"use client";

import WidgetBot from "@widgetbot/react-embed";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

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
					<WidgetBot
						channel="862116319700582440"
						height="600"
						server="455219574036496404"
						width="100%"
					/>
				</div>
				<div className="flex flex-col gap-4">
					<h1 className="text-2xl font-semibold">VRChat worlds</h1>
					<p>
						Our weekly events are hosted in our VRChat worlds, but you can join them anytime! Feel
						free to use them for your own events too.
					</p>
					<img className="max-w-sm rounded-xl shadow-brand-1" src="/images/speeddate.png" />
					<h2 className="text-xl font-semibold">Flirtual Speed Dating</h2>
					<p>
						Get to know people in 1-on-1 speed dating/friend-making rounds. Each round is 3 minutes
						long (the host can choose a round length from 3-7 minutes). Conversation prompts,
						interest tags, and night mode included.
					</p>
					<ButtonLink href="/speeddate">Flirtual Speed Dating</ButtonLink>
					<img className="max-w-sm rounded-xl shadow-brand-1" src="/images/club.png" />
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
