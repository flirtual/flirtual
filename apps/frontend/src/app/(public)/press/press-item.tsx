import React from "react";

import { InlineLink } from "~/components/inline-link";

export interface PressItemProps {
	name: string;
	href: string;
	site: string;
	date: string;
}

export const PressItem: React.FC<PressItemProps> = (props) => (
	<div className="flex flex-col text-xl">
		<InlineLink className="font-semibold" href={props.href}>
			{props.name}
		</InlineLink>
		<div className="flex items-baseline gap-2">
			<span>{props.site}</span>
			<span className="text-sm">{props.date}</span>
		</div>
	</div>
);
