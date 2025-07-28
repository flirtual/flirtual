import { Trans, useTranslation } from "react-i18next";

import type { Session } from "~/api/auth";
import { User } from "~/api/user";
import { CopyClick } from "~/components/copy-click";
import { Form, FormButton } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";
import { useInterval } from "~/hooks/use-interval";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, mutate, sessionKey } from "~/query";

export const UserForms: React.FC = () => {
	const { user } = useSession();

	const toasts = useToast();
	const { t } = useTranslation();

	useInterval(() => invalidate({ queryKey: sessionKey() }), "1s");

	return (
		<>
			<Form
				className="flex flex-col gap-4"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					await User.resendConfirmEmail()
						.then(async (user) => {
							await toasts.add(t("salty_novel_octopus_surge"));
							await mutate<Session | null>(sessionKey(), (session) => ({ ...session, user }));
						})
						.catch(toasts.addError);

					await invalidate({ queryKey: sessionKey() });
				}}
			>
				<div className="flex flex-col gap-2">
					<h1 className="font-montserrat text-xl font-semibold">
						{t("one_more_step")}
					</h1>
					<span className="text-lg">
						<Trans
							components={{
								copy: <CopyClick data-mask className="select-all font-semibold" value={user.email} />,
							}}
							i18nKey="maroon_polite_butterfly_boil"
							values={{ email: user.email }}
						/>
					</span>
				</div>
				<FormButton>{t("send_again")}</FormButton>
			</Form>
			<Form
				fields={{
					email: user.email,
					emailConfirmation: "",
					currentPassword: ""
				}}
				className="mt-8"
				requireChange={["email", "emailConfirmation", "currentPassword"]}
				onSubmit={async (body) => {
					await User.updateEmail(user.id, body)
						.then(() => toasts.add(t("email_changed")))
						.catch(toasts.addError);

					await invalidate({ queryKey: sessionKey() });
				}}
			>
				{({ FormField }) => (
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="font-montserrat text-xl font-semibold">
								{t("happy_whole_parrot_intend")}
							</h1>
							<h2 className="text-lg">
								{t("even_trick_pelican_swim")}
							</h2>
						</div>
						<FormField name="email">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>
										{t("new_email_address")}
									</InputLabel>
									<InputText
										{...field.props}
										autoComplete="email"
										type="email"
									/>
								</>
							)}
						</FormField>
						<FormField name="emailConfirmation">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>
										{t("confirm_email_address")}
									</InputLabel>
									<InputText {...field.props} autoComplete="off" type="email" />
								</>
							)}
						</FormField>
						<FormField name="currentPassword">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>
										{t("confirm_current_password")}
									</InputLabel>
									<InputText
										{...field.props}
										autoComplete="current-password"
										type="password"
									/>
								</>
							)}
						</FormField>
						<FormButton>{t("update_email")}</FormButton>
					</div>
				)}
			</Form>
		</>
	);
};
