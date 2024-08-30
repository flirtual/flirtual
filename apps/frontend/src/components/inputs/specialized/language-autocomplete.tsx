"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useAttributeList } from "~/hooks/use-attribute-list";

import {
	InputAutocomplete,
	type InputAutocompleteOption,
	type InputAutocompleteProps
} from "../autocomplete";

export const InputLanguageAutocomplete: React.FC<
	Omit<InputAutocompleteProps, "options">
> = (props) => {
	const t = useTranslations("inputs.language_autocomplete");

	const languages = useAttributeList("language");
	const systemLanguage = useLocale();

	const options = useMemo<Array<InputAutocompleteOption>>(
		() =>
			languages
				.map(({ id, name }) => ({
					key: id,
					label:
						id === systemLanguage
							? t("system_highlight", { language: name })
							: name
				}))
				.sort((a, b) => {
					if (a.key === systemLanguage) return -1;
					if (b.key === systemLanguage) return 1;
					return a.label.localeCompare(b.label);
				}),
		[languages, systemLanguage]
	);

	return (
		<InputAutocomplete
			placeholder={t("placeholder")}
			{...props}
			options={options}
		/>
	);
};
