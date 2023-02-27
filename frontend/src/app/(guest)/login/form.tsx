"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { api } from "~/api";
import { Form, FormButton } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputCheckbox, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/urls";

export const LoginForm: React.FC<{ to?: string }> = ({ to }) => {
	const router = useRouter();
	const { data: user, mutate } = useCurrentUser();

	useEffect(() => {
		if (user) void router.push(to ?? urls.user(user.username));
	}, [to, router, user]);

	return (
		<Form
			className="flex flex-col gap-8"
			formErrorMessages={false}
			fields={{
				email: "",
				password: "",
				rememberMe: false
			}}
			onSubmit={async (values) => {
				await api.auth.login(values);
				await mutate();
			}}
		>
			{({ errors, FormField }) => (
				<>
					<FormField name="email">
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>Email address</InputLabel>
								<InputText {...props} type="email" />
							</>
						)}
					</FormField>
					<FormField name="password">
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>Password</InputLabel>
								<InputText {...props} type="password" />
							</>
						)}
					</FormField>
					<FormField name="rememberMe">
						{({ props, labelProps }) => (
							<div className="flex items-center gap-4">
								<InputCheckbox {...props} />
								<InputLabel
									{...labelProps}
									inline
									hint={
										<InputLabelHint className="max-w-[34ch]">
											Keep your account logged in for 30 days, not recommended on public or shared
											devices.
										</InputLabelHint>
									}
								>
									Remember me
								</InputLabel>
							</div>
						)}
					</FormField>
					<div className="flex flex-col gap-4">
						<FormButton>Login</FormButton>
						<FormInputMessages messages={errors} />
						<div className="flex flex-col font-nunito text-lg">
							<FormAlternativeActionLink href={urls.register()}>
								Don&apos;t have an account yet? Sign up!
							</FormAlternativeActionLink>
							<FormAlternativeActionLink href={urls.forgotPassword()}>
								Forgot your password?
							</FormAlternativeActionLink>
						</div>
					</div>
				</>
			)}
		</Form>
	);
};
