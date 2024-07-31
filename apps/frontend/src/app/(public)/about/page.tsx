import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { Image } from "~/components/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";

import { TeamList } from "./team-list";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "About us"
};

export default function AboutPage() {
	return (
		<SoleModelLayout>
			<ModelCard
				className="w-full desktop:max-w-2xl"
				containerProps={{ className: "!p-0 overflow-hidden" }}
				title="About us"
			>
				<Image
					alt="Picture of the Flirtual Team in VRChat"
					height={618}
					src={urls.media("5337d467-579b-4718-baa5-489fcaa32066")}
					width={1888}
				/>
				<div className="flex flex-col gap-12 px-8 py-10 desktop:px-16">
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">Our story</h1>
						<p>
							Hey, we&apos;re Kyle and Tony, the creators of Flirtual. Kyle has
							been obsessed with VR since the early days of Oculus, but it
							really changed his life when he joined VRChat and met some of his
							closest friends (including his wife!) there. Right before COVID
							hit, Kyle brought his childhood best friend Tony along for the
							journey, and VR also changed his life. We set out to help others
							meet awesome people around the world too, starting with VRLFP
							(Virtual Reality Looking For Partner).
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
							<p>&lt;3 kfarwell, Tony &amp; The Flirtual Team</p>
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
									avatar: "108161fa-6e0d-435c-a4fd-5bdd0909aec5",
									url: urls.profile("DjkQHrZ3qjsBumHGBbEyS3")
								},
								{
									name: "Tony",
									role: "Partners, Design & Safety",
									avatar: "faa26662-298a-47f3-838d-c36f40ca20f8",
									url: urls.profile("e3ZfMyZLq2ouAPRoLZHKrU")
								},
								{
									name: "Aries",
									role: "Software Developer",
									avatar: "957b0933-f010-447c-ab92-35e600367b70",
									url: urls.profile("GumsFYN6GkXPMcAGog9pM4")
								},
								{
									name: "Buramie",
									role: "Moderator",
									avatar: "5a01f443-7270-4fdb-b903-73d909a6f0f6",
									url: urls.profile("uQt9hi63LxYP6Cok6Znuz3")
								},
								{
									name: "Kart²",
									role: "Moderator",
									avatar: "18263ba2-f2e6-45b3-9e12-1cabbf3a1556",
									url: urls.profile("mMFE4M3CvbrvL4dP2LywHT")
								},
								{
									name: "Krauser",
									role: "Moderator",
									avatar: "ff780f16-133a-45fd-943c-ed2b86953d2a",
									url: urls.profile("qX6FJu6fn2Ebpj4MFzzAbY")
								},
								{
									name: "Reploidsham",
									role: "Moderator",
									avatar: "f93f2191-1dd4-4550-a348-b7634e3aff78",
									url: urls.profile("ZxqVfAQWSmRH3r3RG6MkMf")
								},
								{
									name: "Ryu",
									role: "Moderator",
									avatar: "c42d25de-953a-4330-b44c-6d6c35d39987",
									url: urls.profile("A2eQGb9azTPVAznaviKLcT")
								},
								{
									name: "Starh",
									role: "Moderator",
									avatar: "57c46b77-862d-42a6-84b2-f97879bd6f23",
									url: urls.profile("KKidURg3PuYzGGqErGAADC")
								},
								{
									name: "Teru",
									role: "Moderator",
									avatar: "84f5d8ce-e7df-499f-8e55-db7e94d134a9",
									url: urls.profile("2azZQZEEQQSw5YMjKD5PHJ")
								},
								{
									name: "The_Blarg",
									role: "Moderator",
									avatar: "e3793c96-e6df-4520-9ead-d4fc4b1f2d9f",
									url: urls.profile("CtCeB3m7jSDTaKTu2GF6HN")
								},
								{
									name: "Solo!!",
									role: "Moderator & Event Host",
									avatar: "c2d09814-db3b-49ba-a502-e5421e4816b3",
									url: urls.profile("QWnJPkY2SYZYZCPtSFDu4N")
								},
								{
									name: "Tip_The_Spartan",
									role: "Event Host",
									avatar: "4b7e5902-c19d-4c35-ac2e-e9d534a7f7bf",
									url: urls.profile("BrKN6eEdeF9gUEgD6xf8uB")
								},
								{
									name: "turtledude01",
									role: "Event Host",
									avatar: "e6587a59-b35c-47ef-9782-5c62f8ba9a73",
									url: urls.profile("RKXrZ8wxFsc6BNR4Vqsw45")
								},
								{
									name: "Antithalice",
									role: "Socials",
									avatar: "f7798643-968d-4a2f-8c1f-bae4f8342bf9",
									url: urls.profile("djj7zNDxYPyCs3WmNJ5BBY")
								},
								{
									name: "Fuugul",
									role: "Socials",
									avatar: "0ebe531d-cb90-4c42-8294-37145c49a49a",
									url: urls.profile("iCMu3yfBx5d9Yhmst3pBc3")
								},
								{
									name: "Soda",
									role: "Socials",
									avatar: "2456e7e3-d9c2-4053-8cc9-80fcd6bb34c9",
									url: urls.profile("v3GGWajpcBNwhiZ5DdtBSk")
								},
								{
									name: "Katten!",
									role: "Community Advisor",
									avatar: "09aea7c6-38b5-4898-8098-fd7952f115cc"
								},
								{
									name: "Syrmor",
									role: "Marketing Advisor",
									avatar: "52dc4f3a-00a9-42d7-8a88-09bfe01bfc1f",
									url: "https://www.youtube.com/c/syrmor"
								},
								{
									name: "Faxmashine",
									role: "VRChat World Creator",
									avatar: "83977789-d464-49b5-b89e-955ffe8097c8",
									url: "https://www.faxmashine.com/",
									extra_url:
										"https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539"
								},
								{
									name: "Juice",
									role: "VRChat Avatar Creator",
									avatar: "c2ec6685-04ff-42e7-be66-c0a58e5afb6d",
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
							<Image
								alt="Flirtual in 2018"
								className="rounded-md shadow-brand-1"
								height={461}
								src={urls.media("88bb9381-87ed-499d-9667-cd61eff96938")}
								width={810}
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
							<Image
								alt="Flirtual in 2019"
								className="rounded-md shadow-brand-1"
								height={461}
								src={urls.media("c373b72d-16a0-479c-b834-ccb7041bc615")}
								width={810}
							/>
							<Image
								alt="Flirtual in 2020"
								className="rounded-md shadow-brand-1"
								height={461}
								src={urls.media("ead58fb3-e858-4e13-8acc-c9a5266a5b86")}
								width={810}
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
							<Image
								alt="Flirtual in 2021"
								className="rounded-md shadow-brand-1"
								height={461}
								src={urls.media("366e91ce-2e3d-4e00-88e3-42626ec6e42f")}
								width={810}
							/>
							<Image
								alt="Flirtual in 2022"
								className="rounded-md shadow-brand-1"
								height={461}
								src={urls.media("726f31b1-fb07-4dc8-af9f-f10985aee7be")}
								width={810}
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
							<Image
								alt="Flirtual in 2023"
								className="rounded-md shadow-brand-1"
								height={461}
								src={urls.media("36446ecb-9103-4b6d-b221-7c657f17323d")}
								width={810}
							/>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-3">
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_70fac20a-3cb4-4ecd-b8ea-f4ec28603395">
								<Image
									alt="Flirtual's 12-hour Valentine's 2022 launch party with Vanguard"
									height={230}
									src={urls.media("273de50f-7a03-4918-bd7c-331e11a00949")}
									width={405}
								/>
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
								<Image
									alt="Flirtual Speed Dating in VRChat"
									height={230}
									src={urls.media("d76791d0-bcdd-4a56-87c0-9b298e14a246")}
									width={405}
								/>
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual Speed Dating in VRChat</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_d4f2cc35-83b9-41e9-9b3a-b861691c8df4">
								<Image
									alt="Flirtual DJ Night in VRChat"
									height={230}
									src={urls.media("0d6b9258-a330-47cd-9964-eb0143f34825")}
									width={405}
								/>
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual DJ Night in VRChat</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_3f6b1425-e191-4d1e-902f-b38ebf68576c">
								<Image
									alt="Flirtual at VRCon 2022"
									height={230}
									src={urls.media("2451ca85-8a4b-4c49-9d2b-d12a403271cb")}
									width={405}
								/>
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual at VRCon 2022</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://www.youtube.com/watch?v=zwguAbPv7zg">
								<Image
									alt="Flirtual on the Today Show"
									height={230}
									src={urls.media("7aa24041-91fb-4901-976e-a8b31b12e9a2")}
									width={405}
								/>
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual on the Today Show</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<InlineLink href="https://vrchat.com/home/world/wrld_2a35bcd6-19e2-42f6-ad72-ad32bc15a788">
								<Image
									alt="Flirtual at Vket 2023 Summer"
									height={230}
									src={urls.media("c48bc92a-f0d3-4b29-877f-cdbedfadf0d5")}
									width={405}
								/>
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>Flirtual at Vket 2023 Summer</TooltipContent>
					</Tooltip>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
