import type { StringValue } from "ms";
import { useCallback, useMemo, useState } from "react";
import type { ComponentProps, FC } from "react";

import { useInterval } from "~/hooks/use-interval";
import { useLocale } from "~/i18n";

interface TimeRelativeProps extends Intl.RelativeTimeFormatOptions {
	elementProps?: ComponentProps<"span">;
	every?: StringValue | number;
	value: string;
}

export const TimeRelative: FC<TimeRelativeProps> = (props) => {
	const { value, every: _every, elementProps, ...options } = props;

	const date = useMemo(() => new Date(value), [value]);
	const [now, setNow] = useState(() => Date.now());
	const [locale] = useLocale();

	const difference = now - date.getTime();

	let every = _every;
	if (!every) {
		every = "1s";
		if (difference > 60 * 1000) every = "1m";
		if (difference > 60 * 60 * 1000) every = "1h";
	}

	useInterval(
		useCallback(() => setNow(Date.now()), []),
		every
	);

	return (
		<span suppressHydrationWarning {...elementProps}>
			{new Intl.RelativeTimeFormat(locale, options).format(
				Math.round((date.getTime() - now) / 1000),
				"second"
			)}
		</span>
	);
};
