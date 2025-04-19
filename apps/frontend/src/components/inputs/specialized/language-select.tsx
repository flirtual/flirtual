"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { mutate } from "~/query";
import useMutation from "swr/mutation";

import type { PreferenceLanguage } from "~/api/user/preferences";
import { Preferences } from "~/api/user/preferences";
import { useLocation } from "~/hooks/use-location";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { withSuspense } from "with-suspense";
import { useRouter } from "~/i18n/navigation";
import { locales } from "~/i18n/routing";
import { sessionKey } from "~/query";

import { InputSelect } from "../select";

const InputLanguageSelect_: React.FC<{ className?: string; tabIndex?: number }> = ({ className, tabIndex }) => {
	const locale = useLocale();
	const t = useTranslations("errors");

	const session = useOptionalSession();

	const toasts = useToast();
	const router = useRouter();
	const location = useLocation();

	const { trigger } = useMutation(
		"change-language",
		async (_, { arg: language }: { arg: PreferenceLanguage }) => {
			if (!session) {
				location.searchParams.set("language", language);
				router.push(location.href);
				return;
			}

			await Preferences.update(session.user.id, { language });
			if (location.searchParams.has("language")) {
				location.searchParams.delete("language");
				router.push(location.href);
			}
		},
		{
			onError: () => {
				toasts.add({
					type: "error",
					value: t("internal_server_error"),
					duration: "short"
				});
			},
			onSuccess: async () => {
				await mutate(sessionKey());
				router.refresh();
			}
		}
	);

	if (!session?.user.tags?.includes("debugger")) return null;

	return (
		<InputSelect
			options={locales.map((value) => ({
				id: value,
				name: {
					en: "English",
					// de: "Deutsch",
					// es: "Español",
					// fr: "Français",
					ja: "日本語"// ,
					// ko: "한국어",
					// nl: "Nederlands",
					// pt: "Português",
					// "pt-BR": "Português (Brasil)",
					// ru: "Русский",
					// sv: "Svenska"
				}[value] ?? value
			}))}
			className={className}
			Icon={Languages}
			tabIndex={tabIndex}
			value={locale}
			onChange={(newLanguage) => trigger(newLanguage)}
		/>
	);
};

export const InputLanguageSelect = withSuspense(InputLanguageSelect_);
