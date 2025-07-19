import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ConversationAside } from "./aside";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("matches")
	};
}

export default function ConversationListPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <ConversationAside />;
}
