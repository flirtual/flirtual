"use client";

import { useMemo } from "react";

import { useAttributeList } from "~/hooks/use-attribute-list";

import { InputSelect, InputSelectOption, InputSelectProps } from "../select";

export const InputCountrySelect: React.FC<Omit<InputSelectProps, "options">> = (props) => {
	const countries = useAttributeList("country");

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
