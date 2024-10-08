/* eslint-disable @next/next/no-img-element */
"use client";

import { createContext, type FC, use, useMemo } from "react";
import { SelectItemText } from "@radix-ui/react-select";
import { useInView } from "react-intersection-observer";
import { useLocale, useTranslations } from "next-intl";

import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useInternationalization } from "~/hooks/use-internationalization";

import { InputSelect, type InputSelectProps, SelectItem } from "../select";

const Context = createContext(
	{} as {
		countryNames: Intl.DisplayNames;
	}
);

const useCountryName = (countryId: string) => {
	const tAttribute = useAttributeTranslation();
	const { countryNames } = use(Context);

	return tAttribute[countryId]?.name ?? countryNames.of(countryId) ?? countryId;
};

const CountrySelectItem: FC<{ value: string }> = ({ value: countryId }) => {
	const t = useTranslations("inputs.country_select");

	let { country: systemCountry = "us" } = useInternationalization();
	if (!systemCountry) systemCountry = "us";

	const [reference, viewed] = useInView({ triggerOnce: true });

	if (!countryId) return null;
	const countryName = useCountryName(countryId);

	return (
		<SelectItem
			className="flex items-center gap-3 truncate hocus:outline-none"
			ref={reference}
			value={countryId}
		>
			<div className="aspect-[4/3] h-fit w-7 shrink-0 overflow-hidden rounded-md bg-black-70">
				{viewed && (
					<img
						className="size-full"
						src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/flags/4x3/${countryId}.svg`}
					/>
				)}
			</div>
			<SelectItemText suppressHydrationWarning>
				{countryId === systemCountry
					? t("system_highlight", { country: countryName })
					: countryName}
			</SelectItemText>
		</SelectItem>
	);
};

export type InputCountrySelectProps = Omit<
	InputSelectProps<string | null>,
	"options" | "Item"
>;

export function InputCountrySelect(props: InputCountrySelectProps) {
	const t = useTranslations("inputs.country_select");
	const countries = useAttributes("country");
	const tAttribute = useAttributeTranslation();

	let { country: systemCountry } = useInternationalization();
	if (!systemCountry) systemCountry = "us";

	const locale = useLocale();
	const countryNames = useMemo(
		() => new Intl.DisplayNames(locale, { type: "region" }),
		[locale]
	);

	return (
		<Context.Provider value={{ countryNames }}>
			<InputSelect
				{...props}
				optional
				Item={CountrySelectItem}
				placeholder={t("placeholder")}
				options={useMemo(
					() =>
						countries
							.map((countryId) => {
								return {
									id: countryId,
									name:
										tAttribute[countryId]?.name ??
										countryNames.of(countryId) ??
										countryId
								};
							})
							.sort((a, b) => {
								if (a.id === systemCountry) return -1;
								if (b.id === systemCountry) return 1;

								return a.name.localeCompare(b.name, locale);
							}),
					[countries]
				)}
			/>
		</Context.Provider>
	);
}
