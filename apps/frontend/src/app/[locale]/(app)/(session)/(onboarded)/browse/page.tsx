import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { Matchmaking, ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { SWRConfig } from "~/components/swr";
import { attributeKey, queueKey, relationshipKey, userKey } from "~/swr";
import { urls } from "~/urls";

import { profileRequiredAttributes } from "../[slug]/data";
import { Queue } from "./queue";

interface BrowsePageProps {
	searchParams: Promise<{ kind?: ProspectKind }>;
}

export async function generateMetadata(props: BrowsePageProps) {
	const t = await getTranslations();

	const { kind = "love" } = (await props.searchParams) || {};
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	return {
		title: kind === "friend" ? t("homie_mode") : t("browse")
	};
}

export default async function BrowsePage(props: BrowsePageProps) {
	const { kind = "love" } = (await props.searchParams) || {};
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	const queue = await Matchmaking.queue(kind);

	return (
		<SWRConfig
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
		>
			<Queue kind={kind} />
		</SWRConfig>
	);
}
