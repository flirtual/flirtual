"use client";

import { useRouter } from "next/navigation";

import { User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";

export const PasswordChangeForm: React.FC = () => {
	const [session] = useSession();
	const router = useRouter();

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
				await User.updatePassword(session.user.id, body);
				router.refresh();
			}}
		>
			{({ FormField }) => (
				<>
					<InputLabel className="text-2xl font-semibold">
						Change password
					</InputLabel>
					<FormField name="currentPassword">
						{(field) => (
							<>
								<InputLabel>Confirm current password</InputLabel>
								<InputText
									{...field.props}
									autoComplete="current-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<FormField name="password">
						{(field) => (
							<>
								<InputLabel>New password</InputLabel>
								<InputText
									{...field.props}
									autoComplete="new-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<FormField name="passwordConfirmation">
						{(field) => (
							<>
								<InputLabel>Confirm new password</InputLabel>
								<InputText
									{...field.props}
									autoComplete="new-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
