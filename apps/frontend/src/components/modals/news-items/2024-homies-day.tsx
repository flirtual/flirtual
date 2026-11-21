import type { FC } from "react";
import { Trans } from "react-i18next";

import { Image } from "~/components/image";
import ImageHomiesDay1 from "~/static/news/homies-day-1.png?as=metadata";
import ImageHomiesDay2 from "~/static/news/homies-day-2.png?as=metadata";

import { commonComponents } from "./common";

export const HomiesDay2024: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-homies-day-1": (
				<Image className="w-full" src={ImageHomiesDay1} />
			),
			"image-homies-day-2": (
				<Image className="w-full" src={ImageHomiesDay2} />
			)
		}}
		i18nKey="news.2024_homies_day.body"
	/>
);
