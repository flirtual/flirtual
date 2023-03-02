"use client";

import { useMemo } from "react";

import { useCountryList } from "~/hooks/use-country-list";

import { Pill } from "./pill";

export const CountryPill: React.FC<{ code: string }> = ({ code }) => {
	const countries = useCountryList();

	const country = useMemo(
		() => countries.find((country) => country.id === code),
		[countries, code]
	);

	if (!country) return null;

	return (
		<Pill>
			<img className="-ml-4 h-8 shrink-0 rounded-l-lg" src={country.metadata.flagUrl} />
			<span>{country.name}</span>
		</Pill>
	);
};
