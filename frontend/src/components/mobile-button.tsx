import React from "react";
import Link, { LinkProps } from "next/link";

import { IconComponent } from "./icons";

export type MobileButtonProps = LinkProps & {
	label: string;
	Icon: IconComponent;
};

export const MobileButton: React.FC<MobileButtonProps> = ({ Icon, label, ...props }) => {
	return (
		<Link
			{...props}
			className="flex w-56 items-center gap-4 rounded-xl bg-black px-6 py-4"
			target="_blank"
		>
			<Icon className="h-8" />
			<div className="flex flex-col justify-center text-left">
				<span className="font-montserrat text-xs uppercase">Download on</span>
				<span className="font-nunito">{label}</span>
			</div>
		</Link>
	);
};
