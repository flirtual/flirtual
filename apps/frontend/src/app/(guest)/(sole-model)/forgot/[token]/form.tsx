"use client";

import { useState } from "react";

import { api } from "~/api";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { urls } from "~/urls";

export interface ResetPasswordFormProps {
	token: string;
	email: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token, email }) => {
	const [success, setSuccess] = useState(false);

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				token,
				email,
				password: "",
				passwordConfirmation: ""
			}}
			onSubmit={async (body) => {
				await api.auth.confirmResetPassword({ body });
				setSuccess(true);
			}}
		>
			{({ FormField }) =>
				success ? (
					<>
						<p>Your password has been reset. You can now login with your new password.</p>
						<div className="flex gap-4">
							<ButtonLink className="w-fit" href={urls.login()} size="sm">
								Login
							</ButtonLink>
						</div>
					</>
				) : (
					<>
						<FormField name="email">
							{(field) => (
								<>
									<InputLabel>Email</InputLabel>
									<InputText {...field.props} disabled autoComplete="off" type="email" />
								</>
							)}
						</FormField>
						<FormField name="password">
							{(field) => (
								<>
									<InputLabel>New password</InputLabel>
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
									<InputLabel>Confirm new password</InputLabel>
									<InputText
										{...field.props}
										autoFocus
										autoComplete="new-password"
										type="password"
									/>
								</>
							)}
						</FormField>
						<FormButton>Submit</FormButton>
					</>
				)
			}
		</Form>
	);
};
