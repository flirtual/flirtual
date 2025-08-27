import ms from "ms.macro";
import { useCallback, useMemo, useState } from "react";
import type { ComponentProps, FC } from "react";

import { useInterval } from "~/hooks/use-interval";
import { useLocale } from "~/i18n";
import type { Locale } from "~/i18n";

interface TimeRelativeProps extends Intl.RelativeTimeFormatOptions {
	elementProps?: ComponentProps<"span">;
	every?: number;
	value: string;
}

const unitsInSec = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity] as const;
const unitStrings = ["second", "minute", "hour", "day", "week", "month", "year"] as const;

function format(locale: Locale, date: Date, options: Intl.RelativeTimeFormatOptions) {
	const secondsDiff = Math.round((date.getTime() - Date.now()) / 1000);

	const unitIndex = unitsInSec.findIndex((cutoff) => cutoff > Math.abs(secondsDiff));
	const divisor = unitIndex ? unitsInSec[unitIndex - 1] : 1;

	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", ...options });
	return rtf.format(Math.floor(secondsDiff / divisor), unitStrings[unitIndex]);
}

export const TimeRelative: FC<TimeRelativeProps> = (props) => {
	const { value, every: _every, elementProps, ...options } = props;

	const date = useMemo(() => new Date(value), [value]);
	const [now, setNow] = useState(() => Date.now());
	const [locale] = useLocale();

	const difference = now - date.getTime();

	let every = _every;
	if (!every) {
		every = ms("1s");
		if (difference > 60 * 1000) every = ms("1m");
		if (difference > 60 * 60 * 1000) every = ms("1h");
	}

	useInterval(
		useCallback(() => setNow(Date.now()), []),
		every
	);

	return (
		<span suppressHydrationWarning {...elementProps}>
			{format(locale, date, options)}
		</span>
	);
};
