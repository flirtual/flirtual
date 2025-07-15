/* eslint-disable @next/next/no-img-element, react-refresh/only-export-components  */

import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useLocale } from "~/i18n";

import { Pill } from "./pill";

export function getCountryImage(countryId: string) {
	return `https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/flags/4x3/${countryId}.svg`;
}

const _countryNames: Record<string, Intl.DisplayNames> = {};

export function getCountryName(locale: string, countryId: string) {
	_countryNames[locale] ??= new Intl.DisplayNames([locale], { type: "region" });
	return _countryNames[locale].of(countryId.toUpperCase());
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
	const tAttribute = useAttributeTranslation();
	const locale = useLocale();
	const countryName = tAttribute[id.toUpperCase()]?.name ?? getCountryName(locale, id) ?? id;

	return (
		<Pill
			small
			className={twMerge(
				"shrink-0",
				flagOnly && "overflow-hidden p-0",
				className
			)}
			hocusable={false}
		>
			<img
				className={twMerge(
					"aspect-[4/3] h-8 w-max shrink-0",
					flagOnly ? "" : "-ml-3 rounded-l-xl"
				)}
				src={getCountryImage(id)}
			/>
			{!flagOnly && <span>{countryName}</span>}
		</Pill>
	);
};
