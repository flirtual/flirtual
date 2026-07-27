import { decodeJwt } from "jose";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Authentication } from "~/api/auth";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputText } from "~/components/inputs";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

export const ConfirmPasswordResetForm: React.FC<{ token: string }> = ({ token }) => {
	const { t } = useTranslation();

	const [success, setSuccess] = useState(false);

	let email: string | undefined;
	try {
		email = decodeJwt(token).sub;
	}
	catch {
		email = undefined;
	}

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
			{({ FormField, fields }) =>
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
								{fields.token.errors.length > 0 && (
									<div className="flex gap-2 font-nunito text-lg text-red-600 dark:text-red-400">
										<AlertCircle className="mt-0.5 size-6 shrink-0" />
										<span>
											<Trans
												components={{ forgot: <InlineLink className="underline" highlight={false} href={urls.forgotPassword} /> }}
												i18nKey="errors.reset_password_link_invalid"
											/>
										</span>
									</div>
								)}
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
