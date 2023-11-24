/* eslint-disable unicorn/prefer-code-point */
"use client";

import { useRouter } from "next/navigation";
import { FC, useEffect, useRef } from "react";

import { api } from "~/api";
import { Form, FormButton } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputLabel, InputText } from "~/components/inputs";
import { urls } from "~/urls";
import { useToast } from "~/hooks/use-toast";
// import { useDevice } from "~/hooks/use-device";

import { LoginConnectionButton } from "./login-connection-button";

export const LoginForm: FC<{ next?: string }> = ({ next }) => {
	// const { platform } = useDevice();
	const router = useRouter();
	const toasts = useToast();
	const challengeGenerated = useRef(false);

	useEffect(() => {
		async function webAuthnAuthenticate() {
			if (
				!challengeGenerated.current &&
				window.PublicKeyCredential &&
				PublicKeyCredential.isConditionalMediationAvailable
			) {
				challengeGenerated.current = true;

				const isCMA =
					await PublicKeyCredential.isConditionalMediationAvailable();
				if (isCMA) {
					const challenge = await api.auth.passkeyAuthenticationChallenge();

					const credential = (await navigator.credentials.get({
						publicKey: challenge.publicKey,
						mediation: "conditional"
					})) as PublicKeyCredential;
					if (!credential) return;

					const response =
						credential.response as AuthenticatorAssertionResponse;

					await api.auth
						.authenticatePasskey({
							body: {
								credentialId: credential.id,
								rawId: btoa(
									String.fromCharCode(...new Uint8Array(credential.rawId))
								),
								response: {
									authenticatorData: btoa(
										String.fromCharCode(
											...new Uint8Array(response.authenticatorData)
										)
									),
									clientDataJSON: btoa(
										String.fromCharCode(
											...new Uint8Array(response.clientDataJSON)
										)
									),
									signature: btoa(
										String.fromCharCode(...new Uint8Array(response.signature))
									)
								}
							}
						})
						.then(() => {
							router.refresh();
							return router.push(next ?? urls.browse());
						})
						.catch((reason) => {
							toasts.addError(reason);
							challengeGenerated.current = false;
						});
				}
			}
		}
		void webAuthnAuthenticate();
	}, [router, toasts, next]);

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
									<InputText
										{...props}
										autoCapitalize="off"
										autoComplete="username webauthn"
										autoCorrect="off"
										spellCheck="false"
										type="text"
									/>
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
									Don&apos;t have an account yet? Sign&nbsp;up!
								</FormAlternativeActionLink>
								<FormAlternativeActionLink href={urls.forgotPassword}>
									Forgot your password?
								</FormAlternativeActionLink>
							</div>
						</div>
					</>
				)}
			</Form>
			<div className="flex flex-col gap-2">
				<div className="inline-flex items-center justify-center">
					<hr className="my-8 h-px w-full border-0 bg-white-40 dark:bg-black-40" />
					<span className="absolute left-1/2 -translate-x-1/2 bg-white-20 px-3 font-montserrat font-semibold uppercase text-black-50 dark:bg-black-70 dark:text-white-50">
						or
					</span>
				</div>
				{/* {platform === "apple" ? (
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
		</>
	);
};
