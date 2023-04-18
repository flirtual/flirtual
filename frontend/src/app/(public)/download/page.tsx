import { Metadata } from "next";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";
import { MobileButton } from "~/components/mobile-button";
import { AppleIcon, GooglePlayIcon, MetaIcon, MicrosoftIcon } from "~/components/icons";

export const metadata: Metadata = {
	title: "Download"
};

export default function DownloadPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full sm:max-w-2xl" title="Download app">
				<div className="grid grid-cols-1 gap-4 gap-y-2 md:grid-cols-2">
					<MobileButton href={urls.apps.android} Icon={GooglePlayIcon} label="Google Play" />
					<MobileButton href={urls.apps.ios} Icon={AppleIcon} label="iPhone/iPad" />
					<MobileButton href={urls.apps.windows} Icon={MicrosoftIcon} label="Windows" />
					<MobileButton href={urls.apps.sideQuest} Icon={MetaIcon} label="SideQuest" />
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
