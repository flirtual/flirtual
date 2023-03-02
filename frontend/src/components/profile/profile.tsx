"use client";

import { FlagIcon } from "@heroicons/react/24/solid";

import { urls } from "~/urls";
import { User } from "~/api/user";
import { Html } from "~/components/html";
import { useCurrentUser } from "~/hooks/use-current-user";

import { InlineLink } from "../inline-link";

import { ProfileImageDisplay } from "./profile-image-display";
import { ProfileVerificationBadge } from "./verification-badge";
import { Pill } from "./pill/pill";
import { PillCollection } from "./pill/collection";
import { ActivityIndicator } from "./activity-indicator";
import { CountryPill } from "./pill/country";
import { ProfileActionBar } from "./action-bar";

export const Profile: React.FC<{ user: User }> = ({ user }) => {
	const { data: authUser } = useCurrentUser();
	const myProfile = authUser?.id === user.id;

	return (
		<div className="flex w-full bg-brand-gradient sm:max-w-lg sm:rounded-3xl sm:p-1 sm:shadow-brand-1">
			<div className="flex w-full flex-col overflow-hidden bg-cream text-black-70 dark:bg-black-80 dark:text-white-20 sm:rounded-3xl sm:bg-white-20 sm:dark:bg-black-70">
				<ProfileImageDisplay
					images={user.profile.images.map((image) => urls.media(image.externalId))}
				>
					<div className="absolute bottom-0 flex w-full flex-col justify-center gap-2 p-8 text-white-10">
						<div className="flex items-baseline gap-4 font-montserrat">
							<span className="text-4xl font-bold leading-none">
								{user.profile.displayName ?? user.username}
							</span>
							{user.bornAt && (
								<div className="flex h-fit gap-2">
									<span className="text-3xl leading-none">
										{new Date().getFullYear() - new Date(user.bornAt).getFullYear()}
									</span>
									{user.tags.includes("verified") && <ProfileVerificationBadge />}
								</div>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-2 font-montserrat">
							{user.profile.gender
								// don't display "Other" as a gender.
								.filter((gender) => !gender.metadata?.fallback)
								// some genders have a sort order, prioritize them.
								.sort((a, b) => ((a.metadata?.order ?? 0) < (b.metadata?.order ?? 0) ? 1 : -1))
								.map((gender) => (
									<Pill href={myProfile ? urls.settings.tags() : undefined} key={gender.id}>
										{gender.name}
									</Pill>
								))}
							{user.profile.country && <CountryPill code={user.profile.country} />}
						</div>
						<ActivityIndicator lastActiveAt={new Date()} />
					</div>
					{/* <div
						className="absolute bottom-0 right-0 bg-brand-gradient p-16"
						style={{ transform: "rotateZ(-45deg) translateY(116px)" }}
					>
						<div
							className=""
							style={{ transform: "rotateZ(45deg) translateY(-35px) translateX(-35px)" }}
						>
							<button type="button" onClick={() => navigator.clipboard.writeText(user.id)}>
								<FlagIcon className="h-6 w-6" />
							</button>
						</div>
					</div> */}
				</ProfileImageDisplay>
				<div className="flex-gap flex h-full grow flex-col gap-6 p-8">
					{user.profile.biography ? (
						<Html className="text-xl dark:text-white-20">{user.profile.biography}</Html>
					) : (
						<span className="text-xl dark:text-white-20">
							No biography available yet, consider{" "}
							<InlineLink href={myProfile ? urls.settings.biography() : urls.messages()}>
								{myProfile ? "adding one" : "asking them to add one"}
							</InlineLink>
							.
						</span>
					)}
					<PillCollection user={user} />
				</div>
				<ProfileActionBar user={user} />
			</div>
		</div>
	);
};
