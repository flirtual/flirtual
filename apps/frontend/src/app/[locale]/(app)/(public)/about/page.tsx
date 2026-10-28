import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { Logo } from "~/components/logo";
import { IdeasLink } from "~/components/modals/ideas";
import { ModelCard } from "~/components/model-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import DjNight from "~/static/about/gallery/dj-night.png";
import SpeedDating from "~/static/about/gallery/speed-dating.png";
import TodayShow from "~/static/about/gallery/today-show.png";
import Valentines2022LaunchParty from "~/static/about/gallery/valentines-2022-launch-party.png";
import Vket2023Summer from "~/static/about/gallery/vket-2023-summer.png";
import Vrcon2022 from "~/static/about/gallery/vrcon-2022.png";
import TeamPicture from "~/static/about/team.png";
import AvatarAries from "~/static/about/team/aries.jpg";
import AvatarBuramie from "~/static/about/team/buramie.jpg";
import AvatarDamnedUnited from "~/static/about/team/damned-united.jpg";
import AvatarFaxmashine from "~/static/about/team/faxmashine.png";
import AvatarFerry from "~/static/about/team/ferry.png";
import AvatarJuice from "~/static/about/team/juice.jpg";
import AvatarKfarwell from "~/static/about/team/kfarwell.png";
import AvatarMichiyo from "~/static/about/team/michiyo.jpg";
import AvatarNickykitty from "~/static/about/team/nickykitty.jpg";
import AvatarReploidsham from "~/static/about/team/reploidsham.jpg";
import AvatarSamantha from "~/static/about/team/samantha.jpg";
import AvatarSimon3373 from "~/static/about/team/simon3373.jpg";
import AvatarStarh from "~/static/about/team/starh.png";
import AvatarSyrmor from "~/static/about/team/syrmor.jpg";
import AvatarTheBlarg from "~/static/about/team/the-blarg.jpg";
import AvatarTony from "~/static/about/team/tony.png";
import AvatarZyp from "~/static/about/team/zyp.jpg";
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
	Valentines2022LaunchParty,
	SpeedDating,
	DjNight,
	Vrcon2022,
	TodayShow,
	Vket2023Summer
];

export default function AboutPage() {
	const { t } = useTranslation();

	const teamRole = t("about_team_roles", { returnObjects: true });
	const images = t("about_gallery", { returnObjects: true });

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "!p-0 desktop:overflow-hidden" }}
			title={t("about_us")}
		>
			<Image
				priority
				alt={t("about_team_photo_alt")}
				className="max-w-none full-bleed-x desktop:max-w-full"
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
						logo: <Logo className="-ml-2.5 w-36" />,
						discord: <InlineLink className="select-text" href={urls.socials.discord} />,
						"team-list": (
							<TeamList>
								{[
									{
										name: "kfarwell",
										role: teamRole.kfarwell,
										avatar: AvatarKfarwell
									},
									{
										name: "Tony",
										role: teamRole.existony,
										avatar: AvatarTony
									},
									{
										name: "Aries",
										role: teamRole.aries,
										avatar: AvatarAries
									},
									{
										name: "Buramie",
										role: teamRole.moderator,
										avatar: AvatarBuramie
									},
									{
										name: "Damned_United",
										role: teamRole.moderator,
										avatar: AvatarDamnedUnited
									},
									{
										name: "Ferry",
										role: teamRole.moderator,
										avatar: AvatarFerry
									},
									{
										name: "Reploidsham",
										role: teamRole.moderator,
										avatar: AvatarReploidsham
									},
									{
										name: "Samantha",
										role: teamRole.moderator,
										avatar: AvatarSamantha
									},
									{
										name: "Simon3373",
										role: teamRole.moderator,
										avatar: AvatarSimon3373
									},
									{
										name: "Starh",
										role: teamRole.moderator,
										avatar: AvatarStarh
									},
									{
										name: "The_Blarg",
										role: teamRole.moderator,
										avatar: AvatarTheBlarg
									},
									{
										name: "Zyp",
										role: teamRole.moderator,
										avatar: AvatarZyp
									},
									{
										name: "Michiyo",
										role: teamRole.event_host,
										avatar: AvatarMichiyo
									},
									{
										name: "NickyKitty",
										role: teamRole.event_host,
										avatar: AvatarNickykitty
									},
									{
										name: "Syrmor",
										role: teamRole.advisor,
										avatar: AvatarSyrmor
									},
									{
										name: "Faxmashine",
										role: teamRole.faxmashine,
										avatar: AvatarFaxmashine,
										url: "https://www.faxmashine.com/"
									},
									{
										name: "Juice",
										role: teamRole.juice,
										avatar: AvatarJuice,
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
									2024,
									2025
								] as const).map((year, index) =>
									<TimelineItem key={year} index={index} year={year} />
								)}
							</div>
						)
					}}
					i18nKey="about_page_body"
				/>
			</div>
			<div className="grid grid-cols-3 full-bleed-x native-nav:mb-[calc(-1*var(--safe-area-inset-bottom,0rem))] desktop:mb-0">
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
