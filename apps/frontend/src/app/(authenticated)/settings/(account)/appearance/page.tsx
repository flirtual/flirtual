import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";
import { InputLabel } from "~/components/inputs";
import { PreferenceThemes } from "~/api/user/preferences";

import { ThemePreview } from "./theme-preview";

export const metadata: Metadata = {
	title: "Appearance"
};

export default function SettingsAccountAppearancePage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Appearance">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<InputLabel>Theme</InputLabel>
					<div className="grid grid-cols-3 gap-4">
						{PreferenceThemes.map((theme) => (
							<ThemePreview key={theme} theme={theme} />
						))}
					</div>
				</div>
			</div>
		</ModelCard>
	);
}
