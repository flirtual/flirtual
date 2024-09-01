"use client";

import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";

import { api } from "~/api";
import { Form, FormButton } from "~/components/forms";
import { FormInputMessages } from "~/components/forms/input-messages";
import {
	InputCheckbox,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { urls } from "~/urls";
import { ButtonLink } from "~/components/button";

import type { FC } from "react";

export const Onboarding0Form: FC = () => {
	const router = useRouter();

	return (
		<Form
			withCaptcha
			className="flex flex-col gap-8"
			formErrorMessages={false}
			requireChange={false}
			fields={{
				email: "",
				password: "",
				url: "",
				serviceAgreement: false,
				notifications: true
			}}
			onSubmit={async ({ ...values }, { captcha }) => {
				await api.user.create({
					body: {
						...values,
						captcha
					}
				});

				router.refresh();
				router.push(urls.onboarding(1));
			}}
		>
			{({ errors, FormField }) => (
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
									hint={
										<InputLabelHint className="max-w-[34ch]">
											to the{" "}
											<a
												className="underline"
												href={urls.resources.termsOfService}
											>
												Terms of Service
											</a>{" "}
											&{" "}
											<a
												className="underline"
												href={urls.resources.privacyPolicy}
											>
												Privacy Policy
											</a>{" "}
											and I&apos;m at least 18 years of age
										</InputLabelHint>
									}
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
									hint={
										<InputLabelHint className="max-w-[34ch]">
											with new features, changes, and offers
											<br />
											(we won&apos;t spam you)
										</InputLabelHint>
									}
								>
									Get Flirtual updates
								</InputLabel>
							</div>
						)}
					</FormField>
					<div className="flex flex-col gap-4">
						<div className="flex gap-2 desktop:flex-row-reverse">
							<FormButton className="w-44" size="sm">
								Create account
							</FormButton>
							<ButtonLink
								className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
								href={urls.login()}
								kind="tertiary"
								size="sm"
							>
								<span>Login instead?</span>
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
