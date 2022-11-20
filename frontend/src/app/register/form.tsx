"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormField } from "~/components/forms/field";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputCheckbox, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useInputForm } from "~/hooks/use-input-form";

export const RegisterForm: React.FC = () => {
	const router = useRouter();

	const { fields, formErrors, formProps } = useInputForm({
		fields: {
			username: "",
			email: "",
			password: "",
			serviceAgreement: false,
			notifications: true
		},
		onSubmit: async (values) => {
			await api.user.create(values);
			router.push("/onboarding/1");
		}
	});

	return (
		<form {...formProps} className="flex flex-col gap-8">
			<FormField field={fields.username}>
				{({ props, labelProps }) => (
					<>
						<InputLabel {...labelProps}>Username</InputLabel>
						<InputText {...props} />
					</>
				)}
			</FormField>
			<FormField field={fields.email}>
				{({ props, labelProps }) => (
					<>
						<InputLabel {...labelProps}>Email Address</InputLabel>
						<InputText {...props} type="email" />
					</>
				)}
			</FormField>
			<FormField field={fields.password}>
				{({ props, labelProps }) => (
					<>
						<InputLabel {...labelProps}>Password</InputLabel>
						<InputText {...props} type="password" />
					</>
				)}
			</FormField>
			<FormField field={fields.serviceAgreement}>
				{({ props, labelProps }) => (
					<div className="flex items-center gap-4">
						<InputCheckbox {...props} />
						<InputLabel
							{...labelProps}
							inline
							hint={
								<InputLabelHint className="max-w-[34ch]">
									I agree to the{" "}
									<a className="underline" href="/terms">
										Terms of Service
									</a>{" "}
									&{" "}
									<a className="underline" href="/privacy">
										Privacy Policy
									</a>{" "}
									and I&apos;m at least 18 years of age.
								</InputLabelHint>
							}
						>
							Service Agreement
						</InputLabel>
					</div>
				)}
			</FormField>
			<FormField field={fields.notifications}>
				{({ props, labelProps }) => (
					<div className="flex items-center gap-4">
						<InputCheckbox {...props} />
						<InputLabel
							{...labelProps}
							inline
							hint={
								<InputLabelHint className="max-w-[34ch]">
									Get updated about new features, changes, and offers. (
									<i>we promise not to spam you</i>)
								</InputLabelHint>
							}
						>
							Notifications
						</InputLabel>
					</div>
				)}
			</FormField>
			<div className="flex flex-col gap-4">
				<button className="w-full rounded-xl bg-brand-gradient p-4 shadow-brand-1" type="submit">
					<span className="font-montserrat text-xl text-white">Create my account</span>
				</button>
				<FormInputMessages messages={formErrors} />
				<div className="flex flex-col font-nunito text-lg">
					<FormAlternativeActionLink href="/login">
						Already have an account? Login!
					</FormAlternativeActionLink>
				</div>
			</div>
		</form>
	);
};
