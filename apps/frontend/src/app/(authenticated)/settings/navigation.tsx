"use client";

import {
	AdjustmentsHorizontalIcon,
	ArrowLeftOnRectangleIcon,
	AtSymbolIcon,
	BeakerIcon,
	BellIcon,
	ExclamationCircleIcon,
	EyeSlashIcon,
	FireIcon,
	KeyIcon,
	PencilSquareIcon,
	SwatchIcon,
	TagIcon
} from "@heroicons/react/24/outline";
import { FC } from "react";
import { twMerge } from "tailwind-merge";
import { useSelectedLayoutSegment } from "next/navigation";

import { useFreshworks } from "~/hooks/use-freshworks";
import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";

import { NavigationCategory } from "./navigation-category";
import { NavigationHeader } from "./navigation-header";
import { NavigationLink } from "./navigation-link";

export const SettingsNavigation: FC = () => {
	const layoutSegment = useSelectedLayoutSegment();
	const { openFreshworks } = useFreshworks();
	const logout = useSession()[2];

	return (
		<div className="flex w-full shrink-0 grow-0 select-none flex-col shadow-brand-1 md:mt-16 md:w-80 md:rounded-tr-2xl md:bg-white-20 md:text-white-20 dark:md:bg-black-70">
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
						Icon={AdjustmentsHorizontalIcon}
					>
						Matchmaking
					</NavigationLink>
					<NavigationLink href={urls.settings.bio} Icon={PencilSquareIcon}>
						Bio & pics
					</NavigationLink>
					<NavigationLink href={urls.settings.tags()} Icon={TagIcon}>
						Info & tags
					</NavigationLink>
					<NavigationLink href={urls.settings.personality} Icon={BeakerIcon}>
						Personality
					</NavigationLink>
					<NavigationLink href={urls.settings.nsfw} Icon={FireIcon}>
						NSFW
					</NavigationLink>
				</NavigationCategory>
				<NavigationCategory name="Account">
					{/* <NavigationLink href={urls.settings.referral} Icon={GiftIcon}>
						Refer a friend
					</NavigationLink> */}
					<NavigationLink href={urls.settings.appearance} Icon={SwatchIcon}>
						Appearance
					</NavigationLink>
					<NavigationLink href={urls.settings.privacy} Icon={EyeSlashIcon}>
						Privacy
					</NavigationLink>
					<NavigationLink href={urls.settings.notifications} Icon={BellIcon}>
						Notifications
					</NavigationLink>
					<NavigationLink href={urls.settings.changeEmail} Icon={AtSymbolIcon}>
						Change email
					</NavigationLink>
					<NavigationLink href={urls.settings.changePassword} Icon={KeyIcon}>
						Change password
					</NavigationLink>
					<NavigationLink
						href={urls.settings.deactivateAccount}
						Icon={ExclamationCircleIcon}
					>
						Deactivate account
					</NavigationLink>
					<NavigationLink Icon={ArrowLeftOnRectangleIcon} onClick={logout}>
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
						<NavigationLink href={urls.resources.company}>
							&copy; Studio Paprika
						</NavigationLink>
					</NavigationCategory>
				</div>
			</nav>
		</div>
	);
};
