import { api } from "~/api";
import { thruServerCookies } from "~/server-utilities";

import { ProspectList } from "./prospect-list";

export default async function BrowsePage() {
	const prospectIds = await api.prospects.list(thruServerCookies());
	const prospects = (await api.user.bulk(prospectIds, thruServerCookies())).sort(
		// Maintain sort order, highest scored prospects first, then less as it goes on.
		(a, b) => prospectIds.indexOf(a.id) - prospectIds.indexOf(b.id)
	);

	return <ProspectList prospects={prospects} />;
}
