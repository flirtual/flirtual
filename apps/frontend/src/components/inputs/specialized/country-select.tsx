/* eslint-disable @next/next/no-img-element */
"use client";

import { type FC, useMemo } from "react";
import { SelectItemText } from "@radix-ui/react-select";
import { useInView } from "react-intersection-observer";
import { useLocale, useTranslations } from "next-intl";

import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useInternationalization } from "~/hooks/use-internationalization";
import {
	getCountryImage,
	getCountryName
} from "~/components/profile/pill/country";

import { InputSelect, type InputSelectProps, SelectItem } from "../select";

const CountrySelectItem: FC<{ value: string }> = ({ value: countryId }) => {
	const t = useTranslations("inputs.country_select");
	const tAttribute = useAttributeTranslation();
	const locale = useLocale();

	let { country: systemCountry = "us" } = useInternationalization();
	if (!systemCountry) systemCountry = "us";

	const [reference, viewed] = useInView({ triggerOnce: true });

	const countryName =
		tAttribute[countryId]?.name ??
		getCountryName(locale, countryId) ??
		countryId;

	if (!countryId) return null;

	return (
		<SelectItem
			className="flex items-center gap-3 truncate hocus:outline-none"
			ref={reference}
			value={countryId}
		>
			<div className="aspect-[4/3] h-fit w-7 shrink-0 overflow-hidden rounded-md bg-black-70">
				{viewed && (
					<img className="size-full" src={getCountryImage(countryId)} />
				)}
			</div>
			<SelectItemText className="[content-visibility:auto]">
				{countryName}
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

	return (
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
									getCountryName(locale, countryId) ??
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
	);
}
