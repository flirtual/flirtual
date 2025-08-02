import { Trans, useTranslation } from "react-i18next";
import TeamPicture from "virtual:remote/5337d467-579b-4718-baa5-489fcaa32066";

import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { FlirtualLogo } from "~/components/logo";
import { ModelCard } from "~/components/model-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { TeamList } from "./team-list";
import { TimelineItem } from "./timeline-item";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("about_us") }
	]);
};

export default function AboutPage() {
	const { t } = useTranslation();

	const teamRole = t("copy_frighten_wobble_futuristic", { returnObjects: true });
	const images = t("price_listen_wise_communicate", { returnObjects: true });

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "!p-0 overflow-hidden" }}
			title={t("about_us")}
		>
			<Image
				alt={t("voice_spiritual_polite_entertaining")}
				height={618}
				src={TeamPicture}
				width={1888}
			/>
			<div className="flex flex-col gap-12 px-8 py-10 desktop:px-16">
				<Trans
					components={{
						section: <section className="flex flex-col gap-4" />,
						h1: <h1 className="text-2xl font-semibold" />,
						p: <p className="select-children" />,
						italic: <i />,
						group: <div className="flex flex-col items-start" />,
						contact: <InlineLink href={urls.resources.contact} />,
						feedback: <InlineLink href={urls.resources.feedback} />,
						logo: <FlirtualLogo className="-ml-2.5 w-36" />,
						discord: <InlineLink className="select-text" href={urls.socials.discord} />,
						"team-list": (
							<TeamList>
								{[
									{
										name: "kfarwell",
										role: teamRole.kfarwell,
										avatar: "108161fa-6e0d-435c-a4fd-5bdd0909aec5",
										url: urls.profile("DjkQHrZ3qjsBumHGBbEyS3")
									},
									{
										name: "Tony",
										role: teamRole.existony,
										avatar: "faa26662-298a-47f3-838d-c36f40ca20f8",
										url: urls.profile("e3ZfMyZLq2ouAPRoLZHKrU")
									},
									{
										name: "Aries",
										role: teamRole.aries,
										avatar: "957b0933-f010-447c-ab92-35e600367b70",
										url: urls.profile("GumsFYN6GkXPMcAGog9pM4")
									},
									{
										name: "Buramie",
										role: teamRole.moderator,
										avatar: "5a01f443-7270-4fdb-b903-73d909a6f0f6",
										url: urls.profile("uQt9hi63LxYP6Cok6Znuz3")
									},
									{
										name: "FFHK",
										role: teamRole.moderator,
										avatar: "47405223-1850-4116-a21a-4132fbed51ff",
										url: urls.profile("fv2DHfXotnd26mS2yucwbX")
									},
									{
										name: "Kart²",
										role: teamRole.moderator,
										avatar: "18263ba2-f2e6-45b3-9e12-1cabbf3a1556",
										url: urls.profile("mMFE4M3CvbrvL4dP2LywHT")
									},
									{
										name: "Lvcidu",
										role: teamRole.moderator,
										avatar: "49623cce-d03e-443a-822d-80412d28290d",
										url: urls.profile("RiAEmdNcdbKYXHw5n6kepB")
									},
									{
										name: "Reploidsham",
										role: teamRole.moderator,
										avatar: "f93f2191-1dd4-4550-a348-b7634e3aff78",
										url: urls.profile("ZxqVfAQWSmRH3r3RG6MkMf")
									},
									{
										name: "Simon3373",
										role: teamRole.moderator,
										avatar: "4c30da22-1438-45c9-968e-a2a3a67e9cc7",
										url: urls.profile("WVhKhLx89bDbUweT4BhKaW")
									},
									{
										name: "Starh",
										role: teamRole.moderator,
										avatar: "57c46b77-862d-42a6-84b2-f97879bd6f23",
										url: urls.profile("KKidURg3PuYzGGqErGAADC")
									},
									{
										name: "The_Blarg",
										role: teamRole.moderator,
										avatar: "e3793c96-e6df-4520-9ead-d4fc4b1f2d9f",
										url: urls.profile("CtCeB3m7jSDTaKTu2GF6HN")
									},
									{
										name: "Zyp",
										role: teamRole.moderator,
										avatar: "78830b45-2d17-4caa-80eb-6ce728b991bf",
										url: urls.profile("Am4uyyviqQfEy7F44XsJz6")
									},
									{
										name: "Syrmor",
										role: teamRole.syrmor,
										avatar: "52dc4f3a-00a9-42d7-8a88-09bfe01bfc1f",
										url: "https://www.youtube.com/c/syrmor"
									},
									{
										name: "Faxmashine",
										role: teamRole.faxmashine,
										avatar: "83977789-d464-49b5-b89e-955ffe8097c8",
										url: "https://www.faxmashine.com/",
										extra_url:
										"https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539"
									},
									{
										name: "Juice",
										role: teamRole.juice,
										avatar: "c2ec6685-04ff-42e7-be66-c0a58e5afb6d",
										url: "https://info.mdcr.tv/",
										extra_url:
										"https://vrchat.com/home/avatar/avtr_75b9f5a5-def3-4620-b547-0bf88677f449"
									}
								]}
							</TeamList>
						),
						timeline: (
							<div className="flex flex-col gap-6">
								{([
									2018,
									2019,
									2020,
									2021,
									2022,
									2023,
									2024
								] as const).map((year, index) =>
									<TimelineItem key={year} index={index} year={year} />
								)}
							</div>
						)
					}}
					i18nKey="hard_cause_trick_puzzling"
				/>
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
