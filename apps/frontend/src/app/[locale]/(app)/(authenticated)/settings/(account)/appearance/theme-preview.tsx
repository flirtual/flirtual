import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { SelectTrigger as RadixSelectTrigger } from "@radix-ui/react-select";
import { ChevronDown, Moon, Sun, SunMoon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { PreferenceThemes } from "~/api/user/preferences";
import type { PreferenceTheme } from "~/api/user/preferences";
import { Image } from "~/components/image";
import {
	Select,
	SelectContent,
	SelectItem
} from "~/components/inputs/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useTheme } from "~/hooks/use-theme";
import DarkThemeImage from "~/static/themes/dark.png";
import LightThemeImage from "~/static/themes/light.png";
import SystemThemeImage from "~/static/themes/system.png";

const themeImages: Record<PreferenceTheme, string> = {
	light: LightThemeImage,
	dark: DarkThemeImage,
	system: SystemThemeImage
};

export interface ThemePreviewProps {
	theme: PreferenceTheme;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
	const { t } = useTranslation();

	const [, setTheme, { localTheme }] = useTheme();
	const active = theme === localTheme;

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
						src={themeImages[theme]}
						width={320}
					/>
					{active && (
						<CheckCircleIcon className="absolute top-0.5 right-0.5 size-6 text-white-10" />
					)}
				</button>
			</TooltipTrigger>
			<TooltipContent>
				{theme === "system"
					? t("theme_system_tooltip")
					: t(`${theme}_theme`)}
			</TooltipContent>
		</Tooltip>
	);
};

export const InlineThemeSelect: React.FC<{ className?: string }> = ({ className }) => {
	const { t } = useTranslation();

	const [, setTheme, { localTheme: theme }] = useTheme();
	const ThemeIcon = {
		dark: Moon,
		light: Sun,
		system: SunMoon,
	}[theme];

	return (
		<Select onValueChange={(theme: PreferenceTheme) => setTheme(theme)}>
			<RadixSelectTrigger className={twMerge("flex items-center gap-0.5em rounded-lg whitespace-nowrap focusable", className)}>
				<ThemeIcon className="inline-block size-em" />
				{" "}
				<span className="grow">{t(theme)}</span>
				{" "}
				<ChevronDown className="inline-block size-em" />
			</RadixSelectTrigger>
			<SelectContent label={t(theme)}>
				{PreferenceThemes.map((value) => (
					<SelectItem
						key={value}
						className="flex w-full items-center gap-2"
						value={value}
					>
						{t(value)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
