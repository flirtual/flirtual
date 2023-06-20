"use client";

import { ComponentProps, FC, useMemo } from "react";

import { useHydrated } from "~/hooks/use-hydrated";

interface DateTimeRelativeProps {
	value: string;
}

export const DateTimeRelative: FC<
	DateTimeRelativeProps & ComponentProps<"span">
> = (props) => {
	const { value, ...elementProps } = props;
	const date = useMemo(() => new Date(value), [value]);

	const hydrated = useHydrated();

	return (
		<span {...elementProps}>
			{/* After hydration, use the user's locale. */}
			{date.toLocaleString(hydrated ? navigator.language : "en-US")}
		</span>
	);
};
