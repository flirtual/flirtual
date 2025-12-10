import type { FC } from "react";
import { Trans } from "react-i18next";
import ImageWrapped from "virtual:remote/static/news/wrapped.png";

import { Image } from "~/components/image";

import { commonComponents } from "./common";

export const Wrapped2024: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-wrapped": (
				<Image className="w-full rounded-lg" src={ImageWrapped} />
			)
		}}
		i18nKey="news.2024_wrapped.body"
	/>
);
