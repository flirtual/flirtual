import type { FC } from "react";
import { Trans } from "react-i18next";

import { useLocale } from "~/i18n";

import { InlineLink } from "./inline-link";

export const PolicyDates: FC<{
	introduced: Date;
	superseded?: Date;
	otherPolicy: string;
}> = ({ introduced, superseded, otherPolicy }) => {
	const [locale] = useLocale();

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat(locale, {
			dateStyle: "long",
			timeZone: "UTC"
		}).format(date);
	};

	const formatRange = (start: Date, end: Date) => {
		return new Intl.DateTimeFormat(locale, {
			dateStyle: "long",
			timeZone: "UTC"
		}).formatRange(start, end);
	};

	const now = new Date();
	let key = "";
	let values: Record<string, string> = {};

	if (superseded) {
		if (superseded < now) {
			// Outdated policy
			key = "fancy_noisy_grizzly_hint";
			values = { range: formatRange(introduced, superseded) };
		}
		else {
			// Expiring policy
			key = "last_large_midge_spur";
			values = { range: formatRange(introduced, superseded) };
		}
	}
	else {
		if (introduced < now) {
			// Active policy
			key = "last_updated_date";
			values = { date: formatDate(introduced) };
		}
		else {
			// Upcoming policy
			key = "suave_same_macaw_affirm";
			values = { date: formatDate(introduced) };
		}
	}

	return (
		<p className="font-semibold">
			<Trans
				components={{
					otherPolicy: <InlineLink href={otherPolicy} />
				}}
				i18nKey={key as any}
				values={values}
			/>
		</p>
	);
};
