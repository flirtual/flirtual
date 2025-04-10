import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { Matchmaking, ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { SWRConfig } from "~/components/swr";
import { redirect } from "~/i18n/navigation";
import { attributeKey, queueKey, relationshipKey, userKey } from "~/swr";
import { urls } from "~/urls";

import { profileRequiredAttributes } from "../[slug]/data";
import { Queue } from "./queue";

interface BrowsePageProps {
	searchParams: Promise<{ kind?: ProspectKind }>;
	params: Promise<{ locale: string }>;
}

export async function generateMetadata({ searchParams }: BrowsePageProps) {
	const { kind = "love" } = (await searchParams) || {};

	const t = await getTranslations();

	return {
		title: kind === "friend" ? t("homie_mode") : t("browse")
	};
}

export default async function BrowsePage({ params, searchParams }: BrowsePageProps) {
	const { locale } = await params;

	const { kind = "love" } = (await searchParams) || {};
	if (!ProspectKind.includes(kind)) return redirect({ href: urls.browse(), locale });

	// const queue = await Matchmaking.queue(kind);

	return (
		/*<SWRConfig
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
		>*/
		<Queue kind={kind} />
		/*</SWRConfig>*/
	);
}
