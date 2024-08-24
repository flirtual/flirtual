import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

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

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("download");

	return {
		title: t("title")
	};
}

export default function DownloadPage() {
	const t = useTranslations("download");

	return (
		<SoleModelLayout>
			<ModelCard className="w-full desktop:max-w-2xl" title={t("title")}>
				<div className="grid grid-cols-1 gap-4 gap-y-2 desktop:grid-cols-2">
					<MobileButton
						href={urls.apps.apple}
						Icon={AppleIcon}
						label={t("mad_that_anaconda_race")}
					/>
					<MobileButton
						href={urls.apps.google}
						Icon={GooglePlayIcon}
						label={t("great_actual_bear_borrow")}
					/>
					<MobileButton
						href={urls.apps.microsoft}
						Icon={MicrosoftIcon}
						label={t("polite_sad_stork_race")}
					/>
					<MobileButton
						href={urls.apps.sideQuest}
						Icon={MetaIcon}
						label={t("simple_awful_giraffe_snip")}
					/>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
