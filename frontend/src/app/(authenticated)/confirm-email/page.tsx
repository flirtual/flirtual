"use client";

import { redirect } from "next/navigation";

import { api } from "~/api";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { InputLabel, InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { useCurrentUser } from "~/hooks/use-current-user";

export interface ConfirmEmailPageProps {
	params: { to?: string };
}

export default function ConfirmEmailPage({ params }: ConfirmEmailPageProps) {
	const { data: user, mutate: mutateUser } = useCurrentUser({ refreshInterval: 5000 });
	if (!user) return null;

	if (user.emailConfirmedAt) redirect(params.to ?? `/${user.id}`);

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
				fields={{
					email: user.email
				}}
				onSubmit={async ({ email }) => {
					await api.user.updateEmail(user.id, email);
					await mutateUser()
				}}
			>
				{({ FormField, fields }) => (
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
									<InputLabel {...field.labelProps}>Email address</InputLabel>
									<InputText {...field.props} type="email" />
								</>
							)}
						</FormField>
						<Button disabled={!fields.email.changed} type="submit">
							Update email
						</Button>
					</div>
				)}
			</Form>
		</ModelCard>
	);
}
