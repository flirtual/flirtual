"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputCheckbox, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";

export const LoginForm: React.FC = () => {
	const router = useRouter();
	const { data: user, mutate } = useCurrentUser();

	useEffect(() => {
		if (user) void router.push(`/${user.id}`);
	}, [router, user]);

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
								<InputLabel {...labelProps} hint="(or email)">
									Username
								</InputLabel>
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
						<button className="rounded-xl bg-brand-gradient p-4 shadow-brand-1" type="submit">
							<span className="font-montserrat text-xl font-extrabold text-white-10">Login</span>
						</button>
						<FormInputMessages messages={errors} />
						<div className="flex flex-col font-nunito text-lg">
							<FormAlternativeActionLink href="/register">
								Don&apos;t have an account yet? Sign up!
							</FormAlternativeActionLink>
							<FormAlternativeActionLink href="/forgot">
								Forgot your password?
							</FormAlternativeActionLink>
						</div>
					</div>
				</>
			)}
		</Form>
	);
};
