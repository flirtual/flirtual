"use client";

import { useMemo } from "react";

import { useAttributeList } from "~/hooks/use-attribute-list";

import {
	InputAutocomplete,
	InputAutocompleteOption,
	InputAutocompleteProps
} from "../autocomplete";

export const InputLanguageAutocomplete: React.FC<Omit<InputAutocompleteProps, "options">> = (
	props
) => {
	const languages = useAttributeList("language");
	const options = useMemo<Array<InputAutocompleteOption>>(
		() =>
			languages
				.map(({ id, name }) => ({
					key: id,
					label: name
				}))
				.sort((a, b) => {
					if (a.label > b.label) return 1;
					return -1;
				}),
		[languages]
	);

	return <InputAutocomplete placeholder="Select languages..." {...props} options={options} />;
};
