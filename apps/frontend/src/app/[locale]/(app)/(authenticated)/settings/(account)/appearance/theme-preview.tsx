"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { SelectTrigger as RadixSelectTrigger } from "@radix-ui/react-select";
import { ChevronDown, Moon, Palette, Sun, SunMoon } from "lucide-react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { type PreferenceTheme, PreferenceThemes } from "~/api/user/preferences";
import { Image } from "~/components/image";
import {
	InputSelect,
	Select,
	SelectContent,
	SelectItem
} from "~/components/inputs/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useTheme } from "~/hooks/use-theme";
import { urls } from "~/urls";

export interface ThemePreviewProps {
	theme: PreferenceTheme;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
	const t = useTranslations();

	const [, setTheme, { sessionTheme }] = useTheme();
	const active = theme === sessionTheme;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					className={twMerge(
						"relative overflow-hidden rounded-xl p-1",
						active ? "bg-theme-2" : "border-transparent"
					)}
					type="button"
					onClick={() => setTheme(theme)}
				>
					<Image
						alt={t(`${theme}_theme_preview`)}
						className="rounded-lg"
						height={206}
						src={urls.media(t(`${theme}_theme_image`))}
						width={320}
					/>
					{active && (
						<CheckCircleIcon className="absolute right-0.5 top-0.5 size-6 text-white-10" />
					)}
				</button>
			</TooltipTrigger>
			<TooltipContent>
				{theme === "system"
					? t("close_cozy_salmon_praise")
					: t(`${theme}_theme`)}
			</TooltipContent>
		</Tooltip>
	);
};

export const InlineThemeSelect: React.FC<{ className?: string }> = ({ className }) => {
	const t = useTranslations();

	const [, setTheme, { sessionTheme: theme }] = useTheme();
	const ThemeIcon = {
		dark: Moon,
		light: Sun,
		system: SunMoon,
	}[theme];

	return (
		<Select onValueChange={(theme: PreferenceTheme) => setTheme(theme)}>
			<RadixSelectTrigger className={twMerge("focusable flex items-center gap-0.5em whitespace-nowrap", className)}>
				<ThemeIcon className="inline-block size-em" />
				{" "}
				{t(theme)}
				{" "}
				<ChevronDown className="inline-block size-em" />
			</RadixSelectTrigger>
			<SelectContent>
				{PreferenceThemes.map((value) => (
					<SelectItem
						className="flex w-full items-center gap-2"
						key={value}
						value={value}
					>
						{t(value)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
