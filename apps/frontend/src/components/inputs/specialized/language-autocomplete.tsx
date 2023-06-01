"use client";

import { useMemo } from "react";

import { useAttributeList } from "~/hooks/use-attribute-list";
import { useLanguage } from "~/hooks/use-language";

import {
	InputAutocomplete,
	InputAutocompleteOption,
	InputAutocompleteProps
} from "../autocomplete";

export const InputLanguageAutocomplete: React.FC<Omit<InputAutocompleteProps, "options">> = (
	props
) => {
	const languages = useAttributeList("language");
	const systemLanguage = useLanguage();

	const options = useMemo<Array<InputAutocompleteOption>>(
		() =>
			languages
				.map(({ id, name }) => ({
					key: id,
					label: name
				}))
				.sort((a, b) => {
					if (a.key === systemLanguage) return -1;
					if (a.label > b.label) return 1;
					return 0;
				}),
		[languages, systemLanguage]
	);

	return <InputAutocomplete placeholder="Select languages..." {...props} options={options} />;
};
