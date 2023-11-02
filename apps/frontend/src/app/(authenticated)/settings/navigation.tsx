"use client";

import { FC } from "react";
import { twMerge } from "tailwind-merge";
import { useSelectedLayoutSegment } from "next/navigation";
import {
	AtSign,
	Bell,
	Brain,
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

export const SettingsNavigation: FC = () => {
	const layoutSegment = useSelectedLayoutSegment();
	const { openFreshworks } = useFreshworks();
	const logout = useSession()[2];

	return (
		<div className="flex w-full shrink-0 grow-0 select-none flex-col md:mt-16 md:w-80 md:rounded-tr-2xl md:bg-white-20 md:text-white-20 md:shadow-brand-1 dark:md:bg-black-70">
			<NavigationHeader {...{ navigationInner: layoutSegment }} />
			<nav
				className={twMerge(
					"flex-col gap-8 py-8 pt-[calc(env(safe-area-inset-top)+5.75rem)] md:pt-8",
					layoutSegment ? "hidden md:flex" : "flex"
				)}
			>
				<NavigationCategory name="Profile">
					<NavigationLink
						href={urls.settings.matchmaking()}
						Icon={SlidersHorizontal}
					>
						Matchmaking
					</NavigationLink>
					<NavigationLink href={urls.settings.bio} Icon={PenSquare}>
						Bio & pics
					</NavigationLink>
					<NavigationLink href={urls.settings.tags()} Icon={Tag}>
						Info & tags
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
					<NavigationLink
						newBadge
						href={urls.settings.appearance}
						Icon={Paintbrush}
					>
						Appearance
					</NavigationLink>
					<NavigationLink href={urls.settings.privacy} Icon={EyeOff}>
						Privacy
					</NavigationLink>
					<NavigationLink href={urls.settings.notifications} Icon={Bell}>
						Notifications
					</NavigationLink>
					<NavigationLink href={urls.settings.changeEmail} Icon={AtSign}>
						Change email
					</NavigationLink>
					<NavigationLink href={urls.settings.changePassword} Icon={KeyRound}>
						Change password
					</NavigationLink>
					<NavigationLink href={urls.settings.deactivateAccount} Icon={Skull}>
						Deactivate account
					</NavigationLink>
					<NavigationLink Icon={LogOut} onClick={logout}>
						Logout
					</NavigationLink>
				</NavigationCategory>
				<div className="sm:hidden">
					<NavigationCategory name="Social">
						<NavigationLink href={urls.resources.events}>Events</NavigationLink>
						<NavigationLink href={urls.socials.discord}>
							Discord server
						</NavigationLink>
						<NavigationLink href={urls.socials.vrchat}>
							VRChat group
						</NavigationLink>
						<NavigationLink href={urls.socials.twitter}>Twitter</NavigationLink>
					</NavigationCategory>
				</div>
				<div className="sm:hidden">
					<NavigationCategory name="Help">
						<NavigationLink onClick={openFreshworks}>Support</NavigationLink>
						<NavigationLink href={urls.resources.networkStatus}>
							Network Status
						</NavigationLink>
					</NavigationCategory>
				</div>
				<div className="sm:hidden">
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
				<div className="sm:hidden">
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
						<div className="px-6 py-2">
							&copy; {new Date().getFullYear()} Flirtual
						</div>
					</NavigationCategory>
				</div>
				<InlineLink
					className="px-6 text-black-10 no-underline"
					href={urls.debugger.default}
				>
					Flirtual {gitCommitSha?.slice(0, 8)}
				</InlineLink>
			</nav>
		</div>
	);
};
