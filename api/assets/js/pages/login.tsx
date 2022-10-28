import React from "react";

import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { Input } from "~/components/inputs";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

export const LoginPage: React.FC = () => (
	<SoleModelLayout>
		<ModelCard title="Login">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<Input.Label hint="(or email)">Username</Input.Label>
					<Input.Text name="username" />
				</div>
				<div className="flex flex-col gap-2">
					<Input.Label>Password</Input.Label>
					<Input.Text name="password" type="password" />
				</div>
				<div className="flex items-center gap-4">
					<Input.Checkbox name="remember_me" />
					<Input.Label
						inline
						hint={
							<Input.Label.Hint className="max-w-[34ch]">
								Keep your account logged in for 30 days, not recommended on public or shared
								devices.
							</Input.Label.Hint>
						}
					>
						Remember me
					</Input.Label>
				</div>
				<div className="flex flex-col gap-4">
					<button className="bg-brand-gradient shadow-brand-1 p-4 rounded-xl" type="button">
						<span className="font-montserrat text-white text-xl">Login</span>
					</button>
					<div className="font-nunito flex flex-col text-lg">
						<FormAlternativeActionLink to="/register">
							Don&apos;t have an account yet? Sign up!
						</FormAlternativeActionLink>
						<FormAlternativeActionLink to="/forgot">
							Forgot your password?
						</FormAlternativeActionLink>
					</div>
				</div>
			</div>
		</ModelCard>
	</SoleModelLayout>
);
