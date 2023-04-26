import { ButtonLink } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { thruServerCookies } from "~/server-utilities";
import { api } from "~/api";
import { urls } from "~/urls";
import { User } from "~/api/user";

export async function LikesYouButton({ user }: { user: User }) {
	const likes = await api.matchmaking.listMatches({
		...thruServerCookies(),
		query: {
			unrequited: true
		}
	});

	return (
		<ButtonLink
			className="w-full"
			href={user.subscription?.active ? urls.likes : urls.subscription}
			size="sm"
		>
			See who likes you{" "}
			<span className="whitespace-nowrap">
				{likes.count.love && (
					<>
						({likes.count.love > 99 ? "99+" : likes.count.love}
						<HeartIcon className="inline h-4" gradient={false} />)
					</>
				)}{" "}
				{likes.count.friend && (
					<>
						({likes.count.friend > 99 ? "99+" : likes.count.friend}
						<PeaceIcon className="inline h-4" gradient={false} />)
					</>
				)}
			</span>
		</ButtonLink>
	);
}
