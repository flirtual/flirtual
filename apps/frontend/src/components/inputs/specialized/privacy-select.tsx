import {
	PrivacyPreferenceOption,
	PrivacyPreferenceOptions
} from "~/api/user/preferences";
import { InputSelect, InputSelectProps } from "~/components/inputs";

export const InputPrivacySelect: React.FC<
	Omit<InputSelectProps<PrivacyPreferenceOption>, "options">
> = (props) => (
	<InputSelect
		{...props}
		options={PrivacyPreferenceOptions.map((option) => ({
			id: option,
			name: {
				everyone: "Anyone on Flirtual",
				matches: "Matches only",
				me: "Just me"
			}[option]
		}))}
	/>
);
