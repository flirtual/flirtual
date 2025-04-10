import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ConversationAside } from "./aside";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("matches")
	};
}

export default async function ConversationListPage() {
	return <ConversationAside />;
}
