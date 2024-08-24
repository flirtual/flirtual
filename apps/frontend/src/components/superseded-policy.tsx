import { useFormatter, useTranslations } from "next-intl";

import { InlineLink } from "./inline-link";

import type { FC } from "react";

export const SupersededPolicy: FC<{
	introduced: Date;
	superseded: Date;
	current: string;
}> = ({ introduced, superseded, current }) => {
	const t = useTranslations("superseded_policy");
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
