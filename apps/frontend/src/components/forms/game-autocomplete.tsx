import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { InputAutocomplete } from "~/components/inputs";
import { useGameOptions } from "~/hooks/use-game-stores";
import type { FormFieldsDefault } from "~/hooks/use-input-form";
import { useFormContext } from "~/hooks/use-input-form";

interface GameFields extends FormFieldsDefault {
	game: Array<string>;
	platform: Array<string>;
}

export const FormGameAutocomplete: FC = () => {
	const { t } = useTranslation();

	const { fields } = useFormContext<GameFields>();
	const options = useGameOptions(fields.platform.props.value);

	return (
		<InputAutocomplete
			{...fields.game.props}
			limit={5}
			options={options}
			placeholder={t("select_games")}
			value={fields.game.props.value || []}
		/>
	);
};
