"use client";

import { twMerge } from "tailwind-merge";
import { useSelectedLayoutSegment } from "next/navigation";
import {
	AtSign,
	Bell,
	Brain,
	Contact,
	EyeOff,
	Flame,
	KeyRound,
	LogOut,
	Paintbrush,
	PenSquare,
	Skull,
	SlidersHorizontal,
	Sparkles,
	Tag,
	Users
} from "lucide-react";

import { useFreshworks } from "~/hooks/use-freshworks";
import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";
import { gitCommitSha } from "~/const";
import { InlineLink } from "~/components/inline-link";

import { NavigationCategory } from "./navigation-category";
import { NavigationHeader } from "./navigation-header";
import { NavigationLink } from "./navigation-link";

import type { FC } from "react";

export const SettingsNavigation: FC = () => {
	const layoutSegment = useSelectedLayoutSegment();
	const { openFreshworks } = useFreshworks();
	const [, , logout] = useSession();

	return (
		<div className="sticky top-0 z-10 flex w-full shrink-0 grow-0 flex-col self-baseline desktop:relative desktop:w-80 desktop:rounded-2xl desktop:bg-brand-gradient desktop:text-white-20 desktop:shadow-brand-1">
			<NavigationHeader {...{ navigationInner: layoutSegment }} />
			<div className="vision:bg-none desktop:rounded-2xl desktop:rounded-t-none desktop:bg-brand-gradient desktop:p-1 desktop:pt-0">
				<nav
					className={twMerge(
						"flex-col gap-8 py-6 vision:bg-transparent dark:bg-transparent desktop:rounded-xl desktop:bg-white-20 desktop:pb-4 desktop:pt-6 desktop:shadow-brand-inset android:desktop:pt-6 dark:desktop:bg-black-70",
						layoutSegment ? "hidden desktop:flex" : "flex"
					)}
				>
					<NavigationCategory name="Profile">
						<NavigationLink
							newBadge
							href={urls.settings.matchmaking()}
							Icon={SlidersHorizontal}
						>
							Matchmaking
						</NavigationLink>
						<NavigationLink newBadge href={urls.settings.bio} Icon={PenSquare}>
							Bio & pics
						</NavigationLink>
						<NavigationLink href={urls.settings.info()} Icon={Contact}>
							Basic info
						</NavigationLink>
						<NavigationLink href={urls.settings.interests} Icon={Tag}>
							Interests
						</NavigationLink>
						<NavigationLink href={urls.settings.personality} Icon={Brain}>
							Personality
						</NavigationLink>
						<NavigationLink href={urls.settings.nsfw} Icon={Flame}>
							NSFW
						</NavigationLink>
					</NavigationCategory>
					<NavigationCategory name="Account">
						{/* <NavigationLink href={urls.settings.referral} Icon={Gift}>
						Refer a friend
					</NavigationLink> */}
						<NavigationLink href={urls.subscription.default} Icon={Sparkles}>
							Premium
						</NavigationLink>
						<NavigationLink
							newBadge
							href={urls.settings.connections}
							Icon={Users}
						>
							Connections
						</NavigationLink>
						<NavigationLink href={urls.settings.appearance} Icon={Paintbrush}>
							Appearance
						</NavigationLink>
						<NavigationLink href={urls.settings.privacy} Icon={EyeOff}>
							Privacy
						</NavigationLink>
						<NavigationLink href={urls.settings.notifications} Icon={Bell}>
							Notifications
						</NavigationLink>
						<NavigationLink href={urls.settings.email} Icon={AtSign}>
							Email
						</NavigationLink>
						<NavigationLink href={urls.settings.password} Icon={KeyRound}>
							Password &amp; passkeys
						</NavigationLink>
						<NavigationLink href={urls.settings.deactivateAccount} Icon={Skull}>
							Deactivate account
						</NavigationLink>
						<NavigationLink Icon={LogOut} onClick={logout}>
							Logout
						</NavigationLink>
					</NavigationCategory>
					<div className="desktop:hidden">
						<NavigationCategory name="Social">
							<NavigationLink href={urls.resources.events}>
								Events
							</NavigationLink>
							<NavigationLink href={urls.socials.discord}>
								Discord server
							</NavigationLink>
							<NavigationLink href={urls.socials.vrchat}>
								VRChat group
							</NavigationLink>
							<NavigationLink href={urls.socials.twitter}>
								Twitter
							</NavigationLink>
						</NavigationCategory>
					</div>
					<div className="desktop:hidden">
						<NavigationCategory name="Help">
							<NavigationLink onClick={openFreshworks}>Support</NavigationLink>
							<NavigationLink href={urls.resources.networkStatus}>
								Network Status
							</NavigationLink>
						</NavigationCategory>
					</div>
					<div className="desktop:hidden">
						<NavigationCategory name="Info">
							<NavigationLink href={urls.resources.about}>
								About Us
							</NavigationLink>
							<NavigationLink href={urls.resources.press}>Press</NavigationLink>
							<NavigationLink href={urls.resources.branding}>
								Branding
							</NavigationLink>
							<NavigationLink href={urls.resources.developers}>
								Developers
							</NavigationLink>
						</NavigationCategory>
					</div>
					<div className="desktop:hidden">
						<NavigationCategory name="Legal">
							<NavigationLink href={urls.resources.communityGuidelines}>
								Community Guidelines
							</NavigationLink>
							<NavigationLink href={urls.resources.termsOfService}>
								Terms of Service
							</NavigationLink>
							<NavigationLink href={urls.resources.privacyPolicy}>
								Privacy Policy
							</NavigationLink>
							<div className="px-6 py-2 vision:text-white-20">
								&copy; {new Date().getFullYear()} Flirtual
							</div>
						</NavigationCategory>
					</div>
					<InlineLink
						className="-mt-4 self-center text-black-10 no-underline vision:text-white-20"
						href={urls.debugger}
					>
						Flirtual {gitCommitSha?.slice(0, 8)}
					</InlineLink>
				</nav>
			</div>
		</div>
	);
};
