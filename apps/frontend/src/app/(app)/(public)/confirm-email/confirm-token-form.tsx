"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useMutation from "swr/mutation";

import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { useCurrentUser } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { userKey } from "~/swr";
import { urls } from "~/urls";

export const ConfirmTokenForm: React.FC<{ token: string }> = ({ token }) => {
	const toasts = useToast();
	const router = useRouter();

	const current = useCurrentUser();
	const { trigger, isMutating } = useMutation(
		current
			? userKey(current.id)
			: null,
		(_, { arg: token }: { arg: string }) => User.confirmEmail(token),
		{
			onError: toasts.addError,
			onSuccess: () => {
				toasts.add("Your email address has been confirmed successfully.");
				router.push(urls.default);
			}
		}
	);

	useEffect(() => {
		void trigger(token);
	}, [trigger, token]);

	const { emailConfirmedAt } = current ?? {};
	if (!current) return null;
	const Icon = emailConfirmedAt ? CheckCircle2 : AlertCircle;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-4">
				{!isMutating && <Icon className="mt-1 size-6 shrink-0" />}
				{isMutating
					? <span className="text-lg">Confirming...</span>
					: emailConfirmedAt
						? <span className="text-lg">Your email address has been confirmed successfully.</span>
						: (
								<span className="text-lg">
									Sorry, we couldn't confirm your email address. The link may have expired. Please
									{" "}
									<InlineLink href={urls.confirmEmail()}>try again</InlineLink>
									.
								</span>
							)}

			</div>
			{emailConfirmedAt && (
				<ButtonLink href={current ? urls.default : urls.login()}>
					Continue
				</ButtonLink>
			)}
		</div>
	);
};
