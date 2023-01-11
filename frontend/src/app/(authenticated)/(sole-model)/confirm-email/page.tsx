"use client";

import {
	CheckCircleIcon,
	ExclamationCircleIcon,
	QuestionMarkCircleIcon
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/urls";

export const config = { runtime: "experimental-edge" };

export interface ConfirmEmailPageProps {
	searchParams: { to?: string; token?: string };
}

const ConfirmEmailMessage: React.FC<{ token: string }> = ({ token }) => {
	const { data: user, mutate: mutateUser } = useCurrentUser({ refreshInterval: 5000 });
	const [confirmSuccess, setConfirmSuccess] = useState<boolean | null>(null);

	useEffect(() => {
		if (user?.id && token) {
			void api.user
				.confirmEmail(user.id, token)
				.then(() => setConfirmSuccess(true))
				.catch(() => setConfirmSuccess(false));
		}
	}, [user?.id, token, mutateUser]);

	if (!user) return null;

	const Icon =
		confirmSuccess === null
			? QuestionMarkCircleIcon
			: confirmSuccess
			? CheckCircleIcon
			: ExclamationCircleIcon;

	return (
		<div className="flex gap-4">
			<Icon className="h-8 w-8 shrink-0" />
			<span className="text-xl">
				{confirmSuccess === null ? (
					<>
						Confirming your email address, <span className="font-semibold">{user.email}</span>
						...
					</>
				) : confirmSuccess ? (
					<>
						Thank you for confirming your email address,{" "}
						<span className="font-semibold">{user.email}</span>, you may now close this window.
					</>
				) : (
					<>
						We couldn&apos;t confirm your email address,{" "}
						<span className="font-semibold">{user.email}</span>, please try again later!
					</>
				)}
			</span>
		</div>
	);
};

export default function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
	const { data: user, mutate: mutateUser } = useCurrentUser({ refreshInterval: 5000 });
	const router = useRouter();

	if (!user) return null;

	if (user.emailConfirmedAt) {
		router.push(searchParams.to ?? urls.user(user.username));
		return null;
	}

	return (
		<ModelCard title="Confirm email">
			{searchParams.token ? (
				<ConfirmEmailMessage token={searchParams.token} />
			) : (
				<>
					<Form
						className="flex flex-col gap-4"
						fields={{}}
						requireChange={false}
						onSubmit={async () => {
							await api.user.resendConfirmEmail(user.id);
						}}
					>
						<span className="text-xl">
							Please check your email address, <span className="font-semibold">{user.email}</span>,
							for a confirmation link to activate your account. If you don&apos;t see it in your
							inbox, please check your spam folder!
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
						onSubmit={async (values) => {
							await mutateUser(api.user.updateEmail(user.id, values));
						}}
					>
						{({ FormField }) => (
							<div className="flex flex-col gap-4">
								<div>
									<h1 className="font-montserrat text-xl font-semibold">Wrong email address?</h1>
									<h2 className="text-lg">
										If you provided the wrong address, or if you&apos;d like to try a different
										email, you can enter a new address below:
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
			)}
		</ModelCard>
	);
}
