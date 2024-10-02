"use client";

import { useRouter } from "next/navigation";

import { ButtonLink } from "~/components/button";
import {
	Form,
	FormAlternativeActionLink,
	FormButton
} from "~/components/forms";
import { ModelCard } from "~/components/model-card";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";
import { User } from "~/api/user";
import { Subscription } from "~/api/subscription";

export const ActivationForm: React.FC<{ user: User }> = ({ user }) => {
	const router = useRouter();
	const toasts = useToast();

	const deactivated = !!user.deactivatedAt;

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={deactivated ? "Reactivate account" : "Deactivate account"}
		>
			<Form
				className="flex flex-col gap-8"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					await (
						deactivated ? User.reactivate(user.id) : User.deactivate(user.id)
					).then(() =>
						toasts.add(`${deactivated ? "Reactivated" : "Deactivated"} account`)
					);
					router.refresh();
				}}
			>
				{() => (
					<>
						{deactivated && user.subscription?.active && (
							<div className="mb-8 flex flex-col items-start gap-2">
								<p>
									⚠️ Your Premium subscription is still active while your
									account is deactivated and will be renewed automatically.
								</p>
								<ButtonLink
									href={Subscription.manageUrl()}
									kind="secondary"
									size="sm"
									target="_self"
								>
									Manage subscription
								</ButtonLink>
							</div>
						)}
						<span className="select-none">
							{deactivated
								? "This will make your profile visible to other people again."
								: "This will temporarily remove you from matchmaking and hide your profile from other people until you come back here and reactivate your account."}
						</span>
						<div className="flex flex-col gap-4">
							<FormButton>
								{deactivated ? "Reactivate account" : "Deactivate account"}
							</FormButton>
							<FormAlternativeActionLink href={urls.settings.deleteAccount}>
								Permanently delete your account instead?
							</FormAlternativeActionLink>
						</div>
					</>
				)}
			</Form>
		</ModelCard>
	);
};
