"use client";

import { useRouter } from "next/navigation";

import { User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const EmailForm: React.FC = () => {
	const [session, mutateSession] = useSession();
	const router = useRouter();

	if (!session) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				email: user.email,
				emailConfirmation: "",
				currentPassword: ""
			}}
			onSubmit={async (body) => {
				await mutateSession({
					...session,
					user: await User.updateEmail(user.id, body)
				});
				router.push(urls.confirmEmail({ to: urls.settings.list() }));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="email">
						{(field) => (
							<>
								<InputLabel>New email address</InputLabel>
								<InputText {...field.props} type="email" />
							</>
						)}
					</FormField>
					<FormField name="emailConfirmation">
						{(field) => (
							<>
								<InputLabel>Confirm new email address</InputLabel>
								<InputText {...field.props} type="email" />
							</>
						)}
					</FormField>
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
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
