import { ArrowLeftOnRectangleIcon, HomeIcon } from "@heroicons/react/24/solid";
import React from "react";
import Link, { LinkProps } from "next/link";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "../icons";

type HeaderLinkProps = Omit<React.ComponentProps<"a">, "ref"> & LinkProps & { Icon: IconComponent };

const HeaderLink: React.FC<HeaderLinkProps> = ({ Icon, ...props }) => (
	<Link {...props} className={twMerge("group focus:outline-none", props.className)}>
		<Icon className="text-brand-pink hover:bg-brand-gradient group-focus:bg-brand-gradient w-16 p-2 rounded-full hover:text-white group-focus:text-white" />
	</Link>
);

export const Header: React.FC = () => (
	<header className="font-nunito bg-brand-gradient rounded-b-half shadow-brand-1 flex justify-center w-full px-8 py-4 md:px-16">
		<div className="flex gap-4 px-4 py-2 bg-white rounded-full">
			<HeaderLink href="/" Icon={HomeIcon} />
			<HeaderLink href="/login" Icon={ArrowLeftOnRectangleIcon} />
		</div>
	</header>
);
