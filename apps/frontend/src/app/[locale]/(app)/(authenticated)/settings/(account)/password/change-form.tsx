import { useTranslation } from "react-i18next";

import { User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { mutate, sessionKey } from "~/query";

const initialValues = {
	password: "",
	passwordConfirmation: "",
	currentPassword: ""
};

export const PasswordChangeForm: React.FC = () => {
	const session = useSession();
	const toasts = useToast();
	const { t } = useTranslation();

	return (
		<Form
			className="flex flex-col gap-8"
			fields={initialValues}
			requireChange={["password", "passwordConfirmation", "currentPassword"]}
			onSubmit={async (body, { reset }) => {
				const user = await User.updatePassword(session.user.id, body);
				reset(initialValues);

				toasts.add(t("password_changed"));

				await mutate(sessionKey(), { ...session, user });
			}}
		>
			{({ FormField }) => (
				<>
					<InputLabel className="text-2xl font-semibold">
						{t("change_password")}
					</InputLabel>
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
					<FormField name="password">
						{(field) => (
							<>
								<InputLabel>{t("new_password")}</InputLabel>
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
								<InputLabel>{t("confirm_new_password")}</InputLabel>
								<InputText
									{...field.props}
									autoComplete="new-password"
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
