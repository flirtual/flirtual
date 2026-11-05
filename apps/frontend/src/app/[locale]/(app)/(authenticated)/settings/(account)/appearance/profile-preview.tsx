import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { ProfileColors } from "~/api/user/profile";
import { profileColors } from "~/colors";
import { Pill } from "~/components/profile/pill/pill";
import { ThemedBorder } from "~/components/themed-border";

export const ProfileColorPreview: FC<ProfileColors> = ({ color1, color2 }) => {
	const { t } = useTranslation();

	return (
		<ThemedBorder
			className="flex gap-1 rounded-lg @lg:flex-col"
			data-profile-colors=""
			style={profileColors(color1, color2)}
		>
			<div className="flex size-full flex-col gap-4 rounded-sm bg-white-20 px-3 py-2 text-black-70">
				<span>{t("profile_colors_light_preview")}</span>
				<div className="flex origin-[top_left] scale-75 flex-wrap gap-2">
					<Pill active small>
						{t("preview_tag_1")}
					</Pill>
					<Pill active small>
						{t("preview_tag_2")}
					</Pill>
					<Pill small className="bg-white-30! text-black-70!">
						{t("preview_tag_3")}
					</Pill>
					<Pill active small>
						{t("preview_tag_4")}
					</Pill>
				</div>
			</div>
			<div className="flex size-full flex-col gap-4 rounded-sm bg-black-70 px-3 py-2 text-white-20">
				<span>{t("profile_colors_dark_preview")}</span>
				<div className="flex origin-[top_left] scale-75 flex-wrap gap-2">
					<Pill active small>
						{t("preview_tag_1")}
					</Pill>
					<Pill active small>
						{t("preview_tag_2")}
					</Pill>
					<Pill small className="bg-white-30! text-black-70!">
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
