import { useFormatter, useTranslations } from "next-intl";
import type { FC } from "react";

import { InlineLink } from "./inline-link";

export const SupersededPolicy: FC<{
	introduced: Date;
	superseded: Date;
	current: string;
}> = ({ introduced, superseded, current }) => {
	const t = useTranslations();
	const { dateTimeRange } = useFormatter();

	return (
		<p className="font-semibold">
			{t.rich("fancy_noisy_grizzly_hint", {
				range: dateTimeRange(introduced, superseded),
				current: (children) => (
					<InlineLink href={current}>{children}</InlineLink>
				)
			})}
		</p>
	);
};
