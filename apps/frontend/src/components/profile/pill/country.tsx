/* eslint-disable @next/next/no-img-element */

import { twMerge } from "tailwind-merge";
import { useLocale } from "next-intl";

import { Pill } from "./pill";

import type { FC } from "react";

export function getCountryImage(countryId: string) {
	return `https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/flags/4x3/${countryId}.svg`;
}

const _countryNames: Record<string, Intl.DisplayNames> = {};

export function getCountryName(locale: string, countryId: string) {
	_countryNames[locale] ??= new Intl.DisplayNames([locale], { type: "region" });
	return _countryNames[locale].of(countryId);
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
	const locale = useLocale();
	const countryName = getCountryName(locale, id) ?? id;

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
				src={getCountryImage(id)}
				className={twMerge(
					"aspect-[4/3] h-8 w-max shrink-0",
					flagOnly ? "" : "-ml-4 rounded-l-xl"
				)}
			/>
			{!flagOnly && <span>{countryName}</span>}
		</Pill>
	);
};
