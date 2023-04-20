"use client";

import { ComponentProps, FC, useMemo } from "react";

import { timeSince } from "~/date";

import { RefreshInterval } from "./refresh-interval";

type TimeSinceProps = ComponentProps<"span"> & {
	every?: string | number;
	value: string;
	short?: boolean;
};

export const TimeSince: FC<TimeSinceProps> = (props) => {
	const { every = "1s", value, short = false, ...elementProps } = props;
	const date = useMemo(() => new Date(value), [value]);

	return (
		<RefreshInterval every={every}>
			{() => (
				<span suppressHydrationWarning {...elementProps}>
					{timeSince(date, short)}
				</span>
			)}
		</RefreshInterval>
	);
};
