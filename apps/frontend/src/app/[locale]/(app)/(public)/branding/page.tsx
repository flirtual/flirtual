import type { Metadata } from "next";
import { useTranslations } from "next-intl";
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

export default function BrandingPage() {
	const t = useTranslations();

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
					{t("our_logo")}
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
					{t("mark_only")}
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
					{t("colors")}
				</span>
				<div className="flex flex-wrap gap-2 text-white-20">
					<ColorBlock
						name={t("gradient")}
						value="linear-gradient(to right, #FF8975, #E9658B)"
					/>
					<ColorBlock
						name={t("dark_mode")}
						value="linear-gradient(to right, #B24592, #E9658B)"
					/>
					<ColorBlock
						name={t("homie_mode")}
						value="linear-gradient(to right, #82BF72, #4D8888)"
					/>
					<ColorBlock name={t("pink")} value="#E9658B" />
					<ColorBlock
						invert
						name={t("cream")}
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
					size="sm"
				>
					{t("download")}
				</ButtonLink>
			</div>
		</ModelCard>
	);
}
