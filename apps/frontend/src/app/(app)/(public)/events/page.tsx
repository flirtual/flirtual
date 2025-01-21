import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "~/components/button";
import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { DiscordEmbed } from "./discord-embed";
import { Livestream } from "./livestream";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("events")
	};
}

export default async function EventsPage() {
	const t = await getTranslations();

	return (
		<ModelCard
			className="w-full desktop:max-w-3xl"
			containerProps={{ className: "gap-8" }}
			title={t("events")}
		>
			<Livestream />
			<div className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold">
					{t("vrchat_invite")}
				</h1>
				<p>{t("fun_still_clownfish_arrive")}</p>
				<p>
					{t.rich("elegant_bald_parakeet_animate", {
						joining: (children) => (
							<InlineLink href="https://discord.com/channels/455219574036496404/829507992743444531/1018385627022106715">
								{children}
							</InlineLink>
						)
					})}
				</p>
				<ButtonLink href={urls.resources.invite}>
					{t("arable_nice_puma_comfort")}
				</ButtonLink>
			</div>
			<div className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold">{t("top_big_tern_twist")}</h1>
				<p>{t("nimble_equal_loris_foster")}</p>
				<p>
					{t.rich("flaky_early_shad_nourish", {
						discord: (children) => (
							<InlineLink href={urls.socials.discord}>{children}</InlineLink>
						)
					})}
				</p>
				<DiscordEmbed />
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
					src={urls.media("b593e4e1-bef3-4ab8-b9ea-74628ebf694b")}
					width={1200}
				/>
				<h2 className="text-xl font-semibold">{t("tidy_wise_robin_urge")}</h2>
				<p>{t("careful_wise_bumblebee_walk")}</p>
				<ButtonLink href="/speeddate" target="_blank">{t("tidy_wise_robin_urge")}</ButtonLink>
				<Image
					alt={t("inclusive_simple_alligator_zap")}
					className="mt-4 w-full max-w-sm rounded-xl shadow-brand-1"
					height={900}
					src={urls.media("660c7e75-9634-45d1-a306-628eeef0a620")}
					width={1200}
				/>
				<h2 className="text-xl font-semibold">
					{t("inclusive_simple_alligator_zap")}
				</h2>
				<p>{t("sweet_mellow_ant_hunt")}</p>
				<ButtonLink href="/club" target="_blank">{t("inclusive_simple_alligator_zap")}</ButtonLink>
				<p>
					{t.rich("dry_inclusive_ox_trust", {
						faxmashine: (children) => (
							<InlineLink href="https://faxmashine.com/">{children}</InlineLink>
						),
						vrchat: (children) => (
							<InlineLink href="https://vrchat.com/">{children}</InlineLink>
						)
					})}
				</p>
			</div>
		</ModelCard>
	);
}
