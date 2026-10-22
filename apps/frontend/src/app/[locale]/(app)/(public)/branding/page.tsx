import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import FlirtualBackgroundPNG from "virtual:remote/brand/background.png?format=png&quality=100";
import FlirtualBackgroundSVG from "virtual:remote/brand/background.svg";
import FlirtualBlackPNG from "virtual:remote/brand/black.png?format=png&quality=100";
import FlirtualBlackSVG from "virtual:remote/brand/black.svg";
import FlirtualMarkBackgroundPNG from "virtual:remote/brand/mark-background.png?format=png&quality=100";
import FlirtualMarkBackgroundSVG from "virtual:remote/brand/mark-background.svg";
import FlirtualMarkBlackPNG from "virtual:remote/brand/mark-black.png?format=png&quality=100";
import FlirtualMarkBlackSVG from "virtual:remote/brand/mark-black.svg";
import FlirtualMarkWhitePNG from "virtual:remote/brand/mark-white.png?format=png&quality=100";
import FlirtualMarkWhiteSVG from "virtual:remote/brand/mark-white.svg";
import FlirtualMarkPNG from "virtual:remote/brand/mark.png?format=png&quality=100";
import FlirtualMarkSVG from "virtual:remote/brand/mark.svg";
import FlirtualWhitePNG from "virtual:remote/brand/white.png?format=png&quality=100";
import FlirtualWhiteSVG from "virtual:remote/brand/white.svg";

import * as brand from "~/brand";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { homieMode } from "~/features";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { ColorBlock } from "./color-block";
import { ImageList } from "./image-list";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("branding") }) }
	]);
};

const gradient = ([from, to]: brand.ColorPair) => `linear-gradient(to right, ${from}, ${to})`;

export default function BrandingPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="w-full desktop:max-w-xl"
			containerProps={{ className: "gap-8" }}
			title={t("branding")}
		>
			<p>
				<Trans
					components={{
						contact: <InlineLink href={urls.resources.pressEmail} />
					}}
					i18nKey="lime_soft_shad_skip"
				/>
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
							sources: {
								png: FlirtualBackgroundPNG,
								svg: FlirtualBackgroundSVG,
							}
						},
						{
							name: "white",
							dark: true,
							sources: {
								png: FlirtualWhitePNG,
								svg: FlirtualWhiteSVG,
							}
						},
						{
							name: "black",
							sources: {
								png: FlirtualBlackPNG,
								svg: FlirtualBlackSVG,
							}
						},
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
							name: "mark-background",
							sources: {
								png: FlirtualMarkBackgroundPNG,
								svg: FlirtualMarkBackgroundSVG,
							}
						},
						{
							name: "mark",
							sources: {
								png: FlirtualMarkPNG,
								svg: FlirtualMarkSVG,
							}
						},
						{
							name: "mark-white",
							dark: true,
							sources: {
								png: FlirtualMarkWhitePNG,
								svg: FlirtualMarkWhiteSVG,
							}
						},
						{
							name: "mark-black",
							sources: {
								png: FlirtualMarkBlackPNG,
								svg: FlirtualMarkBlackSVG,
							}
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
						value={gradient(brand.dateColors)}
					/>
					<ColorBlock
						name={t("dark_mode")}
						value={gradient(brand.dateDarkColors)}
					/>
					{homieMode && (
						<ColorBlock
							name={t("homie_mode")}
							value={gradient(brand.homieColors)}
						/>
					)}
					<ColorBlock name={t("accent")} value={brand.accentColor} />
					<ColorBlock
						name={t("background")}
						invert
						value={brand.backgroundColor}
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
					href={urls.media("presskit.zip", "static")}
					size="sm"
				>
					{t("download")}
				</ButtonLink>
			</div>
		</ModelCard>
	);
}
