"use client";

import { useLocale, useTranslations } from "next-intl";

import type { Session } from "~/api/auth";
import { User } from "~/api/user";
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

export const DeactivationForm: React.FC = () => {
	const { user } = useSession();

	const t = useTranslations();
	const locale = useLocale();

	const toasts = useToast();

	if (user.deactivatedAt)
		redirect({ href: urls.settings.reactivateAccount, locale });

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("deactivate_account")}
		>
			<Form
				className="flex flex-col gap-8"
				fields={{}}
				requireChange={false}
				onSubmit={async () => {
					const newUser = await User.deactivate(user.id);
					await mutate<Session>(
						sessionKey(),
						(session) => session
							? { ...session, user: newUser }
							: session
					);

					toasts.add(t("deactivated_account"));
				}}
			>
				{() => (
					<>
						<span>
							{t("less_drab_larva_assure")}
						</span>
						<div className="flex flex-col gap-4">
							<FormButton>
								{t("deactivate_account")}
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
