"use client";

import { type createFormatter, useFormatter } from "next-intl";
import { type ComponentProps, type FC, useMemo } from "react";

import { RefreshInterval } from "./refresh-interval";

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
	const { every = "1s", value, elementProps, ...options } = props;

	const date = useMemo(() => new Date(value), [value]);
	const formatter = useFormatter();

	return (
		<RefreshInterval every={every}>
			{() => (
				<span suppressHydrationWarning {...elementProps}>
					{formatter.relativeTime(date, options)}
				</span>
			)}
		</RefreshInterval>
	);
};
