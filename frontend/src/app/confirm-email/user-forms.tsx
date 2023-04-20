"use client";
import { useRouter } from "next/navigation";

import { api } from "~/api/";
import { Form, FormButton } from "~/components/forms";
import { User } from "~/api/user";
import { InputLabel, InputText } from "~/components/inputs";
import { useInterval } from "~/hooks/use-interval";
import { useToast } from "~/hooks/use-toast";

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
					await api.user
						.resendConfirmEmail(user.id)
						.then(() => {
							toasts.add({
								type: "success",
								label: "Resent confirmation email"
							});

							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				<span className="text-xl">
					Please check your email address, <span className="font-semibold">{user.email}</span>, for
					a confirmation link to activate your account. If you don&apos;t see it in your inbox,
					please check your spam folder!
				</span>
				<FormButton>Resend confirmation email</FormButton>
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
					await api.user
						.updateEmail(user.id, { body })
						.then(() => {
							toasts.add({
								type: "success",
								label: "Email changed successfully"
							});

							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				{({ FormField }) => (
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="font-montserrat text-xl font-semibold">Wrong email address?</h1>
							<h2 className="text-lg">
								If you provided the wrong address, or if you&apos;d like to try a different email,
								you can enter a new address below:
							</h2>
						</div>
						<FormField name="email">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>New email address</InputLabel>
									<InputText {...field.props} autoComplete="email" type="email" />
								</>
							)}
						</FormField>
						<FormField name="emailConfirmation">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>Confirm email address</InputLabel>
									<InputText {...field.props} autoComplete="off" type="email" />
								</>
							)}
						</FormField>
						<FormField name="currentPassword">
							{(field) => (
								<>
									<InputLabel {...field.labelProps}>Confirm current password</InputLabel>
									<InputText {...field.props} autoComplete="current-password" type="password" />
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
