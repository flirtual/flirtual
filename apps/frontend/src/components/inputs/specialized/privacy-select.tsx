import { useTranslation } from "react-i18next";

import {

	PrivacyPreferenceOptions
} from "~/api/user/preferences";
import type { PrivacyPreferenceOption } from "~/api/user/preferences";
import { InputSelect } from "~/components/inputs";
import type { InputSelectProps } from "~/components/inputs";

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
