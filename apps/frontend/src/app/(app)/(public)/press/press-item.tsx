import { useFormatter } from "next-intl";
import type React from "react";

import { InlineLink } from "~/components/inline-link";

export interface PressItemProps {
	name: string;
	href: string;
	site: string;
	date: Date;
}

export const PressItem: React.FC<PressItemProps> = ({ name, href, date, site }) => {
	const { dateTime } = useFormatter();

	return (
		<div className="select-children flex flex-col text-xl">
			<InlineLink className="font-semibold" href={href}>
				{name}
			</InlineLink>
			<div className="flex items-baseline gap-2">
				<span>{site}</span>
				<span className="text-sm">{dateTime(date)}</span>
			</div>
		</div>
	);
};
