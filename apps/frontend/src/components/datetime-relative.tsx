"use client";

import { ComponentProps, FC, useMemo } from "react";

import { useHydrated } from "~/hooks/use-hydrated";

interface DateTimeRelativeProps {
	elementProps?: ComponentProps<"span">;
	value: string;
}

export const DateTimeRelative: FC<DateTimeRelativeProps> = (props) => {
	const { value, elementProps } = props;
	const date = useMemo(() => new Date(value), [value]);

	const hydrated = useHydrated();

	return (
		<span {...elementProps}>
			{/* After hydration, use the user's locale. */}
			{date.toLocaleString(hydrated ? navigator.language : "en-US")}
		</span>
	);
};
