import type { FC } from "react";
import { Trans } from "react-i18next";
import ImageWrapped2025 from "virtual:remote/static/news/wrapped-2025.png?as=metadata";

import { commonComponents, ExpandableImage } from "./common";

export const Wrapped2025: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={{
			...commonComponents,
			"image-wrapped": (
				<ExpandableImage className="w-full rounded-lg" height={ImageWrapped2025.height} src={ImageWrapped2025.src} width={ImageWrapped2025.width} />
			)
		}}
		i18nKey="news.2025_wrapped.body"
	/>
);
