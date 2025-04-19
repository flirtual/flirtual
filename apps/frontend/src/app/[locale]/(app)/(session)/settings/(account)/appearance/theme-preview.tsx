"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { capitalize } from "remeda";
import { twMerge } from "tailwind-merge";

import type { PreferenceTheme } from "~/api/user/preferences";
import { Image } from "~/components/image";
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
						alt={`${capitalize(theme)} theme preview`}
						className="rounded-lg"
						height={206}
						src={urls.media(t(`${theme}_theme_image` as any))}
						width={320}
					/>
					{active && (
						<CheckCircleIcon className="absolute right-0.5 top-0.5 size-6 text-white-10" />
					)}
				</button>
			</TooltipTrigger>
			<TooltipContent>
				{theme === "system"
					? "Automatically match your system theme"
					: `${capitalize(theme)} theme`}
			</TooltipContent>
		</Tooltip>
	);
};
