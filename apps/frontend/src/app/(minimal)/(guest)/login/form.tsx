"use client";

import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FC, useEffect, useRef } from "react";

import { Authentication } from "~/api/auth";
import { isWretchError } from "~/api/common";
import { ButtonLink } from "~/components/button";
import { Form, FormButton } from "~/components/forms";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useTranslations } from "~/hooks/use-internationalization";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import { LoginConnectionButton } from "./login-connection-button";

export const LoginForm: FC<{ next?: string }> = ({ next }) => {
	const router = useRouter();
	const toasts = useToast();
	const challengeGenerated = useRef(false);
	const t = useTranslations("login");
	const tError = useTranslations("errors");

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
								toasts.addError(tError(reason.json.error as any));
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
	}, [router, toasts, next, tError]);

	return (
		<>
			<Form
				withCaptcha
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
							throw tError.rich("invalid_credentials_complex", {
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
						if (value.error === "leaked_login_password") {
							throw tError.rich("leaked_login_password", {
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
						if (value.error === "login_rate_limit") {
							throw tError.rich("login_rate_limit", {
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
						throw [tError(value.error)];
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
									<InputLabel {...labelProps}>{t("email")}</InputLabel>
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
									<InputLabel
										{...labelProps}
										hint={(
											<InputLabelHint>
												<InlineLink href={urls.forgotPassword}>{t("forgot")}</InlineLink>
											</InputLabelHint>
										)}
									>
										{t("password")}
									</InputLabel>
									<InputText
										{...props}
										autoComplete="current-password"
										type="password"
									/>
								</>
							)}
						</FormField>
						<div className="flex flex-col gap-4">
							<div className="flex gap-2 desktop:flex-row-reverse">
								<FormButton className="w-44" size="sm">
									{t("title")}
								</FormButton>
								<ButtonLink
									className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
									href={urls.register}
									kind="tertiary"
									size="sm"
								>
									<span>{t("or_sign_up")}</span>
									<MoveRight className="size-5 desktop:rotate-180" />
								</ButtonLink>
							</div>
							<FormInputMessages
								messages={errors.map((value) => ({ type: "error", value }))}
							/>
						</div>
					</>
				)}
			</Form>
			<div className="flex flex-col gap-2">
				<div className="inline-flex items-center justify-center">
					<span className="absolute left-1/2 mb-1 -translate-x-1/2 bg-white-20 px-3 font-montserrat font-semibold text-black-50 vision:bg-transparent vision:text-white-50 dark:bg-black-70 dark:text-white-50">
						{t("or")}
					</span>
					<hr className="my-8 h-px w-full border-0 bg-white-40 vision:bg-transparent dark:bg-black-60" />
				</div>
				<LoginConnectionButton type="discord" />
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
				{/* <LoginConnectionButton type="vrchat" /> */}
			</div>
		</>
	);
};
