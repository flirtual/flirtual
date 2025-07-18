import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { useMessages, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { urls } from "~/urls";

import { TeamList } from "./team-list";
import { TimelineItem } from "./timeline-item";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("about_us")
	};
}

export default function AboutPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();
	const tTeam = useTranslations("copy_frighten_wobble_futuristic");

	const { price_listen_wise_communicate: images } = useMessages();

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "!p-0 overflow-hidden" }}
			title={t("about_us")}
		>
			<Image
				alt={t("voice_spiritual_polite_entertaining")}
				height={618}
				src={urls.media("5337d467-579b-4718-baa5-489fcaa32066")}
				width={1888}
			/>
			<div className="flex flex-col gap-12 px-8 py-10 desktop:px-16">
				{t.rich("hard_cause_trick_puzzling", {
					section: (children) => (
						<section className="flex flex-col gap-4">{children}</section>
					),
					h1: (children) => (
						<h1 className="text-2xl font-semibold">{children}</h1>
					),
					p: (children) => <p className="select-children">{children}</p>,
					italic: (children) => <i>{children}</i>,
					group: (children) => (
						<div className="flex flex-col items-start">{children}</div>
					),
					contact: (children) => (
						<InlineLink href={urls.resources.contact}>{children}</InlineLink>
					),
					feedback: (children) => (
						<InlineLink href={urls.resources.feedback}>{children}</InlineLink>
					),
					discord: (children) => (
						<InlineLink className="select-text" href={urls.socials.discord}>
							{children}
						</InlineLink>
					),
					"team-list": () => (
						<TeamList>
							{[
								{
									name: "kfarwell",
									role: tTeam("kfarwell"),
									avatar: "108161fa-6e0d-435c-a4fd-5bdd0909aec5",
									url: urls.profile("DjkQHrZ3qjsBumHGBbEyS3")
								},
								{
									name: "Tony",
									role: tTeam("existony"),
									avatar: "faa26662-298a-47f3-838d-c36f40ca20f8",
									url: urls.profile("e3ZfMyZLq2ouAPRoLZHKrU")
								},
								{
									name: "Aries",
									role: tTeam("aries"),
									avatar: "957b0933-f010-447c-ab92-35e600367b70",
									url: urls.profile("GumsFYN6GkXPMcAGog9pM4")
								},
								{
									name: "Buramie",
									role: tTeam("moderator"),
									avatar: "5a01f443-7270-4fdb-b903-73d909a6f0f6",
									url: urls.profile("uQt9hi63LxYP6Cok6Znuz3")
								},
								{
									name: "Kart²",
									role: tTeam("moderator"),
									avatar: "18263ba2-f2e6-45b3-9e12-1cabbf3a1556",
									url: urls.profile("mMFE4M3CvbrvL4dP2LywHT")
								},
								{
									name: "Lvcidu",
									role: tTeam("moderator"),
									avatar: "49623cce-d03e-443a-822d-80412d28290d",
									url: urls.profile("RiAEmdNcdbKYXHw5n6kepB")
								},
								{
									name: "Reploidsham",
									role: tTeam("moderator"),
									avatar: "f93f2191-1dd4-4550-a348-b7634e3aff78",
									url: urls.profile("ZxqVfAQWSmRH3r3RG6MkMf")
								},
								{
									name: "Ryu",
									role: tTeam("moderator"),
									avatar: "c42d25de-953a-4330-b44c-6d6c35d39987",
									url: urls.profile("A2eQGb9azTPVAznaviKLcT")
								},
								{
									name: "Starh",
									role: tTeam("moderator"),
									avatar: "57c46b77-862d-42a6-84b2-f97879bd6f23",
									url: urls.profile("KKidURg3PuYzGGqErGAADC")
								},
								{
									name: "The_Blarg",
									role: tTeam("moderator"),
									avatar: "e3793c96-e6df-4520-9ead-d4fc4b1f2d9f",
									url: urls.profile("CtCeB3m7jSDTaKTu2GF6HN")
								},
								{
									name: "Tip_The_Spartan",
									role: `${tTeam("moderator")} & ${tTeam("event_host")}`,
									avatar: "4b7e5902-c19d-4c35-ac2e-e9d534a7f7bf",
									url: urls.profile("BrKN6eEdeF9gUEgD6xf8uB")
								},
								{
									name: "noxatnight",
									role: tTeam("event_host"),
									avatar: "ebacda78-2516-40af-8cd6-2f812764df1b",
									url: urls.profile("phzPP68JZq2m9HovbPeuZQ")
								},
								{
									name: "Solo!!",
									role: tTeam("event_host"),
									avatar: "c2d09814-db3b-49ba-a502-e5421e4816b3",
									url: urls.profile("QWnJPkY2SYZYZCPtSFDu4N")
								},
								{
									name: "Xero_XIII",
									role: tTeam("event_host"),
									avatar: "8b85f8fc-6f0b-41df-8f7d-a829cb346b86",
									url: urls.profile("nro9VuxaTPq7YLSVw6uZgk")
								},
								{
									name: "Antithalice",
									role: tTeam("social"),
									avatar: "f7798643-968d-4a2f-8c1f-bae4f8342bf9",
									url: urls.profile("djj7zNDxYPyCs3WmNJ5BBY")
								},
								{
									name: "FuuGhoul",
									role: tTeam("social"),
									avatar: "0ebe531d-cb90-4c42-8294-37145c49a49a",
									url: urls.profile("iCMu3yfBx5d9Yhmst3pBc3")
								},
								{
									name: "Soda",
									role: tTeam("social"),
									avatar: "2456e7e3-d9c2-4053-8cc9-80fcd6bb34c9",
									url: urls.profile("v3GGWajpcBNwhiZ5DdtBSk")
								},
								{
									name: "Katten!",
									role: tTeam("katten"),
									avatar: "09aea7c6-38b5-4898-8098-fd7952f115cc"
								},
								{
									name: "Syrmor",
									role: tTeam("syrmor"),
									avatar: "52dc4f3a-00a9-42d7-8a88-09bfe01bfc1f",
									url: "https://www.youtube.com/c/syrmor"
								},
								{
									name: "Faxmashine",
									role: tTeam("faxmashine"),
									avatar: "83977789-d464-49b5-b89e-955ffe8097c8",
									url: "https://www.faxmashine.com/",
									extra_url:
										"https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539"
								},
								{
									name: "Juice",
									role: tTeam("juice"),
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
							{(["2018", "2019", "2020", "2021", "2022", "2023"] as const).map(
								(year, index) => (
									<TimelineItem index={index} key={year} year={year} />
								)
							)}
						</div>
					)
				})}
			</div>
			<div className="grid grid-cols-3">
				{Object.entries(images).map(([index, { image, image_alt, link }]) => (
					<Tooltip key={index}>
						<TooltipTrigger asChild>
							<InlineLink href={link}>
								<Image
									alt={image_alt}
									height={230}
									src={urls.media(image)}
									width={405}
								/>
							</InlineLink>
						</TooltipTrigger>
						<TooltipContent>{image_alt}</TooltipContent>
					</Tooltip>
				))}
			</div>
		</ModelCard>
	);
}
