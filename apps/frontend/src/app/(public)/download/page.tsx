import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";
import { MobileButton } from "~/components/mobile-button";
import {
	AppleIcon,
	GooglePlayIcon,
	MetaIcon,
	MicrosoftIcon
} from "~/components/icons";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Download"
};

export default function DownloadPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full desktop:max-w-2xl" title="Download app">
				<div className="grid grid-cols-1 gap-4 gap-y-2 desktop:grid-cols-2">
					<MobileButton
						href={urls.apps.apple}
						Icon={AppleIcon}
						label="App Store"
					/>
					<MobileButton
						href={urls.apps.google}
						Icon={GooglePlayIcon}
						label="Google Play"
					/>
					<MobileButton
						href={urls.apps.microsoft}
						Icon={MicrosoftIcon}
						label="Microsoft Store"
					/>
					<MobileButton
						href={urls.apps.sideQuest}
						Icon={MetaIcon}
						label="SideQuest"
					/>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
