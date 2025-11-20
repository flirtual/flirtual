/* eslint-disable no-throw-literal */
import * as OneTimePasswordField from "@radix-ui/react-one-time-password-field";
import { MoveLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Authentication } from "~/api/auth";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InlineLink } from "~/components/inline-link";
import { useInterval } from "~/hooks/use-interval";
import { useNavigate } from "~/i18n";
import { invalidate, mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

import { next } from "./form";

export interface VerificationFormProps {
	loginId: string;
	email: string;
	onBack: () => void;
}

export const VerificationForm: FC<VerificationFormProps> = ({ loginId, email, onBack }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const firstInputReference = useRef<HTMLInputElement>(null);
	const [code, setCode] = useState("");
	const [resendCountdown, setResendCountdown] = useState(60);

	useEffect(() => {
		if (firstInputReference.current) {
			firstInputReference.current.focus();
		}
	}, []);

	useInterval(
		useCallback(() => {
			if (resendCountdown > 0) {
				setResendCountdown((previous) => previous - 1);
			}
		}, [resendCountdown]),
		1000
	);

	return (
		<Form
			fields={{ code: "" }}
			formErrorMessages={false}
			onSubmit={async () => {
				const value = await Authentication.verify({
					loginId,
					code
				});

				if ("error" in value) {
					if (value.error === "verification_rate_limit")
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
								i18nKey="errors.verification_rate_limit"
							/>
						];

					throw [t(`errors.${value.error}` as any)];
				}

				await invalidate({ refetchType: "none" });
				await mutate(sessionKey(), value);
			}}
		>
			{({ errors, submitting, setErrors }) => {
				const handleResendCode = async () => {
					if (resendCountdown > 0) return;

					const result = await Authentication.resendVerification(loginId);

					if ("error" in result) {
						setErrors([t(`errors.${result.error}` as any)]);
						return;
					}

					setCode("");
					setErrors([]);
					setResendCountdown(60);
				};

				return (
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-2">
							<h1 className="font-montserrat text-xl font-semibold">
								{t("enter_verification_code")}
							</h1>
							<p>
								{t("enter_verification_code_description", { email })}
							</p>
						</div>

						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<OneTimePasswordField.Root
									// TODO: Waiting on radix-ui/primitives#3547
									// (Replaces firstInputReference & useEffect)
									// autoFocus
									autoSubmit
									className="flex justify-center gap-3"
									disabled={submitting}
									value={code}
									onValueChange={setCode}
								>
									{Array.from({ length: 6 }, (_, index) => (
										<OneTimePasswordField.Input
											key={index}
											className="focusable h-14 w-12 rounded-xl border-none bg-white-40 text-center font-nunito text-2xl font-bold text-black-80 shadow-brand-1 disabled:cursor-not-allowed disabled:opacity-50 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20"
											ref={index === 0 ? firstInputReference : null}
										/>
									))}
									<OneTimePasswordField.HiddenInput />
								</OneTimePasswordField.Root>
								<div className="flex justify-center">
									<Button
										className="text-sm font-medium"
										disabled={resendCountdown > 0}
										kind="tertiary"
										size="xs"
										type="button"
										onClick={handleResendCode}
									>
										{resendCountdown > 0
											? <span>{t("resend_in", { seconds: <span className="font-mono">{resendCountdown}</span> })}</span>
											: t("resend_code")}
									</Button>
								</div>
							</div>

							<div className="flex flex-col gap-4">
								<div className="ml-auto flex gap-2">
									<Button
										className="flex w-fit flex-row gap-2 opacity-75"
										kind="tertiary"
										size="sm"
										type="button"
										onClick={onBack}
									>
										<MoveLeft className="size-5 shrink-0" />
										<span>{t("back")}</span>
									</Button>
									<Button
										className="min-w-36"
										disabled={submitting}
										size="sm"
										type="submit"
									>
										{submitting ? t("verifying") : t("submit")}
									</Button>
								</div>
								<FormInputMessages
									messages={errors.map((value) => ({ type: "error", value }))}
								/>
							</div>
						</div>
					</div>
				);
			}}
		</Form>
	);
};
