import type { FC } from "react";
import { Trans } from "react-i18next";
import ImageHomiesDay1 from "virtual:remote/static/news/homies-day-1.png?as=metadata";
import ImageHomiesDay2 from "virtual:remote/static/news/homies-day-2.png?as=metadata";

import { Image } from "~/components/image";

import { commonComponents } from "./common";

export const HomiesDay2024: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-homies-day-1": (
				<Image className="w-full" height={ImageHomiesDay1.height} src={ImageHomiesDay1.src} width={ImageHomiesDay1.width} />
			),
			"image-homies-day-2": (
				<Image className="w-full" height={ImageHomiesDay2.height} src={ImageHomiesDay2.src} width={ImageHomiesDay2.width} />
			)
		}}
		i18nKey="news.2024_homies_day.body"
	/>
);
