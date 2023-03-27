"use client";

import React from "react";
import { twMerge } from "tailwind-merge";

import { useFreshworks } from "~/hooks/use-freshworks";
import { urls } from "~/urls";

import { NavigationCategory } from "./navigation-category";
import { NavigationHeader } from "./navigation-header";
import { NavigationLink } from "./navigation-link";

export interface SettingsNavigationProps {
	navigationInner: string | null;
}

export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({ navigationInner }) => {
	const { openFreshworks } = useFreshworks();

	return (
		<div className="flex w-full shrink-0 grow-0 flex-col shadow-brand-1 md:w-80 md:bg-white-20 md:text-white-20 dark:md:bg-black-70">
			<NavigationHeader {...{ navigationInner }} />
			<nav className={twMerge("flex-col gap-8 py-8", navigationInner ? "hidden md:flex" : "flex")}>
				<NavigationCategory name="Profile">
					<NavigationLink href={urls.settings.matchmaking()}>Matchmaking</NavigationLink>
					<NavigationLink href={urls.settings.bio}>Bio & pics</NavigationLink>
					<NavigationLink href={urls.settings.tags()}>Info & tags</NavigationLink>
					<NavigationLink href={urls.settings.personality}>Personality</NavigationLink>
					<NavigationLink href={urls.settings.nsfw}>NSFW</NavigationLink>
				</NavigationCategory>
				<NavigationCategory name="Account">
					<NavigationLink href={urls.settings.appearance}>Appearance</NavigationLink>
					<NavigationLink href={urls.settings.privacy}>Privacy</NavigationLink>
					<NavigationLink href={urls.settings.notifications}>Notifications</NavigationLink>
					<NavigationLink href={urls.settings.changeEmail}>Change email</NavigationLink>
					<NavigationLink href={urls.settings.changePassword}>Change password</NavigationLink>
					<NavigationLink href={urls.settings.deactivateAccount}>Deactivate account</NavigationLink>
				</NavigationCategory>
				<div className="sm:hidden">
					<NavigationCategory name="Social">
						<NavigationLink href={urls.resources.events}>Events</NavigationLink>
						<NavigationLink href={urls.socials.discord}>Discord server</NavigationLink>
						<NavigationLink href={urls.socials.vrchat}>VRChat group</NavigationLink>
						<NavigationLink href={urls.socials.twitter}>Twitter</NavigationLink>
					</NavigationCategory>
				</div>
				<div className="sm:hidden">
					<NavigationCategory name="Help">
						<NavigationLink onClick={openFreshworks}>Support</NavigationLink>
						<NavigationLink href={urls.resources.networkStatus}>Network Status</NavigationLink>
					</NavigationCategory>
				</div>
				<div className="sm:hidden">
					<NavigationCategory name="Info">
						<NavigationLink href={urls.resources.about}>About Us</NavigationLink>
						<NavigationLink href={urls.resources.press}>Press</NavigationLink>
						<NavigationLink href={urls.resources.branding}>Branding</NavigationLink>
						<NavigationLink href={urls.resources.developers}>Developers</NavigationLink>
					</NavigationCategory>
				</div>
				<div className="sm:hidden">
					<NavigationCategory name="Legal">
						<NavigationLink href={urls.resources.termsOfService}>Terms of Service</NavigationLink>
						<NavigationLink href={urls.resources.privacyPolicy}>Privacy Policy</NavigationLink>
						<NavigationLink href={urls.resources.company}>&copy; Studio Paprika</NavigationLink>
					</NavigationCategory>
				</div>
			</nav>
		</div>
	);
};
