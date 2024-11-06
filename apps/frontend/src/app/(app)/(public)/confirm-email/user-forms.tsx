"use client";

import { useRouter } from "next/navigation";

import { User } from "~/api/user";
import { CopyClick } from "~/components/copy-click";
import { Form, FormButton } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const UserForms: React.FC = () => {
	const router = useRouter();
	const toasts = useToast();
	const [session] = useSession({
		refreshInterval: 1000
	});

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
						<CopyClick value={session.user.email}>
							<span data-mask className="select-all font-semibold">
								{session.user.email}
							</span>
						</CopyClick>
						) for your account confirmation link. If you don&apos;t see it in
						your inbox, check your spam/trash folders.
					</span>
				</div>
				<FormButton>Send again</FormButton>
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
