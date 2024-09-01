import { useFormatter } from "next-intl";
import React from "react";

import { InlineLink } from "~/components/inline-link";

export interface PressItemProps {
	name: string;
	href: string;
	site: string;
	date: Date;
}

export const PressItem: React.FC<PressItemProps> = (props) => {
	const { dateTime } = useFormatter();

	return (
		<div className="flex flex-col text-xl">
			<InlineLink className="font-semibold" href={props.href}>
				{props.name}
			</InlineLink>
			<div className="flex items-baseline gap-2">
				<span>{props.site}</span>
				<span className="text-sm">{dateTime(props.date)}</span>
			</div>
		</div>
	);
};
