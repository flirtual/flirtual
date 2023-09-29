"use client";

import { ComponentProps, FC, forwardRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { animate, useAnimate, usePresence } from "framer-motion";

import { yearsAgo } from "~/date";
import { thruServerCookies, withSession } from "~/server-utilities";
import { filterBy } from "~/utilities";
import { Html } from "~/components/html";
import { displayName, User } from "~/api/user";
import { urls } from "~/urls";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";

import { InlineLink } from "../inline-link";
import { VRChatIcon } from "../icons/brand/vrchat";
import { DiscordIcon } from "../icons";
import { SWRConfig } from "../swr";

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

export type ProfileProps = ComponentProps<"div"> & {
	user: User;
	direct?: boolean;
};

export const Profile = forwardRef<HTMLDivElement, ProfileProps>(
	(props, reference) => {
		const { user, direct = false, className, ...elementProps } = props;

		const [session] = useSession();
		const [isPresent, safeToRemove] = usePresence();
		const [scope, animate] = useAnimate();

		if (!session) return null;

		if (user.relationship?.blocked) return <BlockedProfile user={user} />;
		const myProfile = session.user.id === user.id;

		/* useEffect(() => {
		animate(scope.current, isPresent ? {opacity: 1} : { opacity:0 }, {
			onComplete: () => safeToRemove?.()
		});
	}, [isPresent]) */

		return (
			<div
				style={{ "--theme-1": "red", "--theme-2": "blue" } as CSSProperties}
				{...elementProps}
				data-sentry-mask
				ref={scope}
				className={twMerge(
					"flex w-full bg-brand-gradient sm:max-w-lg sm:rounded-3xl sm:p-1 sm:shadow-brand-1",
					className
				)}
			>
				<div className="flex w-full flex-col overflow-hidden bg-cream text-black-70 dark:bg-black-80 dark:text-white-20 sm:rounded-3xl sm:bg-white-20 sm:dark:bg-black-70">
					<ProfileImageDisplay images={user.profile.images}>
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
											<ProfileVerificationBadge />
										)}
									</div>
								)}
							</div>
							<div className="flex flex-wrap items-center gap-2 font-montserrat ">
								<GenderPills
									className="!bg-opacity-70"
									attributes={filterBy(
										user.profile.attributes,
										"type",
										"gender"
									)}
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
					<div className="flex h-full grow flex-col gap-6 break-words p-8 pb-4">
						{myProfile && <PersonalActions user={user} />}
						<RelationActions direct={direct} user={user} />
						{(user.profile.discord || user.profile.vrchat) && (
							<div className="flex flex-col gap-2">
								{user.profile.vrchat && (
									<div className="flex items-center gap-2">
										<div className="w-6">
											<VRChatIcon className="h-6 text-black-90" />
										</div>
										VRChat:{" "}
										<InlineLink
											className="w-full"
											href={urls.vrchat(user.profile.vrchat)}
										>
											{user.profile.vrchat}
										</InlineLink>
									</div>
								)}
								{user.profile.discord && (
									<div className="flex items-center gap-2">
										<DiscordIcon className="h-6 w-6" />
										Discord: <span>{user.profile.discord}</span>
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
								{user.profile.biography.replaceAll(
									/(<p><br \/><\/p>){2,}?/g,
									""
								)}
							</Html>
						) : myProfile ? (
							<span className="text-xl italic dark:text-white-20">
								Don&apos;t forget to{" "}
								<InlineLink href={urls.settings.bio}>add a bio</InlineLink>!
							</span>
						) : null}
						<PillCollection user={user} />
					</div>
					<div className="pb-[env(safe-area-inset-bottom)] dark:bg-black-70">
						<ProfileActionBar user={user} />
					</div>
				</div>
			</div>
		);
	}
);
