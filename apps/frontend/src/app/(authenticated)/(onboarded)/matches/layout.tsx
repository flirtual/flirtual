import { type PropsWithChildren, cache } from "react";
import * as swrInfinite from "swr/infinite";

import { ButtonLink } from "~/components/button";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
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
						className="desktop:max-w-xl"
						containerProps={{ className: "gap-4" }}
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
						<div className="flex flex-col gap-2">
							<ButtonLink href={urls.browse()}>Browse</ButtonLink>
							<LikesYouButton />
						</div>
					</ModelCard>
				</SoleModelLayout>
			) : (
				// eslint-disable-next-line tailwindcss/no-contradicting-classname
				<div className="flex min-h-dvh min-h-screen grow flex-col items-center bg-white-20 font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:dark:bg-black-80">
					<Header />
					<div className="flex w-full grow flex-col gap-8 desktop:flex-row desktop:justify-center desktop:p-8">
						{children}
					</div>
					<Footer desktopOnly />
					<Header mobile />
				</div>
			)}
		</SWRConfig>
	);
}
