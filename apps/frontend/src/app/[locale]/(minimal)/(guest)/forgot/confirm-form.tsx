import { decode } from "jsonwebtoken";
import { useLocale } from "~/i18n";
import { useState } from "react";

import { Authentication } from "~/api/auth";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { redirect } from "~/i18n/navigation";
import { urls } from "~/urls";

export const ConfirmPasswordResetForm: React.FC<{ token: string }> = ({ token }) => {
	const [success, setSuccess] = useState(false);

	const [locale] = useLocale();
	const { t } = useTranslation();

	const payload = decode(token, { json: true });

	const email = payload?.sub;
	if (!email) return redirect({ href: urls.forgotPassword, locale });

	return (
		<Form
			fields={{
				token,
				email,
				password: "",
				passwordConfirmation: ""
			}}
			className="flex flex-col gap-8"
			onSubmit={async (body) => {
				await Authentication.confirmResetPassword(body);
				setSuccess(true);
			}}
		>
			{({ FormField }) =>
				success
					? (
							<>
								<p>
									{t("formal_dark_camel_hunt")}
								</p>
								<div className="flex gap-4">
									<ButtonLink className="w-fit" href={urls.login()} size="sm">
										{t("login")}
									</ButtonLink>
								</div>
							</>
						)
					: (
							<>
								<FormField name="email">
									{(field) => (
										<>
											<InputLabel>{t("email")}</InputLabel>
											<InputText
												{...field.props}
												disabled
												autoComplete="off"
												type="email"
											/>
										</>
									)}
								</FormField>
								<FormField name="password">
									{(field) => (
										<>
											<InputLabel>{t("new_password")}</InputLabel>
											<InputText
												{...field.props}
												autoFocus
												autoComplete="new-password"
												type="password"
											/>
										</>
									)}
								</FormField>
								<FormField name="passwordConfirmation">
									{(field) => (
										<>
											<InputLabel>{t("confirm_new_password")}</InputLabel>
											<InputText
												{...field.props}
												autoFocus
												autoComplete="new-password"
												type="password"
											/>
										</>
									)}
								</FormField>
								<FormButton />
							</>
						)}
		</Form>
	);
};
