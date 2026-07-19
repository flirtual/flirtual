import { MoveRight } from "lucide-react";
import type { FC } from "react";
import { useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import type { Session } from "~/api/auth";
import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { Form, FormButton } from "~/components/forms";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InlineLink } from "~/components/inline-link";
import {
	InputCheckbox,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { useDevice } from "~/hooks/use-device";
import { useLocale } from "~/i18n";
import { useOptimisticRoute } from "~/preload";
import { mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

import { LoginConnectionButton } from "../login/login-connection-button";

export const SignUpForm: FC = () => {
	const { t } = useTranslation();
	const [locale] = useLocale();
	const device = useDevice();

	const agreementDenials = useRef(0);
	const [agreementShake, setAgreementShake] = useState(0);

	useOptimisticRoute(urls.onboarding(1));

	return (
		<Form
			withCaptcha
			fields={{
				email: "",
				password: "",
				url: "",
				serviceAgreement: false,
				notifications: false
			}}
			captchaTabIndex={11}
			className="flex flex-col gap-8"
			formErrorMessages={false}
			renderCaptcha={false}
			requireChange={false}
			onSubmit={async ({ ...values }, { captcha }) => {
				const now = new Date().toISOString();
				const user = await User.create({
					...values,
					captcha,
					language: locale
				});

				await mutate<Session>(sessionKey(), { user, updatedAt: now, createdAt: now });
			}}
		>
			{({ errors, fields, setFieldErrors, Captcha, FormField }) => {
				const guardServiceAgreement = () => {
					if (fields.serviceAgreement.props.value) return true;

					agreementDenials.current += 1;
					setAgreementShake(agreementDenials.current);

					if (agreementDenials.current > 1)
						setFieldErrors((fieldErrors) => ({
							...fieldErrors,
							serviceAgreement: [t("errors.must_be_accepted")]
						}));

					return false;
				};

				return (
					<>
						<FormField name="email">
							{({ props, labelProps }) => (
								<>
									<InputLabel {...labelProps}>{t("email_address")}</InputLabel>
									<InputText {...props} autoComplete="email" tabIndex={1} type="email" />
								</>
							)}
						</FormField>
						<FormField name="password">
							{({ props, labelProps }) => (
								<>
									<InputLabel {...labelProps}>{t("password")}</InputLabel>
									<InputText
										tabIndex={2}
										{...props}
										autoComplete="new-password"
										type="password"
									/>
								</>
							)}
						</FormField>
						<FormField
							name="url"
							aria-hidden="true"
							className="absolute left-[-9999px]"
						>
							{({ props, labelProps }) => (
								<>
									<InputLabel {...labelProps}>{t("url")}</InputLabel>
									<InputText {...props} autoComplete="nope" tabIndex={-1} />
								</>
							)}
						</FormField>
						<FormField
							key={agreementShake}
							name="serviceAgreement"
							className={agreementShake > 0 ? "motion-preset-shake" : undefined}
						>
							{({ props, labelProps }) => (
								<div className="flex items-center gap-4">
									<InputCheckbox
										{...props}
										tabIndex={3}
										onChange={(value) => {
											props.onChange(value);
											if (value)
												setFieldErrors((fieldErrors) => ({
													...fieldErrors,
													serviceAgreement: []
												}));
										}}
									/>
									<InputLabel
										{...labelProps}
										inline
										hint={(
											<InputLabelHint className="max-w-[34ch]">
												<Trans
													components={{
														terms: (
															<InlineLink
																className="underline"
																highlight={false}
																href={urls.resources.termsOfService}
																tabIndex={4}
															/>
														),
														privacy: (
															<InlineLink
																className="underline"
																highlight={false}
																href={urls.resources.privacyPolicy}
																tabIndex={5}
															/>
														)
													}}
													i18nKey="pickle_capricious_cemetery_name"
												/>
											</InputLabelHint>
										)}
									>
										{t("i_agree")}
									</InputLabel>
								</div>
							)}
						</FormField>
						<FormField name="notifications">
							{({ props, labelProps }) => (
								<div className="flex items-center gap-4">
									<InputCheckbox {...props} tabIndex={6} />
									<InputLabel
										{...labelProps}
										inline
										hint={(
											<InputLabelHint className="max-w-[34ch]">
												<Trans i18nKey="spade_mindless_furry_jeans" />
											</InputLabelHint>
										)}
									>
										{t("acidic_temporary_fill_cracker")}
									</InputLabel>
								</div>
							)}
						</FormField>
						<Captcha />
						<div className="flex flex-col gap-4">
							<div className="flex gap-2 desktop:flex-row-reverse">
								<FormButton className="min-w-44" size="sm" tabIndex={7}>
									{t("create_account")}
								</FormButton>
								<ButtonLink
									className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
									href={urls.login()}
									kind="tertiary"
									size="sm"
									tabIndex={8}
								>
									<span>{t("or_log_in")}</span>
									<MoveRight className="size-5 desktop:rotate-180" />
								</ButtonLink>
							</div>
							<FormInputMessages
								messages={errors.map((value) => ({ type: "error", value }))}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<div className="inline-flex items-center justify-center">
								<span className="absolute left-1/2 mb-1 -translate-x-1/2 bg-white-20 px-3 font-montserrat font-semibold text-black-50 vision:bg-transparent vision:text-white-50 dark:bg-black-70 dark:text-white-50">
									{t("or")}
								</span>
								<hr className="my-8 h-px w-full border-0 bg-white-40 vision:bg-transparent dark:bg-black-60" />
							</div>
							{device.apple && (
								<LoginConnectionButton
									guard={guardServiceAgreement}
									tabIndex={9}
									type="apple"
								/>
							)}
							{/* <LoginConnectionButton guard={guardServiceAgreement} tabIndex={10} type="google" /> */}
							<LoginConnectionButton
								guard={guardServiceAgreement}
								tabIndex={10}
								type="discord"
							/>
						</div>
					</>
				);
			}}
		</Form>
	);
};
