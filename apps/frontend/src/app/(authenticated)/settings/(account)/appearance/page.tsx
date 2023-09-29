import { Metadata } from "next";
import { CSSProperties } from "react";

import { ModelCard } from "~/components/model-card";
import { InputLabel } from "~/components/inputs";
import { PreferenceThemes } from "~/api/user/preferences";
import { PremiumBadge } from "~/components/premium-badge";
import { Profile } from "~/components/profile/profile";
import { withSession } from "~/server-utilities";
import { ThemedBorder } from "~/components/themed-border";
import { Pill } from "~/components/profile/pill/pill";
import { Html } from "~/components/html";

import { ThemePreview } from "./theme-preview";

export const metadata: Metadata = {
	title: "Appearance"
};

export default async function SettingsAccountAppearancePage() {
	const session = await withSession();

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
				<div className="flex w-full justify-between gap-8">
					<div className="flex shrink-0 flex-col gap-2">
						<InputLabel className="flex items-center gap-2">
							<span>Profile colors</span>
							<PremiumBadge />
						</InputLabel>
						<div className="flex">
							<input type="color" />
							<input type="color" />
						</div>
					</div>

					<ThemedBorder
						className="flex flex-col rounded-lg"
						style={
							{
								"--theme-1": "red",
								"--theme-2": "blue"
							} as CSSProperties
						}
					>
						<div className="flex h-full w-full flex-col gap-4 rounded-lg bg-cream px-3 py-2 text-black-70">
							<span>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
							</span>
							<div className="flex scale-75 flex-wrap gap-2 [transform-origin:top_left]">
								<Pill active small>
									Friendly
								</Pill>
								<Pill active small>
									Dancing
								</Pill>
								<Pill small>Anime</Pill>
								<Pill active small>
									VRChat
								</Pill>
							</div>
						</div>
						<div className="flex h-full w-full flex-col gap-4 rounded-lg bg-black-80 px-3 py-2 text-white-20">
							<span>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
							</span>
							<div className="flex scale-75 flex-wrap gap-2 [transform-origin:top_left]">
								<Pill active small>
									Friendly
								</Pill>
								<Pill active small>
									Dancing
								</Pill>
								<Pill small>Anime</Pill>
								<Pill active small>
									VRChat
								</Pill>
							</div>
						</div>
					</ThemedBorder>
				</div>
			</div>
		</ModelCard>
	);
}
