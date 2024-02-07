import { Metadata } from "next";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { Image } from "~/components/image";
import { UCImage } from "~/components/uc-image";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";

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
					src={urls.media("5337d467-579b-4718-baa5-489fcaa32066")}
					width={1888}
				/>
				<div className="flex flex-col gap-12 px-8 py-10 sm:px-16">
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Our story</h1>
						<p>
							Hey, I&apos;m Kyle. I&apos;ve been obsessed with VR since the
							early days of Oculus, but it really changed my life when I joined
							VRChat and met some of my best friends (like my wife!) there. So I
							set out to help others meet awesome people around the world too,
							and started VRLFP (Virtual Reality Looking For Partner).
						</p>
						<p>
							Immersive presence in VR helps you form deep connections with
							people anywhere in the world. By bridging geographic distance and
							putting personality first, our mission is to find the very best
							people for you, wherever they are. And to make dating safer and
							more magical!
						</p>
						<p>
							In 2022, VRLFP became Flirtual. Rebuilt from the ground up,
							we&apos;ve enhanced matchmaking, added personality &amp; interest
							tags, and launched improved apps. Whether you&apos;re looking for
							a serious relationship that transitions into real life, something
							more casual in VR, or just new homies, we&apos;re ready to help
							find your perfect match.
						</p>
						<div className="flex flex-col items-start">
							<p>&lt;3 kfarwell &amp; The Flirtual Team</p>
							<InlineLink href={urls.socials.discord}>
								Join our Discord
							</InlineLink>
						</div>
						<p className="italic">
							P.S. We&apos;ve come a long way from VRLFP&apos;s humble
							beginnings, but we&apos;re still a small team rooted in the VR
							community. We appreciate your patience as we work hard to make
							Flirtual as awesome as it can be. Please let us know if you{" "}
							<InlineLink href={urls.resources.contact}>
								find any bugs
							</InlineLink>{" "}
							or{" "}
							<InlineLink href={urls.resources.feedback}>
								have any suggestions
							</InlineLink>
							!
						</p>
					</div>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">The team</h1>
						<TeamList>
							{[
								{
									name: "kfarwell",
									role: "Lead Developer",
									avatar: "07dfc6f1-46da-4138-b122-65995215cc9a",
									url: urls.profile("DjkQHrZ3qjsBumHGBbEyS3")
								},
								{
									name: "Tony",
									role: "Partners, Design & Safety",
									avatar: "d70ed015-6c96-4918-bcb0-953b9ca2c7d4",
									url: urls.profile("e3ZfMyZLq2ouAPRoLZHKrU")
								},
								{
									name: "Solo!!",
									role: "Moderator & Event Host",
									avatar: "331d940d-8aba-406d-a21c-ec9728208165",
									url: urls.profile("QWnJPkY2SYZYZCPtSFDu4N")
								},
								{
									name: "Buramie",
									role: "Moderator",
									avatar: "8a05af9e-8bb2-4406-a8c8-141597debfa5",
									url: urls.profile("uQt9hi63LxYP6Cok6Znuz3")
								},
								{
									name: "Kart²",
									role: "Moderator",
									avatar: "bb569362-6a7a-4fba-a2ac-720bb08b99d2",
									url: urls.profile("mMFE4M3CvbrvL4dP2LywHT")
								},
								{
									name: "Krauser",
									role: "Moderator",
									avatar: "0f66df86-1e0b-4c63-b83b-9ef4f69437fd",
									url: urls.profile("qX6FJu6fn2Ebpj4MFzzAbY")
								},
								{
									name: "Reploidsham",
									role: "Moderator",
									avatar: "f2e896c5-42e1-4ccd-ab0b-97eddb681bc6",
									url: urls.profile("ZxqVfAQWSmRH3r3RG6MkMf")
								},
								{
									name: "Ryu",
									role: "Moderator",
									avatar: "395b3628-0da5-4145-8a0c-b83c40264133",
									url: urls.profile("A2eQGb9azTPVAznaviKLcT")
								},
								{
									name: "Starh",
									role: "Moderator",
									avatar: "74118bd7-a5d9-4bb8-80b1-95bd49a14d65",
									url: urls.profile("KKidURg3PuYzGGqErGAADC")
								},
								{
									name: "Teru",
									role: "Moderator",
									avatar: "c5271481-ded6-4a4c-85fd-3e856ed8dd1b",
									url: urls.profile("2azZQZEEQQSw5YMjKD5PHJ")
								},
								{
									name: "The_Blarg",
									role: "Moderator",
									avatar: "4ed1b072-f90a-403b-8e42-4ec5d5fb33a8",
									url: urls.profile("CtCeB3m7jSDTaKTu2GF6HN")
								},
								{
									name: "Aries",
									role: "Development Advisor",
									avatar: "ea06c43a-7cd9-4790-bc78-61131a137c4e",
									url: "https://ariesclark.com"
								},
								{
									name: "Katten!",
									role: "Community Advisor",
									avatar: "75758df4-af5a-4699-9c37-294d3d558a28"
								},
								{
									name: "Syrmor",
									role: "Marketing Advisor",
									avatar: "12781fa5-d7d3-4705-9e2a-a2edcf54f06a",
									url: "https://www.youtube.com/c/syrmor"
								},
								{
									name: "Faxmashine",
									role: "VRChat World Creator",
									avatar: "1e86cf1f-74e2-4b60-a28e-69ced25df236",
									url: "https://www.faxmashine.com/",
									extra_url:
										"https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539"
								},
								{
									name: "Juice",
									role: "VRChat Avatar Creator",
									avatar: "789592e9-31b0-4661-8593-b209385e5e7e",
									url: "https://info.mdcr.tv/",
									extra_url:
										"https://vrchat.com/home/avatar/avtr_75b9f5a5-def3-4620-b547-0bf88677f449"
								}
							]}
						</TeamList>
					</div>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Timeline</h1>
						<div className="grid auto-rows-min grid-cols-2 items-center gap-6">
							<UCImage
								className="rounded-md shadow-brand-1"
								src="88bb9381-87ed-499d-9667-cd61eff96938"
							/>
							<div className="flex flex-col px-4">
								<span className="font-montserrat text-2xl font-bold">
									2018 🐣
								</span>
								<span>The first VR dating app is born.</span>
							</div>
							<div className="flex flex-col px-4 text-right">
								<span className="font-montserrat text-2xl font-bold">
									🏆 2019
								</span>
								<span>
									VRLFP is named the best new technology at the
									iDate&nbsp;Awards.
								</span>
							</div>
							<UCImage
								className="rounded-md shadow-brand-1"
								src="c373b72d-16a0-479c-b834-ccb7041bc615"
							/>
							<UCImage
								className="rounded-md bg-white-10 shadow-brand-1"
								src="ead58fb3-e858-4e13-8acc-c9a5266a5b86"
							/>
							<div className="flex flex-col px-4">
								<span className="font-montserrat text-2xl font-bold">
									2020 🧪
								</span>
								<span>
									Some wacky concepts that eventually became the Flirtual you
									know and love today. Thanks for letting us cook.
								</span>
							</div>
							<div className="flex flex-col px-4 text-right">
								<span className="font-montserrat text-2xl font-bold">
									✌️ 2021
								</span>
								<span>
									ROVR is launched, a social matchmaking app for VR friends and
									groups. Its spirit lives on in Homie&nbsp;Mode.
								</span>
							</div>
							<UCImage
								className="rounded-md shadow-brand-1"
								src="366e91ce-2e3d-4e00-88e3-42626ec6e42f"
							/>
							<UCImage
								className="rounded-md shadow-brand-1"
								src="726f31b1-fb07-4dc8-af9f-f10985aee7be"
							/>
							<div className="flex flex-col px-4">
								<span className="font-montserrat text-2xl font-bold">
									2022 😻
								</span>
								<span>
									VRLFP becomes Flirtual. Maybe people will remember how to
									spell our name now.
								</span>
							</div>
							<div className="flex flex-col px-4 text-right">
								<span className="font-montserrat text-2xl font-bold">
									✨ 2023
								</span>
								<span>
									New design, mobile apps, and big improvements behind the
									scenes.
								</span>
							</div>
							<UCImage
								className="rounded-md shadow-brand-1"
								src="36446ecb-9103-4b6d-b221-7c657f17323d"
							/>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-3">
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_70fac20a-3cb4-4ecd-b8ea-f4ec28603395">
								<UCImage src="273de50f-7a03-4918-bd7c-331e11a00949" />
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>
							Flirtual&apos;s 12-hour Valentine&apos;s 2022 launch party with
							Vanguard
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539">
								<UCImage src="d76791d0-bcdd-4a56-87c0-9b298e14a246" />
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual Speed Dating in VRChat</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_d4f2cc35-83b9-41e9-9b3a-b861691c8df4">
								<UCImage src="0d6b9258-a330-47cd-9964-eb0143f34825" />
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual DJ Night in VRChat</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_3f6b1425-e191-4d1e-902f-b38ebf68576c">
								<UCImage src="2451ca85-8a4b-4c49-9d2b-d12a403271cb" />
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual at VRCon 2022</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://www.youtube.com/watch?v=zwguAbPv7zg">
								<UCImage src="7aa24041-91fb-4901-976e-a8b31b12e9a2" />
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual on the Today Show</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_2a35bcd6-19e2-42f6-ad72-ad32bc15a788">
								<UCImage src="c48bc92a-f0d3-4b29-877f-cdbedfadf0d5" />
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual at Vket 2023 Summer</TooltipContent>
					</Tooltip>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
