"use client";

import { type FC, type CSSProperties, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import { Hash } from "lucide-react";

import { InputLabel } from "~/components/inputs";
import { PreferenceThemes } from "~/api/user/preferences";
import { PremiumBadge } from "~/components/badge";
import { ThemedBorder } from "~/components/themed-border";
import { Pill } from "~/components/profile/pill/pill";
import { Form, FormButton } from "~/components/forms";
import { useFormContext } from "~/hooks/use-input-form";
import { useTheme } from "~/hooks/use-theme";
import { gradientTextColor } from "~/colors";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { Profile, type ProfileColors } from "~/api/user/profile";

import { ThemePreview } from "./theme-preview";

import type { Theme } from "~/theme";

const DefaultProfileColors: Record<Theme, ProfileColors> = {
	light: {
		color_1: "#ff8975",
		color_2: "#e9658b"
	},
	dark: {
		color_1: "#b24592",
		color_2: "#e9658b"
	}
};

const ProfileColorEditor: FC = () => {
	const [selectedColorIndex, setSelectedColorIndex] = useState(0);
	const {
		fields: { color_1, color_2 }
	} = useFormContext<ProfileColors>();

	const selectedColor = selectedColorIndex === 0 ? color_1 : color_2;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2">
				<button
					style={{ backgroundColor: color_1.props.value }}
					type="button"
					className={twMerge(
						"focusable size-8 rounded-md",
						selectedColorIndex === 0 && "focused"
					)}
					onClick={() => setSelectedColorIndex(0)}
				/>
				<button
					style={{ backgroundColor: color_2.props.value }}
					type="button"
					className={twMerge(
						"focusable size-8 rounded-md",
						selectedColorIndex === 1 && "focused"
					)}
					onClick={() => setSelectedColorIndex(1)}
				/>
			</div>
			<HexColorPicker
				className="aspect-square rounded-lg shadow-brand-1 desktop:!h-auto desktop:!w-full"
				color={selectedColor.props.value}
				onChange={selectedColor.props.onChange}
			/>
			<div className="focusable-within flex items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 dark:bg-black-60 dark:text-white-20">
				<div className="flex items-center justify-center bg-brand-gradient p-2 text-white-20">
					<Hash className="size-7" />
				</div>
				<HexColorInput
					className="w-full border-none bg-transparent px-4 py-2 font-mono uppercase caret-theme-2 placeholder:text-black-20 focus:outline-none focus:ring-0 disabled:text-black-20 dark:placeholder:text-white-50 dark:disabled:text-white-50"
					color={selectedColor.props.value}
					onChange={selectedColor.props.onChange}
				/>
			</div>
		</div>
	);
};

const ProfileColorPreview: FC = () => {
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

const recommendedThemes: Array<
	{
		name: string;
	} & ProfileColors
> = [
	{
		name: "Peachy Petal",
		color_1: "#f9c58d",
		color_2: "#f492f0"
	},
	{
		name: "Minty Fresh",
		color_1: "#00ff87",
		color_2: "#60efff"
	},
	{
		name: "3D Movie",
		color_1: "#ff1b6b",
		color_2: "#45caff"
	},
	{
		name: "Rise and Shine",
		color_1: "#ffa585",
		color_2: "#ffeda0"
	},
	{
		name: "Pretty in Pink",
		color_1: "#ff00b4",
		color_2: "#ff9abe"
	},
	{
		name: "Aqua Depths",
		color_1: "#6ff7e8",
		color_2: "#1f7ea1"
	},
	{
		name: "Galactic Glow",
		color_1: "#fcb0f3",
		color_2: "#3d05dd"
	},
	{
		name: "Vaporwave",
		color_1: "#fc4ecb",
		color_2: "#2effcb"
	},
	{
		name: "Fox Fire",
		color_1: "#f46605",
		color_2: "#ffb45d"
	},
	{
		name: "Touch Grass",
		color_1: "#743d17",
		color_2: "#478f50"
	},
	{
		name: "Lemon Lime",
		color_1: "#fff82e",
		color_2: "#4dff3d"
	},
	{
		name: "Vampiric Vibe",
		color_1: "#d80000",
		color_2: "#650000"
	},
	{
		name: "Trick or Treat",
		color_1: "#ff8400",
		color_2: "#b337fc"
	},
	{
		name: "Serene Silver",
		color_1: "#ebf4f5",
		color_2: "#8694a9"
	},
	{
		name: "Dark as My Soul",
		color_1: "#000000",
		color_2: "#000000"
	}
];

const ReccommendedProfileThemes: FC = () => {
	const {
		fields: { color_1, color_2 }
	} = useFormContext<ProfileColors>();
	const { theme } = useTheme();

	const defaultTheme = DefaultProfileColors[theme];

	return (
		<div className="grid w-full grid-cols-2 gap-2 wide:grid-cols-4">
			<button
				className="flex flex-col"
				type="button"
				onClick={() => {
					color_1.props.onChange(defaultTheme.color_1);
					color_2.props.onChange(defaultTheme.color_2);
				}}
			>
				<span>
					Flirtual{" "}
					<span className="text-sm text-black-50 vision:text-white-40 dark:text-white-40">
						default
					</span>
				</span>
				<div
					className={twMerge(
						"h-8 w-full rounded-md",
						color_1.props.value === defaultTheme.color_1 &&
							color_2.props.value === defaultTheme.color_2 &&
							"focused border-2"
					)}
					style={{
						backgroundImage: `linear-gradient(to right, ${defaultTheme.color_1}, ${defaultTheme.color_2})`
					}}
				/>
			</button>
			{recommendedThemes.map((theme) => (
				<button
					className="flex flex-col"
					key={theme.name}
					type="button"
					onClick={() => {
						color_1.props.onChange(theme.color_1);
						color_2.props.onChange(theme.color_2);
					}}
				>
					<span>{theme.name}</span>
					<div
						className={twMerge(
							"h-8 w-full rounded-md",
							color_1.props.value === theme.color_1 &&
								color_2.props.value === theme.color_2 &&
								"focused border-2"
						)}
						style={{
							backgroundImage: `linear-gradient(to right, ${theme.color_1}, ${theme.color_2})`
						}}
					/>
				</button>
			))}
		</div>
	);
};

const SaveButton: FC = () => {
	const [session] = useSession();
	const { changes } = useFormContext<ProfileColors>();

	if (!session) return null;
	const disabled =
		(!session.user.subscription || !session.user.subscription.active) &&
		(changes.includes("color_1") || changes.includes("color_2"));

	return (
		<FormButton disabled={disabled}>
			Save
			{disabled && " (Premium required)"}
		</FormButton>
	);
};

export const AppearanceForm: FC = () => {
	const { theme } = useTheme();
	const defaultTheme = DefaultProfileColors[theme];

	const toasts = useToast();
	const router = useRouter();
	const [session] = useSession();
	if (!session) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				color_1: session.user.profile.color_1 || defaultTheme.color_1,
				color_2: session.user.profile.color_2 || defaultTheme.color_2
			}}
			onSubmit={async (values) => {
				if (session.user.subscription?.active) {
					await Profile.updateColors(session.user.id, values);
				}

				toasts.add("Saved appearance");
				router.refresh();
			}}
		>
			<div className="flex flex-col gap-2 vision:hidden">
				<InputLabel>Theme</InputLabel>
				<div className="grid grid-cols-3 gap-4">
					{PreferenceThemes.map((theme) => (
						<ThemePreview key={theme} theme={theme} />
					))}
				</div>
			</div>
			<div className="flex w-full flex-col gap-8">
				<div className="flex w-full flex-col justify-between gap-8 wide:flex-row">
					<div className="flex shrink-0 flex-col gap-2">
						<InputLabel className="flex items-center gap-2">
							<span>Profile colors</span>
							<PremiumBadge />
						</InputLabel>
						<ProfileColorEditor />
					</div>
					<ProfileColorPreview />
				</div>
				<ReccommendedProfileThemes />
			</div>
			<SaveButton />
		</Form>
	);
};
