"use client";

import { PreferenceThemes } from "~/api/user/preferences";
import { InputLabel, InputSelect } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { capitalize } from "~/utilities";

export const AppearanceForm: React.FC = () => {
	const [session] = useSession();
	const { setTheme, sessionTheme } = useTheme();

	if (!session) return null;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<InputLabel>Theme</InputLabel>
				<InputSelect
					options={PreferenceThemes.map((theme) => ({ key: theme, label: capitalize(theme) }))}
					value={sessionTheme}
					onChange={setTheme}
				/>
			</div>
		</div>
	);
};
