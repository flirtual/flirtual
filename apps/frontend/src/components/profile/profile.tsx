"use client";

import { twMerge } from "tailwind-merge";

import { yearsAgo } from "~/date";
import { filterBy } from "~/utilities";
import { Html } from "~/components/html";
import { displayName, type User } from "~/api/user";
import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";
import { gradientTextColor } from "~/colors";

import { InlineLink } from "../inline-link";
import { VRChatOutlineIcon, DiscordIcon } from "../icons";
import { CopyClick } from "../copy-click";

import { ProfileImageDisplay } from "./profile-image-display";
import { ProfileVerificationBadge } from "./verification-badge";
import { PillCollection } from "./pill/collection";
import { ActivityIndicator } from "./activity-indicator";
import { CountryPill } from "./pill/country";
import { ProfileActionBar } from "./action-bar";
import { GenderPills } from "./pill/genders";
import { BlockedProfile } from "./blocked";
import { PersonalActions } from "./personal-actions";
import { RelationActions } from "./relation-actions";
import { ProfilePrompts } from "./prompts";

import type { CSSProperties, ComponentProps, FC } from "react";

export type ProfileProps = ComponentProps<"div"> & {
	user: User;
	direct?: boolean;
};

export const Profile: FC<ProfileProps> = (props) => {
	const { user, direct = false, className, id, ...elementProps } = props;

	const [session] = useSession();

	if (!session) return null;

	if (user.relationship?.blocked) return <BlockedProfile user={user} />;
	const myProfile = session.user.id === user.id;

	const discordConnection = user.connections?.find(
		(connection) => connection.type === "discord"
	);

	return (
		<div
			id={id}
			style={
				user.profile.color_1 && user.profile.color_2
					? ({
							"--theme-1": user.profile.color_1,
							"--theme-2": user.profile.color_2,
							"--theme-text": gradientTextColor(
								user.profile.color_1,
								user.profile.color_2
							)
						} as CSSProperties)
					: {}
			}
			{...elementProps}
			data-sentry-mask
			className={twMerge(
				"flex w-full vision:bg-none desktop:max-w-lg desktop:rounded-3xl desktop:bg-brand-gradient desktop:p-1 desktop:shadow-brand-1",
				className
			)}
		>
			<div className="flex w-full flex-col overflow-hidden bg-transparent text-black-70 dark:text-white-20 desktop:rounded-[1.25rem] desktop:bg-white-20 desktop:shadow-brand-inset dark:desktop:bg-black-70">
				<ProfileImageDisplay
					images={user.profile.images}
					current={id === "current-profile"}
				>
					<div className="absolute bottom-0 flex w-full flex-col gap-2 p-8 text-white-10">
						<div className="pointer-events-auto flex w-fit items-baseline gap-4 font-montserrat">
							<span className="text-shadow-brand text-4xl font-bold leading-none [word-break:break-all]">
								{displayName(user)}
							</span>
							{user.bornAt && (
								<div className="flex h-fit items-center gap-2">
									<span className="text-shadow-brand select-none text-3xl leading-none">
										{yearsAgo(new Date(user.bornAt))}
									</span>
									{user.tags?.includes("verified") && (
										<ProfileVerificationBadge tooltip="Age verified" />
									)}
								</div>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-2 font-montserrat ">
							<GenderPills
								attributes={filterBy(user.profile.attributes, "type", "gender")}
								className="!bg-opacity-70"
							/>
							{user.profile.country && (
								<CountryPill
									className="!bg-opacity-70"
									id={user.profile.country}
								/>
							)}
						</div>
						{user.activeAt && (
							<ActivityIndicator lastActiveAt={new Date(user.activeAt)} />
						)}
					</div>
				</ProfileImageDisplay>
				<div className="h-2 bg-brand-gradient desktop:hidden" />
				<div className="flex h-full grow flex-col gap-6 break-words p-8 pb-4">
					{myProfile && <PersonalActions user={user} />}
					<RelationActions direct={direct} user={user} />
					{(discordConnection ||
						user.profile.discord ||
						user.profile.vrchat) && (
						<div className="flex flex-col gap-2 vision:text-white-20">
							{discordConnection ? (
								<div className="flex items-center gap-2">
									<DiscordIcon className="size-6" />
									Discord:{" "}
									<CopyClick value={discordConnection.displayName}>
										<span>{discordConnection.displayName}</span>
									</CopyClick>
									<ProfileVerificationBadge tooltip="Discord verified" />
								</div>
							) : (
								user.profile.discord && (
									<div className="flex items-center gap-2">
										<DiscordIcon className="size-6" />
										Discord:{" "}
										<CopyClick value={user.profile.discord}>
											<span>{user.profile.discord}</span>
										</CopyClick>
									</div>
								)
							)}
							{user.profile.vrchat && (
								<div className="flex items-center gap-2">
									<div className="w-6">
										<VRChatOutlineIcon className="h-6 text-black-90" />
									</div>
									VRChat:{" "}
									<InlineLink
										className="underline"
										highlight={false}
										href={urls.vrchat(user.profile.vrchat)}
									>
										{user.profile.vrchat}
									</InlineLink>
								</div>
							)}
						</div>
					)}
					{user.profile.new && !myProfile ? (
						session?.user.profile.new ? (
							<span className="text-xl italic dark:text-white-20">
								You&apos;re both new to VR. Explore it together!
							</span>
						) : (
							<span className="text-xl italic dark:text-white-20">
								{displayName(user)} is new to VR. Why not show them around?
							</span>
						)
					) : null}
					{user.profile.biography ? (
						<Html className="text-xl">
							{user.profile.biography.replaceAll(/(<p><br \/><\/p>){2,}?/g, "")}
						</Html>
					) : myProfile ? (
						<span className="text-xl italic dark:text-white-20">
							Don&apos;t forget to{" "}
							<InlineLink href={urls.settings.bio}>add a bio</InlineLink>!
						</span>
					) : null}
					<ProfilePrompts prompts={user.profile.prompts} />
					<PillCollection user={user} />
				</div>
				<ProfileActionBar user={user} />
			</div>
		</div>
	);
};
