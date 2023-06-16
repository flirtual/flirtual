"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	CheckCircleIcon,
	ExclamationCircleIcon,
	QuestionMarkCircleIcon
} from "@heroicons/react/24/solid";

import { api } from "~/api/";
import { Form, FormButton } from "~/components/forms";
import { useToast } from "~/hooks/use-toast";

export const ConfirmTokenForm: React.FC<{ token: string }> = ({ token }) => {
	const [confirmSuccess, setConfirmSuccess] = useState<boolean | null>(null);

	const router = useRouter();
	const toasts = useToast();

	if (confirmSuccess === null) {
		return (
			<Form
				className="flex flex-col gap-4"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					await api.user
						.confirmEmail({ body: { token } })
						.then(() => {
							toasts.add("Email changed successfully");

							setConfirmSuccess(true);
							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				{() => (
					<>
						<span className="text-xl">Please confirm your email address</span>
						<FormButton>Confirm</FormButton>
					</>
				)}
			</Form>
		);
	}

	const Icon =
		confirmSuccess === null
			? QuestionMarkCircleIcon
			: confirmSuccess
			? CheckCircleIcon
			: ExclamationCircleIcon;

	return (
		<>
			<div className="flex gap-4">
				<Icon className="h-8 w-8 shrink-0" />
				<span className="text-xl">
					{confirmSuccess
						? "Thank you for confirming your email address, you may now close this window."
						: "We couldn't confirm your email address, please try again later!"}
				</span>
			</div>
		</>
	);
};
