"use client";

import { Form, FormButton } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";

export const ReferralForm: React.FC = () => {
	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				code: ""
			}}
			onSubmit={async () => {}}
		>
			{({ FormField }) => (
				<>
					<FormField name="code">
						{(field) => (
							<>
								<InputLabel
									inline
									hint="Has a friend invited you to Flirtual? Enter their referral code here and get ???."
								>
									Redeem a code
								</InputLabel>
								<InputText {...field.props} placeholder="ABCD1234" />
							</>
						)}
					</FormField>
					<FormButton>Redeem</FormButton>
				</>
			)}
		</Form>
	);
};
