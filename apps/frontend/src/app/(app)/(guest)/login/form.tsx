"use client";

import { useRouter } from "next/navigation";
import { type FC, useEffect, useRef } from "react";

import { Authentication } from "~/api/auth";
import { isWretchError } from "~/api/common";
import { Form, FormButton } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputText } from "~/components/inputs";
import { useTranslations } from "~/hooks/use-internationalization";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import { LoginConnectionButton } from "./login-connection-button";

export const LoginForm: FC<{ next?: string }> = ({ next }) => {
	const router = useRouter();
	const toasts = useToast();
	const challengeGenerated = useRef(false);
	const t = useTranslations();

	useEffect(() => {
		async function webAuthnAuthenticate() {
			if (
				!challengeGenerated.current
				&& window.PublicKeyCredential
				&& PublicKeyCredential.isConditionalMediationAvailable
			) {
				challengeGenerated.current = true;

				const isCMA
					= await PublicKeyCredential.isConditionalMediationAvailable();
				if (isCMA) {
					const challenge
						= await Authentication.passkey.authenticationChallenge();

					const credential = (await navigator.credentials
						.get({
							mediation: "conditional",
							publicKey: challenge.publicKey
						})
						.catch(() => null)) as PublicKeyCredential | null;
					if (!credential) return;

					const response
						= credential.response as AuthenticatorAssertionResponse;

					await Authentication.passkey
						.authenticate({
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
						})
						.then(() => {
							router.push(next ?? urls.browse());
							return router.refresh();
						})
						.catch((reason) => {
							if (isWretchError(reason)) {
								toasts.addError(t(`errors.${reason.json.error}` as any));
							}
							else {
								toasts.addError(reason);
							}
							challengeGenerated.current = false;
						});
				}
			}
		}
		void webAuthnAuthenticate();
	}, [router, toasts, next, t]);

	return (
		<>
			<Form
				fields={{
					login: "",
					password: "",
					rememberMe: false
				}}
				className="flex flex-col gap-8"
				formErrorMessages={false}
				onSubmit={async (body) => {
					const value = await Authentication.login(body);
					if ("error" in value) {
						if (value.error === "invalid_credentials") {
							throw t.rich("errors.invalid_credentials_complex", {
								help: (children) => (
									<InlineLink
										className="underline"
										highlight={false}
										href="https://hello.flirtu.al/support/solutions/articles/73000539480-reset-your-password"
									>
										{children}
									</InlineLink>
								),
								reset: (children) => (
									<InlineLink
										className="underline"
										highlight={false}
										href={urls.forgotPassword}
									>
										{children}
									</InlineLink>
								)
							});
						}

						// eslint-disable-next-line no-throw-literal
						throw [t(`errors.${value.error}`)];
					}

					router.push(next ?? urls.browse());
					router.refresh();
				}}
			>
				{({ errors, FormField }) => (
					<>
						<FormField name="login">
							{({ props, labelProps }) => (
								<>
									<InputLabel {...labelProps}>Email address</InputLabel>
									<InputText
										{...props}
										autoCapitalize="none"
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
					<hr className="my-8 h-px w-full border-0 bg-white-40 vision:bg-transparent dark:bg-black-40" />
					<span className="absolute left-1/2 -translate-x-1/2 bg-white-20 px-3 font-montserrat font-semibold uppercase text-black-50 vision:bg-transparent vision:text-white-50 dark:bg-black-70 dark:text-white-50">
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
