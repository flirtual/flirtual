"use client";

import { api } from "~/api";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";

export const ChangePasswordForm: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={["password", "passwordConfirmation", "currentPassword"]}
			fields={{
				password: "",
				passwordConfirmation: "",
				currentPassword: ""
			}}
			onSubmit={async (values) => {
				await mutateUser(api.user.updatePassword(user.id, values));
			}}
		>
			{({ FormField, buttonProps }) => (
				<>
					<FormField name="currentPassword">
						{(field) => (
							<>
								<InputLabel>Confirm current password</InputLabel>
								<InputText {...field.props} autoComplete="current-password" type="password" />
							</>
						)}
					</FormField>
					<FormField name="password">
						{(field) => (
							<>
								<InputLabel>New password</InputLabel>
								<InputText {...field.props} autoComplete="new-password" type="password" />
							</>
						)}
					</FormField>
					<FormField name="passwordConfirmation">
						{(field) => (
							<>
								<InputLabel>Confirm new password</InputLabel>
								<InputText {...field.props} autoComplete="new-password" type="password" />
							</>
						)}
					</FormField>
					<Button {...buttonProps}>Update</Button>
				</>
			)}
		</Form>
	);
};
