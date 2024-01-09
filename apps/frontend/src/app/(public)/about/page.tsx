import { Metadata } from "next";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { Image } from "~/components/image";

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
				<Image
					alt="Picture of the Flirtual Team in VRChat"
					height={618}
					src={urls.media("e9060915-cc16-4d0c-892e-765bf18d9d5f")}
					width={1888}
				/>
				<div className="flex flex-col gap-8 px-8 py-10 sm:px-16">
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Our Story</h1>
						<p>
							Back in 2018—at the height of the Ugandan Knuckles craze—kfarwell
							joined VRChat. He found out that people were dating in VR, but
							realized there was no VR dating site. So he made one.
						</p>
						<p>
							Virtual Reality Looking-For-Partner (VRLFP) was the first VR
							dating site. We provided tens of thousands of matches to users all
							over the world, helping thousands of people meet in VR. With the
							new-and-improved Flirtual, we&apos;ll connect millions more VR
							users for dates, friendship, and everything in between.
						</p>
						<p>
							Why are we doing this? Because VR has changed our lives. Honestly.
							It&apos;s helped us come out of our shells, meet some of our best
							friends, survive quarantine sane, and fall in love. Everyone on
							our team has met a best friend or romantic partner through VR. We
							really want to help everyone find true connection and belonging,
							as VR has done for us.
						</p>
						<p>
							So have fun! Be kind to each other. And don&apos;t forget to drink
							water.
						</p>
						<div className="flex flex-col">
							<span>{"<3"}</span>
							<p>The Flirtual Team</p>
							<InlineLink href={urls.socials.discord}>
								Join our Discord
							</InlineLink>
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
									name: "Staff",
									members: [
										{
											name: "Katten!",
											role: "Community Partner",
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
											name: "Kart²",
											url: urls.profile("KartSquared")
										},
										{
											name: "Krauser",
											url: urls.profile("Krauser")
										},
										{
											name: "Reploidsham",
											url: urls.profile("Reploidsham")
										},
										{
											name: "Ryu",
											url: urls.profile("Ryu")
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
											name: "The_Blarg",
											url: urls.profile("The_Blarg")
										}
									]
								},
								{
									name: "Advisor",
									members: [
										{
											name: "Aries",
											url: "https://ariesclark.com"
										},
										{
											name: "Syrmor",
											url: "https://www.youtube.com/c/syrmor"
										}
									]
								},
								{
									name: "VR Creators",
									members: [
										{
											name: "Faxmashine",
											role: "VRChat World",
											url: "https://www.faxmashine.com/"
										},
										{
											name: "Juice",
											role: "VRChat Avatar",
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
