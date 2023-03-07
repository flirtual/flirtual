"use client";

import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { Navigation } from "~/components/layout/navigation";
import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { ConversationChatbox, ConversationInbox } from "~/hooks/use-talkjs";
import { urls } from "~/urls";

export default function ConversationsLayout() {
	const userId = useSelectedLayoutSegment();
	const HeaderIcon = userId ? ChevronLeftIcon : XMarkIcon;

	const isDesktop = useScreenBreakpoint("md");

	return (
		<div className="flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col">
			<Header />
			<div className="flex w-full max-w-screen-lg grow flex-col md:flex-row md:px-8">
				<div className="flex h-full w-full shrink-0 grow-0 flex-col shadow-brand-1 md:w-96 md:bg-white-20 md:text-white-20 dark:md:bg-black-70">
					<div className="flex h-16 w-full items-center justify-center bg-black-70 p-4 text-white-20 md:bg-brand-gradient">
						<Link
							className="absolute left-4 flex shrink-0 md:hidden"
							href={userId ? urls.conversations.list : urls.browse()}
						>
							<HeaderIcon className="w-6" />
						</Link>
						<span className="font-montserrat text-xl font-semibold">Messages</span>
					</div>
					{(isDesktop || !userId) && (
						<ConversationInbox
							className="h-[calc(100vh_-_8rem)] w-full md:h-screen"
							options={{
								showFeedHeader: false,
								feedFilter: {
									custom: {
										banned: "!exists"
									}
								}
							}}
						/>
					)}
				</div>
				{userId && (
					<div className="flex h-full w-full flex-col items-center justify-center md:py-32 md:px-8">
						<ConversationChatbox
							className="h-[calc(100vh_-_8rem)] w-full md:h-[32rem]"
							userId={userId}
							options={{
								theme: isDesktop ? undefined : "mobile"
							}}
						/>
					</div>
				)}
			</div>
			<Footer desktopOnly />
			<Navigation />
		</div>
	);
}
