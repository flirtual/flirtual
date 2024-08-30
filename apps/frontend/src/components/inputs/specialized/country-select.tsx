"use client";

import { type FC, useMemo } from "react";
import { SelectItemText } from "@radix-ui/react-select";
import { useInView } from "react-intersection-observer";
import { useTranslations } from "next-intl";

import { useAttributeList } from "~/hooks/use-attribute-list";
import { useDevice } from "~/hooks/use-device";

import { InputSelect, type InputSelectProps, SelectItem } from "../select";

const CountrySelectItem: FC<{ value: string }> = (props) => {
	const t = useTranslations("inputs.country_select");

	let { country: systemCountry } = useDevice();
	if (!systemCountry) systemCountry = "us";

	const country = useAttributeList("country").find(
		(country) => country.id === props.value
	);

	const [reference, viewed] = useInView({ triggerOnce: true });
	if (!country) return null;

	return (
		<SelectItem
			className="flex items-center gap-3 truncate hocus:outline-none"
			ref={reference}
			value={country.id}
		>
			<div className="aspect-[4/3] h-fit w-7 shrink-0 overflow-hidden rounded-md bg-black-70">
				{viewed && <img className="size-full" src={country.metadata.flagUrl} />}
			</div>
			<SelectItemText>
				{country.id === systemCountry
					? t("system_highlight", { country: country.name })
					: country.name}
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
	const countries = useAttributeList("country");

	let { country: systemCountry } = useDevice();
	if (!systemCountry) systemCountry = "us";

	return (
		<InputSelect
			{...props}
			optional
			placeholder={t("placeholder")}
			Item={CountrySelectItem}
			options={useMemo(
				() =>
					countries.sort((a, b) => {
						if (a.id === systemCountry) return -1;
						if (b.id === systemCountry) return 1;
						return a.name.localeCompare(b.name);
					}),
				[countries]
			)}
		/>
	);
}
