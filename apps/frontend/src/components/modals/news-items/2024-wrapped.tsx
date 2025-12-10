import type { FC } from "react";
import { Trans } from "react-i18next";
import ImageWrapped from "virtual:remote/static/news/wrapped.png?as=metadata";

import { Image } from "~/components/image";

import { commonComponents } from "./common";

export const Wrapped2024: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-wrapped": (
				<Image className="w-full rounded-lg" height={ImageWrapped.height} src={ImageWrapped.src} width={ImageWrapped.width} />
			)
		}}
		i18nKey="news.2024_wrapped.body"
	/>
);
