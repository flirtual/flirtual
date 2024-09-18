"use client";

import { useFormatter, type DateTimeFormatOptions } from "next-intl";
import { type ComponentProps, type FC, useMemo } from "react";

interface DateTimeRelativeProps {
	value: string;
	options?: DateTimeFormatOptions;
}

export const DateTimeRelative: FC<
	DateTimeRelativeProps & ComponentProps<"span">
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
