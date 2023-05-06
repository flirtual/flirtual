/* eslint-disable @next/next/no-img-element */
import { twMerge } from "tailwind-merge";

import { withAttribute } from "~/api/attributes-server";

import { Pill } from "./pill";

export interface CountryPillProps {
	code: string;
	flagOnly?: boolean;
}

export async function CountryPill({ code, flagOnly = false }: CountryPillProps) {
	const country = await withAttribute("country", code);
	if (!country) return null;

	return (
		<Pill className={flagOnly ? "overflow-hidden p-0" : ""} hocusable={false} small={true}>
			<img
				className={twMerge("h-8 shrink-0", flagOnly ? "" : "-ml-4 rounded-l-xl")}
				src={country.metadata.flagUrl}
			/>
			{!flagOnly && <span>{country.name}</span>}
		</Pill>
	);
}
