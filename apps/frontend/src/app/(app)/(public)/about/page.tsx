import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { Image } from "~/components/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";

import { TeamList } from "./team-list";
import { TimelineItem } from "./timeline-item";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("about");

	return {
		title: t("title")
	};
}

export default async function AboutPage() {
	const t = await getTranslations("about");

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "!p-0 overflow-hidden" }}
			title={t("title")}
		>
			<Image
				alt={t("image_alt")}
				height={618}
				src={urls.media("5337d467-579b-4718-baa5-489fcaa32066")}
				width={1888}
			/>
			<div className="flex flex-col gap-12 px-8 py-10 desktop:px-16">
				{t.rich("content", {
					section: (children) => (
						<section className="flex flex-col gap-4">{children}</section>
					),
					h1: (children) => (
						<h1 className="text-2xl font-semibold">{children}</h1>
					),
					p: (children) => <p>{children}</p>,
					italic: (children) => <i>{children}</i>,
					group: (children) => (
						<div className="fflex flex-col items-start">{children}</div>
					),
					contact: (children) => (
						<InlineLink href={urls.resources.contact}>{children}</InlineLink>
					),
					feedback: (children) => (
						<InlineLink href={urls.resources.feedback}>{children}</InlineLink>
					),
					discord: (children) => (
						<InlineLink href={urls.socials.discord}>{children}</InlineLink>
					),
					"team-list": () => (
						<TeamList>
							{[
								{
									name: "kfarwell",
									role: t("team.roles.kfarwell"),
									avatar: "108161fa-6e0d-435c-a4fd-5bdd0909aec5",
									url: urls.profile("DjkQHrZ3qjsBumHGBbEyS3")
								},
								{
									name: "Tony",
									role: t("team.roles.existony"),
									avatar: "faa26662-298a-47f3-838d-c36f40ca20f8",
									url: urls.profile("e3ZfMyZLq2ouAPRoLZHKrU")
								},
								{
									name: "Aries",
									role: t("team.roles.aries"),
									avatar: "957b0933-f010-447c-ab92-35e600367b70",
									url: urls.profile("GumsFYN6GkXPMcAGog9pM4")
								},
								{
									name: "Buramie",
									role: t("team.roles.moderator"),
									avatar: "5a01f443-7270-4fdb-b903-73d909a6f0f6",
									url: urls.profile("uQt9hi63LxYP6Cok6Znuz3")
								},
								{
									name: "Kart²",
									role: t("team.roles.moderator"),
									avatar: "18263ba2-f2e6-45b3-9e12-1cabbf3a1556",
									url: urls.profile("mMFE4M3CvbrvL4dP2LywHT")
								},
								{
									name: "Krauser",
									role: t("team.roles.moderator"),
									avatar: "ff780f16-133a-45fd-943c-ed2b86953d2a",
									url: urls.profile("qX6FJu6fn2Ebpj4MFzzAbY")
								},
								{
									name: "Reploidsham",
									role: t("team.roles.moderator"),
									avatar: "f93f2191-1dd4-4550-a348-b7634e3aff78",
									url: urls.profile("ZxqVfAQWSmRH3r3RG6MkMf")
								},
								{
									name: "Ryu",
									role: t("team.roles.moderator"),
									avatar: "c42d25de-953a-4330-b44c-6d6c35d39987",
									url: urls.profile("A2eQGb9azTPVAznaviKLcT")
								},
								{
									name: "Starh",
									role: t("team.roles.moderator"),
									avatar: "57c46b77-862d-42a6-84b2-f97879bd6f23",
									url: urls.profile("KKidURg3PuYzGGqErGAADC")
								},
								{
									name: "Teru",
									role: t("team.roles.moderator"),
									avatar: "84f5d8ce-e7df-499f-8e55-db7e94d134a9",
									url: urls.profile("2azZQZEEQQSw5YMjKD5PHJ")
								},
								{
									name: "The_Blarg",
									role: t("team.roles.moderator"),
									avatar: "e3793c96-e6df-4520-9ead-d4fc4b1f2d9f",
									url: urls.profile("CtCeB3m7jSDTaKTu2GF6HN")
								},
								{
									name: "Solo!!",
									role: `${t("team.roles.moderator")} & ${t("team.roles.event_host")}`,
									avatar: "c2d09814-db3b-49ba-a502-e5421e4816b3",
									url: urls.profile("QWnJPkY2SYZYZCPtSFDu4N")
								},
								{
									name: "Tip_The_Spartan",
									role: t("team.roles.event_host"),
									avatar: "4b7e5902-c19d-4c35-ac2e-e9d534a7f7bf",
									url: urls.profile("BrKN6eEdeF9gUEgD6xf8uB")
								},
								{
									name: "turtledude01",
									role: t("team.roles.event_host"),
									avatar: "e6587a59-b35c-47ef-9782-5c62f8ba9a73",
									url: urls.profile("RKXrZ8wxFsc6BNR4Vqsw45")
								},
								{
									name: "Antithalice",
									role: t("team.roles.social"),
									avatar: "f7798643-968d-4a2f-8c1f-bae4f8342bf9",
									url: urls.profile("djj7zNDxYPyCs3WmNJ5BBY")
								},
								{
									name: "Fuugul",
									role: t("team.roles.social"),
									avatar: "0ebe531d-cb90-4c42-8294-37145c49a49a",
									url: urls.profile("iCMu3yfBx5d9Yhmst3pBc3")
								},
								{
									name: "Soda",
									role: t("team.roles.social"),
									avatar: "2456e7e3-d9c2-4053-8cc9-80fcd6bb34c9",
									url: urls.profile("v3GGWajpcBNwhiZ5DdtBSk")
								},
								{
									name: "Katten!",
									role: t("team.roles.katten"),
									avatar: "09aea7c6-38b5-4898-8098-fd7952f115cc"
								},
								{
									name: "Syrmor",
									role: t("team.roles.syrmor"),
									avatar: "52dc4f3a-00a9-42d7-8a88-09bfe01bfc1f",
									url: "https://www.youtube.com/c/syrmor"
								},
								{
									name: "Faxmashine",
									role: t("team.roles.faxmashine"),
									avatar: "83977789-d464-49b5-b89e-955ffe8097c8",
									url: "https://www.faxmashine.com/",
									extra_url:
										"https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539"
								},
								{
									name: "Juice",
									role: t("team.roles.juice"),
									avatar: "c2ec6685-04ff-42e7-be66-c0a58e5afb6d",
									url: "https://info.mdcr.tv/",
									extra_url:
										"https://vrchat.com/home/avatar/avtr_75b9f5a5-def3-4620-b547-0bf88677f449"
								}
							]}
						</TeamList>
					),
					timeline: () => (
						<div className="flex flex-col gap-6">
							{[2018, 2019, 2020, 2021, 2022, 2023].map((year, index) => (
								<TimelineItem index={index} key={year} year={year} />
							))}
						</div>
					)
				})}
			</div>
			<div className="grid grid-cols-3">
				{Array.from({ length: 6 }, (_, index) => (
					<Tooltip key={index}>
						<TooltipTrigger asChild>
							<InlineLink href={t(`images.${index}.link`)}>
								<Image
									alt={t(`images.${index}.image_alt`)}
									height={230}
									src={urls.media(t(`images.${index}.image`))}
									width={405}
								/>
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>{t(`images.${index}.image_alt`)}</TooltipContent>
					</Tooltip>
				))}
			</div>
		</ModelCard>
	);
}
