"use client";

import { useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import { twMerge } from "tailwind-merge";

import { useAttributeList } from "~/hooks/use-attribute-list";

import { OptionItemProps } from "../option-window";
import { InputSelect, InputSelectProps } from "../select";

export type InputCountrySelectProps = Omit<
	InputSelectProps<string | null>,
	"options" | "optionWindowProps"
>;

const CountryOptionItem: React.FC<OptionItemProps<string | null>> = ({ option, elementProps }) => {
	const elementRef = useRef<HTMLButtonElement>(null);

	const countries = useAttributeList("country");
	const country = useMemo(
		() => countries.find((country) => country.id === option.key),
		[countries, option.key]
	);

	const viewed = useInView(elementRef, { once: true });

	return (
		<button
			ref={elementRef}
			type="button"
			{...elementProps}
			className={twMerge(
				"flex items-center hocus:outline-none",
				option.active
					? "bg-brand-gradient text-white-20"
					: "text-black-70 focus:outline-none hocus:bg-white-40 dark:text-white-20 dark:hocus:bg-black-80/50 dark:hocus:text-white-20"
			)}
		>
			<div className="ml-4 aspect-[4/3] h-fit w-7 shrink-0 overflow-hidden rounded-md bg-black-60">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				{viewed && <img className="h-full w-full" src={country?.metadata.flagUrl} />}
			</div>
			<span className="select-none px-4 py-2 text-left font-nunito text-lg">{option.label}</span>
		</button>
	);
};

export function InputCountrySelect(props: InputCountrySelectProps) {
	const countries = useAttributeList("country");

	return (
		<InputSelect
			optional
			placeholder="Choose country..."
			{...props}
			OptionListItem={CountryOptionItem}
			options={useMemo(
				() =>
					countries
						.map(({ id, name }) => ({
							key: id,
							label: name
						}))
						.sort((a, b) => {
							if (a.key === "us") return -1;
							if (a.label > b.label) return 1;
							return 0;
						}),
				[countries]
			)}
		/>
	);
}
