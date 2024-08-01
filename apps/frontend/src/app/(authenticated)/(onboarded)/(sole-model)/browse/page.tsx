import { redirect } from "next/navigation";

import { api } from "~/api";
import { thruServerCookies } from "~/server-utilities";
import { ProspectKind } from "~/api/matchmaking";
import { urls } from "~/urls";

import { ProspectList } from "./prospect-list";

interface BrowsePageProps {
	searchParams: { kind?: string };
}

export async function generateMetadata({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	return {
		title: kind === "friend" ? "Homie Mode" : "Browse"
	};
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	const { prospects, likesLeft, passesLeft } = await api.matchmaking.queue({
		...thruServerCookies(),
		query: {
			kind
		}
	});

	return (
		<ProspectList
			current={prospects[0]}
			kind={kind}
			likesLeft={prospects.length > 1 && likesLeft > 0}
			next={prospects[1]}
			passesLeft={prospects.length > 1 && passesLeft > 0}
		/>
	);
}
