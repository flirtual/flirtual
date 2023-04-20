"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { twMerge } from "tailwind-merge";

import { PreferenceThemes } from "~/api/user/preferences";
import { InputLabel } from "~/components/inputs";
import { Tooltip } from "~/components/tooltip";
import { useSession } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { capitalize } from "~/utilities";

const ThemePreview: React.FC<{ theme: string; isSelected: boolean; onClick: () => void }> = ({
	theme,
	isSelected,
	onClick
}) => {
	const previewImage = `/images/theme-${theme}.png`;

	return (
		<div className="flex w-full flex-col px-2 py-4 lg:w-1/3" onClick={onClick}>
			<Tooltip
				value={
					theme == "system" ? "Automatically match your system theme" : capitalize(theme) + " theme"
				}
			>
				<div
					className={twMerge(
						"relative rounded-xl border-4",
						isSelected ? "border-pink" : "border-transparent"
					)}
				>
					<img className="w-full rounded-md" src={previewImage} />
					{isSelected && (
						<CheckCircleIcon className="absolute right-0.5 top-0.5 h-6 w-6 text-white-10" />
					)}
				</div>
			</Tooltip>
		</div>
	);
};

export const AppearanceForm: React.FC = () => {
	const [session] = useSession();
	const { setTheme, sessionTheme } = useTheme();

	if (!session) return null;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<InputLabel>Theme</InputLabel>
				<div className="flex flex-wrap">
					{PreferenceThemes.map((theme) => (
						<ThemePreview
							isSelected={sessionTheme === theme}
							key={theme}
							theme={theme}
							onClick={() => setTheme(theme)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
