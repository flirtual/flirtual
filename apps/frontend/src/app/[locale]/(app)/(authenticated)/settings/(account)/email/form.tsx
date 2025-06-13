"use client";

import { useTranslations } from "next-intl";

import type { Session } from "~/api/auth";
import { User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useRouter } from "~/i18n/navigation";
import { mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

export const EmailForm: React.FC = () => {
	const t = useTranslations();
	const router = useRouter();

	const { user } = useSession();

	return (
		<Form
			fields={{
				email: user.email,
				emailConfirmation: "",
				currentPassword: ""
			}}
			className="flex flex-col gap-8"
			onSubmit={async (body) => {
				const newUser = await User.updateEmail(user.id, body);
				await mutate<Session>(sessionKey(), (session) => ({ ...session, user: newUser }));

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
