import { unstable_serialize } from "swr";

import { api } from "~/api";
import { SWRConfig } from "~/components/swr";
import { thruServerCookies } from "~/server-utilities";

import { SearchView } from "./search-view";
import { defaultSearchOptions } from "./common";

export default async function SearchPage() {
	return (
		<SWRConfig
			value={{
				fallback: {
					[unstable_serialize(["users/search", "", defaultSearchOptions])]:
						await api.user.search(defaultSearchOptions, thruServerCookies())
				}
			}}
		>
			<SearchView />
		</SWRConfig>
	);
}
