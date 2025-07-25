import type React from "react";

import { InlineLink } from "~/components/inline-link";
import { useLocale } from "~/i18n";

export interface PressItemProps {
	name: string;
	href: string;
	site: string;
	date: Date;
}

export const PressItem: React.FC<PressItemProps> = ({ name, href, date, site }) => {
	const [locale] = useLocale();

	return (
		<div className="select-children flex flex-col text-xl">
			<InlineLink className="font-semibold" href={href}>
				{name}
			</InlineLink>
			<div className="flex items-baseline gap-2">
				<span>{site}</span>
				<span className="text-sm">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date)}</span>
			</div>
		</div>
	);
};
