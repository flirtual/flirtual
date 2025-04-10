import { useTranslations } from "next-intl";
import type { CSSProperties, FC } from "react";

import type { ProfileColors } from "~/api/user/profile";
import { gradientTextColor } from "~/colors";
import { Pill } from "~/components/profile/pill/pill";
import { ThemedBorder } from "~/components/themed-border";
import { useFormContext } from "~/hooks/use-input-form";

export const ProfileColorPreview: FC = () => {
	const t = useTranslations();

	const {
		fields: { color1, color2 }
	} = useFormContext<ProfileColors>();

	const textColor = gradientTextColor(color1.props.value, color2.props.value);

	return (
		<ThemedBorder
			style={
				{
					"--theme-1": color1.props.value,
					"--theme-2": color2.props.value,
					"--theme-text": textColor
				} as CSSProperties
			}
			className="flex flex-col gap-1 rounded-lg"
		>
			<div className="flex size-full flex-col gap-4 rounded bg-white-20 px-3 py-2 text-black-70">
				<span>{t("legal_such_sloth_type")}</span>
				<div className="flex scale-75 flex-wrap gap-2 [transform-origin:top_left]">
					<Pill active small>
						{t("preview_tag_1")}
					</Pill>
					<Pill active small>
						{t("preview_tag_2")}
					</Pill>
					<Pill small className="!bg-white-30 !text-black-70">
						{t("preview_tag_3")}
					</Pill>
					<Pill active small>
						{t("preview_tag_4")}
					</Pill>
				</div>
			</div>
			<div className="flex size-full flex-col gap-4 rounded bg-black-70 px-3 py-2 text-white-20">
				<span>{t("patchy_warm_mule_play")}</span>
				<div className="flex scale-75 flex-wrap gap-2 [transform-origin:top_left]">
					<Pill active small>
						{t("preview_tag_1")}
					</Pill>
					<Pill active small>
						{t("preview_tag_2")}
					</Pill>
					<Pill small className="!bg-white-30 !text-black-70">
						{t("preview_tag_3")}
					</Pill>
					<Pill active small>
						{t("preview_tag_4")}
					</Pill>
				</div>
			</div>
		</ThemedBorder>
	);
};
