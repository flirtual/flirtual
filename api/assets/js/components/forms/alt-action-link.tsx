import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import React from "react";
import { Link, LinkProps } from "react-router-dom";
import { twMerge } from "tailwind-merge";

export const FormAlternativeActionLink: React.FC<LinkProps> = ({ children, ...props }) => (
	<Link
		{...props}
		className={twMerge("font-nunito flex items-center gap-2 text-lg", props.className)}
	>
		<ArrowLongRightIcon className="inline w-6" />
		{children}
	</Link>
);
