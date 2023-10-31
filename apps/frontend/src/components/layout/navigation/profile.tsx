"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
	Download,
	LineChart,
	Search,
	Settings,
	ShieldAlert,
	Sparkles,
	VenetianMask
} from "lucide-react";

import { api } from "~/api";
import { DiscordOutlineIcon } from "~/components/icons";
import { UserAvatar } from "~/components/user-avatar";
import { useClickOutside } from "~/hooks/use-click-outside";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useLocation } from "~/hooks/use-location";
import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { useSession } from "~/hooks/use-session";
import { toAbsoluteUrl, urlEqual, urls } from "~/urls";
import { useCanny } from "~/hooks/use-canny";

import { ProfileNavigationCannyButton } from "../canny-button";

type ProfileNavigationItemProps = React.PropsWithChildren<
	{ className?: string } & (
		| { href: string }
		| { onClick: (event: React.MouseEvent<HTMLButtonElement>) => void }
	)
>;

const ProfileNavigationItem: React.FC<ProfileNavigationItemProps> = (props) => {
	const className = twMerge(
		"flex w-full items-center gap-5 py-2 text-left font-montserrat text-lg font-semibold hover:text-theme-2",
		props.className
	);

	return "href" in props ? (
		<Link {...props} className={className} />
	) : (
		<button {...props} className={className} type="button" />
	);
};

export const ProfileNavigation: React.FC<{ href: string }> = (props) => {
	const [session, mutateSession] = useSession();
	const [visible, setVisible] = useState(false);
	const elementReference = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const active = urlEqual(toAbsoluteUrl(props.href), location);
	const { loadChangelog } = useCanny();

	useClickOutside(elementReference, () => setVisible(false), visible);
	useGlobalEventListener(
		"document",
		"scroll",
		() => setVisible(false),
		visible
	);

	useEffect(() => {
		if (visible) loadChangelog();
		else if (typeof window.Canny === "function") window.Canny("closeChangelog");
	}, [loadChangelog, visible]);

	const isDesktop = useScreenBreakpoint("md");

	if (!session) return null;
	const { user } = session;

	return (
		<div className="relative aspect-square shrink-0 select-none">
			<button
				id="profile-dropdown-button"
				type="button"
				className={twMerge(
					"group rounded-full p-1 transition-all",
					active
						? "bg-white-20 shadow-brand-1"
						: "bg-transparent hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1"
				)}
				onClick={() => {
					setVisible(true);
				}}
			>
				<UserAvatar
					priority
					className="h-10 w-10 rounded-full transition-transform"
					height={64}
					user={user}
					width={64}
				/>
			</button>
			<AnimatePresence>
				{visible && (
					<motion.div
						animate={{ opacity: 1 }}
						className="absolute -left-2 bottom-[calc((env(safe-area-inset-bottom)+0.5em)*-1)] z-10 flex w-44 select-none flex-col-reverse overflow-hidden rounded-3xl rounded-b-none bg-white-10 p-4 pb-[calc(env(safe-area-inset-bottom)+1.15rem)] pt-3 text-black-80 shadow-brand-1 sm:-top-2 sm:bottom-inherit sm:flex-col sm:rounded-3xl sm:pb-3 sm:pt-4"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						ref={elementReference}
					>
						<Link
							className="group flex shrink-0 items-center gap-2 hover:text-theme-2"
							href={urls.user.me}
						>
							<UserAvatar
								className="mt-2 h-8 w-8 scale-125 rounded-full transition-transform group-hocus:brightness-90 sm:mb-2 sm:mt-0"
								height={128}
								user={user}
								width={128}
							/>
							<span className="pb-1 pl-2 pt-2 font-montserrat text-lg font-semibold sm:pb-2 sm:pt-1">
								Profile
							</span>
						</Link>
						<div className="flex flex-col-reverse px-1 sm:flex-col">
							<ProfileNavigationItem
								href={
									isDesktop ? urls.settings.matchmaking() : urls.settings.list()
								}
							>
								<Settings className="h-6 w-6" />
								Settings
							</ProfileNavigationItem>
							<ProfileNavigationItem href={urls.subscription.default}>
								<Sparkles className="h-6 w-6" />
								Premium
							</ProfileNavigationItem>
							<ProfileNavigationCannyButton />
							<ProfileNavigationItem href={urls.socials.discord}>
								<DiscordOutlineIcon className="h-6 w-6" />
								Discord
							</ProfileNavigationItem>
							<ProfileNavigationItem
								className="native:hidden"
								href={urls.resources.download}
							>
								<Download className="h-6 w-6" />
								Get app
							</ProfileNavigationItem>
							{user.tags?.includes("moderator") && (
								<>
									<hr className="my-2 w-full border-t-2 border-white-40" />
									<ProfileNavigationItem href={urls.moderation.reports()}>
										<ShieldAlert className="h-6 w-6" />
										Reports
									</ProfileNavigationItem>
									<ProfileNavigationItem href={urls.moderation.search}>
										<Search className="h-6 w-6" />
										Search
									</ProfileNavigationItem>
								</>
							)}
							{user.tags?.includes("admin") && (
								<>
									<ProfileNavigationItem href={urls.admin.stats}>
										<LineChart className="h-6 w-6" />
										Stats
									</ProfileNavigationItem>
								</>
							)}
							{session.sudoerId && (
								<ProfileNavigationItem
									onClick={async () => {
										const session = await api.auth.revokeSudo();
										await mutateSession(session);
									}}
								>
									<VenetianMask className="h-6 w-6" />
									Unsudo
								</ProfileNavigationItem>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
