import { api } from "~/api";
import { thruServerCookies } from "~/server-utilities";

export async function withConversations() {
	return api.conversations.list(thruServerCookies()).then(async (conversations) => {
		const userIds = conversations.map((conversation) => conversation.userId);
		const users = await api.user.bulk({ ...thruServerCookies(), body: userIds });

		return conversations.map((conversation) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const user = users.find((user) => user.id === conversation.userId)!;
			return { ...conversation, user };
		});
	});
}
