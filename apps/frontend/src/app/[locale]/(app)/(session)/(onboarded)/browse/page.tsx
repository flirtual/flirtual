import { getTranslations } from "next-intl/server";

import { ProspectKind } from "~/api/matchmaking";

import { Queue } from "./queue";

interface BrowsePageProps {
	searchParams: Promise<{ kind?: ProspectKind }>;
}

export async function generateMetadata({ searchParams }: BrowsePageProps) {
	const { kind = "love" } = (await searchParams) || {};

	const t = await getTranslations();

	return {
		title: kind === "friend" ? t("homie_mode") : t("browse")
	};
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
	let { kind = "love" } = (await searchParams) || {};
	if (!ProspectKind.includes(kind)) kind = "love";

	// const queue = await Matchmaking.queue(kind);

	return (
		/* <SWRConfig
			value={{
				fallback: {
					[unstable_serialize(queueKey(kind))]: queue,
					...Object.fromEntries(
						((Array.isArray(queue) ? queue : []).filter(Boolean) as Array<string>)
							.map((userId) => [
								[unstable_serialize(userKey(userId)), User.get(userId)],
								[unstable_serialize(relationshipKey(userId)), User.getRelationship(userId)]
							]).flat()
					),
					...Object.fromEntries(
						profileRequiredAttributes.map((type) => [
							unstable_serialize(attributeKey(type)),
							Attribute.list(type)
						])
					)
				}
			}}
		> */
		<Queue kind={kind} />
		/* </SWRConfig> */
	);
}
