/* eslint-disable no-throw-literal */
import * as OneTimePasswordField from "@radix-ui/react-one-time-password-field";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import { MoveLeft, Smartphone } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Authentication } from "~/api/auth";
import { Button } from "~/components/button";
import { Form, FormButton } from "~/components/forms";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { InputCountrySelect } from "~/components/inputs/specialized";
import { useConfig } from "~/hooks/use-config";
import { useDevice } from "~/hooks/use-device";
import { useNavigate } from "~/i18n";
import { invalidate, mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

import { next } from "./form";

export const PhoneLoginButton: FC<{ tabIndex?: number; onClick: () => void }> = ({ tabIndex, onClick }) => {
	const { t } = useTranslation();

	return (
		<Button className="gap-4" kind="secondary" size="sm" tabIndex={tabIndex} type="button" onClick={onClick}>
			<Smartphone className="size-6" />
			<span className="font-montserrat text-lg font-semibold">
				{t("continue_with", { type: t("phone") })}
			</span>
		</Button>
	);
};

export interface PhoneLoginProps {
	signup: boolean;
	onBack: () => void;
}

export const PhoneLogin: FC<PhoneLoginProps> = ({ signup, onBack }) => {
	const config = useConfig();
	const [entered, setEntered] = useState({ country: config.country, number: "" });
	const [sentTo, setSentTo] = useState<string | null>(null);

	if (sentTo)
		return (
			<PhoneCodeForm
				phoneNumber={sentTo}
				signup={signup}
				onBack={() => setSentTo(null)}
			/>
		);

	return (
		<PhoneNumberForm
			entered={entered}
			onBack={onBack}
			onSent={(phoneNumber, values) => {
				setEntered(values);
				setSentTo(phoneNumber);
			}}
		/>
	);
};

interface PhoneNumberFormProps {
	entered: { country: string | null; number: string };
	onBack: () => void;
	onSent: (phoneNumber: string, entered: { country: string | null; number: string }) => void;
}

const PhoneNumberForm: FC<PhoneNumberFormProps> = ({ entered, onBack, onSent }) => {
	const { t } = useTranslation();
	const config = useConfig();

	return (
		<Form
			withCaptcha
			className="flex flex-col gap-8"
			fields={entered}
			formErrorMessages={false}
			renderCaptcha={false}
			requireChange={false}
			onSubmit={async (values, { captcha }) => {
				const parsed = parsePhoneNumberFromString(
					values.number,
					values.country ? (values.country.toUpperCase() as CountryCode) : undefined
				);

				if (!parsed?.isValid()) throw [t("errors.phone_invalid")];

				const response = await Authentication.phone.sendCode({
					phoneNumber: parsed.number,
					captcha
				});

				if ("error" in response) throw [t(`errors.${response.error}` as any)];

				onSent(response.phoneNumber, values);
			}}
		>
			{({ errors, FormField, captchaWidget }) => (
				<>
					<FormField name="country">
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>{t("country")}</InputLabel>
								<InputCountrySelect {...props} prefer={config.country ?? undefined} tabIndex={1} />
							</>
						)}
					</FormField>
					<FormField name="number">
						{({ props, labelProps }) => (
							<>
								<InputLabel
									{...labelProps}
									hint={<InputLabelHint>{t("sms_consent")}</InputLabelHint>}
								>
									{t("phone_number")}
								</InputLabel>
								<InputText {...props} autoComplete="tel" tabIndex={2} type="tel" />
							</>
						)}
					</FormField>
					{captchaWidget}
					<div className="flex flex-col gap-4">
						<div className="flex flex-row-reverse gap-2">
							<FormButton className="min-w-44" size="sm" tabIndex={3}>
								{t("send_code")}
							</FormButton>
							<Button
								className="flex w-fit flex-row gap-2 opacity-75"
								kind="tertiary"
								size="sm"
								tabIndex={4}
								type="button"
								onClick={onBack}
							>
								<MoveLeft className="size-5 shrink-0" />
								<span>{t("back")}</span>
							</Button>
						</div>
						<FormInputMessages messages={errors.map((value) => ({ type: "error", value }))} />
					</div>
				</>
			)}
		</Form>
	);
};

interface PhoneCodeFormProps {
	phoneNumber: string;
	signup: boolean;
	onBack: () => void;
}

const PhoneCodeForm: FC<PhoneCodeFormProps> = ({ phoneNumber, signup, onBack }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id: deviceId } = useDevice();
	const [code, setCode] = useState("");

	const formatted = parsePhoneNumberFromString(phoneNumber)?.formatInternational() ?? phoneNumber;

	return (
		<Form
			fields={{ code: "" }}
			formErrorMessages={false}
			onSubmit={async () => {
				const response = await Authentication.phone.verify({ phoneNumber, code, signup, deviceId });

				if ("error" in response) {
					if (response.error === "phone_not_registered")
						throw [
							<Trans
								key=""
								components={{ signup: <InlineLink className="underline" highlight={false} href={urls.register} /> }}
								i18nKey="errors.phone_not_registered"
							/>
						];

					throw [t(`errors.${response.error}` as any)];
				}

				await invalidate({ refetchType: "none" });
				await mutate(sessionKey(), response);
				navigate(signup ? urls.onboarding(1) : next());
			}}
		>
			{({ errors, submitting }) => (
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="font-montserrat text-xl font-semibold">{t("enter_verification_code")}</h1>
						<p>{t("enter_phone_code_description", { phoneNumber: formatted })}</p>
					</div>
					<div className="flex flex-col gap-4">
						<OneTimePasswordField.Root
							autoFocus
							autoSubmit
							className="flex justify-center gap-3"
							disabled={submitting}
							value={code}
							onValueChange={setCode}
						>
							{Array.from({ length: 6 }, (_, index) => (
								<OneTimePasswordField.Input
									key={index}
									className="h-14 w-12 rounded-xl border-none bg-white-40 text-center font-nunito text-2xl font-bold text-black-80 shadow-brand-1 focusable disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black-60 dark:text-white-20 vision:bg-white-40/70"
								/>
							))}
							<OneTimePasswordField.HiddenInput />
						</OneTimePasswordField.Root>
						<div className="flex justify-center">
							<Button className="text-sm font-medium" kind="tertiary" size="xs" type="button" onClick={onBack}>
								{t("send_a_new_code")}
							</Button>
						</div>
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
							<Button className="min-w-36" disabled={submitting} size="sm" type="submit">
								{submitting ? t("verifying") : t("submit")}
							</Button>
						</div>
						<FormInputMessages messages={errors.map((value) => ({ type: "error", value }))} />
					</div>
				</div>
			)}
		</Form>
	);
};
