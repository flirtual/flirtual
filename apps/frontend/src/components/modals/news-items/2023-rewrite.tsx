import type { FC } from "react";
import { Trans } from "react-i18next";

import { commonComponents } from "./common";

export const Rewrite2023: FC<{ onSaved?: () => void }> = () => (
	<Trans
		components={commonComponents}
		i18nKey="news.2023_rewrite.body"
	/>
);
