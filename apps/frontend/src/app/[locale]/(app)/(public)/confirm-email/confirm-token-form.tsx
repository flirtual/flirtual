import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { User } from "~/api/user";
import { Loading } from "~/components/loading";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { invalidate, sessionKey, useMutation } from "~/query";
import { urls } from "~/urls";

export const ConfirmTokenForm: React.FC<{ token: string }> = ({ token }) => {
	const toasts = useToast();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { mutateAsync } = useMutation({
		mutationKey: sessionKey(),
		mutationFn: async (token: string) => {
			await User.confirmEmail(token);
		},
		onError: async () => {
			toasts.add({
				type: "error",
				value: t("dizzy_fair_goat_propel"),
				duration: "short"
			});

			await navigate(urls.confirmEmail());
		},
		onSuccess: async () => {
			toasts.add(t("royal_home_leopard_tickle"));

			await invalidate({ queryKey: sessionKey() });
			await navigate(urls.discover("dates"));
		}
	});

	useEffect(() => void mutateAsync(token), [mutateAsync, token]);
	return <Loading className="absolute inset-0" />;
};
