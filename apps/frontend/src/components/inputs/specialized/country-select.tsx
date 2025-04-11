/* eslint-disable @next/next/no-img-element */
"use client";

import { SelectItemText } from "@radix-ui/react-select";
import { useLocale, useTranslations } from "next-intl";
import { type FC, useMemo } from "react";
import { useInView } from "react-intersection-observer";

import {
	getCountryImage,
	getCountryName
} from "~/components/profile/pill/country";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";

import { InputSelect, type InputSelectProps, SelectItem } from "../select";

const CountrySelectItem: FC<{ value: string }> = ({ value: countryId }) => {
	const tAttribute = useAttributeTranslation();
	const locale = useLocale();

	const [reference, viewed] = useInView({ triggerOnce: true });

	const countryName
		= tAttribute[countryId.toUpperCase()]?.name
			?? getCountryName(locale, countryId)
			?? countryId;

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

export type InputCountrySelectProps = {
	prefer?: string;
} & Omit<
	InputSelectProps<string | null>,
	"Item" | "options"
>;

export function InputCountrySelect({ prefer = "us", ...props }: InputCountrySelectProps) {
	const locale = useLocale();

	const t = useTranslations();
	const tAttribute = useAttributeTranslation();

	const countries = useAttributes("country");

	const options = useMemo(
		() =>
			countries
				.map((countryId) => {
					return {
						id: countryId,
						name:
							tAttribute[countryId.toUpperCase()]?.name
							?? getCountryName(locale, countryId)
							?? countryId
					};
				})
				.sort((a, b) => {
					if (a.id === prefer) return -1;
					if (b.id === prefer) return 1;

					return a.name.localeCompare(b.name, locale);
				}),
		[countries, locale, prefer, tAttribute]
	);

	return (
		<InputSelect
			{...props}
			optional
			Item={CountrySelectItem}
			options={options}
			placeholder={t("select_a_country")}
		/>
	);
}
