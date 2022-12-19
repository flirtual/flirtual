"use client";

import { useMemo } from "react";

import { useCountryList } from "~/hooks/use-country-list";

import { InputSelect, InputSelectOption, InputSelectProps } from "../select";

export const InputCountrySelect: React.FC<Omit<InputSelectProps, "options">> = (props) => {
	const countries = useCountryList();

	const options = useMemo<Array<InputSelectOption>>(
		() =>
			countries
				.map(({ id, name }) => ({
					key: id,
					label: name
				}))
				.sort((a, b) => {
					if (a.label > b.label) return 1;
					return -1;
				}),
		[countries]
	);

	return <InputSelect placeholder="Choose country..." {...props} options={options} />;
};
