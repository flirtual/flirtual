"use client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

export const ConfirmTokenForm: React.FC<{ token: string }> = ({ token }) => {
	const [confirmSuccess, setConfirmSuccess] = useState<boolean | null>(null);

	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();

	useEffect(() => {
		if (confirmSuccess) return;

		void User.confirmEmail(token)
			.then(() => {
				setConfirmSuccess(true);
				return setTimeout(
					() => router.push(session ? urls.default : urls.login()),
					1500
				);
			})
			.catch((reason) => {
				toasts.addError(reason);
				router.push(urls.confirmEmail());
			});
	});

	const Icon = confirmSuccess ? CheckCircle2 : AlertCircle;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-4">
				{confirmSuccess !== null && <Icon className="size-8 shrink-0" />}
				<span className="text-xl">
					{confirmSuccess === null
						? "Confirming..."
						: confirmSuccess
							? "Your email address has been confirmed successfully."
							: "Sorry, we couldn't confirm your email address. Please try again."}
				</span>
			</div>
			{confirmSuccess && (
				<ButtonLink href={session ? urls.default : urls.login()}>
					Continue
				</ButtonLink>
			)}
		</div>
	);
};
