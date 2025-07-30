import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import useMutation from "swr/mutation";

import { User } from "~/api/user";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

import { LoadingIndicator } from "../../loading-indicator";

export const ConfirmTokenForm: React.FC<{ token: string }> = ({ token }) => {
	const toasts = useToast();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { trigger } = useMutation(
		"confirm-email",
		(_, { arg: token }: { arg: string }) => User.confirmEmail(token),
		{
			onError: () => {
				navigate(urls.confirmEmail());

				toasts.add({
					type: "error",
					value: t("dizzy_fair_goat_propel"),
					duration: "short"
				});
			},
			onSuccess: async () => {
				toasts.add(t("royal_home_leopard_tickle"));

				await invalidate({ queryKey: sessionKey() });
				navigate(urls.default);
			}
		}
	);

	useEffect(() => void trigger(token), [trigger, token]);
	return <LoadingIndicator className="absolute inset-0" />;
};
