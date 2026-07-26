import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import Image0d6b9258 from "virtual:remote/0d6b9258-a330-47cd-9964-eb0143f34825";
import Image2451ca85 from "virtual:remote/2451ca85-8a4b-4c49-9d2b-d12a403271cb";
import Image273de50f from "virtual:remote/273de50f-7a03-4918-bd7c-331e11a00949";
import TeamPicture from "virtual:remote/5337d467-579b-4718-baa5-489fcaa32066";
import Image7aa24041 from "virtual:remote/7aa24041-91fb-4901-976e-a8b31b12e9a2";
import ImageC48bc92a from "virtual:remote/c48bc92a-f0d3-4b29-877f-cdbedfadf0d5";
import ImageD76791d0 from "virtual:remote/d76791d0-bcdd-4a56-87c0-9b298e14a246";

import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { FlirtualLogo } from "~/components/logo";
import { IdeasLink } from "~/components/modals/ideas";
import { ModelCard } from "~/components/model-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { TeamList } from "./team-list";
import { TimelineItem } from "./timeline-item";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("about_us") }) }
	]);
};

const imageSources = [
	Image273de50f,
	ImageD76791d0,
	Image0d6b9258,
	Image2451ca85,
	Image7aa24041,
	ImageC48bc92a
];

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
				priority
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
						ideas: <IdeasLink />,
						logo: <FlirtualLogo className="-ml-2.5 w-36" />,
						discord: <InlineLink className="select-text" href={urls.socials.discord} />,
						"team-list": (
							<TeamList>
								{[
									{
										name: "kfarwell",
										role: teamRole.kfarwell,
										avatar: "108161fa-6e0d-435c-a4fd-5bdd0909aec5"
									},
									{
										name: "Tony",
										role: teamRole.existony,
										avatar: "faa26662-298a-47f3-838d-c36f40ca20f8"
									},
									{
										name: "Aries",
										role: teamRole.aries,
										avatar: "957b0933-f010-447c-ab92-35e600367b70"
									},
									{
										name: "Buramie",
										role: teamRole.moderator,
										avatar: "01e112a9-b064-4360-96b8-e8c236035449"
									},
									{
										name: "Damned_United",
										role: teamRole.moderator,
										avatar: "fc4b6ed4-d23d-4e74-99b6-2237233d9978"
									},
									{
										name: "Ferry",
										role: teamRole.moderator,
										avatar: "5b8a2b17-6eff-49a7-8a24-5b8efa1d33dc"
									},
									{
										name: "Reploidsham",
										role: teamRole.moderator,
										avatar: "f93f2191-1dd4-4550-a348-b7634e3aff78"
									},
									{
										name: "Samantha",
										role: teamRole.moderator,
										avatar: "d97a8bcf-6f13-413f-b590-7f0684c45cc3"
									},
									{
										name: "Simon3373",
										role: teamRole.moderator,
										avatar: "4c30da22-1438-45c9-968e-a2a3a67e9cc7"
									},
									{
										name: "Starh",
										role: teamRole.moderator,
										avatar: "71c63eff-078c-4f0b-8ff4-1e63ad1aeb29"
									},
									{
										name: "The_Blarg",
										role: teamRole.moderator,
										avatar: "e3793c96-e6df-4520-9ead-d4fc4b1f2d9f"
									},
									{
										name: "Zyp",
										role: teamRole.moderator,
										avatar: "2176bb72-0c35-40be-96f7-8cbd71423c11"
									},
									{
										name: "Michiyo",
										role: teamRole.event_host,
										avatar: "d03b1ea9-e2d2-4178-9bc2-2eeb3d6a9b06"
									},
									{
										name: "NickyKitty",
										role: teamRole.event_host,
										avatar: "ed70f0ee-c669-4692-ac8d-27eab41cb5b5"
									},
									{
										name: "Syrmor",
										role: teamRole.advisor,
										avatar: "52dc4f3a-00a9-42d7-8a88-09bfe01bfc1f"
									},
									{
										name: "Faxmashine",
										role: teamRole.faxmashine,
										avatar: "83977789-d464-49b5-b89e-955ffe8097c8",
										url: "https://www.faxmashine.com/"
									},
									{
										name: "Juice",
										role: teamRole.juice,
										avatar: "c2ec6685-04ff-42e7-be66-c0a58e5afb6d",
										url: "https://info.mdcr.tv/"
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
				{Object.entries(images).map(([index, { image_alt, link }]) => (
					<Tooltip key={index}>
						<TooltipTrigger asChild>
							<InlineLink href={link}>
								<Image
									alt={image_alt}
									height={230}
									src={imageSources[Number(index)]}
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
