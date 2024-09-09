import { gradientTextColor } from "~/colors";
import { useFormContext } from "~/hooks/use-input-form";
import { ThemedBorder } from "~/components/themed-border";
import { Pill } from "~/components/profile/pill/pill";

import type { ProfileColors } from "~/api/user/profile";
import type { CSSProperties, FC } from "react";

export const ProfileColorPreview: FC = () => {
	const {
		fields: { color_1, color_2 }
	} = useFormContext<ProfileColors>();

	const textColor = gradientTextColor(color_1.props.value, color_2.props.value);

	return (
		<ThemedBorder
			className="flex flex-col gap-1 rounded-lg"
			style={
				{
					"--theme-1": color_1.props.value,
					"--theme-2": color_2.props.value,
					"--theme-text": textColor
				} as CSSProperties
			}
		>
			<div className="flex size-full flex-col gap-4 rounded bg-white-20 px-3 py-2 text-black-70">
				<span>This is how your profile colors look in Light Mode!</span>
				<div className="flex scale-75 flex-wrap gap-2 [transform-origin:top_left]">
					<Pill active small>
						Friendly
					</Pill>
					<Pill active small>
						Dancing
					</Pill>
					<Pill small className="!bg-white-30 !text-black-70">
						Anime
					</Pill>
					<Pill active small>
						VRChat
					</Pill>
				</div>
			</div>
			<div className="flex size-full flex-col gap-4 rounded bg-black-70 px-3 py-2 text-white-20">
				<span>This is how your profile colors look in Dark Mode!</span>
				<div className="flex scale-75 flex-wrap gap-2 [transform-origin:top_left]">
					<Pill active small>
						Friendly
					</Pill>
					<Pill active small>
						Dancing
					</Pill>
					<Pill small className="!bg-black-60 !text-white-30">
						Anime
					</Pill>
					<Pill active small>
						VRChat
					</Pill>
				</div>
			</div>
		</ThemedBorder>
	);
};
