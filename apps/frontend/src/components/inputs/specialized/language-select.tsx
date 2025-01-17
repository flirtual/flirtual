"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import useMutation from "swr/mutation";

import type { PreferenceLanguage } from "~/api/user/preferences";
import { PreferenceLanguages, Preferences } from "~/api/user/preferences";
import { useInternationalization, useTranslations } from "~/hooks/use-internationalization";
import { useLocation } from "~/hooks/use-location";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { sessionKey } from "~/swr";

import { InputSelect } from "../select";

export const InputLanguageSelect: React.FC<{ className?: string }> = ({ className }) => {
	const { locale: { current: language } } = useInternationalization();
	const toasts = useToast();
	const [session] = useSession();
	const router = useRouter();
	const location = useLocation();
	const t = useTranslations("errors");

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

	return (
		<InputSelect
			options={PreferenceLanguages.map((value) => ({
				id: value,
				name: {
					en: "English",
					de: "Deutsch",
					es: "Español",
					fr: "Français",
					ja: "日本語",
					ko: "한국어",
					nl: "Nederlands",
					pt: "Português",
					"pt-BR": "Português (Brasil)",
					ru: "Русский",
					sv: "Svenska"
				}[value] ?? value
			}))}
			className={className}
			Icon={Languages}
			value={language}
			onChange={(newLanguage) => trigger(newLanguage)}
		/>
	);
};
