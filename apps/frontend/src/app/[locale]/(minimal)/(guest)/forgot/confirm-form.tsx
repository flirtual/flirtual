import { decodeJwt } from "jose";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Authentication } from "~/api/auth";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

export const ConfirmPasswordResetForm: React.FC<{ token: string }> = ({ token }) => {
	const { t } = useTranslation();

	const [success, setSuccess] = useState(false);

	const payload = decodeJwt(token);
	const email = payload?.sub;

	if (!email) return throwRedirect(urls.forgotPassword);

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
