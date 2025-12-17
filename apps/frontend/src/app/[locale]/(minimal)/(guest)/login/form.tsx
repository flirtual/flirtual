/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-throw-literal */
import { MoveRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { withSuspense } from "with-suspense";

import { Authentication } from "~/api/auth";
import { isWretchError } from "~/api/common";
import { ButtonLink } from "~/components/button";
import { Form, FormButton } from "~/components/forms";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useDevice } from "~/hooks/use-device";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { invalidate, mutate, sessionKey } from "~/query";
import { isInternalHref, urls } from "~/urls";

import { LoginConnectionButton } from "./login-connection-button";
import { MagicLogin } from "./magic-login";
import { VerificationForm } from "./verification";

export function next() {
	const defaultNext = urls.discover("dates");

	const next = new URL(location.href).searchParams.get("next") || defaultNext;
	if (!isInternalHref(next)) return defaultNext;

	return next;
}

function useKylesWebAuthnImplementation() {
	const navigate = useNavigate();
	const toasts = useToast();
	const challengeGenerated = useRef(false);
	const { id: deviceId } = useDevice();

	const { t } = useTranslation();

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
							},
							deviceId
						})
						.then(async (session) => {
							await mutate(sessionKey(), session);
							await navigate(next());
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
	}, [toasts, t, navigate, deviceId]);
}

const OAuthError: FC = withSuspense(() => {
	const [query] = useSearchParams();
	const error = query.get("error");

	const { t } = useTranslation();

	if (!error || error === "access_denied") return null;

	return (
		<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
			<span className="font-montserrat text-lg text-white-10">
				{t(`errors.${error}` as any)}
			</span>
		</div>
	);
});

export const LoginForm: FC = () => {
	const { t } = useTranslation();
	const device = useDevice();
	const [searchParameters, setSearchParameters] = useSearchParams();
	const [tokenInvalid, setTokenInvalid] = useState(false);
	const [verification, setVerification] = useState<{ loginId: string; email: string } | null>(null);

	const token = searchParameters.get("token");

	useKylesWebAuthnImplementation();

	if (token && !tokenInvalid) {
		return (
			<>
				<OAuthError />
				<MagicLogin
					token={token}
					onInvalid={() => {
						setTokenInvalid(true);
						setSearchParameters((previous) => {
							previous.delete("token");
							return previous;
						}, { replace: true });
					}}
				/>
			</>
		);
	}

	if (verification) {
		return (
			<>
				<OAuthError />
				<VerificationForm
					email={verification.email}
					loginId={verification.loginId}
					onBack={() => setVerification(null)}
				/>
			</>
		);
	}

	return (
		<>
			<OAuthError />
			<Form
				withCaptcha
				fields={{
					login: "",
					password: ""
				}}
				captchaTabIndex={7}
				className="flex flex-col gap-8"
				formErrorMessages={false}
				renderCaptcha={false}
				onSubmit={async (body) => {
					const value = await Authentication.login({
						...body,
						deviceId: device.id
					});

					if ("error" in value) {
						if (value.error === "invalid_credentials")
							throw [
								<Trans
									key=""
									components={{
										help: (
											<InlineLink
												className="underline"
												highlight={false}
												href="https://hello.flirtu.al/support/solutions/articles/73000539480-reset-your-password"
											/>
										),
										reset: (
											<InlineLink
												className="underline"
												highlight={false}
												href={urls.forgotPassword}
											/>
										)
									}}
									i18nKey="errors.invalid_credentials_complex"
								/>
							];

						if (value.error === "leaked_login_password")
							throw [
								<Trans
									key=""
									components={{
										reset: (
											<InlineLink
												className="underline"
												highlight={false}
												href={urls.forgotPassword}
											/>
										)
									}}
									i18nKey="errors.leaked_login_password"
								/>
							];

						if (value.error === "login_rate_limit" || value.error === "verification_rate_limit")
							throw [
								<Trans
									key=""
									components={{
										reset: (
											<InlineLink
												className="underline"
												highlight={false}
												href={urls.forgotPassword}
											/>
										)
									}}
									i18nKey={`errors.${value.error}`}
								/>
							];

						throw [t(`errors.${value.error}` as any)];
					}

					if ("loginId" in value) {
						setVerification({ loginId: value.loginId, email: value.email });
						return;
					}

					await invalidate({ refetchType: "none" });
					await mutate(sessionKey(), value);
				}}
			>
				{({ errors, FormField, Captcha }) => (
					<>
						<FormField name="login">
							{({ props, labelProps }) => (
								<>
									<InputLabel {...labelProps}>{t("email_address")}</InputLabel>
									<InputText
										{...props}
										autoCapitalize="none"
										autoComplete="username webauthn"
										autoCorrect="off"
										spellCheck="false"
										tabIndex={1}
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
												<InlineLink href={urls.forgotPassword} tabIndex={6}>{t("forgot_your_password")}</InlineLink>
											</InputLabelHint>
										)}
									>
										{t("password")}
									</InputLabel>
									<InputText
										{...props}
										autoComplete="current-password"
										tabIndex={2}
										type="password"
									/>
								</>
							)}
						</FormField>
						<Captcha />
						<div className="flex flex-col gap-4">
							<div className="flex gap-2 desktop:flex-row-reverse">
								<FormButton className="min-w-44" size="sm" tabIndex={3}>
									{t("log_in")}
								</FormButton>
								<ButtonLink
									className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
									href={urls.register}
									kind="tertiary"
									size="sm"
									tabIndex={4}
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
				<LoginConnectionButton tabIndex={5} type="discord" />
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
