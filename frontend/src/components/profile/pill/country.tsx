/* eslint-disable @next/next/no-img-element */
import { twMerge } from "tailwind-merge";

import { withAttribute } from "~/api/attributes-server";

import { Pill } from "./pill";

export interface CountryPillProps {
	code: string;
	flagOnly?: boolean;
	className?: string;
}

export async function CountryPill({ code, flagOnly = false, className }: CountryPillProps) {
	const country = await withAttribute("country", code);
	if (!country) return null;

	return (
		<Pill
			className={twMerge("shrink-0", flagOnly && "overflow-hidden p-0", className)}
			hocusable={false}
			small={true}
		>
			<img
				className={twMerge("aspect-[4/3] h-8 w-max shrink-0", flagOnly ? "" : "-ml-4 rounded-l-xl")}
				src={country.metadata.flagUrl}
			/>
			{!flagOnly && <span>{country.name}</span>}
		</Pill>
	);
}
