import type { ComponentProps, CSSProperties } from "react";
import { Trans, useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import { gradientTextColor } from "~/colors";
import { Html } from "~/components/html";
import { yearsAgo } from "~/date";
import { usePreferences } from "~/hooks/use-preferences";
import { useSession } from "~/hooks/use-session";
import { useRelationship, useUser } from "~/hooks/use-user";
import { attributeFetcher, attributeKey, preload, relationshipFetcher, relationshipKey, userFetcher, userKey } from "~/query";
import { urls } from "~/urls";
import { escapeHtml } from "~/utilities";

import { CopyClick } from "../copy-click";
import { DiscordIcon, VRChatOutlineIcon } from "../icons";
import { InlineLink } from "../inline-link";
import { ProfileActionBar } from "./action-bar";
import { ActivityIndicator } from "./activity-indicator";
import { BlockedProfile } from "./blocked";
import { Distance } from "./distance";
import { PersonalActions } from "./personal-actions";
import { PillCollection } from "./pill/collection";
import { CountryPill } from "./pill/country";
import { GenderPills } from "./pill/genders";
import { ProfileImageDisplay } from "./profile-image-display";
import { ProfilePrompts } from "./prompts";
import { RelationActions } from "./relation-actions";
import { ProfileSkeleton } from "./skeleton";
import { TimeDiff } from "./time-diff";
import { ProfileVerificationBadge } from "./verification-badge";

// eslint-disable-next-line react-refresh/only-export-components
export async function preloadProfileAttributes() {
	await Promise.all(([
		"country",
		"game",
		"gender",
		"interest",
		"kink",
		"language",
		"platform",
		"prompt",
		"relationship",
		"report-reason",
		"sexuality"
	] as const).map((type) => preload({ queryKey: attributeKey(type), queryFn: attributeFetcher })));
}

// eslint-disable-next-line react-refresh/only-export-components
export async function preloadProfile(userId: string) {
	await Promise.all([
		preload({ queryKey: userKey(userId), queryFn: userFetcher }),
		preload({ queryKey: relationshipKey(userId), queryFn: relationshipFetcher }),
		preloadProfileAttributes()
	]);
}

export type ProfileProps = {
	userId: string;
	direct?: boolean;
	hideModeratorInfo?: boolean;
} & ComponentProps<"div">;

export const Profile = withSuspense(({
	userId,
	direct = false,
	hideModeratorInfo = false,
	className,
	id,
	...elementProps
}: ProfileProps) => {
	const { user: me } = useSession();

	const user = useUser(userId);
	const relationship = useRelationship(userId);

	const { t } = useTranslation();

	const [moderatorInfoVisible] = usePreferences(
		"profile-moderator-info-visible",
		false
	);

	if (!user) return null;

	if (relationship?.blocked) return <BlockedProfile user={user} />;
	const myProfile = me.id === user.id;

	const discordConnection = user.connections?.find(
		(connection) => connection.type === "discord"
	);

	return (
		<div
			id={id}
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
			{...elementProps}
			data-mask
			className={twMerge(
				"flex w-full vision:bg-none desktop:max-w-lg desktop:rounded-3xl desktop:bg-brand-gradient desktop:p-1 desktop:shadow-brand-1",
				className
			)}
		>
			<div className="flex w-full flex-col overflow-hidden bg-transparent text-black-70 dark:text-white-20 desktop:rounded-2.5xl desktop:bg-white-20 desktop:shadow-brand-inset dark:desktop:bg-black-70">
				<ProfileImageDisplay
					current={id !== "next-profile"}
					user={user}
				>
					<div className="absolute bottom-0 flex w-full flex-col gap-2 p-8 text-white-10">
						<div className="pointer-events-auto flex w-fit items-baseline gap-4 font-montserrat">
							<span
								className={twMerge(
									"text-shadow-brand col-span-10 line-clamp-1 shrink break-all text-4xl font-bold",
									me.tags?.includes("moderator") && "select-text"
								)}
							>
								{user.profile.displayName || t("unnamed_user")}
								{" "}
							</span>
							{user.bornAt && (
								<div className="col-span-2 flex h-fit shrink-0 items-center gap-2">
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
									id={user.profile.country}
									className="!bg-opacity-70"
								/>
							)}
						</div>
						{!myProfile && (
							<div className="flex gap-4">
								{user.activeAt && (
									<ActivityIndicator lastActiveAt={new Date(user.activeAt)} />
								)}
								{relationship?.distance !== undefined && (
									<Distance distance={relationship.distance} />
								)}
								{relationship?.timeDiff !== undefined && (
									<TimeDiff
										diff={relationship.timeDiff}
										displayName={user.profile.displayName || t("unnamed_user")}
									/>
								)}
							</div>
						)}
					</div>
				</ProfileImageDisplay>
				<div className="h-1 shrink-0 bg-brand-gradient desktop:hidden" />
				<div className="flex h-full grow flex-col gap-6 break-words p-8">
					{myProfile && <PersonalActions user={user} />}
					<RelationActions direct={direct} userId={user.id} />
					{(((me.tags?.includes("admin") || me.tags?.includes("moderator")) && moderatorInfoVisible)
						|| relationship?.matched
						|| myProfile)
					&& (discordConnection
						|| user.profile.discord
						|| user.profile.vrchatName)
					&& (
						<div className="flex flex-col gap-2 vision:text-white-20">
							{(discordConnection || user.profile.discord) && (
								<div className="flex items-center gap-2">
									<DiscordIcon className="size-6 shrink-0" />
									<Trans
										shouldUnescape
										components={{
											copy: (
												<CopyClick
													value={
														me.status === "visible"
															? discordConnection?.displayName
															|| user.profile.discord!
															: null
													}
													asChild={false}
													className="data-[copy-click]:hover:underline"
												/>
											)
										}}
										i18nKey="that_proud_butterfly_find"
										values={{ name: escapeHtml(discordConnection?.displayName || user.profile.discord!) }}
									/>
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
										<Trans
											shouldUnescape
											components={{
												copy: (
													<InlineLink
														className="underline"
														highlight={false}
														href={url}
													/>
												)
											}}
											i18nKey="zany_salty_cheetah_lead"
											values={{ name: escapeHtml(name) }}
										/>
									</div>
								);
							})()}
						</div>
					)}
					{user.profile.new && !myProfile
						? (
								me.profile.new
									? (
											<span className="text-xl italic vision:text-white-20 dark:text-white-20">
												{t("strong_home_bullock_taste")}
											</span>
										)
									: (
											<span className="text-xl italic vision:text-white-20 dark:text-white-20">
												{t("fuzzy_calm_ant_nudge", {
													name: user.profile.displayName || t("unnamed_user")
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
										me.status === "visible" && "select-children"
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
										<Trans
											components={{
												"settings-bio": (
													<InlineLink href={urls.settings.bio} />
												)
											}}
											i18nKey="early_quiet_giraffe_dine"
										/>
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
}, {
	fallback: <ProfileSkeleton />
});
