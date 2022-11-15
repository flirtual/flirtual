"use client";

import {
	ArrowLeftOnRectangleIcon,
	HeartIcon,
	HomeIcon,
	EnvelopeIcon,
	EnvelopeOpenIcon,
	ChatBubbleLeftRightIcon
} from "@heroicons/react/24/solid";
import React from "react";
import Link, { LinkProps } from "next/link";
import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";

import { useCurrentUser } from "~/hooks/use-current-user";
import { User } from "~/api/user";

import { IconComponent } from "../icons";
import { HeartGradient } from "../icons/heart-gradient";
import { PeaceGradient } from "../icons/peace-gradient";
import { FlirtualLogo } from "../logo";

type HeaderLinkProps = Omit<React.ComponentProps<"a">, "ref"> & LinkProps & { Icon: IconComponent };

const HeaderInnerLink: React.FC<HeaderLinkProps> = ({ Icon, ...props }) => {
	const pathname = usePathname();

	return (
		<Link
			{...props}
			className={twMerge(
				"group focus:outline-none p-3 w-16 h-16 rounded-full text-brand-pink hocus:bg-brand-gradient hocus:text-white",
				props.className
			)}
		>
			<Icon className="group-hocus:fill-current" />
		</Link>
	);
};

type ProfileImageDropdownItemProps = React.PropsWithChildren<{ href: string }>;

const ProfileImageDropdownItem: React.FC<ProfileImageDropdownItemProps> = ({ href, children }) => (
	<Link className="font-montserrat font-extrabold hover:text-brand-pink text-left" href={href}>
		{children}
	</Link>
);

const ProfileImageDropdown: React.FC<{ user: User }> = ({ user }) => {
	const avatarUrl =
		"https://media.flirtu.al/b8a05ec5-7aea-4e33-bb2b-46301eaddd9a/-/scale_crop/64x64/smart_faces_points/-/format/auto/-/quality/smart/-/resize/x65/";

	return (
		<button className="group relative shrink-0" type="button">
			<div className="pr-6 z-10 hidden bg-white rounded-3xl shadow-brand-1 w-max -top-3 absolute gap-5 -left-3 p-3 group-hocus:flex">
				<img className="rounded-full w-16 h-16 shrink-0" src={avatarUrl} />
				<div className="flex flex-col py-4 gap-2">
					<ProfileImageDropdownItem href={`/${user.username}`}>Profile</ProfileImageDropdownItem>
					<ProfileImageDropdownItem href="/settings">Settings</ProfileImageDropdownItem>
					<ProfileImageDropdownItem href="/premium">Premium</ProfileImageDropdownItem>
					<ProfileImageDropdownItem href="/reports">Reports</ProfileImageDropdownItem>
					<ProfileImageDropdownItem href="/logout">Logout</ProfileImageDropdownItem>
				</div>
			</div>
			<img className="rounded-full w-16 h-16" src={avatarUrl} />
		</button>
	);
};

const MessagesIcon: React.FC = () => (
	<div className="relative">
		<ChatBubbleLeftRightIcon className="w-10 text-white" strokeWidth={1.5} />
		<div className="ring-[3px] ring-white absolute top-0 -right-2 rounded-full bg-brand-gradient w-6 h-6 flex items-center justify-center">
			<span className="text-brand-white text-sm font-nunito font-semibold leading-none">4</span>
		</div>
	</div>
);

export const Navigation: React.FC = () => {
	const { data: user } = useCurrentUser();

	const avatarUrl =
		"https://media.flirtu.al/b8a05ec5-7aea-4e33-bb2b-46301eaddd9a/-/scale_crop/64x64/smart_faces_points/-/format/auto/-/quality/smart/-/resize/x65/";

	return (
		<nav className="h-16 sm:pt-0 w-full">
			<div className="h-16 fixed bottom-0 sm:static z-10 bg-brand-gradient text-brand-white shadow-brand-1 font-nunito justify-between items-center gap-6 flex  w-full px-8 py-4 md:px-16">
				<HomeIcon className="w-8" />
				<PeaceGradient className="w-8" gradient={false} />

				<HeartGradient className="w-8" gradient={false} />
				<MessagesIcon />
				<img
					className="rounded-full h-8 w-8 shrink-0"
					src={
						"https://media.flirtu.al/b8a05ec5-7aea-4e33-bb2b-46301eaddd9a/-/scale_crop/64x64/smart_faces_points/-/format/auto/-/quality/smart/-/resize/x65/"
					}
				/>
			</div>
			{/* {user && <ProfileImageDropdown user={user} />}
			<div className="flex gap-2 px-4 py-0 bg-white rounded-full">
				{user ? (
					<>
						<HeaderInnerLink href="/" Icon={HeartGradient} />
						<HeaderInnerLink href="/homies" Icon={PeaceGradient} />
					</>
				) : (
					<>
						<HeaderInnerLink href="/" Icon={HomeIcon} />
						<HeaderInnerLink href="/login" Icon={ArrowLeftOnRectangleIcon} />
					</>
				)}
			</div>
			{user && <MessagesIcon />} */}
		</nav>
	);
};
