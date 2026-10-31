/* eslint-disable react-refresh/only-export-components */
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import { useDisplayLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";

import { Pill } from "./pill";

const countryFlags = import.meta.glob("./*.svg", {
	base: "../../../../node_modules/flag-icons/flags/4x3",
	eager: true,
	import: "default",
	query: "?no-inline"
});

export function getCountryImage(countryId: string): string {
	return countryFlags[`./${countryId}.svg`] as string;
}

const shortFormCountries = new Set(["HK", "MO", "MM", "PS"]);

const _countryNames: Record<string, Record<"long" | "short", Intl.DisplayNames>> = {};

export function getCountryName(locale: string, countryId: string) {
	const code = countryId.toUpperCase();
	_countryNames[locale] ??= {
		long: new Intl.DisplayNames([intlLocale(locale)], { type: "region" }),
		short: new Intl.DisplayNames([intlLocale(locale)], { type: "region", style: "short" })
	};
	return _countryNames[locale][shortFormCountries.has(code) ? "short" : "long"].of(code);
}

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
	const locale = useDisplayLocale();
	const countryName = getCountryName(locale, id) ?? id;

	return (
		<Pill
			small
			className={twMerge(
				"shrink-0 py-0",
				flagOnly && "overflow-hidden p-0",
				className
			)}
			hocusable={false}
		>
			<img
				className={twMerge(
					"aspect-4/3 h-8 w-max shrink-0",
					flagOnly ? "" : "-ml-3 rounded-l-xl"
				)}
				src={getCountryImage(id)}
			/>
			{!flagOnly && <span>{countryName}</span>}
		</Pill>
	);
};
