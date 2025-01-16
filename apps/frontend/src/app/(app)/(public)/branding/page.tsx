import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { ColorBlock } from "./color-block";
import { ImageList } from "./image-list";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("branding")
	};
}

export default async function BrandingPage() {
	const t = await getTranslations();

	return (
		<ModelCard
			className="w-full desktop:max-w-xl"
			containerProps={{ className: "gap-8" }}
			title={t("branding")}
		>
			<p>
				{t.rich("lime_soft_shad_skip", {
					contact: (children) => (
						<InlineLink href={urls.resources.pressEmail}>{children}</InlineLink>
					)
				})}
			</p>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("brave_early_weasel_arise")}
				</span>
				<span>{t("flaky_same_grizzly_snap")}</span>
				<ImageList
					items={[
						{
							name: "background",
							kinds: ["svg", "png"]
						},
						{
							name: "white",
							kinds: ["svg", "png"],
							dark: true
						},
						{
							name: "black",
							kinds: ["svg", "png"]
						}
					]}
				/>
			</div>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("mild_spry_hamster_persist")}
				</span>
				<span>{t("such_pink_jan_spur")}</span>
				<ImageList
					items={[
						{
							name: "mark/background",
							kinds: ["svg", "png"]
						},
						{
							name: "mark",
							kinds: ["svg", "png"]
						},
						{
							name: "mark/white",
							kinds: ["svg", "png"],
							dark: true
						},
						{
							name: "mark/black",
							kinds: ["svg", "png"]
						}
					]}
					className="desktop:grid-cols-4"
				/>
			</div>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("tasty_last_pony_transform")}
				</span>
				<div className="flex flex-wrap gap-2 text-white-20">
					<ColorBlock
						name={t("gross_red_earthworm_reside")}
						value="linear-gradient(to right, #FF8975, #E9658B)"
					/>
					<ColorBlock
						name={t("fair_yummy_penguin_harbor")}
						value="linear-gradient(to right, #B24592, #E9658B)"
					/>
					<ColorBlock
						name={t("empty_sharp_sheep_list")}
						value="linear-gradient(to right, #82BF72, #4D8888)"
					/>
					<ColorBlock name={t("whole_round_penguin_pet")} value="#E9658B" />
					<ColorBlock
						invert
						name={t("known_trick_raven_sew")}
						value="#FFFAF0"
					/>
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("wise_great_crow_foster")}
				</span>
				<span>{t("ornate_upper_guppy_mend")}</span>
				<ButtonLink
					download
					className="w-fit"
					href={urls.media("presskit.zip", "files")}
				>
					{t("tired_extra_bear_forgive")}
				</ButtonLink>
			</div>
		</ModelCard>
	);
}
