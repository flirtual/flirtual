"use client";

import { useState } from "react";

import { api } from "~/api";
import { Button, ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useFreshworks } from "~/hooks/use-freshworks";
import { urls } from "~/urls";

export const ForgotPasswordForm: React.FC = () => {
	const [success, setSuccess] = useState(false);
	const { openFreshworks } = useFreshworks();

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={["email"]}
			fields={{
				email: ""
			}}
			onSubmit={async (body) => {
				await api.auth.resetPassword({ body });
				setSuccess(true);
			}}
		>
			{({ FormField, fields }) =>
				success ? (
					<>
						<p>
							If you have an account, we&apos;ll send an email to{" "}
							<span className="font-semibold">{fields.email.props.value}</span>{" "}
							with a link to reset your password.
							<br />
							<br />
							If you don&apos;t see it, check your spam/junk/trash folders, and
							if you still don&apos;t see it, contact us.
						</p>
						<div className="flex gap-4">
							<ButtonLink className="w-fit" href={urls.login()} size="sm">
								Login
							</ButtonLink>

							<Button className="w-fit" size="sm" onClick={openFreshworks}>
								Support
							</Button>
						</div>
					</>
				) : (
					<>
						<p>
							Please enter your email and we&apos;ll send along a link to reset
							your password.
						</p>
						<FormField name="email">
							{(field) => (
								<>
									<InputLabel>Account email</InputLabel>
									<InputText
										{...field.props}
										autoComplete="email"
										type="email"
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
