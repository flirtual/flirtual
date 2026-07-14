import type { FC } from "react";
import { Trans } from "react-i18next";

import { commonComponents } from "./common";

export const HomieMode2026: FC<{ onSaved?: () => void }> = () => (
	<Trans components={commonComponents} i18nKey="news.2026_homie_mode.body" />
);
