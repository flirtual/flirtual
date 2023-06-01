"use client";

import { ComponentProps, FC, useMemo } from "react";

import { RelativeTimeOptions, relativeTime } from "~/date";

import { RefreshInterval } from "./refresh-interval";

type TimeRelativeProps = {
	elementProps?: ComponentProps<"span">;
	every?: string | number;
	value: string;
} & RelativeTimeOptions;

export const TimeRelative: FC<TimeRelativeProps> = (props) => {
	const { every = "1s", value, elementProps, ...options } = props;
	const date = useMemo(() => new Date(value), [value]);

	return (
		<RefreshInterval every={every}>
			{() => (
				<span suppressHydrationWarning {...elementProps}>
					{relativeTime(date, options)}
				</span>
			)}
		</RefreshInterval>
	);
};
