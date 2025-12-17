import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Authentication } from "~/api/auth";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { invalidate, mutate, sessionKey, useMutation } from "~/query";

import { next } from "./form";

export const MagicLogin: React.FC<{ token: string; onInvalid: () => void }> = ({ token, onInvalid }) => {
	const { t } = useTranslation();
	const toasts = useToast();
	const navigate = useNavigate();

	const { mutate: magicLogin } = useMutation({
		mutationKey: ["magic-login", token],
		mutationFn: () => Authentication.magicLogin(token),
		onSuccess: async (value) => {
			if ("error" in value) {
				// Silently proceed to regular login for invalid/expired tokens
				if (value.error !== "invalid_token") {
					toasts.addError(t(`errors.${value.error}` as any));
				}
				onInvalid();
				return;
			}

			await invalidate({ refetchType: "none" });
			await mutate(sessionKey(), value);
			await navigate(next());
		},
		onError: () => {
			onInvalid();
		}
	});

	useEffect(() => {
		magicLogin();
	}, [magicLogin]);

	return (
		<div className="flex flex-col items-center justify-center gap-4 py-8">
			<Loader2 className="size-8 animate-spin" />
			<span className="text-black-50 dark:text-white-50">{t("logging_in")}</span>
		</div>
	);
};
