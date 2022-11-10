"use client";

import {
	ArrowLeftOnRectangleIcon,
	HeartIcon,
	HomeIcon,
	EnvelopeIcon
} from "@heroicons/react/24/solid";
import React from "react";
import Link, { LinkProps } from "next/link";
import { twMerge } from "tailwind-merge";

import { useCurrentUser } from "~/hooks/use-current-user";

import { IconComponent } from "../icons";

type HeaderLinkProps = Omit<React.ComponentProps<"a">, "ref"> & LinkProps & { Icon: IconComponent };

const HeaderInnerLink: React.FC<HeaderLinkProps> = ({ Icon, ...props }) => (
	<Link {...props} className={twMerge("group focus:outline-none", props.className)}>
		<Icon className="text-brand-pink hover:bg-brand-gradient group-focus:bg-brand-gradient w-16 p-2 rounded-full hover:text-white group-focus:text-white" />
	</Link>
);

export const Header: React.FC = () => {
	const { data: user } = useCurrentUser();

	return (
		<header className="bg-brand-gradient shadow-brand-1  font-nunito items-center gap-6 flex justify-center w-full px-8 py-4 md:px-16">
			{user && (
				<img
					className="rounded-full w-16 aspect-square h-fit"
					src="https://media.flirtu.al/b8a05ec5-7aea-4e33-bb2b-46301eaddd9a/-/scale_crop/64x64/smart_faces_points/-/format/auto/-/quality/smart/-/resize/x65/"
				/>
			)}
			<div className="flex gap-2 px-4 py-2 bg-white rounded-full">
				{user ? (
					<>
						<HeaderInnerLink href="/" Icon={HeartIcon} />
						<HeaderInnerLink href="/homies" Icon={HeartIcon} />
					</>
				) : (
					<>
						<HeaderInnerLink href="/" Icon={HomeIcon} />
						<HeaderInnerLink href="/login" Icon={ArrowLeftOnRectangleIcon} />
					</>
				)}
			</div>
			{user && <EnvelopeIcon className="rounded-full w-16 text-white" />}
		</header>
	);
};
