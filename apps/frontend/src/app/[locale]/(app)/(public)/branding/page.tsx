import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import * as brand from "~/brand";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { homieMode } from "~/features";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import LogoOnDarkSVG from "~/static/logo-on-dark.svg";
import LogoOnDarkPNG from "~/static/logo-on-dark.svg?w=3468&format=png&quality=100&imagetools";
import LogoOnGradientSVG from "~/static/logo-on-gradient.svg";
import LogoOnGradientPNG from "~/static/logo-on-gradient.svg?w=3468&format=png&quality=100&imagetools";
import LogoOnLightSVG from "~/static/logo-on-light.svg";
import LogoOnLightPNG from "~/static/logo-on-light.svg?w=3468&format=png&quality=100&imagetools";
import MarkBlackSVG from "~/static/mark-black.svg";
import MarkBlackPNG from "~/static/mark-black.svg?w=1000&format=png&quality=100&imagetools";
import MarkOnGradientSVG from "~/static/mark-on-gradient.svg";
import MarkOnGradientPNG from "~/static/mark-on-gradient.svg?w=1000&format=png&quality=100&imagetools";
import MarkWhiteSVG from "~/static/mark-white.svg";
import MarkWhitePNG from "~/static/mark-white.svg?w=1000&format=png&quality=100&imagetools";
import MarkSVG from "~/static/mark.svg";
import MarkPNG from "~/static/mark.svg?w=1000&format=png&quality=100&imagetools";
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
					i18nKey="branding_intro"
				/>
			</p>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("our_logo")}
				</span>
				<span>{t("branding_logo_rules")}</span>
				<ImageList
					items={[
						{
							name: "logo-on-gradient",
							sources: {
								png: LogoOnGradientPNG,
								svg: LogoOnGradientSVG,
							}
						},
						{
							name: "logo-on-dark",
							dark: true,
							sources: {
								png: LogoOnDarkPNG,
								svg: LogoOnDarkSVG,
							}
						},
						{
							name: "logo-on-light",
							sources: {
								png: LogoOnLightPNG,
								svg: LogoOnLightSVG,
							}
						},
					]}
				/>
			</div>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("mark_only")}
				</span>
				<span>{t("branding_icon_usage")}</span>
				<ImageList
					items={[
						{
							name: "mark-on-gradient",
							sources: {
								png: MarkOnGradientPNG,
								svg: MarkOnGradientSVG,
							}
						},
						{
							name: "mark",
							sources: {
								png: MarkPNG,
								svg: MarkSVG,
							}
						},
						{
							name: "mark-white",
							dark: true,
							sources: {
								png: MarkWhitePNG,
								svg: MarkWhiteSVG,
							}
						},
						{
							name: "mark-black",
							sources: {
								png: MarkBlackPNG,
								svg: MarkBlackSVG,
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
					{t("branding_need_more")}
				</span>
				<span>{t("branding_press_kit")}</span>
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
