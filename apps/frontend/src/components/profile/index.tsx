"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps, CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

import { displayName } from "~/api/user";
import { gradientTextColor } from "~/colors";
import { Html } from "~/components/html";
import { yearsAgo } from "~/date";
import { useSession } from "~/hooks/use-session";
import { useRelationship, useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

import { CopyClick } from "../copy-click";
import { DiscordIcon, VRChatOutlineIcon } from "../icons";
import { InlineLink } from "../inline-link";
import { ProfileActionBar } from "./action-bar";
import { ActivityIndicator } from "./activity-indicator";
import { BlockedProfile } from "./blocked";
import { PersonalActions } from "./personal-actions";
import { PillCollection } from "./pill/collection";
import { CountryPill } from "./pill/country";
import { GenderPills } from "./pill/genders";
import { ProfileImageDisplay } from "./profile-image-display";
import { ProfilePrompts } from "./prompts";
import { RelationActions } from "./relation-actions";
import { TimeDiff } from "./time-diff";
import { ProfileVerificationBadge } from "./verification-badge";

export type ProfileProps = {
	userId: string;
	direct?: boolean;
	hideModeratorInfo?: boolean;
} & ComponentProps<"div">;

export function Profile({
	userId,
	direct = false,
	hideModeratorInfo = false,
	className,
	id,
	...elementProps
}: ProfileProps) {
	const session = useSession();

	const user = useUser(userId);
	const relationship = useRelationship(userId);

	const t = useTranslations();

	if (!user) return null;

	if (relationship?.blocked) return <BlockedProfile user={user} />;
	const myProfile = session.user.id === user.id;

	const discordConnection = user.connections?.find(
		(connection) => connection.type === "discord"
	);

	return (
		<div
			style={
				user.profile.color1 && user.profile.color2
					? ({
							"--theme-1": user.profile.color1,
							"--theme-2": user.profile.color2,
							"--theme-text": gradientTextColor(
								user.profile.color1,
								user.profile.color2
							)
						} as CSSProperties)
					: {}
			}
			id={id}
			{...elementProps}
			data-mask
			className={twMerge(
				"flex w-full vision:bg-none desktop:max-w-lg desktop:rounded-3xl desktop:bg-brand-gradient desktop:p-1 desktop:shadow-brand-1",
				className
			)}
		>
			<div className="flex w-full flex-col overflow-hidden bg-transparent text-black-70 dark:text-white-20 desktop:rounded-[1.25rem] desktop:bg-white-20 desktop:shadow-brand-inset dark:desktop:bg-black-70">
				<ProfileImageDisplay
					current={id !== "next-profile"}
					user={user}
				>
					<div className="absolute bottom-0 flex w-full flex-col gap-2 p-8 text-white-10">
						<div className="pointer-events-auto flex w-fit items-baseline gap-4 font-montserrat">
							<span
								className={twMerge(
									"text-shadow-brand max-w-[95%] truncate text-4xl font-bold",
									session.user.tags?.includes("moderator") && "select-text"
								)}
							>
								{displayName(user)}
							</span>
							{user.bornAt && (
								<div className="flex h-fit items-center gap-2">
									<span className="text-shadow-brand text-3xl leading-none">
										{yearsAgo(new Date(user.bornAt))}
									</span>
									{user.tags?.includes("verified") && (
										<ProfileVerificationBadge
											tooltip={t("age_verified")}
										/>
									)}
								</div>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-2 font-montserrat ">
							<GenderPills
								attributes={user.profile.attributes.gender ?? []}
								className="!bg-opacity-70"
							/>
							{user.profile.country && (
								<CountryPill
									className="!bg-opacity-70"
									id={user.profile.country}
								/>
							)}
						</div>
						<div className="flex gap-4">
							{user.activeAt && (
								<ActivityIndicator lastActiveAt={new Date(user.activeAt)} />
							)}
							{relationship?.timeDiff !== undefined && user.profile.timezone && (
								<TimeDiff diff={relationship.timeDiff} displayName={displayName(user)} timezone={user.profile.timezone} />
							)}
						</div>
					</div>
				</ProfileImageDisplay>
				<div className="h-1 shrink-0 bg-brand-gradient desktop:hidden" />
				<div className="flex h-full grow flex-col gap-6 break-words p-8">
					{myProfile && <PersonalActions user={user} />}
					<RelationActions direct={direct} userId={user.id} />
					{(session.user.tags?.includes("admin")
						|| session.user.tags?.includes("moderator")
						|| relationship?.matched)
					&& (discordConnection
						|| user.profile.discord
						|| user.profile.vrchatName)
					&& (
						<div className="flex flex-col gap-2 vision:text-white-20">
							{(discordConnection || user.profile.discord) && (
								<div className="flex items-center gap-2">
									<DiscordIcon className="size-6 shrink-0" />
									{t.rich("that_proud_butterfly_find", {
										name:
											discordConnection?.displayName || user.profile.discord!,
										copy: (children) => (
											<CopyClick
												value={
													session.user.status === "visible"
														? discordConnection?.displayName
														|| user.profile.discord!
														: null
												}
											>
												<span className="data-[copy-click]:hover:underline">
													{children}
												</span>
											</CopyClick>
										)
									})}
									{discordConnection && (
										<ProfileVerificationBadge
											tooltip={t("discord_verified")}
										/>
									)}
								</div>
							)}
							{user.profile.vrchatName && (() => {
								const name = user.profile.vrchatName;
								const url = user.profile.vrchat
									? urls.vrchatProfile(user.profile.vrchat)
									: urls.vrchatSearch(name);

								return (
									<div className="flex items-center gap-2">
										<VRChatOutlineIcon className="size-6 shrink-0 text-black-90" />
										{t.rich("zany_salty_cheetah_lead", {
											name,
											copy: (children) => (
												<div className="group flex items-center justify-center gap-1">
													<InlineLink
														className="underline"
														highlight={false}
														href={url}
													>
														{children}
													</InlineLink>
													{session.user.status === "visible" && (
														<CopyClick value={name}>
															<button
																className="p-2 opacity-0 transition-opacity group-hover:opacity-100"
																type="button"
															>
																<Copy className="size-4 shrink-0" />
															</button>
														</CopyClick>
													)}
												</div>
											)
										})}
									</div>
								);
							})()}
						</div>
					)}
					{user.profile.new && !myProfile
						? (
								session?.user.profile.new
									? (
											<span className="text-xl italic vision:text-white-20 dark:text-white-20">
												{t("strong_home_bullock_taste")}
											</span>
										)
									: (
											<span className="text-xl italic vision:text-white-20 dark:text-white-20">
												{t("fuzzy_calm_ant_nudge", {
													name: displayName(user)
												})}
											</span>
										)
							)
						: null}
					{user.profile.biography
						? (
								<Html
									className={twMerge(
										"text-xl",
										session.user.status === "visible" && "select-children"
									)}
								>
									{user.profile.biography.replaceAll(
										/(<p>(<br\s?\/?>)+<\/p>){2}/g,
										""
									)}
								</Html>
							)
						: myProfile
							? (
									<span className="text-xl italic dark:text-white-20">
										{t.rich("early_quiet_giraffe_dine", {
											"settings-bio": (children) => (
												<InlineLink href={urls.settings.bio}>{children}</InlineLink>
											)
										})}
									</span>
								)
							: (
									<p>
										No biography available.
									</p>
								)}
					<ProfilePrompts prompts={user.profile.prompts} />
					<PillCollection user={user} />
				</div>
				<ProfileActionBar hideModeratorInfo={hideModeratorInfo} user={user} />
			</div>
		</div>
	);
}
