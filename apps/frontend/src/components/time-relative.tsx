"use client";

import { type createFormatter, useFormatter } from "next-intl";
import { type ComponentProps, type FC, useCallback, useMemo, useState } from "react";

import { useInterval } from "~/hooks/use-interval";

type RelativeTimeFormatOptions = Exclude<
	Parameters<ReturnType<typeof createFormatter>["relativeTime"]>[1],
	Date | number | undefined
>;

interface TimeRelativeProps extends RelativeTimeFormatOptions {
	elementProps?: ComponentProps<"span">;
	every?: number | string;
	value: string;
}

export const TimeRelative: FC<TimeRelativeProps> = (props) => {
	const { value, every: _every, elementProps, ...options } = props;

	const date = useMemo(() => new Date(value), [value]);
	const [now, setNow] = useState(() => Date.now());

	const difference = now - date.getTime();

	let every = _every;
	if (!every) {
		every = "1s";
		if (difference > 60 * 1000) every = "1m";
		if (difference > 60 * 60 * 1000) every = "1h";
	}

	const formatter = useFormatter();

	useInterval(
		useCallback(() => setNow(Date.now()), []),
		every
	);

	return (
		<span suppressHydrationWarning {...elementProps}>
			{formatter.relativeTime(date, { ...options, now })}
		</span>
	);
};
