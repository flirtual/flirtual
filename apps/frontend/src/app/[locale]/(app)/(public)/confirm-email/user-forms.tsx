"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { User } from "~/api/user";
import { CopyClick } from "~/components/copy-click";
import { Form, FormButton } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const UserForms: React.FC = () => {
	const router = useRouter();
	const toasts = useToast();
	const [session] = useOptionalSession({
		refreshInterval: 1000
	});
	const t = useTranslations();

	if (!session) return null;

	return (
		<>
			<Form
				className="flex flex-col gap-4"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					await User.resendConfirmEmail()
						.then(() => {
							toasts.add(t("salty_novel_octopus_surge"));
							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				<div className="flex flex-col gap-2">
					<h1 className="font-montserrat text-xl font-semibold">
						{t("one_more_step")}
					</h1>
					<span className="text-lg">
						{t.rich("maroon_polite_butterfly_boil", {
							copy: (children) => (
								<CopyClick value={session.user.email}>
									<span data-mask className="select-all font-semibold">
										{children}
									</span>
								</CopyClick>
							),
							email: session.user.email
						})}
					</span>
				</div>
				<FormButton>{t("send_again")}</FormButton>
			</Form>
			<Form
				fields={{
					email: session.user.email,
					emailConfirmation: "",
					currentPassword: ""
				}}
				className="mt-8"
				requireChange={["email", "emailConfirmation", "currentPassword"]}
				onSubmit={async (body) => {
					await User.updateEmail(session.user.id, body)
						.then(() => {
							toasts.add(t("email_changed"));
							return router.refresh();
						})
						.catch(toasts.addError);
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
