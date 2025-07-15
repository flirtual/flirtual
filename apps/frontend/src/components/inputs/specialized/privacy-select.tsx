import { useTranslation } from "react-i18next";

import {
	type PrivacyPreferenceOption,
	PrivacyPreferenceOptions
} from "~/api/user/preferences";
import { InputSelect, type InputSelectProps } from "~/components/inputs";

export const InputPrivacySelect: React.FC<
	Omit<InputSelectProps<PrivacyPreferenceOption>, "options">
> = (props) => {
	const { t } = useTranslation();

	return (
		<InputSelect
			{...props}
			options={PrivacyPreferenceOptions.map((option) => ({
				id: option,
				name: t(({
					everyone: "anyone_on_flirtual",
					matches: "matches_only",
					me: "just_me"
				} as const)[option])
			}))}
		/>
	);
};
