"use client";

import { Newspaper } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCanny } from "~/hooks/use-canny";

import { FooterListLink } from "./footer";

export const FooterCannyLink: React.FC = () => {
	const t = useTranslations();

	return (
		<FooterListLink label={t("feedback")} onClick={useCanny().openFeedback} />
	);
};

export const ProfileNavigationCannyButton: React.FC = () => {
	const t = useTranslations();
	const { openChangelog } = useCanny();

	return (
		<button
			data-canny-changelog
			className="flex w-full items-center gap-5 py-2 text-left font-montserrat text-lg font-semibold hover:text-theme-2"
			type="button"
			onClick={openChangelog}
		>
			<Newspaper className="size-6" />
			{t("updates")}
		</button>
	);
};
