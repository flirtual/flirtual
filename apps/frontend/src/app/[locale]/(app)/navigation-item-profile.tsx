"use client";

import {
	Download,
	LineChart,
	Search,
	Settings,
	ShieldAlert,
	Sparkles,
	VenetianMask
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { type FC, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { Authentication } from "~/api/auth";
import { DiscordOutlineIcon } from "~/components/icons";
import { ProfileNavigationCannyButton } from "~/components/layout/canny-button";
import { Link } from "~/components/link";
import { UserAvatar } from "~/components/user-avatar";
import { closeChangelog, openChangelog } from "~/hooks/use-canny";
import { useClickOutside } from "~/hooks/use-click-outside";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useLocation } from "~/hooks/use-location";
import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { useSession } from "~/hooks/use-session";
import { useRouter } from "~/i18n/navigation";
import { toAbsoluteUrl, urlEqual, urls } from "~/urls";

type ProfileNavigationItemProps = React.PropsWithChildren<
	{ className?: string } & (
		| { href: string }
		| { onClick: (event: React.MouseEvent<HTMLButtonElement>) => void }
	)
>;

const ProfileNavigationItem: React.FC<ProfileNavigationItemProps> = (props) => {
	const className = twMerge(
		"flex w-full items-center gap-5 py-2 text-left font-montserrat text-lg font-semibold hover:text-theme-2",
		// eslint-disable-next-line react/prefer-destructuring-assignment
		props.className
	);

	return "href" in props
		? (
				<Link {...props} className={className} />
			)
		: (
				<button {...props} className={className} type="button" />
			);
};

export const NavigationItemProfile: FC = () => {
	const session = useSession();
	const { user } = session;

	const t = useTranslations();
	const router = useRouter();

	const [visible, setVisible] = useState(false);
	const elementReference = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const active = urlEqual(toAbsoluteUrl(urls.user.me), location);

	useClickOutside(elementReference, () => setVisible(false), visible);
	useGlobalEventListener(
		"document",
		"scroll",
		() => setVisible(false),
		visible
	);

	useEffect(() => {
		setVisible(false);
	}, [location]);

	useEffect(() => {
		if (visible) return void openChangelog();
		closeChangelog();
	}, [visible]);

	const isDesktop = useScreenBreakpoint("desktop");

	return (
		<div className="relative aspect-square shrink-0">
			<button
				className={twMerge(
					"group rounded-full p-1 transition-all",
					active
						? "bg-white-20 shadow-brand-1"
						: "bg-transparent hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1"
				)}
				id="profile-dropdown-button"
				type="button"
				onClick={() => setVisible(true)}
			>
				<UserAvatar
					priority
					className="size-10 rounded-full transition-transform"
					height={40}
					user={user}
					variant="icon"
					width={40}
				/>
			</button>
			<AnimatePresence>
				{visible && (
					<motion.div
						animate={{ opacity: 1 }}
						className="absolute -left-2 bottom-[calc((var(--safe-area-inset-bottom,0rem)+0.65em)*-1)] z-10 flex min-w-44 flex-col-reverse overflow-hidden rounded-t-2xl bg-white-10 p-4 pb-[calc(var(--safe-area-inset-bottom,0rem)+1.2rem)] pt-2.5 text-black-80 shadow-brand-1 ja:min-w-48 desktop:bottom-inherit desktop:top-[-0.4rem] desktop:flex-col desktop:rounded-2xl desktop:pb-3 desktop:pt-[0.9375rem]"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						ref={elementReference}
					>
						<Link
							className="group flex shrink-0 items-center gap-2 hover:text-theme-2"
							href={urls.profile(user)}
						>
							<UserAvatar
								className="group-hocus:brightness-90 mt-1.5 size-8 scale-125 rounded-full transition-transform desktop:mb-2 desktop:mt-0"
								height={40}
								user={user}
								variant="icon"
								width={40}
							/>
							<span className="whitespace-nowrap pb-1 pl-2 pt-2.5 font-montserrat text-lg font-semibold desktop:pb-2 desktop:pt-1">
								{t("profile")}
							</span>
						</Link>
						<div className="flex flex-col-reverse px-1 pt-1 desktop:flex-col desktop:pt-0">
							<ProfileNavigationItem href={isDesktop ? urls.settings.matchmaking() : urls.settings.list()}>
								<Settings className="size-6 shrink-0" />
								<span className="whitespace-nowrap">{t("settings")}</span>
							</ProfileNavigationItem>
							<ProfileNavigationItem href={urls.subscription.default}>
								<Sparkles className="size-6 shrink-0" />
								<span className="whitespace-nowrap">{t("premium")}</span>
							</ProfileNavigationItem>
							<ProfileNavigationCannyButton />
							<ProfileNavigationItem href={urls.socials.discord}>
								<DiscordOutlineIcon className="size-6 shrink-0" />
								<span className="whitespace-nowrap">{t("discord")}</span>
							</ProfileNavigationItem>
							<ProfileNavigationItem
								className="native:hidden vision:hidden"
								href={urls.resources.download}
							>
								<Download className="size-6 shrink-0" />
								<span className="whitespace-nowrap">{t("get_app")}</span>
							</ProfileNavigationItem>
							{user.tags?.includes("moderator") && (
								<>
									<hr className="my-2 w-full border-t-2 border-white-40" />
									<ProfileNavigationItem href={urls.moderation.reports()}>
										<ShieldAlert className="size-6 shrink-0" />
										<span className="whitespace-nowrap">{t("reports")}</span>
									</ProfileNavigationItem>
									<ProfileNavigationItem href={urls.moderation.search}>
										<Search className="size-6 shrink-0" />
										<span className="whitespace-nowrap">{t("search")}</span>
									</ProfileNavigationItem>
								</>
							)}
							{user.tags?.includes("admin") && (
								<ProfileNavigationItem href={urls.admin.stats}>
									<LineChart className="size-6 shrink-0" />
									<span className="whitespace-nowrap">{t("stats")}</span>
								</ProfileNavigationItem>
							)}
							{session.sudoerId && (
								<ProfileNavigationItem
									onClick={async () => {
										await Authentication.revokeImpersonate();
										router.refresh();
									}}
								>
									<VenetianMask className="size-6 shrink-0" />
									<span className="whitespace-nowrap">{t("unsudo")}</span>
								</ProfileNavigationItem>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
