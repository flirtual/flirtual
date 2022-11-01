import React from "react";

import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { Input } from "~/components/inputs";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

export const RegisterPage: React.FC = () => (
	<SoleModelLayout>
		<ModelCard title="Register">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<Input.Label htmlFor="username">Username</Input.Label>
					<Input.Text name="username" />
				</div>
				<div className="flex flex-col gap-2">
					<Input.Label htmlFor="email">Email Address</Input.Label>
					<Input.Text name="email" type="email" />
				</div>
				<div className="flex flex-col gap-2">
					<Input.Label htmlFor="password">Password</Input.Label>
					<Input.Text name="password" type="password" />
				</div>
				<div className="flex items-center gap-4">
					<Input.Checkbox name="service_agreement" />
					<Input.Label
						inline
						htmlFor="service_agreement"
						hint={
							<Input.Label.Hint className="max-w-[34ch]">
								I agree to the{" "}
								<a className="underline" href="/terms">
									Terms of Service
								</a>{" "}
								&
								<a className="underline" href="/privacy">
									Privacy Policy
								</a>{" "}
								and I&apos;m at least 18 years of age.
							</Input.Label.Hint>
						}
					>
						Service Agreement
					</Input.Label>
				</div>
				<div className="flex items-center gap-4">
					<Input.Checkbox name="noti" />
					<Input.Label
						inline
						htmlFor="remember_me"
						hint={
							<Input.Label.Hint className="max-w-[34ch]">
								Get updated about new features, changes, and offers. (
								<i>we promise not to spam you</i>)
							</Input.Label.Hint>
						}
					>
						Notifications
					</Input.Label>
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
