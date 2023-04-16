import { redirect } from "next/navigation";

import { api } from "~/api";
import { thruServerCookies } from "~/server-utilities";
import { ProspectKind } from "~/api/matchmaking";
import { urls } from "~/urls";

import { ProspectList } from "./prospect-list";

interface BrowsePageProps {
	searchParams: { kind?: string };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	const prospectIds = await api.matchmaking.listProspects({
		...thruServerCookies(),
		query: {
			kind
		}
	});

	const prospects = (
		await api.user.bulk({
			...thruServerCookies(),
			body: prospectIds
		})
	).sort(
		// Maintain sort order, highest scored prospects first, then less as it goes on.
		(a, b) => prospectIds.indexOf(a.id) - prospectIds.indexOf(b.id)
	);

	// @ts-expect-error: Server Component
	return <ProspectList kind={kind} prospects={prospects} />;
}
