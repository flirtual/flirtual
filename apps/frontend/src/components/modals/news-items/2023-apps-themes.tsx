import type { FC } from "react";
import { Trans } from "react-i18next";
import ImageMobileApps from "virtual:remote/static/news/mobile-apps.png?as=metadata";

import { Image } from "~/components/image";

import { commonComponents } from "./common";

export const AppsThemes2023: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-mobile-apps": (
				<Image className="w-full" height={ImageMobileApps.height} src={ImageMobileApps.src} width={ImageMobileApps.width} />
			)
		}}
		i18nKey="news.2023_apps_themes.body"
	/>
);
