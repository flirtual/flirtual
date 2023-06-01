// eslint-disable-next-line import/named
import { cache } from "react";

import { api } from "~/api";
import { thruServerCookies } from "~/server-utilities";

export const withConversations = cache((cursor?: string) => {
	return api.conversations.list({ ...thruServerCookies(), query: { cursor } });
});
