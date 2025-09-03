import { MoveRight } from "lucide-react";
import type { FC } from "react";
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
import { useLocale } from "~/i18n";
import { useOptimisticRoute } from "~/preload";
import { mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

export const SignUpForm: FC = () => {
	const { t } = useTranslation();
	const [locale] = useLocale();

	useOptimisticRoute(urls.onboarding(1));

	return (
		<Form
			withCaptcha
			fields={{
				email: "",
				password: "",
				url: "",
				serviceAgreement: false,
				notifications: true
			}}
			captchaTabIndex={10}
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
			{({ errors, Captcha, FormField }) => (
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
					<FormField name="serviceAgreement">
						{({ props, labelProps }) => (
							<div className="flex items-center gap-4">
								<InputCheckbox {...props} tabIndex={4} />
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
															tabIndex={8}
														/>
													),
													privacy: (
														<InlineLink
															className="underline"
															highlight={false}
															href={urls.resources.privacyPolicy}
															tabIndex={9}
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
								<InputCheckbox {...props} tabIndex={5} />
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
							<FormButton className="min-w-44" size="sm" tabIndex={6}>
								{t("create_account")}
							</FormButton>
							<ButtonLink
								className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
								href={urls.login()}
								kind="tertiary"
								size="sm"
								tabIndex={7}
							>
								<span>{t("or_log_in")}</span>
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
	);
};
