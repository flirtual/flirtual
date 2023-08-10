import { PropsWithChildren, cache } from "react";
import * as swrInfinite from "swr/infinite";

import { ButtonLink } from "~/components/button";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { MobileBarNavigation } from "~/components/layout/navigation/mobile-bar";
import { ModelCard } from "~/components/model-card";
import { thruServerCookies } from "~/server-utilities";
import { urls } from "~/urls";
import { api } from "~/api";
import { fromEntries } from "~/utilities";
import { SWRConfig } from "~/components/swr";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { getConversationsKey } from "~/hooks/use-conversations.shared";

import { LikesYouButton } from "./likes-you-button";
import { withConversations } from "./data.server";

const withConversationUsers = cache(async (...userIds: Array<string>) => {
	return (
		await api.user.bulk({ ...thruServerCookies(), body: userIds })
	).filter(Boolean);
});

export default async function ConversationsLayout({
	children
}: PropsWithChildren) {
	const { data: conversations, metadata } = await withConversations();
	const users = await withConversationUsers(
		...conversations.map(({ userId }) => userId)
	);

	return (
		<SWRConfig
			value={{
				fallback: {
					...fromEntries(users.map((user) => [`user/${user.id}`, user])),
					[swrInfinite.unstable_serialize(getConversationsKey)]: [
						{ data: conversations, metadata }
					]
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
						<h1 className="text-2xl font-semibold">
							You haven&apos;t matched with anyone yet
						</h1>
						<p>
							If you and someone else both like or homie each other (it&apos;s
							mutual), then you will match! After you match, you can message
							each other on Flirtual and meet up in VR.
						</p>
						<p>
							We prioritize showing you people that have liked or homied you,
							and showing your profile to people you have liked or homied, so
							you can match.
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
				<div className="flex min-h-[100dvh] grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col">
					<Header />
					<div className="flex w-full max-w-screen-lg grow flex-col md:mt-16 md:flex-row md:px-8">
						{children}
					</div>
					<Footer desktopOnly />
					<MobileBarNavigation />
				</div>
			)}
		</SWRConfig>
	);
}
