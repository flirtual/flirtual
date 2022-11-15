import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import React from "react";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "~/components/icons";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { useServerAuthenticate } from "~/server-utilities";
import { getCountry } from "~/utilities";

import { ProfileImageDisplay } from "./profile-image-display";
const Pill: React.FC<React.ComponentProps<"div"> & { Icon?: IconComponent; active?: boolean }> = ({
	Icon,
	active = false,
	...props
}) => (
	<div
		{...props}
		className={twMerge(
			"h-8 flex gap-2 items-center py-1 px-4 rounded-xl shadow-brand-1 font-montserrat font-semibold",
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

	return (
		<div className="flex gap-2 items-center">
			<div className={twMerge("h-4 w-4 rounded-full", color)}>
				<div className={twMerge("h-4 w-4 rounded-full animate-ping", color)} />
			</div>
			<span className="font-montserrat font-semibold">{text}</span>
		</div>
	);
};

const ProfileVerificationBadge: React.FC = () => (
	<div className="relative w-6 h-6">
		<div className="absolute bg-white w-3 h-3 top-1/4 left-1/4" />
		<CheckBadgeIcon className="absolute fill-brand-pink w-full h-full" />
	</div>
);
const CountryPill: React.FC<{ code: string }> = ({ code }) => (
	<Pill>
		<img
			className="h-8 rounded-l-lg -ml-4 shrink-0"
			src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/${code}.svg`}
		/>
		<span>{getCountry(code).name}</span>
	</Pill>
);

export default async function ProfilePage() {
	// const user = await useServerAuthenticate();

	return (
		<SoleModelLayout>
			<div className="max-w-lg border-4 flex flex-col shadow-brand-1 rounded-3xl border-brand-coral bg-brand-white overflow-hidden">
				<ProfileImageDisplay
					images={[
						"https://media.flirtu.al/9c65817f-d0c3-4143-9a50-0461329c27ff/",
						"https://media.flirtu.al/9839664f-3b7b-4ba6-9abe-2d0a025fa9d8/",
						"https://media.flirtu.al/0d1b6bb0-1fb1-4f77-aa3e-a55be2f8e274/",
						"https://media.flirtu.al/862dda84-947b-4a8e-beeb-afa4210582b5/",
						"https://media.flirtu.al/a80e842e-16ab-47e7-a44e-d892c9ac5b34/",
						"https://media.flirtu.al/9a113547-c04a-45eb-bb8a-596eee497cd3/",
						"https://media.flirtu.al/6b9915bf-9783-49f6-94a2-ce1078d8aeb3/",
						"https://media.flirtu.al/be2c355d-2b17-4d2b-beda-c3aff7f88d52/",
						"https://media.flirtu.al/98cb95e9-6694-43c9-9189-306e96c8d77a/",
						"https://media.flirtu.al/a7864e51-0034-4b38-9406-5a73b9922a89/"
					]}
				>
					<div className="w-full justify-center flex flex-col gap-2 p-6 absolute text-brand-white bottom-0">
						<div className="font-montserrat flex gap-4 items-center">
							<span className="text-4xl font-bold leading-none">Aries</span>
							<div className="flex gap-2 items-center">
								<span className="text-3xl leading-none">20</span>
								<ProfileVerificationBadge />
							</div>
						</div>
						<div className="font-montserrat flex gap-2 items-center flex-wrap">
							<Pill>Man</Pill>
							<CountryPill code="jp" />
						</div>
						<ActivityIndicator lastActiveAt={new Date()} />
					</div>
				</ProfileImageDisplay>
				<div className="flex-gap p-6 grow h-full flex flex-col gap-6">
					<span className="text-xl font-nunito whitespace-pre-wrap">
						{`hi~

im munchkin, im 18 looking for cuddle buddies or friends to hang out with <3

sometimes i go mute due to anxiety but im pretty chill overall :)

i get shy so please message me first

i tend to get annoying sometimes so if i do just tell me :)

im mostly on vrchat but i also play roblox and Minecraft. if we do end up matching it might take me a bit to fully open up to you so please be patient. im a sub/bottom if you're into that. add my discord if we match the messaging on here is weird!`}
					</span>
					<div className="flex flex-wrap gap-2">
						<Pill active>Open to serious dating</Pill>
						<Pill active>Practical</Pill>
						<Pill>Free-spirited</Pill>
						<Pill>Friendly</Pill>
					</div>
				</div>
			</div>
		</SoleModelLayout>
	);
}
