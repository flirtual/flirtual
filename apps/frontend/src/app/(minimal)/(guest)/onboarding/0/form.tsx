"use client";

import { MoveRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC } from "react";

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
import { urls } from "~/urls";

export const Onboarding0Form: FC = () => {
	const t = useTranslations("signup");
	const router = useRouter();

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
			className="flex flex-col gap-8"
			formErrorMessages={false}
			renderCaptcha={false}
			requireChange={false}
			onSubmit={async ({ ...values }, { captcha }) => {
				await User.create({
					...values,
					captcha
				});

				router.refresh();
				router.push(urls.onboarding(1));
			}}
		>
			{({ errors, Captcha, FormField }) => (
				<>
					<FormField name="email">
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>Email address</InputLabel>
								<InputText {...props} autoComplete="email" type="email" />
							</>
						)}
					</FormField>
					<FormField name="password">
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>Password</InputLabel>
								<InputText
									{...props}
									autoComplete="new-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<FormField
						aria-hidden="true"
						className="absolute left-[-9999px]"
						name="url"
					>
						{({ props, labelProps }) => (
							<>
								<InputLabel {...labelProps}>URL</InputLabel>
								<InputText {...props} autoComplete="nope" tabIndex={-1} />
							</>
						)}
					</FormField>
					<FormField name="serviceAgreement">
						{({ props, labelProps }) => (
							<div className="flex items-center gap-4">
								<InputCheckbox {...props} />
								<InputLabel
									{...labelProps}
									inline
									hint={(
										<InputLabelHint className="max-w-[34ch]">
											to the
											{" "}
											<InlineLink
												className="underline"
												highlight={false}
												href={urls.resources.termsOfService}
											>
												Terms of Service
											</InlineLink>
											{" "}
											&
											{" "}
											<InlineLink
												className="underline"
												highlight={false}
												href={urls.resources.privacyPolicy}
											>
												Privacy Policy
											</InlineLink>
											{" "}
											and I&apos;m at least 18 years of age
										</InputLabelHint>
									)}
								>
									I agree
								</InputLabel>
							</div>
						)}
					</FormField>
					<FormField name="notifications">
						{({ props, labelProps }) => (
							<div className="flex items-center gap-4">
								<InputCheckbox {...props} />
								<InputLabel
									{...labelProps}
									inline
									hint={(
										<InputLabelHint className="max-w-[34ch]">
											with new features, changes, and offers
											<br />
											(we won&apos;t spam you)
										</InputLabelHint>
									)}
								>
									Get Flirtual updates
								</InputLabel>
							</div>
						)}
					</FormField>
					<Captcha />
					<div className="flex flex-col gap-4">
						<div className="flex gap-2 desktop:flex-row-reverse">
							<FormButton className="w-44" size="sm">
								{t("title")}
							</FormButton>
							<ButtonLink
								className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
								href={urls.login()}
								kind="tertiary"
								size="sm"
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
