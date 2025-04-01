"use client";

import { Preferences } from "@capacitor/preferences";
import {
	AtSign,
	Bell,
	Brain,
	Contact,
	EyeOff,
	Flame,
	KeyRound,
	LineChart,
	LogOut,
	Paintbrush,
	Paperclip,
	PenSquare,
	Search,
	ShieldAlert,
	SlidersHorizontal,
	Sparkles,
	Tag,
	Users,
	VenetianMask,
	X
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import { Authentication } from "~/api/auth";
import { InlineLink } from "~/components/inline-link";
import { gitCommitSha } from "~/const";
import { useCanny } from "~/hooks/use-canny";
import { useDevice } from "~/hooks/use-device";
import { useFreshworks } from "~/hooks/use-freshworks";
import { usePreferences } from "~/hooks/use-preferences";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

import { NavigationCategory } from "./navigation-category";
import { NavigationHeader } from "./navigation-header";
import { NavigationLink } from "./navigation-link";

export const SettingsNavigation: FC = () => {
	const layoutSegment = useSelectedLayoutSegment();
	const { openFreshworks } = useFreshworks();
	const [session, , logout] = useSession();
	const { vision } = useDevice();
	const router = useRouter();
	const t = useTranslations();

	const [flittyVisible, setFlittyVisible] = usePreferences(
		"flitty_visible",
		true
	);
	const [, setFlittyPosition] = usePreferences(
		"flitty_position",
		{
			top: 20,
			left: 20,
		}
	);

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
					{vision && (session?.user.tags?.includes("moderator") || session?.user.tags?.includes("admin") || session?.sudoerId) && (
						<NavigationCategory name="Staff">
							{session?.user.tags?.includes("moderator") && (
								<>
									<NavigationLink href={urls.moderation.reports()} Icon={ShieldAlert}>
										{t("reports")}
									</NavigationLink>
									<NavigationLink href={urls.moderation.search} Icon={Search}>
										{t("search")}
									</NavigationLink>
								</>
							)}
							{session?.user.tags?.includes("admin") && (
								<NavigationLink href={urls.admin.stats} Icon={LineChart}>
									{t("stats")}
								</NavigationLink>
							)}
							{session?.sudoerId && (
								<NavigationLink
									Icon={VenetianMask}
									onClick={async () => {
										await Authentication.revokeImpersonate();
										router.refresh();
									}}
								>
									{t("unsudo")}
								</NavigationLink>
							)}
						</NavigationCategory>
					)}
					{flittyVisible === false && (
						<NavigationLink
							Icon={Paperclip}
							onClick={() => {
								setFlittyVisible(true);
								setFlittyPosition(null);
							}}
						>
							Resurrect Flitty
						</NavigationLink>
					)}
					<NavigationCategory name={t("profile")}>
						<NavigationLink
							href={urls.settings.matchmaking()}
							Icon={SlidersHorizontal}
						>
							{t("matchmaking")}
						</NavigationLink>
						<NavigationLink href={urls.settings.bio} Icon={PenSquare}>
							{t("bio_pics")}
						</NavigationLink>
						<NavigationLink href={urls.settings.info()} Icon={Contact}>
							{t("basic_info")}
						</NavigationLink>
						<NavigationLink href={urls.settings.interests} Icon={Tag}>
							{t("interests")}
						</NavigationLink>
						<NavigationLink href={urls.settings.personality} Icon={Brain}>
							{t("personality")}
						</NavigationLink>
						<NavigationLink href={urls.settings.nsfw} Icon={Flame}>
							{t("nsfw")}
						</NavigationLink>
						<NavigationLink
							href={urls.settings.connections}
							Icon={Users}
						>
							{t("connections")}
						</NavigationLink>
					</NavigationCategory>
					<NavigationCategory name={t("account")}>
						{/* <NavigationLink href={urls.settings.referral} Icon={Gift}>
						Refer a friend
					</NavigationLink> */}
						<NavigationLink href={urls.subscription.default} Icon={Sparkles}>
							{t("premium")}
						</NavigationLink>
						<NavigationLink href={urls.settings.appearance} Icon={Paintbrush}>
							{t("appearance")}
						</NavigationLink>
						<NavigationLink href={urls.settings.privacy} Icon={EyeOff}>
							{t("privacy")}
						</NavigationLink>
						<NavigationLink href={urls.settings.notifications} Icon={Bell}>
							{t("notifications")}
						</NavigationLink>
						<NavigationLink href={urls.settings.email} Icon={AtSign}>
							{t("email")}
						</NavigationLink>
						<NavigationLink href={urls.settings.password} Icon={KeyRound}>
							{t("password_passkeys")}
						</NavigationLink>
						<NavigationLink href={urls.settings.deactivateAccount} Icon={X}>
							{t("deactivate_account")}
						</NavigationLink>
						<NavigationLink Icon={LogOut} onClick={logout}>
							{t("logout")}
						</NavigationLink>
					</NavigationCategory>
					<div className="desktop:hidden">
						<NavigationCategory name={t("social")}>
							<NavigationLink href={urls.resources.events}>
								{t("events")}
							</NavigationLink>
							<NavigationLink href={urls.socials.discord}>
								{t("discord_server")}
							</NavigationLink>
							<NavigationLink href={urls.socials.vrchat}>
								{t("vrchat_group")}
							</NavigationLink>
							<NavigationLink href={urls.socials.twitter}>
								{t("twitter")}
							</NavigationLink>
						</NavigationCategory>
					</div>
					<div className="desktop:hidden">
						<NavigationCategory name={t("help")}>
							<NavigationLink onClick={openFreshworks}>{t("support")}</NavigationLink>
							<NavigationLink onClick={useCanny().openFeedback}>
								{t("feedback")}
							</NavigationLink>
							<NavigationLink href={urls.resources.networkStatus}>
								{t("network_status")}
							</NavigationLink>
						</NavigationCategory>
					</div>
					<div className="desktop:hidden">
						<NavigationCategory name={t("info")}>
							<NavigationLink href={urls.resources.about}>
								{t("about")}
							</NavigationLink>
							<NavigationLink href={urls.resources.press}>
								{t("press")}
							</NavigationLink>
							<NavigationLink href={urls.resources.branding}>
								{t("branding")}
							</NavigationLink>
							<NavigationLink href={urls.resources.developers}>
								{t("developers")}
							</NavigationLink>
						</NavigationCategory>
					</div>
					<div className="desktop:hidden">
						<NavigationCategory name={t("legal")}>
							<NavigationLink href={urls.resources.communityGuidelines}>
								{t("community_guidelines")}
							</NavigationLink>
							<NavigationLink href={urls.resources.termsOfService}>
								{t("terms_of_service")}
							</NavigationLink>
							<NavigationLink href={urls.resources.privacyPolicy}>
								{t("privacy_policy")}
							</NavigationLink>
							<div className="px-6 py-2 vision:text-white-20">
								{t("copyright", { year: new Date().getFullYear() })}
							</div>
						</NavigationCategory>
					</div>
					<InlineLink
						className="-mt-4 self-center text-black-10 no-underline vision:text-white-20"
						href={urls.debugger}
					>
						{t("version", { version: gitCommitSha?.slice(0, 8) })}
					</InlineLink>
				</nav>
			</div>
		</div>
	);
};
