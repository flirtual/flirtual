

import { ConversationAside } from "./aside";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("matches")
	};
}

export default function ConversationListPage() {


	return <ConversationAside />;
}
