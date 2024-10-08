"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";

import {
	InputAutocomplete,
	type InputAutocompleteOption,
	type InputAutocompleteProps
} from "../autocomplete";

export const InputLanguageAutocomplete: React.FC<
	Omit<InputAutocompleteProps, "options">
> = (props) => {
	const t = useTranslations("inputs.language_autocomplete");
	const tAttribute = useAttributeTranslation();

	const languages = useAttributes("language");
	const systemLanguage = useLocale();

	const languageNames = useMemo(
		() => new Intl.DisplayNames(systemLanguage, { type: "language" }),
		[systemLanguage]
	);

	const options = useMemo<Array<InputAutocompleteOption>>(
		() =>
			languages
				.map((languageId) => {
					const label =
						tAttribute[languageId]?.name ??
						languageNames.of(languageId) ??
						languageId;

					return {
						key: languageId,
						label:
							languageId === systemLanguage
								? t("system_highlight", {
										language: label
									})
								: label
					};
				})
				.sort((a, b) => {
					if (a.key === systemLanguage) return -1;
					if (b.key === systemLanguage) return 1;
					return a.label.localeCompare(b.label, systemLanguage);
				}),
		[languages, systemLanguage, languageNames]
	);

	return (
		<InputAutocomplete
			placeholder={t("placeholder")}
			{...props}
			options={options}
		/>
	);
};
