import { useMemo } from "react";
import type { ComponentProps, FC } from "react";

import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";

interface DateTimeRelativeProps {
	value: string;
	options?: Intl.DateTimeFormatOptions;
}

export const DateTimeRelative: FC<
	ComponentProps<"span"> & DateTimeRelativeProps
> = ({ value, options, ...props }) => {
	const date = useMemo(() => new Date(value), [value]);
	const [locale] = useLocale();

	return (
		<span {...props} suppressHydrationWarning>
			{new Intl.DateTimeFormat(intlLocale(locale), {
				dateStyle: "medium",
				timeStyle: "short",
				...options
			}).format(date)}
		</span>
	);
};
