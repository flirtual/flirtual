/* eslint-disable @next/next/no-img-element */
import { twMerge } from "tailwind-merge";

import { withAttribute } from "~/api/attributes-server";

import { Pill } from "./pill";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { FC } from "react";

export interface CountryPillProps {
	id: string;
	flagOnly?: boolean;
	className?: string;
}

export const CountryPill: FC<CountryPillProps> = ({
	id,
	flagOnly = false,
	className
}) => {
	const countries = useAttributeList("country");
	const country = countries.find((country) => country.id === id);

	if (!country) return null;

	return (
		<Pill
			hocusable={false}
			small={true}
			className={twMerge(
				"shrink-0",
				flagOnly && "overflow-hidden p-0",
				className
			)}
		>
			<img
				src={country.metadata.flagUrl}
				className={twMerge(
					"aspect-[4/3] h-8 w-max shrink-0",
					flagOnly ? "" : "-ml-4 rounded-l-xl"
				)}
			/>
			{!flagOnly && <span>{country.name}</span>}
		</Pill>
	);
}
