import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { ButtonLink } from "~/components/button";
import { urls } from "~/urls";

import { SqueakyFlitty } from "./squeaky-flitty";

export const SignUpButton: FC<{ tabIndex?: number }> = ({ tabIndex }) => {
	const { t } = useTranslation ();

	return (
		<SqueakyFlitty>
			<ButtonLink className="isolate" href={urls.register} kind="primary" size="sm" tabIndex={tabIndex}>
				{t("sign_up")}
			</ButtonLink>
		</SqueakyFlitty>
	);
};
