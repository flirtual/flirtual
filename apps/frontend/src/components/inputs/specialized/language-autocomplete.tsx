import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { languagesOptions } from "~/api/data";
import { useLocale } from "~/i18n";

import {
	InputAutocomplete

} from "../autocomplete";
import type { InputAutocompleteOption, InputAutocompleteProps } from "../autocomplete";

export const InputLanguageAutocomplete: React.FC<
	Omit<InputAutocompleteProps, "options">
> = (props) => {
	const { t } = useTranslation();
	const [systemLanguage] = useLocale();
	const { data: languages } = useSuspenseQuery(languagesOptions({ locale: systemLanguage, order: ["name"] }));
	const pinnedLanguage = systemLanguage.split("-")[0];

	const options = useMemo<Array<InputAutocompleteOption>>(
		() =>
			languages
				.map(({ id, name }) => ({
					key: id,
					label: name
				}))
				.toSorted((a, b) => Number(b.key === pinnedLanguage) - Number(a.key === pinnedLanguage)),
		[languages, pinnedLanguage]
	);

	return (
		<InputAutocomplete
			placeholder={t("select_a_language")}
			{...props}
			options={options}
		/>
	);
};
