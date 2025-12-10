import type { FC } from "react";
import { Trans } from "react-i18next";
import ImageProfileUpdates from "virtual:remote/static/news/profile-updates.png";

import { Image } from "~/components/image";

import { commonComponents } from "./common";

export const HundredK2024: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-profile-updates": (
				<Image className="w-full rounded-lg" src={ImageProfileUpdates} />
			)
		}}
		i18nKey="news.2024_100k.body"
	/>
);
