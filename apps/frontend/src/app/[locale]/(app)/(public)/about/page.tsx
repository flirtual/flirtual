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

const avatars = Object.fromEntries(
	Object.entries(
		import.meta.glob<string>("~/static/about/team/*", { eager: true, import: "default", query: "?w=128&imagetools" })
	).map(([path, source]) => [path.slice(path.lastIndexOf("/") + 1), source])
);

function avatar(file: string) {
	const source = avatars[file];
	invariant(source, `No avatar at static/about/team/${file}`);
	return source;
}

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

	const team = t("about_team", { returnObjects: true });
	const images = t("about_gallery", { returnObjects: true });

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "p-0! desktop:overflow-hidden" }}
			title={t("about_us")}
		>
			<div className="flex flex-col gap-12">
				<Trans
					components={{
						"team-photo": (
							<Image
								priority
								alt={t("about_team_photo_alt")}
								className="full-bleed-x max-w-none desktop:max-w-full"
								height={618}
								src={TeamPicture}
								width={1888}
							/>
						),
						gallery: (
							<div className="full-bleed-x grid grid-cols-3 native-nav:-mb-(--safe-area-inset-bottom,0rem) desktop:mb-0">
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
						),
						section: <section className="flex flex-col gap-4 px-8 first:pt-10 last:pb-10 desktop:px-16" />,
						h1: <h1 className="text-2xl font-semibold" />,
						p: <p className="select-children" />,
						list: <ul className="list-disc pl-6 select-children" />,
						item: <li />,
						italic: <i />,
						group: <div className="flex flex-col items-start" />,
						contact: <InlineLink href={urls.resources.contact} />,
						repository: <InlineLink href={urls.resources.developers} />,
						matchmaking: <InlineLink href={urls.settings.matchmaking()} />,
						guidelines: <InlineLink href={urls.resources.communityGuidelines} />,
						privacy: <InlineLink href={urls.resources.privacyPolicy} />,
						subscription: <InlineLink href={urls.subscription.default} />,
						ideas: <IdeasLink />,
						logo: <Logo className="-ml-2.5 w-36" />,
						discord: <InlineLink className="select-text" href={urls.socials.discord} />,
						"team-list": (
							<TeamList>
								{Object.values(team).map((member) => ({ ...member, avatar: avatar(member.avatar) }))}
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
		</ModelCard>
	);
}
