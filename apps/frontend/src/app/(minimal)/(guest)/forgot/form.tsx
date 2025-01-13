"use client";

import { MoveRight } from "lucide-react";
import { useState } from "react";

import { Authentication } from "~/api/auth";
import { Button, ButtonLink } from "~/components/button";
import { Form, FormInputMessages } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputText } from "~/components/inputs";
import { SupportButton } from "~/components/layout/support-button";
import { useFreshworks } from "~/hooks/use-freshworks";
import { urls } from "~/urls";

export const ForgotPasswordForm: React.FC = () => {
	const [success, setSuccess] = useState(false);
	const { openFreshworks } = useFreshworks();

	return (
		<Form
			fields={{
				email: ""
			}}
			className="flex flex-col gap-8"
			formErrorMessages={false}
			requireChange={["email"]}
			onSubmit={async ({ email }) => {
				await Authentication.resetPassword(email);
				setSuccess(true);
			}}
		>
			{({ FormField, fields, errors }) =>
				success
					? (
							<>
								<p>
									If you have an account, we&apos;ll send an email to
									{" "}
									<span className="font-semibold">{fields.email.props.value}</span>
									{" "}
									with a link to reset your password.
									<br />
									<br />
									If you don&apos;t see it, check your spam/junk/trash folders, and
									if you still don&apos;t see it,
									{" "}
									<InlineLink href={urls.resources.contactDirect}>contact us</InlineLink>
									.
								</p>
								<div className="flex gap-2">
									<ButtonLink className="min-w-44" href={urls.login()} size="sm">Login</ButtonLink>
									<Button
										className="flex w-fit flex-row gap-2 opacity-75"
										kind="tertiary"
										size="sm"
										onClick={openFreshworks}
									>
										<span>Support</span>
										<MoveRight className="size-5" />
									</Button>
								</div>
							</>
						)
					: (
							<>
								<p>
									Please enter your email and we&apos;ll send along a link to reset
									your password.
								</p>
								<FormField name="email">
									{(field) => (
										<>
											<InputLabel>Email address</InputLabel>
											<InputText
												{...field.props}
												autoComplete="email"
												type="email"
											/>
										</>
									)}
								</FormField>
								<div className="flex flex-col gap-4">
									<div className="flex gap-2 desktop:flex-row-reverse">
										<FormButton className="min-w-44" size="sm" />
										<ButtonLink
											className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
											href={urls.login()}
											kind="tertiary"
											size="sm"
										>
											<span>or log in</span>
											<MoveRight className="size-5 desktop:rotate-180" />
										</ButtonLink>
									</div>
									<FormInputMessages
										messages={errors.map((value) => ({ type: "error", value }))}
									/>
								</div>
								<p className="text-center">
									Need help?
									{" "}
									<SupportButton />
								</p>
							</>
						)}
		</Form>
	);
};
