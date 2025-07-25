import type { FC } from "react";
import { Trans } from "react-i18next";

import { useLocale } from "~/i18n";

import { InlineLink } from "./inline-link";

export const SupersededPolicy: FC<{
	introduced: Date;
	superseded: Date;
	current: string;
}> = ({ introduced, superseded, current }) => {
	const [locale] = useLocale();
	const dateTimeRange = (start: Date, end: Date) => {
		return new Intl.DateTimeFormat(locale, {
			dateStyle: "medium",
			timeStyle: "short"
		}).formatRange(start, end);
	};

	return (
		<p className="font-semibold">
			<Trans
				components={{
					link: <InlineLink href={current} />
				}}
				i18nKey="fancy_noisy_grizzly_hint"
				values={{ range: dateTimeRange(introduced, superseded) }}
			/>
		</p>
	);
};
