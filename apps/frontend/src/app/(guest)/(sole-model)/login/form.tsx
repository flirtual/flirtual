"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { api } from "~/api";
import { Form, FormButton } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputLabel, InputText } from "~/components/inputs";
import { urls } from "~/urls";
import { useDevice } from "~/hooks/use-device";

import { LoginConnectionButton } from "./login-connection-button";

export const LoginForm: React.FC<{ next?: string }> = ({ next }) => {
	const router = useRouter();
	const { native, platform, userAgent } = useDevice();

	return (
		<>
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
			{!native && (
				<div className="flex flex-col gap-2">
					<div className="inline-flex items-center justify-center">
						<hr className="my-8 h-px w-full border-0 bg-white-40 dark:bg-black-40" />
						<span className="absolute left-1/2 -translate-x-1/2 bg-white-20 px-3 font-montserrat font-semibold uppercase text-black-50 dark:bg-black-70 dark:text-white-50">
							or
						</span>
					</div>
					{/* {platform === "ios" || userAgent.os.name === "Mac OS" ? (
					<>
						<LoginConnectionButton type="apple" />
						<LoginConnectionButton type="google" />
					</>
				) : (
					<>
						<LoginConnectionButton type="google" />
						<LoginConnectionButton type="apple" />
					</>
				)}
				<LoginConnectionButton type="meta" /> */}
					<LoginConnectionButton type="discord" />
					{/* <LoginConnectionButton type="vrchat" /> */}
				</div>
			)}
		</>
	);
};
