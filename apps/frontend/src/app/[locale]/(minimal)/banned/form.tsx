import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Appeal } from "~/api/appeal";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabelHint, InputTextArea } from "~/components/inputs";
import { invalidate, sessionKey } from "~/query";

export const AppealForm: React.FC<{ appealed: boolean }> = ({ appealed }) => {
	const { t } = useTranslation();
	const [sent, setSent] = useState(false);

	if (appealed || sent) return <p>{t("banned_appeal_sent")}</p>;

	return (
		<details>
			<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
				{t("banned_appeal_label")}
			</summary>
			<Form
				className="mt-4 flex flex-col gap-4"
				fields={{ message: "" }}
				requireChange={["message"]}
				onSubmit={async ({ message }) => {
					await Appeal.create(message);

					setSent(true);
					await invalidate({ queryKey: sessionKey() });
				}}
			>
				{({ FormField }) => (
					<>
						<FormField name="message">
							{(field) => (
								<>
									<InputLabelHint>{t("banned_appeal_hint")}</InputLabelHint>
									<InputTextArea {...field.props} rows={6} />
								</>
							)}
						</FormField>
						<FormButton className="min-w-44" size="sm">
							{t("banned_appeal_submit")}
						</FormButton>
					</>
				)}
			</Form>
		</details>
	);
};
