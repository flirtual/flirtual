import { redirect } from "next/navigation";
import { unstable_serialize } from "swr";

import { Matchmaking, ProspectKind } from "~/api/matchmaking";
import { urls } from "~/urls";
import { queueKey } from "~/hooks/use-queue";
import { SWRConfig } from "~/components/swr";
import { User } from "~/api/user";
import { userKey } from "~/hooks/use-user";
import { Attribute } from "~/api/attributes";
import { attributeKey } from "~/hooks/use-attribute";

import { profileRequiredAttributes } from "../[slug]/data";

import { Queue } from "./queue";

interface BrowsePageProps {
	searchParams: { kind?: string };
}

export async function generateMetadata({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	return {
		title: kind === "friend" ? "Homie Mode" : "Browse"
	};
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	const [queue, attributes] = await Promise.all([
		Matchmaking.queue(kind),
		Promise.all(
			profileRequiredAttributes.map(
				async (type) => [type, await Attribute.list(type)] as const
			)
		)
	]);

	const users = Array.isArray(queue)
		? await Promise.all(queue.map((userId) => User.get(userId)))
		: [];

	return (
		<SWRConfig
			value={{
				fallback: {
					[unstable_serialize(queueKey(kind))]: queue,
					...Object.fromEntries(
						users
							.filter(Boolean)
							.map((user) => [unstable_serialize(userKey(user.id)), user])
					),
					...Object.fromEntries(
						attributes.map(([type, attribute]) => [
							unstable_serialize(attributeKey(type)),
							attribute
						])
					)
				}
			}}
		>
			<Queue kind={kind} />
		</SWRConfig>
	);
}
