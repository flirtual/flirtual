import { Metadata } from "next";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import TeamImage from "~/../public/images/team.jpg";

import { TeamList } from "./team-list";

export const metadata: Metadata = {
	title: "About us"
};

export default function AboutPage() {
	return (
		<SoleModelLayout>
			<ModelCard
				className="w-full sm:max-w-2xl"
				containerProps={{ className: "!p-0 overflow-hidden" }}
				title="About us"
			>
				<img src={TeamImage.src} />
				<div className="flex flex-col gap-8 px-8 py-10 sm:px-16">
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Our Story</h1>
						<p>
							Back in 2018—at the height of the Ugandan Knuckles craze—kfarwell joined VRChat. He
							found out that people were dating in VR, but realized there was no VR dating site. So
							he made one. Now he&apos;s moved 2000 miles to live with his partner from VR. (It
							works!)
						</p>
						<p>
							Virtual Reality Looking-For-Partner (VRLFP) was the first VR dating site. We provided
							tens of thousands of matches to users all over the world, helping thousands of people
							meet in VR. With the new-and-improved Flirtual, we&apos;ll connect millions more VR
							users for dates, friendship, and everything in between.
						</p>
						<p>
							Why are we doing this? Because VR has changed our lives. Honestly. It&apos;s helped us
							come out of our shells, meet some of our best friends, survive quarantine sane, and
							fall in love.
						</p>
						<p>
							Yep. We really want this &quot;metaverse&quot; thing to go well, and help everyone
							find true connection and belonging, like VR has done for us. Everything we do—from
							Flirtual to projects like ROVR and homie.zone—is us trying to make that happen.
						</p>
						<p>So have fun! Be kind to each other. And don&apos;t forget to drink water.</p>
						<div className="flex flex-col">
							<span>{"<3"}</span>
							<p>The Flirtual Team</p>
							<InlineLink href={urls.socials.discord}>Join our Discord</InlineLink>
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">The Team</h1>
						<TeamList>
							{[
								{
									name: "Creators",
									members: [
										{
											name: "Kyle Farwell (kfarwell)",
											role: "Lead Developer",
											url: urls.profile("kfarwell")
										},
										{
											name: "Anthony Tan (Tony)",
											role: "Partnerships & Design",
											url: urls.profile("existony")
										}
									]
								},
								{
									name: "Development",
									members: [
										{
											name: "Aries",
											role: "Software Engineer",
											url: "https://ariesclark.com"
										}
									]
								},
								{
									name: "Community Lead",
									members: [
										{
											name: "Katten!",
											url: urls.profile("KattenRastyr")
										}
									]
								},
								{
									name: "Moderators",
									members: [
										{
											name: "Buramie",
											url: urls.profile("Buramie")
										},
										{
											name: "Solo!!",
											url: urls.profile("SoloFlighter")
										},
										{
											name: "Starh",
											url: urls.profile("Starh")
										},
										{
											name: "Teru",
											url: urls.profile("TeruPie")
										}
									]
								},
								{
									name: "Advisor",
									members: [
										{
											name: "Syrmor",
											url: "https://www.youtube.com/c/syrmor"
										}
									]
								},
								{
									name: "VRChat World Creator",
									members: [
										{
											name: "Faxmashine",
											url: "https://www.faxmashine.com/"
										}
									]
								},
								{
									name: "VRChat Avatar Creator",
									members: [
										{
											name: "Juice",
											url: "https://info.mdcr.tv/"
										}
									]
								}
							]}
						</TeamList>
					</div>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
