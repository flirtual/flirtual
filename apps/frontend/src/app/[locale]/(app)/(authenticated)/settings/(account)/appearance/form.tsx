"use client";

import { Hash, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties, Dispatch, FC } from "react";
import { useEffect, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { flushSync } from "react-dom";
import { twMerge } from "tailwind-merge";

import type { Session } from "~/api/auth";
import { PreferenceThemes } from "~/api/user/preferences";
import { Profile, type ProfileColors } from "~/api/user/profile";
import { PremiumBadge } from "~/components/badge";
import { Form, FormButton } from "~/components/forms";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputRadioList } from "~/components/inputs";
import { InputLanguageSelect } from "~/components/inputs/specialized/language-select";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useFormContext } from "~/hooks/use-input-form";
import { useOptionalSession, useSession } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { useToast } from "~/hooks/use-toast";
import { useRouter } from "~/i18n/navigation";
import { defaultLocale } from "~/i18n/routing";
import { mutate, sessionKey, useMutation } from "~/query";
import { urls } from "~/urls";

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

const SaveButton: FC = () => {
	const session = useOptionalSession();
	const t = useTranslations();
	const { changes } = useFormContext<ProfileColors>();

	if (!session) return null;
	const disabled
		= (!session.user.subscription || !session.user.subscription.active)
			&& (changes.includes("color1") || changes.includes("color2"));

	return (
		<FormButton disabled={disabled}>
			{t("save")}
			{" "}
			{disabled && t("premium_required")}
		</FormButton>
	);
};

const ProfileColorSelect: FC = () => {
	const [theme] = useTheme();
	const { user } = useSession();
	const router = useRouter();

	const defaultColors = defaultProfileColors[theme];
	const colors: ProfileColors = (user.profile as unknown as { previewColors: ProfileColors }).previewColors || {
		color1: user.profile.color1 || defaultColors.color1,
		color2: user.profile.color2 || defaultColors.color2
	};

	const [selectedColorIndex, setSelectedColorIndex] = useState(0);
	const selectedColor = selectedColorIndex === 0 ? colors.color1 : colors.color2;

	const [grassTouched, setGrassTouched] = useState(0);
	const [touchingGrass, setTouchingGrass] = useState(false);

	const { mutateAsync, reset } = useMutation({
		mutationKey: sessionKey(),

		onMutate: async (colors: ProfileColors) => {
			await mutate<Session | null>(sessionKey(), (session) => {
				if (!session) return session;

				return {
					...session,
					user: {
						...session.user,
						profile: user.subscription?.active
							? {
									...session.user.profile,
									color1: colors.color1,
									color2: colors.color2
								}
							: {
									...session.user.profile,
									previewColors: colors
								}
					}
				};
			});
		},
		mutationFn: async (colors: ProfileColors) => {
			if (!user.subscription?.active) return;
			await Profile.updateColors(user.id, colors);
		}
	});

	useEffect(() => () => {
		mutate<Session | null>(sessionKey(), (session) => {
			if (!session) return session;

			return {
				...session,
				user: {
					...session.user,
					profile: {
						...session.user.profile,
						// On unmount, reset the preview colors.
						previewColors: undefined
					}
				}
			};
		});
	}, [reset]);

	const t = useTranslations();

	return (
		<div className="flex w-full flex-col gap-8">
			<div className="flex w-full flex-col justify-between gap-8 wide:flex-row">
				<div className="flex shrink-0 flex-col gap-2">
					<InputLabel className="flex items-center gap-2">
						<span>{t("profile_colors")}</span>
						<PremiumBadge />
					</InputLabel>
					<div className="flex flex-col gap-4">
						<div className="flex gap-2">
							<button
								className={twMerge(
									"focusable size-8 rounded-md",
									selectedColorIndex === 0 && "focused"
								)}
								style={{ backgroundColor: colors.color1 }}
								type="button"
								onClick={() => setSelectedColorIndex(0)}
							/>
							<button
								className={twMerge(
									"focusable size-8 rounded-md",
									selectedColorIndex === 1 && "focused"
								)}
								style={{ backgroundColor: colors.color2 }}
								type="button"
								onClick={() => setSelectedColorIndex(1)}
							/>
						</div>
						<InputColor
							value={selectedColor}
							onChange={(newColor) => {
								const value = selectedColorIndex === 0
									? { color1: newColor, color2: colors.color2 }
									: { color1: colors.color1, color2: newColor };

								mutateAsync(value);
							}}
						/>
					</div>
				</div>
				<ProfileColorPreview {...colors} />
			</div>
			<div className="grid w-full grid-cols-2 gap-2 wide:grid-cols-4">
				{[
					{ name: "flirtual" as const, description: t("default"), ...defaultColors },
					...recommendedThemes
				].map((theme) => (
					<button
						className="relative flex flex-col"
						key={theme.name}
						type="button"
						onClick={async () => {
							if (theme.name === "touch_grass") {
								if (!touchingGrass) {
									setTouchingGrass(true);
									if (grassTouched >= 4) {
										await new Promise((resolve) => {
											setTimeout(resolve, 800);
										});
										router.push(urls.settings.fun);
									}
									setGrassTouched(grassTouched + 1);
								}
							}
							else {
								setGrassTouched(0);
							}

							mutateAsync(theme);
						}}
					>
						<div className="flex w-fit items-baseline gap-2">
							<span className="ja:text-sm">{t(theme.name)}</span>
							{"description" in theme && (
								<span className="text-sm text-black-50 vision:text-white-40 ja:text-xs dark:text-white-40">
									{theme.description}
								</span>
							)}
						</div>
						<div
							className={twMerge(
								"h-8 w-full rounded-md",
								colors.color1 === theme.color1 && colors.color2 === theme.color2
								&& "focused border-2"
							)}
							style={{
								backgroundImage: `linear-gradient(to right, ${theme.color1}, ${theme.color2})`
							}}
						/>
						{theme.name === "touch_grass" && touchingGrass && (
							<span
								className="absolute left-0 top-7 -scale-x-100 animate-touch-grass"
								onAnimationEnd={() => {
									setTouchingGrass(false);
								}}
							>
								🫳
							</span>
						)}
					</button>
				))}
			</div>
		</div>
	);
};

export const AppearanceForm: FC = () => {
	const locale = useLocale();
	const session = useSession();

	const t = useTranslations();
	const tAttribute = useAttributeTranslation();

	const [theme] = useTheme();

	/*
	fields={{
				color1: session.user.profile.color1 || defaultTheme.color1,
				color2: session.user.profile.color2 || defaultTheme.color2
			}}
			className="flex flex-col gap-8"
			onSubmit={async (values) => {
				if (session.user.subscription?.active) {
					await Profile.updateColors(session.user.id, values);
				}

				toasts.add(t("neat_plane_slug_savor"));
				router.refresh();
			}}
				*/

	return (
		<div className="flex flex-col gap-8">
			{session.user.tags?.includes("debugger") && (
				<div className="flex flex-col gap-2">
					<InputLabel
						inline
						hint={(
							<InputLabelHint>
								{t.rich(locale === defaultLocale
									? "help_translate_others"
									: "help_translate", {
									language: tAttribute[locale]?.name || locale,
									link: (children) => (
										<InlineLink
											href={`https://hosted.weblate.org/projects/flirtual/flirtual/${locale === defaultLocale ? "" : locale}`}
										>
											{children}
										</InlineLink>
									)
								})}
							</InputLabelHint>
						)}
					>
						{t("language")}
					</InputLabel>
					<InputLanguageSelect />
				</div>
			)}
			<div className="flex flex-col gap-2 vision:hidden">
				<InputLabel>{t("theme")}</InputLabel>
				<div className="grid grid-cols-3 gap-4">
					{PreferenceThemes.map((theme) => (
						<ThemePreview key={theme} theme={theme} />
					))}
				</div>
			</div>
			<ProfileColorSelect />
		</div>
	);
};
