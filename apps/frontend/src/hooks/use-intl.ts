import { useTranslations as useTranslationsBase } from "next-intl";

const variants = ["raw", "markup", "rich"] as const;

export const useTranslations = ((namespace) => {
	const t = useTranslationsBase(namespace);

	return t;
}) as typeof useTranslationsBase;
