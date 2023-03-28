"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { useUnreadConversations } from "~/hooks/use-talkjs";
import { urls } from "~/urls";

export const NavigationIconButton: React.FC<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	React.ComponentProps<"a"> & { href: string; ref?: any }
> = ({ children, ...props }) => {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const active = pathname.startsWith(props.href) && searchParams.get("kind") == "love";

	return (
		<Link
			{...props}
			className={twMerge(
				"group shrink-0 rounded-full p-2 transition-colors focus:outline-none",
				active
					? "bg-white-20 text-black-70 shadow-brand-1"
					: "hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1",
				props.className
			)}
		>
			{children}
		</Link>
	);
};

export const ConversationListButton: React.FC = () => {
	const conversations = useUnreadConversations();

	return (
		<NavigationIconButton href={urls.conversations.list}>
			<div className="relative">
				<ChatBubbleLeftRightIcon className="w-8" strokeWidth={1.5} />
				{!!conversations.length && (
					<div className="absolute top-0 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:h-0 group-hocus:w-0 group-hocus:opacity-0">
						<span className="select-none font-mono text-sm font-semibold leading-none text-white-20">
							{conversations.length}
						</span>
					</div>
				)}
			</div>
		</NavigationIconButton>
	);
};
