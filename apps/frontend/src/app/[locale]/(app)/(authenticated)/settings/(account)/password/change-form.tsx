import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useLocale } from "~/i18n";
import { mutate, sessionKey } from "~/query";

export const PasswordChangeForm: React.FC = () => {
	const session = useSession();
	const toasts = useToast();
	const { t } = useTranslation();

	const [locale] = useLocale();
	const listFormatter = new Intl.ListFormat(locale, { style: "long", type: "disjunction" });

	const hasPassword = !!session.user.hasPassword;
	const connectionLabels = (session.user.connections ?? [])
		.filter((c) => c.type !== "vrchat")
		.map((c) => t(c.type));

	const initialValues = useMemo(() => ({
		password: "",
		passwordConfirmation: "",
		...(hasPassword ? { currentPassword: "" } : {})
	}), [hasPassword]);

	return (
		<Form
			key={String(hasPassword)}
			requireChange
			className="flex flex-col gap-8"
			fields={initialValues}
			onSubmit={async (body, { reset }) => {
				const user = await User.updatePassword(session.user.id, body);
				reset(initialValues);

				toasts.add(hasPassword ? t("password_changed") : t("password_set"));

				await mutate(sessionKey(), { ...session, user });
			}}
		>
			{({ FormField }) => (
				<>
					<div className="flex flex-col gap-4">
						<InputLabel className="text-2xl font-semibold">
							{hasPassword ? t("change_password") : t("add_password")}
						</InputLabel>
						{!hasPassword && connectionLabels.length > 0 && (
							<p className="text-black-60 dark:text-white-40">
								{t("add_password_help", {
									email: session.user.email,
									providers: listFormatter.format(connectionLabels)
								})}
							</p>
						)}
					</div>
					{hasPassword && (
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
					)}
					<FormField name="password">
						{(field) => (
							<>
								<InputLabel>{hasPassword ? t("new_password") : t("password")}</InputLabel>
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
								<InputLabel>{t("confirm_password")}</InputLabel>
								<InputText
									{...field.props}
									autoComplete="new-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<FormButton>{hasPassword ? t("update") : t("save")}</FormButton>
				</>
			)}
		</Form>
	);
};
