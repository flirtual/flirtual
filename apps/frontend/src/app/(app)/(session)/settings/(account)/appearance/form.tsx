"use client";

import { HexColorInput, HexColorPicker } from "react-colorful";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import { Hash } from "lucide-react";
import { type FC, useState } from "react";
import { flushSync } from "react-dom";

import { InputLabel } from "~/components/inputs";
import { PreferenceThemes } from "~/api/user/preferences";
import { PremiumBadge } from "~/components/badge";
import { Form, FormButton } from "~/components/forms";
import { useFormContext } from "~/hooks/use-input-form";
import { useTheme } from "~/hooks/use-theme";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { Profile, type ProfileColors } from "~/api/user/profile";

import { ThemePreview } from "./theme-preview";
import { ProfileColorPreview } from "./profile-preview";
import { defaultProfileColors, recommendedThemes } from "./themes";

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

const ReccommendedProfileThemes: FC = () => {
	const {
		fields: { color_1, color_2 }
	} = useFormContext<ProfileColors>();
	const { theme } = useTheme();

	const defaultTheme = defaultProfileColors[theme];

	return (
		<div className="grid w-full grid-cols-2 gap-2 wide:grid-cols-4">
			{[
				{ name: "Flirtual", description: "default", ...defaultTheme },
				...recommendedThemes
			].map((theme) => (
				<button
					className="flex flex-col"
					key={theme.name}
					type="button"
					onClick={() => {
						flushSync(() => {
							color_1.props.onChange(theme.color_1);
							color_2.props.onChange(theme.color_2);
						});
					}}
				>
					<div className="flex w-fit items-baseline gap-2">
						<span>{theme.name}</span>
						{theme.description && (
							<span className="text-sm text-black-50 vision:text-white-40 dark:text-white-40">
								{theme.description}
							</span>
						)}
					</div>
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
	const defaultTheme = defaultProfileColors[theme];

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
