"use client";

import { type FC, useMemo } from "react";
import { SelectItemText } from "@radix-ui/react-select";
import { useInView } from "react-intersection-observer";

import { useAttributeList } from "~/hooks/use-attribute-list";

import { InputSelect, type InputSelectProps, SelectItem } from "../select";

const CountrySelectItem: FC<{ value: string }> = (props) => {
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
			<SelectItemText>{country.name}</SelectItemText>
		</SelectItem>
	);
};

export type InputCountrySelectProps = Omit<
	InputSelectProps<string | null>,
	"options" | "Item"
>;

export function InputCountrySelect(props: InputCountrySelectProps) {
	const countries = useAttributeList("country");

	return (
		<InputSelect
			{...props}
			optional
			Item={CountrySelectItem}
			options={useMemo(
				() =>
					countries.sort((a, b) => {
						if (a.id === "us") return -1;
						if (a.name > b.name) return 1;
						return 0;
					}),
				[countries]
			)}
		/>
	);
}
