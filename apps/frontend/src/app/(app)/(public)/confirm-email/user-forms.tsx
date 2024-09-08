"use client";

import { useRouter } from "next/navigation";

import { Form, FormButton } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";
import { useInterval } from "~/hooks/use-interval";
import { useToast } from "~/hooks/use-toast";
import { CopyClick } from "~/components/copy-click";
import { User } from "~/api/user";

export const UserForms: React.FC<{ user?: User }> = ({ user }) => {
	const router = useRouter();
	const toasts = useToast();

	useInterval(() => {
		if (!user) return;
		router.refresh();
	}, 5000);

	if (!user) return null;

	return (
		<>
			<Form
				className="flex flex-col gap-4"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					await User.resendConfirmEmail()
						.then(() => {
							toasts.add("Resent confirmation email");
							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				<div className="flex flex-col gap-2">
					<h1 className="font-montserrat text-xl font-semibold">
						Just one more step!
					</h1>
					<span className="text-lg">
						Check your email (
						<CopyClick value={user.email}>
							<span data-sentry-mask className="select-all font-semibold">
								{user.email}
							</span>
						</CopyClick>
						) for your account confirmation link. If you don&apos;t see it in
						your inbox, check your spam/trash folders.
					</span>
				</div>
				<FormButton>Send again</FormButton>
			</Form>
			<Form
				className="mt-8"
				requireChange={["email", "emailConfirmation", "currentPassword"]}
				fields={{
					email: user.email,
					emailConfirmation: "",
					currentPassword: ""
				}}
				onSubmit={async (body) => {
					await User.updateEmail(user.id, body)
						.then(() => {
							toasts.add("Email changed");
							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				{({ FormField }) => (
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="font-montserrat text-xl font-semibold">
								Wrong email address?
							</h1>
							<h2 className="text-lg">
								If you entered the wrong email, or if you&apos;d like to try a
								different email, you can enter a new one below:
							</h2>
						</div>
						<FormField name="email">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>
										New email address
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
										Confirm email address
									</InputLabel>
									<InputText {...field.props} autoComplete="off" type="email" />
								</>
							)}
						</FormField>
						<FormField name="currentPassword">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>
										Confirm current password
									</InputLabel>
									<InputText
										{...field.props}
										autoComplete="current-password"
										type="password"
									/>
								</>
							)}
						</FormField>
						<FormButton>Update email</FormButton>
					</div>
				)}
			</Form>
		</>
	);
};
