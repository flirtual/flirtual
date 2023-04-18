import { api } from "~/api";
import { ButtonLink } from "~/components/button";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { MobileBarNavigation } from "~/components/layout/navigation/mobile-bar";
import { ModelCard } from "~/components/model-card";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";

import { ConversationList } from "./conversation-list";
import { BackButton } from "./back-button";

export default async function ConversationsLayout({ children }: { children: React.ReactNode }) {
	const session = await withSession();

	const conversations = await api.conversations.list(thruServerCookies());
	const conversationCount = conversations.length;

	const likes = await api.matchmaking.listMatches({
		...thruServerCookies(),
		query: { unrequited: true }
	});

	return (
		<div className="flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col">
			<Header />
			<ButtonLink
				className="m-4"
				href={session.user.subscription?.active ? urls.likes : urls.subscription}
			>
				See Who Likes You{" "}
				{likes.count.love && (likes.count.love > 99 ? "(99+❤️)" : ` (${likes.count.love}❤️)`)}
				{likes.count.friend && (likes.count.friend > 99 ? "(99+✌️)" : ` (${likes.count.friend}✌️)`)}
			</ButtonLink>
			{conversationCount === 0 ? (
				<div className="flex w-full max-w-screen-lg grow flex-col items-center justify-center md:px-8">
					<ModelCard
						className="sm:max-w-xl"
						containerProps={{ className: "gap-4" }}
						title="No matches"
					>
						<h1 className="text-2xl font-semibold">You haven&apos;t matched with anyone yet :(</h1>
						<p>
							If you and someone else both like or homie each other (it&apos;s mutual), then you
							will match! After you match, you can message each other on Flirtual and meet up in VR.
						</p>
						<ButtonLink href={urls.browse()}>Browse</ButtonLink>
					</ModelCard>
				</div>
			) : (
				<div className="flex w-full max-w-screen-lg grow flex-col md:flex-row md:px-8">
					<div className="flex h-full w-full shrink-0 grow-0 flex-col shadow-brand-1 md:w-96 md:rounded-t-xl md:bg-white-20 md:text-white-20 dark:md:bg-black-70">
						<div className="flex h-16 w-full items-center justify-center bg-black-70 p-4 text-white-20 md:rounded-t-xl md:bg-brand-gradient">
							<BackButton />
							<span className="font-montserrat text-xl font-semibold">Messages</span>
						</div>
						<ConversationList />
					</div>
					{children}
				</div>
			)}
			<Footer desktopOnly />
			<MobileBarNavigation />
		</div>
	);
}
