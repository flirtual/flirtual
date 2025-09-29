/* eslint-disable react-refresh/only-export-components */
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useLocale } from "~/i18n";

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
	const [locale] = useLocale();
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
