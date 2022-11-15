"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { api } from "~/api";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormField } from "~/components/forms/field";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputCheckbox, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useInputForm } from "~/hooks/use-input-form";

export const LoginForm: React.FC = () => {
	const router = useRouter();
	const { data: user, mutate } = useCurrentUser();

	useEffect(() => {
		if (user) void router.push(`/${user.username}`);
	}, [router, user]);

	const { fields, formErrors, formProps } = useInputForm({
		fields: {
			email: "",
			password: "",
			rememberMe: false
		},
		onSubmit: async (values) => {
			const session = await api.auth.login(values);
			console.log(session);
			await mutate();
		}
	});

	return (
		<form {...formProps} className="flex flex-col gap-8">
			<FormField field={fields.email}>
				{({ props, labelProps }) => (
					<>
						<InputLabel {...labelProps} hint="(or email)">
							Username
						</InputLabel>
						<InputText {...props} type="email" />
					</>
				)}
			</FormField>
			<FormField field={fields.password}>
				{({ props, labelProps }) => (
					<>
						<InputLabel {...labelProps}>Password</InputLabel>
						<InputText {...props} type="password" />
					</>
				)}
			</FormField>
			<FormField field={fields.rememberMe}>
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
				<button className="bg-brand-gradient shadow-brand-1 p-4 rounded-xl" type="submit">
					<span className="font-montserrat font-extrabold text-white text-xl">Login</span>
				</button>
				<FormInputMessages messages={formErrors} />
				<div className="font-nunito flex flex-col text-lg">
					<FormAlternativeActionLink href="/register">
						Don&apos;t have an account yet? Sign up!
					</FormAlternativeActionLink>
					<FormAlternativeActionLink href="/forgot">
						Forgot your password?
					</FormAlternativeActionLink>
				</div>
			</div>
		</form>
	);
};
