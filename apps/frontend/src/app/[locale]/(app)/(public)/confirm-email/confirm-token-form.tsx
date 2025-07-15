"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import useMutation from "swr/mutation";

import { User } from "~/api/user";
import { useToast } from "~/hooks/use-toast";
import { useRouter } from "~/i18n/navigation";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

import { LoadingIndicator } from "../../loading-indicator";

export const ConfirmTokenForm: React.FC<{ token: string }> = ({ token }) => {
	const toasts = useToast();
	const router = useRouter();
	const { t } = useTranslation();

	const { trigger } = useMutation(
		"confirm-email",
		(_, { arg: token }: { arg: string }) => User.confirmEmail(token),
		{
			onError: () => {
				router.push(urls.confirmEmail());

				toasts.add({
					type: "error",
					value: t("dizzy_fair_goat_propel"),
					duration: "short"
				});
			},
			onSuccess: async () => {
				toasts.add(t("royal_home_leopard_tickle"));

				await invalidate({ queryKey: sessionKey() });
				router.push(urls.default);
			}
		}
	);

	useEffect(() => void trigger(token), [trigger, token]);
	return <LoadingIndicator className="absolute inset-0" />;
};
