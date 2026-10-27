import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";

import {
	InputAutocomplete

} from "../autocomplete";
import type { InputAutocompleteOption, InputAutocompleteProps } from "../autocomplete";

export const InputLanguageAutocomplete: React.FC<
	Omit<InputAutocompleteProps, "options">
> = (props) => {
	const { t } = useTranslation();
	const tAttribute = useAttributeTranslation();

	const languages = useAttributes("language");
	const [systemLanguage] = useLocale();
	const pinnedLanguage = systemLanguage.split("-")[0];

	const languageNames = useMemo(
		() => new Intl.DisplayNames(intlLocale(systemLanguage), { type: "language" }),
		[systemLanguage]
	);

	const options = useMemo<Array<InputAutocompleteOption>>(
		() =>
			languages
				.map((languageId) => {
					const label
						= tAttribute[languageId]?.name
							?? languageNames.of(languageId)
							?? languageId;

					return {
						key: languageId,
						label
					};
				})
				.sort((a, b) => {
					if (a.key === pinnedLanguage) return -1;
					if (b.key === pinnedLanguage) return 1;
					return a.label.localeCompare(b.label, intlLocale(systemLanguage));
				}),
		[languages, tAttribute, languageNames, pinnedLanguage, systemLanguage]
	);

	return (
		<InputAutocomplete
			placeholder={t("select_a_language")}
			{...props}
			options={options}
		/>
	);
};
