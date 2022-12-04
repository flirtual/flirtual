import { PrivacyPreferenceOption, PrivacyPreferenceOptions } from "~/api/user/preferences";
import { InputSelect, InputSelectProps } from "~/components/inputs";
import { privacyOptionLabel } from "~/const";

export const FormPrivacySelect: React.FC<
	Omit<InputSelectProps<PrivacyPreferenceOption>, "options">
> = (props) => (
	<InputSelect
		{...props}
		options={PrivacyPreferenceOptions.map((option) => ({
			key: option,
			label: privacyOptionLabel[option]
		}))}
	/>
);
