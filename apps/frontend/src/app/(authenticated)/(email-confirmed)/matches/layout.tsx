// eslint-disable-next-line import/named
import { PropsWithChildren, cache } from "react";

import { withConversations } from "./data.server";
import { LikesYouButton } from "./likes-you-button";

import { ButtonLink } from "~/components/button";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { MobileBarNavigation } from "~/components/layout/navigation/mobile-bar";
import { ModelCard } from "~/components/model-card";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";
import { api } from "~/api";
import { fromEntries } from "~/utilities";
import { SWRConfig } from "~/components/swr";
import { SoleModelLayout } from "~/components/layout/sole-model";

const withConversationUsers = cache(async (...userIds: Array<string>) => {
	return (await api.user.bulk({ ...thruServerCookies(), body: userIds })).filter(Boolean);
});

export default async function ConversationsLayout({ children }: PropsWithChildren) {
	const session = await withSession();

	const { data: conversations, metadata } = await withConversations();
	const users = await withConversationUsers(...conversations.map(({ userId }) => userId));

	return (
		<SWRConfig
			value={{
				fallback: {
					...fromEntries(users.map((user) => [`user/${user.id}`, user])),
					// HACK: This is a hack to make the SWR cache work with the server-side rendered
					// conversations. The server-side rendered conversations are not in the cache, so
					// we need to add them to the cache.
					// BLOCKER: https://github.com/vercel/swr/issues/2594
					[`$inf$@"conversations",null,`]: [{ data: conversations, metadata }]
				}
			}}
		>
			{conversations.length === 0 ? (
				<SoleModelLayout footer={{ desktopOnly: true }}>
					<ModelCard
						className="sm:max-w-xl"
						containerProps={{ className: "gap-8" }}
						title="No matches"
					>
						<h1 className="text-2xl font-semibold">You haven&apos;t matched with anyone yet</h1>
						<p>
							If you and someone else both like or homie each other (it&apos;s mutual), then you
							will match! After you match, you can message each other on Flirtual and meet up in VR.
						</p>
						<div className="grid gap-4 sm:grid-cols-2">
							<ButtonLink href={urls.browse()} size="sm">
								Browse
							</ButtonLink>
							<LikesYouButton />
						</div>
					</ModelCard>
				</SoleModelLayout>
			) : (
				<div className="flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col">
					<Header />
					<div className="flex w-full max-w-screen-lg grow flex-col sm:flex-row md:mt-16 md:px-8">
						{children}
					</div>
					<Footer desktopOnly />
					<MobileBarNavigation />
				</div>
			)}
		</SWRConfig>
	);
}
