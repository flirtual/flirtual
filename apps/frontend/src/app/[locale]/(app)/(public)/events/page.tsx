import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import Image2 from "virtual:remote/660c7e75-9634-45d1-a306-628eeef0a620";
import Image1 from "virtual:remote/b593e4e1-bef3-4ab8-b9ea-74628ebf694b";

import { ButtonLink } from "~/components/button";
import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { DiscordEmbed } from "./discord-embed";
import { Livestream } from "./livestream";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("events") }) }
	]);
};

export default function EventsPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="w-full desktop:max-w-3xl"
			containerProps={{ className: "gap-8" }}
			title={t("events")}
		>
			<Livestream />
			<div className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold">{t("top_big_tern_twist")}</h1>
				<p>{t("nimble_equal_loris_foster")}</p>
				<p>
					<Trans
						components={{ discord: <InlineLink href={urls.socials.discord} /> }}
						i18nKey="flaky_early_shad_nourish"
					/>
				</p>
				<DiscordEmbed />
			</div>
			<div className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold">{t("vrchat_group")}</h1>
				<p>{t("day_crazy_tortoise_read")}</p>
				<ButtonLink href={urls.socials.vrchat} target="_blank">{t("join_group")}</ButtonLink>
			</div>
			<div className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold">
					{t("quiet_lazy_marten_amuse")}
				</h1>
				<p>{t("blue_calm_chipmunk_spark")}</p>
				<Image
					alt={t("tidy_wise_robin_urge")}
					className="w-full max-w-sm rounded-xl shadow-brand-1"
					height={900}
					src={Image1}
					width={1200}
				/>
				<h2 className="text-xl font-semibold">{t("tidy_wise_robin_urge")}</h2>
				<p>{t("careful_wise_bumblebee_walk")}</p>
				<ButtonLink
					href="/speeddate"
					internal={false}
					target="_blank"
				>
					{t("tidy_wise_robin_urge")}
				</ButtonLink>
				<Image
					alt={t("inclusive_simple_alligator_zap")}
					className="mt-4 w-full max-w-sm rounded-xl shadow-brand-1"
					height={900}
					src={Image2}
					width={1200}
				/>
				<h2 className="text-xl font-semibold">
					{t("inclusive_simple_alligator_zap")}
				</h2>
				<p>{t("sweet_mellow_ant_hunt")}</p>
				<ButtonLink
					href="/club"
					internal={false}
					target="_blank"
				>
					{t("inclusive_simple_alligator_zap")}
				</ButtonLink>
				<p>
					<Trans
						components={{
							faxmashine: <InlineLink href="https://faxmashine.com/" />,
							vrchat: <InlineLink href="https://vrchat.com/" />
						}}
						i18nKey="dry_inclusive_ox_trust"
					/>
				</p>
			</div>
		</ModelCard>
	);
}
