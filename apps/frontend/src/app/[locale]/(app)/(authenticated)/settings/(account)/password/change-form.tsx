import { useTranslation } from "react-i18next";

import { User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useOptionalSession } from "~/hooks/use-session";
import { useNavigate } from "react-router";

export const PasswordChangeForm: React.FC = () => {
	const session = useOptionalSession();
	const navigate = useNavigate();
	const { t } = useTranslation();

	if (!session) return null;

	return (
		<Form
			fields={{
				password: "",
				passwordConfirmation: "",
				currentPassword: ""
			}}
			className="flex flex-col gap-8"
			requireChange={["password", "passwordConfirmation", "currentPassword"]}
			onSubmit={async (body) => {
				await User.updatePassword(session.user.id, body);
				router.refresh();
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
