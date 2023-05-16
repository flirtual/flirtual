import { urls } from "~/urls";
import { displayName, User } from "~/api/user";
import { Html } from "~/components/html";
import { filterBy } from "~/utilities";
import { withSession } from "~/server-utilities";
import { yearsAgo } from "~/date";

import { InlineLink } from "../inline-link";
import { VRChatIcon } from "../icons/brand/vrchat";
import { DiscordIcon } from "../icons";

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

export interface ProfileProps {
	user: User;
	direct?: boolean;
}

export async function Profile(props: ProfileProps) {
	const { user, direct = false } = props;

	const session = await withSession();
	const myProfile = session.user.id === user.id;

	if (user.relationship?.blocked) return <BlockedProfile user={user} />;

	return (
		<div className="flex w-full bg-brand-gradient sm:max-w-lg sm:rounded-3xl sm:p-1 sm:shadow-brand-1">
			<div className="flex w-full flex-col overflow-hidden bg-cream text-black-70 dark:bg-black-80 dark:text-white-20 sm:rounded-3xl sm:bg-white-20 sm:dark:bg-black-70">
				<ProfileImageDisplay images={user.profile.images}>
					<div className="absolute bottom-0 flex w-full flex-col gap-2 p-8 text-white-10">
						<div className="pointer-events-auto flex w-fit items-baseline gap-4 font-montserrat">
							<span className="text-shadow-brand text-4xl font-bold leading-none [word-break:break-all]">
								{displayName(user)}
							</span>
							{user.bornAt && (
								<div className="flex h-fit items-center gap-2">
									<span className="text-shadow-brand text-3xl leading-none">
										{yearsAgo(new Date(user.bornAt))}
									</span>
									{user.tags?.includes("verified") && <ProfileVerificationBadge />}
								</div>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-2 font-montserrat ">
							{/* @ts-expect-error: Server Component */}
							<GenderPills attributes={filterBy(user.profile.attributes, "type", "gender")} />
							{/* @ts-expect-error: Server Component */}
							{user.profile.country && <CountryPill code={user.profile.country} />}
						</div>
						{user.activeAt && <ActivityIndicator lastActiveAt={new Date(user.activeAt)} />}
					</div>
				</ProfileImageDisplay>
				<div className="flex h-full grow flex-col gap-6 break-words p-8">
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
									<InlineLink className="w-full" href={urls.vrchat(user.profile.vrchat)}>
										{decodeURIComponent(user.profile.vrchat)}
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
						<Html className="text-xl">{user.profile.biography}</Html>
					) : myProfile ? (
						<span className="text-xl italic dark:text-white-20">
							Don&apos;t forget to <InlineLink href={urls.settings.bio}>add a bio</InlineLink>!
						</span>
					) : null}
					{/* @ts-expect-error: Server Component */}
					<PillCollection user={user} />
				</div>
				<ProfileActionBar user={user} />
			</div>
		</div>
	);
}
