import type { FC } from "react";
import { Trans } from "react-i18next";

import { Image } from "~/components/image";
import ImageProfileUpdates from "~/static/news/profile-updates.png?as=metadata";

import { commonComponents } from "./common";

export const HundredK2024: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-profile-updates": (
				<Image className="w-full rounded-lg" height={ImageProfileUpdates.height} src={ImageProfileUpdates.src} width={ImageProfileUpdates.width} />
			)
		}}
		i18nKey="news.2024_100k.body"
	/>
);
