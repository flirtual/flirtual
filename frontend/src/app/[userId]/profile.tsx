"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "~/components/icons";
import { HeartGradient } from "~/components/icons/heart-gradient";
import { useUser } from "~/hooks/use-user";
import { capitalize, getCountry } from "~/utilities";

import { ProfileImageDisplay } from "./profile-image-display";

const Pill: React.FC<React.ComponentProps<"div"> & { Icon?: IconComponent; active?: boolean }> = ({
	Icon,
	active = false,
	...props
}) => (
	<div
		{...props}
		className={twMerge(
			"flex h-8 items-center gap-2 rounded-xl py-1 px-4 font-montserrat font-semibold shadow-brand-1",
			active ? "bg-brand-gradient text-brand-white" : "bg-neutral-200 text-brand-black",
			props.className
		)}
	>
		{Icon && <Icon className="h-4" />}
		{props.children}
	</div>
);

const ONE_DAY_IN_MILLISECONDS = 8.64e7;
const TWO_WEEKS_IN_MILLISECONDS = 1.21e9;

const ActivityIndicator: React.FC<{ lastActiveAt: Date }> = ({ lastActiveAt }) => {
	const timeSince = Date.now() - lastActiveAt.getTime();

	const color =
		timeSince < TWO_WEEKS_IN_MILLISECONDS
			? timeSince < ONE_DAY_IN_MILLISECONDS
				? "bg-green-500"
				: "bg-yellow-500"
			: "bg-brand-black";
	const text =
		timeSince < TWO_WEEKS_IN_MILLISECONDS
			? timeSince < ONE_DAY_IN_MILLISECONDS
				? "Active today"
				: "Active recently"
			: "Offline";

	if (text.includes("Offline")) return null;

	return (
		<div className="flex items-center gap-2">
			<div className={twMerge("h-4 w-4 rounded-full", color)}>
				<div className={twMerge("h-4 w-4 animate-ping rounded-full", color)} />
			</div>
			<span className="font-montserrat font-semibold">{text}</span>
		</div>
	);
};

const ProfileVerificationBadge: React.FC = () => (
	<div className="relative h-6 w-6">
		<div className="absolute top-1/4 left-1/4 h-3 w-3 bg-white" />
		<CheckBadgeIcon className="absolute h-full w-full fill-brand-pink" />
	</div>
);
const CountryPill: React.FC<{ code: string }> = ({ code }) => (
	<Pill>
		<img
			className="-ml-4 h-8 shrink-0 rounded-l-lg"
			src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/${code}.svg`}
		/>
		<span>{getCountry(code).name}</span>
	</Pill>
);

export const Profile: React.FC = () => {
	const { data: user } = useUser("4320fccc-e9f2-4ff4-98e6-2d39d68e1fa0");
	if (!user) return null;

	return (
		<div className="flex w-full flex-col overflow-hidden border-brand-coral bg-brand-cream text-brand-black sm:max-w-lg sm:rounded-3xl sm:border-4 sm:bg-brand-white sm:shadow-brand-1">
			<ProfileImageDisplay
				images={user.profile.images.map((image) => `https://media.flirtu.al/${image.externalId}/`)}
			>
				<div className="absolute bottom-0 flex w-full flex-col justify-center gap-2 p-8 text-brand-white">
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
						{user.profile.gender.map((gender) => (
							<Pill key={gender}>{capitalize(gender)}</Pill>
						))}
						{user.profile.country && <CountryPill code={user.profile.country} />}
					</div>
					<ActivityIndicator lastActiveAt={new Date()} />
				</div>
			</ProfileImageDisplay>
			<div className="flex-gap flex h-full grow flex-col gap-6 p-8 pb-0 sm:pb-8">
				<span className="whitespace-pre-wrap font-nunito text-xl">
					{user.profile.biography || "No biography available yet, consider adding one."}
				</span>
				<div className="flex flex-wrap gap-2">
					<Pill active>Open to serious dating</Pill>
					<Pill active>{user.profile.openness > 0 ? "Open-minded" : "Practical"}</Pill>
					<Pill>{user.profile.conscientiousness > 0 ? "Reliable" : "Free-spirited"}</Pill>
					<Pill>{user.profile.agreeableness > 0 ? "Friendly" : "Straightforward"}</Pill>
					{user.profile.games.map((game) => (
						<Pill key={game}>{capitalize(game)}</Pill>
					))}
					{user.profile.interests.map((interest) => (
						<Pill key={interest}>{capitalize(interest)}</Pill>
					))}
				</div>
			</div>
			<div className="h-32 w-full sm:h-0">
				<div className="pointer-events-none fixed left-0 bottom-16 flex h-32 w-full items-center justify-center p-8">
					<div className="pointer-events-auto flex h-fit overflow-hidden rounded-xl text-brand-white shadow-brand-1">
						<button className="flex items-center gap-3 bg-brand-gradient px-8 py-4" type="button">
							<HeartGradient className="w-8" gradient={false} />
							<span className="font-montserrat text-lg font-extrabold">Like</span>
						</button>
						<button className="flex items-center gap-3 bg-brand-black px-8 py-4" type="button">
							<XMarkIcon className="w-8" strokeWidth={3} />
							<span className="font-montserrat text-lg font-extrabold">Pass</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
