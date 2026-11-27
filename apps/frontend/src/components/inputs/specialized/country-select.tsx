import { SelectItemText } from "@radix-ui/react-select";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { countriesOptions } from "~/api/data";
import {
	getCountryImage,
	getCountryName
} from "~/components/profile/pill/country";
import { useDisplayLocale, useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";

import { InputSelect, SelectItem } from "../select";
import type { InputSelectProps } from "../select";

const CountrySelectItem: FC<{ value: string }> = ({ value: countryId }) => {
	const locale = useDisplayLocale();

	const [reference, viewed] = useInView({ triggerOnce: true });

	const countryName = getCountryName(locale, countryId) ?? countryId;

	if (!countryId) return null;

	return (
		<SelectItem
			className="flex items-center gap-3 truncate hocus:outline-hidden"
			ref={reference}
			value={countryId}
		>
			<div className="aspect-4/3 h-fit w-7 shrink-0 overflow-hidden rounded-md bg-black-70">
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
	const locale = useDisplayLocale();

	const { t } = useTranslation();

	const [appLocale] = useLocale();
	const { data: countries } = useSuspenseQuery(countriesOptions({ locale: appLocale }));

	const options = useMemo(
		() =>
			countries
				.map(({ id }) => ({
					id,
					name: getCountryName(locale, id) ?? id
				}))
				.sort((a, b) => {
					if (a.id === prefer) return -1;
					if (b.id === prefer) return 1;

					return a.name.localeCompare(b.name, intlLocale(locale));
				}),
		[countries, locale, prefer]
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
