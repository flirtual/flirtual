"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/urls";

export interface ConfirmEmailPageProps {
	params: { to?: string };
}

export default function ConfirmEmailPage({ params }: ConfirmEmailPageProps) {
	const { data: user, mutate: mutateUser } = useCurrentUser({ refreshInterval: 5000 });
	const router = useRouter();

	if (!user) return null;

	if (user.emailConfirmedAt) {
		router.push(params.to ?? urls.user(user.username));
		return null;
	}

	return (
		<ModelCard title="Confirm email">
			<Form
				className="flex flex-col gap-4"
				fields={{}}
				onSubmit={async () => {
					console.log("a");
				}}
			>
				<span className="text-xl">
					Please check your email address, <span className="font-semibold">{user.email}</span>, for
					a confirmation link to activate your account. If you don&apos;t see it in your inbox,
					please check your spam folder!
				</span>
				<Button type="submit">Resend confirmation email</Button>
			</Form>
			<Form
				className="mt-8"
				requireChange={["email", "emailConfirmation", "currentPassword"]}
				fields={{
					email: user.email,
					emailConfirmation: "",
					currentPassword: ""
				}}
				onSubmit={async (values) => {
					await mutateUser(api.user.updateEmail(user.id, values));
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
		</ModelCard>
	);
}
