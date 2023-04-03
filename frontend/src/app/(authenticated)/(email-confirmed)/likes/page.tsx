import { api } from "~/api";
import { displayName } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { thruServerCookies } from "~/server-utilities";
import { urls } from "~/urls";

export default async function LikesPage() {
	const result = await api.matchmaking.listMatches({
		...thruServerCookies(),
		query: { unrequited: true }
	});

	const users = await api.user.bulk({
		...thruServerCookies(),
		body: result.items.map((item) => item.profileId)
	});

	const items = result.items.map((item) => ({
		...item,
		user: users.find((user) => user.id === item.profileId)!
	}));

	return (
		<SoleModelLayout>
			<ModelCard title="Likes">
				<ButtonLink href={urls.conversations.list}>Matches</ButtonLink>
				{items.map((like) => (
					<div key={like.id}>{displayName(like.user)}</div>
				))}
				<span>aaaa</span>
			</ModelCard>
		</SoleModelLayout>
	);
}
