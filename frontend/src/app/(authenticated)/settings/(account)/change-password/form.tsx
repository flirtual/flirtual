"use client";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";

export const ChangePasswordForm: React.FC = () => {
	const [session, mutateSession] = useSession();
	if (!session) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={["password", "passwordConfirmation", "currentPassword"]}
			fields={{
				password: "",
				passwordConfirmation: "",
				currentPassword: ""
			}}
			onSubmit={async (body) => {
				await mutateSession({
					...session,
					user: await api.user.updatePassword(session.user.id, { body })
				});
			}}
		>
			{({ FormField }) => (
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
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
