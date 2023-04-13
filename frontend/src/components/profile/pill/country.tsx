"use client";

import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { useAttributeList } from "~/hooks/use-attribute-list";
import { findBy } from "~/utilities";

import { Pill } from "./pill";

export const CountryPill: React.FC<{ code: string; flagOnly?: boolean }> = ({
	code,
	flagOnly = false
}) => {
	const countries = useAttributeList("country");

	const country = useMemo(() => findBy(countries, "id", code), [countries, code]);
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
};
