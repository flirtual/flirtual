"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/pageUrls";

export const ChangeEmailForm: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	const router = useRouter();

	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={["email", "emailConfirmation", "currentPassword"]}
			fields={{
				email: user.email,
				emailConfirmation: "",
				currentPassword: ""
			}}
			onSubmit={async (values) => {
				await mutateUser(api.user.updateEmail(user.id, values));
				router.push(urls.confirmEmail({ to: urls.settings.default() }));
			}}
		>
			{({ FormField, buttonProps }) => (
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
								<InputText {...field.props} autoComplete="current-password" type="password" />
							</>
						)}
					</FormField>
					<Button {...buttonProps}>Update</Button>
				</>
			)}
		</Form>
	);
};
