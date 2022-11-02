import React from "react";

import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { InputCheckbox, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

const RegisterPage: React.FC = () => (
	<SoleModelLayout>
		<ModelCard title="Register">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<InputLabel htmlFor="username">Username</InputLabel>
					<InputText name="username" />
				</div>
				<div className="flex flex-col gap-2">
					<InputLabel htmlFor="email">Email Address</InputLabel>
					<InputText name="email" type="email" />
				</div>
				<div className="flex flex-col gap-2">
					<InputLabel htmlFor="password">Password</InputLabel>
					<InputText name="password" type="password" />
				</div>
				<div className="flex items-center gap-4">
					<InputCheckbox name="service_agreement" />
					<InputLabel
						inline
						htmlFor="service_agreement"
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
				<div className="flex items-center gap-4">
					<InputCheckbox name="noti" />
					<InputLabel
						inline
						htmlFor="remember_me"
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
				<div className="flex flex-col gap-4">
					<a className="w-full" href="/onboarding/1">
						<button
							className="bg-brand-gradient shadow-brand-1 w-full p-4 rounded-xl"
							type="button"
						>
							<span className="font-montserrat text-white text-xl">Create my account</span>
						</button>
					</a>
					<div className="font-nunito flex flex-col text-lg">
						<FormAlternativeActionLink href="/login">
							Already have an account? Login!
						</FormAlternativeActionLink>
					</div>
				</div>
			</div>
		</ModelCard>
	</SoleModelLayout>
);

export default RegisterPage;
