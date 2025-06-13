"use client";

import { useLocale, useTranslations } from "next-intl";

import type { Session } from "~/api/auth";
import { Subscription } from "~/api/subscription";
import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import {
	Form,
	FormAlternativeActionLink,
	FormButton
} from "~/components/forms";
import { ModelCard } from "~/components/model-card";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { redirect } from "~/i18n/navigation";
import { mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

export const ReactivationForm: React.FC = () => {
	const { user } = useSession();

	const t = useTranslations();
	const locale = useLocale();

	const toasts = useToast();

	if (!user.deactivatedAt)
		redirect({ href: urls.settings.deactivateAccount, locale });

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("reactivate_account")}
		>
			<Form
				className="flex flex-col gap-8"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					const newUser = await User.reactivate(user.id);
					await mutate<Session>(
						sessionKey(),
						(session) => session
							? { ...session, user: newUser }
							: session
					);

					toasts.add(t("reactivated_account"));
				}}
			>
				{() => (
					<>
						{user.subscription?.active && (
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
							{t("smart_bland_husky_scold")}
						</span>
						<div className="flex flex-col gap-4">
							<FormButton>
								{t("reactivate_account")}
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
