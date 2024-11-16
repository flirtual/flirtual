"use client";

import { type DateTimeFormatOptions, useFormatter } from "next-intl";
import { type ComponentProps, type FC, useMemo } from "react";

interface DateTimeRelativeProps {
	value: string;
	options?: DateTimeFormatOptions;
}

export const DateTimeRelative: FC<
	ComponentProps<"span"> & DateTimeRelativeProps
> = ({ value, options, ...props }) => {
	const date = useMemo(() => new Date(value), [value]);
	const formatter = useFormatter();

	return (
		<span {...props} suppressHydrationWarning>
			{formatter.dateTime(date, {
				dateStyle: "medium",
				timeStyle: "short",
				...options
			})}
		</span>
	);
};
