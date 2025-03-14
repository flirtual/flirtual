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

const ThemeImage = {
	light: "52f7a831-8f7d-46c3-aace-4a99d1f4792d",
	dark: "794de6d9-9687-41f1-9d14-9d912f33d9e2",
	system: "b64a38d7-4a94-42bc-8f7d-476f4e63e55f"
};

export interface ThemePreviewProps {
	theme: PreferenceTheme;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
	const t = useTranslations();
	const { setTheme, sessionTheme } = useTheme();
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
