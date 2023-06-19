"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { api } from "~/api";
import { Form, FormButton } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputLabel, InputText } from "~/components/inputs";
import { urls } from "~/urls";

export const LoginForm: React.FC<{ next?: string }> = ({ next }) => {
	const router = useRouter();

	return (
		<Form
			className="flex flex-col gap-8"
			formErrorMessages={false}
			fields={{
				login: "",
				password: "",
				rememberMe: false
			}}
			onSubmit={async (body) => {
				await api.auth.login({ body });

				router.refresh();
				router.push(next ?? urls.browse());
			}}
		>
			{({ errors, FormField }) => (
				<>
					<FormField name="login">
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>Username (or email)</InputLabel>
								<InputText {...props} autoComplete="username" type="text" />
							</>
						)}
					</FormField>
					<FormField name="password">
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>Password</InputLabel>
								<InputText
									{...props}
									autoComplete="current-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<div className="flex flex-col gap-4">
						<FormButton>Log in</FormButton>
						<FormInputMessages
							messages={errors.map((value) => ({ type: "error", value }))}
						/>
						<div className="flex flex-col font-nunito text-lg">
							<FormAlternativeActionLink href={urls.register}>
								Don&apos;t have an account yet? Sign up!
							</FormAlternativeActionLink>
							<FormAlternativeActionLink href={urls.forgotPassword}>
								Forgot your password?
							</FormAlternativeActionLink>
						</div>
					</div>
				</>
			)}
		</Form>
	);
};
