import { useFormatter } from "next-intl";
import type { DateTimeFormatOptions } from "next-intl";
import { useMemo } from "react";
import type { ComponentProps, FC } from "react";

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
