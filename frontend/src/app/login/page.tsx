import React from "react";

import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { InputCheckbox, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

const LoginPage: React.FC = () => (
	<SoleModelLayout>
		<ModelCard title="Login">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<InputLabel hint="(or email)">Username</InputLabel>
					<InputText />
				</div>
				<div className="flex flex-col gap-2">
					<InputLabel>Password</InputLabel>
					<InputText type="password" />
				</div>
				<div className="flex items-center gap-4">
					<InputCheckbox />
					<InputLabel
						inline
						hint={
							<InputLabelHint className="max-w-[34ch]">
								Keep your account logged in for 30 days, not recommended on public or shared
								devices.
							</InputLabelHint>
						}
					>
						Remember me
					</InputLabel>
				</div>
				<div className="flex flex-col gap-4">
					<button className="bg-brand-gradient shadow-brand-1 p-4 rounded-xl" type="button">
						<span className="font-montserrat font-extrabold text-white text-xl">Login</span>
					</button>
					<div className="font-nunito flex flex-col text-lg">
						<FormAlternativeActionLink href="/register">
							Don&apos;t have an account yet? Sign up!
						</FormAlternativeActionLink>
						<FormAlternativeActionLink href="/forgot">
							Forgot your password?
						</FormAlternativeActionLink>
					</div>
				</div>
			</div>
		</ModelCard>
	</SoleModelLayout>
);

export default LoginPage;
