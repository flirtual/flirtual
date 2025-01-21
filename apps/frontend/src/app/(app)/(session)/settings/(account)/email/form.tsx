"use client";

import { useTranslations } from "next-intl";
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
	const t = useTranslations();

	if (!session) return null;
	const { user } = session;

	return (
		<Form
			fields={{
				email: user.email,
				emailConfirmation: "",
				currentPassword: ""
			}}
			className="flex flex-col gap-8"
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
								<InputLabel>{t("new_email_address")}</InputLabel>
								<InputText {...field.props} type="email" />
							</>
						)}
					</FormField>
					<FormField name="emailConfirmation">
						{(field) => (
							<>
								<InputLabel>{t("confirm_new_email_address")}</InputLabel>
								<InputText {...field.props} type="email" />
							</>
						)}
					</FormField>
					<FormField name="currentPassword">
						{(field) => (
							<>
								<InputLabel>{t("confirm_current_password")}</InputLabel>
								<InputText
									{...field.props}
									autoComplete="current-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
