"use client";

import { useRouter } from "next/navigation";

import { Subscription } from "~/api/subscription";
import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import {
	Form,
	FormAlternativeActionLink,
	FormButton
} from "~/components/forms";
import { ModelCard } from "~/components/model-card";
import { useTranslations } from "~/hooks/use-internationalization";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

export const ActivationForm: React.FC<{ user: User }> = ({ user }) => {
	const router = useRouter();
	const toasts = useToast();
	const t = useTranslations();

	const deactivated = !!user.deactivatedAt;

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t(deactivated ? "reactivate_account" : "deactivate_account")}
		>
			<Form
				className="flex flex-col gap-8"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					await (
						deactivated ? User.reactivate(user.id) : User.deactivate(user.id)
					).then(() =>
						toasts.add(t(deactivated ? "reactivated_account" : "deactivated_account"))
					);
					router.refresh();
				}}
			>
				{() => (
					<>
						{deactivated && user.subscription?.active && (
							<div className="mb-8 flex flex-col items-start gap-2">
								<p>
									⚠️
									{" "}
									{t("trite_awful_marten_lend")}
								</p>
								<ButtonLink
									href={Subscription.manageUrl()}
									kind="secondary"
									size="sm"
									target="_self"
								>
									{t("manage_subscription")}
								</ButtonLink>
							</div>
						)}
						<span>
							{deactivated
								? t("smart_bland_husky_scold")
								: t("less_drab_larva_assure")}
						</span>
						<div className="flex flex-col gap-4">
							<FormButton>
								{t(deactivated ? "reactivate_account" : "deactivate_account")}
							</FormButton>
							<FormAlternativeActionLink href={urls.settings.deleteAccount}>
								{t("low_slow_platypus_taste")}
							</FormAlternativeActionLink>
						</div>
					</>
				)}
			</Form>
		</ModelCard>
	);
};
