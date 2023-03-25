"use client";

import { useMemo } from "react";

import { useAttributeList } from "~/hooks/use-attribute-list";
import { findBy } from "~/utilities";

import { Pill } from "./pill";

export const CountryPill: React.FC<{ code: string }> = ({ code }) => {
	const countries = useAttributeList("country");

	const country = useMemo(() => findBy(countries, "id", code), [countries, code]);
	if (!country) return null;

	return (
		<Pill hocusable={false}>
			<img className="-ml-4 h-8 shrink-0 rounded-l-lg" src={country.metadata.flagUrl} />
			<span>{country.name}</span>
		</Pill>
	);
};
