"use client";

import { Hash, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, Dispatch, FC } from "react";
import { useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { flushSync } from "react-dom";
import { twMerge } from "tailwind-merge";

import { PreferenceThemes } from "~/api/user/preferences";
import { Profile, type ProfileColors } from "~/api/user/profile";
import { PremiumBadge } from "~/components/badge";
import { Form, FormButton } from "~/components/forms";
import { InputLabel } from "~/components/inputs";
import { useFormContext } from "~/hooks/use-input-form";
import { useSession } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { useToast } from "~/hooks/use-toast";

import { ProfileColorPreview } from "./profile-preview";
import { ThemePreview } from "./theme-preview";
import { defaultProfileColors, recommendedThemes } from "./themes";

export const InputColor: FC<{ value: string; onChange: Dispatch<string> }> = ({ value, onChange }) => {
	return (
		<div className="relative flex flex-col gap-4" style={{ "--color": value } as CSSProperties}>
			<HexColorPicker
				className="aspect-square rounded-lg shadow-brand-1 desktop:!h-auto desktop:!w-full"
				color={value}
				onChange={onChange}
			/>
			<div className="focusable-within flex items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 dark:bg-black-60 dark:text-white-20">
				<div className="flex items-center justify-center bg-[var(--color)] p-2 text-[lch(from_var(--color)_calc((49.44_-_l)_*_infinity)_0_0)]">
					<Hash className="size-7" />
				</div>
				<HexColorInput
					className="w-full border-none bg-transparent px-4 py-2 font-mono uppercase caret-theme-2 placeholder:text-black-20 focus:outline-none focus:ring-0 disabled:text-black-20 dark:placeholder:text-white-50 dark:disabled:text-white-50"
					color={value}
					onChange={onChange}
				/>
				{value && (
					<button
						className="focusable pointer-events-auto absolute right-4 rounded-full brightness-90 hocus:brightness-100"
						tabIndex={0}
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onChange("");
						}}
					>
						<X className="size-5" />
					</button>
				)}
			</div>
		</div>
	);
};

export const InputProfileColor: FC<{ value: ProfileColors; onChange: Dispatch<ProfileColors> }> = ({ value, onChange }) => {
	const { color_1, color_2 } = value;

	const [selectedColorIndex, setSelectedColorIndex] = useState(0);
	const selectedColor = selectedColorIndex === 0 ? color_1 : color_2;

	function change(newColor: string) {
		const value = selectedColorIndex === 0
			? { color_1: newColor, color_2 }
			: { color_1, color_2: newColor };

		onChange(value);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2">
				<button
					className={twMerge(
						"focusable size-8 rounded-md",
						selectedColorIndex === 0 && "focused"
					)}
					style={{ backgroundColor: color_1 }}
					type="button"
					onClick={() => setSelectedColorIndex(0)}
				/>
				<button
					className={twMerge(
						"focusable size-8 rounded-md",
						selectedColorIndex === 1 && "focused"
					)}
					style={{ backgroundColor: color_2 }}
					type="button"
					onClick={() => setSelectedColorIndex(1)}
				/>
			</div>
			<InputColor value={selectedColor} onChange={change} />
		</div>
	);
};

const ProfileColorEditor: FC = () => {
	const {
		fields: { color_1, color_2 }
	} = useFormContext<ProfileColors>();

	return (
		<InputProfileColor
			value={{
				color_1: color_1.props.value,
				color_2: color_2.props.value
			}}
			onChange={(value) => {
				color_1.props.onChange(value.color_1);
				color_2.props.onChange(value.color_2);
			}}
		/>
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
							color_1.props.value === theme.color_1
							&& color_2.props.value === theme.color_2
							&& "focused border-2"
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
	const disabled
		= (!session.user.subscription || !session.user.subscription.active)
		&& (changes.includes("color_1") || changes.includes("color_2"));

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
			fields={{
				color_1: session.user.profile.color_1 || defaultTheme.color_1,
				color_2: session.user.profile.color_2 || defaultTheme.color_2
			}}
			className="flex flex-col gap-8"
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
