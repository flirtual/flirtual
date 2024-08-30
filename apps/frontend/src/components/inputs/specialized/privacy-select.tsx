import { useTranslations } from "next-intl";

import {
	type PrivacyPreferenceOption,
	PrivacyPreferenceOptions
} from "~/api/user/preferences";
import { InputSelect, type InputSelectProps } from "~/components/inputs";

export const InputPrivacySelect: React.FC<
	Omit<InputSelectProps<PrivacyPreferenceOption>, "options">
> = (props) => {
	const t = useTranslations("inputs.privacy_select");

	return (
		<InputSelect
			{...props}
			options={PrivacyPreferenceOptions.map((option) => ({
				id: option,
				name: t(option)
			}))}
		/>
	);
};
