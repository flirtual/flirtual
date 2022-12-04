"use client";

import React from "react";
import { twMerge } from "tailwind-merge";

import { useFreshworks } from "~/hooks/use-freshworks";
import { urls } from "~/pageUrls";

import { NavigationCategory } from "./navigation-category";
import { NavigationHeader } from "./navigation-header";
import { NavigationLink } from "./navigation-link";

export interface SettingsNavigationProps {
	navigationInner: string | null;
}

export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({ navigationInner }) => {
	const { openFreshworks } = useFreshworks();

	return (
		<div className="flex w-full shrink-0 grow-0 flex-col shadow-brand-1 md:w-72 md:bg-brand-gradient md:text-white-20">
			<NavigationHeader {...{ navigationInner }} />
			<nav className={twMerge("flex-col gap-8 py-8", navigationInner ? "hidden md:flex" : "flex")}>
				<NavigationCategory name="Profile">
					<NavigationLink href="/settings/matchmaking">Matchmaking</NavigationLink>
					<NavigationLink href="/settings/biography">Biography & pictures</NavigationLink>
					<NavigationLink href="/settings/tags">Information & tags</NavigationLink>
					<NavigationLink href="/settings/personality">Personality</NavigationLink>
					<NavigationLink href="/settings/nsfw">NSFW</NavigationLink>
				</NavigationCategory>
				<NavigationCategory name="Account">
					<NavigationLink href={urls.settings.privacy()}>Privacy</NavigationLink>
					<NavigationLink href={urls.settings.notifications()}>Notifications</NavigationLink>
					<NavigationLink href={urls.settings.changeEmail()}>Change email</NavigationLink>
					<NavigationLink href={urls.settings.changePassword()}>Change password</NavigationLink>
					<NavigationLink href={urls.settings.deactivateAccount()}>
						Deactivate account
					</NavigationLink>
				</NavigationCategory>
				<NavigationCategory name="Resources">
					<NavigationLink onClick={openFreshworks}>Support</NavigationLink>
					<NavigationLink href="https://status.flirtu.al">Network Status</NavigationLink>
					<NavigationLink href="/about">About</NavigationLink>
					<NavigationLink href="/community-guidelines">Community Guidelines</NavigationLink>
					<NavigationLink href="/terms-of-service">Terms oF Service</NavigationLink>
					<NavigationLink href="/privacy-policy">Privacy Policy</NavigationLink>
					<NavigationLink href="https://studiopaprika.io/">Studio Paprika</NavigationLink>
				</NavigationCategory>
			</nav>
		</div>
	);
};
