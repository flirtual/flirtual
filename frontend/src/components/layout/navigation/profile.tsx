import {
	ShieldExclamationIcon,
	BugAntIcon,
	CommandLineIcon,
	LinkIcon
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import { IconComponent } from "~/components/icons";
import { UserAvatar } from "~/components/user-avatar";
import { useClickOutside } from "~/hooks/use-click-outside";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

type ProfileNavigationItemProps = React.PropsWithChildren<
	{ className?: string } & (
		| { href: string }
		| { onClick: (event: React.MouseEvent<HTMLButtonElement>) => void }
	)
>;

const ProfileNavigationItem: React.FC<ProfileNavigationItemProps> = (props) => {
	const className = twMerge("w-full text-left font-montserrat font-semibold", props.className);

	return "href" in props ? (
		<Link {...props} className={className} />
	) : (
		<button {...props} className={className} type="button" />
	);
};

const ProfileNavigationItemDivider: React.FC<{ Icon?: IconComponent }> = ({ Icon }) => {
	return (
		<div className="relative flex items-center gap-4">
			{Icon && <Icon className="absolute -left-10 h-5 w-5 shrink-0" />}
			<hr className="w-full border-t-2 border-white-40" />
		</div>
	);
};

export const ProfileNavigation: React.FC = () => {
	const [session, mutateSession] = useSession();
	const [visible, setVisible] = useState(false);
	const elementRef = useRef<HTMLDivElement>(null);

	useClickOutside(elementRef, () => setVisible(false), visible);
	useGlobalEventListener("document", "scroll", () => setVisible(false), visible);

	if (!session) return null;
	const { user } = session;

	return (
		<div className="relative aspect-square shrink-0">
			<button
				className="group rounded-full bg-transparent p-1 transition-all hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1"
				type="button"
				onClick={() => setVisible(true)}
			>
				<UserAvatar className="h-10 w-10 transition-transform" user={user} />
			</button>
			<AnimatePresence>
				{visible && (
					<motion.div
						animate={{ opacity: 1 }}
						className="absolute -bottom-1 -left-2 flex w-64 flex-col-reverse overflow-hidden rounded-3xl rounded-b-none bg-white-10 p-4 text-black-80 shadow-brand-1 sm:bottom-inherit sm:-top-2 sm:flex-col sm:rounded-3xl"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						ref={elementRef}
					>
						<Link className="group flex shrink-0 items-center gap-2" href={urls.user.me}>
							<div className="relative flex w-fit shrink-0 items-center justify-center">
								<UserAvatar
									className="h-8 w-8 scale-125 transition-transform group-hocus:brightness-90"
									user={user}
								/>
								<LinkIcon className="absolute h-5 w-5 scale-0 text-white-10 transition-transform group-hocus:scale-100" />
							</div>
							<span className="ml-2 font-montserrat font-semibold">Profile</span>
						</Link>
						<div className="flex flex-col-reverse gap-2 p-2 pl-12 sm:flex-col">
							<ProfileNavigationItem href={urls.subscription}>Premium</ProfileNavigationItem>
							<ProfileNavigationItem href={urls.settings.list()}>Settings</ProfileNavigationItem>
							<ProfileNavigationItem href={urls.resources.download}>Get app</ProfileNavigationItem>
							{user.tags.includes("moderator") && (
								<>
									<ProfileNavigationItemDivider Icon={ShieldExclamationIcon} />
									<ProfileNavigationItem href={urls.moderation.reports}>
										Reports
									</ProfileNavigationItem>
									<ProfileNavigationItem href={urls.moderation.reports}>
										Lookup
									</ProfileNavigationItem>
								</>
							)}
							{user.tags.includes("admin") && (
								<>
									<ProfileNavigationItemDivider Icon={CommandLineIcon} />
									<ProfileNavigationItem href={urls.moderation.reports}>
										Statistics
									</ProfileNavigationItem>
									{session.sudoerId && (
										<ProfileNavigationItem
											onClick={async () => {
												const session = await api.auth.revokeSudo();
												await mutateSession(session);
											}}
										>
											Revoke Sudo
										</ProfileNavigationItem>
									)}
								</>
							)}
							{user.tags.includes("debugger") && (
								<>
									<ProfileNavigationItemDivider Icon={BugAntIcon} />
									<ProfileNavigationItem href={urls.debugger.default}>
										Console
									</ProfileNavigationItem>
								</>
							)}
							<ProfileNavigationItemDivider />
							<ProfileNavigationItem onClick={() => api.auth.logout()}>
								Logout
							</ProfileNavigationItem>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
